import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { criarRng } from '@/lib/rng'
import { distanciaFrenagem, encontro, kmhParaMs, posicao } from './calculo'
import { AMOSTRAS, gerarCalculo, gerarGraficos } from './geradores'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void, ate = 150) => {
  for (let s = 1; s <= ate; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}

describe('gerarGraficos', () => {
  it('uma única alternativa certa; todas explicadas; curvas distintas entre si', () => {
    rodar((rng, n) => {
      const i = gerarGraficos(rng, n)
      expect(i.opcoes).toHaveLength(4)
      expect(i.opcoes.map((o) => o.id)).toContain(i.certa)
      const d = i.dados!
      const chaves = Object.values(d.opcoes).map((o) => o.curva.y.map((v) => v.toFixed(3)).join(','))
      expect(new Set(chaves).size).toBe(4)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
        expect(d.opcoes[o.id]!.curva.y).toHaveLength(AMOSTRAS)
      }
      expect(d.opcoes[i.certa]!.tipo).toBe('correta')
    })
  })
  it('a curva correta é a derivada da posição: ∫v dt = x(T) − x(0) e v acompanha a inclinação de x(t)', () => {
    rodar((rng, n) => {
      const d = gerarGraficos(rng, n).dados!
      const certaId = Object.entries(d.opcoes).find(([, o]) => o.tipo === 'correta')![0]
      const v = d.opcoes[certaId]!.curva.y
      const x = d.posicao.y
      const dt = d.T / (AMOSTRAS - 1)
      let integral = 0
      for (let k = 1; k < AMOSTRAS; k++) integral += ((v[k]! + v[k - 1]!) / 2) * dt
      expect(integral).toBeCloseTo(x[AMOSTRAS - 1]! - x[0]!, 1)
      // inclinação média de cada pequeno intervalo vs. média de v nele
      for (let k = 1; k < AMOSTRAS; k++) expect((x[k]! - x[k - 1]!) / dt).toBeCloseTo((v[k]! + v[k - 1]!) / 2, 1)
    })
  })
  it('os tipos de erro aparecem coerentes: negada é o oposto, posição repete x(t)', () => {
    rodar((rng, n) => {
      const d = gerarGraficos(rng, n).dados!
      const por = Object.values(d.opcoes)
      const certa = por.find((o) => o.tipo === 'correta')!
      const negada = por.find((o) => o.tipo === 'negada')
      if (negada) negada.curva.y.forEach((y, k) => expect(y).toBeCloseTo(-certa.curva.y[k]!, 5))
      const pos = por.find((o) => o.tipo === 'posicao')
      if (pos) pos.curva.y.forEach((y, k) => expect(y).toBeCloseTo(d.posicao.y[k]!, 5))
    })
  })
})

describe('gerarCalculo — conferido com o cálculo independente', () => {
  it('cada tipo de problema bate com as funções de física', () => {
    const vistos = new Set<string>()
    rodar((rng, n) => {
      const i = gerarCalculo(rng, n)
      const t = i.enunciado
      let m: RegExpMatchArray | null
      let esperado: number
      if ((m = t.match(/(\d+) km\/h\. Que distância, em metros, ele percorre em (\d+) s/))) {
        esperado = kmhParaMs(Number(m[1])) * Number(m[2])
        vistos.add('kmh')
      } else if ((m = t.match(/viagem de (\d+) km foi feita em (\d+) horas/))) {
        esperado = Number(m[1]) / Number(m[2])
        vistos.add('vmedia')
      } else if ((m = t.match(/aceleração constante de (\d+) m\/s²\. Que distância percorre em (\d+) s/))) {
        esperado = posicao({ x0: 0, v0: 0, a: Number(m[1]) }, Number(m[2]))
        vistos.add('mruv')
      } else if ((m = t.match(/a (\d+) m\/s freia com desaceleração constante de (\d+) m\/s²/))) {
        esperado = distanciaFrenagem(Number(m[1]), Number(m[2]))
        vistos.add('frenagem')
      } else if ((m = t.match(/velocidade (\d+) m\/s e aceleração constante de (\d+) m\/s².*depois/))) {
        esperado = Number(m[1]) + Number(m[2]) * Number(t.match(/(\d+) s depois/)![1])
        vistos.add('v=v0+at')
      } else if ((m = t.match(/separados por (\d+) m\. Suas velocidades constantes são (\d+) m\/s e (\d+) m\/s/))) {
        const e = encontro({ x0: 0, v0: Number(m[2]), a: 0 }, { x0: Number(m[1]), v0: -Number(m[3]), a: 0 })
        esperado = e[0]!.t
        vistos.add('encontro-oposto')
      } else if ((m = t.match(/Um carro a (\d+) m\/s persegue outro, (\d+) m à sua frente, que anda a (\d+) m\/s/))) {
        const e = encontro({ x0: 0, v0: Number(m[1]), a: 0 }, { x0: Number(m[2]), v0: Number(m[3]), a: 0 })
        esperado = e[0]!.t
        vistos.add('encontro-mesmo')
      } else throw new Error(`modelo sem verificação: ${t}`)
      expect(i.resposta).toBeCloseTo(esperado, 9)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) {
        expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
        const primeiro = i.erros.find((x) => Math.abs(x.valor - e.valor) <= i.tolerancia)!
        expect(corrigirNum(i, String(e.valor)).feedback).toBe(primeiro.frase)
      }
    })
    expect([...vistos].sort()).toEqual(['encontro-mesmo', 'encontro-oposto', 'frenagem', 'kmh', 'mruv', 'v=v0+at', 'vmedia'])
  })
})
