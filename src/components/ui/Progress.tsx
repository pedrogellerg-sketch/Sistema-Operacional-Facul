import { cn } from '@/lib/utils'
import { clamp } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  color?: string
  height?: 'sm' | 'md'
}

export function ProgressBar({ value, max = 100, className, color, height = 'sm' }: ProgressBarProps) {
  const percent = max <= 0 ? 0 : clamp((value / max) * 100, 0, 100)

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-3',
        height === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-quint)]"
        style={{ width: `${percent}%`, backgroundColor: color ?? 'var(--color-accent)' }}
      />
    </div>
  )
}

interface RingProps {
  value: number
  size?: number
  stroke?: number
  color?: string
  label?: string
  sublabel?: string
  className?: string
}

/** Anel de progresso em SVG — sem dependência de gráfico para um único número. */
export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  color = 'var(--color-accent)',
  label,
  sublabel,
  className,
}: RingProps) {
  const percent = clamp(value, 0, 100)
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out-quint)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="tnum text-xl leading-none font-bold">{label}</span>}
        {sublabel && <span className="mt-1 text-[10px] tracking-wide text-ink-3 uppercase">{sublabel}</span>}
      </div>
    </div>
  )
}
