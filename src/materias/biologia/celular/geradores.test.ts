import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '../comum/checagens'
import { itemValido } from '../comum/auxiliares'
import { BANCO_ORGANELAS, CENARIOS_TRANSPORTE, MOLARES, PROPRIEDADES_ORGANELAS, gerarMembrana, gerarOrganelas, gerarOsmose, type DadosTonicidade, type DadosTransporte } from './geradores'
import { PAR_CONFUSAO, PISTAS, gerarContagem, gerarFases, minus, type DadosFase } from './geradoresDivisao'
import { BANCO_METABOLISMO_1, BANCO_METABOLISMO_3, gerarEnergia, gerarMetabolismo, parametrosLuz, temperaturasDistintas, type DadosEnzima, type DadosLuz } from './geradoresEnergia'
import { ESTRUTURAS } from './calculo'
import { desenhar, type Desenho } from './desenhoDivisao'

const num = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'))
/** Número de partículas por fórmula, escrito à parte (conferência independente da tabela do código). */
const PARTICULAS: Record<string, number> = { glicose: 1, sacarose: 1, NaCl: 2, KCl: 2, 'CaCl₂': 3, 'Na₂SO₄': 3 }
const NOMES_SOLUTO = Object.keys(PARTICULAS).join('|')

describe('Organelas', () => {
  const PALAVRA: Record<string, string> = {
    Núcleo: 'guarda o DNA',
    Mitocôndria: 'respiração celular aeróbica',
    Cloroplasto: 'fotossíntese',
    'Retículo endoplasmático rugoso': 'ribossomos aderidos',
    'Retículo endoplasmático liso': 'lipídios e esteroides',
    'Complexo de Golgi': 'empacota',
    Peroxissomo: 'peróxido de hidrogênio',
    'Vacúolo central': 'turgescência',
    Ribossomo: 'lendo o mRNA',
    'Parede celular': 'celulose',
    Centríolo: 'microtúbulos',
    'Membrana plasmática': 'delimita a célula',
  }
  const CONJUNTOS: Record<string, string[]> = {
    'existe na célula vegetal, mas não na célula animal': ['Cloroplasto', 'Vacúolo central', 'Parede celular'],
    'existe na célula animal, mas não na vegetal': ['Centríolo'],
    'existe também nas bactérias': ['Ribossomo', 'Parede celular', 'Membrana plasmática'],
    'não existe nas bactérias': ESTRUTURAS.map((e) => e.nome).filter((n) => !['Ribossomo', 'Parede celular', 'Membrana plasmática'].includes(n)),
    'tem DNA próprio': ['Mitocôndria', 'Cloroplasto'],
    'é delimitada por duas membranas': ['Núcleo', 'Mitocôndria', 'Cloroplasto'],
    'não é delimitada por membrana': ['Ribossomo', 'Parede celular', 'Centríolo'],
  }
  it('nível 1: a função do enunciado é a da estrutura certa e de nenhuma outra opção', () => {
    for (const s of SEMENTES) {
      const inst = gerarOrganelas(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const certa = textoCerto(inst)
      expect(inst.enunciado, `s${s}`).toContain(PALAVRA[certa] as string)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(inst.enunciado, `s${s}: ${o.rotulo}`).not.toContain(PALAVRA[o.rotulo] as string)
      const nomes = inst.opcoes.map((o) => o.rotulo)
      if (certa === 'Ribossomo' || certa === 'Retículo endoplasmático rugoso') expect(nomes.includes('Ribossomo') && nomes.includes('Retículo endoplasmático rugoso'), `s${s}: opções que se confundem`).toBe(false)
    }
  })
  it('nível 2: só a opção certa satisfaz a propriedade, conferida com os conjuntos escritos à parte', () => {
    const vistas = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarOrganelas(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const chave = Object.keys(CONJUNTOS).find((k) => inst.enunciado.includes(k)) as string
      vistas.add(chave)
      const conj = CONJUNTOS[chave] as string[]
      for (const o of inst.opcoes) expect(conj.includes(o.rotulo), `s${s} ${chave} → ${o.rotulo}`).toBe(o.id === inst.certa)
    }
    expect(vistas.size).toBe(PROPRIEDADES_ORGANELAS.length)
  })
  it('nível 3: perguntas do banco, todas bem formadas', () => {
    expect(BANCO_ORGANELAS.every(itemValido)).toBe(true)
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarOrganelas(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      vistos.add(inst.enunciado)
    }
    expect(vistos.size).toBe(BANCO_ORGANELAS.length)
  })
})

describe('Membrana', () => {
  it('nível 1: o tipo de transporte segue as três características do enunciado', () => {
    const certos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarMembrana(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const favor = inst.enunciado.includes('a favor do gradiente')
      const proteina = inst.enunciado.includes('com a ajuda de proteínas')
      const atp = inst.enunciado.includes('com gasto de ATP')
      const esperado = !favor || atp ? 'Transporte ativo' : proteina ? 'Difusão facilitada' : 'Difusão simples'
      expect(textoCerto(inst), `s${s}`).toBe(esperado)
      certos.add(esperado)
      expect(inst.opcoes.map((o) => o.rotulo)).toContain('Endocitose')
    }
    expect(certos.size).toBe(3)
  })
  it('nível 2: gradiente decide (contra = ativo); a favor: apolar e pequeno = simples, polar ou íon = facilitada', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarMembrana(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const d = inst.dados as DadosTransporte
      const aFavor = d.sentido === 'entra' ? d.fora > d.dentro : d.dentro > d.fora
      const gas = /O₂|CO₂/.test(d.substancia) && !d.substancia.includes('íons')
      const esperado = !aFavor ? 'Transporte ativo' : gas ? 'Difusão simples' : 'Difusão facilitada'
      expect(textoCerto(inst), `s${s}: ${d.substancia}`).toBe(esperado)
      vistos.add(d.substancia)
      expect(inst.opcoes.map((o) => o.rotulo)).toContain('Osmose')
    }
    expect(vistos.size).toBe(CENARIOS_TRANSPORTE.length)
  })
  it('nível 2: todos os cenários são fisiologicamente coerentes (sentido, gradiente e modo)', () => {
    for (const c of CENARIOS_TRANSPORTE) {
      const aFavor = c.sentido === 'entra' ? c.fora > c.dentro : c.dentro > c.fora
      expect(c.modo === 'ativo', c.nome).toBe(!aFavor)
    }
  })
  it('nível 3: o efeito na célula segue a comparação da osmolaridade da solução com 0,30 osmol/L', () => {
    const efeitos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarMembrana(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const d = inst.dados as DadosTonicidade
      const m = /solução de (.+?) ([\d,]+) mol\/L/.exec(inst.enunciado) as RegExpExecArray
      const nome = m[1] as string
      const osm = num(m[2] as string) * (PARTICULAS[nome] as number)
      expect(d.osmolaridadeExterna, `s${s}`).toBeCloseTo(osm, 9)
      const t = osm < 0.3 - 1e-9 ? 'hipo' : osm > 0.3 + 1e-9 ? 'hiper' : 'iso'
      const certa = textoCerto(inst)
      const esperado = d.celula === 'hemacia' ? { hipo: 'Ganha água, incha', iso: 'Mantém o volume', hiper: 'Perde água e murcha' }[t] : { hipo: 'Ganha água e fica túrgida', iso: 'Fica flácida', hiper: 'Perde água e sofre plasmólise' }[t]
      expect(certa.startsWith(esperado as string), `s${s}: ${d.celula} ${osm} → ${certa}`).toBe(true)
      efeitos.add(`${d.celula}-${t}`)
      // a opção "impossível" para o tipo de célula está presente
      const textos = inst.opcoes.map((o) => o.rotulo).join(' | ')
      expect(textos).toContain(d.celula === 'hemacia' ? 'Sofre plasmólise: a membrana' : 'estoura (lise)')
    }
    expect(efeitos.size).toBe(6)
  })
  it('as combinações de soluto e concentração cobrem as três situações, inclusive o isotônico com CaCl₂ 0,1 mol/L', () => {
    const iso = MOLARES.flatMap((m) => Object.entries(PARTICULAS).map(([n, i]) => ({ n, m, osm: Math.round(m * i * 1000) / 1000 }))).filter((x) => x.osm === 0.3)
    expect(iso.map((x) => `${x.n} ${x.m}`).sort()).toEqual(['CaCl₂ 0.1', 'KCl 0.15', 'Na₂SO₄ 0.1', 'NaCl 0.15', 'glicose 0.3', 'sacarose 0.3'].sort())
  })
})

describe('Osmose em números', () => {
  it('nível 1: osmolaridade = concentração × partículas por fórmula', () => {
    for (const s of SEMENTES) {
      const inst = gerarOsmose(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`)
      const m = new RegExp(`solução de (${NOMES_SOLUTO}) tem concentração ([\\d,]+) mol/L`).exec(inst.enunciado) as RegExpExecArray
      expect(inst.resposta, `s${s}`).toBeCloseTo(num(m[2] as string) * (PARTICULAS[m[1] as string] as number), 9)
    }
  })
  it('nível 2: concentração isotônica = osmolaridade ÷ partículas (e reproduz a osmolaridade da célula)', () => {
    for (const s of SEMENTES) {
      const inst = gerarOsmose(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`)
      const osm = num((/osmolaridade de ([\d,]+) osmol/.exec(inst.enunciado) as RegExpExecArray)[1] as string)
      const nome = (new RegExp(`solução de (${NOMES_SOLUTO}) isotônica`).exec(inst.enunciado) as RegExpExecArray)[1] as string
      expect(inst.resposta * (PARTICULAS[nome] as number), `s${s}`).toBeCloseTo(osm, 9)
    }
  })
  it('nível 3: pressão osmótica (van’t Hoff, T em kelvin) ou diluição até 0,15 mol/L', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarOsmose(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`)
      if (inst.enunciado.includes('pressão osmótica')) {
        tipos.add('pressao')
        const m = new RegExp(`solução de (${NOMES_SOLUTO}) ([\\d,]+) mol/L a (\\d+) °C`).exec(inst.enunciado) as RegExpExecArray
        const esperado = (PARTICULAS[m[1] as string] as number) * num(m[2] as string) * 0.082 * (Number(m[3]) + 273)
        expect(inst.resposta, `s${s}`).toBeCloseTo(esperado, 3)
      } else {
        tipos.add('diluicao')
        const m = /Tem-se ([\d,]+) mL de solução de NaCl ([\d,]+) mol\/L/.exec(inst.enunciado) as RegExpExecArray
        const v2 = (num(m[1] as string) * num(m[2] as string)) / 0.15
        expect(inst.resposta, `s${s}`).toBeCloseTo(v2, 6)
        expect(v2).toBeGreaterThan(num(m[1] as string))
      }
    }
    expect(tipos.size).toBe(2)
  })
})

/* ------------------------------------------------------------------ divisão */

/** Contagens por fase, escritas à parte a partir do raciocínio (não da tabela do código). Retorna cromossomos, cromátides e células. */
function esperadoFase(tipo: 'mitose' | 'meiose', fase: string, n2: number) {
  const n = n2 / 2
  if (tipo === 'mitose') {
    return ({ G1: [n2, n2, 1], Prófase: [n2, 2 * n2, 1], Metáfase: [n2, 2 * n2, 1], Anáfase: [2 * n2, 2 * n2, 1], Telófase: [n2, n2, 2] } as Record<string, number[]>)[fase] as number[]
  }
  return ({
    'Prófase I': [n2, 2 * n2, 1],
    'Metáfase I': [n2, 2 * n2, 1],
    'Anáfase I': [n2, 2 * n2, 1],
    'Telófase I': [n, n2, 2],
    'Prófase II': [n, n2, 2],
    'Metáfase II': [n, n2, 2],
    'Anáfase II': [n2, n2, 2],
    'Telófase II': [n, n, 4],
  } as Record<string, number[]>)[fase] as number[]
}

describe('Contagens na divisão celular', () => {
  const fasePedida = (e: string) => {
    const m = /(?:na fase (G1)|na (prófase|metáfase|anáfase|telófase)( II| I)?) ?(?:do ciclo|da mitose|da meiose)?/i.exec(e) as RegExpExecArray
    const nome = m[1] ?? `${(m[2] as string)[0]?.toUpperCase()}${(m[2] as string).slice(1)}${m[3] ?? ''}`
    return nome
  }
  it('nível 1 (mitose) e nível 2 (meiose): a resposta bate com as contagens por fase, escritas à parte', () => {
    for (const nivel of [1, 2] as const)
      for (const s of SEMENTES) {
        const inst = gerarContagem(rngTeste(s, nivel), nivel)
        checarNum(inst, `n${nivel} s${s}`)
        const n2 = Number((/2n = (\d+)/.exec(inst.enunciado) as RegExpExecArray)[1])
        const tipo = nivel === 1 ? 'mitose' : 'meiose'
        const fase = fasePedida(inst.enunciado)
        const [cromos, cromatides, celulas] = esperadoFase(tipo, fase, n2) as [number, number, number]
        const pedido = inst.enunciado.includes('Quantas células') ? celulas : inst.enunciado.includes('cromátides há') ? cromatides : cromos
        expect(inst.resposta, `n${nivel} s${s}: ${inst.enunciado}`).toBe(pedido)
      }
  })
  it('nível 3: células depois de k mitoses, tipos de gametas, espermatozoides/óvulos e DNA em pg', () => {
    const vistas = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarContagem(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`)
      const e = inst.enunciado
      if (e.includes('mitoses sucessivas')) {
        vistas.add('mitoses')
        expect(inst.resposta).toBe(2 ** Number((/sofre (\d+) mitoses/.exec(e) as RegExpExecArray)[1]))
      } else if (e.includes('tipos diferentes de gametas')) {
        vistas.add('gametas')
        expect(inst.resposta).toBe(2 ** (Number((/2n = (\d+)/.exec(e) as RegExpExecArray)[1]) / 2))
      } else if (e.includes('espermatozoides se formam')) {
        vistas.add('espermatozoides')
        expect(inst.resposta).toBe(4 * num((/a partir de ([\d.]+) espermatócitos/.exec(e) as RegExpExecArray)[1] as string))
      } else if (e.includes('óvulos funcionais')) {
        vistas.add('ovulos')
        expect(inst.resposta).toBe(num((/a partir de ([\d.]+) ovócitos/.exec(e) as RegExpExecArray)[1] as string))
      } else {
        vistas.add('dna')
        const g1 = num((/tem ([\d,]+) pg de DNA/.exec(e) as RegExpExecArray)[1] as string)
        const fator = e.includes('na metáfase da mitose') || e.includes('na metáfase I da meiose') ? 2 : e.includes('em cada gameta') ? 0.5 : 1
        expect(inst.resposta, e).toBeCloseTo(g1 * fator, 9)
      }
    }
    expect(vistas.size).toBe(5)
  })
})

describe('Reconhecer as fases em figuras', () => {
  /** Classifica um desenho só pelo que se vê: número de células, tipo de cromossomo e arranjo. */
  function classificar(d: Desenho, tipo: 'mitose' | 'meiose'): string {
    const celulas = d.celulas.length
    const duplicados = d.celulas[0]!.cromos[0]!.cromatides === 2
    if (tipo === 'mitose') {
      if (celulas === 2) return 'Telófase'
      if (d.disposicao === 'dispersos') return 'Prófase'
      if (d.disposicao === 'equador') return 'Metáfase'
      return 'Anáfase'
    }
    if (celulas === 4) return 'Telófase II'
    if (celulas === 1) return d.disposicao === 'pareados' ? 'Prófase I' : d.disposicao === 'equador-pareados' ? 'Metáfase I' : 'Anáfase I'
    // duas células
    if (d.disposicao === 'nucleo') return 'Telófase I'
    if (d.disposicao === 'dispersos') return 'Prófase II'
    if (d.disposicao === 'equador') return 'Metáfase II'
    return duplicados ? 'Anáfase I' : 'Anáfase II'
  }
  it('as pistas existem para todas as fases e cada fase tem uma figura que o classificador independente reconhece', () => {
    for (const fase of Object.keys(PISTAS.mitose)) expect(classificar(desenhar('mitose', fase), 'mitose'), fase).toBe(fase)
    for (const fase of Object.keys(PISTAS.meiose)) expect(classificar(desenhar('meiose', fase), 'meiose'), fase).toBe(fase)
  })
  it('as opções confundíveis (metáfase I/II e anáfase I/II) têm figuras diferentes', () => {
    for (const [a, b] of Object.entries(PAR_CONFUSAO)) {
      const da = desenhar('meiose', a)
      const db = desenhar('meiose', b)
      expect(da.celulas.length === db.celulas.length && da.disposicao === db.disposicao, `${a} × ${b}`).toBe(false)
    }
  })
  it('níveis 1 a 3: a fase certa é a da figura (classificada só pelo desenho) e as erradas são outras fases', () => {
    const vistas = new Set<string>()
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarFases(rngTeste(s, nivel), nivel)
        checarMulti(inst, `n${nivel} s${s}`)
        const d = inst.dados as DadosFase
        expect(classificar(desenhar(d.tipo, d.fase), d.tipo), `n${nivel} s${s}`).toBe(d.fase)
        const certa = textoCerto(inst)
        if (nivel < 3) expect(certa, `n${nivel} s${s}`).toBe(`${d.fase} da ${d.tipo}`)
        else expect(certa, `n${nivel} s${s}`).toBe(`${d.tipo === 'mitose' ? 'Mitose' : 'Meiose'}: ${minus(d.fase)}`)
        vistas.add(`${nivel}:${d.tipo}:${d.fase}`)
        // no nível 2, a fase gêmea (I × II) sempre aparece entre as opções
        const gemea = PAR_CONFUSAO[d.fase]
        if (nivel === 2 && gemea) expect(inst.opcoes.map((o) => o.rotulo), `s${s}`).toContain(`${gemea} da meiose`)
        // descrição da figura nas explicações dos erros
        for (const id of inst.opcoes.map((o) => o.id).filter((x) => x !== inst.certa)) expect(inst.porque[id], `n${nivel} s${s}`).toContain('Na figura')
      }
    expect([...vistas].filter((v) => v.startsWith('1:')).length).toBe(4)
    expect([...vistas].filter((v) => v.startsWith('2:')).length).toBe(6)
    expect([...vistas].filter((v) => v.startsWith('3:')).length).toBe(6)
  })
})

/* ------------------------------------------------------------------ energia e metabolismo */

describe('Energia (estequiometria e curva de luz)', () => {
  it('nível 1: coeficientes das equações balanceadas', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarEnergia(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`)
      const n = Number((/(\d+) mols? de glicose/.exec(inst.enunciado) as RegExpExecArray)[1])
      const e = inst.enunciado
      let coef: number
      if (e.includes('mols de CO₂ são liberados') && e.includes('alcoólica')) coef = 2
      else if (e.includes('mols de etanol')) coef = 2
      else if (e.includes('mols de ATP')) coef = 2
      else if (e.includes('mols de O₂ são consumidos')) coef = 6
      else {
        expect(e).toContain('mols de água')
        coef = 6
      }
      tipos.add(e.replace(/\d+ mols?/g, '# mol'))
      expect(inst.resposta, `s${s}: ${e}`).toBe(coef * n)
    }
    expect(tipos.size).toBe(5)
  })
  it('nível 2: massas pela estequiometria 1 : 6 (180, 44, 32 g/mol)', () => {
    const variantes = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarEnergia(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 3)
      const e = inst.enunciado
      const g = num(/(?:completa de|partir de) ([\d.]+) g/.exec(e)?.[1] ?? '0')
      const gForm = num(/formam ([\d.]+) g de glicose/.exec(e)?.[1] ?? '0')
      if (e.includes('respiração aeróbica completa de')) {
        const gas = e.includes('gramas de CO₂') ? 44 : 32
        variantes.add(`resp-${gas}`)
        expect(inst.resposta, e).toBeCloseTo(6 * (g / 180) * gas, 6)
      } else if (e.includes('quando se formam')) {
        variantes.add('o2-foto')
        expect(inst.resposta, e).toBeCloseTo(6 * (gForm / 180) * 32, 6)
      } else {
        variantes.add('glicose-foto')
        expect(inst.resposta, e).toBeCloseTo((g / 44 / 6) * 180, 6)
      }
    }
    expect(variantes.size).toBe(4)
  })
  it('nível 3: ponto de compensação (P = R) e taxa líquida, pela fórmula P(I) = Pmax·I/(K+I)', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarEnergia(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`)
      const m = /Pmax = (\d+), K = (\d+) e a taxa de respiração é R = (\d+)/.exec(inst.enunciado) as RegExpExecArray
      const [pmax, k, r] = [Number(m[1]), Number(m[2]), Number(m[3])] as [number, number, number]
      const P = (i: number) => (pmax * i) / (k + i)
      if (inst.enunciado.includes('ponto de compensação')) {
        vistos.add('comp')
        expect(P(inst.resposta), `s${s}`).toBeCloseTo(r, 9)
        expect(Number.isInteger(inst.resposta)).toBe(true)
      } else {
        vistos.add('liq')
        const luz = Number((/quando I = (\d+)/.exec(inst.enunciado) as RegExpExecArray)[1])
        expect(inst.resposta, `s${s}`).toBeCloseTo(P(luz) - r, 9)
      }
      const dados = inst.dados as DadosLuz
      expect([dados.pmax, dados.k, dados.r]).toEqual([pmax, k, r])
    }
    expect(vistos.size).toBe(2)
  })
  it('parâmetros da curva: Ic e K inteiros, R < Pmax', () => {
    for (const s of SEMENTES) {
      const p = parametrosLuz(rngTeste(s, 9))
      expect(p.r).toBeLessThan(p.pmax)
      expect(Number.isInteger(p.k)).toBe(true)
      expect((p.pmax * p.ic) / (p.k + p.ic)).toBeCloseTo(p.r, 9)
    }
  })
})

describe('Metabolismo', () => {
  /** Curva da enzima, escrita à parte: parábola crescente até a ótima e decrescente até a desnaturação. */
  const atividade = (t: number, otima: number, desnat: number) => (t <= 0 || t >= desnat ? 0 : t <= otima ? (t / otima) ** 2 : Math.max(0, 1 - ((t - otima) / (desnat - otima)) ** 2))
  it('nível 1: banco bem formado', () => {
    expect(BANCO_METABOLISMO_1.every(itemValido)).toBe(true)
    expect(BANCO_METABOLISMO_3.every(itemValido)).toBe(true)
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarMetabolismo(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      vistos.add(inst.enunciado)
    }
    expect(vistos.size).toBe(BANCO_METABOLISMO_1.length)
  })
  it('nível 2: a temperatura de maior atividade, com diferença clara para as outras', () => {
    const variantes = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarMetabolismo(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const d = inst.dados as DadosEnzima | undefined
      if (!d) {
        variantes.add(inst.enunciado.includes('4 °C') ? 'frio' : 'calor')
        // desnaturação é irreversível; o frio é reversível
        expect(textoCerto(inst)).toMatch(inst.enunciado.includes('4 °C') ? /^Recupera a atividade/ : /^Permanece com atividade muito baixa/)
        continue
      }
      variantes.add('curva')
      const m = /ótima é (\d+) °C, e acima de (\d+) °C/.exec(inst.enunciado) as RegExpExecArray
      expect([d.otima, d.desnaturacao]).toEqual([Number(m[1]), Number(m[2])])
      const ativ = d.temps.map((t) => atividade(t, d.otima, d.desnaturacao))
      const ordenadas = [...ativ].sort((a, b) => b - a)
      expect(ordenadas[0]! - ordenadas[1]!, `s${s}`).toBeGreaterThanOrEqual(0.1)
      expect(textoCerto(inst), `s${s}`).toBe(`${d.temps[ativ.indexOf(ordenadas[0]!)]} °C`)
      expect(new Set(d.temps).size).toBe(4)
    }
    expect(variantes.size).toBe(3)
  })
  it('temperaturasDistintas sempre devolve quatro valores distintos com máximo claro', () => {
    for (const s of SEMENTES)
      for (const [otima, desnat] of [[35, 55], [37, 62], [40, 70], [45, 70], [50, 75], [55, 85]] as const) {
        const ts = temperaturasDistintas(rngTeste(s, otima), otima, desnat)
        expect(new Set(ts).size).toBe(4)
        const a = ts.map((t) => atividade(t, otima, desnat)).sort((x, y) => y - x)
        expect(a[0]! - a[1]!).toBeGreaterThanOrEqual(0.1)
      }
  })
  it('nível 3: o saldo gasoso depende de a luz estar abaixo, igual ou acima do ponto de compensação', () => {
    const casos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarMetabolismo(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      if (!inst.enunciado.includes('ponto de compensação luminoso de uma planta é')) continue
      const ic = num((/é ([\d.,]+) µmol/.exec(inst.enunciado) as RegExpExecArray)[1] as string)
      const escuro = inst.enunciado.includes('no escuro total')
      const luz = escuro ? 0 : num((/sob luz de ([\d.,]+)/.exec(inst.enunciado) as RegExpExecArray)[1] as string)
      const esperado = luz > ic ? 'Libera O₂' : luz < ic ? 'Absorve O₂' : 'Não há troca líquida'
      expect(textoCerto(inst).startsWith(esperado), `s${s}: luz ${luz}, Ic ${ic}`).toBe(true)
      casos.add(luz > ic ? 'acima' : luz < ic ? (escuro ? 'escuro' : 'abaixo') : 'igual')
    }
    expect(casos.size).toBe(4)
  })
})
