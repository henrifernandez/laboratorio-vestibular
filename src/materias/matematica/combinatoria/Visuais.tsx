import { useMemo, useState } from 'react'
import { ChevronsDown, ChevronsUp } from 'lucide-react'
import { criarRng } from '@/lib/rng'
import { larguraTexto } from '@/lib/rotulos'
import { combinacao, arranjo, fatorial, listarArranjos, listarCombinacoes } from './calculo'
import { construirArvore, folhasFormadas, nosVisiveis, type NivelArvore } from './arvore'
import { contar, sequencia } from './simulacao'

const pct = (x: number) => `${String(Math.round(x * 1000) / 10).replace('.', ',')}%`

/* ------------------------------------------------------------------ árvore */

export function ArvorePossibilidades({ niveis, interativa = true, expandirTudo = false }: { niveis: NivelArvore[]; interativa?: boolean; expandirTudo?: boolean }) {
  const { nos, folhas } = useMemo(() => construirArvore(niveis), [niveis])
  const todos = useMemo(() => new Set(nos.filter((n) => n.filhos.length).map((n) => n.id)), [nos])
  const [expandidos, setExpandidos] = useState<Set<string>>(() => new Set(expandirTudo ? todos : ['r']))
  const visiveis = nosVisiveis(nos, expandidos)
  const formadas = folhasFormadas(nos, expandidos)

  const largCol = 92
  const alturaLinha = 26
  const larg = largCol * niveis.length + 14 + 96
  const alt = Math.max(1, folhas) * alturaLinha + 20
  const pos = (n: { nivel: number; y: number }) => ({ x: 14 + n.nivel * largCol, y: 14 + n.y * alturaLinha })
  const porId = new Map(nos.map((n) => [n.id, n]))

  const alternar = (id: string) => {
    if (!interativa) return
    setExpandidos((e) => {
      const n = new Set(e)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  return (
    <div className="grid gap-2">
      <div className="cartao overflow-x-auto p-2">
        <svg viewBox={`0 0 ${larg} ${alt}`} width="100%" role="group" aria-label={`Árvore de possibilidades: ${niveis.map((n) => `${n.nome} (${n.opcoes.length})`).join(', ')}`} style={{ minWidth: Math.min(larg, 360) }}>
          {visiveis
            .filter((n) => n.pai)
            .map((n) => {
              const a = pos(porId.get(n.pai as string)!)
              const b = pos(n)
              return <path key={n.id} d={`M ${a.x + 8} ${a.y} C ${a.x + 40} ${a.y}, ${b.x - 40} ${b.y}, ${b.x - 8} ${b.y}`} fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
            })}
          {visiveis.map((n) => {
            const p = pos(n)
            const temFilhos = n.filhos.length > 0
            const aberto = expandidos.has(n.id)
            const folha = !temFilhos
            return (
              <g
                key={n.id}
                transform={`translate(${p.x} ${p.y})`}
                role={interativa && temFilhos ? 'button' : undefined}
                tabIndex={interativa && temFilhos ? 0 : undefined}
                aria-label={interativa && temFilhos ? `${n.rotulo}: ${aberto ? 'recolher' : 'mostrar'} as ${niveis[n.nivel]?.opcoes.length} opções de ${niveis[n.nivel]?.nome}` : undefined}
                aria-expanded={interativa && temFilhos ? aberto : undefined}
                onClick={() => temFilhos && alternar(n.id)}
                onKeyDown={(e) => {
                  if (temFilhos && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    alternar(n.id)
                  }
                }}
                style={{ cursor: interativa && temFilhos ? 'pointer' : 'default' }}
              >
                {/* área de toque invisível: a linha inteira do nó, com o rótulo (a linha tem 26 unidades, cerca de 24 px na tela) */}
                {interativa && temFilhos && <rect x={-12} y={-alturaLinha / 2} width={24 + (n.nivel > 0 ? larguraTexto(n.rotulo, 11) : 26)} height={alturaLinha} fill="transparent" />}
                <circle r={n.nivel === 0 ? 8 : 7} fill={folha ? 'var(--accent)' : aberto ? 'var(--surface-2)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="2" />
                {interativa && temFilhos && !aberto && (
                  <text textAnchor="middle" y="4" fontSize="11" fill="var(--accent)" fontWeight="700">
                    +
                  </text>
                )}
                {n.nivel > 0 && (
                  <text x="12" y="4" fontSize="11" fill="var(--ink)">
                    {n.rotulo}
                  </text>
                )}
                {n.nivel === 0 && (
                  <text x="-2" y="-12" fontSize="10" fill="var(--ink-muted)">
                    início
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="num font-semibold" aria-live="polite">
          Possibilidades formadas: {formadas} de {folhas}
          {formadas === folhas && niveis.length > 0 && <span> = {niveis.map((n) => n.opcoes.length).join(' × ')}</span>}
        </p>
        {interativa && (
          <>
            <button type="button" className="btn" onClick={() => setExpandidos(new Set(todos))}>
              <ChevronsDown size={18} aria-hidden="true" />
              Mostrar tudo
            </button>
            <button type="button" className="btn btn-fantasma" onClick={() => setExpandidos(new Set(['r']))}>
              <ChevronsUp size={18} aria-hidden="true" />
              Recolher
            </button>
          </>
        )}
      </div>
      {interativa && <p className="text-sm text-[var(--ink-muted)]">Clique nos círculos com + para abrir os ramos.</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ listas */

export function ListaChips({ itens, titulo, destaque }: { itens: string[]; titulo: string; destaque?: ReadonlySet<string> }) {
  return (
    <section className="cartao grid content-start gap-2 p-3" aria-label={titulo}>
      <h3 className="text-base font-semibold">
        {titulo} <span className="num text-[var(--ink-muted)]">({itens.length})</span>
      </h3>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {itens.map((s) => (
          <li
            key={s}
            className="chip num"
            style={destaque?.has(s) ? { background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' } : undefined}
          >
            {s}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function VisualPermutacao({ letras }: { letras: string[] }) {
  const itens = listarArranjos(letras, letras.length)
  return (
    <div className="grid gap-2">
      <ListaChips itens={itens} titulo={`Filas possíveis com ${letras.join(', ')}`} />
      <p className="num text-center text-lg">
        {letras.length}! = {letras.map((_, i) => letras.length - i).join(' × ')} = <strong>{fatorial(letras.length)}</strong>
      </p>
    </div>
  )
}

export function VisualArranjoCombinacao({ letras, p }: { letras: string[]; p: number }) {
  const arr = listarArranjos(letras, p)
  const com = listarCombinacoes(letras, p)
  const [sel, setSel] = useState<string | null>(com[0] ?? null)
  const destaque = new Set(sel ? arr.filter((a) => [...a].sort().join('') === sel) : [])
  return (
    <div className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <ListaChips itens={arr} titulo="Arranjos (a ordem importa)" destaque={destaque} />
        <section className="cartao grid content-start gap-2 p-3" aria-label="Combinações">
          <h3 className="text-base font-semibold">
            Combinações (a ordem não importa) <span className="num text-[var(--ink-muted)]">({com.length})</span>
          </h3>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
            {com.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className="chip num min-h-9"
                  aria-pressed={sel === c}
                  onClick={() => setSel(c)}
                  style={sel === c ? { background: 'var(--accent)', color: 'var(--on-accent)', borderColor: 'var(--accent)' } : undefined}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="num text-center" aria-live="polite">
        A({letras.length}, {p}) = {arranjo(letras.length, p)} · C({letras.length}, {p}) = {combinacao(letras.length, p)} · cada combinação gera {p}! = {fatorial(p)} arranjos
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ dado e simulação */

const PONTOS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
  6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
}

export function Dado({ n, destaque }: { n: number; destaque?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" width="52" height="52" role="img" aria-label={`Face ${n}${destaque ? ', favorável' : ''}`}>
      <rect x="2" y="2" width="36" height="36" rx="7" fill={destaque ? 'var(--accent)' : 'var(--surface)'} stroke={destaque ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth="2" />
      {(PONTOS[n] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x * 10 + 5} cy={y * 10 + 5} r="3.2" fill={destaque ? 'var(--on-accent)' : 'var(--ink)'} />
      ))}
    </svg>
  )
}

export function VisualDado({ favoraveis, titulo }: { favoraveis: number[]; titulo: string }) {
  return (
    <div className="cartao grid gap-3 p-4">
      <div className="flex flex-wrap justify-center gap-2" role="list" aria-label="Faces do dado">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} role="listitem">
            <Dado n={n} destaque={favoraveis.includes(n)} />
          </span>
        ))}
      </div>
      <p className="num text-center text-lg">
        {titulo}: {favoraveis.length} favoráveis ÷ 6 possíveis = <strong>{favoraveis.length}/6</strong>
      </p>
    </div>
  )
}

export function BarrasFrequencia({ rotulos, freqs, probs, total }: { rotulos: string[]; freqs: number[]; probs: number[]; total: number }) {
  return (
    <figure className="cartao m-0 p-3" aria-label="Frequência relativa de cada resultado comparada com a probabilidade teórica (tracejado)">
      <div className="flex h-40 items-end gap-2">
        {rotulos.map((r, i) => {
          const f = total ? (freqs[i] as number) / total : 0
          return (
            <div key={r} className="relative flex min-w-0 flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
              <span className="num text-xs font-semibold">{pct(f)}</span>
              <div className="relative w-full" style={{ height: '75%' }}>
                <div className="absolute bottom-0 w-full rounded-t-md transition-[height] duration-200" style={{ height: `${Math.min(100, f * 100 * (1 / (Math.max(...probs) * 1.4)))}%`, background: 'var(--accent)' }} />
                <div className="absolute w-full border-t-2 border-dashed" style={{ bottom: `${Math.min(100, (probs[i] as number) * 100 * (1 / (Math.max(...probs) * 1.4)))}%`, borderColor: 'var(--ink)' }} />
              </div>
              <span className="text-xs text-[var(--ink-muted)]">{r}</span>
            </div>
          )
        })}
      </div>
      <figcaption className="mt-1 text-xs text-[var(--ink-muted)]">Linha tracejada: probabilidade teórica de cada resultado.</figcaption>
    </figure>
  )
}

export function VisualSimulacao({ lancamentos }: { lancamentos: number[] }) {
  const dados = useMemo(() => {
    const rng = criarRng(2026)
    const seq = sequencia(rng, [0.5, 0.5], Math.max(...lancamentos))
    return lancamentos.map((n) => ({ n, c: contar(seq, 2, n) }))
  }, [lancamentos])
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {dados.map(({ n, c }) => (
        <div key={n} className="grid gap-1">
          <p className="num text-center font-semibold">{n.toLocaleString('pt-BR')} lançamentos</p>
          <BarrasFrequencia rotulos={['cara', 'coroa']} freqs={c} probs={[0.5, 0.5]} total={n} />
        </div>
      ))}
    </div>
  )
}
