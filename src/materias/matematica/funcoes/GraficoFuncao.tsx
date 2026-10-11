import type { ReactNode } from 'react'
import { Line, Plot, Point, Text } from 'mafs'
import { Cena } from '@/sim/Cena'
import type { Janela } from './esboce'
import { avaliar, caracteristicas, type Funcao } from './modelo'

export type Realce = 'raizes' | 'vertice' | 'intercepto' | 'assintota'

interface Props {
  funcao: Funcao
  janela: Janela
  rotulo: string
  realces?: Realce[]
  /** mostra as coordenadas ao lado dos pontos destacados */
  valores?: boolean
  zoom?: boolean
  chaveReinicio?: number
  /** curva desenhada (por exemplo, a versão animada); os destaques seguem sempre a função final */
  curva?: Funcao
  children?: ReactNode
}

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/** Domínio para desenhar: a logarítmica só existe para x > 0. */
export function dominioDe(f: Funcao, j: Janela): [number, number] {
  return f.tipo === 'logaritmica' ? [1e-4, j.xmax] : [j.xmin, j.xmax]
}

export function CurvaDaFuncao({
  funcao,
  janela,
  cor = 'var(--accent)',
  estilo = 'solid',
  peso = 3.5,
}: {
  funcao: Funcao
  janela: Janela
  cor?: string
  estilo?: 'solid' | 'dashed'
  peso?: number
}) {
  return <Plot.OfX y={(x) => avaliar(funcao, x)} domain={dominioDe(funcao, janela)} color={cor} style={estilo} weight={peso} />
}

/** Gráfico de uma função com os pontos notáveis destacados (raízes, vértice, intercepto, assíntota). */
export function GraficoFuncao({ funcao, janela, rotulo, realces = [], valores = true, zoom, chaveReinicio, curva, children }: Props) {
  const c = caracteristicas(funcao)
  const mostra = (r: Realce) => realces.includes(r)
  return (
    <Cena janela={janela} rotulo={rotulo} zoom={zoom} chaveReinicio={chaveReinicio}>
      {c.assintota && mostra('assintota') &&
        (c.assintota.tipo === 'horizontal' ? (
          <>
            <Line.ThroughPoints point1={[0, c.assintota.valor]} point2={[1, c.assintota.valor]} color="var(--ink-muted)" style="dashed" weight={2} />
            {valores && (
              <Text x={janela.xmax - 0.2} y={c.assintota.valor} attach="nw" size={14} color="var(--ink-muted)">
                {`y = ${fmt(c.assintota.valor)}`}
              </Text>
            )}
          </>
        ) : (
          <>
            <Line.ThroughPoints point1={[c.assintota.valor, 0]} point2={[c.assintota.valor, 1]} color="var(--ink-muted)" style="dashed" weight={2} />
            {valores && (
              <Text x={c.assintota.valor} y={janela.ymax - 0.3} attach="ne" size={14} color="var(--ink-muted)">
                {`x = ${fmt(c.assintota.valor)}`}
              </Text>
            )}
          </>
        ))}
      <CurvaDaFuncao funcao={curva ?? funcao} janela={janela} />
      {mostra('raizes') &&
        c.raizes.map((r) => (
          <g key={`r${r}`}>
            <Point x={r} y={0} color="var(--ink)" />
            {valores && (
              <Text x={r} y={0} attach="s" attachDistance={12} size={14}>
                {`(${fmt(r)}; 0)`}
              </Text>
            )}
          </g>
        ))}
      {mostra('vertice') && c.vertice && (
        <g>
          <Point x={c.vertice.x} y={c.vertice.y} color="var(--accent)" />
          {valores && (
            <Text x={c.vertice.x} y={c.vertice.y} attach={funcao.tipo === 'quadratica' && funcao.a > 0 ? 's' : 'n'} attachDistance={14} size={14}>
              {`V(${fmt(c.vertice.x)}; ${fmt(c.vertice.y)})`}
            </Text>
          )}
        </g>
      )}
      {mostra('intercepto') && c.interceptoY !== null && (
        <g>
          <Point x={0} y={c.interceptoY} color="var(--ink)" />
          {valores && (
            <Text x={0} y={c.interceptoY} attach="ne" attachDistance={10} size={14}>
              {`(0; ${fmt(c.interceptoY)})`}
            </Text>
          )}
        </g>
      )}
      {children}
    </Cena>
  )
}
