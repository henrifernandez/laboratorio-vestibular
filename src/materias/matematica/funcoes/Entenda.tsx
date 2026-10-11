import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, XCircle } from 'lucide-react'
import { PASSOS_ENTENDA } from '@/conteudo/matematica/funcoes'
import { Tex } from '@/componentes/Tex'
import { useFuncaoAnimada } from './animar'
import { GraficoFuncao } from './GraficoFuncao'
import { JANELAS } from './janelas'
import { formulaTex } from './modelo'

function Pare({ passoIndex }: { passoIndex: number }) {
  const pare = PASSOS_ENTENDA[passoIndex]?.pare
  const [escolha, setEscolha] = useState<number | null>(null)
  if (!pare) return null
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
            <input
              type="radio"
              name={`pare-${passoIndex}`}
              checked={escolha === i}
              onChange={() => setEscolha(i)}
              style={{ accentColor: 'var(--accent)' }}
            />
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

export default function Entenda() {
  const [i, setI] = useState(0)
  const passo = PASSOS_ENTENDA[i]!
  const animada = useFuncaoAnimada(passo.funcao)
  const janela = JANELAS[passo.funcao.tipo]
  const ultimo = i === PASSOS_ENTENDA.length - 1

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="grid content-start gap-3 lg:order-2">
        <GraficoFuncao
          funcao={passo.funcao}
          curva={animada}
          janela={janela}
          realces={passo.realces}
          rotulo={`Gráfico de ${passo.funcao.tipo}, etapa ${i + 1}`}
        />
        <div className="cartao p-3 text-center text-lg">
          <Tex>{formulaTex(passo.funcao)}</Tex>
        </div>
      </div>

      <div className="grid content-start gap-4 lg:order-1">
        <p className="num text-sm font-semibold text-[var(--ink-muted)]" aria-live="polite">
          Etapa {i + 1} de {PASSOS_ENTENDA.length}
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
          <Pare key={`pare-${i}`} passoIndex={i} />
        </article>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="btn" onClick={() => setI(i - 1)} disabled={i === 0}>
            <ArrowLeft size={18} aria-hidden="true" />
            Anterior
          </button>
          <ol className="m-0 flex list-none gap-1.5 p-0" aria-label="Etapas">
            {PASSOS_ENTENDA.map((p, k) => (
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
                    style={{
                      width: k === i ? 14 : 9,
                      height: k === i ? 14 : 9,
                      background: k <= i ? 'var(--accent)' : 'var(--line-strong)',
                    }}
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
