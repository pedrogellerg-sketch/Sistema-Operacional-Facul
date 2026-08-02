/** Junta classes ignorando falsy. Suficiente aqui — não há conflito de Tailwind a resolver. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Id curto e único o bastante para dados locais. */
export function uid(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Percentual 0–100, com guarda para divisão por zero. */
export function pct(value: number, total: number): number {
  if (total <= 0) return 0
  return clamp(Math.round((value / total) * 100), 0, 100)
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

/** Escolhe um item de forma estável para uma mesma semente (ex.: a data). */
export function pickStable<T>(items: T[], seed: string): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return items[Math.abs(h) % items.length]
}

/** Plural simples: `plural(1, 'treino', 'treinos')` → '1 treino'. */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
