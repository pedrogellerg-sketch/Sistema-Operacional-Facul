import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText, Play, Trophy } from 'lucide-react'

import type { ISODate } from '@/types'
import type { ScheduledLesson } from '@/types/curriculum'
import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { LessonDetail } from '@/components/study/LessonDetail'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { useCurriculumStore } from '@/store/curriculumStore'
import { eventsOn, resolveSchedule } from '@/lib/curriculum/schedule'
import { buildAssessmentPeriods, bimestreDaData } from '@/data/assessments'
import { addDays, formatLongDate, fromISODate, toISODate, todayISO, weekdayOf } from '@/lib/date'
import { cn } from '@/lib/utils'

const DIA_CURTO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

/**
 * Calendário do bimestre — a visão geral que faltava.
 *
 * O app respondia bem "o que cai amanhã" e nada além disso. Sem enxergar a
 * semana inteira não dá para adiantar uma matéria, nem para perceber que a
 * prova está a doze dias.
 *
 * Tocar num dia abre exatamente a mesma leitura de aula usada na preparação e
 * na confirmação — `LessonDetail`. Uma forma só de ler uma aula, três portas de
 * entrada.
 */
export function CalendarScreen() {
  const navigate = useNavigate()
  const hoje = todayISO()

  const subjects = useAppStore((s) => s.subjects)
  const lessons = useCurriculumStore((s) => s.lessons)
  const grid = useCurriculumStore((s) => s.grid)
  const calendar = useCurriculumStore((s) => s.calendar)
  const offsets = useCurriculumStore((s) => s.offsets)

  const [mes, setMes] = useState(() => hoje.slice(0, 7))
  const [dia, setDia] = useState<ISODate>(hoje)
  const [aberta, setAberta] = useState<string | null>(null)

  const subjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name ??
    ({ bio1: 'Biologia I', bio2: 'Biologia II', lit: 'Literatura', efl: 'Estrutura da Língua', ing: 'Inglês' } as Record<string, string>)[id] ??
    id

  const subjectColor = (id: string) =>
    subjects.find((s) => s.id === id)?.color ?? 'var(--color-ink-3)'

  /** Cronograma inteiro do semestre, resolvido uma vez. */
  const agenda = useMemo(
    () => resolveSchedule({ calendar, grid, lessons, offsets }, calendar.startDate, calendar.endDate),
    [calendar, grid, lessons, offsets],
  )

  const periodos = useMemo(
    () => buildAssessmentPeriods(calendar, bimestreDaData),
    [calendar],
  )

  /** Células do mês, alinhadas na semana (domingo primeiro). */
  const celulas = useMemo(() => {
    const primeiro = `${mes}-01` as ISODate
    const inicio = addDays(primeiro, -weekdayOf(primeiro))
    const total = new Date(fromISODate(primeiro).getFullYear(), fromISODate(primeiro).getMonth() + 1, 0).getDate()
    const fim = `${mes}-${String(total).padStart(2, '0')}` as ISODate
    const out: ISODate[] = []
    let cursor = inicio
    while (cursor <= fim || out.length % 7 !== 0) {
      out.push(cursor)
      cursor = addDays(cursor, 1)
      if (out.length > 42) break
    }
    return out
  }, [mes])

  const doDia = useMemo(() => agenda.filter((s) => s.date === dia), [agenda, dia])
  const eventosDoDia = useMemo(() => eventsOn(calendar, dia), [calendar, dia])
  const provaDoDia = periodos.find((p) => p.days.some((d) => d.date === dia))
  const diaDaProva = provaDoDia?.days.find((d) => d.date === dia)

  /** Agrupa por disciplina — o que importa é a matéria, não cada período. */
  const porDisciplina = useMemo(() => {
    const map = new Map<string, { slots: ScheduledLesson[]; lessons: ScheduledLesson['lesson'][] }>()
    for (const s of doDia) {
      const cur = map.get(s.slot.subjectId) ?? { slots: [], lessons: [] }
      cur.slots.push(s)
      if (s.lesson && !cur.lessons.some((l) => l?.id === s.lesson!.id)) cur.lessons.push(s.lesson)
      map.set(s.slot.subjectId, cur)
    }
    return [...map.entries()]
  }, [doDia])

  const marcadores = useMemo(() => {
    const m = new Map<ISODate, { aula: boolean; prova: boolean; simulado: boolean; folga: boolean }>()
    for (const s of agenda) {
      const cur = m.get(s.date) ?? { aula: false, prova: false, simulado: false, folga: false }
      cur.aula = true
      m.set(s.date, cur)
    }
    for (const e of calendar.events) {
      const cur = m.get(e.date) ?? { aula: false, prova: false, simulado: false, folga: false }
      if (e.kind === 'avaliacao') cur.prova = true
      if (e.kind === 'simulado' || e.kind === 'vestibular') cur.simulado = true
      if (e.suspendsClasses) cur.folga = true
      m.set(e.date, cur)
    }
    return m
  }, [agenda, calendar])

  const mudarMes = (delta: number) => {
    const d = fromISODate(`${mes}-01` as ISODate)
    d.setMonth(d.getMonth() + delta)
    setMes(toISODate(d).slice(0, 7))
  }

  const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    fromISODate(`${mes}-01` as ISODate),
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Calendário" subtitle="Toque num dia para ver as aulas e o conteúdo." />

      {/* ── Grade do mês ────────────────────────────────── */}
      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="p-2 text-ink-2">
            <ChevronLeft size={18} />
          </button>
          {/* `capitalize` deixaria "Agosto De 2026" — só a primeira letra sobe. */}
          <span className="text-[14px] font-semibold text-ink first-letter:uppercase">
            {nomeMes}
          </span>
          <button onClick={() => mudarMes(1)} aria-label="Próximo mês" className="p-2 text-ink-2">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DIA_CURTO.map((d, i) => (
            <span key={i} className="pb-1 text-center text-[11px] font-semibold text-ink-3">
              {d}
            </span>
          ))}

          {celulas.map((d) => {
            const doMes = d.startsWith(mes)
            const mk = marcadores.get(d)
            const sel = d === dia
            return (
              <button
                key={d}
                onClick={() => {
                  setDia(d)
                  setAberta(null)
                }}
                className={cn(
                  'relative flex h-11 flex-col items-center justify-center rounded-xl text-[13px] transition-colors',
                  !doMes && 'opacity-30',
                  sel ? 'bg-accent font-bold text-accent-ink' : 'text-ink-2 hover:bg-surface-2',
                  d === hoje && !sel && 'font-bold text-accent',
                )}
              >
                <span className="tnum">{Number(d.slice(8))}</span>
                <span className="mt-0.5 flex h-1 items-center gap-0.5">
                  {mk?.prova && <span className="h-1 w-1 rounded-full bg-warn" />}
                  {mk?.simulado && <span className="h-1 w-1 rounded-full bg-info" />}
                  {mk?.aula && !mk.prova && !mk.simulado && (
                    <span className={cn('h-1 w-1 rounded-full', sel ? 'bg-accent-ink/50' : 'bg-ink-3')} />
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-3 border-t border-line-soft pt-2 text-[11px] text-ink-3">
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-ink-3" /> aula</span>
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-warn" /> AV</span>
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-info" /> simulado</span>
        </div>
      </Card>

      {/* ── Dia selecionado ─────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint={dia === hoje ? 'hoje' : undefined}>{formatLongDate(dia)}</SectionTitle>

        {eventosDoDia.map((e) => (
          <Card key={e.id} variant="flat" className="flex items-center gap-3 py-3">
            {e.kind === 'vestibular' || e.kind === 'simulado' ? (
              <Trophy size={16} className="shrink-0 text-info" />
            ) : (
              <FileText size={16} className="shrink-0 text-warn" />
            )}
            <p className="text-[13px] text-ink-2">
              <span className="font-semibold text-ink">{e.label}</span>
            </p>
          </Card>
        ))}

        {/* Detalhe da prova, quando o dia é de AV */}
        {provaDoDia && diaDaProva && (
          <Card className="border-warn/25">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold text-ink">
                {provaDoDia.name} — {provaDoDia.format}
              </span>
              <Chip color="var(--color-warn)">{provaDoDia.bimester}º bimestre</Chip>
            </div>
            <div className="space-y-3">
              {diaDaProva.parts.map((p, i) => (
                <div key={i}>
                  <p className="text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
                    {p.label} · {p.start}–{p.end}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.subjects.map((s) => (
                      <Chip key={s.label}>
                        {s.label}
                        {s.questions != null ? ` · ${s.questions}` : ''}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-ink-3">
              {provaDoDia.format === 'objetiva'
                ? `${provaDoDia.totalQuestions} questões no total, distribuídas como acima.`
                : 'Prova dissertativa, no formato de vestibular, com o conteúdo do bimestre.'}
            </p>
          </Card>
        )}

        {porDisciplina.length === 0 && eventosDoDia.length === 0 && (
          <Card variant="flat" className="py-8 text-center">
            <p className="text-[13px] text-ink-3">Sem aula neste dia.</p>
          </Card>
        )}

        {porDisciplina.map(([subjectId, info]) => {
          const isOpen = aberta === subjectId
          return (
            <Card key={subjectId} className="overflow-hidden p-0">
              <button
                onClick={() => setAberta(isOpen ? null : subjectId)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className="mt-1 h-9 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: subjectColor(subjectId) }}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-ink">{subjectName(subjectId)}</span>
                    <span className="tnum text-[11.5px] text-ink-3">
                      {info.slots.length}× · {info.slots[0]?.slot.start}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-2">
                    {info.lessons.length > 0
                      ? info.lessons.map((l) => l?.title).join(' · ')
                      : 'Sem conteúdo previsto no plano'}
                  </span>
                </span>
              </button>

              {isOpen && (
                <div className="space-y-5 border-t border-line-soft p-4">
                  {info.lessons.map(
                    (l) =>
                      l && (
                        <div key={l.id} className="space-y-3">
                          <LessonDetail lesson={l} subjectName={subjectName(subjectId)} />
                          <Button
                            variant="primary"
                            size="md"
                            full
                            icon={<Play size={16} />}
                            onClick={() => navigate(`/preparar/${l.id}`)}
                          >
                            Preparar esta aula
                          </Button>
                        </div>
                      ),
                  )}
                  {info.lessons.length === 0 && (
                    <p className="text-[13px] text-ink-3">
                      O plano não prevê conteúdo para este dia.
                    </p>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </section>
    </div>
  )
}
