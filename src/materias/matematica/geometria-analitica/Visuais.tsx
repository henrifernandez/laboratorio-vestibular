import type { ReactNode } from 'react'
import { Circle, Line, Plot, Point, Polyline, Text } from 'mafs'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { Cena } from '@/sim/Cena'
import { fracaoTxt, type Pt } from './calculo'
import type { DadosCirculo, DadosMedidaGA } from './geradores'

/** Plano cartesiano quadrado, com os eixos na mesma escala. */
export function Plano({ children, lim = 8, altura = 330, rotulo }: { children: ReactNode; lim?: number; altura?: number; rotulo: string }) {
  return (
    <Cena janela={{ xmin: -lim, xmax: lim, ymin: -lim, ymax: lim }} altura={altura} proporcao passoX={2} passoY={2} rotulo={rotulo}>
      {children}
    </Cena>
  )
}

export function RetaMN({ m, n, cor = 'var(--accent)', estilo = 'solid' }: { m: number; n: number; cor?: string; estilo?: 'solid' | 'dashed' }) {
  return <Plot.OfX y={(x) => m * x + n} domain={[-20, 20]} color={cor} style={estilo} weight={3} />
}

export function Ponto({ p, rotulo, cor = 'var(--erro)', pos = 'ne' }: { p: Pt; rotulo?: string; cor?: string; pos?: 'ne' | 'nw' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' }) {
  return (
    <g>
      <Point x={p.x} y={p.y} color={cor} />
      {rotulo && (
        <Text x={p.x} y={p.y} attach={pos} attachDistance={12} size={13}>
          {rotulo}
        </Text>
      )}
    </g>
  )
}

/** Triângulo da inclinação: Δx na horizontal e Δy na vertical entre A e B. */
export function TrianguloInclinacao({ a, b }: { a: Pt; b: Pt }) {
  const canto = { x: b.x, y: a.y }
  return (
    <>
      <Polyline points={[[a.x, a.y], [canto.x, canto.y], [b.x, b.y]]} color="var(--ink-muted)" weight={2} svgPolylineProps={{ fill: 'none', strokeDasharray: '6 4' }} />
      <Text x={(a.x + b.x) / 2} y={a.y} attach={b.y >= a.y ? 's' : 'n'} attachDistance={10} size={13} color="var(--ink-muted)">
        {`Δx = ${fracaoTxt(b.x - a.x)}`}
      </Text>
      <Text x={b.x} y={(a.y + b.y) / 2} attach={b.x >= a.x ? 'e' : 'w'} attachDistance={10} size={13} color="var(--ink-muted)">
        {`Δy = ${fracaoTxt(b.y - a.y)}`}
      </Text>
    </>
  )
}

export function VisualCirculo({ inst }: { inst: InstanciaMulti<DadosCirculo> }) {
  const d = inst.dados as DadosCirculo
  if (!d.figura) return null
  const lim = Math.max(8, Math.abs(d.h) + d.r + 2, Math.abs(d.k) + d.r + 2)
  return (
    <Plano lim={Math.ceil(lim / 2) * 2} rotulo="Circunferência desenhada no plano cartesiano">
      <Circle center={[d.h, d.k]} radius={d.r} color="var(--accent)" fillOpacity={0.08} weight={3} />
      <Point x={d.h} y={d.k} color="var(--accent)" />
      <Text x={d.h} y={d.k} attach="se" attachDistance={10} size={13}>
        C
      </Text>
    </Plano>
  )
}

export function VisualMedida({ inst }: { inst: InstanciaNum<DadosMedidaGA> }) {
  const d = inst.dados as DadosMedidaGA
  if (!d.p || !d.q) return null
  const lim = Math.max(8, Math.ceil(Math.max(...[d.p.x, d.p.y, d.q.x, d.q.y].map(Math.abs)) / 2) * 2 + 2)
  return (
    <Plano lim={lim} rotulo="Plano cartesiano com os pontos A e B">
      <Line.Segment point1={[d.p.x, d.p.y]} point2={[d.q.x, d.q.y]} color="var(--accent)" weight={3} />
      <Ponto p={d.p} rotulo="A" />
      <Ponto p={d.q} rotulo="B" />
    </Plano>
  )
}
