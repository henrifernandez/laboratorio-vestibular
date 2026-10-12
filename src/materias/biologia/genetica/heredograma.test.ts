import { criarRng } from '@/lib/rng'
import {
  ESTRUTURAS,
  ESTRUTURA_DOIS_RAMOS,
  ESTRUTURA_DUAS_FAMILIAS,
  ESTRUTURA_SIMPLES,
  ESTRUTURA_TRES_GERACOES,
  MODELOS,
  analisar,
  comFenotipos,
  compativel,
  genotiposPossiveis,
  layoutHeredograma,
  modelosCompativeis,
  ordemTopologica,
  priori,
  rotuloGenotipo,
  simular,
  transmissao,
  type Heredograma,
  type Modelo,
  type Pessoa,
} from './heredograma'
import { forcaBruta } from './utilTeste'

const algunsAfetados = (est: Heredograma, ids: string[]) => comFenotipos(est, ids)

describe('Transmissão e probabilidades a priori (tabelas conhecidas)', () => {
  it('autossômica: Aa × Aa → 1/4, 1/2, 1/4 (genótipo = nº de cópias de a)', () => {
    expect(transmissao('AR', 1, 1, 'M', 0)).toBeCloseTo(0.25, 12)
    expect(transmissao('AR', 1, 1, 'M', 1)).toBeCloseTo(0.5, 12)
    expect(transmissao('AR', 1, 1, 'F', 2)).toBeCloseTo(0.25, 12)
    expect(transmissao('AR', 2, 0, 'M', 1)).toBe(1)
    expect(transmissao('AD', 1, 0, 'F', 1)).toBeCloseTo(0.5, 12)
  })
  it('ligada ao X: o filho homem não recebe o X do pai; a filha recebe sempre', () => {
    for (const gPai of [0, 1]) {
      expect(transmissao('XR', gPai, 0, 'M', 0)).toBe(1)
      expect(transmissao('XR', gPai, 2, 'M', 1)).toBe(1)
    }
    expect(transmissao('XR', 1, 0, 'F', 1)).toBe(1) // pai afetado, mãe XAXA → filha portadora
    expect(transmissao('XR', 1, 2, 'F', 2)).toBe(1) // pai afetado, mãe XaXa → filha afetada
    expect(transmissao('XR', 0, 1, 'M', 1)).toBeCloseTo(0.5, 12)
    expect(transmissao('XR', 0, 1, 'F', 2)).toBe(0)
  })
  it('as probabilidades de transmissão somam 1 para todos os pares de pais e todos os modelos', () => {
    for (const m of MODELOS)
      for (const sexo of ['M', 'F'] as const)
        for (const gp of genotiposPossiveis(m, 'M'))
          for (const gm of genotiposPossiveis(m, 'F')) expect(genotiposPossiveis(m, sexo).reduce((s, gf) => s + transmissao(m, gp, gm, sexo, gf), 0), `${m} ${sexo} ${gp} ${gm}`).toBeCloseTo(1, 12)
  })
  it('a priori: soma 1 por sexo, e q² é a frequência de afetados recessivos', () => {
    for (const m of MODELOS)
      for (const sexo of ['M', 'F'] as const) expect(genotiposPossiveis(m, sexo).reduce((s, g) => s + priori(m, sexo, g, 0.2), 0), `${m} ${sexo}`).toBeCloseTo(1, 12)
    expect(priori('AR', 'F', 2, 0.1)).toBeCloseTo(0.01, 12)
    expect(priori('XR', 'M', 1, 0.1)).toBeCloseTo(0.1, 12)
  })
  it('rótulos de genótipo', () => {
    expect(rotuloGenotipo('AR', 'F', 1)).toBe('Aa')
    expect(rotuloGenotipo('AD', 'M', 0)).toBe('aa')
    expect(rotuloGenotipo('XR', 'M', 1)).toBe('XaY')
    expect(rotuloGenotipo('XR', 'F', 1)).toBe('XAXa')
    expect(rotuloGenotipo('XD', 'F', 2)).toBe('XAXA')
  })
})

describe('Motor de inferência × força bruta (independente)', () => {
  it('total, marginais e probabilidade do próximo filho coincidem em centenas de heredogramas aleatórios', () => {
    const rng = criarRng(12345)
    let comparados = 0
    for (let rodada = 0; rodada < 120; rodada++) {
      const est = [ESTRUTURA_SIMPLES, ESTRUTURA_TRES_GERACOES, ESTRUTURA_DUAS_FAMILIAS][rodada % 3] as Heredograma
      const modelo = MODELOS[rodada % 4] as Modelo
      const ped = simular(est, modelo, 0.3, rng)
      const casais = ped.pessoas.filter((p) => p.pais).map((p) => p.pais as [string, string])
      const [pai, mae] = (casais[0] as [string, string]) ?? ['I-1', 'I-2']
      for (const m of MODELOS) {
        const q = 0.05
        const a = analisar(ped, m, q, { pai, mae })
        const b = forcaBruta(ped, m, q, { pai, mae })
        expect(a.total, `${est.nome} ${modelo}→${m} total`).toBeCloseTo(b.total, 15)
        if (b.total === 0) {
          expect(a.total).toBe(0)
          continue
        }
        comparados++
        ped.pessoas.forEach((p, i) => {
          const marg = a.marginais.get(p.id) as number[]
          for (let k = 0; k < 3; k++) expect(marg[k] as number, `${est.nome} ${m} ${p.id}[${k}]`).toBeCloseTo((b.marginais[i] as number[])[k] as number, 9)
        })
        expect(a.filhoAfetado as number, `${est.nome} ${m} filho`).toBeCloseTo(b.filho as number, 9)
      }
    }
    expect(comparados).toBeGreaterThan(150)
  })
})

describe('Casos clássicos de livro', () => {
  it('filha afetada de pais normais: só a herança autossômica recessiva serve', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, [])
    ped.pessoas.find((p) => p.id === 'II-2')!.afetado = true // II-2 é mulher
    expect(modelosCompativeis(ped)).toEqual(['AR'])
  })
  it('filho afetado de pais normais: autossômica recessiva ou recessiva ligada ao X', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, ['II-1']) // II-1 é homem
    expect(modelosCompativeis(ped).sort()).toEqual(['AR', 'XR'])
  })
  it('pais afetados e todos os filhos normais: só a dominante autossômica serve', () => {
    const outra = algunsAfetados(ESTRUTURA_SIMPLES, ['I-1', 'I-2']) // II-1, II-2 e II-3 normais
    expect(modelosCompativeis(outra)).toEqual(['AD']) // AR e XR dariam filhos afetados; XD daria filha afetada
  })
  it('pais afetados e todos os filhos afetados: o modelo recessivo é compatível (aa × aa → aa)', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, ['I-1', 'I-2', 'II-1', 'II-2', 'II-3'])
    expect(compativel(ped, 'AR')).toBe(true)
    expect(compativel(ped, 'XR')).toBe(true)
  })
  it('XD: o pai afetado passa a doença às filhas, nunca aos filhos', () => {
    const filhaAfetada = algunsAfetados(ESTRUTURA_SIMPLES, ['I-1', 'II-2'])
    expect(compativel(filhaAfetada, 'XD')).toBe(true)
    const filhoAfetado = algunsAfetados(ESTRUTURA_SIMPLES, ['I-1', 'II-1']) // II-2 (filha) normal e II-1 (filho) afetado
    expect(compativel(filhoAfetado, 'XD')).toBe(false)
    const filhaNormal = algunsAfetados(ESTRUTURA_SIMPLES, ['I-1']) // pai afetado, filha normal
    expect(compativel(filhaNormal, 'XD')).toBe(false)
  })
  it('AR: irmão normal de um afetado é portador com probabilidade 2/3', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, ['II-1']) // II-1 afetado; II-2 e II-3 normais
    const r = analisar(ped, 'AR')
    expect((r.marginais.get('II-2') as number[])[1]).toBeCloseTo(2 / 3, 5)
    expect((r.marginais.get('II-3') as number[])[0]).toBeCloseTo(1 / 3, 5)
    // os pais são obrigatoriamente heterozigotos
    expect((r.marginais.get('I-1') as number[])[1]).toBeCloseTo(1, 5)
    expect((r.marginais.get('I-2') as number[])[1]).toBeCloseTo(1, 5)
  })
  it('AR: dois filhos normais de casais que já tiveram filho afetado → 2/3 × 2/3 × 1/4 = 1/9', () => {
    // duas famílias, cada uma com um filho afetado e uma pessoa normal; as duas pessoas normais casam
    const est: Heredograma = { ...ESTRUTURA_DUAS_FAMILIAS, pessoas: ESTRUTURA_DUAS_FAMILIAS.pessoas.filter((p) => p.geracao < 2) }
    const ped = comFenotipos(est, ['II-1', 'II-4']) // irmãos afetados dos dois ramos
    const r = analisar(ped, 'AR', 1e-6, { pai: 'II-3', mae: 'II-2' })
    expect(r.filhoAfetado).toBeCloseTo(1 / 9, 5)
  })
  it('XR: mãe com filho afetado é portadora; próximo filho homem afetado = 1/2; filho de qualquer sexo = 1/4', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, ['II-1'])
    expect(analisar(ped, 'XR').marginais.get('I-2')).toBeDefined()
    expect((analisar(ped, 'XR').marginais.get('I-2') as number[])[1]).toBeCloseTo(1, 5)
    expect(analisar(ped, 'XR', 1e-6, { pai: 'I-1', mae: 'I-2', sexo: 'M' }).filhoAfetado).toBeCloseTo(1 / 2, 5)
    expect(analisar(ped, 'XR', 1e-6, { pai: 'I-1', mae: 'I-2', sexo: 'F' }).filhoAfetado).toBeCloseTo(0, 5)
    expect(analisar(ped, 'XR', 1e-6, { pai: 'I-1', mae: 'I-2' }).filhoAfetado).toBeCloseTo(1 / 4, 5)
  })
  it('XR: irmã normal de um homem afetado é portadora com probabilidade 1/2', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, ['II-1'])
    expect((analisar(ped, 'XR').marginais.get('II-2') as number[])[1]).toBeCloseTo(1 / 2, 5)
  })
  it('AD: afetado com filho normal é heterozigoto; filho de afetado × normal tem 1/2', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, ['I-1', 'II-1']) // pai afetado, um filho afetado, o resto normal
    const r = analisar(ped, 'AD', 1e-6, { pai: 'I-1', mae: 'I-2' })
    expect((r.marginais.get('I-1') as number[])[1]).toBeCloseTo(1, 5)
    expect(r.filhoAfetado).toBeCloseTo(1 / 2, 5)
  })
  it('um indivíduo afetado recessivo (AR) é sempre aa e seus pais, mesmo normais, são Aa', () => {
    const ped = algunsAfetados(ESTRUTURA_TRES_GERACOES, ['II-3'])
    const r = analisar(ped, 'AR')
    expect((r.marginais.get('II-3') as number[])[2]).toBeCloseTo(1, 9)
    expect((r.marginais.get('I-1') as number[])[1]).toBeCloseTo(1, 5)
  })
  it('modelo impossível devolve total 0 e marginais zeradas', () => {
    const ped = algunsAfetados(ESTRUTURA_SIMPLES, ['II-2'])
    const r = analisar(ped, 'AD')
    expect(r.total).toBe(0)
    expect(r.filhoAfetado).toBeUndefined()
  })
})

describe('Simulação e estruturas', () => {
  it('o modelo que gerou o heredograma é sempre compatível com ele', () => {
    const rng = criarRng(99)
    for (const est of ESTRUTURAS) for (const m of MODELOS) for (let i = 0; i < 25; i++) expect(compativel(simular(est, m, 0.25, rng), m), `${est.nome} ${m}`).toBe(true)
  })
  it('a simulação respeita as regras: em XR, filho afetado de pais normais → mãe portadora; pai afetado não passa a doença ao filho', () => {
    const rng = criarRng(7)
    for (let i = 0; i < 200; i++) {
      const ped = simular(ESTRUTURA_SIMPLES, 'XR', 0.3, rng)
      const af = (id: string) => ped.pessoas.find((p) => p.id === id)!.afetado
      // uma filha afetada exige pai afetado
      if (af('II-2')) expect(af('I-1')).toBe(true)
    }
  })
  it('as estruturas são válidas: pais existem, ficam em gerações anteriores e formam casais lado a lado', () => {
    for (const est of ESTRUTURAS) {
      const por = new Map(est.pessoas.map((p) => [p.id, p]))
      expect(por.size).toBe(est.pessoas.length)
      expect(ordemTopologica(est)).toHaveLength(est.pessoas.length)
      for (const p of est.pessoas) {
        if (!p.pais) continue
        const [pai, mae] = p.pais.map((id) => por.get(id) as Pessoa)
        expect(pai!.sexo, `${est.nome}/${p.id}`).toBe('M')
        expect(mae!.sexo).toBe('F')
        expect(pai!.geracao).toBe(p.geracao - 1)
        expect(mae!.geracao).toBe(p.geracao - 1)
        expect(Math.abs(pai!.ordem - mae!.ordem), `${est.nome}: casal de ${p.id} deve ficar lado a lado`).toBe(1)
      }
      // ordem sem repetição dentro de cada geração
      for (const g of new Set(est.pessoas.map((p) => p.geracao))) {
        const ordens = est.pessoas.filter((p) => p.geracao === g).map((p) => p.ordem)
        expect(new Set(ordens).size).toBe(ordens.length)
      }
    }
  })
  it('os identificadores seguem a notação romana: geração I, II, III com números a partir de 1', () => {
    for (const est of ESTRUTURAS) for (const p of est.pessoas) expect(p.id).toMatch(new RegExp(`^${['I', 'II', 'III', 'IV'][p.geracao]}-\\d+$`))
  })
})

describe('Desenho', () => {
  it.each(ESTRUTURAS.map((e) => [e.nome, e] as const))('%s: todos dentro da área e sem sobreposição; segmentos ortogonais', (_n, est) => {
    const lay = layoutHeredograma(est)
    expect(lay.posicoes.size).toBe(est.pessoas.length)
    for (const [, p] of lay.posicoes) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(lay.largura)
      expect(p.y).toBeLessThanOrEqual(lay.altura)
    }
    const lista = [...lay.posicoes.values()]
    for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) expect(lista[i]!.x !== lista[j]!.x || lista[i]!.y !== lista[j]!.y).toBe(true)
    for (const s of lay.segmentos) expect(s.x1 === s.x2 || s.y1 === s.y2, 'segmento não ortogonal').toBe(true)
  })
  it('cada filho recebe um traço vertical que termina acima dele', () => {
    for (const est of ESTRUTURAS) {
      const lay = layoutHeredograma(est)
      for (const p of est.pessoas) {
        if (!p.pais) continue
        const pos = lay.posicoes.get(p.id)!
        expect(lay.segmentos.some((s) => s.x1 === pos.x && s.x2 === pos.x && s.y2 < pos.y && s.y2 > pos.y - 30), `${est.nome}/${p.id}`).toBe(true)
      }
    }
  })
  it('ESTRUTURA_DOIS_RAMOS é válida para os testes acima', () => {
    expect(ESTRUTURA_DOIS_RAMOS.pessoas).toHaveLength(10)
  })
})
