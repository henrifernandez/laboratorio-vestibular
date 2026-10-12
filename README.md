# Laboratório Vestibular

Site de estudo interativo para o vestibular: cada matéria vira um laboratório em que você aprende **mexendo** nos conceitos (arrastar pontos, ajustar coeficientes, errar e ver o que muda), em vez de fazer simulados. Feito para a 1ª fase da Unicamp.

Site 100% estático (Vite + React + TypeScript), sem backend e sem cadastro: o progresso fica no `localStorage` do navegador.

## Como rodar

```bash
npm install
npm run dev        # servidor local em http://localhost:5173
```

## Testes e verificações

```bash
npm test           # testes unitários (Vitest)
npm run typecheck  # TypeScript em modo strict
npm run lint       # ESLint
npm run build      # gera dist/
```

## Estrutura

```
src/
  app/          rotas, layout e tema claro/escuro
  design/       tokens de design (cores por matéria, espaços, sombras)
  sim/          kit de simulação reutilizável (Cena, controles, laço de passo fixo...)
  desafios/     motor de desafios, progresso, caderno de erros e revisão mista
  conteudo/     textos e dados de cada tema, separados dos componentes
  materias/     um módulo por tema, carregado sob demanda (code splitting)
  paginas/      Início, Matéria, Tema, Meu progresso, Revisão mista
  lib/          gerador aleatório com semente, localStorage seguro, tema
```

Cada tema tem quatro abas: **Entenda**, **Laboratório**, **Desafios** e **Resumo**.

## Status

Publicados (cada tema com Entenda, Laboratório, Desafios e Resumo):

- **Matemática:** funções, porcentagem e juros, PA e PG, estatística, combinatória, trigonometria, geometria analítica e geometria.
- **Física:** cinemática, dinâmica, termologia e eletricidade.
- **Química:** estequiometria, soluções, orgânica, equilíbrio e pH, cinética e química verde.
- **Biologia:** ecologia, genética, molecular e celular.
- **História:** linha do tempo.
- **Geografia:** placas tectônicas, climogramas, fenômenos em ação, pirâmide etária, fusos horários e mapa-desafio.
- **Sociologia:** três lentes (Durkheim, Weber, Marx e outros).
- **Filosofia:** mapa dos pensadores.

Próxima fase: revisão mista, painel de progresso e auditorias finais (acessibilidade, desempenho e contraste).

## Deploy

Vercel, preset Vite (build `npm run build`, saída `dist`). O `vercel.json` reescreve todas as rotas para `/index.html`.
