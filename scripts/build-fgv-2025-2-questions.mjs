/**
 * Soma a FGV 2025.2 ao banco, lendo a objetiva do Vestibular Unificado.
 *
 *   node scripts/build-fgv-2025-2-questions.mjs
 *
 * ## Por que não dá para reusar `build-fgv-questions.mjs`
 *
 * Aquele script lê a 2026.2, cujo texto foi versionado já com os espaços
 * colapsados — um fluxo único, sem quebras de linha. Sem linhas, a única forma
 * de achar onde cada questão começa é varrer os números **em sequência**, e é
 * por isso que ele carrega toda aquela defesa contra dígito de fórmula virando
 * questão fantasma.
 *
 * O PDF da 2025.2 preserva as linhas, e isso muda o jogo: **o número da questão
 * fica sozinho na linha**. É um sinal muito mais forte, e dispensa a varredura
 * sequencial — o que aqui é essencial, porque a ordem de leitura desta prova
 * está embaralhada. A questão 15 sai do PDF entre a 11 e a 12, e a varredura
 * sequencial engasgava ali: perdia a 15 de verdade, casava com um "15" solto
 * 42 mil caracteres à frente e arrastava o cursor junto, derrubando as 45
 * questões seguintes. Lendo por linha, a ordem no arquivo deixa de importar.
 *
 * ## A armadilha do número solto na linha
 *
 * Nem toda linha com um número é marcador de questão. A questão 8 tem uma soma
 * de frações, e os numeradores "1" saem cada um na sua linha:
 *
 *     𝑇 é a tangente de 𝑥, a soma + é igual a
 *     1
 *     1
 *
 * Esses viram marcadores falsos que cortam a questão ao meio, antes das
 * alternativas. O que separa marcador de numerador é o que vem depois: um
 * enunciado começa com maiúscula e é longo. Um numerador é seguido de outro
 * número ou de um símbolo.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src', 'data', 'questions')

/** Faixas fixas da objetiva do Unificado, confirmadas pelos títulos de seção. */
const FAIXAS = [
  { ate: 15, subjectId: 'mat' },
  { ate: 30, subjectId: 'por' },
  { ate: 45, subjectId: 'ing' },
  { ate: 60, subjectId: null }, // humanas: decidido por vocabulário
]

/**
 * Ciências Humanas mistura História, Geografia, Filosofia e Sociologia sem
 * dizer qual é qual. História vem primeiro porque o placar empata com
 * frequência e, no empate, quem é testado antes leva.
 */
const HUMANAS = {
  his: ['século', 'guerra', 'revolução', 'império', 'colon', 'ditadura', 'república', 'idade média', 'antiguidade', 'escrav', 'iluminis', 'renascimento', 'caricatura'],
  geo: ['clima', 'relevo', 'população', 'urban', 'território', 'migra', 'agrícola', 'bioma', 'petróleo', 'energia', 'fronteira', 'mapa', 'desmatamento', 'chuva', 'segregação', 'comércio mundial', 'globaliza'],
  soc: ['sociedade', 'social', 'classe', 'sindicat', 'cultura', 'desigualdade', 'cidadania', 'democracia', 'weber', 'durkheim', 'marx'],
  fil: ['filosof', 'ética', 'moral', 'kant', 'platão', 'aristóteles', 'liberdade', 'razão', 'existência', 'stuart mill'],
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

/**
 * Lê a tabela do gabarito.
 *
 * As quatro matérias vêm lado a lado na página, então cada linha do texto traz
 * **quatro** questões — "1 D B B E … 16 B E A A … 31 B A B A … 46 C A B C". E
 * cada uma traz quatro letras, uma por tipo de caderno. Lemos o Tipo 1, que é a
 * versão do PDF da prova que temos.
 */
function lerGabarito(texto) {
  const respostas = {}
  for (const m of texto.matchAll(/(\d{1,2})\s+([A-E])\s+([A-E])\s+([A-E])\s+([A-E])/g)) {
    respostas[Number(m[1])] = m[2]
  }
  return respostas
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']

/**
 * Recorta as cinco alternativas de um trecho.
 *
 * Procura `(A)`, depois `(B)` **a partir dali**, e assim por diante. Um padrão
 * único não serve: o texto das alternativas tem parênteses de verdade — as
 * citações de parágrafo aparecem em quase toda questão de interpretação.
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
  const maiorDasOutras = Math.max(...alternatives.slice(0, 4).map((a) => a.text.length))
  const bruta = alternatives[4].text
  alternatives[4].text = fecharUltima(bruta, maiorDasOutras)
  if (alternatives.some((a) => a.text.length === 0)) return null
  return {
    statement: corpo.slice(0, pos[0]).trim().replace(/\s+/g, ' '),
    alternatives,
    sobra: bruta.slice(alternatives[4].text.length).trim(),
  }
}

/**
 * A sobra da alternativa (E) é continuação de um texto de apoio?
 *
 * A página parte um texto de apoio em volta da questão que vem no meio: a
 * segunda metade do trecho de Macunaíma ("e não dizia mais nada. Ficava no
 * canto da maloca…") sai do PDF depois das alternativas da questão 26. Jogar
 * fora deixava a passagem em 446 caracteres, um terço do tamanho real.
 *
 * O que descarta o caso oposto — a sobra ser de outra questão, como as
 * alternativas da 57 que caíram na (E) da 58 — é a forma: continuação de texto
 * é prosa corrida, sem marca de alternativa e sem fórmula de fecho de
 * enunciado.
 */
function ehContinuacaoDeTexto(sobra) {
  if (sobra.length < 60) return false
  if (sobra.includes('(A)') || sobra.includes('(B)')) return false
  if (FECHO_DE_ENUNCIADO.test(sobra)) return false
  return true
}

/** Fórmulas com que a FGV fecha um enunciado, logo antes das alternativas. */
const FECHO_DE_ENUNCIADO =
  /\b(?:assinale\s+a|assinale\s+as|é\s+correto\s+afirmar|analise\s+as\s+afirmativas|considere\s+as\s+afirmativas)\b/i

/**
 * Fecha a alternativa (E), que é a única sem fronteira natural.
 *
 * A ordem de leitura desta prova está embaralhada, e uma questão que depende de
 * figura pode sair partida: o enunciado numa página, as alternativas depois das
 * da questão seguinte. Foi o caso da 57, cujas alternativas inteiras foram
 * parar dentro da (E) da 58 — 1.320 caracteres.
 *
 * Dois cortes resolvem, nesta ordem. Um segundo `(A)` só pode ser o começo de
 * outra questão, então tudo dali para frente sai. E o que ainda sobra é o
 * enunciado dessa outra questão, que se reconhece pela fórmula com que a FGV
 * fecha enunciado — "assinale a afirmativa incorreta" —; cortamos na fronteira
 * de frase anterior a ela.
 */
function fecharUltima(texto, maiorDasOutras) {
  const outraQuestao = texto.indexOf('(A)')
  let fim = outraQuestao >= 0 ? texto.slice(0, outraQuestao) : texto

  const fecho = fim.search(FECHO_DE_ENUNCIADO)
  if (fecho > 0) {
    const frase = fim.lastIndexOf('. ', fecho)
    if (frase > 0) fim = fim.slice(0, frase + 1)
  }

  /**
   * Último corte, por tamanho. Nem todo intruso se anuncia: o trecho de
   * Macunaíma — texto de apoio de outra faixa, também partido pela página —
   * caiu na (E) da questão 26 sem `(A)` nem fórmula de fecho, e a alternativa
   * foi de 70 para 939 caracteres.
   *
   * As cinco alternativas de uma questão são paralelas em forma e em extensão,
   * então a (E) destoar das outras é sinal de intruso. O limite é generoso — o
   * dobro da maior das outras quatro, com piso — para nunca cortar alternativa
   * de verdade, e o corte cai na fronteira de frase.
   */
  const limite = Math.max(150, maiorDasOutras * 2)
  if (fim.length > limite) {
    const frase = fim.lastIndexOf('. ', limite)
    if (frase > 20) fim = fim.slice(0, frase + 1)
  }

  return fim.trim()
}

/** Primeira linha com conteúdo a partir de `i`. */
function proximaLinhaCheia(linhas, i) {
  for (let k = i; k < linhas.length && k < i + 4; k++) {
    const l = linhas[k].trim()
    if (l) return l
  }
  return ''
}

/**
 * Marcadores de questão: linha com um número de 1 a 60 e nada mais, **seguida
 * do começo de um enunciado**.
 *
 * A segunda condição é o que separa marcador de numerador de fração: enunciado
 * abre com maiúscula, aspas ou parêntese, e tem corpo. Sem ela, os dois "1" da
 * soma de frações da questão 8 cortavam a questão antes das alternativas.
 */
function acharMarcadores(linhas) {
  const marcadores = []
  linhas.forEach((linha, i) => {
    const m = linha.match(/^\s*(\d{1,2})\s*$/)
    if (!m) return
    const numero = Number(m[1])
    if (numero < 1 || numero > 60) return
    const seguinte = proximaLinhaCheia(linhas, i + 1)
    if (seguinte.length < 20) return
    if (!/^[A-ZÀ-Ú“"(¿¡]/.test(seguinte)) return
    marcadores.push({ numero, linha: i })
  })
  return marcadores
}

/**
 * Textos de apoio compartilhados.
 *
 * A prova anuncia por extenso — "Atenção! Leia o texto a seguir para responder
 * às próximas cinco questões" — e o texto vem logo abaixo, antes do número da
 * primeira questão da faixa. Sem a passagem, as questões de interpretação e as
 * de inglês ficam impossíveis de responder.
 */
const QUANTAS = { duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8 }

/**
 * O anúncio inteiro, do "Atenção!" ao ponto final. Precisa ser casado no bloco
 * já juntado, não linha a linha: a frase quebra onde calha na coluna
 * ("…às próximas cinco⏎questões."), e procurar por linha não achava nenhuma
 * das oito passagens da prova.
 */
const ANUNCIO =
  /(?:Aten[çc][ãa]o!\s*)?Leia\s+o\s+texto\s+a\s+seguir\s+para\s+responder\s+[àa]s\s+pr[óo]ximas\s+(duas|tr[êe]s|quatro|cinco|seis|sete|oito)\s+quest[õo]es\.?/i

/**
 * Mobília de página: cabeçalho, rodapé institucional e número da página.
 *
 * Some antes de qualquer recorte. Como a alternativa (E) é a última e não tem
 * nada depois para limitá-la, tudo isso caía dentro dela — 22 das 54 questões
 * saíam com "Graduação em Administração de Empresas - FGV EAESP" colado na
 * resposta.
 */
function tirarMobilia(linhas) {
  const lixo = [
    /^\s*VESTIBULAR FGV [\d.]+\s*$/,
    /^\s*FGV Conhecimento\s*$/,
    /^\s*Graduação em Administração de Empresas - FGV EAESP\s*$/,
    /^\s*Tipo \d+ – Página \d+\s*$/,
  ]
  return linhas.filter((l) => !lixo.some((re) => re.test(l)))
}

/**
 * A questão depende de imagem que não temos?
 *
 * Mesmo critério do ENEM, do BLUEX e do Insper: sem a figura não há resposta
 * possível. E mesma lição aprendida ali — o que denuncia a imagem é o verbo
 * ("a figura mostra", "analise os gráficos"), não a palavra solta, que também
 * aparece em "figuras militares" e em "reconfiguração".
 */
const SEMPRE_IMAGEM = /\b(tirinhas?|quadrinhos?|charge|caricatura|fotografias?|ilustraç(ão|ões)|infográfico)\b/i
const SUBSTANTIVO = '(?:figuras?|gráficos?|mapas?|imagens?|imagem|esquemas?|diagramas?|tabelas?|cartuns?)'
const VERBO = '(?:mostra|apresenta|representa|relaciona|indica|evidencia|demonstra|ilustra|exibe|traz|reproduz)'
const REFERENCIA = new RegExp(
  `(?:observe|analise|examine|conforme)[^.]{0,40}\\b${SUBSTANTIVO}\\b|\\b${SUBSTANTIVO}\\b[^.]{0,40}\\b${VERBO}`,
  'i',
)

function dependeDeImagem(texto) {
  return SEMPRE_IMAGEM.test(texto) || REFERENCIA.test(texto)
}

const linhas = tirarMobilia(
  readFileSync(resolve(ROOT, 'data', 'provas', 'fgv-2025-2-objetiva.txt'), 'utf8').split('\n'),
)
const gabarito = lerGabarito(readFileSync(resolve(ROOT, 'data', 'provas', 'fgv-2025-2-gabarito.txt'), 'utf8'))
const marcadores = acharMarcadores(linhas)

console.log('FGV 2025.2 — objetiva do Vestibular Unificado (Tipo 1)')
console.log(`  ${marcadores.length} marcadores de questão · ${Object.keys(gabarito).length} respostas no gabarito`)

const porMateria = {}
const vistos = new Set()
let comImagem = 0
let ilegiveis = 0
let semGabarito = 0

/**
 * Passagens anunciadas, em fila.
 *
 * Fila, e não uma variável só, porque a posição do anúncio não é confiável: o
 * aviso do trecho de Macunaíma sai do PDF entre as questões 25 e 26, embora
 * sirva à 28. Trocar a passagem assim que o próximo anúncio aparece encurtava o
 * texto do Machado de seis questões para quatro, e a 26 e a 27 — que perguntam
 * sobre Iaiá e Luís Garcia — vinham acompanhadas de Macunaíma.
 *
 * O que vale é a contagem declarada ("para responder às próximas seis
 * questões"), que a prova afirma e a paginação não altera. Cada questão
 * consome um lugar, aproveitada ou não, porque a contagem é de posição na
 * prova, não de questão que coube no banco.
 */
const fila = []
let pendente = null

function contextoDaVez() {
  if (!pendente || pendente.restantes <= 0) pendente = fila.shift() ?? null
  if (!pendente) return null
  pendente.restantes -= 1
  return pendente.texto
}

for (let k = 0; k < marcadores.length; k++) {
  const { numero, linha } = marcadores[k]
  const fim = k + 1 < marcadores.length ? marcadores[k + 1].linha : linhas.length
  const bloco = linhas.slice(linha + 1, fim).join(' ').replace(/\s+/g, ' ')

  /**
   * O anúncio do próximo texto de apoio cai **depois** das alternativas desta
   * questão. Cortamos ali: o que vem antes é a questão, o que vem depois é a
   * passagem das próximas.
   */
  const anuncio = bloco.match(ANUNCIO)
  const corpo = anuncio ? bloco.slice(0, anuncio.index) : bloco

  const recorte = recortarAlternativas(corpo)

  if (recorte && recorte.statement.length >= 25 && !vistos.has(numero)) {
    vistos.add(numero)

    /**
     * Devolve a continuação ao texto de apoio mais recentemente anunciado — é
     * dele que a página estava no meio quando abriu espaço para esta questão.
     */
    if (recorte.sobra && ehContinuacaoDeTexto(recorte.sobra) && fila.length > 0) {
      fila[fila.length - 1].texto += ` ${recorte.sobra}`
    }

    const correct = gabarito[numero]
    const context = contextoDaVez()

    if (!correct) {
      semGabarito += 1
    } else if (dependeDeImagem(recorte.statement)) {
      comImagem += 1
    } else {
      const subjectId = materiaDe(numero, `${context ?? ''} ${recorte.statement}`)
      if (subjectId) {
        ;(porMateria[subjectId] ??= []).push({
          id: `fgv-2025-2-${numero}`,
          exam: 'FGV',
          year: 2025,
          number: numero,
          subjectId,
          context,
          statement: recorte.statement,
          alternatives: recorte.alternatives,
          correct,
          // Fase única de objetiva; a dissertativa é o caderno da manhã.
          phase: 1,
        })
      }
    }
  } else if (!vistos.has(numero)) {
    // Sem as cinco alternativas em texto: ou a questão é toda figura, ou as
    // opções são imagem. Nos dois casos não dá para aproveitar — mas o lugar na
    // contagem da passagem é consumido do mesmo jeito.
    ilegiveis += 1
    contextoDaVez()
  }

  // Enfileira a passagem anunciada, para as questões que ela serve.
  if (anuncio) {
    const chave = anuncio[1].toLowerCase().replace(/ê/g, 'e')
    const texto = bloco.slice(anuncio.index + anuncio[0].length).trim()
    if (texto.length >= 40) fila.push({ texto, restantes: QUANTAS[chave] ?? 0 })
  }
}

const index = existsSync(resolve(OUT, 'index.json'))
  ? JSON.parse(readFileSync(resolve(OUT, 'index.json'), 'utf8'))
  : {}

for (const [subjectId, novas] of Object.entries(porMateria)) {
  const arquivo = resolve(OUT, `${subjectId}.json`)
  const atuais = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : []
  const jaLa = new Set(atuais.map((q) => q.id))
  const juntas = [...atuais, ...novas.filter((q) => !jaLa.has(q.id))]
  writeFileSync(arquivo, JSON.stringify(juntas))
  index[subjectId] = juntas.length
  console.log(
    `  ${subjectId.padEnd(4)} +${String(juntas.length - atuais.length).padStart(2)} FGV 2025.2 → ${juntas.length} no total`,
  )
}

writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2))

const aproveitadas = Object.values(porMateria).reduce((a, l) => a + l.length, 0)
console.log(`\n  ${aproveitadas} questões aproveitadas de 60`)
console.log(`  ${comImagem} descartadas: o enunciado depende de figura`)
console.log(`  ${ilegiveis} descartadas: sem as cinco alternativas em texto`)
if (semGabarito) console.log(`  ${semGabarito} sem gabarito`)
console.log(`  banco final: ${Object.values(index).reduce((a, b) => a + b, 0)} questões`)
