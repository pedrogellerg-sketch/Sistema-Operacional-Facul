/**
 * Gera o Banco Curricular já preenchido, a partir dos planos da escola.
 *
 *   node scripts/build-curriculum-seed.mjs
 *
 * Este app é de uma pessoa só, com uma escola só. Fazer o Fernando reimportar
 * nove PDFs toda vez que troca de aparelho ou limpa os dados é fricção
 * inventada — os planos são fixos, então nascem dentro do app.
 *
 * O importador de PDF continua existindo para o próximo bimestre, quando a
 * escola publicar planos novos.
 *
 * Fonte: `data/planos/*.txt` — texto extraído dos PDFs oficiais.
 * Saída:  `src/data/curriculumSeed.json`
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// O parser é TypeScript com alias `@/`; carregamos via vite-node no npm script.
const { parsePlan } = await import('../src/lib/curriculum/parser.ts')
const { linkLessonsToTopics } = await import('../src/lib/curriculum/topics.ts')

/** Arquivo → disciplina no sistema. */
const FILES = {
  'matematica.txt': 'mat',
  'fisica.txt': 'fis',
  'quimica.txt': 'qui',
  'biologia1.txt': 'bio1',
  'historia.txt': 'his',
  'geografia.txt': 'geo',
  'redacao.txt': 'red',
  'literatura.txt': 'lit',
  'efl.txt': 'efl',
}

const lessons = []
const topics = []
const imported = []

for (const [file, subjectId] of Object.entries(FILES)) {
  const text = readFileSync(resolve(ROOT, 'data', 'planos', file), 'utf8')
  const parsed = parsePlan(text, { subjectId })

  const normalized = parsed.lessons.map((l, i) => ({ ...l, subjectId, order: i + 1 }))
  const { lessons: linked, newTopics } = linkLessonsToTopics(normalized, subjectId, topics)

  lessons.push(...linked)
  topics.push(...newTopics)
  imported.push(subjectId)

  const avisos = parsed.warnings.length ? ` · ${parsed.warnings.length} aviso(s)` : ''
  console.log(
    `  ${subjectId.padEnd(5)} ${String(linked.length).padStart(3)} aulas · ` +
      `${String(newTopics.length).padStart(2)} tópicos${avisos}`,
  )
}

writeFileSync(
  resolve(ROOT, 'src', 'data', 'curriculumSeed.json'),
  JSON.stringify({ lessons, topics, imported }),
)

console.log(
  `\n✓ ${lessons.length} aulas e ${topics.length} tópicos em src/data/curriculumSeed.json`,
)

const semDatas = lessons.filter((l) => !l.declaredDate).length
console.log(
  `  ${lessons.length - semDatas} aulas com data declarada; as outras ${semDatas} ` +
    `têm a data calculada pela grade.`,
)

// Conferência dos defeitos conhecidos dos documentos originais.
const dupes = {}
for (const l of lessons) {
  const key = `${l.subjectId}:${l.number}`
  dupes[key] = (dupes[key] ?? 0) + 1
}
const repetidos = Object.entries(dupes).filter(([, n]) => n > 1)
if (repetidos.length) {
  console.log(`\n  Números repetidos (erro dos PDFs originais, esperado):`)
  for (const [k, n] of repetidos) console.log(`    ${k} aparece ${n}×`)
}
