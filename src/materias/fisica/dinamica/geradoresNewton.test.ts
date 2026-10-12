import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { LEIS_N1, LEIS_N2, PARES, TEXTO_LEI, gerarAcao, gerarLeis } from './geradoresNewton'

describe('Qual lei de Newton?', () => {
  it('cada pergunta tem 4 alternativas explicadas, e a certa é a lei do item', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarLeis(rngTeste(s, n), n)
        checarMulti(inst, `nível ${n}, semente ${s}`)
        const d = inst.dados!
        if (d.tipo === 'lei') {
          // o mapa letra → lei bate com os rótulos, e a certa não é a “força do movimento”
          for (const o of inst.opcoes) expect(o.rotulo).toBe(TEXTO_LEI[d.leiDe[o.id] as 0 | 1 | 2 | 3])
          expect(d.leiDe[inst.certa]).not.toBe(0)
          const item = [...LEIS_N1, ...LEIS_N2].find((i) => inst.enunciado.startsWith(i.situacao))!
          expect(textoCerto(inst)).toBe(TEXTO_LEI[item.lei])
        } else {
          expect(n).toBe(3)
          expect(inst.enunciado).toContain('reação')
        }
      }
  })
  it('os bancos têm as três leis e explicações para as duas leis erradas de cada item', () => {
    for (const banco of [LEIS_N1, LEIS_N2]) {
      expect(new Set(banco.map((i) => i.lei)).size).toBe(3)
      for (const item of banco) for (const l of [1, 2, 3] as const) if (l !== item.lei) expect((item.nao[l] ?? '').length, item.situacao).toBeGreaterThan(30)
    }
  })
  it('no nível 3, a resposta certa é sempre “o alvo age no agente”, e nenhum distrator é do mesmo par', () => {
    for (const item of PARES) {
      expect(itemValido(item), item.pergunta).toBe(true)
      expect(item.certa.texto.toLowerCase()).toMatch(new RegExp(`^(o|a|os|as) ${item.alvo.toLowerCase()}`))
    }
  })
  it('os três níveis usam itens variados', () => {
    for (const n of NIVEIS) expect(new Set(SEMENTES.map((s) => gerarLeis(rngTeste(s, n), n).enunciado)).size).toBeGreaterThanOrEqual(6)
  })
})

describe('Ação e reação (numérico)', () => {
  /** Resolve por conta própria: forças iguais no par; nos blocos, o sistema de equações bloco a bloco. */
  function esperado(d: NonNullable<ReturnType<typeof gerarAcao>['dados']>): number {
    if (d.tipo === 'patinadores') return (d.mA * d.aA) / d.mB
    if (d.tipo === 'colisao') return (d.mCarro * d.aCarro) / d.mCaminhao
    // incógnitas: a, C1, ..., C(n−1). Bloco i: (C_{i−1} ou F) − C_i = m_i·a. Resolve de trás para a frente.
    const a = d.F / d.massas.reduce((s, m) => s + m, 0)
    let c = 0
    const contatos: number[] = []
    for (let i = d.massas.length - 1; i > 0; i--) {
      c += (d.massas[i] as number) * a
      contatos.unshift(c)
    }
    // conferência do primeiro bloco: F − C1 = m1·a
    expect(d.F - (contatos[0] as number)).toBeCloseTo((d.massas[0] as number) * a, 9)
    return contatos[d.encontro] as number
  }
  it('a resposta confere com a solução independente e os erros típicos são válidos', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarAcao(rngTeste(s, n), n)
        expect(inst.resposta, `nível ${n}, semente ${s}`).toBeCloseTo(esperado(inst.dados!), 9)
        checarNum(inst, `nível ${n}, semente ${s}`, 2)
      }
  })
  it('as contas fecham com no máximo uma casa decimal', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const { resposta } = gerarAcao(rngTeste(s, n), n)
        expect(Math.abs(resposta * 10 - Math.round(resposta * 10))).toBeLessThan(1e-9)
      }
  })
  it('nível 1 mistura patinadores e batida; níveis 2 e 3 perguntam nos dois sentidos (X sobre Y e Y sobre X)', () => {
    const tipos1 = new Set(SEMENTES.map((s) => gerarAcao(rngTeste(s, 1), 1).dados!.tipo))
    expect([...tipos1].sort()).toEqual(['colisao', 'patinadores'])
    for (const n of [2, 3] as const) {
      const sentidos = new Set(
        SEMENTES.map((s) => {
          const d = gerarAcao(rngTeste(s, n), n).dados!
          return d.tipo === 'blocos' ? `${d.de > d.sobre ? 'tras' : 'frente'}:${d.encontro}` : ''
        }),
      )
      expect(sentidos.has('tras:0') && sentidos.has('frente:0')).toBe(true)
      if (n === 3) expect(sentidos.has('frente:1') || sentidos.has('tras:1')).toBe(true)
    }
  })
  it('o enunciado nomeia corretamente quem age sobre quem', () => {
    for (const s of SEMENTES) {
      const inst = gerarAcao(rngTeste(s, 3), 3)
      const d = inst.dados!
      if (d.tipo !== 'blocos') continue
      expect(inst.enunciado).toContain(`força que ${'ABC'[d.de]} exerce sobre ${'ABC'[d.sobre]}`)
      expect(Math.abs(d.de - d.sobre)).toBe(1)
    }
  })
})
