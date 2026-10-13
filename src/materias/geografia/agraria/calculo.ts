/**
 * Cálculos de estrutura fundiária (curva de Lorenz e índice de Gini) e de produção agrícola.
 * Todos os números dos exercícios são modelos didáticos.
 */

/** Uma faixa de estabelecimentos: que parte deles (em %) e que parte da área (em %) ela reúne. */
export interface FaixaFundiaria {
  estabelecimentos: number
  area: number
}

export interface PontoLorenz {
  /** fração acumulada dos estabelecimentos (0 a 1), dos menores para os maiores */
  p: number
  /** fração acumulada da área (0 a 1) */
  l: number
}

/** Pontos da curva de Lorenz de uma tabela de faixas, em ordem dos menores estabelecimentos para os maiores. */
export function pontosLorenz(faixas: FaixaFundiaria[]): PontoLorenz[] {
  const pontos: PontoLorenz[] = [{ p: 0, l: 0 }]
  let p = 0
  let l = 0
  for (const f of faixas) {
    p += f.estabelecimentos / 100
    l += f.area / 100
    pontos.push({ p, l })
  }
  return pontos
}

/** Gini da curva de Lorenz linear por trechos: 1 menos a soma de (Δp)·(L + L anterior). */
export function giniDeFaixas(faixas: FaixaFundiaria[]): number {
  const pts = pontosLorenz(faixas)
  let soma = 0
  for (let i = 1; i < pts.length; i++) soma += ((pts[i] as PontoLorenz).p - (pts[i - 1] as PontoLorenz).p) * ((pts[i] as PontoLorenz).l + (pts[i - 1] as PontoLorenz).l)
  return 1 - soma
}

/** Área sob a curva de Lorenz (a metade da soma acima): o Gini é 1 menos o dobro dela. */
export const areaSobCurva = (faixas: FaixaFundiaria[]) => (1 - giniDeFaixas(faixas)) / 2

/** Área entre a diagonal e a curva: o Gini é o dobro dela. */
export const areaEntreDiagonalECurva = (faixas: FaixaFundiaria[]) => giniDeFaixas(faixas) / 2

/* ------------------------------------------------------------------ curva modelo L(p) = p^k */

/** Fração da área acumulada até a fração `p` dos estabelecimentos, no modelo L(p) = p^k (k ≥ 1; k = 1 é a igualdade). */
export const lorenzModelo = (p: number, k: number) => Math.pow(p, k)

/** Gini do modelo: (k − 1) / (k + 1). */
export const giniModelo = (k: number) => (k - 1) / (k + 1)

/** Fração da área que fica com a fração `q` dos maiores estabelecimentos no modelo. */
export const parteDosMaiores = (q: number, k: number) => 1 - Math.pow(1 - q, k)

/** Expoente k para que os `q` maiores estabelecimentos fiquem com a fração `t` da área. */
export const kDosMaiores = (t: number, q = 0.1) => Math.log(1 - t) / Math.log(1 - q)

/** Pontos da curva modelo, para desenhar. */
export function curvaModelo(k: number, n = 60): PontoLorenz[] {
  return Array.from({ length: n + 1 }, (_, i) => ({ p: i / n, l: lorenzModelo(i / n, k) }))
}

/* ------------------------------------------------------------------ produção, área e produtividade */

export const producao = (area: number, produtividade: number) => area * produtividade
export const produtividade = (prod: number, area: number) => prod / area
export const variacaoPercentual = (antes: number, depois: number) => ((depois - antes) / antes) * 100

export interface Decomposicao {
  fatorArea: number
  fatorProdutividade: number
  fatorProducao: number
  /** variações em % */
  pctArea: number
  pctProdutividade: number
  pctProducao: number
  /** parte do crescimento (em escala logarítmica) explicada pela área, de 0 a 1 */
  partePelaArea: number
}

/**
 * A produção é área × produtividade, então o fator da produção é o produto dos fatores.
 * A parte de cada um no crescimento é medida pelos logaritmos (que somam), sem depender da ordem.
 */
export function decompor(area0: number, prod0: number, area1: number, prod1: number): Decomposicao {
  const fa = area1 / area0
  const fp = prod1 / prod0
  const f = fa * fp
  const total = Math.log(f)
  return {
    fatorArea: fa,
    fatorProdutividade: fp,
    fatorProducao: f,
    pctArea: (fa - 1) * 100,
    pctProdutividade: (fp - 1) * 100,
    pctProducao: (f - 1) * 100,
    partePelaArea: Math.abs(total) < 1e-12 ? 0.5 : Math.log(fa) / total,
  }
}

/** Crescimento da produtividade (em %) que explica, junto com a variação da área, a variação da produção. */
export const crescimentoDaProdutividade = (pctProducao: number, pctArea: number) => ((1 + pctProducao / 100) / (1 + pctArea / 100) - 1) * 100
