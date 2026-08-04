import type { DayLog, ISODate, Subject, Topic, WorkoutLog } from '@/types'
import { addDays, daysBetween, lastNDays, todayISO, weekDates } from '@/lib/date'
import { sum } from '@/lib/utils'

/**
 * Métricas de acompanhamento. A regra do produto é celebrar consistência:
 * o streak conta "dia com esforço" (estudo OU treino), não perfeição.
 */

/** Um dia "conta" quando houve estudo real ou treino concluído. */
export function dayCounts(log: DayLog | undefined): boolean {
  if (!log) return false
  return log.studyMinutes >= 20 || log.workoutDone
}

/**
 * Sequência de dias válidos terminando hoje. Se hoje ainda não contou, o streak
 * do dia anterior é mantido — o dia não acabou, não faz sentido zerar de manhã.
 */
export function computeStreak(logs: Record<ISODate, DayLog>, today: ISODate = todayISO()): number {
  let streak = 0
  let cursor = today

  if (!dayCounts(logs[today])) {
    cursor = addDays(today, -1)
  }

  // Teto de 365 evita varredura infinita em base corrompida.
  for (let i = 0; i < 365; i++) {
    if (!dayCounts(logs[cursor])) break
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

/** Melhor sequência já alcançada. */
export function computeBestStreak(logs: Record<ISODate, DayLog>): number {
  const dates = Object.keys(logs).filter((d) => dayCounts(logs[d])).sort()
  if (dates.length === 0) return 0

  let best = 1
  let run = 1
  for (let i = 1; i < dates.length; i++) {
    if (daysBetween(dates[i - 1], dates[i]) === 1) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  return best
}

export interface WeekStats {
  dates: ISODate[]
  studyMinutes: number
  studyByDay: number[]
  workouts: number
  workoutTarget: number
  exercises: number
  subjectsStudied: string[]
  mealsDone: number
  mealsTotal: number
  avgSleep: number | null
  daysActive: number
}

export function computeWeekStats(
  logs: Record<ISODate, DayLog>,
  reference: ISODate,
  opts: { workoutTarget: number; mealsPerDay: number },
): WeekStats {
  const dates = weekDates(reference)
  const dayLogs = dates.map((d) => logs[d])

  const studyByDay = dayLogs.map((l) => l?.studyMinutes ?? 0)
  const sleeps = dayLogs.map((l) => l?.sleepHours).filter((h): h is number => typeof h === 'number')

  const subjects = new Set<string>()
  for (const l of dayLogs) l?.subjectsStudied.forEach((s) => subjects.add(s))

  const mealsDone = sum(dayLogs.map((l) => (l ? Object.values(l.meals).filter(Boolean).length : 0)))

  return {
    dates,
    studyMinutes: sum(studyByDay),
    studyByDay,
    workouts: dayLogs.filter((l) => l?.workoutDone).length,
    workoutTarget: opts.workoutTarget,
    exercises: sum(dayLogs.map((l) => l?.exercisesDone ?? 0)),
    subjectsStudied: [...subjects],
    mealsDone,
    mealsTotal: opts.mealsPerDay * 7,
    avgSleep: sleeps.length ? Math.round((sum(sleeps) / sleeps.length) * 10) / 10 : null,
    daysActive: dayLogs.filter(dayCounts).length,
  }
}

/** Minutos de estudo por dia nos últimos N dias — série do gráfico. */
export function studySeries(logs: Record<ISODate, DayLog>, days = 14): Array<{ date: ISODate; minutes: number }> {
  return lastNDays(days).map((date) => ({ date, minutes: logs[date]?.studyMinutes ?? 0 }))
}

/** Distribuição de minutos por matéria, para saber onde o tempo está indo. */
export function studyBySubject(
  logs: Record<ISODate, DayLog>,
  subjects: Subject[],
  days = 30,
): Array<{ subject: Subject; count: number }> {
  const window = new Set(lastNDays(days))
  const counts = new Map<string, number>()

  for (const [date, log] of Object.entries(logs)) {
    if (!window.has(date)) continue
    for (const id of log.subjectsStudied) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }

  return subjects
    .filter((s) => s.enabled)
    .map((subject) => ({ subject, count: counts.get(subject.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
}

/** Consistência de treino nas últimas semanas. */
export function workoutConsistency(
  workoutLogs: WorkoutLog[],
  weeks = 4,
  target = 4,
): Array<{ label: string; done: number; target: number }> {
  const result: Array<{ label: string; done: number; target: number }> = []

  for (let w = weeks - 1; w >= 0; w--) {
    const ref = addDays(todayISO(), -w * 7)
    const dates = new Set(weekDates(ref))
    const done = workoutLogs.filter((l) => l.completed && dates.has(l.date)).length
    result.push({ label: w === 0 ? 'Esta semana' : `${w}sem atrás`, done, target })
  }

  return result
}

/** Quantos tópicos por status, no geral ou por matéria. */
export function topicBreakdown(topics: Topic[], subjectId?: string) {
  const list = subjectId ? topics.filter((t) => t.subjectId === subjectId) : topics
  return {
    total: list.length,
    nao_iniciado: list.filter((t) => t.status === 'nao_iniciado').length,
    preparando: list.filter((t) => t.status === 'preparando').length,
    preparado: list.filter((t) => t.status === 'preparado').length,
    revisando: list.filter((t) => t.status === 'revisando').length,
    dominado: list.filter((t) => t.status === 'dominado').length,
    exercises: sum(list.map((t) => t.exercisesDone)),
  }
}
