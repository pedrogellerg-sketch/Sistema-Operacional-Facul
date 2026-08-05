import { ChevronsLeft, ChevronsRight, RotateCcw } from 'lucide-react'

import { useCurriculumStore } from '@/store/curriculumStore'
import { cn } from '@/lib/utils'

/**
 * Correção manual do ritmo de uma disciplina.
 *
 * O relato diário em "Como foi a aula" já move a fila sozinho, e continua sendo
 * o caminho normal. Este controle existe para o outro caso: quando o desvio já
 * se acumulou — o professor passou longe do previsto durante semanas — e
 * relatar aula por aula seria trabalho inútil.
 *
 * Como o cronograma é derivado, cada toque recalcula o dia inteiro na hora. O
 * usuário vê o conteúdo mudar acima do botão: é o próprio preview, sem
 * precisar de tela de confirmação.
 */
export function ScheduleAdjust({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const offset = useCurriculumStore((s) => s.offsets[subjectId] ?? 0)
  const adjustOffset = useCurriculumStore((s) => s.adjustOffset)
  const resetOffset = useCurriculumStore((s) => s.resetOffset)

  const estado =
    offset === 0
      ? 'Seguindo o plano da escola'
      : offset > 0
        ? `${offset} ${offset === 1 ? 'aula atrasada' : 'aulas atrasadas'} em relação ao plano`
        : `${-offset} ${-offset === 1 ? 'aula adiantada' : 'aulas adiantadas'} em relação ao plano`

  return (
    <div className="rounded-2xl border border-line-soft bg-surface-2 p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
          Ritmo de {subjectName}
        </p>
        {offset !== 0 && (
          <button
            onClick={() => resetOffset(subjectId)}
            className="flex items-center gap-1 text-[11.5px] font-medium text-ink-3 hover:text-ink-2"
          >
            <RotateCcw size={12} />
            Voltar ao plano
          </button>
        )}
      </div>

      <p
        className={cn(
          'mt-1 text-[13px] font-medium',
          offset === 0 ? 'text-ink-2' : offset > 0 ? 'text-warn' : 'text-info',
        )}
      >
        {estado}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => adjustOffset(subjectId, 1)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-line-soft bg-surface px-3 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-line hover:bg-surface-3"
        >
          <ChevronsLeft size={15} />
          Voltar 1 aula
        </button>
        <button
          onClick={() => adjustOffset(subjectId, -1)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-line-soft bg-surface px-3 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-line hover:bg-surface-3"
        >
          Avançar 1 aula
          <ChevronsRight size={15} />
        </button>
      </div>

      <p className="mt-2.5 text-[11.5px] leading-snug text-ink-3">
        Use <strong className="text-ink-2">avançar</strong> quando o professor já passou do
        previsto, e <strong className="text-ink-2">voltar</strong> quando ficou para trás. O
        conteúdo acima muda na hora — nada é reescrito, só a posição da fila.
      </p>
    </div>
  )
}
