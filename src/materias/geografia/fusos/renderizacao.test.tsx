import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CIDADES, PASSOS_FUSOS } from '@/conteudo/geografia/fusos'
import { DEFINICOES_FUSOS } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { FaixaFusos, MapaFusos, TabelaFusos, TabelaHoras } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('a faixa de fusos tem 25 células, marca as cidades e diz a diferença', () => {
    const { container } = render(
      <FaixaFusos
        marcas={[
          { utc: -3, rotulo: 'Brasília' },
          { utc: 9, rotulo: 'Tóquio' },
        ]}
      />,
    )
    expect(container.querySelectorAll('rect')).toHaveLength(25)
    expect(container.querySelectorAll('circle')).toHaveLength(2)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('Brasília: UTC−3')
    expect(rotulo).toContain('Tóquio: UTC+9')
    expect(rotulo).toContain('Diferença do destino para a origem: +12 horas')
    expect(container.textContent).toContain('+12 h')
  })
  it('a tabela de fusos lista as 18 cidades, com fuso teórico e oficial', () => {
    const { container } = render(<TabelaFusos />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(CIDADES.length)
    expect(container.textContent).toContain('Lagos')
  })
  it('a tabela de horas mostra hora, fuso e dia da semana', () => {
    const lagos = CIDADES.find((c) => c.id === 'lagos')!
    const { container } = render(<TabelaHoras linhas={[{ cidade: lagos, minutos: 14 * 60 + 30, dia: 2 }]} />)
    expect(container.textContent).toContain('14h30')
    expect(container.textContent).toContain('UTC+1')
    expect(container.textContent).toContain('terça-feira')
  })
  it('o mapa carrega, desenha os 24 fusos e a linha da longitude', async () => {
    const { container } = render(<MapaFusos longitude={-47} destaque={-3} rotuladas={[CIDADES.find((c) => c.id === 'brasilia')!]} />)
    expect(container.textContent).toContain('Carregando o mapa')
    await waitFor(() => expect(container.querySelector('svg')).not.toBeNull(), { timeout: 8000 })
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('24 fusos horários de 15 graus')
    expect(rotulo).toContain('Em destaque, o fuso UTC−3')
    expect(rotulo).toContain('longitude 47° oeste')
    expect(container.querySelectorAll('path').length).toBeGreaterThan(100)
    expect(container.querySelectorAll('rect')).toHaveLength(25)
    expect(container.textContent).toContain('Brasília')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_FUSOS).toHaveLength(5)
    for (const def of DEFINICOES_FUSOS)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('as perguntas de hora e de viagem mostram a faixa de fusos com as duas cidades', () => {
    for (const id of ['geografia/fusos/hora', 'geografia/fusos/viagem']) {
      const def = DEFINICOES_FUSOS.find((d) => d.desafio.id === id)!
      const { container, unmount } = render(<def.Entrada inst={def.desafio.gerar(2, 2)} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
      expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(1)
      expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('Faixa dos fusos')
      unmount()
    }
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    const n = PASSOS_FUSOS.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas em KaTeX e fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(3)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(7)
    expect(container.textContent).toContain('IANA')
    expect(container.textContent).toContain('Decreto nº 9.772')
  })
})

describe('Laboratório', () => {
  it('Introdução: 10h de segunda em Brasília são 22h em Tóquio e 18h30 em Nova Délhi', () => {
    noRouter(<Laboratorio />, '/?tela=intro&cid=brasilia&h=10&dia=1')
    expect(texto()).toContain('Em Brasília: 10h de segunda-feira')
    const linha = (nome: string) => screen.getByRole('row', { name: new RegExp(nome) }).textContent as string
    expect(linha('Tóquio')).toContain('22h')
    expect(linha('Nova Délhi')).toContain('18h30')
    expect(linha('Honolulu')).toContain('3h')
  })
  it('Introdução: de madrugada em Tóquio, o dia da semana em Brasília volta um dia', () => {
    noRouter(<Laboratorio />, '/?tela=intro&cid=toquio&h=1&dia=3')
    const brasilia = screen.getByRole('row', { name: /Brasília/ }).textContent as string
    expect(brasilia).toContain('13h')
    expect(brasilia).toContain('terça-feira')
  })
  it('Explorar: longitude de 45° O dá fuso UTC−3; Lagos mostra teórico e oficial', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&lon=-45')
    expect(texto()).toContain('fuso teórico UTC−3')
    expect(texto()).toContain('Meridiano central: 45° O')
    const lagos = noRouter(<Laboratorio />, '/?tela=explorar&cid=lagos')
    expect(lagos.container.textContent).toContain('fuso teórico UTC+0, fuso oficial UTC+1')
  })
  it('Laboratório: voo padrão de Brasília a Tóquio chega às 10h do dia seguinte', () => {
    noRouter(<Laboratorio />, '/?tela=lab')
    expect(texto()).toContain('Chega em Tóquio às 10h (dia seguinte)')
    expect(texto()).toContain('Voando para o leste')
  })
  it('Laboratório: voo para o oeste perde horas', () => {
    noRouter(<Laboratorio />, '/?tela=lab&o=brasilia&d=manaus&h=10&dur=3')
    expect(texto()).toContain('Chega em Manaus às 12h (mesmo dia)')
    expect(texto()).toContain('Voando para o oeste')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
