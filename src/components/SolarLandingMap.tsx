import { useMemo } from 'react'
import ReactFlow, { Background, Controls, type Edge, type Node } from 'reactflow'
import type { Course } from '../types'
import { buildLandingSolarSystems } from '../lib/landingLayout'
import { getMasterySnapshot, masteryToColor } from '../lib/mastery'
import LandingMoonNode from './LandingMoonNode'
import LandingSunNode from './LandingSunNode'

interface SolarLandingMapProps {
  courses: Course[]
  nowIso: string
  onOpenCourse: (courseId: string, conceptId?: string) => void
}

interface SolarNodeData {
  kind: 'sun' | 'moon'
  courseId: string
  conceptId?: string
  label: string
  glow?: string
}

const nodeTypes = {
  sun: LandingSunNode,
  moon: LandingMoonNode,
}

const SolarLandingMap = ({ courses, nowIso, onOpenCourse }: SolarLandingMapProps) => {
  const { nodes, edges } = useMemo(() => {
    const systems = buildLandingSolarSystems(courses)
    const conceptLookup = new Map(
      courses.flatMap((course) => course.conceptNodes.map((concept) => [`${course.id}:${concept.id}`, concept] as const)),
    )

    const graphNodes: Node<SolarNodeData>[] = []
    const graphEdges: Edge[] = []

    systems.forEach((system) => {
      graphNodes.push({
        id: `sun-${system.courseId}`,
        type: 'sun',
        position: { x: system.x - 48, y: system.y - 48 },
        draggable: false,
        data: {
          kind: 'sun',
          courseId: system.courseId,
          label: system.courseName,
        },
      })

      system.moons.forEach((moon) => {
        const concept = conceptLookup.get(`${system.courseId}:${moon.conceptId}`)
        const snapshot = concept ? getMasterySnapshot(concept, nowIso) : null
        const glow = masteryToColor(snapshot?.effectiveMastery ?? null)

        graphNodes.push({
          id: `moon-${system.courseId}-${moon.conceptId}`,
          type: 'moon',
          position: { x: moon.x - 14, y: moon.y - 14 },
          draggable: false,
          data: {
            kind: 'moon',
            courseId: system.courseId,
            conceptId: moon.conceptId,
            label: moon.title,
            glow,
          },
        })

        graphEdges.push({
          id: `edge-${system.courseId}-${moon.conceptId}`,
          source: `sun-${system.courseId}`,
          target: `moon-${system.courseId}-${moon.conceptId}`,
          type: 'smoothstep',
          style: {
            stroke: 'rgba(186, 230, 253, 0.2)',
            strokeWidth: 1,
          },
        })
      })
    })

    return {
      nodes: graphNodes,
      edges: graphEdges,
    }
  }, [courses, nowIso])

  return (
    <div className="constellation-bg relative h-[74vh] min-h-[520px] w-full overflow-hidden rounded-3xl border border-white/10">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-slate-950/50 px-3 py-1 text-[11px] text-slate-200">
        Click a sun or moon to enter the course constellation.
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.38}
        maxZoom={1.55}
        onNodeClick={(_, node) => {
          const data = node.data as SolarNodeData
          onOpenCourse(data.courseId, data.conceptId)
        }}
        className="rounded-3xl"
      >
        <Background color="rgba(148, 163, 184, 0.2)" gap={50} size={1} />
        <Controls showInteractive={false} className="!border !border-white/10 !bg-[#06112a]/85" />
      </ReactFlow>
    </div>
  )
}

export default SolarLandingMap
