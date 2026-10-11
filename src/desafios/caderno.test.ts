import { linhaCaderno } from './caderno'

describe('linha do caderno de erros', () => {
  it('gera o formato exato pedido', () => {
    const linha = linhaCaderno({
      data: new Date(2026, 9, 12),
      materia: 'matematica',
      tema: 'Funções',
      titulo: 'Qual é a fórmula',
      nivel: 2,
      motivo: 'concavidade trocada',
      licao: 'a < 0 quando a parábola abre para baixo',
    })
    expect(linha).toBe(
      '| 2026-10-12 | Matemática / Funções | Qual é a fórmula (nível 2) | concavidade trocada | a < 0 quando a parábola abre para baixo | [ ] |',
    )
  })

  it('troca a barra vertical para não quebrar a tabela', () => {
    const linha = linhaCaderno({
      data: new Date(2026, 0, 5),
      materia: 'matematica',
      tema: 'Funções',
      titulo: 'Módulo |x|',
      nivel: 1,
      motivo: 'a | b',
      licao: 'x',
    })
    expect(linha).toContain('2026-01-05')
    expect(linha.match(/\|/g)).toHaveLength(7)
  })
})
