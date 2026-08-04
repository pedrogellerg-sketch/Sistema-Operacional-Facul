import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type {
  DayLog,
  DayRoutine,
  ISODate,
  MealPlan,
  MealSlot,
  PantryItem,
  Profile,
  RoutineBlock,
  RoutineSettings,
  ShoppingItem,
  StudySession,
  Subject,
  TaskState,
  Topic,
  Weekday,
  WeightEntry,
  WorkoutExercise,
  WorkoutLog,
  WorkoutTemplate,
} from '@/types'

import { SEED_SUBJECTS, buildSeedTopics } from '@/data/subjects'
import { SEED_WORKOUT_TEMPLATES } from '@/data/workouts'
import { SEED_MEALS, buildSeedPantry } from '@/data/nutrition'
import { DEFAULT_ROUTINE_SETTINGS, generateWeek, regenerateDay } from '@/lib/routineEngine'
import { buildSession } from '@/lib/studyEngine'
import { STORAGE_KEY, STORAGE_VERSION, localStorageAdapter } from '@/lib/persistence'
import { addDays, todayISO } from '@/lib/date'
import { uid } from '@/lib/utils'

/**
 * Store único do app. Um só objeto persistido mantém export/import trivial e
 * evita estados parciais inconsistentes entre slices.
 */

interface AppState {
  profile: Profile
  routineSettings: RoutineSettings
  week: DayRoutine[]
  subjects: Subject[]
  topics: Topic[]
  sessions: StudySession[]
  activeSessionId: string | null
  workoutTemplates: WorkoutTemplate[]
  workoutLogs: WorkoutLog[]
  workoutRotation: number
  meals: MealPlan[]
  pantry: PantryItem[]
  shopping: ShoppingItem[]
  logs: Record<ISODate, DayLog>
  weights: WeightEntry[]
}

interface AppActions {
  // Perfil e onboarding
  updateProfile: (patch: Partial<Profile>) => void
  completeOnboarding: (data: {
    name: string
    afternoonClassDays: Weekday[]
    workoutDays: Weekday[]
    wakeTime: string
    sleepTime: string
    schoolStart: string
    schoolEnd: string
    weightKg: number | null
  }) => void

  // Rotina
  updateRoutineSettings: (patch: Partial<RoutineSettings>) => void
  regenerateWholeWeek: () => void
  resetDay: (weekday: Weekday) => void
  updateBlock: (weekday: Weekday, blockId: string, patch: Partial<RoutineBlock>) => void
  removeBlock: (weekday: Weekday, blockId: string) => void
  addBlock: (weekday: Weekday, block: Omit<RoutineBlock, 'id'>) => void
  toggleDayFlag: (weekday: Weekday, flag: 'afternoonClass' | 'workout') => void

  // Matérias e trilhas
  updateSubject: (id: string, patch: Partial<Subject>) => void
  updateTopic: (id: string, patch: Partial<Topic>) => void
  addTopic: (subjectId: string, title: string) => void
  /** Insere um tópico já montado (usado pela importação do Banco Curricular). */
  addTopicRecord: (topic: Topic) => void
  removeTopic: (id: string) => void

  // Sessões de estudo
  startSession: (subjectId: string, topicId?: string | null, availableMinutes?: number) => string | null
  advanceStep: () => void
  goToStep: (index: number) => void
  addQuestion: (text: string) => void
  finishSession: (data: { exercises: number; blockId?: string }) => void
  cancelSession: () => void

  // Treino
  logWorkout: (data: {
    templateId: string
    completed: boolean
    lowMotivation: boolean
    minutes: number
    loads: Record<string, number>
    notes?: string
    blockId?: string
  }) => void
  updateExerciseLoad: (templateId: string, exerciseId: string, load: number) => void
  updateExercise: (templateId: string, exerciseId: string, patch: Partial<WorkoutExercise>) => void
  addExercise: (templateId: string, name: string) => void
  removeExercise: (templateId: string, exerciseId: string) => void
  /** Repete o último treino registrado, com as mesmas cargas. */
  repeatLastWorkout: (blockId?: string) => boolean
  cycleWorkoutRotation: () => void
  setWorkoutRotation: (index: number) => void

  // Alimentação
  updateMeal: (slot: MealSlot, patch: Partial<MealPlan>) => void
  toggleMeal: (slot: MealSlot, date?: ISODate) => void
  togglePantryItem: (id: string) => void
  addPantryItem: (name: string, essential: boolean) => void
  removePantryItem: (id: string) => void
  addShoppingItem: (name: string) => void
  toggleShoppingItem: (id: string) => void
  removeShoppingItem: (id: string) => void
  clearDoneShopping: () => void
  addMissingEssentialsToShopping: () => number

  // Registro diário
  setBlockState: (blockId: string, state: TaskState, date?: ISODate) => void
  setSleepHours: (hours: number | null, date?: ISODate) => void
  setWeight: (kg: number, date?: ISODate) => void
  setDayNotes: (notes: string, date?: ISODate) => void

  // Dados
  resetAll: () => void
  importState: (data: unknown) => boolean
  exportState: () => AppState
}

export type AppStore = AppState & AppActions

const EMPTY_LOG = (date: ISODate): DayLog => ({
  date,
  blocks: {},
  meals: {},
  sleepHours: null,
  weightKg: null,
  studyMinutes: 0,
  exercisesDone: 0,
  subjectsStudied: [],
  workoutDone: false,
  notes: '',
})

function createInitialState(): AppState {
  const today = todayISO()
  const daysAgo = (n: number) => addDays(today, -n)

  return {
    profile: {
      name: '',
      grade: '3º ano',
      targetExam: 'ENEM',
      heightCm: null,
      startWeightKg: null,
      goalWeightKg: null,
      onboarded: false,
    },
    routineSettings: DEFAULT_ROUTINE_SETTINGS,
    week: generateWeek(DEFAULT_ROUTINE_SETTINGS),
    subjects: SEED_SUBJECTS,
    topics: buildSeedTopics(today, daysAgo),
    sessions: [],
    activeSessionId: null,
    workoutTemplates: SEED_WORKOUT_TEMPLATES,
    workoutLogs: [],
    workoutRotation: 0,
    meals: SEED_MEALS,
    pantry: buildSeedPantry(),
    shopping: [],
    logs: {},
    weights: [],
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      /** Aplica um patch no log de uma data, criando-o se necessário. */
      const patchLog = (date: ISODate, fn: (log: DayLog) => DayLog) => {
        set((s) => {
          const current = s.logs[date] ?? EMPTY_LOG(date)
          return { logs: { ...s.logs, [date]: fn(current) } }
        })
      }

      return {
        ...createInitialState(),

        // ── Perfil ───────────────────────────────────────────
        updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

        completeOnboarding: (data) =>
          set((s) => {
            const settings: RoutineSettings = {
              ...s.routineSettings,
              afternoonClassDays: data.afternoonClassDays,
              workoutDays: data.workoutDays,
              wakeTime: data.wakeTime,
              sleepTime: data.sleepTime,
              schoolStart: data.schoolStart,
              schoolEnd: data.schoolEnd,
            }
            return {
              profile: {
                ...s.profile,
                name: data.name.trim(),
                startWeightKg: data.weightKg,
                onboarded: true,
              },
              routineSettings: settings,
              // Onboarding sempre gera a semana do zero: não há customização a preservar.
              week: generateWeek(settings),
              weights: data.weightKg
                ? [{ date: todayISO(), kg: data.weightKg }]
                : s.weights,
            }
          }),

        // ── Rotina ───────────────────────────────────────────
        updateRoutineSettings: (patch) =>
          set((s) => {
            const settings = { ...s.routineSettings, ...patch }
            // Dias customizados sobrevivem à mudança de configuração.
            return { routineSettings: settings, week: generateWeek(settings, s.week) }
          }),

        regenerateWholeWeek: () =>
          set((s) => ({ week: generateWeek(s.routineSettings) })),

        resetDay: (weekday) =>
          set((s) => ({
            week: s.week.map((d) => (d.weekday === weekday ? regenerateDay(weekday, s.routineSettings) : d)),
          })),

        updateBlock: (weekday, blockId, patch) =>
          set((s) => ({
            week: s.week.map((d) =>
              d.weekday === weekday
                ? {
                    ...d,
                    customized: true,
                    blocks: d.blocks
                      .map((b) => (b.id === blockId ? { ...b, ...patch } : b))
                      .sort((a, b) => a.start.localeCompare(b.start)),
                  }
                : d,
            ),
          })),

        removeBlock: (weekday, blockId) =>
          set((s) => ({
            week: s.week.map((d) =>
              d.weekday === weekday
                ? { ...d, customized: true, blocks: d.blocks.filter((b) => b.id !== blockId) }
                : d,
            ),
          })),

        addBlock: (weekday, block) =>
          set((s) => ({
            week: s.week.map((d) =>
              d.weekday === weekday
                ? {
                    ...d,
                    customized: true,
                    blocks: [...d.blocks, { ...block, id: uid('b-') }].sort((a, b) =>
                      a.start.localeCompare(b.start),
                    ),
                  }
                : d,
            ),
          })),

        toggleDayFlag: (weekday, flag) =>
          set((s) => {
            const day = s.week.find((d) => d.weekday === weekday)
            if (!day) return {}
            const nextValue = !day[flag]

            // Mantém as listas em settings coerentes com o toggle do dia.
            const settings = { ...s.routineSettings }
            const listKey = flag === 'afternoonClass' ? 'afternoonClassDays' : 'workoutDays'
            const list = new Set(settings[listKey])
            if (nextValue) list.add(weekday)
            else list.delete(weekday)
            settings[listKey] = [...list].sort() as Weekday[]

            return {
              routineSettings: settings,
              week: s.week.map((d) =>
                d.weekday === weekday
                  ? {
                      ...regenerateDay(weekday, settings),
                      // Regenerar aqui é intencional: mudar "tem aula à tarde"
                      // reorganiza o dia inteiro, então a customização antiga
                      // deixaria blocos em horários impossíveis.
                    }
                  : d,
              ),
            }
          }),

        // ── Matérias ─────────────────────────────────────────
        updateSubject: (id, patch) =>
          set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

        updateTopic: (id, patch) =>
          set((s) => ({ topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

        addTopic: (subjectId, title) =>
          set((s) => {
            const siblings = s.topics.filter((t) => t.subjectId === subjectId)
            const order = siblings.length ? Math.max(...siblings.map((t) => t.order)) + 1 : 0
            const topic: Topic = {
              id: uid('t-'),
              subjectId,
              title: title.trim(),
              status: 'nao_visto',
              difficulty: 3,
              exercisesDone: 0,
              lastReviewedAt: null,
              notes: '',
              order,
            }
            return { topics: [...s.topics, topic] }
          }),

        addTopicRecord: (topic) =>
          set((s) => (s.topics.some((t) => t.id === topic.id) ? {} : { topics: [...s.topics, topic] })),

        removeTopic: (id) => set((s) => ({ topics: s.topics.filter((t) => t.id !== id) })),

        // ── Sessões ──────────────────────────────────────────
        startSession: (subjectId, topicId, availableMinutes) => {
          const s = get()
          const subject = s.subjects.find((x) => x.id === subjectId)
          if (!subject) return null

          const topic = topicId
            ? (s.topics.find((t) => t.id === topicId) ?? null)
            : pickTopicForSubject(s.topics, subjectId)

          const session = buildSession(subject, topic, { availableMinutes })
          session.startedAt = Date.now()

          set((prev) => ({
            sessions: [...prev.sessions, session],
            activeSessionId: session.id,
            // Abrir a sessão já move o tópico para "em andamento": o usuário
            // não deveria precisar marcar isso à mão.
            topics: topic
              ? prev.topics.map((t) =>
                  t.id === topic.id && t.status === 'nao_visto'
                    ? { ...t, status: 'em_andamento' }
                    : t,
                )
              : prev.topics,
          }))

          return session.id
        },

        advanceStep: () =>
          set((s) => ({
            sessions: s.sessions.map((x) => {
              if (x.id !== s.activeSessionId) return x
              const steps = x.steps.map((st, i) => (i === x.currentStep ? { ...st, done: true } : st))
              return { ...x, steps, currentStep: Math.min(x.currentStep + 1, x.steps.length) }
            }),
          })),

        goToStep: (index) =>
          set((s) => ({
            sessions: s.sessions.map((x) =>
              x.id === s.activeSessionId
                ? { ...x, currentStep: Math.max(0, Math.min(index, x.steps.length - 1)) }
                : x,
            ),
          })),

        addQuestion: (text) =>
          set((s) => ({
            sessions: s.sessions.map((x) =>
              x.id === s.activeSessionId ? { ...x, questions: [...x.questions, text.trim()] } : x,
            ),
          })),

        finishSession: ({ exercises, blockId }) => {
          const s = get()
          const session = s.sessions.find((x) => x.id === s.activeSessionId)
          if (!session) return

          const date = session.date
          // Conta apenas os passos concluídos — sessão parcial vale o que rendeu.
          const doneMinutes = session.steps
            .filter((st) => st.done)
            .reduce((acc, st) => acc + st.minutes, 0)
          const minutes = doneMinutes || session.steps.reduce((acc, st) => acc + st.minutes, 0)

          set((prev) => {
            const log = prev.logs[date] ?? EMPTY_LOG(date)
            const subjectsStudied = log.subjectsStudied.includes(session.subjectId)
              ? log.subjectsStudied
              : [...log.subjectsStudied, session.subjectId]

            return {
              sessions: prev.sessions.map((x) =>
                x.id === session.id
                  ? {
                      ...x,
                      completedAt: Date.now(),
                      minutesLogged: minutes,
                      exercisesLogged: exercises,
                      steps: x.steps.map((st) => ({ ...st, done: true })),
                      currentStep: x.steps.length,
                    }
                  : x,
              ),
              activeSessionId: null,
              topics: session.topicId
                ? prev.topics.map((t) =>
                    t.id === session.topicId
                      ? {
                          ...t,
                          // Um tópico só vira "dominado" pela mão do usuário;
                          // o sistema move para "revisando" e deixa a decisão.
                          status: t.status === 'dominado' ? 'dominado' : 'revisando',
                          lastReviewedAt: date,
                          exercisesDone: t.exercisesDone + exercises,
                        }
                      : t,
                  )
                : prev.topics,
              logs: {
                ...prev.logs,
                [date]: {
                  ...log,
                  studyMinutes: log.studyMinutes + minutes,
                  exercisesDone: log.exercisesDone + exercises,
                  subjectsStudied,
                  blocks: blockId ? { ...log.blocks, [blockId]: 'feito' } : log.blocks,
                },
              },
            }
          })
        },

        cancelSession: () =>
          set((s) => ({
            // Descarta a sessão inteira: sessão abandonada não vira histórico.
            sessions: s.sessions.filter((x) => x.id !== s.activeSessionId),
            activeSessionId: null,
          })),

        // ── Treino ───────────────────────────────────────────
        logWorkout: ({ templateId, completed, lowMotivation, minutes, loads, notes, blockId }) => {
          const date = todayISO()
          const template = get().workoutTemplates.find((t) => t.id === templateId)

          const log: WorkoutLog = {
            id: uid('w-'),
            date,
            templateId,
            templateName: template?.name ?? 'Treino',
            completed,
            lowMotivation,
            minutes,
            loads,
            notes: notes ?? '',
          }

          set((s) => {
            const day = s.logs[date] ?? EMPTY_LOG(date)

            // Persiste as cargas usadas como "última carga" do template.
            const templates = s.workoutTemplates.map((t) =>
              t.id === templateId
                ? {
                    ...t,
                    exercises: t.exercises.map((e) =>
                      loads[e.id] != null && loads[e.id] > 0 ? { ...e, lastLoad: loads[e.id] } : e,
                    ),
                  }
                : t,
            )

            return {
              workoutLogs: [...s.workoutLogs, log],
              workoutTemplates: templates,
              // Só avança o split quando o treino foi concluído de verdade.
              workoutRotation: completed ? s.workoutRotation + 1 : s.workoutRotation,
              logs: {
                ...s.logs,
                [date]: {
                  ...day,
                  workoutDone: completed || day.workoutDone,
                  blocks: blockId
                    ? { ...day.blocks, [blockId]: completed ? 'feito' : 'pulado' }
                    : day.blocks,
                },
              },
            }
          })
        },

        updateExerciseLoad: (templateId, exerciseId, load) =>
          set((s) => ({
            workoutTemplates: s.workoutTemplates.map((t) =>
              t.id === templateId
                ? {
                    ...t,
                    exercises: t.exercises.map((e) =>
                      e.id === exerciseId ? { ...e, lastLoad: load } : e,
                    ),
                  }
                : t,
            ),
          })),

        updateExercise: (templateId, exerciseId, patch) =>
          set((s) => ({
            workoutTemplates: s.workoutTemplates.map((t) =>
              t.id === templateId
                ? { ...t, exercises: t.exercises.map((e) => (e.id === exerciseId ? { ...e, ...patch } : e)) }
                : t,
            ),
          })),

        addExercise: (templateId, name) =>
          set((s) => ({
            workoutTemplates: s.workoutTemplates.map((t) =>
              t.id === templateId
                ? {
                    ...t,
                    exercises: [
                      ...t.exercises,
                      { id: uid('ex-'), name: name.trim(), sets: 3, reps: '10-12', lastLoad: null, notes: '' },
                    ],
                  }
                : t,
            ),
          })),

        removeExercise: (templateId, exerciseId) =>
          set((s) => ({
            workoutTemplates: s.workoutTemplates.map((t) =>
              t.id === templateId
                ? { ...t, exercises: t.exercises.filter((e) => e.id !== exerciseId) }
                : t,
            ),
          })),

        repeatLastWorkout: (blockId) => {
          const s = get()
          const last = [...s.workoutLogs].reverse().find((l) => l.completed)
          if (!last) return false
          s.logWorkout({
            templateId: last.templateId,
            completed: true,
            lowMotivation: false,
            minutes: last.minutes,
            loads: last.loads,
            notes: 'Repetiu o treino anterior',
            blockId,
          })
          return true
        },

        cycleWorkoutRotation: () => set((s) => ({ workoutRotation: s.workoutRotation + 1 })),
        setWorkoutRotation: (index) => set({ workoutRotation: index }),

        // ── Alimentação ──────────────────────────────────────
        updateMeal: (slot, patch) =>
          set((s) => ({ meals: s.meals.map((m) => (m.slot === slot ? { ...m, ...patch } : m)) })),

        toggleMeal: (slot, date = todayISO()) =>
          patchLog(date, (log) => ({ ...log, meals: { ...log.meals, [slot]: !log.meals[slot] } })),

        togglePantryItem: (id) =>
          set((s) => ({
            pantry: s.pantry.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p)),
          })),

        addPantryItem: (name, essential) =>
          set((s) => ({
            pantry: [...s.pantry, { id: uid('p-'), name: name.trim(), essential, inStock: true }],
          })),

        removePantryItem: (id) => set((s) => ({ pantry: s.pantry.filter((p) => p.id !== id) })),

        addShoppingItem: (name) =>
          set((s) => {
            const clean = name.trim()
            if (!clean) return {}
            // Evita duplicar item já pendente na lista.
            const exists = s.shopping.some(
              (i) => i.name.toLowerCase() === clean.toLowerCase() && !i.done,
            )
            if (exists) return {}
            return { shopping: [...s.shopping, { id: uid('sh-'), name: clean, done: false }] }
          }),

        toggleShoppingItem: (id) =>
          set((s) => ({
            shopping: s.shopping.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
          })),

        removeShoppingItem: (id) =>
          set((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) })),

        clearDoneShopping: () => set((s) => ({ shopping: s.shopping.filter((i) => !i.done) })),

        addMissingEssentialsToShopping: () => {
          const s = get()
          const missing = s.pantry.filter((p) => p.essential && !p.inStock)
          const pending = new Set(
            s.shopping.filter((i) => !i.done).map((i) => i.name.toLowerCase()),
          )
          const toAdd = missing.filter((p) => !pending.has(p.name.toLowerCase()))
          if (toAdd.length === 0) return 0

          set((prev) => ({
            shopping: [
              ...prev.shopping,
              ...toAdd.map((p) => ({ id: uid('sh-'), name: p.name, done: false })),
            ],
          }))
          return toAdd.length
        },

        // ── Registro diário ──────────────────────────────────
        setBlockState: (blockId, state, date = todayISO()) =>
          patchLog(date, (log) => ({ ...log, blocks: { ...log.blocks, [blockId]: state } })),

        setSleepHours: (hours, date = todayISO()) =>
          patchLog(date, (log) => ({ ...log, sleepHours: hours })),

        setWeight: (kg, date = todayISO()) => {
          patchLog(date, (log) => ({ ...log, weightKg: kg }))
          set((s) => {
            const rest = s.weights.filter((w) => w.date !== date)
            return {
              weights: [...rest, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)),
              profile: s.profile.startWeightKg == null ? { ...s.profile, startWeightKg: kg } : s.profile,
            }
          })
        },

        setDayNotes: (notes, date = todayISO()) => patchLog(date, (log) => ({ ...log, notes })),

        // ── Dados ────────────────────────────────────────────
        resetAll: () => set(createInitialState()),

        importState: (data) => {
          if (!data || typeof data !== 'object') return false
          const candidate = data as Partial<AppState>
          // Checagem mínima de forma para não destruir o estado com lixo.
          if (!candidate.profile || !Array.isArray(candidate.subjects) || !Array.isArray(candidate.week)) {
            return false
          }
          set({ ...createInitialState(), ...candidate })
          return true
        },

        exportState: () => {
          const s = get()
          return {
            profile: s.profile,
            routineSettings: s.routineSettings,
            week: s.week,
            subjects: s.subjects,
            topics: s.topics,
            sessions: s.sessions,
            activeSessionId: s.activeSessionId,
            workoutTemplates: s.workoutTemplates,
            workoutLogs: s.workoutLogs,
            workoutRotation: s.workoutRotation,
            meals: s.meals,
            pantry: s.pantry,
            shopping: s.shopping,
            logs: s.logs,
            weights: s.weights,
          }
        },
      }
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorageAdapter),
      // `partialize` fica implícito: tudo é persistido. Se um dia houver estado
      // volátil (ex.: timers), ele entra aqui como exclusão explícita.
    },
  ),
)

/** Espelha `pickNextTopic` do studyEngine sem importar ciclo. */
function pickTopicForSubject(topics: Topic[], subjectId: string): Topic | null {
  const list = topics.filter((t) => t.subjectId === subjectId).sort((a, b) => a.order - b.order)
  return (
    list.find((t) => t.status === 'em_andamento') ??
    list.find((t) => t.status === 'nao_visto') ??
    list.find((t) => t.status === 'revisando') ??
    list[0] ??
    null
  )
}
