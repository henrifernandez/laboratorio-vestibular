import { CIDADES, type Cidade, type IdClima } from '@/conteudo/geografia/climogramas'

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export interface DadosClima {
  temp: number[]
  chuva: number[]
}

export type Hemisferio = 'N' | 'S'
export type Estacao = 'verao' | 'outono' | 'inverno' | 'primavera'
export const NOME_ESTACAO: Record<Estacao, string> = { verao: 'verão', outono: 'outono', inverno: 'inverno', primavera: 'primavera' }

const soma = (v: number[]) => v.reduce((a, b) => a + b, 0)

export const mediaAnual = (d: DadosClima) => soma(d.temp) / 12
export const amplitude = (d: DadosClima) => Math.max(...d.temp) - Math.min(...d.temp)
export const totalAnual = (d: DadosClima) => soma(d.chuva)
export const mesMaisQuente = (d: DadosClima) => d.temp.indexOf(Math.max(...d.temp))
export const mesMaisFrio = (d: DadosClima) => d.temp.indexOf(Math.min(...d.temp))
export const mesMaisChuvoso = (d: DadosClima) => d.chuva.indexOf(Math.max(...d.chuva))
export const mesMaisSeco = (d: DadosClima) => d.chuva.indexOf(Math.min(...d.chuva))

/** Meses secos pelo critério de Gaussen: chuva (mm) menor que o dobro da temperatura (°C). */
export function mesesSecos(d: DadosClima): number[] {
  return d.temp.map((t, i) => ((d.chuva[i] as number) < 2 * t ? i : -1)).filter((i) => i >= 0)
}

/** Amplitude mínima para que a época do mês mais quente indique o hemisfério (nos trópicos, a linha quase não muda). */
export const AMPLITUDE_MINIMA_HEMISFERIO = 5

/** Hemisfério pela época do mês mais quente: de novembro a março, Sul; de maio a setembro, Norte; abril e outubro, ou amplitude pequena, não permitem concluir. */
export function hemisferioPelaTemperatura(d: DadosClima): Hemisferio | null {
  if (amplitude(d) < AMPLITUDE_MINIMA_HEMISFERIO) return null
  const m = mesMaisQuente(d)
  if (m === 10 || m === 11 || m === 0 || m === 1 || m === 2) return 'S'
  if (m >= 4 && m <= 8) return 'N'
  return null
}

/** Meses (0 a 11) de cada estação do ano, de acordo com o hemisfério. */
export function mesesDaEstacao(e: Estacao, h: Hemisferio): number[] {
  const sul: Record<Estacao, number[]> = { verao: [11, 0, 1], outono: [2, 3, 4], inverno: [5, 6, 7], primavera: [8, 9, 10] }
  const trocar: Record<Estacao, Estacao> = { verao: 'inverno', inverno: 'verao', outono: 'primavera', primavera: 'outono' }
  return sul[h === 'S' ? e : trocar[e]]
}

export const ESTACOES: Estacao[] = ['verao', 'outono', 'inverno', 'primavera']

/** Total de chuva de cada estação (mm). */
export function chuvaPorEstacao(d: DadosClima, h: Hemisferio): Record<Estacao, number> {
  const r = {} as Record<Estacao, number>
  for (const e of ESTACOES) r[e] = soma(mesesDaEstacao(e, h).map((m) => d.chuva[m] as number))
  return r
}

/** Estação com mais (ou menos) chuva, e a folga em relação à seguinte (razão entre elas; ≥ 1). */
export function estacaoExtrema(d: DadosClima, h: Hemisferio, tipo: 'chuvosa' | 'seca'): { estacao: Estacao; folga: number } {
  const c = chuvaPorEstacao(d, h)
  const ordem = [...ESTACOES].sort((a, b) => (tipo === 'chuvosa' ? c[b] - c[a] : c[a] - c[b]))
  const primeira = ordem[0] as Estacao
  const segunda = ordem[1] as Estacao
  const a = c[primeira]
  const b = c[segunda]
  const folga = tipo === 'chuvosa' ? a / Math.max(b, 1e-9) : b / Math.max(a, 1e-9)
  return { estacao: primeira, folga }
}

/** Escalas do gráfico: temperatura de tlo a thi (passo de 5) e chuva de 0 a pmax. */
export function escalas(d: DadosClima) {
  const tlo = Math.min(0, Math.floor(Math.min(...d.temp) / 5) * 5)
  const thi = Math.max(5, Math.ceil(Math.max(...d.temp) / 5) * 5)
  const passoP = Math.max(...d.chuva) > 200 ? 100 : Math.max(...d.chuva) > 60 ? 50 : 10
  const pmax = Math.max(passoP, Math.ceil(Math.max(...d.chuva) / passoP) * passoP)
  return { tlo, thi, pmax, passoP }
}

export const cidade = (id: string) => CIDADES.find((c) => c.id === id) as Cidade

/* ------------------------------------------------------------------ cidade sintética (laboratório) */

export interface ParamsSinteticos {
  /** temperatura média anual (°C) */
  media: number
  /** amplitude térmica anual (°C) */
  amp: number
  hem: Hemisferio
  /** chuva total anual (mm) */
  total: number
  /** concentração da chuva: 0 = igual todo mês; 1 = toda concentrada na estação chuvosa */
  conc: number
  /** a estação chuvosa é o verão? */
  chuvaNoVerao: boolean
}

/** Curvas senoidais: o mês mais quente é janeiro (Sul) ou julho (Norte); a amplitude e o total anual saem exatos. */
export function gerarSintetico(p: ParamsSinteticos): DadosClima {
  const mQuente = p.hem === 'S' ? 0 : 6
  const mChuva = p.chuvaNoVerao ? mQuente : (mQuente + 6) % 12
  const temp: number[] = []
  const chuva: number[] = []
  for (let m = 0; m < 12; m++) {
    temp.push(Math.round((p.media + (p.amp / 2) * Math.cos((2 * Math.PI * (m - mQuente)) / 12)) * 10) / 10)
    chuva.push(Math.round((p.total / 12) * (1 + p.conc * Math.cos((2 * Math.PI * (m - mChuva)) / 12))))
  }
  return { temp, chuva }
}

/** Distância entre dois lugares em termos de média, amplitude, total e meses secos (cada um normalizado). */
function distancia(a: DadosClima, b: DadosClima): number {
  const parte = (x: number, y: number, escala: number) => ((x - y) / escala) ** 2
  return (
    parte(mediaAnual(a), mediaAnual(b), 8) +
    parte(amplitude(a), amplitude(b), 8) +
    parte(totalAnual(a), totalAnual(b), 700) +
    parte(mesesSecos(a).length, mesesSecos(b).length, 3)
  )
}

/** Entre as cidades-modelo, a de climograma mais parecido. */
export function maisParecida(d: DadosClima, entre: Cidade[] = CIDADES): Cidade {
  return [...entre].sort((a, b) => distancia(d, a) - distancia(d, b))[0] as Cidade
}

export type { IdClima }
