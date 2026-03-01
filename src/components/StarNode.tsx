import { Handle, Position, type NodeProps } from 'reactflow'
import { masteryToColor } from '../lib/mastery'

interface StarNodeData {
  label: string
  mastery: number | null
  rustLevel: number
  isDecaying: boolean
  summary: string
  labelOffsetX: number
  labelOffsetY: number
}

const handleClass = '!h-1.5 !w-1.5 !border-0 !bg-transparent'

const StarNode = ({ data, selected }: NodeProps<StarNodeData>) => {
  const color = masteryToColor(data.mastery)

  return (
    <div className="group relative h-11 w-11">
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Handle type="target" position={Position.Top} className={handleClass} />
      <Handle type="target" position={Position.Bottom} className={handleClass} />
      <Handle type="source" position={Position.Right} className={handleClass} />
      <Handle type="source" position={Position.Top} className={handleClass} />
      <Handle type="source" position={Position.Bottom} className={handleClass} />

      <div
        className={`absolute left-1/2 top-1/2 rounded-full border border-white/30 transition ${selected ? 'h-4.5 w-4.5 -translate-x-1/2 -translate-y-1/2' : 'h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 group-hover:h-4 group-hover:w-4'}`}
        style={{
          backgroundColor: color,
          boxShadow: selected ? `0 0 14px ${color}, 0 0 30px ${color}99` : `0 0 10px ${color}cc`,
          opacity: data.isDecaying ? 0.72 : 0.96,
        }}
      />

      {data.isDecaying && (
        <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/30" />
      )}

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-max max-w-40 rounded-md border border-white/12 bg-[#0a1228]/70 px-1.5 py-0.5 text-[11px] leading-tight text-slate-300/90 shadow-sm whitespace-normal"
        style={{ transform: `translate(calc(-50% + ${data.labelOffsetX}px), calc(-50% + ${data.labelOffsetY}px))` }}
      >
        {data.label}
      </div>
    </div>
  )
}

export default StarNode
