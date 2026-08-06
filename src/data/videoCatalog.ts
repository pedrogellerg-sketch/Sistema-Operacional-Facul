import type { VideoRef } from '@/types/curriculum'

/**
 * Catálogo curado de videoaulas.
 *
 * **Este arquivo é gerado.** Não edite à mão — rode
 * `node scripts/build-video-catalog.mjs`. Cada link aqui foi conferido no
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
 * `topicKey` casa por palavra-chave com o título da aula do plano. Quando não
 * há vídeo cadastrado, o app oferece uma busca pronta no YouTube.
 *
 * Gerado em 2026-08-06 · 103 vídeos conferidos.
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
  id: `${topicKey}-${kind}`,
  topicKey,
  subjectId,
  kind,
  title,
  channel,
  url: `https://www.youtube.com/watch?v=${id}`,
  minutes,
})

export const VIDEO_CATALOG: VideoRef[] = [
  V("razão e proporção", "mat", "completo", "RAZÃO E PROPORÇÃO | FÁCIL e RÁPIDO", "Dicasdemat Sandro Curió", "evXrGaI6SVc", 35),
  V("porcentagem", "mat", "completo", "PORCENTAGEM: Teoria e Exemplos | Matemática Básica - Aula 29", "Professor Ferretto | ENEM e Vestibulares", "CERiIwParX4", 35),
  V("função", "mat", "completo", "Função do Primeiro Grau (Função Afim): Conceitos Iniciais (Aula 1 de 9)", "Professor Ferretto | ENEM e Vestibulares", "hdMFlAv5GkU", 35),
  V("logaritmo", "mat", "resumo", "LOGARITMO EM 15 MINUTOS ", "Dicasdemat Sandro Curió", "hA9HecU1p9g", 18),
  V("logaritmo", "mat", "completo", "Logaritmo: Introdução Parte 1 (Aula 1 de 14)", "Professor Ferretto | ENEM e Vestibulares", "esdFuyG7zGs", 35),
  V("progressão", "mat", "completo", "Progressão Aritmética PA: Introdução (aula 1 de 6)", "Professor Ferretto | ENEM e Vestibulares", "TC2HcZV3mGo", 35),
  V("geometria plana", "mat", "completo", "Geometria Plana: Introdução - Ângulos (Aula 1)", "Professor Ferretto | ENEM e Vestibulares", "0CnUdzmpO8E", 35),
  V("geometria espacial", "mat", "completo", "GEOMETRIA ESPACIAL: TUDO PARA O ENEM E VESTIBULARES | QUER QUE DESENHE", "Descomplica", "zJ0YjUMEfjI", 35),
  V("trigonometria", "mat", "completo", "TRIGONOMETRIA NO TRIÂNGULO RETÂNGULO EM 13 MINUTOS", "Dicasdemat Sandro Curió", "C7NrVLmEYcs", 35),
  V("análise combinatória", "mat", "completo", "ANÁLISE COMBINATÓRIA | PERMUTAÇÃO | ARRANJO | COMBINAÇÃO", "Dicasdemat Sandro Curió", "_8mZOSXCRp8", 35),
  V("probabilidade", "mat", "completo", "PROBABILIDADE | APRENDA EM 13MIN", "Dicasdemat Sandro Curió", "iNCkGogNtKI", 35),
  V("prisma", "mat", "completo", "PRISMAS EM 10 MINUTOS | ÁREA e VOLUME", "Dicasdemat Sandro Curió", "Bz1lw74k4XI", 35),
  V("matriz", "mat", "completo", "🔴MATRIZES: Conceitos Iniciais.", "Equaciona Com Paulo Pereira", "lZ9onrdpusA", 35),
  V("polinômio", "mat", "completo", "POLINÔMIOS INTRODUÇÃO (DEFINIÇÃO, COEFICIENTES E GRAU) (1/12)", "Equaciona Com Paulo Pereira", "RevbMgyMQmg", 35),
  V("estatística", "mat", "completo", "ESTATÍSTICA: MÉDIA, MODA e MEDIANA | RÁPIDO E FÁCIL", "Dicasdemat Sandro Curió", "IgoKxQK5hGQ", 35),
  V("cinemática", "fis", "completo", "MRU + MRUV. DICAS DE CINEMÁTICA. Cortes dos Aulões de Física Enem | Antônio Martins, o Tonho", "Curso Enem Gratuito", "4nbrPfeBbWY", 35),
  V("movimento uniforme", "fis", "resumo", "MOVIMENTO UNIFORME - FÍSICA BÁSICA (FÍSICA do ZERO) - Teoria e Exercícios - AULA 01", "Professor Boaro", "g61dy6E8JNo", 18),
  V("leis de newton", "fis", "completo", "LEIS DE NEWTON | FÍSICA | Mapa Mental | Quer Que Desenhe", "Descomplica", "5AEZCsEAopY", 35),
  V("trabalho", "fis", "completo", "TRABALHO e ENERGIA MECÂNICA - DINÂMICA - (TEORIA + EXERCÍCIOS) -  REVISÃO 5 - AULA 17", "Professor Boaro", "MhaGUBcAy-Y", 35),
  V("energia", "fis", "completo", "Princípio da Conservação da Energia Mecânica", "Maurício Física", "0xv6J0-XDSY", 35),
  V("vetores", "fis", "completo", "FÍSICA: ENTENDA TUDO SOBRE VETORES | QUER QUE DESENHE? | DESCOMPLICA", "Descomplica", "RRgBdqBl6Ig", 35),
  V("lançamento", "fis", "completo", "LANÇAMENTO OBLÍQUO I - CINEMÁTICA - Aula 24 - Prof. Marcelo Boaro", "Professor Boaro", "RJ6viyxIxaE", 35),
  V("atrito", "fis", "resumo", "FORÇAS DE ATRITO | Resumo de Física para o Enem", "Curso Enem Gratuito", "D-wr3G6V8u8", 18),
  V("óptica", "fis", "completo", "ÓPTICA GEOMÉTRICA - CONCEITOS FUNDAMENTAIS - Aula 1 - Prof.  Boaro", "Professor Boaro", "QKPj0f3mN5c", 35),
  V("espelho", "fis", "completo", "Espelhos Esféricos: Formação de Imagem | Aula de Física | LIVE006", "Universo Narrado", "GGU5mR6p5-Q", 35),
  V("refração", "fis", "completo", "REFRAÇÃO DA LUZ E DISPERSÃO LUMINOSA - ÓPTICA - Aula 8 - Prof  Boaro", "Professor Boaro", "gvUfJXHybIY", 35),
  V("lente", "fis", "completo", "LENTES ESFÉRICAS I - TIPOS DE LENTES - ÓPTICA - Aula 13 - Prof.  Boaro", "Professor Boaro", "sJTrdArAeKY", 35),
  V("termologia", "fis", "completo", "TERMOLOGIA - CONCEITOS FUNDAMENTAIS - Aula 1 - Prof.  Boaro", "Professor Boaro", "QUvmXOY2WvI", 35),
  V("calorimetria", "fis", "completo", "Calorimetria | Física | TOP CONTEÚDO ENEM 2023", "Descomplica", "5ewPE5DsdGo", 35),
  V("dilatação", "fis", "resumo", "AULA FÍSICA - DILATAÇÃO TÉRMICA: Definição e Tipos de dilatação - STOODI", "Stoodi", "kGv9wSsRxVU", 18),
  V("gases", "fis", "completo", "TRANSFORMAÇÕES GASOSAS E EQUAÇÃO GERAL DOS GASES - TERMOLOGIA - Aula 12 - Prof  Boaro", "Professor Boaro", "XQ1EJDTNKpI", 35),
  V("termodinâmica", "fis", "completo", "PRIMEIRA LEI DA TERMODINÂMICA #1 - TERMOLOGIA - Aula 16 - Prof. Boaro", "Professor Boaro", "kNzjPoNwU20", 35),
  V("colisões", "fis", "completo", "QUANTIDADE DE MOVIMENTO - DINÂMICA AULA 27 - Prof. Marcelo Boaro", "Professor Boaro", "_iZm9QwTluc", 35),
  V("eletrostática", "fis", "completo", "FORÇA ELÉTRICA (LEI DE COULOMB) - ELETROSTÁTICA - AULA 4 - Prof.  Marcelo Boaro", "Professor Boaro", "ktatkm5Wzmg", 35),
  V("circuito", "fis", "completo", "CIRCUITOS ELÉTRICOS no ENEM - ELETRODINÂMICA (TEORIA + EXERCÍCIOS) - MEGA REVISÃO", "Professor Boaro", "2h9vDmzYmig", 35),
  V("ondulatória", "fis", "completo", "ONDULATÓRIA: principais características das ondas | RESUMO DE FÍSICA PARA O ENEM", "Curso Enem Gratuito", "Rmgqv8ETn6o", 35),
  V("substância", "qui", "resumo", "SUBSTÂNCIAS E MISTURAS | Resumo de Química para o Enem | Felipe Sobis", "Curso Enem Gratuito", "xSuGV-gaEyo", 18),
  V("tabela periódica", "qui", "completo", "Tabela Periódica - Brasil Escola", "Brasil Escola Oficial", "99b6_HneB64", 35),
  V("ligação", "qui", "completo", "Ligações químicas: Aprenda de uma vez por todas!", "Toda Matéria", "FDnxddw0P1g", 35),
  V("estequiometria", "qui", "completo", "ESTEQUIOMETRIA: O QUE CAI NO VESTIBULAR? | QUÍMICA | QUER QUE DESENHE? | DESCOMPLICA", "Descomplica", "VV6_UuhbSxU", 35),
  V("soluções", "qui", "completo", "CONCENTRAÇÃO das SOLUÇÕES | Química para ENEM e Vestibulares | Prof. Paulo Valim", "Química com Prof. Paulo Valim", "yliBypW94j8", 35),
  V("termoquímica", "qui", "completo", "Termoquímica - Brasil Escola", "Brasil Escola Oficial", "5aPH2E9UxhM", 35),
  V("equilíbrio", "qui", "completo", "EQUILÍBRIO QUÍMICO: DEFINIÇÃO, CÁLCULOS E GRÁFICOS | Resumo de Química para o Enem", "Curso Enem Gratuito", "qOiEiYOl3aM", 35),
  V("eletroquímica", "qui", "completo", "COMO FUNCIONAM AS PILHAS E AS BATERIAS (ELETROQUÍMICA) | Resumo de Química Enem. Prof Felipe Sobis", "Curso Enem Gratuito", "Dm03CZ5mpNs", 35),
  V("orgânica", "qui", "completo", "🧑‍🔬 TODAS AS FUNÇÕES ORGÂNICAS DO ENEM: Aula Completa - Química Orgânica Mestres do ENEM", "Umberto Mannarino - Mestres do ENEM", "fxowiXQNP1E", 35),
  V("cinética", "qui", "completo", "QUÍMICA ENEM: CINÉTICA QUÍMICA | QUER QUE DESENHE | MAPA MENTAL", "Descomplica", "tj638Wk3GNg", 35),
  V("ácidos e bases", "qui", "completo", "ÁCIDOS - AULA COMPLETA - Química para quem tem dificuldade", "Diego Fares", "ezy3mlOzO2s", 35),
  V("atomística", "qui", "completo", "MODELOS ATÔMICOS: Dalton, Thomson e Rutherford | QUER QUE DESENHE?", "Descomplica", "lDrKIqubzdw", 35),
  V("citologia", "bio1", "completo", "ORGANELAS CITOPLASMÁTICAS - Resumo | Biologia com Samuel Cunha", "Biologia com Samuel Cunha", "qw0nCGTXEOM", 35),
  V("respiração celular", "bio1", "completo", "RESPIRAÇÃO CELULAR - Aula completa | Biologia com Samuel Cunha", "Biologia com Samuel Cunha", "mZ7dv3UKIGo", 35),
  V("fermentação", "bio1", "resumo", "Respiração Celular e Fermentação - Resumo | Biologia", "Descomplica", "5Iupgov7jY0", 18),
  V("fotossíntese", "bio1", "completo", "FOTOSSÍNTESE - FASE CLARA E ESCURA - AULA COMPLETA | Biologia com Samuel Cunha", "Biologia com Samuel Cunha", "SDNc_5qXa0Q", 35),
  V("ácidos nucleicos", "bio1", "completo", "CÓDIGO GENÉTICO | Biologia com Samuel Cunha", "Biologia com Samuel Cunha", "ittmzF4i5WM", 35),
  V("protozoários", "bio1", "resumo", "DOENÇAS CAUSADAS POR PROTOZOÁRIOS - Protozooses | Biologia com Samuel Cunha", "Biologia com Samuel Cunha", "GiJ44mg5MZw", 18),
  V("divisão celular", "bio1", "completo", "MITOSE E MEIOSE | Divisão Celular | Quer que desenhe", "Descomplica", "p4qTpxtJS4o", 35),
  V("genética", "bio2", "completo", "GENÉTICA: LEIS DE MENDEL, GENES, DNA E CROMOSSOMOS | QUER QUE DESENHE?", "Descomplica", "-Vv3USW7iRU", 35),
  V("evolução", "bio2", "completo", "RESUMO SOBRE EVOLUÇÃO | QUER QUE DESENHE | DESCOMPLICA", "Descomplica", "4WO-A_GaA1o", 35),
  V("ecologia", "bio2", "completo", "ECOLOGIA: CADEIA ALIMENTAR, BIOMAS E RELAÇÕES ECOLÓGICAS | QUER QUE DESENHE?", "Descomplica", "TsclSi3nNsI", 35),
  V("botânica", "bio2", "completo", "REINO VEGETAL - INTRODUÇÃO À BOTÂNICA | Briófitas - Pteridófitas - Gimnospermas e Angiospermas", "Biologia com Samuel Cunha", "EAVhBfwLUhk", 35),
  V("grécia", "his", "completo", "Resumo de História: GRÉCIA ANTIGA (com Vestibular em Cena)", "Débora Aladim", "bpArabQHqA4", 35),
  V("roma", "his", "completo", "ROMA ANTIGA | História | Quer Que Desenhe | Descomplica", "Descomplica", "QNK9uTncolU", 35),
  V("idade média", "his", "completo", "Resumo de História: IDADE MÉDIA (tudo que você precisa saber!) - Débora Aladim", "Débora Aladim", "CTIs_RSPr84", 35),
  V("renascimento", "his", "resumo", "RENASCIMENTO: RESUMO DE HISTÓRIA (Débora Aladim)", "Débora Aladim", "fxqxH5A3Ok8", 18),
  V("reforma", "his", "completo", "RESUMO: REFORMA PROTESTANTE (Luteranismo, Calvinismo, Anglicanismo e Contrarreforma) Débora Aladim", "Débora Aladim", "4eHP0WBvU_4", 35),
  V("absolutismo", "his", "completo", "Aula História - Absolutismo - Definição e Características para o Enem  - STOODI", "Stoodi", "SIfoqzQtGEo", 35),
  V("revolução industrial", "his", "completo", "REVOLUÇÃO INDUSTRIAL: RESUMO PARA VESTIBULAR | HISTÓRIA | QUER QUE DESENHE?", "Descomplica", "Y1S7_OD9Viw", 35),
  V("iluminismo", "his", "completo", "ILUMINISMO 💡 | SÉCULO DAS LUZES | RESUMÃO PARA O ENEM", "Descomplica", "j6TRYUxyxK0", 35),
  V("revolução francesa", "his", "completo", "REVOLUÇÃO FRANCESA: AULA COMPLETA (Débora Aladim)", "Débora Aladim", "ppInSLfkRWo", 35),
  V("brasil colonial", "his", "completo", "Episódio 1 - Período Colonial - História do Brasil", "Focus Concursos", "go6mpPVZZms", 35),
  V("independência", "his", "completo", "QUEM FEZ A INDEPENDÊNCIA DO BRASIL? AULA COMPLETA! (Débora Aladim)", "Débora Aladim", "pvxzaEBLHI4", 35),
  V("mineração", "his", "resumo", "Mineração no Brasil Colônia | Parte 1 - Brasil Escola", "Brasil Escola Oficial", "dV9wTmlitng", 18),
  V("primeira guerra", "his", "completo", "PRIMEIRA GUERRA MUNDIAL: AULA COMPLETA (Débora Aladim)", "Débora Aladim", "Xi8Vj7aDcvg", 35),
  V("segunda guerra", "his", "completo", "COMO FOI A SEGUNDA GUERRA MUNDIAL? | QUER QUE DESENHE? | DESCOMPLICA", "Descomplica", "RedndCHHtYc", 35),
  V("era vargas", "his", "completo", "TUDO QUE VOCÊ PRECISA SABER SOBRE A ERA VARGAS: tá longo, mas vale a pena! (Débora Aladim)", "Débora Aladim", "jQU6Ojetq8M", 35),
  V("ditadura militar", "his", "completo", "A DITADURA MILITAR NO BRASIL || VOGALIZANDO A HISTÓRIA", "Vogalizando a História", "Ux64F6jfSuo", 35),
  V("guerra fria", "his", "completo", "Resumo de História: GUERRA FRIA (Débora Aladim)", "Débora Aladim", "eQ08AS5ZHQQ", 35),
  V("república velha", "his", "completo", "REPÚBLICA VELHA | QUER QUE DESENHE | DESCOMPLICA", "Descomplica", "Vw4HGHDWMjs", 35),
  V("cartografia", "geo", "completo", "CARTOGRAFIA | QUER QUE DESENHE | DESCOMPLICA", "Descomplica", "tR_rXa4BdpE", 35),
  V("fuso horário", "geo", "resumo", "FUSOS HORÁRIOS | Resumo de Geografia para o Enem", "Curso Enem Gratuito", "KjGuSTxKm1w", 18),
  V("clima", "geo", "completo", "CLIMATOLOGIA | Resumo de Geografia para o Enem", "Curso Enem Gratuito", "Tl9k3pkuVP4", 35),
  V("relevo", "geo", "completo", "Os agentes INTERNOS e EXTERNOS do relevo (Endógenos e Exógenos) - Geografia Física", "geo ilustrada", "5sIHC8yYIYw", 35),
  V("domínios morfoclimáticos", "geo", "completo", "SUPER DICA - Domínios Morfoclimáticos", "Eighteen Eighteen", "Xr6WLgCdkUI", 35),
  V("globalização", "geo", "completo", "GLOBALIZAÇÃO | QUER QUE DESENHE? | DESCOMPLICA", "Descomplica", "h5WjNMGztvE", 35),
  V("matriz energética", "geo", "resumo", "Matriz energética brasileira​ - Geografia - Ensino Médio", "Canal Futura", "6cVmzpG_iqM", 18),
  V("hidrografia", "geo", "completo", "Bacias hidrográficas do Brasil | Hidrografia do Brasil | Aula completa | Ricardo Marcílio", "Professor Ricardo Marcílio", "j2btPAQEfA4", 35),
  V("biogeografia", "geo", "completo", "BIOMAS BRASILEIROS - Parte 1 | GEOGRAFIA | Mapa Mental | Quer Que Desenhe", "Descomplica", "WYkUVasw-DY", 35),
  V("urbanização", "geo", "completo", "Urbanização Brasileira Geobrasil", "Geobrasil", "g-DEwpP2xuM", 35),
  V("agricultura", "geo", "completo", "Agricultura Brasileira - Geobrasil {Prof. Rodrigo Rodrigues}", "Geobrasil", "6MRVez_6poc", 35),
  V("população", "geo", "completo", "Demografia: Fundamentos | AULA do ZERO - Geografia | Me Salva! ENEM 2021", "Me Salva! ENEM", "xlPUda-csbE", 35),
  V("indústria", "geo", "completo", "Industrialização Brasileira - Geobrasil", "Geobrasil", "b8TlLqb07xs", 35),
  V("dissertação", "red", "completo", "Estrutura da Redação ENEM: Domine o Texto Dissertativo!", "Descomplica", "OkTqVz8h42g", 35),
  V("competências", "red", "completo", "ENTENDA AGORA AS 5 COMPETÊNCIAS DA REDAÇÃO DO ENEM!🎯", "Professor Ferretto | ENEM e Vestibulares", "xh2dZTWTOWo", 35),
  V("proposta de intervenção", "red", "resumo", "COMO ESCREVER A PROPOSTA DE INTERVENÇÃO NA REDAÇÃO DO ENEM", "Curso Enem Gratuito", "zU0sC6SeJz8", 18),
  V("repertório", "red", "resumo", "[REDAÇÃO DO ENEM] Repertório sociocultural ▷ Introdução aos eixos temáticos", "Puxa Língua", "vVFKLk2dda4", 18),
  V("interpretação", "efl", "completo", "INTERPRETAÇÃO E COMPREENSÃO DE TEXTOS - com EXERCÍCIOS - Profa. Pamba", "Professora Pamba", "W3XrpIRTgzA", 35),
  V("variação linguística", "efl", "resumo", "Variação Linguística | Português | QUER QUE DESENHE?", "Descomplica", "6l4hMURDjvk", 18),
  V("figuras de linguagem", "efl", "completo", "FIGURAS DE LINGUAGEM PARA O ENEM | QUER QUE DESENHE?", "Descomplica", "xfjSzZf6JA4", 35),
  V("sintaxe", "efl", "completo", "Período Composto por Coordenação (Orações coordenadas) ♫ Paródia \"Morro do Dendê\" ♫ [Prof Noslen]", "Professor Noslen", "UbrR7An5ZfY", 35),
  V("crase", "efl", "resumo", "CRASE: 5 Dicas SIMPLES Sobre Como Usar Crase (CONCURSOS E VESTIBULARES)", "Português sem Enrolação - Professora Lis", "TxZTrg2FDTU", 18),
  V("modernismo", "lit", "completo", "1ª fase do MODERNISMO NO BRASIL | Escolas Literárias", "Literatura com Alencar", "42cszYofye8", 35),
  V("romantismo", "lit", "completo", "Literatura Brasileira | Resumo para o Enem e os Vestibulares", "Partiu Universidade", "jq3LBXYLZWY", 35),
  V("realismo", "lit", "completo", "REALISMO E NATURALISMO | Literatura | Quer Que Desenhe | Descomplica", "Descomplica", "pkc2MP-sHT4", 35),
  V("barroco", "lit", "completo", "📜 Barroco e Arcadismo - Literatura - ENEM", "MundoEdu ENEM", "5oQKPk4abTo", 35),
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
  const q = encodeURIComponent(`${title} ${subjectName} aula vestibular`)
  return `https://www.youtube.com/results?search_query=${q}`
}
