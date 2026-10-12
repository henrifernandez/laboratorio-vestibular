import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarEquilibrio, gerarFraco, gerarKc, gerarPh, type DadosEq, type DadosFraco, type DadosKc, type DadosPh } from './geradores'
import { VisualEq, VisualFraco, VisualKc, VisualPh } from './Visuais'

const base = { materia: 'quimica' as const, tema: 'equilibrio-ph' }

export const DEFINICOES_EQUILIBRIO: DefinicaoQualquer[] = [
  criarDefNum<DadosPh>({
    ...base,
    id: 'quimica/equilibrio-ph/ph',
    titulo: 'Qual é o pH?',
    instrucao: 'Ache [H⁺] (ou [OH⁻]) e aplique pH = −log [H⁺]; em misturas, compare os mols de H⁺ e de OH⁻.',
    gerar: gerarPh,
    Visual: VisualPh,
  }),
  criarDefMulti<DadosEq>({
    ...base,
    id: 'quimica/equilibrio-ph/le-chatelier',
    titulo: 'Para onde desloca o equilíbrio?',
    instrucao: 'Pergunte o que o sistema precisa fazer para minimizar a perturbação.',
    gerar: gerarEquilibrio,
    Visual: VisualEq,
  }),
  criarDefNum<DadosKc>({
    ...base,
    id: 'quimica/equilibrio-ph/kc',
    titulo: 'Constante de equilíbrio',
    instrucao: 'Escreva Kc com produtos em cima e reagentes embaixo, cada concentração elevada ao coeficiente.',
    gerar: gerarKc,
    Visual: VisualKc,
  }),
  criarDefNum<DadosFraco>({
    ...base,
    id: 'quimica/equilibrio-ph/acido-fraco',
    titulo: 'Ácido fraco: Ka, pH e ionização',
    instrucao: 'Use [H⁺] = √(Ka · C) e lembre que um ácido fraco ioniza só em parte.',
    gerar: gerarFraco,
    Visual: VisualFraco,
  }),
]
