import { PASSOS_JUROS, type VisualJuros } from '@/conteudo/matematica/juros'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { GraficoJuros } from './GraficoJuros'
import { BarrasValores, CadeiaDeBlocos } from './Visuais'
import { aplicarPercentuais } from './calculo'

function Visual({ v }: { v: VisualJuros }) {
  if (v.tipo === 'grafico') {
    return <GraficoJuros capital={v.capital} iSimples={v.iSimples} jComposto={v.jComposto} tmax={v.tmax} simples={v.simples} composto={v.composto} pontos={v.tmax <= 12} />
  }
  if (v.tipo === 'fator') {
    const final = v.inicial * (1 + v.percentual / 100)
    return (
      <BarrasValores
        itens={[
          { rotulo: 'inicial', valor: v.inicial },
          { rotulo: `×${String(1 + v.percentual / 100).replace('.', ',')}`, valor: final },
        ]}
      />
    )
  }
  const valores = aplicarPercentuais(v.inicial, v.passos)
  return (
    <div className="grid gap-3">
      <CadeiaDeBlocos preco={v.inicial} passos={v.passos} />
      <BarrasValores itens={valores.map((x, i) => ({ rotulo: i === 0 ? 'inicial' : `${i}º passo`, valor: x }))} />
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_JUROS.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="juros" />
}
