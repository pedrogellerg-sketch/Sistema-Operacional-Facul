# Sistema Fernando

> Seu sistema operacional pessoal — estudo, treino, alimentação e rotina em execução.

Um web app (PWA) em português do Brasil para um estudante do ensino médio que se prepara
para vestibular e quer ganhar massa muscular. Não é uma lista de tarefas: é um **método
guiado**. O app decide o que estudar, quando treinar e o que comer, e apresenta uma coisa
de cada vez.

O critério de sucesso é simples: abrir de manhã e saber exatamente o que fazer, sem pensar.

---

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # build de produção (dist/)
npm run preview  # serve o build
npm run typecheck
```

Os ícones do PWA são gerados por script, sem dependência de binário de imagem:

```bash
node scripts/generate-icons.mjs
```

---

## Stack e por que ela

**Vite + React 19 + TypeScript + Tailwind v4 + Zustand + vite-plugin-pwa.**

O enunciado pedia "Next.js ou React com TypeScript". Escolhi **React com Vite, não
Next.js**, e a razão é o modelo de dados: no MVP o `localStorage` é a única fonte da
verdade. Um app Next renderiza no servidor primeiro, onde `localStorage` não existe — o
resultado seria envolver toda tela em guardas de hidratação e conviver com um flash de
estado vazio a cada navegação. Como não há backend, SEO nem dados compartilhados, o SSR
só cobraria complexidade sem entregar nada. Vite dá build mais rápido, bundle menor
(~113 KB gzip) e um service worker offline direto.

A arquitetura fica pronta para backend sem depender dele — veja *Persistência*.

| Peça | Escolha | Motivo |
|---|---|---|
| Estado | Zustand + `persist` | Store única, serialização automática, sem boilerplate de reducer |
| Estilo | Tailwind v4 (`@theme`) | Tokens como variáveis CSS nativas, sem arquivo de config JS |
| Ícones | lucide-react | Consistentes, tree-shakeable |
| Gráficos | SVG/CSS próprios | Uma série curta não justifica biblioteca; herda os tokens do design |
| Datas | Helpers próprios (`lib/date.ts`) | Só precisamos de `YYYY-MM-DD` local; `date-fns` seria peso morto |

---

## Arquitetura

O app se divide em três camadas, e a regra que as separa é: **a interface não decide
nada**. Toda decisão do método mora em `lib/`, em funções puras e testáveis.

```
src/
├── types/          Modelo de domínio (uma fonte de verdade para as formas)
├── data/           Sementes: matérias, trilhas, treinos, refeições, falas do coach
├── lib/            ── O MÉTODO ──
│   ├── routineEngine.ts   Gera a semana-modelo a partir dos horários
│   ├── studyEngine.ts     Monta a sessão de 5 passos e ranqueia matérias
│   ├── agendaEngine.ts    Deriva a agenda do dia e resolve "o que fazer agora"
│   ├── statsEngine.ts     Streak, semana, distribuição por matéria
│   ├── persistence.ts     Adaptador de storage + export/import
│   └── date.ts            Datas e horários em fuso local
├── store/          Zustand (estado + ações) e seletores derivados
├── components/     UI reutilizável (ui/, layout/, home/, study/, progress/)
└── screens/        Uma tela por rota
```

### A decisão de arquitetura que mais importa

**A agenda do dia nunca é persistida.** Ela é sempre derivada de
`semana-modelo + treino + refeições` no momento da renderização. O que se salva é apenas
o *resultado* — o `DayLog`, que guarda estado por id de bloco.

Isso é o que permite "editar a rotina sem quebrar o sistema": o usuário pode mudar
horários, remover blocos ou regerar a semana inteira, e o histórico continua íntegro.
Ids de bloco que deixaram de existir simplesmente não são encontrados e voltam a
`pendente`, em vez de corromper o registro. Não há migração de dados a escrever.

---

## Fluxo das telas

```
Onboarding (4 passos)  →  gera semana-modelo, matérias e trilhas
        │
        ▼
   HOJE (/)  ────────────────────────────────────────────┐
   • card "AGORA" com o próximo passo e uma ação         │
   • "Depois:" com o bloco seguinte                      │
   • alertas acionáveis (comida base em falta)           │
   • faixa de status: escola · treino · estudo ·         │
     comida · sono                                        │
   • linha do tempo do dia, concluir/pular em 1 toque    │
        │                                                 │
        ▼                                                 │
   AGORA (/agora) — modo execução imersivo                │
   • uma tarefa, tempo estimado, 3 botões                 │
   • se for estudo → roda a sessão de 5 passos ──────────┤
   • se for treino → abre o registro de treino            │
        │                                                 │
        ├─ ESTUDOS (/estudos)  sugestão do dia + trilhas  │
        ├─ TREINO (/treino)    split, cargas, baixa       │
        │                       motivação                  │
        ├─ COMIDA (/comida)    refeições · estoque ·      │
        │                       compras                    │
        ├─ PROGRESSO           streak, semana, gráficos   │
        └─ ROTINA / AJUSTES    horários, pesos, backup ───┘
```

---

## Como o método funciona

### 1. A sessão de estudo guiada

Toda sessão segue a mesma sequência:

**revisão da aula anterior → videoaula → exercícios → dúvidas → revisão final**

Mas ela não é igual para todo mundo. Dois parâmetros por matéria mudam o resultado:

**Peso na semana (`tier`)** — controla quais passos entram:

| Tier | Passos | Matérias iniciais |
|---|---|---|
| `nucleo` | todos os 5 | Matemática, Física, Química |
| `apoio` | todos os 5, mais curtos | Biologia, História, Geografia, Redação |
| `leve` | revisão → leitura curta → revisão | Português, Sociologia, Filosofia |
| `opcional` | só revisão | Inglês |

Português, Sociologia e Filosofia entram como **revisão e anotação**, sem videoaula longa
nem lista de exercícios. Inglês é mínimo. É exatamente o pedido do produto, codificado em
`TIER_STEPS`.

**Força na matéria (`strength`)** — ajusta a duração: quem está fraco recebe 30% mais
videoaula e 20% mais exercício; quem está forte corre para a prática.

A sessão ainda é comprimida proporcionalmente para caber no bloco da agenda, sem deixar
nenhum passo abaixo de 5 minutos.

### 2. A sugestão: o que estudar agora

`rankSubjects()` pontua cada matéria combinando:

- **prioridade do método** (núcleo 100 · apoio 70 · leve 35 · opcional 15)
- **tempo desde a última revisão** (+6 pontos por dia, teto de 60) — o que está parado sobe
- **ponto fraco** (+25) e tópico já em andamento (+20)
- **dificuldade** do próximo tópico
- **penalidade de repetição**: matéria já estudada hoje cai 120 pontos
- **dia leve**: matéria pesada perde 30, matéria leve ganha 40

O app sempre **explica a escolha** ("parada há 9 dias", "é seu ponto fraco"). Sugerir sem
justificar é pedir confiança cega.

### 3. A semana-modelo

`generateWeek()` monta os blocos a partir de poucos parâmetros. Três regras evitam os
erros clássicos de um gerador ingênuo:

- **Âncoras civis** — almoço nunca antes das 12:30, jantar nunca antes das 19:30. O
  encadeamento puro produzia almoço às 10h no sábado.
- **Preenchimento de vãos** — quando um bloco é ancorado (treino às 17:30), sobra um
  buraco antes dele. `fillGaps()` transforma vãos de 30 min ou mais em "Tempo livre"
  explícito, para o modo execução não tratar o intervalo como atraso.
- **Âncora de tarde** — no fim de semana, sem escola, a tarde viraria um vão de cinco
  horas. Um bloco de estudo (ou revisão da semana, no dia leve) ancora as 15:30.

Dias com aula à tarde recebem uma montagem diferente: estudo em bloco único, à noite.

Editar um dia à mão o marca como `customized` — mudanças globais deixam de sobrescrevê-lo,
e um botão o devolve ao padrão.

### 4. "O que fazer agora"

`resolveNow()` escolhe o foco: entre os blocos pendentes, o que já começou e ainda está na
janela; se todos passaram, o mais recente (é o que retomar); se nenhum começou, o próximo.

Blocos **ambientes** — acordar, banho, escola, dormir, tempo livre — nunca geram alerta de
atraso. Avisar às 7h30 que o bloco "Acordar" ficou para trás só produz culpa inútil.

### 5. Consistência acima de resultado

O streak conta **dia com esforço**: 20 minutos de estudo *ou* um treino. Não exige o dia
perfeito. E se hoje ainda não contou, o streak de ontem é mantido — o dia não acabou, não
faz sentido zerar de manhã.

---

## Persistência e o caminho para um backend

Tudo é salvo em `localStorage` sob a chave `sistema-fernando`, com `version` para
migrações futuras. O `localStorageAdapter` trata os dois modos de falha reais no celular:
modo privado do Safari (o acesso lança) e cota estourada.

**Para plugar um backend depois**, basta implementar `StorageAdapter` em
`lib/persistence.ts` chamando a API — a assinatura já aceita `Promise`, que é o que o
Zustand espera. Nenhuma tela muda. O `PersistedState` em `types/index.ts` já é o contrato
de serialização, e é o mesmo formato do backup exportável.

Exportar e importar backup em JSON está em **Ajustes**.

---

## Design

Escuro por padrão, neutro, com **um único destaque**: lime `#D4FF3F`. A regra é que o lime
nunca é decorativo — se algo está lime, é onde tocar ou onde olhar.

- Tipografia Inter Variable, auto-hospedada (funciona offline)
- Alvos de toque de 44px+, botões grandes, bottom sheets no celular
- `tnum` (números tabulares) em métricas, para não "dançarem" ao atualizar
- Navegação inferior no celular, barra lateral no desktop
- Respeita `prefers-reduced-motion`

O tom das mensagens é direto e adulto: "Não precisa estar animado. Precisa ir." Sem emoji,
sem bajulação, sem infantilizar.

---

## Verificação

O app foi testado no navegador (Chromium, viewport de celular) com relógio congelado:

- **31 verificações funcionais** cobrindo o fluxo completo — onboarding, sessão de estudo
  de ponta a ponta, registro de treino com carga, marcação de refeição, estoque → lista de
  compras, streak, persistência após reload, e integridade do histórico após regerar a
  semana inteira.
- **Validação da semana gerada** nos 7 dias: sem sobreposição de blocos, sem buraco não
  declarado, refeições em horário civil, nada terminando depois da hora de dormir.

Ambos os scripts estão descritos acima e podem ser reproduzidos contra `npm run preview`.

### Nota sobre `npm audit`

`npm audit` reporta um aviso de severidade alta em `react-router` referente ao **modo RSC**
(React Server Components / server actions). Este app é um SPA estático, sem servidor e sem
RSC, então o aviso não se aplica. Vale registrar que *baixar* a versão é pior: a 7.11
carrega 14 advisories contra 1 da versão atual. A recomendação é permanecer na última.
