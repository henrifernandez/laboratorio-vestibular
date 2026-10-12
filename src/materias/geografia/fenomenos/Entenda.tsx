import { PASSOS_FENOMENOS, type PassoFenomenos } from '@/conteudo/geografia/fenomenos'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { alturaCondensacaoKm } from './calculo'
import { perfilDe } from './geradores'
import { EnsoSvg, GraficoSuperficies, LegendaMedidas, MapaMassas, OrograficaSvg, PerfilSvg, QuadroSigla } from './Visuais'

const MONTANHA = { t0: 28, altura: 3, zc: alturaCondensacaoKm(28, 20) }
const INVERSAO = { t0: 10, base: 200, espessura: 300, delta: 3 }
const NORMAL = { t0: 10, base: 0, espessura: 1000, delta: -6.5 }

function Visual({ v }: { v: PassoFenomenos['visual'] }) {
  switch (v.tipo) {
    case 'sigla':
      return <QuadroSigla />
    case 'massas':
      return <MapaMassas destaque={v.destaque ?? null} mostrarTodas={!v.destaque} />
    case 'orografica':
      return <OrograficaSvg montanha={MONTANHA} posicao={v.posicao} />
    case 'enso':
      return (
        <div className="grid gap-3">
          <EnsoSvg anomalia={0} />
          <EnsoSvg anomalia={1.5} />
          <p className="m-0 text-sm text-[var(--ink-muted)]">Em cima, condições normais; embaixo, El Niño forte: alísios fracos, água quente no leste e ressurgência reduzida.</p>
        </div>
      )
    case 'urbano':
      return (
        <div className="grid gap-2">
          <GraficoSuperficies medidas={[]} />
          <LegendaMedidas />
        </div>
      )
    case 'inversao':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <figure className="m-0 grid gap-1">
            <PerfilSvg perfil={perfilDe(NORMAL)} />
            <figcaption className="text-center text-sm text-[var(--ink-muted)]">Normal: a temperatura cai com a altura</figcaption>
          </figure>
          <figure className="m-0 grid gap-1">
            <PerfilSvg perfil={perfilDe(INVERSAO)} camadas={[{ de: INVERSAO.base, ate: INVERSAO.base + INVERSAO.espessura }]} />
            <figcaption className="text-center text-sm text-[var(--ink-muted)]">Inversão: camada em que a temperatura sobe (faixa laranja)</figcaption>
          </figure>
        </div>
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_FENOMENOS.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="fenomenos" />
}

