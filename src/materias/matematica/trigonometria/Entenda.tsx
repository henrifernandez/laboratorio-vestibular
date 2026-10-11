import { PASSOS_TRIG, type VisualTrig } from '@/conteudo/matematica/trigonometria'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { quadrante } from './calculo'
import { CirculoTrig, Legenda, OndaTrig, TabelaSinais } from './Visuais'

function Visual({ v }: { v: VisualTrig }) {
  if (v.tipo === 'onda') {
    return (
      <div className="grid gap-2">
        <OndaTrig graus={v.graus} />
        <Legenda />
      </div>
    )
  }
  if (v.tipo === 'sinais') {
    return (
      <div className="grid gap-2">
        <CirculoTrig graus={v.graus} altura={280} />
        <TabelaSinais destaque={quadrante(v.graus) || undefined} />
      </div>
    )
  }
  return (
    <div className="grid gap-2">
      <CirculoTrig graus={v.graus} tangente={v.tangente} radianos={v.radianos} />
      <Legenda />
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_TRIG.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="trigonometria" />
}
