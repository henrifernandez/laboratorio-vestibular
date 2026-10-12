import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualEst =
  | { tipo: 'conservacao'; reacao: string; coefs: number[] }
  | { tipo: 'mol' }
  | { tipo: 'proporcao'; reacao: string }
  | { tipo: 'limitante'; reacao: string; mols: number[] }
  | { tipo: 'rendimento' }

export interface PassoEst {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualEst
}

export const PASSOS_EST: PassoEst[] = [
  {
    titulo: 'Os átomos não somem: balancear',
    texto: [
      'Numa reação química os átomos se rearranjam, mas nenhum é criado nem destruído. Por isso, o número de átomos de cada elemento tem de ser igual antes e depois da seta.',
      'Balancear é acertar os coeficientes, os números na frente das fórmulas. Os índices dentro da fórmula (o 2 de H₂O) nunca mudam, porque mudar um índice mudaria a substância.',
    ],
    pare: {
      pergunta: 'Em H₂ + O₂ → H₂O, há 2 átomos de O à esquerda e 1 à direita. Qual ajuste resolve o oxigênio?',
      opcoes: ['H₂ + O₂ → H₂O₂', '2 H₂ + O₂ → 2 H₂O', 'H₂ + O₂ → 2 H₂O'],
      certa: 1,
      explicacao: 'O coeficiente 2 na água dá 2 átomos de O, e depois 2 H₂ dão os 4 átomos de H. A primeira opção muda o índice e cria outra substância (água oxigenada). A terceira acerta o O, mas deixa o H desigual (2 à esquerda, 4 à direita).',
    },
    visual: { tipo: 'conservacao', reacao: 'agua', coefs: [2, 1, 2] },
  },
  {
    titulo: 'O mol: contar átomos pesando',
    texto: [
      'Átomos são pequenos demais para contar um a um, então usamos o mol: 1 mol são 6·10²³ partículas (número de Avogadro). A massa de 1 mol é a massa molar, e seu valor em g/mol é o mesmo da massa atômica ou molecular.',
      'Exemplo: H₂O tem massa molecular 2·1 + 16 = 18, logo a massa molar é 18 g/mol. Então 36 g de água são 2 mol, ou seja, 12·10²³ moléculas. A conta de ponte é sempre n = m ÷ M.',
    ],
    pare: {
      pergunta: 'Quantos mols há em 88 g de CO₂? (C = 12; O = 16)',
      opcoes: ['2 mol', '4 mol', '0,5 mol'],
      certa: 0,
      explicacao: 'M(CO₂) = 12 + 2·16 = 44 g/mol, então n = 88 ÷ 44 = 2 mol. O 4 vem de dividir por 22, e o 0,5 de dividir ao contrário (44 ÷ 88).',
    },
    visual: { tipo: 'mol' },
  },
  {
    titulo: 'Coeficientes são proporção em mols',
    texto: [
      'Em N₂ + 3 H₂ → 2 NH₃, os coeficientes dizem: 1 mol de N₂ reage com 3 mol de H₂ e forma 2 mol de NH₃. Eles valem para mols (e para moléculas), não para gramas.',
      'Por isso o caminho de um cálculo é sempre o mesmo: gramas → mols (÷ massa molar) → proporção dos coeficientes → mols da outra substância → gramas (× massa molar).',
    ],
    pare: {
      pergunta: 'Em N₂ + 3 H₂ → 2 NH₃, quantos mols de NH₃ se formam a partir de 3 mol de N₂?',
      opcoes: ['3 mol', '6 mol', '2 mol'],
      certa: 1,
      explicacao: 'Cada 1 mol de N₂ forma 2 mol de NH₃, então 3 mol de N₂ formam 6 mol. O 3 ignora os coeficientes, e o 2 repete o coeficiente do NH₃ sem multiplicar.',
    },
    visual: { tipo: 'proporcao', reacao: 'amonia' },
  },
  {
    titulo: 'Reagente limitante: quem acaba primeiro',
    texto: [
      'Fazer uma reação é como montar sanduíches: se a receita pede 2 fatias de pão e 1 de queijo, o ingrediente que acabar primeiro decide quantos sanduíches saem. Na química, esse é o reagente limitante; o outro fica em excesso.',
      'Para descobrir quem limita, divida os mols de cada reagente pelo seu coeficiente. O menor resultado é o limitante. Não compare massas nem mols sem dividir, porque as proporções da equação não são 1 para 1.',
    ],
    pare: {
      pergunta: 'Para 2 H₂ + O₂ → 2 H₂O, misturam-se 5 mol de H₂ e 5 mol de O₂. Quem é o limitante?',
      opcoes: ['H₂', 'O₂', 'Nenhum: tem o mesmo número de mols'],
      certa: 0,
      explicacao: 'H₂: 5 ÷ 2 = 2,5. O₂: 5 ÷ 1 = 5. O menor valor é o do H₂, então ele acaba primeiro (e sobram 2,5 mol de O₂). Ter o mesmo número de mols não significa proporção exata: a equação pede 2 para 1.',
    },
    visual: { tipo: 'limitante', reacao: 'agua', mols: [5, 5] },
  },
  {
    titulo: 'Rendimento e pureza: o mundo real',
    texto: [
      'O cálculo estequiométrico dá o máximo possível, o rendimento de 100 %. Na prática, parte do produto se perde ou a reação não chega ao fim. O rendimento é a razão entre o que se obtém e esse máximo: massa real = massa teórica × rendimento.',
      'Já a pureza fala do reagente: numa amostra de 80 % de pureza, só 80 % da massa participa da reação. As impurezas ficam de fora, então use primeiro massa pura = massa da amostra × pureza.',
    ],
    pare: {
      pergunta: 'Uma reação deveria render 50 g de produto, mas o rendimento foi de 80 %. Quantos gramas foram obtidos?',
      opcoes: ['40 g', '62,5 g', '10 g'],
      certa: 0,
      explicacao: '50 × 0,80 = 40 g. O 62,5 vem de dividir (50 ÷ 0,8), e o 10 é a parte que se perdeu (20 % de 50).',
    },
    visual: { tipo: 'rendimento' },
  },
]

export const RESUMO_EST: SecaoResumo[] = [
  {
    titulo: 'Balanceamento e mol',
    formulas: [
      { rotulo: 'Quantidade de matéria', tex: 'n = \\dfrac{m}{M}' },
      { rotulo: 'Número de partículas', tex: 'N = n \\cdot 6 \\times 10^{23}' },
    ],
    ideias: ['Os átomos se conservam: o mesmo número de cada elemento nos dois lados.', 'Só se mudam os coeficientes, nunca os índices das fórmulas.', 'M (g/mol) tem o mesmo valor numérico da massa molecular.'],
    pegadinhas: ['Deixar os coeficientes sem reduzir à menor proporção inteira.', 'Esquecer que H₂, O₂ e N₂ são diatômicos, com massa molar 2, 32 e 28.'],
  },
  {
    titulo: 'Proporção entre substâncias',
    formulas: [
      { rotulo: 'Mols entre duas substâncias', tex: '\\dfrac{n_A}{c_A} = \\dfrac{n_B}{c_B}' },
      { rotulo: 'Caminho do cálculo', tex: 'm_A \\xrightarrow{\\div M_A} n_A \\xrightarrow{c_B/c_A} n_B \\xrightarrow{\\times M_B} m_B' },
    ],
    ideias: ['Coeficientes são razão em mols (e moléculas), não em gramas.', 'A lei de Lavoisier vale: a massa total dos reagentes é igual à dos produtos.'],
    pegadinhas: ['Aplicar a razão dos coeficientes direto às massas.', 'Inverter a razão (coeficiente de quem se pede no numerador).'],
  },
  {
    titulo: 'Limitante, rendimento e pureza',
    formulas: [
      { rotulo: 'Quem limita', tex: '\\text{limitante} = \\text{menor } \\dfrac{n}{c}' },
      { rotulo: 'Rendimento', tex: '\\eta = \\dfrac{m_{\\text{real}}}{m_{\\text{teórica}}} \\times 100\\%' },
      { rotulo: 'Pureza', tex: 'm_{\\text{pura}} = m_{\\text{amostra}} \\times \\text{pureza}' },
    ],
    ideias: ['Tudo se calcula a partir do limitante; o excesso apenas sobra.', 'Sobra = quantidade colocada − quantidade que reagiu.', 'Rendimento aplica-se ao produto; pureza, ao reagente.'],
    pegadinhas: ['Escolher o limitante pelo menor número de mols (ou de gramas) sem dividir pelo coeficiente.', 'Usar a massa da amostra inteira quando há impurezas.'],
  },
]
