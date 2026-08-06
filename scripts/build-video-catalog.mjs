/**
 * Gera o catálogo de videoaulas com links que existem de verdade.
 *
 *   node scripts/build-video-catalog.mjs           # regenera o catálogo
 *   node scripts/build-video-catalog.mjs --check   # só confere o que já existe
 *
 * ## Por que este script existe
 *
 * O catálogo anterior era escrito à mão e **72 dos 73 vídeos não existiam**. Os
 * títulos e os canais eram plausíveis — "LOGARITMO EM 15 MINUTOS", do Dicasdemat
 * Sandro Curió, é um vídeo real —, mas os identificadores de 11 caracteres eram
 * inventados. No app isso aparecia como "vídeo indisponível", que é exatamente o
 * oposto do que a funcionalidade promete: eliminar o tempo gasto procurando
 * vídeo.
 *
 * Link de vídeo não é coisa que se escreva de cabeça. Ou se busca e se confere,
 * ou não se põe no produto.
 *
 * ## Como funciona
 *
 * 1. Busca no YouTube pelo termo de cada tópico.
 * 2. Extrai os identificadores da página de resultados.
 * 3. **Confere cada um no oembed do YouTube**, que devolve o título e o canal
 *    reais — e 404 para vídeo que não existe ou foi removido. É endpoint
 *    documentado e estável, ao contrário do JSON interno da página de busca,
 *    que muda de formato sem aviso.
 * 4. Pontua os candidatos e escolhe o melhor.
 *
 * O resultado é gravado em `src/data/videoCatalog.ts` e versionado. Em tempo de
 * execução o app não faz nenhuma chamada de rede para saber qual vídeo abrir —
 * mesma política do banco de questões.
 *
 * ## Manutenção
 *
 * Vídeo sai do ar. Rode com `--check` de tempos em tempos: ele lista o que
 * morreu sem alterar nada. Rodar sem `--check` regenera tudo.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAIDA = resolve(ROOT, 'src', 'data', 'videoCatalog.ts')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

/**
 * Canais de preparação para vestibular que valem preferência.
 *
 * Não é lista de bloqueio: um canal fora dela ainda entra se for o melhor
 * resultado. Serve para desempatar a favor de quem tem aula estruturada, contra
 * corte de live e vídeo de trinta segundos.
 */
const CANAIS_PREFERIDOS = [
  'ferretto', 'equaciona', 'dicasdemat', 'matemática sem enrolação',
  'física total', 'professor boaro', 'marcelo boaro',
  'paulo valim', 'química em ação', 'professor rafael',
  'samuel cunha', 'biologia total', 'paulo jubilut',
  'débora aladim', 'debora aladim', 'história em 10', 'professor pedro rafael',
  'meu curso de geografia', 'referência geografia',
  'professora pamba', 'redação nota 1000', 'brasil escola', 'me salva',
  'curso enem gratuito', 'stoodi', 'descomplica', 'aula de',
]

/**
 * Um item do catálogo.
 *
 * `topicKey` é o que casa com o título da aula do plano da escola — é por isso
 * que são termos curtos e em minúsculas. `busca` é o que vai para o YouTube, e
 * pode ser mais específico que a chave.
 */
const T = (topicKey, subjectId, kind, busca) => ({ topicKey, subjectId, kind, busca })

const TOPICOS = [
  // ── Matemática ──────────────────────────────────────
  T('razão e proporção', 'mat', 'completo', 'razão e proporção aula completa vestibular'),
  T('porcentagem', 'mat', 'completo', 'porcentagem aula completa vestibular'),
  T('função', 'mat', 'completo', 'função do primeiro e segundo grau aula completa vestibular'),
  T('logaritmo', 'mat', 'resumo', 'logaritmo em 15 minutos resumo'),
  T('logaritmo', 'mat', 'completo', 'logaritmo aula completa vestibular'),
  T('progressão', 'mat', 'completo', 'progressão aritmética e geométrica aula completa'),
  T('geometria plana', 'mat', 'completo', 'geometria plana áreas aula completa vestibular'),
  T('geometria espacial', 'mat', 'completo', 'geometria espacial volumes aula completa vestibular'),
  T('trigonometria', 'mat', 'completo', 'trigonometria triângulo retângulo aula completa'),
  T('análise combinatória', 'mat', 'completo', 'análise combinatória aula completa vestibular'),
  T('probabilidade', 'mat', 'completo', 'probabilidade aula completa vestibular'),
  T('prisma', 'mat', 'completo', 'prismas e paralelepípedos aula completa'),
  T('matriz', 'mat', 'completo', 'matrizes aula completa vestibular'),
  T('polinômio', 'mat', 'completo', 'polinômios aula completa vestibular'),
  T('estatística', 'mat', 'completo', 'estatística média moda mediana aula completa'),

  // ── Física ──────────────────────────────────────────
  T('cinemática', 'fis', 'completo', 'cinemática MRU MRUV aula completa vestibular'),
  T('movimento uniforme', 'fis', 'resumo', 'movimento uniforme resumo vestibular'),
  T('leis de newton', 'fis', 'completo', 'leis de newton aula completa vestibular'),
  T('trabalho', 'fis', 'completo', 'trabalho e energia física aula completa'),
  T('energia', 'fis', 'completo', 'energia mecânica conservação aula completa'),
  T('vetores', 'fis', 'completo', 'vetores física introdução aula completa'),
  T('lançamento', 'fis', 'completo', 'lançamento oblíquo aula completa vestibular'),
  T('atrito', 'fis', 'resumo', 'força de atrito resumo física'),
  T('óptica', 'fis', 'completo', 'óptica geométrica aula completa vestibular'),
  T('espelho', 'fis', 'completo', 'espelhos esféricos aula completa física'),
  T('refração', 'fis', 'completo', 'refração lei de snell aula completa'),
  T('lente', 'fis', 'completo', 'lentes esféricas aula completa física'),
  T('termologia', 'fis', 'completo', 'termologia calorimetria aula completa'),
  T('calorimetria', 'fis', 'completo', 'calorimetria aula completa física'),
  T('dilatação', 'fis', 'resumo', 'dilatação térmica resumo física'),
  T('gases', 'fis', 'completo', 'gases ideais transformações aula completa'),
  T('termodinâmica', 'fis', 'completo', 'primeira lei da termodinâmica aula completa'),
  T('colisões', 'fis', 'completo', 'quantidade de movimento colisões aula completa'),
  T('eletrostática', 'fis', 'completo', 'eletrostática lei de coulomb aula completa'),
  T('circuito', 'fis', 'completo', 'circuitos elétricos aula completa vestibular'),
  T('ondulatória', 'fis', 'completo', 'ondulatória ondas aula completa vestibular'),

  // ── Química ─────────────────────────────────────────
  T('substância', 'qui', 'resumo', 'substâncias e misturas resumo química'),
  T('tabela periódica', 'qui', 'completo', 'tabela periódica aula completa vestibular'),
  T('ligação', 'qui', 'completo', 'ligações químicas aula completa vestibular'),
  T('estequiometria', 'qui', 'completo', 'estequiometria aula completa vestibular'),
  T('soluções', 'qui', 'completo', 'soluções concentração aula completa química'),
  T('termoquímica', 'qui', 'completo', 'termoquímica aula completa vestibular'),
  T('equilíbrio', 'qui', 'completo', 'equilíbrio químico aula completa vestibular'),
  T('eletroquímica', 'qui', 'completo', 'eletroquímica pilhas aula completa'),
  T('orgânica', 'qui', 'completo', 'química orgânica funções orgânicas aula completa'),
  T('cinética', 'qui', 'completo', 'cinética química aula completa vestibular'),
  T('ácidos e bases', 'qui', 'completo', 'ácidos e bases química aula completa'),
  T('atomística', 'qui', 'completo', 'atomística modelos atômicos aula completa'),

  // ── Biologia ────────────────────────────────────────
  T('citologia', 'bio1', 'completo', 'citologia organelas aula completa vestibular'),
  T('respiração celular', 'bio1', 'completo', 'respiração celular aula completa vestibular'),
  T('fermentação', 'bio1', 'resumo', 'fermentação resumo biologia vestibular'),
  T('fotossíntese', 'bio1', 'completo', 'fotossíntese aula completa vestibular'),
  T('ácidos nucleicos', 'bio1', 'completo', 'DNA RNA código genético aula completa'),
  T('protozoários', 'bio1', 'resumo', 'protozoários protozooses resumo biologia'),
  T('divisão celular', 'bio1', 'completo', 'mitose e meiose aula completa vestibular'),
  T('genética', 'bio2', 'completo', 'genética leis de mendel aula completa'),
  T('evolução', 'bio2', 'completo', 'evolução biológica aula completa vestibular'),
  T('ecologia', 'bio2', 'completo', 'ecologia cadeia alimentar ciclos aula completa'),
  T('botânica', 'bio2', 'completo', 'botânica aula completa vestibular'),

  // ── História ────────────────────────────────────────
  T('grécia', 'his', 'completo', 'grécia antiga aula completa vestibular'),
  T('roma', 'his', 'completo', 'roma antiga aula completa vestibular'),
  T('idade média', 'his', 'completo', 'idade média feudalismo aula completa vestibular'),
  T('renascimento', 'his', 'resumo', 'renascimento cultural resumo vestibular'),
  T('reforma', 'his', 'completo', 'reforma protestante aula completa vestibular'),
  T('absolutismo', 'his', 'completo', 'absolutismo aula completa vestibular'),
  T('revolução industrial', 'his', 'completo', 'revolução industrial aula completa vestibular'),
  T('iluminismo', 'his', 'completo', 'iluminismo aula completa vestibular'),
  T('revolução francesa', 'his', 'completo', 'revolução francesa aula completa vestibular'),
  T('brasil colonial', 'his', 'completo', 'brasil colonial aula completa vestibular'),
  T('independência', 'his', 'completo', 'independência do brasil aula completa vestibular'),
  T('mineração', 'his', 'resumo', 'mineração século XVIII brasil resumo'),
  T('primeira guerra', 'his', 'completo', 'primeira guerra mundial aula completa vestibular'),
  T('segunda guerra', 'his', 'completo', 'segunda guerra mundial aula completa vestibular'),
  T('era vargas', 'his', 'completo', 'era vargas aula completa vestibular'),
  T('ditadura militar', 'his', 'completo', 'ditadura militar brasil aula completa vestibular'),
  T('guerra fria', 'his', 'completo', 'guerra fria aula completa vestibular'),
  T('república velha', 'his', 'completo', 'república velha aula completa vestibular'),

  // ── Geografia ───────────────────────────────────────
  T('cartografia', 'geo', 'completo', 'cartografia aula completa vestibular'),
  T('fuso horário', 'geo', 'resumo', 'fusos horários resumo geografia'),
  T('clima', 'geo', 'completo', 'climatologia climas aula completa vestibular'),
  T('relevo', 'geo', 'completo', 'relevo agentes formadores aula completa geografia'),
  T('domínios morfoclimáticos', 'geo', 'completo', 'domínios morfoclimáticos aula completa'),
  T('globalização', 'geo', 'completo', 'globalização aula completa vestibular'),
  T('matriz energética', 'geo', 'resumo', 'matriz energética brasileira resumo geografia'),
  T('hidrografia', 'geo', 'completo', 'hidrografia do brasil aula completa'),
  T('biogeografia', 'geo', 'completo', 'biomas brasileiros aula completa vestibular'),
  T('urbanização', 'geo', 'completo', 'urbanização brasileira aula completa vestibular'),
  T('agricultura', 'geo', 'completo', 'agricultura brasileira aula completa vestibular'),
  T('população', 'geo', 'completo', 'geografia da população demografia aula completa'),
  T('indústria', 'geo', 'completo', 'industrialização brasileira aula completa geografia'),

  // ── Redação e Linguagens ────────────────────────────
  T('dissertação', 'red', 'completo', 'estrutura da redação dissertativa argumentativa aula'),
  T('competências', 'red', 'completo', 'as 5 competências da redação do enem'),
  T('proposta de intervenção', 'red', 'resumo', 'proposta de intervenção redação enem resumo'),
  T('repertório', 'red', 'resumo', 'repertório sociocultural redação enem'),
  T('interpretação', 'efl', 'completo', 'interpretação de texto aula completa vestibular'),
  T('variação linguística', 'efl', 'resumo', 'variação linguística resumo vestibular'),
  T('figuras de linguagem', 'efl', 'completo', 'figuras de linguagem aula completa vestibular'),
  T('sintaxe', 'efl', 'completo', 'análise sintática período composto aula completa'),
  T('crase', 'efl', 'resumo', 'crase resumo vestibular'),
  T('modernismo', 'lit', 'completo', 'modernismo brasileiro primeira fase aula completa'),
  T('romantismo', 'lit', 'completo', 'romantismo literatura brasileira aula completa'),
  T('realismo', 'lit', 'completo', 'realismo naturalismo literatura aula completa'),
  T('barroco', 'lit', 'completo', 'barroco e arcadismo literatura aula completa'),
]

const dorme = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Identificadores de vídeo na página de resultados, na ordem em que aparecem.
 *
 * Com nova tentativa e espera crescente: em rajada, o YouTube passa a responder
 * com uma cadeia de redirecionamentos de consentimento que estoura o limite do
 * `fetch`. Não é erro de programação, é o servidor pedindo calma — e a execução
 * inteira morria no meio por causa disso.
 */
async function buscar(termo) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(termo)}`
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR', Cookie: 'CONSENT=YES+1' },
        redirect: 'follow',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      // O JSON da página vem com aspas escapadas, e o formato muda sem aviso.
      // Por isso pegamos só o identificador — o resto vem do oembed, estável.
      const ids = [...html.matchAll(/\\?"videoId\\?":\\?"([A-Za-z0-9_-]{11})\\?"/g)].map((m) => m[1])
      if (ids.length > 0) return [...new Set(ids)]
      throw new Error('sem resultados')
    } catch {
      await dorme(1500 * 2 ** tentativa)
    }
  }
  return []
}

/**
 * Confere um vídeo e devolve título e canal reais.
 *
 * 404 aqui é a resposta que importa: quer dizer que o vídeo não existe, foi
 * removido ou está privado. É o teste que faltava no catálogo antigo.
 */
async function conferir(id) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const res = await fetch(url)
      // 404 é resposta definitiva: o vídeo não existe. Não adianta insistir.
      if (res.status === 404 || res.status === 401 || res.status === 403) return null
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      return { id, title: j.title, channel: j.author_name }
    } catch {
      await dorme(800 * 2 ** tentativa)
    }
  }
  return null
}

/** Palavras significativas de um termo, para medir se o título casa. */
function palavras(termo) {
  const STOP = new Set(['aula', 'completa', 'resumo', 'vestibular', 'enem', 'de', 'da', 'do', 'e', 'em', 'para'])
  return termo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 3 && !STOP.has(p))
}

function normalizar(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Escolhe o melhor candidato.
 *
 * A ordem da busca já é um sinal forte, então ela entra como desempate suave.
 * O que pesa mais é o título casar com o assunto — evita pegar corte de live ou
 * vídeo de outro tema que subiu por popularidade.
 */
function escolher(candidatos, topico, jaUsados) {
  const chave = palavras(topico.busca)
  let melhor = null
  let melhorNota = -Infinity

  candidatos.forEach((c, posicao) => {
    if (jaUsados.has(c.id)) return
    const titulo = normalizar(c.title)
    const canal = normalizar(c.channel)

    let nota = 0
    nota += chave.filter((p) => titulo.includes(p)).length * 3
    if (CANAIS_PREFERIDOS.some((p) => canal.includes(normalizar(p)))) nota += 4
    // A relevância da busca vale, mas não manda.
    nota += Math.max(0, 6 - posicao) * 0.5
    // "Aula 1 de 14" é bom ponto de entrada; parte 7 de 14, não.
    const parte = titulo.match(/parte\s*(\d+)|aula\s*(\d+)\s*de/)
    if (parte) {
      const n = Number(parte[1] ?? parte[2])
      if (n > 2) nota -= 3
    }
    if (/\bshorts?\b/.test(titulo)) nota -= 5
    /**
     * Título cheio de hashtag é quase sempre Short vertical de um minuto, que
     * não serve para preparar aula. E corte de live entrega o assunto pela
     * metade, sem a montagem de uma aula.
     */
    if ((titulo.match(/#/g) ?? []).length >= 3) nota -= 6
    if (/\bcortes?\b|ao vivo/.test(titulo)) nota -= 4

    if (nota > melhorNota) {
      melhorNota = nota
      melhor = c
    }
  })

  return melhor
}

/** Estima a duração pelo tipo — o oembed não informa, e o número é indicativo. */
const MINUTOS = { resumo: 18, completo: 35, revisao: 25 }

function gerarArquivo(itens) {
  const linhas = itens.map(
    (i) =>
      `  V(${JSON.stringify(i.topicKey)}, ${JSON.stringify(i.subjectId)}, ${JSON.stringify(i.kind)}, ` +
      `${JSON.stringify(i.title)}, ${JSON.stringify(i.channel)}, ${JSON.stringify(i.id)}, ${i.minutes}),`,
  )

  return `import type { VideoRef } from '@/types/curriculum'

/**
 * Catálogo curado de videoaulas.
 *
 * **Este arquivo é gerado.** Não edite à mão — rode
 * \`node scripts/build-video-catalog.mjs\`. Cada link aqui foi conferido no
 * oembed do YouTube no momento da geração: o vídeo existe, e o título e o canal
 * são os que o YouTube devolveu, não os que alguém supôs.
 *
 * A versão anterior deste arquivo era escrita à mão e 72 dos 73 vídeos não
 * existiam — títulos plausíveis com identificadores inventados, que no app
 * viravam "vídeo indisponível". Daí a regra: link de vídeo se busca e se
 * confere, não se escreve de cabeça.
 *
 * Não há busca em tempo de execução: a YouTube Data API exige chave, e um PWA
 * estático não tem onde escondê-la. A curadoria acontece na geração, e o app
 * funciona offline para saber qual vídeo abrir.
 *
 * \`topicKey\` casa por palavra-chave com o título da aula do plano. Quando não
 * há vídeo cadastrado, o app oferece uma busca pronta no YouTube.
 *
 * Gerado em ${new Date().toISOString().slice(0, 10)} · ${itens.length} vídeos conferidos.
 */

const V = (
  topicKey: string,
  subjectId: string,
  kind: VideoRef['kind'],
  title: string,
  channel: string,
  id: string,
  minutes: number,
): VideoRef => ({
  id: \`\${topicKey}-\${kind}\`,
  topicKey,
  subjectId,
  kind,
  title,
  channel,
  url: \`https://www.youtube.com/watch?v=\${id}\`,
  minutes,
})

export const VIDEO_CATALOG: VideoRef[] = [
${linhas.join('\n')}
]

/**
 * Busca vídeos por casamento de palavra-chave com o título da aula.
 * Devolve no máximo um de cada tipo, na ordem resumo → completo → revisão.
 */
export function findVideos(
  title: string,
  subjectId: string,
  extra: VideoRef[] = [],
): VideoRef[] {
  const needle = title.toLowerCase()
  const pool = [...VIDEO_CATALOG, ...extra]

  const matches = pool.filter(
    (v) =>
      (v.subjectId === subjectId || subjectId.startsWith(v.subjectId)) &&
      needle.includes(v.topicKey),
  )

  const order: Array<VideoRef['kind']> = ['resumo', 'completo', 'revisao']
  const out: VideoRef[] = []
  for (const kind of order) {
    const found = matches.find((v) => v.kind === kind)
    if (found) out.push(found)
  }
  // Vídeos adicionados pelo usuário sempre aparecem, mesmo repetindo o tipo.
  return [...out, ...matches.filter((v) => v.custom && !out.includes(v))]
}

/** Sem vídeo cadastrado, entrega uma busca pronta em vez de deixar vazio. */
export function youtubeSearchUrl(title: string, subjectName: string): string {
  const q = encodeURIComponent(\`\${title} \${subjectName} aula vestibular\`)
  return \`https://www.youtube.com/results?search_query=\${q}\`
}
`
}

// ── Modo conferência ────────────────────────────────────
if (process.argv.includes('--check')) {
  const atual = readFileSync(SAIDA, 'utf8')
  const ids = [...atual.matchAll(/"([A-Za-z0-9_-]{11})",\s*\d+\),/g)].map((m) => m[1])
  const unicos = [...new Set(ids)]
  console.log(`Conferindo ${unicos.length} vídeos do catálogo…\n`)
  let mortos = 0
  for (const id of unicos) {
    const ok = await conferir(id)
    if (!ok) {
      mortos += 1
      console.log(`  fora do ar: ${id}`)
    }
    await dorme(60)
  }
  console.log(`\n${unicos.length - mortos} no ar · ${mortos} fora do ar`)
  if (mortos > 0) console.log('Rode sem --check para regenerar.')
  process.exit(mortos > 0 ? 1 : 0)
}

// ── Geração ─────────────────────────────────────────────
console.log(`Montando o catálogo de videoaulas — ${TOPICOS.length} tópicos\n`)

/**
 * Cache do que já foi resolvido.
 *
 * São mais de mil chamadas de rede por execução, e o YouTube derruba a conexão
 * de vez em quando. Sem cache, uma queda no tópico 80 obriga a refazer os 79
 * anteriores. Fica fora do git — é resultado de rede, não fonte.
 */
const CACHE = resolve(ROOT, '.cache-videos', 'escolhidos.json')
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
mkdirSync(dirname(CACHE), { recursive: true })

const itens = []
const jaUsados = new Set()
let semResultado = 0

for (const topico of TOPICOS) {
  const chaveCache = `${topico.subjectId}|${topico.topicKey}|${topico.kind}`

  if (cache[chaveCache]) {
    const guardado = cache[chaveCache]
    jaUsados.add(guardado.id)
    itens.push({ ...topico, ...guardado, minutes: MINUTOS[topico.kind] ?? 30 })
    console.log(
      `  •  ${topico.subjectId.padEnd(5)} ${topico.topicKey.padEnd(26)} ${guardado.id} · (cache)`,
    )
    continue
  }

  const ids = await buscar(topico.busca)
  const candidatos = []

  // Conferimos os primeiros até juntar candidatos suficientes para escolher.
  for (const id of ids.slice(0, 10)) {
    const v = await conferir(id)
    if (v) candidatos.push(v)
    await dorme(40)
  }

  const escolhido = escolher(candidatos, topico, jaUsados)
  if (!escolhido) {
    semResultado += 1
    console.log(`  — ${topico.subjectId.padEnd(5)} ${topico.topicKey}: nada encontrado`)
    continue
  }

  jaUsados.add(escolhido.id)
  cache[chaveCache] = { title: escolhido.title, channel: escolhido.channel, id: escolhido.id }
  writeFileSync(CACHE, JSON.stringify(cache, null, 1))

  itens.push({
    topicKey: topico.topicKey,
    subjectId: topico.subjectId,
    kind: topico.kind,
    title: escolhido.title,
    channel: escolhido.channel,
    id: escolhido.id,
    minutes: MINUTOS[topico.kind] ?? 30,
  })
  console.log(
    `  ok ${topico.subjectId.padEnd(5)} ${topico.topicKey.padEnd(26)} ${escolhido.id} · ${escolhido.channel.slice(0, 30)}`,
  )
  await dorme(250)
}

writeFileSync(SAIDA, gerarArquivo(itens))

console.log(`\n${itens.length} vídeos conferidos e gravados`)
if (semResultado) console.log(`${semResultado} tópicos ficaram sem vídeo — o app cai na busca pronta`)
console.log(`Arquivo: src/data/videoCatalog.ts`)
