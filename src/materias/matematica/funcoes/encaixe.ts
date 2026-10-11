import { criarRng, embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { avaliar, formulaTex, formulaTexto, type Funcao } from './modelo'

export interface LinhaTabela {
  x: number
  y: number
}

export interface InstanciaEncaixe {
  semente: number
  nivel: Nivel
  /** as 4 funções, na ordem em que as fórmulas aparecem */
  funcoes: Funcao[]
  /** tabelas[i] é a tabela da função i */
  tabelas: LinhaTabela[][]
  /** posição j na tela mostra o gráfico da função ordemGraficos[j] */
  ordemGraficos: number[]
  ordemTabelas: number[]
}

/** Para cada fórmula i: a posição do gráfico escolhido e da tabela escolhida (-1 = nenhum). */
export interface RespostaEncaixe {
  graficos: number[]
  tabelas: number[]
}

const LETRAS = ['A', 'B', 'C', 'D']
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

function afimAleatoria(rng: Rng): Funcao {
  let a = 0
  while (a === 0) a = escolher(rng, [-2, -1, -0.5, 0.5, 1, 2, 3])
  return { tipo: 'afim', a, b: sortear(rng, -3, 3) }
}
function quadraticaAleatoria(rng: Rng): Funcao {
  const a = escolher(rng, [-2, -1, -0.5, 0.5, 1, 2])
  const h = sortear(rng, -2, 2)
  const k = sortear(rng, -3, 3)
  return { tipo: 'quadratica', a, b: -2 * a * h, c: a * h * h + k }
}
function exponencialAleatoria(rng: Rng): Funcao {
  return {
    tipo: 'exponencial',
    a: escolher(rng, [1, 2, -1]),
    base: escolher(rng, [2, 3, 0.5]),
    k: sortear(rng, -2, 2),
  }
}
function logaritmicaAleatoria(rng: Rng): Funcao {
  return { tipo: 'logaritmica', a: escolher(rng, [1, 2, -1]), base: 2, k: sortear(rng, -2, 2) }
}

function sortearConjunto(rng: Rng, nivel: Nivel): Funcao[] {
  if (nivel === 1) return [0, 1, 2, 3].map(() => afimAleatoria(rng))
  if (nivel === 2) return [afimAleatoria(rng), afimAleatoria(rng), quadraticaAleatoria(rng), quadraticaAleatoria(rng)]
  return [afimAleatoria(rng), quadraticaAleatoria(rng), exponencialAleatoria(rng), logaritmicaAleatoria(rng)]
}

const assinatura = (f: Funcao) =>
  [-2, -1, 0, 1, 2, 4, 8].map((x) => {
    const y = avaliar(f, x)
    return Number.isFinite(y) ? y.toFixed(3) : 'n'
  }).join('|')

function tabelaDe(f: Funcao): LinhaTabela[] {
  const xs = f.tipo === 'logaritmica' ? [1, 2, 4, 8] : [-2, -1, 0, 1, 2]
  return xs.map((x) => ({ x, y: Math.round(avaliar(f, x) * 100) / 100 }))
}

/** Primeiro x (em -2..2 ou 1,2,4,8) em que as duas funções dão valores diferentes. */
function xDistintivo(a: Funcao, b: Funcao): number | null {
  for (const x of [0, 1, -1, 2, -2, 4, 8]) {
    const [ya, yb] = [avaliar(a, x), avaliar(b, x)]
    if (Number.isFinite(ya) && Number.isFinite(yb) && Math.abs(ya - yb) > 1e-6) return x
  }
  return null
}

const nomeFuncao = (i: number) => `f${i + 1}`

export const encaixe = {
  id: 'matematica/funcoes/encaixe',
  materia: 'matematica',
  tema: 'funcoes',
  titulo: 'Encaixe',

  gerar(semente: number, nivel: Nivel): InstanciaEncaixe {
    const rng = criarRng(semente * 1299709 + nivel * 13)
    for (let t = 0; t < 200; t++) {
      const funcoes = sortearConjunto(rng, nivel)
      if (new Set(funcoes.map(assinatura)).size !== 4) continue
      // exige que duas funções quaisquer difiram em pelo menos 3 pontos, para não confundir tabelas
      return {
        semente,
        nivel,
        funcoes,
        tabelas: funcoes.map(tabelaDe),
        ordemGraficos: embaralhar(rng, [0, 1, 2, 3]),
        ordemTabelas: embaralhar(rng, [0, 1, 2, 3]),
      }
    }
    throw new Error('não foi possível gerar uma instância válida')
  },

  corrigir(inst: InstanciaEncaixe, resp: RespostaEncaixe): Correcao {
    let acertos = 0
    const frases: string[] = []
    let motivo: string | undefined
    const detalhes: { grafico: boolean; tabela: boolean }[] = []

    inst.funcoes.forEach((f, i) => {
      const g = resp.graficos[i] ?? -1
      const m = resp.tabelas[i] ?? -1
      const funcG = g >= 0 ? inst.ordemGraficos[g] : undefined
      const funcT = m >= 0 ? inst.ordemTabelas[m] : undefined
      const okG = funcG === i
      const okT = funcT === i
      if (okG) acertos++
      if (okT) acertos++
      detalhes.push({ grafico: okG, tabela: okT })

      if (!okG) {
        motivo ??= 'gráfico ligado à fórmula errada'
        if (funcG === undefined) frases.push(`Falta escolher o gráfico de ${nomeFuncao(i)}.`)
        else {
          const x = xDistintivo(f, inst.funcoes[funcG] as Funcao)
          frases.push(
            x === null
              ? `O gráfico ${LETRAS[g]} não é o de ${nomeFuncao(i)}.`
              : `O gráfico ${LETRAS[g]} não é o de ${nomeFuncao(i)}: nele, f(${x}) = ${fmt(avaliar(inst.funcoes[funcG] as Funcao, x))}, mas ${nomeFuncao(i)}(${x}) = ${fmt(avaliar(f, x))}.`,
          )
        }
      }
      if (!okT) {
        motivo ??= 'tabela ligada à fórmula errada'
        if (funcT === undefined) frases.push(`Falta escolher a tabela de ${nomeFuncao(i)}.`)
        else {
          const linha = (inst.tabelas[funcT] as LinhaTabela[]).find((l) => {
            const y = avaliar(f, l.x)
            return !Number.isFinite(y) || Math.abs(y - l.y) > 0.011
          })
          frases.push(
            linha
              ? `A tabela ${funcT === undefined ? '' : inst.ordemTabelas.indexOf(funcT) + 1} não é a de ${nomeFuncao(i)}: ela diz que f(${linha.x}) = ${fmt(linha.y)}, mas a fórmula dá ${fmt(avaliar(f, linha.x))}.`
              : `A tabela escolhida não é a de ${nomeFuncao(i)}.`,
          )
        }
      }
    })

    const total = inst.funcoes.length * 2
    const parcial = acertos / total
    if (acertos === total) {
      return { correto: true, parcial: 1, feedback: 'Todos os trios estão certos: fórmula, gráfico e tabela dizem a mesma coisa.', destaque: { detalhes } }
    }
    return {
      correto: false,
      parcial,
      feedback: frases.slice(0, 3).join(' '),
      motivo,
      licao: 'teste um ponto: substitua x na fórmula e confira no gráfico e na tabela',
      destaque: { detalhes },
    }
  },

  dicas(inst: InstanciaEncaixe): string[] {
    return [
      'Comece pelo que é fácil de reconhecer: o formato do gráfico dá o tipo da função.',
      'Use f(0): ele aparece na tabela e é onde o gráfico corta o eixo y.',
      `Calcule ${nomeFuncao(0)}(0) e ${nomeFuncao(0)}(1) pela fórmula (${formulaTexto(inst.funcoes[0] as Funcao).replace(/\*/g, '·')}) e procure esses pontos.`,
    ]
  },

  explicar(inst: InstanciaEncaixe): string {
    return inst.funcoes
      .map((f, i) => {
        const x = f.tipo === 'logaritmica' ? 2 : 1
        return `${nomeFuncao(i)} (${formulaTexto(f).replace(/\*/g, '·')}): gráfico ${LETRAS[inst.ordemGraficos.indexOf(i)]}, tabela ${inst.ordemTabelas.indexOf(i) + 1}; em x = ${x} vale ${fmt(avaliar(f, x))}.`
      })
      .join(' ')
  },
} satisfies Desafio<InstanciaEncaixe, RespostaEncaixe>

export { formulaTex }
export const LETRAS_GRAFICO = LETRAS
