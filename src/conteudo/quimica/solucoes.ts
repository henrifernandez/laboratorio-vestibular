import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualSol =
  | { tipo: 'bequer'; massa: number; volume: number }
  | { tipo: 'molar' }
  | { tipo: 'titulo' }
  | { tipo: 'diluicao' }
  | { tipo: 'mistura' }
  | { tipo: 'curva' }
  | { tipo: 'cristais' }

export interface PassoSol {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualSol
}

export const PASSOS_SOL: PassoSol[] = [
  {
    titulo: 'Soluto, solvente e concentração comum',
    texto: [
      'Numa solução, o soluto é o que se dissolve (o sal, o açúcar) e o solvente é o que dissolve (em geral a água). Duas soluções do mesmo sal podem ser bem diferentes: uma é fraca, outra é forte. O que muda é a concentração, a quantidade de soluto em cada litro de solução.',
      'A concentração comum é a massa do soluto dividida pelo volume da solução: C = m ÷ V, em g/L. Cuidado com a unidade: se o volume vier em mL, divida por 1000 para ter litros.',
    ],
    pare: {
      pergunta: 'Dissolvem-se 20 g de sal em água até completar 500 mL de solução. Qual é a concentração em g/L?',
      opcoes: ['40 g/L', '0,04 g/L', '10 g/L'],
      certa: 0,
      explicacao: '500 mL = 0,5 L, então C = 20 ÷ 0,5 = 40 g/L. O 0,04 vem de dividir por 500 sem converter os mL, e o 10 de multiplicar pelo volume em litros.',
    },
    visual: { tipo: 'bequer', massa: 20, volume: 500 },
  },
  {
    titulo: 'Mol por litro: contar partículas',
    texto: [
      'Em química contamos partículas em mols, e a concentração em mol/L (também chamada de molaridade) diz quantos mols de soluto há em cada litro de solução: M = n ÷ V. Como n = m ÷ massa molar, resulta M = m ÷ (massa molar × V).',
      'Exemplo: 58,5 g de NaCl (massa molar 58,5 g/mol) são 1 mol. Dissolvidos em 1 L de solução, dão 1 mol/L; em 500 mL dão 2 mol/L, porque o mesmo mol está num volume menor.',
    ],
    pare: {
      pergunta: 'Quantos mols há em 100 mL de uma solução 0,5 mol/L?',
      opcoes: ['0,05 mol', '50 mol', '0,5 mol'],
      certa: 0,
      explicacao: 'n = M × V = 0,5 mol/L × 0,1 L = 0,05 mol. O 50 vem de usar 100 em vez de 0,1 litro, e o 0,5 de esquecer o volume.',
    },
    visual: { tipo: 'molar' },
  },
  {
    titulo: 'Título e partes por milhão',
    texto: [
      'O título (ou porcentagem em massa) é a fração da massa da solução que é soluto: τ = m soluto ÷ m solução. Um soro de 0,9 % em massa tem 0,9 g de sal em cada 100 g de solução.',
      'Quando o soluto é muito pouco, usamos ppm (partes por milhão): 1 ppm é 1 mg de soluto por litro de solução aquosa diluída. Para ligar título e mol/L usamos a densidade d, porque o litro de solução tem massa 1000·d gramas: M = 10·d·τ(%) ÷ massa molar.',
    ],
    pare: {
      pergunta: 'Uma solução de NaOH tem título de 20 % em massa e densidade 1,2 g/mL. Quantos gramas de NaOH há em 1 L dela?',
      opcoes: ['240 g', '200 g', '20 g'],
      certa: 0,
      explicacao: '1 L pesa 1000 × 1,2 = 1200 g, e 20 % disso é 240 g de NaOH. O 200 ignora a densidade (20 % de 1000 g), e o 20 só repete o título.',
    },
    visual: { tipo: 'titulo' },
  },
  {
    titulo: 'Diluir: o soluto não muda, o volume sim',
    texto: [
      'Quando acrescentamos água a uma solução, a quantidade de soluto continua a mesma, mas ela se espalha por um volume maior, então a concentração cai. Como a quantidade de soluto é C·V, vale C₁·V₁ = C₂·V₂.',
      'A água adicionada é a diferença entre os volumes: V₂ − V₁. Se o volume triplica, a concentração fica dividida por três. Evaporar faz o contrário: sai só água, o soluto fica, e a concentração aumenta.',
    ],
    pare: {
      pergunta: 'Diluem-se 100 mL de uma solução 6 mol/L até 300 mL. Qual é a nova concentração?',
      opcoes: ['2 mol/L', '18 mol/L', '3 mol/L'],
      certa: 0,
      explicacao: 'C₂ = 6 × 100 ÷ 300 = 2 mol/L: o volume triplicou, a concentração caiu a um terço. O 18 multiplica em vez de dividir, e o 3 divide por 2 por hábito.',
    },
    visual: { tipo: 'diluicao' },
  },
  {
    titulo: 'Misturar soluções do mesmo soluto',
    texto: [
      'Ao misturar duas soluções do mesmo soluto, os mols se somam e os volumes também. A concentração final é a média das concentrações ponderada pelos volumes: C = (C₁V₁ + C₂V₂) ÷ (V₁ + V₂).',
      'Só quando os volumes são iguais a média simples das concentrações funciona. É uma pegadinha clássica: se um volume é maior, a mistura fica mais parecida com a solução de maior volume.',
    ],
    pare: {
      pergunta: 'Misturam-se 100 mL de solução 1 mol/L com 300 mL de solução 3 mol/L do mesmo soluto. A concentração final é:',
      opcoes: ['2,5 mol/L', '2 mol/L', '4 mol/L'],
      certa: 0,
      explicacao: 'Mols: 1 × 0,1 + 3 × 0,3 = 1,0 mol em 0,4 L, então 2,5 mol/L. Os 2 mol/L são a média simples, que ignora que há três vezes mais da solução forte. Os 4 mol/L somam as concentrações.',
    },
    visual: { tipo: 'mistura' },
  },
  {
    titulo: 'Solubilidade: o limite do que dissolve',
    texto: [
      'A solubilidade é a maior massa de soluto que se dissolve em certa quantidade de solvente, a uma temperatura. Costuma-se dar em gramas de sal por 100 g de água. A curva de solubilidade mostra como esse limite muda com a temperatura.',
      'Se há menos sal que o limite, a solução é insaturada. Se há exatamente o limite, é saturada. Se há mais, o excesso não dissolve e fica no fundo: saturada com corpo de fundo. Ponto abaixo da curva = insaturada; sobre a curva = saturada.',
    ],
    pare: {
      pergunta: 'Um sal tem solubilidade 40 g/100 g de água a 30 °C. Colocando 60 g em 100 g de água a 30 °C, o que se observa?',
      opcoes: ['Saturada com 20 g no fundo', 'Insaturada, tudo dissolvido', 'Saturada, tudo dissolvido'],
      certa: 0,
      explicacao: 'A água só dissolve 40 g; os 60 − 40 = 20 g restantes ficam no fundo, e a solução é saturada. Tudo dissolvido só ocorreria com 40 g ou menos.',
    },
    visual: { tipo: 'curva' },
  },
  {
    titulo: 'Mudar a temperatura: cristais e supersaturação',
    texto: [
      'Se a solubilidade aumenta com a temperatura (como na maioria dos sais), resfriar uma solução saturada faz o excesso se separar: formam-se cristais. A massa que se separa é (solubilidade inicial − solubilidade final) vezes a massa de água, dividida por 100.',
      'Alguns sais fazem o contrário: dissolvem menos a quente, e é o aquecimento que faz cristalizar. E há um caso instável: se uma saturada é resfriada devagar, sem choque, o excesso pode ficar dissolvido. É a solução supersaturada, e um pequeno cristal basta para o excesso precipitar.',
    ],
    pare: {
      pergunta: 'Uma solução saturada com 100 g de água a 60 °C é resfriada até 20 °C. A solubilidade é 110 g/100 g a 60 °C e 30 g/100 g a 20 °C. Quanto sal cristaliza?',
      opcoes: ['80 g', '110 g', '30 g'],
      certa: 0,
      explicacao: 'Cristaliza a diferença: 110 − 30 = 80 g. Os 110 g são tudo o que estava dissolvido antes, e os 30 g são o que continua dissolvido depois.',
    },
    visual: { tipo: 'cristais' },
  },
]

export const RESUMO_SOL: SecaoResumo[] = [
  {
    titulo: 'Formas de concentração',
    formulas: [
      { rotulo: 'Concentração comum', tex: 'C = \\dfrac{m}{V}\\ \\text{(g/L)}' },
      { rotulo: 'Concentração em mol/L', tex: 'M = \\dfrac{n}{V} = \\dfrac{m}{\\text{MM}\\cdot V}' },
      { rotulo: 'Título', tex: '\\tau = \\dfrac{m_{\\text{soluto}}}{m_{\\text{solução}}}' },
      { rotulo: 'Título e mol/L', tex: 'M = \\dfrac{10\\, d\\, \\tau(\\%)}{\\text{MM}}' },
    ],
    ideias: ['O volume é o da solução, não o da água.', '1 ppm = 1 mg/L em solução aquosa diluída.', 'A densidade liga massa e volume da solução.'],
    pegadinhas: ['Esquecer de converter mL em L.', 'Esquecer de dividir a massa pela massa molar ao pedir mol/L.'],
  },
  {
    titulo: 'Diluição e mistura',
    formulas: [
      { rotulo: 'Diluição', tex: 'C_1 V_1 = C_2 V_2' },
      { rotulo: 'Água adicionada', tex: 'V_{\\text{água}} = V_2 - V_1' },
      { rotulo: 'Mistura (mesmo soluto)', tex: 'C = \\dfrac{C_1 V_1 + C_2 V_2}{V_1 + V_2}' },
    ],
    ideias: ['Diluir ou evaporar não muda os mols de soluto.', 'Na mistura, some mols e some volumes (inclusive o da água).'],
    pegadinhas: ['Fazer a média simples das concentrações com volumes diferentes.', 'Dar o volume final quando o enunciado pede a água adicionada.'],
  },
  {
    titulo: 'Solubilidade e cristalização',
    formulas: [
      { rotulo: 'Capacidade da água', tex: 'm_{\\text{sal}}^{\\max} = \\dfrac{S \\cdot m_{\\text{água}}}{100}' },
      { rotulo: 'Cristais ao mudar T', tex: 'm_{\\text{cristais}} = \\dfrac{(S_1 - S_2)\\, m_{\\text{água}}}{100}' },
      { rotulo: 'Massa de solução saturada', tex: 'm_{\\text{solução}} = m_{\\text{água}}\\left(1 + \\dfrac{S}{100}\\right)' },
    ],
    ideias: ['Abaixo da curva: insaturada; sobre a curva: saturada; acima: saturada com corpo de fundo.', 'Em sais de solubilidade decrescente (como o sal C do laboratório), aquecer é que faz cristalizar.', 'Supersaturada é instável: um cristal faz o excesso precipitar.'],
    pegadinhas: ['Usar a massa da solução no lugar da massa de água.', 'Esquecer que a solubilidade é por 100 g de água, não por 100 g de solução.'],
  },
]
