import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  /** `accent` reserva o destaque para o card de ação principal. */
  variant?: 'default' | 'accent' | 'flat'
  as?: 'div' | 'section' | 'article'
}

export function Card({ children, className, variant = 'default', as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-card)] p-4',
        variant === 'default' && 'bg-surface border border-line-soft card-shadow',
        variant === 'accent' && 'bg-surface-2 border border-transparent glow-accent',
        variant === 'flat' && 'bg-surface-2/60 border border-line-soft',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

interface SectionTitleProps {
  children: ReactNode
  action?: ReactNode
  hint?: string
  className?: string
}

export function SectionTitle({ children, action, hint, className }: SectionTitleProps) {
  return (
    <div className={cn('flex items-end justify-between gap-3 px-1', className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
          {children}
        </h2>
        {hint && <p className="mt-1 text-[13px] text-ink-3">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
