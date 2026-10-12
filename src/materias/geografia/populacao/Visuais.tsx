import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { FAIXAS, GRUPO_DA_FAIXA, N_FAIXAS, NOME_GRUPO, faseDasTaxas, grupos, indiceEnvelhecimento, razaoDependencia, razaoIdosos, razaoJovens, taxasNoTempo, type Grupos, type NomeGrupo, type Piramide } from './calculo'

const f = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

const COR_GRUPO: Record<NomeGrupo, string> = { jovens: 'var(--geo-frio)', adultos: 'var(--geo-verde)', idosos: 'var(--geo-quente)' }
const GRUPOS_ORDEM: NomeGrupo[] = ['jovens', 'adultos', 'idosos']

/** Texto equivalente da pirâmide, com todos os valores. */
export function descreverPiramide(p: Piramide, titulo?: string): string {
  const g = grupos(p)
  const linhas = FAIXAS.map((fx, i) => `${fx} anos: homens ${f(p.homens[i] as number)}%, mulheres ${f(p.mulheres[i] as number)}%`).join('; ')
  return `Pirâmide etária${titulo ? ` ${titulo}` : ''}, em percentual do total da população. Jovens de 0 a 14 anos: ${f(g.jovens)}%. Adultos de 15 a 64 anos: ${f(g.adultos)}%. Idosos de 65 anos ou mais: ${f(g.idosos)}%. ${linhas}.`
}

/** Descrição curta, sem dizer a fase, para as alternativas. */
export function resumoPiramide(p: Piramide): string {
  const g = grupos(p)
  return `${f(g.jovens, 0)}% de jovens, ${f(g.adultos, 0)}% de adultos e ${f(g.idosos, 0)}% de idosos`
}

interface Props {
  piramide: Piramide
  /** colore as barras pelos três grupos (jovens, adultos, idosos) */
  grupos?: boolean
  /** faixa (0 a 16) em destaque */
  faixaSel?: number | null
  titulo?: string
}

/** Pirâmide etária: homens à esquerda, mulheres à direita, faixas de idade no centro. */
export function PiramideSvg({ piramide, grupos: porGrupo = false, faixaSel = null, titulo }: Props) {
  const W = 640
  const topo = 38
  const alt = 21
  const H = topo + alt * N_FAIXAS + 44
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const xc = W / 2
  const meio = 42
  const lado = xc - meio - 26
  const maior = Math.max(...piramide.homens, ...piramide.mulheres)
  const passo = maior <= 5 ? 1 : maior <= 12 ? 2 : 5
  const limite = Math.max(passo, Math.ceil(maior / passo) * passo)
  const px = (v: number) => (v / limite) * lado
  const ticks: number[] = []
  for (let v = 0; v <= limite + 1e-9; v += passo) ticks.push(v)
  const yDe = (i: number) => topo + (N_FAIXAS - 1 - i) * alt
  const yFim = topo + N_FAIXAS * alt
  const cor = (i: number) => (porGrupo ? COR_GRUPO[GRUPO_DA_FAIXA[i] as NomeGrupo] : 'var(--geo-oceano)')
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descreverPiramide(piramide, titulo)} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <text x={xc - meio - lado / 2} y={22} textAnchor="middle" fontSize={fs(14)} fontWeight={600} fill="var(--ink)">Homens</text>
      <text x={xc + meio + lado / 2} y={22} textAnchor="middle" fontSize={fs(14)} fontWeight={600} fill="var(--ink)">Mulheres</text>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={xc - meio - px(v)} x2={xc - meio - px(v)} y1={topo} y2={yFim} stroke="var(--grade)" strokeWidth={1} />
          <line x1={xc + meio + px(v)} x2={xc + meio + px(v)} y1={topo} y2={yFim} stroke="var(--grade)" strokeWidth={1} />
          <text x={xc - meio - px(v)} y={yFim + 16} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">{v}</text>
          {v > 0 && (
            <text x={xc + meio + px(v)} y={yFim + 16} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">{v}</text>
          )}
        </g>
      ))}
      {FAIXAS.map((fx, i) => {
        const h = piramide.homens[i] as number
        const m = piramide.mulheres[i] as number
        const sel = faixaSel === i
        const y = yDe(i)
        return (
          <g key={fx}>
            <rect x={xc - meio - px(h)} y={y + 2} width={px(h)} height={alt - 4} fill={cor(i)} fillOpacity={0.9} stroke={sel ? 'var(--ink)' : 'none'} strokeWidth={sel ? 2.5 : 0} />
            <rect x={xc + meio} y={y + 2} width={px(m)} height={alt - 4} fill={cor(i)} fillOpacity={0.9} stroke={sel ? 'var(--ink)' : 'none'} strokeWidth={sel ? 2.5 : 0} />
            <text x={xc} y={y + alt / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={fs(12)} fontWeight={sel ? 700 : 500} fill="var(--ink)">{fx}</text>
          </g>
        )
      })}
      <text x={xc} y={H - 6} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">% do total da população</text>
    </svg>
  )
}

/** Pirâmide pequena e sem texto, para as alternativas. Escala fixa (0 a 12%), para comparar os desenhos entre si. */
export function MiniPiramide({ piramide, rotulo }: { piramide: Piramide; rotulo: string }) {
  const alt = 6
  const W = 130
  const H = alt * N_FAIXAS + 6
  const xc = W / 2
  const lado = 58
  const px = (v: number) => (Math.min(v, 12) / 12) * lado
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={rotulo} className="block h-auto w-full max-w-[9rem] rounded-md border border-[var(--line)] bg-[var(--surface)]">
      {FAIXAS.map((fx, i) => {
        const y = H - 3 - (i + 1) * alt
        return (
          <g key={fx}>
            <rect x={xc - 3 - px(piramide.homens[i] as number)} y={y + 0.5} width={px(piramide.homens[i] as number)} height={alt - 1} fill="var(--geo-oceano)" />
            <rect x={xc + 3} y={y + 0.5} width={px(piramide.mulheres[i] as number)} height={alt - 1} fill="var(--geo-oceano)" />
          </g>
        )
      })}
    </svg>
  )
}

/** Legenda dos três grupos, com o percentual de cada um. */
export function LegendaGrupos({ g }: { g: Grupos }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm">
      {GRUPOS_ORDEM.map((k) => (
        <li key={k} className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_GRUPO[k] }} />
          <span>
            {NOME_GRUPO[k]}: <strong className="num">{f(g[k])}%</strong>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Valores faixa a faixa, para quem não enxerga o gráfico ou quer conferir os números. */
export function TabelaFaixas({ piramide }: { piramide: Piramide }) {
  return (
    <details className="cartao p-3">
      <summary className="cursor-pointer font-semibold">Ver os valores faixa a faixa</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="num w-full border-collapse text-sm">
          <caption className="sr-only">Percentual do total da população em cada faixa de idade, por sexo</caption>
          <thead>
            <tr className="border-b border-[var(--line-strong)] text-left">
              <th scope="col" className="py-1 pr-2">Faixa (anos)</th>
              <th scope="col" className="px-1">Homens (%)</th>
              <th scope="col" className="px-1">Mulheres (%)</th>
              <th scope="col" className="px-1">Grupo</th>
            </tr>
          </thead>
          <tbody>
            {FAIXAS.map((fx, i) => (
              <tr key={fx} className="border-b border-[var(--line)]">
                <th scope="row" className="py-1 pr-2 text-left font-normal">{fx}</th>
                <td className="px-1">{f(piramide.homens[i] as number)}</td>
                <td className="px-1">{f(piramide.mulheres[i] as number)}</td>
                <td className="px-1">{GRUPO_DA_FAIXA[i] === 'jovens' ? 'jovens' : GRUPO_DA_FAIXA[i] === 'adultos' ? 'adultos' : 'idosos'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/** Números-resumo da pirâmide. */
export function Indicadores({ g }: { g: Grupos }) {
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-[var(--ink-muted)]">Razão de dependência</dt>
        <dd className="num m-0 font-semibold">{f(razaoDependencia(g))}</dd>
      </div>
      <div>
        <dt className="text-[var(--ink-muted)]">Razão de jovens</dt>
        <dd className="num m-0 font-semibold">{f(razaoJovens(g))}</dd>
      </div>
      <div>
        <dt className="text-[var(--ink-muted)]">Razão de idosos</dt>
        <dd className="num m-0 font-semibold">{f(razaoIdosos(g))}</dd>
      </div>
      <div>
        <dt className="text-[var(--ink-muted)]">Índice de envelhecimento</dt>
        <dd className="num m-0 font-semibold">{f(indiceEnvelhecimento(g))}</dd>
      </div>
    </dl>
  )
}

/* ------------------------------------------------------------------ transição demográfica */

const PONTOS = 120

/** Natalidade e mortalidade no tempo, com a faixa de crescimento natural entre as curvas e as quatro fases. */
export function GraficoTransicao({ t = null }: { t?: number | null }) {
  const W = 640
  const H = 358
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const x0 = 56
  const x1 = 620
  const y0 = 34
  const y1 = 270
  const vmax = 56
  const x = (u: number) => x0 + u * (x1 - x0)
  const y = (v: number) => y1 - (v / vmax) * (y1 - y0)
  const amostras = Array.from({ length: PONTOS + 1 }, (_, k) => {
    const u = k / PONTOS
    const tx = taxasNoTempo(u)
    return { u, ...tx, fase: faseDasTaxas(tx.natalidade, tx.mortalidade) }
  })
  const pol = (sel: 'natalidade' | 'mortalidade') => amostras.map((a) => `${x(a.u).toFixed(1)},${y(a[sel]).toFixed(1)}`).join(' ')
  const faixa = `${amostras.map((a) => `${x(a.u).toFixed(1)},${y(a.natalidade).toFixed(1)}`).join(' ')} ${[...amostras].reverse().map((a) => `${x(a.u).toFixed(1)},${y(a.mortalidade).toFixed(1)}`).join(' ')}`
  const bandas: { fase: number; de: number; ate: number }[] = []
  for (const a of amostras) {
    const ultima = bandas[bandas.length - 1]
    if (ultima && ultima.fase === a.fase) ultima.ate = a.u
    else bandas.push({ fase: a.fase, de: ultima ? ultima.ate : a.u, ate: a.u })
  }
  const atual = t === null ? null : taxasNoTempo(t)
  const aria = `Gráfico da transição demográfica. A natalidade parte de cerca de ${f(amostras[0]?.natalidade ?? 0, 0)} por mil e cai até cerca de ${f(amostras[PONTOS]?.natalidade ?? 0, 0)} por mil; a mortalidade parte de cerca de ${f(amostras[0]?.mortalidade ?? 0, 0)} por mil e cai antes, até cerca de ${f(amostras[PONTOS]?.mortalidade ?? 0, 0)} por mil. Entre as duas curvas fica o crescimento natural, que é maior na fase 2.${atual ? ` No momento marcado: natalidade ${f(atual.natalidade, 0)} por mil e mortalidade ${f(atual.mortalidade, 0)} por mil.` : ''}`
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {bandas.map((b, i) => (
        <g key={i}>
          <rect x={x(b.de)} y={y0} width={x(b.ate) - x(b.de)} height={y1 - y0} fill="var(--ink)" fillOpacity={i % 2 === 0 ? 0.05 : 0.0} />
          <text x={(x(b.de) + x(b.ate)) / 2} y={y0 - 10} textAnchor="middle" fontSize={fs(13)} fontWeight={600} fill="var(--ink)">Fase {b.fase}</text>
        </g>
      ))}
      {[0, 10, 20, 30, 40, 50].map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={y(v)} y2={y(v)} stroke="var(--grade)" strokeWidth={1} />
          <text x={x0 - 6} y={y(v) + 4} textAnchor="end" fontSize={fs(12)} fill="var(--ink-muted)">{v}</text>
        </g>
      ))}
      <polygon points={faixa} fill="var(--geo-verde)" fillOpacity={0.3} />
      <polyline points={pol('natalidade')} fill="none" stroke="var(--geo-quente)" strokeWidth={3} strokeLinejoin="round" />
      <polyline points={pol('mortalidade')} fill="none" stroke="var(--geo-frio)" strokeWidth={3} strokeDasharray="8 5" strokeLinejoin="round" />
      <text x={x(0.02)} y={y(48.5)} fontSize={fs(13)} fontWeight={600} fill="var(--ink)">Natalidade</text>
      <text x={x(0.98)} y={y(4.5)} textAnchor="end" fontSize={fs(13)} fontWeight={600} fill="var(--ink)">Mortalidade</text>
      <text x={x(0.45)} y={y(27)} textAnchor="middle" fontSize={fs(12)} fill="var(--ink)">crescimento natural</text>
      {atual && t !== null && (
        <g>
          <line x1={x(t)} x2={x(t)} y1={y0} y2={y1} stroke="var(--ink)" strokeWidth={2} />
          <circle cx={x(t)} cy={y(atual.natalidade)} r={5} fill="var(--geo-quente)" stroke="var(--ink)" strokeWidth={1.5} />
          <circle cx={x(t)} cy={y(atual.mortalidade)} r={5} fill="var(--geo-frio)" stroke="var(--ink)" strokeWidth={1.5} />
        </g>
      )}
      <text x={(x0 + x1) / 2} y={H - 46} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">Tempo (o ritmo muda de país para país)</text>
      <text x={x0} y={H - 10} fontSize={fs(12)} fill="var(--ink-muted)">Taxas por mil habitantes, por ano</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ razão de dependência no tempo */

export interface PontoRazao {
  rotulo: string
  rd: number
}

/** Razão de dependência por período, com o mínimo em destaque. */
export function GraficoRazao({ pontos, destaque = null, marcarMinimo = false }: { pontos: PontoRazao[]; destaque?: number | null; marcarMinimo?: boolean }) {
  const W = 640
  const H = 300
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const x0 = 56
  const x1 = 610
  const y0 = 26
  const y1 = 236
  const valores = pontos.map((p) => p.rd)
  const lo = Math.max(0, Math.floor((Math.min(...valores) - 10) / 10) * 10)
  const hi = Math.ceil((Math.max(...valores) + 5) / 10) * 10
  const x = (i: number) => (pontos.length === 1 ? (x0 + x1) / 2 : x0 + 20 + (i / (pontos.length - 1)) * (x1 - x0 - 40))
  const y = (v: number) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0)
  const min = Math.min(...valores)
  const iMin = valores.indexOf(min)
  const ticks: number[] = []
  for (let v = lo; v <= hi; v += 10) ticks.push(v)
  const aria = `Razão de dependência por período: ${pontos.map((p) => `${p.rotulo}, ${f(p.rd, 0)}`).join('; ')}.${marcarMinimo ? ` O menor valor é ${f(min, 0)}, em ${pontos[iMin]?.rotulo}.` : ''}`
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={y(v)} y2={y(v)} stroke="var(--grade)" strokeWidth={1} />
          <text x={x0 - 6} y={y(v) + 4} textAnchor="end" fontSize={fs(12)} fill="var(--ink-muted)">{v}</text>
        </g>
      ))}
      <polyline points={pontos.map((p, i) => `${x(i).toFixed(1)},${y(p.rd).toFixed(1)}`).join(' ')} fill="none" stroke="var(--geo-quente)" strokeWidth={3} strokeLinejoin="round" />
      {pontos.map((p, i) => (
        <g key={p.rotulo}>
          <circle cx={x(i)} cy={y(p.rd)} r={destaque === i ? 7 : 4.5} fill="var(--geo-quente)" stroke="var(--ink)" strokeWidth={destaque === i ? 2.5 : 1} />
          <text x={x(i)} y={y(p.rd) - 11} textAnchor="middle" fontSize={fs(12)} fill="var(--ink)">{f(p.rd, 0)}</text>
          <text x={x(i)} y={y1 + 18} textAnchor="middle" fontSize={fs(12)} fill="var(--ink-muted)">{p.rotulo}</text>
        </g>
      ))}
      {marcarMinimo && (
        <g>
          <circle cx={x(iMin)} cy={y(min)} r={10} fill="none" stroke="var(--ink)" strokeWidth={2.5} />
          <text x={x(iMin)} y={y1 + 38} textAnchor="middle" fontSize={fs(12)} fontWeight={700} fill="var(--ink)">menor razão: auge do bônus</text>
        </g>
      )}
      <text x={x0} y={H - 6} fontSize={fs(12)} fill="var(--ink-muted)">Dependentes para cada 100 pessoas de 15 a 64 anos</text>
    </svg>
  )
}


