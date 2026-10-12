import { Moon, Sun } from 'lucide-react'
import type { Cidade } from '@/conteudo/geografia/fusos'
import { CIDADES } from '@/conteudo/geografia/fusos'
import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { Mapa, type Extensao, type Quadro } from '../comum/mapa'
import { ehDia, formatarHora, formatarUtc, fusoTeorico, nomeDoDia } from './calculo'

const f = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const sinal = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${f(Math.abs(n))}`

/* ------------------------------------------------------------------ mapa-múndi com fusos */

const EXTENSAO: Extensao = [
  [-180, -58],
  [180, 84],
]
const FUSOS = Array.from({ length: 25 }, (_, k) => k - 12)

interface PropsMapa {
  /** cidades com nome ao lado do ponto */
  rotuladas?: Cidade[]
  /** cidades só com o ponto */
  pontos?: Cidade[]
  /** fuso (-12 a 12) em destaque */
  destaque?: number | null
  /** longitude marcada por uma linha vertical */
  longitude?: number | null
}

/** Mapa-múndi com os 24 fusos de 15° em faixas, os meridianos centrais e as cidades pedidas. */
export function MapaFusos({ rotuladas = [], pontos = [], destaque = null, longitude = null }: PropsMapa) {
  const [ref, largura] = useLargura<HTMLDivElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const descricao = `Mapa-múndi dividido em 24 fusos horários de 15 graus de longitude, de UTC−12, no extremo oeste, a UTC+12, no extremo leste, com Greenwich (UTC) no centro.${destaque !== null ? ` Em destaque, o fuso ${formatarUtc(destaque)}.` : ''}${longitude !== null ? ` Linha vertical na longitude ${f(Math.abs(longitude), 1)}° ${longitude < 0 ? 'oeste' : 'leste'}.` : ''}${rotuladas.length ? ` Cidades marcadas: ${rotuladas.map((c) => `${c.nome}, ${formatarUtc(c.utc)}`).join('; ')}.` : ''}`
  const camada = (q: Quadro) => {
    const x = (lon: number) => (q.projetar([Math.max(-180, Math.min(180, lon)), 0]) as [number, number])[0]
    return (
      <g>
        {FUSOS.map((u) => {
          const a = x(u * 15 - 7.5)
          const b = x(u * 15 + 7.5)
          const marcado = destaque === u
          return <rect key={u} x={a} y={0} width={Math.max(0, b - a)} height={q.altura} fill={marcado ? 'var(--geo-nova)' : 'var(--ink)'} fillOpacity={marcado ? 0.35 : u % 2 === 0 ? 0.1 : 0} />
        })}
        {FUSOS.map((u) => (
          <line key={`l${u}`} x1={x(u * 15 - 7.5)} x2={x(u * 15 - 7.5)} y1={0} y2={q.altura} stroke="var(--ink)" strokeOpacity={0.25} strokeWidth={0.7} />
        ))}
        <line x1={x(0)} x2={x(0)} y1={0} y2={q.altura} stroke="var(--ink)" strokeWidth={1.6} />
        {FUSOS.filter((u) => u % 3 === 0).map((u) => (
          <text key={`t${u}`} x={Math.min(Math.max(x(u * 15), 3), q.largura - 3)} y={fs(12) + 3} textAnchor={x(u * 15) < 24 ? 'start' : x(u * 15) > q.largura - 24 ? 'end' : 'middle'} fontSize={fs(12)} fontWeight={600} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            {u === 0 ? '0' : sinal(u)}
          </text>
        ))}
        {longitude !== null && <line x1={x(longitude)} x2={x(longitude)} y1={0} y2={q.altura} stroke="var(--geo-quente)" strokeWidth={2.5} />}
        {[...pontos, ...rotuladas].map((c) => {
          const p = q.projetar([c.lon, c.lat])
          return p ? <circle key={c.id} cx={p[0]} cy={p[1]} r={4.5} fill="var(--geo-quente)" stroke="var(--ink)" strokeWidth={1.5} /> : null
        })}
        {rotuladas.map((c) => {
          const p = q.projetar([c.lon, c.lat])
          if (!p) return null
          const direita = p[0] < q.largura * 0.7
          return (
            <text key={`n${c.id}`} x={p[0] + (direita ? 8 : -8)} y={p[1] + 4} textAnchor={direita ? 'start' : 'end'} fontSize={fs(12)} fontWeight={600} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
              {c.curto}
            </text>
          )
        })}
      </g>
    )
  }
  return (
    <div ref={ref}>
      <Mapa extensao={EXTENSAO} rotulo={descricao} sobre={camada} />
    </div>
  )
}

/* ------------------------------------------------------------------ faixa de fusos */

export interface MarcaFaixa {
  utc: number
  rotulo: string
}

/** Faixa de UTC−12 a UTC+12 com marcas e, se houver duas, a diferença entre elas. */
export function FaixaFusos({ marcas }: { marcas: MarcaFaixa[] }) {
  const W = 640
  const H = 150
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const x0 = 20
  const larg = 600
  const cel = larg / 25
  const x = (u: number) => x0 + (u + 12.5) * cel
  const yFaixa = 54
  const alturaFaixa = 34
  const dif = marcas.length === 2 ? (marcas[1] as MarcaFaixa).utc - (marcas[0] as MarcaFaixa).utc : null
  const aria = `Faixa dos fusos de UTC−12 a UTC+12. ${marcas.map((m) => `${m.rotulo}: ${formatarUtc(m.utc)}`).join('; ')}.${dif !== null ? ` Diferença do destino para a origem: ${sinal(dif)} horas.` : ''}`
  const ordenadas = [...marcas].sort((a, b) => a.utc - b.utc)
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {Array.from({ length: 25 }, (_, k) => k - 12).map((u) => (
        <g key={u}>
          <rect x={x(u) - cel / 2} y={yFaixa} width={cel} height={alturaFaixa} fill="var(--ink)" fillOpacity={u % 2 === 0 ? 0.1 : 0.03} stroke="var(--grade)" strokeWidth={0.8} />
          {u % 3 === 0 && (
            <text x={x(u)} y={yFaixa + alturaFaixa + 18} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">
              {u === 0 ? '0' : sinal(u)}
            </text>
          )}
        </g>
      ))}
      {dif !== null && (
        <g>
          <line x1={x((marcas[0] as MarcaFaixa).utc)} x2={x((marcas[1] as MarcaFaixa).utc)} y1={yFaixa + alturaFaixa / 2} y2={yFaixa + alturaFaixa / 2} stroke="var(--geo-quente)" strokeWidth={3} />
          <text x={(x((marcas[0] as MarcaFaixa).utc) + x((marcas[1] as MarcaFaixa).utc)) / 2} y={yFaixa + alturaFaixa / 2 - 6} textAnchor="middle" fontSize={fs(12)} fontWeight={700} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            {sinal(dif)} h
          </text>
        </g>
      )}
      {ordenadas.map((m, i) => {
        const cima = i % 2 === 0
        const cx = Math.min(Math.max(x(m.utc), 60), W - 60)
        return (
          <g key={`${m.rotulo}-${m.utc}`}>
            <line x1={x(m.utc)} x2={x(m.utc)} y1={yFaixa + (cima ? 0 : alturaFaixa)} y2={cima ? 36 : yFaixa + alturaFaixa + 4} stroke="var(--ink)" strokeWidth={1.5} />
            <circle cx={x(m.utc)} cy={yFaixa + alturaFaixa / 2} r={6} fill="var(--geo-quente)" stroke="var(--ink)" strokeWidth={1.5} />
            <text x={cx} y={cima ? 28 : yFaixa + alturaFaixa + 18 + fs(12) + 6} textAnchor="middle" fontSize={fs(13)} fontWeight={600} fill="var(--ink)">
              {m.rotulo} ({formatarUtc(m.utc)})
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ relógios e tabelas */

/** Hora de cada cidade, quando na cidade de origem o relógio marca `minutosOrigem` (e o dia da semana `diaOrigem`). */
export function TabelaHoras({ linhas }: { linhas: { cidade: Cidade; minutos: number; dia: number }[] }) {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="num w-full border-collapse text-sm">
        <caption className="sr-only">Hora e dia da semana em cada cidade</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Cidade</th>
            <th scope="col" className="px-1">Fuso</th>
            <th scope="col" className="px-1">Hora</th>
            <th scope="col" className="px-1">Dia</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ cidade, minutos, dia }) => (
            <tr key={cidade.id} className="border-b border-[var(--line)]">
              <th scope="row" className="py-1 pr-2 text-left font-normal">{cidade.nome}</th>
              <td className="px-1">{formatarUtc(cidade.utc)}</td>
              <td className="px-1">
                <span className="inline-flex items-center gap-1">
                  {ehDia(minutos) ? <Sun size={14} aria-label="dia" /> : <Moon size={14} aria-label="noite" />}
                  <strong>{formatarHora(minutos)}</strong>
                </span>
              </td>
              <td className="px-1">{nomeDoDia(dia)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Fuso teórico (pela longitude) e fuso oficial de cada cidade. */
export function TabelaFusos({ cidades = CIDADES }: { cidades?: Cidade[] }) {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="num w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Fuso teórico e fuso oficial</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Cidade</th>
            <th scope="col" className="px-1">Longitude</th>
            <th scope="col" className="px-1">Teórico</th>
            <th scope="col" className="px-1">Oficial</th>
          </tr>
        </thead>
        <tbody>
          {cidades.map((c) => (
            <tr key={c.id} className="border-b border-[var(--line)]">
              <th scope="row" className="py-1 pr-2 text-left font-normal">{c.nome}</th>
              <td className="px-1">{f(Math.abs(c.lon), 1)}° {c.lon < 0 ? 'O' : 'L'}</td>
              <td className="px-1">{formatarUtc(fusoTeorico(c.lon))}</td>
              <td className="px-1">{formatarUtc(c.utc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
