/**
 * Equilíbrio dinâmico de A ⇌ B (reações elementares de 1ª ordem nos dois sentidos):
 * v direta = k1·[A], v inversa = k2·[B]. Com [A] + [B] constante, a solução é exponencial.
 */

export const K1 = 1.4
export const K2 = 0.6
/** concentração total (mol/L): [A] + [B] */
export const TOTAL = 1
/** fim do eixo do tempo nos gráficos (s) */
export const T_MAX = 4

export interface EstadoAB {
  a: number
  b: number
  /** velocidade da reação direta, A → B (mol/(L·s)) */
  vDireta: number
  /** velocidade da reação inversa, B → A (mol/(L·s)) */
  vInversa: number
}

/** Kc = [B]/[A] no equilíbrio = k1/k2. */
export const kc = (k1 = K1, k2 = K2) => k1 / k2

/** Concentrações de equilíbrio: v direta = v inversa ⇒ k1·[A] = k2·[B]. */
export function equilibrioAB(k1 = K1, k2 = K2, total = TOTAL) {
  const b = (total * k1) / (k1 + k2)
  return { a: total - b, b }
}

/** Estado no instante t, começando só com A (`inicio = 'reagente'`) ou só com B (`'produto'`). */
export function estadoAB(t: number, inicio: 'reagente' | 'produto' = 'reagente', k1 = K1, k2 = K2, total = TOTAL): EstadoAB {
  const eq = equilibrioAB(k1, k2, total)
  const a0 = inicio === 'reagente' ? total : 0
  const a = eq.a + (a0 - eq.a) * Math.exp(-(k1 + k2) * Math.max(0, t))
  const b = total - a
  return { a, b, vDireta: k1 * a, vInversa: k2 * b }
}

/** Instante a partir do qual as concentrações ficam a menos de `fracao` da distância inicial ao equilíbrio. */
export function tempoAteEquilibrio(fracao = 0.01, k1 = K1, k2 = K2): number {
  return Math.log(1 / fracao) / (k1 + k2)
}

/** Ordem fixa (embaralhada) das partículas da caixa, para que as trocas pareçam ao acaso. */
export function permutacao(n: number, semente = 7): number[] {
  const p = Array.from({ length: n }, (_, i) => i)
  let s = semente
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648
    const j = s % (i + 1)
    ;[p[i], p[j]] = [p[j] as number, p[i] as number]
  }
  return p
}

/**
 * Quais partículas da caixa são B no instante t. O número de B acompanha [B]; a cada "tique" uma partícula A vira B
 * e uma B vira A (a janela da permutação anda uma casa), então no equilíbrio a contagem fica parada, mas quem é B muda.
 */
export function particulasB(t: number, n: number, inicio: 'reagente' | 'produto' = 'reagente', tiquesPorSegundo = 6): Set<number> {
  const { b } = estadoAB(t, inicio)
  const nb = Math.round((b / TOTAL) * n)
  const ordem = permutacao(n)
  const tique = Math.floor(Math.max(0, t) * tiquesPorSegundo)
  const s = new Set<number>()
  for (let j = 0; j < nb; j++) s.add(ordem[(tique + j) % n] as number)
  return s
}
