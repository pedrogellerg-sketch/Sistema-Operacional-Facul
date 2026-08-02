import type { Clock, DayRoutine, RoutineBlock, RoutineSettings, Weekday } from '@/types'
import { addMinutes, clockToMinutes, minutesToClock } from '@/lib/date'
import { uid } from '@/lib/utils'

/**
 * Gerador da semana-modelo.
 *
 * Princípio: o usuário configura poucos parâmetros (horários e quais dias têm
 * aula à tarde / treino) e o gerador monta blocos encadeados sem buraco e sem
 * sobreposição. Cada bloco começa quando o anterior termina.
 */

export const DEFAULT_ROUTINE_SETTINGS: RoutineSettings = {
  schoolStart: '07:00',
  schoolEnd: '12:20',
  schoolEndAfternoon: '17:00',
  workoutTime: '17:30',
  workoutMinutes: 60,
  studyBlockMinutes: 90,
  wakeTime: '06:10',
  sleepTime: '23:00',
  afternoonClassDays: [2, 4], // terça e quinta
  workoutDays: [1, 2, 3, 5], // seg, ter, qua, sex
  lightDays: [0], // domingo é leve
}

const KIND_LABEL: Record<RoutineBlock['kind'], string> = {
  acordar: 'Acordar',
  escola: 'Escola',
  almoco: 'Almoço',
  lanche: 'Lanche',
  treino: 'Treino',
  banho: 'Banho',
  estudo: 'Estudo',
  jantar: 'Jantar',
  revisao: 'Revisão do dia',
  livre: 'Tempo livre',
  dormir: 'Dormir',
}

function block(
  kind: RoutineBlock['kind'],
  start: string,
  minutes: number,
  opts: { label?: string; fixed?: boolean } = {},
): RoutineBlock {
  return {
    id: uid('b-'),
    kind,
    label: opts.label ?? KIND_LABEL[kind],
    start,
    minutes,
    fixed: opts.fixed ?? false,
  }
}

/**
 * Monta os blocos de um dia. A montagem muda bastante entre dia com aula à
 * tarde (janela de estudo curta, à noite) e dia livre à tarde (dois blocos).
 */
export function generateDayBlocks(
  weekday: Weekday,
  settings: RoutineSettings,
  opts: { afternoonClass: boolean; workout: boolean },
): RoutineBlock[] {
  const isWeekend = weekday === 0 || weekday === 6
  const isLight = settings.lightDays.includes(weekday)
  const blocks: RoutineBlock[] = []

  if (isWeekend) {
    return fillGaps(
      generateWeekendBlocks(settings, { workout: opts.workout, light: isLight }),
      settings.sleepTime,
    )
  }

  // ── Manhã: acordar → escola ────────────────────────────────
  blocks.push(block('acordar', settings.wakeTime, 50, { label: 'Acordar e café da manhã' }))

  const schoolEnd = opts.afternoonClass ? settings.schoolEndAfternoon : settings.schoolEnd
  const schoolMinutes = clockToMinutes(schoolEnd) - clockToMinutes(settings.schoolStart)
  blocks.push(
    block('escola', settings.schoolStart, Math.max(60, schoolMinutes), {
      label: opts.afternoonClass ? 'Escola (manhã e tarde)' : 'Escola',
      fixed: true,
    }),
  )

  let cursor = schoolEnd

  if (opts.afternoonClass) {
    // Dia cheio: chega em casa tarde, então o estudo é um bloco só, depois do treino.
    cursor = addMinutes(cursor, 20) // deslocamento até em casa
    blocks.push(block('lanche', cursor, 20, { label: 'Lanche ao chegar' }))
    cursor = addMinutes(cursor, 20)

    if (opts.workout) {
      blocks.push(block('treino', cursor, settings.workoutMinutes))
      cursor = addMinutes(cursor, settings.workoutMinutes)
      blocks.push(block('banho', cursor, 25))
      cursor = addMinutes(cursor, 25)
    }

    const dinner = laterOf(cursor, DINNER_ANCHOR)
    blocks.push(block('jantar', dinner, 40))
    cursor = addMinutes(dinner, 40)

    const studyMinutes = isLight ? 45 : Math.min(settings.studyBlockMinutes, 75)
    blocks.push(block('estudo', cursor, studyMinutes, { label: 'Estudo — bloco único' }))
    cursor = addMinutes(cursor, studyMinutes)
  } else {
    // Dia com tarde livre: dá para encaixar dois blocos de estudo.
    const lunch = laterOf(cursor, LUNCH_ANCHOR)
    blocks.push(block('almoco', lunch, 45, { label: 'Almoço' }))
    cursor = addMinutes(lunch, 45)

    const firstStudy = isLight ? 45 : settings.studyBlockMinutes
    blocks.push(block('estudo', cursor, firstStudy, { label: 'Estudo — bloco 1' }))
    cursor = addMinutes(cursor, firstStudy)

    blocks.push(block('lanche', cursor, 20, { label: 'Lanche / pré-treino' }))
    cursor = addMinutes(cursor, 20)

    if (opts.workout) {
      // Respeita o horário de treino escolhido, se ele ainda estiver à frente.
      const start = laterOf(cursor, settings.workoutTime)
      blocks.push(block('treino', start, settings.workoutMinutes))
      cursor = addMinutes(start, settings.workoutMinutes)
      blocks.push(block('banho', cursor, 25))
      cursor = addMinutes(cursor, 25)
    }

    // O 2º bloco de estudo vem antes do jantar: assim a tarde não vira um
    // vão gigante e o jantar cai em horário civil.
    if (!isLight) {
      const secondStudy = Math.min(settings.studyBlockMinutes, 60)
      // Sem treino, nada ancora a tarde: joga o bloco para o fim dela em vez
      // de emendar nos dois primeiros e deixar 4h mortas antes do jantar.
      const start = opts.workout ? cursor : laterOf(cursor, AFTERNOON_STUDY_ANCHOR)
      blocks.push(block('estudo', start, secondStudy, { label: 'Estudo — bloco 2' }))
      cursor = addMinutes(start, secondStudy)
    }

    const dinner = laterOf(cursor, DINNER_ANCHOR)
    blocks.push(block('jantar', dinner, 40))
    cursor = addMinutes(dinner, 40)
  }

  // ── Fechamento do dia ──────────────────────────────────────
  blocks.push(block('revisao', cursor, 15, { label: 'Revisão do dia' }))

  blocks.push(block('dormir', settings.sleepTime, 0, { label: 'Dormir', fixed: true }))

  return fillGaps(blocks, settings.sleepTime)
}

/** Horários civis de referência — refeições não devem cair fora deles. */
const LUNCH_ANCHOR = '12:30'
const DINNER_ANCHOR = '19:30'
/** Em tarde livre sem treino, o 2º bloco não deveria colar no 1º. */
const AFTERNOON_STUDY_ANCHOR = '16:30'
/** Fim de semana acorda tarde: a âncora da tarde vem mais cedo. */
const WEEKEND_AFTERNOON_ANCHOR = '15:30'

/** O mais tarde entre dois horários. Evita almoço às 10h no fim de semana. */
function laterOf(a: Clock, b: Clock): Clock {
  return clockToMinutes(a) >= clockToMinutes(b) ? a : b
}

function generateWeekendBlocks(
  settings: RoutineSettings,
  opts: { workout: boolean; light: boolean },
): RoutineBlock[] {
  const blocks: RoutineBlock[] = []
  // Fim de semana acorda 1h30 mais tarde — realista, e evita um plano que ninguém cumpre.
  const wake = addMinutes(settings.wakeTime, 90)

  blocks.push(block('acordar', wake, 60, { label: 'Acordar e café da manhã' }))
  let cursor = addMinutes(wake, 60)

  if (!opts.light) {
    blocks.push(block('estudo', cursor, settings.studyBlockMinutes, { label: 'Estudo — bloco 1' }))
    cursor = addMinutes(cursor, settings.studyBlockMinutes)
  } else {
    blocks.push(block('revisao', cursor, 40, { label: 'Revisão leve da semana' }))
    cursor = addMinutes(cursor, 40)
  }

  // Refeições ancoradas: o encadeamento puro empurrava o almoço para as 10h.
  const lunch = laterOf(cursor, LUNCH_ANCHOR)
  blocks.push(block('almoco', lunch, 60))
  cursor = addMinutes(lunch, 60)

  if (opts.workout) {
    const start = laterOf(cursor, settings.workoutTime)
    blocks.push(block('treino', start, settings.workoutMinutes))
    cursor = addMinutes(start, settings.workoutMinutes)
    blocks.push(block('banho', cursor, 25))
    cursor = addMinutes(cursor, 25)
  }

  // A tarde do fim de semana precisa de um bloco âncora, senão vira um vão de
  // cinco horas — que é o sistema deixando de ter opinião justamente quando
  // sobra tempo.
  const afternoon = laterOf(cursor, WEEKEND_AFTERNOON_ANCHOR)
  if (opts.light) {
    blocks.push(block('revisao', afternoon, 45, { label: 'Revisão da semana' }))
    cursor = addMinutes(afternoon, 45)
  } else {
    blocks.push(block('estudo', afternoon, 60, { label: 'Estudo — bloco 2' }))
    cursor = addMinutes(afternoon, 60)
  }

  const dinner = laterOf(cursor, DINNER_ANCHOR)
  blocks.push(block('jantar', dinner, 40))
  cursor = addMinutes(dinner, 40)

  blocks.push(block('revisao', cursor, 15, { label: 'Planejar o dia seguinte' }))

  blocks.push(block('dormir', settings.sleepTime, 0, { label: 'Dormir', fixed: true }))

  return blocks
}

/**
 * Preenche buracos na linha do tempo com "tempo livre".
 *
 * O encadeamento deixa vãos sempre que um bloco é ancorado a um horário fixo
 * (o treino às 17:30, o jantar às 20:00). Sem isso a agenda pula de 14:55 para
 * 17:30 sem explicar o que acontece no meio — e o modo execução trata esse vão
 * como atraso.
 */
function fillGaps(blocks: RoutineBlock[], sleepTime: Clock): RoutineBlock[] {
  const sorted = [...blocks].sort((a, b) => clockToMinutes(a.start) - clockToMinutes(b.start))
  const result: RoutineBlock[] = []
  const sleepAt = clockToMinutes(sleepTime)

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    result.push(current)

    const next = sorted[i + 1]
    if (!next) continue

    const endsAt = clockToMinutes(current.start) + current.minutes
    const gap = clockToMinutes(next.start) - endsAt

    // Só vãos relevantes viram bloco, e nunca depois da hora de dormir.
    if (gap >= 30 && endsAt < sleepAt) {
      result.push(block('livre', minutesToClock(endsAt), gap, { label: 'Tempo livre' }))
    }
  }

  return result
}

/**
 * Gera a semana inteira. Dias marcados como `customized` são preservados —
 * é o que permite "editar a rotina sem quebrar o sistema".
 */
export function generateWeek(settings: RoutineSettings, previous?: DayRoutine[]): DayRoutine[] {
  return Array.from({ length: 7 }, (_, i) => {
    const weekday = i as Weekday
    const existing = previous?.find((d) => d.weekday === weekday)

    if (existing?.customized) return existing

    const afternoonClass = settings.afternoonClassDays.includes(weekday)
    const workout = settings.workoutDays.includes(weekday)

    return {
      weekday,
      afternoonClass,
      workout,
      blocks: generateDayBlocks(weekday, settings, { afternoonClass, workout }),
      customized: false,
    }
  })
}

/** Regenera um único dia, descartando a customização dele. */
export function regenerateDay(weekday: Weekday, settings: RoutineSettings): DayRoutine {
  const afternoonClass = settings.afternoonClassDays.includes(weekday)
  const workout = settings.workoutDays.includes(weekday)
  return {
    weekday,
    afternoonClass,
    workout,
    blocks: generateDayBlocks(weekday, settings, { afternoonClass, workout }),
    customized: false,
  }
}

export const BLOCK_META: Record<
  RoutineBlock['kind'],
  { icon: string; color: string; tone: string }
> = {
  acordar: { icon: 'sunrise', color: 'var(--color-warn)', tone: 'Começo do dia' },
  escola: { icon: 'school', color: 'var(--color-dom-school)', tone: 'Fixo' },
  almoco: { icon: 'utensils', color: 'var(--color-dom-food)', tone: 'Refeição' },
  lanche: { icon: 'apple', color: 'var(--color-dom-food)', tone: 'Refeição' },
  treino: { icon: 'dumbbell', color: 'var(--color-dom-workout)', tone: 'Treino' },
  banho: { icon: 'shower-head', color: 'var(--color-dom-rest)', tone: 'Transição' },
  estudo: { icon: 'brain', color: 'var(--color-dom-study)', tone: 'Foco' },
  jantar: { icon: 'utensils', color: 'var(--color-dom-food)', tone: 'Refeição' },
  revisao: { icon: 'notebook-pen', color: 'var(--color-dom-study)', tone: 'Fechamento' },
  livre: { icon: 'gamepad-2', color: 'var(--color-ink-3)', tone: 'Livre' },
  dormir: { icon: 'moon', color: 'var(--color-dom-sleep)', tone: 'Recuperação' },
}
