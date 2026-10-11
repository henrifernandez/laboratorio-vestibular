import { alcance, G } from './calculo'
import { alvoLancamento, pousoEm, type InstanciaAlvoL } from './alvo'

const chao: InstanciaAlvoL = { semente: 1, nivel: 1, d: 40, h: 0, tol: 1, fixo: { angulo: 45 } }
const plataforma: InstanciaAlvoL = { semente: 1, nivel: 3, d: 30, h: 5, tol: 1.5, fixo: {} }

describe('ponto de pouso', () => {
  it('no chão: o alcance', () => {
    expect(pousoEm(20, 45, 0)!.x).toBeCloseTo(40)
    expect(pousoEm(20, 30, 0)!.x).toBeCloseTo(alcance(20, 30))
  })
  it('numa plataforma: a descida cruza a altura h depois do ápice', () => {
    const p = pousoEm(20, 45, 5)!
    // y(t) = vy·t − 5t² = 5 com vy = 14,14 → t = (vy + √(vy² − 100))/10
    const vy = 20 * Math.sin(Math.PI / 4)
    const t = (vy + Math.sqrt(vy * vy - 2 * G * 5)) / G
    expect(p.x).toBeCloseTo(20 * Math.cos(Math.PI / 4) * t, 6)
    expect(p.descendo).toBe(true)
  })
  it('não alcança a altura da plataforma: null', () => {
    expect(pousoEm(10, 30, 5)).toBeNull() // altura máxima = 1,25 m
  })
})

describe('Acerte o alvo — correção', () => {
  it('acerta dentro da tolerância e erra fora dela', () => {
    expect(alvoLancamento.corrigir(chao, { angulo: 45, v0: 20 }).correto).toBe(true)
    expect(alvoLancamento.corrigir(chao, { angulo: 45, v0: 20.2 }).correto).toBe(true) // alcance 40,8 ≤ 41
    expect(alvoLancamento.corrigir(chao, { angulo: 45, v0: 20.4 }).correto).toBe(false) // alcance 41,6 > 41
  })
  it('curto e longo: informa quanto e em que sentido', () => {
    const curto = alvoLancamento.corrigir(chao, { angulo: 45, v0: 15 })
    expect(curto.correto).toBe(false)
    expect(curto.feedback).toMatch(/antes do alvo/)
    expect(curto.feedback).toMatch(/17,\d+ m/) // alcance 22,5 → faltam 17,5
    const longo = alvoLancamento.corrigir(chao, { angulo: 45, v0: 25 })
    expect(longo.feedback).toMatch(/depois do alvo/)
  })
  it('o ângulo é forçado no nível 1 (fixo)', () => {
    const a = alvoLancamento.corrigir(chao, { angulo: 10, v0: 20 })
    expect(a.correto).toBe(true)
  })
  it('plataforma sem alcançar a altura: avisa', () => {
    const c = alvoLancamento.corrigir(plataforma, { angulo: 20, v0: 10 })
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/altura/)
  })
  it('traz parâmetros para desenhar a trajetória', () => {
    const c = alvoLancamento.corrigir(chao, { angulo: 45, v0: 15 })
    expect(c.destaque).toMatchObject({ v0: 15, angulo: 45 })
  })
})

describe('Acerte o alvo — geração', () => {
  it('sempre existe uma solução, e ela acerta (todas as sementes)', () => {
    for (let s = 1; s <= 150; s++) {
      for (const n of [1, 2, 3] as const) {
        const i = alvoLancamento.gerar(s, n)
        const r = alvoLancamento.respostaCerta(i)
        expect(alvoLancamento.corrigir(i, r).correto).toBe(true)
        // a posição inicial dos controles não acerta
        expect(alvoLancamento.corrigir(i, alvoLancamento.respostaInicial(i)).correto).toBe(false)
      }
    }
  })
  it('nível 1: ângulo fixo 45°; nível 2: velocidade fixa; nível 3: plataforma', () => {
    const i1 = alvoLancamento.gerar(3, 1)
    const i2 = alvoLancamento.gerar(3, 2)
    const i3 = alvoLancamento.gerar(3, 3)
    expect(i1.fixo).toEqual({ angulo: 45 })
    expect(i2.fixo.v0).toBeDefined()
    expect(i2.fixo.angulo).toBeUndefined()
    expect(i3.h).toBeGreaterThan(0)
  })
  it('nível 2: o ângulo complementar também acerta', () => {
    for (let s = 1; s <= 60; s++) {
      const i = alvoLancamento.gerar(s, 2)
      const r = alvoLancamento.respostaCerta(i)
      expect(alvoLancamento.corrigir(i, { angulo: 90 - r.angulo, v0: r.v0 }).correto).toBe(true)
    }
  })
  it('dicas e explicação', () => {
    const i = alvoLancamento.gerar(2, 3)
    expect(alvoLancamento.dicas(i)).toHaveLength(3)
    expect(alvoLancamento.explicar(i).length).toBeGreaterThan(30)
  })
})
