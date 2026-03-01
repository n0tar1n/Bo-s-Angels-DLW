import { useMemo, useState } from 'react'
import type { QuizQuestion, QuizSessionResult } from '../types'

interface QuizModalProps {
  courseName: string
  conceptTitle: string
  mode: 'full' | 'quick'
  loading: boolean
  questions: QuizQuestion[]
  onClose: () => void
  onComplete: (result: QuizSessionResult) => void
}

const QuizModal = ({
  courseName,
  conceptTitle,
  mode,
  loading,
  questions,
  onClose,
  onComplete,
}: QuizModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const currentQuestion = questions[currentIndex]
  const selected = currentQuestion ? answers[currentQuestion.id] : undefined

  const score = useMemo(() => {
    return questions.reduce((sum, question) => {
      const answer = answers[question.id]
      return sum + (answer === question.correctIndex ? 1 : 0)
    }, 0)
  }, [answers, questions])

  const allAnswered = questions.length > 0 && questions.every((question) => typeof answers[question.id] === 'number')

  const handleOptionClick = (optionIndex: number) => {
    if (!currentQuestion) return
    if (typeof answers[currentQuestion.id] === 'number') return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }))
  }

  const handleFinalize = () => {
    setSubmitted(true)
    onComplete({
      score,
      total: questions.length,
      mode,
      answeredAt: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#171d29]/96 p-3 sm:p-6">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col rounded-3xl border border-white/10 bg-[#1b2230]/95">
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-3xl font-semibold text-white">{mode === 'full' ? 'Data Quiz' : 'Quick Check'}</p>
            <p className="mt-1 text-sm text-slate-300">{courseName}</p>
            <p className="mt-0.5 text-sm text-slate-400">Concept: {conceptTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-lg text-slate-100 hover:bg-white/12"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading && <p className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-slate-100">Generating quiz questions...</p>}

          {!loading && questions.length > 0 && !submitted && currentQuestion && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#20293a]/95 p-5">
                <p className="text-sm font-medium text-slate-300">
                  {currentIndex + 1} / {questions.length}
                </p>
                <p className="mt-4 text-3xl font-semibold leading-snug text-white">{currentQuestion.prompt}</p>

                <div className="mt-6 space-y-3">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isSelected = selected === optionIndex
                    const isCorrect = currentQuestion.correctIndex === optionIndex
                    const isAnswered = typeof selected === 'number'

                    let style = 'border-white/10 bg-[#141b28] text-slate-100 hover:bg-[#1b2538]'
                    if (isAnswered && isSelected && isCorrect) style = 'border-emerald-300/45 bg-emerald-200/18 text-emerald-50'
                    if (isAnswered && isSelected && !isCorrect) style = 'border-rose-300/45 bg-rose-200/18 text-rose-50'
                    if (isAnswered && !isSelected && isCorrect) style = 'border-emerald-300/35 bg-emerald-200/10 text-emerald-100'

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionClick(optionIndex)}
                        disabled={isAnswered}
                        className={`w-full rounded-2xl border px-4 py-4 text-left text-2xl transition sm:text-xl ${style} disabled:cursor-not-allowed`}
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </button>
                    )
                  })}
                </div>

                {typeof selected === 'number' && (
                  <div className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-300/10 p-3 text-sm text-cyan-50">
                    <p className="font-semibold">Explanation</p>
                    <p className="mt-1">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && submitted && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#20293a]/95 p-5 text-slate-100">
              <p className="text-4xl font-semibold text-white">Quiz Complete</p>
              <p className="text-lg">
                Score: <span className="font-semibold text-emerald-200">{score}</span> / {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </p>
              <p className="text-sm text-slate-300">Mastery has been updated for {conceptTitle}.</p>
            </div>
          )}
        </div>

        {!loading && !submitted && questions.length > 0 && (
          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                disabled={typeof selected !== 'number'}
                className="rounded-full border border-indigo-300/40 bg-indigo-300/25 px-5 py-2 text-sm font-semibold text-indigo-50 transition hover:bg-indigo-300/35 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalize}
                disabled={!allAnswered}
                className="rounded-full border border-emerald-300/40 bg-emerald-300/20 px-5 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Finish Quiz
              </button>
            )}
          </div>
        )}

        {!loading && submitted && (
          <div className="flex justify-end border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizModal
