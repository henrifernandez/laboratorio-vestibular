import type { ReactNode } from 'react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Correcao } from '@/desafios/tipos'
import type { Topologia } from './calculo'
import type { DadosBrilho, DadosConta, DadosCorrente, DadosCircuito } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

interface Comp {
  x: number
  y: number
  orient: 'h' | 'v'
}

interface Layout {
  fios: [number, number, number, number][]
  comps: Comp[]
  bateria: { x: number; y: number }
}

/** Posições dos fios, componentes e bateria de cada topologia (viewBox 300 × 180). */
export function layoutCircuito(topologia: Topologia, n: number): Layout {
  const xb = 36
  if (topologia === 'serie') {
    const comps: Comp[] = Array.from({ length: n }, (_, i) => ({ x: 70 + ((i + 0.5) * 190) / n, y: 36, orient: 'h' as const }))
    return {
      bateria: { x: xb, y: 100 },
      comps,
      fios: [
        [xb, 36, 270, 36],
        [270, 36, 270, 150],
        [270, 150, xb, 150],
        [xb, 150, xb, 36],
      ],
    }
  }
  if (topologia === 'paralelo') {
    const ys = Array.from({ length: n }, (_, i) => 30 + (i * 120) / Math.max(1, n - 1))
    const comps: Comp[] = ys.map((y) => ({ x: 150, y, orient: 'h' as const }))
    return {
      bateria: { x: xb, y: 90 },
      comps,
      fios: [
        [xb, ys[0] as number, xb, ys[n - 1] as number],
        [270, ys[0] as number, 270, ys[n - 1] as number],
        ...ys.map((y) => [xb, y, 270, y] as [number, number, number, number]),
      ],
    }
  }
  if (topologia === 'misto') {
    return {
      bateria: { x: xb, y: 90 },
      comps: [
        { x: 85, y: 30, orient: 'h' },
        { x: 175, y: 90, orient: 'v' },
        { x: 250, y: 90, orient: 'v' },
      ],
      fios: [
        [xb, 30, 250, 30],
        [250, 30, 250, 150],
        [175, 30, 175, 150],
        [250, 150, xb, 150],
        [xb, 30, xb, 150],
      ],
    }
  }
  return {
    bateria: { x: xb, y: 90 },
    comps: [
      { x: 150, y: 90, orient: 'v' },
      { x: 240, y: 62, orient: 'v' },
      { x: 240, y: 118, orient: 'v' },
    ],
    fios: [
      [xb, 30, 240, 30],
      [150, 30, 150, 150],
      [240, 30, 240, 150],
      [240, 150, xb, 150],
      [xb, 30, xb, 150],
    ],
  }
}

export interface EstadoLampada {
  /** brilho de 0 a 1 */
  brilho: number
  texto?: string
}

interface CircuitoProps {
  topologia: Topologia
  rs: number[]
  /** tensão da bateria, mostrada no símbolo */
  V?: number
  modo: 'lampada' | 'resistor'
  estados?: (EstadoLampada | undefined)[]
  /** lâmpadas em circuito aberto (queimadas) */
  abertas?: number[]
  /** lâmpada que vai queimar (marcada, mas ainda acesa) */
  marcada?: number
  /** resistor perguntado */
  alvo?: number
  rotulo: string
  /** esconde o valor das resistências (mostra só L1, L2...) */
  semValores?: boolean
  children?: ReactNode
}

function Lampada({ x, y, brilho, aberta, marcada }: { x: number; y: number; brilho: number; aberta?: boolean; marcada?: boolean }) {
  return (
    <g>
      {brilho > 0 && !aberta && <circle cx={x} cy={y} r={11 + brilho * 12} fill="var(--aviso)" opacity={0.15 + 0.35 * brilho} />}
      <circle cx={x} cy={y} r="11" fill={aberta ? 'var(--surface-2)' : brilho > 0 ? 'var(--aviso)' : 'var(--surface-2)'} fillOpacity={aberta ? 1 : 0.35 + 0.65 * brilho} stroke={marcada ? 'var(--erro)' : 'var(--ink)'} strokeWidth="2" strokeDasharray={marcada ? '3 2' : undefined} />
      {aberta ? (
        <>
          <path d={`M${x - 7} ${y - 6} L${x - 2} ${y} M${x + 2} ${y} L${x + 7} ${y + 6}`} stroke="var(--ink)" strokeWidth="1.8" fill="none" />
          <path d={`M${x - 9} ${y + 9} L${x + 9} ${y - 9}`} stroke="var(--erro)" strokeWidth="2" />
        </>
      ) : (
        <path d={`M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x + 7} ${y - 7} L${x - 7} ${y + 7}`} stroke="var(--ink)" strokeWidth="1.6" />
      )}
    </g>
  )
}

function Resistor({ x, y, orient, alvo }: { x: number; y: number; orient: 'h' | 'v'; alvo?: boolean }) {
  const w = orient === 'h' ? 32 : 13
  const h = orient === 'h' ? 13 : 32
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="2" fill="var(--surface-2)" stroke={alvo ? 'var(--accent)' : 'var(--ink)'} strokeWidth={alvo ? 3.2 : 2} />
}

export function Circuito({ topologia, rs, V, modo, estados, abertas = [], marcada, alvo, rotulo, semValores, children }: CircuitoProps) {
  const L = layoutCircuito(topologia, rs.length)
  const rotuloComp = (i: number) => (modo === 'lampada' ? `L${i + 1}` : `R${i + 1}`)
  return (
    <svg viewBox="0 0 300 180" role="img" aria-label={rotulo} className="mx-auto w-full max-w-sm">
      {L.fios.map(([x1, y1, x2, y2], k) => (
        <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      ))}
      {/* bateria */}
      <rect x={L.bateria.x - 12} y={L.bateria.y - 12} width="24" height="24" fill="var(--surface)" />
      <line x1={L.bateria.x - 12} x2={L.bateria.x + 12} y1={L.bateria.y - 5} y2={L.bateria.y - 5} stroke="var(--ink)" strokeWidth="3" />
      <line x1={L.bateria.x - 6} x2={L.bateria.x + 6} y1={L.bateria.y + 5} y2={L.bateria.y + 5} stroke="var(--ink)" strokeWidth="3" />
      <text x={L.bateria.x - 16} y={L.bateria.y - 7} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ink)">+</text>
      {V !== undefined && (
        <text x={L.bateria.x + 16} y={L.bateria.y + 4} fontSize="11" fontWeight="700" fill="var(--ink)" className="num">{`${f(V)} V`}</text>
      )}
      {L.comps.map((c, i) => {
        const est = estados?.[i]
        const aberta = abertas.includes(i)
        return (
          <g key={i}>
            {/* apaga o fio sob o componente */}
            <rect x={c.x - (c.orient === 'h' ? 18 : 8)} y={c.y - (c.orient === 'h' ? 8 : 18)} width={c.orient === 'h' ? 36 : 16} height={c.orient === 'h' ? 16 : 36} fill="var(--surface)" />
            {modo === 'lampada' ? <Lampada x={c.x} y={c.y} brilho={est?.brilho ?? 0.5} aberta={aberta} marcada={marcada === i} /> : <Resistor x={c.x} y={c.y} orient={c.orient} alvo={alvo === i} />}
            <text x={c.x} y={c.orient === 'h' ? c.y - 17 : c.y - 19} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--ink)" stroke="var(--surface)" strokeWidth="3" paintOrder="stroke">{rotuloComp(i)}</text>
            <text x={c.x} y={c.orient === 'h' ? c.y + 25 : c.y + 28} textAnchor="middle" fontSize="10" fill="var(--ink-muted)" stroke="var(--surface)" strokeWidth="3" paintOrder="stroke" className="num">
              {semValores ? '' : `${f(rs[i] as number)} Ω`}
              {est?.texto ? `${semValores ? '' : ' · '}${est.texto}` : ''}
            </text>
            {alvo === i && modo === 'resistor' && (
              <text x={c.orient === 'h' ? c.x + 22 : c.x - 22} y={c.y + 4} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--accent)">?</text>
            )}
          </g>
        )
      })}
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualBrilho({ inst, correcao }: { inst: InstanciaMulti<DadosBrilho>; correcao?: Correcao | null }) {
  const d = inst.dados as DadosBrilho
  const maior = Math.max(...d.antes, 1e-9)
  const estados = correcao ? d.antes.map((p) => ({ brilho: Math.min(1, p / maior), texto: `${f(p)} W` })) : d.rs.map(() => ({ brilho: 0.6 }))
  return (
    <div>
      <Circuito topologia={d.topologia} rs={d.rs} V={d.V} modo="lampada" estados={estados} marcada={d.queimada} rotulo={`Circuito com ${d.rs.length} lâmpadas em ${d.topologia === 'serie' ? 'série' : d.topologia === 'paralelo' ? 'paralelo' : 'associação mista'}, ligadas a uma bateria de ${d.V} volts`} />
      {correcao && <p className="text-center text-sm text-[var(--ink-muted)]">O brilho de cada lâmpada acompanha a potência dissipada{d.queimada !== undefined ? ' (antes de a lâmpada queimar)' : ''}.</p>}
      {d.queimada !== undefined && !correcao && <p className="text-center text-sm text-[var(--ink-muted)]">A lâmpada L{d.queimada + 1} (tracejada) é a que vai queimar.</p>}
    </div>
  )
}

export function VisualCircuito({ inst }: { inst: InstanciaNum<DadosCircuito | DadosCorrente> }) {
  const d = inst.dados as DadosCorrente
  return <Circuito topologia={d.topologia} rs={d.rs} V={d.V} modo="resistor" alvo={d.alvo} semValores={false} rotulo={`Circuito com resistores de ${d.rs.join(', ')} ohms em ${d.topologia === 'serie' ? 'série' : d.topologia === 'paralelo' ? 'paralelo' : 'associação mista'}${d.V ? `, ligados a ${d.V} volts` : ''}`} />
}

export function VisualConta({ inst }: { inst: InstanciaNum<DadosConta> }) {
  const d = inst.dados as DadosConta
  if (d.variante === 'chuveiro-P' || d.variante === 'chuveiro-R') return null
  return (
    <div className="mx-auto w-full max-w-md overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="pb-1 text-left text-[var(--ink-muted)]">Aparelhos{d.tarifa ? ` · tarifa R$ ${f(d.tarifa)} por kWh` : ''}</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th className="py-1 pr-2 font-semibold">Aparelho</th>
            <th className="py-1 pr-2 font-semibold">Potência</th>
            <th className="py-1 font-semibold">Uso por dia</th>
          </tr>
        </thead>
        <tbody className="num">
          {d.aparelhos.map((a) => (
            <tr key={a.nome} className="border-b border-[var(--line)]">
              <td className="py-1 pr-2">{a.nome}</td>
              <td className="py-1 pr-2">{f(a.W, 0)} W</td>
              <td className="py-1">{f(a.h)} h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ circuito animado: lei de Ohm */

export function CircuitoSimples({ V, R, fase, brilho }: { V: number; R: number; fase: number; brilho: number }) {
  const x0 = 40
  const x1 = 260
  const y0 = 34
  const y1 = 130
  const perim = 2 * (x1 - x0) + 2 * (y1 - y0)
  const ponto = (s: number) => {
    let d = (((s % 1) + 1) % 1) * perim
    if (d < x1 - x0) return { x: x0 + d, y: y0 }
    d -= x1 - x0
    if (d < y1 - y0) return { x: x1, y: y0 + d }
    d -= y1 - y0
    if (d < x1 - x0) return { x: x1 - d, y: y1 }
    d -= x1 - x0
    return { x: x0, y: y1 - d }
  }
  const N = 14
  return (
    <svg viewBox="0 0 300 165" role="img" aria-label={`Circuito simples com fonte de ${f(V)} volts e uma lâmpada de ${f(R)} ohms; os pontos são as cargas em movimento`} className="mx-auto w-full max-w-sm">
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke="var(--ink)" strokeWidth="2" rx="2" />
      <rect x="22" y="62" width="36" height="40" fill="var(--surface)" />
      <line x1="28" x2="52" y1="70" y2="70" stroke="var(--ink)" strokeWidth="3" />
      <line x1="34" x2="46" y1="80" y2="80" stroke="var(--ink)" strokeWidth="3" />
      <text x="62" y="78" fontSize="11" fontWeight="700" fill="var(--ink)" className="num">{`${f(V)} V`}</text>
      <rect x="225" y="20" width="70" height="28" fill="var(--surface)" />
      <circle cx="260" cy="34" r={14 + brilho * 9} fill="var(--aviso)" opacity={0.12 + 0.35 * brilho} />
      <circle cx="260" cy="34" r="13" fill="var(--aviso)" fillOpacity={0.2 + 0.8 * brilho} stroke="var(--ink)" strokeWidth="2" />
      <path d="M252 26 L268 42 M268 26 L252 42" stroke="var(--ink)" strokeWidth="1.6" />
      {Array.from({ length: N }, (_, k) => {
        const p = ponto(fase + k / N)
        return <circle key={k} cx={p.x} cy={p.y} r="3.2" fill="var(--accent)" stroke="var(--surface)" strokeWidth="0.8" />
      })}
      <text x="150" y="156" textAnchor="middle" fontSize="10.5" fill="var(--ink-muted)">{`lâmpada de ${f(R)} Ω`}</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ barras horizontais */

export interface ItemBarra {
  rotulo: string
  valor: number
  texto: string
  cor?: string
}

export function BarrasHor({ itens, rotulo, max }: { itens: ItemBarra[]; rotulo: string; max?: number }) {
  const maximo = Math.max(max ?? 0, ...itens.map((i) => i.valor), 1e-9)
  return (
    <svg viewBox={`0 0 300 ${12 + itens.length * 26}`} role="img" aria-label={`${rotulo}: ${itens.map((i) => `${i.rotulo} ${i.texto}`).join('; ')}`} className="w-full">
      {itens.map((it, k) => {
        const y = 8 + k * 26
        const larg = (it.valor / maximo) * 130
        return (
          <g key={it.rotulo}>
            <text x="92" y={y + 12} textAnchor="end" fontSize="10.5" fill="var(--ink)">{it.rotulo}</text>
            <rect x="98" y={y} width={Math.max(2, larg)} height="17" rx="3" fill={it.cor ?? 'var(--accent)'} />
            <text x={98 + Math.max(2, larg) + 5} y={y + 12.5} fontSize="10.5" fill="var(--ink)" className="num">{it.texto}</text>
          </g>
        )
      })}
    </svg>
  )
}
