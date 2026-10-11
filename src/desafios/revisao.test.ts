import { criarRng } from '@/lib/rng'
import { pesoRevisao, sortearItem, type ItemRevisao } from './revisao'
import type { Progresso } from './progresso'

const itens: ItemRevisao[] = [
  { chave: 'a:1', id: 'a', nivel: 1 },
  { chave: 'a:2', id: 'a', nivel: 2 },
  { chave: 'b:1', id: 'b', nivel: 1 },
]

describe('revisão mista', () => {
  it('peso base 1 para quem nunca errou, maior para quem mais errou', () => {
    const p: Progresso = { 'a:2': { tentativas: 4, acertos: 1, ultimo: false, data: '2026-10-01' } }
    expect(pesoRevisao(p, 'a:1')).toBe(1)
    expect(pesoRevisao(p, 'a:2')).toBe(1 + 3 * 3 + 1) // 3 erros e último errado
  })

  it('o último resultado errado pesa um pouco mais que o último certo', () => {
    const errou: Progresso = { x: { tentativas: 2, acertos: 1, ultimo: false, data: '2026-10-01' } }
    const acertou: Progresso = { x: { tentativas: 2, acertos: 1, ultimo: true, data: '2026-10-01' } }
    expect(pesoRevisao(errou, 'x')).toBeGreaterThan(pesoRevisao(acertou, 'x'))
  })

  it('sorteia priorizando os mais errados, mas ainda dá chance aos outros', () => {
    const p: Progresso = { 'a:2': { tentativas: 6, acertos: 1, ultimo: false, data: '2026-10-01' } }
    const rng = criarRng(5)
    const cont: Record<string, number> = {}
    for (let i = 0; i < 2000; i++) {
      const it = sortearItem(itens, p, rng)
      cont[it.chave] = (cont[it.chave] ?? 0) + 1
    }
    expect(cont['a:2']).toBeGreaterThan(cont['a:1']! * 5)
    expect(cont['a:1']).toBeGreaterThan(50)
    expect(cont['b:1']).toBeGreaterThan(50)
  })

  it('evita repetir o mesmo item quando há alternativa', () => {
    const rng = criarRng(1)
    for (let i = 0; i < 200; i++) expect(sortearItem(itens, {}, rng, 'a:1').chave).not.toBe('a:1')
  })

  it('com um único item, devolve ele mesmo', () => {
    const um = [itens[0]!]
    expect(sortearItem(um, {}, criarRng(1), 'a:1').chave).toBe('a:1')
  })
})
