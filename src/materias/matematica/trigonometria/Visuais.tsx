import { Circle, Line, MovablePoint, Plot, Point, Polyline, Text } from 'mafs'
import type { InstanciaMulti } from '@/desafios/simples'
import { Cena } from '@/sim/Cena'
import { ANGULOS_NOTAVEIS, exato, grausParaRad, normalizar, quadrante, sinais, textoRad } from './calculo'
import type { DadosAngulo } from './geradores'

const fmt = (n: number, c = 3) => String(Math.round(n * 10 ** c) / 10 ** c).replace('.', ',')

export interface OpcoesCirculo {
  seno?: boolean
  cosseno?: boolean
  tangente?: boolean
  notaveis?: boolean
  quadrantes?: boolean
  radianos?: boolean
}

interface CirculoProps extends OpcoesCirculo {
  graus: number
  onChange?: (g: number) => void
  passo?: number
  altura?: number
}

const NOTAVEIS_ROTULO = ANGULOS_NOTAVEIS.filter((g) => g < 360)

/** Círculo trigonométrico: o ponto (cos θ, sen θ) pode ser arrastado; seno, cosseno e tangente aparecem como segmentos. */
export function CirculoTrig({ graus, onChange, passo = 5, altura = 330, seno = true, cosseno = true, tangente = false, notaveis = true, quadrantes = true, radianos = false }: CirculoProps) {
  const r = grausParaRad(graus)
  const c = Math.cos(r)
  const s = Math.sin(r)
  const arco: [number, number][] = Array.from({ length: 41 }, (_, k) => {
    const t = (grausParaRad(normalizar(graus)) * k) / 40
    return [0.28 * Math.cos(t), 0.28 * Math.sin(t)]
  })
  const tanDefinida = Math.abs(c) > 1e-6
  const t = tanDefinida ? s / c : 0
  const tanVisivel = tangente && tanDefinida && Math.abs(t) < 1.45

  return (
    <Cena janela={{ xmin: -1.55, xmax: 1.55, ymin: -1.55, ymax: 1.55 }} altura={altura} proporcao passoX={0.5} passoY={0.5} rotulo={`Círculo trigonométrico com o ângulo de ${fmt(normalizar(graus), 1)} graus`}>
      {quadrantes && (
        <>
          <Text x={0.5} y={0.5} size={15} color="var(--ink-muted)">I</Text>
          <Text x={-0.5} y={0.5} size={15} color="var(--ink-muted)">II</Text>
          <Text x={-0.5} y={-0.5} size={15} color="var(--ink-muted)">III</Text>
          <Text x={0.5} y={-0.5} size={15} color="var(--ink-muted)">IV</Text>
        </>
      )}
      <Circle center={[0, 0]} radius={1} color="var(--ink)" fillOpacity={0.04} weight={2} />
      {notaveis &&
        NOTAVEIS_ROTULO.map((g) => (
          <g key={g}>
            <Point x={Math.cos(grausParaRad(g))} y={Math.sin(grausParaRad(g))} color="var(--ink-muted)" opacity={0.7} />
            <Text x={1.2 * Math.cos(grausParaRad(g))} y={1.2 * Math.sin(grausParaRad(g))} size={11} color="var(--ink-muted)">
              {radianos ? textoRad(g) : `${g}°`}
            </Text>
          </g>
        ))}
      {tanVisivel && (
        <>
          <Line.Segment point1={[1, 0]} point2={[1, t]} color="var(--aviso)" weight={3} />
          <Line.Segment point1={[0, 0]} point2={[1, t]} color="var(--aviso)" style="dashed" weight={1.5} opacity={0.6} />
        </>
      )}
      {cosseno && <Line.Segment point1={[0, 0]} point2={[c, 0]} color="var(--accent)" weight={4} />}
      {seno && <Line.Segment point1={[c, 0]} point2={[c, s]} color="var(--ok)" weight={4} />}
      <Line.Segment point1={[0, 0]} point2={[c, s]} color="var(--ink)" weight={2} />
      <Polyline points={arco} color="var(--ink)" weight={1.5} svgPolylineProps={{ fill: 'none' }} />
      {onChange ? (
        <MovablePoint
          point={[c, s]}
          color="var(--erro)"
          constrain={([x, y]) => {
            const g = (Math.atan2(y, x) * 180) / Math.PI
            const sn = Math.round(normalizar(g) / passo) * passo
            return [Math.cos(grausParaRad(sn)), Math.sin(grausParaRad(sn))]
          }}
          onMove={([x, y]) => onChange(Math.round(normalizar((Math.atan2(y, x) * 180) / Math.PI) / passo) * passo)}
        />
      ) : (
        <Point x={c} y={s} color="var(--erro)" />
      )}
    </Cena>
  )
}

/** Gráfico de seno e cosseno em função do ângulo, com o ângulo atual marcado. */
export function OndaTrig({ graus, seno = true, cosseno = true, altura = 240 }: { graus: number; seno?: boolean; cosseno?: boolean; altura?: number }) {
  const g = normalizar(graus)
  const r = grausParaRad(g)
  return (
    <Cena janela={{ xmin: -25, xmax: 385, ymin: -1.5, ymax: 1.5 }} altura={altura} passoX={90} passoY={0.5} rotulo="Gráficos de seno e cosseno de 0° a 360°">
      {seno && <Plot.OfX y={(x) => Math.sin(grausParaRad(x))} domain={[0, 360]} color="var(--ok)" weight={3} />}
      {cosseno && <Plot.OfX y={(x) => Math.cos(grausParaRad(x))} domain={[0, 360]} color="var(--accent)" weight={3} />}
      <Line.Segment point1={[g, -1.4]} point2={[g, 1.4]} color="var(--erro)" style="dashed" weight={1.5} />
      {seno && <Point x={g} y={Math.sin(r)} color="var(--ok)" />}
      {cosseno && <Point x={g} y={Math.cos(r)} color="var(--accent)" />}
    </Cena>
  )
}

export function Legenda({ seno = true, cosseno = true, tangente = false }: { seno?: boolean; cosseno?: boolean; tangente?: boolean }) {
  return (
    <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
      {cosseno && <span><span aria-hidden="true" style={{ color: 'var(--accent)' }}>━</span> cosseno (horizontal)</span>}
      {seno && <span><span aria-hidden="true" style={{ color: 'var(--ok)' }}>━</span> seno (vertical)</span>}
      {tangente && <span><span aria-hidden="true" style={{ color: 'var(--aviso)' }}>━</span> tangente</span>}
    </p>
  )
}

/** Valores de sen, cos e tg em texto: exato nos ângulos notáveis, decimal nos demais. */
export function valoresTexto(graus: number) {
  const notavel = Number.isInteger(graus) && (graus % 30 === 0 || graus % 45 === 0)
  const r = grausParaRad(graus)
  const dec = (v: number) => (Math.abs(v) < 1e-9 ? '0' : fmt(v))
  if (notavel) {
    const ex = { sen: exato('sen', graus), cos: exato('cos', graus), tan: exato('tan', graus) }
    return { sen: `${ex.sen.texto} ≈ ${dec(ex.sen.num)}`, cos: `${ex.cos.texto} ≈ ${dec(ex.cos.num)}`, tan: ex.tan.existe ? `${ex.tan.texto} ≈ ${dec(ex.tan.num)}` : 'não existe' }
  }
  const c = Math.cos(r)
  return { sen: dec(Math.sin(r)), cos: dec(c), tan: Math.abs(c) < 1e-9 ? 'não existe' : dec(Math.tan(r)) }
}

export function VisualAngulo({ inst }: { inst: InstanciaMulti<DadosAngulo> }) {
  const d = inst.dados as DadosAngulo
  return <CirculoTrig graus={d.graus} seno={false} cosseno={false} notaveis radianos={d.rad} altura={280} />
}

export function TabelaSinais({ destaque }: { destaque?: number }) {
  return (
    <table className="num w-full max-w-sm border-collapse text-center" aria-label="Sinais de seno, cosseno e tangente em cada quadrante">
      <thead>
        <tr className="bg-[var(--surface-2)]">
          <th className="border border-[var(--line)] p-1.5">Quadrante</th>
          <th className="border border-[var(--line)] p-1.5">sen</th>
          <th className="border border-[var(--line)] p-1.5">cos</th>
          <th className="border border-[var(--line)] p-1.5">tan</th>
        </tr>
      </thead>
      <tbody>
        {([1, 2, 3, 4] as const).map((q) => {
          const s = sinais(q)
          const on = destaque === q
          return (
            <tr key={q} style={on ? { background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 700 } : undefined}>
              <td className="border border-[var(--line)] p-1.5">{q}º</td>
              <td className="border border-[var(--line)] p-1.5">{s.sen}</td>
              <td className="border border-[var(--line)] p-1.5">{s.cos}</td>
              <td className="border border-[var(--line)] p-1.5">{s.tan}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export { quadrante }
