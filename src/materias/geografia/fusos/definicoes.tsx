import { CIDADES } from '@/conteudo/geografia/fusos'
import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum, type InstanciaMulti, type InstanciaNum, type VisualProps } from '@/desafios/simples'
import { gerarFuso, gerarHora, gerarLongitude, gerarReuniao, gerarViagem, type DadosFusos, type DadosLongitude, type DadosViagem } from './geradores'
import { FaixaFusos, MapaFusos } from './Visuais'

const base = { materia: 'geografia' as const, tema: 'fusos' }

function marcasDe(ids: string[]) {
  return ids.flatMap((id) => {
    const c = CIDADES.find((x) => x.id === id)
    return c ? [{ utc: c.utc, rotulo: c.curto }] : []
  })
}

function VisualCidades({ ids }: { ids?: string[] }) {
  return ids && ids.length ? <FaixaFusos marcas={marcasDe(ids)} /> : null
}

const VisualHora = ({ inst }: VisualProps<InstanciaMulti<DadosFusos>>) => <VisualCidades ids={inst.dados?.cidades} />
const VisualViagem = ({ inst }: VisualProps<InstanciaNum<DadosViagem>>) => <VisualCidades ids={inst.dados?.cidades} />
const VisualFuso = ({ inst }: VisualProps<InstanciaMulti<DadosFusos>>) => (inst.dados?.longitude !== undefined ? <MapaFusos longitude={inst.dados.longitude} /> : null)

export const DEFINICOES_FUSOS: DefinicaoQualquer[] = [
  criarDefMulti<DadosFusos>({
    ...base,
    id: 'geografia/fusos/hora',
    titulo: 'Que horas são lá?',
    instrucao: 'Ache a diferença entre os fusos (destino − origem), some à hora e corrija o dia da semana se passar da meia-noite.',
    gerar: gerarHora,
    Visual: VisualHora,
  }),
  criarDefNum<DadosLongitude>({
    ...base,
    id: 'geografia/fusos/longitude',
    titulo: 'Longitude e horas',
    instrucao: 'Use 15° = 1 hora e 1° = 4 minutos para converter entre graus, horas e minutos.',
    gerar: gerarLongitude,
  }),
  criarDefNum<DadosViagem>({
    ...base,
    id: 'geografia/fusos/viagem',
    titulo: 'Viagens de avião',
    instrucao: 'Os dois horários são locais. Descontando a diferença de fuso da diferença dos relógios, sobra a duração do voo.',
    gerar: gerarViagem,
    Visual: VisualViagem,
  }),
  criarDefMulti<DadosFusos>({
    ...base,
    id: 'geografia/fusos/fuso',
    titulo: 'Fuso teórico e conceitos',
    instrucao: 'Divida a longitude por 15° e arredonde (oeste negativo), ou use os conceitos da aba Entenda.',
    gerar: gerarFuso,
    Visual: VisualFuso,
  }),
  criarDefMulti<DadosFusos>({
    ...base,
    id: 'geografia/fusos/reuniao',
    titulo: 'Reunião entre cidades',
    instrucao: 'Converta o horário de Brasília para cada cidade e confira se todos começam entre 9h e 17h no horário local.',
    gerar: gerarReuniao,
    Visual: VisualHora,
  }),
]
