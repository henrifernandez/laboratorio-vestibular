import type { ReactNode } from 'react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { Estrutura } from './Estrutura'
import type { DadosContagem, DadosFuncao, DadosIsomeria, DadosNome, Estrutura as Est } from './geradores'
import { descricaoDe, molDe } from './geradores'
import { alcano, comGrupos, eter, ester, amida, type Espec } from './molecula'

const DESTAQUE = 'var(--accent)'

interface PropsCartao {
  est: Est
  legenda?: ReactNode
  largura?: number
  escala?: number
  destaque?: Record<number, string>
  mostrarC?: boolean
}

/** Uma estrutura com legenda opcional, pronta para ser repetida em galerias. */
export function CartaoMol({ est, legenda, largura, escala, destaque, mostrarC }: PropsCartao) {
  const mol = molDe(est)
  return (
    <figure className="m-0 grid justify-items-center gap-1 text-center">
      <Estrutura mol={mol} descricao={descricaoDe(est)} largura={largura} escala={escala} destaque={destaque} mostrarC={mostrarC} />
      {legenda && <figcaption className="text-sm">{legenda}</figcaption>}
    </figure>
  )
}

function AlternativaTextual({ itens }: { itens: { rotulo: string; est: Est }[] }) {
  return (
    <details className="text-sm text-[var(--ink-muted)]">
      <summary className="min-h-11 cursor-pointer py-2">Ver em fórmula condensada</summary>
      <ul className="m-0 grid list-none gap-1 p-0">
        {itens.map((i) => (
          <li key={i.rotulo} className="num">
            {itens.length > 1 && <strong>{i.rotulo}: </strong>}
            {descricaoDe(i.est).replace('Fórmula condensada: ', '')}
          </li>
        ))}
      </ul>
    </details>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

function CartaoUma({ est }: { est: Est }) {
  return (
    <div className="cartao grid justify-items-center gap-1 p-3">
      <CartaoMol est={est} escala={1.5} />
      <AlternativaTextual itens={[{ rotulo: 'Estrutura', est }]} />
    </div>
  )
}

export const VisualFuncao = ({ inst }: { inst: InstanciaMulti<DadosFuncao> }) => <CartaoUma est={(inst.dados as DadosFuncao).est} />
export const VisualNome = ({ inst }: { inst: InstanciaMulti<DadosNome> }) => <CartaoUma est={(inst.dados as DadosNome).est} />
export const VisualContagem = ({ inst }: { inst: InstanciaNum<DadosContagem> }) => <CartaoUma est={(inst.dados as DadosContagem).est} />

export function VisualIsomeria({ inst }: { inst: InstanciaMulti<DadosIsomeria> }) {
  const d = inst.dados as DadosIsomeria
  return (
    <div className="cartao grid gap-1 p-3">
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-3">
        <CartaoMol est={d.a} legenda={<strong>I</strong>} />
        <CartaoMol est={d.b} legenda={<strong>II</strong>} />
      </div>
      <AlternativaTextual
        itens={[
          { rotulo: 'I', est: d.a },
          { rotulo: 'II', est: d.b },
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ galerias do Entenda */

const E = (espec: Espec): Est => ({ espec })

interface ItemGaleria {
  nome: string
  est: Est
  grupo: number[]
  detalhe: string
}

const cor = (ids: number[]) => Object.fromEntries(ids.map((i) => [i, DESTAQUE]))

export const OXIGENADAS: ItemGaleria[] = [
  { nome: 'Álcool', est: E(comGrupos(3, [{ no: 1, g: 'OH' }])), grupo: [3], detalhe: '–OH em carbono saturado' },
  { nome: 'Fenol', est: { anel: 'OH' }, grupo: [6], detalhe: '–OH no anel aromático' },
  { nome: 'Éter', est: E(eter(1, 2)), grupo: [1], detalhe: 'C–O–C' },
  { nome: 'Aldeído', est: E(comGrupos(3, [{ no: 0, g: '=O' }])), grupo: [0, 3], detalhe: 'C=O na ponta, com H' },
  { nome: 'Cetona', est: E(comGrupos(3, [{ no: 1, g: '=O' }])), grupo: [1, 3], detalhe: 'C=O entre carbonos' },
  { nome: 'Ácido carboxílico', est: E(comGrupos(3, [{ no: 0, g: '=O' }, { no: 0, g: 'OH' }])), grupo: [0, 3, 4], detalhe: '–COOH' },
  { nome: 'Éster', est: E(ester(2, 1)), grupo: [1, 2, 4], detalhe: 'C(=O)–O–C' },
]

export const NITROGENADAS: ItemGaleria[] = [
  { nome: 'Amina', est: E(comGrupos(2, [{ no: 0, g: 'NH2' }])), grupo: [2], detalhe: 'N sem carbonila' },
  { nome: 'Amida', est: E(amida(2)), grupo: [1, 2, 3], detalhe: 'N ligado a C=O' },
  { nome: 'Haleto orgânico', est: E(comGrupos(2, [{ no: 0, g: 'Cl' }])), grupo: [2], detalhe: 'halogênio em carbono' },
]

export function Galeria({ itens }: { itens: ItemGaleria[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
      {itens.map((i) => (
        <li key={i.nome} className="cartao grid justify-items-center gap-1 p-2 text-center">
          <CartaoMol est={i.est} escala={0.95} destaque={cor(i.grupo)} />
          <strong className="text-sm">{i.nome}</strong>
          <span className="text-xs text-[var(--ink-muted)]">{i.detalhe}</span>
        </li>
      ))}
    </ul>
  )
}

/** O nome de 3-metilbutan-2-ol desmontado em partes. */
export function AnatomiaNome() {
  const est = E(comGrupos(4, [{ no: 1, g: 'OH' }, { no: 2, g: 'CH3' }]))
  const partes = [
    { txt: '3-metil', nota: 'ramificação (um CH₃ no carbono 3)' },
    { txt: 'but', nota: '4 carbonos na cadeia principal' },
    { txt: 'an', nota: 'só ligações simples' },
    { txt: '-2-', nota: 'a hidroxila está no carbono 2' },
    { txt: 'ol', nota: 'função álcool' },
  ]
  return (
    <div className="grid justify-items-center gap-3">
      <CartaoMol est={est} escala={1.4} />
      <ul className="m-0 grid w-full max-w-md list-none grid-cols-1 gap-1 p-0 sm:grid-cols-5">
        {partes.map((p) => (
          <li key={p.txt} className="grid justify-items-center gap-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-center">
            <strong className="num text-lg" style={{ color: 'var(--accent)' }}>{p.txt}</strong>
            <span className="text-xs text-[var(--ink-muted)]">{p.nota}</span>
          </li>
        ))}
      </ul>
      <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">Numerando da ponta da direita, a hidroxila fica no carbono 2 e a ramificação, no 3. Pela esquerda seriam 3 e 2, e vale o menor número para o grupo principal.</p>
    </div>
  )
}

export function GaleriaPlana() {
  const pares: { tipo: string; a: { est: Est; nome: string }; b: { est: Est; nome: string } }[] = [
    { tipo: 'Cadeia', a: { est: E(alcano(4)), nome: 'butano' }, b: { est: E(comGrupos(3, [{ no: 1, g: 'CH3' }])), nome: '2-metilpropano' } },
    { tipo: 'Posição', a: { est: E(comGrupos(4, [{ no: 0, g: 'OH' }])), nome: 'butan-1-ol' }, b: { est: E(comGrupos(4, [{ no: 1, g: 'OH' }])), nome: 'butan-2-ol' } },
    { tipo: 'Função', a: { est: E(comGrupos(2, [{ no: 0, g: 'OH' }])), nome: 'etanol' }, b: { est: E(eter(1, 1)), nome: 'metoximetano' } },
    { tipo: 'Compensação', a: { est: E(eter(1, 3)), nome: 'metoxipropano' }, b: { est: E(eter(2, 2)), nome: 'etoxietano' } },
  ]
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
      {pares.map((p) => (
        <li key={p.tipo} className="cartao grid gap-1 p-2">
          <strong className="text-center">{p.tipo}</strong>
          <div className="flex items-end justify-center gap-4">
            <CartaoMol est={p.a.est} escala={0.85} legenda={<span className="text-xs">{p.a.nome}</span>} />
            <CartaoMol est={p.b.est} escala={0.85} legenda={<span className="text-xs">{p.b.nome}</span>} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function GaleriaEspacial() {
  const cis = E({ ...comGrupos(4, [], { 1: 2 }), cis: true })
  const trans = E({ ...comGrupos(4, [], { 1: 2 }), cis: false })
  const quiral = E(comGrupos(4, [{ no: 1, g: 'Cl' }]))
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="cartao grid gap-1 p-2">
        <strong className="text-center">Isomeria cis-trans</strong>
        <div className="flex items-end justify-center gap-4">
          <CartaoMol est={cis} escala={1.0} legenda={<span className="text-xs">cis-but-2-eno</span>} />
          <CartaoMol est={trans} escala={1.0} legenda={<span className="text-xs">trans-but-2-eno</span>} />
        </div>
      </div>
      <div className="cartao grid gap-1 p-2">
        <strong className="text-center">Carbono quiral</strong>
        <CartaoMol est={quiral} escala={1.2} destaque={{ 1: DESTAQUE }} legenda={<span className="text-xs">2-clorobutano: o C2 (em destaque) tem H, Cl, CH₃ e CH₂CH₃</span>} />
      </div>
    </div>
  )
}

export function LeituraTracos() {
  const est = E(comGrupos(4, [{ no: 1, g: 'OH' }]))
  return (
    <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-3">
      <CartaoMol est={est} escala={1.2} legenda={<span className="text-sm">Fórmula de traços</span>} />
      <span aria-hidden="true" className="pb-10 text-xl text-[var(--ink-muted)]">=</span>
      <CartaoMol est={est} escala={1.2} mostrarC legenda={<span className="text-sm">Com todos os C e H</span>} />
    </div>
  )
}
