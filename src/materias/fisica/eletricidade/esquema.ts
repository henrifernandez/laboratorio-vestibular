import type { Topologia } from './calculo'

/** Leiaute dos esquemas de circuito: onde ficam fios, componentes, bateria, nós e rótulos (unidades do SVG). */

export type Seg = [number, number, number, number]
export type Orient = 'h' | 'v'

export interface CompEsquema {
  x: number
  y: number
  orient: Orient
}

export interface Esquema {
  W: number
  H: number
  /** fios inteiros, como no desenho do circuito (antes de abrir espaço para os componentes) */
  fios: Seg[]
  comps: CompEsquema[]
  /** bateria sempre num fio vertical, com o polo + para cima */
  bateria: { x: number; y: number }
}

/** meio comprimento de cada símbolo ao longo do fio */
export const MEIO_COMP = 17
export const MEIO_BATERIA = 9

const X_BAT = 34

/** Posições de fios, componentes e bateria para cada associação. A ordem dos componentes é a de `montar` (R1, R2, ...). */
export function esquemaCircuito(topologia: Topologia, n: number): Esquema {
  if (topologia === 'serie') {
    const W = 340
    const topo = 44
    const base = n >= 4 ? 182 : 170
    const dir = 310
    const emCima = n >= 4 ? 2 : n
    const comps: CompEsquema[] = []
    for (let i = 0; i < emCima; i++) comps.push({ x: 74 + ((i + 0.5) * (dir - 84)) / emCima, y: topo, orient: 'h' })
    // na associação de quatro, os dois últimos ficam no fio de baixo, voltando para a bateria (da direita para a esquerda)
    for (let i = 0; i < n - emCima; i++) comps.push({ x: dir - 10 - ((i + 0.5) * (dir - 84)) / (n - emCima), y: base, orient: 'h' })
    return {
      W,
      H: base + (n >= 4 ? 46 : 30),
      bateria: { x: X_BAT, y: (topo + base) / 2 },
      comps,
      fios: [
        [X_BAT, topo, dir, topo],
        [dir, topo, dir, base],
        [dir, base, X_BAT, base],
        [X_BAT, base, X_BAT, topo],
      ],
    }
  }
  if (topologia === 'paralelo') {
    const ys = n <= 2 ? [44, 150] : [44, 120, 196]
    const esq = 112
    const dir = 316
    const y0 = ys[0] as number
    const y1 = ys[ys.length - 1] as number
    return {
      W: 340,
      H: y1 + 50,
      bateria: { x: X_BAT, y: (y0 + y1) / 2 },
      comps: ys.map((y) => ({ x: (esq + dir) / 2, y, orient: 'h' as const })),
      fios: [
        [X_BAT, y0, esq, y0],
        [X_BAT, y1, esq, y1],
        [X_BAT, y0, X_BAT, y1],
        [esq, y0, esq, y1],
        [dir, y0, dir, y1],
        ...ys.map((y): Seg => [esq, y, dir, y]),
      ],
    }
  }
  if (topologia === 'misto') {
    // R1 em série com (R2 ∥ R3)
    const topo = 44
    const meio = 122
    const base = 196
    const noA = 168
    const dir = 318
    return {
      W: 340,
      H: base + 20,
      bateria: { x: X_BAT, y: (topo + base) / 2 },
      comps: [
        { x: (X_BAT + noA) / 2 + 6, y: topo, orient: 'h' },
        { x: (noA + dir) / 2, y: topo, orient: 'h' },
        { x: (noA + dir) / 2, y: meio, orient: 'h' },
      ],
      fios: [
        [X_BAT, topo, dir, topo],
        [noA, topo, noA, meio],
        [noA, meio, dir, meio],
        [dir, topo, dir, base],
        [dir, base, X_BAT, base],
        [X_BAT, base, X_BAT, topo],
      ],
    }
  }
  // misto2: R1 ∥ (R2 em série com R3)
  const y0 = 44
  const y1 = 150
  const esq = 112
  const dir = 316
  return {
    W: 340,
    H: y1 + 50,
    bateria: { x: X_BAT, y: (y0 + y1) / 2 },
    comps: [
      { x: (esq + dir) / 2, y: y0, orient: 'h' },
      { x: esq + (dir - esq) * 0.28, y: y1, orient: 'h' },
      { x: esq + (dir - esq) * 0.72, y: y1, orient: 'h' },
    ],
    fios: [
      [X_BAT, y0, esq, y0],
      [X_BAT, y1, esq, y1],
      [X_BAT, y0, X_BAT, y1],
      [esq, y0, esq, y1],
      [dir, y0, dir, y1],
      [esq, y0, dir, y0],
      [esq, y1, dir, y1],
    ],
  }
}

const sobre = (s: Seg, x: number, y: number) => {
  const [x1, y1, x2, y2] = s
  if (y1 === y2) return Math.abs(y - y1) < 1e-9 && x >= Math.min(x1, x2) - 1e-9 && x <= Math.max(x1, x2) + 1e-9
  return Math.abs(x - x1) < 1e-9 && y >= Math.min(y1, y2) - 1e-9 && y <= Math.max(y1, y2) + 1e-9
}

/** Abre espaço nos fios para os símbolos: cada componente (e a bateria) interrompe o fio em que está. */
export function cortarFios(e: Esquema): Seg[] {
  const buracos = [...e.comps.map((c) => ({ x: c.x, y: c.y, meio: MEIO_COMP })), { x: e.bateria.x, y: e.bateria.y, meio: MEIO_BATERIA }]
  let fios = e.fios.map((s) => [...s] as Seg)
  for (const b of buracos) {
    const novos: Seg[] = []
    for (const s of fios) {
      if (!sobre(s, b.x, b.y)) {
        novos.push(s)
        continue
      }
      const [x1, y1, x2, y2] = s
      if (y1 === y2) {
        const [a, c] = x1 < x2 ? [x1, x2] : [x2, x1]
        if (b.x - b.meio > a) novos.push([a, y1, b.x - b.meio, y1])
        if (b.x + b.meio < c) novos.push([b.x + b.meio, y1, c, y1])
      } else {
        const [a, c] = y1 < y2 ? [y1, y2] : [y2, y1]
        if (b.y - b.meio > a) novos.push([x1, a, x1, b.y - b.meio])
        if (b.y + b.meio < c) novos.push([x1, b.y + b.meio, x1, c])
      }
    }
    fios = novos
  }
  return fios
}

/** Nós de junção: pontos onde três ou mais pedaços de fio se encontram (onde a corrente se divide ou se junta). */
export function nosDeJuncao(e: Esquema): [number, number][] {
  const pontos = new Map<string, [number, number]>()
  for (const [x1, y1, x2, y2] of e.fios) {
    pontos.set(`${x1},${y1}`, [x1, y1])
    pontos.set(`${x2},${y2}`, [x2, y2])
  }
  const nos: [number, number][] = []
  for (const [x, y] of pontos.values()) {
    // conta quantas direções saem do ponto: pontas de fio contam 1, fios que passam pelo meio contam 2
    let direcoes = 0
    for (const s of e.fios) {
      if (!sobre(s, x, y)) continue
      const [x1, y1, x2, y2] = s
      const ponta = (x1 === x && y1 === y) || (x2 === x && y2 === y)
      direcoes += ponta ? 1 : 2
    }
    if (direcoes >= 3) nos.push([x, y])
  }
  return nos
}

/** Caixas dos rótulos de um componente: nome acima; valores (até duas linhas) abaixo. Usado no desenho e nos testes. */
export function caixasRotulos(c: CompEsquema, larguras: { nome: number; linhas: number[] }) {
  const caixas: { x0: number; y0: number; x1: number; y1: number }[] = [{ x0: c.x - larguras.nome / 2, y0: c.y - 31, x1: c.x + larguras.nome / 2, y1: c.y - 19 }]
  larguras.linhas.forEach((w, k) => caixas.push({ x0: c.x - w / 2, y0: c.y + 21 + k * 12, x1: c.x + w / 2, y1: c.y + 31 + k * 12 }))
  return caixas
}

/** y da linha de base de cada rótulo (nome e valores), coerente com `caixasRotulos`. */
export const BASE_NOME = -21
export const BASE_LINHA = (k: number) => 30 + k * 12
