import type { AttemptAction, AttemptEvent, ConceptEdge, ConceptNode, Course } from '../types'
import { daysAgo } from './date'
import { clamp, hashString, mulberry32, pickOne, randomBetween } from './random'

const COMMON_CONCEPTS = [
  'Foundational intuition',
  'Error analysis',
  'Practice strategy',
  'Transfer to real tasks',
]

const DOMAIN_LIBRARY: Record<string, string[]> = {
  ml: [
    'Data preprocessing',
    'Feature engineering',
    'Train-validation-test split',
    'Linear regression',
    'Logistic regression',
    'Loss functions',
    'Gradient descent',
    'Regularization',
    'Overfitting vs underfitting',
    'Decision trees',
    'Random forests',
    'Support vector machines',
    'K-means clustering',
    'Principal component analysis',
    'Neural network basics',
    'Backpropagation',
    'Hyperparameter tuning',
    'Model evaluation metrics',
    'Bias and fairness',
    'Deployment basics',
    'Monitoring drift',
    'Prompt engineering basics',
    'Retrieval-augmented generation',
    'Model interpretability',
  ],
  web: [
    'Semantic HTML',
    'CSS layout systems',
    'Responsive breakpoints',
    'Flexbox patterns',
    'Grid systems',
    'JavaScript fundamentals',
    'DOM manipulation',
    'Event handling',
    'State management basics',
    'Component architecture',
    'React hooks',
    'Routing concepts',
    'Form validation',
    'Async data fetching',
    'Authentication flows',
    'REST API integration',
    'Accessibility semantics',
    'Performance optimization',
    'Build tooling',
    'Testing fundamentals',
    'Deployment pipeline',
    'Observability basics',
    'Frontend security',
    'Caching strategies',
  ],
  math: [
    'Vector spaces',
    'Linear combinations',
    'Span and basis',
    'Matrix multiplication',
    'Determinants',
    'Inverse matrices',
    'Systems of equations',
    'Eigenvalues',
    'Eigenvectors',
    'Diagonalization',
    'Orthogonality',
    'Least squares',
    'Projection matrices',
    'Singular value decomposition',
    'Change of basis',
    'Inner products',
    'Norms and distances',
    'Complex vectors',
    'Spectral theorem',
    'Numerical stability',
    'Optimization geometry',
    'Markov chains',
    'Graph Laplacian intuition',
    'PCA from linear algebra',
  ],
  ds: [
    'Algorithmic thinking',
    'Asymptotic notation',
    'Arrays and strings',
    'Linked lists',
    'Stacks and queues',
    'Hash maps',
    'Trees and traversals',
    'Binary search trees',
    'Heaps and priority queues',
    'Graph representations',
    'DFS and BFS',
    'Dynamic programming',
    'Greedy algorithms',
    'Divide and conquer',
    'Sorting algorithms',
    'Searching techniques',
    'Shortest path algorithms',
    'Union-Find',
    'Recurrence relations',
    'Amortized analysis',
    'Backtracking',
    'Bit manipulation',
    'Complexity tradeoffs',
    'Interview pattern synthesis',
  ],
}

const keywordGroups: Array<{ domain: keyof typeof DOMAIN_LIBRARY; keys: string[] }> = [
  { domain: 'ml', keys: ['machine', 'model', 'neural', 'learning', 'classification', 'regression', 'data'] },
  { domain: 'web', keys: ['web', 'frontend', 'react', 'css', 'javascript', 'html', 'api'] },
  { domain: 'math', keys: ['algebra', 'matrix', 'vector', 'eigen', 'linear', 'theorem'] },
  { domain: 'ds', keys: ['algorithm', 'data structure', 'graph', 'array', 'dynamic programming', 'complexity'] },
]

const normalizeTopic = (topic: string) => topic.trim().replace(/^[\d\-.)\s]+/, '')

const inferDomain = (name: string, syllabus: string): keyof typeof DOMAIN_LIBRARY => {
  const haystack = `${name} ${syllabus}`.toLowerCase()
  let bestDomain: keyof typeof DOMAIN_LIBRARY = 'ml'
  let bestScore = -1

  keywordGroups.forEach(({ domain, keys }) => {
    const score = keys.reduce((sum, key) => (haystack.includes(key) ? sum + 1 : sum), 0)
    if (score > bestScore) {
      bestScore = score
      bestDomain = domain
    }
  })

  return bestDomain
}

const buildSummary = (title: string) => `Understand ${title.toLowerCase()} with intuition, examples, and common pitfalls.`

const buildAttempt = (
  courseId: string,
  conceptId: string,
  action: AttemptAction,
  masteryBefore: number | null,
  masteryAfter: number,
  timestamp: string,
  score?: number,
): AttemptEvent => ({
  id: `${conceptId}-${action}-${timestamp}`,
  courseId,
  conceptId,
  action,
  timestamp,
  masteryBefore,
  masteryAfter,
  score,
})

const generateAttemptHistory = (
  random: () => number,
  courseId: string,
  conceptId: string,
  nowIso: string,
  finalMastery: number,
): AttemptEvent[] => {
  const attempts: AttemptEvent[] = []
  const count = Math.max(1, Math.floor(randomBetween(random, 1, 4.8)))
  let current = clamp(finalMastery - randomBetween(random, 0.08, 0.28))

  for (let index = 0; index < count; index += 1) {
    const action: AttemptAction = index === 0 ? 'explain' : random() > 0.45 ? 'quiz' : 'quick_check'
    const stepGain = (finalMastery - current) / Math.max(1, count - index)
    const next = clamp(current + stepGain + randomBetween(random, -0.03, 0.04))
    const timestamp = daysAgo(Math.floor(randomBetween(random, 1, 22)), nowIso)
    const score = action === 'explain' ? Math.round(next * 100) : Math.round(randomBetween(random, 48, 98))
    attempts.push(buildAttempt(courseId, conceptId, action, current, next, timestamp, score))
    current = next
  }

  return attempts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

export const generateConceptGraph = (courseName: string, syllabus: string, seed?: string) => {
  const domain = inferDomain(courseName, syllabus)
  const random = mulberry32(hashString(seed ?? `${courseName}-${syllabus}`))

  const rawTopics = syllabus
    .split(/[\n,]/)
    .map(normalizeTopic)
    .filter((topic) => topic.length > 2)

  const targetCount = Math.floor(randomBetween(random, 20, 36))
  const candidateTopics = Array.from(new Set([...rawTopics, ...DOMAIN_LIBRARY[domain], ...COMMON_CONCEPTS]))

  while (candidateTopics.length < targetCount) {
    candidateTopics.push(`${domain.toUpperCase()} extension topic ${candidateTopics.length + 1}`)
  }

  const conceptTitles = candidateTopics.slice(0, targetCount)

  const conceptNodes = conceptTitles.map((title, index) => {
    const conceptId = `concept-${index + 1}-${hashString(`${title}-${index}`).toString(16).slice(0, 4)}`
    return {
      id: conceptId,
      title,
      summary: buildSummary(title),
    }
  })

  const conceptEdges: ConceptEdge[] = []
  conceptNodes.forEach((concept, index) => {
    if (index === 0) return
    const candidates = []
    const minSource = Math.max(0, index - 6)
    for (let sourceIndex = minSource; sourceIndex < index; sourceIndex += 1) {
      candidates.push(sourceIndex)
    }

    const prereqCount = index < 4 ? 1 : random() > 0.64 ? 2 : 1
    const chosen = new Set<number>()

    for (let step = 0; step < prereqCount && candidates.length > 0; step += 1) {
      const candidate = candidates.splice(Math.floor(random() * candidates.length), 1)[0]
      chosen.add(candidate)
    }

    chosen.forEach((sourceIndex) => {
      const source = conceptNodes[sourceIndex].id
      conceptEdges.push({
        id: `edge-${source}-${concept.id}`,
        source,
        target: concept.id,
      })
    })
  })

  return {
    conceptNodes,
    conceptEdges,
  }
}

export const createCourseFromSyllabus = (
  name: string,
  syllabus: string,
  nowIso: string,
  opts?: { seed?: string; withProgress?: boolean },
): Course => {
  const courseId = `course-${hashString(`${name}-${nowIso}-${opts?.seed ?? ''}`).toString(16).slice(0, 8)}`
  const graph = generateConceptGraph(name, syllabus, opts?.seed ?? name)
  const random = mulberry32(hashString(`${courseId}-${opts?.seed ?? name}`))

  const conceptNodes: ConceptNode[] = graph.conceptNodes.map((concept) => {
    if (!opts?.withProgress) {
      return {
        ...concept,
        mastery: null,
        lastPracticedAt: null,
        firstExplainedAt: null,
        attempts: [],
        createdAt: nowIso,
      }
    }

    const wasAttempted = random() > 0.24
    if (!wasAttempted) {
      return {
        ...concept,
        mastery: null,
        lastPracticedAt: null,
        firstExplainedAt: null,
        attempts: [],
        createdAt: nowIso,
      }
    }

    const mastery = clamp(randomBetween(random, 0.3, 0.92))
    const attempts = generateAttemptHistory(random, courseId, concept.id, nowIso, mastery)
    const lastAttempt = attempts[attempts.length - 1]
    const firstExplain = attempts.find((attempt) => attempt.action === 'explain')

    return {
      ...concept,
      mastery,
      lastPracticedAt: lastAttempt?.timestamp ?? daysAgo(Math.floor(randomBetween(random, 0, 8)), nowIso),
      firstExplainedAt: firstExplain?.timestamp ?? null,
      attempts,
      createdAt: nowIso,
    }
  })

  const recentlyTouched = conceptNodes
    .filter((concept) => concept.lastPracticedAt)
    .map((concept) => concept.lastPracticedAt as string)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return {
    id: courseId,
    name,
    syllabus,
    conceptNodes,
    conceptEdges: graph.conceptEdges,
    createdAt: nowIso,
    lastActiveAt: recentlyTouched[0] ?? nowIso,
  }
}

export const createSeedCourses = (nowIso: string): Course[] => {
  const seeds = [
    {
      name: 'Machine Learning Foundations',
      syllabus:
        'Supervised learning, regression, classification, feature engineering, model evaluation, bias-variance, hyperparameter tuning, interpretability, deployment',
    },
    {
      name: 'Modern Web Engineering',
      syllabus:
        'HTML semantics, responsive CSS, JavaScript, React hooks, routing, APIs, auth, performance, testing, deployment',
    },
    {
      name: 'Linear Algebra for AI',
      syllabus:
        'Vectors, matrices, span, basis, transformations, eigenvalues, eigenvectors, SVD, orthogonality, least squares, PCA',
    },
    {
      name: 'Data Structures & Algorithms',
      syllabus:
        'Complexity, arrays, linked lists, trees, graphs, heaps, recursion, dynamic programming, greedy, shortest paths',
    },
  ]

  return seeds.map((seed, index) => {
    const course = createCourseFromSyllabus(seed.name, seed.syllabus, nowIso, {
      seed: `seed-${index + 1}`,
      withProgress: true,
    })

    course.lastActiveAt = daysAgo(index * 2, nowIso)
    return course
  })
}

export const pickWarmupConceptId = (course: Course, nowIso: string) => {
  const attempted = course.conceptNodes.filter((concept) => concept.mastery !== null)
  if (attempted.length === 0) {
    return pickOne(course.conceptNodes, mulberry32(hashString(`${course.id}-${nowIso}`))).id
  }

  const sorted = [...attempted].sort((a, b) => {
    const am = a.mastery ?? 0
    const bm = b.mastery ?? 0
    return am - bm
  })

  return sorted[0].id
}
