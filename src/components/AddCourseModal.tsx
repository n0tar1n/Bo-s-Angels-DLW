import { useMemo, useState } from 'react'
import { ACCEPTED_EXTENSIONS, validateSelectedFiles } from '../lib/courseCreation'
import BaseModal from './BaseModal'

interface AddCourseModalProps {
  onClose: () => void
  onCreate: (payload: { name: string; syllabus: string; files: File[] }) => Promise<{ warning?: string } | void>
}

const AddCourseModal = ({ onClose, onCreate }: AddCourseModalProps) => {
  const [name, setName] = useState('')
  const [syllabus, setSyllabus] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [errorText, setErrorText] = useState('')
  const [warningText, setWarningText] = useState('')

  const validationError = useMemo(() => validateSelectedFiles(files), [files])
  const contentMissing = !syllabus.trim() && files.length === 0

  const disabled = !name.trim() || loading || Boolean(validationError)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    setFiles((prev) => [...prev, ...selected])
    setErrorText('')
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled) return

    setErrorText('')
    setWarningText('')

    if (contentMissing) {
      setErrorText('Please provide syllabus text or upload at least one file.')
      return
    }

    setLoading(true)
    setStatusText(files.length > 0 ? 'Uploading materials...' : 'Preparing extraction...')

    const extractingTimer = window.setTimeout(() => {
      setStatusText('Extracting concepts...')
    }, 800)

    try {
      const result = await onCreate({
        name: name.trim(),
        syllabus: syllabus.trim(),
        files,
      })

      setStatusText('Done')
      if (result?.warning) {
        setWarningText(result.warning)
      }

      onClose()
    } catch {
      setErrorText('Unable to create course from materials. Please try again.')
      setStatusText('')
    } finally {
      window.clearTimeout(extractingTimer)
      setLoading(false)
    }
  }

  return (
    <BaseModal title="Add New Course" onClose={onClose} showHeaderClose={false}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="course-name" className="mb-1 block text-sm font-medium text-slate-100">
            Course name
          </label>
          <input
            id="course-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Intro to Reinforcement Learning"
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none ring-cyan-200/50 transition placeholder:text-slate-400 focus:ring"
          />
        </div>

        <div>
          <label htmlFor="syllabus" className="mb-1 block text-sm font-medium text-slate-100">
            Syllabus / Topics (optional)
          </label>
          <textarea
            id="syllabus"
            value={syllabus}
            onChange={(event) => setSyllabus(event.target.value)}
            rows={6}
            placeholder="Paste modules or topic list separated by commas or line breaks."
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none ring-cyan-200/50 transition placeholder:text-slate-400 focus:ring"
          />
        </div>

        <div>
          <label htmlFor="materials" className="mb-1 block text-sm font-medium text-slate-100">
            Upload materials
          </label>
          <input
            id="materials"
            type="file"
            multiple
            accept=".pdf,.ppt,.pptx,.docx,.txt,.md"
            onChange={handleFileChange}
            className="block w-full rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/20 file:px-3 file:py-1 file:text-cyan-100"
          />
          <p className="mt-2 text-xs text-slate-400">Accepted: {ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(', ')}</p>

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/45 px-3 py-2 text-xs text-slate-200">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="ml-3 rounded-md border border-white/20 px-2 py-0.5 text-[11px] hover:bg-white/10"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {validationError && <p className="text-xs text-rose-200">{validationError}</p>}
        {errorText && <p className="text-xs text-rose-200">{errorText}</p>}
        {warningText && <p className="text-xs text-amber-200">{warningText}</p>}

        {statusText && (
          <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100">{statusText}</div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-xl border border-cyan-300/40 bg-cyan-300/20 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Create Course'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}

export default AddCourseModal
