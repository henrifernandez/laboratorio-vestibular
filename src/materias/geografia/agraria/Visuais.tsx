import type { SistemaAgricola } from '@/conteudo/geografia/agraria'
import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { decompor, type PontoLorenz } from './calculo'

const f1 = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
/** Gini sempre com duas casas (0,00). */
export const g2 = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ------------------------------------------------------------------ curva de Lorenz */

interface PropsLorenz {
  pontos: PontoLorenz[]
  /** índice de Gini a mostrar no gráfico */
  gini: number
  /** pontos a rotular com os valores acumulados (os vértices da tabela) */
  marcar?: boolean
  titulo?: string
}

/** Curva de Lorenz da terra: estabelecimentos acumulados (do menor ao maior) contra a área acumulada, com a diagonal da igualdade. */
export function LorenzSvg({ pontos, gini, marcar = false, titulo = 'da distribuição da terra' }: PropsLorenz) {
  const W = 640
  const H = 400
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const x0 = 70
  const y0 = 24
  const lado = 300
  const x = (p: number) => x0 + p * lado
  const y = (l: number) => y0 + (1 - l) * lado
  const curva = pontos.map((q) => `${x(q.p).toFixed(1)},${y(q.l).toFixed(1)}`).join(' ')
  const area = `${x(0)},${y(0)} ${x(1)},${y(1)} ${[...pontos].reverse().map((q) => `${x(q.p).toFixed(1)},${y(q.l).toFixed(1)}`).join(' ')}`
  const vertices = pontos.slice(1, -1)
  const aria = `Curva de Lorenz ${titulo}. A diagonal representa a igualdade total; a curva se afasta dela e o índice de Gini é ${g2(gini)}.${vertices.length ? ` Pontos da curva: ${vertices.map((q) => `${f1(q.p * 100, 0)}% dos estabelecimentos com ${f1(q.l * 100, 0)}% da área`).join('; ')}.` : ''}`
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {[0, 0.25, 0.5, 0.75, 1].map((v) => (
        <g key={v}>
          <line x1={x(0)} x2={x(1)} y1={y(v)} y2={y(v)} stroke="var(--grade)" strokeWidth={1} />
          <line x1={x(v)} x2={x(v)} y1={y(0)} y2={y(1)} stroke="var(--grade)" strokeWidth={1} />
          <text x={x0 - 8} y={y(v) + 4} textAnchor="end" fontSize={fs(12)} fill="var(--ink-muted)">{f1(v * 100, 0)}%</text>
          <text x={x(v)} y={y(0) + 18} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">{f1(v * 100, 0)}%</text>
        </g>
      ))}
      <polygon points={area} fill="var(--geo-quente)" fillOpacity={0.25} />
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--ink-muted)" strokeWidth={2} strokeDasharray="7 5" />
      <polyline points={curva} fill="none" stroke="var(--geo-quente)" strokeWidth={3.5} strokeLinejoin="round" />
      {marcar && vertices.map((q) => <circle key={q.p} cx={x(q.p)} cy={y(q.l)} r={5} fill="var(--surface)" stroke="var(--geo-quente)" strokeWidth={2.5} />)}
      <text x={x(0.52)} y={y(0.6)} fontSize={fs(13)} fill="var(--ink-muted)" transform={`rotate(-45 ${x(0.52)} ${y(0.6)})`} textAnchor="middle">igualdade total</text>
      <text x={x(0.78)} y={y(0.18)} fontSize={fs(13)} fontWeight={600} fill="var(--ink)" textAnchor="middle">curva de Lorenz</text>
      <text x={x(1) + 14} y={y(0.5) - 6} fontSize={fs(13)} fill="var(--ink)">Gini</text>
      <text x={x(1) + 14} y={y(0.5) + 14} fontSize={fs(18)} fontWeight={700} fill="var(--ink)" className="num">{g2(gini)}</text>
      <text x={(x(0) + x(1)) / 2} y={y(0) + 40} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">estabelecimentos acumulados (dos menores para os maiores)</text>
      <text x={x0} y={H - 6} fontSize={fs(12)} fill="var(--ink-muted)">Eixo vertical: área acumulada. Área sombreada: entre a diagonal e a curva.</text>
    </svg>
  )
}

/** Tabela das faixas, com os valores acumulados que dão os pontos da curva. */
export function TabelaFaixas({ faixas }: { faixas: { estabelecimentos: number; area: number }[] }) {
  const acumulado = faixas.map((_, i) => ({
    estabelecimentos: faixas.slice(0, i + 1).reduce((t, x) => t + x.estabelecimentos, 0),
    area: faixas.slice(0, i + 1).reduce((t, x) => t + x.area, 0),
  }))
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="num w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Faixas de estabelecimentos (dos menores para os maiores)</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Faixa</th>
            <th scope="col" className="px-1">Estabelecimentos</th>
            <th scope="col" className="px-1">Área</th>
            <th scope="col" className="px-1">Estab. acumulados</th>
            <th scope="col" className="px-1">Área acumulada</th>
          </tr>
        </thead>
        <tbody>
          {faixas.map((fx, i) => (
            <tr key={i} className="border-b border-[var(--line)]">
              <th scope="row" className="py-1 pr-2 text-left font-normal">{i + 1}</th>
              <td className="px-1">{f1(fx.estabelecimentos, 1)}%</td>
              <td className="px-1">{f1(fx.area, 1)}%</td>
              <td className="px-1">{f1((acumulado[i] as { estabelecimentos: number }).estabelecimentos, 1)}%</td>
              <td className="px-1">{f1((acumulado[i] as { area: number }).area, 1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ produção = área × produtividade */

interface PropsProducao {
  area0: number
  prod0: number
  area1: number
  prod1: number
}

/** Três barras do mesmo ponto de partida (100%): quanto cresceram a área, a produtividade e a produção. */
export function BarrasProducao({ area0, prod0, area1, prod1 }: PropsProducao) {
  const W = 640
  const H = 260
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const d = decompor(area0, prod0, area1, prod1)
  const itens = [
    { rotulo: 'Área', fator: d.fatorArea, cor: 'var(--geo-frio)' },
    { rotulo: 'Produtividade', fator: d.fatorProdutividade, cor: 'var(--geo-verde)' },
    { rotulo: 'Produção', fator: d.fatorProducao, cor: 'var(--geo-quente)' },
  ]
  const max = Math.max(1.5, ...itens.map((i) => i.fator)) * 1.1
  const x0 = 130
  const x1 = 610
  const x = (v: number) => x0 + (v / max) * (x1 - x0)
  const aria = `Variação em relação ao início, que vale 100%. Área: ${f1(d.fatorArea * 100, 0)}%. Produtividade: ${f1(d.fatorProdutividade * 100, 0)}%. Produção: ${f1(d.fatorProducao * 100, 0)}%, que é a área multiplicada pela produtividade.`
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <line x1={x(1)} x2={x(1)} y1={14} y2={H - 44} stroke="var(--ink-muted)" strokeWidth={2} strokeDasharray="6 4" />
      <text x={x(1)} y={H - 26} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">ponto de partida: 100%</text>
      {itens.map((it, i) => {
        const y = 24 + i * 62
        return (
          <g key={it.rotulo}>
            <text x={x0 - 10} y={y + 24} textAnchor="end" fontSize={fs(14)} fontWeight={600} fill="var(--ink)">{it.rotulo}</text>
            <rect x={x0} y={y} width={x(it.fator) - x0} height={36} rx={4} fill={it.cor} fillOpacity={0.85} />
            <text x={Math.min(x(it.fator) + 8, x1 - 4)} y={y + 24} textAnchor={x(it.fator) + 8 > x1 - 60 ? 'end' : 'start'} fontSize={fs(14)} fontWeight={700} fill={x(it.fator) + 8 > x1 - 60 ? 'var(--surface)' : 'var(--ink)'} className="num">
              {f1(it.fator * 100, 0)}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ sistemas agrícolas */

const CRITERIOS: { chave: keyof SistemaAgricola; rotulo: string }[] = [
  { chave: 'escala', rotulo: 'Escala' },
  { chave: 'trabalho', rotulo: 'Trabalho' },
  { chave: 'tecnologia', rotulo: 'Tecnologia' },
  { chave: 'destino', rotulo: 'Destino da produção' },
  { chave: 'exemplo', rotulo: 'Exemplo' },
  { chave: 'impacto', rotulo: 'Impactos' },
]

export function CartaoSistema({ sistema }: { sistema: SistemaAgricola }) {
  return (
    <article className="cartao grid gap-2 p-3" aria-label={sistema.nome}>
      <h3 className="m-0 text-lg">{sistema.nome}</h3>
      <p className="m-0">{sistema.resumo}</p>
      <dl className="m-0 grid gap-1.5 text-sm">
        {CRITERIOS.map((c) => (
          <div key={c.chave} className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-2">
            <dt className="font-semibold text-[var(--ink-muted)]">{c.rotulo}</dt>
            <dd className="m-0">{sistema[c.chave]}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

/** Tabela comparativa: uma linha por sistema, com os critérios em colunas. */
export function TabelaSistemas({ sistemas, destaque }: { sistemas: SistemaAgricola[]; destaque?: string }) {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Sistemas agrícolas comparados</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th scope="col" className="py-1 pr-2">Sistema</th>
            <th scope="col" className="px-1">Escala</th>
            <th scope="col" className="px-1">Trabalho</th>
            <th scope="col" className="px-1">Tecnologia</th>
            <th scope="col" className="px-1">Destino</th>
          </tr>
        </thead>
        <tbody>
          {sistemas.map((s) => (
            <tr key={s.id} className="border-b border-[var(--line)] align-top" style={s.id === destaque ? { background: 'var(--surface-2)' } : undefined}>
              <th scope="row" className="py-1 pr-2 font-semibold">{s.nome}</th>
              <td className="px-1">{s.escala}</td>
              <td className="px-1">{s.trabalho}</td>
              <td className="px-1">{s.tecnologia}</td>
              <td className="px-1">{s.destino}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
