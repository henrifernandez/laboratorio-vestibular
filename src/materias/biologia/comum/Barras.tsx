const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

export interface ItemBarra {
  rotulo: string
  valor: number
  /** valor esperado para comparar (marca preta sobre a barra) */
  esperado?: number
  cor?: string
}

/** Barras horizontais com valor esperado opcional. Por padrão em porcentagem (0 a 100). */
export function BarrasClasses({ titulo, itens, max = 100, unidade = '%' }: { titulo: string; itens: ItemBarra[]; max?: number; unidade?: string }) {
  const resumo = itens.map((i) => `${i.rotulo}: ${f(i.valor)} ${unidade}${i.esperado !== undefined ? ` (esperado ${f(i.esperado)} ${unidade})` : ''}`).join('; ')
  return (
    <figure className="m-0 grid gap-1">
      <figcaption className="text-sm font-semibold text-[var(--ink-muted)]">{titulo}</figcaption>
      <div role="img" aria-label={`${titulo}. ${resumo}`} className="grid gap-2">
        {itens.map((i) => (
          <div key={i.rotulo} className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
            <span className="text-right text-sm font-semibold leading-tight">{i.rotulo}</span>
            <div className="relative h-7 rounded bg-[var(--surface-2)]">
              <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${Math.min(100, (i.valor / max) * 100)}%`, background: i.cor ?? 'var(--accent)', transition: 'width var(--dur-media)' }} />
              {i.esperado !== undefined && <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-[var(--ink)]" style={{ left: `${Math.min(100, (i.esperado / max) * 100)}%` }} />}
              <span className="num absolute inset-y-0 right-2 flex items-center text-sm font-semibold" style={{ textShadow: '0 0 4px var(--surface)' }}>
                {f(i.valor, 2)} {unidade}
              </span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  )
}
