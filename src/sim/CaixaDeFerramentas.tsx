import type { ReactNode } from 'react'

export interface Ferramenta {
  id: string
  rotulo: string
  icone: ReactNode
  ativa: boolean
}

interface Props {
  ferramentas: Ferramenta[]
  onAlternar: (id: string) => void
}

/** Ferramentas de medida guardadas numa caixa: cada uma liga e desliga o instrumento na cena. */
export function CaixaDeFerramentas({ ferramentas, onAlternar }: Props) {
  return (
    <div role="group" aria-label="Caixa de ferramentas" className="flex flex-wrap gap-2">
      {ferramentas.map((f) => (
        <button
          key={f.id}
          type="button"
          className={`btn ${f.ativa ? 'btn-primario' : ''}`}
          aria-pressed={f.ativa}
          onClick={() => onAlternar(f.id)}
        >
          <span aria-hidden="true">{f.icone}</span>
          {f.rotulo}
        </button>
      ))}
    </div>
  )
}
