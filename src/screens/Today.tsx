import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Flame, School, Settings2 } from 'lucide-react'

import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ProgressRing } from '@/components/ui/Progress'
import { IconButton } from '@/components/ui/Button'
import { DayTimeline } from '@/components/home/DayTimeline'
import { NextUpCard } from '@/components/home/NextUpCard'
import { StatusStrip } from '@/components/home/StatusStrip'

import { useClock } from '@/hooks/useClock'
import { useAppStore } from '@/store/appStore'
import { useAgenda, useDayStatus, useMissingEssentials, useNow, useStreak } from '@/store/selectors'
import { formatLongDate, greeting } from '@/lib/date'
import { pickStable, plural } from '@/lib/utils'
import {
  COACH_AFTERNOON,
  COACH_ALL_DONE,
  COACH_BEHIND,
  COACH_EVENING,
  COACH_MORNING,
} from '@/data/coach'

/**
 * Painel principal. Ordem deliberada: primeiro o que fazer agora, depois o
 * panorama do dia, e só então o detalhe. O usuário deve conseguir parar de ler
 * após o primeiro card.
 */
export function Today() {
  const { minutes, date } = useClock()
  const profile = useAppStore((s) => s.profile)
  const agenda = useAgenda(date)
  const now = useNow(date, minutes)
  const status = useDayStatus(date)
  const streak = useStreak()
  const missing = useMissingEssentials()

  const coachLine = useMemo(() => {
    if (now.allDone) return pickStable(COACH_ALL_DONE, date)
    if (now.overdue.length >= 2) return pickStable(COACH_BEHIND, date)
    const hour = Math.floor(minutes / 60)
    if (hour < 12) return pickStable(COACH_MORNING, date)
    if (hour < 18) return pickStable(COACH_AFTERNOON, date)
    return pickStable(COACH_EVENING, date)
    // `minutes` muda a cada minuto, mas a frase só troca ao virar o período.
  }, [now.allDone, now.overdue.length, date, minutes])

  const firstName = profile.name.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ───────────────────────────────────── */}
      <header className="safe-top flex items-start justify-between gap-4 pt-2">
        <div className="min-w-0">
          {/* `capitalize` maiúsculiza cada palavra ("1 De Agosto"); só a primeira. */}
          <p className="text-[13px] font-medium text-ink-3 first-letter:uppercase">
            {formatLongDate(date)}
          </p>
          <h1 className="mt-0.5 text-[27px] leading-tight font-bold tracking-tight text-ink">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-snug text-ink-2">{coachLine}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ProgressRing
            value={now.progress}
            size={62}
            stroke={6}
            label={`${now.progress}%`}
            className="[&_span]:text-[15px]"
          />
        </div>
      </header>

      {/* ── Sequência ───────────────────────────────────── */}
      {streak > 0 && (
        <div className="flex items-center gap-2">
          <Chip color="var(--color-accent)" icon={<Flame size={12} />} size="md">
            {plural(streak, 'dia seguido', 'dias seguidos')}
          </Chip>
          <span className="text-[12px] text-ink-3">Não quebre agora.</span>
        </div>
      )}

      {/* ── O que fazer agora ───────────────────────────── */}
      <NextUpCard item={now.current} allDone={now.allDone} currentMinutes={minutes} />

      {/* ── Próximo passo ───────────────────────────────── */}
      {now.next && (
        <div className="flex items-center gap-2.5 px-1 text-[13px]">
          <span className="font-medium text-ink-3">Depois:</span>
          <span className="truncate text-ink-2">
            {now.next.label}
            {now.next.detail ? ` — ${now.next.detail}` : ''}
          </span>
          <span className="tnum ml-auto shrink-0 text-ink-3">{now.next.start}</span>
        </div>
      )}

      {/* ── Alertas acionáveis ──────────────────────────── */}
      {missing.length > 0 && (
        <Link to="/comida" className="block">
          <Card variant="flat" className="flex items-center gap-3 border-warn/20 py-3.5">
            <AlertTriangle size={18} className="shrink-0 text-warn" />
            <p className="min-w-0 flex-1 text-[13px] text-ink-2">
              <span className="font-semibold text-ink">
                {plural(missing.length, 'item base acabou', 'itens base acabaram')}
              </span>{' '}
              — {missing.map((m) => m.name).join(', ')}
            </p>
          </Card>
        </Link>
      )}

      {now.overdue.length > 0 && (
        <Card variant="flat" className="py-3.5">
          <p className="text-[13px] text-ink-2">
            <span className="font-semibold text-ink">
              {plural(now.overdue.length, 'bloco ficou para trás', 'blocos ficaram para trás')}
            </span>{' '}
            — marque como feito ou pulado na lista abaixo e siga em frente.
          </p>
        </Card>
      )}

      {/* ── Como foi a aula ─────────────────────────────── */}
      <Link to="/aula-real" className="block">
        <Card variant="flat" className="flex items-center gap-3 py-3.5">
          <School size={17} className="shrink-0 text-ink-3" />
          <p className="min-w-0 flex-1 text-[13px] text-ink-2">
            <span className="font-semibold text-ink">Como foi a aula hoje?</span> — o sistema
            reorganiza o cronograma a partir da resposta.
          </p>
        </Card>
      </Link>

      {/* ── Status do dia ───────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle>Status do dia</SectionTitle>
        <StatusStrip status={status} />
      </section>

      {/* ── Rotina completa ─────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          hint={`${now.doneCount} de ${now.totalCount} blocos concluídos`}
          action={
            <Link to="/rotina">
              <IconButton label="Ajustar rotina">
                <Settings2 size={17} />
              </IconButton>
            </Link>
          }
        >
          Rotina de hoje
        </SectionTitle>

        <Card className="px-2 py-2">
          <DayTimeline agenda={agenda} currentMinutes={minutes} currentId={now.current?.id} />
        </Card>
      </section>
    </div>
  )
}
