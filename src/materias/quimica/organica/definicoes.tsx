import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarContagem, gerarFuncao, gerarIsomeria, gerarNome, type DadosContagem, type DadosFuncao, type DadosIsomeria, type DadosNome } from './geradores'
import { VisualContagem, VisualFuncao, VisualIsomeria, VisualNome } from './Visuais'

const base = { materia: 'quimica' as const, tema: 'organica' }

export const DEFINICOES_ORGANICA: DefinicaoQualquer[] = [
  criarDefMulti<DadosFuncao>({
    ...base,
    id: 'quimica/organica/funcao',
    titulo: 'Qual é a função orgânica?',
    instrucao: 'Ache os átomos diferentes de C e H e veja a que eles estão ligados.',
    gerar: gerarFuncao,
    Visual: VisualFuncao,
  }),
  criarDefMulti<DadosNome>({
    ...base,
    id: 'quimica/organica/nome',
    titulo: 'Qual é o nome?',
    instrucao: 'Conte os carbonos da cadeia principal, identifique a função e numere pela ponta certa.',
    gerar: gerarNome,
    Visual: VisualNome,
  }),
  criarDefMulti<DadosIsomeria>({
    ...base,
    id: 'quimica/organica/isomeria',
    titulo: 'Que tipo de isomeria?',
    instrucao: 'Compare as fórmulas moleculares, depois as funções e por fim as cadeias.',
    gerar: gerarIsomeria,
    Visual: VisualIsomeria,
  }),
  criarDefNum<DadosContagem>({
    ...base,
    id: 'quimica/organica/contagem',
    titulo: 'Conte átomos e carbonos',
    instrucao: 'Cada carbono faz 4 ligações: complete o que não está desenhado.',
    gerar: gerarContagem,
    Visual: VisualContagem,
  }),
]
