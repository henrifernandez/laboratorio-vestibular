import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ARESTAS, DEBATES, PASSOS_FILOSOFIA } from '@/conteudo/filosofia/pensadores'
import { DEFINICOES_FILOSOFIA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { LegendaLinha, LinhaDoTempoPensadores } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Linha do tempo', () => {
  it('tem uma barra para cada um dos 14 pensadores, e o texto alternativo lista todos com o período', () => {
    const { container } = render(<LinhaDoTempoPensadores />)
    expect(container.querySelectorAll('rect[rx="3"]')).toHaveLength(14)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('Sócrates, c. 470–399 a.C.')
    expect(rotulo).toContain('Hannah Arendt, 1906–1975')
    expect(container.textContent).toContain('Antiguidade')
    expect(container.textContent).toContain('Moderna e contemporânea')
  })
  it('o pensador selecionado fica com contorno forte e as relações dele aparecem com letras', () => {
    const { container } = render(<LinhaDoTempoPensadores selecionado="kant" />)
    expect(container.querySelectorAll('rect[stroke-width="3"]')).toHaveLength(1)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('Em destaque: Immanuel Kant')
    expect(rotulo).toContain('Hume e Immanuel Kant (diálogo)')
    // Kant tem três relações de entrada e uma de saída (Arendt): quatro barras ligadas
    const ligadas = container.querySelectorAll('rect[stroke-width="2"]')
    expect(ligadas).toHaveLength(ARESTAS.filter((a) => a.de === 'kant' || a.para === 'kant').length)
  })
  it('tocar em um nome seleciona o pensador', () => {
    const escolhidos: string[] = []
    const { container } = render(<LinhaDoTempoPensadores onSelecionar={(id) => escolhidos.push(id)} />)
    const grupos = container.querySelectorAll('g[style]')
    fireEvent.click(grupos[0] as Element)
    expect(escolhidos).toEqual(['socrates'])
  })
  it('a legenda explica cores e letras', () => {
    const { container } = render(<LegendaLinha />)
    expect(container.textContent).toContain('M mestre e discípulo, C crítica, H herança, D diálogo, X contraste')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 10 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_FILOSOFIA).toHaveLength(10)
    for (const def of DEFINICOES_FILOSOFIA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, com a linha do tempo na primeira e os cartões nas demais', () => {
    noRouter(<Entenda />)
    const n = PASSOS_FILOSOFIA.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i === 1) expect(screen.getByRole('img', { name: /Linha do tempo com os 14 pensadores/ })).toBeInTheDocument()
      if (i === 2) expect(screen.getByLabelText('Cartão de Platão')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(3)
    expect(container.textContent).toContain('Stanford Encyclopedia')
  })
})

describe('Laboratório', () => {
  it('Introdução: cartão do pensador escolhido, com obras e aviso de paráfrase', () => {
    noRouter(<Laboratorio />, '/?tela=intro&a=hobbes')
    expect(screen.getByLabelText('Cartão de Thomas Hobbes')).toBeInTheDocument()
    expect(texto()).toContain('Leviatã')
    expect(texto()).toContain('Época: Idade Moderna')
    expect(texto()).toContain('Nenhuma frase entre aspas é citação literal')
  })
  it('Explorar: relações do pensador em destaque, com explicação e letra', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&a=kant')
    const lista = screen.getByRole('list', { name: 'Relações de Immanuel Kant' })
    expect(lista.querySelectorAll('li')).toHaveLength(ARESTAS.filter((a) => a.de === 'kant' || a.para === 'kant').length)
    expect(lista.textContent).toContain('David Hume → Immanuel Kant')
    expect(lista.textContent).toContain('diálogo')
  })
  it('Explorar: pensador sem relação direta mostra aviso (não há nenhum, mas o texto existe para o caso)', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&a=socrates')
    expect(screen.getByRole('list', { name: 'Relações de Sócrates' }).textContent).toContain('Sócrates → Platão')
  })
  it('Laboratório: debate com as posições de cada pensador', () => {
    noRouter(<Laboratorio />, '/?tela=lab&d=conhecimento')
    const debate = DEBATES.find((d) => d.id === 'conhecimento')!
    expect(texto()).toContain(debate.pergunta)
    expect(screen.getByRole('list', { name: 'Posições dos pensadores' }).querySelectorAll('li')).toHaveLength(debate.posicoes.length)
    expect(texto()).toContain('René Descartes')
    expect(texto()).toContain('Immanuel Kant')
  })
  it('Explorar: correntes mostram ideia, teses e pensadores, com o aviso de quem se liga também', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=correntes&c=contratualismo')
    expect(texto()).toContain('O poder político e a sociedade se justificam por um pacto')
    const lista = screen.getByRole('list', { name: 'Pensadores de Contratualismo' })
    expect(lista.querySelectorAll('li')).toHaveLength(3)
    expect(lista.textContent).toContain('Thomas Hobbes')
    expect(lista.textContent).toContain('a principal é Empirismo')
    expect(screen.getByRole('list', { name: 'Correntes e pensadores' }).querySelectorAll('li').length).toBeGreaterThanOrEqual(13)
  })
  it('Entenda: a etapa das correntes mostra o quadro com todas as correntes', () => {
    noRouter(<Entenda />)
    const n = PASSOS_FILOSOFIA.length
    const i = PASSOS_FILOSOFIA.findIndex((p) => p.visual === 'correntes')
    expect(i).toBeGreaterThan(0)
    for (let k = 0; k < i; k++) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    expect(screen.getByText(`Etapa ${i + 1} de ${n}`)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Correntes e pensadores' })).toBeInTheDocument()
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
