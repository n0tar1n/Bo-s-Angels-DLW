import type { EvaluationResult, QuizQuestion } from '../types'
import { hashString, mulberry32, pickOne, randomBetween, shuffleDeterministic } from './random'

interface EvaluateInput {
  courseName: string
  conceptTitle: string
  explanationText: string
}

interface QuizInput {
  courseName: string
  conceptTitle: string
  weakAreas: string[]
  count: number
}

const fallbackGaps = [
  'Precise definition and boundaries',
  'When to apply the concept in practice',
  'Common failure cases',
  'Comparison with closely related ideas',
  'Step-by-step worked example',
]

const misconceptionPool = [
  'Assumes correlation guarantees causation in all settings',
  'Treats training performance as sufficient evidence of mastery',
  'Confuses optimization objective with product goal',
  'Uses terms interchangeably without identifying constraints',
  'Skips edge cases and uncertainty handling',
]

const actionPool = [
  'Re-explain with one concrete real-world scenario',
  'Do a 3-question quick check focused on weak areas',
  'Create flashcards for the missing points',
  'Watch a short recap before attempting the full quiz',
  'Teach the concept with a worked example and counterexample',
]

const focusSeeds = [
  'core definition',
  'prerequisite linkage',
  'error analysis',
  'application boundary',
  'scenario transfer',
]

const buildQuestion = (
  conceptTitle: string,
  focus: string,
  random: () => number,
  idx: number,
): QuizQuestion => {
  const promptVariants = [
    `Which option best captures the ${focus} of ${conceptTitle}?`,
    `A student struggles with ${conceptTitle}. What is the best first correction for ${focus}?`,
    `When applying ${conceptTitle}, which statement is most accurate about ${focus}?`,
  ]

  const prompt = promptVariants[Math.floor(random() * promptVariants.length)]
  const correct = `It directly addresses ${focus} with clear assumptions and a concrete example.`
  const distractors = [
    `It ignores ${focus} and prioritizes speed over understanding.`,
    `It treats all situations as identical, even with conflicting constraints.`,
    `It memorizes output patterns without explaining the underlying reasoning.`,
  ]

  const options = shuffleDeterministic([correct, ...distractors], hashString(`${conceptTitle}-${focus}-${idx}`))
  const correctIndex = options.findIndex((option) => option === correct)

  return {
    id: `quiz-q-${idx + 1}-${hashString(`${prompt}-${idx}`).toString(16).slice(0, 6)}`,
    prompt,
    options,
    correctIndex,
    focus,
    explanation: `Strong answers for ${focus} should include assumptions, mechanism, and one practical example.`,
  }
}

export const mockAiService = {
  async evaluateExplanation(input: EvaluateInput): Promise<EvaluationResult> {
    const seed = hashString(`${input.courseName}-${input.conceptTitle}-${input.explanationText.trim().toLowerCase()}`)
    const random = mulberry32(seed)
    const textLength = input.explanationText.trim().length

    const structureBonus = textLength > 280 ? 8 : 0
    const depthBonus = textLength > 520 ? 6 : 0
    const baseline = randomBetween(random, 48, 82) + structureBonus + depthBonus

    const alignmentScore = Math.round(Math.max(20, Math.min(98, baseline)))
    const coverage = Math.round(Math.max(15, Math.min(98, alignmentScore + randomBetween(random, -10, 8))))
    const correctness = Math.round(Math.max(18, Math.min(99, alignmentScore + randomBetween(random, -14, 10))))
    const coherence = Math.round(Math.max(20, Math.min(99, alignmentScore + randomBetween(random, -8, 12))))

    const weaknessCount = alignmentScore > 82 ? 1 : alignmentScore > 66 ? 2 : 3
    const missingPoints = shuffleDeterministic(
      [
        `${input.conceptTitle}: ${pickOne(fallbackGaps, random)}`,
        `${input.conceptTitle}: ${pickOne(fallbackGaps, random)}`,
        `${input.conceptTitle}: ${pickOne(fallbackGaps, random)}`,
      ],
      seed + 17,
    ).slice(0, weaknessCount)

    const misconceptionCount = alignmentScore > 78 ? 0 : alignmentScore > 58 ? 1 : 2
    const misconceptionsDetected = shuffleDeterministic([...misconceptionPool], seed + 29).slice(0, misconceptionCount)

    const nextActions = shuffleDeterministic([...actionPool], seed + 41).slice(0, 3)

    await new Promise((resolve) => setTimeout(resolve, 900))

    return {
      alignmentScore,
      coverage,
      correctness,
      coherence,
      missingPoints,
      misconceptionsDetected,
      nextActions,
    }
  },

  async generateQuiz(input: QuizInput): Promise<QuizQuestion[]> {
    const seed = hashString(`${input.courseName}-${input.conceptTitle}-${input.weakAreas.join('|')}-${input.count}`)
    const random = mulberry32(seed)
    const focusAreas = [...input.weakAreas, ...focusSeeds]

    const questions = Array.from({ length: input.count }).map((_, idx) => {
      const focus = focusAreas[idx % focusAreas.length] ?? pickOne(focusSeeds, random)
      return buildQuestion(input.conceptTitle, focus, random, idx)
    })

    await new Promise((resolve) => setTimeout(resolve, 700))

    return questions
  },
}
