/* Cálculos do tema Pirâmide etária. Tudo aqui é didático: a pirâmide é um modelo, não um dado real de país. */

export const FAIXAS = ['0–4', '5–9', '10–14', '15–19', '20–24', '25–29', '30–34', '35–39', '40–44', '45–49', '50–54', '55–59', '60–64', '65–69', '70–74', '75–79', '80+'] as const
export const N_FAIXAS = FAIXAS.length

/** Cada faixa é percentual do total da população (homens e mulheres somam cerca de 100). */
export interface Piramide {
  homens: number[]
  mulheres: number[]
}

export interface Grupos {
  /** 0 a 14 anos */
  jovens: number
  /** 15 a 64 anos */
  adultos: number
  /** 65 anos ou mais */
  idosos: number
}

export type NomeGrupo = keyof Grupos

/** Índices das faixas de cada grupo (de 0 a 14: faixas 0 a 2; de 15 a 64: 3 a 12; 65 ou mais: 13 a 16). */
export const GRUPO_DA_FAIXA: NomeGrupo[] = FAIXAS.map((_, i) => (i <= 2 ? 'jovens' : i <= 12 ? 'adultos' : 'idosos'))

export const NOME_GRUPO: Record<NomeGrupo, string> = { jovens: 'Jovens (0 a 14 anos)', adultos: 'Adultos (15 a 64 anos)', idosos: 'Idosos (65 anos ou mais)' }

/* ------------------------------------------------------------------ modelo de pirâmide */

/** Fecundidade que mantém a população estável quando a mortalidade é baixa (filhas por mulher). */
export const REPOSICAO = 2.1
/** Idade média, em anos, em que as mulheres têm filhos (usada para converter fecundidade em crescimento). */
const GERACAO = 27
/** Parte da variação da fecundidade que aparece na pirâmide: a população real tem inércia (as coortes velhas não somem de uma vez). */
const INERCIA = 0.6
/** Memória de um passado de crescimento mais rápido: faz as pirâmides terem base mais larga do que teriam se a população fosse estável. */
const MEMORIA = 0.008
const NASCEM_HOMENS = 105 / 205

export interface ParamsPiramide {
  /** filhos por mulher */
  fecundidade: number
  /** esperança de vida ao nascer, em anos (média entre homens e mulheres) */
  expectativa: number
}

/** Taxa de crescimento das coortes que dá a forma da pirâmide (fração por ano). Serve só ao desenho: o crescimento real vem das taxas de natalidade e mortalidade. */
export function crescimentoDaFecundidade(fecundidade: number): number {
  return (INERCIA * Math.log(fecundidade / REPOSICAO)) / GERACAO + MEMORIA
}

/* Mortalidade: risco por idade = infantil (cai rápido) + de fundo (constante) + do envelhecimento (cresce exponencialmente), tudo multiplicado por um nível `m`. */
const RISCO_INFANTIL = 0.1
const QUEDA_INFANTIL = 1.4
const RISCO_FUNDO = 0.002
const RISCO_VELHICE = 0.00003
const CRESCE_VELHICE = 0.095

/** Risco acumulado até a idade `a` para o nível de mortalidade 1. */
const riscoAcumulado = (a: number) => (RISCO_INFANTIL / QUEDA_INFANTIL) * (1 - Math.exp(-QUEDA_INFANTIL * a)) + RISCO_FUNDO * a + (RISCO_VELHICE / CRESCE_VELHICE) * (Math.exp(CRESCE_VELHICE * a) - 1)

/** Probabilidade de chegar viva(o) à idade `a`, no nível de mortalidade `m`. */
export const sobrevivencia = (a: number, m: number) => Math.exp(-m * riscoAcumulado(a))

/** Esperança de vida ao nascer no nível `m` (integral da sobrevivência). */
export function esperancaDeVida(m: number): number {
  let s = 0
  const h = 0.25
  for (let a = h / 2; a < 130; a += h) s += sobrevivencia(a, m) * h
  return s
}

/** Nível de mortalidade que dá a esperança de vida pedida (bisseção; a esperança cai quando o nível sobe). */
const CACHE_NIVEL = new Map<number, number>()
export function nivelDeMortalidade(expectativa: number): number {
  const guardado = CACHE_NIVEL.get(expectativa)
  if (guardado !== undefined) return guardado
  let lo = 0.02
  let hi = 40
  for (let k = 0; k < 60; k++) {
    const meio = (lo + hi) / 2
    if (esperancaDeVida(meio) > expectativa) lo = meio
    else hi = meio
  }
  const nivel = (lo + hi) / 2
  CACHE_NIVEL.set(expectativa, nivel)
  return nivel
}

function massa(inicio: number, fim: number, r: number, m: number): number {
  const passos = Math.max(10, Math.round((fim - inicio) * 2))
  const h = (fim - inicio) / passos
  let s = 0
  for (let k = 0; k < passos; k++) {
    const a = inicio + (k + 0.5) * h
    s += Math.exp(-r * a) * sobrevivencia(a, m) * h
  }
  return s
}

/** Pirâmide do modelo: coortes que nasceram em número crescente (ou decrescente) e sobrevivem pela curva de mortalidade. As mulheres vivem 5 anos a mais que os homens. */
export function piramideModelo(p: ParamsPiramide): Piramide {
  const r = crescimentoDaFecundidade(p.fecundidade)
  const mH = nivelDeMortalidade(p.expectativa - 2.5)
  const mM = nivelDeMortalidade(p.expectativa + 2.5)
  const bruto = (nascem: number, m: number) => FAIXAS.map((_, i) => nascem * massa(i * 5, i === N_FAIXAS - 1 ? 130 : i * 5 + 5, r, m))
  const h = bruto(NASCEM_HOMENS, mH)
  const mu = bruto(1 - NASCEM_HOMENS, mM)
  const total = h.reduce((x, y) => x + y, 0) + mu.reduce((x, y) => x + y, 0)
  const um = (x: number) => Math.round((x / total) * 1000) / 10
  return { homens: h.map(um), mulheres: mu.map(um) }
}

/* ------------------------------------------------------------------ indicadores a partir dos números da pirâmide */

const soma = (v: number[], de: number, ate: number) => {
  let s = 0
  for (let i = de; i <= ate; i++) s += v[i] as number
  return s
}

/** Percentual do total em cada grupo (homens + mulheres), somando as faixas. */
export function grupos(p: Piramide): Grupos {
  const tot = (de: number, ate: number) => Math.round((soma(p.homens, de, ate) + soma(p.mulheres, de, ate)) * 10) / 10
  return { jovens: tot(0, 2), adultos: tot(3, 12), idosos: tot(13, N_FAIXAS - 1) }
}

/** Razão de dependência: (jovens + idosos) para cada 100 pessoas de 15 a 64 anos. */
export const razaoDependencia = (g: Grupos) => ((g.jovens + g.idosos) / g.adultos) * 100
export const razaoJovens = (g: Grupos) => (g.jovens / g.adultos) * 100
export const razaoIdosos = (g: Grupos) => (g.idosos / g.adultos) * 100
/** Índice de envelhecimento: idosos (65 ou mais) para cada 100 jovens (0 a 14). */
export const indiceEnvelhecimento = (g: Grupos) => (g.idosos / g.jovens) * 100

export type FormaPiramide = 'base-larga' | 'intermediaria' | 'base-estreita'

/** Forma pela parcela de jovens: 35 % ou mais, base larga; menos de 20 %, base estreita; entre os dois, intermediária (convenção didática). */
export function formaDaPiramide(g: Grupos): FormaPiramide {
  return g.jovens >= 35 ? 'base-larga' : g.jovens < 20 ? 'base-estreita' : 'intermediaria'
}

export const NOME_FORMA: Record<FormaPiramide, string> = {
  'base-larga': 'base larga (população jovem, em expansão)',
  intermediaria: 'base mais estreita, com o meio largo (em transição)',
  'base-estreita': 'base estreita e topo largo (população envelhecida)',
}

/** Maior faixa etária (índice) entre homens e mulheres somados por faixa. */
export function faixaMaisNumerosa(p: Piramide): number {
  let melhor = 0
  for (let i = 1; i < N_FAIXAS; i++) if ((p.homens[i] as number) + (p.mulheres[i] as number) > (p.homens[melhor] as number) + (p.mulheres[melhor] as number)) melhor = i
  return melhor
}

/* ------------------------------------------------------------------ crescimento */

/** Crescimento natural, em % ao ano: (natalidade − mortalidade) em por mil, dividido por 10. */
export const crescimentoNatural = (natalidade: number, mortalidade: number) => (natalidade - mortalidade) / 10

/** Regra dos 70: anos para a população dobrar com crescimento de `taxa` % ao ano. */
export const tempoDuplicacao70 = (taxa: number) => 70 / taxa

/** Tempo exato para dobrar com juros compostos, em anos. */
export const tempoDuplicacaoExato = (taxa: number) => Math.log(2) / Math.log(1 + taxa / 100)

/** População depois de `anos` com crescimento composto de `taxa` % ao ano. */
export const projetar = (p0: number, taxa: number, anos: number) => p0 * Math.pow(1 + taxa / 100, anos)

/** Taxa média anual (%) entre duas contagens separadas por `anos` anos. */
export const taxaMedia = (p0: number, p1: number, anos: number) => (Math.pow(p1 / p0, 1 / anos) - 1) * 100

/* ------------------------------------------------------------------ transição demográfica */

export type Fase = 1 | 2 | 3 | 4

/** Fase da transição pelas taxas (por mil): natalidade ≥ 30 e mortalidade ≥ 25, fase 1; natalidade ≥ 30 e mortalidade menor, fase 2; natalidade menor com diferença de 5 ou mais, fase 3; senão, fase 4. */
export function faseDasTaxas(natalidade: number, mortalidade: number): Fase {
  if (natalidade >= 30) return mortalidade >= 25 ? 1 : 2
  return natalidade - mortalidade >= 5 ? 3 : 4
}

/** Curvas do modelo clássico, com o tempo de 0 a 1: a mortalidade cai primeiro, a natalidade cai depois. */
export function taxasNoTempo(t: number): { natalidade: number; mortalidade: number } {
  const mortalidade = 10 + 30 / (1 + Math.exp((t - 0.3) * 14))
  const natalidade = 11 + 34 / (1 + Math.exp((t - 0.62) * 12))
  return { natalidade, mortalidade }
}

/** Fecundidade e expectativa que combinam com cada fase, para desenhar a pirâmide. */
export const PARAMETROS_FASE: Record<Fase, ParamsPiramide> = {
  1: { fecundidade: 6, expectativa: 42 },
  2: { fecundidade: 5, expectativa: 55 },
  3: { fecundidade: 2.6, expectativa: 70 },
  4: { fecundidade: 1.4, expectativa: 82 },
}

/** Parâmetros da pirâmide para um ponto da linha do tempo (0 a 1), por interpolação entre as fases. */
export function parametrosNoTempo(t: number): ParamsPiramide {
  const { natalidade, mortalidade } = taxasNoTempo(t)
  // natalidade de 11 a 45 por mil corresponde a 1,3 a 6 filhos por mulher; mortalidade de 40 a 10 por mil, a 42 a 83 anos de vida
  const fecundidade = 1.3 + ((natalidade - 11) * (6 - 1.3)) / (45 - 11)
  const expectativa = 83 - ((mortalidade - 10) * (83 - 42)) / 30
  return { fecundidade: Math.min(6.2, Math.max(1.3, fecundidade)), expectativa: Math.min(83, Math.max(40, expectativa)) }
}

export const NOME_FASE: Record<Fase, string> = {
  1: 'Fase 1: natalidade e mortalidade altas',
  2: 'Fase 2: mortalidade cai, natalidade segue alta',
  3: 'Fase 3: natalidade cai',
  4: 'Fase 4: natalidade e mortalidade baixas',
}
