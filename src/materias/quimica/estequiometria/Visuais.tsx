import type { ReactNode } from 'react'
import type { InstanciaNum, InstanciaMulti } from '@/desafios/simples'
import type { Correcao } from '@/desafios/tipos'
import { COR_ELEMENTO } from '../comum/elementos'
import { Formula } from '../comum/Formula'
import { balanco, coefDe, MM, reacao, type Reacao } from './calculo'
import type { DadosLimitante, DadosMassa } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ equação */

interface PropsEquacao {
  r: Reacao
  /** coeficientes mostrados (padrão: os corretos) */
  coefs?: number[]
  /** índices (reagentes primeiro, depois produtos) a destacar */
  destaque?: Record<number, 'dado' | 'pedido'>
  tamanho?: 'normal' | 'grande'
}

/** Equação química com os coeficientes em destaque. */
export function Equacao({ r, coefs = r.coefs, destaque = {}, tamanho = 'normal' }: PropsEquacao) {
  const nr = r.reagentes.length
  const especie = (formula: string, k: number) => {
    const d = destaque[k]
    return (
      <span key={`${k}-${formula}`} className="inline-flex items-baseline gap-1 rounded-md px-1.5 py-0.5" style={d ? { background: d === 'dado' ? 'var(--surface-2)' : 'var(--aviso-bg)', outline: `1.5px solid ${d === 'dado' ? 'var(--line-strong)' : 'var(--aviso)'}` } : undefined}>
        {coefs[k] !== 1 && <strong className="num" style={{ color: 'var(--accent)' }}>{coefs[k]}</strong>}
        <Formula f={formula} />
      </span>
    )
  }
  const lado = (formulas: string[], inicio: number): ReactNode[] =>
    formulas.flatMap((fm, i) => (i === 0 ? [especie(fm, inicio + i)] : [<span key={`mais-${inicio + i}`} aria-hidden="true" className="text-[var(--ink-muted)]">+</span>, especie(fm, inicio + i)]))
  return (
    <p className={`num flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${tamanho === 'grande' ? 'text-2xl' : 'text-lg'}`} aria-label={`Equação: ${r.reagentes.join(' mais ')} produz ${r.produtos.join(' mais ')}`}>
      {lado(r.reagentes, 0)}
      <span aria-hidden="true" className="px-1 text-[var(--ink-muted)]">→</span>
      {lado(r.produtos, nr)}
    </p>
  )
}

/* ------------------------------------------------------------------ átomos de cada lado */

const DOTS_POR_LINHA = 10
const PASSO = 12

/** Pontinhos coloridos: um por átomo de cada elemento, reagentes à esquerda e produtos à direita. */
export function PontosAtomos({ r, coefs }: { r: Reacao; coefs: number[] }) {
  const b = balanco(r, coefs)
  const linhasDe = (n: number) => Math.max(1, Math.ceil(n / DOTS_POR_LINHA))
  const alturas = b.map((x) => Math.max(linhasDe(x.esquerda), linhasDe(x.direita)) * PASSO + 10)
  const linhas = b.map((x, i) => ({ ...x, h: alturas[i] as number, topo: 24 + alturas.slice(0, i).reduce((s, h) => s + h, 0) }))
  const altura = 28 + alturas.reduce((s, h) => s + h, 0)
  const pontos = (n: number, x0: number, topo: number, cor: string) =>
    Array.from({ length: n }, (_, i) => <circle key={i} cx={x0 + (i % DOTS_POR_LINHA) * PASSO + 6} cy={topo + 7 + Math.floor(i / DOTS_POR_LINHA) * PASSO} r={4.6} fill={cor} stroke="var(--ink-muted)" strokeWidth={0.8} />)
  return (
    <svg viewBox={`0 0 340 ${altura}`} role="img" aria-label={`Átomos de cada elemento: ${b.map((x) => `${x.elemento} ${x.esquerda} nos reagentes e ${x.direita} nos produtos`).join('; ')}`} className="mx-auto block w-full max-w-md">
      <text x={26} y={14} fontSize={13} fontWeight={600} fill="var(--ink-muted)">Reagentes</text>
      <text x={194} y={14} fontSize={13} fontWeight={600} fill="var(--ink-muted)">Produtos</text>
      {linhas.map((x) => {
        const igual = x.esquerda === x.direita
        const cor = COR_ELEMENTO[x.elemento] ?? 'var(--ink-muted)'
        return (
          <g key={x.elemento}>
            <text x={2} y={x.topo + 12} fontSize={15} fontWeight={700} fill="var(--ink)">{x.elemento}</text>
            {pontos(x.esquerda, 26, x.topo, cor)}
            <text x={152} y={x.topo + 12} fontSize={14} fontWeight={700} className="num" fill="var(--ink)">{x.esquerda}</text>
            <text x={180} y={x.topo + 12} fontSize={16} fontWeight={700} textAnchor="middle" fill={igual ? 'var(--ok)' : 'var(--erro)'}>{igual ? '=' : '≠'}</text>
            {pontos(x.direita, 194, x.topo, cor)}
            <text x={338} y={x.topo + 12} fontSize={14} fontWeight={700} className="num" textAnchor="end" fill="var(--ink)">{x.direita}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ barras de quantidade */

export interface ItemBarra {
  rotulo: ReactNode
  /** texto acessível do rótulo */
  nome: string
  valor: number
  texto: string
  cor?: string
}

/** Barras horizontais (HTML) para mols ou gramas por espécie. */
export function BarrasEspecies({ itens, max, titulo }: { itens: ItemBarra[]; max?: number; titulo: string }) {
  const m = max ?? Math.max(1e-9, ...itens.map((i) => i.valor))
  return (
    <ul className="m-0 grid list-none gap-1.5 p-0" aria-label={titulo}>
      {itens.map((i) => (
        <li key={i.nome} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-sm" aria-label={`${i.nome}: ${i.texto}`}>
          <span className="truncate">{i.rotulo}</span>
          <span className="h-4 overflow-hidden rounded bg-[var(--surface-2)]" aria-hidden="true">
            <span className="block h-full rounded" style={{ width: `${Math.max(0, Math.min(100, (i.valor / m) * 100))}%`, background: i.cor ?? 'var(--accent)', transition: 'width var(--dur-media)' }} />
          </span>
          <span className="num w-24 text-right text-[var(--ink-muted)]">{i.texto}</span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualMassa({ inst }: { inst: InstanciaNum<DadosMassa> }) {
  const d = inst.dados as DadosMassa
  const r = reacao(d.reacaoId)
  return (
    <div className="cartao grid gap-2 p-3">
      <Equacao r={r} destaque={{ [d.de]: 'dado', [d.para]: 'pedido' }} />
      <p className="text-center text-sm text-[var(--ink-muted)]">
        <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--surface-2)', outline: '1.5px solid var(--line-strong)' }}>dado</span>{' '}
        <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--aviso-bg)', outline: '1.5px solid var(--aviso)' }}>pedido</span>
      </p>
    </div>
  )
}

function Quadro({ r, d }: { r: Reacao; d: DadosLimitante }) {
  const usaMassa = d.massas !== null
  const itens: ItemBarra[] = r.reagentes.map((fm, i) => ({
    rotulo: <Formula f={fm} />,
    nome: fm,
    valor: usaMassa ? (d.massas as number[])[i]! : d.mols[i]!,
    texto: usaMassa ? `${f((d.massas as number[])[i]!)} g` : `${f(d.mols[i]!)} mol`,
    cor: 'var(--accent)',
  }))
  return <BarrasEspecies itens={itens} titulo="Quantidade de cada reagente colocada" />
}

export function VisualLimitante({ inst, correcao }: { inst: InstanciaMulti<DadosLimitante>; correcao?: Correcao | null }) {
  const d = inst.dados as DadosLimitante
  const r = reacao(d.reacaoId)
  return (
    <div className="cartao grid gap-3 p-3">
      <Equacao r={r} />
      <Quadro r={r} d={d} />
      {correcao && <Razoes r={r} d={d} />}
    </div>
  )
}

export function VisualSobra({ inst, correcao }: { inst: InstanciaNum<DadosLimitante>; correcao?: Correcao | null }) {
  const d = inst.dados as DadosLimitante
  const r = reacao(d.reacaoId)
  const destaque: Record<number, 'pedido'> = d.variante.startsWith('sobra') ? { [d.alvo as number]: 'pedido' } : { [d.produto as number]: 'pedido' }
  return (
    <div className="cartao grid gap-3 p-3">
      <Equacao r={r} destaque={destaque} />
      <Quadro r={r} d={d} />
      {correcao && <Razoes r={r} d={d} />}
    </div>
  )
}

/** Mostra "mol ÷ coeficiente" de cada reagente, destacando o menor. */
function Razoes({ r, d }: { r: Reacao; d: DadosLimitante }) {
  const razoes = d.mols.map((n, i) => n / coefDe(r, i))
  const menor = Math.min(...razoes)
  return (
    <div className="grid gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-sm" aria-live="polite">
      <strong>mol ÷ coeficiente</strong>
      {r.reagentes.map((fm, i) => (
        <p key={fm} className="num m-0" style={{ fontWeight: Math.abs((razoes[i] as number) - menor) < 1e-9 ? 700 : 400 }}>
          <Formula f={fm} />: {f(d.mols[i]!)} ÷ {coefDe(r, i)} = {f(razoes[i] as number)}
          {Math.abs((razoes[i] as number) - menor) < 1e-9 ? (razoes.every((x) => Math.abs(x - menor) < 1e-9) ? ' (proporção exata)' : '  ← limitante') : ''}
        </p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ passo "mol" do Entenda */

export function PonteMol({ formula = 'H2O', mols = 2 }: { formula?: string; mols?: number }) {
  const M = MM(formula)
  return (
    <div className="mx-auto grid w-full max-w-md gap-2 text-center">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 text-sm">
        <div className="cartao p-2">
          <div className="num text-lg font-bold">{f(M * mols)} g</div>
          <div className="text-[var(--ink-muted)]">massa</div>
        </div>
        <span aria-hidden="true">⇄</span>
        <div className="cartao p-2" style={{ outline: '2px solid var(--accent)' }}>
          <div className="num text-lg font-bold">{f(mols)} mol</div>
          <div className="text-[var(--ink-muted)]">quantidade</div>
        </div>
        <span aria-hidden="true">⇄</span>
        <div className="cartao p-2">
          <div className="num text-lg font-bold">{f(mols * 6)}·10²³</div>
          <div className="text-[var(--ink-muted)]">moléculas</div>
        </div>
      </div>
      <p className="num m-0 text-sm text-[var(--ink-muted)]">
        <Formula f={formula} />: M = {f(M)} g/mol → n = {f(M * mols)} ÷ {f(M)} = {f(mols)} mol
      </p>
    </div>
  )
}

export function EtapasProporcao({ r, mols = 3 }: { r: Reacao; mols?: number }) {
  const nr = r.reagentes.length
  const xi = mols / coefDe(r, 0)
  const massaDe = (formulas: string[], inicio: number) => formulas.reduce((s, fm, i) => s + coefDe(r, inicio + i) * xi * MM(fm), 0)
  const massaReag = massaDe(r.reagentes, 0)
  const massaProd = massaDe(r.produtos, nr)
  const itens: ItemBarra[] = [...r.reagentes, ...r.produtos].map((fm, k) => ({
    rotulo: <Formula f={fm} />,
    nome: fm,
    valor: coefDe(r, k) * xi,
    texto: `${f(coefDe(r, k) * xi)} mol · ${f(coefDe(r, k) * xi * MM(fm))} g`,
    cor: k < nr ? 'var(--accent)' : 'var(--ok)',
  }))
  return (
    <div className="mx-auto grid w-full max-w-md gap-2">
      <Equacao r={r} />
      <BarrasEspecies itens={itens} titulo="Mols e massa de cada substância quando a equação ocorre três vezes" />
      <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">
        Os mols seguem os coeficientes ({r.coefs.join(' : ')}); as massas, não. Mas a soma dos reagentes ({f(massaReag)} g) é igual à dos produtos ({f(massaProd)} g): a massa se conserva.
      </p>
    </div>
  )
}

