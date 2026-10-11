import { ArrowRight } from 'lucide-react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { GraficoJuros } from './GraficoJuros'
import type { DadosCruz, DadosRegime, DadosSucessivos } from './geradores'

const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`
const pct = (p: number) => `${p > 0 ? '+' : '−'}${Math.abs(p)}%`

/** Barras proporcionais: cada valor ao lado do anterior, para ver o que cresce e o que cai. */
export function BarrasValores({ itens }: { itens: { rotulo: string; valor: number }[] }) {
  const max = Math.max(...itens.map((i) => i.valor))
  return (
    <figure className="cartao m-0 p-4" aria-label="Barras com os valores em cada etapa">
      <div className="flex h-44 items-end gap-3">
        {itens.map((i, k) => (
          <div key={k} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
            <span className="num text-sm font-semibold">{brl(i.valor)}</span>
            <div
              className="w-full rounded-t-md transition-[height] duration-500"
              style={{ height: `${Math.max(4, (i.valor / max) * 78)}%`, background: k === 0 ? 'var(--line-strong)' : 'var(--accent)' }}
            />
            <span className="text-xs text-[var(--ink-muted)]">{i.rotulo}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}

/** Cadeia de blocos: preço inicial e as variações em ordem (sem revelar os valores). */
export function CadeiaDeBlocos({ preco, passos }: { preco: number; passos: number[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Sequência de variações">
      <span role="listitem" className="chip num px-3 py-2 text-base">
        {brl(preco)}
      </span>
      {passos.map((p, i) => (
        <span key={i} role="listitem" className="flex items-center gap-2">
          <ArrowRight size={16} aria-hidden="true" />
          <span className="chip num px-3 py-2 text-base" style={{ color: p > 0 ? 'var(--ok)' : 'var(--erro)', borderColor: 'currentColor' }}>
            {pct(p)}
          </span>
        </span>
      ))}
    </div>
  )
}

export function VisualCruz({ inst }: { inst: InstanciaNum<DadosCruz> }) {
  const d = inst.dados as DadosCruz
  return <GraficoJuros capital={d.capital} iSimples={d.iSimples} jComposto={d.jComposto} tmax={d.mes + 5} pontos={d.mes + 5 <= 30} />
}

export function VisualSucessivos({ inst }: { inst: InstanciaNum<DadosSucessivos> }) {
  const d = inst.dados as DadosSucessivos
  return <CadeiaDeBlocos preco={d.preco} passos={d.passos} />
}

export function VisualRegime({ inst }: { inst: InstanciaMulti<DadosRegime> }) {
  const v = (inst.dados as DadosRegime).valores
  return (
    <div className="overflow-x-auto">
      <table className="num w-full max-w-lg border-collapse text-center" aria-label="Montante em cada mês">
        <thead>
          <tr>
            <th scope="row" className="border border-[var(--line)] bg-[var(--surface-2)] p-2 text-left">Mês</th>
            {v.map((_, t) => (
              <td key={t} className="border border-[var(--line)] bg-[var(--surface-2)] p-2 font-semibold">{t}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="border border-[var(--line)] p-2 text-left">Montante</th>
            {v.map((x, t) => (
              <td key={t} className="border border-[var(--line)] p-2">{brl(x)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
