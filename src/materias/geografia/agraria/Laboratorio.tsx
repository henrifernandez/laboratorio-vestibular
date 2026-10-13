import { NOTA_MODELO_AGRARIA, SISTEMAS } from '@/conteudo/geografia/agraria'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { curvaModelo, decompor, giniModelo, kDosMaiores, lorenzModelo, parteDosMaiores, producao } from './calculo'
import { DEFINICOES_AGRARIA } from './definicoes'
import { BarrasProducao, CartaoSistema, LorenzSvg, TabelaSistemas, g2 } from './Visuais'

const fmt = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: curva de Lorenz */

const PADRAO_LORENZ = { topo: 60 }

function TelaLorenz() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LORENZ)
  const topo = Math.min(95, Math.max(10, Math.round(e.topo)))
  const k = kDosMaiores(topo / 100, 0.1)
  const gini = giniModelo(k)
  const umPorCento = parteDosMaiores(0.01, k) * 100
  const metade = lorenzModelo(0.5, k) * 100
  const nivel = gini < 0.3 ? 'baixa concentração' : gini < 0.6 ? 'concentração média' : 'alta concentração'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <LorenzSvg pontos={curvaModelo(k)} gini={gini} titulo="de uma região modelo" />
        <Cartao vivo>
          <p className="m-0 text-lg">
            Gini <strong className="num">{g2(gini)}</strong>: {nivel}.
          </p>
          <p className="m-0">
            Os <strong>10% maiores</strong> estabelecimentos ficam com <strong className="num">{fmt(topo, 0)}%</strong> da área. Os <strong>1% maiores</strong>, com <strong className="num">{fmt(umPorCento, 1)}%</strong>. Os <strong>50% menores</strong> dividem {metade < 0.1 ? 'menos de ' : 'só '}<strong className="num">{metade < 0.1 ? '0,1' : fmt(metade, 1)}%</strong>.
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Parte da área com os 10% maiores" valor={topo} onChange={(v) => atualizar({ topo: v })} min={10} max={95} passo={1} unidade="%" marcas={[10, 30, 50, 70, 95]} />
        <Cartao>
          <p className="m-0 text-sm">Com 10%, a área é distribuída por igual: a curva coincide com a diagonal e o Gini é zero. Quanto mais área fica com os maiores, mais a curva se afasta da diagonal e mais o Gini se aproxima de 1.</p>
        </Cartao>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MODELO_AGRARIA}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: sistemas agrícolas */

function TelaSistemas() {
  const [e, atualizar, reiniciar] = useEstadoUrl({ s: 'agronegocio' })
  const s = SISTEMAS.find((x) => x.id === e.s) ?? (SISTEMAS[0] as (typeof SISTEMAS)[number])
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        <CartaoSistema sistema={s} />
        <TabelaSistemas sistemas={SISTEMAS} destaque={s.id} />
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Sistema agrícola" valor={s.id} opcoes={SISTEMAS.map((x) => ({ id: x.id, rotulo: x.nome }))} onChange={(v) => atualizar({ s: v })} />
        <Cartao vivo>
          <p className="m-0 text-sm">Compare os sistemas pelas mesmas perguntas: escala, trabalho, tecnologia e destino da produção. É assim que a prova costuma pedir a classificação de um caso.</p>
        </Cartao>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: de onde veio o crescimento */

const PADRAO_PRODUCAO = { area: 120, prod: 4 }
const AREA0 = 100
const PROD0 = 2

function TelaProducao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_PRODUCAO)
  const area = Math.min(300, Math.max(50, Math.round(e.area)))
  const prod = Math.min(8, Math.max(1, Math.round(e.prod * 2) / 2))
  const d = decompor(AREA0, PROD0, area, prod)
  const p0 = producao(AREA0, PROD0)
  const p1 = producao(area, prod)
  const tipo =
    d.fatorProducao === 1
      ? 'A produção não mudou.'
      : d.fatorProducao < 1
        ? 'A produção caiu.'
        : d.partePelaArea > 0.6
          ? 'Crescimento mais extensivo: veio sobretudo do aumento da área.'
          : d.partePelaArea < 0.4
            ? 'Crescimento mais intensivo: veio sobretudo do aumento da produtividade.'
            : 'Crescimento misto: área e produtividade contribuíram de forma parecida.'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <BarrasProducao area0={AREA0} prod0={PROD0} area1={area} prod1={prod} />
        <Cartao vivo>
          <p className="m-0 num">
            Antes: {fmt(AREA0, 0)} ha × {fmt(PROD0, 1)} t/ha = <strong>{fmt(p0, 0)} t</strong>. Depois: {fmt(area, 0)} ha × {fmt(prod, 1)} t/ha = <strong>{fmt(p1, 0)} t</strong>.
          </p>
          <p className="m-0 num">
            Produção {d.pctProducao >= 0 ? '+' : ''}
            {fmt(d.pctProducao, 1)}% = área {d.pctArea >= 0 ? '+' : ''}
            {fmt(d.pctArea, 1)}% combinada com produtividade {d.pctProdutividade >= 0 ? '+' : ''}
            {fmt(d.pctProdutividade, 1)}% (os fatores se multiplicam: {fmt(d.fatorArea, 2)} × {fmt(d.fatorProdutividade, 2)} = {fmt(d.fatorProducao, 2)}).
          </p>
          <p className="m-0 font-semibold">{tipo}</p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Área depois" valor={area} onChange={(v) => atualizar({ area: v })} min={50} max={300} passo={5} unidade="ha" marcas={[50, 100, 200, 300]} />
        <ControleDeslizante rotulo="Produtividade depois" valor={prod} onChange={(v) => atualizar({ prod: v })} min={1} max={8} passo={0.5} unidade="t/ha" marcas={[1, 2, 4, 6, 8]} />
        <Cartao>
          <p className="m-0 text-sm">No começo: 100 hectares com 2 toneladas por hectare. Mexa nos dois controles e veja de onde vem o crescimento da produção: da área (extensivo) ou da produtividade (intensivo).</p>
        </Cartao>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MODELO_AGRARIA}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaLorenz /> },
        { id: 'explorar', conteudo: <TelaSistemas /> },
        { id: 'lab', conteudo: <TelaProducao /> },
      ]}
      desafios={DEFINICOES_AGRARIA}
    />
  )
}
