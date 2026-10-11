import { Pause, Play, StepForward } from 'lucide-react'
import { VELOCIDADES, type Velocidade } from './laco'

interface Props {
  rodando: boolean
  onAlternar: () => void
  onPasso: () => void
  velocidade: Velocidade
  onVelocidade: (v: Velocidade) => void
}

export function ControlesDeTempo({ rodando, onAlternar, onPasso, velocidade, onVelocidade }: Props) {
  return (
    <div role="group" aria-label="Controles de tempo" className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn btn-primario" onClick={onAlternar} aria-pressed={rodando}>
        {rodando ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        {rodando ? 'Pausar' : 'Iniciar'}
      </button>
      <button type="button" className="btn" onClick={onPasso} aria-label="Avançar um passo">
        <StepForward size={18} aria-hidden="true" />
      </button>
      <div role="radiogroup" aria-label="Velocidade" className="flex gap-1">
        {VELOCIDADES.map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={v === velocidade}
            className={`btn num ${v === velocidade ? 'btn-primario' : ''}`}
            onClick={() => onVelocidade(v)}
          >
            {String(v).replace('.', ',')}×
          </button>
        ))}
      </div>
    </div>
  )
}
