import { BANCO_ENSO, BANCO_MASSAS, BANCO_URBANO, EFEITOS_ENSO, MASSAS } from '@/conteudo/geografia/fenomenos'
import { corrigirNum } from '@/desafios/simples'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { SUPERFICIES, camadasDeInversao, faseEnso, intensidadeEnso } from './calculo'
import { gerarEnso, gerarInversao, gerarMassa, gerarOrografica, gerarUrbano, perfilDe } from './geradores'

const num = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'))

describe('Chuva orográfica (desafio)', () => {
  /** Integração numérica a cada 10 m. */
  const simular = (t0: number, altura: number, zc: number) => {
    let t = t0
    for (let z = 0; z < altura - 1e-9; z += 0.01) t -= (z < zc - 1e-9 ? 10 : 6) * 0.01
    const topo = t
    t += 10 * altura
    return { topo, sotavento: t }
  }
  const lerParametros = (enunciado: string) => {
    const t0 = num(/a (\d+) °C/.exec(enunciado)?.[1] ?? /temperatura de (\d+) °C/.exec(enunciado)?.[1] ?? '0')
    const altura = num(/serra de ([\d,]+) km/.exec(enunciado)![1] as string)
    const zcMatch = /começa a ([\d,]+) km/.exec(enunciado)
    const dif = /ponto de orvalho de (\d+) °C/.exec(enunciado)
    const zc = zcMatch ? num(zcMatch[1] as string) : (0.125 * (t0 - num(dif![1] as string)))
    return { t0, altura, zc }
  }
  it('nível 1: topo = T0 − 10·zc − 6·(H − zc)', () => {
    for (const s of SEMENTES) {
      const inst = gerarOrografica(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`, 2)
      const { t0, altura, zc } = lerParametros(inst.enunciado)
      expect(inst.resposta, `s${s}`).toBeCloseTo(simular(t0, altura, zc).topo, 6)
    }
  })
  it('nível 2: sotavento = integração numérica; parar no topo é erro típico', () => {
    for (const s of SEMENTES) {
      const inst = gerarOrografica(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 2)
      const { t0, altura, zc } = lerParametros(inst.enunciado)
      const r = simular(t0, altura, zc)
      expect(inst.resposta, `s${s}`).toBeCloseTo(r.sotavento, 6)
      expect(corrigirNum(inst, String(r.topo).replace('.', ',')).correto).toBe(false)
    }
  })
  it('nível 3: sotavento (com ou sem ponto de orvalho) e ganho de temperatura', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarOrografica(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`, 2)
      const m = inst.dados!.montanha
      const r = simular(m.t0, m.altura, m.zc)
      if (inst.dados!.tipo === 'aquecimento') expect(inst.resposta).toBeCloseTo(r.sotavento - m.t0, 6)
      else expect(inst.resposta).toBeCloseTo(r.sotavento, 6)
      tipos.add(inst.dados!.tipo + (inst.enunciado.includes('ponto de orvalho') ? '+orvalho' : ''))
    }
    expect(tipos.has('sotavento+orvalho')).toBe(true)
    expect(tipos.has('aquecimento')).toBe(true)
    expect(tipos.has('sotavento')).toBe(true)
  })
  it('o ponto de orvalho do enunciado dá a altura de 125 m por °C', () => {
    for (const s of SEMENTES) {
      const inst = gerarOrografica(rngTeste(s, 3), 3)
      if (!inst.enunciado.includes('ponto de orvalho')) continue
      const t = num(/temperatura de (\d+) °C/.exec(inst.enunciado)![1] as string)
      const td = num(/orvalho de (\d+) °C/.exec(inst.enunciado)![1] as string)
      expect(inst.dados!.montanha.zc).toBeCloseTo((125 * (t - td)) / 1000, 9)
    }
  })
})

describe('Massas de ar (desafio)', () => {
  it('as cinco massas têm origem, regiões e efeitos distintos, e as siglas batem com as características', () => {
    expect(MASSAS).toHaveLength(5)
    expect(new Set(MASSAS.map((m) => m.origem)).size).toBe(5)
    const todosEfeitos = MASSAS.flatMap((m) => m.efeitos)
    expect(new Set(todosEfeitos).size).toBe(todosEfeitos.length)
    for (const m of MASSAS) {
      // regra da sigla, escrita à parte: E e T quentes; P fria; c = continental; a = atlântica (úmida)
      expect(m.temperatura, m.id).toBe(m.id[1] === 'P' ? 'fria' : 'quente')
      if (m.id[2] === 'a') expect(m.umidade, m.id).toBe('úmida')
      expect(m.efeitos.length).toBeGreaterThanOrEqual(1)
    }
    expect(MASSAS.find((m) => m.id === 'mTc')!.umidade).toBe('seca')
    expect(MASSAS.filter((m) => m.umidade === 'seca')).toHaveLength(1)
  })
  it.each(NIVEIS)('nível %i: estrutura válida e a alternativa certa combina com o enunciado', (nivel) => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarMassa(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      if (nivel === 1) {
        const m = MASSAS.find((x) => inst.enunciado.includes(x.origem))!
        expect(textoCerto(inst)).toContain(`(${m.id})`)
        vistos.add(m.id)
      }
      if (nivel === 2) {
        const m = MASSAS.find((x) => inst.enunciado.includes(`(${x.id})`))!
        expect(m.efeitos).toContain(textoCerto(inst))
        for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(m.efeitos, o.rotulo).not.toContain(o.rotulo)
        vistos.add(m.id)
      }
    }
    if (nivel < 3) expect(vistos.size).toBe(5)
  })
  it('o banco de perguntas está bem formado', () => {
    for (const b of [BANCO_MASSAS, BANCO_ENSO, BANCO_URBANO]) for (const it of b) expect(itemValido(it), it.pergunta).toBe(true)
  })
})

describe('El Niño e La Niña (desafio)', () => {
  it('nível 1: a fase vem do sinal e do limiar de 0,5 °C', () => {
    const fases = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarEnso(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const a = inst.dados!.anomalia!
      const esperado = a >= 0.5 ? 'El Niño' : a <= -0.5 ? 'La Niña' : 'Condições neutras (nem El Niño, nem La Niña)'
      expect(textoCerto(inst), `a=${a}`).toBe(esperado)
      expect(faseEnso(a)).toBe(a >= 0.5 ? 'el-nino' : a <= -0.5 ? 'la-nina' : 'neutro')
      fases.add(esperado)
    }
    expect(fases.size).toBe(3)
  })
  it('nível 2: a intensidade usa o módulo, e o sinal define a fase', () => {
    for (const s of SEMENTES) {
      const inst = gerarEnso(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const a = inst.dados!.anomalia!
      const m = Math.abs(a)
      const inten = m >= 2 ? 'muito forte' : m >= 1.5 ? 'forte' : m >= 1 ? 'moderado' : 'fraco'
      expect(textoCerto(inst)).toBe(`${a > 0 ? 'El Niño' : 'La Niña'} ${inten}`)
      expect(intensidadeEnso(a)).toBe(inten)
    }
  })
  it('nível 3: efeitos por região e perguntas escritas à mão', () => {
    let regioes = 0
    for (const s of SEMENTES) {
      const inst = gerarEnso(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const reg = inst.enunciado.startsWith('Em um ano de') ? EFEITOS_ENSO.find((r) => inst.enunciado.includes(`região ${r.regiao}`)) : undefined
      if (reg) {
        const nino = inst.enunciado.includes('El Niño')
        expect(textoCerto(inst)).toBe(nino ? reg.elNino : reg.laNina)
        regioes++
      }
    }
    expect(regioes).toBeGreaterThan(20)
  })
})

describe('Ilha de calor e inversão (desafios)', () => {
  it('nível 2: o local certo é o único de maior aquecimento entre as opções', () => {
    for (const s of SEMENTES) {
      const inst = gerarUrbano(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const niveis = inst.opcoes.map((o) => SUPERFICIES.find((x) => x.nome === o.rotulo)!.nivel)
      const idx = inst.opcoes.findIndex((o) => o.id === inst.certa)
      expect(niveis[idx]).toBe(Math.max(...niveis))
      expect(niveis.filter((n) => n === Math.max(...niveis))).toHaveLength(1)
    }
  })
  it('níveis 1 e 3 vêm do banco', () => {
    for (const nivel of [1, 3] as const) for (const s of SEMENTES.slice(0, 40)) checarMulti(gerarUrbano(rngTeste(s, nivel), nivel), `n${nivel} s${s}`)
  })
  it.each(NIVEIS)('inversão, nível %i: a resposta bate com a leitura da tabela', (nivel) => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarInversao(rngTeste(s, nivel), nivel)
      checarNum(inst, `n${nivel} s${s}`, 2)
      const perfil = perfilDe(inst.dados!.params)
      const camadas = camadasDeInversao(perfil)
      expect(camadas, `s${s}`).toHaveLength(1)
      const c = camadas[0]!
      const t = (z: number) => perfil.find((p) => p.z === z)!.t
      if (nivel === 1) expect(inst.resposta).toBe(c.de)
      if (nivel === 2) expect(inst.resposta).toBe(c.ate - c.de)
      if (nivel === 3) expect(inst.resposta).toBeCloseTo(t(c.ate) - t(c.de), 6)
      tipos.add(inst.dados!.tipo)
    }
    expect(tipos.size).toBe(1)
  })
})
