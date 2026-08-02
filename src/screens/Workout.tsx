import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Dumbbell, Flame, RefreshCw, Zap } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ProgressBar } from '@/components/ui/Progress'
import { Sheet } from '@/components/ui/Sheet'
import { TextArea } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { useAgenda, useTodayWorkout } from '@/store/selectors'
import { LOW_MOTIVATION_STEPS, PRE_WORKOUT_CHECKLIST } from '@/data/workouts'
import { COACH_WORKOUT } from '@/data/coach'
import { WEEKDAY_SHORT, formatDuration, todayISO, weekDates, weekdayOf } from '@/lib/date'
import { cn, pickStable, plural } from '@/lib/utils'

/**
 * Treino. A tela é desenhada em torno de um problema específico: o dia em que
 * a pessoa não quer ir. Por isso o modo baixa motivação tem peso igual ao
 * registro de carga.
 */
export function Workout() {
  const [params, setParams] = useSearchParams()
  const { template, isWorkoutDay } = useTodayWorkout()
  const workoutLogs = useAppStore((s) => s.workoutLogs)
  const workoutDays = useAppStore((s) => s.routineSettings.workoutDays)
  const logWorkout = useAppStore((s) => s.logWorkout)
  const cycleRotation = useAppStore((s) => s.cycleWorkoutRotation)
  const agenda = useAgenda()

  const today = todayISO()
  const todayLog = workoutLogs.find((l) => l.date === today)

  const [lowMotivationOpen, setLowMotivationOpen] = useState(false)
  const [lowStep, setLowStep] = useState(0)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [registerOpen, setRegisterOpen] = useState(false)
  const [loads, setLoads] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')

  // Abertura direta pelo modo execução (`/treino?executar=1`).
  useEffect(() => {
    if (params.get('executar') === '1') {
      setRegisterOpen(true)
      params.delete('executar')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const weekLogs = useMemo(() => {
    const dates = new Set(weekDates(today))
    return workoutLogs.filter((l) => l.completed && dates.has(l.date))
  }, [workoutLogs, today])

  const workoutBlock = agenda.find((a) => a.kind === 'treino')

  const handleRegister = (completed: boolean) => {
    if (!template) return
    const parsedLoads: Record<string, number> = {}
    for (const [id, value] of Object.entries(loads)) {
      const n = Number(value.replace(',', '.'))
      if (Number.isFinite(n) && n > 0) parsedLoads[id] = n
    }

    logWorkout({
      templateId: template.id,
      completed,
      lowMotivation: lowStep > 0,
      minutes: template.estimatedMinutes,
      loads: parsedLoads,
      notes,
      blockId: workoutBlock?.id,
    })

    setRegisterOpen(false)
    setLoads({})
    setNotes('')
    setLowStep(0)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treino"
        subtitle="Consistência vence intensidade. Aparecer já é metade."
      />

      {/* ── Semana ──────────────────────────────────────── */}
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-ink-3 uppercase">
              Esta semana
            </p>
            <p className="tnum mt-1 text-[28px] leading-none font-bold text-ink">
              {weekLogs.length}
              <span className="text-[16px] font-medium text-ink-3">/{workoutDays.length}</span>
            </p>
          </div>
          <Chip color="var(--color-dom-workout)" icon={<Flame size={12} />} size="md">
            {plural(weekLogs.length, 'treino feito', 'treinos feitos')}
          </Chip>
        </div>

        <ProgressBar
          value={weekLogs.length}
          max={Math.max(workoutDays.length, 1)}
          color="var(--color-dom-workout)"
          className="mt-3"
          height="md"
        />

        <div className="mt-4 flex gap-1.5">
          {weekDates(today).map((date) => {
            const day = weekdayOf(date)
            const done = workoutLogs.some((l) => l.date === date && l.completed)
            const planned = workoutDays.includes(day)
            return (
              <div key={date} className="flex-1 text-center">
                <div
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl text-[12px] font-semibold',
                    done
                      ? 'bg-dom-workout/20 text-dom-workout'
                      : planned
                        ? 'border border-dashed border-line bg-transparent text-ink-3'
                        : 'bg-surface-2 text-ink-3/50',
                  )}
                  style={
                    done
                      ? {
                          backgroundColor: 'color-mix(in oklab, var(--color-dom-workout) 18%, transparent)',
                          color: 'var(--color-dom-workout)',
                        }
                      : undefined
                  }
                >
                  {done ? <Check size={15} /> : planned ? '·' : ''}
                </div>
                <span className="mt-1 block text-[10px] text-ink-3">
                  {WEEKDAY_SHORT[day].slice(0, 1)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Treino do dia ───────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          action={
            <button
              onClick={cycleRotation}
              className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3 transition-colors hover:text-ink-2"
            >
              <RefreshCw size={13} />
              Trocar
            </button>
          }
        >
          Treino de hoje
        </SectionTitle>

        {!template ? (
          <Card variant="flat" className="py-8 text-center">
            <p className="text-[13px] text-ink-3">Nenhum treino configurado.</p>
          </Card>
        ) : todayLog?.completed ? (
          <Card variant="flat" className="flex items-center gap-4 py-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ok/12 text-ok">
              <Check size={24} />
            </span>
            <div>
              <p className="text-base font-bold text-ink">Treino feito</p>
              <p className="mt-0.5 text-[13px] text-ink-2">
                {todayLog.templateName}
                {todayLog.lowMotivation && ' — e você foi mesmo sem vontade. Isso conta dobrado.'}
              </p>
            </div>
          </Card>
        ) : (
          <Card variant={isWorkoutDay ? 'accent' : 'default'} className="p-5">
            {!isWorkoutDay && (
              <p className="mb-3 text-[12px] font-medium text-ink-3">
                Hoje é dia de folga no seu plano — mas se quiser treinar, o treino está aqui.
              </p>
            )}

            <div className="flex items-start gap-3.5">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: 'color-mix(in oklab, var(--color-dom-workout) 15%, transparent)',
                  color: 'var(--color-dom-workout)',
                }}
              >
                <Dumbbell size={22} />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="text-[22px] leading-tight font-bold tracking-tight text-ink">
                  {template.name}
                </h2>
                <p className="mt-0.5 text-[13.5px] text-ink-2">{template.focus}</p>
                <p className="tnum mt-2 text-[12px] text-ink-3">
                  {formatDuration(template.estimatedMinutes)} ·{' '}
                  {plural(template.exercises.length, 'exercício', 'exercícios')}
                </p>
              </div>
            </div>

            <p className="mt-4 border-l-2 border-line pl-3 text-[13px] leading-snug text-ink-2">
              {pickStable(COACH_WORKOUT, today)}
            </p>

            <div className="mt-5 space-y-2">
              <Button
                variant="primary"
                size="lg"
                full
                icon={<Check size={18} />}
                onClick={() => setRegisterOpen(true)}
              >
                Registrar treino
              </Button>

              <Button
                variant="outline"
                size="md"
                full
                icon={<Zap size={16} />}
                onClick={() => {
                  setLowStep(0)
                  setLowMotivationOpen(true)
                }}
              >
                Estou sem vontade hoje
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* ── Checklist de saída ──────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Deixe pronto antes de sair. Menos desculpa depois.">
          Ir mesmo sem vontade
        </SectionTitle>

        <Card className="space-y-1">
          {PRE_WORKOUT_CHECKLIST.map((item) => {
            const checked = checklist[item] ?? false
            return (
              <button
                key={item}
                onClick={() => setChecklist((c) => ({ ...c, [item]: !checked }))}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    checked
                      ? 'border-transparent bg-accent text-accent-ink'
                      : 'border-line bg-transparent',
                  )}
                >
                  {checked && <Check size={14} />}
                </span>
                <span
                  className={cn(
                    'text-[14px]',
                    checked ? 'text-ink-3 line-through' : 'text-ink-2',
                  )}
                >
                  {item}
                </span>
              </button>
            )
          })}
        </Card>
      </section>

      {/* ── Exercícios do treino ────────────────────────── */}
      {template && (
        <section className="space-y-3">
          <SectionTitle hint="A carga da última vez fica salva aqui">
            {template.name} — {template.focus}
          </SectionTitle>

          <Card className="divide-y divide-line-soft p-0">
            {template.exercises.map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{ex.name}</p>
                  <p className="tnum mt-0.5 text-[12px] text-ink-3">
                    {ex.sets} × {ex.reps}
                  </p>
                </div>
                <span className="tnum shrink-0 text-[13px] font-semibold text-ink-2">
                  {ex.lastLoad ? `${ex.lastLoad} kg` : '—'}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* ── Modo baixa motivação ────────────────────────── */}
      <Sheet
        open={lowMotivationOpen}
        onClose={() => setLowMotivationOpen(false)}
        title="Modo baixa motivação"
        description="Um passo por vez. Não pense no treino inteiro."
        footer={
          lowStep < LOW_MOTIVATION_STEPS.length - 1 ? (
            <Button variant="primary" size="lg" full onClick={() => setLowStep((s) => s + 1)}>
              Feito, próximo passo
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                full
                onClick={() => {
                  setLowMotivationOpen(false)
                  setRegisterOpen(true)
                }}
              >
                Vou treinar
              </Button>
              <Button
                variant="ghost"
                size="md"
                full
                onClick={() => {
                  handleRegister(false)
                  setLowMotivationOpen(false)
                }}
              >
                Hoje não vai dar
              </Button>
            </div>
          )
        }
      >
        <ol className="space-y-2.5">
          {LOW_MOTIVATION_STEPS.map((stepText, i) => {
            const isCurrent = i === lowStep
            const isDone = i < lowStep
            return (
              <li
                key={stepText}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors',
                  isCurrent
                    ? 'border-accent/30 bg-surface-2'
                    : isDone
                      ? 'border-line-soft bg-transparent opacity-50'
                      : 'border-line-soft bg-transparent opacity-40',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                    isDone
                      ? 'bg-ok/15 text-ok'
                      : isCurrent
                        ? 'bg-accent text-accent-ink'
                        : 'bg-surface-3 text-ink-3',
                  )}
                >
                  {isDone ? <Check size={12} /> : i + 1}
                </span>
                <span
                  className={cn(
                    'text-[14px] leading-snug',
                    isCurrent ? 'font-medium text-ink' : 'text-ink-2',
                  )}
                >
                  {stepText}
                </span>
              </li>
            )
          })}
        </ol>
      </Sheet>

      {/* ── Registro ────────────────────────────────────── */}
      <Sheet
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Registrar treino"
        description={template ? `${template.name} — ${template.focus}` : undefined}
        footer={
          <div className="space-y-2">
            <Button variant="primary" size="lg" full onClick={() => handleRegister(true)}>
              Treino concluído
            </Button>
            <Button variant="ghost" size="md" full onClick={() => handleRegister(false)}>
              Não treinei hoje
            </Button>
          </div>
        }
      >
        {template && (
          <div className="space-y-2">
            <p className="text-[12px] text-ink-3">
              Anote a carga que usou. Se não lembrar, deixe em branco.
            </p>

            {template.exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface-2 px-3.5 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">{ex.name}</p>
                  <p className="tnum text-[11.5px] text-ink-3">
                    {ex.sets} × {ex.reps}
                    {ex.lastLoad ? ` · última: ${ex.lastLoad}kg` : ''}
                  </p>
                </div>

                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={ex.lastLoad ? String(ex.lastLoad) : 'kg'}
                  value={loads[ex.id] ?? ''}
                  onChange={(e) => setLoads((l) => ({ ...l, [ex.id]: e.target.value }))}
                  className="tnum w-20 shrink-0 rounded-xl border border-line bg-surface px-3 py-2 text-center text-sm text-ink placeholder:text-ink-3 focus:border-accent/60 focus:outline-none"
                />
              </div>
            ))}

            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como foi? (opcional)"
              className="mt-3 min-h-[70px]"
            />
          </div>
        )}
      </Sheet>
    </div>
  )
}
