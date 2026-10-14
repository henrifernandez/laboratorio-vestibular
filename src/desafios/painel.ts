import type { MateriaInfo, TemaInfo } from '@/conteudo/materias'
import { desafiosResolvidos, resumoPorTema, type Progresso } from './progresso'

export interface ResumoTema {
  tema: TemaInfo
  /** desafios (por nível) acertados ao menos uma vez, no máximo `total` */
  feitos: number
  total: number
  tentativas: number
  acertos: number
}

export interface ResumoMateria {
  materia: MateriaInfo
  temas: ResumoTema[]
  feitos: number
  total: number
  tentativas: number
  acertos: number
}

export interface ResumoPainel {
  materias: ResumoMateria[]
  feitos: number
  total: number
  tentativas: number
  acertos: number
  /** em %, arredondada; `null` sem tentativas */
  taxa: number | null
}

export const taxaDeAcerto = (acertos: number, tentativas: number): number | null => (tentativas > 0 ? Math.round((acertos / tentativas) * 100) : null)

/** Visão geral e por matéria/tema, só com os temas já publicados (os "em breve" não contam). */
export function resumirPainel(p: Progresso, materias: MateriaInfo[]): ResumoPainel {
  const lista: ResumoMateria[] = materias
    .map((materia) => {
      const temas: ResumoTema[] = materia.temas
        .filter((t) => t.disponivel)
        .map((tema) => {
          const total = tema.totalNiveis ?? 0
          const { tentativas, acertos } = resumoPorTema(p, materia.id, tema.id)
          return { tema, total, feitos: Math.min(desafiosResolvidos(p, materia.id, tema.id), total), tentativas, acertos }
        })
      const soma = (f: (t: ResumoTema) => number) => temas.reduce((s, t) => s + f(t), 0)
      return { materia, temas, feitos: soma((t) => t.feitos), total: soma((t) => t.total), tentativas: soma((t) => t.tentativas), acertos: soma((t) => t.acertos) }
    })
    .filter((m) => m.temas.length > 0)
  const soma = (f: (m: ResumoMateria) => number) => lista.reduce((s, m) => s + f(m), 0)
  const tentativas = soma((m) => m.tentativas)
  const acertos = soma((m) => m.acertos)
  return { materias: lista, feitos: soma((m) => m.feitos), total: soma((m) => m.total), tentativas, acertos, taxa: taxaDeAcerto(acertos, tentativas) }
}

/** O desafio (chave "id:nível") já foi errado alguma vez? */
export const jaErrou = (p: Progresso, chave: string): boolean => {
  const r = p[chave]
  return !!r && r.tentativas > r.acertos
}
