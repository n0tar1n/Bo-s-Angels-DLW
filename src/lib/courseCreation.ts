import type { ExtractedCourseGraph } from '../types'

export interface CreateCourseApiSuccess {
  ok: true
  graph: ExtractedCourseGraph
  sourceFileIds: string[]
}

export interface CreateCourseApiFailure {
  ok: false
  message: string
}

export type CreateCourseApiResponse = CreateCourseApiSuccess | CreateCourseApiFailure

export const ACCEPTED_EXTENSIONS = ['pdf', 'ppt', 'pptx', 'docx', 'txt', 'md']
export const MAX_FILE_COUNT = 8
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

export const validateSelectedFiles = (files: File[]) => {
  if (files.length > MAX_FILE_COUNT) {
    return `You can upload up to ${MAX_FILE_COUNT} files.`
  }

  for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return `Unsupported file type for ${file.name}.`
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `${file.name} exceeds ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB limit.`
    }
  }

  return null
}

export const createCourseFromMaterials = async (payload: {
  title: string
  syllabusText?: string
  files: File[]
}): Promise<CreateCourseApiResponse> => {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('syllabusText', payload.syllabusText ?? '')
  payload.files.forEach((file) => formData.append('files', file))

  const response = await fetch('/api/courses/create', {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as CreateCourseApiResponse
  if (!response.ok) {
    if (data && typeof data === 'object' && 'message' in data) {
      return data
    }
    return { ok: false, message: 'Unable to extract concepts from materials.' }
  }

  return data
}
