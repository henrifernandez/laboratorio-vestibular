import { useMemo } from 'react'
import type { InstanciaMulti, InstanciaNum, VisualProps } from '@/desafios/simples'
import { bonito } from '@/sim/ComunsLab'
import { atividadeEnzima, fotossinteseBruta, luzDoDia, pontoDeCompensacao } from './calculo'
import type { DadosEnergia, DadosEnzima, DadosLuz, DadosMetabolismo } from './geradoresEnergia'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ curva de resposta à luz */

/** Fotossíntese bruta em função da luz, com a respiração (R) e, opcionalmente, o ponto de compensação e uma luz marcada. */
export function CurvaLuzSvg({ pmax, k, r, luz, mostrarIc = false }: { pmax: number; k: number; r: number; luz?: number; mostrarIc?: boolean }) {
  const xmax = 6 * k
  const X = (i: number) => 52 + (i / xmax) * 272
  const ymax = pmax * 1.1
  const Y = (p: number) => 158 - (p / ymax) * 142
  const pts = Array.from({ length: 61 }, (_, j) => {
    const i = (j / 60) * xmax
    return `${X(i)},${Y(fotossinteseBruta(pmax, k, i))}`
  }).join(' ')
  const passoX = bonito(xmax / 4)
  const passoY = bonito(ymax / 4)
  const ic = pontoDeCompensacao(pmax, k, r)
  const descr = `Fotossíntese bruta em função da luz, de 0 a ${f(xmax, 0)}; satura em ${f(pmax, 0)}; a respiração é ${f(r, 0)}${luz !== undefined ? `; luz marcada: ${f(luz, 0)}` : ''}.`
  return (
    <svg viewBox="0 0 340 196" role="img" aria-label={descr} className="mx-auto block w-full max-w-lg">
      <line x1={52} x2={52} y1={10} y2={158} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={52} x2={328} y1={158} y2={158} stroke="var(--ink-muted)" strokeWidth={1.5} />
      {Array.from({ length: Math.floor(xmax / passoX) + 1 }, (_, j) => j * passoX).map((v) => (
        <g key={`x${v}`}>
          <line x1={X(v)} x2={X(v)} y1={158} y2={162} stroke="var(--ink-muted)" />
          <text x={X(v)} y={174} textAnchor="middle" fontSize={10} fill="var(--ink-muted)" className="num">{f(v, 0)}</text>
        </g>
      ))}
      {Array.from({ length: Math.floor(ymax / passoY) + 1 }, (_, j) => j * passoY).map((v) => (
        <g key={`y${v}`}>
          <line x1={48} x2={52} y1={Y(v)} y2={Y(v)} stroke="var(--ink-muted)" />
          <text x={44} y={Y(v) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-muted)" className="num">{f(v, 0)}</text>
        </g>
      ))}
      <text x={328} y={190} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">luz (I)</text>
      <text x={4} y={9} fontSize={10.5} fill="var(--ink-muted)">taxa (µmol O₂ por m² por s)</text>
      <line x1={52} x2={328} y1={Y(pmax)} y2={Y(pmax)} stroke="var(--line-strong)" strokeDasharray="5 4" />
      <text x={326} y={Y(pmax) - 4} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">Pmax = {f(pmax, 0)}</text>
      <line x1={52} x2={328} y1={Y(r)} y2={Y(r)} stroke="var(--erro)" strokeWidth={2} strokeDasharray="6 4" />
      <text x={326} y={Y(r) + 13} textAnchor="end" fontSize={10.5} fontWeight={700} fill="var(--erro)">respiração R = {f(r, 0)}</text>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      {mostrarIc && ic <= xmax && (
        <g>
          <line x1={X(ic)} x2={X(ic)} y1={Y(r)} y2={158} stroke="var(--ink)" strokeDasharray="3 3" />
          <circle cx={X(ic)} cy={Y(r)} r={5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={X(ic) + 7} y={152} fontSize={10.5} fontWeight={700} fill="var(--ink)">compensação</text>
        </g>
      )}
      {luz !== undefined && (
        <g>
          <line x1={X(luz)} x2={X(luz)} y1={Y(Math.max(fotossinteseBruta(pmax, k, luz), r))} y2={158} stroke="var(--ink)" strokeDasharray="3 3" />
          <circle cx={X(luz)} cy={Y(fotossinteseBruta(pmax, k, luz))} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={X(luz)} y={Y(fotossinteseBruta(pmax, k, luz)) - 9} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--ink)">luz = {f(luz, 0)}</text>
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ atividade da enzima */

export function CurvaEnzimaSvg({ otima, desnaturacao, temps = [] }: { otima: number; desnaturacao: number; temps?: number[] }) {
  const xmax = desnaturacao + 10
  const X = (t: number) => 46 + (t / xmax) * 278
  const Y = (a: number) => 154 - a * 128
  const pts = Array.from({ length: xmax + 1 }, (_, t) => `${X(t)},${Y(atividadeEnzima(t, otima, desnaturacao))}`).join(' ')
  const passo = xmax > 70 ? 20 : 10
  return (
    <svg viewBox="0 0 340 196" role="img" aria-label={`Atividade relativa de uma enzima em função da temperatura: sobe até o máximo em ${otima} °C e cai a zero a partir de ${desnaturacao} °C${temps.length ? `. Temperaturas marcadas: ${temps.join(', ')} °C` : ''}`} className="mx-auto block w-full max-w-lg">
      <line x1={46} x2={46} y1={10} y2={154} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={46} x2={326} y1={154} y2={154} stroke="var(--ink-muted)" strokeWidth={1.5} />
      {[0, 0.5, 1].map((a) => (
        <g key={a}>
          <line x1={42} x2={46} y1={Y(a)} y2={Y(a)} stroke="var(--ink-muted)" />
          <text x={38} y={Y(a) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-muted)" className="num">{a === 1 ? '100 %' : a === 0 ? '0' : '50 %'}</text>
        </g>
      ))}
      {Array.from({ length: Math.floor(xmax / passo) + 1 }, (_, j) => j * passo).map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={154} y2={158} stroke="var(--ink-muted)" />
          <text x={X(t)} y={170} textAnchor="middle" fontSize={10} fill="var(--ink-muted)" className="num">{t}</text>
        </g>
      ))}
      <text x={326} y={190} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">temperatura (°C)</text>
      <text x={4} y={9} fontSize={10.5} fill="var(--ink-muted)">atividade relativa</text>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      <text x={X(otima)} y={Y(1) - 6} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--ink)">ótima: {otima} °C</text>
      {temps.map((t) => {
        const a = atividadeEnzima(t, otima, desnaturacao)
        return (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={Y(a)} y2={154} stroke="var(--ink)" strokeDasharray="3 3" />
            <circle cx={X(t)} cy={Y(a)} r={5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5} />
            <text x={X(t)} y={Y(a) - 10} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--ink)">
              {t} °C
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ um dia inteiro */

/** Fotossíntese e respiração ao longo de 24 h: a área verde é saldo positivo de O₂; a vermelha, negativo. */
export function GraficoDia({ pmax, k, r, imax, hora }: { pmax: number; k: number; r: number; imax: number; hora: number }) {
  const ymax = pmax * 1.08
  const X = (h: number) => 46 + (h / 24) * 280
  const Y = (p: number) => 158 - (p / ymax) * 140
  const camadas = useMemo(() => {
    const passo = 0.1
    const barras: { x: number; y: number; w: number; h: number; positivo: boolean }[] = []
    const pts: string[] = []
    for (let h = 0; h < 24; h += passo) {
      const p = fotossinteseBruta(pmax, k, luzDoDia(h + passo / 2, imax))
      const alto = Math.abs(p - r)
      if (alto > 1e-9) barras.push({ x: X(h), y: Y(Math.max(p, r)), w: X(h + passo) - X(h) + 0.4, h: (alto / ymax) * 140, positivo: p > r })
      pts.push(`${X(h + passo / 2)},${Y(p)}`)
    }
    return { barras, linha: pts.join(' ') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmax, k, r, imax])
  const agora = fotossinteseBruta(pmax, k, luzDoDia(hora, imax))
  return (
    <svg viewBox="0 0 340 204" role="img" aria-label={`Fotossíntese bruta ao longo de 24 horas, de dia, comparada com a respiração constante de ${f(r, 0)}; luz máxima ao meio-dia: ${f(imax, 0)}. Hora marcada: ${f(hora, 1)} h.`} className="mx-auto block w-full max-w-lg">
      <rect x={X(0)} y={14} width={X(6) - X(0)} height={144} fill="var(--ink)" fillOpacity={0.07} />
      <rect x={X(18)} y={14} width={X(24) - X(18)} height={144} fill="var(--ink)" fillOpacity={0.07} />
      <text x={X(3)} y={26} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">noite</text>
      <text x={X(21)} y={26} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">noite</text>
      {camadas.barras.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.positivo ? 'var(--ok)' : 'var(--erro)'} fillOpacity={0.35} />
      ))}
      <line x1={46} x2={46} y1={10} y2={158} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={46} x2={326} y1={158} y2={158} stroke="var(--ink-muted)" strokeWidth={1.5} />
      {[0, 6, 12, 18, 24].map((h) => (
        <g key={h}>
          <line x1={X(h)} x2={X(h)} y1={158} y2={162} stroke="var(--ink-muted)" />
          <text x={X(h)} y={174} textAnchor="middle" fontSize={10} fill="var(--ink-muted)" className="num">{h} h</text>
        </g>
      ))}
      <text x={4} y={9} fontSize={10.5} fill="var(--ink-muted)">taxa (µmol O₂ por m² por s)</text>
      <line x1={46} x2={326} y1={Y(r)} y2={Y(r)} stroke="var(--erro)" strokeWidth={2} strokeDasharray="6 4" />
      <text x={324} y={Y(r) + 13} textAnchor="end" fontSize={10.5} fontWeight={700} fill="var(--erro)">respiração</text>
      <polyline points={camadas.linha} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinejoin="round" />
      <line x1={X(hora)} x2={X(hora)} y1={14} y2={158} stroke="var(--ink)" strokeWidth={1.6} />
      <circle cx={X(hora)} cy={Y(agora)} r={5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5} />
      <text x={326} y={196} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">hora do dia</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualEnergia({ inst }: VisualProps<InstanciaNum<DadosEnergia>>) {
  const d = inst.dados as DadosEnergia
  if (d.tipo !== 'luz') return null
  const l = d as DadosLuz
  return (
    <div className="cartao grid gap-1 p-3">
      <CurvaLuzSvg pmax={l.pmax} k={l.k} r={l.r} luz={l.luz} />
    </div>
  )
}

export function VisualMetabolismo({ inst }: VisualProps<InstanciaMulti<DadosMetabolismo>>) {
  const d = inst.dados as DadosMetabolismo
  if (!d) return null
  return (
    <div className="cartao grid gap-1 p-3">
      {d.tipo === 'enzima' ? <CurvaEnzimaSvg otima={(d as DadosEnzima).otima} desnaturacao={(d as DadosEnzima).desnaturacao} temps={(d as DadosEnzima).temps} /> : <CurvaLuzSvg pmax={(d as DadosLuz).pmax} k={(d as DadosLuz).k} r={(d as DadosLuz).r} luz={(d as DadosLuz).luz} />}
    </div>
  )
}
