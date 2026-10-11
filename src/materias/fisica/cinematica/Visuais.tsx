import { Line, Plot, Point, Text, Vector } from 'mafs'
import type { InstanciaMulti } from '@/desafios/simples'
import { Cena } from '@/sim/Cena'
import { G, alturaEmX, alturaMaxima, alcance, lancamento, movimento, type Trecho } from './calculo'
import { AMOSTRAS, type DadosGraficos } from './geradores'

const f = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/* ------------------------------------------------------------------ gráficos pequenos */

interface MiniProps {
  y: number[]
  T: number
  rotuloY: string
  rotuloX?: string
  /** escala vertical comum, para comparar gráficos entre si */
  limite?: number
  cor?: string
  altura?: number
  rotulo: string
  /** instante marcado com uma linha vertical */
  marcador?: number
  degrau?: boolean
}

/** Gráfico simples em SVG a partir de amostras uniformes em [0, T]. */
export function MiniGrafico({ y, T, rotuloY, rotuloX = 't (s)', limite, cor = 'var(--accent)', altura = 120, rotulo, marcador }: MiniProps) {
  const m = limite ?? Math.max(1, ...y.map((v) => Math.abs(v))) * 1.15
  const W = 220
  const mx = 30
  const my = 10
  const A = altura
  const px = (i: number) => mx + (i / (y.length - 1)) * (W - mx - 8)
  const py = (v: number) => my + (A - 2 * my) / 2 - (v / m) * ((A - 2 * my) / 2)
  const pts = y.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ')
  const ticks = [-m, 0, m]
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${A + 14}`} role="img" aria-label={rotulo} className="w-full">
        <line x1={mx} x2={W - 8} y1={py(0)} y2={py(0)} stroke="var(--ink)" strokeWidth="1.3" />
        <line x1={mx} x2={mx} y1={my} y2={A - my} stroke="var(--ink)" strokeWidth="1.3" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={mx - 3} x2={mx} y1={py(t)} y2={py(t)} stroke="var(--ink)" />
            <text x={mx - 5} y={py(t) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" className="num">
              {f(t)}
            </text>
          </g>
        ))}
        <polyline points={pts} fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {marcador !== undefined && <line x1={mx + (marcador / T) * (W - mx - 8)} x2={mx + (marcador / T) * (W - mx - 8)} y1={my} y2={A - my} stroke="var(--erro)" strokeDasharray="4 3" strokeWidth="1.5" />}
        <text x={W - 6} y={A + 10} textAnchor="end" fontSize="10" fill="var(--ink-muted)">{`${rotuloX} → ${f(T)}`}</text>
        <text x={mx + 4} y={9} fontSize="10" fill="var(--ink-muted)">{rotuloY}</text>
      </svg>
    </figure>
  )
}

/** x(t), v(t) e a(t) do mesmo movimento, lado a lado (representações ligadas). */
export function TresGraficos({ inicio, trechos, marcador }: { inicio: { x0: number; v0: number }; trechos: Trecho[]; marcador?: number }) {
  const mov = movimento(inicio, trechos)
  const T = mov.duracao
  const amostra = (fn: (t: number) => number) => Array.from({ length: 97 }, (_, i) => fn((T * i) / 96))
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <MiniGrafico y={amostra(mov.x)} T={T} rotuloY="x (m)" rotulo="Gráfico da posição em função do tempo" marcador={marcador} />
      <MiniGrafico y={amostra(mov.v)} T={T} rotuloY="v (m/s)" cor="var(--ok)" rotulo="Gráfico da velocidade em função do tempo" marcador={marcador} />
      <MiniGrafico y={amostra((t) => mov.a(Math.min(t, T - 1e-9)))} T={T} rotuloY="a (m/s²)" cor="var(--aviso)" rotulo="Gráfico da aceleração em função do tempo" marcador={marcador} />
    </div>
  )
}

/* ------------------------------------------------------------------ pista com o carrinho */

export function Pista({ x, xmax = 10, rotulo = 'Pista com um carrinho' }: { x: number; xmax?: number; rotulo?: string }) {
  const W = 300
  const px = (v: number) => 12 + (v / xmax) * (W - 24)
  return (
    <svg viewBox={`0 0 ${W} 58`} role="img" aria-label={`${rotulo}: carrinho em x = ${f(x)} m`} className="w-full">
      <line x1="10" x2={W - 10} y1="40" y2="40" stroke="var(--ink)" strokeWidth="2.5" />
      {Array.from({ length: xmax + 1 }, (_, k) => (
        <g key={k}>
          <line x1={px(k)} x2={px(k)} y1="40" y2="46" stroke="var(--ink)" />
          <text x={px(k)} y="56" textAnchor="middle" fontSize="9" fill="var(--ink-muted)" className="num">
            {k}
          </text>
        </g>
      ))}
      <g transform={`translate(${px(Math.max(0, Math.min(xmax, x)))} 0)`}>
        <rect x="-12" y="22" width="24" height="12" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="-6" cy="36" r="4" fill="var(--ink)" />
        <circle cx="6" cy="36" r="4" fill="var(--ink)" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ ligue os gráficos */

export function VisualLigar({ inst }: { inst: InstanciaMulti<DadosGraficos> }) {
  const d = inst.dados as DadosGraficos
  return (
    <div className="mx-auto w-full max-w-sm">
      <MiniGrafico y={d.posicao.y} T={d.T} rotuloY="x (m)" rotulo="Gráfico da posição em função do tempo" altura={150} />
    </div>
  )
}

export function OpcaoLigar({ inst, id }: { inst: InstanciaMulti<DadosGraficos>; id: string }) {
  const d = inst.dados as DadosGraficos
  const todas = Object.values(d.opcoes).flatMap((o) => o.curva.y.map((v) => Math.abs(v)))
  const limite = Math.max(1, ...todas) * 1.15
  return <MiniGrafico y={d.opcoes[id]!.curva.y} T={d.T} rotuloY="v?" limite={limite} rotulo={`Gráfico ${id}: candidata à velocidade`} altura={110} cor="var(--ok)" />
}

/* ------------------------------------------------------------------ lançamento */

interface TrajProps {
  v0: number
  angulo: number
  /** alvo: distância, altura e meia largura */
  alvo?: { d: number; h: number; tol: number }
  /** instante atual (s): mostra a bola e os vetores */
  t?: number
  vetores?: boolean
  rastro?: boolean
  rotulo?: string
}

export function Trajetoria({ v0, angulo, alvo, t, vetores = true, rastro = true, rotulo = 'Trajetória de um lançamento oblíquo' }: TrajProps) {
  const R = alcance(v0, angulo)
  const H = alturaMaxima(v0, angulo)
  const l = lancamento(v0, angulo)
  const xmax = Math.max(40, Math.ceil((Math.max(R, alvo?.d ?? 0) * 1.2) / 10) * 10)
  const ymax = Math.max(15, Math.ceil((Math.max(H, alvo?.h ?? 0) * 1.4) / 5) * 5)
  const xfim = Math.max(R, alvo ? Math.max(alvo.d, 0) : 0, 1)
  const bola = t !== undefined ? { x: l.x(t), y: l.y(t) } : null
  const noAr = bola && bola.y >= -1e-9
  return (
    <Cena janela={{ xmin: -xmax * 0.04, xmax: xmax * 1.02, ymin: -ymax * 0.08, ymax }} passoX={xmax / 8} passoY={ymax / 4} rotulo={rotulo}>
      {alvo && alvo.h > 0 && <Line.Segment point1={[alvo.d - alvo.tol, alvo.h]} point2={[alvo.d + alvo.tol, alvo.h]} color="var(--erro)" weight={6} />}
      {alvo && alvo.h > 0 && <Line.Segment point1={[alvo.d, alvo.h]} point2={[alvo.d, 0]} color="var(--ink-muted)" style="dashed" weight={1.5} />}
      {alvo && alvo.h === 0 && <Line.Segment point1={[alvo.d - alvo.tol, 0]} point2={[alvo.d + alvo.tol, 0]} color="var(--erro)" weight={8} />}
      {rastro && v0 > 0 && <Plot.OfX y={(x) => alturaEmX(v0, angulo, x)} domain={[0, Math.min(xfim * 1.3, xmax)]} color="var(--accent)" weight={3} style="dashed" />}
      {bola && noAr && (
        <g>
          <Point x={bola.x} y={bola.y} color="var(--accent)" />
          {vetores && (
            <>
              <Vector tail={[bola.x, bola.y]} tip={[bola.x + l.vx * 0.7, bola.y]} color="var(--ok)" weight={2.5} />
              <Vector tail={[bola.x, bola.y]} tip={[bola.x, bola.y + l.vyEm(t as number) * 0.7]} color="var(--aviso)" weight={2.5} />
            </>
          )}
        </g>
      )}
      <Text x={xmax * 0.98} y={ymax * 0.95} attach="sw" size={12} color="var(--ink-muted)">{`g = ${G} m/s²`}</Text>
    </Cena>
  )
}
export { AMOSTRAS }
