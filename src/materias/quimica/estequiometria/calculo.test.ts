import { lerFormula, massaMolar, partesFormula } from '../comum/elementos'
import { REACOES, balancear, balanco, equacaoTexto, estaBalanceada, limitante, massaParaMassa, reacao } from './calculo'

describe('fórmulas e massas molares', () => {
  it('lê parênteses e índices', () => {
    expect(lerFormula('Al2(SO4)3')).toEqual({ Al: 2, S: 3, O: 12 })
    expect(lerFormula('Ca(OH)2')).toEqual({ Ca: 1, O: 2, H: 2 })
    expect(lerFormula('C2H5OH')).toEqual({ C: 2, H: 6, O: 1 })
  })
  it('massas molares conferem com somas feitas à mão', () => {
    expect(massaMolar('H2O')).toBe(18)
    expect(massaMolar('CO2')).toBe(44)
    expect(massaMolar('NH3')).toBe(17)
    expect(massaMolar('CaCO3')).toBe(100)
    expect(massaMolar('Al2(SO4)3')).toBe(342)
    expect(massaMolar('C6H12O6')).toBe(180)
    expect(massaMolar('HCl')).toBe(36.5)
  })
  it('separa os índices para desenhar', () => {
    expect(partesFormula('Ca(OH)2')).toEqual([
      { t: 'Ca(OH)', sub: false },
      { t: '2', sub: true },
    ])
    expect(partesFormula('H2SO4').map((p) => p.t)).toEqual(['H', '2', 'SO', '4'])
  })
})

describe('balanceamento', () => {
  it('o algoritmo reproduz os coeficientes de todas as reações da biblioteca', () => {
    for (const r of REACOES) expect(balancear(r.reagentes, r.produtos), r.id).toEqual(r.coefs)
  })
  it('todas as equações da biblioteca estão balanceadas átomo por átomo', () => {
    for (const r of REACOES) {
      expect(estaBalanceada(r, r.coefs), r.id).toBe(true)
      expect(Math.max(...r.coefs)).toBeLessThanOrEqual(13)
    }
  })
  it('detecta equação com coeficientes errados e diz qual elemento falha', () => {
    const r = reacao('agua')
    const b = balanco(r, [1, 1, 1])
    expect(estaBalanceada(r, [1, 1, 1])).toBe(false)
    expect(b.find((x) => x.elemento === 'H')).toEqual({ elemento: 'H', esquerda: 2, direita: 2 })
    expect(b.find((x) => x.elemento === 'O')).toEqual({ elemento: 'O', esquerda: 2, direita: 1 })
  })
  it('múltiplos dos coeficientes também balanceiam', () => {
    expect(estaBalanceada(reacao('amonia'), [2, 6, 4])).toBe(true)
  })
  it('equação sem solução devolve null', () => {
    expect(balancear(['H2'], ['O2'])).toBeNull()
  })
  it('escreve a equação', () => {
    expect(equacaoTexto(reacao('metano'))).toBe('CH4 + 2O2 → CO2 + 2H2O')
  })
})

describe('proporções', () => {
  it('N2 + 3 H2 → 2 NH3: 28 g de N2 formam 34 g de NH3', () => {
    expect(massaParaMassa(reacao('amonia'), 0, 2, 28)).toBeCloseTo(34, 9)
    expect(massaParaMassa(reacao('amonia'), 1, 2, 6)).toBeCloseTo(34, 9)
  })
  it('combustão do metano: 16 g de CH4 → 44 g de CO2 e 36 g de H2O', () => {
    const r = reacao('metano')
    expect(massaParaMassa(r, 0, 2, 16)).toBeCloseTo(44, 9)
    expect(massaParaMassa(r, 0, 3, 16)).toBeCloseTo(36, 9)
  })
  it('conserva a massa em todas as reações', () => {
    for (const r of REACOES) {
      const nr = r.reagentes.length
      const esq = r.reagentes.reduce((s, f, i) => s + (r.coefs[i] as number) * massaMolar(f), 0)
      const dir = r.produtos.reduce((s, f, i) => s + (r.coefs[nr + i] as number) * massaMolar(f), 0)
      expect(esq, r.id).toBeCloseTo(dir, 9)
    }
  })
  it('reagente limitante: 5 mol de N2 e 6 mol de H2', () => {
    const l = limitante(reacao('amonia'), [5, 6])
    expect(l.limitante).toBe(1)
    expect(l.avanco).toBeCloseTo(2, 9)
    expect(l.sobra[0]).toBeCloseTo(3, 9)
    expect(l.sobra[1]).toBeCloseTo(0, 9)
    expect(l.produtos[0]).toBeCloseTo(4, 9)
  })
  it('proporção exata não tem limitante', () => {
    expect(limitante(reacao('amonia'), [2, 6]).limitante).toBe(-1)
  })
})
