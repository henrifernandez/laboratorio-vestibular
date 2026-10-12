import { AUTORES_SOCIOLOGIA, CATEGORIAS, EXEMPLOS, SITUACOES } from '@/conteudo/sociologia/tresLentes'
import { NIVEIS, SEMENTES, checarMulti, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { gerarConceitoSociologia, gerarObraSociologia, gerarQuemSociologia, gerarSituacao, gerarTipos } from './geradores'

const autorPorNome = (nome: string) => AUTORES_SOCIOLOGIA.find((a) => a.nome === nome)!
const CLASSICOS = ['durkheim', 'weber', 'marx']

describe('Quem defende esta ideia? (desafio)', () => {
  it.each(NIVEIS)('nível %i: a afirmação pertence ao autor da alternativa certa e nenhum coautor da ideia entra como erro', (nivel) => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarQuemSociologia(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const dono = AUTORES_SOCIOLOGIA.find((a) => a.afirmacoes.some((x) => inst.enunciado.endsWith(x.texto)))
      expect(dono, `s${s}: ${inst.enunciado}`).toBeDefined()
      expect(textoCerto(inst)).toBe(dono!.nome)
      if (nivel === 1) expect(CLASSICOS).toContain(dono!.id)
      const afirmacao = dono!.afirmacoes.find((x) => inst.enunciado.endsWith(x.texto))!
      for (const o of inst.opcoes) expect(afirmacao.tambem ?? [], o.rotulo).not.toContain(autorPorNome(o.rotulo).id)
      expect(inst.enunciado).toContain('paráfrase, não uma citação literal')
      vistos.add(dono!.id)
    }
    expect(vistos.size).toBeGreaterThanOrEqual(nivel === 1 ? 3 : 5)
  })
})

describe('Conceitos (desafio)', () => {
  it('nível 1: o autor certo é o dono do conceito', () => {
    for (const s of SEMENTES) {
      const inst = gerarConceitoSociologia(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const termo = /conceito “(.+)” é associado/.exec(inst.enunciado)![1]!
      const dono = AUTORES_SOCIOLOGIA.find((a) => a.conceitos.some((c) => c.termo === termo))!
      expect(textoCerto(inst), `s${s}: ${termo}`).toBe(dono.nome)
    }
  })
  it('nível 2: o significado certo é o do conceito, e os demais pertencem a outros conceitos', () => {
    for (const s of SEMENTES) {
      const inst = gerarConceitoSociologia(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const m = /significa o conceito “(.+)”, de (.+)\?/.exec(inst.enunciado)!
      const autor = autorPorNome(m[2]!)
      expect(autor.conceitos.find((c) => c.termo === m[1])!.sentido, `s${s}`).toBe(textoCerto(inst))
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) {
        const dono = AUTORES_SOCIOLOGIA.find((a) => a.conceitos.some((c) => c.sentido === o.rotulo))
        expect(dono, o.rotulo).toBeDefined()
        expect(dono!.id).not.toBe(autor.id)
      }
    }
  })
  it('nível 3: a descrição leva ao termo certo; as alternativas são outros termos', () => {
    for (const s of SEMENTES) {
      const inst = gerarConceitoSociologia(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const descricao = inst.enunciado.replace(/^Qual conceito corresponde à seguinte descrição\? /, '')
      const conceito = AUTORES_SOCIOLOGIA.flatMap((a) => a.conceitos).find((c) => c.sentido === descricao)!
      expect(conceito, `s${s}`).toBeDefined()
      expect(textoCerto(inst)).toBe(conceito.termo)
      const todos = AUTORES_SOCIOLOGIA.flatMap((a) => a.conceitos.map((c) => c.termo))
      for (const o of inst.opcoes) expect(todos).toContain(o.rotulo)
    }
  })
})

describe('Obras (desafio)', () => {
  it('nível 1: o autor da obra citada', () => {
    for (const s of SEMENTES) {
      const inst = gerarObraSociologia(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const titulo = /da obra “(.+)”\?/.exec(inst.enunciado)![1]!
      const dono = AUTORES_SOCIOLOGIA.find((a) => a.obras.some((o) => o.titulo === titulo))!
      expect(textoCerto(inst)).toBe(dono.nome)
    }
  })
  it('nível 2: a obra certa é do autor pedido, e as outras, de outros autores', () => {
    for (const s of SEMENTES) {
      const inst = gerarObraSociologia(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const autor = autorPorNome(/obras abaixo é de (.+)\?/.exec(inst.enunciado)![1]!)
      expect(autor.obras.map((o) => o.titulo)).toContain(textoCerto(inst))
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(autor.obras.map((x) => x.titulo)).not.toContain(o.rotulo)
    }
  })
  it('nível 3: a ideia certa é o resumo do autor da obra', () => {
    for (const s of SEMENTES) {
      const inst = gerarObraSociologia(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const titulo = /à obra “(.+)”\?/.exec(inst.enunciado)![1]!
      const dono = AUTORES_SOCIOLOGIA.find((a) => a.obras.some((o) => o.titulo === titulo))!
      expect(textoCerto(inst)).toBe(dono.resumo)
    }
  })
})

describe('A mesma situação, lentes diferentes (desafio)', () => {
  it.each([1, 2] as const)('nível %i: a leitura citada é do autor da alternativa certa', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarSituacao(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const situacao = SITUACOES.find((x) => inst.enunciado.startsWith(`Situação: ${x.descricao}`))!
      const leitura = situacao.leituras.find((l) => inst.enunciado.includes(l.texto))!
      expect(leitura, `s${s}`).toBeDefined()
      expect(textoCerto(inst)).toBe(AUTORES_SOCIOLOGIA.find((a) => a.id === leitura.autor)!.nome)
      if (nivel === 1) expect(CLASSICOS).toContain(leitura.autor)
      // nenhuma alternativa errada é um autor que também tenha dado essa leitura (os textos são todos diferentes)
      expect(situacao.leituras.filter((l) => l.texto === leitura.texto)).toHaveLength(1)
    }
  })
  it('nível 3: dado o autor, a leitura certa é a dele e as erradas são de outros autores da mesma situação', () => {
    for (const s of SEMENTES) {
      const inst = gerarSituacao(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const situacao = SITUACOES.find((x) => inst.enunciado.startsWith(`Situação: ${x.descricao}`))!
      const autor = autorPorNome(/lente de (.+)\? \(Leitura/.exec(inst.enunciado)![1]!)
      expect(situacao.leituras.find((l) => l.autor === autor.id)!.texto, `s${s}`).toBe(textoCerto(inst))
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) {
        const l = situacao.leituras.find((x) => x.texto === o.rotulo)
        expect(l, o.rotulo).toBeDefined()
        expect(l!.autor).not.toBe(autor.id)
      }
    }
  })
})

describe('Classifique o caso (desafio)', () => {
  const GRUPOS: Record<number, string[]> = { 1: ['weber-acao'], 2: ['weber-dominacao', 'durkheim'], 3: ['marx', 'marx-classes'] }
  it.each(NIVEIS)('nível %i: a categoria certa é a do exemplo, no grupo do nível', (nivel) => {
    const grupos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarTipos(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const exemplo = EXEMPLOS.find((e) => inst.enunciado === `Classifique o caso. ${e.texto}`)!
      expect(exemplo, `s${s}`).toBeDefined()
      const categoria = CATEGORIAS.find((c) => c.id === exemplo.categoria)!
      expect(textoCerto(inst)).toBe(categoria.nome)
      expect(GRUPOS[nivel]).toContain(categoria.grupo)
      grupos.add(categoria.grupo)
      // as irmãs do grupo aparecem como alternativas
      const nomes = inst.opcoes.map((o) => o.rotulo)
      for (const irma of CATEGORIAS.filter((c) => c.grupo === categoria.grupo)) expect(nomes, irma.nome).toContain(irma.nome)
    }
    expect(grupos.size).toBe(GRUPOS[nivel]!.length)
  })
})
