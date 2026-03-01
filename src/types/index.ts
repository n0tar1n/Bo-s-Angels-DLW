export type AttemptAction = 'explain' | 'quiz' | 'quick_check' | 'recap' | 'warmup'

export interface AttemptEvent {
  id: string
  courseId: string
  conceptId: string
  timestamp: string
  action: AttemptAction
  score?: number
  masteryBefore: number | null
  masteryAfter: number
  notes?: string
}

export interface ConceptNode {
  id: string
  title: string
  summary: string
  mastery: number | null
  lastPracticedAt: string | null
  firstExplainedAt: string | null
  attempts: AttemptEvent[]
  createdAt: string
}

export interface ConceptEdge {
  id: string
  source: string
  target: string
}

export interface Course {
  id: string
  name: string
  syllabus: string
  conceptNodes: ConceptNode[]
  conceptEdges: ConceptEdge[]
  createdAt: string
  lastActiveAt: string
}

export type TrendLabel = 'improving' | 'stagnating' | 'regressing'

export interface EvaluationResult {
  alignmentScore: number
  coverage: number
  correctness: number
  coherence: number
  missingPoints: string[]
  misconceptionsDetected: string[]
  nextActions: string[]
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  focus: string
}

export interface QuizSessionResult {
  score: number
  total: number
  mode: 'full' | 'quick'
  answeredAt: string
}

export interface AppState {
  courses: Course[]
}

export interface CourseStats {
  overallMastery: number
  nodesNeedingWork: number
  lastActiveAt: string
}

export interface MasterySnapshot {
  effectiveMastery: number | null
  rustLevel: number
  isDecaying: boolean
}
