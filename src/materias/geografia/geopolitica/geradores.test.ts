import { NIVEIS, SEMENTES, checarMulti, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { CHAVES, classificarIntegracao, descreverCaracteristicas, exigencias } from './calculo'
import { gerarBlocoMembros, gerarIntegracao, gerarOrdem, gerarOrganizacoes, gerarPonto } from './geradores'

/* Tabelas escritas de novo, à parte, para conferir os dados e os geradores. */
const MEMBROS: Record<string, string[]> = {
  Mercosul: ['Argentina', 'Brasil', 'Paraguai', 'Uruguai'],
  USMCA: ['Canadá', 'Estados Unidos', 'México'],
  UE: ['Alemanha', 'Áustria', 'Bélgica', 'Bulgária', 'Chipre', 'Croácia', 'Dinamarca', 'Eslováquia', 'Eslovênia', 'Espanha', 'Estônia', 'Finlândia', 'França', 'Grécia', 'Hungria', 'Irlanda', 'Itália', 'Letônia', 'Lituânia', 'Luxemburgo', 'Malta', 'Países Baixos', 'Polônia', 'Portugal', 'Tchéquia', 'Romênia', 'Suécia'],
  ASEAN: ['Filipinas', 'Indonésia', 'Malásia', 'Singapura', 'Tailândia'],
}
const LIGA: Record<string, [string, string]> = {
  'Canal de Suez': ['Mar Mediterrâneo', 'Mar Vermelho'],
  'Canal do Panamá': ['Oceano Atlântico', 'Oceano Pacífico'],
  'Estreito de Ormuz': ['Golfo Pérsico', 'Golfo de Omã'],
  'Estreito de Malaca': ['Oceano Índico', 'Mar da China Meridional'],
  'Estreito de Gibraltar': ['Oceano Atlântico', 'Mar Mediterrâneo'],
  'Estreito do Bósforo': ['Mar Negro', 'Mar de Mármara (e, por ele, o Mediterrâneo)'],
  'Estreito de Bab el-Mandeb': ['Mar Vermelho', 'Golfo de Áden (Oceano Índico)'],
}

describe('Classificação dos estágios de integração', () => {
  it('as 16 combinações: o estágio é o último da cadeia com todas as exigências, e o que vem depois de uma lacuna não conta', () => {
    for (let m = 0; m < 16; m++) {
      const c = { tarifaZero: !!(m & 1), tarifaExterna: !!(m & 2), fatores: !!(m & 4), moeda: !!(m & 8) }
      // contagem independente: quantas características consecutivas, a partir da primeira, estão ligadas
      const seq = [c.tarifaZero, c.tarifaExterna, c.fatores, c.moeda]
      let n = 0
      while (n < 4 && seq[n]) n++
      const r = classificarIntegracao(c)
      expect(r.estagio?.numero ?? 0, JSON.stringify(c)).toBe(n)
      expect(r.semEfeito.length, JSON.stringify(c)).toBe(seq.slice(n).filter(Boolean).length)
    }
  })
  it('a moeda única sozinha não forma um estágio, e as exigências de cada estágio incluem as dos anteriores', () => {
    expect(classificarIntegracao({ tarifaZero: false, tarifaExterna: false, fatores: false, moeda: true })).toMatchObject({ estagio: null, semEfeito: ['moeda'] })
    expect(exigencias('zlc')).toEqual({ tarifaZero: true, tarifaExterna: false, fatores: false, moeda: false })
    expect(exigencias('uniao-economica')).toEqual({ tarifaZero: true, tarifaExterna: true, fatores: true, moeda: true })
    for (const id of ['zlc', 'uniao-aduaneira', 'mercado-comum', 'uniao-economica'] as const) expect(classificarIntegracao(exigencias(id)).estagio?.id).toBe(id)
  })
  it('descrição em português: lista só o que está ligado', () => {
    expect(descreverCaracteristicas({ tarifaZero: true, tarifaExterna: false, fatores: false, moeda: false })).toBe('eliminaram as tarifas de importação entre si')
    expect(descreverCaracteristicas({ tarifaZero: true, tarifaExterna: true, fatores: false, moeda: false })).toContain('mesma tarifa de importação')
    expect(descreverCaracteristicas({ tarifaZero: false, tarifaExterna: false, fatores: false, moeda: false })).toContain('nenhuma medida')
    expect(CHAVES).toHaveLength(4)
  })
})

describe('Estágios de integração (desafio)', () => {
  it('nível 1: a resposta certa é o estágio da descrição (conferido pelas frases do enunciado)', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarIntegracao(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const e = inst.enunciado
      const esperado = e.includes('moeda única') ? 'União econômica e monetária' : e.includes('circulem livremente') ? 'Mercado comum' : e.includes('mesma tarifa de importação') ? 'União aduaneira' : 'Zona de livre-comércio'
      expect(textoCerto(inst), e).toBe(esperado)
      vistos.add(esperado)
    }
    expect(vistos.size).toBe(4)
  })
  it('nível 2: o que o estágio acrescenta ao anterior', () => {
    const ACRESCENTA: Record<string, string> = {
      'união aduaneira': 'tarifa externa comum',
      'mercado comum': 'livre circulação de pessoas, capitais e serviços',
      'união econômica e monetária': 'moeda única e coordenação das políticas econômicas',
    }
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarIntegracao(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const m = /O que um\(a\) (.+) tem a mais do que um\(a\) (.+)\?/.exec(inst.enunciado)!
      expect(textoCerto(inst)).toBe(ACRESCENTA[m[1]!])
      vistos.add(m[1]!)
    }
    expect(vistos.size).toBe(3)
  })
  it('nível 3: Mercosul é união aduaneira, UE é união econômica e monetária, USMCA é zona de livre-comércio', () => {
    const ESTAGIO: Record<string, string> = { Mercosul: 'União aduaneira', UE: 'União econômica e monetária', USMCA: 'Zona de livre-comércio' }
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarIntegracao(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const sigla = /bloco (\w+)\?/.exec(inst.enunciado)![1]!
      expect(textoCerto(inst)).toBe(ESTAGIO[sigla])
      vistos.add(sigla)
    }
    expect(vistos.size).toBe(3)
  })
})

describe('Blocos e seus países (desafio)', () => {
  it.each([1, 2] as const)('nível %i: o país certo é do bloco e os outros não', (nivel) => {
    const blocos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarBlocoMembros(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const sigla = /faz parte do (\w+) \(/.exec(inst.enunciado)![1]!
      expect(MEMBROS[sigla], sigla).toContain(textoCerto(inst))
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(MEMBROS[sigla], `${o.rotulo} não é do ${sigla}`).not.toContain(o.rotulo)
      blocos.add(sigla)
    }
    expect(blocos.size).toBe(2)
  })
  it('nível 3: os três países são do bloco da resposta certa e de nenhum outro', () => {
    const blocos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarBlocoMembros(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const m = /reúne estes três países: (.+), (.+) e (.+)\?/.exec(inst.enunciado)!
      const paises = [m[1]!, m[2]!, m[3]!]
      const sigla = textoCerto(inst)
      for (const p of paises) {
        expect(MEMBROS[sigla], `${p} no ${sigla}`).toContain(p)
        for (const [outra, lista] of Object.entries(MEMBROS)) if (outra !== sigla) expect(lista).not.toContain(p)
      }
      expect(new Set(paises).size).toBe(3)
      blocos.add(sigla)
    }
    expect(blocos.size).toBe(4)
  })
})

describe('Canais e estreitos (desafio)', () => {
  it('nível 1: o ponto certo liga os dois mares citados; só os mais conhecidos são sorteados como resposta', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarPonto(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const m = /liga (.+) e (.+)\?$/.exec(inst.enunciado)!
      const nome = textoCerto(inst)
      expect([...LIGA[nome]!].sort()).toEqual([m[1]!, m[2]!].sort())
      vistos.add(nome)
    }
    expect([...vistos].sort()).toEqual(['Canal de Suez', 'Canal do Panamá', 'Estreito de Gibraltar', 'Estreito de Ormuz'])
  })
  it('nível 2: a descrição é a do ponto certo (conferida pelos mares e países)', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarPonto(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const nome = textoCerto(inst)
      expect(inst.resolucao).toContain(LIGA[nome]![0])
      vistos.add(nome)
    }
    expect(vistos.size).toBe(7)
  })
  it('nível 3: o ponto marcado no mapa é o da resposta e o mapa só mostra o nome depois de responder', () => {
    for (const s of SEMENTES.slice(0, 50)) {
      const inst = gerarPonto(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      expect(inst.dados?.mostrarNoMapa).toBe(true)
      expect(inst.enunciado).not.toContain(textoCerto(inst))
      expect(inst.opcoes.map((o) => o.rotulo).every((n) => LIGA[n])).toBe(true)
    }
  })
})

describe('Organizações e ordem mundial (desafios)', () => {
  it.each([
    ['organizações', gerarOrganizacoes],
    ['ordem', gerarOrdem],
  ] as const)('%s: perguntas completas em todos os níveis', (_n, gerar) => {
    const vistas = new Set<string>()
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerar(rngTeste(s, nivel), nivel)
        checarMulti(inst, `n${nivel} s${s}`)
        vistas.add(inst.enunciado)
      }
    expect(vistas.size).toBeGreaterThanOrEqual(10)
  })
})
