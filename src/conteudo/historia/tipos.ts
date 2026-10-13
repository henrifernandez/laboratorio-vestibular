/** Tipos dos dados de História (linha do tempo). Conteúdo separado do código, para ser revisado e corrigido. */

export type Regiao = 'brasil' | 'mundo'
export type TipoEvento = 'politico' | 'economico' | 'social' | 'cultural' | 'guerra'

export interface Acontecimento {
  id: string
  titulo: string
  /** ano de início */
  inicio: number
  /** ano de fim, quando o acontecimento dura anos */
  fim?: number
  /** datas aproximadas ("c."): o acontecimento é um processo longo, sem data exata de início ou fim */
  aprox?: boolean
  regiao: Regiao
  tipo: TipoEvento
  /** 1 = aparece já no zoom mais aberto; 3 = só aparece quando há espaço */
  peso: 1 | 2 | 3
  resumo: string
  causas: string[]
  consequencias: string[]
  /** ligação com o Brasil (para acontecimentos do mundo) ou com o mundo (para os do Brasil) */
  ligacao: string
  /** ids de acontecimentos relacionados */
  conexoes: string[]
  /** obras de referência e fontes primárias; discretas no card */
  fontes: string[]
}

export interface Era {
  id: string
  nome: string
  /** nome curto, para faixas estreitas */
  curto: string
  regiao: Regiao
  inicio: number
  fim: number
  /** cor de destaque (hex); o fundo é uma mistura leve com a cor da página */
  cor: string
  resumo: string
}

/** Relação de causa e consequência entre dois acontecimentos. */
export interface Relacao {
  de: string
  para: string
  texto: string
}

export interface Personagem {
  id: string
  nome: string
  /** o que fez ou decidiu */
  feito: string
  /** acontecimento em que atuou */
  evento: string
}

export const NOME_TIPO: Record<TipoEvento, string> = {
  politico: 'Político',
  economico: 'Econômico',
  social: 'Social',
  cultural: 'Cultural',
  guerra: 'Guerra e conflito',
}

export const NOME_REGIAO: Record<Regiao, string> = { brasil: 'Brasil', mundo: 'Mundo' }

/**
 * Ficha rápida de um acontecimento: só o essencial para lembrar na prova.
 * Os marcos começam pelo ano ("1789: ...", "c. 3100 a.C.: ...") ou pelo século ("século XIV: ...").
 */
export interface Ficha {
  /** o fato que disparou o acontecimento; ausente nos processos longos, que não têm um gatilho único */
  gatilho?: string
  /** marcos com data, em ordem */
  marcos: string[]
  /** pessoas e grupos centrais, com o papel de cada um */
  pessoas: string[]
}

/**
 * Ano por escrito: negativos são antes de Cristo ("3500 a.C."). Não existe ano zero; se um arredondamento
 * cair nele, mostra o ano 1 d.C., o mais próximo.
 */
export const formatarAno = (a: number): string => (a < 0 ? `${-a} a.C.` : a === 0 ? '1 d.C.' : String(a))

/** "1789–1799", "c. 1760–1850", "1822", "c. 3100–30 a.C." ou "27 a.C.–476 d.C.". */
export function rotuloAno(e: Pick<Acontecimento, 'inicio' | 'fim' | 'aprox'>): string {
  const c = e.aprox ? 'c. ' : ''
  if (e.fim === undefined || e.fim === e.inicio) return `${c}${formatarAno(e.inicio)}`
  if (e.fim < 0) return `${c}${-e.inicio}–${-e.fim} a.C.`
  if (e.inicio < 0) return `${c}${-e.inicio} a.C.–${e.fim} d.C.`
  return `${c}${e.inicio}–${e.fim}`
}
