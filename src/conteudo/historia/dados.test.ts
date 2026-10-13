import { ANO_MAX, ANO_MIN, ERAS, EVENTOS, PASSOS_HISTORIA, PERIODOS, PERSONAGENS, RELACOES, RESUMO_HISTORIA, evento } from './linhaDoTempo'
import { FICHAS } from './fichas'
import { formatarAno, rotuloAno } from './tipos'

const ids = new Set(EVENTOS.map((e) => e.id))

describe('Acontecimentos: integridade dos dados', () => {
  it('ids únicos, com prefixo m- (mundo) ou b- (Brasil) coerente com a região', () => {
    expect(ids.size).toBe(EVENTOS.length)
    for (const e of EVENTOS) expect(e.id.startsWith(e.regiao === 'brasil' ? 'b-' : 'm-'), e.id).toBe(true)
  })
  it('campos obrigatórios preenchidos e anos coerentes', () => {
    for (const e of EVENTOS) {
      expect(e.titulo.length, e.id).toBeGreaterThan(5)
      expect(e.resumo.length, e.id).toBeGreaterThan(60)
      expect(e.causas.length, `${e.id}: causas`).toBeGreaterThanOrEqual(1)
      expect(e.consequencias.length, `${e.id}: consequências`).toBeGreaterThanOrEqual(2)
      expect(e.ligacao.length, `${e.id}: ligação`).toBeGreaterThan(20)
      expect(e.fontes.length, `${e.id}: fontes`).toBeGreaterThanOrEqual(1)
      expect([1, 2, 3]).toContain(e.peso)
      expect(e.inicio).toBeGreaterThanOrEqual(ANO_MIN + 10)
      expect(e.inicio).toBeLessThanOrEqual(ANO_MAX - 5)
      if (e.fim !== undefined) expect(e.fim, e.id).toBeGreaterThan(e.inicio)
      for (const t of [...e.causas, ...e.consequencias]) expect(t.length, e.id).toBeGreaterThan(8)
    }
  })
  it('conexões apontam para acontecimentos que existem e não para si mesmos', () => {
    for (const e of EVENTOS)
      for (const c of e.conexoes) {
        expect(ids.has(c), `${e.id} → ${c}`).toBe(true)
        expect(c).not.toBe(e.id)
      }
  })
  it('rótulo de ano: ponto único, intervalo e aproximação', () => {
    expect(rotuloAno({ inicio: 1822 })).toBe('1822')
    expect(rotuloAno({ inicio: 1789, fim: 1799 })).toBe('1789–1799')
    expect(rotuloAno({ inicio: 1760, fim: 1850, aprox: true })).toBe('c. 1760–1850')
  })
  it('rótulo de ano antes de Cristo: "a.C." uma vez no fim, ou nos dois lados quando o intervalo cruza o ano 1', () => {
    expect(rotuloAno({ inicio: -1750, aprox: true })).toBe('c. 1750 a.C.')
    expect(rotuloAno({ inicio: -3100, fim: -30, aprox: true })).toBe('c. 3100–30 a.C.')
    expect(rotuloAno({ inicio: -27, fim: 476 })).toBe('27 a.C.–476 d.C.')
    expect(formatarAno(-508)).toBe('508 a.C.')
    expect(formatarAno(0)).toBe('1 d.C.')
    expect(formatarAno(1500)).toBe('1500')
  })
  it('há acontecimentos de peso 1 suficientes para o zoom mais aberto', () => {
    expect(EVENTOS.filter((e) => e.peso === 1 && e.regiao === 'brasil').length).toBeGreaterThanOrEqual(15)
    expect(EVENTOS.filter((e) => e.peso === 1 && e.regiao === 'mundo').length).toBeGreaterThanOrEqual(10)
  })
})

describe('Datas conferidas à parte (tabela independente do conteúdo)', () => {
  // Cada par (id, início) foi escrito de novo aqui, de uma lista de datas consagradas, para pegar erro de digitação nos dados.
  const INICIO: Record<string, number> = {
    'b-1500': 1500,
    'b-capitanias': 1534,
    'b-governo-geral': 1549,
    'b-uniao-iberica': 1580,
    'b-holandeses': 1630,
    'b-pombal': 1750,
    'b-inconfidencia': 1789,
    'b-conjuracao-baiana': 1798,
    'b-familia-real': 1808,
    'b-pernambucana': 1817,
    'b-independencia': 1822,
    'b-regencia': 1831,
    'b-segundo-reinado': 1840,
    'b-eusebio-terras': 1850,
    'b-paraguai': 1864,
    'b-abolicao': 1871,
    'b-republica': 1889,
    'b-canudos': 1896,
    'b-modernismo': 1922,
    'b-1930': 1930,
    'b-1932': 1932,
    'b-estado-novo': 1937,
    'b-clt': 1943,
    'b-feb': 1944,
    'b-petrobras': 1953,
    'b-suicidio-vargas': 1954,
    'b-jk': 1956,
    'b-golpe-1964': 1964,
    'b-ai5': 1968,
    'b-anistia': 1979,
    'b-diretas': 1983,
    'b-nova-republica': 1985,
    'b-constituicao': 1988,
    'b-real': 1994,
    'b-impeachment-2016': 2016,
    'm-constantinopla': 1453,
    'm-colombo': 1492,
    'm-tordesilhas': 1494,
    'm-reforma': 1517,
    'm-independencia-eua': 1776,
    'm-rev-francesa': 1789,
    'm-haiti': 1791,
    'm-napoleao': 1799,
    'm-primavera-povos': 1848,
    'm-secessao': 1861,
    'm-1gm': 1914,
    'm-rev-russa': 1917,
    'm-versalhes': 1919,
    'm-crise-1929': 1929,
    'm-2gm': 1939,
    'm-onu': 1945,
    'm-atomicas': 1945,
    'm-guerra-fria': 1947,
    'm-rev-chinesa': 1949,
    'm-cuba': 1959,
    'm-misseis': 1962,
    'm-vietna': 1955,
    'm-maio-68': 1968,
    'm-petroleo-73': 1973,
    'm-chile-73': 1973,
    'm-muro-1989': 1989,
    'm-urss-1991': 1991,
    'm-apartheid': 1994,
    'm-11-setembro': 2001,
    'm-crise-2008': 2008,
    // Antiguidade e Idade Média (negativos = a.C.)
    'm-republica-romana': -509,
    'm-alexandre': -336,
    'm-imperio-romano': -27,
    'm-queda-roma': 476,
    'm-islamismo': 622,
    'm-carlos-magno': 800,
    'm-cisma': 1054,
    'm-cruzadas': 1096,
    'm-magna-carta': 1215,
    'm-cem-anos': 1337,
    'm-peste': 1347,
  }
  const FIM: Record<string, number> = { 'm-republica-romana': -27, 'm-alexandre': -323, 'm-imperio-romano': 476, 'm-carlos-magno': 814, 'm-cruzadas': 1291, 'm-cem-anos': 1453, 'm-peste': 1351, 'm-egito': -30, 'm-cristianismo': 380, 'b-regencia': 1840, 'b-segundo-reinado': 1889, 'b-paraguai': 1870, 'b-republica-velha': 1930, 'b-era-vargas': 1945, 'b-estado-novo': 1945, 'b-ditadura': 1985, 'b-abolicao': 1888, 'm-1gm': 1918, 'm-2gm': 1945, 'm-rev-francesa': 1799, 'm-guerra-fria': 1991, 'm-independencia-eua': 1783, 'm-vietna': 1975, 'b-holandeses': 1654, 'b-canudos': 1897, 'b-primeiro-reinado': 1831 }
  it.each(Object.entries(INICIO))('%s começa em %i', (id, ano) => {
    expect(evento(id).inicio).toBe(ano)
  })
  it.each(Object.entries(FIM))('%s termina em %i', (id, ano) => {
    expect(evento(id).fim).toBe(ano)
  })
})

describe('Cobertura pedida: Brasil e mundo', () => {
  const PRECISA = [
    'm-rev-industrial',
    'm-rev-francesa',
    'm-independencia-eua',
    'm-revolucoes-inglesas',
    'm-imperialismo',
    'm-1gm',
    'm-2gm',
    'm-guerra-fria',
    'm-descolonizacao',
    'm-muro-1989',
    'm-11-setembro',
    'b-acucar',
    'b-mineracao',
    'b-trafico',
    'b-segundo-reinado',
    'b-republica-velha',
    'b-era-vargas',
    'b-ditadura',
    'b-nova-republica',
  ]
  it.each(PRECISA)('existe %s', (id) => {
    expect(ids.has(id)).toBe(true)
  })
})

describe('Eras', () => {
  it('são contínuas em cada região: o fim de uma é o início da seguinte', () => {
    for (const regiao of ['mundo', 'brasil'] as const) {
      const lista = ERAS.filter((e) => e.regiao === regiao)
      lista.forEach((e, i) => {
        expect(e.fim, e.id).toBeGreaterThan(e.inicio)
        if (i > 0) expect(e.inicio, e.id).toBe((lista[i - 1] as (typeof lista)[number]).fim)
        expect(e.cor).toMatch(/^#[0-9a-f]{6}$/)
      })
    }
    expect(ERAS.find((e) => e.id === 'me-moderna')?.inicio).toBe(1453)
    expect(ERAS.find((e) => e.id === 'br-colonia')?.inicio).toBe(1500)
    expect(ERAS.find((e) => e.id === 'me-antiga')?.inicio).toBe(-3500)
    expect(ERAS.find((e) => e.id === 'me-media')?.inicio).toBe(476)
    expect(ERAS.find((e) => e.id === 'me-media')?.fim).toBe(1453)
  })
  it('Idade Antiga e Idade Média têm acontecimentos dos dois tipos de marco (político e cultural) e de peso 1', () => {
    const antigos = EVENTOS.filter((e) => e.regiao === 'mundo' && e.inicio < 1453)
    expect(antigos.length).toBeGreaterThanOrEqual(18)
    expect(antigos.filter((e) => e.peso === 1).length).toBeGreaterThanOrEqual(3)
    expect(new Set(antigos.map((e) => e.tipo)).size).toBeGreaterThanOrEqual(4)
  })
  it('todo acontecimento começa dentro de alguma era da sua região', () => {
    for (const e of EVENTOS) {
      const dentro = ERAS.some((er) => er.regiao === e.regiao && e.inicio >= er.inicio && e.inicio <= er.fim)
      expect(dentro, `${e.id} (${e.inicio})`).toBe(true)
    }
  })
  it('cada era tem pelo menos três acontecimentos começando bem no meio dela (para o desafio do intruso)', () => {
    // exceção: antes de 1500, a história dos povos do Brasil é conhecida pela arqueologia, com poucas datas consagradas
    for (const er of ERAS.filter((e) => e.id !== 'br-originarios')) {
      const dentro = EVENTOS.filter((e) => e.regiao === er.regiao && e.inicio > er.inicio && e.inicio < er.fim)
      expect(dentro.length, er.id).toBeGreaterThanOrEqual(3)
    }
  })
  it('períodos de comparação cobrem de 1500 a 2025 sem lacunas', () => {
    expect(PERIODOS[0]?.inicio).toBe(1500)
    PERIODOS.forEach((p, i) => {
      if (i > 0) expect(p.inicio).toBe((PERIODOS[i - 1] as (typeof PERIODOS)[number]).fim)
    })
    expect(PERIODOS[PERIODOS.length - 1]?.fim).toBe(2025)
  })
})

describe('Relações de causa e consequência', () => {
  it('existem, não repetem e respeitam a ordem do tempo (a causa começa antes de o efeito terminar)', () => {
    const vistos = new Set<string>()
    for (const r of RELACOES) {
      expect(ids.has(r.de), r.de).toBe(true)
      expect(ids.has(r.para), r.para).toBe(true)
      expect(r.de).not.toBe(r.para)
      const chave = `${r.de}>${r.para}`
      expect(vistos.has(chave), `repetida ${chave}`).toBe(false)
      vistos.add(chave)
      expect(evento(r.de).inicio, chave).toBeLessThanOrEqual(evento(r.para).fim ?? evento(r.para).inicio)
      expect(r.texto.length, chave).toBeGreaterThan(40)
      // um par não pode ser causa nos dois sentidos
      expect(vistos.has(`${r.para}>${r.de}`), `ciclo ${chave}`).toBe(false)
    }
    expect(RELACOES.length).toBeGreaterThanOrEqual(60)
  })
  it('toda relação aparece nas conexões dos dois acontecimentos (nos dois sentidos)', () => {
    for (const r of RELACOES) {
      expect(evento(r.para).conexoes, `${r.de} → ${r.para}`).toContain(r.de)
      expect(evento(r.de).conexoes, `${r.de} → ${r.para}`).toContain(r.para)
    }
  })
  it('a maior parte dos acontecimentos de peso 1 tem relações registradas (para o laboratório da cadeia)', () => {
    const comRelacao = new Set(RELACOES.flatMap((r) => [r.de, r.para]))
    const peso1 = EVENTOS.filter((e) => e.peso === 1)
    const sem = peso1.filter((e) => !comRelacao.has(e.id))
    expect(sem.map((e) => e.id).length, `sem relação: ${sem.map((e) => e.id).join(', ')}`).toBeLessThanOrEqual(3)
  })
})

describe('Personagens', () => {
  it('ids únicos, acontecimento existente, feito claro e sem repetição de feito', () => {
    expect(new Set(PERSONAGENS.map((p) => p.id)).size).toBe(PERSONAGENS.length)
    expect(new Set(PERSONAGENS.map((p) => p.feito)).size).toBe(PERSONAGENS.length)
    expect(new Set(PERSONAGENS.map((p) => p.nome)).size).toBe(PERSONAGENS.length)
    for (const p of PERSONAGENS) {
      expect(ids.has(p.evento), p.id).toBe(true)
      expect(p.feito.length).toBeGreaterThan(20)
    }
    expect(PERSONAGENS.filter((p) => evento(p.evento).regiao === 'brasil').length).toBeGreaterThanOrEqual(12)
    expect(PERSONAGENS.filter((p) => evento(p.evento).regiao === 'mundo').length).toBeGreaterThanOrEqual(12)
  })
  it('o feito de um personagem não cita o nome de outro (para não entregar o pareamento)', () => {
    for (const p of PERSONAGENS)
      for (const q of PERSONAGENS.filter((x) => x.id !== p.id)) {
        const ultimo = q.nome.split(' ').pop() as string
        if (ultimo.length > 5) expect(p.feito.includes(ultimo), `${p.nome} cita ${q.nome}`).toBe(false)
      }
  })
})

describe('Entenda e Resumo', () => {
  it('as etapas têm pergunta com a opção certa dentro do intervalo e acontecimentos existentes', () => {
    expect(PASSOS_HISTORIA.length).toBe(13)
    for (const p of PASSOS_HISTORIA) {
      expect(p.texto.length).toBeGreaterThanOrEqual(2)
      expect(p.pare.opcoes.length).toBe(3)
      expect(p.pare.certa).toBeGreaterThanOrEqual(0)
      expect(p.pare.certa).toBeLessThan(3)
      expect(p.pare.explicacao.length).toBeGreaterThan(30)
      expect(p.eventos.length).toBeGreaterThanOrEqual(3)
      for (const id of p.eventos) expect(ids.has(id), `${p.titulo}: ${id}`).toBe(true)
    }
  })
  it('o resumo tem fontes em todas as seções e datas conferidas por palavra-chave', () => {
    for (const s of RESUMO_HISTORIA) {
      expect(s.fontes?.length ?? 0, s.titulo).toBeGreaterThanOrEqual(1)
      expect(s.ideias.length).toBeGreaterThanOrEqual(3)
      expect(s.pegadinhas.length).toBeGreaterThanOrEqual(2)
    }
    const texto = RESUMO_HISTORIA.flatMap((s) => s.ideias).join(' ')
    for (const dado of ['1500', '1822', '1889', '1930', '1964', '1988', '1789', '1914', '1945', '1991']) expect(texto).toContain(dado)
  })
})

describe('Fichas rápidas', () => {
  // "1789: ...", "c. 3100 a.C.: ...", "264–146 a.C.: ..." ou "Século XIV: ..." (sem ano a conferir)
  const anoDoMarco = (m: string): number | null => {
    if (/^Séculos? /.test(m)) return null
    const r = /^(?:c\. )?(\d{1,4})(?:–\d{1,4})?( a\.C\.)?: \S/.exec(m)
    expect(r, `marco sem data no começo: ${m}`).not.toBeNull()
    const n = Number((r as RegExpExecArray)[1])
    return (r as RegExpExecArray)[2] ? -n : n
  }
  it('todo acontecimento tem ficha, e toda ficha é de um acontecimento', () => {
    for (const e of EVENTOS) expect(FICHAS[e.id], e.id).toBeDefined()
    for (const id of Object.keys(FICHAS)) expect(ids.has(id), id).toBe(true)
  })
  it('são sucintas: gatilho curto, de 1 a 5 marcos e pelo menos uma pessoa ou grupo; sem citações entre aspas', () => {
    for (const [id, f] of Object.entries(FICHAS)) {
      if (f.gatilho) expect(f.gatilho.length, id).toBeLessThanOrEqual(140)
      expect(f.marcos.length, id).toBeGreaterThanOrEqual(1)
      expect(f.marcos.length, id).toBeLessThanOrEqual(5)
      expect(f.pessoas.length, id).toBeGreaterThanOrEqual(1)
      for (const t of [f.gatilho ?? '', ...f.marcos, ...f.pessoas]) {
        expect(t.length, `${id}: ${t}`).toBeLessThanOrEqual(120)
        expect(t, `${id}: ${t}`).not.toMatch(/["“”«»]/)
      }
    }
  })
  it('os marcos estão em ordem e perto do acontecimento (até 100 anos antes do início ou depois do fim)', () => {
    for (const e of EVENTOS) {
      const anos = (FICHAS[e.id]?.marcos ?? []).map(anoDoMarco).filter((a): a is number => a !== null)
      anos.forEach((a, i) => {
        if (i > 0) expect(a, `${e.id}: ordem`).toBeGreaterThanOrEqual(anos[i - 1] as number)
        expect(a, `${e.id}: ${a}`).toBeGreaterThanOrEqual(e.inicio - 100)
        expect(a, `${e.id}: ${a}`).toBeLessThanOrEqual((e.fim ?? e.inicio) + 100)
      })
    }
  })
  it('acontecimentos de data exata têm um marco no próprio ano de início', () => {
    for (const e of EVENTOS.filter((x) => !x.aprox && x.fim === undefined)) {
      const anos = (FICHAS[e.id]?.marcos ?? []).map(anoDoMarco)
      expect(anos, e.id).toContain(e.inicio)
    }
  })
})
