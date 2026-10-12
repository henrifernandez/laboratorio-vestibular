import { useState } from 'react'
import { espalhar } from '@/lib/rotulos'
import { Alternador } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useAnimacao } from '@/sim/useAnimacao'
import { K1, T_MAX, equilibrioAB, estadoAB, particulasB, tempoAteEquilibrio } from './dinamico'

type Inicio = 'reagente' | 'produto'

const f = (n: number, c = 2) =>
  n.toLocaleString('pt-BR', {
    minimumFractionDigits: c,
    maximumFractionDigits: c,
  })

const COR_A = 'var(--accent)'
const COR_B = 'var(--quim-b)'
const TRACO_B = '7 4'

/* geometria do gráfico (unidades do SVG) */
const W = 360
const X0 = 44
const X1 = 262
const C_TOPO = 34
const C_BASE = 138
const V_TOPO = 180
const V_BASE = 262
const H = 300
const V_MAX = K1

const X = (t: number) => X0 + (t / T_MAX) * (X1 - X0)
const YC = (c: number) => C_BASE - c * (C_BASE - C_TOPO)
const YV = (v: number) => V_BASE - (v / V_MAX) * (V_BASE - V_TOPO)

function caminho(fn: (t: number) => number, y: (v: number) => number, ate = T_MAX) {
  const n = 80
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (i / n) * ate
    return `${i === 0 ? 'M' : 'L'}${X(t).toFixed(1)} ${y(fn(t)).toFixed(1)}`
  }).join(' ')
}

/** Dois gráficos com o mesmo eixo de tempo: concentrações em cima e velocidades embaixo. O cursor marca o instante t. */
export function GraficoEquilibrio({ t, inicio = 'reagente' }: { t?: number; inicio?: Inicio }) {
  const tEq = tempoAteEquilibrio(0.01)
  const eq = equilibrioAB()
  const e = (s: number) => estadoAB(s, inicio)
  const vEq = K1 * eq.a
  // rótulos do fim das curvas de concentração, sem se encostar
  const [yB, yA] = espalhar(
    [
      { alvo: YC(eq.b), tamanho: 14 },
      { alvo: YC(eq.a), tamanho: 14 },
    ],
    C_TOPO,
    C_BASE + 8,
    2,
  ) as [number, number]
  const atual = t === undefined ? null : e(t)
  const aria = `Dois gráficos com o mesmo eixo de tempo, começando só com ${inicio === 'reagente' ? 'reagente A' : 'produto B'}. Em cima, as concentrações: ${inicio === 'reagente' ? '[A] cai de 1 e [B] sobe de 0' : '[B] cai de 1 e [A] sobe de 0'} até ficarem constantes, a partir de cerca de ${f(tEq, 1)} s, em [A] = ${f(eq.a)} e [B] = ${f(eq.b)} mol/L, valores diferentes. Embaixo, as velocidades: ${inicio === 'reagente' ? 'a direta começa alta e cai, a inversa começa em zero e sobe' : 'a inversa começa alta e cai, a direta começa em zero e sobe'}, e as duas se encontram em ${f(vEq)} mol/(L·s) no equilíbrio.${atual ? ` No instante ${f(t as number, 1)} s: [A] = ${f(atual.a)}, [B] = ${f(atual.b)}, v direta = ${f(atual.vDireta)}, v inversa = ${f(atual.vInversa)}.` : ''}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full">
      {/* faixa do equilíbrio, atravessando os dois gráficos */}
      <rect x={X(tEq)} y={C_TOPO - 8} width={X1 - X(tEq)} height={V_BASE - C_TOPO + 8} fill={COR_A} opacity={0.08} />
      <line x1={X(tEq)} x2={X(tEq)} y1={C_TOPO - 8} y2={V_BASE} stroke="var(--ink-muted)" strokeDasharray="4 3" strokeWidth={1.2} />
      <text x={(X(tEq) + X1) / 2} y={C_TOPO + 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">
        equilíbrio
      </text>

      {/* títulos dos gráficos */}
      <text x={4} y={18} fontSize={11} fontWeight={600} fill="var(--ink-muted)">
        concentração (mol/L)
      </text>
      <text x={4} y={V_TOPO - 14} fontSize={11} fontWeight={600} fill="var(--ink-muted)">
        velocidade (mol/L·s)
      </text>

      {/* eixos */}
      {[0, 0.5, 1].map((c) => (
        <g key={c}>
          <line x1={X0} x2={X1} y1={YC(c)} y2={YC(c)} stroke="var(--grade)" strokeWidth={1} />
          <text x={X0 - 5} y={YC(c) + 4} textAnchor="end" fontSize={11} fill="var(--ink-muted)" className="num">
            {f(c, c === 0.5 ? 1 : 0)}
          </text>
        </g>
      ))}
      <line x1={X0} x2={X0} y1={C_TOPO - 4} y2={C_BASE} stroke="var(--ink-muted)" strokeWidth={1.4} />
      <line x1={X0} x2={X1} y1={C_BASE} y2={C_BASE} stroke="var(--ink-muted)" strokeWidth={1.4} />
      <line x1={X0} x2={X0} y1={V_TOPO - 4} y2={V_BASE} stroke="var(--ink-muted)" strokeWidth={1.4} />
      <line x1={X0} x2={X1} y1={V_BASE} y2={V_BASE} stroke="var(--ink-muted)" strokeWidth={1.4} />
      {[0, 1, 2, 3, 4].map((s) => (
        <g key={s}>
          <line x1={X(s)} x2={X(s)} y1={V_BASE} y2={V_BASE + 4} stroke="var(--ink-muted)" />
          <text x={X(s)} y={V_BASE + 16} textAnchor="middle" fontSize={11} fill="var(--ink-muted)" className="num">
            {s}
          </text>
        </g>
      ))}
      <text x={X1} y={V_BASE + 32} textAnchor="end" fontSize={11} fill="var(--ink-muted)">
        tempo (s)
      </text>

      {/* curvas de concentração */}
      <path d={caminho((s) => e(s).a, YC)} fill="none" stroke={COR_A} strokeWidth={3} strokeLinecap="round" />
      <path d={caminho((s) => e(s).b, YC)} fill="none" stroke={COR_B} strokeWidth={3} strokeDasharray={TRACO_B} strokeLinecap="round" />
      <text x={X1 + 6} y={yB + 4} fontSize={11.5} fontWeight={700} fill={COR_B}>
        [B] produto
      </text>
      <text x={X1 + 6} y={yA + 4} fontSize={11.5} fontWeight={700} fill={COR_A}>
        [A] reagente
      </text>

      {/* curvas de velocidade */}
      <path d={caminho((s) => e(s).vDireta, YV)} fill="none" stroke={COR_A} strokeWidth={3} strokeLinecap="round" />
      <path d={caminho((s) => e(s).vInversa, YV)} fill="none" stroke={COR_B} strokeWidth={3} strokeDasharray={TRACO_B} strokeLinecap="round" />
      <text x={X1 + 6} y={YV(vEq) - 3} fontSize={11.5} fontWeight={700} fill="var(--ink)">
        v direta =
      </text>
      <text x={X1 + 6} y={YV(vEq) + 11} fontSize={11.5} fontWeight={700} fill="var(--ink)">
        v inversa
      </text>

      {/* cursor */}
      {atual && t !== undefined && (
        <g>
          <line x1={X(t)} x2={X(t)} y1={C_TOPO - 8} y2={C_BASE} stroke="var(--ink)" strokeWidth={1.6} />
          <line x1={X(t)} x2={X(t)} y1={V_TOPO - 4} y2={V_BASE} stroke="var(--ink)" strokeWidth={1.6} />
          {[
            [YC(atual.a), COR_A],
            [YC(atual.b), COR_B],
            [YV(atual.vDireta), COR_A],
            [YV(atual.vInversa), COR_B],
          ].map(([y, cor], i) => (
            <circle key={i} cx={X(t)} cy={y as number} r={5} fill={cor as string} stroke="var(--surface)" strokeWidth={2} />
          ))}
        </g>
      )}
    </svg>
  )
}

/** Posição fixa de cada partícula na caixa (grade com pequeno deslocamento, sempre igual). */
function posicoes(n: number, larg: number, alt: number) {
  const cols = 6
  const linhas = Math.ceil(n / cols)
  return Array.from({ length: n }, (_, i) => {
    const c = i % cols
    const l = Math.floor(i / cols)
    const jx = Math.sin(i * 12.9898) * 4
    const jy = Math.cos(i * 78.233) * 4
    return {
      x: ((c + 0.5) / cols) * larg + jx,
      y: ((l + 0.5) / linhas) * alt + jy,
    }
  })
}

const N = 30

/** Recipiente com 30 partículas: círculos são A, quadrados são B. Os contornos destacam as que acabaram de reagir. */
export function CaixaParticulas({ t, inicio = 'reagente' }: { t: number; inicio?: Inicio }) {
  const larg = 168
  const alt = 128
  const pos = posicoes(N, larg - 12, alt - 12)
  const bAgora = particulasB(t, N, inicio)
  const bAntes = particulasB(Math.max(0, t - 1 / 6), N, inicio)
  const nb = bAgora.size
  return (
    <svg viewBox={`0 0 ${larg} ${alt + 26}`} role="img" aria-label={`Recipiente com ${N} partículas: ${N - nb} de A e ${nb} de B.`} className="mx-auto block h-auto w-full max-w-[13rem]">
      <rect x={1} y={1} width={larg - 2} height={alt} rx={10} fill="var(--surface)" stroke="var(--line-strong)" strokeWidth={2} />
      {pos.map((p, i) => {
        const ehB = bAgora.has(i)
        const mudou = ehB !== bAntes.has(i) && t > 0
        const x = p.x + 6
        const y = p.y + 6
        return (
          <g key={i}>
            {mudou && <circle cx={x} cy={y} r={11} fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeDasharray="2 2" />}
            {ehB ? <rect x={x - 6} y={y - 6} width={12} height={12} rx={2.5} fill={COR_B} /> : <circle cx={x} cy={y} r={6.5} fill={COR_A} />}
          </g>
        )
      })}
      <text x={larg / 2} y={alt + 19} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)" className="num">
        A: {N - nb} · B: {nb}
      </text>
    </svg>
  )
}

/** Versão interativa: arraste o tempo ou aperte o play; veja os gráficos e as partículas juntos. */
export function EquilibrioDinamico() {
  const [t, setT] = useState(0.6)
  const [inicio, setInicio] = useState<Inicio>('reagente')
  const anim = useAnimacao(t, T_MAX, setT, 0.8)
  const e = estadoAB(t, inicio)
  const tEq = tempoAteEquilibrio(0.01)
  const noEq = t >= tEq
  return (
    <div className="@container grid gap-3">
      <div className="grid gap-1">
        <GraficoEquilibrio t={t} inicio={inicio} />
        <p className="m-0 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
          <span>
            <svg aria-hidden="true" width="26" height="8" className="mr-1 inline-block align-middle">
              <line x1="1" x2="25" y1="4" y2="4" stroke={COR_A} strokeWidth="3" strokeLinecap="round" />
            </svg>
            [A] e v direta (A → B)
          </span>
          <span>
            <svg aria-hidden="true" width="26" height="8" className="mr-1 inline-block align-middle">
              <line x1="1" x2="25" y1="4" y2="4" stroke={COR_B} strokeWidth="3" strokeDasharray={TRACO_B} />
            </svg>
            [B] e v inversa (B → A)
          </span>
        </p>
      </div>
      <div className="grid items-center gap-3 @md:grid-cols-[12rem_1fr]">
        <div className="grid gap-1">
          <CaixaParticulas t={t} inicio={inicio} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">
            <span aria-hidden="true" style={{ color: COR_A }}>
              ●
            </span>{' '}
            A ·{' '}
            <span aria-hidden="true" style={{ color: COR_B }}>
              ■
            </span>{' '}
            B · contorno: acabou de reagir
          </p>
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0">
            t = <strong>{f(t, 1)} s</strong> · [A] = <strong>{f(e.a)}</strong> · [B] = <strong>{f(e.b)}</strong> mol/L
          </p>
          <p className="m-0">
            v direta (A → B) = <strong style={{ color: COR_A }}>{f(e.vDireta)}</strong> · v inversa (B → A) = <strong style={{ color: COR_B }}>{f(e.vInversa)}</strong> mol/(L·s)
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {noEq
              ? 'Equilíbrio: as duas velocidades são iguais, então a cada instante tanto A vira B quanto B vira A. As partículas continuam trocando, mas as contagens não mudam.'
              : inicio === 'reagente'
                ? 'Ainda não há equilíbrio: a reação direta é mais rápida que a inversa, então [A] cai e [B] sobe.'
                : 'Ainda não há equilíbrio: a reação inversa é mais rápida que a direta, então [B] cai e [A] sobe.'}
          </p>
        </div>
      </div>
      <div className="grid gap-3 @md:grid-cols-2">
        <ControleDeslizante
          rotulo="Tempo"
          valor={t}
          onChange={(v) => {
            anim.setRodando(false)
            setT(v)
          }}
          min={0}
          max={T_MAX}
          passo={0.1}
          unidade="s"
          marcas={[0, 2, 4]}
        />
        <Alternador
          rotulo="Começar com"
          valor={inicio}
          opcoes={[
            { id: 'reagente', rotulo: 'Só reagente A' },
            { id: 'produto', rotulo: 'Só produto B' },
          ]}
          onChange={(id) => {
            anim.setRodando(false)
            setInicio(id as Inicio)
            setT(0)
          }}
        />
      </div>
      <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
      <p className="m-0 text-sm text-[var(--ink-muted)]">Comece com só produto e compare: o equilíbrio é o mesmo, chegando pelos dois lados. No fim, [A] e [B] ficam constantes, mas diferentes.</p>
    </div>
  )
}
