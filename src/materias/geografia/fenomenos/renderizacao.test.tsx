import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PASSOS_FENOMENOS } from '@/conteudo/geografia/fenomenos'
import { DEFINICOES_FENOMENOS } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { EnsoSvg, GraficoSuperficies, MapaMassas, OrograficaSvg, PerfilSvg } from './Visuais'
import { perfilDe } from './geradores'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('a serra descreve as temperaturas de entrada, topo e saída', () => {
    const { container } = render(<OrograficaSvg montanha={{ t0: 28, altura: 3, zc: 1 }} posicao={2} />)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('condensação começa a 1 km')
    expect(rotulo).toContain('no topo é 6 °C')
    expect(rotulo).toContain('36 °C')
    expect(container.textContent).toContain('topo: 6 °C')
  })
  it('sem condensação, não há nuvem nem chuva no desenho', () => {
    const { container } = render(<OrograficaSvg montanha={{ t0: 25, altura: 1, zc: 2 }} posicao={1} />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('não há condensação')
    expect(container.textContent).not.toContain('condensação a')
  })
  it('El Niño e La Niña mudam a descrição dos ventos e da ressurgência', () => {
    const nino = render(<EnsoSvg anomalia={2} />).container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(nino).toContain('El Niño muito forte')
    expect(nino).toContain('fracos')
    expect(nino).toContain('enfraquecida')
    const nina = render(<EnsoSvg anomalia={-2} />).container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(nina).toContain('La Niña muito forte')
    expect(nina).toContain('fortes')
  })
  it('no El Niño, a chuva migra para o leste, a Indonésia seca e os peixes da ressurgência somem', () => {
    const nino = render(<EnsoSvg anomalia={2.2} />).container
    expect(nino.textContent).toContain('seca na Indonésia')
    expect(nino.querySelector('svg')?.getAttribute('aria-label')).toContain('sobre a Indonésia, o ar desce seco')
    const normal = render(<EnsoSvg anomalia={0} />).container
    expect(normal.textContent).not.toContain('seca na Indonésia')
    // peixes: desenhados como caminhos com preenchimento translúcido de tinta
    const peixes = (c: HTMLElement) => c.querySelectorAll('path[fill-opacity="0.55"]').length
    expect(peixes(normal)).toBeGreaterThan(0)
    expect(peixes(nino)).toBe(0)
    expect(peixes(render(<EnsoSvg anomalia={-2} />).container)).toBeGreaterThan(peixes(normal))
  })
  it('o gráfico de superfícies tem seis barras e as medidas reduzem o nível do centro', () => {
    const { container } = render(<GraficoSuperficies medidas={[]} />)
    expect(container.querySelectorAll('rect')).toHaveLength(6)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('Centro com asfalto e concreto, o mais quente')
    const m = render(<GraficoSuperficies medidas={['arvores', 'telhado']} />)
    expect(m.container.querySelector('svg')?.getAttribute('aria-label')).toContain('Centro com asfalto e concreto, ameno')
  })
  it('o perfil mostra as temperaturas de cada altura', () => {
    const perfil = perfilDe({ t0: 10, base: 200, espessura: 300, delta: 3 })
    const { container } = render(<PerfilSvg perfil={perfil} camadas={[{ de: 200, ate: 500 }]} />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('0 m, 10 °C')
    expect(container.querySelectorAll('circle')).toHaveLength(13)
  })
  it('o mapa de massas carrega e desenha países, elipses e setas', async () => {
    const { container } = render(<MapaMassas />)
    expect(container.textContent).toContain('Carregando o mapa')
    await waitFor(() => expect(container.querySelector('svg')).not.toBeNull(), { timeout: 8000 })
    expect(container.querySelectorAll('path').length).toBeGreaterThan(100)
    expect(container.querySelectorAll('ellipse')).toHaveLength(5)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('Polar atlântica')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_FENOMENOS).toHaveLength(5)
    for (const def of DEFINICOES_FENOMENOS)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('a pergunta de inversão mostra o gráfico e a tabela de 13 alturas', () => {
    const def = DEFINICOES_FENOMENOS.find((d) => d.desafio.id === 'geografia/fenomenos/inversao')!
    const { container } = render(<def.Entrada inst={def.desafio.gerar(2, 1)} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(13)
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', async () => {
    noRouter(<Entenda />)
    const n = PASSOS_FENOMENOS.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas em KaTeX e fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(3)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(3)
    expect(container.textContent).toContain('NOAA')
  })
})

describe('Laboratório', () => {
  it('Introdução: números da serra (28 °C, orvalho 20 °C, 3 km)', () => {
    noRouter(<Laboratorio />, '/?tela=intro&t0=28&dif=8&h=3&s=2')
    expect(texto()).toContain('Condensação a 1.000 m')
    expect(texto()).toContain('Topo: 6 °C')
    expect(texto()).toContain('36 °C')
    expect(texto()).toContain('8 °C a mais')
  })
  it('Introdução: ar muito seco não condensa antes do topo, não chove', () => {
    noRouter(<Laboratorio />, '/?tela=intro&t0=30&dif=14&h=1')
    expect(texto()).toContain('não há nuvem nem chuva')
  })
  it('Explorar: a massa escolhida mostra temperatura, umidade, origem e efeitos', async () => {
    noRouter(<Laboratorio />, '/?tela=explorar&m=mPa')
    expect(texto()).toContain('Polar atlântica (mPa)')
    expect(texto()).toContain('fria')
    expect(texto()).toContain('friagem no oeste da Amazônia')
    await waitFor(() => expect(document.querySelector('svg[role="img"]')).not.toBeNull(), { timeout: 8000 })
  })
  it('Laboratório: El Niño forte, ilha de calor e inversão', () => {
    noRouter(<Laboratorio />, '/?tela=lab&f=enso&an=1.6')
    expect(texto()).toContain('El Niño forte')
    expect(texto()).toContain('chuvas acima da média')
    const n = noRouter(<Laboratorio />, '/?tela=lab&f=enso&an=0.2')
    expect(n.container.textContent).toContain('Condições neutras')
    const u = noRouter(<Laboratorio />, '/?tela=lab&f=urbano&arv=1&tel=1')
    expect(u.container.textContent).toContain('nível 2 de 4')
    const i = noRouter(<Laboratorio />, '/?tela=lab&f=inversao&base=200&esp=300&dl=3')
    expect(i.container.textContent).toContain('Inversão entre 200 m e 500 m')
    const s = noRouter(<Laboratorio />, '/?tela=lab&f=inversao&dl=0')
    expect(s.container.textContent).toContain('Sem inversão')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
