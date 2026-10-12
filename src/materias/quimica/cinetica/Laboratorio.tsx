import { useState } from 'react'
import { Line, Plot, Point } from 'mafs'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoLink } from '@/sim/BotaoLink'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { comCatalisador, concentracao, deltaH, eaDireta, eaInversa, ehEndotermica, fracaoEfetiva, meiaVida, type OrdemInteira } from './calculo'
import { DEFINICOES_CINETICA } from './definicoes'
import { criarEstado, contar, eaEfetiva, LADO, passo, RAIO, type Estado, type Parametros } from './simulacao'
import { DiagramaEnergia } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: colisões */

const PADRAO_COL = { T: 300, ea: 5, cat: false, nA: 30, nB: 30, sem: 1 }

function Simulacao({ p, semente }: { p: Parametros; semente: number }) {
  const [sim] = useState<Estado>(() => criarEstado(p, semente))
  const [, setTique] = useState(0)
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 60, (dt) => {
    passo(sim, p, dt)
    setTique((t) => t + 1)
  })
  const nA = contar(sim, 'A')
  const nB = contar(sim, 'B')
  const nC = contar(sim, 'C')
  const eaAplicada = eaEfetiva(p)
  const esperada = fracaoEfetiva(eaAplicada, p.T)
  const observada = sim.colisoes > 0 ? sim.efetivas / sim.colisoes : 0
  const tmax = Math.max(10, Math.ceil(sim.t / 5) * 5)
  const X = (t: number) => 36 + (t / tmax) * 286
  const Y = (n: number) => 120 - (n / Math.max(1, p.nA, p.nB)) * 100
  const linha = (i: 1 | 2 | 3) => sim.serie.map((s) => `${X(s[0])},${Y(s[i])}`).join(' ')
  return (
    <div className="grid gap-3">
      <div className="cartao grid gap-2 p-3">
        <svg viewBox={`0 0 ${LADO} ${LADO}`} role="img" aria-label={`Caixa com ${nA} partículas A, ${nB} partículas B e ${nC} partículas C (produto)`} className="mx-auto block w-full max-w-sm rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface-2)]">
          {sim.particulas.map((q, i) => (
            <circle key={i} cx={q.x} cy={q.y} r={RAIO} fill={q.tipo === 'A' ? 'var(--accent)' : q.tipo === 'B' ? 'var(--quim-b)' : 'var(--quim-c)'} stroke="var(--ink)" strokeWidth={0.5} />
          ))}
        </svg>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-sm">
          <li><span aria-hidden="true" style={{ color: 'var(--accent)' }}>●</span> A: {nA}</li>
          <li><span aria-hidden="true" style={{ color: 'var(--quim-b)' }}>●</span> B: {nB}</li>
          <li><span aria-hidden="true" style={{ color: 'var(--quim-c)' }}>●</span> C (produto): {nC}</li>
          <li className="num text-[var(--ink-muted)]">t = {fmt(sim.t, 1)} s</li>
        </ul>
        <ControlesDeTempo rodando={rodando} onAlternar={() => setRodando(!rodando)} onPasso={passoUnico} velocidade={velocidade} onVelocidade={setVelocidade} />
      </div>
      <div className="cartao grid gap-2 p-3">
        <svg viewBox="0 0 340 150" role="img" aria-label="Número de partículas A, B e C em função do tempo" className="mx-auto block w-full max-w-lg">
          <line x1={36} x2={36} y1={14} y2={120} stroke="var(--ink-muted)" strokeWidth={1.5} />
          <line x1={36} x2={322} y1={120} y2={120} stroke="var(--ink-muted)" strokeWidth={1.5} />
          <polyline points={linha(1)} fill="none" stroke="var(--accent)" strokeWidth={2.6} />
          <polyline points={linha(3)} fill="none" stroke="var(--quim-c)" strokeWidth={2.6} />
          <text x={322} y={142} textAnchor="end" fontSize={11} fill="var(--ink-muted)">tempo (s)</text>
          <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">partículas</text>
          <text x={X(0) + 4} y={Y(p.nA) - 4} fontSize={11} fontWeight={700} fill="var(--accent)">A</text>
          <text x={322} y={Y(Math.max(1, nC)) - 4} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--quim-c)">C</text>
        </svg>
        <p className="num m-0 text-sm" aria-live="polite">
          Colisões A–B: {sim.colisoes} · efetivas: {sim.efetivas} ({fmt(observada * 100, 0)} %). Pela teoria, a fração com E ≥ Ea é e<sup>−Ea/RT</sup> = <strong>{fmt(esperada * 100, 1)} %</strong>.
        </p>
      </div>
    </div>
  )
}

function TelaColisoes() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_COL)
  const [rodada, setRodada] = useState(0)
  const p: Parametros = { T: e.T, ea: e.ea, nA: e.nA, nB: e.nB, catalisador: e.cat }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <Simulacao key={`${e.T}-${e.ea}-${e.cat}-${e.nA}-${e.nB}-${e.sem}-${rodada}`} p={p} semente={e.sem} />
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Temperatura" valor={e.T} onChange={(v) => atualizar({ T: v })} min={250} max={500} passo={10} unidade="K" marcas={[250, 375, 500]} />
        <ControleDeslizante rotulo="Energia de ativação" valor={e.ea} onChange={(v) => atualizar({ ea: v })} min={1} max={12} passo={0.5} unidade="kJ/mol" marcas={[1, 6, 12]} />
        <ControleDeslizante rotulo="Partículas de A" valor={e.nA} onChange={(v) => atualizar({ nA: v })} min={5} max={50} passo={5} marcas={[5, 25, 50]} />
        <ControleDeslizante rotulo="Partículas de B" valor={e.nB} onChange={(v) => atualizar({ nB: v })} min={5} max={50} passo={5} marcas={[5, 25, 50]} />
        <PainelDeVisibilidade itens={[{ id: 'cat', rotulo: 'Catalisador (barreira 40 % menor)', ativo: e.cat }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">
          A + B → C. Só a colisão com energia relativa ≥ Ea (efetiva) forma produto. Mudar um controle reinicia a simulação. Energias em escala didática (valores reais são cerca de dez vezes maiores), mas o comportamento é o mesmo.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn" onClick={() => setRodada((r) => r + 1)}>
            Recomeçar
          </button>
          <button type="button" className="btn" onClick={() => atualizar({ sem: e.sem + 1 })}>
            Outro sorteio
          </button>
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: diagrama de energia */

const PADRAO_EN = { hr: 20, hp: 50, ea: 70, red: 25 }

function TelaEnergia() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_EN)
  const hts = Math.max(e.hr + e.ea, Math.max(e.hr, e.hp) + 5)
  const d = { hr: e.hr, hts, hp: e.hp }
  const reducaoEfetiva = Math.min(e.red, hts - Math.max(e.hr, e.hp) - 2)
  const c = comCatalisador(d, reducaoEfetiva)
  const endo = ehEndotermica(d)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao p-3">
          <DiagramaEnergia d={d} reducao={reducaoEfetiva > 0 ? reducaoEfetiva : undefined} setas />
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0">
            Ea direta = {fmt(hts, 0)} − {fmt(e.hr, 0)} = <strong>{fmt(eaDireta(d), 0)} kJ</strong> · Ea inversa = {fmt(hts, 0)} − {fmt(e.hp, 0)} = <strong>{fmt(eaInversa(d), 0)} kJ</strong>
          </p>
          <p className="m-0">
            ΔH = {fmt(e.hp, 0)} − {fmt(e.hr, 0)} = <strong>{fmt(deltaH(d), 0)} kJ</strong> ({endo ? 'endotérmica: os produtos têm mais energia' : 'exotérmica: os produtos têm menos energia'}).
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Conferência: Ea direta − Ea inversa = {fmt(eaDireta(d), 0)} − {fmt(eaInversa(d), 0)} = {fmt(deltaH(d), 0)} = ΔH.</p>
          {reducaoEfetiva > 0 && (
            <p className="m-0 text-sm">
              Com catalisador: Ea direta <strong>{fmt(eaDireta(c), 0)} kJ</strong>, Ea inversa <strong>{fmt(eaInversa(c), 0)} kJ</strong>, ΔH <strong>{fmt(deltaH(c), 0)} kJ</strong> (o mesmo): o catalisador acelera os dois sentidos e não muda a energia liberada ou absorvida.
            </p>
          )}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Entalpia dos reagentes" valor={e.hr} onChange={(v) => atualizar({ hr: v })} min={0} max={60} passo={5} unidade="kJ" marcas={[0, 30, 60]} />
        <ControleDeslizante rotulo="Entalpia dos produtos" valor={e.hp} onChange={(v) => atualizar({ hp: v })} min={-40} max={100} passo={5} unidade="kJ" marcas={[-40, 30, 100]} />
        <ControleDeslizante rotulo="Energia de ativação direta" valor={e.ea} onChange={(v) => atualizar({ ea: v })} min={10} max={120} passo={5} unidade="kJ" marcas={[10, 65, 120]} />
        <ControleDeslizante rotulo="Redução pelo catalisador" valor={e.red} onChange={(v) => atualizar({ red: v })} min={0} max={60} passo={5} unidade="kJ" marcas={[0, 30, 60]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">O topo é sempre pelo menos 5 kJ acima do maior entre reagentes e produtos. Experimente deixar os produtos acima e abaixo dos reagentes.</p>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: ordem e meia-vida */

const PADRAO_DEC = { ordem: 1, k: 0.1, a0: 1, t: 10, todas: false }
const UNIDADE_K: Record<number, string> = { 0: 'mol/(L·s)', 1: 's⁻¹', 2: 'L/(mol·s)' }
const CORES: Record<number, string> = { 0: 'var(--aviso)', 1: 'var(--accent)', 2: 'var(--erro)' }

function TelaDecaimento() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_DEC)
  const ordem = (e.ordem === 0 ? 0 : e.ordem === 2 ? 2 : 1) as OrdemInteira
  const th = meiaVida(ordem, e.a0, e.k)
  const tmax = Math.max(30, Math.min(120, Math.ceil((th * 4) / 10) * 10))
  const valor = concentracao(ordem, e.a0, e.k, e.t)
  const ordens: OrdemInteira[] = e.todas ? [0, 1, 2] : [ordem]
  const formula = ordem === 0 ? '[A] = [A]₀ − k·t' : ordem === 1 ? '[A] = [A]₀·e^(−k·t)' : '1/[A] = 1/[A]₀ + k·t'
  const formulaTh = ordem === 0 ? 't½ = [A]₀ ÷ (2k)' : ordem === 1 ? 't½ = ln 2 ÷ k' : 't½ = 1 ÷ (k·[A]₀)'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Cena janela={{ xmin: -tmax * 0.06, xmax: tmax, ymin: -e.a0 * 0.08, ymax: e.a0 * 1.1 }} passoX={Math.max(5, Math.round(tmax / 6 / 5) * 5)} passoY={e.a0 / 4} rotulo="Concentração do reagente em função do tempo para a ordem escolhida" altura={280}>
          {ordens.map((o) => (
            <Plot.OfX key={o} y={(t) => concentracao(o, e.a0, e.k, t)} domain={[0, tmax]} color={CORES[o] as string} weight={o === ordem ? 3.5 : 2} />
          ))}
          <Line.Segment point1={[th, 0]} point2={[th, e.a0 / 2]} color="var(--ink-muted)" style="dashed" weight={1.5} />
          <Line.Segment point1={[0, e.a0 / 2]} point2={[th, e.a0 / 2]} color="var(--ink-muted)" style="dashed" weight={1.5} />
          <Point x={th} y={e.a0 / 2} color="var(--erro)" />
          <Point x={Math.min(e.t, tmax)} y={valor} color="var(--ink)" />
        </Cena>
        <p className="m-0 text-sm text-[var(--ink-muted)]">
          Eixo horizontal: tempo (s). Eixo vertical: [A] (mol/L). O ponto vermelho marca a meia-vida: o tempo em que [A] cai a [A]₀/2.
          {e.todas && ' Cores: ordem 0 (âmbar), ordem 1 (verde-azulado), ordem 2 (vermelho).'}
        </p>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0">
            {formula} → em t = {fmt(e.t, 0)} s, [A] = <strong>{fmt(valor, 3)} mol/L</strong>
          </p>
          <p className="m-0">
            {formulaTh} = <strong>{fmt(th, 2)} s</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {ordem === 1 ? 'Primeira ordem: a meia-vida não depende de [A]₀. Mude [A]₀ e veja que t½ fica igual.' : ordem === 0 ? 'Ordem zero: a velocidade é constante (k) e a meia-vida é proporcional a [A]₀. A reação acaba em t = [A]₀ ÷ k.' : 'Segunda ordem: a meia-vida é inversamente proporcional a [A]₀, e a curva fica mais lenta quanto menos reagente resta.'}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Ordem da reação</legend>
          {[0, 1, 2].map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="ordem-dec" checked={ordem === o} onChange={() => atualizar({ ordem: o })} style={{ accentColor: 'var(--accent)' }} />
              {o === 0 ? 'Ordem zero' : o === 1 ? 'Primeira ordem' : 'Segunda ordem'}
            </label>
          ))}
        </fieldset>
        <ControleDeslizante rotulo={`Constante k (${UNIDADE_K[ordem]})`} valor={e.k} onChange={(v) => atualizar({ k: v })} min={0.02} max={0.5} passo={0.01} marcas={[0.02, 0.26, 0.5]} />
        <ControleDeslizante rotulo="Concentração inicial [A]₀" valor={e.a0} onChange={(v) => atualizar({ a0: v })} min={0.5} max={2} passo={0.1} unidade="mol/L" marcas={[0.5, 1.25, 2]} />
        <ControleDeslizante rotulo="Tempo" valor={Math.min(e.t, tmax)} onChange={(v) => atualizar({ t: v })} min={0} max={tmax} passo={1} unidade="s" marcas={[0, Math.round(tmax / 2), tmax]} />
        <PainelDeVisibilidade itens={[{ id: 'todas', rotulo: 'Comparar as três ordens', ativo: e.todas }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaColisoes /> },
        { id: 'explorar', conteudo: <TelaEnergia /> },
        { id: 'lab', conteudo: <TelaDecaimento /> },
      ]}
      desafios={DEFINICOES_CINETICA}
    />
  )
}
