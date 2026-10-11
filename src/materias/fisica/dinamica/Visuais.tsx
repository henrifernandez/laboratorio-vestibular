import type { ReactNode } from 'react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Correcao } from '@/desafios/tipos'
import { ANGULO_PLANO, FORCAS, vetorDe, type CenarioId, type RespostaDCL } from './dcl'
import type { DadosAtrito, DadosDeslizar, DadosSistema } from './geradores'
import { forcaResultante, plano } from './calculo'

const f = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const rad = (g: number) => (g * Math.PI) / 180

/* ------------------------------------------------------------------ seta de força */

interface SetaProps {
  x: number
  y: number
  dx: number
  dy: number
  cor: string
  tracejada?: boolean
  rotulo?: string
  largura?: number
}

/** Seta em coordenadas de tela (y para baixo), com ponta cheia e rótulo opcional. */
export function Seta({ x, y, dx, dy, cor, tracejada, rotulo, largura = 3 }: SetaProps) {
  const comp = Math.hypot(dx, dy)
  if (comp < 2) return null
  const ux = dx / comp
  const uy = dy / comp
  const tx = x + dx
  const ty = y + dy
  const cab = Math.min(10, comp * 0.5)
  const bx = tx - ux * cab
  const by = ty - uy * cab
  return (
    <g>
      <line x1={x} y1={y} x2={bx} y2={by} stroke={cor} strokeWidth={largura} strokeLinecap="round" strokeDasharray={tracejada ? '5 4' : undefined} />
      <polygon points={`${tx},${ty} ${bx - uy * 5},${by + ux * 5} ${bx + uy * 5},${by - ux * 5}`} fill={tracejada ? 'none' : cor} stroke={cor} strokeWidth={tracejada ? 1.5 : 0} />
      {rotulo && (
        <text x={tx + ux * 11} y={ty + uy * 11} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fill={cor} className="num">
          {rotulo}
        </text>
      )}
    </g>
  )
}

/* ------------------------------------------------------------------ rampa */

const BASE_Y = 165
const PONTA_X = 300

export function geometriaRampa(angulo: number) {
  const c = Math.cos(rad(angulo))
  const s = Math.sin(rad(angulo))
  const H = Math.min(260, 250 / Math.max(c, 0.2), 130 / Math.max(s, 0.1))
  const P = { x: PONTA_X, y: BASE_Y }
  const Q = { x: PONTA_X - H * c, y: BASE_Y }
  const T = { x: Q.x, y: BASE_Y - H * s }
  const u = { x: c, y: s } // sentido de descida
  const n = { x: s, y: -c } // normal, saindo do plano
  const centroEm = (frac: number, meio = 15) => {
    const d = 28 + frac * Math.max(0, H - 56)
    return { x: T.x + u.x * d + n.x * meio, y: T.y + u.y * d + n.y * meio }
  }
  return { c, s, H, P, Q, T, u, n, centroEm }
}

interface RampaProps {
  angulo: number
  /** posição do bloco ao longo da rampa, de 0 (topo) a 1 (base) */
  pos?: number
  setas?: (Omit<SetaProps, 'x' | 'y'> & { de?: 'centro' })[]
  rotulo: string
  medidas?: { h: number; b: number }
  mostrarAngulo?: boolean
  /** texto dentro do bloco */
  textoBloco?: string
  fio?: boolean
  children?: ReactNode
}

export function Rampa({ angulo, pos = 0.4, setas = [], rotulo, medidas, mostrarAngulo = true, textoBloco, fio, children }: RampaProps) {
  const g = geometriaRampa(angulo)
  const C = g.centroEm(pos)
  const r = 34
  const arcoA = { x: g.P.x - r, y: g.P.y }
  const arcoB = { x: g.P.x - r * g.c, y: g.P.y - r * g.s }
  const meio = rad(angulo / 2)
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label={rotulo} className="w-full">
      <polygon points={`${g.T.x},${g.T.y} ${g.Q.x},${g.Q.y} ${g.P.x},${g.P.y}`} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      {mostrarAngulo && (
        <>
          <path d={`M ${arcoA.x} ${arcoA.y} A ${r} ${r} 0 0 1 ${arcoB.x} ${arcoB.y}`} fill="none" stroke="var(--ink-muted)" strokeWidth="1.5" />
          <text x={g.P.x - (r + 12) * Math.cos(meio)} y={g.P.y - (r + 12) * Math.sin(meio) + 4} textAnchor="middle" fontSize="12" fill="var(--ink)" className="num">
            {medidas ? 'θ' : `${f(angulo)}°`}
          </text>
        </>
      )}
      {medidas && (
        <>
          <text x={g.Q.x - 6} y={(g.Q.y + g.T.y) / 2} textAnchor="end" fontSize="12" fill="var(--ink)" className="num">{`${medidas.h} m`}</text>
          <text x={(g.Q.x + g.P.x) / 2} y={g.Q.y + 14} textAnchor="middle" fontSize="12" fill="var(--ink)" className="num">{`${medidas.b} m`}</text>
        </>
      )}
      {fio && <line x1={C.x} y1={C.y} x2={g.T.x + g.n.x * 15 + g.u.x * 8} y2={g.T.y + g.n.y * 15 + g.u.y * 8} stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 3" />}
      <g transform={`translate(${C.x} ${C.y}) rotate(${angulo})`}>
        <rect x="-15" y="-15" width="30" height="30" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
        {textoBloco && (
          <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="var(--paper)" className="num">
            {textoBloco}
          </text>
        )}
      </g>
      {setas.map((s, i) => (
        <Seta key={i} x={C.x} y={C.y} {...s} />
      ))}
      {children}
    </svg>
  )
}

/** Setas das forças sobre um bloco no plano, com comprimento proporcional à intensidade. */
export function setasDoPlano(angulo: number, m: number, mu: number, opcoes: { escala?: number; rotulos?: boolean; componentes?: boolean } = {}) {
  const p = plano({ m, angulo, mu })
  const g = geometriaRampa(angulo)
  const k = (opcoes.escala ?? 62) / Math.max(p.peso, 1)
  const R = opcoes.rotulos !== false
  const setas: Omit<SetaProps, 'x' | 'y'>[] = [
    { dx: 0, dy: p.peso * k, cor: 'var(--erro)', rotulo: R ? 'P' : undefined },
    { dx: g.n.x * p.normal * k, dy: g.n.y * p.normal * k, cor: 'var(--ok)', rotulo: R ? 'N' : undefined },
    { dx: -g.u.x * p.atrito * k, dy: -g.u.y * p.atrito * k, cor: 'var(--aviso)', rotulo: R ? 'f' : undefined },
  ]
  if (opcoes.componentes) {
    setas.push(
      { dx: g.u.x * p.paralela * k, dy: g.u.y * p.paralela * k, cor: 'var(--erro)', tracejada: true, largura: 2, rotulo: R ? 'Pₓ' : undefined },
      { dx: -g.n.x * p.normal * k, dy: -g.n.y * p.normal * k, cor: 'var(--erro)', tracejada: true, largura: 2, rotulo: R ? 'P⊥' : undefined },
    )
  }
  return { p, setas }
}

export function VisualDeslizar({ inst, correcao }: { inst: InstanciaMulti<DadosDeslizar>; correcao?: Correcao | null }) {
  const d = inst.dados as DadosDeslizar
  const g = geometriaRampa(d.angulo)
  const p = plano({ m: d.m, angulo: d.angulo, mu: d.mu })
  const k = 70 / Math.max(p.paralela, p.atritoMax, 1)
  const setas = correcao
    ? [
        { dx: g.u.x * p.paralela * k, dy: g.u.y * p.paralela * k, cor: 'var(--erro)', rotulo: 'm·g·sen θ' },
        { dx: -g.u.x * p.atritoMax * k, dy: -g.u.y * p.atritoMax * k, cor: 'var(--aviso)', rotulo: 'μ·N máx.' },
      ]
    : []
  return (
    <div className="mx-auto w-full max-w-md">
      <Rampa angulo={d.angulo} setas={setas} medidas={d.rampa} textoBloco={`${d.m} kg`} rotulo={`Plano inclinado${d.rampa ? ` de ${d.rampa.h} m de altura e ${d.rampa.b} m de base` : ` de ${f(d.angulo)} graus`} com um bloco de ${d.m} quilogramas e atrito μ = ${f(d.mu)}`} />
      <p className="num text-center text-sm text-[var(--ink-muted)]">μ = {f(d.mu)}{correcao ? ' · setas comparam a descida e o atrito máximo' : ''}</p>
    </div>
  )
}

export function VisualAtrito({ inst, correcao }: { inst: InstanciaNum<DadosAtrito>; correcao?: Correcao | null }) {
  const d = inst.dados as DadosAtrito
  if (d.caso === 'horizontalParado' || d.caso === 'horizontalDesliza') {
    const F = d.F as number
    const esc = 80 / Math.max(F, d.mu * d.m * 10, 1)
    return (
      <svg viewBox="0 0 320 120" role="img" aria-label={`Bloco de ${d.m} quilogramas sobre uma mesa com atrito μ = ${f(d.mu)}, empurrado para a direita por uma força de ${F} newtons`} className="mx-auto w-full max-w-md">
        <line x1="20" x2="300" y1="95" y2="95" stroke="var(--ink)" strokeWidth="2.5" />
        <rect x="120" y="55" width="44" height="40" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
        <text x="142" y="76" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--paper)" className="num">{`${d.m} kg`}</text>
        <Seta x={78} y={75} dx={F * esc >= 60 ? 40 : Math.max(24, F * esc * 0.5)} dy={0} cor="var(--accent)" rotulo="" />
        <text x="78" y="48" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--accent)" className="num">{`F = ${F} N`}</text>
        <text x="230" y="75" fontSize="12" fill="var(--ink-muted)" className="num">{`μ = ${f(d.mu)}`}</text>
        {correcao && <Seta x={140} y={104} dx={-Math.max(24, (correcao.correto ? 1 : 0.6) * 40)} dy={0} cor="var(--aviso)" rotulo="f" />}
      </svg>
    )
  }
  const angulo = d.angulo as number
  const g = geometriaRampa(angulo)
  const setas = d.caso === 'planoPuxado' ? [{ dx: -g.u.x * 62, dy: -g.u.y * 62, cor: 'var(--accent)', rotulo: `F = ${d.F} N` }] : []
  return (
    <div className="mx-auto w-full max-w-md">
      <Rampa angulo={angulo} setas={setas} textoBloco={`${d.m} kg`} mostrarAngulo={d.sen === undefined || d.sen === 0.5} fio={d.caso === 'planoPuxado'} rotulo={`Plano inclinado com um bloco de ${d.m} quilogramas e atrito μ = ${f(d.mu)}`} />
      <p className="num text-center text-sm text-[var(--ink-muted)]">μ = {f(d.mu)}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ polias */

interface PoliaProps {
  tipo: 'atwood' | 'mesa'
  m1: number
  m2: number
  mu?: number
  /** deslocamento dos blocos, em pixels da figura */
  deslocamento?: number
  rotulo: string
  setas?: boolean
  aceleracao?: number
  tracao?: number
}

const larg = (m: number) => 24 + Math.min(m, 10) * 2.2

export function SistemaPolia({ tipo, m1, m2, mu = 0, deslocamento = 0, rotulo, setas = false, aceleracao, tracao }: PoliaProps) {
  const d = tipo === 'atwood' ? Math.max(-40, Math.min(40, deslocamento)) : Math.max(0, Math.min(100, deslocamento))
  if (tipo === 'atwood') {
    const w1 = larg(m1)
    const w2 = larg(m2)
    const y1 = 112 + d
    const y2 = 112 - d
    return (
      <svg viewBox="0 0 300 220" role="img" aria-label={rotulo} className="mx-auto w-full max-w-sm">
        <line x1="150" x2="150" y1="6" y2="26" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="150" cy="44" r="18" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="2.5" />
        <circle cx="150" cy="44" r="3" fill="var(--ink)" />
        <line x1="132" x2="132" y1="44" y2={y1 - 14} stroke="var(--ink)" strokeWidth="2" />
        <line x1="168" x2="168" y1="44" y2={y2 - 14} stroke="var(--ink)" strokeWidth="2" />
        <g>
          <rect x={132 - w1 / 2} y={y1 - 14} width={w1} height="28" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
          <text x="132" y={y1} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--paper)" className="num">{`${m1} kg`}</text>
        </g>
        <g>
          <rect x={168 - w2 / 2} y={y2 - 14} width={w2} height="28" rx="3" fill="var(--accent-2, var(--ok))" stroke="var(--ink)" strokeWidth="2" />
          <text x="168" y={y2} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--paper)" className="num">{`${m2} kg`}</text>
        </g>
        {setas && tracao !== undefined && aceleracao !== undefined && (
          <>
            <Seta x={132} y={y1 - 14} dx={0} dy={-Math.min(60, tracao * 1.4)} cor="var(--accent)" rotulo="T" />
            <Seta x={132} y={y1 + 14} dx={0} dy={Math.min(70, m1 * 10 * 1.4)} cor="var(--erro)" rotulo="P" />
            <Seta x={168} y={y2 - 14} dx={0} dy={-Math.min(60, tracao * 1.4)} cor="var(--accent)" rotulo="T" />
            <Seta x={168} y={y2 + 14} dx={0} dy={Math.min(70, m2 * 10 * 1.4)} cor="var(--erro)" rotulo="P" />
          </>
        )}
      </svg>
    )
  }
  const w1 = larg(m1)
  const w2 = larg(m2)
  const x1 = 70 + d
  const y2 = 156 + d
  return (
    <svg viewBox="0 56 300 164" role="img" aria-label={rotulo} className="mx-auto w-full max-w-sm">
      <rect x="10" y="112" width="214" height="16" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="2" />
      <line x1="30" x2="30" y1="128" y2="205" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="232" cy="108" r="12" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="2.5" />
      <circle cx="232" cy="108" r="2.5" fill="var(--ink)" />
      <line x1={x1 + w1 / 2} x2="232" y1="96" y2="96" stroke="var(--ink)" strokeWidth="2" />
      <line x1="244" x2="244" y1="108" y2={y2 - 14} stroke="var(--ink)" strokeWidth="2" />
      <rect x={x1 - w1 / 2} y="82" width={w1} height="30" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
      <text x={x1} y="97" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--paper)" className="num">{`${m1} kg`}</text>
      <rect x={244 - w2 / 2} y={y2 - 14} width={w2} height="28" rx="3" fill="var(--accent-2, var(--ok))" stroke="var(--ink)" strokeWidth="2" />
      <text x="244" y={y2} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--paper)" className="num">{`${m2} kg`}</text>
      <text x="120" y="146" textAnchor="middle" fontSize="12" fill="var(--ink-muted)" className="num">{mu === 0 ? 'mesa lisa' : `μ = ${f(mu)}`}</text>
      {setas && tracao !== undefined && aceleracao !== undefined && (
        <>
          <Seta x={x1 + w1 / 2} y={96} dx={Math.min(60, tracao * 1.4) as number} dy={0} cor="var(--accent)" rotulo="T" />
          {mu > 0 && <Seta x={x1} y={106} dx={-Math.min(60, mu * m1 * 10 * 1.4)} dy={0} cor="var(--aviso)" rotulo="f" />}
          <Seta x={244} y={y2 - 14} dx={0} dy={-Math.min(60, tracao * 1.4)} cor="var(--accent)" rotulo="T" />
          <Seta x={244} y={y2 + 14} dx={0} dy={Math.min(60, m2 * 10 * 1.4)} cor="var(--erro)" rotulo="P" />
        </>
      )}
    </svg>
  )
}

export function VisualSistema({ inst }: { inst: InstanciaNum<DadosSistema> }) {
  const d = inst.dados as DadosSistema
  return (
    <SistemaPolia
      tipo={d.tipo}
      m1={d.m1}
      m2={d.m2}
      mu={d.mu}
      rotulo={d.tipo === 'atwood' ? `Dois blocos, de ${d.m1} e ${d.m2} quilogramas, pendurados nas pontas de um fio que passa por uma polia` : `Bloco de ${d.m1} quilogramas sobre a mesa, ligado por um fio e uma polia a um bloco de ${d.m2} quilogramas pendurado`}
    />
  )
}

/* ------------------------------------------------------------------ diagrama de corpo livre */

interface FiguraDCLProps {
  cenario: CenarioId
  resposta: RespostaDCL
  gabarito?: RespostaDCL
}

function cenaDCL(c: CenarioId): { fundo: ReactNode; cx: number; cy: number; angulo?: number } {
  const bloco = (x: number, y: number, w = 40, h = 30) => <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
  if (c === 'mesa' || c === 'puxado') {
    const cx = 150
    const cy = 128
    return {
      cx,
      cy,
      fundo: (
        <>
          <line x1="20" x2="300" y1="143" y2="143" stroke="var(--ink)" strokeWidth="2.5" />
          {bloco(cx, cy)}
          {c === 'puxado' && (
            <>
              <line x1={cx + 20} y1={cy} x2="290" y2={cy} stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 3" />
            </>
          )}
        </>
      ),
    }
  }
  if (c === 'pendurado' || c === 'subindo') {
    const cx = 150
    const cy = 130
    return {
      cx,
      cy,
      fundo: (
        <>
          <line x1="90" x2="210" y1="14" y2="14" stroke="var(--ink)" strokeWidth="3" />
          <line x1={cx} y1="14" x2={cx} y2={cy - 15} stroke="var(--ink)" strokeWidth="2" />
          {bloco(cx, cy)}
        </>
      ),
    }
  }
  const g = geometriaRampa(ANGULO_PLANO)
  const C = g.centroEm(0.5)
  return {
    cx: C.x,
    cy: C.y,
    angulo: ANGULO_PLANO,
    fundo: (
      <>
        <polygon points={`${g.T.x},${g.T.y} ${g.Q.x},${g.Q.y} ${g.P.x},${g.P.y}`} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        {c === 'planoPuxado' && <line x1={C.x} y1={C.y} x2={g.T.x + g.n.x * 15 + g.u.x * 12} y2={g.T.y + g.n.y * 15 + g.u.y * 12} stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 3" />}
        <g transform={`translate(${C.x} ${C.y}) rotate(${ANGULO_PLANO})`}>
          <rect x="-15" y="-15" width="30" height="30" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
        </g>
      </>
    ),
  }
}

const COMPRIMENTO = 54
const LETRA: Record<string, string> = { peso: 'P', normal: 'N', atrito: 'f', tracao: 'T', movimento: '?' }

export function FiguraDCL({ cenario, resposta, gabarito }: FiguraDCLProps) {
  const { fundo, cx, cy } = cenaDCL(cenario)
  return (
    <svg viewBox="0 0 320 190" role="img" aria-label={`Figura do cenário: ${cenario}. As setas mostram as forças que você marcou.`} className="mx-auto w-full max-w-md">
      {fundo}
      {gabarito &&
        FORCAS.map((fo) => {
          const dir = gabarito[fo.id]
          if (dir === 'nenhuma') return null
          const [vx, vy] = vetorDe(dir)
          return <Seta key={`g${fo.id}`} x={cx} y={cy} dx={vx * (COMPRIMENTO + 10)} dy={vy * (COMPRIMENTO + 10)} cor="var(--ink-muted)" tracejada largura={2} />
        })}
      {FORCAS.map((fo) => {
        const dir = resposta[fo.id]
        if (dir === 'nenhuma') return null
        const [vx, vy] = vetorDe(dir)
        return <Seta key={fo.id} x={cx} y={cy} dx={vx * COMPRIMENTO} dy={vy * COMPRIMENTO} cor={fo.cor} rotulo={LETRA[fo.id]} />
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ mesa com força aplicada */

export function MesaForcas({ F, m, mu }: { F: number; m: number; mu: number }) {
  const r = forcaResultante({ F, m, mu })
  const k = 80 / Math.max(F, r.atrito, 1)
  return (
    <div className="mx-auto w-full max-w-md">
      <svg viewBox="0 0 320 130" role="img" aria-label={`Bloco de ${m} quilogramas empurrado para a direita por ${f(F)} newtons, com atrito de ${f(r.atrito)} newtons para a esquerda`} className="w-full">
        <line x1="20" x2="300" y1="105" y2="105" stroke="var(--ink)" strokeWidth="2.5" />
        <rect x="128" y="62" width="48" height="43" rx="3" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
        <text x="152" y="84" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="var(--paper)" className="num">{`${m} kg`}</text>
        <Seta x={176} y={84} dx={F * k} dy={0} cor="var(--accent)" rotulo="F" />
        <Seta x={128} y={84} dx={-r.atrito * k} dy={0} cor="var(--aviso)" rotulo="f" />
      </svg>
      <p className="num text-center text-sm text-[var(--ink-muted)]" aria-live="polite">
        F = {f(F)} N · {mu === 0 ? 'sem atrito' : `atrito = ${f(r.atrito)} N${r.a === 0 ? ' (parado: iguala F)' : ' (deslizando: μ·N)'}`} · resultante = {f(r.res)} N · a = {f(r.a)} m/s²
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ comparação: descida × atrito máximo */

export function BarrasPlano({ paralela, atritoMax }: { paralela: number; atritoMax: number }) {
  const maximo = Math.max(paralela, atritoMax, 1)
  const larg = (v: number) => (v / maximo) * 180
  const vence = paralela > atritoMax + 1e-9
  return (
    <svg viewBox="0 0 320 84" role="img" aria-label={`Componente do peso ao longo do plano: ${f(paralela)} newtons. Atrito máximo: ${f(atritoMax)} newtons. ${vence ? 'A componente do peso vence' : 'O atrito aguenta'}.`} className="w-full">
      <text x="4" y="22" fontSize="11" fill="var(--ink)">m·g·sen θ</text>
      <rect x="86" y="10" width={Math.max(2, larg(paralela))} height="18" rx="3" fill="var(--erro)" opacity={vence ? 1 : 0.55} />
      <text x={86 + larg(paralela) + 6} y="23" fontSize="11" fill="var(--ink)" className="num">{`${f(paralela)} N`}</text>
      <text x="4" y="62" fontSize="11" fill="var(--ink)">μ·m·g·cos θ</text>
      <rect x="86" y="50" width={Math.max(2, larg(atritoMax))} height="18" rx="3" fill="var(--aviso)" opacity={vence ? 0.55 : 1} />
      <text x={86 + larg(atritoMax) + 6} y="63" fontSize="11" fill="var(--ink)" className="num">{`${f(atritoMax)} N`}</text>
    </svg>
  )
}

/** Régua de 0° a 85° com o ângulo atual e o ângulo crítico arctg μ. */
export function ReguaAngulo({ angulo, mu }: { angulo: number; mu: number }) {
  const critico = (Math.atan(mu) * 180) / Math.PI
  const px = (g: number) => 14 + (g / 85) * 292
  return (
    <svg viewBox="0 0 320 70" role="img" aria-label={`Régua de ângulos. Ângulo atual ${f(angulo)} graus; ângulo crítico ${f(critico)} graus. ${angulo > critico ? 'O bloco desliza' : 'O bloco não desliza'}.`} className="w-full">
      <rect x={px(0)} y="26" width={px(critico) - px(0)} height="10" fill="var(--ok)" opacity="0.35" />
      <rect x={px(critico)} y="26" width={px(85) - px(critico)} height="10" fill="var(--erro)" opacity="0.35" />
      <line x1={px(0)} x2={px(85)} y1="31" y2="31" stroke="var(--ink)" strokeWidth="1.5" />
      {[0, 15, 30, 45, 60, 75].map((g) => (
        <g key={g}>
          <line x1={px(g)} x2={px(g)} y1="36" y2="41" stroke="var(--ink)" />
          <text x={px(g)} y="64" textAnchor="middle" fontSize="10" fill="var(--ink-muted)" className="num">{`${g}°`}</text>
        </g>
      ))}
      <line x1={px(critico)} x2={px(critico)} y1="14" y2="36" stroke="var(--ink)" strokeWidth="2" strokeDasharray="3 2" />
      <text x={px(critico)} y="10" textAnchor="middle" fontSize="10" fill="var(--ink)" className="num">{`arctg μ = ${f(critico)}°`}</text>
      <polygon points={`${px(angulo)},38 ${px(angulo) - 6},48 ${px(angulo) + 6},48`} fill="var(--accent)" stroke="var(--ink)" strokeWidth="1" />
    </svg>
  )
}
