/* ======================================================================
   Heredogramas: inferência exata sobre padrões de herança mendeliana.
   Cada indivíduo recebe um genótipo; contam-se todas as atribuições coerentes
   com os fenótipos e com as leis de Mendel, ponderadas pela probabilidade.
   ====================================================================== */

export type Sexo = 'M' | 'F'
export type Modelo = 'AD' | 'AR' | 'XD' | 'XR'

export const MODELOS: Modelo[] = ['AD', 'AR', 'XD', 'XR']

export const NOME_MODELO: Record<Modelo, string> = {
  AD: 'autossômica dominante',
  AR: 'autossômica recessiva',
  XD: 'dominante ligada ao X',
  XR: 'recessiva ligada ao X',
}

export interface Pessoa {
  id: string
  sexo: Sexo
  afetado: boolean
  /** [pai, mãe]; sem esse campo, a pessoa é "fundadora" (entra de fora da família) */
  pais?: [string, string]
  geracao: number
  /** posição em ordem dentro da geração (da esquerda para a direita) */
  ordem: number
}

export interface Heredograma {
  nome: string
  pessoas: Pessoa[]
}

/* ------------------------------------------------------------------ genótipos */

/**
 * Genótipo = número de cópias do alelo "da doença" (autossomos: 0, 1 ou 2; X: mulheres 0 a 2, homens 0 ou 1).
 * Em AR e XR o alelo da doença é recessivo (a); em AD e XD ele é dominante (A).
 */
export const ehLigadoAoX = (m: Modelo) => m === 'XD' || m === 'XR'

export function genotiposPossiveis(modelo: Modelo, sexo: Sexo): number[] {
  return ehLigadoAoX(modelo) && sexo === 'M' ? [0, 1] : [0, 1, 2]
}

export function afetadoPorGenotipo(modelo: Modelo, sexo: Sexo, g: number): boolean {
  switch (modelo) {
    case 'AD':
      return g >= 1
    case 'AR':
      return g === 2
    case 'XD':
      return sexo === 'M' ? g === 1 : g >= 1
    default:
      return sexo === 'M' ? g === 1 : g === 2
  }
}

/** Rótulo do genótipo na notação usada nas provas. */
export function rotuloGenotipo(modelo: Modelo, sexo: Sexo, g: number): string {
  switch (modelo) {
    case 'AD':
      return ['aa', 'Aa', 'AA'][g] as string
    case 'AR':
      return ['AA', 'Aa', 'aa'][g] as string
    case 'XD':
      return sexo === 'M' ? (['XaY', 'XAY'][g] as string) : (['XaXa', 'XAXa', 'XAXA'][g] as string)
    default:
      return sexo === 'M' ? (['XAY', 'XaY'][g] as string) : (['XAXA', 'XAXa', 'XaXa'][g] as string)
  }
}

/** Probabilidade de um filho de sexo `sexoFilho` ter o genótipo `gFilho`, dados os genótipos do pai e da mãe. */
export function transmissao(modelo: Modelo, gPai: number, gMae: number, sexoFilho: Sexo, gFilho: number): number {
  const deMae = gMae / 2 // chance de a mãe passar o alelo da doença (cada cópia com 1/2)
  if (!ehLigadoAoX(modelo)) {
    const dePai = gPai / 2
    const p0 = (1 - dePai) * (1 - deMae)
    const p2 = dePai * deMae
    return gFilho === 0 ? p0 : gFilho === 2 ? p2 : 1 - p0 - p2
  }
  if (sexoFilho === 'M') return gFilho === 1 ? deMae : gFilho === 0 ? 1 - deMae : 0
  // filha: recebe o X do pai (que tem uma cópia: gPai ∈ {0, 1}) e um X da mãe
  const dePai = gPai
  const p0 = (1 - dePai) * (1 - deMae)
  const p2 = dePai * deMae
  return gFilho === 0 ? p0 : gFilho === 2 ? p2 : 1 - p0 - p2
}

/** Probabilidade a priori de o genótipo de uma pessoa de fora da família, com frequência q do alelo da doença. */
export function priori(modelo: Modelo, sexo: Sexo, g: number, q: number): number {
  if (ehLigadoAoX(modelo) && sexo === 'M') return g === 1 ? q : 1 - q
  return g === 0 ? (1 - q) ** 2 : g === 1 ? 2 * q * (1 - q) : q * q
}

/* ------------------------------------------------------------------ análise exata */

/** Pessoas em ordem que garante pais antes dos filhos. */
export function ordemTopologica(ped: Heredograma): Pessoa[] {
  const por = new Map(ped.pessoas.map((p) => [p.id, p]))
  const feitos = new Set<string>()
  const saida: Pessoa[] = []
  const visitar = (p: Pessoa) => {
    if (feitos.has(p.id)) return
    feitos.add(p.id)
    for (const pai of p.pais ?? []) visitar(por.get(pai) as Pessoa)
    saida.push(p)
  }
  for (const p of ped.pessoas) visitar(p)
  return saida
}

export interface Analise {
  /** soma dos pesos das atribuições coerentes (zero = modelo impossível) */
  total: number
  /** distribuição a posteriori do genótipo de cada pessoa */
  marginais: Map<string, number[]>
  /** a probabilidade de o próximo filho do casal dado ser afetado (se pedido) */
  filhoAfetado?: number
}

interface PedidoFilho {
  pai: string
  mae: string
  sexo?: Sexo
}

/**
 * Enumera, por busca em profundidade, todas as atribuições de genótipos coerentes com os fenótipos e com a transmissão mendeliana.
 * `q` é a frequência do alelo da doença na população de fora da família (muito pequena = pressuposto usual das provas).
 */
export function analisar(ped: Heredograma, modelo: Modelo, q = 1e-6, filho?: PedidoFilho): Analise {
  const ordem = ordemTopologica(ped)
  const n = ordem.length
  const indice = new Map(ordem.map((p, i) => [p.id, i]))
  const g = new Array<number>(n).fill(0)
  const marginais = new Map<string, number[]>(ordem.map((p) => [p.id, new Array<number>(3).fill(0)]))
  let total = 0
  let somaFilho = 0
  const iPai = filho ? (indice.get(filho.pai) as number) : -1
  const iMae = filho ? (indice.get(filho.mae) as number) : -1

  const dfs = (k: number, peso: number) => {
    if (k === n) {
      total += peso
      ordem.forEach((p, i) => {
        const m = marginais.get(p.id) as number[]
        m[g[i] as number] = (m[g[i] as number] as number) + peso
      })
      if (filho) {
        const sexos: Sexo[] = filho.sexo ? [filho.sexo] : ehLigadoAoX(modelo) ? ['M', 'F'] : ['M']
        let p = 0
        for (const s of sexos) for (const gf of genotiposPossiveis(modelo, s)) if (afetadoPorGenotipo(modelo, s, gf)) p += transmissao(modelo, g[iPai] as number, g[iMae] as number, s, gf)
        somaFilho += peso * (p / sexos.length)
      }
      return
    }
    const pessoa = ordem[k] as Pessoa
    for (const gi of genotiposPossiveis(modelo, pessoa.sexo)) {
      if (afetadoPorGenotipo(modelo, pessoa.sexo, gi) !== pessoa.afetado) continue
      let w: number
      if (!pessoa.pais) w = priori(modelo, pessoa.sexo, gi, q)
      else {
        w = transmissao(modelo, g[indice.get(pessoa.pais[0]) as number] as number, g[indice.get(pessoa.pais[1]) as number] as number, pessoa.sexo, gi)
        if (w === 0) continue
      }
      g[k] = gi
      dfs(k + 1, peso * w)
    }
  }
  dfs(0, 1)

  if (total > 0) for (const m of marginais.values()) for (let i = 0; i < m.length; i++) m[i] = (m[i] as number) / total
  return { total, marginais, filhoAfetado: filho && total > 0 ? somaFilho / total : undefined }
}

/** O modelo é compatível com o heredograma se existe ao menos uma atribuição coerente. */
export const compativel = (ped: Heredograma, modelo: Modelo) => analisar(ped, modelo).total > 0

export const modelosCompativeis = (ped: Heredograma): Modelo[] => MODELOS.filter((m) => compativel(ped, m))

/* ------------------------------------------------------------------ simulação (para gerar heredogramas) */

/** Sorteia genótipos segundo o modelo e devolve o heredograma com os fenótipos resultantes. */
export function simular(estrutura: Heredograma, modelo: Modelo, qFundadores: number, rng: () => number): Heredograma {
  const ordem = ordemTopologica(estrutura)
  const gen = new Map<string, number>()
  const sorteia = (pesos: number[]) => {
    const u = rng() * pesos.reduce((s, x) => s + x, 0)
    let acc = 0
    for (let i = 0; i < pesos.length; i++) {
      acc += pesos[i] as number
      if (u < acc) return i
    }
    return pesos.length - 1
  }
  for (const p of ordem) {
    const possiveis = genotiposPossiveis(modelo, p.sexo)
    const pesos = possiveis.map((gi) => (p.pais ? transmissao(modelo, gen.get(p.pais[0]) as number, gen.get(p.pais[1]) as number, p.sexo, gi) : priori(modelo, p.sexo, gi, qFundadores)))
    gen.set(p.id, possiveis[sorteia(pesos)] as number)
  }
  return { ...estrutura, pessoas: estrutura.pessoas.map((p) => ({ ...p, afetado: afetadoPorGenotipo(modelo, p.sexo, gen.get(p.id) as number) })) }
}

/* ------------------------------------------------------------------ estruturas de família */

type Esboco = { id: string; sexo: Sexo; geracao: number; ordem: number; pais?: [string, string] }

const monta = (nome: string, esbocos: Esboco[]): Heredograma => ({ nome, pessoas: esbocos.map((e) => ({ ...e, afetado: false })) })

/** I-1 × I-2 e três filhos. */
export const ESTRUTURA_SIMPLES: Heredograma = monta('Família simples', [
  { id: 'I-1', sexo: 'M', geracao: 0, ordem: 0 },
  { id: 'I-2', sexo: 'F', geracao: 0, ordem: 1 },
  { id: 'II-1', sexo: 'M', geracao: 1, ordem: 0, pais: ['I-1', 'I-2'] },
  { id: 'II-2', sexo: 'F', geracao: 1, ordem: 1, pais: ['I-1', 'I-2'] },
  { id: 'II-3', sexo: 'M', geracao: 1, ordem: 2, pais: ['I-1', 'I-2'] },
])

/** Três gerações: o casal I tem 3 filhos; a filha II-3 casa com II-4 (de fora) e tem 2 filhos. */
export const ESTRUTURA_TRES_GERACOES: Heredograma = monta('Três gerações', [
  { id: 'I-1', sexo: 'M', geracao: 0, ordem: 0 },
  { id: 'I-2', sexo: 'F', geracao: 0, ordem: 1 },
  { id: 'II-1', sexo: 'F', geracao: 1, ordem: 0, pais: ['I-1', 'I-2'] },
  { id: 'II-2', sexo: 'M', geracao: 1, ordem: 1, pais: ['I-1', 'I-2'] },
  { id: 'II-3', sexo: 'F', geracao: 1, ordem: 2, pais: ['I-1', 'I-2'] },
  { id: 'II-4', sexo: 'M', geracao: 1, ordem: 3 },
  { id: 'III-1', sexo: 'M', geracao: 2, ordem: 0, pais: ['II-4', 'II-3'] },
  { id: 'III-2', sexo: 'F', geracao: 2, ordem: 1, pais: ['II-4', 'II-3'] },
])

/** Duas famílias que se cruzam: II-2 (filha de I-1 e I-2) casa com II-3 (filho de I-3 e I-4). */
export const ESTRUTURA_DUAS_FAMILIAS: Heredograma = monta('Duas famílias', [
  { id: 'I-1', sexo: 'M', geracao: 0, ordem: 0 },
  { id: 'I-2', sexo: 'F', geracao: 0, ordem: 1 },
  { id: 'I-3', sexo: 'M', geracao: 0, ordem: 2 },
  { id: 'I-4', sexo: 'F', geracao: 0, ordem: 3 },
  { id: 'II-1', sexo: 'M', geracao: 1, ordem: 0, pais: ['I-1', 'I-2'] },
  { id: 'II-2', sexo: 'F', geracao: 1, ordem: 1, pais: ['I-1', 'I-2'] },
  { id: 'II-3', sexo: 'M', geracao: 1, ordem: 2, pais: ['I-3', 'I-4'] },
  { id: 'II-4', sexo: 'F', geracao: 1, ordem: 3, pais: ['I-3', 'I-4'] },
  { id: 'III-1', sexo: 'M', geracao: 2, ordem: 0, pais: ['II-3', 'II-2'] },
  { id: 'III-2', sexo: 'F', geracao: 2, ordem: 1, pais: ['II-3', 'II-2'] },
  { id: 'III-3', sexo: 'M', geracao: 2, ordem: 2, pais: ['II-3', 'II-2'] },
])

/** Dois ramos: os filhos II-1 e II-3 de I-1 × I-2 casam com pessoas de fora. */
export const ESTRUTURA_DOIS_RAMOS: Heredograma = monta('Dois ramos', [
  { id: 'I-1', sexo: 'M', geracao: 0, ordem: 0 },
  { id: 'I-2', sexo: 'F', geracao: 0, ordem: 1 },
  { id: 'II-1', sexo: 'F', geracao: 1, ordem: 0, pais: ['I-1', 'I-2'] },
  { id: 'II-2', sexo: 'M', geracao: 1, ordem: 1 },
  { id: 'II-3', sexo: 'M', geracao: 1, ordem: 2, pais: ['I-1', 'I-2'] },
  { id: 'II-4', sexo: 'F', geracao: 1, ordem: 3 },
  { id: 'III-1', sexo: 'F', geracao: 2, ordem: 0, pais: ['II-2', 'II-1'] },
  { id: 'III-2', sexo: 'M', geracao: 2, ordem: 1, pais: ['II-2', 'II-1'] },
  { id: 'III-3', sexo: 'M', geracao: 2, ordem: 2, pais: ['II-3', 'II-4'] },
  { id: 'III-4', sexo: 'F', geracao: 2, ordem: 3, pais: ['II-3', 'II-4'] },
])

export const ESTRUTURAS: Heredograma[] = [ESTRUTURA_SIMPLES, ESTRUTURA_TRES_GERACOES, ESTRUTURA_DUAS_FAMILIAS, ESTRUTURA_DOIS_RAMOS]

export const comFenotipos = (estrutura: Heredograma, afetados: string[]): Heredograma => ({ ...estrutura, pessoas: estrutura.pessoas.map((p) => ({ ...p, afetado: afetados.includes(p.id) })) })

/* ------------------------------------------------------------------ desenho */

export const DX = 52
export const DY = 82
export const MARGEM_X = 28
export const MARGEM_Y = 26
export const TAMANHO = 30

export interface LayoutHeredograma {
  largura: number
  altura: number
  posicoes: Map<string, { x: number; y: number }>
  /** linhas do desenho: segmentos horizontais e verticais */
  segmentos: { x1: number; y1: number; x2: number; y2: number }[]
}

/** Posiciona cada geração em uma linha, com os casamentos e as ligações com os filhos em linhas ortogonais. */
export function layoutHeredograma(ped: Heredograma): LayoutHeredograma {
  const geracoes = Math.max(...ped.pessoas.map((p) => p.geracao)) + 1
  const porGeracao = Array.from({ length: geracoes }, (_, g) => ped.pessoas.filter((p) => p.geracao === g).sort((a, b) => a.ordem - b.ordem))
  const maior = Math.max(...porGeracao.map((l) => l.length))
  const largura = MARGEM_X * 2 + (maior - 1) * DX
  const posicoes = new Map<string, { x: number; y: number }>()
  porGeracao.forEach((lista, g) => {
    const deslocamento = ((maior - lista.length) * DX) / 2
    lista.forEach((p, i) => posicoes.set(p.id, { x: MARGEM_X + deslocamento + i * DX, y: MARGEM_Y + g * DY }))
  })
  const segmentos: LayoutHeredograma['segmentos'] = []
  const meio = TAMANHO / 2
  const casais = new Map<string, { pai: string; mae: string; filhos: string[] }>()
  for (const p of ped.pessoas)
    if (p.pais) {
      const chave = p.pais.join('|')
      const c = casais.get(chave) ?? { pai: p.pais[0], mae: p.pais[1], filhos: [] }
      c.filhos.push(p.id)
      casais.set(chave, c)
    }
  for (const c of casais.values()) {
    const a = posicoes.get(c.pai) as { x: number; y: number }
    const b = posicoes.get(c.mae) as { x: number; y: number }
    const esq = a.x < b.x ? a : b
    const dir = a.x < b.x ? b : a
    segmentos.push({ x1: esq.x + meio, y1: esq.y, x2: dir.x - meio, y2: dir.y })
    const mx = (esq.x + dir.x) / 2
    const yBarra = a.y + DY / 2 + 2
    segmentos.push({ x1: mx, y1: a.y, x2: mx, y2: yBarra })
    const xs = c.filhos.map((f) => (posicoes.get(f) as { x: number; y: number }).x)
    segmentos.push({ x1: Math.min(mx, ...xs), y1: yBarra, x2: Math.max(mx, ...xs), y2: yBarra })
    for (const f of c.filhos) {
      const pf = posicoes.get(f) as { x: number; y: number }
      segmentos.push({ x1: pf.x, y1: yBarra, x2: pf.x, y2: pf.y - meio })
    }
  }
  return { largura, altura: MARGEM_Y * 2 + (geracoes - 1) * DY + 12, posicoes, segmentos }
}
