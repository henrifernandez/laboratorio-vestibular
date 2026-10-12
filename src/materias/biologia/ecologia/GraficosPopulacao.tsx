import { PARAMETROS_LV, logistico, trajetoriaLV } from './calculo'
import { RELACOES } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/** Crescimento exponencial (J) e logístico (S) a partir do mesmo tamanho inicial. */
export function GraficoCrescimento({ k = 1000, r = 0.12 }: { k?: number; r?: number }) {
  const W = 340
  const H = 200
  const n0 = k / 25
  const tmax = Math.log(((k - n0) / n0) * 60) / r
  const X = (t: number) => 44 + (t / tmax) * 276
  const Y = (v: number) => 164 - (Math.min(v, k * 1.15) / (k * 1.15)) * 144
  const passos = 140
  const logis = Array.from({ length: passos + 1 }, (_, i) => {
    const t = (i / passos) * tmax
    return `${X(t)},${Y(logistico(n0, r, k, t))}`
  }).join(' ')
  const expo: string[] = []
  for (let i = 0; i <= passos; i++) {
    const t = (i / passos) * tmax
    const v = n0 * Math.exp(r * t)
    expo.push(`${X(t)},${Y(v)}`)
    if (v > k * 1.15) break
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Duas curvas de crescimento populacional: a exponencial, em J, cresce sem parar; a logística, em S, se aproxima da capacidade de suporte K" className="mx-auto block w-full max-w-lg">
      <line x1={44} x2={44} y1={14} y2={164} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={324} y1={164} y2={164} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={324} y1={Y(k)} y2={Y(k)} stroke="var(--ink-muted)" strokeDasharray="5 4" strokeWidth={1.3} />
      <text x={48} y={Y(k) - 5} fontSize={11} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        capacidade de suporte (K)
      </text>
      <polyline points={expo.join(' ')} fill="none" stroke="var(--erro)" strokeWidth={3} strokeDasharray="7 4" strokeLinejoin="round" />
      <polyline points={logis} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      <text x={X(tmax * 0.72)} y={Y(k * 1.1) + 14} fontSize={11} fontWeight={700} fill="var(--erro)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        exponencial (J)
      </text>
      <text x={X(tmax * 0.62)} y={Y(k * 0.55)} fontSize={11} fontWeight={700} fill="var(--accent)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        logístico (S)
      </text>
      <text x={324} y={188} textAnchor="end" fontSize={11} fill="var(--ink-muted)">
        tempo
      </text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">
        tamanho da população
      </text>
    </svg>
  )
}

/** Presas e predadores ao longo do tempo (modelo de Lotka-Volterra com os parâmetros-padrão). */
export function GraficoSeriesLV() {
  const W = 340
  const H = 200
  const T = 30
  const tr = trajetoriaLV(40, 10, PARAMETROS_LV, T)
  const maxY = Math.max(...tr.map((p) => Math.max(p.presas, p.predadores)))
  const X = (t: number) => 44 + (t / T) * 276
  const Y = (v: number) => 164 - (v / (maxY * 1.08)) * 144
  const linha = (pega: (p: (typeof tr)[number]) => number) => tr.filter((_, i) => i % 2 === 0).map((p) => `${X(p.t)},${Y(pega(p))}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Populações de presas e de predadores oscilando ao longo do tempo: o pico dos predadores vem depois do pico das presas" className="mx-auto block w-full max-w-lg">
      <line x1={44} x2={44} y1={14} y2={164} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={324} y1={164} y2={164} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <polyline points={linha((p) => p.presas)} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      <polyline points={linha((p) => p.predadores)} fill="none" stroke="var(--erro)" strokeWidth={3} strokeDasharray="7 4" strokeLinejoin="round" />
      <text x={50} y={26} fontSize={11} fontWeight={700} fill="var(--accent)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        presas (linha contínua)
      </text>
      <text x={50} y={42} fontSize={11} fontWeight={700} fill="var(--erro)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        predadores (tracejado)
      </text>
      <text x={324} y={188} textAnchor="end" fontSize={11} fill="var(--ink-muted)">
        tempo
      </text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">
        indivíduos
      </text>
    </svg>
  )
}

/** Quadro das relações ecológicas com os sinais de cada lado (+ ganha, − perde, 0 não é afetado). */
export function TabelaRelacoes() {
  const inter = RELACOES.filter((r) => r.grupo === 'interespecifica')
  const intra = RELACOES.filter((r) => r.grupo === 'intraespecifica')
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="pb-2 text-left font-semibold">Relações ecológicas (A / B: + ganha, − perde, 0 não é afetado)</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th scope="col" className="py-1 pr-2">Relação</th>
            <th scope="col" className="num py-1 pr-2">A / B</th>
            <th scope="col" className="py-1">Em uma frase</th>
          </tr>
        </thead>
        <tbody>
          {inter.map((r) => (
            <tr key={r.id} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1.5 pr-2 font-semibold">{r.nome}</th>
              <td className="num py-1.5 pr-2">{r.sinais}</td>
              <td className="py-1.5">{r.definicao}</td>
            </tr>
          ))}
        </tbody>
        <tbody>
          <tr>
            <th scope="colgroup" colSpan={3} className="pt-3 pb-1 text-[var(--ink-muted)]">Entre indivíduos da mesma espécie</th>
          </tr>
          {intra.map((r) => (
            <tr key={r.id} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1.5 pr-2 font-semibold">{r.nome}</th>
              <td className="py-1.5 pr-2" aria-hidden="true">·</td>
              <td className="py-1.5">{r.definicao}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m-0 pt-2 text-xs text-[var(--ink-muted)]">Para a prova, leia o enunciado: ele costuma dizer quem se beneficia, quem é prejudicado e se as espécies conseguem viver separadas. {f(RELACOES.length, 0)} relações no quadro.</p>
    </div>
  )
}
