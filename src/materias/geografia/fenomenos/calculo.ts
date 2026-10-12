/** Contas dos fenômenos atmosféricos: chuva orográfica, El Niño/La Niña, inversão térmica e ilha de calor. */

/* ------------------------------------------------------------------ chuva orográfica */

/** Gradientes de exercício: ar não saturado esfria (ou esquenta) 10 °C por km; ar saturado, 6 °C por km. */
export const GRAD_SECO = 10
export const GRAD_UMIDO = 6

/** Altura do nível de condensação (km) pela aproximação de Espy: 125 m para cada °C entre a temperatura e o ponto de orvalho. */
export function alturaCondensacaoKm(t: number, orvalho: number): number {
  return (125 * Math.max(0, t - orvalho)) / 1000
}

export interface Montanha {
  /** temperatura do ar ao nível do mar, do lado do vento (°C) */
  t0: number
  /** altura da serra (km) */
  altura: number
  /** altura em que o ar começa a condensar (km) */
  zc: number
}

/** Temperatura do ar que sobe a encosta, na altura z (km). */
export function temperaturaNaSubida(m: Montanha, z: number): number {
  const zc = Math.min(m.zc, m.altura)
  if (z <= zc) return m.t0 - GRAD_SECO * z
  return m.t0 - GRAD_SECO * zc - GRAD_UMIDO * (z - zc)
}

export interface ResultadoOrografico {
  /** há condensação (chuva) na subida? */
  chove: boolean
  tTopo: number
  /** temperatura do ar ao chegar ao nível do mar, no lado de sotavento */
  tSotavento: number
  /** quanto o ar sai mais quente do que entrou (°C) */
  aquecimento: number
  /** altura efetiva de condensação (km), limitada à altura da serra */
  zc: number
}

export function resultadoOrografico(m: Montanha): ResultadoOrografico {
  const chove = m.zc < m.altura
  const zc = Math.min(m.zc, m.altura)
  const tTopo = temperaturaNaSubida(m, m.altura)
  // a descida é de ar seco: reaquece 10 °C por km
  const tSotavento = tTopo + GRAD_SECO * m.altura
  return { chove, tTopo, tSotavento, aquecimento: tSotavento - m.t0, zc }
}

/**
 * Temperatura da parcela de ar ao longo do caminho. `s` vai de 0 (nível do mar, antes da serra) a 1 (topo) e 2 (nível do mar, depois da serra).
 */
export function temperaturaNoCaminho(m: Montanha, s: number): { t: number; z: number; nuvem: boolean } {
  const x = Math.min(2, Math.max(0, s))
  if (x <= 1) {
    const z = x * m.altura
    return { t: temperaturaNaSubida(m, z), z, nuvem: z > m.zc && m.zc < m.altura }
  }
  const z = (2 - x) * m.altura
  const r = resultadoOrografico(m)
  return { t: r.tTopo + GRAD_SECO * (m.altura - z), z, nuvem: false }
}

/* ------------------------------------------------------------------ El Niño e La Niña */

export type FaseEnso = 'el-nino' | 'neutro' | 'la-nina'
export type IntensidadeEnso = 'fraco' | 'moderado' | 'forte' | 'muito forte'

export const NOME_FASE: Record<FaseEnso, string> = { 'el-nino': 'El Niño', neutro: 'Condições neutras', 'la-nina': 'La Niña' }

/** Limite de ±0,5 °C na anomalia da temperatura do mar na região Niño 3.4. */
export const LIMITE_ENSO = 0.5

export function faseEnso(anomalia: number): FaseEnso {
  if (anomalia >= LIMITE_ENSO) return 'el-nino'
  if (anomalia <= -LIMITE_ENSO) return 'la-nina'
  return 'neutro'
}

/** Classes de intensidade usadas pela NOAA: fraco (0,5 a 0,9), moderado (1,0 a 1,4), forte (1,5 a 1,9), muito forte (2,0 ou mais). */
export function intensidadeEnso(anomalia: number): IntensidadeEnso | null {
  const a = Math.abs(anomalia)
  if (a < LIMITE_ENSO) return null
  if (a < 1) return 'fraco'
  if (a < 1.5) return 'moderado'
  if (a < 2) return 'forte'
  return 'muito forte'
}

/** Força dos ventos alísios em relação ao normal (0 a 1): enfraquecem no El Niño, reforçam na La Niña. */
export function forcaAlisios(anomalia: number): number {
  return Math.min(1, Math.max(0, 0.6 - 0.2 * anomalia))
}

/**
 * Inclinação da camada de água quente (termoclina) em relação ao normal (1): menor no El Niño (a água quente se espalha para o leste e a ressurgência diminui),
 * maior na La Niña. Parâmetro de desenho: mostra o sentido do efeito, não valores medidos.
 */
export function inclinacaoTermoclina(anomalia: number): number {
  return Math.min(1.5, Math.max(0.1, 1 - 0.32 * anomalia))
}

/* ------------------------------------------------------------------ inversão térmica */

/** Queda média da temperatura do ar com a altitude, em condições normais (°C por km). */
export const GRAD_NORMAL = 6.5

export interface ParamsInversao {
  /** temperatura na superfície (°C) */
  t0: number
  /** altura da base da camada de inversão (m) */
  base: number
  /** espessura da camada (m) */
  espessura: number
  /** aumento de temperatura entre a base e o topo da camada (°C) */
  delta: number
}

export interface PontoPerfil {
  z: number
  t: number
}

/** Temperatura na altura z (m). A inversão sobe `delta` de modo linear entre a base e o topo. */
export function temperaturaNaAltura(p: ParamsInversao, z: number): number {
  const topo = p.base + p.espessura
  const queda = (a: number, b: number) => (GRAD_NORMAL * (b - a)) / 1000
  const tBase = p.t0 - queda(0, p.base)
  if (z <= p.base) return p.t0 - queda(0, z)
  if (z <= topo) return tBase + (p.delta * (z - p.base)) / p.espessura
  return tBase + p.delta - queda(topo, z)
}

export function perfilInversao(p: ParamsInversao, alturas: number[]): PontoPerfil[] {
  return alturas.map((z) => ({ z, t: Math.round(temperaturaNaAltura(p, z) * 100) / 100 }))
}

/** Camadas (de, até) em que a temperatura sobe com a altura, lendo só os pontos da tabela. */
export function camadasDeInversao(perfil: PontoPerfil[]): { de: number; ate: number }[] {
  const camadas: { de: number; ate: number }[] = []
  let inicio: number | null = null
  for (let i = 1; i < perfil.length; i++) {
    const antes = perfil[i - 1] as PontoPerfil
    const agora = perfil[i] as PontoPerfil
    if (agora.t > antes.t + 1e-9) {
      if (inicio === null) inicio = antes.z
    } else if (inicio !== null) {
      camadas.push({ de: inicio, ate: antes.z })
      inicio = null
    }
  }
  if (inicio !== null) camadas.push({ de: inicio, ate: (perfil[perfil.length - 1] as PontoPerfil).z })
  return camadas
}

/* ------------------------------------------------------------------ ilha de calor (escala qualitativa) */

export interface Superficie {
  id: string
  nome: string
  /** aquecimento relativo: 1 (mais fresco) a 4 (mais quente) */
  nivel: 1 | 2 | 3 | 4
  porque: string
}

export const SUPERFICIES: Superficie[] = [
  { id: 'rio', nome: 'Rio ou lago', nivel: 1, porque: 'A água tem alto calor específico e evapora: esquenta devagar e resfria o ar ao redor.' },
  { id: 'parque', nome: 'Parque arborizado', nivel: 1, porque: 'As árvores dão sombra e liberam vapor de água pela transpiração, o que resfria o ambiente.' },
  { id: 'campo', nome: 'Zona rural (campo e mata)', nivel: 1, porque: 'Solo permeável e vegetação: há sombra e evaporação.' },
  { id: 'suburbio', nome: 'Subúrbio com casas e quintais', nivel: 2, porque: 'Há construções, mas também árvores, quintais e solo permeável.' },
  { id: 'residencial', nome: 'Bairro de prédios e pouca vegetação', nivel: 3, porque: 'Muita área construída e pouca área verde: o calor é retido.' },
  { id: 'centro', nome: 'Centro com asfalto e concreto', nivel: 4, porque: 'Asfalto e concreto absorvem e guardam calor, não há evaporação e os prédios dificultam a ventilação, além do calor de carros e aparelhos.' },
]

/** Efeito de uma medida sobre o nível de um local (nunca abaixo de 1). */
export const MEDIDAS_URBANAS = [
  { id: 'arvores', nome: 'Arborização', reducao: 1 },
  { id: 'telhado', nome: 'Telhados claros ou verdes', reducao: 1 },
] as const

export function nivelComMedidas(nivel: number, medidas: string[]): number {
  const r = MEDIDAS_URBANAS.filter((m) => medidas.includes(m.id)).reduce((a, m) => a + m.reducao, 0)
  return Math.max(1, nivel - r)
}
