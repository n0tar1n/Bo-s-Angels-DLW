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
  scope?: 'module' | 'foundation'
  importance?: 1 | 2 | 3 | 4 | 5
  tags?: string[]
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
  sourceFileIds?: string[]
  createdAt: string
  lastActiveAt: string
}

export type TrendLabel = 'improving' | 'stagnating' | 'regressing' | 'unknown'

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

export interface ExtractedModuleMeta {
  name: string
  assumed_level: 'intro' | 'intermediate' | 'advanced'
  graph_version: string
}

export interface ExtractedConceptNode {
  id: string
  name: string
  summary: string
  scope: 'module' | 'foundation'
  importance: 1 | 2 | 3 | 4 | 5
  tags: string[]
}

export interface ExtractedConceptEdge {
  from: string
  to: string
  type: 'prerequisite'
}

export interface ExtractedCourseGraph {
  module: ExtractedModuleMeta
  nodes: ExtractedConceptNode[]
  edges: ExtractedConceptEdge[]
  sanity_checks: {
    is_dag_claim: boolean
    notes: string[]
  }
}
