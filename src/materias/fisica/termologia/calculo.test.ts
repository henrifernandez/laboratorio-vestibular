import { AGUA, calorTotal, curvaAquecimento, curvaPV, equilibrio, estadoParcial, estadoAposCalor, etapasCalor, geloComAgua, leiGeral, paraCelsius, paraKelvin, transformar, trabalhoIsobarico, trabalhoIsotermico } from './calculo'

describe('curva de aquecimento da água', () => {
  it('soma os calores de cada trecho (100 g de gelo a −10 °C até vapor a 110 °C)', () => {
    const tr = curvaAquecimento(100, -10, 110)
    expect(tr.map((t) => t.fase)).toEqual(['gelo', 'fusao', 'agua', 'vaporizacao', 'vapor'])
    expect(tr[0]!.q1 - tr[0]!.q0).toBeCloseTo(500) // 100·0,5·10
    expect(tr[1]!.q1 - tr[1]!.q0).toBeCloseTo(8000) // 100·80
    expect(tr[2]!.q1 - tr[2]!.q0).toBeCloseTo(10000) // 100·1·100
    expect(tr[3]!.q1 - tr[3]!.q0).toBeCloseTo(54000) // 100·540
    expect(tr[4]!.q1 - tr[4]!.q0).toBeCloseTo(500) // 100·0,5·10
    expect(tr[4]!.q1).toBeCloseTo(73000)
  })
  it('os trechos de mudança de fase ficam em temperatura constante (patamares)', () => {
    const tr = curvaAquecimento(50, -20, 120)
    expect(tr[1]!.t0).toBe(0)
    expect(tr[1]!.t1).toBe(0)
    expect(tr[3]!.t0).toBe(100)
    expect(tr[3]!.t1).toBe(100)
  })
  it('o gelo esquenta mais depressa que a água (c menor ⇒ mais inclinado)', () => {
    const tr = curvaAquecimento(100, -20, 120)
    const incl = (t: (typeof tr)[number]) => (t.t1 - t.t0) / (t.q1 - t.q0)
    expect(incl(tr[0]!)).toBeGreaterThan(incl(tr[2]!))
    expect(incl(tr[4]!)).toBeCloseTo(incl(tr[0]!)) // vapor e gelo têm o mesmo c nos exercícios
  })
  it('estado depois de receber calor', () => {
    const m = 100
    expect(estadoAposCalor(m, -10, 0)).toEqual({ T: -10, fase: 'gelo', fracao: 0 })
    expect(estadoAposCalor(m, -10, 250).T).toBeCloseTo(-5)
    const meio = estadoAposCalor(m, -10, 500 + 4000)
    expect(meio.fase).toBe('fusao')
    expect(meio.T).toBe(0)
    expect(meio.fracao).toBeCloseTo(0.5)
    expect(estadoAposCalor(m, -10, 500 + 8000 + 5000).T).toBeCloseTo(50)
    const vap = estadoAposCalor(m, -10, 500 + 8000 + 10000 + 27000)
    expect(vap.fase).toBe('vaporizacao')
    expect(vap.fracao).toBeCloseTo(0.5)
    expect(estadoAposCalor(m, -10, 1e6).fase).toBe('vapor')
  })
  it('conserva energia: o calor recebido leva ao estado certo (teste por inversão)', () => {
    const m = 40
    for (let q = 0; q < 60000; q += 937) {
      const e = estadoAposCalor(m, -15, q)
      // refaz o calor acumulado a partir do estado
      let refeito: number
      if (e.fase === 'gelo') refeito = m * 0.5 * (e.T + 15)
      else if (e.fase === 'fusao') refeito = m * 0.5 * 15 + m * 80 * e.fracao
      else if (e.fase === 'agua') refeito = m * 0.5 * 15 + m * 80 + m * e.T
      else if (e.fase === 'vaporizacao') refeito = m * 0.5 * 15 + m * 80 + m * 100 + m * 540 * e.fracao
      else refeito = m * 0.5 * 15 + m * 80 + m * 100 + m * 540 + m * 0.5 * (e.T - 100)
      expect(refeito).toBeCloseTo(q, 6)
    }
  })
})

describe('etapas de calor', () => {
  it('gelo a −10 °C até água a 20 °C: três termos', () => {
    const e = etapasCalor(200, { fase: 'gelo', T: -10 }, { fase: 'agua', T: 20 })
    expect(e.map((x) => x.formula)).toEqual(['mcdT', 'mL', 'mcdT'])
    expect(calorTotal(e)).toBeCloseTo(200 * 0.5 * 10 + 200 * 80 + 200 * 20)
  })
  it('água a 20 °C até vapor a 100 °C: água e vaporização', () => {
    const e = etapasCalor(10, { fase: 'agua', T: 20 }, { fase: 'vapor', T: 100 })
    expect(e).toHaveLength(2)
    expect(calorTotal(e)).toBeCloseTo(10 * 80 + 10 * 540)
  })
  it('coincide com a soma dos trechos da curva', () => {
    const tr = curvaAquecimento(75, -12, 105)
    const e = etapasCalor(75, { fase: 'gelo', T: -12 }, { fase: 'vapor', T: 105 })
    expect(calorTotal(e)).toBeCloseTo(tr[tr.length - 1]!.q1)
  })
})

describe('equilíbrio térmico', () => {
  it('duas massas de água: média ponderada pelas massas', () => {
    expect(equilibrio([{ m: 200, c: 1, T: 80 }, { m: 300, c: 1, T: 20 }])).toBeCloseTo(44)
  })
  it('materiais diferentes: a capacidade térmica m·c é o peso', () => {
    // 100 g de ferro a 100 °C (c = 0,1) em 200 g de água a 20 °C → (10·100 + 200·20)/(10 + 200)
    expect(equilibrio([{ m: 100, c: 0.1, T: 100 }, { m: 200, c: 1, T: 20 }])).toBeCloseTo(5000 / 210)
  })
  it('calor cedido = calor recebido', () => {
    const corpos = [{ m: 150, c: 1, T: 90 }, { m: 50, c: 0.2, T: 10 }, { m: 80, c: 1, T: 30 }]
    const Te = equilibrio(corpos)
    const soma = corpos.reduce((s, x) => s + x.m * x.c * (Te - x.T), 0)
    expect(soma).toBeCloseTo(0, 9)
  })
  it('gelo com água: derrete tudo', () => {
    // 100 g de gelo a 0 °C + 400 g de água a 50 °C: 400·50 = 20000 cal; fundir tudo gasta 8000; sobram 12000 para 500 g
    const r = geloComAgua({ mg: 100, Tg: 0, ma: 400, Ta: 50 })
    expect(r.situacao).toBe('derrete-tudo')
    expect(r.T).toBeCloseTo(24)
    expect(r.gelo).toBe(0)
  })
  it('gelo com água: derrete só parte e a temperatura fica em 0 °C', () => {
    // 200 g de gelo a 0 °C + 100 g de água a 40 °C: cede 4000, derrete 50 g
    const r = geloComAgua({ mg: 200, Tg: 0, ma: 100, Ta: 40 })
    expect(r.situacao).toBe('derrete-parte')
    expect(r.T).toBe(0)
    expect(r.gelo).toBeCloseTo(150)
    expect(r.agua).toBeCloseTo(150)
  })
  it('gelo bem frio: toda a água congela e a temperatura cai abaixo de 0 °C', () => {
    const r = geloComAgua({ mg: 500, Tg: -40, ma: 10, Ta: 10 })
    expect(r.situacao).toBe('congela-tudo')
    expect(r.T).toBeLessThan(0)
    // verificação por balanço: ganho do gelo + ganho/perda da água congelando = 0
    const calorGelo = 500 * 0.5 * (r.T + 40)
    const calorAgua = 10 * 1 * (0 - 10) + 10 * -80 + 10 * 0.5 * (r.T - 0)
    expect(calorGelo + calorAgua).toBeCloseTo(0, 6)
  })
  it('a entalpia é contínua nas fronteiras entre as situações', () => {
    // exatamente derrete tudo a 0 °C: 100 g de gelo a 0 °C + 80 g de água a 100 °C = 8000 cal
    const r = geloComAgua({ mg: 100, Tg: 0, ma: 80, Ta: 100 })
    expect(r.T).toBeCloseTo(0, 6)
    expect(r.gelo).toBeCloseTo(0, 6)
  })
})

describe('gases', () => {
  const ini = { p: 2, V: 3, T: 300 }
  it('lei geral e escala Kelvin', () => {
    expect(paraKelvin(27)).toBe(300)
    expect(paraCelsius(373)).toBe(100)
    const f = leiGeral(ini, { V: 6, T: 600 })
    expect(f.p).toBeCloseTo(2) // dobrou V e dobrou T: p igual
    const g = leiGeral(ini, { p: 4, V: 3 })
    expect(g.T).toBeCloseTo(600)
  })
  it('isotérmica (Boyle): p·V constante', () => {
    const f = transformar(ini, 'isotermica', 6)
    expect(f.p).toBeCloseTo(1)
    expect(f.T).toBe(300)
    expect(f.p * f.V).toBeCloseTo(ini.p * ini.V)
  })
  it('isobárica (Charles): V/T constante', () => {
    const f = transformar(ini, 'isobarica', 6)
    expect(f.T).toBeCloseTo(600)
    expect(f.p).toBe(2)
  })
  it('isocórica: p/T constante', () => {
    const f = transformar(ini, 'isocorica', 4)
    expect(f.T).toBeCloseTo(600)
    expect(f.V).toBe(3)
  })
  it('trabalho: isobárico é p·ΔV e o isotérmico bate com a integral numérica', () => {
    expect(trabalhoIsobarico(2, 3, 6)).toBe(6)
    const analitico = trabalhoIsotermico(ini, 6)
    // integral numérica de p(V) = pV/V pelo método do trapézio
    const N = 20000
    let soma = 0
    for (let i = 0; i < N; i++) {
      const V0 = 3 + (3 * i) / N
      const V1 = 3 + (3 * (i + 1)) / N
      soma += (((ini.p * ini.V) / V0 + (ini.p * ini.V) / V1) / 2) * (V1 - V0)
    }
    expect(analitico).toBeCloseTo(soma, 4)
  })
  it('curva p×V começa no estado inicial e termina no final', () => {
    for (const tipo of ['isotermica', 'isobarica', 'isocorica'] as const) {
      const alvo = tipo === 'isocorica' ? 4 : 6
      const c = curvaPV(ini, tipo, alvo)
      const fim = transformar(ini, tipo, alvo)
      expect(c[0]).toEqual({ V: 3, p: 2 })
      expect(c[c.length - 1]!.V).toBeCloseTo(fim.V)
      expect(c[c.length - 1]!.p).toBeCloseTo(fim.p)
    }
  })
  it('constante AGUA coerente', () => {
    expect(AGUA.LF).toBe(80)
    expect(AGUA.LV).toBe(540)
  })
  it('estado parcial: começa no inicial, termina no final e obedece à lei geral em todo o caminho', () => {
    for (const tipo of ['isotermica', 'isobarica', 'isocorica'] as const) {
      const alvo = tipo === 'isocorica' ? 5 : 7
      expect(estadoParcial(ini, tipo, alvo, 0)).toEqual(ini)
      const fim = transformar(ini, tipo, alvo)
      const f1 = estadoParcial(ini, tipo, alvo, 1)
      expect(f1.p).toBeCloseTo(fim.p)
      expect(f1.V).toBeCloseTo(fim.V)
      expect(f1.T).toBeCloseTo(fim.T)
      for (let s = 0; s <= 1; s += 0.125) {
        const e = estadoParcial(ini, tipo, alvo, s)
        expect((e.p * e.V) / e.T).toBeCloseTo((ini.p * ini.V) / ini.T, 9)
      }
    }
  })
})
