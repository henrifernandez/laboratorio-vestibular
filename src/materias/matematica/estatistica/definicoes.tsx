import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import {
  gerarExtremo,
  gerarHistograma,
  gerarMedida,
  gerarRepresentativa,
  type DadosCenario,
  type DadosExtremo,
  type DadosHistograma,
  type DadosMedida,
} from './geradores'
import { VisualCenario, VisualExtremo, VisualHistograma, VisualMedida } from './Visuais'

const base = { materia: 'matematica' as const, tema: 'estatistica' }

export const DEFINICOES_ESTAT: DefinicaoQualquer[] = [
  criarDefMulti<DadosExtremo>({
    ...base,
    id: 'matematica/estatistica/extremo',
    titulo: 'Efeito do valor extremo',
    instrucao: 'Preveja o que acontece com a média e com a mediana antes de calcular.',
    gerar: gerarExtremo,
    Visual: VisualExtremo,
  }),
  criarDefNum<DadosMedida>({
    ...base,
    id: 'matematica/estatistica/medida',
    titulo: 'Calcule a medida',
    instrucao: 'Calcule a média ou a mediana pedida. Cuidado com a ordem e com as frequências.',
    gerar: gerarMedida,
    Visual: VisualMedida,
  }),
  criarDefNum<DadosHistograma>({
    ...base,
    id: 'matematica/estatistica/histograma',
    titulo: 'Leia o histograma',
    instrucao: 'Leia as barras e responda: contagem, porcentagem ou média estimada.',
    gerar: gerarHistograma,
    Visual: VisualHistograma,
  }),
  criarDefMulti<DadosCenario>({
    ...base,
    id: 'matematica/estatistica/representativa',
    titulo: 'Média, mediana ou moda?',
    instrucao: 'Escolha a medida que melhor responde à situação.',
    gerar: gerarRepresentativa,
    Visual: VisualCenario,
  }),
]
