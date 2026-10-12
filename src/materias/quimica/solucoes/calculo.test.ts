import {
  CURVAS,
  concentracaoComum,
  concentracaoDiluida,
  curva,
  massaSolucaoSaturada,
  misturaSalAgua,
  misturar,
  molaridade,
  molaridadeDeTitulo,
  ppm,
  precipitado,
  precipitadoPorEvaporacao,
  solubilidade,
  volumeFinalDiluicao,
} from './calculo'

describe('concentrações', () => {
  it('g/L, mol/L, título e ppm com valores conhecidos', () => {
    expect(concentracaoComum(12, 0.3)).toBeCloseTo(40, 9)
    expect(molaridade(58.5, 58.5, 1)).toBeCloseTo(1, 9)
    expect(molaridade(20, 40, 0.5)).toBeCloseTo(1, 9)
    // HCl 36,5 % com d = 1,2 g/mL é 12 mol/L; H2SO4 98 % com d = 1,8 é 18 mol/L
    expect(molaridadeDeTitulo(36.5, 1.2, 36.5)).toBeCloseTo(12, 9)
    expect(molaridadeDeTitulo(98, 1.8, 98)).toBeCloseTo(18, 9)
    expect(ppm(0.5, 0.25)).toBeCloseTo(2, 9)
  })
  it('molaridade de título: 1 L de solução tem 1000·d g, dos quais τ % são soluto', () => {
    const MM = 40
    const viaMassas = (1000 * 1.2 * 20) / 100 / MM / 1
    expect(molaridadeDeTitulo(20, 1.2, MM)).toBeCloseTo(viaMassas, 9)
  })
})

describe('diluição e mistura', () => {
  it('diluir conserva a quantidade de soluto', () => {
    const c2 = concentracaoDiluida(6, 0.1, 0.3)
    expect(c2).toBeCloseTo(2, 9)
    expect(c2 * 0.3).toBeCloseTo(6 * 0.1, 9)
    expect(volumeFinalDiluicao(6, 0.1, 2)).toBeCloseTo(0.3, 9)
  })
  it('a mistura é a média ponderada pelos volumes, não a média simples', () => {
    expect(misturar(2, 1, 4, 1)).toBeCloseTo(3, 9)
    expect(misturar(2, 1, 4, 3)).toBeCloseTo(3.5, 9)
    expect(misturar(2, 1, 4, 3)).not.toBeCloseTo(3, 3)
  })
  it('a soma dos mols é conservada na mistura', () => {
    const c = misturar(1, 0.2, 5, 0.3)
    expect(c * 0.5).toBeCloseTo(1 * 0.2 + 5 * 0.3, 9)
  })
})

describe('curvas de solubilidade', () => {
  it('interpola linearmente e vale os pontos nas extremidades', () => {
    const A = curva('A')
    expect(solubilidade(A, 20)).toBe(30)
    expect(solubilidade(A, 30)).toBe(45)
    expect(solubilidade(A, 50)).toBe(85)
    expect(solubilidade(A, 70)).toBe(140)
    expect(solubilidade(A, -5)).toBe(10)
    expect(solubilidade(A, 200)).toBe(170)
  })
  it('em múltiplos de 10 °C todas as curvas dão números inteiros', () => {
    for (const c of CURVAS) for (let T = 0; T <= 80; T += 10) expect(Number.isInteger(solubilidade(c, T)), `${c.id} ${T}`).toBe(true)
  })
  it('a curva C diminui com a temperatura; A e B aumentam', () => {
    for (const c of CURVAS) {
      const diffs = c.pontos.slice(1).map((p, i) => p[1] - (c.pontos[i] as [number, number])[1])
      expect(diffs.every((d) => (c.decrescente ? d < 0 : d > 0))).toBe(true)
    }
  })
  it('classifica a mistura: insaturada, saturada e com corpo de fundo', () => {
    const A = curva('A')
    // a 40 °C cabem 60 g em 100 g de água, 120 g em 200 g
    expect(misturaSalAgua(A, 40, 100, 200).estado).toBe('insaturada')
    expect(misturaSalAgua(A, 40, 120, 200).estado).toBe('saturada')
    const r = misturaSalAgua(A, 40, 150, 200)
    expect(r.estado).toBe('corpo-de-fundo')
    expect(r.depositado).toBeCloseTo(30, 9)
    expect(r.dissolvido + r.depositado).toBeCloseTo(150, 9)
  })
  it('resfriar uma saturada a 60 °C até 20 °C em 200 g de água separa 160 g de A', () => {
    expect(precipitado(curva('A'), 200, 60, 20)).toBeCloseTo(160, 9)
  })
  it('para o sal C, esfriar não separa nada (dissolve mais) e aquecer separa', () => {
    const C = curva('C')
    expect(precipitado(C, 100, 60, 20)).toBe(0)
    expect(precipitado(C, 100, 20, 60)).toBeCloseTo(8, 9)
  })
  it('evaporação e massa da solução saturada', () => {
    expect(precipitadoPorEvaporacao(curva('A'), 60, 50)).toBeCloseTo(55, 9)
    expect(massaSolucaoSaturada(curva('A'), 60, 100)).toBeCloseTo(210, 9)
  })
  it('conservação: sal total = dissolvido final + cristais', () => {
    const A = curva('A')
    const agua = 300
    const total = (solubilidade(A, 80) * agua) / 100
    const cristais = precipitado(A, agua, 80, 40)
    expect(total - cristais).toBeCloseTo((solubilidade(A, 40) * agua) / 100, 9)
  })
})
