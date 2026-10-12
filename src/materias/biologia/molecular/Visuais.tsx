import { useId } from 'react'
import type { InstanciaMulti, InstanciaNum, VisualProps } from '@/desafios/simples'
import { CODONS, NOMES_AMINOACIDOS, TEMPERATURAS_PCR, bandasMeselson, compativelComObservacao, complementarDNA, posicaoNoGel, transcreverDaCodificadora, transcricaoLac, type ModeloReplicacao, type MutacaoLac } from './calculo'
import type { DadosBiotec, DadosMutacao, DadosTecnicas, DadosTranscricao, DadosTraducao } from './geradores'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const tres = (aa: string) => (aa === '*' ? 'Stop' : (NOMES_AMINOACIDOS[aa] as { tres: string }).tres)

/* ------------------------------------------------------------------ sequências alinhadas */

interface PropsSeq {
  /** fita codificadora do DNA (5′→3′) */
  codificadora: string
  /** posições (0 = primeira base) a destacar, por exemplo a base mutada */
  destaque?: number[]
  mostrarMolde?: boolean
}

/** Quadro com a fita codificadora, a fita molde, o mRNA, os códons e os aminoácidos, alinhados códon a códon. */
export function SequenciaAlinhada({ codificadora, destaque = [], mostrarMolde = true }: PropsSeq) {
  const mrna = transcreverDaCodificadora(codificadora)
  const molde = complementarDNA(codificadora)
  const inicio = mrna.indexOf('AUG')
  const blocos: { i: number; n: number }[] = []
  if (inicio < 0) {
    for (let i = 0; i < codificadora.length; i += 3) blocos.push({ i, n: Math.min(3, codificadora.length - i) })
  } else {
    if (inicio > 0) blocos.push({ i: 0, n: inicio })
    for (let i = inicio; i < codificadora.length; i += 3) blocos.push({ i, n: Math.min(3, codificadora.length - i) })
  }
  // aminoácido de cada bloco: só a partir do AUG, e só até o primeiro códon de parada
  const aminoacidos: (string | null)[] = []
  let parou = false
  for (const b of blocos) {
    const dentro = inicio >= 0 && b.i >= inicio && b.n === 3 && !parou
    const aa = dentro ? (CODONS[mrna.slice(b.i, b.i + 3)] as string) : null
    if (aa === '*') parou = true
    aminoacidos.push(aa)
  }
  const celula = (txt: string, estilo: string, realce: boolean) => (
    <span key={txt + estilo} className={`grid size-6 place-items-center rounded-sm font-mono text-sm font-semibold ${estilo}`} style={realce ? { outline: '2.5px solid var(--accent)', outlineOffset: -1 } : undefined}>
      {txt}
    </span>
  )
  return (
    <div className="grid gap-1" role="group" aria-label={`Sequências: fita codificadora 5′-${codificadora}-3′; fita molde 3′-${molde}-5′; mRNA 5′-${mrna}-3′`}>
      <div className="flex flex-wrap gap-x-2 gap-y-3">
        {blocos.map((b, idx) => {
          const cod = mrna.slice(b.i, b.i + b.n)
          const aa = aminoacidos[idx] ?? null
          const rotuloAA = aa === null ? '' : tres(aa)
          const fundoAA = aa === '*' ? 'bg-[var(--erro-bg)] text-[var(--erro)]' : aa === 'M' ? 'bg-[var(--accent)] text-[var(--on-accent)]' : 'bg-[var(--surface-2)]'
          return (
            <div key={b.i} className="grid justify-items-center gap-0.5 rounded-md border border-[var(--line)] px-1 py-1">
              <span className="flex">{[...codificadora.slice(b.i, b.i + b.n)].map((x, k) => celula(x, 'bg-[var(--surface)]', destaque.includes(b.i + k)))}</span>
              {mostrarMolde && <span className="flex">{[...molde.slice(b.i, b.i + b.n)].map((x, k) => celula(x, 'bg-[var(--surface-2)] text-[var(--ink-muted)]', destaque.includes(b.i + k)))}</span>}
              <span className="flex">{[...cod].map((x, k) => celula(x, 'bg-[var(--aviso-bg)]', destaque.includes(b.i + k)))}</span>
              <span className={`min-h-6 w-full rounded-sm px-1 text-center text-xs font-bold leading-6 ${aa ? fundoAA : ''}`}>{rotuloAA || ' '}</span>
            </div>
          )
        })}
      </div>
      <p className="m-0 text-xs text-[var(--ink-muted)]">
        Em cada bloco, de cima para baixo: fita codificadora (5′→3′){mostrarMolde ? ', fita molde (3′→5′)' : ''}, mRNA e aminoácido. A tradução começa no primeiro AUG e termina no códon de parada (Stop).
      </p>
    </div>
  )
}

/** Peptídeo como lista de aminoácidos; destaca onde difere de uma referência. */
export function Peptideo({ aminoacidos, referencia, rotulo }: { aminoacidos: string[]; referencia?: string[]; rotulo: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-sm font-semibold text-[var(--ink-muted)]">{rotulo}</span>
      <ol className="m-0 flex list-none flex-wrap gap-1 p-0" aria-label={`${rotulo}: ${aminoacidos.map(tres).join(', ') || 'nenhum aminoácido'}`}>
        {aminoacidos.map((a, i) => {
          const difere = referencia !== undefined && referencia[i] !== a
          return (
            <li key={i} className="num rounded-md border px-2 py-0.5 text-sm font-semibold" style={{ borderColor: difere ? 'var(--erro)' : 'var(--line-strong)', background: difere ? 'var(--erro-bg)' : 'var(--surface)' }}>
              {tres(a)}
              {difere && <span className="sr-only"> (diferente)</span>}
            </li>
          )
        })}
        {aminoacidos.length === 0 && <li className="text-sm text-[var(--ink-muted)]">nenhum aminoácido</li>}
        {referencia !== undefined && referencia.length > aminoacidos.length && <li className="text-sm text-[var(--erro)]">… faltam {referencia.length - aminoacidos.length}</li>}
      </ol>
    </div>
  )
}

/** Visual dos desafios de transcrição, tradução e mutações: mostra as sequências dadas no enunciado. */
export function VisualSequencias({ inst }: VisualProps<InstanciaMulti<DadosTranscricao | DadosTraducao | DadosMutacao>>) {
  const d = inst.dados as DadosTranscricao | DadosTraducao | DadosMutacao
  if (d.dadas.length === 0) return null
  return (
    <div className="cartao grid gap-1 p-3" role="group" aria-label="Sequências do exercício">
      {d.dadas.map((s) => (
        <div key={s.rotulo} className="grid gap-0.5">
          <span className="text-sm text-[var(--ink-muted)]">{s.rotulo}</span>
          <span className="overflow-x-auto font-mono text-base font-semibold tracking-wider">{s.seq.match(/.{1,3}/g)?.join(' ')}</span>
        </div>
      ))}
      <p className="m-0 text-xs text-[var(--ink-muted)]">Bases agrupadas de 3 em 3 só para facilitar a leitura.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ tabela do código genético */

const ORDEM = ['U', 'C', 'A', 'G']

/** Tabela dos 64 códons (1ª base nas linhas, 2ª nas colunas, 3ª dentro de cada casa). */
export function TabelaCodons({ destaque = [] }: { destaque?: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="num mx-auto border-collapse text-center text-xs" aria-label="Código genético: 64 códons de RNA e os aminoácidos correspondentes">
        <caption className="pb-1 text-left text-sm font-semibold">Códons do mRNA</caption>
        <thead>
          <tr>
            <th scope="col" className="px-1 py-1">1ª ↓ / 2ª →</th>
            {ORDEM.map((b) => (
              <th key={b} scope="col" className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 py-1 text-sm">
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ORDEM.map((b1) => (
            <tr key={b1}>
              <th scope="row" className="border border-[var(--line-strong)] bg-[var(--surface-2)] px-2 text-sm">
                {b1}
              </th>
              {ORDEM.map((b2) => (
                <td key={b2} className="border border-[var(--line-strong)] px-1 py-0.5 align-top">
                  {ORDEM.map((b3) => {
                    const c = `${b1}${b2}${b3}`
                    const aa = CODONS[c] as string
                    const realce = destaque.includes(c)
                    return (
                      <div key={c} className="flex justify-between gap-2 px-0.5" style={{ background: realce ? 'var(--aviso-bg)' : undefined, outline: realce ? '2px solid var(--accent)' : undefined, color: aa === '*' ? 'var(--erro)' : undefined, fontWeight: c === 'AUG' || aa === '*' ? 700 : 400 }}>
                        <span>{c}</span>
                        <span>{tres(aa)}</span>
                      </div>
                    )
                  })}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ gel de eletroforese e mapa de restrição */

export interface FaixaGel {
  rotulo: string
  /** tamanhos dos fragmentos, em kb */
  tamanhos: number[]
}

const MARCADOR_KB = [10, 6, 4, 3, 2, 1.5, 1, 0.5, 0.25]

/** Gel de agarose: o poço fica no alto e os fragmentos menores migram mais para baixo. Primeira pista: marcador de tamanhos. */
export function GelSvg({ faixas, titulo = 'Eletroforese em gel de agarose' }: { faixas: FaixaGel[]; titulo?: string }) {
  const lanes = [{ rotulo: 'Marcador', tamanhos: MARCADOR_KB, marcador: true }, ...faixas.map((x) => ({ ...x, marcador: false }))]
  const W = 60 + lanes.length * 52
  const H = 230
  const topo = 36
  const alto = 170
  const y = (kb: number) => topo + posicaoNoGel(kb * 1000) * alto
  const resumo = faixas.map((x) => `${x.rotulo}: ${x.tamanhos.map((t) => `${f(t, 2)} kb`).join(', ')}`).join('; ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titulo}. Marcador de ${MARCADOR_KB.map((m) => f(m, 2)).join(', ')} kb. ${resumo}`} className="mx-auto block w-full" style={{ maxWidth: Math.max(W * 1.4, 300) }}>
      <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--surface-2)" />
      <text x={W / 2} y={14} textAnchor="middle" fontSize={10.5} fill="var(--ink-muted)">
        poços (−)
      </text>
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={10.5} fill="var(--ink-muted)">
        sentido da migração (+)
      </text>
      {lanes.map((l, i) => {
        const x = 52 + i * 52
        return (
          <g key={l.rotulo}>
            <rect x={x - 17} y={topo - 10} width={34} height={6} rx={2} fill="var(--line-strong)" />
            <text x={x} y={topo - 14} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="var(--ink)">
              {l.rotulo.length > 8 ? l.rotulo.slice(0, 8) : l.rotulo}
            </text>
            {l.tamanhos.map((t, k) => (
              <rect key={`${t}-${k}`} x={x - 16} y={y(t) - 2} width={32} height={4.5} rx={1} fill={l.marcador ? 'var(--ink-muted)' : 'var(--accent)'} />
            ))}
            {l.marcador &&
              l.tamanhos.map((t) => (
                <text key={t} x={x - 20} y={y(t) + 3} textAnchor="end" fontSize={8.5} fill="var(--ink-muted)" className="num">
                  {f(t, 2)}
                </text>
              ))}
          </g>
        )
      })}
      <text x={6} y={topo + 6} fontSize={8.5} fill="var(--ink-muted)">
        kb
      </text>
    </svg>
  )
}

/** Mapa de uma molécula de DNA (linear ou circular) com os pontos de corte. */
export function MapaRestricaoSvg({ tamanho, cortes, circular, enzima }: { tamanho: number; cortes: number[]; circular: boolean; enzima: string }) {
  const uid = useId().replace(/:/g, '')
  const resumo = `${circular ? 'Plasmídeo circular' : 'DNA linear'} de ${f(tamanho, 1)} kb com cortes em ${cortes.map((c) => `${f(c, 1)} kb`).join(', ')}`
  if (!circular) {
    const W = 320
    const X = (kb: number) => 20 + (kb / tamanho) * 280
    return (
      <svg viewBox={`0 0 ${W} 90`} role="img" aria-label={resumo} className="mx-auto block w-full max-w-md">
        <line x1={20} x2={300} y1={46} y2={46} stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" />
        {cortes.map((c) => (
          <g key={c}>
            <line x1={X(c)} x2={X(c)} y1={30} y2={62} stroke="var(--erro)" strokeWidth={2.5} />
            <text x={X(c)} y={24} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)" className="num">
              {f(c, 1)}
            </text>
          </g>
        ))}
        <text x={20} y={80} fontSize={11} fill="var(--ink-muted)">
          0
        </text>
        <text x={300} y={80} textAnchor="end" fontSize={11} fill="var(--ink-muted)" className="num">
          {f(tamanho, 1)} kb
        </text>
        <text x={160} y={80} textAnchor="middle" fontSize={10.5} fill="var(--erro)">
          cortes de {enzima}
        </text>
      </svg>
    )
  }
  const cx = 110
  const cy = 90
  const R = 56
  const ang = (kb: number) => (kb / tamanho) * 2 * Math.PI - Math.PI / 2
  return (
    <svg viewBox="0 0 220 196" role="img" aria-label={resumo} className="mx-auto block w-full max-w-xs">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--ink)" strokeWidth={5} />
      {cortes.map((c) => {
        const a = ang(c)
        return (
          <g key={c}>
            <line x1={cx + (R - 8) * Math.cos(a)} y1={cy + (R - 8) * Math.sin(a)} x2={cx + (R + 8) * Math.cos(a)} y2={cy + (R + 8) * Math.sin(a)} stroke="var(--erro)" strokeWidth={2.5} />
            <text x={cx + (R + 20) * Math.cos(a)} y={cy + (R + 20) * Math.sin(a) + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)" className="num">
              {f(c, 1)}
            </text>
          </g>
        )
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={11} fill="var(--ink-muted)">
        plasmídeo
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={11} fill="var(--ink-muted)" className="num">
        {f(tamanho, 1)} kb
      </text>
      <text x={cx} y={14} textAnchor="middle" fontSize={9.5} fill="var(--ink-muted)" id={`${uid}-ref`}>
        referência (0)
      </text>
      <text x={110} y={172} textAnchor="middle" fontSize={10.5} fill="var(--erro)">
        cortes de {enzima}
      </text>
      <text x={110} y={186} textAnchor="middle" fontSize={9.5} fill="var(--ink-muted)">
        posições em kb, a partir da referência
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ Meselson e Stahl */

const NOME_MODELO: Record<ModeloReplicacao, string> = { semiconservativa: 'Semiconservativa', conservativa: 'Conservativa', dispersiva: 'Dispersiva' }
export { NOME_MODELO }

function Tubo({ x, y, modelo, g }: { x: number; y: number; modelo: ModeloReplicacao; g: number }) {
  const b = bandasMeselson(modelo, g)
  const yLeve = 20
  const yPesado = 76
  const faixas: { pos: number; frac: number; rot: string }[] =
    modelo === 'dispersiva' && b.fracaoN15 !== undefined ? [{ pos: yLeve + b.fracaoN15 * (yPesado - yLeve), frac: 1, rot: 'banda única' }] : [{ pos: yLeve, frac: b.leve, rot: 'leve' }, { pos: (yLeve + yPesado) / 2, frac: b.hibrido, rot: 'híbrido' }, { pos: yPesado, frac: b.pesado, rot: 'pesado' }]
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={34} height={96} rx={10} fill="var(--surface)" stroke="var(--ink-muted)" strokeWidth={1.5} />
      {faixas.map((fa) => (fa.frac > 0.001 ? <rect key={fa.rot} x={3} y={fa.pos - 4 + 6} width={28} height={8} rx={2} fill="var(--accent)" opacity={0.2 + 0.8 * fa.frac} /> : null))}
    </g>
  )
}

/** Resultados de Meselson e Stahl (barra: tubos de gradiente de densidade) comparados com a previsão de uma hipótese. */
export function GradeMeselson({ modelo, geracaoAtual, geracoes = [0, 1, 2, 3, 4], ate = Infinity }: { modelo: ModeloReplicacao; geracaoAtual?: number; geracoes?: number[]; /** só mostra as gerações até esta (as seguintes aparecem esmaecidas) */ ate?: number }) {
  const W = 330
  const col = (i: number) => 76 + i * 50
  const resumo = geracoes.map((g) => `geração ${g}: ${compativelComObservacao(modelo, g) ? 'compatível com o observado' : 'incompatível com o observado'}`).join('; ')
  return (
    <svg viewBox={`0 0 ${W} 270`} role="img" aria-label={`Bandas de DNA em gradiente de densidade, observadas e previstas pela hipótese ${NOME_MODELO[modelo].toLowerCase()}. ${resumo}`} className="mx-auto block w-full max-w-lg">
      <text x={4} y={78} fontSize={10.5} fontWeight={600} fill="var(--ink)">
        Observado
      </text>
      <text x={4} y={90} fontSize={9} fill="var(--ink-muted)">
        (experimento)
      </text>
      <text x={4} y={198} fontSize={10.5} fontWeight={600} fill="var(--ink)">
        Previsto
      </text>
      <text x={4} y={210} fontSize={9} fill="var(--ink-muted)">
        ({NOME_MODELO[modelo].toLowerCase()})
      </text>
      <text x={50} y={32} textAnchor="end" fontSize={8.5} fill="var(--ink-muted)">
        leve ↑
      </text>
      <text x={50} y={104} textAnchor="end" fontSize={8.5} fill="var(--ink-muted)">
        pesado ↓
      </text>
      {geracoes.map((g, i) => {
        const x = col(i)
        const ok = compativelComObservacao(modelo, g)
        const atual = geracaoAtual === g
        const visivel = g <= ate
        return (
          <g key={g} opacity={visivel ? 1 : 0.18}>
            {atual && <rect x={x - 8} y={4} width={50} height={256} rx={8} fill="var(--surface-2)" />}
            <text x={x + 17} y={18} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="var(--ink)">
              G{g}
            </text>
            <Tubo x={x} y={26} modelo="semiconservativa" g={g} />
            <Tubo x={x} y={146} modelo={modelo} g={g} />
            {visivel && (
              <text x={x + 17} y={254} textAnchor="middle" fontSize={12} fontWeight={700} fill={ok ? 'var(--ok)' : 'var(--erro)'}>
                {ok ? '✓' : '✗'}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ óperon lac */

export function LacSvg({ lactose, glicose, mutacao }: { lactose: boolean; glicose: boolean; mutacao: MutacaoLac }) {
  const nivel = transcricaoLac({ lactose, glicose, mutacao })
  const repressorInativo = mutacao === 'repressor' || (mutacao === 'nenhuma' && lactose)
  const bloqueando = !repressorInativo && mutacao !== 'operador' && mutacao !== 'promotor'
  const operadorMutado = mutacao === 'operador'
  const rotulo = nivel === 'alta' ? 'transcrição ALTA' : nivel === 'baixa' ? 'transcrição BAIXA' : 'SEM transcrição'
  const corNivel = nivel === 'alta' ? 'var(--ok)' : nivel === 'baixa' ? 'var(--aviso)' : 'var(--erro)'
  const W = 340
  const caixa = (x: number, w: number, texto: string, fundo: string, marca = false) => (
    <g>
      <rect x={x} y={104} width={w} height={26} rx={4} fill={fundo} stroke="var(--ink-muted)" strokeWidth={1.4} />
      <text x={x + w / 2} y={121} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--ink)">
        {texto}
      </text>
      {marca && (
        <text x={x + w / 2} y={100} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--erro)">
          ✕
        </text>
      )}
    </g>
  )
  return (
    <svg viewBox={`0 0 ${W} 190`} role="img" aria-label={`Óperon lac ${lactose ? 'com' : 'sem'} lactose, ${glicose ? 'com' : 'sem'} glicose${mutacao !== 'nenhuma' ? `, com mutação (${mutacao})` : ''}: ${rotulo}`} className="mx-auto block w-full max-w-lg">
      <line x1={8} x2={W - 8} y1={117} y2={117} stroke="var(--ink-muted)" strokeWidth={2} />
      {caixa(14, 40, 'CAP', glicose ? 'var(--surface-2)' : 'var(--ok-bg)')}
      {caixa(58, 34, 'P', 'var(--surface)', mutacao === 'promotor')}
      {caixa(96, 34, 'O', operadorMutado ? 'var(--erro-bg)' : 'var(--aviso-bg)', operadorMutado)}
      {caixa(134, 56, 'lacZ', 'var(--surface)')}
      {caixa(194, 56, 'lacY', 'var(--surface)')}
      {caixa(254, 56, 'lacA', 'var(--surface)')}
      {/* complexo CAP–AMPc */}
      {!glicose && (
        <g>
          <circle cx={34} cy={80} r={14} fill="var(--ok)" />
          <text x={34} y={84} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="var(--on-accent)">
            CAP
          </text>
          <line x1={34} x2={34} y1={94} y2={104} stroke="var(--ok)" strokeWidth={2} />
        </g>
      )}
      {/* RNA polimerase */}
      {nivel !== 'nenhuma' && (
        <g>
          <ellipse cx={75} cy={80} rx={20} ry={13} fill="var(--accent)" />
          <text x={75} y={84} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="var(--on-accent)">
            RNA pol
          </text>
          <line x1={75} x2={75} y1={93} y2={104} stroke="var(--accent)" strokeWidth={2} />
        </g>
      )}
      {/* repressor */}
      {bloqueando ? (
        <g>
          <circle cx={113} cy={78} r={15} fill="var(--erro)" />
          <text x={113} y={82} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--on-accent)">
            R
          </text>
          <line x1={113} x2={113} y1={93} y2={104} stroke="var(--erro)" strokeWidth={2.4} />
        </g>
      ) : (
        <g opacity={mutacao === 'repressor' ? 0.35 : 1}>
          <circle cx={150} cy={40} r={15} fill={mutacao === 'repressor' ? 'var(--line-strong)' : 'var(--surface-2)'} stroke="var(--ink-muted)" strokeWidth={1.6} strokeDasharray={mutacao === 'repressor' ? '3 3' : undefined} />
          <text x={150} y={44} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink)">
            R
          </text>
          {lactose && mutacao !== 'repressor' && (
            <g>
              <circle cx={168} cy={30} r={7} fill="var(--aviso)" />
              <text x={168} y={33} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--surface)">
                L
              </text>
            </g>
          )}
        </g>
      )}
      {/* mRNA */}
      {nivel !== 'nenhuma' && <path d="M 100 150 L 306 150" stroke={corNivel} strokeWidth={nivel === 'alta' ? 6 : 2.5} strokeLinecap="round" strokeDasharray={nivel === 'alta' ? undefined : '6 4'} />}
      <text x={W / 2} y={180} textAnchor="middle" fontSize={12} fontWeight={700} fill={corNivel}>
        {rotulo}
      </text>
      <text x={W - 6} y={14} textAnchor="end" fontSize={9.5} fill="var(--ink-muted)">
        R = repressor · L = lactose · P = promotor · O = operador
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ estrutura do DNA, forquilha e processamento do RNA */

const BASES = ['A', 'T', 'G', 'C', 'A', 'T']

export function DnaSvg() {
  const x = (i: number) => 40 + i * 44
  return (
    <svg viewBox="0 0 320 170" role="img" aria-label="Trecho de DNA de fita dupla: A pareia com T por duas ligações de hidrogênio e G pareia com C por três; as fitas são antiparalelas" className="mx-auto block w-full max-w-md">
      <text x={6} y={36} fontSize={11} fontWeight={700} fill="var(--ink)">
        5′
      </text>
      <text x={306} y={36} fontSize={11} fontWeight={700} fill="var(--ink)">
        3′
      </text>
      <text x={6} y={140} fontSize={11} fontWeight={700} fill="var(--ink)">
        3′
      </text>
      <text x={306} y={140} fontSize={11} fontWeight={700} fill="var(--ink)">
        5′
      </text>
      <line x1={26} x2={300} y1={32} y2={32} stroke="var(--ink-muted)" strokeWidth={2} />
      <line x1={26} x2={300} y1={136} y2={136} stroke="var(--ink-muted)" strokeWidth={2} />
      {BASES.map((b, i) => {
        const par = { A: 'T', T: 'A', G: 'C', C: 'G' }[b] as string
        const gc = b === 'G' || b === 'C'
        const n = gc ? 3 : 2
        return (
          <g key={i}>
            <rect x={x(i) - 15} y={20} width={30} height={26} rx={6} fill={gc ? 'var(--aviso-bg)' : 'var(--surface-2)'} stroke="var(--ink-muted)" strokeWidth={1.4} />
            <text x={x(i)} y={38} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">
              {b}
            </text>
            <rect x={x(i) - 15} y={122} width={30} height={26} rx={6} fill={gc ? 'var(--aviso-bg)' : 'var(--surface-2)'} stroke="var(--ink-muted)" strokeWidth={1.4} />
            <text x={x(i)} y={140} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--ink)">
              {par}
            </text>
            {Array.from({ length: n }, (_, k) => (
              <line key={k} x1={x(i) - 8 + (k * 16) / (n - 1)} x2={x(i) - 8 + (k * 16) / (n - 1)} y1={52} y2={116} stroke="var(--ink-muted)" strokeWidth={1.6} strokeDasharray="3 3" />
            ))}
            <text x={x(i)} y={90} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="var(--ink)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
              {n} lig.
            </text>
          </g>
        )
      })}
      <text x={160} y={164} textAnchor="middle" fontSize={10.5} fill="var(--ink-muted)">
        fundo amarelo: pares G–C (3 ligações de hidrogênio)
      </text>
    </svg>
  )
}

export function ForquilhaSvg() {
  const uid = useId().replace(/:/g, '')
  const seta = (x1: number, x2: number, y: number, cor = 'var(--accent)') => (
    <line x1={x1} x2={x2} y1={y} y2={y} stroke={cor} strokeWidth={4} markerEnd={`url(#${uid}-${cor === 'var(--accent)' ? 'ac' : 'av'})`} strokeLinecap="round" />
  )
  return (
    <svg viewBox="0 0 330 200" role="img" aria-label="Forquilha de replicação: helicase abre a dupla-hélice; a fita líder é sintetizada de modo contínuo e a descontínua em fragmentos de Okazaki unidos pela DNA ligase" className="mx-auto block w-full max-w-lg">
      <defs>
        <marker id={`${uid}-ac`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
        </marker>
        <marker id={`${uid}-av`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--aviso)" />
        </marker>
      </defs>
      {/* DNA parental, à direita, ainda não replicado */}
      <line x1={215} x2={320} y1={98} y2={98} stroke="var(--ink)" strokeWidth={3} />
      <line x1={215} x2={320} y1={108} y2={108} stroke="var(--ink)" strokeWidth={3} />
      {[225, 240, 255, 270, 285, 300, 315].map((x) => (
        <line key={x} x1={x} x2={x} y1={98} y2={108} stroke="var(--ink-muted)" strokeWidth={1.4} />
      ))}
      {/* moldes depois do ponto de abertura */}
      <path d="M 215 98 C 195 98, 190 52, 160 52 L 20 52" fill="none" stroke="var(--ink)" strokeWidth={3} />
      <path d="M 215 108 C 195 108, 190 154, 160 154 L 20 154" fill="none" stroke="var(--ink)" strokeWidth={3} />
      <text x={22} y={44} fontSize={10.5} fontWeight={700} fill="var(--ink)">
        molde 3′
      </text>
      <text x={22} y={146} fontSize={10.5} fontWeight={700} fill="var(--ink)">
        molde 5′
      </text>
      {/* fita líder (contínua) */}
      {seta(30, 150, 66)}
      <text x={30} y={86} fontSize={10.5} fontWeight={600} fill="var(--accent)">
        fita líder (contínua)
      </text>
      <ellipse cx={156} cy={66} rx={20} ry={11} fill="var(--accent)" />
      <text x={156} y={70} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="var(--on-accent)">
        DNA pol
      </text>
      {/* fita descontínua: fragmentos de Okazaki */}
      {seta(150, 118, 140, 'var(--aviso)')}
      {seta(104, 72, 140, 'var(--aviso)')}
      {seta(58, 28, 140, 'var(--aviso)')}
      <rect x={150} y={134} width={6} height={12} fill="var(--erro)" />
      <rect x={104} y={134} width={6} height={12} fill="var(--erro)" />
      <rect x={58} y={134} width={6} height={12} fill="var(--erro)" />
      <text x={30} y={176} fontSize={10.5} fontWeight={600} fill="var(--aviso)">
        fita descontínua (fragmentos de Okazaki)
      </text>
      <text x={30} y={190} fontSize={9.5} fill="var(--ink-muted)">
        retângulo vermelho: primer de RNA (feito pela primase) · ligase une os fragmentos
      </text>
      {/* helicase */}
      <circle cx={212} cy={103} r={13} fill="var(--erro)" />
      <text x={212} y={107} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--on-accent)">
        helic.
      </text>
      <text x={268} y={88} textAnchor="middle" fontSize={10} fill="var(--ink-muted)">
        DNA parental
      </text>
      <text x={268} y={128} textAnchor="middle" fontSize={10} fill="var(--ink)">
        a forquilha avança →
      </text>
    </svg>
  )
}

export function ProcessamentoSvg() {
  const caixa = (x: number, w: number, t: string, tipo: 'exon' | 'intron', y: number) => (
    <g>
      <rect x={x} y={y} width={w} height={26} rx={4} fill={tipo === 'exon' ? 'var(--accent)' : 'var(--surface-2)'} stroke="var(--ink-muted)" strokeWidth={1.3} strokeDasharray={tipo === 'intron' ? '4 3' : undefined} />
      <text x={x + w / 2} y={y + 17} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={tipo === 'exon' ? 'var(--on-accent)' : 'var(--ink-muted)'}>
        {t}
      </text>
    </g>
  )
  return (
    <svg viewBox="0 0 330 210" role="img" aria-label="Processamento do RNA em eucariotos: o gene tem éxons e íntrons; o pré-mRNA recebe quepe e cauda poli-A e, no splicing, os íntrons são removidos e os éxons unidos" className="mx-auto block w-full max-w-lg">
      <text x={4} y={14} fontSize={10.5} fontWeight={700} fill="var(--ink)">
        Gene (DNA)
      </text>
      {caixa(10, 56, 'éxon 1', 'exon', 20)}
      {caixa(66, 46, 'íntron', 'intron', 20)}
      {caixa(112, 56, 'éxon 2', 'exon', 20)}
      {caixa(168, 46, 'íntron', 'intron', 20)}
      {caixa(214, 56, 'éxon 3', 'exon', 20)}
      <text x={290} y={36} fontSize={10.5} fill="var(--ink-muted)">
        ↓ transcrição
      </text>
      <text x={4} y={82} fontSize={10.5} fontWeight={700} fill="var(--ink)">
        Pré-mRNA (no núcleo)
      </text>
      <rect x={4} y={88} width={22} height={26} rx={4} fill="var(--aviso)" />
      <text x={15} y={105} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--surface)">
        cap
      </text>
      {caixa(30, 50, 'éxon 1', 'exon', 88)}
      {caixa(80, 40, 'íntron', 'intron', 88)}
      {caixa(120, 50, 'éxon 2', 'exon', 88)}
      {caixa(170, 40, 'íntron', 'intron', 88)}
      {caixa(210, 50, 'éxon 3', 'exon', 88)}
      <rect x={260} y={88} width={52} height={26} rx={4} fill="var(--aviso)" />
      <text x={286} y={105} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--surface)">
        AAAAA
      </text>
      <text x={290} y={136} fontSize={10.5} fill="var(--ink-muted)">
        ↓ splicing
      </text>
      <text x={4} y={150} fontSize={10.5} fontWeight={700} fill="var(--ink)">
        mRNA maduro (vai ao citoplasma)
      </text>
      <rect x={4} y={158} width={22} height={26} rx={4} fill="var(--aviso)" />
      <text x={15} y={175} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--surface)">
        cap
      </text>
      {caixa(30, 50, 'éxon 1', 'exon', 158)}
      {caixa(80, 50, 'éxon 2', 'exon', 158)}
      {caixa(130, 50, 'éxon 3', 'exon', 158)}
      <rect x={180} y={158} width={52} height={26} rx={4} fill="var(--aviso)" />
      <text x={206} y={175} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--surface)">
        AAAAA
      </text>
      <text x={4} y={204} fontSize={9.5} fill="var(--ink-muted)">
        cap: quepe na extremidade 5′ · AAAAA: cauda poli-A na extremidade 3′
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ PCR */

/** Perfil de temperatura de uma PCR: desnaturação, anelamento e extensão em cada ciclo. */
export function PerfilTermicoSvg({ ciclos = 3, atual }: { ciclos?: number; atual?: number }) {
  const { desnaturacao, anelamento, extensao } = TEMPERATURAS_PCR
  const W = 340
  const H = 170
  const largura = 280 / ciclos
  const Y = (t: number) => 140 - ((t - 40) / (100 - 40)) * 110
  const pts: [number, number][] = [[0, Y(72)]]
  for (let c = 0; c < ciclos; c++) {
    const x0 = c * largura
    pts.push([x0 + largura * 0.0, Y(desnaturacao)], [x0 + largura * 0.34, Y(desnaturacao)], [x0 + largura * 0.38, Y(anelamento)], [x0 + largura * 0.66, Y(anelamento)], [x0 + largura * 0.7, Y(extensao)], [x0 + largura, Y(extensao)])
  }
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${44 + x} ${y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Temperatura ao longo de ${ciclos} ciclos de PCR: desnaturação a ${desnaturacao} °C, anelamento a ${anelamento} °C e extensão a ${extensao} °C`} className="mx-auto block w-full max-w-lg">
      <line x1={44} x2={44} y1={14} y2={146} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={328} y1={146} y2={146} stroke="var(--ink-muted)" strokeWidth={1.5} />
      {[desnaturacao, anelamento, extensao].map((t) => (
        <g key={t}>
          <line x1={44} x2={328} y1={Y(t)} y2={Y(t)} stroke="var(--line)" strokeDasharray="3 3" />
          <text x={40} y={Y(t) + 4} textAnchor="end" fontSize={10} fill="var(--ink-muted)" className="num">
            {t} °C
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinejoin="round" />
      {atual !== undefined && <line x1={44 + (atual / ciclos) * 280} x2={44 + (atual / ciclos) * 280} y1={14} y2={146} stroke="var(--erro)" strokeWidth={2.4} />}
      {Array.from({ length: ciclos }, (_, c) => (
        <g key={c}>
          <text x={44 + c * largura + largura * 0.17} y={Y(desnaturacao) - 6} textAnchor="middle" fontSize={9} fill="var(--ink)">
            desnat.
          </text>
          <text x={44 + c * largura + largura * 0.52} y={Y(anelamento) + 14} textAnchor="middle" fontSize={9} fill="var(--ink)">
            anel.
          </text>
          <text x={44 + c * largura + largura * 0.85} y={Y(extensao) - 6} textAnchor="middle" fontSize={9} fill="var(--ink)">
            ext.
          </text>
        </g>
      ))}
      <text x={328} y={162} textAnchor="end" fontSize={10} fill="var(--ink-muted)">
        tempo (ciclos)
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ visuais dos desafios */

export function VisualBiotec({ inst }: VisualProps<InstanciaNum<DadosBiotec>>) {
  const d = inst.dados as DadosBiotec
  if (!d.mapa) return null
  return (
    <div className="cartao grid gap-1 p-3">
      <MapaRestricaoSvg tamanho={d.mapa.tamanho} cortes={d.mapa.cortes} circular={d.mapa.circular} enzima={d.mapa.enzima} />
    </div>
  )
}

export function VisualTecnicas({ inst }: VisualProps<InstanciaMulti<DadosTecnicas>>) {
  const d = inst.dados as DadosTecnicas
  if (!d.mapa) return null
  return (
    <div className="cartao grid gap-1 p-3">
      <MapaRestricaoSvg tamanho={d.mapa.tamanho} cortes={d.mapa.cortes} circular={d.mapa.circular} enzima={d.mapa.enzima} />
    </div>
  )
}

