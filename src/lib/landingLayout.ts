import type { Course, ConceptNode } from '../types'
import { hashString, mulberry32, randomBetween } from './random'

export interface LandingMoonPreview {
  conceptId: string
  title: string
}

export interface LandingSolarSystem {
  courseId: string
  courseName: string
  x: number
  y: number
  moons: Array<LandingMoonPreview & { x: number; y: number }>
}

const buildDegreeMaps = (course: Course) => {
  const inDegree = new Map<string, number>()
  const outDegree = new Map<string, number>()

  course.conceptNodes.forEach((concept) => {
    inDegree.set(concept.id, 0)
    outDegree.set(concept.id, 0)
  })

  course.conceptEdges.forEach((edge) => {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1)
  })

  return { inDegree, outDegree }
}

const pickPreviewMoons = (course: Course, count = 6): ConceptNode[] => {
  const { inDegree, outDegree } = buildDegreeMaps(course)

  const roots = course.conceptNodes
    .filter((concept) => (inDegree.get(concept.id) ?? 0) === 0)
    .sort((a, b) => (outDegree.get(b.id) ?? 0) - (outDegree.get(a.id) ?? 0))

  const rest = course.conceptNodes
    .filter((concept) => !roots.some((root) => root.id === concept.id))
    .sort((a, b) => {
      const outDelta = (outDegree.get(b.id) ?? 0) - (outDegree.get(a.id) ?? 0)
      if (outDelta !== 0) return outDelta
      const aMastery = a.mastery ?? -1
      const bMastery = b.mastery ?? -1
      return aMastery - bMastery
    })

  return [...roots, ...rest].slice(0, count)
}

export const buildLandingSolarSystems = (courses: Course[]): LandingSolarSystem[] => {
  if (courses.length === 0) return []

  const sorted = [...courses].sort((a, b) => a.name.localeCompare(b.name))
  const cols = Math.max(1, Math.ceil(Math.sqrt(sorted.length)))
  const rows = Math.max(1, Math.ceil(sorted.length / cols))

  const cellWidth = 560
  const cellHeight = 460
  const totalWidth = cols * cellWidth
  const totalHeight = rows * cellHeight

  const offsetX = 240
  const offsetY = 220

  return sorted.map((course, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)

    const x = offsetX + col * cellWidth - totalWidth / 2
    const y = offsetY + row * cellHeight - totalHeight / 2

    const previewMoons = pickPreviewMoons(course)
    const random = mulberry32(hashString(`${course.id}-${course.name}`))

    const moons = previewMoons.map((concept, moonIndex) => {
      const baseAngle = (2 * Math.PI * moonIndex) / previewMoons.length
      const angle = baseAngle + randomBetween(random, -0.24, 0.24)
      const radius = 120 + (moonIndex % 2) * 26 + randomBetween(random, -10, 15)

      return {
        conceptId: concept.id,
        title: concept.title,
        x: x + Math.cos(angle) * radius,
        y: y + Math.sin(angle) * radius,
      }
    })

    return {
      courseId: course.id,
      courseName: course.name,
      x,
      y,
      moons,
    }
  })
}
