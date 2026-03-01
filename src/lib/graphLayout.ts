import dagre from 'dagre'
import type { Edge, Node } from 'reactflow'
import type { ConceptEdge, ConceptNode } from '../types'
import { hashString, mulberry32, randomBetween } from './random'

interface LayoutNodeData {
  label: string
  mastery: number | null
  rustLevel: number
  isDecaying: boolean
  summary: string
  labelOffsetX: number
  labelOffsetY: number
}

interface Point {
  x: number
  y: number
}

const NODE_WIDTH = 40
const NODE_HEIGHT = 40
const MIN_DISTANCE = 104

const relaxPositions = (points: Point[]) => {
  const adjusted = points.map((point) => ({ ...point }))
  const iterations = 110

  for (let iter = 0; iter < iterations; iter += 1) {
    for (let i = 0; i < adjusted.length; i += 1) {
      for (let j = i + 1; j < adjusted.length; j += 1) {
        const a = adjusted[i]
        const b = adjusted[j]

        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy)

        if (dist >= MIN_DISTANCE) continue

        const nx = dist === 0 ? 1 : dx / dist
        const ny = dist === 0 ? 0 : dy / dist
        const push = (MIN_DISTANCE - Math.max(1, dist)) * 0.48

        a.x -= nx * push
        a.y -= ny * push
        b.x += nx * push
        b.y += ny * push
      }
    }
  }

  return adjusted
}

const computeLabelOffset = (courseId: string, conceptId: string) => {
  const random = mulberry32(hashString(`${courseId}-${conceptId}-label`))
  const direction = Math.floor(random() * 4)

  switch (direction) {
    case 0:
      return { labelOffsetX: 0, labelOffsetY: -12 }
    case 1:
      return { labelOffsetX: 0, labelOffsetY: 12 }
    case 2:
      return { labelOffsetX: 16, labelOffsetY: 0 }
    default:
      return { labelOffsetX: -16, labelOffsetY: 0 }
  }
}

export const buildConstellationElements = (
  courseId: string,
  concepts: Array<ConceptNode & { effectiveMastery: number | null; rustLevel: number; isDecaying: boolean }>,
  edges: ConceptEdge[],
): { nodes: Node<LayoutNodeData>[]; edges: Edge[] } => {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: 'LR',
    ranksep: 260,
    nodesep: 170,
    edgesep: 70,
    marginx: 180,
    marginy: 150,
  })

  concepts.forEach((concept) => {
    graph.setNode(concept.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })
  })

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target)
  })

  dagre.layout(graph)

  const basePoints = concepts.map((concept) => {
    const pos = graph.node(concept.id)
    const random = mulberry32(hashString(`${courseId}-${concept.id}`))

    return {
      x: (pos?.x ?? 0) + randomBetween(random, -22, 22),
      y: (pos?.y ?? 0) + randomBetween(random, -28, 28),
    }
  })

  const spacedPoints = relaxPositions(basePoints)

  const nodes: Node<LayoutNodeData>[] = concepts.map((concept, index) => {
    const point = spacedPoints[index]

    return {
      id: concept.id,
      type: 'star',
      draggable: false,
      position: {
        x: point.x - NODE_WIDTH / 2,
        y: point.y - NODE_HEIGHT / 2,
      },
      data: {
        label: concept.title,
        mastery: concept.effectiveMastery,
        rustLevel: concept.rustLevel,
        isDecaying: concept.isDecaying,
        summary: concept.summary,
        ...computeLabelOffset(courseId, concept.id),
      },
    }
  })

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: 'rgba(180, 228, 255, 0.18)',
      strokeWidth: 0.95,
      filter: 'drop-shadow(0 0 4px rgba(125,211,252,0.24))',
    },
  }))

  return {
    nodes,
    edges: flowEdges,
  }
}
