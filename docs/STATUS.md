# Sistema Fernando — status do projeto

Documento de situação, escrito para ser lido por alguém (ou alguma IA) que não
acompanhou o desenvolvimento. Data: 5 de agosto de 2026.

---

## 1. O que é

**Sistema Fernando** é um PWA (aplicativo web instalável) em português do Brasil
que funciona como sistema operacional pessoal de um estudante do 3º ano do
ensino médio — Colégio Augusto Laranja, turma 3A — que está se preparando para
vestibular e também treina na academia.

**A tese do produto:** preparar o conteúdo **um dia antes da aula**, usando a
escola como confirmação e como espaço para tirar dúvidas, não como primeira
exposição ao assunto.

**Os dois objetivos que governam toda decisão técnica:**

1. Nunca deixar o usuário perdido.
2. Transformar esforço em confiança mensurável.

**Regra de decisão para qualquer funcionalidade nova:** ela reduz o número de
decisões que o usuário toma no dia? Se não, provavelmente não pertence ao app.

**Prioridade declarada de vestibulares:** Insper > FGV > Fuvest > ENEM.

**Restrição de tempo:** as provas são neste ano. A orientação permanente é
preferir a solução simples que dá para usar todo dia à solução sofisticada que
leva semanas.

---

## 2. Tecnologia

- Vite + React 19 + TypeScript + Tailwind v4 + Zustand + vite-plugin-pwa
- **Sem backend.** `localStorage` é a fonte da verdade.
- Repositório: `pedrogellerg-sketch/Sistema-Operacional-Facul`
- Publicação: GitHub Actions → GitHub Pages, a cada push na branch `main`
- App no ar: https://pedrogellerg-sketch.github.io/Sistema-Operacional-Facul/

### Princípios de arquitetura (não quebrar sem motivo forte)

1. **Fato é armazenado, cronograma é calculado.** Nenhuma aula guarda a data em
   que acontece. A data sai de `calendário escolar + grade semanal + offset da
   disciplina`. É isso que faz "o professor atrasou" ser `offset += 1` em vez de
   reescrever 40 registros.
2. **Aula e Tópico são coisas diferentes.** A aula é registro factual do que a
   escola dá e quando. O tópico é a unidade de aprendizado, onde vivem estado,
   dúvidas e desempenho. Matemática gera 16 tópicos para 39 aulas.
3. **Dois stores separados.** Um para o estado do dia (muda a cada toque), outro
   para o banco curricular (~70 KB, muda só na importação). O Zustand reescreve
   o blob inteiro a cada gravação; juntos, marcar uma refeição reescreveria os
   planos de aula.
4. **Um estado por tópico**, com cinco valores: `nao_iniciado` → `preparando` →
   `preparado` → `revisando` → `dominado`.
5. **Uma aula se lê de um jeito só** — um componente único, com três telas
   entrando nele.
6. **AV1 e AV2 são períodos, não provas.** O formato alterna a cada bimestre: no
   3º a AV1 é objetiva, no 4º é dissertativa.
7. **Questões não entram no `localStorage`.** São dados de leitura, empacotados
   como um arquivo por disciplina, carregados sob demanda.

---

## 3. O que já está pronto

**Sprint 1** — rotina diária derivada, modo execução, plano de estudos com
trilhas, treino com modo baixa motivação, alimentação com estoque e lista de
compras, dashboard de consistência, onboarding, backup export/import.

**Sprint 2** — Banco Curricular; importador de PDF dos planos de aula com prévia
e correção manual; cronograma escolar derivado; tela "Amanhã"; preparação de
aula com vídeo curado e exercícios; banco de dúvidas alimentado por erro em
questão; "Aula Real" com offset reversível; calendário interativo; dashboard
acadêmico; simulados; academia editável; alimentação com calorias e proteína.

---

## 4. Banco de questões — situação atual

**1.115 questões reais**, todas conferidas contra o gabarito oficial da prova de
origem, sem divergência.

| Prova | Questões |
| --- | --- |
| ENEM 2019–2023 | 476 |
| Fuvest (USP) | 386 |
| FGV | 168 |
| Insper | 85 |

Por disciplina: Português 326 · Matemática 184 · História 176 · Geografia 111 ·
Inglês 81 · Biologia 68 · Física 60 · Química 58 · Filosofia 37 · Sociologia 14.

### De onde veio cada uma

| Origem | Questões | Como foi obtida |
| --- | --- | --- |
| ENEM 2019–2023 | 476 | API pública `enem.dev` |
| Fuvest 2018–2025 | 386 | conjunto aberto BLUEX (HuggingFace), já etiquetado por matéria |
| FGV 2026.2 | 38 | PDF com camada de texto |
| FGV 2025.1 | 56 | PDF digitalizado — transcrito à mão, página a página |
| FGV 2025.2 | 54 | PDF com quebras de linha preservadas |
| Insper 2026.2 | 41 | PDF de duas colunas |
| Insper 2026.1 | 44 | idem |

Quatro estratégias diferentes de leitura, porque as fontes têm formatos
diferentes. Cada uma virou um script versionado no repositório, e o texto
extraído de cada prova também é versionado — a leitura é reproduzível sem o PDF
original.

### O que fica de fora, e por quê

Questão que depende de imagem (gráfico, mapa, tirinha, figura) **não entra**:
sem a imagem o enunciado não tem resposta possível, e um exercício impossível é
pior que exercício nenhum. Também ficam de fora as questões cujas alternativas
são imagem — acontece em Matemática quando as opções são fórmulas desenhadas.

No total das provas lidas manualmente, cerca de 50 questões foram descartadas
por esse critério.

---

## 5. Estado do código agora

- Branch de trabalho: `claude/fernando-handoff-docs-s2km96`
- Está **4 commits à frente da `main`**, e a `main` é o que vai ao ar.
- **Consequência: as 195 questões mais recentes ainda não estão no app
  publicado.** O app no ar tem 920; a branch tem 1.115. Falta fazer o merge.

Os 4 commits pendentes de merge:

1. Transcrição da FGV 2025.1 (+56)
2. Leitura da objetiva do Insper 2026.2 (+41)
3. Segunda edição do Insper, 2026.1 (+44)
4. Leitura da FGV 2025.2 (+54)

Typecheck (`tsc --noEmit`) e build de produção passam sem erro.

---

## 6. Pendências conhecidas

### Técnicas

- **76 questões inertes.** Os arquivos `geral_humanas.json` (67) e
  `geral_natureza.json` (9) existem desde a Sprint 1 mas **não têm carregador**
  no código — o app nunca as alcança. Ou se cria o carregador, ou se
  redistribuem essas questões nas disciplinas certas, ou se apagam.
- **Persistência no celular não implementada.** Falta chamar
  `navigator.storage.persist()` para impedir que o navegador apague os dados sob
  pressão de espaço, e um lembrete de backup periódico. Como não há backend,
  perder o `localStorage` é perder tudo.
- **Dashboard acadêmico confunde** ao mostrar "de 184 no banco" ao lado de "255
  aulas no Banco Curricular". Não está errado — tópico e aula são coisas
  diferentes —, mas os dois números lado a lado enganam.

### De conteúdo

- **Cinco aulas sem conteúdo**, por erro ou ausência nos documentos originais da
  escola: Geografia 20, Biologia I 14, Redação 16, EFL 15 e 16. O Fernando vai
  confirmar com os professores e informar; a correção é manual, pela tela de
  importação.
- **Biologia II** aguarda a escola enviar o planejamento de aulas.
- **Filosofia, Sociologia e Inglês** ficam sem plano **de propósito** — decisão
  do usuário. São 6 aulas semanais sem conteúdo no app.

### Decisões pendentes do usuário

- A AV1 do 3º bimestre ocupa dois dias (25 e 26/08) ou só o dia 25?
- O que é a "AV3" marcada em 24/09?
- Vale criar um lugar no app para prova **dissertativa** e **redação**? Existe
  material já disponível: propostas de redação, matemática discursiva com
  resolução e critérios de correção. É relevante porque a AV2 dissertativa cai
  em 15–17/09. Ainda não foi decidido.

---

## 7. O que está fora de escopo (decidido)

Não implementar: chatbot, IA conversacional, OCR, foto do caderno, previsão
automática de aprovação, correção automática de exercícios.

Também fora: leitor genérico de PDF de vestibular. Sofisticado demais para o
retorno, a poucos meses da prova. O caminho adotado é uma prova por vez, com um
script apontando para o arquivo.

---

## 8. Próximo passo mais óbvio

Fazer o merge da branch na `main` para que as 195 questões novas cheguem ao app
publicado. Depois disso, resolver as 76 questões inertes e a persistência no
celular, que é o item de maior risco — hoje o usuário pode perder todo o
histórico se o navegador limpar o armazenamento.
