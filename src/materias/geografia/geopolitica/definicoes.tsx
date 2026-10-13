import { BLOCOS, PONTOS } from '@/conteudo/geografia/geopolitica'
import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, type InstanciaMulti, type VisualProps } from '@/desafios/simples'
import { gerarBlocoMembros, gerarIntegracao, gerarOrdem, gerarOrganizacoes, gerarPonto, type DadosBloco, type DadosPonto } from './geradores'
import { EscadaIntegracao, MapaBloco, MapaPontos } from './Visuais'

const base = { materia: 'geografia' as const, tema: 'geopolitica' }

/** O mapa do bloco só aparece depois da resposta: ele mostraria os países. */
function VisualBloco({ inst, correcao }: VisualProps<InstanciaMulti<DadosBloco>>) {
  const b = BLOCOS.find((x) => x.id === inst.dados?.blocoId)
  if (!b || !correcao) return null
  return <MapaBloco bloco={b} />
}

function VisualPonto({ inst, correcao }: VisualProps<InstanciaMulti<DadosPonto>>) {
  const p = PONTOS.find((x) => x.id === inst.dados?.pontoId)
  if (!p) return null
  if (inst.dados?.mostrarNoMapa) {
    // marcado sem nome, para a pessoa reconhecer o lugar; o nome aparece depois da resposta
    return <MapaPontos pontos={[p]} numerar={false} descricao={`Mapa-múndi com um ponto marcado em ${Math.abs(p.lat)}° ${p.lat >= 0 ? 'norte' : 'sul'} e ${Math.abs(p.lon)}° ${p.lon >= 0 ? 'leste' : 'oeste'}${correcao ? `: ${p.nome}` : ''}.`} />
  }
  return correcao ? <MapaPontos pontos={[p]} numerar={false} descricao={`Mapa-múndi com ${p.nome} marcado.`} /> : null
}

const VisualIntegracao = ({ correcao }: VisualProps<InstanciaMulti<undefined>>) => (correcao ? <EscadaIntegracao /> : null)

export const DEFINICOES_GEOPOLITICA: DefinicaoQualquer[] = [
  criarDefMulti<undefined>({
    ...base,
    id: 'geografia/geopolitica/integracao',
    titulo: 'Estágios de integração econômica',
    instrucao: 'Cada estágio inclui os anteriores. Procure a característica mais avançada que o bloco já tem.',
    gerar: gerarIntegracao,
    Visual: VisualIntegracao,
  }),
  criarDefMulti<DadosBloco>({
    ...base,
    id: 'geografia/geopolitica/blocos',
    titulo: 'Blocos e seus países',
    instrucao: 'Pense na região do mundo de cada bloco. Depois da resposta, o mapa mostra os países.',
    gerar: gerarBlocoMembros,
    Visual: VisualBloco,
  }),
  criarDefMulti<undefined>({
    ...base,
    id: 'geografia/geopolitica/organizacoes',
    titulo: 'Organizações internacionais',
    instrucao: 'Associe cada organização ao ano de criação, à função e aos membros principais.',
    gerar: gerarOrganizacoes,
  }),
  criarDefMulti<undefined>({
    ...base,
    id: 'geografia/geopolitica/ordem',
    titulo: 'Ordem mundial e Guerra Fria',
    instrucao: 'Situe cada acontecimento no tempo e na ordem mundial: bipolar, unipolar ou multipolar.',
    gerar: gerarOrdem,
  }),
  criarDefMulti<DadosPonto>({
    ...base,
    id: 'geografia/geopolitica/pontos',
    titulo: 'Canais e estreitos',
    instrucao: 'Veja quais mares o ponto liga e em que país fica. O nível difícil mostra só um ponto no mapa.',
    gerar: gerarPonto,
    Visual: VisualPonto,
  }),
]

