import { PASSOS_ESTAT, type VisualEstat } from '@/conteudo/matematica/estatistica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { histograma } from './calculo'
import { Histograma, PontosNaReta } from './Visuais'

function Visual({ v }: { v: VisualEstat }) {
  if (v.tipo === 'pontos') {
    return <PontosNaReta valores={v.valores} limite={Math.max(10, ...v.valores) + 2} mostrarMedia={v.media} mostrarMediana={v.mediana} mostrarModa={v.moda} extremo={v.extremo} />
  }
  const classes = histograma(
    v.freqs.flatMap((f, k) => Array(f).fill(v.inicio + k * v.largura) as number[]),
    v.inicio,
    v.largura,
    v.freqs.length,
  )
  return <Histograma classes={classes} mostrarValores />
}

const PASSOS: PassoEntenda[] = PASSOS_ESTAT.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="estatistica" />
}
