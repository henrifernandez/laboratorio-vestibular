import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualGA =
  | { tipo: 'distancia'; a: [number, number]; b: [number, number] }
  | { tipo: 'inclinacao'; a: [number, number]; b: [number, number] }
  | { tipo: 'reta'; m: number; n: number }
  | { tipo: 'duasRetas'; m1: number; n1: number; m2: number; n2: number }
  | { tipo: 'circulo'; h: number; k: number; r: number }

export interface PassoGA {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualGA
}

export const PASSOS_GA: PassoGA[] = [
  {
    titulo: 'Distância entre dois pontos',
    texto: [
      'No plano cartesiano, A(0, 0) e B(3, 4) formam um triângulo retângulo com catetos 3 (horizontal) e 4 (vertical). A distância AB é a hipotenusa: 5.',
      'Em geral, d = √[(x₂ − x₁)² + (y₂ − y₁)²]. É o teorema de Pitágoras com as diferenças das coordenadas.',
    ],
    pare: {
      pergunta: 'Qual é a distância entre (1, 1) e (4, 5)?',
      opcoes: ['5', '7', '25'],
      certa: 0,
      explicacao: 'Δx = 3 e Δy = 4, então d = √(9 + 16) = √25 = 5. O 25 é a soma dos quadrados, antes da raiz.',
    },
    visual: { tipo: 'distancia', a: [0, 0], b: [3, 4] },
  },
  {
    titulo: 'A reta e o coeficiente angular',
    texto: [
      'Dois pontos definem uma reta. O coeficiente angular m mede a inclinação: quanto y sobe quando x anda 1. Aqui, de (0, 1) a (2, 5): Δy = 4 e Δx = 2, então m = 4/2 = 2.',
      'm = (y₂ − y₁)/(x₂ − x₁). Se m > 0 a reta sobe; se m < 0 desce; se m = 0 é horizontal. Reta vertical não tem coeficiente angular.',
    ],
    pare: {
      pergunta: 'Qual é o coeficiente angular da reta que passa por (0, 3) e (2, 1)?',
      opcoes: ['−1', '1', '−2'],
      certa: 0,
      explicacao: 'm = (1 − 3)/(2 − 0) = −2/2 = −1. A reta desce.',
    },
    visual: { tipo: 'inclinacao', a: [0, 1], b: [2, 5] },
  },
  {
    titulo: 'Equação reduzida: y = mx + n',
    texto: [
      'Com m e um ponto, ache n: o n é onde a reta corta o eixo y. Para m = 2 passando por (0, 1): y = 2x + 1.',
      'Também existe a forma geral, ax + by + c = 0 (aqui, 2x − y + 1 = 0). Um ponto pertence à reta quando suas coordenadas satisfazem a equação.',
    ],
    pare: {
      pergunta: 'A reta y = −x + 3 passa por qual destes pontos?',
      opcoes: ['(0, 3)', '(3, 3)', '(1, 3)'],
      certa: 0,
      explicacao: 'Em x = 0: y = 3, então (0, 3) está na reta. Em x = 3, y = 0; em x = 1, y = 2.',
    },
    visual: { tipo: 'reta', m: 2, n: 1 },
  },
  {
    titulo: 'Paralelas e perpendiculares',
    texto: [
      'Retas paralelas têm o mesmo coeficiente angular (m₁ = m₂). Retas perpendiculares têm coeficientes que, multiplicados, dão −1 (m₁·m₂ = −1).',
      'Se uma reta tem m = 2, uma perpendicular tem m = −1/2. Troque o sinal e inverta.',
    ],
    pare: {
      pergunta: 'Qual é o coeficiente angular de uma reta perpendicular a y = 2x + 1?',
      opcoes: ['−2', '−1/2', '1/2'],
      certa: 1,
      explicacao: 'Precisamos m·2 = −1, então m = −1/2.',
    },
    visual: { tipo: 'duasRetas', m1: 2, n1: 1, m2: -0.5, n2: 4 },
  },
  {
    titulo: 'A circunferência',
    texto: [
      'Uma circunferência é o conjunto de pontos à mesma distância r de um centro C(h, k). Pela fórmula da distância: (x − h)² + (y − k)² = r².',
      'Com centro (2, −1) e raio 3: (x − 2)² + (y + 1)² = 9. Atenção ao sinal: o centro tem y = −1, mas aparece (y + 1).',
    ],
    pare: {
      pergunta: 'Qual é o centro da circunferência (x − 2)² + (y + 1)² = 9?',
      opcoes: ['(2, 1)', '(2, −1)', '(−2, −1)'],
      certa: 1,
      explicacao: '(x − 2) dá h = 2 e (y + 1) = (y − (−1)) dá k = −1. O raio é √9 = 3.',
    },
    visual: { tipo: 'circulo', h: 2, k: -1, r: 3 },
  },
]

export const RESUMO_GA: SecaoResumo[] = [
  {
    titulo: 'Pontos',
    formulas: [
      { rotulo: 'Distância entre pontos', tex: 'd = \\sqrt{(x_2 - x_1)^{2} + (y_2 - y_1)^{2}}' },
      { rotulo: 'Ponto médio', tex: 'M = \\left(\\dfrac{x_1 + x_2}{2},\\ \\dfrac{y_1 + y_2}{2}\\right)' },
    ],
    ideias: ['A distância vem do teorema de Pitágoras.', 'O ponto médio é a média das coordenadas.'],
    pegadinhas: ['Esquecer a raiz quadrada na distância.', 'Somar as coordenadas e esquecer de dividir por 2 no ponto médio.'],
  },
  {
    titulo: 'Reta',
    formulas: [
      { rotulo: 'Coeficiente angular', tex: 'm = \\dfrac{y_2 - y_1}{x_2 - x_1}' },
      { rotulo: 'Equação reduzida', tex: 'y = mx + n' },
      { rotulo: 'Equação geral', tex: 'ax + by + c = 0' },
      { rotulo: 'Distância de ponto a reta', tex: 'd = \\dfrac{|ax_0 + by_0 + c|}{\\sqrt{a^{2} + b^{2}}}' },
    ],
    ideias: ['Paralelas: m₁ = m₂. Perpendiculares: m₁·m₂ = −1.', 'n é onde a reta corta o eixo y; −n/m é onde corta o eixo x.', 'Reta vertical: x = k (sem coeficiente angular).'],
    pegadinhas: ['Calcular Δy/Δx em ordens diferentes em cima e embaixo (o sinal troca).', 'Confundir Δx/Δy com Δy/Δx.', 'Na distância ponto-reta, o denominador é a raiz de a² + b².'],
  },
  {
    titulo: 'Circunferência',
    formulas: [
      { rotulo: 'Equação reduzida', tex: '(x - h)^{2} + (y - k)^{2} = r^{2}' },
      { rotulo: 'Equação geral', tex: 'x^{2} + y^{2} - 2hx - 2ky + (h^{2} + k^{2} - r^{2}) = 0' },
    ],
    ideias: [
      'Do centro e raio para a equação: substitua em (x − h)² + (y − k)² = r².',
      'Da geral para centro e raio: h = −D/2, k = −E/2 e r² = h² + k² − F.',
      'Ponto × circunferência: compare d(centro, P) com r. Reta × circunferência: compare d(centro, reta) com r.',
    ],
    pegadinhas: ['Sinal do centro: (x + 3) significa h = −3.', 'O lado direito é r², e não r.', 'Tangente quando d = r; secante quando d < r; externa quando d > r.'],
  },
]
