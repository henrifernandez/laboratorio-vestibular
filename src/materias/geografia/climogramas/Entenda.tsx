import { CIDADES, CLIMAS, NOTA_DADOS, PASSOS_CLIMOGRAMAS, type PassoClimogramas } from '@/conteudo/geografia/climogramas'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { amplitude, cidade, mediaAnual, mesesSecos, totalAnual } from './calculo'
import { Climograma, Indicadores, TabelaMeses } from './Visuais'

const f = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

function QuadroCidades() {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="num w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Dez climogramas-modelo</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Cidade (clima)</th>
            <th scope="col" className="px-1">T média</th>
            <th scope="col" className="px-1">Amplit.</th>
            <th scope="col" className="px-1">Chuva</th>
            <th scope="col" className="px-1">Meses secos</th>
          </tr>
        </thead>
        <tbody>
          {CIDADES.map((c) => (
            <tr key={c.id} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1 pr-2 text-left font-normal">
                <strong>{c.nome}</strong> <span className="text-[var(--ink-muted)]">({CLIMAS[c.clima].nome})</span>
              </th>
              <td className="px-1">{f(mediaAnual(c))} °C</td>
              <td className="px-1">{f(amplitude(c))} °C</td>
              <td className="px-1">{f(totalAnual(c), 0)} mm</td>
              <td className="px-1">{mesesSecos(c).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m-0 mt-2 text-xs text-[var(--ink-muted)]">{NOTA_DADOS}</p>
    </div>
  )
}

const FATORES: [string, string][] = [
  ['Latitude', 'Quanto mais perto do Equador, mais energia solar: mais quente e com menor amplitude térmica.'],
  ['Altitude', 'A temperatura cai cerca de 6 °C a cada 1.000 m: São Paulo, a quase 800 m, é mais amena que Recife.'],
  ['Continentalidade e maritimidade', 'O mar demora a esquentar e a esfriar: no litoral a amplitude é menor; no interior (Moscou), maior.'],
  ['Massas de ar', 'Trazem umidade ou secura: a massa equatorial continental umedece a Amazônia; a polar atlântica traz frentes frias ao Sul.'],
  ['Correntes marítimas', 'Correntes quentes aquecem o litoral por onde passam (Golfo, no oeste da Europa); correntes frias o esfriam e secam.'],
  ['Relevo', 'Serras forçam o ar a subir e chover do lado do vento; do outro lado, o ar desce seco.'],
]

function Fatores() {
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {FATORES.map(([t, d]) => (
        <li key={t} className="cartao p-3">
          <p className="m-0 font-semibold">{t}</p>
          <p className="m-0 text-sm">{d}</p>
        </li>
      ))}
    </ul>
  )
}

function Visual({ v }: { v: PassoClimogramas['visual'] }) {
  switch (v.tipo) {
    case 'leitura': {
      const c = cidade(v.cidade)
      return (
        <div className="grid gap-2">
          <Climograma dados={c} nome={`${c.nome}, ${c.pais}`} />
          <Indicadores dados={c} />
          <TabelaMeses dados={c} />
        </div>
      )
    }
    case 'cidade': {
      const c = cidade(v.cidade)
      return (
        <div className="grid gap-2">
          <Climograma dados={c} nome={`${c.nome}, ${c.pais} (meses secos com contorno vermelho)`} marcarSecos />
          <Indicadores dados={c} />
          <TabelaMeses dados={c} destacarSecos />
        </div>
      )
    }
    case 'comparacao': {
      const a = cidade(v.a)
      const b = cidade(v.b)
      return (
        <div className="grid gap-3">
          {[a, b].map((c) => (
            <div key={c.id} className="grid gap-1">
              <Climograma dados={c} nome={`${c.nome}, ${c.pais}: ${CLIMAS[c.clima].nome}`} />
              <Indicadores dados={c} />
            </div>
          ))}
        </div>
      )
    }
    case 'quadro':
      return <QuadroCidades />
    case 'fatores':
      return <Fatores />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_CLIMOGRAMAS.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="climogramas" />
}
