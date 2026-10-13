import { useEffect, useRef, type CSSProperties } from 'react'
import { ArrowDown, Flag, Users, X, Zap } from 'lucide-react'
import { FICHAS } from '@/conteudo/historia/fichas'
import { rotuloAno, type Acontecimento } from '@/conteudo/historia/tipos'
import { eraDoAno } from './calculo'
import { COR_TIPO, ICONE_TIPO } from './LinhaDoTempo'

/** Primeira frase do resumo: o "o que foi" da ficha. */
export function primeiraFrase(texto: string): string {
  const m = /^.+?[.!?](?=\s+[A-ZÀ-Ú]|$)/.exec(texto)
  return m ? m[0] : texto
}

interface Props {
  ev: Acontecimento
  /** posição dentro da linha do tempo (calculada por ela) */
  estilo: CSSProperties
  onFechar: () => void
  /** leva ao card completo, com causas, consequências e relações */
  onDetalhes?: () => void
  /** com espaço, o texto vai em duas colunas e a ficha cabe sem rolar */
  largo?: boolean
}

/**
 * Card que abre ao clicar num acontecimento da linha do tempo: o essencial em poucas linhas
 * (o que foi, gatilho, marcos e pessoas). O card completo continua embaixo da linha.
 */
export function FichaRapida({ ev, estilo, onFechar, onDetalhes, largo = false }: Props) {
  const ref = useRef<HTMLElement>(null)
  const ficha = FICHAS[ev.id]
  const era = eraDoAno(ev.regiao, ev.inicio)
  const Icone = ICONE_TIPO[ev.tipo]
  const idTitulo = `ficha-${ev.id}`

  // ao abrir (ou trocar de acontecimento), o foco vai para a ficha, sem rolar a página
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [ev.id])

  const bloco = (IconeBloco: typeof Zap, titulo: string, conteudo: React.ReactNode) => (
    <div className="grid grid-cols-[18px_1fr] gap-x-1.5">
      <IconeBloco size={15} aria-hidden="true" className="mt-0.5 text-[var(--ink-muted)]" />
      <div className="min-w-0">
        <h4 className="m-0 text-xs font-bold text-[var(--ink-muted)]">{titulo}</h4>
        {conteudo}
      </div>
    </div>
  )

  // com espaço, o botão fica no cabeçalho; na ficha estreita, embaixo, para não espremer o título
  const botaoDetalhes = onDetalhes && (
    <button type="button" aria-label="Causas, consequências e relações, no card completo" title="Causas, consequências e relações" className={`btn min-h-11 text-sm ${largo ? '-mt-1 flex-none px-2' : 'justify-center'}`} onClick={onDetalhes}>
      <ArrowDown size={16} aria-hidden="true" /> {largo ? 'Detalhes' : 'Causas, consequências e relações'}
    </button>
  )

  return (
    <section
      ref={ref}
      data-ficha
      role="dialog"
      aria-modal="false"
      aria-labelledby={idTitulo}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onFechar()
        }
      }}
      className="absolute z-[20] grid content-start gap-2 overflow-y-auto rounded-xl border-2 bg-[var(--surface)] p-3 text-sm leading-snug shadow-lg focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
      style={{ ...estilo, borderColor: era?.cor ?? 'var(--line-strong)', cursor: 'auto' }}
    >
      <header className="flex items-start gap-2">
        <Icone size={18} aria-hidden="true" style={{ color: COR_TIPO[ev.tipo], flex: 'none', marginTop: 2 }} />
        <div className="min-w-0 flex-1">
          <p className="num m-0 text-xs font-bold text-[var(--ink-muted)]">
            {rotuloAno(ev)}
            {era ? ` · ${era.nome}` : ''}
          </p>
          <h3 id={idTitulo} className="m-0 text-base leading-tight">
            {ev.titulo}
          </h3>
        </div>
        {largo && botaoDetalhes}
        <button type="button" aria-label="Fechar a ficha" onClick={onFechar} className="-mr-1 -mt-1 grid size-11 flex-none place-items-center rounded-md hover:bg-[var(--surface-2)]">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className={largo ? 'grid grid-cols-2 gap-x-4' : 'grid gap-2'}>
        <div className="grid content-start gap-2">
          <p className="m-0">{primeiraFrase(ev.resumo)}</p>
          {ficha?.gatilho && bloco(Zap, 'Gatilho', <p className="m-0">{ficha.gatilho}</p>)}
        </div>
        <div className="grid content-start gap-2">
          {ficha &&
            ficha.marcos.length > 0 &&
            bloco(
              Flag,
              'Marcos',
              <ul className="m-0 grid list-none gap-0.5 p-0">
                {ficha.marcos.map((m) => {
                  const i = m.indexOf(': ')
                  return (
                    <li key={m}>
                      {i > 0 ? (
                        <>
                          <strong className="num">{m.slice(0, i)}</strong>: {m.slice(i + 2)}
                        </>
                      ) : (
                        m
                      )}
                    </li>
                  )
                })}
              </ul>,
            )}
          {ficha && ficha.pessoas.length > 0 && bloco(Users, 'Pessoas', <p className="m-0">{ficha.pessoas.join('; ')}</p>)}
        </div>
      </div>
      {!largo && botaoDetalhes}
    </section>
  )
}
