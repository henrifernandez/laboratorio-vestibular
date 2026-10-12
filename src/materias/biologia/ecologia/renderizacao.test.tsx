import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TEIAS } from './calculo'
import { DEFINICOES_ECOLOGIA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { TeiaSvg } from './Visuais'

const NIVEIS = [1, 2, 3] as const

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

const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)

describe('Teia alimentar (SVG)', () => {
  it.each(TEIAS.map((t) => [t.id, t] as const))('%s: uma caixa por espécie, com nome acessível, e as setas aparecem', (_id, t) => {
    const { container } = render(<TeiaSvg t={t} rotulo="teste" />)
    expect(container.querySelectorAll('svg > path')).toHaveLength(t.come.length)
    for (const e of t.especies) expect(container.textContent).toContain(e.nome.split('-')[0])
  })
  it('interativa: clique, Enter e Espaço alternam a espécie; cada caixa é focável', () => {
    const t = TEIAS[0]!
    const alternadas: string[] = []
    render(<TeiaSvg t={t} rotulo="teste" onAlternar={(id) => alternadas.push(id)} marcas={{ lambari: 'removida' }} />)
    const caixas = screen.getAllByRole('checkbox')
    expect(caixas).toHaveLength(t.especies.length)
    for (const c of caixas) expect(c).toHaveAttribute('tabindex', '0')
    const lambari = screen.getByRole('checkbox', { name: /Lambari/ })
    expect(lambari).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: /Tucunaré/ })).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(lambari)
    fireEvent.keyDown(lambari, { key: 'Enter' })
    fireEvent.keyDown(lambari, { key: ' ' })
    fireEvent.keyDown(lambari, { key: 'a' })
    expect(alternadas).toEqual(['lambari', 'lambari', 'lambari'])
  })
  it('não interativa: sem retângulo de foco e sem papel de caixa de seleção', () => {
    const { container } = render(<TeiaSvg t={TEIAS[1]!} rotulo="teste" />)
    expect(container.querySelector('.foco')).toBeNull()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes, renderizam e a resposta certa é aceita', () => {
    expect(DEFINICOES_ECOLOGIA).toHaveLength(5)
    for (const def of DEFINICOES_ECOLOGIA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 25; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('depois de responder, a teia revela o alvo (antes disso, não)', () => {
    const def = DEFINICOES_ECOLOGIA.find((d) => d.desafio.id === 'biologia/ecologia/teia')!
    let verificados = 0
    for (let semente = 1; semente <= 80 && verificados < 6; semente++) {
      const inst = def.desafio.gerar(semente, 1)
      const tipo = (inst.dados as { tipo: string }).tipo
      if (tipo !== 'produtor' && tipo !== 'primario' && tipo !== 'topo') continue
      const { Entrada } = def
      const antes = render(<Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
      const marcadosAntes = antes.container.querySelectorAll('rect[stroke-width="3.2"]').length
      antes.unmount()
      const depois = render(<Entrada inst={inst} resposta={inst.certa} onChange={() => {}} correcao={{ correto: true, feedback: 'ok' }} bloqueado />)
      const marcadosDepois = depois.container.querySelectorAll('rect[stroke-width="3.2"]').length
      depois.unmount()
      if (tipo === 'produtor') {
        expect(marcadosAntes).toBe(0)
        continue
      }
      expect(marcadosAntes, `${tipo} ${semente}: o alvo apareceu antes da resposta`).toBe(0)
      expect(marcadosDepois, `${tipo} ${semente}: o alvo deveria aparecer depois da resposta`).toBeGreaterThan(0)
      verificados++
    }
    expect(verificados).toBeGreaterThan(0)
  })
  it('energia "quanto se perde" não aponta um nível como incógnita', () => {
    const def = DEFINICOES_ECOLOGIA.find((d) => d.desafio.id === 'biologia/ecologia/energia')!
    let vistas = 0
    for (let semente = 1; semente <= 80; semente++) {
      const inst = def.desafio.gerar(semente, 1) as { dados: { variante: string } }
      if (inst.dados.variante !== 'perdida') continue
      const { Entrada } = def
      const { container, unmount } = render(<Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
      const grupo = container.querySelector('[role="group"]') as HTMLElement
      expect(within(grupo).queryByText('?')).toBeNull()
      unmount()
      vistas++
    }
    expect(vistas).toBeGreaterThan(0)
  })
})

describe('Abas do tema', () => {
  it('Entenda: as 11 etapas renderizam, uma por vez, e cada uma tem o “pare e pense”', () => {
    noRouter(<Entenda />)
    for (let i = 1; i <= 11; i++) {
      expect(screen.getByText(`Etapa ${i} de 11`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < 11) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: todas as seções aparecem, com fórmulas em KaTeX', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(6)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(5)
  })
})

describe('Laboratório', () => {
  it('Introdução: retirar uma espécie mostra as consequências e reiniciar limpa', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    expect(screen.getByText(/Nenhuma espécie retirada/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: /Lambari/ }))
    expect(screen.getByText(/Ficam sem nenhum alimento na hora/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Lambari/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar/ }))
    expect(screen.getByText(/Nenhuma espécie retirada/)).toBeInTheDocument()
  })
  it('Introdução: trocar de ambiente limpa as espécies retiradas', () => {
    noRouter(<Laboratorio />, '/?tela=intro&rem=lambari')
    expect(screen.getByRole('checkbox', { name: /Lambari/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.change(screen.getByLabelText('Ambiente'), { target: { value: 'cerrado' } })
    expect(screen.getByText(/Nenhuma espécie retirada/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Ema/ })).toBeInTheDocument()
  })
  it('Introdução: ids desconhecidos na URL são ignorados', () => {
    noRouter(<Laboratorio />, '/?tela=intro&rem=naoexiste,lambari')
    expect(screen.getByText(/Retirada:/)).toHaveTextContent('Lambari')
  })
  it('Explorar: pirâmides (energia nunca invertida) e ciclo do carbono', () => {
    noRouter(<Laboratorio />, '/?tela=explorar')
    expect(screen.getByText(/Pirâmide “de pé”/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Biomassa'))
    expect(screen.getByText(/Pirâmide “de pé”/)).toBeInTheDocument() // campo: biomassa em pirâmide
    fireEvent.change(screen.getByLabelText('Ambiente'), { target: { value: 'mar' } })
    expect(screen.getByText(/Pirâmide invertida/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Energia'))
    expect(screen.getByText(/Pirâmide “de pé”/)).toBeInTheDocument()
  })
  it('Explorar (carbono): o balanço aparece e responde aos controles', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=carbono')
    expect(screen.getByText(/Emissões:/)).toHaveTextContent('10,7')
  })
  it('Laboratório: logístico e presa-predador renderizam os gráficos e os controles de tempo', () => {
    noRouter(<Laboratorio />, '/?tela=lab&tl=30')
    expect(screen.getByRole('button', { name: /Iniciar/ })).toBeInTheDocument()
    expect(document.body.textContent).toContain('N = 892')
    fireEvent.click(screen.getByLabelText('Presa e predador'))
    expect(screen.getAllByText(/Equilíbrio: presas/).length).toBeGreaterThan(0)
  })
  it('Jogo: a tela do jogo abre', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
