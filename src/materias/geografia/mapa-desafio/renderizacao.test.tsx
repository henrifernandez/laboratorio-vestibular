import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PASSOS_MAPA } from '@/conteudo/geografia/mapa-desafio'
import { DEFINICOES_MAPA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { EscalaSvg, ListaNumerada, MapaPaises, MapaProjecao } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string
const carregou = (c: HTMLElement) => waitFor(() => expect(c.querySelectorAll('path').length).toBeGreaterThan(100), { timeout: 8000 })

describe('Visuais', () => {
  it('a régua descreve a escala e a medida marcada', () => {
    const { container } = render(<EscalaSvg denominador={50_000} cm={4} />)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('escala 1:50.000')
    expect(rotulo).toContain('cada centímetro equivale a 500 m')
    expect(rotulo).toContain('4 cm, que equivalem a 2 km')
    expect(container.textContent).toContain('1 cm = 500 m')
  })
  it('o mapa carrega os países, destaca um e põe as coordenadas do centro no texto alternativo', async () => {
    const { container } = render(<MapaPaises regiao="america-do-sul" destaques={{ '858': 'var(--geo-quente)' }} descricao="Mapa da América do Sul com um país em destaque." centroDe="858" />)
    expect(container.textContent).toContain('Carregando o mapa')
    await carregou(container)
    expect(container.querySelectorAll('path[fill="var(--geo-quente)"]')).toHaveLength(1)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('Posição aproximada do centro do país')
    expect(rotulo).toMatch(/3\d° S, 5\d° O/)
  })
  it('países numerados aparecem com números e a lista traz os nomes', async () => {
    const ids = ['032', '858', '600']
    const { container } = render(
      <>
        <MapaPaises regiao="america-do-sul" descricao="Mapa." numerados={ids} />
        <ListaNumerada ids={ids} />
      </>,
    )
    await carregou(container)
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(3))
    expect(container.textContent).toContain('Argentina')
    expect(container.querySelectorAll('li')).toHaveLength(3)
  })
  it('pontos e linhas de referência são desenhados com rótulo', async () => {
    const { container } = render(<MapaPaises regiao="mundo" descricao="Mapa." pontos={[{ lat: 10, lon: 20, rotulo: '1' }]} linhas={[{ tipo: 'paralelo', valor: 0, rotulo: 'Equador' }]} />)
    await carregou(container)
    expect(container.querySelectorAll('circle')).toHaveLength(1)
    expect(container.textContent).toContain('Equador')
  })
  it('o mapa em projeção carrega e deixa a Antártida de fora', async () => {
    const mercator = render(<MapaProjecao tipo="mercator" />)
    await carregou(mercator.container)
    expect(mercator.container.querySelector('svg')?.getAttribute('aria-label')).toContain('Mercator')
    const todos = render(<MapaProjecao tipo="equal-earth" />)
    await carregou(todos.container)
    // 177 países no arquivo, menos a Antártida, mais a grade
    expect(todos.container.querySelectorAll('path').length).toBe(177)
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_MAPA).toHaveLength(5)
    for (const def of DEFINICOES_MAPA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('a pergunta “qual é o país?” oferece alternativas em texto (sem depender de clicar no mapa)', () => {
    const def = DEFINICOES_MAPA.find((d) => d.desafio.id === 'geografia/mapa-desafio/pais')!
    const { container } = render(<def.Entrada inst={def.desafio.gerar(3, 1)} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(container.querySelectorAll('input[type="radio"], [role="radio"]').length).toBeGreaterThanOrEqual(4)
    expect(container.textContent).toContain('Qual é o país em destaque')
  })
  it('a pergunta de escala mostra a régua', () => {
    const def = DEFINICOES_MAPA.find((d) => d.desafio.id === 'geografia/mapa-desafio/escala')!
    const { container } = render(<def.Entrada inst={def.desafio.gerar(2, 1)} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('Régua de 0 a 10 centímetros')
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    const n = PASSOS_MAPA.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas em KaTeX e fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(3)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(4)
    expect(container.textContent).toContain('Natural Earth')
    expect(container.textContent).toContain('IBGE')
  })
})

describe('Laboratório', () => {
  it('Introdução: o ponto escolhido mostra os hemisférios', () => {
    noRouter(<Laboratorio />, '/?tela=intro&lat=-16&lon=-48&cid=')
    expect(texto()).toContain('16° S, 48° O')
    expect(texto()).toContain('Hemisfério Sul e Ocidental')
    expect(texto()).toContain('zona tropical')
  })
  it('Introdução: escolher uma cidade usa as coordenadas dela', () => {
    noRouter(<Laboratorio />, '/?tela=intro&cid=toquio')
    expect(texto()).toContain('36° N, 140° L')
    expect(texto()).toContain('Hemisfério Norte e Oriental')
  })
  it('Explorar: 4 cm em 1:50.000 valem 2 km; em 1:5.000.000, 200 km', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&E=50000&cm=4')
    expect(texto()).toContain('4 cm no mapa = 2 km no terreno')
    expect(texto()).toContain('1 cm vale 500 m')
    const grande = noRouter(<Laboratorio />, '/?tela=explorar&E=5000000&cm=4')
    expect(grande.container.textContent).toContain('4 cm no mapa = 200 km no terreno')
  })
  it('Laboratório: a Groenlândia parece 4 vezes o Brasil em Mercator (e é 0,26 dele); em Equal Earth, a proporção real', async () => {
    noRouter(<Laboratorio />, '/?tela=lab&p=mercator&a=304&b=076')
    await waitFor(() => expect(texto()).toContain('Na tela: 4,01 · Na realidade: 0,26'), { timeout: 8000 })
    expect(texto()).toContain('Razão das áreas: Groenlândia ÷ Brasil')
    expect(texto()).toContain('a razão fica 15,6 vezes maior que a real')
    const ee = noRouter(<Laboratorio />, '/?tela=lab&p=equal-earth&a=304&b=076')
    await waitFor(() => expect(ee.container.textContent).toContain('Na tela: 0,26 · Na realidade: 0,26'), { timeout: 8000 })
    expect(ee.container.textContent).toContain('mantém a proporção entre as áreas')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
