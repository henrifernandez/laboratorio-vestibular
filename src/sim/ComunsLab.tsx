import { useId, type ReactNode } from 'react'
import { BotaoLink } from './BotaoLink'
import { BotaoReiniciar } from './BotaoReiniciar'

export interface OpcaoSimples {
  id: string
  rotulo: string
}

/** Escolha entre poucas opções, como botões de rádio: as setas do teclado trocam a opção. */
export function Alternador({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: string; opcoes: OpcaoSimples[]; onChange: (id: string) => void }) {
  const nome = useId()
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-[var(--ink-muted)]">{rotulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label
            key={o.id}
            className={`btn cursor-pointer has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${o.id === valor ? 'btn-primario' : ''}`}
          >
            <input type="radio" name={nome} value={o.id} checked={o.id === valor} onChange={() => onChange(o.id)} className="sr-only" />
            {o.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Lista suspensa com rótulo. */
export function Seletor({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: string; opcoes: OpcaoSimples[]; onChange: (id: string) => void }) {
  const id = useId()
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-semibold">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(ev) => onChange(ev.target.value)} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3">
        {opcoes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Reiniciar e copiar o link, lado a lado, no fim dos controles. */
export function Rodape({ onReiniciar }: { onReiniciar: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BotaoReiniciar onClick={onReiniciar} />
      <BotaoLink />
    </div>
  )
}

/** Cartão com os números do momento; `vivo` avisa os leitores de tela quando o conteúdo muda. */
export const Cartao = ({ children, vivo = false }: { children: ReactNode; vivo?: boolean }) => (
  <div className="cartao num grid gap-1 p-3" aria-live={vivo ? 'polite' : undefined}>
    {children}
  </div>
)

/** Passo de grade "redondo" (1, 2, 5 × potência de 10) perto de v. */
export const bonito = (v: number) => {
  const pot = 10 ** Math.floor(Math.log10(Math.max(v, 1e-9)))
  const m = v / pot
  return (m <= 1.5 ? 1 : m <= 3.5 ? 2 : m <= 7.5 ? 5 : 10) * pot
}
