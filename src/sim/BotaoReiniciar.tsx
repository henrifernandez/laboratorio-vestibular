import { RotateCcw } from 'lucide-react'

export function BotaoReiniciar({ onClick, rotulo = 'Reiniciar' }: { onClick: () => void; rotulo?: string }) {
  return (
    <button type="button" className="btn" onClick={onClick}>
      <RotateCcw size={18} aria-hidden="true" />
      {rotulo}
    </button>
  )
}
