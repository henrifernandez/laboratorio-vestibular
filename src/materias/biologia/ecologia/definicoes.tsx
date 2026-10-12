import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { gerarCiclos, gerarEnergia, gerarPopulacao, gerarRelacoes, gerarTeia, type DadosCiclo, type DadosEnergia, type DadosPopulacao, type DadosRelacao, type DadosTeia } from './geradores'
import { VisualEnergia, VisualPopulacao, VisualTeia } from './Visuais'

const base = { materia: 'biologia' as const, tema: 'ecologia' }

export const DEFINICOES_ECOLOGIA: DefinicaoQualquer[] = [
  criarDefNum<DadosEnergia>({
    ...base,
    id: 'biologia/ecologia/energia',
    titulo: 'Energia e poluentes na cadeia',
    instrucao: 'Siga a energia (ou o poluente) de um nível para o outro, uma passagem de cada vez.',
    gerar: gerarEnergia,
    Visual: VisualEnergia,
  }),
  criarDefMulti<DadosTeia>({
    ...base,
    id: 'biologia/ecologia/teia',
    titulo: 'Ler uma teia alimentar',
    instrucao: 'Siga as setas: elas vão de quem é comido para quem come.',
    gerar: gerarTeia,
    Visual: VisualTeia,
  }),
  criarDefNum<DadosPopulacao>({
    ...base,
    id: 'biologia/ecologia/populacao',
    titulo: 'Tamanho e crescimento de populações',
    instrucao: 'Identifique o modelo (saldo, exponencial, logístico ou marcação-recaptura) e aplique a fórmula.',
    gerar: gerarPopulacao,
    Visual: VisualPopulacao,
  }),
  criarDefMulti<DadosRelacao>({
    ...base,
    id: 'biologia/ecologia/relacoes',
    titulo: 'Relações ecológicas e sucessão',
    instrucao: 'Veja quem se beneficia, quem é prejudicado e se as espécies são iguais ou diferentes.',
    gerar: gerarRelacoes,
  }),
  criarDefMulti<DadosCiclo>({
    ...base,
    id: 'biologia/ecologia/ciclos',
    titulo: 'Ciclos do carbono e do nitrogênio',
    instrucao: 'Associe cada processo ao que ele transforma e a quem o realiza.',
    gerar: gerarCiclos,
  }),
]
