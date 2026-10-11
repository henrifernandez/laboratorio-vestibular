import { construirArvore, folhasFormadas, nosVisiveis } from './arvore'

const niveis = [
  { nome: 'Pão', opcoes: ['francês', 'integral'] },
  { nome: 'Recheio', opcoes: ['queijo', 'presunto', 'frango'] },
]

describe('árvore de possibilidades', () => {
  it('o número de folhas é o produto das opções (princípio multiplicativo)', () => {
    const a = construirArvore(niveis)
    expect(a.folhas).toBe(6)
    expect(construirArvore([...niveis, { nome: 'Molho', opcoes: ['A', 'B'] }]).folhas).toBe(12)
  })

  it('a raiz tem um filho por opção do 1º nível', () => {
    const a = construirArvore(niveis)
    const raiz = a.nos.find((n) => n.pai === null)!
    expect(raiz.filhos).toHaveLength(2)
    expect(a.nos).toHaveLength(1 + 2 + 6)
  })

  it('as folhas ocupam linhas distintas e consecutivas, de cima para baixo', () => {
    const a = construirArvore(niveis)
    const ys = a.nos.filter((n) => n.nivel === niveis.length).map((n) => n.y)
    expect(ys).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('um nó pai fica no meio dos filhos', () => {
    const a = construirArvore(niveis)
    const raiz = a.nos.find((n) => n.pai === null)!
    const [f1, f2] = raiz.filhos.map((id) => a.nos.find((n) => n.id === id)!)
    expect(f1!.y).toBe(1)
    expect(f2!.y).toBe(4)
    expect(raiz.y).toBe(2.5)
  })

  it('só aparecem os nós cujos ancestrais foram expandidos', () => {
    const a = construirArvore(niveis)
    const raiz = a.nos.find((n) => n.pai === null)!
    expect(nosVisiveis(a.nos, new Set()).map((n) => n.id)).toEqual([raiz.id])
    const comRaiz = nosVisiveis(a.nos, new Set([raiz.id]))
    expect(comRaiz).toHaveLength(3)
    const primeiro = a.nos.find((n) => n.id === raiz.filhos[0])!
    expect(nosVisiveis(a.nos, new Set([raiz.id, primeiro.id]))).toHaveLength(6)
  })

  it('conta as possibilidades completas já formadas', () => {
    const a = construirArvore(niveis)
    const raiz = a.nos.find((n) => n.pai === null)!
    const primeiro = a.nos.find((n) => n.id === raiz.filhos[0])!
    expect(folhasFormadas(a.nos, new Set([raiz.id]))).toBe(0)
    expect(folhasFormadas(a.nos, new Set([raiz.id, primeiro.id]))).toBe(3)
    const todos = new Set(a.nos.map((n) => n.id))
    expect(folhasFormadas(a.nos, todos)).toBe(6)
  })
})
