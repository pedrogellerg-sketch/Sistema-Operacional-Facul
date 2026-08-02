import {
  Apple,
  Brain,
  Dumbbell,
  Gamepad2,
  Moon,
  NotebookPen,
  School,
  ShowerHead,
  Sunrise,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

import type { BlockKind } from '@/types'
import { BLOCK_META } from '@/lib/routineEngine'

/** Mapa estático — evita import dinâmico e mantém o tree-shaking funcionando. */
const ICONS: Record<string, LucideIcon> = {
  sunrise: Sunrise,
  school: School,
  utensils: Utensils,
  apple: Apple,
  dumbbell: Dumbbell,
  'shower-head': ShowerHead,
  brain: Brain,
  'notebook-pen': NotebookPen,
  'gamepad-2': Gamepad2,
  moon: Moon,
}

interface BlockIconProps {
  kind: BlockKind
  size?: number
  className?: string
}

export function BlockIcon({ kind, size = 18, className }: BlockIconProps) {
  const Icon = ICONS[BLOCK_META[kind].icon] ?? Brain
  return <Icon size={size} className={className} strokeWidth={2} />
}

export function blockColor(kind: BlockKind): string {
  return BLOCK_META[kind].color
}
