import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { exato, grausParaRad, normalizar, quadrante, referencia, sinais, textoRad } from './calculo'

const NOME_Q: Record<number, string> = { 0: 'sobre um eixo', 1: '1º quadrante', 2: '2º quadrante', 3: '3º quadrante', 4: '4º quadrante' }
const FN_NOME = { sen: 'seno', cos: 'cosseno', tan: 'tangente' } as const
const tx = (g: number) => (g === Math.round(g) ? `${g}°` : `${g}°`)

/** Texto de um ângulo em graus ou em radianos conforme o modo. */
export const descreverAngulo = (graus: number, rad: boolean) => (rad ? `${textoRad(graus)} rad` : tx(graus))

const NAO_EIXO_1: number[] = [20, 30, 40, 45, 50, 60, 70, 110, 120, 135, 150, 160, 200, 210, 225, 240, 250, 300, 315, 330, 340]
const RAD_NOTAVEIS = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]
const NOTAVEIS_Q1 = [30, 45, 60]
const NOTAVEIS_OUTROS = [120, 135, 150, 210, 225, 240, 300, 315, 330]

function volta(rng: Rng): { graus: number; passos: string } {
  const base = escolher(rng, [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330])
  const tipo = sortear(rng, 0, 2)
  if (tipo === 0) {
    const k = sortear(rng, 1, 2)
    return { graus: base + 360 * k, passos: `${base + 360 * k}° − ${k}·360° = ${base}°` }
  }
  if (tipo === 1) {
    return { graus: -base, passos: `${-base}° + 360° = ${normalizar(-base)}°` }
  }
  const k = sortear(rng, 1, 2)
  return { graus: -base - 360 * k, passos: `${-base - 360 * k}° + ${k + 1}·360° = ${normalizar(-base - 360 * k)}°` }
}

/* ------------------------------------------------------------------ localizar o ângulo */

export interface DadosAngulo {
  graus: number
  rad: boolean
}

export function gerarLocalizar(rng: Rng, nivel: Nivel): InstanciaMulti<DadosAngulo> {
  let graus: number
  let passos = ''
  let rad = false
  if (nivel === 1) graus = escolher(rng, NAO_EIXO_1)
  else if (nivel === 2) {
    graus = escolher(rng, RAD_NOTAVEIS)
    rad = true
  } else {
    const eixo = rng() < 0.2
    if (eixo) graus = escolher(rng, [450, 540, 630, -90, -180])
    else {
      const v = volta(rng)
      graus = v.graus
      passos = v.passos
    }
    rad = rng() < 0.3 && graus % 30 === 0
  }
  const q = quadrante(graus)
  const a = normalizar(graus)
  const nome = descreverAngulo(graus, rad)
  const opcoes = [1, 2, 3, 4, ...(nivel === 3 ? [0] : [])].map((k) => ({ id: String(k), rotulo: NOME_Q[k] === 'sobre um eixo' ? 'Sobre um dos eixos' : (NOME_Q[k] as string) }))
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  const faixa = (k: number) => (k === 0 ? 'os eixos (múltiplos de 90°)' : `${(k - 1) * 90}° a ${k * 90}°`)
  const explicacao = `${passos ? `Primeiro reduza à primeira volta: ${passos}. ` : ''}${a}° ${q === 0 ? `está sobre um eixo (múltiplo de 90°)` : `está entre ${faixa(q)}, no ${NOME_Q[q]}`}.`
  for (const o of opcoes) {
    const k = Number(o.id)
    if (k === q) porque[o.id] = `Isso! ${explicacao}`
    else {
      porque[o.id] = `Não: o ângulo equivalente na primeira volta é ${a}°, e ${k === 0 ? 'ele não está sobre um eixo' : `o ${NOME_Q[k]} vai de ${faixa(k)}`}. ${explicacao}`
      motivo[o.id] = 'quadrante errado'
    }
  }
  return {
    enunciado: `Em que região do círculo trigonométrico termina o arco de ${nome}?`,
    opcoes,
    certa: String(q),
    porque,
    motivo,
    resolucao: explicacao,
    dicas: [
      'Os quadrantes dividem a volta de 360° em quatro partes de 90°.',
      rad ? 'Converta para graus (π rad = 180°) se ajudar.' : 'Se o ângulo for negativo ou maior que 360°, some ou subtraia voltas de 360° até cair entre 0° e 360°.',
      `1º: 0° a 90°; 2º: 90° a 180°; 3º: 180° a 270°; 4º: 270° a 360°. Aqui, o ângulo equivalente é ${a}°.`,
    ],
    licao: 'quadrantes: 1º 0°–90°; 2º 90°–180°; 3º 180°–270°; 4º 270°–360°. Reduza voltas completas primeiro',
    dados: { graus, rad },
  }
}

/* ------------------------------------------------------------------ sinais */

const rotuloSinais = (q: 1 | 2 | 3 | 4) => {
  const s = sinais(q)
  return `sen ${s.sen} · cos ${s.cos} · tan ${s.tan}`
}

export function gerarSinais(rng: Rng, nivel: Nivel): InstanciaMulti<DadosAngulo> {
  let graus: number
  let passos = ''
  let rad = false
  if (nivel === 1) graus = escolher(rng, NAO_EIXO_1)
  else if (nivel === 2) {
    graus = escolher(rng, RAD_NOTAVEIS)
    rad = true
  } else {
    const v = volta(rng)
    graus = v.graus
    passos = v.passos
  }
  const q = quadrante(graus) as 1 | 2 | 3 | 4
  const nome = descreverAngulo(graus, rad)
  const todos = [1, 2, 3, 4] as const
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  const regra = 'Memorize: 1º todos positivos; 2º só o seno; 3º só a tangente; 4º só o cosseno.'
  const ex = `${passos ? `Reduzindo: ${passos}. ` : ''}O ângulo equivalente é ${normalizar(graus)}°, no ${NOME_Q[q]}. ${regra}`
  for (const k of todos) {
    if (k === q) porque[String(k)] = `Isso! ${ex}`
    else {
      porque[String(k)] = `Esses são os sinais do ${NOME_Q[k]}. ${ex}`
      motivo[String(k)] = 'sinais do quadrante errado'
    }
  }
  return {
    enunciado: `Quais são os sinais de seno, cosseno e tangente do ângulo ${nome}?`,
    opcoes: embaralhar(rng, todos).map((k) => ({ id: String(k), rotulo: rotuloSinais(k) })),
    certa: String(q),
    porque,
    motivo,
    resolucao: ex,
    dicas: [
      'Primeiro descubra o quadrante do ângulo (reduza voltas se preciso).',
      'No círculo, cosseno é a coordenada x e seno é a coordenada y; a tangente é sen ÷ cos.',
      regra,
    ],
    licao: 'sinais: 1º todos +; 2º só sen +; 3º só tan +; 4º só cos +',
    dados: { graus, rad },
  }
}

/* ------------------------------------------------------------------ valor exato */

export interface DadosValor {
  fn: 'sen' | 'cos' | 'tan'
  graus: number
  rad: boolean
}

export function gerarValor(rng: Rng, nivel: Nivel): InstanciaMulti<DadosValor> {
  const fn = escolher(rng, ['sen', 'cos', 'tan'] as const)
  let graus: number
  let passos = ''
  let rad = false
  if (nivel === 1) graus = escolher(rng, NOTAVEIS_Q1)
  else if (nivel === 2) {
    graus = escolher(rng, NOTAVEIS_OUTROS)
    rad = rng() < 0.4
  } else if (rng() < 0.25) graus = escolher(rng, fn === 'tan' ? [90, 270, 180, 360] : [180, 270, 90, 360])
  else {
    const v = volta(rng)
    graus = v.graus
    passos = v.passos
  }
  const verdade = exato(fn, graus)
  const nome = descreverAngulo(graus, rad)
  const a = normalizar(graus)
  const ref = referencia(graus)
  const neg = (t: string) => (t === '0' || t === 'não existe' ? null : t.startsWith('−') ? t.slice(1) : `−${t}`)
  const razoes = new Map<string, { frase: string; motivo: string }>()
  const sinalTroc = neg(verdade.texto)
  if (sinalTroc) razoes.set(sinalTroc, { frase: `Só o sinal está trocado. O módulo é o do ângulo de referência (${ref}°), mas o ${FN_NOME[fn]} no ${NOME_Q[quadrante(graus)]} é ${verdade.num > 0 ? 'positivo' : 'negativo'}.`, motivo: 'sinal trocado' })
  for (const outra of (['sen', 'cos', 'tan'] as const).filter((f) => f !== fn)) {
    const v = exato(outra, graus)
    if (v.existe || outra === 'tan') razoes.set(v.texto, { frase: `Esse é o valor do ${FN_NOME[outra]} de ${nome}, e não do ${FN_NOME[fn]}. Releia qual função foi pedida.`, motivo: `trocou ${FN_NOME[fn]} por ${FN_NOME[outra]}` })
  }
  for (const r of [30, 45, 60]) {
    if (r === ref) continue
    // ângulo do mesmo quadrante, mas com outra referência
    const mesmoQuadrante = a <= 90 ? r : a <= 180 ? 180 - r : a <= 270 ? 180 + r : 360 - r
    const alt = exato(fn, mesmoQuadrante)
    if (alt.existe) razoes.set(alt.texto, { frase: `Esse é o valor para um ângulo de referência de ${r}°. O ângulo de referência de ${a}° é ${ref}°.`, motivo: 'ângulo de referência errado' })
  }
  razoes.delete(verdade.texto)
  const candidatos = [...razoes.entries()]
  const escolhidos = candidatos.slice(0, 3)
  while (escolhidos.length < 3) {
    const extra = ['1/2', '√2/2', '√3/2', '√3/3', '√3', '−1', '1'].find((t) => t !== verdade.texto && !escolhidos.some(([x]) => x === t))
    escolhidos.push([extra as string, { frase: 'Esse valor não corresponde a este ângulo. Use o ângulo de referência e o sinal do quadrante.', motivo: 'valor errado' }])
  }
  const opcoes = embaralhar(rng, [{ id: verdade.texto, rotulo: verdade.texto }, ...escolhidos.map(([t]) => ({ id: t, rotulo: t }))])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  const cadeia = `${passos ? `Reduza: ${passos}. ` : ''}Ângulo de referência: ${ref}°. No ${NOME_Q[quadrante(graus)]}, ${FN_NOME[fn]} ${verdade.existe ? (verdade.num > 0 ? 'é positivo' : verdade.num < 0 ? 'é negativo' : 'vale zero') : 'não existe'}.`
  porque[verdade.texto] = `Isso! ${cadeia} Resultado: ${verdade.texto}.`
  for (const [t, r] of escolhidos) {
    porque[t] = r.frase
    motivo[t] = r.motivo
  }
  return {
    enunciado: `Qual é o valor de ${fn === 'sen' ? 'sen' : fn === 'cos' ? 'cos' : 'tg'} ${nome}?`,
    opcoes,
    certa: verdade.texto,
    porque,
    motivo,
    resolucao: `${cadeia} Resultado: ${verdade.texto}.`,
    dicas: [
      'Reduza o ângulo ao 1º quadrante (ângulo de referência) e use a tabela de 30°, 45° e 60°.',
      'O sinal vem do quadrante: sen é + no 1º e 2º; cos é + no 1º e 4º; tg é + no 1º e 3º.',
      `Aqui o ângulo de referência é ${ref}° e o ${FN_NOME[fn]} fica ${verdade.existe ? (verdade.num > 0 ? 'positivo' : verdade.num < 0 ? 'negativo' : 'zero') : 'indefinido'}.`,
    ],
    licao: 'valor = (valor do ângulo de referência) com o sinal do quadrante',
    dados: { fn, graus, rad },
  }
}

/* ------------------------------------------------------------------ conversão e arco */

export interface DadosConversao {
  tipo: 'grausRad' | 'radGraus' | 'radianoDecimal' | 'arco'
}

export function gerarConversao(rng: Rng, nivel: Nivel): InstanciaNum<DadosConversao> {
  if (nivel === 1) {
    const g = escolher(rng, [30, 45, 60, 120, 135, 150, 210, 225, 240, 300])
    const coef = g / 180
    return {
      enunciado: `Converta ${g}° em radianos. Digite o coeficiente de π (por exemplo, 5/6 para 5π/6).`,
      resposta: coef,
      tolerancia: 0.002,
      erros: [{ valor: 180 / g, frase: 'Você inverteu a razão. Para ir de graus para radianos multiplique por π/180 (ou use a regra de três: 180° ↔ π).', motivo: 'inverteu a razão de conversão' }],
      resolucao: `${g}° · π/180° = ${textoRad(g)}. O coeficiente de π é ${textoRad(g).replace('π', '').replace('−', '−') || '1'} = ${String(Math.round(coef * 10000) / 10000).replace('.', ',')}.`,
      dicas: ['π rad equivale a 180°.', 'Regra de três: 180° está para π assim como o ângulo está para x.', `x = ${g}·π/180.`],
      licao: 'π rad = 180°; graus → rad: multiplique por π/180',
      dados: { tipo: 'grausRad' },
    }
  }
  if (nivel === 2) {
    const g = escolher(rng, [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 330])
    return {
      enunciado: `Converta ${textoRad(g)} rad em graus.`,
      resposta: g,
      tolerancia: 0.01,
      erros: [{ valor: Math.round(((g / 180) * Math.PI * (Math.PI / 180)) * 10000) / 10000, frase: 'Você multiplicou por π/180, que leva de graus para radianos. De radianos para graus multiplique por 180/π (ou troque π por 180°).', motivo: 'inverteu a razão de conversão' }],
      resolucao: `Troque π por 180°: ${textoRad(g)} = ${g}°.`,
      dicas: ['π rad = 180°.', 'Substitua π por 180° na expressão.', `${textoRad(g)} → ${g}°.`],
      licao: 'π rad = 180°; rad → graus: troque π por 180°',
      dados: { tipo: 'radGraus' },
    }
  }
  if (rng() < 0.5) {
    const r = sortear(rng, 2, 5)
    return {
      enunciado: `Um ângulo de ${r} rad corresponde a quantos graus? Use π ≈ 3,14 e arredonde em 1 casa decimal.`,
      resposta: Math.round(((r * 180) / 3.14) * 10) / 10,
      tolerancia: 0.3,
      erros: [{ valor: r * 3.14 / 180, frase: 'Você multiplicou por π/180. Para converter de radianos para graus use 180/π.', motivo: 'inverteu a razão de conversão' }],
      resolucao: `${r} rad = ${r}·180°/π ≈ ${r}·180/3,14 ≈ ${String(Math.round(((r * 180) / 3.14) * 10) / 10).replace('.', ',')}°.`,
      dicas: ['π rad = 180°, logo 1 rad = 180°/π.', 'Multiplique o valor em radianos por 180/π.', `${r} × 180 ÷ 3,14.`],
      licao: '1 rad = 180°/π ≈ 57,3°',
      dados: { tipo: 'radianoDecimal' },
    }
  }
  const raio = sortear(rng, 3, 9)
  const g = escolher(rng, [30, 60, 90, 120])
  const s = raio * grausParaRad(g)
  return {
    enunciado: `Qual é o comprimento do arco de ${g}° numa circunferência de raio ${raio} cm? Use π ≈ 3,14 e arredonde em 2 casas decimais.`,
    resposta: Math.round(raio * (g / 180) * 3.14 * 100) / 100,
    tolerancia: 0.03,
    erros: [{ valor: raio * g, frase: 'Você multiplicou o raio pelo ângulo em graus. A fórmula s = r·θ exige θ em radianos: converta antes (θ = g·π/180).', motivo: 'usou graus em s = r·θ' }],
    resolucao: `θ = ${g}° = ${textoRad(g)} rad ≈ ${String(Math.round(grausParaRad(g) * 10000) / 10000).replace('.', ',')} rad. s = r·θ = ${raio}·θ ≈ ${String(Math.round(s * 100) / 100).replace('.', ',')} cm.`,
    dicas: ['Comprimento do arco: s = r·θ, com θ em radianos.', `Converta ${g}° para radianos primeiro.`, `θ = ${g}·π/180.`],
    licao: 's = r·θ (θ em radianos)',
    dados: { tipo: 'arco' },
  }
}
