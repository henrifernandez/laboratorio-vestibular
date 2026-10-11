import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { criarRng } from '@/lib/rng'
import { listarArranjos, listarCombinacoes } from './calculo'
import { gerarClassificar, gerarContar, gerarFrequencia, gerarProbabilidade, sortearProblema } from './geradores'

const NIVEIS: Nivel[] = [1, 2, 3]
const rodar = (f: (rng: () => number, n: Nivel, s: number) => void, ate = 150) => {
  for (let s = 1; s <= ate; s++) for (const n of NIVEIS) f(criarRng(s * 7919 + n), n, s)
}
const letras = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i))

/** anagramas distintos por força bruta (palavras curtas) */
function anagramasForcaBruta(p: string): number {
  const vistos = new Set<string>()
  const rec = (resto: string, atual: string) => {
    if (!resto) return void vistos.add(atual)
    for (let i = 0; i < resto.length; i++) rec(resto.slice(0, i) + resto.slice(i + 1), atual + resto[i])
  }
  rec(p, '')
  return vistos.size
}

describe('problemas de contagem — respostas conferidas por enumeração', () => {
  it('cada modelo de problema tem a resposta igual à contagem por força bruta', () => {
    const verificados = new Set<string>()
    rodar((rng, n) => {
      const p = sortearProblema(rng, n)
      const t = p.texto
      let m: RegExpMatchArray | null
      if ((m = t.match(/(\d+) tipos de pão, (\d+) de recheio e (\d+) de molho/))) {
        expect(p.resposta).toBe(Number(m[1]) * Number(m[2]) * Number(m[3]))
        verificados.add('pfc')
      } else if ((m = t.match(/(\d+) camisetas, (\d+) calças e (\d+) pares/))) {
        expect(p.resposta).toBe(Number(m[1]) * Number(m[2]) * Number(m[3]))
        verificados.add('roupas')
      } else if ((m = t.match(/De quantas formas (\d+) pessoas podem se sentar/))) {
        expect(p.resposta).toBe(listarArranjos(letras(Number(m[1])), Number(m[1])).length)
        verificados.add('permutacao')
      } else if ((m = t.match(/(\d+) atletas disputam/))) {
        expect(p.resposta).toBe(listarArranjos(letras(Number(m[1])), 3).length)
        verificados.add('podio')
      } else if (t.includes('senhas de 4 algarismos distintos')) {
        expect(p.resposta).toBe(listarArranjos(letras(10), 4).length)
        verificados.add('senha')
      } else if ((m = t.match(/grupo de (\d+) alunos, quantas comissões de (\d+)/))) {
        expect(p.resposta).toBe(listarCombinacoes(letras(Number(m[1])), Number(m[2])).length)
        verificados.add('comissao')
      } else if ((m = t.match(/Pedro tem (\d+) livros e quer levar (\d+)/))) {
        expect(p.resposta).toBe(listarCombinacoes(letras(Number(m[1])), Number(m[2])).length)
        verificados.add('livros')
      } else if ((m = t.match(/palavra ([A-Z]+)\?/))) {
        if (m[1]!.length <= 8) expect(p.resposta).toBe(anagramasForcaBruta(m[1]!))
        verificados.add('anagramas')
      } else if ((m = t.match(/(\d+) meninos e (\d+) meninas/))) {
        const h = Number(m[1])
        const mm = Number(m[2])
        const pares = listarCombinacoes(letras(h), 2).length * mm
        expect(p.resposta).toBe(pares)
        verificados.add('composto')
      } else if ((m = t.match(/(\d+) pessoas disputam (\d+) cadeiras/))) {
        expect(p.resposta).toBe(listarArranjos(letras(Number(m[1])), Number(m[2])).length)
        verificados.add('cadeiras')
      } else {
        throw new Error(`modelo sem verificação: ${t}`)
      }
    })
    expect([...verificados].sort()).toEqual(['anagramas', 'cadeiras', 'comissao', 'composto', 'livros', 'permutacao', 'pfc', 'podio', 'roupas', 'senha'])
  })

  it('erros típicos nunca coincidem com a resposta certa', () => {
    rodar((rng, n) => {
      const i = gerarContar(rng, n)
      for (const e of i.erros) expect(e.valor).not.toBe(i.resposta)
      expect(corrigirNum(i, String(i.resposta)).correto).toBe(true)
      for (const e of i.erros) expect(corrigirNum(i, String(e.valor)).feedback).toBe(e.frase)
    })
  })
})

describe('gerarClassificar', () => {
  it('uma só resposta certa e explicação para cada opção', () => {
    rodar((rng, n) => {
      const i = gerarClassificar(rng, n)
      expect(i.opcoes.map((o) => o.id)).toContain(i.certa)
      expect(i.opcoes.length).toBe(n === 3 ? 5 : 4)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
  it('a classificação é coerente com o tipo do problema', () => {
    rodar((rng, n) => {
      const i = gerarClassificar(rng, n)
      const p = i.dados!.problema
      expect(i.certa).toBe(p.composto ? 'pfc' : p.tipo)
    })
  })
})

describe('gerarProbabilidade — respostas conferidas por enumeração', () => {
  it('cada modelo bate com a contagem de casos', () => {
    const vistos = new Set<string>()
    rodar((rng, n) => {
      const i = gerarProbabilidade(rng, n)
      const t = i.enunciado
      let m: RegExpMatchArray | null
      let esperado: number
      if ((m = t.match(/maior ou igual a (\d)/))) {
        const k = Number(m[1])
        esperado = [1, 2, 3, 4, 5, 6].filter((x) => x >= k).length / 6
        vistos.add('dado')
      } else if ((m = t.match(/lançada (\d) vezes\. Qual é a probabilidade de sair cara em todos/))) {
        const k = Number(m[1])
        esperado = 1 / 2 ** k
        vistos.add('moeda')
      } else if ((m = t.match(/(\d+) bolas vermelhas, (\d+) azuis e (\d+) verdes/))) {
        const [v, a, g] = [Number(m[1]), Number(m[2]), Number(m[3])]
        esperado = v / (v + a + g)
        vistos.add('urna')
      } else if ((m = t.match(/(\d+) bolas vermelhas e (\d+) azuis\. Duas bolas/))) {
        const r = Number(m[1])
        const b = Number(m[2])
        const bolas = [...Array(r).fill('v'), ...Array(b).fill('a')]
        let fav = 0
        let tot = 0
        for (let x = 0; x < bolas.length; x++) for (let y = 0; y < bolas.length; y++) if (x !== y) { tot++; if (bolas[x] === 'v' && bolas[y] === 'v') fav++ }
        esperado = fav / tot
        vistos.add('sem-reposicao')
      } else if ((m = t.match(/soma dos resultados ser (\d)/))) {
        const s = Number(m[1])
        let fav = 0
        for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) if (x + y === s) fav++
        esperado = fav / 36
        vistos.add('soma')
      } else if ((m = t.match(/lançada (\d) vezes\. Qual é a probabilidade de sair pelo menos uma cara/))) {
        const k = Number(m[1])
        let fav = 0
        for (let mask = 0; mask < 2 ** k; mask++) if (mask !== 0) fav++
        esperado = fav / 2 ** k
        vistos.add('pelo-menos-cara')
      } else if (t.includes('lançado 2 vezes. Qual é a probabilidade de sair pelo menos um 6')) {
        let fav = 0
        for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) if (x === 6 || y === 6) fav++
        esperado = fav / 36
        vistos.add('pelo-menos-seis')
      } else throw new Error(`modelo sem verificação: ${t}`)
      expect(i.resposta).toBeCloseTo(esperado, 3)
      expect(corrigirNum(i, '1/' + '1').correto).toBe(Math.abs(1 - i.resposta) <= i.tolerancia)
      expect(corrigirNum(i, String(esperado)).correto).toBe(true)
      for (const e of i.erros) expect(Math.abs(e.valor - i.resposta)).toBeGreaterThan(i.tolerancia)
    })
    expect([...vistos].sort()).toEqual(['dado', 'moeda', 'pelo-menos-cara', 'pelo-menos-seis', 'soma', 'sem-reposicao', 'urna'].sort())
  })
  it('aceita a resposta em fração', () => {
    rodar((rng, n) => {
      const i = gerarProbabilidade(rng, n)
      const den = 36 * 8 * 7 * 5 // denominador comum conveniente
      const num = Math.round(i.resposta * den)
      if (Math.abs(num / den - i.resposta) < 0.0006) expect(corrigirNum(i, `${num}/${den}`).correto).toBe(true)
    }, 40)
  })
})

describe('gerarFrequencia', () => {
  it('conceitos: uma única opção certa e todas explicadas', () => {
    rodar((rng, n) => {
      const i = gerarFrequencia(rng, n)
      expect(i.opcoes).toHaveLength(4)
      for (const o of i.opcoes) {
        expect(i.porque[o.id]).toBeTruthy()
        expect(corrigirMulti(i, o.id).correto).toBe(o.id === i.certa)
      }
    })
  })
})
