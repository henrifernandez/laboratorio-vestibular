import { criarRng } from './rng'
import { espalhar, larguraTexto, semSobreposicao } from './rotulos'

describe('espalhar rótulos', () => {
  it('rótulos que não se tocam ficam exatamente nos alvos', () => {
    const c = espalhar(
      [
        { alvo: 50, tamanho: 20 },
        { alvo: 120, tamanho: 30 },
      ],
      0,
      300,
    )
    expect(c).toEqual([50, 120])
  })
  it('dois rótulos sobrepostos se afastam simetricamente em torno da média', () => {
    const c = espalhar(
      [
        { alvo: 100, tamanho: 20 },
        { alvo: 104, tamanho: 20 },
      ],
      0,
      300,
      4,
    )
    expect(c[1]! - c[0]!).toBeCloseTo(24)
    expect((c[0]! + c[1]!) / 2).toBeCloseTo(102)
  })
  it('respeita os limites e a ordem, mesmo com entrada fora de ordem', () => {
    const c = espalhar(
      [
        { alvo: 5, tamanho: 30 },
        { alvo: 2, tamanho: 30 },
      ],
      0,
      300,
      4,
    )
    // o de alvo 2 vem antes (à esquerda) e ninguém sai do quadro
    expect(c[1]!).toBeLessThan(c[0]!)
    expect(c[1]! - 15).toBeGreaterThanOrEqual(0)
  })
  it('em sorteios aleatórios, nenhum rótulo se sobrepõe, a ordem se mantém e todos cabem quando há espaço', () => {
    for (let s = 1; s <= 300; s++) {
      const rng = criarRng(s)
      const n = 2 + Math.floor(rng() * 9)
      const itens = Array.from({ length: n }, () => ({ alvo: rng() * 300, tamanho: 8 + rng() * 40 }))
      const total = itens.reduce((a, i) => a + i.tamanho, 0) + 4 * (n - 1)
      const c = espalhar(itens, 0, Math.max(300, total), 4)
      expect(semSobreposicao(c, itens.map((i) => i.tamanho), 4 - 1e-6), `semente ${s}`).toBe(true)
      const porAlvo = itens.map((_, i) => i).sort((a, b) => itens[a]!.alvo - itens[b]!.alvo)
      for (let k = 1; k < n; k++) expect(c[porAlvo[k]!]!, `ordem ${s}`).toBeGreaterThan(c[porAlvo[k - 1]!]!)
      for (let i = 0; i < n; i++) {
        expect(c[i]! - itens[i]!.tamanho / 2, `limite ${s}`).toBeGreaterThanOrEqual(-1e-6)
        expect(c[i]! + itens[i]!.tamanho / 2, `limite ${s}`).toBeLessThanOrEqual(Math.max(300, total) + 1e-6)
      }
    }
  })
  it('a largura estimada cresce com o texto e com o negrito', () => {
    expect(larguraTexto('leite de magnésia', 11)).toBeGreaterThan(larguraTexto('limão', 11))
    expect(larguraTexto('limão', 11, true)).toBeGreaterThan(larguraTexto('limão', 11))
    // ordem de grandeza: cerca de 6 unidades por letra em fonte 11
    expect(larguraTexto('bicarbonato', 11)).toBeGreaterThan(50)
    expect(larguraTexto('bicarbonato', 11)).toBeLessThan(80)
  })
})
