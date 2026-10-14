import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { salvarProgresso } from '@/desafios/progresso'
import { carregarTema } from '@/materias/registro'
import Revisao from './Revisao'

const Url = () => <output data-testid="url">{useLocation().search}</output>
const abrir = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Revisao />
      <Url />
    </MemoryRouter>,
  )
const carregado = () => waitFor(() => expect(screen.queryByText('Carregando…')).not.toBeInTheDocument(), { timeout: 15000 })

describe('Revisão mista', () => {
  beforeEach(() => localStorage.clear())

  it('filtros: uma matéria por vez ("Todas" começa marcada) e o filtro dos erros', async () => {
    abrir('/revisao?materia=sociologia')
    await carregado()
    expect(screen.getByRole('button', { name: 'Sociologia' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Todas as matérias' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Só o que já errei' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Sortear outro desafio' })).toBeInTheDocument()
    // só as matérias com tema publicado aparecem como filtro
    expect(screen.getAllByRole('group', { name: 'Matéria' })[0]?.querySelectorAll('button').length).toBeGreaterThanOrEqual(8)
  })

  it('"Só o que já errei" sem nenhum erro avisa e não sorteia', async () => {
    abrir('/revisao?materia=sociologia&erros=1')
    await carregado()
    expect(screen.getByText(/Você ainda não errou nenhum desafio nesta matéria/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sortear outro desafio' })).not.toBeInTheDocument()
  })

  it('"Só o que já errei" com um erro registrado sorteia esse desafio', async () => {
    const mod = await carregarTema('sociologia', 'tres-lentes')
    const id = mod.default.desafios[0]?.desafio.id as string
    salvarProgresso({ [`${id}:2`]: { tentativas: 2, acertos: 1, ultimo: false, data: '2026-10-14' } })
    abrir('/revisao?materia=sociologia&erros=1')
    await carregado()
    expect(screen.queryByText(/ainda não errou/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sortear outro desafio' })).toBeInTheDocument()
    // o nível do desafio sorteado é o 2, o único com erro
    expect(screen.getByRole('radio', { name: /Médio/ })).toBeChecked()
  })

  it('escolher uma matéria ou o filtro muda a URL e descarta o desafio dirigido', async () => {
    abrir('/revisao?foco=x&nivel=1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sociologia' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Sociologia' }))
    expect(screen.getByTestId('url')).toHaveTextContent('?materia=sociologia')
    expect(screen.getByRole('button', { name: 'Sociologia' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Só o que já errei' }))
    expect(screen.getByTestId('url')).toHaveTextContent('?materia=sociologia&erros=1')
    fireEvent.click(screen.getByRole('button', { name: 'Todas as matérias' }))
    expect(screen.getByTestId('url')).toHaveTextContent('?erros=1')
    await carregado()
  })
})
