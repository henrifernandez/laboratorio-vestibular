import { PASSOS_PA_PG, type VisualSeq } from '@/conteudo/matematica/pa-pg'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { termosPA, termosPG } from './calculo'
import { BarrasSequencia } from './Visuais'

function Visual({ v }: { v: VisualSeq }) {
  const termos = v.tipo === 'PA' ? termosPA(v.a1, v.razao, v.n) : termosPG(v.a1, v.razao, v.n)
  return <BarrasSequencia termos={termos} rotulo={`Barras de uma ${v.tipo}`} mostrarValores={v.n <= 10} />
}

const PASSOS: PassoEntenda[] = PASSOS_PA_PG.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="pa-pg" />
}
