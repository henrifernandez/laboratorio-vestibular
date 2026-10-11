import { useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PareEPense } from '@/conteudo/tipos'

export interface PassoEntenda {
  titulo: string
  /** parágrafos curtos; exemplos antes de definições */
  texto: string[]
  pare?: PareEPense
  /** a simulação da etapa (gráfico, desenho...) */
  visual: ReactNode
}

function Pare({ pare, id }: { pare: PareEPense; id: string }) {
  const [escolha, setEscolha] = useState<number | null>(null)
  const respondeu = escolha !== null
  const acertou = escolha === pare.certa
  return (
    <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] p-4">
      <legend className="flex items-center gap-2 px-1 font-semibold">
        <HelpCircle size={18} aria-hidden="true" />
        Pare e pense
      </legend>
      <p>{pare.pergunta}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {pare.opcoes.map((o, i) => (
          <label
            key={o}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3"
            style={{ borderColor: respondeu && i === pare.certa ? 'var(--ok)' : undefined }}
          >
            <input type="radio" name={`pare-${id}`} checked={escolha === i} onChange={() => setEscolha(i)} style={{ accentColor: 'var(--accent)' }} />
            {o}
          </label>
        ))}
      </div>
      <div aria-live="polite">
        {respondeu && (
          <p className="flex items-start gap-2" style={{ color: acertou ? 'var(--ok)' : 'var(--erro)' }}>
            {acertou ? <CheckCircle2 size={20} aria-hidden="true" /> : <XCircle size={20} aria-hidden="true" />}
            <span className="text-[var(--ink)]">
              <strong>{acertou ? 'Isso! ' : 'Quase. '}</strong>
              {pare.explicacao}
            </span>
          </p>
        )}
      </div>
    </fieldset>
  )
}

/** Explicação curta e visual em etapas: a cada etapa a simulação ao lado muda de estado. */
export function EntendaPassos({ passos, idTema }: { passos: PassoEntenda[]; idTema: string }) {
  const [i, setI] = useState(0)
  const passo = passos[i] as PassoEntenda
  const ultimo = i === passos.length - 1

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid content-start gap-3 lg:order-2">{passo.visual}</div>

      <div className="grid content-start gap-4 lg:order-1">
        <p className="num text-sm font-semibold text-[var(--ink-muted)]" aria-live="polite">
          Etapa {i + 1} de {passos.length}
        </p>
        <article key={i} className="grid gap-3">
          <h2 className="text-3xl" style={{ color: 'var(--accent)' }}>
            {passo.titulo}
          </h2>
          {passo.texto.map((t) => (
            <p key={t} className="max-w-[65ch] text-lg">
              {t}
            </p>
          ))}
          {passo.pare && <Pare key={`pare-${i}`} pare={passo.pare} id={`${idTema}-${i}`} />}
        </article>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="btn" onClick={() => setI(i - 1)} disabled={i === 0}>
            <ArrowLeft size={18} aria-hidden="true" />
            Anterior
          </button>
          <ol className="m-0 flex list-none gap-1.5 p-0" aria-label="Etapas">
            {passos.map((p, k) => (
              <li key={p.titulo}>
                <button
                  type="button"
                  aria-label={`Ir para a etapa ${k + 1}`}
                  aria-current={k === i ? 'step' : undefined}
                  onClick={() => setI(k)}
                  className="grid size-6 place-items-center rounded-full"
                >
                  <span
                    className="block rounded-full transition-all"
                    style={{ width: k === i ? 14 : 9, height: k === i ? 14 : 9, background: k <= i ? 'var(--accent)' : 'var(--line-strong)' }}
                  />
                </button>
              </li>
            ))}
          </ol>
          {ultimo ? (
            <Link className="btn btn-primario no-underline" to="?aba=laboratorio">
              Ir ao laboratório
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" className="btn btn-primario" onClick={() => setI(i + 1)}>
              Próxima
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
