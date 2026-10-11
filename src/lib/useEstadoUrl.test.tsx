import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEstadoUrl } from './useEstadoUrl'

const padrao = { capital: 1000, taxa: 5, tempo: 12, mostrar: true, nome: 'x' }
const wrap = (url: string) => ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>

describe('useEstadoUrl', () => {
  it('sem parâmetros usa o padrão', () => {
    const { result } = renderHook(() => useEstadoUrl(padrao), { wrapper: wrap('/') })
    expect(result.current[0]).toEqual(padrao)
  })

  it('lê números, booleanos e textos da URL, ignorando lixo', () => {
    const { result } = renderHook(() => useEstadoUrl(padrao), { wrapper: wrap('/?capital=2500&taxa=abc&mostrar=0&nome=oi&outra=1') })
    expect(result.current[0]).toEqual({ capital: 2500, taxa: 5, tempo: 12, mostrar: false, nome: 'oi' })
  })

  it('atualizar muda o estado e a URL; reiniciar volta ao padrão', () => {
    const { result } = renderHook(() => useEstadoUrl(padrao), { wrapper: wrap('/') })
    act(() => result.current[1]({ taxa: 7.5, mostrar: false }))
    expect(result.current[0].taxa).toBe(7.5)
    expect(result.current[0].mostrar).toBe(false)
    act(() => result.current[2]())
    expect(result.current[0]).toEqual(padrao)
  })

  it('cada chave só entra na URL quando difere do padrão', () => {
    const { result } = renderHook(() => useEstadoUrl(padrao), { wrapper: wrap('/') })
    act(() => result.current[1]({ taxa: 5 }))
    expect(result.current[0].taxa).toBe(5)
  })
})
