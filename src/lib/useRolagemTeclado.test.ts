import { ajustarRolagemTeclado, nomearPontosMoveis } from './useRolagemTeclado'

/** O jsdom não faz layout: informamos a largura do conteúdo e da caixa à mão. */
function regiao(scroll: number, caixa: number, atributos: Record<string, string> = {}) {
  const el = document.createElement('div')
  el.className = 'cartao overflow-x-auto'
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v)
  Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => scroll })
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => caixa })
  document.body.append(el)
  return el
}

describe('Rolagem horizontal pelo teclado', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('região que transborda vira focável, com papel e nome', () => {
    const el = regiao(900, 300)
    ajustarRolagemTeclado()
    expect(el.tabIndex).toBe(0)
    expect(el.getAttribute('role')).toBe('group')
    expect(el.getAttribute('aria-label')).toContain('rola na horizontal')
  })
  it('região que cabe na caixa não ganha nada', () => {
    const el = regiao(300, 300)
    ajustarRolagemTeclado()
    expect(el.hasAttribute('tabindex')).toBe(false)
    expect(el.hasAttribute('role')).toBe(false)
  })
  it('ao deixar de transbordar, os atributos que ela colocou saem', () => {
    const el = regiao(900, 300)
    ajustarRolagemTeclado()
    Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => 300 })
    ajustarRolagemTeclado()
    expect(el.hasAttribute('tabindex')).toBe(false)
    expect(el.hasAttribute('role')).toBe(false)
    expect(el.hasAttribute('aria-label')).toBe(false)
  })
  it('respeita o que o componente já definiu (nome próprio, tabindex próprio)', () => {
    const nomeado = regiao(900, 300, { 'aria-label': 'Tabela de preços', role: 'region' })
    const proprio = regiao(900, 300, { tabindex: '-1' })
    ajustarRolagemTeclado()
    expect(nomeado.getAttribute('aria-label')).toBe('Tabela de preços')
    expect(nomeado.getAttribute('role')).toBe('region')
    expect(proprio.getAttribute('tabindex')).toBe('-1')
    // e, ao deixar de transbordar, não apaga o que não era dela
    Object.defineProperty(nomeado, 'scrollWidth', { configurable: true, get: () => 300 })
    ajustarRolagemTeclado()
    expect(nomeado.getAttribute('aria-label')).toBe('Tabela de preços')
  })
})

describe('Pontos móveis dos gráficos', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const grafico = (qtd: number, extra = '') => {
    const div = document.createElement('div')
    div.className = 'MafsView'
    div.innerHTML = Array.from({ length: qtd }, () => `<svg><g class="mafs-movable-point" tabindex="0" ${extra}></g></svg>`).join('')
    document.body.append(div)
    return [...div.querySelectorAll('.mafs-movable-point')]
  }

  it('um ponto só: nome simples; vários: numerados por gráfico', () => {
    const [unico] = grafico(1)
    const dois = grafico(2)
    nomearPontosMoveis()
    expect(unico?.getAttribute('aria-label')).toBe('Ponto móvel; use as setas do teclado para mover')
    expect(dois.map((p) => p.getAttribute('aria-label'))).toEqual([
      'Ponto móvel 1 de 2; use as setas do teclado para mover',
      'Ponto móvel 2 de 2; use as setas do teclado para mover',
    ])
    expect(unico?.getAttribute('role')).toBe('group')
  })
  it('não troca um nome que o componente já definiu e nomeia os pontos que aparecem depois', () => {
    const [proprio] = grafico(1, 'aria-label="Vértice da parábola"')
    nomearPontosMoveis()
    expect(proprio?.getAttribute('aria-label')).toBe('Vértice da parábola')
    const [a] = grafico(1)
    nomearPontosMoveis()
    expect(a?.getAttribute('aria-label')).toContain('Ponto móvel;')
  })
})
