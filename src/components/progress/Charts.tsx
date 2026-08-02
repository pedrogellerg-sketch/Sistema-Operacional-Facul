import { cn } from '@/lib/utils'

interface BarChartProps {
  data: Array<{ label: string; value: number; highlight?: boolean }>
  /** Unidade exibida no topo da barra mais alta. */
  format?: (value: number) => string
  color?: string
  height?: number
  className?: string
}

/**
 * Gráfico de barras em CSS puro. Para uma série curta não compensa carregar
 * uma biblioteca — e assim o gráfico herda os tokens do design system.
 */
export function BarChart({
  data,
  format = (v) => String(v),
  color = 'var(--color-accent)',
  height = 120,
  className,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={cn('flex items-end gap-1.5', className)} style={{ height }}>
      {data.map((d, i) => {
        const ratio = d.value / max
        return (
          <div key={`${d.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md transition-[height] duration-700 ease-[var(--ease-out-quint)]"
                style={{
                  // Barra vazia vira um traço fino: comunica "zero", não "sem dado".
                  height: d.value === 0 ? 2 : `${Math.max(ratio * 100, 6)}%`,
                  backgroundColor: d.value === 0 ? 'var(--color-surface-3)' : color,
                  opacity: d.highlight === false ? 0.35 : 1,
                }}
                title={`${d.label}: ${format(d.value)}`}
              />
            </div>
            <span className="w-full truncate text-center text-[10px] text-ink-3">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

interface StatTileProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
  className?: string
}

export function StatTile({ label, value, sub, accent, className }: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line-soft bg-surface px-4 py-3.5',
        accent && 'border-accent/20',
        className,
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">{label}</p>
      <p
        className={cn(
          'tnum mt-1.5 text-[26px] leading-none font-bold tracking-tight',
          accent ? 'text-accent' : 'text-ink',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11.5px] text-ink-3">{sub}</p>}
    </div>
  )
}

interface SparklineProps {
  values: number[]
  color?: string
  height?: number
  className?: string
}

/** Linha de tendência — usada para o peso corporal. */
export function Sparkline({
  values,
  color = 'var(--color-accent)',
  height = 56,
  className,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center text-[12px] text-ink-3', className)}
        style={{ height }}
      >
        Registre ao menos dois pesos para ver a tendência.
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  // Range mínimo evita que variações de 100g virem uma montanha.
  const range = Math.max(max - min, 1)

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100
    const y = 100 - ((v - min) / range) * 100
    return `${x},${y}`
  })

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
