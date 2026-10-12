import { GENOTIPOS_ABO, TIPOS_ABO, type TipoABO } from './calculo'
import { checarMulti, checarNum, NIVEIS, rngTeste as rng, SEMENTES, textoCerto } from '../comum/checagens'
import { BANCO_SANGUE, gerarCruzamentos, gerarHardy, gerarLigacao, gerarSangue, notacaoABO } from './geradores'
import { itemValido } from '../comum/auxiliares'

/* ------------------------------------------------------------------ cálculo independente de cruzamentos */

/** Todos os gametas (como listas de alelos, uma letra por gene), cada um com a mesma chance; independente do módulo de cálculo. */
function gametasLista(genotipo: string): string[] {
  let atual = ['']
  for (const par of genotipo.match(/../g) ?? []) atual = atual.flatMap((x) => [x + par[0], x + par[1]])
  return atual
}

/** Probabilidade de a prole satisfazer `filtro`, contando todos os pares de gametas. */
function probPorContagem(pai: string, mae: string, filtro: (alelos: string[][]) => boolean): number {
  const gp = gametasLista(pai)
  const gm = gametasLista(mae)
  let ok = 0
  for (const x of gp)
    for (const y of gm) {
      const genes: string[][] = []
      for (let i = 0; i < x.length; i++) genes.push([x[i]!, y[i]!])
      if (filtro(genes)) ok++
    }
  return (100 * ok) / (gp.length * gm.length)
}

const dominanteEm = (par: string[]) => par.some((a) => a === a.toUpperCase())
const recessivoEm = (par: string[]) => par.every((a) => a === a.toLowerCase())

describe('Cruzamentos', () => {
  it('estrutura: erros típicos válidos, resposta aceita e alternativas diferentes da certa', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarNum(gerarCruzamentos(rng(s, n), n), `cruzamentos ${n} ${s}`)
  })
  it('as respostas batem com a contagem direta dos pares de gametas', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarCruzamentos(rng(s, n), n)
        const d = inst.dados!
        const rot = `${n} ${s} ${d.variante}`
        if (d.variante === 'proporcao') {
          const c = d.classe as string
          const esperado = probPorContagem(d.pai!, d.mae!, (g) => (c === 'dominante' ? dominanteEm(g[0]!) : c === 'recessivo' ? recessivoEm(g[0]!) : [...g[0]!].sort().join('') === [...c].sort().join('')))
          expect(inst.resposta, rot).toBeCloseTo(esperado, 1)
        } else if (d.variante === 'gametas') {
          // conta os tipos diferentes de gametas, listando todos
          expect(inst.resposta, rot).toBe(new Set(gametasLista(d.pai!)).size)
        } else if (d.variante === 'incompleta') {
          expect([25, 50]).toContain(inst.resposta)
        } else if (d.variante === 'di') {
          const [f1, f2] = (d.classe as string).split(',')
          const esperado = probPorContagem(d.pai!, d.mae!, (g) => (f1 === 'dominante' ? dominanteEm(g[0]!) : recessivoEm(g[0]!)) && (f2 === 'dominante' ? dominanteEm(g[1]!) : recessivoEm(g[1]!)))
          expect(inst.resposta, rot).toBeCloseTo(esperado, 1)
        } else if (d.variante === 'tres') {
          const c = d.classe as string
          const esperado = probPorContagem(d.pai!, d.mae!, (g) => {
            const gen = (i: number) => g[i]!
            if (c === 'A_B_C_') return [0, 1, 2].every((i) => dominanteEm(gen(i)))
            if (c === 'aabbcc') return [0, 1, 2].every((i) => recessivoEm(gen(i)))
            if (c === 'A_bbC_') return dominanteEm(gen(0)) && recessivoEm(gen(1)) && dominanteEm(gen(2))
            return [0, 1, 2].every((i) => gen(i)[0] !== gen(i)[1])
          })
          expect(inst.resposta, rot).toBeCloseTo(esperado, 1)
        } else if (d.variante === 'filhos') {
          const cena = d.extra!.cena as number
          const pRec = probPorContagem('Aa', 'Aa', (g) => recessivoEm(g[0]!)) / 100
          expect(pRec).toBeCloseTo(0.25, 12)
          const esperado = [pRec * pRec, pRec * (1 - pRec), 2 * pRec * (1 - pRec)][cena] as number
          expect(inst.resposta, rot).toBeCloseTo(esperado * 100, 6)
        } else if (d.variante === 'condicional') {
          // entre os 4 resultados de Aa × Aa, descarta-se aa e conta-se
          const resultados = ['AA', 'Aa', 'aA', 'aa']
          const dominantes = resultados.filter((g) => g.includes('A'))
          const alvo = inst.enunciado.includes('heterozigoto') ? dominantes.filter((g) => g[0] !== g[1]).length : dominantes.filter((g) => g[0] === g[1]).length
          expect(inst.resposta, rot).toBeCloseTo((100 * alvo) / dominantes.length, 6)
        } else if (d.variante === 'letal') {
          // AA morre; entre os nascidos vivos conta-se Aa e aa
          const zigotos = ['AA', 'Aa', 'aA', 'aa']
          const vivos = zigotos.filter((g) => g !== 'AA')
          const alvo = d.extra!.alvo as number
          const esperado = alvo === 0 ? (100 * 1) / zigotos.length : alvo === 1 ? (100 * vivos.filter((g) => g.includes('A')).length) / vivos.length : (100 * vivos.filter((g) => g === 'aa').length) / vivos.length
          expect(inst.resposta, rot).toBeCloseTo(esperado, 6)
        } else {
          // poligenia: conta quantos dos 4^n pares de gametas têm k alelos "maiúsculos"
          const nGenes = d.extra!.n as number
          const alelos = 2 * nGenes
          let total = 0
          let alvoContagem = 0
          for (let mask = 0; mask < 2 ** alelos; mask++) {
            let k = 0
            for (let b = 0; b < alelos; b++) if (mask & (1 << b)) k++
            total++
            if ((d.extra!.alvo === 0 && k === 0) || (d.extra!.alvo === 1 && k === nGenes)) alvoContagem++
          }
          expect(inst.resposta, rot).toBeCloseTo((100 * alvoContagem) / total, 1)
        }
      }
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarCruzamentos(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['proporcao', 'gametas', 'incompleta']))
    expect(vs(2)).toEqual(new Set(['di', 'condicional', 'filhos']))
    expect(vs(3)).toEqual(new Set(['poligenia', 'letal', 'tres']))
  })
  it('o nome dos genótipos no enunciado confere com os dados (nada de "aaabb")', () => {
    for (const s of SEMENTES) {
      const inst = gerarCruzamentos(rng(s, 3), 3)
      expect(inst.enunciado).not.toContain('aaabb')
    }
  })
})

/* ------------------------------------------------------------------ sangue */

/** Aglutinogênios (A, B) de um genótipo ABO, a partir dos alelos (independente da tabela de tipos). */
const antigenosDe = (g: string) => ['A', 'B'].filter((x) => g.includes(x))
const tipoDe = (g: string): TipoABO => (antigenosDe(g).length === 2 ? 'AB' : antigenosDe(g).length === 1 ? (antigenosDe(g)[0] as TipoABO) : 'O')
const genotipos = (t: TipoABO) => ['AA', 'AO', 'BB', 'BO', 'AB', 'OO'].filter((g) => tipoDe(g) === t)
/** Tipos possíveis de um filho, listando todos os alelos que cada genitor pode passar. */
function filhosPossiveis(pai: TipoABO, mae: TipoABO): Set<TipoABO> {
  const s = new Set<TipoABO>()
  for (const gp of genotipos(pai)) for (const gm of genotipos(mae)) for (const a of gp) for (const b of gm) s.add(tipoDe(a + b))
  return s
}
const aglutina = (doador: { abo: TipoABO; rh: string }, receptor: { abo: TipoABO; rh: string }) => {
  const antigenos = doador.abo === 'AB' ? ['A', 'B'] : doador.abo === 'O' ? [] : [doador.abo]
  const anticorpos = receptor.abo === 'AB' ? [] : receptor.abo === 'O' ? ['A', 'B'] : receptor.abo === 'A' ? ['B'] : ['A']
  return antigenos.some((x) => anticorpos.includes(x)) || (doador.rh === '+' && receptor.rh === '−')
}
const lerTipo = (txt: string) => ({ abo: txt.replace(/[+−]/g, '') as TipoABO, rh: txt.endsWith('+') ? '+' : '−' })

describe('Grupos sanguíneos', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarSangue(rng(s, n), n), `sangue ${n} ${s}`)
  })
  it('tipos de pergunta por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarSangue(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['genotipos', 'universal', 'antigenos']))
    expect(tipos(2)).toEqual(new Set(['filhos', 'transfusao', 'rh']))
    expect(tipos(3)).toEqual(new Set(['paternidade', 'paisDeO', 'cenario']))
  })
  it('a alternativa certa confere com um cálculo independente (alelos por alelo)', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarSangue(rng(s, n), n)
        const d = inst.dados!
        const certo = textoCerto(inst)
        const outras = inst.opcoes.filter((o) => o.id !== inst.certa).map((o) => o.rotulo)
        const rot = `${d.tipo} ${n} ${s}`
        if (d.tipo === 'genotipos') {
          expect(certo, rot).toBe(genotipos(d.pai!).map(notacaoABO).join(' ou '))
          for (const o of outras) expect(o, rot).not.toBe(certo)
        } else if (d.tipo === 'universal') {
          const doador = inst.enunciado.includes('doador universal')
          const todos = TIPOS_ABO.flatMap((abo) => ['+', '−'].map((rh) => ({ abo, rh })))
          const t = lerTipo(certo)
          if (doador) expect(todos.every((r) => !aglutina(t, r)), rot).toBe(true)
          else expect(todos.every((dd) => !aglutina(dd, t)), rot).toBe(true)
          for (const o of outras) {
            const x = lerTipo(o)
            if (doador) expect(todos.every((r) => !aglutina(x, r)), `${rot}: ${o} também seria universal`).toBe(false)
            else expect(todos.every((dd) => !aglutina(dd, x)), `${rot}: ${o} também seria universal`).toBe(false)
          }
        } else if (d.tipo === 'antigenos') {
          expect(certo, rot).toBe(antigenosDe(d.pai === 'AB' ? 'AB' : d.pai === 'A' ? 'AA' : 'BB').join(' e '))
        } else if (d.tipo === 'filhos') {
          const possiveis = filhosPossiveis(d.pai!, d.mae!)
          expect(possiveis.has(certo as TipoABO), rot).toBe(false)
          for (const o of outras) expect(possiveis.has(o as TipoABO), `${rot}: ${o}`).toBe(true)
        } else if (d.tipo === 'transfusao') {
          const r = lerTipo(d.receptor!)
          expect(aglutina(lerTipo(certo), r), rot).toBe(false)
          for (const o of outras) expect(aglutina(lerTipo(o), r), `${rot}: ${o}`).toBe(true)
        } else if (d.tipo === 'rh') {
          expect(certo).toBe('Mãe Rh− e filho Rh+')
        } else if (d.tipo === 'paternidade') {
          const tipoHomem = (txt: string) => txt.replace('Homem do grupo ', '') as TipoABO
          expect(filhosPossiveis(tipoHomem(certo), d.mae!).has(d.filho!), rot).toBe(false)
          for (const o of outras) expect(filhosPossiveis(tipoHomem(o), d.mae!).has(d.filho!), `${rot}: ${o}`).toBe(true)
        } else if (d.tipo === 'paisDeO') {
          // os dois pais precisam ter o alelo O: ambos heterozigotos
          expect(certo.split(' e ').every((g) => g.endsWith('i')), rot).toBe(true)
          expect(certo.split(' e ').every((g) => g.length === 3 || g.length === 2), rot).toBe(true)
        }
      }
  })
  it('as alternativas erradas de "genótipos" nunca repetem os genótipos do tipo pedido', () => {
    for (const s of SEMENTES) {
      const inst = gerarSangue(rng(s, 1), 1)
      if (inst.dados!.tipo !== 'genotipos') continue
      const certo = textoCerto(inst)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(o.rotulo).not.toBe(certo)
    }
  })
  it('banco de perguntas escritas: estrutura válida e perguntas diferentes', () => {
    for (const { item } of BANCO_SANGUE) expect(itemValido(item), item.pergunta).toBe(true)
    expect(new Set(BANCO_SANGUE.map((x) => x.item.pergunta)).size).toBe(BANCO_SANGUE.length)
  })
  it('a notação das provas: AA → IᴬIᴬ, AO → Iᴬi, OO → ii', () => {
    expect(notacaoABO('AA')).toBe('IᴬIᴬ')
    expect(notacaoABO('AO')).toBe('Iᴬi')
    expect(notacaoABO('BO')).toBe('Iᴮi')
    expect(notacaoABO('AB')).toBe('IᴬIᴮ')
    expect(notacaoABO('OO')).toBe('ii')
    for (const t of TIPOS_ABO) expect(GENOTIPOS_ABO[t].map((g) => tipoDe(g))).toEqual(GENOTIPOS_ABO[t].map(() => t))
  })
})

/* ------------------------------------------------------------------ ligação ao sexo e ligação gênica */

describe('Herança ligada ao sexo e ligação gênica', () => {
  it('estrutura: erros típicos válidos e resposta aceita', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarNum(gerarLigacao(rng(s, n), n), `ligacao ${n} ${s}`, 2)
  })
  it('xr: confere com a contagem direta das 4 combinações de gametas', () => {
    // mãe portadora XA Xa × pai normal XA Y: filhos XAXA, XAXa, XAY, XaY
    const filhos = [
      { sexo: 'F', afetado: false },
      { sexo: 'F', afetado: false },
      { sexo: 'M', afetado: false },
      { sexo: 'M', afetado: true },
    ]
    const todos = (100 * filhos.filter((f) => f.afetado).length) / filhos.length
    const meninos = (100 * filhos.filter((f) => f.sexo === 'M' && f.afetado).length) / filhos.filter((f) => f.sexo === 'M').length
    const meninasPortadoras = (100 * 1) / filhos.length
    for (const s of SEMENTES) {
      const a = gerarLigacao(rng(s, 1), 1)
      if (a.dados!.variante === 'xr') {
        const cena = a.dados!.extra!.cena as number
        expect(a.resposta).toBe([meninos, todos, 100, 50][cena] as number)
      }
      const b = gerarLigacao(rng(s, 2), 2)
      const cena = b.dados!.extra!.cena as number
      if (b.dados!.variante === 'xrCondicional') expect(b.resposta).toBe([todos, meninos, meninasPortadoras][cena] as number)
      if (b.dados!.variante === 'xr') expect(b.resposta).toBe(50) // pai afetado × mãe portadora: metade das filhas afetadas
    }
  })
  it('distância: recombinantes ÷ total × 100, com os recombinantes sendo as duas classes menos numerosas', () => {
    let vistos = 0
    for (const s of SEMENTES) {
      const inst = gerarLigacao(rng(s, 3), 3)
      if (inst.dados!.variante !== 'distancia') continue
      const nums = [...inst.enunciado.matchAll(/(\d[\d.]*)\s(descendentes|A_B_|aabb|A_bb|aaB_)/g)].map((m) => Number((m[1] as string).replace(/\./g, '')))
      const [total, ab, ab2, r1, r2] = nums as [number, number, number, number, number]
      expect(ab + ab2 + r1 + r2, `soma das classes ${s}`).toBe(total)
      expect(Math.max(r1, r2)).toBeLessThan(Math.min(ab, ab2)) // recombinantes são os menos frequentes
      expect(inst.resposta).toBeCloseTo(((r1 + r2) / total) * 100, 6)
      vistos++
    }
    expect(vistos).toBeGreaterThan(10)
  })
  it('gameta: parentais (100−d)/2 e recombinantes d/2, em cis ou trans', () => {
    let vistos = 0
    for (const s of SEMENTES) {
      const inst = gerarLigacao(rng(s, 3), 3)
      if (inst.dados!.variante !== 'gameta') continue
      const cM = inst.dados!.extra!.cM as number
      const trans = inst.dados!.extra!.trans === 1
      const alvo = inst.enunciado.includes('é AB?') ? 'AB' : 'ab'
      // em cis, AB e ab são parentais; em trans, são recombinantes
      const esperado = trans ? cM / 2 : (100 - cM) / 2
      expect(inst.resposta, `${alvo} ${trans ? 'trans' : 'cis'} ${cM}`).toBeCloseTo(esperado, 6)
      vistos++
    }
    expect(vistos).toBeGreaterThan(10)
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarLigacao(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['xr']))
    expect(vs(2)).toEqual(new Set(['xr', 'xrCondicional']))
    expect(vs(3)).toEqual(new Set(['distancia', 'gameta']))
  })
})

/* ------------------------------------------------------------------ Hardy-Weinberg */

describe('Hardy-Weinberg', () => {
  it('estrutura: erros típicos válidos e resposta aceita', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarNum(gerarHardy(rng(s, n), n), `hardy ${n} ${s}`)
  })
  it('as respostas batem com as expressões de Hardy-Weinberg escritas por extenso', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarHardy(rng(s, n), n)
        const d = inst.dados!
        const q = d.extra!.q as number
        const p = 1 - q
        const rot = `${n} ${s} ${d.variante}`
        if (d.variante === 'q') expect(inst.resposta, rot).toBeCloseTo(q, 6)
        else if (d.variante === 'p') expect(inst.resposta, rot).toBeCloseTo(p, 6)
        else if (d.variante === 'heterozigotos') expect(inst.resposta, rot).toBeCloseTo(2 * p * q * 100, 1)
        else if (d.variante === 'portadoresNumero') expect(inst.resposta, rot).toBeCloseTo(Math.round(2 * p * q * (d.extra!.N as number)), 6)
        else if (d.variante === 'dominantes') expect(inst.resposta, rot).toBeCloseTo(q, 6)
        else if (d.variante === 'xMulheres') expect(inst.resposta, rot).toBeCloseTo(q * q * 100, 1)
        else expect(inst.resposta, rot).toBeCloseTo(2 * p * q * 100, 1)
      }
  })
  it('a porcentagem citada no enunciado corresponde à freq. do fenótipo recessivo (q²)', () => {
    for (const s of SEMENTES) {
      const inst = gerarHardy(rng(s, 1), 1)
      const m = inst.enunciado.match(/([\d,]+) % dos indivíduos/)
      const q = inst.dados!.extra!.q as number
      expect(Number((m![1] as string).replace(',', '.')), `semente ${s}`).toBeCloseTo(q * q * 100, 2)
    }
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarHardy(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['q', 'p']))
    expect(vs(2)).toEqual(new Set(['heterozigotos', 'portadoresNumero', 'dominantes']))
    expect(vs(3)).toEqual(new Set(['xMulheres', 'xPortadoras']))
  })
})
