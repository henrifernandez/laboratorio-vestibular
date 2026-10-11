import { PASSOS_COMB, type VisualComb } from '@/conteudo/matematica/combinatoria'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { ArvorePossibilidades, VisualArranjoCombinacao, VisualDado, VisualPermutacao, VisualSimulacao } from './Visuais'

function Visual({ v }: { v: VisualComb }) {
  switch (v.tipo) {
    case 'arvore':
      return <ArvorePossibilidades niveis={v.niveis} />
    case 'permutacao':
      return <VisualPermutacao letras={v.letras} />
    case 'arranjoCombinacao':
      return <VisualArranjoCombinacao letras={v.letras} p={v.p} />
    case 'dado':
      return <VisualDado favoraveis={v.favoraveis} titulo={v.titulo} />
    case 'simulacao':
      return <VisualSimulacao lancamentos={v.lancamentos} />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_COMB.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="combinatoria" />
}
