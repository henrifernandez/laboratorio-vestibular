import { PASSOS_HISTORIA } from '@/conteudo/historia/linhaDoTempo'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { FaixaCronologica } from './Visuais'

const PASSOS: PassoEntenda[] = PASSOS_HISTORIA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <FaixaCronologica key={p.titulo} ids={p.eventos} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="linha-do-tempo" />
}
