import { COR_ELEMENTO } from '../comum/elementos'
import { hidrogenios, type Atomo, type Molecula } from './molecula'

interface Props {
  mol: Molecula
  /** texto lido por leitores de tela (use a fórmula condensada) */
  descricao: string
  /** mostra todos os C e H (CH₃, CH₂...) em vez da fórmula de traços */
  mostrarC?: boolean
  /** largura em px; a altura segue a proporção */
  largura?: number
  /** em vez de largura: fator sobre o tamanho natural (ligação de 30 px). Use o mesmo valor numa galeria. */
  escala?: number
  /** átomos para destacar, por id */
  destaque?: Record<number, string>
}

const COR_TEXTO: Record<string, string> = { O: '#e0473d', N: '#4f86e8', Cl: '#2fa850', Br: '#b04a4a', F: '#4caf50', C: 'var(--ink)' }

function indice(n: number): string {
  return String(n)
    .split('')
    .map((d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])
    .join('')
}

/** Estrutura em fórmula de traços (os vértices são carbonos; os hidrogênios ligados a carbono ficam implícitos). */
export function Estrutura({ mol, descricao, mostrarC = false, largura, escala = 1.4, destaque = {} }: Props) {
  const R = 30
  const comRotulo = (a: Atomo) => a.el !== 'C' || mostrarC
  const rotulo = (a: Atomo): string => {
    const h = hidrogenios(mol, a.id)
    // se a ligação vem da direita, o H vai antes do símbolo (HO, H₂N)
    const viz = mol.ligacoes.filter((l) => l.a === a.id || l.b === a.id).map((l) => mol.atomos[l.a === a.id ? l.b : l.a] as Atomo)
    const daDireita = viz.length === 1 && (viz[0] as Atomo).x > a.x + 4
    const hTxt = h === 0 ? '' : h === 1 ? 'H' : `H${indice(h)}`
    return daDireita && a.el !== 'C' ? `${hTxt}${a.el}` : `${a.el}${hTxt}`
  }
  const aromaticos = mol.atomos.filter((a) => a.arom)
  const centro = aromaticos.length
    ? { x: aromaticos.reduce((s, a) => s + a.x, 0) / aromaticos.length, y: aromaticos.reduce((s, a) => s + a.y, 0) / aromaticos.length }
    : null

  const encurta = (a: Atomo, b: Atomo, quanto: number) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: a.x + ((b.x - a.x) / d) * quanto, y: a.y + ((b.y - a.y) / d) * quanto }
  }
  const folga = (a: Atomo) => (comRotulo(a) ? (a.el === 'Cl' || a.el === 'Br' ? 10 : 8) : 0)

  const linhas = mol.ligacoes.flatMap((l, k) => {
    const A = mol.atomos[l.a] as Atomo
    const B = mol.atomos[l.b] as Atomo
    const p = encurta(A, B, folga(A))
    const q = encurta(B, A, folga(B))
    const d = Math.hypot(q.x - p.x, q.y - p.y) || 1
    const nx = -(q.y - p.y) / d
    const ny = (q.x - p.x) / d
    const ordem = l.arom ? 1 : l.ordem
    const deslocamentos = ordem === 1 ? [0] : ordem === 2 ? [-2.6, 2.6] : [-4, 0, 4]
    return deslocamentos.map((o, j) => <line key={`${k}-${j}`} x1={p.x + nx * o} y1={p.y + ny * o} x2={q.x + nx * o} y2={q.y + ny * o} stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />)
  })

  const W = mol.largura
  const H = mol.altura
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={largura ?? W * escala} role="img" aria-label={descricao} className="block max-w-full" style={{ height: 'auto' }}>
      {centro && <circle cx={centro.x} cy={centro.y} r={R * 0.58} fill="none" stroke="var(--ink)" strokeWidth={1.8} />}
      {mol.atomos.map((a) => (destaque[a.id] ? <circle key={`d${a.id}`} cx={a.x} cy={a.y} r={13} fill={destaque[a.id]} opacity={0.35} /> : null))}
      {linhas}
      {mol.atomos.filter(comRotulo).map((a) => (
        <text key={a.id} x={a.x} y={a.y + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={a.el === 'C' ? 'var(--ink)' : (COR_TEXTO[a.el] ?? COR_ELEMENTO[a.el])} stroke="var(--surface)" strokeWidth={4} paintOrder="stroke" style={{ fontFamily: 'var(--font-texto)' }}>
          {rotulo(a)}
        </text>
      ))}
    </svg>
  )
}
