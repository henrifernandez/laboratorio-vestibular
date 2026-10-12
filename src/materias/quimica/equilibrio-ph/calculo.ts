/** pH, equilíbrio químico, Le Chatelier e titulação. Temperatura de 25 °C, onde Kw = 1,0·10⁻¹⁴. */

export const KW = 1e-14

export const pH = (h: number) => -Math.log10(h)
export const hDePh = (valor: number) => 10 ** -valor
export const pOHDePh = (valor: number) => 14 - valor

/** [H⁺] de um ácido forte monoprótico de concentração C, contando também a água (importa em soluções muito diluídas). */
export function hAcidoForte(c: number): number {
  return (c + Math.sqrt(c * c + 4 * KW)) / 2
}

/** pH de uma base forte monobásica de concentração C (com a contribuição da água). */
export function phBaseForte(c: number): number {
  const oh = (c + Math.sqrt(c * c + 4 * KW)) / 2
  return 14 + Math.log10(oh)
}

export const phAcidoForte = (c: number) => pH(hAcidoForte(c))

/** Ácido fraco HA de constante Ka e concentração inicial C: resolve x² + Ka·x − Ka·C = 0 (ionização da água desprezada). */
export function hAcidoFraco(ka: number, c: number): number {
  return (-ka + Math.sqrt(ka * ka + 4 * ka * c)) / 2
}

/** aproximação usual: [H⁺] = √(Ka·C), boa quando a ionização é pequena (< 5 %) */
export const hAcidoFracoAprox = (ka: number, c: number) => Math.sqrt(ka * c)
export const grauIonizacao = (h: number, c: number) => h / c

/** Ka de um ácido fraco a partir do pH medido de uma solução de concentração C (aproximação [H⁺]² / C). */
export const kaDePh = (valorPh: number, c: number) => hDePh(valorPh) ** 2 / c

/* ------------------------------------------------------------------ titulação */

export interface Titulacao {
  /** concentração do ácido (mol/L) e volume (mL) */
  ca: number
  va: number
  /** Ka do ácido; null = ácido forte */
  ka: number | null
  /** concentração da base forte (mol/L) */
  cb: number
}

/** volume de base (mL) no ponto de equivalência */
export const volumeEquivalencia = (t: Titulacao) => (t.ca * t.va) / t.cb

/**
 * pH ao adicionar `vb` mL de base forte (monobásica) a um ácido forte ou fraco (monoprótico).
 * Resolve a eletroneutralidade [Na⁺] + [H⁺] = [A⁻] + [OH⁻] por bisecção, sem aproximações de tampão.
 */
export function phTitulacao(t: Titulacao, vb: number): number {
  const v = (t.va + vb) / 1000
  const na = (t.cb * vb) / 1000 / v
  const ct = (t.ca * t.va) / 1000 / v
  const saldo = (valorPh: number) => {
    const h = hDePh(valorPh)
    const a = t.ka === null ? ct : (ct * t.ka) / (t.ka + h)
    return na + h - a - KW / h
  }
  let baixo = 0
  let alto = 14
  // saldo diminui quando o pH sobe (h cai, KW/h sobe... ) : procura o zero
  for (let i = 0; i < 80; i++) {
    const meio = (baixo + alto) / 2
    if (saldo(meio) > 0) baixo = meio
    else alto = meio
  }
  return (baixo + alto) / 2
}

/* ------------------------------------------------------------------ equilíbrio químico */

export type Fase = 'g' | 's' | 'l' | 'aq'

export interface Especie {
  f: string
  c: number
  fase: Fase
}

export interface ReacaoEq {
  id: string
  reag: Especie[]
  prod: Especie[]
  /** ΔH da reação como escrita, em kJ (positivo = endotérmica) */
  dH: number
}

const sp = (f: string, c: number, fase: Fase = 'g'): Especie => ({ f, c, fase })

export const REACOES_EQ: ReacaoEq[] = [
  { id: 'haber', reag: [sp('N2', 1), sp('H2', 3)], prod: [sp('NH3', 2)], dH: -92 },
  { id: 'n2o4', reag: [sp('N2O4', 1)], prod: [sp('NO2', 2)], dH: 57 },
  { id: 'so3', reag: [sp('SO2', 2), sp('O2', 1)], prod: [sp('SO3', 2)], dH: -198 },
  { id: 'hi', reag: [sp('H2', 1), sp('I2', 1)], prod: [sp('HI', 2)], dH: -9 },
  { id: 'co', reag: [sp('CO', 2), sp('O2', 1)], prod: [sp('CO2', 2)], dH: -566 },
  { id: 'pcl5', reag: [sp('PCl5', 1)], prod: [sp('PCl3', 1), sp('Cl2', 1)], dH: 88 },
  { id: 'calcario', reag: [sp('CaCO3', 1, 's')], prod: [sp('CaO', 1, 's'), sp('CO2', 1)], dH: 178 },
  { id: 'shift', reag: [sp('CO', 1), sp('H2O', 1)], prod: [sp('CO2', 1), sp('H2', 1)], dH: -41 },
]

export const reacaoEq = (id: string) => REACOES_EQ.find((r) => r.id === id) as ReacaoEq

/** variação do número de mols de gás (produtos − reagentes) */
export const deltaGas = (r: ReacaoEq) => r.prod.filter((e) => e.fase === 'g').reduce((s, e) => s + e.c, 0) - r.reag.filter((e) => e.fase === 'g').reduce((s, e) => s + e.c, 0)

export type Perturbacao =
  | { tipo: 'add'; especie: number }
  | { tipo: 'remove'; especie: number }
  | { tipo: 'T'; sobe: boolean }
  | { tipo: 'P'; aumenta: boolean }
  | { tipo: 'cat' }
  | { tipo: 'inerte' }

export type Sentido = 'direta' | 'inversa' | 'nenhum'

/** todas as espécies, reagentes primeiro */
export const especies = (r: ReacaoEq): Especie[] => [...r.reag, ...r.prod]

/** Princípio de Le Chatelier aplicado a uma reação e a uma perturbação. */
export function deslocamento(r: ReacaoEq, p: Perturbacao): { sentido: Sentido; porque: string; codigo: string } {
  const todas = especies(r)
  const nr = r.reag.length
  switch (p.tipo) {
    case 'add':
    case 'remove': {
      const e = todas[p.especie] as Especie
      const ehReagente = p.especie < nr
      if (e.fase === 's' || e.fase === 'l') return { sentido: 'nenhum', porque: `${e.f} é ${e.fase === 's' ? 'sólido' : 'líquido puro'}: sua quantidade não aparece na constante de equilíbrio, então mudá-la não desloca o equilíbrio (só há deslocamento se a concentração ou a pressão de substâncias gasosas ou dissolvidas mudar).`, codigo: 'solido' }
      const adiciona = p.tipo === 'add'
      const direta = ehReagente === adiciona
      return {
        sentido: direta ? 'direta' : 'inversa',
        porque: `${adiciona ? 'Aumentar' : 'Diminuir'} a concentração de ${ehReagente ? 'um reagente' : 'um produto'} faz o sistema reagir para ${adiciona ? 'consumir o que foi acrescentado' : 'repor o que foi retirado'}: o equilíbrio se desloca para ${direta ? 'a direita (formação de produtos)' : 'a esquerda (formação de reagentes)'}.`,
        codigo: 'concentracao',
      }
    }
    case 'T': {
      const endo = r.dH > 0
      const direta = p.sobe === endo
      return {
        sentido: direta ? 'direta' : 'inversa',
        porque: `A reação direta é ${endo ? 'endotérmica (ΔH > 0)' : 'exotérmica (ΔH < 0)'}. ${p.sobe ? 'Aquecer favorece o sentido que absorve calor' : 'Resfriar favorece o sentido que libera calor'}, que é a reação ${direta ? 'direta' : 'inversa'}. Neste caso a própria constante de equilíbrio muda.`,
        codigo: 'temperatura',
      }
    }
    case 'P': {
      const dn = deltaGas(r)
      if (dn === 0) return { sentido: 'nenhum', porque: 'Os dois lados têm o mesmo número de mols de gás, então mudar a pressão (ou o volume) não favorece nenhum dos lados.', codigo: 'pressao-igual' }
      const ladoMenor = dn < 0 ? 'direta' : 'inversa'
      const direta = p.aumenta ? ladoMenor === 'direta' : ladoMenor !== 'direta'
      const molsR = r.reag.filter((e) => e.fase === 'g').reduce((s, e) => s + e.c, 0)
      const molsP = r.prod.filter((e) => e.fase === 'g').reduce((s, e) => s + e.c, 0)
      return {
        sentido: direta ? 'direta' : 'inversa',
        porque: `Reagentes gasosos: ${molsR} mol; produtos gasosos: ${molsP} mol. ${p.aumenta ? 'Aumentar a pressão favorece o lado com menos mols de gás' : 'Diminuir a pressão favorece o lado com mais mols de gás'}, ou seja, a reação ${direta ? 'direta' : 'inversa'}.`,
        codigo: 'pressao',
      }
    }
    case 'cat':
      return { sentido: 'nenhum', porque: 'O catalisador acelera igualmente as reações direta e inversa. O equilíbrio é atingido mais depressa, mas a posição dele e a constante de equilíbrio não mudam.', codigo: 'catalisador' }
    default:
      return { sentido: 'nenhum', porque: 'Um gás inerte adicionado a volume constante não muda as concentrações dos participantes, então o quociente de reação continua igual à constante: não há deslocamento.', codigo: 'inerte' }
  }
}

/** Kc a partir das concentrações no equilíbrio (sólidos e líquidos puros ficam fora da expressão). */
export function kc(r: ReacaoEq, conc: number[]): number {
  const todas = especies(r)
  const nr = r.reag.length
  let num = 1
  let den = 1
  todas.forEach((e, i) => {
    if (e.fase === 's' || e.fase === 'l') return
    const fator = (conc[i] as number) ** e.c
    if (i < nr) den *= fator
    else num *= fator
  })
  return num / den
}

/** Quociente de reação Q (mesma forma de Kc, com concentrações quaisquer). */
export const quociente = kc

/**
 * Concentrações no equilíbrio de N₂O₄ ⇌ 2 NO₂ a partir de c0 = [N₂O₄] + [NO₂]/2 (conserva o N) e Kc.
 * x² / (c0 − x/2) = K → x² + (K/2)x − K·c0 = 0.
 */
export function equilibrioN2O4(c0: number, k: number): { n2o4: number; no2: number } {
  const x = (-k / 2 + Math.sqrt((k * k) / 4 + 4 * k * c0)) / 2
  return { n2o4: c0 - x / 2, no2: x }
}

/** Kc de N₂O₄ ⇌ 2 NO₂ em função da temperatura (modelo didático de van't Hoff com ΔH = +57 kJ/mol e Kc ≈ 0,006 a 298 K). */
export function kcN2O4(T: number): number {
  const R = 8.314
  const K298 = 0.006
  return K298 * Math.exp((-57000 / R) * (1 / T - 1 / 298))
}
