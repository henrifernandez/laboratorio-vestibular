import type { ReactNode } from 'react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { NOME_FASE, curvaAquecimento, entalpia, type Fase } from './calculo'
import type { CorpoVisual, DadosCalor, DadosCurva, DadosEquilibrio, DadosGas, Ponto } from './geradores'

const f = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/** Cor da temperatura: azul (frio) → vermelho (quente), dentro do intervalo dado. */
export const corDeT = (T: number, min = 0, max = 100) => {
  const k = Math.max(0, Math.min(1, (T - min) / (max - min)))
  return `color-mix(in srgb, #e5484d ${Math.round(k * 100)}%, #3b82f6)`
}

/* ------------------------------------------------------------------ gráfico T × Q (ou T × t) */

interface GraficoProps {
  pontos: Ponto[]
  /** curva de referência (tracejada, verde) */
  referencia?: Ponto[]
  /** trecho em destaque (acima da curva toda, mais grosso) */
  destaque?: Ponto[]
  xmax: number
  ymin: number
  ymax: number
  rotulo: string
  rotuloX?: string
  rotuloY?: string
  marcador?: Ponto | null
  extras?: { x: number; y: number; texto: string; ancora?: 'start' | 'middle' | 'end' }[]
  altura?: number
  cor?: string
  guias?: number[]
}

const W = 240
const ML = 34
const MR = 8
const MT = 10
const MB = 22

export function GraficoCurva({ pontos, referencia, destaque, xmax, ymin, ymax, rotulo, rotuloX = 'calor recebido →', rotuloY = 'T (°C)', marcador, extras = [], altura = 150, cor = 'var(--accent)', guias = [0, 100] }: GraficoProps) {
  const A = altura
  const px = (x: number) => ML + (x / xmax) * (W - ML - MR)
  const py = (y: number) => MT + (1 - (y - ymin) / (ymax - ymin)) * (A - MT - MB)
  const linha = (pts: Ponto[]) => pts.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')
  const ticks = guias.filter((g) => g >= ymin && g <= ymax)
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${A}`} role="img" aria-label={rotulo} className="w-full">
        <line x1={ML} x2={ML} y1={MT} y2={A - MB} stroke="var(--ink)" strokeWidth="1.3" />
        <line x1={ML} x2={W - MR} y1={A - MB} y2={A - MB} stroke="var(--ink)" strokeWidth="1.3" />
        {ticks.map((g) => (
          <g key={g}>
            <line x1={ML} x2={W - MR} y1={py(g)} y2={py(g)} stroke="var(--line-strong)" strokeDasharray="3 3" />
            <text x={ML - 4} y={py(g) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" className="num">
              {g}
            </text>
          </g>
        ))}
        {referencia && <polyline points={linha(referencia)} fill="none" stroke="var(--ok)" strokeWidth="2.5" strokeDasharray="5 3" strokeLinejoin="round" />}
        <polyline points={linha(pontos)} fill="none" stroke={destaque ? 'var(--line-strong)' : cor} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {destaque && <polyline points={linha(destaque)} fill="none" stroke={cor} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />}
        {extras.map((e, i) => (
          <text key={i} x={px(e.x)} y={py(e.y) - 5} textAnchor={e.ancora ?? 'middle'} fontSize="9.5" fill="var(--ink)" className="num">
            {e.texto}
          </text>
        ))}
        {marcador && <circle cx={px(marcador.x)} cy={py(marcador.y)} r="5" fill="var(--erro)" stroke="var(--paper)" strokeWidth="1.5" />}
        <text x={W - MR} y={A - 6} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)">{rotuloX}</text>
        <text x={ML + 4} y="9" fontSize="9.5" fill="var(--ink-muted)">{rotuloY}</text>
      </svg>
    </figure>
  )
}

/** Pontos (calor por grama, T) da curva da água de −30 °C a 140 °C, para o gráfico completo. */
export function pontosDaAgua(Tini = -30, Tfim = 140): Ponto[] {
  const tr = curvaAquecimento(1, Tini, Tfim)
  const pts: Ponto[] = [{ x: 0, y: tr[0]!.t0 }]
  for (const t of tr) pts.push({ x: t.q1, y: t.t1 })
  return pts
}

/** Estado (fase, T) na curva a partir do calor por grama acumulado (desde Tini). */
export function trechoEntre(Tini: number, Tfim: number, h0: number, h1: number): Ponto[] {
  const base = entalpia('gelo', Tini)
  const tr = curvaAquecimento(1, Tini, Tfim)
  const pts: Ponto[] = []
  for (const t of tr) {
    const a = Math.max(t.q0, h0 - base)
    const b = Math.min(t.q1, h1 - base)
    if (b < a - 1e-9) continue
    const prop = (x: number) => (t.q1 === t.q0 ? 0 : (x - t.q0) / (t.q1 - t.q0))
    pts.push({ x: a, y: t.t0 + (t.t1 - t.t0) * prop(a) }, { x: b, y: t.t0 + (t.t1 - t.t0) * prop(b) })
  }
  return pts
}

export function VisualCalor({ inst }: { inst: InstanciaNum<DadosCalor> }) {
  const d = inst.dados as DadosCalor
  const Tini = -30
  const Tfim = 140
  const pontos = pontosDaAgua(Tini, Tfim)
  const faseIni: Fase = d.inicio.fase
  const hIni = entalpia(faseIni, d.inicio.T)
  // fim em vapor a 100 °C significa vapor saturado: toda a massa vaporizada
  const hFim = d.fim.fase === 'agua' ? entalpia('agua', d.fim.T) : d.fim.T === 100 ? entalpia('vaporizacao', 100, 1) : entalpia('vapor', d.fim.T)
  const base = entalpia('gelo', Tini)
  const destaque = trechoEntre(Tini, Tfim, hIni, hFim)
  const xmax = pontos[pontos.length - 1]!.x
  return (
    <div className="mx-auto w-full max-w-sm">
      <GraficoCurva
        pontos={pontos}
        destaque={destaque}
        xmax={xmax}
        ymin={Tini - 5}
        ymax={Tfim + 10}
        rotulo={`Curva de aquecimento da água, com o trecho percorrido em destaque: de ${d.inicio.fase === 'gelo' ? 'gelo' : 'água'} a ${d.inicio.T} graus até ${d.fim.fase === 'agua' ? 'água' : 'vapor'} a ${d.fim.T} graus`}
        rotuloX="calor por grama →"
        marcador={{ x: hIni - base, y: d.inicio.T }}
        extras={[{ x: hFim - base, y: d.fim.T + 14, texto: 'fim' }]}
        altura={170}
        guias={[0, 100]}
      />
      <p className="text-center text-sm text-[var(--ink-muted)]">Curva de 1 g de água: o trecho em destaque é o que sua amostra percorre.</p>
    </div>
  )
}

export function VisualCurva({ inst }: { inst: InstanciaMulti<DadosCurva> }) {
  const d = inst.dados as DadosCurva
  if (!d.referencia) return null
  return (
    <div className="mx-auto w-full max-w-sm">
      <GraficoCurva pontos={d.referencia} cor="var(--ok)" xmax={d.xmax} ymin={d.ymin} ymax={d.ymax} rotulo="Gráfico de referência: temperatura de 100 g de gelo em função do tempo" rotuloX="tempo →" altura={160} />
      <p className="text-center text-sm text-[var(--ink-muted)]">Referência: 100 g (verde).</p>
    </div>
  )
}

export function OpcaoCurva({ inst, id }: { inst: InstanciaMulti<DadosCurva>; id: string }) {
  const d = inst.dados as DadosCurva
  const o = d.opcoes[id]
  if (!o) return null
  return (
    <GraficoCurva
      pontos={o.pontos}
      referencia={d.referencia}
      xmax={d.xmax}
      ymin={d.ymin}
      ymax={d.ymax}
      rotulo={`Gráfico ${id}: candidato`}
      rotuloX={d.referencia ? 'tempo →' : 'calor →'}
      altura={125}
      cor="var(--aviso)"
    />
  )
}

/* ------------------------------------------------------------------ copos para as misturas */

export function Copo({ agua, geloM = 0, T, rotulo, mMax = 600 }: { agua: number; geloM?: number; T: number; rotulo: string; mMax?: number }) {
  const total = agua + geloM
  const nivel = 18 + Math.min(1, total / mMax) * 62
  const topo = 100 - nivel
  const cubos = geloM > 0 ? Math.max(2, Math.min(9, Math.round(geloM / 60))) : 0
  return (
    <svg viewBox="0 0 110 140" role="img" aria-label={`${rotulo}: ${agua > 0 ? `${f(agua)} gramas de água` : ''}${agua > 0 && geloM > 0 ? ' e ' : ''}${geloM > 0 ? `${f(geloM)} gramas de gelo` : ''} a ${f(T)} graus Celsius`} className="w-full">
      {agua > 0 && <rect x="22" y={topo + 14} width="66" height={nivel} fill={corDeT(T)} opacity="0.85" />}
      {Array.from({ length: cubos }, (_, i) => {
        const col = i % 3
        const lin = Math.floor(i / 3)
        const baseY = agua > 0 ? topo + 12 - lin * 17 : 96 - lin * 19
        return <rect key={i} x={28 + col * 20} y={baseY} width="17" height="17" rx="3" fill="#bfe8f5" stroke="#6fb7d1" strokeWidth="1.5" transform={`rotate(${i % 2 ? 6 : -5} ${36 + col * 20} ${baseY + 8})`} />
      })}
      <path d="M20 14 L24 114 Q24 118 28 118 L82 118 Q86 118 86 114 L90 14" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="55" y="134" textAnchor="middle" fontSize="11" fill="var(--ink)" className="num">{`${f(total)} g · ${f(T)} °C`}</text>
    </svg>
  )
}

export function VisualEquilibrio({ inst }: { inst: InstanciaNum<DadosEquilibrio> }) {
  const d = inst.dados as DadosEquilibrio
  const mMax = Math.max(500, ...d.corpos.map((c: CorpoVisual) => c.m))
  return (
    <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-1" role="group" aria-label="Os dois corpos que serão misturados">
      {d.corpos.map((c: CorpoVisual, i: number) => (
        <div key={c.rotulo} className="flex flex-1 items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="text-xl text-[var(--ink-muted)]">+</span>}
          <div className="flex-1">
            <Copo agua={c.gelo ? 0 : c.m} geloM={c.gelo ? c.m : 0} T={c.T} rotulo={c.rotulo} mMax={mMax} />
            <p className="text-center text-sm text-[var(--ink-muted)]">{c.rotulo}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ pistão e diagrama p × V */

interface PistaoProps {
  V: number
  p: number
  T: number
  Vmax?: number
  rotulo: string
  /** textos mostrados abaixo do desenho */
  legenda?: ReactNode
  interrogacao?: 'p' | 'V' | 'T' | null
}

export function Pistao({ V, p, T, Vmax = 12, rotulo, interrogacao }: PistaoProps) {
  const altura = 22 + (V / Vmax) * 100
  const topo = 128 - altura
  const seta = Math.max(8, Math.min(34, p * 8))
  return (
    <svg viewBox="0 0 120 180" role="img" aria-label={rotulo} className="w-full">
      <rect x="30" y={topo} width="60" height={altura} fill={corDeT(T, 200, 800)} opacity="0.75" />
      <path d="M30 14 L30 128 L90 128 L90 14" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      <rect x="28" y={topo - 8} width="64" height="8" rx="2" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="2" />
      <line x1="60" x2="60" y1={topo - 8} y2={Math.max(4, topo - 8 - 18)} stroke="var(--ink)" strokeWidth="3" />
      <g stroke="var(--erro)" strokeWidth="2.5" strokeLinecap="round">
        <line x1="60" x2="60" y1={topo - 28 - seta} y2={topo - 28} />
        <polygon points={`60,${topo - 26} 54,${topo - 36} 66,${topo - 36}`} fill="var(--erro)" />
      </g>
      <text x="60" y="146" textAnchor="middle" fontSize="10.5" fill="var(--ink)" className="num">{`V = ${interrogacao === 'V' ? '?' : f(V)} L`}</text>
      <text x="60" y="159" textAnchor="middle" fontSize="10.5" fill="var(--ink)" className="num">{`p = ${interrogacao === 'p' ? '?' : f(p)} atm`}</text>
      <text x="60" y="173" textAnchor="middle" fontSize="10.5" fill="var(--ink)" className="num">{`T = ${interrogacao === 'T' ? '?' : f(T - 273)} °C`}</text>
    </svg>
  )
}

export function VisualGas({ inst }: { inst: InstanciaNum<DadosGas> }) {
  const d = inst.dados as DadosGas
  const Vmax = Math.max(d.ini.V, d.fim.V) * 1.15
  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2" role="group" aria-label="Estado inicial e final do gás">
      <div>
        <Pistao V={d.ini.V} p={d.ini.p} T={d.ini.T} Vmax={Vmax} rotulo={`Estado inicial: ${f(d.ini.V)} litros, ${f(d.ini.p)} atmosferas, ${f(d.ini.T - 273)} graus Celsius`} />
        <p className="text-center text-sm text-[var(--ink-muted)]">estado inicial</p>
      </div>
      <div>
        <Pistao V={d.fim.V} p={d.fim.p} T={d.fim.T} Vmax={Vmax} interrogacao={d.pede} rotulo={`Estado final: o valor de ${d.pede === 'p' ? 'pressão' : d.pede === 'V' ? 'volume' : 'temperatura'} é a incógnita`} />
        <p className="text-center text-sm text-[var(--ink-muted)]">estado final</p>
      </div>
    </div>
  )
}

interface PVProps {
  curva: { V: number; p: number }[]
  /** caminho inteiro da transformação, em tom claro, quando a curva principal é só o trecho já percorrido */
  curvaCompleta?: { V: number; p: number }[]
  ini: { V: number; p: number }
  fim: { V: number; p: number }
  atual?: { V: number; p: number }
  Vmax: number
  pmax: number
  area?: boolean
  rotulo: string
}

export function DiagramaPV({ curva, curvaCompleta, ini, fim, atual, Vmax, pmax, area, rotulo }: PVProps) {
  const A = 180
  const ML2 = 36
  const px = (V: number) => ML2 + (V / Vmax) * (W - ML2 - MR)
  const py = (p: number) => 10 + (1 - p / pmax) * (A - 10 - 30)
  const linha = curva.map((c) => `${px(c.V).toFixed(1)},${py(c.p).toFixed(1)}`).join(' ')
  const poligono = `${px(curva[0]!.V)},${py(0)} ${linha} ${px(curva[curva.length - 1]!.V)},${py(0)}`
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${A}`} role="img" aria-label={rotulo} className="w-full">
        <line x1={ML2} x2={ML2} y1="10" y2={A - 30} stroke="var(--ink)" strokeWidth="1.3" />
        <line x1={ML2} x2={W - MR} y1={A - 30} y2={A - 30} stroke="var(--ink)" strokeWidth="1.3" />
        {curvaCompleta && <polyline points={curvaCompleta.map((c) => `${px(c.V).toFixed(1)},${py(c.p).toFixed(1)}`).join(' ')} fill="none" stroke="var(--line-strong)" strokeWidth="2.5" strokeDasharray="4 3" />}
        {area && <polygon points={poligono} fill="var(--accent)" opacity="0.2" />}
        <polyline points={linha} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={px(ini.V)} cy={py(ini.p)} r="4.5" fill="var(--ink)" />
        <text x={px(ini.V) + 6} y={py(ini.p) - 6} fontSize="10" fill="var(--ink)">1</text>
        <circle cx={px(fim.V)} cy={py(fim.p)} r="4.5" fill="var(--ink)" />
        <text x={px(fim.V) + 6} y={py(fim.p) - 6} fontSize="10" fill="var(--ink)">2</text>
        {atual && <circle cx={px(atual.V)} cy={py(atual.p)} r="6" fill="var(--erro)" stroke="var(--paper)" strokeWidth="1.5" />}
        <text x={(ML2 + W - MR) / 2} y={A - 3} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">V (L) →</text>
        <text x={ML2 + 4} y="9" fontSize="10" fill="var(--ink-muted)">p (atm)</text>
        {[0, pmax].map((v) => (
          <text key={v} x={ML2 - 4} y={py(v) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" className="num">{f(v)}</text>
        ))}
        <text x={px(Vmax)} y={A - 17} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)" className="num">{f(Vmax)}</text>
        <text x={px(0)} y={A - 17} textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)" className="num">0</text>
      </svg>
    </figure>
  )
}


/* ------------------------------------------------------------------ partículas de uma amostra */

const hash = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

type Estado3 = 'solido' | 'liquido' | 'gas'
const COR_ESTADO: Record<Estado3, string> = { solido: '#7cc4de', liquido: '#4a90d9', gas: '#e5a04a' }

export function Amostra({ fase, fracao, T }: { fase: Fase; fracao: number; T: number }) {
  const N = 36
  const ordem = Array.from({ length: N }, (_, i) => i).sort((a, b) => hash(a, 1) - hash(b, 1))
  const estadoDe = (rank: number): Estado3 => {
    const k = Math.round(fracao * N)
    if (fase === 'gelo') return 'solido'
    if (fase === 'agua') return 'liquido'
    if (fase === 'vapor') return 'gas'
    if (fase === 'fusao') return rank < k ? 'liquido' : 'solido'
    return rank < k ? 'gas' : 'liquido'
  }
  const tremor = fase === 'gelo' ? 1 + Math.max(0, (T + 30) / 20) : 1.5
  return (
    <svg viewBox="0 0 110 130" role="img" aria-label={`Partículas da amostra: ${NOME_FASE[fase]}`} className="w-full">
      <rect x="6" y="6" width="98" height="118" rx="6" fill="none" stroke="var(--ink)" strokeWidth="2" />
      {Array.from({ length: N }, (_, i) => {
        const rank = ordem.indexOf(i)
        const est = estadoDe(rank)
        let x: number
        let y: number
        if (est === 'solido') {
          x = 22 + (i % 6) * 13 + (hash(i, 2) - 0.5) * tremor
          y = 80 + Math.floor(i / 6) * 7.5 + (hash(i, 3) - 0.5) * tremor
        } else if (est === 'liquido') {
          x = 16 + hash(i, 4) * 78
          y = 78 + hash(i, 5) * 38
        } else {
          x = 14 + hash(i, 6) * 82
          y = 14 + hash(i, 7) * 100
        }
        return <circle key={i} cx={x} cy={y} r="3.6" fill={COR_ESTADO[est]} stroke="var(--ink)" strokeWidth="0.6" />
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ bloco de metal e barras de calor */

export function Bloco({ m, T, rotulo }: { m: number; T: number; rotulo: string }) {
  const lado = 40 + Math.min(1, m / 500) * 34
  return (
    <svg viewBox="0 0 110 140" role="img" aria-label={`${rotulo}: ${f(m)} gramas a ${f(T)} graus Celsius`} className="w-full">
      <rect x={55 - lado / 2} y={118 - lado} width={lado} height={lado} rx="4" fill={corDeT(T, 0, 250)} stroke="var(--ink)" strokeWidth="2.5" />
      <text x="55" y="134" textAnchor="middle" fontSize="11" fill="var(--ink)" className="num">{`${f(m)} g · ${f(T)} °C`}</text>
    </svg>
  )
}

/** Calor trocado por dois corpos: negativo (cedeu) à esquerda, positivo (recebeu) à direita. */
export function BarrasCalor({ itens }: { itens: { rotulo: string; q: number }[] }) {
  const maximo = Math.max(1, ...itens.map((i) => Math.abs(i.q)))
  const metade = 100
  return (
    <svg viewBox={`0 0 ${W} ${24 + itens.length * 30}`} role="img" aria-label={`Calor trocado: ${itens.map((i) => `${i.rotulo} ${i.q >= 0 ? 'recebe' : 'cede'} ${f(Math.abs(i.q))} calorias`).join('; ')}`} className="w-full">
      <line x1={W / 2} x2={W / 2} y1="6" y2={20 + itens.length * 30} stroke="var(--ink)" strokeWidth="1.5" />
      <text x={W / 2 - 6} y="14" textAnchor="end" fontSize="9.5" fill="var(--ink-muted)">cede</text>
      <text x={W / 2 + 6} y="14" fontSize="9.5" fill="var(--ink-muted)">recebe</text>
      {itens.map((it, k) => {
        const larg = (Math.abs(it.q) / maximo) * metade
        const y = 22 + k * 30
        return (
          <g key={it.rotulo}>
            <rect x={it.q >= 0 ? W / 2 : W / 2 - larg} y={y} width={Math.max(1, larg)} height="16" rx="3" fill={it.q >= 0 ? 'var(--accent)' : 'var(--erro)'} />
            <text x={it.q >= 0 ? W / 2 + larg + 4 : W / 2 - larg - 4} y={y + 12} textAnchor={it.q >= 0 ? 'start' : 'end'} fontSize="9.5" fill="var(--ink)" className="num">{`${it.rotulo}: ${f(Math.abs(it.q))} cal`}</text>
          </g>
        )
      })}
    </svg>
  )
}
