import { PENSADORES } from '@/conteudo/filosofia/pensadores'
import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti } from '@/desafios/simples'
import type { DadosAutor } from '../../humanas/comum/geradores'
import { criarVisualAutor } from '../../humanas/comum/VisualAutor'
import { gerarConceitoFilosofia, gerarDebate, gerarEpoca, gerarInfluencia, gerarObraFilosofia, gerarQuemFilosofia } from './geradores'

const base = { materia: 'filosofia' as const, tema: 'pensadores' }
const VisualAutor = criarVisualAutor(PENSADORES)

export const DEFINICOES_FILOSOFIA: DefinicaoQualquer[] = [
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/quem',
    titulo: 'Quem defende esta ideia?',
    instrucao: 'Leia a ideia (uma paráfrase, e não uma citação) e escolha o pensador. Procure o conceito-chave e a corrente.',
    gerar: gerarQuemFilosofia,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/conceito',
    titulo: 'Conceitos e significados',
    instrucao: 'Associe cada conceito ao pensador, ao significado ou a uma descrição.',
    gerar: gerarConceitoFilosofia,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/obra',
    titulo: 'Obras e pensadores',
    instrucao: 'Relacione cada obra ao pensador e à sua ideia central. Sócrates não deixou obras.',
    gerar: gerarObraFilosofia,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/debate',
    titulo: 'Grandes debates',
    instrucao: 'Compare as posições: razão ou experiência, poder e contrato, virtude ou dever, ideias e coisas.',
    gerar: gerarDebate,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/epoca',
    titulo: 'Quando viveram?',
    instrucao: 'Use as épocas (Antiguidade, Idade Moderna, Contemporânea) e as datas de cada pensador.',
    gerar: gerarEpoca,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/influencia',
    titulo: 'Influências e críticas',
    instrucao: 'Quem foi discípulo, crítico ou interlocutor de quem? Consulte o mapa de influências do laboratório.',
    gerar: gerarInfluencia,
    Visual: VisualAutor,
  }),
]
