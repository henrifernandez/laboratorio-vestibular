import { useId, type ReactNode } from 'react'
import { larguraTexto } from '@/lib/rotulos'
import type { Topologia } from './calculo'
import { BASE_LINHA, BASE_NOME, MEIO_BATERIA, MEIO_COMP, cortarFios, esquemaCircuito, nosDeJuncao, type Orient } from './esquema'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

const FIO = { stroke: 'var(--ink)', strokeWidth: 2.2, strokeLinecap: 'round' as const }
const HALO = { stroke: 'var(--surface)', strokeWidth: 3.5, paintOrder: 'stroke' as const }

/* ------------------------------------------------------------------ símbolos */

/** Pilha (gerador) num fio vertical: placa longa = polo +, placa curta e grossa = polo −. Valor da tensão numa etiqueta ao lado. */
export function Pilha({ x, y, V, escala = 1 }: { x: number; y: number; V?: number; escala?: number }) {
  const texto = V === undefined ? '' : `${f(V)} V`
  const larg = larguraTexto(texto, 11.5, true) + 14
  return (
    <g>
      <g transform={`translate(${x} ${y}) scale(${escala})`}>
        <line x1={0} x2={0} y1={-MEIO_BATERIA} y2={-4.5} {...FIO} />
        <line x1={0} x2={0} y1={4.5} y2={MEIO_BATERIA} {...FIO} />
        <line x1={-14} x2={14} y1={-4.5} y2={-4.5} stroke="var(--ink)" strokeWidth={2.4} strokeLinecap="round" />
        <line x1={-7.5} x2={7.5} y1={4.5} y2={4.5} stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" />
        <text x={-20} y={-3} textAnchor="middle" fontSize={12} fontWeight={800} fill="var(--ink)">+</text>
        <text x={-20} y={13} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--ink)">−</text>
      </g>
      {texto && (
        <g>
          <rect x={x + 18 * escala} y={y - 10} width={larg} height={20} rx={10} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={x + 18 * escala + larg / 2} y={y + 4} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--ink)" className="num">
            {texto}
          </text>
        </g>
      )}
    </g>
  )
}

/** Lâmpada: bulbo de vidro com filamento em espiral; o halo cresce com o brilho (0 a 1). */
export function Lampada({ x, y, orient = 'h', brilho, aberta, marcada, idBrilho, escala = 1 }: { x: number; y: number; orient?: Orient; brilho: number; aberta?: boolean; marcada?: boolean; idBrilho: string; escala?: number }) {
  const acesa = !aberta && brilho > 0.001
  const b = Math.min(1, Math.max(0, brilho))
  return (
    <g transform={`translate(${x} ${y}) rotate(${orient === 'v' ? 90 : 0}) scale(${escala})`}>
      {acesa && <circle r={15 + 17 * b} fill={`url(#${idBrilho})`} opacity={0.35 + 0.65 * b} />}
      <line x1={-MEIO_COMP} x2={-13} y1={0} y2={0} {...FIO} />
      <line x1={13} x2={MEIO_COMP} y1={0} y2={0} {...FIO} />
      <circle r={13} fill={acesa ? 'var(--luz)' : 'var(--surface-2)'} fillOpacity={acesa ? 0.2 + 0.55 * b : 1} stroke="var(--ink)" strokeWidth={1.8} />
      {/* suportes do filamento */}
      <path d="M-13 0 L-6.5 2.5 M13 0 L6.5 2.5" stroke="var(--ink)" strokeWidth={1.3} fill="none" />
      {aberta ? (
        <g>
          <path d="M-6.5 2.5 q1.6 -6 3.2 0 q1.6 -6 2.2 -2" stroke="var(--ink)" strokeWidth={1.4} fill="none" />
          <path d="M6.5 2.5 q-1.6 -6 -3.2 0 q-1.6 -6 -2.2 -2" stroke="var(--ink)" strokeWidth={1.4} fill="none" />
          <path d="M5 -10 l5 5 M10 -10 l-5 5" stroke="var(--erro)" strokeWidth={2} strokeLinecap="round" />
        </g>
      ) : (
        <path d="M-6.5 2.5 q1.6 -6 3.2 0 q1.6 -6 3.3 0 q1.6 -6 3.3 0 q1.6 -6 3.2 0" stroke={acesa ? 'var(--ink)' : 'var(--ink-muted)'} strokeWidth={1.5} fill="none" />
      )}
      {marcada && <circle r={18} fill="none" stroke="var(--erro)" strokeWidth={2} strokeDasharray="4 3" />}
    </g>
  )
}

/** Resistor em zigue-zague. `alvo` destaca o resistor perguntado. */
export function Resistor({ x, y, orient = 'h', alvo }: { x: number; y: number; orient?: Orient; alvo?: boolean }) {
  const zig = Array.from({ length: 7 }, (_, k) => `${-12 + k * 4} ${k === 0 || k === 6 ? 0 : k % 2 === 1 ? -6.5 : 6.5}`)
  return (
    <g transform={`translate(${x} ${y}) rotate(${orient === 'v' ? 90 : 0})`}>
      <path d={`M${-MEIO_COMP} 0 H-12 L${zig.join(' L')} H${MEIO_COMP}`} fill="none" stroke={alvo ? 'var(--accent)' : 'var(--ink)'} strokeWidth={alvo ? 3 : 2.2} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  )
}

/** Brilho radial reaproveitado pelas lâmpadas de um mesmo desenho. */
function DefsBrilho({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor="var(--luz)" stopOpacity={0.95} />
        <stop offset="55%" stopColor="var(--luz)" stopOpacity={0.35} />
        <stop offset="100%" stopColor="var(--luz)" stopOpacity={0} />
      </radialGradient>
    </defs>
  )
}

/* ------------------------------------------------------------------ circuito com várias lâmpadas ou resistores */

export interface EstadoLampada {
  /** brilho de 0 a 1 */
  brilho: number
  texto?: string
}

interface CircuitoProps {
  topologia: Topologia
  rs: number[]
  /** tensão da bateria, mostrada ao lado do símbolo */
  V?: number
  modo: 'lampada' | 'resistor'
  estados?: (EstadoLampada | undefined)[]
  /** lâmpadas em circuito aberto (queimadas) */
  abertas?: number[]
  /** lâmpada que vai queimar (marcada, mas ainda acesa) */
  marcada?: number
  /** resistor perguntado */
  alvo?: number
  rotulo: string
  /** esconde o valor das resistências (mostra só L1, L2...) */
  semValores?: boolean
  children?: ReactNode
}

export function Circuito({ topologia, rs, V, modo, estados, abertas = [], marcada, alvo, rotulo, semValores, children }: CircuitoProps) {
  const idBrilho = `brilho-${useId().replace(/:/g, '')}`
  const e = esquemaCircuito(topologia, rs.length)
  const fios = cortarFios(e)
  const nos = nosDeJuncao(e)
  const nome = (i: number) => (modo === 'lampada' ? `L${i + 1}` : `R${i + 1}`)
  return (
    <svg viewBox={`0 0 ${e.W} ${e.H}`} role="img" aria-label={rotulo} className="mx-auto block h-auto w-full max-w-md">
      <DefsBrilho id={idBrilho} />
      {fios.map(([x1, y1, x2, y2], k) => (
        <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} {...FIO} />
      ))}
      {nos.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={x} cy={y} r={4} fill="var(--ink)" />
      ))}
      <Pilha x={e.bateria.x} y={e.bateria.y} V={V} />
      {e.comps.map((c, i) => {
        const est = estados?.[i]
        const linhas = [semValores ? '' : `${f(rs[i] as number)} Ω`, est?.texto ?? ''].filter(Boolean)
        return (
          <g key={i}>
            {modo === 'lampada' ? (
              <Lampada x={c.x} y={c.y} orient={c.orient} brilho={est?.brilho ?? 0.55} aberta={abertas.includes(i)} marcada={marcada === i} idBrilho={idBrilho} />
            ) : (
              <Resistor x={c.x} y={c.y} orient={c.orient} alvo={alvo === i} />
            )}
            <text x={c.x} y={c.y + BASE_NOME} textAnchor="middle" fontSize={12} fontWeight={800} fill={alvo === i ? 'var(--accent)' : 'var(--ink)'} {...HALO}>
              {nome(i)}
            </text>
            {alvo === i && modo === 'resistor' && (
              <g>
                <circle cx={c.x + 19} cy={c.y - 25} r={8} fill="var(--accent)" />
                <text x={c.x + 19} y={c.y - 21} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--on-accent)">
                  ?
                </text>
              </g>
            )}
            {linhas.map((l, k) => (
              <text key={k} x={c.x} y={c.y + BASE_LINHA(k)} textAnchor="middle" fontSize={11} fill={k === 0 && !semValores ? 'var(--ink)' : 'var(--ink-muted)'} fontWeight={k === 0 && !semValores ? 600 : 400} className="num" {...HALO}>
                {l}
              </text>
            ))}
          </g>
        )
      })}
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------------ circuito animado: lei de Ohm */

const S = { x0: 52, x1: 292, y0: 46, y1: 166 }
const PERIM = 2 * (S.x1 - S.x0) + 2 * (S.y1 - S.y0)
const LAMPADA_SIMPLES = { x: (S.x0 + S.x1) / 2, y: S.y0 }
const PILHA_SIMPLES = { x: S.x0, y: (S.y0 + S.y1) / 2 }

/** Ponto do contorno a uma fração s (0 a 1) do caminho, partindo do canto de cima à esquerda, no sentido horário. */
export function pontoNoContorno(s: number) {
  let d = (((s % 1) + 1) % 1) * PERIM
  const w = S.x1 - S.x0
  const h = S.y1 - S.y0
  if (d < w) return { x: S.x0 + d, y: S.y0 }
  d -= w
  if (d < h) return { x: S.x1, y: S.y0 + d }
  d -= h
  if (d < w) return { x: S.x1 - d, y: S.y1 }
  d -= w
  return { x: S.x0, y: S.y1 - d }
}

/** Um ponto do fio está escondido dentro de algum símbolo (lâmpada ou pilha)? */
const dentroDeSimbolo = (p: { x: number; y: number }) =>
  (Math.abs(p.y - LAMPADA_SIMPLES.y) < 1 && Math.abs(p.x - LAMPADA_SIMPLES.x) < MEIO_COMP * 1.35 + 4) || (Math.abs(p.x - PILHA_SIMPLES.x) < 1 && Math.abs(p.y - PILHA_SIMPLES.y) < MEIO_BATERIA * 1.4 + 6)

/** Seta do sentido convencional (do + para o −, por fora da pilha), desenhada como uma ponta sobre o fio. */
function Ponta({ x, y, ang }: { x: number; y: number; ang: number }) {
  return <path d="M-6 -6 L4 0 L-6 6" transform={`translate(${x} ${y}) rotate(${ang})`} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
}

/**
 * Circuito simples: pilha e lâmpada. Os elétrons (pontos azuis com sinal −) andam do polo − para o +, por fora da pilha;
 * as setas laranja mostram o sentido convencional da corrente, o contrário. `fase` (0 a 1) move os elétrons.
 */
export function CircuitoSimples({ V, R, fase, brilho }: { V: number; R: number; fase: number; brilho: number }) {
  const idBrilho = `brilho-s-${useId().replace(/:/g, '')}`
  const i = R > 0 ? V / R : 0
  const N = 16
  const eletrons = Array.from({ length: N }, (_, k) => pontoNoContorno(-(fase + k / N))).filter((p) => !dentroDeSimbolo(p))
  const escala = 1.35
  const fios = cortarFios({
    W: 340,
    H: 210,
    fios: [
      [S.x0, S.y0, S.x1, S.y0],
      [S.x1, S.y0, S.x1, S.y1],
      [S.x1, S.y1, S.x0, S.y1],
      [S.x0, S.y1, S.x0, S.y0],
    ],
    comps: [{ ...LAMPADA_SIMPLES, orient: 'h' }],
    bateria: PILHA_SIMPLES,
  }).map(([x1, y1, x2, y2]) => {
    // vãos maiores, porque os símbolos estão ampliados
    const extra = (MEIO_COMP * (escala - 1)) as number
    if (y1 === y2 && y1 === LAMPADA_SIMPLES.y) {
      if (x2 <= LAMPADA_SIMPLES.x) return [x1, y1, x2 - extra, y2]
      return [x1 + extra, y1, x2, y2]
    }
    if (x1 === x2 && x1 === PILHA_SIMPLES.x) {
      const extraB = MEIO_BATERIA * (escala - 1)
      return y2 < PILHA_SIMPLES.y ? [x1, y1, x2, y2 - extraB] : y1 > PILHA_SIMPLES.y ? [x1, y1 + extraB, x2, y2] : [x1, y1, x2, y2]
    }
    return [x1, y1, x2, y2]
  })
  return (
    <svg viewBox="0 0 340 210" role="img" aria-label={`Circuito simples: uma pilha de ${f(V)} volts ligada a uma lâmpada de ${f(R)} ohms. Corrente de ${f(i)} ampères. Os elétrons andam do polo negativo para o positivo, por fora da pilha; o sentido convencional da corrente é o contrário.`} className="mx-auto block h-auto w-full max-w-md">
      <DefsBrilho id={idBrilho} />
      {fios.map(([x1, y1, x2, y2], k) => (
        <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--cobre)" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
      ))}
      {fios.map(([x1, y1, x2, y2], k) => (
        <line key={`f${k}`} x1={x1} y1={y1} x2={x2} y2={y2} {...FIO} />
      ))}
      {/* sentido convencional: horário, saindo do + (em cima da pilha) */}
      <Ponta x={S.x0} y={S.y0 + 26} ang={-90} />
      <Ponta x={S.x1 - 40} y={S.y0} ang={0} />
      <Ponta x={S.x1} y={(S.y0 + S.y1) / 2} ang={90} />
      <Ponta x={(S.x0 + S.x1) / 2} y={S.y1} ang={180} />
      {eletrons.map((p, k) => (
        <g key={k}>
          <circle cx={p.x} cy={p.y} r={5.2} fill="var(--el-n)" stroke="var(--surface)" strokeWidth={1.2} />
          <line x1={p.x - 2.6} x2={p.x + 2.6} y1={p.y} y2={p.y} stroke="var(--surface)" strokeWidth={1.6} strokeLinecap="round" />
        </g>
      ))}
      <Lampada x={LAMPADA_SIMPLES.x} y={LAMPADA_SIMPLES.y} brilho={brilho} idBrilho={idBrilho} escala={escala} />
      <Pilha x={PILHA_SIMPLES.x} y={PILHA_SIMPLES.y} V={V} escala={escala} />
      <text x={LAMPADA_SIMPLES.x} y={S.y0 + 42} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--ink)" className="num">{`lâmpada · R = ${f(R)} Ω`}</text>
      <g>
        <rect x={(S.x0 + S.x1) / 2 - 52} y={S.y1 + 14} width={104} height={22} rx={11} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.6} />
        <text x={(S.x0 + S.x1) / 2} y={S.y1 + 29} textAnchor="middle" fontSize={12} fontWeight={800} fill="var(--ink)" className="num">{`i = ${f(i)} A`}</text>
      </g>
    </svg>
  )
}

/** Legenda do circuito animado (fora do SVG, para quebrar linha no celular). */
export function LegendaCircuitoSimples() {
  return (
    <p className="m-0 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
      <span>
        <span aria-hidden="true" className="mr-1 inline-block size-3 rounded-full align-middle" style={{ background: 'var(--el-n)' }} />
        elétrons: do − para o + (por fora da pilha)
      </span>
      <span>
        <span aria-hidden="true" className="mr-1 font-black" style={{ color: 'var(--accent)' }}>
          ›
        </span>
        sentido convencional da corrente: do + para o −
      </span>
    </p>
  )
}
