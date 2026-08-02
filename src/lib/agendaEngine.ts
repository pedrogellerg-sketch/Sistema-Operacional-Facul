import type {
  AgendaItem,
  BlockKind,
  DayLog,
  DayRoutine,
  ISODate,
  MealPlan,
  MealSlot,
  Subject,
  Topic,
  WorkoutTemplate,
} from '@/types'
import { BLOCK_META } from '@/lib/routineEngine'
import { rankSubjects } from '@/lib/studyEngine'
import { addMinutes, clockToMinutes, nowMinutes, weekdayOf } from '@/lib/date'

/**
 * Monta a agenda concreta de um dia a partir da semana-modelo.
 *
 * A agenda nunca é persistida — é sempre derivada. Isso é o que permite editar
 * a rotina a qualquer momento sem corromper o histórico: os `DayLog` guardam
 * estado por id de bloco, e ids desconhecidos simplesmente voltam a 'pendente'.
 */

export interface BuildAgendaInput {
  date: ISODate
  week: DayRoutine[]
  log: DayLog | undefined
  subjects: Subject[]
  topics: Topic[]
  meals: MealPlan[]
  workoutTemplates: WorkoutTemplate[]
  /** Índice para escolher o treino do dia dentro do split (rotativo). */
  workoutRotation: number
}

export function buildAgenda(input: BuildAgendaInput): AgendaItem[] {
  const { date, week, log, subjects, topics, meals, workoutTemplates, workoutRotation } = input
  const weekday = weekdayOf(date)
  const day = week.find((d) => d.weekday === weekday)
  if (!day) return []

  // Sugestões de matéria para preencher os blocos de estudo do dia, sem repetir.
  const studiedToday = log?.subjectsStudied ?? []
  const ranked = rankSubjects(subjects, topics, {
    studiedToday,
    date,
    lightDay: day.blocks.every((b) => b.kind !== 'estudo'),
  })
  let studyIndex = 0

  const template = workoutTemplates.length
    ? workoutTemplates[workoutRotation % workoutTemplates.length]
    : null

  return day.blocks.map((block) => {
    const end = addMinutes(block.start, block.minutes)
    const state = log?.blocks[block.id] ?? 'pendente'
    const meta = BLOCK_META[block.kind]

    let detail = ''
    let action: AgendaItem['action'] = { type: 'simples' }

    switch (block.kind) {
      case 'estudo': {
        const pick = ranked[studyIndex]
        studyIndex += 1
        if (pick) {
          detail = pick.topic ? `${pick.subject.name} — ${pick.topic.title}` : pick.subject.name
          action = { type: 'estudo', subjectId: pick.subject.id }
        } else {
          detail = 'Escolha a matéria'
          action = { type: 'estudo', subjectId: null }
        }
        break
      }
      case 'treino': {
        if (template) {
          detail = `${template.name} — ${template.focus}`
          action = { type: 'treino', templateId: template.id }
        } else {
          detail = 'Treino do dia'
        }
        break
      }
      case 'almoco':
      case 'jantar':
      case 'lanche':
      case 'acordar': {
        const slot = mealSlotFor(block.kind, block.label)
        const meal = slot ? meals.find((m) => m.slot === slot && m.enabled) : undefined
        if (meal) {
          detail = meal.description
          action = { type: 'refeicao', slot: meal.slot }
        } else if (block.kind === 'acordar') {
          detail = 'Levantar, tomar café e sair no horário'
        }
        break
      }
      case 'escola':
        detail = 'Anote o que o professor marcar como importante'
        break
      case 'revisao':
        detail = 'Releia as anotações do dia e marque o que ficou em aberto'
        break
      case 'banho':
        detail = 'Banho e trocar de roupa'
        break
      case 'dormir':
        detail = 'Celular longe. Sono é parte do treino.'
        break
      case 'livre':
        detail = 'Descanso sem culpa'
        break
    }

    return {
      id: block.id,
      kind: block.kind,
      label: block.label,
      detail,
      start: block.start,
      end,
      minutes: block.minutes,
      state,
      action,
      icon: meta.icon,
    }
  })
}

/** Mapeia um bloco da rotina para o slot de refeição correspondente. */
function mealSlotFor(kind: string, label: string): MealSlot | null {
  const l = label.toLowerCase()
  if (kind === 'acordar') return 'cafe'
  if (kind === 'almoco') return 'almoco'
  if (kind === 'jantar') return 'jantar'
  if (kind === 'lanche') {
    if (l.includes('pré-treino') || l.includes('pre-treino')) return 'pre_treino'
    if (l.includes('chegar')) return 'lanche_escola'
    return 'lanche_escola'
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// "O que fazer agora"
// ─────────────────────────────────────────────────────────────

export interface NowState {
  /** O bloco que o usuário deveria estar fazendo (ou o próximo pendente). */
  current: AgendaItem | null
  next: AgendaItem | null
  /** Blocos pendentes que já passaram do horário. */
  overdue: AgendaItem[]
  doneCount: number
  totalCount: number
  /** `true` quando não há mais nada pendente hoje. */
  allDone: boolean
  /** Progresso do dia em %, considerando blocos acionáveis. */
  progress: number
}

/**
 * Blocos que não geram alerta de atraso. Acordar, banho e escola acontecem
 * sozinhos — avisar que "ficaram para trás" às 7h30 da manhã só produz culpa
 * inútil. O alerta é para compromisso de verdade: estudo, treino, refeição.
 */
const AMBIENT_KINDS = new Set<BlockKind>(['acordar', 'banho', 'escola', 'dormir', 'livre'])

/**
 * Decide o foco atual. Regra: entre os pendentes, o "agora" é o bloco cujo
 * horário já começou (o mais recente); se nenhum começou, é o próximo a começar.
 * Blocos passivos (escola, dormir, livre) não roubam o foco de uma ação.
 */
export function resolveNow(agenda: AgendaItem[], currentMinutes = nowMinutes()): NowState {
  const actionable = agenda.filter((a) => a.kind !== 'livre')
  const pending = actionable.filter((a) => a.state === 'pendente')
  const doneCount = actionable.filter((a) => a.state === 'feito').length
  const totalCount = actionable.length

  const started = pending.filter((a) => clockToMinutes(a.start) <= currentMinutes)
  const upcoming = pending.filter((a) => clockToMinutes(a.start) > currentMinutes)

  // Entre os já iniciados, o foco é o que ainda está dentro da janela; se todos
  // já passaram, o mais recente — é o que o usuário deveria retomar.
  const inWindow = started.find(
    (a) => clockToMinutes(a.start) + Math.max(a.minutes, 15) > currentMinutes,
  )
  const current = inWindow ?? started.at(-1) ?? upcoming[0] ?? null
  const next = current ? (pending.find((a) => a.id !== current.id && clockToMinutes(a.start) >= clockToMinutes(current.start)) ?? null) : null

  const overdue = started.filter(
    (a) =>
      a.id !== current?.id &&
      !AMBIENT_KINDS.has(a.kind) &&
      clockToMinutes(a.start) + a.minutes < currentMinutes,
  )

  return {
    current,
    next,
    overdue,
    doneCount,
    totalCount,
    allDone: pending.length === 0,
    progress: totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100),
  }
}

/** Resumo por domínio para a faixa de status da home. */
export interface DayStatus {
  school: 'pendente' | 'feito' | 'nao_hoje'
  workout: 'pendente' | 'feito' | 'pulado' | 'nao_hoje'
  study: { done: number; total: number }
  meals: { done: number; total: number }
  sleep: number | null
}

export function summarizeDay(
  agenda: AgendaItem[],
  log: DayLog | undefined,
  meals: MealPlan[],
): DayStatus {
  const schoolBlock = agenda.find((a) => a.kind === 'escola')
  const workoutBlock = agenda.find((a) => a.kind === 'treino')
  const studyBlocks = agenda.filter((a) => a.kind === 'estudo')
  const enabledMeals = meals.filter((m) => m.enabled)
  const mealsDone = enabledMeals.filter((m) => log?.meals[m.slot]).length

  return {
    school: !schoolBlock ? 'nao_hoje' : schoolBlock.state === 'feito' ? 'feito' : 'pendente',
    workout: !workoutBlock
      ? 'nao_hoje'
      : log?.workoutDone
        ? 'feito'
        : workoutBlock.state === 'pulado'
          ? 'pulado'
          : 'pendente',
    study: {
      done: studyBlocks.filter((a) => a.state === 'feito').length,
      total: studyBlocks.length,
    },
    meals: { done: mealsDone, total: enabledMeals.length },
    sleep: log?.sleepHours ?? null,
  }
}
