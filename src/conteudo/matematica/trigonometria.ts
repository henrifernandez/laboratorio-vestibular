import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualTrig =
  | { tipo: 'circulo'; graus: number; tangente?: boolean; radianos?: boolean }
  | { tipo: 'sinais'; graus: number }
  | { tipo: 'onda'; graus: number }

export interface PassoTrig {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualTrig
}

export const PASSOS_TRIG: PassoTrig[] = [
  {
    titulo: 'O círculo trigonométrico',
    texto: [
      'Imagine um círculo de raio 1 e um ponto que gira, saindo da direita (0°) no sentido anti-horário. O ângulo θ diz quanto ele girou.',
      'Quando o ponto está no ângulo θ, suas coordenadas são (cos θ, sen θ): o cosseno é a posição horizontal e o seno é a posição vertical.',
    ],
    pare: {
      pergunta: 'No círculo trigonométrico, o seno de um ângulo é qual coordenada do ponto?',
      opcoes: ['A horizontal (x)', 'A vertical (y)', 'A distância à origem'],
      certa: 1,
      explicacao: 'O ponto é (cos θ, sen θ): x é o cosseno e y é o seno. A distância à origem é sempre 1.',
    },
    visual: { tipo: 'circulo', graus: 30 },
  },
  {
    titulo: 'Graus e radianos',
    texto: [
      'Uma volta completa tem 360° ou 2π radianos. Logo, meia volta é 180° = π rad, e um quarto de volta é 90° = π/2 rad.',
      'Para converter, troque π por 180°: 3π/4 rad = 3·180°/4 = 135°. Um radiano é o ângulo cujo arco tem o mesmo comprimento do raio (cerca de 57,3°).',
    ],
    pare: {
      pergunta: 'Quanto vale π/2 rad em graus?',
      opcoes: ['45°', '90°', '180°'],
      certa: 1,
      explicacao: 'Troque π por 180°: 180°/2 = 90°.',
    },
    visual: { tipo: 'circulo', graus: 90, radianos: true },
  },
  {
    titulo: 'Os sinais em cada quadrante',
    texto: [
      'O seno é positivo quando o ponto está acima do eixo x (1º e 2º quadrantes); o cosseno é positivo quando está à direita do eixo y (1º e 4º). A tangente (sen ÷ cos) é positiva quando os dois têm o mesmo sinal (1º e 3º).',
      'Macete: no 1º todos são positivos; no 2º só o seno; no 3º só a tangente; no 4º só o cosseno.',
    ],
    pare: {
      pergunta: 'Qual é o sinal de cos 150°?',
      opcoes: ['Positivo', 'Negativo', 'Zero'],
      certa: 1,
      explicacao: '150° está no 2º quadrante, onde o ponto fica à esquerda do eixo y: o cosseno é negativo.',
    },
    visual: { tipo: 'sinais', graus: 150 },
  },
  {
    titulo: 'Ângulos notáveis e redução ao 1º quadrante',
    texto: [
      'Decore sen 30° = 1/2, sen 45° = √2/2 e sen 60° = √3/2 (e o cosseno é o contrário: cos 30° = √3/2 e cos 60° = 1/2).',
      'Para outros ângulos, ache o ângulo de referência no 1º quadrante e ponha o sinal do quadrante. Exemplo: sen 150° tem referência 30° e sinal +, então vale 1/2.',
    ],
    pare: {
      pergunta: 'Quanto vale sen 150°?',
      opcoes: ['1/2', '−1/2', '√3/2'],
      certa: 0,
      explicacao: 'O ângulo de referência de 150° é 180° − 150° = 30°. sen 30° = 1/2 e o seno é positivo no 2º quadrante: sen 150° = 1/2.',
    },
    visual: { tipo: 'circulo', graus: 150, tangente: false },
  },
  {
    titulo: 'Seno e cosseno como ondas',
    texto: [
      'Se você marcar o seno (e o cosseno) do ponto que gira em função do ângulo, aparecem ondas que se repetem a cada volta completa: o período é 360° (2π).',
      'O seno e o cosseno sempre ficam entre −1 e 1. O cosseno é o seno adiantado em 90°.',
    ],
    pare: {
      pergunta: 'Depois de quantos graus a onda do seno começa a se repetir?',
      opcoes: ['90°', '180°', '360°'],
      certa: 2,
      explicacao: 'Uma volta completa (360°) leva o ponto de volta à mesma posição, e então o seno se repete: período 360° = 2π rad.',
    },
    visual: { tipo: 'onda', graus: 120 },
  },
]

export const RESUMO_TRIG: SecaoResumo[] = [
  {
    titulo: 'Radianos e arcos',
    formulas: [
      { rotulo: 'Conversão', tex: '\\pi\\ \\text{rad} = 180^{\\circ}' },
      { rotulo: 'Comprimento de arco', tex: 's = r \\cdot \\theta \\quad (\\theta\\ \\text{em radianos})' },
    ],
    ideias: ['Volta completa: 360° = 2π rad.', '1 rad ≈ 57,3°.'],
    pegadinhas: ['Na fórmula s = r·θ o ângulo deve estar em radianos.', 'Ângulos maiores que 360° ou negativos: some/subtraia voltas (360°) para reduzir.'],
  },
  {
    titulo: 'Seno, cosseno e tangente',
    formulas: [
      { rotulo: 'Ponto do círculo', tex: 'P = (\\cos\\theta,\\ \\sin\\theta)' },
      { rotulo: 'Tangente', tex: '\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}' },
      { rotulo: 'Relação fundamental', tex: '\\sin^{2}\\theta + \\cos^{2}\\theta = 1' },
    ],
    ideias: ['−1 ≤ sen θ ≤ 1 e −1 ≤ cos θ ≤ 1.', 'Período de seno e cosseno: 2π.', 'A tangente não existe quando cos θ = 0 (90° e 270°).'],
    pegadinhas: ['sen²θ significa (sen θ)², e não sen(θ²).', 'tan 90° não existe: não escreva "infinito" como se fosse um valor.'],
  },
  {
    titulo: 'Valores notáveis',
    formulas: [
      { rotulo: 'sen de 0°, 30°, 45°, 60°, 90°', tex: '0,\\ \\dfrac{1}{2},\\ \\dfrac{\\sqrt{2}}{2},\\ \\dfrac{\\sqrt{3}}{2},\\ 1' },
      { rotulo: 'cos de 0°, 30°, 45°, 60°, 90°', tex: '1,\\ \\dfrac{\\sqrt{3}}{2},\\ \\dfrac{\\sqrt{2}}{2},\\ \\dfrac{1}{2},\\ 0' },
      { rotulo: 'tan de 0°, 30°, 45°, 60°', tex: '0,\\ \\dfrac{\\sqrt{3}}{3},\\ 1,\\ \\sqrt{3}' },
    ],
    ideias: ['Redução ao 1º quadrante: 2º → 180° − α; 3º → α − 180°; 4º → 360° − α.', 'O valor é o do ângulo de referência, com o sinal do quadrante.'],
    pegadinhas: ['Sinais: 1º todos +; 2º só sen; 3º só tan; 4º só cos.', 'Não confunda o seno e o cosseno do mesmo ângulo notável: eles se trocam entre 30° e 60°.'],
  },
]
