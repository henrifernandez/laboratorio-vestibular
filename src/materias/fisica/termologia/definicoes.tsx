import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarCalor, gerarCurva, gerarEquilibrio, gerarGas, type DadosCalor, type DadosCurva, type DadosEquilibrio, type DadosGas } from './geradores'
import { OpcaoCurva, VisualCalor, VisualCurva, VisualEquilibrio, VisualGas } from './Visuais'

const base = { materia: 'fisica' as const, tema: 'termologia' }

export const DEFINICOES_TERMOLOGIA: DefinicaoQualquer[] = [
  criarDefNum<DadosCalor>({
    ...base,
    id: 'fisica/termologia/calor',
    titulo: 'Quanto calor?',
    instrucao: 'Separe o processo em etapas (aquecer ou mudar de fase) e some o calor de cada uma.',
    gerar: gerarCalor,
    Visual: VisualCalor,
  }),
  criarDefNum<DadosEquilibrio>({
    ...base,
    id: 'fisica/termologia/equilibrio',
    titulo: 'Temperatura de equilíbrio',
    instrucao: 'O que um corpo perde, o outro ganha: monte o balanço de calor e resolva.',
    gerar: gerarEquilibrio,
    Visual: VisualEquilibrio,
  }),
  criarDefMulti<DadosCurva>({
    ...base,
    id: 'fisica/termologia/curva',
    titulo: 'Qual é a curva de aquecimento?',
    instrucao: 'Escolha o gráfico de temperatura que combina com o aquecimento descrito.',
    gerar: gerarCurva,
    Visual: VisualCurva,
    Opcao: OpcaoCurva,
  }),
  criarDefNum<DadosGas>({
    ...base,
    id: 'fisica/termologia/gas',
    titulo: 'Gás no pistão',
    instrucao: 'Escolha a lei dos gases certa e lembre-se: temperatura sempre em kelvin.',
    gerar: gerarGas,
    Visual: VisualGas,
  }),
]
