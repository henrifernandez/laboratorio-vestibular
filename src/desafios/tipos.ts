import type { Materia } from '@/conteudo/materias'

export type Nivel = 1 | 2 | 3

export interface Correcao {
  correto: boolean
  /** 0 a 1, quando houver acerto parcial */
  parcial?: number
  /** por que acertou ou errou, específico para a resposta dada */
  feedback: string
  /** o que mostrar na tela (curva certa sobreposta, item errado marcado) */
  destaque?: unknown
  /** causa curta do erro, para o caderno de erros */
  motivo?: string
  /** regra a lembrar, para o caderno de erros */
  licao?: string
}

export interface Desafio<Instancia, Resposta> {
  id: string
  materia: Materia
  tema: string
  titulo: string
  gerar(semente: number, nivel: Nivel): Instancia
  corrigir(instancia: Instancia, resposta: Resposta): Correcao
  /** do mais vago ao mais específico */
  dicas(instancia: Instancia): string[]
  /** resolução explicada */
  explicar(instancia: Instancia): string
}
