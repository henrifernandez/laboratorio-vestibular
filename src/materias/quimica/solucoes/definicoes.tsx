import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarConcentracao, gerarCristal, gerarDiluicao, gerarSolubilidade, type DadosConc, type DadosCristal, type DadosDiluicao, type DadosSolubilidade } from './geradores'
import { VisualConc, VisualCristal, VisualDiluicao, VisualSolubilidade } from './Visuais'

const base = { materia: 'quimica' as const, tema: 'solucoes' }

export const DEFINICOES_SOLUCOES: DefinicaoQualquer[] = [
  criarDefNum<DadosConc>({
    ...base,
    id: 'quimica/solucoes/concentracao',
    titulo: 'Calcule a concentração',
    instrucao: 'Converta as unidades (mL → L, massa → mol) e divida pelo volume da solução.',
    gerar: gerarConcentracao,
    Visual: VisualConc,
  }),
  criarDefNum<DadosDiluicao>({
    ...base,
    id: 'quimica/solucoes/diluicao',
    titulo: 'Diluição e mistura',
    instrucao: 'A quantidade de soluto (mols) se conserva: some os mols e divida pelo volume final.',
    gerar: gerarDiluicao,
    Visual: VisualDiluicao,
  }),
  criarDefMulti<DadosSolubilidade>({
    ...base,
    id: 'quimica/solucoes/classificar',
    titulo: 'Saturada, insaturada ou supersaturada?',
    instrucao: 'Leia a solubilidade na curva e compare com a massa de sal que há na água.',
    gerar: gerarSolubilidade,
    Visual: VisualSolubilidade,
  }),
  criarDefNum<DadosCristal>({
    ...base,
    id: 'quimica/solucoes/cristais',
    titulo: 'Quanto cristaliza?',
    instrucao: 'Calcule quanto sal a água comporta antes e depois e subtraia.',
    gerar: gerarCristal,
    Visual: VisualCristal,
  }),
]
