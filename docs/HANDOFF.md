# Handoff — estado do projeto e o que falta

> Documento de continuidade. Se você está começando uma sessão nova neste
> projeto, leia isto primeiro e depois o `README.md`.
> Última atualização: commit `0f02b47`.

---

## 1. O que é o projeto

**Sistema Fernando** — PWA em português do Brasil que funciona como sistema
operacional pessoal de um estudante do 3º ano do ensino médio (Colégio Augusto
Laranja, turma 3A) que se prepara para vestibular e quer ganhar massa muscular.

A tese do produto: **preparar o conteúdo um dia antes da aula**, usando a escola
como confirmação e espaço para tirar dúvidas — não como primeira exposição.

Regra de decisão para qualquer funcionalidade nova: *ela reduz o número de
decisões que o usuário toma no dia?* Se não, provavelmente não pertence ao app.

Tom das mensagens: direto, adulto, sem emoji, sem bajulação.

---

## 2. Onde as coisas estão

| | |
|---|---|
| Repositório | `pedrogellerg-sketch/Sistema-Operacional-Facul` |
| Branch de trabalho | `claude/sistema-fernando-pwa-1vna5p` |
| Branch padrão | `main` |
| App publicado | https://pedrogellerg-sketch.github.io/Sistema-Operacional-Facul/ |
| Deploy | GitHub Actions → Pages, a cada push em `main` |

**A branch de trabalho está à frente da `main`.** Os commits da Sprint 2 só vão
ao ar depois de um merge. O PR #1 (Sprint 1) já foi mergeado mas continua aberto.

---

## 3. Stack e princípios de arquitetura

Vite + React 19 + TypeScript + Tailwind v4 + Zustand + vite-plugin-pwa.
Sem backend. `localStorage` é a fonte da verdade.

Três decisões que sustentam o sistema — **não as quebre sem motivo forte**:

**1. Fato é armazenado, cronograma é calculado.** Nenhuma aula guarda a data em
que acontece. A data sai de `calendário escolar + grade semanal + offset da
disciplina`, resolvida em `src/lib/curriculum/schedule.ts`. É isso que faz
"o professor atrasou" ser `offset += 1` em vez de reescrever 40 registros, e que
permite editar a rotina sem corromper histórico.

**2. Aula e Tópico são coisas diferentes.** `CurriculumLesson` é registro factual
(o que a escola dá e quando). `Topic` é a unidade de aprendizado, onde vivem
estado, dúvidas e desempenho. Várias aulas podem apontar para o mesmo tópico —
Matemática gera 16 tópicos para 39 aulas. Se você der estado próprio à aula,
os dois modelos vão divergir.

**3. Dois stores separados.** `appStore` (estado do dia, muda a cada toque) e
`curriculumStore` (banco curricular, ~70 KB, muda só na importação). O Zustand
reescreve o blob inteiro a cada `set()`; juntos, marcar uma refeição reescreveria
os planos de aula.

**4. Um estado por tópico, e ele mora em `Topic.status`.** Até a Sprint 2 havia
duas máquinas de estado para a mesma coisa: `Topic.status` no `appStore` e um
mapa `topicStates` no `curriculumStore`. Preparar uma aula escrevia só a
segunda, então a tela de Estudos continuava achando que o assunto nunca fora
visto e o sugeria de novo. Hoje o estado é um só, com cinco valores
(`nao_iniciado` → `preparando` → `preparado` → `revisando` → `dominado`), e vive
no tópico — o que também impede que estudar reescreva o banco curricular.
`preparado` fica de fora da disputa em `pickNextTopic`: o que foi estudado na
véspera não volta para a fila no mesmo dia. **Não recrie um segundo lugar para
guardar progresso.**

**Questões não entram no localStorage.** São dados de leitura, empacotados como
chunk por disciplina em `src/data/questions/`. Só as respostas do usuário são
persistidas.

---

## 4. O que está pronto e verificado

**Sprint 1** — rotina diária derivada, modo execução, plano de estudos com
trilhas, treino com modo baixa motivação, alimentação com estoque e lista de
compras, dashboard de consistência, onboarding, backup export/import.

**Sprint 2** — Banco Curricular; importador de PDF com prévia e correção
manual; cronograma escolar derivado; tela "Amanhã"; preparação de aula com
vídeo curado e exercícios; banco de dúvidas alimentado por erro em questão;
Aula Real com offset reversível; dashboard acadêmico; simulados; academia
editável; alimentação com calorias e proteína.

**Dados reais já embutidos:** grade semanal (35 aulas/semana, 13 disciplinas),
calendário do 2º semestre de 2026 com simulados e vestibulares, e **552 questões
reais do ENEM 2019–2023**.

Testes feitos no navegador com PDFs reais: 10/10 no fluxo da Sprint 2, 17/17 nas
telas novas, 11/11 no deploy com subcaminho. Zero erros de console.

---

## 5. O que falta — em ordem de prioridade

### 5.1 Importador da Fuvest (não começado) — ÚNICA FRENTE ABERTA

O objetivo é somar questões da Fuvest às do ENEM. **Já validei que é viável**;
falta construir.

O que descobri e você pode reaproveitar:

- As provas são públicas: `https://www.fuvest.br/acervo-vestibular-2024`
  (troque o ano). Padrão dos PDFs:
  `https://www.fuvest.br/wp-content/uploads/fuvest2024_primeira_fase_prova_V.pdf`
  e o gabarito `fuvest2024_gabarito_primeira_fase*.pdf`.
- **A prova tem duas colunas.** Extrair por coordenada Y (como no importador de
  planos) embaralha tudo. A solução é agrupar primeiro por X — dividir na metade
  da largura da página (`viewport.width / 2`) e só então reagrupar por linha
  dentro de cada coluna. **Testei: funciona perfeitamente.**
- As questões são marcadas só pelo número solto (`08`, `09`), não por "QUESTÃO N".
- As alternativas vêm como `(A)`, `(B)`, `(C)`, `(D)`, `(E)` — parseáveis.
- **O gabarito extrai limpo**, com as cinco versões da prova (V, K, Q, X, Z) em
  colunas. Use a versão V para casar com o `prova_V.pdf`.
- Aplique o mesmo filtro do ENEM: descartar questões que dependem de imagem
  (`isUsable` em `scripts/fetch-questions.mjs`). Estimo que sobrem 50–60% das 90.

Espelhe a estrutura de `scripts/fetch-questions.mjs`, gerando os mesmos campos
do tipo `Question` em `src/types/curriculum.ts`. Cacheie os downloads.

### 5.2 Parsers dos planos — RESOLVIDO

Os nove planos importam corretamente. Química exigiu cobrir quatro arranjos
distintos no mesmo documento (a tabela de duas colunas quebra em ponto
diferente a cada página); Redação exigiu um perfil próprio, porque numera em
duplas e põe o título antes do número.

Contagem final: Matemática 39, Física 34, Química 38, Biologia 17, História 40,
Geografia 34, Redação 11, Literatura 20, EFL 14.

Números repetidos em Química (6) e Geografia (10) são erros dos documentos
originais, sinalizados na prévia para conferência manual — comportamento
projetado, não bug.

### 5.3 Pendências menores

- **Persistência dos dados no celular**: proposto e não implementado —
  `navigator.storage.persist()` para impedir que o navegador apague os dados sob
  pressão de espaço, e um lembrete de backup a cada 30 dias. É a próxima da fila.
- **Dashboard acadêmico** mostra "de 184 no banco" ao lado de "255 aulas no
  Banco Curricular". Não está errado — tópico e aula são coisas diferentes —,
  mas os dois números lado a lado confundem.
- **Cinco aulas sem conteúdo**, por erro dos documentos originais ou por
  ausência neles: Geografia 20, Biologia I 14, Redação 16, EFL 15 e 16. O
  Fernando vai confirmar com os professores qual aula cai nesses dias e informar;
  a correção então é manual, pela tela de importação.

**Decidido com o usuário — não gastar tempo com:**

- **Filosofia, Sociologia e Inglês** ficam sem plano de propósito (6 aulas
  semanais sem conteúdo no app). Ele optou por ignorá-las.
- **Biologia II** aguarda a escola enviar o planejamento. Nada a fazer até lá.
- **Leitores de PDF de Insper e FGV** saíram do escopo: sofisticados demais para
  o retorno, a dois meses da prova. A troca acordada é registrar no app o
  resultado das provas antigas feitas no papel, usando o cadastro de simulado
  que já existe.

---

## 6. Armadilhas do ambiente (economizam tempo)

- **`Read` não abre PDF**: falta `poppler`. Extraia com `pdfjs-dist` em Node.
- **Python está quebrado** para PDF (`cryptography` com `_cffi_backend` faltando).
  Use Node.
- **Playwright**: o binário fica em
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (o caminho sem versão
  não existe). Instale `playwright` no scratchpad, não no projeto.
- **O navegador não alcança hosts externos** pelo proxy do ambiente — dá
  `ERR_CONNECTION_RESET`. Teste sempre contra `vite preview` local. `curl` e
  `fetch` do Node funcionam normalmente.
- **A API enem.dev limita taxa** (429). O script já faz recuo exponencial e
  cacheia em `.cache-enem/` (ignorado pelo git).
- **Congele o relógio nos testes** com `addInitScript` sobrescrevendo `Date`;
  sem isso o resultado muda conforme o dia da semana.
- **Cuidado com asserções de teste**: `textContent` não enxerga `placeholder`, e
  05/08/2026 é quarta — que não tem Matemática na grade. Dois testes meus
  falharam por isso, não por bug no app.

---

## 7. Como verificar que nada quebrou

```bash
npm install
npm run typecheck
npm run build
npx vite preview --port 4173 --host 127.0.0.1
```

Depois rode um teste de navegador contra `http://127.0.0.1:4173`. O padrão que
usei: completar o onboarding, importar um PDF real, e afirmar sobre o
`localStorage` (`sistema-fernando` e `sistema-fernando:curriculum`) em vez de
só olhar a tela.

Para conferir os parsers contra os nove planos de uma vez, extraia os PDFs para
texto e rode `parsePlan` em cada um, comparando a contagem de aulas com o
esperado.

---

## 8. Fatos sobre a escola que o código assume

- Primeiro dia letivo do 2º semestre: **29/07/2026, uma quarta-feira**.
- 7 aulas por dia, 35 por semana. Segunda a sexta.
- **Biologia I (Marcelo) e Biologia II (Carolina P) são trilhas distintas**,
  com professores diferentes.
- História usa "FRENTES" — trilhas paralelas dentro da disciplina.
- Só quatro feriados suspendem aula: 07/09, 12/10, 02/11 e 20/11.
  **A "Viagem EM" de agosto NÃO suspende** — o usuário confirmou.
- Vestibulares-alvo: ENEM, Fuvest, Unicamp, Unesp (o calendário da escola não
  menciona FGV nem Insper, embora a especificação os cite).

---

## 9. Como falar com este usuário

Ele não programa. Explique em português claro, sem jargão — e quando usar um
termo técnico, defina na hora. Ele acompanha bem o raciocínio de produto e faz
perguntas boas; o que atrapalha é vocabulário de engenharia sem tradução.

Ele valoriza honestidade sobre o que não foi feito. Duas vezes nesta sessão eu
entreguei algo incompleto sem sinalizar a lacuna com clareza, e ele cobrou — com
razão. Diga o que ficou de fora antes que ele descubra.
