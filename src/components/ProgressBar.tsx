interface ProgressBarProps {
  value: number
  max?: number
  colorClass?: string
}

const ProgressBar = ({ value, max = 100, colorClass = 'from-cyan-300 to-blue-400' }: ProgressBarProps) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div className="h-2.5 w-full rounded-full bg-white/10">
      <div
        className={`h-2.5 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default ProgressBar
