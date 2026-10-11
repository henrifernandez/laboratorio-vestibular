import { useState } from 'react'
import { Circle, Line, MovablePoint, Point, Text } from 'mafs'
import { Link2 } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { SeletorNumerico } from '@/sim/SeletorNumerico'
import { distancia, distPontoReta, eqGeralCirc, eqReduzidaCirc, fracaoTxt, pontoMedio, posicaoPontoCirc, reta, textoGeral, textoReduzida, type Pt } from './calculo'
import { DEFINICOES_GA } from './definicoes'
import { Plano, Ponto, RetaMN, TrianguloInclinacao } from './Visuais'

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const pt = (p: Pt) => `(${fmt(p.x)}, ${fmt(p.y)})`
const snap = (v: number, lim = 8) => Math.max(-lim, Math.min(lim, Math.round(v)))

function Arrastavel({ p, onMove, cor = 'var(--accent)', lim = 8 }: { p: Pt; onMove: (p: Pt) => void; cor?: string; lim?: number }) {
  return <MovablePoint point={[p.x, p.y]} color={cor} constrain={([x, y]) => [snap(x, lim), snap(y, lim)]} onMove={([x, y]) => onMove({ x, y })} />
}

// ------------------------------------------------------------------ Introdução: reta por dois pontos

function TelaIntro() {
  const [a, setA] = useState<Pt>({ x: -2, y: -1 })
  const [b, setB] = useState<Pt>({ x: 2, y: 3 })
  const coincide = a.x === b.x && a.y === b.y
  const r = coincide ? null : reta(a, b)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-2">
        <Plano rotulo="Reta que passa por dois pontos arrastáveis, A e B">
          {r && !r.vertical && <RetaMN m={r.m as number} n={r.n as number} />}
          {r?.vertical && <Line.ThroughPoints point1={[a.x, a.y]} point2={[b.x, b.y]} color="var(--accent)" weight={3} />}
          {r && !r.vertical && <TrianguloInclinacao a={a} b={b} />}
          <Arrastavel p={a} onMove={setA} />
          <Arrastavel p={b} onMove={setB} />
          <Text x={a.x} y={a.y} attach="nw" attachDistance={12} size={14}>A</Text>
          <Text x={b.x} y={b.y} attach="se" attachDistance={12} size={14}>B</Text>
        </Plano>
        <p className="text-sm text-[var(--ink-muted)]">Arraste A e B. A reta e a equação mudam juntas.</p>
      </div>
      <div className="grid content-start gap-4">
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>A {pt(a)} · B {pt(b)}</p>
          {coincide && <p>Os pontos coincidem: separe-os para definir uma reta.</p>}
          {r && !r.vertical && (
            <>
              <p>
                Coeficiente angular: m = Δy/Δx = {fmt(b.y - a.y)}/{fmt(b.x - a.x)} = <strong>{fracaoTxt(r.m as number)}</strong>
              </p>
              <p>
                Reduzida: <strong>{textoReduzida(r.m as number, r.n as number)}</strong>
              </p>
            </>
          )}
          {r?.vertical && <p>Reta vertical: <strong>x = {a.x}</strong> (sem coeficiente angular)</p>}
          {r && (
            <p>
              Geral: <strong>{textoGeral(r.geral)}</strong>
            </p>
          )}
        </div>
        <BotaoReiniciar
          onClick={() => {
            setA({ x: -2, y: -1 })
            setB({ x: 2, y: 3 })
          }}
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar: ferramentas

const PADRAO = { ax: -3, ay: 0, bx: 3, by: 4, px: 4, py: -2, mid: true, dist: true, perp: true, eixos: true }

function TelaExplorar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO)
  const [copiado, setCopiado] = useState(false)
  const a = { x: e.ax, y: e.ay }
  const b = { x: e.bx, y: e.by }
  const p = { x: e.px, y: e.py }
  const coincide = a.x === b.x && a.y === b.y
  const r = coincide ? null : reta(a, b)
  const m = pontoMedio(a, b)
  const dAB = distancia(a, b)
  const dPR = r ? distPontoReta(p, r.geral) : null

  // pé da perpendicular de P à reta
  const pe = r ? (() => {
    const { a: A, b: B, c: C } = r.geral
    const t = (A * p.x + B * p.y + C) / (A * A + B * B)
    return { x: p.x - A * t, y: p.y - B * t }
  })() : null

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }
  const interceptoX = r && !r.vertical && (r.m as number) !== 0 ? -(r.n as number) / (r.m as number) : null

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-2">
        <Plano rotulo="Reta por A e B, com ponto médio, distância e o ponto P">
          {r && !r.vertical && <RetaMN m={r.m as number} n={r.n as number} />}
          {r?.vertical && <Line.ThroughPoints point1={[a.x, a.y]} point2={[b.x, b.y]} color="var(--accent)" weight={3} />}
          {e.dist && <Line.Segment point1={[a.x, a.y]} point2={[b.x, b.y]} color="var(--ink)" weight={2} opacity={0.5} />}
          {e.mid && !coincide && <Ponto p={m} rotulo="M" cor="var(--ok)" pos="nw" />}
          {e.perp && pe && <Line.Segment point1={[p.x, p.y]} point2={[pe.x, pe.y]} color="var(--aviso)" style="dashed" weight={2.5} />}
          {e.eixos && r && !r.vertical && r.n !== undefined && <Ponto p={{ x: 0, y: r.n }} cor="var(--ink)" rotulo={`(0, ${fmt(r.n)})`} pos="ne" />}
          {e.eixos && interceptoX !== null && <Ponto p={{ x: interceptoX, y: 0 }} cor="var(--ink)" rotulo={`(${fmt(interceptoX)}, 0)`} pos="sw" />}
          <Arrastavel p={a} onMove={(q) => atualizar({ ax: q.x, ay: q.y })} />
          <Arrastavel p={b} onMove={(q) => atualizar({ bx: q.x, by: q.y })} />
          <Arrastavel p={p} onMove={(q) => atualizar({ px: q.x, py: q.y })} cor="var(--aviso)" />
          <Text x={a.x} y={a.y} attach="nw" attachDistance={12} size={14}>A</Text>
          <Text x={b.x} y={b.y} attach="se" attachDistance={12} size={14}>B</Text>
          <Text x={p.x} y={p.y} attach="ne" attachDistance={12} size={14} color="var(--aviso)">P</Text>
        </Plano>
        <p className="text-sm text-[var(--ink-muted)]">Arraste A, B e P (laranja). O segmento tracejado é a perpendicular de P até a reta.</p>
      </div>
      <div className="grid content-start gap-4">
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          {coincide ? (
            <p>Os pontos A e B coincidem.</p>
          ) : (
            <>
              <p>Reta AB: <strong>{r && !r.vertical ? textoReduzida(r.m as number, r.n as number) : `x = ${a.x}`}</strong></p>
              <p>Geral: <strong>{r ? textoGeral(r.geral) : ''}</strong></p>
              {e.dist && <p>Distância AB: <strong>{fmt(dAB)}</strong></p>}
              {e.mid && <p>Ponto médio M: <strong>{pt(m)}</strong></p>}
              {e.perp && dPR !== null && <p style={{ color: 'var(--aviso)' }}>Distância de P à reta: <strong>{fmt(dPR)}</strong></p>}
              {e.perp && r && <p className="text-sm text-[var(--ink-muted)]">d = |a·x₀ + b·y₀ + c| ÷ √(a² + b²) = |{fmt(r.geral.a * p.x + r.geral.b * p.y + r.geral.c)}| ÷ {fmt(Math.hypot(r.geral.a, r.geral.b))}</p>}
            </>
          )}
        </div>
        <PainelDeVisibilidade
          itens={[
            { id: 'mid', rotulo: 'Ponto médio', ativo: e.mid },
            { id: 'dist', rotulo: 'Distância AB', ativo: e.dist },
            { id: 'perp', rotulo: 'Perpendicular de P', ativo: e.perp },
            { id: 'eixos', rotulo: 'Cortes nos eixos', ativo: e.eixos },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
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

// ------------------------------------------------------------------ Laboratório: circunferência

function TelaCirculo() {
  const [c, setC] = useState<Pt>({ x: 1, y: -1 })
  const [borda, setBorda] = useState<Pt>({ x: 4, y: -1 })
  const [t, setT] = useState<Pt>({ x: 2, y: 2 })
  const r = distancia(c, borda)
  const inteiro = Math.abs(r - Math.round(r)) < 1e-9
  const pos = posicaoPontoCirc(t, c, r)
  const nomePos = { dentro: 'dentro (interior)', sobre: 'sobre a circunferência', fora: 'fora (exterior)' }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-2">
        <Plano rotulo="Circunferência: arraste o centro, o ponto da borda e o ponto de teste">
          {r > 0 && <Circle center={[c.x, c.y]} radius={r} color="var(--accent)" fillOpacity={0.08} weight={3} />}
          <Line.Segment point1={[c.x, c.y]} point2={[borda.x, borda.y]} color="var(--ink)" style="dashed" weight={2} />
          <Arrastavel p={c} onMove={setC} />
          <Arrastavel p={borda} onMove={setBorda} cor="var(--ink-muted)" />
          <Arrastavel p={t} onMove={setT} cor={pos === 'dentro' ? 'var(--ok)' : pos === 'sobre' ? 'var(--aviso)' : 'var(--erro)'} />
          <Point x={c.x} y={c.y} color="var(--accent)" />
          <Text x={c.x} y={c.y} attach="nw" attachDistance={12} size={14}>C</Text>
          <Text x={t.x} y={t.y} attach="ne" attachDistance={12} size={14}>T</Text>
        </Plano>
        <p className="text-sm text-[var(--ink-muted)]">Azul: centro. Cinza: ponto da borda (define o raio). T: ponto de teste.</p>
      </div>
      <div className="grid content-start gap-4">
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>Centro: <strong>{pt(c)}</strong> · Raio: <strong>{fmt(r)}</strong>{!inteiro && r > 0 && ' (raiz não exata)'}</p>
          {r > 0 && inteiro && (
            <>
              <p>Reduzida: <strong>{eqReduzidaCirc(c.x, c.y, r)}</strong></p>
              <p>Geral: <strong>{eqGeralCirc(c.x, c.y, r)}</strong></p>
            </>
          )}
          {r > 0 && !inteiro && (
            <p>
              Reduzida: <strong>(x {c.x < 0 ? '+' : '−'} {Math.abs(c.x)})² + (y {c.y < 0 ? '+' : '−'} {Math.abs(c.y)})² = {fmt(r * r)}</strong>
            </p>
          )}
          <p>Diâmetro: {fmt(2 * r)} · Perímetro: {fmt(2 * Math.PI * r)} · Área: {fmt(Math.PI * r * r)}</p>
          <p style={{ color: pos === 'dentro' ? 'var(--ok)' : pos === 'sobre' ? 'var(--aviso)' : 'var(--erro)' }}>
            T {pt(t)} está <strong>{nomePos[pos]}</strong>: d(C, T) = {fmt(distancia(c, t))} {pos === 'dentro' ? '<' : pos === 'sobre' ? '=' : '>'} r = {fmt(r)}
          </p>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Raio (horizontal)</span>
            <SeletorNumerico rotulo="raio" valor={Math.max(0, borda.x - c.x)} min={0} max={8} onChange={(v) => setBorda({ x: c.x + v, y: c.y })} />
          </div>
        </div>
        <BotaoReiniciar
          onClick={() => {
            setC({ x: 1, y: -1 })
            setBorda({ x: 4, y: -1 })
            setT({ x: 2, y: 2 })
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
        { id: 'intro', conteudo: <TelaIntro /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaCirculo /> },
      ]}
      desafios={DEFINICOES_GA}
    />
  )
}
