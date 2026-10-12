import { EXEMPLOS_PLACAS } from '@/conteudo/geografia/placas'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { useAnimacao } from '@/sim/useAnimacao'
import { deslocamentoKm, idadeDaCrosta, larguraDoOceano, limiteDe, taxaTotal, tempoMa, type Crosta, type Movimento } from './calculo'
import { DEFINICOES_PLACAS } from './definicoes'
import { ENCONTRO } from './geradores'
import { AssoalhoSvg, CorteSvg, FichaLimite, LegendaCorte } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const TEMPO_MAX = 100 // milhões de anos que preenchem o diagrama
const SEGUNDOS_REAIS = 10

const CROSTAS = [
  { id: 'oceanica', rotulo: 'Oceânica' },
  { id: 'continental', rotulo: 'Continental' },
]
const MOVIMENTOS = [
  { id: 'afastam', rotulo: 'Afastam-se' },
  { id: 'aproximam', rotulo: 'Aproximam-se' },
  { id: 'deslizam', rotulo: 'Deslizam' },
]
const ehCrosta = (x: string): x is Crosta => x === 'oceanica' || x === 'continental'
const ehMov = (x: string): x is Movimento => x === 'afastam' || x === 'aproximam' || x === 'deslizam'

/* ------------------------------------------------------------------ Introdução: monte o encontro */

const PADRAO_ENCONTRO = { a: 'oceanica', b: 'continental', mov: 'aproximam', v: 4, t: 60 }

function TelaEncontro() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ENCONTRO)
  const a: Crosta = ehCrosta(e.a) ? e.a : 'oceanica'
  const b: Crosta = ehCrosta(e.b) ? e.b : 'continental'
  const mov: Movimento = ehMov(e.mov) ? e.mov : 'aproximam'
  const limite = limiteDe(a, b, mov)
  const anim = useAnimacao(e.t, TEMPO_MAX, (v) => atualizar({ t: v }), TEMPO_MAX / SEGUNDOS_REAIS)
  const km = deslocamentoKm(e.v, e.t)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        {limite ? (
          <>
            <CorteSvg limite={limite.id} progresso={e.t / TEMPO_MAX} ordem={[a, b]} />
            <LegendaCorte planta={limite.id === 'transformante'} />
            <FichaLimite id={limite.id} />
          </>
        ) : (
          <Cartao vivo>
            <p className="m-0 text-lg font-semibold">Essa combinação não ocorre na natureza.</p>
            <p className="m-0">
              No limite divergente, o afastamento acontece entre placas do mesmo tipo: dorsal (duas oceânicas) ou rifte (partes de um continente). Uma placa só pode carregar um continente e um oceano ao mesmo tempo: a costa do Brasil, por exemplo, está no meio da Placa Sul-Americana, e não num limite.
            </p>
          </Cartao>
        )}
      </div>
      <div className="grid content-start gap-4">
        <Alternador rotulo="Placa da esquerda" valor={a} opcoes={CROSTAS} onChange={(v) => atualizar({ a: v })} />
        <Alternador rotulo="Placa da direita" valor={b} opcoes={CROSTAS} onChange={(v) => atualizar({ b: v })} />
        <Alternador rotulo="Movimento" valor={mov} opcoes={MOVIMENTOS} onChange={(v) => atualizar({ mov: v })} />
        <ControleDeslizante rotulo="Velocidade relativa" valor={e.v} onChange={(v) => atualizar({ v })} min={1} max={10} passo={0.5} unidade="cm/ano" marcas={[1, 5, 10]} />
        <ControleDeslizante rotulo="Tempo decorrido" valor={e.t} onChange={(v) => atualizar({ t: v })} min={0} max={TEMPO_MAX} passo={1} unidade="milhões de anos" marcas={[0, 50, 100]} />
        <Cartao vivo>
          <p className="m-0">
            {limite ? ENCONTRO[limite.id] : 'Combinação impossível'} · deslocamento relativo: <strong>{fmt(km, 0)} km</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {fmt(e.v)} cm/ano × {fmt(e.t, 0)} Ma × 10 = {fmt(km, 0)} km. O desenho é esquemático; a conta, não.
          </p>
        </Cartao>
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(TEMPO_MAX / 50)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <Rodape
          onReiniciar={() => {
            anim.setRodando(false)
            reiniciar()
          }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: casos reais */

const PADRAO_CASO = { caso: 'andes' }

function TelaCasos() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CASO)
  const ex = EXEMPLOS_PLACAS.find((x) => x.id === e.caso) ?? EXEMPLOS_PLACAS[0]!
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        {ex.limite !== 'intraplaca' ? (
          <>
            <CorteSvg limite={ex.limite} progresso={0.85} ordem={ex.ordem} rotulo={`${ex.nome}: ${ex.placas}.`} />
            <LegendaCorte planta={ex.limite === 'transformante'} />
          </>
        ) : (
          <Cartao>
            <p className="m-0 text-lg font-semibold">O Brasil está no meio da placa</p>
            <p className="m-0">Não há fossa, dorsal, falha transformante nem colisão: as bordas da Placa Sul-Americana ficam longe, na Cordilheira dos Andes (oeste) e na Dorsal Meso-Atlântica (leste).</p>
          </Cartao>
        )}
        {ex.limite !== 'intraplaca' && <FichaLimite id={ex.limite} />}
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Lugar" valor={ex.id} opcoes={EXEMPLOS_PLACAS.map((x) => ({ id: x.id, rotulo: x.nome }))} onChange={(v) => atualizar({ caso: v })} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">{ex.nome}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">{ex.placas}</p>
          <p className="m-0">{ex.descricao}</p>
        </Cartao>
        <div>
          <p className="m-0 mb-1 font-semibold">Pistas que identificam o lugar</p>
          <ul className="m-0 grid gap-1 pl-5">
            {ex.pistas.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: assoalho oceânico */

const PADRAO_ASSOALHO = { meia: 2.5, pos: 1000, ma: 60, larg: 4500 }
const ALCANCE = 2000

function TelaAssoalho() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ASSOALHO)
  const idade = idadeDaCrosta(e.pos, e.meia)
  const total = taxaTotal(e.meia)
  const aberto = larguraDoOceano(e.ma, e.meia)
  const tempoAbertura = tempoMa(e.larg, total)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        <AssoalhoSvg meiaTaxa={e.meia} posicaoKm={e.pos} alcanceKm={ALCANCE} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Cartao vivo>
            <p className="m-0 font-semibold">Idade da crosta</p>
            <p className="m-0">
              A {fmt(Math.abs(e.pos), 0)} km da dorsal: <strong>{fmt(idade, 1)} milhões de anos</strong>
            </p>
            <p className="m-0 text-sm text-[var(--ink-muted)]">{fmt(Math.abs(e.pos), 0)} ÷ ({fmt(e.meia)} × 10)</p>
          </Cartao>
          <Cartao vivo>
            <p className="m-0 font-semibold">Abertura do oceano</p>
            <p className="m-0">
              Em {fmt(e.ma, 0)} Ma: <strong>{fmt(aberto, 0)} km</strong> de largura
            </p>
            <p className="m-0 text-sm text-[var(--ink-muted)]">2 × {fmt(e.meia)} × {fmt(e.ma, 0)} × 10</p>
          </Cartao>
        </div>
        <Cartao vivo>
          <p className="m-0">
            Se o oceano tem hoje <strong>{fmt(e.larg, 0)} km</strong> de largura e se abre a {fmt(total)} cm/ano, ele começou a se abrir há cerca de <strong>{fmt(tempoAbertura, 0)} milhões de anos</strong>.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Compare com a abertura do Atlântico Sul, que começou há cerca de 130 milhões de anos. O número é de ordem de grandeza: a taxa variou ao longo do tempo.</p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Meia-taxa (um lado)" valor={e.meia} onChange={(v) => atualizar({ meia: v })} min={0.5} max={5} passo={0.5} unidade="cm/ano" marcas={[0.5, 2.5, 5]} />
        <ControleDeslizante rotulo="Posição na crosta" valor={e.pos} onChange={(v) => atualizar({ pos: v })} min={-ALCANCE} max={ALCANCE} passo={50} unidade="km" marcas={[-2000, 0, 2000]} descricao="Negativo: lado esquerdo da dorsal. Positivo: lado direito." />
        <ControleDeslizante rotulo="Tempo de abertura" valor={e.ma} onChange={(v) => atualizar({ ma: v })} min={0} max={150} passo={5} unidade="Ma" marcas={[0, 75, 150]} />
        <ControleDeslizante rotulo="Largura atual do oceano" valor={e.larg} onChange={(v) => atualizar({ larg: v })} min={1000} max={7000} passo={250} unidade="km" marcas={[1000, 4000, 7000]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Troque o sinal da posição: a idade é a mesma dos dois lados da dorsal (simetria). Dobre a meia-taxa: o oceano abre duas vezes mais rápido e cada faixa fica com metade da idade.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaEncontro /> },
        { id: 'explorar', conteudo: <TelaCasos /> },
        { id: 'lab', conteudo: <TelaAssoalho /> },
      ]}
      desafios={DEFINICOES_PLACAS}
    />
  )
}
