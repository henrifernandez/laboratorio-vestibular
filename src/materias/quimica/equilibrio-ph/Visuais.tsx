import type { ReactNode } from 'react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { Formula } from '../comum/Formula'
import { CadeiaBequeres } from '../solucoes/Visuais'
import { phTitulacao, volumeEquivalencia, reacaoEq, type ReacaoEq, type Titulacao } from './calculo'
import type { DadosEq, DadosFraco, DadosKc, DadosPh } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ cor e escala de pH */

const PARADAS: [number, [number, number, number]][] = [
  [0, [214, 57, 47]],
  [3, [232, 131, 58]],
  [5, [232, 200, 64]],
  [7, [76, 175, 80]],
  [9, [59, 143, 212]],
  [11, [74, 95, 212]],
  [14, [122, 76, 199]],
]

/** Cor do indicador universal para um pH (interpolação entre as paradas). */
export function corDePh(ph: number): string {
  const v = Math.min(14, Math.max(0, ph))
  for (let i = 0; i < PARADAS.length - 1; i++) {
    const [a, ca] = PARADAS[i] as (typeof PARADAS)[number]
    const [b, cb] = PARADAS[i + 1] as (typeof PARADAS)[number]
    if (v >= a && v <= b) {
      const t = (v - a) / (b - a)
      return `rgb(${ca.map((c, k) => Math.round(c + t * ((cb[k] as number) - c))).join(',')})`
    }
  }
  return 'rgb(122,76,199)'
}

export interface Marcador {
  ph: number
  rotulo: string
}

/** Barra de pH de 0 a 14 com marcadores (substâncias do cotidiano ou o ponto em estudo). */
export function EscalaPh({ marcadores = [], destaque }: { marcadores?: Marcador[]; destaque?: number }) {
  const W = 340
  const X = (p: number) => 14 + (p / 14) * (W - 28)
  const ordenados = [...marcadores].sort((a, b) => a.ph - b.ph)
  // alterna os rótulos em duas alturas para não se sobreporem
  return (
    <svg viewBox={`0 0 ${W} ${destaque !== undefined || ordenados.length ? 120 : 70}`} role="img" aria-label={`Escala de pH de 0 a 14: ácida abaixo de 7, neutra em 7 e básica acima. ${ordenados.map((m) => `${m.rotulo} perto de ${f(m.ph, 1)}`).join('; ')}`} className="mx-auto block w-full max-w-lg">
      <defs>
        <linearGradient id="grad-ph" x1="0" x2="1" y1="0" y2="0">
          {PARADAS.map(([p, c]) => (
            <stop key={p} offset={`${(p / 14) * 100}%`} stopColor={`rgb(${c.join(',')})`} />
          ))}
        </linearGradient>
      </defs>
      <rect x={14} y={36} width={W - 28} height={22} rx={6} fill="url(#grad-ph)" stroke="var(--ink-muted)" strokeWidth={1} />
      {Array.from({ length: 15 }, (_, p) => (
        <g key={p}>
          <line x1={X(p)} x2={X(p)} y1={58} y2={63} stroke="var(--ink-muted)" strokeWidth={1.2} />
          <text x={X(p)} y={76} textAnchor="middle" fontSize={11} fill="var(--ink-muted)" className="num">{p}</text>
        </g>
      ))}
      <text x={14} y={24} fontSize={11} fill="var(--ink-muted)">ácido</text>
      <text x={X(7)} y={24} fontSize={11} textAnchor="middle" fill="var(--ink-muted)">neutro</text>
      <text x={W - 14} y={24} fontSize={11} textAnchor="end" fill="var(--ink-muted)">básico</text>
      {ordenados.map((m, k) => (
        <g key={m.rotulo}>
          <line x1={X(m.ph)} x2={X(m.ph)} y1={k % 2 === 0 ? 86 : 100} y2={58} stroke="var(--ink)" strokeWidth={1.2} />
          <circle cx={X(m.ph)} cy={58} r={3} fill="var(--ink)" />
          <text x={Math.min(Math.max(X(m.ph), 36), W - 36)} y={k % 2 === 0 ? 96 : 110} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">{m.rotulo}</text>
        </g>
      ))}
      {destaque !== undefined && (
        <g>
          <polygon points={`${X(destaque) - 7},${28} ${X(destaque) + 7},${28} ${X(destaque)},${37}`} fill="var(--ink)" />
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ equação de equilíbrio */

const FASE = { g: '(g)', s: '(s)', l: '(l)', aq: '(aq)' } as const

export function EquacaoEquilibrio({ r }: { r: ReacaoEq }) {
  const lado = (es: ReacaoEq['reag']): ReactNode[] =>
    es.flatMap((e, i) => {
      const item = (
        <span key={e.f} className="inline-flex items-baseline gap-1">
          {e.c !== 1 && <strong className="num" style={{ color: 'var(--accent)' }}>{e.c}</strong>}
          <Formula f={e.f} />
          <span className="text-sm text-[var(--ink-muted)]">{FASE[e.fase]}</span>
        </span>
      )
      return i === 0 ? [item] : [<span key={`m${i}`} aria-hidden="true" className="text-[var(--ink-muted)]">+</span>, item]
    })
  return (
    <div className="grid justify-items-center gap-1">
      <p className="num m-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-lg">
        {lado(r.reag)}
        <span aria-hidden="true" className="px-1 text-[var(--ink-muted)]">⇌</span>
        {lado(r.prod)}
      </p>
      <p className="m-0 text-sm text-[var(--ink-muted)]">{r.dH > 0 ? 'ΔH > 0 (reação direta endotérmica)' : 'ΔH < 0 (reação direta exotérmica)'}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualPh({ inst }: { inst: InstanciaNum<DadosPh> }) {
  const d = inst.dados as DadosPh
  if (d.etapas && d.ligacoes) {
    return (
      <div className="cartao p-3">
        <CadeiaBequeres etapas={d.etapas} ligacoes={d.ligacoes} />
      </div>
    )
  }
  return (
    <div className="cartao p-3">
      <EscalaPh />
    </div>
  )
}

export function VisualEq({ inst }: { inst: InstanciaMulti<DadosEq> }) {
  const d = inst.dados as DadosEq
  return (
    <div className="cartao p-3">
      <EquacaoEquilibrio r={reacaoEq(d.reacao)} />
    </div>
  )
}

export function VisualKc({ inst }: { inst: InstanciaNum<DadosKc> }) {
  const d = inst.dados as DadosKc
  const r = reacaoEq(d.reacao)
  return (
    <div className="cartao p-3">
      <EquacaoEquilibrio r={r} />
    </div>
  )
}

export function VisualFraco({ inst }: { inst: InstanciaNum<DadosFraco> }) {
  const d = inst.dados as DadosFraco
  return (
    <div className="cartao grid justify-items-center gap-1 p-3">
      <p className="num m-0 text-lg">
        HA <span aria-hidden="true">⇌</span> H<sup>+</sup> + A<sup>−</sup>
      </p>
      <p className="m-0 text-sm text-[var(--ink-muted)]">Ácido fraco: ioniza só em parte. C = {f(d.c)} mol/L.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ curva de titulação (SVG) */

interface PropsCurva {
  t: Titulacao
  /** volume de base já adicionado (mL) */
  vb?: number
  /** faixa de viragem do indicador [min, max] */
  faixa?: [number, number]
  rotuloFaixa?: string
}

export function CurvaTitulacao({ t, vb, faixa, rotuloFaixa }: PropsCurva) {
  const veq = volumeEquivalencia(t)
  const vmax = Math.max(10, Math.ceil((veq * 2) / 5) * 5)
  const W = 340
  const H = 230
  const X0 = 40
  const X1 = 328
  const Y0 = 14
  const Y1 = 190
  const X = (v: number) => X0 + (v / vmax) * (X1 - X0)
  const Y = (p: number) => Y1 - (p / 14) * (Y1 - Y0)
  const pontos: string[] = []
  for (let i = 0; i <= 200; i++) {
    const v = (i / 200) * vmax
    pontos.push(`${X(v)},${Y(phTitulacao(t, v))}`)
  }
  const phAtual = vb !== undefined ? phTitulacao(t, vb) : null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Curva de titulação: pH em função do volume de base. Ponto de equivalência em ${f(veq)} mL, com pH ${f(phTitulacao(t, veq), 1)}.`} className="mx-auto block w-full max-w-lg">
      {faixa && (
        <g>
          <rect x={X0} y={Y(faixa[1])} width={X1 - X0} height={Y(faixa[0]) - Y(faixa[1])} fill="var(--accent)" opacity={0.16} />
          {rotuloFaixa && <text x={X0 + 6} y={Y(faixa[1]) + 12} fontSize={11} fill="var(--ink)">{rotuloFaixa}</text>}
        </g>
      )}
      {[0, 2, 4, 6, 7, 8, 10, 12, 14].map((p) => (
        <g key={p}>
          <line x1={X0} x2={X1} y1={Y(p)} y2={Y(p)} stroke={p === 7 ? 'var(--line-strong)' : 'var(--line)'} strokeWidth={p === 7 ? 1.4 : 1} />
          <text x={X0 - 6} y={Y(p) + 4} textAnchor="end" fontSize={11} fill="var(--ink-muted)" className="num">{p}</text>
        </g>
      ))}
      {Array.from({ length: Math.floor(vmax / 10) + 1 }, (_, k) => k * 10).map((v) => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={Y0} y2={Y1} stroke="var(--line)" strokeWidth={1} />
          <text x={X(v)} y={Y1 + 15} textAnchor="middle" fontSize={11} fill="var(--ink-muted)" className="num">{v}</text>
        </g>
      ))}
      <line x1={X0} x2={X0} y1={Y0} y2={Y1} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <text x={X1} y={Y1 + 30} textAnchor="end" fontSize={11} fill="var(--ink-muted)">volume de base adicionado (mL)</text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">pH</text>
      <line x1={X(veq)} x2={X(veq)} y1={Y0} y2={Y1} stroke="var(--ink-muted)" strokeDasharray="4 3" strokeWidth={1.2} />
      <text x={X(veq) + 4} y={Y1 - 6} fontSize={11} fill="var(--ink-muted)">equivalência</text>
      <polyline points={pontos.join(' ')} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      {vb !== undefined && phAtual !== null && (
        <g>
          <line x1={X(vb)} x2={X(vb)} y1={Y(phAtual)} y2={Y1} stroke="var(--ink-muted)" strokeDasharray="3 3" strokeWidth={1.2} />
          <circle cx={X(vb)} cy={Y(phAtual)} r={5.5} fill="var(--erro)" stroke="var(--surface)" strokeWidth={2} />
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ tabela e gráficos do Entenda */

export function GraficoEquilibrioDinamico() {
  const W = 340
  const H = 170
  const X = (t: number) => 40 + t * 280
  const Y = (c: number) => 138 - c * 120
  const tau = 0.22
  const A = (t: number) => 0.4 + 0.6 * Math.exp(-t / tau)
  const B = (t: number) => 0.6 * (1 - Math.exp(-t / tau))
  const pts = (fn: (t: number) => number) => Array.from({ length: 61 }, (_, i) => `${X(i / 60)},${Y(fn(i / 60))}`).join(' ')
  const tEq = 0.55
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Concentração em função do tempo: o reagente diminui, o produto aumenta e, a partir do equilíbrio, as duas ficam constantes" className="mx-auto block w-full max-w-lg">
      <line x1={40} x2={40} y1={12} y2={138} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={40} x2={324} y1={138} y2={138} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={X(tEq)} x2={X(tEq)} y1={12} y2={138} stroke="var(--ink-muted)" strokeDasharray="4 3" strokeWidth={1.2} />
      <text x={X(tEq) + 4} y={24} fontSize={11} fill="var(--ink-muted)">equilíbrio</text>
      <polyline points={pts(A)} fill="none" stroke="var(--accent)" strokeWidth={3} />
      <polyline points={pts(B)} fill="none" stroke="var(--erro)" strokeWidth={3} />
      <text x={X(0.85)} y={Y(A(0.85)) - 6} fontSize={12} fontWeight={700} fill="var(--accent)">reagente</text>
      <text x={X(0.85)} y={Y(B(0.85)) + 16} fontSize={12} fontWeight={700} fill="var(--erro)">produto</text>
      <text x={324} y={158} textAnchor="end" fontSize={11} fill="var(--ink-muted)">tempo</text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">concentração</text>
    </svg>
  )
}

export function TabelaIce() {
  const linhas = [
    { nome: 'Início (mol/L)', h2: '1', i2: '1', hi: '0' },
    { nome: 'Reage / forma', h2: '− x', i2: '− x', hi: '+ 2x' },
    { nome: 'Equilíbrio (x = 0,5)', h2: '0,5', i2: '0,5', hi: '1' },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="num mx-auto w-full max-w-md border-collapse text-center">
        <caption className="pb-1 text-left text-sm text-[var(--ink-muted)]">Tabela de equilíbrio de H₂ + I₂ ⇌ 2 HI</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th className="py-1 text-left font-semibold"> </th>
            <th className="py-1 font-semibold"><Formula f="H2" /></th>
            <th className="py-1 font-semibold"><Formula f="I2" /></th>
            <th className="py-1 font-semibold">HI</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.nome} className="border-b border-[var(--line)]">
              <th className="py-1 text-left font-normal">{l.nome}</th>
              <td className="py-1">{l.h2}</td>
              <td className="py-1">{l.i2}</td>
              <td className="py-1">{l.hi}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="num m-1 text-center text-sm text-[var(--ink-muted)]">Kc = [HI]² ÷ ([H₂][I₂]) = 1² ÷ (0,5 × 0,5) = 4</p>
    </div>
  )
}

