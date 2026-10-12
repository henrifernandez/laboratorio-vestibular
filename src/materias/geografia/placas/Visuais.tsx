import { useId } from 'react'
import { ALTURA, LARGURA, LIMITES, NIVEL_MAR, descreverCena, idadeDaCrosta, montarCena, type CorForma, type Crosta, type IdLimite } from './calculo'

const COR: Record<CorForma, string> = {
  oceanica: 'var(--geo-oceano)',
  continental: 'var(--geo-continente)',
  nova: 'var(--geo-nova)',
  magma: 'var(--geo-magma)',
  agua: 'var(--geo-agua)',
}

const TEXTO = { fill: 'var(--ink)', stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' as const, fontSize: 15, fontWeight: 600 }

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

/** Corte (ou vista de cima, nas falhas transformantes) de um limite entre placas. `progresso` vai de 0 a 1. */
export function CorteSvg({ limite, progresso, ordem = ['oceanica', 'continental'], rotulo }: { limite: IdLimite; progresso: number; ordem?: [Crosta, Crosta]; rotulo?: string }) {
  const id = useId().replace(/:/g, '')
  const cena = montarCena(limite, progresso, ordem)
  const planta = cena.modo === 'planta'
  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={rotulo ?? descreverCena(limite, progresso)} className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <defs>
        <marker id={`seta-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
        </marker>
      </defs>
      {planta ? (
        <rect x={0} y={0} width={LARGURA} height={ALTURA} fill="var(--geo-ar)" />
      ) : (
        <>
          <rect x={0} y={0} width={LARGURA} height={ALTURA} fill="var(--geo-manto)" fillOpacity={0.45} />
          <rect x={0} y={0} width={LARGURA} height={NIVEL_MAR} fill="var(--geo-ar)" />
          <text x={LARGURA - 8} y={ALTURA - 10} textAnchor="end" fill="var(--ink-muted)" fontSize={13}>
            manto (rocha quente e pastosa)
          </text>
        </>
      )}
      {cena.formas.map((f) => (
        <polygon key={f.id} points={pts(f.pontos)} fill={COR[f.cor]} fillOpacity={f.cor === 'agua' ? 0.75 : 1} stroke="var(--ink)" strokeOpacity={0.55} strokeWidth={1.2} strokeLinejoin="round" />
      ))}
      {cena.vulcoes.map((v, i) => (
        <g key={i}>
          <polygon points={`${v.x},${v.base} ${v.x + v.w / 2},${v.base - v.h} ${v.x + v.w},${v.base}`} fill="var(--geo-continente)" stroke="var(--ink)" strokeOpacity={0.7} strokeWidth={1.2} />
          <circle cx={v.x + v.w / 2} cy={v.base - v.h - 4} r={4} fill="var(--geo-magma)" />
        </g>
      ))}
      {cena.sismos.map(([x, y], i) => (
        <g key={i} stroke="var(--erro)" strokeWidth={2.4} strokeLinecap="round">
          <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
          <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} />
        </g>
      ))}
      {cena.setas.map((s, i) => (
        <line key={i} x1={s.de[0]} y1={s.de[1]} x2={s.para[0]} y2={s.para[1]} stroke="var(--ink)" strokeWidth={3} markerEnd={`url(#seta-${id})`} />
      ))}
      {planta && (
        <>
          <line x1={320} y1={30} x2={320} y2={ALTURA - 30} stroke="var(--erro)" strokeWidth={3} strokeDasharray="8 5" />
          <RioDeslocado d={cena.deslocamento} />
        </>
      )}
      {cena.rotulos.map((r) => (
        <text key={r.texto} x={r.x} y={r.y} textAnchor={r.ancora ?? 'start'} {...TEXTO}>
          {r.texto}
        </text>
      ))}
      {!planta && (
        <g fontSize={12} fill="var(--ink)">
          <text x={8} y={NIVEL_MAR - 6} stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
            nível do mar
          </text>
          <line x1={0} y1={NIVEL_MAR} x2={LARGURA} y2={NIVEL_MAR} stroke="var(--ink)" strokeOpacity={0.4} strokeDasharray="4 4" />
        </g>
      )}
    </svg>
  )
}

/** Um rio que atravessa a falha: a parte da direita sobe `d` unidades em relação à da esquerda. */
function RioDeslocado({ d }: { d: number }) {
  return (
    <g fill="none" stroke="var(--geo-frio)" strokeWidth={4} strokeLinecap="round">
      <path d={`M 40 ${150 - d / 2} C 120 ${120 - d / 2}, 220 ${180 - d / 2}, 316 ${150 - d / 2}`} />
      <path d={`M 324 ${150 + d / 2} C 420 ${120 + d / 2}, 520 ${180 + d / 2}, 600 ${150 + d / 2}`} />
    </g>
  )
}

export const LegendaCorte = ({ planta = false }: { planta?: boolean }) => (
  <ul className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-sm text-[var(--ink-muted)]">
    {(planta
      ? [
          ['var(--geo-oceano)', 'placa A'],
          ['var(--geo-continente)', 'placa B'],
        ]
      : [
          ['var(--geo-oceano)', 'crosta oceânica'],
          ['var(--geo-continente)', 'crosta continental'],
          ['var(--geo-nova)', 'crosta nova'],
          ['var(--geo-magma)', 'magma'],
        ]
    ).map(([cor, nome]) => (
      <li key={nome}>
        <span aria-hidden="true" style={{ color: cor }}>■</span> {nome}
      </li>
    ))}
    <li>
      <span aria-hidden="true" style={{ color: 'var(--erro)' }}>×</span> terremoto
    </li>
  </ul>
)

/** Camadas da Terra em corte, fora de escala. */
export function CamadasSvg({ destaque = null }: { destaque?: 'crosta' | 'manto' | 'nucleo' | 'litosfera' | null }) {
  const aberta = (nome: string) => (destaque === null || destaque === nome ? 1 : 0.35)
  return (
    <svg viewBox="0 0 640 260" role="img" aria-label="Corte da Terra em camadas, fora de escala: crosta muito fina por fora, manto espesso, núcleo externo líquido e núcleo interno sólido. A litosfera reúne a crosta e a parte superior rígida do manto, e flutua sobre a astenosfera." className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <rect width={640} height={260} fill="var(--surface)" />
      <circle cx={170} cy={130} r={118} fill="var(--geo-continente)" opacity={aberta('crosta')} stroke="var(--ink)" strokeOpacity={0.5} />
      <circle cx={170} cy={130} r={106} fill="var(--geo-manto)" opacity={aberta('manto')} stroke="var(--ink)" strokeOpacity={0.5} />
      <circle cx={170} cy={130} r={62} fill="var(--geo-magma)" opacity={aberta('nucleo')} stroke="var(--ink)" strokeOpacity={0.5} />
      <circle cx={170} cy={130} r={26} fill="var(--surface)" opacity={aberta('nucleo')} stroke="var(--ink)" strokeOpacity={0.6} />
      <g fontSize={15} fill="var(--ink)" fontWeight={600}>
        <text x={330} y={44} {...TEXTO}>crosta (5 a 70 km)</text>
        <line x1={326} y1={40} x2={262} y2={34} stroke="var(--ink)" />
        <text x={330} y={100} {...TEXTO}>manto (até cerca de 2.900 km)</text>
        <line x1={326} y1={96} x2={248} y2={100} stroke="var(--ink)" />
        <text x={330} y={160} {...TEXTO}>núcleo externo (líquido)</text>
        <line x1={326} y1={156} x2={218} y2={140} stroke="var(--ink)" />
        <text x={330} y={216} {...TEXTO}>núcleo interno (sólido)</text>
        <line x1={326} y1={212} x2={186} y2={140} stroke="var(--ink)" />
      </g>
      <g opacity={aberta('litosfera')}>
        <path d="M 170 4 A 126 126 0 0 1 296 130" fill="none" stroke="var(--ink)" strokeWidth={3} strokeDasharray="2 5" strokeLinecap="round" />
        <text x={560} y={244} textAnchor="end" fontSize={13} fill="var(--ink-muted)">pontilhado: litosfera (crosta + manto superior rígido)</text>
      </g>
    </svg>
  )
}

/** Faixa de idade do assoalho oceânico, simétrica em torno da dorsal. */
export function AssoalhoSvg({ meiaTaxa, posicaoKm, alcanceKm }: { meiaTaxa: number; posicaoKm: number; alcanceKm: number }) {
  const W = 640
  const idadeMax = idadeDaCrosta(alcanceKm, meiaTaxa)
  const x = (km: number) => W / 2 + (km / alcanceKm) * (W / 2 - 24)
  const faixas = 20
  const idade = idadeDaCrosta(posicaoKm, meiaTaxa)
  return (
    <svg viewBox={`0 0 ${W} 170`} role="img" aria-label={`Faixas simétricas de idade do assoalho oceânico, com a dorsal no centro. Com meia-taxa de ${meiaTaxa} cm por ano, a crosta a ${Math.abs(posicaoKm)} km da dorsal tem cerca de ${idade.toFixed(0)} milhões de anos.`} className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <rect width={W} height={170} fill="var(--surface)" />
      {Array.from({ length: faixas * 2 }, (_, i) => {
        const k = i < faixas ? i - faixas : i - faixas + 1
        const a = (k - (k > 0 ? 1 : 0)) / faixas
        const b = (k + (k < 0 ? 1 : 0)) / faixas
        const km0 = Math.min(a, b) * alcanceKm
        const km1 = Math.max(a, b) * alcanceKm
        const meio = Math.abs((km0 + km1) / 2)
        const t = Math.min(1, meio / alcanceKm)
        return <rect key={i} x={x(km0)} y={40} width={x(km1) - x(km0) + 0.5} height={64} fill="var(--geo-nova)" fillOpacity={0.25 + 0.75 * t} />
      })}
      <line x1={W / 2} y1={30} x2={W / 2} y2={114} stroke="var(--geo-magma)" strokeWidth={4} />
      <text x={W / 2} y={22} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">
        dorsal (idade 0)
      </text>
      <path d={`M ${x(posicaoKm)} 126 l -7 -12 h 14 z`} fill="var(--ink)" />
      <text x={Math.min(Math.max(x(posicaoKm), 70), W - 70)} y={146} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">
        {Math.abs(posicaoKm)} km · {idade.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Ma
      </text>
      <text x={14} y={162} fontSize={12} fill="var(--ink-muted)">
        mais velha ←
      </text>
      <text x={W - 14} y={162} textAnchor="end" fontSize={12} fill="var(--ink-muted)">
        → mais velha ({idadeMax.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Ma na borda)
      </text>
    </svg>
  )
}

/** Cartão com a explicação do tipo de limite. */
export function FichaLimite({ id }: { id: IdLimite }) {
  const l = LIMITES[id]
  return (
    <div className="cartao grid gap-1 p-3">
      <p className="m-0 text-lg font-semibold">{l.nome}</p>
      <p className="m-0">{l.explicacao}</p>
      <dl className="m-0 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <dt className="font-semibold">Forma</dt>
        <dd className="m-0">{l.feicoes.join('; ')}</dd>
        <dt className="font-semibold">Vulcões</dt>
        <dd className="m-0">{l.vulcoes ? 'sim' : 'não (ou quase nenhum)'}</dd>
        <dt className="font-semibold">Terremotos</dt>
        <dd className="m-0">{l.sismos}</dd>
        <dt className="font-semibold">Crosta</dt>
        <dd className="m-0">{l.crosta}</dd>
      </dl>
    </div>
  )
}
