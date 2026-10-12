import { CIDADES, NOTA_FUSOS } from '@/conteudo/geografia/fusos'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { chegadaDoVoo, converterHora, formatarDuracao, formatarHora, formatarUtc, fusoTeorico, horaSolar, limitesDoFuso, meridianoCentral, nomeDoDia } from './calculo'
import { DEFINICOES_FUSOS } from './definicoes'
import { FaixaFusos, MapaFusos, TabelaHoras } from './Visuais'

const fmt = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const cidade = (id: string, padrao: string) => CIDADES.find((c) => c.id === id) ?? (CIDADES.find((c) => c.id === padrao) as (typeof CIDADES)[number])
const OPCOES_CIDADE = CIDADES.map((c) => ({ id: c.id, rotulo: `${c.nome} (${formatarUtc(c.utc)})` }))
const OPCOES_DIA = Array.from({ length: 7 }, (_, i) => ({ id: String(i), rotulo: nomeDoDia(i) }))
const sinalH = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n), 2)}`

/* ------------------------------------------------------------------ Introdução: a hora no mundo */

const PADRAO_HORAS = { cid: 'brasilia', h: 10, dia: 1 }

function TelaHoras() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_HORAS)
  const origem = cidade(e.cid, 'brasilia')
  const minutos = Math.round(Math.min(23.5, Math.max(0, e.h)) * 2) * 30
  const dia0 = Math.min(6, Math.max(0, Math.round(e.dia)))
  const linhas = CIDADES.map((c) => {
    const r = converterHora(minutos, origem.utc, c.utc)
    return { cidade: c, minutos: r.minutos, dia: dia0 + r.dia }
  })
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <MapaFusos rotuladas={[origem]} pontos={CIDADES} destaque={Number.isInteger(origem.utc) ? origem.utc : null} />
        <TabelaHoras linhas={linhas} />
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Cidade de origem" valor={origem.id} opcoes={OPCOES_CIDADE} onChange={(v) => atualizar({ cid: v })} />
        <ControleDeslizante rotulo="Hora na origem" valor={minutos / 60} onChange={(v) => atualizar({ h: v })} min={0} max={23.5} passo={0.5} unidade="h" marcas={[0, 6, 12, 18, 23.5]} />
        <Seletor rotulo="Dia da semana na origem" valor={String(dia0)} opcoes={OPCOES_DIA} onChange={(v) => atualizar({ dia: Number(v) })} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">
            Em {origem.nome}: {formatarHora(minutos)} de {nomeDoDia(dia0)}
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">As outras cidades mostram a hora local no mesmo instante. A diferença para cada uma é “fuso da cidade − fuso de {origem.nome}”.</p>
        </Cartao>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_FUSOS}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: longitude e fuso */

const PADRAO_LONGITUDE = { lon: -47, cid: '' }

function TelaLongitude() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LONGITUDE)
  const noMapa = CIDADES.find((c) => c.id === e.cid)
  const longitude = Math.max(-180, Math.min(180, noMapa ? noMapa.lon : e.lon))
  const teorico = fusoTeorico(longitude)
  const [de, ate] = limitesDoFuso(teorico)
  const solar = horaSolar(12 * 60, longitude)
  const oficial = 12 * 60 + teorico * 60
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <MapaFusos longitude={longitude} destaque={teorico} rotuladas={noMapa ? [noMapa] : []} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">
            Longitude {fmt(Math.abs(longitude), 1)}° {longitude < 0 ? 'O' : 'L'}: fuso teórico {formatarUtc(teorico)}
          </p>
          <p className="num m-0 text-sm">
            Meridiano central: {fmt(Math.abs(meridianoCentral(teorico)), 0)}° {teorico < 0 ? 'O' : teorico > 0 ? 'L' : ''}. O fuso vai de {fmt(de, 1)}° a {fmt(ate, 1)}°.
          </p>
          <p className="num m-0 text-sm text-[var(--ink-muted)]">
            Quando em Greenwich são 12h: hora solar aqui = {formatarHora(solar)}; hora do fuso teórico = {formatarHora(oficial)}. A diferença é de {fmt(Math.abs(solar - oficial), 1)} min (4 min por grau fora do meridiano central).
          </p>
        </Cartao>
        {noMapa && (
          <Cartao>
            <p className="m-0 text-sm">
              <strong>{noMapa.nome}</strong>: fuso teórico {formatarUtc(teorico)}, fuso oficial {formatarUtc(noMapa.utc)}.{' '}
              {Math.abs(noMapa.utc - teorico) < 1e-9 ? 'Coincidem.' : `A diferença é de ${fmt(Math.abs(noMapa.utc - teorico), 1)} h: o país escolheu um fuso diferente do que a longitude indica.`}
            </p>
          </Cartao>
        )}
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Longitude (negativa = oeste)" valor={noMapa ? noMapa.lon : e.lon} onChange={(v) => atualizar({ lon: v, cid: '' })} min={-180} max={180} passo={1} unidade="°" marcas={[-180, -90, 0, 90, 180]} />
        <Seletor rotulo="Ou escolha uma cidade" valor={e.cid} opcoes={[{ id: '', rotulo: 'Nenhuma (usar a longitude)' }, ...OPCOES_CIDADE]} onChange={(v) => atualizar({ cid: v })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Experimente: 45° O dá UTC−3. A cada 15° para o leste, o fuso avança uma hora. Cidades como Lagos e Honolulu têm fuso oficial diferente do teórico.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: planeje uma viagem */

const PADRAO_VIAGEM = { o: 'brasilia', d: 'toquio', h: 10, dur: 12 }

function TelaViagem() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_VIAGEM)
  const origem = cidade(e.o, 'brasilia')
  const destino = cidade(e.d, 'toquio')
  const partida = Math.round(Math.min(23.5, Math.max(0, e.h)) * 2) * 30
  const chegada = chegadaDoVoo(partida, e.dur, origem.utc, destino.utc)
  const dif = destino.utc - origem.utc
  const naOrigem = converterHora(partida, origem.utc, origem.utc + e.dur)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <FaixaFusos
          marcas={[
            { utc: origem.utc, rotulo: origem.curto },
            { utc: destino.utc, rotulo: destino.curto },
          ]}
        />
        <MapaFusos rotuladas={[origem, destino]} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">
            Chega em {destino.nome} às {formatarHora(chegada.minutos)} {chegada.dia === 0 ? '(mesmo dia)' : chegada.dia > 0 ? '(dia seguinte)' : '(dia anterior)'}
          </p>
          <p className="num m-0 text-sm">
            Partida: {formatarHora(partida)} em {origem.nome} · duração: {formatarDuracao(e.dur)}
          </p>
          <p className="num m-0 text-sm">
            Conta: {formatarHora(partida)} + {formatarDuracao(e.dur)} = {formatarHora(partida + e.dur * 60)} no relógio de {origem.nome}; mais a diferença de fuso ({sinalH(dif)} h) = {formatarHora(chegada.minutos)}.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {dif > 0 ? `Voando para o leste, o relógio do destino ganha ${fmt(dif, 2)} h.` : dif < 0 ? `Voando para o oeste, o relógio do destino perde ${fmt(-dif, 2)} h.` : 'Os dois lugares têm o mesmo fuso.'}
            {naOrigem.dia !== 0 ? ' O voo passa da meia-noite na origem.' : ''}
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Origem" valor={origem.id} opcoes={OPCOES_CIDADE} onChange={(v) => atualizar({ o: v })} />
        <Seletor rotulo="Destino" valor={destino.id} opcoes={OPCOES_CIDADE} onChange={(v) => atualizar({ d: v })} />
        <ControleDeslizante rotulo="Partida (hora na origem)" valor={partida / 60} onChange={(v) => atualizar({ h: v })} min={0} max={23.5} passo={0.5} unidade="h" marcas={[0, 6, 12, 18, 23.5]} />
        <ControleDeslizante rotulo="Duração do voo" valor={e.dur} onChange={(v) => atualizar({ dur: v })} min={1} max={24} passo={0.5} unidade="h" marcas={[1, 12, 24]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Os voos aqui são só para treino: as durações são inventadas, e não as de voos reais.</p>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_FUSOS}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaHoras /> },
        { id: 'explorar', conteudo: <TelaLongitude /> },
        { id: 'lab', conteudo: <TelaViagem /> },
      ]}
      desafios={DEFINICOES_FUSOS}
    />
  )
}
