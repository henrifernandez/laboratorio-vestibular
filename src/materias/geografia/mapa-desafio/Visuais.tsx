import { useMemo } from 'react'
import { geoCentroid, geoGraticule10, geoPath } from 'd3-geo'
import { paisPorId } from '@/conteudo/geografia/mapa-desafio'
import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { Mapa, usePaises, type Extensao, type Quadro } from '../comum/mapa'
import { formatarCoordenada, formatarEscala, umCentimetro } from './calculo'
import { ANTARTIDA, criarProjecao, LARGURA_MUNDO, type TipoProjecao } from './projecoes'

export type RegiaoMapa = 'america-do-sul' | 'mundo'

const EXTENSOES: Record<RegiaoMapa, Extensao> = {
  'america-do-sul': [
    [-84, -57],
    [-32, 14],
  ],
  mundo: [
    [-180, -58],
    [180, 84],
  ],
}

export interface PontoMapa {
  lat: number
  lon: number
  /** letra ou número escrito ao lado do ponto */
  rotulo?: string
}

export interface LinhaMapa {
  tipo: 'paralelo' | 'meridiano'
  valor: number
  /** texto curto ao lado da linha */
  rotulo?: string
}

interface PropsMapa {
  regiao: RegiaoMapa
  /** cor de cada país em destaque, pelo id */
  destaques?: Record<string, string>
  /** ids dos países que recebem um número no centro (1, 2, 3...), na ordem dada */
  numerados?: string[]
  pontos?: PontoMapa[]
  linhas?: LinhaMapa[]
  /** descrição do mapa; recebe o centro (lat, lon) do país em `centroDe`, quando já houver */
  descricao: string
  /** país cujo centro aproximado entra no texto alternativo */
  centroDe?: string
}

/** Cores de destaque: Brasil, país da pergunta e países vizinhos. */
export const COR_BRASIL = 'var(--geo-brasil)'
export const COR_DESTAQUE = 'var(--geo-quente)'
export const COR_VIZINHO = 'var(--geo-nova)'

/** Mapa de países com destaques, pontos, linhas de referência e países numerados. */
export function MapaPaises({ regiao, destaques = {}, numerados = [], pontos = [], linhas = [], descricao, centroDe }: PropsMapa) {
  const [ref, largura] = useLargura<HTMLDivElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const { paises } = usePaises()
  const centro = useMemo(() => {
    if (!centroDe || !paises) return null
    const maior = paises.find((p) => String(p.id) === centroDe)
    if (!maior) return null
    const [lon, lat] = geoCentroid(maior)
    return { lat: Math.round(lat), lon: Math.round(lon) }
  }, [centroDe, paises])
  const rotulo = `${descricao}${centro ? ` Posição aproximada do centro do país: ${formatarCoordenada(centro)}.` : ''}`
  const camada = (q: Quadro) => {
    const proj = q.projetar
    const [[lon0, lat0], [lon1, lat1]] = EXTENSOES[regiao]
    return (
      <g>
        {linhas.map((l) => {
          const a = l.tipo === 'paralelo' ? proj([lon0, l.valor]) : proj([l.valor, lat1])
          const b = l.tipo === 'paralelo' ? proj([lon1, l.valor]) : proj([l.valor, lat0])
          if (!a || !b) return null
          return (
            <g key={`${l.tipo}${l.valor}`}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="6 4" />
              {l.rotulo && (
                <text x={l.tipo === 'paralelo' ? 4 : a[0] + 3} y={l.tipo === 'paralelo' ? a[1] - 4 : fs(12) + 2} fontSize={fs(12)} fontWeight={600} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                  {l.rotulo}
                </text>
              )}
            </g>
          )
        })}
        {numerados.map((id, k) => {
          const pais = paises?.find((p) => String(p.id) === id)
          if (!pais) return null
          const [lon, lat] = geoCentroid(pais)
          const p = proj([lon, lat])
          return p ? (
            <g key={id}>
              <circle cx={p[0]} cy={p[1]} r={fs(12) * 0.85} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.2} />
              <text x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="central" fontSize={fs(12)} fontWeight={700} fill="var(--ink)">
                {k + 1}
              </text>
            </g>
          ) : null
        })}
        {pontos.map((pt, k) => {
          const p = proj([pt.lon, pt.lat])
          if (!p) return null
          return (
            <g key={k}>
              <circle cx={p[0]} cy={p[1]} r={5.5} fill="var(--geo-quente)" stroke="var(--ink)" strokeWidth={1.8} />
              {pt.rotulo && (
                <text x={p[0] + 9} y={p[1] - 7} fontSize={fs(14)} fontWeight={700} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                  {pt.rotulo}
                </text>
              )}
            </g>
          )
        })}
      </g>
    )
  }
  return (
    <div ref={ref}>
      <Mapa extensao={EXTENSOES[regiao]} rotulo={rotulo} cor={(p) => destaques[String(p.id)]} sobre={camada} />
    </div>
  )
}

/* ------------------------------------------------------------------ escala */

/** Régua de até 10 cm com a distância real de cada centímetro, na escala 1:denominador. */
export function EscalaSvg({ denominador, cm = null }: { denominador: number; cm?: number | null }) {
  const W = 640
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const x0 = 30
  const passo = 56
  const y = 56
  const km = (n: number) => (n * denominador) / 100_000
  const aria = `Régua de 0 a 10 centímetros na escala ${formatarEscala(denominador)}: cada centímetro equivale a ${umCentimetro(denominador)}.${cm !== null ? ` Medida marcada: ${cm.toLocaleString('pt-BR')} cm, que equivalem a ${km(cm).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km.` : ''}`
  return (
    <svg ref={ref} viewBox={`0 0 ${W} 130`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <text x={x0} y={24} fontSize={fs(14)} fontWeight={700} fill="var(--ink)">
        Escala {formatarEscala(denominador)}: 1 cm = {umCentimetro(denominador)}
      </text>
      <rect x={x0} y={y} width={passo * 10} height={16} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={x0 + i * passo} y={y} width={passo} height={16} fill="var(--ink)" fillOpacity={i % 2 === 0 ? 0.55 : 0} />
      ))}
      {[0, 2, 4, 6, 8, 10].map((n) => (
        <g key={n}>
          <line x1={x0 + n * passo} x2={x0 + n * passo} y1={y + 16} y2={y + 24} stroke="var(--ink)" strokeWidth={1.2} />
          <text x={x0 + n * passo} y={y + 24 + fs(12) + 2} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">
            {n === 0 ? '0' : `${n} cm`}
          </text>
        </g>
      ))}
      <text x={x0} y={y - 8} fontSize={fs(12)} fill="var(--ink-muted)">
        no mapa
      </text>
      {cm !== null && cm <= 10 && (
        <g>
          <line x1={x0} x2={x0 + cm * passo} y1={y + 8} y2={y + 8} stroke="var(--geo-quente)" strokeWidth={5} />
          <circle cx={x0 + cm * passo} cy={y + 8} r={6} fill="var(--geo-quente)" stroke="var(--ink)" strokeWidth={1.5} />
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ projeções */

interface PropsProjecao {
  tipo: TipoProjecao
  /** países em destaque: o primeiro em vermelho, o segundo em azul */
  destaques?: [string, string?]
  descricao?: string
}

/** Mapa-múndi em uma das projeções, com a grade de 30° em 30°. A Antártida fica de fora. */
export function MapaProjecao({ tipo, destaques = ['304', '076'], descricao }: PropsProjecao) {
  const { paises, erro } = usePaises()
  const montado = useMemo(() => {
    const { projecao, altura } = criarProjecao(tipo, LARGURA_MUNDO)
    const caminho = geoPath(projecao)
    return { altura, caminho, grade: caminho(geoGraticule10()) ?? '' }
  }, [tipo])
  const nome = (id?: string) => (id ? paisPorId(id)?.nome : undefined)
  const aria = descricao ?? `Mapa-múndi na projeção ${tipo === 'mercator' ? 'de Mercator' : tipo === 'equal-earth' ? 'Equal Earth' : 'equirretangular'}, com grade de paralelos e meridianos. Em destaque: ${[nome(destaques[0]), nome(destaques[1])].filter(Boolean).join(' e ')}.`
  if (!paises) {
    return (
      <div role="status" className="grid min-h-40 place-items-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-muted)]">
        {erro ? 'Não foi possível carregar o mapa. Os números continuam valendo.' : 'Carregando o mapa…'}
      </div>
    )
  }
  const cor = (id: string) => (id === destaques[0] ? 'var(--geo-quente)' : id === destaques[1] ? 'var(--geo-frio)' : 'var(--surface-2)')
  return (
    <svg viewBox={`0 0 ${LARGURA_MUNDO} ${montado.altura}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--geo-agua)]">
      <path d={montado.grade} fill="none" stroke="var(--ink)" strokeOpacity={0.3} strokeWidth={0.6} />
      {paises
        .filter((p) => String(p.id) !== ANTARTIDA)
        .map((p) => {
          const d = montado.caminho(p)
          return d ? <path key={String(p.id ?? p.properties.name)} d={d} fill={cor(String(p.id))} stroke="var(--ink-muted)" strokeWidth={0.5} strokeLinejoin="round" /> : null
        })}
    </svg>
  )
}

/** Lista numerada dos países com número no mapa. */
export function ListaNumerada({ ids }: { ids: string[] }) {
  return (
    <ol className="m-0 grid list-decimal gap-0.5 pl-6 text-sm sm:grid-cols-2">
      {ids.map((id) => (
        <li key={id}>{paisPorId(id)?.nome ?? id}</li>
      ))}
    </ol>
  )
}
