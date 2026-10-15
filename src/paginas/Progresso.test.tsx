import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MATERIAS } from '@/conteudo/materias'
import { salvarProgresso, type Progresso as TipoProgresso } from '@/desafios/progresso'
import { carregarTema } from '@/materias/registro'
import Progresso from './Progresso'

// espia o carregamento dos temas, para conferir que a página não o repete sem parar
vi.mock('@/materias/registro', async (original) => {
  const m = await original<typeof import('@/materias/registro')>()
  return { ...m, carregarTema: vi.fn(m.carregarTema) }
})

const r = (tentativas: number, acertos: number) => ({ tentativas, acertos, ultimo: acertos > 0, data: '2026-10-14' })
const abrir = () =>
  render(
    <MemoryRouter>
      <Progresso />
    </MemoryRouter>,
  )
const funcoes = MATERIAS.find((m) => m.id === 'matematica')?.temas.find((t) => t.id === 'funcoes')

describe('Meu progresso', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(carregarTema).mockClear()
  })

  it('sem respostas: mensagem de início, sem visão geral, e as matérias já listadas', () => {
    abrir()
    expect(screen.getByText(/Nada por aqui ainda/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Visão geral' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Por matéria' })).toBeInTheDocument()
    expect(screen.getByText(/Nenhum erro registrado/)).toBeInTheDocument()
    // nenhuma matéria vem aberta quando não há respostas
    expect(document.querySelectorAll('details[open]')).toHaveLength(0)
  })

  it('com respostas: visão geral, matéria aberta com o tema e a taxa, e o atalho para revisar os erros', () => {
    const p: TipoProgresso = { 'matematica/funcoes/grafico:1': r(4, 3), 'matematica/funcoes/grafico:2': r(1, 0) }
    salvarProgresso(p)
    abrir()
    const geral = screen.getByRole('heading', { name: 'Visão geral' }).closest('section') as HTMLElement
    expect(within(geral).getByText('Tentativas').nextElementSibling).toHaveTextContent('5')
    expect(within(geral).getByText('Acertos').nextElementSibling).toHaveTextContent('3')
    expect(within(geral).getByText('Taxa de acerto').nextElementSibling).toHaveTextContent('60%')
    expect(within(geral).getByText('Desafios resolvidos').nextElementSibling).toHaveTextContent(/^1 de \d+$/)

    const aberta = document.querySelector('details[open]') as HTMLElement
    expect(aberta).toHaveTextContent('Matemática')
    const linha = within(aberta).getByRole('link', { name: funcoes?.titulo as string }).closest('tr') as HTMLElement
    expect(within(linha).getAllByRole('cell').map((c) => c.textContent)).toEqual([`1 de ${funcoes?.totalNiveis}`, '3 de 5', '60%'])
    expect(within(aberta).getByRole('progressbar', { name: 'Progresso em Matemática' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Revisar só o que já errei' })).toHaveAttribute('href', '/revisao?erros=1')
    expect(screen.getAllByRole('link', { name: 'Praticar' }).length).toBeGreaterThan(0)
  })

  it('"Onde mais errei" lista no máximo 8 desafios, do que tem mais erros para o que tem menos', () => {
    const p: TipoProgresso = {}
    for (let i = 1; i <= 10; i++) p[`matematica/funcoes/d${i}:1`] = r(i, 0)
    salvarProgresso(p)
    abrir()
    const lista = screen.getByRole('heading', { name: 'Onde mais errei' }).closest('section') as HTMLElement
    const itens = within(lista).getAllByRole('listitem')
    expect(itens).toHaveLength(8)
    expect(itens[0]).toHaveTextContent('10 erros')
    expect(itens[7]).toHaveTextContent('3 erros')
  })

  it('carrega cada tema com progresso uma vez só (não entra em laço de renderização)', async () => {
    salvarProgresso({ 'matematica/funcoes/grafico:1': r(2, 0), 'quimica/organica/nome:1': r(1, 0) })
    abrir()
    await waitFor(() => expect(vi.mocked(carregarTema)).toHaveBeenCalled())
    await new Promise((fim) => setTimeout(fim, 400))
    expect(vi.mocked(carregarTema).mock.calls.length).toBeLessThanOrEqual(2)
  })
})
