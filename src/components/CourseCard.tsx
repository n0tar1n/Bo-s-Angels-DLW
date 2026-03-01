import { Link } from 'react-router-dom'
import type { Course } from '../types'
import { formatShortDate } from '../lib/date'
import { computeCourseStats } from '../lib/mastery'

interface CourseCardProps {
  course: Course
  nowIso: string
}

const CourseCard = ({ course, nowIso }: CourseCardProps) => {
  const stats = computeCourseStats(course, nowIso)

  return (
    <Link
      to={`/course/${course.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200/15 bg-[#131a27]/95 transition hover:-translate-y-0.5 hover:border-cyan-200/35"
    >
      <div className="h-32 bg-[linear-gradient(120deg,#1d4ed8,#3b82f6_48%,#38bdf8)] p-4">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-cyan-100/90">Course</p>
        <h3 className="mt-2 line-clamp-2 text-xl font-semibold text-white">{course.name}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Overall mastery</p>
          <p className="mt-1 text-lg font-semibold text-white">{Math.round(stats.overallMastery * 100)}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Needs work</p>
          <p className="mt-1 text-lg font-semibold text-amber-100">{stats.nodesNeedingWork}</p>
        </div>
      </div>

      <div className="px-4 pb-4 text-sm text-slate-300">
        <p>
          <span className="text-slate-400">Last active:</span> {formatShortDate(stats.lastActiveAt)}
        </p>
        <p className="mt-1">
          <span className="text-slate-400">Tracked concepts:</span> {course.conceptNodes.length}
        </p>
      </div>

      <div className="border-t border-white/10 px-4 py-3 text-sm font-medium text-cyan-100 transition group-hover:text-cyan-50">
        Enter constellation studio {'->'}
      </div>
    </Link>
  )
}

export default CourseCard
