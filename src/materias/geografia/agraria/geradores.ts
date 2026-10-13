import { BANCO_BRASIL, BANCO_FUNDIARIA, BANCO_SISTEMAS } from '@/conteudo/geografia/agraria'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { escolher, type Rng } from '@/lib/rng'
import { fn, limpar } from '@/materias/biologia/comum/auxiliares'
import { doBanco, faixaDoBanco } from '../comum/banco'
import { areaEntreDiagonalECurva, areaSobCurva, crescimentoDaProdutividade, giniDeFaixas, producao, type FaixaFundiaria } from './calculo'

export const gerarSistemas = (rng: Rng, nivel: Nivel): InstanciaMulti<undefined> => doBanco(rng, faixaDoBanco(BANCO_SISTEMAS, nivel))
export const gerarFundiaria = (rng: Rng, nivel: Nivel): InstanciaMulti<undefined> => doBanco(rng, faixaDoBanco(BANCO_FUNDIARIA, nivel))
export const gerarBrasil = (rng: Rng, nivel: Nivel): InstanciaMulti<undefined> => doBanco(rng, faixaDoBanco(BANCO_BRASIL, nivel))

/* ------------------------------------------------------------------ concentração da terra */

export interface DadosGini {
  faixas: FaixaFundiaria[]
  gini: number
}

const pct = (n: number) => `${fn(n, 0)}%`

/** Distribuições de estabelecimentos (em %, dos menores aos maiores) usadas no nível 3. */
const ESTAB_3: number[][] = [
  [60, 30, 10],
  [50, 40, 10],
  [70, 25, 5],
  [40, 40, 20],
  [80, 15, 5],
  [55, 35, 10],
]

/** Três faixas com área média crescente (curva de Lorenz convexa). */
function faixasDeTres(rng: Rng): FaixaFundiaria[] {
  for (let t = 0; t < 400; t++) {
    const est = escolher(rng, ESTAB_3)
    const a1 = escolher(rng, [2, 3, 4, 5, 8, 10, 15])
    const a2 = escolher(rng, [10, 15, 20, 25, 30, 35])
    const a3 = 100 - a1 - a2
    const medias = [a1 / (est[0] as number), a2 / (est[1] as number), a3 / (est[2] as number)]
    const g = giniDeFaixas(est.map((e, i) => ({ estabelecimentos: e, area: [a1, a2, a3][i] as number })))
    if (a3 > 0 && (medias[0] as number) < (medias[1] as number) && (medias[1] as number) < (medias[2] as number) && g > 0.3 && g < 0.9) return est.map((e, i) => ({ estabelecimentos: e, area: [a1, a2, a3][i] as number }))
  }
  return [
    { estabelecimentos: 60, area: 5 },
    { estabelecimentos: 30, area: 25 },
    { estabelecimentos: 10, area: 70 },
  ]
}

/** Duas faixas com Gini entre 0,3 e 0,9. */
function faixasDeDuas(rng: Rng): FaixaFundiaria[] {
  for (let t = 0; t < 400; t++) {
    const a = escolher(rng, [50, 60, 70, 80, 90])
    const b = escolher(rng, [3, 5, 10, 15, 20, 25, 30, 35, 40, 45].filter((x) => x < a - 5))
    const faixas = [
      { estabelecimentos: a, area: b },
      { estabelecimentos: 100 - a, area: 100 - b },
    ]
    const g = giniDeFaixas(faixas)
    if (g > 0.3 && g < 0.9) return faixas
  }
  return [
    { estabelecimentos: 80, area: 20 },
    { estabelecimentos: 20, area: 80 },
  ]
}

export function gerarGini(rng: Rng, nivel: Nivel): InstanciaNum<DadosGini> {
  if (nivel === 1) {
    // quantas vezes a área média dos maiores supera a dos menores
    for (let t = 0; t < 200; t++) {
      const a = escolher(rng, [50, 60, 70, 80, 90])
      const b = escolher(rng, [5, 10, 15, 20, 25, 30, 35, 40, 45].filter((x) => x < a))
      const faixas: FaixaFundiaria[] = [
        { estabelecimentos: a, area: b },
        { estabelecimentos: 100 - a, area: 100 - b },
      ]
      const resposta = Math.round((((100 - b) / (100 - a)) / (b / a)) * 10) / 10
      const erros = limpar(
        [
          { valor: Math.round(((100 - b) / b) * 10) / 10, frase: 'Você comparou só as áreas (maiores ÷ menores). Falta levar em conta que há muito menos estabelecimentos entre os maiores: compare a área média de cada grupo.', motivo: 'ignorou o número de estabelecimentos' },
          { valor: Math.round((b / a / ((100 - b) / (100 - a))) * 100) / 100, frase: 'Você inverteu a razão: a pergunta é quantas vezes a área média dos maiores supera a dos menores.', motivo: 'inverteu a razão' },
          { valor: Math.round((a / (100 - a)) * 10) / 10, frase: 'Esse é o número de estabelecimentos pequenos para cada grande. Falta comparar com a área de cada grupo.', motivo: 'só comparou as quantidades' },
        ],
        resposta,
        0.1,
        true,
      )
      if (erros.length < 2 || resposta < 1.5 || resposta > 60) continue
      return {
        enunciado: `Em uma região (modelo didático), ${pct(a)} dos estabelecimentos, os menores, ocupam ${pct(b)} da área total, e os outros ${pct(100 - a)}, os maiores, ocupam ${pct(100 - b)}. Quantas vezes a área média de um estabelecimento do grupo maior supera a de um do grupo menor? Arredonde para uma casa decimal.`,
        resposta,
        tolerancia: 0.06,
        unidade: 'vezes',
        erros,
        resolucao: `Área média de cada grupo = parcela da área ÷ parcela dos estabelecimentos. Menores: ${pct(b)} ÷ ${pct(a)} = ${fn(b / a, 3)}. Maiores: ${pct(100 - b)} ÷ ${pct(100 - a)} = ${fn((100 - b) / (100 - a), 3)}. Razão: ${fn((100 - b) / (100 - a), 3)} ÷ ${fn(b / a, 3)} ≈ ${fn(resposta, 1)}.`,
        dicas: ['Compare a área média, e não só a área total, de cada grupo.', 'Área média = porcentagem da área ÷ porcentagem dos estabelecimentos.', 'Divida a média dos maiores pela média dos menores.'],
        licao: 'Para comparar grupos de tamanhos diferentes, use a média: porcentagem da área dividida pela porcentagem dos estabelecimentos.',
        dados: { faixas, gini: giniDeFaixas(faixas) },
      }
    }
  }
  const faixas: FaixaFundiaria[] = nivel === 2 ? faixasDeDuas(rng) : faixasDeTres(rng)
  const g = giniDeFaixas(faixas)
  const resposta = Math.round(g * 100) / 100
  const erros = limpar(
    [
      { valor: Math.round(areaSobCurva(faixas) * 100) / 100, frase: 'Esse valor é a área sob a curva de Lorenz. O Gini é 1 menos o dobro dessa área.', motivo: 'deu a área sob a curva' },
      { valor: Math.round(areaEntreDiagonalECurva(faixas) * 100) / 100, frase: 'Esse valor é a área entre a diagonal e a curva. O Gini é o dobro dela.', motivo: 'esqueceu de dobrar a área' },
      { valor: Math.round((1 - g) * 100) / 100, frase: 'Esse valor é 1 − G, e não G: ele mede a igualdade, enquanto o Gini mede a concentração.', motivo: 'confundiu Gini com igualdade' },
      { valor: Math.round((1 - areaSobCurva(faixas)) * 100) / 100, frase: 'Esse valor é 1 menos a área sob a curva, sem dobrá-la. O Gini é 1 menos o dobro da área sob a curva.', motivo: 'esqueceu de dobrar a área' },
    ],
    resposta,
    0.011,
  )
  const linhas = faixas.map((fx, i) => `faixa ${i + 1}: ${pct(fx.estabelecimentos)} dos estabelecimentos com ${pct(fx.area)} da área`).join('; ')
  const passos: string[] = []
  let pe = 0
  let pa = 0
  let soma = 0
  for (const fx of faixas) {
    const p0 = pe
    const l0 = pa
    pe += fx.estabelecimentos / 100
    pa += fx.area / 100
    soma += (pe - p0) * (pa + l0)
    passos.push(`${fn(pe - p0, 2)} × (${fn(pa, 2)} + ${fn(l0, 2)})`)
  }
  return {
    enunciado: `Em uma região (modelo didático), os estabelecimentos, ordenados do menor para o maior, se dividem assim: ${linhas}. Calcule o índice de Gini da terra. Arredonde para duas casas decimais.`,
    resposta,
    tolerancia: 0.011,
    erros,
    resolucao: `Gini = 1 − Σ (Δp)·(L + L anterior), em que p é a fração acumulada dos estabelecimentos e L, a da área. Soma = ${passos.join(' + ')} = ${fn(soma, 3)}. Gini = 1 − ${fn(soma, 3)} = ${fn(g, 3)} ≈ ${fn(resposta, 2)}. Quanto mais perto de 1, mais concentrada é a terra.`,
    dicas: ['Monte os pontos acumulados da curva de Lorenz: (0, 0), (p1, L1), ...', 'Para cada faixa, multiplique a largura (Δp) pela soma das alturas (L + L anterior).', 'Gini = 1 − (soma desses produtos).'],
    licao: 'Gini = 1 − Σ (Δp)·(L + L anterior): 0 é igualdade total e 1 é concentração total.',
    dados: { faixas, gini: g },
  }
}

/* ------------------------------------------------------------------ área, produtividade e produção */

export interface DadosProducao {
  /** só para o gráfico de decomposição (nível 3) */
  area0?: number
  prod0?: number
  area1?: number
  prod1?: number
}

export function gerarProducao(rng: Rng, nivel: Nivel): InstanciaNum<DadosProducao> {
  if (nivel === 1) {
    const area = escolher(rng, [120, 150, 200, 250, 300, 400, 500, 800])
    const prod = escolher(rng, [2.5, 3, 3.5, 4, 4.5, 5, 6, 7.5])
    const resposta = producao(area, prod)
    const erros = limpar(
      [
        { valor: area / prod, frase: `Você dividiu a área pela produtividade (${fn(area / prod, 1)}). A produção é o produto: área × produtividade.`, motivo: 'dividiu em vez de multiplicar' },
        { valor: area + prod, frase: 'Você somou a área e a produtividade. Para a produção total, multiplique os dois valores.', motivo: 'somou em vez de multiplicar' },
        { valor: resposta * 1000, frase: `${fn(resposta * 1000, 0)} é a produção em quilogramas. O enunciado pede toneladas: divida por 1.000.`, motivo: 'errou a unidade' },
      ],
      resposta,
      0.01,
    )
    return {
      enunciado: `Uma fazenda cultiva ${fn(area, 0)} hectares de milho com produtividade de ${fn(prod, 1)} toneladas por hectare. Qual é a produção total, em toneladas?`,
      resposta,
      tolerancia: 0.01,
      unidade: 't',
      erros,
      resolucao: `Produção = área × produtividade = ${fn(area, 0)} ha × ${fn(prod, 1)} t/ha = ${fn(resposta, 1)} t.`,
      dicas: ['A produtividade é a produção por hectare.', 'Produção total = produção por hectare × número de hectares.', 'Confira as unidades: hectare e tonelada por hectare.'],
      licao: 'Produção = área × produtividade.',
    }
  }
  if (nivel === 2) {
    const prod = escolher(rng, [2.5, 3, 4, 5, 6])
    const area = escolher(rng, [200, 250, 300, 400, 500, 800, 1200])
    const meta = producao(area, prod)
    const erros = limpar(
      [
        { valor: meta * prod, frase: 'Você multiplicou a meta pela produtividade. Para achar a área, divida a produção pela produtividade.', motivo: 'multiplicou em vez de dividir' },
        { valor: prod / meta, frase: 'Você inverteu a divisão: a área é a produção ÷ produtividade.', motivo: 'inverteu a divisão' },
        { valor: meta - prod, frase: 'Você subtraiu os valores. A área sai da divisão da produção pela produtividade.', motivo: 'subtraiu' },
      ],
      area,
      0.01,
    )
    return {
      enunciado: `Uma cooperativa quer colher ${fn(meta, 0)} toneladas de soja, em uma área cuja produtividade esperada é ${fn(prod, 1)} toneladas por hectare. De quantos hectares ela precisa?`,
      resposta: area,
      tolerancia: 0.01,
      unidade: 'ha',
      erros,
      resolucao: `Produtividade = produção ÷ área, então área = produção ÷ produtividade = ${fn(meta, 0)} ÷ ${fn(prod, 1)} = ${fn(area, 0)} ha.`,
      dicas: ['Parta de produção = área × produtividade.', 'Isole a área.', 'Área = produção ÷ produtividade.'],
      licao: 'Área = produção ÷ produtividade.',
    }
  }
  // nível 3: de onde veio o crescimento
  for (let t = 0; t < 200; t++) {
    const fa = escolher(rng, [1.1, 1.2, 1.25, 1.5, 2, 0.8])
    const fp = escolher(rng, [1.2, 1.25, 1.4, 1.5, 1.6, 1.75, 2, 2.5])
    const pctProd = Math.round((fa * fp - 1) * 1000) / 10
    if (pctProd < 5) continue
    const pctArea = Math.round((fa - 1) * 1000) / 10
    const resposta = Math.round(crescimentoDaProdutividade(pctProd, pctArea) * 10) / 10
    const erros = limpar(
      [
        { valor: Math.round((pctProd - pctArea) * 10) / 10, frase: `Você subtraiu os percentuais (${fn(pctProd, 1)} − ${fn(pctArea, 1)}). Variações percentuais se combinam por multiplicação: (1 + produção) = (1 + área) × (1 + produtividade).`, motivo: 'subtraiu percentuais' },
        { valor: Math.round((pctProd / Math.abs(pctArea)) * 10) / 10, frase: 'Você dividiu os percentuais. Compare os fatores: (1 + produção) ÷ (1 + área) dá o fator da produtividade.', motivo: 'dividiu percentuais' },
        { valor: Math.round(((1 + pctProd / 100) / (1 + pctArea / 100)) * 100) / 100, frase: 'Esse é o fator da produtividade (por exemplo, 1,5), e não a variação em %. Subtraia 1 e multiplique por 100.', motivo: 'deu o fator em vez do percentual' },
      ],
      resposta,
      0.06,
    )
    if (erros.length < 2) continue
    const d = { area0: 100, prod0: 1, area1: 100 * fa, prod1: fp }
    return {
      enunciado: `Em uma região (modelo didático), a produção de grãos aumentou ${fn(pctProd, 1)}% em vinte anos, enquanto a área plantada ${pctArea >= 0 ? 'aumentou' : 'diminuiu'} ${fn(Math.abs(pctArea), 1)}%. Em quantos por cento a produtividade variou? Arredonde para uma casa decimal.`,
      resposta,
      tolerancia: 0.06,
      unidade: '%',
      erros,
      resolucao: `Produção = área × produtividade, então os fatores se multiplicam: ${fn(1 + pctProd / 100, 3)} = ${fn(1 + pctArea / 100, 3)} × (fator da produtividade). O fator da produtividade é ${fn(1 + pctProd / 100, 3)} ÷ ${fn(1 + pctArea / 100, 3)} = ${fn((1 + pctProd / 100) / (1 + pctArea / 100), 3)}, ou seja, variação de ${fn(resposta, 1)}%.`,
      dicas: ['Transforme cada variação em fator: +20% é ×1,20.', 'Os fatores de área e de produtividade se multiplicam e dão o da produção.', 'Fator da produtividade = fator da produção ÷ fator da área. Depois, subtraia 1.'],
      licao: 'Variações percentuais combinadas se multiplicam: use fatores (1 + variação), e não subtração de percentuais.',
      dados: d,
    }
  }
  throw new Error('sem decomposição')
}
