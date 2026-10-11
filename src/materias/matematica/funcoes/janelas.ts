import type { Janela } from './esboce'
import type { Funcao } from './modelo'

/** Janela de visualização adequada a cada família de funções. */
export const JANELAS: Record<Funcao['tipo'], Janela> = {
  afim: { xmin: -6, xmax: 6, ymin: -8, ymax: 10 },
  quadratica: { xmin: -6, xmax: 6, ymin: -8, ymax: 10 },
  exponencial: { xmin: -4, xmax: 5, ymin: -6, ymax: 12 },
  logaritmica: { xmin: -1, xmax: 10, ymin: -6, ymax: 6 },
}
