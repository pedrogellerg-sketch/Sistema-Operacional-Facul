import { useState } from 'react'
import { Play, Plus, Trash2 } from 'lucide-react'

import type { SubjectStrength, SubjectTier, Topic, TopicStatus } from '@/types'
import { Button, IconButton } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { TextInput } from '@/components/ui/Field'
import { STATUS_COLOR, STATUS_LABEL, TIER_DESCRIPTION } from '@/lib/studyEngine'
import { formatShortDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

interface SubjectSheetProps {
  /** Só o id: o objeto vem do store, para a tela refletir a mudança na hora. */
  subjectId: string | null
  onClose: () => void
  onStartSession: (subjectId: string, topicId: string | null) => void
}

const TIER_OPTIONS: Array<{ value: SubjectTier; label: string }> = [
  { value: 'nucleo', label: 'Núcleo' },
  { value: 'apoio', label: 'Apoio' },
  { value: 'leve', label: 'Leve' },
  { value: 'opcional', label: 'Opcional' },
]

const STRENGTH_OPTIONS: Array<{ value: SubjectStrength; label: string }> = [
  { value: 'fraca', label: 'Fraca' },
  { value: 'media', label: 'Média' },
  { value: 'forte', label: 'Forte' },
]

/** Toque no status avança nesta ordem — o mesmo caminho que o método propõe. */
const STATUS_CYCLE: TopicStatus[] = [
  'nao_iniciado',
  'preparando',
  'preparado',
  'revisando',
  'dominado',
]

/** Detalhe da matéria: ajusta peso e força, e edita a trilha de tópicos. */
export function SubjectSheet({ subjectId, onClose, onStartSession }: SubjectSheetProps) {
  // Lido do store a cada render — é isso que dá feedback visual imediato.
  const subject = useAppStore((s) => s.subjects.find((x) => x.id === subjectId))
  const topics = useAppStore((s) => s.topics)
  const updateSubject = useAppStore((s) => s.updateSubject)
  const updateTopic = useAppStore((s) => s.updateTopic)
  const addTopic = useAppStore((s) => s.addTopic)
  const removeTopic = useAppStore((s) => s.removeTopic)

  const [newTopic, setNewTopic] = useState('')

  if (!subject) return null

  const mine = topics
    .filter((t) => t.subjectId === subject.id)
    .sort((a, b) => a.order - b.order)

  const cycleStatus = (topic: Topic) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(topic.status) + 1) % STATUS_CYCLE.length]
    updateTopic(topic.id, {
      status: next,
      lastReviewedAt:
        next === 'revisando' || next === 'dominado'
          ? new Date().toISOString().slice(0, 10)
          : topic.lastReviewedAt,
    })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={subject.name}
      description={TIER_DESCRIPTION[subject.tier]}
      footer={
        <Button
          variant="primary"
          size="lg"
          full
          icon={<Play size={17} />}
          onClick={() => onStartSession(subject.id, null)}
        >
          Iniciar sessão desta matéria
        </Button>
      }
    >
      <div className="space-y-6">
        {/* ── Peso na semana ──────────────────────────── */}
        <div>
          <p className="mb-2 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">
            Peso na semana
          </p>
          <Segmented
            value={subject.tier}
            options={TIER_OPTIONS}
            onChange={(tier) => updateSubject(subject.id, { tier })}
            size="sm"
          />
          <p className="mt-2 text-[12px] leading-snug text-ink-3">
            {TIER_DESCRIPTION[subject.tier]}
          </p>
        </div>

        {/* ── Como você está ──────────────────────────── */}
        <div>
          <p className="mb-2 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">
            Como você está nela
          </p>
          <Segmented
            value={subject.strength}
            options={STRENGTH_OPTIONS}
            onChange={(strength) => updateSubject(subject.id, { strength })}
            size="sm"
          />
          <p className="mt-2 text-[12px] leading-snug text-ink-3">
            Matéria fraca ganha mais videoaula e exercício. Forte vai direto à prática.
          </p>
        </div>

        {/* ── Trilha ──────────────────────────────────── */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold tracking-wide text-ink-3 uppercase">
              Trilha ({mine.length})
            </p>
            <span className="text-[11px] text-ink-3">toque no status para avançar</span>
          </div>

          <ul className="space-y-1.5">
            {mine.map((topic) => (
              <li
                key={topic.id}
                className="flex items-center gap-2.5 rounded-2xl border border-line-soft bg-surface-2 px-3 py-2.5"
              >
                <button
                  onClick={() => cycleStatus(topic)}
                  aria-label={`Status: ${STATUS_LABEL[topic.status]}. Toque para mudar.`}
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform active:scale-125"
                  style={{ backgroundColor: STATUS_COLOR[topic.status] }}
                />

                <button
                  onClick={() => onStartSession(subject.id, topic.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {topic.title}
                  </span>
                  <span className="tnum mt-0.5 block text-[11px] text-ink-3">
                    {STATUS_LABEL[topic.status]}
                    {topic.exercisesDone > 0 && ` · ${topic.exercisesDone} ex.`}
                    {topic.lastReviewedAt && ` · ${formatShortDate(topic.lastReviewedAt)}`}
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-0.5">
                  {/* Dificuldade em 5 níveis, ajustável no toque. */}
                  <div className="mr-1 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => updateTopic(topic.id, { difficulty: n as Topic['difficulty'] })}
                        aria-label={`Dificuldade ${n}`}
                        className={cn(
                          'h-4 w-1 rounded-full transition-colors',
                          n <= topic.difficulty ? 'bg-ink-2' : 'bg-surface-3',
                        )}
                      />
                    ))}
                  </div>

                  <IconButton
                    label={`Remover ${topic.title}`}
                    onClick={() => removeTopic(topic.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>

          {/* ── Novo tópico ───────────────────────────── */}
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!newTopic.trim()) return
              addTopic(subject.id, newTopic)
              setNewTopic('')
            }}
          >
            <TextInput
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Adicionar tópico à trilha"
              className="flex-1"
            />
            <Button type="submit" variant="secondary" size="md" disabled={!newTopic.trim()}>
              <Plus size={18} />
            </Button>
          </form>
        </div>
      </div>
    </Sheet>
  )
}
