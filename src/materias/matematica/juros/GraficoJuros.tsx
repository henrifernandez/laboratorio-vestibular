import { Plot, Point } from 'mafs'
import { Cena } from '@/sim/Cena'
import { montanteComposto, montanteSimples } from './calculo'

interface Props {
  capital: number
  /** taxas em %, ao mês */
  iSimples: number
  jComposto: number
  tmax: number
  simples?: boolean
  composto?: boolean
  pontos?: boolean
  /** mês até onde desenhar (para animar a passagem do tempo) */
  ate?: number
}

const passoBom = (max: number) => {
  const alvo = max / 5
  const pot = Math.pow(10, Math.floor(Math.log10(alvo)))
  const f = alvo / pot
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * pot
}

/** Montante ao longo do tempo: juros simples (reta) e compostos (exponencial). */
export function GraficoJuros({ capital, iSimples, jComposto, tmax, simples = true, composto = true, pontos = true, ate }: Props) {
  const fimT = ate ?? tmax
  const topo = Math.max(
    simples ? montanteSimples(capital, iSimples / 100, tmax) : 0,
    composto ? montanteComposto(capital, jComposto / 100, tmax) : 0,
    capital * 1.1,
  )
  const ymax = topo * 1.08
  const janela = { xmin: -tmax * 0.06, xmax: tmax * 1.04, ymin: -ymax * 0.06, ymax }
  const meses = Array.from({ length: Math.floor(fimT) + 1 }, (_, k) => k)

  return (
    <div className="grid gap-2">
      <Cena janela={janela} passoX={tmax > 12 ? Math.ceil(tmax / 8) : 1} passoY={passoBom(ymax)} rotulo="Gráfico do montante em reais ao longo dos meses, para juros simples e compostos">
        {simples && <Plot.OfX y={(t) => montanteSimples(capital, iSimples / 100, t)} domain={[0, fimT]} color="var(--ink-muted)" style="dashed" weight={3} />}
        {composto && <Plot.OfX y={(t) => montanteComposto(capital, jComposto / 100, t)} domain={[0, fimT]} color="var(--accent)" weight={3.5} />}
        {pontos &&
          meses.map((t) => (
            <g key={t}>
              {simples && <Point x={t} y={montanteSimples(capital, iSimples / 100, t)} color="var(--ink-muted)" />}
              {composto && <Point x={t} y={montanteComposto(capital, jComposto / 100, t)} color="var(--accent)" />}
            </g>
          ))}
      </Cena>
      <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
        {simples && (
          <span>
            <span aria-hidden="true">╌</span> juros simples ({String(iSimples).replace('.', ',')}% a.m.)
          </span>
        )}
        {composto && (
          <span>
            <span aria-hidden="true" style={{ color: 'var(--accent)' }}>━</span> juros compostos ({String(jComposto).replace('.', ',')}% a.m.)
          </span>
        )}
        <span>eixo x: meses · eixo y: R$</span>
      </p>
    </div>
  )
}
