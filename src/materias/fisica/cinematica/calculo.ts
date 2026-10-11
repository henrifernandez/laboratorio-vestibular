/** Aceleração da gravidade usada nos exercícios (m/s²). */
export const G = 10

export interface Mov {
  x0: number
  v0: number
  a: number
}

export const posicao = (m: Mov, t: number) => m.x0 + m.v0 * t + (m.a * t * t) / 2
export const velocidade = (m: Mov, t: number) => m.v0 + m.a * t

/** Torricelli: distância percorrida até parar, v² = 2·a·Δx. */
export const distanciaFrenagem = (v0: number, desaceleracao: number) => (v0 * v0) / (2 * Math.abs(desaceleracao))

export const kmhParaMs = (kmh: number) => kmh / 3.6
export const msParaKmh = (ms: number) => ms * 3.6

export const velocidadeMedia = (m: Mov, t1: number, t2: number) => (posicao(m, t2) - posicao(m, t1)) / (t2 - t1)

export interface Encontro {
  t: number
  x: number
}

/** Instantes (t ≥ 0) em que dois móveis têm a mesma posição. */
export function encontro(A: Mov, B: Mov): Encontro[] {
  // (a_A − a_B)/2 · t² + (v_A − v_B)·t + (x_A − x_B) = 0
  const a = (A.a - B.a) / 2
  const b = A.v0 - B.v0
  const c = A.x0 - B.x0
  const raizes: number[] = []
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) raizes.push(-c / b)
  } else {
    const d = b * b - 4 * a * c
    if (d > 1e-12) raizes.push((-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a))
    else if (Math.abs(d) <= 1e-12) raizes.push(-b / (2 * a))
  }
  return raizes
    .filter((t) => t >= -1e-9)
    .sort((p, q) => p - q)
    .map((t) => ({ t, x: posicao(A, t) }))
}

// ---------------------------------------------------------------- movimento por trechos

export interface Trecho {
  dur: number
  a: number
}

export interface TrechoCalc {
  de: number
  ate: number
  a: number
  /** posição e velocidade no início do trecho */
  x0: number
  v0: number
}

export function trechos(inicio: { x0: number; v0: number }, lista: readonly Trecho[]): TrechoCalc[] {
  const saida: TrechoCalc[] = []
  let t = 0
  let x = inicio.x0
  let v = inicio.v0
  for (const tr of lista) {
    saida.push({ de: t, ate: t + tr.dur, a: tr.a, x0: x, v0: v })
    x += v * tr.dur + (tr.a * tr.dur * tr.dur) / 2
    v += tr.a * tr.dur
    t += tr.dur
  }
  return saida
}

export interface Movimento {
  duracao: number
  x: (t: number) => number
  v: (t: number) => number
  a: (t: number) => number
}

/** Movimento com aceleração constante em cada trecho (posição e velocidade contínuas). */
export function movimento(inicio: { x0: number; v0: number }, lista: readonly Trecho[]): Movimento {
  const fases = trechos(inicio, lista)
  const duracao = fases.length ? (fases[fases.length - 1] as TrechoCalc).ate : 0
  const fase = (t: number) => (fases.find((f) => t < f.ate) ?? fases[fases.length - 1]) as TrechoCalc
  return {
    duracao,
    x: (t) => {
      if (!fases.length) return inicio.x0
      const f = fase(t)
      const dt = Math.min(Math.max(t, 0), duracao) - f.de
      return f.x0 + f.v0 * dt + (f.a * dt * dt) / 2
    },
    v: (t) => {
      if (!fases.length) return inicio.v0
      const f = fase(t)
      return f.v0 + f.a * (Math.min(Math.max(t, 0), duracao) - f.de)
    },
    a: (t) => (fases.length ? fase(t).a : 0),
  }
}

// ---------------------------------------------------------------- lançamento oblíquo

const rad = (g: number) => (g * Math.PI) / 180

export const tempoDeVoo = (v0: number, angulo: number) => (2 * v0 * Math.sin(rad(angulo))) / G
export const alcance = (v0: number, angulo: number) => (v0 * v0 * Math.sin(2 * rad(angulo))) / G
export const alturaMaxima = (v0: number, angulo: number) => (v0 * Math.sin(rad(angulo))) ** 2 / (2 * G)

export interface Lancamento {
  vx: number
  vy: number
  x: (t: number) => number
  y: (t: number) => number
  vyEm: (t: number) => number
}

export function lancamento(v0: number, angulo: number): Lancamento {
  const vx = v0 * Math.cos(rad(angulo))
  const vy = v0 * Math.sin(rad(angulo))
  return { vx, vy, x: (t) => vx * t, y: (t) => vy * t - (G * t * t) / 2, vyEm: (t) => vy - G * t }
}

/** Altura da trajetória quando o projétil está na posição horizontal x: y = x·tgθ − g·x²/(2·v0²·cos²θ). */
export function alturaEmX(v0: number, angulo: number, x: number): number {
  const c = Math.cos(rad(angulo))
  return x * Math.tan(rad(angulo)) - (G * x * x) / (2 * v0 * v0 * c * c)
}
