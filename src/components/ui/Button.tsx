import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  full?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:bg-accent/90 active:bg-accent-dim font-semibold',
  secondary: 'bg-surface-3 text-ink hover:bg-surface-3/80 active:bg-surface-2',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
  outline: 'bg-transparent text-ink border border-line hover:border-ink-3 hover:bg-surface-2',
  danger: 'bg-danger/12 text-danger border border-danger/25 hover:bg-danger/20',
}

const SIZES: Record<Size, string> = {
  // Alturas mínimas de 44px: alvo de toque confortável no celular.
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm gap-2 rounded-2xl',
  lg: 'h-14 px-6 text-base gap-2.5 rounded-2xl',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  full,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-colors duration-150 select-none',
        'disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: o botão é só ícone, precisa de nome acessível. */
  label: string
  children: ReactNode
  variant?: Variant
}

export function IconButton({ label, children, variant = 'ghost', className, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors',
        'disabled:opacity-40 disabled:pointer-events-none active:scale-95',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
