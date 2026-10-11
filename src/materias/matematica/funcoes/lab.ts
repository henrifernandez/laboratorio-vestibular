export interface PontoXY {
  x: number
  y: number
}

/** Bisseção entre a e b, onde h troca de sinal. */
function bissecao(h: (x: number) => number, a: number, b: number): number {
  let [lo, hi] = [a, b]
  let hlo = h(lo)
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const hm = h(mid)
    if (hm === 0) return mid
    if (Math.sign(hm) === Math.sign(hlo)) {
      lo = mid
      hlo = hm
    } else hi = mid
  }
  return (lo + hi) / 2
}

/** Raízes de h em [xmin, xmax]: trocas de sinal (com refino) e pontos onde a curva só encosta no zero. */
export function raizesNumericas(h: (x: number) => number, xmin: number, xmax: number, n = 2000): number[] {
  const passo = (xmax - xmin) / n
  const raizes: number[] = []
  const juntar = (x: number) => {
    if (!raizes.some((r) => Math.abs(r - x) < passo * 2)) raizes.push(x)
  }
  let xa = xmin
  let ya = h(xa)
  for (let i = 1; i <= n; i++) {
    const xb = xmin + i * passo
    const yb = h(xb)
    if (Number.isFinite(ya) && Number.isFinite(yb)) {
      if (ya === 0) juntar(xa)
      else if (Math.sign(ya) !== Math.sign(yb) && yb !== 0) {
        // salto de assíntota (valores enormes de sinais opostos) não conta
        if (Math.abs(ya) < 1e6 && Math.abs(yb) < 1e6 && Math.abs(ya - yb) < 1e3) juntar(bissecao(h, xa, xb))
      }
      // encosta no zero sem trocar de sinal: mínimo local muito perto de zero
      const xc = xb + passo
      const yc = h(xc)
      if (Number.isFinite(yc) && Math.abs(yb) < Math.abs(ya) && Math.abs(yb) <= Math.abs(yc) && Math.abs(yb) < 1e-5 && Math.sign(ya) === Math.sign(yc)) {
        juntar(xb)
      }
    }
    xa = xb
    ya = yb
  }
  return raizes.sort((p, q) => p - q)
}

/** Pontos onde as curvas f e g se cruzam, dentro de [xmin, xmax]. */
export function interseccoes(f: (x: number) => number, g: (x: number) => number, xmin: number, xmax: number): PontoXY[] {
  const h = (x: number) => f(x) - g(x)
  return raizesNumericas(h, xmin, xmax).map((x) => ({ x, y: f(x) }))
}
