import { useState } from 'react'
import { ExternalLink, Play, Search } from 'lucide-react'

import type { StudyStepKind } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { QuestionRunner, type QuestionScore } from '@/components/study/QuestionRunner'
import { useCurriculumStore } from '@/store/curriculumStore'
import { findVideos, youtubeSearchUrl } from '@/data/videoCatalog'

interface StepMaterialProps {
  kind: StudyStepKind
  subjectId: string
  subjectName: string
  topicTitle: string
  topicId?: string | null
  /** Quantas questões o passo pede — vem da instrução da sessão. */
  exerciseCount?: number
  onExerciseProgress?: (score: QuestionScore) => void
}

/**
 * Entrega o material do passo atual, dentro da sessão cronometrada.
 *
 * Existe para fechar um buraco que o modo execução tinha: a sessão dizia
 * "assista a videoaula" e "faça 15 questões", mas não dava acesso a nenhuma das
 * duas. Para estudar de verdade era preciso sair da sessão — e o cronômetro,
 * que é o ponto do modo execução, ficava para trás.
 *
 * Só aparece nos dois passos que têm material: videoaula e exercícios. Nos
 * outros (revisão, dúvidas) a instrução já basta, e um painel vazio só
 * competiria com o cronômetro por atenção.
 *
 * O cronômetro é baseado em relógio real (`useTimer`), então abrir o vídeo no
 * YouTube e voltar não atrapalha a contagem.
 */
export function StepMaterial({
  kind,
  subjectId,
  subjectName,
  topicTitle,
  topicId,
  exerciseCount = 10,
  onExerciseProgress,
}: StepMaterialProps) {
  const customVideos = useCurriculumStore((s) => s.customVideos)
  const [exercisesOpen, setExercisesOpen] = useState(false)

  if (kind === 'videoaula') {
    const videos = findVideos(topicTitle, subjectId, customVideos)

    return (
      <div className="mt-6 space-y-2">
        <p className="text-[11.5px] font-semibold tracking-wide text-ink-3 uppercase">
          Videoaula para este passo
        </p>

        {videos.length > 0 ? (
          videos.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface px-4 py-3 transition-colors hover:border-line hover:bg-surface-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <Play size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">
                  {v.title}
                </span>
                <span className="tnum mt-0.5 block truncate text-[12px] text-ink-3">
                  {v.channel} · ~{v.minutes}min
                </span>
              </span>
              <ExternalLink size={15} className="shrink-0 text-ink-3" />
            </a>
          ))
        ) : (
          /**
           * Sem vídeo cadastrado, uma busca pronta é melhor que espaço vazio: o
           * usuário ainda economiza o passo de formular o termo.
           */
          <a
            href={youtubeSearchUrl(topicTitle, subjectName)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 transition-colors hover:bg-surface-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-ink-2">
              <Search size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-ink">
                Buscar no YouTube
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-ink-3">
                Sem vídeo curado para "{topicTitle}"
              </span>
            </span>
            <ExternalLink size={15} className="shrink-0 text-ink-3" />
          </a>
        )}
      </div>
    )
  }

  if (kind === 'exercicios') {
    return (
      <div className="mt-6">
        {exercisesOpen ? (
          <QuestionRunner
            subjectId={subjectId}
            title={topicTitle}
            topicId={topicId}
            count={exerciseCount}
            onProgress={onExerciseProgress}
          />
        ) : (
          <Card variant="flat" className="text-center">
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              Questões reais de ENEM, Fuvest, FGV e Insper, escolhidas pelo assunto do passo.
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-4"
              full
              onClick={() => setExercisesOpen(true)}
            >
              Abrir questões
            </Button>
          </Card>
        )}
      </div>
    )
  }

  return null
}
