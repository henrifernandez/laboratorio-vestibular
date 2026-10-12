import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarAtomos, gerarEmissao, gerarPoluentes, gerarPrincipios, type DadosAtomos, type DadosEmissao, type DadosPoluentes, type DadosPrincipio } from './geradores'
import { VisualAtomos, VisualEmissao } from './Visuais'

const base = { materia: 'quimica' as const, tema: 'quimica-verde' }

export const DEFINICOES_VERDE: DefinicaoQualquer[] = [
  criarDefNum<DadosEmissao>({
    ...base,
    id: 'quimica/quimica-verde/emissao',
    titulo: 'Quanto poluente sai da queima?',
    instrucao: 'Use a estequiometria: massa → mol → proporção da equação → massa do gás emitido.',
    gerar: gerarEmissao,
    Visual: VisualEmissao,
  }),
  criarDefMulti<DadosPoluentes>({
    ...base,
    id: 'quimica/quimica-verde/poluentes',
    titulo: 'Poluentes e processos',
    instrucao: 'Associe cada problema ambiental ao seu agente e ao seu mecanismo.',
    gerar: gerarPoluentes,
  }),
  criarDefNum<DadosAtomos>({
    ...base,
    id: 'quimica/quimica-verde/atomos',
    titulo: 'Economia de átomos e fator E',
    instrucao: 'Compare a massa do produto desejado com a massa de todos os reagentes (com os coeficientes).',
    gerar: gerarAtomos,
    Visual: VisualAtomos,
  }),
  criarDefMulti<DadosPrincipio>({
    ...base,
    id: 'quimica/quimica-verde/principios',
    titulo: 'Princípios da Química Verde',
    instrucao: 'Descubra o que mudou no processo: resíduos, átomos, solvente, energia, matéria-prima, catalisador ou risco.',
    gerar: gerarPrincipios,
  }),
]
