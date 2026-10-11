import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualCin =
  | { tipo: 'tres'; inicio: { x0: number; v0: number }; trechos: { dur: number; a: number }[] }
  | { tipo: 'velocidades'; x0: number; trechos: { dur: number; v: number }[] }
  | { tipo: 'lancamento'; v0: number; angulo: number; t: number }

export interface PassoCin {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualCin
}

export const PASSOS_CIN: PassoCin[] = [
  {
    titulo: 'Posição, velocidade e tempo',
    texto: [
      'Um carrinho que anda com velocidade constante de 2 m/s percorre 2 metros a cada segundo. É o movimento uniforme (MRU): x = x₀ + v·t.',
      'Os três gráficos contam a mesma história: a posição cresce em linha reta, a velocidade é constante e a aceleração é zero.',
    ],
    pare: {
      pergunta: 'Um carro mantém 20 m/s. Quantos metros percorre em 5 s?',
      opcoes: ['4 m', '100 m', '25 m'],
      certa: 1,
      explicacao: 'Δx = v·t = 20 · 5 = 100 m. O 25 vem de somar (20 + 5), uma conta que não faz sentido físico.',
    },
    visual: { tipo: 'tres', inicio: { x0: 1, v0: 2 }, trechos: [{ dur: 6, a: 0 }] },
  },
  {
    titulo: 'No gráfico de posição, a inclinação é a velocidade',
    texto: [
      'O carrinho anda a +2 m/s por 2 s, fica parado por 2 s e volta a −1 m/s por 2 s. No gráfico x(t): reta subindo, reta horizontal, reta descendo.',
      'Quanto mais inclinada a reta, maior a velocidade. Reta horizontal: parado. Reta descendo: velocidade negativa (o carrinho volta).',
    ],
    pare: {
      pergunta: 'Num trecho em que o gráfico de posição é uma reta horizontal, a velocidade do móvel é...',
      opcoes: ['positiva', 'zero', 'negativa'],
      certa: 1,
      explicacao: 'Reta horizontal: a posição não muda com o tempo, então o móvel está parado e v = 0.',
    },
    visual: { tipo: 'velocidades', x0: 1, trechos: [{ dur: 2, v: 2 }, { dur: 2, v: 0 }, { dur: 2, v: -1 }] },
  },
  {
    titulo: 'Aceleração: quando a velocidade muda',
    texto: [
      'Partindo do repouso com aceleração constante de 2 m/s², a velocidade cresce 2 m/s a cada segundo: v = v₀ + a·t. A posição cresce cada vez mais depressa: x = x₀ + v₀·t + a·t²/2 (uma parábola).',
      'No gráfico v(t) a aceleração é a inclinação da reta.',
    ],
    pare: {
      pergunta: 'Um carro parte do repouso com a = 2 m/s². Qual é a sua velocidade após 5 s?',
      opcoes: ['7 m/s', '10 m/s', '25 m/s'],
      certa: 1,
      explicacao: 'v = v₀ + a·t = 0 + 2·5 = 10 m/s. O 25 é a distância percorrida (a·t²/2), não a velocidade.',
    },
    visual: { tipo: 'tres', inicio: { x0: 0, v0: 0 }, trechos: [{ dur: 5, a: 2 }] },
  },
  {
    titulo: 'Os três gráficos do mesmo movimento',
    texto: [
      'Um carro acelera, depois mantém a velocidade e por fim freia até parar. A posição é uma curva que se inclina, vira reta e se achata; a velocidade sobe, estabiliza e desce; a aceleração é positiva, zero e negativa.',
      'Regra de ouro: a inclinação de x(t) é v; a inclinação de v(t) é a; e a área sob v(t) é a variação da posição.',
    ],
    pare: {
      pergunta: 'No trecho em que a velocidade é constante e diferente de zero, a aceleração é...',
      opcoes: ['positiva', 'zero', 'negativa'],
      certa: 1,
      explicacao: 'Velocidade constante significa que ela não varia: aceleração zero.',
    },
    visual: { tipo: 'tres', inicio: { x0: 0, v0: 0 }, trechos: [{ dur: 2, a: 2 }, { dur: 3, a: 0 }, { dur: 2, a: -2 }] },
  },
  {
    titulo: 'Lançamento oblíquo',
    texto: [
      'Uma bola lançada com ângulo θ se move em duas direções ao mesmo tempo: na horizontal a velocidade é constante (v₀·cos θ); na vertical, a gravidade a faz subir, parar e descer (v₀·sen θ − g·t).',
      'No ponto mais alto, a componente vertical vale zero, mas a horizontal continua. O alcance é R = v₀²·sen(2θ)/g, máximo a 45°. Ângulos complementares (por exemplo 30° e 60°) têm o mesmo alcance.',
    ],
    pare: {
      pergunta: 'No ponto mais alto de um lançamento oblíquo, a componente vertical da velocidade vale...',
      opcoes: ['v₀', 'zero', 'g'],
      certa: 1,
      explicacao: 'Ali o projétil para de subir e começa a descer: v_y = 0. A componente horizontal continua igual (sem resistência do ar).',
    },
    visual: { tipo: 'lancamento', v0: 20, angulo: 45, t: 1 },
  },
]

export const RESUMO_CIN: SecaoResumo[] = [
  {
    titulo: 'Movimento uniforme (MRU)',
    formulas: [
      { rotulo: 'Função horária', tex: 'x = x_0 + v\\,t' },
      { rotulo: 'Velocidade média', tex: 'v_m = \\dfrac{\\Delta x}{\\Delta t}' },
      { rotulo: 'Conversão', tex: '1\\ \\text{m/s} = 3{,}6\\ \\text{km/h}' },
    ],
    ideias: ['Velocidade constante, aceleração zero.', 'No gráfico x(t): reta; a inclinação é v.', 'Encontro de móveis: iguale as funções horárias.'],
    pegadinhas: ['km/h → m/s: divida por 3,6.', 'Em sentidos opostos a velocidade relativa soma; no mesmo sentido, subtrai.'],
  },
  {
    titulo: 'Movimento uniformemente variado (MRUV)',
    formulas: [
      { rotulo: 'Velocidade', tex: 'v = v_0 + a\\,t' },
      { rotulo: 'Posição', tex: 'x = x_0 + v_0\\,t + \\dfrac{a\\,t^{2}}{2}' },
      { rotulo: 'Torricelli', tex: 'v^{2} = v_0^{2} + 2\\,a\\,\\Delta x' },
    ],
    ideias: ['Aceleração constante: v(t) é reta e x(t) é parábola.', 'Área sob v(t) = Δx; inclinação de v(t) = a.', 'Freando até parar: Δx = v₀²/(2|a|).'],
    pegadinhas: ['Não esqueça o 1/2 em a·t²/2.', 'Desaceleração tem sinal negativo (se o móvel anda no sentido positivo).', 'Torricelli serve quando o tempo não é dado.'],
  },
  {
    titulo: 'Lançamento oblíquo (g = 10 m/s², sem ar)',
    formulas: [
      { rotulo: 'Componentes', tex: 'v_x = v_0\\cos\\theta \\qquad v_y = v_0\\sin\\theta - g\\,t' },
      { rotulo: 'Tempo de voo', tex: 'T = \\dfrac{2\\,v_0\\sin\\theta}{g}' },
      { rotulo: 'Altura máxima', tex: 'H = \\dfrac{(v_0\\sin\\theta)^{2}}{2\\,g}' },
      { rotulo: 'Alcance', tex: 'R = \\dfrac{v_0^{2}\\sin 2\\theta}{g}' },
    ],
    ideias: ['Na horizontal: MRU. Na vertical: MRUV com a = −g.', 'Alcance máximo a 45°; θ e 90° − θ têm o mesmo alcance.', 'No ponto mais alto, v_y = 0 (mas v_x não).'],
    pegadinhas: ['A velocidade no ponto mais alto não é zero: sobra a componente horizontal.', 'A massa não influencia o movimento (sem resistência do ar).'],
  },
]
