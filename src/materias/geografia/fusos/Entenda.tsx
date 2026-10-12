import { CIDADES, NOTA_FUSOS, PASSOS_FUSOS, type PassoFusos } from '@/conteudo/geografia/fusos'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { chegadaDoVoo, formatarDuracao, formatarHora, formatarUtc, nomeDoDia } from './calculo'
import { FaixaFusos, MapaFusos, TabelaFusos } from './Visuais'

const cidade = (id: string) => CIDADES.find((c) => c.id === id)!
const NOME_UTC: Record<number, string> = { [-3]: 'Brasília', 0: 'Greenwich', 9: 'Tóquio' }

function Viagem() {
  const o = cidade('brasilia')
  const d = cidade('toquio')
  const partida = 10 * 60
  const duracao = 12
  const c = chegadaDoVoo(partida, duracao, o.utc, d.utc)
  return (
    <div className="cartao grid gap-1 p-3 text-sm">
      <p className="m-0 font-semibold">Voo de treino (números inventados)</p>
      <p className="m-0">Parte de {o.nome} ({formatarUtc(o.utc)}) às <strong className="num">{formatarHora(partida)}</strong> e dura <strong className="num">{formatarDuracao(duracao)}</strong>.</p>
      <p className="num m-0">Em {o.nome}, na chegada: {formatarHora(partida + duracao * 60)} (mesmo dia).</p>
      <p className="num m-0">Diferença de fuso: {formatarUtc(d.utc)} − ({formatarUtc(o.utc)}) = +{d.utc - o.utc} h.</p>
      <p className="num m-0">Em {d.nome} o relógio marca: <strong>{formatarHora(c.minutos)}</strong> {c.dia > 0 ? '(do dia seguinte)' : '(do mesmo dia)'}.</p>
      <p className="m-0 text-[var(--ink-muted)]">No dia da semana: se a partida for na {nomeDoDia(1)}, a chegada em {d.nome} será na {nomeDoDia(1 + c.dia)}.</p>
    </div>
  )
}

function Data() {
  return (
    <div className="grid gap-2">
      <FaixaFusos
        marcas={[
          { utc: -12, rotulo: 'Leste da linha' },
          { utc: 12, rotulo: 'Oeste da linha' },
        ]}
      />
      <p className="m-0 text-sm text-[var(--ink-muted)]">Nos dois extremos da faixa, o relógio marca a mesma hora (UTC−12 e UTC+12 diferem em 24 horas), mas o lado oeste está um dia à frente no calendário.</p>
    </div>
  )
}

function Visual({ v }: { v: PassoFusos['visual'] }) {
  switch (v.tipo) {
    case 'mapa':
      return (
        <div className="grid gap-2">
          <MapaFusos rotuladas={[cidade('brasilia'), cidade('toquio')]} pontos={[cidade('nova-delhi'), cidade('reykjavik')]} />
          <p className="m-0 text-xs text-[var(--ink-muted)]">Faixas de 15° de longitude: 24 fusos. Os números no alto são o fuso em relação a Greenwich (UTC).</p>
        </div>
      )
    case 'faixa':
      return <FaixaFusos marcas={v.utc.map((u) => ({ utc: u, rotulo: NOME_UTC[u] ?? formatarUtc(u) }))} />
    case 'viagem':
      return <Viagem />
    case 'politico':
      return (
        <div className="grid gap-2">
          <TabelaFusos />
          <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_FUSOS}</p>
        </div>
      )
    case 'data':
      return <Data />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_FUSOS.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="fusos" />
}
