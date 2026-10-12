/**
 * Tipos de conteúdo das matérias de humanas que apresentam autores (Filosofia e Sociologia).
 *
 * Regras editoriais (valem para todos os autores):
 *  - as ideias são explicadas com palavras próprias; nenhuma citação é reproduzida entre aspas;
 *  - toda afirmação atribuída a um autor é uma paráfrase de ideias amplamente aceitas nos manuais e nas obras indicadas em `fontes`;
 *  - o que for incerto fica de fora.
 */

export interface Conceito {
  /** o termo, único em todo o tema (para a pergunta “qual autor desenvolveu este conceito?” ter uma só resposta) */
  termo: string
  /** o sentido, em palavras próprias */
  sentido: string
}

export interface Afirmacao {
  /** paráfrase de uma ideia do autor (nunca uma citação literal) */
  texto: string
  /** outros autores do tema que também sustentariam esta ideia: não entram como alternativas erradas */
  tambem?: string[]
}

export interface Obra {
  titulo: string
  /** ano da primeira publicação; só quando for certo */
  ano?: string
}

export interface Autor {
  id: string
  nome: string
  /** "384–322 a.C.", "c. 470–399 a.C." */
  periodo: string
  /** ano de referência para ordenar no tempo (nascimento; negativo para a.C.) */
  nascimento: number
  morte: number
  /** onde viveu e atuou */
  lugar: string
  /** corrente ou escola */
  tradicao: string
  /** em uma frase */
  resumo: string
  /** a ideia central, em palavras próprias */
  ideia: string
  /** o contexto histórico em que escreveu */
  contexto: string
  conceitos: Conceito[]
  afirmacoes: Afirmacao[]
  obras: Obra[]
  /** erros comuns de leitura */
  cuidados: string[]
  fontes: string[]
}

export const NOTA_AUTORES =
  'As ideias estão resumidas em palavras próprias, a partir de manuais e das obras indicadas. Nenhuma frase entre aspas é citação literal. Para citar um autor, consulte a obra.'

/** Etapas curtas de “Entenda” (um passo por conceito ou por autor). */
export interface PassoHumanas {
  titulo: string
  texto: string[]
  pare?: { pergunta: string; opcoes: string[]; certa: number; explicacao: string }
  /** autores mostrados em cartão neste passo */
  autores?: string[]
}

export const autorPorId = (autores: Autor[], id: string) => autores.find((a) => a.id === id)
