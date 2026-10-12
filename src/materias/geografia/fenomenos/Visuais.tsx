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

/** Serra em corte: o ar sobe pelo lado do vento, forma nuvens acima do nível de condensação e desce seco do outro lado. */
export function OrograficaSvg({ montanha, posicao, mostrarResposta = true }: { montanha: Montanha; posicao: number; mostrarResposta?: boolean }) {
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const r = resultadoOrografico(montanha)
  const topoY = NIVEL_MAR - montanha.altura * KM
  const xNaAltura = (z: number) => X_BASE_ESQ + ((X_PICO - X_BASE_ESQ) * z) / montanha.altura
  const xNaDescida = (z: number) => X_BASE_DIR - ((X_BASE_DIR - X_PICO) * z) / montanha.altura
  const caminho = temperaturaNoCaminho(montanha, posicao)
  const subindo = posicao <= 1
  const px = subindo ? xNaAltura(caminho.z) : xNaDescida(caminho.z)
  const py = NIVEL_MAR - caminho.z * KM - 12
  const yCond = NIVEL_MAR - r.zc * KM
  const aria = `Corte de uma serra de ${f(montanha.altura)} km. Ar a ${f(montanha.t0)} °C ao nível do mar sobe pelo lado do vento; ${r.chove ? `a condensação começa a ${f(r.zc, 2)} km, a temperatura no topo é ${f(r.tTopo)} °C e, descendo do outro lado, o ar chega ao nível do mar com ${f(r.tSotavento)} °C` : 'não há condensação, e o ar volta ao nível do mar com a mesma temperatura'}.`
  const ancoraTexto = Math.min(Math.max(px, 90), W - 90)
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--geo-ar)]">
      <rect x={0} y={NIVEL_MAR} width={W} height={H - NIVEL_MAR} fill="var(--geo-oceano)" opacity={0.5} />
      <polygon points={`0,${NIVEL_MAR} ${X_BASE_ESQ},${NIVEL_MAR} ${X_PICO},${topoY} ${X_BASE_DIR},${NIVEL_MAR} ${W},${NIVEL_MAR} ${W},${H} 0,${H}`} fill="var(--geo-continente)" stroke="var(--ink)" strokeOpacity={0.5} />
      {r.chove && (
        <>
          <polygon points={`${xNaAltura(r.zc)},${yCond} ${X_PICO},${topoY} ${X_PICO + 40},${topoY - 22} ${X_PICO - 70},${yCond - 56}`} fill="var(--surface)" opacity={0.75} stroke="var(--ink-muted)" strokeWidth={1} />
          {[0.3, 0.55, 0.8].map((q) => {
            const z = r.zc + (montanha.altura - r.zc) * q
            const x = xNaAltura(z) - 6
            const y = NIVEL_MAR - z * KM
            return <line key={q} x1={x} y1={y - 12} x2={x - 6} y2={y + 6} stroke="var(--geo-frio)" strokeWidth={2.4} strokeLinecap="round" />
          })}
          <line x1={0} x2={W} y1={yCond} y2={yCond} stroke="var(--ink)" strokeDasharray="6 5" strokeOpacity={0.6} />
          <text x={W - 8} y={yCond - 6} textAnchor="end" fontSize={fs(13)} fill="var(--ink)">
            condensação a {f(r.zc, 2)} km
          </text>
        </>
      )}
      <text x={X_BASE_ESQ - 6} y={NIVEL_MAR - 8} textAnchor="end" fontSize={fs(13)} fill="var(--ink-muted)">
        vento →
      </text>
      <text x={X_BASE_DIR + 8} y={NIVEL_MAR - 30} fontSize={fs(13)} fill="var(--ink-muted)">
        sombra
      </text>
      <text x={X_BASE_DIR + 8} y={NIVEL_MAR - 30 + fs(13) + 2} fontSize={fs(13)} fill="var(--ink-muted)">
        de chuva
      </text>
      {mostrarResposta && (
        <g fontSize={fs(14)} fontWeight={700} fill="var(--ink)">
          <text x={14} y={NIVEL_MAR + fs(14) + 2} {...TEXTO} fontSize={fs(14)}>
            entra: {f(montanha.t0)} °C
          </text>
          <text x={X_PICO} y={Math.max(topoY - 12, fs(14))} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
            topo: {f(r.tTopo)} °C
          </text>
          <text x={W - 14} y={NIVEL_MAR + fs(14) + 2} textAnchor="end" {...TEXTO} fontSize={fs(14)}>
            sai: {f(r.tSotavento)} °C
          </text>
        </g>
      )}
      <circle cx={px} cy={py} r={9} fill={caminho.nuvem ? 'var(--surface)' : 'var(--geo-quente)'} stroke="var(--ink)" strokeWidth={2} />
      <text x={ancoraTexto} y={Math.max(py - 16, fs(14))} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
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

/** Corte do Pacífico equatorial: ventos alísios, água quente e ressurgência. A anomalia controla o desenho. */
export function EnsoSvg({ anomalia }: { anomalia: number }) {
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const id = useId().replace(/:/g, '')
  const fase = faseEnso(anomalia)
  const inten = intensidadeEnso(anomalia)
  const alisios = forcaAlisios(anomalia)
  const tilt = inclinacaoTermoclina(anomalia)
  const topo = 112
  const prof = (x: number) => 25 + 90 * tilt * (1 - x) + (1 - tilt) * 45 * x
  const passos = 24
  const quente: [number, number][] = []
  for (let i = 0; i <= passos; i++) {
    const x = i / passos
    quente.push([40 + x * 560, topo + Math.max(8, prof(x))])
  }
  const polyQuente = `40,${topo} ${quente.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} 600,${topo}`
  const ressurgencia = Math.min(1, tilt / 1.2)
  const aria = `Corte do Pacífico equatorial, da Indonésia, a oeste, ao Peru, a leste. ${fase === 'neutro' ? 'Condições neutras' : NOME_FASE[fase]}${inten ? ` ${inten}` : ''}, com anomalia de ${f(anomalia)} °C. Os ventos alísios estão ${alisios < 0.4 ? 'fracos' : alisios > 0.7 ? 'fortes' : 'normais'}; a água quente ${tilt < 0.7 ? 'se espalha para o leste' : tilt > 1.15 ? 'fica ainda mais empilhada no oeste' : 'fica empilhada no oeste, como de costume'}; a ressurgência de águas frias na costa do Peru está ${tilt < 0.7 ? 'enfraquecida' : tilt > 1.15 ? 'reforçada' : 'normal'}.`
  return (
    <svg ref={ref} viewBox="0 0 640 300" role="img" aria-label={aria} className="block h-auto w-full rounded-lg border border-[var(--line)]">
      <defs>
        <marker id={`s-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
        </marker>
      </defs>
      <rect width={640} height={topo} fill="var(--geo-ar)" />
      <rect y={topo} width={640} height={188} fill="var(--geo-frio)" opacity={0.45} />
      <polygon points={polyQuente} fill="var(--geo-quente)" opacity={0.6} />
      <line x1={40} x2={600} y1={topo} y2={topo} stroke="var(--ink)" strokeOpacity={0.5} />
      <rect x={0} y={topo - 40} width={40} height={188 + 40} fill="var(--geo-continente)" />
      <rect x={600} y={topo - 40} width={40} height={188 + 40} fill="var(--geo-continente)" />
      <g stroke="var(--ink)" strokeWidth={3.5} markerEnd={`url(#s-${id})`} opacity={0.35 + 0.65 * alisios}>
        {[200, 320, 440].map((x) => (
          <line key={x} x1={x + 60 * (0.4 + alisios)} y1={topo - 52} x2={x - 60 * (0.4 + alisios)} y2={topo - 52} markerEnd={`url(#s-${id})`} />
        ))}
      </g>
      {[552, 575].map((x) => (
        <line key={x} x1={x} y1={topo + 120} x2={x} y2={topo + 120 - 70 * ressurgencia} stroke="var(--ink)" strokeWidth={3} markerEnd={`url(#s-${id})`} opacity={0.3 + 0.7 * ressurgencia} />
      ))}
      <text x={20} y={topo - 48} textAnchor="middle" fontSize={fs(13)} fill="var(--ink)" fontWeight={600}>
        Ásia
      </text>
      <text x={620} y={topo - 48} textAnchor="middle" fontSize={fs(13)} fill="var(--ink)" fontWeight={600}>
        Peru
      </text>
      <text x={320} y={topo - 66} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
        ventos alísios {alisios < 0.4 ? '(fracos)' : alisios > 0.7 ? '(fortes)' : '(normais)'}
      </text>
      <text x={320} y={topo + 150} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
        água quente
      </text>
      <text x={320} y={topo + 176} textAnchor="middle" {...TEXTO} fontSize={fs(14)}>
        água fria
      </text>
      <text x={580} y={ALTURA_TXT} textAnchor="end" {...TEXTO} fontSize={fs(13)}>
        ressurgência
      </text>
    </svg>
  )
}
const ALTURA_TXT = 290

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
