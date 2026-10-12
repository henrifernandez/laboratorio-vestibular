import { ARESTAS, PENSADORES } from '@/conteudo/filosofia/pensadores'
import { NIVEIS, SEMENTES, checarMulti, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { gerarConceitoFilosofia, gerarDebate, gerarEpoca, gerarInfluencia, gerarObraFilosofia, gerarQuemFilosofia } from './geradores'

const porNome = (nome: string) => PENSADORES.find((p) => p.nome === nome)!
const eraDe = (nasc: number) => (nasc < 0 ? 'Antiguidade' : nasc < 1800 ? 'Idade Moderna' : 'Contemporânea')
const relacionados = (id: string) => ARESTAS.filter((a) => a.de === id || a.para === id).flatMap((a) => [a.de, a.para])

describe('Quem defende esta ideia? (desafio)', () => {
  it.each(NIVEIS)('nível %i: a afirmação é do pensador da alternativa certa e nenhum coautor da ideia entra como erro', (nivel) => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarQuemFilosofia(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const dono = PENSADORES.find((a) => a.afirmacoes.some((x) => inst.enunciado.endsWith(x.texto)))
      expect(dono, `s${s}`).toBeDefined()
      expect(textoCerto(inst)).toBe(dono!.nome)
      const afirmacao = dono!.afirmacoes.find((x) => inst.enunciado.endsWith(x.texto))!
      for (const o of inst.opcoes) expect(afirmacao.tambem ?? [], o.rotulo).not.toContain(porNome(o.rotulo).id)
      vistos.add(dono!.id)
    }
    expect(vistos.size).toBeGreaterThanOrEqual(10)
  })
})

describe('Conceitos e obras (desafios)', () => {
  it('conceito nível 1: o autor certo é o dono do conceito; todos os conceitos podem ser sorteados', () => {
    const termos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarConceitoFilosofia(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const termo = /conceito “(.+)” é associado/.exec(inst.enunciado)![1]!
      expect(PENSADORES.find((a) => a.conceitos.some((c) => c.termo === termo))!.nome).toBe(textoCerto(inst))
      termos.add(termo)
    }
    expect(termos.size).toBeGreaterThan(20)
  })
  it('conceito nível 2: o significado certo é o do conceito citado', () => {
    for (const s of SEMENTES) {
      const inst = gerarConceitoFilosofia(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const m = /significa o conceito “(.+)”, de (.+)\?/.exec(inst.enunciado)!
      expect(porNome(m[2]!).conceitos.find((c) => c.termo === m[1])!.sentido).toBe(textoCerto(inst))
    }
  })
  it('conceito nível 3: a descrição leva ao termo certo', () => {
    for (const s of SEMENTES) {
      const inst = gerarConceitoFilosofia(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const descricao = inst.enunciado.replace(/^Qual conceito corresponde à seguinte descrição\? /, '')
      expect(PENSADORES.flatMap((a) => a.conceitos).find((c) => c.sentido === descricao)!.termo).toBe(textoCerto(inst))
    }
  })
  it('obras: Sócrates nunca aparece como autor; a obra pertence ao autor da resposta', () => {
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarObraFilosofia(rngTeste(s, nivel), nivel)
        checarMulti(inst, `n${nivel} s${s}`)
        for (const o of inst.opcoes) expect(o.rotulo).not.toBe('Sócrates')
        if (nivel === 1) {
          const titulo = /da obra “(.+)”\?/.exec(inst.enunciado)![1]!
          expect(PENSADORES.find((a) => a.obras.some((o) => o.titulo === titulo))!.nome).toBe(textoCerto(inst))
        }
        if (nivel === 2) {
          const autor = porNome(/obras abaixo é de (.+)\?/.exec(inst.enunciado)![1]!)
          expect(autor.obras.map((o) => o.titulo)).toContain(textoCerto(inst))
        }
      }
  })
})

describe('Grandes debates (desafio)', () => {
  it('vem do banco de perguntas, com estrutura válida em todos os níveis', () => {
    for (const nivel of NIVEIS) for (const s of SEMENTES.slice(0, 40)) checarMulti(gerarDebate(rngTeste(s, nivel), nivel), `n${nivel} s${s}`)
  })
})

describe('Quando viveram? (desafio)', () => {
  it('nível 1: o certo nasceu antes dos outros três', () => {
    for (const s of SEMENTES) {
      const inst = gerarEpoca(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const nasc = inst.opcoes.map((o) => porNome(o.rotulo).nascimento)
      expect(porNome(textoCerto(inst)).nascimento, `s${s}`).toBe(Math.min(...nasc))
      expect(new Set(nasc).size).toBe(4)
    }
  })
  it('nível 2: o certo é da época pedida e os outros, de outras épocas', () => {
    const epocas = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarEpoca(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const epoca = /pertence à (Antiguidade|Idade Moderna|Contemporânea)\?/.exec(inst.enunciado)![1]!
      expect(eraDe(porNome(textoCerto(inst)).nascimento), `s${s}`).toBe(epoca)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(eraDe(porNome(o.rotulo).nascimento), `s${s}: ${o.rotulo}`).not.toBe(epoca)
      epocas.add(epoca)
    }
    expect(epocas.size).toBe(3)
  })
  it('nível 3: só a alternativa certa é a ordem cronológica dos três pensadores', () => {
    for (const s of SEMENTES) {
      const inst = gerarEpoca(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const nomes = /destes três pensadores: (.+)\?/.exec(inst.enunciado)![1]!.split(', ')
      const correta = [...nomes].sort((a, b) => porNome(a).nascimento - porNome(b).nascimento).join(' → ')
      expect(textoCerto(inst), `s${s}`).toBe(correta)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) {
        expect(o.rotulo).not.toBe(correta)
        expect([...o.rotulo.split(' → ')].sort()).toEqual([...nomes].sort())
      }
    }
  })
})

describe('Influências e críticas (desafio)', () => {
  it('nível 1: discípulo de um mestre (relação “mestre e discípulo”), e os outros não têm relação com o mestre', () => {
    for (const s of SEMENTES) {
      const inst = gerarInfluencia(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const mestre = porNome(/discípulo de (.+)\?/.exec(inst.enunciado)![1]!)
      const discipulo = porNome(textoCerto(inst))
      expect(ARESTAS.some((a) => a.de === mestre.id && a.para === discipulo.id && a.tipo === 'mestre e discípulo'), `s${s}`).toBe(true)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(relacionados(mestre.id), o.rotulo).not.toContain(porNome(o.rotulo).id)
    }
  })
  it('nível 2: o crítico de um pensador (relação “crítica”), e os outros não têm relação com ele', () => {
    for (const s of SEMENTES) {
      const inst = gerarInfluencia(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const criticado = porNome(/criticou ideias de (.+)\?/.exec(inst.enunciado)![1]!)
      const critico = porNome(textoCerto(inst))
      expect(ARESTAS.some((a) => a.de === criticado.id && a.para === critico.id && a.tipo === 'crítica'), `s${s}`).toBe(true)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(relacionados(criticado.id)).not.toContain(porNome(o.rotulo).id)
    }
  })
  it('nível 3: o interlocutor certo tem relação com o pensador citado, e os outros não', () => {
    const pivos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarInfluencia(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const pivo = porNome(inst.enunciado.slice(inst.enunciado.lastIndexOf(' de ') + 4, -1))
      expect(relacionados(pivo.id), `s${s}`).toContain(porNome(textoCerto(inst)).id)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(relacionados(pivo.id), o.rotulo).not.toContain(porNome(o.rotulo).id)
      pivos.add(pivo.id)
    }
    expect(pivos.size).toBeGreaterThanOrEqual(4)
  })
})
