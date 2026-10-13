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
  bacteria: `0 56 ${LARGURA_CEL} 168`,
}
export const FONTE_ROTULO = 10.5
export const ALTURA_ROTULO = 16

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
  vacuolo: [128, 96],
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
    { id: 'nucleo', x: 112, y: 146, rotulo: { x: 112, y: 193 } },
    { id: 'mitocondria', x: 246, y: 64, rotulo: { x: 246, y: 91 } },
    { id: 'mitocondria', x: 234, y: 228 },
    { id: 'rer', x: 108, y: 222, rotulo: { x: 171, y: 222 } },
    { id: 'rel', x: 282, y: 192, rotulo: { x: 282, y: 167 } },
    { id: 'golgi', x: 292, y: 120, rotulo: { x: 292, y: 146 } },
    { id: 'peroxissomo', x: 160, y: 58, rotulo: { x: 160, y: 82 } },
    { id: 'ribossomo', x: 76, y: 74, rotulo: { x: 76, y: 100 } },
    { id: 'centriolo', x: 204, y: 132, rotulo: { x: 204, y: 163 } },
  ],
  vegetal: [
    { id: 'vacuolo', x: 198, y: 140 },
    { id: 'nucleo', x: 68, y: 132, rotulo: { x: 68, y: 179 } },
    { id: 'cloroplasto', x: 300, y: 78, rotulo: { x: 300, y: 106 } },
    { id: 'cloroplasto', x: 302, y: 162 },
    { id: 'cloroplasto', x: 292, y: 226 },
    { id: 'mitocondria', x: 120, y: 226, rotulo: { x: 120, y: 199 } },
    { id: 'rer', x: 96, y: 58, rotulo: { x: 96, y: 84 } },
    { id: 'rel', x: 156, y: 52, rotulo: { x: 156, y: 77 } },
    { id: 'golgi', x: 52, y: 226, rotulo: { x: 52, y: 200 } },
    { id: 'peroxissomo', x: 226, y: 50, rotulo: { x: 226, y: 74 } },
    { id: 'ribossomo', x: 198, y: 228, rotulo: { x: 198, y: 202 } },
  ],
  bacteria: [
    { id: 'ribossomo', x: 82, y: 140 },
    { id: 'ribossomo', x: 276, y: 124, rotulo: { x: 276, y: 150 } },
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
  parede: { x: 28, y: 80, w: 304, h: 120, r: 60 },
  membrana: { x: 37, y: 89, w: 286, h: 102, r: 51 },
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

export const larguraRotulo = (id: string) => larguraTexto(NOME_CURTO[id] as string, FONTE_ROTULO, true) + 10

export const caixaDoRotulo = (p: Peca): Caixa | null => {
  if (!p.rotulo) return null
  const w = larguraRotulo(p.id)
  return { id: p.id, x0: p.rotulo.x - w / 2, y0: p.rotulo.y - ALTURA_ROTULO / 2, x1: p.rotulo.x + w / 2, y1: p.rotulo.y + ALTURA_ROTULO / 2 }
}

/** Duas caixas ficam a menos de `folga` uma da outra? */
export const encostam = (a: Caixa, b: Caixa, folga = 0) => !(a.x1 + folga <= b.x0 || b.x1 + folga <= a.x0 || a.y1 + folga <= b.y0 || b.y1 + folga <= a.y0)
