import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BLOCOS, PASSOS_GEOPOLITICA, PONTOS } from '@/conteudo/geografia/geopolitica'
import { DEFINICOES_GEOPOLITICA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { EscadaIntegracao, ListaMembros, ListaPontos, MapaPontos } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('a escada tem quatro linhas, cada uma com o que o estágio exige, e destaca o estágio escolhido', () => {
    const { container } = render(<EscadaIntegracao destaque="mercado-comum" />)
    const linhas = [...container.querySelectorAll('tbody tr')]
    expect(linhas).toHaveLength(4)
    // sim/não por coluna: 1, 2, 3 e 4 características
    expect(linhas.map((l) => l.querySelectorAll('[aria-label="sim"]').length)).toEqual([1, 2, 3, 4])
    expect(linhas.map((l) => l.querySelectorAll('[aria-label="não"]').length)).toEqual([3, 2, 1, 0])
    expect((linhas[2] as HTMLElement).style.outline).toContain('solid')
  })
  it('a lista de membros cita todos os países do bloco', () => {
    const ue = BLOCOS.find((b) => b.id === 'ue')!
    const { container } = render(<ListaMembros bloco={ue} />)
    expect(container.textContent).toContain('Portugal')
    expect(container.textContent).toContain('membros atuais (27)')
  })
  it('o mapa de pontos descreve todos (ou só um, sem número) e a lista tem um botão por ponto', async () => {
    const todos = render(<MapaPontos />)
    expect(todos.container.querySelector('svg, [role="status"]')).not.toBeNull()
    const lista = render(<ListaPontos destaque="suez" onEscolher={() => {}} />)
    expect(lista.container.querySelectorAll('button')).toHaveLength(PONTOS.length)
    expect(lista.container.querySelector('button[aria-pressed="true"]')?.textContent).toContain('Canal de Suez')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_GEOPOLITICA).toHaveLength(5)
    for (const def of DEFINICOES_GEOPOLITICA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('a pergunta “qual bloco” não mostra o mapa antes da resposta (ele revelaria a resposta)', () => {
    const def = DEFINICOES_GEOPOLITICA.find((d) => d.desafio.id === 'geografia/geopolitica/blocos')!
    const inst = def.desafio.gerar(5, 1)
    const antes = render(<def.Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(antes.container.querySelector('svg[role="img"], [role="status"]')).toBeNull()
    const depois = render(<def.Entrada inst={inst} resposta={inst.certa} onChange={() => {}} correcao={def.desafio.corrigir(inst, inst.certa)} bloqueado />)
    expect(depois.container.querySelector('svg[role="img"], [role="status"]')).not.toBeNull()
  })
  it('no nível difícil de canais e estreitos o ponto aparece no mapa, sem o nome no texto alternativo antes da resposta', () => {
    const def = DEFINICOES_GEOPOLITICA.find((d) => d.desafio.id === 'geografia/geopolitica/pontos')!
    const inst = def.desafio.gerar(3, 3)
    const { container } = render(<def.Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    const mapa = container.querySelector('svg[role="img"], [role="status"]')
    expect(mapa).not.toBeNull()
    const nome = PONTOS.find((p) => p.id === inst.dados.pontoId)!.nome
    expect(container.querySelector('[aria-label]')?.getAttribute('aria-label') ?? '').not.toContain(nome)
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    const n = PASSOS_GEOPOLITICA.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3)
    expect(container.textContent).toContain('Vesentini')
  })
})

describe('Laboratório', () => {
  it('Introdução: o bloco escolhido mostra criação, estágio e a lista de países', () => {
    noRouter(<Laboratorio />, '/?tela=intro&b=ue')
    expect(texto()).toContain('União Europeia (UE)')
    expect(texto()).toContain('União econômica e monetária')
    expect(texto()).toContain('Portugal')
    expect(texto()).toContain('27')
    noRouter(<Laboratorio />, '/?tela=intro&b=usmca')
    expect(texto()).toContain('Zona de livre-comércio')
  })
  it('Explorar: a escolha das características leva ao estágio; a moeda única sozinha não conta', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&tz=1&te=1&fa=0&mo=0')
    expect(texto()).toContain('2. União aduaneira')
    const x = noRouter(<Laboratorio />, '/?tela=explorar&tz=0&te=0&fa=0&mo=1')
    expect(x.container.textContent).toContain('Ainda não é um bloco de integração')
    expect(x.container.textContent).toContain('Sem efeito por enquanto')
    const y = noRouter(<Laboratorio />, '/?tela=explorar&tz=1&te=1&fa=1&mo=1')
    expect(y.container.textContent).toContain('4. União econômica e monetária')
  })
  it('Laboratório: o ponto escolhido mostra os dois mares, os países e a importância', () => {
    noRouter(<Laboratorio />, '/?tela=lab&p=ormuz')
    expect(texto()).toContain('Estreito de Ormuz')
    expect(texto()).toContain('Golfo Pérsico')
    expect(texto()).toContain('Golfo de Omã')
    expect(texto()).toContain('Irã e Omã')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
