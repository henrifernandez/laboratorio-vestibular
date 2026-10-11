import { acharMateria, type Materia } from '@/conteudo/materias'
import type { Nivel } from './tipos'

export function dataIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const limpa = (s: string) => s.replace(/\|/g, '/').replace(/\s+/g, ' ').trim()

export interface DadosCaderno {
  data: Date
  materia: Materia
  tema: string
  titulo: string
  nivel: Nivel
  motivo: string
  licao: string
}

/** Linha de tabela pronta para colar no caderno-de-erros.md */
export function linhaCaderno(d: DadosCaderno): string {
  const nome = acharMateria(d.materia)?.nome ?? d.materia
  const cols = [
    dataIso(d.data),
    `${nome} / ${limpa(d.tema)}`,
    `${limpa(d.titulo)} (nível ${d.nivel})`,
    limpa(d.motivo),
    limpa(d.licao),
    '[ ]',
  ]
  return `| ${cols.join(' | ')} |`
}
