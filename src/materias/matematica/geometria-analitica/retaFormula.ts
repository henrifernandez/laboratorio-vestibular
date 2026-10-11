import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { criarRng, escolher, sortear } from '@/lib/rng'
import { equivalentes } from '../funcoes/expressao'
import { fracaoTxt, textoReduzida, type Pt } from './calculo'

export interface InstanciaReta {
  semente: number
  nivel: Nivel
  variante: 'doisPontos' | 'paralela' | 'perpendicular'
  /** coeficientes da reta pedida */
  m: number
  n: number
  /** pontos que a reta deve conter */
  pontos: Pt[]
  /** reta dada (paralela/perpendicular) */
  ref?: { m: number; n: number }
}

const pt = (p: Pt) => `(${p.x}, ${p.y})`
const igual = (a: number, b: number) => Math.abs(a - b) < 1e-6

export function enunciadoReta(i: InstanciaReta): string {
  if (i.variante === 'doisPontos') return `Escreva a equação reduzida (y = mx + n) da reta que passa pelos pontos A${pt(i.pontos[0] as Pt)} e B${pt(i.pontos[1] as Pt)}.`
  const ref = textoReduzida((i.ref as { m: number; n: number }).m, (i.ref as { m: number; n: number }).n)
  return `Escreva a equação reduzida da reta que passa por P${pt(i.pontos[0] as Pt)} e é ${i.variante === 'paralela' ? 'paralela' : 'perpendicular'} à reta ${ref}.`
}

export const retaFormula = {
  id: 'matematica/geometria-analitica/reta',
  materia: 'matematica',
  tema: 'geometria-analitica',
  titulo: 'Escreva a equação da reta',

  gerar(semente: number, nivel: Nivel): InstanciaReta {
    const rng = criarRng(semente * 4294967291 + nivel * 29)
    if (nivel === 1) {
      const m = escolher(rng, [-3, -2, -1, 1, 2, 3])
      const n = sortear(rng, -4, 4)
      const x1 = sortear(rng, -3, 0)
      const x2 = x1 + sortear(rng, 2, 4)
      return { semente, nivel, variante: 'doisPontos', m, n, pontos: [{ x: x1, y: m * x1 + n }, { x: x2, y: m * x2 + n }] }
    }
    if (nivel === 2) {
      const [num, den] = escolher(rng, [[1, 2], [-1, 2], [3, 2], [-3, 2], [2, 3], [-2, 3], [1, 3]] as [number, number][])
      const m = num / den
      const n = sortear(rng, -3, 3)
      const x1 = den * sortear(rng, -2, 0)
      const x2 = x1 + den * sortear(rng, 1, 3)
      return { semente, nivel, variante: 'doisPontos', m, n, pontos: [{ x: x1, y: m * x1 + n }, { x: x2, y: m * x2 + n }] }
    }
    const paralela = rng() < 0.5
    const m0 = escolher(rng, [-2, -1, 1, 2, 0.5, -0.5])
    const n0 = sortear(rng, -4, 4)
    const m = paralela ? m0 : -1 / m0
    const den = [1, 2].find((d) => Math.abs(m * d - Math.round(m * d)) < 1e-9) ?? 2
    const x0 = den * sortear(rng, -2, 2)
    const y0 = sortear(rng, -4, 4)
    const n = y0 - m * x0
    return { semente, nivel, variante: paralela ? 'paralela' : 'perpendicular', m, n, pontos: [{ x: x0, y: y0 }], ref: { m: m0, n: n0 } }
  },

  respostaCanonica(i: InstanciaReta): string {
    return `${i.m}*x + (${i.n})`
  },

  corrigir(inst: InstanciaReta, resposta: string): Correcao {
    const limpa = resposta.replace(/^\s*y\s*=\s*/i, '')
    const eq = equivalentes(limpa, (x) => inst.m * x + inst.n, { min: -6, max: 6 })
    if (eq.erro || !eq.fn) {
      return {
        correto: false,
        feedback: `${eq.erro ?? 'Não consegui entender a fórmula.'} Escreva, por exemplo, 2x - 1 ou y = x/2 + 3.`,
        motivo: 'fórmula mal escrita',
        licao: 'escreva a reta no formato y = mx + n',
      }
    }
    if (eq.ok) return { correto: true, parcial: 1, feedback: 'Isso! Sua reta passa pelos pontos e tem a inclinação certa.' }

    const f = eq.fn
    const mu = f(1) - f(0)
    const nu = f(0)
    if (!(igual(f(2) - f(1), mu) && igual(f(-1) - f(0), -mu))) {
      return {
        correto: false,
        parcial: 0,
        feedback: 'Sua expressão não é de uma reta: o gráfico de y = mx + n tem x só na primeira potência.',
        motivo: 'não é uma reta',
        licao: 'reta: y = mx + n',
      }
    }
    const errados = inst.pontos.filter((p) => !igual(f(p.x), p.y))
    const m = inst.m
    const ref = inst.ref
    const m0 = ref?.m
    const mTxt = fracaoTxt(m)
    const nTxt = fracaoTxt(inst.n)
    const mUsuarioTxt = fracaoTxt(Math.round(mu * 1e6) / 1e6)
    if (igual(mu, m)) {
      const p = errados[0] as Pt
      return {
        correto: false,
        parcial: 0.5,
        feedback: `O coeficiente angular está certo (m = ${mTxt}), mas a reta não passa por ${inst.pontos.length === 2 ? (p === inst.pontos[0] ? 'A' : 'B') : 'P'}${pt(p)}: com x = ${p.x} sua reta dá y = ${fracaoTxt(Math.round(f(p.x) * 1e6) / 1e6)}. O coeficiente linear deveria ser ${nTxt}.`,
        motivo: 'coeficiente linear errado',
        licao: 'ache n substituindo um ponto em y = mx + n',
      }
    }
    if (igual(mu, -m) && m !== 0) {
      return {
        correto: false,
        parcial: 0.2,
        feedback: `O sinal do coeficiente angular está trocado: você usou m = ${mUsuarioTxt}, mas Δy/Δx = ${mTxt}. Calcule (y₂ − y₁)/(x₂ − x₁) sempre na mesma ordem.`,
        motivo: 'sinal do coeficiente angular trocado',
        licao: 'm = (y₂ − y₁)/(x₂ − x₁), na mesma ordem em cima e embaixo',
      }
    }
    if (m !== 0 && igual(mu, 1 / m)) {
      return {
        correto: false,
        parcial: 0.2,
        feedback: `Você usou m = ${mUsuarioTxt}, que é Δx/Δy. O coeficiente angular é Δy/Δx = ${mTxt}.`,
        motivo: 'coeficiente angular invertido',
        licao: 'm = Δy/Δx (variação de y sobre variação de x)',
      }
    }
    if (inst.variante === 'perpendicular' && m0 !== undefined && igual(mu, m0)) {
      return {
        correto: false,
        parcial: 0.2,
        feedback: `Você repetiu o coeficiente angular da reta dada (${fracaoTxt(m0)}), que serviria para uma reta paralela. Para perpendicular, m₁·m₂ = −1: m = ${mTxt}.`,
        motivo: 'usou a paralela no lugar da perpendicular',
        licao: 'perpendiculares: m₁·m₂ = −1; paralelas: m₁ = m₂',
      }
    }
    if (inst.variante === 'paralela' && m0 !== undefined && m0 !== 0 && igual(mu, -1 / m0)) {
      return {
        correto: false,
        parcial: 0.2,
        feedback: `Você usou o coeficiente da reta perpendicular (${mUsuarioTxt}). Para uma reta paralela o coeficiente angular é o mesmo da reta dada: m = ${mTxt}.`,
        motivo: 'usou a perpendicular no lugar da paralela',
        licao: 'paralelas: m₁ = m₂; perpendiculares: m₁·m₂ = −1',
      }
    }
    return {
      correto: false,
      parcial: errados.length === inst.pontos.length ? 0 : 0.4,
      feedback: `Seu coeficiente angular é ${mUsuarioTxt}, mas o da reta pedida é ${mTxt}${inst.variante === 'doisPontos' ? ' (Δy/Δx entre os dois pontos)' : ''}. Depois ache n substituindo um ponto.`,
      motivo: 'coeficiente angular errado',
      licao: 'm = Δy/Δx; depois n = y₀ − m·x₀',
      destaque: { nu },
    }
  },

  dicas(i: InstanciaReta): string[] {
    if (i.variante === 'doisPontos') {
      return [
        'Uma reta fica definida pelo coeficiente angular m e pelo coeficiente linear n em y = mx + n.',
        'm = (y₂ − y₁)/(x₂ − x₁). Depois substitua um ponto para achar n.',
        `m = ${fracaoTxt(i.m)}; substituindo ${pt(i.pontos[0] as Pt)}: n = ${(i.pontos[0] as Pt).y} − (${fracaoTxt(i.m)})·(${(i.pontos[0] as Pt).x}) = ${fracaoTxt(i.n)}.`,
      ]
    }
    return [
      i.variante === 'paralela' ? 'Retas paralelas têm o mesmo coeficiente angular.' : 'Retas perpendiculares têm coeficientes angulares com produto −1.',
      `O coeficiente angular da reta dada é ${fracaoTxt((i.ref as { m: number }).m)}. Ache o da reta pedida.`,
      `m = ${fracaoTxt(i.m)}; substitua P${pt(i.pontos[0] as Pt)} em y = mx + n para achar n = ${fracaoTxt(i.n)}.`,
    ]
  },

  explicar(i: InstanciaReta): string {
    const eq = textoReduzida(i.m, i.n)
    if (i.variante === 'doisPontos') {
      const [a, b] = i.pontos as [Pt, Pt]
      return `m = (${b.y} − ${a.y})/(${b.x} − ${a.x}) = ${fracaoTxt(i.m)}. Substituindo A${pt(a)}: ${a.y} = ${fracaoTxt(i.m)}·${a.x} + n, então n = ${fracaoTxt(i.n)}. Equação: ${eq}.`
    }
    const p = i.pontos[0] as Pt
    return `${i.variante === 'paralela' ? `Paralela: m = ${fracaoTxt(i.m)}` : `Perpendicular: m = −1/(${fracaoTxt((i.ref as { m: number }).m)}) = ${fracaoTxt(i.m)}`}. Passando por P${pt(p)}: ${p.y} = ${fracaoTxt(i.m)}·${p.x} + n, então n = ${fracaoTxt(i.n)}. Equação: ${eq}.`
  },
} satisfies Desafio<InstanciaReta, string> & { respostaCanonica(i: InstanciaReta): string }
