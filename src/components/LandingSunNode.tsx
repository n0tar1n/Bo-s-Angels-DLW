import type { NodeProps } from 'reactflow'

interface LandingSunNodeData {
  label: string
}

const LandingSunNode = ({ data, selected }: NodeProps<LandingSunNodeData>) => {
  return (
    <div className="group relative h-24 w-24">
      <div
        className={`absolute inset-0 rounded-full border border-amber-100/35 bg-[radial-gradient(circle_at_30%_30%,#fff7c2,#f59e0b_40%,#ea580c_78%,#7c2d12_100%)] transition ${selected ? 'scale-[1.05]' : 'scale-100'}`}
        style={{ boxShadow: '0 0 35px rgba(245, 158, 11, 0.45), 0 0 80px rgba(251, 146, 60, 0.25)' }}
      />
      <div className="absolute inset-[-16px] rounded-full border border-amber-100/15" />

      <div className="pointer-events-none absolute left-1/2 top-full mt-3 w-44 -translate-x-1/2 text-center">
        <p className="line-clamp-2 text-sm font-medium text-slate-100/95">{data.label}</p>
      </div>
    </div>
  )
}

export default LandingSunNode
