import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, BookOpen, CalendarDays, ChevronRight, Play, Upload } from 'lucide-react'

import type { ScheduledLesson, TopicState } from '@/types/curriculum'
import { TOPIC_STATE_COLOR, TOPIC_STATE_LABEL } from '@/types/curriculum'
import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { useCurriculumStore } from '@/store/curriculumStore'
import { eventsOn, nextSchoolDay, resolveSchedule } from '@/lib/curriculum/schedule'
import { formatLongDate, todayISO } from '@/lib/date'
import { cn } from '@/lib/utils'

/**
 * A tela central da Sprint 2: o que estudar hoje para a aula de amanhã.
 *
 * A lógica do produto é preparar antes, não acompanhar depois — a escola vira
 * confirmação e espaço de dúvida, não a primeira exposição ao conteúdo.
 */
export function Tomorrow() {
  const navigate = useNavigate()
  const today = todayISO()

  const subjects = useAppStore((s) => s.subjects)
  const lessons = useCurriculumStore((s) => s.lessons)
  const grid = useCurriculumStore((s) => s.grid)
  const calendar = useCurriculumStore((s) => s.calendar)
  const offsets = useCurriculumStore((s) => s.offsets)
  const topicStates = useCurriculumStore((s) => s.topicStates)
  const importedSubjects = useCurriculumStore((s) => s.importedSubjects)

  const [expanded, setExpanded] = useState<string | null>(null)

  const target = useMemo(() => nextSchoolDay(calendar, today), [calendar, today])

  const scheduled = useMemo(() => {
    if (!target) return []
    return resolveSchedule({ calendar, grid, lessons, offsets }, calendar.startDate, target).filter(
      (s) => s.date === target,
    )
  }, [calendar, grid, lessons, offsets, target])

  const events = useMemo(() => (target ? eventsOn(calendar, target) : []), [calendar, target])

  const subjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name ??
    ({ bio1: 'Biologia I', bio2: 'Biologia II', lit: 'Literatura', efl: 'Estrutura da Língua' } as Record<string, string>)[id] ??
    id

  const subjectColor = (id: string) =>
    subjects.find((s) => s.id === id)?.color ?? 'var(--color-ink-3)'

  /**
   * Agrupa por disciplina: amanhã há até 7 aulas, mas o que importa é
   * "quais matérias preparar", não cada encontro isolado.
   */
  const grouped = useMemo(() => {
    const map = new Map<string, ScheduledLesson[]>()
    for (const s of scheduled) {
      if (!map.has(s.slot.subjectId)) map.set(s.slot.subjectId, [])
      map.get(s.slot.subjectId)!.push(s)
    }
    return [...map.entries()]
      .map(([subjectId, items]) => ({
        subjectId,
        items,
        withContent: items.filter((i) => i.lesson && i.lesson.kind === 'aula'),
      }))
      .sort((a, b) => b.withContent.length - a.withContent.length)
  }, [scheduled])

  const semPlano = grouped.filter((g) => !importedSubjects.includes(g.subjectId))
  const comPlano = grouped.filter((g) => importedSubjects.includes(g.subjectId))

  if (!target) {
    return (
      <div className="space-y-6">
        <PageHeader title="Amanhã" subtitle="Preparar antes. A escola vira reforço." />
        <Card variant="flat" className="py-10 text-center">
          <CalendarDays size={22} className="mx-auto mb-3 text-ink-3" />
          <p className="text-[14px] font-semibold text-ink">Sem aula à vista</p>
          <p className="mt-1 text-[13px] text-ink-2">
            O calendário escolar não tem próximo dia letivo. Aproveite para revisar.
          </p>
          <Button variant="outline" size="md" className="mt-5" onClick={() => navigate('/estudos')}>
            Ir para revisão livre
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amanhã"
        subtitle={`Prepare hoje o que cai em ${formatLongDate(target)}.`}
      />

      {/* ── Avisos do calendário ────────────────────────── */}
      {events.length > 0 && (
        <div className="space-y-2">
          {events.map((e) => (
            <Card key={e.id} variant="flat" className="flex items-center gap-3 py-3">
              <AlertCircle
                size={17}
                className={cn(
                  'shrink-0',
                  e.kind === 'avaliacao' ? 'text-warn' : 'text-accent',
                )}
              />
              <p className="text-[13px] text-ink-2">
                <span className="font-semibold text-ink">{e.label}</span>
                {e.kind === 'avaliacao' && ' — amanhã tem prova.'}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* ── Nada importado ainda ────────────────────────── */}
      {lessons.length === 0 && (
        <Card variant="accent" className="p-5">
          <BookOpen size={20} className="text-accent" />
          <h2 className="mt-3 text-[20px] leading-tight font-bold text-ink">
            Banco Curricular vazio
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            Importe os planos de aula da escola em PDF. Depois disso o sistema sabe exatamente o
            que cai em cada dia — e o PDF pode ser descartado.
          </p>
          <Button
            variant="primary"
            size="lg"
            full
            className="mt-5"
            icon={<Upload size={17} />}
            onClick={() => navigate('/importar')}
          >
            Importar planos de aula
          </Button>
        </Card>
      )}

      {/* ── Matérias de amanhã ──────────────────────────── */}
      {comPlano.length > 0 && (
        <section className="space-y-3">
          <SectionTitle hint={`${scheduled.length} aulas na grade de amanhã`}>
            Preparar hoje
          </SectionTitle>

          <div className="space-y-2.5">
            {comPlano.map(({ subjectId, items, withContent }) => {
              const first = withContent[0] ?? items[0]
              const lesson = first?.lesson
              const state: TopicState = lesson?.topicId
                ? (topicStates[lesson.topicId] ?? 'nao_iniciado')
                : 'nao_iniciado'
              const isOpen = expanded === subjectId

              return (
                <Card key={subjectId} className="p-0 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : subjectId)}
                    className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-2"
                  >
                    <span
                      className="mt-1 h-10 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: subjectColor(subjectId) }}
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[16px] font-bold text-ink">
                          {subjectName(subjectId)}
                        </span>
                        <span className="tnum shrink-0 text-[11.5px] text-ink-3">
                          {items.length}× · {items[0]?.slot.start}
                        </span>
                      </span>

                      <span className="mt-1 block truncate text-[13px] text-ink-2">
                        {lesson ? lesson.title : 'Sem aula prevista no plano'}
                      </span>

                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Chip color={TOPIC_STATE_COLOR[state]}>{TOPIC_STATE_LABEL[state]}</Chip>
                        {lesson?.track && <Chip>{lesson.track}</Chip>}
                        {lesson?.material.book && (
                          <Chip>{lesson.material.book}</Chip>
                        )}
                      </span>
                    </span>

                    <ChevronRight
                      size={18}
                      className={cn(
                        'mt-1 shrink-0 text-ink-3 transition-transform',
                        isOpen && 'rotate-90',
                      )}
                    />
                  </button>

                  {isOpen && lesson && (
                    <div className="border-t border-line-soft px-4 py-4">
                      {lesson.objectives.length > 0 && (
                        <>
                          <p className="mb-2 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
                            O que o professor vai cobrir
                          </p>
                          <ul className="mb-4 space-y-1.5">
                            {lesson.objectives.slice(0, 5).map((o, i) => (
                              <li key={i} className="flex gap-2 text-[13px] leading-snug text-ink-2">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                                {o}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {(lesson.material.book || lesson.material.exercises) && (
                        <div className="mb-4 rounded-2xl border border-line-soft bg-surface-2 px-3.5 py-3">
                          <p className="text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
                            Material de referência
                          </p>
                          <p className="mt-1 text-[13px] text-ink-2">
                            {[
                              lesson.material.book,
                              lesson.material.chapter,
                              lesson.material.pages,
                              lesson.material.exercises,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <p className="mt-1.5 text-[11.5px] text-ink-3">
                            Se você não tiver o livro, o sistema usa questões do ENEM.
                          </p>
                        </div>
                      )}

                      <Button
                        variant="primary"
                        size="lg"
                        full
                        icon={<Play size={17} />}
                        onClick={() => navigate(`/preparar/${lesson.id}`)}
                      >
                        Preparar esta aula
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Sem plano importado ─────────────────────────── */}
      {semPlano.length > 0 && lessons.length > 0 && (
        <section className="space-y-3">
          <SectionTitle hint="Estão na grade, mas sem planejamento importado">
            Sem conteúdo mapeado
          </SectionTitle>
          <Card variant="flat" className="py-3.5">
            <p className="text-[13px] text-ink-2">
              {semPlano.map((g) => subjectName(g.subjectId)).join(', ')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              icon={<Upload size={14} />}
              onClick={() => navigate('/importar')}
            >
              Importar plano
            </Button>
          </Card>
        </section>
      )}
    </div>
  )
}
