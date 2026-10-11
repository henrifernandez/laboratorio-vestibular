import { registrarTentativa, maisErrados, resumoPorTema, aplicar, desafiosResolvidos, type Progresso } from './progresso'

const vazio: Progresso = {}
const dia = (d: number) => new Date(2026, 9, d)

describe('progresso por desafio', () => {
  it('conta tentativas e acertos e guarda o último resultado', () => {
    let p = aplicar(vazio, 'a', true, dia(1))
    p = aplicar(p, 'a', false, dia(2))
    expect(p.a).toEqual({ tentativas: 2, acertos: 1, ultimo: false, data: '2026-10-02' })
  })

  it('não altera o objeto original', () => {
    aplicar(vazio, 'a', true, dia(1))
    expect(vazio).toEqual({})
  })

  it('maisErrados ordena por erros e ignora quem nunca errou', () => {
    let p: Progresso = {}
    p = aplicar(p, 'x', false, dia(1))
    p = aplicar(p, 'x', false, dia(1))
    p = aplicar(p, 'y', false, dia(1))
    p = aplicar(p, 'z', true, dia(1))
    expect(maisErrados(p).map((e) => e.id)).toEqual(['x', 'y'])
  })

  it('resumoPorTema soma acertos e tentativas pelo prefixo materia/tema/', () => {
    let p: Progresso = {}
    p = aplicar(p, 'matematica/funcoes/esboce:1', true, dia(1))
    p = aplicar(p, 'matematica/funcoes/formula:2', false, dia(1))
    p = aplicar(p, 'fisica/cinematica/x:1', true, dia(1))
    expect(resumoPorTema(p, 'matematica', 'funcoes')).toEqual({ tentativas: 2, acertos: 1 })
  })

  it('registrarTentativa persiste no localStorage', () => {
    localStorage.clear()
    registrarTentativa('k', true, dia(3))
    expect(JSON.parse(localStorage.getItem('lv:v1:progresso')!).k.acertos).toBe(1)
  })
})

describe('desafiosResolvidos', () => {
  it('conta ids distintos (desafio:nível) com ao menos um acerto no tema', () => {
    let p: Progresso = {}
    p = aplicar(p, 'matematica/funcoes/esboce:1', true, dia(1))
    p = aplicar(p, 'matematica/funcoes/esboce:1', true, dia(2)) // mesmo id: conta uma vez
    p = aplicar(p, 'matematica/funcoes/esboce:2', false, dia(2)) // errou: não conta
    p = aplicar(p, 'matematica/funcoes/formula:1', true, dia(3))
    p = aplicar(p, 'fisica/cinematica/x:1', true, dia(3)) // outro tema
    expect(desafiosResolvidos(p, 'matematica', 'funcoes')).toBe(2)
    expect(desafiosResolvidos(p, 'quimica', 'x')).toBe(0)
  })
})
