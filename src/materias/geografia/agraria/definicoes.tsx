import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum, type InstanciaNum, type VisualProps } from '@/desafios/simples'
import { pontosLorenz } from './calculo'
import { gerarBrasil, gerarFundiaria, gerarGini, gerarProducao, gerarSistemas, type DadosGini, type DadosProducao } from './geradores'
import { BarrasProducao, LorenzSvg, TabelaFaixas } from './Visuais'

const base = { materia: 'geografia' as const, tema: 'agraria' }

function VisualGini({ inst, correcao }: VisualProps<InstanciaNum<DadosGini>>) {
  const d = inst.dados
  if (!d) return null
  return (
    <div className="grid gap-2">
      {/* o gráfico mostra o Gini calculado, então só aparece depois da resposta */}
      {correcao ? <LorenzSvg pontos={pontosLorenz(d.faixas)} gini={d.gini} marcar /> : null}
      <TabelaFaixas faixas={d.faixas} />
    </div>
  )
}

function VisualProducao({ inst, correcao }: VisualProps<InstanciaNum<DadosProducao>>) {
  const d = inst.dados
  if (!correcao || d?.area0 === undefined || d.prod0 === undefined || d.area1 === undefined || d.prod1 === undefined) return null
  return <BarrasProducao area0={d.area0} prod0={d.prod0} area1={d.area1} prod1={d.prod1} />
}

export const DEFINICOES_AGRARIA: DefinicaoQualquer[] = [
  criarDefNum<DadosGini>({
    ...base,
    id: 'geografia/agraria/gini',
    titulo: 'Concentração da terra e Gini',
    instrucao: 'Use a tabela: compare áreas médias (nível 1) ou monte a curva de Lorenz e calcule o Gini.',
    gerar: gerarGini,
    Visual: VisualGini,
  }),
  criarDefNum<DadosProducao>({
    ...base,
    id: 'geografia/agraria/producao',
    titulo: 'Área, produtividade e produção',
    instrucao: 'Produção = área × produtividade. Cuidado com as unidades e com percentuais combinados.',
    gerar: gerarProducao,
    Visual: VisualProducao,
  }),
  criarDefMulti({
    ...base,
    id: 'geografia/agraria/sistemas',
    titulo: 'Sistemas agrícolas',
    instrucao: 'Classifique o caso: pense em escala, trabalho, tecnologia e destino da produção.',
    gerar: gerarSistemas,
  }),
  criarDefMulti({
    ...base,
    id: 'geografia/agraria/fundiaria',
    titulo: 'Estrutura fundiária e reforma agrária',
    instrucao: 'Leis, conceitos e movimentos: situe cada um no tempo e pelo que defende.',
    gerar: gerarFundiaria,
  }),
  criarDefMulti({
    ...base,
    id: 'geografia/agraria/brasil',
    titulo: 'Agropecuária no Brasil',
    instrucao: 'Produtos, estados, fronteira agrícola, tecnologia e impactos ambientais.',
    gerar: gerarBrasil,
  }),
]
