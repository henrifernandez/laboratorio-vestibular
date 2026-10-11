import type { Funcao } from '@/materias/matematica/funcoes/modelo'

/** O que o gráfico da etapa deve destacar. */
export type Realce = 'raizes' | 'vertice' | 'intercepto' | 'assintota'

export interface PareEPense {
  pergunta: string
  opcoes: string[]
  certa: number
  explicacao: string
}

export interface PassoEntenda {
  titulo: string
  /** parágrafos curtos; exemplos antes de definições */
  texto: string[]
  /** a simulação entra neste estado quando a etapa abre */
  funcao: Funcao
  realces: Realce[]
  pare?: PareEPense
}

export const PASSOS_ENTENDA: PassoEntenda[] = [
  {
    titulo: 'Função afim: uma reta com regra',
    texto: [
      'Uma corrida de aplicativo custa R$ 4 de bandeirada mais R$ 2 por quilômetro. Para 3 km: 2·3 + 4 = R$ 10.',
      'A regra f(x) = ax + b descreve isso. O b é o ponto de partida (onde a reta corta o eixo y), e o a é quanto y muda quando x aumenta 1.',
    ],
    funcao: { tipo: 'afim', a: 2, b: 4 },
    realces: ['intercepto', 'raizes'],
    pare: {
      pergunta: 'Na regra f(x) = 2x + 4, quanto vale f(5)?',
      opcoes: ['10', '14', '9'],
      certa: 1,
      explicacao: 'f(5) = 2·5 + 4 = 14. Substitua o x e calcule.',
    },
  },
  {
    titulo: 'O sinal de a vira a reta',
    texto: [
      'Com a > 0 a reta sobe da esquerda para a direita. Com a < 0 ela desce.',
      'Aqui a = −1: cada passo à direita faz y cair 1. A raiz (onde a reta corta o eixo x) fica em x = −b/a.',
    ],
    funcao: { tipo: 'afim', a: -1, b: 3 },
    realces: ['intercepto', 'raizes'],
    pare: {
      pergunta: 'A reta f(x) = −x + 3 corta o eixo x em qual ponto?',
      opcoes: ['x = −3', 'x = 3', 'x = 0'],
      certa: 1,
      explicacao: 'Igualando a zero: −x + 3 = 0, então x = 3.',
    },
  },
  {
    titulo: 'Função quadrática: a parábola',
    texto: [
      'Chutar uma bola desenha uma parábola: sobe, para no ponto mais alto e desce. Esse ponto é o vértice.',
      'Em f(x) = ax² + bx + c, o vértice fica em x = −b/(2a). Com a > 0 a parábola abre para cima.',
    ],
    funcao: { tipo: 'quadratica', a: 1, b: -4, c: 3 },
    realces: ['vertice', 'raizes', 'intercepto'],
    pare: {
      pergunta: 'Em f(x) = x² − 4x + 3, qual é a coordenada x do vértice?',
      opcoes: ['x = 2', 'x = 4', 'x = −2'],
      certa: 0,
      explicacao: 'x do vértice = −b/(2a) = −(−4)/(2·1) = 2.',
    },
  },
  {
    titulo: 'Quando a < 0, a parábola vira',
    texto: [
      'Trocar o sinal de a espelha a parábola: ela passa a abrir para baixo, e o vértice vira o ponto mais alto.',
      'Ela tem duas raízes quando Δ = b² − 4ac é positivo, uma quando é zero e nenhuma quando é negativo.',
    ],
    funcao: { tipo: 'quadratica', a: -1, b: 4, c: -3 },
    realces: ['vertice', 'raizes', 'intercepto'],
    pare: {
      pergunta: 'Uma parábola abre para baixo e o vértice está acima do eixo x. Quantas raízes reais ela tem?',
      opcoes: ['Nenhuma', 'Uma', 'Duas'],
      certa: 2,
      explicacao: 'Abrindo para baixo, ela parte de cima do eixo, sobe até o vértice e desce de novo: atravessa o eixo x duas vezes.',
    },
  },
  {
    titulo: 'Exponencial: crescimento que acelera',
    texto: [
      'Um vídeo que dobra de visualizações a cada dia segue f(x) = 2ˣ: 1, 2, 4, 8, 16…',
      'A curva nunca toca a assíntota y = k (aqui, o eixo x). Com base entre 0 e 1 ela decresce em vez de crescer.',
    ],
    funcao: { tipo: 'exponencial', a: 1, base: 2, k: 0 },
    realces: ['assintota', 'intercepto'],
    pare: {
      pergunta: 'Em f(x) = 2ˣ + 1, qual é a assíntota horizontal?',
      opcoes: ['y = 0', 'y = 1', 'y = 2'],
      certa: 1,
      explicacao: 'O termo constante desloca a curva e a assíntota: ela vira y = 1.',
    },
  },
  {
    titulo: 'Logaritmo: a função inversa',
    texto: [
      'O logaritmo responde "2 elevado a quanto dá 8?": log₂ 8 = 3. Ele desfaz a exponencial.',
      'Por isso o gráfico existe só para x > 0, passa por (1, 0) e tem o eixo y como assíntota vertical.',
    ],
    funcao: { tipo: 'logaritmica', a: 1, base: 2, k: 0 },
    realces: ['assintota', 'raizes'],
    pare: {
      pergunta: 'Qual é o domínio de f(x) = log₂(x)?',
      opcoes: ['Todos os reais', 'x > 0', 'x ≥ 0'],
      certa: 1,
      explicacao: 'Não existe potência de 2 que dê zero ou negativo, então só x > 0 tem logaritmo.',
    },
  },
]

export interface SecaoResumo {
  titulo: string
  /** LaTeX de fórmulas essenciais */
  formulas: { rotulo: string; tex: string }[]
  ideias: string[]
  pegadinhas: string[]
}

export const RESUMO_FUNCOES: SecaoResumo[] = [
  {
    titulo: 'Função afim',
    formulas: [
      { rotulo: 'Forma geral', tex: 'f(x) = ax + b' },
      { rotulo: 'Raiz', tex: 'x = -\\dfrac{b}{a}' },
      { rotulo: 'Coeficiente angular por dois pontos', tex: 'a = \\dfrac{y_2 - y_1}{x_2 - x_1}' },
    ],
    ideias: ['a > 0: crescente; a < 0: decrescente.', 'b é onde a reta corta o eixo y: f(0) = b.'],
    pegadinhas: ['Se a = 0 a função é constante e não tem raiz (ou todo x é raiz, se b = 0).', 'Trocar a ordem dos pontos no cálculo de a muda os sinais dos dois lados, mas não o resultado.'],
  },
  {
    titulo: 'Função quadrática',
    formulas: [
      { rotulo: 'Forma geral', tex: 'f(x) = ax^{2} + bx + c' },
      { rotulo: 'Discriminante', tex: '\\Delta = b^{2} - 4ac' },
      { rotulo: 'Raízes (Bhaskara)', tex: 'x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}' },
      { rotulo: 'Vértice', tex: 'V = \\left(-\\dfrac{b}{2a},\\; -\\dfrac{\\Delta}{4a}\\right)' },
      { rotulo: 'Forma canônica', tex: 'f(x) = a(x - x_v)^{2} + y_v' },
    ],
    ideias: [
      'a > 0 abre para cima (vértice é o mínimo); a < 0 abre para baixo (vértice é o máximo).',
      'Δ > 0: duas raízes; Δ = 0: uma raiz; Δ < 0: nenhuma raiz real.',
      'c é onde a parábola corta o eixo y; b dá a inclinação da curva nesse ponto.',
    ],
    pegadinhas: [
      'O sinal do y do vértice é −Δ/4a: cuidado com o sinal de a.',
      'Soma das raízes = −b/a e produto = c/a, útil para conferir resultados.',
    ],
  },
  {
    titulo: 'Função exponencial',
    formulas: [
      { rotulo: 'Forma', tex: 'f(x) = a \\cdot b^{x} + k \\quad (b > 0,\\ b \\neq 1)' },
      { rotulo: 'Assíntota', tex: 'y = k' },
    ],
    ideias: ['Com a > 0: base > 1 cresce, base entre 0 e 1 decresce.', 'f(0) = a + k.'],
    pegadinhas: ['A base nunca é negativa nem 1.', 'Uma função exponencial nunca vale zero (sem o deslocamento k).'],
  },
  {
    titulo: 'Função logarítmica',
    formulas: [
      { rotulo: 'Forma', tex: 'f(x) = a \\cdot \\log_{b} x + k' },
      { rotulo: 'Definição', tex: '\\log_{b} x = y \\iff b^{y} = x' },
      { rotulo: 'Mudança de base', tex: '\\log_{b} x = \\dfrac{\\ln x}{\\ln b}' },
    ],
    ideias: ['Domínio: x > 0. Assíntota vertical: x = 0.', 'log_b(1) = 0 e log_b(b) = 1.'],
    pegadinhas: ['"log" sem base costuma ser base 10; "ln" é base e.', 'Logaritmo de número negativo ou zero não existe.'],
  },
  {
    titulo: 'Transformações de gráficos',
    formulas: [
      { rotulo: 'Subir/descer', tex: 'f(x) + k' },
      { rotulo: 'Direita/esquerda', tex: 'f(x - h)' },
      { rotulo: 'Reflexões', tex: '-f(x) \\ \\text{e}\\ f(-x)' },
    ],
    ideias: ['f(x − h) desloca h unidades para a direita (o sinal "engana").', 'Multiplicar por um número maior que 1 estica o gráfico na vertical.'],
    pegadinhas: ['A ordem das transformações importa quando há reflexão ou esticamento junto com deslocamento.'],
  },
]
