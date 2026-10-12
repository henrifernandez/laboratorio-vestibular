import { AUTORES_SOCIOLOGIA, CATEGORIAS, EXEMPLOS, PASSOS_SOCIOLOGIA, RESUMO_SOCIOLOGIA, SITUACOES } from '@/conteudo/sociologia/tresLentes'
import { verificarAutores } from '../../humanas/comum/verificarAutores'

describe('Autores da Sociologia', () => {
  it('cumprem as regras editoriais: campos completos, fontes e nenhuma citação entre aspas', () => {
    verificarAutores(AUTORES_SOCIOLOGIA, 6)
  })
  it('incluem as três lentes clássicas e os três autores mais recentes pedidos', () => {
    const ids = AUTORES_SOCIOLOGIA.map((a) => a.id)
    for (const id of ['durkheim', 'weber', 'marx', 'adorno-horkheimer', 'bourdieu', 'bauman']) expect(ids).toContain(id)
  })
  it('os conceitos-chave de cada clássico estão presentes', () => {
    const termos = (id: string) => AUTORES_SOCIOLOGIA.find((a) => a.id === id)!.conceitos.map((c) => c.termo)
    expect(termos('durkheim')).toEqual(expect.arrayContaining(['fato social', 'anomia', 'solidariedade mecânica', 'solidariedade orgânica']))
    expect(termos('weber')).toEqual(expect.arrayContaining(['ação social', 'tipo ideal', 'dominação carismática', 'dominação racional-legal']))
    expect(termos('marx')).toEqual(expect.arrayContaining(['luta de classes', 'mais-valia', 'alienação', 'ideologia']))
  })
  it('datas e obras principais conferem com as referências', () => {
    const por = (id: string) => AUTORES_SOCIOLOGIA.find((a) => a.id === id)!
    expect([por('durkheim').nascimento, por('durkheim').morte]).toEqual([1858, 1917])
    expect([por('weber').nascimento, por('weber').morte]).toEqual([1864, 1920])
    expect([por('marx').nascimento, por('marx').morte]).toEqual([1818, 1883])
    expect([por('bourdieu').nascimento, por('bourdieu').morte]).toEqual([1930, 2002])
    expect([por('bauman').nascimento, por('bauman').morte]).toEqual([1925, 2017])
    const anoDe = (id: string, titulo: string) => por(id).obras.find((o) => o.titulo === titulo)?.ano
    expect(anoDe('durkheim', 'O suicídio')).toBe('1897')
    expect(anoDe('durkheim', 'As regras do método sociológico')).toBe('1895')
    expect(anoDe('marx', 'O capital')).toContain('1867')
    expect(anoDe('adorno-horkheimer', 'Dialética do esclarecimento')).toBe('1947')
    expect(anoDe('bauman', 'Modernidade líquida')).toBe('2000')
  })
})

describe('Situações (lentes diferentes)', () => {
  it('ids únicos; cada situação tem pelo menos quatro leituras, de autores existentes e diferentes', () => {
    expect(new Set(SITUACOES.map((s) => s.id)).size).toBe(SITUACOES.length)
    expect(SITUACOES.length).toBeGreaterThanOrEqual(6)
    for (const s of SITUACOES) {
      expect(s.leituras.length, s.id).toBeGreaterThanOrEqual(4)
      const autores = s.leituras.map((l) => l.autor)
      expect(new Set(autores).size, s.id).toBe(autores.length)
      for (const id of autores) expect(AUTORES_SOCIOLOGIA.some((a) => a.id === id), `${s.id}: ${id}`).toBe(true)
    }
  })
  it('cada leitura usa palavras do vocabulário do autor, e os textos não se repetem', () => {
    const textos = SITUACOES.flatMap((s) => s.leituras.map((l) => l.texto))
    expect(new Set(textos).size).toBe(textos.length)
    for (const s of SITUACOES)
      for (const l of s.leituras) {
        const autor = AUTORES_SOCIOLOGIA.find((a) => a.id === l.autor)!
        const fichas = autor.conceitos.flatMap((c) => c.termo.toLowerCase().split(/\s+/)).filter((p) => p.length >= 6)
        expect(fichas.some((p) => l.texto.toLowerCase().includes(p)), `${s.id}/${l.autor}`).toBe(true)
        expect(/["“”«»]/.test(l.texto), `${s.id}/${l.autor}: aspas`).toBe(false)
      }
  })
  it('as situações clássicas têm as três lentes clássicas', () => {
    for (const id of ['automacao', 'greve-aplicativo']) {
      const s = SITUACOES.find((x) => x.id === id)!
      expect(s.leituras.map((l) => l.autor)).toEqual(expect.arrayContaining(['durkheim', 'weber', 'marx']))
    }
  })
})

describe('Exemplos para classificar', () => {
  it('categorias com ids únicos e grupos do tamanho esperado', () => {
    expect(new Set(CATEGORIAS.map((c) => c.id)).size).toBe(CATEGORIAS.length)
    const tam = (g: string) => CATEGORIAS.filter((c) => c.grupo === g).length
    expect(tam('weber-acao')).toBe(4)
    expect(tam('weber-dominacao')).toBe(3)
    expect(tam('durkheim')).toBe(2)
    expect(tam('marx')).toBe(3)
    expect(tam('marx-classes')).toBe(2)
  })
  it('cada exemplo aponta para uma categoria existente; cada categoria tem pelo menos dois exemplos; os textos não repetem o nome da categoria', () => {
    expect(new Set(EXEMPLOS.map((e) => e.texto)).size).toBe(EXEMPLOS.length)
    for (const c of CATEGORIAS) expect(EXEMPLOS.filter((e) => e.categoria === c.id).length, c.id).toBeGreaterThanOrEqual(2)
    for (const e of EXEMPLOS) {
      const c = CATEGORIAS.find((x) => x.id === e.categoria)
      expect(c, e.texto).toBeDefined()
      expect(e.texto.toLowerCase().includes(c!.nome.toLowerCase()), `entrega a resposta: ${e.texto}`).toBe(false)
      expect(e.razao.length).toBeGreaterThan(20)
    }
  })
})

describe('Passos e resumo', () => {
  it('cada passo tem texto e uma pergunta com a opção certa dentro do intervalo; autores citados existem', () => {
    expect(PASSOS_SOCIOLOGIA.length).toBeGreaterThanOrEqual(5)
    for (const p of PASSOS_SOCIOLOGIA) {
      expect(p.texto.length, p.titulo).toBeGreaterThanOrEqual(2)
      expect(p.pare, p.titulo).toBeDefined()
      expect(p.pare!.certa).toBeGreaterThanOrEqual(0)
      expect(p.pare!.certa).toBeLessThan(p.pare!.opcoes.length)
      for (const id of p.autores ?? []) expect(AUTORES_SOCIOLOGIA.some((a) => a.id === id)).toBe(true)
    }
  })
  it('o resumo cita fontes em todas as seções', () => {
    for (const s of RESUMO_SOCIOLOGIA) expect((s.fontes ?? []).length, s.titulo).toBeGreaterThanOrEqual(2)
  })
})
