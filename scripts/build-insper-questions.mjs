/**
 * Soma questões do Insper ao banco, lendo a objetiva do Processo Seletivo.
 *
 *   node scripts/build-insper-questions.mjs
 *
 * O Insper é o alvo nº 1 do Fernando e era o único vestibular da lista sem
 * nenhuma questão no banco — não existe conjunto aberto como o BLUEX da Fuvest.
 * O que destravou foi a prova oficial publicada em PDF **com camada de texto**,
 * o caso fácil: nada de transcrever à mão como foi preciso na FGV 2025.1.
 *
 * Duas coisas tornam esta prova a mais limpa das três:
 *
 * 1. **As questões são marcadas por "QUESTÃO 01"**, não por número solto. Isso
 *    dispensa a varredura sequencial que a FGV e a Fuvest exigem — lá, dígito de
 *    fórmula no meio do enunciado vira questão fantasma.
 * 2. **O gabarito é uma tabela de 60 pares** número/letra, sem versões nem
 *    questão anulada.
 *
 * O texto vem de `data/provas/`, versionado para que a leitura seja reproduzível
 * sem o PDF — mesma política dos planos de aula e das provas da FGV.
 *
 * ## Como o texto foi extraído
 *
 * A prova tem **duas colunas**, e é o detalhe que decide tudo. Extrair a página
 * inteira de uma vez embaralha as colunas: o enunciado de uma questão vai parar
 * no corpo de outra, e 18 das 60 saem sem enunciado nenhum. A saída é cortar
 * cada página ao meio antes de extrair, coluna por coluna (A4 tem 595 pt de
 * largura, então o corte fica em 298):
 *
 *     for p in $(seq 2 20); do
 *       pdftotext -layout -f $p -l $p -x 0   -y 0 -W 298 -H 842 objetiva.pdf -
 *       pdftotext -layout -f $p -l $p -x 298 -y 0 -W 298 -H 842 objetiva.pdf -
 *     done > insper-2026-2-objetiva.txt
 *
 * Com o corte, as 60 questões saem na ordem certa e todas com as cinco
 * alternativas. A página 1 é capa e fica de fora.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'src', 'data', 'questions')

/**
 * As edições da prova, com as faixas de matéria de cada uma.
 *
 * Não há título de seção no caderno, então a divisão foi conferida questão a
 * questão, edição por edição. Português, Matemática, Química e Física caem
 * sempre nas mesmas posições; o que se mexe é a fronteira entre Humanas e
 * Biologia — em 2026.1 a Biologia começa na 46, em 2026.2 na 47. Por isso a
 * faixa é declarada por edição em vez de valer uma só para todas.
 *
 * Note que **não há inglês** na objetiva do Insper, ao contrário da FGV, e que
 * a redação é caderno separado.
 */
const EDICOES = [
  {
    id: '2026-2',
    ano: 2026,
    rotulo: 'Insper 2026.2 — Processo Seletivo do 2º semestre',
    prova: 'insper-2026-2-objetiva.txt',
    gabarito: 'insper-2026-2-gabarito.txt',
    faixas: [
      { ate: 15, subjectId: 'por' },
      { ate: 30, subjectId: 'mat' },
      { ate: 46, subjectId: null }, // humanas: decidido por vocabulário
      { ate: 50, subjectId: 'bio' },
      { ate: 55, subjectId: 'qui' },
      { ate: 60, subjectId: 'fis' },
    ],
  },
  {
    id: '2026-1',
    ano: 2026,
    rotulo: 'Insper 2026.1 — Processo Seletivo do 1º semestre',
    prova: 'insper-2026-1-objetiva.txt',
    gabarito: 'insper-2026-1-gabarito.txt',
    faixas: [
      { ate: 15, subjectId: 'por' },
      { ate: 30, subjectId: 'mat' },
      { ate: 45, subjectId: null },
      { ate: 50, subjectId: 'bio' },
      { ate: 55, subjectId: 'qui' },
      { ate: 60, subjectId: 'fis' },
    ],
  },
]

/**
 * O bloco de humanas mistura História, Geografia, Sociologia e Filosofia sem
 * dizer qual é qual — mesma situação da FGV. História vem primeiro porque o
 * placar empata com frequência e, no empate, quem é testado antes leva.
 */
const HUMANAS = {
  his: ['século', 'guerra', 'revolução', 'império', 'colon', 'ditadura', 'república', 'idade média', 'pré-história', 'renascimento', 'escravidão', 'escravizad', 'arquiduque', 'nomadismo', 'sedentarismo'],
  geo: ['clima', 'relevo', 'população', 'urban', 'território', 'migra', 'agrícola', 'bioma', 'petróleo', 'energia', 'fronteira', 'mapa', 'cartogr', 'desmatamento', 'hídric', 'abastecimento', 'planície', 'ecossistema', 'ecótono'],
  soc: ['sociedade', 'social', 'classe', 'sindicat', 'cultura', 'desigualdade', 'cidadania', 'democracia', 'digital', 'redes sociais', 'consumo'],
  fil: ['filosof', 'ética', 'moral', 'kant', 'platão', 'aristóteles', 'conhecimento', 'razão', 'existência'],
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

function materiaDe(faixas, numero, texto) {
  const faixa = faixas.find((f) => numero <= f.ate)
  if (!faixa) return null
  return faixa.subjectId ?? materiaDeHumanas(texto)
}

/** Lê a tabela do gabarito: 60 pares "1 - C". */
function lerGabarito(texto) {
  const respostas = {}
  for (const m of texto.matchAll(/(\d{1,2})\s*-\s*([A-E])\b/g)) {
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
  if (alternatives.some((a) => a.text.length === 0)) return null
  return { statement: corpo.slice(0, pos[0]).trim(), alternatives }
}

/**
 * Junta a palavra partida por hífen no fim da linha.
 *
 * A prova é justificada em coluna estreita, então quebra muito: "Alcân-\ntara",
 * "uni-\nversidade". Sem juntar, a busca por palavra-chave que decide a matéria
 * do bloco de humanas erra, e o enunciado fica feio na tela.
 */
function juntarHifens(texto) {
  return texto.replace(/([a-zà-ú])[-­]\s*\n\s*([a-zà-ú])/g, '$1$2')
}

/**
 * Tira a mobília de página: o carimbo de confidencialidade, o código do caderno
 * e o número da página.
 *
 * Sem isso tudo vai parar dentro da alternativa (E), que é a última e não tem
 * nada depois dela para marcar onde termina — 22 das 41 questões saíam com
 * "Confidencial até o momento da aplicação" colado na resposta.
 */
function tirarMobilia(texto) {
  return texto
    .replace(/Confidencial até o momento da aplicação\.?/g, '\n')
    .replace(/INSP\d{4}\s*\|\s*\d{3}-PrObjetiva/g, '\n')
    // O número da página fica sozinho na linha depois que o resto sai.
    .replace(/^[ \t]*\d{1,2}[ \t]*$/gm, '')
}

/**
 * Textos de apoio compartilhados por várias questões.
 *
 * Vêm sempre antes do bloco delas e anunciam a faixa: "para responder às
 * questões de 04 a 08". Recortamos do fim do anúncio até o primeiro "QUESTÃO"
 * seguinte, e o trecho vira `context` de toda a faixa — sem ele, as questões de
 * interpretação ficam impossíveis de responder.
 */
function lerPassagens(texto) {
  const passagens = new Map()
  /**
   * O anúncio é a frase que abre a faixa — "Leia a tirinha da cartunista
   * Laerte […] para responder às questões de 09 a 10". Guardamos separado da
   * passagem porque é ali, e não no corpo do texto literário, que a prova avisa
   * se o apoio é imagem. Cortamos na linha em branco anterior para não arrastar
   * as alternativas da questão de cima.
   */
  const anuncios = new Map()
  /** Onde cada anúncio começa: é ali que o corpo da questão anterior termina. */
  const inicios = []
  /**
   * A prova usa duas gramáticas para anunciar a faixa, e as duas precisam ser
   * cobertas: "questões de 04 a 08" quando são três ou mais, e "questões 09 e
   * 10" quando são só duas. Ficar com a primeira deixava a tirinha da Laerte
   * grudada na alternativa (E) da questão 8.
   *
   * `\s+` em vez de espaço em todo lugar porque a coluna é estreita e o anúncio
   * quebra onde calhar — "para responder às questões de⏎11 a 15" custou o poema
   * inteiro do Manuel Bandeira, que sustenta cinco questões.
   *
   * E `i` porque a frase aparece nas duas ordens, e a inicial muda com ela:
   * "Leia o conto […], para responder às questões de 11 a 14" numa edição,
   * "Para responder às questões de 03 a 06, leia o soneto […]" na outra. Sem
   * isso, o soneto do Raul de Leoni e a tirinha do Adão Iturrusgarai passavam
   * despercebidos na prova de 2026.1.
   */
  const re =
    /para\s+responder\s+[àa]s\s+quest[õo]es\s+(?:de\s+(\d{1,2})\s+a\s+(\d{1,2})|(\d{1,2})\s+e\s+(\d{1,2}))/gi
  for (const m of texto.matchAll(re)) {
    const [de, ate] = m[1] != null ? [m[1], m[2]] : [m[3], m[4]]
    const depois = m.index + m[0].length

    /**
     * O anúncio vai até o fim da frase, não até o fim do trecho casado. Nas
     * duas ordens isso dá o mesmo resultado certo: quando a instrução vem
     * depois ("…, examine a tirinha do Adão Iturrusgarai."), ela entra no
     * anúncio e o filtro de imagem a enxerga; quando vem antes, o ponto está
     * logo ali e nada muda.
     */
    const ponto = texto.indexOf('.', depois)
    const fimAnuncio = ponto >= 0 && ponto - depois <= 200 ? ponto + 1 : depois

    const fim = texto.indexOf('QUESTÃO', fimAnuncio)
    if (fim < 0) continue
    const corpo = texto.slice(fimAnuncio, fim).trim()

    const antes = texto.slice(0, m.index)
    const abertura = antes.lastIndexOf('\n\n') + 1
    inicios.push(abertura)
    const anuncio = texto.slice(abertura, fimAnuncio)

    for (let n = Number(de); n <= Number(ate); n++) {
      anuncios.set(n, anuncio)
      if (corpo.length >= 40) passagens.set(n, corpo)
    }
  }
  return { passagens, anuncios, inicios }
}

/**
 * A questão depende de uma imagem que não temos?
 *
 * Sem a figura o enunciado fica sem resposta possível, então essas ficam de
 * fora — mesmo critério já aplicado no ENEM, no BLUEX e na FGV.
 *
 * Procurar as palavras soltas não funciona, e o custo do erro é alto nos dois
 * sentidos: manter uma questão sem a figura entrega ao Fernando um exercício
 * impossível, e descartar demais joga fora questão boa. Quatro armadilhas
 * apareceram nesta prova:
 *
 * - **"Mapa" é o título** do texto do Manuel Jorge Marmelo, e a crônica inteira
 *   fala de mapas por metáfora. Derrubava as três questões de interpretação.
 * - **"uma das figuras militares mais poderosas"** — figura como pessoa.
 * - **"reconfiguração das políticas nacionais"** contém "figura" no meio da
 *   palavra. Daí a fronteira de palavra.
 * - **"O gráfico da função f intersecta o eixo y no ponto A(0, 2)"** descreve o
 *   gráfico por escrito; a questão se resolve sem ver nada.
 *
 * O que separa os casos é o **verbo**: figura que *mostra*, gráfico que
 * *relaciona*, mapa que *demonstra*. Ou o "conforme", que só existe para
 * apontar para a página. Tirinha e quadrinho não precisam de verbo — num
 * caderno de prova nunca são outra coisa.
 */
const SEMPRE_IMAGEM = /\b(tirinhas?|quadrinhos?|charge|fotografias?|ilustraç(ão|ões)|infográfico)\b/i

const SUBSTANTIVO = '(?:figuras?|gráficos?|mapas?|imagens?|imagem|esquemas?|diagramas?|tabelas?)'
const VERBO_QUE_APRESENTA =
  '(?:mostra|apresenta|representa|relaciona|indica|evidencia|demonstra|ilustra|exibe|traz|reproduz|registra)'

const REFERENCIA_A_IMAGEM = new RegExp(
  `conforme[^.]{0,40}\\b${SUBSTANTIVO}\\b|\\b${SUBSTANTIVO}\\b[^.]{0,40}\\b${VERBO_QUE_APRESENTA}`,
  'i',
)

function dependeDeImagem(texto) {
  return SEMPRE_IMAGEM.test(texto) || REFERENCIA_A_IMAGEM.test(texto)
}

/** Lê uma edição inteira e devolve as questões aproveitáveis. */
function lerEdicao(edicao) {
  const bruto = tirarMobilia(
    juntarHifens(readFileSync(resolve(ROOT, 'data', 'provas', edicao.prova), 'utf8')),
  )
  const gabarito = lerGabarito(readFileSync(resolve(ROOT, 'data', 'provas', edicao.gabarito), 'utf8'))
  const { passagens, anuncios, inicios } = lerPassagens(bruto)

  /**
   * Onde cada questão começa e termina.
   *
   * Achar o marcador basta — não é preciso a varredura sequencial que a FGV
   * exige, porque aqui o número vem sempre colado ao "QUESTÃO" e a ordem no
   * texto é a ordem da prova. Guardamos duas posições: onde o enunciado começa
   * (depois do marcador) e onde o marcador em si começa. As duas são precisas —
   * parar no início do enunciado seguinte deixaria o texto "QUESTÃO 03" grudado
   * na alternativa (E) da questão 2.
   */
  const marcadores = [...bruto.matchAll(/QUEST[ÃA]O\s+(\d{2})/g)].map((m) => ({
    numero: Number(m[1]),
    inicio: m.index + m[0].length,
    marca: m.index,
  }))

  /**
   * O fim não é simplesmente o marcador seguinte. Quando vem um texto de apoio
   * no meio, ele fica entre uma questão e outra e cai inteiro dentro da
   * alternativa (E) — que é a última e não tem nada depois para limitá-la. Foi
   * assim que a alternativa (E) da questão 3 saiu com 2.883 caracteres,
   * carregando o artigo das questões 4 a 8. Então o fim é o que vier primeiro:
   * o próximo marcador ou a abertura do próximo texto de apoio.
   */
  const fimDe = (i) => {
    const proximo = marcadores[i + 1]?.marca ?? bruto.length
    const anuncio = inicios.find((p) => p > marcadores[i].inicio)
    return anuncio != null ? Math.min(proximo, anuncio) : proximo
  }

  const questoes = []
  let semGabarito = 0
  let comImagem = 0
  let alternativaEmImagem = 0

  for (let i = 0; i < marcadores.length; i++) {
    const numero = marcadores[i].numero
    const corpo = bruto.slice(marcadores[i].inicio, fimDe(i)).replace(/\s+/g, ' ').trim()

    /**
     * Alternativa vazia quer dizer que as opções da questão são desenho — em
     * Matemática, fórmula ou gráfico entre `(A)` e `(B)`. Não é falha de
     * leitura: não há texto nenhum ali, e a questão é tão inaproveitável quanto
     * as que dependem de figura no enunciado.
     */
    const recorte = recortarAlternativas(corpo)
    if (!recorte || recorte.statement.length < 20) {
      alternativaEmImagem += 1
      continue
    }

    const correct = gabarito[numero]
    if (!correct) {
      semGabarito += 1
      continue
    }

    const context = passagens.get(numero)?.replace(/\s+/g, ' ').trim() ?? null

    /**
     * A referência à imagem é procurada no enunciado e no anúncio da faixa —
     * nunca no corpo da passagem. O texto "Mapa", do Manuel Jorge Marmelo, fala
     * de mapas do começo ao fim por metáfora, e olhar ali derrubaria as três
     * questões de interpretação que ele sustenta.
     */
    if (dependeDeImagem(`${anuncios.get(numero) ?? ''} ${recorte.statement}`)) {
      comImagem += 1
      continue
    }

    const subjectId = materiaDe(edicao.faixas, numero, `${context ?? ''} ${recorte.statement}`)
    if (!subjectId) continue

    questoes.push({
      id: `insper-${edicao.id}-${numero}`,
      exam: 'INSPER',
      year: edicao.ano,
      number: numero,
      subjectId,
      context,
      statement: recorte.statement,
      alternatives: recorte.alternatives,
      correct,
      // Fase única de objetiva; a redação é caderno separado.
      phase: 1,
    })
  }

  return { questoes, semGabarito, comImagem, alternativaEmImagem }
}

const porMateria = {}

for (const edicao of EDICOES) {
  const { questoes, semGabarito, comImagem, alternativaEmImagem } = lerEdicao(edicao)
  console.log(edicao.rotulo)
  console.log(`  ${questoes.length} questões aproveitadas de 60`)
  console.log(`  ${comImagem} descartadas: o enunciado depende de figura`)
  console.log(`  ${alternativaEmImagem} descartadas: as alternativas são imagem`)
  if (semGabarito) console.log(`  ${semGabarito} sem gabarito`)
  console.log()
  for (const q of questoes) (porMateria[q.subjectId] ??= []).push(q)
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
    `  ${subjectId.padEnd(4)} +${String(juntas.length - atuais.length).padStart(2)} Insper → ${juntas.length} no total`,
  )
}

writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 2))
console.log(`\n  banco final: ${Object.values(index).reduce((a, b) => a + b, 0)} questões`)
