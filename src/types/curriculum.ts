import type { Clock, ISODate, TopicStatus, Weekday } from '@/types'

/**
 * Modelo do Banco Curricular (Sprint 2).
 *
 * Princípio que sustenta o módulo inteiro: **fato é armazenado, cronograma é
 * calculado**. Nenhuma aula guarda a data em que acontece. A data sai de
 * `grade semanal + calendário escolar + deslocamento da disciplina`, calculada
 * na hora. É isso que torna "o professor atrasou" um `offset += 1` em vez de
 * uma reescrita de 40 registros.
 */

// ─────────────────────────────────────────────────────────────
// Banco Curricular
// ─────────────────────────────────────────────────────────────

/** Nem toda linha do plano é aula: tem feriado, prova e devolutiva. */
export type LessonKind =
  | 'aula'
  | 'avaliacao'
  | 'correcao'
  | 'revisao'
  | 'feriado'
  | 'sem_aula'

/** Referência ao material didático — complementar, nunca obrigatória. */
export interface MaterialRef {
  /** Ex.: 'anglo ALFA 1', 'Moderna Plus (Tito e Canto)', 'Caderno de Estudos 1'. */
  book: string | null
  chapter: string | null
  pages: string | null
  /** Ex.: 'questões 1 a 4', 'Exercícios: Todos'. */
  exercises: string | null
}

/**
 * Uma aula do planejamento oficial. É registro factual e imutável na prática:
 * o progresso do aluno vive em `Topic`, não aqui.
 */
export interface CurriculumLesson {
  id: string
  subjectId: string
  /** Número declarado no plano. Pode repetir ou vir fora de ordem no original. */
  number: number
  /** Quando o plano agrupa aulas ('Aulas 82, 83 e 84'), quantas são. */
  span: number
  /** Semana declarada, quando o documento informa. */
  week: number | null
  /** Trilha paralela dentro da disciplina — as "FRENTES" de História. */
  track: string | null
  kind: LessonKind
  title: string
  objectives: string[]
  strategies: string[]
  homework: string | null
  material: MaterialRef
  /** Data escrita no próprio plano, quando existe. Vence a data calculada. */
  declaredDate: ISODate | null
  /** Tópico de estudo correspondente. Várias aulas podem apontar para o mesmo. */
  topicId: string | null
  /** Ordem canônica dentro da disciplina — o que o cronograma usa. */
  order: number
}

// ─────────────────────────────────────────────────────────────
// Grade semanal e calendário escolar
// ─────────────────────────────────────────────────────────────

export interface GridSlot {
  weekday: Weekday
  /** Posição no dia (1 = primeira aula). */
  period: number
  start: Clock
  end: Clock
  subjectId: string
  teacher: string | null
}

export type SchoolEventKind =
  | 'inicio'
  | 'feriado'
  | 'sem_aula'
  | 'avaliacao'
  | 'simulado'
  | 'vestibular'
  | 'outro'

export interface SchoolEvent {
  id: string
  date: ISODate
  kind: SchoolEventKind
  label: string
  /** Avaliação/simulado de uma disciplina específica, quando aplicável. */
  subjectId: string | null
  /** Vestibular referenciado (fuvest, enem…), para simulados e provas. */
  exam: ExamId | null
  /** Feriado e "sem aula" suspendem o cronograma. */
  suspendsClasses: boolean
}

export interface SchoolCalendar {
  /** Primeiro dia letivo do período. Âncora de todo o cronograma. */
  startDate: ISODate
  endDate: ISODate
  events: SchoolEvent[]
}

// ─────────────────────────────────────────────────────────────
// Deslocamento — o "Aula Real"
// ─────────────────────────────────────────────────────────────

export type RealClassOutcome =
  | 'normal'
  | 'atrasou'
  | 'adiantou'
  | 'conteudo_diferente'
  | 'cancelada'

export interface RealClassReport {
  id: string
  date: ISODate
  subjectId: string
  outcome: RealClassOutcome
  /** Preenchido quando o conteúdo foi outro. */
  note: string
  /** Efeito aplicado ao deslocamento da disciplina (-1, 0, +1…). */
  offsetDelta: number
}

// ─────────────────────────────────────────────────────────────
// Cronograma derivado (nunca persistido)
// ─────────────────────────────────────────────────────────────

/** Ocorrência concreta de uma aula em uma data. Sempre recalculada. */
export interface ScheduledLesson {
  date: ISODate
  slot: GridSlot
  lesson: CurriculumLesson | null
  /** `true` quando a data veio escrita no plano, não do cálculo. */
  fromDeclaredDate: boolean
}

// ─────────────────────────────────────────────────────────────
// Estados do conteúdo
// ─────────────────────────────────────────────────────────────

/**
 * Cinco estados persistidos. Os dois estados restantes do desenho original
 * são derivados: "em aula" é `hoje === data da aula`, e "revisão futura" é
 * `dominado` com `nextReviewAt` no futuro.
 *
 * É apelido de `TopicStatus`, o estado que vive no próprio tópico — os dois
 * nomes descrevem a mesma coisa e agora apontam para o mesmo tipo.
 */
export type TopicState = TopicStatus

export const TOPIC_STATE_LABEL: Record<TopicState, string> = {
  nao_iniciado: 'Não iniciado',
  preparando: 'Preparando',
  preparado: 'Estudado antes da aula',
  revisando: 'Em revisão',
  dominado: 'Dominado',
}

export const TOPIC_STATE_COLOR: Record<TopicState, string> = {
  nao_iniciado: 'var(--color-ink-3)',
  preparando: 'var(--color-warn)',
  preparado: 'var(--color-accent)',
  revisando: 'var(--color-info)',
  dominado: 'var(--color-ok)',
}

// ─────────────────────────────────────────────────────────────
// Dúvidas
// ─────────────────────────────────────────────────────────────

export type DoubtOrigin = 'estudo' | 'aula' | 'exercicio' | 'simulado'

export interface Doubt {
  id: string
  topicId: string
  subjectId: string
  text: string
  origin: DoubtOrigin
  createdAt: ISODate
  resolvedAt: ISODate | null
  answer: string
}

// ─────────────────────────────────────────────────────────────
// Vestibulares, questões e desempenho
// ─────────────────────────────────────────────────────────────

export type ExamId = 'enem' | 'fuvest' | 'unicamp' | 'unesp' | 'fgv' | 'insper'

export const EXAM_LABEL: Record<ExamId, string> = {
  enem: 'ENEM',
  fuvest: 'Fuvest',
  unicamp: 'Unicamp',
  unesp: 'Unesp',
  fgv: 'FGV',
  insper: 'Insper',
}

export interface Question {
  id: string
  exam: string
  year: number
  number: number
  subjectId: string
  context: string | null
  statement: string
  alternatives: Array<{ letter: string; text: string }>
  correct: string
}

/** Resposta do usuário a uma questão. É isso que alimenta o algoritmo. */
export interface QuestionAttempt {
  questionId: string
  topicId: string | null
  subjectId: string
  answered: string
  correct: boolean
  date: ISODate
}

export type ExerciseLevel = 'basico' | 'intermediario' | 'vestibular' | 'revisao'

// ─────────────────────────────────────────────────────────────
// Videoaulas
// ─────────────────────────────────────────────────────────────

export type VideoKind = 'resumo' | 'completo' | 'revisao'

export interface VideoRef {
  id: string
  /** Palavra-chave do tópico a que o vídeo se aplica. */
  topicKey: string
  subjectId: string
  kind: VideoKind
  title: string
  channel: string
  url: string
  minutes: number
  /** Adicionado pelo usuário, não veio do catálogo. */
  custom?: boolean
}

// ─────────────────────────────────────────────────────────────
// Simulados
// ─────────────────────────────────────────────────────────────

export interface SimuladoResult {
  id: string
  date: ISODate
  /** Simulado da escola (do calendário) ou montado pelo próprio usuário. */
  source: 'escola' | 'proprio'
  exam: ExamId
  totalQuestions: number
  correctCount: number
  /** Acertos por disciplina, quando registrado. */
  bySubject: Record<string, { total: number; correct: number }>
  notes: string
}
