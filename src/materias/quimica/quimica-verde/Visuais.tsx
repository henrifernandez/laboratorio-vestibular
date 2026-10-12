import type { InstanciaNum } from '@/desafios/simples'
import { Formula } from '../comum/Formula'
import { Equacao } from '../estequiometria/Visuais'
import { combustivel, fluxos, reacaoVerde } from './calculo'
import type { DadosAtomos, DadosEmissao } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ causa e efeito */

export function CadeiaCausal({ etapas }: { etapas: { titulo: string; texto: string }[] }) {
  return (
    <ol className="m-0 mx-auto grid w-full max-w-md list-none gap-1 p-0">
      {etapas.map((e, i) => (
        <li key={e.titulo} className="grid gap-1">
          {i > 0 && (
            <span aria-hidden="true" className="text-center text-lg text-[var(--ink-muted)]">
              ↓
            </span>
          )}
          <div className="cartao grid gap-0.5 p-2.5">
            <strong>
              <span className="num mr-1.5 text-[var(--ink-muted)]">{i + 1}.</span>
              {e.titulo}
            </strong>
            <span className="text-sm text-[var(--ink-muted)]">{e.texto}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------------ balanço de energia da Terra */

export function DiagramaEstufa({ albedo, eps }: { albedo: number; eps: number }) {
  const fl = fluxos(albedo, eps)
  const W = 340
  const H = 250
  const esp = (v: number) => 4 + (v / 500) * 22
  const setaV = (x: number, y1: number, y2: number, cor: string, valor: number, rotulo: string, lado: 'esq' | 'dir') => (
    <g>
      <line x1={x} x2={x} y1={y1} y2={y2} stroke={cor} strokeWidth={esp(valor)} strokeLinecap="butt" />
      <polygon points={`${x - esp(valor) - 3},${y2} ${x + esp(valor) + 3},${y2} ${x},${y2 + (y2 > y1 ? 12 : -12)}`} fill={cor} />
      <text x={lado === 'esq' ? x - esp(valor) - 8 : x + esp(valor) + 8} y={(y1 + y2) / 2 + 4} textAnchor={lado === 'esq' ? 'end' : 'start'} fontSize={11} fontWeight={600} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
        {rotulo} {f(valor, 0)}
      </text>
    </g>
  )
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Balanço de energia por m²: o Sol fornece ${f(fl.F, 0)} W; a superfície emite ${f(fl.superficie, 0)} W em infravermelho, a atmosfera devolve ${f(fl.contra, 0)} W e ${f(fl.escapa, 0)} W escapam para o espaço. Temperatura da superfície: ${f(fl.T - 273.15, 0)} °C`} className="mx-auto block w-full max-w-lg">
      <rect x={14} y={12} width={W - 28} height={24} rx={6} fill="var(--surface-2)" />
      <text x={W / 2} y={28} textAnchor="middle" fontSize={11} fill="var(--ink-muted)">espaço</text>
      <rect x={14} y={92} width={W - 28} height={64} rx={6} fill="var(--accent)" opacity={0.14} />
      <text x={190} y={150} fontSize={11} fill="var(--ink-muted)">atmosfera: absorve {f(eps * 100, 0)} % do IR</text>
      <rect x={14} y={206} width={W - 28} height={26} rx={6} fill="var(--aviso)" opacity={0.3} />
      <text x={W / 2} y={223} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)">superfície: {f(fl.T, 0)} K ({f(fl.T - 273.15, 1)} °C)</text>
      {setaV(40, 40, 200, '#e8c840', fl.F, 'Sol', 'dir')}
      {setaV(150, 202, 44, 'var(--erro)', fl.superficie, 'IR da superfície', 'dir')}
      {setaV(300, 160, 200, 'var(--erro)', Math.max(fl.contra, 1), 'IR devolvido', 'esq')}
      {setaV(300, 96, 40, 'var(--ink-muted)', fl.escapa, 'escapa', 'esq')}
    </svg>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualEmissao({ inst }: { inst: InstanciaNum<DadosEmissao> }) {
  const d = inst.dados as DadosEmissao
  if (!d.combustivel) return null
  const c = combustivel(d.combustivel)
  return (
    <div className="cartao grid justify-items-center gap-1 p-3">
      <p className="num m-0 text-lg">
        {c.coefs[0] === 1 ? '' : <strong style={{ color: 'var(--accent)' }}>{c.coefs[0]} </strong>}
        <Formula f={c.formula} /> + <strong style={{ color: 'var(--accent)' }}>{c.coefs[1]}</strong> O<sub>2</sub> → <strong style={{ color: 'var(--accent)' }}>{c.coefs[2]}</strong> CO<sub>2</sub> + <strong style={{ color: 'var(--accent)' }}>{c.coefs[3]}</strong> H<sub>2</sub>O
      </p>
      <p className="m-0 text-sm text-[var(--ink-muted)]">Combustão completa (massas molares: C = 12; H = 1; O = 16).</p>
    </div>
  )
}

export function VisualAtomos({ inst }: { inst: InstanciaNum<DadosAtomos> }) {
  const d = inst.dados as DadosAtomos
  const r = reacaoVerde(d.reacao)
  return (
    <div className="cartao grid gap-2 p-3">
      <Equacao r={r} destaque={{ [r.desejado]: 'pedido' }} />
      <p className="m-0 text-center text-sm text-[var(--ink-muted)]">
        <span className="rounded px-1.5 py-0.5" style={{ background: 'var(--aviso-bg)', outline: '1.5px solid var(--aviso)' }}>produto desejado</span>
        {d.variante === 'fatorE' && <span className="num"> · rendimento {f(d.rendimento as number, 0)} %</span>}
      </p>
    </div>
  )
}
