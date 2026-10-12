import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { deltaH, eaDireta, eaInversa } from './calculo'
import { gerarDiagrama, gerarFatores, gerarMeiaVida, gerarOrdem } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 5051 + n)

function numeros(txt: string): number[] {
  return [...txt.replace(/(\d)\.(\d{3})/g, '$1$2').matchAll(/(\d+(?:,\d+)?)/g)].map((m) => Number((m[1] as string).replace(',', '.')))
}

describe('Ordem da reação', () => {
  it('as ordens e as respostas conferem com o logaritmo da razão das velocidades (cálculo independente)', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarOrdem(rng(s, n), n)
        const d = inst.dados!
        const [e1, e2, e3] = d.experimentos
        if (d.variante === 'um') {
          const m = Math.log(e2!.v / e1!.v) / Math.log(e2!.conc[0]! / e1!.conc[0]!)
          expect(inst.resposta).toBeCloseTo(m, 9)
          // o terceiro experimento obedece à mesma lei
          expect(e3!.v / e1!.v).toBeCloseTo((e3!.conc[0]! / e1!.conc[0]!) ** m, 9)
        } else {
          const ma = Math.log(e2!.v / e1!.v) / Math.log(e2!.conc[0]! / e1!.conc[0]!)
          const mb = Math.log(e3!.v / e1!.v) / Math.log(e3!.conc[1]! / e1!.conc[1]!)
          expect([ma, mb].map((x) => Math.round(x * 1e6) / 1e6)).toEqual(d.ordens)
          if (d.variante === 'dois') expect(inst.resposta).toBeCloseTo(d.pede === 'A' ? ma : d.pede === 'B' ? mb : ma + mb, 9)
          else {
            // v para as novas concentrações, sem passar por k: v1 · (A'/A1)^ma · (B'/B1)^mb
            const esperado = e1!.v * (d.alvo![0]! / e1!.conc[0]!) ** ma * (d.alvo![1]! / e1!.conc[1]!) ** mb
            expect(inst.resposta).toBeCloseTo(esperado, 9)
          }
        }
      }
  })
  it('níveis: 1 um reagente; 2 dois reagentes; 3 prever a velocidade', () => {
    expect(new Set(SEMENTES.map((s) => gerarOrdem(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['um']))
    expect(new Set(SEMENTES.map((s) => gerarOrdem(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['dois']))
    expect(new Set(SEMENTES.map((s) => gerarOrdem(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['prever']))
    expect(new Set(SEMENTES.map((s) => gerarOrdem(rng(s, 1), 1).resposta))).toEqual(new Set([0, 1, 2]))
  })
  it('erros típicos válidos e a resposta certa é aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarOrdem(rng(s, n), n)
        expect(inst.erros.length, `${n} ${s}`).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Diagrama de energia', () => {
  it('as respostas conferem com as definições (cálculo independente)', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarDiagrama(rng(s, n), n)
        const { d, pede, reducao } = inst.dados!
        const topo = d.hts
        const catTopo = topo - (reducao ?? 0)
        const esperado = {
          eaDireta: topo - d.hr,
          deltaH: d.hp - d.hr,
          eaInversa: topo - d.hp,
          eaCat: catTopo - d.hr,
          eaInvCat: catTopo - d.hp,
          deltaHCat: d.hp - d.hr,
        }[pede]
        expect(inst.resposta).toBe(esperado)
        expect(eaDireta(d) - eaInversa(d)).toBe(deltaH(d))
      }
  })
  it('o complexo ativado fica acima de reagentes e produtos, e o catalisador não o leva abaixo deles', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const { d, reducao } = gerarDiagrama(rng(s, n), n).dados!
        expect(d.hts).toBeGreaterThan(Math.max(d.hr, d.hp))
        if (reducao) expect(d.hts - reducao).toBeGreaterThan(Math.max(d.hr, d.hp))
      }
  })
  it('níveis: 1 Ea direta e ΔH; 2 Ea inversa; 3 com catalisador', () => {
    expect(new Set(SEMENTES.map((s) => gerarDiagrama(rng(s, 1), 1).dados!.pede))).toEqual(new Set(['eaDireta', 'deltaH']))
    expect(new Set(SEMENTES.map((s) => gerarDiagrama(rng(s, 2), 2).dados!.pede))).toEqual(new Set(['eaInversa', 'deltaH']))
    expect(new Set(SEMENTES.map((s) => gerarDiagrama(rng(s, 3), 3).dados!.pede))).toEqual(new Set(['eaCat', 'eaInvCat', 'deltaHCat']))
  })
  it('erros típicos válidos e resposta certa aceita (inclusive negativa)', () => {
    let negativas = 0
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarDiagrama(rng(s, n), n)
        expect(inst.erros.length, `${n} ${s}`).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(e.valor).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
        if (inst.resposta < 0) negativas++
      }
    expect(negativas).toBeGreaterThan(10)
  })
})

describe('Meia-vida', () => {
  /** dividir por 2 a cada meia-vida, passo a passo */
  function porDivisoes(m0: number, tempo: number, tMeia: number): number {
    let m = m0
    for (let t = tMeia; t <= tempo + 1e-9; t += tMeia) m /= 2
    return m
  }
  it('as respostas conferem com divisões sucessivas por 2', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarMeiaVida(rng(s, n), n)
        const d = inst.dados!
        if (d.variante === 'restante') expect(inst.resposta).toBeCloseTo(porDivisoes(d.m0!, d.tempo!, d.tMeia), 9)
        else if (d.variante === 'tempo') {
          expect(inst.resposta).toBeCloseTo(d.tempo!, 9)
          expect(porDivisoes(d.m0!, d.tempo!, d.tMeia)).toBeCloseTo(d.pontos[1]![1], 9)
        } else if (d.variante === 'k') {
          expect(inst.resposta).toBeCloseTo(0.693 / d.k!, 1)
          expect(inst.resposta).toBe(d.tMeia)
        } else if (n === 2) {
          // dois pontos → meia-vida
          expect(inst.resposta).toBe(d.tMeia)
          expect(porDivisoes(d.m0!, d.pontos[1]![0], d.tMeia)).toBeCloseTo(d.pontos[1]![1], 9)
        } else {
          expect(inst.resposta).toBeCloseTo(porDivisoes(d.m0!, d.tempo!, d.tMeia), 9)
          expect(porDivisoes(d.m0!, d.pontos[1]![0], d.tMeia)).toBeCloseTo(d.pontos[1]![1], 9)
        }
      }
  })
  it('os números do enunciado são os dos dados', () => {
    for (const s of SEMENTES) {
      const inst = gerarMeiaVida(rng(s, 1), 1)
      const nums = numeros(inst.enunciado)
      expect(nums).toContain(inst.dados!.tMeia)
      expect(nums).toContain(inst.dados!.m0)
      expect(nums).toContain(inst.dados!.tempo)
    }
  })
  it('níveis usam as variantes previstas', () => {
    expect(new Set(SEMENTES.map((s) => gerarMeiaVida(rng(s, 1), 1).dados!.variante))).toEqual(new Set(['restante']))
    expect(new Set(SEMENTES.map((s) => gerarMeiaVida(rng(s, 2), 2).dados!.variante))).toEqual(new Set(['tempo', 'doisPontos']))
    expect(new Set(SEMENTES.map((s) => gerarMeiaVida(rng(s, 3), 3).dados!.variante))).toEqual(new Set(['k', 'doisPontos']))
  })
  it('erros típicos válidos e resposta certa aceita', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarMeiaVida(rng(s, n), n)
        expect(inst.erros.length, `${n} ${s}`).toBeGreaterThanOrEqual(2)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(corrigirNum(inst, String(Math.round(e.valor * 1000) / 1000).replace('.', ',')).correto).toBe(false)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
  })
})

describe('Fatores que alteram a velocidade', () => {
  it('toda questão tem 4 alternativas distintas, a certa é aceita e cada errada tem explicação e motivo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarFatores(rng(s, n), n)
        expect(inst.opcoes).toHaveLength(4)
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(4)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(25)
          expect(c.motivo).not.toBe('opção errada')
        }
      }
  })
  it('diagrama: a única afirmação verdadeira é a marcada como certa (avaliador independente)', () => {
    let vistas = 0
    for (const s of SEMENTES) {
      const inst = gerarFatores(rng(s, 2), 2)
      const { d, reducao } = inst.dados!
      if (!d || reducao === undefined) continue
      vistas++
      const ea = d.hts - d.hr
      const eaInv = d.hts - d.hp
      const dh = d.hp - d.hr
      const verdadeira = (t: string): boolean => {
        let m: RegExpExecArray | null
        if ((m = /^A reação direta é (endotérmica|exotérmica)\.$/.exec(t))) return (m[1] === 'endotérmica') === dh > 0
        if ((m = /^Com o catalisador, a energia de ativação da reação direta cai de ([\d.]+) para ([\d.]+) kJ\.$/.exec(t))) return Number(m[1]!.replace('.', '')) === ea && Number(m[2]!.replace('.', '')) === ea - reducao
        if (t === 'O catalisador acelera a reação direta e também a inversa.') return true
        if ((m = /^O ΔH é o mesmo, (-?[\d.−]+) kJ, com ou sem catalisador\.$/.exec(t))) return Number(m[1]!.replace('−', '-').replace('.', '')) === dh
        if (/^O catalisador altera o ΔH/.test(t)) return false
        if (t === 'O catalisador aumenta a quantidade de produto no equilíbrio.') return false
        if ((m = /^A energia de ativação da reação direta, sem catalisador, é ([\d.]+) kJ\.$/.exec(t))) return Number(m[1]!.replace('.', '')) === ea
        if (t === 'O catalisador diminui a Ea só da reação direta; a inversa fica igual.') return false
        if (/^A energia de ativação da reação inversa é igual à da direta/.test(t)) return eaInv === ea
        throw new Error(`afirmação desconhecida: ${t}`)
      }
      const verdadeiras = inst.opcoes.filter((o) => verdadeira(o.rotulo.replace(/−/g, '-')))
      expect(verdadeiras.map((o) => o.id), inst.enunciado + JSON.stringify(inst.opcoes)).toEqual([inst.certa])
    }
    expect(vistas).toBeGreaterThan(30)
  })
  it('regra de dez graus: a alternativa certa é 2^(ΔT/10)', () => {
    let vistas = 0
    for (const s of SEMENTES) {
      const inst = gerarFatores(rng(s, 3), 3)
      if (inst.dados!.familia !== 'regra10') continue
      vistas++
      const [T1, T2] = numeros(inst.enunciado).slice(-2) as [number, number]
      const certo = inst.opcoes.find((o) => o.id === inst.certa)!.rotulo
      expect(certo).toBe(`${2 ** ((T2 - T1) / 10)} vezes`)
    }
    expect(vistas).toBeGreaterThan(20)
  })
  it('Maxwell–Boltzmann: a alternativa certa aponta a curva de maior temperatura', () => {
    let vistas = 0
    for (const s of SEMENTES) {
      const inst = gerarFatores(rng(s, 3), 3)
      const d = inst.dados!
      if (d.familia !== 'mb') continue
      vistas++
      const quente = d.curvas!.reduce((a, b) => (b.T > a.T ? b : a))
      const certo = inst.opcoes.find((o) => o.id === inst.certa)!.rotulo
      expect(certo).toBe(`A curva ${quente.rotulo} é a da temperatura mais alta.`)
    }
    expect(vistas).toBeGreaterThan(20)
  })
  it('o nível 1 usa o banco de conceitos e cobre todos os itens', () => {
    const perguntas = new Set(SEMENTES.map((s) => gerarFatores(rng(s, 1), 1).enunciado))
    expect(perguntas.size).toBe(8)
  })
})
