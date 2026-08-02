import type { Clock, ISODate, Weekday } from '@/types'

/**
 * Helpers de data. Tudo em horário local do usuário — o app é pessoal e
 * offline, não há sincronização entre fusos para resolver.
 */

export const WEEKDAY_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const WEEKDAY_LETTER = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/** Chave `YYYY-MM-DD` no fuso local (nunca use `toISOString`, que converte p/ UTC). */
export function toISODate(d: Date = new Date()): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(): ISODate {
  return toISODate()
}

export function weekdayOf(iso: ISODate): Weekday {
  return fromISODate(iso).getDay() as Weekday
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function daysBetween(from: ISODate, to: ISODate): number {
  const ms = fromISODate(to).getTime() - fromISODate(from).getTime()
  return Math.round(ms / 86_400_000)
}

/** Segunda-feira da semana da data informada. */
export function startOfWeek(iso: ISODate): ISODate {
  const day = weekdayOf(iso)
  const backToMonday = day === 0 ? 6 : day - 1
  return addDays(iso, -backToMonday)
}

/** Os 7 dias da semana da data, começando na segunda. */
export function weekDates(iso: ISODate): ISODate[] {
  const monday = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function lastNDays(n: number, endISO: ISODate = todayISO()): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDays(endISO, -(n - 1 - i)))
}

/** 'seg, 12 de agosto' */
export function formatLongDate(iso: ISODate): string {
  const d = fromISODate(iso)
  return `${WEEKDAY_SHORT[d.getDay()].toLowerCase()}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

/** '12/08' */
export function formatShortDate(iso: ISODate): string {
  const d = fromISODate(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Horários ─────────────────────────────────────────────────

/** 'HH:MM' → minutos desde a meia-noite. */
export function clockToMinutes(c: Clock): number {
  const [h, m] = c.split(':').map(Number)
  return h * 60 + m
}

/** Minutos desde a meia-noite → 'HH:MM'. Envolve em 24h se passar da meia-noite. */
export function minutesToClock(min: number): Clock {
  const wrapped = ((min % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function addMinutes(c: Clock, min: number): Clock {
  return minutesToClock(clockToMinutes(c) + min)
}

/** Minutos desde a meia-noite agora. */
export function nowMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}

export function nowClock(now: Date = new Date()): Clock {
  return minutesToClock(nowMinutes(now))
}

/** '1h20' · '45min' · '2h' */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/** Distância em linguagem natural: 'em 20min', 'agora', 'há 1h'. */
export function relativeToNow(start: Clock, currentMinutes: number = nowMinutes()): string {
  const diff = clockToMinutes(start) - currentMinutes
  if (diff > 0 && diff <= 90) return `em ${formatDuration(diff)}`
  if (diff > 90) return `às ${start}`
  if (diff > -15) return 'agora'
  return `passou ${formatDuration(-diff)}`
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Ainda acordado'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
