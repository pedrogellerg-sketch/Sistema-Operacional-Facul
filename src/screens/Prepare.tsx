import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ExternalLink, HelpCircle, Play, Search, X } from 'lucide-react'

import type { TopicState } from '@/types/curriculum'
import { TOPIC_STATE_LABEL } from '@/types/curriculum'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip, Segmented } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { TextArea } from '@/components/ui/Field'
import { QuestionRunner, type QuestionScore } from '@/components/study/QuestionRunner'

import { useAppStore } from '@/store/appStore'
import { useCurriculumStore } from '@/store/curriculumStore'
import { findVideos, youtubeSearchUrl } from '@/data/videoCatalog'
import { todayISO } from '@/lib/date'

type Mode = 'video_exercicios' | 'video' | 'exercicios'
type Phase = 'escolha' | 'video' | 'exercicios' | 'fim'

/**
 * Preparação de uma aula específica — o coração do método da Sprint 2.
 *
 * Sequência: escolher o modo → vídeo → exercícios → dúvidas → concluído.
 * Errar uma questão vira dúvida do tópico automaticamente, que é o que liga o
 * exercício ao Banco de Dúvidas sem exigir nada do usuário.
 */
export function Prepare() {
  const { lessonId } = useParams()
  const navigate = useNavigate()

  const subjects = useAppStore((s) => s.subjects)
  const lesson = useCurriculumStore((s) => s.lessons.find((l) => l.id === lessonId))
  const customVideos = useCurriculumStore((s) => s.customVideos)
  const addDoubt = useCurriculumStore((s) => s.addDoubt)
  // O estado mora no tópico: é o que a tela de Estudos e o ranking também leem.
  const updateTopic = useAppStore((s) => s.updateTopic)

  const [mode, setMode] = useState<Mode>('video_exercicios')
  const [phase, setPhase] = useState<Phase>('escolha')
  const [score, setScore] = useState<QuestionScore>({ right: 0, wrong: 0, skipped: 0 })
  const [doubtOpen, setDoubtOpen] = useState(false)
  const [doubtText, setDoubtText] = useState('')

  const subject = subjects.find((s) => s.id === lesson?.subjectId)
  const subjectName = subject?.name ?? lesson?.subjectId ?? ''

  const videos = useMemo(
    () => (lesson ? findVideos(lesson.title, lesson.subjectId, customVideos) : []),
    [lesson, customVideos],
  )



  if (!lesson) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-8 text-center">
        <p className="text-[15px] font-semibold text-ink">Aula não encontrada</p>
        <Button variant="primary" size="md" className="mt-4" onClick={() => navigate('/amanha')}>
          Voltar
        </Button>
      </div>
    )
  }





  const finish = (state: TopicState) => {
    if (lesson.topicId) {
      updateTopic(lesson.topicId, { status: state, lastReviewedAt: todayISO() })
    }
    navigate('/amanha')
  }

  return (
    <div className="min-h-dvh bg-base">
      {/* ── Topo ────────────────────────────────────────── */}
      <div className="safe-top mx-auto flex w-full max-w-lg items-start justify-between gap-3 px-5 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Preparando
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-2">{subjectName}</p>
          <h1 className="mt-1 text-[19px] leading-tight font-bold text-ink">{lesson.title}</h1>
        </div>
        <IconButton label="Sair" onClick={() => navigate('/amanha')}>
          <X size={18} />
        </IconButton>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-5 px-5 py-6 pb-28">
        {/* ── Escolha do modo ───────────────────────────── */}
        {phase === 'escolha' && (
          <>
            {lesson.objectives.length > 0 && (
              <Card>
                <p className="mb-2 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
                  Revisão rápida — o que a aula cobre
                </p>
                <ul className="space-y-1.5">
                  {lesson.objectives.slice(0, 5).map((o, i) => (
                    <li key={i} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {o}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div>
              <p className="mb-2 px-1 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">
                Como quer preparar
              </p>
              <Segmented
                value={mode}
                options={[
                  { value: 'video_exercicios' as Mode, label: 'Vídeo + exercícios' },
                  { value: 'video' as Mode, label: 'Só vídeo' },
                  { value: 'exercicios' as Mode, label: 'Só exercícios' },
                ]}
                onChange={setMode}
                size="sm"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              full
              icon={<Play size={18} />}
              onClick={() => setPhase(mode === 'exercicios' ? 'exercicios' : 'video')}
            >
              Começar preparação
            </Button>
          </>
        )}

        {/* ── Vídeos ────────────────────────────────────── */}
        {phase === 'video' && (
          <>
            <p className="px-1 text-[13px] text-ink-2">
              {videos.length > 0
                ? 'Escolha um vídeo. Assista com o caderno aberto e anote o que travar.'
                : 'Ainda não tenho vídeo salvo para este assunto — busque abaixo.'}
            </p>

            <div className="space-y-2">
              {videos.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line-soft bg-surface p-4 transition-colors hover:border-line hover:bg-surface-2"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                    <Play size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-ink">
                      {v.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-ink-3">
                      {v.channel} · {v.minutes}min
                    </span>
                  </span>
                  <Chip>{v.kind === 'resumo' ? 'Resumo' : v.kind === 'completo' ? 'Completo' : 'Revisão'}</Chip>
                </a>
              ))}

              <a
                href={youtubeSearchUrl(lesson.title, subjectName)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-4 py-3.5 text-[13.5px] text-ink-2 transition-colors hover:text-ink"
              >
                <Search size={16} />
                Buscar mais vídeos no YouTube
                <ExternalLink size={13} className="ml-auto text-ink-3" />
              </a>
            </div>

            <Button
              variant="primary"
              size="lg"
              full
              onClick={() => setPhase(mode === 'video' ? 'fim' : 'exercicios')}
            >
              {mode === 'video' ? 'Concluir preparação' : 'Assisti — ir para os exercícios'}
            </Button>
          </>
        )}

        {/* ── Exercícios ────────────────────────────────── */}
        {phase === 'exercicios' && (
          <QuestionRunner
            subjectId={lesson.subjectId}
            title={lesson.title}
            topicId={lesson.topicId}
            count={6}
            fallback={
              lesson.material.exercises
                ? `Use o material do plano: ${[lesson.material.book, lesson.material.pages, lesson.material.exercises].filter(Boolean).join(' · ')}`
                : undefined
            }
            onProgress={setScore}
            onDone={() => setPhase('fim')}
          />
        )}

        {/* ── Fim ───────────────────────────────────────── */}
        {phase === 'fim' && (
          <>
            <Card variant="accent" className="p-5 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                <Check size={26} />
              </span>
              <h2 className="mt-4 text-[22px] font-bold text-ink">Preparado para a aula</h2>
              {score.right + score.wrong + score.skipped > 0 && (
                <p className="tnum mt-2 text-[14px] text-ink-2">
                  {score.right} acertos · {score.wrong} erros
                  {score.skipped > 0 && ` · ${score.skipped} puladas`}
                </p>
              )}
              {score.skipped > 0 && (
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
                  As puladas voltam em outra sessão — não ficam marcadas como erro.
                </p>
              )}
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                Amanhã a aula vira confirmação. Leve suas dúvidas para o professor.
              </p>
            </Card>

            <div className="space-y-2">
              <Button variant="primary" size="lg" full onClick={() => finish('preparado')}>
                Marcar como {TOPIC_STATE_LABEL.preparado.toLowerCase()}
              </Button>
              <Button
                variant="ghost"
                size="md"
                full
                icon={<HelpCircle size={16} />}
                onClick={() => setDoubtOpen(true)}
              >
                Anotar mais uma dúvida
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Dúvida manual ───────────────────────────────── */}
      <Sheet
        open={doubtOpen}
        onClose={() => setDoubtOpen(false)}
        title="Anotar dúvida"
        description="Ela fica ligada ao tópico e reaparece quando a aula acontecer."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            disabled={!doubtText.trim()}
            onClick={() => {
              if (lesson.topicId) {
                addDoubt({
                  topicId: lesson.topicId,
                  subjectId: lesson.subjectId,
                  text: doubtText,
                  origin: 'estudo',
                })
              }
              setDoubtText('')
              setDoubtOpen(false)
            }}
          >
            Salvar dúvida
          </Button>
        }
      >
        <TextArea
          value={doubtText}
          onChange={(e) => setDoubtText(e.target.value)}
          placeholder="O que ficou confuso?"
          autoFocus
        />
      </Sheet>
    </div>
  )
}
