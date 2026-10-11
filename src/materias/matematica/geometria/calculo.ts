export type Solido = 'prisma' | 'cilindro' | 'cone' | 'esfera' | 'piramide'

export interface Dimensoes {
  /** lado da base (pirâmide) ou um lado da base retangular (prisma) */
  a?: number
  /** outro lado da base retangular (prisma) */
  b?: number
  /** raio (cilindro, cone, esfera) */
  r?: number
  /** altura */
  h?: number
}

export const NOME_SOLIDO: Record<Solido, string> = {
  prisma: 'Prisma (paralelepípedo)',
  cilindro: 'Cilindro',
  cone: 'Cone',
  esfera: 'Esfera',
  piramide: 'Pirâmide de base quadrada',
}

const v = (x: number | undefined) => x ?? 0

export const geratriz = (r: number, h: number) => Math.hypot(r, h)
/** apótema da pirâmide de base quadrada de lado a e altura h */
export const apotema = (a: number, h: number) => Math.hypot(h, a / 2)

export function volume(s: Solido, d: Dimensoes): number {
  switch (s) {
    case 'prisma':
      return v(d.a) * v(d.b) * v(d.h)
    case 'cilindro':
      return Math.PI * v(d.r) ** 2 * v(d.h)
    case 'cone':
      return (Math.PI * v(d.r) ** 2 * v(d.h)) / 3
    case 'piramide':
      return (v(d.a) ** 2 * v(d.h)) / 3
    case 'esfera':
      return (4 / 3) * Math.PI * v(d.r) ** 3
  }
}

export function areaBases(s: Solido, d: Dimensoes): number {
  switch (s) {
    case 'prisma':
      return 2 * v(d.a) * v(d.b)
    case 'cilindro':
      return 2 * Math.PI * v(d.r) ** 2
    case 'cone':
      return Math.PI * v(d.r) ** 2
    case 'piramide':
      return v(d.a) ** 2
    case 'esfera':
      return 0
  }
}

export function areaLateral(s: Solido, d: Dimensoes): number {
  switch (s) {
    case 'prisma':
      return 2 * (v(d.a) + v(d.b)) * v(d.h)
    case 'cilindro':
      return 2 * Math.PI * v(d.r) * v(d.h)
    case 'cone':
      return Math.PI * v(d.r) * geratriz(v(d.r), v(d.h))
    case 'piramide':
      return 2 * v(d.a) * apotema(v(d.a), v(d.h))
    case 'esfera':
      return 4 * Math.PI * v(d.r) ** 2
  }
}

export const areaTotal = (s: Solido, d: Dimensoes) => (s === 'esfera' ? 4 * Math.PI * v(d.r) ** 2 : areaLateral(s, d) + areaBases(s, d))

// ---------------------------------------------------------------- triângulos

export interface Pt {
  x: number
  y: number
}

export const hipotenusa = (a: number, b: number) => Math.hypot(a, b)
export const catetoDado = (hip: number, cateto: number) => Math.sqrt(hip * hip - cateto * cateto)

export function ehRetangulo(lados: readonly [number, number, number], tol = 1e-9): boolean {
  const [a, b, c] = [...lados].sort((x, y) => x - y) as [number, number, number]
  return Math.abs(a * a + b * b - c * c) <= tol * Math.max(1, c * c)
}

/** Lados opostos a A, B e C (a = |BC|, b = |CA|, c = |AB|). */
export function ladosTriangulo(A: Pt, B: Pt, C: Pt): [number, number, number] {
  return [Math.hypot(C.x - B.x, C.y - B.y), Math.hypot(A.x - C.x, A.y - C.y), Math.hypot(B.x - A.x, B.y - A.y)]
}

/** Ângulos internos em A, B e C, em graus (lei dos cossenos). */
export function angulosTriangulo(A: Pt, B: Pt, C: Pt): [number, number, number] {
  const [a, b, c] = ladosTriangulo(A, B, C)
  const ang = (x: number, y: number, z: number) => (Math.acos(Math.max(-1, Math.min(1, (y * y + z * z - x * x) / (2 * y * z)))) * 180) / Math.PI
  return [ang(a, b, c), ang(b, a, c), ang(c, a, b)]
}

export const razaoAreas = (razaoSemelhanca: number) => razaoSemelhanca * razaoSemelhanca
