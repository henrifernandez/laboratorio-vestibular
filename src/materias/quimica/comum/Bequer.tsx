import { useId, type ReactNode } from 'react'

interface Props {
  /** volume de líquido em mL; null = desconhecido (copo tracejado) */
  volume: number | null
  /** volume (mL) que corresponde ao topo da escala */
  vmax?: number
  /** de 0 a 1: quanto mais perto de 1, mais escura a solução; null = desconhecida */
  intensidade: number | null
  /** partículas de soluto dissolvidas no líquido */
  particulas?: number
  /** partículas de soluto sem dissolver, no fundo (corpo de fundo) */
  solido?: number
  /** texto lido por leitores de tela */
  descricao: string
  largura?: number
  cor?: string
}

const frac = (x: number) => x - Math.floor(x)

/** Béquer em SVG: nível do líquido ∝ volume, cor ∝ concentração, pontos = partículas de soluto. */
export function Bequer({ volume, vmax = 1000, intensidade, particulas = 0, solido = 0, descricao, largura = 96, cor = 'var(--accent)' }: Props) {
  const id = useId()
  const topo = 12
  const base = 118
  const altura = base - topo
  const nivel = volume === null ? 0.7 : Math.min(1, Math.max(0.06, volume / vmax))
  const yLiquido = base - altura * nivel
  const mistura = intensidade === null ? 'var(--surface-2)' : `color-mix(in srgb, ${cor} ${Math.round(14 + 62 * Math.min(1, Math.max(0, intensidade)))}%, var(--surface))`
  const pontos: ReactNode[] = []
  for (let i = 0; i < particulas; i++) {
    const x = 26 + frac(i * 0.6180339887 + 0.13) * 48
    const y = yLiquido + 5 + frac(i * 0.7548776662 + 0.29) * Math.max(2, base - yLiquido - 14)
    pontos.push(<circle key={`p${i}`} cx={x} cy={y} r={2.3} fill="var(--ink)" opacity={0.85} />)
  }
  for (let i = 0; i < solido; i++) {
    const x = 26 + frac(i * 0.6180339887 + 0.41) * 48
    const y = base - 4 - frac(i * 0.7548776662 + 0.07) * 7
    pontos.push(<rect key={`s${i}`} x={x - 2.4} y={y - 2.4} width={4.8} height={4.8} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1} />)
  }
  return (
    <svg viewBox="0 0 100 132" width={largura} role="img" aria-label={descricao} className="block shrink-0">
      <defs>
        <clipPath id={`${id}-copo`}>
          <path d={`M22 ${topo} V${base - 13} Q22 ${base} 35 ${base} H65 Q78 ${base} 78 ${base - 13} V${topo} Z`} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-copo)`}>
        <rect x={18} y={yLiquido} width={64} height={base - yLiquido + 2} fill={mistura} />
        {volume === null && (
          <text x={50} y={yLiquido + (base - yLiquido) / 2 + 8} textAnchor="middle" fontSize={26} fontWeight={700} fill="var(--ink-muted)">?</text>
        )}
        {pontos}
      </g>
      <path d={`M22 ${topo} V${base - 13} Q22 ${base} 35 ${base} H65 Q78 ${base} 78 ${base - 13} V${topo}`} fill="none" stroke="var(--ink-muted)" strokeWidth={2.2} strokeLinecap="round" strokeDasharray={volume === null ? '5 4' : undefined} />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={22} x2={30} y1={base - altura * f} y2={base - altura * f} stroke="var(--ink-muted)" strokeWidth={1.2} />
      ))}
      <line x1={18} x2={82} y1={topo} y2={topo} stroke="var(--ink-muted)" strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  )
}
