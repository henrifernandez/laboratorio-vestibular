import { useEffect, useRef, useState } from 'react'
import type { Funcao } from './modelo'

const suave = (t: number) => 1 - Math.pow(1 - t, 3)

function mistura(de: Funcao, para: Funcao, t: number): Funcao {
  if (de.tipo !== para.tipo) return para
  const l = (a: number, b: number) => a + (b - a) * t
  switch (para.tipo) {
    case 'afim': {
      const d = de as typeof para
      return { tipo: 'afim', a: l(d.a, para.a), b: l(d.b, para.b) }
    }
    case 'quadratica': {
      const d = de as typeof para
      return { tipo: 'quadratica', a: l(d.a, para.a), b: l(d.b, para.b), c: l(d.c, para.c) }
    }
    case 'exponencial': {
      const d = de as typeof para
      return { tipo: 'exponencial', a: l(d.a, para.a), base: l(d.base, para.base), k: l(d.k, para.k) }
    }
    case 'logaritmica': {
      const d = de as typeof para
      return { tipo: 'logaritmica', a: l(d.a, para.a), base: l(d.base, para.base), k: l(d.k, para.k) }
    }
  }
}

/** Anima os coeficientes até a nova função (a parábola "vira" em vez de pular). Sem animação se o sistema pede menos movimento. */
export function useFuncaoAnimada(alvo: Funcao, ms = 650): Funcao {
  const [atual, setAtual] = useState<Funcao>(alvo)
  const origem = useRef<Funcao>(alvo)
  const ultima = useRef<Funcao>(alvo)
  const [reduzir] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (reduzir) return
    origem.current = ultima.current
    const inicio = performance.now()
    let id = 0
    const quadro = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / ms)
      const f = mistura(origem.current, alvo, suave(t))
      ultima.current = f
      setAtual(f)
      if (t < 1) id = requestAnimationFrame(quadro)
    }
    id = requestAnimationFrame(quadro)
    return () => cancelAnimationFrame(id)
  }, [alvo, ms, reduzir])

  return reduzir ? alvo : atual
}
