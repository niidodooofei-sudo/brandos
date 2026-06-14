import type { ScoreBreakdown } from '@/types'

interface ScoreBreakdownPanelProps {
  breakdown: ScoreBreakdown
}

const dimensions = [
  { key: 'colors' as const, label: 'Colors', max: 20 },
  { key: 'typography' as const, label: 'Typography', max: 20 },
  { key: 'logo' as const, label: 'Logo Clearance', max: 20 },
  { key: 'spacing' as const, label: 'Spacing', max: 20 },
  { key: 'tone' as const, label: 'Tone & Voice', max: 20 },
]

export function ScoreBreakdownPanel({ breakdown }: ScoreBreakdownPanelProps) {
  return (
    <div className="space-y-2">
      {dimensions.map((dim) => {
        const val = breakdown[dim.key]
        const pct = (val / dim.max) * 100
        return (
          <div key={dim.key}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-neutral-600">{dim.label}</span>
              <span className={pct >= 85 ? 'text-green-600' : pct >= 70 ? 'text-yellow-600' : 'text-red-500'}>
                {val}/{dim.max}
              </span>
            </div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  pct >= 85 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
