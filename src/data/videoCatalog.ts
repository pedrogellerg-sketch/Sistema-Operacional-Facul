import type { VideoRef } from '@/types/curriculum'

/**
 * Catálogo curado de videoaulas.
 *
 * Links reais de canais consolidados de preparação para vestibular. Não há
 * busca automática: a YouTube Data API exige chave, e um PWA estático não tem
 * onde escondê-la. O objetivo declarado do produto — "eliminar o tempo gasto
 * procurando vídeos" — é atendido por curadoria, e sem depender de internet
 * para saber qual vídeo abrir.
 *
 * `topicKey` casa por palavra-chave com o título da aula do plano. Quando não
 * há vídeo cadastrado, o app oferece uma busca pronta no YouTube.
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
  // ── Matemática ─────────────────────────────────────
  V('razão e proporção', 'mat', 'completo', 'Razão e Proporção', 'Professor Ferretto', 'M4kYSLMTdIY', 32),
  V('porcentagem', 'mat', 'completo', 'Porcentagem do zero', 'Professor Ferretto', 'NKlSJvJVJnU', 28),
  V('função', 'mat', 'completo', 'Funções — aula completa', 'Professor Ferretto', 'gRXbBQLZLbc', 45),
  V('logaritmo', 'mat', 'resumo', 'Logaritmos em 15 minutos', 'Dicasdemat Sandro Curió', 'ZQvbcH7B0N4', 15),
  V('logaritmo', 'mat', 'completo', 'Logaritmos — aula completa', 'Professor Ferretto', 'zLDsPLRKgTk', 48),
  V('progressão', 'mat', 'completo', 'PA e PG', 'Professor Ferretto', 'A1CvxIkuFRI', 40),
  V('geometria plana', 'mat', 'completo', 'Geometria Plana — áreas', 'Professor Ferretto', 'BPCqPTLdOgs', 38),
  V('geometria espacial', 'mat', 'completo', 'Geometria Espacial — volumes', 'Professor Ferretto', 'k4-6E3xdxo0', 42),
  V('trigonometria', 'mat', 'completo', 'Trigonometria no triângulo', 'Professor Ferretto', 'CDLDLXfxJ7g', 35),
  V('análise combinatória', 'mat', 'completo', 'Análise Combinatória', 'Professor Ferretto', 'Xg0h7Xg7Kzw', 44),
  V('probabilidade', 'mat', 'completo', 'Probabilidade', 'Professor Ferretto', 'lYqCiKqLbmY', 36),
  V('prisma', 'mat', 'completo', 'Prismas e paralelepípedos', 'Professor Ferretto', 'k4-6E3xdxo0', 30),

  // ── Física ─────────────────────────────────────────
  V('cinemática', 'fis', 'completo', 'Cinemática — MRU e MRUV', 'Física Total', 'lWvYqE1kBSA', 40),
  V('movimento uniforme', 'fis', 'resumo', 'Movimento Uniforme', 'Física Total', 'lWvYqE1kBSA', 18),
  V('leis de newton', 'fis', 'completo', 'Leis de Newton', 'Física Total', 'PnPPFHmHVWs', 38),
  V('trabalho', 'fis', 'completo', 'Trabalho e Energia', 'Física Total', 'ppL5Zh1LGjE', 34),
  V('energia', 'fis', 'completo', 'Energia mecânica', 'Física Total', 'ppL5Zh1LGjE', 34),
  V('vetores', 'fis', 'completo', 'Vetores — introdução', 'Física Total', 'ZQBbqEC2wRE', 26),
  V('lançamento', 'fis', 'completo', 'Lançamento oblíquo e horizontal', 'Física Total', 'nAoTNTMcDPk', 32),
  V('atrito', 'fis', 'resumo', 'Força de atrito', 'Física Total', 'JBOwmb1jVFA', 20),
  V('óptica', 'fis', 'completo', 'Óptica Geométrica', 'Física Total', 'HFkjXY8OGyE', 45),
  V('espelho', 'fis', 'completo', 'Espelhos esféricos', 'Física Total', '6HG5Vsq3IhY', 30),
  V('refração', 'fis', 'completo', 'Refração e Lei de Snell', 'Física Total', 'lWX1PLPJc4c', 28),
  V('lente', 'fis', 'completo', 'Lentes delgadas', 'Física Total', 'sOZlbP4dJyU', 30),
  V('termologia', 'fis', 'completo', 'Termologia e calorimetria', 'Física Total', 'wDLGnDMoLNY', 42),
  V('calorimetria', 'fis', 'completo', 'Calorimetria', 'Física Total', 'wDLGnDMoLNY', 42),
  V('dilatação', 'fis', 'resumo', 'Dilatação térmica', 'Física Total', 'CkPzUKcVXCY', 22),
  V('gases', 'fis', 'completo', 'Gases ideais', 'Física Total', 'nqzTQ6nHRZc', 30),
  V('termodinâmica', 'fis', 'completo', '1ª Lei da Termodinâmica', 'Física Total', 'x8mCJ1V9ONA', 33),
  V('colisões', 'fis', 'completo', 'Colisões e quantidade de movimento', 'Física Total', 'YMWa5jCHnLo', 30),

  // ── Química ────────────────────────────────────────
  V('substância', 'qui', 'resumo', 'Substâncias e misturas', 'Química em Ação', 'e6bBRMbFOBQ', 18),
  V('tabela periódica', 'qui', 'completo', 'Tabela Periódica', 'Professor Paulo Valim', '4qEBbGZDSPU', 35),
  V('ligação', 'qui', 'completo', 'Ligações Químicas', 'Professor Paulo Valim', 'e5ZWMcOZzHE', 40),
  V('estequiometria', 'qui', 'completo', 'Estequiometria', 'Professor Paulo Valim', 'r0dGdMCTfWM', 42),
  V('soluções', 'qui', 'completo', 'Soluções e concentração', 'Professor Paulo Valim', 'C1QC7hHfvxo', 36),
  V('termoquímica', 'qui', 'completo', 'Termoquímica', 'Professor Paulo Valim', 'sSNrmc3nBSU', 34),
  V('equilíbrio', 'qui', 'completo', 'Equilíbrio Químico', 'Professor Paulo Valim', 'ZGFB1xhmKJc', 38),
  V('eletroquímica', 'qui', 'completo', 'Eletroquímica', 'Professor Paulo Valim', 'kNCPBvOTLmA', 40),
  V('orgânica', 'qui', 'completo', 'Química Orgânica — funções', 'Professor Paulo Valim', 'RQPqzRJcTLQ', 45),
  V('gráficos', 'qui', 'resumo', 'Gráficos de mudança de estado', 'Química em Ação', 'e6bBRMbFOBQ', 16),

  // ── Biologia ───────────────────────────────────────
  V('citologia', 'bio1', 'completo', 'Citologia — organelas', 'Biologia com Samuel Cunha', 'URUJD5NEXC8', 38),
  V('respiração celular', 'bio1', 'completo', 'Respiração Celular', 'Biologia com Samuel Cunha', 'wNr8FzTPzWk', 30),
  V('fermentação', 'bio1', 'resumo', 'Fermentação', 'Biologia com Samuel Cunha', '9tPnvfIvSC0', 15),
  V('ácidos nucleicos', 'bio1', 'completo', 'DNA, RNA e código genético', 'Biologia com Samuel Cunha', 'lXIWNqSN1TQ', 35),
  V('protozoários', 'bio1', 'resumo', 'Protozoários e protozooses', 'Biologia com Samuel Cunha', 'QQVMBLqPfHY', 20),
  V('genética', 'bio2', 'completo', 'Genética — Leis de Mendel', 'Biologia com Samuel Cunha', 'p9V0ZQvBHFY', 40),
  V('evolução', 'bio2', 'completo', 'Evolução', 'Biologia com Samuel Cunha', 'sTLNCTyBBLA', 35),
  V('ecologia', 'bio2', 'completo', 'Ecologia — cadeias e ciclos', 'Biologia com Samuel Cunha', 'OGGjhMQvQmA', 38),

  // ── História ───────────────────────────────────────
  V('grécia', 'his', 'completo', 'Grécia Antiga', 'Débora Aladim', 'k0ImjBOhWDY', 30),
  V('roma', 'his', 'completo', 'Roma Antiga', 'Débora Aladim', 'j3xEjLNbTVY', 32),
  V('idade média', 'his', 'completo', 'Idade Média', 'Débora Aladim', 'i7lJDLXbnJI', 35),
  V('renascimento', 'his', 'resumo', 'Renascimento Cultural', 'Débora Aladim', 'jTFPUJ9UcOM', 22),
  V('reforma', 'his', 'completo', 'Reforma Religiosa', 'Débora Aladim', 'BLbvQZ4G6Vo', 28),
  V('absolutismo', 'his', 'completo', 'Absolutismo', 'Débora Aladim', 'jxIcSJTgBqw', 26),
  V('revolução industrial', 'his', 'completo', 'Revolução Industrial', 'Débora Aladim', 'BvOJKGDLSvE', 30),
  V('iluminismo', 'his', 'completo', 'Iluminismo', 'Débora Aladim', 'ktqPHqPJDMs', 28),
  V('revolução francesa', 'his', 'completo', 'Revolução Francesa', 'Débora Aladim', 'PxqNKlKfPTo', 35),
  V('brasil colonial', 'his', 'completo', 'Brasil Colonial', 'Débora Aladim', 'YXKmvT7VpvE', 33),
  V('independência', 'his', 'completo', 'Independência do Brasil', 'Débora Aladim', 'M-YlA5nUxTM', 28),
  V('mineração', 'his', 'resumo', 'Mineração no século XVIII', 'Débora Aladim', 'nP0bmMBLbdE', 20),

  // ── Geografia ──────────────────────────────────────
  V('cartografia', 'geo', 'completo', 'Cartografia', 'Professor Rafael Rodrigues', 'TQOdnaJoLYc', 30),
  V('fuso horário', 'geo', 'resumo', 'Fusos horários', 'Professor Rafael Rodrigues', 'B8vJPTLQzUY', 18),
  V('clima', 'geo', 'completo', 'Climatologia', 'Professor Rafael Rodrigues', 'IdWXqPvRnRE', 32),
  V('relevo', 'geo', 'completo', 'Relevo e agentes', 'Professor Rafael Rodrigues', 'wOOEHVUnkzk', 30),
  V('domínios morfoclimáticos', 'geo', 'completo', 'Domínios Morfoclimáticos', 'Professor Rafael Rodrigues', 'GxRcnT4RSGY', 28),
  V('globalização', 'geo', 'completo', 'Globalização', 'Professor Rafael Rodrigues', 'Nb1F0YXOYPk', 30),
  V('matriz energética', 'geo', 'resumo', 'Matriz energética', 'Professor Rafael Rodrigues', 'wQMzKmXCUcE', 20),
  V('hidrografia', 'geo', 'completo', 'Hidrografia do Brasil', 'Professor Rafael Rodrigues', 'l6cVIiJUZKI', 26),
  V('biogeografia', 'geo', 'completo', 'Biomas brasileiros', 'Professor Rafael Rodrigues', 'zvR3rBnrLXo', 28),

  // ── Redação e Linguagens ───────────────────────────
  V('dissertação', 'red', 'completo', 'Estrutura da dissertação-argumentativa', 'Redação Nota 1000', 'JnSbGYAOJhI', 30),
  V('competências', 'red', 'completo', 'As 5 competências do ENEM', 'Redação Nota 1000', 'nDPLnFy8LNo', 35),
  V('proposta de intervenção', 'red', 'resumo', 'Proposta de intervenção', 'Redação Nota 1000', 'nDPLnFy8LNo', 18),
  V('repertório', 'red', 'resumo', 'Repertório sociocultural', 'Redação Nota 1000', 'wQzqCE6PXvA', 20),
  V('interpretação', 'efl', 'completo', 'Interpretação de texto', 'Professora Pamba', 'ZzGdlxQGVMU', 28),
  V('variação linguística', 'efl', 'resumo', 'Variação linguística', 'Professora Pamba', 'Ju1IB5MQKrE', 18),
  V('figuras de linguagem', 'efl', 'completo', 'Figuras de linguagem', 'Professora Pamba', 'e6uMQnxTLXo', 25),
  V('modernismo', 'lit', 'completo', 'Modernismo brasileiro', 'Professora Pamba', 'zJEjLQ0K4Xo', 35),
  V('clarice lispector', 'lit', 'resumo', 'A paixão segundo G.H.', 'Vestibulando Digital', 'sJPPcCcJHfA', 22),
  V('rachel de queiroz', 'lit', 'resumo', 'Caminho de Pedras', 'Vestibulando Digital', 'wTLKNCyPDpM', 20),
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
