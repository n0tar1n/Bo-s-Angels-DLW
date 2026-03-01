import { useEffect, useMemo, useRef, useState } from 'react'
import { MoonStar } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AddCourseModal from '../components/AddCourseModal'
import ConstellationGraph from '../components/ConstellationGraph'
import ExplainModal from '../components/ExplainModal'
import QuizModal from '../components/QuizModal'
import SidebarPanel from '../components/SidebarPanel'
import SunCourseSystem from '../components/SunCourseSystem'
import { useAppStore } from '../lib/appStore'
import { computeConceptTrend, getMasterySnapshot } from '../lib/mastery'
import { mockAiService } from '../lib/mockAi'
import { pickWarmupConceptId } from '../lib/mockGraph'
import NotFoundPage from './NotFoundPage'
import type { EvaluationResult, QuizQuestion } from '../types'

interface PositionedCourse {
  courseId: string
  x: number
  y: number
}

const COURSE_ROUTE_PATTERN = /^\/course\/([^/]+)$/

type CourseTab = 'overview' | 'map'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const GalaxyPage = () => {
  const { courses, nowIso, addCourse, applyEvaluation, applyQuizResult, applyRecapAction } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [showAddModal, setShowAddModal] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [manualReduceMotion, setManualReduceMotion] = useState<boolean | null>(null)
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

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = useState({ width: 1200, height: 760 })

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!viewportRef.current) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      setViewport({ width: rect.width, height: rect.height })
    })

    observer.observe(viewportRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!bannerMessage) return
    const timer = window.setTimeout(() => setBannerMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [bannerMessage])

  const reduceMotion = manualReduceMotion ?? prefersReducedMotion

  const routeMatch = location.pathname.match(COURSE_ROUTE_PATTERN)
  const selectedCourseIdFromPath = routeMatch ? decodeURIComponent(routeMatch[1]) : null
  const isKnownPath = location.pathname === '/' || location.pathname === '/home' || Boolean(routeMatch)

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => a.name.localeCompare(b.name))
  }, [courses])

  const selectedCourse = selectedCourseIdFromPath
    ? sortedCourses.find((course) => course.id === selectedCourseIdFromPath) ?? null
    : null

  const inCourse = Boolean(selectedCourse)

  const conceptFromQuery = searchParams.get('conceptId')
  const tabFromQuery = searchParams.get('tab')

  const activeCourseTab: CourseTab =
    inCourse && (tabFromQuery === 'overview' || tabFromQuery === 'map')
      ? tabFromQuery
      : 'map'

  const decoratedConcepts = useMemo(() => {
    if (!selectedCourse) return []
    return selectedCourse.conceptNodes.map((concept) => {
      const snapshot = getMasterySnapshot(concept, nowIso)
      return {
        ...concept,
        ...snapshot,
      }
    })
  }, [nowIso, selectedCourse])

  const resolvedSelectedConceptId = useMemo(() => {
    if (!selectedCourse) return null

    if (selectedConceptId && selectedCourse.conceptNodes.some((concept) => concept.id === selectedConceptId)) {
      return selectedConceptId
    }

    if (conceptFromQuery && selectedCourse.conceptNodes.some((concept) => concept.id === conceptFromQuery)) {
      return conceptFromQuery
    }

    return null
  }, [conceptFromQuery, selectedConceptId, selectedCourse])

  const selectedConcept = decoratedConcepts.find((concept) => concept.id === resolvedSelectedConceptId) ?? null
  const selectedTrend = selectedConcept ? computeConceptTrend(selectedConcept) : 'stagnating'

  const cols = viewport.width < 900 ? 1 : viewport.width < 1500 ? 2 : 3
  const gapX = 620
  const gapY = 500
  const marginX = 300
  const marginY = 260

  const positionedCourses = useMemo<PositionedCourse[]>(() => {
    return sortedCourses.map((course, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      return {
        courseId: course.id,
        x: marginX + col * gapX,
        y: marginY + row * gapY,
      }
    })
  }, [cols, sortedCourses])

  const rows = Math.max(1, Math.ceil(sortedCourses.length / cols))
  const canvasWidth = marginX * 2 + Math.max(0, cols - 1) * gapX
  const canvasHeight = marginY * 2 + Math.max(0, rows - 1) * gapY

  const selectedPosition = selectedCourse
    ? positionedCourses.find((course) => course.courseId === selectedCourse.id) ?? null
    : null

  const baseScale = clamp(Math.min((viewport.width - 36) / canvasWidth, (viewport.height - 36) / canvasHeight), 0.42, 1)

  const camera = useMemo(() => {
    if (selectedPosition && inCourse) {
      const scale = clamp(baseScale * 2.15, 1.2, 2.45)
      const tx = viewport.width / 2 - selectedPosition.x * scale
      const ty = viewport.height / 2 - selectedPosition.y * scale
      return { scale, tx, ty }
    }

    const tx = (viewport.width - canvasWidth * baseScale) / 2
    const ty = (viewport.height - canvasHeight * baseScale) / 2
    return { scale: baseScale, tx, ty }
  }, [baseScale, canvasHeight, canvasWidth, inCourse, selectedPosition, viewport.height, viewport.width])

  const setCourseTab = (tab: CourseTab) => {
    if (!selectedCourse) return
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next)
  }

  const setConceptAndSync = (courseId: string, conceptId: string) => {
    setSelectedConceptId(conceptId)
    const next = new URLSearchParams(searchParams)
    next.set('conceptId', conceptId)
    setSearchParams(next)

    if (!selectedCourse || selectedCourse.id !== courseId) {
      navigate(`/course/${courseId}?tab=map&conceptId=${encodeURIComponent(conceptId)}`)
    }
  }

  const enterCourseFromSun = (courseId: string) => {
    navigate(`/course/${courseId}?tab=map`)
  }

  const enterCourseFromStar = (courseId: string, conceptId: string) => {
    navigate(`/course/${courseId}?tab=map&conceptId=${encodeURIComponent(conceptId)}`)
  }

  const handleBackToGalaxy = () => {
    setSelectedConceptId(null)
    navigate('/')
  }

  const handleCreateCourse = async (payload: { name: string; syllabus: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 550))
    const created = addCourse(payload)
    navigate(`/course/${created.id}?tab=map`)
  }

  const runQuizGeneration = async (mode: 'full' | 'quick', weakAreas?: string[]) => {
    if (!selectedCourse || !selectedConcept) {
      setBannerMessage('Select a concept star first.')
      return
    }

    if (!selectedConcept.firstExplainedAt) {
      setBannerMessage('Explain this concept to AI before taking quizzes.')
      return
    }

    setQuizState({ open: true, mode, loading: true, questions: [] })

    const questions = await mockAiService.generateQuiz({
      courseName: selectedCourse.name,
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
    if (!selectedCourse) return

    const warmupId = pickWarmupConceptId(selectedCourse, nowIso)
    setConceptAndSync(selectedCourse.id, warmupId)

    const concept = selectedCourse.conceptNodes.find((item) => item.id === warmupId)
    if (!concept) return

    if (!concept.firstExplainedAt) {
      setBannerMessage('Warm-up picked an unseen concept. Start with Explain to AI.')
      setShowExplainModal(true)
      return
    }

    await runQuizGeneration('quick', ['weak prerequisite linkage', 'core definition'])
  }

  if (location.pathname === '/home') {
    return <Navigate to="/" replace />
  }

  if (!isKnownPath) {
    return <NotFoundPage />
  }

  if (selectedCourseIdFromPath && !selectedCourse) {
    return <NotFoundPage />
  }

  const showMapCanvas = !inCourse || activeCourseTab === 'map'

  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-[1900px] space-y-4">
        <header className="rounded-3xl border border-white/10 bg-[#121a2a]/88 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Constellation Coach</p>
              <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
                {inCourse ? selectedCourse?.name : 'Galaxy of Courses'}
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                {inCourse
                  ? 'Course context tabs: Overview (prerequisite graph) and Map (solar-system view).'
                  : 'Click a sun or orbiting star to smoothly zoom into that course.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {inCourse && (
                <div className="flex rounded-full border border-white/20 bg-white/6 p-1">
                  <button
                    type="button"
                    onClick={() => setCourseTab('overview')}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${activeCourseTab === 'overview' ? 'bg-cyan-300/25 text-cyan-50' : 'text-slate-200 hover:bg-white/10'}`}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseTab('map')}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${activeCourseTab === 'map' ? 'bg-cyan-300/25 text-cyan-50' : 'text-slate-200 hover:bg-white/10'}`}
                  >
                    Map
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setManualReduceMotion((current) => !(current ?? prefersReducedMotion))}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${reduceMotion ? 'border-indigo-300/45 bg-indigo-300/20 text-indigo-50' : 'border-white/20 bg-white/8 text-slate-100 hover:bg-white/15'}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <MoonStar size={15} /> Reduce motion: {reduceMotion ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-full border border-cyan-300/45 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/25"
              >
                Add Course
              </button>
            </div>
          </div>
        </header>

        {bannerMessage && (
          <div className="rounded-xl border border-amber-300/30 bg-amber-200/10 px-4 py-2 text-sm text-amber-100">{bannerMessage}</div>
        )}

        {sortedCourses.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center text-slate-200">
            <p className="text-lg font-medium">No courses yet</p>
            <p className="mt-2 text-sm text-slate-400">Create your first course and auto-generate a concept constellation map.</p>
          </section>
        ) : (
          <section className={inCourse ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]' : ''}>
            {showMapCanvas ? (
              <div
                ref={viewportRef}
                className="constellation-bg relative h-[78vh] min-h-[580px] overflow-hidden rounded-3xl border border-white/10 shadow-[inset_0_0_180px_rgba(8,47,73,0.35)]"
              >
                <div className="galaxy-swirl" aria-hidden />

                {inCourse && (
                  <div className="absolute left-4 top-4 z-40 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBackToGalaxy}
                      className="rounded-full border border-white/20 bg-slate-950/65 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-900/75"
                    >
                      Back to Galaxy
                    </button>
                    <button
                      type="button"
                      onClick={handleWarmup}
                      className="rounded-full border border-emerald-300/35 bg-emerald-300/16 px-3 py-1.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-300/24"
                    >
                      Warm-up
                    </button>
                  </div>
                )}

                <div
                  className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: `translate(${camera.tx}px, ${camera.ty}px) scale(${camera.scale})`, transformOrigin: '0 0' }}
                >
                  <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
                    {positionedCourses.map((item) => {
                      const course = sortedCourses.find((entry) => entry.id === item.courseId)
                      if (!course) return null

                      const focused = selectedCourse?.id === course.id

                      return (
                        <div
                          key={course.id}
                          className="absolute"
                          style={{ left: item.x, top: item.y, transform: 'translate(-50%, -50%)' }}
                        >
                          <SunCourseSystem
                            course={course}
                            nowIso={nowIso}
                            motionEnabled={!reduceMotion && !focused}
                            mode={focused ? 'focused' : 'preview'}
                            deEmphasized={Boolean(inCourse && !focused)}
                            selectedConceptId={focused ? resolvedSelectedConceptId : null}
                            onOpenCourse={(courseId) => {
                              if (inCourse && selectedCourse?.id === courseId) {
                                setCourseTab('map')
                                return
                              }
                              enterCourseFromSun(courseId)
                            }}
                            onOpenConcept={(courseId, conceptId) => {
                              if (!inCourse || selectedCourse?.id !== courseId) {
                                enterCourseFromStar(courseId, conceptId)
                                return
                              }
                              setConceptAndSync(courseId, conceptId)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="constellation-bg relative h-[78vh] min-h-[580px] overflow-hidden rounded-3xl border border-white/10 shadow-[inset_0_0_180px_rgba(8,47,73,0.35)]">
                <div className="galaxy-swirl" aria-hidden />
                {inCourse && (
                  <div className="absolute left-4 top-4 z-30 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBackToGalaxy}
                      className="rounded-full border border-white/20 bg-slate-950/65 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-900/75"
                    >
                      Back to Galaxy
                    </button>
                    <button
                      type="button"
                      onClick={handleWarmup}
                      className="rounded-full border border-emerald-300/35 bg-emerald-300/16 px-3 py-1.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-300/24"
                    >
                      Warm-up
                    </button>
                  </div>
                )}
                <div className="relative z-10 h-full p-3">
                  {selectedCourse && (
                    <ConstellationGraph
                      courseId={selectedCourse.id}
                      concepts={decoratedConcepts}
                      edges={selectedCourse.conceptEdges}
                      selectedConceptId={resolvedSelectedConceptId}
                      onSelectConcept={(conceptId) => setConceptAndSync(selectedCourse.id, conceptId)}
                    />
                  )}
                </div>
              </div>
            )}

            {inCourse && selectedCourse && (
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
                  applyRecapAction(selectedCourse.id, selectedConcept.id)
                  setBannerMessage('Recap completed. Mastery nudged upward.')
                  window.open('https://example.com/recap-video', '_blank', 'noopener,noreferrer')
                }}
              />
            )}
          </section>
        )}
      </div>

      {showAddModal && <AddCourseModal onClose={() => setShowAddModal(false)} onCreate={handleCreateCourse} />}

      {showExplainModal && selectedCourse && selectedConcept && (
        <ExplainModal
          courseName={selectedCourse.name}
          conceptTitle={selectedConcept.title}
          onClose={() => setShowExplainModal(false)}
          onEvaluation={(evaluation) => applyEvaluation(selectedCourse.id, selectedConcept.id, evaluation)}
          onGenerateQuiz={handleGenerateFromEvaluation}
        />
      )}

      {quizState.open && selectedCourse && selectedConcept && (
        <QuizModal
          courseName={selectedCourse.name}
          conceptTitle={selectedConcept.title}
          mode={quizState.mode}
          loading={quizState.loading}
          questions={quizState.questions}
          onClose={() => setQuizState((prev) => ({ ...prev, open: false }))}
          onComplete={(result) => applyQuizResult(selectedCourse.id, selectedConcept.id, result)}
        />
      )}
    </main>
  )
}

export default GalaxyPage
