import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { gerarContagem, gerarFuncao, gerarIsomeria, gerarNome, molDe, TODOS_OS_PARES } from './geradores'
import { assinatura, comGrupos, construir, formulaMolecular, funcoes, hidrogenios, maiorCadeia, temInsaturacao, type Espec, type Funcao, type Molecula, type Sub } from './molecula'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 9973 + n)

/* ---- leitor de nomes escrito à parte, só para o teste: reconstrói a molécula a partir do nome ---- */

const RADICAIS = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct']
const PREFIXOS: Record<string, Sub> = { metil: 'CH3', cloro: 'Cl', bromo: 'Br', fluoro: 'F' }

function lerNome(nomeOriginal: string): Espec {
  let nome = nomeOriginal
  let acido = false
  if (nome.startsWith('ácido ')) {
    acido = true
    nome = nome.slice(6)
  }
  // prefixos: "2,3-dimetil", "2-bromo-3-cloro"
  const subs: { no: number; g: Sub }[] = []
  const re = /^(\d+(?:,\d+)*)-(di|tri|tetra)?(metil|cloro|bromo|fluoro)-?/
  for (;;) {
    const m = re.exec(nome)
    if (!m) break
    for (const loc of (m[1] as string).split(',')) subs.push({ no: Number(loc) - 1, g: PREFIXOS[m[3] as string] as Sub })
    nome = nome.slice(m[0].length)
  }
  // prefixo sem locante (cloroetano)
  const semLoc = /^(metil|cloro|bromo|fluoro)/.exec(nome)
  if (semLoc && !RADICAIS.includes(semLoc[1] as string)) {
    subs.push({ no: 0, g: PREFIXOS[semLoc[1] as string] as Sub })
    nome = nome.slice((semLoc[1] as string).length)
  }
  const radical = [...RADICAIS].reverse().find((r) => r && nome.startsWith(r)) as string
  const n = RADICAIS.indexOf(radical)
  let resto = nome.slice(radical.length)
  const lig: Record<number, 2 | 3> = {}
  // insaturação: "-2-eno", "-1-ino", "eno", "-3-en-1-ol"
  const mIns = /^(?:-(\d+)-)?(en|in)(?=o$|-)/.exec(resto)
  if (mIns) {
    lig[mIns[1] ? Number(mIns[1]) - 1 : 0] = mIns[2] === 'en' ? 2 : 3
    resto = resto.slice(mIns[0].length)
    if (resto === 'o') resto = ''
  } else if (resto === 'ano') resto = ''
  const grupo = (re2: RegExp, padrao: number) => {
    const m = re2.exec(resto)
    return m ? (m[1] ? Number(m[1]) - 1 : padrao) : null
  }
  if (acido) {
    subs.push({ no: 0, g: '=O' }, { no: 0, g: 'OH' })
  } else if (resto === 'anal') subs.push({ no: 0, g: '=O' })
  else {
    const ol = grupo(/^an?-?(?:(\d+)-)?ol$|^-(\d+)-ol$/, 0)
    const mOl = /(?:an-(\d+)-ol|an(ol)|-(\d+)-ol)$/.exec(resto)
    if (mOl) subs.push({ no: mOl[1] ? Number(mOl[1]) - 1 : mOl[3] ? Number(mOl[3]) - 1 : 0, g: 'OH' })
    const mOna = /an(?:-(\d+)-)?ona$/.exec(resto)
    if (mOna) subs.push({ no: mOna[1] ? Number(mOna[1]) - 1 : 1, g: '=O' })
    const mAmina = /an(?:-(\d+)-)?amina$/.exec(resto)
    if (mAmina) subs.push({ no: mAmina[1] ? Number(mAmina[1]) - 1 : 0, g: 'NH2' })
    void ol
  }
  return { cadeia: Array(n).fill('C'), subs, lig: Object.keys(lig).length ? lig : undefined }
}

function estruturaEmEspec(est: unknown): Espec {
  return (est as { espec: Espec }).espec
}

describe('leitor de nomes do teste (calibração)', () => {
  const ok: [string, Espec][] = [
    ['butan-2-ol', comGrupos(4, [{ no: 1, g: 'OH' }])],
    ['2,2-dimetilbutano', comGrupos(4, [{ no: 1, g: 'CH3' }, { no: 1, g: 'CH3' }])],
    ['but-3-en-1-ol', comGrupos(4, [{ no: 0, g: 'OH' }], { 2: 2 })],
    ['ácido 2-metilpropanoico', comGrupos(3, [{ no: 0, g: '=O' }, { no: 0, g: 'OH' }, { no: 1, g: 'CH3' }])],
    ['2-bromo-3-clorobutano', comGrupos(4, [{ no: 1, g: 'Br' }, { no: 2, g: 'Cl' }])],
    ['cloroetano', comGrupos(2, [{ no: 0, g: 'Cl' }])],
    ['propanona', comGrupos(3, [{ no: 1, g: '=O' }])],
  ]
  for (const [nome, espec] of ok) it(nome, () => expect(assinatura(construir(lerNome(nome)))).toBe(assinatura(construir(espec))))
})

describe('Qual é a função?', () => {
  const ESPERADO: Record<string, Funcao[]> = {
    alcool: ['alcool'],
    aldeido: ['aldeido'],
    cetona: ['cetona'],
    acido: ['acido'],
    ester: ['ester'],
    eter: ['eter'],
    amina: ['amina'],
    amida: ['amida'],
    haleto: ['haleto'],
    hidrocarboneto: ['hidrocarboneto'],
    'fenol-aromatico': ['fenol'],
    'amina-aromatico': ['amina'],
    'hidrocarboneto-aromatico': ['hidrocarboneto'],
    'acido-aromatico': ['acido'],
    'aldeido-aromatico': ['aldeido'],
    'haleto-aromatico': ['haleto'],
    'eter-aromatico': ['eter'],
    'acido+alcool': ['acido', 'alcool'],
    'acido+amina': ['acido', 'amina'],
    'aldeido+alcool': ['aldeido', 'alcool'],
    'aldeido+amina': ['aldeido', 'amina'],
    'cetona+alcool': ['cetona', 'alcool'],
    'cetona+amina': ['cetona', 'amina'],
    'alcool+haleto': ['alcool', 'haleto'],
    'acido+haleto': ['acido', 'haleto'],
  }
  it('a detecção de funções no grafo confere com a família usada para construir a molécula', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarFuncao(rng(s, n), n)
        const d = inst.dados!
        expect(d.funcoes, d.familia).toEqual(ESPERADO[d.familia])
        expect(funcoes(molDe(d.est))).toEqual(d.funcoes)
      }
  })
  it('a alternativa certa lista exatamente as funções detectadas', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarFuncao(rng(s, n), n)
        const rotulo = inst.opcoes.find((o) => o.id === inst.certa)!.rotulo
        const nomes = rotulo.split(' e ').sort()
        const esperados = inst.dados!.funcoes.map((f) => ({ hidrocarboneto: 'Hidrocarboneto', alcool: 'Álcool', fenol: 'Fenol', eter: 'Éter', aldeido: 'Aldeído', cetona: 'Cetona', acido: 'Ácido carboxílico', ester: 'Éster', amina: 'Amina', amida: 'Amida', haleto: 'Haleto orgânico' })[f]).sort()
        expect(nomes).toEqual(esperados)
      }
  })
  it('níveis: 1 simples, 2 oxigenadas e nitrogenadas, 3 aromáticas e bifuncionais', () => {
    const fam = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarFuncao(rng(s, n), n).dados!.familia))
    expect([...fam(1)].sort()).toEqual(['acido', 'alcool', 'aldeido', 'cetona', 'hidrocarboneto'])
    expect(fam(2).has('ester')).toBe(true)
    expect(fam(2).has('amida')).toBe(true)
    expect([...fam(3)].some((f) => f.includes('+'))).toBe(true)
    expect(fam(3).has('fenol-aromatico')).toBe(true)
  })
  it('alternativas distintas, a certa aceita e cada errada com explicação própria', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarFuncao(rng(s, n), n)
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(4)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(40)
          expect(c.motivo).not.toBe('opção errada')
        }
      }
  })
})

describe('Qual é o nome?', () => {
  it('o nome da alternativa certa, lido de volta, reconstrói a molécula desenhada (cadeias de carbono)', () => {
    let vistas = 0
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarNome(rng(s, n), n)
        const d = inst.dados!
        if (['éster', 'éter', 'amida'].includes(d.familia)) continue
        vistas++
        const esp = estruturaEmEspec(d.est)
        const lida = lerNome(d.nome)
        expect(assinatura(construir(lida)), `${d.nome} / ${JSON.stringify(esp)}`).toBe(assinatura(construir(esp)))
        expect(inst.opcoes.find((o) => o.id === inst.certa)!.rotulo).toBe(d.nome)
      }
    expect(vistas).toBeGreaterThan(250)
  })
  it('as alternativas erradas descrevem OUTRA molécula (ou uma numeração errada), nunca a mesma', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarNome(rng(s, n), n)
        const d = inst.dados!
        if (['éster', 'éter', 'amida'].includes(d.familia)) continue
        const alvo = assinatura(construir(estruturaEmEspec(d.est)))
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const motivo = inst.motivo![o.id]
          if (motivo === 'numerou a cadeia pela ponta errada') continue // nome inválido de propósito: descreve a mesma molécula com locantes errados
          expect(assinatura(construir(lerNome(o.rotulo))), `${o.rotulo} (${motivo})`).not.toBe(alvo)
        }
      }
  })
  it('as quatro alternativas são distintas, a certa é aceita e cada errada tem explicação e motivo', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarNome(rng(s, n), n)
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(4)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(30)
          expect(c.motivo).not.toBe('opção errada')
        }
      }
  })
  it('éster, éter e amida: o nome confere com o número de carbonos de cada lado', () => {
    let vistas = 0
    const RAD = ['', 'met', 'et', 'prop', 'but']
    const ALQ = ['', 'metila', 'etila', 'propila', 'butila']
    const ALX = ['', 'metoxi', 'etoxi', 'propoxi', 'butoxi']
    for (const s of SEMENTES) {
      const inst = gerarNome(rng(s, 3), 3)
      const d = inst.dados!
      const esp = estruturaEmEspec(d.est)
      if (d.familia === 'éster') {
        vistas++
        const i = esp.cadeia.indexOf('O')
        expect(d.nome).toBe(`${RAD[i]}anoato de ${ALQ[esp.cadeia.length - i - 1]}`)
        expect(funcoes(construir(esp))).toEqual(['ester'])
      } else if (d.familia === 'éter') {
        vistas++
        const i = esp.cadeia.indexOf('O')
        const a = i
        const b = esp.cadeia.length - i - 1
        expect(d.nome).toBe(`${ALX[Math.min(a, b)]}${RAD[Math.max(a, b)]}ano`)
        expect(funcoes(construir(esp))).toEqual(['eter'])
      } else if (d.familia === 'amida') {
        vistas++
        expect(d.nome).toBe(`${RAD[esp.cadeia.length - 1]}anamida`)
        expect(funcoes(construir(esp))).toEqual(['amida'])
      }
    }
    expect(vistas).toBeGreaterThan(30)
  })
  it('níveis: 1 sem ramificação; 2 numeração pela ponta certa; 3 ramificados e ésteres/éteres/amidas', () => {
    for (const s of SEMENTES) {
      const d1 = gerarNome(rng(s, 1), 1).dados!
      expect(estruturaEmEspec(d1.est).subs?.filter((x) => x.g === 'CH3') ?? []).toHaveLength(0)
    }
    let ramificados = 0
    let especiais = 0
    for (const s of SEMENTES) {
      const d3 = gerarNome(rng(s, 3), 3).dados!
      if (['éster', 'éter', 'amida'].includes(d3.familia)) especiais++
      else if ((estruturaEmEspec(d3.est).subs ?? []).some((x) => x.g === 'CH3')) ramificados++
    }
    expect(ramificados).toBeGreaterThan(30)
    expect(especiais).toBeGreaterThan(30)
  })
})

describe('Isomeria', () => {
  const vistos = <T,>(f: (par: [ReturnType<typeof molDe>, ReturnType<typeof molDe>]) => T) =>
    Object.entries(TODOS_OS_PARES).flatMap(([tipo, lista]) => lista.map(([a, b]) => ({ tipo, ...{ r: f([molDe(a), molDe(b)]) } })))

  it('isômeros têm a mesma fórmula molecular; "não são isômeros" têm fórmulas diferentes', () => {
    for (const { tipo, r } of vistos(([a, b]) => formulaMolecular(a) === formulaMolecular(b))) expect(r, tipo).toBe(tipo !== 'nao')
  })
  it('função: as funções detectadas são diferentes', () => {
    for (const [a, b] of TODOS_OS_PARES.funcao) expect(funcoes(molDe(a)).join()).not.toBe(funcoes(molDe(b)).join())
  })
  it('cadeia: mesma função, mas a maior cadeia de carbonos muda', () => {
    for (const [a, b] of TODOS_OS_PARES.cadeia) {
      expect(funcoes(molDe(a)).join()).toBe(funcoes(molDe(b)).join())
      expect(maiorCadeia(molDe(a))).not.toBe(maiorCadeia(molDe(b)))
    }
  })
  it('posição: mesma função, mesma maior cadeia, estruturas diferentes', () => {
    for (const [a, b] of TODOS_OS_PARES.posicao) {
      expect(funcoes(molDe(a)).join()).toBe(funcoes(molDe(b)).join())
      expect(maiorCadeia(molDe(a))).toBe(maiorCadeia(molDe(b)))
      expect(assinatura(molDe(a))).not.toBe(assinatura(molDe(b)))
    }
  })
  it('compensação: mesma função, estruturas diferentes, com o oxigênio dividindo a cadeia em tamanhos diferentes', () => {
    for (const [a, b] of TODOS_OS_PARES.compensacao) {
      expect(funcoes(molDe(a)).join()).toBe(funcoes(molDe(b)).join())
      expect(assinatura(molDe(a))).not.toBe(assinatura(molDe(b)))
    }
  })
  it('geométrica: mesma estrutura de ligações e arranjos diferentes no espaço', () => {
    for (const [a, b] of TODOS_OS_PARES.geometrica) {
      const ma = molDe(a)
      const mb = molDe(b)
      expect(assinatura(ma)).toBe(assinatura(mb))
      const posicoes = (m: Molecula) => m.atomos.map((x) => `${Math.round(x.x)},${Math.round(x.y)}`).join('|')
      expect(posicoes(ma)).not.toBe(posicoes(mb))
      expect(temInsaturacao(ma).duplas).toBe(1)
    }
  })
  it('todas as moléculas dos pares têm valências corretas', () => {
    for (const lista of Object.values(TODOS_OS_PARES))
      for (const par of lista)
        for (const e of par) {
          const m = molDe(e)
          expect(m.atomos.every((a) => hidrogenios(m, a.id) >= 0)).toBe(true)
        }
  })
  it('a alternativa certa corresponde ao tipo do par e as erradas explicam o que de fato ocorre', () => {
    const NOMES: Record<string, string> = { cadeia: 'Isomeria de cadeia', posicao: 'Isomeria de posição', funcao: 'Isomeria de função', compensacao: 'Isomeria de compensação (metameria)', geometrica: 'Isomeria geométrica (cis-trans)', nao: 'Não são isômeros' }
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarIsomeria(rng(s, n), n)
        const d = inst.dados!
        expect(inst.opcoes.find((o) => o.id === inst.certa)!.rotulo).toBe(NOMES[d.tipo])
        expect(new Set(inst.opcoes.map((o) => o.rotulo)).size).toBe(inst.opcoes.length)
        expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) continue
          const c = corrigirMulti(inst, o.id)
          expect(c.correto).toBe(false)
          expect(inst.porque[o.id]).toContain('Aqui, porém')
          expect(c.motivo).not.toBe('opção errada')
        }
      }
  })
  it('níveis: 1 só cadeia/posição/não; 2 inclui função; 3 inclui compensação e geométrica', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarIsomeria(rng(s, n), n).dados!.tipo))
    expect([...tipos(1)].sort()).toEqual(['cadeia', 'nao', 'posicao'])
    expect(tipos(2).has('funcao')).toBe(true)
    expect(tipos(3).has('compensacao') && tipos(3).has('geometrica')).toBe(true)
  })
})

describe('Contagem', () => {
  /** H pelo grau de insaturação: H = 2C + 2 + N − X − 2·DBE, com DBE = ligações π (C=C, C=O, C≡C conta 2) */
  function hPelaFormula(m: Molecula): number {
    const c = m.atomos.filter((a) => a.el === 'C').length
    const n = m.atomos.filter((a) => a.el === 'N').length
    const x = m.atomos.filter((a) => ['F', 'Cl', 'Br'].includes(a.el)).length
    const pi = m.ligacoes.reduce((s, l) => s + (l.ordem - 1), 0)
    return 2 * c + 2 + n - x - 2 * pi
  }
  it('nível 1: a contagem de hidrogênios confere com o grau de insaturação', () => {
    for (const s of SEMENTES) {
      const inst = gerarContagem(rng(s, 1), 1)
      const m = molDe(inst.dados!.est)
      expect(inst.resposta).toBe(hPelaFormula(m))
      expect(formulaMolecular(m)).toContain(`H${inst.resposta}`)
    }
  })
  it('nível 2: as classes de carbono conferem com a contagem de ligações C–C', () => {
    for (const s of SEMENTES) {
      const inst = gerarContagem(rng(s, 2), 2)
      const d = inst.dados!
      const m = molDe(d.est)
      const grau = m.atomos.map((a) => m.ligacoes.filter((l) => (l.a === a.id || l.b === a.id) && m.atomos[l.a === a.id ? l.b : l.a]!.el === 'C').length)
      const alvo = { primario: 1, secundario: 2, terciario: 3, quaternario: 4 }[d.classe as 'primario']
      const esperado = m.atomos.filter((a, i) => a.el === 'C' && grau[i] === alvo).length
      expect(inst.resposta).toBe(esperado)
      expect(esperado).toBeGreaterThanOrEqual(1)
    }
  })
  it('nível 3: variam as respostas (0, 1 e 2) e as moléculas têm valências corretas', () => {
    const respostas = new Set<number>()
    for (const s of SEMENTES) {
      const inst = gerarContagem(rng(s, 3), 3)
      respostas.add(inst.resposta)
      const m = molDe(inst.dados!.est)
      expect(m.atomos.every((a) => hidrogenios(m, a.id) >= 0)).toBe(true)
    }
    expect([...respostas].sort()).toEqual([0, 1, 2])
  })
  it('erros típicos válidos, resposta aceita e todos os erros marcados como erro', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarContagem(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(2)
        expect(corrigirNum(inst, String(inst.resposta)).correto).toBe(true)
        for (const e of inst.erros) {
          expect(e.valor).not.toBe(inst.resposta)
          expect(corrigirNum(inst, String(e.valor)).correto).toBe(false)
        }
      }
  })
})
