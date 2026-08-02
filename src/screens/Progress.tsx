import { useMemo, useState } from 'react'
import { Flame, Moon, Scale, TrendingUp } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { Sheet } from '@/components/ui/Sheet'
import { NumberStepper } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'
import { BarChart, Sparkline, StatTile } from '@/components/progress/Charts'

import { useAppStore } from '@/store/appStore'
import { useDayLog, useStreak, useWeekStats } from '@/store/selectors'
import { computeBestStreak, studyBySubject, studySeries } from '@/lib/statsEngine'
import { WEEKDAY_SHORT, formatDuration, formatShortDate, fromISODate, todayISO } from '@/lib/date'
import { pct, pickStable, plural } from '@/lib/utils'
import { COACH_STREAK } from '@/data/coach'

/**
 * Acompanhamento. A hierarquia é intencional: consistência primeiro, número
 * absoluto depois. O que o produto quer reforçar é a sequência, não o recorde.
 */
export function Progress() {
  const logs = useAppStore((s) => s.logs)
  const subjects = useAppStore((s) => s.subjects)
  const weights = useAppStore((s) => s.weights)
  const profile = useAppStore((s) => s.profile)
  const setWeight = useAppStore((s) => s.setWeight)
  const setSleepHours = useAppStore((s) => s.setSleepHours)

  const streak = useStreak()
  const week = useWeekStats()
  const todayLog = useDayLog()

  const [weightOpen, setWeightOpen] = useState(false)
  const [sleepOpen, setSleepOpen] = useState(false)
  const [weightDraft, setWeightDraft] = useState(
    () => weights.at(-1)?.kg ?? profile.startWeightKg ?? 70,
  )
  const [sleepDraft, setSleepDraft] = useState(() => todayLog?.sleepHours ?? 8)

  const bestStreak = useMemo(() => computeBestStreak(logs), [logs])
  const series = useMemo(() => studySeries(logs, 14), [logs])
  const bySubject = useMemo(() => studyBySubject(logs, subjects, 30), [logs, subjects])

  const lastWeight = weights.at(-1)
  const weightDelta =
    lastWeight && profile.startWeightKg != null
      ? Math.round((lastWeight.kg - profile.startWeightKg) * 10) / 10
      : null

  const studyHours = Math.round((week.studyMinutes / 60) * 10) / 10
  const maxSubjectCount = Math.max(...bySubject.map((b) => b.count), 1)

  return (
    <div className="space-y-6">
      <PageHeader title="Progresso" subtitle="Consistência primeiro. O resto é consequência." />

      {/* ── Sequência ───────────────────────────────────── */}
      <Card variant="accent" className="flex items-center gap-5 p-5">
        <ProgressRing
          value={pct(week.daysActive, 7)}
          size={92}
          stroke={8}
          label={String(streak)}
          sublabel="dias"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-accent" />
            <p className="text-[12px] font-bold tracking-[0.14em] text-accent uppercase">
              Sequência
            </p>
          </div>

          <p className="mt-1.5 text-[15px] leading-snug font-semibold text-ink">
            {streak === 0
              ? 'Comece hoje. Um dia já é sequência.'
              : `${plural(streak, 'dia seguido', 'dias seguidos')} de execução.`}
          </p>

          <p className="mt-1 text-[12.5px] text-ink-2">
            {streak > 0 ? pickStable(COACH_STREAK, todayISO()) : 'Estudo ou treino já contam o dia.'}
          </p>

          {bestStreak > 0 && (
            <p className="tnum mt-2 text-[11.5px] text-ink-3">Seu recorde: {bestStreak} dias</p>
          )}
        </div>
      </Card>

      {/* ── Números da semana ───────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Segunda a domingo desta semana">Semana</SectionTitle>

        <div className="grid grid-cols-2 gap-2.5">
          <StatTile
            label="Treinos"
            value={`${week.workouts}/${week.workoutTarget}`}
            sub={
              week.workouts >= week.workoutTarget
                ? 'Meta batida'
                : `Faltam ${week.workoutTarget - week.workouts}`
            }
            accent={week.workouts >= week.workoutTarget}
          />
          <StatTile
            label="Horas de estudo"
            value={`${studyHours}h`}
            sub={`${week.exercises} exercícios`}
          />
          <StatTile
            label="Matérias"
            value={String(week.subjectsStudied.length)}
            sub="estudadas na semana"
          />
          <StatTile
            label="Refeições"
            value={`${week.mealsDone}/${week.mealsTotal}`}
            sub={`${pct(week.mealsDone, week.mealsTotal)}% marcadas`}
          />
        </div>
      </section>

      {/* ── Estudo por dia ──────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Últimos 14 dias">Ritmo de estudo</SectionTitle>

        <Card>
          <BarChart
            data={series.map((d) => ({
              label: WEEKDAY_SHORT[fromISODate(d.date).getDay()].slice(0, 1),
              value: d.minutes,
            }))}
            format={formatDuration}
            height={110}
          />
          <p className="tnum mt-3 text-center text-[12px] text-ink-3">
            Média de {formatDuration(Math.round(series.reduce((a, b) => a + b.minutes, 0) / 14))} por dia
          </p>
        </Card>
      </section>

      {/* ── Onde o tempo foi ────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Sessões nos últimos 30 dias">Distribuição por matéria</SectionTitle>

        <Card className="space-y-2.5">
          {bySubject.slice(0, 8).map(({ subject, count }) => (
            <div key={subject.id}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[13px] font-medium text-ink">{subject.name}</span>
                <span className="tnum text-[12px] text-ink-3">
                  {count === 0 ? '—' : plural(count, 'sessão', 'sessões')}
                </span>
              </div>
              <ProgressBar value={count} max={maxSubjectCount} color={subject.color} />
            </div>
          ))}
        </Card>
      </section>

      {/* ── Corpo ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle>Corpo e recuperação</SectionTitle>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">Peso</p>
                <p className="tnum mt-1.5 text-[26px] leading-none font-bold text-ink">
                  {lastWeight ? `${lastWeight.kg} kg` : '—'}
                </p>
                {weightDelta != null && weightDelta !== 0 && (
                  <p
                    className="tnum mt-1.5 flex items-center gap-1 text-[12px]"
                    style={{ color: weightDelta > 0 ? 'var(--color-ok)' : 'var(--color-ink-2)' }}
                  >
                    <TrendingUp size={12} />
                    {weightDelta > 0 ? '+' : ''}
                    {weightDelta} kg desde o início
                  </p>
                )}
              </div>
              <Scale size={18} className="shrink-0 text-ink-3" />
            </div>

            <Sparkline values={weights.map((w) => w.kg)} className="mt-3" />

            {weights.length >= 2 && (
              <p className="tnum mt-1 flex justify-between text-[10.5px] text-ink-3">
                <span>{formatShortDate(weights[0].date)}</span>
                <span>{formatShortDate(weights.at(-1)!.date)}</span>
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              full
              className="mt-3"
              onClick={() => {
                setWeightDraft(lastWeight?.kg ?? 70)
                setWeightOpen(true)
              }}
            >
              Registrar peso
            </Button>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">
                  Sono (média)
                </p>
                <p className="tnum mt-1.5 text-[26px] leading-none font-bold text-ink">
                  {week.avgSleep != null ? `${week.avgSleep}h` : '—'}
                </p>
                <p className="mt-1.5 text-[12px] text-ink-3">
                  {week.avgSleep == null
                    ? 'Sem registro esta semana'
                    : week.avgSleep >= 7.5
                      ? 'Bom. Mantenha.'
                      : 'Abaixo do ideal para ganho de massa.'}
                </p>
              </div>
              <Moon size={18} className="shrink-0 text-ink-3" />
            </div>

            <div className="mt-3">
              <ProgressBar
                value={week.avgSleep ?? 0}
                max={9}
                color="var(--color-dom-sleep)"
                height="md"
              />
              <p className="mt-1.5 text-[10.5px] text-ink-3">Meta: 8h por noite</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              full
              className="mt-3"
              onClick={() => {
                setSleepDraft(todayLog?.sleepHours ?? 8)
                setSleepOpen(true)
              }}
            >
              Registrar sono
            </Button>
          </Card>
        </div>
      </section>

      {/* ── Registros ───────────────────────────────────── */}
      <Sheet
        open={weightOpen}
        onClose={() => setWeightOpen(false)}
        title="Registrar peso"
        description="Pese-se sempre no mesmo horário, de preferência de manhã."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              setWeight(weightDraft)
              setWeightOpen(false)
            }}
          >
            Salvar
          </Button>
        }
      >
        <NumberStepper
          value={weightDraft}
          onChange={setWeightDraft}
          step={0.1}
          min={30}
          max={200}
          suffix="kg"
        />
      </Sheet>

      <Sheet
        open={sleepOpen}
        onClose={() => setSleepOpen(false)}
        title="Quantas horas você dormiu?"
        description="Sono é onde o músculo cresce e a memória consolida."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              setSleepHours(sleepDraft)
              setSleepOpen(false)
            }}
          >
            Salvar
          </Button>
        }
      >
        <NumberStepper
          value={sleepDraft}
          onChange={setSleepDraft}
          step={0.5}
          min={0}
          max={14}
          suffix="horas"
        />
      </Sheet>
    </div>
  )
}
