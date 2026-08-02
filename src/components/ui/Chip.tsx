import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChipProps {
  children: ReactNode
  color?: string
  className?: string
  icon?: ReactNode
  size?: 'sm' | 'md'
}

/** Etiqueta informativa. `color` tinge fundo, borda e texto de forma coerente. */
export function Chip({ children, color, className, icon, size = 'sm' }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        className,
      )}
      style={
        color
          ? {
              backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
              color,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 24%, transparent)`,
            }
          : undefined
      }
    >
      {icon}
      {children}
    </span>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

/** Alternador de poucas opções — melhor que dropdown no celular. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'md',
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex w-full gap-1 rounded-2xl border border-line-soft bg-surface-2 p-1',
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 rounded-xl font-medium transition-colors duration-150',
              size === 'sm' ? 'px-2 py-1.5 text-[12px]' : 'px-3 py-2 text-[13px]',
              active ? 'bg-accent text-accent-ink' : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-2.5 text-left transition-colors hover:bg-surface-2"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] text-ink-3">{description}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-accent' : 'bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-[var(--ease-out-quint)]',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

interface WeekdayPickerProps {
  value: number[]
  onChange: (days: number[]) => void
  /** Rótulos começando no domingo, como `Date.getDay()`. */
  labels?: string[]
}

/** Seletor de dias da semana — exibido de segunda a domingo. */
export function WeekdayPicker({ value, onChange, labels }: WeekdayPickerProps) {
  const order = [1, 2, 3, 4, 5, 6, 0]
  const letters = labels ?? ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div className="flex gap-1.5">
      {order.map((day) => {
        const active = value.includes(day)
        return (
          <button
            key={day}
            onClick={() =>
              onChange(active ? value.filter((d) => d !== day) : [...value, day].sort())
            }
            aria-pressed={active}
            className={cn(
              'h-10 flex-1 rounded-xl text-[13px] font-semibold transition-colors',
              active
                ? 'bg-accent text-accent-ink'
                : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2',
            )}
          >
            {letters[day]}
          </button>
        )
      })}
    </div>
  )
}
