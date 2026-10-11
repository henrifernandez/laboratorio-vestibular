import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

interface Contexto<T> {
  estado: T
  /** mexer em qualquer representação (gráfico, equação, tabela) chama isto */
  atualizar: (parcial: Partial<T> | ((atual: T) => Partial<T>)) => void
  reiniciar: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Ctx = createContext<Contexto<any> | null>(null)

/**
 * Um único estado compartilhado: gráfico, equação e tabela leem e escrevem aqui,
 * então mexer em um atualiza todos ao mesmo tempo.
 */
export function RepresentacoesProvider<T extends object>({
  inicial,
  padrao,
  onMudar,
  children,
}: {
  inicial: T
  /** estado para onde o botão Reiniciar volta (por padrão, o próprio inicial) */
  padrao?: T
  /** avisado depois de cada mudança (não na montagem), por exemplo para gravar na URL */
  onMudar?: (e: T) => void
  children: ReactNode
}) {
  const [estado, setEstado] = useState<T>(inicial)
  const ultimo = useRef<T>(inicial)
  const onMudarRef = useRef(onMudar)
  useEffect(() => {
    onMudarRef.current = onMudar
  })

  useEffect(() => {
    if (estado === ultimo.current) return // montagem (ou efeito repetido): nada mudou
    ultimo.current = estado
    onMudarRef.current?.(estado)
  }, [estado])

  const atualizar = useCallback(
    (p: Partial<T> | ((atual: T) => Partial<T>)) => setEstado((atual) => ({ ...atual, ...(typeof p === 'function' ? p(atual) : p) })),
    [],
  )
  const reiniciar = useCallback(() => setEstado(padrao ?? inicial), [inicial, padrao])
  const valor = useMemo(() => ({ estado, atualizar, reiniciar }), [estado, atualizar, reiniciar])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useRepresentacoes<T extends object>(): Contexto<T> {
  const c = useContext(Ctx)
  if (!c) throw new Error('useRepresentacoes precisa estar dentro de <RepresentacoesProvider>')
  return c as Contexto<T>
}
