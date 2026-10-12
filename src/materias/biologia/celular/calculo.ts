/* ======================================================================
   Biologia celular: organelas, transporte e osmose, divisão celular
   (mitose e meiose) e metabolismo energético.
   ====================================================================== */

/* ------------------------------------------------------------------ organelas e estruturas */

export type TipoCelular = 'animal' | 'vegetal' | 'bacteria'

export interface Estrutura {
  id: string
  nome: string
  funcao: string
  /** quais tipos de célula a têm */
  presente: Record<TipoCelular, boolean>
  /** número de membranas que a envolvem (0 = sem membrana) */
  membranas: 0 | 1 | 2
  /** tem DNA e ribossomos próprios (origem endossimbiótica) */
  dnaProprio: boolean
}

const P = (animal: boolean, vegetal: boolean, bacteria: boolean): Record<TipoCelular, boolean> => ({ animal, vegetal, bacteria })

export const ESTRUTURAS: Estrutura[] = [
  { id: 'nucleo', nome: 'Núcleo', funcao: 'guarda o DNA, separado do citoplasma pelo envoltório nuclear, e controla a atividade da célula', presente: P(true, true, false), membranas: 2, dnaProprio: false },
  { id: 'mitocondria', nome: 'Mitocôndria', funcao: 'realiza a respiração celular aeróbica e produz a maior parte do ATP', presente: P(true, true, false), membranas: 2, dnaProprio: true },
  { id: 'cloroplasto', nome: 'Cloroplasto', funcao: 'realiza a fotossíntese', presente: P(false, true, false), membranas: 2, dnaProprio: true },
  { id: 'rer', nome: 'Retículo endoplasmático rugoso', funcao: 'sintetiza proteínas (pelos ribossomos aderidos) que serão exportadas ou colocadas em membranas e lisossomos', presente: P(true, true, false), membranas: 1, dnaProprio: false },
  { id: 'rel', nome: 'Retículo endoplasmático liso', funcao: 'sintetiza lipídios e esteroides e participa da desintoxicação', presente: P(true, true, false), membranas: 1, dnaProprio: false },
  { id: 'golgi', nome: 'Complexo de Golgi', funcao: 'modifica, empacota e distribui proteínas e lipídios em vesículas, e forma os lisossomos', presente: P(true, true, false), membranas: 1, dnaProprio: false },
  { id: 'peroxissomo', nome: 'Peroxissomo', funcao: 'decompõe o peróxido de hidrogênio (H₂O₂) pela catalase e oxida ácidos graxos', presente: P(true, true, false), membranas: 1, dnaProprio: false },
  { id: 'vacuolo', nome: 'Vacúolo central', funcao: 'armazena água e substâncias e mantém a turgescência da célula vegetal', presente: P(false, true, false), membranas: 1, dnaProprio: false },
  { id: 'ribossomo', nome: 'Ribossomo', funcao: 'sintetiza proteínas lendo o mRNA (tradução)', presente: P(true, true, true), membranas: 0, dnaProprio: false },
  { id: 'parede', nome: 'Parede celular', funcao: 'reveste e sustenta a célula; é de celulose nas plantas e de peptideoglicano nas bactérias', presente: P(false, true, true), membranas: 0, dnaProprio: false },
  { id: 'centriolo', nome: 'Centríolo', funcao: 'organiza os microtúbulos do fuso de divisão e forma cílios e flagelos', presente: P(true, false, false), membranas: 0, dnaProprio: false },
  { id: 'membrana', nome: 'Membrana plasmática', funcao: 'delimita a célula e controla o que entra e o que sai', presente: P(true, true, true), membranas: 1, dnaProprio: false },
]

export const estrutura = (id: string) => ESTRUTURAS.find((e) => e.id === id) as Estrutura

/** Estruturas presentes em um tipo de célula. */
export const presentesEm = (t: TipoCelular) => ESTRUTURAS.filter((e) => e.presente[t])

/* ------------------------------------------------------------------ transporte através da membrana */

export interface Transporte {
  id: string
  nome: string
  /** a favor do gradiente de concentração (sem gasto de energia pela célula) */
  passivo: boolean
  proteina: boolean
  /** gasta ATP */
  atp: boolean
  /** o que costuma ser transportado */
  exemplo: string
  descricao: string
}

export const TRANSPORTES: Transporte[] = [
  { id: 'simples', nome: 'Difusão simples', passivo: true, proteina: false, atp: false, exemplo: 'O₂, CO₂ e moléculas apolares atravessam a bicamada lipídica', descricao: 'a substância passa diretamente pela bicamada de fosfolipídios, a favor do gradiente, sem proteínas e sem gasto de ATP' },
  { id: 'facilitada', nome: 'Difusão facilitada', passivo: true, proteina: true, atp: false, exemplo: 'glicose e íons passam por canais ou proteínas carregadoras', descricao: 'a substância passa por canais ou proteínas carregadoras, a favor do gradiente, sem gasto de ATP' },
  { id: 'ativo', nome: 'Transporte ativo', passivo: false, proteina: true, atp: true, exemplo: 'bomba de sódio e potássio (Na⁺/K⁺-ATPase)', descricao: 'proteínas (bombas) transportam a substância contra o gradiente de concentração, com gasto de ATP' },
]

export const transporte = (id: string) => TRANSPORTES.find((t) => t.id === id) as Transporte

/* ------------------------------------------------------------------ osmose */

export type Tonicidade = 'hipotonico' | 'isotonico' | 'hipertonico'

/** Concentração do soro fisiológico (NaCl), isotônico às hemácias humanas: cerca de 0,9 % (m/V), ou 0,15 mol/L. */
export const NACL_ISOTONICO_MOLAR = 0.15
export const OSMOLARIDADE_CELULA = 0.3

/** Osmolaridade (osmol/L) de uma solução de soluto que se dissocia em i partículas, supondo dissociação completa. */
export const osmolaridade = (molar: number, i: number) => molar * i

export const SOLUTOS: { id: string; nome: string; i: number }[] = [
  { id: 'glicose', nome: 'glicose', i: 1 },
  { id: 'sacarose', nome: 'sacarose', i: 1 },
  { id: 'nacl', nome: 'NaCl', i: 2 },
  { id: 'kcl', nome: 'KCl', i: 2 },
  { id: 'cacl2', nome: 'CaCl₂', i: 3 },
  { id: 'na2so4', nome: 'Na₂SO₄', i: 3 },
]

/** O meio externo é hipotônico, isotônico ou hipertônico em relação ao interior da célula (comparando osmolaridades). */
export function tonicidade(osmolaridadeExterna: number, osmolaridadeInterna: number, tolerancia = 1e-9): Tonicidade {
  if (Math.abs(osmolaridadeExterna - osmolaridadeInterna) <= tolerancia) return 'isotonico'
  return osmolaridadeExterna < osmolaridadeInterna ? 'hipotonico' : 'hipertonico'
}

/** A água atravessa a membrana semipermeável do lado de menor osmolaridade para o de maior. */
export const sentidoDaAgua = (osmA: number, osmB: number): 'A→B' | 'B→A' | 'nenhum' => (osmA === osmB ? 'nenhum' : osmA < osmB ? 'A→B' : 'B→A')

/** Pressão osmótica π = i · M · R · T, em atm, com R = 0,082 atm·L/(mol·K) e T em kelvin. */
export const R_ATM = 0.082
export const pressaoOsmotica = (molar: number, i: number, celsius: number) => i * molar * R_ATM * (celsius + 273)

/** Volume relativo de equilíbrio de um osmômetro sem parede elástica: V = V₀ · C_dentro ÷ C_fora (o soluto não atravessa). */
export const volumeRelativoEquilibrio = (cDentro: number, cFora: number) => cDentro / cFora

/** Volume ao longo do tempo, aproximando-se do equilíbrio de forma exponencial. */
export const volumeNoTempo = (v0: number, vEq: number, k: number, t: number) => vEq + (v0 - vEq) * Math.exp(-k * t)

/** Efeito sobre uma hemácia (célula animal): sem parede, pode estourar ou murchar. */
export function efeitoHemacia(t: Tonicidade): 'lise' | 'normal' | 'crenacao' {
  return t === 'hipotonico' ? 'lise' : t === 'isotonico' ? 'normal' : 'crenacao'
}

/** Efeito sobre uma célula vegetal (com parede): fica túrgida, flácida ou sofre plasmólise. */
export function efeitoCelulaVegetal(t: Tonicidade): 'turgida' | 'flacida' | 'plasmolise' {
  return t === 'hipotonico' ? 'turgida' : t === 'isotonico' ? 'flacida' : 'plasmolise'
}

/** Diluição: volume final para levar uma solução de concentração c1 e volume v1 à concentração c2. */
export const volumeFinalDiluicao = (c1: number, v1: number, c2: number) => (c1 * v1) / c2

/* ------------------------------------------------------------------ divisão celular */

export type TipoDivisao = 'mitose' | 'meiose'

export const FASES_MITOSE = ['G1', 'S/G2', 'Prófase', 'Metáfase', 'Anáfase', 'Telófase'] as const
export const FASES_MEIOSE = ['G1', 'S/G2', 'Prófase I', 'Metáfase I', 'Anáfase I', 'Telófase I', 'Prófase II', 'Metáfase II', 'Anáfase II', 'Telófase II'] as const

export interface Contagem {
  /** células existentes nesta fase */
  celulas: number
  /** cromossomos em cada célula (cada cromátide-irmã já separada conta como cromossomo) */
  cromossomosPorCelula: number
  /** cromátides em cada célula */
  cromatidesPorCelula: number
  /** quantidade de DNA em cada célula, em unidades C (1C = conteúdo haploide não replicado) */
  dnaPorCelula: number
}

/**
 * Contagens por fase, para um organismo diploide com 2n cromossomos (n2 = 2n).
 * Convenção: antes da replicação, cada cromossomo tem 1 cromátide; depois, 2. Na anáfase, as cromátides-irmãs
 * separadas passam a contar como cromossomos independentes.
 */
export function contagem(tipo: TipoDivisao, fase: string, n2: number): Contagem {
  const n = n2 / 2
  const c = (celulas: number, cromos: number, cromatides: number, dna: number): Contagem => ({ celulas, cromossomosPorCelula: cromos, cromatidesPorCelula: cromatides, dnaPorCelula: dna })
  if (fase === 'G1') return c(1, n2, n2, 2)
  if (tipo === 'mitose') {
    switch (fase) {
      case 'S/G2':
      case 'Prófase':
      case 'Metáfase':
        return c(1, n2, 2 * n2, 4)
      case 'Anáfase':
        return c(1, 2 * n2, 2 * n2, 4)
      case 'Telófase':
        return c(2, n2, n2, 2)
    }
  } else {
    switch (fase) {
      case 'S/G2':
      case 'Prófase I':
      case 'Metáfase I':
      case 'Anáfase I':
        return c(1, n2, 2 * n2, 4)
      case 'Telófase I':
      case 'Prófase II':
      case 'Metáfase II':
        return c(2, n, 2 * n, 2)
      case 'Anáfase II':
        return c(2, n2, n2, 2)
      case 'Telófase II':
        return c(4, n, n, 1)
    }
  }
  throw new Error(`fase desconhecida: ${tipo} ${fase}`)
}

/** Número de células depois de k divisões mitóticas sucessivas, a partir de uma. */
export const celulasAposMitoses = (k: number) => 2 ** k

/** Combinações de cromossomos nos gametas, sem crossing-over: 2ⁿ, com n = metade de 2n. */
export const combinacoesDeGametas = (n2: number) => 2 ** (n2 / 2)

/** Cromossomos homólogos (pares) e tétrades na metáfase I. */
export const paresDeHomologos = (n2: number) => n2 / 2

/* ------------------------------------------------------------------ metabolismo energético */

export const MASSA_MOLAR = { glicose: 180, CO2: 44, O2: 32, H2O: 18 } as const

/** Fermentação de n mols de glicose: ATP líquido e produtos. */
export function fermentacao(tipo: 'alcoolica' | 'latica', mols: number) {
  return { atp: 2 * mols, co2: tipo === 'alcoolica' ? 2 * mols : 0, etanol: tipo === 'alcoolica' ? 2 * mols : 0, lactato: tipo === 'latica' ? 2 * mols : 0 }
}

/** Respiração aeróbica de n mols de glicose (C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O): consumo e produção de gases e água. */
export const respiracaoAerobica = (mols: number) => ({ o2: 6 * mols, co2: 6 * mols, h2o: 6 * mols })

/** Fotossíntese (6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂): para n mols de glicose formados. */
export const fotossintese = (molsGlicose: number) => ({ co2: 6 * molsGlicose, h2o: 6 * molsGlicose, o2: 6 * molsGlicose })

/** Taxa de fotossíntese bruta em função da luz: P(I) = Pmax · I ÷ (K + I). */
export const fotossinteseBruta = (pmax: number, k: number, luz: number) => (pmax * luz) / (k + luz)

/** Taxa líquida = fotossíntese − respiração. */
export const fotossinteseLiquida = (pmax: number, k: number, r: number, luz: number) => fotossinteseBruta(pmax, k, luz) - r

/** Ponto de compensação luminoso: a luz em que a fotossíntese iguala a respiração (líquida = 0). */
export const pontoDeCompensacao = (pmax: number, k: number, r: number) => (r * k) / (pmax - r)

/** Luz ao longo do dia: senoide entre 6 h e 18 h, zero à noite. */
export const luzDoDia = (hora: number, imax: number) => (hora >= 6 && hora <= 18 ? imax * Math.sin((Math.PI * (hora - 6)) / 12) : 0)

/** Balanço de O₂ de um dia (24 h), integrado por passos pequenos: positivo = a planta produz mais do que consome. */
export function balancoDiario(pmax: number, k: number, r: number, imax: number, passo = 0.01): number {
  let total = 0
  for (let h = 0; h < 24; h += passo) total += fotossinteseLiquida(pmax, k, r, luzDoDia(h + passo / 2, imax)) * passo
  return total
}

/** Atividade enzimática relativa em função da temperatura: curva assimétrica com máximo na temperatura ótima. */
export function atividadeEnzima(temperatura: number, otima: number, desnaturacao: number): number {
  if (temperatura <= 0 || temperatura >= desnaturacao) return 0
  if (temperatura <= otima) return (temperatura / otima) ** 2
  return Math.max(0, 1 - ((temperatura - otima) / (desnaturacao - otima)) ** 2)
}
