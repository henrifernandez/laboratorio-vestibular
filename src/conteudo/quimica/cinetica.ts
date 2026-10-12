import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualCin = { tipo: 'velocidade' } | { tipo: 'colisoes' } | { tipo: 'diagrama' } | { tipo: 'fatores' } | { tipo: 'ordem' } | { tipo: 'meiavida' }

export interface PassoCin {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualCin
}

export const PASSOS_CIN: PassoCin[] = [
  {
    titulo: 'Velocidade de uma reação',
    texto: [
      'A velocidade de uma reação diz quanto de reagente é consumido (ou de produto é formado) por unidade de tempo: v = −Δ[reagente] ÷ Δt, por exemplo em mol/(L·s). Nos gráficos de concentração por tempo, a velocidade é a inclinação da curva.',
      'Ela não é constante: à medida que o reagente acaba, a curva fica mais horizontal e a reação desacelera. Por isso a velocidade média, calculada num intervalo, é diferente da velocidade em cada instante.',
    ],
    pare: {
      pergunta: 'Num gráfico de concentração do reagente em função do tempo, a curva vai ficando mais "deitada". O que isso significa?',
      opcoes: ['A reação está desacelerando', 'A reação está acelerando', 'A reação terminou há muito tempo'],
      certa: 0,
      explicacao: 'A inclinação mede a velocidade. Curva mais horizontal é inclinação menor, ou seja, reação mais lenta. Terminar significaria ficar totalmente plana.',
    },
    visual: { tipo: 'velocidade' },
  },
  {
    titulo: 'Teoria das colisões',
    texto: [
      'Para reagir, as partículas precisam colidir, com orientação adequada e com energia cinética suficiente para romper ligações: a energia de ativação (Ea). Só as colisões com energia igual ou maior que Ea são efetivas; a maioria das colisões não leva a reação.',
      'As partículas de um gás não têm todas a mesma energia: há uma distribuição (Maxwell–Boltzmann). A área sob a curva à direita de Ea representa a fração de partículas com energia suficiente. Aquecer desloca a distribuição para a direita e aumenta essa área; por isso a velocidade cresce muito com a temperatura.',
    ],
    pare: {
      pergunta: 'Ao aumentar a temperatura, a velocidade de uma reação aumenta principalmente porque:',
      opcoes: ['Uma fração maior das colisões tem energia ≥ Ea', 'A energia de ativação diminui', 'As partículas ficam mais numerosas'],
      certa: 0,
      explicacao: 'A energia de ativação é a mesma; o que muda é quantas colisões a superam. Temperatura não muda o número de partículas nem a Ea.',
    },
    visual: { tipo: 'colisoes' },
  },
  {
    titulo: 'Energia de ativação e diagrama de energia',
    texto: [
      'No diagrama de energia, os reagentes estão num nível, os produtos em outro, e no meio há um pico: o complexo ativado, o estado de maior energia da transformação. A energia de ativação direta é a altura do pico acima dos reagentes; a da reação inversa é a altura do pico acima dos produtos.',
      'A variação de entalpia é ΔH = H(produtos) − H(reagentes): negativa se os produtos têm menos energia (exotérmica), positiva se têm mais (endotérmica). Um catalisador oferece um caminho com o pico mais baixo: reduz a Ea nos dois sentidos, mas não muda o ΔH nem a posição do equilíbrio.',
    ],
    pare: {
      pergunta: 'Num diagrama, reagentes em 20 kJ, complexo ativado em 90 kJ e produtos em 50 kJ. Qual é a energia de ativação da reação direta?',
      opcoes: ['70 kJ', '40 kJ', '30 kJ'],
      certa: 0,
      explicacao: 'Ea direta = 90 − 20 = 70 kJ. Os 40 kJ são a Ea inversa (90 − 50), e os 30 kJ são o ΔH (50 − 20).',
    },
    visual: { tipo: 'diagrama' },
  },
  {
    titulo: 'O que muda a velocidade',
    texto: [
      'Temperatura: mais calor, maior fração de colisões efetivas (regra prática: a velocidade costuma dobrar a cada 10 °C). Concentração (ou pressão, nos gases): mais partículas por volume, mais colisões por segundo. Superfície de contato: mais área exposta, mais colisões em sólidos. Catalisador: menor Ea.',
      'Repare no que NÃO muda: concentração, superfície e temperatura não alteram a energia de ativação da reação; só o catalisador (ou um caminho diferente) altera. E nenhum desses fatores muda o ΔH.',
    ],
    pare: {
      pergunta: 'Qual dos fatores abaixo diminui a energia de ativação de uma reação?',
      opcoes: ['Adicionar um catalisador', 'Aumentar a temperatura', 'Aumentar a concentração do reagente'],
      certa: 0,
      explicacao: 'Só o catalisador oferece um caminho de menor Ea. Temperatura e concentração aumentam a velocidade sem mudar a Ea.',
    },
    visual: { tipo: 'fatores' },
  },
  {
    titulo: 'Lei de velocidade e ordem da reação',
    texto: [
      'A lei de velocidade relaciona a velocidade às concentrações: v = k·[A]^m·[B]^n. Os expoentes m e n são as ordens em relação a A e B, e m + n é a ordem global. Eles são determinados experimentalmente e só coincidem com os coeficientes da equação nas reações elementares.',
      'No método das velocidades iniciais, compare experimentos em que só um reagente muda: se dobrar [A] dobra v, a ordem em A é 1; se quadruplica v, é 2; se v não muda, é 0. A constante k depende da temperatura e do catalisador, mas não das concentrações.',
    ],
    pare: {
      pergunta: 'Ao triplicar a concentração de A (B constante), a velocidade fica 9 vezes maior. Qual é a ordem em relação a A?',
      opcoes: ['2', '3', '9'],
      certa: 0,
      explicacao: '3^m = 9, então m = 2. O 3 é a razão das concentrações e o 9 é a razão das velocidades; a ordem é o expoente que liga as duas.',
    },
    visual: { tipo: 'ordem' },
  },
  {
    titulo: 'Meia-vida',
    texto: [
      'A meia-vida (t½) é o tempo para que a concentração do reagente caia à metade. Numa reação de primeira ordem ela não depende da concentração inicial: depois de cada t½, resta metade do que havia, de modo que após n meias-vidas resta 1/2ⁿ do início. A relação com a constante é t½ = ln 2 ÷ k ≈ 0,693 ÷ k.',
      'Para outras ordens a meia-vida muda com a concentração: em ordem zero ela diminui conforme o reagente acaba, e em ordem dois ela aumenta (a reação desacelera). Em exercícios de decaimento radioativo e de reações de primeira ordem, basta contar quantas meias-vidas se passaram.',
    ],
    pare: {
      pergunta: 'Uma substância tem meia-vida de 20 min (primeira ordem). Quanto resta de 80 g depois de 60 min?',
      opcoes: ['10 g', '20 g', '40 g'],
      certa: 0,
      explicacao: '60 min são 3 meias-vidas: 80 → 40 → 20 → 10 g, ou 80 ÷ 2³ = 10 g. Os 20 g seriam o resultado depois de 2 meias-vidas.',
    },
    visual: { tipo: 'meiavida' },
  },
]

export const RESUMO_CIN: SecaoResumo[] = [
  {
    titulo: 'Velocidade e colisões',
    formulas: [
      { rotulo: 'Velocidade média', tex: 'v = -\\dfrac{\\Delta[\\text{reagente}]}{\\Delta t}' },
      { rotulo: 'Fração de colisões efetivas', tex: 'f \\propto e^{-E_a/RT}' },
    ],
    ideias: [
      'Colisão efetiva: orientação certa e energia ≥ Ea.',
      'Mais temperatura: maior fração de colisões efetivas; mais concentração ou superfície: mais colisões por segundo.',
      'Regra prática: a velocidade costuma dobrar a cada 10 °C.',
    ],
    pegadinhas: ['Achar que concentração, temperatura ou superfície mudam a Ea (só o catalisador muda).', 'Achar que a velocidade é constante ao longo da reação.'],
  },
  {
    titulo: 'Energia de ativação e catalisador',
    formulas: [
      { rotulo: 'Ea direta', tex: 'E_a = H_{\\text{complexo}} - H_{\\text{reagentes}}' },
      { rotulo: 'Ea inversa', tex: 'E_a\' = H_{\\text{complexo}} - H_{\\text{produtos}}' },
      { rotulo: 'Entalpia', tex: '\\Delta H = H_{\\text{produtos}} - H_{\\text{reagentes}}' },
    ],
    ideias: ['Catalisador: caminho de menor Ea, nos dois sentidos, sem mudar ΔH e sem ser consumido.', 'Ea direta − Ea inversa = ΔH.'],
    pegadinhas: ['Confundir a energia do complexo ativado com a energia de ativação.', 'Achar que o catalisador aumenta o rendimento do equilíbrio.'],
  },
  {
    titulo: 'Lei de velocidade e meia-vida',
    formulas: [
      { rotulo: 'Lei de velocidade', tex: 'v = k\\,[A]^m\\,[B]^n' },
      { rotulo: 'Primeira ordem', tex: 't_{1/2} = \\dfrac{\\ln 2}{k} \\approx \\dfrac{0{,}693}{k},\\quad m = \\dfrac{m_0}{2^{\\,n}}' },
    ],
    ideias: ['Ordens vêm de experimentos (método das velocidades iniciais), não dos coeficientes.', 'Primeira ordem: a meia-vida não depende da concentração inicial.', 'Depois de n meias-vidas resta 1/2ⁿ.'],
    pegadinhas: ['Dar a razão das velocidades no lugar do expoente.', 'Somar em vez de multiplicar os fatores de cada reagente.'],
  },
]
