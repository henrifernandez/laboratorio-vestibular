import { CORRENTES, CORRENTE_DOS_PENSADORES, correntesAceitas } from '@/conteudo/filosofia/correntes'
import { ARESTAS, PENSADORES, type Epoca, type TipoAresta } from '@/conteudo/filosofia/pensadores'
import { fonteLegivel, useLargura } from '@/lib/useLargura'

const ORDENADOS = [...PENSADORES].sort((a, b) => a.nascimento - b.nascimento)

export const COR_EPOCA: Record<Epoca, string> = {
  Antiguidade: 'var(--geo-continente)',
  'Idade Moderna': 'var(--geo-frio)',
  Contemporânea: 'var(--geo-quente)',
}

export const SIGLA: Record<TipoAresta, string> = {
  'mestre e discípulo': 'M',
  crítica: 'C',
  herança: 'H',
  diálogo: 'D',
  contraste: 'X',
}

const W = 640
const X_NOMES = 8
const X0 = 168
const LARG_ANTIGA = 90
const FOLGA = 26
const X_MODERNA = X0 + LARG_ANTIGA + FOLGA
const LARG_MODERNA = W - 12 - X_MODERNA
const ANO_ANTIGO = [-480, -300] as const
const ANO_MODERNO = [1450, 2000] as const

/** Escala quebrada: a Antiguidade e a Era Moderna e Contemporânea ficam em dois trechos, com uma quebra no meio. */
export function posicaoDoAno(ano: number): number {
  if (ano < 0) return X0 + ((ano - ANO_ANTIGO[0]) / (ANO_ANTIGO[1] - ANO_ANTIGO[0])) * LARG_ANTIGA
  return X_MODERNA + ((ano - ANO_MODERNO[0]) / (ANO_MODERNO[1] - ANO_MODERNO[0])) * LARG_MODERNA
}

const rotuloAno = (a: number) => (a < 0 ? `${Math.abs(a)} a.C.` : String(a))

/** Texto equivalente: cada pensador com seu período e, se houver, as relações do selecionado. */
export function descreverLinha(selecionado: string | null): string {
  const lista = ORDENADOS.map((p) => `${p.nome}, ${p.periodo}`).join('; ')
  const rel = selecionado ? ARESTAS.filter((a) => a.de === selecionado || a.para === selecionado) : []
  const nome = (id: string) => PENSADORES.find((p) => p.id === id)?.nome ?? id
  return `Linha do tempo com os 14 pensadores, em ordem de nascimento: ${lista}.${selecionado ? ` Em destaque: ${nome(selecionado)}. Relações: ${rel.length ? rel.map((a) => `${nome(a.de)} e ${nome(a.para)} (${a.tipo})`).join('; ') : 'nenhuma neste mapa'}.` : ''}`
}

interface Props {
  selecionado?: string | null
  onSelecionar?: (id: string) => void
}

/** Linha do tempo dos pensadores: uma barra por vida, com as relações do selecionado marcadas por letra. */
export function LinhaDoTempoPensadores({ selecionado = null, onSelecionar }: Props) {
  const [ref, largura] = useLargura<SVGSVGElement>()
  const fs = (b: number) => fonteLegivel(b, largura)
  const alt = 26
  const topo = 30
  const H = topo + ORDENADOS.length * alt + 50
  const relacoes = new Map<string, TipoAresta[]>()
  if (selecionado)
    for (const a of ARESTAS) {
      const outro = a.de === selecionado ? a.para : a.para === selecionado ? a.de : null
      if (outro) relacoes.set(outro, [...(relacoes.get(outro) ?? []), a.tipo])
    }
  const yBase = topo + ORDENADOS.length * alt
  const ticksAntigos = [-470, -330]
  const ticksModernos = [1500, 1600, 1700, 1800, 1900]
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={descreverLinha(selecionado)} className="block h-auto w-full rounded-lg border border-[var(--line)] bg-[var(--surface)]">
      <rect x={X0 - 4} y={topo - 6} width={LARG_ANTIGA + 8} height={ORDENADOS.length * alt + 6} fill="var(--ink)" fillOpacity={0.05} />
      <rect x={X_MODERNA - 4} y={topo - 6} width={LARG_MODERNA + 10} height={ORDENADOS.length * alt + 6} fill="var(--ink)" fillOpacity={0.05} />
      <text x={X0 + LARG_ANTIGA / 2} y={20} textAnchor="middle" fontSize={fs(12)} fontWeight={600} fill="var(--ink)">Antiguidade</text>
      <text x={X_MODERNA + LARG_MODERNA / 2} y={20} textAnchor="middle" fontSize={fs(12)} fontWeight={600} fill="var(--ink)">Moderna e contemporânea</text>
      {ticksAntigos.map((t) => (
        <g key={t}>
          <line x1={posicaoDoAno(t)} x2={posicaoDoAno(t)} y1={topo - 4} y2={yBase} stroke="var(--grade)" strokeWidth={1} />
          <text x={posicaoDoAno(t)} y={yBase + 16} textAnchor="middle" fontSize={fs(11)} fill="var(--ink-muted)">{Math.abs(t)}</text>
        </g>
      ))}
      <text x={X0 + LARG_ANTIGA / 2} y={yBase + 32} textAnchor="middle" fontSize={fs(11)} fill="var(--ink-muted)">(anos a.C.)</text>
      {ticksModernos.map((t) => (
        <g key={t}>
          <line x1={posicaoDoAno(t)} x2={posicaoDoAno(t)} y1={topo - 4} y2={yBase} stroke="var(--grade)" strokeWidth={1} />
          <text x={Math.min(posicaoDoAno(t), W - 14)} y={yBase + 16} textAnchor="middle" fontSize={fs(11)} fill="var(--ink-muted)">{t}</text>
        </g>
      ))}
      {ORDENADOS.map((p, i) => {
        const y = topo + i * alt
        const x1 = posicaoDoAno(p.nascimento)
        const x2 = Math.max(posicaoDoAno(p.morte), x1 + 4)
        const sel = selecionado === p.id
        const rel = relacoes.get(p.id)
        const letras = rel ? [...new Set(rel.map((t) => SIGLA[t]))].join('') : ''
        return (
          <g key={p.id} onClick={onSelecionar ? () => onSelecionar(p.id) : undefined} style={onSelecionar ? { cursor: 'pointer' } : undefined}>
            <text x={X_NOMES} y={y + alt / 2 + 1} dominantBaseline="middle" fontSize={fs(12)} fontWeight={sel ? 700 : 500} fill="var(--ink)">{p.nome.split(' ').slice(-1)[0]}</text>
            <rect x={x1} y={y + 4} width={x2 - x1} height={alt - 8} rx={3} fill={COR_EPOCA[p.epoca]} fillOpacity={0.9} stroke={sel ? 'var(--ink)' : rel ? 'var(--ink)' : 'none'} strokeWidth={sel ? 3 : rel ? 2 : 0} strokeDasharray={!sel && rel ? '4 2' : undefined} />
            {letras && (
              <text x={Math.max(x1 - 6, X0)} y={y + alt / 2 + 1} textAnchor="end" dominantBaseline="middle" fontSize={fs(12)} fontWeight={700} fill="var(--ink)">{letras}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** Legenda das cores (épocas) e das letras (tipos de relação). */
export function LegendaLinha() {
  return (
    <div className="grid gap-1 text-sm">
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
        {(Object.keys(COR_EPOCA) as Epoca[]).map((e) => (
          <li key={e} className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm" style={{ background: COR_EPOCA[e] }} />
            {e}
          </li>
        ))}
      </ul>
      <p className="m-0 text-[var(--ink-muted)]">
        Letras ao lado das barras (relação com o pensador escolhido): M mestre e discípulo, C crítica, H herança, D diálogo, X contraste.
      </p>
    </div>
  )
}

export { ARESTAS, rotuloAno }

/* ------------------------------------------------------------------ quadro das correntes */

/** Cada corrente com a sua ideia central e os pensadores ligados a ela (tabela em texto, que funciona também em tela estreita). */
export function QuadroCorrentes({ destaque, onEscolher }: { destaque?: string; onEscolher?: (id: string) => void }) {
  return (
    <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2" aria-label="Correntes e pensadores">
      {CORRENTES.map((c) => {
        const nomes = PENSADORES.filter((p) => correntesAceitas(p.id).includes(c.id)).map((p) => (CORRENTE_DOS_PENSADORES[p.id]?.principal === c.id ? p.nome : `${p.nome} (também)`))
        const ativa = destaque === c.id
        return (
          <li key={c.id} className="cartao grid content-start gap-1 p-3" style={ativa ? { borderColor: 'var(--accent)', outline: '2px solid var(--accent)' } : undefined}>
            {onEscolher ? (
              <button type="button" aria-pressed={ativa} onClick={() => onEscolher(c.id)} className="m-0 min-h-11 bg-transparent p-0 text-left text-base font-semibold">
                {c.nome}
              </button>
            ) : (
              <p className="m-0 font-semibold">{c.nome}</p>
            )}
            <p className="m-0 text-sm">{c.sintese}</p>
            <p className="m-0 text-sm text-[var(--ink-muted)]">Pensadores: {nomes.join(', ')}</p>
          </li>
        )
      })}
    </ul>
  )
}
