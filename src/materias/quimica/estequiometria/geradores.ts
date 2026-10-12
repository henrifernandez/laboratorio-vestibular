import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { escolher, sortear, type Rng } from '@/lib/rng'
import { formulaTexto } from '../comum/Formula'
import { balanco, coefDe, equacaoTexto, estaBalanceada, formulaDe, limitante, MM, REACOES, reacao, type Reacao } from './calculo'

const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const ft = formulaTexto
const bonito = (x: number, casas = 1) => Math.abs(x * 10 ** casas - Math.round(x * 10 ** casas)) < 1e-9

function limpar(erros: ErroTipico[], resposta: number, tolerancia: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor) || !(e.valor > 0)) continue
    if (Math.abs(e.valor - resposta) <= 2 * tolerancia) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tolerancia)) continue
    saida.push(e)
  }
  return saida
}

/* ================================================================== balancear */

export interface InstanciaBalancear {
  reacaoId: string
  nivel: Nivel
}
export type RespostaBalancear = number[]

const POOL_BALANCEAR: Record<Nivel, string[]> = {
  1: ['agua', 'amonia', 'so3', 'peroxido', 'calcario', 'mg-hcl', 'zn-hcl', 'na-agua'],
  2: ['ferro-o2', 'al-o2', 'metano', 'propano', 'etanol', 'al-hcl', 'neutral-h2so4', 'neutral-ca', 'clorato', 'alto-forno'],
  3: ['etano', 'butano', 'glicose', 'al-oh3', 'termita', 'nh3-o2', 'carbonato-hcl', 'calcario-hcl'],
}

const mdc = (a: number, b: number): number => (b === 0 ? a : mdc(b, a % b))

export const desafioBalancear: Desafio<InstanciaBalancear, RespostaBalancear> & { respostaInicial: (r: Reacao) => number[] } = {
  id: 'quimica/estequiometria/balancear',
  materia: 'quimica',
  tema: 'estequiometria',
  titulo: 'Balanceie a equação',
  respostaInicial: (r) => r.coefs.map(() => 1),
  gerar(semente, nivel) {
    const pool = POOL_BALANCEAR[nivel]
    return { reacaoId: pool[(semente * 7 + nivel) % pool.length] as string, nivel }
  },
  corrigir(inst, coefs): Correcao {
    const r = reacao(inst.reacaoId)
    const gabarito = r.coefs
    const base = { destaque: { gabarito } }
    if (coefs.some((c) => !Number.isInteger(c) || c <= 0)) {
      return { correto: false, parcial: 0, feedback: 'Todos os coeficientes precisam ser números inteiros maiores que zero.', motivo: 'coeficiente inválido', licao: 'Coeficientes são números inteiros positivos.', ...base }
    }
    const b = balanco(r, coefs)
    const erradas = b.filter((x) => x.esquerda !== x.direita)
    if (erradas.length === 0) {
      const g = coefs.reduce((acc, c) => mdc(acc, c), 0)
      if (g > 1) {
        return {
          correto: false,
          parcial: 0.8,
          feedback: `A equação está balanceada, mas dá para simplificar: divida todos os coeficientes por ${g}. O balanceamento pede os menores números inteiros.`,
          motivo: 'não reduziu à menor proporção inteira',
          licao: 'Depois de balancear, divida os coeficientes pelo divisor comum.',
          ...base,
        }
      }
      return { correto: true, parcial: 1, feedback: `Isso mesmo! ${equacaoTexto(r, coefs)}: os átomos de cada elemento são os mesmos nos dois lados.`, ...base }
    }
    const iguaisAoInicio = coefs.every((c) => c === 1)
    const lista = erradas.map((x) => `${x.elemento} (${x.esquerda} à esquerda, ${x.direita} à direita)`)
    const maisNaDireita = erradas[0] as (typeof erradas)[number]
    const dica = maisNaDireita.esquerda < maisNaDireita.direita ? 'faltam átomos nos reagentes' : 'sobram átomos nos reagentes'
    return {
      correto: false,
      parcial: Math.max(0, (b.length - erradas.length) / b.length) * 0.5,
      feedback: iguaisAoInicio
        ? `Todos os coeficientes ainda valem 1. Conte os átomos: ${lista.join('; ')}. Mude os coeficientes (nunca os índices das fórmulas) até igualar.`
        : `Ainda não está balanceada. Átomos que não conferem: ${lista.join('; ')}. Para ${maisNaDireita.elemento}, ${dica}: ajuste o coeficiente de uma substância que o contenha.`,
      motivo: `átomos de ${erradas.map((x) => x.elemento).join(', ')} não conferem`,
      licao: 'Balancear é igualar o número de átomos de cada elemento nos dois lados, mudando só os coeficientes.',
      ...base,
    }
  },
  dicas(inst) {
    const r = reacao(inst.reacaoId)
    const todas = [...r.reagentes, ...r.produtos]
    const maisComplexa = todas.reduce((a, f) => (f.length > a.length ? f : a), todas[0] as string)
    const k = todas.indexOf(maisComplexa)
    return [
      'Conte os átomos de cada elemento dos dois lados (a tabela abaixo das caixas faz essa contagem).',
      'Comece pelo elemento que aparece em menos substâncias. Deixe o oxigênio e o hidrogênio para o fim.',
      `Parta da substância mais complexa, ${ft(maisComplexa)}, e acerte os outros coeficientes a partir dela. O coeficiente certo dela é ${r.coefs[k]}.`,
    ]
  },
  explicar(inst) {
    const r = reacao(inst.reacaoId)
    const b = balanco(r, r.coefs)
    const contagem = b.map((x) => `${x.elemento}: ${x.esquerda} = ${x.direita}`).join(' · ')
    return `Equação balanceada: ${equacaoTexto(r)}. Conferindo átomo por átomo: ${contagem}. Os coeficientes são os menores inteiros que igualam as contagens, e os índices das fórmulas nunca mudam: mudar um índice mudaria a substância.`
  },
}

/* ================================================================== massa de produto */

export interface DadosMassa {
  reacaoId: string
  de: number
  para: number
  /** quantidade dada: mols ou gramas, conforme `unidadeDada` */
  dado: number
  unidadeDada: 'mol' | 'g'
  unidadeResposta: 'mol' | 'g'
  variante: 'mol' | 'massa' | 'rendimento' | 'pureza'
  /** rendimento ou pureza, em % */
  percentual?: number
}

const FRACOES_AVANCO = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]
const PERCENTUAIS = [60, 75, 80, 90]

interface CandidatoMassa {
  r: Reacao
  de: number
  para: number
  xi: number
  p?: number
}

export function gerarMassa(rng: Rng, nivel: Nivel): InstanciaNum<DadosMassa> {
  const variante: DadosMassa['variante'] = nivel === 1 ? 'mol' : nivel === 2 ? 'massa' : rng() < 0.5 ? 'rendimento' : 'pureza'
  const reacoes = REACOES.filter((r) => (nivel === 1 ? Math.max(...r.coefs) <= 4 : nivel === 2 ? Math.max(...r.coefs) <= 8 : true))
  const candidatos: CandidatoMassa[] = []
  for (const r of reacoes) {
    const nr = r.reagentes.length
    for (let de = 0; de < nr; de++) {
      for (let k = 0; k < r.produtos.length; k++) {
        const para = nr + k
        for (const xi of FRACOES_AVANCO) {
          const nDe = coefDe(r, de) * xi
          const mDe = nDe * MM(formulaDe(r, de))
          const mPara = coefDe(r, para) * xi * MM(formulaDe(r, para))
          if (variante === 'mol') {
            if (!bonito(nDe, 1) || !bonito(coefDe(r, para) * xi, 1) || coefDe(r, de) === coefDe(r, para)) continue
            candidatos.push({ r, de, para, xi })
          } else if (variante === 'massa' || variante === 'rendimento') {
            if (!bonito(mDe, 1) || !bonito(mPara, 1) || mPara > 1500 || mDe > 1500 || mDe < 2 || coefDe(r, de) === coefDe(r, para)) continue
            if (variante === 'massa') candidatos.push({ r, de, para, xi })
            else for (const p of PERCENTUAIS) if (bonito((mPara * p) / 100, 1)) candidatos.push({ r, de, para, xi, p })
          } else {
            if (!bonito(mPara, 1) || mDe > 1500 || mDe < 2 || coefDe(r, de) === coefDe(r, para)) continue
            for (const p of PERCENTUAIS) if (bonito(mDe / (p / 100), 1) && mDe / (p / 100) <= 2000) candidatos.push({ r, de, para, xi, p })
          }
        }
      }
    }
  }
  const c = escolher(rng, candidatos)
  const { r, de, para, xi } = c
  const fDe = formulaDe(r, de)
  const fPara = formulaDe(r, para)
  const cDe = coefDe(r, de)
  const cPara = coefDe(r, para)
  const mmDe = MM(fDe)
  const mmPara = MM(fPara)
  const teoricoMol = cPara * xi
  const teoricoG = teoricoMol * mmPara
  const equacao = equacaoTexto(r)
  const eq = `Considere a equação balanceada ${ft(equacao)}.`

  let dado: number
  let unidadeResposta: 'mol' | 'g' = 'g'
  let resposta: number
  let enunciado: string
  let resolucao: string
  let erros: ErroTipico[]
  const licoes: Record<DadosMassa['variante'], string> = {
    mol: 'Os coeficientes são a proporção em mols: mols de B = mols de A × (coef. de B ÷ coef. de A).',
    massa: 'Massa → mols (÷ massa molar) → proporção dos coeficientes → massa (× massa molar).',
    rendimento: 'O cálculo estequiométrico dá o rendimento de 100 %; a massa obtida é essa massa × rendimento.',
    pureza: 'Só a parte pura da amostra reage: massa pura = massa da amostra × pureza.',
  }

  if (variante === 'mol') {
    dado = cDe * xi
    unidadeResposta = 'mol'
    resposta = teoricoMol
    enunciado = `${eq} Quantos mols de ${ft(fPara)} se formam (ou se consomem) quando ${fn(dado)} mol de ${ft(fDe)} reagem completamente?`
    resolucao = `A proporção é ${cDe} mol de ${ft(fDe)} para ${cPara} mol de ${ft(fPara)}. Fator = ${fn(dado)} ÷ ${cDe} = ${fn(xi)}, então ${fn(xi)} × ${cPara} = ${fn(resposta)} mol de ${ft(fPara)}.`
    erros = [
      { valor: dado, frase: `Você repetiu o número de mols dado (${fn(dado)}). Isso só vale se os coeficientes forem iguais; aqui a proporção é ${cDe} : ${cPara}.`, motivo: 'ignorou a proporção dos coeficientes' },
      { valor: (dado * cDe) / cPara, frase: 'Você inverteu a razão: o coeficiente da substância procurada vai no numerador, e o da substância dada, no denominador.', motivo: 'inverteu a razão dos coeficientes' },
      { valor: dado * cPara, frase: `Você multiplicou os mols pelo coeficiente (${fn(dado)} × ${cPara}). É preciso também dividir pelo coeficiente da substância dada (${cDe}).`, motivo: 'esqueceu de dividir pelo coeficiente da substância dada' },
    ]
  } else if (variante === 'massa') {
    dado = cDe * xi * mmDe
    resposta = teoricoG
    enunciado = `${eq} Qual é a massa de ${ft(fPara)}, em gramas, envolvida quando ${fn(dado)} g de ${ft(fDe)} reagem completamente? (Massas molares: ${ft(fDe)} = ${fn(mmDe)} g/mol; ${ft(fPara)} = ${fn(mmPara)} g/mol.)`
    resolucao = `1) ${fn(dado)} g ÷ ${fn(mmDe)} g/mol = ${fn(cDe * xi)} mol de ${ft(fDe)}. 2) Proporção ${cDe} : ${cPara} → ${fn(teoricoMol)} mol de ${ft(fPara)}. 3) ${fn(teoricoMol)} mol × ${fn(mmPara)} g/mol = ${fn(resposta)} g.`
    erros = [
      { valor: (dado / mmDe) * mmPara, frase: `Você usou proporção de 1 para 1 em mols e esqueceu os coeficientes. A equação diz ${cDe} : ${cPara}.`, motivo: 'esqueceu a proporção dos coeficientes' },
      { valor: (dado * cPara) / cDe, frase: 'Você aplicou a proporção dos coeficientes diretamente às massas. Os coeficientes valem para mols, não para gramas: passe por mol.', motivo: 'aplicou os coeficientes às massas' },
      { valor: teoricoMol, frase: `${fn(teoricoMol)} é a quantidade em mols. A pergunta pede gramas: multiplique pela massa molar (${fn(mmPara)} g/mol).`, motivo: 'esqueceu de converter mol em gramas' },
      { valor: (dado / mmDe) * (cDe / cPara) * mmPara, frase: 'Você inverteu a razão dos coeficientes (usou coeficiente dado ÷ coeficiente procurado).', motivo: 'inverteu a razão dos coeficientes' },
    ]
  } else if (variante === 'rendimento') {
    const p = c.p as number
    dado = cDe * xi * mmDe
    resposta = (teoricoG * p) / 100
    enunciado = `${eq} Reagem ${fn(dado)} g de ${ft(fDe)}, e o rendimento da reação é ${p} %. Que massa de ${ft(fPara)} é realmente obtida? (${ft(fDe)} = ${fn(mmDe)} g/mol; ${ft(fPara)} = ${fn(mmPara)} g/mol.)`
    resolucao = `Rendimento de 100 %: ${fn(dado)} g ÷ ${fn(mmDe)} = ${fn(cDe * xi)} mol de ${ft(fDe)} → ${fn(teoricoMol)} mol de ${ft(fPara)} → ${fn(teoricoG)} g. Com ${p} %: ${fn(teoricoG)} × ${p}/100 = ${fn(resposta)} g.`
    erros = [
      { valor: teoricoG, frase: `${fn(teoricoG)} g seria a massa se o rendimento fosse 100 %. Falta multiplicar por ${p} %.`, motivo: 'esqueceu o rendimento' },
      { valor: teoricoG / (p / 100), frase: 'Você dividiu pelo rendimento em vez de multiplicar. Rendimento menor que 100 % reduz a massa obtida.', motivo: 'dividiu pelo rendimento' },
      { valor: (dado / mmDe) * mmPara * (p / 100), frase: 'Você esqueceu a proporção dos coeficientes antes de aplicar o rendimento.', motivo: 'esqueceu a proporção dos coeficientes' },
      { valor: (teoricoG * (100 - p)) / 100, frase: `Você calculou a parte que NÃO se formou (${100 - p} %). O rendimento é a parte que se forma.`, motivo: 'confundiu rendimento com perda' },
    ]
  } else {
    const p = c.p as number
    const mPura = cDe * xi * mmDe
    dado = mPura / (p / 100)
    resposta = teoricoG
    enunciado = `${eq} Uma amostra de ${fn(dado)} g contém ${p} % de ${ft(fDe)} (o resto é impureza que não reage). Que massa de ${ft(fPara)} se forma, com rendimento de 100 %? (${ft(fDe)} = ${fn(mmDe)} g/mol; ${ft(fPara)} = ${fn(mmPara)} g/mol.)`
    resolucao = `Massa pura: ${fn(dado)} × ${p}/100 = ${fn(mPura)} g de ${ft(fDe)}. Em mols: ${fn(mPura)} ÷ ${fn(mmDe)} = ${fn(cDe * xi)} mol. Proporção ${cDe} : ${cPara} → ${fn(teoricoMol)} mol de ${ft(fPara)} × ${fn(mmPara)} g/mol = ${fn(resposta)} g.`
    erros = [
      { valor: ((dado / mmDe) * cPara * mmPara) / cDe, frase: 'Você usou a massa total da amostra, mas as impurezas não reagem. Primeiro tire a parte pura (massa × pureza).', motivo: 'usou a amostra toda, sem descontar a pureza' },
      { valor: (mPura / mmDe) * mmPara, frase: 'Você descontou a pureza, mas esqueceu a proporção dos coeficientes.', motivo: 'esqueceu a proporção dos coeficientes' },
      { valor: (((dado * (100 - p)) / 100 / mmDe) * cPara * mmPara) / cDe, frase: `Você usou a impureza (${100 - p} %) como se fosse a parte que reage.`, motivo: 'usou a impureza no lugar da parte pura' },
    ]
  }
  const tolerancia = unidadeResposta === 'mol' ? 0.02 : 0.05
  return {
    enunciado,
    resposta,
    tolerancia,
    unidade: unidadeResposta,
    erros: limpar(erros, resposta, tolerancia),
    resolucao,
    dicas: [
      'Escreva o caminho: dado → mols do dado → mols do que se pede → resposta final.',
      variante === 'mol' ? 'Os coeficientes da equação dão a proporção em mols.' : 'Para passar de gramas para mols, divida pela massa molar; para voltar, multiplique.',
      variante === 'rendimento' ? 'Calcule primeiro como se o rendimento fosse 100 % e só no fim aplique a porcentagem.' : variante === 'pureza' ? 'Só a parte pura reage: comece descontando a impureza.' : 'Monte a regra de três com a proporção da equação balanceada.',
    ],
    licao: licoes[variante],
    dados: { reacaoId: r.id, de, para, dado, unidadeDada: variante === 'mol' ? 'mol' : 'g', unidadeResposta, variante, percentual: c.p },
  }
}

/* ================================================================== reagente limitante */

export interface DadosLimitante {
  reacaoId: string
  /** mols iniciais de cada reagente */
  mols: number[]
  /** massas iniciais (g) quando o enunciado usa massas; senão null */
  massas: number[] | null
  limitante: number
  variante: 'quem' | 'produto-mol' | 'produto-g' | 'sobra-g' | 'sobra-mol'
  /** índice do reagente cuja sobra é pedida */
  alvo?: number
  /** índice (reagentes + produtos) do produto pedido */
  produto?: number
}

interface CenarioLim {
  r: Reacao
  mols: number[]
  /** armadilha: o limitante é o que tem MAIS massa ou MAIS mols */
  armadilha: boolean
}

const FATORES_EXCESSO = [1.25, 1.5, 2, 2.5, 3, 4]

function cenarios(nivel: Nivel, usaMassa: boolean): CenarioLim[] {
  const lista: CenarioLim[] = []
  const reacoes = REACOES.filter((r) => r.reagentes.length === 2 && (nivel === 1 ? Math.max(...r.coefs) <= 4 : true))
  for (const r of reacoes) {
    for (let lim = 0; lim < 2; lim++) {
      const ex = 1 - lim
      for (const xi of FRACOES_AVANCO) {
        for (const f of FATORES_EXCESSO) {
          const mols: number[] = []
          mols[lim] = coefDe(r, lim) * xi
          mols[ex] = coefDe(r, ex) * xi * f
          const massas = mols.map((n, i) => n * MM(formulaDe(r, i)))
          if (!mols.every((n) => bonito(n, 1))) continue
          if (usaMassa && !massas.every((m) => bonito(m, 1) && m >= 2 && m <= 800)) continue
          if (!usaMassa && mols.some((n) => n > 30)) continue
          const maisMols = mols[0]! > mols[1]! ? 0 : 1
          const maisMassa = massas[0]! > massas[1]! ? 0 : 1
          const armadilha = usaMassa ? maisMassa === lim : maisMols === lim
          lista.push({ r, mols, armadilha })
        }
      }
    }
  }
  return lista
}

function escolherCenario(rng: Rng, nivel: Nivel, usaMassa: boolean): CenarioLim {
  // quantidades iguais dos dois reagentes tornam vários erros típicos idênticos à resposta
  const todos = cenarios(nivel, usaMassa).filter((c) => c.mols[0] !== c.mols[1] && coefDe(c.r, 0) !== coefDe(c.r, 1))
  const pool = nivel >= 2 ? todos.filter((c) => c.armadilha) : todos
  return escolher(rng, pool.length > 0 ? pool : todos)
}

export function gerarLimitante(rng: Rng, nivel: Nivel): InstanciaMulti<DadosLimitante> {
  const usaMassa = nivel >= 2
  const exato = nivel >= 2 && rng() < 0.15
  let r: Reacao
  let mols: number[]
  if (exato) {
    const candidatas = REACOES.filter((x) => x.reagentes.length === 2)
    for (;;) {
      r = escolher(rng, candidatas)
      const xi = escolher(rng, FRACOES_AVANCO)
      mols = r.reagentes.map((_, i) => coefDe(r, i) * xi)
      const massas = mols.map((n, i) => n * MM(formulaDe(r, i)))
      if (mols.every((n) => bonito(n, 1)) && massas.every((m) => bonito(m, 1) && m >= 2 && m <= 800)) break
    }
  } else {
    const c = escolherCenario(rng, nivel, usaMassa)
    r = c.r
    mols = c.mols
  }
  const massas = mols.map((n, i) => n * MM(formulaDe(r, i)))
  const res = limitante(r, mols)
  const [fa, fb] = r.reagentes as [string, string]
  const dadosTxt = usaMassa ? `${fn(massas[0] as number)} g de ${ft(fa)} e ${fn(massas[1] as number)} g de ${ft(fb)}` : `${fn(mols[0] as number)} mol de ${ft(fa)} e ${fn(mols[1] as number)} mol de ${ft(fb)}`
  const enunciado = `Considere a equação balanceada ${ft(equacaoTexto(r))}. Misturam-se ${dadosTxt}. Qual é o reagente limitante?`
  const razoes = res.razoes
  const usaMassaTxt = usaMassa
  const tabela = `${ft(fa)}: ${usaMassaTxt ? `${fn(massas[0] as number)} g ÷ ${fn(MM(fa))} = ` : ''}${fn(mols[0] as number)} mol ÷ ${coefDe(r, 0)} = ${fn(razoes[0] as number)}; ${ft(fb)}: ${usaMassaTxt ? `${fn(massas[1] as number)} g ÷ ${fn(MM(fb))} = ` : ''}${fn(mols[1] as number)} mol ÷ ${coefDe(r, 1)} = ${fn(razoes[1] as number)}`
  const resolucao = `Passe tudo para mols e divida pelo coeficiente: ${tabela}. ${res.limitante === -1 ? 'As razões são iguais: a mistura está na proporção exata e os dois reagentes se esgotam juntos.' : `O menor valor é o do ${ft(formulaDe(r, res.limitante))}: ele acaba primeiro e limita a reação.`}`
  const naivoMols = (mols[0] as number) < (mols[1] as number) ? 0 : 1
  const naivoMassa = (massas[0] as number) < (massas[1] as number) ? 0 : 1
  const naivo = usaMassa ? naivoMassa : naivoMols
  const certa = res.limitante === -1 ? 'nenhum' : String(res.limitante)
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  for (const i of [0, 1]) {
    const f = formulaDe(r, i)
    const outro = 1 - i
    if (certa === String(i)) {
      porque[String(i)] = `Certo. ${tabela}. O ${ft(f)} tem a menor razão (${fn(razoes[i] as number)}), então acaba primeiro.`
    } else {
      const sobraMol = (res.sobra[i] as number)
      porque[String(i)] =
        res.limitante === -1
          ? `Nenhum dos dois sobra: as razões são iguais (${fn(razoes[0] as number)}). A mistura está na proporção exata.`
          : `Não. O ${ft(f)} está em excesso: depois da reação ainda sobram ${fn(sobraMol)} mol dele. Quem acaba primeiro é o ${ft(formulaDe(r, outro))}.`
      motivo[String(i)] = naivo === i ? (usaMassa ? 'escolheu o de menor massa sem converter em mols' : 'escolheu o de menos mols sem dividir pelo coeficiente') : 'comparou sem dividir pelo coeficiente'
    }
  }
  porque.nenhum =
    certa === 'nenhum'
      ? `Certo. As razões mol ÷ coeficiente são iguais (${fn(razoes[0] as number)}): os dois reagentes se esgotam ao mesmo tempo.`
      : `Não. As razões mol ÷ coeficiente são diferentes (${fn(razoes[0] as number)} e ${fn(razoes[1] as number)}), então um deles acaba antes e o outro sobra.`
  motivo.nenhum = 'achou que a mistura estava na proporção exata'
  const opcoes = [
    { id: '0', rotulo: `${ft(fa)}` },
    { id: '1', rotulo: `${ft(fb)}` },
    { id: 'nenhum', rotulo: 'Nenhum: os dois acabam juntos' },
  ]
  return {
    enunciado,
    opcoes,
    certa,
    porque,
    motivo,
    resolucao,
    dicas: [
      'O limitante não é o que tem menos massa nem o que tem menos mols: depende da proporção da equação.',
      usaMassa ? 'Converta cada massa em mols (massa ÷ massa molar).' : 'Divida os mols de cada reagente pelo respectivo coeficiente.',
      'Divida os mols de cada reagente pelo seu coeficiente: o menor resultado é o limitante.',
    ],
    licao: 'Reagente limitante: o menor valor de (mols ÷ coeficiente). Nunca compare massas ou mols sem dividir pelo coeficiente.',
    dados: { reacaoId: r.id, mols, massas: usaMassa ? massas : null, limitante: res.limitante, variante: 'quem' },
  }
}

export function gerarSobra(rng: Rng, nivel: Nivel): InstanciaNum<DadosLimitante> {
  const usaMassa = nivel >= 2
  const c = escolherCenario(rng, nivel, usaMassa)
  const { r, mols } = c
  const massas = mols.map((n, i) => n * MM(formulaDe(r, i)))
  const res = limitante(r, mols)
  const lim = res.limitante
  const ex = 1 - lim
  const nr = r.reagentes.length
  const variante: DadosLimitante['variante'] = nivel === 1 ? (rng() < 0.5 ? 'produto-mol' : 'sobra-mol') : nivel === 2 ? (rng() < 0.5 ? 'produto-g' : 'sobra-g') : rng() < 0.5 ? 'produto-g' : 'sobra-g'
  const [fa, fb] = r.reagentes as [string, string]
  const dadosTxt = usaMassa ? `${fn(massas[0] as number)} g de ${ft(fa)} e ${fn(massas[1] as number)} g de ${ft(fb)}` : `${fn(mols[0] as number)} mol de ${ft(fa)} e ${fn(mols[1] as number)} mol de ${ft(fb)}`
  const k = nivel === 1 ? 0 : sortear(rng, 0, r.produtos.length - 1)
  const prod = nr + k
  const fProd = formulaDe(r, prod)
  const mmProd = MM(fProd)
  const mmEx = MM(formulaDe(r, ex))
  const fEx = formulaDe(r, ex)
  const fLim = formulaDe(r, lim)
  const eq = `Considere a equação balanceada ${ft(equacaoTexto(r))}.`
  const molsProd = res.avanco * coefDe(r, prod)
  const molsSobra = res.sobra[ex] as number
  let pergunta: string
  let resposta: number
  let unidade: 'mol' | 'g'
  let erros: ErroTipico[]
  let rendimentoUsado = 100
  const mmLim = MM(fLim)
  // erro típico: calcular o produto com o excesso
  const avancoEx = (mols[ex] as number) / coefDe(r, ex)
  const prodComExcesso = avancoEx * coefDe(r, prod)
  if (variante === 'produto-mol') {
    pergunta = `Quantos mols de ${ft(fProd)} podem ser formados, no máximo?`
    resposta = molsProd
    unidade = 'mol'
    erros = [
      { valor: prodComExcesso, frase: `Você calculou com o ${ft(fEx)}, que está em excesso. A quantidade formada é limitada pelo ${ft(fLim)}.`, motivo: 'calculou o produto com o reagente em excesso' },
      { valor: (mols[lim] as number), frase: 'Você repetiu os mols do limitante. É preciso aplicar a proporção dos coeficientes até o produto.', motivo: 'ignorou a proporção dos coeficientes' },
      { valor: molsProd + molsSobra, frase: 'Você somou a sobra ao produto. O que sobra é reagente que não reagiu.', motivo: 'somou a sobra ao produto' },
      { valor: (mols[0] as number) + (mols[1] as number), frase: 'Você somou os mols dos dois reagentes. Os mols do produto vêm da proporção dos coeficientes, não da soma do que foi colocado.', motivo: 'somou os mols dos reagentes' },
      { valor: ((mols[lim] as number) * coefDe(r, lim)) / coefDe(r, prod), frase: 'Você inverteu a razão dos coeficientes: o coeficiente do produto vai no numerador.', motivo: 'inverteu a razão dos coeficientes' },
    ]
  } else if (variante === 'sobra-mol') {
    pergunta = `Quantos mols de ${ft(fEx)} sobram ao final, sem reagir?`
    resposta = molsSobra
    unidade = 'mol'
    erros = [
      { valor: mols[ex] as number, frase: `Esse é o total de ${ft(fEx)} colocado. Falta descontar o que reagiu.`, motivo: 'não descontou o que reagiu' },
      { valor: (mols[ex] as number) - (mols[lim] as number), frase: 'Você subtraiu os mols diretamente, sem usar a proporção dos coeficientes para saber quanto do excesso foi consumido.', motivo: 'subtraiu mols sem usar a proporção' },
      { valor: (mols[lim] as number), frase: 'Esse é o número de mols do limitante, não a sobra do reagente em excesso.', motivo: 'confundiu limitante com excesso' },
      { valor: (mols[ex] as number) - ((mols[lim] as number) * coefDe(r, lim)) / coefDe(r, ex), frase: 'Você inverteu a razão dos coeficientes ao calcular quanto do excesso foi consumido.', motivo: 'inverteu a razão dos coeficientes' },
      { valor: molsSobra + res.avanco * coefDe(r, ex), frase: 'Esse é o total do excesso. Falta descontar o que reagiu com o limitante.', motivo: 'não descontou o que reagiu' },
    ]
  } else if (variante === 'produto-g') {
    const bruto = molsProd * mmProd
    const aceitos = nivel === 3 ? PERCENTUAIS.filter((p) => bonito((bruto * p) / 100, 1)) : []
    const rend = aceitos.length > 0 ? escolher(rng, aceitos) : 100
    const q = rend / 100
    pergunta = rend === 100 ? `Qual é a massa máxima de ${ft(fProd)} que pode ser obtida? (${ft(fProd)} = ${fn(mmProd)} g/mol)` : `Com rendimento de ${rend} %, que massa de ${ft(fProd)} é obtida? (${ft(fProd)} = ${fn(mmProd)} g/mol)`
    resposta = bruto * q
    unidade = 'g'
    rendimentoUsado = rend
    erros = [
      ...(rend === 100 ? [] : [{ valor: bruto, frase: `${fn(bruto)} g seria a massa com rendimento de 100 %. Falta multiplicar por ${rend} %.`, motivo: 'esqueceu o rendimento' }]),
      { valor: prodComExcesso * mmProd * q, frase: `Você calculou com o ${ft(fEx)}, que está em excesso. Use o reagente limitante (${ft(fLim)}).`, motivo: 'calculou o produto com o reagente em excesso' },
      { valor: (massas[lim] as number) * q, frase: 'Esse é a massa do limitante colocado. Pelo princípio da conservação, a massa do produto vem de todos os reagentes que reagiram.', motivo: 'confundiu massa do reagente com massa do produto' },
      { valor: ((massas[ex] as number) + (massas[lim] as number)) * q, frase: 'Você somou as massas dos dois reagentes. Parte do excesso não reage e fica de fora do produto.', motivo: 'somou as massas dos reagentes, ignorando a sobra' },
      { valor: ((massas[lim] as number) / mmLim) * mmProd * q, frase: 'Você esqueceu a proporção dos coeficientes entre o limitante e o produto.', motivo: 'esqueceu a proporção dos coeficientes' },
    ]
  } else {
    pergunta = `Que massa de ${ft(fEx)} sobra, sem reagir? (${ft(fEx)} = ${fn(mmEx)} g/mol)`
    resposta = molsSobra * mmEx
    unidade = 'g'
    erros = [
      { valor: massas[ex] as number, frase: `Esse é o total de ${ft(fEx)} colocado. Falta descontar a parte que reagiu.`, motivo: 'não descontou o que reagiu' },
      { valor: (massas[ex] as number) - ((massas[lim] as number) / mmLim) * mmEx, frase: 'Você subtraiu supondo que o excesso é consumido mol a mol com o limitante. Use a proporção dos coeficientes.', motivo: 'consumo calculado sem a proporção dos coeficientes' },
      { valor: (massas[ex] as number) - (massas[lim] as number), frase: 'Você subtraiu as massas diretamente. Subtraia em mols (ou converta o consumo para gramas).', motivo: 'subtraiu massas diretamente' },
      { valor: ((mols[ex] as number) - ((mols[lim] as number) * coefDe(r, lim)) / coefDe(r, ex)) * mmEx, frase: 'Você inverteu a razão dos coeficientes ao calcular quanto do excesso foi consumido.', motivo: 'inverteu a razão dos coeficientes' },
      { valor: massas[lim] as number, frase: 'Essa é a massa do limitante colocada. A sobra pedida é do reagente em excesso.', motivo: 'confundiu limitante com excesso' },
    ]
  }
  const tolerancia = unidade === 'mol' ? 0.02 : 0.05
  const razoesTxt = `${ft(fa)}: ${fn(mols[0] as number)} ÷ ${coefDe(r, 0)} = ${fn(res.razoes[0] as number)}; ${ft(fb)}: ${fn(mols[1] as number)} ÷ ${coefDe(r, 1)} = ${fn(res.razoes[1] as number)}`
  const passoMols = usaMassa ? `Converta em mols: ${ft(fa)} = ${fn(mols[0] as number)} mol, ${ft(fb)} = ${fn(mols[1] as number)} mol. ` : ''
  const passoFinal =
    variante === 'produto-mol'
      ? `${fn(res.avanco)} × ${coefDe(r, prod)} = ${fn(molsProd)} mol de ${ft(fProd)}.`
      : variante === 'produto-g'
        ? `${fn(res.avanco)} × ${coefDe(r, prod)} = ${fn(molsProd)} mol de ${ft(fProd)} → ${fn(molsProd)} × ${fn(mmProd)} = ${fn(molsProd * mmProd)} g${rendimentoUsado === 100 ? '' : `; com rendimento de ${rendimentoUsado} %: ${fn(molsProd * mmProd)} × ${rendimentoUsado}/100 = ${fn(resposta)} g`}.`
        : `O ${ft(fEx)} consumido: ${fn(res.avanco)} × ${coefDe(r, ex)} = ${fn(res.avanco * coefDe(r, ex))} mol. Sobra ${fn(mols[ex] as number)} − ${fn(res.avanco * coefDe(r, ex))} = ${fn(molsSobra)} mol${unidade === 'g' ? ` → ${fn(molsSobra)} × ${fn(mmEx)} = ${fn(resposta)} g` : ''}.`
  return {
    enunciado: `${eq} Misturam-se ${dadosTxt}. ${pergunta}`,
    resposta,
    tolerancia,
    unidade,
    erros: limpar(erros, resposta, tolerancia),
    resolucao: `${passoMols}Divida os mols pelos coeficientes: ${razoesTxt}. O menor é o do ${ft(fLim)}, o limitante (avanço = ${fn(res.avanco)}). ${passoFinal}`,
    dicas: [
      'Primeiro descubra quem é o limitante: divida os mols de cada reagente pelo seu coeficiente.',
      'Tudo o que se forma e tudo o que se consome é calculado a partir do limitante, nunca do excesso.',
      variante.startsWith('sobra') ? 'Sobra = quantidade colocada − quantidade que reagiu (esta calculada pela proporção dos coeficientes).' : 'Mols do produto = avanço × coeficiente do produto.',
    ],
    licao: 'Calcule sempre a partir do reagente limitante; o excesso sobra: colocado − consumido.',
    dados: { reacaoId: r.id, mols, massas: usaMassa ? massas : null, limitante: lim, variante, alvo: ex, produto: prod },
  }
}

export { estaBalanceada }
