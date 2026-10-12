/* Utilitários só para testes: tabela do código genético escrita à parte (por aminoácido) e uma tradução independente. */

export const POR_AMINOACIDO: Record<string, string[]> = {
  F: ['UUU', 'UUC'],
  L: ['UUA', 'UUG', 'CUU', 'CUC', 'CUA', 'CUG'],
  I: ['AUU', 'AUC', 'AUA'],
  M: ['AUG'],
  V: ['GUU', 'GUC', 'GUA', 'GUG'],
  S: ['UCU', 'UCC', 'UCA', 'UCG', 'AGU', 'AGC'],
  P: ['CCU', 'CCC', 'CCA', 'CCG'],
  T: ['ACU', 'ACC', 'ACA', 'ACG'],
  A: ['GCU', 'GCC', 'GCA', 'GCG'],
  Y: ['UAU', 'UAC'],
  '*': ['UAA', 'UAG', 'UGA'],
  H: ['CAU', 'CAC'],
  Q: ['CAA', 'CAG'],
  N: ['AAU', 'AAC'],
  K: ['AAA', 'AAG'],
  D: ['GAU', 'GAC'],
  E: ['GAA', 'GAG'],
  C: ['UGU', 'UGC'],
  W: ['UGG'],
  R: ['CGU', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
  G: ['GGU', 'GGC', 'GGA', 'GGG'],
}

/** códon → aminoácido, construído da lista acima. */
export const TABELA_IND: Record<string, string> = (() => {
  const t: Record<string, string> = {}
  for (const [aa, lista] of Object.entries(POR_AMINOACIDO)) for (const c of lista) t[c] = aa
  return t
})()

export const NOME3: Record<string, string> = { F: 'Phe', L: 'Leu', I: 'Ile', M: 'Met', V: 'Val', S: 'Ser', P: 'Pro', T: 'Thr', A: 'Ala', Y: 'Tyr', H: 'His', Q: 'Gln', N: 'Asn', K: 'Lys', D: 'Asp', E: 'Glu', C: 'Cys', W: 'Trp', R: 'Arg', G: 'Gly' }

/** Traduz do primeiro AUG até a parada, usando a tabela independente. Devolve as letras dos aminoácidos. */
export function traduzirInd(mrna: string): string[] {
  const i = mrna.indexOf('AUG')
  if (i < 0) return []
  const saida: string[] = []
  for (let k = i; k + 3 <= mrna.length; k += 3) {
    const aa = TABELA_IND[mrna.slice(k, k + 3)] as string
    if (aa === '*') break
    saida.push(aa)
  }
  return saida
}

export const como3 = (aas: string[]) => aas.map((a) => NOME3[a]).join('-')

/** Retira "5′-" e "-3′" (ou "3′-" e "-5′") de uma sequência apresentada numa alternativa. */
export const semExtremidades = (txt: string) => txt.replace(/^[35]′-/, '').replace(/-[35]′$/, '')

/** Complemento de RNA de cada base de DNA (A→U, T→A, G→C, C→G), escrito à parte. */
export const complementoRNA: Record<string, string> = { A: 'U', T: 'A', G: 'C', C: 'G' }

/** Tabela de verdade do óperon lac: chave "lactose|glicose|mutação". */
export const TABELA_LAC: Record<string, string> = (() => {
  const t: Record<string, string> = {}
  const nenhuma: Record<string, string> = { '0|0': 'nenhuma', '0|1': 'nenhuma', '1|0': 'alta', '1|1': 'baixa' }
  const constitutiva: Record<string, string> = { '0|0': 'alta', '0|1': 'baixa', '1|0': 'alta', '1|1': 'baixa' }
  for (const [k, v] of Object.entries(nenhuma)) t[`${k}|nenhuma`] = v
  for (const m of ['repressor', 'operador']) for (const [k, v] of Object.entries(constitutiva)) t[`${k}|${m}`] = v
  for (const m of ['superrepressor', 'promotor']) for (const k of Object.keys(nenhuma)) t[`${k}|${m}`] = 'nenhuma'
  return t
})()
