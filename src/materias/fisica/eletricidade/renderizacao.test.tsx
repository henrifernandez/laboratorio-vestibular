import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Circuito, CircuitoSimples, pontoNoContorno } from './Circuitos'
import { DEFINICOES_ELETRICIDADE } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'

// o Mafs mede o próprio tamanho com ResizeObserver, que o jsdom não tem
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverFalso)
})
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('Desenho dos circuitos', () => {
  it('paralelo com três lâmpadas: bateria, quatro nós de junção, nomes e valores', () => {
    const { container } = render(<Circuito topologia="paralelo" rs={[20, 30, 60]} V={12} modo="lampada" estados={[{ brilho: 1, texto: '7,2 W' }, undefined, undefined]} abertas={[1]} rotulo="teste" />)
    expect(container.textContent).toContain('12 V')
    expect(container.textContent).toContain('L3')
    expect(container.textContent).toContain('60 Ω')
    expect(container.textContent).toContain('7,2 W')
    expect(container.querySelectorAll('circle[r="4"]')).toHaveLength(4)
  })
  it('resistor perguntado ganha o selo de interrogação; em série não há nós', () => {
    const { container } = render(<Circuito topologia="serie" rs={[10, 20, 30, 40]} V={24} modo="resistor" alvo={2} rotulo="teste" />)
    expect(container.querySelectorAll('circle[r="4"]')).toHaveLength(0)
    expect(container.textContent).toContain('?')
    expect(container.textContent).toContain('R4')
  })
  it('circuito simples: corrente na etiqueta e elétrons fora dos símbolos', () => {
    const { container } = render(<CircuitoSimples V={12} R={20} fase={0.3} brilho={0.5} />)
    expect(container.textContent).toContain('i = 0,6 A')
    const eletrons = container.querySelectorAll('circle[r="5.2"]')
    expect(eletrons.length).toBeGreaterThan(10)
    expect(eletrons.length).toBeLessThanOrEqual(16)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('do polo negativo para o positivo')
  })
  it('o contorno do circuito fecha: o ponto em 0 e em 1 é o mesmo canto', () => {
    expect(pontoNoContorno(0)).toEqual(pontoNoContorno(1))
    expect(pontoNoContorno(-0.25)).toEqual(pontoNoContorno(0.75))
  })
})

describe('Telas', () => {
  it('Entenda e as três telas do laboratório renderizam', () => {
    const e = render(
      <MemoryRouter>
        <Entenda />
      </MemoryRouter>,
    )
    expect(e.container.textContent).toContain('sentido convencional')
    e.unmount()
    for (const tela of ['intro', 'explorar', 'lab']) {
      const l = render(
        <MemoryRouter initialEntries={[`/?tela=${tela}`]}>
          <Laboratorio />
        </MemoryRouter>,
      )
      expect(l.container.querySelector('svg[role="img"]'), tela).not.toBeNull()
      l.unmount()
    }
  })
  it('os desafios renderizam com o novo desenho', () => {
    for (const def of DEFINICOES_ELETRICIDADE)
      for (const nivel of [1, 2, 3] as const)
        for (let s = 1; s <= 6; s++) {
          const inst = def.desafio.gerar(s, nivel)
          const { container, unmount } = render(<def.Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length).toBeGreaterThan(20)
          unmount()
        }
  })
})
