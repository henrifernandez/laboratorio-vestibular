import { useEffect, useRef, useState } from 'react'
import { Line, MovablePoint, Plot, Point, Polyline, Text, Vector } from 'mafs'
import { Link2 } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { SeletorNumerico } from '@/sim/SeletorNumerico'
import { G, alcance, alturaEmX, alturaMaxima, lancamento, posicao, tempoDeVoo, velocidade } from './calculo'
import { DEFINICOES_CINEMATICA, degraus, xEm } from './definicoes'
import { MiniGrafico, Pista, TresGraficos } from './Visuais'

const fmt = (n: number, c = 2) => String(Math.round(n * 10 ** c) / 10 ** c).replace('.', ',')

// ------------------------------------------------------------------ Introdução: MRU / MRUV

const PADRAO_MRUV = { x0: 1, v0: 2, a: 0.5, t: 0 }
const T_MAX = 8

function TelaMovimento() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MRUV)
  const tRef = useRef(e.t)
  const atualizarRef = useRef(atualizar)
  const pararRef = useRef<(v: boolean) => void>(() => {})
  const { rodando, setRodando, velocidade: vel, setVelocidade, passoUnico } = useLaco(1 / 60, (dt) => {
    tRef.current = Math.min(T_MAX, tRef.current + dt)
    atualizarRef.current({ t: Math.round(tRef.current * 100) / 100 })
    if (tRef.current >= T_MAX) pararRef.current(false)
  })
  useEffect(() => {
    atualizarRef.current = atualizar
    pararRef.current = setRodando
    tRef.current = e.t
  })

  const mov = { x0: e.x0, v0: e.v0, a: e.a }
  const x = posicao(mov, e.t)
  const v = velocidade(mov, e.t)
  const alternar = () => {
    if (!rodando && e.t >= T_MAX) {
      tRef.current = 0
      atualizar({ t: 0 })
    }
    setRodando(!rodando)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Pista x={x} />
        <TresGraficos inicio={{ x0: e.x0, v0: e.v0 }} trechos={[{ dur: T_MAX, a: e.a }]} marcador={e.t} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            t = <strong>{fmt(e.t)} s</strong> · x = <strong>{fmt(x)} m</strong> · v = <strong>{fmt(v)} m/s</strong> · a = <strong>{fmt(e.a)} m/s²</strong>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">x = x₀ + v₀·t + a·t²/2 = {fmt(e.x0)} + {fmt(e.v0)}·{fmt(e.t)} + {fmt(e.a)}·{fmt(e.t)}²/2 = {fmt(x)}</p>
          {(Math.abs(v) < 1e-9) && <p className="text-sm text-[var(--ink-muted)]">v = 0: o carrinho para neste instante.</p>}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Posição inicial (x₀)" valor={e.x0} onChange={(val) => atualizar({ x0: val })} min={0} max={10} passo={0.5} unidade="m" marcas={[0, 5, 10]} />
        <ControleDeslizante rotulo="Velocidade inicial (v₀)" valor={e.v0} onChange={(val) => atualizar({ v0: val })} min={-5} max={8} passo={0.5} unidade="m/s" marcas={[-5, 0, 8]} />
        <ControleDeslizante rotulo="Aceleração (a)" valor={e.a} onChange={(val) => atualizar({ a: val })} min={-4} max={4} passo={0.5} unidade="m/s²" marcas={[-4, 0, 4]} />
        <ControleDeslizante rotulo="Instante (t)" valor={e.t} onChange={(val) => atualizar({ t: val })} min={0} max={T_MAX} passo={0.05} unidade="s" marcas={[0, 4, 8]} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Passar o tempo</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={alternar}
            onPasso={() => {
              tRef.current = Math.min(T_MAX, tRef.current + 0.25)
              atualizar({ t: tRef.current })
              passoUnico()
            }}
            velocidade={vel}
            onVelocidade={setVelocidade}
          />
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              setRodando(false)
              reiniciar()
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar: lançamento oblíquo

const PADRAO_LANC = { v0: 20, ang: 45, t: 0, vet: true, rastro: true, comp: true }
const ESCALA = 1 // 1 m de tela para cada 1 m/s

function TelaLancamento() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LANC)
  const [copiado, setCopiado] = useState(false)
  const T = tempoDeVoo(e.v0, e.ang)
  const R = alcance(e.v0, e.ang)
  const H = alturaMaxima(e.v0, e.ang)
  const l = lancamento(e.v0, e.ang)
  const tRef = useRef(e.t)
  const atualizarRef = useRef(atualizar)
  const TRef = useRef(T)
  const pararRef = useRef<(v: boolean) => void>(() => {})
  const { rodando, setRodando, velocidade: vel, setVelocidade, passoUnico } = useLaco(1 / 60, (dt) => {
    tRef.current = Math.min(TRef.current, tRef.current + dt)
    atualizarRef.current({ t: Math.round(tRef.current * 100) / 100 })
    if (tRef.current >= TRef.current) pararRef.current(false)
  })
  useEffect(() => {
    atualizarRef.current = atualizar
    pararRef.current = setRodando
    tRef.current = e.t
    TRef.current = T
  })

  const t = Math.min(e.t, T)
  const xmax = Math.max(60, Math.ceil((R * 1.15) / 10) * 10)
  const ymax = Math.max(20, Math.ceil((H * 1.5) / 5) * 5)
  const bola = { x: l.x(t), y: Math.max(0, l.y(t)) }
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }
  const alternar = () => {
    if (!rodando && e.t >= T) {
      tRef.current = 0
      atualizar({ t: 0 })
    }
    setRodando(!rodando)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-2">
        <Cena janela={{ xmin: -xmax * 0.04, xmax: xmax * 1.02, ymin: -ymax * 0.08, ymax }} passoX={xmax / 8} passoY={ymax / 4} rotulo="Lançamento oblíquo: arraste a ponta da seta para mudar a velocidade e o ângulo">
          {e.rastro && <Plot.OfX y={(x) => alturaEmX(e.v0, e.ang, x)} domain={[0, R]} color="var(--accent)" weight={3} style="dashed" />}
          <Line.Segment point1={[R, -0.01]} point2={[R, 0]} color="var(--ink)" />
          <Point x={R} y={0} color="var(--ink)" />
          <Text x={R} y={0} attach="s" attachDistance={12} size={12}>{`R = ${fmt(R, 1)} m`}</Text>
          <Point x={R / 2} y={H} color="var(--ok)" />
          <Text x={R / 2} y={H} attach="n" attachDistance={10} size={12} color="var(--ok)">{`H = ${fmt(H, 1)} m`}</Text>
          <Point x={bola.x} y={bola.y} color="var(--accent)" />
          {e.vet && (
            <>
              {e.comp && <Vector tail={[bola.x, bola.y]} tip={[bola.x + l.vx * 0.6, bola.y]} color="var(--ok)" weight={3} />}
              {e.comp && <Vector tail={[bola.x, bola.y]} tip={[bola.x, bola.y + l.vyEm(t) * 0.6]} color="var(--aviso)" weight={3} />}
              <Vector tail={[bola.x, bola.y]} tip={[bola.x + l.vx * 0.6, bola.y + l.vyEm(t) * 0.6]} color="var(--erro)" weight={2.5} />
            </>
          )}
          {/* seta de lançamento (arrastável): a ponta define v₀ e θ */}
          <Vector tail={[0, 0]} tip={[l.vx * ESCALA, l.vy * ESCALA]} color="var(--ink)" weight={3} />
          <MovablePoint
            point={[l.vx * ESCALA, l.vy * ESCALA]}
            color="var(--erro)"
            constrain={([x, y]) => {
              const v0 = Math.min(40, Math.max(5, Math.round(Math.hypot(x, y) / ESCALA * 2) / 2))
              const ang = Math.min(85, Math.max(5, Math.round((Math.atan2(y, x) * 180) / Math.PI)))
              return [v0 * Math.cos((ang * Math.PI) / 180) * ESCALA, v0 * Math.sin((ang * Math.PI) / 180) * ESCALA]
            }}
            onMove={([x, y]) => {
              const v0 = Math.min(40, Math.max(5, Math.round(Math.hypot(x, y) / ESCALA * 2) / 2))
              const ang = Math.min(85, Math.max(5, Math.round((Math.atan2(y, x) * 180) / Math.PI)))
              atualizar({ v0, ang, t: 0 })
            }}
          />
        </Cena>
        <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
          <span><span aria-hidden="true" style={{ color: 'var(--ok)' }}>━</span> v horizontal (constante)</span>
          <span><span aria-hidden="true" style={{ color: 'var(--aviso)' }}>━</span> v vertical (muda)</span>
          <span><span aria-hidden="true" style={{ color: 'var(--erro)' }}>━</span> v total</span>
        </p>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Velocidade inicial (v₀)" valor={e.v0} onChange={(v) => atualizar({ v0: v, t: 0 })} min={5} max={40} passo={0.5} unidade="m/s" marcas={[5, 20, 40]} />
        <ControleDeslizante rotulo="Ângulo (θ)" valor={e.ang} onChange={(a) => atualizar({ ang: a, t: 0 })} min={5} max={85} passo={1} unidade="°" marcas={[5, 45, 85]} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>Tempo de voo: <strong>{fmt(T)} s</strong> · Alcance: <strong>{fmt(R)} m</strong> · Altura máxima: <strong>{fmt(H)} m</strong></p>
          <p className="text-sm text-[var(--ink-muted)]">Em t = {fmt(t)} s: v<sub>x</sub> = {fmt(l.vx)} m/s · v<sub>y</sub> = {fmt(l.vyEm(t))} m/s</p>
          <p className="text-sm text-[var(--ink-muted)]">g = {G} m/s², sem resistência do ar. Experimente 30° e 60°: mesmo alcance!</p>
        </div>
        <ControleDeslizante rotulo="Instante (t)" valor={t} onChange={(v) => atualizar({ t: v })} min={0} max={Math.max(0.1, Math.round(T * 100) / 100)} passo={0.05} unidade="s" marcas={[0, Math.round(T * 10) / 10]} />
        <PainelDeVisibilidade
          itens={[
            { id: 'vet', rotulo: 'Vetores', ativo: e.vet },
            { id: 'comp', rotulo: 'Componentes', ativo: e.comp },
            { id: 'rastro', rotulo: 'Trajetória', ativo: e.rastro },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Lançar</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={alternar}
            onPasso={() => {
              tRef.current = Math.min(T, tRef.current + 0.1)
              atualizar({ t: tRef.current })
              passoUnico()
            }}
            velocidade={vel}
            onVelocidade={setVelocidade}
          />
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              setRodando(false)
              reiniciar()
            }}
          />
          <button type="button" className="btn" onClick={copiar}>
            <Link2 size={18} aria-hidden="true" />
            Copiar link
          </button>
          <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">{copiado && 'Link copiado.'}</span>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Laboratório: desenhe o movimento

const T_LIVRE = 8

function TelaDesenhoLivre() {
  const [pontos, setPontos] = useState<number[]>(() => Array(T_LIVRE + 1).fill(5))
  const [t, setT] = useState(0)
  const tRef = useRef(0)
  const pararRef = useRef<(v: boolean) => void>(() => {})
  const { rodando, setRodando, velocidade: vel, setVelocidade, passoUnico } = useLaco(1 / 60, (dt) => {
    tRef.current = Math.min(T_LIVRE, tRef.current + dt)
    setT(tRef.current)
    if (tRef.current >= T_LIVRE) pararRef.current(false)
  })
  useEffect(() => {
    pararRef.current = setRodando
  })
  const mover = (k: number, y: number) => setPontos((p) => p.map((v, i) => (i === k ? y : v)))
  const x = xEm(pontos, t)
  const k = Math.min(Math.floor(t), T_LIVRE - 1)
  const vAtual = (pontos[k + 1] as number) - (pontos[k] as number)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Pista x={x} />
        <Cena janela={{ xmin: -0.6, xmax: T_LIVRE + 0.6, ymin: -1, ymax: 11 }} passoX={1} passoY={2} rotulo="Gráfico da posição: arraste os pontos para desenhar o movimento">
          <Polyline points={pontos.map((v, i) => [i, v] as [number, number])} color="var(--accent)" weight={3.5} svgPolylineProps={{ fill: 'none' }} />
          <Line.Segment point1={[t, -1]} point2={[t, 11]} color="var(--erro)" style="dashed" weight={1.5} />
          {pontos.map((v, i) => (
            <MovablePoint key={i} point={[i, v]} color="var(--accent)" constrain={([, y]) => [i, Math.max(0, Math.min(10, Math.round(y * 2) / 2))]} onMove={([, y]) => mover(i, y)} />
          ))}
        </Cena>
        <p className="text-sm text-[var(--ink-muted)]">Arraste os pontos e aperte “Iniciar”: o carrinho percorre exatamente o que você desenhou.</p>
      </div>
      <div className="grid content-start gap-4">
        <MiniGrafico y={degraus(pontos)} T={T_LIVRE} rotuloY="v (m/s)" limite={4} cor="var(--ok)" altura={140} rotulo="Velocidade calculada a partir do seu gráfico" marcador={t} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            t = <strong>{fmt(t)} s</strong> · x = <strong>{fmt(x)} m</strong> · v = <strong>{fmt(vAtual)} m/s</strong>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">{vAtual > 0 ? 'Indo para a direita (v > 0).' : vAtual < 0 ? 'Voltando (v < 0).' : 'Parado (v = 0).'}</p>
        </div>
        <ControleDeslizante rotulo="Instante (t)" valor={t} onChange={(v) => { tRef.current = v; setT(v) }} min={0} max={T_LIVRE} passo={0.05} unidade="s" marcas={[0, 4, 8]} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Rodar o movimento</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={() => {
              if (!rodando && t >= T_LIVRE) {
                tRef.current = 0
                setT(0)
              }
              setRodando(!rodando)
            }}
            onPasso={() => {
              tRef.current = Math.min(T_LIVRE, tRef.current + 0.5)
              setT(tRef.current)
              passoUnico()
            }}
            velocidade={vel}
            onVelocidade={setVelocidade}
          />
        </fieldset>
        <details>
          <summary className="min-h-11 cursor-pointer py-2 font-semibold">Ajustar com botões (teclado)</summary>
          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            {pontos.map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="num">t = {i} s</span>
                <SeletorNumerico rotulo={`posição em t = ${i} s`} valor={v} min={0} max={10} passo={0.5} onChange={(n) => mover(i, n)} />
              </div>
            ))}
          </div>
        </details>
        <BotaoReiniciar
          onClick={() => {
            setRodando(false)
            setPontos(Array(T_LIVRE + 1).fill(5))
            tRef.current = 0
            setT(0)
          }}
        />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaMovimento /> },
        { id: 'explorar', conteudo: <TelaLancamento /> },
        { id: 'lab', conteudo: <TelaDesenhoLivre /> },
      ]}
      desafios={DEFINICOES_CINEMATICA}
    />
  )
}
