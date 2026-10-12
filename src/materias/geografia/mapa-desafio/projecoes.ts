import { geoArea, geoEqualEarth, geoEquirectangular, geoMercator, geoPath, type GeoProjection } from 'd3-geo'
import type { PaisGeo } from '../comum/mapa'
import { RAIO_TERRA } from './calculo'

export type TipoProjecao = 'equirretangular' | 'mercator' | 'equal-earth'

export interface InfoProjecao {
  id: TipoProjecao
  nome: string
  tipo: string
  preserva: string
  deforma: string
}

export const PROJECOES: InfoProjecao[] = [
  { id: 'equirretangular', nome: 'Equirretangular', tipo: 'cilíndrica simples', preserva: 'distâncias ao longo dos meridianos', deforma: 'áreas e formas, mais para os polos' },
  { id: 'mercator', nome: 'Mercator', tipo: 'cilíndrica conforme', preserva: 'ângulos e formas locais', deforma: 'áreas, muito ampliadas perto dos polos' },
  { id: 'equal-earth', nome: 'Equal Earth', tipo: 'pseudocilíndrica equivalente', preserva: 'áreas', deforma: 'formas e ângulos' },
]

export const LARGURA_MUNDO = 640
export const ANTARTIDA = '010'

/** Mercator não cobre os polos: o desenho é cortado em 85° N e 62° S, e a Antártida fica de fora. */
const LAT_MAX_MERCATOR = 85
const LAT_MIN_MERCATOR = -62

/** Projeção ajustada a uma largura fixa. A altura sai da própria projeção. */
export function criarProjecao(tipo: TipoProjecao, largura = LARGURA_MUNDO): { projecao: GeoProjection; altura: number } {
  const mundo = { type: 'Sphere' } as const
  if (tipo === 'mercator') {
    const p = geoMercator().scale(largura / (2 * Math.PI)).translate([largura / 2, 0])
    const topo = (p([0, LAT_MAX_MERCATOR]) as [number, number])[1]
    const base = (p([0, LAT_MIN_MERCATOR]) as [number, number])[1]
    p.translate([largura / 2, -topo])
    p.clipExtent([[0, 0], [largura, base - topo]])
    return { projecao: p, altura: Math.round(base - topo) }
  }
  const p = tipo === 'equirretangular' ? geoEquirectangular() : geoEqualEarth()
  p.fitWidth(largura, mundo)
  const caminho = geoPath(p)
  const [[, y0], [, y1]] = caminho.bounds(mundo)
  p.translate([p.translate()[0], p.translate()[1] - y0])
  return { projecao: p, altura: Math.round(y1 - y0) }
}

/** Área do país na tela (pixels²), na projeção dada. */
export function areaNaTela(pais: PaisGeo, projecao: GeoProjection): number {
  return geoPath(projecao).area(pais)
}

/** Área real do país, em km², calculada na esfera a partir do próprio contorno do mapa. */
export function areaRealKm2(pais: PaisGeo): number {
  return geoArea(pais) * RAIO_TERRA * RAIO_TERRA
}

/** Quantas vezes o país A parece maior que o B no mapa, e quantas vezes ele é, de fato. */
export function comparar(a: PaisGeo, b: PaisGeo, projecao: GeoProjection): { aparente: number; real: number } {
  return { aparente: areaNaTela(a, projecao) / areaNaTela(b, projecao), real: areaRealKm2(a) / areaRealKm2(b) }
}
