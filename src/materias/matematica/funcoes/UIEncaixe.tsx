import { CheckCircle2, XCircle } from 'lucide-react'
import { Tex } from '@/componentes/Tex'
import type { EntradaProps } from '@/desafios/PainelDesafio'
import { Mafs } from 'mafs'
import { Coordinates } from 'mafs'
import { CurvaDaFuncao } from './GraficoFuncao'
import { LETRAS_GRAFICO, type InstanciaEncaixe, type RespostaEncaixe } from './encaixe'
import { JANELAS } from './janelas'
import { formulaTex } from './modelo'

const fmt = (n: number) => String(n).replace('.', ',')

function MiniGrafico({ inst, indiceFuncao, rotulo }: { inst: InstanciaEncaixe; indiceFuncao: number; rotulo: string }) {
  const f = inst.funcoes[indiceFuncao]!
  // janela comum, folgada, para que nenhum gráfico entregue a resposta pela escala
  const j = { xmin: -5, xmax: 5, ymin: -6, ymax: 8 }
  void JANELAS
  return (
    <div role="img" aria-label={rotulo} className="overflow-hidden rounded-lg border border-[var(--line)]">
      <Mafs height={150} preserveAspectRatio={false} viewBox={{ x: [j.xmin, j.xmax], y: [j.ymin, j.ymax], padding: 0 }} pan={false} zoom={false}>
        <Coordinates.Cartesian subdivisions={false} />
        <CurvaDaFuncao funcao={f} janela={j} peso={3} />
      </Mafs>
    </div>
  )
}

export function EntradaEncaixe({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaEncaixe, RespostaEncaixe>) {
  const detalhes = (correcao?.destaque as { detalhes?: { grafico: boolean; tabela: boolean }[] } | undefined)?.detalhes
  const escolher = (campo: 'graficos' | 'tabelas', i: number, valor: number) =>
    onChange({ ...resposta, [campo]: resposta[campo].map((v, k) => (k === i ? valor : v)) })

  return (
    <div className="grid gap-5">
      <section aria-label="Gráficos" className="grid gap-2">
        <h3 className="text-lg">Gráficos</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {inst.ordemGraficos.map((fi, j) => (
            <figure key={j} className="m-0 grid gap-1">
              <MiniGrafico inst={inst} indiceFuncao={fi} rotulo={`Gráfico ${LETRAS_GRAFICO[j]}`} />
              <figcaption className="text-center font-semibold">Gráfico {LETRAS_GRAFICO[j]}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-label="Tabelas" className="grid gap-2">
        <h3 className="text-lg">Tabelas</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {inst.ordemTabelas.map((fi, m) => (
            <div key={m} className="overflow-x-auto">
              <table className="num w-full border-collapse text-center text-sm" aria-label={`Tabela ${m + 1}`}>
                <caption className="pb-1 text-left font-semibold">Tabela {m + 1}</caption>
                <thead>
                  <tr>
                    <th className="border border-[var(--line)] bg-[var(--surface-2)] p-1">x</th>
                    <th className="border border-[var(--line)] bg-[var(--surface-2)] p-1">y</th>
                  </tr>
                </thead>
                <tbody>
                  {inst.tabelas[fi]!.map((l) => (
                    <tr key={l.x}>
                      <td className="border border-[var(--line)] p-1">{fmt(l.x)}</td>
                      <td className="border border-[var(--line)] p-1">{fmt(l.y)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Ligue cada fórmula ao seu gráfico e à sua tabela" className="grid gap-3">
        <h3 className="text-lg">Ligue cada fórmula</h3>
        {inst.funcoes.map((f, i) => (
          <fieldset key={i} className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-3">
            <legend className="flex items-center gap-2 px-1 text-lg font-semibold">
              <span>
                f<sub>{i + 1}</sub>: <Tex>{formulaTex(f).replace('f(x)', `f_{${i + 1}}(x)`)}</Tex>
              </span>
              {detalhes &&
                (detalhes[i]?.grafico && detalhes[i]?.tabela ? (
                  <CheckCircle2 size={18} aria-label="trio certo" style={{ color: 'var(--ok)' }} />
                ) : (
                  <XCircle size={18} aria-label="há erro neste trio" style={{ color: 'var(--erro)' }} />
                ))}
            </legend>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div role="radiogroup" aria-label={`Gráfico de f${i + 1}`} className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-sm text-[var(--ink-muted)]">Gráfico</span>
                {LETRAS_GRAFICO.map((l, j) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={resposta.graficos[i] === j}
                    disabled={bloqueado}
                    onClick={() => escolher('graficos', i, j)}
                    className={`btn ${resposta.graficos[i] === j ? 'btn-primario' : ''}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label={`Tabela de f${i + 1}`} className="flex flex-wrap items-center gap-1">
                <span className="mr-1 text-sm text-[var(--ink-muted)]">Tabela</span>
                {[0, 1, 2, 3].map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={resposta.tabelas[i] === m}
                    disabled={bloqueado}
                    onClick={() => escolher('tabelas', i, m)}
                    className={`btn ${resposta.tabelas[i] === m ? 'btn-primario' : ''}`}
                  >
                    {m + 1}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>
        ))}
      </section>
    </div>
  )
}
