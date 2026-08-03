import type { GridSlot, SchoolCalendar, SchoolEvent } from '@/types/curriculum'
import type { Clock, Weekday } from '@/types'

/**
 * Grade e calendário do Colégio Augusto Laranja — 3ª série, turma 3A, 2026.
 * Transcritos do quadro de horários e do calendário do 2º semestre.
 *
 * São dados-semente editáveis: o usuário pode ajustar em Ajustes sem tocar em
 * código, e o cronograma inteiro se recalcula.
 */

/** Horários das 7 aulas diárias, na ordem do quadro. */
export const PERIODS: Array<{ period: number; start: Clock; end: Clock }> = [
  { period: 1, start: '07:15', end: '08:05' },
  { period: 2, start: '08:05', end: '08:55' },
  { period: 3, start: '08:55', end: '09:45' },
  { period: 4, start: '10:15', end: '11:05' },
  { period: 5, start: '11:05', end: '11:55' },
  { period: 6, start: '11:55', end: '12:45' },
  { period: 7, start: '12:45', end: '13:35' },
]

/**
 * Grade por dia, na ordem dos períodos acima.
 * `null` = horário vago.
 */
const WEEK_GRID: Record<Weekday, Array<[subjectId: string, teacher: string] | null>> = {
  0: [null, null, null, null, null, null, null],
  1: [
    ['his', 'Filipe'],
    ['geo', 'Stefanie'],
    ['soc', 'Mariana'],
    ['mat', 'Felipe'],
    ['his', 'Filipe'],
    ['mat', 'Felipe'],
    ['bio2', 'Carolina P'],
  ],
  2: [
    ['geo', 'Stefanie'],
    ['fis', 'Modesto'],
    ['fis', 'Modesto'],
    ['geo', 'Stefanie'],
    ['bio1', 'Marcelo'],
    ['fis', 'Modesto'],
    ['bio1', 'Marcelo'],
  ],
  3: [
    ['ing', 'Carolina'],
    ['red', 'Ana Paula'],
    ['red', 'Ana Paula'],
    ['efl', 'Rosane'],
    ['efl', 'Rosane'],
    ['ing', 'Carolina'],
    ['fil', 'Roberta'],
  ],
  4: [
    ['mat', 'Felipe'],
    ['geo', 'Stefanie'],
    ['mat', 'Felipe'],
    ['his', 'Filipe'],
    ['qui', 'Evaristo'],
    ['qui', 'Evaristo'],
    ['mat', 'Felipe'],
  ],
  5: [
    ['qui', 'Evaristo'],
    ['his', 'Filipe'],
    ['bio2', 'Carolina P'],
    ['qui', 'Evaristo'],
    ['fis', 'Modesto'],
    ['lit', 'Dylan'],
    ['lit', 'Dylan'],
  ],
  6: [null, null, null, null, null, null, null],
}

export function buildSeedGrid(): GridSlot[] {
  const slots: GridSlot[] = []
  for (const [wd, day] of Object.entries(WEEK_GRID)) {
    day.forEach((cell, i) => {
      if (!cell) return
      const p = PERIODS[i]
      slots.push({
        weekday: Number(wd) as Weekday,
        period: p.period,
        start: p.start,
        end: p.end,
        subjectId: cell[0],
        teacher: cell[1],
      })
    })
  }
  return slots
}

/**
 * Calendário do 2º semestre de 2026.
 *
 * As datas de simulado e avaliação vieram do calendário oficial; as de
 * vestibular também. `suspendsClasses` marca o que tira aula do cronograma.
 */
const EVENTS: Array<[date: string, kind: SchoolEvent['kind'], label: string, opts?: Partial<SchoolEvent>]> = [
  ['2026-07-29', 'inicio', 'Retorno das aulas'],
  ['2026-08-01', 'simulado', 'Simulado Fuvest', { exam: 'fuvest' }],
  ['2026-08-15', 'simulado', 'Simulado Unicamp', { exam: 'unicamp' }],
  ['2026-08-25', 'avaliacao', 'AV1'],
  ['2026-08-26', 'avaliacao', 'AV1'],
  ['2026-08-29', 'simulado', 'Simulado Unesp', { exam: 'unesp' }],
  ['2026-09-07', 'feriado', 'Independência do Brasil', { suspendsClasses: true }],
  ['2026-09-12', 'simulado', 'Simulado ENEM', { exam: 'enem' }],
  ['2026-09-15', 'avaliacao', 'AV2'],
  ['2026-09-16', 'avaliacao', 'AV2'],
  ['2026-09-17', 'avaliacao', 'AV2'],
  ['2026-09-19', 'simulado', 'Simulado ENEM', { exam: 'enem' }],
  ['2026-09-24', 'avaliacao', 'AV3'],
  ['2026-10-03', 'simulado', 'Simulado Fuvest', { exam: 'fuvest' }],
  ['2026-10-12', 'feriado', 'Padroeira do Brasil', { suspendsClasses: true }],
  ['2026-10-17', 'vestibular', 'Unicamp — 1ª fase', { exam: 'unicamp' }],
  ['2026-10-20', 'avaliacao', 'AV1 (4º bim)'],
  ['2026-10-21', 'avaliacao', 'AV1 (4º bim)'],
  ['2026-10-22', 'avaliacao', 'AV1 (4º bim)'],
  ['2026-10-31', 'vestibular', 'Fuvest — 1ª fase', { exam: 'fuvest' }],
  ['2026-11-02', 'feriado', 'Finados', { suspendsClasses: true }],
  ['2026-11-08', 'vestibular', 'ENEM — 1º dia', { exam: 'enem' }],
  ['2026-11-15', 'vestibular', 'ENEM — 2º dia', { exam: 'enem' }],
  ['2026-11-20', 'feriado', 'Consciência Negra', { suspendsClasses: true }],
  ['2026-11-21', 'vestibular', 'Unesp', { exam: 'unesp' }],
  ['2026-11-29', 'vestibular', 'Unicamp — 2ª fase', { exam: 'unicamp' }],
  ['2026-12-06', 'vestibular', 'Fuvest — 2ª fase', { exam: 'fuvest' }],
  ['2026-12-13', 'vestibular', 'Unesp — 2ª fase', { exam: 'unesp' }],
]

export function buildSeedCalendar(): SchoolCalendar {
  return {
    startDate: '2026-07-29',
    endDate: '2026-12-16',
    events: EVENTS.map(([date, kind, label, opts], i) => ({
      id: `ev-${i}`,
      date,
      kind,
      label,
      subjectId: null,
      exam: null,
      suspendsClasses: kind === 'feriado' || kind === 'sem_aula',
      ...opts,
    })),
  }
}

/** Disciplinas novas trazidas pela grade que a Sprint 1 não tinha. */
export const SPRINT2_SUBJECTS = [
  { id: 'bio1', name: 'Biologia I', shortName: 'Bio I', color: '#4ade80' },
  { id: 'bio2', name: 'Biologia II', shortName: 'Bio II', color: '#34d399' },
  { id: 'lit', name: 'Literatura', shortName: 'Lit', color: '#c084fc' },
  { id: 'efl', name: 'Estrutura e Func. da Língua', shortName: 'EFL', color: '#a78bfa' },
] as const
