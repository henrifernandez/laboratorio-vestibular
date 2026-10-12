import { useId, useMemo, type KeyboardEvent, type ReactNode } from 'react'
import type { InstanciaMulti, InstanciaNum, VisualProps } from '@/desafios/simples'
import { TIPOS_ABO, aglutinogenios, aglutininas, cruzar, fenotipoGene, gametas, normalizar, podeReceber, rotuloSangue, valor, type Dominancia, type Fracao, type TipoSangue } from './calculo'
import { BarrasClasses, type ItemBarra } from '../comum/Barras'
import type { DadosHeredograma, DadosProbabilidade } from './geradoresHeredograma'
import { reconstruir } from './geradoresHeredograma'
import type { DadosLigacao } from './geradores'
import { TAMANHO, layoutHeredograma, type Heredograma } from './heredograma'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ heredograma */

export interface PropsHeredograma {
  ped: Heredograma
  /** pessoas destacadas com contorno colorido */
  foco?: string[]
  /** textos curtos sob cada identificador (por exemplo, "Aa 67 %") */
  rotulos?: Record<string, string>
  /** com esta função, cada pessoa vira uma caixa de seleção (alterna afetado/normal) */
  onAlternar?: (id: string) => void
  rotulo: string
}

const textoPessoa = (p: Heredograma['pessoas'][number]) => `${p.id}, ${p.sexo === 'M' ? 'homem' : 'mulher'}, ${p.afetado ? 'afetado' : 'normal'}`

/** Heredograma: quadrado = homem, círculo = mulher, símbolo cheio = afetado. */
export function HeredogramaSvg({ ped, foco = [], rotulos = {}, onAlternar, rotulo }: PropsHeredograma) {
  const lay = useMemo(() => layoutHeredograma(ped), [ped])
  const interativo = !!onAlternar
  const tecla = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      onAlternar?.(id)
    }
  }
  const r = TAMANHO / 2
  const altura = lay.altura + (Object.keys(rotulos).length ? 14 : 0)
  return (
    <figure className="m-0">
      <svg viewBox={`${0} ${0} ${lay.largura} ${altura}`} role={interativo ? 'group' : 'img'} aria-label={rotulo} className="mx-auto block w-full" style={{ maxWidth: Math.max(lay.largura * 1.7, 260) }}>
        {lay.segmentos.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="var(--ink-muted)" strokeWidth={1.6} strokeLinecap="square" />
        ))}
        {ped.pessoas.map((p) => {
          const pos = lay.posicoes.get(p.id) as { x: number; y: number }
          const emFoco = foco.includes(p.id)
          const forma = { fill: p.afetado ? 'var(--ink)' : 'var(--surface)', stroke: emFoco ? 'var(--accent)' : 'var(--ink)', strokeWidth: emFoco ? 3.6 : 1.8 }
          return (
            <g
              key={p.id}
              transform={`translate(${pos.x} ${pos.y})`}
              className={interativo ? 'no-teia' : undefined}
              role={interativo ? 'checkbox' : undefined}
              aria-checked={interativo ? p.afetado : undefined}
              aria-label={interativo ? textoPessoa(p) : undefined}
              tabIndex={interativo ? 0 : undefined}
              onClick={interativo ? () => onAlternar?.(p.id) : undefined}
              onKeyDown={interativo ? tecla(p.id) : undefined}
            >
              {interativo && <rect className="foco" x={-r - 8} y={-r - 6} width={TAMANHO + 16} height={TAMANHO + 34} rx={9} fill="none" stroke="var(--focus)" strokeWidth={3} />}
              {interativo && <rect x={-r - 8} y={-r - 6} width={TAMANHO + 16} height={TAMANHO + 34} rx={9} fill="transparent" />}
              {p.sexo === 'M' ? <rect x={-r} y={-r} width={TAMANHO} height={TAMANHO} {...forma} /> : <circle cx={0} cy={0} r={r} {...forma} />}
              <text y={r + 12} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">
                {p.id}
              </text>
              {rotulos[p.id] && (
                <text y={r + 24} textAnchor="middle" fontSize={9.5} fill="var(--ink-muted)" className="num">
                  {rotulos[p.id]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <ul className="sr-only">
        {ped.pessoas.map((p) => (
          <li key={p.id}>
            {textoPessoa(p)}
            {p.pais ? `, filho${p.sexo === 'F' ? 'a' : ''} de ${p.pais[0]} e ${p.pais[1]}` : ''}
          </li>
        ))}
      </ul>
    </figure>
  )
}

export function legendaHeredograma(): ReactNode {
  return <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Quadrado: homem · círculo: mulher · símbolo cheio: afetado · contorno colorido: pessoa em foco.</p>
}

/** Visual dos desafios de heredograma; o que revelaria a resposta só aparece depois de responder. */
export function VisualHeredograma({ inst, correcao }: VisualProps<InstanciaMulti<DadosHeredograma>>) {
  const d = inst.dados as DadosHeredograma
  const ped = reconstruir(d.estrutura, d.afetados)
  const revela = !!correcao || d.tipo === 'genotipo' || d.tipo === 'paisDeAfetado'
  return (
    <div className="cartao grid gap-2 p-3">
      <HeredogramaSvg ped={ped} foco={revela ? d.foco : []} rotulo={`Heredograma com ${ped.pessoas.length} pessoas: ${ped.pessoas.filter((p) => p.afetado).map((p) => p.id).join(', ') || 'ninguém'} afetado${ped.pessoas.filter((p) => p.afetado).length > 1 ? 's' : ''}`} />
      {legendaHeredograma()}
    </div>
  )
}

export function VisualProbabilidade({ inst }: VisualProps<InstanciaNum<DadosProbabilidade>>) {
  const d = inst.dados as DadosProbabilidade
  const ped = reconstruir(d.estrutura, d.afetados, d.semGeracao)
  return (
    <div className="cartao grid gap-2 p-3">
      <HeredogramaSvg ped={ped} foco={d.foco} rotulo={`Heredograma com ${ped.pessoas.length} pessoas: ${ped.pessoas.filter((p) => p.afetado).map((p) => p.id).join(', ')} afetado${ped.pessoas.filter((p) => p.afetado).length > 1 ? 's' : ''}; em foco: ${d.foco.join(' e ')}`} />
      {legendaHeredograma()}
    </div>
  )
}

/* ------------------------------------------------------------------ quadro de Punnett */

interface PropsPunnett {
  pai: string
  mae: string
  modo?: Dominancia
  /** destaca as casas com este genótipo */
  destaque?: string
}

const PALETA_CLASSES = ['color-mix(in srgb, var(--accent) 24%, var(--surface))', 'var(--aviso-bg)', 'var(--ok-bg)', 'var(--erro-bg)']

/** Rótulo de uma classe de fenótipos ("dominante,recessivo" → "A_ bb"), usando as letras dos genes. */
export function rotuloClasse(chave: string, genotipoPai: string, modo: Dominancia = 'completa'): string {
  const letras = (genotipoPai.match(/../g) ?? []).map((p) => (p.charAt(0) === p.charAt(0).toUpperCase() ? p.charAt(0) : p.charAt(1).toUpperCase()))
  return chave
    .split(',')
    .map((fen, i) => {
      const L = letras[i] ?? 'A'
      return fen === 'dominante' ? (modo === 'incompleta' ? `${L}${L}` : `${L}_`) : fen === 'recessivo' ? `${L.toLowerCase()}${L.toLowerCase()}` : `${L}${L.toLowerCase()}`
    })
    .join(' ')
}

/** Quadro de Punnett de um ou dois genes, com os gametas de cada genitor nas bordas e as classes fenotípicas coloridas. */
export function QuadroPunnett({ pai, mae, modo = 'completa', destaque }: PropsPunnett) {
  const colunas = [...gametas(pai).keys()]
  const linhas = [...gametas(mae).keys()]
  const genotipoDa = (l: string, c: string) => {
    let g = ''
    for (let i = 0; i < l.length; i++) g += c.charAt(i) + l.charAt(i)
    return normalizar(g)
  }
  const classeDe = (g: string) => (g.match(/../g) ?? []).map((p) => fenotipoGene(p, modo)).join(',')
  const contagem = new Map<string, number>()
  for (const l of linhas) for (const c of colunas) contagem.set(classeDe(genotipoDa(l, c)), (contagem.get(classeDe(genotipoDa(l, c))) ?? 0) + 1)
  const ordenadas = [...contagem].sort((a, b) => b[1] - a[1])
  const cor = new Map(ordenadas.map(([k], i) => [k, PALETA_CLASSES[i % PALETA_CLASSES.length] as string]))
  const total = linhas.length * colunas.length
  const dist = cruzar(pai, mae)
  const resumo = [...dist].map(([g, p]) => `${g}: ${f(valor(p) * 100)} %`).join('; ')
  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto">
        <table className="num mx-auto border-collapse text-center" aria-label={`Quadro de Punnett do cruzamento ${pai} × ${mae}. ${resumo}`}>
          <caption className="pb-1 text-sm text-[var(--ink-muted)]">
            Gametas de {pai} (em cima) e de {mae} (à esquerda)
          </caption>
          <thead>
            <tr>
              <td />
              {colunas.map((c) => (
                <th key={c} scope="col" className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-1 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l}>
                <th scope="row" className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-1 font-semibold">
                  {l}
                </th>
                {colunas.map((c) => {
                  const g = genotipoDa(l, c)
                  return (
                    <td key={c} className="border border-[var(--line-strong)] px-1 py-2 font-semibold" style={{ background: cor.get(classeDe(g)), outline: destaque && g === destaque ? '3px solid var(--accent)' : undefined, outlineOffset: -3, minWidth: '3rem' }}>
                      {g}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-sm">
        {ordenadas.map(([k, n]) => (
          <li key={k} className="num flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-3.5 rounded-sm border border-[var(--line-strong)]" style={{ background: cor.get(k) }} />
            {rotuloClasse(k, pai, modo)}: {n} de {total}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ cromossomos e genes ligados */

/** Dois cromossomos homólogos com dois genes ligados, em cis (AB/ab) ou trans (Ab/aB). */
export function CromossomosSvg({ arranjo, distancia }: { arranjo: 'cis' | 'trans'; distancia?: number }) {
  const W = 300
  const H = 150
  const uid = useId().replace(/:/g, '')
  const alelos = arranjo === 'cis' ? [['A', 'B'], ['a', 'b']] : [['A', 'b'], ['a', 'B']]
  const x = [88, 212]
  const yGenes = [44, 106]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Par de cromossomos homólogos com os genes A e B ligados, em ${arranjo === 'cis' ? 'cis: um cromossomo com A e B, o outro com a e b' : 'trans: um cromossomo com A e b, o outro com a e B'}${distancia ? `, a ${distancia} centimorgans` : ''}`} className="mx-auto block w-full max-w-sm">
      {x.map((cx, i) => (
        <g key={i}>
          <rect x={cx - 16} y={14} width={32} height={122} rx={16} fill="var(--surface-2)" stroke="var(--ink-muted)" strokeWidth={1.8} />
          <line x1={cx - 16} x2={cx + 16} y1={75} y2={75} stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="3 3" />
          {alelos[i]!.map((a, k) => (
            <g key={k}>
              <line x1={cx - 16} x2={cx + 16} y1={yGenes[k]} y2={yGenes[k]} stroke="var(--accent)" strokeWidth={4} />
              <text x={i === 0 ? cx - 24 : cx + 24} y={yGenes[k]! + 5} textAnchor={i === 0 ? 'end' : 'start'} fontSize={15} fontWeight={700} fill="var(--ink)">
                {a}
              </text>
            </g>
          ))}
        </g>
      ))}
      <defs>
        <marker id={`${uid}-m`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--ink-muted)" />
        </marker>
      </defs>
      <line x1={150} x2={150} y1={yGenes[0]! + 3} y2={yGenes[1]! - 3} stroke="var(--ink-muted)" strokeWidth={1.4} markerStart={`url(#${uid}-m)`} markerEnd={`url(#${uid}-m)`} />
      {distancia !== undefined && (
        <text x={150} y={78} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)" stroke="var(--paper)" strokeWidth={4} paintOrder="stroke" className="num">
          {f(distancia, 1)} cM
        </text>
      )}
      <text x={150} y={146} textAnchor="middle" fontSize={11} fill="var(--ink-muted)">
        {arranjo === 'cis' ? 'cis: AB / ab' : 'trans: Ab / aB'}
      </text>
    </svg>
  )
}

export function VisualLigacao({ inst }: VisualProps<InstanciaNum<DadosLigacao>>) {
  const d = inst.dados as DadosLigacao
  if (d.variante !== 'gameta') return null
  return (
    <div className="cartao grid gap-1 p-3">
      <CromossomosSvg arranjo={d.extra?.trans === 1 ? 'trans' : 'cis'} distancia={d.extra?.cM} />
    </div>
  )
}

/* ------------------------------------------------------------------ sangue */

const rotuloABO = (t: string) => t

/** Aglutinogênios e aglutininas de cada tipo ABO. */
export function TabelaTiposABO({ destaque }: { destaque?: string }) {
  const genotipos: Record<string, string> = { A: 'IᴬIᴬ ou Iᴬi', B: 'IᴮIᴮ ou Iᴮi', AB: 'IᴬIᴮ', O: 'ii' }
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="pb-1 text-left font-semibold">Sistema ABO</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th scope="col" className="py-1 pr-2">Tipo</th>
            <th scope="col" className="py-1 pr-2">Genótipos</th>
            <th scope="col" className="py-1 pr-2">Nas hemácias (aglutinogênios)</th>
            <th scope="col" className="py-1">No plasma (aglutininas)</th>
          </tr>
        </thead>
        <tbody>
          {TIPOS_ABO.map((t) => (
            <tr key={t} className="border-b border-[var(--line)] align-top" style={{ background: destaque === t ? 'var(--surface-2)' : undefined }}>
              <th scope="row" className="py-1.5 pr-2 font-semibold">{rotuloABO(t)}</th>
              <td className="py-1.5 pr-2">{genotipos[t]}</td>
              <td className="py-1.5 pr-2">{aglutinogenios(t).length ? aglutinogenios(t).join(' e ') : 'nenhum'}</td>
              <td className="py-1.5">{aglutininas(t).length ? aglutininas(t).map((x) => `anti-${x}`).join(' e ') : 'nenhuma'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TODOS_SANGUE: TipoSangue[] = TIPOS_ABO.flatMap((abo) => (['+', '-'] as const).map((rh) => ({ abo, rh })))

/** Quem pode doar (linhas) para quem (colunas). ✓ = pode; ✗ = não pode. */
export function MatrizTransfusao({ receptor }: { receptor?: TipoSangue }) {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="num mx-auto border-collapse text-center text-sm" aria-label="Compatibilidade de transfusão de hemácias: linhas são doadores, colunas são receptores">
        <caption className="pb-1 text-left text-sm font-semibold">Doador (linha) → receptor (coluna)</caption>
        <thead>
          <tr>
            <td />
            {TODOS_SANGUE.map((r) => (
              <th key={rotuloSangue(r)} scope="col" className="px-1 py-1 font-semibold" style={{ background: receptor && rotuloSangue(receptor) === rotuloSangue(r) ? 'var(--surface-2)' : undefined }}>
                {rotuloSangue(r)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TODOS_SANGUE.map((d) => (
            <tr key={rotuloSangue(d)}>
              <th scope="row" className="px-1.5 py-0.5 text-right font-semibold">
                {rotuloSangue(d)}
              </th>
              {TODOS_SANGUE.map((r) => {
                const ok = podeReceber(d, r)
                const marcado = receptor && rotuloSangue(receptor) === rotuloSangue(r)
                return (
                  <td key={rotuloSangue(r)} className="size-7 border border-[var(--line)]" style={{ background: ok ? 'var(--ok-bg)' : 'var(--erro-bg)', outline: marcado ? '2px solid var(--accent)' : undefined, outlineOffset: -2 }} title={`${rotuloSangue(d)} → ${rotuloSangue(r)}: ${ok ? 'compatível' : 'incompatível'}`}>
                    <span aria-label={ok ? 'compatível' : 'incompatível'} style={{ color: ok ? 'var(--ok)' : 'var(--erro)', fontWeight: 700 }}>
                      {ok ? '✓' : '✗'}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Barras de uma distribuição de fenótipos (frações exatas). */
export function barrasDeDistribuicao(dist: Map<string, Fracao>, nomes: (k: string) => string): ItemBarra[] {
  return [...dist].map(([k, p]) => ({ rotulo: nomes(k), valor: valor(p) * 100 }))
}

/* ------------------------------------------------------------------ um gene em cromossomos homólogos */

/** Par de cromossomos homólogos com os dois alelos de um gene. */
export function HomologosSvg({ alelos }: { alelos: [string, string] }) {
  return (
    <svg viewBox="0 0 260 130" role="img" aria-label={`Par de cromossomos homólogos: um carrega o alelo ${alelos[0]} e o outro o alelo ${alelos[1]} do mesmo gene`} className="mx-auto block w-full max-w-xs">
      {[80, 180].map((cx, i) => (
        <g key={cx}>
          <rect x={cx - 15} y={12} width={30} height={104} rx={15} fill="var(--surface-2)" stroke="var(--ink-muted)" strokeWidth={1.8} />
          <line x1={cx - 15} x2={cx + 15} y1={60} y2={60} stroke="var(--accent)" strokeWidth={5} />
          <text x={i === 0 ? cx - 24 : cx + 24} y={66} textAnchor={i === 0 ? 'end' : 'start'} fontSize={17} fontWeight={700} fill="var(--ink)">
            {alelos[i]}
          </text>
        </g>
      ))}
      <text x={130} y={126} textAnchor="middle" fontSize={11} fill="var(--ink-muted)">
        mesmo gene (mesma posição), alelos diferentes
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ cruzamento com gene no X */

const mostraX = (g: string) => g.replace('XA', 'Xᴬ').replace('Xa', 'Xᵃ').replace('XA', 'Xᴬ').replace('Xa', 'Xᵃ')

/** Quadro de um cruzamento com um gene no cromossomo X. Pai: XAY ou XaY; mãe: XAXA, XAXa ou XaXa. */
export function QuadroX({ pai, mae }: { pai: 'XAY' | 'XaY'; mae: 'XAXA' | 'XAXa' | 'XaXa' }) {
  const colunas = [pai === 'XAY' ? 'XA' : 'Xa', 'Y']
  const linhas = [mae.slice(0, 2), mae.slice(2)]
  const celula = (l: string, c: string) => (c === 'Y' ? `${l}Y` : l !== c ? 'XAXa' : `${l}${c}`)
  const afetado = (g: string) => g === 'XaXa' || g === 'XaY'
  const portadora = (g: string) => g === 'XAXa'
  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto">
        <table className="num mx-auto border-collapse text-center" aria-label={`Quadro do cruzamento ${mostraX(pai)} × ${mostraX(mae)}`}>
          <caption className="pb-1 text-sm text-[var(--ink-muted)]">Pai {mostraX(pai)} (em cima) × mãe {mostraX(mae)} (à esquerda)</caption>
          <thead>
            <tr>
              <td />
              {colunas.map((c) => (
                <th key={c} scope="col" className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-3 py-1 font-semibold">
                  {mostraX(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={`${l}-${i}`}>
                <th scope="row" className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-3 py-1 font-semibold">
                  {mostraX(l)}
                </th>
                {colunas.map((c) => {
                  const g = celula(l, c)
                  return (
                    <td key={c} className="border border-[var(--line-strong)] px-2 py-2 font-semibold" style={{ background: afetado(g) ? 'var(--aviso-bg)' : portadora(g) ? 'var(--surface-2)' : 'var(--ok-bg)', minWidth: '3.5rem' }}>
                      {mostraX(g)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Amarelo: afetado · cinza: portadora (sem a doença) · verde: normal.</p>
    </div>
  )
}

export { BarrasClasses, type ItemBarra }
