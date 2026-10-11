import type { DefinicaoDesafio, DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { alvo, type InstanciaAlvo, type Movimento } from './alvo'
import { detetive, type InstanciaDetetive, type RespostaDetetive } from './detetive'
import { encaixe, type InstanciaEncaixe, type RespostaEncaixe } from './encaixe'
import { esboce, type InstanciaEsboce, type Ponto } from './esboce'
import { formula, type InstanciaFormula } from './formula'
import { EntradaAlvo } from './UIAlvo'
import { EntradaDetetive } from './UIDetetive'
import { EntradaEncaixe } from './UIEncaixe'
import { EntradaEsboce } from './UIEsboce'
import { EntradaFormula } from './UIFormula'

const defEsboce: DefinicaoDesafio<InstanciaEsboce, Ponto[]> = {
  desafio: esboce,
  instrucao: 'Arraste os pontos de controle até o gráfico ficar igual ao da fórmula.',
  respostaInicial: (i) => i.inicial,
  podeEnviar: () => true,
  Entrada: EntradaEsboce,
}

const defFormula: DefinicaoDesafio<InstanciaFormula, string> = {
  desafio: formula,
  instrucao: 'Veja o gráfico com os pontos marcados e digite a lei da função.',
  respostaInicial: () => '',
  podeEnviar: (r) => r.trim().length > 0,
  Entrada: EntradaFormula,
}

const defDetetive: DefinicaoDesafio<InstanciaDetetive, RespostaDetetive> = {
  desafio: detetive,
  instrucao: 'Só olhando o gráfico, identifique o tipo da função e os sinais dos coeficientes.',
  respostaInicial: () => ({}),
  podeEnviar: (r, i) => i.perguntas.every((p) => r[p.id] !== undefined),
  Entrada: EntradaDetetive,
}

const defEncaixe: DefinicaoDesafio<InstanciaEncaixe, RespostaEncaixe> = {
  desafio: encaixe,
  instrucao: 'Ligue cada fórmula ao gráfico e à tabela que representam a mesma função.',
  respostaInicial: () => ({ graficos: [-1, -1, -1, -1], tabelas: [-1, -1, -1, -1] }),
  podeEnviar: (r) => r.graficos.every((v) => v >= 0) && r.tabelas.every((v) => v >= 0),
  Entrada: EntradaEncaixe,
}

const defAlvo: DefinicaoDesafio<InstanciaAlvo, Movimento[]> = {
  desafio: alvo,
  instrucao: 'Aplique deslocamentos, reflexões e esticamentos até a curva bater com o alvo, no menor número de movimentos.',
  respostaInicial: () => [],
  podeEnviar: (r) => r.length > 0,
  Entrada: EntradaAlvo,
}

export const DEFINICOES: DefinicaoQualquer[] = [defEsboce, defFormula, defDetetive, defEncaixe, defAlvo]
