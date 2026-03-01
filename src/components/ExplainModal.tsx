import { useState } from 'react'
import type { EvaluationResult } from '../types'
import { mockAiService } from '../lib/mockAi'
import BaseModal from './BaseModal'
import ProgressBar from './ProgressBar'

interface ExplainModalProps {
  courseName: string
  conceptTitle: string
  onClose: () => void
  onEvaluation: (result: EvaluationResult) => void
  onGenerateQuiz: (result: EvaluationResult) => void
}

const ExplainModal = ({ courseName, conceptTitle, onClose, onEvaluation, onGenerateQuiz }: ExplainModalProps) => {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EvaluationResult | null>(null)

  const handleEvaluate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!text.trim() || loading) return

    setLoading(true)
    const output = await mockAiService.evaluateExplanation({
      courseName,
      conceptTitle,
      explanationText: text,
    })
    setLoading(false)
    setResult(output)
    onEvaluation(output)
  }

  return (
    <BaseModal title={`Explain ${conceptTitle} to AI`} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleEvaluate}>
        <label htmlFor="explanation" className="block text-sm text-slate-200">
          Explain <span className="font-semibold text-cyan-100">{conceptTitle}</span> as if teaching a friend (60-120s).
        </label>
        <textarea
          id="explanation"
          rows={8}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Start with the intuition, then walk through a concrete example and one common mistake..."
          className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none ring-cyan-200/45 transition placeholder:text-slate-400 focus:ring"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="rounded-xl border border-cyan-300/40 bg-cyan-300/20 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Evaluating...' : 'Run AI Evaluation'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm text-slate-100">
              <p>Overall Alignment</p>
              <p className="font-semibold">{result.alignmentScore}/100</p>
            </div>
            <ProgressBar value={result.alignmentScore} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="mb-1 text-xs text-slate-400">Coverage</p>
              <ProgressBar value={result.coverage} colorClass="from-emerald-300 to-teal-400" />
              <p className="mt-1 text-sm text-slate-100">{result.coverage}%</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-400">Correctness</p>
              <ProgressBar value={result.correctness} colorClass="from-cyan-300 to-sky-400" />
              <p className="mt-1 text-sm text-slate-100">{result.correctness}%</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-400">Coherence</p>
              <ProgressBar value={result.coherence} colorClass="from-violet-300 to-indigo-400" />
              <p className="mt-1 text-sm text-slate-100">{result.coherence}%</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-medium text-rose-100">Missing points</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                {result.missingPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-amber-100">Misconceptions</p>
              {result.misconceptionsDetected.length === 0 ? (
                <p className="text-sm text-emerald-100">No major misconceptions detected.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
                  {result.misconceptionsDetected.map((misconception) => (
                    <li key={misconception}>{misconception}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-cyan-100">Recommended follow-ups</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
              {result.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onGenerateQuiz(result)}
              className="rounded-xl border border-emerald-300/40 bg-emerald-300/20 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/30"
            >
              Generate MCQ Quiz
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  )
}

export default ExplainModal
