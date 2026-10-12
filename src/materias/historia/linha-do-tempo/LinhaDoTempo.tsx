import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as PointerReact } from 'react'
import { Coins, Landmark, Palette, Swords, Users, type LucideIcon } from 'lucide-react'
import { rotuloAno, type Acontecimento, type Era, type TipoEvento } from '@/conteudo/historia/tipos'
import { VISTA_TOTAL, deslocar, limitarVista, marcasDoEixo, posicaoDoAno, posicionarRotulos, trechoVisivel, vistaParaIntervalo, zoomEm, type Vista } from './calculo'

export const ICONE_TIPO: Record<TipoEvento, LucideIcon> = { politico: Landmark, economico: Coins, social: Users, cultural: Palette, guerra: Swords }
/** Cor de cada tipo de acontecimento (tokens que já têm versão para o modo escuro). */
export const COR_TIPO: Record<TipoEvento, string> = { politico: 'var(--el-n)', economico: 'var(--quim-b)', social: 'var(--quim-c)', cultural: 'var(--ok)', guerra: 'var(--el-o)' }
/** Fundo suave de uma era: a cor dela misturada com a superfície, para o texto manter o contraste. */
export const fundoDaEra = (cor: string) => `color-mix(in srgb, ${cor} 20%, var(--surface))`

const FAIXA = 24 // espessura da faixa de eras
const GAP = 15 // metade da faixa do eixo (marcas dos anos)
const MARGEM = 8 // espaço entre a faixa e o primeiro rótulo
const LINHA_ALTURA = 44
const LINHA_PASSO = 50
const ROTULO_L = 132

interface Props {
  eventos: Acontecimento[]
  eras: Era[]
  vista: Vista
  selecionado: string | null
  onVista: (v: Vista) => void
  onSelecionar: (id: string) => void
  mostrarMundo: boolean
  mostrarBrasil: boolean
}

/**
 * Linha do tempo com zoom (roda do mouse, pinça e teclas) e arraste. Horizontal quando há espaço; vertical no celular.
 * Mundo de um lado do eixo e Brasil do outro; os acontecimentos mais importantes aparecem primeiro e os demais, ao aproximar.
 */
export function LinhaDoTempo({ eventos, eras, vista, selecionado, onVista, onSelecionar, mostrarMundo, mostrarBrasil }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [dim, setDim] = useState({ w: 900, h: 440 })
  const vertical = dim.w < 640
  const altura = vertical ? 520 : 440

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setDim({ w, h: vertical ? 520 : 440 })
    }
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [vertical])

  const L = vertical ? altura : dim.w // comprimento do eixo
  const cruz = vertical ? dim.w : altura // largura transversal
  const eixo = cruz / 2
  const bordaMundo = eixo - GAP - FAIXA
  const bordaBrasil = eixo + GAP + FAIXA

  // linhas de rótulos de cada lado
  const espaco = eixo - GAP - FAIXA - MARGEM
  const linhas = vertical ? Math.max(1, Math.floor(espaco / (ROTULO_L + 6))) : Math.max(1, Math.floor((espaco + 6) / LINHA_PASSO))
  const tamanho = vertical ? LINHA_ALTURA + 2 : ROTULO_L
  const larguraRotulo = vertical ? Math.min(ROTULO_L + 20, Math.floor(espaco / linhas) - 4) : ROTULO_L

  const lado = useMemo(() => {
    const opcoes = { L, vista, tamanho, linhas, centrado: vertical }
    return {
      mundo: posicionarRotulos(eventos.filter((e) => e.regiao === 'mundo'), opcoes),
      brasil: posicionarRotulos(eventos.filter((e) => e.regiao === 'brasil'), opcoes),
    }
  }, [eventos, L, vista, tamanho, linhas, vertical])

  /* ---------- zoom e arraste ---------- */
  const vistaRef = useRef(vista)
  const onVistaRef = useRef(onVista)
  const dimRef = useRef({ vertical, L })
  useEffect(() => {
    vistaRef.current = vista
    onVistaRef.current = onVista
    dimRef.current = { vertical, L }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const roda = (ev: WheelEvent) => {
      ev.preventDefault()
      const r = el.getBoundingClientRect()
      const ancora = dimRef.current.vertical ? (ev.clientY - r.top) / r.height : (ev.clientX - r.left) / r.width
      const fator = Math.min(1.5, Math.max(0.66, Math.exp(ev.deltaY * 0.0015)))
      onVistaRef.current(zoomEm(vistaRef.current, Math.min(1, Math.max(0, ancora)), fator))
    }
    el.addEventListener('wheel', roda, { passive: false })
    return () => el.removeEventListener('wheel', roda)
  }, [])

  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const gesto = useRef<{ tipo: 'pan' | 'pinch'; vista0: Vista; ini: number; distancia0: number; ancora: number; moveu: boolean } | null>(null)
  const coord = (p: { x: number; y: number }) => (vertical ? p.y : p.x)

  const aoPressionar = (ev: PointerReact<HTMLDivElement>) => {
    if ((ev.target as HTMLElement).closest('button')) return
    ponteiros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    const pts = [...ponteiros.current.values()]
    const r = ev.currentTarget.getBoundingClientRect()
    if (pts.length === 1) gesto.current = { tipo: 'pan', vista0: vista, ini: coord(pts[0] as { x: number; y: number }), distancia0: 0, ancora: 0, moveu: false }
    else if (pts.length === 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }]
      const meio = vertical ? (a.y + b.y) / 2 - r.top : (a.x + b.x) / 2 - r.left
      gesto.current = { tipo: 'pinch', vista0: vista, ini: 0, distancia0: Math.hypot(a.x - b.x, a.y - b.y), ancora: Math.min(1, Math.max(0, meio / (vertical ? r.height : r.width))), moveu: true }
    }
  }
  const aoMover = (ev: PointerReact<HTMLDivElement>) => {
    const g = gesto.current
    if (!g || !ponteiros.current.has(ev.pointerId)) return
    ponteiros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    const pts = [...ponteiros.current.values()]
    if (g.tipo === 'pinch' && pts.length >= 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d > 0 && g.distancia0 > 0) onVista(zoomEm(g.vista0, g.ancora, g.distancia0 / d))
    } else if (g.tipo === 'pan' && pts.length === 1) {
      const delta = coord(pts[0] as { x: number; y: number }) - g.ini
      if (!g.moveu && Math.abs(delta) > 4) {
        g.moveu = true
        ev.currentTarget.setPointerCapture?.(ev.pointerId)
      }
      if (g.moveu) onVista(limitarVista({ c: g.vista0.c - (delta / L) * g.vista0.s, s: g.vista0.s }))
    }
  }
  const aoSoltar = (ev: PointerReact<HTMLDivElement>) => {
    ponteiros.current.delete(ev.pointerId)
    if (ponteiros.current.size === 0) gesto.current = null
    else if (ponteiros.current.size === 1) {
      const p = [...ponteiros.current.values()][0] as { x: number; y: number }
      gesto.current = { tipo: 'pan', vista0: vistaRef.current, ini: coord(p), distancia0: 0, ancora: 0, moveu: true }
    }
  }

  const aoTeclar = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.target !== ev.currentTarget) return
    const passo = vista.s * 0.12
    const avanca = vertical ? 'ArrowDown' : 'ArrowRight'
    const volta = vertical ? 'ArrowUp' : 'ArrowLeft'
    if (ev.key === '+' || ev.key === '=') onVista(zoomEm(vista, 0.5, 0.8))
    else if (ev.key === '-' || ev.key === '_') onVista(zoomEm(vista, 0.5, 1.25))
    else if (ev.key === avanca) onVista(deslocar(vista, passo))
    else if (ev.key === volta) onVista(deslocar(vista, -passo))
    else if (ev.key === 'Home') onVista(VISTA_TOTAL)
    else return
    ev.preventDefault()
  }

  /* ---------- desenho ---------- */
  const marcas = marcasDoEixo(vista)
  const p = (ano: number) => posicaoDoAno(ano, vista, L)
  const eixoStyle = vertical ? { left: eixo - 1, top: 0, bottom: 0, width: 2 } : { top: eixo - 1, left: 0, right: 0, height: 2 }
  const ocultos = (mostrarMundo ? lado.mundo.ocultos : 0) + (mostrarBrasil ? lado.brasil.ocultos : 0)
  const porId = new Map(eventos.map((e) => [e.id, e]))

  const rotulosDe = (regiao: 'mundo' | 'brasil') => {
    const mundo = regiao === 'mundo'
    const { colocados } = mundo ? lado.mundo : lado.brasil
    return colocados.map((c) => {
      const e = porId.get(c.id) as Acontecimento
      const Icone = ICONE_TIPO[e.tipo]
      const sel = selecionado === e.id
      const era = eras.find((x) => x.regiao === e.regiao && e.inicio >= x.inicio && e.inicio <= x.fim)
      // posição transversal do rótulo
      const afastamento = MARGEM + c.linha * (vertical ? 0 : LINHA_PASSO)
      let estilo: React.CSSProperties
      if (vertical) {
        estilo = mundo ? { top: c.inicio, right: dim.w - bordaMundo + MARGEM, width: larguraRotulo, height: tamanho - 2 } : { top: c.inicio, left: bordaBrasil + MARGEM, width: larguraRotulo, height: tamanho - 2 }
      } else {
        estilo = mundo ? { left: c.inicio, bottom: cruz - bordaMundo + afastamento, width: ROTULO_L, height: LINHA_ALTURA } : { left: c.inicio, top: bordaBrasil + afastamento, width: ROTULO_L, height: LINHA_ALTURA }
      }
      return (
        <div key={e.id}>
          {/* haste e ponto sobre a faixa */}
          {!vertical && <div aria-hidden="true" className="absolute w-px bg-[var(--line-strong)]" style={{ left: c.pos, ...(mundo ? { bottom: cruz - bordaMundo, height: afastamento } : { top: bordaBrasil, height: afastamento }) }} />}
          <div aria-hidden="true" className="absolute size-2.5 rounded-full border-2 border-[var(--surface)]" style={{ background: COR_TIPO[e.tipo], ...(vertical ? { top: c.pos - 5, ...(mundo ? { left: bordaMundo - 5 } : { left: bordaBrasil - 5 }) } : { left: c.pos - 5, ...(mundo ? { top: bordaMundo - 5 } : { top: bordaBrasil - 5 }) }) }} />
          <button
            type="button"
            aria-pressed={sel}
            aria-label={`${e.titulo}, ${rotuloAno(e)}`}
            onClick={() => onSelecionar(e.id)}
            className="absolute flex items-start gap-1 overflow-hidden rounded-md border bg-[var(--surface)] px-1.5 py-1 text-left leading-tight shadow-sm transition-colors hover:bg-[var(--surface-2)]"
            style={{ ...estilo, borderColor: sel ? 'var(--accent)' : 'var(--line-strong)', borderLeftColor: era?.cor ?? 'var(--line-strong)', borderLeftWidth: 4, outline: sel ? '2px solid var(--accent)' : undefined }}
          >
            <Icone size={13} aria-hidden="true" style={{ color: COR_TIPO[e.tipo], flex: 'none', marginTop: 1 }} />
            <span className="min-w-0">
              <span className="num block text-[11px] font-bold">{rotuloAno(e)}</span>
              <span className="line-clamp-2 block text-[11px]">{e.titulo}</span>
            </span>
          </button>
        </div>
      )
    })
  }

  const faixasDeEras = (regiao: 'mundo' | 'brasil') => {
    const mundo = regiao === 'mundo'
    return eras
      .filter((e) => e.regiao === regiao)
      .map((era) => {
        const t = trechoVisivel(era.inicio, era.fim, vista, L)
        if (!t) return null
        const larg = t.b - t.a
        const posCruz = mundo ? bordaMundo : eixo + GAP
        const estilo: React.CSSProperties = vertical ? { top: t.a, height: larg, left: posCruz, width: FAIXA } : { left: t.a, width: larg, top: posCruz, height: FAIXA }
        return (
          <div
            key={era.id}
            aria-hidden="true"
            title={`${era.nome} (${era.inicio}–${era.fim})`}
            onDoubleClick={() => onVista(vistaParaIntervalo(era.inicio, era.fim))}
            className="absolute flex items-center justify-center overflow-hidden text-[11px] font-semibold"
            style={{ ...estilo, background: fundoDaEra(era.cor), borderLeft: vertical ? undefined : `3px solid ${era.cor}`, borderTop: vertical ? `3px solid ${era.cor}` : undefined, writingMode: vertical ? 'vertical-rl' : undefined }}
          >
            {larg > (vertical ? 56 : 70) && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap px-1" style={vertical ? { maxHeight: larg - 8 } : { maxWidth: larg - 8 }}>
                {era.nome}
              </span>
            )}
          </div>
        )
      })
  }

  const barras = eventos
    .filter((e) => e.fim !== undefined && (e.regiao === 'mundo' ? mostrarMundo : mostrarBrasil))
    .map((e) => {
      const t = trechoVisivel(e.inicio, e.fim as number, vista, L)
      if (!t) return null
      const mundo = e.regiao === 'mundo'
      const estilo: React.CSSProperties = vertical ? { top: t.a, height: t.b - t.a, width: 4, ...(mundo ? { left: bordaMundo - 7 } : { left: bordaBrasil + 3 }) } : { left: t.a, width: t.b - t.a, height: 4, ...(mundo ? { top: bordaMundo - 7 } : { top: bordaBrasil + 3 }) }
      return <div key={`b-${e.id}`} aria-hidden="true" className="absolute rounded-full opacity-70" style={{ ...estilo, background: COR_TIPO[e.tipo] }} />
    })

  return (
    <div className="grid gap-2">
      <div
        ref={ref}
        role="group"
        tabIndex={0}
        aria-label="Linha do tempo. Use + e − para aproximar e afastar, as setas para mover e Home para ver tudo. Os acontecimentos são botões."
        onKeyDown={aoTeclar}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        className="relative cursor-grab select-none overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--surface)] active:cursor-grabbing focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        style={{ height: altura, touchAction: 'none' }}
      >
        <div aria-hidden="true" className="absolute bg-[var(--line-strong)]" style={eixoStyle} />
        {marcas.map((a) => (
          <div key={a} aria-hidden="true" className="num absolute text-center text-[10.5px] text-[var(--ink-muted)]" style={vertical ? { top: p(a) - 7, left: eixo - GAP, width: GAP * 2 } : { left: p(a) - 20, width: 40, top: eixo - 8 }}>
            {a}
          </div>
        ))}
        {mostrarMundo && faixasDeEras('mundo')}
        {mostrarBrasil && faixasDeEras('brasil')}
        {barras}
        {mostrarMundo && rotulosDe('mundo')}
        {mostrarBrasil && rotulosDe('brasil')}
        <span aria-hidden="true" className="pointer-events-none absolute text-[11px] font-bold text-[var(--ink-muted)]" style={vertical ? { top: 2, left: 6 } : { left: 6, top: 4 }}>
          {mostrarMundo ? 'Mundo' : ''}
        </span>
        <span aria-hidden="true" className="pointer-events-none absolute text-[11px] font-bold text-[var(--ink-muted)]" style={vertical ? { top: 2, right: 6 } : { left: 6, bottom: 4 }}>
          {mostrarBrasil ? 'Brasil' : ''}
        </span>
      </div>
      <p className="m-0 text-sm text-[var(--ink-muted)]" aria-live="polite">
        Mostrando de {Math.round(vista.c - vista.s / 2)} a {Math.round(vista.c + vista.s / 2)}
        {ocultos > 0 ? `. ${ocultos} acontecimento${ocultos === 1 ? '' : 's'} não cabe${ocultos === 1 ? '' : 'm'} neste zoom: aproxime para ver.` : '.'}
      </p>
    </div>
  )
}
