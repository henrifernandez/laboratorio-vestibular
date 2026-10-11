import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarConversao, gerarLocalizar, gerarSinais, gerarValor, type DadosAngulo, type DadosConversao, type DadosValor } from './geradores'
import { VisualAngulo } from './Visuais'

const base = { materia: 'matematica' as const, tema: 'trigonometria' }

export const DEFINICOES_TRIG: DefinicaoQualquer[] = [
  criarDefMulti<DadosAngulo>({
    ...base,
    id: 'matematica/trigonometria/localizar',
    titulo: 'Localize o ângulo',
    instrucao: 'Descubra em que região do círculo trigonométrico termina o arco.',
    gerar: gerarLocalizar,
    Visual: VisualAngulo,
  }),
  criarDefMulti<DadosAngulo>({
    ...base,
    id: 'matematica/trigonometria/sinais',
    titulo: 'Sinais de seno, cosseno e tangente',
    instrucao: 'Ache o quadrante e diga os sinais das três funções.',
    gerar: gerarSinais,
    Visual: VisualAngulo,
  }),
  criarDefMulti<DadosValor>({
    ...base,
    id: 'matematica/trigonometria/valor',
    titulo: 'Valor exato',
    instrucao: 'Use o ângulo de referência e o sinal do quadrante para achar o valor.',
    gerar: gerarValor,
  }),
  criarDefNum<DadosConversao>({
    ...base,
    id: 'matematica/trigonometria/conversao',
    titulo: 'Graus, radianos e arcos',
    instrucao: 'Converta entre graus e radianos (e use s = r·θ).',
    gerar: gerarConversao,
  }),
]
