import type { ComponentType } from 'react'
import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'

/** Tudo o que um tema entrega para as quatro abas. */
export interface ModuloTema {
  Entenda: ComponentType
  Laboratorio: ComponentType
  Resumo: ComponentType
  desafios: DefinicaoQualquer[]
}

type Carregador = () => Promise<{ default: ModuloTema }>

/** Um tema por entrada, carregado só quando a pessoa abre a página (code splitting por rota). */
export const MODULOS: Record<string, Carregador> = {
  'matematica/funcoes': () => import('./matematica/funcoes'),
  'matematica/porcentagem-juros': () => import('./matematica/juros'),
  'matematica/pa-pg': () => import('./matematica/pa-pg'),
  'matematica/estatistica': () => import('./matematica/estatistica'),
  'matematica/combinatoria': () => import('./matematica/combinatoria'),
}

export function temaDisponivel(materia: string, tema: string) {
  return `${materia}/${tema}` in MODULOS
}

export function carregarTema(materia: string, tema: string) {
  const c = MODULOS[`${materia}/${tema}`]
  return c ? c() : Promise.reject(new Error('tema indisponível'))
}
