import type { ReactNode } from 'react'

export interface Tela {
  id: string
  rotulo: string
  icone?: ReactNode
}

interface Props {
  telas: Tela[]
  atual: string
  onChange: (id: string) => void
}

/** Barra inferior para alternar entre as telas da simulação (Introdução, Explorar, Laboratório, Jogo). */
export function BarraDeTelas({ telas, atual, onChange }: Props) {
  const mover = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const prox = telas[(i + (e.key === 'ArrowRight' ? 1 : telas.length - 1)) % telas.length]
    if (prox) {
      onChange(prox.id)
      document.getElementById(`tela-${prox.id}`)?.focus()
    }
  }
  return (
    <div role="tablist" aria-label="Telas da simulação" className="grid border-t border-[var(--line)]" style={{ gridTemplateColumns: `repeat(${telas.length}, 1fr)` }}>
      {telas.map((t, i) => {
        const ativa = t.id === atual
        return (
          <button
            key={t.id}
            id={`tela-${t.id}`}
            role="tab"
            type="button"
            aria-selected={ativa}
            tabIndex={ativa ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => mover(e, i)}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-sm font-semibold transition-colors"
            style={{
              color: ativa ? 'var(--accent)' : 'var(--ink-muted)',
              boxShadow: ativa ? 'inset 0 3px 0 var(--accent)' : 'none',
              background: ativa ? 'var(--surface-2)' : 'transparent',
            }}
          >
            {t.icone && <span aria-hidden="true">{t.icone}</span>}
            {t.rotulo}
          </button>
        )
      })}
    </div>
  )
}
