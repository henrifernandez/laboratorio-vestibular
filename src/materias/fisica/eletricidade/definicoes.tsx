import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarBrilho, gerarConta, gerarCorrente, gerarEquivalente, type DadosBrilho, type DadosCircuito, type DadosConta, type DadosCorrente } from './geradores'
import { VisualBrilho, VisualCircuito, VisualConta } from './Visuais'

const base = { materia: 'fisica' as const, tema: 'eletricidade' }

export const DEFINICOES_ELETRICIDADE: DefinicaoQualquer[] = [
  criarDefMulti<DadosBrilho>({
    ...base,
    id: 'fisica/eletricidade/brilho',
    titulo: 'Qual lâmpada brilha mais?',
    instrucao: 'Compare a potência de cada lâmpada: série e paralelo se comportam de modos opostos.',
    gerar: gerarBrilho,
    Visual: VisualBrilho,
  }),
  criarDefNum<DadosCircuito>({
    ...base,
    id: 'fisica/eletricidade/equivalente',
    titulo: 'Resistência equivalente',
    instrucao: 'Reconheça o que está em série e o que está em paralelo e resolva de dentro para fora.',
    gerar: gerarEquivalente,
    Visual: VisualCircuito,
  }),
  criarDefNum<DadosCorrente>({
    ...base,
    id: 'fisica/eletricidade/corrente',
    titulo: 'Corrente e tensão',
    instrucao: 'Use a lei de Ohm: a corrente é a mesma em série; a tensão é a mesma em paralelo.',
    gerar: gerarCorrente,
    Visual: VisualCircuito,
  }),
  criarDefNum<DadosConta>({
    ...base,
    id: 'fisica/eletricidade/conta',
    titulo: 'Consumo e conta de luz',
    instrucao: 'Converta watts em quilowatts, multiplique pelas horas e pela tarifa.',
    gerar: gerarConta,
    Visual: VisualConta,
  }),
]
