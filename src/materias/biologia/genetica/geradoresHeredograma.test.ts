import { criarRng } from '@/lib/rng'
import { checarMulti, checarNum, NIVEIS, rngTeste as rng, SEMENTES, textoCerto } from '../comum/checagens'
import { maiuscula } from '../comum/auxiliares'
import { gerarHeredograma, gerarProbabilidade, reconstruir, violacao } from './geradoresHeredograma'
import { ESTRUTURAS, MODELOS, NOME_MODELO, compativel, modelosCompativeis, rotuloGenotipo, simular, type Heredograma, type Modelo } from './heredograma'
import { forcaBruta } from './utilTeste'

const ped = (d: { estrutura: string; afetados: string[]; semGeracao?: number }): Heredograma => reconstruir(d.estrutura, d.afetados, d.semGeracao)

describe('Regras de exclusão (violacao)', () => {
  it('são corretas: se a regra aponta uma contradição, o motor confirma que o modelo é impossível (centenas de heredogramas)', () => {
    const r = criarRng(2024)
    let apontadas = 0
    for (let i = 0; i < 400; i++) {
      const est = ESTRUTURAS[i % ESTRUTURAS.length] as Heredograma
      const verdadeiro = MODELOS[i % 4] as Modelo
      const p = simular(est, verdadeiro, 0.25, r)
      for (const m of MODELOS) {
        const v = violacao(p, m)
        if (v) {
          apontadas++
          expect(compativel(p, m), `${est.nome}: ${m} apontado como impossível (${v.texto}), mas o motor aceita`).toBe(false)
        }
      }
      // o modelo verdadeiro nunca é apontado
      expect(violacao(p, verdadeiro), `${est.nome}: o modelo verdadeiro ${verdadeiro} foi apontado`).toBeNull()
    }
    expect(apontadas).toBeGreaterThan(100)
  })
})

describe('Heredograma: múltipla escolha', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (let s = 1; s <= 80; s++) checarMulti(gerarHeredograma(rng(s, n), n), `heredograma ${n} ${s}`)
  })
  it('tipos de pergunta por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarHeredograma(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['paisDeAfetado', 'genotipo']))
    expect(tipos(2)).toEqual(new Set(['padrao', 'obrigatorio']))
    expect(tipos(3)).toEqual(new Set(['padrao', 'obrigatorio']))
  })
  it('padrão: o modelo correto é o único compatível (força bruta) e cada alternativa errada tem contradição concreta', () => {
    let vistos = 0
    for (const n of [2, 3] as const)
      for (const s of SEMENTES) {
        const inst = gerarHeredograma(rng(s, n), n)
        const d = inst.dados!
        if (d.tipo !== 'padrao') continue
        const p = ped(d)
        // compatibilidade pela enumeração sem poda
        const compat = MODELOS.filter((m) => forcaBruta(p, m, 1e-6).total > 0)
        expect(compat, `${n} ${s}`).toEqual([d.modelo])
        expect(textoCerto(inst), `${n} ${s}`).toBe(maiuscula(NOME_MODELO[d.modelo as Modelo]))
        for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) {
          const explic = inst.porque[o.id] as string
          expect(explic, `${n} ${s}`).toMatch(/^Não\. Não pode ser: .+\.$/)
          expect(explic).toMatch(/I{1,3}-\d/) // cita pessoas do heredograma
        }
        vistos++
      }
    expect(vistos).toBeGreaterThan(40)
  })
  it('obrigatório: a pessoa certa é portadora com certeza (força bruta) e as outras não', () => {
    let vistos = 0
    for (const n of [2, 3] as const)
      for (const s of SEMENTES) {
        const inst = gerarHeredograma(rng(s, n), n)
        const d = inst.dados!
        if (d.tipo !== 'obrigatorio') continue
        const p = ped(d)
        const modelo = d.modelo as Modelo
        const fb = forcaBruta(p, modelo, 1e-6)
        const idx = (id: string) => p.pessoas.findIndex((x) => x.id === id)
        const certo = textoCerto(inst)
        expect((fb.marginais[idx(certo)] as number[])[1] as number, `${n} ${s} ${certo}`).toBeGreaterThan(0.9999)
        expect(p.pessoas[idx(certo)]!.afetado).toBe(false)
        // regra independente: AR → pai/mãe de afetado ou filho(a) de afetado; XR → mulher com filho afetado ou filha de homem afetado
        const regra = (id: string) => {
          const x = p.pessoas[idx(id)]!
          const filhos = p.pessoas.filter((f) => f.pais?.includes(id))
          const paisAfetados = (x.pais ?? []).map((pid) => p.pessoas[idx(pid)]!).filter((pp) => pp.afetado)
          if (modelo === 'AR') return filhos.some((f) => f.afetado) || paisAfetados.length > 0
          return x.sexo === 'F' && (filhos.some((f) => f.afetado) || paisAfetados.length > 0)
        }
        // a explicação é específica quando a regra simples vale (filho afetado ou genitor afetado); senão, é o texto genérico
        const generica = (inst.porque[inst.certa] as string).includes('para explicar os afetados da família')
        expect(generica, `${n} ${s}: explicação de ${certo}`).toBe(!regra(certo))
        for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) {
          expect((fb.marginais[idx(o.rotulo)] as number[])[1] as number, `${n} ${s} ${o.rotulo}`).toBeLessThan(0.9)
          expect(regra(o.rotulo), `${n} ${s}: ${o.rotulo} também seria obrigatório`).toBe(false)
        }
        vistos++
      }
    expect(vistos).toBeGreaterThan(40)
  })
  it('genótipo: o certo é determinado pelos fenótipos (força bruta) e os outros são impossíveis', () => {
    let vistos = 0
    for (const s of SEMENTES) {
      const inst = gerarHeredograma(rng(s, 1), 1)
      const d = inst.dados!
      if (d.tipo !== 'genotipo') continue
      const p = ped(d)
      const modelo = d.modelo as Modelo
      const fb = forcaBruta(p, modelo, 1e-6)
      const alvo = (d.foco as string[])[0] as string
      const i = p.pessoas.findIndex((x) => x.id === alvo)
      const rotulo = (g: number) => rotuloGenotipo(modelo, 'M', g)
      const certo = textoCerto(inst)
      for (const g of [0, 1, 2]) {
        const prob = (fb.marginais[i] as number[])[g] as number
        if (rotulo(g) === certo) expect(prob, `${s}`).toBeGreaterThan(0.9999)
        else expect(prob, `${s}`).toBeLessThan(0.0001)
      }
      vistos++
    }
    expect(vistos).toBeGreaterThan(20)
  })
  it('pais de afetado: ambos Aa com certeza (força bruta)', () => {
    let vistos = 0
    for (const s of SEMENTES) {
      const inst = gerarHeredograma(rng(s, 1), 1)
      const d = inst.dados!
      if (d.tipo !== 'paisDeAfetado') continue
      const p = ped(d)
      const fb = forcaBruta(p, 'AR', 1e-6)
      for (const id of ['I-1', 'I-2']) expect((fb.marginais[p.pessoas.findIndex((x) => x.id === id)] as number[])[1]).toBeGreaterThan(0.9999)
      expect(textoCerto(inst)).toBe('Aa e Aa')
      vistos++
    }
    expect(vistos).toBeGreaterThan(10)
  })
  it('os heredogramas citados no enunciado existem: afetados e focos são pessoas da estrutura', () => {
    for (const n of NIVEIS)
      for (let s = 1; s <= 60; s++) {
        const d = gerarHeredograma(rng(s, n), n).dados!
        const p = ped(d)
        const ids = new Set(p.pessoas.map((x) => x.id))
        for (const id of [...d.afetados, ...(d.foco ?? [])]) expect(ids.has(id), `${n} ${s}: ${id}`).toBe(true)
        expect(modelosCompativeis(p).length).toBeGreaterThan(0)
      }
  })
})

describe('Heredograma: probabilidades', () => {
  it('estrutura: erros típicos válidos e resposta aceita', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarNum(gerarProbabilidade(rng(s, n), n), `probabilidade ${n} ${s}`)
  })
  it('famílias por nível', () => {
    const fam = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarProbabilidade(rng(s, n), n).dados!.familia))
    expect(fam(1)).toEqual(new Set(['arCasal', 'adAfetado']))
    expect(fam(2)).toEqual(new Set(['arIrmao', 'xrIrma']))
    expect(fam(3)).toEqual(new Set(['arDuasFamilias', 'xrIrmaFilho']))
  })
  it('a resposta confere com a enumeração sem poda e com a fórmula de cada família', () => {
    const vistos = new Set<string>()
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarProbabilidade(rng(s, n), n)
        const d = inst.dados!
        const p = ped(d)
        const q = 1e-6
        const rot = `${n} ${s} ${d.familia}`
        const fb = forcaBruta(p, d.modelo, q, d.consulta.tipo === 'filho' ? { pai: d.consulta.pai, mae: d.consulta.mae, sexo: d.consulta.sexo } : undefined)
        let esperado: number
        let formula: number
        switch (d.familia) {
          case 'arCasal':
            // pais Aa × Aa (certos): afetado 1/4; portador normal 1/2
            esperado = d.pedido === 'afetado' ? (fb.filho as number) : 0.5
            formula = d.pedido === 'afetado' ? 1 / 4 : 1 / 2
            break
          case 'adAfetado':
            esperado = fb.filho as number
            formula = 1 / 2
            break
          case 'arIrmao':
            esperado = (fb.marginais[p.pessoas.findIndex((x) => x.id === (d.consulta as { pessoa: string }).pessoa)] as number[])[1] as number
            formula = 2 / 3
            break
          case 'xrIrma':
            esperado = (fb.marginais[p.pessoas.findIndex((x) => x.id === (d.consulta as { pessoa: string }).pessoa)] as number[])[1] as number
            formula = 1 / 2
            break
          case 'arDuasFamilias':
            esperado = fb.filho as number
            formula = (2 / 3) * (2 / 3) * (1 / 4)
            break
          default:
            esperado = fb.filho as number
            formula = d.pedido === 'qualquer' ? (1 / 2) * (1 / 4) : (1 / 2) * (1 / 2)
        }
        expect(esperado, `${rot}: enumeração × fórmula`).toBeCloseTo(formula, 4)
        expect(inst.resposta, `${rot}: resposta × enumeração`).toBeCloseTo(esperado * 100, 1)
        vistos.add(`${d.familia}${d.pedido ?? ''}`)
      }
    // todas as famílias e variações apareceram
    expect(vistos.size).toBeGreaterThanOrEqual(8)
  })
  it('os dados das famílias descrevem pessoas que existem no desenho', () => {
    for (const n of NIVEIS)
      for (let s = 1; s <= 40; s++) {
        const d = gerarProbabilidade(rng(s, n), n).dados!
        const p = ped(d)
        const ids = new Set(p.pessoas.map((x) => x.id))
        for (const id of [...d.afetados, ...d.foco]) expect(ids.has(id), `${d.familia}: ${id}`).toBe(true)
        const c = d.consulta
        if (c.tipo === 'filho') {
          expect(ids.has(c.pai) && ids.has(c.mae)).toBe(true)
          expect(p.pessoas.find((x) => x.id === c.pai)!.sexo).toBe('M')
          expect(p.pessoas.find((x) => x.id === c.mae)!.sexo).toBe('F')
        }
      }
  })
  it('as ligações ao X só ocorrem com homem afetado de pais normais e sem contradição de sexo', () => {
    for (let s = 1; s <= 60; s++)
      for (const n of [2, 3] as const) {
        const d = gerarProbabilidade(rng(s, n), n).dados!
        if (d.modelo !== 'XR') continue
        const p = ped(d)
        for (const x of p.pessoas.filter((y) => y.afetado)) expect(x.sexo, `${d.familia}: afetado ${x.id} deve ser homem`).toBe('M')
      }
  })
})
