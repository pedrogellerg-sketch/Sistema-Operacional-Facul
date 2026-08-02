import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { IconButton } from '@/components/ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  back?: boolean | string
}

export function PageHeader({ title, subtitle, action, back }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="safe-top mb-5 flex items-start gap-3 pt-2">
      {back && (
        <IconButton
          label="Voltar"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="-ml-2 mt-0.5"
        >
          <ChevronLeft size={20} />
        </IconButton>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-2">{subtitle}</p>}
      </div>

      {action && <div className="mt-1 shrink-0">{action}</div>}
    </header>
  )
}
