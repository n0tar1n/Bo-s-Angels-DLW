import { Star } from 'lucide-react'

interface StarSubtopicProps {
  conceptId: string
  title: string
  glowColor: string
  dimmed: boolean
  angleDeg: number
  radius: number
  onSelect: (conceptId: string) => void
}

const StarSubtopic = ({ conceptId, title, glowColor, dimmed, angleDeg, radius, onSelect }: StarSubtopicProps) => {
  return (
    <button
      type="button"
      aria-label={title}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(conceptId)
      }}
      className="group pointer-events-auto absolute left-1/2 top-1/2"
      style={{ transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translateX(${radius}px) rotate(-${angleDeg}deg)` }}
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
        style={{
          boxShadow: `0 0 14px ${glowColor}${dimmed ? '40' : '88'}`,
          opacity: dimmed ? 0.62 : 0.92,
        }}
      >
        <Star size={14} strokeWidth={1.8} style={{ color: glowColor, fill: glowColor }} />
      </span>

      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-44 -translate-x-1/2 rounded-md border border-white/15 bg-[#09122a]/95 px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100">
        {title}
      </span>
    </button>
  )
}

export default StarSubtopic
