import { useMemo, useRef } from 'react'
import { Plot, Point, Text } from 'mafs'
import type { EntradaProps } from '@/desafios/PainelDesafio'
import { Cena } from '@/sim/Cena'
import { compilar } from './expressao'
import { dominioDe } from './GraficoFuncao'
import { avaliar } from './modelo'
import type { InstanciaFormula } from './formula'

const ATALHOS = [
  { t: '^', rotulo: '^', desc: 'potência' },
  { t: '(', rotulo: '(', desc: 'abre parêntese' },
  { t: ')', rotulo: ')', desc: 'fecha parêntese' },
  { t: 'sqrt(', rotulo: '√', desc: 'raiz quadrada' },
  { t: 'log(x, 2)', rotulo: 'log₂', desc: 'logaritmo na base 2' },
  { t: 'ln(x)', rotulo: 'ln', desc: 'logaritmo natural' },
  { t: 'e^x', rotulo: 'eˣ', desc: 'exponencial de base e' },
]

export function EntradaFormula({ inst, resposta, onChange, bloqueado }: EntradaProps<InstanciaFormula, string>) {
  const campo = useRef<HTMLInputElement>(null)
  const compilada = useMemo(() => (resposta.trim() ? compilar(resposta) : null), [resposta])
  const j = inst.janela

  const inserir = (t: string) => {
    const el = campo.current
    const ini = el?.selectionStart ?? resposta.length
    const fim = el?.selectionEnd ?? resposta.length
    onChange(resposta.slice(0, ini) + t + resposta.slice(fim))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(ini + t.length, ini + t.length)
    })
  }

  return (
    <div className="grid gap-3">
      <Cena janela={j} rotulo="Gráfico com pontos marcados. Digite a fórmula da função.">
        <Plot.OfX y={(x) => avaliar(inst.alvo, x)} domain={dominioDe(inst.alvo, j)} color="var(--curva-alvo)" weight={3} />
        {compilada?.ok && <Plot.OfX y={compilada.fn} color="var(--accent)" weight={3.5} style="dashed" />}
        {inst.pontos.map((p) => (
          <g key={`${p.x},${p.y}`}>
            <Point x={p.x} y={p.y} color="var(--ink)" />
            <Text x={p.x} y={p.y} attach="ne" attachDistance={10} size={13}>
              {`(${p.x}, ${p.y})`}
            </Text>
          </g>
        ))}
      </Cena>
      <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
        <span>
          <span aria-hidden="true" style={{ color: 'var(--curva-alvo)' }}>━</span> curva-alvo
        </span>
        <span>
          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>╌</span> a sua fórmula, ao vivo
        </span>
      </p>
      <div className="grid gap-1">
        <label htmlFor="formula-resposta" className="font-semibold">
          f(x) =
        </label>
        <input
          id="formula-resposta"
          ref={campo}
          value={resposta}
          disabled={bloqueado}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder="ex.: 2(x-1)^2 + 3"
          aria-describedby="formula-dica"
          aria-invalid={compilada ? !compilada.ok : false}
          className="h-12 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
        />
        {!bloqueado && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Atalhos de digitação">
            {ATALHOS.map((a) => (
              <button key={a.t} type="button" className="btn num px-2" aria-label={a.desc} onClick={() => inserir(a.t)}>
                {a.rotulo}
              </button>
            ))}
          </div>
        )}
        <p id="formula-dica" role="status" className="min-h-6 text-sm" style={{ color: compilada && !compilada.ok ? 'var(--erro)' : 'var(--ink-muted)' }}>
          {compilada && !compilada.ok ? compilada.erro : 'Aceita ^, multiplicação sem sinal (2x), sqrt e log(x, base). "log" sem base é base 10.'}
        </p>
      </div>
    </div>
  )
}
