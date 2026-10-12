import type { InstanciaMulti } from '@/desafios/simples'
import { escolher, type Rng } from '@/lib/rng'
import { montar, type ItemBanco } from '@/materias/biologia/comum/auxiliares'

/** Pergunta de banco escrita à mão: embaralha as alternativas e liga cada explicação à sua letra. */
export function doBanco<D = undefined>(rng: Rng, banco: ItemBanco[], dados?: D): InstanciaMulti<D> {
  const item = escolher(rng, banco)
  return montar<D>(rng, { texto: item.certa.texto, porque: item.certa.porque }, item.erradas, {
    enunciado: item.pergunta,
    resolucao: item.certa.porque,
    dicas: item.dicas,
    licao: item.licao,
    dados,
  })
}

/** Divide um banco em faixas de dificuldade: nível 1 pega o primeiro terço, nível 3 o último. */
export function faixaDoBanco<T>(banco: T[], nivel: 1 | 2 | 3, sobreposicao = 1): T[] {
  const n = banco.length
  const tam = Math.ceil(n / 3)
  const ini = Math.max(0, (nivel - 1) * tam - sobreposicao)
  const fim = Math.min(n, nivel * tam + sobreposicao)
  return banco.slice(ini, fim)
}
