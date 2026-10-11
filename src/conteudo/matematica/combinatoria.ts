import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualComb =
  | { tipo: 'arvore'; niveis: { nome: string; opcoes: string[] }[] }
  | { tipo: 'permutacao'; letras: string[] }
  | { tipo: 'arranjoCombinacao'; letras: string[]; p: number }
  | { tipo: 'dado'; favoraveis: number[]; titulo: string }
  | { tipo: 'simulacao'; lancamentos: number[] }

export interface PassoComb {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualComb
}

export const PASSOS_COMB: PassoComb[] = [
  {
    titulo: 'Princípio multiplicativo: a árvore de possibilidades',
    texto: [
      'Um lanche tem 2 tipos de pão e 3 de recheio. Para cada pão há 3 recheios: 3 + 3 = 6 lanches. Cada ramo da árvore é uma possibilidade.',
      'Quando uma escolha acontece em etapas, as possibilidades se multiplicam: 2 × 3 = 6. Com um molho de 2 tipos, seriam 2 × 3 × 2 = 12.',
    ],
    pare: {
      pergunta: 'Júlia tem 3 camisetas e 4 calças. De quantas maneiras ela pode se vestir com uma de cada?',
      opcoes: ['7', '12', '34'],
      certa: 1,
      explicacao: '3 × 4 = 12. Para cada camiseta, 4 calças possíveis; somar daria um valor errado.',
    },
    visual: { tipo: 'arvore', niveis: [{ nome: 'Pão', opcoes: ['francês', 'integral'] }, { nome: 'Recheio', opcoes: ['queijo', 'presunto', 'frango'] }] },
  },
  {
    titulo: 'Permutação: todos entram, muda só a ordem',
    texto: [
      'De quantas formas A, B e C podem ficar em fila? São 6: ABC, ACB, BAC, BCA, CAB e CBA.',
      'A 1ª posição tem 3 opções, a 2ª tem 2 e a 3ª tem 1: 3 × 2 × 1 = 3! = 6. Em geral, n elementos têm n! permutações.',
    ],
    pare: {
      pergunta: 'De quantas formas 4 pessoas podem formar uma fila?',
      opcoes: ['16', '24', '12'],
      certa: 1,
      explicacao: '4! = 4 × 3 × 2 × 1 = 24.',
    },
    visual: { tipo: 'permutacao', letras: ['A', 'B', 'C'] },
  },
  {
    titulo: 'Arranjo e combinação: a ordem importa?',
    texto: [
      'Escolher 2 entre A, B, C e D. Se a ordem importa (presidente e vice), AB e BA são diferentes: são 12 arranjos. Se não importa (uma dupla), AB e BA são a mesma dupla: são 6 combinações.',
      'Cada combinação gera p! arranjos (aqui 2! = 2), por isso C(n, p) = A(n, p) ÷ p!.',
    ],
    pare: {
      pergunta: 'Escolher o presidente e o vice de um grupo de 5 pessoas é um problema de...',
      opcoes: ['Combinação', 'Arranjo', 'Permutação'],
      certa: 1,
      explicacao: 'Presidente e vice são cargos diferentes: trocar quem ocupa cada um muda o resultado. A ordem importa, então é arranjo: A(5, 2) = 20.',
    },
    visual: { tipo: 'arranjoCombinacao', letras: ['A', 'B', 'C', 'D'], p: 2 },
  },
  {
    titulo: 'Probabilidade: favoráveis ÷ possíveis',
    texto: [
      'Num dado de 6 faces, "sair par" tem 3 resultados favoráveis (2, 4 e 6) entre 6 possíveis: P = 3/6 = 1/2.',
      'Vale quando os resultados são equiprováveis. A probabilidade fica sempre entre 0 (impossível) e 1 (certo).',
    ],
    pare: {
      pergunta: 'Qual é a probabilidade de sair 5 ou 6 em um dado honesto?',
      opcoes: ['1/6', '1/3', '1/2'],
      certa: 1,
      explicacao: 'Favoráveis: 5 e 6 (2 resultados) entre 6 possíveis: 2/6 = 1/3.',
    },
    visual: { tipo: 'dado', favoraveis: [2, 4, 6], titulo: 'Sair par' },
  },
  {
    titulo: 'A frequência tende à probabilidade',
    texto: [
      'Lance uma moeda 10 vezes: é fácil sair 7 caras (70%). Lance 5.000 vezes: a frequência fica bem perto de 50%.',
      'É a lei dos grandes números: quanto mais repetições, mais a frequência relativa se aproxima da probabilidade teórica. Mas a moeda não tem memória: cada lançamento continua com 1/2.',
    ],
    pare: {
      pergunta: 'Com muito mais lançamentos, a frequência relativa de caras...',
      opcoes: ['se aproxima de 50%', 'fica exatamente em 50%', 'passa a favorecer coroa'],
      certa: 0,
      explicacao: 'A frequência se aproxima de 50%, mas oscila: não precisa ser exata, e a moeda não "compensa" lançamentos anteriores.',
    },
    visual: { tipo: 'simulacao', lancamentos: [10, 5000] },
  },
]

export const RESUMO_COMB: SecaoResumo[] = [
  {
    titulo: 'Princípio fundamental da contagem',
    formulas: [{ rotulo: 'Etapas independentes', tex: 'n_1 \\cdot n_2 \\cdot \\ldots \\cdot n_k' }],
    ideias: ['Escolhas em etapas: multiplique as possibilidades de cada etapa.', 'Se as opções são alternativas (uma OU outra), some.'],
    pegadinhas: ['Somar quando deveria multiplicar é o erro mais comum.', 'Cuidado com restrições: comece pela etapa mais restrita.'],
  },
  {
    titulo: 'Permutações',
    formulas: [
      { rotulo: 'Permutação simples', tex: 'P_n = n!' },
      { rotulo: 'Com elementos repetidos', tex: 'P_n^{a,b,\\ldots} = \\dfrac{n!}{a!\\,b!\\cdots}' },
    ],
    ideias: ['Todos os elementos entram; só muda a ordem.', 'Anagramas de palavra com letras repetidas: divida pelo fatorial de cada repetição.'],
    pegadinhas: ['0! = 1.', 'ARARA tem 5!/(3!·2!) = 10 anagramas, e não 5! = 120.'],
  },
  {
    titulo: 'Arranjo e combinação',
    formulas: [
      { rotulo: 'Arranjo', tex: 'A_{n,p} = \\dfrac{n!}{(n-p)!}' },
      { rotulo: 'Combinação', tex: 'C_{n,p} = \\dfrac{n!}{p!\\,(n-p)!}' },
      { rotulo: 'Relação', tex: 'C_{n,p} = \\dfrac{A_{n,p}}{p!}' },
    ],
    ideias: ['Teste: trocar a ordem dos escolhidos muda o resultado? Sim → arranjo. Não → combinação.', 'C(n, p) = C(n, n − p).'],
    pegadinhas: ['Comissão, time, grupo, subconjunto: combinação. Pódio, senha, cargos, fila: arranjo.', 'Grupos diferentes escolhidos juntos: multiplique as combinações de cada grupo.'],
  },
  {
    titulo: 'Probabilidade',
    formulas: [
      { rotulo: 'Definição', tex: 'P(A) = \\dfrac{n(A)}{n(\\Omega)}' },
      { rotulo: 'Complementar', tex: 'P(\\bar{A}) = 1 - P(A)' },
      { rotulo: 'União', tex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)' },
      { rotulo: 'Eventos independentes', tex: 'P(A \\cap B) = P(A)\\cdot P(B)' },
      { rotulo: 'Condicional', tex: 'P(A \\mid B) = \\dfrac{P(A \\cap B)}{P(B)}' },
    ],
    ideias: ['"Pelo menos um" costuma sair pelo complementar (1 − nenhum).', 'Sem reposição: a probabilidade da 2ª extração usa a urna já modificada.'],
    pegadinhas: ['Dois dados têm 36 resultados possíveis, e não 12.', 'A moeda não tem memória: a sequência anterior não muda o próximo lançamento.', 'Para "ou" com eventos que podem ocorrer juntos, subtraia a interseção.'],
  },
]
