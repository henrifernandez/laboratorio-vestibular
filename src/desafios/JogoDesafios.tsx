import { useState } from 'react'
import { Check, Star } from 'lucide-react'
import { idProgresso, PainelDesafio, type DefinicaoQualquer } from './PainelDesafio'
import type { Nivel } from './tipos'
import { useProgresso } from './useProgresso'

/** Escolha de desafio e nível, com estrelas ligadas ao progresso salvo. Serve à aba Desafios e à tela Jogo. */
export function JogoDesafios({ desafios }: { desafios: DefinicaoQualquer[] }) {
  const progresso = useProgresso()
  const [atual, setAtual] = useState<{ indice: number; nivel: Nivel }>({ indice: 0, nivel: 1 })
  const def = desafios[atual.indice] as DefinicaoQualquer

  return (
    <div className="grid gap-4">
      <ul className="m-0 grid list-none gap-2 p-0 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" aria-label="Desafios">
        {desafios.map((d, i) => {
          const niveis = ([1, 2, 3] as Nivel[]).map((n) => progresso[idProgresso(d, n)])
          const estrelas = niveis.filter((r) => r && r.acertos > 0).length
          const ativo = i === atual.indice
          return (
            <li key={d.desafio.id}>
              <button
                type="button"
                aria-pressed={ativo}
                onClick={() => setAtual({ indice: i, nivel: atual.nivel })}
                className="cartao grid h-full w-full gap-0.5 p-2.5 text-left transition-transform sm:p-3"
                style={{
                  borderColor: ativo ? 'var(--accent)' : undefined,
                  boxShadow: ativo ? '0 0 0 2px var(--accent)' : undefined,
                }}
              >
                <span className="font-semibold">{d.desafio.titulo}</span>
                <span className="flex items-center gap-0.5" aria-label={`${estrelas} de 3 estrelas`}>
                  {[0, 1, 2].map((k) => (
                    <Star
                      key={k}
                      size={18}
                      aria-hidden="true"
                      fill={k < estrelas ? 'var(--accent)' : 'none'}
                      stroke={k < estrelas ? 'var(--accent)' : 'var(--line-strong)'}
                    />
                  ))}
                  {niveis.some((r) => r?.ultimo) && <Check size={16} aria-hidden="true" className="ml-1 text-[var(--ok)]" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <PainelDesafio key={def.desafio.id} def={def} nivelInicial={atual.nivel} />
    </div>
  )
}
