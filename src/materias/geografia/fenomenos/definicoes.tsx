import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum, type InstanciaMulti, type InstanciaNum, type VisualProps } from '@/desafios/simples'
import { camadasDeInversao } from './calculo'
import { gerarEnso, gerarInversao, gerarMassa, gerarOrografica, gerarUrbano, perfilDe, type DadosEnso, type DadosInversao, type DadosMassa, type DadosOro, type DadosUrbano } from './geradores'
import { EnsoSvg, GraficoSuperficies, MapaMassas, OrograficaSvg, PerfilSvg, TabelaPerfil } from './Visuais'

const base = { materia: 'geografia' as const, tema: 'fenomenos' }

function VisualOro({ inst, correcao }: VisualProps<InstanciaNum<DadosOro>>) {
  if (!inst.dados) return null
  return <OrograficaSvg montanha={inst.dados.montanha} posicao={correcao ? 2 : 0} mostrarResposta={!!correcao} />
}

function VisualMassa({ inst, correcao }: VisualProps<InstanciaMulti<DadosMassa>>) {
  if (!correcao || !inst.dados) return null
  return <MapaMassas destaque={inst.dados.massa} mostrarTodas={false} />
}

function VisualEnso({ inst }: VisualProps<InstanciaMulti<DadosEnso>>) {
  const a = inst.dados?.anomalia
  return a === undefined ? null : <EnsoSvg anomalia={a} />
}

function VisualUrbano({ inst, correcao }: VisualProps<InstanciaMulti<DadosUrbano>>) {
  if (!correcao || !inst.dados?.superficie) return null
  return <GraficoSuperficies medidas={[]} destaque={inst.dados.superficie} />
}

function VisualInversao({ inst, correcao }: VisualProps<InstanciaNum<DadosInversao>>) {
  if (!inst.dados) return null
  const perfil = perfilDe(inst.dados.params)
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
      <PerfilSvg perfil={perfil} camadas={correcao ? camadasDeInversao(perfil) : []} />
      <TabelaPerfil perfil={perfil} />
    </div>
  )
}

export const DEFINICOES_FENOMENOS: DefinicaoQualquer[] = [
  criarDefNum<DadosOro>({
    ...base,
    id: 'geografia/fenomenos/orografica',
    titulo: 'Chuva de relevo e sombra de chuva',
    instrucao: 'Siga o ar pela serra: 10 °C/km antes da condensação, 6 °C/km depois e 10 °C/km na descida seca.',
    gerar: gerarOrografica,
    Visual: VisualOro,
  }),
  criarDefMulti<DadosMassa>({
    ...base,
    id: 'geografia/fenomenos/massa',
    titulo: 'Massas de ar do Brasil',
    instrucao: 'Pela sigla (E, T, P e c, a) e pela região de origem, descubra a massa de ar.',
    gerar: gerarMassa,
    Visual: VisualMassa,
  }),
  criarDefMulti<DadosEnso>({
    ...base,
    id: 'geografia/fenomenos/enso',
    titulo: 'El Niño e La Niña',
    instrucao: 'Use a anomalia do mar no Pacífico (±0,5 °C) e lembre os efeitos em cada região.',
    gerar: gerarEnso,
    Visual: VisualEnso,
  }),
  criarDefMulti<DadosUrbano>({
    ...base,
    id: 'geografia/fenomenos/urbano',
    titulo: 'Ilha de calor e inversão térmica',
    instrucao: 'Pense no que esquenta e no que esfria o ar perto do chão, e no que acontece quando o ar quente fica por cima.',
    gerar: gerarUrbano,
    Visual: VisualUrbano,
  }),
  criarDefNum<DadosInversao>({
    ...base,
    id: 'geografia/fenomenos/inversao',
    titulo: 'Leia o perfil da inversão',
    instrucao: 'Percorra a tabela de baixo para cima: onde a temperatura sobe com a altura há inversão.',
    gerar: gerarInversao,
    Visual: VisualInversao,
  }),
]
