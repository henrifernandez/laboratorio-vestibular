import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PASSOS_PLACAS } from '@/conteudo/geografia/placas'
import { DEFINICOES_PLACAS } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { AssoalhoSvg, CamadasSvg, CorteSvg, LitosferaSvg } from './Visuais'
import { LIMITES, type IdLimite } from './calculo'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('o corte descreve o limite e o progresso para leitores de tela', () => {
    for (const id of Object.keys(LIMITES) as IdLimite[]) {
      const { container, unmount } = render(<CorteSvg limite={id} progresso={0.5} />)
      const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
      expect(rotulo.toLowerCase()).toContain(LIMITES[id].nome.toLowerCase())
      expect(container.querySelectorAll('polygon').length).toBeGreaterThanOrEqual(2)
      unmount()
    }
  })
  it('a vista de cima da falha mostra o rio deslocado e a linha da falha', () => {
    const { container } = render(<CorteSvg limite="transformante" progresso={1} />)
    expect(container.textContent).toContain('rio deslocado: 70')
    expect(container.querySelectorAll('g[stroke="var(--geo-frio)"] path')).toHaveLength(2)
  })
  it('o zoom da litosfera mostra crosta, litosfera de ~100 km e astenosfera, com régua em km', () => {
    const { container } = render(<LitosferaSvg />)
    expect(container.textContent).toContain('litosfera (~100 km) = a placa')
    expect(container.textContent).toContain('astenosfera')
    expect(container.textContent).toContain('300')
  })
  it('camadas e faixas de idade têm descrição acessível', () => {
    expect(render(<CamadasSvg />).container.querySelector('svg')?.getAttribute('aria-label')).toContain('núcleo interno sólido')
    const a = render(<AssoalhoSvg meiaTaxa={2.5} posicaoKm={1000} alcanceKm={2000} />)
    expect(a.container.querySelector('svg')?.getAttribute('aria-label')).toContain('cerca de 40 milhões de anos')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 4 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_PLACAS).toHaveLength(4)
    for (const def of DEFINICOES_PLACAS)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 10; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('depois da resposta, as perguntas de limite mostram o diagrama do caso certo', () => {
    const def = DEFINICOES_PLACAS.find((d) => d.desafio.id === 'geografia/placas/limite')!
    const inst = def.desafio.gerar(3, 2)
    const correcao = def.desafio.corrigir(inst, inst.certa)
    const { container } = render(<def.Entrada inst={inst} resposta={inst.certa} onChange={() => {}} correcao={correcao} bloqueado />)
    expect(container.querySelector('svg[role="img"]')).not.toBeNull()
    const antes = render(<def.Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(antes.container.querySelector('svg[role="img"]')).toBeNull()
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    const n = PASSOS_PLACAS.length
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
    expect(container.textContent).toContain('USGS')
  })
})

describe('Laboratório', () => {
  it('Introdução: oceânica e continental se aproximando formam a subducção; afastar oceânica com continental não existe', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    expect(texto()).toContain('Subducção oceano-continente')
    const x = noRouter(<Laboratorio />, '/?tela=intro&mov=afastam')
    expect(x.container.textContent).toContain('Essa combinação não ocorre na natureza')
  })
  it('Introdução: o deslocamento é velocidade × tempo × 10', () => {
    noRouter(<Laboratorio />, '/?tela=intro&v=5&t=40')
    expect(texto()).toContain('5 cm/ano × 40 Ma × 10 = 2.000 km')
  })
  it('Explorar: cada lugar mostra as placas e o tipo de limite; o Brasil está no meio da placa', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&caso=himalaia')
    expect(texto()).toContain('Placa Indiana contra a Placa Euroasiática')
    expect(texto()).toContain('Colisão continental')
    const b = noRouter(<Laboratorio />, '/?tela=explorar&caso=brasil')
    expect(b.container.textContent).toContain('O Brasil está no meio da placa')
  })
  it('Laboratório: idade da crosta é distância ÷ (meia-taxa × 10) e o tempo de abertura usa a taxa total', () => {
    noRouter(<Laboratorio />, '/?tela=lab&meia=2.5&pos=1000&ma=60&larg=5000')
    expect(texto()).toContain('40 milhões de anos')
    expect(texto()).toContain('3.000 km')
    // 5.000 km a 5 cm/ano (taxa total): 100 Ma
    expect(texto()).toContain('há cerca de 100 milhões de anos')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
