import { criarRng, escolher, type Rng } from '@/lib/rng'
import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'

export type Movimento = 'cima' | 'baixo' | 'direita' | 'esquerda' | 'refletirX' | 'refletirY' | 'esticar'

export const MOVIMENTOS: { id: Movimento; rotulo: string; descricao: string }[] = [
  { id: 'cima', rotulo: 'Subir 1', descricao: 'sobe o gráfico 1 unidade' },
  { id: 'baixo', rotulo: 'Descer 1', descricao: 'desce o gráfico 1 unidade' },
  { id: 'direita', rotulo: 'Direita 1', descricao: 'desloca o gráfico 1 unidade para a direita' },
  { id: 'esquerda', rotulo: 'Esquerda 1', descricao: 'desloca o gráfico 1 unidade para a esquerda' },
  { id: 'refletirX', rotulo: 'Refletir no eixo x', descricao: 'vira o gráfico de cabeça para baixo' },
  { id: 'refletirY', rotulo: 'Refletir no eixo y', descricao: 'espelha o gráfico da esquerda para a direita' },
  { id: 'esticar', rotulo: 'Esticar ×2', descricao: 'dobra a altura do gráfico' },
]

export type BaseId = 'quadrado' | 'exponencial' | 'logaritmo'

export const BASES: Record<BaseId, { nome: string; tex: string; fn: (x: number) => number }> = {
  quadrado: { nome: 'x²', tex: 'x^{2}', fn: (x) => x * x },
  exponencial: { nome: '2ˣ', tex: '2^{x}', fn: (x) => Math.pow(2, x) },
  logaritmo: { nome: 'log₂ x', tex: '\\log_{2} x', fn: (x) => (x > 0 ? Math.log2(x) : NaN) },
}

/** Aplica os movimentos, em ordem, ao gráfico da função base. Devolve a nova função. */
export function aplicarMovimentos(base: (x: number) => number, movs: readonly Movimento[]): (x: number) => number {
  let ax = 1
  let tx = 0
  let ay = 1
  let ty = 0
  for (const m of movs) {
    switch (m) {
      case 'cima':
        ty += 1
        break
      case 'baixo':
        ty -= 1
        break
      case 'direita':
        tx += 1
        break
      case 'esquerda':
        tx -= 1
        break
      case 'refletirX':
        ay = -ay
        ty = -ty
        break
      case 'refletirY':
        ax = -ax
        tx = -tx
        break
      case 'esticar':
        ay *= 2
        ty *= 2
        break
    }
  }
  return (x) => ay * base((x - tx) / ax) + ty
}

export interface InstanciaAlvo {
  semente: number
  nivel: Nivel
  base: BaseId
  /** menor número de movimentos que chega ao alvo */
  otimo: number
  /** uma sequência mínima de movimentos */
  solucao: Movimento[]
}

export type RespostaAlvo = Movimento[]

const XS = [-3, -2, -1, -0.5, 0.5, 1, 2, 3, 4]
const assinatura = (f: (x: number) => number) => XS.map((x) => (Number.isFinite(f(x)) ? f(x).toFixed(5) : 'n')).join('|')

export function mesmaCurva(f: (x: number) => number, g: (x: number) => number): boolean {
  return assinatura(f) === assinatura(g)
}

export function estrelas(usados: number, otimo: number): 1 | 2 | 3 {
  if (usados <= otimo) return 3
  if (usados <= otimo + 1) return 2
  return 1
}

const TODOS: Movimento[] = MOVIMENTOS.map((m) => m.id)

function sequenciasAte(profundidade: number): Movimento[][] {
  let atual: Movimento[][] = [[]]
  const todas: Movimento[][] = [[]]
  for (let d = 0; d < profundidade; d++) {
    const prox: Movimento[][] = []
    for (const s of atual) for (const m of TODOS) prox.push([...s, m])
    todas.push(...prox)
    atual = prox
  }
  return todas
}
const SEQUENCIAS = sequenciasAte(3).sort((a, b) => a.length - b.length)

function menorCaminho(base: BaseId, alvoFn: (x: number) => number): Movimento[] | null {
  const f = BASES[base].fn
  for (const s of SEQUENCIAS) if (mesmaCurva(aplicarMovimentos(f, s), alvoFn)) return s
  return null
}

function sortearSequencia(rng: Rng, n: number): Movimento[] {
  const oposto: Partial<Record<Movimento, Movimento>> = { cima: 'baixo', baixo: 'cima', direita: 'esquerda', esquerda: 'direita' }
  const seq: Movimento[] = []
  while (seq.length < n) {
    const m = escolher(rng, TODOS)
    const ultimo = seq[seq.length - 1]
    if (ultimo && (oposto[ultimo] === m || ultimo === m && (m === 'refletirX' || m === 'refletirY'))) continue
    seq.push(m)
  }
  return seq
}

const NOME_MOV = Object.fromEntries(MOVIMENTOS.map((m) => [m.id, m.rotulo.toLowerCase()])) as Record<Movimento, string>
const un = (n: number) => `${n} ${n === 1 ? 'unidade' : 'unidades'}`

function diagnostico(usuario: (x: number) => number, alvoFn: (x: number) => number): string {
  const xs = Array.from({ length: 41 }, (_, i) => -6 + i * 0.3)
  const pares = xs.map((x) => [x, usuario(x), alvoFn(x)] as const).filter(([, u, t]) => Number.isFinite(u) && Number.isFinite(t))
  const dominioIgual = xs.every((x) => Number.isFinite(usuario(x)) === Number.isFinite(alvoFn(x)))
  const aprox = (a: number, b: number) => Math.abs(a - b) < 1e-6

  if (pares.length >= 3 && dominioIgual) {
    const d = (pares[0] as readonly [number, number, number])[1] - (pares[0] as readonly [number, number, number])[2]
    if (pares.every(([, u, t]) => aprox(u - t, d)) && Math.abs(d) > 1e-6) {
      return `Sua curva está ${un(Math.abs(Math.round(d * 100) / 100))} para ${d > 0 ? 'cima' : 'baixo'} do alvo. Faltam deslocamentos na vertical.`.replace(
        'para cima do alvo',
        'acima do alvo',
      ).replace('para baixo do alvo', 'para baixo do alvo')
    }
    if (pares.every(([, u, t]) => aprox(u, -t)) && pares.some(([, , t]) => Math.abs(t) > 1e-6)) {
      return 'Sua curva está de cabeça para baixo em relação ao alvo: falta refletir no eixo x (ou há uma reflexão a mais).'
    }
  }
  if (xs.filter((x) => Number.isFinite(usuario(-x)) && Number.isFinite(alvoFn(x))).length >= 3) {
    const ok = xs.every((x) => {
      const [u, t] = [usuario(-x), alvoFn(x)]
      return (Number.isNaN(u) && Number.isNaN(t)) || aprox(u, t)
    })
    if (ok) return 'Sua curva é o espelho do alvo da esquerda para a direita: falta refletir no eixo y (ou há uma reflexão a mais).'
  }
  for (let s = -8; s <= 8; s++) {
    if (s === 0) continue
    const casam = xs.filter((x) => Number.isFinite(usuario(x)) && Number.isFinite(alvoFn(x - s)))
    if (casam.length >= 5 && casam.every((x) => aprox(usuario(x), alvoFn(x - s)))) {
      return `Sua curva está ${un(Math.abs(s))} para a ${s > 0 ? 'direita' : 'esquerda'} do alvo.`
    }
  }
  const razoes = pares.filter(([, , t]) => Math.abs(t) > 1e-6).map(([, u, t]) => u / t)
  if (razoes.length >= 3 && razoes.every((r) => aprox(r, (razoes[0] as number))) && !aprox(razoes[0] as number, 1)) {
    return `Sua curva está ${Math.abs(razoes[0] as number) > 1 ? 'esticada demais' : 'comprimida demais'} na vertical em relação ao alvo.`
  }
  return 'Sua curva ainda não coincide com o alvo. Compare o ponto de partida da curva (vértice, cruzamento com os eixos) e veja o que falta mover.'
}

export const alvo = {
  id: 'matematica/funcoes/alvo',
  materia: 'matematica',
  tema: 'funcoes',
  titulo: 'Alvo',

  gerar(semente: number, nivel: Nivel): InstanciaAlvo {
    const rng = criarRng(semente * 86028121 + nivel * 3)
    for (let t = 0; t < 200; t++) {
      const base = nivel === 1 ? 'quadrado' : escolher(rng, ['quadrado', 'exponencial', 'logaritmo'] as const)
      const sequencia = sortearSequencia(rng, nivel)
      const alvoFn = aplicarMovimentos(BASES[base].fn, sequencia)
      const minimo = menorCaminho(base, alvoFn)
      if (!minimo || minimo.length === 0) continue // alvo igual à base: sem graça
      return { semente, nivel, base, otimo: minimo.length, solucao: minimo }
    }
    throw new Error('não foi possível gerar uma instância válida')
  },

  corrigir(inst: InstanciaAlvo, resposta: RespostaAlvo): Correcao {
    const f = BASES[inst.base].fn
    const alvoFn = aplicarMovimentos(f, inst.solucao)
    const usuarioFn = aplicarMovimentos(f, resposta)
    const destaque = { movimentos: resposta.length, otimo: inst.otimo }
    if (mesmaCurva(usuarioFn, alvoFn)) {
      const e = estrelas(resposta.length, inst.otimo)
      return {
        correto: true,
        parcial: 1,
        feedback:
          resposta.length <= inst.otimo
            ? `Alvo atingido em ${resposta.length} ${resposta.length === 1 ? 'movimento' : 'movimentos'}, o mínimo possível!`
            : `Alvo atingido em ${resposta.length} movimentos. Dá para fazer em ${inst.otimo}: tente de novo para ganhar mais estrelas.`,
        destaque: { ...destaque, estrelas: e },
      }
    }
    const msg = diagnostico(usuarioFn, alvoFn)
    return {
      correto: false,
      parcial: 0,
      feedback: msg,
      motivo: msg.includes('refletir') ? 'reflexão errada' : msg.includes('para a ') ? 'deslocamento horizontal errado' : 'deslocamento ou esticamento errado',
      licao: 'f(x) + k sobe/desce; f(x − h) vai para a direita; −f(x) vira de cabeça para baixo; f(−x) espelha',
      destaque,
    }
  },

  dicas(inst: InstanciaAlvo): string[] {
    return [
      `Compare o ponto característico da curva-base ${BASES[inst.base].nome} com o do alvo: ele foi só deslocado, ou a curva também virou?`,
      'Pense primeiro nas reflexões (de cabeça para baixo ou espelhada) e só depois nos deslocamentos.',
      `Dá para chegar em ${inst.otimo} ${inst.otimo === 1 ? 'movimento' : 'movimentos'}. Uma sequência: ${inst.solucao.map((m) => NOME_MOV[m]).join(', ')}.`,
    ]
  },

  explicar(inst: InstanciaAlvo): string {
    const passos = inst.solucao.map((m, i) => `${i + 1}. ${MOVIMENTOS.find((x) => x.id === m)?.descricao}`).join('; ')
    return `Partindo de ${BASES[inst.base].nome}, ${inst.solucao.length === 1 ? 'um movimento basta' : `${inst.solucao.length} movimentos bastam`}: ${passos}. A ordem importa quando há reflexão ou esticamento junto com deslocamento.`
  },
} satisfies Desafio<InstanciaAlvo, RespostaAlvo>
