/* ======================================================================
   Biologia molecular: código genético, transcrição, tradução, mutações,
   replicação (Meselson-Stahl), enzimas de restrição, PCR e óperon lac.
   ====================================================================== */

/* ------------------------------------------------------------------ código genético */

// Tabela padrão do código genético (NCBI, tabela 1). Os 64 códons são lidos na ordem T, C, A, G
// em cada uma das três posições; "*" marca o códon de parada.
const AMINOACIDOS_TCAG = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'
const BASES_TCAG = 'TCAG'

/** Aminoácidos (letra) e seus nomes. */
export const NOMES_AMINOACIDOS: Record<string, { tres: string; nome: string }> = {
  F: { tres: 'Phe', nome: 'fenilalanina' },
  L: { tres: 'Leu', nome: 'leucina' },
  I: { tres: 'Ile', nome: 'isoleucina' },
  M: { tres: 'Met', nome: 'metionina' },
  V: { tres: 'Val', nome: 'valina' },
  S: { tres: 'Ser', nome: 'serina' },
  P: { tres: 'Pro', nome: 'prolina' },
  T: { tres: 'Thr', nome: 'treonina' },
  A: { tres: 'Ala', nome: 'alanina' },
  Y: { tres: 'Tyr', nome: 'tirosina' },
  H: { tres: 'His', nome: 'histidina' },
  Q: { tres: 'Gln', nome: 'glutamina' },
  N: { tres: 'Asn', nome: 'asparagina' },
  K: { tres: 'Lys', nome: 'lisina' },
  D: { tres: 'Asp', nome: 'ácido aspártico' },
  E: { tres: 'Glu', nome: 'ácido glutâmico' },
  C: { tres: 'Cys', nome: 'cisteína' },
  W: { tres: 'Trp', nome: 'triptofano' },
  R: { tres: 'Arg', nome: 'arginina' },
  G: { tres: 'Gly', nome: 'glicina' },
  '*': { tres: 'Stop', nome: 'parada' },
}

/** Códons de RNA (com U) e o aminoácido que cada um codifica. */
export const CODONS: Record<string, string> = (() => {
  const t: Record<string, string> = {}
  let i = 0
  for (const b1 of BASES_TCAG)
    for (const b2 of BASES_TCAG)
      for (const b3 of BASES_TCAG) {
        t[`${b1}${b2}${b3}`.replace(/T/g, 'U')] = AMINOACIDOS_TCAG.charAt(i++)
      }
  return t
})()

export const CODON_INICIO = 'AUG'
export const CODONS_PARADA = ['UAA', 'UAG', 'UGA']

/** Códons de RNA que codificam o aminoácido (ou "*" para parada). */
export const codonsDe = (aa: string) => Object.entries(CODONS).filter(([, a]) => a === aa).map(([c]) => c)

/** Número de códons sinônimos de cada aminoácido. */
export const degenerescencia = (aa: string) => codonsDe(aa).length

/* ------------------------------------------------------------------ sequências */

export const PAR_DNA: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' }
export const PAR_RNA_DE_DNA: Record<string, string> = { A: 'U', T: 'A', G: 'C', C: 'G' }

/** Fita complementar de DNA, posição por posição (a leitura de uma fita 5'→3' corresponde a outra 3'→5'). */
export const complementarDNA = (seq: string) => [...seq].map((b) => PAR_DNA[b] as string).join('')

/** mRNA formado a partir de uma fita MOLDE de DNA, lida de 3' para 5' (o mRNA sai 5'→3', posição por posição). */
export const transcreverDoMolde = (molde: string) => [...molde].map((b) => PAR_RNA_DE_DNA[b] as string).join('')

/** mRNA a partir da fita CODIFICADORA (5'→3'): é igual a ela, com U no lugar de T. */
export const transcreverDaCodificadora = (cod: string) => cod.replace(/T/g, 'U')

/** Fita complementar lida em sentido contrário: reverso-complementar (5'→3' de uma fita a partir da outra 5'→3'). */
export const reversoComplementar = (seq: string) => [...complementarDNA(seq)].reverse().join('')

export function codons(mrna: string): string[] {
  const saida: string[] = []
  for (let i = 0; i + 3 <= mrna.length; i += 3) saida.push(mrna.slice(i, i + 3))
  return saida
}

/**
 * Traduz um mRNA a partir do primeiro AUG até o primeiro códon de parada (ou até o fim da sequência).
 * Devolve a lista de aminoácidos (letras) e se terminou por códon de parada.
 */
export function traduzir(mrna: string, iniciarNoAUG = true): { peptideo: string[]; terminou: boolean; inicio: number } {
  const inicio = iniciarNoAUG ? mrna.indexOf(CODON_INICIO) : 0
  if (inicio < 0) return { peptideo: [], terminou: false, inicio: -1 }
  const peptideo: string[] = []
  for (let i = inicio; i + 3 <= mrna.length; i += 3) {
    const aa = CODONS[mrna.slice(i, i + 3)] as string
    if (aa === '*') return { peptideo, terminou: true, inicio }
    peptideo.push(aa)
  }
  return { peptideo, terminou: false, inicio }
}

export const peptideoTexto = (aa: string[], formato: 'letras' | 'tres' = 'tres') => (formato === 'letras' ? aa.join('') : aa.map((a) => (NOMES_AMINOACIDOS[a] as { tres: string }).tres).join('-'))

/* ------------------------------------------------------------------ composição do DNA */

/** Regra de Chargaff: A = T e C = G. Dada a porcentagem de A, devolve as quatro porcentagens. */
export function chargaff(percentualA: number) {
  const g = (100 - 2 * percentualA) / 2
  return { A: percentualA, T: percentualA, G: g, C: g }
}

/** Porcentagem de G+C de uma sequência. */
export function porcentagemGC(seq: string): number {
  return (100 * [...seq].filter((b) => b === 'G' || b === 'C').length) / seq.length
}

/** Ligações de hidrogênio de um DNA de fita dupla: 2 por par A–T e 3 por par G–C. */
export const ligacoesHidrogenio = (paresAT: number, paresGC: number) => 2 * paresAT + 3 * paresGC

/* ------------------------------------------------------------------ mutações */

export type TipoMutacao = 'silenciosa' | 'troca' | 'semSentido' | 'quadro' | 'insercaoNoQuadro' | 'delecaoNoQuadro' | 'nenhuma'

/** Efeito de uma mutação, comparando o peptídeo original com o mutante (traduzidos do primeiro AUG). */
export function classificarMutacao(mrnaOriginal: string, mrnaMutante: string): TipoMutacao {
  const o = traduzir(mrnaOriginal)
  const m = traduzir(mrnaMutante)
  const igual = o.peptideo.join('') === m.peptideo.join('') && o.terminou === m.terminou
  if (mrnaOriginal === mrnaMutante) return 'nenhuma'
  const dif = mrnaMutante.length - mrnaOriginal.length
  if (dif === 0) {
    if (igual) return 'silenciosa'
    // a substituição criou um códon de parada antes do fim do peptídeo original
    if (m.terminou && m.peptideo.length < o.peptideo.length) return 'semSentido'
    return 'troca'
  }
  if (dif % 3 === 0) return dif > 0 ? 'insercaoNoQuadro' : 'delecaoNoQuadro'
  return 'quadro'
}

/** Substitui a base na posição (começando em 0). */
export const substituir = (seq: string, pos: number, base: string) => seq.slice(0, pos) + base + seq.slice(pos + 1)
export const inserir = (seq: string, pos: number, bases: string) => seq.slice(0, pos) + bases + seq.slice(pos)
export const remover = (seq: string, pos: number, n = 1) => seq.slice(0, pos) + seq.slice(pos + n)

/* ------------------------------------------------------------------ replicação: Meselson e Stahl */

export type ModeloReplicacao = 'semiconservativa' | 'conservativa' | 'dispersiva'

export interface BandasDensidade {
  /** fração das moléculas com as duas fitas pesadas (¹⁵N/¹⁵N) */
  pesado: number
  /** fração das moléculas híbridas (uma fita pesada e uma leve) */
  hibrido: number
  /** fração das moléculas com as duas fitas leves (¹⁴N/¹⁴N) */
  leve: number
  /** na hipótese dispersiva, a banda única fica numa densidade intermediária: fração de ¹⁵N em cada molécula */
  fracaoN15?: number
}

/**
 * Bandas esperadas num gradiente de densidade depois de g gerações em meio com ¹⁴N,
 * partindo de DNA com as duas fitas marcadas com ¹⁵N (geração 0).
 */
export function bandasMeselson(modelo: ModeloReplicacao, g: number): BandasDensidade {
  if (g === 0) return { pesado: 1, hibrido: 0, leve: 0 }
  const total = 2 ** g
  switch (modelo) {
    case 'semiconservativa':
      return { pesado: 0, hibrido: 2 / total, leve: 1 - 2 / total }
    case 'conservativa':
      return { pesado: 1 / total, hibrido: 0, leve: 1 - 1 / total }
    default:
      return { pesado: 0, hibrido: 1, leve: 0, fracaoN15: 1 / total }
  }
}

/** Número de moléculas de DNA na geração g (partindo de uma). */
export const moleculasNaGeracao = (g: number) => 2 ** g

/** Moléculas que ainda contêm ¹⁵N na geração g (modelo semiconservativo): as duas fitas originais ficam em duas moléculas. */
export const moleculasComN15 = (g: number) => (g === 0 ? 1 : 2)

/** Observação experimental de Meselson e Stahl: a hipótese é compatível se prevê as bandas observadas. */
export function compativelComObservacao(modelo: ModeloReplicacao, g: number): boolean {
  const esperado = bandasMeselson(modelo, g)
  const obs = bandasMeselson('semiconservativa', g)
  const igual = (a: number, b: number) => Math.abs(a - b) < 1e-9
  return igual(esperado.pesado, obs.pesado) && igual(esperado.hibrido, obs.hibrido) && igual(esperado.leve, obs.leve)
}

/* ------------------------------------------------------------------ enzimas de restrição e eletroforese */

export interface Enzima {
  nome: string
  sitio: string
  /** quantas bases do sítio ficam antes do corte, na fita de cima */
  corteApos: number
  extremidade: 'coesiva' | 'cega'
}

export const ENZIMAS: Enzima[] = [
  { nome: 'EcoRI', sitio: 'GAATTC', corteApos: 1, extremidade: 'coesiva' },
  { nome: 'BamHI', sitio: 'GGATCC', corteApos: 1, extremidade: 'coesiva' },
  { nome: 'HindIII', sitio: 'AAGCTT', corteApos: 1, extremidade: 'coesiva' },
  { nome: 'SmaI', sitio: 'CCCGGG', corteApos: 3, extremidade: 'cega' },
]

export const enzima = (nome: string) => ENZIMAS.find((e) => e.nome === nome) as Enzima

/** Posições de corte (índice da base logo após o corte) de uma enzima numa sequência. */
export function cortes(seq: string, e: Enzima): number[] {
  const saida: number[] = []
  for (let i = 0; i + e.sitio.length <= seq.length; i++) if (seq.startsWith(e.sitio, i)) saida.push(i + e.corteApos)
  return saida
}

/** Tamanhos dos fragmentos produzidos por cortes numa molécula linear ou circular de `tamanho` pares de bases. */
export function fragmentos(tamanho: number, posicoes: number[], circular = false): number[] {
  const p = [...posicoes].sort((a, b) => a - b)
  if (p.length === 0) return [tamanho]
  const f: number[] = []
  for (let i = 0; i < p.length - 1; i++) f.push((p[i + 1] as number) - (p[i] as number))
  if (circular) f.push(tamanho - (p[p.length - 1] as number) + (p[0] as number))
  else {
    f.unshift(p[0] as number)
    f.push(tamanho - (p[p.length - 1] as number))
  }
  return f.sort((a, b) => b - a)
}

/** Número de fragmentos para n cortes: n + 1 em molécula linear e n em molécula circular (n ≥ 1). */
export const numeroDeFragmentos = (cortesN: number, circular: boolean) => (cortesN === 0 ? 1 : circular ? cortesN : cortesN + 1)

/**
 * Posição relativa de uma banda no gel (0 = poço, 1 = fim do gel): fragmentos menores migram mais.
 * Modelo simples: distância proporcional ao logaritmo do tamanho (fragmentos entre `min` e `max` pb).
 */
export function posicaoNoGel(tamanho: number, min = 100, max = 10_000): number {
  const t = Math.min(max, Math.max(min, tamanho))
  return 0.08 + 0.84 * ((Math.log10(max) - Math.log10(t)) / (Math.log10(max) - Math.log10(min)))
}

/* ------------------------------------------------------------------ PCR */

export interface EtapasPCR {
  desnaturacao: number // °C
  anelamento: number
  extensao: number
}

export const TEMPERATURAS_PCR: EtapasPCR = { desnaturacao: 95, anelamento: 55, extensao: 72 }

/** Moléculas de DNA depois de n ciclos de PCR, partindo de `inicial` moléculas, com eficiência de 100 % (cada ciclo duplica). */
export const copiasAposCiclos = (inicial: number, n: number) => inicial * 2 ** n

/**
 * Moléculas com exatamente o tamanho do fragmento delimitado pelos primers, partindo de 1 molécula de fita dupla:
 * 2ⁿ − 2n (os primeiros produtos são mais longos; o fragmento exato só aparece a partir do 3º ciclo).
 */
export const copiasDoFragmentoExato = (n: number) => Math.max(0, 2 ** n - 2 * n)

/** Número de ciclos necessários para chegar a pelo menos `alvo` cópias, partindo de `inicial`. */
export function ciclosParaAlvo(inicial: number, alvo: number): number {
  let n = 0
  while (inicial * 2 ** n < alvo) n++
  return n
}

/** Duração total em segundos: cada ciclo tem desnaturação, anelamento e extensão. */
export const duracaoTotal = (ciclos: number, tDesn: number, tAnel: number, tExt: number) => ciclos * (tDesn + tAnel + tExt)

/* ------------------------------------------------------------------ óperon lac */

export type MutacaoLac = 'nenhuma' | 'repressor' | 'operador' | 'superrepressor' | 'promotor'
export type NivelTranscricao = 'nenhuma' | 'baixa' | 'alta'

export interface CondicoesLac {
  lactose: boolean
  glicose: boolean
  mutacao: MutacaoLac
}

/**
 * Transcrição dos genes lacZ, lacY e lacA.
 * - O repressor (lacI) se liga ao operador e bloqueia a RNA polimerase, a menos que a lactose (alolactose) o inative.
 * - A atividade é alta só se o complexo CAP–AMPc ajudar, o que ocorre sem glicose (repressão catabólica).
 * - Mutação no repressor ou no operador: a repressão deixa de existir (expressão constitutiva).
 * - Super-repressor: não responde à lactose e nunca solta o operador. Mutação no promotor: a RNA polimerase não se liga.
 */
export function transcricaoLac({ lactose, glicose, mutacao }: CondicoesLac): NivelTranscricao {
  if (mutacao === 'promotor') return 'nenhuma'
  const reprimido = mutacao === 'superrepressor' ? true : mutacao === 'repressor' || mutacao === 'operador' ? false : !lactose
  if (reprimido) return 'nenhuma'
  return glicose ? 'baixa' : 'alta'
}
