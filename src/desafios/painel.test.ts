import type { MateriaInfo } from '@/conteudo/materias'
import { jaErrou, resumirPainel, taxaDeAcerto } from './painel'
import type { Progresso } from './progresso'

const tema = (id: string, disponivel: boolean, totalNiveis?: number) => ({ id, titulo: id, descricao: '', disponivel, totalNiveis })
const MATERIAS: MateriaInfo[] = [
  { id: 'matematica', nome: 'Matemática', descricao: '', temas: [tema('funcoes', true, 9), tema('juros', true, 6), tema('em-breve', false)] },
  { id: 'fisica', nome: 'Física', descricao: '', temas: [tema('cinematica', false)] },
  { id: 'quimica', nome: 'Química', descricao: '', temas: [tema('organica', true, 3)] },
]
const r = (tentativas: number, acertos: number) => ({ tentativas, acertos, ultimo: acertos > 0, data: '2026-10-14' })

describe('Painel de progresso', () => {
  it('sem nada respondido: totais zerados, taxa nula, e só temas publicados', () => {
    const p = resumirPainel({}, MATERIAS)
    expect(p.materias.map((m) => m.materia.id)).toEqual(['matematica', 'quimica']) // Física não tem tema publicado
    expect(p.materias[0]?.temas.map((t) => t.tema.id)).toEqual(['funcoes', 'juros'])
    expect(p).toMatchObject({ feitos: 0, total: 18, tentativas: 0, acertos: 0, taxa: null })
  })
  it('soma tentativas e acertos por tema, matéria e geral; a taxa é arredondada', () => {
    const prog: Progresso = {
      'matematica/funcoes/grafico:1': r(3, 2),
      'matematica/funcoes/grafico:2': r(1, 0),
      'matematica/juros/simples:1': r(2, 2),
      'quimica/organica/nome:1': r(1, 1),
    }
    const p = resumirPainel(prog, MATERIAS)
    const mat = p.materias[0]
    expect(mat?.temas[0]).toMatchObject({ tentativas: 4, acertos: 2, feitos: 1, total: 9 })
    expect(mat?.temas[1]).toMatchObject({ tentativas: 2, acertos: 2, feitos: 1, total: 6 })
    expect(mat).toMatchObject({ tentativas: 6, acertos: 4, feitos: 2, total: 15 })
    expect(p).toMatchObject({ tentativas: 7, acertos: 5, feitos: 3, total: 18, taxa: 71 })
  })
  it('desafios resolvidos de um tema nunca passam do total do tema (ex.: tema que perdeu um desafio)', () => {
    const prog: Progresso = {}
    for (let i = 0; i < 6; i++) prog[`quimica/organica/d${i}:1`] = r(1, 1)
    expect(resumirPainel(prog, MATERIAS).materias[1]?.feitos).toBe(3)
  })
  it('taxa de acerto: arredonda e é nula sem tentativas', () => {
    expect(taxaDeAcerto(0, 0)).toBeNull()
    expect(taxaDeAcerto(1, 3)).toBe(33)
    expect(taxaDeAcerto(2, 3)).toBe(67)
    expect(taxaDeAcerto(5, 5)).toBe(100)
  })
  it('já errou: só se houver mais tentativas do que acertos', () => {
    const prog: Progresso = { a: r(2, 1), b: r(2, 2), c: r(1, 0) }
    expect(jaErrou(prog, 'a')).toBe(true)
    expect(jaErrou(prog, 'b')).toBe(false)
    expect(jaErrou(prog, 'c')).toBe(true)
    expect(jaErrou(prog, 'nunca-respondido')).toBe(false)
  })
})
