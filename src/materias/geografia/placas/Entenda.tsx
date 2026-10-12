import { PASSOS_PLACAS, type VisualPlacas } from '@/conteudo/geografia/placas'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import type { IdLimite } from './calculo'
import { AssoalhoDidatico, QuadroExemplos, QuadroLimites } from './Quadros'
import { CamadasSvg, CorteSvg, FichaLimite, LegendaCorte } from './Visuais'

function Visual({ v }: { v: VisualPlacas }) {
  switch (v.tipo) {
    case 'camadas':
      return <CamadasSvg destaque={v.destaque} />
    case 'corte':
      return (
        <div className="grid gap-2">
          <CorteSvg limite={v.limite} progresso={v.p} />
          <LegendaCorte planta={v.limite === 'transformante'} />
          <FichaLimite id={v.limite as IdLimite} />
        </div>
      )
    case 'quadro':
      return <QuadroLimites />
    case 'assoalho':
      return <AssoalhoDidatico />
    case 'exemplos':
      return <QuadroExemplos />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_PLACAS.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="placas" />
}
