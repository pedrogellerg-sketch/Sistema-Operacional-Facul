/**
 * Soma a FGV 2025.1 ao banco de exercícios.
 *
 *   node scripts/build-fgv-2025-questions.mjs
 *
 * Por que este script existe separado de `build-fgv-questions.mjs`: aquele lê a
 * prova de 2026.2, que veio em PDF com camada de texto e por isso pôde ser
 * extraída por programa. A de 2025.1 chegou **digitalizada** — imagem pura. O
 * reconhecimento automático acertou 11 das 60 questões: os marcadores das
 * alternativas saíam como "Ay", "Co", e nenhum conserto de recorte resolvia,
 * porque a informação não estava lá.
 *
 * Então a transcrição foi feita à mão, lendo o gabarito comentado página a
 * página, e vive em `data/provas/fgv-2025-1-transcrito.json`. Este script só
 * traduz aquele arquivo para o formato do banco. É trabalho barato justamente
 * porque o caro já foi pago uma vez e ficou versionado.
 *
 * Quatro questões (4, 16, 17 e 24) dependem de figura e ficaram de fora: sem a
 * imagem não há resposta possível. Sobram 56.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src', 'data', 'questions')

/** Faixas fixas da objetiva do Vestibular Unificado. */
const FAIXAS = [
  { ate: 15, subjectId: 'mat' },
  { ate: 30, subjectId: 'por' },
  { ate: 45, subjectId: 'ing' },
  { ate: 60, subjectId: null }, // humanas: decidido por vocabulário
]

/**
 * Ciências Humanas mistura História, Geografia, Filosofia e Sociologia sem
 * dizer qual é qual — mesma situação de `build-fgv-questions.mjs`. O palpite
 * por vocabulário é aceitável: errar a etiqueta só muda em que trilha a questão
 * aparece, não o conteúdo dela.
 */
const HUMANAS = {
  // História vem primeiro de propósito. O placar empata com frequência — a
  // criação do Estado de Israel casa com "população" e "imigração" tanto quanto
  // com "século" e "guerra" — e no empate quem é testado antes leva. Como
  // História é o maior bloco de humanas da prova, é o desempate certo.
  his: ['século', 'guerra', 'revolução', 'império', 'colon', 'ditadura', 'república', 'idade média', 'antiguidade', 'constituição', 'independência', 'escrav', 'engenho', 'historiografia'],
  // "região" ficou de fora de propósito: aparece em questão de História com a
  // mesma frequência que em questão de Geografia.
  geo: ['clima', 'relevo', 'população', 'urban', 'território', 'migra', 'agrícola', 'bioma', 'petróleo', 'energia', 'fronteira', 'mapa', 'desmatamento', 'amazônia', 'metrópole', 'sustentável', 'ambiental'],
  fil: ['filosof', 'ética', 'moral', 'kant', 'platão', 'aristóteles', 'conhecimento', 'razão', 'existência', 'modernidade', 'utópico'],
  soc: ['sociedade', 'social', 'classe', 'sindicat', 'cultura', 'desigualdade', 'cidadania', 'democracia', 'weber', 'durkheim', 'marx'],
}

function materiaDeHumanas(texto) {
  const t = texto.toLowerCase()
  let melhor = 'his'
  let placar = 0
  for (const [id, palavras] of Object.entries(HUMANAS)) {
    const n = palavras.reduce((acc, p) => acc + (t.includes(p) ? 1 : 0), 0)
    if (n > placar) {
      placar = n
      melhor = id
    }
  }
  return melhor
}

function materiaDe(numero, texto) {
  const faixa = FAIXAS.find((f) => numero <= f.ate)
  if (!faixa) return null
  return faixa.subjectId ?? materiaDeHumanas(texto)
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']

const fonte = resolve(ROOT, 'data', 'provas', 'fgv-2025-1-transcrito.json')
const { questoes } = JSON.parse(readFileSync(fonte, 'utf8'))

console.log('FGV 2025.1 — objetiva do Vestibular Unificado')
console.log(`  questões transcritas: ${questoes.length} de 60`)

const porMateria = {}

for (const q of questoes) {
  const texto = `${q.contexto ?? ''} ${q.enunciado} ${q.alt.join(' ')}`
  const subjectId = materiaDe(q.n, texto)
  if (!subjectId) continue

  ;(porMateria[subjectId] ??= []).push({
    id: `fgv-2025-1-${q.n}`,
    exam: 'FGV',
    year: 2025,
    number: q.n,
    subjectId,
    context: q.contexto ?? null,
    statement: q.enunciado,
    alternatives: q.alt.map((text, i) => ({ letter: LETRAS[i], text })),
    correct: q.correta,
    // Fase única de objetiva; a dissertativa é outro caderno.
    phase: 1,
  })
}

const index = existsSync(resolve(OUT, 'index.json'))
  ? JSON.parse(readFileSync(resolve(OUT, 'index.json'), 'utf8'))
  : {}

for (const [subjectId, novas] of Object.entries(porMateria)) {
  const arquivo = resolve(OUT, `${subjectId}.json`)
  const atuais = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : []
  const vistos = new Set(atuais.map((q) => q.id))
  const juntas = [...atuais, ...novas.filter((q) => !vistos.has(q.id))]
  writeFileSync(arquivo, JSON.stringify(juntas))
  index[subjectId] = juntas.length
  console.log(
    `  ${subjectId.padEnd(4)} +${String(juntas.length - atuais.length).padStart(2)} FGV 2025 → ${juntas.length} no total`,
  )
}

writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2))
console.log(`\n  banco final: ${Object.values(index).reduce((a, b) => a + b, 0)} questões`)
