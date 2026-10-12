/* Física das telas sobre a 1ª e a 3ª lei de Newton. Unidades do SI; tudo sem atrito, salvo onde dito. */

/* ------------------------------------------------------------------ patinadores: ação e reação */

export interface Empurrao {
  /** massas (kg) */
  mA: number
  mB: number
  /** módulo da força que cada um faz no outro (N) */
  F: number
  /** duração do empurrão (s) */
  dt: number
}

/** Deslocamento de quem recebe aceleração `a` durante `dt` e depois segue em velocidade constante. */
const deslocamento = (a: number, dt: number, t: number) => (t <= dt ? 0.5 * a * t * t : 0.5 * a * dt * dt + a * dt * (t - dt))

/**
 * Dois patinadores no gelo se empurram: A recebe F para a esquerda e B recebe F para a direita (3ª lei).
 * Cada um acelera conforme a própria massa (2ª lei) e, quando as mãos se separam, segue em linha reta (1ª lei).
 */
export function patinadores({ mA, mB, F, dt }: Empurrao) {
  const aA = F / mA
  const aB = F / mB
  return {
    aA,
    aB,
    /** velocidades finais (módulo) */
    vA: aA * dt,
    vB: aB * dt,
    /** impulso de cada força = quantidade de movimento final de cada um */
    impulso: F * dt,
    /** distância percorrida por cada um até o instante t (cada um para o seu lado) */
    xA: (t: number) => deslocamento(aA, dt, t),
    xB: (t: number) => deslocamento(aB, dt, t),
    velA: (t: number) => aA * Math.min(Math.max(t, 0), dt),
    velB: (t: number) => aB * Math.min(Math.max(t, 0), dt),
    empurrando: (t: number) => t < dt,
  }
}

/** Instante em que quem tem aceleração `a` (empurrão de duração dt) percorre a distância d. */
export function tempoAte(a: number, dt: number, d: number): number {
  const durante = 0.5 * a * dt * dt
  if (durante >= d) return Math.sqrt((2 * d) / a)
  return dt + (d - durante) / (a * dt)
}

/* ------------------------------------------------------------------ blocos encostados */

/**
 * Blocos encostados numa superfície lisa, com a força F empurrando o primeiro.
 * Devolve a aceleração comum e a força de contato em cada encontro (entre o bloco i e o i+1):
 * ela é a força que acelera tudo o que vem depois.
 */
export function blocosEmContato(F: number, massas: number[]) {
  const total = massas.reduce((s, m) => s + m, 0)
  const a = F / total
  const contatos = massas.slice(0, -1).map((_, i) => a * massas.slice(i + 1).reduce((s, m) => s + m, 0))
  return { a, total, contatos }
}

/* ------------------------------------------------------------------ ônibus: inércia */

export type ModoOnibus = 'freia' | 'arranca'

/** Medidas da cena do ônibus (m, s, m/s, m/s²). */
export const ONIBUS = {
  comprimento: 10,
  raioBola: 0.4,
  /** posição inicial da bola, medida a partir da traseira */
  bola0: 5,
  freia: { v0: 8, inicio: 0.5, desac: 6, fim: 2.6 },
  arranca: { inicio: 0.3, acel: 4, fim: 2.4 },
}

/** Posição (traseira) e velocidade do ônibus no instante t. */
function movOnibus(modo: ModoOnibus, t: number) {
  if (modo === 'freia') {
    const { v0, inicio, desac } = ONIBUS.freia
    if (t <= inicio) return { x: v0 * t, v: v0 }
    const tPara = inicio + v0 / desac
    const tau = Math.min(t, tPara) - inicio
    return { x: v0 * inicio + v0 * tau - 0.5 * desac * tau * tau, v: t >= tPara ? 0 : v0 - desac * tau }
  }
  const { inicio, acel } = ONIBUS.arranca
  if (t <= inicio) return { x: 0, v: 0 }
  const tau = t - inicio
  return { x: 0.5 * acel * tau * tau, v: acel * tau }
}

/** A bola solta no piso liso: nenhuma força horizontal até encostar numa parede do ônibus. */
function bolaLivre(modo: ModoOnibus, t: number) {
  const v = modo === 'freia' ? ONIBUS.freia.v0 : 0
  return { x: ONIBUS.bola0 + v * t, v }
}

/** Primeiro instante em que a bola encosta na parede (frente, se freia; fundo, se arranca). */
export function instanteContato(modo: ModoOnibus): number {
  const folga = (t: number) => {
    const o = movOnibus(modo, t).x
    const b = bolaLivre(modo, t).x
    return modo === 'freia' ? o + ONIBUS.comprimento - ONIBUS.raioBola - b : b - (o + ONIBUS.raioBola)
  }
  const fim = ONIBUS[modo].fim
  if (folga(fim) > 0) return Infinity
  let lo = 0
  let hi = fim
  for (let k = 0; k < 60; k++) {
    const meio = (lo + hi) / 2
    if (folga(meio) > 0) lo = meio
    else hi = meio
  }
  return hi
}

/** Estado da cena: ônibus e bola, no referencial do chão. */
export function onibus(modo: ModoOnibus, t: number) {
  const o = movOnibus(modo, t)
  const tc = instanteContato(modo)
  const encostou = t >= tc
  const livre = bolaLivre(modo, t)
  const bola = encostou ? { x: modo === 'freia' ? o.x + ONIBUS.comprimento - ONIBUS.raioBola : o.x + ONIBUS.raioBola, v: o.v } : livre
  return { xOnibus: o.x, vOnibus: o.v, xBola: bola.x, vBola: bola.v, encostou, tContato: tc, freando: modo === 'freia' && t > ONIBUS.freia.inicio && o.v > 0, acelerando: modo === 'arranca' && t > ONIBUS.arranca.inicio }
}
