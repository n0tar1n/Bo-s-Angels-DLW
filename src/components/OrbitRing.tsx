import type { CSSProperties } from 'react'
import { masteryToColor } from '../lib/mastery'
import type { ConceptNode } from '../types'
import StarSubtopic from './StarSubtopic'

interface OrbitConcept extends ConceptNode {
  effectiveMastery: number | null
  rustLevel: number
  isDecaying: boolean
}

interface OrbitRingProps {
  ringId: string
  radius: number
  concepts: OrbitConcept[]
  durationSec: number
  reverse?: boolean
  motionEnabled: boolean
  onSelectConcept: (conceptId: string) => void
}

const OrbitRing = ({
  ringId,
  radius,
  concepts,
  durationSec,
  reverse,
  motionEnabled,
  onSelectConcept,
}: OrbitRingProps) => {
  if (concepts.length === 0) return null

  const animationClass = motionEnabled ? (reverse ? 'orbit-spin-reverse' : 'orbit-spin') : ''
  const animationStyle: CSSProperties = motionEnabled ? ({ animationDuration: `${durationSec}s` } as CSSProperties) : {}

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        width: radius * 2,
        height: radius * 2,
        marginLeft: -radius,
        marginTop: -radius,
      }}
    >
      <div className="absolute inset-0 rounded-full border border-cyan-100/10" />
      <div className={`relative h-full w-full ${animationClass}`} style={animationStyle}>
        {concepts.map((concept, index) => {
          const angle = (360 / concepts.length) * index + (ringId.length % 2 === 0 ? 12 : -8)
          const glowColor = masteryToColor(concept.effectiveMastery)
          const dimmed = concept.isDecaying && concept.rustLevel > 0.12

          return (
            <StarSubtopic
              key={concept.id}
              conceptId={concept.id}
              title={concept.title}
              glowColor={glowColor}
              dimmed={dimmed}
              angleDeg={angle}
              radius={radius}
              onSelect={onSelectConcept}
            />
          )
        })}
      </div>
    </div>
  )
}

export default OrbitRing
