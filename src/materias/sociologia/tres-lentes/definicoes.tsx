import { AUTORES_SOCIOLOGIA } from '@/conteudo/sociologia/tresLentes'
import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefLigar } from '@/desafios/ligar'
import { criarDefMulti } from '@/desafios/simples'
import type { DadosAutor } from '../../humanas/comum/geradores'
import { criarVisualAutor } from '../../humanas/comum/VisualAutor'
import { gerarConceitoSociologia, gerarLigarCaso, gerarLigarConceitoSociologia, gerarLigarCorrenteSociologia, gerarObraSociologia, gerarQuemSociologia, gerarSituacao, gerarTipos, type DadosSituacao, type DadosTipos } from './geradores'

const base = { materia: 'sociologia' as const, tema: 'tres-lentes' }
const VisualAutor = criarVisualAutor(AUTORES_SOCIOLOGIA)

export const DEFINICOES_SOCIOLOGIA: DefinicaoQualquer[] = [
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'sociologia/tres-lentes/quem',
    titulo: 'Quem defende esta ideia?',
    instrucao: 'Leia a ideia (uma paráfrase, e não uma citação) e escolha o autor. Procure o conceito-chave.',
    gerar: gerarQuemSociologia,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'sociologia/tres-lentes/conceito',
    titulo: 'Conceitos e significados',
    instrucao: 'Associe cada conceito ao autor, ao significado ou a uma descrição.',
    gerar: gerarConceitoSociologia,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosSituacao>({
    ...base,
    id: 'sociologia/tres-lentes/situacao',
    titulo: 'A mesma situação, lentes diferentes',
    instrucao: 'Cada autor olha para um aspecto. Procure o conceito-chave da leitura. As leituras são ilustrativas.',
    gerar: gerarSituacao,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosTipos>({
    ...base,
    id: 'sociologia/tres-lentes/tipos',
    titulo: 'Classifique o caso',
    instrucao: 'Compare o caso com as definições: tipos de ação e de dominação (Weber), solidariedade (Durkheim) e conceitos de Marx.',
    gerar: gerarTipos,
    Visual: VisualAutor,
  }),
  criarDefMulti<DadosAutor>({
    ...base,
    id: 'sociologia/tres-lentes/obra',
    titulo: 'Obras e autores',
    instrucao: 'Relacione cada obra ao autor e à sua ideia central.',
    gerar: gerarObraSociologia,
    Visual: VisualAutor,
  }),
  criarDefLigar({
    ...base,
    id: 'sociologia/tres-lentes/ligar-corrente',
    titulo: 'Autor e corrente',
    instrucao: 'Ligue cada sociólogo à corrente de pensamento a que ele pertence.',
    gerar: gerarLigarCorrenteSociologia,
    textos: { motivo: 'ligou o autor à corrente errada', licao: 'Cada corrente tem um foco: fatos sociais, ação com sentido, classes, cultura de massa, capital cultural, modernidade líquida.' },
  }),
  criarDefLigar({
    ...base,
    id: 'sociologia/tres-lentes/ligar-conceito',
    titulo: 'Autor e conceito',
    instrucao: 'Ligue cada autor a um conceito dele: pense no assunto central de cada um.',
    gerar: gerarLigarConceitoSociologia,
    textos: { motivo: 'ligou o conceito ao autor errado', licao: 'Cada conceito nasce do problema central do autor: associe o termo ao assunto da obra.' },
  }),
  criarDefLigar({
    ...base,
    id: 'sociologia/tres-lentes/ligar-caso',
    titulo: 'Caso e categoria',
    instrucao: 'Ligue cada caso do dia a dia à categoria da teoria que ele ilustra.',
    gerar: gerarLigarCaso,
    textos: { motivo: 'ligou o caso à categoria errada', licao: 'Procure no caso o motivo da ação ou o que sustenta a situação, e compare com a definição de cada categoria.' },
  }),
]
