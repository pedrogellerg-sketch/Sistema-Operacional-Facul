import { useState } from 'react'
import { Check, HelpCircle, Pause, Play, RotateCcw } from 'lucide-react'

import type { StudySession } from '@/types'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { StepMaterial } from '@/components/study/StepMaterial'
import { TextArea, NumberStepper } from '@/components/ui/Field'
import { cn } from '@/lib/utils'
import { formatSeconds, useTimer } from '@/hooks/useTimer'
import { useAppStore } from '@/store/appStore'

interface SessionRunnerProps {
  session: StudySession
  subjectName: string
  subjectColor: string
  /** Bloco da agenda a marcar como feito ao concluir a sessão. */
  blockId?: string
  onFinish: () => void
  onCancel: () => void
}

/**
 * Executa a sessão guiada, um passo por vez. A tela mostra apenas o passo
 * atual: os outros ficam como marcadores de progresso, sem texto competindo.
 */
export function SessionRunner({
  session,
  subjectName,
  subjectColor,
  blockId,
  onFinish,
  onCancel,
}: SessionRunnerProps) {
  const advanceStep = useAppStore((s) => s.advanceStep)
  const addQuestion = useAppStore((s) => s.addQuestion)
  const finishSession = useAppStore((s) => s.finishSession)

  const [questionOpen, setQuestionOpen] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [finishOpen, setFinishOpen] = useState(false)
  const [exercises, setExercises] = useState(0)
  /**
   * Quantas questões foram feitas dentro da própria sessão.
   *
   * Serve para pré-preencher o fechamento: quem resolveu as questões aqui não
   * deveria ter de contar de novo no fim. Fica separado de `exercises` para não
   * sobrescrever um número que o usuário já tenha ajustado à mão.
   */
  const [doneHere, setDoneHere] = useState(0)

  const isComplete = session.currentStep >= session.steps.length
  const step = session.steps[Math.min(session.currentStep, session.steps.length - 1)]
  const timer = useTimer(step.minutes * 60)

  /**
   * Abre o fechamento já com o número de questões feitas aqui dentro. Só
   * semeia quando o usuário ainda não mexeu no contador — o ajuste dele manda.
   */
  const abrirFechamento = () => {
    if (exercises === 0 && doneHere > 0) setExercises(doneHere)
    setFinishOpen(true)
  }

  const handleAdvance = () => {
    const isLast = session.currentStep === session.steps.length - 1
    advanceStep()
    if (isLast) abrirFechamento()
  }

  /**
   * Quantas questões o passo pede.
   *
   * A instrução da sessão já traz o número ("Faça 15 questões de …"), calculado
   * a partir do peso da matéria e da autoavaliação. Lê-lo de lá evita ter duas
   * fontes para a mesma decisão.
   */
  const exerciseCount = Number(step.instruction.match(/Faça\s+(\d+)\s+quest/i)?.[1] ?? 10)

  /** Passos que abrem material embaixo do cronômetro e alongam a tela. */
  const temMaterial = !isComplete && (step.kind === 'videoaula' || step.kind === 'exercicios')

  const handleFinish = () => {
    finishSession({ exercises, blockId })
    setFinishOpen(false)
    onFinish()
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ── Cabeçalho: matéria e tópico ─────────────────── */}
      <div className="px-5 pt-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: subjectColor }}
            aria-hidden="true"
          />
          <p className="text-[12px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
            {subjectName}
          </p>
        </div>
        <p className="mt-1 truncate text-[15px] font-medium text-ink-2">{session.topicTitle}</p>
      </div>

      {/* ── Trilha de passos ────────────────────────────── */}
      <div className="mt-5 flex gap-1.5 px-5">
        {session.steps.map((s, i) => (
          <div
            key={s.kind}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              s.done && 'bg-accent',
              // O passo atual usa o lime cheio a meia opacidade: `bg-accent/40`
              // compõe sobre o fundo escuro e vira oliva sujo.
              !s.done && i === session.currentStep && 'bg-accent opacity-50',
              !s.done && i !== session.currentStep && 'bg-surface-3',
            )}
            title={s.title}
          />
        ))}
      </div>

      {/* ── Passo atual ─────────────────────────────────── */}
      {/**
       * Centralizar só vale quando o passo é curto — cronômetro e uma frase.
       * Com o material aberto (vídeo ou bateria de questões) o conteúdo passa
       * da altura da tela, e `justify-center` empurra metade do excesso para
       * cima, tornando o topo inalcançável. Nesses passos o conteúdo começa no
       * topo e ganha uma folga embaixo, para as últimas alternativas não ficarem
       * debaixo da barra de ações, que é fixa.
       */}
      <div
        className={cn(
          'flex flex-1 flex-col px-5 py-8',
          temMaterial ? 'justify-start pb-40' : 'justify-center',
        )}
      >
        <div key={session.currentStep} className="animate-in-up">
          <p className="text-[12px] font-bold tracking-[0.16em] text-accent uppercase">
            Passo {Math.min(session.currentStep + 1, session.steps.length)} de {session.steps.length}
          </p>

          <h1 className="mt-2 text-[30px] leading-[1.1] font-bold tracking-tight text-ink">
            {isComplete ? 'Sessão concluída' : step.title}
          </h1>

          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            {isComplete
              ? 'Registre quantos exercícios você fez e feche a sessão.'
              : step.instruction}
          </p>

          {/* ── Cronômetro ────────────────────────────── */}
          {!isComplete && (
            <div className="mt-8">
              <div className="flex items-end gap-3">
                <span className="tnum text-[56px] leading-none font-bold tracking-tight text-ink">
                  {formatSeconds(timer.remaining)}
                </span>
                <span className="mb-2 text-[13px] text-ink-3">de {step.minutes}min</span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${timer.progress}%` }}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant={timer.running ? 'secondary' : 'outline'}
                  size="md"
                  onClick={timer.toggle}
                  icon={timer.running ? <Pause size={16} /> : <Play size={16} />}
                >
                  {timer.running ? 'Pausar' : timer.elapsed > 0 ? 'Retomar' : 'Iniciar tempo'}
                </Button>

                {timer.elapsed > 0 && (
                  <Button variant="ghost" size="md" onClick={timer.reset} icon={<RotateCcw size={15} />}>
                    Zerar
                  </Button>
                )}
              </div>

              {/**
               * O material do passo, logo abaixo do cronômetro.
               *
               * Sem isto a sessão mandava "assista a videoaula" e "faça 15
               * questões" sem entregar nem uma coisa nem outra, e estudar de
               * verdade exigia sair da sessão — deixando o cronômetro para trás.
               */}
              <StepMaterial
                kind={step.kind}
                subjectId={session.subjectId}
                subjectName={subjectName}
                topicTitle={session.topicTitle}
                topicId={session.topicId}
                exerciseCount={exerciseCount}
                onExerciseProgress={(s) => setDoneHere(s.right + s.wrong)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Ações ───────────────────────────────────────── */}
      <div className="safe-bottom sticky bottom-0 space-y-2 border-t border-line-soft bg-base/90 px-5 pt-4 pb-4 backdrop-blur-xl">
        {isComplete ? (
          <Button variant="primary" size="lg" full onClick={abrirFechamento}>
            Fechar sessão
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              full
              onClick={handleAdvance}
              icon={<Check size={19} />}
            >
              {session.currentStep === session.steps.length - 1
                ? 'Concluir último passo'
                : 'Concluir passo'}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setQuestionOpen(true)}
                icon={<HelpCircle size={16} />}
              >
                Anotar dúvida
                {session.questions.length > 0 && ` (${session.questions.length})`}
              </Button>
              <Button variant="ghost" size="md" className="flex-1" onClick={onCancel}>
                Sair sem salvar
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Dúvidas ─────────────────────────────────────── */}
      <Sheet
        open={questionOpen}
        onClose={() => setQuestionOpen(false)}
        title="Anotar dúvida"
        description="Escreva agora, resolva depois. Não trave a sessão."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            disabled={!questionText.trim()}
            onClick={() => {
              addQuestion(questionText)
              setQuestionText('')
              setQuestionOpen(false)
            }}
          >
            Salvar dúvida
          </Button>
        }
      >
        <TextArea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Ex.: não entendi por que o delta negativo não tem raiz real"
          autoFocus
        />

        {session.questions.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">
              Dúvidas desta sessão
            </p>
            <ul className="space-y-2">
              {session.questions.map((q, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-line-soft bg-surface-2 px-3 py-2.5 text-[13px] text-ink-2"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Sheet>

      {/* ── Fechamento ──────────────────────────────────── */}
      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Fechar sessão"
        description="Quantos exercícios você fez de verdade?"
        footer={
          <Button variant="primary" size="lg" full onClick={handleFinish}>
            Registrar e fechar
          </Button>
        }
      >
        <NumberStepper value={exercises} onChange={setExercises} step={5} max={200} suffix="questões" />

        <p className="mt-4 text-[13px] leading-relaxed text-ink-3">
          O tópico vai para <strong className="text-ink-2">revisando</strong>. Quando sentir que
          domina, marque como dominado no plano de estudos.
        </p>
      </Sheet>
    </div>
  )
}
