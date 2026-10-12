import { ERAS, EVENTOS, PERSONAGENS, RELACOES, evento } from '@/conteudo/historia/linhaDoTempo'
import { corrigirMulti } from '@/desafios/simples'
import { NIVEIS, SEMENTES, checarMulti, textoCerto } from '../../biologia/comum/checagens'
import { rngTeste } from '../../biologia/comum/checagens'
import { desafioCadeia, desafioOrdem, desafioQuem, gerarCausa, gerarIntruso, gerarLado, sortearConjuntoOrdenavel, type DadosCausa, type DadosIntruso, type DadosLado, type InstanciaLigar } from './geradores'

const porTitulo = (t: string) => EVENTOS.find((e) => e.titulo === t)!
const fimDe = (e: { inicio: number; fim?: number }) => e.fim ?? e.inicio
const sobrepoeIndep = (a: { inicio: number; fim?: number }, b: { inicio: number; fim?: number }) => !(fimDe(a) < b.inicio || fimDe(b) < a.inicio)

describe('Lado a lado: o que acontecia ao mesmo tempo', () => {
  it('a opção certa tem anos em comum com o acontecimento-base; as erradas ficam bem distantes', () => {
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarLado(rngTeste(s, nivel), nivel)
        checarMulti(inst, `n${nivel} s${s}`)
        const d = inst.dados as DadosLado
        const base = evento(d.base)
        const certa = porTitulo(textoCerto(inst))
        expect(sobrepoeIndep(certa, base), `n${nivel} s${s}: ${certa.titulo} × ${base.titulo}`).toBe(true)
        expect(certa.regiao).not.toBe(base.regiao)
        const margem = nivel === 1 ? 40 : nivel === 2 ? 20 : 15
        for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) {
          const e = porTitulo(o.rotulo)
          expect(e.regiao).toBe(certa.regiao)
          const dist = Math.max(e.inicio - fimDe(base), base.inicio - fimDe(e))
          expect(dist, `${e.titulo} × ${base.titulo}`).toBeGreaterThanOrEqual(margem)
        }
        // pergunta mostra o ano do acontecimento-base
        expect(inst.enunciado).toContain(String(base.inicio))
      }
  })
  it('há variedade de perguntas', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) vistos.add(gerarLado(rngTeste(s, 2), 2).enunciado)
    expect(vistos.size).toBeGreaterThan(15)
  })
})

describe('Causa e consequência', () => {
  it('nível 1: a certa é consequência registrada; as erradas começaram antes (e portanto não podem ser consequência)', () => {
    for (const s of SEMENTES) {
      const inst = gerarCausa(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const d = inst.dados as DadosCausa
      expect(d.tipo).toBe('consequenciaEvento')
      const x = evento(d.evento)
      const certa = porTitulo(textoCerto(inst))
      expect(RELACOES.some((r) => r.de === x.id && r.para === certa.id), `${x.id} → ${certa.id}`).toBe(true)
      for (const o of inst.opcoes.filter((q) => q.id !== inst.certa)) expect(fimDe(porTitulo(o.rotulo)), `${o.rotulo} antes de ${x.titulo}`).toBeLessThan(x.inicio)
    }
  })
  it('nível 2: a certa é causa registrada; as erradas começaram depois', () => {
    for (const s of SEMENTES) {
      const inst = gerarCausa(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const d = inst.dados as DadosCausa
      expect(d.tipo).toBe('causaEvento')
      const x = evento(d.evento)
      const certa = porTitulo(textoCerto(inst))
      expect(RELACOES.some((r) => r.para === x.id && r.de === certa.id), `${certa.id} → ${x.id}`).toBe(true)
      for (const o of inst.opcoes.filter((q) => q.id !== inst.certa)) expect(porTitulo(o.rotulo).inicio, `${o.rotulo} depois de ${x.titulo}`).toBeGreaterThan(fimDe(x))
    }
  })
  it('nível 3: o texto certo está na lista certa; a armadilha está na lista oposta; os outros são de acontecimentos de outra época', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarCausa(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const d = inst.dados as DadosCausa
      tipos.add(d.tipo)
      const x = evento(d.evento)
      const pedeCausa = d.tipo === 'causaTexto'
      expect(inst.enunciado).toContain(pedeCausa ? 'CAUSA' : 'CONSEQUÊNCIA')
      const certaLista = pedeCausa ? x.causas : x.consequencias
      const armadilhaLista = pedeCausa ? x.consequencias : x.causas
      expect(certaLista).toContain(textoCerto(inst))
      const outras = inst.opcoes.filter((q) => q.id !== inst.certa).map((q) => q.rotulo)
      expect(outras.filter((t) => armadilhaLista.includes(t))).toHaveLength(1)
      expect(outras.filter((t) => certaLista.includes(t))).toHaveLength(0)
      for (const t of outras.filter((q) => !armadilhaLista.includes(q))) {
        const dono = EVENTOS.filter((e) => e.causas.includes(t) || e.consequencias.includes(t))
        expect(dono.length, t).toBeGreaterThan(0)
        for (const e of dono) {
          if (pedeCausa) expect(e.inicio).toBeGreaterThan(fimDe(x) + 29)
          else expect(fimDe(e)).toBeLessThan(x.inicio - 29)
        }
      }
    }
    expect(tipos.size).toBe(2)
  })
  it('feedback da armadilha explica a troca entre causa e consequência', () => {
    const inst = gerarCausa(rngTeste(5, 3), 3)
    const armadilha = inst.opcoes.find((o) => (inst.porque[o.id] ?? '').includes('veio depois') || (inst.porque[o.id] ?? '').includes('veio antes'))
    expect(armadilha).toBeDefined()
    expect(corrigirMulti(inst, armadilha!.id).motivo).toBe('trocou causa por consequência')
  })
})

describe('Intruso', () => {
  it('três opções começam dentro do período; o intruso começa fora, na mesma região', () => {
    const eras = new Set<string>()
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarIntruso(rngTeste(s, nivel), nivel)
        checarMulti(inst, `n${nivel} s${s}`)
        const d = inst.dados as DadosIntruso
        const era = ERAS.find((e) => e.id === d.era)!
        eras.add(era.id)
        const intruso = porTitulo(textoCerto(inst))
        expect(intruso.id).toBe(d.intruso)
        expect(intruso.regiao).toBe(era.regiao)
        const margem = nivel === 1 ? 80 : nivel === 2 ? 40 : 15
        const dist = Math.max(intruso.inicio - era.fim, era.inicio - fimDe(intruso), 0)
        expect(dist, `${intruso.titulo} × ${era.nome}`).toBeGreaterThanOrEqual(margem)
        for (const o of inst.opcoes.filter((q) => q.id !== inst.certa)) {
          const m = porTitulo(o.rotulo)
          expect(m.regiao).toBe(era.regiao)
          expect(m.inicio).toBeGreaterThan(era.inicio)
          expect(m.inicio).toBeLessThan(era.fim)
        }
        expect(inst.enunciado).toContain(`${era.inicio}–${era.fim}`)
      }
    expect(eras.size).toBe(ERAS.length)
  })
})

describe('Ordene os fatos', () => {
  it('os cartões são uma permutação da ordem certa, que é a cronológica, com a lacuna mínima do nível', () => {
    const lacuna = { 1: 40, 2: 8, 3: 2 } as const
    const quantos = { 1: 4, 2: 5, 3: 6 } as const
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = desafioOrdem.gerar(s, nivel)
        expect(inst.ids).toHaveLength(quantos[nivel])
        expect([...inst.ids].sort()).toEqual([...inst.certa].sort())
        expect(inst.ids.join(), `n${nivel} s${s}: já em ordem`).not.toBe(inst.certa.join())
        const anos = inst.certa.map((id) => evento(id).inicio)
        for (let i = 1; i < anos.length; i++) expect(anos[i]! - anos[i - 1]!, `n${nivel} s${s}`).toBeGreaterThanOrEqual(lacuna[nivel])
        expect(inst.certa.every((id) => !evento(id).aprox)).toBe(true)
      }
  })
  it('a ordem certa é aceita; a invertida tem acerto parcial 0; uma troca de vizinhos explica o par errado', () => {
    for (const nivel of NIVEIS)
      for (const s of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const inst = desafioOrdem.gerar(s, nivel)
        const ok = desafioOrdem.corrigir(inst, inst.certa)
        expect(ok.correto).toBe(true)
        const inv = desafioOrdem.corrigir(inst, [...inst.certa].reverse())
        expect(inv.correto).toBe(false)
        expect(inv.parcial).toBe(0)
        const troca = [...inst.certa]
        ;[troca[1], troca[2]] = [troca[2]!, troca[1]!]
        const c = desafioOrdem.corrigir(inst, troca)
        expect(c.correto).toBe(false)
        // 1 par fora de ordem em n(n−1)/2
        const n = inst.certa.length
        expect(c.parcial).toBeCloseTo(1 - 1 / ((n * (n - 1)) / 2), 9)
        expect(c.feedback).toContain(evento(inst.certa[1]!).titulo)
        expect(c.feedback).toContain(String(evento(inst.certa[1]!).inicio))
        expect(c.motivo).toBe('ordem cronológica errada')
      }
  })
  it('o conjunto sorteado respeita a lacuna e não repete acontecimentos', () => {
    for (const s of SEMENTES) {
      const c = sortearConjuntoOrdenavel(rngTeste(s, 9), 6, 2)
      expect(new Set(c.map((e) => e.id)).size).toBe(6)
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) expect(Math.abs(c[i]!.inicio - c[j]!.inicio)).toBeGreaterThanOrEqual(2)
    }
  })
})

function checarLigar(inst: InstanciaLigar, rotulo: string) {
  const esq = inst.esquerda.map((x) => x.id)
  expect(new Set(esq).size, rotulo).toBe(esq.length)
  expect(Object.keys(inst.certa).sort(), rotulo).toEqual([...esq].sort())
  const dir = inst.direita.map((x) => x.id)
  expect(new Set(dir).size, rotulo).toBe(dir.length)
  for (const v of Object.values(inst.certa)) expect(dir, rotulo).toContain(v)
  expect(new Set(Object.values(inst.certa)).size, rotulo).toBe(esq.length)
  for (const id of esq) expect((inst.porque[id] ?? '').length, rotulo).toBeGreaterThan(30)
}

describe('Cadeia de causas', () => {
  it('cada ligação certa existe nos dados, sem ambiguidade entre os fatos escolhidos', () => {
    const quantos = { 1: 3, 2: 4, 3: 5 } as const
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = desafioCadeia.gerar(s, nivel)
        checarLigar(inst, `n${nivel} s${s}`)
        expect(inst.esquerda).toHaveLength(quantos[nivel])
        expect(inst.direita).toHaveLength(quantos[nivel] + (nivel === 3 ? 2 : 0))
        for (const [de, para] of Object.entries(inst.certa)) {
          expect(RELACOES.some((r) => r.de === de && r.para === para), `${de} → ${para}`).toBe(true)
          expect(evento(de).inicio).toBeLessThanOrEqual(fimDe(evento(para)))
          // nenhum outro fato da esquerda tem relação com esta consequência
          for (const outro of Object.keys(inst.certa).filter((x) => x !== de)) {
            expect(RELACOES.some((r) => r.de === outro && r.para === para), `${outro} → ${para} (ambíguo)`).toBe(false)
            expect(RELACOES.some((r) => r.para === outro && r.de === para)).toBe(false)
          }
        }
        // distratores sem nenhuma relação com os fatos da esquerda
        const certas = new Set(Object.values(inst.certa))
        for (const x of inst.direita.filter((d) => !certas.has(d.id)))
          for (const de of Object.keys(inst.certa)) expect(RELACOES.some((r) => (r.de === de && r.para === x.id) || (r.de === x.id && r.para === de)), `${de} × ${x.id}`).toBe(false)
      }
  })
  it('resposta certa é aceita; trocar duas ligações dá acerto parcial e explica o erro', () => {
    for (const nivel of NIVEIS)
      for (const s of [1, 2, 3, 4, 5, 6]) {
        const inst = desafioCadeia.gerar(s, nivel)
        expect(desafioCadeia.corrigir(inst, inst.certa).correto).toBe(true)
        const [a, b] = Object.keys(inst.certa)
        const troca = { ...inst.certa, [a!]: inst.certa[b!]!, [b!]: inst.certa[a!]! }
        const c = desafioCadeia.corrigir(inst, troca)
        expect(c.correto).toBe(false)
        expect(c.parcial).toBeCloseTo((inst.esquerda.length - 2) / inst.esquerda.length, 9)
        expect(c.feedback).toContain('é consequência de')
        expect(c.feedback).toContain(inst.porque[a!]!)
        const vazia = desafioCadeia.corrigir(inst, {})
        expect(vazia.correto).toBe(false)
        expect(vazia.parcial).toBe(0)
        expect(vazia.feedback).toContain('não ligou')
      }
  })
})

describe('Quem fez o quê', () => {
  it('cada personagem é ligado ao seu feito; os acontecimentos são todos diferentes e o nível define a proximidade', () => {
    const quantos = { 1: 3, 2: 4, 3: 5 } as const
    for (const nivel of NIVEIS)
      for (const s of SEMENTES) {
        const inst = desafioQuem.gerar(s, nivel)
        checarLigar(inst, `n${nivel} s${s}`)
        expect(inst.esquerda).toHaveLength(quantos[nivel])
        const personas = inst.esquerda.map((x) => PERSONAGENS.find((p) => p.id === x.id)!)
        expect(new Set(personas.map((p) => p.evento)).size).toBe(personas.length)
        for (const p of personas) {
          expect(inst.certa[p.id]).toBe(p.id)
          const feitoCerto = inst.direita.find((d) => d.id === p.id)!.rotulo
          expect(feitoCerto.toLowerCase()).toContain(p.feito.slice(0, 20).toLowerCase())
        }
        const evs = personas.map((p) => evento(p.evento))
        if (nivel === 1) for (let i = 0; i < evs.length; i++) for (let j = i + 1; j < evs.length; j++) expect(Math.abs(evs[i]!.inicio - evs[j]!.inicio)).toBeGreaterThanOrEqual(60)
        if (nivel === 3) {
          expect(new Set(evs.map((e) => e.regiao)).size).toBe(1)
          for (let i = 0; i < evs.length; i++) for (let j = i + 1; j < evs.length; j++) expect(Math.abs(evs[i]!.inicio - evs[j]!.inicio)).toBeLessThanOrEqual(45)
        }
      }
  })
  it('trocar dois feitos dá acerto parcial e diz a quem o feito pertence', () => {
    for (const nivel of NIVEIS)
      for (const s of [1, 2, 3, 4]) {
        const inst = desafioQuem.gerar(s, nivel)
        expect(desafioQuem.corrigir(inst, inst.certa).correto).toBe(true)
        const [a, b] = Object.keys(inst.certa)
        const troca = { ...inst.certa, [a!]: inst.certa[b!]!, [b!]: inst.certa[a!]! }
        const c = desafioQuem.corrigir(inst, troca)
        expect(c.correto).toBe(false)
        expect(c.feedback).toContain('A opção escolhida pertence a')
        expect(c.motivo).toBe('ligou personagem ao feito errado')
      }
  })
  it('cada feito, em um sorteio qualquer, tem o ano ou o contexto do acontecimento ligado (para a resolução)', () => {
    const inst = desafioQuem.gerar(7, 2)
    for (const p of PERSONAGENS.filter((x) => inst.esquerda.some((e) => e.id === x.id))) expect(inst.porque[p.id]).toContain(String(evento(p.evento).inicio))
  })
})
