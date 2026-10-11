/** Constantes da água usadas nos exercícios de vestibular (cal, g, °C). */
export const AGUA = {
  cGelo: 0.5,
  cAgua: 1,
  cVapor: 0.5,
  /** calor latente de fusão (cal/g) */
  LF: 80,
  /** calor latente de vaporização (cal/g) */
  LV: 540,
  TF: 0,
  TE: 100,
} as const

/** Calores específicos de alguns materiais (cal/g·°C). */
export const MATERIAIS: Record<string, { nome: string; c: number }> = {
  agua: { nome: 'Água', c: 1 },
  aluminio: { nome: 'Alumínio', c: 0.2 },
  ferro: { nome: 'Ferro', c: 0.1 },
  cobre: { nome: 'Cobre', c: 0.09 },
}

export type Fase = 'gelo' | 'fusao' | 'agua' | 'vaporizacao' | 'vapor'

export const NOME_FASE: Record<Fase, string> = {
  gelo: 'gelo (sólido)',
  fusao: 'fusão (gelo + água)',
  agua: 'água (líquido)',
  vaporizacao: 'vaporização (água + vapor)',
  vapor: 'vapor (gás)',
}

export interface TrechoCurva {
  fase: Fase
  /** calor acumulado no início e no fim do trecho (cal) */
  q0: number
  q1: number
  /** temperatura no início e no fim (°C) */
  t0: number
  t1: number
}

/**
 * Trechos da curva de aquecimento de m gramas de água, partindo de gelo a tIni (< 0 °C)
 * até a temperatura de vapor tFim (> 100 °C). Cada trecho é uma reta no gráfico T × Q.
 */
export function curvaAquecimento(m: number, tIni: number, tFim: number): TrechoCurva[] {
  const trechos: TrechoCurva[] = []
  let q = 0
  const adiciona = (fase: Fase, dq: number, t0: number, t1: number) => {
    trechos.push({ fase, q0: q, q1: q + dq, t0, t1 })
    q += dq
  }
  adiciona('gelo', m * AGUA.cGelo * (AGUA.TF - tIni), tIni, AGUA.TF)
  adiciona('fusao', m * AGUA.LF, AGUA.TF, AGUA.TF)
  adiciona('agua', m * AGUA.cAgua * (AGUA.TE - AGUA.TF), AGUA.TF, AGUA.TE)
  adiciona('vaporizacao', m * AGUA.LV, AGUA.TE, AGUA.TE)
  adiciona('vapor', m * AGUA.cVapor * (tFim - AGUA.TE), AGUA.TE, tFim)
  return trechos
}

export interface EstadoAmostra {
  T: number
  fase: Fase
  /** fração derretida (na fusão) ou vaporizada (na vaporização), de 0 a 1 */
  fracao: number
}

/** Estado de m gramas de água, partindo de gelo a tIni, depois de receber q calorias. */
export function estadoAposCalor(m: number, tIni: number, q: number): EstadoAmostra {
  const trechos = curvaAquecimento(m, tIni, 100 + 1e6)
  for (const tr of trechos) {
    if (q <= tr.q1 + 1e-9) {
      const prop = tr.q1 === tr.q0 ? 0 : (q - tr.q0) / (tr.q1 - tr.q0)
      const T = tr.t0 + (tr.t1 - tr.t0) * prop
      const palco = tr.fase === 'fusao' || tr.fase === 'vaporizacao'
      return { T, fase: tr.fase, fracao: palco ? Math.max(0, Math.min(1, prop)) : 0 }
    }
  }
  const ultimo = trechos[trechos.length - 1] as TrechoCurva
  return { T: ultimo.t1, fase: 'vapor', fracao: 0 }
}

/** Calor acumulado por grama (cal/g), contado a partir do gelo a 0 °C. Serve para colocar qualquer estado no eixo do calor. */
export function entalpia(fase: Fase, T: number, fracao = 0): number {
  if (fase === 'gelo') return AGUA.cGelo * T
  if (fase === 'fusao') return AGUA.LF * fracao
  if (fase === 'agua') return AGUA.LF + AGUA.cAgua * T
  if (fase === 'vaporizacao') return AGUA.LF + AGUA.cAgua * 100 + AGUA.LV * fracao
  return AGUA.LF + AGUA.cAgua * 100 + AGUA.LV + AGUA.cVapor * (T - 100)
}

export interface Etapa {
  /** descrição curta, por exemplo "gelo de −10 °C a 0 °C" */
  nome: string
  fase: Fase
  formula: 'mcdT' | 'mL'
  q: number
}

/** Etapas (e calor de cada uma) para levar m gramas de água do estado (fase, T) inicial ao final. */
export function etapasCalor(m: number, inicio: { fase: 'gelo' | 'agua'; T: number }, fim: { fase: 'agua' | 'vapor'; T: number }): Etapa[] {
  const etapas: Etapa[] = []
  let atual = inicio
  if (atual.fase === 'gelo') {
    if (atual.T < AGUA.TF) etapas.push({ nome: `gelo de ${atual.T} °C a 0 °C`, fase: 'gelo', formula: 'mcdT', q: m * AGUA.cGelo * (AGUA.TF - atual.T) })
    etapas.push({ nome: 'fusão a 0 °C', fase: 'fusao', formula: 'mL', q: m * AGUA.LF })
    atual = { fase: 'agua', T: AGUA.TF }
  }
  if (fim.fase === 'agua') {
    if (fim.T !== atual.T) etapas.push({ nome: `água de ${atual.T} °C a ${fim.T} °C`, fase: 'agua', formula: 'mcdT', q: m * AGUA.cAgua * (fim.T - atual.T) })
    return etapas
  }
  if (atual.T < AGUA.TE) etapas.push({ nome: `água de ${atual.T} °C a 100 °C`, fase: 'agua', formula: 'mcdT', q: m * AGUA.cAgua * (AGUA.TE - atual.T) })
  etapas.push({ nome: 'vaporização a 100 °C', fase: 'vaporizacao', formula: 'mL', q: m * AGUA.LV })
  if (fim.T > AGUA.TE) etapas.push({ nome: `vapor de 100 °C a ${fim.T} °C`, fase: 'vapor', formula: 'mcdT', q: m * AGUA.cVapor * (fim.T - AGUA.TE) })
  return etapas
}

export const calorTotal = (etapas: Etapa[]) => etapas.reduce((s, e) => s + e.q, 0)

/* ------------------------------------------------------------------ misturas */

export interface Corpo {
  m: number
  c: number
  T: number
}

/** Equilíbrio térmico sem mudança de fase: soma dos calores trocados igual a zero. */
export function equilibrio(corpos: Corpo[]): number {
  const cap = corpos.reduce((s, x) => s + x.m * x.c, 0)
  return corpos.reduce((s, x) => s + x.m * x.c * x.T, 0) / cap
}

export interface ResultadoGeloAgua {
  T: number
  /** massa de gelo que sobra (g) */
  gelo: number
  /** massa de água líquida no final (g) */
  agua: number
  situacao: 'derrete-tudo' | 'derrete-parte' | 'congela-tudo'
}

/**
 * Gelo (mg gramas, temperatura Tg ≤ 0) misturado com água líquida (ma gramas, Ta entre 0 e 100),
 * num recipiente isolado. Usa a entalpia relativa à água líquida a 0 °C.
 */
export function geloComAgua({ mg, Tg, ma, Ta }: { mg: number; Tg: number; ma: number; Ta: number }): ResultadoGeloAgua {
  const total = mg + ma
  const H = ma * AGUA.cAgua * Ta + mg * (AGUA.cGelo * Tg - AGUA.LF)
  if (H >= 0) return { T: H / (total * AGUA.cAgua), gelo: 0, agua: total, situacao: 'derrete-tudo' }
  if (H >= -AGUA.LF * total) {
    const gelo = -H / AGUA.LF
    return { T: 0, gelo, agua: total - gelo, situacao: 'derrete-parte' }
  }
  return { T: (H + AGUA.LF * total) / (AGUA.cGelo * total), gelo: total, agua: 0, situacao: 'congela-tudo' }
}

/* ------------------------------------------------------------------ gases */

export const paraKelvin = (c: number) => c + 273
export const paraCelsius = (k: number) => k - 273

export interface EstadoGas {
  p: number
  V: number
  /** temperatura absoluta (K) */
  T: number
}

/** Lei geral dos gases: p₁V₁/T₁ = p₂V₂/T₂. Informe dois valores finais e a função devolve o terceiro. */
export function leiGeral(ini: EstadoGas, fim: Partial<EstadoGas>): EstadoGas {
  const k = (ini.p * ini.V) / ini.T
  const { p, V, T } = fim
  if (p !== undefined && V !== undefined) return { p, V, T: (p * V) / k }
  if (p !== undefined && T !== undefined) return { p, V: (k * T) / p, T }
  if (V !== undefined && T !== undefined) return { p: (k * T) / V, V, T }
  throw new Error('informe dois dos três valores finais')
}

export type Transformacao = 'isotermica' | 'isobarica' | 'isocorica'

/** Estado final de uma transformação, dado o valor final da grandeza que a pessoa controla. */
export function transformar(ini: EstadoGas, tipo: Transformacao, alvo: number): EstadoGas {
  if (tipo === 'isotermica') return leiGeral(ini, { V: alvo, T: ini.T }) // alvo = volume final
  if (tipo === 'isobarica') return leiGeral(ini, { p: ini.p, V: alvo }) // alvo = volume final
  return leiGeral(ini, { V: ini.V, p: alvo }) // isocórica: alvo = pressão final
}

/** Trabalho realizado PELO gás numa expansão isobárica (p·ΔV). Unidades coerentes entre p e V. */
export const trabalhoIsobarico = (p: number, V1: number, V2: number) => p * (V2 - V1)

/** Trabalho (área sob a curva p × V) numa transformação isotérmica: n·R·T·ln(V₂/V₁) = p₁V₁·ln(V₂/V₁). */
export const trabalhoIsotermico = (ini: EstadoGas, V2: number) => ini.p * ini.V * Math.log(V2 / ini.V)

/** Pontos (V, p) da curva da transformação, para desenhar no diagrama p × V. */
export function curvaPV(ini: EstadoGas, tipo: Transformacao, alvo: number, n = 60): { V: number; p: number }[] {
  const fim = transformar(ini, tipo, alvo)
  const pts: { V: number; p: number }[] = []
  for (let i = 0; i <= n; i++) {
    const s = i / n
    if (tipo === 'isobarica') pts.push({ V: ini.V + (fim.V - ini.V) * s, p: ini.p })
    else if (tipo === 'isocorica') pts.push({ V: ini.V, p: ini.p + (fim.p - ini.p) * s })
    else {
      const V = ini.V + (fim.V - ini.V) * s
      pts.push({ V, p: (ini.p * ini.V) / V })
    }
  }
  return pts
}

/** Estado do gás depois de percorrer a fração s (0 a 1) do caminho da transformação. */
export function estadoParcial(ini: EstadoGas, tipo: Transformacao, alvo: number, s: number): EstadoGas {
  const fim = transformar(ini, tipo, alvo)
  if (tipo === 'isocorica') {
    const p = ini.p + (fim.p - ini.p) * s
    return { p, V: ini.V, T: (ini.T * p) / ini.p }
  }
  const V = ini.V + (fim.V - ini.V) * s
  if (tipo === 'isobarica') return { p: ini.p, V, T: (ini.T * V) / ini.V }
  return { p: (ini.p * ini.V) / V, V, T: ini.T }
}
