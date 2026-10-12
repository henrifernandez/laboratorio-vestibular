import { BANCO_BONUS, BANCO_FASE, BANCO_PIRAMIDE } from '@/conteudo/geografia/populacao'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import type { Fase, Piramide } from './calculo'
import { gerarBonus, gerarCrescimento, gerarFase, gerarPiramides, gerarRazao, piramideDaFase } from './geradores'

/** Lê um número em português: milhar com ponto e decimal com vírgula. */
const num = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'))
const soma = (v: number[]) => v.reduce((a, b) => a + b, 0)
/** Jovens, adultos e idosos somados à mão, faixa por faixa. */
function tres(p: Piramide) {
  const f = (i: number) => (p.homens[i] as number) + (p.mulheres[i] as number)
  let jovens = 0
  let adultos = 0
  let idosos = 0
  for (let i = 0; i < 17; i++) {
    if (i < 3) jovens += f(i)
    else if (i < 13) adultos += f(i)
    else idosos += f(i)
  }
  return { jovens, adultos, idosos }
}

describe('Razão de dependência (desafio)', () => {
  it('nível 1: a resposta é (jovens + idosos) ÷ adultos × 100 com os números do enunciado', () => {
    for (const s of SEMENTES) {
      const inst = gerarRazao(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`, 2)
      const m = /tem ([\d,]+)% de jovens.*?([\d,]+)% de adultos.*?([\d,]+)% de idosos/.exec(inst.enunciado)!
      const [j, a, i] = [num(m[1]!), num(m[2]!), num(m[3]!)]
      expect(inst.resposta, `s${s}`).toBeCloseTo(((j + i) / a) * 100, 6)
      // os números do enunciado são os da pirâmide mostrada
      const t = tres(inst.dados!.piramide)
      expect(j).toBeCloseTo(t.jovens, 1)
      expect(a).toBeCloseTo(t.adultos, 1)
      expect(i).toBeCloseTo(t.idosos, 1)
    }
  })
  it('nível 2: o índice de envelhecimento é idosos ÷ jovens × 100', () => {
    for (const s of SEMENTES) {
      const inst = gerarRazao(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 2)
      const m = /tem ([\d,]+)% de jovens.*?([\d,]+)% de adultos.*?([\d,]+)% de idosos/.exec(inst.enunciado)!
      expect(inst.resposta, `s${s}`).toBeCloseTo((num(m[3]!) / num(m[1]!)) * 100, 6)
    }
  })
  it('nível 3: precisa somar as faixas (3 de jovens e 4 de idosos) antes de dividir pelos adultos', () => {
    for (const s of SEMENTES) {
      const inst = gerarRazao(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`, 2)
      const m = /0–4 anos: ([\d.]+); 5–9: ([\d.]+); 10–14: ([\d.]+); adultos de 15 a 64 anos \(total\): ([\d.]+); 65–69: ([\d.]+); 70–74: ([\d.]+); 75–79: ([\d.]+); 80 ou mais: ([\d.]+)/.exec(inst.enunciado)!
      const v = m.slice(1).map((x) => num(x))
      const jovens = soma(v.slice(0, 3))
      const idosos = soma(v.slice(4))
      expect(inst.resposta, `s${s}`).toBeCloseTo(((jovens + idosos) / v[3]!) * 100, 6)
    }
  })
})

describe('Crescimento (desafio)', () => {
  it('nível 1: crescimento natural = (natalidade − mortalidade) ÷ 10', () => {
    for (const s of SEMENTES) {
      const inst = gerarCrescimento(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`, 2)
      const m = /natalidade de (\d+) por mil e taxa de mortalidade de (\d+) por mil/.exec(inst.enunciado)!
      expect(inst.resposta, `s${s}`).toBeCloseTo((Number(m[1]) - Number(m[2])) / 10, 9)
    }
  })
  it('nível 2: tempo para dobrar = 70 ÷ crescimento natural em %', () => {
    for (const s of SEMENTES) {
      const inst = gerarCrescimento(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 2)
      const m = /natalidade de (\d+) por mil e mortalidade de (\d+) por mil/.exec(inst.enunciado)!
      expect(inst.resposta, `s${s}`).toBeCloseTo(70 / ((Number(m[1]) - Number(m[2])) / 10), 9)
    }
  })
  it('nível 3: projeção composta ou taxa média, conferidas por conta independente', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarCrescimento(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`, 2)
      tipos.add(inst.dados!.tipo)
      if (inst.dados!.tipo === 'projecao') {
        const m = /tem (\d+) milhões de habitantes e cresce ([\d,]+)% ao ano.*em (\d+) anos/.exec(inst.enunciado)!
        const [p0, r, t] = [Number(m[1]), num(m[2]!), Number(m[3])]
        let p = p0
        for (let ano = 0; ano < t; ano++) p *= 1 + r / 100
        expect(inst.resposta, `s${s}`).toBeCloseTo(p, 6)
      } else {
        const m = /tinha (\d+) milhões de habitantes e, (\d+) anos depois, passou a ter (\d+) milhões/.exec(inst.enunciado)!
        const [p0, t, p1] = [Number(m[1]), Number(m[2]), Number(m[3])]
        // confere elevando a taxa achada à potência t
        const r = inst.resposta / 100
        expect(p0 * Math.pow(1 + r, t), `s${s}`).toBeCloseTo(p1, 6)
      }
    }
    expect(tipos).toEqual(new Set(['projecao', 'taxa']))
  })
})

describe('Fases da transição (desafio)', () => {
  /** Regra escrita à parte: natalidade alta e mortalidade alta → 1; natalidade alta → 2; diferença ≥ 5 → 3; resto → 4. */
  const faseDaRegra = (n: number, m: number): Fase => (n >= 30 ? (m >= 25 ? 1 : 2) : n - m >= 5 ? 3 : 4)
  it('nível 1: a alternativa certa é a fase que a regra das taxas indica, e as quatro fases aparecem', () => {
    const vistas = new Set<number>()
    for (const s of SEMENTES) {
      const inst = gerarFase(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const m = /natalidade de (\d+) por mil e taxa de mortalidade de (\d+) por mil/.exec(inst.enunciado)!
      const fase = faseDaRegra(Number(m[1]), Number(m[2]))
      expect(textoCerto(inst), `s${s}`).toContain(`Fase ${fase}:`)
      vistas.add(fase)
    }
    expect(vistas.size).toBe(4)
  })
  it('as pirâmides sorteadas de cada fase têm a forma esperada (limites 35% e 20% escritos à mão)', () => {
    const esperada: Record<Fase, string> = { 1: 'larga', 2: 'larga', 3: 'meio', 4: 'estreita' }
    for (const fase of [1, 2, 3, 4] as Fase[])
      for (const s of SEMENTES) {
        const { jovens } = tres(piramideDaFase(rngTeste(s, fase), fase))
        const forma = jovens >= 35 ? 'larga' : jovens < 20 ? 'estreita' : 'meio'
        expect(forma, `fase ${fase} s${s} jovens ${jovens}`).toBe(esperada[fase])
      }
  })
  it('nível 2: a forma da pirâmide mostrada decide a alternativa certa', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarFase(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const { jovens } = tres(inst.dados!.piramide!)
      const esperado = jovens >= 35 ? 'Base larga' : jovens < 20 ? 'Base estreita e topo largo' : 'Base mais estreita'
      expect(textoCerto(inst).startsWith(esperado), `s${s} jovens ${jovens}: ${textoCerto(inst)}`).toBe(true)
      vistos.add(esperado)
    }
    expect(vistos.size).toBe(3)
  })
  it('nível 3 vem do banco de perguntas, que está bem formado', () => {
    for (const s of SEMENTES.slice(0, 40)) checarMulti(gerarFase(rngTeste(s, 3), 3), `s${s}`)
    for (const b of [BANCO_FASE, BANCO_BONUS, BANCO_PIRAMIDE]) for (const it of b) expect(itemValido(it), it.pergunta).toBe(true)
  })
})

describe('Bônus demográfico (desafio)', () => {
  it('níveis 1 e 3: perguntas do banco', () => {
    for (const nivel of [1, 3] as const) for (const s of SEMENTES.slice(0, 40)) checarMulti(gerarBonus(rngTeste(s, nivel), nivel), `n${nivel} s${s}`)
  })
  it('nível 2: a década certa é a de menor razão de dependência da série, que é única', () => {
    for (const s of SEMENTES) {
      const inst = gerarBonus(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const pontos = inst.dados!.pontos!
      const valores = pontos.map((p) => p.rd)
      const min = Math.min(...valores)
      expect(valores.filter((v) => v === min), `s${s}`).toHaveLength(1)
      const iMin = valores.indexOf(min)
      expect(iMin).toBeGreaterThan(0)
      expect(iMin).toBeLessThan(valores.length - 1)
      expect(textoCerto(inst)).toBe(`Em ${pontos[iMin]!.rotulo}`)
      // a série desce até o mínimo e sobe depois
      for (let i = 1; i <= iMin; i++) expect(valores[i]!).toBeLessThan(valores[i - 1]!)
      for (let i = iMin + 1; i < valores.length; i++) expect(valores[i]!).toBeGreaterThan(valores[i - 1]!)
    }
  })
})

describe('Comparar pirâmides (desafio)', () => {
  const dep = (p: Piramide) => {
    const t = tres(p)
    return ((t.jovens + t.idosos) / t.adultos) * 100
  }
  it.each(NIVEIS)('nível %i: a alternativa certa atende ao pedido, e só ela', (nivel) => {
    let comMiniaturas = 0
    for (const s of SEMENTES) {
      const inst = gerarPiramides(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const ps = inst.dados?.piramides
      if (!ps) {
        expect(nivel).toBe(3)
        continue
      }
      comMiniaturas++
      expect(ps).toHaveLength(inst.opcoes.length)
      const idx = inst.opcoes.findIndex((o) => o.id === inst.certa)
      if (nivel === 1) {
        const v = ps.map((p) => tres(p).jovens)
        expect(v[idx]).toBe(Math.max(...v))
        expect(v.filter((x) => x === Math.max(...v))).toHaveLength(1)
      }
      if (nivel === 2) {
        const v = ps.map(dep)
        expect(v[idx]).toBe(Math.max(...v))
        expect(v.filter((x) => x === Math.max(...v))).toHaveLength(1)
      }
      if (nivel === 3) {
        const mais = ps.map((p) => tres(p).idosos > tres(p).jovens)
        expect(mais.filter(Boolean), `s${s}`).toHaveLength(1)
        expect(mais[idx]).toBe(true)
      }
    }
    expect(comMiniaturas).toBeGreaterThan(nivel === 3 ? 50 : 140)
  })
  it('as pirâmides sorteadas são bem diferentes entre si (margem mínima)', () => {
    for (const s of SEMENTES.slice(0, 60)) {
      const ps = gerarPiramides(rngTeste(s, 1), 1).dados!.piramides
      const v = ps.map((p) => tres(p).jovens).sort((a, b) => b - a)
      expect(v[0]! - v[1]!).toBeGreaterThanOrEqual(5)
    }
  })
})
