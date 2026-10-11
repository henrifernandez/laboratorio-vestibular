import { useCallback, useEffect, useRef, useState } from 'react'

export interface OpcoesLaco {
  /** duração de cada passo da simulação, em segundos */
  passo: number
  /** teto de passos por chamada, para não travar depois de uma aba em segundo plano */
  maxPassos?: number
}

/**
 * Laço de passo fixo: o tempo real que chega é acumulado e consumido em passos de tamanho igual.
 * Assim a física dá o mesmo resultado em qualquer taxa de quadros e pode ser testada sem relógio.
 */
export function criarLaco({ passo, maxPassos = 240 }: OpcoesLaco, atualizar: (dt: number) => void) {
  let acumulado = 0
  return {
    /** devolve quantos passos foram executados */
    avancar(dtReal: number, velocidade = 1): number {
      acumulado += dtReal * velocidade
      let n = 0
      while (acumulado >= passo - 1e-12 && n < maxPassos) {
        atualizar(passo)
        acumulado -= passo
        n++
      }
      if (n === maxPassos) acumulado = 0
      return n
    },
    passoUnico() {
      atualizar(passo)
    },
    zerar() {
      acumulado = 0
    },
  }
}

export const VELOCIDADES = [0.25, 0.5, 1, 2] as const
export type Velocidade = (typeof VELOCIDADES)[number]

/** Liga um laço de passo fixo ao requestAnimationFrame, com play, pausa, passo a passo e câmera lenta. */
export function useLaco(passo: number, atualizar: (dt: number) => void) {
  const [rodando, setRodando] = useState(false)
  const [velocidade, setVelocidade] = useState<Velocidade>(1)
  const atualizarRef = useRef(atualizar)
  const velRef = useRef(velocidade)
  useEffect(() => {
    atualizarRef.current = atualizar
    velRef.current = velocidade
  })
  // o callback só lê a ref quando o laço roda (fora da renderização)
  // eslint-disable-next-line react-hooks/refs
  const [laco] = useState(() => criarLaco({ passo }, (dt) => atualizarRef.current(dt)))

  useEffect(() => {
    if (!rodando) return
    let id = 0
    let ultimo = performance.now()
    const quadro = (agora: number) => {
      laco.avancar(Math.min((agora - ultimo) / 1000, 0.25), velRef.current)
      ultimo = agora
      id = requestAnimationFrame(quadro)
    }
    id = requestAnimationFrame(quadro)
    return () => cancelAnimationFrame(id)
  }, [rodando, laco])

  const passoUnico = useCallback(() => {
    setRodando(false)
    laco.passoUnico()
  }, [laco])
  const zerar = useCallback(() => laco.zerar(), [laco])

  return { rodando, setRodando, velocidade, setVelocidade, passoUnico, zerar }
}
