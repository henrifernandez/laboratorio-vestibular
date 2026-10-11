import { CheckCircle2, XCircle } from 'lucide-react'
import type { EntradaProps } from '@/desafios/PainelDesafio'
import { GraficoFuncao } from './GraficoFuncao'
import type { InstanciaDetetive, RespostaDetetive } from './detetive'

export function EntradaDetetive({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaDetetive, RespostaDetetive>) {
  const acertou = (correcao?.destaque as { acertou?: Record<string, boolean> } | undefined)?.acertou
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <GraficoFuncao funcao={inst.alvo} janela={inst.janela} rotulo="Gráfico misterioso: descubra o tipo de função e os sinais dos coeficientes" />
      <div className="grid content-start gap-3">
        {inst.perguntas.map((p) => (
          <fieldset key={p.id} className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-3">
            <legend className="flex items-center gap-2 px-1 font-semibold">
              {p.enunciado}
              {acertou &&
                (acertou[p.id] ? (
                  <CheckCircle2 size={18} aria-label="certo" style={{ color: 'var(--ok)' }} />
                ) : (
                  <XCircle size={18} aria-label="errado" style={{ color: 'var(--erro)' }} />
                ))}
            </legend>
            <div className="flex flex-wrap gap-2">
              {p.opcoes.map((o) => (
                <label
                  key={o.valor}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3"
                  style={{
                    borderColor: resposta[p.id] === o.valor ? 'var(--accent)' : 'var(--line-strong)',
                    background: resposta[p.id] === o.valor ? 'var(--surface-2)' : 'var(--surface)',
                  }}
                >
                  <input
                    type="radio"
                    name={`det-${p.id}`}
                    value={o.valor}
                    checked={resposta[p.id] === o.valor}
                    disabled={bloqueado}
                    onChange={() => onChange({ ...resposta, [p.id]: o.valor })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {o.rotulo}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  )
}
