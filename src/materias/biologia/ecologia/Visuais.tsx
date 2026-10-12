import { useId, useMemo, type KeyboardEvent, type ReactNode } from 'react'
import type { InstanciaMulti, InstanciaNum, VisualProps } from '@/desafios/simples'
import { alimentos, logistico, nomeEspecie, teia, type Teia } from './calculo'
import type { DadosEnergia, DadosPopulacao, DadosTeia } from './geradores'
import { NO_A, NO_L, layoutTeia, quebrarNome } from './teiaLayout'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ teia alimentar */

export type Marca = 'removida' | 'alvo' | 'sem' | 'sobe' | 'cai' | 'fonte'

const SELO: Record<Exclude<Marca, 'alvo'>, { texto: string; cor: string; nome: string }> = {
  removida: { texto: '✕', cor: 'var(--erro)', nome: 'removida' },
  sem: { texto: '!', cor: 'var(--erro)', nome: 'fica sem alimento' },
  sobe: { texto: '↑', cor: 'var(--ok)', nome: 'tende a aumentar' },
  cai: { texto: '↓', cor: 'var(--erro)', nome: 'tende a diminuir' },
  fonte: { texto: '−', cor: 'var(--aviso)', nome: 'perde uma fonte de alimento' },
}

export function descricaoTeia(t: Teia): string {
  return t.especies
    .map((e) => {
      const a = alimentos(t, e.id)
      return a.length === 0 ? `${e.nome}: produtor.` : `${e.nome}: se alimenta de ${a.map((x) => nomeEspecie(t, x)).join(', ')}.`
    })
    .join(' ')
}

interface PropsTeia {
  t: Teia
  marcas?: Record<string, Marca>
  /** cadeia a realçar (lista de espécies, do produtor para cima) */
  cadeia?: string[]
  /** com esta função, cada espécie vira uma caixa de seleção (clique, Enter ou Espaço) */
  onAlternar?: (id: string) => void
  rotulo: string
}

/** Teia alimentar em camadas: produtores embaixo, predadores de topo em cima; as setas vão de quem é comido para quem come. */
export function TeiaSvg({ t, marcas = {}, cadeia, onAlternar, rotulo }: PropsTeia) {
  const lay = useMemo(() => layoutTeia(t), [t])
  const uid = useId().replace(/:/g, '')
  const noCadeia = (de: string, para: string) => !!cadeia && cadeia.some((x, i) => i > 0 && cadeia[i - 1] === de && x === para)
  const removidas = new Set(Object.entries(marcas).filter(([, m]) => m === 'removida').map(([id]) => id))
  const nomes = new Map(t.especies.map((e) => [e.id, e]))
  const tecla = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      onAlternar?.(id)
    }
  }
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${lay.largura} ${lay.altura}`} role={onAlternar ? 'group' : 'img'} aria-label={rotulo} className="mx-auto block w-full max-w-[26rem]">
        <defs>
          <marker id={`${uid}-n`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--ink-muted)" />
          </marker>
          <marker id={`${uid}-d`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
          </marker>
        </defs>
        {lay.setas.map((s) => {
          const realce = noCadeia(s.de, s.para)
          const apagada = removidas.has(s.de) || removidas.has(s.para)
          const ym = (s.y1 + s.y2) / 2
          return (
            <path
              key={`${s.de}-${s.para}`}
              d={`M ${s.x1} ${s.y1} C ${s.x1} ${ym}, ${s.x2} ${ym}, ${s.x2} ${s.y2 + 1}`}
              fill="none"
              stroke={realce ? 'var(--accent)' : 'var(--ink-muted)'}
              strokeWidth={realce ? 3 : 1.4}
              strokeDasharray={apagada ? '4 4' : undefined}
              opacity={apagada ? 0.35 : realce ? 1 : 0.75}
              markerEnd={`url(#${uid}-${realce ? 'd' : 'n'})`}
            />
          )
        })}
        {lay.nos.map((n) => {
          const e = nomes.get(n.id)!
          const marca = marcas[n.id]
          const removida = marca === 'removida'
          const linhas = quebrarNome(e.nome)
          const interativo = !!onAlternar
          const selo = marca && marca !== 'alvo' ? SELO[marca] : null
          const cx = NO_L / 2
          const textoY = linhas.length === 1 ? NO_A / 2 + 4 : NO_A / 2 - 3
          return (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              className={interativo ? 'no-teia' : undefined}
              role={interativo ? 'checkbox' : undefined}
              aria-checked={interativo ? removida : undefined}
              aria-label={interativo ? `${e.nome}${e.produtor ? ', produtor' : ''}${removida ? ', removida' : ''}` : undefined}
              tabIndex={interativo ? 0 : undefined}
              onClick={interativo ? () => onAlternar?.(n.id) : undefined}
              onKeyDown={interativo ? tecla(n.id) : undefined}
            >
              {interativo && <rect className="foco" x={-4} y={-4} width={NO_L + 8} height={NO_A + 8} rx={11} fill="none" stroke="var(--focus)" strokeWidth={3} />}
              <rect
                width={NO_L}
                height={NO_A}
                rx={8}
                fill={removida || marca === 'sem' ? 'var(--erro-bg)' : e.produtor ? 'var(--ok-bg)' : 'var(--surface)'}
                stroke={removida || marca === 'sem' ? 'var(--erro)' : marca === 'alvo' ? 'var(--accent)' : e.produtor ? 'var(--ok)' : 'var(--line-strong)'}
                strokeWidth={marca === 'alvo' ? 3.2 : 1.5}
                strokeDasharray={removida ? '5 3' : undefined}
              />
              <text textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)" textDecoration={removida ? 'line-through' : undefined}>
                {linhas.map((l, i) => (
                  <tspan key={l} x={cx} y={textoY + i * 13}>
                    {l}
                  </tspan>
                ))}
              </text>
              {selo && (
                <g aria-hidden="true">
                  <circle cx={NO_L - 4} cy={4} r={9} fill={selo.cor} stroke="var(--surface)" strokeWidth={1.5} />
                  <text x={NO_L - 4} y={8} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--surface)">
                    {selo.texto}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
      <ul className="sr-only">
        {t.especies.map((e) => {
          const a = alimentos(t, e.id)
          return <li key={e.id}>{a.length === 0 ? `${e.nome}: produtor` : `${e.nome} se alimenta de ${a.map((x) => nomeEspecie(t, x)).join(', ')}`}</li>
        })}
      </ul>
    </figure>
  )
}

export function legendaMarcas(marcas: Record<string, Marca>): ReactNode {
  const usadas = [...new Set(Object.values(marcas))]
  const itens = usadas.filter((m): m is Exclude<Marca, 'alvo'> => m !== 'alvo').map((m) => `${SELO[m].texto} ${SELO[m].nome}`)
  if (usadas.includes('alvo')) itens.push('contorno colorido: espécie da pergunta')
  return itens.length ? <p className="m-0 text-center text-sm text-[var(--ink-muted)]">{itens.join(' · ')}</p> : null
}

/** Visual dos desafios de teia: mostra só o que a pergunta já revela; o restante aparece depois da resposta. */
export function VisualTeia({ inst, correcao }: VisualProps<InstanciaMulti<DadosTeia>>) {
  const d = inst.dados as DadosTeia
  const t = teia(d.teia)
  const respondeu = !!correcao
  const mostraAlvo = respondeu || d.tipo === 'nivel' || d.tipo === 'cascata'
  const marcas: Record<string, Marca> = {}
  for (const [id, m] of Object.entries(d.destaque)) if (m === 'removida' || mostraAlvo) marcas[id] = m
  const cadeia = d.tipo === 'nivel' || d.tipo === 'cascata' || (respondeu && (d.tipo === 'cadeia' || d.tipo === 'maiorcadeia')) ? d.cadeia : undefined
  return (
    <div className="cartao grid gap-2 p-3">
      <TeiaSvg t={t} marcas={marcas} cadeia={cadeia} rotulo={`Teia alimentar do ambiente ${t.nome}. As setas vão de quem é comido para quem come.`} />
      <p className="m-0 text-center text-sm text-[var(--ink-muted)]">As setas vão de quem é comido para quem come (sentido da energia).</p>
      {legendaMarcas(marcas)}
    </div>
  )
}

/* ------------------------------------------------------------------ pirâmides */

export interface ItemPiramide {
  rotulo: string
  valor: number
  texto: string
}

/** Pirâmide em barras centralizadas: o 1º item é a base (produtores). A largura é proporcional ao valor. */
export function PiramideBarras({ titulo, itens, cor = 'var(--accent)' }: { titulo: string; itens: ItemPiramide[]; cor?: string }) {
  const max = Math.max(...itens.map((i) => i.valor), 1e-12)
  const resumo = itens.map((i) => `${i.rotulo}: ${i.texto}`).join('; ')
  return (
    <figure className="m-0 grid gap-1" role="img" aria-label={`${titulo}. ${resumo}`}>
      <figcaption className="text-sm font-semibold text-[var(--ink-muted)]">{titulo}</figcaption>
      <div className="grid gap-1.5">
        {[...itens].reverse().map((i) => (
          <div key={i.rotulo} className="grid grid-cols-[7.5rem_1fr] items-center gap-2">
            <div className="grid text-right leading-tight">
              <span className="text-sm font-semibold">{i.rotulo}</span>
              <span className="num text-xs text-[var(--ink-muted)]">{i.texto}</span>
            </div>
            <div className="relative flex h-8 items-center justify-center rounded bg-[var(--surface-2)]">
              <div className="h-full rounded" style={{ width: `${Math.max(1.5, (i.valor / max) * 100)}%`, background: cor, transition: 'width var(--dur-media)' }} />
            </div>
          </div>
        ))}
      </div>
    </figure>
  )
}

/* ------------------------------------------------------------------ ciclos da matéria */

export interface NoCiclo {
  id: string
  x: number
  y: number
  w: number
  h?: number
  rotulo: string
  sub?: string
  tom?: 'ar' | 'vivo' | 'solo' | 'morto'
}

export interface SetaCiclo {
  de: string
  para: string
  rotulo?: string
  /** deslocamento lateral, para separar setas de ida e volta */
  desloca?: number
  /** curvatura (perpendicular ao segmento); 0 = reta */
  curva?: number
  /** posição do rótulo ao longo da seta (0 a 1) */
  pos?: number
  /** lado do rótulo (1 ou −1) */
  lado?: 1 | -1
}

const SUBSCRITOS = '₀₁₂₃₄₅₆₇₈₉'
const DESLOCA = { normal: 0, sub: 3, sup: -4 }

/** Texto de SVG que troca ₂, ⁺ e ⁻ por subscrito e sobrescrito reais (os glifos pequenos ficam ilegíveis). */
function TextoQuimico({ texto }: { texto: string }) {
  const runs: { tipo: keyof typeof DESLOCA; txt: string }[] = []
  for (const ch of texto) {
    const idx = SUBSCRITOS.indexOf(ch)
    const tipo: keyof typeof DESLOCA = idx >= 0 ? 'sub' : ch === '⁺' || ch === '⁻' ? 'sup' : 'normal'
    const txt = idx >= 0 ? String(idx) : ch === '⁺' ? '+' : ch === '⁻' ? '−' : ch
    const ultimo = runs[runs.length - 1]
    if (ultimo && ultimo.tipo === tipo) ultimo.txt += txt
    else runs.push({ tipo, txt })
  }
  let anterior = 0
  return (
    <>
      {runs.map((r, i) => {
        const dy = DESLOCA[r.tipo] - anterior
        anterior = DESLOCA[r.tipo]
        return (
          <tspan key={i} dy={dy || undefined} fontSize={r.tipo === 'normal' ? undefined : '75%'}>
            {r.txt}
          </tspan>
        )
      })}
    </>
  )
}

const TOM: Record<NonNullable<NoCiclo['tom']>, { fill: string; stroke: string }> = {
  ar: { fill: 'var(--surface-2)', stroke: 'var(--line-strong)' },
  vivo: { fill: 'var(--ok-bg)', stroke: 'var(--ok)' },
  solo: { fill: 'var(--aviso-bg)', stroke: 'var(--aviso)' },
  morto: { fill: 'var(--surface)', stroke: 'var(--ink-muted)' },
}

/** Ponto em que um raio saindo de (px,py) na direção (ux,uy) atravessa a borda do retângulo. */
function borda(n: Required<Pick<NoCiclo, 'x' | 'y' | 'w'>> & { h: number }, px: number, py: number, ux: number, uy: number, folga = 3) {
  const tx = ux === 0 ? Infinity : ((ux > 0 ? n.x + n.w / 2 : n.x - n.w / 2) - px) / ux
  const ty = uy === 0 ? Infinity : ((uy > 0 ? n.y + n.h / 2 : n.y - n.h / 2) - py) / uy
  const t = Math.min(tx, ty) + folga
  return [px + ux * t, py + uy * t] as const
}

/** Diagrama de ciclo: caixas (reservatórios ou seres vivos) e setas (processos). */
export function DiagramaCiclo({ nos, setas, largura = 340, altura, rotulo }: { nos: NoCiclo[]; setas: SetaCiclo[]; largura?: number; altura: number; rotulo: string }) {
  const uid = useId().replace(/:/g, '')
  const por = new Map(nos.map((n) => [n.id, { ...n, h: n.h ?? 40 }]))
  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={rotulo} className="mx-auto block w-full max-w-lg">
      <defs>
        <marker id={`${uid}-s`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--ink-muted)" />
        </marker>
      </defs>
      {setas.map((s) => {
        const a = por.get(s.de)!
        const b = por.get(s.para)!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy)
        const ux = dx / len
        const uy = dy / len
        const nx = -uy
        const ny = ux
        const off = s.desloca ?? 0
        const [x1, y1] = borda(a, a.x + nx * off, a.y + ny * off, ux, uy)
        const [x2, y2] = borda(b, b.x + nx * off, b.y + ny * off, -ux, -uy)
        const curva = s.curva ?? 0
        const cx = (x1 + x2) / 2 + nx * curva * 2
        const cy = (y1 + y2) / 2 + ny * curva * 2
        const d = curva ? `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}` : `M ${x1} ${y1} L ${x2} ${y2}`
        const p = s.pos ?? 0.5
        // ponto do rótulo sobre a curva (quadrática) ou sobre a reta
        const lx = curva ? (1 - p) ** 2 * x1 + 2 * (1 - p) * p * cx + p * p * x2 : x1 + (x2 - x1) * p
        const ly = curva ? (1 - p) ** 2 * y1 + 2 * (1 - p) * p * cy + p * p * y2 : y1 + (y2 - y1) * p
        const lado = (s.lado ?? 1) * 11
        return (
          <g key={`${s.de}-${s.para}`}>
            <path d={d} fill="none" stroke="var(--ink-muted)" strokeWidth={1.6} markerEnd={`url(#${uid}-s)`} />
            {s.rotulo && (
              <text x={lx + nx * lado} y={ly + ny * lado + 3.5} textAnchor="middle" fontSize={10.5} fontStyle="italic" fill="var(--ink)" stroke="var(--surface)" strokeWidth={3.5} paintOrder="stroke">
                {s.rotulo}
              </text>
            )}
          </g>
        )
      })}
      {nos.map((n) => {
        const h = n.h ?? 40
        const tom = TOM[n.tom ?? 'ar']
        return (
          <g key={n.id}>
            <rect x={n.x - n.w / 2} y={n.y - h / 2} width={n.w} height={h} rx={9} fill={tom.fill} stroke={tom.stroke} strokeWidth={1.6} />
            <text x={n.x} y={n.sub ? n.y - 2 : n.y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)">
              {n.rotulo}
            </text>
            {n.sub && (
              <text x={n.x} y={n.y + 12} textAnchor="middle" fontSize={10.5} fill="var(--ink-muted)">
                <TextoQuimico texto={n.sub} />
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export const CICLO_CARBONO = {
  altura: 302,
  nos: [
    { id: 'atm', x: 116, y: 32, w: 120, rotulo: 'Atmosfera', sub: 'CO₂', tom: 'ar' },
    { id: 'fos', x: 290, y: 32, w: 100, rotulo: 'Fósseis', sub: 'carvão, petróleo', tom: 'solo' },
    { id: 'prod', x: 62, y: 148, w: 104, h: 44, rotulo: 'Produtores', sub: 'plantas e algas', tom: 'vivo' },
    { id: 'cons', x: 278, y: 148, w: 104, h: 44, rotulo: 'Consumidores', sub: 'animais', tom: 'vivo' },
    { id: 'dec', x: 170, y: 262, w: 136, rotulo: 'Decompositores', sub: 'fungos e bactérias', tom: 'morto' },
  ] as NoCiclo[],
  setas: [
    { de: 'atm', para: 'prod', rotulo: 'fotossíntese', desloca: 9, lado: 1, pos: 0.45 },
    { de: 'prod', para: 'atm', rotulo: 'respiração', desloca: 9, lado: 1, pos: 0.55 },
    { de: 'cons', para: 'atm', rotulo: 'respiração', pos: 0.62, lado: 1 },
    { de: 'prod', para: 'cons', rotulo: 'alimentação', pos: 0.3, lado: -1 },
    { de: 'prod', para: 'dec', rotulo: 'restos', lado: 1, pos: 0.4 },
    { de: 'cons', para: 'dec', rotulo: 'restos', lado: -1, pos: 0.4 },
    { de: 'dec', para: 'atm', rotulo: 'decomposição', lado: 1, pos: 0.36 },
    { de: 'fos', para: 'atm', rotulo: 'combustão', lado: -1 },
    { de: 'cons', para: 'fos', rotulo: 'fossilização', lado: 1, pos: 0.5 },
  ] as SetaCiclo[],
}

export const CICLO_NITROGENIO = {
  altura: 326,
  nos: [
    { id: 'n2', x: 170, y: 30, w: 140, rotulo: 'Atmosfera', sub: 'N₂', tom: 'ar' },
    { id: 'nh4', x: 62, y: 118, w: 98, rotulo: 'Amônio', sub: 'NH₄⁺', tom: 'solo' },
    { id: 'no3', x: 278, y: 118, w: 98, rotulo: 'Nitrato', sub: 'NO₃⁻', tom: 'solo' },
    { id: 'dec', x: 62, y: 212, w: 112, h: 44, rotulo: 'Decompositores', sub: 'fungos e bactérias', tom: 'morto' },
    { id: 'plan', x: 278, y: 212, w: 98, h: 44, rotulo: 'Plantas', tom: 'vivo' },
    { id: 'ani', x: 170, y: 296, w: 100, h: 40, rotulo: 'Animais', tom: 'vivo' },
  ] as NoCiclo[],
  setas: [
    { de: 'n2', para: 'nh4', rotulo: 'fixação', lado: -1, pos: 0.5 },
    { de: 'no3', para: 'n2', rotulo: 'desnitrificação', lado: 1, pos: 0.5 },
    { de: 'nh4', para: 'no3', rotulo: 'nitrificação', lado: -1 },
    { de: 'no3', para: 'plan', rotulo: 'assimilação', lado: -1 },
    { de: 'plan', para: 'dec', rotulo: 'restos', lado: 1 },
    { de: 'plan', para: 'ani', rotulo: 'alimentação', lado: -1 },
    { de: 'ani', para: 'dec', rotulo: 'restos e excretas', lado: -1 },
    { de: 'dec', para: 'nh4', rotulo: 'amonificação', lado: 1 },
  ] as SetaCiclo[],
}

/* ------------------------------------------------------------------ energia: cadeia com valores */

export function VisualEnergia({ inst }: VisualProps<InstanciaNum<DadosEnergia>>) {
  const d = inst.dados as DadosEnergia
  const x = d.extra ?? {}
  const unidade = d.variante === 'percentual' ? 'kJ' : d.unidade
  const ef = d.eficiencia ?? 0.1
  const entre = (): string => {
    if (d.variante === 'percentual') return '? % passam'
    if (d.variante === 'acumulo') return `× ${f(1 / ef, 0)} em cada passagem`
    if (d.variante === 'dieta') return `come ${f(x.ingerida ?? 0)} kg para ganhar ${f(x.ganho ?? 0)} kg`
    return `${f(ef * 100, 0)} % passam`
  }
  const ordem = d.etapas.map((_, i) => i).reverse() // topo da cadeia primeiro
  const rotuloEtapa = (rotulo: string, i: number) => (i === 0 && (d.variante === 'ppl' || d.variante === 'combinado') ? 'Produtores (produtividade líquida)' : rotulo)
  return (
    <div className="cartao grid gap-1 p-3" role="group" aria-label="Níveis da cadeia alimentar com os valores conhecidos">
      {ordem.map((i) => {
        const e = d.etapas[i]!
        return (
          <div key={`${e.rotulo}-${i}`} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2" style={{ borderColor: i === d.alvo ? 'var(--accent)' : 'var(--line)', background: i === d.alvo ? 'var(--surface-2)' : 'var(--surface)' }}>
              <span className="font-semibold">{rotuloEtapa(e.rotulo, i)}</span>
              <span className="num text-lg font-semibold" style={{ color: e.valor === null && i === d.alvo ? 'var(--accent)' : undefined }}>
                {e.valor === null ? (i === d.alvo ? '?' : '…') : `${f(e.valor, 4)} ${unidade}`}
              </span>
            </div>
            {i > 0 && (
              <p className="m-0 text-center text-sm text-[var(--ink-muted)]">
                <span aria-hidden="true">↑ </span>
                {d.variante === 'ppl' ? 'só 10 % da produtividade líquida passam' : entre()}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ gráfico logístico (desafios) */

export function GraficoLogistico({ k, r, n }: { k: number; r: number; n?: number }) {
  const W = 340
  const H = 190
  const n0 = k / 20
  const tmax = Math.log(((k - n0) / n0) * 60) / r
  const X = (t: number) => 44 + (t / tmax) * 276
  const Y = (v: number) => 156 - (v / (k * 1.1)) * 136
  const pts = Array.from({ length: 121 }, (_, i) => {
    const t = (i / 120) * tmax
    return `${X(t)},${Y(logistico(n0, r, k, t))}`
  }).join(' ')
  const tN = n !== undefined && n > n0 && n < k ? Math.log(((k - n0) / n0) * (n / (k - n))) / r : null
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Curva logística: a população cresce em forma de S e se aproxima da capacidade de suporte K = ${f(k, 0)}${n !== undefined ? `; marcado o ponto em que N = ${f(n, 0)}` : ''}`} className="mx-auto block w-full max-w-lg">
      <line x1={44} x2={44} y1={14} y2={156} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={324} y1={156} y2={156} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={324} y1={Y(k)} y2={Y(k)} stroke="var(--erro)" strokeDasharray="5 4" strokeWidth={1.5} />
      <text x={324} y={Y(k) - 5} textAnchor="end" fontSize={11} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke" className="num">
        K = {f(k, 0)}
      </text>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      {tN !== null && n !== undefined && (
        <g>
          <line x1={44} x2={X(tN)} y1={Y(n)} y2={Y(n)} stroke="var(--ink-muted)" strokeDasharray="3 3" />
          <circle cx={X(tN)} cy={Y(n)} r={5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5} />
          <text x={48} y={Y(n) - 5} fontSize={11} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke" className="num">
            N = {f(n, 0)}
          </text>
        </g>
      )}
      <text x={324} y={176} textAnchor="end" fontSize={11} fill="var(--ink-muted)">
        tempo
      </text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">
        indivíduos (N)
      </text>
    </svg>
  )
}

export function VisualPopulacao({ inst }: VisualProps<InstanciaNum<DadosPopulacao>>) {
  const d = inst.dados as DadosPopulacao
  if (d.variante === 'taxaLogistica' || d.variante === 'maxima' || d.variante === 'nMaxima') {
    return (
      <div className="cartao grid gap-1 p-3">
        <GraficoLogistico k={d.k as number} r={d.r as number} n={d.variante === 'taxaLogistica' ? d.n : undefined} />
        <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Crescimento logístico: a curva sobe em S e se aproxima da capacidade de suporte (K).</p>
      </div>
    )
  }
  return null
}
