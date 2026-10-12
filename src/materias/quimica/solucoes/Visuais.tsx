import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { Bequer } from '../comum/Bequer'
import { formulaTexto } from '../comum/Formula'
import { curva, solubilidade, type CurvaSol } from './calculo'
import type { BequerEtapa, DadosConc, DadosCristal, DadosDiluicao, DadosSolubilidade, Marca } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ gráfico de solubilidade */

export const COR_CURVA: Record<string, string> = { A: 'var(--accent)', B: 'var(--aviso)', C: 'var(--erro)' }

const LARG = 340
const ALT = 214
const X0 = 46
const X1 = 328
const Y0 = 26
const Y1 = 178
const TMAX = 85

const arredondaTopo = (v: number) => [20, 40, 60, 80, 100, 120, 160, 200].find((x) => x >= v * 1.05) ?? 200

/** Lado em que o rótulo cabe sem sair do desenho (≈ 6,6 px por letra a 12 px de fonte). */
function ladoRotulo(x: number, texto: string, folga = 10): 'start' | 'end' {
  return x + folga + texto.length * 6.6 > LARG - 4 ? 'end' : 'start'
}

interface PropsGrafico {
  curvas: CurvaSol[]
  /** curva em destaque; as outras ficam esmaecidas */
  destaque?: string
  marcas?: Marca[]
  /** ponto livre, por exemplo "a solução está aqui" */
  ponto?: { T: number; S: number; rotulo?: string; cor?: string }
  ymax?: number
}

/** Curvas de solubilidade (g de sal por 100 g de água × temperatura), com pontos e guias tracejadas. */
export function GraficoSolubilidade({ curvas, destaque, marcas = [], ponto, ymax }: PropsGrafico) {
  const topo = ymax ?? arredondaTopo(Math.max(...curvas.flatMap((c) => c.pontos.map((p) => p[1])), ...marcas.map((m) => m.S), ponto?.S ?? 0))
  const X = (T: number) => X0 + (T / TMAX) * (X1 - X0)
  const Y = (S: number) => Y1 - (Math.min(S, topo) / topo) * (Y1 - Y0)
  const passoY = topo / 4
  const descricao = curvas.map((c) => `${c.nome}: ${c.pontos.map(([T, S]) => `${T} °C, ${f(S)} g por 100 g de água`).join('; ')}`).join('. ')
  const guia = (T: number, S: number, cor = 'var(--ink-muted)') => (
    <g key={`g${T}-${S}`}>
      <line x1={X(T)} x2={X(T)} y1={Y(S)} y2={Y1} stroke={cor} strokeDasharray="3 3" strokeWidth={1.2} />
      <line x1={X0} x2={X(T)} y1={Y(S)} y2={Y(S)} stroke={cor} strokeDasharray="3 3" strokeWidth={1.2} />
    </g>
  )
  return (
    <div className="grid gap-1">
      <svg viewBox={`0 0 ${LARG} ${ALT}`} role="img" aria-label={`Gráfico da solubilidade em função da temperatura. ${descricao}`} className="mx-auto block w-full max-w-lg">
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line x1={X0} x2={X1} y1={Y(k * passoY)} y2={Y(k * passoY)} stroke="var(--line)" strokeWidth={1} />
            <text x={X0 - 6} y={Y(k * passoY) + 4} textAnchor="end" fontSize={11} fill="var(--ink-muted)" className="num">{f(k * passoY, 0)}</text>
          </g>
        ))}
        {[0, 20, 40, 60, 80].map((T) => (
          <g key={T}>
            <line x1={X(T)} x2={X(T)} y1={Y0} y2={Y1} stroke="var(--line)" strokeWidth={1} />
            <text x={X(T)} y={Y1 + 15} textAnchor="middle" fontSize={11} fill="var(--ink-muted)" className="num">{T}</text>
          </g>
        ))}
        <line x1={X0} x2={X0} y1={Y0} y2={Y1} stroke="var(--ink-muted)" strokeWidth={1.5} />
        <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="var(--ink-muted)" strokeWidth={1.5} />
        <text x={X1} y={Y1 + 30} textAnchor="end" fontSize={11} fill="var(--ink-muted)">temperatura (°C)</text>
        <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">g de sal por 100 g de água</text>
        {curvas.map((c) => {
          const apagada = destaque !== undefined && destaque !== c.id
          const ult = c.pontos[c.pontos.length - 1] as [number, number]
          return (
            <g key={c.id} opacity={apagada ? 0.35 : 1}>
              <polyline points={c.pontos.map(([T, S]) => `${X(T)},${Y(S)}`).join(' ')} fill="none" stroke={COR_CURVA[c.id]} strokeWidth={apagada ? 2 : 3.4} strokeLinejoin="round" strokeLinecap="round" />
              {c.pontos.map(([T, S]) => (
                <circle key={T} cx={X(T)} cy={Y(S)} r={2.4} fill={COR_CURVA[c.id]} />
              ))}
              <text x={Math.min(X(ult[0]) + 4, X1 - 28)} y={Y(ult[1]) + (c.decrescente ? 16 : -7)} fontSize={12} fontWeight={700} fill={COR_CURVA[c.id]} stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">{c.nome}</text>
            </g>
          )
        })}
        {marcas.map((m) => guia(m.T, m.S))}
        {marcas.map((m) => (
          <g key={`m${m.T}`}>
            <circle cx={X(m.T)} cy={Y(m.S)} r={5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
            <text x={X(m.T) + (ladoRotulo(X(m.T), m.rotulo, 8) === 'end' ? -8 : 8)} y={Y(m.S) + (m.S > topo * 0.55 ? 16 : -8)} textAnchor={ladoRotulo(X(m.T), m.rotulo, 8)} fontSize={12} fontWeight={600} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">{m.rotulo}</text>
          </g>
        ))}
        {ponto && (
          <g>
            {guia(ponto.T, ponto.S, ponto.cor ?? 'var(--ink-muted)')}
            <circle cx={X(ponto.T)} cy={Y(ponto.S)} r={6} fill={ponto.cor ?? 'var(--ink)'} stroke="var(--surface)" strokeWidth={2} />
            {ponto.rotulo && (
              <text x={X(ponto.T) + (ladoRotulo(X(ponto.T), ponto.rotulo) === 'end' ? -10 : 10)} y={Y(ponto.S) + (ponto.S > topo * 0.5 ? 18 : -10)} textAnchor={ladoRotulo(X(ponto.T), ponto.rotulo)} fontSize={12} fontWeight={700} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">{ponto.rotulo}</text>
            )}
          </g>
        )}
      </svg>
      <details className="text-sm text-[var(--ink-muted)]">
        <summary className="min-h-11 cursor-pointer py-2">Ver os valores da curva em tabela</summary>
        <div className="overflow-x-auto">
          <table className="num w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--line-strong)]">
                <th className="py-1 pr-2">Temperatura (°C)</th>
                {curvas.map((c) => (
                  <th key={c.id} className="py-1 pr-2">{c.nome} (g/100 g)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0, 20, 40, 60, 80].map((T) => (
                <tr key={T} className="border-b border-[var(--line)]">
                  <td className="py-1 pr-2">{T}</td>
                  {curvas.map((c) => (
                    <td key={c.id} className="py-1 pr-2">{f(solubilidade(c, T))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

/* ------------------------------------------------------------------ cadeia de béqueres */

export function CadeiaBequeres({ etapas, ligacoes }: { etapas: BequerEtapa[]; ligacoes: string[] }) {
  const conhecidos = etapas.filter((e) => e.c !== null && e.volume !== null)
  const cmax = Math.max(1e-9, ...conhecidos.map((e) => e.c as number))
  const vmax = Math.max(100, ...etapas.map((e) => e.volume ?? 0)) * 1.12
  // mols conhecidos de cada béquer, para a mesma quantidade de partículas aparecer no resultado
  const molDe = (e: BequerEtapa) => (e.c !== null && e.volume !== null ? (e.c * e.volume) / 1000 : null)
  const ultimo = etapas[etapas.length - 1] as BequerEtapa
  const somaConhecida = etapas.slice(0, -1).reduce((s, e) => s + (molDe(e) ?? 0), 0)
  const mols = etapas.map((e, i) => molDe(e) ?? (i === etapas.length - 1 ? somaConhecida : (molDe(etapas[0] as BequerEtapa) ?? 0)))
  const molMax = Math.max(1e-9, ...mols)
  return (
    <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-3" role="group" aria-label="Béqueres do problema">
      {etapas.map((e, i) => {
        const intens = e.c === null ? null : e.c / cmax
        const ligacao = i > 0 ? ligacoes[i - 1] : null
        return (
          <div key={`${e.rotulo}-${i}`} className="flex items-end gap-2">
            {ligacao && (
              <span aria-hidden="true" className="num pb-10 text-sm text-[var(--ink-muted)]">
                {ligacao}
              </span>
            )}
            <figure className="m-0 grid justify-items-center gap-0.5 text-center text-sm">
              <Bequer
                volume={e.volume}
                vmax={vmax}
                intensidade={intens}
                particulas={Math.round((mols[i] as number) / molMax * 26)}
                descricao={`Béquer ${e.rotulo}: ${e.volume === null ? 'volume desconhecido' : `${f(e.volume, 0)} mL`}, ${e.c === null ? 'concentração desconhecida' : `${f(e.c)} mol/L`}`}
                largura={84}
              />
              <figcaption>
                <strong>{e.rotulo}</strong>
                <span className="num block text-[var(--ink-muted)]">{e.volume === null ? '? mL' : `${f(e.volume, 0)} mL`}</span>
                <span className="num block text-[var(--ink-muted)]">{e.c === null ? (e.rotuloC ?? '? mol/L') : `${f(e.c)} mol/L`}</span>
              </figcaption>
            </figure>
          </div>
        )
      })}
      <span className="sr-only">{ultimo.c === null || ultimo.volume === null ? 'O valor que falta é a pergunta.' : ''}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualConc({ inst }: { inst: InstanciaNum<DadosConc> }) {
  const d = inst.dados as DadosConc
  if (d.variante === 'titulo') {
    return (
      <div className="cartao mx-auto grid w-full max-w-xs gap-1 p-3 text-center" aria-label="Rótulo do frasco">
        <strong className="text-lg">{formulaTexto(d.substancia as string)}</strong>
        <span className="num">título: {f(d.titulo as number)} % (m/m)</span>
        <span className="num">densidade: {f(d.densidade as number)} g/mL</span>
      </div>
    )
  }
  return (
    <div className="flex justify-center">
      <figure className="m-0 grid justify-items-center gap-1 text-center text-sm">
        <Bequer volume={d.volumeMl} vmax={Math.max(d.volumeMl * 1.15, 100)} intensidade={0.5} particulas={d.variante === 'ppm' ? 4 : 18} descricao={`Béquer com ${f(d.volumeMl, 0)} mL de solução`} largura={96} />
        <figcaption className="num text-[var(--ink-muted)]">{f(d.volumeMl, 0)} mL de solução</figcaption>
      </figure>
    </div>
  )
}

export function VisualDiluicao({ inst }: { inst: InstanciaNum<DadosDiluicao> }) {
  const d = inst.dados as DadosDiluicao
  return (
    <div className="cartao p-3">
      <CadeiaBequeres etapas={d.etapas} ligacoes={d.ligacoes} />
      <p className="m-0 mt-2 text-center text-sm text-[var(--ink-muted)]">Os pontinhos são o soluto: nada some nem aparece ao diluir ou misturar.</p>
    </div>
  )
}

export function VisualSolubilidade({ inst }: { inst: InstanciaMulti<DadosSolubilidade> }) {
  const d = inst.dados as DadosSolubilidade
  const c = curva(d.curva)
  return (
    <div className="cartao p-3">
      <GraficoSolubilidade curvas={[c]} marcas={d.marcas} />
    </div>
  )
}

export function VisualCristal({ inst }: { inst: InstanciaNum<DadosCristal> }) {
  const d = inst.dados as DadosCristal
  const c = curva(d.curva)
  const marcas: Marca[] = [{ T: d.T1, S: solubilidade(c, d.T1), rotulo: `${d.T1} °C` }]
  if (d.T2 !== undefined) marcas.push({ T: d.T2, S: solubilidade(c, d.T2), rotulo: `${d.T2} °C` })
  return (
    <div className="cartao p-3">
      <GraficoSolubilidade curvas={[c]} marcas={marcas} />
    </div>
  )
}

/* ------------------------------------------------------------------ barra de título */

export function BarraTitulo({ soluto, solucao, nomeSoluto }: { soluto: number; solucao: number; nomeSoluto: string }) {
  const p = (soluto / solucao) * 100
  return (
    <div className="mx-auto grid w-full max-w-md gap-2">
      <div className="flex h-9 overflow-hidden rounded-lg border border-[var(--line-strong)]" role="img" aria-label={`${f(soluto)} g de ${nomeSoluto} em ${f(solucao)} g de solução: ${f(p)} %`}>
        <span className="num grid place-items-center text-sm font-bold" style={{ width: `${p}%`, background: 'var(--accent)', color: 'var(--on-accent)' }}>{p >= 8 ? `${f(p)} %` : ''}</span>
        <span className="num grid flex-1 place-items-center text-sm" style={{ background: 'var(--surface-2)' }}>{f(100 - p)} % água</span>
      </div>
      <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">
        {f(soluto)} g de {nomeSoluto} em {f(solucao)} g de solução: τ = {f(soluto)} ÷ {f(solucao)} = {f(p)} %
      </p>
    </div>
  )
}

