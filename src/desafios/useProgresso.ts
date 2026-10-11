import { useEffect, useState } from 'react'
import { lerProgresso, type Progresso } from './progresso'

/** Progresso salvo, atualizado sempre que um desafio é respondido. */
export function useProgresso(): Progresso {
  const [p, setP] = useState<Progresso>(lerProgresso)
  useEffect(() => {
    const f = () => setP(lerProgresso())
    window.addEventListener('lv:progresso', f)
    window.addEventListener('storage', f)
    return () => {
      window.removeEventListener('lv:progresso', f)
      window.removeEventListener('storage', f)
    }
  }, [])
  return p
}
