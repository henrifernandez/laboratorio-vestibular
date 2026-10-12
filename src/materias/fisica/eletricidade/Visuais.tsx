import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Correcao } from '@/desafios/tipos'
import { Circuito } from './Circuitos'
import type { DadosBrilho, DadosConta, DadosCorrente, DadosCircuito } from './geradores'

export { Circuito, CircuitoSimples, LegendaCircuitoSimples, type EstadoLampada } from './Circuitos'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

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
