/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { AppState, Course, EvaluationResult, QuizSessionResult } from '../types'
import { createCourseFromSyllabus, createSeedCourses } from './mockGraph'
import { clamp } from './random'

const STORAGE_KEY = 'constellation-coach-state-v1'

interface AddCourseInput {
  name: string
  syllabus: string
}

interface AppStoreContextValue {
  courses: Course[]
  nowIso: string
  addCourse: (input: AddCourseInput) => Course
  applyEvaluation: (courseId: string, conceptId: string, evaluation: EvaluationResult) => void
  applyQuizResult: (courseId: string, conceptId: string, result: QuizSessionResult) => void
  applyRecapAction: (courseId: string, conceptId: string) => void
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null)

const loadInitialState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { courses: createSeedCourses(new Date().toISOString()) }
    }
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.courses || !Array.isArray(parsed.courses)) {
      return { courses: createSeedCourses(new Date().toISOString()) }
    }
    return parsed
  } catch {
    return { courses: createSeedCourses(new Date().toISOString()) }
  }
}

const appendAttempt = (
  course: Course,
  conceptId: string,
  payload: {
    action: 'explain' | 'quiz' | 'quick_check' | 'recap' | 'warmup'
    masteryBefore: number | null
    masteryAfter: number
    score?: number
    notes?: string
    timestamp: string
  },
): Course => {
  const updatedNodes = course.conceptNodes.map((concept) => {
    if (concept.id !== conceptId) return concept

    const attempt = {
      id: `${conceptId}-${payload.action}-${Date.parse(payload.timestamp)}`,
      courseId: course.id,
      conceptId,
      action: payload.action,
      score: payload.score,
      notes: payload.notes,
      timestamp: payload.timestamp,
      masteryBefore: payload.masteryBefore,
      masteryAfter: payload.masteryAfter,
    }

    return {
      ...concept,
      mastery: payload.masteryAfter,
      lastPracticedAt: payload.timestamp,
      firstExplainedAt:
        payload.action === 'explain' ? concept.firstExplainedAt ?? payload.timestamp : concept.firstExplainedAt,
      attempts: [...concept.attempts, attempt].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
    }
  })

  return {
    ...course,
    conceptNodes: updatedNodes,
    lastActiveAt: payload.timestamp,
  }
}

export const AppStoreProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<AppState>(loadInitialState)
  const [nowIso, setNowIso] = useState(new Date().toISOString())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowIso(new Date().toISOString())
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [])

  const addCourse = useCallback((input: AddCourseInput) => {
    const now = new Date().toISOString()
    const created = createCourseFromSyllabus(input.name, input.syllabus, now, {
      seed: `${input.name}-${input.syllabus}`,
      withProgress: false,
    })

    setState((prev) => ({
      ...prev,
      courses: [created, ...prev.courses],
    }))

    return created
  }, [])

  const applyEvaluation = useCallback((courseId: string, conceptId: string, evaluation: EvaluationResult) => {
    setState((prev) => {
      const now = new Date().toISOString()
      const courses = prev.courses.map((course) => {
        if (course.id !== courseId) return course

        const concept = course.conceptNodes.find((node) => node.id === conceptId)
        if (!concept) return course

        const before = concept.mastery
        const base = before ?? 0.22
        const signal = evaluation.alignmentScore / 100
        const gain = (signal - 0.5) * 0.2 + 0.07
        const after = clamp(base + gain)

        return appendAttempt(course, conceptId, {
          action: 'explain',
          masteryBefore: before,
          masteryAfter: after,
          score: evaluation.alignmentScore,
          notes: `Coverage ${evaluation.coverage}, correctness ${evaluation.correctness}, coherence ${evaluation.coherence}`,
          timestamp: now,
        })
      })

      return { ...prev, courses }
    })
  }, [])

  const applyQuizResult = useCallback((courseId: string, conceptId: string, result: QuizSessionResult) => {
    setState((prev) => {
      const scoreRatio = result.total === 0 ? 0 : result.score / result.total
      const now = result.answeredAt

      const courses = prev.courses.map((course) => {
        if (course.id !== courseId) return course

        const concept = course.conceptNodes.find((node) => node.id === conceptId)
        if (!concept) return course

        const before = concept.mastery
        const base = before ?? 0.28
        const fixedGain = result.mode === 'quick' ? 0.05 : 0.09
        const scoreGain = (scoreRatio - 0.5) * 0.22
        const after = clamp(base + fixedGain + scoreGain)

        return appendAttempt(course, conceptId, {
          action: result.mode === 'quick' ? 'quick_check' : 'quiz',
          masteryBefore: before,
          masteryAfter: after,
          score: Math.round(scoreRatio * 100),
          notes: `${result.score}/${result.total}`,
          timestamp: now,
        })
      })

      return { ...prev, courses }
    })
  }, [])

  const applyRecapAction = useCallback((courseId: string, conceptId: string) => {
    setState((prev) => {
      const now = new Date().toISOString()
      const courses = prev.courses.map((course) => {
        if (course.id !== courseId) return course

        const concept = course.conceptNodes.find((node) => node.id === conceptId)
        if (!concept) return course

        const before = concept.mastery
        const base = before ?? 0.16
        const after = clamp(base + 0.05)

        return appendAttempt(course, conceptId, {
          action: 'recap',
          masteryBefore: before,
          masteryAfter: after,
          notes: 'Recap completed',
          timestamp: now,
        })
      })

      return { ...prev, courses }
    })
  }, [])

  const value = useMemo<AppStoreContextValue>(
    () => ({
      courses: state.courses,
      nowIso,
      addCourse,
      applyEvaluation,
      applyQuizResult,
      applyRecapAction,
    }),
    [addCourse, applyEvaluation, applyQuizResult, applyRecapAction, nowIso, state.courses],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export const useAppStore = () => {
  const context = useContext(AppStoreContext)
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider')
  }
  return context
}
