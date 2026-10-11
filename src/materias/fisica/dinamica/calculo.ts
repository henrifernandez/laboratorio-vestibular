/** Aceleração da gravidade (m/s²), como nos exercícios de vestibular. */
export const G = 10

const rad = (g: number) => (g * Math.PI) / 180

export interface EntradaPlano {
  /** massa (kg) */
  m: number
  /** inclinação (graus) */
  angulo: number
  /** coeficiente de atrito (usamos o mesmo valor para o estático e o cinético) */
  mu: number
}

export interface ResultadoPlano {
  peso: number
  /** componente do peso ao longo do plano (tende a fazer o bloco descer) */
  paralela: number
  /** reação normal */
  normal: number
  /** atrito máximo possível: μ·N */
  atritoMax: number
  desliza: boolean
  /** atrito que realmente atua: iguala a componente paralela se parado; μ·N se deslizando */
  atrito: number
  /** aceleração ao longo do plano (0 se parado) */
  aceleracao: number
}

export function plano({ m, angulo, mu }: EntradaPlano): ResultadoPlano {
  const peso = m * G
  const paralela = peso * Math.sin(rad(angulo))
  const normal = peso * Math.cos(rad(angulo))
  const atritoMax = mu * normal
  const desliza = paralela > atritoMax + 1e-9
  return {
    peso,
    paralela,
    normal,
    atritoMax,
    desliza,
    atrito: desliza ? atritoMax : paralela,
    aceleracao: desliza ? (paralela - atritoMax) / m : 0,
  }
}

export const angulos = {
  /** ângulo a partir do qual o bloco começa a deslizar: tg θ = μ */
  critico: (mu: number) => (Math.atan(mu) * 180) / Math.PI,
}

export interface ResultadoPolia {
  a: number
  T: number
}

/** Máquina de Atwood: m1 > m2 desce (a > 0 significa que m1 desce). */
export function atwood(m1: number, m2: number): ResultadoPolia {
  return { a: ((m1 - m2) * G) / (m1 + m2), T: (2 * m1 * m2 * G) / (m1 + m2) }
}

export interface ResultadoMesa extends ResultadoPolia {
  desliza: boolean
}

/** Bloco m1 sobre a mesa (atrito μ), ligado por fio e polia ao bloco m2 pendurado. */
export function mesaComPolia(m1: number, m2: number, mu: number): ResultadoMesa {
  const motor = m2 * G
  const atritoMax = mu * m1 * G
  if (motor <= atritoMax + 1e-9) return { a: 0, T: m2 * G, desliza: false }
  const a = (motor - atritoMax) / (m1 + m2)
  return { a, T: m2 * (G - a), desliza: true }
}

export interface EntradaForca {
  F: number
  m: number
  mu: number
}

/** Bloco puxado horizontalmente por F sobre uma superfície com atrito. */
export function forcaResultante({ F, m, mu }: EntradaForca) {
  const atritoMax = mu * m * G
  if (F <= atritoMax + 1e-9) return { atrito: F, res: 0, a: 0 }
  return { atrito: atritoMax, res: F - atritoMax, a: (F - atritoMax) / m }
}
