import { Handle, Position, type NodeProps } from 'reactflow'
import { masteryToColor } from '../lib/mastery'

interface OrbitNodeData {
  label: string
  mastery: number | null
  rustLevel: number
  isDecaying: boolean
  summary: string
  variant: 'sun' | 'moon'
  moduleName: string
}

const edgeHandleClass = '!h-2 !w-2 !border-0 !bg-transparent'

const OrbitNode = ({ data, selected }: NodeProps<OrbitNodeData>) => {
  const masteryColor = masteryToColor(data.mastery)
  const masteryText = data.mastery === null ? 'Not started' : `${Math.round(data.mastery * 100)}%`

  const sun = data.variant === 'sun'

  if (sun) {
    return (
      <div className="group relative h-44 w-44">
        <Handle type="target" position={Position.Left} className={edgeHandleClass} />
        <Handle type="target" position={Position.Top} className={edgeHandleClass} />
        <Handle type="target" position={Position.Bottom} className={edgeHandleClass} />
        <Handle type="source" position={Position.Right} className={edgeHandleClass} />
        <Handle type="source" position={Position.Top} className={edgeHandleClass} />
        <Handle type="source" position={Position.Bottom} className={edgeHandleClass} />

        <div
          className={`absolute inset-0 rounded-full border border-amber-200/30 bg-[radial-gradient(circle_at_30%_30%,#fff8cc,#fbbf24_35%,#f97316_72%,#7c2d12_100%)] transition ${selected ? 'scale-[1.04]' : 'scale-100'}`}
          style={{ boxShadow: `0 0 34px ${masteryColor}66, 0 0 70px rgba(251, 146, 60, 0.3)` }}
        />
        <div className="absolute inset-[-14px] rounded-full border border-amber-100/25" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-slate-950">{data.label}</p>
          <p className="mt-1 rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] font-medium text-slate-100">{masteryText}</p>
          {data.isDecaying && <p className="mt-1 text-[10px] font-semibold text-rose-950">Rust +{Math.round(data.rustLevel * 100)}%</p>}
        </div>

        <div
          className={`pointer-events-none absolute -top-2 left-1/2 z-20 w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-white/15 bg-[#0b1533] p-3 text-xs text-slate-100 opacity-0 shadow-xl transition group-hover:opacity-100 ${selected ? 'opacity-100' : ''}`}
        >
          <p className="font-semibold text-amber-100">Module Sun: {data.label}</p>
          <p className="mt-1 text-slate-200">{data.summary}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group relative w-[186px] rounded-2xl border px-3 py-2 backdrop-blur-sm transition ${selected ? 'border-cyan-300/55 bg-cyan-200/15' : 'border-white/15 bg-[#08142f]/88'}`}
    >
      <Handle type="target" position={Position.Left} className={edgeHandleClass} />
      <Handle type="target" position={Position.Top} className={edgeHandleClass} />
      <Handle type="source" position={Position.Right} className={edgeHandleClass} />
      <Handle type="source" position={Position.Bottom} className={edgeHandleClass} />

      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="h-3 w-3 rounded-full border border-white/25" style={{ backgroundColor: masteryColor, boxShadow: `0 0 14px ${masteryColor}` }} />
        <p className="text-[10px] uppercase tracking-[0.13em] text-slate-300">Moon</p>
      </div>
      <p className="line-clamp-2 text-[13px] font-semibold leading-tight text-slate-100">{data.label}</p>
      <p className="mt-1 text-[11px] text-slate-300">{masteryText}</p>

      {data.isDecaying && (
        <span className="mt-2 inline-block rounded-full border border-amber-300/30 bg-amber-200/10 px-2 py-0.5 text-[10px] text-amber-100">
          Rust {Math.round(data.rustLevel * 100)}%
        </span>
      )}

      <div
        className={`pointer-events-none absolute -top-2 left-1/2 z-20 w-60 -translate-x-1/2 -translate-y-full rounded-lg border border-white/15 bg-[#0b1533] p-3 text-xs text-slate-100 opacity-0 shadow-xl transition group-hover:opacity-100 ${selected ? 'opacity-100' : ''}`}
      >
        <p className="font-semibold text-cyan-100">{data.label}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">Orbits {data.moduleName}</p>
        <p className="mt-1 text-slate-200">{data.summary}</p>
      </div>
    </div>
  )
}

export default OrbitNode
