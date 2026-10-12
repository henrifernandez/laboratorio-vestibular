import { massaMolar } from '../comum/elementos'

/* ------------------------------------------------------------------ combustíveis */

export interface Combustivel {
  id: string
  nome: string
  formula: string
  /** equação balanceada (reagentes e produtos com coeficientes inteiros), na ordem [combustível, O2, CO2, H2O] */
  coefs: [number, number, number, number]
  /** energia liberada por mol de combustível, em kJ (valores de tabela arredondados, combustão completa) */
  entalpia: number
}

/**
 * Combustão completa. As entalpias são valores de tabela arredondados (CH₄ 890, C₃H₈ 2220, C₄H₁₀ 2877,
 * C₂H₅OH 1367, C₈H₁₈ 5471 kJ por mol de combustível) e servem para comparar combustíveis.
 */
export const COMBUSTIVEIS: Combustivel[] = [
  { id: 'metano', nome: 'metano (gás natural)', formula: 'CH4', coefs: [1, 2, 1, 2], entalpia: 890 },
  { id: 'propano', nome: 'propano', formula: 'C3H8', coefs: [1, 5, 3, 4], entalpia: 2220 },
  { id: 'butano', nome: 'butano (gás de cozinha)', formula: 'C4H10', coefs: [2, 13, 8, 10], entalpia: 2877 },
  { id: 'etanol', nome: 'etanol', formula: 'C2H5OH', coefs: [1, 3, 2, 3], entalpia: 1367 },
  { id: 'octano', nome: 'octano (representa a gasolina)', formula: 'C8H18', coefs: [2, 25, 16, 18], entalpia: 5471 },
]

export const combustivel = (id: string): Combustivel => COMBUSTIVEIS.find((c) => c.id === id) as Combustivel

export const MM_CO2 = 44
export const MM_H2O = 18

/** mol de CO₂ por mol de combustível queimado */
export const co2PorMol = (c: Combustivel) => c.coefs[2] / c.coefs[0]

/** massa de CO₂ (g) emitida por grama de combustível */
export const co2PorGrama = (c: Combustivel) => (co2PorMol(c) * MM_CO2) / massaMolar(c.formula)

/** gramas de CO₂ emitidos por megajoule de energia liberada */
export const co2PorMJ = (c: Combustivel) => (co2PorMol(c) * MM_CO2) / (c.entalpia / 1000)

/** massa de CO₂ (g) a partir de uma massa de combustível (g) */
export const massaCO2 = (c: Combustivel, massaCombustivel: number) => massaCombustivel * co2PorGrama(c)

/* ------------------------------------------------------------------ enxofre e chuva ácida */

/** S + O₂ → SO₂: massa de SO₂ a partir da massa de enxofre */
export const so2DeEnxofre = (massaS: number) => (massaS * massaMolar('SO2')) / massaMolar('S')

/** S → SO₂ → SO₃ → H₂SO₄ (1 mol de S forma 1 mol de H₂SO₄) */
export const h2so4DeEnxofre = (massaS: number) => (massaS * massaMolar('H2SO4')) / massaMolar('S')

/** pH da chuva "limpa": CO₂ da atmosfera dissolvido (≈ 5,6) */
export const PH_CHUVA_NATURAL = 5.6

/** [H⁺] da água de chuva com CO₂ (pH natural 5,6) mais `cAcido` mol/L de H⁺ de ácidos fortes dissolvidos (H₂SO₄, HNO₃). */
export function hChuva(cAcido: number): number {
  const kco2 = (10 ** -PH_CHUVA_NATURAL) ** 2
  return (cAcido + Math.sqrt(cAcido * cAcido + 4 * kco2)) / 2
}

export const phChuva = (cAcido: number) => -Math.log10(hChuva(cAcido))

/* ------------------------------------------------------------------ efeito estufa (modelo de uma camada) */

export const SIGMA = 5.670374e-8
export const S0 = 1361

/** radiação solar absorvida por m² médio da Terra (W/m²): S(1 − albedo) / 4 */
export const solAbsorvido = (albedo: number, s = S0) => (s * (1 - albedo)) / 4

/**
 * Temperatura da superfície (K) num modelo em que a atmosfera absorve a fração ε da radiação infravermelha
 * da superfície e a reemite igualmente para cima e para baixo: σT⁴(1 − ε/2) = S(1 − albedo)/4.
 */
export function temperaturaSuperficie(albedo: number, eps: number, s = S0): number {
  return (solAbsorvido(albedo, s) / (SIGMA * (1 - eps / 2))) ** 0.25
}

export interface FluxosEstufa {
  /** solar absorvido */
  F: number
  /** infravermelho emitido pela superfície */
  superficie: number
  /** infravermelho que a atmosfera devolve para baixo */
  contra: number
  /** infravermelho que escapa para o espaço (atmosfera para cima + parte que atravessa) */
  escapa: number
  T: number
}

export function fluxos(albedo: number, eps: number, s = S0): FluxosEstufa {
  const T = temperaturaSuperficie(albedo, eps, s)
  const superficie = SIGMA * T ** 4
  const contra = (eps / 2) * superficie
  const escapa = (1 - eps) * superficie + (eps / 2) * superficie
  return { F: solAbsorvido(albedo, s), superficie, contra, escapa, T }
}

/* ------------------------------------------------------------------ química verde */

export interface ReacaoVerde {
  id: string
  nome: string
  reagentes: string[]
  produtos: string[]
  coefs: number[]
  /** índice, em [...reagentes, ...produtos], do produto desejado */
  desejado: number
}

const rv = (id: string, nome: string, reagentes: string[], produtos: string[], coefs: number[], desejado: number): ReacaoVerde => ({ id, nome, reagentes, produtos, coefs, desejado })

export const REACOES_VERDES: ReacaoVerde[] = [
  rv('hidrogenacao', 'hidrogenação do eteno', ['C2H4', 'H2'], ['C2H6'], [1, 1, 1], 2),
  rv('hidratacao', 'hidratação do eteno', ['C2H4', 'H2O'], ['C2H5OH'], [1, 1, 1], 2),
  rv('haber', 'síntese da amônia', ['N2', 'H2'], ['NH3'], [1, 3, 2], 2),
  rv('adicao-hcl', 'adição de HCl ao eteno', ['C2H4', 'HCl'], ['C2H5Cl'], [1, 1, 1], 2),
  rv('calcario-cao', 'calcinação do calcário (cal virgem)', ['CaCO3'], ['CaO', 'CO2'], [1, 1, 1], 1),
  rv('calcario-co2', 'calcinação do calcário (CO₂)', ['CaCO3'], ['CaO', 'CO2'], [1, 1, 1], 2),
  rv('esterificacao', 'esterificação do etanol com ácido acético', ['C2H5OH', 'CH3COOH'], ['CH3COOC2H5', 'H2O'], [1, 1, 1, 1], 2),
  rv('neutralizacao', 'neutralização do HCl pelo NaOH', ['HCl', 'NaOH'], ['NaCl', 'H2O'], [1, 1, 1, 1], 2),
  rv('mg-acido', 'ataque do magnésio ao ácido sulfúrico', ['Mg', 'H2SO4'], ['MgSO4', 'H2'], [1, 1, 1, 1], 2),
  rv('ferro', 'redução do óxido de ferro(III)', ['Fe2O3', 'CO'], ['Fe', 'CO2'], [1, 3, 2, 3], 2),
  rv('clorometano', 'cloração do metano', ['CH4', 'Cl2'], ['CH3Cl', 'HCl'], [1, 1, 1, 1], 2),
  rv('clorato', 'decomposição do clorato de potássio', ['KClO3'], ['KCl', 'O2'], [2, 2, 3], 2),
  rv('ca-oh', 'neutralização do hidróxido de cálcio', ['Ca(OH)2', 'HCl'], ['CaCl2', 'H2O'], [1, 2, 1, 2], 2),
]

export const reacaoVerde = (id: string) => REACOES_VERDES.find((r) => r.id === id) as ReacaoVerde

const MM = massaMolar

/** massa (g) dos reagentes da equação balanceada */
export const massaReagentes = (r: ReacaoVerde) => r.reagentes.reduce((s, f, i) => s + (r.coefs[i] as number) * MM(f), 0)

/** massa (g) do produto desejado na equação balanceada */
export const massaDesejada = (r: ReacaoVerde) => {
  const todas = [...r.reagentes, ...r.produtos]
  return (r.coefs[r.desejado] as number) * MM(todas[r.desejado] as string)
}

/** economia atômica (%): massa do produto desejado ÷ massa de todos os reagentes × 100 */
export const economiaAtomica = (r: ReacaoVerde) => (massaDesejada(r) / massaReagentes(r)) * 100

/** fator E: massa de resíduos ÷ massa de produto desejado obtido (sem contar solventes), com rendimento η (0 a 1) */
export function fatorE(r: ReacaoVerde, rendimento = 1): number {
  const obtido = massaDesejada(r) * rendimento
  return (massaReagentes(r) - obtido) / obtido
}
