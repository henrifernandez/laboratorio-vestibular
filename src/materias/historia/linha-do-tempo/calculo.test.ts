import { ANO_MAX, ANO_MIN, ERAS, EVENTOS, evento } from '@/conteudo/historia/linhaDoTempo'
import {
  EXTENSAO_MAX,
  EXTENSAO_MIN,
  VISTA_TOTAL,
  anoDaPosicao,
  deslocar,
  distanciaAnos,
  emCurso,
  eraDoAno,
  limitarVista,
  marcasDoEixo,
  passoDoEixo,
  posicaoDoAno,
  posicionarRotulos,
  sobrepoe,
  trechoVisivel,
  vistaParaEvento,
  vistaParaIntervalo,
  zoomEm,
} from './calculo'

describe('Intervalos de tempo', () => {
  it('sobreposição e distância entre acontecimentos', () => {
    const a = { inicio: 1789, fim: 1799 }
    expect(sobrepoe(a, { inicio: 1791, fim: 1804 })).toBe(true)
    expect(sobrepoe(a, { inicio: 1799 })).toBe(true) // o último ano conta
    expect(sobrepoe(a, { inicio: 1800 })).toBe(false)
    expect(distanciaAnos(a, { inicio: 1800 })).toBe(1)
    expect(distanciaAnos({ inicio: 1914, fim: 1918 }, { inicio: 1789, fim: 1799 })).toBe(115)
    expect(distanciaAnos(a, { inicio: 1795 })).toBe(0)
  })
  it('era de um ano: o início é incluído e o fim não; o último ano do último período entra', () => {
    expect(eraDoAno('brasil', 1822)?.id).toBe('br-imperio')
    expect(eraDoAno('brasil', 1821)?.id).toBe('br-colonia')
    expect(eraDoAno('brasil', 1945)?.id).toBe('br-democracia')
    expect(eraDoAno('brasil', 1944)?.id).toBe('br-vargas')
    expect(eraDoAno('mundo', 1989)?.id).toBe('me-guerra-fria')
    expect(eraDoAno('mundo', 1991)?.id).toBe('me-atual')
    expect(eraDoAno('brasil', 1499)).toBeUndefined()
    expect(eraDoAno('brasil', 2025)?.id).toBe('br-nova-rep')
    expect(eraDoAno('brasil', 2026)).toBeUndefined()
  })
  it('em curso: pontos no ano certo; intervalos entre início e fim; folga para o que acabou de acontecer', () => {
    const e = EVENTOS
    expect(emCurso(e, 1822).map((x) => x.id)).toContain('b-independencia')
    expect(emCurso(e, 1822).map((x) => x.id)).toContain('b-primeiro-reinado')
    expect(emCurso(e, 1823).map((x) => x.id)).not.toContain('b-independencia')
    expect(emCurso(e, 1824, 5).map((x) => x.id)).toContain('b-independencia')
    expect(emCurso(e, 1942).map((x) => x.id)).toEqual(expect.arrayContaining(['m-2gm', 'b-estado-novo', 'm-holocausto']))
    expect(emCurso(e, 1942).map((x) => x.id)).not.toContain('m-1gm')
  })
})

describe('Vista, zoom e escala', () => {
  const v = { c: 1900, s: 200 }
  it('posição e ano são inversos um do outro', () => {
    for (const ano of [1800, 1850, 1900, 1999.5]) expect(anoDaPosicao(posicaoDoAno(ano, v, 800), v, 800)).toBeCloseTo(ano, 9)
    expect(posicaoDoAno(1900, v, 800)).toBeCloseTo(400, 9) // o centro fica no meio
    expect(posicaoDoAno(1800, v, 800)).toBeCloseTo(0, 9)
    expect(posicaoDoAno(2000, v, 800)).toBeCloseTo(800, 9)
  })
  it('zoom ancorado: o ano sob o cursor não muda de lugar', () => {
    const meio = { c: 1735, s: 100 } // longe das bordas, onde o limite do tempo não interfere
    for (const ancora of [0, 0.25, 0.5, 0.8, 1])
      for (const fator of [0.5, 0.8, 1.25, 1.6]) {
        const antes = anoDaPosicao(ancora * 1000, meio, 1000)
        const w = zoomEm(meio, ancora, fator)
        expect(anoDaPosicao(ancora * 1000, w, 1000), `âncora ${ancora} fator ${fator}`).toBeCloseTo(antes, 1)
      }
  })
  it('zoom respeita a extensão mínima e máxima e os limites do tempo mostrado', () => {
    let w = v
    for (let i = 0; i < 30; i++) w = zoomEm(w, 0.5, 0.5)
    expect(w.s).toBe(EXTENSAO_MIN)
    w = v
    for (let i = 0; i < 30; i++) w = zoomEm(w, 0.5, 2)
    expect(w.s).toBe(EXTENSAO_MAX)
    expect(w.c).toBeCloseTo((ANO_MIN + ANO_MAX) / 2, 1)
    const longe = limitarVista({ c: 3000, s: 100 })
    expect(longe.c + longe.s / 2).toBeLessThanOrEqual(ANO_MAX)
    const antes = limitarVista({ c: 1000, s: 100 })
    expect(antes.c - antes.s / 2).toBeGreaterThanOrEqual(ANO_MIN)
  })
  it('deslocar move o centro e respeita as bordas', () => {
    expect(deslocar(v, 20).c).toBe(1920)
    expect(deslocar(v, -20).c).toBe(1880)
    expect(deslocar(v, 10_000).c + v.s / 2).toBeLessThanOrEqual(ANO_MAX)
  })
  it('vista para um intervalo e para um acontecimento mostra tudo o que foi pedido', () => {
    const w = vistaParaIntervalo(1930, 1945)
    expect(w.c - w.s / 2).toBeLessThan(1930)
    expect(w.c + w.s / 2).toBeGreaterThan(1945)
    const x = vistaParaEvento(evento('b-ditadura'))
    expect(x.c - x.s / 2).toBeLessThan(1964)
    expect(x.c + x.s / 2).toBeGreaterThan(1985)
    const y = vistaParaEvento(evento('b-independencia'))
    expect(y.s).toBeGreaterThanOrEqual(EXTENSAO_MIN)
    expect(y.s).toBeLessThan(60)
    expect(VISTA_TOTAL.s).toBe(ANO_MAX - ANO_MIN)
  })
  it('marcas do eixo: passo redondo e de 3 a 8 marcas na tela', () => {
    for (const s of [10, 25, 60, 120, 200, 400, 590]) {
      const passo = passoDoEixo(s)
      expect([1, 2, 5, 10, 20, 25, 50, 100, 200]).toContain(passo)
      const marcas = marcasDoEixo({ c: 1850, s })
      expect(marcas.length, `s=${s}`).toBeGreaterThanOrEqual(3)
      expect(marcas.length, `s=${s}`).toBeLessThanOrEqual(9)
      for (const m of marcas) expect(m % passo).toBe(0)
    }
  })
  it('trecho visível de uma era: corta nas bordas e some quando está fora', () => {
    const vista = { c: 1700, s: 400 } // 1500 a 1900
    expect(trechoVisivel(1500, 1822, vista, 800)).toEqual({ a: 0, b: ((1822 - 1500) / 400) * 800 })
    expect(trechoVisivel(1822, 2025, vista, 800)).toEqual({ a: ((1822 - 1500) / 400) * 800, b: 800 })
    expect(trechoVisivel(1500, 1600, { c: 1900, s: 100 }, 800)).toBeNull()
  })
})

describe('Posicionamento dos rótulos', () => {
  const mundo = EVENTOS.filter((e) => e.regiao === 'mundo')
  const base = { L: 900, vista: VISTA_TOTAL, tamanho: 128, linhas: 3, centrado: false }
  it('nenhum rótulo se sobrepõe a outro na mesma linha', () => {
    for (const regiao of ['mundo', 'brasil'] as const) {
      const eventos = EVENTOS.filter((e) => e.regiao === regiao)
      const { colocados } = posicionarRotulos(eventos, base)
      for (let i = 0; i < colocados.length; i++)
        for (let j = i + 1; j < colocados.length; j++) {
          const a = colocados[i]!
          const b = colocados[j]!
          if (a.linha !== b.linha) continue
          expect(a.inicio + 128 <= b.inicio || b.inicio + 128 <= a.inicio, `${a.id} × ${b.id}`).toBe(true)
        }
    }
  })
  it('os mais importantes têm prioridade: acrescentar acontecimentos menos importantes nunca desloca um mais importante', () => {
    const peso1 = mundo.filter((e) => e.peso === 1)
    const so1 = new Set(posicionarRotulos(peso1, base).colocados.map((c) => c.id))
    const todos = posicionarRotulos(mundo, base)
    const comTodos = new Set(todos.colocados.filter((c) => evento(c.id).peso === 1).map((c) => c.id))
    expect(comTodos).toEqual(so1)
    expect(todos.ocultos).toBeGreaterThan(0)
    // e a posição de cada um é a mesma nas duas rodadas
    const linhas1 = new Map(posicionarRotulos(peso1, base).colocados.map((c) => [c.id, c.linha]))
    for (const c of todos.colocados.filter((x) => evento(x.id).peso === 1)) expect(c.linha).toBe(linhas1.get(c.id))
  })
  it('ao aproximar, aparecem mais acontecimentos nos mesmos anos e todos cabem numa janela curta', () => {
    const aberto = posicionarRotulos(mundo, base)
    const perto = posicionarRotulos(mundo, { ...base, vista: { c: 1925, s: 100 } })
    const naJanela = (ids: string[]) => ids.filter((id) => evento(id).inicio >= 1875 && evento(id).inicio <= 1975).length
    expect(naJanela(perto.colocados.map((c) => c.id))).toBeGreaterThan(naJanela(aberto.colocados.map((c) => c.id)))
    const curta = posicionarRotulos(mundo, { ...base, vista: { c: 1925, s: 20 } })
    const idsCurta = new Set(curta.colocados.map((c) => c.id))
    const quemDeveria = mundo.filter((e) => e.inicio >= 1916 && e.inicio <= 1934)
    expect(quemDeveria.length).toBeGreaterThanOrEqual(5)
    for (const e of quemDeveria) expect(idsCurta.has(e.id), e.id).toBe(true)
  })
  it('rótulo centrado (eixo vertical) usa uma única linha e respeita o tamanho vertical', () => {
    const r = posicionarRotulos(EVENTOS.filter((e) => e.regiao === 'brasil'), { L: 480, vista: { c: 1930, s: 80 }, tamanho: 46, linhas: 1, centrado: true })
    const ord = [...r.colocados].sort((a, b) => a.inicio - b.inicio)
    for (let i = 1; i < ord.length; i++) expect(ord[i]!.inicio - ord[i - 1]!.inicio).toBeGreaterThanOrEqual(46)
    expect(ord.every((c) => c.linha === 0)).toBe(true)
  })
  it('acontecimentos fora da tela não são colocados nem contados como ocultos', () => {
    const r = posicionarRotulos(mundo, { ...base, vista: { c: 1500, s: 60 } })
    for (const c of r.colocados) expect(evento(c.id).inicio).toBeLessThan(1540)
  })
  it('a lista de eras cobre as eras usadas nos testes', () => {
    expect(ERAS.length).toBe(13)
  })
})

describe('Cadeias de causas e consequências', () => {
  it('causas diretas e de segunda etapa, sem repetir acontecimentos e sempre em ordem cronológica', async () => {
    const { cadeia } = await import('./calculo')
    const diretas = cadeia('b-golpe-1964', 'causas', 1)
    expect(diretas.map((n) => n.evento.id)).toEqual(expect.arrayContaining(['b-janio-jango', 'm-cuba', 'm-guerra-fria']))
    expect(diretas.every((n) => n.filhos.length === 0)).toBe(true)
    const duas = cadeia('b-republica', 'causas', 2)
    const todos: string[] = []
    const percorre = (nos: typeof duas) => nos.forEach((n) => (todos.push(n.evento.id), percorre(n.filhos)))
    percorre(duas)
    expect(new Set(todos).size).toBe(todos.length)
    expect(todos).toContain('b-eusebio-terras') // causa da Abolição, que causou a República
    expect(todos).not.toContain('b-republica')
    const anos = duas.map((n) => n.evento.inicio)
    expect(anos).toEqual([...anos].sort((a, b) => a - b))
    for (const n of duas) expect(n.relacao.para).toBe('b-republica')
    expect(cadeia('b-ditadura', 'consequencias', 1).map((n) => n.evento.id)).toEqual(expect.arrayContaining(['b-ai5', 'b-anistia']))
    expect(cadeia('b-golpe-1964', 'causas', 0)).toEqual([])
  })
})
