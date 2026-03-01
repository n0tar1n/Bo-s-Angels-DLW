import type { NodeProps } from 'reactflow'

interface LandingMoonNodeData {
  label: string
  glow: string
}

const LandingMoonNode = ({ data, selected }: NodeProps<LandingMoonNodeData>) => {
  return (
    <div className="group relative h-8 w-8">
      <div
        className={`absolute left-1/2 top-1/2 rounded-full border border-white/30 transition ${selected ? 'h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2' : 'h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 group-hover:h-3.5 group-hover:w-3.5'}`}
        style={{ backgroundColor: data.glow, boxShadow: `0 0 11px ${data.glow}` }}
      />
      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-44 -translate-x-1/2 rounded-md border border-white/15 bg-[#0b1530]/95 px-2 py-1 text-[11px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100">
        {data.label}
      </div>
    </div>
  )
}

export default LandingMoonNode
