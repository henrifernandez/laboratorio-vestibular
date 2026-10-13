import { PENSADORES } from '@/conteudo/filosofia/pensadores'
import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefLigar } from '@/desafios/ligar'
import { criarDefMulti } from '@/desafios/simples'
import type { DadosAutor } from '../../humanas/comum/geradores'
import { criarVisualAutor } from '../../humanas/comum/VisualAutor'
import { gerarIntrusoFilosofia, gerarLigarConceitoFilosofia, gerarLigarCorrente, gerarTese } from './geradoresCorrentes'
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
  criarDefLigar({
    ...base,
    id: 'filosofia/pensadores/correntes',
    titulo: 'Pensador e corrente',
    instrucao: 'Ligue cada pensador à corrente de pensamento a que ele pertence. Mais de um pensador pode ter a mesma corrente.',
    gerar: gerarLigarCorrente,
    textos: { motivo: 'ligou o pensador à corrente errada', licao: 'Associe cada pensador à ideia central da corrente: razão, experiência, pacto social, existência, classes sociais.' },
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/tese',
    titulo: 'Qual corrente defende esta tese?',
    instrucao: 'Leia a tese e escolha a corrente de pensamento. Procure a palavra-chave: razão, experiência, pacto, ideias, existência.',
    gerar: gerarTese,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'filosofia/pensadores/intruso',
    titulo: 'Qual é o intruso?',
    instrucao: 'Três pensadores pertencem ao grupo (uma época ou uma corrente); encontre o que ficou de fora.',
    gerar: gerarIntrusoFilosofia,
    Visual: VisualAutor,
  }),
  criarDefLigar({
    ...base,
    id: 'filosofia/pensadores/ligar-conceito',
    titulo: 'Pensador e conceito',
    instrucao: 'Ligue cada pensador a um conceito dele. Pense no assunto central da obra de cada um.',
    gerar: gerarLigarConceitoFilosofia,
    textos: { motivo: 'ligou o conceito ao pensador errado', licao: 'Cada conceito nasce de um problema central do pensador: associe o termo ao assunto da obra.' },
  }),
]
