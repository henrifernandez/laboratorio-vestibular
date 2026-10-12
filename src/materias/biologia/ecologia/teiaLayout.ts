import { camada, type Teia } from './calculo'

/** Largura e altura do desenho (unidades do viewBox) e dos retângulos de cada espécie. */
export const LARGURA = 348
export const NO_L = 80
export const NO_A = 58
export const ESPACO_CAMADAS = 96
const MARGEM = 4
const TOPO = 8

export interface PosicaoNo {
  id: string
  /** canto superior esquerdo */
  x: number
  y: number
  camada: number
}

export interface LayoutTeia {
  largura: number
  altura: number
  nos: PosicaoNo[]
  /** setas presa → predador, com os pontos de saída (topo da presa) e de chegada (base do predador) */
  setas: { de: string; para: string; x1: number; y1: number; x2: number; y2: number }[]
}

/**
 * Posiciona as espécies em camadas (produtores embaixo, topo em cima) e reduz cruzamentos de setas
 * deslocando cada espécie para a média de posição das espécies ligadas a ela.
 */
export function layoutTeia(t: Teia): LayoutTeia {
  const camadas = new Map<string, number>(t.especies.map((e) => [e.id, camada(t, e.id)]))
  const L = Math.max(...camadas.values())
  const ordem: string[][] = Array.from({ length: L }, (_, i) => t.especies.filter((e) => camadas.get(e.id) === i + 1).map((e) => e.id))
  const centro = (lista: string[], id: string) => {
    const m = lista.length
    const slot = (LARGURA - 2 * MARGEM) / m
    return MARGEM + (lista.indexOf(id) + 0.5) * slot
  }
  const xDe = (id: string) => centro(ordem[(camadas.get(id) as number) - 1] as string[], id)
  const vizinhos = (id: string) => t.come.flatMap(([q, a]) => (q === id ? [a] : a === id ? [q] : []))

  for (let volta = 0; volta < 8; volta++) {
    const indices = volta % 2 === 0 ? [...ordem.keys()] : [...ordem.keys()].reverse()
    for (const i of indices) {
      const lista = ordem[i] as string[]
      const bary = new Map<string, number>()
      for (const id of lista) {
        const vs = vizinhos(id)
        bary.set(id, vs.length ? vs.reduce((s, v) => s + xDe(v), 0) / vs.length : xDe(id))
      }
      ordem[i] = [...lista].sort((a, b) => (bary.get(a) as number) - (bary.get(b) as number))
    }
  }

  const yDe = (c: number) => TOPO + (L - c) * ESPACO_CAMADAS
  const nos: PosicaoNo[] = ordem.flatMap((lista, i) => lista.map((id) => ({ id, x: centro(lista, id) - NO_L / 2, y: yDe(i + 1), camada: i + 1 })))
  const pos = new Map(nos.map((n) => [n.id, n]))

  // espalha as pontas das setas ao longo da borda de cada retângulo
  const saidas = new Map<string, string[]>() // presa → predadores
  const chegadas = new Map<string, string[]>() // predador → presas
  for (const [q, a] of t.come) {
    saidas.set(a, [...(saidas.get(a) ?? []), q])
    chegadas.set(q, [...(chegadas.get(q) ?? []), a])
  }
  const xOrd = (id: string) => (pos.get(id) as PosicaoNo).x
  const desloc = (lista: string[], id: string) => {
    const ordenada = [...lista].sort((a, b) => xOrd(a) - xOrd(b))
    const k = ordenada.length
    return k === 1 ? 0 : ((ordenada.indexOf(id) + 0.5) / k - 0.5) * (NO_L - 18)
  }
  const setas = t.come.map(([q, a]) => {
    const pa = pos.get(a) as PosicaoNo
    const pq = pos.get(q) as PosicaoNo
    return {
      de: a,
      para: q,
      x1: pa.x + NO_L / 2 + desloc(saidas.get(a) as string[], q),
      y1: pa.y,
      x2: pq.x + NO_L / 2 + desloc(chegadas.get(q) as string[], a),
      y2: pq.y + NO_A,
    }
  })
  return { largura: LARGURA, altura: TOPO + (L - 1) * ESPACO_CAMADAS + NO_A + TOPO, nos, setas }
}

/** Quebra o nome em até duas linhas, no hífen ou no espaço que equilibra melhor o comprimento. */
export function quebrarNome(nome: string, maximo = 12): string[] {
  if (nome.length <= maximo) return [nome]
  const cortes: number[] = []
  for (let i = 0; i < nome.length; i++) {
    if (nome[i] === '-') cortes.push(i + 1)
    else if (nome[i] === ' ') cortes.push(i)
  }
  if (cortes.length === 0) return [nome]
  const melhor = cortes.reduce((m, c) => (Math.max(c, nome.length - c) < Math.max(m, nome.length - m) ? c : m))
  return [nome.slice(0, melhor).trim(), nome.slice(melhor).trim()]
}
