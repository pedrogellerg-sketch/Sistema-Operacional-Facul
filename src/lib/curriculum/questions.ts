import type { Question } from '@/types/curriculum'

/**
 * Banco de questões reais do ENEM (2019–2023), baixado da API pública
 * enem.dev por `scripts/fetch-questions.mjs` e empacotado como asset.
 *
 * Duas decisões importantes:
 *
 * 1. As questões **não** entram no localStorage. São dados de leitura, não do
 *    usuário — só as respostas dele são persistidas. Isso evita inflar em
 *    centenas de KB o blob que é reescrito a cada toque.
 * 2. O carregamento é sob demanda, por disciplina. Ninguém baixa as 552
 *    questões para estudar logaritmo.
 */

/**
 * Import dinâmico: o Vite gera um chunk por disciplina.
 *
 * O tipo é `unknown` de propósito. O TypeScript infere a forma literal do JSON
 * (`phase: number`, mais largo que `ExamPhase`), e anotar como `Question[]`
 * aqui só produziria um erro que a conversão em `loadQuestions` já resolve.
 */
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  mat: () => import('@/data/questions/mat.json'),
  fis: () => import('@/data/questions/fis.json'),
  qui: () => import('@/data/questions/qui.json'),
  bio: () => import('@/data/questions/bio.json'),
  bio1: () => import('@/data/questions/bio.json'),
  bio2: () => import('@/data/questions/bio.json'),
  his: () => import('@/data/questions/his.json'),
  geo: () => import('@/data/questions/geo.json'),
  fil: () => import('@/data/questions/fil.json'),
  soc: () => import('@/data/questions/soc.json'),
  ing: () => import('@/data/questions/ing.json'),
  por: () => import('@/data/questions/por.json'),
  lit: () => import('@/data/questions/por.json'),
  efl: () => import('@/data/questions/por.json'),
  red: () => import('@/data/questions/por.json'),
}

const cache = new Map<string, Question[]>()

export async function loadQuestions(subjectId: string): Promise<Question[]> {
  const cached = cache.get(subjectId)
  if (cached) return cached

  const loader = LOADERS[subjectId]
  if (!loader) return []

  try {
    const mod = await loader()
    const list = (mod.default ?? []) as Question[]
    cache.set(subjectId, list)
    return list
  } catch {
    // Sem banco para a disciplina o app segue funcionando com o material do livro.
    return []
  }
}

/**
 * Pontua o quanto uma questão combina com o tópico, por vocabulário.
 * O ENEM não etiqueta questões por assunto, então o casamento é aproximado —
 * mas questão do assunto certo vale muito mais que questão aleatória.
 */
function relevance(q: Question, keywords: string[]): number {
  if (keywords.length === 0) return 0
  const hay = `${q.context ?? ''} ${q.statement}`.toLowerCase()
  return keywords.reduce((acc, kw) => acc + (hay.includes(kw) ? 1 : 0), 0)
}

/** Palavras significativas do título da aula, para casar com as questões. */
export function topicKeywords(title: string): string[] {
  const STOP = new Set([
    'revisão', 'aula', 'de', 'da', 'do', 'e', 'o', 'a', 'os', 'as', 'em', 'com',
    'para', 'introdução', 'conteúdo', 'parte', 'geral', 'frente', 'i', 'ii', 'iii',
  ])
  return title
    .toLowerCase()
    .replace(/[^a-zà-ú\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, 6)
}

export interface PickOptions {
  subjectId: string
  title: string
  count: number
  /** Questões já respondidas, para não repetir. */
  exclude?: Set<string>
}

/**
 * Prioridade entre provas, na ordem que o usuário declarou: Insper, FGV,
 * Fuvest e por último ENEM. Vale como desempate — uma questão do assunto certo
 * do ENEM continua valendo mais que uma da Fuvest fora do assunto.
 */
const PESO_PROVA: Record<string, number> = {
  INSPER: 4,
  FGV: 3,
  FUVEST: 2,
  ENEM: 1,
}

function pesoDaProva(q: Question): number {
  return PESO_PROVA[String(q.exam).toUpperCase()] ?? 0
}

/**
 * Escolhe questões para a sessão: primeiro as que casam com o tópico, depois
 * as demais da disciplina, para nunca devolver lista vazia quando há banco.
 *
 * Dentro de cada grupo, a prova-alvo desempata.
 */
export async function pickQuestions({
  subjectId,
  title,
  count,
  exclude,
}: PickOptions): Promise<{ onTopic: Question[]; filler: Question[] }> {
  const all = await loadQuestions(subjectId)
  const available = exclude ? all.filter((q) => !exclude.has(q.id)) : all
  const keywords = topicKeywords(title)

  const scored = available
    .map((q) => ({ q, score: relevance(q, keywords) }))
    .sort((a, b) => b.score - a.score || pesoDaProva(b.q) - pesoDaProva(a.q))

  const onTopic = scored.filter((s) => s.score > 0).slice(0, count).map((s) => s.q)
  const filler = scored
    .filter((s) => s.score === 0)
    .slice(0, Math.max(0, count - onTopic.length))
    .map((s) => s.q)

  return { onTopic, filler }
}

/** Quantas questões o banco tem por disciplina — mostrado no dashboard. */
export async function questionCount(subjectId: string): Promise<number> {
  return (await loadQuestions(subjectId)).length
}
