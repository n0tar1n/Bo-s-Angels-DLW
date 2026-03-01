interface FlowchartOverviewProps {
  onEnterGalaxy: () => void
}

const steps = [
  '1) Select Course',
  '2) Zoom into Course Map',
  '3) Select Concept Star',
  '4) Explain to AI (first attempt) -> Evaluation',
  '5) Targeted MCQ Quiz -> Update Mastery',
  '6) Revisit later -> Decay if inactive',
]

const FlowchartOverview = ({ onEnterGalaxy }: FlowchartOverviewProps) => {
  return (
    <section className="constellation-bg relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
      <div className="galaxy-swirl" aria-hidden />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Overview</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Learning Journey Flow</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            This flowchart summarizes how learners move from course selection to concept practice, evaluation, quizzes, and long-term retention tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={onEnterGalaxy}
          className="rounded-full border border-cyan-300/45 bg-cyan-300/15 px-5 py-2.5 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-300/25"
        >
          Enter Galaxy
        </button>
      </div>

      <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step} className="rounded-2xl border border-white/12 bg-[#0c1528]/70 p-4">
            <p className="text-sm leading-relaxed text-slate-100">{step}</p>
            {index < steps.length - 1 && (
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-cyan-200/70">Then</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default FlowchartOverview
