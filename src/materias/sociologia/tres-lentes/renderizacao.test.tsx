import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AUTORES_SOCIOLOGIA, PASSOS_SOCIOLOGIA, SITUACOES } from '@/conteudo/sociologia/tresLentes'
import { CartaoAutor, TabelaComparar } from '../../humanas/comum/Visuais'
import { DEFINICOES_SOCIOLOGIA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string
const marx = AUTORES_SOCIOLOGIA.find((a) => a.id === 'marx')!
const weber = AUTORES_SOCIOLOGIA.find((a) => a.id === 'weber')!

describe('Cartão do autor', () => {
  it('completo: ideia, conceitos, obras com ano, cuidados e fontes', () => {
    const { container } = render(<CartaoAutor autor={marx} />)
    expect(container.textContent).toContain('Karl Marx')
    expect(container.textContent).toContain('1818–1883')
    expect(container.textContent).toContain('mais-valia')
    expect(container.textContent).toContain('O capital')
    expect(container.textContent).toContain('1867')
    expect(container.textContent).toContain('Cuidado com a pegadinha')
    expect(container.textContent).toContain('Fontes')
    expect(container.querySelector('article')?.getAttribute('aria-label')).toBe('Cartão de Karl Marx')
  })
  it('compacto: sem ideia longa e sem fontes', () => {
    const { container } = render(<CartaoAutor autor={marx} compacto />)
    expect(container.textContent).toContain(marx.resumo)
    expect(container.textContent).not.toContain('Fontes')
    expect(container.querySelectorAll('dt')).toHaveLength(2)
  })
  it('a tabela compara dois autores', () => {
    const { container } = render(<TabelaComparar a={marx} b={weber} />)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5)
    expect(container.textContent).toContain('sociologia compreensiva')
    expect(container.textContent).toContain('materialismo histórico')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 5 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_SOCIOLOGIA).toHaveLength(5)
    for (const def of DEFINICOES_SOCIOLOGIA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 8; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('depois de responder, o cartão do autor aparece', () => {
    const def = DEFINICOES_SOCIOLOGIA.find((d) => d.desafio.id === 'sociologia/tres-lentes/quem')!
    const inst = def.desafio.gerar(2, 1)
    const antes = render(<def.Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(antes.container.querySelector('article')).toBeNull()
    antes.unmount()
    const depois = render(<def.Entrada inst={inst} resposta={inst.certa} onChange={() => {}} correcao={{ correto: true, parcial: 1, feedback: 'ok' }} bloqueado />)
    expect(depois.container.querySelector('article')).not.toBeNull()
  })
})

describe('Abas do tema', () => {
  it('Entenda: as etapas renderizam, cada uma com “pare e pense”, e os cartões dos autores aparecem', () => {
    noRouter(<Entenda />)
    const n = PASSOS_SOCIOLOGIA.length
    for (let i = 1; i <= n; i++) {
      expect(screen.getByText(`Etapa ${i} de ${n}`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i === 2) expect(screen.getByLabelText('Cartão de Émile Durkheim')).toBeInTheDocument()
      if (i < n) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(3)
    expect(container.textContent).toContain('Quintaneiro')
  })
})

describe('Laboratório', () => {
  it('Introdução: cartão do autor escolhido, com aviso sobre paráfrases', () => {
    noRouter(<Laboratorio />, '/?tela=intro&a=bourdieu')
    expect(screen.getByLabelText('Cartão de Pierre Bourdieu')).toBeInTheDocument()
    expect(texto()).toContain('capital cultural')
    expect(texto()).toContain('Nenhuma frase entre aspas é citação literal')
  })
  it('Explorar: a situação mostra a leitura de cada autor e o aviso de que é ilustrativa', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&s=vestibular')
    const s = SITUACOES.find((x) => x.id === 'vestibular')!
    expect(texto()).toContain(s.descricao)
    expect(screen.getByRole('list', { name: 'Leituras de cada autor' }).querySelectorAll('li')).toHaveLength(s.leituras.length)
    expect(texto()).toContain('As leituras abaixo são ilustrativas')
    expect(texto()).toContain('Conceitos do autor')
  })
  it('Explorar: dá para esconder os conceitos', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&s=automacao&conceitos=0')
    expect(texto()).not.toContain('Conceitos do autor')
  })
  it('Laboratório: compara Durkheim e Marx', () => {
    noRouter(<Laboratorio />, '/?tela=lab&a=durkheim&b=marx')
    expect(texto()).toContain('Émile Durkheim e Karl Marx')
    expect(texto()).toContain('sociologia positivista e funcionalista')
    expect(texto()).toContain('materialismo histórico')
  })
  it('Jogo: a tela do jogo carrega', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
