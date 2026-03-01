import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoonStar } from 'lucide-react'
import AddCourseModal from '../components/AddCourseModal'
import SunCourseSystem from '../components/SunCourseSystem'
import { useAppStore } from '../lib/appStore'

const LandingPage = () => {
  const { courses, addCourse, nowIso } = useAppStore()
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [manualReduceMotion, setManualReduceMotion] = useState<boolean | null>(null)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const reduceMotion = manualReduceMotion ?? prefersReducedMotion

  const handleCreate = async (payload: { name: string; syllabus: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 550))
    const created = addCourse(payload)
    navigate(`/course/${created.id}`)
  }

  const systems = useMemo(() => [...courses].sort((a, b) => a.name.localeCompare(b.name)), [courses])

  const openCourse = (courseId: string) => {
    navigate(`/course/${courseId}`)
  }

  const openConcept = (courseId: string, conceptId: string) => {
    navigate(`/course/${courseId}?conceptId=${encodeURIComponent(conceptId)}`)
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <header className="rounded-3xl border border-white/10 bg-[#121a2a]/88 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Constellation Coach</p>
              <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Galaxy of Courses</h1>
              <p className="mt-1 text-sm text-slate-300">Courses are suns and subtopics are orbiting stars. Hover stars for names, click to drill in.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

        {systems.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center text-slate-200">
            <p className="text-lg font-medium">No courses yet</p>
            <p className="mt-2 text-sm text-slate-400">Create your first course and auto-generate a concept constellation map.</p>
          </section>
        ) : (
          <section className="constellation-bg rounded-3xl border border-white/10 p-5 md:p-8">
            <div className="grid gap-12 md:grid-cols-2 2xl:grid-cols-3">
              {systems.map((course) => (
                <SunCourseSystem
                  key={course.id}
                  course={course}
                  nowIso={nowIso}
                  motionEnabled={!reduceMotion}
                  mode="preview"
                  onOpenCourse={openCourse}
                  onOpenConcept={openConcept}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {showAddModal && <AddCourseModal onClose={() => setShowAddModal(false)} onCreate={handleCreate} />}
    </main>
  )
}

export default LandingPage
