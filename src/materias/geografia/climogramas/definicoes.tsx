import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum, type InstanciaMulti, type InstanciaNum, type OpcaoVisualProps, type VisualProps } from '@/desafios/simples'
import { cidade } from './calculo'
import { gerarClima, gerarComparar, gerarEstacao, gerarGrafico, gerarLeitura, type DadosCidade, type DadosEstacao, type DadosLeitura, type DadosMiniaturas } from './geradores'
import { Climograma, MiniClimograma, TabelaMeses, resumoCurto } from './Visuais'

const base = { materia: 'geografia' as const, tema: 'climogramas' }

function VisualCidade({ dados, correcao }: { dados: DadosCidade; correcao: unknown }) {
  const c = cidade(dados.cidade)
  const respondeu = !!correcao
  return (
    <div className="grid gap-2">
      <Climograma dados={c} marcarSecos={respondeu} nome={respondeu ? `${c.nome} (${c.pais})` : undefined} />
      <TabelaMeses dados={c} destacarSecos={respondeu} />
    </div>
  )
}

const VisualLeitura = ({ inst, correcao }: VisualProps<InstanciaNum<DadosLeitura>>) => (inst.dados ? <VisualCidade dados={inst.dados} correcao={correcao} /> : null)
const VisualClima = ({ inst, correcao }: VisualProps<InstanciaMulti<DadosCidade>>) => (inst.dados ? <VisualCidade dados={inst.dados} correcao={correcao} /> : null)
function VisualEstacao({ inst, correcao }: VisualProps<InstanciaMulti<DadosEstacao>>) {
  if (!inst.dados) return null
  return (
    <div className="grid gap-2">
      <Climograma dados={inst.dados.clima} nome="Cidade modelo (fictícia)" />
      <TabelaMeses dados={inst.dados.clima} destacarSecos={!!correcao} />
    </div>
  )
}

function Miniatura({ inst, id }: OpcaoVisualProps<InstanciaMulti<DadosMiniaturas>>) {
  const i = inst.opcoes.findIndex((o) => o.id === id)
  const c = cidade(inst.dados?.cidades[i] ?? '')
  return <MiniClimograma dados={c} rotulo={`Climograma ${id}: ${resumoCurto(c)}`} />
}

export const DEFINICOES_CLIMOGRAMAS: DefinicaoQualquer[] = [
  criarDefNum<DadosLeitura>({
    ...base,
    id: 'geografia/climogramas/leitura',
    titulo: 'Leia os números do climograma',
    instrucao: 'Linha = temperatura (°C); barras = chuva (mm). Leia os valores e faça a conta pedida.',
    gerar: gerarLeitura,
    Visual: VisualLeitura,
  }),
  criarDefMulti<DadosCidade>({
    ...base,
    id: 'geografia/climogramas/clima',
    titulo: 'Que clima é este?',
    instrucao: 'Combine temperatura, total de chuva, regime de chuvas e meses secos para classificar o clima.',
    gerar: gerarClima,
    Visual: VisualClima,
  }),
  criarDefMulti<DadosEstacao>({
    ...base,
    id: 'geografia/climogramas/estacao',
    titulo: 'Hemisfério e estações',
    instrucao: 'Descubra o hemisfério pelo mês mais quente e some as barras de cada estação.',
    gerar: gerarEstacao,
    Visual: VisualEstacao,
  }),
  criarDefMulti<DadosMiniaturas>({
    ...base,
    id: 'geografia/climogramas/comparar',
    titulo: 'Compare climogramas',
    instrucao: 'Compare os quatro gráficos pelos números (cada um tem sua escala) e escolha o pedido.',
    gerar: gerarComparar,
    Opcao: Miniatura,
  }),
  criarDefMulti<DadosMiniaturas>({
    ...base,
    id: 'geografia/climogramas/grafico',
    titulo: 'Qual é o climograma?',
    instrucao: 'Escolha o gráfico que combina com o clima descrito.',
    gerar: gerarGrafico,
    Opcao: Miniatura,
  }),
]
