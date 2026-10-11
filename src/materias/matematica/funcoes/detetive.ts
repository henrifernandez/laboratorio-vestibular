import { criarRng, escolher, sortear, type Rng } from '@/lib/rng'
import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import type { Janela } from './esboce'
import { JANELAS } from './janelas'
import { caracteristicas, NOMES_FAMILIA, formulaTexto, type Funcao } from './modelo'

export interface Opcao {
  valor: string
  rotulo: string
}

export interface Pergunta {
  id: string
  enunciado: string
  opcoes: Opcao[]
  certa: string
  explicacao: string
  /** o que lembrar quando errar (vai para o caderno) */
  licao: string
}

export interface InstanciaDetetive {
  semente: number
  nivel: Nivel
  alvo: Funcao
  janela: Janela
  perguntas: Pergunta[]
}

export type RespostaDetetive = Record<string, string>

const sinal = (n: number) => (n > 0 ? '+' : n < 0 ? '-' : '0')
const SINAL2: Opcao[] = [
  { valor: '+', rotulo: 'positivo' },
  { valor: '-', rotulo: 'negativo' },
]
const SINAL3: Opcao[] = [SINAL2[0]!, { valor: '0', rotulo: 'zero' }, SINAL2[1]!]
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

const perguntaTipo = (alvo: Funcao): Pergunta => ({
  id: 'tipo',
  enunciado: 'Que tipo de função é essa?',
  opcoes: (Object.keys(NOMES_FAMILIA) as Funcao['tipo'][]).map((t) => ({ valor: t, rotulo: NOMES_FAMILIA[t] })),
  certa: alvo.tipo,
  explicacao: {
    afim: 'O gráfico é uma reta: função afim.',
    quadratica: 'O gráfico é uma parábola, com um vértice: função quadrática.',
    exponencial: 'A curva se aproxima de uma linha horizontal (assíntota) sem tocá-la e cresce ou decresce cada vez mais rápido: função exponencial.',
    logaritmica: 'A curva só existe para x > 0, tem uma assíntota vertical no eixo y e cresce (ou decresce) cada vez mais devagar: função logarítmica.',
  }[alvo.tipo],
  licao: 'reta = afim; parábola = quadrática; assíntota horizontal = exponencial; só x > 0 = logarítmica',
})

function perguntasAfim(f: Extract<Funcao, { tipo: 'afim' }>): Pergunta[] {
  return [
    {
      id: 'a',
      enunciado: 'Qual é o sinal de a (a inclinação)?',
      opcoes: SINAL2,
      certa: sinal(f.a),
      explicacao:
        f.a > 0
          ? 'Da esquerda para a direita a reta sobe, então a é positivo.'
          : 'Da esquerda para a direita a reta desce, então a é negativo.',
      licao: 'a > 0: a reta sobe; a < 0: a reta desce',
    },
    {
      id: 'b',
      enunciado: 'Qual é o sinal de b (onde a reta corta o eixo y)?',
      opcoes: SINAL3,
      certa: sinal(f.b),
      explicacao:
        f.b === 0
          ? 'A reta passa pela origem, então b = 0.'
          : `A reta corta o eixo y ${f.b > 0 ? 'acima' : 'abaixo'} da origem (em y = ${fmt(f.b)}), então b é ${f.b > 0 ? 'positivo' : 'negativo'}.`,
      licao: 'b = f(0): a altura em que a reta corta o eixo y',
    },
  ]
}

function perguntasQuadratica(f: Extract<Funcao, { tipo: 'quadratica' }>): Pergunta[] {
  const c = caracteristicas(f)
  const nRaizes = c.raizes.length
  return [
    {
      id: 'a',
      enunciado: 'Qual é o sinal de a?',
      opcoes: SINAL2,
      certa: sinal(f.a),
      explicacao: f.a > 0 ? 'A parábola abre para cima, então a é positivo.' : 'A parábola abre para baixo, então a é negativo.',
      licao: 'a > 0 abre para cima; a < 0 abre para baixo',
    },
    {
      id: 'b',
      enunciado: 'Qual é o sinal de b?',
      opcoes: SINAL3,
      certa: sinal(f.b),
      explicacao:
        f.b === 0
          ? 'O vértice está exatamente sobre o eixo y, então b = 0.'
          : `No ponto onde a curva corta o eixo y, ela está ${f.b > 0 ? 'subindo' : 'descendo'} (a inclinação ali vale b), então b é ${f.b > 0 ? 'positivo' : 'negativo'}.`,
      licao: 'a inclinação da curva em x = 0 vale b: subindo → b > 0, descendo → b < 0',
    },
    {
      id: 'c',
      enunciado: 'Qual é o sinal de c?',
      opcoes: SINAL3,
      certa: sinal(f.c),
      explicacao:
        f.c === 0
          ? 'A parábola passa pela origem, então c = 0.'
          : `A curva corta o eixo y em y = ${fmt(f.c)}, e c = f(0). Então c é ${f.c > 0 ? 'positivo' : 'negativo'}.`,
      licao: 'c = f(0): onde a curva corta o eixo y',
    },
    {
      id: 'delta',
      enunciado: 'Qual é o sinal de Δ = b² − 4ac?',
      opcoes: SINAL3,
      certa: sinal(c.delta as number),
      explicacao:
        nRaizes === 2
          ? 'A parábola corta o eixo x em dois pontos (duas raízes), então Δ > 0.'
          : nRaizes === 1
            ? 'A parábola só toca o eixo x em um ponto (raiz dupla), então Δ = 0.'
            : 'A parábola não toca o eixo x (nenhuma raiz real), então Δ < 0.',
      licao: 'Δ > 0: duas raízes; Δ = 0: uma raiz; Δ < 0: nenhuma raiz real',
    },
  ]
}

function perguntasExponencial(f: Extract<Funcao, { tipo: 'exponencial' }>): Pergunta[] {
  return [
    {
      id: 'base',
      enunciado: 'A base é maior ou menor que 1?',
      opcoes: [
        { valor: '>', rotulo: 'maior que 1' },
        { valor: '<', rotulo: 'menor que 1 (e positiva)' },
      ],
      certa: f.base > 1 ? '>' : '<',
      explicacao:
        (f.a > 0) === (f.base > 1)
          ? 'A curva cresce da esquerda para a direita; com a positivo isso quer dizer base > 1 (e, com a negativo, base < 1).'
          : 'A curva decresce da esquerda para a direita; com a positivo isso quer dizer base < 1 (e, com a negativo, base > 1).',
      licao: 'base > 1 com a > 0 cresce; 0 < base < 1 com a > 0 decresce; a < 0 inverte',
    },
    {
      id: 'a',
      enunciado: 'A curva está acima ou abaixo da assíntota?',
      opcoes: [
        { valor: '+', rotulo: 'acima (a > 0)' },
        { valor: '-', rotulo: 'abaixo (a < 0)' },
      ],
      certa: sinal(f.a),
      explicacao: f.a > 0 ? 'A curva fica acima da assíntota, então a > 0.' : 'A curva fica abaixo da assíntota, então a < 0.',
      licao: 'em a·bˣ + k, a diz de que lado da assíntota y = k a curva fica',
    },
    {
      id: 'k',
      enunciado: 'Qual é o sinal de k (a posição da assíntota)?',
      opcoes: SINAL3,
      certa: sinal(f.k),
      explicacao:
        f.k === 0
          ? 'A assíntota é o próprio eixo x (y = 0), então k = 0.'
          : `A assíntota está em y = ${fmt(f.k)}, ${f.k > 0 ? 'acima' : 'abaixo'} do eixo x, então k é ${f.k > 0 ? 'positivo' : 'negativo'}.`,
      licao: 'a assíntota horizontal é y = k',
    },
  ]
}

function perguntasLogaritmica(f: Extract<Funcao, { tipo: 'logaritmica' }>): Pergunta[] {
  const raiz = caracteristicas(f).raizes[0] as number
  const cmp = Math.abs(raiz - 1) < 1e-9 ? '=' : raiz > 1 ? '>' : '<'
  return [
    {
      id: 'crescimento',
      enunciado: 'A função é crescente ou decrescente?',
      opcoes: [
        { valor: 'crescente', rotulo: 'crescente' },
        { valor: 'decrescente', rotulo: 'decrescente' },
      ],
      certa: caracteristicas(f).crescimento,
      explicacao: `Da esquerda para a direita a curva ${f.a > 0 ? 'sobe' : 'desce'}, então é ${f.a > 0 ? 'crescente' : 'decrescente'}.`,
      licao: 'a·log₂(x): a > 0 cresce; a < 0 decresce',
    },
    {
      id: 'raiz',
      enunciado: 'Onde a curva corta o eixo x (a raiz) em relação a x = 1?',
      opcoes: [
        { valor: '>', rotulo: 'depois de x = 1' },
        { valor: '=', rotulo: 'exatamente em x = 1' },
        { valor: '<', rotulo: 'antes de x = 1 (entre 0 e 1)' },
      ],
      certa: cmp,
      explicacao: `A curva corta o eixo x em x ≈ ${fmt(raiz)}, ${cmp === '=' ? 'exatamente em 1' : cmp === '>' ? 'depois de 1' : 'antes de 1'}. Lembre que o logaritmo puro, log(1) = 0, corta o eixo x em x = 1, e o k desloca isso.`,
      licao: 'log(1) = 0: sem deslocamento vertical (k = 0), a raiz é x = 1',
    },
  ]
}

function sortearAlvo(rng: Rng, nivel: Nivel): Funcao {
  if (nivel === 1) {
    return { tipo: 'afim', a: escolher(rng, [-2, -1, -0.5, 0.5, 1, 2]), b: sortear(rng, -4, 4) }
  }
  if (nivel === 2) {
    const a = escolher(rng, [-2, -1, -0.5, 0.5, 1, 2])
    const h = sortear(rng, -3, 3)
    const k = sortear(rng, -4, 4)
    return { tipo: 'quadratica', a, b: -2 * a * h, c: a * h * h + k }
  }
  if (rng() < 0.55) {
    const par = escolher(rng, [
      { a: 1, base: 2 },
      { a: 2, base: 2 },
      { a: -1, base: 2 },
      { a: 1, base: 3 },
      { a: 1, base: 0.5 },
    ])
    return { tipo: 'exponencial', ...par, k: sortear(rng, -3, 3) }
  }
  return { tipo: 'logaritmica', a: escolher(rng, [1, 2, -1, -2]), base: 2, k: sortear(rng, -2, 2) }
}

function visivel(f: Funcao, j: Janela): boolean {
  if (f.tipo === 'quadratica') return f.c <= j.ymax - 2 && f.c >= j.ymin + 1
  return true
}

function perguntasDe(f: Funcao): Pergunta[] {
  const extra =
    f.tipo === 'afim'
      ? perguntasAfim(f)
      : f.tipo === 'quadratica'
        ? perguntasQuadratica(f)
        : f.tipo === 'exponencial'
          ? perguntasExponencial(f)
          : perguntasLogaritmica(f)
  return [perguntaTipo(f), ...extra]
}

const MOTIVOS: Record<string, string> = {
  tipo: 'tipo de função errado',
  a: 'sinal de a errado',
  b: 'sinal de b errado',
  c: 'sinal de c errado',
  delta: 'sinal de delta errado',
  base: 'base maior/menor que 1 errada',
  k: 'posição da assíntota errada',
  crescimento: 'crescimento errado',
  raiz: 'raiz errada',
}

export const detetive = {
  id: 'matematica/funcoes/detetive',
  materia: 'matematica',
  tema: 'funcoes',
  titulo: 'Detetive de gráfico',

  gerar(semente: number, nivel: Nivel): InstanciaDetetive {
    const rng = criarRng(semente * 15485863 + nivel * 7)
    for (let t = 0; t < 200; t++) {
      const alvo = sortearAlvo(rng, nivel)
      const janela = JANELAS[alvo.tipo]
      if (!visivel(alvo, janela)) continue
      return { semente, nivel, alvo, janela, perguntas: perguntasDe(alvo) }
    }
    throw new Error('não foi possível gerar uma instância válida')
  },

  corrigir(inst: InstanciaDetetive, resposta: RespostaDetetive): Correcao {
    const erradas = inst.perguntas.filter((p) => resposta[p.id] !== p.certa)
    const acertos = inst.perguntas.length - erradas.length
    const parcial = acertos / inst.perguntas.length
    const acertou = Object.fromEntries(inst.perguntas.map((p) => [p.id, resposta[p.id] === p.certa]))
    if (erradas.length === 0) {
      return { correto: true, parcial: 1, feedback: 'Todas certas! Você leu o gráfico direitinho.', destaque: { acertou } }
    }
    const primeira = erradas[0] as Pergunta
    const frases = erradas.map((p) =>
      resposta[p.id] === undefined ? `Falta responder: ${p.enunciado}` : `${p.enunciado} ${p.explicacao}`,
    )
    return {
      correto: false,
      parcial,
      feedback: frases.join(' '),
      motivo: MOTIVOS[primeira.id] ?? 'leitura do gráfico errada',
      licao: primeira.licao,
      destaque: { acertou },
    }
  },

  dicas(inst: InstanciaDetetive): string[] {
    return [
      'Comece pelo formato: reta, parábola, curva que encosta numa linha ou curva que só existe para x > 0.',
      inst.alvo.tipo === 'quadratica'
        ? 'Para o sinal de b, olhe a inclinação da curva exatamente onde ela cruza o eixo y.'
        : 'Procure onde a curva corta os eixos e para onde ela vai da esquerda para a direita.',
      `A fórmula é f(x) = ${formulaTexto(inst.alvo).replace(/\*/g, '·')}. Compare cada coeficiente com o que você vê.`,
    ]
  },

  explicar(inst: InstanciaDetetive): string {
    return `A função é f(x) = ${formulaTexto(inst.alvo).replace(/\*/g, '·')} (${NOMES_FAMILIA[inst.alvo.tipo].toLowerCase()}). ${inst.perguntas.map((p) => p.explicacao).join(' ')}`
  },
} satisfies Desafio<InstanciaDetetive, RespostaDetetive>
