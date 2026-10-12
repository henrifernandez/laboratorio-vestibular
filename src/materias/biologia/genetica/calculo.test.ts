import {
  GENOTIPOS_ABO,
  TIPOS_ABO,
  aglutininas,
  autocruzamentoLigado,
  classesPoligenicas,
  cruzamentoTesteLigado,
  cruzar,
  distanciaCM,
  distribuicaoFenotipos,
  distribuicaoPoligenica,
  doadoresCompativeis,
  emEquilibrio,
  fenotipo,
  fracao,
  freqAlelicaDeContagens,
  gametas,
  gametasLigados,
  hardyWeinberg,
  hardyWeinbergX,
  normalizar,
  podeReceber,
  porcento,
  probAfetadoXR,
  probFenotipo,
  probFilhoRhPositivo,
  probGenotipo,
  proleX,
  prole,
  qDeAfetados,
  razao,
  somar,
  textoFracao,
  tiposDeGametas,
  tiposPossiveisDosFilhos,
  tipoDoGenotipoABO,
  valor,
  type Fracao,
  type TipoABO,
} from './calculo'

const soma = (m: Map<string, Fracao>) => [...m.values()].reduce((s, f) => somar(s, f), fracao(0))

describe('Frações', () => {
  it('reduzem e mantêm o sinal no numerador', () => {
    expect(fracao(2, 4)).toEqual({ n: 1, d: 2 })
    expect(fracao(3, -6)).toEqual({ n: -1, d: 2 })
    expect(textoFracao(fracao(6, 3))).toBe('2')
    expect(textoFracao(fracao(1, 16))).toBe('1/16')
    expect(porcento(fracao(1, 16))).toBeCloseTo(6.25, 12)
    expect(() => fracao(1, 0)).toThrow()
  })
})

describe('Gametas e cruzamentos', () => {
  it('normalizar põe o alelo maiúsculo primeiro, gene por gene', () => {
    expect(normalizar('aA')).toBe('Aa')
    expect(normalizar('aAbB')).toBe('AaBb')
    expect(normalizar('AA')).toBe('AA')
    expect(normalizar('aa')).toBe('aa')
  })
  it('número de tipos de gametas = 2 elevado ao número de genes heterozigotos', () => {
    expect(tiposDeGametas('AA')).toBe(1)
    expect(tiposDeGametas('Aa')).toBe(2)
    expect(tiposDeGametas('AaBb')).toBe(4)
    expect(tiposDeGametas('AaBBCc')).toBe(4)
    expect(tiposDeGametas('AaBbCc')).toBe(8)
    expect(tiposDeGametas('aabb')).toBe(1)
  })
  it('as probabilidades dos gametas e da prole somam 1', () => {
    for (const g of ['Aa', 'AaBb', 'AABb', 'AaBbCc', 'aaBB']) expect(soma(gametas(g))).toEqual(fracao(1))
    for (const [a, b] of [
      ['Aa', 'Aa'],
      ['AaBb', 'AaBb'],
      ['AaBb', 'aabb'],
      ['AABb', 'aaBb'],
    ] as const) expect(soma(cruzar(a, b))).toEqual(fracao(1))
  })
  it('1ª lei: Aa × Aa → 1 AA : 2 Aa : 1 aa; fenótipos 3 : 1', () => {
    const c = cruzar('Aa', 'Aa')
    expect(c.get('AA')).toEqual(fracao(1, 4))
    expect(c.get('Aa')).toEqual(fracao(1, 2))
    expect(c.get('aa')).toEqual(fracao(1, 4))
    expect(razao(distribuicaoFenotipos('Aa', 'Aa'))).toEqual([3, 1])
    expect(razao(c)).toEqual([2, 1, 1])
  })
  it('cruzamento-teste: Aa × aa → 1 : 1 e AA × aa → tudo Aa', () => {
    expect(razao(cruzar('Aa', 'aa'))).toEqual([1, 1])
    expect(cruzar('AA', 'aa').get('Aa')).toEqual(fracao(1))
  })
  it('dominância incompleta: Aa × Aa → 1 : 2 : 1 nos fenótipos', () => {
    expect(razao(distribuicaoFenotipos('Aa', 'Aa', 'incompleta'))).toEqual([2, 1, 1])
    expect(fenotipo('Aa', 'incompleta')).toBe('intermediario')
    expect(fenotipo('Aa', 'completa')).toBe('dominante')
  })
  it('2ª lei: AaBb × AaBb → 9 : 3 : 3 : 1; duplo recessivo = 1/16; AaBb = 1/4', () => {
    expect(razao(distribuicaoFenotipos('AaBb', 'AaBb'))).toEqual([9, 3, 3, 1])
    expect(probFenotipo('AaBb', 'AaBb', 'recessivo,recessivo')).toEqual(fracao(1, 16))
    expect(probFenotipo('AaBb', 'AaBb', 'dominante,dominante')).toEqual(fracao(9, 16))
    expect(probGenotipo('AaBb', 'AaBb', 'AaBb')).toEqual(fracao(1, 4))
    expect(probGenotipo('AaBb', 'AaBb', 'aabb')).toEqual(fracao(1, 16))
  })
  it('3 genes: todos dominantes = 27/64 e nenhum dominante = 1/64', () => {
    expect(probFenotipo('AaBbCc', 'AaBbCc', 'dominante,dominante,dominante')).toEqual(fracao(27, 64))
    expect(probFenotipo('AaBbCc', 'AaBbCc', 'recessivo,recessivo,recessivo')).toEqual(fracao(1, 64))
  })
  it('a probabilidade de um fenótipo com vários genes é o produto das probabilidades por gene (genes independentes)', () => {
    for (const [a, b] of [
      ['AaBb', 'Aabb'],
      ['AaBb', 'aaBb'],
      ['AABb', 'AaBb'],
      ['Aabb', 'aaBb'],
    ] as const) {
      const [a1, a2] = [a.slice(0, 2), a.slice(2)]
      const [b1, b2] = [b.slice(0, 2), b.slice(2)]
      for (const f1 of ['dominante', 'recessivo'])
        for (const f2 of ['dominante', 'recessivo']) {
          const conjunto = probFenotipo(a, b, `${f1},${f2}`)
          const separado = valor(probFenotipo(a1, b1, f1)) * valor(probFenotipo(a2, b2, f2))
          expect(valor(conjunto), `${a}×${b} ${f1},${f2}`).toBeCloseTo(separado, 12)
        }
    }
  })
  it('conferência independente: tabela de Punnett por contagem de pares de gametas', () => {
    const listaGametas = (g: string): string[] => {
      let atual = ['']
      for (const par of normalizar(g).match(/../g) ?? []) atual = atual.flatMap((x) => [x + par[0], x + par[1]])
      return atual // com repetição: cada elemento tem a mesma chance
    }
    for (const [a, b] of [
      ['AaBb', 'AaBb'],
      ['AaBb', 'aabb'],
      ['AABb', 'aaBb'],
      ['AaBbCc', 'aaBbCC'],
    ] as const) {
      const ga = listaGametas(a)
      const gb = listaGametas(b)
      const contagem = new Map<string, number>()
      for (const x of ga)
        for (const y of gb) {
          let g = ''
          for (let i = 0; i < x.length; i++) g += x[i]! + y[i]!
          contagem.set(normalizar(g), (contagem.get(normalizar(g)) ?? 0) + 1)
        }
      const total = ga.length * gb.length
      const esperado = cruzar(a, b)
      expect(esperado.size).toBe(contagem.size)
      for (const [g, n] of contagem) expect(valor(esperado.get(g) as Fracao), `${a}×${b} ${g}`).toBeCloseTo(n / total, 12)
    }
  })
})

describe('Genes ligados', () => {
  it('sem recombinação só há gametas parentais; com 50 % comporta-se como genes independentes', () => {
    const g0 = gametasLigados(0, 'cis')
    expect(g0.freq.get('AB')).toBe(0.5)
    expect(g0.freq.get('Ab')).toBe(0)
    const g50 = gametasLigados(0.5, 'cis')
    for (const f of g50.freq.values()) expect(f).toBeCloseTo(0.25, 12)
    const ligado = autocruzamentoLigado(0.5, 'cis')
    expect(ligado.get('A_B_')).toBeCloseTo(9 / 16, 12)
    expect(ligado.get('A_bb')).toBeCloseTo(3 / 16, 12)
    expect(ligado.get('aabb')).toBeCloseTo(1 / 16, 12)
  })
  it('as frequências dos gametas somam 1 e os recombinantes são r/2 cada', () => {
    for (const r of [0, 0.1, 0.2, 0.37, 0.5])
      for (const arranjo of ['cis', 'trans'] as const) {
        const g = gametasLigados(r, arranjo)
        expect([...g.freq.values()].reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12)
        for (const rec of g.recombinantes) expect(g.freq.get(rec)).toBeCloseTo(r / 2, 12)
        for (const par of g.parentais) expect(g.freq.get(par)).toBeCloseTo((1 - r) / 2, 12)
        expect([...autocruzamentoLigado(r, arranjo).values()].reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12)
      }
  })
  it('cis: duplo recessivo = ((1−r)/2)²; trans: duplo recessivo = (r/2)²', () => {
    for (const r of [0.1, 0.2, 0.3]) {
      expect(autocruzamentoLigado(r, 'cis').get('aabb')).toBeCloseTo(((1 - r) / 2) ** 2, 12)
      expect(autocruzamentoLigado(r, 'trans').get('aabb')).toBeCloseTo((r / 2) ** 2, 12)
    }
  })
  it('cruzamento-teste: a proporção dos fenótipos copia a dos gametas, e a distância em cM é a % de recombinantes', () => {
    const t = cruzamentoTesteLigado(0.2, 'cis')
    expect(t.get('A_B_')).toBeCloseTo(0.4, 12)
    expect(t.get('aabb')).toBeCloseTo(0.4, 12)
    expect(t.get('A_bb')).toBeCloseTo(0.1, 12)
    expect(t.get('aaB_')).toBeCloseTo(0.1, 12)
    // 400 descendentes, 80 recombinantes → 20 cM
    expect(distanciaCM(80, 400)).toBe(20)
  })
})

describe('Grupos sanguíneos', () => {
  it('genótipos e tipos: cada tipo corresponde aos seus genótipos', () => {
    for (const t of TIPOS_ABO) for (const g of GENOTIPOS_ABO[t]) expect(tipoDoGenotipoABO(g)).toBe(t)
    expect(tipoDoGenotipoABO('AO')).toBe('A')
    expect(tipoDoGenotipoABO('BO')).toBe('B')
    expect(tipoDoGenotipoABO('AB')).toBe('AB')
    expect(tipoDoGenotipoABO('OO')).toBe('O')
  })
  it('prole de AO × BO: cada tipo com 1/4', () => {
    const p = prole('AO', 'BO')
    for (const t of TIPOS_ABO) expect(p.get(t)).toEqual(fracao(1, 4))
  })
  it('tipos possíveis dos filhos: conferência com a regra "cada filho recebe um alelo de cada pai"', () => {
    const alelos = (t: TipoABO) => [...new Set(GENOTIPOS_ABO[t].flatMap((g) => g.split('')))]
    for (const pai of TIPOS_ABO)
      for (const mae of TIPOS_ABO) {
        const esperado = new Set<TipoABO>()
        for (const a of alelos(pai)) for (const b of alelos(mae)) esperado.add(tipoDoGenotipoABO(a + b))
        expect([...tiposPossiveisDosFilhos(pai, mae)].sort(), `${pai}×${mae}`).toEqual([...esperado].sort())
      }
    // casos conhecidos
    expect([...tiposPossiveisDosFilhos('AB', 'O')].sort()).toEqual(['A', 'B'])
    expect([...tiposPossiveisDosFilhos('O', 'O')]).toEqual(['O'])
    expect([...tiposPossiveisDosFilhos('AB', 'AB')].sort()).toEqual(['A', 'AB', 'B'])
    expect(tiposPossiveisDosFilhos('A', 'B').size).toBe(4)
  })
  it('aglutininas: A tem anti-B; B tem anti-A; AB não tem; O tem as duas', () => {
    expect(aglutininas('A')).toEqual(['B'])
    expect(aglutininas('B')).toEqual(['A'])
    expect(aglutininas('AB')).toEqual([])
    expect(aglutininas('O')).toEqual(['A', 'B'])
  })
  it('transfusão: O− doa para todos; AB+ recebe de todos; Rh+ não doa para Rh−', () => {
    const todos = TIPOS_ABO.flatMap((abo) => (['+', '-'] as const).map((rh) => ({ abo, rh })))
    for (const r of todos) expect(podeReceber({ abo: 'O', rh: '-' }, r), `O− → ${r.abo}${r.rh}`).toBe(true)
    for (const d of todos) expect(podeReceber(d, { abo: 'AB', rh: '+' }), `${d.abo}${d.rh} → AB+`).toBe(true)
    expect(podeReceber({ abo: 'A', rh: '+' }, { abo: 'A', rh: '-' })).toBe(false)
    expect(podeReceber({ abo: 'A', rh: '-' }, { abo: 'B', rh: '-' })).toBe(false)
    expect(podeReceber({ abo: 'AB', rh: '-' }, { abo: 'A', rh: '+' })).toBe(false)
    expect(doadoresCompativeis({ abo: 'AB', rh: '+' })).toHaveLength(8)
    expect(doadoresCompativeis({ abo: 'O', rh: '-' })).toHaveLength(1)
    expect(doadoresCompativeis({ abo: 'A', rh: '+' })).toHaveLength(4)
    expect(doadoresCompativeis({ abo: 'B', rh: '-' })).toHaveLength(2)
  })
  it('a compatibilidade confere com a regra "o plasma do receptor não aglutina as hemácias do doador"', () => {
    const todos = TIPOS_ABO.flatMap((abo) => (['+', '-'] as const).map((rh) => ({ abo, rh })))
    for (const d of todos)
      for (const r of todos) {
        const antigenos = d.abo === 'AB' ? ['A', 'B'] : d.abo === 'O' ? [] : [d.abo]
        const anticorpos = aglutininas(r.abo)
        const abo = !antigenos.some((a) => anticorpos.includes(a as 'A' | 'B'))
        const rh = !(d.rh === '+' && r.rh === '-')
        expect(podeReceber(d, r)).toBe(abo && rh)
      }
  })
  it('Rh: mãe dd × pai Dd → 1/2 de filhos Rh+; pai DD → todos; pai dd → nenhum', () => {
    expect(probFilhoRhPositivo('Dd')).toEqual(fracao(1, 2))
    expect(probFilhoRhPositivo('DD')).toEqual(fracao(1))
    expect(probFilhoRhPositivo('dd')).toEqual(fracao(0))
  })
})

describe('Herança ligada ao X', () => {
  it('as probabilidades da prole somam 1', () => {
    for (const pai of ['XAY', 'XaY'] as const)
      for (const mae of ['XAXA', 'XAXa', 'XaXa'] as const) expect(proleX(pai, mae).reduce((s, x) => somar(s, x.p), fracao(0))).toEqual(fracao(1))
  })
  it('mãe portadora × pai normal: 1/2 dos filhos homens afetados, nenhuma filha', () => {
    expect(probAfetadoXR('XAY', 'XAXa', 'M')).toEqual(fracao(1, 2))
    expect(probAfetadoXR('XAY', 'XAXa', 'F')).toEqual(fracao(0))
    expect(probAfetadoXR('XAY', 'XAXa')).toEqual(fracao(1, 4))
  })
  it('mãe afetada × pai normal: todos os filhos homens afetados e filhas portadoras', () => {
    expect(probAfetadoXR('XAY', 'XaXa', 'M')).toEqual(fracao(1))
    expect(probAfetadoXR('XAY', 'XaXa', 'F')).toEqual(fracao(0))
    expect(proleX('XAY', 'XaXa').find((x) => x.sexo === 'F')?.genotipo).toBe('XAXa')
  })
  it('pai afetado × mãe normal: nenhum afetado; todas as filhas portadoras (o filho não herda o X do pai)', () => {
    expect(probAfetadoXR('XaY', 'XAXA')).toEqual(fracao(0))
    const filhas = proleX('XaY', 'XAXA').filter((x) => x.sexo === 'F')
    expect(filhas).toHaveLength(1)
    expect(filhas[0]?.genotipo).toBe('XAXa')
    expect(proleX('XaY', 'XAXA').filter((x) => x.sexo === 'M').every((x) => x.genotipo === 'XAY')).toBe(true)
  })
  it('pai afetado × mãe portadora: 1/2 das filhas e 1/2 dos filhos afetados', () => {
    expect(probAfetadoXR('XaY', 'XAXa', 'F')).toEqual(fracao(1, 2))
    expect(probAfetadoXR('XaY', 'XAXa', 'M')).toEqual(fracao(1, 2))
    expect(probAfetadoXR('XaY', 'XAXa')).toEqual(fracao(1, 2))
  })
})

describe('Hardy-Weinberg', () => {
  it('q = 0,2 → 0,64 AA, 0,32 Aa, 0,04 aa; soma 1', () => {
    const e = hardyWeinberg(0.2)
    expect(e.AA).toBeCloseTo(0.64, 12)
    expect(e.Aa).toBeCloseTo(0.32, 12)
    expect(e.aa).toBeCloseTo(0.04, 12)
    expect(e.AA + e.Aa + e.aa).toBeCloseTo(1, 12)
    expect(qDeAfetados(0.04)).toBeCloseTo(0.2, 12)
  })
  it('contagens → frequências alélicas, e equilíbrio detectado', () => {
    const f = freqAlelicaDeContagens(64, 32, 4)
    expect(f.q).toBeCloseTo(0.2, 12)
    expect(f.p).toBeCloseTo(0.8, 12)
    expect(emEquilibrio(64, 32, 4)).toBe(true)
    expect(emEquilibrio(50, 0, 50)).toBe(false)
    expect(emEquilibrio(10, 80, 10)).toBe(false)
  })
  it('a frequência de portadores 2pq cresce até q = 0,5 e vale 0,5 nesse ponto', () => {
    expect(hardyWeinberg(0.5).Aa).toBeCloseTo(0.5, 12)
    for (const q of [0.05, 0.1, 0.3]) expect(hardyWeinberg(q).Aa).toBeLessThan(0.5)
  })
  it('ligado ao X: homens afetados q; mulheres afetadas q²; portadoras 2pq', () => {
    const x = hardyWeinbergX(0.1)
    expect(x.homensAfetados).toBeCloseTo(0.1, 12)
    expect(x.mulheresAfetadas).toBeCloseTo(0.01, 12)
    expect(x.mulheresPortadoras).toBeCloseTo(0.18, 12)
    expect(x.mulheresNormais + x.mulheresPortadoras + x.mulheresAfetadas).toBeCloseTo(1, 12)
    expect(x.homensAfetados / x.mulheresAfetadas).toBeCloseTo(10, 9) // 1/q homens para cada mulher afetada
  })
})

describe('Herança poligênica', () => {
  it('2 genes: 1 : 4 : 6 : 4 : 1 (de 16), 5 classes; 3 genes: 1 : 6 : 15 : 20 : 15 : 6 : 1 (de 64), 7 classes', () => {
    expect(distribuicaoPoligenica(2).map((f) => f.n * (16 / f.d))).toEqual([1, 4, 6, 4, 1])
    expect(distribuicaoPoligenica(3).map((f) => f.n * (64 / f.d))).toEqual([1, 6, 15, 20, 15, 6, 1])
    expect(classesPoligenicas(2)).toBe(5)
    expect(classesPoligenicas(3)).toBe(7)
    for (const n of [1, 2, 3, 4]) expect(distribuicaoPoligenica(n).reduce((s, f) => somar(s, f), fracao(0))).toEqual(fracao(1))
    expect(distribuicaoPoligenica(4)[0]).toEqual(fracao(1, 256))
  })
})
