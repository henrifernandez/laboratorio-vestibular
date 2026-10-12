import {
  AMBIENTES_PIRAMIDE,
  PARAMETROS_LV,
  TEIAS,
  alimentos,
  balancoCarbono,
  cadeiaValida,
  cadeias,
  camada,
  concentracaoNoNivel,
  derivadasLV,
  efeitoCascata,
  ehProdutor,
  ehTopo,
  energiaNoNivel,
  energiaPorNivel,
  equilibrioLV,
  exponencial,
  exponencialContinuo,
  fatorDeAcumulo,
  invarianteLV,
  invertida,
  logistico,
  marcaRecaptura,
  niveis,
  passoLogistico,
  pontoEm,
  predadores,
  remover,
  saldoPopulacional,
  taxaLogistica,
  taxaMaximaLogistica,
  trajetoriaLV,
  type Teia,
} from './calculo'

/** Todos os caminhos de um produtor até a espécie, contados de forma independente (busca em profundidade a partir dos produtores). */
function comprimentosDeCaminho(t: Teia, alvo: string): number[] {
  const achados = new Set<number>()
  const andar = (id: string, tamanho: number) => {
    if (id === alvo) achados.add(tamanho)
    for (const [q, a] of t.come) if (a === id) andar(q, tamanho + 1)
  }
  for (const e of t.especies) if (e.produtor) andar(e.id, 1)
  return [...achados].sort((a, b) => a - b)
}

describe('Teias alimentares: dados', () => {
  it.each(TEIAS.map((t) => [t.id, t] as const))('%s: todas as setas ligam espécies que existem e não há ciclos', (_id, t) => {
    const ids = new Set(t.especies.map((e) => e.id))
    expect(ids.size).toBe(t.especies.length)
    for (const [q, a] of t.come) {
      expect(ids.has(q), q).toBe(true)
      expect(ids.has(a), a).toBe(true)
      expect(q).not.toBe(a)
    }
    // ordenação topológica (algoritmo de Kahn): sem ciclos, todas as espécies saem da fila
    const grau = new Map(t.especies.map((e) => [e.id, alimentos(t, e.id).length]))
    const fila = [...grau].filter(([, g]) => g === 0).map(([id]) => id)
    let vistos = 0
    while (fila.length) {
      const id = fila.pop() as string
      vistos++
      for (const q of predadores(t, id)) {
        grau.set(q, (grau.get(q) as number) - 1)
        if (grau.get(q) === 0) fila.push(q)
      }
    }
    expect(vistos).toBe(t.especies.length)
  })
  it.each(TEIAS.map((t) => [t.id, t] as const))('%s: produtor não come ninguém; todo consumidor come alguém; todos descendem de um produtor', (_id, t) => {
    for (const e of t.especies) {
      if (e.produtor) expect(alimentos(t, e.id), e.nome).toHaveLength(0)
      else {
        expect(alimentos(t, e.id).length, e.nome).toBeGreaterThan(0)
        expect(comprimentosDeCaminho(t, e.id).length, e.nome).toBeGreaterThan(0)
      }
    }
  })
  it.each(TEIAS.map((t) => [t.id, t] as const))('%s: no máximo 4 espécies por camada e 3 a 6 camadas (cabe no desenho do celular)', (_id, t) => {
    const porCamada = new Map<number, number>()
    for (const e of t.especies) porCamada.set(camada(t, e.id), (porCamada.get(camada(t, e.id)) ?? 0) + 1)
    expect(Math.max(...porCamada.values())).toBeLessThanOrEqual(4)
    expect(porCamada.size).toBeGreaterThanOrEqual(3)
    expect(porCamada.size).toBeLessThanOrEqual(6)
  })
  it('cada teia tem pelo menos um onívoro, um produtor e predadores de topo', () => {
    for (const t of TEIAS) {
      expect(t.especies.some((e) => niveis(t, e.id).length > 1)).toBe(true)
      expect(t.especies.filter((e) => e.produtor).length).toBeGreaterThanOrEqual(1)
      expect(t.especies.filter((e) => ehTopo(t, e.id)).length).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('Níveis tróficos e cadeias', () => {
  it('os níveis calculados por programação dinâmica batem com o comprimento de todos os caminhos', () => {
    for (const t of TEIAS) for (const e of t.especies) expect(niveis(t, e.id), `${t.id}/${e.id}`).toEqual(comprimentosDeCaminho(t, e.id))
  })
  it('produtores ocupam só o nível 1', () => {
    for (const t of TEIAS) for (const e of t.especies) if (e.produtor) expect(niveis(t, e.id)).toEqual([1])
  })
  it('cadeias: todas válidas, sem repetição, começam em produtor e terminam em espécie de topo', () => {
    for (const t of TEIAS) {
      const cs = cadeias(t)
      expect(new Set(cs.map((x) => x.join('>'))).size).toBe(cs.length)
      for (const ch of cs) {
        expect(cadeiaValida(t, ch)).toBe(true)
        expect(ehProdutor(t, ch[0] as string)).toBe(true)
        expect(ehTopo(t, ch[ch.length - 1] as string)).toBe(true)
      }
    }
  })
  it('o número de cadeias bate com a contagem por caminhos (soma, sobre os topos, dos caminhos que chegam neles)', () => {
    for (const t of TEIAS) {
      // número de caminhos até cada espécie, por recorrência
      const memo = new Map<string, number>()
      const n = (id: string): number => {
        if (memo.has(id)) return memo.get(id) as number
        const v = ehProdutor(t, id) ? 1 : alimentos(t, id).reduce((s, a) => s + n(a), 0)
        memo.set(id, v)
        return v
      }
      const total = t.especies.filter((e) => ehTopo(t, e.id)).reduce((s, e) => s + n(e.id), 0)
      expect(cadeias(t).length, t.id).toBe(total)
    }
  })
  it('cadeiaValida rejeita sentido invertido, salto de nível e sequência sem produtor', () => {
    const t = TEIAS[0] as Teia // lago
    expect(cadeiaValida(t, ['fito', 'zoo', 'lambari', 'tucunare', 'jacare'])).toBe(true)
    expect(cadeiaValida(t, ['jacare', 'tucunare', 'lambari', 'zoo', 'fito'])).toBe(false)
    expect(cadeiaValida(t, ['fito', 'lambari', 'tucunare'])).toBe(true) // lambari come fitoplâncton diretamente
    expect(cadeiaValida(t, ['fito', 'tucunare'])).toBe(false)
    expect(cadeiaValida(t, ['zoo', 'lambari'])).toBe(false)
    expect(cadeiaValida(t, ['fito'])).toBe(false)
  })
  it('exemplos conhecidos: lambari é onívoro (níveis 2 e 3); jacaré ocupa 3, 4 e 5', () => {
    const t = TEIAS[0] as Teia
    expect(niveis(t, 'lambari')).toEqual([2, 3])
    expect(niveis(t, 'jacare')).toEqual([3, 4, 5])
  })
})

describe('Retirar espécies', () => {
  const lago = TEIAS[0] as Teia
  it('sem o aguapé, o caramujo ainda come fitoplâncton: perde uma fonte, mas não fica sem alimento', () => {
    const r = remover(lago, ['aguape'])
    expect(r.semAlimento).toEqual([])
    expect(r.perdemFonte).toEqual(['caramujo'])
  })
  it('sem o lambari, tucunaré, piranha e garça ficam sem alimento na hora; a ariranha só depois, em cadeia; o jacaré sobrevive com o caramujo', () => {
    const r = remover(lago, ['lambari'])
    expect([...r.semAlimento].sort()).toEqual(['garca', 'piranha', 'tucunare'])
    expect([...r.semAlimentoEmCadeia].sort()).toEqual(['ariranha', 'garca', 'piranha', 'tucunare'])
    expect(r.perdemFonte).toEqual(['jacare'])
  })
  it('a propagação em cadeia confere com uma segunda implementação (ponto fixo por vivas)', () => {
    for (const t of TEIAS)
      for (const e of t.especies) {
        const r = remover(t, [e.id])
        // reimplementação: repete até não mudar
        const mortas = new Set([e.id])
        for (let volta = 0; volta < 20; volta++)
          for (const x of t.especies) {
            if (mortas.has(x.id)) continue
            const fontes = t.come.filter(([q]) => q === x.id).map(([, a]) => a)
            if (fontes.length > 0 && fontes.every((a) => mortas.has(a))) mortas.add(x.id)
          }
        mortas.delete(e.id)
        expect([...mortas].sort(), `${t.id}/${e.id}`).toEqual([...r.semAlimentoEmCadeia].sort())
        expect(r.semAlimento.every((id) => r.semAlimentoEmCadeia.includes(id))).toBe(true)
      }
  })
  it('perdem predador: exatamente as presas diretas da espécie retirada (que continuam vivas)', () => {
    for (const t of TEIAS)
      for (const e of t.especies) {
        const r = remover(t, [e.id])
        const presas = t.come.filter(([q]) => q === e.id).map(([, a]) => a).filter((a) => !r.semAlimentoEmCadeia.includes(a))
        expect([...r.perdemPredador].sort(), `${t.id}/${e.id}`).toEqual([...new Set(presas)].sort())
      }
  })
  it('ganham alimento: quem divide alguma presa com a espécie retirada', () => {
    const cerrado = TEIAS[1] as Teia
    // ema e veado-campeiro disputam o capim; sem a ema o veado e outros herbívoros ganham alimento
    expect(remover(cerrado, ['ema']).ganhamAlimento).toEqual(expect.arrayContaining(['veado', 'rato', 'gafanhoto']))
  })
})

describe('Efeito em cascata na cadeia linear', () => {
  it('retirar o topo aumenta o elo logo abaixo, diminui o seguinte e assim por diante', () => {
    // cadeia de 4 elos: 0 produtor, 1, 2, 3 topo
    expect(efeitoCascata(4, 3, 2)).toBe(1)
    expect(efeitoCascata(4, 3, 1)).toBe(-1)
    expect(efeitoCascata(4, 3, 0)).toBe(1)
    expect(efeitoCascata(3, 2, 1)).toBe(1)
    expect(efeitoCascata(3, 2, 0)).toBe(-1)
  })
  it('rejeita alvo acima do elo removido', () => {
    expect(() => efeitoCascata(4, 1, 2)).toThrow()
    expect(() => efeitoCascata(4, 2, 2)).toThrow()
  })
})

describe('Fluxo de energia', () => {
  it('regra dos 10 %: cada passagem multiplica por 0,1', () => {
    expect(energiaNoNivel(10_000, 0.1, 0)).toBe(10_000)
    expect(energiaNoNivel(10_000, 0.1, 1)).toBeCloseTo(1000, 9)
    expect(energiaNoNivel(10_000, 0.1, 3)).toBeCloseTo(10, 9)
    expect(energiaPorNivel(20_000, 0.1, 4).map((x) => Math.round(x * 1e6) / 1e6)).toEqual([20_000, 2000, 200, 20])
  })
  it('a energia nunca aumenta de um nível para o seguinte (a pirâmide de energia não se inverte)', () => {
    for (const ef of [0.05, 0.1, 0.2, 0.5, 0.99]) expect(invertida(energiaPorNivel(1000, ef, 6))).toBe(false)
  })
  it('acúmulo: fator = 1/eficiência quando toda a substância fica retida', () => {
    expect(fatorDeAcumulo(0.1)).toBeCloseTo(10, 12)
    // 50 kg de presa com 0,02 mg/kg viram 5 kg de predador (10 %): 1 mg em 5 kg = 0,2 mg/kg
    expect((50 * 0.02) / 5).toBeCloseTo(0.02 * fatorDeAcumulo(0.1), 12)
    expect(concentracaoNoNivel(0.02, 10, 3)).toBeCloseTo(20, 9)
  })
  it('pirâmides: o campo é direita; a árvore tem números invertidos; o mar tem biomassa invertida', () => {
    const [campo, arvore, mar] = AMBIENTES_PIRAMIDE as [(typeof AMBIENTES_PIRAMIDE)[0], (typeof AMBIENTES_PIRAMIDE)[0], (typeof AMBIENTES_PIRAMIDE)[0]]
    expect(invertida(campo.biomassa)).toBe(false)
    expect(invertida(campo.numeros)).toBe(false)
    expect(invertida(arvore.numeros)).toBe(true)
    expect(invertida(arvore.biomassa)).toBe(false)
    expect(invertida(mar.biomassa)).toBe(true)
    expect(invertida(mar.numeros)).toBe(false)
    for (const a of AMBIENTES_PIRAMIDE) {
      expect(a.biomassa).toHaveLength(a.niveis.length)
      expect(a.numeros).toHaveLength(a.niveis.length)
    }
  })
})

describe('Ciclo do carbono', () => {
  it('as emissões se dividem entre atmosfera e sumidouros naturais', () => {
    const b = balancoCarbono(9.5, 1.2, 0)
    expect(b.emissoes).toBeCloseTo(10.7, 12)
    expect(b.naAtmosfera + b.sumidourosNaturais).toBeCloseTo(b.emissoes, 12)
    expect(b.ppmPorAno).toBeGreaterThan(2)
    expect(b.ppmPorAno).toBeLessThan(2.6)
  })
  it('reflorestamento reduz o que fica na atmosfera, e sem emissões não há acúmulo', () => {
    expect(balancoCarbono(9.5, 1.2, 1).naAtmosfera).toBeCloseTo(balancoCarbono(9.5, 1.2, 0).naAtmosfera - 1, 12)
    expect(balancoCarbono(0, 0, 0).ppmPorAno).toBe(0)
  })
})

describe('Populações', () => {
  it('saldo populacional e exponencial', () => {
    expect(saldoPopulacional(120, 80, 10, 25)).toBe(25)
    expect(exponencial(100, 1, 3)).toBe(800)
    expect(exponencial(1000, 0.1, 2)).toBeCloseTo(1210, 9)
    expect(exponencialContinuo(100, Math.log(2), 3)).toBeCloseTo(800, 9)
  })
  it('Lincoln-Petersen: 50 marcados, 60 capturados, 5 marcados entre eles → 600', () => {
    expect(marcaRecaptura(50, 60, 5)).toBe(600)
  })
  it('logístico: começa em N₀, tende a K e passa por K/2 com a maior taxa', () => {
    expect(logistico(10, 0.2, 1000, 0)).toBeCloseTo(10, 9)
    expect(logistico(10, 0.2, 1000, 200)).toBeCloseTo(1000, 3)
    const tMeio = Math.log((1000 - 10) / 10) / 0.2 // instante em que N = K/2
    expect(logistico(10, 0.2, 1000, tMeio)).toBeCloseTo(500, 6)
    expect(taxaLogistica(0.2, 500, 1000)).toBeCloseTo(taxaMaximaLogistica(0.2, 1000), 12)
    for (const n of [50, 200, 400, 600, 900]) expect(taxaLogistica(0.2, n, 1000)).toBeLessThan(taxaMaximaLogistica(0.2, 1000))
    expect(taxaLogistica(0.2, 1000, 1000)).toBeCloseTo(0, 12)
  })
  it('a solução exata concorda com a integração numérica (RK4)', () => {
    for (const [n0, r, k] of [
      [10, 0.2, 1000],
      [50, 0.5, 400],
      [900, 0.1, 500],
    ] as const) {
      let n: number = n0
      const dt = 0.01
      for (let i = 1; i <= 3000; i++) {
        n = passoLogistico(n, r, k, dt)
        if (i % 500 === 0) expect(n).toBeCloseTo(logistico(n0, r, k, i * dt), 5)
      }
    }
  })
})

describe('Presa e predador (Lotka-Volterra)', () => {
  const P = PARAMETROS_LV
  it('o equilíbrio tem derivadas nulas', () => {
    const e = equilibrioLV(P)
    const [dx, dy] = derivadasLV(e.presas, e.predadores, P)
    expect(dx).toBeCloseTo(0, 12)
    expect(dy).toBeCloseTo(0, 12)
    expect(e).toEqual({ presas: 25, predadores: 10 })
  })
  it('a integração mantém o equilíbrio parado', () => {
    const e = equilibrioLV(P)
    const tr = trajetoriaLV(e.presas, e.predadores, P, 40)
    for (const q of tr) {
      expect(q.presas).toBeCloseTo(e.presas, 6)
      expect(q.predadores).toBeCloseTo(e.predadores, 6)
    }
  })
  it('a grandeza conservada permanece constante ao longo de toda a órbita', () => {
    for (const [x0, y0] of [
      [40, 10],
      [15, 5],
      [60, 30],
      [10, 2],
    ] as const) {
      const tr = trajetoriaLV(x0, y0, P, 45)
      const H0 = invarianteLV(x0, y0, P)
      for (const q of tr) expect(Math.abs(invarianteLV(q.presas, q.predadores, P) - H0), `${x0},${y0},t=${q.t}`).toBeLessThan(1e-6)
    }
  })
  it('as populações oscilam defasadas: o pico de predadores vem depois do pico de presas', () => {
    const tr = trajetoriaLV(40, 10, P, 45)
    const picoPresas = tr.slice(0, 400).reduce((m, q) => (q.presas > m.presas ? q : m))
    const picoPred = tr.slice(0, 400).reduce((m, q) => (q.predadores > m.predadores ? q : m))
    expect(picoPred.t).toBeGreaterThan(picoPresas.t)
  })
  it('o período para oscilações pequenas é cerca de 2π/√(αγ)', () => {
    const e = equilibrioLV(P)
    const tr = trajetoriaLV(e.presas * 1.02, e.predadores, P, 40)
    // cruzamentos de baixo para cima do nível de equilíbrio das presas
    const subidas: number[] = []
    for (let i = 1; i < tr.length; i++) if ((tr[i - 1] as { presas: number }).presas < e.presas && (tr[i] as { presas: number }).presas >= e.presas) subidas.push((tr[i] as { t: number }).t)
    expect(subidas.length).toBeGreaterThanOrEqual(3)
    const periodo = (subidas[subidas.length - 1] as number) - (subidas[subidas.length - 2] as number)
    expect(periodo).toBeCloseTo((2 * Math.PI) / Math.sqrt(P.alfa * P.gama), 1)
  })
  it('as populações ficam positivas e limitadas em toda a faixa dos controles do laboratório', () => {
    for (const alfa of [0.5, 1, 1.5])
      for (const gama of [0.2, 0.5, 1])
        for (const [x0, y0] of [
          [10, 2],
          [60, 30],
          [10, 30],
          [60, 2],
        ] as const) {
          const tr = trajetoriaLV(x0, y0, { ...P, alfa, gama }, 45)
          for (const q of tr) {
            expect(q.presas).toBeGreaterThan(0)
            expect(q.predadores).toBeGreaterThan(0)
            expect(q.presas).toBeLessThan(2000)
            expect(q.predadores).toBeLessThan(2000)
          }
        }
  })
  it('pontoEm interpola entre as amostras e devolve o primeiro ponto em t = 0', () => {
    const tr = trajetoriaLV(40, 10, P, 10)
    expect(pontoEm(tr, 0)).toMatchObject({ presas: 40, predadores: 10 })
    const a = tr[10] as { t: number; presas: number }
    const b = tr[11] as { t: number; presas: number }
    expect(pontoEm(tr, (a.t + b.t) / 2).presas).toBeCloseTo((a.presas + b.presas) / 2, 9)
    expect(pontoEm(tr, 10).presas).toBeCloseTo((tr[tr.length - 1] as { presas: number }).presas, 9)
  })
})
