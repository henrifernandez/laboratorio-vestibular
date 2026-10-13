/* ======================================================================
   Geometria do desenho das células (animal, vegetal e bactéria): onde fica
   cada estrutura, o tamanho da caixa clicável e onde vai o rótulo. Fica
   separada do SVG para os testes conferirem que nada se sobrepõe e que
   tudo cabe dentro da célula.
   ====================================================================== */

import { larguraTexto } from '@/lib/rotulos'
import type { TipoCelular } from './calculo'

export const LARGURA_CEL = 360
export const ALTURA_CEL = 280
/** Recorte do desenho (viewBox) de cada tipo: a bactéria é baixa e dispensa a altura toda. */
export const QUADRO: Record<TipoCelular, string> = {
  animal: `0 0 ${LARGURA_CEL} ${ALTURA_CEL}`,
  vegetal: `0 0 ${LARGURA_CEL} ${ALTURA_CEL}`,
  bacteria: `0 46 ${LARGURA_CEL} 200`,
}
export const FONTE_ROTULO = 10.5
export const ALTURA_ROTULO = 16
/** Em telas estreitas os nomes crescem até este fator, para continuarem legíveis; o teste confere que ainda cabem. */
export const ESCALA_MAX_ROTULO = 1.2

export const NOME_CURTO: Record<string, string> = {
  nucleo: 'Núcleo',
  mitocondria: 'Mitocôndria',
  cloroplasto: 'Cloroplasto',
  rer: 'RE rugoso',
  rel: 'RE liso',
  golgi: 'Golgi',
  peroxissomo: 'Peroxissomo',
  vacuolo: 'Vacúolo central',
  ribossomo: 'Ribossomos',
  centriolo: 'Centríolo',
}

/** Largura × altura da caixa de cada estrutura (o desenho cabe nela; é também a área clicável e o destaque). */
export const TAMANHO: Record<string, readonly [number, number]> = {
  nucleo: [72, 72],
  mitocondria: [58, 32],
  cloroplasto: [62, 34],
  rer: [58, 30],
  rel: [54, 28],
  golgi: [50, 30],
  peroxissomo: [26, 26],
  ribossomo: [44, 30],
  centriolo: [40, 40],
  vacuolo: [114, 84],
}

export interface Peca {
  id: string
  x: number
  y: number
  /** centro do rótulo; sem rótulo quando a estrutura já foi rotulada em outra cópia (ou traz o nome dentro, como o vacúolo) */
  rotulo?: { x: number; y: number }
}

export const PECAS: Record<TipoCelular, Peca[]> = {
  animal: [
    { id: 'nucleo', x: 130, y: 114, rotulo: { x: 130, y: 64.9 } },
    { id: 'mitocondria', x: 290, y: 102, rotulo: { x: 290, y: 131.1 } },
    { id: 'mitocondria', x: 202, y: 166 },
    { id: 'rer', x: 176, y: 228, rotulo: { x: 176, y: 199.9 } },
    { id: 'rel', x: 60, y: 108, rotulo: { x: 60, y: 135.1 } },
    { id: 'golgi', x: 202, y: 116, rotulo: { x: 202, y: 87.9 } },
    { id: 'peroxissomo', x: 268, y: 174, rotulo: { x: 268, y: 200.1 } },
    { id: 'ribossomo', x: 138, y: 170, rotulo: { x: 68.8, y: 170 } },
    { id: 'centriolo', x: 190, y: 54, rotulo: { x: 247, y: 54 } },
  ],
  vegetal: [
    { id: 'vacuolo', x: 190, y: 142 },
    { id: 'nucleo', x: 84, y: 190, rotulo: { x: 84, y: 239.1 } },
    { id: 'cloroplasto', x: 76, y: 52, rotulo: { x: 76, y: 82.1 } },
    { id: 'cloroplasto', x: 292, y: 230 },
    { id: 'cloroplasto', x: 296, y: 90 },
    { id: 'mitocondria', x: 168, y: 52, rotulo: { x: 168, y: 81.1 } },
    { id: 'rer', x: 294, y: 126, rotulo: { x: 294, y: 154.1 } },
    { id: 'rel', x: 230, y: 224, rotulo: { x: 230, y: 196.9 } },
    { id: 'golgi', x: 164, y: 232, rotulo: { x: 164, y: 203.9 } },
    { id: 'peroxissomo', x: 246, y: 82, rotulo: { x: 246, y: 55.9 } },
    { id: 'ribossomo', x: 76, y: 134, rotulo: { x: 76, y: 105.9 } },
  ],
  bacteria: [
    { id: 'ribossomo', x: 84, y: 106, rotulo: { x: 84, y: 134.1 } },
    { id: 'ribossomo', x: 294, y: 160 },
  ],
}

/* ------------------------------------------------------------------ contornos */

/** Célula animal: superelipse (mais "cheia" que uma elipse, para caberem as organelas). */
export const ANIMAL = { cx: 180, cy: 142, a: 166, b: 120, n: 2.6 } as const
/** Retângulos arredondados: parede (por fora) e membrana (por dentro). */
export const VEGETAL = {
  parede: { x: 12, y: 22, w: 336, h: 240, r: 18 },
  membrana: { x: 22, y: 32, w: 316, h: 220, r: 12 },
} as const
export const BACTERIA = {
  parede: { x: 28, y: 70, w: 304, h: 148, r: 56 },
  membrana: { x: 37, y: 79, w: 286, h: 130, r: 47 },
} as const

/** Contorno da superelipse com uma ondulação leve (membrana de célula animal não é lisa). */
export function caminhoAnimal(pontos = 120): string {
  const { cx, cy, a, b, n } = ANIMAL
  const p: string[] = []
  for (let i = 0; i < pontos; i++) {
    const t = (i / pontos) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const onda = 1 + 0.012 * Math.sin(5 * t + 0.7) + 0.008 * Math.sin(9 * t)
    const x = cx + a * onda * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = cy + b * onda * Math.sign(s) * Math.abs(s) ** (2 / n)
    p.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return `${p.join(' ')} Z`
}

/** Curva fechada irregular em volta da origem (vacúolo, nucleoide). */
export function caminhoBolha(rx: number, ry: number, ondas: readonly [number, number, number][], pontos = 72): string {
  const p: string[] = []
  for (let i = 0; i < pontos; i++) {
    const t = (i / pontos) * Math.PI * 2
    const k = 1 + ondas.reduce((s, [amp, freq, fase]) => s + amp * Math.sin(freq * t + fase), 0)
    p.push(`${i === 0 ? 'M' : 'L'}${(rx * k * Math.cos(t)).toFixed(1)} ${(ry * k * Math.sin(t)).toFixed(1)}`)
  }
  return `${p.join(' ')} Z`
}

const dentroRetArred = (r: { x: number; y: number; w: number; h: number; r: number }, x: number, y: number, folga: number) => {
  const x0 = r.x + folga
  const y0 = r.y + folga
  const x1 = r.x + r.w - folga
  const y1 = r.y + r.h - folga
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const raio = Math.max(r.r - folga, 0)
  const qx = Math.min(Math.max(x, x0 + raio), x1 - raio)
  const qy = Math.min(Math.max(y, y0 + raio), y1 - raio)
  return Math.hypot(x - qx, y - qy) <= raio + 1e-9
}

/** O ponto está dentro da célula (dentro da membrana), com uma folga da borda? */
export function dentroDaCelula(tipo: TipoCelular, x: number, y: number, folga = 3): boolean {
  if (tipo === 'animal') {
    // a ondulação do contorno tira até 2 % do raio; a folga cobre isso
    const { cx, cy, a, b, n } = ANIMAL
    return (Math.abs(x - cx) / (a * 0.98 - folga)) ** n + (Math.abs(y - cy) / (b * 0.98 - folga)) ** n <= 1
  }
  return dentroRetArred(tipo === 'vegetal' ? VEGETAL.membrana : BACTERIA.membrana, x, y, folga)
}

/* ------------------------------------------------------------------ caixas (para testes e para o destaque) */

export interface Caixa {
  id: string
  x0: number
  y0: number
  x1: number
  y1: number
}

export const caixaDaPeca = (p: Peca): Caixa => {
  const [w, h] = TAMANHO[p.id] as readonly [number, number]
  return { id: p.id, x0: p.x - w / 2, y0: p.y - h / 2, x1: p.x + w / 2, y1: p.y + h / 2 }
}

export const larguraRotulo = (id: string, escala = 1) => larguraTexto(NOME_CURTO[id] as string, FONTE_ROTULO * escala, true) + 10 * escala

export const caixaDoRotulo = (p: Peca, escala = 1): Caixa | null => {
  if (!p.rotulo) return null
  const w = larguraRotulo(p.id, escala)
  const h = ALTURA_ROTULO * escala
  return { id: p.id, x0: p.rotulo.x - w / 2, y0: p.rotulo.y - h / 2, x1: p.rotulo.x + w / 2, y1: p.rotulo.y + h / 2 }
}

/** Duas caixas ficam a menos de `folga` uma da outra? */
export const encostam = (a: Caixa, b: Caixa, folga = 0) => !(a.x1 + folga <= b.x0 || b.x1 + folga <= a.x0 || a.y1 + folga <= b.y0 || b.y1 + folga <= a.y0)
