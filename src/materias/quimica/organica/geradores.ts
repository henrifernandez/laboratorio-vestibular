import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import {
  alcano,
  amida,
  carbonosQuirais,
  comGrupos,
  condensada,
  construir,
  construirAnel,
  contarClasses,
  ester,
  eter,
  formulaMolecular,
  funcoes,
  hidrogenios,
  maiorCadeia,
  nomeAmida,
  nomeEster,
  nomeEter,
  nomeIUPAC,
  NOME_FUNCAO,
  RECONHECER,
  type Classe,
  type Espec,
  type Funcao,
  type Molecula,
  type Sub,
} from './molecula'

/* ------------------------------------------------------------------ estruturas que aparecem nos desafios */

export type AnelSub = 'OH' | 'NH2' | 'CH3' | 'Cl' | 'COOH' | 'CHO' | 'OCH3'
export type Estrutura = { espec: Espec } | { anel: AnelSub | null }

export const molDe = (e: Estrutura): Molecula => ('espec' in e ? construir(e.espec) : construirAnel(e.anel ?? undefined))

const GRUPO_ANEL: Record<AnelSub, string> = { OH: 'hidroxila', NH2: 'amino', CH3: 'metila', Cl: 'cloro', COOH: 'carboxila', CHO: 'formila (CHO)', OCH3: 'metoxila' }
/** descrição textual da estrutura, para leitores de tela e para o botão de fórmula condensada */
export const descricaoDe = (e: Estrutura): string => ('espec' in e ? `Fórmula condensada: ${condensada(e.espec)}` : e.anel ? `Anel de benzeno com um grupo ${GRUPO_ANEL[e.anel]}` : 'Anel de benzeno')

const OH = (no: number) => ({ no, g: 'OH' as Sub })
const O = (no: number) => ({ no, g: '=O' as Sub })
const ME = (no: number) => ({ no, g: 'CH3' as Sub })
const NH2 = (no: number) => ({ no, g: 'NH2' as Sub })
const HAL = (no: number, g: 'Cl' | 'Br') => ({ no, g: g as Sub })
const E = (espec: Espec): Estrutura => ({ espec })


function limpar(erros: ErroTipico[], resposta: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor) || e.valor < 0 || !Number.isInteger(e.valor)) continue
    if (e.valor === resposta || saida.some((x) => x.valor === e.valor)) continue
    saida.push(e)
  }
  return saida
}

/* ================================================================== qual é a função orgânica? */

export interface DadosFuncao {
  est: Estrutura
  funcoes: Funcao[]
  /** família sorteada pelo gerador (conferida contra a detecção feita no grafo) */
  familia: string
}

const CONFUSAO: Record<Funcao, Funcao[]> = {
  hidrocarboneto: ['haleto', 'alcool', 'eter'],
  alcool: ['fenol', 'eter', 'acido'],
  fenol: ['alcool', 'eter', 'acido'],
  eter: ['ester', 'alcool', 'cetona'],
  aldeido: ['cetona', 'acido', 'alcool'],
  cetona: ['aldeido', 'ester', 'eter'],
  acido: ['ester', 'alcool', 'aldeido'],
  ester: ['eter', 'acido', 'cetona'],
  amina: ['amida', 'alcool', 'haleto'],
  amida: ['amina', 'ester', 'acido'],
  haleto: ['alcool', 'hidrocarboneto', 'eter'],
}

function estruturaDe(rng: Rng, f: Funcao, aromatica: boolean): { est: Estrutura; familia: string } {
  if (aromatica) {
    const mapa: Partial<Record<Funcao, AnelSub>> = { fenol: 'OH', amina: 'NH2', hidrocarboneto: 'CH3', acido: 'COOH', aldeido: 'CHO', haleto: 'Cl', eter: 'OCH3' }
    return { est: { anel: mapa[f] ?? null }, familia: `${f}-aromatico` }
  }
  const n = (a: number, b: number) => sortear(rng, a, b)
  switch (f) {
    case 'alcool': {
      const t = n(3, 6)
      return { est: E(comGrupos(t, [OH(n(0, t - 1))])), familia: f }
    }
    case 'aldeido': {
      const t = n(2, 5)
      return { est: E(comGrupos(t, [O(rng() < 0.5 ? 0 : t - 1)])), familia: f }
    }
    case 'cetona': {
      const t = n(4, 6)
      return { est: E(comGrupos(t, [O(n(1, t - 2))])), familia: f }
    }
    case 'acido': {
      const t = n(2, 5)
      const p = rng() < 0.5 ? 0 : t - 1
      return { est: E(comGrupos(t, [O(p), OH(p)])), familia: f }
    }
    case 'ester':
      return { est: E(ester(n(1, 3), n(1, 3))), familia: f }
    case 'eter':
      return { est: E(eter(n(1, 3), n(1, 3))), familia: f }
    case 'amina': {
      const t = n(2, 5)
      return { est: E(comGrupos(t, [NH2(n(0, t - 1))])), familia: f }
    }
    case 'amida':
      return { est: E(amida(n(2, 4))), familia: f }
    case 'haleto': {
      const t = n(2, 5)
      return { est: E(comGrupos(t, [HAL(n(0, t - 1), rng() < 0.5 ? 'Cl' : 'Br')])), familia: f }
    }
    default: {
      const t = n(3, 6)
      const tipo = n(0, 2)
      return { est: E(comGrupos(t, [], tipo === 0 ? undefined : { [n(0, t - 2)]: tipo === 1 ? 2 : 3 })), familia: 'hidrocarboneto' }
    }
  }
}

const BIFUNCIONAIS: { espec: Espec; familia: string }[] = [
  { espec: comGrupos(3, [OH(1), O(2), OH(2)]), familia: 'acido+alcool' },
  { espec: comGrupos(3, [OH(2), O(0), OH(0)]), familia: 'acido+alcool' },
  { espec: comGrupos(2, [NH2(0), O(1), OH(1)]), familia: 'acido+amina' },
  { espec: comGrupos(3, [NH2(1), O(2), OH(2)]), familia: 'acido+amina' },
  { espec: comGrupos(2, [OH(1), O(0)]), familia: 'aldeido+alcool' },
  { espec: comGrupos(3, [NH2(1), O(0)]), familia: 'aldeido+amina' },
  { espec: comGrupos(4, [O(1), OH(3)]), familia: 'cetona+alcool' },
  { espec: comGrupos(3, [NH2(0), O(1)]), familia: 'cetona+amina' },
  { espec: comGrupos(2, [OH(0), HAL(1, 'Cl')]), familia: 'alcool+haleto' },
  { espec: comGrupos(3, [O(0), OH(0), HAL(1, 'Cl')]), familia: 'acido+haleto' },
]

const lista = (fs: Funcao[]) => fs.map((f) => NOME_FUNCAO[f]).join(' e ')
const minusc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export function gerarFuncao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFuncao> {
  const bi = nivel === 3 && rng() < 0.45
  let est: Estrutura
  let familia: string
  if (bi) {
    const b = escolher(rng, BIFUNCIONAIS)
    est = E(b.espec)
    familia = b.familia
  } else {
    const pool: Funcao[] =
      nivel === 1
        ? ['alcool', 'aldeido', 'cetona', 'acido', 'hidrocarboneto']
        : nivel === 2
          ? ['ester', 'eter', 'amina', 'amida', 'haleto', 'alcool', 'cetona', 'aldeido', 'acido']
          : ['fenol', 'amina', 'eter', 'hidrocarboneto', 'acido', 'aldeido', 'haleto']
    const f = escolher(rng, pool)
    const r = estruturaDe(rng, f, nivel === 3)
    est = r.est
    familia = r.familia
  }
  const mol = molDe(est)
  const fs = funcoes(mol)
  const ids = ['A', 'B', 'C', 'D']
  const resolucao = fs.map((f) => `${NOME_FUNCAO[f]}: ${RECONHECER[f]}.`).join(' ')

  let rotulos: string[]
  let certo: string
  if (fs.length === 1) {
    const f = fs[0] as Funcao
    const outros = embaralhar(rng, CONFUSAO[f].filter((x) => x !== f))
    rotulos = embaralhar(rng, [f, ...outros.slice(0, 3)]).map((x) => NOME_FUNCAO[x])
    certo = NOME_FUNCAO[f]
  } else {
    const [a, b] = fs as [Funcao, Funcao]
    const cand: Funcao[][] = [
      [CONFUSAO[a][0] as Funcao, b],
      [a, CONFUSAO[b][0] as Funcao],
      [CONFUSAO[a][1] as Funcao, CONFUSAO[b][1] as Funcao],
      [CONFUSAO[a][1] as Funcao, b],
      [a, CONFUSAO[b][1] as Funcao],
    ].filter((p) => p[0] !== p[1])
    const unicos = new Map<string, Funcao[]>()
    for (const p of cand) unicos.set(p.map((x) => NOME_FUNCAO[x]).join(' e '), p)
    unicos.delete(lista(fs))
    const extras = embaralhar(rng, [...unicos.keys()]).slice(0, 3)
    rotulos = embaralhar(rng, [lista(fs), ...extras])
    certo = lista(fs)
  }
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  rotulos.forEach((r, i) => {
    const id = ids[i] as string
    if (r === certo) {
      certa = id
      porque[id] = `Certo. ${resolucao}`
    } else {
      const nomes = r.split(' e ')
      const detalhes = nomes
        .map((nome) => {
          const f = (Object.keys(NOME_FUNCAO) as Funcao[]).find((x) => NOME_FUNCAO[x] === nome) as Funcao
          return fs.includes(f) ? `${nome} existe aqui (${RECONHECER[f]})` : `${nome} pediria que ${RECONHECER[f]}, e isso não acontece aqui`
        })
        .join('; ')
      porque[id] = `Não. ${detalhes}. A molécula tem: ${minusc(lista(fs))}.`
      const errado = nomes.find((nome) => !fs.map((x) => NOME_FUNCAO[x]).includes(nome)) ?? nomes[0]
      motivo[id] = `confundiu a função: ${errado} no lugar de ${minusc(lista(fs))}`
    }
  })
  return {
    enunciado: bi ? 'Quais funções orgânicas aparecem na molécula representada abaixo?' : 'Qual é a função orgânica da molécula representada abaixo?',
    opcoes: rotulos.map((r, i) => ({ id: ids[i] as string, rotulo: r })),
    certa,
    porque,
    motivo,
    resolucao,
    dicas: [
      'Nas fórmulas de traços, cada vértice e cada ponta é um carbono. Procure os átomos diferentes de C e H: O, N e halogênios.',
      'Olhe como o oxigênio (ou o nitrogênio) está ligado: a um só carbono (–OH), entre dois carbonos (C–O–C) ou com ligação dupla (C=O).',
      'Se há C=O, veja o que está ligado a esse carbono: dois carbonos (cetona), um hidrogênio (aldeído), OH (ácido), O–C (éster), N (amida).',
    ],
    licao: 'A função vem do grupo funcional: –OH em carbono saturado (álcool) ou no anel (fenol); C=O com H (aldeído), entre carbonos (cetona), com OH (ácido), com O–C (éster) ou com N (amida); C–O–C (éter); N sem C=O (amina).',
    dados: { est, funcoes: fs, familia },
  }
}

/* ================================================================== qual é o nome? */

type GrupoNome = 'alcano' | 'eno' | 'ino' | 'alcool' | 'aldeido' | 'cetona' | 'acido' | 'amina' | 'Cl' | 'Br'

interface Desc {
  n: number
  g: GrupoNome
  /** posição do grupo (índice do carbono) ou, para eno/ino, da ligação (índice da ligação) */
  pos: number
  metil: number[]
}

export function especDe(d: Desc): Espec {
  const subs: NonNullable<Espec['subs']> = d.metil.map((m) => ME(m))
  let lig: Espec['lig']
  switch (d.g) {
    case 'eno':
      lig = { [d.pos]: 2 }
      break
    case 'ino':
      lig = { [d.pos]: 3 }
      break
    case 'alcool':
      subs.push(OH(d.pos))
      break
    case 'aldeido':
      subs.push(O(0))
      break
    case 'acido':
      subs.push(O(0), OH(0))
      break
    case 'cetona':
      subs.push(O(d.pos))
      break
    case 'amina':
      subs.push(NH2(d.pos))
      break
    case 'Cl':
    case 'Br':
      subs.push(HAL(d.pos, d.g))
      break
    default:
      break
  }
  return { cadeia: Array(d.n).fill('C'), subs, lig }
}

/** a descrição gera uma molécula com valências corretas, grupos nas posições permitidas e nome calculável? */
function valida(d: Desc): boolean {
  if (d.n < 1) return false
  if (d.g === 'aldeido' || d.g === 'acido') {
    if (d.n < 2) return false
  }
  if (d.g === 'cetona' && (d.pos < 1 || d.pos > d.n - 2)) return false
  if ((d.g === 'eno' || d.g === 'ino') && (d.pos < 0 || d.pos > d.n - 2)) return false
  if (['alcool', 'amina', 'Cl', 'Br'].includes(d.g) && (d.pos < 0 || d.pos > d.n - 1)) return false
  if (d.metil.some((m) => m < 1 || m > d.n - 2)) return false
  const esp = especDe(d)
  const mol = construir(esp)
  if (mol.atomos.some((a) => hidrogenios(mol, a.id) < 0)) return false
  return nomeIUPAC(esp) !== null
}

type Etiqueta = 'numeracao' | 'posicao' | 'funcao' | 'cadeia' | 'ramificacao' | 'inversao' | 'outra-familia'

interface Candidato {
  nome: string
  etiqueta: Etiqueta
  porque: string
  motivo: string
}

const SUFIXO: Record<GrupoNome, string> = {
  alcano: 'alcano (só ligações simples)',
  eno: 'alceno (-eno: ligação dupla)',
  ino: 'alcino (-ino: ligação tripla)',
  alcool: 'álcool (-ol: hidroxila)',
  aldeido: 'aldeído (-al: carbonila na ponta)',
  cetona: 'cetona (-ona: carbonila no meio)',
  acido: 'ácido carboxílico (ácido ...-oico)',
  amina: 'amina (-amina: grupo NH₂)',
  Cl: 'haleto orgânico (prefixo cloro)',
  Br: 'haleto orgânico (prefixo bromo)',
}

const PARA_OUTRA: Record<GrupoNome, GrupoNome[]> = {
  alcano: ['eno'],
  eno: ['ino', 'alcano'],
  ino: ['eno', 'alcano'],
  alcool: ['cetona', 'amina', 'aldeido'],
  aldeido: ['alcool', 'acido', 'cetona'],
  cetona: ['alcool', 'aldeido', 'amina'],
  acido: ['aldeido', 'alcool'],
  amina: ['alcool'],
  Cl: ['Br', 'alcool'],
  Br: ['Cl', 'alcool'],
}

function candidatosNome(d: Desc, correto: string): Candidato[] {
  const saida: Candidato[] = []
  const add = (nome: string | null, c: Omit<Candidato, 'nome'>) => {
    if (nome && nome !== correto && !saida.some((x) => x.nome === nome)) saida.push({ nome, ...c })
  }
  const esp = especDe(d)
  // numeração pela ponta errada
  add(nomeIUPAC(esp, { numeracaoErrada: true }), {
    etiqueta: 'numeracao',
    porque: 'Esse nome vem de numerar a cadeia pela ponta errada. A numeração começa pela ponta que dá o menor número ao grupo principal (OH, C=O, NH₂ ou ligação múltipla) e só depois considera as ramificações.',
    motivo: 'numerou a cadeia pela ponta errada',
  })
  // posição vizinha
  if (['alcool', 'cetona', 'amina', 'Cl', 'Br', 'eno', 'ino'].includes(d.g)) {
    for (const dp of [-1, 1, 2, -2]) {
      const nd = { ...d, pos: d.pos + dp }
      if (valida(nd)) add(nomeIUPAC(especDe(nd)), { etiqueta: 'posicao', porque: `Esse nome descreve outra molécula, com o grupo em outro carbono. Conte os carbonos a partir da ponta mais próxima do grupo e confira em qual deles ele está ligado.`, motivo: 'errou a posição do grupo na cadeia' })
    }
  }
  // outra função
  for (const g of PARA_OUTRA[d.g]) {
    const nd: Desc = { ...d, g, pos: g === 'aldeido' || g === 'acido' ? 0 : g === 'cetona' ? Math.min(Math.max(d.pos, 1), d.n - 2) : d.pos }
    if (valida(nd)) add(nomeIUPAC(especDe(nd)), { etiqueta: 'funcao', porque: `Esse nome tem a terminação de outra função. Aqui o grupo é de ${SUFIXO[d.g]}.`, motivo: 'trocou a terminação (função)' })
  }
  // cadeia com um carbono a mais ou a menos
  for (const dn of [-1, 1]) {
    const n2 = d.n + dn
    for (const pos of [d.pos, 0, n2 - 2, n2 - 1]) {
      const nd = { ...d, n: n2, pos, metil: d.metil.filter((m) => m <= n2 - 2) }
      if (valida(nd)) add(nomeIUPAC(especDe(nd)), { etiqueta: 'cadeia', porque: `Esse nome tem ${nd.n} carbonos na cadeia principal. A molécula desenhada tem ${d.n} carbonos na cadeia principal: conte cada vértice e cada ponta, e lembre que as ramificações não entram na contagem.`, motivo: 'contou errado os carbonos da cadeia principal' })
    }
  }
  // ramificação esquecida
  if (d.metil.length > 0) {
    const nd = { ...d, metil: [] }
    if (valida(nd)) add(nomeIUPAC(especDe(nd)), { etiqueta: 'ramificacao', porque: 'Esse nome ignora a ramificação (o grupo metil) que está pendurado na cadeia. Ramificações entram no nome, como prefixo com o número do carbono onde estão ligadas.', motivo: 'esqueceu a ramificação' })
    const nd2 = { ...d, metil: d.metil.map((m) => (m + 1 <= d.n - 2 ? m + 1 : m - 1)) }
    if (valida(nd2)) add(nomeIUPAC(especDe(nd2)), { etiqueta: 'posicao', porque: 'Esse nome descreve outra molécula, com a ramificação em outro carbono.', motivo: 'errou a posição da ramificação' })
  }
  return saida
}

export interface DadosNome {
  est: Estrutura
  nome: string
  /** família: hidrocarboneto, álcool..., ou éster/éter/amida */
  familia: string
}

function sortearDesc(rng: Rng, nivel: Nivel): Desc {
  for (let tentativas = 0; tentativas < 400; tentativas++) {
    let d: Desc
    if (nivel === 1) {
      const g = escolher(rng, ['alcool', 'aldeido', 'acido', 'eno', 'ino'] as GrupoNome[])
      const n = sortear(rng, 3, 5)
      d = { n, g, metil: [], pos: g === 'eno' || g === 'ino' ? sortear(rng, 0, n - 2) : g === 'alcool' ? sortear(rng, 0, n - 1) : 0 }
    } else if (nivel === 2) {
      const g = escolher(rng, ['cetona', 'amina', 'Cl', 'Br', 'alcool', 'eno'] as GrupoNome[])
      const n = sortear(rng, 4, 6)
      // metade dos casos com o grupo mais perto da outra ponta: a numeração tem de começar pelo outro lado
      const segunda = rng() < 0.6
      const faixa = g === 'cetona' ? [1, n - 2] : g === 'eno' ? [0, n - 2] : [0, n - 1]
      const meio = Math.ceil((faixa[1]! + faixa[0]!) / 2)
      const pos = segunda ? sortear(rng, Math.min(meio + 1, faixa[1]!), faixa[1]!) : sortear(rng, faixa[0]!, faixa[1]!)
      d = { n, g, pos, metil: [] }
    } else {
      const g = escolher(rng, ['alcano', 'alcool', 'eno', 'acido', 'cetona', 'Cl', 'amina', 'aldeido'] as GrupoNome[])
      const n = sortear(rng, 4, 6)
      const qtd = rng() < 0.4 ? 2 : 1
      const metil: number[] = []
      for (let i = 0; i < qtd; i++) metil.push(sortear(rng, 1, n - 2))
      const pos = g === 'eno' ? sortear(rng, 0, n - 2) : g === 'aldeido' || g === 'acido' ? 0 : sortear(rng, g === 'cetona' ? 1 : 0, g === 'cetona' ? n - 2 : n - 1)
      d = { n, g, pos, metil: metil.sort((a, b) => a - b) }
    }
    if (!valida(d)) continue
    // evita enunciados em que as duas numerações dão o mesmo nome (não há o que errar na ponta)
    const esp = especDe(d)
    if (nivel >= 2 && nomeIUPAC(esp) === nomeIUPAC(esp, { numeracaoErrada: true })) continue
    return d
  }
  throw new Error('sem molécula válida')
}

export function gerarNome(rng: Rng, nivel: Nivel): InstanciaMulti<DadosNome> {
  const especial = nivel === 3 && rng() < 0.45
  let est: Estrutura
  let correto: string
  let familia: string
  let candidatos: Candidato[] = []
  let resolucao: string
  const ids = ['A', 'B', 'C', 'D']

  if (especial) {
    const tipo = escolher(rng, ['ester', 'eter', 'amida'] as const)
    if (tipo === 'ester') {
      const a = sortear(rng, 1, 3)
      let b = sortear(rng, 1, 3)
      if (a === b && rng() < 0.5) b = a === 3 ? 2 : a + 1
      est = E(ester(a, b))
      correto = nomeEster(a, b)
      familia = 'éster'
      resolucao = `A carbonila (C=O) com um oxigênio ligado a outro carbono é a marca do éster. A parte do ácido (que tem a carbonila) tem ${a} carbono${a > 1 ? 's' : ''} e dá o nome "${correto.split(' de ')[0]}"; a parte ligada ao oxigênio tem ${b} carbono${b > 1 ? 's' : ''} e dá "${correto.split(' de ')[1]}". Nome: ${correto}.`
      const add = (nome: string, porque: string, motivo: string) => {
        if (nome !== correto && !candidatos.some((c) => c.nome === nome)) candidatos.push({ nome, etiqueta: 'inversao', porque, motivo })
      }
      add(nomeEster(b, a), 'Esse nome troca as partes: o prefixo do nome (-oato) vem da parte que tem a carbonila (a do ácido), e o nome depois de "de" vem da parte ligada ao oxigênio.', 'inverteu as partes do éster')
      add(nomeEster(Math.max(1, a - 1), b), `Esse nome conta um carbono a menos na parte do ácido: a carbonila também é carbono da cadeia (${a} carbonos).`, 'contou errado os carbonos da parte do ácido')
      add(nomeEster(a, Math.min(4, b + 1)), `Esse nome conta um carbono a mais na parte ligada ao oxigênio (são ${b}).`, 'contou errado os carbonos da parte do álcool')
      add(nomeEter(a, b), 'Esse é o nome de um éter. Aqui há carbonila (C=O) ligada ao oxigênio, o que faz da molécula um éster, e não um éter.', 'confundiu éster com éter')
      add(nomeAmida(a + b), 'Esse é o nome de uma amida (que tem nitrogênio). Não há nitrogênio na molécula.', 'confundiu éster com amida')
    } else if (tipo === 'eter') {
      const a = sortear(rng, 1, 3)
      const b = sortear(rng, 1, 3)
      est = E(eter(a, b))
      correto = nomeEter(a, b)
      familia = 'éter'
      const [menor, maior] = a <= b ? [a, b] : [b, a]
      resolucao = `Éter: oxigênio entre dois carbonos. O grupo menor (${menor} carbono${menor > 1 ? 's' : ''}) vira o prefixo "-oxi" e o maior (${maior}) vira o nome da cadeia: ${correto}.`
      const add = (nome: string, porque: string, motivo: string) => {
        if (nome !== correto && !candidatos.some((c) => c.nome === nome)) candidatos.push({ nome, etiqueta: 'cadeia', porque, motivo })
      }
      add(nomeEter(menor, Math.min(4, maior + 1)), `Esse nome tem um carbono a mais no grupo maior (são ${maior}).`, 'contou errado os carbonos do éter')
      add(nomeEter(Math.max(1, menor - 1), maior), `Esse nome tem um carbono a menos no grupo menor (são ${menor}).`, 'contou errado os carbonos do éter')
      add(nomeEster(Math.max(1, menor), maior), 'Esse é o nome de um éster. Não há carbonila (C=O) na molécula.', 'confundiu éter com éster')
      for (let i = 1; i <= Math.floor((menor + maior) / 2); i++) add(nomeEter(i, menor + maior - i), 'Esse nome distribui os carbonos de outro jeito entre os dois lados do oxigênio. Conte quantos carbonos há de cada lado do O.', 'distribuiu mal os carbonos nos dois lados do oxigênio')
      const alcool = nomeIUPAC(comGrupos(menor + maior, [OH(0)]))
      if (alcool) add(alcool, 'Esse é o nome de um álcool (grupo –OH). Aqui não há hidroxila: o oxigênio está entre dois carbonos, o que caracteriza um éter.', 'confundiu éter com álcool')
    } else {
      const n = sortear(rng, 2, 4)
      est = E(amida(n))
      correto = nomeAmida(n)
      familia = 'amida'
      resolucao = `Amida: carbonila (C=O) ligada diretamente a um nitrogênio. A cadeia tem ${n} carbonos (contando o da carbonila): ${correto}.`
      const add = (nome: string, porque: string, motivo: string) => {
        if (nome !== correto && !candidatos.some((c) => c.nome === nome)) candidatos.push({ nome, etiqueta: 'cadeia', porque, motivo })
      }
      add(nomeAmida(n + 1), `Esse nome tem ${n + 1} carbonos. A cadeia desenhada tem ${n}, contando o carbono da carbonila.`, 'contou errado os carbonos da cadeia')
      add(nomeAmida(Math.max(1, n - 1)), `Esse nome tem ${n - 1} carbono(s). Falta contar o carbono da carbonila.`, 'esqueceu o carbono da carbonila')
      const aminaEsp = comGrupos(n, [NH2(n - 1)])
      const nomeAmina = nomeIUPAC(aminaEsp)
      if (nomeAmina) candidatos.push({ nome: nomeAmina, etiqueta: 'funcao', porque: 'Esse é o nome de uma amina, em que o nitrogênio não está ligado a uma carbonila. Aqui há C=O ligado ao N.', motivo: 'confundiu amida com amina' })
      const acido = nomeIUPAC(comGrupos(n, [O(0), OH(0)]))
      if (acido) candidatos.push({ nome: acido, etiqueta: 'funcao', porque: 'Esse é o nome de um ácido carboxílico (C=O e OH no mesmo carbono). Aqui o carbono da carbonila liga-se a um nitrogênio.', motivo: 'confundiu amida com ácido' })
    }
  } else {
    const d = sortearDesc(rng, nivel)
    const esp = especDe(d)
    est = E(esp)
    correto = nomeIUPAC(esp) as string
    familia = d.g
    candidatos = candidatosNome(d, correto)
    const ramif = d.metil.length ? ` Ramificação: ${d.metil.length === 1 ? 'um grupo metil' : 'dois grupos metil'}.` : ''
    resolucao = `Cadeia principal com ${d.n} carbono${d.n > 1 ? 's' : ''} (${['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'][d.n]}-). ${d.g === 'alcano' ? 'Só ligações simples (-ano).' : `Grupo principal: ${SUFIXO[d.g]}.`}${ramif} Numera-se a cadeia pela ponta que dá o menor número ao grupo principal e depois às ramificações. Nome: ${correto}.`
  }
  const escolhidos = embaralhar(rng, candidatos).slice(0, 3)
  // garante variedade: prefere etiquetas diferentes quando há muitos candidatos
  if (candidatos.length > 3) {
    const vistos = new Set<Etiqueta>()
    const variados = embaralhar(rng, candidatos).filter((c) => (vistos.has(c.etiqueta) ? false : (vistos.add(c.etiqueta), true)))
    const resto = embaralhar(rng, candidatos).filter((c) => !variados.includes(c))
    escolhidos.splice(0, escolhidos.length, ...[...variados, ...resto].slice(0, 3))
  }
  const todas = embaralhar(rng, [{ nome: correto, ok: true }, ...escolhidos.map((c) => ({ nome: c.nome, ok: false, c }))])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  todas.forEach((o, i) => {
    const id = ids[i] as string
    if (o.ok) {
      certa = id
      porque[id] = `Certo. ${resolucao}`
    } else {
      const c = (o as { c: Candidato }).c
      porque[id] = c.porque
      motivo[id] = c.motivo
    }
  })
  return {
    enunciado: 'Qual é o nome (IUPAC) da substância representada abaixo?',
    opcoes: todas.map((o, i) => ({ id: ids[i] as string, rotulo: o.nome })),
    certa,
    porque,
    motivo,
    resolucao,
    dicas: [
      'Conte os carbonos da cadeia principal: ela precisa conter o grupo funcional e ser a mais longa. Cada vértice e cada ponta é um carbono.',
      'O prefixo vem do número de carbonos: met (1), et (2), prop (3), but (4), pent (5), hex (6). A terminação vem da função: -ano, -eno, -ino, -ol, -al, -ona, -oico.',
      'Numere a cadeia pela ponta que dá o menor número ao grupo principal. O número entra no nome (por exemplo butan-2-ol) e as ramificações vêm antes, com seu número.',
    ],
    licao: 'Nome = ramificações (com números) + prefixo do nº de carbonos + infixo (an, en, in) + terminação da função; numere pela ponta que dá o menor número ao grupo principal.',
    dados: { est, nome: correto, familia },
  }
}

/* ================================================================== isomeria */

export type TipoIsomeria = 'cadeia' | 'posicao' | 'funcao' | 'compensacao' | 'geometrica' | 'nao'

export interface DadosIsomeria {
  a: Estrutura
  b: Estrutura
  tipo: TipoIsomeria
}

const cl = (n: number) => HAL(n, 'Cl')
const PARES: Record<TipoIsomeria, [Estrutura, Estrutura][]> = {
  cadeia: [
    [E(alcano(4)), E(comGrupos(3, [ME(1)]))],
    [E(alcano(5)), E(comGrupos(4, [ME(1)]))],
    [E(comGrupos(4, [ME(1)])), E(comGrupos(3, [ME(1), ME(1)]))],
    [E(alcano(6)), E(comGrupos(5, [ME(1)]))],
    [E(comGrupos(4, [OH(0)])), E(comGrupos(3, [OH(0), ME(1)]))],
    [E(comGrupos(4, [], { 0: 2 })), E(comGrupos(3, [ME(1)], { 0: 2 }))],
    [E(comGrupos(4, [O(0), OH(0)])), E(comGrupos(3, [O(0), OH(0), ME(1)]))],
    [E(comGrupos(4, [O(0)])), E(comGrupos(3, [O(0), ME(1)]))],
    [E(comGrupos(5, [OH(0)])), E(comGrupos(4, [OH(0), ME(2)]))],
  ],
  posicao: [
    [E(comGrupos(4, [OH(0)])), E(comGrupos(4, [OH(1)]))],
    [E(comGrupos(3, [OH(0)])), E(comGrupos(3, [OH(1)]))],
    [E(comGrupos(5, [OH(1)])), E(comGrupos(5, [OH(2)]))],
    [E(comGrupos(4, [], { 0: 2 })), E(comGrupos(4, [], { 1: 2 }))],
    [E(comGrupos(5, [], { 0: 2 })), E(comGrupos(5, [], { 1: 2 }))],
    [E(comGrupos(5, [ME(1)])), E(comGrupos(5, [ME(2)]))],
    [E(comGrupos(4, [cl(0)])), E(comGrupos(4, [cl(1)]))],
    [E(comGrupos(3, [NH2(0)])), E(comGrupos(3, [NH2(1)]))],
    [E(comGrupos(5, [], { 0: 3 })), E(comGrupos(5, [], { 1: 3 }))],
    [E(comGrupos(3, [OH(0), ME(1)])), E(comGrupos(3, [OH(1), ME(1)]))],
  ],
  funcao: [
    [E(comGrupos(2, [OH(0)])), E(eter(1, 1))],
    [E(comGrupos(3, [OH(0)])), E(eter(1, 2))],
    [E(comGrupos(3, [OH(1)])), E(eter(1, 2))],
    [E(comGrupos(4, [OH(0)])), E(eter(2, 2))],
    [E(comGrupos(3, [O(0)])), E(comGrupos(3, [O(1)]))],
    [E(comGrupos(4, [O(0)])), E(comGrupos(4, [O(1)]))],
    [E(comGrupos(2, [O(0), OH(0)])), E(ester(1, 1))],
    [E(comGrupos(3, [O(0), OH(0)])), E(ester(2, 1))],
    [E(comGrupos(3, [O(0), OH(0)])), E(ester(1, 2))],
  ],
  compensacao: [
    [E(eter(1, 3)), E(eter(2, 2))],
    [E(eter(1, 4)), E(eter(2, 3))],
    [E(ester(2, 2)), E(ester(3, 1))],
    [E(ester(1, 3)), E(ester(2, 2))],
  ],
  geometrica: [
    [E({ ...comGrupos(4, [], { 1: 2 }), cis: true }), E({ ...comGrupos(4, [], { 1: 2 }), cis: false })],
    [E({ cadeia: ['C', 'C'], lig: { 0: 2 }, subs: [{ no: 0, g: 'Cl', lado: 1 }, { no: 1, g: 'Cl', lado: 1 }] }), E({ cadeia: ['C', 'C'], lig: { 0: 2 }, subs: [{ no: 0, g: 'Cl', lado: 1 }, { no: 1, g: 'Cl', lado: -1 }] })],
  ],
  nao: [
    [E(alcano(4)), E(comGrupos(4, [], { 0: 2 }))],
    [E(alcano(5)), E(alcano(6))],
    [E(comGrupos(2, [OH(0)])), E(comGrupos(2, [O(0), OH(0)]))],
    [E(comGrupos(3, [OH(0)])), E(comGrupos(3, [O(0)]))],
    [E(comGrupos(4, [OH(1)])), E(comGrupos(4, [O(1)]))],
    [E(comGrupos(4, [OH(1)])), E(comGrupos(5, [OH(1)]))],
  ],
}
export const TODOS_OS_PARES = PARES

export const NOME_TIPO: Record<TipoIsomeria, string> = {
  cadeia: 'Isomeria de cadeia',
  posicao: 'Isomeria de posição',
  funcao: 'Isomeria de função',
  compensacao: 'Isomeria de compensação (metameria)',
  geometrica: 'Isomeria geométrica (cis-trans)',
  nao: 'Não são isômeros',
}

export const DEFINICAO: Record<TipoIsomeria, string> = {
  cadeia: 'Isomeria de cadeia ocorre quando as duas substâncias têm a mesma função, mas esqueletos de carbono diferentes (por exemplo, um linear e outro ramificado).',
  posicao: 'Isomeria de posição ocorre quando a cadeia e a função são as mesmas e só muda a posição do grupo funcional, da insaturação ou da ramificação.',
  funcao: 'Isomeria de função ocorre quando as substâncias têm a mesma fórmula molecular, mas funções orgânicas diferentes (álcool e éter, aldeído e cetona, ácido e éster).',
  compensacao: 'Isomeria de compensação (metameria) ocorre quando a função é a mesma e o heteroátomo (O ou N) fica em posição diferente, dividindo a cadeia em partes de tamanhos diferentes.',
  geometrica: 'Isomeria geométrica ocorre em torno de ligação dupla (ou anel): grupos iguais do mesmo lado (cis) ou de lados opostos (trans), com a mesma sequência de ligações.',
  nao: 'Substâncias só são isômeras se tiverem a mesma fórmula molecular.',
}

/** tamanhos dos grupos de cada lado do oxigênio, para éteres e ésteres lineares */
function ladosDoOxigenio(m: Molecula): number[] {
  const o = m.atomos.find((a) => a.el === 'O' && m.ligacoes.filter((l) => l.a === a.id || l.b === a.id).length === 2)
  if (!o) return []
  const vizinhosC = m.ligacoes.filter((l) => l.a === o.id || l.b === o.id).map((l) => (l.a === o.id ? l.b : l.a))
  return vizinhosC
    .map((c) => {
      const visto = new Set<number>([o.id])
      const pilha = [c]
      let qtd = 0
      while (pilha.length) {
        const x = pilha.pop() as number
        if (visto.has(x)) continue
        visto.add(x)
        if ((m.atomos[x] as { el: string }).el === 'C') qtd++
        for (const l of m.ligacoes) {
          if (l.a === x && !visto.has(l.b)) pilha.push(l.b)
          if (l.b === x && !visto.has(l.a)) pilha.push(l.a)
        }
      }
      return qtd
    })
    .sort((a, b) => a - b)
}

function fato(par: DadosIsomeria): string {
  const ma = molDe(par.a)
  const mb = molDe(par.b)
  const fa = formulaMolecular(ma)
  const fb = formulaMolecular(mb)
  switch (par.tipo) {
    case 'cadeia':
      return `Mesma fórmula (${fa}) e mesma função (${minusc(lista(funcoes(ma)))}), mas esqueletos diferentes: a maior cadeia de carbonos tem ${maiorCadeia(ma)} átomos numa estrutura e ${maiorCadeia(mb)} na outra.`
    case 'posicao':
      return `Mesma fórmula (${fa}), mesma função e mesma cadeia principal; só muda o carbono onde está o grupo (ou a insaturação, ou a ramificação).`
    case 'funcao':
      return `Mesma fórmula (${fa}), mas funções diferentes: ${minusc(lista(funcoes(ma)))} numa estrutura e ${minusc(lista(funcoes(mb)))} na outra.`
    case 'compensacao':
      return `Mesma fórmula (${fa}) e mesma função (${minusc(lista(funcoes(ma)))}); o oxigênio divide a cadeia em partes de tamanhos diferentes (${ladosDoOxigenio(ma).join(' e ')} carbonos numa, ${ladosDoOxigenio(mb).join(' e ')} na outra).`
    case 'geometrica':
      return `Mesma fórmula (${fa}) e mesma sequência de ligações; só muda o arranjo no espaço em torno da ligação dupla: grupos iguais do mesmo lado (cis) ou de lados opostos (trans).`
    default:
      return `As fórmulas moleculares são diferentes: ${fa} e ${fb}. Isômeros têm de ter a mesma fórmula.`
  }
}

export function gerarIsomeria(rng: Rng, nivel: Nivel): InstanciaMulti<DadosIsomeria> {
  const tipos: TipoIsomeria[] = nivel === 1 ? ['cadeia', 'posicao', 'cadeia', 'posicao', 'nao'] : nivel === 2 ? ['cadeia', 'posicao', 'funcao', 'funcao', 'nao'] : ['funcao', 'compensacao', 'geometrica', 'compensacao', 'geometrica', 'posicao', 'nao']
  const tipo = escolher(rng, tipos)
  const [x, y] = escolher(rng, PARES[tipo])
  const trocar = rng() < 0.5
  const par: DadosIsomeria = { a: trocar ? y : x, b: trocar ? x : y, tipo }
  const todos = Object.keys(NOME_TIPO) as TipoIsomeria[]
  // as alternativas: a certa, "não são isômeros" e duas outras
  const outros = embaralhar(rng, todos.filter((t) => t !== tipo && t !== 'nao'))
  const conjunto = tipo === 'nao' ? [tipo, ...outros.slice(0, 3)] : [tipo, 'nao' as TipoIsomeria, ...outros.slice(0, 2)]
  const ordem = embaralhar(rng, conjunto)
  const ids = ['A', 'B', 'C', 'D']
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  const explicacaoCerta = fato(par)
  ordem.forEach((t, i) => {
    const id = ids[i] as string
    if (t === tipo) {
      certa = id
      porque[id] = `Certo. ${DEFINICAO[t]} ${explicacaoCerta}`
    } else {
      porque[id] = `Não. ${DEFINICAO[t]} Aqui, porém: ${explicacaoCerta}`
      motivo[id] = `confundiu ${minusc(NOME_TIPO[tipo])} com ${minusc(NOME_TIPO[t])}`
    }
  })
  return {
    enunciado: 'Que relação existe entre as duas substâncias representadas abaixo?',
    opcoes: ordem.map((t, i) => ({ id: ids[i] as string, rotulo: NOME_TIPO[t] })),
    certa,
    porque,
    motivo,
    resolucao: `${NOME_TIPO[tipo]}. ${explicacaoCerta}`,
    dicas: [
      'Primeiro confira se as fórmulas moleculares são iguais (conte os C e os H de cada uma). Se forem diferentes, não são isômeros.',
      'Se as fórmulas são iguais, compare as funções: funções diferentes indicam isomeria de função.',
      'Com a mesma função, veja se o esqueleto de carbonos é o mesmo (cadeia) ou se só muda a posição de um grupo (posição). Em torno de uma ligação dupla, grupos de lados diferentes são cis-trans.',
    ],
    licao: 'Isômeros têm a mesma fórmula molecular. Depois compare: função diferente → função; cadeia diferente → cadeia; só a posição muda → posição; heteroátomo dividindo a cadeia → compensação; cis/trans em ligação dupla → geométrica.',
    dados: par,
  }
}

/* ================================================================== contar átomos e carbonos */

export interface DadosContagem {
  est: Estrutura
  variante: 'H' | 'classe' | 'quirais'
  classe?: Classe
}

function especAleatoria(rng: Rng, nivel: Nivel): Espec {
  for (let t = 0; t < 400; t++) {
    const n = sortear(rng, nivel === 1 ? 4 : 5, nivel === 1 ? 7 : 7)
    const subs: NonNullable<Espec['subs']> = []
    const usados = new Set<number>()
    const poe = (g: Sub, no: number) => {
      subs.push({ no, g })
      usados.add(no)
    }
    const k = sortear(rng, 1, nivel === 3 ? 3 : 2)
    for (let i = 0; i < k; i++) {
      const g = escolher(rng, (nivel === 1 ? ['OH', 'CH3', 'Cl', '=O', 'NH2'] : nivel === 2 ? ['CH3', 'CH3', 'CH3', 'OH'] : ['CH3', 'OH', 'Cl', 'Br', 'NH2']) as Sub[])
      if (g === '=O') {
        const no = sortear(rng, 1, n - 2)
        if (!usados.has(no)) poe(g, no)
      } else if (g === 'CH3') poe(g, sortear(rng, 1, n - 2))
      else poe(g, sortear(rng, 0, n - 1))
    }
    const lig = nivel === 1 && rng() < 0.4 ? { [sortear(rng, 0, n - 2)]: 2 as const } : undefined
    const esp: Espec = { cadeia: Array(n).fill('C'), subs, lig }
    const m = construir(esp)
    if (m.atomos.every((a) => hidrogenios(m, a.id) >= 0)) return esp
  }
  return alcano(5)
}

export function gerarContagem(rng: Rng, nivel: Nivel): InstanciaNum<DadosContagem> {
  const variante: DadosContagem['variante'] = nivel === 1 ? 'H' : nivel === 2 ? 'classe' : 'quirais'
  let esp: Espec = alcano(5)
  let classe: Classe | undefined
  if (variante === 'quirais') {
    const alvo = escolher(rng, [0, 1, 1, 1, 2, 2])
    for (let t = 0; t < 600; t++) {
      esp = especAleatoria(rng, 3)
      if (carbonosQuirais(construir(esp)).length === alvo) break
    }
  } else if (variante === 'classe') {
    for (let t = 0; t < 400; t++) {
      esp = especAleatoria(rng, 2)
      const c = contarClasses(construir(esp))
      const possiveis = (['primario', 'secundario', 'terciario', 'quaternario'] as Classe[]).filter((k) => c[k] >= 1 && (k !== 'quaternario' || rng() < 0.6))
      if (possiveis.length >= 3 && c.terciario + c.quaternario >= 1) {
        classe = escolher(rng, possiveis)
        break
      }
    }
    classe ??= 'secundario'
  } else esp = especAleatoria(rng, 1)
  const mol = construir(esp)
  const C = mol.atomos.filter((a) => a.el === 'C')
  const nC = C.length
  const hTotal = mol.atomos.reduce((s, a) => s + hidrogenios(mol, a.id), 0)
  const cls = contarClasses(mol)
  const NOME_CLASSE: Record<Classe, string> = { isolado: 'isolados', primario: 'primários', secundario: 'secundários', terciario: 'terciários', quaternario: 'quaternários' }
  let enunciado: string
  let resposta: number
  let erros: ErroTipico[]
  let resolucao: string
  let licao: string
  let dicas: string[]
  if (variante === 'H') {
    resposta = hTotal
    const hHeteros = mol.atomos.filter((a) => a.el !== 'C').reduce((s, a) => s + hidrogenios(mol, a.id), 0)
    const hPrimarios = mol.atomos.filter((a) => a.el === 'C' && vizinhosC(mol, a.id) === 1).reduce((s, a) => s + hidrogenios(mol, a.id), 0)
    enunciado = 'Na fórmula de traços abaixo, cada vértice e cada ponta é um carbono, e cada carbono completa quatro ligações com hidrogênios. Quantos átomos de hidrogênio há em cada molécula?'
    erros = [
      { valor: hHeteros, frase: `${hHeteros} é só o número de H escritos nos heteroátomos (O, N). Falta contar os hidrogênios dos carbonos, que não aparecem desenhados.`, motivo: 'contou só os H escritos no desenho' },
      { valor: 2 * nC + 2, frase: `${2 * nC + 2} seria o número de H de um alcano com ${nC} carbonos (2n + 2). Aqui há grupos ou ligações duplas que mudam esse número.`, motivo: 'usou a fórmula do alcano sem corrigir' },
      { valor: nC, frase: `${nC} é o número de carbonos, não o de hidrogênios.`, motivo: 'contou carbonos em vez de hidrogênios' },
      { valor: hPrimarios, frase: 'Você contou só os hidrogênios das pontas (CH₃). Cada carbono do meio também tem H.', motivo: 'contou só os H das pontas' },
    ]
    resolucao = `Para cada carbono, 4 menos o número de ligações desenhadas. Somando: ${C.map((a) => hidrogenios(mol, a.id)).join(' + ')}${hHeteros ? ` (nos carbonos) + ${hHeteros} (em O/N)` : ''} = ${hTotal}. Fórmula molecular: ${formulaMolecular(mol)}.`
    licao = 'Hidrogênios implícitos: cada carbono tem 4 ligações no total; os H ocupam as que faltam. Ligações duplas e triplas contam 2 e 3.'
    dicas = ['Cada carbono completa 4 ligações. Conte as ligações que já aparecem desenhadas em cada vértice.', 'Uma ligação dupla conta como duas; os H ocupam o que falta para 4.', 'Some os H de todos os carbonos e depois os H escritos em O ou N.']
  } else if (variante === 'classe') {
    const k = classe as Classe
    resposta = cls[k]
    const outros = (['primario', 'secundario', 'terciario', 'quaternario'] as Classe[]).filter((x) => x !== k)
    enunciado = `Quantos carbonos ${NOME_CLASSE[k]} há na molécula? (Carbono primário está ligado a 1 outro carbono; secundário, a 2; terciário, a 3; quaternário, a 4.)`
    erros = [
      ...outros.map((o) => ({ valor: cls[o], frase: `${cls[o]} é o número de carbonos ${NOME_CLASSE[o]}. A classificação depende de quantos carbonos estão ligados ao carbono: ${k === 'primario' ? '1' : k === 'secundario' ? '2' : k === 'terciario' ? '3' : '4'} para ${NOME_CLASSE[k]}.`, motivo: `contou os carbonos ${NOME_CLASSE[o]}` })),
      { valor: nC, frase: `${nC} é o total de carbonos da molécula. Conte só os ${NOME_CLASSE[k]}.`, motivo: 'contou todos os carbonos' },
      { valor: resposta + 1, frase: 'Você contou um carbono a mais. Só entram os que têm exatamente o número de vizinhos carbono da classe pedida (o oxigênio e os halogênios não contam).', motivo: 'contou também um carbono de outra classe' },
    ]
    resolucao = `Contando os carbonos ligados a cada carbono: primários ${cls.primario}, secundários ${cls.secundario}, terciários ${cls.terciario}, quaternários ${cls.quaternario}. Os ${NOME_CLASSE[k]} são ${resposta}. (Só carbonos vizinhos contam; O, N e halogênios não.)`
    licao = 'A classe do carbono depende só de quantos carbonos estão ligados a ele: 1 = primário, 2 = secundário, 3 = terciário, 4 = quaternário.'
    dicas = ['Para cada carbono, conte quantos OUTROS carbonos estão ligados a ele (ignore O, N e halogênios).', 'Ponta de cadeia costuma ter um só vizinho carbono (primário).', 'Marque cada carbono com a classe e depois conte só os da classe pedida.']
  } else {
    const q = carbonosQuirais(mol)
    resposta = q.length
    const comGrupo = C.filter((a) => vizinhosHetero(mol, a.id) > 0 || vizinhosC(mol, a.id) >= 3).length
    enunciado = 'Quantos carbonos quirais (assimétricos: com quatro grupos diferentes ligados) há na molécula representada abaixo?'
    erros = [
      { valor: comGrupo, frase: 'Você contou os carbonos que têm algum grupo ligado (OH, halogênio, ramificação). Isso não basta: os quatro grupos ligados ao carbono precisam ser diferentes entre si.', motivo: 'contou carbonos com substituinte, sem comparar os quatro grupos' },
      { valor: cls.terciario, frase: 'Você contou os carbonos terciários. Carbono quiral é outra coisa: os quatro grupos ligados a ele precisam ser diferentes (H também conta como grupo).', motivo: 'confundiu carbono terciário com quiral' },
      { valor: resposta + 1, frase: 'Você contou um carbono a mais. Compare os quatro grupos de cada carbono candidato: dois grupos iguais (por exemplo, duas pontas CH₃ ou duas cadeias de mesmo tamanho) tiram a quiralidade.', motivo: 'contou um carbono com grupos repetidos' },
      { valor: Math.max(0, resposta - 1), frase: 'Você contou um carbono a menos. Lembre que o hidrogênio também é um dos grupos: um carbono com H, e três outros grupos diferentes, é quiral.', motivo: 'esqueceu que H é um dos quatro grupos' },
      { valor: 0, frase: 'Há pelo menos um carbono com quatro grupos diferentes: verifique os que têm substituintes.', motivo: 'não achou nenhum carbono quiral' },
      { valor: 2, frase: 'Compare, para cada carbono candidato, os quatro grupos ligados a ele; é provável que algum deles tenha dois grupos iguais.', motivo: 'contou carbonos demais' },
    ]
    resolucao = q.length === 0 ? 'Nenhum carbono tem quatro grupos diferentes: em cada candidato aparecem dois grupos iguais (ou o carbono tem ligação dupla, que o impede de ser quiral).' : `Carbonos com quatro grupos diferentes (contando o H): ${q.length}. Em cada um deles, os quatro grupos ligados (incluindo o hidrogênio implícito) são todos distintos.`
    licao = 'Carbono quiral: sp3 (só ligações simples) e com quatro grupos diferentes ligados, contando o hidrogênio.'
    dicas = ['Só carbonos com ligações simples podem ser quirais.', 'Para cada candidato, liste os quatro grupos (o hidrogênio implícito conta). Se dois forem iguais, não é quiral.', 'Dois grupos podem parecer diferentes no início e ser iguais mais adiante: compare as cadeias inteiras.']
  }
  return { enunciado, resposta, tolerancia: 0.01, unidade: variante === 'H' ? 'átomos de H' : 'carbonos', erros: limpar(erros, resposta), resolucao, dicas, licao, dados: { est: E(esp), variante, classe } }
}

function vizinhosC(m: Molecula, id: number): number {
  return m.ligacoes.filter((l) => (l.a === id || l.b === id) && m.atomos[l.a === id ? l.b : l.a]!.el === 'C').length
}
function vizinhosHetero(m: Molecula, id: number): number {
  return m.ligacoes.filter((l) => (l.a === id || l.b === id) && m.atomos[l.a === id ? l.b : l.a]!.el !== 'C').length
}
