/* Cálculos do tema Fusos horários. Horas em minutos desde a meia-noite; fusos em horas em relação a Greenwich (UTC). */

export const MIN_DIA = 1440
export const GRAUS_POR_HORA = 15
export const MINUTOS_POR_GRAU = 4

export const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'] as const

/* ------------------------------------------------------------------ texto */

/** "14h" ou "14h30". */
export function formatarHora(minutos: number): string {
  const m = ((Math.round(minutos) % MIN_DIA) + MIN_DIA) % MIN_DIA
  const h = Math.floor(m / 60)
  const r = m % 60
  return r === 0 ? `${h}h` : `${h}h${String(r).padStart(2, '0')}`
}

/** "UTC−3", "UTC+9", "UTC+5:30". */
export function formatarUtc(utc: number): string {
  const sinal = utc < 0 ? '−' : '+'
  const abs = Math.abs(utc)
  const h = Math.floor(abs)
  const m = Math.round((abs - h) * 60)
  return `UTC${sinal}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`
}

export const nomeDoDia = (indice: number) => DIAS_SEMANA[((indice % 7) + 7) % 7] as string

/** "9 horas" / "2 h 30 min": duração em horas legível. */
export function formatarDuracao(horas: number): string {
  const total = Math.round(horas * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/* ------------------------------------------------------------------ horas e fusos */

export interface Hora {
  /** minutos desde a meia-noite, de 0 a 1439 */
  minutos: number
  /** dias de diferença em relação ao dia de origem: -1 (dia anterior), 0, 1 (dia seguinte)... */
  dia: number
}

/** Hora local de um lugar com fuso `utcDestino`, quando num lugar com fuso `utcOrigem` o relógio marca `minutosOrigem`. */
export function converterHora(minutosOrigem: number, utcOrigem: number, utcDestino: number): Hora {
  const total = minutosOrigem + (utcDestino - utcOrigem) * 60
  const dia = Math.floor(total / MIN_DIA)
  return { minutos: ((Math.round(total) % MIN_DIA) + MIN_DIA) % MIN_DIA, dia }
}

/** Diferença de horas (positiva se o destino está a leste, isto é, com a hora adiantada). */
export const diferencaDeFuso = (utcOrigem: number, utcDestino: number) => utcDestino - utcOrigem

/** Fuso teórico de um ponto: o fuso de 15° mais próximo (longitude positiva a leste). */
export const fusoTeorico = (longitude: number) => Math.round(longitude / GRAUS_POR_HORA)

/** Longitude do meridiano central de um fuso. */
export const meridianoCentral = (utc: number) => utc * GRAUS_POR_HORA

/** Fuso começa 7,5° antes e termina 7,5° depois do meridiano central. */
export const limitesDoFuso = (utc: number): [number, number] => [utc * GRAUS_POR_HORA - 7.5, utc * GRAUS_POR_HORA + 7.5]

/** Diferença de hora solar, em minutos, entre dois meridianos: 4 minutos por grau. */
export const minutosSolares = (lonA: number, lonB: number) => Math.abs(lonB - lonA) * MINUTOS_POR_GRAU

/** Diferença de horas entre dois meridianos de longitudes dadas (sempre positiva). */
export const horasEntreMeridianos = (lonA: number, lonB: number) => Math.abs(lonB - lonA) / GRAUS_POR_HORA

/** Hora solar média num ponto, quando em Greenwich são `minutosUtc`. */
export const horaSolar = (minutosUtc: number, longitude: number) => minutosUtc + longitude * MINUTOS_POR_GRAU

/* ------------------------------------------------------------------ voos */

export interface Voo {
  /** minutos desde a meia-noite (hora local da origem) */
  partida: number
  /** minutos desde a meia-noite (hora local do destino) */
  chegada: number
  /** dias entre a data de partida e a data de chegada, pelo calendário local de cada um */
  diasDepois: number
  utcOrigem: number
  utcDestino: number
}

/** Duração do voo, em horas: diferença dos relógios menos a diferença de fuso. */
export function duracaoDoVoo(v: Voo): number {
  const relogios = v.chegada + v.diasDepois * MIN_DIA - v.partida
  return (relogios - (v.utcDestino - v.utcOrigem) * 60) / 60
}

/** Hora local de chegada de um voo que parte às `partida` (hora da origem) e dura `duracaoHoras`. */
export function chegadaDoVoo(partida: number, duracaoHoras: number, utcOrigem: number, utcDestino: number): Hora {
  return converterHora(partida + duracaoHoras * 60, utcOrigem, utcDestino)
}

/* ------------------------------------------------------------------ expediente */

export const INICIO_EXPEDIENTE = 9 * 60
/** Uma reunião de uma hora precisa começar até as 17h para terminar às 18h. */
export const ULTIMO_INICIO = 17 * 60

/** A reunião de uma hora que começa neste horário local cabe no expediente (9h às 18h)? */
export const noExpediente = (minutosLocal: number) => {
  const m = ((minutosLocal % MIN_DIA) + MIN_DIA) % MIN_DIA
  return m >= INICIO_EXPEDIENTE && m <= ULTIMO_INICIO
}

/* ------------------------------------------------------------------ dia e noite */

/** Entre 6h e 18h, claro; no resto, escuro (aproximação para ilustrar). */
export const ehDia = (minutos: number) => {
  const m = ((minutos % MIN_DIA) + MIN_DIA) % MIN_DIA
  return m >= 6 * 60 && m < 18 * 60
}
