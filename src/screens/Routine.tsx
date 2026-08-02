import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, RotateCcw, Settings, Trash2 } from 'lucide-react'

import type { BlockKind, RoutineBlock, Weekday } from '@/types'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip, Toggle, WeekdayPicker } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { NumberStepper, TextInput, TimeInput } from '@/components/ui/Field'
import { BlockIcon, blockColor } from '@/components/ui/BlockIcon'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { WEEKDAY_LABEL, WEEKDAY_LETTER, addMinutes, formatDuration } from '@/lib/date'
import { cn } from '@/lib/utils'

const BLOCK_KINDS: BlockKind[] = [
  'acordar',
  'escola',
  'almoco',
  'lanche',
  'treino',
  'banho',
  'estudo',
  'jantar',
  'revisao',
  'livre',
  'dormir',
]

const KIND_LABEL: Record<BlockKind, string> = {
  acordar: 'Acordar',
  escola: 'Escola',
  almoco: 'Almoço',
  lanche: 'Lanche',
  treino: 'Treino',
  banho: 'Banho',
  estudo: 'Estudo',
  jantar: 'Jantar',
  revisao: 'Revisão',
  livre: 'Livre',
  dormir: 'Dormir',
}

/**
 * Configuração da rotina. O gerador cria a semana-modelo; o usuário ajusta.
 * Editar um dia marca-o como customizado — mudanças globais deixam de
 * sobrescrevê-lo, e um botão devolve o dia ao padrão quando quiser.
 */
export function Routine() {
  const settings = useAppStore((s) => s.routineSettings)
  const week = useAppStore((s) => s.week)
  const updateSettings = useAppStore((s) => s.updateRoutineSettings)
  const regenerateWeek = useAppStore((s) => s.regenerateWholeWeek)
  const resetDay = useAppStore((s) => s.resetDay)
  const updateBlock = useAppStore((s) => s.updateBlock)
  const removeBlock = useAppStore((s) => s.removeBlock)
  const addBlock = useAppStore((s) => s.addBlock)

  const todayWeekday = new Date().getDay() as Weekday
  const [selected, setSelected] = useState<Weekday>(todayWeekday)
  const [editing, setEditing] = useState<RoutineBlock | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ label: '', start: '18:00', minutes: 60, kind: 'estudo' as BlockKind })
  const [confirmReset, setConfirmReset] = useState(false)

  const day = week.find((d) => d.weekday === selected)

  const openEdit = (block: RoutineBlock) => {
    setEditing(block)
    setDraft({ label: block.label, start: block.start, minutes: block.minutes, kind: block.kind })
  }

  const openAdd = () => {
    setAdding(true)
    setDraft({ label: '', start: '18:00', minutes: 60, kind: 'estudo' })
  }

  const saveBlock = () => {
    if (editing) {
      updateBlock(selected, editing.id, {
        label: draft.label.trim() || KIND_LABEL[draft.kind],
        start: draft.start,
        minutes: draft.minutes,
        kind: draft.kind,
      })
      setEditing(null)
    } else {
      addBlock(selected, {
        kind: draft.kind,
        label: draft.label.trim() || KIND_LABEL[draft.kind],
        start: draft.start,
        minutes: draft.minutes,
        fixed: false,
      })
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotina"
        subtitle="Configure uma vez. O sistema monta a semana."
        back="/"
        action={
          <Link to="/ajustes">
            <IconButton label="Ajustes gerais">
              <Settings size={17} />
            </IconButton>
          </Link>
        }
      />

      {/* ── Parâmetros ──────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Mudar aqui regenera os dias que você não editou à mão">
          Seus horários
        </SectionTitle>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TimeInput
              label="Acordar"
              value={settings.wakeTime}
              onChange={(e) => updateSettings({ wakeTime: e.target.value })}
            />
            <TimeInput
              label="Dormir"
              value={settings.sleepTime}
              onChange={(e) => updateSettings({ sleepTime: e.target.value })}
            />
            <TimeInput
              label="Entrada na escola"
              value={settings.schoolStart}
              onChange={(e) => updateSettings({ schoolStart: e.target.value })}
            />
            <TimeInput
              label="Saída (dia normal)"
              value={settings.schoolEnd}
              onChange={(e) => updateSettings({ schoolEnd: e.target.value })}
            />
            <TimeInput
              label="Saída (com aula à tarde)"
              value={settings.schoolEndAfternoon}
              onChange={(e) => updateSettings({ schoolEndAfternoon: e.target.value })}
            />
            <TimeInput
              label="Horário do treino"
              value={settings.workoutTime}
              onChange={(e) => updateSettings({ workoutTime: e.target.value })}
            />
          </div>

          <NumberStepper
            label="Duração do bloco de estudo"
            value={settings.studyBlockMinutes}
            onChange={(v) => updateSettings({ studyBlockMinutes: v })}
            step={15}
            min={30}
            max={180}
            suffix="min"
          />

          <NumberStepper
            label="Duração do treino"
            value={settings.workoutMinutes}
            onChange={(v) => updateSettings({ workoutMinutes: v })}
            step={5}
            min={20}
            max={150}
            suffix="min"
          />
        </Card>
      </section>

      {/* ── Dias ────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle>Dias da semana</SectionTitle>

        <Card className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Dias com aula à tarde</p>
            <WeekdayPicker
              value={settings.afternoonClassDays}
              onChange={(days) => updateSettings({ afternoonClassDays: days as Weekday[] })}
              labels={WEEKDAY_LETTER}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Dias de treino</p>
            <WeekdayPicker
              value={settings.workoutDays}
              onChange={(days) => updateSettings({ workoutDays: days as Weekday[] })}
              labels={WEEKDAY_LETTER}
            />
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Dias leves (só revisão)</p>
            <WeekdayPicker
              value={settings.lightDays}
              onChange={(days) => updateSettings({ lightDays: days as Weekday[] })}
              labels={WEEKDAY_LETTER}
            />
          </div>
        </Card>
      </section>

      {/* ── Semana-modelo ───────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle
          action={
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-ink-3 transition-colors hover:text-ink-2"
            >
              <RotateCcw size={13} />
              Regerar tudo
            </button>
          }
        >
          Semana-modelo
        </SectionTitle>

        {/* Seletor de dia */}
        <div className="flex gap-1.5">
          {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((wd) => {
            const active = wd === selected
            const dayData = week.find((d) => d.weekday === wd)
            return (
              <button
                key={wd}
                onClick={() => setSelected(wd)}
                className={cn(
                  'relative h-11 flex-1 rounded-xl text-[13px] font-semibold transition-colors',
                  active
                    ? 'bg-accent text-accent-ink'
                    : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink-2',
                )}
              >
                {WEEKDAY_LETTER[wd]}
                {dayData?.customized && (
                  <span
                    className={cn(
                      'absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full',
                      active ? 'bg-accent-ink/50' : 'bg-accent',
                    )}
                    title="Dia editado à mão"
                  />
                )}
              </button>
            )
          })}
        </div>

        {day && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">{WEEKDAY_LABEL[selected]}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {day.afternoonClass && <Chip color="var(--color-dom-school)">Aula à tarde</Chip>}
                  {day.workout && <Chip color="var(--color-dom-workout)">Treino</Chip>}
                  {day.customized && <Chip color="var(--color-accent)">Editado</Chip>}
                </div>
              </div>

              {day.customized && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={13} />}
                  onClick={() => resetDay(selected)}
                >
                  Padrão
                </Button>
              )}
            </div>

            <div className="space-y-2 border-t border-line-soft pt-3">
              <Toggle
                checked={day.afternoonClass}
                onChange={() => {
                  const list = new Set(settings.afternoonClassDays)
                  if (day.afternoonClass) list.delete(selected)
                  else list.add(selected)
                  updateSettings({ afternoonClassDays: [...list].sort() as Weekday[] })
                }}
                label="Tem aula à tarde"
                description="Remonta o dia com janela de estudo à noite"
              />

              <Toggle
                checked={day.workout}
                onChange={() => {
                  const list = new Set(settings.workoutDays)
                  if (day.workout) list.delete(selected)
                  else list.add(selected)
                  updateSettings({ workoutDays: [...list].sort() as Weekday[] })
                }}
                label="Dia de treino"
              />
            </div>

            {/* Blocos do dia */}
            <ul className="space-y-1.5 border-t border-line-soft pt-3">
              {day.blocks.map((block) => (
                <li
                  key={block.id}
                  className="flex items-center gap-3 rounded-2xl border border-line-soft bg-surface-2 px-3 py-2.5"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${blockColor(block.kind)} 14%, transparent)`,
                      color: blockColor(block.kind),
                    }}
                  >
                    <BlockIcon kind={block.kind} size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{block.label}</p>
                    <p className="tnum text-[11.5px] text-ink-3">
                      {block.start}
                      {block.minutes > 0 &&
                        ` – ${addMinutes(block.start, block.minutes)} · ${formatDuration(block.minutes)}`}
                    </p>
                  </div>

                  <IconButton
                    label={`Editar ${block.label}`}
                    onClick={() => openEdit(block)}
                    className="h-8 w-8"
                  >
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    label={`Remover ${block.label}`}
                    onClick={() => removeBlock(selected, block.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </li>
              ))}
            </ul>

            <Button variant="outline" size="md" full icon={<Plus size={16} />} onClick={openAdd}>
              Adicionar bloco
            </Button>
          </Card>
        )}
      </section>

      {/* ── Editor de bloco ─────────────────────────────── */}
      <Sheet
        open={Boolean(editing) || adding}
        onClose={() => {
          setEditing(null)
          setAdding(false)
        }}
        title={editing ? 'Editar bloco' : 'Novo bloco'}
        description={`${WEEKDAY_LABEL[selected]} — o dia será marcado como editado`}
        footer={
          <Button variant="primary" size="lg" full onClick={saveBlock}>
            Salvar bloco
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Tipo</p>
            <div className="grid grid-cols-4 gap-1.5">
              {BLOCK_KINDS.map((kind) => (
                <button
                  key={kind}
                  onClick={() => setDraft((d) => ({ ...d, kind }))}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[10.5px] font-medium transition-colors',
                    draft.kind === kind
                      ? 'border-accent/40 bg-surface-3 text-ink'
                      : 'border-line-soft bg-surface-2 text-ink-3 hover:text-ink-2',
                  )}
                >
                  <BlockIcon kind={kind} size={16} />
                  {KIND_LABEL[kind]}
                </button>
              ))}
            </div>
          </div>

          <TextInput
            label="Nome do bloco"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder={KIND_LABEL[draft.kind]}
          />

          <TimeInput
            label="Começa às"
            value={draft.start}
            onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
          />

          <NumberStepper
            label="Duração"
            value={draft.minutes}
            onChange={(v) => setDraft((d) => ({ ...d, minutes: v }))}
            step={5}
            min={0}
            max={480}
            suffix="min"
          />
        </div>
      </Sheet>

      {/* ── Confirmação de regeneração ──────────────────── */}
      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Regerar a semana inteira?"
        description="Todos os dias voltam ao padrão gerado. As edições manuais serão perdidas."
        footer={
          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              full
              onClick={() => {
                regenerateWeek()
                setConfirmReset(false)
              }}
            >
              Sim, regerar
            </Button>
            <Button variant="ghost" size="md" full onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-2">
          Seu histórico, notas e registros não são afetados — apenas a estrutura dos blocos da
          semana.
        </p>
      </Sheet>
    </div>
  )
}
