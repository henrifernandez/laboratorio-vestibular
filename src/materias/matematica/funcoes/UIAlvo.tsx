import { Star, Undo2 } from 'lucide-react'
import { Plot } from 'mafs'
import { Tex } from '@/componentes/Tex'
import type { EntradaProps } from '@/desafios/PainelDesafio'
import { Cena } from '@/sim/Cena'
import { BASES, MOVIMENTOS, aplicarMovimentos, type InstanciaAlvo, type Movimento } from './alvo'

const JANELA = { xmin: -6, xmax: 6, ymin: -6, ymax: 8 }

export function EntradaAlvo({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaAlvo, Movimento[]>) {
  const base = BASES[inst.base].fn
  const alvoFn = aplicarMovimentos(base, inst.solucao)
  const usuarioFn = aplicarMovimentos(base, resposta)
  const estrelas = (correcao?.destaque as { estrelas?: number } | undefined)?.estrelas
  const otimoDica = correcao ? inst.otimo : null

  return (
    <div className="grid gap-3">
      <p className="text-lg">
        Parta de <Tex>{`f(x) = ${BASES[inst.base].tex}`}</Tex> e leve a curva até o alvo.
      </p>
      <Cena janela={JANELA} rotulo="Plano com a curva-base, a sua curva e a curva-alvo">
        <Plot.OfX y={alvoFn} color="var(--curva-alvo)" style="dashed" weight={4} />
        <Plot.OfX y={base} color="var(--ink-muted)" weight={2} opacity={0.6} />
        <Plot.OfX y={usuarioFn} color="var(--accent)" weight={3.5} />
      </Cena>
      <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
        <span>
          <span aria-hidden="true" style={{ color: 'var(--curva-alvo)' }}>╌</span> alvo
        </span>
        <span>
          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>━</span> sua curva
        </span>
        <span>
          <span aria-hidden="true">━</span> base
        </span>
      </p>

      <div role="group" aria-label="Movimentos disponíveis" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MOVIMENTOS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="btn"
            disabled={bloqueado}
            title={m.descricao}
            onClick={() => onChange([...resposta, m.id])}
          >
            {m.rotulo}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="num font-semibold">
          Movimentos: {resposta.length}
          {otimoDica !== null && <span className="text-[var(--ink-muted)]"> (mínimo: {otimoDica})</span>}
        </span>
        {resposta.map((m, i) => (
          <span key={i} className="chip">
            {MOVIMENTOS.find((x) => x.id === m)?.rotulo}
          </span>
        ))}
        {!bloqueado && resposta.length > 0 && (
          <>
            <button type="button" className="btn" onClick={() => onChange(resposta.slice(0, -1))}>
              <Undo2 size={18} aria-hidden="true" />
              Desfazer
            </button>
            <button type="button" className="btn btn-fantasma" onClick={() => onChange([])}>
              Limpar
            </button>
          </>
        )}
        {estrelas !== undefined && (
          <span className="flex items-center gap-0.5" aria-label={`${estrelas} de 3 estrelas`}>
            {[1, 2, 3].map((k) => (
              <Star key={k} size={22} aria-hidden="true" fill={k <= estrelas ? 'var(--accent)' : 'none'} stroke={k <= estrelas ? 'var(--accent)' : 'var(--line-strong)'} />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
