import { useState, type KeyboardEvent } from 'react'
import type { InstanciaMulti, VisualProps } from '@/desafios/simples'
import { ESTRUTURAS, FASES_MEIOSE, FASES_MITOSE, TRANSPORTES, contagem, presentesEm, type Estrutura, type TipoCelular, type TipoDivisao } from './calculo'
import { ALTURA, LARGURA, desenhar, descreverDesenho, type CelulaDesenho, type Cromo } from './desenhoDivisao'
import type { DadosFase } from './geradoresDivisao'
import type { DadosMembrana, DadosTransporte } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ divisão celular */

const COR_ORIGEM = { M: 'var(--el-n)', P: 'var(--el-o)' } as const

function Cromossomo({ c }: { c: Cromo }) {
  const meio = c.comprimento / 2
  const cor = COR_ORIGEM[c.origem]
  return (
    <g>
      {c.cromatides === 2 ? (
        <>
          <line x1={c.x - 2.7} x2={c.x - 2.7} y1={c.y - meio} y2={c.y + meio} stroke={cor} strokeWidth={4.2} strokeLinecap="round" />
          <line x1={c.x + 2.7} x2={c.x + 2.7} y1={c.y - meio} y2={c.y + meio} stroke={cor} strokeWidth={4.2} strokeLinecap="round" />
        </>
      ) : (
        <line x1={c.x} x2={c.x} y1={c.y - meio} y2={c.y + meio} stroke={cor} strokeWidth={4.6} strokeLinecap="round" />
      )}
      <circle cx={c.x} cy={c.y} r={3} fill="var(--surface)" stroke={cor} strokeWidth={1.6} />
    </g>
  )
}

/** Desenho de uma fase da mitose ou da meiose para um organismo 2n = 4 (azul: cromossomos de origem materna; vermelho: paterna). */
export function CelulaDivisaoSvg({ tipo, fase, compacto = false }: { tipo: TipoDivisao; fase: string; compacto?: boolean }) {
  const d = desenhar(tipo, fase)
  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={descreverDesenho(d)} className={`mx-auto block w-full ${compacto ? 'max-w-[10rem]' : 'max-w-lg'}`}>
      {d.celulas.map((cel: CelulaDesenho, i) => (
        <g key={i}>
          <ellipse cx={cel.cx} cy={cel.cy} rx={cel.rx} ry={cel.ry} fill="var(--surface)" stroke="var(--ink-muted)" strokeWidth={2} />
          {d.fuso &&
            cel.cromos.map((c, j) => {
              const lados = d.disposicao === 'equador' ? [-1, 1] : c.x < cel.cx ? [-1] : [1]
              return lados.map((l) => <line key={`${j}${l}`} x1={cel.cx + l * (cel.rx - 6)} y1={cel.cy} x2={c.x} y2={c.y} stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="3 3" />)
            })}
          {cel.nucleo && <ellipse cx={cel.cx} cy={cel.cy} rx={Math.min(cel.rx * 0.5, 48)} ry={Math.min(cel.ry * 0.62, 56)} fill="var(--surface-2)" fillOpacity={0.7} stroke="var(--ink-muted)" strokeWidth={1.5} strokeDasharray="4 3" />}
          {cel.cromos.map((c, j) => (
            <Cromossomo key={j} c={c} />
          ))}
        </g>
      ))}
    </svg>
  )
}

/** Legenda das cores dos cromossomos. */
export const LegendaCromossomos = () => (
  <p className="m-0 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-[var(--ink-muted)]">
    <span>
      <span aria-hidden="true" style={{ color: COR_ORIGEM.M }}>■</span> cromossomos de origem materna
    </span>
    <span>
      <span aria-hidden="true" style={{ color: COR_ORIGEM.P }}>■</span> de origem paterna
    </span>
    <span>cromossomo longo e curto = dois pares de homólogos (2n = 4)</span>
  </p>
)

/** Várias fases lado a lado, cada uma com legenda. */
export function SequenciaDeFases({ tipo, fases }: { tipo: TipoDivisao; fases: readonly string[] }) {
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {fases.map((fase) => (
          <figure key={fase} className="m-0 grid gap-1">
            <CelulaDivisaoSvg tipo={tipo} fase={fase} compacto />
            <figcaption className="text-center text-sm font-semibold">{fase}</figcaption>
          </figure>
        ))}
      </div>
      <LegendaCromossomos />
    </div>
  )
}

/** DNA por célula, em unidades C, ao longo das fases (destaca a fase atual). */
export function GraficoDna({ tipo, atual }: { tipo: TipoDivisao; atual?: string }) {
  const fases = tipo === 'mitose' ? FASES_MITOSE : FASES_MEIOSE
  const n = fases.length
  const L = 340
  const dnas = fases.map((fase) => contagem(tipo, fase, 4).dnaPorCelula)
  const topo = 4
  const larg = 270 / n
  const resumo = fases.map((fase, i) => `${fase}: ${dnas[i]} C`).join('; ')
  return (
    <svg viewBox={`0 0 ${L} 190`} role="img" aria-label={`DNA por célula, em unidades C, ao longo da ${tipo === 'mitose' ? 'mitose' : 'meiose'}. ${resumo}`} className="mx-auto block w-full max-w-lg">
      <line x1={44} x2={44} y1={14} y2={136} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={L - 8} y1={136} y2={136} stroke="var(--ink-muted)" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4].map((v) => (
        <g key={v}>
          <line x1={40} x2={44} y1={136 - (v / topo) * 118} y2={136 - (v / topo) * 118} stroke="var(--ink-muted)" />
          <text x={36} y={136 - (v / topo) * 118 + 4} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)" className="num">
            {v}
          </text>
        </g>
      ))}
      <text x={4} y={11} fontSize={10.5} fill="var(--ink-muted)">
        DNA por célula (C)
      </text>
      {fases.map((fase, i) => {
        const h = ((dnas[i] as number) / topo) * 118
        const x = 50 + i * larg
        const ativa = fase === atual
        return (
          <g key={fase}>
            <rect x={x + 2} y={136 - h} width={larg - 4} height={h} rx={3} fill={ativa ? 'var(--accent)' : 'var(--line-strong)'} />
            <text x={x + larg / 2} y={150} textAnchor="end" fontSize={9.5} fill={ativa ? 'var(--ink)' : 'var(--ink-muted)'} fontWeight={ativa ? 700 : 400} transform={`rotate(-40 ${x + larg / 2} 150)`}>
              {fase}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ organelas */

interface Instancia {
  id: string
  x: number
  y: number
  rotulo?: { x: number; y: number }
  hit?: [number, number]
}

const NOME_CURTO: Record<string, string> = {
  nucleo: 'Núcleo',
  mitocondria: 'Mitocôndria',
  cloroplasto: 'Cloroplasto',
  rer: 'RE rugoso',
  rel: 'RE liso',
  golgi: 'Golgi',
  peroxissomo: 'Peroxissomo',
  vacuolo: 'Vacúolo central',
  ribossomo: 'Ribossomos',
  centriolo: 'Centríolo',
}

const POSICOES: Record<TipoCelular, Instancia[]> = {
  animal: [
    { id: 'nucleo', x: 130, y: 112, rotulo: { x: 130, y: 160 }, hit: [76, 76] },
    { id: 'mitocondria', x: 262, y: 88, rotulo: { x: 262, y: 114 } },
    { id: 'mitocondria', x: 225, y: 196 },
    { id: 'rer', x: 70, y: 178, rotulo: { x: 70, y: 206 } },
    { id: 'rel', x: 150, y: 200, rotulo: { x: 150, y: 224 } },
    { id: 'golgi', x: 282, y: 140, rotulo: { x: 282, y: 162 } },
    { id: 'peroxissomo', x: 200, y: 54, rotulo: { x: 200, y: 74 } },
    { id: 'ribossomo', x: 62, y: 100, rotulo: { x: 62, y: 124 } },
    { id: 'centriolo', x: 205, y: 130, rotulo: { x: 205, y: 162 } },
  ],
  vegetal: [
    { id: 'vacuolo', x: 200, y: 128, hit: [112, 88] },
    { id: 'nucleo', x: 68, y: 120, rotulo: { x: 68, y: 164 }, hit: [68, 68] },
    { id: 'cloroplasto', x: 292, y: 72, rotulo: { x: 292, y: 98 } },
    { id: 'cloroplasto', x: 296, y: 180 },
    { id: 'mitocondria', x: 118, y: 196, rotulo: { x: 118, y: 220 } },
    { id: 'rer', x: 110, y: 62, rotulo: { x: 110, y: 88 } },
    { id: 'rel', x: 170, y: 56, rotulo: { x: 170, y: 80 } },
    { id: 'golgi', x: 50, y: 198, rotulo: { x: 50, y: 220 } },
    { id: 'peroxissomo', x: 235, y: 52, rotulo: { x: 235, y: 72 } },
    { id: 'ribossomo', x: 180, y: 195, rotulo: { x: 180, y: 214 } },
  ],
  bacteria: [
    { id: 'ribossomo', x: 80, y: 125, hit: [60, 58] },
    { id: 'ribossomo', x: 250, y: 112, rotulo: { x: 250, y: 160 } },
    { id: 'ribossomo', x: 232, y: 146 },
  ],
}

const COR: Record<string, string> = {
  nucleo: 'var(--ink-muted)',
  mitocondria: 'var(--el-o)',
  cloroplasto: 'var(--ok)',
  rer: 'var(--el-n)',
  rel: 'var(--quim-c)',
  golgi: 'var(--aviso)',
  peroxissomo: 'var(--quim-b)',
  vacuolo: 'var(--accent)',
  ribossomo: 'var(--ink)',
  parede: 'var(--aviso)',
  centriolo: 'var(--ink-muted)',
  membrana: 'var(--ink)',
}

function Forma({ id }: { id: string }) {
  const cor = COR[id] as string
  switch (id) {
    case 'nucleo':
      return (
        <>
          <circle r={30} fill={cor} fillOpacity={0.16} stroke={cor} strokeWidth={2.2} />
          <circle r={26} fill="none" stroke={cor} strokeWidth={1.2} strokeDasharray="3 2.5" />
          <circle cx={-6} cy={4} r={8} fill={cor} fillOpacity={0.7} />
        </>
      )
    case 'mitocondria':
      return (
        <>
          <ellipse rx={24} ry={13} fill={cor} fillOpacity={0.2} stroke={cor} strokeWidth={2} />
          <path d="M-15 -6 L-10 7 L-4 -7 L2 7 L8 -7 L14 5" fill="none" stroke={cor} strokeWidth={1.6} strokeLinejoin="round" />
        </>
      )
    case 'cloroplasto':
      return (
        <>
          <ellipse rx={26} ry={14} fill={cor} fillOpacity={0.2} stroke={cor} strokeWidth={2} />
          {[-13, -2, 9].map((x) => (
            <g key={x} stroke={cor} strokeWidth={1.4} fill={cor} fillOpacity={0.45}>
              <rect x={x} y={-6} width={7} height={3} rx={1} />
              <rect x={x} y={-1.5} width={7} height={3} rx={1} />
              <rect x={x} y={3} width={7} height={3} rx={1} />
            </g>
          ))}
        </>
      )
    case 'rer':
      return (
        <>
          {[-7, 1, 9].map((y) => (
            <ellipse key={y} cy={y} rx={22} ry={4.4} fill={cor} fillOpacity={0.18} stroke={cor} strokeWidth={1.6} />
          ))}
          {[-15, -6, 3, 12].map((x) => (
            <circle key={x} cx={x} cy={-13.5} r={1.9} fill="var(--ink)" />
          ))}
        </>
      )
    case 'rel':
      return <path d="M-24 0 q6 -11 12 0 t12 0 t12 0 t12 0" fill="none" stroke={cor} strokeWidth={5} strokeLinecap="round" />
    case 'golgi':
      return (
        <>
          {[-9, -3, 3, 9].map((y, i) => (
            <path key={y} d={`M${-20 + i * 1.5} ${y} q${20 - i * 1.5} -7 ${40 - i * 3} 0`} fill="none" stroke={cor} strokeWidth={4} strokeLinecap="round" />
          ))}
        </>
      )
    case 'peroxissomo':
      return (
        <>
          <circle r={10} fill={cor} fillOpacity={0.2} stroke={cor} strokeWidth={2} />
          <rect x={-3.5} y={-3.5} width={7} height={7} fill={cor} />
        </>
      )
    case 'vacuolo':
      return (
        <>
          <ellipse rx={56} ry={44} fill={cor} fillOpacity={0.13} stroke={cor} strokeWidth={2} />
          <text textAnchor="middle" y={4} fontSize={11} fontWeight={700} fill="var(--ink)">
            Vacúolo central
          </text>
        </>
      )
    case 'ribossomo':
      return (
        <>
          {[
            [-9, -5],
            [0, -9],
            [9, -4],
            [-6, 5],
            [4, 4],
            [12, 7],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={2.8} fill={cor} />
          ))}
        </>
      )
    case 'centriolo':
      return (
        <>
          <rect x={-16} y={-3.5} width={26} height={7} rx={2} fill={cor} fillOpacity={0.3} stroke={cor} strokeWidth={1.6} />
          <rect x={4} y={-17} width={7} height={26} rx={2} fill={cor} fillOpacity={0.3} stroke={cor} strokeWidth={1.6} />
        </>
      )
    default:
      return null
  }
}

function Contorno({ tipo, sel, onSelecionar }: { tipo: TipoCelular; sel: string | null; onSelecionar: (id: string) => void }) {
  const ring = (id: string) => (sel === id ? 'var(--accent)' : 'transparent')
  const clique = (id: string) => ({ onClick: () => onSelecionar(id), style: { cursor: 'pointer' } as const })
  if (tipo === 'animal')
    return (
      <>
        <ellipse cx={180} cy={130} rx={168} ry={104} fill="var(--surface)" stroke="var(--ink)" strokeWidth={sel === 'membrana' ? 5 : 2.6} />
        <ellipse cx={180} cy={130} rx={168} ry={104} fill="none" stroke={ring('membrana')} strokeOpacity={0.35} strokeWidth={14} />
        <ellipse cx={180} cy={130} rx={168} ry={104} fill="none" stroke="transparent" strokeWidth={22} pointerEvents="stroke" {...clique('membrana')} />
        <text x={180} y={14} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">
          Membrana plasmática
        </text>
      </>
    )
  if (tipo === 'vegetal')
    return (
      <>
        <rect x={12} y={24} width={336} height={206} rx={22} fill="var(--surface)" stroke={COR.parede} strokeWidth={sel === 'parede' ? 10 : 7} />
        <rect x={12} y={24} width={336} height={206} rx={22} fill="none" stroke="transparent" strokeWidth={20} pointerEvents="stroke" {...clique('parede')} />
        <rect x={21} y={33} width={318} height={188} rx={16} fill="none" stroke="var(--ink)" strokeWidth={sel === 'membrana' ? 5 : 2.4} />
        <rect x={21} y={33} width={318} height={188} rx={16} fill="none" stroke="transparent" strokeWidth={14} pointerEvents="stroke" {...clique('membrana')} />
        <text x={180} y={16} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">
          Parede celular
        </text>
        <text x={180} y={244} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">
          Membrana plasmática (por dentro da parede)
        </text>
      </>
    )
  return (
    <>
      <rect x={28} y={74} width={304} height={112} rx={56} fill="var(--surface)" stroke={COR.parede} strokeWidth={sel === 'parede' ? 10 : 7} />
      <rect x={28} y={74} width={304} height={112} rx={56} fill="none" stroke="transparent" strokeWidth={20} pointerEvents="stroke" {...clique('parede')} />
      <rect x={37} y={83} width={286} height={94} rx={47} fill="none" stroke="var(--ink)" strokeWidth={sel === 'membrana' ? 5 : 2.4} />
      <rect x={37} y={83} width={286} height={94} rx={47} fill="none" stroke="transparent" strokeWidth={14} pointerEvents="stroke" {...clique('membrana')} />
      <text x={180} y={64} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">
        Parede celular
      </text>
      <text x={180} y={206} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">
        Membrana plasmática
      </text>
      <path d="M120 120 q12 -20 24 0 t24 6 t24 -8 t24 8 t20 -2 M126 140 q18 12 30 -4 t30 4 t30 -6 t24 4" fill="none" stroke="var(--ink-muted)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={180} y={162} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
        Nucleoide: DNA sem envoltório
      </text>
    </>
  )
}

/** Desenho esquemático de uma célula, com as estruturas clicáveis (ou acessíveis pelos botões abaixo, no componente PainelCelula). */
export function CelulaSvg({ tipo, selecionada, onSelecionar }: { tipo: TipoCelular; selecionada: string | null; onSelecionar: (id: string) => void }) {
  const tecla = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault()
      onSelecionar(id)
    }
  }
  const titulo = tipo === 'animal' ? 'célula animal' : tipo === 'vegetal' ? 'célula vegetal' : 'célula bacteriana'
  return (
    <svg viewBox="0 0 360 250" role="group" aria-label={`Desenho esquemático de uma ${titulo}; as estruturas podem ser escolhidas pelos botões abaixo`} className="mx-auto block w-full max-w-xl">
      <Contorno tipo={tipo} sel={selecionada} onSelecionar={onSelecionar} />
      {POSICOES[tipo].map((p, i) => {
        const est = ESTRUTURAS.find((e) => e.id === p.id) as Estrutura
        const [w, h] = p.hit ?? [58, 58]
        const ativa = selecionada === p.id
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`} className="no-teia" role="button" tabIndex={0} aria-pressed={ativa} aria-label={est.nome} onClick={() => onSelecionar(p.id)} onKeyDown={tecla(p.id)}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={ativa ? 'var(--accent)' : 'transparent'} fillOpacity={0.14} stroke={ativa ? 'var(--accent)' : 'transparent'} strokeWidth={2.4} />
            <rect className="foco" x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} rx={12} fill="none" stroke="var(--focus)" strokeWidth={3} />
            <Forma id={p.id} />
          </g>
        )
      })}
      {POSICOES[tipo].map((p, i) =>
        p.rotulo && p.id !== 'vacuolo' ? (
          <text key={`r${i}`} x={p.rotulo.x} y={p.rotulo.y} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)" pointerEvents="none">
            {NOME_CURTO[p.id]}
          </text>
        ) : null,
      )}
    </svg>
  )
}

const TIPOS: { id: TipoCelular; rotulo: string }[] = [
  { id: 'animal', rotulo: 'Célula animal' },
  { id: 'vegetal', rotulo: 'Célula vegetal' },
  { id: 'bacteria', rotulo: 'Bactéria' },
]
export const NOME_TIPO: Record<TipoCelular, string> = { animal: 'células animais', vegetal: 'células vegetais', bacteria: 'bactérias' }

/** Ficha da estrutura escolhida. */
export function FichaEstrutura({ id, tipo }: { id: string | null; tipo: TipoCelular }) {
  if (!id) return <p className="m-0 text-[var(--ink-muted)]">Escolha uma estrutura no desenho ou nos botões para ver a função dela.</p>
  const e = ESTRUTURAS.find((x) => x.id === id) as Estrutura
  const onde = (Object.keys(e.presente) as TipoCelular[]).filter((t) => e.presente[t]).map((t) => NOME_TIPO[t])
  return (
    <div className="grid gap-1" aria-live="polite">
      <h3 className="m-0 text-base">{e.nome}</h3>
      <p className="m-0">
        {e.nome} {e.funcao}.
      </p>
      <p className="m-0 text-sm text-[var(--ink-muted)]">
        Está em: {onde.join(', ')}. Membranas: {e.membranas === 0 ? 'nenhuma' : e.membranas}. DNA próprio: {e.dnaProprio ? 'sim (origem endossimbiótica)' : 'não'}.
        {!e.presente[tipo] && ' (Não existe no tipo de célula mostrado.)'}
      </p>
    </div>
  )
}

/** Desenho + botões (acesso por teclado) + ficha. */
export function PainelCelula({ tipo, selecionada, onSelecionar, onTipo }: { tipo: TipoCelular; selecionada: string | null; onSelecionar: (id: string) => void; onTipo?: (t: TipoCelular) => void }) {
  const lista = presentesEm(tipo)
  return (
    <div className="grid gap-3">
      {onTipo && (
        <div role="group" aria-label="Tipo de célula" className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button key={t.id} type="button" aria-pressed={t.id === tipo} className={`btn ${t.id === tipo ? 'btn-primario' : ''}`} onClick={() => onTipo(t.id)}>
              {t.rotulo}
            </button>
          ))}
        </div>
      )}
      <div className="cartao p-3">
        <CelulaSvg tipo={tipo} selecionada={selecionada} onSelecionar={onSelecionar} />
      </div>
      <div role="group" aria-label="Estruturas desta célula" className="flex flex-wrap gap-2">
        {lista.map((e) => (
          <button key={e.id} type="button" aria-pressed={selecionada === e.id} className={`btn ${selecionada === e.id ? 'btn-primario' : ''}`} onClick={() => onSelecionar(e.id)}>
            {e.nome}
          </button>
        ))}
      </div>
      <div className="cartao p-3">
        <FichaEstrutura id={selecionada} tipo={tipo} />
      </div>
    </div>
  )
}

/** Painel com estado próprio (para as etapas da aba Entenda). */
export function PainelCelulaLivre({ tipoInicial = 'animal' }: { tipoInicial?: TipoCelular }) {
  const [tipo, setTipo] = useState<TipoCelular>(tipoInicial)
  const [sel, setSel] = useState<string | null>(null)
  return <PainelCelula tipo={tipo} selecionada={sel && presentesEm(tipo).some((e) => e.id === sel) ? sel : null} onSelecionar={setSel} onTipo={setTipo} />
}

const SIM = <span aria-label="sim">✓</span>
const NAO = <span aria-label="não" className="text-[var(--ink-muted)]">—</span>

/** Quais estruturas existem em cada tipo de célula. */
export function TabelaPresenca() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Estruturas em cada tipo de célula</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Estrutura</th>
            <th scope="col" className="px-1 text-center">Animal</th>
            <th scope="col" className="px-1 text-center">Vegetal</th>
            <th scope="col" className="px-1 text-center">Bactéria</th>
            <th scope="col" className="px-1 text-center">Membranas</th>
            <th scope="col" className="px-1 text-center">DNA próprio</th>
          </tr>
        </thead>
        <tbody>
          {ESTRUTURAS.map((e) => (
            <tr key={e.id} className="border-b border-[var(--line)]">
              <th scope="row" className="py-1 pr-2 text-left font-semibold">{e.nome}</th>
              <td className="text-center">{e.presente.animal ? SIM : NAO}</td>
              <td className="text-center">{e.presente.vegetal ? SIM : NAO}</td>
              <td className="text-center">{e.presente.bacteria ? SIM : NAO}</td>
              <td className="num text-center">{e.membranas === 0 ? '0' : e.membranas}</td>
              <td className="text-center">{e.dnaProprio ? SIM : NAO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ membrana e transporte */

/** Bicamada lipídica com proteínas (modelo do mosaico fluido). */
export function BicamadaSvg() {
  const xs = Array.from({ length: 14 }, (_, i) => 18 + i * 22)
  return (
    <svg viewBox="0 0 340 190" role="img" aria-label="Membrana plasmática: bicamada de fosfolipídios, com cabeças hidrofílicas voltadas para fora e caudas hidrofóbicas voltadas para dentro, com proteínas de canal, proteína carregadora e glicoproteína" className="mx-auto block w-full max-w-lg">
      <text x={6} y={14} fontSize={10.5} fill="var(--ink-muted)">Meio extracelular</text>
      <text x={6} y={184} fontSize={10.5} fill="var(--ink-muted)">Citoplasma</text>
      {xs.map((x) => (
        <g key={x}>
          <line x1={x} x2={x} y1={52} y2={78} stroke="var(--ink-muted)" strokeWidth={2} />
          <line x1={x + 6} x2={x + 6} y1={52} y2={78} stroke="var(--ink-muted)" strokeWidth={2} />
          <circle cx={x + 3} cy={46} r={7} fill="var(--accent)" fillOpacity={0.5} stroke="var(--accent)" strokeWidth={1.5} />
          <line x1={x} x2={x} y1={112} y2={86} stroke="var(--ink-muted)" strokeWidth={2} />
          <line x1={x + 6} x2={x + 6} y1={112} y2={86} stroke="var(--ink-muted)" strokeWidth={2} />
          <circle cx={x + 3} cy={118} r={7} fill="var(--accent)" fillOpacity={0.5} stroke="var(--accent)" strokeWidth={1.5} />
        </g>
      ))}
      {/* canal */}
      <rect x={72} y={38} width={13} height={88} rx={4} fill="var(--el-n)" fillOpacity={0.7} />
      <rect x={100} y={38} width={13} height={88} rx={4} fill="var(--el-n)" fillOpacity={0.7} />
      {/* carregadora */}
      <ellipse cx={192} cy={82} rx={20} ry={34} fill="var(--el-o)" fillOpacity={0.55} stroke="var(--el-o)" strokeWidth={2} />
      {/* glicoproteína */}
      <ellipse cx={272} cy={82} rx={11} ry={32} fill="var(--ok)" fillOpacity={0.55} stroke="var(--ok)" strokeWidth={2} />
      <path d="M272 50 l-10 -22 M272 50 l0 -26 M272 50 l10 -22" stroke="var(--ok)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={92} y={150} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">Proteína</text>
      <text x={92} y={163} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">de canal</text>
      <text x={192} y={150} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">Proteína</text>
      <text x={192} y={163} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">carregadora</text>
      <text x={272} y={150} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="var(--ink)">Glicoproteína</text>
      <text x={226} y={26} fontSize={10} fill="var(--ink-muted)">cabeça hidrofílica</text>
      <text x={226} y={186} fontSize={10} fill="var(--ink-muted)">cauda hidrofóbica</text>
    </svg>
  )
}

/** Bolinhas (moléculas) em posições fixas e espalhadas. */
function pontos(n: number, x0: number, x1: number, y0: number, y1: number, semente: number): [number, number][] {
  const r: [number, number][] = []
  let s = semente
  const prox = () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
  for (let i = 0; i < n; i++) r.push([x0 + prox() * (x1 - x0), y0 + prox() * (y1 - y0)])
  return r
}

/** Dois lados da membrana com a quantidade de moléculas proporcional à concentração, e o sentido do movimento. */
export function MembranaSvg({ dentro, fora, unidade, sentido, substancia }: { dentro: number; fora: number; unidade: string; sentido: 'entra' | 'sai'; substancia: string }) {
  const max = Math.max(dentro, fora)
  const qtd = (v: number) => Math.max(2, Math.round(2 + 22 * Math.sqrt(v / max)))
  const entra = sentido === 'entra'
  return (
    <svg viewBox="0 0 340 210" role="img" aria-label={`${substancia}: fora, ${f(fora, 4)} ${unidade}; dentro, ${f(dentro, 4)} ${unidade}. A substância ${entra ? 'entra na célula' : 'sai da célula'}.`} className="mx-auto block w-full max-w-lg">
      <rect x={4} y={4} width={332} height={78} rx={8} fill="var(--surface-2)" />
      <rect x={4} y={128} width={332} height={78} rx={8} fill="var(--surface-2)" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
        <g key={i}>
          <circle cx={12 + i * 21} cy={96} r={5.5} fill="var(--accent)" fillOpacity={0.5} stroke="var(--accent)" strokeWidth={1.2} />
          <circle cx={12 + i * 21} cy={116} r={5.5} fill="var(--accent)" fillOpacity={0.5} stroke="var(--accent)" strokeWidth={1.2} />
        </g>
      ))}
      {pontos(qtd(fora), 14, 326, 14, 72, 7).map(([x, y], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={4.2} fill="var(--el-o)" />
      ))}
      {pontos(qtd(dentro), 14, 326, 138, 196, 11).map(([x, y], i) => (
        <circle key={`d${i}`} cx={x} cy={y} r={4.2} fill="var(--el-o)" />
      ))}
      <text x={10} y={20} fontSize={10.5} fontWeight={700} fill="var(--ink)">Fora: {f(fora, 4)} {unidade}</text>
      <text x={10} y={201} fontSize={10.5} fontWeight={700} fill="var(--ink)">Dentro: {f(dentro, 4)} {unidade}</text>
      <defs>
        <marker id="seta-mem" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--ink)" />
        </marker>
      </defs>
      <line x1={170} x2={170} y1={entra ? 30 : 186} y2={entra ? 182 : 34} stroke="var(--ink)" strokeWidth={3} markerEnd="url(#seta-mem)" />
    </svg>
  )
}

export function VisualMembrana({ inst }: VisualProps<InstanciaMulti<DadosMembrana>>) {
  const d = inst.dados as DadosMembrana
  if (!d || d.tipo !== 'transporte') return null
  const t = d as DadosTransporte
  return (
    <div className="cartao grid gap-1 p-3">
      <MembranaSvg dentro={t.dentro} fora={t.fora} unidade={t.unidade} sentido={t.sentido} substancia={t.substancia} />
      <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Cada bolinha representa moléculas da substância; a seta mostra o sentido do movimento.</p>
    </div>
  )
}

export function TabelaTransportes() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Transporte através da membrana plasmática</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Tipo</th>
            <th scope="col" className="px-1">Gradiente</th>
            <th scope="col" className="px-1 text-center">Proteína</th>
            <th scope="col" className="px-1 text-center">ATP</th>
            <th scope="col" className="px-1">Exemplo</th>
          </tr>
        </thead>
        <tbody>
          {TRANSPORTES.map((t) => (
            <tr key={t.id} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1 pr-2 text-left font-semibold">{t.nome}</th>
              <td className="px-1">{t.passivo ? 'a favor' : 'contra'}</td>
              <td className="text-center">{t.proteina ? SIM : NAO}</td>
              <td className="text-center">{t.atp ? SIM : NAO}</td>
              <td className="px-1">{t.exemplo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ osmose */

export type EstadoCelula = 'lise' | 'inchada' | 'normal' | 'crenacao' | 'turgida' | 'flacida' | 'plasmolise'

export const TEXTO_ESTADO: Record<EstadoCelula, string> = {
  lise: 'lise (a hemácia estoura)',
  inchada: 'inchada (ganhou água, mas ainda não estourou)',
  normal: 'normal (volume constante)',
  crenacao: 'crenação (a hemácia murcha)',
  turgida: 'túrgida (cheia de água, pressionando a parede)',
  flacida: 'flácida (sem ganho nem perda de água)',
  plasmolise: 'plasmólise (a membrana se descola da parede)',
}

function Hemacia({ cx, cy, v, lise }: { cx: number; cy: number; v: number; lise: boolean }) {
  const r = 24 * Math.sqrt(v)
  const cor = 'var(--el-o)'
  if (lise)
    return (
      <g stroke={cor} strokeWidth={2} fill="none" strokeLinecap="round">
        <path d={`M${cx - 30} ${cy} a30 30 0 0 1 14 -26`} strokeDasharray="4 4" />
        <path d={`M${cx + 6} ${cy - 32} a32 32 0 0 1 24 22`} strokeDasharray="4 4" />
        <path d={`M${cx + 32} ${cy + 12} a32 32 0 0 1 -22 24`} strokeDasharray="4 4" />
        <path d={`M${cx - 8} ${cy + 36} a32 32 0 0 1 -22 -18`} strokeDasharray="4 4" />
        <circle cx={cx - 8} cy={cy - 4} r={4} fill={cor} fillOpacity={0.5} />
        <circle cx={cx + 8} cy={cy + 6} r={3} fill={cor} fillOpacity={0.5} />
      </g>
    )
  if (v <= 0.82) {
    const pts = Array.from({ length: 28 }, (_, i) => {
      const a = (i / 28) * Math.PI * 2
      const rr = i % 2 === 0 ? r * 1.12 : r * 0.88
      return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
    }).join(' ')
    return <polygon points={pts} fill={cor} fillOpacity={0.35} stroke={cor} strokeWidth={2} strokeLinejoin="round" />
  }
  const inchada = v > 1.12
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={cor} fillOpacity={inchada ? 0.18 : 0.35} stroke={cor} strokeWidth={2.4} />
      {!inchada && <ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r * 0.45} fill="var(--surface)" fillOpacity={0.75} />}
    </g>
  )
}

function CelulaVegetalOsmose({ cx, cy, estado, v }: { cx: number; cy: number; estado: 'turgida' | 'flacida' | 'plasmolise'; v: number }) {
  const W = 92
  const H = 70
  const e = Math.sqrt(Math.max(0.3, Math.min(1, v)))
  return (
    <g>
      {estado === 'plasmolise' ? (
        <rect x={cx - (W / 2 - 5) * e} y={cy - (H / 2 - 5) * e} width={(W - 10) * e} height={(H - 10) * e} rx={10} fill="var(--ok)" fillOpacity={0.3} stroke="var(--ok)" strokeWidth={2} />
      ) : (
        <rect x={cx - W / 2 + 4} y={cy - H / 2 + 4} width={W - 8} height={H - 8} rx={estado === 'turgida' ? 12 : 6} fill="var(--ok)" fillOpacity={estado === 'turgida' ? 0.45 : 0.25} stroke="var(--ok)" strokeWidth={2} strokeDasharray={estado === 'flacida' ? '5 3' : undefined} />
      )}
      <rect x={cx - W / 2} y={cy - H / 2} width={W} height={H} rx={14} fill="none" stroke="var(--aviso)" strokeWidth={5} />
      <ellipse cx={cx} cy={cy} rx={estado === 'plasmolise' ? 14 * e : 22} ry={estado === 'plasmolise' ? 10 * e : 16} fill="var(--accent)" fillOpacity={0.2} stroke="var(--accent)" strokeWidth={1.5} />
    </g>
  )
}

/** Uma célula em um meio, com setas de água. `volume` é relativo ao inicial (1 = volume normal). */
export function OsmoseSvg({ estado, volume, agua }: { estado: EstadoCelula; volume: number; agua: 'entra' | 'sai' | 'equilibrio' }) {
  const vegetal = estado === 'turgida' || estado === 'flacida' || estado === 'plasmolise'
  const cx = 170
  const cy = 90
  /** Seta de água em direção ao centro (entra) ou para fora (sai); no equilíbrio, uma de cada sentido. */
  const seta = (dx: number, dy: number, sentido: 'entra' | 'sai', desloc: number, key: string) => {
    const a = { x: cx + dx + desloc, y: cy + dy }
    const b = { x: cx + dx * 0.62 + desloc, y: cy + dy * 0.62 }
    const [p, q] = sentido === 'entra' ? [a, b] : [b, a]
    return <line key={key} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--accent)" strokeWidth={2.4} strokeLinecap="round" markerEnd="url(#seta-agua)" />
  }
  return (
    <svg viewBox="0 0 340 180" role="img" aria-label={`Célula ${vegetal ? 'vegetal' : 'animal (hemácia)'} em uma solução: ${TEXTO_ESTADO[estado]}. Água: ${agua === 'entra' ? 'entra na célula' : agua === 'sai' ? 'sai da célula' : 'entra e sai na mesma proporção'}.`} className="mx-auto block w-full max-w-lg">
      <rect x={4} y={4} width={332} height={172} rx={12} fill="var(--accent)" fillOpacity={0.07} stroke="var(--line-strong)" strokeWidth={1.5} />
      {vegetal ? <CelulaVegetalOsmose cx={cx} cy={cy} estado={estado as 'turgida' | 'flacida' | 'plasmolise'} v={volume} /> : <Hemacia cx={cx} cy={cy} v={volume} lise={estado === 'lise'} />}
      <defs>
        <marker id="seta-agua" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
        </marker>
      </defs>
      {[
        [-72, -52],
        [72, -52],
        [-72, 52],
        [72, 52],
      ].flatMap(([dx, dy], i) =>
        agua === 'equilibrio'
          ? [seta(dx as number, dy as number, 'entra', -5, `a${i}`), seta(dx as number, dy as number, 'sai', 5, `b${i}`)]
          : [seta(dx as number, dy as number, agua, 0, `s${i}`)],
      )}
      <text x={12} y={22} fontSize={10.5} fill="var(--ink-muted)">Meio externo</text>
      <text x={170} y={168} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">{TEXTO_ESTADO[estado]}</text>
    </svg>
  )
}

/** As três situações lado a lado: hipotônico, isotônico e hipertônico. */
export function TresEstadosOsmose({ celula }: { celula: 'hemacia' | 'vegetal' }) {
  const itens: { titulo: string; estado: EstadoCelula; vol: number; agua: 'entra' | 'sai' | 'equilibrio' }[] =
    celula === 'hemacia'
      ? [
          { titulo: 'Meio hipotônico', estado: 'lise', vol: 1.5, agua: 'entra' },
          { titulo: 'Meio isotônico', estado: 'normal', vol: 1, agua: 'equilibrio' },
          { titulo: 'Meio hipertônico', estado: 'crenacao', vol: 0.7, agua: 'sai' },
        ]
      : [
          { titulo: 'Meio hipotônico', estado: 'turgida', vol: 1, agua: 'entra' },
          { titulo: 'Meio isotônico', estado: 'flacida', vol: 1, agua: 'equilibrio' },
          { titulo: 'Meio hipertônico', estado: 'plasmolise', vol: 0.6, agua: 'sai' },
        ]
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {itens.map((i) => (
        <figure key={i.titulo} className="m-0 grid gap-1">
          <OsmoseSvg estado={i.estado} volume={i.vol} agua={i.agua} />
          <figcaption className="text-center text-sm font-semibold">{i.titulo}</figcaption>
        </figure>
      ))}
    </div>
  )
}

export function VisualFase({ inst }: VisualProps<InstanciaMulti<DadosFase>>) {
  const d = inst.dados as DadosFase
  return (
    <div className="cartao grid gap-2 p-3">
      <CelulaDivisaoSvg tipo={d.tipo} fase={d.fase} />
      <LegendaCromossomos />
    </div>
  )
}

