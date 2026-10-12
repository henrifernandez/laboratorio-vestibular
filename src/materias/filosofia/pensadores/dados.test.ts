import { ARESTAS, BANCO_DEBATES, DEBATES, PASSOS_FILOSOFIA, PENSADORES, RESUMO_FILOSOFIA } from '@/conteudo/filosofia/pensadores'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { verificarAutores } from '../../humanas/comum/verificarAutores'
import { posicaoDoAno } from './Visuais'

const ASPAS = /["“”«»]/

describe('Pensadores', () => {
  it('cumprem as regras editoriais: campos completos, fontes e nenhuma citação entre aspas', () => {
    verificarAutores(PENSADORES, 14)
  })
  it('incluem os 14 pensadores pedidos', () => {
    const ids = PENSADORES.map((p) => p.id)
    for (const id of ['socrates', 'platao', 'aristoteles', 'maquiavel', 'descartes', 'hobbes', 'locke', 'rousseau', 'hume', 'kant', 'marx', 'nietzsche', 'sartre', 'arendt']) expect(ids).toContain(id)
    expect(PENSADORES).toHaveLength(14)
  })
  it('datas de nascimento e morte conferem com as referências', () => {
    const esperado: Record<string, [number, number]> = {
      socrates: [-470, -399],
      platao: [-428, -348],
      aristoteles: [-384, -322],
      maquiavel: [1469, 1527],
      descartes: [1596, 1650],
      hobbes: [1588, 1679],
      locke: [1632, 1704],
      rousseau: [1712, 1778],
      hume: [1711, 1776],
      kant: [1724, 1804],
      marx: [1818, 1883],
      nietzsche: [1844, 1900],
      sartre: [1905, 1980],
      arendt: [1906, 1975],
    }
    for (const p of PENSADORES) expect([p.nascimento, p.morte], p.id).toEqual(esperado[p.id])
  })
  it('a época de cada pensador bate com as datas', () => {
    for (const p of PENSADORES) {
      const esperada = p.nascimento < 0 ? 'Antiguidade' : p.nascimento < 1800 ? 'Idade Moderna' : 'Contemporânea'
      expect(p.epoca, p.id).toBe(esperada)
    }
    expect(PENSADORES.filter((p) => p.epoca === 'Antiguidade')).toHaveLength(3)
    expect(PENSADORES.filter((p) => p.epoca === 'Contemporânea')).toHaveLength(4)
  })
  it('só Sócrates não tem obra escrita; os anos de publicação conferem com os conhecidos', () => {
    for (const p of PENSADORES) expect(p.obras.length === 0, p.id).toBe(p.id === 'socrates')
    const ano = (id: string, titulo: string) => PENSADORES.find((p) => p.id === id)!.obras.find((o) => o.titulo === titulo)?.ano
    expect(ano('descartes', 'Discurso do método')).toBe('1637')
    expect(ano('hobbes', 'Leviatã')).toBe('1651')
    expect(ano('rousseau', 'Do contrato social')).toBe('1762')
    expect(ano('kant', 'Crítica da razão pura')).toBe('1781')
    expect(ano('nietzsche', 'Genealogia da moral')).toBe('1887')
    expect(ano('sartre', 'O ser e o nada')).toBe('1943')
    expect(ano('arendt', 'A condição humana')).toBe('1958')
  })
})

describe('Mapa de influências', () => {
  it('relações entre pensadores existentes, sem repetição, com explicação em palavras próprias', () => {
    const ids = new Set(PENSADORES.map((p) => p.id))
    const pares = ARESTAS.map((a) => `${a.de}>${a.para}`)
    expect(new Set(pares).size).toBe(pares.length)
    for (const a of ARESTAS) {
      expect(ids.has(a.de) && ids.has(a.para), `${a.de}>${a.para}`).toBe(true)
      expect(a.de).not.toBe(a.para)
      expect(a.explicacao.length, `${a.de}>${a.para}`).toBeGreaterThan(50)
      expect(ASPAS.test(a.explicacao), `${a.de}>${a.para}: aspas`).toBe(false)
    }
  })
  it('a influência vai de quem nasceu antes para quem nasceu depois (exceto contrastes)', () => {
    const nasc = (id: string) => PENSADORES.find((p) => p.id === id)!.nascimento
    for (const a of ARESTAS) if (a.tipo !== 'contraste') expect(nasc(a.de), `${a.de}>${a.para}`).toBeLessThan(nasc(a.para))
  })
  it('todo pensador aparece em pelo menos uma relação', () => {
    const citados = new Set(ARESTAS.flatMap((a) => [a.de, a.para]))
    for (const p of PENSADORES) expect(citados.has(p.id), p.id).toBe(true)
  })
  it('mestre e discípulo só na Antiguidade; discípulos vêm depois dos mestres', () => {
    for (const a of ARESTAS.filter((x) => x.tipo === 'mestre e discípulo')) {
      expect(PENSADORES.find((p) => p.id === a.de)!.epoca).toBe('Antiguidade')
      expect(PENSADORES.find((p) => p.id === a.para)!.epoca).toBe('Antiguidade')
    }
  })
  it('a escala da linha do tempo cresce com o ano em cada trecho e cabe no desenho', () => {
    expect(posicaoDoAno(-470)).toBeLessThan(posicaoDoAno(-322))
    expect(posicaoDoAno(1469)).toBeLessThan(posicaoDoAno(1980))
    expect(posicaoDoAno(-322)).toBeLessThan(posicaoDoAno(1469))
    for (const p of PENSADORES)
      for (const ano of [p.nascimento, p.morte]) {
        expect(posicaoDoAno(ano), `${p.id} ${ano}`).toBeGreaterThan(150)
        expect(posicaoDoAno(ano), `${p.id} ${ano}`).toBeLessThan(640)
      }
  })
})

describe('Debates, passos e resumo', () => {
  it('cada debate tem pelo menos três posições de pensadores existentes, em palavras próprias', () => {
    expect(new Set(DEBATES.map((d) => d.id)).size).toBe(DEBATES.length)
    for (const d of DEBATES) {
      expect(d.posicoes.length, d.id).toBeGreaterThanOrEqual(3)
      for (const p of d.posicoes) {
        expect(PENSADORES.some((x) => x.id === p.autor), `${d.id}/${p.autor}`).toBe(true)
        expect(p.resposta.length).toBeGreaterThan(60)
        expect(ASPAS.test(p.resposta)).toBe(false)
      }
      expect(new Set(d.posicoes.map((p) => p.autor)).size).toBe(d.posicoes.length)
    }
  })
  it('o banco de perguntas dos debates está bem formado, sem aspas', () => {
    expect(BANCO_DEBATES.length).toBeGreaterThanOrEqual(6)
    for (const it of BANCO_DEBATES) {
      expect(itemValido(it), it.pergunta).toBe(true)
      expect(ASPAS.test(it.certa.texto + it.certa.porque), it.pergunta).toBe(false)
    }
  })
  it('passos com pergunta válida e autores existentes; resumo com fontes', () => {
    expect(PASSOS_FILOSOFIA.length).toBeGreaterThanOrEqual(6)
    for (const p of PASSOS_FILOSOFIA) {
      expect(p.pare, p.titulo).toBeDefined()
      expect(p.pare!.certa).toBeLessThan(p.pare!.opcoes.length)
      for (const id of p.autores ?? []) expect(PENSADORES.some((x) => x.id === id)).toBe(true)
    }
    for (const s of RESUMO_FILOSOFIA) expect((s.fontes ?? []).length, s.titulo).toBeGreaterThanOrEqual(2)
  })
})
