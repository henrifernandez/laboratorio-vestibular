import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualEstat =
  | { tipo: 'pontos'; valores: number[]; media?: boolean; mediana?: boolean; moda?: boolean; extremo?: number }
  | { tipo: 'histograma'; inicio: number; largura: number; freqs: number[] }

export interface PassoEstat {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualEstat
}

export const PASSOS_ESTAT: PassoEstat[] = [
  {
    titulo: 'Média: o ponto de equilíbrio',
    texto: [
      'Você tirou 6, 7, 8, 9 e 10 em cinco provas. Some tudo (40) e divida por 5: a média é 8.',
      'Imagine os valores como pesos numa gangorra: a média é o ponto onde ela fica em equilíbrio. Todos os valores participam do cálculo.',
    ],
    pare: {
      pergunta: 'Qual é a média de 2, 4 e 9?',
      opcoes: ['4', '5', '6'],
      certa: 1,
      explicacao: '(2 + 4 + 9) ÷ 3 = 15 ÷ 3 = 5.',
    },
    visual: { tipo: 'pontos', valores: [6, 7, 8, 9, 10], media: true },
  },
  {
    titulo: 'Mediana: o valor do meio',
    texto: [
      'Coloque os valores em ordem crescente. A mediana é o valor central. Com uma quantidade par de valores, é a média dos dois centrais.',
      'Em 1, 3, 5, 7, 20, a mediana é 5, e o 20 distante não a afeta: ela só olha a posição.',
    ],
    pare: {
      pergunta: 'Qual é a mediana de 9, 1, 7, 3 e 5?',
      opcoes: ['7', '5', '3'],
      certa: 1,
      explicacao: 'Em ordem: 1, 3, 5, 7, 9. O valor do meio é 5. Atenção: é preciso ordenar antes de achar o meio.',
    },
    visual: { tipo: 'pontos', valores: [1, 3, 5, 7, 20], mediana: true },
  },
  {
    titulo: 'Moda: o que mais se repete',
    texto: [
      'A moda é o valor mais frequente. Em 2, 3, 3, 3, 5, 7 a moda é 3.',
      'Pode haver mais de uma moda (bimodal) ou nenhuma (quando todos aparecem o mesmo número de vezes). Ela serve até para dados que não são números, como cores favoritas.',
    ],
    pare: {
      pergunta: 'Qual é a moda de 1, 2, 2, 3, 3, 3, 4?',
      opcoes: ['2', '3', '4'],
      certa: 1,
      explicacao: 'O 3 aparece 3 vezes, mais que qualquer outro valor.',
    },
    visual: { tipo: 'pontos', valores: [2, 3, 3, 3, 5, 7], moda: true },
  },
  {
    titulo: 'Um valor extremo muda quem?',
    texto: [
      'Veja 4, 5, 6, 6, 7 com a média e a mediana marcadas. Agora acrescente um valor muito distante, 30.',
      'A média dispara, porque soma todos os valores. A mediana mal se mexe. Por isso, em salários ou preços com extremos, a mediana representa melhor o "típico".',
    ],
    pare: {
      pergunta: 'Com um valor extremo no conjunto, qual medida é mais afetada?',
      opcoes: ['A média', 'A mediana', 'As duas igualmente'],
      certa: 0,
      explicacao: 'A média usa todos os valores, então o extremo a puxa. A mediana só depende da posição central.',
    },
    visual: { tipo: 'pontos', valores: [4, 5, 6, 6, 7, 30], media: true, mediana: true, extremo: 30 },
  },
  {
    titulo: 'Histograma: dados em classes',
    texto: [
      'Quando há muitos valores, agrupamos em classes (faixas). A altura de cada barra é a frequência: quantos valores caem naquela faixa.',
      'A soma das alturas é o total de dados. A classe de barra mais alta é a classe modal.',
    ],
    pare: {
      pergunta: 'Um histograma tem barras de altura 3, 5, 4 e 8. Quantos dados há ao todo?',
      opcoes: ['8', '20', '5'],
      certa: 1,
      explicacao: '3 + 5 + 4 + 8 = 20 dados.',
    },
    visual: { tipo: 'histograma', inicio: 0, largura: 2, freqs: [3, 5, 4, 8] },
  },
]

export const RESUMO_ESTAT: SecaoResumo[] = [
  {
    titulo: 'Medidas de posição',
    formulas: [
      { rotulo: 'Média aritmética', tex: '\\bar{x} = \\dfrac{x_1 + x_2 + \\cdots + x_n}{n}' },
      { rotulo: 'Média ponderada', tex: '\\bar{x} = \\dfrac{\\sum x_i \\cdot f_i}{\\sum f_i}' },
    ],
    ideias: [
      'Média: soma ÷ quantidade; usa todos os valores.',
      'Mediana: valor central dos dados ordenados; com quantidade par, média dos dois centrais.',
      'Moda: valor de maior frequência (pode haver várias, ou nenhuma).',
    ],
    pegadinhas: ['Ordene os dados antes de achar a mediana.', 'A média é sensível a valores extremos; a mediana, não.', 'Em tabela de frequências, considere as repetições (frequências).'],
  },
  {
    titulo: 'Medidas de dispersão',
    formulas: [
      { rotulo: 'Amplitude', tex: 'A = x_{max} - x_{min}' },
      { rotulo: 'Variância', tex: '\\sigma^{2} = \\dfrac{\\sum (x_i - \\bar{x})^{2}}{n}' },
      { rotulo: 'Desvio padrão', tex: '\\sigma = \\sqrt{\\sigma^{2}}' },
    ],
    ideias: ['Desvio padrão pequeno: dados concentrados perto da média.', 'Somar uma constante a todos os dados não muda o desvio padrão; multiplicar por k multiplica o desvio por |k|.'],
    pegadinhas: ['O desvio padrão tem a mesma unidade dos dados; a variância, a unidade ao quadrado.'],
  },
  {
    titulo: 'Tabelas e histogramas',
    formulas: [
      { rotulo: 'Frequência relativa', tex: 'f_r = \\dfrac{f_i}{n}' },
      { rotulo: 'Ponto médio da classe', tex: 'PM = \\dfrac{\\text{limite inferior} + \\text{limite superior}}{2}' },
    ],
    ideias: [
      'A altura da barra é a frequência da classe; a soma das alturas é o total.',
      'Média de dados agrupados: use o ponto médio de cada classe, ponderado pela frequência.',
    ],
    pegadinhas: ['Cuidado com os limites das classes: [a, b) inclui a e exclui b.', 'Porcentagem = frequência da classe ÷ total × 100.'],
  },
]
