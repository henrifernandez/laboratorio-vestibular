import { CORRENTES, CORRENTE_DOS_PENSADORES, GRUPOS_INTRUSO, correntesAceitas } from '@/conteudo/filosofia/correntes'
import { PENSADORES } from '@/conteudo/filosofia/pensadores'
import { corrigirLigar } from '@/desafios/ligar'
import { NIVEIS, SEMENTES, checarMulti, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { gerarIntrusoFilosofia, gerarLigarConceitoFilosofia, gerarLigarCorrente, gerarTese } from './geradoresCorrentes'

/** Tabela escrita de novo, à parte, com o nome de cada corrente como aparece nos manuais (confere a tabela dos dados). */
const PRINCIPAL_CONFERIDA: Record<string, string> = {
  Sócrates: 'Filosofia socrática (diálogo e ética)',
  Platão: 'Idealismo platônico',
  Aristóteles: 'Realismo aristotélico',
  'Nicolau Maquiavel': 'Realismo político',
  'René Descartes': 'Racionalismo',
  'Thomas Hobbes': 'Contratualismo',
  'John Locke': 'Empirismo',
  'Jean-Jacques Rousseau': 'Contratualismo',
  'David Hume': 'Empirismo',
  'Immanuel Kant': 'Criticismo kantiano (idealismo crítico)',
  'Karl Marx': 'Materialismo histórico',
  'Friedrich Nietzsche': 'Crítica da moral e da metafísica (genealogia)',
  'Jean-Paul Sartre': 'Existencialismo',
  'Hannah Arendt': 'Filosofia política do século XX (ação e espaço público)',
}
const nomeDaCorrente = (id: string) => CORRENTES.find((c) => c.id === id)!.nome
const pensadorPorNome = (nome: string) => PENSADORES.find((p) => p.nome === nome)!

describe('Correntes: dados', () => {
  it('todo pensador tem uma corrente principal conferida e as demais correntes existem', () => {
    expect(Object.keys(CORRENTE_DOS_PENSADORES).sort()).toEqual(PENSADORES.map((p) => p.id).sort())
    for (const p of PENSADORES) {
      expect(nomeDaCorrente(CORRENTE_DOS_PENSADORES[p.id]!.principal), p.nome).toBe(PRINCIPAL_CONFERIDA[p.nome])
      for (const c of correntesAceitas(p.id)) expect(CORRENTES.some((x) => x.id === c), `${p.nome}: ${c}`).toBe(true)
    }
  })
  it('toda corrente tem ao menos um pensador, teses próprias e sem aspas, e correntes parecidas que existem', () => {
    const todas = CORRENTES.flatMap((c) => c.teses)
    expect(new Set(todas).size).toBe(todas.length)
    expect(new Set(CORRENTES.map((c) => c.id)).size).toBe(CORRENTES.length)
    for (const c of CORRENTES) {
      expect(PENSADORES.some((p) => correntesAceitas(p.id).includes(c.id)), `${c.nome}: sem pensador`).toBe(true)
      expect(c.teses.length, c.nome).toBeGreaterThanOrEqual(2)
      for (const t of [c.sintese, ...c.teses]) {
        expect(t.length, c.nome).toBeGreaterThan(40)
        expect(/["“”«»]/.test(t), `aspas em ${c.nome}`).toBe(false)
      }
      for (const o of c.parecidas) expect(CORRENTES.some((x) => x.id === o), `${c.nome}: ${o}`).toBe(true)
    }
  })
  it('grupos do intruso: membros pertencem de fato ao grupo, e os duvidosos e os membros não se repetem', () => {
    for (const g of GRUPOS_INTRUSO) {
      expect(g.membros.length, g.nome).toBeGreaterThanOrEqual(3)
      expect(g.membros.filter((m) => g.duvidosos.includes(m))).toEqual([])
      for (const m of [...g.membros, ...g.duvidosos]) expect(PENSADORES.some((p) => p.id === m), m).toBe(true)
    }
    const antigos = PENSADORES.filter((p) => p.epoca === 'Antiguidade').map((p) => p.id)
    expect([...GRUPOS_INTRUSO.find((g) => g.id === 'antiga')!.membros].sort()).toEqual(antigos.sort())
    const contemporaneos = PENSADORES.filter((p) => p.epoca === 'Contemporânea').map((p) => p.id)
    expect([...GRUPOS_INTRUSO.find((g) => g.id === 'contemporanea')!.membros].sort()).toEqual(contemporaneos.sort())
    // contratualismo: todos os membros têm a corrente nas aceitas
    for (const m of GRUPOS_INTRUSO.find((g) => g.id === 'contratualismo')!.membros) expect(correntesAceitas(m)).toContain('contratualismo')
    for (const m of GRUPOS_INTRUSO.find((g) => g.id === 'iluminismo')!.membros) expect(correntesAceitas(m)).toContain('iluminismo')
  })
})

describe('Pensador e corrente (ligar)', () => {
  it.each(NIVEIS)('nível %i: a tabela certa bate com a conferida, sem ligações ambíguas e com o número certo de itens', (nivel) => {
    const usados = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarLigarCorrente(rngTeste(s, nivel), nivel)
      const n = nivel + 2
      expect(inst.esquerda, `s${s}`).toHaveLength(n)
      expect(new Set(inst.esquerda.map((x) => x.id)).size).toBe(n)
      for (const item of inst.esquerda) {
        const p = PENSADORES.find((x) => x.id === item.id)!
        const certa = inst.direita.find((d) => d.id === inst.certa[item.id])!
        expect(certa.rotulo, `${p.nome}`).toBe(PRINCIPAL_CONFERIDA[p.nome])
        // nenhuma outra opção da direita serve ao pensador
        for (const d of inst.direita.filter((x) => x.id !== certa.id)) expect(correntesAceitas(p.id), `${p.nome} × ${d.rotulo}`).not.toContain(d.id)
        expect(inst.porque[item.id]).toContain(p.nome)
        usados.add(p.id)
      }
      const direita = inst.direita.map((d) => d.id)
      expect(new Set(direita).size).toBe(direita.length)
      expect(direita.length).toBe(new Set(Object.values(inst.certa)).size + (nivel === 3 ? 2 : 0))
      if (nivel === 1) expect(new Set(Object.values(inst.certa)).size).toBe(n)
      // a resposta certa sempre vale 100%; trocar uma ligação cai
      expect(corrigirLigar(inst, inst.certa, { motivo: 'm', licao: 'l' }).correto).toBe(true)
      const errada = { ...inst.certa, [inst.esquerda[0]!.id]: inst.direita.find((d) => d.id !== inst.certa[inst.esquerda[0]!.id])!.id }
      expect(corrigirLigar(inst, errada, { motivo: 'm', licao: 'l' }).correto).toBe(false)
    }
    expect(usados.size).toBeGreaterThanOrEqual(10)
  })
  it('as correntes dos distratores (nível 3) não servem a nenhum dos pensadores', () => {
    for (const s of SEMENTES) {
      const inst = gerarLigarCorrente(rngTeste(s, 3), 3)
      const certas = new Set(Object.values(inst.certa))
      for (const d of inst.direita.filter((x) => !certas.has(x.id))) for (const item of inst.esquerda) expect(correntesAceitas(item.id)).not.toContain(d.id)
    }
  })
})

describe('Qual corrente defende esta tese?', () => {
  it.each(NIVEIS)('nível %i: a tese pertence à corrente da alternativa certa e nenhuma corrente parecida entra como erro', (nivel) => {
    const vistas = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarTese(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      if (nivel < 3) {
        const tese = CORRENTES.flatMap((c) => c.teses.map((t) => ({ c, t }))).find(({ t }) => inst.enunciado.endsWith(t))
        expect(tese, `s${s}`).toBeDefined()
        expect(textoCerto(inst)).toBe(tese!.c.nome)
        for (const o of inst.opcoes) {
          const outra = CORRENTES.find((c) => c.nome === o.rotulo)!
          if (outra.id !== tese!.c.id) {
            expect(tese!.c.parecidas, `${tese!.c.nome} × ${outra.nome}`).not.toContain(outra.id)
            expect(outra.parecidas, `${tese!.c.nome} × ${outra.nome}`).not.toContain(tese!.c.id)
          }
        }
        vistas.add(tese!.c.id)
      } else {
        const alvo = CORRENTES.find((c) => inst.enunciado.includes(c.nome))!
        expect(alvo.teses).toContain(textoCerto(inst))
        for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(alvo.teses).not.toContain(o.rotulo)
        vistas.add(alvo.id)
      }
    }
    expect(vistas.size).toBeGreaterThanOrEqual(nivel === 1 ? 5 : 8)
  })
})

describe('Qual é o intruso? (Filosofia)', () => {
  it.each(NIVEIS)('nível %i: três pertencem ao grupo e o intruso não pertence a ele nem é duvidoso', (nivel) => {
    const grupos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarIntrusoFilosofia(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const g = GRUPOS_INTRUSO.find((x) => inst.enunciado.includes(`«${x.nome}»`))!
      grupos.add(g.id)
      const intruso = pensadorPorNome(textoCerto(inst))
      expect(g.membros, `${intruso.nome} é do grupo`).not.toContain(intruso.id)
      expect(g.duvidosos, `${intruso.nome} é duvidoso`).not.toContain(intruso.id)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(g.membros).toContain(pensadorPorNome(o.rotulo).id)
    }
    expect(grupos.size).toBe(nivel === 1 ? 2 : 1)
  })
})

describe('Pensador e conceito (ligar)', () => {
  it.each(NIVEIS)('nível %i: cada conceito certo pertence ao pensador, e os conceitos que sobram não pertencem a nenhum deles', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarLigarConceitoFilosofia(rngTeste(s, nivel), nivel)
      expect(inst.esquerda).toHaveLength(nivel + 2)
      for (const item of inst.esquerda) {
        const p = PENSADORES.find((x) => x.id === item.id)!
        expect(p.conceitos.map((c) => c.termo)).toContain(inst.certa[item.id])
        expect(inst.porque[item.id]).toContain(p.conceitos.find((c) => c.termo === inst.certa[item.id])!.sentido)
      }
      const certos = new Set(Object.values(inst.certa))
      expect(certos.size).toBe(nivel + 2)
      expect(inst.direita).toHaveLength(nivel + 2 + (nivel === 3 ? 2 : 0))
      for (const d of inst.direita.filter((x) => !certos.has(x.id))) for (const item of inst.esquerda) expect(PENSADORES.find((x) => x.id === item.id)!.conceitos.map((c) => c.termo)).not.toContain(d.id)
    }
  })
})
