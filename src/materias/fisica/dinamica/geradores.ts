import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { G, atwood, mesaComPolia, plano } from './calculo'

const f2 = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const TG = (graus: number) => Math.tan((graus * Math.PI) / 180)
const grausDe = (h: number, b: number) => (Math.atan2(h, b) * 180) / Math.PI

/** Remove erros típicos que coincidem com a resposta certa, que não fazem sentido (≤ 0) ou que se repetem. */
function limpar(erros: ErroTipico[], resposta: number, tolerancia: number, permitirZero = false): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!(e.valor > 0 || (permitirZero && e.valor === 0))) continue
    if (Math.abs(e.valor - resposta) <= 2 * tolerancia) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= 2 * tolerancia)) continue
    saida.push(e)
  }
  return saida
}

/* ------------------------------------------------------------------ vai deslizar? */

export type Veredito = 'parado' | 'desliza' | 'iminencia'

export interface DadosDeslizar {
  angulo: number
  mu: number
  m: number
  rampa?: { h: number; b: number }
  veredito: Veredito
}

/** Compara tg θ com μ: o veredito não depende da massa. */
export function vereditoPlano(angulo: number, mu: number): Veredito {
  if (Math.abs(TG(angulo) - mu) < 1e-9) return 'iminencia'
  return plano({ m: 1, angulo, mu }).desliza ? 'desliza' : 'parado'
}

const MASSAS = [1, 2, 3, 5, 10, 20]
const MUS = [0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.5, 2]
const RAMPAS = [
  { h: 3, b: 4 },
  { h: 6, b: 8 },
  { h: 5, b: 12 },
  { h: 4, b: 3 },
  { h: 12, b: 5 },
  { h: 9, b: 12 },
]
const IMINENTES: { angulo?: number; rampa?: { h: number; b: number }; mu: number }[] = [
  { angulo: 45, mu: 1 },
  { rampa: { h: 3, b: 4 }, mu: 0.75 },
  { rampa: { h: 6, b: 8 }, mu: 0.75 },
  { rampa: { h: 9, b: 12 }, mu: 0.75 },
]
const PROXIMOS: { rampa: { h: number; b: number }; mu: number }[] = [
  { rampa: { h: 3, b: 4 }, mu: 0.7 },
  { rampa: { h: 3, b: 4 }, mu: 0.8 },
  { rampa: { h: 5, b: 12 }, mu: 0.35 },
  { rampa: { h: 5, b: 12 }, mu: 0.45 },
  { rampa: { h: 4, b: 3 }, mu: 1.2 },
  { rampa: { h: 4, b: 3 }, mu: 1.5 },
]

export const ROTULOS_DESLIZAR: Record<Veredito | 'massa', string> = {
  parado: 'Fica parado, com folga: o atrito ainda não chegou ao máximo',
  desliza: 'Desliza plano abaixo',
  iminencia: 'Fica parado, mas no limite: qualquer empurrãozinho o faria deslizar',
  massa: 'Depende da massa: blocos mais pesados deslizam primeiro',
}

export function gerarDeslizar(rng: Rng, nivel: Nivel): InstanciaMulti<DadosDeslizar> {
  const m = escolher(rng, MASSAS)
  let angulo: number
  let mu: number
  let rampa: { h: number; b: number } | undefined
  if (nivel === 1) {
    angulo = escolher(rng, [30, 45, 60])
    mu = escolher(rng, MUS.filter((x) => Math.abs(TG(angulo) - x) >= 0.2))
  } else if (nivel === 2) {
    rampa = escolher(rng, RAMPAS)
    angulo = grausDe(rampa.h, rampa.b)
    const tg = rampa.h / rampa.b
    mu = escolher(rng, MUS.filter((x) => Math.abs(tg - x) >= 0.1))
  } else {
    const c: { angulo?: number; rampa?: { h: number; b: number }; mu: number } = rng() < 0.5 ? escolher(rng, IMINENTES) : escolher(rng, PROXIMOS)
    mu = c.mu
    rampa = c.rampa
    angulo = rampa ? grausDe(rampa.h, rampa.b) : (c.angulo as number)
  }
  const tg = rampa ? rampa.h / rampa.b : TG(angulo)
  const v = vereditoPlano(angulo, mu)
  const p = plano({ m, angulo, mu })
  const par = f2(p.paralela)
  const amax = f2(p.atritoMax)
  const tgTxt = f2(tg)
  const muTxt = f2(mu)

  const enunciado = rampa
    ? `Uma rampa tem ${rampa.h} m de altura e ${rampa.b} m de base (medida na horizontal). Um bloco de ${m} kg é solto, a partir do repouso, sobre ela. O coeficiente de atrito entre o bloco e a rampa é μ = ${muTxt} (estático igual ao cinético). O que acontece com o bloco? Use g = 10 m/s².`
    : `Um bloco de ${m} kg é solto, a partir do repouso, sobre um plano inclinado de ${angulo}° com a horizontal. O coeficiente de atrito entre o bloco e o plano é μ = ${muTxt} (estático igual ao cinético). O que acontece com o bloco? Use g = 10 m/s².`

  const comparacao = `tg θ = ${tgTxt} e μ = ${muTxt}`
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  const ids = embaralhar(rng, ['parado', 'desliza', 'iminencia', 'massa'] as const)
  const letras = ['A', 'B', 'C', 'D']
  const letraDe: Record<string, string> = {}
  ids.forEach((id, i) => (letraDe[id] = letras[i] as string))

  const certaTipo: Veredito = v
  const textoCerto: Record<Veredito, string> = {
    desliza: `Isso! A componente do peso ao longo do plano é ${par} N e o atrito máximo é só ${amax} N. Como ${par} > ${amax}, o atrito não aguenta e o bloco desliza. (Em forma resumida: ${comparacao}, e tg θ > μ.)`,
    parado: `Isso! A componente do peso ao longo do plano é ${par} N, menor que o atrito máximo (${amax} N). O atrito estático se ajusta e vale exatamente ${par} N, não ${amax} N, e o bloco fica parado. (${comparacao}: tg θ < μ.)`,
    iminencia: `Isso! A componente do peso ao longo do plano (${par} N) é igual ao atrito máximo (${amax} N): ${comparacao}, tg θ = μ. O bloco fica parado, mas já no limite.`,
  }
  for (const id of ids) {
    const letra = letraDe[id] as string
    if (id === certaTipo) {
      porque[letra] = textoCerto[certaTipo]
      continue
    }
    if (id === 'massa') {
      porque[letra] = 'A massa aparece dos dois lados da comparação (m·g·sen θ contra μ·m·g·cos θ) e se cancela. Sobra tg θ contra μ, que não depende da massa: dobrar o bloco não muda nada.'
      motivo[letra] = 'achou que a massa decide se desliza'
    } else if (id === 'desliza') {
      porque[letra] = v === 'iminencia' ? `Para deslizar, a componente do peso precisaria vencer o atrito máximo, e aqui elas são iguais (${par} N): é a iminência, o bloco ainda não se move.` : `Para deslizar, a componente do peso (${par} N) precisaria vencer o atrito máximo (${amax} N). Aqui ela é menor: o atrito estático dá conta e o bloco fica parado.`
      motivo[letra] = 'esqueceu que o atrito estático se ajusta à força'
    } else if (id === 'parado') {
      porque[letra] = v === 'iminencia' ? `Quase: ele fica parado, mas sem folga nenhuma, porque a componente do peso (${par} N) já é igual ao atrito máximo (${amax} N).` : `Se ficasse parado, o atrito teria de igualar a componente do peso (${par} N), mas o atrito máximo é só ${amax} N. Como ${par} > ${amax}, o bloco desliza.`
      motivo[letra] = 'não comparou a componente do peso com o atrito máximo'
    } else {
      porque[letra] = `Iminência de deslizar só acontece quando a componente do peso é igual ao atrito máximo, ou seja, tg θ = μ. Aqui ${comparacao}: ${v === 'desliza' ? 'tg θ é maior e o bloco desliza' : 'tg θ é menor e sobra folga'}.`
      motivo[letra] = 'confundiu iminência com repouso ou deslizamento'
    }
  }
  const certa = letraDe[certaTipo] as string
  return {
    enunciado,
    opcoes: letras.map((l) => ({ id: l, rotulo: ROTULOS_DESLIZAR[ids[letras.indexOf(l)] as Veredito | 'massa'] })),
    certa,
    porque,
    motivo,
    resolucao: `Ao longo do plano: componente do peso m·g·sen θ = ${par} N (para baixo) e atrito estático máximo μ·m·g·cos θ = ${amax} N (para cima). Dividindo os dois lados por m·g·cos θ, a massa some e a comparação fica tg θ contra μ: ${comparacao}. ${v === 'desliza' ? 'Como tg θ > μ, o bloco desliza.' : v === 'parado' ? 'Como tg θ < μ, o bloco fica parado e o atrito vale só o necessário.' : 'Como tg θ = μ, o bloco está na iminência de deslizar.'}`,
    dicas: [
      'Duas forças disputam ao longo do plano: a componente do peso, que puxa o bloco para baixo, e o atrito, que o segura.',
      'Compare m·g·sen θ com o atrito máximo μ·m·g·cos θ. O que aparece dos dois lados pode ser cortado.',
      rampa ? `Na rampa, tg θ = altura/base = ${rampa.h}/${rampa.b} = ${tgTxt}. Compare com μ = ${muTxt}.` : `Sobra tg θ contra μ. Para θ = ${angulo}°, tg θ = ${tgTxt}.`,
    ],
    licao: 'o bloco desliza se tg θ > μ; a massa não entra na comparação',
    dados: { angulo, mu, m, rampa, veredito: v },
  }
}

/* ------------------------------------------------------------------ força de atrito */

export type CasoAtrito = 'horizontalParado' | 'horizontalDesliza' | 'planoParado' | 'planoDesliza' | 'planoPuxado'

export interface DadosAtrito {
  caso: CasoAtrito
  m: number
  mu: number
  F?: number
  angulo?: number
  /** seno e cosseno anunciados no enunciado (ângulos "notáveis" 3-4-5) */
  sen?: number
  cos?: number
}

const NOTAVEIS = [
  { sen: 0.6, cos: 0.8 },
  { sen: 0.8, cos: 0.6 },
]

function atritoHorizontal(rng: Rng, desliza: boolean): InstanciaNum<DadosAtrito> {
  const m = escolher(rng, [2, 4, 5, 8, 10])
  const mu = escolher(rng, [0.2, 0.25, 0.4, 0.5])
  const Fmax = mu * m * G
  const F = desliza ? Math.ceil(Fmax) + escolher(rng, [5, 10, 15, 20]) : Math.max(1, Math.round(Fmax * escolher(rng, [0.3, 0.5, 0.7])))
  const enunciado = `Um bloco de ${m} kg repousa sobre uma mesa horizontal; o coeficiente de atrito entre eles é μ = ${f2(mu)} (estático igual ao cinético). Uma pessoa empurra o bloco horizontalmente com uma força F = ${F} N. Qual é o módulo da força de atrito que a mesa exerce sobre o bloco? Use g = 10 m/s².`
  const comum = `Normal N = m·g = ${m * G} N, então o atrito máximo é μ·N = ${f2(mu)}·${m * G} = ${f2(Fmax)} N.`
  if (desliza) {
    const resposta = Fmax
    return {
      enunciado,
      resposta,
      tolerancia: 0.01,
      unidade: 'N',
      erros: limpar(
        [
          { valor: F, frase: `${f2(F)} N é a força que a pessoa aplica, não o atrito. Como F vence o atrito máximo, o bloco desliza e o atrito é o cinético: μ·N = ${f2(Fmax)} N.`, motivo: 'confundiu a força aplicada com o atrito' },
          { valor: F - Fmax, frase: `${f2(F - Fmax)} N é a força resultante (F − atrito), a que acelera o bloco, e não o atrito.`, motivo: 'confundiu resultante com atrito' },
        ],
        resposta,
        0.01,
      ),
      resolucao: `${comum} Como F = ${F} N > ${f2(Fmax)} N, o bloco desliza e o atrito vale o seu máximo: ${f2(Fmax)} N.`,
      dicas: ['Primeiro descubra se o bloco se move: compare F com o atrito máximo μ·N.', 'Sobre uma superfície horizontal, a normal é igual ao peso: N = m·g.', 'Se F for maior que μ·N, o bloco desliza e o atrito é μ·N.'],
      licao: 'deslizando, o atrito vale μ·N; parado, ele se ajusta à força aplicada',
      dados: { caso: 'horizontalDesliza', m, mu, F },
    }
  }
  const resposta = F
  return {
    enunciado,
    resposta,
    tolerancia: 0.01,
    unidade: 'N',
    erros: limpar(
      [
        { valor: Fmax, frase: `${f2(Fmax)} N é o atrito máximo possível, e só atua quando o bloco está prestes a escorregar. Como F = ${F} N é menor, o bloco fica parado e o atrito é do tamanho exato de F.`, motivo: 'usou μ·N com o bloco parado' },
        { valor: 0, frase: 'Sem atrito, a força F aceleraria o bloco. Se ele está parado, algo equilibra F, e esse algo é o atrito.', motivo: 'achou que parado não há atrito' },
      ],
      resposta,
      0.01,
      true,
    ),
    resolucao: `${comum} Como F = ${F} N < ${f2(Fmax)} N, o bloco não sai do lugar. Parado, a resultante é zero: o atrito é igual a F, ou seja, ${F} N.`,
    dicas: ['Primeiro descubra se o bloco se move: compare F com o atrito máximo μ·N.', 'Sobre uma superfície horizontal, a normal é igual ao peso: N = m·g.', 'Se o bloco não se move, a resultante é zero: o atrito é igual à força que tenta movê-lo.'],
    licao: 'deslizando, o atrito vale μ·N; parado, ele se ajusta à força aplicada',
    dados: { caso: 'horizontalParado', m, mu, F },
  }
}

function atritoPlano(rng: Rng, desliza: boolean): InstanciaNum<DadosAtrito> {
  const m = escolher(rng, [2, 4, 5, 10])
  // parado: aceita também 30° (cos 30° não é necessário); deslizando só os ângulos 3-4-5
  const usar30 = !desliza && rng() < 0.4
  const nota = usar30 ? { sen: 0.5, cos: Math.sqrt(3) / 2 } : escolher(rng, NOTAVEIS)
  const angulo = usar30 ? 30 : grausDe(nota.sen, nota.cos)
  const mus = [0.2, 0.25, 0.3, 0.5, 0.8, 1, 1.5, 2].filter((mu) => plano({ m, angulo, mu }).desliza === desliza && Math.abs(TG(angulo) - mu) > 0.1)
  const mu = escolher(rng, mus)
  const p = plano({ m, angulo, mu })
  const peso = m * G
  const descAng = usar30 ? 'de 30°' : `de ângulo θ, com sen θ = ${f2(nota.sen)} e cos θ = ${f2(nota.cos)}`
  const enunciado = `Um bloco de ${m} kg está sobre um plano inclinado ${descAng}. O coeficiente de atrito entre eles é μ = ${f2(mu)} (estático igual ao cinético) e o bloco é ${desliza ? 'solto e desliza' : 'solto e fica em repouso'}. Qual é o módulo da força de atrito sobre o bloco? Use g = 10 m/s².`
  const base = `Componente do peso ao longo do plano: m·g·sen θ = ${f2(p.paralela)} N. Normal: N = m·g·cos θ = ${f2(p.normal)} N. Atrito máximo: μ·N = ${f2(p.atritoMax)} N.`
  if (desliza) {
    return {
      enunciado,
      resposta: p.atritoMax,
      tolerancia: 0.05,
      unidade: 'N',
      erros: limpar(
        [
          { valor: p.paralela, frase: `${f2(p.paralela)} N é a componente do peso ao longo do plano, a força que puxa o bloco para baixo. O atrito, com o bloco deslizando, é μ·N = ${f2(p.atritoMax)} N.`, motivo: 'confundiu a componente do peso com o atrito' },
          { valor: p.paralela - p.atritoMax, frase: `${f2(p.paralela - p.atritoMax)} N é a resultante ao longo do plano (componente do peso menos atrito), a que acelera o bloco, e não o atrito.`, motivo: 'confundiu resultante com atrito' },
          { valor: mu * peso, frase: `Você usou μ·m·g, como se o plano fosse horizontal. No plano inclinado a normal é m·g·cos θ = ${f2(p.normal)} N, menor que o peso.`, motivo: 'usou o peso no lugar da normal' },
        ],
        p.atritoMax,
        0.05,
      ),
      resolucao: `${base} Como ${f2(p.paralela)} N > ${f2(p.atritoMax)} N, o bloco desliza e o atrito é o máximo: μ·N = ${f2(p.atritoMax)} N.`,
      dicas: ['Primeiro descubra se desliza: compare a componente do peso ao longo do plano com o atrito máximo.', 'A normal no plano inclinado é N = m·g·cos θ, e não o peso inteiro.', 'Deslizando, o atrito vale μ·N.'],
      licao: 'no plano inclinado, N = m·g·cos θ; deslizando, f = μ·N',
      dados: { caso: 'planoDesliza', m, mu, angulo, sen: nota.sen, cos: nota.cos },
    }
  }
  return {
    enunciado,
    resposta: p.paralela,
    tolerancia: 0.05,
    unidade: 'N',
    erros: limpar(
      [
        { valor: p.atritoMax, frase: `${f2(p.atritoMax)} N é o atrito máximo possível, mas o bloco está parado. O atrito estático só precisa equilibrar a componente do peso: ${f2(p.paralela)} N.`, motivo: 'usou μ·N com o bloco parado' },
        { valor: p.normal, frase: `${f2(p.normal)} N é a normal (m·g·cos θ), que é perpendicular ao plano. O atrito é paralelo ao plano e equilibra m·g·sen θ.`, motivo: 'confundiu a normal com o atrito' },
        { valor: peso, frase: `${f2(peso)} N é o peso inteiro. Só a componente do peso ao longo do plano (m·g·sen θ) precisa ser equilibrada pelo atrito.`, motivo: 'usou o peso inteiro' },
      ],
      p.paralela,
      0.05,
    ),
    resolucao: `${base} Como ${f2(p.paralela)} N < ${f2(p.atritoMax)} N, o bloco não desliza. Parado, a resultante ao longo do plano é zero: o atrito iguala a componente do peso, ${f2(p.paralela)} N (e não o máximo ${f2(p.atritoMax)} N).`,
    dicas: ['Primeiro descubra se desliza: compare a componente do peso ao longo do plano com o atrito máximo.', 'Parado, a resultante ao longo do plano é zero.', 'O atrito estático vale só o necessário para equilibrar m·g·sen θ.'],
    licao: 'parado no plano, o atrito iguala m·g·sen θ (não μ·N)',
    dados: { caso: 'planoParado', m, mu, angulo, sen: nota.sen, cos: nota.cos },
  }
}

function atritoPuxado(rng: Rng): InstanciaNum<DadosAtrito> {
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const m = escolher(rng, [2, 4, 5, 10])
    const nota = escolher(rng, NOTAVEIS)
    const angulo = grausDe(nota.sen, nota.cos)
    const mu = escolher(rng, [0.5, 0.75, 1, 1.5])
    const p = plano({ m, angulo, mu })
    const F = Math.round(p.paralela) + escolher(rng, [-12, -8, -5, -3, 3, 5, 8, 12])
    const atrito = Math.abs(p.paralela - F)
    if (F <= 0 || atrito < 1 || atrito > 0.85 * p.atritoMax) continue
    const sobe = F > p.paralela
    return {
      enunciado: `Um bloco de ${m} kg está sobre um plano inclinado de ângulo θ, com sen θ = ${f2(nota.sen)} e cos θ = ${f2(nota.cos)}. Um fio paralelo ao plano o puxa para cima com uma força de ${F} N. O coeficiente de atrito é μ = ${f2(mu)} e o bloco permanece em repouso. Qual é o módulo da força de atrito sobre o bloco? Use g = 10 m/s².`,
      resposta: atrito,
      tolerancia: 0.05,
      unidade: 'N',
      erros: limpar(
        [
          { valor: p.paralela, frase: `${f2(p.paralela)} N é a componente do peso ao longo do plano. Você esqueceu que o fio também puxa o bloco: o atrito equilibra a diferença entre essa componente e a tração.`, motivo: 'ignorou a força do fio' },
          { valor: p.atritoMax, frase: `${f2(p.atritoMax)} N é o atrito máximo possível. O bloco está parado, então o atrito vale só o necessário para a resultante ser zero.`, motivo: 'usou μ·N com o bloco parado' },
          { valor: F, frase: `${F} N é a tração do fio. O atrito é o que falta para equilibrar: |m·g·sen θ − F|.`, motivo: 'confundiu a tração com o atrito' },
          { valor: p.paralela + F, frase: 'Você somou a componente do peso com a tração, mas essas forças apontam em sentidos opostos ao longo do plano.', motivo: 'somou forças de sentidos opostos' },
        ],
        atrito,
        0.05,
      ),
      resolucao: `Componente do peso ao longo do plano: m·g·sen θ = ${f2(p.paralela)} N (para baixo). O fio puxa ${F} N para cima. Parado, a resultante é zero, então o atrito equilibra a diferença: |${f2(p.paralela)} − ${F}| = ${f2(atrito)} N, ${sobe ? 'apontando para baixo, ao longo do plano (o fio vence a componente do peso, e o atrito segura o bloco para não subir)' : 'apontando para cima, ao longo do plano (a componente do peso vence o fio, e o atrito segura o bloco para não descer)'}. Confira: ${f2(atrito)} N é menor que o atrito máximo ${f2(p.atritoMax)} N.`,
      dicas: ['Desenhe as forças ao longo do plano: componente do peso, fio e atrito.', 'Parado, a resultante ao longo do plano é zero.', 'O atrito é a diferença entre a componente do peso (m·g·sen θ) e a tração do fio.'],
      licao: 'parado, o atrito equilibra o que sobra das outras forças ao longo da superfície',
      dados: { caso: 'planoPuxado', m, mu, F, angulo, sen: nota.sen, cos: nota.cos },
    }
  }
  throw new Error('não foi possível gerar o caso de plano puxado')
}

export function gerarAtrito(rng: Rng, nivel: Nivel): InstanciaNum<DadosAtrito> {
  if (nivel === 1) return atritoHorizontal(rng, rng() < 0.5)
  if (nivel === 2) return atritoPlano(rng, rng() < 0.5)
  return rng() < 0.4 ? atritoPlano(rng, true) : atritoPuxado(rng)
}

/* ------------------------------------------------------------------ aceleração do sistema */

export type Pede = 'a' | 'T'

export interface DadosSistema {
  tipo: 'atwood' | 'mesa'
  m1: number
  m2: number
  mu: number
  pede: Pede
}

const ehBonito = (x: number) => Math.abs(x * 10 - Math.round(x * 10)) < 1e-9

interface CandSistema {
  m1: number
  m2: number
  mu: number
}

function candidatos(tipo: 'atwood' | 'mesa', mus: number[]): CandSistema[] {
  const lista: CandSistema[] = []
  for (let m1 = 1; m1 <= 10; m1++) {
    for (let m2 = 1; m2 <= 10; m2++) {
      if (tipo === 'atwood') {
        if (m1 <= m2) continue
        const r = atwood(m1, m2)
        if (ehBonito(r.a) && ehBonito(r.T)) lista.push({ m1, m2, mu: 0 })
      } else {
        // massas iguais fazem vários erros típicos coincidirem entre si
        if (m1 === m2) continue
        for (const mu of mus) {
          const r = mesaComPolia(m1, m2, mu)
          if (r.desliza && r.a >= 0.5 && ehBonito(r.a) && ehBonito(r.T)) lista.push({ m1, m2, mu })
        }
      }
    }
  }
  return lista
}

const CAND_ATWOOD = candidatos('atwood', [])
const CAND_LISA = candidatos('mesa', [0])
const CAND_ATRITO = candidatos('mesa', [0.1, 0.2, 0.25, 0.3, 0.4, 0.5])

export function gerarSistema(rng: Rng, nivel: Nivel): InstanciaNum<DadosSistema> {
  const pede: Pede = nivel === 1 ? 'a' : rng() < 0.5 ? 'a' : 'T'
  const tipo: 'atwood' | 'mesa' = nivel === 1 ? 'atwood' : nivel === 2 ? (rng() < 0.5 ? 'atwood' : 'mesa') : 'mesa'
  const c = escolher(rng, tipo === 'atwood' ? CAND_ATWOOD : nivel === 2 ? CAND_LISA : CAND_ATRITO)
  const { m1, m2, mu } = c
  const total = m1 + m2

  if (tipo === 'atwood') {
    const r = atwood(m1, m2)
    const resposta = pede === 'a' ? r.a : r.T
    const enunciado = `Dois blocos, de ${m1} kg e ${m2} kg, estão presos às pontas de um fio ideal que passa por uma polia sem atrito. Soltos do repouso, o bloco maior desce e o menor sobe. ${pede === 'a' ? 'Qual é o módulo da aceleração dos blocos?' : 'Qual é a tração no fio?'} Use g = 10 m/s².`
    const erros: ErroTipico[] =
      pede === 'a'
        ? [
            { valor: ((m1 - m2) * G) / m1, frase: `Você dividiu só pela massa do bloco maior (${m1} kg). Como o fio é inextensível, os dois blocos aceleram juntos: a massa total é ${m1} + ${m2} = ${total} kg.`, motivo: 'dividiu só por uma das massas' },
            { valor: G, frase: 'a = g só vale em queda livre. Aqui o fio segura o bloco maior e ainda precisa levantar o menor, então a aceleração é menor que g.', motivo: 'tratou como queda livre' },
            { valor: (m1 * G) / total, frase: `Você usou só o peso do bloco maior como força motora. O peso do bloco menor puxa para o outro lado e deve ser subtraído: (${m1} − ${m2})·10.`, motivo: 'esqueceu de subtrair o peso do outro bloco' },
            { valor: ((m1 - m2) * G) / (m1 * m2), frase: 'O denominador deve ser a soma das massas (elas se movem juntas), e não o produto.', motivo: 'usou o produto das massas' },
          ]
        : [
            { valor: m1 * G, frase: `${m1 * G} N é o peso do bloco maior. Se a tração fosse igual ao peso dele, ele ficaria sem aceleração. Como ele desce acelerando, a tração é menor que o peso.`, motivo: 'tração igual ao peso do bloco que desce' },
            { valor: m2 * G, frase: `${m2 * G} N é o peso do bloco menor. Ele sobe acelerando, então a tração precisa ser maior que o peso dele.`, motivo: 'tração igual ao peso do bloco que sobe' },
            { valor: ((m1 + m2) * G) / 2, frase: 'Não existe média dos pesos aqui. Aplique a 2ª lei a um dos blocos: a tração é o que sobra da conta m·(g ± a).', motivo: 'usou a média dos pesos' },
          ]
    return {
      enunciado,
      resposta,
      tolerancia: 0.02,
      unidade: pede === 'a' ? 'm/s²' : 'N',
      erros: limpar(erros, resposta, 0.02),
      resolucao: `Bloco de ${m1} kg (desce): ${m1}·10 − T = ${m1}·a. Bloco de ${m2} kg (sobe): T − ${m2}·10 = ${m2}·a. Somando as duas equações, o T some: ${(m1 - m2) * G} = ${total}·a, logo a = ${f2(r.a)} m/s². Substituindo no bloco que sobe: T = ${m2}·(10 + ${f2(r.a)}) = ${f2(r.T)} N.`,
      dicas: ['Escreva a 2ª lei (F_res = m·a) para cada bloco, escolhendo o sentido do movimento como positivo.', 'Como o fio é ideal, a tração é a mesma nas duas pontas e os dois blocos têm a mesma aceleração.', 'Some as duas equações para eliminar T.'],
      licao: 'em sistemas ligados por fio: uma equação F_res = m·a por corpo, somar para eliminar a tração',
      dados: { tipo, m1, m2, mu: 0, pede },
    }
  }

  const r = mesaComPolia(m1, m2, mu)
  const resposta = pede === 'a' ? r.a : r.T
  const lisa = mu === 0
  const enunciado = `Um bloco de ${m1} kg apoiado sobre uma mesa horizontal está ligado, por um fio ideal que passa por uma polia sem atrito na borda da mesa, a um bloco de ${m2} kg pendurado. ${lisa ? 'A mesa é perfeitamente lisa.' : `O coeficiente de atrito entre o bloco e a mesa é μ = ${f2(mu)}.`} Soltos do repouso, ${pede === 'a' ? 'qual é o módulo da aceleração dos blocos?' : 'qual é a tração no fio?'} Use g = 10 m/s².`
  const semAtrito = mesaComPolia(m1, m2, 0)
  const erros: ErroTipico[] =
    pede === 'a'
      ? [
          { valor: G, frase: 'a = g só vale em queda livre. O bloco pendurado também precisa arrastar o bloco da mesa, então a aceleração é menor que g.', motivo: 'tratou o pendurado como queda livre' },
          { valor: (m2 * G) / m1, frase: `Você dividiu só pela massa do bloco da mesa (${m1} kg). O bloco pendurado também acelera, então a massa total é ${total} kg.`, motivo: 'dividiu só por uma das massas' },
          { valor: (m1 * G) / total, frase: `Você trocou os papéis: quem puxa o sistema é o peso do bloco pendurado (${m2} kg), e não o do bloco da mesa (${m1} kg), que está apoiado e só é arrastado.`, motivo: 'trocou as massas' },
          ...(lisa ? [] : [{ valor: semAtrito.a, frase: `Esse valor é o do caso sem atrito. O atrito μ·m·g = ${f2(mu * m1 * G)} N se opõe ao movimento e precisa ser subtraído da força motora (o peso do bloco pendurado, ${m2 * G} N).`, motivo: 'esqueceu o atrito' }]),
          ...(lisa ? [] : [{ valor: (m2 * G - mu * m1 * G) / m1, frase: `Você dividiu só pela massa do bloco da mesa. A massa que acelera é ${total} kg, os dois blocos juntos.`, motivo: 'dividiu só por uma das massas' }]),
        ]
      : [
          { valor: m2 * G, frase: `${m2 * G} N é o peso do bloco pendurado. A tração só seria igual ao peso dele se ele ficasse parado ou descesse com velocidade constante. Aqui ele acelera para baixo, então a tração é menor.`, motivo: 'tração igual ao peso do pendurado' },
          { valor: m1 * G, frase: `${m1 * G} N é o peso do bloco da mesa, mas a tração não tem relação direta com o peso dele: ele está apoiado. A tração é o que o fio faz para acelerar esse bloco (e vencer o atrito).`, motivo: 'confundiu a tração com o peso do bloco da mesa' },
          { valor: m2 * r.a, frase: `Você multiplicou a aceleração pela massa do bloco pendurado, mas a tração é a força que acelera o bloco da mesa (${m1} kg, mais o atrito): T = ${lisa ? 'm·a' : 'μ·m·g + m·a'} com m = ${m1} kg.`, motivo: 'usou a massa do bloco errado' },
          ...(lisa ? [] : [{ valor: semAtrito.T, frase: `Esse valor é o do caso sem atrito. Com atrito a aceleração é menor, e a tração muda.`, motivo: 'esqueceu o atrito' }]),
          ...(lisa ? [] : [{ valor: mu * m1 * G, frase: `${f2(mu * m1 * G)} N é só o atrito. A tração precisa vencer o atrito e ainda acelerar o bloco da mesa: T = μ·m·g + m·a.`, motivo: 'confundiu tração com atrito' }]),
        ]
  return {
    enunciado,
    resposta,
    tolerancia: 0.02,
    unidade: pede === 'a' ? 'm/s²' : 'N',
    erros: limpar(erros, resposta, 0.02),
    resolucao: lisa
      ? `Bloco pendurado: ${m2}·10 − T = ${m2}·a. Bloco da mesa (só a tração faz força horizontal): T = ${m1}·a. Somando: ${m2 * G} = ${total}·a, logo a = ${f2(r.a)} m/s². Então T = ${m1}·${f2(r.a)} = ${f2(r.T)} N.`
      : `Atrito cinético: μ·m·g = ${f2(mu)}·${m1}·10 = ${f2(mu * m1 * G)} N. Bloco pendurado: ${m2}·10 − T = ${m2}·a. Bloco da mesa: T − ${f2(mu * m1 * G)} = ${m1}·a. Somando: ${m2 * G} − ${f2(mu * m1 * G)} = ${total}·a, logo a = ${f2(r.a)} m/s². Então T = ${m2}·(10 − ${f2(r.a)}) = ${f2(r.T)} N.`,
    dicas: ['Escreva a 2ª lei para cada bloco. No pendurado: peso − T = m·a. Na mesa: T − atrito = m·a.', 'O fio é ideal e inextensível: mesma tração e mesma aceleração nos dois blocos.', 'Some as equações para eliminar T. Depois use a para achar T.'],
    licao: 'uma equação F_res = m·a por corpo; a tração aparece com sinais opostos e some na soma',
    dados: { tipo, m1, m2, mu, pede },
  }
}
