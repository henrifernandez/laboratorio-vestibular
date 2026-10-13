import { useId, useState } from 'react'

interface Props {
  rotulo: string
  valor: number
  onChange: (v: number) => void
  min: number
  max: number
  passo?: number
  /** valores com marcação visível sob o controle */
  marcas?: number[]
  unidade?: string
  /** texto lido por leitores de tela */
  descricao?: string
  /** como escrever as marcas (ex.: anos antes de Cristo) */
  formatarMarca?: (m: number) => string
}

const casas = (passo: number) => (String(passo).split('.')[1] ?? '').length

export function ControleDeslizante({ rotulo, valor, onChange, min, max, passo = 1, marcas, unidade, descricao, formatarMarca }: Props) {
  const id = useId()
  const [rascunho, setRascunho] = useState<string | null>(null)
  const ajusta = (v: number) => Math.min(max, Math.max(min, Math.round(v / passo) * passo))
  const texto = rascunho ?? valor.toFixed(casas(passo)).replace('.', ',')

  const confirmar = (bruto: string) => {
    const n = Number(bruto.replace(',', '.'))
    if (bruto.trim() !== '' && Number.isFinite(n)) onChange(Number(ajusta(n).toFixed(casas(passo))))
    setRascunho(null)
  }

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-semibold">
          {rotulo}
        </label>
        <span className="flex items-center gap-1">
          <input
            aria-label={`${rotulo}, valor numérico`}
            inputMode="decimal"
            value={texto}
            onChange={(e) => setRascunho(e.target.value)}
            onBlur={(e) => confirmar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmar((e.target as HTMLInputElement).value)
              if (e.key === 'Escape') setRascunho(null)
            }}
            className="num h-11 w-20 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-2 text-right font-semibold"
          />
          {unidade && <span className="text-sm text-[var(--ink-muted)]">{unidade}</span>}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        aria-describedby={descricao ? `${id}-d` : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer"
        style={{ accentColor: 'var(--accent)' }}
      />
      {descricao && (
        <span id={`${id}-d`} className="sr-only">
          {descricao}
        </span>
      )}
      {marcas && (
        <div className="num relative -mt-2 h-4 text-xs text-[var(--ink-muted)]" aria-hidden="true">
          {marcas.map((m) => (
            <span
              key={m}
              className="absolute -translate-x-1/2"
              style={{ left: `calc(${((m - min) / (max - min)) * 100}% + ${8 - ((m - min) / (max - min)) * 16}px)` }}
            >
              {formatarMarca ? formatarMarca(m) : String(m).replace('.', ',')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
