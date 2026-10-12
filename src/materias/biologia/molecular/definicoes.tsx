import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import {
  gerarBiotec,
  gerarCodigo,
  gerarMutacoes,
  gerarReplicacao,
  gerarTecnicas,
  gerarTraducao,
  gerarTranscricao,
  type DadosBiotec,
  type DadosCodigo,
  type DadosMutacao,
  type DadosReplicacao,
  type DadosTecnicas,
  type DadosTraducao,
  type DadosTranscricao,
} from './geradores'
import { VisualBiotec, VisualSequencias, VisualTecnicas } from './Visuais'

const base = { materia: 'biologia' as const, tema: 'molecular' }

export const DEFINICOES_MOLECULAR: DefinicaoQualquer[] = [
  criarDefMulti<DadosTranscricao>({
    ...base,
    id: 'biologia/molecular/transcricao',
    titulo: 'Do DNA ao mRNA',
    instrucao: 'Pareie base por base: A–U, T–A, G–C, C–G. O mRNA é complementar ao molde e igual à codificadora, com U no lugar de T.',
    gerar: gerarTranscricao,
    Visual: VisualSequencias,
  }),
  criarDefMulti<DadosTraducao>({
    ...base,
    id: 'biologia/molecular/traducao',
    titulo: 'Do mRNA à proteína',
    instrucao: 'Procure o primeiro AUG, leia de 3 em 3 bases e pare no códon de parada.',
    gerar: gerarTraducao,
    Visual: VisualSequencias,
  }),
  criarDefMulti<DadosMutacao>({
    ...base,
    id: 'biologia/molecular/mutacoes',
    titulo: 'Tipos de mutação e seus efeitos',
    instrucao: 'Compare os aminoácidos antes e depois, e veja se o quadro de leitura mudou.',
    gerar: gerarMutacoes,
    Visual: VisualSequencias,
  }),
  criarDefNum<DadosCodigo>({
    ...base,
    id: 'biologia/molecular/codigo',
    titulo: 'Código genético em números',
    instrucao: 'Lembre: 64 códons, 61 com sentido, 3 de parada; cada aminoácido tem de 1 a 6 códons.',
    gerar: gerarCodigo,
  }),
  criarDefNum<DadosReplicacao>({
    ...base,
    id: 'biologia/molecular/replicacao',
    titulo: 'DNA e replicação em números',
    instrucao: 'Use A = T e G = C; em replicação semiconservativa, o total dobra a cada geração e as fitas originais ficam em 2 moléculas.',
    gerar: gerarReplicacao,
  }),
  criarDefNum<DadosBiotec>({
    ...base,
    id: 'biologia/molecular/biotecnologia',
    titulo: 'PCR e enzimas de restrição',
    instrucao: 'Cada ciclo de PCR duplica o número de moléculas; n cortes dão n + 1 fragmentos (linear) ou n (circular).',
    gerar: gerarBiotec,
    Visual: VisualBiotec,
  }),
  criarDefMulti<DadosTecnicas>({
    ...base,
    id: 'biologia/molecular/tecnicas',
    titulo: 'Biotecnologia e regulação gênica',
    instrucao: 'Associe cada técnica à sua enzima e função; no óperon lac, pense no repressor e no CAP–AMPc.',
    gerar: gerarTecnicas,
    Visual: VisualTecnicas,
  }),
]
