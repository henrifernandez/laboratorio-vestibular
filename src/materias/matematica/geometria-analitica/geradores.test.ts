import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { criarRng } from '@/lib/rng'
import { eqGeralCirc, eqReduzidaCirc } from './calculo'
import { gerarCircunferencia, gerarMedida, gerarPosicao } from './geradores'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void, ate = 150) => {
  for (let s = 1; s <= ate; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}

describe('gerarCircunferencia', () => {
  it('a opção certa descreve a circunferência dos dados; opções únicas e explicadas', () => {
    rodar((rng, n) => {
      const i = gerarCircunferencia(rng, n)
      const { h, k, r } = i.dados!
      if (n < 3) expect(i.certa).toBe(eqReduzidaCirc(h, k, r))
      else {
        expect(i.certa).toBe(`centro (${h}, ${k}) e raio ${r}`)
        expect(i.enunciado).toContain(eqGeralCirc(h, k, r))
      }
      expect(i.opcoes.map((o) => o.id)).toContain(i.certa)
      expect(i.opcoes).toHaveLength(4)
      expect(new Set(i.opcoes.map((o) => o.id)).size).toBe(4)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
  it('a equação geral anunciada realmente passa por pontos da circunferência (conferência numérica)', () => {
    rodar((rng, n) => {
      if (n !== 3) return
      const { h, k, r } = gerarCircunferencia(rng, n).dados!
      // x² + y² − 2hx − 2ky + (h² + k² − r²) em pontos do círculo deve ser 0
      for (const t of [0, 1, 2, 3, 4, 5]) {
        const x = h + r * Math.cos(t)
        const y = k + r * Math.sin(t)
        expect(x * x + y * y - 2 * h * x - 2 * k * y + (h * h + k * k - r * r)).toBeCloseTo(0, 9)
      }
    })
  })
})

describe('gerarMedida (geometria analítica)', () => {
  it('respostas batem com as fórmulas e os erros típicos diferem', () => {
    rodar((rng, n) => {
      const i = gerarMedida(rng, n)
      const d = i.dados!
      if (n === 1) {
        expect(i.resposta).toBeCloseTo(Math.hypot(d.q!.x - d.p!.x, d.q!.y - d.p!.y), 9)
        expect(Number.isInteger(i.resposta)).toBe(true)
      } else if (n === 2) {
        const m = i.enunciado.includes('coordenada x') ? (d.p!.x + d.q!.x) / 2 : (d.p!.y + d.q!.y) / 2
        expect(i.resposta).toBeCloseTo(m, 9)
      } else {
        const g = d.reta!
        expect(i.resposta).toBeCloseTo(Math.abs(g.a * d.p!.x + g.b * d.p!.y + g.c) / Math.hypot(g.a, g.b), 9)
        expect(Number.isInteger(i.resposta)).toBe(true)
        expect(i.resposta).toBeGreaterThan(0)
      }
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) {
        expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
        // se dois erros têm o mesmo valor, o corretor usa o primeiro da lista
        const primeiro = i.erros.find((x) => Math.abs(x.valor - e.valor) < 1e-9)!
        expect(corrigirNum(i, String(e.valor)).feedback).toBe(primeiro.frase)
      }
    })
  })
})

describe('gerarPosicao — conferido por varredura numérica', () => {
  it('ponto × circunferência', () => {
    rodar((rng, n) => {
      if (n !== 1) return
      const i = gerarPosicao(rng, n)
      const { centro, r, p } = i.dados!
      const d = Math.hypot(p!.x - centro!.x, p!.y - centro!.y)
      const esperado = Math.abs(d - r!) < 1e-9 ? 'sobre' : d < r! ? 'dentro' : 'fora'
      expect(i.certa).toBe(esperado)
      expect(r!).toBeGreaterThan(0)
    })
  })
  it('reta × circunferência: a menor distância ao longo da reta decide', () => {
    rodar((rng, n) => {
      if (n !== 2) return
      const i = gerarPosicao(rng, n)
      const { centro, r, reta: g } = i.dados!
      // varre pontos da reta ax + by + c = 0 e acha a menor distância ao centro
      const dir = { x: -g!.b, y: g!.a }
      const norma = Math.hypot(dir.x, dir.y)
      const base = { x: (-g!.a * g!.c) / (g!.a ** 2 + g!.b ** 2), y: (-g!.b * g!.c) / (g!.a ** 2 + g!.b ** 2) }
      let min = Infinity
      for (let t = -60; t <= 60; t += 0.01) {
        const q = { x: base.x + (dir.x / norma) * t, y: base.y + (dir.y / norma) * t }
        min = Math.min(min, Math.hypot(q.x - centro!.x, q.y - centro!.y))
      }
      const esperado = Math.abs(min - r!) < 0.01 ? 'tangente' : min < r! ? 'secante' : 'externa'
      expect(i.certa).toBe(esperado)
    }, 80)
  })
  it('retas: paralelas, perpendiculares ou concorrentes', () => {
    const vistos = new Set<string>()
    rodar((rng, n) => {
      if (n !== 3) return
      const i = gerarPosicao(rng, n)
      const a = i.dados!.reta!
      const b = i.dados!.retaB!
      const m1 = -a.a / a.b
      const m2 = -b.a / b.b
      const esperado = Math.abs(m1 - m2) < 1e-9 ? 'paralelas' : Math.abs(m1 * m2 + 1) < 1e-9 ? 'perpendiculares' : 'concorrentes'
      expect(i.certa).toBe(esperado)
      vistos.add(esperado)
      if (esperado === 'paralelas') expect(a.c).not.toBe(b.c)
    })
    expect([...vistos].sort()).toEqual(['concorrentes', 'paralelas', 'perpendiculares'])
  })
  it('todas as opções são explicadas e só uma é correta', () => {
    rodar((rng, n) => {
      const i = gerarPosicao(rng, n)
      expect(i.opcoes).toHaveLength(3)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
})
