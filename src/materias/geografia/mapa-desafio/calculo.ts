/* Cálculos do tema Mapa-desafio: coordenadas, escalas e fronteiras. */

/** Raio médio da Terra, em km. */
export const RAIO_TERRA = 6371
/** Quilômetros em 1° de arco de meridiano (π · R ÷ 180). */
export const KM_POR_GRAU = (Math.PI * RAIO_TERRA) / 180

export interface Coordenada {
  /** latitude em graus, positiva ao norte */
  lat: number
  /** longitude em graus, positiva a leste */
  lon: number
}

export type HemisferioNS = 'Norte' | 'Sul' | 'sobre o Equador'
export type HemisferioLO = 'Oriental' | 'Ocidental' | 'sobre o meridiano de Greenwich'

export const hemisferioNS = (lat: number): HemisferioNS => (lat > 0 ? 'Norte' : lat < 0 ? 'Sul' : 'sobre o Equador')
export const hemisferioLO = (lon: number): HemisferioLO => (lon > 0 ? 'Oriental' : lon < 0 ? 'Ocidental' : 'sobre o meridiano de Greenwich')

/** "23° S", "46° O" e "0°" para valores sem lado. */
export const formatarLat = (lat: number) => `${Math.abs(lat)}°${lat > 0 ? ' N' : lat < 0 ? ' S' : ''}`
export const formatarLon = (lon: number) => `${Math.abs(lon)}°${lon > 0 ? ' L' : lon < 0 ? ' O' : ''}`
export const formatarCoordenada = (c: Coordenada) => `${formatarLat(c.lat)}, ${formatarLon(c.lon)}`

/** Distância, em km, ao longo de um meridiano entre duas latitudes. */
export const distanciaNoMeridiano = (lat1: number, lat2: number) => Math.abs(lat2 - lat1) * KM_POR_GRAU

/** Distância pelo círculo máximo (fórmula de haversine), em km. */
export function distanciaGrandeCirculo(a: Coordenada, b: Coordenada): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * RAIO_TERRA * Math.asin(Math.sqrt(h))
}

/* ------------------------------------------------------------------ escala */

const CM_POR_KM = 100_000

/** Distância real, em km, para `cm` centímetros em um mapa de escala 1:`denominador`. */
export const distanciaReal = (cm: number, denominador: number) => (cm * denominador) / CM_POR_KM

/** Distância no mapa, em cm, para `km` quilômetros reais em escala 1:`denominador`. */
export const distanciaNoMapa = (km: number, denominador: number) => (km * CM_POR_KM) / denominador

/** Denominador da escala, quando `cm` no mapa equivalem a `km` no terreno. */
export const denominadorDaEscala = (cm: number, km: number) => (km * CM_POR_KM) / cm

/** A escala 1:a é maior que a 1:b quando o denominador é menor. */
export const escalaMaior = (a: number, b: number) => (a < b ? a : b)

/** "1:50.000". */
export const formatarEscala = (denominador: number) => `1:${denominador.toLocaleString('pt-BR')}`

/** Quanto vale 1 cm do mapa no terreno: "500 m" ou "2 km". */
export function umCentimetro(denominador: number): string {
  const km = denominador / CM_POR_KM
  if (km >= 1) return `${km.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`
  return `${(km * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m`
}
