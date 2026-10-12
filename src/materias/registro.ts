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
  'matematica/trigonometria': () => import('./matematica/trigonometria'),
  'matematica/geometria-analitica': () => import('./matematica/geometria-analitica'),
  'matematica/geometria': () => import('./matematica/geometria'),
  'fisica/cinematica': () => import('./fisica/cinematica'),
  'fisica/dinamica': () => import('./fisica/dinamica'),
  'fisica/termologia': () => import('./fisica/termologia'),
  'fisica/eletricidade': () => import('./fisica/eletricidade'),
  'quimica/estequiometria': () => import('./quimica/estequiometria'),
  'quimica/solucoes': () => import('./quimica/solucoes'),
  'quimica/organica': () => import('./quimica/organica'),
  'quimica/equilibrio-ph': () => import('./quimica/equilibrio-ph'),
  'quimica/cinetica': () => import('./quimica/cinetica'),
}

export function temaDisponivel(materia: string, tema: string) {
  return `${materia}/${tema}` in MODULOS
}

export function carregarTema(materia: string, tema: string) {
  const c = MODULOS[`${materia}/${tema}`]
  return c ? c() : Promise.reject(new Error('tema indisponível'))
}
