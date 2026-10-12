import { BANCO_BONUS, BANCO_FASE, BANCO_PIRAMIDE } from '@/conteudo/geografia/populacao'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { doBanco } from '../comum/banco'
import {
  crescimentoNatural,
  formaDaPiramide,
  grupos,
  indiceEnvelhecimento,
  piramideModelo,
  projetar,
  razaoDependencia,
  razaoIdosos,
  razaoJovens,
  taxaMedia,
  tempoDuplicacao70,
  type Fase,
  type FormaPiramide,
  type Grupos,
  type ParamsPiramide,
  type Piramide,
} from './calculo'
import type { PontoRazao } from './Visuais'

/** Dados enviados ao desenho: uma pirâmide (os números do enunciado saem dela). */
export interface DadosPiramide {
  piramide: Piramide
}
/** Para perguntas com várias miniaturas: a pirâmide de cada alternativa (A, B, C...). */
export interface DadosMiniaturas {
  piramides: Piramide[]
}

/* ------------------------------------------------------------------ pirâmides sorteadas */

/** Faixas de fecundidade e de esperança de vida de cada fase, escolhidas para a forma da pirâmide ser a esperada. */
const FAIXAS_FASE: Record<Fase, { fec: [number, number]; esp: [number, number] }> = {
  1: { fec: [5.5, 7], esp: [38, 48] },
  2: { fec: [4.5, 5.5], esp: [50, 60] },
  3: { fec: [2.3, 3], esp: [66, 74] },
  4: { fec: [1.2, 1.5], esp: [80, 84] },
}

const entre = (rng: Rng, a: number, b: number, casas = 1) => {
  const k = Math.pow(10, casas)
  return Math.round((a + rng() * (b - a)) * k) / k
}

export function parametrosDaFase(rng: Rng, fase: Fase): ParamsPiramide {
  const fx = FAIXAS_FASE[fase]
  return { fecundidade: entre(rng, fx.fec[0], fx.fec[1]), expectativa: entre(rng, fx.esp[0], fx.esp[1], 0) }
}

export const piramideDaFase = (rng: Rng, fase: Fase) => piramideModelo(parametrosDaFase(rng, fase))

/** Pirâmide de um país qualquer: a esperança de vida acompanha a fecundidade (com folga), como na transição. */
function parametrosLivres(rng: Rng): ParamsPiramide {
  const fecundidade = entre(rng, 1.2, 6.5)
  const expectativa = Math.round(Math.min(84, Math.max(40, 84 - (fecundidade - 1.2) * 7.5 + (rng() - 0.5) * 8)))
  return { fecundidade, expectativa }
}

const pct = (n: number) => `${fn(n, 1)}%`

/* ------------------------------------------------------------------ razões de dependência */

type TipoRazao = 'dependencia' | 'envelhecimento' | 'absolutos'

export interface DadosRazao extends DadosPiramide {
  tipo: TipoRazao
}

export function gerarRazao(rng: Rng, nivel: Nivel): InstanciaNum<DadosRazao> {
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const fase = escolher<Fase>(rng, nivel === 2 ? [2, 3, 4] : [2, 3, 3, 4])
    const piramide = piramideDaFase(rng, fase)
    const g = grupos(piramide)
    const tol = 0.6
    if (nivel === 1) {
      const resposta = razaoDependencia(g)
      const erros = limpar(
        [
          { valor: razaoJovens(g), frase: `${fn(razaoJovens(g), 1)} é só a razão de jovens (jovens ÷ adultos). A razão de dependência soma jovens e idosos no numerador.`, motivo: 'só os jovens' },
          { valor: razaoIdosos(g), frase: `${fn(razaoIdosos(g), 1)} é só a razão de idosos (idosos ÷ adultos). Faltaram os jovens no numerador.`, motivo: 'só os idosos' },
          { valor: g.jovens + g.idosos, frase: `${fn(g.jovens + g.idosos, 1)} é o percentual de dependentes. Falta dividir pelos adultos (${pct(g.adultos)}) e multiplicar por 100.`, motivo: 'esqueceu de dividir pelos adultos' },
          { valor: (g.adultos / (g.jovens + g.idosos)) * 100, frase: 'Você inverteu a fração: o numerador são os dependentes (jovens + idosos) e o denominador, os adultos.', motivo: 'inverteu a razão' },
        ],
        resposta,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Uma população tem ${pct(g.jovens)} de jovens (0 a 14 anos), ${pct(g.adultos)} de adultos (15 a 64 anos) e ${pct(g.idosos)} de idosos (65 anos ou mais). Qual é a razão de dependência? Arredonde para o inteiro mais próximo.`,
        resposta,
        tolerancia: tol,
        unidade: 'dependentes por 100 adultos',
        erros,
        resolucao: `Dependentes = jovens + idosos = ${fn(g.jovens, 1)} + ${fn(g.idosos, 1)} = ${fn(g.jovens + g.idosos, 1)}. RD = ${fn(g.jovens + g.idosos, 1)} ÷ ${fn(g.adultos, 1)} × 100 ≈ ${fn(resposta, 1)}: são cerca de ${fn(resposta, 0)} dependentes para cada 100 pessoas em idade ativa.`,
        dicas: ['Dependentes são os jovens (0 a 14) e os idosos (65 ou mais).', 'A razão compara os dependentes com os adultos de 15 a 64 anos.', 'RD = (jovens + idosos) ÷ adultos × 100.'],
        licao: 'Razão de dependência = (jovens + idosos) ÷ adultos × 100.',
        dados: { piramide, tipo: 'dependencia' },
      }
    }
    if (nivel === 2) {
      const resposta = indiceEnvelhecimento(g)
      const tolN = Math.max(0.6, resposta * 0.01)
      const erros = limpar(
        [
          { valor: (g.jovens / g.idosos) * 100, frase: 'Você inverteu: o índice de envelhecimento é idosos ÷ jovens, não jovens ÷ idosos.', motivo: 'inverteu o índice' },
          { valor: razaoIdosos(g), frase: `${fn(razaoIdosos(g), 1)} é a razão de idosos (idosos ÷ adultos). O índice de envelhecimento compara idosos com jovens.`, motivo: 'dividiu pelos adultos' },
          { valor: g.idosos, frase: `${pct(g.idosos)} é só o percentual de idosos. Falta dividir pelo percentual de jovens e multiplicar por 100.`, motivo: 'deu só o percentual de idosos' },
          { valor: razaoDependencia(g), frase: `${fn(razaoDependencia(g), 1)} é a razão de dependência total. O índice de envelhecimento compara só idosos e jovens.`, motivo: 'confundiu com a razão de dependência' },
        ],
        resposta,
        tolN,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Uma população tem ${pct(g.jovens)} de jovens (0 a 14 anos), ${pct(g.adultos)} de adultos (15 a 64 anos) e ${pct(g.idosos)} de idosos (65 anos ou mais). Qual é o índice de envelhecimento (idosos para cada 100 jovens)? Arredonde para o inteiro mais próximo.`,
        resposta,
        tolerancia: tolN,
        unidade: 'idosos por 100 jovens',
        erros,
        resolucao: `IE = idosos ÷ jovens × 100 = ${fn(g.idosos, 1)} ÷ ${fn(g.jovens, 1)} × 100 ≈ ${fn(resposta, 1)}. ${resposta > 100 ? 'Há mais idosos do que jovens.' : 'Ainda há mais jovens do que idosos.'}`,
        dicas: ['O índice compara os dois extremos da pirâmide: topo (idosos) e base (jovens).', 'Idosos no numerador, jovens no denominador.', 'IE = idosos ÷ jovens × 100.'],
        licao: 'Índice de envelhecimento = idosos ÷ jovens × 100. Passa de 100 quando há mais idosos do que jovens.',
        dados: { piramide, tipo: 'envelhecimento' },
      }
    }
    // nível 3: números absolutos, em milhares, que precisam ser somados
    const k = sortear(rng, 60, 400)
    const total = k * 100
    const mil = (i: number) => Math.round(((piramide.homens[i] as number) + (piramide.mulheres[i] as number)) * (total / 100))
    const jov = [mil(0), mil(1), mil(2)]
    const ido = [mil(13), mil(14), mil(15), mil(16)]
    let adu = 0
    for (let i = 3; i <= 12; i++) adu += mil(i)
    const J = jov.reduce((a, b) => a + b, 0)
    const I = ido.reduce((a, b) => a + b, 0)
    const resposta = ((J + I) / adu) * 100
    const erros = limpar(
      [
        { valor: ((J + (ido[0] as number)) / adu) * 100, frase: 'Você usou só a faixa de 65 a 69 anos para os idosos. Some as quatro faixas (65–69, 70–74, 75–79 e 80 ou mais).', motivo: 'esqueceu faixas de idosos' },
        { valor: (((jov[0] as number) + (jov[1] as number) + I) / adu) * 100, frase: 'Faltou a faixa de 10 a 14 anos entre os jovens. Os jovens têm três faixas.', motivo: 'esqueceu uma faixa de jovens' },
        { valor: (J / adu) * 100, frase: 'Você calculou só a razão de jovens. Some também os idosos no numerador.', motivo: 'só os jovens' },
        { valor: ((J + I) / (J + I + adu)) * 100, frase: 'Você dividiu pela população total. A razão de dependência divide pelos adultos (15 a 64 anos).', motivo: 'dividiu pelo total' },
      ],
      resposta,
      tol,
    )
    if (erros.length < 2) continue
    return {
      enunciado: `Em uma população, em milhares de pessoas, há: 0–4 anos: ${fn(jov[0] as number, 0)}; 5–9: ${fn(jov[1] as number, 0)}; 10–14: ${fn(jov[2] as number, 0)}; adultos de 15 a 64 anos (total): ${fn(adu, 0)}; 65–69: ${fn(ido[0] as number, 0)}; 70–74: ${fn(ido[1] as number, 0)}; 75–79: ${fn(ido[2] as number, 0)}; 80 ou mais: ${fn(ido[3] as number, 0)}. Qual é a razão de dependência? Arredonde para o inteiro mais próximo.`,
      resposta,
      tolerancia: tol,
      unidade: 'dependentes por 100 adultos',
      erros,
      resolucao: `Jovens: ${jov.map((v) => fn(v, 0)).join(' + ')} = ${fn(J, 0)} mil. Idosos: ${ido.map((v) => fn(v, 0)).join(' + ')} = ${fn(I, 0)} mil. RD = (${fn(J, 0)} + ${fn(I, 0)}) ÷ ${fn(adu, 0)} × 100 ≈ ${fn(resposta, 1)}.`,
      dicas: ['Primeiro some as faixas de cada grupo: jovens (três faixas) e idosos (quatro faixas).', 'Os adultos já vêm somados.', 'RD = (jovens + idosos) ÷ adultos × 100.'],
      licao: 'Antes de calcular, agrupe: jovens (0–14), adultos (15–64) e idosos (65+). Depois use RD = (jovens + idosos) ÷ adultos × 100.',
      dados: undefined,
    }
  }
  throw new Error('não foi possível gerar a razão de dependência')
}

/* ------------------------------------------------------------------ crescimento */

type TipoCrescimento = 'natural' | 'duplicacao' | 'projecao' | 'taxa'
export interface DadosCrescimento {
  tipo: TipoCrescimento
}

export function gerarCrescimento(rng: Rng, nivel: Nivel): InstanciaNum<DadosCrescimento> {
  for (let tentativa = 0; tentativa < 80; tentativa++) {
    const natalidade = sortear(rng, 20, 46)
    const mortalidade = sortear(rng, 5, natalidade - 8)
    const diff = natalidade - mortalidade
    const cn = crescimentoNatural(natalidade, mortalidade)
    if (nivel === 1) {
      const tol = 0.05
      const erros = limpar(
        [
          { valor: diff, frase: `${fn(diff, 0)} é a diferença em por mil. Para passar para porcentagem, divida por 10 (10 por mil = 1%).`, motivo: 'não converteu por mil em %' },
          { valor: diff / 100, frase: 'Você dividiu por 100. Por mil → % é dividir por 10, porque 1% = 10 por mil.', motivo: 'dividiu por 100' },
          { valor: (natalidade + mortalidade) / 10, frase: 'Você somou as duas taxas. O crescimento natural é a diferença: natalidade menos mortalidade.', motivo: 'somou em vez de subtrair' },
        ],
        cn,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Um país tem taxa de natalidade de ${natalidade} por mil e taxa de mortalidade de ${mortalidade} por mil. Qual é o crescimento natural da população, em % ao ano?`,
        resposta: cn,
        tolerancia: tol,
        unidade: '% ao ano',
        erros,
        resolucao: `Natalidade − mortalidade = ${natalidade} − ${mortalidade} = ${diff} por mil. Como 10 por mil = 1%, dividimos por 10: ${fn(cn, 1)}% ao ano.`,
        dicas: ['Crescimento natural = natalidade − mortalidade.', 'As duas taxas estão em “por mil”.', 'Para passar de por mil para %, divida por 10.'],
        licao: 'Crescimento natural (% ao ano) = (natalidade − mortalidade) ÷ 10, com as taxas em por mil.',
        dados: { tipo: 'natural' },
      }
    }
    if (nivel === 2) {
      const resposta = tempoDuplicacao70(cn)
      const tol = 0.6
      const erros = limpar(
        [
          { valor: cn, frase: `${fn(cn, 1)} é a taxa de crescimento (em %), não o tempo. O tempo é 70 dividido pela taxa.`, motivo: 'deu a taxa em vez do tempo' },
          { valor: 70 / diff, frase: `Você usou a diferença em por mil (${diff}). A regra dos 70 pede a taxa em %: primeiro divida por 10.`, motivo: 'usou por mil na regra dos 70' },
          { valor: 70 * cn, frase: 'Você multiplicou por 70. O tempo para dobrar é 70 dividido pela taxa: taxa maior, tempo menor.', motivo: 'multiplicou em vez de dividir' },
          { valor: 100 / cn, frase: 'A regra é dos 70, e não dos 100. Ela vem de ln(2) ≈ 0,69.', motivo: 'usou 100 no lugar de 70' },
        ],
        resposta,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Um país tem natalidade de ${natalidade} por mil e mortalidade de ${mortalidade} por mil (sem migração). Pela regra dos 70, em quantos anos a população dobra? Arredonde para o inteiro mais próximo.`,
        resposta,
        tolerancia: tol,
        unidade: 'anos',
        erros,
        resolucao: `Crescimento: (${natalidade} − ${mortalidade}) ÷ 10 = ${fn(cn, 1)}% ao ano. Tempo ≈ 70 ÷ ${fn(cn, 1)} ≈ ${fn(resposta, 1)} anos.`,
        dicas: ['Primeiro ache o crescimento natural em % ao ano.', 'A regra dos 70: tempo para dobrar ≈ 70 ÷ taxa (em % ao ano).', `Natalidade − mortalidade = ${diff} por mil = ${fn(cn, 1)}%.`],
        licao: 'Regra dos 70: tempo para dobrar ≈ 70 ÷ taxa (% ao ano). Taxa maior, tempo menor.',
        dados: { tipo: 'duplicacao' },
      }
    }
    if (rng() < 0.5) {
      const p0 = sortear(rng, 5, 90)
      const r = escolher(rng, [1.5, 1.8, 2, 2.5, 3])
      const t = escolher(rng, [20, 25, 30, 35, 40])
      const resposta = projetar(p0, r, t)
      const tol = Math.max(0.2, resposta * 0.005)
      const erros = limpar(
        [
          { valor: p0 * (1 + (r * t) / 100), frase: `Você tratou o crescimento como linear (P₀ × (1 + r·t) = ${fn(p0 * (1 + (r * t) / 100), 1)}). O crescimento é composto: a taxa incide sobre o total do ano anterior, e o resultado é maior.`, motivo: 'tratou o crescimento como linear' },
          { valor: p0 * (1 + r / 100), frase: 'Você calculou só um ano de crescimento. É preciso aplicar a taxa durante todos os anos.', motivo: 'calculou só um ano' },
          { valor: p0 * (r / 100) * t, frase: 'Você calculou só o aumento (acréscimo linear); falta somar a população inicial e considerar o crescimento composto.', motivo: 'calculou só o acréscimo' },
        ],
        resposta,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Um país tem ${p0} milhões de habitantes e cresce ${fn(r, 1)}% ao ano (crescimento composto). Quantos milhões de habitantes terá em ${t} anos? Dê o valor em milhões.`,
        resposta,
        tolerancia: tol,
        unidade: 'milhões',
        erros,
        resolucao: `P = P₀ × (1 + r/100)ᵗ = ${p0} × ${fn(1 + r / 100, 3)}^${t} ≈ ${fn(resposta, 1)} milhões. (O crescimento linear daria ${fn(p0 * (1 + (r * t) / 100), 1)}, menos.)`,
        dicas: ['Cada ano a população é multiplicada por (1 + r/100).', `Fator anual: ${fn(1 + r / 100, 3)}. Aplique durante ${t} anos: eleve o fator a ${t}.`, 'P = P₀ × (1 + r/100)ᵗ. Use a calculadora para a potência.'],
        licao: 'Crescimento composto: P = P₀ × (1 + r/100)ᵗ.',
        dados: { tipo: 'projecao' },
      }
    }
    const p0 = sortear(rng, 100, 200)
    const r = escolher(rng, [1, 1.2, 1.5, 1.8, 2, 2.4])
    const t = escolher(rng, [10, 12, 15, 20])
    const p1 = Math.round(projetar(p0, r, t))
    const resposta = taxaMedia(p0, p1, t)
    const tol = 0.03
    const erros = limpar(
      [
        { valor: ((p1 - p0) / p0 / t) * 100, frase: 'Você dividiu o crescimento total pelo número de anos (média linear). A taxa composta é menor: r = (P₁/P₀)^(1/t) − 1.', motivo: 'tratou o crescimento como linear' },
        { valor: ((p1 - p0) / p0) * 100, frase: `${fn(((p1 - p0) / p0) * 100, 1)}% é o crescimento no período todo, e não por ano.`, motivo: 'deu o crescimento total' },
        { valor: Math.pow(p1 / p0, 1 / t) * 100, frase: 'Faltou subtrair 1 depois de tirar a raiz: a taxa é (P₁/P₀)^(1/t) − 1.', motivo: 'esqueceu de subtrair 1' },
      ],
      resposta,
      tol,
    )
    if (erros.length < 2) continue
    return {
      enunciado: `Um país tinha ${p0} milhões de habitantes e, ${t} anos depois, passou a ter ${p1} milhões. Qual foi a taxa média de crescimento, em % ao ano (crescimento composto)? Dê duas casas decimais.`,
      resposta,
      tolerancia: tol,
      unidade: '% ao ano',
      erros,
      resolucao: `r = (P₁ ÷ P₀)^(1/t) − 1 = (${p1} ÷ ${p0})^(1/${t}) − 1 ≈ ${fn(resposta / 100, 4)} = ${fn(resposta, 2)}% ao ano.`,
      dicas: [`A razão P₁ ÷ P₀ = ${fn(p1 / p0, 4)} é o fator de crescimento em ${t} anos.`, `Tire a raiz de índice ${t} (eleve a 1/${t}) para achar o fator de um ano.`, 'Subtraia 1 e multiplique por 100 para obter a taxa em %.'],
      licao: 'Taxa média composta: r = ((P₁ ÷ P₀)^(1/t) − 1) × 100.',
      dados: { tipo: 'taxa' },
    }
  }
  throw new Error('não foi possível gerar o crescimento')
}

/* ------------------------------------------------------------------ fases da transição */

export const NOME_FASE_CURTO: Record<Fase, string> = {
  1: 'Fase 1: natalidade e mortalidade altas',
  2: 'Fase 2: mortalidade em queda e natalidade ainda alta',
  3: 'Fase 3: natalidade em queda',
  4: 'Fase 4: natalidade e mortalidade baixas',
}

const FAIXAS_TAXAS: Record<Fase, { n: [number, number]; m: [number, number] }> = {
  1: { n: [36, 48], m: [28, 40] },
  2: { n: [34, 46], m: [10, 22] },
  3: { n: [16, 26], m: [6, 10] },
  4: { n: [9, 12], m: [9, 12] },
}

export interface DadosFase {
  piramide?: Piramide
  natalidade?: number
  mortalidade?: number
}

function explicaFase(fase: Fase, n: number, m: number): string {
  switch (fase) {
    case 1:
      return `natalidade (${n}) e mortalidade (${m}) altas, quase iguais: crescimento lento.`
    case 2:
      return `natalidade alta (${n}) e mortalidade já baixa (${m}): a diferença (${n - m} por mil) é grande e a população cresce depressa.`
    case 3:
      return `natalidade em queda (${n}), mortalidade baixa (${m}): o crescimento ainda é positivo (${n - m} por mil), mas diminui.`
    case 4:
      return `natalidade (${n}) e mortalidade (${m}) baixas e próximas: crescimento perto de zero.`
  }
}

function gerarFaseTaxas(rng: Rng): InstanciaMulti<DadosFase> {
  const fase = escolher<Fase>(rng, [1, 2, 3, 4])
  const fx = FAIXAS_TAXAS[fase]
  const n = sortear(rng, fx.n[0], fx.n[1])
  const m = sortear(rng, fx.m[0], fx.m[1])
  const certa: Opc = { texto: NOME_FASE_CURTO[fase], porque: `Com natalidade de ${n} e mortalidade de ${m} por mil: ${explicaFase(fase, n, m)}` }
  const erradas: Opc[] = ([1, 2, 3, 4] as Fase[])
    .filter((x) => x !== fase)
    .map((x) => ({ texto: NOME_FASE_CURTO[x], porque: `Essa fase tem ${explicaFase(x, x === 1 ? 40 : x === 2 ? 40 : x === 3 ? 20 : 11, x === 1 ? 35 : x === 2 ? 15 : x === 3 ? 8 : 10)} Não combina com natalidade ${n} e mortalidade ${m}.`, motivo: `confundiu com a fase ${x}` }))
  return montar<DadosFase>(rng, certa, erradas, {
    enunciado: `Um país tem taxa de natalidade de ${n} por mil e taxa de mortalidade de ${m} por mil. Em que fase da transição demográfica ele se encontra?`,
    resolucao: `Natalidade ${n} e mortalidade ${m}: ${explicaFase(fase, n, m)} É a ${NOME_FASE_CURTO[fase].toLowerCase()}.`,
    dicas: ['Veja se a natalidade é alta (acima de 30 por mil) ou já caiu.', 'Veja se a mortalidade é alta (acima de 25 por mil) ou baixa.', 'Mortalidade alta e natalidade alta: fase 1. Só a mortalidade caiu: fase 2. A natalidade também caiu: fases 3 e 4.'],
    licao: 'Fases pelas taxas: 1) as duas altas; 2) só a mortalidade cai; 3) a natalidade cai; 4) as duas baixas e próximas.',
    dados: { natalidade: n, mortalidade: m },
  })
}

const OPCOES_FORMA: Record<FormaPiramide | 'nada', string> = {
  'base-larga': 'Base larga e topo estreito: muitos nascimentos e crescimento rápido (fases 1 e 2)',
  intermediaria: 'Base mais estreita e meio largo: a natalidade está caindo (fase 3)',
  'base-estreita': 'Base estreita e topo largo: natalidade e mortalidade baixas (fase 4)',
  nada: 'Não dá para saber nada sobre a natalidade, porque a pirâmide só mostra a idade das pessoas',
}

const FASE_DA_FORMA: Record<FormaPiramide, Fase> = { 'base-larga': 2, intermediaria: 3, 'base-estreita': 4 }

function gerarFasePiramide(rng: Rng): InstanciaMulti<DadosFase> {
  const fase = escolher<Fase>(rng, [1, 2, 3, 4])
  const piramide = piramideDaFase(rng, fase)
  const g = grupos(piramide)
  const forma = formaDaPiramide(g)
  const medidas = `${pct(g.jovens)} de jovens e ${pct(g.idosos)} de idosos`
  const certa: Opc = { texto: OPCOES_FORMA[forma], porque: `A pirâmide tem ${medidas}. ${forma === 'base-larga' ? 'Jovens somam 35% ou mais da população: base larga, típica de natalidade alta.' : forma === 'intermediaria' ? 'Jovens entre 20% e 35% e muitos adultos: a base já estreitou.' : 'Jovens abaixo de 20% e topo largo: poucos nascimentos.'}` }
  const erradas: Opc[] = (['base-larga', 'intermediaria', 'base-estreita', 'nada'] as const)
    .filter((k) => k !== forma)
    .map((k) => ({
      texto: OPCOES_FORMA[k],
      porque: k === 'nada' ? 'A pirâmide mostra os resultados dos nascimentos e das mortes do passado: a largura da base é a natalidade recente.' : `Essa forma teria ${k === 'base-larga' ? '35% ou mais de jovens' : k === 'intermediaria' ? 'entre 20% e 35% de jovens' : 'menos de 20% de jovens'}, e esta pirâmide tem ${pct(g.jovens)}.`,
      motivo: k === 'nada' ? 'achou que a pirâmide não informa a natalidade' : 'leu a largura da base errada',
    }))
  return montar<DadosFase>(rng, certa, erradas, {
    enunciado: 'Observe a pirâmide etária. O que ela indica sobre a natalidade e a fase da transição demográfica?',
    resolucao: `Jovens (0 a 14 anos): ${pct(g.jovens)}; idosos: ${pct(g.idosos)}. ${NOME_FORMA_CURTA[forma]} Em geral, corresponde à fase ${FASE_DA_FORMA[forma]}${forma === 'base-larga' ? ' (ou à fase 1)' : ''}.`,
    dicas: ['Compare a largura da base (0 a 14 anos) com o resto da pirâmide.', 'Some os jovens: 35% ou mais indica base larga; menos de 20%, base estreita.', 'A base larga mostra muitos nascimentos; o topo largo, muitos idosos.'],
    licao: 'Base larga: fases 1 e 2. Base mais estreita com meio largo: fase 3. Base estreita e topo largo: fase 4.',
    dados: { piramide },
  })
}

const NOME_FORMA_CURTA: Record<FormaPiramide, string> = {
  'base-larga': 'Base larga: muitos jovens.',
  intermediaria: 'Base mais estreita e meio largo.',
  'base-estreita': 'Base estreita e topo largo.',
}

export function gerarFase(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFase> {
  if (nivel === 1) return gerarFaseTaxas(rng)
  if (nivel === 2) return gerarFasePiramide(rng)
  return doBanco<DadosFase>(rng, BANCO_FASE)
}

/* ------------------------------------------------------------------ bônus demográfico */

export interface DadosBonus {
  pontos?: PontoRazao[]
  indiceMinimo?: number
}

export function gerarBonus(rng: Rng, nivel: Nivel): InstanciaMulti<DadosBonus> {
  if (nivel === 1) return doBanco<DadosBonus>(rng, BANCO_BONUS.slice(0, 3))
  if (nivel === 3) return doBanco<DadosBonus>(rng, BANCO_BONUS.slice(3))
  const n = sortear(rng, 7, 8)
  const inicio = escolher(rng, [1960, 1970, 1980, 1990])
  const iMin = sortear(rng, 3, n - 4)
  const base = sortear(rng, 44, 58)
  const a = escolher(rng, [2, 2.5, 3, 3.5])
  const pontos: PontoRazao[] = Array.from({ length: n }, (_, i) => ({ rotulo: String(inicio + i * 10), rd: Math.round(base + a * (i - iMin) ** 2) }))
  const certaIdx = iMin
  const candidatos = embaralhar(rng, [iMin - 1, iMin + 1, ...[0, n - 1].filter((i) => Math.abs(i - iMin) > 1)]).slice(0, 3)
  const rot = (i: number) => (pontos[i] as PontoRazao).rotulo
  const val = (i: number) => (pontos[i] as PontoRazao).rd
  const certa: Opc = { texto: `Em ${rot(certaIdx)}`, porque: `A razão de dependência é a menor da série (${val(certaIdx)}) em ${rot(certaIdx)}: depois disso ela volta a subir.` }
  const erradas: Opc[] = candidatos.map((i) => ({
    texto: `Em ${rot(i)}`,
    porque: i < certaIdx ? `Em ${rot(i)} a razão é ${val(i)}, e ela ainda cai nas décadas seguintes até ${val(certaIdx)}. O auge do bônus vem depois.` : `Em ${rot(i)} a razão já voltou a subir (${val(i)}). O menor valor, ${val(certaIdx)}, foi em ${rot(certaIdx)}.`,
    motivo: i < certaIdx ? 'escolheu uma década em que a razão ainda estava caindo' : 'escolheu uma década depois do mínimo',
  }))
  return {
    ...montar<DadosBonus>(rng, certa, erradas, {
      enunciado: 'O gráfico mostra a razão de dependência de um país ao longo das décadas. Em que década o país tem o auge do bônus demográfico, isto é, a menor razão de dependência?',
      resolucao: `Valores: ${pontos.map((p) => `${p.rotulo}: ${p.rd}`).join('; ')}. O menor é ${val(certaIdx)}, em ${rot(certaIdx)}. Antes dele, a razão cai (bônus em construção); depois, sobe (envelhecimento).`,
      dicas: ['O bônus demográfico é o período de razão de dependência baixa.', 'Procure o ponto mais baixo do gráfico.', 'Antes do mínimo a curva desce; depois, sobe.'],
      licao: 'O auge do bônus demográfico é o ponto de menor razão de dependência: antes dele ela cai, depois sobe.',
      dados: { pontos, indiceMinimo: certaIdx },
    }),
  }
}

/* ------------------------------------------------------------------ comparar pirâmides */

const LETRAS = ['A', 'B', 'C', 'D']

type Metrica = 'jovens' | 'dependencia' | 'envelhecimento'

const METRICAS: Record<Metrica, { valor: (g: Grupos) => number; margem: number }> = {
  jovens: { valor: (g) => g.jovens, margem: 5 },
  dependencia: { valor: razaoDependencia, margem: 5 },
  envelhecimento: { valor: indiceEnvelhecimento, margem: 25 },
}

export function gerarPiramides(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMiniaturas> {
  if (nivel === 3 && rng() < 0.4) return doBanco<DadosMiniaturas>(rng, BANCO_PIRAMIDE)
  const metrica: Metrica = nivel === 1 ? 'jovens' : nivel === 2 ? 'dependencia' : 'envelhecimento'
  const m = METRICAS[metrica]
  let escolhidas: Piramide[] = []
  for (let tentativa = 0; tentativa < 500 && escolhidas.length === 0; tentativa++) {
    const ps = Array.from({ length: 4 }, () => piramideModelo(parametrosLivres(rng)))
    const vs = ps.map((p) => m.valor(grupos(p)))
    const ordenados = [...vs].sort((a, b) => b - a)
    const margem = (ordenados[0] as number) - (ordenados[1] as number)
    if (metrica === 'envelhecimento') {
      // só uma das quatro tem mais idosos que jovens, e as outras ficam bem abaixo
      if (vs.filter((v) => v > 100).length === 1 && (ordenados[1] as number) < 80) escolhidas = ps
    } else if (margem >= m.margem && ps.every((_, i) => ps.every((__, j) => i === j || Math.abs((vs[i] as number) - (vs[j] as number)) >= 3))) escolhidas = ps
  }
  if (escolhidas.length === 0) escolhidas = ([4, 3, 2, 1] as Fase[]).map((f) => piramideModelo({ fecundidade: (FAIXAS_FASE[f].fec[0] + FAIXAS_FASE[f].fec[1]) / 2, expectativa: (FAIXAS_FASE[f].esp[0] + FAIXAS_FASE[f].esp[1]) / 2 }))
  const valores = escolhidas.map((p) => m.valor(grupos(p)))
  const alvo = metrica === 'envelhecimento' ? valores.findIndex((v) => v > 100) : valores.indexOf(Math.max(...valores))
  const casas = metrica === 'jovens' ? 1 : 0
  const unidade = metrica === 'jovens' ? '% de jovens' : metrica === 'dependencia' ? ' dependentes por 100 adultos' : ' idosos por 100 jovens'
  const enunciado =
    metrica === 'jovens'
      ? 'Entre as quatro pirâmides, qual tem a base mais larga, isto é, o maior percentual de jovens (0 a 14 anos)?'
      : metrica === 'dependencia'
        ? 'Entre as quatro pirâmides, qual tem a maior razão de dependência?'
        : 'Em qual das quatro pirâmides há mais idosos (65 anos ou mais) do que jovens (0 a 14 anos)?'
  const ordem = embaralhar(rng, escolhidas.map((p, i) => ({ p, i })))
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  ordem.forEach(({ i }, k) => {
    const id = LETRAS[k] as string
    const g = grupos(escolhidas[i] as Piramide)
    const v = valores[i] as number
    const medida = `${fn(v, casas)}${metrica === 'jovens' ? '' : ''}${unidade}`
    if (i === alvo) {
      certa = id
      porque[id] = `Certo. Esta pirâmide tem ${medida} (${resumo(g)}).`
    } else {
      porque[id] = `Não. Esta pirâmide tem ${medida} (${resumo(g)})${metrica === 'envelhecimento' ? ': ainda há mais jovens do que idosos.' : `, menos que a pirâmide certa (${fn(valores[alvo] as number, casas)}).`}`
      motivo[id] = metrica === 'jovens' ? 'confundiu base larga com topo largo' : metrica === 'dependencia' ? 'comparou só o formato, sem calcular' : 'não comparou idosos com jovens'
    }
  })
  return {
    enunciado,
    opcoes: ordem.map((_, k) => ({ id: LETRAS[k] as string, rotulo: `Pirâmide ${LETRAS[k]}` })),
    certa,
    porque,
    motivo,
    resolucao: ordem.map(({ i }, k) => `Pirâmide ${LETRAS[k]}: ${fn(valores[i] as number, casas)}${unidade}`).join('; ') + '.',
    dicas:
      metrica === 'jovens'
        ? ['A base da pirâmide são as três faixas mais novas (0 a 14 anos).', 'Todas as pirâmides usam a mesma escala: compare o comprimento das barras da base.', 'Some as três barras de baixo de cada pirâmide.']
        : metrica === 'dependencia'
          ? ['Dependentes são a base (jovens) e o topo (idosos); os adultos ficam no meio.', 'Compare base + topo com o meio de cada pirâmide.', 'A razão é maior quando a parte do meio é mais estreita em relação às pontas.']
          : ['Compare o topo (65 anos ou mais) com a base (0 a 14 anos).', 'Procure a pirâmide em que o topo é maior do que a base.', 'Isso acontece em populações envelhecidas, de natalidade baixa.'],
    licao: metrica === 'jovens' ? 'Base larga = muitos jovens = natalidade alta.' : metrica === 'dependencia' ? 'A razão de dependência sobe quando os jovens ou os idosos pesam muito diante dos adultos.' : 'Índice de envelhecimento acima de 100: há mais idosos do que jovens.',
    dados: { piramides: ordem.map(({ p }) => p) },
  }
}

const resumo = (g: Grupos) => `${fn(g.jovens, 1)}% de jovens, ${fn(g.adultos, 1)}% de adultos, ${fn(g.idosos, 1)}% de idosos`
