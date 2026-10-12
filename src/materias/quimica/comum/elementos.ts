/** Massas atômicas usadas nos exercícios (valores arredondados, como numa tabela de prova). */
export const MASSA_ATOMICA: Record<string, number> = {
  H: 1,
  C: 12,
  N: 14,
  O: 16,
  F: 19,
  Na: 23,
  Mg: 24,
  Al: 27,
  P: 31,
  S: 32,
  Cl: 35.5,
  K: 39,
  Ca: 40,
  Fe: 56,
  Zn: 65,
  Br: 80,
  Ag: 108,
}

/** Cor de cada elemento nos desenhos (convenção CPK adaptada para ter contraste nos dois temas). */
export const COR_ELEMENTO: Record<string, string> = {
  H: '#e9e4d8',
  C: '#4a4540',
  N: '#3b6fd4',
  O: '#d6392f',
  F: '#4caf50',
  Cl: '#2e9e4a',
  Na: '#8a5cc7',
  K: '#a86bd6',
  Mg: '#3f9a5c',
  Ca: '#5b8a3c',
  Al: '#9a9aa6',
  Fe: '#b8642a',
  Zn: '#7d8aa0',
  S: '#d9b61e',
  P: '#e08a1e',
  Br: '#8c2f2f',
  Ag: '#b5b5be',
}

export type Contagem = Record<string, number>

/** Lê uma fórmula como "Al2(SO4)3" e conta os átomos de cada elemento. */
export function lerFormula(formula: string): Contagem {
  const pilha: Contagem[] = [{}]
  let i = 0
  const lerNum = () => {
    let j = i
    while (j < formula.length && /\d/.test(formula[j] as string)) j++
    const n = j > i ? Number(formula.slice(i, j)) : 1
    i = j
    return n
  }
  while (i < formula.length) {
    const c = formula[i] as string
    if (c === '(') {
      pilha.push({})
      i++
    } else if (c === ')') {
      i++
      const fator = lerNum()
      const topo = pilha.pop() as Contagem
      const acima = pilha[pilha.length - 1] as Contagem
      for (const [el, n] of Object.entries(topo)) acima[el] = (acima[el] ?? 0) + n * fator
    } else if (/[A-Z]/.test(c)) {
      let el = c
      i++
      while (i < formula.length && /[a-z]/.test(formula[i] as string)) el += formula[i++]
      const n = lerNum()
      const topo = pilha[pilha.length - 1] as Contagem
      topo[el] = (topo[el] ?? 0) + n
    } else {
      throw new Error(`fórmula inválida: ${formula}`)
    }
  }
  return pilha[0] as Contagem
}

export function massaMolar(formula: string): number {
  let m = 0
  for (const [el, n] of Object.entries(lerFormula(formula))) {
    const a = MASSA_ATOMICA[el]
    if (a === undefined) throw new Error(`elemento sem massa: ${el}`)
    m += a * n
  }
  return m
}

/** Quebra "Al2(SO4)3" em pedaços para desenhar os índices abaixo da linha. */
export function partesFormula(formula: string): { t: string; sub: boolean }[] {
  const partes: { t: string; sub: boolean }[] = []
  let atual = ''
  let sub: boolean = false
  const fecha = () => {
    if (atual) partes.push({ t: atual, sub })
    atual = ''
  }
  for (let i = 0; i < formula.length; i++) {
    const c = formula[i] as string
    const ehDigito = /\d/.test(c)
    const anterior = formula[i - 1] ?? ''
    const indice: boolean = ehDigito && ((i > 0 && /[A-Za-z)]/.test(anterior)) || sub)
    if (indice !== sub) {
      fecha()
      sub = indice
    }
    atual += c
  }
  fecha()
  return partes
}
