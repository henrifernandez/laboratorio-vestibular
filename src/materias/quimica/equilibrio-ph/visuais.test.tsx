import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { semSobreposicao } from '@/lib/rotulos'
import { EquilibrioDinamico, GraficoEquilibrio } from './EquilibrioDinamico'
import Laboratorio from './Laboratorio'
import { EscalaPh, cabeNaHorizontal, layoutHorizontal, layoutVertical, potenciaDez, type Marcador } from './Visuais'

const COTIDIANO: Marcador[] = [
  { ph: 2, rotulo: 'limão' },
  { ph: 3, rotulo: 'vinagre' },
  { ph: 5, rotulo: 'café' },
  { ph: 5.6, rotulo: 'chuva' },
  { ph: 7, rotulo: 'água pura' },
  { ph: 7.4, rotulo: 'sangue' },
  { ph: 8.3, rotulo: 'bicarbonato' },
  { ph: 10.5, rotulo: 'leite de magnésia' },
  { ph: 12, rotulo: 'água sanitária' },
]

describe('Escala de pH', () => {
  it('na vertical, os rótulos do cotidiano não se sobrepõem e seguem a ordem do pH', () => {
    const l = layoutVertical(COTIDIANO, 44, 21)
    expect(semSobreposicao(l.map((m) => m.y), l.map(() => 16), 1 - 1e-6)).toBe(true)
    for (let i = 1; i < l.length; i++) expect(l[i]!.y).toBeGreaterThan(l[i - 1]!.y)
    // nenhum rótulo se afasta muito do seu ponto na barra
    for (const m of l) expect(Math.abs(m.y - (44 + m.ph * 21))).toBeLessThan(24)
  })
  it('na horizontal, poucos rótulos cabem numa linha, sem sobreposição', () => {
    const poucos: Marcador[] = [
      { ph: 4.5, rotulo: 'chuva ácida' },
      { ph: 5.6, rotulo: 'chuva natural' },
      { ph: 7, rotulo: 'água pura' },
    ]
    expect(cabeNaHorizontal(poucos)).toBe(true)
    const l = layoutHorizontal(poucos)
    expect(semSobreposicao(l.map((m) => m.x), l.map((m) => m.largura), 8 - 1e-6)).toBe(true)
    expect(cabeNaHorizontal(COTIDIANO)).toBe(false)
  })
  it('escolhe a orientação pelo número de rótulos e mostra [H⁺] em potências de 10 na vertical', () => {
    const h = render(<EscalaPh marcadores={[{ ph: 7, rotulo: 'água pura' }]} />)
    expect(h.container.textContent).toContain('mais ácido')
    h.unmount()
    const v = render(<EscalaPh marcadores={COTIDIANO} destaque={7} />)
    expect(v.container.querySelector(`text[aria-label="${potenciaDez(7)}"]`)?.textContent).toBe('10−7')
    expect(v.container.textContent).toContain('leite de magnésia')
    expect(v.container.querySelector('svg')?.getAttribute('aria-label')).toContain('Marcado: pH 7')
    expect(potenciaDez(0)).toBe('10⁰')
    expect(potenciaDez(14)).toBe('10⁻¹⁴')
  })
})

describe('Equilíbrio dinâmico (visual)', () => {
  it('o gráfico descreve concentrações constantes e diferentes, e velocidades iguais no equilíbrio', () => {
    const { container } = render(<GraficoEquilibrio t={1} />)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('valores diferentes')
    expect(rotulo).toContain('as duas se encontram')
    expect(container.textContent).toContain('[A] reagente')
    expect(container.textContent).toContain('[B] produto')
  })
  it('a versão interativa troca o início e mostra o texto do equilíbrio no fim do tempo', () => {
    render(<EquilibrioDinamico />)
    expect(screen.getByText(/Ainda não há equilíbrio: a reação direta/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Só produto B'))
    expect(screen.getByText(/Ainda não há equilíbrio: a reação inversa/)).toBeInTheDocument()
    const campo = screen.getByLabelText('Tempo, valor numérico')
    fireEvent.change(campo, { target: { value: '3,5' } })
    fireEvent.blur(campo)
    expect(screen.getByText(/Equilíbrio: as duas velocidades são iguais/)).toBeInTheDocument()
    expect(screen.getByText('A: 9 · B: 21')).toBeInTheDocument()
  })
  it('o laboratório da escala usa a régua vertical com todos os exemplos', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/?tela=intro']}>
        <Laboratorio />
      </MemoryRouter>,
    )
    expect(container.textContent).toContain('leite de magnésia')
    expect(container.textContent).toContain('[H⁺]')
  })
})
