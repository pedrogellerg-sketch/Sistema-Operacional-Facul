import type { Subject, Topic } from '@/types'

/**
 * Matérias na ordem de prioridade do método. `priority` menor = entra primeiro
 * na sugestão. O tier controla o peso na semana e a profundidade da sessão.
 */
export const SEED_SUBJECTS: Subject[] = [
  {
    id: 'mat',
    name: 'Matemática',
    shortName: 'Mat',
    area: 'exatas',
    tier: 'nucleo',
    strength: 'media',
    priority: 1,
    color: '#d4ff3f',
    enabled: true,
  },
  {
    id: 'fis',
    name: 'Física',
    shortName: 'Fís',
    area: 'exatas',
    tier: 'nucleo',
    strength: 'fraca',
    priority: 2,
    color: '#60a5fa',
    enabled: true,
  },
  {
    id: 'qui',
    name: 'Química',
    shortName: 'Quí',
    area: 'natureza',
    tier: 'nucleo',
    strength: 'fraca',
    priority: 3,
    color: '#f472b6',
    enabled: true,
  },
  {
    id: 'bio',
    name: 'Biologia',
    shortName: 'Bio',
    area: 'natureza',
    tier: 'apoio',
    strength: 'media',
    priority: 4,
    color: '#4ade80',
    enabled: true,
  },
  {
    id: 'his',
    name: 'História',
    shortName: 'His',
    area: 'humanas',
    tier: 'apoio',
    strength: 'media',
    priority: 5,
    color: '#fbbf24',
    enabled: true,
  },
  {
    id: 'geo',
    name: 'Geografia',
    shortName: 'Geo',
    area: 'humanas',
    tier: 'apoio',
    strength: 'media',
    priority: 6,
    color: '#22d3ee',
    enabled: true,
  },
  {
    id: 'red',
    name: 'Redação',
    shortName: 'Red',
    area: 'redacao',
    tier: 'apoio',
    strength: 'media',
    priority: 7,
    color: '#ff8a4c',
    enabled: true,
  },
  {
    id: 'por',
    name: 'Português',
    shortName: 'Port',
    area: 'linguagens',
    tier: 'leve',
    strength: 'forte',
    priority: 8,
    color: '#a78bfa',
    enabled: true,
  },
  {
    id: 'soc',
    name: 'Sociologia',
    shortName: 'Soc',
    area: 'humanas',
    tier: 'leve',
    strength: 'forte',
    priority: 9,
    color: '#94a3b8',
    enabled: true,
  },
  {
    id: 'fil',
    name: 'Filosofia',
    shortName: 'Filo',
    area: 'humanas',
    tier: 'leve',
    strength: 'forte',
    priority: 10,
    color: '#c4b5fd',
    enabled: true,
  },
  {
    id: 'ing',
    name: 'Inglês',
    shortName: 'Ing',
    area: 'linguagens',
    tier: 'opcional',
    strength: 'forte',
    priority: 11,
    color: '#6b7482',
    enabled: true,
  },
]

/** Trilhas iniciais: conteúdo real de vestibular, na ordem em que se estuda. */
const TRACKS: Record<string, string[]> = {
  mat: [
    'Razão, proporção e porcentagem',
    'Funções do 1º grau',
    'Funções do 2º grau',
    'Função exponencial e logaritmo',
    'Progressões (PA e PG)',
    'Geometria plana — áreas',
    'Geometria espacial — volumes',
    'Trigonometria no triângulo',
    'Análise combinatória',
    'Probabilidade',
    'Estatística e gráficos',
    'Matemática financeira',
  ],
  fis: [
    'Cinemática — MRU e MRUV',
    'Leis de Newton',
    'Trabalho e energia',
    'Quantidade de movimento',
    'Estática e hidrostática',
    'Termologia e calorimetria',
    'Termodinâmica',
    'Óptica geométrica',
    'Ondulatória',
    'Eletrostática',
    'Circuitos elétricos',
    'Eletromagnetismo',
  ],
  qui: [
    'Estrutura atômica',
    'Tabela periódica',
    'Ligações químicas',
    'Funções inorgânicas',
    'Reações químicas e balanceamento',
    'Estequiometria',
    'Soluções e concentração',
    'Termoquímica',
    'Cinética química',
    'Equilíbrio químico',
    'Eletroquímica',
    'Química orgânica — funções',
  ],
  bio: [
    'Citologia — organelas',
    'Membrana e transporte',
    'Metabolismo energético',
    'Divisão celular',
    'Genética — 1ª e 2ª lei de Mendel',
    'Biotecnologia e DNA',
    'Evolução',
    'Ecologia — cadeias e ciclos',
    'Ecologia — problemas ambientais',
    'Fisiologia humana',
    'Botânica',
    'Reino animal',
  ],
  his: [
    'Brasil Colônia',
    'Independência e Primeiro Reinado',
    'Segundo Reinado e República Velha',
    'Era Vargas',
    'Ditadura Militar',
    'Redemocratização',
    'Revolução Industrial',
    'Revolução Francesa',
    'Imperialismo',
    'Primeira Guerra Mundial',
    'Segunda Guerra Mundial',
    'Guerra Fria',
  ],
  geo: [
    'Cartografia',
    'Climatologia',
    'Relevo e solos',
    'Domínios morfoclimáticos do Brasil',
    'Urbanização',
    'População e demografia',
    'Agropecuária brasileira',
    'Indústria e energia',
    'Globalização',
    'Geopolítica mundial',
    'Questões ambientais',
    'Recursos hídricos',
  ],
  red: [
    'Estrutura da dissertação-argumentativa',
    'As 5 competências do ENEM',
    'Introdução — como abrir o texto',
    'Desenvolvimento e argumentação',
    'Repertório sociocultural',
    'Proposta de intervenção',
    'Conectivos e coesão',
    'Erros que zeram a redação',
    'Treino cronometrado',
  ],
  por: [
    'Interpretação de texto',
    'Figuras de linguagem',
    'Gêneros textuais',
    'Sintaxe — período composto',
    'Crase e regência',
    'Concordância',
    'Variação linguística',
    'Escolas literárias — panorama',
    'Modernismo brasileiro',
  ],
  soc: [
    'Clássicos: Durkheim, Weber e Marx',
    'Cultura e indústria cultural',
    'Trabalho e sociedade',
    'Cidadania e direitos',
    'Movimentos sociais',
    'Desigualdade social no Brasil',
  ],
  fil: [
    'Filosofia antiga — Sócrates a Aristóteles',
    'Filosofia medieval',
    'Racionalismo e empirismo',
    'Contratualistas',
    'Kant e o iluminismo',
    'Ética e moral',
    'Filosofia contemporânea',
  ],
  ing: [
    'Estratégias de leitura (skimming e scanning)',
    'Vocabulário frequente em provas',
    'Tempos verbais essenciais',
    'Cognatos e falsos cognatos',
  ],
}

/** Estado inicial "realista": primeiros tópicos já andados, o resto por vir. */
const SEEDED_PROGRESS: Record<string, { done: number; current: number }> = {
  mat: { done: 3, current: 1 },
  fis: { done: 2, current: 1 },
  qui: { done: 1, current: 1 },
  bio: { done: 2, current: 1 },
  his: { done: 2, current: 1 },
  geo: { done: 1, current: 1 },
  red: { done: 1, current: 1 },
  por: { done: 3, current: 0 },
  soc: { done: 1, current: 0 },
  fil: { done: 1, current: 0 },
  ing: { done: 0, current: 0 },
}

/**
 * Dificuldade base por matéria — o usuário ajusta depois, mas o app já começa
 * com uma leitura sensata (exatas pesam mais).
 */
const BASE_DIFFICULTY: Record<string, 1 | 2 | 3 | 4 | 5> = {
  mat: 4,
  fis: 5,
  qui: 4,
  bio: 3,
  his: 3,
  geo: 2,
  red: 3,
  por: 2,
  soc: 2,
  fil: 2,
  ing: 1,
}

export function buildSeedTopics(todayISO: string, daysAgo: (n: number) => string): Topic[] {
  const topics: Topic[] = []

  for (const [subjectId, titles] of Object.entries(TRACKS)) {
    const progress = SEEDED_PROGRESS[subjectId] ?? { done: 0, current: 0 }
    titles.forEach((title, index) => {
      let status: Topic['status'] = 'nao_visto'
      let lastReviewedAt: string | null = null
      let exercisesDone = 0

      if (index < progress.done) {
        // Já passou: alterna entre dominado e revisando para o painel nascer vivo.
        status = index % 2 === 0 ? 'dominado' : 'revisando'
        lastReviewedAt = daysAgo(3 + index * 4)
        exercisesDone = 12 + index * 6
      } else if (index < progress.done + progress.current) {
        status = 'em_andamento'
        lastReviewedAt = daysAgo(1)
        exercisesDone = 5
      }

      topics.push({
        id: `${subjectId}-${index}`,
        subjectId,
        title,
        status,
        difficulty: BASE_DIFFICULTY[subjectId] ?? 3,
        exercisesDone,
        lastReviewedAt,
        notes: '',
        order: index,
      })
    })
  }

  void todayISO
  return topics
}
