import { criarRng, escolher, sortear, type Rng } from '@/lib/rng'
import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { equivalentes } from './expressao'
import type { Janela, Ponto } from './esboce'
import { JANELAS } from './janelas'
import { avaliar, formulaTexto, type Funcao } from './modelo'

export interface InstanciaFormula {
  semente: number
  nivel: Nivel
  alvo: Funcao
  /** pontos de coordenadas inteiras marcados no gráfico */
  pontos: Ponto[]
  janela: Janela
  dominio: { min: number; max: number }
}

export type RespostaFormula = string

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

function sortearAlvo(rng: Rng, nivel: Nivel): Funcao {
  if (nivel === 1) {
    let a = 0
    while (a === 0) a = sortear(rng, -3, 3)
    return { tipo: 'afim', a, b: sortear(rng, -4, 4) }
  }
  if (nivel === 2) {
    const a = escolher(rng, [-2, -1, 1, 2])
    const h = sortear(rng, -2, 3)
    const k = sortear(rng, -3, 3)
    return { tipo: 'quadratica', a, b: -2 * a * h, c: a * h * h + k }
  }
  if (rng() < 0.5) {
    const par = escolher(rng, [
      { a: 1, base: 2 },
      { a: 2, base: 2 },
      { a: -1, base: 2 },
      { a: 1, base: 3 },
      { a: 1, base: 0.5 },
    ])
    return { tipo: 'exponencial', ...par, k: sortear(rng, -2, 2) }
  }
  return { tipo: 'logaritmica', a: escolher(rng, [1, 2, -1, -2]), base: 2, k: sortear(rng, -2, 2) }
}

function pontosInteiros(alvo: Funcao, janela: Janela): Ponto[] {
  const todos: Ponto[] = []
  for (let x = Math.ceil(janela.xmin); x <= janela.xmax; x++) {
    const y = avaliar(alvo, x)
    if (Number.isFinite(y) && Math.abs(y - Math.round(y)) < 1e-9 && y >= janela.ymin && y <= janela.ymax) {
      todos.push({ x, y: Math.round(y) })
    }
  }
  if (todos.length <= 4) return todos
  // 4 pontos espalhados pelo conjunto
  return [0, 1, 2, 3].map((i) => todos[Math.round((i * (todos.length - 1)) / 3)] as Ponto)
}

function dominioDe(alvo: Funcao): { min: number; max: number } {
  return alvo.tipo === 'logaritmica' ? { min: 0.1, max: 10 } : { min: -4, max: 4 }
}

const DICAS_FAMILIA: Record<Funcao['tipo'], [string, string]> = {
  afim: [
    'A curva é uma reta? Então a fórmula é do tipo a·x + b.',
    'b é a altura onde a reta corta o eixo y. a é quanto y muda quando x aumenta 1.',
  ],
  quadratica: [
    'A curva é uma parábola? Então a fórmula é do tipo a·x² + b·x + c, ou a·(x − h)² + k.',
    'O vértice dá h e k na forma a·(x − h)² + k. Use outro ponto para achar a.',
  ],
  exponencial: [
    'A curva encosta numa linha horizontal e cresce (ou decresce) cada vez mais rápido? É do tipo a·bˣ + k.',
    'A linha horizontal que a curva não toca é y = k. Use dois pontos para achar a e b.',
  ],
  logaritmica: [
    'A curva existe só para x > 0 e cresce cada vez mais devagar? É do tipo a·log(x, 2) + k.',
    'Todo logaritmo vale 0 em x = 1, então f(1) = k. Use o ponto de x = 2 para achar a.',
  ],
}

export const formula = {
  id: 'matematica/funcoes/formula',
  materia: 'matematica',
  tema: 'funcoes',
  titulo: 'Qual é a fórmula',

  gerar(semente: number, nivel: Nivel): InstanciaFormula {
    const rng = criarRng(semente * 104729 + nivel * 31)
    for (let t = 0; t < 100; t++) {
      const alvo = sortearAlvo(rng, nivel)
      const janela = JANELAS[alvo.tipo]
      const pontos = pontosInteiros(alvo, janela)
      const minimo = alvo.tipo === 'afim' ? 2 : 3
      if (pontos.length >= minimo) return { semente, nivel, alvo, pontos, janela, dominio: dominioDe(alvo) }
    }
    throw new Error('não foi possível gerar uma instância válida')
  },

  corrigir(inst: InstanciaFormula, resposta: RespostaFormula): Correcao {
    const alvoFn = (x: number) => avaliar(inst.alvo, x)
    const eq = equivalentes(resposta, alvoFn, inst.dominio)
    if (eq.erro || !eq.fn) {
      return {
        correto: false,
        feedback: `${eq.erro ?? 'Não consegui entender a fórmula.'} Exemplos: 2(x-1)^2 + 3, 2^x - 1, log(x, 2).`,
        motivo: 'fórmula mal escrita',
        licao: 'escreva usando x, ^ para potência, e log(x, base) para logaritmo',
      }
    }
    const destaque = { alvo: inst.alvo, curva: eq.fn }
    if (eq.ok) return { correto: true, parcial: 1, feedback: 'Isso! Sua fórmula bate com o gráfico em todos os pontos testados.', destaque }

    const erradosPontos = inst.pontos.filter((p) => {
      const v = eq.fn!(p.x)
      return !Number.isFinite(v) || Math.abs(v - p.y) > 1e-6
    })
    const acertos = inst.pontos.length - erradosPontos.length
    const parcial = acertos / inst.pontos.length

    if (erradosPontos.length === 0) {
      return {
        correto: false,
        parcial: 0.9,
        feedback:
          'Sua fórmula passa pelos pontos marcados, mas a curva é diferente no resto do gráfico. Confira o tipo da função (reta, parábola, exponencial, logaritmo).',
        motivo: 'tipo de função errado',
        licao: 'passar por alguns pontos não basta: o formato da curva decide o tipo da função',
        destaque,
      }
    }
    const primeiro = erradosPontos[0] as Ponto
    const obtido = eq.fn(primeiro.x)
    const quanto = Number.isFinite(obtido) ? `dá ${fmt(obtido)}` : 'não existe'
    const partes = [
      `Sua fórmula não passa pelo ponto (${primeiro.x}, ${primeiro.y}): em x = ${primeiro.x} ela ${quanto}.`,
    ]
    if (acertos > 0) partes.push(`Ela passa por ${acertos} dos ${inst.pontos.length} pontos marcados.`)
    return {
      correto: false,
      parcial,
      feedback: partes.join(' '),
      motivo: `fórmula erra o ponto (${primeiro.x}, ${primeiro.y})`,
      licao: 'teste sua fórmula nos pontos do gráfico: substitua x e compare com y',
      destaque,
    }
  },

  dicas(inst: InstanciaFormula): string[] {
    const [d1, d2] = DICAS_FAMILIA[inst.alvo.tipo]
    const pts = inst.pontos.map((p) => `(${p.x}, ${p.y})`).join(', ')
    return [d1, d2, `Substitua os pontos ${pts} na forma geral e resolva para os coeficientes.`]
  },

  explicar(inst: InstanciaFormula): string {
    const pts = inst.pontos.map((p) => `(${p.x}, ${p.y})`).join(', ')
    return `Pelos pontos ${pts}, a função é f(x) = ${formulaTexto(inst.alvo).replace(/\*/g, '·')}. Conferindo: substituindo cada x acima nessa fórmula, você recupera o y marcado.`
  },
} satisfies Desafio<InstanciaFormula, RespostaFormula>
