import type { ISODate, Weekday } from '@/types'
import type {
  CurriculumLesson,
  GridSlot,
  ScheduledLesson,
  SchoolCalendar,
} from '@/types/curriculum'
import { addDays, toISODate, weekdayOf } from '@/lib/date'

/**
 * Resolvedor de cronograma escolar.
 *
 * A data de uma aula nunca é armazenada — é calculada aqui, a partir de:
 *
 *   calendário (início + dias suspensos) + grade semanal + offset da disciplina
 *
 * Consequências práticas: "o professor atrasou" é `offset += 1` e nada mais;
 * reimportar um plano não corrompe histórico; e editar a grade recalcula tudo
 * sem migração. É a mesma decisão que faz a agenda diária da Sprint 1 funcionar.
 *
 * Quando o plano traz a data escrita (Química, História, Redação e EFL trazem),
 * ela vence o cálculo — o documento oficial é mais confiável que a inferência.
 */

export interface ScheduleInput {
  calendar: SchoolCalendar
  grid: GridSlot[]
  lessons: CurriculumLesson[]
  /** Deslocamento em aulas por disciplina, vindo dos relatos de "Aula Real". */
  offsets: Record<string, number>
}

/** Dias letivos entre duas datas, já descontando fim de semana e suspensões. */
export function schoolDays(calendar: SchoolCalendar, from: ISODate, to: ISODate): ISODate[] {
  const suspended = new Set(
    calendar.events.filter((e) => e.suspendsClasses).map((e) => e.date),
  )
  const days: ISODate[] = []

  let cursor = from
  // Teto defensivo: um semestre não passa de ~200 dias corridos.
  for (let i = 0; i < 400 && cursor <= to; i++) {
    const wd = weekdayOf(cursor)
    if (wd !== 0 && wd !== 6 && !suspended.has(cursor)) days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

/** Slots da grade de um dia, em ordem de período. */
export function slotsOfDay(grid: GridSlot[], date: ISODate): GridSlot[] {
  const wd = weekdayOf(date) as Weekday
  return grid.filter((s) => s.weekday === wd).sort((a, b) => a.period - b.period)
}

/**
 * Monta a fila de aulas de uma disciplina: primeiro as que têm data declarada
 * (fixas), depois as demais na ordem canônica.
 */
function queueFor(lessons: CurriculumLesson[], subjectId: string): CurriculumLesson[] {
  return lessons
    .filter((l) => l.subjectId === subjectId)
    .sort((a, b) => a.order - b.order)
}

/**
 * Calcula, para cada ocorrência da disciplina na grade, qual aula do plano cai
 * ali. Aulas com `span > 1` ocupam vários encontros.
 */
export function resolveSchedule(input: ScheduleInput, from: ISODate, to: ISODate): ScheduledLesson[] {
  const { calendar, grid, lessons, offsets } = input
  const days = schoolDays(calendar, from, to)

  // Fila por disciplina, com o cursor deslocado pelo offset acumulado.
  const cursors = new Map<string, number>()
  const queues = new Map<string, CurriculumLesson[]>()
  for (const slot of grid) {
    if (queues.has(slot.subjectId)) continue
    queues.set(slot.subjectId, queueFor(lessons, slot.subjectId))
    cursors.set(slot.subjectId, -(offsets[slot.subjectId] ?? 0))
  }

  // Datas declaradas têm prioridade: reservam a aula naquele dia.
  const declared = new Map<string, CurriculumLesson[]>()
  for (const l of lessons) {
    if (!l.declaredDate) continue
    const key = `${l.subjectId}|${l.declaredDate}`
    if (!declared.has(key)) declared.set(key, [])
    declared.get(key)!.push(l)
  }

  const out: ScheduledLesson[] = []

  for (const date of days) {
    // Conta quantas ocorrências de cada disciplina já foram usadas neste dia.
    const usedToday = new Map<string, number>()

    for (const slot of slotsOfDay(grid, date)) {
      const subject = slot.subjectId
      const used = usedToday.get(subject) ?? 0
      usedToday.set(subject, used + 1)

      const fixed = declared.get(`${subject}|${date}`)
      if (fixed && fixed[used]) {
        out.push({ date, slot, lesson: fixed[used], fromDeclaredDate: true })
        continue
      }

      const queue = queues.get(subject) ?? []
      // Pula as que já foram fixadas por data declarada.
      let idx = cursors.get(subject) ?? 0
      while (idx >= 0 && idx < queue.length && queue[idx].declaredDate) idx += 1
      cursors.set(subject, idx + 1)

      const lesson = idx >= 0 && idx < queue.length ? queue[idx] : null
      out.push({ date, slot, lesson, fromDeclaredDate: false })
    }
  }

  return out
}

/** Aulas de um dia específico, já resolvidas. */
export function lessonsOnDate(input: ScheduleInput, date: ISODate): ScheduledLesson[] {
  return resolveSchedule(input, input.calendar.startDate, date).filter((s) => s.date === date)
}

/**
 * A pergunta central da Sprint: o que a escola dá amanhã?
 *
 * "Amanhã" é o próximo dia letivo — na sexta-feira, isso é a segunda. Sem essa
 * regra, a tela principal ficaria vazia todo fim de semana.
 */
export function nextSchoolDay(calendar: SchoolCalendar, from: ISODate): ISODate | null {
  const suspended = new Set(
    calendar.events.filter((e) => e.suspendsClasses).map((e) => e.date),
  )
  let cursor = addDays(from, 1)
  for (let i = 0; i < 30; i++) {
    if (cursor > calendar.endDate) return null
    const wd = weekdayOf(cursor)
    if (wd !== 0 && wd !== 6 && !suspended.has(cursor)) return cursor
    cursor = addDays(cursor, 1)
  }
  return null
}

/** Eventos do calendário numa data. */
export function eventsOn(calendar: SchoolCalendar, date: ISODate) {
  return calendar.events.filter((e) => e.date === date)
}

/** Próximos simulados e vestibulares, para a home e o dashboard. */
export function upcomingExams(calendar: SchoolCalendar, from: ISODate, limit = 4) {
  return calendar.events
    .filter((e) => (e.kind === 'simulado' || e.kind === 'vestibular') && e.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit)
}

/** Próxima avaliação de uma disciplina — usada para priorizar o estudo. */
export function nextAssessment(calendar: SchoolCalendar, from: ISODate) {
  return (
    calendar.events
      .filter((e) => e.kind === 'avaliacao' && e.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  )
}

export function todayISO(): ISODate {
  return toISODate()
}
