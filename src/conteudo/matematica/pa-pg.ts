import type { PareEPense, SecaoResumo } from '../tipos'

export interface VisualSeq {
  tipo: 'PA' | 'PG'
  a1: number
  razao: number
  n: number
}

export interface PassoPaPg {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualSeq
}

export const PASSOS_PA_PG: PassoPaPg[] = [
  {
    titulo: 'PA: uma escada com degraus iguais',
    texto: [
      'Você guarda R$ 2 e, a cada semana, guarda R$ 3 a mais que na anterior: 2, 5, 8, 11, 14... Cada termo é o anterior mais um número fixo.',
      'Esse número fixo é a razão r. Numa PA, a diferença entre termos vizinhos é sempre r (aqui, 3), e os degraus da escada têm a mesma altura.',
    ],
    pare: {
      pergunta: 'Na sequência 7, 11, 15, 19, ..., qual é a razão?',
      opcoes: ['3', '4', '7'],
      certa: 1,
      explicacao: '11 − 7 = 4, 15 − 11 = 4. A razão é a diferença constante: 4.',
    },
    visual: { tipo: 'PA', a1: 2, razao: 3, n: 6 },
  },
  {
    titulo: 'O termo geral da PA',
    texto: [
      'Para chegar ao 10º termo de 3, 7, 11, ... não precisa listar todos: do 1º ao 10º termo há 9 degraus de tamanho 4. Então a₁₀ = 3 + 9·4 = 39.',
      'Em geral: aₙ = a₁ + (n − 1)·r. O (n − 1) é porque o primeiro termo ainda não andou nenhum degrau.',
    ],
    pare: {
      pergunta: 'Numa PA com a₁ = 5 e r = 2, quanto vale a₈?',
      opcoes: ['19', '21', '17'],
      certa: 0,
      explicacao: 'a₈ = 5 + (8 − 1)·2 = 5 + 14 = 19.',
    },
    visual: { tipo: 'PA', a1: 3, razao: 4, n: 10 },
  },
  {
    titulo: 'PG: blocos que multiplicam',
    texto: [
      'Um vídeo começa com 3 visualizações e dobra a cada dia: 3, 6, 12, 24, 48... Cada termo é o anterior vezes um número fixo, a razão q (aqui, 2).',
      'Numa PG, o quociente entre termos vizinhos é sempre q. As barras crescem cada vez mais depressa, bem diferente da escada da PA.',
    ],
    pare: {
      pergunta: 'Na sequência 80, 40, 20, 10, ..., qual é a razão?',
      opcoes: ['−40', '2', '1/2'],
      certa: 2,
      explicacao: '40 ÷ 80 = 1/2. Uma PG pode ser decrescente: com razão entre 0 e 1 os termos diminuem.',
    },
    visual: { tipo: 'PG', a1: 3, razao: 2, n: 6 },
  },
  {
    titulo: 'O termo geral da PG',
    texto: [
      'Para o 5º termo de 2, 6, 18, ... multiplique 4 vezes por 3: a₅ = 2·3⁴ = 162.',
      'Em geral: aₙ = a₁·qⁿ⁻¹. De novo o expoente é n − 1: o primeiro termo ainda não foi multiplicado por nada.',
    ],
    pare: {
      pergunta: 'Numa PG com a₁ = 2 e q = 3, quanto vale a₅?',
      opcoes: ['162', '486', '30'],
      certa: 0,
      explicacao: 'a₅ = 2·3⁴ = 2·81 = 162. Usar 3⁵ (486) seria o erro de colocar n no expoente.',
    },
    visual: { tipo: 'PG', a1: 2, razao: 3, n: 5 },
  },
  {
    titulo: 'Somando uma PA: o truque de Gauss',
    texto: [
      'Somar 1 + 2 + ... + 10: junte o primeiro com o último (1 + 10 = 11), o segundo com o penúltimo (2 + 9 = 11), e assim por diante. São 5 pares de 11: 55.',
      'Em geral: Sₙ = n·(a₁ + aₙ)/2. Para a PG com q ≠ 1: Sₙ = a₁·(qⁿ − 1)/(q − 1).',
    ],
    pare: {
      pergunta: 'Qual é a soma 1 + 2 + 3 + ... + 100?',
      opcoes: ['5.050', '10.100', '5.000'],
      certa: 0,
      explicacao: 'S = 100·(1 + 100)/2 = 100·101/2 = 5.050.',
    },
    visual: { tipo: 'PA', a1: 1, razao: 1, n: 10 },
  },
]

export const RESUMO_PA_PG: SecaoResumo[] = [
  {
    titulo: 'Progressão aritmética (PA)',
    formulas: [
      { rotulo: 'Razão', tex: 'r = a_{n+1} - a_n' },
      { rotulo: 'Termo geral', tex: 'a_n = a_1 + (n-1)\\,r' },
      { rotulo: 'Soma dos n primeiros termos', tex: 'S_n = \\dfrac{n\\,(a_1 + a_n)}{2}' },
      { rotulo: 'Termo médio', tex: 'a_n = \\dfrac{a_{n-1} + a_{n+1}}{2}' },
    ],
    ideias: ['Diferença constante entre termos vizinhos.', 'r > 0: crescente; r < 0: decrescente; r = 0: constante.', 'O gráfico de aₙ por n são pontos alinhados (função afim).'],
    pegadinhas: ['O fator é (n − 1), e não n.', 'Na soma, esquecer de dividir por 2.', 'Três termos a, b, c estão em PA quando b é a média de a e c.'],
  },
  {
    titulo: 'Progressão geométrica (PG)',
    formulas: [
      { rotulo: 'Razão', tex: 'q = \\dfrac{a_{n+1}}{a_n}' },
      { rotulo: 'Termo geral', tex: 'a_n = a_1 \\cdot q^{\\,n-1}' },
      { rotulo: 'Soma finita (q ≠ 1)', tex: 'S_n = \\dfrac{a_1\\,(q^{n} - 1)}{q - 1}' },
      { rotulo: 'Soma infinita (|q| < 1)', tex: 'S = \\dfrac{a_1}{1 - q}' },
      { rotulo: 'Termo médio', tex: 'a_n^{2} = a_{n-1}\\cdot a_{n+1}' },
    ],
    ideias: ['Quociente constante entre termos vizinhos.', 'q > 1 (com a₁ > 0): cresce; 0 < q < 1: decresce; q < 0: sinais alternados.', 'O gráfico de aₙ por n segue uma exponencial.'],
    pegadinhas: [
      'O expoente é n − 1, e não n.',
      'A soma infinita só existe quando |q| < 1; com |q| ≥ 1 ela diverge.',
      'Na soma finita o expoente é n (o número de termos), diferente do termo geral.',
    ],
  },
  {
    titulo: 'Como distinguir',
    formulas: [],
    ideias: [
      'Calcule diferenças e quocientes entre termos vizinhos: o que for constante diz o tipo.',
      'Juros simples seguem uma PA; juros compostos, uma PG.',
    ],
    pegadinhas: ['Uma sequência pode não ser nem PA nem PG (como 1, 2, 4, 7, ...).', 'A sequência constante é PA de razão 0 e também PG de razão 1.'],
  },
]
