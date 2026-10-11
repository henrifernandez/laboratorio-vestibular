export interface ItemVisibilidade {
  id: string
  rotulo: string
  ativo: boolean
}

interface Props {
  itens: ItemVisibilidade[]
  onChange: (id: string, ativo: boolean) => void
  titulo?: string
}

/** Caixas para mostrar ou esconder ajudas: grade, valores, vetores, rastro... */
export function PainelDeVisibilidade({ itens, onChange, titulo = 'Mostrar' }: Props) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-[var(--ink-muted)]">{titulo}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {itens.map((i) => (
          <label key={i.id} className="flex min-h-11 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={i.ativo}
              onChange={(e) => onChange(i.id, e.target.checked)}
              className="size-5"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span>{i.rotulo}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
