import {
  CODONS,
  CODONS_PARADA,
  ENZIMAS,
  NOMES_AMINOACIDOS,
  PAR_DNA,
  bandasMeselson,
  chargaff,
  ciclosParaAlvo,
  classificarMutacao,
  codons,
  codonsDe,
  compativelComObservacao,
  complementarDNA,
  copiasAposCiclos,
  copiasDoFragmentoExato,
  cortes,
  degenerescencia,
  duracaoTotal,
  fragmentos,
  inserir,
  ligacoesHidrogenio,
  moleculasComN15,
  moleculasNaGeracao,
  numeroDeFragmentos,
  peptideoTexto,
  porcentagemGC,
  posicaoNoGel,
  remover,
  reversoComplementar,
  substituir,
  transcreverDaCodificadora,
  transcreverDoMolde,
  transcricaoLac,
  traduzir,
  type ModeloReplicacao,
  type MutacaoLac,
} from './calculo'

/* ------------------------------------------------------------------ código genético (tabela escrita de outra forma) */

// Lista por aminoácido, escrita à parte, para conferir a tabela gerada a partir da sequência padrão.
const POR_AMINOACIDO: Record<string, string[]> = {
  F: ['UUU', 'UUC'],
  L: ['UUA', 'UUG', 'CUU', 'CUC', 'CUA', 'CUG'],
  I: ['AUU', 'AUC', 'AUA'],
  M: ['AUG'],
  V: ['GUU', 'GUC', 'GUA', 'GUG'],
  S: ['UCU', 'UCC', 'UCA', 'UCG', 'AGU', 'AGC'],
  P: ['CCU', 'CCC', 'CCA', 'CCG'],
  T: ['ACU', 'ACC', 'ACA', 'ACG'],
  A: ['GCU', 'GCC', 'GCA', 'GCG'],
  Y: ['UAU', 'UAC'],
  '*': ['UAA', 'UAG', 'UGA'],
  H: ['CAU', 'CAC'],
  Q: ['CAA', 'CAG'],
  N: ['AAU', 'AAC'],
  K: ['AAA', 'AAG'],
  D: ['GAU', 'GAC'],
  E: ['GAA', 'GAG'],
  C: ['UGU', 'UGC'],
  W: ['UGG'],
  R: ['CGU', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
  G: ['GGU', 'GGC', 'GGA', 'GGG'],
}

describe('Código genético', () => {
  it('tem 64 códons, 61 que codificam 20 aminoácidos e 3 de parada', () => {
    expect(Object.keys(CODONS)).toHaveLength(64)
    const sentido = Object.values(CODONS).filter((a) => a !== '*')
    expect(sentido).toHaveLength(61)
    expect(new Set(sentido).size).toBe(20)
    expect(codonsDe('*').sort()).toEqual([...CODONS_PARADA].sort())
  })
  it('coincide, códon por códon, com a lista por aminoácido escrita à parte', () => {
    const outra: Record<string, string> = {}
    for (const [aa, lista] of Object.entries(POR_AMINOACIDO)) for (const c of lista) outra[c] = aa
    expect(Object.keys(outra)).toHaveLength(64)
    expect(CODONS).toEqual(outra)
  })
  it('degenerescência conhecida: Leu, Ser e Arg têm 6; Met e Trp têm 1; Ile tem 3', () => {
    expect([degenerescencia('L'), degenerescencia('S'), degenerescencia('R')]).toEqual([6, 6, 6])
    expect([degenerescencia('M'), degenerescencia('W')]).toEqual([1, 1])
    expect(degenerescencia('I')).toBe(3)
    expect(Object.keys(NOMES_AMINOACIDOS)).toHaveLength(21)
  })
  it('exemplos clássicos: AUG = Met, GAG = Glu, GUG = Val (anemia falciforme), UUU = Phe', () => {
    expect(CODONS.AUG).toBe('M')
    expect(CODONS.GAG).toBe('E')
    expect(CODONS.GUG).toBe('V')
    expect(CODONS.UUU).toBe('F')
    expect(CODONS.UGG).toBe('W')
  })
  it('só a terceira base costuma variar entre sinônimos: em 8 famílias de 4 códons o aminoácido não depende dela', () => {
    let familias = 0
    for (const b1 of 'ACGU')
      for (const b2 of 'ACGU') {
        const aas = new Set(['A', 'C', 'G', 'U'].map((b3) => CODONS[`${b1}${b2}${b3}`]))
        if (aas.size === 1) familias++
      }
    expect(familias).toBe(8)
  })
})

describe('Sequências, transcrição e tradução', () => {
  it('complementar e reverso-complementar', () => {
    expect(complementarDNA('TACGGA')).toBe('ATGCCT')
    expect(reversoComplementar('ATGC')).toBe('GCAT')
    expect(complementarDNA(complementarDNA('GATTACA'))).toBe('GATTACA')
    for (const b of 'ACGT') expect(PAR_DNA[PAR_DNA[b] as string]).toBe(b)
  })
  it('mRNA do molde: complementar com U; da codificadora: a mesma sequência com U no lugar de T', () => {
    expect(transcreverDoMolde('TACGGATTT')).toBe('AUGCCUAAA')
    expect(transcreverDaCodificadora('ATGCCTAAA')).toBe('AUGCCUAAA')
    // o molde de uma codificadora é o seu complementar
    const cod = 'ATGGCCTTAGGG'
    expect(transcreverDoMolde(complementarDNA(cod))).toBe(transcreverDaCodificadora(cod))
  })
  it('traduz do primeiro AUG até o códon de parada', () => {
    const t = traduzir('GGAUGGCUUUUUAAGGG')
    expect(t.inicio).toBe(2)
    expect(t.peptideo.join('')).toBe('MAF')
    expect(t.terminou).toBe(true)
    expect(peptideoTexto(t.peptideo)).toBe('Met-Ala-Phe')
    expect(peptideoTexto(t.peptideo, 'letras')).toBe('MAF')
  })
  it('sem códon de parada: traduz até o fim; sem AUG: nada', () => {
    expect(traduzir('AUGGCUUU').terminou).toBe(false)
    expect(traduzir('AUGGCUUU').peptideo.join('')).toBe('MA')
    expect(traduzir('GGGCCC').peptideo).toEqual([])
    expect(traduzir('GGGCCC').inicio).toBe(-1)
  })
  it('a leitura em códons ignora sobras de 1 ou 2 bases', () => {
    expect(codons('AUGGCUUU')).toEqual(['AUG', 'GCU'])
    expect(codons('AUGGCUUUA')).toEqual(['AUG', 'GCU', 'UUA'])
  })
})

describe('Composição do DNA', () => {
  it('Chargaff: A = T e G = C; 30 % de A → 30 % T, 20 % G, 20 % C', () => {
    const c = chargaff(30)
    expect(c).toEqual({ A: 30, T: 30, G: 20, C: 20 })
    for (const a of [10, 20, 25, 35, 40]) {
      const x = chargaff(a)
      expect(x.A + x.T + x.G + x.C).toBeCloseTo(100, 12)
    }
  })
  it('%GC e ligações de hidrogênio (2 por A–T e 3 por G–C), conferidas par a par', () => {
    expect(porcentagemGC('GGCCAATT')).toBe(50)
    expect(porcentagemGC('AAAA')).toBe(0)
    expect(ligacoesHidrogenio(3, 2)).toBe(12)
    const seq = 'ATGCGCATTA'
    const por_par = [...seq].reduce((s, b) => s + (b === 'A' || b === 'T' ? 2 : 3), 0)
    const at = [...seq].filter((b) => b === 'A' || b === 'T').length
    expect(ligacoesHidrogenio(at, seq.length - at)).toBe(por_par)
  })
})

describe('Mutações', () => {
  const original = 'AUGGAAGGCUGGUAA' // Met-Glu-Gly-Trp
  it('silenciosa: GAA → GAG (continua Glu)', () => {
    expect(classificarMutacao(original, substituir(original, 5, 'G'))).toBe('silenciosa')
  })
  it('de troca de sentido: GAA → GUA (Glu → Val)', () => {
    const m = substituir(original, 4, 'U')
    expect(traduzir(m).peptideo.join('')).toBe('MVGW')
    expect(classificarMutacao(original, m)).toBe('troca')
  })
  it('sem sentido: UGG → UGA cria parada antes do fim', () => {
    const m = substituir(original, 11, 'A')
    expect(traduzir(m).peptideo.join('')).toBe('MEG')
    expect(classificarMutacao(original, m)).toBe('semSentido')
  })
  it('mudança de quadro: inserir ou remover 1 ou 2 bases', () => {
    expect(classificarMutacao(original, inserir(original, 4, 'C'))).toBe('quadro')
    expect(classificarMutacao(original, remover(original, 4, 1))).toBe('quadro')
    expect(classificarMutacao(original, remover(original, 4, 2))).toBe('quadro')
  })
  it('inserção ou deleção de múltiplos de 3 bases: o quadro se mantém', () => {
    expect(classificarMutacao(original, inserir(original, 6, 'GGG'))).toBe('insercaoNoQuadro')
    expect(classificarMutacao(original, remover(original, 6, 3))).toBe('delecaoNoQuadro')
    expect(traduzir(inserir(original, 6, 'GGG')).peptideo.join('')).toBe('MEGGW')
    expect(traduzir(remover(original, 6, 3)).peptideo.join('')).toBe('MEW')
  })
  it('sem diferença: nenhuma', () => {
    expect(classificarMutacao(original, original)).toBe('nenhuma')
  })
  it('anemia falciforme: GAG → GUG troca Glu por Val', () => {
    const normal = 'AUGGUGCACCUGACUCCUGAGGAG'
    const mutante = 'AUGGUGCACCUGACUCCUGUGGAG'
    expect(traduzir(normal).peptideo.join('')).toBe('MVHLTPEE')
    expect(traduzir(mutante).peptideo.join('')).toBe('MVHLTPVE')
    expect(classificarMutacao(normal, mutante)).toBe('troca')
  })
  it('a classificação confere com a tabela para todas as substituições de um códon (conferência por varredura)', () => {
    const base = 'AUGGCUGAAUGGUAA' // Met-Ala-Glu-Trp
    let silenciosas = 0
    let semSentido = 0
    for (let pos = 3; pos < 12; pos++)
      for (const b of 'ACGU') {
        if (b === base[pos]) continue
        const mutante = substituir(base, pos, b)
        const tipo = classificarMutacao(base, mutante)
        const cod = Math.floor(pos / 3)
        const aaAntes = CODONS[base.slice(cod * 3, cod * 3 + 3)]
        const aaDepois = CODONS[mutante.slice(cod * 3, cod * 3 + 3)]
        if (aaDepois === aaAntes) {
          expect(tipo).toBe('silenciosa')
          silenciosas++
        } else if (aaDepois === '*') {
          expect(tipo).toBe('semSentido')
          semSentido++
        } else expect(tipo).toBe('troca')
      }
    expect(silenciosas).toBe(4) // GCU → GCC, GCA, GCG (3) e GAA → GAG (1)
    expect(semSentido).toBeGreaterThan(0)
  })
})

describe('Replicação (Meselson e Stahl)', () => {
  /** Simula o que acontece com cada molécula: 'P' = fita pesada (¹⁵N), 'L' = fita leve (¹⁴N). Replicação semiconservativa. */
  function simulaSemiconservativa(g: number) {
    let moleculas: [string, string][] = [['P', 'P']]
    for (let i = 0; i < g; i++) moleculas = moleculas.flatMap(([a, b]) => [[a, 'L'] as [string, string], [b, 'L'] as [string, string]])
    return moleculas
  }
  function simulaConservativa(g: number) {
    let moleculas: [string, string][] = [['P', 'P']]
    for (let i = 0; i < g; i++) moleculas = [...moleculas, ...moleculas.map(() => ['L', 'L'] as [string, string])]
    return moleculas
  }
  const fracoes = (m: [string, string][]) => ({
    pesado: m.filter(([a, b]) => a === 'P' && b === 'P').length / m.length,
    hibrido: m.filter(([a, b]) => a !== b).length / m.length,
    leve: m.filter(([a, b]) => a === 'L' && b === 'L').length / m.length,
  })
  it('semiconservativa: a fórmula coincide com a simulação molécula a molécula', () => {
    for (let g = 0; g <= 8; g++) {
      const sim = simulaSemiconservativa(g)
      const b = bandasMeselson('semiconservativa', g)
      expect(b.pesado).toBeCloseTo(fracoes(sim).pesado, 12)
      expect(b.hibrido).toBeCloseTo(fracoes(sim).hibrido, 12)
      expect(b.leve).toBeCloseTo(fracoes(sim).leve, 12)
      expect(sim).toHaveLength(moleculasNaGeracao(g))
      expect(sim.filter(([a, c]) => a === 'P' || c === 'P').length).toBe(moleculasComN15(g))
    }
  })
  it('conservativa: a fórmula coincide com a simulação (a molécula original nunca se desfaz)', () => {
    for (let g = 0; g <= 8; g++) {
      const sim = simulaConservativa(g)
      const b = bandasMeselson('conservativa', g)
      expect(b.pesado).toBeCloseTo(fracoes(sim).pesado, 12)
      expect(b.hibrido).toBeCloseTo(fracoes(sim).hibrido, 12)
      expect(b.leve).toBeCloseTo(fracoes(sim).leve, 12)
    }
  })
  it('as frações de cada hipótese somam 1; dispersiva tem uma só banda cuja densidade diminui', () => {
    const modelos: ModeloReplicacao[] = ['semiconservativa', 'conservativa', 'dispersiva']
    for (const m of modelos) for (let g = 0; g <= 6; g++) expect(Object.values(bandasMeselson(m, g)).length).toBeGreaterThan(0)
    for (const m of modelos)
      for (let g = 0; g <= 6; g++) {
        const b = bandasMeselson(m, g)
        expect(b.pesado + b.hibrido + b.leve).toBeCloseTo(1, 12)
      }
    expect(bandasMeselson('dispersiva', 1).fracaoN15).toBe(0.5)
    expect(bandasMeselson('dispersiva', 3).fracaoN15).toBe(0.125)
  })
  it('o experimento exclui a conservativa na 1ª geração e a dispersiva na 2ª', () => {
    expect(compativelComObservacao('conservativa', 1)).toBe(false)
    expect(compativelComObservacao('dispersiva', 1)).toBe(true)
    expect(compativelComObservacao('dispersiva', 2)).toBe(false)
    for (let g = 0; g <= 6; g++) expect(compativelComObservacao('semiconservativa', g)).toBe(true)
    // na geração 0 qualquer hipótese serve
    for (const m of ['conservativa', 'dispersiva'] as const) expect(compativelComObservacao(m, 0)).toBe(true)
  })
  it('semiconservativa: na geração 2, metade híbrida e metade leve; na 3, 25 % híbridas', () => {
    expect(bandasMeselson('semiconservativa', 1)).toEqual({ pesado: 0, hibrido: 1, leve: 0 })
    expect(bandasMeselson('semiconservativa', 2)).toEqual({ pesado: 0, hibrido: 0.5, leve: 0.5 })
    expect(bandasMeselson('semiconservativa', 3).hibrido).toBe(0.25)
  })
})

describe('Enzimas de restrição e eletroforese', () => {
  it('os sítios são palíndromos (igual ao reverso-complementar): basta procurar numa fita', () => {
    for (const e of ENZIMAS) expect(reversoComplementar(e.sitio), e.nome).toBe(e.sitio)
  })
  it('as posições de corte coincidem com a busca por expressão regular', () => {
    const seq = 'AAGAATTCAAGGATCCAAGAATTCTTAAGCTTCCCGGGAA'
    for (const e of ENZIMAS) {
      const esperado = [...seq.matchAll(new RegExp(e.sitio, 'g'))].map((m) => (m.index as number) + e.corteApos)
      expect(cortes(seq, e), e.nome).toEqual(esperado)
    }
    expect(cortes(seq, ENZIMAS[0]!)).toEqual([3, 19]) // EcoRI duas vezes
  })
  it('fragmentos: linear com 2 cortes = 3 fragmentos; circular com 2 cortes = 2', () => {
    expect(fragmentos(18, [3, 11])).toEqual([8, 7, 3])
    expect(fragmentos(18, [3, 11], true)).toEqual([10, 8])
    expect(fragmentos(18, [])).toEqual([18])
    expect(fragmentos(18, [7], true)).toEqual([18])
    expect(fragmentos(18, [7])).toEqual([11, 7])
  })
  it('os fragmentos sempre somam o tamanho total, linear ou circular', () => {
    for (const circular of [false, true])
      for (const pos of [[5], [5, 20], [3, 11, 40, 77]]) expect(fragmentos(100, pos, circular).reduce((s, x) => s + x, 0)).toBe(100)
  })
  it('número de fragmentos: n + 1 (linear) e n (circular)', () => {
    for (const n of [1, 2, 3, 6]) {
      expect(numeroDeFragmentos(n, false)).toBe(n + 1)
      expect(numeroDeFragmentos(n, true)).toBe(n)
      expect(fragmentos(1000, Array.from({ length: n }, (_, i) => (i + 1) * 100), false)).toHaveLength(n + 1)
      expect(fragmentos(1000, Array.from({ length: n }, (_, i) => (i + 1) * 100), true)).toHaveLength(n)
    }
    expect(numeroDeFragmentos(0, true)).toBe(1)
  })
  it('no gel, fragmento menor migra mais, sempre dentro do gel', () => {
    let anterior = Infinity
    for (const t of [100, 200, 500, 1000, 3000, 10_000]) {
      const p = posicaoNoGel(t)
      expect(p).toBeGreaterThan(0)
      expect(p).toBeLessThan(1)
      expect(p).toBeLessThan(anterior)
      anterior = p
    }
  })
})

describe('PCR', () => {
  it('2ⁿ cópias com eficiência de 100 %', () => {
    expect(copiasAposCiclos(1, 10)).toBe(1024)
    expect(copiasAposCiclos(100, 5)).toBe(3200)
    expect(copiasAposCiclos(1, 30)).toBe(2 ** 30)
  })
  it('simulação por tipo de fita confirma 2ⁿ − 2n moléculas do fragmento exato (e 2ⁿ no total)', () => {
    // L = fita longa (original), M = fita de tamanho intermediário, S = fita exata entre os primers
    type Fita = 'L' | 'M' | 'S'
    const parceira: Record<Fita, Fita> = { L: 'M', M: 'S', S: 'S' }
    let moleculas: [Fita, Fita][] = [['L', 'L']]
    for (let n = 1; n <= 12; n++) {
      moleculas = moleculas.flatMap(([a, b]) => [[a, parceira[a]] as [Fita, Fita], [b, parceira[b]] as [Fita, Fita]])
      expect(moleculas).toHaveLength(2 ** n)
      expect(moleculas.filter(([a, b]) => a === 'S' && b === 'S').length, `ciclo ${n}`).toBe(copiasDoFragmentoExato(n))
    }
    expect(copiasDoFragmentoExato(1)).toBe(0)
    expect(copiasDoFragmentoExato(2)).toBe(0)
    expect(copiasDoFragmentoExato(3)).toBe(2)
  })
  it('ciclos para chegar a um alvo e duração total', () => {
    expect(ciclosParaAlvo(1, 1_000_000)).toBe(20)
    expect(ciclosParaAlvo(1, 1024)).toBe(10)
    expect(ciclosParaAlvo(1000, 1_000_000)).toBe(10)
    expect(ciclosParaAlvo(5, 5)).toBe(0)
    expect(duracaoTotal(30, 30, 30, 60)).toBe(3600)
  })
})

describe('Óperon lac', () => {
  // tabela de verdade escrita por extenso: [lactose, glicose] → nível, para cada mutação
  const TABELA: Record<MutacaoLac, Record<string, string>> = {
    nenhuma: { 'sem lactose, com glicose': 'nenhuma', 'sem lactose, sem glicose': 'nenhuma', 'com lactose, com glicose': 'baixa', 'com lactose, sem glicose': 'alta' },
    repressor: { 'sem lactose, com glicose': 'baixa', 'sem lactose, sem glicose': 'alta', 'com lactose, com glicose': 'baixa', 'com lactose, sem glicose': 'alta' },
    operador: { 'sem lactose, com glicose': 'baixa', 'sem lactose, sem glicose': 'alta', 'com lactose, com glicose': 'baixa', 'com lactose, sem glicose': 'alta' },
    superrepressor: { 'sem lactose, com glicose': 'nenhuma', 'sem lactose, sem glicose': 'nenhuma', 'com lactose, com glicose': 'nenhuma', 'com lactose, sem glicose': 'nenhuma' },
    promotor: { 'sem lactose, com glicose': 'nenhuma', 'sem lactose, sem glicose': 'nenhuma', 'com lactose, com glicose': 'nenhuma', 'com lactose, sem glicose': 'nenhuma' },
  }
  it('confere com a tabela de verdade para todas as mutações e condições', () => {
    for (const [mut, linhas] of Object.entries(TABELA))
      for (const [cond, esperado] of Object.entries(linhas)) {
        const lactose = cond.startsWith('com lactose')
        const glicose = cond.endsWith('com glicose') && !cond.endsWith('sem glicose')
        expect(transcricaoLac({ lactose, glicose, mutacao: mut as MutacaoLac }), `${mut}: ${cond}`).toBe(esperado)
      }
  })
})
