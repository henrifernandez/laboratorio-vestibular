/**
 * Moléculas orgânicas como grafos: átomos com coordenadas (para desenhar) e ligações.
 * A fórmula, as funções, as classes de carbono e a quiralidade são calculadas a partir do grafo.
 */

export type Elemento = 'C' | 'O' | 'N' | 'F' | 'Cl' | 'Br'

export interface Atomo {
  id: number
  el: Elemento
  x: number
  y: number
  /** átomo do anel aromático */
  arom?: boolean
}

export interface Ligacao {
  a: number
  b: number
  ordem: 1 | 2 | 3
  /** ligação do anel aromático (desenhada com o círculo interno) */
  arom?: boolean
}

export interface Molecula {
  atomos: Atomo[]
  ligacoes: Ligacao[]
  /** caixa que contém o desenho */
  largura: number
  altura: number
}

/** Grupos que se penduram na cadeia principal. */
export type Sub = 'OH' | '=O' | 'CH3' | 'Cl' | 'Br' | 'F' | 'NH2'

export interface Espec {
  /** átomos da cadeia, em sequência (C, e O ou N quando o heteroátomo está no meio ou na ponta) */
  cadeia: ('C' | 'O' | 'N')[]
  /** ordem das ligações duplas e triplas, pelo índice da ligação entre cadeia[i] e cadeia[i+1] */
  lig?: Record<number, 2 | 3>
  subs?: { no: number; g: Sub; /** +1 = para cima, -1 = para baixo (força o lado do desenho) */ lado?: 1 | -1 }[]
  /** disposição da ligação dupla central de um alceno de 4 carbonos: cis ou trans */
  cis?: boolean
}

const COMPRIMENTO = 30
const VALENCIA: Record<Elemento, number> = { C: 4, O: 2, N: 3, F: 1, Cl: 1, Br: 1 }
const GRAU = Math.PI / 180

/** menor distância angular entre duas direções (0 a π) */
function distAng(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI)
  return d > Math.PI ? 2 * Math.PI - d : d
}

/** Escolhe `n` direções (múltiplos de 30°) que ficam o mais longe possível das já ocupadas e entre si. */
function direcoesLivres(ocupadas: number[], n: number, lado: (1 | -1 | undefined)[] = []): number[] {
  const candidatas = Array.from({ length: 12 }, (_, k) => k * 30 * GRAU).filter((c) => !ocupadas.some((o) => distAng(o, c) < 1e-6))
  let melhor: number[] = []
  let melhorPontos = -1
  const busca = (atuais: number[]) => {
    if (atuais.length === n) {
      const ladoOk = atuais.every((ang, i) => lado[i] === undefined || (Math.abs(Math.sin(ang)) > 0.2 && Math.sign(-Math.sin(ang)) === lado[i]))
      if (!ladoOk) return
      const todas = [...ocupadas, ...atuais]
      let min = Infinity
      for (let i = 0; i < todas.length; i++) for (let j = i + 1; j < todas.length; j++) min = Math.min(min, distAng(todas[i] as number, todas[j] as number))
      // desempate: prefere ligações que apontam para cima ou para baixo
      const pontos = min + atuais.reduce((acc, ang) => acc + Math.abs(Math.sin(ang)), 0) * 1e-3
      if (pontos > melhorPontos) {
        melhorPontos = pontos
        melhor = [...atuais]
      }
      return
    }
    for (const c of candidatas) if (!atuais.includes(c)) busca([...atuais, c])
  }
  if (n > 0) busca([])
  return melhor
}

/** Constrói a molécula a partir da especificação da cadeia, com desenho em zigue-zague. */
export function construir(espec: Espec): Molecula {
  const atomos: Atomo[] = []
  const ligacoes: Ligacao[] = []
  const passoX = COMPRIMENTO * Math.cos(30 * GRAU)
  const passoY = COMPRIMENTO * Math.sin(30 * GRAU)
  espec.cadeia.forEach((el, i) => atomos.push({ id: i, el, x: i * passoX, y: i % 2 === 0 ? 0 : passoY }))
  for (let i = 0; i < espec.cadeia.length - 1; i++) ligacoes.push({ a: i, b: i + 1, ordem: espec.lig?.[i] ?? 1 })

  // alceno cis: reflete o último átomo em relação ao eixo da ligação dupla
  if (espec.cis !== undefined && espec.cadeia.length === 4 && espec.lig?.[1] === 2 && espec.cis) {
    const [, b, c, d] = atomos as [Atomo, Atomo, Atomo, Atomo]
    const vx = c.x - b.x
    const vy = c.y - b.y
    const t = ((d.x - b.x) * vx + (d.y - b.y) * vy) / (vx * vx + vy * vy)
    const px = b.x + t * vx
    const py = b.y + t * vy
    d.x = 2 * px - d.x
    d.y = 2 * py - d.y
  }

  const novoId = () => atomos.length
  const angulosEm = (id: number) =>
    ligacoes
      .filter((l) => l.a === id || l.b === id)
      .map((l) => {
        const outro = atomos[l.a === id ? l.b : l.a] as Atomo
        const eu = atomos[id] as Atomo
        return Math.atan2(outro.y - eu.y, outro.x - eu.x)
      })

  const porNo = new Map<number, NonNullable<Espec['subs']>>()
  for (const s of espec.subs ?? []) porNo.set(s.no, [...(porNo.get(s.no) ?? []), s])
  for (const [no, lista] of porNo) {
    const eu = atomos[no] as Atomo
    const dirs = direcoesLivres(angulosEm(no), lista.length, lista.map((s) => s.lado))
    lista.forEach((s, k) => {
      const ang = dirs[k] as number
      const el: Elemento = s.g === 'OH' || s.g === '=O' ? 'O' : s.g === 'NH2' ? 'N' : s.g === 'CH3' ? 'C' : (s.g as Elemento)
      const id = novoId()
      atomos.push({ id, el, x: eu.x + COMPRIMENTO * Math.cos(ang), y: eu.y + COMPRIMENTO * Math.sin(ang) })
      ligacoes.push({ a: no, b: id, ordem: s.g === '=O' ? 2 : 1 })
    })
  }
  return enquadrar({ atomos, ligacoes, largura: 0, altura: 0 })
}

/** Anel de benzeno com um substituinte (para fenol, anilina, tolueno...). */
export function construirAnel(sub?: 'OH' | 'NH2' | 'CH3' | 'Cl' | 'COOH' | 'CHO' | 'OCH3'): Molecula {
  const atomos: Atomo[] = []
  const ligacoes: Ligacao[] = []
  const R = COMPRIMENTO
  for (let i = 0; i < 6; i++) {
    const ang = (-90 + 60 * i) * GRAU
    atomos.push({ id: i, el: 'C', x: R * Math.cos(ang), y: R * Math.sin(ang), arom: true })
  }
  for (let i = 0; i < 6; i++) ligacoes.push({ a: i, b: (i + 1) % 6, ordem: i % 2 === 0 ? 2 : 1, arom: true })
  const topo = atomos[0] as Atomo
  const liga = (el: Elemento, dx: number, dy: number, de: number, ordem: 1 | 2 = 1): number => {
    const origem = atomos[de] as Atomo
    const id = atomos.length
    atomos.push({ id, el, x: origem.x + dx, y: origem.y + dy })
    ligacoes.push({ a: de, b: id, ordem })
    return id
  }
  const L = COMPRIMENTO
  if (sub === 'OH') liga('O', 0, -L, 0)
  else if (sub === 'NH2') liga('N', 0, -L, 0)
  else if (sub === 'CH3') liga('C', 0, -L, 0)
  else if (sub === 'Cl') liga('Cl', 0, -L, 0)
  else if (sub === 'COOH' || sub === 'CHO') {
    const c = liga('C', 0, -L, 0)
    liga('O', -L * Math.cos(30 * GRAU), -L * Math.sin(30 * GRAU), c, 2)
    if (sub === 'COOH') liga('O', L * Math.cos(30 * GRAU), -L * Math.sin(30 * GRAU), c)
  } else if (sub === 'OCH3') {
    const o = liga('O', 0, -L, 0)
    liga('C', L * Math.cos(30 * GRAU), -L * Math.sin(30 * GRAU), o)
  }
  void topo
  return enquadrar({ atomos, ligacoes, largura: 0, altura: 0 })
}

/** Encosta a molécula na origem e calcula a caixa que a contém (com margem para os rótulos). */
function enquadrar(m: Molecula): Molecula {
  const xs = m.atomos.map((a) => a.x)
  const ys = m.atomos.map((a) => a.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const margem = 18
  const atomos = m.atomos.map((a) => ({ ...a, x: a.x - minX + margem, y: a.y - minY + margem }))
  return { atomos, ligacoes: m.ligacoes, largura: Math.max(...xs) - minX + 2 * margem, altura: Math.max(...ys) - minY + 2 * margem }
}

/* ------------------------------------------------------------------ propriedades calculadas do grafo */

export function vizinhos(m: Molecula, id: number): { id: number; ordem: 1 | 2 | 3 }[] {
  const lista: { id: number; ordem: 1 | 2 | 3 }[] = []
  for (const l of m.ligacoes) {
    if (l.a === id) lista.push({ id: l.b, ordem: l.ordem })
    else if (l.b === id) lista.push({ id: l.a, ordem: l.ordem })
  }
  return lista
}

const el = (m: Molecula, id: number) => (m.atomos[id] as Atomo).el

/** Hidrogênios implícitos de um átomo: valência menos a soma das ordens de ligação. */
export function hidrogenios(m: Molecula, id: number): number {
  return VALENCIA[el(m, id)] - vizinhos(m, id).reduce((soma, v) => soma + v.ordem, 0)
}

export function contagem(m: Molecula): Record<string, number> {
  const c: Record<string, number> = {}
  for (const a of m.atomos) {
    c[a.el] = (c[a.el] ?? 0) + 1
    c.H = (c.H ?? 0) + hidrogenios(m, a.id)
  }
  return c
}

/** Fórmula molecular na ordem de Hill (C, H, depois os demais em ordem alfabética), como texto simples. */
export function formulaMolecular(m: Molecula): string {
  const c = contagem(m)
  const ordem = ['C', 'H', ...Object.keys(c).filter((x) => x !== 'C' && x !== 'H').sort()]
  return ordem.filter((e) => c[e]).map((e) => `${e}${c[e] === 1 ? '' : c[e]}`).join('')
}

export type Classe = 'primario' | 'secundario' | 'terciario' | 'quaternario' | 'isolado'

/** Classificação do carbono pelo número de carbonos a que está ligado. */
export function classeCarbono(m: Molecula, id: number): Classe {
  const n = vizinhos(m, id).filter((v) => el(m, v.id) === 'C').length
  return n === 0 ? 'isolado' : n === 1 ? 'primario' : n === 2 ? 'secundario' : n === 3 ? 'terciario' : 'quaternario'
}

export function contarClasses(m: Molecula): Record<Classe, number> {
  const r: Record<Classe, number> = { isolado: 0, primario: 0, secundario: 0, terciario: 0, quaternario: 0 }
  for (const a of m.atomos) if (a.el === 'C') r[classeCarbono(m, a.id)]++
  return r
}

/** Forma canônica da ramificação que sai de `id` (vindo de `de`): igual só se as ramificações forem idênticas. */
function canonico(m: Molecula, id: number, de: number, visitados: Set<number> = new Set()): string {
  if (visitados.has(id)) return '*'
  const novos = new Set(visitados).add(id)
  const filhos = vizinhos(m, id)
    .filter((v) => v.id !== de)
    .map((v) => `${v.ordem === 1 ? '' : v.ordem === 2 ? '=' : '#'}${canonico(m, v.id, id, novos)}`)
    .sort()
  return `${el(m, id)}H${hidrogenios(m, id)}(${filhos.join(',')})`
}

/** Assinatura canônica da molécula (árvore): duas moléculas têm a mesma assinatura se forem a mesma estrutura. */
export function assinatura(m: Molecula): string {
  const todas = m.atomos.map((a) => canonico(m, a.id, -1))
  return todas.sort()[0] as string
}

/** Carbonos quirais (assimétricos): sp3 e com quatro grupos diferentes. */
export function carbonosQuirais(m: Molecula): number[] {
  const quirais: number[] = []
  for (const a of m.atomos) {
    if (a.el !== 'C' || a.arom) continue
    const viz = vizinhos(m, a.id)
    if (viz.some((v) => v.ordem !== 1)) continue
    const h = hidrogenios(m, a.id)
    if (viz.length + h !== 4) continue
    const grupos = viz.map((v) => canonico(m, v.id, a.id))
    if (h > 0) grupos.push(...Array.from({ length: h }, () => 'H'))
    if (new Set(grupos).size === 4) quirais.push(a.id)
  }
  return quirais
}

/** Maior cadeia contínua de carbonos (número de átomos de C). */
export function maiorCadeia(m: Molecula): number {
  const carbonos = m.atomos.filter((a) => a.el === 'C').map((a) => a.id)
  const vizC = (id: number) => vizinhos(m, id).filter((v) => el(m, v.id) === 'C').map((v) => v.id)
  const longe = (inicio: number) => {
    const dist = new Map<number, number>([[inicio, 1]])
    const fila = [inicio]
    let ultimo = inicio
    while (fila.length) {
      const x = fila.shift() as number
      ultimo = x
      for (const y of vizC(x)) if (!dist.has(y)) {
        dist.set(y, (dist.get(x) as number) + 1)
        fila.push(y)
      }
    }
    return { no: ultimo, d: dist.get(ultimo) as number }
  }
  let melhor = 0
  const vistos = new Set<number>()
  for (const c of carbonos) {
    if (vistos.has(c)) continue
    // componente conexo
    const comp: number[] = []
    const pilha = [c]
    while (pilha.length) {
      const x = pilha.pop() as number
      if (vistos.has(x)) continue
      vistos.add(x)
      comp.push(x)
      for (const y of vizC(x)) pilha.push(y)
    }
    const a = longe(comp[0] as number)
    melhor = Math.max(melhor, longe(a.no).d)
  }
  return melhor
}

/* ------------------------------------------------------------------ funções orgânicas */

export type Funcao =
  | 'hidrocarboneto'
  | 'alcool'
  | 'fenol'
  | 'eter'
  | 'aldeido'
  | 'cetona'
  | 'acido'
  | 'ester'
  | 'amina'
  | 'amida'
  | 'haleto'

export const NOME_FUNCAO: Record<Funcao, string> = {
  hidrocarboneto: 'Hidrocarboneto',
  alcool: 'Álcool',
  fenol: 'Fenol',
  eter: 'Éter',
  aldeido: 'Aldeído',
  cetona: 'Cetona',
  acido: 'Ácido carboxílico',
  ester: 'Éster',
  amina: 'Amina',
  amida: 'Amida',
  haleto: 'Haleto orgânico',
}

/** Como reconhecer cada função na estrutura. */
export const RECONHECER: Record<Funcao, string> = {
  hidrocarboneto: 'só tem carbono e hidrogênio',
  alcool: 'a hidroxila (–OH) está ligada a um carbono saturado, fora do anel aromático',
  fenol: 'a hidroxila (–OH) está ligada diretamente ao anel aromático',
  eter: 'um oxigênio entre dois carbonos (C–O–C), sem carbonila',
  aldeido: 'carbonila (C=O) na ponta da cadeia, com um hidrogênio',
  cetona: 'carbonila (C=O) no meio da cadeia, entre dois carbonos',
  acido: 'carboxila: carbonila (C=O) e hidroxila (–OH) no mesmo carbono',
  ester: 'carbonila (C=O) ligada a um oxigênio que, por sua vez, liga-se a outro carbono (C(=O)–O–C)',
  amina: 'nitrogênio ligado a carbonos (e a hidrogênios), sem carbonila',
  amida: 'carbonila (C=O) ligada diretamente a um nitrogênio',
  haleto: 'halogênio (F, Cl ou Br) ligado a carbono',
}

/** Funções presentes na molécula, em ordem de aparecimento fixa. */
export function funcoes(m: Molecula): Funcao[] {
  const achou = new Set<Funcao>()
  const ehC = (id: number) => el(m, id) === 'C'
  for (const a of m.atomos) {
    const viz = vizinhos(m, a.id)
    if (a.el === 'C') {
      const oDuplo = viz.some((v) => v.ordem === 2 && el(m, v.id) === 'O')
      if (oDuplo) {
        const oSimples = viz.filter((v) => v.ordem === 1 && el(m, v.id) === 'O')
        const n = viz.filter((v) => el(m, v.id) === 'N')
        const carbonosV = viz.filter((v) => ehC(v.id)).length
        if (n.length > 0) achou.add('amida')
        else if (oSimples.length > 0) {
          const ohLivre = oSimples.some((o) => vizinhos(m, o.id).length === 1)
          achou.add(ohLivre ? 'acido' : 'ester')
        } else if (carbonosV >= 2) achou.add('cetona')
        else achou.add('aldeido')
      }
      if (viz.some((v) => ['F', 'Cl', 'Br'].includes(el(m, v.id)))) achou.add('haleto')
    }
    if (a.el === 'O') {
      const nv = vizinhos(m, a.id)
      if (nv.length === 1 && nv[0]!.ordem === 1) {
        const c = nv[0] as { id: number }
        const cViz = vizinhos(m, c.id)
        const ehCarbonila = cViz.some((v) => v.ordem === 2 && el(m, v.id) === 'O')
        if (!ehCarbonila && ehC(c.id)) achou.add((m.atomos[c.id] as Atomo).arom ? 'fenol' : 'alcool')
      }
      if (nv.length === 2 && nv.every((v) => ehC(v.id) && v.ordem === 1)) {
        const carbonila = nv.some((v) => vizinhos(m, v.id).some((w) => w.ordem === 2 && el(m, w.id) === 'O'))
        if (!carbonila) achou.add('eter')
      }
    }
    if (a.el === 'N') {
      const carbonila = viz.some((v) => ehC(v.id) && vizinhos(m, v.id).some((w) => w.ordem === 2 && el(m, w.id) === 'O'))
      if (!carbonila && viz.some((v) => ehC(v.id))) achou.add('amina')
    }
  }
  const ordem: Funcao[] = ['acido', 'ester', 'amida', 'aldeido', 'cetona', 'alcool', 'fenol', 'eter', 'amina', 'haleto']
  const lista = ordem.filter((f) => achou.has(f))
  const soHidrocarboneto = m.atomos.every((a) => a.el === 'C')
  return lista.length === 0 && soHidrocarboneto ? ['hidrocarboneto'] : lista
}

export function temInsaturacao(m: Molecula): { duplas: number; triplas: number } {
  let duplas = 0
  let triplas = 0
  for (const l of m.ligacoes) {
    if (l.arom) continue
    if (l.ordem === 2 && el(m, l.a) === 'C' && el(m, l.b) === 'C') duplas++
    if (l.ordem === 3) triplas++
  }
  return { duplas, triplas }
}

/* ------------------------------------------------------------------ nomenclatura IUPAC (cadeias com poucos grupos) */

const RADICAL = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct']
const ALQUILA = ['', 'metila', 'etila', 'propila', 'butila', 'pentila', 'hexila']
const ALCOXI = ['', 'metoxi', 'etoxi', 'propoxi', 'butoxi', 'pentoxi']
const MULT = ['', '', 'di', 'tri', 'tetra']
const NOME_PREFIXO: Record<string, string> = { CH3: 'metil', Cl: 'cloro', Br: 'bromo', F: 'fluoro' }

interface Posicoes {
  /** n de carbonos da cadeia principal */
  n: number
  principal: { tipo: 'acido' | 'aldeido' | 'cetona' | 'alcool' | 'amina' | null; pos: number[] }
  insat: { tipo: 'eno' | 'ino'; pos: number }[]
  prefixos: { nome: string; pos: number }[]
}

/** Lê a especificação de uma cadeia só de carbonos e acha as posições dos grupos (índices a partir de 0). */
function posicoes(espec: Espec): Posicoes | null {
  if (espec.cadeia.some((a) => a !== 'C')) return null
  const n = espec.cadeia.length
  const principal: Posicoes['principal'] = { tipo: null, pos: [] }
  const prefixos: Posicoes['prefixos'] = []
  const insat: Posicoes['insat'] = []
  for (const [i, o] of Object.entries(espec.lig ?? {})) insat.push({ tipo: o === 2 ? 'eno' : 'ino', pos: Number(i) })
  const porNo = new Map<number, string[]>()
  for (const s of espec.subs ?? []) porNo.set(s.no, [...(porNo.get(s.no) ?? []), s.g])
  for (const [no, gs] of porNo) {
    const temO = gs.includes('=O')
    const temOH = gs.includes('OH')
    if (temO && temOH) {
      principal.tipo = 'acido'
      principal.pos.push(no)
    } else if (temO) {
      principal.tipo = no === 0 || no === n - 1 ? 'aldeido' : 'cetona'
      principal.pos.push(no)
    } else if (temOH) {
      principal.tipo = 'alcool'
      principal.pos.push(no)
    } else if (gs.includes('NH2')) {
      principal.tipo = 'amina'
      principal.pos.push(no)
    }
    for (const g of gs) if (NOME_PREFIXO[g]) prefixos.push({ nome: NOME_PREFIXO[g] as string, pos: no })
  }
  return { n, principal, insat, prefixos }
}

const cmpArr = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return (a[i] as number) - (b[i] as number)
  return a.length - b.length
}

/** Nome IUPAC (estilo atual: butan-2-ol) de uma cadeia só de carbonos com um grupo principal; null se fora do escopo. */
export function nomeIUPAC(espec: Espec, opcoes: { numeracaoErrada?: boolean } = {}): string | null {
  const p = posicoes(espec)
  if (!p) return null
  const { n } = p
  if (n > 8 || p.principal.pos.length > 1 || p.insat.length > 1) return null
  if (p.insat.length === 1 && p.principal.tipo !== null && p.principal.tipo !== 'alcool') return null
  const loc = (i: number, inverso: boolean) => (inverso ? n - i : i + 1)
  const locInsat = (u: number, inverso: boolean) => (inverso ? n - 1 - u : u + 1)

  // numeração: menor locante para o grupo principal, depois para a insaturação, depois para os prefixos
  const chaveDe = (inverso: boolean) => [
    p.principal.pos.map((i) => loc(i, inverso)).sort((a, b) => a - b),
    p.insat.map((u) => locInsat(u.pos, inverso)),
    p.prefixos.map((x) => loc(x.pos, inverso)).sort((a, b) => a - b),
  ]
  const melhorEhInverso = comparaChaves(chaveDe(true), chaveDe(false)) < 0
  const inv = opcoes.numeracaoErrada ? !melhorEhInverso : melhorEhInverso

  const grupos = new Map<string, number[]>()
  for (const x of p.prefixos) grupos.set(x.nome, [...(grupos.get(x.nome) ?? []), loc(x.pos, inv)])
  const totalPrefixos = p.prefixos.length
  const prefixoTxt = [...grupos.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'pt'))
    .map(([nome, ps]) => {
      const ordenados = [...ps].sort((a, b) => a - b)
      const semLocante = n <= 2 && totalPrefixos === 1
      return `${semLocante ? '' : `${ordenados.join(',')}-`}${MULT[ordenados.length] ?? ''}${nome}`
    })
    .join('-')

  const radical = RADICAL[n] as string
  const locPrincipal = p.principal.pos.length ? loc(p.principal.pos[0] as number, inv) : undefined
  const comLocante = (precisa: boolean, sufixo: string) => `${radical}an${precisa ? `-${locPrincipal}-` : ''}${sufixo}`
  switch (p.principal.tipo) {
    case 'acido':
      return `ácido ${prefixoTxt}${radical}anoico`
    case 'aldeido':
      return `${prefixoTxt}${radical}anal`
    case 'alcool':
      if (p.insat.length === 1) {
        const u = p.insat[0] as { tipo: 'eno' | 'ino'; pos: number }
        return `${prefixoTxt}${radical}-${locInsat(u.pos, inv)}-${u.tipo === 'eno' ? 'en' : 'in'}-${locPrincipal}-ol`
      }
      return `${prefixoTxt}${comLocante(n >= 3, 'ol')}`
    case 'cetona':
      return `${prefixoTxt}${comLocante(n >= 4, 'ona')}`
    case 'amina':
      return `${prefixoTxt}${comLocante(n >= 3, 'amina')}`
    default:
      if (p.insat.length === 1) {
        const u = p.insat[0] as { tipo: 'eno' | 'ino'; pos: number }
        const l = locInsat(u.pos, inv)
        return `${prefixoTxt}${radical}${n > 3 ? `-${l}-` : ''}${u.tipo === 'eno' ? 'en' : 'in'}o`
      }
      return `${prefixoTxt}${radical}ano`
  }
}

function comparaChaves(a: number[][], b: number[][]): number {
  for (let k = 0; k < a.length; k++) {
    const c = cmpArr(a[k] as number[], b[k] as number[])
    if (c !== 0) return c
  }
  return 0
}

/** Éster de cadeias lineares: "etanoato de metila". */
export function nomeEster(carbonosAcido: number, carbonosAlcool: number): string {
  return `${RADICAL[carbonosAcido]}anoato de ${ALQUILA[carbonosAlcool]}`
}

/** Éter de cadeias lineares: "metoxietano" (o grupo menor vira alcóxi). */
export function nomeEter(a: number, b: number): string {
  const [menor, maior] = a <= b ? [a, b] : [b, a]
  return `${ALCOXI[menor]}${RADICAL[maior]}ano`
}

export function nomeAmida(n: number): string {
  return `${RADICAL[n]}anamida`
}

/* ------------------------------------------------------------------ construtores de famílias lineares */

export const alcano = (n: number): Espec => ({ cadeia: Array(n).fill('C') })
export const comGrupos = (n: number, subs: NonNullable<Espec['subs']>, lig?: Espec['lig']): Espec => ({ cadeia: Array(n).fill('C'), subs, lig })
export const ester = (acido: number, alcool: number): Espec => ({
  cadeia: [...Array(acido).fill('C'), 'O', ...Array(alcool).fill('C')],
  subs: [{ no: acido - 1, g: '=O' }],
})
export const eter = (a: number, b: number): Espec => ({ cadeia: [...Array(a).fill('C'), 'O', ...Array(b).fill('C')] })
export const amida = (n: number): Espec => ({ cadeia: [...Array(n).fill('C'), 'N'], subs: [{ no: n - 1, g: '=O' }] })

/* ------------------------------------------------------------------ fórmula condensada (também serve de descrição para leitores de tela) */

/** Fórmula condensada de uma cadeia: CH3–CH(OH)–CH2–CH3. */
export function condensada(espec: Espec): string {
  const m = construir(espec)
  const n = espec.cadeia.length
  const grupoDe = (i: number) => (espec.subs ?? []).filter((s) => s.no === i).map((s) => s.g)
  const simbolo = { 1: '–', 2: '=', 3: '≡' } as const
  const hTxt = (k: number) => (k === 0 ? '' : k === 1 ? 'H' : `H${k}`)
  const partes: { txt: string; ate: number }[] = []
  let i = 0
  while (i < n) {
    const a = espec.cadeia[i] as 'C' | 'O' | 'N'
    const gs = grupoDe(i)
    const temO = gs.includes('=O')
    const resto = gs.filter((g) => g !== '=O')
    if (a === 'O') partes.push({ txt: 'O', ate: i })
    else if (a === 'N') partes.push({ txt: `N${hTxt(hidrogenios(m, i))}`, ate: i })
    else if (temO && resto.includes('OH')) partes.push({ txt: 'COOH', ate: i })
    else if (temO && espec.cadeia[i + 1] === 'O') {
      // éster: a carboxila inteira (C(=O)–O) vira COO
      partes.push({ txt: 'COO', ate: i + 1 })
      i += 2
      continue
    } else if (temO && espec.cadeia[i + 1] === 'N' && i + 1 === n - 1) {
      partes.push({ txt: `CON${hTxt(hidrogenios(m, i + 1))}`, ate: i + 1 })
      i += 2
      continue
    } else if (temO) partes.push({ txt: i === 0 || i === n - 1 ? 'CHO' : 'CO', ate: i })
    else partes.push({ txt: `C${hTxt(hidrogenios(m, i))}${resto.map((g) => `(${g})`).join('')}`, ate: i })
    i++
  }
  return partes.map((p, k) => (k === partes.length - 1 ? p.txt : `${p.txt}${simbolo[(espec.lig?.[p.ate] ?? 1) as 1 | 2 | 3]}`)).join('')
}
