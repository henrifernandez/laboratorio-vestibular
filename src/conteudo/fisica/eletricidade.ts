import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualEle =
  | { tipo: 'ohm'; V: number; R: number }
  | { tipo: 'circuito'; topologia: 'serie' | 'paralelo' | 'misto'; rs: number[]; V: number }
  | { tipo: 'conta' }

export interface PassoEle {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualEle
}

export const PASSOS_ELE: PassoEle[] = [
  {
    titulo: 'Corrente, tensão e resistência',
    texto: [
      'Numa lâmpada ligada a uma pilha, cargas elétricas se movem pelo fio. A corrente elétrica (i) diz quantas cargas passam por segundo, e se mede em ampères (A). A tensão (V), ou ddp, é o “empurrão” que a pilha dá, em volts.',
      'A resistência (R) mede o quanto o componente atrapalha a passagem das cargas. A lei de Ohm junta as três: V = R·i. Com a mesma tensão, quanto maior a resistência, menor a corrente.',
    ],
    pare: {
      pergunta: 'Uma lâmpada de resistência 6 Ω é ligada a uma pilha de 12 V. Qual é a corrente?',
      opcoes: ['2 A', '72 A', '0,5 A'],
      certa: 0,
      explicacao: 'i = V/R = 12/6 = 2 A. O 72 vem de multiplicar V·R, e o 0,5 de dividir ao contrário (R/V).',
    },
    visual: { tipo: 'ohm', V: 12, R: 6 },
  },
  {
    titulo: 'Potência elétrica: o brilho e o aquecimento',
    texto: [
      'A potência elétrica P é a energia transformada por segundo (em watts): P = V·i. Combinando com a lei de Ohm, também vale P = R·i² e P = V²/R.',
      'O brilho de uma lâmpada, ou o aquecimento de um chuveiro, depende da potência. Qual fórmula usar? Em série a corrente é igual, então use R·i². Em paralelo a tensão é igual, então use V²/R.',
    ],
    pare: {
      pergunta: 'Uma lâmpada de 60 W é ligada a uma tomada de 120 V. Qual é a corrente que passa por ela?',
      opcoes: ['0,5 A', '2 A', '7.200 A'],
      certa: 0,
      explicacao: 'P = V·i, então i = P/V = 60/120 = 0,5 A. O 2 vem de dividir V/P, e o 7.200 de multiplicar.',
    },
    visual: { tipo: 'ohm', V: 12, R: 6 },
  },
  {
    titulo: 'Em série: mesma corrente, a tensão se divide',
    texto: [
      'Lâmpadas em série formam um único caminho: a mesma corrente atravessa todas, e a tensão da bateria se divide entre elas. A resistência total é a soma: R = R₁ + R₂ + ...',
      'Como P = R·i² e i é igual, brilha mais a lâmpada de maior resistência. Se uma queima, o caminho se interrompe e todas apagam.',
    ],
    pare: {
      pergunta: 'Duas lâmpadas idênticas são ligadas em série a uma bateria de 12 V. Qual é a ddp em cada uma?',
      opcoes: ['6 V', '12 V', '24 V'],
      certa: 0,
      explicacao: 'Idênticas, elas dividem a tensão igualmente: 12/2 = 6 V cada. Cada uma receberia 12 V só se estivesse em paralelo.',
    },
    visual: { tipo: 'circuito', topologia: 'serie', rs: [20, 20], V: 12 },
  },
  {
    titulo: 'Em paralelo: mesma tensão, a corrente se divide',
    texto: [
      'Em paralelo, cada lâmpada está ligada diretamente à bateria: todas recebem a mesma tensão, e a corrente total se divide entre os ramos. A resistência equivalente é menor que a menor delas: 1/R = 1/R₁ + 1/R₂ + ...',
      'Como P = V²/R e V é igual, brilha mais a lâmpada de menor resistência. Se uma queima, as outras continuam como estavam: é por isso que a instalação de uma casa é em paralelo.',
    ],
    pare: {
      pergunta: 'Três lâmpadas estão em paralelo a uma bateria ideal. Uma delas queima. O que acontece com o brilho das outras duas?',
      opcoes: ['Apagam', 'Ficam iguais', 'Ficam mais fortes'],
      certa: 1,
      explicacao: 'Cada ramo continua ligado direto à bateria, com a mesma tensão e a mesma corrente. Os ramos em paralelo são independentes.',
    },
    visual: { tipo: 'circuito', topologia: 'paralelo', rs: [20, 20, 20], V: 12 },
  },
  {
    titulo: 'Energia, quilowatt-hora e conta de luz',
    texto: [
      'A energia consumida é E = P·Δt. A conta de luz usa o quilowatt-hora (kWh): a energia de um aparelho de 1 kW ligado por 1 hora. Para converter, passe os watts para quilowatts (÷ 1.000).',
      'Um chuveiro de 4.400 W consome muito mais por minuto do que uma lâmpada de 10 W, mesmo ficando ligado menos tempo. O custo é kWh × tarifa.',
    ],
    pare: {
      pergunta: 'Um chuveiro de 4 kW é usado 30 minutos por dia, durante 30 dias. Qual é o consumo no mês?',
      opcoes: ['60 kWh', '120 kWh', '4 kWh'],
      certa: 0,
      explicacao: 'E = 4 kW · 0,5 h · 30 dias = 60 kWh. Os 120 kWh vêm de esquecer que 30 minutos é meia hora.',
    },
    visual: { tipo: 'conta' },
  },
]

export const RESUMO_ELE: SecaoResumo[] = [
  {
    titulo: 'Lei de Ohm e potência',
    formulas: [
      { rotulo: 'Lei de Ohm', tex: 'V = R\\,i' },
      { rotulo: 'Potência', tex: 'P = V\\,i = R\\,i^{2} = \\dfrac{V^{2}}{R}' },
      { rotulo: 'Energia', tex: 'E = P\\,\\Delta t' },
    ],
    ideias: ['Mesma tensão: maior R, menor corrente.', 'Brilho e aquecimento dependem da potência dissipada.', 'Em série use P = R·i²; em paralelo use P = V²/R.'],
    pegadinhas: ['Converta mA em A e kΩ em Ω antes de calcular.', 'Com R fixa, a potência varia com o quadrado da tensão.'],
  },
  {
    titulo: 'Associação de resistores',
    formulas: [
      { rotulo: 'Série', tex: 'R_{eq} = R_1 + R_2 + \\dots' },
      { rotulo: 'Paralelo', tex: '\\dfrac{1}{R_{eq}} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2} + \\dots' },
      { rotulo: 'Dois em paralelo', tex: 'R_{eq} = \\dfrac{R_1 R_2}{R_1 + R_2}' },
    ],
    ideias: ['Série: mesma corrente, a tensão se divide, e se um queima todos apagam.', 'Paralelo: mesma tensão, a corrente se divide, e os ramos são independentes.', 'Circuito misto: resolva de dentro para fora e depois “desmonte” para achar cada corrente.'],
    pegadinhas: ['Em paralelo a equivalente é menor que a menor resistência.', 'Esquecer de inverter o resultado da soma dos inversos.'],
  },
  {
    titulo: 'Consumo e conta de luz',
    formulas: [
      { rotulo: 'Energia em kWh', tex: 'E\\,(\\text{kWh}) = P\\,(\\text{kW}) \\cdot \\Delta t\\,(\\text{h})' },
      { rotulo: 'Custo', tex: '\\text{custo} = E\\,(\\text{kWh}) \\cdot \\text{tarifa}' },
    ],
    ideias: ['Potência alta usada pouco tempo pode pesar mais que potência baixa usada o dia todo.', 'Trocar lâmpada por outra de menor potência economiza (P antiga − P nova) × tempo.'],
    pegadinhas: ['kW não é kWh: um é potência, o outro é energia.', '1 kWh = 1.000 Wh: não esqueça de dividir por 1.000.'],
  },
]
