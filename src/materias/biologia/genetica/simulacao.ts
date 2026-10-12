import { criarRng } from '@/lib/rng'
import { gametas, normalizar } from './calculo'

/**
 * Sorteia `n` descendentes de um cruzamento (genes independentes): cada genitor passa um gameta ao acaso,
 * e conta quantos de cada genótipo nasceram. A semente torna o resultado reproduzível.
 */
export function sortearProle(pai: string, mae: string, n: number, semente: number): Map<string, number> {
  const rng = criarRng(semente * 2654435761 + 17)
  const gp = [...gametas(pai).keys()]
  const gm = [...gametas(mae).keys()]
  const contagem = new Map<string, number>()
  for (let i = 0; i < n; i++) {
    const a = gp[Math.floor(rng() * gp.length)] as string
    const b = gm[Math.floor(rng() * gm.length)] as string
    let g = ''
    for (let k = 0; k < a.length; k++) g += a.charAt(k) + b.charAt(k)
    const chave = normalizar(g)
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
  }
  return contagem
}
