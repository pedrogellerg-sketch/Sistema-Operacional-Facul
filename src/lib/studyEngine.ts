import type {
  ISODate,
  StudySession,
  StudyStep,
  StudyStepKind,
  Subject,
  SubjectTier,
  Topic,
} from '@/types'
import { STEP_COACH } from '@/data/coach'
import { daysBetween, todayISO } from '@/lib/date'
import { uid } from '@/lib/utils'

/**
 * O método de estudo, em código.
 *
 * Toda sessão segue a mesma sequência — revisão → videoaula → exercícios →
 * dúvidas → revisão final — mas a duração de cada passo muda conforme o peso
 * da matéria e o quanto o usuário se sente forte nela. Matéria leve não recebe
 * videoaula nem bateria de exercícios: entra como revisão e anotação.
 */

const STEP_TITLE: Record<StudyStepKind, string> = {
  revisao_anterior: 'Revisão da aula anterior',
  videoaula: 'Videoaula',
  exercicios: 'Exercícios',
  duvidas: 'Dúvidas',
  revisao_final: 'Revisão final',
}

/** Multiplicador de duração por tier. */
const TIER_WEIGHT: Record<SubjectTier, number> = {
  nucleo: 1,
  apoio: 0.8,
  leve: 0.5,
  opcional: 0.4,
}

/** Base de minutos por passo em uma sessão completa (matéria núcleo). */
const BASE_MINUTES: Record<StudyStepKind, number> = {
  revisao_anterior: 10,
  videoaula: 20,
  exercicios: 35,
  duvidas: 10,
  revisao_final: 10,
}

/**
 * Quais passos entram por tier. Português, Sociologia e Filosofia nascem como
 * `leve`: revisão e anotação, sem videoaula longa nem lista de exercícios.
 */
const TIER_STEPS: Record<SubjectTier, StudyStepKind[]> = {
  nucleo: ['revisao_anterior', 'videoaula', 'exercicios', 'duvidas', 'revisao_final'],
  apoio: ['revisao_anterior', 'videoaula', 'exercicios', 'duvidas', 'revisao_final'],
  leve: ['revisao_anterior', 'videoaula', 'revisao_final'],
  opcional: ['revisao_anterior', 'revisao_final'],
}

/**
 * Ajuste por força na matéria: quem está fraco assiste mais e faz mais
 * exercício; quem está forte corre para a prática e a revisão.
 */
function strengthAdjust(step: StudyStepKind, strength: Subject['strength']): number {
  if (strength === 'fraca') {
    if (step === 'videoaula') return 1.3
    if (step === 'exercicios') return 1.2
    if (step === 'duvidas') return 1.3
    return 1
  }
  if (strength === 'forte') {
    if (step === 'videoaula') return 0.6
    if (step === 'exercicios') return 1.1
    if (step === 'duvidas') return 0.7
    return 0.8
  }
  return 1
}

function instructionFor(step: StudyStepKind, subject: Subject, topicTitle: string): string {
  if (step === 'videoaula' && subject.tier === 'leve') {
    return `Leia ou assista algo curto sobre "${topicTitle}" e faça um resumo de 5 linhas.`
  }
  if (step === 'exercicios') {
    const count = subject.strength === 'fraca' ? 10 : 15
    return `Faça ${count} questões de "${topicTitle}". ${STEP_COACH.exercicios}`
  }
  if (step === 'revisao_anterior' && subject.tier === 'leve') {
    return 'Passe o olho nas anotações anteriores. 5 minutos bastam.'
  }
  return STEP_COACH[step]
}

/**
 * Monta a sessão para uma matéria. Se `availableMinutes` for informado, a
 * sessão é comprimida proporcionalmente para caber no bloco da agenda.
 */
export function buildSession(
  subject: Subject,
  topic: Topic | null,
  opts: { date?: ISODate; availableMinutes?: number } = {},
): StudySession {
  const date = opts.date ?? todayISO()
  const topicTitle = topic?.title ?? 'Revisão geral'
  const kinds = TIER_STEPS[subject.tier]

  let steps: StudyStep[] = kinds.map((kind) => ({
    kind,
    title: STEP_TITLE[kind],
    instruction: instructionFor(kind, subject, topicTitle),
    minutes: Math.max(
      5,
      Math.round((BASE_MINUTES[kind] * TIER_WEIGHT[subject.tier] * strengthAdjust(kind, subject.strength)) / 5) * 5,
    ),
    done: false,
  }))

  // Encaixa no tempo disponível sem deixar nenhum passo abaixo de 5 minutos.
  if (opts.availableMinutes && opts.availableMinutes > 0) {
    const total = steps.reduce((acc, s) => acc + s.minutes, 0)
    if (total > opts.availableMinutes) {
      const ratio = opts.availableMinutes / total
      steps = steps.map((s) => ({
        ...s,
        minutes: Math.max(5, Math.round((s.minutes * ratio) / 5) * 5),
      }))
    }
  }

  return {
    id: uid('s-'),
    date,
    subjectId: subject.id,
    topicId: topic?.id ?? null,
    topicTitle,
    steps,
    currentStep: 0,
    startedAt: null,
    completedAt: null,
    minutesLogged: 0,
    exercisesLogged: 0,
    questions: [],
  }
}

export function sessionTotalMinutes(session: StudySession): number {
  return session.steps.reduce((acc, s) => acc + s.minutes, 0)
}

// ─────────────────────────────────────────────────────────────
// Sugestão: o que estudar agora
// ─────────────────────────────────────────────────────────────

export interface SubjectSuggestion {
  subject: Subject
  topic: Topic | null
  score: number
  /** Motivo em linguagem humana — o app explica por que sugeriu. */
  reason: string
}

/** Peso de prioridade por tier na fórmula de sugestão. */
const TIER_SCORE: Record<SubjectTier, number> = {
  nucleo: 100,
  apoio: 70,
  leve: 35,
  opcional: 15,
}

/**
 * Pontua cada matéria e devolve a lista ordenada. A pontuação combina:
 * prioridade do método, tempo desde a última revisão, dificuldade percebida e
 * uma penalidade para o que já foi estudado hoje.
 */
export function rankSubjects(
  subjects: Subject[],
  topics: Topic[],
  opts: { studiedToday?: string[]; date?: ISODate; lightDay?: boolean } = {},
): SubjectSuggestion[] {
  const date = opts.date ?? todayISO()
  const studiedToday = opts.studiedToday ?? []

  const suggestions = subjects
    .filter((s) => s.enabled)
    .map<SubjectSuggestion>((subject) => {
      const subjectTopics = topics
        .filter((t) => t.subjectId === subject.id)
        .sort((a, b) => a.order - b.order)

      const nextTopic = pickNextTopic(subjectTopics)

      let score = TIER_SCORE[subject.tier]
      const reasons: string[] = []

      // Prioridade declarada — desempata dentro do mesmo tier.
      score += Math.max(0, 12 - subject.priority) * 2

      // Tempo desde a última revisão: o que está parado sobe.
      const lastReview = subjectTopics
        .map((t) => t.lastReviewedAt)
        .filter((d): d is ISODate => Boolean(d))
        .sort()
        .at(-1)

      if (lastReview) {
        const days = daysBetween(lastReview, date)
        score += Math.min(days * 6, 60)
        if (days >= 7) reasons.push(`parada há ${days} dias`)
      } else {
        score += 30
        reasons.push('ainda não iniciada')
      }

      // Matéria difícil e fraca precisa de mais tempo de tela.
      if (subject.strength === 'fraca') {
        score += 25
        reasons.push('é seu ponto fraco')
      } else if (subject.strength === 'forte') {
        score -= 10
      }

      if (nextTopic) {
        score += (nextTopic.difficulty - 3) * 6
        if (nextTopic.status === 'preparando') {
          score += 20
          reasons.push('tem tópico em andamento')
        }
      } else {
        // Trilha inteira dominada: só revisão de manutenção.
        score -= 40
        reasons.push('trilha concluída — só manutenção')
      }

      // Não repetir a mesma matéria no mesmo dia.
      if (studiedToday.includes(subject.id)) score -= 120

      // Em dia leve, matéria pesada perde espaço para revisão.
      if (opts.lightDay && subject.tier === 'nucleo') score -= 30
      if (opts.lightDay && subject.tier === 'leve') score += 40

      if (reasons.length === 0) reasons.push('está na ordem de prioridade')

      return { subject, topic: nextTopic, score, reason: reasons[0] }
    })
    .sort((a, b) => b.score - a.score)

  return suggestions
}

/**
 * Próximo tópico da trilha: o que está em andamento vence; senão o primeiro
 * não iniciado; senão o `revisando` mais antigo (manutenção).
 *
 * `preparado` fica deliberadamente fora dessa disputa e só entra no desempate
 * final. Assunto estudado na véspera da aula está resolvido até a aula
 * acontecer — sugeri-lo de novo no mesmo dia era o sintoma mais visível de
 * haver duas máquinas de estado separadas.
 */
export function pickNextTopic(subjectTopics: Topic[]): Topic | null {
  const ordered = [...subjectTopics].sort((a, b) => a.order - b.order)

  const inProgress = ordered.find((t) => t.status === 'preparando')
  if (inProgress) return inProgress

  const unseen = ordered.find((t) => t.status === 'nao_iniciado')
  if (unseen) return unseen

  const reviewing = ordered
    .filter((t) => t.status === 'revisando')
    .sort((a, b) => (a.lastReviewedAt ?? '').localeCompare(b.lastReviewedAt ?? ''))
  if (reviewing.length > 0) return reviewing[0]

  // Tudo dominado: revisa o mais antigo para não enferrujar.
  const oldest = [...ordered].sort((a, b) =>
    (a.lastReviewedAt ?? '').localeCompare(b.lastReviewedAt ?? ''),
  )
  return oldest[0] ?? null
}

/** Progresso da trilha de uma matéria, em percentual de tópicos dominados. */
export function subjectProgress(subjectId: string, topics: Topic[]): number {
  const list = topics.filter((t) => t.subjectId === subjectId)
  if (list.length === 0) return 0
  const weight: Record<Topic['status'], number> = {
    nao_iniciado: 0,
    preparando: 0.35,
    // Estudado antes da aula já é progresso real: falta a aula confirmar.
    preparado: 0.55,
    revisando: 0.7,
    dominado: 1,
  }
  const score = list.reduce((acc, t) => acc + weight[t.status], 0)
  return Math.round((score / list.length) * 100)
}

export const TIER_LABEL: Record<SubjectTier, string> = {
  nucleo: 'Núcleo',
  apoio: 'Apoio',
  leve: 'Revisão leve',
  opcional: 'Opcional',
}

export const TIER_DESCRIPTION: Record<SubjectTier, string> = {
  nucleo: 'Sessão completa e alta frequência. É onde a nota é feita.',
  apoio: 'Sessão média. Importante, mas não domina a semana.',
  leve: 'Só revisão e anotação. Sem videoaula longa nem lista.',
  opcional: 'Entra quando sobra tempo. Não é gargalo.',
}

/**
 * Rótulo e cor do estado vêm de `types/curriculum` e são reexportados aqui só
 * para não quebrar quem já importava daqui. Uma definição só: antes existiam
 * duas listas de rótulos para os mesmos estados, e elas discordavam.
 */
export { TOPIC_STATE_LABEL as STATUS_LABEL, TOPIC_STATE_COLOR as STATUS_COLOR } from '@/types/curriculum'

export const STRENGTH_LABEL: Record<Subject['strength'], string> = {
  fraca: 'Ponto fraco',
  media: 'Mediana',
  forte: 'Ponto forte',
}
