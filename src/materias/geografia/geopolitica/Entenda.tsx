import { BLOCOS, ESTAGIOS, NOTA_BLOCOS, PASSOS_GEOPOLITICA, type PassoGeopolitica } from '@/conteudo/geografia/geopolitica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { EscadaIntegracao, ListaPontos, MapaBloco, MapaPontos } from './Visuais'

const ORDENS: { periodo: string; nome: string; texto: string }[] = [
  { periodo: '1945–1991', nome: 'Bipolar', texto: 'Estados Unidos e União Soviética disputam influência, sem guerra direta (Guerra Fria).' },
  { periodo: 'anos 1990', nome: 'Unipolar', texto: 'Com o fim da URSS (1991), os Estados Unidos ficam como única superpotência.' },
  { periodo: 'século XXI', nome: 'Multipolar', texto: 'Vários polos de poder: EUA, China, União Europeia, Rússia, Índia e outros.' },
]

const ORGANIZACOES: [string, string][] = [
  ['ONU (1945)', 'Assembleia Geral (um voto por país) e Conselho de Segurança (cinco permanentes com veto).'],
  ['FMI e Banco Mundial (1944)', 'Estabilidade monetária e financiamento ao desenvolvimento (Bretton Woods).'],
  ['OMC (1995)', 'Regras do comércio mundial e solução de disputas; sucedeu o GATT.'],
  ['OTAN (1949) e Pacto de Varsóvia (1955)', 'Alianças militares do bloco ocidental e do soviético, na Guerra Fria.'],
  ['OPEP (1960)', 'Países exportadores de petróleo que coordenam a produção e os preços.'],
  ['União Africana (2002)', 'Substituiu a Organização da Unidade Africana (1963).'],
]

const BRASIL: [string, string][] = [
  ['Mercosul', 'Integração com Argentina, Paraguai e Uruguai, desde 1991.'],
  ['ONU e Conselho de Segurança', 'Já foi membro não permanente várias vezes e reivindica um assento permanente.'],
  ['BRICS e G20', 'Economias emergentes: o termo BRIC nasceu em 2001; a África do Sul entrou em 2011.'],
  ['Parceria com a China', 'A China é a maior compradora de soja e de outros produtos do agronegócio brasileiro.'],
]

function Cartoes({ itens }: { itens: [string, string][] }) {
  return (
    <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
      {itens.map(([t, d]) => (
        <li key={t} className="cartao p-3">
          <p className="m-0 font-semibold">{t}</p>
          <p className="m-0 text-sm">{d}</p>
        </li>
      ))}
    </ul>
  )
}

function Visual({ v }: { v: PassoGeopolitica['visual'] }) {
  switch (v) {
    case 'ordem':
      return (
        <ol className="m-0 grid list-none gap-2 p-0">
          {ORDENS.map((o) => (
            <li key={o.nome} className="cartao grid gap-0.5 p-3">
              <p className="m-0 font-semibold">
                {o.nome} <span className="num text-sm font-normal text-[var(--ink-muted)]">({o.periodo})</span>
              </p>
              <p className="m-0 text-sm">{o.texto}</p>
            </li>
          ))}
        </ol>
      )
    case 'organizacoes':
      return <Cartoes itens={ORGANIZACOES} />
    case 'estagios':
      return (
        <div className="grid gap-2">
          <EscadaIntegracao />
          <ul className="m-0 grid list-none gap-1 p-0 text-sm">
            {ESTAGIOS.map((e) => (
              <li key={e.id}>
                <strong>{e.nome}:</strong> {e.exemplo}.
              </li>
            ))}
          </ul>
        </div>
      )
    case 'blocos':
      return (
        <div className="grid gap-3">
          <MapaBloco bloco={BLOCOS[0] as (typeof BLOCOS)[number]} />
          <MapaBloco bloco={BLOCOS[1] as (typeof BLOCOS)[number]} />
          <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_BLOCOS}</p>
        </div>
      )
    case 'pontos':
      return (
        <div className="grid gap-2">
          <MapaPontos />
          <ListaPontos />
        </div>
      )
    case 'brasil':
      return <Cartoes itens={BRASIL} />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_GEOPOLITICA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="geopolitica" />
}
