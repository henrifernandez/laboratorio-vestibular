import { BLOCOS, ESTAGIOS, NOTA_BLOCOS, PONTOS } from '@/conteudo/geografia/geopolitica'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { CHAVES, NOME_CARACTERISTICA, classificarIntegracao } from './calculo'
import { DEFINICOES_GEOPOLITICA } from './definicoes'
import { EscadaIntegracao, ListaPontos, MapaBloco, MapaPontos } from './Visuais'

/* ------------------------------------------------------------------ Introdução: blocos no mapa */

function TelaBlocos() {
  const [e, atualizar, reiniciar] = useEstadoUrl({ b: 'mercosul' })
  const b = BLOCOS.find((x) => x.id === e.b) ?? (BLOCOS[0] as (typeof BLOCOS)[number])
  const estagio = ESTAGIOS.find((x) => x.id === b.estagio)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <MapaBloco bloco={b} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">
            {b.nome} ({b.sigla}), <span className="num">{b.criacao}</span>
          </p>
          <p className="m-0">{b.resumo}</p>
          <p className="m-0">
            <strong>Estágio de integração:</strong> {estagio?.nome}. {estagio?.definicao}
          </p>
          <ul className="m-0 grid gap-1 pl-5 text-sm">
            {b.fatos.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Bloco econômico" valor={b.id} opcoes={BLOCOS.map((x) => ({ id: x.id, rotulo: `${x.sigla}: ${x.nome}` }))} onChange={(v) => atualizar({ b: v })} />
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_BLOCOS}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: monte um bloco */

const PADRAO_MONTE = { tz: true, te: false, fa: false, mo: false }

function TelaMonte() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MONTE)
  const c = { tarifaZero: e.tz, tarifaExterna: e.te, fatores: e.fa, moeda: e.mo }
  const r = classificarIntegracao(c)
  const ids = { tarifaZero: 'tz', tarifaExterna: 'te', fatores: 'fa', moeda: 'mo' } as const
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <Cartao vivo>
          {r.estagio ? (
            <>
              <p className="m-0 text-lg font-semibold">
                {r.estagio.numero}. {r.estagio.nome}
              </p>
              <p className="m-0">{r.estagio.definicao}</p>
              <p className="m-0 text-sm">Exemplo: {r.estagio.exemplo}.</p>
            </>
          ) : (
            <p className="m-0 text-lg font-semibold">Ainda não é um bloco de integração: sem eliminar as tarifas entre os membros, não há nem zona de livre-comércio.</p>
          )}
          {r.semEfeito.length > 0 && (
            <p className="m-0 text-sm" role="status">
              Sem efeito por enquanto: {r.semEfeito.map((k) => NOME_CARACTERISTICA[k].toLowerCase()).join('; ')}. Cada estágio exige os anteriores.
            </p>
          )}
        </Cartao>
        <EscadaIntegracao destaque={r.estagio?.id ?? null} />
      </div>
      <div className="grid content-start gap-4">
        <PainelDeVisibilidade titulo="O que os países decidiram" itens={CHAVES.map((k) => ({ id: ids[k], rotulo: NOME_CARACTERISTICA[k], ativo: e[ids[k]] }))} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Ligue as decisões na ordem: o estágio é o mais avançado cujas exigências foram todas cumpridas. Experimente ligar só a moeda única e veja por que ela não vale sozinha.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: pontos estratégicos */

function TelaPontos() {
  const [e, atualizar, reiniciar] = useEstadoUrl({ p: 'ormuz' })
  const p = PONTOS.find((x) => x.id === e.p) ?? (PONTOS[0] as (typeof PONTOS)[number])
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <MapaPontos />
        <ListaPontos destaque={p.id} onEscolher={(id) => atualizar({ p: id })} />
      </div>
      <div className="grid content-start gap-4">
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">{p.nome}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {p.tipo === 'canal' ? 'Canal' : 'Estreito'} em: {p.paises}
          </p>
          <p className="m-0">
            Liga <strong>{p.liga[0]}</strong> e <strong>{p.liga[1]}</strong>.
          </p>
          <p className="m-0">{p.importancia}</p>
          <p className="m-0 text-sm">{p.nota}</p>
        </Cartao>
        <Seletor rotulo="Ponto estratégico" valor={p.id} opcoes={PONTOS.map((x, i) => ({ id: x.id, rotulo: `${i + 1}. ${x.nome}` }))} onChange={(v) => atualizar({ p: v })} />
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaBlocos /> },
        { id: 'explorar', conteudo: <TelaMonte /> },
        { id: 'lab', conteudo: <TelaPontos /> },
      ]}
      desafios={DEFINICOES_GEOPOLITICA}
    />
  )
}
