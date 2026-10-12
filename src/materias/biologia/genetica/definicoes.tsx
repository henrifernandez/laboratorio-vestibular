import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarCruzamentos, gerarHardy, gerarLigacao, gerarSangue, type DadosCruzamento, type DadosHardy, type DadosLigacao, type DadosSangue } from './geradores'
import { gerarHeredograma, gerarProbabilidade, type DadosHeredograma, type DadosProbabilidade } from './geradoresHeredograma'
import { VisualHeredograma, VisualLigacao, VisualProbabilidade } from './Visuais'

const base = { materia: 'biologia' as const, tema: 'genetica' }

export const DEFINICOES_GENETICA: DefinicaoQualquer[] = [
  criarDefNum<DadosCruzamento>({
    ...base,
    id: 'biologia/genetica/cruzamentos',
    titulo: 'Cruzamentos e probabilidades',
    instrucao: 'Monte os gametas, combine-os (quadro de Punnett) e some só as casas que o enunciado pede. Responda em porcentagem.',
    gerar: gerarCruzamentos,
  }),
  criarDefMulti<DadosSangue>({
    ...base,
    id: 'biologia/genetica/sanguineo',
    titulo: 'Grupos sanguíneos ABO e Rh',
    instrucao: 'Lembre os genótipos de cada grupo e quais antígenos e anticorpos cada um tem.',
    gerar: gerarSangue,
  }),
  criarDefMulti<DadosHeredograma>({
    ...base,
    id: 'biologia/genetica/heredograma',
    titulo: 'Ler um heredograma',
    instrucao: 'Procure os casais que decidem: pais normais com filho afetado, pais afetados com filho normal, pai e filhas, mãe e filhos.',
    gerar: gerarHeredograma,
    Visual: VisualHeredograma,
  }),
  criarDefNum<DadosProbabilidade>({
    ...base,
    id: 'biologia/genetica/probabilidade',
    titulo: 'Probabilidades em heredogramas',
    instrucao: 'Descubra os genótipos que não deixam dúvida, depois multiplique as probabilidades de cada etapa. Responda em porcentagem.',
    gerar: gerarProbabilidade,
    Visual: VisualProbabilidade,
  }),
  criarDefNum<DadosLigacao>({
    ...base,
    id: 'biologia/genetica/ligacao',
    titulo: 'Herança ligada ao X e genes ligados',
    instrucao: 'Escreva os genótipos com o X (ou os gametas parentais e recombinantes) e conte só o grupo pedido.',
    gerar: gerarLigacao,
    Visual: VisualLigacao,
  }),
  criarDefNum<DadosHardy>({
    ...base,
    id: 'biologia/genetica/populacoes',
    titulo: 'Equilíbrio de Hardy-Weinberg',
    instrucao: 'Parta do que é conhecido (q², q ou p) e use p + q = 1 e p² + 2pq + q² = 1.',
    gerar: gerarHardy,
  }),
]
