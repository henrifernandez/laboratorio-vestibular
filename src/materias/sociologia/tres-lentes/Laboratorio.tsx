import { AUTORES_SOCIOLOGIA, NOTA_LEITURAS, SITUACOES } from '@/conteudo/sociologia/tresLentes'
import { autorPorId, NOTA_AUTORES } from '@/conteudo/humanas'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { CartaoAutor, TabelaComparar } from '../../humanas/comum/Visuais'
import { DEFINICOES_SOCIOLOGIA } from './definicoes'

const OPCOES_AUTORES = AUTORES_SOCIOLOGIA.map((a) => ({ id: a.id, rotulo: a.nome }))
const OPCOES_SITUACOES = SITUACOES.map((s) => ({ id: s.id, rotulo: s.titulo }))
const autor = (id: string, padrao: string) => autorPorId(AUTORES_SOCIOLOGIA, id) ?? autorPorId(AUTORES_SOCIOLOGIA, padrao)!

/* ------------------------------------------------------------------ Introdução: cartões dos autores */

const PADRAO_CARTAO = { a: 'durkheim' }

function TelaCartoes() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CARTAO)
  const a = autor(e.a, 'durkheim')
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <CartaoAutor autor={a} nivelTitulo={3} />
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Autor" valor={a.id} opcoes={OPCOES_AUTORES} onChange={(v) => atualizar({ a: v })} />
        <Cartao vivo>
          <p className="m-0 text-sm">
            Para a prova, procure o <strong>conceito-chave</strong> de cada autor e a <strong>corrente</strong> em que ele se insere: {a.tradicao}.
          </p>
        </Cartao>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_AUTORES}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: mesma situação, lentes diferentes */

const PADRAO_SITUACAO = { s: 'automacao', conceitos: true }

function TelaSituacao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_SITUACAO)
  const situacao = SITUACOES.find((s) => s.id === e.s) ?? (SITUACOES[0] as (typeof SITUACOES)[number])
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <Cartao vivo>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Situação</p>
          <p className="m-0 text-lg font-semibold">{situacao.descricao}</p>
        </Cartao>
        <ul className="m-0 grid list-none gap-3 p-0" aria-label="Leituras de cada autor">
          {situacao.leituras.map((l) => {
            const a = autor(l.autor, 'durkheim')
            return (
              <li key={l.autor} className="cartao grid gap-1 p-3">
                <p className="m-0 font-semibold">{a.nome}</p>
                <p className="m-0 text-sm text-[var(--ink-muted)]">{a.tradicao}</p>
                <p className="m-0">{l.texto}</p>
                {e.conceitos && (
                  <p className="m-0 text-sm text-[var(--ink-muted)]">
                    Conceitos do autor: {a.conceitos.map((c) => c.termo).join('; ')}.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_LEITURAS}</p>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Situação" valor={situacao.id} opcoes={OPCOES_SITUACOES} onChange={(v) => atualizar({ s: v })} />
        <PainelDeVisibilidade itens={[{ id: 'conceitos', rotulo: 'Mostrar os conceitos de cada autor', ativo: e.conceitos }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Dica: em cada leitura, procure o conceito-chave. Ele é a pista para reconhecer a lente.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: compare dois autores */

const PADRAO_COMPARAR = { a: 'durkheim', b: 'marx' }

function TelaComparar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_COMPARAR)
  const a = autor(e.a, 'durkheim')
  const b = autor(e.b, 'marx')
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <TabelaComparar a={a} b={b} />
        <div className="grid gap-3 sm:grid-cols-2">
          <CartaoAutor autor={a} compacto nivelTitulo={3} />
          <CartaoAutor autor={b} compacto nivelTitulo={3} />
        </div>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Primeiro autor" valor={a.id} opcoes={OPCOES_AUTORES} onChange={(v) => atualizar({ a: v })} />
        <Seletor rotulo="Segundo autor" valor={b.id} opcoes={OPCOES_AUTORES} onChange={(v) => atualizar({ b: v })} />
        {a.id === b.id && <p className="m-0 text-sm text-[var(--ink-muted)]">Escolha dois autores diferentes para comparar.</p>}
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
        { id: 'explorar', conteudo: <TelaSituacao /> },
        { id: 'lab', conteudo: <TelaComparar /> },
      ]}
      desafios={DEFINICOES_SOCIOLOGIA}
    />
  )
}
