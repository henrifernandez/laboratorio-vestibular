import { AUTORES_SOCIOLOGIA, PASSOS_SOCIOLOGIA } from '@/conteudo/sociologia/tresLentes'
import { autorPorId, NOTA_AUTORES, type PassoHumanas } from '@/conteudo/humanas'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { CartaoAutor } from '../../humanas/comum/Visuais'

function Visual({ passo }: { passo: PassoHumanas }) {
  const ids = passo.autores ?? []
  if (!ids.length) {
    const ordenados = [...AUTORES_SOCIOLOGIA].sort((a, b) => a.nascimento - b.nascimento)
    return (
      <div className="cartao p-3">
        <p className="m-0 mb-1 text-sm font-semibold text-[var(--ink-muted)]">Os autores deste tema, por ano de nascimento</p>
        <ol className="m-0 grid list-none gap-1 p-0 text-sm">
          {ordenados.map((a) => (
            <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--line)] pb-1">
              <strong>{a.nome}</strong>
              <span className="num text-[var(--ink-muted)]">{a.periodo}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }
  return (
    <div className="grid gap-3">
      {ids.map((id) => {
        const a = autorPorId(AUTORES_SOCIOLOGIA, id)
        return a ? <CartaoAutor key={id} autor={a} compacto={ids.length > 1} nivelTitulo={3} /> : null
      })}
      <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_AUTORES}</p>
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_SOCIOLOGIA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} passo={p} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="tres-lentes" />
}
