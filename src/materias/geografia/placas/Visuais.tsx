import { useId } from 'react'
import { larguraTexto } from '@/lib/rotulos'
import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { ALTURA, LARGURA, LIMITES, NIVEL_MAR, descreverCena, idadeDaCrosta, montarCena, type CorForma, type Crosta, type IdLimite } from './calculo'

const COR: Record<CorForma, string> = {
  oceanica: 'var(--geo-oceano)',
  continental: 'var(--geo-continente)',
  nova: 'var(--geo-nova)',
  magma: 'var(--geo-magma)',
  agua: 'var(--geo-agua)',
  lito: 'var(--geo-lito)',
  sedimento: 'var(--geo-sedimento)',
}

const TEXTO = { fill: 'var(--ink)', stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' as const, fontWeight: 600 }

type P = [number, number]
const pts = (p: P[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

/** Curva suave (Catmull-Rom convertida em Bézier) passando pelos pontos. */
function caminhoSuave(p: P[]): string {
  if (p.length < 2) return ''
  let d = `M ${p[0]![0]} ${p[0]![1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)] as P
    const b = p[i] as P
    const c = p[i + 1] as P
    const e = p[Math.min(p.length - 1, i + 2)] as P
    d += ` C ${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)}, ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)}, ${c[0]} ${c[1]}`
  }
  return d
}

/** Vulcão em cone (estratovulcão): encostas côncavas e cratera no topo. */
function Vulcao({ x, w, base, h }: { x: number; w: number; base: number; h: number }) {
  const cx = x + w / 2
  const topo = base - h
  return (
    <g>
      <path
        d={`M ${x} ${base} Q ${x + w * 0.36} ${base - h * 0.18} ${cx - 4} ${topo} L ${cx - 1.5} ${topo + 2.5} L ${cx + 1.5} ${topo + 2.5} L ${cx + 4} ${topo} Q ${x + w * 0.64} ${base - h * 0.18} ${x + w} ${base} Z`}
        fill="var(--geo-vulcao)"
        stroke="var(--ink)"
        strokeOpacity={0.7}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* camadas de lava e cinza */}
      <path d={`M ${x + w * 0.2} ${base - h * 0.2} Q ${cx} ${base - h * 0.32} ${x + w * 0.8} ${base - h * 0.2}`} fill="none" stroke="var(--ink)" strokeOpacity={0.25} />
      <path d={`M ${cx - 3.5} ${topo} q 3.5 -9 7 0`} fill="var(--geo-magma)" />
    </g>
  )
}

/** Marca de terremoto (hipocentro): estrela pequena. */
const Sismo = ({ x, y }: { x: number; y: number }) => (
  <path d={`M ${x} ${y - 5} L ${x + 1.4} ${y - 1.4} L ${x + 5} ${y} L ${x + 1.4} ${y + 1.4} L ${x} ${y + 5} L ${x - 1.4} ${y + 1.4} L ${x - 5} ${y} L ${x - 1.4} ${y - 1.4} Z`} fill="var(--erro)" stroke="var(--surface)" strokeWidth={0.8} />
)

/** Corte (ou vista de cima, nas falhas transformantes) de um limite entre placas. `progresso` vai de 0 a 1. */
export function CorteSvg({ limite, progresso, ordem = ['oceanica', 'continental'], rotulo }: { limite: IdLimite; progresso: number; ordem?: [Crosta, Crosta]; rotulo?: string }) {
  const id = useId().replace(/:/g, '')
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  // em telas estreitas, só os rótulos essenciais: os demais estão na legenda e no texto
  const estreito = largura < 420
  const cena = montarCena(limite, progresso, ordem)
  const planta = cena.modo === 'planta'
  const solidas = cena.formas.filter((f) => f.cor !== 'agua')
  const aguas = cena.formas.filter((f) => f.cor === 'agua')
  const rotulos = cena.rotulos.filter((r) => !estreito || r.prioridade !== 2)
  return (
    <svg ref={ref} viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={rotulo ?? descreverCena(limite, progresso)} className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <defs>
        <marker id={`seta-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
        </marker>
        <marker id={`fluxo-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9" fill="none" stroke="var(--ink)" strokeOpacity={0.6} strokeWidth={1.6} />
        </marker>
        <linearGradient id={`manto-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--geo-manto)" stopOpacity={0.28} />
          <stop offset="1" stopColor="var(--geo-manto)" stopOpacity={0.7} />
        </linearGradient>
        <pattern id={`textura-${id}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1" fill="var(--ink)" fillOpacity={0.12} />
          <circle cx="10" cy="11" r="1" fill="var(--ink)" fillOpacity={0.12} />
        </pattern>
      </defs>
      {planta ? (
        <rect x={0} y={0} width={LARGURA} height={ALTURA} fill="var(--geo-ar)" />
      ) : (
        <>
          <rect x={0} y={NIVEL_MAR} width={LARGURA} height={ALTURA - NIVEL_MAR} fill="var(--surface)" />
          <rect x={0} y={NIVEL_MAR} width={LARGURA} height={ALTURA - NIVEL_MAR} fill={`url(#manto-${id})`} />
          <rect x={0} y={0} width={LARGURA} height={NIVEL_MAR} fill="var(--geo-ar)" />
        </>
      )}
      {/* correntes no manto */}
      {cena.fluxo.map((f, i) => (
        <path key={i} d={caminhoSuave(f)} fill="none" stroke="var(--ink)" strokeOpacity={0.45} strokeWidth={1.6} strokeDasharray="5 4" markerEnd={`url(#fluxo-${id})`} />
      ))}
      {/* placas: litosfera, crostas, magma e sedimentos */}
      {solidas.map((f) => (
        <g key={f.id}>
          {f.id.startsWith('fusao') ? (
            <polygon points={pts(f.pontos)} fill={COR[f.cor]} fillOpacity={0.32} stroke="var(--geo-magma)" strokeWidth={1.2} strokeDasharray="4 3" />
          ) : (
            <polygon points={pts(f.pontos)} fill={COR[f.cor]} fillOpacity={f.cor === 'magma' ? 0.9 : 1} stroke="var(--ink)" strokeOpacity={0.5} strokeWidth={1.1} strokeLinejoin="round" />
          )}
          {(f.cor === 'continental' || f.cor === 'lito' || planta) && <polygon points={pts(f.pontos)} fill={`url(#textura-${id})`} stroke="none" />}
        </g>
      ))}
      {cena.zonaSismica && <polygon points={pts(cena.zonaSismica)} fill="var(--erro)" fillOpacity={0.12} stroke="var(--erro)" strokeOpacity={0.35} strokeDasharray="3 3" />}
      {cena.linhas.map((l, i) =>
        l.tipo === 'dobra' ? (
          <path key={i} d={caminhoSuave(l.pontos)} fill="none" stroke="var(--ink)" strokeOpacity={0.35} strokeWidth={1.3} />
        ) : (
          <polyline key={i} points={pts(l.pontos)} fill="none" stroke="var(--ink)" strokeWidth={l.tipo === 'sutura' ? 2 : 1.8} strokeDasharray={l.tipo === 'sutura' ? '6 4' : undefined} strokeOpacity={0.8} />
        ),
      )}
      {/* magma: câmaras, condutos e gotas da fusão parcial */}
      {cena.condutos.map((c, i) => (
        <polyline key={i} points={pts(c)} fill="none" stroke="var(--geo-magma)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {cena.camaras.map((m, i) => (
        <ellipse key={i} cx={m.x} cy={m.y} rx={m.rx} ry={m.ry} fill="var(--geo-magma)" stroke="var(--ink)" strokeOpacity={0.5} />
      ))}
      {cena.gotas.map(([x, y], i) => (
        <path key={i} d={`M ${x} ${y - 4.5} C ${x + 3.2} ${y - 0.5}, ${x + 3} ${y + 3}, ${x} ${y + 3} C ${x - 3} ${y + 3}, ${x - 3.2} ${y - 0.5}, ${x} ${y - 4.5} Z`} fill="var(--geo-magma)" />
      ))}
      {cena.vulcoes.map((v, i) => (
        <Vulcao key={i} {...v} />
      ))}
      {/* água por cima, translúcida: o que está submerso aparece tingido */}
      {aguas.map((f) => (
        <polygon key={f.id} points={pts(f.pontos)} fill="var(--geo-agua)" fillOpacity={0.62} stroke="var(--geo-frio)" strokeOpacity={0.35} strokeWidth={1} />
      ))}
      {planta && (
        <>
          <rect x={314} y={30} width={12} height={ALTURA - 60} fill="var(--erro)" fillOpacity={0.12} />
          <line x1={320} y1={30} x2={320} y2={ALTURA - 30} stroke="var(--erro)" strokeWidth={3} strokeDasharray="8 5" />
          {cena.formas.map((f, i) => (
            <text key={f.id} x={(f.pontos[0] as P)[0] + 10} y={(f.pontos[0] as P)[1] + fs(13) + 6} fontSize={fs(13)} {...TEXTO} fill="var(--paper)" stroke="none">
              {i === 0 ? 'placa A' : 'placa B'}
            </text>
          ))}
          <EstradaDeslocada d={cena.deslocamento} />
          <RioDeslocado d={cena.deslocamento} />
        </>
      )}
      {cena.sismos.map(([x, y], i) => (
        <Sismo key={i} x={x} y={y} />
      ))}
      {cena.setas.map((s, i) => (
        <line key={i} x1={s.de[0]} y1={s.de[1]} x2={s.para[0]} y2={s.para[1]} stroke="var(--ink)" strokeWidth={3} markerEnd={`url(#seta-${id})`} />
      ))}
      {!planta && (
        <g fontSize={fs(12)} fill="var(--ink)">
          <line x1={0} y1={NIVEL_MAR} x2={LARGURA} y2={NIVEL_MAR} stroke="var(--ink)" strokeOpacity={0.35} strokeDasharray="4 4" />
          <text x={LARGURA - 8} y={NIVEL_MAR - 5} textAnchor="end" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke" fillOpacity={0.8}>
            nível do mar
          </text>
          <text x={8} y={fs(12) + 2} fill="var(--ink-muted)" fontSize={fs(11)}>
            fora de escala
          </text>
        </g>
      )}
      {/* rótulos: linha fina até o que indicam */}
      {rotulos.map((r) => {
        if (!r.alvo) return null
        // a linha sai da borda da caixa do texto mais próxima do alvo, e não atravessa o texto
        const f = fs(14)
        const w = larguraTexto(r.texto, f, true)
        const x0 = r.ancora === 'end' ? r.x - w : r.ancora === 'middle' ? r.x - w / 2 : r.x
        const [ax, ay] = r.alvo
        const sx = Math.min(Math.max(ax, x0 - 3), x0 + w + 3)
        const sy = Math.min(Math.max(ay, r.y - f * 0.8), r.y + 3)
        const dentroX = ax > x0 - 3 && ax < x0 + w + 3
        return (
          <g key={`l-${r.texto}`} stroke="var(--ink)" strokeOpacity={0.75}>
            <line x1={sx} y1={dentroX ? (ay > r.y ? r.y + 4 : r.y - f * 0.85) : sy} x2={ax} y2={ay} strokeWidth={1.1} />
            <circle cx={ax} cy={ay} r={2.4} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1} />
          </g>
        )
      })}
      {rotulos.map((r) => (
        <text key={r.texto} x={r.x} y={r.y} textAnchor={r.ancora ?? 'start'} {...TEXTO} fontSize={fs(14)}>
          {r.texto}
        </text>
      ))}
    </svg>
  )
}

/** Uma estrada reta que cruza a falha: também fica cortada e deslocada. */
function EstradaDeslocada({ d }: { d: number }) {
  return (
    <g fill="none" strokeLinecap="round">
      {[
        [40, 316, 96 - d / 2],
        [324, 600, 96 + d / 2],
      ].map(([x0, x1, y]) => (
        <g key={x0}>
          <line x1={x0} x2={x1} y1={y} y2={y} stroke="var(--ink-muted)" strokeWidth={7} />
          <line x1={x0} x2={x1} y1={y} y2={y} stroke="var(--surface)" strokeWidth={1.5} strokeDasharray="8 6" />
        </g>
      ))}
    </g>
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
          ['var(--geo-lito)', 'manto da litosfera (rígido)'],
          ['var(--geo-manto)', 'astenosfera (quente, plástica)'],
          ['var(--geo-magma)', 'magma'],
        ]
    ).map(([cor, nome]) => (
      <li key={nome} className="flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-[var(--line-strong)]" style={{ background: cor }} /> {nome}
      </li>
    ))}
    <li className="flex items-center gap-1.5">
      <svg aria-hidden="true" width="12" height="12" viewBox="-6 -6 12 12">
        <Sismo x={0} y={0} />
      </svg>
      terremoto
    </li>
  </ul>
)


/** Camadas da Terra em corte, fora de escala. */
/** Fatia de pizza (setor circular) de raio r entre os ângulos a0 e a1 (graus, sentido da tela). */
function setor(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)].map((n) => n.toFixed(1)).join(' ')
  return `M ${cx} ${cy} L ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)} Z`
}

/** Raios das camadas, proporcionais aos reais (raio da Terra: 6.371 km); só a crosta foi engrossada para aparecer. */
const RAIO = 118
const CAMADAS = [
  { id: 'crosta', r: RAIO, cor: 'var(--geo-continente)', op: 1 },
  { id: 'manto', r: RAIO - 4, cor: 'var(--geo-manto)', op: 0.5 },
  // abaixo de ~660 km, o manto inferior
  { id: 'manto', r: RAIO * (1 - 660 / 6371), cor: 'var(--geo-manto)', op: 0.85 },
  // núcleo externo: de ~2.900 km até ~5.150 km de profundidade
  { id: 'nucleo', r: RAIO * (3480 / 6371), cor: 'var(--geo-magma)', op: 0.95 },
  { id: 'nucleo', r: RAIO * (1221 / 6371), cor: 'var(--luz)', op: 1 },
]

/** Terra com uma fatia recortada, mostrando as camadas; o rótulo de cada uma aponta para dentro do recorte. */
export function CamadasSvg({ destaque = null }: { destaque?: 'crosta' | 'manto' | 'nucleo' | 'litosfera' | null }) {
  const id = useId().replace(/:/g, '')
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const aberta = (nome: string) => (destaque === null || destaque === 'litosfera' || destaque === nome ? 1 : 0.3)
  const cx = 150
  const cy = 140
  const A0 = -80
  const A1 = 6
  const noRecorte = (r: number): P => [cx + r * Math.cos((-36 * Math.PI) / 180), cy + r * Math.sin((-36 * Math.PI) / 180)]
  const rotulos: { texto: string; y: number; r: number; camada: string }[] = [
    { texto: 'crosta (5 a 70 km)', y: 34, r: RAIO - 1.5, camada: 'crosta' },
    { texto: 'manto (até ~2.900 km)', y: 88, r: RAIO * 0.78, camada: 'manto' },
    { texto: 'núcleo externo, líquido', y: 142, r: RAIO * 0.4, camada: 'nucleo' },
    { texto: 'núcleo interno, sólido (o centro)', y: 196, r: RAIO * 0.09, camada: 'nucleo' },
  ]
  return (
    <svg
      ref={ref}
      viewBox="0 0 640 280"
      role="img"
      aria-label="Terra com uma fatia recortada: crosta muito fina por fora, manto espesso, núcleo externo líquido e núcleo interno sólido, com os raios em proporção. A litosfera reúne a crosta e a parte superior rígida do manto, e se apoia sobre a astenosfera."
      className="block h-auto w-full rounded-lg border border-[var(--line)]"
    >
      <defs>
        <radialGradient id={`planeta-${id}`} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="var(--geo-agua)" />
          <stop offset="1" stopColor="var(--geo-oceano)" />
        </radialGradient>
        <clipPath id={`disco-${id}`}>
          <circle cx={cx} cy={cy} r={RAIO} />
        </clipPath>
      </defs>
      <rect width={640} height={280} fill="var(--surface)" />
      {/* a superfície: oceanos e continentes */}
      <circle cx={cx} cy={cy} r={RAIO} fill={`url(#planeta-${id})`} />
      <g clipPath={`url(#disco-${id})`} fill="var(--geo-verde)" fillOpacity={0.85}>
        <path d={`M ${cx - 96} ${cy + 10} q 18 -40 52 -36 q 20 4 10 30 q -8 24 4 46 q -22 22 -48 -4 q -24 -14 -18 -36 Z`} />
        <path d={`M ${cx - 20} ${cy + 64} q 30 -12 48 6 q 10 22 -16 36 q -30 10 -40 -14 q -4 -18 8 -28 Z`} />
      </g>
      {/* o recorte: camadas em fatias, de fora para dentro */}
      {CAMADAS.map((c, i) => (
        <path key={i} d={setor(cx, cy, c.r, A0, A1)} fill={c.cor} fillOpacity={c.op} opacity={aberta(c.id)} stroke="var(--ink)" strokeOpacity={0.35} strokeWidth={1} />
      ))}
      <circle cx={cx} cy={cy} r={RAIO} fill="none" stroke="var(--ink)" strokeOpacity={0.5} />
      {/* litosfera: casca rígida de fora, quebrada em placas */}
      {destaque === 'litosfera' && <circle cx={cx} cy={cy} r={RAIO + 4} fill="none" stroke="var(--ink)" strokeWidth={2.5} strokeDasharray="3 5" strokeLinecap="round" />}
      {rotulos.map((r) => {
        const [ax, ay] = noRecorte(r.r)
        return (
          <g key={r.texto} opacity={aberta(r.camada)}>
            <line x1={318} y1={r.y - fs(14) * 0.35} x2={ax} y2={ay} stroke="var(--ink)" strokeOpacity={0.75} />
            <circle cx={ax} cy={ay} r={2.4} fill="var(--ink)" stroke="var(--surface)" />
            <text x={324} y={r.y} {...TEXTO} fontSize={fs(14)}>
              {r.texto}
            </text>
          </g>
        )
      })}
      {destaque === 'litosfera' && (
        <text x={324} y={250} {...TEXTO} fontSize={fs(14)}>
          <tspan>tracejado: a litosfera, quebrada em placas</tspan>
        </text>
      )}
      <text x={632} y={272} textAnchor="end" fontSize={fs(11)} fill="var(--ink-muted)">
        raios em proporção; a crosta foi engrossada para aparecer
      </text>
    </svg>
  )
}

/** Zoom nos primeiros ~350 km: a litosfera (crosta + manto rígido) é a placa; abaixo, a astenosfera. Escala de profundidade linear. */
export function LitosferaSvg() {
  const id = useId().replace(/:/g, '')
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const yS = 34
  const k = 0.5 // px por km
  const y = (km: number) => yS + km * k
  const meio = 330
  return (
    <svg ref={ref} viewBox="0 0 640 226" role="img" aria-label="Zoom nos primeiros 350 quilômetros abaixo da superfície, em escala: crosta oceânica fina e crosta continental mais grossa, apoiadas no manto rígido; juntas formam a litosfera, de cerca de 100 km, que é a placa. Abaixo fica a astenosfera, quente e plástica." className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <defs>
        <linearGradient id={`asteno-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--geo-manto)" stopOpacity={0.75} />
          <stop offset="1" stopColor="var(--geo-manto)" stopOpacity={0.2} />
        </linearGradient>
      </defs>
      <rect width={640} height={226} fill="var(--surface)" />
      {/* água sobre o lado oceânico */}
      <rect x={60} y={yS - 14} width={meio - 60} height={14} fill="var(--geo-agua)" fillOpacity={0.7} />
      {/* astenosfera, sem base definida no desenho */}
      <rect x={60} y={y(100)} width={570} height={226 - y(100)} fill={`url(#asteno-${id})`} />
      {/* manto rígido (parte da litosfera) */}
      <rect x={60} y={yS} width={570} height={y(100) - yS} fill="var(--geo-lito)" />
      {/* crostas: oceânica (engrossada para aparecer) e continental */}
      <rect x={60} y={yS} width={meio - 60} height={Math.max(5, 7 * k)} fill="var(--geo-oceano)" />
      <rect x={meio} y={yS} width={630 - meio} height={35 * k} fill="var(--geo-continente)" />
      <line x1={60} x2={630} y1={y(100)} y2={y(100)} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="6 4" />
      {/* régua de profundidade */}
      <g fontSize={fs(11)} fill="var(--ink-muted)" textAnchor="end">
        <line x1={50} x2={50} y1={yS} y2={y(350)} stroke="var(--ink-muted)" />
        {[0, 100, 200, 300].map((km) => (
          <g key={km}>
            <line x1={45} x2={50} y1={y(km)} y2={y(km)} stroke="var(--ink-muted)" />
            <text x={42} y={y(km) + 4}>
              {km === 0 ? '0' : `${km}`}
            </text>
          </g>
        ))}
        <text x={42} y={y(350) + 4}>
          km
        </text>
      </g>
      <text x={68} y={yS - 20} {...TEXTO} fontSize={fs(13)}>
        crosta oceânica (5 a 10 km)
      </text>
      <text x={meio + 8} y={yS + 13} {...TEXTO} fontSize={fs(13)}>
        crosta continental (30 a 70 km)
      </text>
      <text x={200} y={y(60)} textAnchor="middle" {...TEXTO} fontSize={fs(13)}>
        manto rígido
      </text>
      {/* chave da litosfera */}
      <path d={`M 612 ${yS} h 8 V ${y(100)} h -8`} fill="none" stroke="var(--ink)" strokeWidth={1.8} />
      <text x={604} y={y(86)} textAnchor="end" {...TEXTO} fontSize={fs(14)}>
        litosfera (~100 km) = a placa
      </text>
      <text x={345} y={y(200)} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
        astenosfera: quente e plástica; a placa desliza sobre ela
      </text>
    </svg>
  )
}

/** Faixa de idade do assoalho oceânico, simétrica em torno da dorsal. */
export function AssoalhoSvg({ meiaTaxa, posicaoKm, alcanceKm }: { meiaTaxa: number; posicaoKm: number; alcanceKm: number }) {
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const W = 640
  const x = (km: number) => W / 2 + (km / alcanceKm) * (W / 2 - 24)
  const faixas = 20
  const idade = idadeDaCrosta(posicaoKm, meiaTaxa)
  return (
    <svg ref={ref} viewBox={`0 0 ${W} 170`} role="img" aria-label={`Faixas simétricas de idade do assoalho oceânico, com a dorsal no centro. Com meia-taxa de ${meiaTaxa} cm por ano, a crosta a ${Math.abs(posicaoKm)} km da dorsal tem cerca de ${idade.toFixed(0)} milhões de anos.`} className="block h-auto w-full rounded-lg border border-[var(--line)]">
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
      <text x={W / 2} y={22} textAnchor="middle" fontSize={fs(14)} fontWeight={600} fill="var(--ink)">
        dorsal (idade 0)
      </text>
      <path d={`M ${x(posicaoKm)} 126 l -7 -12 h 14 z`} fill="var(--ink)" />
      <text x={Math.min(Math.max(x(posicaoKm), 70), W - 70)} y={146} textAnchor="middle" fontSize={fs(14)} fontWeight={600} fill="var(--ink)">
        {Math.abs(posicaoKm)} km · {idade.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Ma
      </text>
      <text x={14} y={162} fontSize={fs(12)} fill="var(--ink-muted)">
        mais velha ←
      </text>
      <text x={W - 14} y={162} textAnchor="end" fontSize={fs(12)} fill="var(--ink-muted)">
        → mais velha
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
