import type { KeyboardEvent, ReactNode } from 'react'
import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { ESTRUTURAS, type Estrutura, type TipoCelular } from './calculo'
import {
  ALTURA_ROTULO,
  BACTERIA,
  ESCALA_MAX_ROTULO,
  FONTE_ROTULO,
  NOME_CURTO,
  PECAS,
  QUADRO,
  TAMANHO,
  VEGETAL,
  caminhoAnimal,
  caminhoBolha,
  larguraRotulo,
} from './desenhoCelula'

/* ------------------------------------------------------------------ cores e peças comuns */

const COR: Record<string, string> = {
  nucleo: 'var(--cel-nucleo)',
  mitocondria: 'var(--cel-mito)',
  cloroplasto: 'var(--cel-cloro)',
  rer: 'var(--cel-rer)',
  rel: 'var(--cel-rel)',
  golgi: 'var(--cel-golgi)',
  peroxissomo: 'var(--cel-perox)',
  vacuolo: 'var(--cel-vacuolo)',
  ribossomo: 'var(--cel-ribossomo)',
  centriolo: 'var(--ink-muted)',
  parede: 'var(--cel-parede)',
}

/** Membrana dobrada em tubo ou bolsa: traço grosso colorido com o "interior" (lúmen) mais claro. */
function Tubo({ d, cor, largura = 5 }: { d: string; cor: string; largura?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={cor} strokeWidth={largura} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--surface)" strokeOpacity={0.75} strokeWidth={largura * 0.38} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** Ribossomo visto de lado: subunidade maior e menor. */
const Ribo = ({ x, y, cor, k = 1 }: { x: number; y: number; cor: string; k?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <ellipse rx={2.9} ry={2.3} cy={0.9} fill={cor} />
    <ellipse rx={2.1} ry={1.5} cy={-2} fill={cor} fillOpacity={0.75} />
  </g>
)

/** Onda senoidal de -meia a +meia largura (as cisternas do RE rugoso). */
const yOnda = (x: number, meia: number, amp: number) => -amp * Math.sin((Math.PI * (x + meia)) / meia)
const caminhoOnda = (y0: number, meia: number, amp: number) => {
  const p: string[] = []
  for (let x = -meia; x <= meia + 1e-9; x += 2) p.push(`${x === -meia ? 'M' : 'L'}${x.toFixed(1)} ${(y0 + yOnda(x, meia, amp)).toFixed(2)}`)
  return p.join(' ')
}

/* ------------------------------------------------------------------ cada estrutura (centrada em 0,0, dentro da sua caixa) */

function Nucleo({ cor }: { cor: string }) {
  return (
    <>
      <circle r={33} fill={cor} fillOpacity={0.13} />
      {/* envoltório nuclear: duas membranas, interrompidas nos poros */}
      <circle r={33} fill="none" stroke={cor} strokeWidth={1.8} pathLength={100} strokeDasharray="9 1" />
      <circle r={29.6} fill="none" stroke={cor} strokeWidth={1.6} pathLength={100} strokeDasharray="9 1" />
      {/* cromatina */}
      <path d="M-21 -6 q5 -9 11 -3 t10 2 M-16 12 q6 -2 9 5 t9 -1 M10 12 q6 -4 11 2 M-6 -20 q6 2 9 -2" fill="none" stroke={cor} strokeOpacity={0.5} strokeWidth={1.4} strokeLinecap="round" />
      {/* nucléolo */}
      <circle cx={7} cy={-5} r={9.5} fill={cor} fillOpacity={0.8} />
      <circle cx={4} cy={-8} r={2.6} fill="var(--surface)" fillOpacity={0.35} />
    </>
  )
}

function Mitocondria({ cor }: { cor: string }) {
  const rx = 22.5
  const ry = 9.6
  const cristas = [-16, -8, 0, 8, 16].map((x, i) => {
    const borda = ry * Math.sqrt(1 - (x / rx) ** 2)
    return i % 2 === 0 ? { x, y1: -borda, y2: 3.4 } : { x, y1: borda, y2: -3.4 }
  })
  return (
    <>
      {/* membrana externa lisa */}
      <ellipse rx={27} ry={14} fill={cor} fillOpacity={0.14} stroke={cor} strokeWidth={2} />
      {/* membrana interna dobrada em cristas, envolvendo a matriz */}
      <ellipse rx={rx} ry={ry} fill={cor} fillOpacity={0.18} stroke={cor} strokeWidth={1.3} />
      {cristas.map((c) => (
        <line key={c.x} x1={c.x} x2={c.x} y1={c.y1} y2={c.y2} stroke={cor} strokeWidth={2.6} strokeLinecap="round" />
      ))}
    </>
  )
}

function Cloroplasto({ cor }: { cor: string }) {
  const grana = [
    { x: -17, n: 3 },
    { x: -6, n: 4 },
    { x: 5, n: 5 },
    { x: 16, n: 3 },
  ]
  return (
    <>
      {/* duas membranas */}
      <ellipse rx={29} ry={15} fill={cor} fillOpacity={0.14} stroke={cor} strokeWidth={1.8} />
      <ellipse rx={25.8} ry={11.8} fill="none" stroke={cor} strokeWidth={1.1} />
      {/* lamelas do estroma ligando os grana */}
      <path d="M-21 1 L21 1 M-13 -3 L-9 4 M-2 4 L2 -3 M9 -3 L13 4" fill="none" stroke={cor} strokeWidth={1} strokeOpacity={0.8} />
      {/* grana: pilhas de tilacoides */}
      {grana.map((g) => (
        <g key={g.x}>
          {Array.from({ length: g.n }, (_, i) => (
            <rect key={i} x={g.x - 4} y={1 - (g.n * 3.1) / 2 + i * 3.1} width={8} height={2.4} rx={1.1} fill={cor} fillOpacity={0.85} />
          ))}
        </g>
      ))}
    </>
  )
}

function ReRugoso({ cor }: { cor: string }) {
  const meia = 24
  const amp = 2.4
  const cisternas = [-9, 0, 9]
  return (
    <>
      {cisternas.map((y0) => (
        <Tubo key={y0} d={caminhoOnda(y0, meia, amp)} cor={cor} largura={5.4} />
      ))}
      {/* ribossomos presos à face de fora das cisternas; entre duas cisternas ficam alternados, para não se tocarem */}
      {cisternas.flatMap((y0) =>
        [-1, 1].flatMap((lado) =>
          Array.from({ length: 7 }, (_, i) => {
            const x = (lado === 1 ? -21 : -18) + i * 6
            return <circle key={`${y0}${lado}${x}`} cx={x} cy={y0 + yOnda(x, meia, amp) + lado * 4.1} r={1.35} fill="var(--cel-ribossomo)" />
          }),
        ),
      )}
    </>
  )
}

function ReLiso({ cor }: { cor: string }) {
  return <Tubo cor={cor} largura={4.6} d="M-24 -6 C-17 -14 -9 2 -1 -5 S13 -13 24 -6 M-23 8 C-14 1 -6 13 3 6 S16 3 24 9 M-8 -3 L-5 9 M11 -8 L14 5" />
}

function Golgi({ cor }: { cor: string }) {
  const cisternas = [
    { y: -10, m: 21 },
    { y: -4, m: 19 },
    { y: 2, m: 16.5 },
    { y: 8, m: 13.5 },
  ]
  return (
    <>
      {cisternas.map((c) => (
        <g key={c.y}>
          <Tubo d={`M${-c.m} ${c.y + 3} Q0 ${c.y - 6} ${c.m} ${c.y + 3}`} cor={cor} largura={4.2} />
          <circle cx={-c.m - 0.5} cy={c.y + 3.6} r={2.4} fill={cor} />
          <circle cx={c.m + 0.5} cy={c.y + 3.6} r={2.4} fill={cor} />
        </g>
      ))}
      {/* vesículas saindo da face de saída */}
      {[
        [-21, 12.5],
        [0, 12.5],
        [21, 12.5],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={2.5} fill={cor} fillOpacity={0.35} stroke={cor} strokeWidth={1.2} />
      ))}
    </>
  )
}

function Peroxissomo({ cor }: { cor: string }) {
  return (
    <>
      <circle r={10.5} fill={cor} fillOpacity={0.16} stroke={cor} strokeWidth={1.8} />
      {/* núcleo cristalino (enzimas, como a catalase) */}
      <g transform="rotate(45)">
        <rect x={-4} y={-4} width={8} height={8} rx={0.8} fill={cor} fillOpacity={0.8} />
        <path d="M-4 -1.3 H4 M-4 1.3 H4 M-1.3 -4 V4 M1.3 -4 V4" stroke="var(--surface)" strokeOpacity={0.6} strokeWidth={0.7} />
      </g>
    </>
  )
}

function Ribossomos({ cor }: { cor: string }) {
  // polirribossomo (vários ribossomos lendo o mesmo mRNA) e alguns livres
  return (
    <>
      <path d="M-20 -4 C-13 -15 -5 2 2 -6 S15 -10 20 -2" fill="none" stroke="var(--ink-muted)" strokeWidth={1} strokeDasharray="2 1.4" />
      {[
        [-17, -9.6],
        [-9, -8.4],
        [-1, -3.6],
        [7, -7.6],
        [15, -6.4],
      ].map(([x, y]) => (
        <Ribo key={x} x={x as number} y={y as number} cor={cor} />
      ))}
      {[
        [-13, 8],
        [-1, 10],
        [12, 8],
      ].map(([x, y]) => (
        <Ribo key={`l${x}`} x={x as number} y={y as number} cor={cor} />
      ))}
    </>
  )
}

function Centriolos({ cor }: { cor: string }) {
  return (
    <>
      {/* um centríolo visto de lado (cilindro) */}
      <g transform="translate(-5 8)">
        <rect x={-14} y={-6} width={28} height={12} rx={2.4} fill={cor} fillOpacity={0.18} stroke={cor} strokeWidth={1.6} />
        {[-3, 0, 3].map((y) => (
          <line key={y} x1={-11.5} x2={11.5} y1={y} y2={y} stroke={cor} strokeWidth={1} />
        ))}
      </g>
      {/* o outro, perpendicular, visto em corte: 9 trincas de microtúbulos */}
      <g transform="translate(9 -9)">
        <circle r={10} fill={cor} fillOpacity={0.12} />
        {Array.from({ length: 9 }, (_, k) => (
          <g key={k} transform={`rotate(${k * 40}) translate(0 -7.2) rotate(30)`}>
            {[-2.1, 0, 2.1].map((x) => (
              <circle key={x} cx={x} r={1.05} fill={cor} />
            ))}
          </g>
        ))}
      </g>
    </>
  )
}

const VACUOLO = caminhoBolha(53, 38, [
  [0.035, 3, 0.4],
  [0.025, 5, 1.7],
])

function Vacuolo({ cor }: { cor: string }) {
  return (
    <>
      <path d={VACUOLO} fill={cor} fillOpacity={0.16} stroke={cor} strokeWidth={2} />
      <text textAnchor="middle" y={4} fontSize={11} fontWeight={700} fill="var(--ink)">
        Vacúolo central
      </text>
    </>
  )
}

const FORMAS: Record<string, (p: { cor: string }) => ReactNode> = {
  nucleo: Nucleo,
  mitocondria: Mitocondria,
  cloroplasto: Cloroplasto,
  rer: ReRugoso,
  rel: ReLiso,
  golgi: Golgi,
  peroxissomo: Peroxissomo,
  ribossomo: Ribossomos,
  centriolo: Centriolos,
  vacuolo: Vacuolo,
}

/* ------------------------------------------------------------------ contornos */

/** Membrana como duas linhas próximas (a bicamada), clicável pela borda. */
function Membrana({ d, sel, onClick }: { d: string; sel: boolean; onClick: () => void }) {
  return (
    <>
      {sel && <path d={d} fill="none" stroke="var(--accent)" strokeOpacity={0.35} strokeWidth={14} />}
      <path d={d} fill="none" stroke="var(--ink)" strokeWidth={sel ? 4.4 : 3.4} />
      <path d={d} fill="none" stroke="var(--cel-citoplasma)" strokeWidth={1.1} />
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} pointerEvents="stroke" onClick={onClick} style={{ cursor: 'pointer' }} />
    </>
  )
}

const retArred = (r: { x: number; y: number; w: number; h: number; r: number }) =>
  `M${r.x + r.r} ${r.y} H${r.x + r.w - r.r} A${r.r} ${r.r} 0 0 1 ${r.x + r.w} ${r.y + r.r} V${r.y + r.h - r.r} A${r.r} ${r.r} 0 0 1 ${r.x + r.w - r.r} ${r.y + r.h} H${r.x + r.r} A${r.r} ${r.r} 0 0 1 ${r.x} ${r.y + r.h - r.r} V${r.y + r.r} A${r.r} ${r.r} 0 0 1 ${r.x + r.r} ${r.y} Z`

/** Parede: faixa entre o contorno de fora e a membrana. */
function Parede({ fora, dentro, sel, onClick }: { fora: string; dentro: string; sel: boolean; onClick: () => void }) {
  const cor = COR.parede as string
  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {sel && <path d={fora} fill="none" stroke="var(--accent)" strokeOpacity={0.35} strokeWidth={12} />}
      <path d={`${fora} ${dentro}`} fillRule="evenodd" fill={cor} fillOpacity={sel ? 0.55 : 0.32} stroke={cor} strokeWidth={sel ? 3 : 2} />
    </g>
  )
}

const ROTULO_FORA = { fontSize: FONTE_ROTULO, fontWeight: 600, fill: 'var(--ink)', textAnchor: 'middle' } as const

function Contorno({ tipo, sel, onSelecionar }: { tipo: TipoCelular; sel: string | null; onSelecionar: (id: string) => void }) {
  if (tipo === 'animal') {
    const d = caminhoAnimal()
    return (
      <>
        <path d={d} fill="var(--cel-citoplasma)" />
        <Membrana d={d} sel={sel === 'membrana'} onClick={() => onSelecionar('membrana')} />
        <text x={180} y={13} {...ROTULO_FORA}>
          Membrana plasmática
        </text>
      </>
    )
  }
  const { parede, membrana } = tipo === 'vegetal' ? VEGETAL : BACTERIA
  const dm = retArred(membrana)
  return (
    <>
      <Parede fora={retArred(parede)} dentro={dm} sel={sel === 'parede'} onClick={() => onSelecionar('parede')} />
      <path d={dm} fill="var(--cel-citoplasma)" />
      <Membrana d={dm} sel={sel === 'membrana'} onClick={() => onSelecionar('membrana')} />
      <text x={180} y={parede.y - 8} {...ROTULO_FORA}>
        Parede celular
      </text>
      <text x={180} y={parede.y + parede.h + 13} {...ROTULO_FORA}>
        Membrana plasmática (por dentro da parede)
      </text>
      {tipo === 'bacteria' && <Nucleoide />}
    </>
  )
}

/** Filamento enovelado: uma volta grande com laçadas (curva fechada que se cruza). */
const NUCLEOIDE = (() => {
  const p: string[] = []
  for (let i = 0; i <= 360; i++) {
    const t = (i / 360) * Math.PI * 2
    const x = 33 * Math.cos(t) + 8 * Math.cos(7 * t) + 4 * Math.cos(13 * t + 1)
    const y = 13 * Math.sin(t) + 8 * Math.sin(6 * t + 0.3) + 4 * Math.sin(11 * t)
    p.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return `${p.join(' ')} Z`
})()

/** DNA da bactéria: um filamento enovelado, solto no citoplasma (não é clicável: não é uma das 12 estruturas da tabela). */
function Nucleoide() {
  return (
    <g pointerEvents="none">
      <path d={NUCLEOIDE} transform="translate(180 142)" fill="none" stroke="var(--cel-nucleo)" strokeWidth={1.4} strokeLinejoin="round" />
      <text x={180} y={183} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
        Nucleoide (DNA solto)
      </text>
    </g>
  )
}

/* ------------------------------------------------------------------ desenho completo */

/** Desenho esquemático de uma célula, com as estruturas clicáveis (ou acessíveis pelos botões abaixo, no componente PainelCelula). */
export function CelulaSvg({ tipo, selecionada, onSelecionar }: { tipo: TipoCelular; selecionada: string | null; onSelecionar: (id: string) => void }) {
  const tecla = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      onSelecionar(id)
    }
  }
  const titulo = tipo === 'animal' ? 'célula animal' : tipo === 'vegetal' ? 'célula vegetal' : 'célula bacteriana'
  // em tela estreita o desenho encolhe junto com o texto; os nomes crescem um pouco (até onde o teste garante que cabem)
  const [ref, largura] = useLargura<SVGSVGElement>()
  const escala = Math.min(ESCALA_MAX_ROTULO, Math.max(1, fonteLegivel(FONTE_ROTULO, largura, 360, 10) / FONTE_ROTULO))
  return (
    <svg ref={ref} viewBox={QUADRO[tipo]} role="group" aria-label={`Desenho esquemático de uma ${titulo}; as estruturas podem ser escolhidas pelos botões abaixo`} className="mx-auto block w-full max-w-xl">
      <Contorno tipo={tipo} sel={selecionada} onSelecionar={onSelecionar} />
      {PECAS[tipo].map((p, i) => {
        const est = ESTRUTURAS.find((e) => e.id === p.id) as Estrutura
        const [w, h] = TAMANHO[p.id] as readonly [number, number]
        const ativa = selecionada === p.id
        const Forma = FORMAS[p.id] as (p: { cor: string }) => ReactNode
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`} className="no-teia" role="button" tabIndex={0} aria-pressed={ativa} aria-label={est.nome} onClick={() => onSelecionar(p.id)} onKeyDown={tecla(p.id)}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={ativa ? 'var(--accent)' : 'transparent'} fillOpacity={0.14} stroke={ativa ? 'var(--accent)' : 'transparent'} strokeWidth={2.4} />
            <rect className="foco" x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx={12} fill="none" stroke="var(--focus)" strokeWidth={3} />
            <Forma cor={COR[p.id] as string} />
          </g>
        )
      })}
      {PECAS[tipo].map((p, i) => {
        if (!p.rotulo) return null
        const w = larguraRotulo(p.id, escala)
        const h = ALTURA_ROTULO * escala
        const ativa = selecionada === p.id
        return (
          <g key={`r${i}`} pointerEvents="none">
            <rect x={p.rotulo.x - w / 2} y={p.rotulo.y - h / 2} width={w} height={h} rx={h / 2} fill="var(--surface)" fillOpacity={0.9} stroke={ativa ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth={ativa ? 1.6 : 0.8} />
            <text x={p.rotulo.x} y={p.rotulo.y} dy="0.35em" textAnchor="middle" fontSize={FONTE_ROTULO * escala} fontWeight={600} fill="var(--ink)">
              {NOME_CURTO[p.id]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ ícones (botões e ficha) */

const BOLHA_ICONE = caminhoBolha(25, 18, [[0.05, 3, 0.4]])

/** Miniatura de uma estrutura (a mesma figura do desenho, num quadrado), para os botões e para a ficha. */
export function IconeEstrutura({ id, tamanho = 36 }: { id: string; tamanho?: number }) {
  const cor = COR[id] ?? 'var(--ink)'
  const [w, h] = TAMANHO[id] ?? [40, 40]
  const lado = id === 'vacuolo' || id === 'membrana' || id === 'parede' ? 56 : Math.max(w, h) + 8
  let figura: ReactNode
  if (id === 'vacuolo') figura = <path d={BOLHA_ICONE} fill={cor} fillOpacity={0.16} stroke={cor} strokeWidth={2.4} />
  else if (id === 'membrana')
    figura = (
      <>
        <path d="M-24 -9 C-12 -15 12 -3 24 -9" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />
        <path d="M-24 9 C-12 3 12 15 24 9" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />
      </>
    )
  else if (id === 'parede')
    figura = (
      <>
        <rect x={-24} y={-17} width={48} height={34} rx={9} fill={COR.parede} fillOpacity={0.32} stroke={COR.parede} strokeWidth={3} />
        <rect x={-17} y={-10} width={34} height={20} rx={5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
      </>
    )
  else {
    const Forma = FORMAS[id] as (p: { cor: string }) => ReactNode
    figura = <Forma cor={cor} />
  }
  return (
    <svg viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`} width={tamanho} height={tamanho} aria-hidden="true" focusable="false" className="shrink-0">
      {figura}
    </svg>
  )
}
