import {
  alcano,
  amida,
  carbonosQuirais,
  classeCarbono,
  comGrupos,
  condensada,
  construir,
  construirAnel,
  contarClasses,
  ester,
  eter,
  formulaMolecular,
  funcoes,
  maiorCadeia,
  nomeAmida,
  nomeEster,
  nomeEter,
  nomeIUPAC,
  temInsaturacao,
  type Espec,
  type Funcao,
} from './molecula'

const OH = (no: number) => ({ no, g: 'OH' as const })
const O = (no: number) => ({ no, g: '=O' as const })
const ME = (no: number) => ({ no, g: 'CH3' as const })

describe('fórmula molecular (hidrogênios implícitos)', () => {
  const casos: [string, Espec, string][] = [
    ['butano', alcano(4), 'C4H10'],
    ['butan-2-ol', comGrupos(4, [OH(1)]), 'C4H10O'],
    ['propanona', comGrupos(3, [O(1)]), 'C3H6O'],
    ['propanal', comGrupos(3, [O(0)]), 'C3H6O'],
    ['ácido etanoico', comGrupos(2, [O(0), OH(0)]), 'C2H4O2'],
    ['etanoato de metila', ester(2, 1), 'C3H6O2'],
    ['etoxietano', eter(2, 2), 'C4H10O'],
    ['propanamida', amida(3), 'C3H7NO'],
    ['etanamina', comGrupos(2, [{ no: 0, g: 'NH2' }]), 'C2H7N'],
    ['but-2-eno', comGrupos(4, [], { 1: 2 }), 'C4H8'],
    ['but-1-ino', comGrupos(4, [], { 0: 3 }), 'C4H6'],
    ['2-cloro-2-metilpropano', comGrupos(3, [{ no: 1, g: 'Cl' }, ME(1)]), 'C4H9Cl'],
    ['glicina', comGrupos(2, [{ no: 0, g: 'NH2' }, O(1), OH(1)]), 'C2H5NO2'],
    ['ácido lático', comGrupos(3, [OH(1), O(2), OH(2)]), 'C3H6O3'],
  ]
  for (const [nome, espec, formula] of casos) it(`${nome}: ${formula}`, () => expect(formulaMolecular(construir(espec))).toBe(formula))

  it('anéis aromáticos', () => {
    expect(formulaMolecular(construirAnel())).toBe('C6H6')
    expect(formulaMolecular(construirAnel('OH'))).toBe('C6H6O')
    expect(formulaMolecular(construirAnel('CH3'))).toBe('C7H8')
    expect(formulaMolecular(construirAnel('NH2'))).toBe('C6H7N')
    expect(formulaMolecular(construirAnel('COOH'))).toBe('C7H6O2')
    expect(formulaMolecular(construirAnel('CHO'))).toBe('C7H6O')
    expect(formulaMolecular(construirAnel('Cl'))).toBe('C6H5Cl')
    expect(formulaMolecular(construirAnel('OCH3'))).toBe('C7H8O')
  })
  it('alcanos: CnH2n+2, alcenos: CnH2n, alcinos: CnH2n−2', () => {
    for (let n = 2; n <= 8; n++) {
      expect(formulaMolecular(construir(alcano(n)))).toBe(`C${n}H${2 * n + 2}`)
      expect(formulaMolecular(construir(comGrupos(n, [], { 0: 2 })))).toBe(`C${n}H${2 * n}`)
      expect(formulaMolecular(construir(comGrupos(n, [], { 0: 3 })))).toBe(`C${n}H${2 * n - 2}`)
    }
  })
})

describe('funções orgânicas', () => {
  const casos: [string, Espec, Funcao[]][] = [
    ['propano', alcano(3), ['hidrocarboneto']],
    ['but-2-eno', comGrupos(4, [], { 1: 2 }), ['hidrocarboneto']],
    ['butan-2-ol', comGrupos(4, [OH(1)]), ['alcool']],
    ['butanal', comGrupos(4, [O(0)]), ['aldeido']],
    ['butan-2-ona', comGrupos(4, [O(1)]), ['cetona']],
    ['ácido butanoico', comGrupos(4, [O(0), OH(0)]), ['acido']],
    ['propanoato de metila', ester(3, 1), ['ester']],
    ['metoxietano', eter(1, 2), ['eter']],
    ['propanamida', amida(3), ['amida']],
    ['propan-1-amina', comGrupos(3, [{ no: 0, g: 'NH2' }]), ['amina']],
    ['2-clorobutano', comGrupos(4, [{ no: 1, g: 'Cl' }]), ['haleto']],
    ['ácido lático', comGrupos(3, [OH(1), O(2), OH(2)]), ['acido', 'alcool']],
    ['glicina', comGrupos(2, [{ no: 0, g: 'NH2' }, O(1), OH(1)]), ['acido', 'amina']],
    ['glicolaldeído', comGrupos(2, [OH(1), O(0)]), ['aldeido', 'alcool']],
  ]
  for (const [nome, espec, esperado] of casos) it(nome, () => expect(funcoes(construir(espec))).toEqual(esperado))

  it('anéis aromáticos: fenol não é álcool; anilina é amina; tolueno é hidrocarboneto', () => {
    expect(funcoes(construirAnel('OH'))).toEqual(['fenol'])
    expect(funcoes(construirAnel('NH2'))).toEqual(['amina'])
    expect(funcoes(construirAnel('CH3'))).toEqual(['hidrocarboneto'])
    expect(funcoes(construirAnel('COOH'))).toEqual(['acido'])
    expect(funcoes(construirAnel('CHO'))).toEqual(['aldeido'])
    expect(funcoes(construirAnel('Cl'))).toEqual(['haleto'])
    expect(funcoes(construirAnel('OCH3'))).toEqual(['eter'])
  })
  it('conta insaturações', () => {
    expect(temInsaturacao(construir(comGrupos(4, [], { 1: 2 })))).toEqual({ duplas: 1, triplas: 0 })
    expect(temInsaturacao(construir(comGrupos(4, [], { 0: 3 })))).toEqual({ duplas: 0, triplas: 1 })
    expect(temInsaturacao(construir(comGrupos(4, [O(1)])))).toEqual({ duplas: 0, triplas: 0 })
    expect(temInsaturacao(construirAnel())).toEqual({ duplas: 0, triplas: 0 })
  })
})

describe('nomenclatura IUPAC', () => {
  const casos: [string, Espec][] = [
    ['metano', alcano(1)],
    ['butano', alcano(4)],
    ['2-metilpropano', comGrupos(3, [ME(1)])],
    ['2-metilbutano', comGrupos(4, [ME(1)])],
    ['2,2-dimetilpropano', comGrupos(3, [ME(1), ME(1)])],
    ['2,3-dimetilbutano', comGrupos(4, [ME(1), ME(2)])],
    ['2,2-dimetilbutano', comGrupos(4, [ME(1), ME(1)])],
    ['3-metilpentano', comGrupos(5, [ME(2)])],
    ['eteno', comGrupos(2, [], { 0: 2 })],
    ['propeno', comGrupos(3, [], { 0: 2 })],
    ['but-1-eno', comGrupos(4, [], { 0: 2 })],
    ['but-2-eno', comGrupos(4, [], { 1: 2 })],
    ['pent-2-eno', comGrupos(5, [], { 1: 2 })],
    ['2-metilbut-2-eno', comGrupos(4, [ME(1)], { 1: 2 })],
    ['but-1-ino', comGrupos(4, [], { 0: 3 })],
    ['3-metilbut-1-ino', comGrupos(4, [ME(1)], { 2: 3 })],
    ['metanol', comGrupos(1, [OH(0)])],
    ['etanol', comGrupos(2, [OH(0)])],
    ['propan-1-ol', comGrupos(3, [OH(0)])],
    ['propan-2-ol', comGrupos(3, [OH(1)])],
    ['butan-2-ol', comGrupos(4, [OH(1)])],
    ['pentan-3-ol', comGrupos(5, [OH(2)])],
    ['2-metilpropan-1-ol', comGrupos(3, [OH(0), ME(1)])],
    ['2-metilpropan-2-ol', comGrupos(3, [OH(1), ME(1)])],
    ['3-metilbutan-1-ol', comGrupos(4, [OH(0), ME(2)])],
    ['but-3-en-1-ol', comGrupos(4, [OH(0)], { 2: 2 })],
    ['propanal', comGrupos(3, [O(0)])],
    ['butanal', comGrupos(4, [O(0)])],
    ['2-metilpropanal', comGrupos(3, [O(0), ME(1)])],
    ['propanona', comGrupos(3, [O(1)])],
    ['butan-2-ona', comGrupos(4, [O(1)])],
    ['pentan-2-ona', comGrupos(5, [O(1)])],
    ['pentan-3-ona', comGrupos(5, [O(2)])],
    ['3-metilbutan-2-ona', comGrupos(4, [O(1), ME(2)])],
    ['ácido metanoico', comGrupos(1, [O(0), OH(0)])],
    ['ácido etanoico', comGrupos(2, [O(0), OH(0)])],
    ['ácido propanoico', comGrupos(3, [O(0), OH(0)])],
    ['ácido 2-metilpropanoico', comGrupos(3, [O(0), OH(0), ME(1)])],
    ['ácido 3-metilbutanoico', comGrupos(4, [O(0), OH(0), ME(2)])],
    ['cloroetano', comGrupos(2, [{ no: 0, g: 'Cl' }])],
    ['1-clorobutano', comGrupos(4, [{ no: 0, g: 'Cl' }])],
    ['2-clorobutano', comGrupos(4, [{ no: 1, g: 'Cl' }])],
    ['2-bromo-2-metilpropano', comGrupos(3, [{ no: 1, g: 'Br' }, ME(1)])],
    ['2-bromo-3-clorobutano', comGrupos(4, [{ no: 1, g: 'Br' }, { no: 2, g: 'Cl' }])],
    ['1,2-dicloroetano', comGrupos(2, [{ no: 0, g: 'Cl' }, { no: 1, g: 'Cl' }])],
    ['etanamina', comGrupos(2, [{ no: 0, g: 'NH2' }])],
    ['propan-2-amina', comGrupos(3, [{ no: 1, g: 'NH2' }])],
    ['butan-2-amina', comGrupos(4, [{ no: 1, g: 'NH2' }])],
  ]
  for (const [nome, espec] of casos) it(nome, () => expect(nomeIUPAC(espec)).toBe(nome))

  it('a numeração não depende de em que ponta a cadeia foi escrita', () => {
    // butan-2-ol escrito do outro lado: OH no carbono de índice 2
    expect(nomeIUPAC(comGrupos(4, [OH(2)]))).toBe('butan-2-ol')
    expect(nomeIUPAC(comGrupos(5, [OH(3)]))).toBe('pentan-2-ol')
    expect(nomeIUPAC(comGrupos(4, [ME(2)], { 0: 3 }))).toBe('3-metilbut-1-ino')
    expect(nomeIUPAC(comGrupos(5, [ME(3)]))).toBe('2-metilpentano')
  })
  it('ésteres, éteres e amidas de cadeia linear', () => {
    expect(nomeEster(2, 1)).toBe('etanoato de metila')
    expect(nomeEster(1, 2)).toBe('metanoato de etila')
    expect(nomeEster(3, 2)).toBe('propanoato de etila')
    expect(nomeEter(1, 2)).toBe('metoxietano')
    expect(nomeEter(2, 1)).toBe('metoxietano')
    expect(nomeEter(2, 2)).toBe('etoxietano')
    expect(nomeEter(1, 3)).toBe('metoxipropano')
    expect(nomeAmida(3)).toBe('propanamida')
  })
  it('fora do escopo devolve null (mais de um grupo principal ou heteroátomo na cadeia)', () => {
    expect(nomeIUPAC(comGrupos(3, [OH(0), O(2)]))).toBeNull()
    expect(nomeIUPAC(ester(2, 1))).toBeNull()
  })
})

describe('classes de carbono, cadeia e quiralidade', () => {
  it('primário, secundário, terciário e quaternário', () => {
    expect(contarClasses(construir(comGrupos(4, [ME(1)])))).toMatchObject({ primario: 3, secundario: 1, terciario: 1, quaternario: 0 })
    expect(contarClasses(construir(comGrupos(4, [ME(1), ME(1)])))).toMatchObject({ primario: 4, secundario: 1, terciario: 0, quaternario: 1 })
    expect(contarClasses(construir(alcano(5)))).toMatchObject({ primario: 2, secundario: 3 })
    const m = construir(comGrupos(3, [ME(1)]))
    expect(classeCarbono(m, 1)).toBe('terciario')
  })
  it('a maior cadeia de carbonos', () => {
    expect(maiorCadeia(construir(comGrupos(4, [ME(1)])))).toBe(4)
    expect(maiorCadeia(construir(comGrupos(3, [ME(1), ME(1)])))).toBe(3)
    expect(maiorCadeia(construir(alcano(6)))).toBe(6)
    expect(maiorCadeia(construir(comGrupos(3, [ME(1)])))).toBe(3)
  })
  const quirais: [string, Espec, number][] = [
    ['propan-2-ol (nenhum)', comGrupos(3, [OH(1)]), 0],
    ['butan-2-ol', comGrupos(4, [OH(1)]), 1],
    ['2-clorobutano', comGrupos(4, [{ no: 1, g: 'Cl' }]), 1],
    ['ácido lático', comGrupos(3, [OH(1), O(2), OH(2)]), 1],
    ['2-bromo-3-clorobutano', comGrupos(4, [{ no: 1, g: 'Br' }, { no: 2, g: 'Cl' }]), 2],
    ['3-metilpentano (nenhum)', comGrupos(5, [ME(2)]), 0],
    ['3-metilexano (3-metil-hexano)', comGrupos(6, [ME(2)]), 1],
    ['2-metilbutan-1-ol', comGrupos(4, [OH(0), ME(1)]), 1],
    ['butano (nenhum)', alcano(4), 0],
    ['2-metilpropan-1-ol (nenhum)', comGrupos(3, [OH(0), ME(1)]), 0],
    ['3-metilbutan-2-ol', comGrupos(4, [OH(1), ME(2)]), 1],
    ['glicina (nenhum)', comGrupos(2, [{ no: 0, g: 'NH2' }, O(1), OH(1)]), 0],
    ['alanina', comGrupos(3, [{ no: 1, g: 'NH2' }, O(2), OH(2)]), 1],
  ]
  for (const [nome, espec, n] of quirais) it(`carbonos quirais em ${nome}: ${n}`, () => expect(carbonosQuirais(construir(espec)).length).toBe(n))
})

describe('desenho', () => {
  const pool: Espec[] = [
    alcano(5),
    comGrupos(4, [ME(1), OH(1)]),
    comGrupos(4, [ME(1), ME(1)]),
    comGrupos(3, [O(0), OH(0), ME(1)]),
    comGrupos(2, [{ no: 0, g: 'NH2' }, O(1), OH(1)]),
    comGrupos(4, [{ no: 1, g: 'Br' }, { no: 2, g: 'Cl' }]),
    ester(3, 2),
    eter(2, 3),
    amida(3),
    comGrupos(6, [OH(2), ME(3)], { 0: 2 }),
    comGrupos(4, [], { 1: 2 }),
    { ...comGrupos(4, [], { 1: 2 }), cis: true },
  ]
  it('nenhum par de átomos fica sobreposto e as ligações têm comprimento regular', () => {
    for (const espec of pool) {
      const m = construir(espec)
      for (let i = 0; i < m.atomos.length; i++)
        for (let j = i + 1; j < m.atomos.length; j++) {
          const a = m.atomos[i]!
          const b = m.atomos[j]!
          expect(Math.hypot(a.x - b.x, a.y - b.y), `${JSON.stringify(espec)}: ${i}-${j}`).toBeGreaterThan(20)
        }
      for (const l of m.ligacoes) {
        const a = m.atomos[l.a]!
        const b = m.atomos[l.b]!
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(30, 5)
      }
    }
  })
  it('tudo cabe na caixa calculada', () => {
    for (const espec of pool) {
      const m = construir(espec)
      for (const a of m.atomos) {
        expect(a.x).toBeGreaterThanOrEqual(0)
        expect(a.y).toBeGreaterThanOrEqual(0)
        expect(a.x).toBeLessThanOrEqual(m.largura)
        expect(a.y).toBeLessThanOrEqual(m.altura)
      }
    }
  })
  it('cis: os dois grupos ficam do mesmo lado da dupla; trans: de lados opostos', () => {
    const lado = (cis: boolean) => {
      const m = construir({ ...comGrupos(4, [], { 1: 2 }), cis })
      const [c1, c2, c3, c4] = m.atomos as [(typeof m.atomos)[0], (typeof m.atomos)[0], (typeof m.atomos)[0], (typeof m.atomos)[0]]
      const lado = (p: typeof c1) => Math.sign((c3.x - c2.x) * (p.y - c2.y) - (c3.y - c2.y) * (p.x - c2.x))
      return [lado(c1), lado(c4)]
    }
    const [a, b] = lado(true)
    expect(a).toBe(b)
    const [c, d] = lado(false)
    expect(c).toBe(-d!)
  })
  it('o lado forçado dos substituintes é respeitado (1,2-dicloroeteno cis e trans)', () => {
    const lados = (cis: boolean) => {
      const m = construir({ cadeia: ['C', 'C'], lig: { 0: 2 }, subs: [{ no: 0, g: 'Cl', lado: 1 }, { no: 1, g: 'Cl', lado: cis ? 1 : -1 }] })
      const cls = m.atomos.filter((a) => a.el === 'Cl')
      return cls.map((a) => Math.sign(m.atomos[a.id === 2 ? 0 : 1]!.y - a.y))
    }
    expect(new Set(lados(true)).size).toBe(1)
    expect(new Set(lados(false)).size).toBe(2)
  })
})

describe('fórmula condensada', () => {
  const casos: [string, Espec, string][] = [
    ['butano', alcano(4), 'CH3–CH2–CH2–CH3'],
    ['butan-2-ol', comGrupos(4, [OH(1)]), 'CH3–CH(OH)–CH2–CH3'],
    ['2-metilpropano', comGrupos(3, [ME(1)]), 'CH3–CH(CH3)–CH3'],
    ['2,2-dimetilpropano', comGrupos(3, [ME(1), ME(1)]), 'CH3–C(CH3)(CH3)–CH3'],
    ['propanal', comGrupos(3, [O(0)]), 'CHO–CH2–CH3'],
    ['propanona', comGrupos(3, [O(1)]), 'CH3–CO–CH3'],
    ['ácido etanoico', comGrupos(2, [O(1), OH(1)]), 'CH3–COOH'],
    ['etanoato de metila', ester(2, 1), 'CH3–COO–CH3'],
    ['etoxietano', eter(2, 2), 'CH3–CH2–O–CH2–CH3'],
    ['propanamida', amida(3), 'CH3–CH2–CONH2'],
    ['but-2-eno', comGrupos(4, [], { 1: 2 }), 'CH3–CH=CH–CH3'],
    ['but-1-ino', comGrupos(4, [], { 0: 3 }), 'CH≡C–CH2–CH3'],
    ['2-clorobutano', comGrupos(4, [{ no: 1, g: 'Cl' }]), 'CH3–CH(Cl)–CH2–CH3'],
    ['glicina', comGrupos(2, [{ no: 0, g: 'NH2' }, O(1), OH(1)]), 'CH2(NH2)–COOH'],
  ]
  for (const [nome, espec, txt] of casos) it(`${nome}: ${txt}`, () => expect(condensada(espec)).toBe(txt))
})
