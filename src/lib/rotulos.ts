/** Posicionamento de rótulos em uma dimensão, sem sobreposição, e estimativa de largura de texto. */

export interface ItemRotulo {
  /** posição desejada do centro do rótulo */
  alvo: number
  /** tamanho do rótulo ao longo do eixo (largura, num eixo horizontal; altura da linha, num vertical) */
  tamanho: number
}

/**
 * Espalha rótulos ao longo de um eixo: cada um fica o mais perto possível do seu alvo, sem encostar nos vizinhos
 * (folga mínima `folga`), dentro de [min, max] e na mesma ordem dos alvos. Devolve o centro de cada rótulo,
 * na ordem da entrada. Rótulos que se tocam formam um bloco centrado na média dos alvos (como em d3-labeler).
 */
export function espalhar(itens: ItemRotulo[], min: number, max: number, folga = 4): number[] {
  const ordem = itens.map((_, i) => i).sort((a, b) => (itens[a] as ItemRotulo).alvo - (itens[b] as ItemRotulo).alvo)
  interface Bloco {
    membros: number[]
    inicio: number
    total: number
  }
  const tam = (i: number) => (itens[i] as ItemRotulo).tamanho
  const alvo = (i: number) => (itens[i] as ItemRotulo).alvo
  const totalDe = (membros: number[]) => membros.reduce((s, i) => s + tam(i), 0) + folga * (membros.length - 1)
  const posicionar = (membros: number[]): Bloco => {
    const total = totalDe(membros)
    // o centro do bloco minimiza o deslocamento quadrático: média dos alvos menos o deslocamento interno médio
    let acumulado = 0
    let soma = 0
    for (const i of membros) {
      soma += alvo(i) - (acumulado + tam(i) / 2)
      acumulado += tam(i) + folga
    }
    let inicio = soma / membros.length
    inicio = Math.min(Math.max(inicio, min), Math.max(min, max - total))
    return { membros, inicio, total }
  }
  let blocos: Bloco[] = ordem.map((i) => posicionar([i]))
  for (let volta = 0; volta < itens.length + 1; volta++) {
    const novo: Bloco[] = []
    let mudou = false
    for (const b of blocos) {
      const anterior = novo[novo.length - 1]
      if (anterior && anterior.inicio + anterior.total + folga > b.inicio + 1e-9) {
        novo[novo.length - 1] = posicionar([...anterior.membros, ...b.membros])
        mudou = true
      } else novo.push(b)
    }
    blocos = novo
    if (!mudou) break
  }
  const centros = new Array<number>(itens.length).fill(0)
  for (const b of blocos) {
    let x = b.inicio
    for (const i of b.membros) {
      centros[i] = x + tam(i) / 2
      x += tam(i) + folga
    }
  }
  return centros
}

/** Largura aproximada de um texto em Inter (unidades do SVG), para planejar rótulos. */
export function larguraTexto(texto: string, fonte: number, negrito = false): number {
  let unidades = 0
  for (const c of texto) {
    if (c === ' ') unidades += 0.28
    else if ('iíl.,:;|!ı'.includes(c)) unidades += 0.27
    else if ('fjrtI()[]'.includes(c)) unidades += 0.36
    else if ('mwMW'.includes(c)) unidades += 0.86
    else if (c >= 'A' && c <= 'Z') unidades += 0.66
    else if (c >= '0' && c <= '9') unidades += 0.58
    else unidades += 0.55
  }
  return unidades * fonte * (negrito ? 1.06 : 1)
}

/** Verdadeiro se nenhum par de intervalos [centro ± tamanho/2] se sobrepõe (com a folga dada). */
export function semSobreposicao(centros: number[], tamanhos: number[], folga = 0): boolean {
  const iv = centros.map((c, i) => [c - (tamanhos[i] as number) / 2, c + (tamanhos[i] as number) / 2] as const).sort((a, b) => a[0] - b[0])
  for (let i = 1; i < iv.length; i++) if ((iv[i - 1] as readonly [number, number])[1] + folga > (iv[i] as readonly [number, number])[0] + 1e-6) return false
  return true
}
