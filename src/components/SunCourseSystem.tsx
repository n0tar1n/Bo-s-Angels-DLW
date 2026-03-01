import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Star, Sun } from 'lucide-react'
import { getMasterySnapshot, masteryToColor } from '../lib/mastery'
import { hashString, mulberry32, randomBetween } from '../lib/random'
import type { ConceptEdge, ConceptNode, Course } from '../types'
import OrbitRing from './OrbitRing'

interface SunCourseSystemProps {
  course: Course
  nowIso: string
  motionEnabled: boolean
  mode: 'preview' | 'focused'
  deEmphasized?: boolean
  selectedConceptId?: string | null
  onOpenCourse: (courseId: string) => void
  onOpenConcept: (courseId: string, conceptId: string) => void
}

interface OrbitConcept extends ConceptNode {
  effectiveMastery: number | null
  rustLevel: number
  isDecaying: boolean
}

interface PositionedConcept {
  concept: OrbitConcept
  x: number
  y: number
  labelPosition: 'top' | 'bottom' | 'left' | 'right'
}

const mobileQuery = '(max-width: 768px)'

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(() => window.matchMedia(mobileQuery).matches)

  useEffect(() => {
    const query = window.matchMedia(mobileQuery)
    const onChange = () => setIsMobile(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

const pickPreviewConcepts = (concepts: OrbitConcept[], limit: number) => {
  return [...concepts]
    .sort((a, b) => {
      const aScore = a.effectiveMastery ?? -1
      const bScore = b.effectiveMastery ?? -1
      if (aScore !== bScore) return aScore - bScore
      return a.title.localeCompare(b.title)
    })
    .slice(0, limit)
}

const splitIntoRings = (concepts: OrbitConcept[]) => {
  const inner = concepts.slice(0, 4)
  const middle = concepts.slice(4, 8)
  const outer = concepts.slice(8, 12)
  return { inner, middle, outer }
}

const focusedRingCapacities = [6, 8, 10, 16]
const focusedRingRadii = [92, 136, 180, 222]

const labelPositionFor = (ringIndex: number, starIndex: number): PositionedConcept['labelPosition'] => {
  const index = (ringIndex + starIndex) % 4
  if (index === 0) return 'top'
  if (index === 1) return 'bottom'
  if (index === 2) return 'left'
  return 'right'
}

const labelStyleByPosition: Record<PositionedConcept['labelPosition'], CSSProperties> = {
  top: { transform: 'translate(-50%, -125%)' },
  bottom: { transform: 'translate(-50%, 30%)' },
  left: { transform: 'translate(-112%, -50%)' },
  right: { transform: 'translate(12%, -50%)' },
}

const toRgba = (hexOrVar: string, alpha: number) => {
  if (hexOrVar.startsWith('var(')) {
    return `color-mix(in srgb, ${hexOrVar} ${Math.round(alpha * 100)}%, transparent)`
  }

  const normalized = hexOrVar.replace('#', '')
  const six = normalized.length === 3 ? normalized.split('').map((v) => `${v}${v}`).join('') : normalized
  const value = Number.parseInt(six, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const buildFocusedLayout = (courseId: string, concepts: OrbitConcept[]): PositionedConcept[] => {
  const output: PositionedConcept[] = []
  let cursor = 0

  focusedRingCapacities.forEach((capacity, ringIndex) => {
    const ringConcepts = concepts.slice(cursor, cursor + capacity)
    cursor += ringConcepts.length

    ringConcepts.forEach((concept, index) => {
      const random = mulberry32(hashString(`${courseId}-${concept.id}`))
      const count = Math.max(1, ringConcepts.length)
      const angle = (2 * Math.PI * index) / count + randomBetween(random, -0.09, 0.09)
      const radius = focusedRingRadii[ringIndex] + randomBetween(random, -5, 5)

      output.push({
        concept,
        x: 280 + Math.cos(angle) * radius,
        y: 280 + Math.sin(angle) * radius,
        labelPosition: labelPositionFor(ringIndex, index),
      })
    })
  })

  return output
}

const SunCourseSystem = ({
  course,
  nowIso,
  motionEnabled,
  mode,
  deEmphasized,
  selectedConceptId,
  onOpenCourse,
  onOpenConcept,
}: SunCourseSystemProps) => {
  const isMobile = useIsMobile()
  const [expandedMobile, setExpandedMobile] = useState(false)

  const decoratedConcepts = useMemo(() => {
    return course.conceptNodes.map((concept) => {
      const snapshot = getMasterySnapshot(concept, nowIso)
      return {
        ...concept,
        ...snapshot,
      }
    })
  }, [course.conceptNodes, nowIso])

  if (mode === 'focused') {
    const concepts = decoratedConcepts.slice(0, 40)
    const positioned = buildFocusedLayout(course.id, concepts)
    const pointById = new Map(positioned.map((item) => [item.concept.id, item]))

    const visibleEdges: ConceptEdge[] = course.conceptEdges.filter(
      (edge) => pointById.has(edge.source) && pointById.has(edge.target),
    )

    return (
      <article
        className={`relative h-[560px] w-[560px] transition ${deEmphasized ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}
        aria-label={course.name}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {visibleEdges.map((edge) => {
            const source = pointById.get(edge.source)
            const target = pointById.get(edge.target)
            if (!source || !target) return null

            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(186,230,253,0.24)"
                strokeWidth="1"
                style={{ filter: 'drop-shadow(0 0 4px rgba(125,211,252,0.22))' }}
              />
            )
          })}
        </svg>

        {focusedRingRadii.map((radius) => (
          <div
            key={`ring-${radius}`}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-cyan-100/10"
            style={{ width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
          />
        ))}

        <button
          type="button"
          onClick={() => onOpenCourse(course.id)}
          className="group absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
        >
          <span className="absolute inset-[-18px] rounded-full border border-amber-200/20" />
          <span
            className="relative inline-flex h-28 w-28 items-center justify-center rounded-full border border-amber-100/35 bg-[radial-gradient(circle_at_30%_30%,#fff7bf,#f59e0b_38%,#ea580c_74%,#7c2d12_100%)]"
            style={{ boxShadow: '0 0 30px rgba(245,158,11,0.45), 0 0 90px rgba(251,146,60,0.25)' }}
          >
            <Sun size={30} strokeWidth={1.8} className="absolute top-3 text-amber-100" />
            <span
              title={course.name}
              className="absolute inset-x-2 bottom-3 truncate rounded bg-slate-950/58 px-1 py-0.5 text-center text-[10px] font-medium text-amber-50"
            >
              {course.name}
            </span>
          </span>
        </button>

        {positioned.map(({ concept, x, y, labelPosition }) => {
          const glow = masteryToColor(concept.effectiveMastery)
          const selected = selectedConceptId === concept.id
          const dimmed = concept.isDecaying && concept.rustLevel > 0.12

          return (
            <button
              key={concept.id}
              type="button"
              onClick={() => onOpenConcept(course.id, concept.id)}
              className="group absolute z-20"
              style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${selected ? 'scale-110' : 'scale-100 hover:scale-105'}`}
                style={{
                  boxShadow: `0 0 14px ${toRgba(glow, dimmed ? 0.38 : 0.65)}`,
                  opacity: dimmed ? 0.68 : 0.94,
                }}
              >
                <Star size={15} strokeWidth={1.8} style={{ color: glow, fill: glow }} />
              </span>

              <span
                className="pointer-events-none absolute left-1/2 top-1/2 z-30 w-24 rounded border border-white/12 bg-[#09122a]/72 px-1.5 py-0.5 text-center text-[10px] leading-tight text-slate-200/92"
                style={labelStyleByPosition[labelPosition]}
                title={concept.title}
              >
                {concept.title}
              </span>
            </button>
          )
        })}
      </article>
    )
  }

  const maxVisible = isMobile && !expandedMobile ? 6 : 12
  const previewConcepts = pickPreviewConcepts(decoratedConcepts, maxVisible)
  const hiddenCount = Math.max(0, Math.min(12, decoratedConcepts.length) - previewConcepts.length)
  const { inner, middle, outer } = splitIntoRings(previewConcepts)

  return (
    <article className={`relative mx-auto h-[420px] w-full max-w-[420px] p-4 transition ${deEmphasized ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}>
      <button
        type="button"
        onClick={() => onOpenCourse(course.id)}
        className="group absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      >
        <span className="absolute inset-[-18px] rounded-full border border-amber-200/20" />
        <span
          className="relative inline-flex h-24 w-24 items-center justify-center rounded-full border border-amber-100/35 bg-[radial-gradient(circle_at_30%_30%,#fff7bf,#f59e0b_38%,#ea580c_74%,#7c2d12_100%)] transition-transform duration-300 group-hover:scale-105"
          style={{ boxShadow: '0 0 30px rgba(245,158,11,0.45), 0 0 90px rgba(251,146,60,0.2)' }}
        >
          <Sun size={24} strokeWidth={1.8} className="absolute top-3 text-amber-100" />
          <span
            title={course.name}
            className="absolute inset-x-2 bottom-2 truncate rounded bg-slate-950/58 px-1 py-0.5 text-center text-[9px] font-medium text-amber-50"
          >
            {course.name}
          </span>
        </span>
      </button>

      <OrbitRing
        ringId={`${course.id}-inner`}
        radius={72}
        concepts={inner}
        durationSec={36}
        motionEnabled={motionEnabled}
        onSelectConcept={(conceptId) => onOpenConcept(course.id, conceptId)}
      />
      <OrbitRing
        ringId={`${course.id}-middle`}
        radius={108}
        concepts={middle}
        durationSec={52}
        reverse
        motionEnabled={motionEnabled}
        onSelectConcept={(conceptId) => onOpenConcept(course.id, conceptId)}
      />
      <OrbitRing
        ringId={`${course.id}-outer`}
        radius={146}
        concepts={outer}
        durationSec={68}
        motionEnabled={motionEnabled}
        onSelectConcept={(conceptId) => onOpenConcept(course.id, conceptId)}
      />

      {isMobile && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpandedMobile((value) => !value)}
          className="absolute right-4 top-4 z-30 rounded-full border border-white/20 bg-white/8 px-3 py-1 text-xs text-slate-100 hover:bg-white/15"
        >
          {expandedMobile ? 'Show less' : `+${hiddenCount} more`}
        </button>
      )}
    </article>
  )
}

export default SunCourseSystem
