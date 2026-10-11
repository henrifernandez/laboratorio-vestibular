import { Plot, Point } from 'mafs'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { Cena } from '@/sim/Cena'
import { termoPA, termoPG } from './calculo'
import { fmt, type DadosSeq } from './geradores'

/** Barras: PA parece uma escada (degraus iguais); PG, blocos que crescem cada vez mais. */
export function BarrasSequencia({ termos, rotulo = 'Termos da sequência', mostrarValores = true }: { termos: number[]; rotulo?: string; mostrarValores?: boolean }) {
  const max = Math.max(...termos.map(Math.abs), 1e-9)
  return (
    <figure className="cartao m-0 p-4" aria-label={rotulo}>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {termos.map((t, k) => (
          <div key={k} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
            {mostrarValores && <span className="num text-xs font-semibold sm:text-sm">{fmt(t)}</span>}
            <div
              className="w-full rounded-t-md transition-[height] duration-500"
              style={{ height: `${Math.max(3, (Math.abs(t) / max) * 72)}%`, background: t < 0 ? 'var(--erro)' : 'var(--accent)', opacity: 0.55 + 0.45 * ((k + 1) / termos.length) }}
            />
            <span className="text-xs text-[var(--ink-muted)]">a{k + 1}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}

export function VisualSequencia({ inst }: { inst: InstanciaMulti<DadosSeq> }) {
  return <BarrasSequencia termos={(inst.dados as DadosSeq).termos} rotulo="Barras com os primeiros termos" />
}

export function VisualTermo({ inst }: { inst: InstanciaNum<DadosSeq> }) {
  const d = inst.dados as DadosSeq
  const n = Math.min(5, d.n ?? 5)
  const termos = d.tipo === 'PA' ? Array.from({ length: n }, (_, k) => termoPA(d.a1, d.razao as number, k + 1)) : Array.from({ length: n }, (_, k) => termoPG(d.a1, d.razao as number, k + 1))
  return <BarrasSequencia termos={termos} rotulo="Barras com os primeiros termos" />
}

/** Termos (n, aₙ) como pontos, mais a curva que os liga. */
export function GraficoTermos({ tipo, a1, razao, n }: { tipo: 'PA' | 'PG'; a1: number; razao: number; n: number }) {
  const f = (k: number) => (tipo === 'PA' ? termoPA(a1, razao, k) : termoPG(a1, razao, k))
  const ks = Array.from({ length: n }, (_, i) => i + 1)
  const vals = ks.map(f)
  const ymax = Math.max(...vals, 1) * 1.15
  const ymin = Math.min(...vals, 0) * 1.15 - (Math.min(...vals) >= 0 ? ymax * 0.05 : 0)
  const janela = { xmin: -0.5, xmax: n + 0.8, ymin, ymax: ymax === ymin ? ymin + 1 : ymax }
  const passoY = (() => {
    const alvo = (janela.ymax - janela.ymin) / 5
    const pot = Math.pow(10, Math.floor(Math.log10(Math.max(alvo, 1e-9))))
    const fator = alvo / pot
    return (fator < 1.5 ? 1 : fator < 3.5 ? 2 : fator < 7.5 ? 5 : 10) * pot
  })()
  return (
    <Cena janela={janela} passoX={n > 12 ? Math.ceil(n / 10) : 1} passoY={passoY} rotulo={`Gráfico dos termos da ${tipo}: n no eixo horizontal e aₙ no vertical`}>
      {tipo === 'PA' ? <Plot.OfX y={f} domain={[1, n]} color="var(--ink-muted)" style="dashed" weight={2} /> : razao > 0 ? <Plot.OfX y={f} domain={[1, n]} color="var(--ink-muted)" style="dashed" weight={2} /> : null}
      {ks.map((k) => (
        <Point key={k} x={k} y={f(k)} color="var(--accent)" />
      ))}
    </Cena>
  )
}
