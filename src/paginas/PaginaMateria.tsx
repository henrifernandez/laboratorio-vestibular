import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { acharMateria } from '@/conteudo/materias'
import { desafiosResolvidos } from '@/desafios/progresso'
import { useProgresso } from '@/desafios/useProgresso'
import { BarraProgresso } from '@/componentes/BarraProgresso'
import NaoEncontrada from './NaoEncontrada'

export default function PaginaMateria() {
  const { materia } = useParams()
  const m = acharMateria(materia)
  const progresso = useProgresso()
  if (!m) return <NaoEncontrada />

  return (
    <div data-materia={m.id} className="container-site grid gap-6 py-8">
      <nav aria-label="Você está em" className="text-sm text-[var(--ink-muted)]">
        <Link to="/">Início</Link> / <span aria-current="page">{m.nome}</span>
      </nav>
      <header className="grid gap-2 border-l-8 pl-4" style={{ borderColor: 'var(--accent)' }}>
        <h1 className="text-4xl" style={{ color: 'var(--accent)' }}>
          {m.nome}
        </h1>
        <p className="max-w-[60ch] text-lg text-[var(--ink-muted)]">{m.descricao}</p>
      </header>
      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
        {m.temas.map((t) => {
          const total = t.totalNiveis ?? 0
          const feitos = Math.min(desafiosResolvidos(progresso, m.id, t.id), total)
          const conteudo = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl">{t.titulo}</h2>
                {t.disponivel ? <ChevronRight aria-hidden="true" /> : <span className="chip">Em breve</span>}
              </div>
              <p className="text-[var(--ink-muted)]">{t.descricao}</p>
              {t.disponivel && total > 0 && (
                <div className="grid gap-1">
                  <span className="num text-sm font-semibold">
                    {feitos} de {total} desafios resolvidos
                  </span>
                  <BarraProgresso valor={feitos / total} rotulo={`Progresso em ${t.titulo}`} />
                </div>
              )}
            </>
          )
          return (
            <li key={t.id}>
              {t.disponivel ? (
                <Link to={`/materia/${m.id}/${t.id}`} className="cartao grid h-full gap-2 p-4 no-underline transition-transform hover:-translate-y-0.5">
                  {conteudo}
                </Link>
              ) : (
                <div className="cartao grid h-full gap-2 p-4 opacity-75">{conteudo}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
