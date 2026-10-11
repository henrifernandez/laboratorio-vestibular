import { Line, MovablePoint, Point, Text } from 'mafs'
import { Tex } from '@/componentes/Tex'
import type { EntradaProps } from '@/desafios/PainelDesafio'
import { SeletorNumerico } from '@/sim/SeletorNumerico'
import { Cena } from '@/sim/Cena'
import { CurvaDaFuncao } from './GraficoFuncao'
import {
  PASSO_ESBOCE,
  construirDosPontos,
  type DestaqueEsboce,
  type InstanciaEsboce,
  type Ponto,
} from './esboce'
import { formulaTex } from './modelo'

const snap = (v: number) => Math.round(v / PASSO_ESBOCE) * PASSO_ESBOCE
const corta = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function EntradaEsboce({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaEsboce, Ponto[]>) {
  const usuario = construirDosPontos(inst.alvo.tipo, resposta)
  const destaque = correcao?.destaque as DestaqueEsboce | undefined
  const j = inst.janela

  const mover = (i: number, p: Ponto) => onChange(resposta.map((q, k) => (k === i ? p : q)))

  return (
    <div className="grid gap-3">
      <div className="cartao p-3 text-center text-xl">
        <Tex>{formulaTex(inst.alvo)}</Tex>
      </div>
      <Cena janela={j} rotulo="Plano onde você arrasta os pontos de controle até a curva ficar certa">
        {destaque && <CurvaDaFuncao funcao={destaque.alvo} janela={j} cor="var(--curva-alvo)" estilo="dashed" peso={3} />}
        {usuario && <CurvaDaFuncao funcao={usuario} janela={j} />}
        {usuario?.tipo === 'exponencial' && (
          <Line.ThroughPoints point1={[0, usuario.k]} point2={[1, usuario.k]} color="var(--ink-muted)" style="dashed" weight={1.5} />
        )}
        {inst.controles.map((c, i) => {
          const p = resposta[i] as Ponto
          return (
            <g key={c.id}>
              {bloqueado ? (
                <Point x={p.x} y={p.y} color="var(--accent)" />
              ) : (
                <MovablePoint
                  point={[p.x, p.y]}
                  color="var(--accent)"
                  constrain={([x, y]) => [c.fixoX ?? corta(snap(x), j.xmin + 0.5, j.xmax - 0.5), c.fixoY ?? corta(snap(y), j.ymin + 0.5, j.ymax - 0.5)]}
                  onMove={([x, y]) => mover(i, { x, y })}
                />
              )}
              <Text x={p.x} y={p.y} attach="ne" attachDistance={14} size={13}>
                {c.rotulo}
              </Text>
            </g>
          )
        })}
      </Cena>
      {destaque && (
        <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
          <span>
            <span aria-hidden="true" style={{ color: 'var(--accent)' }}>━</span> sua curva
          </span>
          <span>
            <span aria-hidden="true" style={{ color: 'var(--curva-alvo)' }}>╌</span> curva certa
          </span>
        </p>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer py-2 font-semibold">Ajustar com botões (teclado)</summary>
        <div className="grid gap-3 pt-2">
          {inst.controles.map((c, i) => {
            const p = resposta[i] as Ponto
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="min-w-36 font-semibold">{c.rotulo}</span>
                {c.fixoX === undefined && (
                  <span className="flex items-center gap-2">
                    x
                    <SeletorNumerico rotulo={`x de ${c.rotulo}`} valor={p.x} min={j.xmin + 0.5} max={j.xmax - 0.5} passo={PASSO_ESBOCE} onChange={(x) => !bloqueado && mover(i, { ...p, x })} />
                  </span>
                )}
                {c.fixoY === undefined && (
                  <span className="flex items-center gap-2">
                    y
                    <SeletorNumerico rotulo={`y de ${c.rotulo}`} valor={p.y} min={j.ymin + 0.5} max={j.ymax - 0.5} passo={PASSO_ESBOCE} onChange={(y) => !bloqueado && mover(i, { ...p, y })} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}
