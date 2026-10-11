import { lerJson, gravarJson } from '@/lib/storage'
import { dataIso } from './caderno'

export interface RegistroDesafio {
  tentativas: number
  acertos: number
  ultimo: boolean
  data: string
}
export type Progresso = Record<string, RegistroDesafio>

export function aplicar(p: Progresso, id: string, correto: boolean, quando: Date): Progresso {
  const atual = p[id]
  return {
    ...p,
    [id]: {
      tentativas: (atual?.tentativas ?? 0) + 1,
      acertos: (atual?.acertos ?? 0) + (correto ? 1 : 0),
      ultimo: correto,
      data: dataIso(quando),
    },
  }
}

export function lerProgresso(): Progresso {
  return lerJson<Progresso>('progresso', {})
}

export function registrarTentativa(id: string, correto: boolean, quando = new Date()): Progresso {
  const novo = aplicar(lerProgresso(), id, correto, quando)
  gravarJson('progresso', novo)
  window.dispatchEvent(new Event('lv:progresso'))
  return novo
}

export function maisErrados(p: Progresso): { id: string; erros: number }[] {
  return Object.entries(p)
    .map(([id, r]) => ({ id, erros: r.tentativas - r.acertos }))
    .filter((e) => e.erros > 0)
    .sort((a, b) => b.erros - a.erros || a.id.localeCompare(b.id))
}

export function resumoPorTema(p: Progresso, materia: string, tema: string) {
  const prefixo = `${materia}/${tema}/`
  let tentativas = 0
  let acertos = 0
  for (const [id, r] of Object.entries(p)) {
    if (id.startsWith(prefixo)) {
      tentativas += r.tentativas
      acertos += r.acertos
    }
  }
  return { tentativas, acertos }
}

/** Quantos desafios (por nível) já foram acertados ao menos uma vez neste tema. */
export function desafiosResolvidos(p: Progresso, materia: string, tema: string): number {
  const prefixo = `${materia}/${tema}/`
  return Object.entries(p).filter(([id, r]) => id.startsWith(prefixo) && r.acertos > 0).length
}
