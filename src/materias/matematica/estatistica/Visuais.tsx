import { Line, MovablePoint, Point, Text } from 'mafs'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { Cena } from '@/sim/Cena'
import { media, mediana, moda, type Classe } from './calculo'
import { fmt, type DadosCenario, type DadosExtremo, type DadosHistograma, type DadosMedida } from './geradores'

interface PontosProps {
  valores: number[]
  /** onde termina o eixo (padrão: máximo + folga) */
  limite?: number
  mostrarMedia?: boolean
  mostrarMediana?: boolean
  mostrarModa?: boolean
  extremo?: number
  /** se informado, os pontos podem ser arrastados */
  onMudar?: (v: number[]) => void
  passo?: number
  rotulo?: string
}

/** Diagrama de pontos: cada valor é um ponto sobre a reta; pontos iguais se empilham. */
export function PontosNaReta({ valores, limite, mostrarMedia, mostrarMediana, mostrarModa, extremo, onMudar, passo = 1, rotulo = 'Diagrama de pontos dos valores' }: PontosProps) {
  const max = limite ?? Math.max(10, ...valores) + 2
  const ordenados = valores.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v || a.i - b.i)
  const pilha = new Map<number, number>()
  const alturas = new Map<number, number>()
  for (const { v, i } of ordenados) {
    const k = pilha.get(v) ?? 0
    pilha.set(v, k + 1)
    alturas.set(i, k + 1)
  }
  const altura = Math.max(3, ...pilha.values()) + 1.5
  const janela = { xmin: -max * 0.03, xmax: max * 1.03, ymin: -1.3, ymax: altura }
  const m = media(valores)
  const med = mediana(valores)
  const mo = moda(valores)
  const passoMarca = max <= 12 ? 1 : max <= 30 ? 2 : max <= 60 ? 5 : 10
  const marcas = Array.from({ length: Math.floor(max / passoMarca) + 1 }, (_, k) => k * passoMarca)

  return (
    <div className="grid gap-2">
      <Cena janela={janela} grade={false} altura={230} rotulo={rotulo}>
        <Line.Segment point1={[0, 0]} point2={[max, 0]} color="var(--ink)" weight={2} />
        {marcas.map((t) => (
          <g key={t}>
            <Line.Segment point1={[t, -0.12]} point2={[t, 0.12]} color="var(--ink)" weight={1.5} />
            <Text x={t} y={-0.25} attach="s" size={12}>
              {String(t)}
            </Text>
          </g>
        ))}
        {mostrarMedia && valores.length > 0 && (
          <g>
            <Line.Segment point1={[m, -0.1]} point2={[m, altura - 0.4]} color="var(--accent)" weight={2.5} />
            <Text x={m} y={altura - 0.4} attach="n" size={13} color="var(--accent)">{`média ${fmt(m)}`}</Text>
          </g>
        )}
        {mostrarMediana && valores.length > 0 && (
          <g>
            <Line.Segment point1={[med, -0.1]} point2={[med, altura - 0.4]} color="var(--ok)" style="dashed" weight={2.5} />
            <Text x={med} y={altura - 1.15} attach={med >= m ? 'e' : 'w'} attachDistance={8} size={13} color="var(--ok)">{`mediana ${fmt(med)}`}</Text>
          </g>
        )}
        {mostrarModa && mo.map((x) => <Text key={x} x={x} y={-0.85} attach="s" size={12} color="var(--aviso)">{`▲ moda ${fmt(x)}`}</Text>)}
        {valores.map((v, i) => {
          const y = (alturas.get(i) ?? 1) * 0.55
          const cor = extremo !== undefined && v === extremo ? 'var(--erro)' : 'var(--accent)'
          return onMudar ? (
            <MovablePoint
              key={i}
              point={[v, y]}
              color={cor}
              constrain={([x]) => [Math.min(max, Math.max(0, Math.round(x / passo) * passo)), y]}
              onMove={([x]) => onMudar(valores.map((q, k) => (k === i ? x : q)))}
            />
          ) : (
            <Point key={i} x={v} y={y} color={cor} />
          )
        })}
      </Cena>
    </div>
  )
}

/** Histograma em SVG. Com mostrarValores, escreve a frequência acima de cada barra. */
export function Histograma({ classes, mostrarValores = false, rotulo = 'Histograma' }: { classes: Classe[]; mostrarValores?: boolean; rotulo?: string }) {
  const max = Math.max(...classes.map((c) => c.freq), 1)
  const topo = Math.ceil(max / 2) * 2
  const L = 320
  const A = 190
  const mx = 34
  const my = 12
  const larg = (L - mx - 8) / classes.length
  const ticks = Array.from({ length: topo / 2 + 1 }, (_, k) => k * 2)
  return (
    <figure className="cartao m-0 p-3">
      <svg viewBox={`0 0 ${L} ${A + 30}`} role="img" aria-label={rotulo} className="w-full">
        {ticks.map((t) => {
          const y = my + A - 20 - (t / topo) * (A - 20 - my)
          return (
            <g key={t}>
              <line x1={mx} x2={L - 8} y1={y} y2={y} stroke="var(--grade)" strokeWidth="1" />
              <text x={mx - 6} y={y + 4} textAnchor="end" fontSize="11" fill="var(--ink-muted)" className="num">
                {t}
              </text>
            </g>
          )
        })}
        {classes.map((c, k) => {
          const h = (c.freq / topo) * (A - 20 - my)
          const x = mx + k * larg
          return (
            <g key={k}>
              <rect x={x + 1} y={my + A - 20 - h} width={larg - 2} height={h} fill="var(--accent)" opacity="0.85" />
              {mostrarValores && (
                <text x={x + larg / 2} y={my + A - 20 - h - 3} textAnchor="middle" fontSize="11" fill="var(--ink)" className="num">
                  {c.freq}
                </text>
              )}
              <text x={x} y={A + 6} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" className="num">
                {c.de}
              </text>
              {k === classes.length - 1 && (
                <text x={x + larg} y={A + 6} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" className="num">
                  {c.ate}
                </text>
              )}
            </g>
          )
        })}
        <line x1={mx} x2={L - 8} y1={my + A - 20} y2={my + A - 20} stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={mx} x2={mx} y1={my} y2={my + A - 20} stroke="var(--ink)" strokeWidth="1.5" />
        <text x={L / 2} y={A + 24} textAnchor="middle" fontSize="11" fill="var(--ink-muted)">
          classes (valores)
        </text>
      </svg>
      <table className="sr-only">
        <caption>{rotulo}: frequência de cada classe</caption>
        <tbody>
          {classes.map((c) => (
            <tr key={c.de}>
              <th scope="row">{`de ${c.de} a menos de ${c.ate}`}</th>
              <td>{c.freq}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export function Chips({ valores }: { valores: (number | string)[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Valores">
      {valores.map((v, i) => (
        <li key={i} className="chip num px-3 py-1.5 text-base">
          {typeof v === 'number' ? fmt(v) : v}
        </li>
      ))}
    </ul>
  )
}

export function VisualExtremo({ inst }: { inst: InstanciaMulti<DadosExtremo> }) {
  const d = inst.dados as DadosExtremo
  return <PontosNaReta valores={d.antes} limite={Math.max(...d.antes, d.extremo) + 5} extremo={d.acao === 'retirou' ? d.extremo : undefined} rotulo="Valores do conjunto original" />
}

export function VisualMedida({ inst }: { inst: InstanciaNum<DadosMedida> }) {
  const d = inst.dados as DadosMedida
  if (d.valores) return <Chips valores={d.valores} />
  return (
    <div className="overflow-x-auto">
      <table className="num w-full max-w-sm border-collapse text-center" aria-label="Tabela de frequências">
        <thead>
          <tr className="bg-[var(--surface-2)]">
            <th className="border border-[var(--line)] p-2">{d.rotuloValor ?? 'Valor'}</th>
            <th className="border border-[var(--line)] p-2">Frequência</th>
          </tr>
        </thead>
        <tbody>
          {(d.tabela ?? []).map((t) => (
            <tr key={t.valor}>
              <td className="border border-[var(--line)] p-2">{t.valor}</td>
              <td className="border border-[var(--line)] p-2">{t.freq}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function VisualHistograma({ inst }: { inst: InstanciaNum<DadosHistograma> }) {
  return <Histograma classes={(inst.dados as DadosHistograma).classes} rotulo="Histograma das notas: cada barra mostra quantos alunos tiraram uma nota na faixa" />
}

export function VisualCenario({ inst }: { inst: InstanciaMulti<DadosCenario> }) {
  const d = inst.dados as DadosCenario
  return <Chips valores={d.categorias ?? d.dados} />
}
