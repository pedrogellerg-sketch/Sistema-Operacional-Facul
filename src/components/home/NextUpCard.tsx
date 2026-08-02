import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, CheckCircle2, SkipForward } from 'lucide-react'

import type { AgendaItem } from '@/types'
import { BlockIcon, blockColor } from '@/components/ui/BlockIcon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatDuration, relativeToNow } from '@/lib/date'
import { useAppStore } from '@/store/appStore'

interface NextUpCardProps {
  item: AgendaItem | null
  allDone: boolean
  currentMinutes: number
}

/**
 * O card mais importante do app: o único lugar que o usuário precisa olhar
 * para saber o que fazer. Uma ação primária, sem competição visual.
 */
export function NextUpCard({ item, allDone, currentMinutes }: NextUpCardProps) {
  const navigate = useNavigate()
  const setBlockState = useAppStore((s) => s.setBlockState)

  if (allDone || !item) {
    return (
      <Card variant="flat" className="flex items-center gap-4 py-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ok/12 text-ok">
          <CheckCircle2 size={24} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold text-ink">Dia fechado</p>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Você executou tudo que estava no plano. Descanse.
          </p>
        </div>
      </Card>
    )
  }

  const color = blockColor(item.kind)
  const timing = relativeToNow(item.start, currentMinutes)
  const isPassive = item.kind === 'escola' || item.kind === 'dormir'

  return (
    <Card variant="accent" className="relative overflow-hidden p-5">
      {/* Halo sutil na cor do domínio — dá identidade sem poluir. */}
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: color }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Agora
          </span>
          <span className="h-1 w-1 rounded-full bg-ink-3" />
          <span className="tnum text-[12px] font-medium text-ink-2">
            {item.start} · {timing}
          </span>
        </div>

        <div className="mt-3 flex items-start gap-3.5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
              color,
            }}
          >
            <BlockIcon kind={item.kind} size={22} />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-[22px] leading-tight font-bold tracking-tight text-ink">
              {item.label}
            </h2>
            {item.detail && (
              <p className="mt-1 text-[13px] leading-snug text-ink-2">{item.detail}</p>
            )}
            {item.minutes > 0 && (
              <p className="tnum mt-2 text-[12px] font-medium text-ink-3">
                {formatDuration(item.minutes)} · termina {item.end}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/agora')}
            icon={<ArrowRight size={18} />}
          >
            {isPassive ? 'Abrir foco' : 'Começar'}
          </Button>

          <Button
            variant="secondary"
            size="lg"
            aria-label="Marcar como concluído"
            title="Marcar como concluído"
            className="w-14 px-0"
            onClick={() => setBlockState(item.id, 'feito')}
          >
            <Check size={20} />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            aria-label="Pular este bloco"
            title="Pular este bloco"
            className="w-14 px-0"
            onClick={() => setBlockState(item.id, 'pulado')}
          >
            <SkipForward size={18} />
          </Button>
        </div>
      </div>
    </Card>
  )
}
