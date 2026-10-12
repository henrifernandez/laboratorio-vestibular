import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CIDADES, PASSOS_CLIMOGRAMAS } from '@/conteudo/geografia/climogramas'
import { cidade, gerarSintetico } from './calculo'
import { DEFINICOES_CLIMOGRAMAS } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { Climograma, MiniClimograma, TabelaMeses, descreverClimograma } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('o climograma tem 12 barras, uma linha e descrição com todos os valores', () => {
    const c = cidade('manaus')
    const { container } = render(<Climograma dados={c} nome="Manaus" />)
    expect(container.querySelectorAll('rect[fill="var(--geo-frio)"]')).toHaveLength(12)
    expect(container.querySelectorAll('polyline')).toHaveLength(1)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toBe(descreverClimograma(c, 'Manaus'))
    expect(rotulo).toContain('26,5; 26,3')
    expect(rotulo).toContain('280; 290; 330')
  })
  it('temperaturas negativas desenham a linha do zero', () => {
    const { container } = render(<Climograma dados={cidade('moscou')} />)
    expect(container.querySelector('line[stroke-dasharray="5 4"]')).not.toBeNull()
    expect(render(<Climograma dados={cidade('manaus')} />).container.querySelector('line[stroke-dasharray="5 4"]')).toBeNull()
  })
  it('marcar secos põe contorno nas barras certas (Brasília: maio a agosto)', () => {
    const { container } = render(<Climograma dados={cidade('brasilia')} marcarSecos />)
    expect(container.querySelectorAll('rect[stroke="var(--erro)"]')).toHaveLength(4)
  })
  it('a tabela mostra 12 meses e, se pedido, se o mês é seco', () => {
    const { container } = render(<TabelaMeses dados={cidade('roma')} destacarSecos />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(12)
    expect(container.textContent).toContain('sim')
  })
  it('a miniatura traz o rótulo recebido', () => {
    const { container } = render(<MiniClimograma dados={cidade('cairo')} rotulo="Climograma B: teste" />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Climograma B: teste')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_CLIMOGRAMAS).toHaveLength(5)
    for (const def of DEFINICOES_CLIMOGRAMAS)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('perguntas com miniaturas mostram uma por alternativa; as de leitura mostram o gráfico e a tabela', () => {
    const comparar = DEFINICOES_CLIMOGRAMAS.find((d) => d.desafio.id === 'geografia/climogramas/comparar')!
    const inst = comparar.desafio.gerar(3, 1)
    const r = render(<comparar.Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(r.container.querySelectorAll('svg[role="img"]')).toHaveLength(4)
    r.unmount()
    const leitura = DEFINICOES_CLIMOGRAMAS.find((d) => d.desafio.id === 'geografia/climogramas/leitura')!
    const l = render(<leitura.Entrada inst={leitura.desafio.gerar(3, 2)} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(l.container.querySelectorAll('svg[role="img"]')).toHaveLength(1)
    expect(l.container.querySelectorAll('details')).toHaveLength(1)
  })
  it('depois de responder, o gráfico revela o nome da cidade; antes, não', () => {
    const def = DEFINICOES_CLIMOGRAMAS.find((d) => d.desafio.id === 'geografia/climogramas/clima')!
    const inst = def.desafio.gerar(7, 2)
    const antes = render(<def.Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    const nome = cidade(inst.dados.cidade).nome
    expect(antes.container.querySelector('svg')?.getAttribute('aria-label')).not.toContain(nome)
    antes.unmount()
    const corr = def.desafio.corrigir(inst, inst.certa)
    const depois = render(<def.Entrada inst={inst} resposta={inst.certa} onChange={() => {}} correcao={corr} bloqueado />)
    expect(depois.container.querySelector('svg')?.getAttribute('aria-label')).toContain(nome)
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    const n = PASSOS_CLIMOGRAMAS.length
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
    expect(container.textContent).toContain('INMET')
  })
})

describe('Laboratório', () => {
  it('Introdução: números de Petrolina e escolha de mês', () => {
    noRouter(<Laboratorio />, '/?tela=intro&cid=petrolina&mes=6')
    expect(texto()).toContain('Semiárido')
    expect(texto()).toContain('606 mm')
    expect(texto()).toContain('julho: 23,5 °C e 3 mm')
    expect(texto()).toContain('mês seco')
  })
  it('Introdução: o texto não conclui hemisfério quando a amplitude é pequena (Brasília)', () => {
    noRouter(<Laboratorio />, '/?tela=intro&cid=brasilia')
    expect(texto()).toContain('não dá para concluir o hemisfério')
    const m = noRouter(<Laboratorio />, '/?tela=intro&cid=moscou')
    expect(m.container.textContent).toContain('Hemisfério Norte')
  })
  it('Explorar: a comparação diz qual cidade tem a maior amplitude e a maior chuva', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&a=manaus&b=moscou')
    expect(texto()).toContain('Moscou é maior em 23,6 °C')
    expect(texto()).toContain('Manaus é maior em 1.610 mm')
  })
  it('Laboratório: as sugestões do texto dão o clima prometido', () => {
    noRouter(<Laboratorio />, '/?tela=lab&media=27&amp=2&total=2300')
    expect(texto()).toContain('Manaus')
    const p = noRouter(<Laboratorio />, '/?tela=lab&media=26&amp=4&total=600&conc=0.9')
    expect(p.container.textContent).toContain('Petrolina')
  })
  it('Laboratório: a cidade sintética mostra a tabela com 12 meses', () => {
    const { container } = noRouter(<Laboratorio />, '/?tela=lab')
    expect(container.querySelectorAll('tbody tr')).toHaveLength(12)
    expect(CIDADES).toHaveLength(10)
    expect(gerarSintetico({ media: 24, amp: 4, hem: 'S', total: 1500, conc: 0.7, chuvaNoVerao: true }).temp).toHaveLength(12)
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
