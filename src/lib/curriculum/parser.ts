import type { CurriculumLesson, LessonKind, MaterialRef } from '@/types/curriculum'
import { uid } from '@/lib/utils'

/**
 * Interpretação dos planos de aula em PDF.
 *
 * Não existe parser único: os nove documentos da escola usam quatro layouts
 * diferentes. A estratégia é detectar o perfil pelo cabeçalho e aplicar a
 * extração correspondente — e sempre devolver o resultado para conferência,
 * porque os originais têm defeitos reais (Biologia vem em ordem decrescente,
 * Matemática declara o bimestre errado, Geografia repete um número).
 */

export type ProfileId = 'numerada' | 'semana_aula' | 'intervalo' | 'numerada_data' | 'pares'

export interface ParsedDoc {
  subjectGuess: string | null
  subjectName: string | null
  year: number | null
  bimester: number | null
  profile: ProfileId
  lessons: CurriculumLesson[]
  /** Problemas detectados que o usuário precisa revisar antes de salvar. */
  warnings: string[]
}

// ── Normalização ─────────────────────────────────────────────

/**
 * Conserta o texto vindo do PDF.
 *
 * O extrator quebra as ligaturas tipográficas fi/fl, produzindo "de fi nição"
 * e "con fl itos". Sem isso, o conteúdo entra no banco com palavras partidas.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/([a-zà-ú])\s+(fi|fl)\s+([a-zà-ú])/gi, '$1$2$3')
    .replace(/­/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

const SUBJECT_BY_NAME: Array<[RegExp, string]> = [
  [/matem[áa]tica/i, 'mat'],
  [/f[íi]sica/i, 'fis'],
  [/qu[íi]mica/i, 'qui'],
  [/biologia/i, 'bio1'],
  [/hist[óo]ria/i, 'his'],
  [/geografia/i, 'geo'],
  [/reda[çc][ãa]o/i, 'red'],
  [/literatura/i, 'lit'],
  [/estrutura e funcionamento/i, 'efl'],
  [/filosofia/i, 'fil'],
  [/sociologia/i, 'soc'],
  [/ingl[êe]s/i, 'ing'],
]

const BIMESTER_WORDS: Array<[RegExp, number]> = [
  [/primeiro bimestre|1[ºo°]?\s*bim/i, 1],
  [/segundo bimestre|2[ºo°]?\s*bim/i, 2],
  [/terceiro bimestre|3[ºo°]?\s*bim/i, 3],
  [/quarto bimestre|4[ºo°]?\s*bim/i, 4],
]

function detectHeader(text: string) {
  const head = text.slice(0, 600)
  const subject = SUBJECT_BY_NAME.find(([re]) => re.test(head))
  const year = head.match(/\b(20\d{2})\b/)
  const bim = BIMESTER_WORDS.find(([re]) => re.test(head))
  const name = head.match(/PLANO DE AULAS?\s+DE\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+?)(?:\s*[–-]|\s*\d{4}|\n)/i)

  return {
    subjectGuess: subject?.[1] ?? null,
    subjectName: name?.[1]?.trim() ?? null,
    year: year ? Number(year[1]) : null,
    bimester: bim?.[1] ?? null,
  }
}

// ── Detecção de perfil ───────────────────────────────────────

export function detectProfile(text: string): ProfileId {
  // Pares ("1 e 2") precisam ser testados antes: a linha solta com o segundo
  // número faria o perfil genérico enxergar aulas que não existem.
  if ((text.match(/^\d{1,2}\s+e\s*\d{0,2}$/gm) ?? []).length >= 4) return 'pares'
  if (/^\d{2}\s+\d{2}\s+/m.test(text)) return 'semana_aula' // História: SEM + AULA
  if (/Aulas?\s+\d+(,\s*\d+)*\s*(e\s*\d+)?\s+Conte[úu]do/i.test(text)) return 'intervalo' // Física
  if (/^\(\d{1,2}\/\d{1,2}\)$/m.test(text)) return 'numerada_data' // Química
  if (/^\d{1,3}\s*$/m.test(text) || /^\d{2,3}\s+\S/m.test(text)) return 'numerada'
  return 'numerada'
}

// ── Campos ───────────────────────────────────────────────────

const FIELD_RE = /(OBJETIVOS?|ESTRAT[ÉE]GIAS?|TAREFA(?:\s+DE\s+CASA)?|RESPOSTAS?|CONTE[ÚU]DO)\s*:/gi

function splitFields(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  const parts = [...block.matchAll(FIELD_RE)]

  parts.forEach((m, i) => {
    const key = m[1]
      .toUpperCase()
      .replace(/[ÉE]/, 'E')
      .replace(/[ÚU]/, 'U')
      .split(/\s+/)[0]
    const start = m.index! + m[0].length
    const end = i + 1 < parts.length ? parts[i + 1].index! : block.length
    out[key] = block.slice(start, end).trim()
  })

  return out
}

function toList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/\n|●|•|·|●/)
    .map((s) => normalizeText(s.replace(/^[-–\s.]+/, '')))
    .filter((s) => s.length > 2)
}

/** Extrai livro, capítulo, páginas e exercícios do texto da tarefa. */
export function parseMaterial(text: string): MaterialRef {
  if (!text) return { book: null, chapter: null, pages: null, exercises: null }
  const t = normalizeText(text)

  const book =
    t.match(/Livro\s+(?:anglo\s+)?([A-Za-zÁ-ú]+\s*\d*)/i)?.[0] ??
    t.match(/Caderno de Estudos\s*\d*/i)?.[0] ??
    t.match(/Moderna Plus[^,.\n]*/i)?.[0] ??
    null

  const chapter = t.match(/Cap[íi]tulo\s*\d+/i)?.[0] ?? null
  const pages =
    t.match(/P[áa]g(?:ina)?s?\.?\s*[-\s]*\d+\s*(?:[/aeà-]\s*\d+)?/i)?.[0]?.replace(/\s+/g, ' ') ??
    null
  const exercises =
    t.match(/quest(?:ões|ao|ões)\s*\d+\s*a\s*\d+/i)?.[0] ??
    t.match(/Exerc[íi]cios?:?\s*(?:Todos|\d+\s*(?:e|a)\s*\d+)/i)?.[0] ??
    null

  return { book, chapter, pages, exercises }
}

/** Classifica a linha: nem toda entrada do plano é aula. */
function detectKind(title: string): LessonKind {
  const t = title.toUpperCase()
  if (/F[ÉE]RIAS|FERIADO|SEM AULA/.test(t)) return 'feriado'
  if (/APLICA[ÇC][ÃA]O DA AV|^AV\d|AVALIA[ÇC][ÃA]O|SIMULADO|APRESENTA[ÇC][ÕO]ES DA AV/.test(t))
    return 'avaliacao'
  if (/CORRE[ÇC][ÃA]O|DEVOLUTIVA/.test(t)) return 'correcao'

  // O 2º semestre inteiro é revisão: "REVISÃO: LOGARITMOS" é uma aula com
  // conteúdo, não um bloco genérico de revisão. Só classifica como `revisao`
  // quando não sobra assunto depois da palavra.
  if (/REVIS[ÃA]O|RETOMADA/.test(t)) {
    const rest = t.replace(/REVIS[ÃA]O|RETOMADA|GERAL|[-:–]/g, '').trim()
    return rest.length > 3 ? 'aula' : 'revisao'
  }
  return 'aula'
}

function makeLesson(
  subjectId: string,
  number: number,
  title: string,
  block: string,
  extra: Partial<CurriculumLesson> = {},
): CurriculumLesson {
  const fields = splitFields(block)
  const homework = fields.TAREFA ? normalizeText(fields.TAREFA) : null

  return {
    id: uid('cl-'),
    subjectId,
    number,
    span: 1,
    week: null,
    track: null,
    kind: detectKind(title),
    title: normalizeText(title),
    objectives: toList(fields.OBJETIVOS),
    strategies: toList(fields.ESTRATEGIAS),
    homework,
    material: parseMaterial(homework ?? ''),
    declaredDate: null,
    topicId: null,
    order: number,
    ...extra,
  }
}

// ── Perfis ───────────────────────────────────────────────────

function isoFromBR(day: string, month: string, year: number): string {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/** Matemática, Geografia, Biologia, Literatura: número + título + campos. */
function parseNumerada(text: string, subjectId: string): CurriculumLesson[] {
  const re = /^(\d{1,3})[ \t]+([^\n]{4,160})$/gm
  const marks = [...text.matchAll(re)]
  const out: CurriculumLesson[] = []

  marks.forEach((m, i) => {
    const start = m.index! + m[0].length
    const end = i + 1 < marks.length ? marks[i + 1].index! : text.length
    out.push(makeLesson(subjectId, Number(m[1]), m[2], text.slice(start, end)))
  })

  // Também aceita o número sozinho numa linha (layout de Geografia).
  if (out.length < 3) {
    const alt = [...text.matchAll(/^(\d{2,3})\s*\n([^\n]{4,160})$/gm)]
    alt.forEach((m, i) => {
      const start = m.index! + m[0].length
      const end = i + 1 < alt.length ? alt[i + 1].index! : text.length
      out.push(makeLesson(subjectId, Number(m[1]), m[2], text.slice(start, end)))
    })
  }

  // Literatura inverte: o título vem primeiro e o número na linha seguinte.
  if (out.filter((l) => l.objectives.length > 0).length === 0) {
    const inverted = [...text.matchAll(/^([^\n]{6,160})\n(\d{2})\n(OBJETIVOS?:)/gm)]
    if (inverted.length >= 3) {
      out.length = 0
      inverted.forEach((m, i) => {
        const start = m.index! + m[1].length + m[2].length + 2
        const end = i + 1 < inverted.length ? inverted[i + 1].index! : text.length
        out.push(makeLesson(subjectId, Number(m[2]), m[1], text.slice(start, end)))
      })
    }
  }

  return out
}

/** História: SEM + AULA + intervalo de datas + FRENTE. */
function parseSemanaAula(text: string, subjectId: string): CurriculumLesson[] {
  const re = /^(\d{2,3})[ \t]+(\d{2,3})[ \t]+([^\n]{3,160})$/gm
  const marks = [...text.matchAll(re)]

  return marks.map((m, i) => {
    const start = m.index! + m[0].length
    const end = i + 1 < marks.length ? marks[i + 1].index! : text.length
    const block = text.slice(start, end)
    const title = m[3]

    const track = title.match(/FRENTE\s*(\d+)/i)?.[1] ?? null

    // O bloco traz "De 27/07 a 31/07" — é o intervalo da SEMANA, não a data da
    // aula. Gravar o início como `declaredDate` fazia as 40 aulas de História
    // se amontoarem nas segundas e a quinta ficar sem conteúdo. A semana basta:
    // o cronograma distribui pela grade.
    return makeLesson(subjectId, Number(m[2]), title, block, {
      week: Number(m[1]),
      track: track ? `Frente ${track}` : null,
      order: Number(m[2]),
    })
  })
}

/** Física: "Aulas 82, 83 e 84" — uma linha vale várias aulas. */
function parseIntervalo(text: string, subjectId: string): CurriculumLesson[] {
  const re = /^Aulas?\s+([\d,\s e]+?)\s*Conte[úu]do:\s*([^\n]+)$/gim
  const marks = [...text.matchAll(re)]

  return marks.map((m, i) => {
    const start = m.index! + m[0].length
    const end = i + 1 < marks.length ? marks[i + 1].index! : text.length
    const nums = (m[1].match(/\d+/g) ?? []).map(Number)

    return makeLesson(subjectId, nums[0] ?? i + 1, m[2], text.slice(start, end), {
      span: Math.max(nums.length, 1),
      order: nums[0] ?? i + 1,
    })
  })
}

/** Química, EFL: número seguido de data entre parênteses. */
function parseNumeradaData(text: string, subjectId: string, year: number): CurriculumLesson[] {
  const re = /^(\d{1,3})\s*\n([^\n]{3,160})\n\((\d{1,2})\/(\d{1,2})\)/gm
  const marks = [...text.matchAll(re)]
  const out: CurriculumLesson[] = []

  marks.forEach((m, i) => {
    const start = m.index! + m[0].length
    const end = i + 1 < marks.length ? marks[i + 1].index! : text.length
    out.push(
      makeLesson(subjectId, Number(m[1]), m[2], text.slice(start, end), {
        declaredDate: isoFromBR(m[3], m[4], year),
        order: Number(m[1]),
      }),
    )
  })

  /**
   * O plano de Química mistura quatro arranjos no mesmo documento, porque a
   * tabela de duas colunas quebra em pontos diferentes a cada página. Além do
   * formato principal acima, aparecem:
   *
   *   (25/08) / AV1 / 17          · invertido, nas viradas de página
   *   29 / (18/09)                · sem título entre número e data
   *   24 Resolução de exercícios. · número e título na mesma linha
   *
   * Cada variante é tentada em ordem, sempre pulando números já capturados.
   */
  const seen = new Set(out.map((l) => l.number))

  const addVariant = (
    matches: RegExpMatchArray[],
    pick: (m: RegExpMatchArray) => {
      number: number
      title: string
      date: [string, string] | null
    } | null,
  ) => {
    matches.forEach((m, i) => {
      const parsed = pick(m)
      if (!parsed || seen.has(parsed.number)) return
      seen.add(parsed.number)
      const start = m.index! + m[0].length
      const end = i + 1 < matches.length ? matches[i + 1].index! : text.length
      out.push(
        makeLesson(subjectId, parsed.number, parsed.title, text.slice(start, end), {
          declaredDate: parsed.date ? isoFromBR(parsed.date[0], parsed.date[1], year) : null,
          order: parsed.number,
        }),
      )
    })
  }

  addVariant([...text.matchAll(/^\((\d{1,2})\/(\d{1,2})\)\n([^\n]{2,160})\n(\d{1,3})\s*$/gm)], (m) => ({
    number: Number(m[4]),
    title: m[3],
    date: [m[1], m[2]],
  }))

  // Número seguido direto da data: o título ficou na linha acima.
  const lines = text.split('\n')
  addVariant([...text.matchAll(/^(\d{1,3})\n\((\d{1,2})\/(\d{1,2})\)/gm)], (m) => {
    const lineIdx = text.slice(0, m.index!).split('\n').length - 1
    const above = lines[lineIdx - 1]?.trim() ?? ''
    const title = above && !/^\(|^\d|^(OBJETIVOS|ESTRAT|TAREFA)/i.test(above) ? above : 'Aula'
    return { number: Number(m[1]), title, date: [m[2], m[3]] }
  })

  addVariant([...text.matchAll(/^(\d{1,3})[ \t]+([^\n]{4,160})$/gm)], (m) => ({
    number: Number(m[1]),
    title: m[2],
    date: null,
  }))

  out.sort((a, b) => a.number - b.number)

  // Layout do EFL: número e data em linhas seguidas, título entre elas.
  if (out.length < 3) {
    const alt = [...text.matchAll(/^(\d{2})\s+([^\n]{3,160})\n(\d{1,2})\/(\d{1,2})/gm)]
    alt.forEach((m, i) => {
      const start = m.index! + m[0].length
      const end = i + 1 < alt.length ? alt[i + 1].index! : text.length
      out.push(
        makeLesson(subjectId, Number(m[1]), m[2], text.slice(start, end), {
          declaredDate: isoFromBR(m[3], m[4], year),
          order: Number(m[1]),
        }),
      )
    })
  }

  return out
}

/**
 * Redação: aulas em pares, com o título ANTES do número.
 *
 *     DEVOLUTIVA DA AV2 …        ← título
 *     1 e 2                      ← par de aulas
 *     15/4 OBJETIVOS:            ← data (às vezes colada no campo seguinte)
 *
 * O par também quebra em duas linhas ("11 e" / "12") quando a tabela vira de
 * coluna, então a captura aceita as duas formas.
 */
function parsePares(text: string, subjectId: string, year: number): CurriculumLesson[] {
  const lines = text.split('\n')
  const out: CurriculumLesson[] = []

  /**
   * O par aparece em três formas, dependendo de onde a tabela quebrou:
   *   "1 e 2"                     · par sozinho, título na linha acima
   *   "11 e"  + "12"              · segundo número na linha seguinte
   *   "9 e 10 APLICAÇÃO DA AV1"   · título colado na mesma linha
   */
  const PAIR_RE = /^(\d{1,2})\s+e\s*(\d{1,2})?\s*(.*)$/
  const isPair = (line: string) => PAIR_RE.exec(line.trim())

  for (let i = 0; i < lines.length; i++) {
    const pair = isPair(lines[i])
    if (!pair) continue

    const first = Number(pair[1])
    const inlineTitle = pair[3]?.trim() ?? ''
    // Segundo número pode estar na mesma linha ou na seguinte.
    const second = pair[2] ? Number(pair[2]) : Number(lines[i + 1]?.trim())
    const span = Number.isFinite(second) && second > first ? second - first + 1 : 1
    const afterNumber = pair[2] || inlineTitle ? i : i + 1

    // Título colado na linha do par vence; senão procura acima.
    let title = inlineTitle
    if (!title) {
      for (let j = i - 1; j >= 0 && j > i - 5; j--) {
        const cand = lines[j].trim()
        if (!cand || /^\d/.test(cand) || /^(OBJETIVOS|ESTRAT|TAREFA)/i.test(cand)) continue
        title = cand
        break
      }
    }
    if (!title || title.length < 4) continue

    // Data nas linhas seguintes ao número — pode vir colada em "15/4 OBJETIVOS:".
    let declaredDate: string | null = null
    for (let j = afterNumber; j < Math.min(afterNumber + 3, lines.length); j++) {
      const dm = lines[j].match(/^\s*(\d{1,2})\/(\d{1,2})\b/)
      if (dm) {
        declaredDate = isoFromBR(dm[1], dm[2], year)
        break
      }
    }

    const nextPair = lines.findIndex((l, k) => k > afterNumber && isPair(l))
    const block = lines.slice(afterNumber, nextPair > 0 ? nextPair : lines.length).join('\n')

    out.push(
      makeLesson(subjectId, first, title, block, {
        span,
        declaredDate,
        order: first,
      }),
    )
  }

  return out
}

// ── Entrada pública ──────────────────────────────────────────

export function parsePlan(rawText: string, override?: { subjectId?: string }): ParsedDoc {
  const text = rawText.replace(/\r/g, '')
  const header = detectHeader(text)
  const subjectId = override?.subjectId ?? header.subjectGuess ?? 'mat'
  const year = header.year ?? new Date().getFullYear()
  const profile = detectProfile(text)

  let lessons: CurriculumLesson[] =
    profile === 'semana_aula'
      ? parseSemanaAula(text, subjectId)
      : profile === 'intervalo'
        ? parseIntervalo(text, subjectId)
        : profile === 'numerada_data'
          ? parseNumeradaData(text, subjectId, year)
          : profile === 'pares'
            ? parsePares(text, subjectId, year)
            : parseNumerada(text, subjectId)

  // Último recurso: se o perfil detectado não achou nada, tenta o genérico.
  if (lessons.length === 0 && profile !== 'numerada') {
    lessons = parseNumerada(text, subjectId)
  }

  const warnings = auditLessons(lessons, header)

  // Ordem decrescente (Biologia) é corrigida aqui — mas o aviso permanece,
  // para o usuário confirmar em vez de descobrir depois estudando ao contrário.
  const descending =
    lessons.length > 2 && lessons[0].number > lessons[lessons.length - 1].number
  if (descending) {
    lessons = [...lessons].reverse().map((l, i) => ({ ...l, order: i + 1 }))
  }

  return { ...header, profile, lessons, warnings }
}

/** Detecta os defeitos reais dos documentos antes de salvar. */
function auditLessons(
  lessons: CurriculumLesson[],
  header: ReturnType<typeof detectHeader>,
): string[] {
  const w: string[] = []
  if (lessons.length === 0) {
    w.push('Nenhuma aula reconhecida. Confira o arquivo ou lance manualmente.')
    return w
  }

  const numbers = lessons.map((l) => l.number)
  const dupes = numbers.filter((n, i) => numbers.indexOf(n) !== i)
  if (dupes.length) {
    w.push(`Número de aula repetido: ${[...new Set(dupes)].join(', ')}. Confira a numeração.`)
  }

  if (lessons.length > 2 && numbers[0] > numbers[numbers.length - 1]) {
    w.push('As aulas parecem estar em ordem decrescente. Foram reordenadas — confirme.')
  }

  // Buracos só contam descontando o `span`: em Física, "Aulas 82, 83 e 84"
  // é um registro só que legitimamente pula dois números.
  const spanByNumber = new Map(lessons.map((l) => [l.number, l.span]))
  const gaps: number[] = []
  const sorted = [...new Set(numbers)].sort((a, b) => a - b)
  for (let i = 1; i < sorted.length; i++) {
    const coberto = sorted[i - 1] + (spanByNumber.get(sorted[i - 1]) ?? 1)
    if (sorted[i] > coberto) gaps.push(coberto)
  }
  if (gaps.length) w.push(`Aulas faltando na sequência: ${gaps.slice(0, 6).join(', ')}.`)

  if (!header.bimester) w.push('Bimestre não identificado no cabeçalho. Selecione manualmente.')
  if (!header.subjectGuess) w.push('Disciplina não identificada. Selecione manualmente.')

  const semObjetivo = lessons.filter((l) => l.objectives.length === 0 && l.kind === 'aula').length
  if (semObjetivo > lessons.length / 2) {
    w.push(`${semObjetivo} aulas sem objetivos reconhecidos. O layout pode não ter sido lido.`)
  }

  return w
}
