import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, RotateCcw, Undo2 } from 'lucide-react'

import type { RealClassOutcome } from '@/types/curriculum'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { TextArea } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { useCurriculumStore } from '@/store/curriculumStore'
import { resolveSchedule } from '@/lib/curriculum/schedule'
import { formatShortDate, todayISO, weekdayOf } from '@/lib/date'
import { cn } from '@/lib/utils'

const OUTCOMES: Array<{
  value: RealClassOutcome
  label: string
  detail: string
  color: string
}> = [
  { value: 'normal', label: 'Aula normal', detail: 'Seguiu o plano', color: 'var(--color-ok)' },
  { value: 'atrasou', label: 'Professor atrasou', detail: 'Não terminou o previsto', color: 'var(--color-warn)' },
  { value: 'adiantou', label: 'Professor adiantou', detail: 'Passou do previsto', color: 'var(--color-info)' },
  { value: 'conteudo_diferente', label: 'Conteúdo diferente', detail: 'Deu outro assunto', color: 'var(--color-dom-sleep)' },
  { value: 'cancelada', label: 'Aula cancelada', detail: 'Não houve aula', color: 'var(--color-danger)' },
]

/**
 * Aula Real — o plano nunca é seguido à risca, e o sistema precisa absorver isso.
 *
 * Cada relato ajusta o *deslocamento* da disciplina, não as datas das aulas.
 * Como o cronograma é derivado, mover a fila é somar 1 a um número — e desfazer
 * é subtrair. Nenhum registro é reescrito, então errar aqui não custa nada.
 */
export function RealClass() {
  const navigate = useNavigate()
  const today = todayISO()

  const subjects = useAppStore((s) => s.subjects)
  const lessons = useCurriculumStore((s) => s.lessons)
  const grid = useCurriculumStore((s) => s.grid)
  const calendar = useCurriculumStore((s) => s.calendar)
  const offsets = useCurriculumStore((s) => s.offsets)
  const reports = useCurriculumStore((s) => s.reports)
  const reportRealClass = useCurriculumStore((s) => s.reportRealClass)
  const undoReport = useCurriculumStore((s) => s.undoReport)

  const [openSubject, setOpenSubject] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const subjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name ??
    ({ bio1: 'Biologia I', bio2: 'Biologia II', lit: 'Literatura', efl: 'Estrutura da Língua' } as Record<string, string>)[id] ??
    id

  /** Disciplinas que tiveram aula hoje, com o conteúdo que estava previsto. */
  const todayClasses = useMemo(() => {
    const resolved = resolveSchedule(
      { calendar, grid, lessons, offsets },
      calendar.startDate,
      today,
    ).filter((s) => s.date === today)

    const map = new Map<string, { count: number; title: string | null }>()
    for (const s of resolved) {
      const cur = map.get(s.slot.subjectId)
      map.set(s.slot.subjectId, {
        count: (cur?.count ?? 0) + 1,
        title: cur?.title ?? s.lesson?.title ?? null,
      })
    }
    return [...map.entries()]
  }, [calendar, grid, lessons, offsets, today])

  const reportedToday = new Set(reports.filter((r) => r.date === today).map((r) => r.subjectId))
  const recent = [...reports].reverse().slice(0, 8)

  const isWeekend = weekdayOf(today) === 0 || weekdayOf(today) === 6

  const submit = (subjectId: string, outcome: RealClassOutcome) => {
    reportRealClass({ date: today, subjectId, outcome, note })
    setOpenSubject(null)
    setNote('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Como foi a aula"
        subtitle="O sistema se reorganiza a partir do que realmente aconteceu."
        back="/"
      />

      {isWeekend || todayClasses.length === 0 ? (
        <Card variant="flat" className="py-10 text-center">
          <p className="text-[14px] font-semibold text-ink">Sem aula hoje</p>
          <p className="mt-1 text-[13px] text-ink-2">
            Volte num dia letivo para registrar como foi.
          </p>
        </Card>
      ) : (
        <section className="space-y-3">
          <SectionTitle hint={`${todayClasses.length} disciplinas hoje`}>
            Aulas de hoje
          </SectionTitle>

          <div className="space-y-2.5">
            {todayClasses.map(([subjectId, info]) => {
              const done = reportedToday.has(subjectId)
              const isOpen = openSubject === subjectId
              const offset = offsets[subjectId] ?? 0

              return (
                <Card key={subjectId} className="p-0 overflow-hidden">
                  <button
                    onClick={() => {
                      setOpenSubject(isOpen ? null : subjectId)
                      setNote('')
                    }}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                        done ? 'bg-ok/12 text-ok' : 'bg-surface-3 text-ink-3',
                      )}
                    >
                      {done ? <Check size={17} /> : <span className="text-[12px] font-bold">?</span>}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] font-bold text-ink">
                        {subjectName(subjectId)}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">
                        {info.title ?? 'Sem conteúdo previsto no plano'}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        <Chip>{info.count}× hoje</Chip>
                        {offset !== 0 && (
                          <Chip color={offset > 0 ? 'var(--color-warn)' : 'var(--color-info)'}>
                            {offset > 0 ? `${offset} aula(s) atrasada(s)` : `${-offset} adiantada(s)`}
                          </Chip>
                        )}
                        {done && <Chip color="var(--color-ok)">Registrada</Chip>}
                      </span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="space-y-2 border-t border-line-soft p-4">
                      {OUTCOMES.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => submit(subjectId, o.value)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-line-soft bg-surface-2 px-4 py-3 text-left transition-colors hover:border-line hover:bg-surface-3"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: o.color }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-medium text-ink">{o.label}</span>
                            <span className="block text-[12px] text-ink-3">{o.detail}</span>
                          </span>
                        </button>
                      ))}

                      <TextArea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="O que o professor deu? (opcional)"
                        className="mt-2 min-h-[64px]"
                      />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Histórico e desfazer ────────────────────────── */}
      {recent.length > 0 && (
        <section className="space-y-3">
          <SectionTitle hint="Desfazer devolve a fila ao ponto anterior">
            Registros recentes
          </SectionTitle>

          <Card className="divide-y divide-line-soft p-0">
            {recent.map((r) => {
              const meta = OUTCOMES.find((o) => o.value === r.outcome)
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: meta?.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] text-ink">
                      {subjectName(r.subjectId)} — {meta?.label}
                    </p>
                    <p className="tnum text-[11.5px] text-ink-3">
                      {formatShortDate(r.date)}
                      {r.offsetDelta !== 0 &&
                        ` · fila ${r.offsetDelta > 0 ? 'atrasou' : 'adiantou'} ${Math.abs(r.offsetDelta)}`}
                      {r.note && ` · ${r.note.slice(0, 40)}`}
                    </p>
                  </div>
                  <IconButton
                    label="Desfazer"
                    onClick={() => undoReport(r.id)}
                    className="h-8 w-8"
                  >
                    <Undo2 size={14} />
                  </IconButton>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {Object.values(offsets).some((v) => v !== 0) && (
        <Card variant="flat" className="flex items-center gap-3 py-3.5">
          <RotateCcw size={16} className="shrink-0 text-ink-3" />
          <p className="text-[12.5px] text-ink-2">
            O cronograma já está ajustado. A tela <strong className="text-ink">Amanhã</strong> mostra
            o conteúdo corrigido.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/amanha')}>
            Ver
          </Button>
        </Card>
      )}
    </div>
  )
}
