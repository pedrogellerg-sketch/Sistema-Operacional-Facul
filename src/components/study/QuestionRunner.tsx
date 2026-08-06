import { useEffect, useMemo, useState } from 'react'
import { SkipForward } from 'lucide-react'

import type { Question } from '@/types/curriculum'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { useCurriculumStore } from '@/store/curriculumStore'
import { pickQuestions } from '@/lib/curriculum/questions'
import { cn } from '@/lib/utils'

export interface QuestionScore {
  right: number
  wrong: number
  skipped: number
}

interface QuestionRunnerProps {
  subjectId: string
  /** Título da aula ou do tópico — é o que casa as questões com o assunto. */
  title: string
  topicId?: string | null
  count?: number
  /** Chamado a cada questão respondida ou pulada. */
  onProgress?: (score: QuestionScore) => void
  /** Chamado quando acabam as questões. */
  onDone?: (score: QuestionScore) => void
  /** Texto do material do plano, mostrado quando não há questões no banco. */
  fallback?: string
}

/**
 * Executa uma bateria de questões, uma por vez.
 *
 * Vive aqui, e não dentro de uma tela, porque **dois lugares diferentes
 * precisam do mesmo comportamento**: a preparação da aula (`Prepare`) e o passo
 * de exercícios da sessão cronometrada (`SessionRunner`). Antes, a sessão
 * cronometrada mandava "faça 15 questões" e não entregava nenhuma — o usuário
 * tinha de sair da sessão para achar exercício, e o cronômetro ficava para trás.
 *
 * Errar uma questão vira dúvida do tópico automaticamente. É o que liga o
 * exercício ao Banco de Dúvidas sem exigir nada do usuário.
 */
export function QuestionRunner({
  subjectId,
  title,
  topicId,
  count = 6,
  onProgress,
  onDone,
  fallback,
}: QuestionRunnerProps) {
  const attempts = useCurriculumStore((s) => s.attempts)
  const recordAttempt = useCurriculumStore((s) => s.recordAttempt)
  const addDoubt = useCurriculumStore((s) => s.addDoubt)

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState<QuestionScore>({ right: 0, wrong: 0, skipped: 0 })

  const answered = useMemo(() => new Set(attempts.map((a) => a.questionId)), [attempts])

  useEffect(() => {
    if (questions.length > 0) return
    setLoading(true)
    void pickQuestions({ subjectId, title, count, exclude: answered })
      .then(({ onTopic, filler }) => setQuestions([...onTopic, ...filler]))
      .finally(() => setLoading(false))
    // `answered` muda a cada tentativa registrada; recarregar no meio da bateria
    // trocaria as questões debaixo do usuário. Por isso a lista é montada uma
    // vez só, na montagem do componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, title, count])

  const current = questions[idx]

  const avancar = (proximo: QuestionScore) => {
    setScore(proximo)
    onProgress?.(proximo)
    if (idx + 1 >= questions.length) {
      onDone?.(proximo)
      return
    }
    setIdx((i) => i + 1)
    setPicked(null)
    setRevealed(false)
  }

  const answer = (letter: string) => {
    if (revealed || !current) return
    setPicked(letter)
    setRevealed(true)

    const correct = letter === current.correct
    setScore((s) => {
      const novo = {
        ...s,
        right: s.right + (correct ? 1 : 0),
        wrong: s.wrong + (correct ? 0 : 1),
      }
      onProgress?.(novo)
      return novo
    })

    recordAttempt({
      questionId: current.id,
      topicId: topicId ?? null,
      subjectId,
      answered: letter,
      correct,
    })

    // Errou: a questão vira dúvida do tópico sem o usuário precisar anotar.
    if (!correct && topicId) {
      addDoubt({
        topicId,
        subjectId,
        text: `Errei: ${current.exam} ${current.year} nº ${current.number} — ${current.statement.slice(0, 110)}`,
        origin: 'exercicio',
      })
    }
  }

  /**
   * Pula sem responder.
   *
   * De propósito **não registra tentativa**: pular não é errar. Sem registro, a
   * questão não entra em `answered` e volta a ser sorteada numa próxima sessão —
   * que é o certo para quem travou e quer seguir, em vez de chutar. Chute
   * registrado como erro sujaria o desempenho do tópico e ainda criaria uma
   * dúvida falsa no Banco de Dúvidas.
   */
  const skip = () => {
    if (!current) return
    avancar({ ...score, skipped: score.skipped + 1 })
  }

  const next = () => avancar(score)

  if (loading) {
    return <p className="px-1 text-[13px] text-ink-3">Carregando questões…</p>
  }

  if (questions.length === 0) {
    return (
      <Card variant="flat" className="py-6 text-center">
        <p className="text-[13.5px] font-semibold text-ink">
          Sem questões no banco para esta matéria
        </p>
        {fallback && <p className="mt-2 text-[13px] text-ink-2">{fallback}</p>}
        {/* Sem saída aqui o usuário fica preso na tela; o passo precisa poder
            terminar mesmo quando não há o que responder. */}
        {onDone && (
          <Button variant="primary" size="md" className="mt-5" full onClick={() => onDone(score)}>
            Concluir
          </Button>
        )}
      </Card>
    )
  }

  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="tnum text-[12px] text-ink-3">
          Questão {idx + 1} de {questions.length}
        </span>
        <Chip color="var(--color-accent)">
          {current.exam} {current.year}
        </Chip>
      </div>

      <Card>
        {current.context && (
          <p className="mb-3 max-h-52 overflow-y-auto text-[13px] leading-relaxed whitespace-pre-line text-ink-2">
            {current.context}
          </p>
        )}
        <p className="text-[14.5px] leading-snug font-medium text-ink">{current.statement}</p>
      </Card>

      <div className="space-y-2">
        {current.alternatives.map((a) => {
          const isCorrect = a.letter === current.correct
          const isPicked = a.letter === picked
          return (
            <button
              key={a.letter}
              onClick={() => answer(a.letter)}
              disabled={revealed}
              className={cn(
                'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors',
                !revealed && 'border-line-soft bg-surface hover:border-line hover:bg-surface-2',
                revealed && isCorrect && 'border-ok/40 bg-ok/10',
                revealed && isPicked && !isCorrect && 'border-danger/40 bg-danger/10',
                revealed && !isCorrect && !isPicked && 'border-line-soft opacity-45',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold',
                  revealed && isCorrect
                    ? 'bg-ok text-accent-ink'
                    : revealed && isPicked
                      ? 'bg-danger text-white'
                      : 'bg-surface-3 text-ink-2',
                )}
              >
                {a.letter}
              </span>
              <span className="text-[13.5px] leading-snug text-ink-2">{a.text}</span>
            </button>
          )
        })}
      </div>

      {revealed ? (
        <div className="space-y-2">
          <p
            className="text-[13.5px] font-semibold"
            style={{
              color: picked === current.correct ? 'var(--color-ok)' : 'var(--color-danger)',
            }}
          >
            {picked === current.correct
              ? 'Acertou.'
              : `Errou — a resposta é ${current.correct}. Virou dúvida do tópico.`}
          </p>
          <Button variant="primary" size="lg" full onClick={next}>
            {idx + 1 >= questions.length ? 'Ver resultado' : 'Próxima questão'}
          </Button>
        </div>
      ) : (
        /**
         * Saída para quem travou. Fica discreto — em `ghost` e abaixo das
         * alternativas — porque responder é o caminho principal; pular é a
         * válvula de escape para não abandonar a sessão por causa de uma
         * questão.
         */
        <Button variant="ghost" size="md" full onClick={skip} icon={<SkipForward size={16} />}>
          {idx + 1 >= questions.length ? 'Pular e ver resultado' : 'Pular esta questão'}
        </Button>
      )}
    </div>
  )
}
