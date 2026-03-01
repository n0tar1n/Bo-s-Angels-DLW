import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ConstellationGraph from '../components/ConstellationGraph'
import ExplainModal from '../components/ExplainModal'
import QuizModal from '../components/QuizModal'
import SidebarPanel from '../components/SidebarPanel'
import { useAppStore } from '../lib/appStore'
import { computeConceptTrend, getMasterySnapshot } from '../lib/mastery'
import { mockAiService } from '../lib/mockAi'
import { pickWarmupConceptId } from '../lib/mockGraph'
import type { EvaluationResult, QuizQuestion } from '../types'

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { courses, nowIso, applyEvaluation, applyQuizResult, applyRecapAction } = useAppStore()

  const course = courses.find((item) => item.id === courseId)
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)
  const [showExplainModal, setShowExplainModal] = useState(false)
  const [quizState, setQuizState] = useState<{
    open: boolean
    mode: 'full' | 'quick'
    loading: boolean
    questions: QuizQuestion[]
  }>({
    open: false,
    mode: 'full',
    loading: false,
    questions: [],
  })
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!bannerMessage) return
    const timer = window.setTimeout(() => setBannerMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [bannerMessage])

  const decoratedConcepts = useMemo(() => {
    if (!course) return []
    return course.conceptNodes.map((concept) => {
      const snapshot = getMasterySnapshot(concept, nowIso)
      return {
        ...concept,
        ...snapshot,
      }
    })
  }, [course, nowIso])

  const deepLinkedConceptId = searchParams.get('conceptId') ?? searchParams.get('concept')

  const resolvedSelectedConceptId = useMemo(() => {
    if (!course || course.conceptNodes.length === 0) return null

    if (selectedConceptId && course.conceptNodes.some((concept) => concept.id === selectedConceptId)) {
      return selectedConceptId
    }

    if (deepLinkedConceptId && course.conceptNodes.some((concept) => concept.id === deepLinkedConceptId)) {
      return deepLinkedConceptId
    }

    return null
  }, [course, deepLinkedConceptId, selectedConceptId])

  const selectedConcept = decoratedConcepts.find((concept) => concept.id === resolvedSelectedConceptId) ?? null
  const selectedTrend = selectedConcept ? computeConceptTrend(selectedConcept) : 'stagnating'

  const setSelectedAndSync = (conceptId: string) => {
    setSelectedConceptId(conceptId)
    const next = new URLSearchParams(searchParams)
    next.set('conceptId', conceptId)
    next.delete('concept')
    setSearchParams(next)
  }

  if (!course) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center text-slate-100">
        <p className="text-xl font-semibold">Course not found</p>
        <p className="mt-2 text-sm text-slate-300">The requested course may have been removed.</p>
        <Link to="/" className="mt-4 rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
          Back to courses
        </Link>
      </main>
    )
  }

  const runQuizGeneration = async (mode: 'full' | 'quick', weakAreas?: string[]) => {
    if (!selectedConcept) {
      setBannerMessage('Select a concept star first.')
      return
    }

    if (!selectedConcept.firstExplainedAt) {
      setBannerMessage('Explain this concept to AI before taking quizzes.')
      return
    }

    setQuizState({ open: true, mode, loading: true, questions: [] })

    const questions = await mockAiService.generateQuiz({
      courseName: course.name,
      conceptTitle: selectedConcept.title,
      weakAreas: weakAreas?.length ? weakAreas : ['core definition', 'application boundary'],
      count: mode === 'full' ? 5 : 3,
    })

    setQuizState({ open: true, mode, loading: false, questions })
  }

  const handleGenerateFromEvaluation = async (evaluation: EvaluationResult) => {
    setShowExplainModal(false)
    await runQuizGeneration('full', [...evaluation.missingPoints, ...evaluation.misconceptionsDetected])
  }

  const handleWarmup = async () => {
    const warmupId = pickWarmupConceptId(course, nowIso)
    setSelectedAndSync(warmupId)
    const concept = course.conceptNodes.find((item) => item.id === warmupId)

    if (!concept) return
    if (!concept.firstExplainedAt) {
      setBannerMessage('Warm-up picked an unseen concept. Start with Explain to AI.')
      setShowExplainModal(true)
      return
    }

    await runQuizGeneration('quick', ['weak prerequisite linkage', 'core definition'])
  }

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header className="rounded-3xl border border-white/10 bg-[#151d2a]/95 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg text-slate-100 hover:bg-white/10"
                aria-label="Back"
              >
                ←
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-white sm:text-3xl">{course.name}</h1>
                <p className="text-sm text-slate-300">Constellation Map</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWarmup}
              className="rounded-full border border-emerald-300/40 bg-emerald-300/20 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/30"
            >
              Warm-up (10 min)
            </button>
          </div>
        </header>

        {bannerMessage && (
          <div className="rounded-xl border border-amber-300/30 bg-amber-200/10 px-4 py-2 text-sm text-amber-100">{bannerMessage}</div>
        )}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
          <ConstellationGraph
            courseId={course.id}
            concepts={decoratedConcepts}
            edges={course.conceptEdges}
            selectedConceptId={resolvedSelectedConceptId}
            onSelectConcept={setSelectedAndSync}
          />

          <SidebarPanel
            concept={selectedConcept}
            nowIso={nowIso}
            trend={selectedTrend}
            onExplain={() => {
              if (!selectedConcept) {
                setBannerMessage('Select a concept star first.')
                return
              }
              setShowExplainModal(true)
            }}
            onFullQuiz={() => runQuizGeneration('full')}
            onQuickCheck={() => runQuizGeneration('quick')}
            onWatchRecap={() => {
              if (!selectedConcept) {
                setBannerMessage('Select a concept star first.')
                return
              }
              applyRecapAction(course.id, selectedConcept.id)
              setBannerMessage('Recap completed. Mastery nudged upward.')
              window.open('https://example.com/recap-video', '_blank', 'noopener,noreferrer')
            }}
          />
        </section>
      </div>

      {showExplainModal && selectedConcept && (
        <ExplainModal
          courseName={course.name}
          conceptTitle={selectedConcept.title}
          onClose={() => setShowExplainModal(false)}
          onEvaluation={(evaluation) => applyEvaluation(course.id, selectedConcept.id, evaluation)}
          onGenerateQuiz={handleGenerateFromEvaluation}
        />
      )}

      {quizState.open && selectedConcept && (
        <QuizModal
          courseName={course.name}
          conceptTitle={selectedConcept.title}
          mode={quizState.mode}
          loading={quizState.loading}
          questions={quizState.questions}
          onClose={() => setQuizState((prev) => ({ ...prev, open: false }))}
          onComplete={(result) => applyQuizResult(course.id, selectedConcept.id, result)}
        />
      )}
    </main>
  )
}

export default CoursePage
