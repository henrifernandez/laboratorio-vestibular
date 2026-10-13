import { useId } from 'react'
import { MASSAS, type IdMassa } from '@/conteudo/geografia/fenomenos'
import { fonteLegivel, useLargura } from '@/lib/useLargura'
import { Mapa, type Quadro } from '../comum/mapa'
import { MEDIDAS_URBANAS, SUPERFICIES, forcaAlisios, intensidadeEnso, faseEnso, NOME_FASE, nivelComMedidas, inclinacaoTermoclina, resultadoOrografico, temperaturaNoCaminho, type Montanha, type PontoPerfil } from './calculo'

const f = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const TEXTO = { fill: 'var(--ink)', stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' as const, fontWeight: 600 }

/* ------------------------------------------------------------------ chuva orográfica */

const W = 640
const H = 300
const NIVEL_MAR = 262
const KM = 52 // px por km de altitude
const X_BASE_ESQ = 70
const X_PICO = 320
const X_BASE_DIR = 570

/** Perfil da serra: subida e descida em curva suave (cosseno), com o pico em X_PICO. Devolve a fração da altura (0 a 1). */
function formaSerra(x: number): number {
  if (x <= X_BASE_ESQ || x >= X_BASE_DIR) return 0
  const [x0, x1] = x <= X_PICO ? [X_BASE_ESQ, X_PICO] : [X_BASE_DIR, X_PICO]
  return 0.5 * (1 - Math.cos((Math.PI * (x - x0)) / (x1 - x0)))
}
/** x da encosta (subida ou descida) em que a serra tem a fração `q` da altura. */
function xNaEncosta(q: number, subida: boolean): number {
  const [x0, x1] = subida ? [X_BASE_ESQ, X_PICO] : [X_BASE_DIR, X_PICO]
  return x0 + ((x1 - x0) * Math.acos(1 - 2 * Math.min(1, Math.max(0, q)))) / Math.PI
}

/** Nuvem de contorno arredondado, com a base reta. */
function Nuvem({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <path
      d={`M ${x} ${y} C ${x - w * 0.08} ${y - h * 0.5}, ${x + w * 0.12} ${y - h * 0.78}, ${x + w * 0.28} ${y - h * 0.62} C ${x + w * 0.34} ${y - h * 1.05}, ${x + w * 0.62} ${y - h * 1.08}, ${x + w * 0.66} ${y - h * 0.66} C ${x + w * 0.8} ${y - h * 0.86}, ${x + w * 1.04} ${y - h * 0.62}, ${x + w} ${y} Z`}
      fill="var(--surface)"
      stroke="var(--ink-muted)"
      strokeWidth={1.2}
    />
  )
}

/** Serra em corte: o ar sobe pelo lado do vento, forma nuvens acima do nível de condensação e desce seco do outro lado. */
export function OrograficaSvg({ montanha, posicao, mostrarResposta = true }: { montanha: Montanha; posicao: number; mostrarResposta?: boolean }) {
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const id = useId().replace(/:/g, '')
  const r = resultadoOrografico(montanha)
  const topoY = NIVEL_MAR - montanha.altura * KM
  const solo = (x: number) => NIVEL_MAR - montanha.altura * KM * formaSerra(x)
  const caminho = temperaturaNoCaminho(montanha, posicao)
  const subindo = posicao <= 1
  const px = xNaEncosta(caminho.z / montanha.altura, subindo)
  const py = solo(px) - 13
  const yCond = NIVEL_MAR - r.zc * KM
  const aria = `Corte de uma serra de ${f(montanha.altura)} km. Ar a ${f(montanha.t0)} °C ao nível do mar sobe pelo lado do vento; ${r.chove ? `a condensação começa a ${f(r.zc, 2)} km, a temperatura no topo é ${f(r.tTopo)} °C e, descendo do outro lado, o ar chega ao nível do mar com ${f(r.tSotavento)} °C` : 'não há condensação, e o ar volta ao nível do mar com a mesma temperatura'}.`
  const ancoraTexto = Math.min(Math.max(px, 90), W - 90)
  const perfil = Array.from({ length: 81 }, (_, i) => {
    const x = X_BASE_ESQ - 10 + ((X_BASE_DIR - X_BASE_ESQ + 20) * i) / 80
    return `${x.toFixed(1)},${solo(x).toFixed(1)}`
  }).join(' ')
  // caminho do ar: acompanha a encosta um pouco acima do chão
  const trilha = Array.from({ length: 41 }, (_, i) => {
    const x = X_BASE_ESQ - 50 + ((X_BASE_DIR - X_BASE_ESQ + 100) * i) / 40
    return `${x.toFixed(1)},${(solo(x) - 13).toFixed(1)}`
  }).join(' ')
  const arvores = r.chove ? [0.12, 0.28, 0.45, 0.62, 0.8].map((q) => xNaEncosta(q * Math.min(1, r.zc / montanha.altura + 0.5), true)) : []
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <defs>
        <marker id={`ar-${id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,1 L9,5 L0,9" fill="none" stroke="var(--ink)" strokeOpacity={0.7} strokeWidth={1.6} />
        </marker>
        <linearGradient id={`serra-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.35" stopColor="var(--geo-verde)" />
          <stop offset="0.55" stopColor="var(--geo-continente)" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="var(--geo-ar)" />
      {/* mar do lado do vento e terra */}
      <rect x={0} y={NIVEL_MAR} width={X_BASE_ESQ - 16} height={H - NIVEL_MAR} fill="var(--geo-agua)" />
      <rect x={X_BASE_ESQ - 16} y={NIVEL_MAR} width={W} height={H - NIVEL_MAR} fill="var(--geo-continente)" opacity={0.75} />
      <polygon points={`${X_BASE_ESQ - 10},${NIVEL_MAR} ${perfil} ${X_BASE_DIR + 10},${NIVEL_MAR}`} fill={r.chove ? `url(#serra-${id})` : 'var(--geo-continente)'} stroke="var(--ink)" strokeOpacity={0.5} />
      {/* encosta úmida com mata; do outro lado, vegetação seca e esparsa */}
      {arvores.map((x) => (
        <g key={x}>
          <line x1={x} x2={x} y1={solo(x)} y2={solo(x) - 9} stroke="var(--geo-continente)" strokeWidth={2} />
          <circle cx={x} cy={solo(x) - 11} r={5.5} fill="var(--geo-verde)" stroke="var(--ink)" strokeOpacity={0.3} />
        </g>
      ))}
      {r.chove &&
        [0.25, 0.55, 0.85].map((q) => {
          const x = xNaEncosta(q, false)
          return <path key={q} d={`M ${x - 5} ${solo(x)} l 2 -6 l 2 4 l 2 -7 l 2 7 l 2 -4 l 2 6`} fill="none" stroke="var(--ink-muted)" strokeWidth={1.5} />
        })}
      {r.chove && (
        <>
          <line x1={0} x2={W} y1={yCond} y2={yCond} stroke="var(--ink)" strokeDasharray="6 5" strokeOpacity={0.55} />
          {/* nuvens que nascem no nível de condensação e acompanham a encosta até o topo, cada uma com a sua chuva */}
          {[0.2, 0.55, 0.9].map((q) => {
            const z = r.zc + (montanha.altura - r.zc) * q
            const x = xNaEncosta(z / montanha.altura, true)
            const base = Math.min(yCond, solo(x) - 16)
            return (
              <g key={q}>
                <g stroke="var(--geo-frio)" strokeWidth={2.2} strokeLinecap="round">
                  {[-14, 0, 14].map((dx) => (
                    <line key={dx} x1={x + dx} y1={base + 3} x2={x + dx - 4} y2={Math.max(base + 6, solo(x + dx - 4) - 3)} />
                  ))}
                </g>
                <Nuvem x={x - 34} y={base} w={68} h={34} />
              </g>
            )
          })}
          <text x={W - 8} y={yCond - 6} textAnchor="end" {...TEXTO} fontSize={fs(13)}>
            condensação a {f(r.zc, 2)} km
          </text>
        </>
      )}
      <polyline points={trilha} fill="none" stroke="var(--ink)" strokeOpacity={0.55} strokeWidth={1.6} strokeDasharray="5 5" markerEnd={`url(#ar-${id})`} />
      <text x={12} y={NIVEL_MAR - 22} {...TEXTO} fontSize={fs(13)}>
        vento úmido →
      </text>
      <text x={12} y={22} {...TEXTO} fontSize={fs(13)}>
        barlavento: úmido
      </text>
      <text x={W - 12} y={22} textAnchor="end" {...TEXTO} fontSize={fs(13)}>
        sotavento: sombra de chuva
      </text>
      {mostrarResposta && (
        <g fontSize={fs(14)} fontWeight={700} fill="var(--ink)">
          <text x={14} y={NIVEL_MAR + fs(14) + 4} {...TEXTO} fontSize={fs(14)}>
            entra: {f(montanha.t0)} °C
          </text>
          <text x={X_PICO} y={Math.max(topoY - 14, fs(14))} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
            topo: {f(r.tTopo)} °C
          </text>
          <text x={W - 14} y={NIVEL_MAR + fs(14) + 4} textAnchor="end" {...TEXTO} fontSize={fs(14)}>
            sai: {f(r.tSotavento)} °C
          </text>
        </g>
      )}
      <circle cx={px} cy={py} r={9} fill={caminho.nuvem ? 'var(--surface)' : 'var(--geo-quente)'} stroke="var(--ink)" strokeWidth={2} />
      <text x={ancoraTexto} y={mostrarResposta && Math.abs(px - X_PICO) < 70 ? py + 34 : Math.max(py - 16, fs(14))} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
        {f(caminho.t)} °C · {f(caminho.z, 2)} km
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ massas de ar */

const EXTENSAO_AMERICA: [[number, number], [number, number]] = [
  [-84, -58],
  [-28, 14],
]

function CamadaMassas({ q, destaque, mostrarTodas }: { q: Quadro; destaque: IdMassa | null; mostrarTodas: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <g>
      <defs>
        <marker id={`m-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
        </marker>
      </defs>
      {MASSAS.filter((m) => mostrarTodas || m.id === destaque).map((m) => {
        const c = q.projetar(m.centro)
        const ex = q.projetar([m.centro[0] + m.raio[0], m.centro[1]])
        const ey = q.projetar([m.centro[0], m.centro[1] + m.raio[1]])
        const fim = q.projetar(m.avanco)
        if (!c || !ex || !ey || !fim) return null
        const rx = Math.abs(ex[0] - c[0])
        const ry = Math.abs(ey[1] - c[1])
        const ativa = destaque === null || destaque === m.id
        const cor = m.temperatura === 'quente' ? 'var(--geo-quente)' : 'var(--geo-frio)'
        return (
          <g key={m.id} opacity={ativa ? 1 : 0.35}>
            <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={cor} fillOpacity={0.4} stroke={cor} strokeWidth={destaque === m.id ? 3.5 : 2.5} strokeDasharray={m.umidade === 'seca' ? '7 5' : undefined} />
            <line x1={c[0]} y1={c[1]} x2={fim[0]} y2={fim[1]} stroke="var(--ink)" strokeWidth={2.5} markerEnd={`url(#m-${id})`} />
            <text x={c[0]} y={c[1] + 5} textAnchor="middle" fontSize={15} {...TEXTO}>
              {m.id}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Mapa da América do Sul com as massas de ar que atuam no Brasil (elipses esquemáticas). */
export function MapaMassas({ destaque = null, mostrarTodas = true }: { destaque?: IdMassa | null; mostrarTodas?: boolean }) {
  return (
    <div className="grid gap-2">
      <Mapa
        extensao={EXTENSAO_AMERICA}
        className="mx-auto w-full max-w-md"
        rotulo={`Mapa da América do Sul com ${mostrarTodas ? 'as cinco massas de ar do Brasil' : 'uma massa de ar'}, em desenho esquemático: ${(mostrarTodas ? MASSAS : MASSAS.filter((m) => m.id === destaque)).map((m) => `${m.nome}, ${m.temperatura} e ${m.umidade}`).join('; ')}.`}
        cor={(p) => (String(p.id) === '076' ? 'var(--geo-brasil)' : undefined)}
        sobre={(q) => <CamadaMassas q={q} destaque={destaque} mostrarTodas={mostrarTodas} />}
      />
      <p className="m-0 text-center text-sm text-[var(--ink-muted)]">
        <span style={{ color: 'var(--geo-quente)' }} aria-hidden="true">●</span> quente · <span style={{ color: 'var(--geo-frio)' }} aria-hidden="true">●</span> fria · contorno contínuo: úmida · tracejado: seca · seta: para onde avança
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ El Niño e La Niña */

const E_MAR = 150
const E_OESTE = 62
const E_LESTE = 586

/** Peixe pequeno (cardume da costa do Peru, que depende da ressurgência). */
const Peixe = ({ x, y }: { x: number; y: number }) => <path d={`M ${x} ${y} q 7 -6 14 0 q -7 6 -14 0 Z M ${x + 14} ${y} l 5 -4 v 8 Z`} fill="var(--ink)" fillOpacity={0.55} />

/**
 * Corte do Pacífico equatorial com a célula de Walker: o ar sobe (nuvens e chuva) sobre a água mais quente e desce seco do outro lado.
 * A anomalia controla o desenho: no El Niño, a subida do ar e a chuva migram para o leste e o ar seco desce sobre a Indonésia.
 */
export function EnsoSvg({ anomalia }: { anomalia: number }) {
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const id = useId().replace(/:/g, '')
  const fase = faseEnso(anomalia)
  const inten = intensidadeEnso(anomalia)
  const alisios = forcaAlisios(anomalia)
  const tilt = inclinacaoTermoclina(anomalia)
  const k = Math.min(1, Math.max(0, (anomalia - 0.3) / 1.7)) // quanto o El Niño já deslocou a convecção
  const nina = Math.min(1, Math.max(0, (-anomalia - 0.3) / 1.7))
  const prof = (x: number) => 25 + 90 * tilt * (1 - x) + (1 - tilt) * 45 * x
  const xDe = (s: number) => E_OESTE + s * (E_LESTE - E_OESTE)
  const quente: [number, number][] = Array.from({ length: 31 }, (_, i) => [xDe(i / 30), E_MAR + Math.max(8, prof(i / 30))])
  const polyQuente = `${E_OESTE},${E_MAR} ${quente.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} ${E_LESTE},${E_MAR}`
  const termo = quente.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const ressurgencia = Math.min(1, tilt / 1.2)
  // célula de Walker: sobe em xr; no normal desce perto da América do Sul; no El Niño, também desce sobre a Indonésia
  const xr = 140 + 280 * k
  const xd = 540
  const alto = 34
  const baixo = E_MAR - 22
  const forte = 0.45 + 0.55 * Math.max(alisios, k)
  const tamNuvem = 1 + 0.35 * nina + 0.15 * k
  const aria = `Corte do Pacífico equatorial, da Indonésia, a oeste, ao Peru, a leste. ${fase === 'neutro' ? 'Condições neutras' : NOME_FASE[fase]}${inten ? ` ${inten}` : ''}, com anomalia de ${f(anomalia)} °C. Os ventos alísios estão ${alisios < 0.4 ? 'fracos' : alisios > 0.7 ? 'fortes' : 'normais'}; a água quente ${tilt < 0.7 ? 'se espalha para o leste' : tilt > 1.15 ? 'fica ainda mais empilhada no oeste' : 'fica empilhada no oeste, como de costume'}; a ressurgência de águas frias na costa do Peru está ${tilt < 0.7 ? 'enfraquecida' : tilt > 1.15 ? 'reforçada' : 'normal'}. ${k > 0.3 ? 'O ar sobe e chove no meio do Pacífico; sobre a Indonésia, o ar desce seco.' : 'O ar sobe e chove sobre a Indonésia; perto do Peru, o ar desce seco.'}`
  const celula = (x0: number, x1: number) => `M ${x0} ${baixo - 10} C ${x0} ${alto}, ${x0} ${alto}, ${(x0 + x1) / 2} ${alto} S ${x1} ${alto}, ${x1} ${baixo - 10}`
  return (
    <svg ref={ref} viewBox="0 0 640 320" role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <defs>
        <marker id={`s-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
        </marker>
        <marker id={`c-${id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,1 L9,5 L0,9" fill="none" stroke="var(--ink)" strokeWidth={1.8} />
        </marker>
        <linearGradient id={`q-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--geo-quente)" stopOpacity={0.85} />
          <stop offset="1" stopColor="var(--geo-quente)" stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <rect width={640} height={E_MAR} fill="var(--geo-ar)" />
      <rect y={E_MAR} width={640} height={170} fill="var(--geo-frio)" opacity={0.42} />
      <polygon points={polyQuente} fill={`url(#q-${id})`} />
      <polyline points={termo} fill="none" stroke="var(--ink)" strokeOpacity={0.6} strokeWidth={1.4} strokeDasharray="6 4" />
      <line x1={E_OESTE} x2={E_LESTE} y1={E_MAR} y2={E_MAR} stroke="var(--ink)" strokeOpacity={0.45} />
      {/* terras: ilhas da Indonésia a oeste; América do Sul com os Andes a leste */}
      <path d={`M 0 ${E_MAR - 26} q 14 -16 26 -4 q 10 -12 22 2 q 8 4 14 10 V 320 H 0 Z`} fill="var(--geo-verde)" stroke="var(--ink)" strokeOpacity={0.5} />
      <path d={`M ${E_LESTE} ${E_MAR} L ${E_LESTE + 10} ${E_MAR - 10} L ${E_LESTE + 22} ${E_MAR - 48} L ${E_LESTE + 30} ${E_MAR - 36} L ${E_LESTE + 40} ${E_MAR - 70} L ${E_LESTE + 50} ${E_MAR - 44} L 640 ${E_MAR - 40} V 320 H ${E_LESTE} Z`} fill="var(--geo-continente)" stroke="var(--ink)" strokeOpacity={0.5} />
      {/* célula de Walker: sobe com chuva, segue no alto, desce seca */}
      <g fill="none" stroke="var(--ink)" strokeWidth={2} strokeOpacity={0.55 + 0.3 * forte} markerEnd={`url(#c-${id})`}>
        <path d={celula(xr, xd)} strokeDasharray={k > 0.6 ? '6 5' : undefined} />
        {k > 0.25 && <path d={celula(xr, 82)} strokeOpacity={0.4 + 0.5 * k} />}
      </g>
      <Nuvem x={xr - 40 * tamNuvem} y={baixo - 14} w={80 * tamNuvem} h={46 * tamNuvem} />
      {[-22, -8, 6, 20].map((dx) => (
        <line key={dx} x1={xr + dx * tamNuvem} y1={baixo - 10} x2={xr + dx * tamNuvem - 5} y2={E_MAR - 4} stroke="var(--geo-frio)" strokeWidth={2.2} strokeLinecap="round" />
      ))}
      {/* ventos alísios na superfície, de leste para oeste */}
      <g stroke="var(--ink)" strokeWidth={3} markerEnd={`url(#s-${id})`} opacity={0.3 + 0.7 * alisios}>
        {[250, 380, 500].map((x) => (
          <line key={x} x1={x + 40 * (0.3 + alisios)} y1={E_MAR - 12} x2={x - 40 * (0.3 + alisios)} y2={E_MAR - 12} />
        ))}
      </g>
      {/* ressurgência: água fria sobe junto à costa do Peru e traz nutrientes (e peixes) */}
      {[548, 568].map((x) => (
        <line key={x} x1={x} y1={300} x2={x} y2={300 - 120 * ressurgencia} stroke="var(--ink)" strokeWidth={3} markerEnd={`url(#s-${id})`} opacity={0.25 + 0.75 * ressurgencia} />
      ))}
      {ressurgencia > 0.55 && (
        <g>
          <Peixe x={496} y={E_MAR + 40} />
          <Peixe x={512} y={E_MAR + 56} />
          {ressurgencia > 0.9 && <Peixe x={480} y={E_MAR + 62} />}
        </g>
      )}
      <text x={8} y={18} fontSize={fs(13)} {...TEXTO}>
        Indonésia
      </text>
      <text x={632} y={18} textAnchor="end" fontSize={fs(13)} {...TEXTO}>
        Peru
      </text>
      <text x={k > 0.25 ? xr - 46 * tamNuvem : xr + 46 * tamNuvem} y={baixo - 30} textAnchor={k > 0.25 ? 'end' : 'start'} {...TEXTO} fontSize={fs(13)}>
        o ar sobe: chuva forte
      </text>
      <text x={xd - 8} y={alto + 40} textAnchor="end" {...TEXTO} fontSize={fs(12)}>
        ar seco desce
      </text>
      {k > 0.25 && (
        <text x={92} y={alto + 40} {...TEXTO} fontSize={fs(12)}>
          seca na Indonésia
        </text>
      )}
      <text x={k > 0.25 ? 220 : 380} y={E_MAR - 22} textAnchor="middle" {...TEXTO} fontSize={fs(13)}>
        ventos alísios {alisios < 0.4 ? '(fracos)' : alisios > 0.7 ? '(fortes)' : '(normais)'}
      </text>
      <text x={150} y={E_MAR + 24} textAnchor="middle" {...TEXTO} fontSize={fs(13)}>
        água quente
      </text>
      <text x={xDe(0.42)} y={E_MAR + Math.max(8, prof(0.42)) + 18} textAnchor="middle" {...TEXTO} fontSize={fs(13)}>
        termoclina (tracejado)
      </text>
      <text x={250} y={300} textAnchor="middle" {...TEXTO} fontSize={fs(13)}>
        água fria
      </text>
      <text x={540} y={312} textAnchor="end" {...TEXTO} fontSize={fs(12)}>
        ressurgência
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ ilha de calor */

const COR_NIVEL = ['', 'var(--geo-frio)', 'var(--geo-verde)', 'var(--geo-manto)', 'var(--geo-quente)']
const NOME_NIVEL = ['', 'mais fresco', 'ameno', 'quente', 'o mais quente']

/** Níveis relativos de aquecimento de cada tipo de superfície (uma escala qualitativa, sem temperaturas medidas). */
export function GraficoSuperficies({ medidas, destaque = null }: { medidas: string[]; destaque?: string | null }) {
  const [ref, largura] = useLargura<SVGSVGElement>(640)
  const fs = (b: number) => fonteLegivel(b, largura, 640, 11)
  const n = SUPERFICIES.length
  const faixa = 600 / n
  const altura = (nivel: number) => 30 + nivel * 45
  const aria = `Níveis relativos de aquecimento: ${SUPERFICIES.map((s) => `${s.nome}, ${NOME_NIVEL[nivelComMedidas(s.nivel, medidas)]}`).join('; ')}.`
  return (
    <svg ref={ref} viewBox="0 0 640 290" role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {SUPERFICIES.map((s, i) => {
        const nivel = nivelComMedidas(s.nivel, medidas)
        const reduzido = nivel < s.nivel
        const x = 20 + i * faixa
        const h = altura(nivel)
        return (
          <g key={s.id} opacity={destaque && destaque !== s.id ? 0.45 : 1}>
            <rect x={x + 8} y={220 - h} width={faixa - 16} height={h} fill={COR_NIVEL[nivel]} fillOpacity={0.85} stroke={reduzido ? 'var(--ok)' : 'var(--ink)'} strokeWidth={reduzido ? 3 : 1} strokeOpacity={reduzido ? 1 : 0.4} />
            <text x={x + faixa / 2} y={220 - h - 6} textAnchor="middle" fontSize={fs(13)} fill="var(--ink)" fontWeight={700}>
              {NOME_NIVEL[nivel]}
            </text>
            <foreignObject x={x + 2} y={226} width={faixa - 4} height={62}>
              <p style={{ margin: 0, fontSize: `${Math.max(11, 12)}px`, lineHeight: 1.15, textAlign: 'center', color: 'var(--ink)' }}>{s.nome}</p>
            </foreignObject>
          </g>
        )
      })}
    </svg>
  )
}

export const LegendaMedidas = () => (
  <p className="m-0 text-sm text-[var(--ink-muted)]">
    Cada medida ({MEDIDAS_URBANAS.map((m) => m.nome.toLowerCase()).join(' e ')}) reduz um nível, no máximo até o nível mais fresco. A escala é qualitativa: serve para comparar locais, não para ler graus.
  </p>
)

/* ------------------------------------------------------------------ perfil de temperatura (inversão) */

/** Perfil vertical de temperatura: temperatura no eixo horizontal, altura no vertical. */
export function PerfilSvg({ perfil, camadas = [] }: { perfil: PontoPerfil[]; camadas?: { de: number; ate: number }[] }) {
  const [ref, largura] = useLargura<SVGSVGElement>(480)
  const fs = (b: number) => fonteLegivel(b, largura, 480)
  const w = 480
  const h = 340
  const x0 = 56
  const x1 = w - 16
  const y0 = 16
  const y1 = h - 38
  const ts = perfil.map((p) => p.t)
  const tmin = Math.floor(Math.min(...ts) - 1)
  const tmax = Math.ceil(Math.max(...ts) + 1)
  const zmax = Math.max(...perfil.map((p) => p.z))
  const X = (t: number) => x0 + ((t - tmin) / (tmax - tmin)) * (x1 - x0)
  const Y = (z: number) => y1 - (z / zmax) * (y1 - y0)
  const passoT = tmax - tmin > 14 ? 4 : 2
  const ticksT: number[] = []
  for (let t = Math.ceil(tmin / passoT) * passoT; t <= tmax; t += passoT) ticksT.push(t)
  const ticksZ = perfil.map((p) => p.z).filter((_, i, a) => a.length <= 7 || i % 2 === 0)
  return (
    <svg ref={ref} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Perfil de temperatura com a altura: ${perfil.map((p) => `${p.z} m, ${f(p.t, 2)} °C`).join('; ')}.`} className="block h-auto w-full max-w-lg rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      {camadas.map((c) => (
        <rect key={c.de} x={x0} y={Y(c.ate)} width={x1 - x0} height={Y(c.de) - Y(c.ate)} fill="var(--geo-manto)" opacity={0.35} />
      ))}
      {ticksT.map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={y0} y2={y1} stroke="var(--grade)" />
          <text x={X(t)} y={y1 + fs(13) + 4} textAnchor="middle" fontSize={fs(13)} fill="var(--ink)">
            {t}
          </text>
        </g>
      ))}
      {ticksZ.map((z) => (
        <g key={z}>
          <line x1={x0} x2={x1} y1={Y(z)} y2={Y(z)} stroke="var(--grade)" />
          <text x={x0 - 6} y={Y(z) + 4} textAnchor="end" fontSize={fs(13)} fill="var(--ink)">
            {z}
          </text>
        </g>
      ))}
      <polyline points={perfil.map((p) => `${X(p.t)},${Y(p.z)}`).join(' ')} fill="none" stroke="var(--geo-quente)" strokeWidth={3} strokeLinejoin="round" />
      {perfil.map((p) => (
        <circle key={p.z} cx={X(p.t)} cy={Y(p.z)} r={4} fill="var(--geo-quente)" stroke="var(--surface)" strokeWidth={1.5} />
      ))}
      <text x={(x0 + x1) / 2} y={h - 4} textAnchor="middle" fontSize={fs(13)} fill="var(--ink-muted)">
        temperatura (°C)
      </text>
      <text x={12} y={(y0 + y1) / 2} textAnchor="middle" fontSize={fs(13)} fill="var(--ink-muted)" transform={`rotate(-90 12 ${(y0 + y1) / 2})`}>
        altura (m)
      </text>
    </svg>
  )
}

/** Tabela com os pontos do perfil, para quem lê melhor números do que o gráfico. */
export function TabelaPerfil({ perfil }: { perfil: PontoPerfil[] }) {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="num w-full border-collapse text-sm">
        <caption className="sr-only">Temperatura do ar em cada altura</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Altura (m)</th>
            <th scope="col" className="px-1">Temperatura (°C)</th>
          </tr>
        </thead>
        <tbody>
          {perfil.map((p) => (
            <tr key={p.z} className="border-b border-[var(--line)]">
              <th scope="row" className="py-1 pr-2 text-left font-normal">{p.z}</th>
              <td className="px-1">{f(p.t, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Como se lê a sigla das massas de ar. */
export function QuadroSigla() {
  const linhas: [string, string, string][] = [
    ['m', 'massa de ar', 'toda sigla começa com m'],
    ['E, T, P', 'equatorial, tropical, polar', 'quanto mais perto do Equador, mais quente'],
    ['c', 'continental', 'formada em terra: seca'],
    ['a', 'atlântica (marítima)', 'formada no mar: úmida'],
  ]
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Como ler a sigla (ex.: mTc, mPa)</caption>
        <tbody>
          {linhas.map(([a, b, c]) => (
            <tr key={a} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1 pr-2 text-left font-bold">{a}</th>
              <td className="px-1">{b}</td>
              <td className="px-1 text-[var(--ink-muted)]">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
