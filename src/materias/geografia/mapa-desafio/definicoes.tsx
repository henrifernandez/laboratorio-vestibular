import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum, type InstanciaMulti, type InstanciaNum, type VisualProps } from '@/desafios/simples'
import { gerarCoordenadas, gerarEscala, gerarFronteiras, gerarPais, gerarProjecao, type DadosEscalaTipo, type DadosMapa } from './geradores'
import { EscalaSvg, MapaPaises } from './Visuais'

const base = { materia: 'geografia' as const, tema: 'mapa-desafio' }

function VisualMapa({ inst }: VisualProps<InstanciaMulti<DadosMapa>>) {
  const d = inst.dados
  if (!d) return null
  return <MapaPaises regiao={d.regiao} destaques={d.destaques} descricao={d.descricao} centroDe={d.centroDe} pontos={d.pontos} />
}

const VisualEscala = ({ inst }: VisualProps<InstanciaNum<DadosEscalaTipo>>) => (inst.dados?.denominador ? <EscalaSvg denominador={inst.dados.denominador} cm={inst.dados.tipo === 'real' ? (inst.dados.cm ?? null) : null} /> : null)

export const DEFINICOES_MAPA: DefinicaoQualquer[] = [
  criarDefMulti<DadosMapa>({
    ...base,
    id: 'geografia/mapa-desafio/coordenadas',
    titulo: 'Coordenadas e hemisférios',
    instrucao: 'Leia a latitude (N ou S) e a longitude (L ou O) para achar os hemisférios, ou use os conceitos de paralelos e meridianos.',
    gerar: gerarCoordenadas,
    Visual: VisualMapa,
  }),
  criarDefNum<DadosEscalaTipo>({
    ...base,
    id: 'geografia/mapa-desafio/escala',
    titulo: 'Escala cartográfica',
    instrucao: 'Escreva tudo em centímetros antes de calcular. 1 km = 100.000 cm.',
    gerar: gerarEscala,
    Visual: VisualEscala,
  }),
  criarDefMulti<DadosMapa>({
    ...base,
    id: 'geografia/mapa-desafio/pais',
    titulo: 'Qual é o país?',
    instrucao: 'Identifique o país em vermelho pela posição, pelos vizinhos e pelas coordenadas do texto alternativo.',
    gerar: gerarPais,
    Visual: VisualMapa,
  }),
  criarDefMulti<DadosMapa>({
    ...base,
    id: 'geografia/mapa-desafio/projecao',
    titulo: 'Projeções cartográficas',
    instrucao: 'Pense no que cada projeção conserva (ângulos, áreas, formas, distâncias) e no que ela deforma.',
    gerar: gerarProjecao,
  }),
  criarDefMulti<DadosMapa>({
    ...base,
    id: 'geografia/mapa-desafio/fronteiras',
    titulo: 'Fronteiras e vizinhos',
    instrucao: 'Trace o mapa mentalmente: quem toca quem. O Brasil não toca o Chile nem o Equador.',
    gerar: gerarFronteiras,
    Visual: VisualMapa,
  }),
]
