import { CENSOS, FASES, NOTA_MODELO, PASSOS_POPULACAO, type PassoPopulacao } from '@/conteudo/geografia/populacao'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { PARAMETROS_FASE, crescimentoNatural, grupos, parametrosNoTempo, piramideModelo, razaoDependencia, taxaMedia } from './calculo'
import { GraficoRazao, GraficoTransicao, Indicadores, LegendaGrupos, MiniPiramide, PiramideSvg, resumoPiramide } from './Visuais'

const f = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

function Fases() {
  return (
    <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
      {FASES.map((x) => (
        <li key={x.numero} className="cartao p-3">
          <p className="m-0 font-semibold">Fase {x.numero}: {x.nome}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Natalidade {x.natalidade}; mortalidade {x.mortalidade}.</p>
          <p className="m-0 text-sm">Crescimento {x.crescimento}.</p>
        </li>
      ))}
    </ul>
  )
}

function Taxas({ natalidade, mortalidade }: { natalidade: number; mortalidade: number }) {
  const cn = crescimentoNatural(natalidade, mortalidade)
  return (
    <div className="cartao grid gap-1 p-3 text-sm">
      <p className="m-0">Natalidade: <strong className="num">{natalidade} por mil</strong></p>
      <p className="m-0">Mortalidade: <strong className="num">{mortalidade} por mil</strong></p>
      <p className="m-0">Diferença: <strong className="num">{natalidade - mortalidade} por mil</strong> = <strong className="num">{f(cn)}%</strong> ao ano (dividindo por 10)</p>
      <p className="m-0 text-[var(--ink-muted)]">Para a população dobrar: cerca de {f(70 / cn, 0)} anos (70 ÷ {f(cn)}).</p>
    </div>
  )
}

function Censos() {
  const linhas = CENSOS.map((c, i) => {
    const anterior = CENSOS[i - 1]
    return { ...c, taxa: anterior ? taxaMedia(anterior.populacao, c.populacao, c.ano - anterior.ano) : null }
  })
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="num w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">População do Brasil nos censos (IBGE)</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Censo</th>
            <th scope="col" className="px-1">População</th>
            <th scope="col" className="px-1">Taxa média desde o censo anterior</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.ano} className="border-b border-[var(--line)]">
              <th scope="row" className="py-1 pr-2 text-left font-normal">{l.ano}</th>
              <td className="px-1">{l.populacao.toLocaleString('pt-BR')}</td>
              <td className="px-1">{l.taxa === null ? '—' : `${f(l.taxa, 2)}% ao ano`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m-0 mt-2 text-xs text-[var(--ink-muted)]">Taxas calculadas aqui pela fórmula do crescimento composto, a partir das contagens oficiais.</p>
    </div>
  )
}

function Visual({ v }: { v: PassoPopulacao['visual'] }) {
  switch (v.tipo) {
    case 'piramide': {
      const p = piramideModelo(PARAMETROS_FASE[v.fase])
      return (
        <div className="grid gap-2">
          <PiramideSvg piramide={p} grupos={v.grupos} titulo="de um modelo da fase 3" />
          {v.grupos && <LegendaGrupos g={grupos(p)} />}
          <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MODELO}</p>
        </div>
      )
    }
    case 'taxas':
      return <Taxas natalidade={v.natalidade} mortalidade={v.mortalidade} />
    case 'transicao':
      return (
        <div className="grid gap-2">
          <GraficoTransicao />
          <Fases />
        </div>
      )
    case 'quatro':
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([1, 2, 3, 4] as const).map((fase) => {
            const p = piramideModelo(PARAMETROS_FASE[fase])
            return (
              <figure key={fase} className="m-0 grid justify-items-center gap-1">
                <MiniPiramide piramide={p} rotulo={`Pirâmide da fase ${fase}: ${resumoPiramide(p)}`} />
                <figcaption className="text-center text-sm">
                  <strong>Fase {fase}</strong>
                  <br />
                  <span className="text-[var(--ink-muted)]">{f(grupos(p).jovens, 0)}% de jovens, {f(grupos(p).idosos, 0)}% de idosos</span>
                </figcaption>
              </figure>
            )
          })}
        </div>
      )
    case 'indicadores': {
      const p = piramideModelo(PARAMETROS_FASE[v.fase])
      const g = grupos(p)
      return (
        <div className="grid gap-2">
          <PiramideSvg piramide={p} grupos titulo={`de um modelo da fase ${v.fase}`} />
          <LegendaGrupos g={g} />
          <Indicadores g={g} />
        </div>
      )
    }
    case 'bonus': {
      const pontos = Array.from({ length: 9 }, (_, k) => {
        const t = k / 8
        return { rotulo: String(k + 1), rd: razaoDependencia(grupos(piramideModelo(parametrosNoTempo(t)))) }
      })
      return (
        <div className="grid gap-2">
          <GraficoRazao pontos={pontos} marcarMinimo />
          <p className="m-0 text-sm text-[var(--ink-muted)]">Períodos sucessivos de um modelo de transição (1 = início; 9 = final). A razão cai enquanto a natalidade cai, chega a um mínimo (o bônus) e volta a subir com o envelhecimento.</p>
        </div>
      )
    }
    case 'censos':
      return <Censos />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_POPULACAO.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="populacao" />
}
