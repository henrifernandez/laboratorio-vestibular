import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { criarRng, escolher, sortear } from '@/lib/rng'
import { G, alcance } from './calculo'

export interface InstanciaAlvoL {
  semente: number
  nivel: Nivel
  /** distância horizontal do alvo (m) */
  d: number
  /** altura do alvo (m): 0 = no chão, > 0 = sobre uma plataforma */
  h: number
  /** meia largura do alvo (m) */
  tol: number
  /** o que não pode ser ajustado */
  fixo: { angulo?: number; v0?: number }
}

export interface RespostaAlvoL {
  angulo: number
  v0: number
}

const rad = (g: number) => (g * Math.PI) / 180
const f = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/** Onde o projétil chega à altura h, já descendo (h = 0: o alcance). null se nunca chega a essa altura. */
export function pousoEm(v0: number, angulo: number, h: number): { x: number; t: number; descendo: boolean } | null {
  const vy = v0 * Math.sin(rad(angulo))
  const vx = v0 * Math.cos(rad(angulo))
  const disc = vy * vy - 2 * G * h
  if (disc < 0 || v0 <= 0) return null
  const t = (vy + Math.sqrt(disc)) / G
  if (t <= 0) return null
  return { x: vx * t, t, descendo: true }
}

function efetiva(inst: InstanciaAlvoL, r: RespostaAlvoL): RespostaAlvoL {
  return { angulo: inst.fixo.angulo ?? r.angulo, v0: inst.fixo.v0 ?? r.v0 }
}

export const alvoLancamento = {
  id: 'fisica/cinematica/alvo',
  materia: 'fisica',
  tema: 'cinematica',
  titulo: 'Acerte o alvo',

  gerar(semente: number, nivel: Nivel): InstanciaAlvoL {
    const rng = criarRng(semente * 9576890767 + nivel * 41)
    for (let tentativa = 0; tentativa < 300; tentativa++) {
      let inst: InstanciaAlvoL
      if (nivel === 1) {
        inst = { semente, nivel, d: escolher(rng, [10, 22.5, 40, 62.5, 90]), h: 0, tol: 1, fixo: { angulo: 45 } }
      } else if (nivel === 2) {
        const v0 = escolher(rng, [20, 25, 30])
        const ang = escolher(rng, [15, 20, 25, 30, 35, 60, 65, 70])
        inst = { semente, nivel, d: Math.round(alcance(v0, ang) * 2) / 2, h: 0, tol: 1, fixo: { v0 } }
      } else {
        const v0 = escolher(rng, [15, 20, 25])
        const ang = sortear(rng, 40, 65)
        const h = escolher(rng, [2, 3, 4, 5])
        const p = pousoEm(v0, ang, h)
        if (!p) continue
        inst = { semente, nivel, d: Math.round(p.x * 2) / 2, h, tol: 1.5, fixo: {} }
      }
      if (!alvoLancamento.corrigir(inst, alvoLancamento.respostaInicial(inst)).correto) return inst
    }
    throw new Error('não foi possível gerar uma instância válida')
  },

  respostaInicial(i: InstanciaAlvoL): RespostaAlvoL {
    return { angulo: i.fixo.angulo ?? 45, v0: i.fixo.v0 ?? 12 }
  },

  /** uma solução válida (para testes e para a resolução comentada) */
  respostaCerta(i: InstanciaAlvoL): RespostaAlvoL {
    if (i.fixo.angulo !== undefined) return { angulo: i.fixo.angulo, v0: Math.round(Math.sqrt(G * i.d)) }
    if (i.fixo.v0 !== undefined) {
      const s = Math.max(-1, Math.min(1, (G * i.d) / (i.fixo.v0 * i.fixo.v0)))
      return { angulo: Math.round((Math.asin(s) * 90) / Math.PI), v0: i.fixo.v0 }
    }
    // busca simples de uma solução (v0 e ângulo inteiros)
    let melhor = { angulo: 45, v0: 20, erro: Infinity }
    for (let v0 = 8; v0 <= 40; v0++) {
      for (let a = 10; a <= 80; a++) {
        const p = pousoEm(v0, a, i.h)
        if (!p) continue
        const erro = Math.abs(p.x - i.d)
        if (erro < melhor.erro) melhor = { angulo: a, v0, erro }
      }
    }
    return { angulo: melhor.angulo, v0: melhor.v0 }
  },

  corrigir(inst: InstanciaAlvoL, resposta: RespostaAlvoL): Correcao {
    const r = efetiva(inst, resposta)
    const destaque = { ...r }
    const p = pousoEm(r.v0, r.angulo, inst.h)
    if (!p) {
      return {
        correto: false,
        parcial: 0,
        feedback: `O projétil nem chega à altura do alvo (${f(inst.h)} m): com ${f(r.v0)} m/s a ${f(r.angulo)}°, a altura máxima é só ${f(((r.v0 * Math.sin(rad(r.angulo))) ** 2) / (2 * G))} m. Aumente a velocidade ou o ângulo.`,
        motivo: 'não alcançou a altura do alvo',
        licao: 'altura máxima = (v₀·sen θ)²/(2g)',
        destaque,
      }
    }
    const erro = p.x - inst.d
    if (Math.abs(erro) <= inst.tol) {
      return { correto: true, parcial: 1, feedback: `Acertou! O projétil ${inst.h > 0 ? 'chega à plataforma' : 'cai'} a ${f(p.x)} m e o alvo está a ${f(inst.d)} m.`, destaque }
    }
    const parcial = Math.max(0, 1 - Math.abs(erro) / Math.max(inst.d, 1))
    const sentido = erro < 0 ? `${f(-erro)} m antes do alvo` : `${f(erro)} m depois do alvo`
    const dica = erro < 0 ? 'Para ir mais longe, aumente a velocidade (ou aproxime o ângulo de 45°).' : 'Para ficar mais perto, diminua a velocidade (ou afaste o ângulo de 45°).'
    return {
      correto: false,
      parcial,
      feedback: `O projétil ${inst.h > 0 ? 'chegou à altura do alvo' : 'caiu'} ${sentido}. ${dica}`,
      motivo: erro < 0 ? 'lançamento curto demais' : 'lançamento longo demais',
      licao: 'alcance = v₀²·sen(2θ)/g: máximo a 45°; θ e 90° − θ dão o mesmo alcance',
      destaque,
    }
  },

  dicas(i: InstanciaAlvoL): string[] {
    if (i.fixo.angulo !== undefined) {
      return ['Em 45° o alcance é o maior possível para uma dada velocidade: R = v₀²/g.', `Com g = 10 m/s²: v₀² = 10 · ${f(i.d)}.`, `v₀ = √(10 · ${f(i.d)}) ≈ ${f(Math.sqrt(G * i.d))} m/s.`]
    }
    if (i.fixo.v0 !== undefined) {
      return ['O alcance depende do ângulo: R = v₀²·sen(2θ)/g.', `Para R = ${f(i.d)} m e v₀ = ${i.fixo.v0} m/s, sen(2θ) = ${f((G * i.d) / (i.fixo.v0 * i.fixo.v0))}.`, 'Há dois ângulos que servem: θ e 90° − θ.']
    }
    return ['Com o alvo mais alto que o ponto de lançamento, o projétil precisa chegar à altura da plataforma já descendo.', 'Teste ângulos entre 40° e 65° e ajuste a velocidade até a curva pousar na plataforma.', 'A altura do ponto mais alto é (v₀·sen θ)²/(2g): precisa ser maior que a altura da plataforma.']
  },

  explicar(i: InstanciaAlvoL): string {
    const r = alvoLancamento.respostaCerta(i)
    if (i.fixo.angulo !== undefined) return `A 45°, R = v₀²/g. Queremos R = ${f(i.d)} m: v₀² = g·R = 10·${f(i.d)} = ${f(G * i.d)}, então v₀ ≈ ${f(Math.sqrt(G * i.d))} m/s.`
    if (i.fixo.v0 !== undefined) return `R = v₀²·sen(2θ)/g, então sen(2θ) = g·R/v₀² = 10·${f(i.d)}/${i.fixo.v0}² = ${f((G * i.d) / (i.fixo.v0 * i.fixo.v0))}. Isso dá θ ≈ ${r.angulo}° (ou o complementar, ${90 - r.angulo}°).`
    return `Uma solução é v₀ = ${r.v0} m/s e θ = ${r.angulo}°: o projétil sobe, passa pelo ápice e cruza a altura de ${f(i.h)} m já descendo, a cerca de ${f(i.d)} m. Há várias combinações que funcionam.`
  },
} satisfies Desafio<InstanciaAlvoL, RespostaAlvoL> & {
  respostaInicial(i: InstanciaAlvoL): RespostaAlvoL
  respostaCerta(i: InstanciaAlvoL): RespostaAlvoL
}
