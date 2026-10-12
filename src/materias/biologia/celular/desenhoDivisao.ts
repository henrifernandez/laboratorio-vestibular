import type { TipoDivisao } from './calculo'

/* ======================================================================
   Desenho esquemático das fases da mitose e da meiose para um organismo 2n = 4
   (dois pares de homólogos: um par longo e um par curto; M = origem materna, P = paterna).
   O desenho é calculado aqui (posições) e só então desenhado em SVG; os testes conferem
   o número de células, cromossomos e cromátides contra a tabela de `contagem`.
   ====================================================================== */

export type Origem = 'M' | 'P'

export interface Cromo {
  x: number
  y: number
  comprimento: number
  origem: Origem
  par: 1 | 2
  /** 1 = cromossomo simples; 2 = duplicado (duas cromátides-irmãs) */
  cromatides: 1 | 2
}

export interface CelulaDesenho {
  cx: number
  cy: number
  rx: number
  ry: number
  /** envoltório nuclear presente */
  nucleo: boolean
  cromos: Cromo[]
}

export type Disposicao = 'dispersos' | 'pareados' | 'equador' | 'equador-pareados' | 'polos' | 'nucleo'

export interface Desenho {
  celulas: CelulaDesenho[]
  disposicao: Disposicao
  /** fibras do fuso visíveis */
  fuso: boolean
}

export const LARGURA = 340
export const ALTURA = 200
const COMP = { 1: 36, 2: 24 } as const
const Y1 = 62
const Y2 = 130
const COLUNA = [46, 90, 128, 160] as const // centros de M1, P1, M2, P2 empilhados na placa metafásica

const cromo = (x: number, y: number, origem: Origem, par: 1 | 2, cromatides: 1 | 2): Cromo => ({ x, y, comprimento: COMP[par], origem, par, cromatides })

const UMA: Pick<CelulaDesenho, 'cx' | 'cy' | 'rx' | 'ry'> = { cx: 170, cy: 100, rx: 150, ry: 88 }
const DUAS: Pick<CelulaDesenho, 'cx' | 'cy' | 'rx' | 'ry'>[] = [
  { cx: 95, cy: 100, rx: 72, ry: 88 },
  { cx: 245, cy: 100, rx: 72, ry: 88 },
]
const QUATRO: Pick<CelulaDesenho, 'cx' | 'cy' | 'rx' | 'ry'>[] = [
  { cx: 88, cy: 52, rx: 72, ry: 44 },
  { cx: 252, cy: 52, rx: 72, ry: 44 },
  { cx: 88, cy: 148, rx: 72, ry: 44 },
  { cx: 252, cy: 148, rx: 72, ry: 44 },
]

type Item = [Origem, 1 | 2]
const DESLOC4: [number, number][] = [
  [-22, -14],
  [10, -18],
  [-8, 18],
  [24, 16],
]
const DESLOC2: [number, number][] = [
  [-14, -8],
  [14, 10],
]

/** Cromossomos agrupados dentro de um núcleo centrado em (cx, cy). */
function dentroDoNucleo(cx: number, cy: number, itens: Item[], cromatides: 1 | 2): Cromo[] {
  const desloc = itens.length === 4 ? DESLOC4 : DESLOC2
  return itens.map(([origem, par], i) => cromo(cx + (desloc[i] as [number, number])[0], cy + (desloc[i] as [number, number])[1], origem, par, cromatides))
}

const QUATRO_ITENS: Item[] = [
  ['M', 1],
  ['P', 1],
  ['M', 2],
  ['P', 2],
]

const celula = (base: Pick<CelulaDesenho, 'cx' | 'cy' | 'rx' | 'ry'>, nucleo: boolean, cromos: Cromo[]): CelulaDesenho => ({ ...base, nucleo, cromos })

/** Os dois cromossomos (um de cada par) que cada célula-filha recebe depois da meiose I. */
const FILHA_ESQUERDA: Item[] = [
  ['M', 1],
  ['P', 2],
]
const FILHA_DIREITA: Item[] = [
  ['P', 1],
  ['M', 2],
]

export function desenhar(tipo: TipoDivisao, fase: string): Desenho {
  const u = UMA
  if (fase === 'G1') return { celulas: [celula(u, true, dentroDoNucleo(u.cx, u.cy, QUATRO_ITENS, 1))], disposicao: 'nucleo', fuso: false }
  if (fase === 'S/G2') return { celulas: [celula(u, true, dentroDoNucleo(u.cx, u.cy, QUATRO_ITENS, 2))], disposicao: 'nucleo', fuso: false }

  if (tipo === 'mitose') {
    switch (fase) {
      case 'Prófase':
        return {
          celulas: [celula(u, false, [cromo(118, 78, 'M', 1, 2), cromo(205, 70, 'P', 1, 2), cromo(150, 126, 'M', 2, 2), cromo(228, 122, 'P', 2, 2)])],
          disposicao: 'dispersos',
          fuso: false,
        }
      case 'Metáfase':
        return { celulas: [celula(u, false, QUATRO_ITENS.map(([o, p], i) => cromo(170, COLUNA[i] as number, o, p, 2)))], disposicao: 'equador', fuso: true }
      case 'Anáfase':
        return {
          celulas: [celula(u, false, [100, 240].flatMap((x) => QUATRO_ITENS.map(([o, p], i) => cromo(x, COLUNA[i] as number, o, p, 1))))],
          disposicao: 'polos',
          fuso: true,
        }
      case 'Telófase':
        return { celulas: DUAS.map((c) => celula(c, true, dentroDoNucleo(c.cx, c.cy, QUATRO_ITENS, 1))), disposicao: 'nucleo', fuso: false }
    }
  } else {
    switch (fase) {
      case 'Prófase I':
        return {
          celulas: [celula(u, false, [cromo(112, 72, 'M', 1, 2), cromo(127, 72, 'P', 1, 2), cromo(212, 126, 'M', 2, 2), cromo(227, 126, 'P', 2, 2)])],
          disposicao: 'pareados',
          fuso: false,
        }
      case 'Metáfase I':
        return {
          celulas: [celula(u, false, [cromo(163, Y1, 'M', 1, 2), cromo(177, Y1, 'P', 1, 2), cromo(163, Y2, 'P', 2, 2), cromo(177, Y2, 'M', 2, 2)])],
          disposicao: 'equador-pareados',
          fuso: true,
        }
      case 'Anáfase I':
        return {
          celulas: [celula(u, false, [cromo(100, Y1, 'M', 1, 2), cromo(100, Y2, 'P', 2, 2), cromo(240, Y1, 'P', 1, 2), cromo(240, Y2, 'M', 2, 2)])],
          disposicao: 'polos',
          fuso: true,
        }
      case 'Telófase I':
        return {
          celulas: [celula(DUAS[0] as CelulaDesenho, true, dentroDoNucleo(95, 100, FILHA_ESQUERDA, 2)), celula(DUAS[1] as CelulaDesenho, true, dentroDoNucleo(245, 100, FILHA_DIREITA, 2))],
          disposicao: 'nucleo',
          fuso: false,
        }
      case 'Prófase II':
        return {
          celulas: [
            celula(DUAS[0] as CelulaDesenho, false, [cromo(78, 70, 'M', 1, 2), cromo(112, 128, 'P', 2, 2)]),
            celula(DUAS[1] as CelulaDesenho, false, [cromo(228, 72, 'P', 1, 2), cromo(262, 124, 'M', 2, 2)]),
          ],
          disposicao: 'dispersos',
          fuso: false,
        }
      case 'Metáfase II':
        return {
          celulas: [
            celula(DUAS[0] as CelulaDesenho, false, [cromo(95, Y1, 'M', 1, 2), cromo(95, Y2, 'P', 2, 2)]),
            celula(DUAS[1] as CelulaDesenho, false, [cromo(245, Y1, 'P', 1, 2), cromo(245, Y2, 'M', 2, 2)]),
          ],
          disposicao: 'equador',
          fuso: true,
        }
      case 'Anáfase II':
        return {
          celulas: [
            celula(DUAS[0] as CelulaDesenho, false, [69, 121].flatMap((x) => [cromo(x, Y1, 'M', 1, 1), cromo(x, Y2, 'P', 2, 1)])),
            celula(DUAS[1] as CelulaDesenho, false, [219, 271].flatMap((x) => [cromo(x, Y1, 'P', 1, 1), cromo(x, Y2, 'M', 2, 1)])),
          ],
          disposicao: 'polos',
          fuso: true,
        }
      case 'Telófase II':
        return {
          celulas: QUATRO.map((c, i) => celula(c, true, dentroDoNucleo(c.cx, c.cy, i % 2 === 0 ? FILHA_ESQUERDA : FILHA_DIREITA, 1))),
          disposicao: 'nucleo',
          fuso: false,
        }
    }
  }
  throw new Error(`fase desconhecida: ${tipo} ${fase}`)
}

const NUM = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito']
const TEXTO_DISPOSICAO: Record<Disposicao, string> = {
  dispersos: 'espalhados pela célula, sem núcleo delimitado',
  pareados: 'espalhados pela célula, com cada cromossomo colado ao seu homólogo (pares de cromossomos juntos)',
  equador: 'enfileirados no equador da célula, presos às fibras do fuso',
  'equador-pareados': 'enfileirados no equador da célula, em pares de homólogos (cada cromossomo ao lado do seu homólogo)',
  polos: 'divididos em dois grupos que se afastam, cada um indo para um polo da célula',
  nucleo: 'agrupados dentro de um núcleo delimitado',
}

/** Descrição do desenho para quem não o vê: o que há na figura, sem dizer o nome da fase. */
export function descreverDesenho(d: Desenho): string {
  const n = d.celulas.length
  const c = d.celulas[0] as CelulaDesenho
  const qtd = c.cromos.length
  const simples = c.cromos[0]?.cromatides === 1
  const duas = n > 1
  const cels = n === 1 ? 'uma célula' : `${NUM[n]} células`
  const cromos = `${duas ? 'cada uma com ' : 'com '}${NUM[qtd]} cromossomos ${simples ? 'simples (uma cromátide cada)' : 'duplicados (duas cromátides-irmãs cada)'}`
  return `Desenho de ${cels} (organismo 2n = 4), ${cromos}, ${TEXTO_DISPOSICAO[d.disposicao]}.`
}
