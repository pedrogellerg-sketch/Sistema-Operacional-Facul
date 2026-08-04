import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ISODate } from '@/types'
import type {
  CurriculumLesson,
  Doubt,
  DoubtOrigin,
  ExamId,
  GridSlot,
  QuestionAttempt,
  RealClassOutcome,
  RealClassReport,
  SchoolCalendar,
  SimuladoResult,
  TopicState,
  VideoRef,
} from '@/types/curriculum'

import { buildSeedCalendar, buildSeedGrid } from '@/data/school'
import curriculumSeed from '@/data/curriculumSeed.json'
import { localStorageAdapter } from '@/lib/persistence'
import { todayISO } from '@/lib/date'
import { uid } from '@/lib/utils'

/**
 * Store do Banco Curricular — separado do store principal de propósito.
 *
 * O Zustand reescreve o blob inteiro a cada alteração. O banco curricular pesa
 * ~70 KB e muda só na importação; o estado do dia muda a cada toque. Juntos,
 * marcar uma refeição reescreveria 70 KB de plano de aula sem necessidade.
 * Separados, cada um paga só o próprio peso.
 */

interface CurriculumState {
  lessons: CurriculumLesson[]
  grid: GridSlot[]
  calendar: SchoolCalendar
  /** Deslocamento em aulas por disciplina, alimentado pelo "Aula Real". */
  offsets: Record<string, number>
  reports: RealClassReport[]
  doubts: Doubt[]
  /** Estado de aprendizagem por tópico — a máquina de estados da Sprint 2. */
  topicStates: Record<string, TopicState>
  /** Data da próxima revisão agendada, por tópico. */
  nextReview: Record<string, ISODate>
  attempts: QuestionAttempt[]
  customVideos: VideoRef[]
  simulados: SimuladoResult[]
  targetExams: ExamId[]
  /** Disciplinas cujo plano já foi importado. */
  importedSubjects: string[]
}

interface CurriculumActions {
  importLessons: (subjectId: string, lessons: CurriculumLesson[]) => void
  clearSubject: (subjectId: string) => void
  updateLesson: (id: string, patch: Partial<CurriculumLesson>) => void

  setGrid: (grid: GridSlot[]) => void
  setCalendar: (calendar: SchoolCalendar) => void

  reportRealClass: (data: { date: ISODate; subjectId: string; outcome: RealClassOutcome; note?: string }) => void
  undoReport: (id: string) => void

  setTopicState: (topicId: string, state: TopicState) => void
  scheduleReview: (topicId: string, date: ISODate) => void

  addDoubt: (data: { topicId: string; subjectId: string; text: string; origin: DoubtOrigin }) => void
  resolveDoubt: (id: string, answer: string) => void
  removeDoubt: (id: string) => void

  recordAttempt: (attempt: Omit<QuestionAttempt, 'date'>) => void
  addCustomVideo: (video: Omit<VideoRef, 'id' | 'custom'>) => void
  removeCustomVideo: (id: string) => void

  addSimulado: (result: Omit<SimuladoResult, 'id'>) => void
  setTargetExams: (exams: ExamId[]) => void

  resetCurriculum: () => void
}

export type CurriculumStore = CurriculumState & CurriculumActions

/** Quanto cada resultado de "Aula Real" desloca a fila da disciplina. */
const OFFSET_DELTA: Record<RealClassOutcome, number> = {
  normal: 0,
  // Atrasou ou cancelou: a aula planejada não aconteceu, volta para a fila.
  atrasou: 1,
  cancelada: 1,
  // Adiantou: consumiu uma aula a mais do que o previsto.
  adiantou: -1,
  // Conteúdo diferente não desloca a fila — o que estava previsto continua devendo.
  conteudo_diferente: 0,
}

/**
 * O app já nasce com os nove planos da escola carregados.
 *
 * Este sistema é de uma pessoa só, com uma escola só: pedir para reimportar
 * nove PDFs a cada troca de aparelho seria fricção inventada. O importador
 * continua existindo para quando a escola publicar os planos do próximo
 * bimestre.
 */
function initialState(): CurriculumState {
  return {
    lessons: curriculumSeed.lessons as CurriculumLesson[],
    grid: buildSeedGrid(),
    calendar: buildSeedCalendar(),
    offsets: {},
    reports: [],
    doubts: [],
    topicStates: {},
    nextReview: {},
    attempts: [],
    customVideos: [],
    simulados: [],
    targetExams: ['enem', 'fuvest', 'unicamp', 'unesp'],
    importedSubjects: curriculumSeed.imported,
  }
}

export const useCurriculumStore = create<CurriculumStore>()(
  persist(
    (set, get) => ({
      ...initialState(),

      // ── Banco Curricular ─────────────────────────────
      importLessons: (subjectId, lessons) =>
        set((s) => ({
          // Reimportar substitui o plano da disciplina inteiro. Estados,
          // dúvidas e desempenho vivem em outras chaves e sobrevivem.
          lessons: [...s.lessons.filter((l) => l.subjectId !== subjectId), ...lessons],
          importedSubjects: [...new Set([...s.importedSubjects, subjectId])],
        })),

      clearSubject: (subjectId) =>
        set((s) => ({
          lessons: s.lessons.filter((l) => l.subjectId !== subjectId),
          importedSubjects: s.importedSubjects.filter((x) => x !== subjectId),
        })),

      updateLesson: (id, patch) =>
        set((s) => ({ lessons: s.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),

      setGrid: (grid) => set({ grid }),
      setCalendar: (calendar) => set({ calendar }),

      // ── Aula Real ────────────────────────────────────
      reportRealClass: ({ date, subjectId, outcome, note }) => {
        const delta = OFFSET_DELTA[outcome]
        const report: RealClassReport = {
          id: uid('rc-'),
          date,
          subjectId,
          outcome,
          note: note ?? '',
          offsetDelta: delta,
        }
        set((s) => ({
          reports: [...s.reports, report],
          offsets: { ...s.offsets, [subjectId]: (s.offsets[subjectId] ?? 0) + delta },
        }))
      },

      undoReport: (id) => {
        const report = get().reports.find((r) => r.id === id)
        if (!report) return
        set((s) => ({
          reports: s.reports.filter((r) => r.id !== id),
          offsets: {
            ...s.offsets,
            [report.subjectId]: (s.offsets[report.subjectId] ?? 0) - report.offsetDelta,
          },
        }))
      },

      // ── Estados ──────────────────────────────────────
      setTopicState: (topicId, state) =>
        set((s) => ({ topicStates: { ...s.topicStates, [topicId]: state } })),

      scheduleReview: (topicId, date) =>
        set((s) => ({ nextReview: { ...s.nextReview, [topicId]: date } })),

      // ── Dúvidas ──────────────────────────────────────
      addDoubt: ({ topicId, subjectId, text, origin }) =>
        set((s) => ({
          doubts: [
            ...s.doubts,
            {
              id: uid('d-'),
              topicId,
              subjectId,
              text: text.trim(),
              origin,
              createdAt: todayISO(),
              resolvedAt: null,
              answer: '',
            },
          ],
        })),

      resolveDoubt: (id, answer) =>
        set((s) => ({
          doubts: s.doubts.map((d) =>
            d.id === id ? { ...d, answer, resolvedAt: todayISO() } : d,
          ),
        })),

      removeDoubt: (id) => set((s) => ({ doubts: s.doubts.filter((d) => d.id !== id) })),

      // ── Exercícios ───────────────────────────────────
      recordAttempt: (attempt) =>
        set((s) => ({ attempts: [...s.attempts, { ...attempt, date: todayISO() }] })),

      addCustomVideo: (video) =>
        set((s) => ({
          customVideos: [...s.customVideos, { ...video, id: uid('v-'), custom: true }],
        })),

      removeCustomVideo: (id) =>
        set((s) => ({ customVideos: s.customVideos.filter((v) => v.id !== id) })),

      // ── Simulados ────────────────────────────────────
      addSimulado: (result) =>
        set((s) => ({ simulados: [...s.simulados, { ...result, id: uid('sim-') }] })),

      setTargetExams: (targetExams) => set({ targetExams }),

      resetCurriculum: () => set(initialState()),
    }),
    {
      name: 'sistema-fernando:curriculum',
      version: 1,
      storage: createJSONStorage(() => localStorageAdapter),
    },
  ),
)
