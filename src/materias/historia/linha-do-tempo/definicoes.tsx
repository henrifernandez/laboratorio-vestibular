import type { DefinicaoDesafio, DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti } from '@/desafios/simples'
import { desafioCadeia, desafioOrdem, desafioQuem, gerarCausa, gerarIntruso, gerarLado, type DadosCausa, type DadosIntruso, type DadosLado, type InstanciaLigar, type InstanciaOrdem } from './geradores'
import { EntradaLigar, EntradaOrdenar } from './Visuais'

const base = { materia: 'historia' as const, tema: 'linha-do-tempo' }

const defOrdem: DefinicaoDesafio<InstanciaOrdem, string[]> = {
  desafio: desafioOrdem,
  instrucao: 'Arraste os cartões, ou use as setas, até ficarem em ordem cronológica.',
  respostaInicial: (inst) => inst.ids,
  podeEnviar: () => true,
  Entrada: EntradaOrdenar,
}

const ligarTudo = (r: Record<string, string>, inst: InstanciaLigar) => inst.esquerda.every((x) => (r[x.id] ?? '') !== '')

const defCadeia: DefinicaoDesafio<InstanciaLigar, Record<string, string>> = {
  desafio: desafioCadeia,
  instrucao: 'Para cada acontecimento, escolha a consequência a que ele levou.',
  respostaInicial: () => ({}),
  podeEnviar: ligarTudo,
  Entrada: EntradaLigar,
}

const defQuem: DefinicaoDesafio<InstanciaLigar, Record<string, string>> = {
  desafio: desafioQuem,
  instrucao: 'Para cada personagem, escolha o que ele fez ou decidiu.',
  respostaInicial: () => ({}),
  podeEnviar: ligarTudo,
  Entrada: EntradaLigar,
}

export const DEFINICOES_HISTORIA: DefinicaoQualquer[] = [
  defOrdem,
  criarDefMulti<DadosLado>({
    ...base,
    id: 'historia/linha-do-tempo/lado',
    titulo: 'Brasil e mundo ao mesmo tempo',
    instrucao: 'Compare os anos: procure o acontecimento que estava em curso no mesmo período.',
    gerar: gerarLado,
  }),
  defCadeia,
  defQuem,
  criarDefMulti<DadosIntruso>({
    ...base,
    id: 'historia/linha-do-tempo/intruso',
    titulo: 'Qual é o intruso?',
    instrucao: 'Três acontecimentos pertencem ao período indicado; encontre o que ficou de fora.',
    gerar: gerarIntruso,
  }),
  criarDefMulti<DadosCausa>({
    ...base,
    id: 'historia/linha-do-tempo/causa',
    titulo: 'Causa ou consequência?',
    instrucao: 'A causa vem antes e ajuda a produzir o fato; a consequência vem depois.',
    gerar: gerarCausa,
  }),
]
