import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { criarRng, escolher, sortear } from '@/lib/rng'

export interface TrechoVel {
  dur: number
  v: number
}

export interface InstanciaDesenho {
  semente: number
  nivel: Nivel
  /** duração total, em segundos (um ponto de controle por segundo) */
  T: number
  x0: number
  trechos: TrechoVel[]
  /** posição esperada em t = 0, 1, …, T */
  alvo: number[]
  /** comprimento da pista, em metros */
  xmax: number
}

export type RespostaDesenho = number[]

const TOL = 0.26
const f = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const sinal = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '')

function alvoDe(x0: number, trechos: TrechoVel[]): number[] {
  const saida = [x0]
  for (const t of trechos) for (let k = 0; k < t.dur; k++) saida.push((saida[saida.length - 1] as number) + t.v)
  return saida
}

function descreverTrecho(t: TrechoVel): string {
  return t.v === 0 ? `ficar parado por ${t.dur} s` : `andar com velocidade constante de ${sinal(t.v)}${f(Math.abs(t.v))} m/s por ${t.dur} s`
}

export const desenho = {
  id: 'fisica/cinematica/desenho',
  materia: 'fisica',
  tema: 'cinematica',
  titulo: 'Desenhe o movimento',

  gerar(semente: number, nivel: Nivel): InstanciaDesenho {
    const rng = criarRng(semente * 6700417 + nivel * 11)
    for (let tentativa = 0; tentativa < 300; tentativa++) {
      let x0: number
      let trechos: TrechoVel[]
      if (nivel === 1) {
        x0 = sortear(rng, 1, 8)
        trechos = [{ dur: 4, v: escolher(rng, [-1.5, -1, -0.5, 0.5, 1, 1.5, 2]) }]
      } else if (nivel === 2) {
        x0 = sortear(rng, 1, 7)
        trechos = [
          { dur: 2, v: escolher(rng, [-2, -1, 1, 2]) },
          { dur: 2, v: 0 },
          { dur: 2, v: escolher(rng, [-2, -1, 1, 2]) },
        ]
      } else {
        x0 = sortear(rng, 1, 6)
        const T = escolher(rng, [6, 7, 8])
        const d1 = sortear(rng, 2, 3)
        const d2 = sortear(rng, 2, 3)
        const d3 = T - d1 - d2
        if (d3 < 1) continue
        trechos = [
          { dur: d1, v: escolher(rng, [-2, -1.5, -1, 1, 1.5, 2]) },
          { dur: d2, v: escolher(rng, [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]) },
          { dur: d3, v: escolher(rng, [-2, -1.5, -1, -0.5, 0.5, 1, 1.5]) },
        ]
        if (Math.sign(trechos[0]!.v) === Math.sign(trechos[1]!.v) && rng() < 0.6) continue // prefere trocas de sentido
      }
      const alvo = alvoDe(x0, trechos)
      if (alvo.every((x) => x >= 0 && x <= 10)) {
        return { semente, nivel, T: alvo.length - 1, x0, trechos, alvo, xmax: 10 }
      }
    }
    throw new Error('não foi possível gerar uma instância válida')
  },

  /** pontos de controle no começo: tudo parado em 5 m */
  respostaInicial(i: InstanciaDesenho): RespostaDesenho {
    return Array(i.T + 1).fill(i.alvo[0] === 5 ? 4 : 5) as number[]
  },

  enunciado(i: InstanciaDesenho): string {
    return `Um carrinho parte da posição x = ${f(i.x0)} m e deve ${i.trechos.map(descreverTrecho).join('; depois ')}. Arraste os pontos do gráfico de posição (um por segundo) para desenhar esse movimento.`
  },

  corrigir(inst: InstanciaDesenho, resposta: RespostaDesenho): Correcao {
    const destaque = { alvo: inst.alvo, usuario: resposta }
    const certos = inst.alvo.filter((x, k) => Math.abs((resposta[k] ?? NaN) - x) <= TOL).length
    const parcial = certos / inst.alvo.length
    if (certos === inst.alvo.length) {
      return { correto: true, parcial: 1, feedback: 'Isso! Seu gráfico de posição produz exatamente esse movimento: cada trecho tem a velocidade certa.', destaque }
    }
    if (Math.abs((resposta[0] as number) - (inst.alvo[0] as number)) > TOL) {
      return {
        correto: false,
        parcial,
        feedback: `O carrinho deveria partir de x = ${f(inst.alvo[0] as number)} m, mas o seu gráfico parte de ${f(resposta[0] as number)} m.`,
        motivo: 'posição inicial errada',
        licao: 'o primeiro ponto do gráfico é a posição inicial',
        destaque,
      }
    }
    for (let i = 0; i < inst.T; i++) {
      const vAlvo = (inst.alvo[i + 1] as number) - (inst.alvo[i] as number)
      const vUser = (resposta[i + 1] as number) - (resposta[i] as number)
      if (Math.abs(vAlvo - vUser) <= TOL * 1.5) continue
      const trecho = `entre t = ${i} s e t = ${i + 1} s`
      let motivo: string
      let frase: string
      if (vAlvo !== 0 && Math.abs(vUser + vAlvo) <= TOL * 1.5) {
        motivo = 'sinal da velocidade trocado'
        frase = `Sinal trocado ${trecho}: a velocidade deveria ser ${sinal(vAlvo)}${f(Math.abs(vAlvo))} m/s (a posição ${vAlvo > 0 ? 'aumenta' : 'diminui'}), mas no seu gráfico ela ${vUser > 0 ? 'aumenta' : 'diminui'}.`
      } else if (vAlvo === 0) {
        motivo = 'andou quando devia ficar parado'
        frase = `O carrinho deveria ficar parado ${trecho} (velocidade zero, gráfico horizontal), mas no seu gráfico a velocidade é ${sinal(vUser)}${f(Math.abs(vUser))} m/s.`
      } else if (Math.abs(vUser) <= TOL * 1.5) {
        motivo = 'ficou parado quando devia andar'
        frase = `Seu carrinho fica parado ${trecho}, mas deveria andar a ${sinal(vAlvo)}${f(Math.abs(vAlvo))} m/s: a posição ${vAlvo > 0 ? 'aumenta' : 'diminui'} ${f(Math.abs(vAlvo))} m a cada segundo.`
      } else {
        motivo = 'velocidade errada em um trecho'
        frase = `A velocidade ${trecho} deveria ser ${sinal(vAlvo)}${f(Math.abs(vAlvo))} m/s (a posição varia ${f(Math.abs(vAlvo))} m por segundo), mas no seu gráfico é ${sinal(vUser)}${f(Math.abs(vUser))} m/s.`
      }
      return { correto: false, parcial, feedback: frase, motivo, licao: 'velocidade = inclinação do gráfico x(t) = variação da posição por segundo', destaque }
    }
    return { correto: false, parcial, feedback: 'Quase: as velocidades de cada trecho estão certas, mas a curva ainda está deslocada. Confira o ponto de partida.', motivo: 'curva deslocada', licao: 'o primeiro ponto do gráfico é a posição inicial', destaque }
  },

  dicas(i: InstanciaDesenho): string[] {
    return [
      'A velocidade é a inclinação do gráfico de posição: reta horizontal = parado; reta subindo = velocidade positiva; descendo = negativa.',
      'Com velocidade constante, a posição varia sempre o mesmo valor a cada segundo (v × 1 s).',
      `Comece em x = ${f(i.x0)} m e vá somando a velocidade de cada trecho: ${i.alvo.slice(0, 4).map(f).join(', ')}…`,
    ]
  },

  explicar(i: InstanciaDesenho): string {
    let t = 0
    const partes = i.trechos.map((tr) => {
      const de = t
      t += tr.dur
      return `de ${de} s a ${t} s: ${tr.v === 0 ? 'parado, a posição não muda' : `a posição varia ${sinal(tr.v)}${f(Math.abs(tr.v))} m por segundo`}`
    })
    return `Posições esperadas: ${i.alvo.map((x, k) => `t = ${k} s → ${f(x)} m`).join('; ')}. ${partes.join('; ')}.`
  },
} satisfies Desafio<InstanciaDesenho, RespostaDesenho> & {
  respostaInicial(i: InstanciaDesenho): RespostaDesenho
  enunciado(i: InstanciaDesenho): string
}
