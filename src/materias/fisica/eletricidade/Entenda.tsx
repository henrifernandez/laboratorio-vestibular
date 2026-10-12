import { PASSOS_ELE, type VisualEle } from '@/conteudo/fisica/eletricidade'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { resolver, montar } from './calculo'
import { BarrasHor, Circuito, CircuitoSimples, LegendaCircuitoSimples } from './Visuais'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

function Visual({ v }: { v: VisualEle }) {
  if (v.tipo === 'ohm') {
    const i = v.V / v.R
    return (
      <div>
        <CircuitoSimples V={v.V} R={v.R} fase={0.05} brilho={Math.min(1, (v.V * i) / 40)} />
        <LegendaCircuitoSimples />
        <p className="num text-center text-sm text-[var(--ink-muted)]">
          i = V/R = {f(v.V)}/{f(v.R)} = {f(i)} A · P = V·i = {f(v.V * i)} W
        </p>
      </div>
    )
  }
  if (v.tipo === 'circuito') {
    const fs = resolver(montar(v.topologia, v.rs), v.V)
    const maior = Math.max(...fs.map((x) => x.P))
    return (
      <div>
        <Circuito
          topologia={v.topologia}
          rs={v.rs}
          V={v.V}
          modo="lampada"
          estados={fs.map((x) => ({ brilho: x.P / maior, texto: `${f(x.V)} V · ${f(x.i)} A` }))}
          rotulo={`Circuito com ${v.rs.length} lâmpadas em ${v.topologia === 'serie' ? 'série' : 'paralelo'}, ligadas a uma bateria de ${v.V} volts; cada lâmpada mostra sua tensão e corrente`}
        />
        <p className="text-center text-sm text-[var(--ink-muted)]">{v.topologia === 'serie' ? 'Mesma corrente; a tensão se divide.' : 'Mesma tensão; a corrente se divide.'}</p>
      </div>
    )
  }
  const itens = [
    { rotulo: 'Chuveiro', valor: 4.4 * 0.5 * 30, texto: '66 kWh' },
    { rotulo: 'Geladeira', valor: 0.2 * 10 * 30, texto: '60 kWh' },
    { rotulo: 'Ferro', valor: 1 * 1 * 30, texto: '30 kWh' },
    { rotulo: 'TV', valor: 0.1 * 4 * 30, texto: '12 kWh' },
    { rotulo: '10 lâmpadas LED', valor: 0.1 * 5 * 30, texto: '15 kWh' },
  ]
  return (
    <div className="mx-auto w-full max-w-md">
      <BarrasHor itens={itens} rotulo="Consumo mensal de alguns aparelhos em quilowatts-hora" />
      <p className="text-center text-sm text-[var(--ink-muted)]">Consumo em 30 dias (chuveiro 30 min/dia, geladeira 10 h/dia, ferro 1 h/dia, TV 4 h/dia, LEDs 5 h/dia).</p>
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_ELE.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="eletricidade" />
}
