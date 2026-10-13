import { ESTAGIOS, type Caracteristicas, type Estagio, type IdEstagio } from '@/conteudo/geografia/geopolitica'

/** As quatro características, na ordem em que os estágios as acrescentam. */
export const CHAVES: (keyof Caracteristicas)[] = ['tarifaZero', 'tarifaExterna', 'fatores', 'moeda']

export const NOME_CARACTERISTICA: Record<keyof Caracteristicas, string> = {
  tarifaZero: 'Sem tarifas de importação entre os membros',
  tarifaExterna: 'Tarifa externa comum para quem está fora do bloco',
  fatores: 'Livre circulação de pessoas, capitais e serviços',
  moeda: 'Moeda única e políticas econômicas coordenadas',
}

export interface Classificacao {
  /** o estágio mais avançado em que todas as características exigidas estão presentes; nulo se nem o livre-comércio existe */
  estagio: Estagio | null
  /** características marcadas que não contam, porque falta uma exigida antes delas */
  semEfeito: (keyof Caracteristicas)[]
}

/**
 * Cada estágio exige as características dos anteriores. A classificação é o último estágio da cadeia
 * (livre-comércio → tarifa externa → fatores → moeda) cujas exigências foram todas cumpridas.
 */
export function classificarIntegracao(c: Caracteristicas): Classificacao {
  let n = 0
  while (n < CHAVES.length && c[CHAVES[n] as keyof Caracteristicas]) n++
  const semEfeito = CHAVES.slice(n).filter((k) => c[k])
  return { estagio: n === 0 ? null : (ESTAGIOS[n - 1] as Estagio), semEfeito }
}

/** Características que o estágio exige (as dele e as dos anteriores). */
export function exigencias(id: IdEstagio): Caracteristicas {
  const n = (ESTAGIOS.find((e) => e.id === id) as Estagio).numero
  return { tarifaZero: n >= 1, tarifaExterna: n >= 2, fatores: n >= 3, moeda: n >= 4 }
}

/** Frase com as características de um conjunto, para os enunciados. */
export function descreverCaracteristicas(c: Caracteristicas): string {
  const partes = CHAVES.filter((k) => c[k]).map((k) => {
    switch (k) {
      case 'tarifaZero':
        return 'eliminaram as tarifas de importação entre si'
      case 'tarifaExterna':
        return 'adotaram uma mesma tarifa de importação para os países de fora'
      case 'fatores':
        return 'permitem que pessoas, capitais e serviços circulem livremente entre eles'
      case 'moeda':
        return 'adotaram uma moeda única e coordenam suas políticas econômicas'
    }
  })
  return partes.length === 0 ? 'não adotaram nenhuma medida de integração' : partes.length === 1 ? (partes[0] as string) : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
}
