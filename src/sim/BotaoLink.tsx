import { useState } from 'react'
import { Link2 } from 'lucide-react'

/** Copia o endereço atual (que guarda o estado da simulação na URL). */
export function BotaoLink() {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <>
      <button type="button" className="btn" onClick={copiar}>
        <Link2 size={18} aria-hidden="true" />
        Copiar link
      </button>
      <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">
        {copiado && 'Link copiado.'}
      </span>
    </>
  )
}
