import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as PointerReact } from 'react'
import { Coins, Landmark, Palette, Swords, Users, type LucideIcon } from 'lucide-react'
import { ANO_MAX, ANO_MIN } from '@/conteudo/historia/linhaDoTempo'
import { formatarAno, rotuloAno, type Acontecimento, type Era, type TipoEvento } from '@/conteudo/historia/tipos'
import { FIM_COMPRIMIDO, VISTA_TOTAL, deU, deslocarPorPixels, limitarVista, marcasDoEixo, paraU, posicaoDoAno, posicionarRotulos, rotuloEra, trechoVisivel, vistaParaIntervalo, zoomEm, type Vista } from './calculo'
import { FichaRapida } from './FichaRapida'

export const ICONE_TIPO: Record<TipoEvento, LucideIcon> = { politico: Landmark, economico: Coins, social: Users, cultural: Palette, guerra: Swords }
/** Cor de cada tipo de acontecimento (tokens que já têm versão para o modo escuro). */
export const COR_TIPO: Record<TipoEvento, string> = { politico: 'var(--el-n)', economico: 'var(--quim-b)', social: 'var(--quim-c)', cultural: 'var(--ok)', guerra: 'var(--el-o)' }
/** Fundo suave de uma era: a cor dela misturada com a superfície, para o texto manter o contraste. */
export const fundoDaEra = (cor: string) => `color-mix(in srgb, ${cor} 20%, var(--surface))`

const FAIXA = 28 // espessura da faixa de eras
const GAP = 18 // metade da faixa do eixo, onde ficam os anos
const MARGEM = 12 // espaço entre a faixa de eras e o primeiro rótulo
const ALTURA_H = 680 // altura da linha do tempo horizontal (quatro linhas de cartões de cada lado e espaço para a ficha rápida)
const ALTURA_V = 560 // altura da linha do tempo vertical (celular)
const RODAPE_V = 0
const ROTULO_H = 54 // altura de um rótulo na horizontal
const PASSO_H = 60 // distância entre linhas de rótulos na horizontal
const ROTULO_L = 158 // largura de um rótulo na horizontal
const ROTULO_V = 82 // altura de um rótulo na vertical (ao longo do eixo)
const CARACTERE = 6.8 // largura média de um caractere de 11–12 px, para decidir se o nome da era cabe

interface Props {
  eventos: Acontecimento[]
  eras: Era[]
  vista: Vista
  selecionado: string | null
  onVista: (v: Vista) => void
  onSelecionar: (id: string) => void
  mostrarMundo: boolean
  mostrarBrasil: boolean
  /** leva ao card completo do acontecimento (aparece como botão na ficha rápida) */
  onDetalhes?: (id: string) => void
}

/** Resumo do tempo todo, com a janela atual em destaque; clicar ou arrastar leva a janela para aquele ponto. */
function Minimapa({ eras, vista, onVista, mostrarMundo, mostrarBrasil }: Pick<Props, 'eras' | 'vista' | 'onVista' | 'mostrarMundo' | 'mostrarBrasil'>) {
  // escala comprimida: o trecho vazio da Antiguidade ocupa pouco espaço
  const u0 = paraU(ANO_MIN)
  const total = paraU(ANO_MAX) - u0
  const frac = (a: number) => (paraU(Math.min(ANO_MAX, Math.max(ANO_MIN, a))) - u0) / total
  const pct = (a: number) => `${frac(a) * 100}%`
  const ir = (ev: PointerReact<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width))
    onVista(limitarVista({ c: deU(u0 + x * total), s: vista.s }))
  }
  const faixa = (regiao: 'mundo' | 'brasil') =>
    eras
      .filter((e) => e.regiao === regiao)
      .map((e) => <div key={e.id} className="absolute inset-y-0" style={{ left: pct(e.inicio), width: `${(frac(e.fim) - frac(e.inicio)) * 100}%`, background: e.cor, opacity: 0.55 }} />)
  return (
    <div className="grid gap-1" aria-hidden="true">
      <div
        className="relative h-9 cursor-pointer touch-none overflow-hidden rounded-md border border-[var(--line-strong)] bg-[var(--surface-2)]"
        onPointerDown={(ev) => {
          ev.currentTarget.setPointerCapture?.(ev.pointerId)
          ir(ev)
        }}
        onPointerMove={(ev) => ev.buttons === 1 && ir(ev)}
      >
        {mostrarMundo && <div className="absolute inset-x-0 top-0 h-[42%]">{faixa('mundo')}</div>}
        {mostrarBrasil && <div className="absolute inset-x-0 bottom-0 h-[42%]">{faixa('brasil')}</div>}
        <div aria-hidden="true" className="absolute inset-y-0 w-0 border-l border-dashed border-[var(--ink-muted)]" style={{ left: pct(FIM_COMPRIMIDO) }} />
        <div className="absolute inset-y-0 rounded-sm border-2 border-[var(--ink)] bg-[var(--ink)]/10" style={{ left: pct(vista.c - vista.s / 2), width: `${Math.max(0.8, (frac(vista.c + vista.s / 2) - frac(vista.c - vista.s / 2)) * 100)}%` }} />
      </div>
      <div className="num flex justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
        <span>{formatarAno(ANO_MIN)}</span>
        <span className="text-center">Todo o período: clique ou arraste a moldura. Antes de 600 a.C. (tracejado) o tempo está comprimido</span>
        <span>hoje</span>
      </div>
    </div>
  )
}

/**
 * Linha do tempo com arraste (mouse, dedo ou roda do mouse) e zoom (Ctrl + roda, pinça e teclas).
 * Horizontal quando há espaço; vertical no celular. Mundo de um lado do eixo e Brasil do outro;
 * os acontecimentos mais importantes aparecem primeiro e os demais, ao aproximar.
 * Clicar num acontecimento abre a ficha rápida (o essencial) ao lado dele.
 */
export function LinhaDoTempo({ eventos, eras, vista, selecionado, onVista, onSelecionar, mostrarMundo, mostrarBrasil, onDetalhes }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(900)
  /** acontecimento cuja ficha rápida está aberta (só por clique na linha) */
  const [aberta, setAberta] = useState<string | null>(null)
  const vertical = largura < 640
  const altura = vertical ? ALTURA_V : ALTURA_H

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const medir = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setLargura(w)
    }
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [vertical])

  const L = vertical ? altura - RODAPE_V : largura // comprimento do eixo
  const cruz = vertical ? largura : altura // largura transversal
  const eixo = cruz / 2
  const bordaMundo = eixo - GAP - FAIXA
  const bordaBrasil = eixo + GAP + FAIXA

  // linhas de rótulos de cada lado
  const espaco = eixo - GAP - FAIXA - MARGEM
  const linhas = vertical ? 1 : Math.max(1, Math.floor((espaco + 6) / PASSO_H))
  const tamanho = vertical ? ROTULO_V : ROTULO_L
  const larguraRotulo = vertical ? Math.max(96, Math.floor(espaco) - 4) : ROTULO_L

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
  const arrastou = useRef(false)
  useEffect(() => {
    vistaRef.current = vista
    onVistaRef.current = onVista
    dimRef.current = { vertical, L }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // roda do mouse ou trackpad: anda no tempo; com Ctrl (ou a pinça do trackpad, que chega como Ctrl + roda), aproxima e afasta
    const roda = (ev: WheelEvent) => {
      if ((ev.target as HTMLElement).closest?.('[data-ficha]')) return
      const { vertical: vert, L: comp } = dimRef.current
      const escala = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? comp : 1
      const atual = vistaRef.current
      let nova: Vista
      if (ev.ctrlKey || ev.metaKey) {
        const r = el.getBoundingClientRect()
        const medida = vert ? r.height : r.width
        const ancora = medida > 0 ? (vert ? ev.clientY - r.top : ev.clientX - r.left) / medida : 0.5
        const fator = Math.min(1.5, Math.max(0.66, Math.exp(ev.deltaY * escala * 0.0015)))
        nova = zoomEm(atual, Math.min(1, Math.max(0, ancora)), fator)
      } else {
        const delta = (vert || Math.abs(ev.deltaY) >= Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX) * escala
        nova = deslocarPorPixels(atual, delta, comp)
        // já na ponta da linha: deixa a página rolar normalmente
        if (nova.c === atual.c) return
      }
      ev.preventDefault()
      vistaRef.current = nova // vários eventos podem chegar antes do próximo desenho
      onVistaRef.current(nova)
    }
    el.addEventListener('wheel', roda, { passive: false })
    return () => el.removeEventListener('wheel', roda)
  }, [])

  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const gesto = useRef<{ tipo: 'pan' | 'pinch'; vista0: Vista; ini: number; distancia0: number; ancora: number; moveu: boolean } | null>(null)
  const coord = (p: { x: number; y: number }) => (vertical ? p.y : p.x)

  const aoPressionar = (ev: PointerReact<HTMLDivElement>) => {
    arrastou.current = false
    // a ficha rápida é texto: dentro dela não se arrasta a linha
    if ((ev.target as HTMLElement).closest('[data-ficha]')) return
    if (ev.pointerType === 'mouse' && ev.button !== 0) return
    ponteiros.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    const pts = [...ponteiros.current.values()]
    const r = ev.currentTarget.getBoundingClientRect()
    if (pts.length === 1) gesto.current = { tipo: 'pan', vista0: vista, ini: coord(pts[0] as { x: number; y: number }), distancia0: 0, ancora: 0, moveu: false }
    else if (pts.length === 2) {
      const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }]
      const meio = vertical ? (a.y + b.y) / 2 - r.top : (a.x + b.x) / 2 - r.left
      gesto.current = { tipo: 'pinch', vista0: vista, ini: 0, distancia0: Math.hypot(a.x - b.x, a.y - b.y), ancora: Math.min(1, Math.max(0, meio / (vertical ? r.height : r.width))), moveu: true }
      arrastou.current = true
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
        arrastou.current = true
        ev.currentTarget.setPointerCapture?.(ev.pointerId)
      }
      if (g.moveu) onVista(deslocarPorPixels(g.vista0, -delta, L))
    }
  }
  const aoSoltar = (ev: PointerReact<HTMLDivElement>) => {
    const g = gesto.current
    // toque simples no fundo (sem arrastar) fecha a ficha
    if (ev.type === 'pointerup' && g?.tipo === 'pan' && !g.moveu && !(ev.target as HTMLElement).closest('button, [data-ficha]')) setAberta(null)
    ponteiros.current.delete(ev.pointerId)
    if (ponteiros.current.size === 0) gesto.current = null
    else if (ponteiros.current.size === 1) {
      const p = [...ponteiros.current.values()][0] as { x: number; y: number }
      gesto.current = { tipo: 'pan', vista0: vistaRef.current, ini: coord(p), distancia0: 0, ancora: 0, moveu: true }
    }
  }

  const aoTeclar = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.target !== ev.currentTarget) return
    const passo = L * 0.12
    const avanca = vertical ? 'ArrowDown' : 'ArrowRight'
    const volta = vertical ? 'ArrowUp' : 'ArrowLeft'
    if (ev.key === '+' || ev.key === '=') onVista(zoomEm(vista, 0.5, 0.8))
    else if (ev.key === '-' || ev.key === '_') onVista(zoomEm(vista, 0.5, 1.25))
    else if (ev.key === avanca) onVista(deslocarPorPixels(vista, passo, L))
    else if (ev.key === volta) onVista(deslocarPorPixels(vista, -passo, L))
    else if (ev.key === 'Home') onVista(VISTA_TOTAL)
    else if (ev.key === 'Escape' && aberta) setAberta(null)
    else return
    ev.preventDefault()
  }

  /* ---------- desenho ---------- */
  const marcas = marcasDoEixo(vista)
  const p = (ano: number) => posicaoDoAno(ano, vista, L)
  const eixoStyle: CSSProperties = vertical ? { left: eixo - 1, top: 0, bottom: 0, width: 2 } : { top: eixo - 1, left: 0, right: 0, height: 2 }
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
      const afastamento = MARGEM + c.linha * PASSO_H
      let estilo: CSSProperties
      if (vertical) {
        estilo = mundo ? { top: c.inicio, right: largura - bordaMundo + MARGEM, width: larguraRotulo, height: ROTULO_V - 4 } : { top: c.inicio, left: bordaBrasil + MARGEM, width: larguraRotulo, height: ROTULO_V - 4 }
      } else {
        estilo = mundo ? { left: c.inicio, bottom: cruz - bordaMundo + afastamento, width: ROTULO_L, height: ROTULO_H } : { left: c.inicio, top: bordaBrasil + afastamento, width: ROTULO_L, height: ROTULO_H }
      }
      return (
        <div key={e.id}>
          {/* haste: passa por trás dos rótulos, para ligar o ano ao cartão */}
          {!vertical && <div aria-hidden="true" className="absolute w-px bg-[var(--line-strong)]" style={{ zIndex: 1, left: c.pos, ...(mundo ? { bottom: cruz - bordaMundo, height: afastamento } : { top: bordaBrasil, height: afastamento }) }} />}
          {vertical && <div aria-hidden="true" className="absolute h-px bg-[var(--line-strong)]" style={{ zIndex: 1, top: c.pos, ...(mundo ? { right: largura - bordaMundo, width: MARGEM } : { left: bordaBrasil, width: MARGEM }) }} />}
          <div aria-hidden="true" className="absolute size-3 rounded-full border-2 border-[var(--surface)]" style={{ zIndex: 3, background: COR_TIPO[e.tipo], ...(vertical ? { top: c.pos - 6, ...(mundo ? { left: bordaMundo - 6 } : { left: bordaBrasil - 6 }) } : { left: c.pos - 6, ...(mundo ? { top: bordaMundo - 6 } : { top: bordaBrasil - 6 }) }) }} />
          <button
            type="button"
            aria-pressed={sel}
            aria-label={`${e.titulo}, ${rotuloAno(e)}`}
            title={`${e.titulo} (${rotuloAno(e)})`}
            onClick={() => {
              // o clique que encerra um arraste não seleciona nada
              if (arrastou.current) return
              onSelecionar(e.id)
              setAberta(e.id)
            }}
            className="absolute flex items-start gap-1.5 overflow-hidden rounded-md border bg-[var(--surface)] px-1.5 py-1 text-left leading-tight shadow-sm transition-colors hover:bg-[var(--surface-2)]"
            style={{ ...estilo, zIndex: sel ? 6 : 4, borderColor: sel ? 'var(--accent)' : 'var(--line-strong)', borderLeftColor: era?.cor ?? 'var(--line-strong)', borderLeftWidth: 5, outline: sel ? '3px solid var(--accent)' : undefined }}
          >
            {!vertical && <Icone size={14} aria-hidden="true" style={{ color: COR_TIPO[e.tipo], flex: 'none', marginTop: 1 }} />}
            <span className="min-w-0">
              <span className="num flex items-center gap-1 text-xs font-bold">
                {vertical && <Icone size={13} aria-hidden="true" style={{ color: COR_TIPO[e.tipo], flex: 'none' }} />}
                {rotuloAno(e)}
              </span>
              <span className={`block text-xs ${vertical ? 'line-clamp-4' : 'line-clamp-2'}`}>{e.titulo}</span>
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
        const estilo: CSSProperties = vertical ? { top: t.a, height: larg, left: posCruz, width: FAIXA } : { left: t.a, width: larg, top: posCruz, height: FAIXA }
        // o nome inteiro, o curto ou nada, conforme o espaço
        const nome = larg >= era.nome.length * CARACTERE + 18 ? era.nome : larg >= era.curto.length * CARACTERE + 14 ? era.curto : ''
        return (
          <div
            key={era.id}
            title={`${era.nome} (${rotuloEra(era)}): ${era.resumo} Clique para ver o período.`}
            onClick={() => !arrastou.current && onVista(vistaParaIntervalo(era.inicio, era.fim))}
            className="absolute flex cursor-pointer items-center justify-center overflow-hidden text-xs font-semibold"
            style={{ ...estilo, zIndex: 2, background: fundoDaEra(era.cor), borderLeft: vertical ? undefined : `4px solid ${era.cor}`, borderTop: vertical ? `4px solid ${era.cor}` : undefined, writingMode: vertical ? 'vertical-rl' : undefined }}
          >
            {nome && <span className="whitespace-nowrap px-1">{nome}</span>}
          </div>
        )
      })
  }

  // duração do acontecimento selecionado, como uma barra grossa ao lado da faixa de eras
  const escolhido = selecionado ? porId.get(selecionado) : undefined
  const barra =
    escolhido && escolhido.fim !== undefined && (escolhido.regiao === 'mundo' ? mostrarMundo : mostrarBrasil)
      ? (() => {
          const t = trechoVisivel(escolhido.inicio, escolhido.fim, vista, L)
          if (!t) return null
          const mundo = escolhido.regiao === 'mundo'
          const estilo: CSSProperties = vertical ? { top: t.a, height: t.b - t.a, width: 7, ...(mundo ? { left: bordaMundo - 11 } : { left: bordaBrasil + 4 }) } : { left: t.a, width: t.b - t.a, height: 7, ...(mundo ? { top: bordaMundo - 11 } : { top: bordaBrasil + 4 }) }
          return <div aria-hidden="true" className="absolute rounded-full" style={{ ...estilo, zIndex: 3, background: COR_TIPO[escolhido.tipo], boxShadow: '0 0 0 2px var(--surface)' }} />
        })()
      : null

  // ficha rápida: do outro lado do eixo, para não cobrir o cartão clicado; no celular, por cima da linha (fecha no X ou com Esc)
  const fichaEv = aberta && aberta === selecionado ? porId.get(aberta) : undefined
  const fichaVisivel = fichaEv && (fichaEv.regiao === 'mundo' ? mostrarMundo : mostrarBrasil)
  let ficha: React.ReactNode = null
  if (fichaEv && fichaVisivel) {
    const fechar = () => {
      setAberta(null)
      ref.current?.focus({ preventScroll: true })
    }
    const detalhes = onDetalhes ? () => onDetalhes(fichaEv.id) : undefined
    if (vertical) {
      ficha = <FichaRapida ev={fichaEv} onFechar={fechar} onDetalhes={detalhes} estilo={{ left: 8, right: 8, bottom: 8, maxHeight: altura - 16 }} />
    } else {
      const W = Math.min(720, largura - 16)
      const pos = Math.min(L, Math.max(0, p(fichaEv.inicio)))
      const left = Math.min(largura - W - 8, Math.max(8, pos - W / 2))
      const mundo = fichaEv.regiao === 'mundo'
      const corEra = eras.find((x) => x.regiao === fichaEv.regiao && fichaEv.inicio >= x.inicio && fichaEv.inicio <= x.fim)?.cor ?? 'var(--line-strong)'
      const estilo: CSSProperties = mundo ? { left, width: W, top: eixo + 10, maxHeight: altura - eixo - 16 } : { left, width: W, bottom: cruz - eixo + 10, maxHeight: eixo - 16 }
      ficha = (
        <>
          {/* bico que aponta para o ano do acontecimento no eixo */}
          <div aria-hidden="true" className="absolute z-[21]" style={{ left: pos - 8, width: 16, height: 10, top: mundo ? eixo + 1 : eixo - 11, background: corEra, clipPath: mundo ? 'polygon(50% 0, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 50% 100%)' }} />
          <FichaRapida ev={fichaEv} onFechar={fechar} onDetalhes={detalhes} estilo={estilo} largo={W >= 520} />
        </>
      )
    }
  }

  const comprimentoGrade = vertical ? largura : altura
  const cruzaComprimido = vista.c - vista.s / 2 < FIM_COMPRIMIDO && vista.c + vista.s / 2 > FIM_COMPRIMIDO
  return (
    <div className="grid gap-2">
      <div
        ref={ref}
        role="group"
        tabIndex={0}
        aria-label="Linha do tempo. Use + e − para aproximar e afastar, as setas para mover e Home para ver tudo. Os acontecimentos são botões; ao escolher um, abre-se uma ficha rápida, que fecha com Esc."
        onKeyDown={aoTeclar}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        className="relative cursor-grab select-none overflow-hidden rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--surface)] active:cursor-grabbing focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        style={{ height: altura, touchAction: 'none' }}
      >
        {/* linhas de grade nos anos marcados */}
        {marcas.map((a) => (
          <div key={`g${a}`} aria-hidden="true" className="absolute" style={{ background: 'var(--line)', opacity: a % 100 === 0 ? 1 : 0.55, ...(vertical ? { top: p(a), left: 0, width: comprimentoGrade, height: 1 } : { left: p(a), top: 0, height: comprimentoGrade, width: 1 }) }} />
        ))}
        <div aria-hidden="true" className="absolute bg-[var(--line-strong)]" style={{ ...eixoStyle, zIndex: 1 }} />
        {/* anos do eixo; o zero fica sem rótulo, porque não existe ano zero (de 1 a.C. passa-se a 1 d.C.) */}
        {marcas
          .filter((a) => a !== 0)
          .map((a) =>
            vertical ? (
              <div key={a} aria-hidden="true" className="num absolute z-[2] grid text-center text-xs font-semibold leading-none text-[var(--ink-muted)]" style={{ top: p(a) - (a < 0 ? 12 : 7), left: eixo - GAP, width: GAP * 2, background: 'var(--surface)' }}>
                <span>{Math.abs(a)}</span>
                {a < 0 && <span className="text-[10px]">a.C.</span>}
              </div>
            ) : (
              <div key={a} aria-hidden="true" className="num absolute z-[2] whitespace-nowrap text-center text-xs font-semibold text-[var(--ink-muted)]" style={{ left: p(a) - 34, width: 68, top: eixo - 9, background: 'var(--surface)', borderRadius: 4 }}>
                {formatarAno(a)}
              </div>
            ),
          )}
        {mostrarMundo && faixasDeEras('mundo')}
        {mostrarBrasil && faixasDeEras('brasil')}
        {barra}
        {mostrarMundo && rotulosDe('mundo')}
        {mostrarBrasil && rotulosDe('brasil')}
        {cruzaComprimido && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute border-dashed border-[var(--ink-muted)]" style={{ zIndex: 1, ...(vertical ? { top: p(FIM_COMPRIMIDO), left: 0, width: comprimentoGrade, borderTopWidth: 1 } : { left: p(FIM_COMPRIMIDO), top: 0, height: comprimentoGrade, borderLeftWidth: 1 }) }} />
            {!vertical && p(FIM_COMPRIMIDO) > 100 && (
              <span aria-hidden="true" className="pointer-events-none absolute z-[8] whitespace-nowrap rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-muted)]" style={{ right: L - p(FIM_COMPRIMIDO) + 6, top: 8 }}>
                comprimido ◂
              </span>
            )}
          </>
        )}
        {ficha}
        {mostrarMundo && (
          <span aria-hidden="true" className="pointer-events-none absolute z-[8] rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-0.5 text-xs font-bold" style={{ left: 8, top: 8 }}>
            {vertical ? 'Mundo' : '↑ Mundo'}
          </span>
        )}
        {mostrarBrasil && (
          <span aria-hidden="true" className="pointer-events-none absolute z-[8] rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-2 py-0.5 text-xs font-bold" style={vertical ? { right: 8, top: 8 } : { left: 8, bottom: 8 }}>
            {vertical ? 'Brasil' : '↓ Brasil'}
          </span>
        )}
      </div>
      <Minimapa eras={eras} vista={vista} onVista={onVista} mostrarMundo={mostrarMundo} mostrarBrasil={mostrarBrasil} />
      {vertical ? (
        <p className="m-0 text-sm">
          <strong>Para andar no tempo:</strong> arraste a linha para cima ou para baixo. <strong>Para aproximar ou afastar:</strong> pinça com dois dedos ou os botões. <strong>Toque num acontecimento</strong> para abrir a ficha rápida.
        </p>
      ) : (
        <p className="m-0 text-sm">
          <strong>Para andar no tempo:</strong> arraste a linha (pode começar em cima de um cartão), role a roda do mouse ou use as setas.{' '}
          <strong>Para aproximar ou afastar:</strong> Ctrl + roda, pinça com dois dedos ou os botões. <strong>Clique num acontecimento</strong> para abrir a ficha rápida.
        </p>
      )}
      <p className="m-0 text-sm text-[var(--ink-muted)]" aria-live="polite">
        Mostrando de {formatarAno(Math.round(vista.c - vista.s / 2))} a {formatarAno(Math.round(vista.c + vista.s / 2))}
        {cruzaComprimido ? '. Antes de 600 a.C. a escala está comprimida (poucos acontecimentos): ali, o mesmo espaço mostra mais anos.' : ''}
        {ocultos > 0 ? `. ${ocultos} acontecimento${ocultos === 1 ? '' : 's'} não cabe${ocultos === 1 ? '' : 'm'} neste zoom: aproxime ou escolha um período para ver.` : '. Todos os acontecimentos desta janela estão visíveis.'}
      </p>
    </div>
  )
}
