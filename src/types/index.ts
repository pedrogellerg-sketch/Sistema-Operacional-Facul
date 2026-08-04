/**
 * Modelo de domínio do Sistema Fernando.
 *
 * Regra geral: datas do dia usam string `YYYY-MM-DD` (chave estável, ordenável,
 * imune a fuso). Horários usam `HH:MM` em 24h. Nada de `Date` serializado.
 */

export type ISODate = string // 'YYYY-MM-DD'
export type Clock = string // 'HH:MM'

/** 0 = domingo … 6 = sábado (mesmo índice de `Date.getDay()`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

// ─────────────────────────────────────────────────────────────
// Matérias e plano de estudos
// ─────────────────────────────────────────────────────────────

/**
 * Peso da matéria no vestibular do usuário. Define quanto espaço ela ocupa
 * na semana e com que profundidade é estudada.
 * - `nucleo`: exatas e as que mais caem — sessão completa, alta frequência.
 * - `apoio`: importantes, mas sessão mais curta.
 * - `leve`: entram como revisão/anotação, sem estudo pesado.
 * - `opcional`: só aparecem se sobrar espaço (ex.: Inglês).
 */
export type SubjectTier = 'nucleo' | 'apoio' | 'leve' | 'opcional'

/** Como o usuário se sente na matéria — ajusta duração e ordem da sessão. */
export type SubjectStrength = 'fraca' | 'media' | 'forte'

export type SubjectArea = 'exatas' | 'natureza' | 'humanas' | 'linguagens' | 'redacao'

export interface Subject {
  id: string
  name: string
  shortName: string
  area: SubjectArea
  tier: SubjectTier
  strength: SubjectStrength
  /** Ordem de prioridade declarada pelo método (menor = mais prioritário). */
  priority: number
  color: string
  /** Matéria desligada não entra na sugestão nem na agenda. */
  enabled: boolean
}

/**
 * Estado de aprendizagem de um tópico — **fonte única da verdade**.
 *
 * Até a Sprint 2 existiam duas máquinas de estado para a mesma coisa: esta, no
 * `appStore`, e um mapa `topicStates` no `curriculumStore`. Preparar uma aula
 * escrevia só a segunda, então a tela de Estudos continuava achando que o
 * assunto nunca fora visto e o sugeria de novo. Agora há só esta.
 *
 * Mora no tópico, e não no banco curricular, por duas razões: é o tópico que a
 * arquitetura define como unidade de aprendizado, e assim marcar um assunto
 * como estudado deixa de reescrever os ~70 KB do plano de aulas.
 */
export type TopicStatus =
  | 'nao_iniciado'
  | 'preparando'
  | 'preparado'
  | 'revisando'
  | 'dominado'

export interface Topic {
  id: string
  subjectId: string
  title: string
  status: TopicStatus
  /** 1 = tranquilo, 5 = osso duro. Influencia a prioridade da sugestão. */
  difficulty: 1 | 2 | 3 | 4 | 5
  exercisesDone: number
  lastReviewedAt: ISODate | null
  notes: string
  /** Ordem dentro da trilha da matéria. */
  order: number
}

// ─────────────────────────────────────────────────────────────
// Método de estudo — a sessão guiada
// ─────────────────────────────────────────────────────────────

export type StudyStepKind = 'revisao_anterior' | 'videoaula' | 'exercicios' | 'duvidas' | 'revisao_final'

export interface StudyStep {
  kind: StudyStepKind
  title: string
  /** Instrução curta e concreta: o que fazer neste passo. */
  instruction: string
  minutes: number
  done: boolean
}

export interface StudySession {
  id: string
  date: ISODate
  subjectId: string
  topicId: string | null
  topicTitle: string
  steps: StudyStep[]
  /** Índice do passo atual. */
  currentStep: number
  startedAt: number | null
  completedAt: number | null
  /** Minutos efetivamente registrados ao concluir. */
  minutesLogged: number
  exercisesLogged: number
  /** Dúvidas anotadas durante a sessão, para revisar depois. */
  questions: string[]
}

// ─────────────────────────────────────────────────────────────
// Rotina — a semana-modelo
// ─────────────────────────────────────────────────────────────

export type BlockKind =
  | 'acordar'
  | 'escola'
  | 'almoco'
  | 'lanche'
  | 'treino'
  | 'banho'
  | 'estudo'
  | 'jantar'
  | 'revisao'
  | 'livre'
  | 'dormir'

/** Bloco da semana-modelo (template, não uma ocorrência de um dia específico). */
export interface RoutineBlock {
  id: string
  kind: BlockKind
  label: string
  start: Clock
  /** Duração em minutos. */
  minutes: number
  /** Bloco fixo não é reorganizado pelo gerador (ex.: escola). */
  fixed: boolean
}

export interface DayRoutine {
  weekday: Weekday
  /** Dia com aula à tarde muda toda a montagem do período. */
  afternoonClass: boolean
  workout: boolean
  blocks: RoutineBlock[]
  /** Marca que o usuário editou este dia à mão — o gerador não sobrescreve. */
  customized: boolean
}

export interface RoutineSettings {
  schoolStart: Clock
  schoolEnd: Clock
  /** Fim da escola nos dias com aula à tarde. */
  schoolEndAfternoon: Clock
  workoutTime: Clock
  workoutMinutes: number
  studyBlockMinutes: number
  wakeTime: Clock
  sleepTime: Clock
  /** Dias com aula à tarde. */
  afternoonClassDays: Weekday[]
  workoutDays: Weekday[]
  /** Dia sem estudo pesado — só revisão leve. */
  lightDays: Weekday[]
}

// ─────────────────────────────────────────────────────────────
// Treino
// ─────────────────────────────────────────────────────────────

export interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: string
  /** Última carga usada, em kg. `null` enquanto não registrado. */
  lastLoad: number | null
  notes: string
}

export interface WorkoutTemplate {
  id: string
  /** Ex.: 'A — Peito e tríceps'. */
  name: string
  focus: string
  estimatedMinutes: number
  exercises: WorkoutExercise[]
}

export interface WorkoutLog {
  id: string
  date: ISODate
  templateId: string
  templateName: string
  completed: boolean
  /** Registrado quando o usuário foi mesmo sem vontade — conta dobrado no ânimo. */
  lowMotivation: boolean
  minutes: number
  /** Cargas por exercício no dia: `{ [exerciseId]: kg }`. */
  loads: Record<string, number>
  notes: string
}

// ─────────────────────────────────────────────────────────────
// Alimentação
// ─────────────────────────────────────────────────────────────

export type MealSlot = 'cafe' | 'lanche_escola' | 'almoco' | 'pre_treino' | 'pos_treino' | 'jantar'

export interface MealPlan {
  slot: MealSlot
  label: string
  time: Clock
  /** O que comer — texto livre, editável. */
  description: string
  /** Estimativas grosseiras. O objetivo é acompanhar, não virar app de nutrição. */
  calories: number | null
  protein: number | null
  enabled: boolean
}

export interface PantryItem {
  id: string
  name: string
  /** Item base em falta dispara alerta na home. */
  essential: boolean
  inStock: boolean
}

export interface ShoppingItem {
  id: string
  name: string
  done: boolean
}

// ─────────────────────────────────────────────────────────────
// Registro diário e acompanhamento
// ─────────────────────────────────────────────────────────────

/** Estado de um bloco da agenda no dia. */
export type TaskState = 'pendente' | 'feito' | 'pulado'

export interface DayLog {
  date: ISODate
  /** Estado por id de bloco da agenda do dia. */
  blocks: Record<string, TaskState>
  meals: Record<string, boolean>
  /** Horas dormidas na noite anterior. */
  sleepHours: number | null
  weightKg: number | null
  studyMinutes: number
  exercisesDone: number
  subjectsStudied: string[]
  workoutDone: boolean
  notes: string
}

// ─────────────────────────────────────────────────────────────
// Agenda do dia — o que a home realmente mostra
// ─────────────────────────────────────────────────────────────

/**
 * Ocorrência concreta de um bloco em uma data. Derivada da semana-modelo
 * + treino + refeições. Nunca persistida: é sempre recalculada, o que
 * permite editar a rotina sem quebrar histórico.
 */
export interface AgendaItem {
  id: string
  kind: BlockKind
  label: string
  detail: string
  start: Clock
  end: Clock
  minutes: number
  state: TaskState
  /** Ação que o botão principal dispara no modo execução. */
  action: AgendaAction | null
  icon: string
}

export type AgendaAction =
  | { type: 'estudo'; subjectId: string | null }
  | { type: 'treino'; templateId: string }
  | { type: 'refeicao'; slot: MealSlot }
  | { type: 'simples' }

// ─────────────────────────────────────────────────────────────
// Perfil e app
// ─────────────────────────────────────────────────────────────

export interface Profile {
  name: string
  grade: string
  targetExam: string
  heightCm: number | null
  startWeightKg: number | null
  goalWeightKg: number | null
  onboarded: boolean
}

export interface WeightEntry {
  date: ISODate
  kg: number
}

/** Formato completo do estado persistido — o contrato de export/import. */
export interface PersistedState {
  version: number
  profile: Profile
  routineSettings: RoutineSettings
  week: DayRoutine[]
  subjects: Subject[]
  topics: Topic[]
  sessions: StudySession[]
  workoutTemplates: WorkoutTemplate[]
  workoutLogs: WorkoutLog[]
  meals: MealPlan[]
  pantry: PantryItem[]
  shopping: ShoppingItem[]
  logs: Record<ISODate, DayLog>
  weights: WeightEntry[]
}
