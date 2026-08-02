import { Check, RotateCcw, SkipForward } from 'lucide-react'

import type { AgendaItem } from '@/types'
import { BlockIcon, blockColor } from '@/components/ui/BlockIcon'
import { cn } from '@/lib/utils'
import { clockToMinutes, formatDuration } from '@/lib/date'
import { useAppStore } from '@/store/appStore'

interface DayTimelineProps {
  agenda: AgendaItem[]
  currentMinutes: number
  currentId?: string | null
}

/** A rotina do dia em ordem. Linha do tempo vertical, densa mas legível. */
export function DayTimeline({ agenda, currentMinutes, currentId }: DayTimelineProps) {
  const setBlockState = useAppStore((s) => s.setBlockState)

  return (
    <ol className="relative">
      {/* Trilho vertical conectando os blocos. */}
      <span
        className="absolute top-4 bottom-4 left-[19px] w-px bg-line-soft"
        aria-hidden="true"
      />

      {agenda.map((item) => {
        const color = blockColor(item.kind)
        const isDone = item.state === 'feito'
        const isSkipped = item.state === 'pulado'
        const isCurrent = item.id === currentId
        const isPast = clockToMinutes(item.start) + item.minutes < currentMinutes

        return (
          <li key={item.id} className="relative flex gap-3 py-1.5">
            <span className="relative z-10 flex w-10 shrink-0 justify-center pt-1.5">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors',
                  isDone
                    ? 'border-transparent bg-ok/12 text-ok'
                    : isSkipped
                      ? 'border-line-soft bg-surface-2 text-ink-3'
                      : 'border-line-soft bg-surface',
                )}
                style={
                  !isDone && !isSkipped
                    ? { color, backgroundColor: 'var(--color-surface)' }
                    : undefined
                }
              >
                {isDone ? <Check size={17} /> : <BlockIcon kind={item.kind} size={17} />}
              </span>
            </span>

            <div
              className={cn(
                'min-w-0 flex-1 rounded-2xl px-3 py-2.5 transition-colors',
                isCurrent && 'bg-surface-2 ring-1 ring-accent/25',
                !isCurrent && 'hover:bg-surface-2/50',
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    'truncate text-[15px] font-semibold',
                    isDone || isSkipped ? 'text-ink-3' : 'text-ink',
                    isSkipped && 'line-through',
                  )}
                >
                  {item.label}
                </p>
                <span
                  className={cn(
                    'tnum shrink-0 text-[12px] font-medium',
                    isCurrent ? 'text-accent' : isPast && !isDone ? 'text-ink-3' : 'text-ink-2',
                  )}
                >
                  {item.start}
                </span>
              </div>

              {item.detail && (
                <p
                  className={cn(
                    'mt-0.5 truncate text-[12.5px]',
                    isDone || isSkipped ? 'text-ink-3/70' : 'text-ink-2',
                  )}
                >
                  {item.detail}
                </p>
              )}

              <div className="mt-1.5 flex items-center gap-2">
                {item.minutes > 0 && (
                  <span className="tnum text-[11px] text-ink-3">
                    {formatDuration(item.minutes)}
                  </span>
                )}

                <span className="ml-auto flex items-center gap-1">
                  {item.state === 'pendente' ? (
                    <>
                      <button
                        onClick={() => setBlockState(item.id, 'feito')}
                        aria-label={`Concluir ${item.label}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-ok/12 hover:text-ok"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setBlockState(item.id, 'pulado')}
                        aria-label={`Pular ${item.label}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink-2"
                      >
                        <SkipForward size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setBlockState(item.id, 'pendente')}
                      aria-label={`Desfazer ${item.label}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink-2"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
