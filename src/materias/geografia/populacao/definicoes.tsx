import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum, type InstanciaMulti, type InstanciaNum, type OpcaoVisualProps, type VisualProps } from '@/desafios/simples'
import { grupos } from './calculo'
import { gerarBonus, gerarCrescimento, gerarFase, gerarPiramides, gerarRazao, type DadosBonus, type DadosCrescimento, type DadosFase, type DadosMiniaturas, type DadosRazao } from './geradores'
import { GraficoRazao, LegendaGrupos, MiniPiramide, PiramideSvg, TabelaFaixas, resumoPiramide } from './Visuais'
import type { Piramide } from './calculo'

const base = { materia: 'geografia' as const, tema: 'populacao' }

function VisualPiramide({ piramide }: { piramide: Piramide }) {
  return (
    <div className="grid gap-2">
      <PiramideSvg piramide={piramide} grupos />
      <LegendaGrupos g={grupos(piramide)} />
      <TabelaFaixas piramide={piramide} />
    </div>
  )
}

const VisualRazao = ({ inst }: VisualProps<InstanciaNum<DadosRazao>>) => (inst.dados?.piramide ? <VisualPiramide piramide={inst.dados.piramide} /> : null)
const VisualFase = ({ inst }: VisualProps<InstanciaMulti<DadosFase>>) => (inst.dados?.piramide ? <VisualPiramide piramide={inst.dados.piramide} /> : null)
const VisualBonus = ({ inst, correcao }: VisualProps<InstanciaMulti<DadosBonus>>) => (inst.dados?.pontos ? <GraficoRazao pontos={inst.dados.pontos} marcarMinimo={!!correcao} /> : null)

function Miniatura({ inst, id }: OpcaoVisualProps<InstanciaMulti<DadosMiniaturas>>) {
  const i = inst.opcoes.findIndex((o) => o.id === id)
  const p = inst.dados?.piramides[i]
  if (!p) return null
  return <MiniPiramide piramide={p} rotulo={`Pirâmide ${id}: ${resumoPiramide(p)}`} />
}

export const DEFINICOES_POPULACAO: DefinicaoQualquer[] = [
  criarDefNum<DadosRazao>({
    ...base,
    id: 'geografia/populacao/razao',
    titulo: 'Razão de dependência e envelhecimento',
    instrucao: 'Agrupe as faixas em jovens (0–14), adultos (15–64) e idosos (65+) e calcule a razão pedida.',
    gerar: gerarRazao,
    Visual: VisualRazao,
  }),
  criarDefNum<DadosCrescimento>({
    ...base,
    id: 'geografia/populacao/crescimento',
    titulo: 'Crescimento da população',
    instrucao: 'Converta por mil em porcentagem e use a regra dos 70 ou o crescimento composto, conforme o enunciado.',
    gerar: gerarCrescimento,
  }),
  criarDefMulti<DadosFase>({
    ...base,
    id: 'geografia/populacao/fase',
    titulo: 'Fases da transição demográfica',
    instrucao: 'Use as taxas, a forma da pirâmide ou os conceitos da transição para escolher a resposta.',
    gerar: gerarFase,
    Visual: VisualFase,
  }),
  criarDefMulti<DadosBonus>({
    ...base,
    id: 'geografia/populacao/bonus',
    titulo: 'Bônus demográfico',
    instrucao: 'Pense na razão de dependência: o bônus é o período em que ela está baixa e em queda.',
    gerar: gerarBonus,
    Visual: VisualBonus,
  }),
  criarDefMulti<DadosMiniaturas>({
    ...base,
    id: 'geografia/populacao/piramides',
    titulo: 'Compare pirâmides',
    instrucao: 'As pirâmides usam a mesma escala. Compare as barras e escolha a pirâmide pedida.',
    gerar: gerarPiramides,
    Opcao: Miniatura,
  }),
]
