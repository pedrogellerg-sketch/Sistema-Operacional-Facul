import type { Clock, ISODate } from '@/types'
import type { SchoolCalendar } from '@/types/curriculum'

/**
 * Estrutura das avaliações bimestrais do Colégio Augusto Laranja, 3ª série.
 *
 * AV1 e AV2 não são "uma prova": são períodos de avaliação no formato de
 * vestibular, com o conteúdo do bimestre. Cada bimestre tem uma objetiva e uma
 * dissertativa, e **a ordem se inverte a cada bimestre** — no 3º a AV1 é a
 * objetiva; no 4º é a dissertativa.
 *
 * O modelo separa duas coisas que mudam em ritmos diferentes: o *formato*
 * (fixo, definido pela escola) e as *datas* (vêm do calendário). As partes são
 * distribuídas pelas datas disponíveis, então a mesma objetiva funciona tanto
 * aplicada num dia só quanto dividida em dois.
 */

export type ExamFormat = 'objetiva' | 'dissertativa'

/** Uma matéria dentro de uma parte da prova. */
export interface ExamSubject {
  /** Disciplinas do app que essa matéria cobre — Biologia cobre as duas trilhas. */
  subjectIds: string[]
  label: string
  /** Quantidade de questões. `null` na Redação, que não é contada assim. */
  questions: number | null
}

/** Um turno de prova. Duas por dia: manhã e o bloco longo até as 13h35. */
export interface ExamPart {
  label: string
  start: Clock
  end: Clock
  subjects: ExamSubject[]
}

const S = (subjectIds: string[], label: string, questions: number | null): ExamSubject => ({
  subjectIds,
  label,
  questions,
})

const MANHA = { label: '1ª parte', start: '07:15' as Clock, end: '09:45' as Clock }
const TARDE = { label: '2ª parte', start: '10:15' as Clock, end: '13:35' as Clock }

/**
 * Objetiva — 90 questões, 45 por parte.
 *
 * Aplicada num dia quando o calendário reserva um; em dois, uma parte por dia.
 */
export const OBJETIVA: ExamPart[] = [
  {
    ...MANHA,
    subjects: [
      S(['fil'], 'Filosofia', 5),
      S(['ing'], 'Inglês', 5),
      S(['his'], 'História', 10),
      S(['bio1', 'bio2'], 'Biologia', 10),
      S(['qui'], 'Química', 10),
      S(['soc'], 'Sociologia', 5),
    ],
  },
  {
    ...TARDE,
    subjects: [
      S(['geo'], 'Geografia', 10),
      S(['fis'], 'Física', 10),
      S(['efl'], 'FL', 6),
      S(['lit'], 'Literatura', 6),
      S(['mat'], 'Matemática', 13),
    ],
  },
]

/** Dissertativa — três dias, duas partes por dia. */
export const DISSERTATIVA: ExamPart[] = [
  {
    ...MANHA,
    subjects: [S(['red'], 'Redação', null), S(['fil'], 'Filosofia', 2), S(['soc'], 'Sociologia', 2)],
  },
  { ...TARDE, subjects: [S(['geo'], 'Geografia', 5), S(['fis'], 'Física', 5)] },
  { ...MANHA, subjects: [S(['efl'], 'FL', 4), S(['lit'], 'Literatura', 4)] },
  { ...TARDE, subjects: [S(['bio1', 'bio2'], 'Biologia', 5), S(['qui'], 'Química', 5)] },
  { ...MANHA, subjects: [S(['mat'], 'Matemática', 8)] },
  { ...TARDE, subjects: [S(['his'], 'História', 5), S(['ing'], 'Inglês', 3)] },
]

/**
 * Qual AV é objetiva em cada bimestre. A ordem alterna, então decorar "AV1 é a
 * objetiva" leva ao erro — no 4º bimestre é o contrário.
 */
const FORMATO_POR_BIMESTRE: Record<number, { AV1: ExamFormat; AV2: ExamFormat }> = {
  1: { AV1: 'objetiva', AV2: 'dissertativa' },
  2: { AV1: 'dissertativa', AV2: 'objetiva' },
  3: { AV1: 'objetiva', AV2: 'dissertativa' },
  4: { AV1: 'dissertativa', AV2: 'objetiva' },
}

export function formatoDa(av: 'AV1' | 'AV2', bimestre: number): ExamFormat | null {
  return FORMATO_POR_BIMESTRE[bimestre]?.[av] ?? null
}

/** Um dia concreto de prova, já com data e as partes que caem nele. */
export interface ExamDay {
  date: ISODate
  parts: ExamPart[]
}

/** Um período de avaliação inteiro, pronto para exibir. */
export interface AssessmentPeriod {
  id: string
  name: string
  bimester: number
  format: ExamFormat
  days: ExamDay[]
  /** Primeira e última data — o intervalo que aparece no calendário. */
  from: ISODate
  to: ISODate
  totalQuestions: number
}

/** Distribui as partes do formato pelas datas reservadas no calendário. */
function distribuir(parts: ExamPart[], dates: ISODate[]): ExamDay[] {
  if (dates.length === 0) return []
  const porDia = Math.ceil(parts.length / dates.length)
  return dates.map((date, i) => ({
    date,
    parts: parts.slice(i * porDia, (i + 1) * porDia),
  }))
}

/**
 * Lê o calendário e devolve as AVs como períodos.
 *
 * O calendário guarda um evento por dia de prova, todos com o mesmo rótulo
 * ("AV1", "AV1"). Agrupamos por rótulo em datas próximas — mais de uma semana
 * de intervalo já é outra avaliação, não a mesma.
 */
export function buildAssessmentPeriods(
  calendar: SchoolCalendar,
  bimestreDe: (date: ISODate) => number,
): AssessmentPeriod[] {
  const avaliacoes = calendar.events
    .filter((e) => e.kind === 'avaliacao')
    .sort((a, b) => a.date.localeCompare(b.date))

  const grupos: Array<{ label: string; dates: ISODate[] }> = []
  for (const e of avaliacoes) {
    const base = e.label.replace(/\s*\(.*\)\s*/, '').trim()
    const ultimo = grupos[grupos.length - 1]
    const distante =
      !ultimo ||
      ultimo.label !== base ||
      diasEntre(ultimo.dates[ultimo.dates.length - 1], e.date) > 7
    if (distante) grupos.push({ label: base, dates: [e.date] })
    else ultimo.dates.push(e.date)
  }

  return grupos.flatMap((g) => {
    if (g.label !== 'AV1' && g.label !== 'AV2') return []
    const bimestre = bimestreDe(g.dates[0])
    const format = formatoDa(g.label, bimestre)
    if (!format) return []

    const days = distribuir(format === 'objetiva' ? OBJETIVA : DISSERTATIVA, g.dates)
    const totalQuestions = days
      .flatMap((d) => d.parts)
      .flatMap((p) => p.subjects)
      .reduce((acc, s) => acc + (s.questions ?? 0), 0)

    return [
      {
        id: `${g.label}-${bimestre}`,
        name: g.label,
        bimester: bimestre,
        format,
        days,
        from: g.dates[0],
        to: g.dates[g.dates.length - 1],
        totalQuestions,
      },
    ]
  })
}

function diasEntre(a: ISODate, b: ISODate): number {
  return Math.round(
    (new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86_400_000,
  )
}

/**
 * Bimestre de uma data no 2º semestre: o 3º vai até o fim de setembro, o 4º
 * daí em diante. As AVs do 3º caem em agosto e setembro; as do 4º, em outubro.
 */
export function bimestreDaData(date: ISODate): number {
  return date <= '2026-09-30' ? 3 : 4
}
