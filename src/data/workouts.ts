import type { WorkoutTemplate } from '@/types'

/**
 * Split ABC — o padrão que funciona para quem treina 3–5x na semana buscando
 * hipertrofia sem complicar. Cargas começam vazias: o usuário registra na 1ª ida.
 */
export const SEED_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'wk-a',
    name: 'Treino A',
    focus: 'Peito, ombro e tríceps',
    estimatedMinutes: 55,
    exercises: [
      { id: 'a1', name: 'Supino reto com barra', sets: 4, reps: '8-10', lastLoad: null, notes: '' },
      { id: 'a2', name: 'Supino inclinado com halteres', sets: 3, reps: '10-12', lastLoad: null, notes: '' },
      { id: 'a3', name: 'Crucifixo na máquina', sets: 3, reps: '12-15', lastLoad: null, notes: '' },
      { id: 'a4', name: 'Desenvolvimento com halteres', sets: 4, reps: '8-10', lastLoad: null, notes: '' },
      { id: 'a5', name: 'Elevação lateral', sets: 3, reps: '12-15', lastLoad: null, notes: '' },
      { id: 'a6', name: 'Tríceps na polia', sets: 3, reps: '10-12', lastLoad: null, notes: '' },
      { id: 'a7', name: 'Tríceps testa', sets: 3, reps: '10-12', lastLoad: null, notes: '' },
    ],
  },
  {
    id: 'wk-b',
    name: 'Treino B',
    focus: 'Costas e bíceps',
    estimatedMinutes: 55,
    exercises: [
      { id: 'b1', name: 'Barra fixa ou puxada alta', sets: 4, reps: '8-10', lastLoad: null, notes: '' },
      { id: 'b2', name: 'Remada curvada', sets: 4, reps: '8-10', lastLoad: null, notes: '' },
      { id: 'b3', name: 'Remada baixa na polia', sets: 3, reps: '10-12', lastLoad: null, notes: '' },
      { id: 'b4', name: 'Pulldown com corda', sets: 3, reps: '12-15', lastLoad: null, notes: '' },
      { id: 'b5', name: 'Rosca direta', sets: 3, reps: '10-12', lastLoad: null, notes: '' },
      { id: 'b6', name: 'Rosca martelo', sets: 3, reps: '10-12', lastLoad: null, notes: '' },
    ],
  },
  {
    id: 'wk-c',
    name: 'Treino C',
    focus: 'Pernas e core',
    estimatedMinutes: 60,
    exercises: [
      { id: 'c1', name: 'Agachamento livre', sets: 4, reps: '8-10', lastLoad: null, notes: '' },
      { id: 'c2', name: 'Leg press', sets: 4, reps: '10-12', lastLoad: null, notes: '' },
      { id: 'c3', name: 'Cadeira extensora', sets: 3, reps: '12-15', lastLoad: null, notes: '' },
      { id: 'c4', name: 'Mesa flexora', sets: 3, reps: '12-15', lastLoad: null, notes: '' },
      { id: 'c5', name: 'Panturrilha em pé', sets: 4, reps: '15-20', lastLoad: null, notes: '' },
      { id: 'c6', name: 'Prancha abdominal', sets: 3, reps: '40s', lastLoad: null, notes: '' },
    ],
  },
]

/** O passo a passo do modo baixa motivação. A ordem importa: nenhum passo assusta. */
export const LOW_MOTIVATION_STEPS = [
  'Vista a roupa de treino. Só isso.',
  'Pegue a garrafa de água e saia de casa.',
  'Chegue na academia e faça o aquecimento.',
  'Agora decide: se ainda quiser ir embora, tudo bem.',
]

/** Checklist de saída — reduz a fricção de "ir mesmo sem vontade". */
export const PRE_WORKOUT_CHECKLIST = [
  'Roupa de treino separada',
  'Garrafa de água cheia',
  'Pré-treino comido (~1h antes)',
  'Fone e playlist prontos',
]
