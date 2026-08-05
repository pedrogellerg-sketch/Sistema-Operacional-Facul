/**
 * Soma questões da FGV ao banco, lendo a prova objetiva do vestibular EAESP.
 *
 *   node scripts/build-fgv-questions.mjs
 *
 * Ao contrário da Fuvest — que veio pronta do BLUEX —, a FGV não tem conjunto
 * aberto. A prova é lida do PDF oficial, já extraído para texto em
 * `data/provas/`. O texto é versionado para que a leitura seja reproduzível sem
 * o PDF, mesmo padrão dos planos de aula da escola.
 *
 * Duas coisas facilitam a vida aqui:
 *
 * 1. **A matéria sai da numeração.** A objetiva da EAESP é sempre 60 questões
 *    na mesma ordem: 1–15 Matemática, 16–30 Língua Portuguesa, 31–45 Inglês,
 *    46–60 Ciências Humanas. Nada de adivinhar por vocabulário como no ENEM.
 * 2. **O gabarito é uma tabela limpa**, com `*` marcando questão anulada.
 *
 * A prova sai em quatro versões (T01–T04) com as mesmas questões embaralhadas.
 * Lemos só a T01 contra a "PROVA 1" do gabarito — as outras três seriam
 * duplicatas do mesmo enunciado.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src', 'data', 'questions')

/** Faixas fixas da objetiva da EAESP. */
const FAIXAS = [
  { ate: 15, subjectId: 'mat' },
  { ate: 30, subjectId: 'por' },
  { ate: 45, subjectId: 'ing' },
  { ate: 60, subjectId: null }, // humanas: decidido por vocabulário
]

/**
 * Ciências Humanas mistura História, Geografia, Filosofia e Sociologia sem
 * dizer qual é qual. Aqui o palpite por vocabulário é aceitável: o bloco é
 * pequeno e errar a etiqueta só muda em que trilha a questão aparece.
 */
const HUMANAS = {
  geo: ['clima', 'relevo', 'população', 'urban', 'território', 'migra', 'agrícola', 'bioma', 'petróleo', 'energia', 'fronteira', 'mapa', 'região', 'economia global', 'globaliza'],
  fil: ['filosof', 'ética', 'moral', 'kant', 'platão', 'aristóteles', 'conhecimento', 'razão', 'existência'],
  soc: ['sociedade', 'social', 'classe', 'trabalho', 'sindicat', 'cultura', 'desigualdade', 'cidadania', 'democracia', 'weber', 'durkheim', 'marx'],
  his: ['século', 'guerra', 'revolução', 'império', 'colon', 'ditadura', 'república', 'idade média', 'antiguidade', 'brasil colônia', 'independência'],
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

/** Lê a tabela "PROVA 1" do gabarito: 60 números seguidos de 60 letras. */
function lerGabarito(texto) {
  const bloco = texto.split(/PROVA\s+2/)[0]
  const respostas = {}
  // As linhas vêm em pares: 20 números, depois as 20 letras correspondentes.
  const grupos = [...bloco.matchAll(/((?:\d{1,2}\s+){19}\d{1,2})\s+((?:[A-E*]\s+){19}[A-E*])/g)]
  for (const g of grupos) {
    const nums = g[1].trim().split(/\s+/).map(Number)
    const letras = g[2].trim().split(/\s+/)
    nums.forEach((n, i) => {
      if (letras[i] && letras[i] !== '*') respostas[n] = letras[i]
    })
  }
  return respostas
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']

/**
 * Recorta as cinco alternativas de um trecho.
 *
 * Procura `(A)`, depois `(B)` **a partir dali**, e assim por diante. Um padrão
 * único com `[^()]*` não serve: o texto das alternativas tem parênteses de
 * verdade — "(3º. parágrafo)" aparece em quase toda questão de interpretação.
 */
function recortarAlternativas(corpo) {
  const pos = []
  let cursor = 0
  for (const L of LETRAS) {
    const i = corpo.indexOf(`(${L})`, cursor)
    if (i < 0) return null
    pos.push(i)
    cursor = i + 3
  }
  const alternatives = pos.map((p, i) => ({
    letter: LETRAS[i],
    text: corpo
      .slice(p + 3, i + 1 < pos.length ? pos[i + 1] : corpo.length)
      .trim()
      .replace(/\s+/g, ' '),
  }))
  if (alternatives.some((a) => a.text.length === 0)) return null
  return { statement: corpo.slice(0, pos[0]).trim(), alternatives }
}

/**
 * Separa as questões, varrendo os números **em sequência**.
 *
 * A tentação é achar todo número solto e tratar como marca de questão; não
 * funciona. Enunciados de Matemática trazem fórmulas cheias de dígitos soltos
 * ("𝑐 1 (𝑡) = 30 + 16 ⋅ 𝑐𝑜𝑠 …") e cada um deles vira uma questão fantasma que
 * engole a de verdade. Como a prova é numerada de 1 a 60 em ordem, procuramos
 * só o próximo número esperado, e só aceitamos a posição cujo trecho seguinte
 * realmente contém as cinco alternativas.
 */
function lerQuestoes(texto, total = 60) {
  const limpo = texto
    .replace(/\s+/g, ' ')
    .replace(/VESTIBULAR FGV [\d.]+ FGV Conhecimento Turno \d - Prova Objetiva Tipo \d+ – T\dOBJ-T\d+ – Página \d+/g, ' ')
    .replace(/\s+/g, ' ')

  /** Posições onde `n` aparece isolado, a partir de `from`. */
  const candidatos = (n, from) => {
    const re = new RegExp(`(?:^|\\s)${n}\\s+(?=[A-ZÀ-Ú“"(])`, 'g')
    re.lastIndex = from
    const out = []
    let m
    while ((m = re.exec(limpo))) out.push(m.index + m[0].length)
    return out
  }

  /**
   * Passada 1 — onde cada questão começa.
   *
   * Aceita a posição só se o trecho seguinte tiver as cinco alternativas, o que
   * descarta dígito de fórmula. A janela usada aqui é generosa de propósito: só
   * serve para validar, e o recorte definitivo vem depois.
   */
  const inicios = new Map()
  let cursor = 0
  for (let numero = 1; numero <= total; numero++) {
    for (const inicio of candidatos(numero, cursor)) {
      const janela = limpo.slice(inicio, inicio + 6000)
      const recorte = recortarAlternativas(janela)
      if (recorte && recorte.statement.length >= 30) {
        inicios.set(numero, inicio)
        cursor = inicio
        break
      }
    }
  }

  /**
   * Passada 2 — recorte com a fronteira correta.
   *
   * Agora sabemos onde a questão seguinte começa de verdade, então o corpo tem
   * fim exato. Sem isso a última alternativa engolia a próxima questão inteira:
   * uma alternativa de 3.589 caracteres contendo o enunciado seguinte.
   */
  const numeros = [...inicios.keys()].sort((a, b) => a - b)
  const questoes = []
  /** Passagem compartilhada pendente: vale para as próximas N questões. */
  let pendente = null

  for (let i = 0; i < numeros.length; i++) {
    const numero = numeros[i]
    const inicio = inicios.get(numero)
    const proximo = numeros[i + 1]
    // Recua até antes do número da próxima questão, que fica no texto anterior.
    const fim = proximo != null ? Math.max(inicio, inicios.get(proximo) - 4) : limpo.length

    const recorte = recortarAlternativas(limpo.slice(inicio, fim))
    if (!recorte || recorte.statement.length < 30) continue

    const q = {
      numero,
      statement: recorte.statement.replace(/\s+/g, ' '),
      alternatives: recorte.alternatives,
      context: pendente && pendente.restantes > 0 ? pendente.texto : null,
    }
    if (pendente) pendente.restantes -= 1

    /**
     * A prova intercala textos de apoio entre as questões, e eles caem dentro
     * da última alternativa. Cortar não basta: sem a passagem, as questões que
     * dependem dela ficam impossíveis de responder. Então o texto é recortado
     * dali e vira `context` das próximas — que é para isso que o campo existe.
     */
    const ultima = q.alternatives[4]
    // "Texto" e "Textos" — a prova usa os dois, e o plural passou despercebido
    // na primeira leitura, deixando uma alternativa de 2.770 caracteres.
    const marca = ultima.text.match(
      /Textos? para responder [àa]s pr[óo]ximas (duas|tr[êe]s|quatro|cinco|seis)\s+quest[õo]es/i,
    )
    if (marca) {
      const QUANTAS = { duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6 }
      const chave = marca[1].toLowerCase().replace(/ê/g, 'e')
      const passagem = ultima.text.slice(marca.index + marca[0].length).trim()
      ultima.text = ultima.text.slice(0, marca.index).trim()
      pendente = { texto: passagem, restantes: QUANTAS[chave] ?? 0 }
    }

    questoes.push(q)
  }

  return questoes
}

const provaPath = resolve(ROOT, 'data', 'provas', 'fgv-2026-2-objetiva.txt')
const gabPath = resolve(ROOT, 'data', 'provas', 'fgv-2026-2-gabarito.txt')

const questoes = lerQuestoes(readFileSync(provaPath, 'utf8'))
const gabarito = lerGabarito(readFileSync(gabPath, 'utf8'))

console.log('FGV 2026.2 — objetiva EAESP')
console.log(`  questões lidas: ${questoes.length} de 60`)
console.log(`  gabarito: ${Object.keys(gabarito).length} respostas`)

const porMateria = {}
let semGabarito = 0

for (const q of questoes) {
  const correct = gabarito[q.numero]
  if (!correct) {
    semGabarito += 1
    continue
  }
  const subjectId = materiaDe(q.numero, `${q.statement} ${q.alternatives.map((a) => a.text).join(' ')}`)
  if (!subjectId) continue

  ;(porMateria[subjectId] ??= []).push({
    id: `fgv-2026-2-${q.numero}`,
    exam: 'FGV',
    year: 2026,
    number: q.numero,
    subjectId,
    context: q.context ?? null,
    statement: q.statement,
    alternatives: q.alternatives,
    correct,
    // A EAESP tem fase única de objetiva; a dissertativa é outro caderno.
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
  console.log(`  ${subjectId.padEnd(4)} +${String(juntas.length - atuais.length).padStart(2)} FGV → ${juntas.length} no total`)
}

writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2))
console.log(`\n  ${semGabarito} sem gabarito (questões anuladas)`)
console.log(`  banco final: ${Object.values(index).reduce((a, b) => a + b, 0)} questões`)
