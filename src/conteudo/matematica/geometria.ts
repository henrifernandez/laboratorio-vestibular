import type { PareEPense, SecaoResumo } from '../tipos'
import type { Dimensoes, Solido } from '@/materias/matematica/geometria/calculo'

export type VisualGeo =
  | { tipo: 'solido'; solido: Solido; dim: Dimensoes }
  | { tipo: 'dobra'; solido: 'prisma' | 'piramide'; dim: Dimensoes }
  | { tipo: 'agua'; solido: Solido; dim: Dimensoes }
  | { tipo: 'pitagoras' }
  | { tipo: 'semelhanca' }

export interface PassoGeo {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualGeo
}

export const PASSOS_GEO: PassoGeo[] = [
  {
    titulo: 'Sólidos: faces, arestas e vértices',
    texto: [
      'Um paralelepípedo (a caixa de sapatos) tem 6 faces retangulares, 12 arestas (os "cantos" retos) e 8 vértices (as pontas).',
      'Nos poliedros vale a relação de Euler: V − A + F = 2. Na caixa: 8 − 12 + 6 = 2. Arraste o sólido para girar e ver todos os lados.',
    ],
    pare: {
      pergunta: 'Quantas faces tem um paralelepípedo?',
      opcoes: ['4', '6', '8'],
      certa: 1,
      explicacao: 'Tem 3 pares de faces iguais (frente e fundo, esquerda e direita, topo e base): 6 faces.',
    },
    visual: { tipo: 'solido', solido: 'prisma', dim: { a: 4, b: 3, h: 2.5 } },
  },
  {
    titulo: 'Planificação: abrir o sólido',
    texto: [
      'Se você recortar as arestas de uma caixa e abrir todas as faces sobre a mesa, obtém a planificação. Mexa no controle para dobrar e desdobrar.',
      'A área total do sólido é a soma das áreas de todas as peças da planificação. No paralelepípedo, 2(ab + ah + bh).',
    ],
    pare: {
      pergunta: 'Uma caixa de 2 × 3 × 4 cm tem quantos cm² de superfície?',
      opcoes: ['24', '52', '26'],
      certa: 1,
      explicacao: '2·(2·3 + 2·4 + 3·4) = 2·(6 + 8 + 12) = 52 cm². O 24 é o volume e o 26 é metade da área (faltou o fator 2).',
    },
    visual: { tipo: 'dobra', solido: 'prisma', dim: { a: 4, b: 3, h: 2.5 } },
  },
  {
    titulo: 'Volume: encher de água',
    texto: [
      'Volume é quanto o sólido "comporta". Num cilindro, a água forma discos empilhados: V = (área da base) × (altura) = πr²h.',
      'Com r = 3 cm e h = 10 cm (π ≈ 3,14): V = 3,14 · 9 · 10 = 282,6 cm³. Como 1 cm³ equivale a 1 mL, são cerca de 283 mL.',
    ],
    pare: {
      pergunta: 'Um cilindro tem raio 3 cm e altura 10 cm. Aproximadamente quanto ele comporta (π ≈ 3,14)?',
      opcoes: ['94,2 cm³', '282,6 cm³', '188,4 cm³'],
      certa: 1,
      explicacao: 'πr²h = 3,14·9·10 = 282,6 cm³. O 94,2 é π·r·h (faltou um fator r) e o 188,4 é 2πrh, a área lateral, que não é o volume.',
    },
    visual: { tipo: 'agua', solido: 'cilindro', dim: { r: 3, h: 6 } },
  },
  {
    titulo: 'Cone, pirâmide e esfera',
    texto: [
      'Um cone cabe 3 vezes dentro de um cilindro de mesma base e altura, e uma pirâmide cabe 3 vezes no prisma de mesma base e altura. Por isso o fator 1/3: V = (1/3)·Ab·h.',
      'A esfera de raio r tem V = (4/3)πr³: ocupa 2/3 do cilindro que a envolve (altura 2r).',
    ],
    pare: {
      pergunta: 'Um cilindro de 90 cm³ e um cone com a mesma base e a mesma altura. Qual é o volume do cone?',
      opcoes: ['30 cm³', '45 cm³', '270 cm³'],
      certa: 0,
      explicacao: 'O cone é 1/3 do cilindro: 90 ÷ 3 = 30 cm³.',
    },
    visual: { tipo: 'agua', solido: 'cone', dim: { r: 3, h: 5 } },
  },
  {
    titulo: 'Pitágoras e semelhança de triângulos',
    texto: [
      'No triângulo retângulo, a hipotenusa ao quadrado é a soma dos quadrados dos catetos: c² = a² + b². Com catetos 3 e 4, a hipotenusa vale 5.',
      'Triângulos semelhantes têm os mesmos ângulos e lados proporcionais: se um lado fica 2 vezes maior, todos ficam; a área fica 2² = 4 vezes maior.',
    ],
    pare: {
      pergunta: 'Dois triângulos são semelhantes com razão 3 (o maior tem lados 3 vezes maiores). A área do maior é quantas vezes a do menor?',
      opcoes: ['3', '6', '9'],
      certa: 2,
      explicacao: 'A razão de áreas é o quadrado da razão de semelhança: 3² = 9.',
    },
    visual: { tipo: 'pitagoras' },
  },
]

export const RESUMO_GEO: SecaoResumo[] = [
  {
    titulo: 'Poliedros',
    formulas: [
      { rotulo: 'Relação de Euler', tex: 'V - A + F = 2' },
      { rotulo: 'Prisma (paralelepípedo)', tex: 'V = a \\cdot b \\cdot h \\qquad A_t = 2(ab + ah + bh)' },
    ],
    ideias: ['Vértices (V), arestas (A) e faces (F) satisfazem a relação de Euler nos poliedros convexos.', 'Planificação: a área total é a soma das áreas das peças.'],
    pegadinhas: ['Cubo de aresta a: V = a³ e A = 6a².', 'Não confunda área (cm²) com volume (cm³).'],
  },
  {
    titulo: 'Corpos redondos e pirâmides',
    formulas: [
      { rotulo: 'Cilindro', tex: 'V = \\pi r^{2} h \\qquad A_{lat} = 2\\pi r h \\qquad A_t = 2\\pi r (h + r)' },
      { rotulo: 'Cone', tex: 'V = \\dfrac{\\pi r^{2} h}{3} \\qquad A_{lat} = \\pi r g \\qquad g^{2} = r^{2} + h^{2}' },
      { rotulo: 'Pirâmide', tex: 'V = \\dfrac{A_b \\cdot h}{3} \\qquad ap^{2} = h^{2} + \\left(\\dfrac{\\ell}{2}\\right)^{2}' },
      { rotulo: 'Esfera', tex: 'V = \\dfrac{4}{3}\\pi r^{3} \\qquad A = 4\\pi r^{2}' },
    ],
    ideias: ['Cone = 1/3 do cilindro e pirâmide = 1/3 do prisma (mesma base e altura).', 'Esfera = 2/3 do cilindro circunscrito.', 'Conceito: volume = área da base × altura (÷ 3 se afunila até um ponto).'],
    pegadinhas: ['Na lateral do cone use a geratriz g, e não a altura.', 'Na lateral da pirâmide use o apótema, e não a altura.', 'Raio é metade do diâmetro: confira o que o enunciado dá.'],
  },
  {
    titulo: 'Triângulos',
    formulas: [
      { rotulo: 'Pitágoras', tex: 'a^{2} + b^{2} = c^{2}' },
      { rotulo: 'Semelhança (razão k)', tex: '\\dfrac{\\text{lado}_2}{\\text{lado}_1} = k \\qquad \\dfrac{A_2}{A_1} = k^{2} \\qquad \\dfrac{V_2}{V_1} = k^{3}' },
    ],
    ideias: ['A hipotenusa é o maior lado e fica oposta ao ângulo reto.', 'Triângulos semelhantes: ângulos iguais e lados proporcionais.', 'Sombras no mesmo horário: altura/sombra é igual para todos os objetos.'],
    pegadinhas: ['Ternas pitagóricas comuns: 3-4-5, 5-12-13, 8-15-17.', 'Razão de áreas é k², e não k.', 'Monte a proporção com lados correspondentes (mesma posição nos dois triângulos).'],
  },
]
