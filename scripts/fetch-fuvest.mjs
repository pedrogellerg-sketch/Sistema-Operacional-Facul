/**
 * Soma questões da Fuvest ao banco de exercícios, a partir do BLUEX.
 *
 *   node scripts/fetch-fuvest.mjs
 *
 * Por que não ler os PDFs da Fuvest: o BLUEX é um conjunto de dados acadêmico
 * aberto (portuguese-benchmark-datasets/BLUEX, HuggingFace) montado por
 * pesquisadores brasileiros com as provas da USP e da Unicamp de 2018 a 2025 —
 * já estruturado, já com gabarito e **já etiquetado por matéria**. Escrever um
 * leitor de PDF de duas colunas para chegar no mesmo lugar seria dias de
 * trabalho por um resultado pior: o ENEM não traz etiqueta de matéria e por isso
 * lá o casamento é por vocabulário, aproximado.
 *
 * Mesma política do ENEM: roda só quando queremos atualizar o banco, a saída é
 * empacotada como asset e nada é chamado em tempo de execução.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src', 'data', 'questions')
const CACHE = resolve(ROOT, '.cache-bluex')
const PARQUET = resolve(CACHE, 'bluex.parquet')
const URL_PARQUET =
  'https://huggingface.co/datasets/portuguese-benchmark-datasets/BLUEX/resolve/main/data/questions-00000-of-00001.parquet'

/** Etiquetas do BLUEX → disciplinas do app. */
const MATERIA = {
  mathematics: 'mat',
  physics: 'fis',
  chemistry: 'qui',
  biology: 'bio',
  history: 'his',
  geography: 'geo',
  philosophy: 'fil',
  sociology: 'soc',
  portuguese: 'por',
  english: 'ing',
}

/**
 * Uma questão pode vir com mais de uma etiqueta ("history/geography"). Fica na
 * primeira reconhecida: é a área dominante, e duplicar a questão em duas
 * matérias faria o mesmo enunciado reaparecer como se fosse novo.
 */
function disciplinaDe(subject) {
  const tags = Array.isArray(subject) ? subject : [subject]
  for (const t of tags) {
    const id = MATERIA[String(t).toLowerCase().trim()]
    if (id) return id
  }
  return null
}

/** Descarta o que não dá para responder só com texto. */
function aproveitavel(q) {
  if (q.has_associated_images) return false
  if (!q.answer || !String(q.answer).trim()) return false
  if (!q.question || String(q.question).trim().length < 40) return false
  if (!Array.isArray(q.alternatives) || q.alternatives.length < 4) return false
  // O BLUEX marca onde havia figura; sem ela o enunciado fica sem sentido.
  if (/\[IMAGE \d+\]/.test(q.question)) return false
  return true
}

/** "a) texto" → { letter: 'A', text: 'texto' } */
function alternativa(raw, i) {
  const s = String(raw).trim()
  const m = s.match(/^\(?([a-eA-E])\)?[).\-–]\s*([\s\S]+)$/)
  return m
    ? { letter: m[1].toUpperCase(), text: m[2].replace(/\s+/g, ' ').trim() }
    : { letter: 'ABCDE'[i], text: s.replace(/\s+/g, ' ').trim() }
}

async function baixarParquet() {
  if (!existsSync(CACHE)) mkdirSync(CACHE, { recursive: true })
  if (existsSync(PARQUET)) {
    console.log('  usando o parquet em cache')
    return
  }
  console.log('  baixando o BLUEX (~88 MB)…')
  const res = await fetch(URL_PARQUET)
  if (!res.ok) throw new Error(`falha ao baixar: HTTP ${res.status}`)
  writeFileSync(PARQUET, Buffer.from(await res.arrayBuffer()))
}

console.log('Fuvest — via BLUEX')
await baixarParquet()

const rows = await parquetReadObjects({ file: await asyncBufferFromFile(PARQUET) })
const usp = rows.filter((r) => String(r.id).toUpperCase().startsWith('USP'))
console.log(`  ${rows.length} questões no conjunto · ${usp.length} da Fuvest`)

const porMateria = {}
let descartadas = 0

for (const q of usp) {
  if (!aproveitavel(q)) {
    descartadas += 1
    continue
  }
  const subjectId = disciplinaDe(q.subject)
  if (!subjectId) {
    descartadas += 1
    continue
  }

  const [, ano, numero] = String(q.id).split('_')
  ;(porMateria[subjectId] ??= []).push({
    id: `fuvest-${ano}-${numero}`,
    exam: 'FUVEST',
    year: Number(ano),
    number: Number(String(numero).replace(/\D/g, '')) || 0,
    subjectId,
    context: null,
    statement: String(q.question).replace(/\s+/g, ' ').trim(),
    alternatives: q.alternatives.map(alternativa),
    correct: String(q.answer).trim().toUpperCase(),
    // O acervo do BLUEX cobre a 1ª fase da Fuvest — 90 questões por ano.
    phase: 1,
  })
}

/** Junta com o que já existe, sem duplicar e sem perder o ENEM. */
const index = {}
for (const [subjectId, novas] of Object.entries(porMateria)) {
  const arquivo = resolve(OUT, `${subjectId}.json`)
  const atuais = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : []
  const vistos = new Set(atuais.map((q) => q.id))
  const juntas = [...atuais, ...novas.filter((q) => !vistos.has(q.id))]
  writeFileSync(arquivo, JSON.stringify(juntas))
  index[subjectId] = juntas.length
  const antes = atuais.length
  console.log(
    `  ${subjectId.padEnd(4)} ${String(juntas.length).padStart(4)} questões ` +
      `(${antes} ENEM + ${juntas.length - antes} Fuvest)`,
  )
}

// Disciplinas que já tinham arquivo e não receberam Fuvest continuam no índice.
for (const f of ['mat', 'fis', 'qui', 'bio', 'his', 'geo', 'fil', 'soc', 'por', 'ing']) {
  if (index[f] != null) continue
  const arquivo = resolve(OUT, `${f}.json`)
  if (existsSync(arquivo)) index[f] = JSON.parse(readFileSync(arquivo, 'utf8')).length
}

writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2))

const total = Object.values(index).reduce((a, b) => a + b, 0)
console.log(`\n  descartadas ${descartadas} (dependem de imagem, sem gabarito ou fora das matérias)`)
console.log(`  banco final: ${total} questões`)
