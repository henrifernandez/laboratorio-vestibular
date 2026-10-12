/** Tipos de conteúdo compartilhados por todos os temas. */

export interface PareEPense {
  pergunta: string
  opcoes: string[]
  /** índice da opção certa */
  certa: number
  explicacao: string
}

export interface SecaoResumo {
  titulo: string
  /** LaTeX das fórmulas essenciais */
  formulas: { rotulo: string; tex: string }[]
  ideias: string[]
  pegadinhas: string[]
  /** obras de referência, mostradas discretamente no fim do card (obrigatório em humanas) */
  fontes?: string[]
}

/** Fontes de dados ou de informações históricas (obrigatório em humanas). */
export interface Fonte {
  titulo: string
  url?: string
}
