import type { ConceptNode, Course, CourseStats, MasterySnapshot, TrendLabel } from '../types'
import { daysBetween } from './date'
import { clamp } from './random'

export const DECAY_GRACE_DAYS = 7
export const DAILY_DECAY_RATE = 0.018

export const getMasterySnapshot = (concept: ConceptNode, nowIso: string): MasterySnapshot => {
  if (concept.mastery === null) {
    return { effectiveMastery: null, rustLevel: 0, isDecaying: false }
  }

  const lastPractice = concept.lastPracticedAt ?? concept.createdAt
  const daysSincePractice = daysBetween(lastPractice, nowIso)
  const decayDays = Math.max(0, daysSincePractice - DECAY_GRACE_DAYS)
  const decayAmount = decayDays * DAILY_DECAY_RATE
  const effectiveMastery = clamp(concept.mastery - decayAmount)
  const rustLevel = clamp(decayDays / 16)

  return {
    effectiveMastery,
    rustLevel,
    isDecaying: decayDays > 0,
  }
}

export const masteryToColor = (mastery: number | null) => {
  if (mastery === null) return 'var(--star-gray)'
  if (mastery >= 0.8) return 'var(--star-green)'
  if (mastery >= 0.5) return 'var(--star-yellow)'
  return 'var(--star-red)'
}

export const masteryTierLabel = (mastery: number | null) => {
  if (mastery === null) return 'Not attempted'
  if (mastery >= 0.8) return 'Strong'
  if (mastery >= 0.5) return 'Developing'
  return 'Needs reinforcement'
}

export const computeConceptTrend = (concept: ConceptNode): TrendLabel => {
  if (concept.attempts.length < 2) return 'stagnating'
  const recentAttempts = concept.attempts.slice(-3)
  const first = recentAttempts[0]
  const last = recentAttempts[recentAttempts.length - 1]
  const delta = last.masteryAfter - first.masteryAfter
  if (delta > 0.06) return 'improving'
  if (delta < -0.05) return 'regressing'
  return 'stagnating'
}

export const computeCourseStats = (course: Course, nowIso: string): CourseStats => {
  const snapshots = course.conceptNodes.map((concept) => getMasterySnapshot(concept, nowIso))
  const masteryValues = snapshots
    .map((snapshot) => snapshot.effectiveMastery)
    .filter((value): value is number => value !== null)

  const overallMastery = masteryValues.length
    ? masteryValues.reduce((sum, value) => sum + value, 0) / masteryValues.length
    : 0

  const nodesNeedingWork = course.conceptNodes.filter((concept) => {
    const snapshot = getMasterySnapshot(concept, nowIso)
    return snapshot.effectiveMastery === null || snapshot.effectiveMastery < 0.5
  }).length

  return {
    overallMastery,
    nodesNeedingWork,
    lastActiveAt: course.lastActiveAt,
  }
}
