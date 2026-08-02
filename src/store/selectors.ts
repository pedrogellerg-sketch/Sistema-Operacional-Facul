import { useMemo } from 'react'

import { useAppStore } from '@/store/appStore'
import { buildAgenda, resolveNow, summarizeDay } from '@/lib/agendaEngine'
import { rankSubjects } from '@/lib/studyEngine'
import { computeStreak, computeWeekStats } from '@/lib/statsEngine'
import { nowMinutes, todayISO, weekdayOf } from '@/lib/date'
import type { AgendaItem, DayLog, ISODate } from '@/types'

/**
 * Seletores derivados. Tudo aqui é recomputado a partir do estado persistido —
 * nada de agenda salva, o que mantém rotina editável sem migração de dados.
 */

/** Log do dia, com um vazio estável quando ainda não existe registro. */
export function useDayLog(date: ISODate = todayISO()): DayLog | undefined {
  return useAppStore((s) => s.logs[date])
}

export function useAgenda(date: ISODate = todayISO()): AgendaItem[] {
  const week = useAppStore((s) => s.week)
  const log = useAppStore((s) => s.logs[date])
  const subjects = useAppStore((s) => s.subjects)
  const topics = useAppStore((s) => s.topics)
  const meals = useAppStore((s) => s.meals)
  const workoutTemplates = useAppStore((s) => s.workoutTemplates)
  const workoutRotation = useAppStore((s) => s.workoutRotation)

  return useMemo(
    () =>
      buildAgenda({
        date,
        week,
        log,
        subjects,
        topics,
        meals,
        workoutTemplates,
        workoutRotation,
      }),
    [date, week, log, subjects, topics, meals, workoutTemplates, workoutRotation],
  )
}

/**
 * Estado do "agora". `minutes` entra como parâmetro para que a home possa
 * passar um relógio que avança e forçar o recálculo.
 */
export function useNow(date: ISODate = todayISO(), minutes: number = nowMinutes()) {
  const agenda = useAgenda(date)
  return useMemo(() => resolveNow(agenda, minutes), [agenda, minutes])
}

export function useDayStatus(date: ISODate = todayISO()) {
  const agenda = useAgenda(date)
  const log = useAppStore((s) => s.logs[date])
  const meals = useAppStore((s) => s.meals)
  return useMemo(() => summarizeDay(agenda, log, meals), [agenda, log, meals])
}

export function useSuggestions(date: ISODate = todayISO()) {
  const subjects = useAppStore((s) => s.subjects)
  const topics = useAppStore((s) => s.topics)
  const log = useAppStore((s) => s.logs[date])
  const week = useAppStore((s) => s.week)

  return useMemo(() => {
    const day = week.find((d) => d.weekday === weekdayOf(date))
    const lightDay = day ? !day.blocks.some((b) => b.kind === 'estudo') : false
    return rankSubjects(subjects, topics, {
      studiedToday: log?.subjectsStudied ?? [],
      date,
      lightDay,
    })
  }, [subjects, topics, log, date, week])
}

export function useActiveSession() {
  const sessions = useAppStore((s) => s.sessions)
  const activeId = useAppStore((s) => s.activeSessionId)
  return useMemo(() => sessions.find((x) => x.id === activeId) ?? null, [sessions, activeId])
}

export function useStreak(): number {
  const logs = useAppStore((s) => s.logs)
  return useMemo(() => computeStreak(logs), [logs])
}

export function useWeekStats(reference: ISODate = todayISO()) {
  const logs = useAppStore((s) => s.logs)
  const workoutDays = useAppStore((s) => s.routineSettings.workoutDays)
  const meals = useAppStore((s) => s.meals)

  return useMemo(
    () =>
      computeWeekStats(logs, reference, {
        workoutTarget: workoutDays.length,
        mealsPerDay: meals.filter((m) => m.enabled).length,
      }),
    [logs, reference, workoutDays, meals],
  )
}

/** Treino do dia conforme a rotação atual do split. */
export function useTodayWorkout() {
  const templates = useAppStore((s) => s.workoutTemplates)
  const rotation = useAppStore((s) => s.workoutRotation)
  const week = useAppStore((s) => s.week)

  return useMemo(() => {
    const day = week.find((d) => d.weekday === weekdayOf(todayISO()))
    const isWorkoutDay = day?.workout ?? false
    const template = templates.length ? templates[rotation % templates.length] : null
    return { template, isWorkoutDay }
  }, [templates, rotation, week])
}

export function useSubject(id: string | null | undefined) {
  return useAppStore((s) => (id ? s.subjects.find((x) => x.id === id) : undefined))
}

/** Itens base em falta — dispara o alerta de alimentação na home. */
export function useMissingEssentials() {
  const pantry = useAppStore((s) => s.pantry)
  return useMemo(() => pantry.filter((p) => p.essential && !p.inStock), [pantry])
}
