import { useEffect, useRef } from 'react'
import { useLaco } from './laco'

/**
 * Liga um instante t (guardado em estado ou na URL) ao laço de passo fixo e para no instante final T.
 * `fator` converte segundos reais em segundos simulados (útil quando a simulação é longa demais para assistir).
 */
export function useAnimacao(t: number, T: number, setT: (t: number) => void, fator = 1) {
  const tRef = useRef(t)
  const TRef = useRef(T)
  const fatorRef = useRef(fator)
  const setRef = useRef(setT)
  const pararRef = useRef<(v: boolean) => void>(() => {})
  const laco = useLaco(1 / 60, (dt) => {
    tRef.current = Math.min(TRef.current, tRef.current + dt * fatorRef.current)
    setRef.current(Math.round(tRef.current * 100) / 100)
    if (tRef.current >= TRef.current) pararRef.current(false)
  })
  useEffect(() => {
    setRef.current = setT
    pararRef.current = laco.setRodando
    tRef.current = t
    TRef.current = T
    fatorRef.current = fator
  })
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = laco
  const alternar = () => {
    if (!rodando && t >= T) {
      tRef.current = 0
      setT(0)
    }
    setRodando(!rodando)
  }
  const passo = (dt: number) => {
    tRef.current = Math.min(T, tRef.current + dt)
    setT(Math.round(tRef.current * 100) / 100)
    passoUnico()
  }
  return { rodando, setRodando, velocidade, setVelocidade, alternar, passo }
}
