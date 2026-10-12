import { useLayoutEffect, useRef, useState } from 'react'

/** Largura (px) que um elemento tem na tela; vale `inicial` até a primeira medida (e nos testes, sem layout). */
export function useLargura<T extends Element>(inicial = 640) {
  const ref = useRef<T>(null)
  const [largura, setLargura] = useState(inicial)
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
  }, [])
  return [ref, largura] as const
}

/**
 * Tamanho de fonte (em unidades do desenho) que fica com pelo menos `minPx` na tela.
 * Um SVG com viewBox largo, mostrado em tela estreita, encolhe o texto junto com o desenho.
 */
export function fonteLegivel(base: number, larguraPx: number, larguraDesenho = 640, minPx = 11): number {
  return Math.max(base, (minPx * larguraDesenho) / Math.max(larguraPx, 1))
}
