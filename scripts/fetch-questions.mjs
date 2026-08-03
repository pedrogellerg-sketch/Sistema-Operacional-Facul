/**
 * Baixa questões reais do ENEM da API pública enem.dev e gera os arquivos
 * estáticos que o app empacota.
 *
 *   node scripts/fetch-questions.mjs
 *
 * Roda só quando queremos atualizar o banco — o app nunca chama a API em
 * tempo de execução. As questões viram asset empacotado, então funcionam
 * offline e não entram no localStorage (são dados de leitura, não do usuário).
 *
 * Fonte: https://enem.dev — projeto open-source da comunidade brasileira que
 * expõe as provas publicadas pelo INEP.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'questions')
const API = 'https://api.enem.dev/v1'
const YEARS = [2023, 2022, 2021, 2020, 2019]

/**
 * O ENEM agrupa em 4 grandes áreas; a escola trabalha com 9 disciplinas.
 * Classificamos por vocabulário — imperfeito, mas o usuário pode reetiquetar
 * e a alternativa (deixar tudo em "ciências da natureza") seria inútil.
 */
const SUBJECT_KEYWORDS = {
  fis: [
    'velocidade', 'aceleração', 'força', 'newton', 'energia cinética', 'potência',
    'trabalho', 'atrito', 'movimento', 'onda', 'frequência', 'refração', 'espelho',
    'lente', 'circuito', 'corrente elétrica', 'tensão', 'resistor', 'campo magnético',
    'termodinâmica', 'calor específico', 'dilatação', 'pressão', 'empuxo', 'joule',
    'watt', 'newton', 'm/s', 'gravidade', 'massa e', 'impulso', 'momento linear',
  ],
  qui: [
    'átomo', 'molécula', 'mol', 'reação química', 'ligação', 'ácido', 'base', 'ph',
    'oxidação', 'redução', 'eletrólise', 'solução', 'concentração', 'estequiometria',
    'tabela periódica', 'isótopo', 'polímero', 'hidrocarboneto', 'combustão',
    'catalisador', 'equilíbrio químico', 'entalpia', 'nox', 'íon', 'sal', 'orgânica',
  ],
  bio: [
    'célula', 'dna', 'rna', 'proteína', 'enzima', 'gene', 'cromossomo', 'mitose',
    'meiose', 'fotossíntese', 'respiração celular', 'ecossistema', 'cadeia alimentar',
    'bactéria', 'vírus', 'evolução', 'seleção natural', 'espécie', 'ecologia',
    'hormônio', 'sistema nervoso', 'imunidade', 'vacina', 'bioma', 'organismo',
  ],
  his: [
    'século', 'guerra', 'revolução', 'império', 'colônia', 'escravidão', 'república',
    'ditadura', 'vargas', 'independência', 'idade média', 'feudal', 'renascimento',
    'iluminismo', 'nazismo', 'fascismo', 'guerra fria', 'proclamação', 'monarquia',
    'constituição de', 'movimento operário', 'abolição',
  ],
  geo: [
    'território', 'população', 'urbanização', 'migração', 'clima', 'relevo', 'solo',
    'bacia hidrográfica', 'agricultura', 'indústria', 'globalização', 'geopolítica',
    'desmatamento', 'cerrado', 'amazônia', 'demográfic', 'ibge', 'região',
    'recursos naturais', 'energia', 'cartográf', 'latitude', 'longitude',
  ],
  fil: [
    'filósofo', 'filosofia', 'platão', 'aristóteles', 'kant', 'nietzsche', 'ética',
    'sócrates', 'descartes', 'hobbes', 'rousseau', 'locke', 'epistemolog', 'metafísic',
    'virtude', 'razão prática', 'contrato social', 'livre-arbítrio', 'pensamento crítico',
  ],
  soc: [
    'sociólogo', 'durkheim', 'weber', 'karl marx', 'classe social', 'cidadania',
    'movimento social', 'desigualdade social', 'trabalho assalariado', 'sindicato',
    'indústria cultural', 'estratificação', 'anomia', 'burocracia', 'capital social',
    'exclusão social', 'minorias', 'preconceito', 'identidade cultural',
  ],
  por: [
    'texto', 'linguagem', 'gramática', 'literatura', 'poema', 'modernismo',
    'variação linguística', 'figura de linguagem', 'romance', 'narrador', 'eu lírico',
    'crônica', 'verso', 'estrofe', 'metáfora', 'coesão', 'coerência', 'gênero textual',
  ],
  ing: [],
}

/**
 * Termos que praticamente decidem sozinhos a disciplina. Valem 3 pontos —
 * sem isso, "energia" puxava questões de Geografia para Física.
 */
const STRONG_KEYWORDS = {
  fis: ['lei de newton', 'energia cinética', 'lei de snell', 'efeito joule', 'circuito elétrico', 'onda eletromagnética', 'aceleração da gravidade'],
  qui: ['tabela periódica', 'ligação covalente', 'número de oxidação', 'reação de combustão', 'massa molar', 'ph da solução', 'ácido-base', 'estequiometria'],
  bio: ['dna', 'fotossíntese', 'seleção natural', 'cadeia alimentar', 'sistema imunológico', 'divisão celular', 'código genético'],
  his: ['guerra fria', 'idade média', 'revolução francesa', 'era vargas', 'ditadura militar', 'segunda guerra mundial', 'brasil colônia'],
  geo: ['domínio morfoclimático', 'bacia hidrográfica', 'placas tectônicas', 'matriz energética', 'êxodo rural', 'pirâmide etária', 'projeção cartográfica', 'zona urbana'],
  fil: ['mito da caverna', 'imperativo categórico', 'contrato social'],
  soc: ['indústria cultural', 'mais-valia', 'fato social'],
  por: ['eu lírico', 'figura de linguagem', 'norma culta'],
}

/** Área do ENEM → disciplinas candidatas, na ordem de desempate. */
const AREA_SUBJECTS = {
  matematica: ['mat'],
  'ciencias-natureza': ['fis', 'qui', 'bio'],
  'ciencias-humanas': ['his', 'geo', 'fil', 'soc'],
  linguagens: ['por'],
}

function classify(question) {
  const area = question.discipline
  const candidates = AREA_SUBJECTS[area]
  if (!candidates) return null
  if (candidates.length === 1) return candidates[0]

  const haystack = `${question.context ?? ''} ${question.alternativesIntroduction ?? ''} ${(question.alternatives ?? [])
    .map((a) => a.text ?? '')
    .join(' ')}`.toLowerCase()

  let best = null
  let bestScore = 0
  for (const subject of candidates) {
    const weak = (SUBJECT_KEYWORDS[subject] ?? []).reduce(
      (acc, kw) => acc + (haystack.includes(kw) ? 1 : 0),
      0,
    )
    const strong = (STRONG_KEYWORDS[subject] ?? []).reduce(
      (acc, kw) => acc + (haystack.includes(kw) ? 3 : 0),
      0,
    )
    const score = weak + strong
    if (score > bestScore) {
      bestScore = score
      best = subject
    }
  }

  // Sem sinal, a questão vira "geral da área" em vez de ser empurrada para a
  // primeira disciplina da lista — era isso que inflava História.
  if (bestScore === 0) return area === 'ciencias-humanas' ? 'geral_humanas' : 'geral_natureza'
  return best
}

/** Questões dependentes de imagem não funcionam offline — descartadas. */
function isUsable(q) {
  if (q.language) return false // itens de língua estrangeira
  if (!q.alternativesIntroduction || !q.alternatives?.length) return false
  if (q.alternatives.some((a) => a.file || !a.text)) return false
  const ctx = q.context ?? ''
  if (ctx.includes('![](')) return false
  if (q.files?.length) return false
  return true
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** A API é comunitária e limita taxa; espera entre páginas e recua no 429. */
async function getJSON(url, attempt = 0) {
  const res = await fetch(url)
  if (res.status === 429) {
    if (attempt >= 5) throw new Error(`rate limit persistente em ${url}`)
    const wait = 2000 * 2 ** attempt
    process.stdout.write(`(429, aguardando ${wait / 1000}s) `)
    await sleep(wait)
    return getJSON(url, attempt + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`)
  return res.json()
}

async function fetchYear(year) {
  const all = []
  let offset = 0
  for (;;) {
    const json = await getJSON(`${API}/exams/${year}/questions?limit=50&offset=${offset}`)
    all.push(...json.questions)
    if (!json.metadata.hasMore) break
    offset += 50
    await sleep(1200)
  }
  return all
}

const bySubject = {}
let seen = 0
let usable = 0

// Cache do download bruto: a classificação é heurística e vai ser ajustada,
// e refazer 900 requisições a cada ajuste castiga uma API comunitária.
const CACHE = resolve(OUT, '..', '..', '..', '.cache-enem')
mkdirSync(CACHE, { recursive: true })

for (const year of YEARS) {
  process.stdout.write(`  ENEM ${year}… `)
  const cacheFile = resolve(CACHE, `${year}.json`)

  let questions
  if (existsSync(cacheFile)) {
    questions = JSON.parse(readFileSync(cacheFile, 'utf8'))
    process.stdout.write('(cache) ')
  } else {
    questions = await fetchYear(year)
    writeFileSync(cacheFile, JSON.stringify(questions))
    await sleep(2000)
  }
  seen += questions.length

  for (const q of questions) {
    if (!isUsable(q)) continue
    const subject = classify(q)
    if (!subject) continue
    usable++

    bySubject[subject] ??= []
    bySubject[subject].push({
      id: `enem-${year}-${q.index}`,
      exam: 'ENEM',
      year,
      number: q.index,
      subjectId: subject,
      context: (q.context ?? '').trim() || null,
      statement: q.alternativesIntroduction.trim(),
      alternatives: q.alternatives.map((a) => ({ letter: a.letter, text: a.text.trim() })),
      correct: q.correctAlternative,
    })
  }
}

mkdirSync(OUT, { recursive: true })

const index = {}
for (const [subject, list] of Object.entries(bySubject)) {
  writeFileSync(resolve(OUT, `${subject}.json`), JSON.stringify(list))
  index[subject] = list.length
  console.log(`  ✓ ${subject}.json — ${list.length} questões`)
}
writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2))

console.log(`\n${usable} questões aproveitáveis de ${seen} baixadas (${YEARS.length} anos).`)
