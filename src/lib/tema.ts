import { useCallback, useEffect, useState } from 'react'
import { lerTexto, gravarTexto } from './storage'

export type Tema = 'claro' | 'escuro'

const sistemaEscuro = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

function inicial(): Tema {
  const salvo = lerTexto('tema')
  if (salvo === 'claro' || salvo === 'escuro') return salvo
  return sistemaEscuro() ? 'escuro' : 'claro'
}

/** Tema efetivo: segue o sistema até a pessoa escolher; depois a escolha fica salva. */
export function useTema() {
  const [tema, setTema] = useState<Tema>(inicial)

  useEffect(() => {
    document.documentElement.dataset.theme = tema === 'claro' ? 'light' : 'dark'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'claro' ? '#fbf7f0' : '#17140f')
  }, [tema])

  const alternar = useCallback(() => {
    setTema((t) => {
      const novo = t === 'claro' ? 'escuro' : 'claro'
      gravarTexto('tema', novo)
      return novo
    })
  }, [])

  return { tema, alternar }
}
