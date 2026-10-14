# Laboratório Vestibular

Site de estudo interativo para o vestibular: cada matéria vira um laboratório em que você aprende **mexendo** nos conceitos (arrastar pontos, ajustar coeficientes, errar e ver o que muda), em vez de fazer simulados.

Site em Vite + React + TypeScript. Funciona 100% sem conta (o progresso fica no `localStorage` do navegador). Opcionalmente, há login só com nome e senha, que guarda o progresso no servidor (funções em `api/`, ver "Contas" abaixo).

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
  lib/          gerador aleatório com semente, localStorage seguro, tema, mescla de progresso
  conta/        contexto de conta no navegador (entrar, sair, sincronizar o progresso)
api/            funções da Vercel (uma por rota: eu, cadastrar, entrar, sair, progresso, excluir-conta)
servidor/       lógica das contas (validação, senha com scrypt, rotas, cliente do Redis) e seus testes
```

Cada tema tem quatro abas: **Entenda**, **Laboratório**, **Desafios** e **Resumo**.

## Status

Publicados (cada tema com Entenda, Laboratório, Desafios e Resumo):

- **Matemática:** funções, porcentagem e juros, PA e PG, estatística, combinatória, trigonometria, geometria analítica e geometria.
- **Física:** cinemática, dinâmica, termologia e eletricidade.
- **Química:** estequiometria, soluções, orgânica, equilíbrio e pH, cinética e química verde.
- **Biologia:** ecologia, genética, molecular e celular.
- **História:** linha do tempo.
- **Geografia:** placas tectônicas, climogramas, fenômenos em ação, pirâmide etária, fusos horários, mapa-desafio, geografia agrária e geopolítica.
- **Sociologia:** três lentes (Durkheim, Weber, Marx e outros), com desafios de ligar autores a correntes, conceitos e casos.
- **Filosofia:** mapa dos pensadores, com correntes e desafios de ligar cada pensador à sua corrente.

Próxima fase: revisão mista, painel de progresso e auditorias finais (acessibilidade, desempenho e contraste).

## Deploy

Vercel, preset Vite (build `npm run build`, saída `dist`). O `vercel.json` reescreve as rotas do site para `/index.html` (menos `/api`) e define cabeçalhos de segurança básicos.

## Contas (login com nome e senha)

As funções em `api/` guardam contas e progresso num Redis (Upstash). Sem o banco, o site continua funcionando normalmente e o botão **Entrar** não aparece.

1. No painel da Vercel, em **Storage** (ou Marketplace), crie um banco **Upstash for Redis** e conecte ao projeto. A integração cria as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` (também são aceitas `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`).
2. Faça um novo deploy para as variáveis valerem.
3. Opcional: defina `CODIGO_CONVITE` para exigir um código ao criar conta (útil se o endereço for divulgado em público).

Como funciona: a senha é guardada com scrypt e sal aleatório; a sessão é um cookie `HttpOnly` cujo valor só existe no navegador (o banco guarda o resumo SHA-256); há limite de tentativas por endereço e por nome; os pedidos que alteram dados exigem JSON e a mesma origem do site. Não há e-mail, então não existe recuperação de senha. O progresso de cada aparelho é juntado ao da conta ao entrar (vale, por desafio, o registro com mais tentativas). A conta pode ser excluída na página **Minha conta**.

## Licença e créditos

Código sob a licença [MIT](LICENSE): você pode usar, copiar e modificar, mantendo o aviso de copyright.

O texto das explicações foi escrito para este projeto, sem citações literais de autores. Se achar um erro de conteúdo (um dado, uma data, uma explicação), abra uma *issue*.

Feito com bibliotecas de código aberto: React, Vite, React Router, Mafs, KaTeX, mathjs, d3-geo, three.js, dnd-kit, motion e lucide-react (MIT, ISC e Apache-2.0). As fontes Inter e Fraunces (via Fontsource) usam a licença OFL. Os contornos de países vêm do pacote `world-atlas` (dados do Natural Earth, domínio público).

## Contribuindo

Sugestões e correções são bem-vindas por *issue* ou *pull request*. Antes de enviar, rode `npm run typecheck`, `npm run lint` e `npm test`. Para um tema novo, siga o padrão dos que já existem em `src/materias/` (cálculo testado, geradores de desafio conferidos contra um cálculo independente).
