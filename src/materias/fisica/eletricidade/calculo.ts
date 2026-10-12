/** Circuitos de resistores em série e em paralelo ligados a uma fonte ideal. */
export type No = { tipo: 'R'; R: number } | { tipo: 'serie' | 'paralelo'; filhos: No[] }

export const R = (valor: number): No => ({ tipo: 'R', R: valor })
export const serie = (...filhos: No[]): No => ({ tipo: 'serie', filhos })
export const paralelo = (...filhos: No[]): No => ({ tipo: 'paralelo', filhos })

/** Resistência equivalente. Um resistor aberto (queimado) tem resistência infinita. */
export function req(no: No): number {
  if (no.tipo === 'R') return no.R
  if (no.tipo === 'serie') return no.filhos.reduce((s, f) => s + req(f), 0)
  const condutancia = no.filhos.reduce((s, f) => s + 1 / req(f), 0)
  return condutancia === 0 ? Infinity : 1 / condutancia
}

export interface Folha {
  /** ordem em que o resistor aparece no circuito (0, 1, 2...) */
  id: number
  R: number
  /** corrente (A) */
  i: number
  /** diferença de potencial nos terminais (V) */
  V: number
  /** potência dissipada (W) */
  P: number
}

/** Corrente, ddp e potência em cada resistor quando a associação inteira recebe a tensão V. */
export function resolver(no: No, V: number): Folha[] {
  const folhas: Folha[] = []
  let contador = 0
  const visita = (n: No, ddp: number, corrente: number) => {
    if (n.tipo === 'R') {
      folhas.push({ id: contador++, R: n.R, i: corrente, V: ddp, P: ddp * corrente })
      return
    }
    if (n.tipo === 'paralelo') {
      // todos os ramos recebem a mesma ddp
      for (const f of n.filhos) {
        const rf = req(f)
        visita(f, ddp, Number.isFinite(rf) ? ddp / rf : 0)
      }
      return
    }
    // série: a mesma corrente atravessa todos; a ddp se divide
    const total = req(n)
    const aberto = !Number.isFinite(total)
    const i = aberto ? 0 : corrente
    for (const f of n.filhos) {
      const rf = req(f)
      const ddpF = aberto ? (Number.isFinite(rf) ? 0 : ddp) : i * rf
      visita(f, ddpF, i)
    }
  }
  const total = req(no)
  visita(no, V, Number.isFinite(total) ? V / total : 0)
  return folhas
}

/** Substitui o resistor de índice `id` por um circuito aberto (lâmpada queimada). */
export function queimar(no: No, id: number): No {
  let contador = 0
  const troca = (n: No): No => {
    if (n.tipo === 'R') return contador++ === id ? { tipo: 'R', R: Infinity } : n
    return { tipo: n.tipo, filhos: n.filhos.map(troca) }
  }
  return troca(no)
}

export const correnteTotal = (no: No, V: number) => (Number.isFinite(req(no)) ? V / req(no) : 0)

export type Topologia = 'serie' | 'paralelo' | 'misto' | 'misto2'

/** R₀ em série com (R₁ ∥ R₂) = "misto"; R₀ ∥ (R₁ em série com R₂) = "misto2". */
export function montar(topologia: Topologia, rs: number[]): No {
  const [a = 1, b = 1, c] = rs
  if (topologia === 'serie') return serie(...rs.map(R))
  if (topologia === 'paralelo') return paralelo(...rs.map(R))
  if (topologia === 'misto') return serie(R(a), paralelo(R(b), R(c ?? b)))
  return paralelo(R(a), serie(R(b), R(c ?? b)))
}

/* ------------------------------------------------------------------ energia e conta de luz */

export const potencia = {
  porVI: (V: number, i: number) => V * i,
  porRI: (Rv: number, i: number) => Rv * i * i,
  porVR: (V: number, Rv: number) => (V * V) / Rv,
}

/** Energia em kWh para uma potência em watts durante um número de horas. */
export const energiaKWh = (watts: number, horas: number) => (watts * horas) / 1000

export interface Aparelho {
  nome: string
  /** potência em watts */
  W: number
  /** horas de uso por dia */
  h: number
}

/** Consumo mensal (kWh) de um conjunto de aparelhos usados `dias` dias no mês. */
export const consumoMensal = (aparelhos: Aparelho[], dias = 30) => aparelhos.reduce((s, a) => s + energiaKWh(a.W, a.h * dias), 0)

export const custo = (kWh: number, tarifa: number) => kWh * tarifa

/** Potência de um resistor (aquecedor) quando a ddp muda, mantendo a resistência. */
export const potenciaComNovaTensao = (P: number, V: number, novaV: number) => P * (novaV / V) ** 2
