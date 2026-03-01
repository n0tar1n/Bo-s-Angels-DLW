import type { TrendLabel } from '../types'

interface TrendPillProps {
  trend: TrendLabel
}

const trendClass: Record<TrendLabel, string> = {
  improving: 'border-emerald-300/35 bg-emerald-300/15 text-emerald-100',
  stagnating: 'border-amber-300/35 bg-amber-300/15 text-amber-100',
  regressing: 'border-rose-300/35 bg-rose-300/15 text-rose-100',
  unknown: 'border-slate-300/30 bg-slate-300/10 text-slate-100',
}

const TrendPill = ({ trend }: TrendPillProps) => {
  const label = trend === 'unknown' ? 'unknown' : trend
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${trendClass[trend]}`}>{label}</span>
}

export default TrendPill
