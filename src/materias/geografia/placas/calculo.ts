/** Tectônica de placas: tipos de limite, feições que cada um forma e as contas de deslocamento. */
import { cenaDoLimite, type Cena } from './cenas'

export type Crosta = 'oceanica' | 'continental'
export type Movimento = 'afastam' | 'aproximam' | 'deslizam'
export type IdLimite = 'dorsal' | 'rifte' | 'subducao-continental' | 'subducao-oceanica' | 'colisao' | 'transformante'
export type ClasseLimite = 'divergente' | 'convergente' | 'transformante'

export const NOME_CROSTA: Record<Crosta, string> = { oceanica: 'oceânica', continental: 'continental' }
export const NOME_MOVIMENTO: Record<Movimento, string> = { afastam: 'se afastam', aproximam: 'se aproximam', deslizam: 'deslizam lado a lado' }

export interface Limite {
  id: IdLimite
  nome: string
  classe: ClasseLimite
  /** o que se forma, em frases curtas */
  feicoes: string[]
  vulcoes: boolean
  /** sismos: onde e quão fundos */
  sismos: string
  /** quem se forma ou se destrói */
  crosta: string
  explicacao: string
}

export const LIMITES: Record<IdLimite, Limite> = {
  dorsal: {
    id: 'dorsal',
    nome: 'Dorsal oceânica',
    classe: 'divergente',
    feicoes: ['dorsal meso-oceânica (cadeia submarina)', 'crosta oceânica nova, simétrica dos dois lados'],
    vulcoes: true,
    sismos: 'rasos e fracos',
    crosta: 'é criada: o magma sobe, esfria e vira crosta nova',
    explicacao: 'Duas placas oceânicas se afastam; o magma do manto sobe pela fenda e forma crosta nova (assoalho oceânico), que fica mais velha quanto mais longe da dorsal.',
  },
  rifte: {
    id: 'rifte',
    nome: 'Rifte continental',
    classe: 'divergente',
    feicoes: ['vale de afundamento (rifte)', 'vulcões nas bordas', 'lagos alongados; se o afastamento continua, entra o mar'],
    vulcoes: true,
    sismos: 'rasos',
    crosta: 'é esticada e afinada; em estágio avançado, forma-se crosta oceânica',
    explicacao: 'A crosta continental é esticada e afunda no meio; é o início da abertura de um oceano, como no leste da África.',
  },
  'subducao-continental': {
    id: 'subducao-continental',
    nome: 'Subducção oceano-continente',
    classe: 'convergente',
    feicoes: ['fossa oceânica', 'cordilheira na borda do continente', 'cadeia de vulcões'],
    vulcoes: true,
    sismos: 'de rasos a muito profundos, ao longo da placa que afunda',
    crosta: 'oceânica é destruída (afunda no manto); a continental cresce e se dobra',
    explicacao: 'A placa oceânica, mais densa, afunda sob a continental. A fusão parcial do material que desce alimenta os vulcões da cordilheira, como nos Andes.',
  },
  'subducao-oceanica': {
    id: 'subducao-oceanica',
    nome: 'Subducção oceano-oceano',
    classe: 'convergente',
    feicoes: ['fossa oceânica profunda', 'arco de ilhas vulcânicas'],
    vulcoes: true,
    sismos: 'de rasos a muito profundos',
    crosta: 'oceânica é destruída: a mais velha e densa afunda',
    explicacao: 'Uma placa oceânica afunda sob outra (em geral a mais velha e densa). Os vulcões que se formam acima emergem como um arco de ilhas, como no Japão e nas Marianas.',
  },
  colisao: {
    id: 'colisao',
    nome: 'Colisão continental',
    classe: 'convergente',
    feicoes: ['cordilheira dobrada, muito alta', 'crosta espessada (raízes profundas)'],
    vulcoes: false,
    sismos: 'rasos a intermediários, frequentes',
    crosta: 'não afunda: continentes são leves demais; a crosta se empilha e dobra',
    explicacao: 'Dois continentes, ambos pouco densos, não conseguem afundar no manto. Eles se empilham e se dobram, formando cadeias altas como o Himalaia, quase sem vulcanismo.',
  },
  transformante: {
    id: 'transformante',
    nome: 'Falha transformante',
    classe: 'transformante',
    feicoes: ['falha longa, em linha reta', 'rios e estradas deslocados'],
    vulcoes: false,
    sismos: 'rasos e fortes, quando a falha destrava',
    crosta: 'nem criada nem destruída: as placas só deslizam lado a lado',
    explicacao: 'As placas deslizam em sentidos opostos. Elas travam por atrito e, quando soltam de repente, vem o terremoto. Não há vulcões nem formação de cordilheira.',
  },
}

/** Qual limite resulta de dois tipos de crosta e do movimento. `null` = combinação que não ocorre na natureza. */
export function limiteDe(a: Crosta, b: Crosta, mov: Movimento): Limite | null {
  if (mov === 'deslizam') return LIMITES.transformante
  if (mov === 'afastam') {
    if (a !== b) return null
    return a === 'oceanica' ? LIMITES.dorsal : LIMITES.rifte
  }
  if (a === 'continental' && b === 'continental') return LIMITES.colisao
  if (a === 'oceanica' && b === 'oceanica') return LIMITES['subducao-oceanica']
  return LIMITES['subducao-continental']
}

/** Posição (0 = esquerda, 1 = direita) da placa que afunda, quando há subducção. */
export function ladoQueAfunda(a: Crosta, b: Crosta): 0 | 1 | null {
  if (a === 'continental' && b === 'continental') return null
  if (a === 'oceanica') return 0
  return 1
}

/* ------------------------------------------------------------------ deslocamento */

/** 1 cm/ano = 10 km por milhão de anos. Devolve km. */
export function deslocamentoKm(cmAno: number, milhoesDeAnos: number): number {
  return cmAno * milhoesDeAnos * 10
}

/** Tempo (milhões de anos) para percorrer `km` com velocidade `cmAno`. */
export function tempoMa(km: number, cmAno: number): number {
  return km / (cmAno * 10)
}

/** Velocidade (cm/ano) de quem percorre `km` em `milhoesDeAnos`. */
export function velocidadeCmAno(km: number, milhoesDeAnos: number): number {
  return km / (milhoesDeAnos * 10)
}

/**
 * Espalhamento do assoalho: cada lado da dorsal se afasta com a "meia-taxa".
 * A taxa total (as duas placas se afastando uma da outra) é o dobro.
 */
export function taxaTotal(meiaTaxa: number): number {
  return 2 * meiaTaxa
}

/** Idade (Ma) da crosta oceânica a `km` da dorsal, com meia-taxa em cm/ano. */
export function idadeDaCrosta(kmDaDorsal: number, meiaTaxa: number): number {
  return tempoMa(Math.abs(kmDaDorsal), meiaTaxa)
}

/** Largura (km) do oceano aberto em `ma` milhões de anos, com meia-taxa em cm/ano (as duas margens se afastam). */
export function larguraDoOceano(ma: number, meiaTaxa: number): number {
  return deslocamentoKm(taxaTotal(meiaTaxa), ma)
}

/* ------------------------------------------------------------------ geometria do corte (em cenas.ts) */

export { ALTURA, LARGURA, NIVEL_MAR, type Camara, type Cena, type CorForma, type Forma, type Linha, type Ponto, type Rotulo, type Seta, type Vulcao } from './cenas'

/** Cena do diagrama para um tipo de limite, com progresso `p` de 0 (início) a 1 (bem avançado). */
export function montarCena(limite: IdLimite, p: number, ordem: [Crosta, Crosta] = ['oceanica', 'continental']): Cena {
  return cenaDoLimite(limite, p, limite === 'subducao-continental' && ordem[0] !== 'oceanica')
}

/** Texto para leitores de tela. */
export function descreverCena(limite: IdLimite, p: number): string {
  const l = LIMITES[limite]
  const fase = p < 0.2 ? 'no começo' : p < 0.7 ? 'com o processo em andamento' : 'bem avançado'
  return `Diagrama de ${l.nome.toLowerCase()}, ${fase}: ${l.feicoes.join('; ')}.`
}

