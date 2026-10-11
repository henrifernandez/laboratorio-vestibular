import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarCruz, gerarMontante, gerarRegime, gerarSucessivos, type DadosCruz, type DadosRegime, type DadosSucessivos } from './geradores'
import { VisualCruz, VisualRegime, VisualSucessivos } from './Visuais'

const base = { materia: 'matematica' as const, tema: 'porcentagem-juros' }

export const DEFINICOES_JUROS: DefinicaoQualquer[] = [
  criarDefNum<DadosCruz>({
    ...base,
    id: 'matematica/porcentagem-juros/cruzamento',
    titulo: 'Qual cresce mais e quando',
    instrucao: 'Preveja o mês em que o juro composto ultrapassa o simples. Use o gráfico como pista.',
    gerar: gerarCruz,
    Visual: VisualCruz,
  }),
  criarDefNum<DadosSucessivos>({
    ...base,
    id: 'matematica/porcentagem-juros/sucessivos',
    titulo: 'Aumentos e descontos sucessivos',
    instrucao: 'Siga a cadeia de variações e descubra o resultado. Atenção: elas se multiplicam.',
    gerar: gerarSucessivos,
    Visual: VisualSucessivos,
  }),
  criarDefNum({
    ...base,
    id: 'matematica/porcentagem-juros/montante',
    titulo: 'Montante e juros',
    instrucao: 'Calcule o valor pedido no regime de juros indicado.',
    gerar: gerarMontante,
  }),
  criarDefMulti<DadosRegime>({
    ...base,
    id: 'matematica/porcentagem-juros/regime',
    titulo: 'Qual é o regime?',
    instrucao: 'Observe como o valor cresce mês a mês e identifique o regime de juros.',
    gerar: gerarRegime,
    Visual: VisualRegime,
  }),
]
