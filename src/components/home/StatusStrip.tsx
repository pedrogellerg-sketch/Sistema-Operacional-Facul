import { Link } from 'react-router-dom'
import { Apple, Brain, Dumbbell, Moon, School } from 'lucide-react'

import type { DayStatus } from '@/lib/agendaEngine'
import { cn } from '@/lib/utils'

interface StatusStripProps {
  status: DayStatus
}

interface Tile {
  key: string
  icon: typeof School
  label: string
  value: string
  tone: 'ok' | 'pending' | 'off' | 'warn'
  to: string
}

const TONE: Record<Tile['tone'], string> = {
  ok: 'text-ok',
  pending: 'text-ink-2',
  warn: 'text-warn',
  off: 'text-ink-3',
}

/** Faixa de status do dia: cinco domínios, uma olhada. */
export function StatusStrip({ status }: StatusStripProps) {
  const tiles: Tile[] = [
    {
      key: 'escola',
      icon: School,
      label: 'Escola',
      value:
        status.school === 'nao_hoje' ? '—' : status.school === 'feito' ? 'Feita' : 'Hoje',
      tone: status.school === 'feito' ? 'ok' : status.school === 'nao_hoje' ? 'off' : 'pending',
      to: '/rotina',
    },
    {
      key: 'treino',
      icon: Dumbbell,
      label: 'Treino',
      value:
        status.workout === 'nao_hoje'
          ? 'Folga'
          : status.workout === 'feito'
            ? 'Feito'
            : status.workout === 'pulado'
              ? 'Pulado'
              : 'Hoje',
      tone:
        status.workout === 'feito'
          ? 'ok'
          : status.workout === 'pulado'
            ? 'warn'
            : status.workout === 'nao_hoje'
              ? 'off'
              : 'pending',
      to: '/treino',
    },
    {
      key: 'estudo',
      icon: Brain,
      label: 'Estudo',
      value: status.study.total === 0 ? '—' : `${status.study.done}/${status.study.total}`,
      tone:
        status.study.total === 0
          ? 'off'
          : status.study.done >= status.study.total
            ? 'ok'
            : 'pending',
      to: '/estudos',
    },
    {
      key: 'comida',
      icon: Apple,
      label: 'Comida',
      value: `${status.meals.done}/${status.meals.total}`,
      tone: status.meals.done >= status.meals.total ? 'ok' : 'pending',
      to: '/comida',
    },
    {
      key: 'sono',
      icon: Moon,
      label: 'Sono',
      value: status.sleep != null ? `${status.sleep}h` : '—',
      tone: status.sleep == null ? 'off' : status.sleep >= 7 ? 'ok' : 'warn',
      to: '/progresso',
    },
  ]

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {tiles.map(({ key, icon: Icon, label, value, tone, to }) => (
        <Link
          key={key}
          to={to}
          className="flex min-w-[86px] flex-1 flex-col items-start gap-1.5 rounded-2xl border border-line-soft bg-surface px-3 py-3 transition-colors hover:border-line hover:bg-surface-2"
        >
          <Icon size={16} className={cn('shrink-0', TONE[tone])} />
          <span className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">
            {label}
          </span>
          <span className={cn('tnum text-sm font-bold', tone === 'off' ? 'text-ink-3' : 'text-ink')}>
            {value}
          </span>
        </Link>
      ))}
    </div>
  )
}
