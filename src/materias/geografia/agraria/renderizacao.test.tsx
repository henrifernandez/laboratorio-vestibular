import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PASSOS_AGRARIA, RESUMO_AGRARIA, SISTEMAS } from '@/conteudo/geografia/agraria'
import { curvaModelo, giniModelo, pontosLorenz } from './calculo'
import { DEFINICOES_AGRARIA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { BarrasProducao, CartaoSistema, LorenzSvg, TabelaFaixas, TabelaSistemas } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('a curva de Lorenz descreve o Gini e os pontos, e marca os vértices', () => {
    const faixas = [
      { estabelecimentos: 60, area: 5 },
      { estabelecimentos: 30, area: 25 },
      { estabelecimentos: 10, area: 70 },
    ]
    const { container } = render(<LorenzSvg pontos={pontosLorenz(faixas)} gini={0.66} marcar />)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('índice de Gini é 0,66')
    expect(rotulo).toContain('60% dos estabelecimentos com 5% da área')
    expect(rotulo).toContain('90% dos estabelecimentos com 30% da área')
    expect(container.querySelectorAll('circle')).toHaveLength(2)
    expect(container.textContent).toContain('igualdade total')
  })
  it('a curva do modelo não tem vértices marcados e o Gini aparece escrito', () => {
    const { container } = render(<LorenzSvg pontos={curvaModelo(4)} gini={giniModelo(4)} />)
    expect(container.querySelectorAll('circle')).toHaveLength(0)
    expect(container.textContent).toContain('0,6')
  })
  it('a tabela de faixas acumula estabelecimentos e área', () => {
    const { container } = render(<TabelaFaixas faixas={[{ estabelecimentos: 60, area: 5 }, { estabelecimentos: 40, area: 95 }]} />)
    const linhas = [...container.querySelectorAll('tbody tr')].map((l) => l.textContent)
    expect(linhas[0]).toContain('60%')
    expect(linhas[1]).toContain('100%')
  })
  it('as barras mostram área, produtividade e produção em relação ao começo', () => {
    const { container } = render(<BarrasProducao area0={100} prod0={2} area1={120} prod1={5} />)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('Área: 120%')
    expect(rotulo).toContain('Produtividade: 250%')
    expect(rotulo).toContain('Produção: 300%')
    expect(container.querySelectorAll('rect')).toHaveLength(3)
  })
  it('o cartão e a tabela dos sistemas trazem todos os critérios', () => {
    const s = SISTEMAS[1]!
    const { container } = render(<CartaoSistema sistema={s} />)
    for (const c of ['Escala', 'Trabalho', 'Tecnologia', 'Destino da produção', 'Exemplo', 'Impactos']) expect(container.textContent).toContain(c)
    const t = render(<TabelaSistemas sistemas={SISTEMAS} destaque={s.id} />)
    expect(t.container.querySelectorAll('tbody tr')).toHaveLength(SISTEMAS.length)
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_AGRARIA).toHaveLength(5)
    for (const def of DEFINICOES_AGRARIA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('o gráfico da curva só aparece depois da resposta (ele mostra o Gini)', () => {
    const def = DEFINICOES_AGRARIA.find((d) => d.desafio.id === 'geografia/agraria/gini')!
    const inst = def.desafio.gerar(4, 2)
    const antes = render(<def.Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(antes.container.querySelector('svg')).toBeNull()
    expect(antes.container.querySelector('table')).not.toBeNull()
    const depois = render(<def.Entrada inst={inst} resposta="0,4" onChange={() => {}} correcao={def.desafio.corrigir(inst, '0,4')} bloqueado />)
    expect(depois.container.querySelector('svg[role="img"]')).not.toBeNull()
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    const n = PASSOS_AGRARIA.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas, pegadinhas e fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(RESUMO_AGRARIA.length)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(3)
    expect(container.textContent).toContain('Censo Agropecuário')
  })
})

describe('Laboratório', () => {
  it('Introdução: com 10% dos maiores ficando com 10% da área, a curva é a diagonal (Gini 0)', () => {
    noRouter(<Laboratorio />, '/?tela=intro&topo=10')
    expect(texto()).toContain('Gini 0,00')
    expect(texto()).toContain('baixa concentração')
  })
  it('Introdução: com 60% nos 10% maiores, o Gini é (k − 1)/(k + 1) com k = ln(0,4)/ln(0,9)', () => {
    noRouter(<Laboratorio />, '/?tela=intro&topo=60')
    const k = Math.log(0.4) / Math.log(0.9)
    const g = (k - 1) / (k + 1)
    expect(texto()).toContain(`Gini ${g.toFixed(2).replace('.', ',')}`)
    expect(texto()).toContain('alta concentração')
  })
  it('Explorar: o sistema escolhido aparece no cartão', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&s=plantation')
    expect(screen.getByLabelText('Plantation')).toBeInTheDocument()
    expect(texto()).toContain('engenhos de cana-de-açúcar')
  })
  it('Laboratório: só mais produtividade é crescimento intensivo; só mais área, extensivo', () => {
    noRouter(<Laboratorio />, '/?tela=lab&area=100&prod=6')
    expect(texto()).toContain('Crescimento mais intensivo')
    expect(texto()).toContain('Produção +200%')
    const x = noRouter(<Laboratorio />, '/?tela=lab&area=300&prod=2')
    expect(x.container.textContent).toContain('Crescimento mais extensivo')
    const y = noRouter(<Laboratorio />, '/?tela=lab&area=100&prod=2')
    expect(y.container.textContent).toContain('A produção não mudou')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
