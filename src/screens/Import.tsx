import { useRef, useState } from 'react'
import { AlertTriangle, Check, FileText, Trash2, Upload } from 'lucide-react'

import type { CurriculumLesson, LessonKind } from '@/types/curriculum'
import type { ParsedDoc } from '@/lib/curriculum/parser'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { Chip, Segmented } from '@/components/ui/Chip'
import { TextInput } from '@/components/ui/Field'
import { PageHeader } from '@/components/layout/PageHeader'

import { useAppStore } from '@/store/appStore'
import { useCurriculumStore } from '@/store/curriculumStore'
import { parsePlan } from '@/lib/curriculum/parser'
import { extractPdfText } from '@/lib/curriculum/pdf'
import { cn } from '@/lib/utils'

const KIND_LABEL: Record<LessonKind, string> = {
  aula: 'Aula',
  avaliacao: 'Prova',
  correcao: 'Correção',
  revisao: 'Revisão',
  feriado: 'Feriado',
  sem_aula: 'Sem aula',
}

const SUBJECT_OPTIONS = [
  ['mat', 'Matemática'], ['fis', 'Física'], ['qui', 'Química'],
  ['bio1', 'Biologia I'], ['bio2', 'Biologia II'], ['his', 'História'],
  ['geo', 'Geografia'], ['red', 'Redação'], ['lit', 'Literatura'],
  ['efl', 'Est. da Língua'], ['fil', 'Filosofia'], ['soc', 'Sociologia'],
] as const

/**
 * Importação dos planos de aula.
 *
 * O passo de conferência não é formalidade: os documentos reais da escola têm
 * Biologia em ordem decrescente, número de aula repetido em Geografia e
 * bimestre errado no cabeçalho de Matemática. Salvar direto significaria
 * estudar o bimestre ao contrário.
 */
export function ImportPlans() {
  const fileRef = useRef<HTMLInputElement>(null)
  const subjects = useAppStore((s) => s.subjects)
  const importLessons = useCurriculumStore((s) => s.importLessons)
  const importedSubjects = useCurriculumStore((s) => s.importedSubjects)
  const allLessons = useCurriculumStore((s) => s.lessons)
  const clearSubject = useCurriculumStore((s) => s.clearSubject)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [doc, setDoc] = useState<ParsedDoc | null>(null)
  const [draft, setDraft] = useState<CurriculumLesson[]>([])
  const [subjectId, setSubjectId] = useState<string>('mat')
  const [saved, setSaved] = useState('')

  const handleFile = async (file: File) => {
    setBusy(true)
    setError('')
    setSaved('')
    try {
      const text = await extractPdfText(file)
      const parsed = parsePlan(text)
      setDoc(parsed)
      setSubjectId(parsed.subjectGuess ?? 'mat')
      setDraft(parsed.lessons)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ler o PDF.')
    } finally {
      setBusy(false)
    }
  }

  const confirm = () => {
    const finalLessons = draft.map((l, i) => ({ ...l, subjectId, order: i + 1 }))
    importLessons(subjectId, finalLessons)
    setSaved(`${finalLessons.length} aulas salvas no Banco Curricular. O PDF pode ser descartado.`)
    setDoc(null)
    setDraft([])
  }

  const patch = (id: string, p: Partial<CurriculumLesson>) =>
    setDraft((d) => d.map((l) => (l.id === id ? { ...l, ...p } : l)))

  const remove = (id: string) => setDraft((d) => d.filter((l) => l.id !== id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar planos"
        subtitle="O PDF alimenta o banco uma vez. Depois ele não é mais necessário."
        back="/amanha"
      />

      {/* ── Já importados ───────────────────────────────── */}
      {importedSubjects.length > 0 && (
        <section className="space-y-3">
          <SectionTitle hint={`${allLessons.length} aulas no banco`}>Já no banco</SectionTitle>
          <Card className="space-y-1.5">
            {importedSubjects.map((id) => {
              const count = allLessons.filter((l) => l.subjectId === id).length
              const name =
                subjects.find((s) => s.id === id)?.name ??
                SUBJECT_OPTIONS.find(([v]) => v === id)?.[1] ??
                id
              return (
                <div key={id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Check size={15} className="shrink-0 text-ok" />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{name}</span>
                  <span className="tnum shrink-0 text-[12px] text-ink-3">{count} aulas</span>
                  <IconButton label={`Remover ${name}`} onClick={() => clearSubject(id)} className="h-8 w-8">
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {saved && (
        <Card variant="flat" className="flex items-center gap-3 border-ok/25 py-3.5">
          <Check size={17} className="shrink-0 text-ok" />
          <p className="text-[13px] text-ink-2">{saved}</p>
        </Card>
      )}

      {/* ── Upload ──────────────────────────────────────── */}
      {!doc && (
        <Card className="p-6 text-center">
          <FileText size={26} className="mx-auto mb-3 text-ink-3" />
          <p className="text-[15px] font-semibold text-ink">Envie o plano de aula em PDF</p>
          <p className="mt-1.5 text-[13px] text-ink-2">
            O texto é lido no seu próprio aparelho. Nada é enviado para servidor.
          </p>

          <Button
            variant="primary"
            size="lg"
            full
            className="mt-5"
            disabled={busy}
            icon={<Upload size={17} />}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? 'Lendo o PDF…' : 'Escolher arquivo'}
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
              e.target.value = ''
            }}
          />

          {error && <p className="mt-3 text-[13px] text-danger">{error}</p>}
        </Card>
      )}

      {/* ── Prévia para conferência ─────────────────────── */}
      {doc && (
        <>
          <Card variant="accent" className="p-5">
            <p className="text-[11px] font-bold tracking-[0.16em] text-accent uppercase">
              Confira antes de salvar
            </p>
            <h2 className="mt-2 text-[20px] font-bold text-ink">
              {doc.subjectName ?? 'Disciplina não identificada'}
            </h2>
            <p className="mt-1 text-[13px] text-ink-2">
              {draft.length} aulas reconhecidas · layout {doc.profile.replace('_', ' ')}
              {doc.bimester ? ` · ${doc.bimester}º bimestre` : ''}
              {doc.year ? ` · ${doc.year}` : ''}
            </p>

            <div className="mt-4">
              <p className="mb-2 text-[12px] font-medium text-ink-2">Disciplina no sistema</p>
              <div className="grid grid-cols-3 gap-1.5">
                {SUBJECT_OPTIONS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setSubjectId(value)}
                    className={cn(
                      'rounded-xl px-2 py-2 text-[11.5px] font-medium transition-colors',
                      subjectId === value
                        ? 'bg-accent text-accent-ink'
                        : 'bg-surface-3 text-ink-2 hover:text-ink',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {doc.warnings.length > 0 && (
            <Card variant="flat" className="border-warn/25">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warn" />
                <p className="text-[13px] font-semibold text-ink">
                  {doc.warnings.length === 1
                    ? '1 ponto para conferir'
                    : `${doc.warnings.length} pontos para conferir`}
                </p>
              </div>
              <ul className="space-y-1.5">
                {doc.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warn" />
                    {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <section className="space-y-3">
            <SectionTitle hint="Toque para corrigir o título ou mudar o tipo">
              Aulas reconhecidas
            </SectionTitle>

            <div className="space-y-2">
              {draft.map((l, i) => (
                <Card key={l.id} className="p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span className="tnum mt-2.5 w-7 shrink-0 text-right text-[12px] font-semibold text-ink-3">
                      {i + 1}
                    </span>

                    <div className="min-w-0 flex-1 space-y-2">
                      <TextInput
                        value={l.title}
                        onChange={(e) => patch(l.id, { title: e.target.value })}
                        className="text-[13.5px]"
                      />

                      <div className="flex flex-wrap items-center gap-1.5">
                        <Segmented
                          value={l.kind}
                          options={[
                            { value: 'aula' as LessonKind, label: 'Aula' },
                            { value: 'avaliacao' as LessonKind, label: 'Prova' },
                            { value: 'feriado' as LessonKind, label: 'Feriado' },
                          ]}
                          onChange={(kind) => patch(l.id, { kind })}
                          size="sm"
                          className="max-w-[240px]"
                        />
                        <IconButton
                          label={`Remover ${l.title}`}
                          onClick={() => remove(l.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {l.declaredDate && <Chip color="var(--color-accent)">{l.declaredDate}</Chip>}
                        {l.week && <Chip>Semana {l.week}</Chip>}
                        {l.span > 1 && <Chip>{l.span} aulas</Chip>}
                        {l.track && <Chip>{l.track}</Chip>}
                        {l.objectives.length > 0 && (
                          <Chip>{l.objectives.length} objetivos</Chip>
                        )}
                        {l.material.book && <Chip>{l.material.book}</Chip>}
                        {l.kind !== 'aula' && <Chip>{KIND_LABEL[l.kind]}</Chip>}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <div className="safe-bottom sticky bottom-20 space-y-2 lg:bottom-4">
            <Button variant="primary" size="lg" full onClick={confirm} disabled={draft.length === 0}>
              Salvar {draft.length} aulas no banco
            </Button>
            <Button
              variant="ghost"
              size="md"
              full
              onClick={() => {
                setDoc(null)
                setDraft([])
              }}
            >
              Descartar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
