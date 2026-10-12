import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PASSOS_DIN } from '@/conteudo/fisica/dinamica'
import { DEFINICOES_DINAMICA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import { montar } from '@/materias/biologia/comum/auxiliares'
import { PARES, type DadosLeis } from './geradoresNewton'
import { CenaPatinadores, OnibusInercia, ParesLivroMesa, VisualLeis } from './VisuaisNewton'

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

describe('Leis de Newton: desenhos', () => {
  it('patinadores: setas do par enquanto empurram; depois, aviso de que não há força', () => {
    const durante = render(<CenaPatinadores mA={50} mB={80} F={200} dt={0.5} t={0.3} />)
    expect(durante.container.textContent).toContain('B empurra A')
    expect(durante.container.textContent).toContain('A empurra B')
    durante.unmount()
    const depois = render(<CenaPatinadores mA={50} mB={80} F={200} dt={0.5} t={2} />)
    expect(depois.container.textContent).toContain('nenhuma força horizontal')
    // v_A = 200·0,5/50 = 2 m/s ; v_B = 1,25 → "1,3" com uma casa
    expect(depois.container.textContent).toContain('v = 2,0 m/s')
    depois.unmount()
  })
  it('ônibus: trocar para “Arranca” reinicia e muda a explicação', () => {
    const { container } = render(<OnibusInercia />)
    expect(container.textContent).toContain('continua a 8,0 m/s')
    fireEvent.click(screen.getByLabelText('Arranca'))
    expect(container.textContent).toContain('continua a 0,0 m/s')
  })
  it('pares: cada destaque troca o texto e mantém as quatro forças no desenho', () => {
    const { container } = render(<ParesLivroMesa />)
    for (const [rotulo, trecho] of [
      ['Par do peso', 'o livro puxa a Terra'],
      ['Par da normal', 'o livro empurra a mesa'],
      ['Todas', 'dois pares'],
      ['Forças no livro', 'mesmo corpo'],
    ]) {
      fireEvent.click(screen.getByLabelText(rotulo as string))
      expect(container.textContent).toContain(trecho)
    }
    for (const nome of ['P', 'N', 'N′', 'P′']) expect([...container.querySelectorAll('text')].some((t) => t.textContent === nome)).toBe(true)
  })
})

describe('Desafio “qual é o par?”: desenho', () => {
  it('em todos os itens, as setas de ação e reação cabem no quadro e não atravessam os corpos', () => {
    for (const item of PARES) {
      const inst = montar<DadosLeis>(() => 0.3, item.certa, item.erradas, {
        enunciado: item.pergunta,
        resolucao: 'x',
        dicas: item.dicas,
        licao: item.licao,
        dados: { tipo: 'par', agente: item.agente, alvo: item.alvo, sentido: item.sentido, layout: item.layout },
      })
      const { container, unmount } = render(<VisualLeis inst={inst} correcao={{ correto: true, parcial: 1, feedback: '' }} />)
      const caixas = [...container.querySelectorAll('rect')].map((r) => {
        const [x, y, w, h] = ['x', 'y', 'width', 'height'].map((a) => Number(r.getAttribute(a)))
        return { x0: x as number, y0: y as number, x1: (x as number) + (w as number), y1: (y as number) + (h as number) }
      })
      const linhas = [...container.querySelectorAll('line')]
      expect(linhas, item.pergunta).toHaveLength(2)
      for (const l of linhas) {
        const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((a) => Number(l.getAttribute(a))) as [number, number, number, number]
        for (const [x, y] of [
          [x1, y1],
          [x2, y2],
        ] as [number, number][]) {
          expect(x >= 0 && x <= 360 && y >= 0 && y <= 212, `${item.pergunta}: (${x}, ${y}) fora do quadro`).toBe(true)
          // amostra o segmento: nenhum ponto dentro de um corpo (com 1 px de folga para a borda de saída)
          for (let k = 0; k <= 20; k++) {
            const px = x1 + ((x2 - x1) * k) / 20
            const py = y1 + ((y2 - y1) * k) / 20
            for (const c of caixas) expect(px > c.x0 + 1 && px < c.x1 - 1 && py > c.y0 + 1 && py < c.y1 - 1, `${item.pergunta}: seta dentro de um corpo`).toBe(false)
          }
        }
      }
      unmount()
    }
  })
})

describe('Dinâmica: telas', () => {
  it('o Entenda começa pela 1ª lei e tem as etapas da 3ª lei', () => {
    expect(PASSOS_DIN[0]?.visual.tipo).toBe('onibus')
    expect(PASSOS_DIN.some((p) => p.visual.tipo === 'patinadores')).toBe(true)
    expect(PASSOS_DIN.some((p) => p.visual.tipo === 'pares')).toBe(true)
    const { container } = render(
      <MemoryRouter>
        <Entenda />
      </MemoryRouter>,
    )
    expect(container.textContent).toContain('Sem resultante, a velocidade não muda')
    for (let i = 1; i < PASSOS_DIN.length; i++) {
      fireEvent.click(screen.getByLabelText(`Ir para a etapa ${i + 1}`))
      expect(container.textContent).toContain(PASSOS_DIN[i]!.titulo)
    }
  })
  it('as quatro telas do laboratório renderizam, incluindo “Ação e reação”', () => {
    for (const tela of ['intro', 'explorar', 'acao', 'lab']) {
      const l = render(
        <MemoryRouter initialEntries={[`/?tela=${tela}`]}>
          <Laboratorio />
        </MemoryRouter>,
      )
      expect(l.container.querySelector('svg[role="img"]'), tela).not.toBeNull()
      if (tela === 'acao') expect(l.container.textContent).toContain('quem sai mais rápido?')
      expect(screen.getByRole('tab', { name: /Ação e reação/ })).toBeTruthy()
      l.unmount()
    }
  })
  it('os desafios renderizam em todos os níveis (com pictogramas das leis nos níveis 1 e 2)', () => {
    for (const def of DEFINICOES_DINAMICA)
      for (const nivel of [1, 2, 3] as const)
        for (let s = 1; s <= 5; s++) {
          const inst = def.desafio.gerar(s, nivel)
          const { container, unmount } = render(<def.Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length).toBeGreaterThan(20)
          if (def.desafio.id === 'fisica/dinamica/leis' && nivel < 3) expect(container.querySelectorAll('label svg[aria-hidden="true"]')).toHaveLength(4)
          unmount()
        }
  })
})
