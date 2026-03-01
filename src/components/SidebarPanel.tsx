import type { ConceptNode, TrendLabel } from '../types'
import { formatShortDate, relativeDaysText } from '../lib/date'
import { getTrendColor, masteryTierLabel } from '../lib/mastery'
import TrendPill from './TrendPill'
import { Star } from 'lucide-react'

interface WarmupRow {
  conceptId: string
  title: string
  trend: TrendLabel
}

interface SidebarPanelProps {
  concept: (ConceptNode & { effectiveMastery: number | null; rustLevel: number; isDecaying: boolean }) | null
  nowIso: string
  trend: TrendLabel
  warmupRows?: WarmupRow[]
  onPickWarmupConcept?: (conceptId: string) => void
  onExplain: () => void
  onFullQuiz: () => void
  onQuickCheck: () => void
  onWatchRecap: () => void
}

const SidebarPanel = ({
  concept,
  nowIso,
  trend,
  warmupRows = [],
  onPickWarmupConcept,
  onExplain,
  onFullQuiz,
  onQuickCheck,
  onWatchRecap,
}: SidebarPanelProps) => {
  if (!concept) {
    return (
      <aside className="rounded-2xl border border-white/10 bg-[#131b2a]/88 p-5 text-sm text-slate-300">
        Select a concept node to inspect mastery and practice options.
      </aside>
    )
  }

  const attempted = concept.firstExplainedAt !== null

  return (
    <aside className="space-y-4 rounded-2xl border border-white/10 bg-[#131b2a]/88 p-5 text-slate-100">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/75">Selected Body</p>
        <h3 className="mt-1 text-xl font-semibold text-white">{concept.title}</h3>
        <p className="mt-2 text-sm text-slate-300">{concept.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
          <p className="text-xs text-slate-400">Mastery</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {concept.effectiveMastery === null ? 'Not attempted' : `${Math.round(concept.effectiveMastery * 100)}%`}
          </p>
          <p className="text-xs text-slate-300">{masteryTierLabel(concept.effectiveMastery)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
          <p className="text-xs text-slate-400">Trend</p>
          <div className="mt-2">
            <TrendPill trend={trend} />
          </div>
          <p className="mt-2 text-xs text-slate-300">{relativeDaysText(concept.lastPracticedAt, nowIso)}</p>
        </div>
      </div>

      {concept.isDecaying && (
        <div className="rounded-xl border border-amber-300/30 bg-amber-100/10 p-3 text-xs text-amber-100">
          Rust is increasing: this concept has not been practiced for over 7 days.
        </div>
      )}

      {warmupRows.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Warm-up Table</p>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/45">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-950/35 text-slate-300">
                <tr>
                  <th className="px-3 py-2 font-medium">Subtopic</th>
                  <th className="px-3 py-2 font-medium text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {warmupRows.map((row) => (
                  <tr key={row.conceptId} className="border-b border-white/6 last:border-b-0">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onPickWarmupConcept?.(row.conceptId)}
                        className="inline-flex items-center gap-2 text-left text-slate-100 hover:text-cyan-100"
                      >
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border bg-slate-900/75 ${getTrendColor(row.trend)}`}
                        >
                          <Star size={10} strokeWidth={2} className="text-slate-100" />
                        </span>
                        <span className="max-w-[170px] truncate">{row.title}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <TrendPill trend={row.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={onExplain}
          className="w-full rounded-xl border border-cyan-300/45 bg-cyan-300/18 px-3 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/28"
        >
          Explain to AI
        </button>
        <button
          type="button"
          onClick={onFullQuiz}
          disabled={!attempted}
          className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Take MCQ Quiz
        </button>
        <button
          type="button"
          onClick={onQuickCheck}
          disabled={!attempted}
          className="w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Quick Check (3 Qs)
        </button>
        <button
          type="button"
          onClick={onWatchRecap}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/12"
        >
          Watch Recap
        </button>
      </div>

      {!attempted && (
        <p className="text-xs text-amber-100">First attempt rule: explain this concept to the AI before taking quizzes.</p>
      )}

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Timeline</p>
        {concept.attempts.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-slate-900/45 p-3 text-sm text-slate-300">No attempts yet.</p>
        ) : (
          <ul className="space-y-2">
            {concept.attempts
              .slice(-5)
              .reverse()
              .map((attempt) => (
                <li key={attempt.id} className="rounded-xl border border-white/10 bg-slate-900/45 p-3 text-xs">
                  <p className="font-medium uppercase tracking-wide text-cyan-100">{attempt.action.replace('_', ' ')}</p>
                  <p className="mt-1 text-slate-300">{formatShortDate(attempt.timestamp)}</p>
                  {typeof attempt.score === 'number' && (
                    <p className="mt-1 text-slate-200">Score: {attempt.score}%</p>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default SidebarPanel
