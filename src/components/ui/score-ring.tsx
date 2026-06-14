'use client'

import { cn, getScoreColor } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
}

export function ScoreRing({ score, size = 64, strokeWidth = 5, className, showLabel = true }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 90 ? '#22c55e' :
    score >= 75 ? '#eab308' :
    score >= 60 ? '#f97316' :
    '#ef4444'

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      {showLabel && (
        <span className={cn('absolute font-bold', getScoreColor(score))} style={{ fontSize: size < 48 ? 11 : 14 }}>
          {score}
        </span>
      )}
    </div>
  )
}
