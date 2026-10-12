import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import { deltaH, eaDireta, eaInversa, comCatalisador, R, type Diagrama, type Experimento } from './calculo'
import type { DadosDiagrama, DadosFatores, DadosMeiaVida, DadosOrdem } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ diagrama de energia */

interface PropsDiagrama {
  d: Diagrama
  /** redução do topo da barreira com catalisador (mostra a curva tracejada) */
  reducao?: number
  /** desenha as setas de Ea direta, Ea inversa e ΔH com seus valores */
  setas?: boolean
}

/** Diagrama de energia: reagentes, complexo ativado e produtos; com catalisador opcional. */
export function DiagramaEnergia({ d, reducao, setas = false }: PropsDiagrama) {
  const W = 340
  const H = setas ? (reducao !== undefined ? 276 : 256) : reducao !== undefined ? 256 : 232
  const piso = Math.min(d.hr, d.hp) - 20
  const teto = d.hts + 20
  const Y = (h: number) => 196 - ((h - piso) / (teto - piso)) * 170
  const yR = Y(d.hr)
  const yP = Y(d.hp)
  const yT = Y(d.hts)
  const caminho = (yTopo: number) => `M 40 ${yR} L 100 ${yR} C 140 ${yR}, 140 ${yTopo}, 180 ${yTopo} C 220 ${yTopo}, 220 ${yP}, 260 ${yP} L 320 ${yP}`
  const cat = reducao !== undefined ? comCatalisador(d, reducao) : null
  const yTc = cat ? Y(cat.hts) : 0
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Diagrama de energia: reagentes em ${f(d.hr, 0)} kJ, complexo ativado em ${f(d.hts, 0)} kJ e produtos em ${f(d.hp, 0)} kJ${cat ? `; com catalisador o complexo ativado fica em ${f(cat.hts, 0)} kJ` : ''}`} className="mx-auto block w-full max-w-lg">
      <line x1={34} x2={34} y1={14} y2={204} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={34} x2={326} y1={204} y2={204} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <text x={326} y={222} textAnchor="end" fontSize={11} fill="var(--ink-muted)">caminho da reação</text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">entalpia (kJ)</text>
      {[[d.hr, yR, 'reagentes'], [d.hts, yT, 'complexo ativado'], [d.hp, yP, 'produtos']].map(([h, y, nome]) => (
        <g key={nome as string}>
          <line x1={34} x2={326} y1={y as number} y2={y as number} stroke="var(--line)" strokeDasharray="4 4" strokeWidth={1} />
          <text x={30} y={(y as number) + 4} textAnchor="end" fontSize={11} fill="var(--ink-muted)" className="num">{f(h as number, 0)}</text>
        </g>
      ))}
      <path d={caminho(yT)} fill="none" stroke="var(--accent)" strokeWidth={3.4} strokeLinecap="round" />
      {cat && <path d={caminho(yTc)} fill="none" stroke="var(--aviso)" strokeWidth={3} strokeDasharray="7 5" strokeLinecap="round" />}
      <text x={70} y={yR + (yR > yP ? 16 : -8)} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">reagentes</text>
      <text x={290} y={yP + (yP > yR ? 16 : -8)} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">produtos</text>
      <text x={180} y={yT - 8} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">complexo ativado</text>
      {setas && (
        <g fontSize={11} fontWeight={700}>
          <line x1={60} x2={60} y1={yR} y2={yT} stroke="var(--erro)" strokeWidth={2} markerEnd="url(#seta-cin)" />
          <text x={66} y={(yR + yT) / 2 + 4} fill="var(--erro)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">Ea</text>
          <line x1={296} x2={296} y1={yT} y2={yP} stroke="var(--ok)" strokeWidth={2} markerEnd="url(#seta-cin2)" />
          <text x={290} y={(yP + yT) / 2 + 4} textAnchor="end" fill="var(--ok)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">Ea inversa</text>
          <line x1={326} x2={326} y1={yR} y2={yP} stroke="var(--ink)" strokeWidth={2} strokeDasharray="3 3" />
          <text x={322} y={(yR + yP) / 2 + 4} textAnchor="end" fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">ΔH</text>
          <defs>
            <marker id="seta-cin" viewBox="0 0 10 10" refX={5} refY={5} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--erro)" />
            </marker>
            <marker id="seta-cin2" viewBox="0 0 10 10" refX={5} refY={5} markerWidth={6} markerHeight={6} orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--ok)" />
            </marker>
          </defs>
          <text x={34} y={244} fill="var(--erro)">Ea = {f(eaDireta(d), 0)} kJ</text>
          <text x={128} y={244} fill="var(--ok)">Ea inversa = {f(eaInversa(d), 0)} kJ</text>
          <text x={250} y={244} fill="var(--ink)">ΔH = {f(deltaH(d), 0)} kJ</text>
        </g>
      )}
      {cat && (
        <g fontSize={11} fontWeight={600}>
          <line x1={34} x2={58} y1={setas ? 262 : 242} y2={setas ? 262 : 242} stroke="var(--accent)" strokeWidth={3.4} />
          <text x={64} y={(setas ? 262 : 242) + 4} fill="var(--ink-muted)">sem catalisador</text>
          <line x1={170} x2={194} y1={setas ? 262 : 242} y2={setas ? 262 : 242} stroke="var(--aviso)" strokeWidth={3} strokeDasharray="6 4" />
          <text x={200} y={(setas ? 262 : 242) + 4} fill="var(--ink-muted)">com catalisador</text>
        </g>
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ distribuição de energias (Maxwell–Boltzmann) */

interface CurvaMB {
  rotulo: string
  T: number
  cor?: string
}

/** densidade de energias de um gás ideal em 3D: f(E) = 2√(E/π)·(kT)^(−3/2)·e^(−E/kT), com kT em kJ/mol */
function densidade(E: number, kT: number): number {
  return (2 * Math.sqrt(E / Math.PI) * Math.exp(-E / kT)) / kT ** 1.5
}

export function GraficoMB({ curvas, ea }: { curvas: CurvaMB[]; ea: number }) {
  const W = 340
  const H = 190
  const Emax = 14
  const X = (E: number) => 36 + (E / Emax) * 284
  const picos = curvas.map((c) => densidade((R * c.T) / 2000, (R * c.T) / 1000))
  const ymax = Math.max(...picos) * 1.12
  const Y = (v: number) => 150 - (v / ymax) * 126
  const pontos = (c: CurvaMB) => Array.from({ length: 141 }, (_, i) => `${X((i / 140) * Emax)},${Y(densidade((i / 140) * Emax, (R * c.T) / 1000))}`).join(' ')
  const area = (c: CurvaMB) => {
    const kT = (R * c.T) / 1000
    const passos = 60
    const ptsArea = Array.from({ length: passos + 1 }, (_, i) => {
      const E = ea + (i / passos) * (Emax - ea)
      return `${X(E)},${Y(densidade(E, kT))}`
    })
    return `${X(ea)},${Y(0)} ${ptsArea.join(' ')} ${X(Emax)},${Y(0)}`
  }
  const cores = ['var(--accent)', 'var(--erro)']
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Distribuição de energias das moléculas de um gás, com a energia de ativação marcada. ${curvas.map((c, i) => `A curva ${c.rotulo} tem o pico ${picos[i] === Math.max(...picos) ? 'mais alto, mais estreito e mais à esquerda' : 'mais baixo, mais largo e mais à direita'}`).join('. ')}.`} className="mx-auto block w-full max-w-lg">
      <line x1={36} x2={36} y1={14} y2={150} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={36} x2={322} y1={150} y2={150} stroke="var(--ink-muted)" strokeWidth={1.5} />
      {curvas.map((c, i) => (
        <polygon key={`a${c.rotulo}`} points={area(c)} fill={c.cor ?? cores[i % 2]} opacity={0.22} />
      ))}
      {curvas.map((c, i) => (
        <polyline key={c.rotulo} points={pontos(c)} fill="none" stroke={c.cor ?? cores[i % 2]} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <line x1={X(ea)} x2={X(ea)} y1={14} y2={150} stroke="var(--ink)" strokeDasharray="5 4" strokeWidth={1.5} />
      <text x={X(ea) + 4} y={26} fontSize={12} fontWeight={700} fill="var(--ink)">Ea</text>
      {curvas.map((c, i) => {
        const E = (R * c.T) / 2000
        return (
          <text key={`t${c.rotulo}`} x={X(E) + (i === 0 ? -6 : 6)} y={Y(densidade(E, (R * c.T) / 1000)) - 6} textAnchor={i === 0 ? 'end' : 'start'} fontSize={12} fontWeight={700} fill={c.cor ?? cores[i % 2]} stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">{c.rotulo}</text>
        )
      })}
      <text x={322} y={170} textAnchor="end" fontSize={11} fill="var(--ink-muted)">energia cinética das moléculas</text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">fração de moléculas</text>
      <text x={322} y={184} textAnchor="end" fontSize={10} fill="var(--ink-muted)">escala didática</text>
    </svg>
  )
}

/* ------------------------------------------------------------------ decaimento */

interface PropsDecaimento {
  m0: number
  tMeia: number
  unidadeT: string
  unidadeM: string
  /** até quando desenhar, em unidades do tempo */
  tmax?: number
  /** mostra as marcas das meias-vidas na curva */
  marcas?: boolean
}

export function GraficoDecaimento({ m0, tMeia, unidadeT, unidadeM, tmax, marcas = true }: PropsDecaimento) {
  const W = 340
  const H = 190
  const T = tmax ?? tMeia * 5
  const X = (t: number) => 44 + (t / T) * 276
  const Y = (m: number) => 150 - (m / m0) * 130
  const pts = Array.from({ length: 101 }, (_, i) => `${X((i / 100) * T)},${Y(m0 / 2 ** ((i / 100) * (T / tMeia)))}`).join(' ')
  const n = Math.floor(T / tMeia + 1e-9)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Decaimento de primeira ordem: a quantidade cai pela metade a cada ${f(tMeia, 2)} ${unidadeT}, de ${f(m0)} ${unidadeM}`} className="mx-auto block w-full max-w-lg">
      <line x1={44} x2={44} y1={14} y2={150} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={324} y1={150} y2={150} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      {marcas &&
        Array.from({ length: n + 1 }, (_, k) => k).map((k) => {
          const t = k * tMeia
          const m = m0 / 2 ** k
          return (
            <g key={k}>
              <line x1={X(t)} x2={X(t)} y1={Y(m)} y2={150} stroke="var(--ink-muted)" strokeDasharray="3 3" strokeWidth={1} />
              <line x1={44} x2={X(t)} y1={Y(m)} y2={Y(m)} stroke="var(--ink-muted)" strokeDasharray="3 3" strokeWidth={1} />
              <circle cx={X(t)} cy={Y(m)} r={4} fill="var(--erro)" stroke="var(--surface)" strokeWidth={1.5} />
              <text x={X(t)} y={166} textAnchor="middle" fontSize={11} fill="var(--ink-muted)" className="num">{f(t, 1)}</text>
              <text x={40} y={Y(m) + 4} textAnchor="end" fontSize={11} fill="var(--ink-muted)" className="num">{f(m, 2)}</text>
            </g>
          )
        })}
      <text x={324} y={184} textAnchor="end" fontSize={11} fill="var(--ink-muted)">tempo ({unidadeT})</text>
      <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">quantidade ({unidadeM})</text>
    </svg>
  )
}

/** Pontos medidos (sem a curva): para os exercícios de meia-vida. */
export function PontosMedidos({ pontos, unidadeT, unidadeM }: { pontos: [number, number][]; unidadeT: string; unidadeM: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="num mx-auto border-collapse text-center">
        <caption className="pb-1 text-left text-sm text-[var(--ink-muted)]">Medidas</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th className="px-3 py-1 font-semibold">tempo ({unidadeT})</th>
            <th className="px-3 py-1 font-semibold">quantidade ({unidadeM})</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map(([t, m]) => (
            <tr key={t} className="border-b border-[var(--line)]">
              <td className="px-3 py-1">{f(t, 0)}</td>
              <td className="px-3 py-1">{f(m, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ tabela de experimentos */

export function TabelaExperimentos({ nomes, experimentos, mostrarV = true }: { nomes: string[]; experimentos: Experimento[]; mostrarV?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="num mx-auto border-collapse text-center">
        <caption className="pb-1 text-left text-sm text-[var(--ink-muted)]">Velocidade inicial em cada experimento (10⁻³ mol/(L·s))</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th className="px-3 py-1 font-semibold">Exp.</th>
            {nomes.map((n) => (
              <th key={n} className="px-3 py-1 font-semibold">[{n}] (mol/L)</th>
            ))}
            {mostrarV && <th className="px-3 py-1 font-semibold">v</th>}
          </tr>
        </thead>
        <tbody>
          {experimentos.map((e, i) => (
            <tr key={i} className="border-b border-[var(--line)]">
              <td className="px-3 py-1">{i + 1}</td>
              {e.conc.map((c, k) => (
                <td key={k} className="px-3 py-1">{f(c)}</td>
              ))}
              {mostrarV && <td className="px-3 py-1">{f(e.v, 3)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualOrdem({ inst }: { inst: InstanciaNum<DadosOrdem> }) {
  const d = inst.dados as DadosOrdem
  return (
    <div className="cartao p-3">
      <TabelaExperimentos nomes={d.nomes} experimentos={d.experimentos} />
    </div>
  )
}

export function VisualDiagrama({ inst }: { inst: InstanciaNum<DadosDiagrama> }) {
  const d = inst.dados as DadosDiagrama
  return (
    <div className="cartao p-3">
      <DiagramaEnergia d={d.d} reducao={d.reducao} />
    </div>
  )
}

export function VisualMeiaVida({ inst }: { inst: InstanciaNum<DadosMeiaVida> }) {
  const d = inst.dados as DadosMeiaVida
  if (d.pontos.length === 0) return null
  return (
    <div className="cartao p-3">
      <PontosMedidos pontos={d.pontos} unidadeT={d.unidadeT} unidadeM={d.unidadeM} />
    </div>
  )
}

export function VisualFatores({ inst }: { inst: InstanciaMulti<DadosFatores> }) {
  const d = inst.dados as DadosFatores
  if (d.familia === 'diagrama' && d.d) {
    return (
      <div className="cartao p-3">
        <DiagramaEnergia d={d.d} reducao={d.reducao} />
        <p className="m-0 mt-1 text-center text-sm text-[var(--ink-muted)]">Curva cheia: sem catalisador. Curva tracejada: com catalisador.</p>
      </div>
    )
  }
  if (d.familia === 'mb' && d.curvas) {
    return (
      <div className="cartao p-3">
        <GraficoMB curvas={d.curvas} ea={d.Ea ?? 3.5} />
      </div>
    )
  }
  return null
}
