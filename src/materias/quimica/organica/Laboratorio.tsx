import { useId } from 'react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoLink } from '@/sim/BotaoLink'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { Formula } from '../comum/Formula'
import { balancear, type Reacao } from '../estequiometria/calculo'
import { Equacao, PontosAtomos } from '../estequiometria/Visuais'
import { DEFINICOES_ORGANICA } from './definicoes'
import { DEFINICAO, NOME_TIPO } from './geradores'
import { CartaoMol } from './Visuais'
import { FAMILIAS, moleculaDe, relacoes } from './isomeria'
import {
  alcano,
  amida,
  comGrupos,
  condensada,
  construir,
  contarClasses,
  ester,
  eter,
  formulaMolecular,
  funcoes,
  hidrogenios,
  NOME_FUNCAO,
  nomeAmida,
  nomeEster,
  nomeEter,
  nomeIUPAC,
  type Espec,
  type Sub,
} from './molecula'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: construtor de moléculas */

const FAMILIAS_LAB = [
  { id: 'alcano', nome: 'Alcano (hidrocarboneto saturado)' },
  { id: 'alceno', nome: 'Alceno (uma ligação dupla)' },
  { id: 'alcino', nome: 'Alcino (uma ligação tripla)' },
  { id: 'alcool', nome: 'Álcool' },
  { id: 'aldeido', nome: 'Aldeído' },
  { id: 'cetona', nome: 'Cetona' },
  { id: 'acido', nome: 'Ácido carboxílico' },
  { id: 'amina', nome: 'Amina' },
  { id: 'haleto', nome: 'Haleto orgânico (cloro)' },
  { id: 'eter', nome: 'Éter' },
  { id: 'ester', nome: 'Éster' },
  { id: 'amida', nome: 'Amida' },
]

const PADRAO_CONSTRUTOR = { fam: 'alcool', n: 4, n2: 2, pos: 2, ramo: 0, mostrar: false }

interface Montagem {
  espec: Espec
  nome: string | null
  avisos: string[]
  n: number
  pos: number
  ramo: number
  limites: { nMin: number; usaPos: boolean; posMin: number; posMax: number; usaN2: boolean; usaRamo: boolean }
}

function montar(e: typeof PADRAO_CONSTRUTOR): Montagem {
  const avisos: string[] = []
  const f = e.fam
  const partido = f === 'eter' || f === 'ester'
  const nMin = f === 'alceno' || f === 'alcino' ? 2 : f === 'cetona' ? 3 : 1
  const n = Math.min(8, Math.max(nMin, e.n))
  const usaPos = ['alceno', 'alcino', 'alcool', 'cetona', 'amina', 'haleto'].includes(f)
  const posMin = f === 'cetona' ? 2 : 1
  const posMax = f === 'alceno' || f === 'alcino' ? n - 1 : f === 'cetona' ? n - 1 : n
  const pos = Math.min(posMax, Math.max(posMin, e.pos))
  const usaRamo = !partido && f !== 'amida'
  const metil: { no: number; g: Sub }[] = []
  let ramo = 0
  if (usaRamo && e.ramo > 0) {
    if (e.ramo >= 2 && e.ramo <= n - 1) {
      metil.push({ no: e.ramo - 1, g: 'CH3' })
      ramo = e.ramo
    } else avisos.push('Uma ramificação só pode sair de um carbono que não seja o primeiro nem o último da cadeia (senão ela vira parte da cadeia principal).')
  }
  const sub = (no: number, g: Sub) => ({ no, g })
  let espec: Espec
  const n2 = Math.min(5, Math.max(1, e.n2))
  switch (f) {
    case 'alcano':
      espec = comGrupos(n, metil)
      break
    case 'alceno':
      espec = comGrupos(n, metil, { [pos - 1]: 2 })
      break
    case 'alcino':
      espec = comGrupos(n, metil, { [pos - 1]: 3 })
      break
    case 'alcool':
      espec = comGrupos(n, [...metil, sub(pos - 1, 'OH')])
      break
    case 'aldeido':
      espec = comGrupos(n, [...metil, sub(0, '=O')])
      break
    case 'cetona':
      espec = comGrupos(n, [...metil, sub(pos - 1, '=O')])
      break
    case 'acido':
      espec = comGrupos(n, [...metil, sub(0, '=O'), sub(0, 'OH')])
      break
    case 'amina':
      espec = comGrupos(n, [...metil, sub(pos - 1, 'NH2')])
      break
    case 'haleto':
      espec = comGrupos(n, [...metil, sub(pos - 1, 'Cl')])
      break
    case 'eter':
      espec = eter(n, n2)
      break
    case 'ester':
      espec = ester(n, n2)
      break
    default:
      espec = amida(n)
  }
  // valências: se o carbono da ramificação já estiver "cheio", tira a ramificação
  let mol = construir(espec)
  if (mol.atomos.some((a) => hidrogenios(mol, a.id) < 0)) {
    avisos.push('Esse carbono já faz as 4 ligações e não aceita a ramificação.')
    espec = { ...espec, subs: (espec.subs ?? []).filter((s) => !(s.g === 'CH3')) }
    mol = construir(espec)
    ramo = 0
  }
  let nome: string | null
  if (f === 'eter') nome = nomeEter(n, n2)
  else if (f === 'ester') nome = nomeEster(n, n2)
  else if (f === 'amida') nome = nomeAmida(n)
  else nome = nomeIUPAC(espec)
  return { espec, nome, avisos, n, pos, ramo, limites: { nMin, usaPos, posMin, posMax, usaN2: partido, usaRamo } }
}

function TelaConstrutor() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CONSTRUTOR)
  const idFam = useId()
  const m = montar(e)
  const mol = construir(m.espec)
  const fs = funcoes(mol)
  const classes = contarClasses(mol)
  const partido = m.limites.usaN2
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid justify-items-center gap-2 p-3">
          <CartaoMol est={{ espec: m.espec }} escala={1.6} mostrarC={e.mostrar} />
        </div>
        <div className="cartao grid gap-1 p-3" aria-live="polite">
          <p className="m-0 text-lg">
            Nome: <strong>{m.nome ?? 'fora do alcance do construtor'}</strong>
          </p>
          <p className="num m-0">
            Fórmula molecular: <strong><Formula f={formulaMolecular(mol)} /></strong> · fórmula condensada: {condensada(m.espec)}
          </p>
          <p className="m-0">
            Função: <strong>{fs.map((x) => NOME_FUNCAO[x]).join(' e ')}</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Carbonos: {classes.primario} primários, {classes.secundario} secundários, {classes.terciario} terciários, {classes.quaternario} quaternários.
          </p>
          {m.avisos.map((a) => (
            <p key={a} className="m-0 text-sm" style={{ color: 'var(--aviso)' }}>
              {a}
            </p>
          ))}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <div className="grid gap-1">
          <label htmlFor={idFam} className="font-semibold">
            Família
          </label>
          <select id={idFam} value={e.fam} onChange={(ev) => atualizar({ fam: ev.target.value })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3">
            {FAMILIAS_LAB.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>
        <ControleDeslizante rotulo={partido ? (e.fam === 'ester' ? 'Carbonos da parte do ácido (inclui a carbonila)' : 'Carbonos de um lado do oxigênio') : e.fam === 'amida' ? 'Carbonos (inclui a carbonila)' : 'Carbonos da cadeia principal'} valor={m.n} onChange={(v) => atualizar({ n: v })} min={m.limites.nMin} max={8} passo={1} marcas={[m.limites.nMin, 8]} />
        {m.limites.usaN2 && <ControleDeslizante rotulo={e.fam === 'ester' ? 'Carbonos da parte ligada ao oxigênio' : 'Carbonos do outro lado do oxigênio'} valor={Math.min(5, Math.max(1, e.n2))} onChange={(v) => atualizar({ n2: v })} min={1} max={5} passo={1} marcas={[1, 5]} />}
        {m.limites.usaPos && <ControleDeslizante rotulo={e.fam === 'alceno' || e.fam === 'alcino' ? 'Posição da insaturação (carbono)' : 'Posição do grupo (carbono)'} valor={m.pos} onChange={(v) => atualizar({ pos: v })} min={m.limites.posMin} max={Math.max(m.limites.posMin, m.limites.posMax)} passo={1} marcas={[m.limites.posMin, Math.max(m.limites.posMin, m.limites.posMax)]} />}
        {m.limites.usaRamo && <ControleDeslizante rotulo="Ramificação metil (carbono; 0 = nenhuma)" valor={m.ramo} onChange={(v) => atualizar({ ramo: v })} min={0} max={Math.max(2, m.n - 1)} passo={1} marcas={[0, Math.max(2, m.n - 1)]} />}
        <PainelDeVisibilidade itens={[{ id: 'mostrar', rotulo: 'Mostrar todos os C e H', ativo: e.mostrar }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <p className="text-sm text-[var(--ink-muted)]">O nome usa a nomenclatura atual da IUPAC (butan-2-ol). Livros antigos escrevem 2-butanol: é a mesma substância.</p>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: isômeros */

const PADRAO_ISO = { f: 'C4H10O', i: 0, j: 1 }

function TelaIsomeros() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ISO)
  const idI = useId()
  const idJ = useId()
  const fam = FAMILIAS.find((x) => x.formula === e.f) ?? (FAMILIAS[0] as (typeof FAMILIAS)[number])
  const i = Math.min(Math.max(0, e.i), fam.lista.length - 1)
  const j = Math.min(Math.max(0, e.j), fam.lista.length - 1)
  const A = fam.lista[i] as (typeof fam.lista)[number]
  const B = fam.lista[j] as (typeof fam.lista)[number]
  const rel = relacoes(moleculaDe(A), moleculaDe(B))
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3" aria-label={`Isômeros de ${fam.formula}`}>
          {fam.lista.map((x, k) => (
            <li key={x.nome} className="cartao grid justify-items-center gap-0.5 p-2 text-center" style={{ outline: k === i || k === j ? '2px solid var(--accent)' : undefined }}>
              <CartaoMol est={{ espec: x.espec }} escala={0.9} />
              <span className="text-xs">
                <strong>{k + 1}. </strong>
                {x.nome}
              </span>
              {(k === i || k === j) && <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{k === i && k === j ? 'Substâncias I e II' : k === i ? 'Substância I' : 'Substância II'}</span>}
            </li>
          ))}
        </ul>
        <div className="cartao grid gap-1 p-3" aria-live="polite">
          <p className="m-0 font-semibold">
            Comparando I ({A.nome}) com II ({B.nome})
          </p>
          {rel.length === 0 ? (
            <p className="m-0">É a mesma substância: nenhuma relação de isomeria.</p>
          ) : (
            rel.map((t) => (
              <p key={t} className="m-0 text-sm">
                <strong>{NOME_TIPO[t]}.</strong> {DEFINICAO[t]}
              </p>
            ))
          )}
          {rel.length > 1 && <p className="m-0 text-sm text-[var(--ink-muted)]">As duas descrições se aplicam, porque as estruturas diferem de mais de um jeito.</p>}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <label className="grid gap-1 font-semibold">
          Fórmula molecular
          <select value={fam.formula} onChange={(ev) => atualizar({ f: ev.target.value, i: 0, j: 1 })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 font-normal">
            {FAMILIAS.map((x) => (
              <option key={x.formula} value={x.formula}>
                {x.formula} — {x.titulo}
              </option>
            ))}
          </select>
        </label>
        <p className="m-0 text-sm text-[var(--ink-muted)]">
          Há {fam.total} isômeros constitucionais com essa fórmula (acíclicos e saturados). Estereoisômeros ficam de fora.
        </p>
        <label className="grid gap-1 font-semibold" htmlFor={idI}>
          Substância I
          <select id={idI} value={i} onChange={(ev) => atualizar({ i: Number(ev.target.value) })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 font-normal">
            {fam.lista.map((x, k) => (
              <option key={x.nome} value={k}>
                {k + 1}. {x.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 font-semibold" htmlFor={idJ}>
          Substância II
          <select id={idJ} value={j} onChange={(ev) => atualizar({ j: Number(ev.target.value) })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 font-normal">
            {fam.lista.map((x, k) => (
              <option key={x.nome} value={k}>
                {k + 1}. {x.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: reações orgânicas */

const PADRAO_REACAO = { modo: 'ester', a: 2, b: 1, k: 4, p: 1, c: 4 }
const MODOS = [
  { id: 'ester', nome: 'Esterificação' },
  { id: 'hidro', nome: 'Hidrogenação de alceno' },
  { id: 'comb', nome: 'Combustão de alcano' },
]
const ALCANOS = ['', 'metano', 'etano', 'propano', 'butano', 'pentano', 'hexano', 'heptano', 'octano']

/** equação com as fórmulas de Hill e coeficientes dados, no formato que o módulo de estequiometria entende */
function reacaoDe(id: string, nome: string, reag: string[], prod: string[], coefs: number[]): Reacao {
  return { id, nome, reagentes: reag, produtos: prod, coefs }
}

function TelaReacoes() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_REACAO)
  const modo = e.modo
  let conteudo
  if (modo === 'ester') {
    const a = Math.min(4, Math.max(1, e.a))
    const b = Math.min(4, Math.max(1, e.b))
    const acido = { espec: comGrupos(a, [{ no: 0, g: '=O' as Sub }, { no: 0, g: 'OH' as Sub }]) }
    const alcool = { espec: comGrupos(b, [{ no: 0, g: 'OH' as Sub }]) }
    const prod = { espec: ester(a, b) }
    const fA = formulaMolecular(construir(acido.espec))
    const fB = formulaMolecular(construir(alcool.espec))
    const fE = formulaMolecular(construir(prod.espec))
    const r = reacaoDe('ester', 'esterificação', [fA, fB], [fE, 'H2O'], [1, 1, 1, 1])
    conteudo = (
      <>
        <div className="cartao grid gap-2 p-3">
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2">
            <CartaoMol est={acido} escala={0.9} legenda={<span className="text-xs">{nomeIUPAC(acido.espec)}</span>} />
            <span aria-hidden="true" className="pb-10 text-xl">+</span>
            <CartaoMol est={alcool} escala={0.9} legenda={<span className="text-xs">{nomeIUPAC(alcool.espec)}</span>} />
            <span aria-hidden="true" className="pb-10 text-xl">⇌</span>
            <CartaoMol est={prod} escala={0.9} legenda={<span className="text-xs">{nomeEster(a, b)}</span>} />
            <span aria-hidden="true" className="pb-10 text-xl">+</span>
            <span className="pb-9 text-lg"><Formula f="H2O" /></span>
          </div>
          <Equacao r={r} />
        </div>
        <div className="cartao p-3">
          <PontosAtomos r={r} coefs={r.coefs} />
        </div>
        <p className="m-0 text-sm text-[var(--ink-muted)]">
          O –OH do ácido e o H do álcool saem como água, e o resto do ácido se liga ao oxigênio do álcool. O nome do éster junta o do ácido (terminado em -oato) com o do grupo do álcool (-ila): {nomeEster(a, b)}.
        </p>
      </>
    )
  } else if (modo === 'hidro') {
    const k = Math.min(6, Math.max(2, e.k))
    const p = Math.min(k - 1, Math.max(1, e.p))
    const alceno = { espec: comGrupos(k, [], { [p - 1]: 2 }) }
    const alcanoE = { espec: alcano(k) }
    const fAl = formulaMolecular(construir(alceno.espec))
    const fAn = formulaMolecular(construir(alcanoE.espec))
    const r = reacaoDe('hidro', 'hidrogenação', [fAl, 'H2'], [fAn], [1, 1, 1])
    conteudo = (
      <>
        <div className="cartao grid gap-2 p-3">
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-2">
            <CartaoMol est={alceno} escala={1.0} legenda={<span className="text-xs">{nomeIUPAC(alceno.espec)}</span>} />
            <span aria-hidden="true" className="pb-10 text-xl">+ H₂ →</span>
            <CartaoMol est={alcanoE} escala={1.0} legenda={<span className="text-xs">{nomeIUPAC(alcanoE.espec)}</span>} />
          </div>
          <Equacao r={r} />
        </div>
        <div className="cartao p-3">
          <PontosAtomos r={r} coefs={r.coefs} />
        </div>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Na hidrogenação catalítica, o H₂ se adiciona à ligação dupla e ela vira simples. O esqueleto de carbonos não muda: alcenos de posições diferentes (como but-1-eno e but-2-eno) dão o mesmo alcano.</p>
      </>
    )
  } else {
    const c = Math.min(8, Math.max(1, e.c))
    const f = formulaMolecular(construir(alcano(c)))
    const coefs = balancear([f, 'O2'], ['CO2', 'H2O']) as number[]
    const r = reacaoDe('comb', 'combustão', [f, 'O2'], ['CO2', 'H2O'], coefs)
    const massaFuel = 12 * c + (2 * c + 2)
    const co2PorKg = ((c * 44) / massaFuel) * 1000
    conteudo = (
      <>
        <div className="cartao grid gap-2 p-3">
          <div className="flex justify-center">
            <CartaoMol est={{ espec: alcano(c) }} escala={1.0} legenda={<span className="text-xs">{ALCANOS[c]}</span>} />
          </div>
          <Equacao r={r} />
        </div>
        <div className="cartao p-3">
          <PontosAtomos r={r} coefs={r.coefs} />
        </div>
        <p className="num m-0 text-sm text-[var(--ink-muted)]" aria-live="polite">
          Combustão completa: todo o carbono vira CO₂ e todo o hidrogênio vira H₂O. Cada mol de {ALCANOS[c]} ({fmt(massaFuel)} g) produz {c} mol de CO₂ ({fmt(c * 44)} g), ou seja, cerca de {fmt(co2PorKg, 0)} g de CO₂ por kg de combustível.
        </p>
      </>
    )
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">{conteudo}</div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Reação</legend>
          {MODOS.map((m) => (
            <label key={m.id} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="modo-org" checked={modo === m.id} onChange={() => atualizar({ modo: m.id })} style={{ accentColor: 'var(--accent)' }} />
              {m.nome}
            </label>
          ))}
        </fieldset>
        {modo === 'ester' && (
          <>
            <ControleDeslizante rotulo="Carbonos do ácido" valor={Math.min(4, Math.max(1, e.a))} onChange={(v) => atualizar({ a: v })} min={1} max={4} passo={1} marcas={[1, 4]} />
            <ControleDeslizante rotulo="Carbonos do álcool" valor={Math.min(4, Math.max(1, e.b))} onChange={(v) => atualizar({ b: v })} min={1} max={4} passo={1} marcas={[1, 4]} />
          </>
        )}
        {modo === 'hidro' && (
          <>
            <ControleDeslizante rotulo="Carbonos do alceno" valor={Math.min(6, Math.max(2, e.k))} onChange={(v) => atualizar({ k: v })} min={2} max={6} passo={1} marcas={[2, 6]} />
            <ControleDeslizante rotulo="Posição da ligação dupla" valor={Math.min(Math.min(6, Math.max(2, e.k)) - 1, Math.max(1, e.p))} onChange={(v) => atualizar({ p: v })} min={1} max={Math.min(6, Math.max(2, e.k)) - 1} passo={1} marcas={[1, Math.min(6, Math.max(2, e.k)) - 1]} />
          </>
        )}
        {modo === 'comb' && <ControleDeslizante rotulo="Carbonos do alcano" valor={Math.min(8, Math.max(1, e.c))} onChange={(v) => atualizar({ c: v })} min={1} max={8} passo={1} marcas={[1, 8]} />}
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaConstrutor /> },
        { id: 'explorar', conteudo: <TelaIsomeros /> },
        { id: 'lab', conteudo: <TelaReacoes /> },
      ]}
      desafios={DEFINICOES_ORGANICA}
    />
  )
}

