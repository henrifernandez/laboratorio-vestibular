import { PASSOS_ORG, type VisualOrg } from '@/conteudo/quimica/organica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { AnatomiaNome, Galeria, GaleriaEspacial, GaleriaPlana, LeituraTracos, NITROGENADAS, OXIGENADAS } from './Visuais'

function Visual({ v }: { v: VisualOrg }) {
  switch (v.tipo) {
    case 'leitura':
      return <LeituraTracos />
    case 'oxigenadas':
      return <Galeria itens={OXIGENADAS} />
    case 'nitrogenadas':
      return <Galeria itens={NITROGENADAS} />
    case 'nome':
      return <AnatomiaNome />
    case 'plana':
      return <GaleriaPlana />
    default:
      return <GaleriaEspacial />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_ORG.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="organica" />
}
