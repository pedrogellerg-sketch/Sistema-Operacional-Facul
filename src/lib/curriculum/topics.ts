import type { Topic } from '@/types'
import type { CurriculumLesson } from '@/types/curriculum'
import { uid } from '@/lib/utils'

/**
 * Liga as aulas do plano aos tópicos de estudo.
 *
 * Uma aula é registro factual; o progresso vive no tópico. Várias aulas podem
 * apontar para o mesmo tópico — em História, "FRENTE 01: AULA 01" ocupa dois
 * encontros, e o aluno não deveria preparar o mesmo assunto duas vezes.
 *
 * O agrupamento usa o título normalizado: aulas com o mesmo assunto viram um
 * tópico só, preservando a ordem em que aparecem no plano.
 */

/** Chave de agrupamento: ignora numeração, pontuação e "parte 1/2". */
function topicKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(revis[ãa]o|aula)\s*[:\-–]?\s*/i, '')
    .replace(/\s*[-–—]\s*(parte|pt\.?)\s*\d+.*$/i, '')
    .replace(/frente\s*\d+\s*[:\-–]?\s*/i, '')
    .replace(/aula\s*\d+\s*[-–:]?\s*/i, '')
    .replace(/[^a-zà-ú0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface LinkResult {
  lessons: CurriculumLesson[]
  /** Tópicos novos a inserir no store principal. */
  newTopics: Topic[]
}

/**
 * Cria (ou reaproveita) tópicos para as aulas importadas e devolve as aulas já
 * com `topicId` preenchido.
 */
export function linkLessonsToTopics(
  lessons: CurriculumLesson[],
  subjectId: string,
  existingTopics: Topic[],
): LinkResult {
  const byKey = new Map<string, Topic>()
  for (const t of existingTopics) {
    if (t.subjectId !== subjectId) continue
    byKey.set(topicKey(t.title), t)
  }

  const newTopics: Topic[] = []
  let order = existingTopics.filter((t) => t.subjectId === subjectId).length

  const linked = lessons.map((lesson) => {
    // Feriado e prova não são assunto para estudar.
    if (lesson.kind === 'feriado' || lesson.kind === 'sem_aula') {
      return { ...lesson, topicId: null }
    }

    const key = topicKey(lesson.title)
    if (!key) return { ...lesson, topicId: null }

    let topic = byKey.get(key)
    if (!topic) {
      topic = {
        id: uid('t-'),
        subjectId,
        title: lesson.title,
        status: 'nao_iniciado',
        difficulty: 3,
        exercisesDone: 0,
        lastReviewedAt: null,
        notes: '',
        order: order++,
      }
      byKey.set(key, topic)
      newTopics.push(topic)
    }

    return { ...lesson, topicId: topic.id }
  })

  return { lessons: linked, newTopics }
}
