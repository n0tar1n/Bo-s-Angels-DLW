import express from 'express'
import multer from 'multer'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

const PORT = Number(process.env.PORT ?? 8787)
const MAX_FILE_COUNT = 8
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const ACCEPTED_EXTENSIONS = new Set(['pdf', 'ppt', 'pptx', 'docx', 'txt', 'md'])

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_FILE_COUNT,
    fileSize: MAX_FILE_SIZE_BYTES,
  },
})

const conceptGraphSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    module: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        assumed_level: { type: 'string', enum: ['intro', 'intermediate', 'advanced'] },
        graph_version: { type: 'string' },
      },
      required: ['name', 'assumed_level', 'graph_version'],
    },
    nodes: {
      type: 'array',
      minItems: 20,
      maxItems: 60,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          summary: { type: 'string' },
          scope: { type: 'string', enum: ['module', 'foundation'] },
          importance: { type: 'integer', minimum: 1, maximum: 5 },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['id', 'name', 'summary', 'scope', 'importance', 'tags'],
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          type: { type: 'string', enum: ['prerequisite'] },
        },
        required: ['from', 'to', 'type'],
      },
    },
    sanity_checks: {
      type: 'object',
      additionalProperties: false,
      properties: {
        is_dag_claim: { type: 'boolean' },
        notes: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['is_dag_claim', 'notes'],
    },
  },
  required: ['module', 'nodes', 'edges', 'sanity_checks'],
}

const extractTextFromResponse = (response) => {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim()
  }

  const output = Array.isArray(response.output) ? response.output : []
  const textParts = []

  output.forEach((item) => {
    const content = Array.isArray(item.content) ? item.content : []
    content.forEach((part) => {
      if (part.type === 'output_text' && typeof part.text === 'string') {
        textParts.push(part.text)
      }
    })
  })

  return textParts.join('\n').trim()
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/courses/create', upload.array('files', MAX_FILE_COUNT), async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ ok: false, message: 'OPENAI_API_KEY is not set on server.' })
    }

    const title = `${req.body?.title ?? ''}`.trim()
    const syllabusText = `${req.body?.syllabusText ?? ''}`.trim()
    const files = Array.isArray(req.files) ? req.files : []

    if (!title) {
      return res.status(400).json({ ok: false, message: 'Course title is required.' })
    }

    if (!syllabusText && files.length === 0) {
      return res.status(400).json({ ok: false, message: 'Provide syllabus text or upload at least one file.' })
    }

    for (const file of files) {
      const extension = file.originalname.split('.').pop()?.toLowerCase() ?? ''
      if (!ACCEPTED_EXTENSIONS.has(extension)) {
        return res.status(400).json({ ok: false, message: `Unsupported file type: ${file.originalname}` })
      }
    }

    const openai = new OpenAI({ apiKey })
    const uploadedFileIds = []

    for (const file of files) {
      const uploadable = await toFile(file.buffer, file.originalname, {
        type: file.mimetype || 'application/octet-stream',
      })

      const uploaded = await openai.files.create({
        file: uploadable,
        purpose: 'assistants',
      })

      uploadedFileIds.push(uploaded.id)
    }

    const dynamicMaxNodes = Math.min(40, Math.max(20, 18 + uploadedFileIds.length * 6 + Math.floor(syllabusText.length / 420)))

    const systemPrompt =
      'You are a curriculum mapper. Create a directed prerequisite concept graph for the module.\n' +
      'Rules:\n' +
      '- Nodes are concepts (not lecture titles).\n' +
      '- Edges are TRUE prerequisites (A must be understood before B).\n' +
      '- Prefer a DAG; do not create cycles.\n' +
      '- Include minimal foundation prerequisites if needed.\n' +
      '- Keep summaries short (1-2 sentences).\n' +
      '- Output must match the provided JSON schema exactly.'

    const userPrompt =
      `COURSE_TITLE: ${title}\n` +
      `OPTIONAL_TEXT: ${syllabusText || '(none provided)'}\n` +
      `CONSTRAINTS:\n- max_nodes: ${dynamicMaxNodes}\nReturn the concept graph.`

    const userContent = [
      {
        type: 'input_text',
        text: userPrompt,
      },
      ...uploadedFileIds.map((fileId) => ({
        type: 'input_file',
        file_id: fileId,
      })),
    ]

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'concept_graph',
          schema: conceptGraphSchema,
          strict: true,
        },
      },
    })

    const rawText = extractTextFromResponse(response)
    if (!rawText) {
      return res.status(502).json({ ok: false, message: 'Model returned empty extraction output.' })
    }

    let graph
    try {
      graph = JSON.parse(rawText)
    } catch {
      return res.status(502).json({ ok: false, message: 'Model output was not valid JSON.' })
    }

    return res.json({
      ok: true,
      graph,
      sourceFileIds: uploadedFileIds,
    })
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          ok: false,
          message: `A file exceeded the ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB limit.`,
        })
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          ok: false,
          message: `You can upload up to ${MAX_FILE_COUNT} files.`,
        })
      }
    }

    return res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Unexpected extraction error.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`[api] running on http://localhost:${PORT}`)
})
