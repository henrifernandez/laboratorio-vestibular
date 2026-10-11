import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import {
  gerarArea,
  gerarPlanificacao,
  gerarTriangulo,
  gerarVolume,
  type DadosArea,
  type DadosPlanificacao,
  type DadosTriangulo,
  type DadosVolume,
} from './geradores'
import { OpcaoPlanificacao, VisualArea, VisualPlanificacao, VisualTriangulo, VisualVolume } from './Visuais'

const base = { materia: 'matematica' as const, tema: 'geometria' }

export const DEFINICOES_GEO: DefinicaoQualquer[] = [
  criarDefMulti<DadosPlanificacao>({
    ...base,
    id: 'matematica/geometria/planificacao',
    titulo: 'Ligue a planificação ao sólido',
    instrucao: 'Dobre a planificação na imaginação: que sólido sai? Qual figura fecha certinho?',
    gerar: gerarPlanificacao,
    Visual: VisualPlanificacao,
    Opcao: OpcaoPlanificacao,
  }),
  criarDefNum<DadosVolume>({
    ...base,
    id: 'matematica/geometria/volume',
    titulo: 'Estime o volume',
    instrucao: 'Estime o volume antes de calcular. Depois de responder, o sólido se enche de água para conferir.',
    gerar: gerarVolume,
    Visual: VisualVolume,
  }),
  criarDefNum<DadosArea>({
    ...base,
    id: 'matematica/geometria/area',
    titulo: 'Área da superfície',
    instrucao: 'Some as áreas das peças da planificação (total ou só a lateral).',
    gerar: gerarArea,
    Visual: VisualArea,
  }),
  criarDefNum<DadosTriangulo>({
    ...base,
    id: 'matematica/geometria/triangulos',
    titulo: 'Pitágoras e semelhança',
    instrucao: 'Use Pitágoras ou a proporção entre lados correspondentes para achar o valor pedido.',
    gerar: gerarTriangulo,
    Visual: VisualTriangulo,
  }),
]
