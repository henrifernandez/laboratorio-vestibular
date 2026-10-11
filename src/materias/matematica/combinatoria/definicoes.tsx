import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarClassificar, gerarContar, gerarFrequencia, gerarProbabilidade, type DadosClassificar, type DadosFreq, type DadosProb } from './geradores'

const base = { materia: 'matematica' as const, tema: 'combinatoria' }

export const DEFINICOES_COMB: DefinicaoQualquer[] = [
  criarDefMulti<DadosClassificar>({
    ...base,
    id: 'matematica/combinatoria/classificar',
    titulo: 'Classifique o problema',
    instrucao: 'Sem calcular: é arranjo, combinação, permutação ou princípio multiplicativo?',
    gerar: gerarClassificar,
  }),
  criarDefNum<DadosClassificar>({
    ...base,
    id: 'matematica/combinatoria/contar',
    titulo: 'Conte as possibilidades',
    instrucao: 'Classifique e calcule quantas possibilidades existem.',
    gerar: gerarContar,
  }),
  criarDefNum<DadosProb>({
    ...base,
    id: 'matematica/combinatoria/probabilidade',
    titulo: 'Calcule a probabilidade',
    instrucao: 'Conte casos favoráveis e possíveis. Pode responder em fração (1/6) ou decimal.',
    gerar: gerarProbabilidade,
  }),
  criarDefMulti<DadosFreq>({
    ...base,
    id: 'matematica/combinatoria/frequencia',
    titulo: 'Frequência e probabilidade',
    instrucao: 'Julgue o que se espera ao repetir um experimento muitas vezes.',
    gerar: gerarFrequencia,
  }),
]
