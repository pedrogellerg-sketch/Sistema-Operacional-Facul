import { useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, HelpCircle, Target, Trophy } from 'lucide-react'

import type { ExamId } from '@/types/curriculum'
import { EXAM_LABEL, TOPIC_STATE_COLOR, TOPIC_STATE_LABEL } from '@/types/curriculum'
import type { TopicState } from '@/types/curriculum'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ProgressBar } from '@/components/ui/Progress'
import { Sheet } from '@/components/ui/Sheet'
import { NumberStepper, TextArea } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatTile } from '@/components/progress/Charts'

import { useAppStore } from '@/store/appStore'
import { useCurriculumStore } from '@/store/curriculumStore'
import { upcomingExams } from '@/lib/curriculum/schedule'
import { daysBetween, formatShortDate, todayISO } from '@/lib/date'
import { cn, pct, plural, sum } from '@/lib/utils'

const STATE_ORDER: TopicState[] = ['nao_iniciado', 'preparando', 'preparado', 'revisando', 'dominado']

/**
 * Dashboard Acadêmico — métricas reais, sem previsão de aprovação.
 *
 * Mede o que aconteceu: conteúdos por estado, exercícios respondidos com
 * acerto, dúvidas em aberto, simulados e proximidade das provas.
 */
export function Academic() {
  const today = todayISO()

  const subjects = useAppStore((s) => s.subjects)
  const topics = useAppStore((s) => s.topics)
  const logs = useAppStore((s) => s.logs)

  const lessons = useCurriculumStore((s) => s.lessons)
  const doubts = useCurriculumStore((s) => s.doubts)
  const attempts = useCurriculumStore((s) => s.attempts)
  const calendar = useCurriculumStore((s) => s.calendar)
  const simulados = useCurriculumStore((s) => s.simulados)
  const targetExams = useCurriculumStore((s) => s.targetExams)
  const setTargetExams = useCurriculumStore((s) => s.setTargetExams)
  const addSimulado = useCurriculumStore((s) => s.addSimulado)
  const resolveDoubt = useCurriculumStore((s) => s.resolveDoubt)

  const [simOpen, setSimOpen] = useState(false)
  const [simExam, setSimExam] = useState<ExamId>('enem')
  const [simTotal, setSimTotal] = useState(90)
  const [simCorrect, setSimCorrect] = useState(45)
  const [simNotes, setSimNotes] = useState('')
  const [answering, setAnswering] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')

  // ── Métricas ───────────────────────────────────────
  const stateCount = useMemo(() => {
    const c: Record<TopicState, number> = {
      nao_iniciado: 0, preparando: 0, preparado: 0, revisando: 0, dominado: 0,
    }
    for (const t of topics) c[t.status] += 1
    return c
  }, [topics])

  const openDoubts = doubts.filter((d) => !d.resolvedAt)
  const correct = attempts.filter((a) => a.correct).length
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : null
  const studyHours = Math.round((sum(Object.values(logs).map((l) => l.studyMinutes)) / 60) * 10) / 10

  const next = useMemo(() => upcomingExams(calendar, today, 5), [calendar, today])

  /** Acerto por disciplina — mostra onde o desempenho está travando. */
  const bySubject = useMemo(() => {
    const map = new Map<string, { total: number; ok: number }>()
    for (const a of attempts) {
      const cur = map.get(a.subjectId) ?? { total: 0, ok: 0 }
      map.set(a.subjectId, { total: cur.total + 1, ok: cur.ok + (a.correct ? 1 : 0) })
    }
    return [...map.entries()]
      .map(([id, v]) => ({
        id,
        name: subjects.find((s) => s.id === id)?.name ?? id,
        color: subjects.find((s) => s.id === id)?.color ?? 'var(--color-ink-3)',
        ...v,
      }))
      .sort((a, b) => b.total - a.total)
  }, [attempts, subjects])

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acadêmico"
        subtitle="Evolução medida, não prevista."
        back="/progresso"
      />

      {/* ── Números ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatTile
          label="Conteúdos dominados"
          value={String(stateCount.dominado)}
          sub={`de ${topics.length} no banco`}
          accent={stateCount.dominado > 0}
        />
        <StatTile
          label="Exercícios"
          value={String(attempts.length)}
          sub={accuracy != null ? `${accuracy}% de acerto` : 'nenhum ainda'}
        />
        <StatTile label="Horas de estudo" value={`${studyHours}h`} sub="acumuladas" />
        <StatTile
          label="Dúvidas abertas"
          value={String(openDoubts.length)}
          sub={openDoubts.length > 0 ? 'leve para o professor' : 'nenhuma pendente'}
        />
      </div>

      {/* ── Estados dos conteúdos ───────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint={`${lessons.length} aulas no Banco Curricular`}>
          Onde estão seus conteúdos
        </SectionTitle>

        <Card className="space-y-2.5">
          {STATE_ORDER.map((st) => (
            <div key={st}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[13px] font-medium text-ink">{TOPIC_STATE_LABEL[st]}</span>
                <span className="tnum text-[12px] text-ink-3">{stateCount[st]}</span>
              </div>
              <ProgressBar
                value={stateCount[st]}
                max={Math.max(topics.length, 1)}
                color={TOPIC_STATE_COLOR[st]}
              />
            </div>
          ))}
        </Card>
      </section>

      {/* ── Desempenho por matéria ──────────────────────── */}
      {bySubject.length > 0 && (
        <section className="space-y-3">
          <SectionTitle hint="Acerto nas questões respondidas">Desempenho</SectionTitle>
          <Card className="space-y-2.5">
            {bySubject.map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-ink">{s.name}</span>
                  <span className="tnum text-[12px] text-ink-3">
                    {s.ok}/{s.total} · {pct(s.ok, s.total)}%
                  </span>
                </div>
                <ProgressBar value={s.ok} max={s.total} color={s.color} />
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* ── Vestibulares ────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Define de quais provas vêm os exercícios">Seus vestibulares</SectionTitle>
        <Card>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(EXAM_LABEL) as ExamId[]).map((id) => {
              const on = targetExams.includes(id)
              return (
                <button
                  key={id}
                  onClick={() =>
                    setTargetExams(on ? targetExams.filter((x) => x !== id) : [...targetExams, id])
                  }
                  className={cn(
                    'rounded-xl py-2.5 text-[12.5px] font-semibold transition-colors',
                    on ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-ink-3 hover:text-ink-2',
                  )}
                >
                  {EXAM_LABEL[id]}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[11.5px] leading-snug text-ink-3">
            Hoje o banco tem questões do ENEM. As demais provas entram quando forem importadas.
          </p>
        </Card>
      </section>

      {/* ── Agenda de provas ────────────────────────────── */}
      {next.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Próximas provas</SectionTitle>
          <Card className="divide-y divide-line-soft p-0">
            {next.map((e) => {
              const dias = daysBetween(today, e.date)
              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      e.kind === 'vestibular' ? 'bg-accent/12 text-accent' : 'bg-surface-3 text-ink-2',
                    )}
                  >
                    {e.kind === 'vestibular' ? <Trophy size={16} /> : <Target size={16} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{e.label}</p>
                    <p className="tnum text-[11.5px] text-ink-3">{formatShortDate(e.date)}</p>
                  </div>
                  <span className="tnum shrink-0 text-[12px] font-semibold text-ink-2">
                    {dias === 0 ? 'hoje' : `${dias}d`}
                  </span>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {/* ── Simulados ───────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          hint={simulados.length > 0 ? `${plural(simulados.length, 'registrado', 'registrados')}` : undefined}
          action={
            <button
              onClick={() => setSimOpen(true)}
              className="text-[12px] font-medium text-accent"
            >
              Registrar
            </button>
          }
        >
          Simulados
        </SectionTitle>

        {simulados.length === 0 ? (
          <Card variant="flat" className="py-7 text-center">
            <CalendarClock size={20} className="mx-auto mb-2 text-ink-3" />
            <p className="text-[13px] text-ink-3">
              Nenhum simulado registrado. Anote o resultado para medir evolução.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line-soft p-0">
            {[...simulados].reverse().map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium text-ink">
                    {EXAM_LABEL[s.exam]} · {s.source === 'escola' ? 'escola' : 'próprio'}
                  </p>
                  <p className="tnum text-[11.5px] text-ink-3">{formatShortDate(s.date)}</p>
                </div>
                <div className="text-right">
                  <p className="tnum text-[15px] font-bold text-ink">
                    {s.correctCount}/{s.totalQuestions}
                  </p>
                  <p className="tnum text-[11px] text-ink-3">
                    {pct(s.correctCount, s.totalQuestions)}%
                  </p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* ── Dúvidas abertas ─────────────────────────────── */}
      {openDoubts.length > 0 && (
        <section className="space-y-3">
          <SectionTitle hint="Leve para o professor e marque como resolvida">
            Banco de dúvidas
          </SectionTitle>
          <div className="space-y-2">
            {openDoubts.slice(0, 12).map((d) => (
              <Card key={d.id} className="p-3.5">
                <div className="flex items-start gap-2.5">
                  <HelpCircle size={15} className="mt-0.5 shrink-0 text-warn" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug text-ink-2">{d.text}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Chip>{subjectName(d.subjectId)}</Chip>
                      <Chip>{d.origin === 'exercicio' ? 'errei a questão' : d.origin}</Chip>
                      <span className="tnum text-[11px] text-ink-3">
                        {formatShortDate(d.createdAt)}
                      </span>
                    </div>
                  </div>
                  <IconButton
                    label="Marcar como resolvida"
                    onClick={() => {
                      setAnswering(d.id)
                      setAnswerText('')
                    }}
                    className="h-8 w-8"
                  >
                    <CheckCircle2 size={15} />
                  </IconButton>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Registrar simulado ──────────────────────────── */}
      <Sheet
        open={simOpen}
        onClose={() => setSimOpen(false)}
        title="Registrar simulado"
        description="Só o resultado — o objetivo é medir evolução."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              addSimulado({
                date: today,
                source: 'proprio',
                exam: simExam,
                totalQuestions: simTotal,
                correctCount: Math.min(simCorrect, simTotal),
                bySubject: {},
                notes: simNotes,
              })
              setSimOpen(false)
              setSimNotes('')
            }}
          >
            Salvar resultado
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Prova</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(EXAM_LABEL) as ExamId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setSimExam(id)}
                  className={cn(
                    'rounded-xl py-2.5 text-[12.5px] font-semibold transition-colors',
                    simExam === id ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-ink-2',
                  )}
                >
                  {EXAM_LABEL[id]}
                </button>
              ))}
            </div>
          </div>

          <NumberStepper label="Total de questões" value={simTotal} onChange={setSimTotal} step={5} min={5} max={200} />
          <NumberStepper label="Acertos" value={simCorrect} onChange={setSimCorrect} step={1} min={0} max={simTotal} />
          <TextArea
            label="Observações"
            value={simNotes}
            onChange={(e) => setSimNotes(e.target.value)}
            placeholder="O que travou? (opcional)"
          />
        </div>
      </Sheet>

      {/* ── Resolver dúvida ─────────────────────────────── */}
      <Sheet
        open={Boolean(answering)}
        onClose={() => setAnswering(null)}
        title="Resolver dúvida"
        description="Escreva o que você entendeu. Isso vira sua anotação."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              if (answering) resolveDoubt(answering, answerText)
              setAnswering(null)
            }}
          >
            Marcar como resolvida
          </Button>
        }
      >
        <TextArea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder="A explicação que faltava…"
          autoFocus
        />
      </Sheet>
    </div>
  )
}
