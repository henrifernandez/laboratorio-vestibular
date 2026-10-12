import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarDiagrama, gerarFatores, gerarMeiaVida, gerarOrdem, type DadosDiagrama, type DadosFatores, type DadosMeiaVida, type DadosOrdem } from './geradores'
import { VisualDiagrama, VisualFatores, VisualMeiaVida, VisualOrdem } from './Visuais'

const base = { materia: 'quimica' as const, tema: 'cinetica' }

export const DEFINICOES_CINETICA: DefinicaoQualquer[] = [
  criarDefNum<DadosOrdem>({
    ...base,
    id: 'quimica/cinetica/ordem',
    titulo: 'Lei de velocidade e ordem',
    instrucao: 'Compare experimentos em que só um reagente muda: razão das velocidades = (razão das concentrações)^ordem.',
    gerar: gerarOrdem,
    Visual: VisualOrdem,
  }),
  criarDefNum<DadosDiagrama>({
    ...base,
    id: 'quimica/cinetica/diagrama',
    titulo: 'Diagrama de energia',
    instrucao: 'Leia os níveis de energia: Ea parte dos reagentes (ou dos produtos) até o topo; ΔH compara produtos e reagentes.',
    gerar: gerarDiagrama,
    Visual: VisualDiagrama,
  }),
  criarDefNum<DadosMeiaVida>({
    ...base,
    id: 'quimica/cinetica/meia-vida',
    titulo: 'Meia-vida',
    instrucao: 'Conte quantas meias-vidas se passaram: cada uma divide a quantidade por 2.',
    gerar: gerarMeiaVida,
    Visual: VisualMeiaVida,
  }),
  criarDefMulti<DadosFatores>({
    ...base,
    id: 'quimica/cinetica/fatores',
    titulo: 'Fatores que alteram a velocidade',
    instrucao: 'Pense em colisões: quantas por segundo, que fração é efetiva, e o que de fato muda a energia de ativação.',
    gerar: gerarFatores,
    Visual: VisualFatores,
  }),
]
