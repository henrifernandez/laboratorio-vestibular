import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualJuros =
  | { tipo: 'fator'; inicial: number; percentual: number }
  | { tipo: 'grafico'; simples: boolean; composto: boolean; capital: number; iSimples: number; jComposto: number; tmax: number }
  | { tipo: 'sucessivos'; inicial: number; passos: number[] }

export interface PassoJuros {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualJuros
}

export const PASSOS_JUROS: PassoJuros[] = [
  {
    titulo: 'Porcentagem é um fator',
    texto: [
      'Uma camiseta de R$ 50 com 20% de desconto: você paga 80% do preço, ou seja, 0,8 × 50 = R$ 40.',
      'Aumentar p% é multiplicar por (1 + p/100). Descontar p% é multiplicar por (1 − p/100). Tudo na matemática financeira parte daí.',
    ],
    pare: {
      pergunta: 'Um aumento de 15% corresponde a multiplicar o valor por quanto?',
      opcoes: ['0,15', '1,15', '1,5'],
      certa: 1,
      explicacao: 'Aumento de 15% = valor original (100%) + 15% = 115% = 1,15.',
    },
    visual: { tipo: 'fator', inicial: 100, percentual: 15 },
  },
  {
    titulo: 'Juros simples: sempre a mesma parcela',
    texto: [
      'Você aplica R$ 1.000 a 10% ao mês em juros simples. Todo mês o juro é 10% do capital inicial: R$ 100.',
      'Depois de t meses: M = C·(1 + i·t). O gráfico do montante é uma reta.',
    ],
    pare: {
      pergunta: 'Em juros simples, R$ 1.000 a 10% ao mês. Quanto há depois de 3 meses?',
      opcoes: ['R$ 1.300', 'R$ 1.331', 'R$ 1.030'],
      certa: 0,
      explicacao: 'M = 1000·(1 + 0,10·3) = 1000·1,3 = R$ 1.300.',
    },
    visual: { tipo: 'grafico', simples: true, composto: false, capital: 1000, iSimples: 10, jComposto: 10, tmax: 6 },
  },
  {
    titulo: 'Juros compostos: juros sobre juros',
    texto: [
      'No composto, o juro de cada mês é calculado sobre o montante do mês anterior: 1.000 → 1.100 → 1.210 → 1.331.',
      'Cada mês multiplica pelo mesmo fator 1,10: M = C·(1 + i)^t. A curva é exponencial e cresce cada vez mais depressa.',
    ],
    pare: {
      pergunta: 'R$ 1.000 a 10% ao mês em juros compostos. Quanto há depois de 2 meses?',
      opcoes: ['R$ 1.200', 'R$ 1.210', 'R$ 1.220'],
      certa: 1,
      explicacao: 'M = 1000·1,10² = 1000·1,21 = R$ 1.210. Os R$ 10 a mais, comparado ao simples, são o juro sobre o juro do 1º mês.',
    },
    visual: { tipo: 'grafico', simples: true, composto: true, capital: 1000, iSimples: 10, jComposto: 10, tmax: 6 },
  },
  {
    titulo: 'Quem cresce mais, e quando?',
    texto: [
      'No primeiro período os dois regimes rendem igual (com a mesma taxa). Depois, o composto abre vantagem, e quanto mais tempo, maior a distância.',
      'Mesmo com taxa menor, o composto acaba passando o simples. Aqui, 6% compostos contra 10% simples: eles se cruzam em algum mês.',
    ],
    pare: {
      pergunta: 'Com a mesma taxa, no primeiro mês, qual regime rende mais?',
      opcoes: ['O simples', 'O composto', 'Rendem o mesmo'],
      certa: 2,
      explicacao: 'No 1º período: C·(1 + i·1) = C·(1 + i)^1. A diferença só aparece a partir do 2º período.',
    },
    visual: { tipo: 'grafico', simples: true, composto: true, capital: 1000, iSimples: 10, jComposto: 6, tmax: 14 },
  },
  {
    titulo: 'Aumentos e descontos sucessivos',
    texto: [
      'Um produto de R$ 100 sobe 10% e depois cai 10%. Subiu para R$ 110; 10% de 110 é R$ 11; sobra R$ 99, e não R$ 100.',
      'Cada porcentagem incide sobre o valor atual. Por isso os fatores se multiplicam: 1,10 × 0,90 = 0,99.',
    ],
    pare: {
      pergunta: 'Um preço sobe 20% e depois desce 20%. O resultado em relação ao preço inicial é:',
      opcoes: ['igual', '4% menor', '4% maior'],
      certa: 1,
      explicacao: '1,20 × 0,80 = 0,96: o preço final é 96% do inicial, ou seja, 4% menor.',
    },
    visual: { tipo: 'sucessivos', inicial: 100, passos: [10, -10] },
  },
]

export const RESUMO_JUROS: SecaoResumo[] = [
  {
    titulo: 'Porcentagem como fator',
    formulas: [
      { rotulo: 'Aumento de p%', tex: 'V_{final} = V \\cdot \\left(1 + \\dfrac{p}{100}\\right)' },
      { rotulo: 'Desconto de p%', tex: 'V_{final} = V \\cdot \\left(1 - \\dfrac{p}{100}\\right)' },
      { rotulo: 'Variação percentual', tex: '\\dfrac{V_{final} - V_{inicial}}{V_{inicial}} \\cdot 100\\%' },
    ],
    ideias: ['Transforme porcentagem em fator: +20% é ×1,20; −30% é ×0,70.', 'Variações sucessivas: multiplique os fatores.'],
    pegadinhas: [
      'Aumento de 10% seguido de desconto de 10% NÃO volta ao valor inicial (fica 1% abaixo).',
      'Não some porcentagens de etapas sucessivas: elas incidem sobre bases diferentes.',
      'Para voltar ao valor inicial depois de um aumento de p%, o desconto precisa ser maior que p%.',
    ],
  },
  {
    titulo: 'Juros simples',
    formulas: [
      { rotulo: 'Juros', tex: 'J = C \\cdot i \\cdot t' },
      { rotulo: 'Montante', tex: 'M = C + J = C\\,(1 + i\\,t)' },
    ],
    ideias: ['O juro é sempre calculado sobre o capital inicial.', 'O montante cresce em linha reta (progressão aritmética).'],
    pegadinhas: ['Taxa e tempo devem estar na mesma unidade (ao mês × meses).', 'Use a taxa em forma decimal: 3% = 0,03.', 'Montante inclui o capital; juros não.'],
  },
  {
    titulo: 'Juros compostos',
    formulas: [
      { rotulo: 'Montante', tex: 'M = C\\,(1 + i)^{t}' },
      { rotulo: 'Juros', tex: 'J = M - C' },
    ],
    ideias: ['O juro de cada período é calculado sobre o montante anterior ("juros sobre juros").', 'O montante cresce em progressão geométrica, e o gráfico é exponencial.'],
    pegadinhas: [
      'Com a mesma taxa, simples e composto empatam no 1º período; depois o composto fica na frente.',
      'Não multiplique i por t no composto: o tempo é o expoente.',
      'Se pedem os juros, subtraia o capital do montante.',
    ],
  },
  {
    titulo: 'Comparando regimes',
    formulas: [
      { rotulo: 'Tempo para dobrar (simples)', tex: 't = \\dfrac{1}{i}' },
      { rotulo: 'Tempo para dobrar (composto)', tex: 't = \\dfrac{\\ln 2}{\\ln(1 + i)}' },
    ],
    ideias: [
      'Diferenças constantes entre os valores indicam juros simples; razões constantes indicam juros compostos.',
      'Mesmo com taxa menor, o composto sempre acaba ultrapassando o simples.',
    ],
    pegadinhas: ['Para decidir qual rende mais, compare no mesmo prazo: a resposta pode mudar com o tempo.'],
  },
]
