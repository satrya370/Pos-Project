interface ProgressBarProps {
  value: number // 0-100
  className?: string
  color?: string
}

export function ProgressBar({ value, className = '', color = 'bg-primary' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`w-full bg-gray-100 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${clamped >= 100 ? 'bg-success' : color}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
