import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PASSOS_POPULACAO } from '@/conteudo/geografia/populacao'
import { PARAMETROS_FASE, piramideModelo } from './calculo'
import { DEFINICOES_POPULACAO } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { GraficoRazao, GraficoTransicao, MiniPiramide, PiramideSvg, TabelaFaixas } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string
const modelo = piramideModelo(PARAMETROS_FASE[3])

describe('Visuais', () => {
  it('a pirâmide tem 34 barras (17 faixas por sexo) e descreve todos os valores', () => {
    const { container } = render(<PiramideSvg piramide={modelo} grupos />)
    expect(container.querySelectorAll('rect')).toHaveLength(34)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('Jovens de 0 a 14 anos')
    expect(rotulo).toContain('80+ anos: homens')
    expect(rotulo).toContain('Idosos de 65 anos ou mais')
    expect(container.textContent).toContain('Homens')
    expect(container.textContent).toContain('Mulheres')
  })
  it('a faixa escolhida fica com contorno', () => {
    const { container } = render(<PiramideSvg piramide={modelo} faixaSel={4} />)
    expect(container.querySelectorAll('rect[stroke="var(--ink)"]')).toHaveLength(2)
  })
  it('a miniatura não tem texto e traz a descrição no rótulo', () => {
    const { container } = render(<MiniPiramide piramide={modelo} rotulo="Pirâmide A: teste" />)
    expect(container.textContent).toBe('')
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Pirâmide A: teste')
    expect(container.querySelectorAll('rect')).toHaveLength(34)
  })
  it('a tabela de faixas lista as 17 faixas', () => {
    const { container } = render(<TabelaFaixas piramide={modelo} />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(17)
  })
  it('o gráfico da transição mostra as quatro fases e o momento marcado', () => {
    const { container } = render(<GraficoTransicao t={0.9} />)
    expect(container.textContent).toContain('Fase 1')
    expect(container.textContent).toContain('Fase 4')
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('No momento marcado')
    expect(container.querySelectorAll('circle')).toHaveLength(2)
  })
  it('o gráfico da razão de dependência marca o mínimo', () => {
    const pontos = [60, 55, 52, 56, 63].map((rd, i) => ({ rotulo: String(1980 + i * 10), rd }))
    const { container } = render(<GraficoRazao pontos={pontos} marcarMinimo />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('O menor valor é 52, em 2000')
    expect(container.querySelectorAll('circle')).toHaveLength(6)
    expect(container.textContent).toContain('auge do bônus')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_POPULACAO).toHaveLength(5)
    for (const def of DEFINICOES_POPULACAO)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('a pergunta de comparar pirâmides mostra uma miniatura por alternativa', () => {
    const def = DEFINICOES_POPULACAO.find((d) => d.desafio.id === 'geografia/populacao/piramides')!
    const { container } = render(<def.Entrada inst={def.desafio.gerar(1, 1)} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(container.querySelectorAll('svg[role="img"]')).toHaveLength(4)
  })
  it('a pergunta do bônus mostra o gráfico da razão de dependência', () => {
    const def = DEFINICOES_POPULACAO.find((d) => d.desafio.id === 'geografia/populacao/bonus')!
    const { container } = render(<def.Entrada inst={def.desafio.gerar(3, 2)} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('Razão de dependência por período')
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    const n = PASSOS_POPULACAO.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas em KaTeX e fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(3)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(6)
    expect(container.textContent).toContain('IBGE')
    expect(container.textContent).toContain('ONU')
  })
})

describe('Laboratório', () => {
  it('Introdução: fase 4 mostra a pirâmide envelhecida e os indicadores', () => {
    noRouter(<Laboratorio />, '/?tela=intro&fase=4')
    expect(texto()).toContain('Baixas natalidade e mortalidade')
    expect(texto()).toContain('base estreita e topo largo')
    expect(texto()).toContain('Índice de envelhecimento')
  })
  it('Introdução: a faixa escolhida mostra homens e mulheres', () => {
    noRouter(<Laboratorio />, '/?tela=intro&fase=3&faixa=0')
    expect(texto()).toContain('0–4 anos')
    expect(texto()).toContain('somando')
  })
  it('Explorar: no fim da transição, a fase é a 4', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&t=1')
    expect(texto()).toContain('Fase 4')
    expect(texto()).toContain('Natalidade 11 por mil')
  })
  it('Laboratório: natalidade 30 e mortalidade 10 dão 2% ao ano e dobram em 35 anos', () => {
    noRouter(<Laboratorio />, '/?tela=lab&nat=30&mor=10')
    expect(texto()).toContain('Crescimento natural: 2% ao ano')
    expect(texto()).toContain('Dobra em cerca de 35 anos')
  })
  it('Laboratório: mortalidade maior que natalidade diminui a população', () => {
    noRouter(<Laboratorio />, '/?tela=lab&nat=9&mor=12')
    expect(texto()).toContain('Diminui à metade')
  })
  it('Laboratório: mostra as taxas dos censos do Brasil', () => {
    noRouter(<Laboratorio />, '/?tela=lab')
    expect(texto()).toContain('2000 a 2010: cerca de 1,17% ao ano')
    expect(texto()).toContain('2010 a 2022: cerca de 0,52% ao ano')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
