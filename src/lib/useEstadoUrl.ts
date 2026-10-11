import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

type Valor = number | string | boolean

function ler<T extends Record<string, Valor>>(padrao: T, busca: URLSearchParams): T {
  const e = { ...padrao } as Record<string, Valor>
  for (const [k, d] of Object.entries(padrao)) {
    const bruto = busca.get(k)
    if (bruto === null) continue
    if (typeof d === 'number') {
      const n = Number(bruto)
      if (bruto.trim() !== '' && Number.isFinite(n)) e[k] = n
    } else if (typeof d === 'boolean') {
      if (bruto === '1' || bruto === '0') e[k] = bruto === '1'
    } else e[k] = bruto
  }
  return e as T
}

/**
 * Estado da simulação guardado na URL, para salvar ou mandar uma configuração específica.
 * Só as chaves diferentes do padrão aparecem no endereço.
 */
export function useEstadoUrl<T extends Record<string, Valor>>(padrao: T) {
  const [busca, setBusca] = useSearchParams()
  const estado = useMemo(() => ler(padrao, busca), [padrao, busca])

  const atualizar = useCallback(
    (parcial: Partial<T>) => {
      setBusca(
        (anterior) => {
          const n = new URLSearchParams(anterior)
          for (const [k, v] of Object.entries(parcial) as [string, Valor][]) {
            if (v === (padrao as Record<string, Valor>)[k]) n.delete(k)
            else n.set(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
          }
          return n
        },
        { replace: true },
      )
    },
    [padrao, setBusca],
  )

  const reiniciar = useCallback(() => {
    setBusca(
      (anterior) => {
        const n = new URLSearchParams(anterior)
        for (const k of Object.keys(padrao)) n.delete(k)
        return n
      },
      { replace: true },
    )
  }, [padrao, setBusca])

  return [estado, atualizar, reiniciar] as const
}
