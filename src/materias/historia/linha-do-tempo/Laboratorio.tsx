import { Maximize2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { ERAS, EVENTOS, PERIODOS, evento } from '@/conteudo/historia/linhaDoTempo'
import { rotuloAno, type Acontecimento, type TipoEvento } from '@/conteudo/historia/tipos'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { useAnimacao } from '@/sim/useAnimacao'
import { NOME_TIPO } from '@/conteudo/historia/tipos'
import { VISTA_TOTAL, anoFinal, cadeia, deslocar, emCurso, eraDoAno, limitarVista, vistaParaEvento, vistaParaIntervalo, zoomEm, type NoCadeia, type Vista } from './calculo'
import { DEFINICOES_HISTORIA } from './definicoes'
import { LinhaDoTempo, COR_TIPO, ICONE_TIPO } from './LinhaDoTempo'
import { EventoCard, FaixasComCursor, LadoALado, LegendaLinha, PeriodosRapidos } from './Visuais'

const TIPOS: { chave: 'pol' | 'eco' | 'soc' | 'cul' | 'gue'; tipo: TipoEvento }[] = [
  { chave: 'pol', tipo: 'politico' },
  { chave: 'eco', tipo: 'economico' },
  { chave: 'soc', tipo: 'social' },
  { chave: 'cul', tipo: 'cultural' },
  { chave: 'gue', tipo: 'guerra' },
]

/* ------------------------------------------------------------------ Introdução: a linha do tempo com zoom */

const PADRAO_LINHA = { c: VISTA_TOTAL.c, s: VISTA_TOTAL.s, ev: '', reg: 'todos', pol: true, eco: true, soc: true, cul: true, gue: true }

function TelaLinha() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LINHA)
  const vista: Vista = limitarVista({ c: e.c, s: e.s })
  const reg = e.reg === 'brasil' || e.reg === 'mundo' ? e.reg : 'todos'
  const tiposAtivos = new Set(TIPOS.filter((t) => e[t.chave]).map((t) => t.tipo))
  const eventos = EVENTOS.filter((x) => (reg === 'todos' || x.regiao === reg) && tiposAtivos.has(x.tipo))
  const selecionado = EVENTOS.find((x) => x.id === e.ev) ?? null
  const mudarVista = (v: Vista) => atualizar({ c: v.c, s: v.s })
  const selecionar = (id: string) => {
    const x = evento(id)
    const fora = x.inicio < vista.c - vista.s / 2 || x.inicio > vista.c + vista.s / 2
    const nova = fora ? limitarVista({ c: x.inicio, s: vista.s }) : vista
    atualizar({ ev: id, c: nova.c, s: nova.s })
  }
  return (
    <div className="grid gap-4">
      <LegendaLinha />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Controles de zoom e deslocamento">
        <button type="button" className="btn" onClick={() => mudarVista(zoomEm(vista, 0.5, 0.7))}>
          <ZoomIn size={18} aria-hidden="true" /> Aproximar
        </button>
        <button type="button" className="btn" onClick={() => mudarVista(zoomEm(vista, 0.5, 1.4))}>
          <ZoomOut size={18} aria-hidden="true" /> Afastar
        </button>
        <button type="button" className="btn" aria-label="Mover para antes" onClick={() => mudarVista(deslocar(vista, -vista.s * 0.3))}>
          <ChevronLeft size={18} aria-hidden="true" /> Antes
        </button>
        <button type="button" className="btn" aria-label="Mover para depois" onClick={() => mudarVista(deslocar(vista, vista.s * 0.3))}>
          Depois <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button type="button" className="btn" onClick={() => mudarVista(VISTA_TOTAL)}>
          <Maximize2 size={18} aria-hidden="true" /> Ver tudo
        </button>
      </div>
      <LinhaDoTempo eventos={eventos} eras={ERAS} vista={vista} selecionado={selecionado?.id ?? null} onVista={mudarVista} onSelecionar={selecionar} mostrarMundo={reg !== 'brasil'} mostrarBrasil={reg !== 'mundo'} />
      <PeriodosRapidos onEscolher={(i, f) => mudarVista(vistaParaIntervalo(i, f))} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-3">
          {selecionado ? <EventoCard ev={selecionado} onSelecionar={selecionar} onVer={(x) => mudarVista(vistaParaEvento(x))} /> : <Cartao>Escolha um acontecimento na linha do tempo para ver o contexto, as causas, as consequências e a ligação com o Brasil ou com o mundo.</Cartao>}
        </div>
        <div className="grid content-start gap-4">
          <Alternador
            rotulo="Mostrar"
            valor={reg}
            opcoes={[
              { id: 'todos', rotulo: 'Brasil e mundo' },
              { id: 'brasil', rotulo: 'Só Brasil' },
              { id: 'mundo', rotulo: 'Só mundo' },
            ]}
            onChange={(id) => atualizar({ reg: id })}
          />
          <PainelDeVisibilidade titulo="Tipos de acontecimento" itens={TIPOS.map((t) => ({ id: t.chave, rotulo: NOME_TIPO[t.tipo], ativo: e[t.chave] }))} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
          <Rodape onReiniciar={reiniciar} />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: lado a lado e cadeia de causas */

function ArvoreCadeia({ nos, sentido, onSelecionar }: { nos: NoCadeia[]; sentido: 'causas' | 'consequencias'; onSelecionar: (id: string) => void }) {
  if (nos.length === 0) return <p className="m-0 text-[var(--ink-muted)]">{sentido === 'causas' ? 'Nenhuma causa registrada neste conjunto de acontecimentos.' : 'Nenhuma consequência registrada neste conjunto de acontecimentos.'}</p>
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {nos.map((n) => {
        const Icone = ICONE_TIPO[n.evento.tipo]
        return (
          <li key={n.evento.id} className="grid gap-1">
            <button type="button" className="btn min-h-11 justify-start text-left" onClick={() => onSelecionar(n.evento.id)}>
              <Icone size={15} aria-hidden="true" style={{ color: COR_TIPO[n.evento.tipo], flex: 'none' }} />
              <span>
                {sentido === 'causas' ? '← ' : '→ '}
                {n.evento.titulo} <span className="num text-[var(--ink-muted)]">{rotuloAno(n.evento)}</span>
              </span>
            </button>
            <p className="m-0 pl-3 text-sm text-[var(--ink-muted)]">{n.relacao.texto}</p>
            {n.filhos.length > 0 && (
              <div className="ml-3 border-l-2 border-[var(--line-strong)] pl-3">
                <ArvoreCadeia nos={n.filhos} sentido={sentido} onSelecionar={onSelecionar} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const ORDENADOS = [...EVENTOS].sort((a, b) => a.inicio - b.inicio || a.titulo.localeCompare(b.titulo))

function ExplorarCadeia() {
  const [e, atualizar, reiniciar] = useEstadoUrl({ ev: 'b-independencia', prof: 1 })
  const ev = EVENTOS.find((x) => x.id === e.ev) ?? evento('b-independencia')
  const prof = e.prof >= 2 ? 2 : 1
  const causas = cadeia(ev.id, 'causas', prof)
  const consequencias = cadeia(ev.id, 'consequencias', prof)
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Seletor rotulo="Acontecimento" valor={ev.id} opcoes={ORDENADOS.map((x) => ({ id: x.id, rotulo: `${rotuloAno(x)} — ${x.titulo}` }))} onChange={(id) => atualizar({ ev: id })} />
        <Alternador
          rotulo="Até onde seguir a cadeia"
          valor={String(prof)}
          opcoes={[
            { id: '1', rotulo: 'Ligações diretas' },
            { id: '2', rotulo: 'Duas etapas' },
          ]}
          onChange={(id) => atualizar({ prof: Number(id) })}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr_1fr]">
        <div className="grid content-start gap-2">
          <h3 className="m-0 text-base">O que levou a ele (causas)</h3>
          <ArvoreCadeia nos={causas} sentido="causas" onSelecionar={(id) => atualizar({ ev: id })} />
        </div>
        <div className="order-first lg:order-none">
          <EventoCard ev={ev} onSelecionar={(id) => atualizar({ ev: id })} />
        </div>
        <div className="grid content-start gap-2">
          <h3 className="m-0 text-base">O que ele provocou (consequências)</h3>
          <ArvoreCadeia nos={consequencias} sentido="consequencias" onSelecionar={(id) => atualizar({ ev: id })} />
        </div>
      </div>
      <p className="m-0 text-sm text-[var(--ink-muted)]">As ligações vêm de uma lista de relações de causa e consequência conferida com os livros de referência. Clique em um acontecimento para seguir a cadeia.</p>
      <Rodape onReiniciar={reiniciar} />
    </div>
  )
}

function ExplorarLado() {
  const [e, atualizar, reiniciar] = useEstadoUrl({ per: 'p5', det: 'principais', ev: '' })
  const periodo = PERIODOS.find((p) => p.id === e.per) ?? (PERIODOS[4] as (typeof PERIODOS)[number])
  const principais = e.det !== 'todos'
  const eventos = EVENTOS.filter((x) => anoFinal(x) >= periodo.inicio && x.inicio <= periodo.fim && (!principais || x.peso <= 2))
  const selecionado = EVENTOS.find((x) => x.id === e.ev) ?? null
  const brasil = eventos.filter((x) => x.regiao === 'brasil').length
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Seletor rotulo="Período" valor={periodo.id} opcoes={PERIODOS.map((p) => ({ id: p.id, rotulo: p.rotulo }))} onChange={(id) => atualizar({ per: id, ev: '' })} />
        <Alternador
          rotulo="Detalhe"
          valor={principais ? 'principais' : 'todos'}
          opcoes={[
            { id: 'principais', rotulo: 'Principais' },
            { id: 'todos', rotulo: 'Todos' },
          ]}
          onChange={(id) => atualizar({ det: id })}
        />
      </div>
      <Cartao vivo>
        <p className="m-0 text-lg">
          De {periodo.inicio} a {periodo.fim}: <strong>{brasil}</strong> acontecimentos no Brasil e <strong>{eventos.length - brasil}</strong> no mundo.
        </p>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Compare as duas colunas pelos anos e procure relações: o que acontecia lá fora enquanto isso mudava aqui?</p>
      </Cartao>
      <LadoALado eventos={eventos} selecionado={selecionado?.id ?? null} onSelecionar={(id) => atualizar({ ev: id })} />
      {selecionado && <EventoCard ev={selecionado} onSelecionar={(id) => atualizar({ ev: id })} />}
      <Rodape onReiniciar={reiniciar} />
    </div>
  )
}

function TelaExplorar() {
  const [v, atualizar] = useEstadoUrl({ vista: 'lado' })
  return (
    <div className="grid gap-4">
      <Alternador
        rotulo="O que explorar"
        valor={v.vista === 'cadeia' ? 'cadeia' : 'lado'}
        opcoes={[
          { id: 'lado', rotulo: 'Brasil e mundo lado a lado' },
          { id: 'cadeia', rotulo: 'Cadeia de causas' },
        ]}
        onChange={(id) => atualizar({ vista: id })}
      />
      {v.vista === 'cadeia' ? <ExplorarCadeia /> : <ExplorarLado />}
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: máquina do tempo */

const ANO_INICIAL = 1450
const ANO_FINAL = 2025

function ListaEmCurso({ titulo, itens, onSelecionar }: { titulo: string; itens: Acontecimento[]; onSelecionar: (id: string) => void }) {
  return (
    <div className="grid content-start gap-2">
      <h3 className="m-0 text-base">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="m-0 text-[var(--ink-muted)]">Nenhum acontecimento da lista está em curso neste ano.</p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {itens.map((x) => (
            <li key={x.id}>
              <button type="button" className="btn min-h-11 w-full justify-start text-left" onClick={() => onSelecionar(x.id)}>
                <span className="num font-bold">{rotuloAno(x)}</span> {x.titulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TelaMaquina() {
  const [e, atualizar, reiniciar] = useEstadoUrl({ a: 1500, ev: '' })
  const anim = useAnimacao(e.a - ANO_INICIAL, ANO_FINAL - ANO_INICIAL, (t) => atualizar({ a: ANO_INICIAL + t }), 25)
  const ano = Math.min(ANO_FINAL, Math.max(ANO_INICIAL, Math.round(e.a)))
  const em = (regiao: 'brasil' | 'mundo') => emCurso(EVENTOS.filter((x) => x.regiao === regiao), ano, 3).filter((x) => x.peso <= 2).sort((a, b) => a.inicio - b.inicio)
  const eraB = eraDoAno('brasil', ano)
  const eraM = eraDoAno('mundo', ano)
  const selecionado = EVENTOS.find((x) => x.id === e.ev) ?? null
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <FaixasComCursor ano={ano} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">As faixas mostram as eras do mundo e do Brasil; a mais forte é a que está em curso no ano escolhido.</p>
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Ano <strong>{ano}</strong>
          </p>
          <p className="m-0">
            <strong>Mundo:</strong> {eraM ? `${eraM.nome} — ${eraM.resumo}` : 'antes da Idade Moderna, segundo a periodização usada aqui.'}
          </p>
          <p className="m-0">
            <strong>Brasil:</strong> {eraB ? `${eraB.nome} — ${eraB.resumo}` : 'ainda não havia colonização portuguesa.'}
          </p>
        </Cartao>
        <div className="grid gap-4 sm:grid-cols-2">
          <ListaEmCurso titulo="Em curso no mundo (ou recém-começados)" itens={em('mundo')} onSelecionar={(id) => atualizar({ ev: id })} />
          <ListaEmCurso titulo="Em curso no Brasil (ou recém-começados)" itens={em('brasil')} onSelecionar={(id) => atualizar({ ev: id })} />
        </div>
        {selecionado && <EventoCard ev={selecionado} onSelecionar={(id) => atualizar({ ev: id })} />}
      </div>
      <div className="grid content-start gap-4">
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(10)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo="Ano" valor={ano} onChange={(x) => atualizar({ a: x })} min={ANO_INICIAL} max={ANO_FINAL} passo={1} marcas={[1500, 1700, 1822, 1930, 1964, 2025]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Aperte reproduzir para ver os séculos passarem: as eras mudam e os acontecimentos entram e saem da lista. O passo avança dez anos.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaLinha /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaMaquina /> },
      ]}
      desafios={DEFINICOES_HISTORIA}
    />
  )
}

