import { useId, type ReactNode } from 'react'
import { espalhar, larguraTexto } from '@/lib/rotulos'
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

const SOBRESCRITO = '⁰¹²³⁴⁵⁶⁷⁸⁹'
/** 10 elevado a −p, com expoente sobrescrito (10⁰, 10⁻¹, ...). */
export const potenciaDez = (p: number) => `10${p === 0 ? '⁰' : `⁻${String(p).replace(/\d/g, (d) => SOBRESCRITO[Number(d)] as string)}`}`

const ROTULO_FONTE = 11.5
const LARG_H = 340
const MARGEM_H = 14

/** Largura do rótulo de um marcador na escala horizontal (só o nome, em negrito). */
const largHorizontal = (m: Marcador) => larguraTexto(m.rotulo, ROTULO_FONTE, true)

/** Os rótulos cabem numa só linha acima da barra horizontal? */
export function cabeNaHorizontal(marcadores: Marcador[]): boolean {
  const total = marcadores.reduce((s, m) => s + largHorizontal(m) + 8, -8)
  return total <= LARG_H - 2 * MARGEM_H
}

/** Posições dos rótulos na escala vertical (centro de cada linha), sem sobreposição. */
export function layoutVertical(marcadores: Marcador[], topo: number, passo: number) {
  const ordenados = [...marcadores].sort((a, b) => a.ph - b.ph)
  const ys = espalhar(
    ordenados.map((m) => ({ alvo: topo + m.ph * passo, tamanho: 16 })),
    topo - 12,
    topo + 14 * passo + 12,
    1,
  )
  return ordenados.map((m, i) => ({ ...m, y: ys[i] as number }))
}

/** Posições dos rótulos na escala horizontal (centro de cada rótulo), sem sobreposição. */
export function layoutHorizontal(marcadores: Marcador[]) {
  const ordenados = [...marcadores].sort((a, b) => a.ph - b.ph)
  const X = (p: number) => MARGEM_H + (p / 14) * (LARG_H - 2 * MARGEM_H)
  const xs = espalhar(
    ordenados.map((m) => ({ alvo: X(m.ph), tamanho: largHorizontal(m) })),
    MARGEM_H - 6,
    LARG_H - MARGEM_H + 6,
    8,
  )
  return ordenados.map((m, i) => ({ ...m, x: xs[i] as number, largura: largHorizontal(m) }))
}

const descricaoEscala = (marcadores: Marcador[], destaque?: number) =>
  `Escala de pH de 0 a 14: ácida abaixo de 7, neutra em 7 e básica acima; cada unidade a menos multiplica [H⁺] por 10.${marcadores.length ? ` ${[...marcadores]
    .sort((a, b) => a.ph - b.ph)
    .map((m) => `${m.rotulo}, pH perto de ${f(m.ph, 1)}`)
    .join('; ')}.` : ''}${destaque !== undefined ? ` Marcado: pH ${f(destaque, 1)}.` : ''}`

/**
 * Escala de pH de 0 a 14 com marcadores (substâncias do cotidiano ou o ponto em estudo).
 * Com poucos rótulos, fica na horizontal; quando eles não cabem numa linha, vira uma régua vertical,
 * que também mostra a concentração de H⁺ de cada unidade.
 */
export function EscalaPh({ marcadores = [], destaque, orientacao = 'auto' }: { marcadores?: Marcador[]; destaque?: number; orientacao?: 'auto' | 'horizontal' | 'vertical' }) {
  const id = useId().replace(/:/g, '')
  const vertical = orientacao === 'vertical' || (orientacao === 'auto' && !cabeNaHorizontal(marcadores))
  return vertical ? <EscalaVertical id={id} marcadores={marcadores} destaque={destaque} /> : <EscalaHorizontal id={id} marcadores={marcadores} destaque={destaque} />
}

function EscalaHorizontal({ id, marcadores, destaque }: { id: string; marcadores: Marcador[]; destaque?: number }) {
  const W = LARG_H
  const X = (p: number) => MARGEM_H + (p / 14) * (W - 2 * MARGEM_H)
  const temRotulos = marcadores.length > 0
  const oy = temRotulos ? 0 : -30
  const BARRA = 38 + oy
  const rotulos = layoutHorizontal(marcadores)
  return (
    <svg viewBox={`0 0 ${W} ${102 + oy}`} role="img" aria-label={descricaoEscala(marcadores, destaque)} className="mx-auto block w-full max-w-lg">
      <defs>
        <linearGradient id={`ph-${id}`} x1="0" x2="1" y1="0" y2="0">
          {PARADAS.map(([p, c]) => (
            <stop key={p} offset={`${(p / 14) * 100}%`} stopColor={`rgb(${c.join(',')})`} />
          ))}
        </linearGradient>
      </defs>
      {rotulos.map((m) => (
        <g key={m.rotulo}>
          <path d={`M${m.x} 21 L${X(m.ph)} 30 L${X(m.ph)} ${BARRA}`} fill="none" stroke="var(--ink)" strokeWidth={1.2} />
          <circle cx={X(m.ph)} cy={BARRA} r={3} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.2} />
          <text x={m.x} y={15} textAnchor="middle" fontSize={ROTULO_FONTE} fontWeight={700} fill="var(--ink)">{m.rotulo}</text>
        </g>
      ))}
      <rect x={MARGEM_H} y={BARRA} width={W - 2 * MARGEM_H} height={22} rx={6} fill={`url(#ph-${id})`} stroke="var(--ink-muted)" strokeWidth={1} />
      <line x1={X(7)} x2={X(7)} y1={BARRA - 3} y2={BARRA + 25} stroke="var(--ink)" strokeWidth={1.4} strokeDasharray="3 2" />
      {Array.from({ length: 15 }, (_, p) => (
        <g key={p}>
          <line x1={X(p)} x2={X(p)} y1={BARRA + 22} y2={BARRA + 27} stroke="var(--ink-muted)" strokeWidth={1.2} />
          <text x={X(p)} y={BARRA + 39} textAnchor="middle" fontSize={11} fontWeight={p === 7 ? 700 : 400} fill={p === 7 ? 'var(--ink)' : 'var(--ink-muted)'} className="num">{p}</text>
        </g>
      ))}
      <text x={MARGEM_H} y={BARRA + 58} fontSize={11} fill="var(--ink-muted)">← mais ácido</text>
      <text x={X(7)} y={BARRA + 58} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">neutro</text>
      <text x={W - MARGEM_H} y={BARRA + 58} textAnchor="end" fontSize={11} fill="var(--ink-muted)">mais básico →</text>
      {destaque !== undefined && (
        <g>
          <line x1={X(destaque)} x2={X(destaque)} y1={BARRA - 2} y2={BARRA + 24} stroke="var(--ink)" strokeWidth={3} />
          <polygon points={`${X(destaque) - 7},${BARRA + 33} ${X(destaque) + 7},${BARRA + 33} ${X(destaque)},${BARRA + 24}`} fill="var(--ink)" />
        </g>
      )}
    </svg>
  )
}

function EscalaVertical({ id, marcadores, destaque }: { id: string; marcadores: Marcador[]; destaque?: number }) {
  const W = 330
  const TOPO = 44
  const PASSO = 21
  const Y = (p: number) => TOPO + p * PASSO
  const X_H = 58
  const X_PH = 82
  const BX0 = 102
  const BX1 = 126
  const X_ROT = 158
  const rotulos = layoutVertical(marcadores, TOPO, PASSO)
  const H = Y(14) + 36
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descricaoEscala(marcadores, destaque)} className="mx-auto block w-full max-w-sm">
      <defs>
        <linearGradient id={`phv-${id}`} x1="0" x2="0" y1="0" y2="1">
          {PARADAS.map(([p, c]) => (
            <stop key={p} offset={`${(p / 14) * 100}%`} stopColor={`rgb(${c.join(',')})`} />
          ))}
        </linearGradient>
      </defs>
      {/* cabeçalhos */}
      <text x={X_H} y={22} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--ink-muted)">[H⁺]</text>
      <text x={X_H} y={34} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">mol/L</text>
      <text x={X_PH} y={34} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--ink)">pH</text>
      {/* chaves de ácido e básico */}
      <g stroke="var(--ink-muted)" strokeWidth={1.4} fill="none">
        <path d={`M16 ${Y(0)} h-4 V${Y(7) - 4} h4`} />
        <path d={`M16 ${Y(7) + 4} h-4 V${Y(14)} h4`} />
      </g>
      <text x={0} y={0} transform={`translate(8 ${(Y(0) + Y(7)) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">ácido</text>
      <text x={0} y={0} transform={`translate(8 ${(Y(7) + Y(14)) / 2}) rotate(-90)`} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">básico</text>
      {/* barra */}
      <rect x={BX0} y={Y(0) - 6} width={BX1 - BX0} height={Y(14) - Y(0) + 12} rx={6} fill={`url(#phv-${id})`} stroke="var(--ink-muted)" strokeWidth={1} />
      {Array.from({ length: 15 }, (_, p) => (
        <g key={p}>
          <line x1={BX0 - 4} x2={BX0} y1={Y(p)} y2={Y(p)} stroke="var(--ink-muted)" strokeWidth={1.2} />
          <text x={X_PH} y={Y(p) + 4} textAnchor="end" fontSize={11.5} fontWeight={p === 7 ? 800 : 600} fill="var(--ink)" className="num">{p}</text>
          <text x={X_H} y={Y(p) + 4} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)" className="num" aria-label={potenciaDez(p)}>
            10
            <tspan dy={-4.5} fontSize={8}>{p === 0 ? '0' : `−${p}`}</tspan>
          </text>
        </g>
      ))}
      <line x1={BX0 - 4} x2={BX1 + 4} y1={Y(7)} y2={Y(7)} stroke="var(--ink)" strokeWidth={1.4} strokeDasharray="3 2" />
      {/* marcadores */}
      {rotulos.map((m) => (
        <g key={m.rotulo}>
          <path d={`M${BX1} ${Y(m.ph)} H${BX1 + 10} L${X_ROT - 6} ${m.y} H${X_ROT - 2}`} fill="none" stroke="var(--ink)" strokeWidth={1.2} />
          <circle cx={BX1} cy={Y(m.ph)} r={3} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.2} />
          <text x={X_ROT} y={m.y + 4} fontSize={ROTULO_FONTE} fill="var(--ink)">
            <tspan fontWeight={700}>{m.rotulo}</tspan>
            <tspan fill="var(--ink-muted)" className="num">{` ≈ ${f(m.ph, 1)}`}</tspan>
          </text>
        </g>
      ))}
      {destaque !== undefined && (
        <g>
          <rect x={BX0 - 3} y={Y(destaque) - 4} width={BX1 - BX0 + 6} height={8} rx={3} fill="none" stroke="var(--ink)" strokeWidth={2.6} />
          <polygon points={`${BX0 - 11},${Y(destaque) - 6} ${BX0 - 11},${Y(destaque) + 6} ${BX0 - 3},${Y(destaque)}`} fill="var(--ink)" />
        </g>
      )}
      <text x={W - 4} y={H - 8} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">cada degrau: [H⁺] dez vezes menor</text>
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

