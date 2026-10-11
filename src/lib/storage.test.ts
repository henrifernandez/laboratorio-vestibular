import { lerJson, gravarJson } from './storage'

describe('storage seguro', () => {
  beforeEach(() => localStorage.clear())

  it('grava e lê com chave versionada', () => {
    gravarJson('teste', { a: 1 })
    expect(lerJson('teste', { a: 0 })).toEqual({ a: 1 })
    expect(localStorage.getItem('lv:v1:teste')).not.toBeNull()
  })

  it('devolve o padrão quando não existe', () => {
    expect(lerJson('vazio', 5)).toBe(5)
  })

  it('devolve o padrão quando o JSON está corrompido', () => {
    localStorage.setItem('lv:v1:ruim', '{nao-json')
    expect(lerJson('ruim', 'padrao')).toBe('padrao')
  })

  it('não quebra quando o armazenamento está bloqueado', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    const spy2 = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(lerJson('x', 'ok')).toBe('ok')
    expect(() => gravarJson('x', 1)).not.toThrow()
    spy.mockRestore()
    spy2.mockRestore()
  })
})
