import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { criarRng, escolher, sortear } from '@/lib/rng'
import { equivalentes } from '../funcoes/expressao'
import { classificar, termoPA, termoPG, termosPA, termosPG } from './calculo'
import { fmt } from './geradores'

export interface InstanciaTermoGeral {
  semente: number
  nivel: Nivel
  tipo: 'PA' | 'PG'
  a1: number
  razao: number
  termos: number[]
}

const alvoDe = (i: InstanciaTermoGeral) => (n: number) => (i.tipo === 'PA' ? termoPA(i.a1, i.razao, n) : termoPG(i.a1, i.razao, n))
const sub = (n: number) => '₀₁₂₃₄₅₆₇₈₉'[n] as string

export const termoGeral = {
  id: 'matematica/pa-pg/termo-geral',
  materia: 'matematica',
  tema: 'pa-pg',
  titulo: 'Escreva o termo geral',

  gerar(semente: number, nivel: Nivel): InstanciaTermoGeral {
    const rng = criarRng(semente * 3266489917 + nivel * 17)
    let tipo: 'PA' | 'PG'
    let a1: number
    let razao: number
    if (nivel === 1) {
      tipo = 'PA'
      a1 = sortear(rng, 1, 10)
      razao = sortear(rng, 2, 6)
    } else if (nivel === 2) {
      tipo = 'PG'
      a1 = escolher(rng, [1, 2, 3, 5])
      razao = escolher(rng, [2, 3])
    } else if (rng() < 0.5) {
      tipo = 'PA'
      a1 = sortear(rng, 10, 30)
      razao = -sortear(rng, 2, 5)
    } else {
      tipo = 'PG'
      razao = escolher(rng, [0.5, -2])
      a1 = razao === 0.5 ? escolher(rng, [16, 32, 48]) : escolher(rng, [1, 2, 3])
    }
    const termos = tipo === 'PA' ? termosPA(a1, razao, 4) : termosPG(a1, razao, 4)
    return { semente, nivel, tipo, a1, razao, termos }
  },

  respostaCanonica(i: InstanciaTermoGeral): string {
    return i.tipo === 'PA' ? `${i.a1} + (n-1)*${i.razao}` : `${i.a1}*(${i.razao})^(n-1)`
  },

  corrigir(inst: InstanciaTermoGeral, resposta: string): Correcao {
    const alvo = alvoDe(inst)
    const eq = equivalentes(resposta, alvo, { min: 1, max: 12 }, 24, 'n')
    if (eq.erro || !eq.fn) {
      return {
        correto: false,
        feedback: `${eq.erro ?? 'Não consegui entender a fórmula.'} Escreva usando n, por exemplo 5 + (n-1)*3 ou 3*2^(n-1).`,
        motivo: 'fórmula mal escrita',
        licao: 'escreva aₙ usando n, ^ para potência e * para multiplicar',
      }
    }
    if (eq.ok) return { correto: true, parcial: 1, feedback: 'Isso! Sua fórmula gera todos os termos da sequência.' }

    const f = eq.fn
    const deslocada = [1, 2, 3, 4, 5, 6, 7, 8].every((n) => Math.abs(f(n) - alvo(n + 1)) < 1e-6)
    if (deslocada) {
      return {
        correto: false,
        parcial: 0.7,
        feedback: `Sua fórmula dá a₁ = ${fmt(f(1))}, que é na verdade o 2º termo. O erro típico é usar n no lugar de n − 1: o 1º termo (n = 1) não recebe nenhum "passo" da razão.`,
        motivo: 'índice deslocado (n no lugar de n − 1)',
        licao: 'a₁ é o ponto de partida: aₙ = a₁ + (n − 1)r ou a₁·q^(n − 1)',
      }
    }
    const meus = [1, 2, 3, 4].map((n) => f(n))
    const cl = classificar(meus)
    if (inst.tipo === 'PG' && cl.tipo === 'PA') {
      return {
        correto: false,
        parcial: 0.2,
        feedback: `Sua fórmula descreve uma PA (soma sempre o mesmo número), mas esta sequência é uma PG: ${inst.termos.map(fmt).join('; ')} tem quociente constante ${fmt(inst.razao)}.`,
        motivo: 'confundiu PA com PG',
        licao: 'PG: aₙ = a₁·q^(n − 1) (multiplica); PA: aₙ = a₁ + (n − 1)r (soma)',
      }
    }
    if (inst.tipo === 'PA' && cl.tipo === 'PG') {
      return {
        correto: false,
        parcial: 0.2,
        feedback: `Sua fórmula descreve uma PG, mas esta sequência é uma PA: a diferença entre termos vizinhos é sempre ${fmt(inst.razao)}.`,
        motivo: 'confundiu PA com PG',
        licao: 'PA: aₙ = a₁ + (n − 1)r',
      }
    }
    const n = [1, 2, 3, 4].find((k) => Math.abs(f(k) - alvo(k)) > 1e-6) as number
    const acertos = [1, 2, 3, 4].filter((k) => Math.abs(f(k) - alvo(k)) <= 1e-6).length
    return {
      correto: false,
      parcial: acertos / 4,
      feedback: `Sua fórmula dá a${sub(n)} = ${fmt(f(n))}, mas a${sub(n)} = ${fmt(alvo(n))}. Teste sua fórmula nos primeiros termos antes de enviar.`,
      motivo: `fórmula erra o termo a${sub(n)}`,
      licao: 'substitua n = 1, 2, 3 na fórmula e compare com a sequência',
    }
  },

  dicas(i: InstanciaTermoGeral): string[] {
    return [
      i.tipo === 'PA' ? 'A diferença entre termos vizinhos é constante: é uma PA.' : 'O quociente entre termos vizinhos é constante: é uma PG.',
      i.tipo === 'PA' ? 'Modelo: aₙ = a₁ + (n − 1)·r. Descubra a₁ e r.' : 'Modelo: aₙ = a₁·q^(n − 1). Descubra a₁ e q.',
      `Aqui a₁ = ${fmt(i.a1)} e a razão é ${fmt(i.razao)}.`,
    ]
  },

  explicar(i: InstanciaTermoGeral): string {
    return i.tipo === 'PA'
      ? `Razão r = ${fmt(i.termos[1] as number)} − ${fmt(i.termos[0] as number)} = ${fmt(i.razao)}. aₙ = ${fmt(i.a1)} + (n − 1)·${fmt(i.razao)}. Conferindo: n = 4 dá ${fmt(i.termos[3] as number)}.`
      : `Razão q = ${fmt(i.termos[1] as number)} ÷ ${fmt(i.termos[0] as number)} = ${fmt(i.razao)}. aₙ = ${fmt(i.a1)}·(${fmt(i.razao)})^(n − 1). Conferindo: n = 4 dá ${fmt(i.termos[3] as number)}.`
  },
} satisfies Desafio<InstanciaTermoGeral, string> & { respostaCanonica(i: InstanciaTermoGeral): string }
