import { useMemo } from 'react'
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node } from 'reactflow'
import { buildConstellationElements } from '../lib/graphLayout'
import StarNode from './StarNode'
import type { ConceptEdge, ConceptNode } from '../types'

interface GraphConcept extends ConceptNode {
  effectiveMastery: number | null
  rustLevel: number
  isDecaying: boolean
}

interface ConstellationGraphProps {
  courseId: string
  concepts: GraphConcept[]
  edges: ConceptEdge[]
  selectedConceptId: string | null
  onSelectConcept: (conceptId: string) => void
}

const nodeTypes = {
  star: StarNode,
}

const ConstellationGraph = ({ courseId, concepts, edges, selectedConceptId, onSelectConcept }: ConstellationGraphProps) => {
  const { nodes, edges: graphEdges } = useMemo(() => {
    const elements = buildConstellationElements(courseId, concepts, edges)

    const selectedNodes: Node[] = elements.nodes.map((node) => ({
      ...node,
      selected: node.id === selectedConceptId,
    }))

    const restyledEdges: Edge[] = elements.edges.map((edge) => ({
      ...edge,
      style:
        edge.target === selectedConceptId || edge.source === selectedConceptId
          ? {
              ...(edge.style ?? {}),
              stroke: 'rgba(186, 230, 253, 0.62)',
              strokeWidth: 1.5,
              filter: 'drop-shadow(0 0 8px rgba(125,211,252,0.38))',
            }
          : edge.style,
    }))

    return {
      nodes: selectedNodes,
      edges: restyledEdges,
    }
  }, [concepts, courseId, edges, selectedConceptId])

  return (
    <div className="constellation-bg relative h-[76vh] min-h-[560px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[inset_0_0_180px_rgba(8,47,73,0.35)]">
      <div className="galaxy-swirl" aria-hidden />
      <ReactFlow
        nodes={nodes}
        edges={graphEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, includeHiddenNodes: true }}
        minZoom={0.28}
        maxZoom={1.9}
        onNodeClick={(_, node) => onSelectConcept(node.id)}
        className="rounded-3xl"
      >
        <Background color="rgba(148, 163, 184, 0.18)" gap={52} size={1} />
        <MiniMap
          pannable
          zoomable
          style={{ background: 'rgba(2, 6, 23, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)' }}
          nodeColor={() => 'rgba(125, 211, 252, 0.65)'}
          maskColor="rgba(2, 6, 23, 0.58)"
        />
        <Controls showInteractive={false} className="!border !border-white/10 !bg-[#06112a]/85" />
      </ReactFlow>
    </div>
  )
}

export default ConstellationGraph
