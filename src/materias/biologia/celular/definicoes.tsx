import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarMembrana, gerarOrganelas, gerarOsmose, type DadosMembrana, type DadosOrganelas, type DadosOsmose } from './geradores'
import { gerarContagem, gerarFases, type DadosDivisao, type DadosFase } from './geradoresDivisao'
import { gerarEnergia, gerarMetabolismo, type DadosEnergia, type DadosMetabolismo } from './geradoresEnergia'
import { VisualFase, VisualMembrana } from './Visuais'
import { VisualEnergia, VisualMetabolismo } from './VisuaisEnergia'

const base = { materia: 'biologia' as const, tema: 'celular' }

export const DEFINICOES_CELULAR: DefinicaoQualquer[] = [
  criarDefMulti<DadosOrganelas>({
    ...base,
    id: 'biologia/celular/organelas',
    titulo: 'Organelas e estruturas celulares',
    instrucao: 'Associe cada estrutura à sua função e ao tipo de célula em que ela existe.',
    gerar: gerarOrganelas,
  }),
  criarDefMulti<DadosMembrana>({
    ...base,
    id: 'biologia/celular/membrana',
    titulo: 'Membrana e transporte',
    instrucao: 'Veja o gradiente (a favor ou contra), se há proteína e se há gasto de ATP; na osmose, compare as osmolaridades.',
    gerar: gerarMembrana,
    Visual: VisualMembrana,
  }),
  criarDefNum<DadosOsmose>({
    ...base,
    id: 'biologia/celular/osmose',
    titulo: 'Osmose em números',
    instrucao: 'Osmolaridade = concentração × número de partículas; a água vai do meio de menor para o de maior osmolaridade.',
    gerar: gerarOsmose,
  }),
  criarDefNum<DadosDivisao>({
    ...base,
    id: 'biologia/celular/divisao',
    titulo: 'Contagens na mitose e na meiose',
    instrucao: 'Lembre da duplicação do DNA antes da divisão e do que se separa em cada fase.',
    gerar: gerarContagem,
  }),
  criarDefMulti<DadosFase>({
    ...base,
    id: 'biologia/celular/fases',
    titulo: 'Reconhecer as fases da divisão',
    instrucao: 'Olhe o número de células, os cromossomos duplicados ou simples e se os homólogos estão pareados.',
    gerar: gerarFases,
    Visual: VisualFase,
  }),
  criarDefNum<DadosEnergia>({
    ...base,
    id: 'biologia/celular/energia',
    titulo: 'Fermentação, respiração e fotossíntese em números',
    instrucao: 'Use as equações balanceadas e as massas molares; na curva de luz, compare fotossíntese e respiração.',
    gerar: gerarEnergia,
    Visual: VisualEnergia,
  }),
  criarDefMulti<DadosMetabolismo>({
    ...base,
    id: 'biologia/celular/metabolismo',
    titulo: 'Metabolismo energético e enzimas',
    instrucao: 'Pense em onde cada etapa ocorre, no que entra e sai de cada processo e na forma da enzima.',
    gerar: gerarMetabolismo,
    Visual: VisualMetabolismo,
  }),
]
