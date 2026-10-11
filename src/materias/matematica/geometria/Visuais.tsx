import { lazy, Suspense } from 'react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Dimensoes, Solido } from './calculo'
import type { DadosArea, DadosPlanificacao, DadosTriangulo, DadosVolume, OpcaoRede } from './geradores'
import type { Celula } from './redeCubo'
import { limitesRede, redeComDefeito, type Peca } from './redes'

const Solido3D = lazy(() => import('./Solido3D'))

export interface Solido3DLazyProps {
  solido: Solido
  dim: Dimensoes
  girar?: boolean
  agua?: number
  dobra?: number
  altura?: number
}

/** O three.js só carrega quando um sólido 3D aparece na tela. */
export function Solido3DLazy(props: Solido3DLazyProps) {
  return (
    <Suspense
      fallback={
        <div role="status" className="grid place-items-center rounded-[var(--radius)] border border-[var(--line)] text-[var(--ink-muted)]" style={{ height: props.altura ?? 300 }}>
          Carregando o sólido 3D…
        </div>
      }
    >
      <Solido3D {...props} />
    </Suspense>
  )
}

/* ------------------------------------------------------------------ planificação em SVG */

const f = (n: number) => String(Math.round(n * 100) / 100)

export function Rede2D({ pecas, rotulo, altura = 220 }: { pecas: Peca[]; rotulo: string; altura?: number }) {
  if (pecas.length === 0) {
    return (
      <p className="cartao p-4 text-[var(--ink-muted)]" role="note">
        A esfera não tem planificação: sua superfície curva não pode ser aberta num plano sem esticar ou rasgar.
      </p>
    )
  }
  const l = limitesRede(pecas)
  const pad = Math.max(l.xmax - l.xmin, l.ymax - l.ymin) * 0.05
  const vb = `${f(l.xmin - pad)} ${f(-(l.ymax + pad))} ${f(l.xmax - l.xmin + 2 * pad)} ${f(l.ymax - l.ymin + 2 * pad)}`
  const traco = (Math.max(l.xmax - l.xmin, l.ymax - l.ymin)) / 140
  return (
    <svg viewBox={vb} role="img" aria-label={rotulo} className="w-full" style={{ maxHeight: altura }}>
      {pecas.map((p, i) => {
        const estilo = { fill: p.lateral ? 'var(--accent)' : 'var(--surface-2)', fillOpacity: p.lateral ? 0.22 : 0.9, stroke: 'var(--ink)', strokeWidth: traco, strokeLinejoin: 'round' as const }
        if (p.tipo === 'poligono') return <polygon key={i} points={p.pontos.map(([x, y]) => `${f(x)},${f(-y)}`).join(' ')} {...estilo} />
        if (p.tipo === 'circulo') return <circle key={i} cx={f(p.cx)} cy={f(-p.cy)} r={f(p.raio)} {...estilo} />
        const fim = p.inicio + p.angulo
        const x1 = p.cx + p.raio * Math.cos(p.inicio)
        const y1 = p.cy + p.raio * Math.sin(p.inicio)
        const x2 = p.cx + p.raio * Math.cos(fim)
        const y2 = p.cy + p.raio * Math.sin(fim)
        const grande = p.angulo > Math.PI ? 1 : 0
        return <path key={i} d={`M ${f(p.cx)} ${f(-p.cy)} L ${f(x1)} ${f(-y1)} A ${f(p.raio)} ${f(p.raio)} 0 ${grande} 0 ${f(x2)} ${f(-y2)} Z`} {...estilo} />
      })}
    </svg>
  )
}

/** Figura de seis quadrados (planificação de cubo candidata). */
export function RedeCuboFigura({ celulas, rotulo }: { celulas: Celula[]; rotulo: string }) {
  const xs = celulas.map((c) => c.x)
  const ys = celulas.map((c) => c.y)
  const x0 = Math.min(...xs)
  const y0 = Math.min(...ys)
  const w = Math.max(...xs) - x0 + 1
  const h = Math.max(...ys) - y0 + 1
  return (
    <svg viewBox={`-0.1 -0.1 ${w + 0.2} ${h + 0.2}`} role="img" aria-label={rotulo} className="w-full" style={{ maxHeight: 130 }}>
      {celulas.map((c, i) => (
        <rect key={i} x={c.x - x0} y={c.y - y0} width="1" height="1" fill="var(--accent)" fillOpacity="0.25" stroke="var(--ink)" strokeWidth="0.05" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

export function VisualPlanificacao({ inst }: { inst: InstanciaMulti<DadosPlanificacao> }) {
  const d = inst.dados as DadosPlanificacao
  if (d.modo === 'solidoPelaRede' && d.rede) {
    return (
      <div className="cartao p-3">
        <Rede2D pecas={redeComDefeito(d.rede.solido, d.rede.dim, 'correta')} rotulo="Planificação de um sólido" />
      </div>
    )
  }
  if (d.modo === 'redeDoSolido' && d.solido && d.dim) {
    return <Solido3DLazy solido={d.solido} dim={d.dim} altura={240} />
  }
  return null
}

export function OpcaoPlanificacao({ inst, id }: { inst: InstanciaMulti<DadosPlanificacao>; id: string }) {
  const d = inst.dados as DadosPlanificacao
  if (d.modo === 'redeDoSolido' && d.redes) {
    const o = d.redes[id] as OpcaoRede
    return <Rede2D pecas={redeComDefeito(o.solido, o.dim, o.defeito)} rotulo={`Figura ${id}`} altura={150} />
  }
  if (d.modo === 'cubo' && d.figuras) return <RedeCuboFigura celulas={d.figuras[id] as Celula[]} rotulo={`Figura ${id}`} />
  return null
}

/* ------------------------------------------------------------------ volume e área */

const Texto = ({ children }: { children: string }) => <p className="num text-center text-sm text-[var(--ink-muted)]">{children}</p>

function legendaDim(s: Solido, d: Dimensoes) {
  switch (s) {
    case 'prisma':
      return `${d.a} × ${d.b} × ${d.h} cm`
    case 'cilindro':
    case 'cone':
      return `raio ${d.r} cm · altura ${d.h} cm`
    case 'piramide':
      return `base ${d.a} × ${d.a} cm · altura ${d.h} cm`
    case 'esfera':
      return `raio ${d.r} cm`
  }
}

export function VisualVolume({ inst, correcao }: { inst: InstanciaNum<DadosVolume>; correcao?: { correto: boolean } | null }) {
  const d = inst.dados as DadosVolume
  return (
    <div className="grid gap-1">
      <Solido3DLazy solido={d.solido} dim={d.dim} agua={correcao ? 1 : undefined} altura={260} />
      <Texto>{legendaDim(d.solido, d.dim) + (correcao ? ' · cheio de água: o volume exato aparece na resolução' : ' · arraste para girar')}</Texto>
    </div>
  )
}

export function VisualArea({ inst }: { inst: InstanciaNum<DadosArea> }) {
  const d = inst.dados as DadosArea
  return (
    <div className="grid gap-1">
      <Solido3DLazy solido={d.solido} dim={d.dim} altura={230} />
      <Texto>{legendaDim(d.solido, d.dim)}</Texto>
    </div>
  )
}

/* ------------------------------------------------------------------ triângulos */

type V = [number, number]

/** Vértices de um triângulo de lados (a = BC, b = CA, c = AB): A na origem, B em (c, 0). */
function vertices(l: [number, number, number]): [V, V, V] {
  const [a, b, c] = l
  const x = (b * b + c * c - a * a) / (2 * c)
  const y = Math.sqrt(Math.max(0, b * b - x * x))
  return [[0, 0], [c, 0], [x, y]]
}

function Triangulo({ lados, escala, dx, rotulos, ang90 }: { lados: [number, number, number]; escala: number; dx: number; rotulos: [string, string, string]; ang90?: boolean }) {
  const [A, B, C] = vertices(lados)
  const P = (v: V) => `${f(dx + v[0] * escala)},${f(-v[1] * escala)}`
  const meio = (p: V, q: V): [number, number] => [dx + ((p[0] + q[0]) / 2) * escala, -((p[1] + q[1]) / 2) * escala]
  const lado = (p: V, q: V, t: string, fora: V) => {
    const [mx, my] = meio(p, q)
    const vx = (p[1] - q[1]) * 1
    const vy = (q[0] - p[0]) * 1
    const norma = Math.hypot(vx, vy) || 1
    const sinal = (mx - (dx + fora[0] * escala)) * vx + (my + fora[1] * escala) * -vy > 0 ? 1 : -1
    return (
      <text x={f(mx + (sinal * vx * 13) / norma)} y={f(my - (sinal * vy * 13) / norma + 4)} textAnchor="middle" fontSize="13" fill="var(--ink)" className="num" fontWeight="600">
        {t}
      </text>
    )
  }
  return (
    <g>
      <polygon points={`${P(A)} ${P(B)} ${P(C)}`} fill="var(--accent)" fillOpacity="0.15" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      {lado(B, C, rotulos[0], A)}
      {lado(C, A, rotulos[1], B)}
      {lado(A, B, rotulos[2], C)}
      {ang90 && <path d={`M ${f(dx + 10)} 0 L ${f(dx + 10)} -10 L ${f(dx)} -10`} fill="none" stroke="var(--ink)" strokeWidth="1.5" />}
    </g>
  )
}

export function FiguraTriangulo({ d }: { d: DadosTriangulo }) {
  if (d.modo === 'pitagoras' && d.lados) {
    const { a, b, c } = d.lados
    const rot = (l: 'a' | 'b' | 'c', v: number) => (d.incognita === l ? 'x' : String(v))
    // triângulo retângulo com catetos a (vertical) e b (horizontal), ângulo reto em baixo à esquerda
    const escala = 150 / Math.max(a, b)
    return (
      <svg viewBox="-30 -190 260 230" role="img" aria-label="Triângulo retângulo com os lados indicados" className="mx-auto w-full" style={{ maxWidth: 360 }}>
        <polygon points={`0,0 ${f(b * escala)},0 0,${f(-a * escala)}`} fill="var(--accent)" fillOpacity="0.15" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M 12 0 L 12 -12 L 0 -12" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        <text x={f((b * escala) / 2)} y="22" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)" className="num">{rot('b', b)}</text>
        <text x="-14" y={f((-a * escala) / 2 + 5)} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)" className="num">{rot('a', a)}</text>
        <text x={f((b * escala) / 2 + 16)} y={f((-a * escala) / 2 - 6)} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)" className="num">{rot('c', c)}</text>
      </svg>
    )
  }
  if (d.modo === 'semelhanca' && d.menor && d.maior) {
    const maiorLado = Math.max(...d.maior)
    const escala = 110 / maiorLado
    const idx = d.incognita ? ['a', 'b', 'c'].indexOf(d.incognita) : -1
    const rot = (l: [number, number, number], comX: boolean): [string, string, string] => l.map((v, i) => (comX && i === idx ? 'x' : String(v))) as [string, string, string]
    const largura = d.maior[2] * escala
    return (
      <svg viewBox={`-10 -140 ${f(largura * 1 + d.menor[2] * escala + 70)} 170`} role="img" aria-label="Dois triângulos semelhantes" className="mx-auto w-full" style={{ maxWidth: 480 }}>
        <Triangulo lados={d.menor} escala={escala} dx={0} rotulos={rot(d.menor, false)} />
        <Triangulo lados={d.maior} escala={escala} dx={d.menor[2] * escala + 50} rotulos={rot(d.maior, true)} />
      </svg>
    )
  }
  return null
}

export function VisualTriangulo({ inst }: { inst: InstanciaNum<DadosTriangulo> }) {
  const d = inst.dados as DadosTriangulo
  if (d.modo === 'sombra') {
    const k = 150 / Math.max(d.sombraArvore ?? 1, (d.vara ?? 1) * (d.sombraArvore ?? 1) / (d.sombraVara ?? 1))
    const hVara = (d.vara ?? 1) * k * 2.2
    const sV = (d.sombraVara ?? 1) * k * 2.2
    const sA = (d.sombraArvore ?? 1) * k * 2.2
    const hArv = ((d.vara ?? 1) * (d.sombraArvore ?? 1)) / (d.sombraVara ?? 1) * k * 2.2
    const x0 = 20
    const x1 = x0 + sA + 40
    return (
      <svg viewBox={`0 ${f(-hArv - 30)} ${f(x1 + sV + 30)} ${f(hArv + 60)}`} role="img" aria-label="Árvore e vara com suas sombras no mesmo horário" className="mx-auto w-full" style={{ maxWidth: 480 }}>
        <line x1="0" y1="0" x2={f(x1 + sV + 20)} y2="0" stroke="var(--ink)" strokeWidth="2" />
        <polygon points={`${x0},0 ${f(x0 + sA)},0 ${x0},${f(-hArv)}`} fill="var(--accent)" fillOpacity="0.15" stroke="var(--ink)" strokeWidth="2" />
        <text x={f(x0 - 8)} y={f(-hArv / 2)} textAnchor="end" fontSize="14" fontWeight="700" fill="var(--ink)">x</text>
        <text x={f(x0 + sA / 2)} y="18" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)" className="num">{String(d.sombraArvore).replace('.', ',')} m</text>
        <polygon points={`${x1},0 ${f(x1 + sV)},0 ${x1},${f(-hVara)}`} fill="var(--accent)" fillOpacity="0.15" stroke="var(--ink)" strokeWidth="2" />
        <text x={f(x1 - 8)} y={f(-hVara / 2)} textAnchor="end" fontSize="14" fontWeight="700" fill="var(--ink)" className="num">{String(d.vara).replace('.', ',')} m</text>
        <text x={f(x1 + sV / 2)} y="18" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)" className="num">{String(d.sombraVara).replace('.', ',')} m</text>
      </svg>
    )
  }
  return <FiguraTriangulo d={d} />
}
