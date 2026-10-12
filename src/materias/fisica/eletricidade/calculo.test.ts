import { R, consumoMensal, correnteTotal, custo, energiaKWh, montar, paralelo, potencia, potenciaComNovaTensao, queimar, req, resolver, serie } from './calculo'

describe('resistência equivalente', () => {
  it('série soma, paralelo soma os inversos', () => {
    expect(req(serie(R(10), R(20), R(30)))).toBe(60)
    expect(req(paralelo(R(30), R(60)))).toBeCloseTo(20)
    expect(req(paralelo(R(12), R(12), R(12)))).toBeCloseTo(4)
  })
  it('mistos', () => {
    expect(req(montar('misto', [4, 6, 12]))).toBeCloseTo(8) // 4 + 6‖12 = 4 + 4
    expect(req(montar('misto2', [6, 3, 3]))).toBeCloseTo(3) // 6‖(3+3)
  })
  it('em paralelo, a equivalente é menor que a menor das resistências', () => {
    const rs = [5, 8, 20]
    expect(req(paralelo(...rs.map(R)))).toBeLessThan(Math.min(...rs))
  })
  it('circuito aberto tem resistência infinita', () => {
    expect(req(serie(R(10), R(Infinity)))).toBe(Infinity)
    expect(req(paralelo(R(10), R(Infinity)))).toBeCloseTo(10)
  })
})

describe('resolver circuito', () => {
  it('série: mesma corrente, ddp proporcional à resistência', () => {
    const f = resolver(serie(R(10), R(20)), 12)
    expect(f[0]!.i).toBeCloseTo(0.4)
    expect(f[1]!.i).toBeCloseTo(0.4)
    expect(f[0]!.V).toBeCloseTo(4)
    expect(f[1]!.V).toBeCloseTo(8)
    expect(f[0]!.V + f[1]!.V).toBeCloseTo(12)
  })
  it('paralelo: mesma ddp, corrente inversamente proporcional', () => {
    const f = resolver(paralelo(R(10), R(20)), 12)
    expect(f[0]!.V).toBe(12)
    expect(f[1]!.V).toBe(12)
    expect(f[0]!.i).toBeCloseTo(1.2)
    expect(f[1]!.i).toBeCloseTo(0.6)
  })
  it('misto: conserva a corrente e a energia (potência da fonte = soma das dissipadas)', () => {
    const no = montar('misto', [4, 6, 12])
    const f = resolver(no, 24)
    const iTotal = correnteTotal(no, 24)
    expect(iTotal).toBeCloseTo(3)
    expect(f[0]!.i).toBeCloseTo(3)
    expect(f[1]!.i + f[2]!.i).toBeCloseTo(3) // lei dos nós
    expect(f[0]!.V + f[1]!.V).toBeCloseTo(24) // lei das malhas
    expect(f[1]!.V).toBeCloseTo(f[2]!.V)
    expect(f.reduce((s, x) => s + x.P, 0)).toBeCloseTo(24 * iTotal)
  })
  it('em toda associação, V = R·i e P = V·i = R·i² = V²/R em cada resistor', () => {
    const no = montar('misto2', [6, 3, 9])
    for (const x of resolver(no, 18)) {
      expect(x.V).toBeCloseTo(x.R * x.i)
      expect(x.P).toBeCloseTo(potencia.porVI(x.V, x.i))
      expect(x.P).toBeCloseTo(potencia.porRI(x.R, x.i))
      expect(x.P).toBeCloseTo(potencia.porVR(x.V, x.R))
    }
  })
  it('lâmpadas em série: a de maior resistência dissipa mais; em paralelo, a de menor', () => {
    const s = resolver(serie(R(10), R(40)), 10)
    expect(s[1]!.P).toBeGreaterThan(s[0]!.P)
    const p = resolver(paralelo(R(10), R(40)), 10)
    expect(p[0]!.P).toBeGreaterThan(p[1]!.P)
  })
})

describe('lâmpada queimada', () => {
  it('em série apaga tudo', () => {
    const f = resolver(queimar(serie(R(10), R(20), R(30)), 1), 12)
    expect(f.every((x) => x.i === 0 && x.P === 0)).toBe(true)
    expect(f[1]!.V).toBeCloseTo(12) // toda a ddp fica sobre o aberto
  })
  it('em paralelo, as outras mantêm o brilho', () => {
    const antes = resolver(paralelo(R(10), R(20), R(30)), 12)
    const depois = resolver(queimar(paralelo(R(10), R(20), R(30)), 2), 12)
    expect(depois[0]!.P).toBeCloseTo(antes[0]!.P)
    expect(depois[1]!.P).toBeCloseTo(antes[1]!.P)
    expect(depois[2]!.P).toBe(0)
  })
  it('no misto, queimar o ramo paralelo deixa a lâmpada em série mais fraca e a outra mais forte', () => {
    const no = montar('misto', [10, 10, 10])
    const antes = resolver(no, 30)
    const depois = resolver(queimar(no, 2), 30)
    expect(depois[0]!.P).toBeLessThan(antes[0]!.P) // em série: corrente cai
    expect(depois[1]!.P).toBeGreaterThan(antes[1]!.P) // o ramo que sobrou recebe toda a corrente
  })
})

describe('energia e conta', () => {
  it('kWh = W·h/1000', () => {
    expect(energiaKWh(1000, 1)).toBe(1)
    expect(energiaKWh(60, 5 * 30)).toBeCloseTo(9)
  })
  it('consumo mensal e custo', () => {
    const c = consumoMensal([{ nome: 'chuveiro', W: 4400, h: 0.5 }, { nome: 'geladeira', W: 150, h: 10 }], 30)
    expect(c).toBeCloseTo(66 + 45)
    expect(custo(c, 0.8)).toBeCloseTo(88.8)
  })
  it('potência de um chuveiro com a ddp menor cai com o quadrado', () => {
    expect(potenciaComNovaTensao(4400, 220, 110)).toBeCloseTo(1100)
    expect(potenciaComNovaTensao(4400, 220, 127)).toBeCloseTo(4400 * (127 / 220) ** 2)
  })
})
