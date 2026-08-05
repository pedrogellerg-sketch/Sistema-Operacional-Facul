import { ExternalLink, Play, Search } from 'lucide-react'

import type { CurriculumLesson } from '@/types/curriculum'
import { Chip } from '@/components/ui/Chip'
import { findVideos, youtubeSearchUrl } from '@/data/videoCatalog'
import { useCurriculumStore } from '@/store/curriculumStore'

/**
 * Tudo o que se sabe sobre uma aula, sem cortar nada.
 *
 * Existe porque o conteúdo aparecia truncado justamente na hora de confirmar o
 * que o professor deu — e confirmar às cegas é pior que não confirmar, já que o
 * relato desloca o cronograma inteiro da disciplina.
 *
 * É um só componente de propósito: a mesma leitura serve para preparar a aula
 * de amanhã, para conferir o que caiu hoje e para abrir um dia qualquer do
 * calendário. Três telas, uma fonte de verdade sobre como uma aula é exibida.
 */
export function LessonDetail({
  lesson,
  subjectName,
  showVideos = true,
}: {
  lesson: CurriculumLesson
  subjectName: string
  /** A confirmação do dia mostra vídeo; uma prévia curta pode não querer. */
  showVideos?: boolean
}) {
  const customVideos = useCurriculumStore((s) => s.customVideos)
  const videos = showVideos ? findVideos(lesson.title, lesson.subjectId, customVideos) : []

  const material = [
    lesson.material.book,
    lesson.material.chapter,
    lesson.material.pages,
    lesson.material.exercises,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      {/* ── Título completo, sem corte ─────────────────── */}
      <div>
        <p className="text-[15px] leading-snug font-semibold text-ink">{lesson.title}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>Aula {lesson.number}</Chip>
          {lesson.span > 1 && <Chip>{lesson.span} encontros</Chip>}
          {lesson.track && <Chip>{lesson.track}</Chip>}
          {lesson.kind !== 'aula' && <Chip color="var(--color-warn)">{lesson.kind}</Chip>}
        </div>
      </div>

      {/* ── Objetivos: todos, não os cinco primeiros ───── */}
      {lesson.objectives.length > 0 && (
        <div>
          <p className="mb-2 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
            O que a aula cobre
          </p>
          <ul className="space-y-1.5">
            {lesson.objectives.map((o, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.strategies.length > 0 && (
        <div>
          <p className="mb-2 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
            Como o professor conduz
          </p>
          <ul className="space-y-1.5">
            {lesson.strategies.map((s, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Exercícios da apostila, em destaque ────────── */}
      {(lesson.material.pages || lesson.material.exercises) && (
        <div className="rounded-2xl border border-accent/25 bg-accent/[0.06] px-3.5 py-3">
          <p className="text-[11.5px] font-semibold tracking-wide text-accent uppercase">
            Exercícios {lesson.material.book ? `— ${lesson.material.book}` : 'da apostila'}
          </p>
          <p className="mt-1 text-[14px] leading-snug font-semibold text-ink">
            {[lesson.material.chapter, lesson.material.pages, lesson.material.exercises]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      )}

      {(lesson.homework || material.length > 0) && (
        <div className="rounded-2xl border border-line-soft bg-surface-2 px-3.5 py-3">
          <p className="text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
            Tarefa de casa
          </p>
          {lesson.homework ? (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{lesson.homework}</p>
          ) : (
            <p className="mt-1 text-[12.5px] text-ink-3">{material.join(' · ')}</p>
          )}
        </div>
      )}

      {/* ── Videoaulas do assunto ──────────────────────── */}
      {showVideos && (
        <div>
          <p className="mb-2 text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
            Videoaulas deste conteúdo
          </p>
          <div className="space-y-2">
            {videos.map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface px-3.5 py-3 transition-colors hover:border-line hover:bg-surface-2"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <Play size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] leading-snug font-semibold text-ink">
                    {v.title}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-ink-3">
                    {v.channel} · {v.minutes}min
                  </span>
                </span>
                <ExternalLink size={13} className="shrink-0 text-ink-3" />
              </a>
            ))}

            <a
              href={youtubeSearchUrl(lesson.title, subjectName)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 rounded-2xl border border-dashed border-line px-3.5 py-3 text-[13px] text-ink-2 transition-colors hover:text-ink"
            >
              <Search size={15} />
              {videos.length > 0 ? 'Buscar outros vídeos' : 'Buscar vídeo no YouTube'}
              <ExternalLink size={12} className="ml-auto text-ink-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
