import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui/Button'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  /** Rodapé fixo — onde ficam as ações principais. */
  footer?: ReactNode
  className?: string
}

/**
 * Bottom sheet no celular, diálogo centralizado no desktop.
 * Fecha com Esc, clique no fundo e trava o scroll da página enquanto aberto.
 */
export function Sheet({ open, onClose, title, description, children, footer, className }: SheetProps) {
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-surface',
          'rounded-t-[28px] border-t border-line sm:max-w-lg sm:rounded-[28px] sm:border',
          'animate-in-up',
          className,
        )}
      >
        {/* Puxador visual do bottom sheet — some no desktop. */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-surface-3" />
        </div>

        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-bold text-ink">{title}</h2>}
              {description && <p className="mt-1 text-[13px] text-ink-2">{description}</p>}
            </div>
            <IconButton label="Fechar" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>

        {footer && (
          <div className="safe-bottom border-t border-line-soft bg-surface px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 text-ink-3">{icon}</div>}
      <p className="text-sm font-semibold text-ink-2">{title}</p>
      {description && <p className="mt-1.5 max-w-xs text-[13px] text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
