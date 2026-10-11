export interface Celula {
  x: number
  y: number
}

interface Orientacao {
  topo: number
  fundo: number
  norte: number
  sul: number
  leste: number
  oeste: number
}

const chave = (c: Celula) => `${c.x},${c.y}`

/** Rola o cubo uma casa na direção dada; o fundo da nova orientação é a face que toca a nova casa. */
function rolar(o: Orientacao, dx: number, dy: number): Orientacao {
  if (dx === 1) return { ...o, topo: o.oeste, fundo: o.leste, leste: o.topo, oeste: o.fundo }
  if (dx === -1) return { ...o, topo: o.leste, fundo: o.oeste, oeste: o.topo, leste: o.fundo }
  if (dy === 1) return { ...o, topo: o.sul, fundo: o.norte, norte: o.topo, sul: o.fundo }
  return { ...o, topo: o.norte, fundo: o.sul, sul: o.topo, norte: o.fundo }
}

/**
 * Seis quadrados formam um cubo dobrado? Rola-se um cubo sobre a figura: cada quadrado recebe a face
 * que encosta nele. Só é planificação se as seis faces forem diferentes.
 */
export function ehPlanificacaoDeCubo(celulas: readonly Celula[]): boolean {
  if (celulas.length !== 6) return false
  const mapa = new Set(celulas.map(chave))
  if (mapa.size !== 6) return false
  // um bloco 2×2 nunca dobra em cubo
  for (const { x, y } of celulas) {
    if (mapa.has(chave({ x: x + 1, y })) && mapa.has(chave({ x, y: y + 1 })) && mapa.has(chave({ x: x + 1, y: y + 1 }))) return false
  }

  const inicio = celulas[0] as Celula
  const faces = new Map<string, number>([[chave(inicio), 1]])
  const visitadas = new Set<string>([chave(inicio)])
  const pilha: { c: Celula; o: Orientacao }[] = [{ c: inicio, o: { topo: 0, fundo: 1, norte: 2, sul: 3, leste: 4, oeste: 5 } }]
  while (pilha.length) {
    const { c, o } = pilha.pop() as { c: Celula; o: Orientacao }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const viz = { x: c.x + dx, y: c.y + dy }
      const k = chave(viz)
      if (!mapa.has(k) || visitadas.has(k)) continue
      visitadas.add(k)
      const novo = rolar(o, dx, dy)
      faces.set(k, novo.fundo)
      pilha.push({ c: viz, o: novo })
    }
  }
  return visitadas.size === 6 && new Set(faces.values()).size === 6
}

// ---------------------------------------------------------------- formas

export function normalizar(cs: readonly Celula[]): Celula[] {
  const mx = Math.min(...cs.map((c) => c.x))
  const my = Math.min(...cs.map((c) => c.y))
  return cs.map((c) => ({ x: c.x - mx, y: c.y - my })).sort((a, b) => a.y - b.y || a.x - b.x)
}
const girar = (cs: Celula[]) => cs.map(({ x, y }) => ({ x: -y, y: x }))
const espelhar = (cs: Celula[]) => cs.map(({ x, y }) => ({ x: -x, y }))
const txt = (cs: readonly Celula[]) => normalizar(cs).map(chave).join(';')

/** Forma canônica a menos de translação, rotação e reflexão. */
export function formaCanonica(cs: readonly Celula[]): string {
  let atual = [...cs]
  const todas: string[] = []
  for (let e = 0; e < 2; e++) {
    for (let r = 0; r < 4; r++) {
      todas.push(txt(atual))
      atual = girar(atual)
    }
    atual = espelhar(atual)
  }
  return todas.sort()[0] as string
}

/** Todos os hexaminós fixos (a menos de translação): 216 formas. */
export function hexaminosFixos(): Celula[][] {
  let atuais = new Map<string, Celula[]>([[txt([{ x: 0, y: 0 }]), [{ x: 0, y: 0 }]]])
  for (let n = 2; n <= 6; n++) {
    const prox = new Map<string, Celula[]>()
    for (const f of atuais.values()) {
      const ocupadas = new Set(f.map(chave))
      for (const c of f) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const novo = { x: c.x + dx, y: c.y + dy }
          if (ocupadas.has(chave(novo))) continue
          const g = normalizar([...f, novo])
          prox.set(txt(g), g)
        }
      }
    }
    atuais = prox
  }
  return [...atuais.values()]
}

let cache: { validas: Celula[][]; invalidas: Celula[][] } | null = null

/** As 35 formas livres de seis quadrados, separadas em: 11 que formam cubo e 24 que não formam. */
function separar() {
  if (cache) return cache
  const livres = new Map<string, Celula[]>()
  for (const h of hexaminosFixos()) {
    const k = formaCanonica(h)
    if (!livres.has(k)) livres.set(k, normalizar(h))
  }
  const todas = [...livres.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
  cache = { validas: todas.filter(ehPlanificacaoDeCubo), invalidas: todas.filter((f) => !ehPlanificacaoDeCubo(f)) }
  return cache
}

export const redesValidas = () => separar().validas
export const redesInvalidas = () => separar().invalidas
