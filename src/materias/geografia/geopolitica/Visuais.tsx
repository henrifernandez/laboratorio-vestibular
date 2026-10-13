import { ESTAGIOS, PONTOS, type Bloco, type IdEstagio, type PontoEstrategico } from '@/conteudo/geografia/geopolitica'
import { COR_DESTAQUE, MapaPaises, type PontoMapa } from '../mapa-desafio/Visuais'
import { exigencias } from './calculo'

/* ------------------------------------------------------------------ mapa de um bloco */

/** Mapa com os países do bloco em destaque. Países pequenos demais podem não aparecer; a lista abaixo do mapa mostra todos. */
export function MapaBloco({ bloco }: { bloco: Bloco }) {
  const destaques = Object.fromEntries(bloco.membros.map((m) => [m.id, COR_DESTAQUE]))
  return (
    <div className="grid gap-2">
      <MapaPaises regiao={bloco.regiao} destaques={destaques} descricao={`Mapa com os países do ${bloco.sigla} (${bloco.lista}) em destaque: ${bloco.membros.map((m) => m.nome).join(', ')}.`} />
      <ListaMembros bloco={bloco} />
    </div>
  )
}

export function ListaMembros({ bloco }: { bloco: Bloco }) {
  return (
    <p className="m-0 text-sm" aria-label={`Países do ${bloco.sigla}`}>
      <strong>
        {bloco.sigla}, {bloco.lista}:
      </strong>{' '}
      {bloco.membros.map((m) => m.nome).join(', ')}.
    </p>
  )
}

/* ------------------------------------------------------------------ estágios de integração */

const COLUNAS: { chave: 'tarifaZero' | 'tarifaExterna' | 'fatores' | 'moeda'; rotulo: string }[] = [
  { chave: 'tarifaZero', rotulo: 'Sem tarifas entre os membros' },
  { chave: 'tarifaExterna', rotulo: 'Tarifa externa comum' },
  { chave: 'fatores', rotulo: 'Pessoas, capitais e serviços circulam livremente' },
  { chave: 'moeda', rotulo: 'Moeda única e políticas coordenadas' },
]

/** Escada dos quatro estágios: cada linha mostra o que o estágio exige (✓), sempre incluindo o que vem antes. */
export function EscadaIntegracao({ destaque }: { destaque?: IdEstagio | null }) {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Estágios de integração econômica: cada um inclui os anteriores</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th scope="col" className="py-1 pr-2">Estágio</th>
            {COLUNAS.map((c) => (
              <th key={c.chave} scope="col" className="px-1">{c.rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ESTAGIOS.map((e) => {
            const ex = exigencias(e.id)
            return (
              <tr key={e.id} className="border-b border-[var(--line)] align-top" style={e.id === destaque ? { background: 'var(--surface-2)', outline: '2px solid var(--accent)' } : undefined}>
                <th scope="row" className="py-1 pr-2 font-semibold">
                  {e.numero}. {e.nome}
                </th>
                {COLUNAS.map((c) => (
                  <td key={c.chave} className="px-1">
                    {ex[c.chave] ? (
                      <span aria-label="sim">✓</span>
                    ) : (
                      <span aria-label="não" className="text-[var(--ink-muted)]">
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ pontos estratégicos */

/** Pontos para o mapa: numerados (1, 2, 3...), ou só um ponto, sem texto, para a pergunta “qual é este lugar?”. */
export function pontosDoMapa(pontos: PontoEstrategico[], opcoes: { numerar?: boolean } = {}): PontoMapa[] {
  return pontos.map((p, i) => ({ lat: p.lat, lon: p.lon, rotulo: opcoes.numerar ? String(i + 1) : undefined }))
}

export function MapaPontos({ pontos = PONTOS, numerar = true, descricao }: { pontos?: PontoEstrategico[]; numerar?: boolean; descricao?: string }) {
  const lista = pontos.map((p, i) => `${numerar ? `${i + 1}, ` : ''}${p.nome}`).join('; ')
  return <MapaPaises regiao="mundo" pontos={pontosDoMapa(pontos, { numerar })} descricao={descricao ?? `Mapa-múndi com os pontos estratégicos marcados: ${lista}.`} />
}

export function ListaPontos({ pontos = PONTOS, destaque, onEscolher }: { pontos?: PontoEstrategico[]; destaque?: string; onEscolher?: (id: string) => void }) {
  return (
    <ol className="m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2" aria-label="Pontos estratégicos do mapa">
      {pontos.map((p, i) => (
        <li key={p.id}>
          <button
            type="button"
            aria-pressed={destaque === p.id}
            onClick={() => onEscolher?.(p.id)}
            disabled={!onEscolher}
            className="grid min-h-11 w-full grid-cols-[1.6rem_1fr] items-center gap-2 rounded-[var(--radius-sm)] border bg-[var(--surface)] px-2 text-left text-sm"
            style={{ borderColor: destaque === p.id ? 'var(--accent)' : 'var(--line-strong)', outline: destaque === p.id ? '2px solid var(--accent)' : undefined }}
          >
            <span className="num grid size-6 place-items-center rounded-full border border-[var(--ink)] text-xs font-bold">{i + 1}</span>
            <span>
              {p.nome} <span className="text-[var(--ink-muted)]">({p.tipo})</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
