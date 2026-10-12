import {
  ESTRUTURAS,
  FASES_MEIOSE,
  FASES_MITOSE,
  MASSA_MOLAR,
  OSMOLARIDADE_CELULA,
  SOLUTOS,
  TRANSPORTES,
  atividadeEnzima,
  balancoDiario,
  celulasAposMitoses,
  combinacoesDeGametas,
  contagem,
  efeitoCelulaVegetal,
  efeitoHemacia,
  fermentacao,
  fotossintese,
  fotossinteseBruta,
  fotossinteseLiquida,
  luzDoDia,
  osmolaridade,
  paresDeHomologos,
  pontoDeCompensacao,
  presentesEm,
  pressaoOsmotica,
  respiracaoAerobica,
  sentidoDaAgua,
  tonicidade,
  volumeFinalDiluicao,
  volumeNoTempo,
  volumeRelativoEquilibrio,
} from './calculo'

describe('Estruturas celulares (conferência com fatos conhecidos)', () => {
  const ids = (lista: { id: string }[]) => lista.map((e) => e.id).sort()
  it('só mitocôndria e cloroplasto têm DNA próprio, e ambos têm duas membranas', () => {
    expect(ids(ESTRUTURAS.filter((e) => e.dnaProprio))).toEqual(['cloroplasto', 'mitocondria'])
    expect(ids(ESTRUTURAS.filter((e) => e.membranas === 2))).toEqual(['cloroplasto', 'mitocondria', 'nucleo'])
  })
  it('bactérias: ribossomo, parede celular e membrana plasmática (e nenhuma organela membranosa)', () => {
    expect(ids(presentesEm('bacteria'))).toEqual(['membrana', 'parede', 'ribossomo'])
    for (const e of presentesEm('bacteria')) expect(e.membranas).toBeLessThanOrEqual(1)
  })
  it('presente na célula vegetal e ausente na animal: cloroplasto, vacúolo central e parede celular', () => {
    const soVegetal = ESTRUTURAS.filter((e) => e.presente.vegetal && !e.presente.animal)
    expect(ids(soVegetal)).toEqual(['cloroplasto', 'parede', 'vacuolo'])
  })
  it('presente na célula animal e ausente na vegetal: centríolo', () => {
    expect(ids(ESTRUTURAS.filter((e) => e.presente.animal && !e.presente.vegetal))).toEqual(['centriolo'])
  })
  it('ribossomo e membrana plasmática estão em todos os tipos de célula; ribossomo não tem membrana', () => {
    for (const id of ['ribossomo', 'membrana']) expect(Object.values(ESTRUTURAS.find((e) => e.id === id)!.presente).every(Boolean)).toBe(true)
    expect(ESTRUTURAS.find((e) => e.id === 'ribossomo')!.membranas).toBe(0)
  })
  it('as características do transporte (passivo, proteína, ATP) distinguem os três tipos', () => {
    const chaves = TRANSPORTES.map((t) => `${t.passivo}|${t.proteina}|${t.atp}`)
    expect(new Set(chaves).size).toBe(TRANSPORTES.length)
    for (const t of TRANSPORTES) expect(t.atp ? !t.passivo : true).toBe(true) // quem gasta ATP é contra o gradiente
  })
})

describe('Osmose', () => {
  it('osmolaridade: NaCl 0,15 mol/L → 0,30 osmol/L (igual à da célula); CaCl₂ conta 3 partículas', () => {
    expect(osmolaridade(0.15, 2)).toBeCloseTo(OSMOLARIDADE_CELULA, 12)
    expect(osmolaridade(0.1, 3)).toBeCloseTo(0.3, 12)
    expect(SOLUTOS.find((s) => s.id === 'cacl2')!.i).toBe(3)
    expect(SOLUTOS.find((s) => s.id === 'glicose')!.i).toBe(1)
  })
  it('tonicidade e sentido da água: a água vai do meio de menor para o de maior osmolaridade', () => {
    expect(tonicidade(0.1, 0.3)).toBe('hipotonico')
    expect(tonicidade(0.3, 0.3)).toBe('isotonico')
    expect(tonicidade(0.6, 0.3)).toBe('hipertonico')
    expect(sentidoDaAgua(0.1, 0.3)).toBe('A→B')
    expect(sentidoDaAgua(0.6, 0.3)).toBe('B→A')
    expect(sentidoDaAgua(0.3, 0.3)).toBe('nenhum')
  })
  it('efeitos: hemácia (lise, normal, crenação) e célula vegetal (túrgida, flácida, plasmólise)', () => {
    expect(efeitoHemacia('hipotonico')).toBe('lise')
    expect(efeitoHemacia('isotonico')).toBe('normal')
    expect(efeitoHemacia('hipertonico')).toBe('crenacao')
    expect(efeitoCelulaVegetal('hipotonico')).toBe('turgida')
    expect(efeitoCelulaVegetal('isotonico')).toBe('flacida')
    expect(efeitoCelulaVegetal('hipertonico')).toBe('plasmolise')
  })
  it('pressão osmótica: 0,15 mol/L de NaCl a 37 °C ≈ 7,6 atm', () => {
    expect(pressaoOsmotica(0.15, 2, 37)).toBeCloseTo(7.626, 3)
    expect(pressaoOsmotica(0.1, 1, 27)).toBeCloseTo(2.46, 3)
    // dobra com a concentração
    expect(pressaoOsmotica(0.3, 1, 27)).toBeCloseTo(2 * pressaoOsmotica(0.15, 1, 27), 12)
  })
  it('volume de equilíbrio e aproximação exponencial', () => {
    expect(volumeRelativoEquilibrio(0.3, 0.15)).toBe(2)
    expect(volumeRelativoEquilibrio(0.3, 0.6)).toBe(0.5)
    expect(volumeNoTempo(1, 2, 0.5, 0)).toBe(1)
    expect(volumeNoTempo(1, 2, 0.5, 100)).toBeCloseTo(2, 12)
    expect(volumeNoTempo(1, 0.5, 1, 1)).toBeLessThan(1)
  })
  it('diluição: 100 mL de 0,9 mol/L levados a 0,15 mol/L dão 600 mL (adicionam-se 500 mL)', () => {
    expect(volumeFinalDiluicao(0.9, 100, 0.15)).toBeCloseTo(600, 9)
  })
})

describe('Divisão celular', () => {
  // Simulação independente: cada cromossomo é um objeto com a identidade do par homólogo e o número de cromátides.
  interface Cromo {
    par: number
    cromatides: number
  }
  type Celula = Cromo[]
  const inicial = (n2: number): Celula => Array.from({ length: n2 }, (_, i) => ({ par: Math.floor(i / 2), cromatides: 1 }))
  const duplica = (c: Celula): Celula => c.map((x) => ({ ...x, cromatides: 2 }))
  const medidas = (cel: Celula) => ({ cromos: cel.length, cromatides: cel.reduce((s, x) => s + x.cromatides, 0) })

  function simula(tipo: 'mitose' | 'meiose', n2: number) {
    const resultado: Record<string, { celulas: number; cromos: number; cromatides: number }> = {}
    const g1 = inicial(n2)
    const g2 = duplica(g1)
    const reg = (fase: string, celulas: Celula[]) => {
      const m = medidas(celulas[0] as Celula)
      resultado[fase] = { celulas: celulas.length, cromos: m.cromos, cromatides: m.cromatides }
    }
    reg('G1', [g1])
    reg('S/G2', [g2])
    if (tipo === 'mitose') {
      reg('Prófase', [g2])
      reg('Metáfase', [g2])
      const separados: Celula = g2.flatMap((x) => [{ ...x, cromatides: 1 }, { ...x, cromatides: 1 }])
      reg('Anáfase', [separados])
      const filha1: Celula = g2.map((x) => ({ ...x, cromatides: 1 }))
      reg('Telófase', [filha1, filha1.map((x) => ({ ...x }))])
    } else {
      reg('Prófase I', [g2])
      reg('Metáfase I', [g2])
      reg('Anáfase I', [g2]) // os homólogos se afastam, mas a célula ainda tem todos os cromossomos
      // fim da meiose I: cada filha recebe um cromossomo de cada par (os dois ainda duplicados)
      const filhaI: Celula = [...new Set(g2.map((x) => x.par))].map((par) => g2.find((x) => x.par === par) as Cromo)
      reg('Telófase I', [filhaI, filhaI.map((x) => ({ ...x }))])
      reg('Prófase II', [filhaI, filhaI.map((x) => ({ ...x }))])
      reg('Metáfase II', [filhaI, filhaI.map((x) => ({ ...x }))])
      const separadosII: Celula = filhaI.flatMap((x) => [{ ...x, cromatides: 1 }, { ...x, cromatides: 1 }])
      reg('Anáfase II', [separadosII, separadosII.map((x) => ({ ...x }))])
      const gameta: Celula = filhaI.map((x) => ({ ...x, cromatides: 1 }))
      reg('Telófase II', [gameta, gameta, gameta, gameta])
    }
    return resultado
  }

  it('mitose: as contagens por fase batem com a simulação cromossomo a cromossomo (2n = 2, 4, 6, 8, 46)', () => {
    for (const n2 of [2, 4, 6, 8, 46]) {
      const sim = simula('mitose', n2)
      for (const fase of FASES_MITOSE) {
        const c = contagem('mitose', fase, n2)
        expect(c.celulas, `${n2} ${fase}`).toBe(sim[fase]!.celulas)
        expect(c.cromossomosPorCelula, `${n2} ${fase}`).toBe(sim[fase]!.cromos)
        expect(c.cromatidesPorCelula, `${n2} ${fase}`).toBe(sim[fase]!.cromatides)
      }
    }
  })
  it('meiose: as contagens por fase batem com a simulação (2n = 2, 4, 6, 8, 46)', () => {
    for (const n2 of [2, 4, 6, 8, 46]) {
      const sim = simula('meiose', n2)
      for (const fase of FASES_MEIOSE) {
        const c = contagem('meiose', fase, n2)
        expect(c.celulas, `${n2} ${fase}`).toBe(sim[fase]!.celulas)
        expect(c.cromossomosPorCelula, `${n2} ${fase}`).toBe(sim[fase]!.cromos)
        expect(c.cromatidesPorCelula, `${n2} ${fase}`).toBe(sim[fase]!.cromatides)
      }
    }
  })
  it('o DNA por célula (em C) é proporcional ao número de cromátides: 1C = n cromátides', () => {
    for (const n2 of [4, 6, 46])
      for (const [tipo, fases] of [['mitose', FASES_MITOSE], ['meiose', FASES_MEIOSE]] as const)
        for (const fase of fases) {
          const c = contagem(tipo, fase, n2)
          expect(c.dnaPorCelula, `${tipo} ${fase}`).toBeCloseTo(c.cromatidesPorCelula / (n2 / 2), 12)
        }
  })
  it('o DNA total do organismo se conserva ao dividir (mitose) e cai à metade em cada gameta (meiose)', () => {
    const final = contagem('mitose', 'Telófase', 6)
    expect(final.celulas * final.dnaPorCelula).toBe(contagem('mitose', 'Metáfase', 6).dnaPorCelula)
    const gametas = contagem('meiose', 'Telófase II', 6)
    expect(gametas.celulas).toBe(4)
    expect(gametas.dnaPorCelula).toBe(1)
    expect(gametas.cromossomosPorCelula).toBe(3)
  })
  it('exemplos do livro: célula humana (2n = 46) na metáfase tem 92 cromátides; na anáfase, 92 cromossomos; gameta, 23', () => {
    expect(contagem('mitose', 'Metáfase', 46).cromatidesPorCelula).toBe(92)
    expect(contagem('mitose', 'Anáfase', 46).cromossomosPorCelula).toBe(92)
    expect(contagem('meiose', 'Telófase II', 46).cromossomosPorCelula).toBe(23)
    expect(contagem('meiose', 'Metáfase I', 46).cromossomosPorCelula).toBe(46)
    expect(contagem('meiose', 'Metáfase II', 46).cromossomosPorCelula).toBe(23)
    expect(contagem('meiose', 'Metáfase II', 46).cromatidesPorCelula).toBe(46)
  })
  it('fase desconhecida gera erro', () => {
    expect(() => contagem('mitose', 'Prófase I', 4)).toThrow()
    expect(() => contagem('meiose', 'Anáfase', 4)).toThrow()
  })
  it('células depois de k mitoses e combinações de gametas', () => {
    expect(celulasAposMitoses(0)).toBe(1)
    expect(celulasAposMitoses(5)).toBe(32)
    expect(combinacoesDeGametas(6)).toBe(8)
    expect(combinacoesDeGametas(46)).toBe(8_388_608)
    expect(paresDeHomologos(46)).toBe(23)
  })
})

describe('Metabolismo energético', () => {
  it('as equações conservam a massa (respiração e fotossíntese), com as massas molares usadas nos exercícios', () => {
    const { glicose, CO2, O2, H2O } = MASSA_MOLAR
    expect(glicose + 6 * O2).toBe(6 * CO2 + 6 * H2O)
    const r = respiracaoAerobica(1)
    expect(r).toEqual({ o2: 6, co2: 6, h2o: 6 })
    expect(fotossintese(1)).toEqual({ co2: 6, h2o: 6, o2: 6 })
    expect(fotossintese(3).o2).toBe(18)
    // 264 g de CO₂ (6 mol) formam 180 g de glicose
    expect((264 / CO2 / 6) * glicose).toBe(180)
  })
  it('fermentação: 2 ATP por glicose; alcoólica libera 2 CO₂ e 2 etanol; lática forma 2 lactato e não libera CO₂', () => {
    expect(fermentacao('alcoolica', 3)).toEqual({ atp: 6, co2: 6, etanol: 6, lactato: 0 })
    expect(fermentacao('latica', 2)).toEqual({ atp: 4, co2: 0, etanol: 0, lactato: 4 })
  })
  it('ponto de compensação: líquida = 0 e fotossíntese = respiração', () => {
    for (const [pmax, k, r] of [
      [24, 60, 6],
      [20, 100, 5],
      [30, 40, 10],
    ] as const) {
      const ic = pontoDeCompensacao(pmax, k, r)
      expect(fotossinteseBruta(pmax, k, ic)).toBeCloseTo(r, 12)
      expect(fotossinteseLiquida(pmax, k, r, ic)).toBeCloseTo(0, 12)
      expect(fotossinteseLiquida(pmax, k, r, ic * 0.5)).toBeLessThan(0)
      expect(fotossinteseLiquida(pmax, k, r, ic * 2)).toBeGreaterThan(0)
    }
    expect(pontoDeCompensacao(24, 60, 6)).toBe(20)
  })
  it('a fotossíntese cresce com a luz e satura em Pmax', () => {
    let anterior = -1
    for (const luz of [0, 10, 50, 100, 500, 5000]) {
      const p = fotossinteseBruta(20, 100, luz)
      expect(p).toBeGreaterThan(anterior)
      expect(p).toBeLessThan(20)
      anterior = p
    }
    expect(fotossinteseBruta(20, 100, 1e9)).toBeCloseTo(20, 4)
    expect(fotossinteseBruta(20, 100, 100)).toBe(10) // metade de Pmax quando I = K
  })
  it('luz do dia: zero à noite, máxima ao meio-dia', () => {
    expect(luzDoDia(0, 100)).toBe(0)
    expect(luzDoDia(5.9, 100)).toBe(0)
    expect(luzDoDia(12, 100)).toBeCloseTo(100, 12)
    expect(luzDoDia(18.5, 100)).toBe(0)
    expect(luzDoDia(9, 100)).toBeCloseTo(100 * Math.sin(Math.PI / 4), 12)
  })
  it('balanço diário: sem luz é −24 R; cresce com a luz máxima; pode mudar de sinal', () => {
    expect(balancoDiario(24, 60, 6, 0)).toBeCloseTo(-144, 6)
    let anterior = -Infinity
    for (const imax of [0, 20, 50, 100, 300, 1000]) {
      const b = balancoDiario(24, 60, 6, imax)
      expect(b).toBeGreaterThan(anterior)
      anterior = b
    }
    expect(balancoDiario(24, 60, 6, 1000)).toBeGreaterThan(0)
  })
  it('enzima: máximo de 1 na temperatura ótima, 0 acima da desnaturação, e queda depois do ótimo', () => {
    expect(atividadeEnzima(37, 37, 60)).toBe(1)
    expect(atividadeEnzima(60, 37, 60)).toBe(0)
    expect(atividadeEnzima(70, 37, 60)).toBe(0)
    expect(atividadeEnzima(0, 37, 60)).toBe(0)
    for (let t = 5; t < 37; t += 4) expect(atividadeEnzima(t + 4, 37, 60)).toBeGreaterThan(atividadeEnzima(t, 37, 60))
    expect(atividadeEnzima(50, 37, 60)).toBeLessThan(atividadeEnzima(40, 37, 60))
  })
})
