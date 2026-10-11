import type { Rng } from '@/lib/rng'
import type { Progresso } from './progresso'
import type { Nivel } from './tipos'

export interface ItemRevisao {
  /** id do desafio + ":" + nível, a mesma chave usada no progresso */
  chave: string
  id: string
  nivel: Nivel
}

/** Quanto mais erros, mais chance de cair na revisão. */
export function pesoRevisao(p: Progresso, chave: string): number {
  const r = p[chave]
  if (!r) return 1
  const erros = r.tentativas - r.acertos
  return 1 + 3 * erros + (r.ultimo ? 0 : 1)
}

export function sortearItem(itens: ItemRevisao[], p: Progresso, rng: Rng, evitar?: string): ItemRevisao {
  const candidatos = itens.length > 1 && evitar ? itens.filter((i) => i.chave !== evitar) : itens
  const pesos = candidatos.map((i) => pesoRevisao(p, i.chave))
  let alvo = rng() * pesos.reduce((s, x) => s + x, 0)
  for (let i = 0; i < candidatos.length; i++) {
    alvo -= pesos[i] as number
    if (alvo < 0) return candidatos[i] as ItemRevisao
  }
  return candidatos[candidatos.length - 1] as ItemRevisao
}
