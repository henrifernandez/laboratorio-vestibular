import { apotema, geratriz, type Dimensoes, type Solido } from './calculo'

export type Peca =
  | { tipo: 'poligono'; pontos: [number, number][]; rotulo: string; lateral: boolean }
  | { tipo: 'circulo'; cx: number; cy: number; raio: number; rotulo: string; lateral: boolean }
  | { tipo: 'setor'; cx: number; cy: number; raio: number; /** ângulo em radianos, começando em `inicio` */ angulo: number; inicio: number; rotulo: string; lateral: boolean }

const retangulo = (x: number, y: number, w: number, h: number, rotulo: string, lateral: boolean): Peca => ({
  tipo: 'poligono',
  pontos: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
  rotulo,
  lateral,
})

/** Planificação do sólido em peças planas (eixo y para cima). A esfera não se planifica. */
export function rede(s: Solido, d: Dimensoes): Peca[] {
  const a = d.a ?? 0
  const b = d.b ?? 0
  const r = d.r ?? 0
  const h = d.h ?? 0
  switch (s) {
    case 'prisma':
      return [
        retangulo(0, 0, a, b, 'base', false),
        retangulo(0, b, a, h, 'lado', true),
        retangulo(0, -h, a, h, 'lado', true),
        retangulo(-h, 0, h, b, 'lado', true),
        retangulo(a, 0, h, b, 'lado', true),
        retangulo(0, b + h, a, b, 'topo', false),
      ]
    case 'cilindro': {
      const c = 2 * Math.PI * r
      return [
        retangulo(0, 0, c, h, 'lateral', true),
        { tipo: 'circulo', cx: c / 2, cy: h + r, raio: r, rotulo: 'topo', lateral: false },
        { tipo: 'circulo', cx: c / 2, cy: -r, raio: r, rotulo: 'base', lateral: false },
      ]
    }
    case 'cone': {
      const g = geratriz(r, h)
      const angulo = (2 * Math.PI * r) / g
      return [
        { tipo: 'setor', cx: 0, cy: 0, raio: g, angulo, inicio: -Math.PI / 2 - angulo / 2, rotulo: 'lateral', lateral: true },
        { tipo: 'circulo', cx: 0, cy: -g - r, raio: r, rotulo: 'base', lateral: false },
      ]
    }
    case 'piramide': {
      const ap = apotema(a, h)
      return [
        retangulo(0, 0, a, a, 'base', false),
        { tipo: 'poligono', pontos: [[0, a], [a, a], [a / 2, a + ap]], rotulo: 'face', lateral: true },
        { tipo: 'poligono', pontos: [[0, 0], [a, 0], [a / 2, -ap]], rotulo: 'face', lateral: true },
        { tipo: 'poligono', pontos: [[0, 0], [0, a], [-ap, a / 2]], rotulo: 'face', lateral: true },
        { tipo: 'poligono', pontos: [[a, 0], [a, a], [a + ap, a / 2]], rotulo: 'face', lateral: true },
      ]
    }
    case 'esfera':
      return []
  }
}

export function areaPeca(p: Peca): number {
  if (p.tipo === 'circulo') return Math.PI * p.raio ** 2
  if (p.tipo === 'setor') return 0.5 * p.raio ** 2 * p.angulo
  let soma = 0
  for (let i = 0; i < p.pontos.length; i++) {
    const [x1, y1] = p.pontos[i] as [number, number]
    const [x2, y2] = p.pontos[(i + 1) % p.pontos.length] as [number, number]
    soma += x1 * y2 - x2 * y1
  }
  return Math.abs(soma) / 2
}

export function limitesRede(pecas: Peca[]) {
  const xs: number[] = []
  const ys: number[] = []
  for (const p of pecas) {
    if (p.tipo === 'poligono') {
      for (const [x, y] of p.pontos) {
        xs.push(x)
        ys.push(y)
      }
    } else if (p.tipo === 'circulo') {
      xs.push(p.cx - p.raio, p.cx + p.raio)
      ys.push(p.cy - p.raio, p.cy + p.raio)
    } else {
      // limites do setor: centro, pontas e pontos do arco
      for (let k = 0; k <= 24; k++) {
        const t = p.inicio + (p.angulo * k) / 24
        xs.push(p.cx + p.raio * Math.cos(t))
        ys.push(p.cy + p.raio * Math.sin(t))
      }
      xs.push(p.cx)
      ys.push(p.cy)
    }
  }
  return { xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys), ymax: Math.max(...ys) }
}

export type DefeitoRede = 'correta' | 'larguraErrada' | 'setorErrado' | 'faltaFace' | 'faceExtra'

/** A planificação correta, ou uma versão com um defeito típico (medida que não encaixa, face a menos ou a mais). */
export function redeComDefeito(s: Solido, d: Dimensoes, defeito: DefeitoRede): Peca[] {
  const base = rede(s, d)
  if (defeito === 'correta') return base
  const copia = base.map((p) => ({ ...p })) as Peca[]
  if (defeito === 'faltaFace') return copia.slice(0, -1)
  if (defeito === 'faceExtra') {
    const ultima = copia[copia.length - 1] as Peca
    if (ultima.tipo === 'circulo') return [...copia, { ...ultima, cx: ultima.cx + 2.4 * ultima.raio, cy: ultima.cy }]
    if (ultima.tipo === 'poligono') {
      const xs = ultima.pontos.map((p) => p[0])
      const dx = Math.max(...xs) - Math.min(...xs) + 0.4
      return [...copia, { ...ultima, pontos: ultima.pontos.map(([x, y]) => [x + dx * 1.1, y] as [number, number]), rotulo: ultima.rotulo }]
    }
    return copia
  }
  if (defeito === 'setorErrado') return copia.map((p) => (p.tipo === 'setor' ? { ...p, angulo: p.angulo * 0.7, inicio: p.inicio + (p.angulo * 0.3) / 2 } : p))
  // larguraErrada
  if (s === 'cilindro') {
    return copia.map((p) => (p.tipo === 'poligono' ? { ...p, pontos: p.pontos.map(([x, y]) => [x * 1.4, y] as [number, number]) } : p.tipo === 'circulo' ? { ...p, cx: p.cx * 1.4 } : p))
  }
  if (s === 'piramide') {
    const [primeira, ...resto] = copia
    const alterados = resto.map((p, i) =>
      p.tipo === 'poligono' && i === 0 ? { ...p, pontos: p.pontos.map(([x, y]) => [(x - (d.a ?? 0) / 2) * 1.35 + (d.a ?? 0) / 2, y] as [number, number]) } : p,
    )
    return [primeira as Peca, ...alterados]
  }
  // prisma: uma face lateral mais curta
  return copia.map((p, i) => (i === 1 && p.tipo === 'poligono' ? { ...p, pontos: p.pontos.map(([x, y]) => [x * 0.65, y] as [number, number]) } : p))
}
