import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { criarRng } from '@/lib/rng'
import { exato, grausParaRad } from './calculo'
import { gerarConversao, gerarLocalizar, gerarSinais, gerarValor } from './geradores'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void, ate = 150) => {
  for (let s = 1; s <= ate; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}
const EPS = 1e-9
/** quadrante determinado pelo sinal das coordenadas do ponto no círculo (independente da implementação) */
function quadranteNumerico(graus: number): number {
  const x = Math.cos(grausParaRad(graus))
  const y = Math.sin(grausParaRad(graus))
  if (Math.abs(x) < EPS || Math.abs(y) < EPS) return 0
  return x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3
}

describe('gerarLocalizar', () => {
  it('a região certa bate com as coordenadas do ponto no círculo', () => {
    rodar((rng, n) => {
      const i = gerarLocalizar(rng, n)
      const d = i.dados!
      expect(i.certa).toBe(String(quadranteNumerico(d.graus)))
      expect(i.opcoes.map((o) => o.id)).toContain(i.certa)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
  it('nível 3 tem ângulos negativos, maiores que 360° e sobre eixos', () => {
    const vistos = new Set<string>()
    rodar((rng, n) => {
      if (n !== 3) return
      const g = gerarLocalizar(rng, n).dados!.graus
      if (g < 0) vistos.add('negativo')
      if (g > 360) vistos.add('maior')
      if (g % 90 === 0) vistos.add('eixo')
    })
    expect([...vistos].sort()).toEqual(['eixo', 'maior', 'negativo'])
  })
})

describe('gerarSinais', () => {
  it('a alternativa certa tem os sinais de sen, cos e tan do ângulo', () => {
    rodar((rng, n) => {
      const i = gerarSinais(rng, n)
      const g = i.dados!.graus
      const certa = i.opcoes.find((o) => o.id === i.certa)!.rotulo
      const sg = (v: number) => (v > 0 ? '+' : '−')
      const esperado = `sen ${sg(Math.sin(grausParaRad(g)))} · cos ${sg(Math.cos(grausParaRad(g)))} · tan ${sg(Math.tan(grausParaRad(g)))}`
      expect(certa).toBe(esperado)
      expect(new Set(i.opcoes.map((o) => o.rotulo)).size).toBe(4)
      for (const o of i.opcoes) expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
    })
  })
})

describe('gerarValor', () => {
  it('o valor certo bate numericamente com Math.sin/cos/tan, e a opção correta é única', () => {
    rodar((rng, n) => {
      const i = gerarValor(rng, n)
      const { fn, graus } = i.dados!
      const v = exato(fn, graus)
      expect(i.certa).toBe(v.texto)
      const r = grausParaRad(graus)
      if (v.existe) expect(v.num).toBeCloseTo(fn === 'sen' ? Math.sin(r) : fn === 'cos' ? Math.cos(r) : Math.tan(r), 9)
      else expect(Math.abs(Math.cos(r))).toBeLessThan(1e-9)
      expect(i.opcoes).toHaveLength(4)
      expect(new Set(i.opcoes.map((o) => o.id)).size).toBe(4)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
  it('nível 1 só usa 30°, 45° e 60°', () => {
    rodar((rng, n) => {
      if (n === 1) expect([30, 45, 60]).toContain(gerarValor(rng, n).dados!.graus)
    })
  })
})

describe('gerarConversao', () => {
  it('a resposta bate com a fórmula de conversão', () => {
    rodar((rng, n) => {
      const i = gerarConversao(rng, n)
      const t = i.dados!.tipo
      const txt = i.enunciado
      let m: RegExpMatchArray | null
      if (t === 'grausRad' && (m = txt.match(/Converta (\d+)° em radianos/))) expect(i.resposta).toBeCloseTo(Number(m[1]) / 180, 6)
      if (t === 'radianoDecimal' && (m = txt.match(/ângulo de (\d+) rad/))) expect(i.resposta).toBeCloseTo((Number(m[1]) * 180) / 3.14, 1)
      if (t === 'arco' && (m = txt.match(/arco de (\d+)° numa circunferência de raio (\d+) cm/))) expect(i.resposta).toBeCloseTo(Number(m[2]) * (Number(m[1]) / 180) * 3.14, 2)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) {
        expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
        expect(corrigirNum(i, String(e.valor)).feedback).toBe(e.frase)
      }
    })
  })
  it('aceita a resposta em fração (5/6 para 150°)', () => {
    let achou = false
    rodar((rng, n) => {
      const i = gerarConversao(rng, n)
      const m = i.enunciado.match(/Converta (\d+)° em radianos/)
      if (m && Number(m[1]) === 150) {
        achou = true
        expect(corrigirNum(i, '5/6').correto).toBe(true)
      }
    }, 300)
    expect(achou).toBe(true)
  })
})
