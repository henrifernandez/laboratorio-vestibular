import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { classificar, somaPA, somaPG, somaPGInfinita, termoPA, termoPG, termosPA, termosPG, type Classificacao } from './calculo'

export const fmt = (n: number) => String(Math.round(n * 10000) / 10000).replace('.', ',')
const lista = (xs: number[]) => xs.map(fmt).join('; ')
const sub = (n: number) => n.toString().replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)] as string)

export type TipoSeq = 'PA' | 'PG'

export interface DadosSeq {
  tipo: TipoSeq | 'nenhuma'
  termos: number[]
  a1: number
  razao: number | null
  n?: number
}

/* ------------------------------------------------------------------ que sequência é essa */

interface Alegacao {
  tipo: TipoSeq | 'nenhuma'
  razao: number | null
}
const idAlegacao = (a: Alegacao) => (a.tipo === 'nenhuma' ? 'nenhuma' : `${a.tipo}:${a.razao}`)
const rotuloAlegacao = (a: Alegacao) => (a.tipo === 'nenhuma' ? 'Nem PA nem PG' : `${a.tipo} de razão ${fmt(a.razao as number)}`)

function verdadeira(c: Classificacao, a: Alegacao): boolean {
  if (a.tipo === 'nenhuma') return c.tipo === 'nenhuma'
  return c.tipo === a.tipo && Math.abs((c.razao as number) - (a.razao as number)) < 1e-9
}

function explicarAlegacao(termos: number[], c: Classificacao, a: Alegacao): string {
  const difs = termos.slice(1).map((x, k) => x - (termos[k] as number))
  const razoes = termos.slice(1).map((x, k) => (termos[k] === 0 ? NaN : x / (termos[k] as number)))
  const evidencia =
    c.tipo === 'PA'
      ? `As diferenças entre termos vizinhos são sempre ${fmt(c.razao as number)} (${lista(difs)}): é uma PA de razão ${fmt(c.razao as number)}.`
      : c.tipo === 'PG'
        ? `A razão entre termos vizinhos é sempre ${fmt(c.razao as number)} (${lista(razoes)}): é uma PG de razão ${fmt(c.razao as number)}.`
        : `As diferenças (${lista(difs)}) não são constantes e as razões (${lista(razoes)}) também não: não é PA nem PG.`
  if (verdadeira(c, a)) return `Isso! ${evidencia}`
  if (a.tipo === 'nenhuma') return `Há uma regra, sim. ${evidencia}`
  if (a.tipo === 'PA' && c.tipo === 'PG') return `Em uma PA somamos sempre o mesmo número. Aqui as diferenças são ${lista(difs)}, que não são constantes. ${evidencia}`
  if (a.tipo === 'PG' && c.tipo === 'PA') return `Em uma PG multiplicamos sempre pelo mesmo número. Aqui as razões são ${lista(razoes)}, que não são constantes. ${evidencia}`
  if (a.tipo === c.tipo) return `O tipo está certo, mas a razão não: a razão de uma ${c.tipo} é ${c.tipo === 'PA' ? 'a diferença' : 'o quociente'} entre termos vizinhos. ${evidencia}`
  return evidencia
}

export function gerarSequencia(rng: Rng, nivel: Nivel): InstanciaMulti<DadosSeq> {
  let verdade: Alegacao
  let termos: number[]
  const sorteio = rng()
  if (nivel === 1) {
    if (sorteio < 0.5) {
      const r = sortear(rng, 2, 6)
      termos = termosPA(sortear(rng, 1, 10), r, 4)
      verdade = { tipo: 'PA', razao: r }
    } else {
      const q = escolher(rng, [2, 3])
      termos = termosPG(escolher(rng, [1, 2, 3, 5]), q, 4)
      verdade = { tipo: 'PG', razao: q }
    }
  } else if (nivel === 2) {
    if (sorteio < 0.5) {
      const r = -sortear(rng, 2, 6)
      termos = termosPA(sortear(rng, 15, 30), r, 4)
      verdade = { tipo: 'PA', razao: r }
    } else {
      const q = escolher(rng, [0.5, 1 / 3])
      termos = termosPG(q === 0.5 ? escolher(rng, [16, 32, 48]) : escolher(rng, [27, 54, 81]), q, 4).map((x) => Math.round(x * 1e6) / 1e6)
      verdade = { tipo: 'PG', razao: q }
    }
  } else if (sorteio < 0.34) {
    const q = -escolher(rng, [2, 3])
    termos = termosPG(escolher(rng, [1, 2, 3]), q, 4)
    verdade = { tipo: 'PG', razao: q }
  } else if (sorteio < 0.67) {
    const r = escolher(rng, [0.5, 1.5, 2.5])
    termos = termosPA(sortear(rng, 1, 6), r, 4)
    verdade = { tipo: 'PA', razao: r }
  } else {
    const a = sortear(rng, 1, 4)
    termos = [a, a + 1, a + 3, a + 6] // diferenças 1, 2, 3
    verdade = { tipo: 'nenhuma', razao: null }
  }
  const c = classificar(termos)
  const razaoVerdade = verdade.razao
  // distratores
  const candidatos: Alegacao[] = []
  if (razaoVerdade !== null) {
    candidatos.push({ tipo: verdade.tipo === 'PA' ? 'PG' : 'PA', razao: razaoVerdade })
    candidatos.push({ tipo: verdade.tipo, razao: razaoVerdade + (verdade.tipo === 'PA' ? 1 : razaoVerdade > 0 ? 1 : -1) })
    candidatos.push({ tipo: 'nenhuma', razao: null })
    candidatos.push({ tipo: verdade.tipo === 'PA' ? 'PG' : 'PA', razao: (termos[1] as number) - (termos[0] as number) })
  } else {
    candidatos.push({ tipo: 'PA', razao: 1 }, { tipo: 'PG', razao: 2 }, { tipo: 'PA', razao: 2 }, { tipo: 'PG', razao: 1.5 })
  }
  const outras: Alegacao[] = []
  for (const x of candidatos) {
    if (!verdadeira(c, x) && !outras.some((o) => idAlegacao(o) === idAlegacao(x)) && x.razao !== 0) outras.push(x)
  }
  const alegacoes = embaralhar(rng, [verdade, ...outras.slice(0, 3)])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  for (const a of alegacoes) {
    porque[idAlegacao(a)] = explicarAlegacao(termos, c, a)
    if (!verdadeira(c, a)) motivo[idAlegacao(a)] = a.tipo === 'nenhuma' ? 'não viu a regra da sequência' : a.tipo !== c.tipo ? 'confundiu PA com PG' : 'razão errada'
  }
  return {
    enunciado: `Os primeiros termos de uma sequência são ${lista(termos)}. Que sequência é essa?`,
    opcoes: alegacoes.map((a) => ({ id: idAlegacao(a), rotulo: rotuloAlegacao(a) })),
    certa: idAlegacao(verdade),
    porque,
    motivo,
    resolucao: explicarAlegacao(termos, c, verdade),
    dicas: [
      'Compare termos vizinhos de duas formas: subtraindo e dividindo.',
      'Se a diferença é sempre a mesma, é PA. Se o quociente é sempre o mesmo, é PG.',
      `Diferenças: ${lista(termos.slice(1).map((x, k) => x - (termos[k] as number)))}. Quocientes: ${lista(termos.slice(1).map((x, k) => x / (termos[k] as number)))}.`,
    ],
    licao: 'PA: diferença constante entre termos vizinhos; PG: quociente constante',
    dados: { tipo: verdade.tipo, termos, a1: termos[0] as number, razao: verdade.razao },
  }
}

/* ------------------------------------------------------------------ preveja o termo */

export function gerarTermo(rng: Rng, nivel: Nivel): InstanciaNum<DadosSeq> {
  let tipo: TipoSeq
  let a1: number
  let razao: number
  let n: number
  if (nivel === 1) {
    tipo = 'PA'
    a1 = sortear(rng, 1, 12)
    razao = sortear(rng, 2, 7)
    n = sortear(rng, 10, 25)
  } else if (nivel === 2) {
    tipo = 'PG'
    a1 = escolher(rng, [1, 2, 3, 5])
    razao = escolher(rng, [2, 3])
    n = sortear(rng, 6, 8)
  } else if (rng() < 0.5) {
    tipo = 'PA'
    a1 = sortear(rng, 40, 90)
    razao = -sortear(rng, 3, 9)
    n = sortear(rng, 12, 20)
  } else {
    tipo = 'PG'
    razao = escolher(rng, [-2, 0.5, -3])
    n = razao === -3 ? sortear(rng, 5, 6) : sortear(rng, 6, 8)
    a1 = razao === 0.5 ? Math.pow(2, n - 1) * sortear(rng, 1, 3) : sortear(rng, 1, 3)
  }
  const termos = tipo === 'PA' ? termosPA(a1, razao, 4) : termosPG(a1, razao, 4)
  const resposta = tipo === 'PA' ? termoPA(a1, razao, n) : termoPG(a1, razao, n)
  const comN = tipo === 'PA' ? a1 + n * razao : a1 * Math.pow(razao, n)
  const formula = tipo === 'PA' ? `aₙ = a₁ + (n − 1)·r = ${fmt(a1)} + ${n - 1}·${fmt(razao)}` : `aₙ = a₁·q^(n−1) = ${fmt(a1)}·${fmt(razao)}^${n - 1}`
  return {
    enunciado: `Uma ${tipo} começa com ${lista(termos)}, ... Qual é o ${n}º termo?`,
    resposta,
    tolerancia: 0.001,
    erros: [
      {
        valor: comN,
        frase:
          tipo === 'PA'
            ? `Você usou n em vez de n − 1: do 1º ao ${n}º termo há ${n - 1} "passos" de razão ${fmt(razao)}, não ${n}.`
            : `Você usou o expoente n em vez de n − 1: do 1º ao ${n}º termo há ${n - 1} multiplicações pela razão ${fmt(razao)}.`,
        motivo: 'usou n no lugar de n − 1',
      },
    ],
    resolucao: `${formula} = ${fmt(resposta)}.`,
    dicas: [
      tipo === 'PA' ? 'Em uma PA cada termo é o anterior mais a razão.' : 'Em uma PG cada termo é o anterior vezes a razão.',
      tipo === 'PA' ? 'O termo geral é aₙ = a₁ + (n − 1)·r.' : 'O termo geral é aₙ = a₁·q^(n − 1).',
      `Primeiro ache a razão (${tipo === 'PA' ? fmt(razao) + ' = diferença' : fmt(razao) + ' = quociente'} entre termos vizinhos) e então use a₁ = ${fmt(a1)} e n = ${n}.`,
    ],
    licao: tipo === 'PA' ? 'aₙ = a₁ + (n − 1)r' : 'aₙ = a₁·q^(n − 1)',
    dados: { tipo, termos, a1, razao, n },
  }
}

/* ------------------------------------------------------------------ soma dos termos */

export function gerarSoma(rng: Rng, nivel: Nivel): InstanciaNum<DadosSeq> {
  if (nivel === 1) {
    const a1 = sortear(rng, 1, 10)
    const r = sortear(rng, 2, 6)
    const n = sortear(rng, 10, 40)
    const an = termoPA(a1, r, n)
    const soma = somaPA(a1, r, n)
    return {
      enunciado: `Qual é a soma dos ${n} primeiros termos da PA ${lista(termosPA(a1, r, 4))}, ...?`,
      resposta: soma,
      tolerancia: 0.001,
      erros: [{ valor: n * (a1 + an), frase: 'Você esqueceu de dividir por 2. A fórmula é Sₙ = n·(a₁ + aₙ)/2: somar a₁ + aₙ conta cada par de extremos duas vezes.', motivo: 'esqueceu de dividir por 2' }],
      resolucao: `a${sub(n)} = ${a1} + ${n - 1}·${r} = ${an}. S${sub(n)} = ${n}·(${a1} + ${an})/2 = ${fmt(soma)}.`,
      dicas: ['Some o primeiro com o último, o segundo com o penúltimo...: todos os pares dão o mesmo valor.', 'Sₙ = n·(a₁ + aₙ)/2.', `Antes, calcule a${sub(n)} = a₁ + (n − 1)·r.`],
      licao: 'Sₙ = n(a₁ + aₙ)/2 para uma PA',
      dados: { tipo: 'PA', termos: termosPA(a1, r, 4), a1, razao: r, n },
    }
  }
  if (nivel === 2) {
    const a1 = escolher(rng, [1, 2, 3, 5])
    const q = escolher(rng, [2, 3])
    const n = sortear(rng, 5, 8)
    const soma = somaPG(a1, q, n)
    return {
      enunciado: `Qual é a soma dos ${n} primeiros termos da PG ${lista(termosPG(a1, q, 4))}, ...?`,
      resposta: soma,
      tolerancia: 0.001,
      erros: [{ valor: (a1 * (Math.pow(q, n - 1) - 1)) / (q - 1), frase: `Você usou o expoente n − 1 na fórmula da soma. É Sₙ = a₁·(qⁿ − 1)/(q − 1), com o expoente n (a quantidade de termos).`, motivo: 'expoente errado na soma da PG' }],
      resolucao: `S${sub(n)} = ${a1}·(${q}^${n} − 1)/(${q} − 1) = ${a1}·${Math.pow(q, n) - 1}/${q - 1} = ${fmt(soma)}.`,
      dicas: ['Uma PG tem razão constante: some ou use a fórmula da soma.', 'Sₙ = a₁·(qⁿ − 1)/(q − 1).', `Aqui a₁ = ${a1}, q = ${q} e n = ${n}.`],
      licao: 'Sₙ = a₁(qⁿ − 1)/(q − 1) para uma PG',
      dados: { tipo: 'PG', termos: termosPG(a1, q, 4), a1, razao: q, n },
    }
  }
  const q = escolher(rng, [0.5, 1 / 3, 0.25])
  const a1 = q === 0.5 ? escolher(rng, [4, 6, 10]) : q === 0.25 ? escolher(rng, [12, 20, 36]) : escolher(rng, [6, 9, 12])
  const soma = somaPGInfinita(a1, q) as number
  return {
    enunciado: `Qual é a soma de todos os infinitos termos da PG ${lista(termosPG(a1, q, 4))}, ...?`,
    resposta: soma,
    tolerancia: 0.01,
    // com q = 1/2 o erro a₁/q coincide com a resposta certa: só entra quando é de fato diferente
    erros: [
      { valor: a1 / (1 + q), frase: 'Você usou 1 + q no denominador. Na soma infinita é S = a₁/(1 − q).', motivo: 'sinal errado no denominador' },
      { valor: a1 / q, frase: 'Você dividiu o primeiro termo pela razão. A soma infinita é a₁/(1 − q): o denominador é 1 menos a razão.', motivo: 'fórmula da soma infinita errada' },
    ].filter((e) => Math.abs(e.valor - soma) > 0.01),
    resolucao: `Como |q| = ${fmt(q)} < 1, a soma converge: S = a₁/(1 − q) = ${a1}/(1 − ${fmt(q)}) = ${fmt(soma)}.`,
    dicas: ['Cada termo é menor que o anterior: a soma não explode.', 'Quando |q| < 1, S = a₁/(1 − q).', `Aqui a₁ = ${a1} e q = ${fmt(q)}.`],
    licao: 'soma infinita de PG com |q| < 1: S = a₁/(1 − q)',
    dados: { tipo: 'PG', termos: termosPG(a1, q, 4), a1, razao: q },
  }
}
