import { criarRng, type Rng } from '@/lib/rng'
import { R } from './calculo'

/**
 * Colisões entre partículas A e B numa caixa 2D. Cada colisão A–B é efetiva se a energia cinética relativa
 * (em kJ/mol, escala didática) for maior ou igual à energia de ativação: então A + B → C.
 * Com velocidades gaussianas de variância R·T por componente, a energia relativa é exponencial de média R·T,
 * e a fração de colisões efetivas é exp(−Ea/RT), como na teoria das colisões.
 */

export type Tipo = 'A' | 'B' | 'C'

export interface Particula {
  x: number
  y: number
  vx: number
  vy: number
  tipo: Tipo
}

export interface Parametros {
  /** temperatura em K */
  T: number
  /** energia de ativação em kJ/mol */
  ea: number
  nA: number
  nB: number
  /** com catalisador a barreira cai em 40 % */
  catalisador: boolean
}

export interface Estado {
  particulas: Particula[]
  t: number
  /** colisões A–B (efetivas ou não) e efetivas, acumuladas */
  colisoes: number
  efetivas: number
  /** [t, nA, nB, nC] guardado a cada 0,25 s */
  serie: [number, number, number, number][]
  rng: Rng
  proximoRegistro: number
}

export const LADO = 100
export const RAIO = 3
/** converte velocidade (√(J/mol)) em unidades de caixa por segundo: ≈ 30 unidades/s a 300 K */
const ESCALA_ESPACO = 0.6
/** desvio padrão de cada componente da velocidade, em unidades onde ½ μ v² está em J/mol */
export const sigma = (T: number) => Math.sqrt(R * T)

/** Sorteio gaussiano (Box–Muller) a partir do gerador reproduzível. */
function gauss(rng: Rng): number {
  const u = Math.max(1e-12, rng())
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export const eaEfetiva = (p: Pick<Parametros, 'ea' | 'catalisador'>) => (p.catalisador ? p.ea * 0.6 : p.ea)

export function criarEstado(p: Parametros, semente: number): Estado {
  const rng = criarRng(semente)
  const s = sigma(p.T)
  const nova = (tipo: Tipo): Particula => ({
    x: RAIO + rng() * (LADO - 2 * RAIO),
    y: RAIO + rng() * (LADO - 2 * RAIO),
    vx: gauss(rng) * s,
    vy: gauss(rng) * s,
    tipo,
  })
  const particulas = [...Array.from({ length: p.nA }, () => nova('A')), ...Array.from({ length: p.nB }, () => nova('B'))]
  return { particulas, t: 0, colisoes: 0, efetivas: 0, serie: [[0, p.nA, p.nB, 0]], rng, proximoRegistro: 0.25 }
}

/** energia cinética relativa de duas partículas de mesma massa unitária (μ = ½), em J/mol */
export function energiaRelativa(a: Particula, b: Particula): number {
  const dvx = a.vx - b.vx
  const dvy = a.vy - b.vy
  return 0.25 * (dvx * dvx + dvy * dvy)
}

export const contar = (e: Estado, tipo: Tipo) => e.particulas.filter((p) => p.tipo === tipo).length

/** Um passo de dt segundos (as velocidades estão em √(J/mol); ESCALA_ESPACO as leva para unidades da caixa). */
export function passo(e: Estado, p: Parametros, dt: number): void {
  const ea = eaEfetiva(p) * 1000
  // movimento e paredes
  for (const q of e.particulas) {
    q.x += q.vx * dt * ESCALA_ESPACO
    q.y += q.vy * dt * ESCALA_ESPACO
    if (q.x < RAIO) {
      q.x = 2 * RAIO - q.x
      q.vx = Math.abs(q.vx)
    } else if (q.x > LADO - RAIO) {
      q.x = 2 * (LADO - RAIO) - q.x
      q.vx = -Math.abs(q.vx)
    }
    if (q.y < RAIO) {
      q.y = 2 * RAIO - q.y
      q.vy = Math.abs(q.vy)
    } else if (q.y > LADO - RAIO) {
      q.y = 2 * (LADO - RAIO) - q.y
      q.vy = -Math.abs(q.vy)
    }
  }
  // colisões A–B
  const aa = e.particulas.filter((q) => q.tipo === 'A')
  const bb = e.particulas.filter((q) => q.tipo === 'B')
  const consumidos = new Set<Particula>()
  const novos: Particula[] = []
  for (const a of aa) {
    if (consumidos.has(a)) continue
    for (const b of bb) {
      if (consumidos.has(b)) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d2 = dx * dx + dy * dy
      if (d2 >= (2 * RAIO) ** 2 || d2 === 0) continue
      const vRelNormal = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy
      if (vRelNormal >= 0) continue // já estão se afastando: mesma colisão
      e.colisoes++
      if (energiaRelativa(a, b) >= ea) {
        e.efetivas++
        consumidos.add(a)
        consumidos.add(b)
        novos.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2, tipo: 'C' })
        break
      }
      // colisão elástica entre massas iguais: troca as componentes normais
      const d = Math.sqrt(d2)
      const nx = dx / d
      const ny = dy / d
      const dv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
      a.vx += dv * nx
      a.vy += dv * ny
      b.vx -= dv * nx
      b.vy -= dv * ny
      break
    }
  }
  if (consumidos.size) e.particulas = [...e.particulas.filter((q) => !consumidos.has(q)), ...novos]
  e.t += dt
  if (e.t >= e.proximoRegistro - 1e-9) {
    e.serie.push([Math.round(e.t * 100) / 100, contar(e, 'A'), contar(e, 'B'), contar(e, 'C')])
    e.proximoRegistro += 0.25
  }
}

/** Roda a simulação por `segundos` simulados, em passos fixos. */
export function rodar(e: Estado, p: Parametros, segundos: number, dt = 1 / 60): void {
  const n = Math.round(segundos / dt)
  for (let i = 0; i < n; i++) passo(e, p, dt)
}

/** Energia relativa sorteada diretamente de velocidades gaussianas, para conferir a distribuição de energias. */
export function sortearEnergias(T: number, n: number, semente: number): number[] {
  const rng = criarRng(semente)
  const s = sigma(T)
  const saida: number[] = []
  for (let i = 0; i < n; i++) {
    const a: Particula = { x: 0, y: 0, vx: gauss(rng) * s, vy: gauss(rng) * s, tipo: 'A' }
    const b: Particula = { x: 0, y: 0, vx: gauss(rng) * s, vy: gauss(rng) * s, tipo: 'B' }
    saida.push(energiaRelativa(a, b))
  }
  return saida
}
