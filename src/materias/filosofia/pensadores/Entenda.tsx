import { PASSOS_FILOSOFIA, PENSADORES } from '@/conteudo/filosofia/pensadores'
import { autorPorId, NOTA_AUTORES, type PassoHumanas } from '@/conteudo/humanas'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { CartaoAutor } from '../../humanas/comum/Visuais'
import { LegendaLinha, LinhaDoTempoPensadores, QuadroCorrentes } from './Visuais'

function Visual({ passo }: { passo: PassoHumanas }) {
  if (passo.visual === 'correntes') return <QuadroCorrentes />
  const ids = passo.autores ?? []
  if (!ids.length) {
    return (
      <div className="grid gap-2">
        <LinhaDoTempoPensadores />
        <LegendaLinha />
      </div>
    )
  }
  return (
    <div className="grid gap-3">
      {ids.map((id) => {
        const a = autorPorId(PENSADORES, id)
        return a ? <CartaoAutor key={id} autor={a} compacto={ids.length > 1} nivelTitulo={3} /> : null
      })}
      <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_AUTORES}</p>
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_FILOSOFIA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} passo={p} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="pensadores" />
}
