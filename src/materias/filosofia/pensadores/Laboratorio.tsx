import { ARESTAS, DEBATES, PENSADORES } from '@/conteudo/filosofia/pensadores'
import { autorPorId, NOTA_AUTORES } from '@/conteudo/humanas'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { CartaoAutor } from '../../humanas/comum/Visuais'
import { DEFINICOES_FILOSOFIA } from './definicoes'
import { LegendaLinha, LinhaDoTempoPensadores, SIGLA } from './Visuais'

const OPCOES_PENSADORES = PENSADORES.map((p) => ({ id: p.id, rotulo: `${p.nome} (${p.periodo})` }))
const pensador = (id: string, padrao: string) => autorPorId(PENSADORES, id) ?? autorPorId(PENSADORES, padrao)!
const nome = (id: string) => autorPorId(PENSADORES, id)?.nome ?? id

/* ------------------------------------------------------------------ Introdução: cartões dos pensadores */

const PADRAO_CARTAO = { a: 'platao' }

function TelaCartoes() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CARTAO)
  const a = pensador(e.a, 'platao')
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <CartaoAutor autor={a} nivelTitulo={3} />
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Pensador" valor={a.id} opcoes={OPCOES_PENSADORES} onChange={(v) => atualizar({ a: v })} />
        <Cartao vivo>
          <p className="m-0 text-sm">
            Época: <strong>{PENSADORES.find((p) => p.id === a.id)?.epoca}</strong>. Para a prova, guarde o problema que o pensador quer resolver, a tese e os conceitos-chave.
          </p>
        </Cartao>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_AUTORES}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: mapa de influências */

const PADRAO_MAPA = { a: 'kant' }

function TelaMapa() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MAPA)
  const a = pensador(e.a, 'kant')
  const relacoes = ARESTAS.filter((r) => r.de === a.id || r.para === a.id)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <LinhaDoTempoPensadores selecionado={a.id} onSelecionar={(id) => atualizar({ a: id })} />
        <LegendaLinha />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">
            {a.nome} <span className="num text-sm font-normal text-[var(--ink-muted)]">({a.periodo})</span>
          </p>
          {relacoes.length ? (
            <ul className="m-0 grid list-none gap-2 p-0" aria-label={`Relações de ${a.nome}`}>
              {relacoes.map((r) => (
                <li key={`${r.de}-${r.para}`} className="grid gap-0.5">
                  <p className="m-0 font-semibold">
                    <span className="num mr-1 rounded border border-[var(--line-strong)] px-1 text-xs">{SIGLA[r.tipo]}</span>
                    {nome(r.de)} → {nome(r.para)} <span className="text-sm font-normal text-[var(--ink-muted)]">({r.tipo})</span>
                  </p>
                  <p className="m-0 text-sm">{r.explicacao}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm">Este mapa não registra relações diretas para este pensador.</p>
          )}
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Pensador em destaque" valor={a.id} opcoes={OPCOES_PENSADORES} onChange={(v) => atualizar({ a: v })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Você também pode tocar em um nome na linha do tempo. A seta (→) vai de quem influenciou ou foi criticado até quem recebeu a influência.</p>
        <p className="m-0 text-xs text-[var(--ink-muted)]">O mapa traz apenas relações bem documentadas nos manuais; há outras influências que ficaram de fora.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: debates */

const PADRAO_DEBATE = { d: 'poder' }

function TelaDebates() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_DEBATE)
  const debate = DEBATES.find((d) => d.id === e.d) ?? (DEBATES[0] as (typeof DEBATES)[number])
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <Cartao vivo>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Pergunta em debate</p>
          <p className="m-0 text-lg font-semibold">{debate.pergunta}</p>
        </Cartao>
        <ul className="m-0 grid list-none gap-3 p-0" aria-label="Posições dos pensadores">
          {debate.posicoes.map((p) => {
            const a = pensador(p.autor, 'platao')
            return (
              <li key={p.autor} className="cartao grid gap-1 p-3">
                <p className="m-0 font-semibold">{a.nome}</p>
                <p className="m-0 text-sm text-[var(--ink-muted)]">{a.tradicao}</p>
                <p className="m-0">{p.resposta}</p>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Debate" valor={debate.id} opcoes={DEBATES.map((d) => ({ id: d.id, rotulo: d.titulo }))} onChange={(v) => atualizar({ d: v })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Compare as respostas: o que cada pensador aceita e o que rejeita? Procure o conceito-chave de cada um.</p>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_AUTORES}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaCartoes /> },
        { id: 'explorar', conteudo: <TelaMapa /> },
        { id: 'lab', conteudo: <TelaDebates /> },
      ]}
      desafios={DEFINICOES_FILOSOFIA}
    />
  )
}
