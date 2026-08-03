import type { MealPlan, PantryItem } from '@/types'
import { uid } from '@/lib/utils'

/**
 * Refeições padrão para ganho de massa sem virar planilha de nutricionista.
 * Texto é editável — a ideia é lembrar e marcar, não contar caloria.
 */
export const SEED_MEALS: MealPlan[] = [
  {
    slot: 'cafe',
    label: 'Café da manhã',
    time: '06:20',
    description: '3 ovos mexidos, 2 fatias de pão integral, banana e leite',
    calories: 650,
    protein: 35,
    enabled: true,
  },
  {
    slot: 'lanche_escola',
    label: 'Lanche da escola',
    time: '09:40',
    description: 'Sanduíche de frango, fruta e castanhas',
    calories: 450,
    protein: 25,
    enabled: true,
  },
  {
    slot: 'almoco',
    label: 'Almoço',
    time: '12:30',
    description: 'Arroz, feijão, 150g de carne/frango, salada',
    calories: 800,
    protein: 45,
    enabled: true,
  },
  {
    slot: 'pre_treino',
    label: 'Pré-treino',
    time: '16:30',
    description: 'Pão com pasta de amendoim + café ou fruta',
    calories: 350,
    protein: 12,
    enabled: true,
  },
  {
    slot: 'pos_treino',
    label: 'Pós-treino',
    time: '19:15',
    description: 'Whey ou leite com achocolatado + fruta',
    calories: 400,
    protein: 30,
    enabled: true,
  },
  {
    slot: 'jantar',
    label: 'Jantar',
    time: '20:00',
    description: 'Arroz, ovos ou frango, legumes',
    calories: 700,
    protein: 40,
    enabled: true,
  },
]

/**
 * Estoque da casa. `essential: true` dispara alerta na home quando acaba —
 * são os itens sem os quais a dieta trava.
 */
const PANTRY_SEED: Array<[name: string, essential: boolean, inStock: boolean]> = [
  ['Ovos', true, true],
  ['Arroz', true, true],
  ['Feijão', true, true],
  ['Frango', true, true],
  ['Leite', true, true],
  ['Pão integral', true, false],
  ['Banana', true, true],
  ['Pasta de amendoim', false, true],
  ['Whey protein', false, false],
  ['Aveia', false, true],
  ['Batata-doce', false, true],
  ['Castanhas', false, false],
  ['Iogurte natural', false, true],
  ['Carne moída', false, true],
]

export function buildSeedPantry(): PantryItem[] {
  return PANTRY_SEED.map(([name, essential, inStock]) => ({
    id: uid('p-'),
    name,
    essential,
    inStock,
  }))
}

/** Sugestões rápidas de compra, mostradas como atalho na lista. */
export const QUICK_SHOPPING_SUGGESTIONS = [
  'Ovos',
  'Frango',
  'Arroz',
  'Leite',
  'Banana',
  'Pão integral',
  'Aveia',
  'Batata-doce',
  'Whey protein',
  'Castanhas',
]
