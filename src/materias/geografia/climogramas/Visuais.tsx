import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { MESES, MESES_CURTOS, amplitude, escalas, mediaAnual, mesesSecos, totalAnual, type DadosClima } from './calculo'

const f = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

const lista = (v: number[]) => v.map((x) => f(x)).join('; ')

/** Texto equivalente do gráfico, com todos os valores. */
export function descreverClimograma(d: DadosClima, nome?: string): string {
  return `Climograma${nome ? ` de ${nome}` : ''}. Temperatura média de janeiro a dezembro, em °C: ${lista(d.temp)}. Precipitação de janeiro a dezembro, em mm: ${lista(d.chuva)}.`
}

interface Props {
  dados: DadosClima
  nome?: string
  /** mês (0 a 11) em destaque */
  mesSel?: number | null
  /** meses secos (critério de Gaussen) com contorno */
  marcarSecos?: boolean
}

/** Climograma: barras de precipitação (eixo da direita) e linha de temperatura (eixo da esquerda). */
export function Climograma({ dados, nome, mesSel = null, marcarSecos = false }: Props) {
  const W = 640
  const H = 340
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const x0 = 62
  const x1 = 570
  const y0 = 24
  const y1 = 290
  const { tlo, thi, pmax, passoP } = escalas(dados)
  const faixa = (x1 - x0) / 12
  const yT = (t: number) => y1 - ((t - tlo) / (thi - tlo)) * (y1 - y0)
  const yP = (p: number) => y1 - (p / pmax) * (y1 - y0)
  const passoT = thi - tlo > 40 ? 10 : 5
  const ticksT: number[] = []
  for (let t = tlo; t <= thi + 1e-9; t += passoT) ticksT.push(t)
  const ticksP: number[] = []
  for (let p = 0; p <= pmax + 1e-9; p += pmax / 5) ticksP.push(Math.round(p / (passoP / 10)) * (passoP / 10))
  const secos = marcarSecos ? mesesSecos(dados) : []
  const pontos = dados.temp.map((t, i) => `${x0 + faixa * (i + 0.5)},${yT(t)}`).join(' ')
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descreverClimograma(dados, nome)} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {mesSel !== null && <rect x={x0 + faixa * mesSel} y={y0} width={faixa} height={y1 - y0} fill="var(--surface-2)" />}
      {ticksT.map((t) => (
        <g key={`t${t}`}>
          <line x1={x0} x2={x1} y1={yT(t)} y2={yT(t)} stroke="var(--grade)" strokeWidth={t === 0 && tlo < 0 ? 2 : 1} strokeDasharray={t === 0 && tlo < 0 ? '5 4' : undefined} />
          <text x={x0 - 8} y={yT(t) + 4} textAnchor="end" fontSize={fs(13)} fill="var(--geo-quente)" fontWeight={600}>
            {t}
          </text>
        </g>
      ))}
      {ticksP.map((p) => (
        <text key={`p${p}`} x={x1 + 8} y={yP(p) + 4} fontSize={fs(13)} fill="var(--geo-frio)" fontWeight={600}>
          {p}
        </text>
      ))}
      {dados.chuva.map((p, i) => (
        <rect key={i} x={x0 + faixa * i + faixa * 0.18} y={yP(p)} width={faixa * 0.64} height={Math.max(0, y1 - yP(p))} fill="var(--geo-frio)" fillOpacity={0.85} stroke={secos.includes(i) ? 'var(--erro)' : 'none'} strokeWidth={2.5} />
      ))}
      <polyline points={pontos} fill="none" stroke="var(--geo-quente)" strokeWidth={3.2} strokeLinejoin="round" />
      {dados.temp.map((t, i) => (
        <circle key={i} cx={x0 + faixa * (i + 0.5)} cy={yT(t)} r={mesSel === i ? 6 : 4} fill="var(--geo-quente)" stroke="var(--surface)" strokeWidth={1.5} />
      ))}
      {MESES_CURTOS.map((m, i) => (
        <text key={m} x={x0 + faixa * (i + 0.5)} y={y1 + 6 + fs(13)} textAnchor="middle" fontSize={fs(13)} fill="var(--ink)" fontWeight={mesSel === i ? 700 : 400}>
          {m}
        </text>
      ))}
      <text x={22} y={(y0 + y1) / 2} textAnchor="middle" fontSize={fs(13)} fill="var(--geo-quente)" fontWeight={700} transform={`rotate(-90 22 ${(y0 + y1) / 2})`}>
        temperatura (°C)
      </text>
      <text x={W - 22} y={(y0 + y1) / 2} textAnchor="middle" fontSize={fs(13)} fill="var(--geo-frio)" fontWeight={700} transform={`rotate(90 ${W - 22} ${(y0 + y1) / 2})`}>
        precipitação (mm)
      </text>
      <text x={x0} y={fs(13)} fontSize={fs(13)} fill="var(--ink-muted)">
        {nome ?? ''}
      </text>
    </svg>
  )
}

/** Versão pequena, para alternativas de pergunta. Sem eixos, só a forma. */
export function MiniClimograma({ dados, rotulo }: { dados: DadosClima; rotulo: string }) {
  const W = 220
  const H = 110
  const { tlo, thi, pmax } = escalas(dados)
  const x0 = 6
  const x1 = W - 6
  const y0 = 6
  const y1 = H - 6
  const faixa = (x1 - x0) / 12
  const yT = (t: number) => y1 - ((t - tlo) / (thi - tlo)) * (y1 - y0)
  const yP = (p: number) => y1 - (p / pmax) * (y1 - y0)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={rotulo} className="block h-auto w-full max-w-[14rem] rounded-md border border-[var(--line)] bg-[var(--surface)]">
      {tlo < 0 && <line x1={x0} x2={x1} y1={yT(0)} y2={yT(0)} stroke="var(--grade)" strokeDasharray="4 3" />}
      {dados.chuva.map((p, i) => (
        <rect key={i} x={x0 + faixa * i + 1.5} y={yP(p)} width={faixa - 3} height={Math.max(0, y1 - yP(p))} fill="var(--geo-frio)" fillOpacity={0.85} />
      ))}
      <polyline points={dados.temp.map((t, i) => `${x0 + faixa * (i + 0.5)},${yT(t)}`).join(' ')} fill="none" stroke="var(--geo-quente)" strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  )
}

/** Descrição curta de um climograma (temperaturas extremas, total de chuva e meses secos), sem dizer qual é a cidade. */
export function resumoCurto(d: DadosClima): string {
  const t = d.temp
  return `temperatura de ${f(Math.min(...t), 0)} a ${f(Math.max(...t), 0)} °C, chuva total de ${f(totalAnual(d), 0)} mm e ${mesesSecos(d).length} meses secos`
}

/** Tabela com os valores mês a mês, para quem não enxerga o gráfico ou quer conferir os números. */
export function TabelaMeses({ dados, destacarSecos = false }: { dados: DadosClima; destacarSecos?: boolean }) {
  const secos = destacarSecos ? mesesSecos(dados) : []
  return (
    <details className="cartao p-3">
      <summary className="cursor-pointer font-semibold">Ver os valores mês a mês</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="num w-full border-collapse text-sm">
          <caption className="sr-only">Temperatura média e precipitação média em cada mês</caption>
          <thead>
            <tr className="border-b border-[var(--line-strong)] text-left">
              <th scope="col" className="py-1 pr-2">Mês</th>
              <th scope="col" className="px-1">Temperatura (°C)</th>
              <th scope="col" className="px-1">Chuva (mm)</th>
              {destacarSecos && <th scope="col" className="px-1">Seco?</th>}
            </tr>
          </thead>
          <tbody>
            {MESES.map((m, i) => (
              <tr key={m} className="border-b border-[var(--line)]">
                <th scope="row" className="py-1 pr-2 text-left font-normal">{m}</th>
                <td className="px-1">{f(dados.temp[i] as number)}</td>
                <td className="px-1">{f(dados.chuva[i] as number, 0)}</td>
                {destacarSecos && <td className="px-1">{secos.includes(i) ? 'sim' : 'não'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/** Números-resumo do climograma. */
export function Indicadores({ dados }: { dados: DadosClima }) {
  const secos = mesesSecos(dados)
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-[var(--ink-muted)]">Temperatura média</dt>
        <dd className="num m-0 font-semibold">{f(mediaAnual(dados))} °C</dd>
      </div>
      <div>
        <dt className="text-[var(--ink-muted)]">Amplitude térmica</dt>
        <dd className="num m-0 font-semibold">{f(amplitude(dados))} °C</dd>
      </div>
      <div>
        <dt className="text-[var(--ink-muted)]">Chuva por ano</dt>
        <dd className="num m-0 font-semibold">{f(totalAnual(dados), 0)} mm</dd>
      </div>
      <div>
        <dt className="text-[var(--ink-muted)]">Meses secos</dt>
        <dd className="num m-0 font-semibold">{secos.length}</dd>
      </div>
    </dl>
  )
}
