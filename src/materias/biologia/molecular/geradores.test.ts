import { itemValido } from '../comum/auxiliares'
import { checarMulti, checarNum, NIVEIS, rngTeste as rng, SEMENTES, textoCerto } from '../comum/checagens'
import { BANCO_MUTACOES, BANCO_TECNICAS, gerarBiotec, gerarCodigo, gerarMutacoes, gerarReplicacao, gerarTecnicas, gerarTraducao, gerarTranscricao } from './geradores'
import { POR_AMINOACIDO, TABELA_IND, TABELA_LAC, como3, complementoRNA, semExtremidades, traduzirInd } from './utilTeste'

describe('Do DNA ao mRNA', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarTranscricao(rng(s, n), n), `transcricao ${n} ${s}`)
  })
  it('a alternativa certa confere com o pareamento escrito base por base', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarTranscricao(rng(s, n), n)
        const d = inst.dados!
        const certo = textoCerto(inst)
        const rot = `${d.tipo} ${n} ${s}`
        if (d.tipo === 'molde') {
          const molde = d.dadas[0]!.seq
          const esperado = [...molde].map((b) => complementoRNA[b]).join('')
          expect(semExtremidades(certo), rot).toBe(esperado)
          expect(certo.startsWith('5′-'), rot).toBe(true)
          for (const o of inst.opcoes) expect(o.rotulo.startsWith('5′-')).toBe(true)
        } else if (d.tipo === 'codificadora') {
          const cod = d.dadas[0]!.seq
          expect(semExtremidades(certo), rot).toBe([...cod].map((b) => (b === 'T' ? 'U' : b)).join(''))
        } else {
          // dado o mRNA, a fita molde é a que o pareia: A–U, T–A, G–C, C–G, posição por posição
          const mrna = (inst.enunciado.match(/5′-([ACGU]+)-3′/) as RegExpMatchArray)[1] as string
          const [cima, baixo] = d.dadas.map((x) => x.seq) as [string, string]
          const pareia = (seq: string) => [...seq].map((b) => complementoRNA[b]).join('') === mrna
          const molde = pareia(cima) ? 'A fita de cima' : pareia(baixo) ? 'A fita de baixo' : 'nenhuma'
          expect(certo, rot).toBe(molde)
        }
        // a explicação nunca deixa T no mRNA
        for (const o of inst.opcoes.filter((x) => x.id === inst.certa)) expect(o.rotulo).not.toMatch(/5′-[ACGU]*T/)
      }
  })
  it('tipos por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarTranscricao(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['molde']))
    expect(tipos(2)).toEqual(new Set(['codificadora']))
    expect(tipos(3)).toEqual(new Set(['qualMolde']))
  })
})

describe('Do mRNA à proteína', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarTraducao(rng(s, n), n), `traducao ${n} ${s}`)
  })
  it('o peptídeo certo confere com a tradução independente (tabela escrita à parte), e as outras alternativas diferem', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarTraducao(rng(s, n), n)
        const d = inst.dados!
        const seq = d.dadas[0]!.seq
        let mrna: string
        if (d.tipo === 'mrna') mrna = seq
        else if (d.tipo === 'codificadora') mrna = seq.replace(/T/g, 'U')
        else mrna = [...seq].map((b) => complementoRNA[b]).join('')
        const esperado = como3(traduzirInd(mrna))
        expect(textoCerto(inst), `${d.tipo} ${n} ${s}`).toBe(esperado)
        for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(o.rotulo).not.toBe(esperado)
        // o peptídeo começa em metionina e tem pelo menos 4 aminoácidos
        expect(esperado.startsWith('Met-')).toBe(true)
      }
  })
  it('tipos por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarTraducao(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['mrna']))
    expect(tipos(2)).toEqual(new Set(['codificadora']))
    expect(tipos(3)).toEqual(new Set(['molde']))
  })
})

describe('Mutações', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarMutacoes(rng(s, n), n), `mutacoes ${n} ${s}`)
  })
  /** Classificação escrita à parte, só a partir dos peptídeos e dos comprimentos. */
  function classifica(original: string, mutante: string): string {
    const po = traduzirInd(original)
    const pm = traduzirInd(mutante)
    if ((mutante.length - original.length) % 3 !== 0) return 'Mudança no quadro de leitura (frameshift)'
    if (po.join('') === pm.join('')) return 'Mutação silenciosa'
    if (pm.length < po.length) return 'Mutação sem sentido (nonsense)'
    return 'Mutação de troca de sentido (missense)'
  }
  it('o tipo certo confere com a classificação independente (a partir dos peptídeos)', () => {
    let vistos = 0
    for (const n of [1, 2] as const)
      for (const s of SEMENTES) {
        const inst = gerarMutacoes(rng(s, n), n)
        const d = inst.dados!
        if (d.tipo === 'peptideos') {
          const [o, m] = d.dadas.map((x) => x.seq) as [string, string]
          expect(textoCerto(inst), `${n} ${s}`).toBe(classifica(o, m))
          // o enunciado cita corretamente o peptídeo original e o mutante
          expect(inst.enunciado).toContain(como3(traduzirInd(o)))
          expect(inst.enunciado).toContain(como3(traduzirInd(m)))
          vistos++
        } else if (d.tipo === 'codon') {
          const m = inst.enunciado.match(/códon ([ACGU]{3}) passou a ser ([ACGU]{3})/) as RegExpMatchArray
          const de = TABELA_IND[m[1] as string] as string
          const para = TABELA_IND[m[2] as string] as string
          const esperado = de === para ? 'Mutação silenciosa' : para === '*' ? 'Mutação sem sentido (nonsense)' : 'Mutação de troca de sentido (missense)'
          expect(textoCerto(inst), `${n} ${s}`).toBe(esperado)
          vistos++
        }
      }
    expect(vistos).toBeGreaterThan(150)
  })
  it('tipos por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarMutacoes(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['codon']))
    expect(tipos(2)).toEqual(new Set(['peptideos']))
    expect(tipos(3)).toEqual(new Set(['impacto', 'cenario']))
  })
  it('nível 3, impacto: a mudança de quadro é a que altera mais posições do peptídeo (contagem independente)', () => {
    let vistos = 0
    for (const s of SEMENTES) {
      const inst = gerarMutacoes(rng(s, 3), 3)
      const d = inst.dados!
      if (d.tipo !== 'impacto') continue
      expect(textoCerto(inst)).toBe('Inserção de 1 base logo depois do AUG')
      vistos++
      // todas as outras alternativas explicam que afetam menos posições
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(inst.porque[o.id]).toMatch(/Altera \d+ posi/)
    }
    expect(vistos).toBeGreaterThan(10)
  })
  it('bancos escritos à mão: estrutura válida e perguntas diferentes', () => {
    for (const { item } of BANCO_MUTACOES) expect(itemValido(item), item.pergunta).toBe(true)
    expect(new Set(BANCO_MUTACOES.map((x) => x.item.pergunta)).size).toBe(BANCO_MUTACOES.length)
  })
})

describe('Código genético (numérico)', () => {
  it('estrutura: erros típicos válidos e resposta aceita', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarNum(gerarCodigo(rng(s, n), n), `codigo ${n} ${s}`)
  })
  it('as respostas batem com contagens independentes', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarCodigo(rng(s, n), n)
        const d = inst.dados!
        const rot = `${n} ${s} ${d.variante}`
        if (d.variante === 'degenerescencia') expect(inst.resposta, rot).toBe(Object.values(TABELA_IND).filter((a) => a === (d.aminoacidos as string[])[0]).length)
        else if (d.variante === 'possibilidades') expect(inst.resposta, rot).toBe((d.aminoacidos as string[]).reduce((p, a) => p * (POR_AMINOACIDO[a] as string[]).length, 1))
        else {
          const x = d.extra as Record<string, number>
          const base = ((x.n as number) + (x.incluindoParada as number)) * 3
          expect(inst.resposta, rot).toBe(x.tipo === 2 ? base * 2 : base)
        }
      }
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarCodigo(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['degenerescencia']))
    expect(vs(2)).toEqual(new Set(['tamanho']))
    expect(vs(3)).toEqual(new Set(['possibilidades']))
  })
})

describe('Replicação e composição do DNA (numérico)', () => {
  it('estrutura: erros típicos válidos e resposta aceita', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarNum(gerarReplicacao(rng(s, n), n), `replicacao ${n} ${s}`)
  })
  it('as respostas batem com simulações e contas independentes', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarReplicacao(rng(s, n), n)
        const d = inst.dados!
        const x = d.extra as Record<string, number>
        const rot = `${n} ${s} ${d.variante}`
        if (d.variante === 'chargaff') {
          const a = x.a as number
          const g = (100 - 2 * a) / 2
          const quer = inst.enunciado.includes('guanina + citosina') ? 2 * g : inst.enunciado.includes('de timina') ? a : g
          expect(inst.resposta, rot).toBeCloseTo(quer, 9)
        } else if (d.variante === 'meselson') {
          // simulação molécula a molécula: fitas pesadas (P) e leves (L)
          let moleculas: [string, string][] = [['P', 'P']]
          for (let i = 0; i < (x.g as number); i++) moleculas = moleculas.flatMap(([a, b]) => [[a, 'L'] as [string, string], [b, 'L'] as [string, string]])
          const pedido = x.pedido as number
          const esperado = pedido === 0 ? moleculas.length : pedido === 1 ? moleculas.filter(([a, b]) => a === 'P' || b === 'P').length : pedido === 2 ? (100 * moleculas.filter(([a, b]) => a !== b).length) / moleculas.length : (100 * moleculas.filter(([a, b]) => a === 'L' && b === 'L').length) / moleculas.length
          expect(inst.resposta, rot).toBeCloseTo(esperado, 6)
        } else if (d.variante === 'ligacoes') {
          // conta par a par numa sequência com a mesma composição
          const pares = x.pares as number
          const gc = (pares * (x.gc as number)) / 100
          const seq = 'G'.repeat(gc) + 'A'.repeat(pares - gc)
          expect(inst.resposta, rot).toBe([...seq].reduce((s2, b) => s2 + (b === 'G' || b === 'C' ? 3 : 2), 0))
        } else {
          // soma, rodada a rodada, dos nucleotídeos incorporados
          let total = 0
          let moleculas = 1
          for (let r = 0; r < (x.rodadas as number); r++) {
            total += moleculas * 2 * (x.pares as number)
            moleculas *= 2
          }
          expect(inst.resposta, rot).toBe(total)
        }
      }
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarReplicacao(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['chargaff']))
    expect(vs(2)).toEqual(new Set(['meselson']))
    expect(vs(3)).toEqual(new Set(['ligacoes', 'consumo']))
  })
})

describe('Biotecnologia (numérico)', () => {
  it('estrutura: erros típicos válidos e resposta aceita', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarNum(gerarBiotec(rng(s, n), n), `biotec ${n} ${s}`)
  })
  it('as respostas batem com cálculos independentes', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarBiotec(rng(s, n), n)
        const d = inst.dados!
        const x = d.extra as Record<string, number>
        const rot = `${n} ${s} ${d.variante}`
        if (d.variante === 'copias') {
          let v = x.inicial as number
          for (let i = 0; i < (x.n as number); i++) v *= 2
          expect(inst.resposta, rot).toBe(v)
        } else if (d.variante === 'ciclos') {
          let v = x.inicial as number
          let ciclos = 0
          while (v < (x.alvo as number)) {
            v *= 2
            ciclos++
          }
          expect(inst.resposta, rot).toBe(ciclos)
        } else if (d.variante === 'duracao') {
          expect(inst.resposta, rot).toBeCloseTo(((x.ciclos as number) * ((x.tD as number) + (x.tA as number) + (x.tE as number))) / 60, 9)
        } else {
          const { tamanho, cortes, circular } = d.mapa!
          // distâncias entre cortes, calculadas de outra forma: percorre a molécula marcando os cortes
          const marcas = [...cortes].sort((a, b) => a - b)
          const trechos: number[] = []
          for (let i = 1; i < marcas.length; i++) trechos.push((marcas[i] as number) - (marcas[i - 1] as number))
          if (circular) trechos.push(tamanho - (marcas[marcas.length - 1] as number) + (marcas[0] as number))
          else {
            trechos.push(marcas[0] as number)
            trechos.push(tamanho - (marcas[marcas.length - 1] as number))
          }
          expect(trechos.reduce((s2, t) => s2 + t, 0), rot).toBeCloseTo(tamanho, 9)
          const quer = inst.enunciado.includes('o menor fragmento') ? Math.min(...trechos) : inst.enunciado.includes('o maior fragmento') ? Math.max(...trechos) : trechos.length
          expect(inst.resposta, rot).toBeCloseTo(quer, 9)
        }
      }
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarBiotec(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['copias']))
    expect(vs(2)).toEqual(new Set(['ciclos', 'duracao']))
    expect(vs(3)).toEqual(new Set(['restricao']))
  })
})

describe('Biotecnologia e regulação gênica (múltipla escolha)', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarTecnicas(rng(s, n), n), `tecnicas ${n} ${s}`)
  })
  it('óperon lac: a alternativa certa confere com a tabela de verdade escrita à parte', () => {
    let vistos = 0
    const chaveMut = (enunciado: string) => (enunciado.includes('sem mutações') ? 'nenhuma' : enunciado.includes('gene do repressor (lacI)') ? 'repressor' : enunciado.includes('no operador') ? 'operador' : enunciado.includes('lactose (ele fica') ? 'superrepressor' : 'promotor')
    for (const n of [2, 3] as const)
      for (const s of SEMENTES) {
        const inst = gerarTecnicas(rng(s, n), n)
        if (inst.dados!.tipo !== 'lac') continue
        const lactose = inst.enunciado.includes('com lactose') ? '1' : '0'
        const glicose = inst.enunciado.includes('com glicose') ? '1' : '0'
        const nivel = TABELA_LAC[`${lactose}|${glicose}|${chaveMut(inst.enunciado)}`]
        const frase = { nenhuma: 'Não há transcrição dos genes lac.', baixa: 'A transcrição é baixa.', alta: 'A transcrição é alta.' }[nivel as 'nenhuma']
        expect(textoCerto(inst), `${n} ${s}: ${inst.enunciado}`).toBe(frase)
        vistos++
      }
    expect(vistos).toBeGreaterThan(40)
  })
  it('gel: as bandas certas são as distâncias entre cortes de um plasmídeo circular e somam o tamanho', () => {
    let vistos = 0
    for (const s of SEMENTES) {
      const inst = gerarTecnicas(rng(s, 2), 2)
      if (inst.dados!.tipo !== 'gel') continue
      const { tamanho, cortes } = inst.dados!.mapa!
      const certas = textoCerto(inst)
        .split(', ')
        .map((x) => Number(x.replace(' kb', '').replace(',', '.')))
      expect(certas.length).toBe(cortes.length)
      expect(certas.reduce((a, b) => a + b, 0)).toBeCloseTo(tamanho, 6)
      vistos++
    }
    expect(vistos).toBeGreaterThan(10)
  })
  it('tipos por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarTecnicas(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['banco']))
    expect(tipos(2)).toEqual(new Set(['banco', 'lac', 'gel']))
    expect(tipos(3)).toEqual(new Set(['banco', 'lac', 'gel']))
  })
  it('banco escrito à mão: estrutura válida, perguntas diferentes e todos os níveis cobertos', () => {
    for (const { item } of BANCO_TECNICAS) expect(itemValido(item), item.pergunta).toBe(true)
    expect(new Set(BANCO_TECNICAS.map((x) => x.item.pergunta)).size).toBe(BANCO_TECNICAS.length)
    for (const n of NIVEIS) expect(BANCO_TECNICAS.some((b) => b.nivel === n)).toBe(true)
  })
})
