import BaseModal from './BaseModal'

interface RemoveCourseModalProps {
  courseTitle: string
  onCancel: () => void
  onConfirm: () => void
}

const RemoveCourseModal = ({ courseTitle, onCancel, onConfirm }: RemoveCourseModalProps) => {
  return (
    <BaseModal title="Remove Course" onClose={onCancel} maxWidthClass="max-w-lg" showHeaderClose={false}>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-100">Remove course "{courseTitle}"?</p>
          <p className="text-sm text-slate-300">This will delete the course and its saved progress from this device.</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-rose-300/35 bg-rose-400/20 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/28"
          >
            Remove
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

export default RemoveCourseModal
