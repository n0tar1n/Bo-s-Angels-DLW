import { useState } from 'react'
import BaseModal from './BaseModal'

interface AddCourseModalProps {
  onClose: () => void
  onCreate: (payload: { name: string; syllabus: string }) => Promise<void> | void
}

const AddCourseModal = ({ onClose, onCreate }: AddCourseModalProps) => {
  const [name, setName] = useState('')
  const [syllabus, setSyllabus] = useState('')
  const [loading, setLoading] = useState(false)

  const disabled = !name.trim() || !syllabus.trim() || loading

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled) return

    setLoading(true)
    await onCreate({ name: name.trim(), syllabus: syllabus.trim() })
    setLoading(false)
    onClose()
  }

  return (
    <BaseModal title="Add New Course" onClose={onClose}>
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
            Syllabus / Topics
          </label>
          <textarea
            id="syllabus"
            value={syllabus}
            onChange={(event) => setSyllabus(event.target.value)}
            rows={8}
            placeholder="Paste modules or topic list separated by commas or line breaks."
            className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none ring-cyan-200/50 transition placeholder:text-slate-400 focus:ring"
          />
          <p className="mt-2 text-xs text-slate-400">
            Prototype behavior: graph nodes and prerequisite edges will be auto-generated from this input.
          </p>
        </div>

        <div className="flex justify-end gap-2">
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
            {loading ? 'Generating graph...' : 'Create Course'}
          </button>
        </div>
      </form>
    </BaseModal>
  )
}

export default AddCourseModal
