import { useState } from 'react'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Correcao } from '@/desafios/tipos'
import { Alternador } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useAnimacao } from '@/sim/useAnimacao'
import { blocosEmContato, ONIBUS, onibus, patinadores, type ModoOnibus } from './newton'
import type { DadosAcao, DadosLeis, Lei, Sentido } from './geradoresNewton'
import { Seta } from './Visuais'

const f = (n: number, c = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c })
const fi = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

/** Cores fixas desta parte: cada corpo tem a sua; o par de forças tem uma cor própria. */
export const COR_A = 'var(--accent)'
export const COR_B = 'var(--el-n)'
export const COR_PAR = 'var(--quim-c)'

/* ====================================================================== patinador */

interface PatinadorProps {
  /** posição dos pés (x) e da linha do gelo (y) */
  x: number
  base: number
  escala: number
  cor: string
  /** para onde o patinador está virado */
  olha: 1 | -1
  /** distância (px) até onde a mão alcança, se estiver empurrando; null com os braços soltos */
  alcance: number | null
}

/** Patinador estilizado: lâminas no gelo, pernas flexionadas e braços estendidos enquanto empurra. */
export function Patinador({ x, base, escala: s, cor, olha, alcance }: PatinadorProps) {
  const p = (lx: number, ly: number) => `${x + olha * lx * s},${base + ly * s}`
  const empurra = alcance !== null
  const ombro: [number, number] = empurra ? [5, -54] : [-1, -55]
  const maoX = empurra ? Math.min(alcance / s, 38) : 0
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* lâminas */}
      <path d={`M ${p(-17, -1)} L ${p(-3, -1)} M ${p(3, -1)} L ${p(17, -1)} Q ${p(21, -1)} ${p(20, -5)}`} stroke="var(--ink)" strokeWidth={2} />
      {/* pernas: quadril → joelho → pé */}
      <path d={`M ${p(0, -30)} L ${p(-5, -16)} L ${p(-10, -4)} M ${p(0, -30)} L ${p(6, -16)} L ${p(10, -4)}`} stroke={cor} strokeWidth={5.5} />
      {/* tronco */}
      <path d={`M ${p(0, -30)} L ${p(ombro[0], ombro[1])}`} stroke={cor} strokeWidth={7} />
      {/* braços */}
      {empurra ? (
        <path d={`M ${p(ombro[0], ombro[1])} L ${p(maoX, -51)}`} stroke={cor} strokeWidth={4.5} />
      ) : (
        <path d={`M ${p(ombro[0], ombro[1])} L ${p(-7, -38)} M ${p(ombro[0], ombro[1])} L ${p(8, -40)}`} stroke={cor} strokeWidth={4.5} />
      )}
      {/* cabeça */}
      <circle cx={x + olha * (ombro[0] + 2) * s} cy={base - 64 * s} r={7.5 * s} fill={cor} stroke="none" />
    </g>
  )
}

const escalaDaMassa = (m: number) => 0.82 + (0.36 * (Math.min(Math.max(m, 30), 120) - 30)) / 90

/* ====================================================================== cena dos patinadores */

export const PX_M = 16
const W_P = 360
const C_P = 180
const BASE_P = 176
/** distância inicial dos pés de cada patinador ao centro (px) */
const AFASTA = 26
/** alturas das setas: velocidades em cima, forças logo acima das cabeças */
const Y_V = 34
const Y_F = 70

interface CenaPatinadoresProps {
  mA: number
  mB: number
  F: number
  dt: number
  t: number
  forcas?: boolean
  velocidades?: boolean
  rastro?: boolean
}

const limitar = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b)

export function CenaPatinadores({ mA, mB, F, dt, t, forcas = true, velocidades = true, rastro = true }: CenaPatinadoresProps) {
  const p = patinadores({ mA, mB, F, dt })
  const xA = C_P - AFASTA - p.xA(t) * PX_M
  const xB = C_P + AFASTA + p.xB(t) * PX_M
  const empurrando = p.empurrando(t)
  const sA = escalaDaMassa(mA)
  const sB = escalaDaMassa(mB)
  const alcance = (xB - xA) / 2
  const compF = 18 + (Math.min(F, 400) / 400) * 46
  const kv = 16
  const vA = p.velA(t)
  const vB = p.velB(t)
  const marcas: number[] = []
  for (let k = 0; k * 0.5 <= t + 1e-9; k++) marcas.push(k * 0.5)
  const rotuloX = (x: number) => limitar(x, 46, W_P - 46)
  return (
    <svg viewBox={`0 0 ${W_P} 226`} role="img" className="w-full" aria-label={`Patinadores no gelo: A, de ${mA} kg, e B, de ${mB} kg. ${empurrando ? `Estão se empurrando: cada um recebe ${fi(F)} newtons, em sentidos opostos.` : 'Já se soltaram e deslizam com velocidade constante.'} Velocidade de A: ${f(vA)} m/s; de B: ${f(vB)} m/s.`}>
      {/* gelo */}
      <rect x="6" y={BASE_P} width={W_P - 12} height="14" rx="3" fill="var(--geo-agua)" opacity="0.45" />
      <line x1="6" x2={W_P - 6} y1={BASE_P} y2={BASE_P} stroke="var(--ink)" strokeWidth="1.5" />
      {/* régua em metros */}
      <line x1={C_P - 160} x2={C_P + 160} y1="204" y2="204" stroke="var(--line-strong)" strokeWidth="1" />
      {Array.from({ length: 21 }, (_, i) => i - 10).map((m) => (
        <g key={m}>
          <line x1={C_P + m * PX_M} x2={C_P + m * PX_M} y1={m % 5 === 0 ? 198 : 201} y2="207" stroke="var(--ink-muted)" strokeWidth={m % 5 === 0 ? 1.5 : 1} />
          {m % 5 === 0 && (
            <text x={C_P + m * PX_M} y="219" textAnchor="middle" fontSize="10" fill="var(--ink-muted)" className="num">
              {m === 0 ? '0' : `${Math.abs(m)} m`}
            </text>
          )}
        </g>
      ))}
      {/* marcas no gelo a cada 0,5 s */}
      {rastro &&
        marcas.map((tk) => (
          <g key={tk}>
            <circle cx={C_P - AFASTA - p.xA(tk) * PX_M} cy={BASE_P + 7} r="2.4" fill={COR_A} opacity="0.75" />
            <circle cx={C_P + AFASTA + p.xB(tk) * PX_M} cy={BASE_P + 7} r="2.4" fill={COR_B} opacity="0.75" />
          </g>
        ))}
      <Patinador x={xA} base={BASE_P} escala={sA} cor={COR_A} olha={1} alcance={empurrando ? alcance : null} />
      <Patinador x={xB} base={BASE_P} escala={sB} cor={COR_B} olha={-1} alcance={empurrando ? alcance : null} />
      {/* nomes */}
      <text x={rotuloX(xA)} y={BASE_P - 78 * sA} textAnchor="middle" fontSize="11" fontWeight="800" fill={COR_A} className="num">{`A · ${mA} kg`}</text>
      <text x={rotuloX(xB)} y={BASE_P - 78 * sB} textAnchor="middle" fontSize="11" fontWeight="800" fill={COR_B} className="num">{`B · ${mB} kg`}</text>
      {/* forças do par */}
      {forcas &&
        (empurrando ? (
          <g>
            <Seta x={xA} y={Y_F} dx={-compF} dy={0} cor={COR_PAR} largura={3.5} />
            <Seta x={xB} y={Y_F} dx={compF} dy={0} cor={COR_PAR} largura={3.5} />
            <text x={xA - compF / 2} y={Y_F - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={COR_PAR}>
              B empurra A
            </text>
            <text x={xB + compF / 2} y={Y_F - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={COR_PAR}>
              A empurra B
            </text>
          </g>
        ) : (
          <text x={C_P} y={Y_F + 3} textAnchor="middle" fontSize="11" fill="var(--ink-muted)">
            mãos soltas: nenhuma força horizontal
          </text>
        ))}
      {/* velocidades */}
      {velocidades && t > 0 && (
        <g>
          <Seta x={xA} y={Y_V} dx={-Math.min(96, vA * kv)} dy={0} cor={COR_A} tracejada largura={2.5} />
          <Seta x={xB} y={Y_V} dx={Math.min(96, vB * kv)} dy={0} cor={COR_B} tracejada largura={2.5} />
          <text x={rotuloX(xA - Math.min(96, vA * kv) / 2)} y={Y_V - 9} textAnchor="middle" fontSize="11" fill={COR_A} className="num">{`v = ${f(vA)} m/s`}</text>
          <text x={rotuloX(xB + Math.min(96, vB * kv) / 2)} y={Y_V - 9} textAnchor="middle" fontSize="11" fill={COR_B} className="num">{`v = ${f(vB)} m/s`}</text>
        </g>
      )}
    </svg>
  )
}

/* ====================================================================== o que é igual, o que é diferente */

interface LinhaComparacao {
  nome: string
  unidade: string
  a: number
  b: number
}

/** Barras lado a lado: força e quantidade de movimento iguais; aceleração e velocidade diferentes. */
export function ComparacaoPar({ mA, mB, F, dt }: { mA: number; mB: number; F: number; dt: number }) {
  const p = patinadores({ mA, mB, F, dt })
  const linhas: LinhaComparacao[] = [
    { nome: 'Força recebida', unidade: 'N', a: F, b: F },
    { nome: 'Aceleração', unidade: 'm/s²', a: p.aA, b: p.aB },
    { nome: 'Velocidade final', unidade: 'm/s', a: p.vA, b: p.vB },
    { nome: 'Massa × velocidade', unidade: 'kg·m/s', a: mA * p.vA, b: mB * p.vB },
  ]
  return (
    <div className="grid gap-2" role="group" aria-label="Comparação entre os patinadores A e B">
      {linhas.map((l) => {
        const max = Math.max(l.a, l.b, 1e-9)
        const iguais = Math.abs(l.a - l.b) < 1e-9 * max
        return (
          <div key={l.nome} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-x-2 gap-y-0.5 text-sm">
            <span className="row-span-2 font-semibold">{l.nome}</span>
            <span className="flex items-center gap-2">
              <span className="h-3 rounded-full" style={{ width: `${Math.max(3, (l.a / max) * 100)}%`, background: COR_A, maxWidth: '70%' }} />
              <span className="num whitespace-nowrap" style={{ color: COR_A }}>
                A: {fi(l.a)} {l.unidade}
              </span>
            </span>
            <span className="row-span-2 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: iguais ? 'var(--ok-bg)' : 'var(--aviso-bg)', color: iguais ? 'var(--ok)' : 'var(--aviso)' }}>
              {iguais ? 'iguais' : 'diferentes'}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 rounded-full" style={{ width: `${Math.max(3, (l.b / max) * 100)}%`, background: COR_B, maxWidth: '70%' }} />
              <span className="num whitespace-nowrap" style={{ color: COR_B }}>
                B: {fi(l.b)} {l.unidade}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Versão curta para o Entenda: valores fixos, só o tempo corre. */
export function PatinadoresAnimados({ mA, mB, F, dt }: { mA: number; mB: number; F: number; dt: number }) {
  const [t, setT] = useState(0)
  const anim = useAnimacao(t, 3, setT, 0.8)
  return (
    <div className="grid gap-3">
      <CenaPatinadores mA={mA} mB={mB} F={F} dt={dt} t={t} />
      <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
      <ComparacaoPar mA={mA} mB={mB} F={F} dt={dt} />
    </div>
  )
}

/* ====================================================================== ônibus: inércia */

const PX_O = 16
const X0_O = 12
const PISO = 150
const ESTRADA = 172

function Onibus({ x, inclinacao }: { x: number; inclinacao: number }) {
  const w = ONIBUS.comprimento * PX_O
  const pe = x + 2.2 * PX_O
  return (
    <g>
      {/* carroceria, com a lateral cortada para ver o piso */}
      <path d={`M ${x + 6} 92 H ${x + w - 18} Q ${x + w} 92 ${x + w} 112 V 158 H ${x} V 98 Q ${x} 92 ${x + 6} 92 Z`} fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
      <rect x={x} y="92" width={w - 2} height="10" rx="4" fill={COR_A} />
      <rect x={x} y={PISO} width={w} height="8" fill={COR_A} />
      <line x1={x} x2={x + w} y1={PISO} y2={PISO} stroke="var(--ink)" strokeWidth="2.5" />
      {/* janelas (só o contorno, para a bola continuar visível) */}
      {[0.06, 0.28, 0.5].map((k) => (
        <rect key={k} x={x + k * w} y="106" width={w * 0.18} height="16" rx="3" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
      ))}
      <path d={`M ${x + w - 22} 106 H ${x + w - 6} V 124 H ${x + w - 22} Z`} fill="var(--geo-agua)" opacity="0.6" stroke="var(--ink)" strokeWidth="1.2" />
      {/* passageiro em pé: inclina para a frente quando o ônibus freia */}
      <g transform={`rotate(${inclinacao} ${pe} ${PISO})`} strokeLinecap="round" fill="none">
        <path d={`M ${pe - 3} ${PISO} L ${pe} ${PISO - 18} L ${pe + 3} ${PISO} M ${pe} ${PISO - 18} L ${pe} ${PISO - 34} M ${pe} ${PISO - 30} L ${pe + 7} ${PISO - 22}`} stroke="var(--ink-muted)" strokeWidth="3.5" />
        <circle cx={pe} cy={PISO - 40} r="5" fill="var(--ink-muted)" stroke="none" />
      </g>
      {/* rodas */}
      {[0.18, 0.82].map((k) => (
        <g key={k}>
          <circle cx={x + k * w} cy={ESTRADA - 10} r="10" fill="#2a2420" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx={x + k * w} cy={ESTRADA - 10} r="3.5" fill="#bdb09b" />
        </g>
      ))}
    </g>
  )
}

/** Ônibus que freia ou arranca, com uma bola solta no piso liso: a bola mantém a velocidade até encostar numa parede. */
export function OnibusInercia() {
  const [modo, setModo] = useState<ModoOnibus>('freia')
  const [t, setT] = useState(0)
  const fim = ONIBUS[modo].fim
  const anim = useAnimacao(t, fim, setT, 0.8)
  const e = onibus(modo, t)
  const xo = X0_O + e.xOnibus * PX_O
  const r = ONIBUS.raioBola * PX_O
  const xb = X0_O + e.xBola * PX_O
  const acel = modo === 'freia' ? (e.freando ? -ONIBUS.freia.desac : 0) : e.acelerando ? ONIBUS.arranca.acel : 0
  const rastro: number[] = []
  for (let k = 0; k * 0.2 <= Math.min(t, e.tContato) + 1e-9; k++) rastro.push(k * 0.2)
  const texto = !e.encostou
    ? `Nenhuma força horizontal age na bola (o piso é liso), então ela continua a ${f(e.vBola)} m/s. Quem muda de velocidade é o ônibus: ${f(e.vOnibus)} m/s.`
    : modo === 'freia'
      ? 'A bola chegou à frente do ônibus. Só agora uma força age nela: a parede a empurra para trás, e ela freia junto com o ônibus.'
      : 'O fundo do ônibus alcançou a bola. Só agora uma força age nela: a parede a empurra para a frente, e ela acelera junto (2ª lei).'
  return (
    <div className="grid gap-3">
      <svg viewBox="0 0 360 200" role="img" className="w-full" aria-label={`Ônibus que ${modo === 'freia' ? 'freia' : 'arranca'}, com uma bola solta no piso liso. ${texto}`}>
        {/* postes fixos no chão: a referência de quem está na calçada */}
        {[0, 7, 14, 21].map((m) => (
          <g key={m}>
            <line x1={X0_O + m * PX_O} x2={X0_O + m * PX_O} y1="70" y2={ESTRADA} stroke="var(--line-strong)" strokeWidth="2" />
            <circle cx={X0_O + m * PX_O} cy="68" r="3.5" fill="var(--line-strong)" />
          </g>
        ))}
        <rect x="0" y={ESTRADA} width="360" height="28" fill="var(--surface-2)" />
        <line x1="0" x2="360" y1={ESTRADA} y2={ESTRADA} stroke="var(--ink)" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={6 + i * 32} x2={22 + i * 32} y1={ESTRADA + 14} y2={ESTRADA + 14} stroke="var(--line-strong)" strokeWidth="2.5" />
        ))}
        {/* posições da bola a cada 0,2 s, marcadas na rua (o que vê quem está na calçada) */}
        {rastro.map((tk) => (
          <circle key={tk} cx={X0_O + onibus(modo, tk).xBola * PX_O} cy={ESTRADA + 6} r="2.8" fill={COR_B} />
        ))}
        <Onibus x={xo} inclinacao={Math.max(-15, Math.min(15, -acel * 2.5))} />
        <circle cx={xb} cy={PISO - r} r={r} fill={COR_B} stroke="var(--ink)" strokeWidth="1.5" />
        {/* velocidades */}
        {e.vOnibus > 0.05 && <Seta x={xo + (ONIBUS.comprimento * PX_O) / 2} y={80} dx={e.vOnibus * 6} dy={0} cor={COR_A} largura={3} />}
        {e.vBola > 0.05 && <Seta x={xb} y={PISO - 2 * r - 8} dx={e.vBola * 6} dy={0} cor={COR_B} largura={2.5} tracejada />}
        <text x="352" y="16" textAnchor="end" fontSize="11" fill="var(--ink-muted)" className="num">{`t = ${f(t, 2)} s`}</text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--ink-muted)]">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-1 w-5 rounded" style={{ background: COR_A }} /> velocidade do ônibus
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3 rounded-full" style={{ background: COR_B }} /> bola solta (pontos na rua: onde ela estava, a cada 0,2 s)
        </span>
      </div>
      <p className="cartao num p-3 text-sm" aria-live="polite">
        {texto}
      </p>
      <Alternador
        rotulo="O que o ônibus faz"
        valor={modo}
        opcoes={[
          { id: 'freia', rotulo: 'Freia' },
          { id: 'arranca', rotulo: 'Arranca' },
        ]}
        onChange={(id) => {
          anim.setRodando(false)
          setModo(id as ModoOnibus)
          setT(0)
        }}
      />
      <ControleDeslizante rotulo="Tempo" valor={t} onChange={(v) => setT(v)} min={0} max={fim} passo={0.05} unidade="s" />
      <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
    </div>
  )
}

/* ====================================================================== livro, mesa e Terra: os pares */

type Destaque = 'livro' | 'peso' | 'normal' | 'todas'

const COR_PESO = 'var(--erro)'
const COR_NORMAL = 'var(--ok)'

const TEXTO_DESTAQUE: Record<Destaque, string> = {
  livro: 'Sobre o livro agem P (a Terra o puxa) e N (a mesa o empurra). Elas se equilibram porque o livro está parado (1ª lei), mas não são um par: atuam no mesmo corpo.',
  peso: 'Par do peso: a Terra puxa o livro para baixo (P) e o livro puxa a Terra para cima (P′). Mesmo módulo, sentidos opostos, corpos diferentes.',
  normal: 'Par da normal: a mesa empurra o livro para cima (N) e o livro empurra a mesa para baixo (N′). Mesmo módulo, sentidos opostos, corpos diferentes.',
  todas: 'Quatro forças, dois pares. Cada par liga dois corpos: livro–Terra (P e P′) e livro–mesa (N e N′). Forças de um mesmo par nunca se anulam, porque não atuam no mesmo corpo.',
}

/** Vista "explodida" do livro sobre a mesa sobre a Terra, com os dois pares de ação e reação. */
export function ParesLivroMesa() {
  const [d, setD] = useState<Destaque>('livro')
  const ativa = (forca: 'P' | 'N' | "P'" | "N'") => {
    if (d === 'todas') return true
    if (d === 'livro') return forca === 'P' || forca === 'N'
    if (d === 'peso') return forca === 'P' || forca === "P'"
    return forca === 'N' || forca === "N'"
  }
  const op = (forca: 'P' | 'N' | "P'" | "N'") => (ativa(forca) ? 1 : 0.15)
  const L = 44
  return (
    <div className="grid gap-3">
      <svg viewBox="0 0 360 290" role="img" className="w-full" aria-label={`Livro sobre uma mesa, sobre a Terra, desenhados separados para mostrar as forças. ${TEXTO_DESTAQUE[d]}`}>
        <text x="6" y="14" fontSize="10" fill="var(--ink-muted)">
          corpos afastados só para mostrar as forças
        </text>
        {/* Terra */}
        <path d="M 0 252 Q 180 226 360 252 V 290 H 0 Z" fill="var(--geo-verde)" opacity="0.35" />
        <path d="M 0 252 Q 180 226 360 252" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <text x="14" y="278" fontSize="13" fontWeight="800" fill="var(--ink)">
          Terra
        </text>
        {/* mesa */}
        <rect x="70" y="150" width="220" height="12" rx="2" fill="var(--cobre)" stroke="var(--ink)" strokeWidth="1.5" />
        <rect x="80" y="162" width="9" height="34" fill="var(--cobre)" stroke="var(--ink)" strokeWidth="1.2" />
        <rect x="271" y="162" width="9" height="34" fill="var(--cobre)" stroke="var(--ink)" strokeWidth="1.2" />
        <text x="298" y="160" fontSize="13" fontWeight="800" fill="var(--ink)">
          mesa
        </text>
        {/* livro */}
        <rect x="150" y="70" width="60" height="22" rx="2" fill={COR_A} stroke="var(--ink)" strokeWidth="1.5" />
        <line x1="156" x2="156" y1="70" y2="92" stroke="var(--paper)" strokeWidth="2" />
        <text x="218" y="86" fontSize="13" fontWeight="800" fill="var(--ink)">
          livro
        </text>
        {/* P: Terra puxa o livro */}
        <g opacity={op('P')}>
          <Seta x={166} y={92} dx={0} dy={L} cor={COR_PESO} largura={3.5} />
          <text x="158" y="122" textAnchor="end" fontSize="13" fontWeight="800" fill={COR_PESO}>
            P
          </text>
          <text x="158" y="135" textAnchor="end" fontSize="10" fill={COR_PESO}>
            Terra → livro
          </text>
        </g>
        {/* N: mesa empurra o livro */}
        <g opacity={op('N')}>
          <Seta x={196} y={70} dx={0} dy={-L} cor={COR_NORMAL} largura={3.5} />
          <text x="204" y="32" fontSize="13" fontWeight="800" fill={COR_NORMAL}>
            N
          </text>
          <text x="204" y="45" fontSize="10" fill={COR_NORMAL}>
            mesa → livro
          </text>
        </g>
        {/* N′: livro empurra a mesa */}
        <g opacity={op("N'")}>
          <Seta x={196} y={150} dx={0} dy={L} cor={COR_NORMAL} largura={3.5} />
          <text x="204" y="188" fontSize="13" fontWeight="800" fill={COR_NORMAL}>
            N′
          </text>
          <text x="204" y="201" fontSize="10" fill={COR_NORMAL}>
            livro → mesa
          </text>
        </g>
        {/* P′: livro puxa a Terra */}
        <g opacity={op("P'")}>
          <Seta x={330} y={246} dx={0} dy={-L + 4} cor={COR_PESO} largura={3.5} />
          <text x="322" y="216" textAnchor="end" fontSize="13" fontWeight="800" fill={COR_PESO}>
            P′
          </text>
          <text x="322" y="229" textAnchor="end" fontSize="10" fill={COR_PESO}>
            livro → Terra
          </text>
        </g>
      </svg>
      <p className="cartao p-3 text-sm" aria-live="polite">
        {TEXTO_DESTAQUE[d]}
      </p>
      <Alternador
        rotulo="Destacar"
        valor={d}
        opcoes={[
          { id: 'livro', rotulo: 'Forças no livro' },
          { id: 'peso', rotulo: 'Par do peso' },
          { id: 'normal', rotulo: 'Par da normal' },
          { id: 'todas', rotulo: 'Todas' },
        ]}
        onChange={(id) => setD(id as Destaque)}
      />
      <p className="text-sm text-[var(--ink-muted)]">A mesa também recebe o próprio peso e a força do chão; ficaram de fora para não poluir o desenho.</p>
    </div>
  )
}

/* ====================================================================== pictogramas das leis */

/** Ícone de cada lei, usado nas alternativas do desafio “Qual lei de Newton?”. */
export function PictogramaLei({ lei }: { lei: Lei | 0 }) {
  return (
    <svg viewBox="0 0 72 30" width="72" height="30" aria-hidden="true" className="shrink-0">
      {lei === 1 && (
        <g>
          {[8, 24, 40].map((x) => (
            <circle key={x} cx={x} cy="18" r="4.5" fill={COR_B} opacity={0.3 + x / 80} />
          ))}
          <circle cx="56" cy="18" r="6" fill={COR_B} />
          <line x1="8" x2="68" y1="26" y2="26" stroke="var(--line-strong)" strokeWidth="1.5" />
          <text x="4" y="8" fontSize="8" fill="var(--ink-muted)">
            F = 0
          </text>
        </g>
      )}
      {lei === 2 && (
        <g>
          <rect x="22" y="9" width="18" height="16" rx="2" fill={COR_A} />
          <line x1="4" x2="18" y1="17" y2="17" stroke={COR_PAR} strokeWidth="3" />
          <polygon points="21,17 15,13 15,21" fill={COR_PAR} />
          <line x1="44" x2="62" y1="10" y2="10" stroke="var(--ink-muted)" strokeWidth="2" strokeDasharray="3 2" />
          <polygon points="67,10 61,7 61,13" fill="var(--ink-muted)" />
          <text x="48" y="25" fontSize="9" fontWeight="700" fill="var(--ink-muted)">
            a
          </text>
          <text x="4" y="8" fontSize="9" fontWeight="700" fill={COR_PAR}>
            F
          </text>
        </g>
      )}
      {lei === 3 && (
        <g>
          <rect x="18" y="10" width="17" height="16" rx="2" fill={COR_A} />
          <rect x="37" y="10" width="17" height="16" rx="2" fill={COR_B} />
          <line x1="16" x2="6" y1="6" y2="6" stroke={COR_PAR} strokeWidth="2.5" />
          <polygon points="2,6 8,3 8,9" fill={COR_PAR} />
          <line x1="56" x2="66" y1="6" y2="6" stroke={COR_PAR} strokeWidth="2.5" />
          <polygon points="70,6 64,3 64,9" fill={COR_PAR} />
        </g>
      )}
      {lei === 0 && (
        <g>
          <rect x="8" y="10" width="18" height="16" rx="2" fill="var(--line-strong)" />
          <line x1="30" x2="58" y1="18" y2="18" stroke="var(--ink-muted)" strokeWidth="2.5" strokeDasharray="4 3" />
          <polygon points="64,18 57,14 57,22" fill="none" stroke="var(--ink-muted)" strokeWidth="1.5" />
          <path d="M 38 9 L 50 27 M 50 9 L 38 27" stroke="var(--erro)" strokeWidth="2.5" />
        </g>
      )}
    </svg>
  )
}

export function OpcaoLei({ inst, id }: { inst: InstanciaMulti<DadosLeis>; id: string }) {
  const d = inst.dados
  if (!d || d.tipo !== 'lei') return null
  return <PictogramaLei lei={d.leiDe[id] ?? 0} />
}

/* ====================================================================== desafio: qual é o par? */

const VETOR: Record<Sentido, [number, number]> = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] }

const larguraCorpo = (nome: string) => Math.max(76, nome.length * 10 + 28)

function Corpo({ x, y, nome, cor }: { x: number; y: number; nome: string; cor: string }) {
  const w = larguraCorpo(nome)
  return (
    <g>
      <rect x={x - w / 2} y={y - 20} width={w} height="40" rx="9" fill="var(--surface)" stroke={cor} strokeWidth="2.5" />
      <text x={x} y={y + 5.5} textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--ink)">
        {nome}
      </text>
    </g>
  )
}

/** Onde ficam os dois corpos: longe um do outro quando a ação aponta para o agente (atração), juntos quando o empurra para longe. */
function posicoesPar(d: { agente: string; alvo: string; sentido: Sentido; layout: 'h' | 'agente-abaixo' | 'agente-acima' }) {
  const [vx, vy] = VETOR[d.sentido]
  if (d.layout === 'h') {
    const atrai = vx < 0 // o agente fica à esquerda
    if (atrai) return { agente: { x: 70, y: 100 }, alvo: { x: 290, y: 100 } }
    return { agente: { x: 180 - larguraCorpo(d.agente) / 2 - 4, y: 100 }, alvo: { x: 180 + larguraCorpo(d.alvo) / 2 + 4, y: 100 } }
  }
  const abaixo = d.layout === 'agente-abaixo'
  if (vy === 0) return { agente: { x: 180, y: abaixo ? 160 : 50 }, alvo: { x: 180, y: abaixo ? 50 : 160 } }
  const atrai = vy > 0 === abaixo
  const [perto, longe] = atrai ? [34, 178] : [80, 132]
  return { agente: { x: 180, y: abaixo ? longe : perto }, alvo: { x: 180, y: abaixo ? perto : longe } }
}

/** Dois corpos e a força de ação; depois da correção, a reação tracejada sobre o outro corpo. */
export function VisualLeis({ inst, correcao }: { inst: InstanciaMulti<DadosLeis>; correcao?: Correcao | null }) {
  const d = inst.dados
  if (!d || d.tipo !== 'par') return null
  const pos = posicoesPar(d)
  const agente = { nome: d.agente, ...pos.agente }
  const alvo = { nome: d.alvo, ...pos.alvo }
  const [vx, vy] = VETOR[d.sentido]
  const L = 56
  /**
   * A seta sai da borda do corpo. Setas verticais saem de um dos lados (a ação à direita, a reação à esquerda);
   * setas horizontais ficam em alturas diferentes (a ação acima, a reação abaixo) para não se cruzarem.
   */
  const saida = (c: { x: number; y: number; nome: string }, ux: number, uy: number, reacao: boolean) =>
    uy !== 0 ? { x: c.x + (reacao ? -26 : 26), y: c.y + uy * 20 } : { x: c.x + ux * (larguraCorpo(c.nome) / 2 + 4), y: c.y + (reacao ? 10 : -10) }
  const pa = saida(alvo, vx, vy, false)
  const pr = saida(agente, -vx, -vy, true)
  const rotulo = (p: { x: number; y: number }, ux: number, uy: number, texto: string, cor: string, reacao: boolean) =>
    uy !== 0 ? (
      <text x={p.x + (reacao ? -8 : 8)} y={p.y + uy * (L / 2) + 4} textAnchor={reacao ? 'end' : 'start'} fontSize="12" fontWeight="700" fill={cor}>
        {texto}
      </text>
    ) : (
      <text x={p.x + ux * (L / 2)} y={p.y + (reacao ? 20 : -8)} textAnchor="middle" fontSize="12" fontWeight="700" fill={cor}>
        {texto}
      </text>
    )
  return (
    <div className="mx-auto grid w-full max-w-md gap-1">
      <svg viewBox="0 0 360 212" role="img" className="w-full" aria-label={`Ação: ${d.agente} age sobre ${d.alvo}.${correcao ? ` Reação: ${d.alvo} age sobre ${d.agente}, com o mesmo módulo e sentido oposto.` : ''}`}>
        <Corpo x={agente.x} y={agente.y} nome={d.agente} cor="var(--line-strong)" />
        <Corpo x={alvo.x} y={alvo.y} nome={d.alvo} cor="var(--line-strong)" />
        <Seta x={pa.x} y={pa.y} dx={vx * L} dy={vy * L} cor={COR_A} largura={3.5} />
        {rotulo(pa, vx, vy, 'ação', COR_A, false)}
        {correcao && (
          <>
            <Seta x={pr.x} y={pr.y} dx={-vx * L} dy={-vy * L} cor={COR_PAR} largura={3} tracejada />
            {rotulo(pr, -vx, -vy, 'reação', COR_PAR, true)}
          </>
        )}
      </svg>
      <p className="flex flex-wrap justify-center gap-x-4 text-sm font-semibold">
        <span style={{ color: COR_A }}>
          ação: {d.agente} → {d.alvo}
        </span>
        {correcao && (
          <span style={{ color: COR_PAR }}>
            reação: {d.alvo} → {d.agente}
          </span>
        )}
      </p>
    </div>
  )
}

/* ====================================================================== desafio numérico: ação e reação */

function Carro({ x, base, olha, cor }: { x: number; base: number; olha: 1 | -1; cor: string }) {
  const p = (lx: number, ly: number) => `${x + olha * lx},${base + ly}`
  return (
    <g>
      <path d={`M ${p(-30, -8)} L ${p(-30, -20)} L ${p(-14, -22)} L ${p(-4, -34)} L ${p(16, -34)} L ${p(26, -22)} L ${p(32, -20)} L ${p(32, -8)} Z`} fill={cor} stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
      {[-18, 20].map((lx) => (
        <circle key={lx} cx={x + olha * lx} cy={base - 7} r="7" fill="var(--ink)" />
      ))}
    </g>
  )
}

function Caminhao({ x, base, olha, cor }: { x: number; base: number; olha: 1 | -1; cor: string }) {
  const p = (lx: number, ly: number) => `${x + olha * lx},${base + ly}`
  return (
    <g>
      <path d={`M ${p(-48, -10)} V ${base - 60} H ${x + olha * 18} V ${base - 10} Z`} fill={cor} stroke="var(--ink)" strokeWidth="1.5" />
      <path d={`M ${p(20, -10)} L ${p(20, -44)} L ${p(36, -44)} L ${p(46, -28)} L ${p(46, -10)} Z`} fill={cor} stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
      {[-34, -14, 30].map((lx) => (
        <circle key={lx} cx={x + olha * lx} cy={base - 8} r="8" fill="var(--ink)" />
      ))}
    </g>
  )
}

export function VisualAcao({ inst, correcao }: { inst: InstanciaNum<DadosAcao>; correcao?: Correcao | null }) {
  const d = inst.dados
  if (!d) return null
  if (d.tipo === 'patinadores' || d.tipo === 'colisao') {
    const [m1, m2, a1] = d.tipo === 'patinadores' ? [d.mA, d.mB, d.aA] : [d.mCarro, d.mCaminhao, d.aCarro]
    const base = 118
    const patins = d.tipo === 'patinadores'
    const nome1 = patins ? 'patinadora' : 'carro'
    const nome2 = patins ? 'patinador' : 'caminhão'
    // setas de aceleração ao lado de cada corpo, apontando para onde ele acelera
    const [bordaA, bordaB, yA] = patins ? [124, 238, base - 52] : [108, 286, base - 76]
    return (
      <svg viewBox="0 0 360 184" role="img" className="mx-auto w-full max-w-md" aria-label={`${nome1} de ${fi(m1)} kg, com aceleração de ${fi(a1)} m/s², e ${nome2} de ${fi(m2)} kg, de aceleração desconhecida.${correcao ? ` Cada um recebe ${fi(m1 * a1)} newtons, em sentidos opostos.` : ''}`}>
        <line x1="10" x2="350" y1={base} y2={base} stroke="var(--ink)" strokeWidth="1.5" />
        {patins ? (
          <>
            <rect x="10" y={base} width="340" height="9" fill="var(--geo-agua)" opacity="0.45" />
            <Patinador x={158} base={base} escala={escalaDaMassa(m1) * 1.25} cor={COR_A} olha={1} alcance={22} />
            <Patinador x={202} base={base} escala={escalaDaMassa(m2) * 1.25} cor={COR_B} olha={-1} alcance={22} />
          </>
        ) : (
          <>
            <Carro x={146} base={base} olha={1} cor={COR_A} />
            <Caminhao x={230} base={base} olha={-1} cor={COR_B} />
          </>
        )}
        <text x="172" y={base + 24} textAnchor="end" fontSize="12" fontWeight="800" fill={COR_A} className="num">{`${nome1} · ${fi(m1)} kg`}</text>
        <text x="188" y={base + 24} fontSize="12" fontWeight="800" fill={COR_B} className="num">{`${nome2} · ${fi(m2)} kg`}</text>
        <Seta x={bordaA} y={yA} dx={-50} dy={0} cor={COR_A} largura={2.5} tracejada />
        <text x={bordaA - 25} y={yA - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={COR_A} className="num">{`a = ${fi(a1)} m/s²`}</text>
        <Seta x={bordaB} y={yA} dx={50} dy={0} cor={COR_B} largura={2.5} tracejada />
        <text x={Math.min(bordaB + 25, 318)} y={yA - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={COR_B} className="num">
          {correcao ? `a = ${fi((m1 * a1) / m2)} m/s²` : 'a = ?'}
        </text>
        {correcao && (
          <>
            <Seta x={176} y={base + 42} dx={-50} dy={0} cor={COR_PAR} largura={3} />
            <Seta x={184} y={base + 42} dx={50} dy={0} cor={COR_PAR} largura={3} />
            <text x="180" y={base + 60} textAnchor="middle" fontSize="11" fontWeight="700" fill={COR_PAR} className="num">{`F = ${fi(m1 * a1)} N em cada um, em sentidos opostos`}</text>
          </>
        )}
      </svg>
    )
  }
  const { contatos } = blocosEmContato(d.F, d.massas)
  const larg = d.massas.map((m) => 34 + m * 4)
  const total = larg.reduce((s, w) => s + w, 0)
  const x0 = 70 + (290 - 70 - total) / 2 + 20
  const xs: number[] = []
  let acc = x0
  for (const w of larg) {
    xs.push(acc)
    acc += w
  }
  const base = 120
  const xEnc = (xs[d.encontro + 1] as number) - 0
  const valor = contatos[d.encontro] as number
  return (
    <svg viewBox="0 0 360 150" role="img" className="mx-auto w-full max-w-md" aria-label={`Blocos ${d.massas.map((m, i) => `${'ABC'[i]} de ${m} kg`).join(', ')}, encostados; uma força de ${d.F} newtons empurra A.`}>
      <line x1="10" x2="350" y1={base} y2={base} stroke="var(--ink)" strokeWidth="2" />
      {d.massas.map((m, i) => {
        const h = 30 + m * 3
        return (
          <g key={i}>
            <rect x={xs[i]} y={base - h} width={larg[i]} height={h} rx="2" fill={i === 0 ? COR_A : i === 1 ? COR_B : 'var(--geo-nova)'} stroke="var(--ink)" strokeWidth="1.5" />
            <text x={(xs[i] as number) + (larg[i] as number) / 2} y={base - h / 2 - 2} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--paper)">
              {'ABC'[i]}
            </text>
            <text x={(xs[i] as number) + (larg[i] as number) / 2} y={base - h / 2 + 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--paper)" className="num">{`${m} kg`}</text>
          </g>
        )
      })}
      <Seta x={x0 - 58} y={base - 22} dx={54} dy={0} cor="var(--ink)" largura={3} />
      <text x={x0 - 32} y={base - 32} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)" className="num">{`F = ${d.F} N`}</text>
      {/* contato perguntado: um selo acima do encontro, ligado a ele por uma linha */}
      <line x1={xEnc} x2={xEnc} y1="42" y2={base - 30 - 3 * Math.min(d.massas[d.encontro] as number, d.massas[d.encontro + 1] as number)} stroke={COR_PAR} strokeWidth="1.2" strokeDasharray="3 3" />
      {correcao ? (
        <>
          <Seta x={xEnc + 3} y={32} dx={40} dy={0} cor={COR_PAR} largura={3} />
          <Seta x={xEnc - 3} y={32} dx={-40} dy={0} cor={COR_PAR} largura={3} />
          <text x={xEnc} y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill={COR_PAR} className="num">{`${fi(valor)} N em cada sentido`}</text>
        </>
      ) : (
        <>
          <circle cx={xEnc} cy={32} r="10" fill="var(--surface)" stroke={COR_PAR} strokeWidth="2" />
          <text x={xEnc} y={36.5} textAnchor="middle" fontSize="13" fontWeight="800" fill={COR_PAR}>
            ?
          </text>
        </>
      )}
    </svg>
  )
}
