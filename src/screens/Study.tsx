import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Sparkles } from 'lucide-react'


import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Chip'
import { PageHeader } from '@/components/layout/PageHeader'
import { SubjectCard } from '@/components/study/SubjectCard'
import { SubjectSheet } from '@/components/study/SubjectSheet'

import { useAppStore } from '@/store/appStore'
import { useSuggestions } from '@/store/selectors'
import { pickNextTopic } from '@/lib/studyEngine'
import { pickStable } from '@/lib/utils'
import { COACH_STUDY_START } from '@/data/coach'
import { todayISO } from '@/lib/date'

type Filter = 'todas' | 'prioridade' | 'atrasadas'

/**
 * Plano de estudos. Abre com a sugestão do dia — o usuário não precisa
 * decidir nada para começar; a grade de matérias existe para quem quer olhar.
 */
export function Study() {
  const navigate = useNavigate()
  const subjects = useAppStore((s) => s.subjects)
  const topics = useAppStore((s) => s.topics)
  const startSession = useAppStore((s) => s.startSession)

  const suggestions = useSuggestions()
  const [filter, setFilter] = useState<Filter>('prioridade')
  // Guarda só o id: manter o objeto congelava a tela no estado antigo, e a
  // mudança de peso/força só aparecia ao fechar e reabrir.
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(null)

  const top = suggestions[0]

  const visible = useMemo(() => {
    if (filter === 'todas') return subjects
    if (filter === 'prioridade') {
      return suggestions.filter((s) => s.subject.enabled).map((s) => s.subject)
    }
    // Atrasadas: nunca revisadas ou paradas há 7 dias ou mais.
    return suggestions
      .filter((s) => s.reason.includes('parada') || s.reason.includes('não iniciada'))
      .map((s) => s.subject)
  }, [filter, subjects, suggestions])

  const handleStart = (subjectId: string, topicId: string | null) => {
    startSession(subjectId, topicId)
    setOpenSubjectId(null)
    navigate('/agora')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudos"
        subtitle="O método escolhe a matéria. Você só executa."
      />

      {/* ── Sugestão do dia ─────────────────────────────── */}
      {top && (
        <Card variant="accent" className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-accent" />
            <span className="text-[11px] font-bold tracking-[0.16em] text-accent uppercase">
              Sugestão de agora
            </span>
          </div>

          <h2 className="mt-3 text-[24px] leading-tight font-bold tracking-tight text-ink">
            {top.subject.name}
          </h2>
          <p className="mt-1 text-[14px] text-ink-2">{top.topic?.title ?? 'Revisão geral'}</p>
          <p className="mt-2 text-[12.5px] text-ink-3">
            Escolhida porque {top.reason}.
          </p>

          <p className="mt-4 border-l-2 border-line pl-3 text-[13px] leading-snug text-ink-2">
            {pickStable(COACH_STUDY_START, todayISO())}
          </p>

          <Button
            variant="primary"
            size="lg"
            full
            className="mt-5"
            icon={<Play size={18} />}
            onClick={() => handleStart(top.subject.id, top.topic?.id ?? null)}
          >
            Montar sessão e começar
          </Button>
        </Card>
      )}

      {/* ── Grade de matérias ───────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Toque para ver a trilha e ajustar o peso">Suas matérias</SectionTitle>

        <Segmented
          value={filter}
          options={[
            { value: 'prioridade', label: 'Prioridade' },
            { value: 'atrasadas', label: 'Atrasadas' },
            { value: 'todas', label: 'Todas' },
          ]}
          onChange={setFilter}
          size="sm"
        />

        {visible.length === 0 ? (
          <Card variant="flat" className="py-8 text-center">
            <p className="text-[13px] text-ink-3">
              Nenhuma matéria atrasada. Está tudo em dia — siga a prioridade.
            </p>
          </Card>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {visible.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                topics={topics}
                nextTopic={pickNextTopic(topics.filter((t) => t.subjectId === subject.id))}
                onOpen={() => setOpenSubjectId(subject.id)}
              />
            ))}
          </div>
        )}
      </section>

      <SubjectSheet
        subjectId={openSubjectId}
        onClose={() => setOpenSubjectId(null)}
        onStartSession={handleStart}
      />
    </div>
  )
}
