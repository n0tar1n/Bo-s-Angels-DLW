import { type PropsWithChildren, useEffect } from 'react'

interface BaseModalProps {
  title: string
  onClose: () => void
  maxWidthClass?: string
  showHeaderClose?: boolean
}

const BaseModal = ({
  title,
  onClose,
  maxWidthClass = 'max-w-2xl',
  showHeaderClose = true,
  children,
}: PropsWithChildren<BaseModalProps>) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className={`w-full ${maxWidthClass} overflow-hidden rounded-2xl border border-white/10 bg-[#0a122f] shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {showHeaderClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/20 px-3 py-1 text-sm text-slate-100 transition hover:border-white/40 hover:bg-white/10"
            >
              Close
            </button>
          )}
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default BaseModal
