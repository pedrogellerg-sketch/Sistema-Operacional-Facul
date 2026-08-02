/**
 * Falas do coach. Tom: direto, adulto, sem emoji e sem bajulação.
 * Cada fala cabe em uma linha no celular.
 */

export const COACH_MORNING = [
  'O dia já está montado. Só executar.',
  'Você não precisa decidir nada hoje. Só seguir.',
  'Primeiro bloco é o mais importante. Começa nele.',
  'Dia normal, plano normal. Sem drama.',
  'Não pense na semana inteira. Pense no próximo bloco.',
]

export const COACH_AFTERNOON = [
  'Metade do dia feita. Segura o ritmo.',
  'O cansaço vem antes do resultado. É assim mesmo.',
  'Não precisa render 100%. Precisa aparecer.',
  'Foco no que está na sua frente agora.',
]

export const COACH_EVENING = [
  'Reta final. Fecha o dia direito.',
  'Último esforço do dia. Depois é descanso merecido.',
  'Termina o que começou. Amanhã você agradece.',
  'Sono também é parte do plano. Respeite o horário.',
]

export const COACH_ALL_DONE = [
  'Dia fechado. Você fez o combinado.',
  'Tudo executado. É isso que constrói resultado.',
  'Dia limpo. Descansa que amanhã tem mais.',
]

export const COACH_BEHIND = [
  'Você atrasou, mas não perdeu o dia. Retoma no próximo bloco.',
  'Pular um bloco não quebra a semana. Continua.',
  'Menos culpa, mais próximo passo.',
  'Recomeçar no meio do dia também conta.',
]

export const COACH_STREAK = [
  'Consistência é o que separa quem passa de quem quase passa.',
  'Você está construindo o hábito. Não quebra agora.',
  'Sequência viva. Protege ela.',
]

export const COACH_STUDY_START = [
  'Celular longe. 25 minutos de verdade valem mais que 2 horas fingindo.',
  'Sem multitarefa. Uma matéria por vez.',
  'Começa pela revisão. O cérebro precisa reconectar antes de aprender.',
]

export const COACH_WORKOUT = [
  'Não precisa estar animado. Precisa ir.',
  'Treino ruim feito vale mais que treino perfeito imaginado.',
  'Carga sobe devagar. Presença sobe todo dia.',
]

/** Instrução curta por passo da sessão de estudo. */
export const STEP_COACH: Record<string, string> = {
  revisao_anterior: 'Olhe suas anotações da última aula. Sem aprofundar, só reconectar.',
  videoaula: 'Assista com o caderno aberto. Pause e anote o que não entendeu.',
  exercicios: 'Faça sem consultar. Errar aqui é de graça, na prova não.',
  duvidas: 'Anote o que travou. Depois pesquise ou pergunte ao professor.',
  revisao_final: 'Feche o caderno e explique o tópico em voz alta, do zero.',
}
