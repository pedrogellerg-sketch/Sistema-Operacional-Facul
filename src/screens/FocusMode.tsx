import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, CheckCircle2, HelpCircle, SkipForward, X } from 'lucide-react'

import { Button, IconButton } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { TextArea } from '@/components/ui/Field'
import { BlockIcon, blockColor } from '@/components/ui/BlockIcon'
import { SessionRunner } from '@/components/study/SessionRunner'

import { useClock } from '@/hooks/useClock'
import { useAppStore } from '@/store/appStore'
import { useActiveSession, useNow, useSuggestions } from '@/store/selectors'
import { formatDuration, relativeToNow } from '@/lib/date'
import { TIER_LABEL } from '@/lib/studyEngine'

/**
 * Modo execução: uma tarefa por vez, sem navegação, sem lista.
 * Objetivo único — remover a decisão. O usuário lê uma frase e age.
 */
export function FocusMode() {
  const navigate = useNavigate()
  const { minutes, date } = useClock()
  const now = useNow(date, minutes)

  const session = useActiveSession()
  const subjects = useAppStore((s) => s.subjects)
  const setBlockState = useAppStore((s) => s.setBlockState)
  const startSession = useAppStore((s) => s.startSession)
  const cancelSession = useAppStore((s) => s.cancelSession)
  const setDayNotes = useAppStore((s) => s.setDayNotes)
  const dayNotes = useAppStore((s) => s.logs[date]?.notes ?? '')

  const suggestions = useSuggestions(date)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')

  const item = now.current

  // ── Sessão de estudo em andamento tem prioridade sobre tudo ──
  if (session) {
    const subject = subjects.find((s) => s.id === session.subjectId)
    return (
      <div className="min-h-dvh bg-base">
        <div className="safe-top mx-auto flex max-w-lg items-center justify-between px-5 pt-3">
          <p className="text-[11px] font-bold tracking-[0.2em] text-ink-3 uppercase">Em execução</p>
          <IconButton label="Sair do modo execução" onClick={() => navigate('/')}>
            <X size={18} />
          </IconButton>
        </div>

        <div className="mx-auto max-w-lg">
          <SessionRunner
            session={session}
            subjectName={subject?.name ?? 'Estudo'}
            subjectColor={subject?.color ?? 'var(--color-accent)'}
            blockId={item?.kind === 'estudo' ? item.id : undefined}
            onFinish={() => navigate('/')}
            onCancel={() => {
              cancelSession()
              navigate('/')
            }}
          />
        </div>
      </div>
    )
  }

  // ── Nada pendente ────────────────────────────────────────
  if (now.allDone || !item) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-base px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ok/12 text-ok">
          <CheckCircle2 size={30} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">Nada pendente</h1>
        <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-ink-2">
          Você fechou todos os blocos de hoje. Descanse — amanhã o sistema monta o próximo dia.
        </p>
        <Button variant="primary" size="lg" className="mt-7" onClick={() => navigate('/')}>
          Voltar ao painel
        </Button>
      </div>
    )
  }

  const color = blockColor(item.kind)
  const isStudy = item.kind === 'estudo'
  const isWorkout = item.kind === 'treino'

  const handlePrimary = () => {
    if (isStudy) {
      const subjectId =
        item.action?.type === 'estudo' && item.action.subjectId
          ? item.action.subjectId
          : suggestions[0]?.subject.id
      if (!subjectId) {
        setPickerOpen(true)
        return
      }
      startSession(subjectId, null, item.minutes)
      return
    }

    if (isWorkout) {
      navigate('/treino?executar=1')
      return
    }

    setBlockState(item.id, 'feito')
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col bg-base">
      {/* ── Topo minimalista ────────────────────────────── */}
      <div className="safe-top mx-auto flex w-full max-w-lg items-center justify-between px-5 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.2em] text-ink-3 uppercase">Agora</p>
          <p className="tnum mt-0.5 text-[12px] text-ink-3">
            {item.start} · {relativeToNow(item.start, minutes)}
          </p>
        </div>
        <IconButton label="Sair do modo execução" onClick={() => navigate('/')}>
          <X size={18} />
        </IconButton>
      </div>

      {/* ── A tarefa ────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-10">
        <div className="animate-in-up">
          <span
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{
              backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`,
              color,
            }}
          >
            <BlockIcon kind={item.kind} size={28} />
          </span>

          <h1 className="text-[36px] leading-[1.05] font-bold tracking-tight text-ink">
            {item.label}
          </h1>

          {item.detail && (
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{item.detail}</p>
          )}

          {item.minutes > 0 && (
            <p className="tnum mt-6 text-[14px] font-medium text-ink-3">
              Tempo estimado: {formatDuration(item.minutes)}
            </p>
          )}

          {isStudy && (
            <button
              onClick={() => setPickerOpen(true)}
              className="mt-3 text-[13px] font-medium text-accent underline underline-offset-4"
            >
              Trocar matéria
            </button>
          )}
        </div>
      </div>

      {/* ── Três botões, sem mais nada ──────────────────── */}
      <div className="safe-bottom mx-auto w-full max-w-lg space-y-2 px-5 pb-5">
        <Button variant="primary" size="lg" full onClick={handlePrimary} icon={<Check size={19} />}>
          {isStudy ? 'Iniciar sessão' : isWorkout ? 'Abrir treino' : 'Concluir'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            icon={<SkipForward size={16} />}
            onClick={() => {
              setBlockState(item.id, 'pulado')
              navigate('/')
            }}
          >
            Pular
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            icon={<HelpCircle size={16} />}
            onClick={() => {
              setNoteText(dayNotes)
              setNoteOpen(true)
            }}
          >
            Dúvidas
          </Button>
        </div>
      </div>

      {/* ── Troca de matéria ────────────────────────────── */}
      <Sheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Escolher matéria"
        description="Ordenadas pela prioridade do método. A primeira é a recomendada."
      >
        <ul className="space-y-2">
          {suggestions.map(({ subject, topic, reason }, index) => (
            <li key={subject.id}>
              <button
                onClick={() => {
                  startSession(subject.id, topic?.id ?? null, item.minutes)
                  setPickerOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-line-soft bg-surface-2 px-3.5 py-3 text-left transition-colors hover:border-line hover:bg-surface-3"
              >
                <span
                  className="h-9 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: subject.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-ink">
                      {subject.name}
                    </span>
                    {index === 0 && (
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink">
                        SUGERIDA
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">
                    {topic?.title ?? 'Revisão geral'}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-ink-3">
                    {TIER_LABEL[subject.tier]} · {reason}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      {/* ── Dúvidas do dia ──────────────────────────────── */}
      <Sheet
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Dúvidas e observações"
        description="Anote e siga. Você revisa no fim do dia."
        footer={
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              setDayNotes(noteText, date)
              setNoteOpen(false)
            }}
          >
            Salvar
          </Button>
        }
      >
        <TextArea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="O que travou? O que perguntar ao professor?"
          className="min-h-[140px]"
          autoFocus
        />
      </Sheet>
    </div>
  )
}
