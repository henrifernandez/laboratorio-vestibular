import { CIDADES } from '@/conteudo/geografia/fusos'
import { NOTA_MAPA, PAISES } from '@/conteudo/geografia/mapa-desafio'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { usePaises } from '../comum/mapa'
import { KM_POR_GRAU, distanciaReal, formatarCoordenada, formatarEscala, hemisferioLO, hemisferioNS, umCentimetro } from './calculo'
import { DEFINICOES_MAPA } from './definicoes'
import { PROJECOES, comparar, criarProjecao, type TipoProjecao } from './projecoes'
import { EscalaSvg, MapaPaises, MapaProjecao, type LinhaMapa } from './Visuais'

const fmt = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: coordenadas */

const PADRAO_COORD = { lat: -16, lon: -48, cid: '', eq: true, tr: false, gw: true }
const OPCOES_CIDADES = [{ id: '', rotulo: 'Nenhuma (usar os controles)' }, ...CIDADES.map((c) => ({ id: c.id, rotulo: c.nome }))]

function TelaCoordenadas() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_COORD)
  const cidade = CIDADES.find((c) => c.id === e.cid)
  const lat = Math.round(Math.max(-90, Math.min(90, cidade ? cidade.lat : e.lat)))
  const lon = Math.round(Math.max(-180, Math.min(180, cidade ? cidade.lon : e.lon)))
  const linhas: LinhaMapa[] = []
  if (e.eq) linhas.push({ tipo: 'paralelo', valor: 0, rotulo: 'Equador' })
  if (e.tr) linhas.push({ tipo: 'paralelo', valor: 23.5, rotulo: 'Câncer' }, { tipo: 'paralelo', valor: -23.5, rotulo: 'Capricórnio' })
  if (e.gw) linhas.push({ tipo: 'meridiano', valor: 0, rotulo: 'Greenwich' })
  const zona = Math.abs(lat) < 23.5 ? 'entre os trópicos (zona tropical)' : Math.abs(lat) < 66.5 ? 'entre um trópico e um círculo polar (zona temperada)' : 'dentro de um círculo polar (zona polar)'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <MapaPaises regiao="mundo" pontos={[{ lat, lon }]} linhas={linhas} descricao={`Mapa-múndi com um ponto marcado em ${formatarCoordenada({ lat, lon })}.`} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">{formatarCoordenada({ lat, lon })}</p>
          <p className="m-0 text-sm">
            Hemisfério <strong>{hemisferioNS(lat)}</strong> e <strong>{hemisferioLO(lon)}</strong>.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            O ponto está {zona}. A distância até o Equador, medida no meridiano, é de cerca de {fmt(Math.abs(lat) * KM_POR_GRAU, 0)} km (1° ≈ {fmt(KM_POR_GRAU, 0)} km).
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Latitude (negativa = sul)" valor={lat} onChange={(v) => atualizar({ lat: v, cid: '' })} min={-90} max={90} passo={1} unidade="°" marcas={[-90, -23.5, 0, 23.5, 90]} />
        <ControleDeslizante rotulo="Longitude (negativa = oeste)" valor={lon} onChange={(v) => atualizar({ lon: v, cid: '' })} min={-180} max={180} passo={1} unidade="°" marcas={[-180, -90, 0, 90, 180]} />
        <Seletor rotulo="Ou escolha uma cidade" valor={e.cid} opcoes={OPCOES_CIDADES} onChange={(v) => atualizar({ cid: v })} />
        <PainelDeVisibilidade
          titulo="Linhas de referência"
          itens={[
            { id: 'eq', rotulo: 'Equador', ativo: e.eq },
            { id: 'tr', rotulo: 'Trópicos', ativo: e.tr },
            { id: 'gw', rotulo: 'Greenwich', ativo: e.gw },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <p className="m-0 text-xs text-[var(--ink-muted)]">As coordenadas são arredondadas a graus inteiros. {NOTA_MAPA}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: escala */

const ESCALAS = [10_000, 25_000, 50_000, 100_000, 250_000, 1_000_000, 5_000_000, 10_000_000, 50_000_000]
const PADRAO_ESCALA = { E: 50_000, cm: 4 }

function usoDaEscala(E: number): string {
  if (E <= 25_000) return 'é uma escala grande: mostra ruas, quarteirões e bairros com detalhe.'
  if (E <= 250_000) return 'mostra uma cidade ou uma região pequena, com estradas e rios.'
  if (E <= 5_000_000) return 'mostra um estado ou um país, com poucos detalhes.'
  return 'é uma escala pequena: mostra um continente ou o mundo, só com os grandes traços.'
}

function TelaEscala() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ESCALA)
  const E = ESCALAS.includes(e.E) ? e.E : 50_000
  const cm = Math.min(10, Math.max(0.5, e.cm))
  const km = distanciaReal(cm, E)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <EscalaSvg denominador={E} cm={cm} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">
            {fmt(cm)} cm no mapa = {km >= 1 ? `${fmt(km, 2)} km` : `${fmt(km * 1000, 0)} m`} no terreno
          </p>
          <p className="num m-0 text-sm">
            Conta: {fmt(cm)} cm × {fmt(E, 0)} = {fmt(cm * E, 0)} cm = {fmt(km, 3)} km (dividindo por 100.000).
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Escala {formatarEscala(E)}: 1 cm vale {umCentimetro(E)}; {usoDaEscala(E)}
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Escala" valor={String(E)} opcoes={ESCALAS.map((x) => ({ id: String(x), rotulo: formatarEscala(x) }))} onChange={(v) => atualizar({ E: Number(v) })} />
        <ControleDeslizante rotulo="Distância no mapa" valor={cm} onChange={(v) => atualizar({ cm: v })} min={0.5} max={10} passo={0.5} unidade="cm" marcas={[0.5, 5, 10]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Experimente: com a mesma medida de 4 cm, a escala 1:50.000 dá 2 km, e a escala 1:5.000.000 dá 200 km. Quanto menor o denominador, maior a escala.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: projeções */

const PADRAO_PROJECAO = { p: 'mercator', a: '304', b: '076' }
const OPCOES_PAISES = PAISES.map((p) => ({ id: p.id, rotulo: p.nome }))
const TIPOS = PROJECOES.map((x) => x.id) as TipoProjecao[]

function TelaProjecao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_PROJECAO)
  const tipo = (TIPOS.includes(e.p as TipoProjecao) ? e.p : 'mercator') as TipoProjecao
  const idA = PAISES.some((p) => p.id === e.a) ? e.a : '304'
  const idB = PAISES.some((p) => p.id === e.b) ? e.b : '076'
  const { paises } = usePaises()
  const a = paises?.find((p) => String(p.id) === idA)
  const b = paises?.find((p) => String(p.id) === idB)
  const nomeA = PAISES.find((p) => p.id === idA)?.nome ?? ''
  const nomeB = PAISES.find((p) => p.id === idB)?.nome ?? ''
  const r = a && b ? comparar(a, b, criarProjecao(tipo).projecao) : null
  const info = PROJECOES.find((x) => x.id === tipo)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <MapaProjecao tipo={tipo} destaques={[idA, idB]} />
        <Cartao vivo>
          {r ? (
            <>
              <p className="m-0 text-sm text-[var(--ink-muted)]">
                Razão das áreas: {nomeA} ÷ {nomeB}
              </p>
              <p className="num m-0 text-lg font-semibold">
                Na tela: {fmt(r.aparente, 2)} · Na realidade: {fmt(r.real, 2)}
              </p>
              <p className="m-0 text-sm text-[var(--ink-muted)]">
                {Math.abs(r.aparente / r.real - 1) < 0.02 ? 'A projeção mantém a proporção entre as áreas.' : r.aparente > r.real ? `Na tela, a razão fica ${fmt(r.aparente / r.real, 1)} vezes maior que a real.` : `Na tela, a razão fica ${fmt(r.real / r.aparente, 1)} vezes menor que a real.`}
              </p>
            </>
          ) : (
            <p className="m-0">Carregando os países…</p>
          )}
        </Cartao>
        <Cartao>
          <p className="m-0 text-sm">
            <strong>{info?.nome}</strong> ({info?.tipo}): preserva {info?.preserva}; deforma {info?.deforma}.
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Alternador rotulo="Projeção" valor={tipo} opcoes={PROJECOES.map((x) => ({ id: x.id, rotulo: x.nome }))} onChange={(v) => atualizar({ p: v })} />
        <Seletor rotulo="País em vermelho" valor={idA} opcoes={OPCOES_PAISES} onChange={(v) => atualizar({ a: v })} />
        <Seletor rotulo="País em azul" valor={idB} opcoes={OPCOES_PAISES} onChange={(v) => atualizar({ b: v })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Experimente: a Groenlândia contra o Brasil em Mercator e em Equal Earth. As áreas reais são calculadas na esfera, a partir do próprio contorno do mapa.</p>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MAPA}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaCoordenadas /> },
        { id: 'explorar', conteudo: <TelaEscala /> },
        { id: 'lab', conteudo: <TelaProjecao /> },
      ]}
      desafios={DEFINICOES_MAPA}
    />
  )
}
