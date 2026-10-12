import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { geoEquirectangular, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

/**
 * Mapa-múndi com os países do Natural Earth (domínio público), distribuídos pelo pacote world-atlas
 * (https://github.com/topojson/world-atlas). O arquivo de 110 m (cerca de 100 kB) só é baixado quando um mapa aparece na tela.
 */
export type PaisGeo = Feature<Geometry, { name: string }> & { id?: string | number }

export const FONTE_MAPA = 'Natural Earth (domínio público), pelo pacote world-atlas (naturalearthdata.com).'

let promessa: Promise<PaisGeo[]> | null = null

export function carregarPaises(): Promise<PaisGeo[]> {
  promessa ??= import('world-atlas/countries-110m.json').then((m) => {
    const topo = m.default as Topology
    const fc = feature(topo, topo.objects.countries as GeometryCollection) as FeatureCollection<Geometry, { name: string }>
    return fc.features as PaisGeo[]
  })
  return promessa
}

/** Países carregados sob demanda: `paises` é nulo enquanto carrega; `erro` fica verdadeiro se a carga falhar. */
export function usePaises() {
  const [paises, setPaises] = useState<PaisGeo[] | null>(null)
  const [erro, setErro] = useState(false)
  useEffect(() => {
    let vivo = true
    carregarPaises()
      .then((p) => vivo && setPaises(p))
      .catch(() => vivo && setErro(true))
    return () => {
      vivo = false
    }
  }, [])
  return { paises, erro }
}

export type Extensao = [[number, number], [number, number]] // [[lonMin, latMin], [lonMax, latMax]]
export type Projetar = (lonLat: [number, number]) => [number, number] | null

const caixa = ([[x0, y0], [x1, y1]]: Extensao): Feature<Polygon> => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
        [x0, y0],
      ],
    ],
  },
})

export interface Quadro {
  largura: number
  altura: number
  projetar: Projetar
  /** caminho SVG (atributo d) de cada país */
  caminhos: { pais: PaisGeo; d: string }[]
}

/** Projeção equirretangular ajustada a uma região; a altura sai da proporção da região. */
export function montarQuadro(paises: PaisGeo[], extensao: Extensao, largura = 640): Quadro {
  const [[lon0, lat0], [lon1, lat1]] = extensao
  const altura = Math.round((largura * (lat1 - lat0)) / (lon1 - lon0))
  const proj = geoEquirectangular().fitExtent(
    [
      [0, 0],
      [largura, altura],
    ],
    caixa(extensao),
  )
  const path = geoPath(proj)
  const projetar: Projetar = (p) => proj(p) as [number, number] | null
  const caminhos = paises
    .map((pais) => ({ pais, d: path(pais) }))
    .filter((c): c is { pais: PaisGeo; d: string } => !!c.d)
  return { largura, altura, projetar, caminhos }
}

interface Props {
  extensao: Extensao
  rotulo: string
  /** cor de preenchimento de cada país (id numérico ISO) */
  cor?: (pais: PaisGeo) => string | undefined
  /** camada extra, desenhada em cima dos países, no mesmo sistema de coordenadas */
  sobre?: (q: Quadro) => ReactNode
  /** camada extra, desenhada embaixo dos países */
  sob?: (q: Quadro) => ReactNode
  className?: string
}

/** Mapa de uma região do mundo. Enquanto os países carregam, mostra um quadro vazio com aviso. */
export function Mapa({ extensao, rotulo, cor, sobre, sob, className = '' }: Props) {
  const { paises, erro } = usePaises()
  const quadro = useMemo(() => (paises ? montarQuadro(paises, extensao) : null), [paises, extensao])
  const [[lon0, lat0], [lon1, lat1]] = extensao
  const proporcao = (lat1 - lat0) / (lon1 - lon0)
  return (
    <figure className={`m-0 ${className}`}>
      {quadro ? (
        <svg viewBox={`0 0 ${quadro.largura} ${quadro.altura}`} role="img" aria-label={rotulo} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--geo-agua)]">
          {sob?.(quadro)}
          {quadro.caminhos.map(({ pais, d }) => (
            <path key={String(pais.id ?? pais.properties.name)} d={d} fill={cor?.(pais) ?? 'var(--surface-2)'} stroke="var(--ink-muted)" strokeWidth={0.6} strokeLinejoin="round" />
          ))}
          {sobre?.(quadro)}
        </svg>
      ) : (
        <div role="status" className="grid place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-muted)]" style={{ aspectRatio: `1 / ${proporcao}` }}>
          {erro ? 'Não foi possível carregar o mapa. Os textos e as tabelas continuam valendo.' : 'Carregando o mapa…'}
        </div>
      )}
    </figure>
  )
}
