import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Trash2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { TextInput } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { exportStateToFile, readStateFromFile } from '@/lib/persistence'
import { TIER_DESCRIPTION, TIER_LABEL } from '@/lib/studyEngine'
import type { SubjectTier } from '@/types'

const TIER_OPTIONS: Array<{ value: SubjectTier; label: string }> = [
  { value: 'nucleo', label: 'Núcleo' },
  { value: 'apoio', label: 'Apoio' },
  { value: 'leve', label: 'Leve' },
  { value: 'opcional', label: 'Opcional' },
]

/** Perfil, peso das matérias e gestão dos dados (backup, importação, reset). */
export function SettingsScreen() {
  const profile = useAppStore((s) => s.profile)
  const subjects = useAppStore((s) => s.subjects)
  const updateProfile = useAppStore((s) => s.updateProfile)
  const updateSubject = useAppStore((s) => s.updateSubject)
  const exportState = useAppStore((s) => s.exportState)
  const importState = useAppStore((s) => s.importState)
  const resetAll = useAppStore((s) => s.resetAll)

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState('')

  const handleImport = async (file: File) => {
    try {
      const data = await readStateFromFile(file)
      setMessage(
        importState(data)
          ? 'Backup importado. Seus dados foram restaurados.'
          : 'Arquivo inválido: não parece um backup do Sistema Fernando.',
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível importar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ajustes" subtitle="Perfil, matérias e seus dados." back="/" />

      {/* ── Perfil ──────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle>Perfil</SectionTitle>

        <Card className="space-y-3">
          <TextInput
            label="Nome"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="Seu nome"
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Série"
              value={profile.grade}
              onChange={(e) => updateProfile({ grade: e.target.value })}
              placeholder="3º ano"
            />
            <TextInput
              label="Foco"
              value={profile.targetExam}
              onChange={(e) => updateProfile({ targetExam: e.target.value })}
              placeholder="ENEM"
            />
          </div>
        </Card>
      </section>

      {/* ── Matérias ────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Define quanto espaço cada matéria ocupa na semana">
          Peso das matérias
        </SectionTitle>

        <div className="space-y-2">
          {subjects.map((subject) => (
            <Card key={subject.id} className="p-3.5">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  className="h-7 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: subject.color }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-ink">{subject.name}</p>
                  <p className="text-[11.5px] text-ink-3">{TIER_LABEL[subject.tier]}</p>
                </div>

                <button
                  onClick={() => updateSubject(subject.id, { enabled: !subject.enabled })}
                  className="shrink-0 text-[12px] font-medium text-ink-3 transition-colors hover:text-ink-2"
                >
                  {subject.enabled ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              {subject.enabled && (
                <>
                  <Segmented
                    value={subject.tier}
                    options={TIER_OPTIONS}
                    onChange={(tier) => updateSubject(subject.id, { tier })}
                    size="sm"
                  />
                  <p className="mt-2 text-[11.5px] leading-snug text-ink-3">
                    {TIER_DESCRIPTION[subject.tier]}
                  </p>
                </>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ── Rotina ──────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle>Rotina</SectionTitle>
        <Link to="/rotina">
          <Card className="flex items-center justify-between gap-3 transition-colors hover:bg-surface-2">
            <div>
              <p className="text-[14.5px] font-semibold text-ink">Horários e semana-modelo</p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">
                Escola, treino, estudo, sono e blocos do dia
              </p>
            </div>
            <span className="shrink-0 text-[13px] font-medium text-accent">Abrir</span>
          </Card>
        </Link>
      </section>

      {/* ── Dados ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle hint="Tudo fica salvo no seu aparelho. Nada é enviado para servidor.">
          Seus dados
        </SectionTitle>

        {message && (
          <Card variant="flat" className="py-3">
            <p className="text-[13px] text-ink-2">{message}</p>
          </Card>
        )}

        <Card className="space-y-2">
          <Button
            variant="outline"
            size="md"
            full
            icon={<Download size={16} />}
            onClick={() => exportStateToFile(exportState())}
          >
            Exportar backup
          </Button>

          <Button
            variant="outline"
            size="md"
            full
            icon={<Upload size={16} />}
            onClick={() => fileRef.current?.click()}
          >
            Importar backup
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImport(file)
              e.target.value = ''
            }}
          />

          <Button
            variant="danger"
            size="md"
            full
            icon={<Trash2 size={16} />}
            onClick={() => setConfirmReset(true)}
          >
            Apagar tudo e recomeçar
          </Button>
        </Card>
      </section>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Apagar todos os dados?"
        description="Histórico, trilhas, treinos e registros serão perdidos."
        footer={
          <div className="space-y-2">
            <Button
              variant="danger"
              size="lg"
              full
              onClick={() => {
                resetAll()
                setConfirmReset(false)
                setMessage('Tudo apagado. O app voltou ao estado inicial.')
              }}
            >
              Sim, apagar tudo
            </Button>
            <Button variant="ghost" size="md" full onClick={() => setConfirmReset(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-2">
          Esta ação não pode ser desfeita. Se quiser guardar seu progresso, exporte um backup antes.
        </p>
      </Sheet>
    </div>
  )
}
