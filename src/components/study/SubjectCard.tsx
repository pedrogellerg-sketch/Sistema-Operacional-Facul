import { ChevronRight } from 'lucide-react'

import type { Subject, Topic } from '@/types'
import { Chip } from '@/components/ui/Chip'
import { ProgressBar } from '@/components/ui/Progress'
import { STATUS_COLOR, STATUS_LABEL, TIER_LABEL, subjectProgress } from '@/lib/studyEngine'
import { daysBetween, todayISO } from '@/lib/date'

interface SubjectCardProps {
  subject: Subject
  topics: Topic[]
  nextTopic: Topic | null
  onOpen: () => void
}

/** Quadro da matéria: status, próximo tópico, última revisão, dificuldade e exercícios. */
export function SubjectCard({ subject, topics, nextTopic, onOpen }: SubjectCardProps) {
  const mine = topics.filter((t) => t.subjectId === subject.id)
  const progress = subjectProgress(subject.id, topics)
  const exercises = mine.reduce((acc, t) => acc + t.exercisesDone, 0)
  const mastered = mine.filter((t) => t.status === 'dominado').length

  const lastReview = mine
    .map((t) => t.lastReviewedAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1)

  const daysSince = lastReview ? daysBetween(lastReview, todayISO()) : null

  return (
    <button
      onClick={onOpen}
      className="w-full rounded-[var(--radius-card)] border border-line-soft bg-surface p-4 text-left transition-colors hover:border-line hover:bg-surface-2"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1 h-10 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: subject.color }}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[16px] font-bold text-ink">{subject.name}</h3>
            {!subject.enabled && (
              <span className="shrink-0 text-[11px] text-ink-3">desativada</span>
            )}
          </div>

          <p className="mt-0.5 truncate text-[13px] text-ink-2">
            {nextTopic ? nextTopic.title : 'Trilha concluída'}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {nextTopic && (
              <Chip color={STATUS_COLOR[nextTopic.status]}>{STATUS_LABEL[nextTopic.status]}</Chip>
            )}
            <Chip>{TIER_LABEL[subject.tier]}</Chip>
            <Chip>{'●'.repeat(nextTopic?.difficulty ?? 3)}</Chip>
          </div>
        </div>

        <ChevronRight size={18} className="mt-1 shrink-0 text-ink-3" />
      </div>

      <div className="mt-3.5">
        <ProgressBar value={progress} color={subject.color} />
        <div className="tnum mt-2 flex items-center justify-between text-[11.5px] text-ink-3">
          <span>
            {mastered}/{mine.length} dominados · {exercises} exercícios
          </span>
          <span>
            {daysSince == null
              ? 'nunca revisada'
              : daysSince === 0
                ? 'revisada hoje'
                : `há ${daysSince}d`}
          </span>
        </div>
      </div>
    </button>
  )
}
