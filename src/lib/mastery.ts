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

export const trendToColor = (trend: TrendLabel) => {
  if (trend === 'improving') return 'var(--star-green)'
  if (trend === 'stagnating') return 'var(--star-yellow)'
  if (trend === 'regressing') return 'var(--star-red)'
  return 'var(--star-gray)'
}

export const getTrendColor = (trend: TrendLabel) => {
  if (trend === 'improving') {
    return 'border-emerald-300/80 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
  }
  if (trend === 'stagnating') {
    return 'border-amber-300/80 shadow-[0_0_10px_rgba(251,191,36,0.35)]'
  }
  if (trend === 'regressing') {
    return 'border-rose-300/80 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
  }
  return 'border-slate-300/65 shadow-[0_0_10px_rgba(148,163,184,0.3)]'
}

export const masteryTierLabel = (mastery: number | null) => {
  if (mastery === null) return 'Not attempted'
  if (mastery >= 0.8) return 'Strong'
  if (mastery >= 0.5) return 'Developing'
  return 'Needs reinforcement'
}

export const computeConceptTrend = (concept: ConceptNode): TrendLabel => {
  if (concept.attempts.length < 2) return 'unknown'
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
