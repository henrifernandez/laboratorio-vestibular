import { Minus, Plus } from 'lucide-react'

interface Props {
  rotulo: string
  valor: number
  onChange: (v: number) => void
  min?: number
  max?: number
  passo?: number
}

export function SeletorNumerico({ rotulo, valor, onChange, min = -Infinity, max = Infinity, passo = 1 }: Props) {
  const mudar = (d: number) => {
    const v = Math.round((valor + d) * 1000) / 1000
    onChange(Math.min(max, Math.max(min, v)))
  }
  return (
    <div role="group" aria-label={rotulo} className="inline-flex items-center gap-1">
      <button type="button" className="btn" aria-label={`Diminuir ${rotulo}`} onClick={() => mudar(-passo)} disabled={valor <= min}>
        <Minus size={18} aria-hidden="true" />
      </button>
      <output className="num min-w-14 text-center text-lg font-semibold" aria-live="polite">
        {String(valor).replace('.', ',')}
      </output>
      <button type="button" className="btn" aria-label={`Aumentar ${rotulo}`} onClick={() => mudar(passo)} disabled={valor >= max}>
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
