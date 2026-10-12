import type { PareEPense, SecaoResumo } from '../tipos'
import type { CenarioId } from '@/materias/fisica/dinamica/dcl'

export type VisualDin =
  | { tipo: 'mesa'; F: number; m: number; mu: number }
  | { tipo: 'dcl'; cenario: CenarioId }
  | { tipo: 'plano'; angulo: number; m: number; mu: number; componentes: boolean }
  | { tipo: 'polias'; m1: number; m2: number }
  | { tipo: 'onibus' }
  | { tipo: 'patinadores'; mA: number; mB: number; F: number; dt: number }
  | { tipo: 'pares' }

export interface PassoDin {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualDin
}

export const PASSOS_DIN: PassoDin[] = [
  {
    titulo: 'Sem resultante, a velocidade não muda',
    texto: [
      'A 1ª lei de Newton, ou princípio da inércia, diz que um corpo mantém a sua velocidade (parado, ou em linha reta com velocidade constante) enquanto a força resultante sobre ele for zero. Não é preciso força para continuar em movimento; é preciso força para mudar o movimento.',
      'No ônibus que freia, nada empurra a bola nem o passageiro para a frente. Eles só continuam com a velocidade que tinham, enquanto o ônibus perde a sua. Quem olha da calçada vê a bola seguir reto, com passos iguais; quem está dentro tem a impressão de que ela foi “jogada” para a frente.',
    ],
    pare: {
      pergunta: 'Uma sonda no espaço, longe de qualquer planeta, desliga os motores quando está a 10 km/s. O que acontece com a velocidade dela?',
      opcoes: ['Continua 10 km/s, em linha reta', 'Vai diminuindo até a sonda parar', 'Aumenta, porque não há atrito'],
      certa: 0,
      explicacao: 'Sem força resultante, a velocidade não muda (1ª lei). Ela só pararia se alguma força a freasse; longe de tudo e sem atrito, nada a freia. E nada a acelera também.',
    },
    visual: { tipo: 'onibus' },
  },
  {
    titulo: 'A resultante é quem acelera',
    texto: [
      'Empurre um bloco de 4 kg com 20 N numa superfície sem atrito: ele ganha 5 m/s de velocidade a cada segundo. É a 2ª lei de Newton, F_res = m·a: quanto maior a força resultante, maior a aceleração; quanto maior a massa, menor.',
      'Resultante é a soma (com sinais) de todas as forças. Se ela for zero, a velocidade não muda: o corpo fica parado ou segue em linha reta com velocidade constante. Não precisa de força para manter o movimento.',
    ],
    pare: {
      pergunta: 'Um bloco de 4 kg é puxado por uma força de 20 N sobre uma superfície sem atrito. Qual é a aceleração?',
      opcoes: ['5 m/s²', '80 m/s²', '0,2 m/s²'],
      certa: 0,
      explicacao: 'a = F/m = 20/4 = 5 m/s². O 80 vem de multiplicar F·m, e o 0,2 de inverter a divisão (m/F).',
    },
    visual: { tipo: 'mesa', F: 20, m: 4, mu: 0 },
  },
  {
    titulo: 'Toda força tem um par: ação e reação',
    texto: [
      'Forças nascem de interações entre dois corpos. Se A empurra B, B empurra A ao mesmo tempo, com força de mesmo módulo e sentido oposto. É a 3ª lei de Newton, e ela não depende de quem “começou” nem de quem é mais pesado.',
      'Os patinadores recebem forças iguais, mas o mais leve sai mais rápido: a mesma força dividida por uma massa menor dá uma aceleração maior (2ª lei). No fim, massa × velocidade é igual para os dois.',
    ],
    pare: {
      pergunta: 'Uma patinadora de 50 kg empurra um patinador de 80 kg. Durante o empurrão, quem recebe a força de maior módulo?',
      opcoes: ['Os dois recebem forças de mesmo módulo', 'A patinadora, por ser mais leve', 'O patinador, por ser mais pesado'],
      certa: 0,
      explicacao: 'Ação e reação têm sempre o mesmo módulo. O que muda é o efeito: a patinadora, mais leve, tem aceleração maior (a = F/m) e por isso sai mais rápido.',
    },
    visual: { tipo: 'patinadores', mA: 50, mB: 80, F: 200, dt: 0.5 },
  },
  {
    titulo: 'Ação e reação não se anulam',
    texto: [
      'As duas forças de um par atuam em corpos diferentes, por isso nunca se cancelam. Só se somam (e podem se anular) forças que atuam no mesmo corpo.',
      'O livro sobre a mesa tem duas interações: com a Terra (o peso P e a reação P′, o livro puxando a Terra) e com a mesa (a normal N e a reação N′, o livro empurrando a mesa). P e N se equilibram no livro, mas não são par: o par do peso está na Terra.',
    ],
    pare: {
      pergunta: 'Um caminhão e um carro batem de frente. Sobre as forças que um faz no outro durante o choque, é correto dizer que…',
      opcoes: ['têm o mesmo módulo, e o carro sofre mais porque tem menos massa', 'a do caminhão sobre o carro é maior, porque o caminhão é mais pesado', 'se anulam, porque são iguais e opostas'],
      certa: 0,
      explicacao: 'É um par de ação e reação: mesmo módulo, sentidos opostos. Elas não se anulam porque atuam em corpos diferentes (uma no carro, outra no caminhão). Com menos massa, o carro sofre uma aceleração muito maior.',
    },
    visual: { tipo: 'pares' },
  },
  {
    titulo: 'Desenhe só as forças que existem',
    texto: [
      'Para cada força, pergunte: quem a faz? A Terra puxa o bloco (peso, vertical para baixo). A mesa empurra o bloco (normal, perpendicular à mesa) e o raspa (atrito, paralelo à mesa). Um fio puxa (tração).',
      'Não existe “força do movimento” nem “força da velocidade”: se nada o está fazendo, não entra no diagrama. Peso e normal têm o mesmo valor aqui porque o bloco não acelera na vertical (isso vem da 1ª lei), e não porque formam um par de ação e reação.',
    ],
    pare: {
      pergunta: 'Um bloco foi empurrado e agora desliza sozinho sobre uma mesa sem atrito. Que forças atuam nele?',
      opcoes: ['Só o peso e a normal', 'Peso, normal e uma força para a frente que mantém o movimento', 'Peso, normal e a força da mão que o empurrou'],
      certa: 0,
      explicacao: 'Depois que a mão solta o bloco, ela não age mais. E não existe “força do movimento”: sem atrito, a resultante é zero e o bloco segue com velocidade constante (1ª lei). Sobram o peso e a normal, que se equilibram.',
    },
    visual: { tipo: 'dcl', cenario: 'mesa' },
  },
  {
    titulo: 'Atrito: se ajusta quando parado, vale μ·N quando desliza',
    texto: [
      'Empurre um armário pesado com pouca força: ele não sai do lugar, porque o atrito cresce junto com a sua força e a iguala. O atrito estático vai de zero até um máximo, μ·N.',
      'Só quando a força passa desse máximo o bloco desliza, e o atrito passa a valer μ·N (cinético). Parado, o atrito é igual à força que o empurra, e não μ·N.',
    ],
    pare: {
      pergunta: 'Um bloco de 10 kg está parado numa mesa com μ = 0,5. Uma pessoa o empurra horizontalmente com 20 N. Qual é o atrito sobre o bloco? (g = 10 m/s²)',
      opcoes: ['50 N', '20 N', '0 N'],
      certa: 1,
      explicacao: 'O atrito máximo é μ·N = 0,5·100 = 50 N, mas o bloco não se move: o atrito só precisa igualar os 20 N aplicados. 50 N seria o valor máximo, e 0 N deixaria o bloco acelerar.',
    },
    visual: { tipo: 'mesa', F: 20, m: 10, mu: 0.5 },
  },
  {
    titulo: 'No plano inclinado, decomponha o peso',
    texto: [
      'No plano inclinado, o peso se divide em duas partes: uma ao longo do plano (m·g·sen θ), que puxa o bloco para baixo, e outra perpendicular a ele (m·g·cos θ), que a normal equilibra.',
      'O atrito máximo é μ·N = μ·m·g·cos θ. O bloco desliza quando m·g·sen θ > μ·m·g·cos θ. A massa aparece dos dois lados e se cancela: sobra tg θ > μ.',
    ],
    pare: {
      pergunta: 'Um bloco fica parado num plano inclinado. Trocamos por outro do mesmo material com o dobro da massa. O que acontece?',
      opcoes: ['Passa a deslizar, porque pesa mais', 'Continua parado: a massa se cancela e só importam θ e μ', 'Fica parado só se o plano for liso'],
      certa: 1,
      explicacao: 'Dobrar a massa dobra a componente do peso, mas também dobra a normal e o atrito máximo. A comparação tg θ × μ não muda. (E se o plano fosse liso, o bloco sempre deslizaria.)',
    },
    visual: { tipo: 'plano', angulo: 30, m: 5, mu: 0.8, componentes: true },
  },
  {
    titulo: 'Fios e polias: uma equação por bloco',
    texto: [
      'Dois blocos ligados por um fio ideal têm a mesma aceleração (em módulo) e a mesma tração nas duas pontas. Escreva F_res = m·a para cada bloco, com o sentido do movimento como positivo.',
      'Na máquina de Atwood (3 kg e 1 kg): o maior desce, 30 − T = 3a; o menor sobe, T − 10 = 1a. Somando, a tração some: 20 = 4a, então a = 5 m/s² e T = 15 N. A tração não é igual ao peso de nenhum dos dois.',
    ],
    pare: {
      pergunta: 'Na máquina de Atwood com blocos de 3 kg e 1 kg (g = 10 m/s²), a tração no fio vale...',
      opcoes: ['30 N', '15 N', '10 N'],
      certa: 1,
      explicacao: 'O bloco de 1 kg sobe com a = 5 m/s²: T − 10 = 1·5, então T = 15 N. Os 30 N são o peso do bloco maior (ele acelera, não está em equilíbrio) e os 10 N o do menor.',
    },
    visual: { tipo: 'polias', m1: 3, m2: 1 },
  },
]

export const RESUMO_DIN: SecaoResumo[] = [
  {
    titulo: 'Leis de Newton',
    formulas: [
      { rotulo: '1ª lei (inércia)', tex: '\\vec F_{res} = \\vec 0 \\iff \\vec v\\ \\text{constante}' },
      { rotulo: '2ª lei', tex: '\\vec F_{res} = m\\,\\vec a' },
      { rotulo: '3ª lei', tex: '\\vec F_{A \\to B} = -\\,\\vec F_{B \\to A}' },
      { rotulo: 'Peso', tex: 'P = m\\,g \\quad (g \\approx 10\\ \\text{m/s}^2)' },
      { rotulo: 'Unidade', tex: '1\\ \\text{N} = 1\\ \\text{kg}\\cdot\\text{m/s}^2' },
    ],
    ideias: [
      'Resultante zero: repouso ou velocidade constante (1ª lei). Força serve para mudar a velocidade, não para mantê-la.',
      'Ação e reação: mesmo módulo, sentidos opostos, corpos diferentes, ao mesmo tempo (3ª lei).',
      'Forças iguais em massas diferentes dão acelerações diferentes: m₁·a₁ = m₂·a₂.',
      'Diagrama de corpo livre: só forças com agente (peso, normal, atrito, tração).',
    ],
    pegadinhas: [
      'Não existe “força do movimento”.',
      'Ação e reação não se anulam: atuam em corpos diferentes.',
      'Peso e normal não são par ação e reação; o par do peso é o corpo puxando a Terra.',
      'Numa batida, o veículo mais leve não recebe força maior; ele acelera mais.',
      'Massa (kg) não é peso (N).',
    ],
  },
  {
    titulo: 'Blocos encostados',
    formulas: [
      { rotulo: 'Aceleração comum', tex: 'a = \\dfrac{F}{m_A + m_B + \\dots}' },
      { rotulo: 'Força de contato', tex: 'F_{\\text{contato}} = a \\cdot (\\text{massa à frente do contato})' },
    ],
    ideias: ['A força de contato é a única força horizontal que acelera o que está à frente dela.', '“A sobre B” e “B sobre A” têm o mesmo módulo (3ª lei).'],
    pegadinhas: ['A força aplicada não passa inteira para o bloco seguinte.', 'A força não se divide em partes iguais: depende das massas.'],
  },
  {
    titulo: 'Atrito',
    formulas: [
      { rotulo: 'Estático (máximo)', tex: 'f_{e,\\max} = \\mu_e\\,N' },
      { rotulo: 'Cinético', tex: 'f_c = \\mu_c\\,N' },
    ],
    ideias: ['Parado: o atrito se ajusta e iguala a força que tenta mover o bloco (de zero até μ·N).', 'Deslizando: o atrito vale μ·N e se opõe ao movimento.', 'A normal N nem sempre é o peso: no plano inclinado, N = m·g·cos θ.'],
    pegadinhas: ['Bloco parado não tem atrito = μ·N, a menos que esteja na iminência de deslizar.', 'O atrito não depende da área de contato.'],
  },
  {
    titulo: 'Plano inclinado',
    formulas: [
      { rotulo: 'Componentes do peso', tex: 'P_x = m\\,g\\,\\sin\\theta \\qquad P_y = m\\,g\\,\\cos\\theta' },
      { rotulo: 'Desliza se', tex: '\\tan\\theta > \\mu' },
      { rotulo: 'Aceleração (desliza)', tex: 'a = g\\,(\\sin\\theta - \\mu\\cos\\theta)' },
    ],
    ideias: ['Sem atrito: a = g·sen θ, qualquer que seja a massa.', 'O ângulo crítico é θ = arctg μ.', 'Em repouso, o atrito iguala P_x.'],
    pegadinhas: ['A massa não decide se desliza.', 'Não confunda sen e cos: a componente ao longo do plano é com sen.'],
  },
  {
    titulo: 'Fios e polias',
    formulas: [
      { rotulo: 'Atwood', tex: 'a = \\dfrac{(m_1 - m_2)\\,g}{m_1 + m_2} \\qquad T = \\dfrac{2\\,m_1 m_2\\,g}{m_1 + m_2}' },
      { rotulo: 'Mesa + bloco pendurado', tex: 'a = \\dfrac{m_2\\,g - \\mu\\,m_1\\,g}{m_1 + m_2}' },
    ],
    ideias: ['Uma equação F_res = m·a por bloco; some para eliminar T.', 'Fio ideal: mesma tração e mesma aceleração (em módulo).'],
    pegadinhas: ['A tração não é igual ao peso do bloco pendurado quando ele acelera.', 'Divida pela massa total, não por um bloco só.'],
  },
]
