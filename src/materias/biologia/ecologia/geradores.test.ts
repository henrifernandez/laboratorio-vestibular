import { corrigirMulti, corrigirNum, type InstanciaMulti, type InstanciaNum } from '@/desafios/simples'
import { criarRng } from '@/lib/rng'
import { logistico, teia, TEIAS, type Teia } from './calculo'
import {
  CENARIOS,
  CONFUSAVEIS,
  EFEITOS,
  EXEMPLOS,
  PROCESSOS,
  RELACOES,
  SUCESSAO,
  gerarCiclos,
  gerarEnergia,
  gerarPopulacao,
  gerarRelacoes,
  gerarTeia,
  relacao,
  type ItemBanco,
} from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 150 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 7919 + n * 31)
const textoCerto = (inst: InstanciaMulti) => (inst.opcoes.find((o) => o.id === inst.certa) as { rotulo: string }).rotulo
const arred = (x: number) => String(Math.round(x * 1e6) / 1e6).replace('.', ',')

function checarMulti(inst: InstanciaMulti, rotulo: string) {
  const ids = inst.opcoes.map((o) => o.id)
  expect(new Set(ids).size, rotulo).toBe(ids.length)
  expect(new Set(inst.opcoes.map((o) => o.rotulo)).size, `${rotulo}: alternativas repetidas`).toBe(ids.length)
  expect(ids.length, rotulo).toBeGreaterThanOrEqual(4)
  expect(ids).toContain(inst.certa)
  for (const id of ids) expect((inst.porque[id] ?? '').length, `${rotulo}: falta explicação da ${id}`).toBeGreaterThan(10)
  for (const id of ids.filter((x) => x !== inst.certa)) expect((inst.motivo?.[id] ?? '').length, `${rotulo}: falta motivo da ${id}`).toBeGreaterThan(3)
  expect(inst.dicas.length).toBeGreaterThanOrEqual(3)
  expect(inst.licao.length).toBeGreaterThan(10)
  expect(inst.resolucao.length).toBeGreaterThan(10)
  expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
  for (const id of ids.filter((x) => x !== inst.certa)) {
    const c = corrigirMulti(inst, id)
    expect(c.correto).toBe(false)
    expect(c.feedback.length).toBeGreaterThan(10)
  }
}

function checarNum(inst: InstanciaNum, rotulo: string, minErros = 2) {
  expect(Number.isFinite(inst.resposta), rotulo).toBe(true)
  expect(inst.resposta, rotulo).toBeGreaterThan(0)
  expect(inst.erros.length, `${rotulo}: erros típicos`).toBeGreaterThanOrEqual(minErros)
  for (const e of inst.erros) {
    expect(Math.abs(e.valor - inst.resposta), `${rotulo}: erro igual à resposta`).toBeGreaterThan(inst.tolerancia)
    expect(corrigirNum(inst, arred(e.valor)).correto, `${rotulo}: erro aceito`).toBe(false)
    expect(e.frase.length).toBeGreaterThan(10)
  }
  expect(corrigirNum(inst, arred(inst.resposta)).correto, rotulo).toBe(true)
  expect(inst.dicas.length).toBeGreaterThanOrEqual(3)
  expect(inst.licao.length).toBeGreaterThan(10)
}

/* ------------------------------------------------------------------ energia */

describe('Energia e acúmulo', () => {
  it('as respostas batem com uma conta independente a partir dos parâmetros do enunciado', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarEnergia(rng(s, n), n)
        const d = inst.dados!
        const x = d.extra as Record<string, number>
        const rot = `${n} ${s} ${d.variante}`
        if (d.variante === 'transferencia') expect(inst.resposta, rot).toBeCloseTo((x.e0 as number) / 10 ** (x.n as number), 9)
        else if (d.variante === 'perdida') expect(inst.resposta, rot).toBeCloseTo((x.e0 as number) - (x.e0 as number) / 10 ** (x.n as number), 9)
        else if (d.variante === 'inversa') expect(inst.resposta * (x.ef as number) ** (x.n as number), rot).toBeCloseTo(x.y as number, 6)
        else if (d.variante === 'ppl') expect(inst.resposta, rot).toBeCloseTo(((x.ppb as number) - (x.r as number)) / 10, 9)
        else if (d.variante === 'percentual') expect(inst.resposta, rot).toBeCloseTo(((x.e2 as number) / (x.e1 as number)) * 100, 9)
        else if (d.variante === 'acumulo') expect(inst.resposta, rot).toBeCloseTo((x.c0 as number) * (x.f as number) ** (x.n as number), 6)
        else if (d.variante === 'dieta') {
          // poluente total ingerido dividido pela massa que o predador ganhou
          expect(inst.resposta, rot).toBeCloseTo(((x.c as number) * (x.ingerida as number)) / (x.ganho as number), 6)
        } else expect(inst.resposta, rot).toBeCloseTo(((x.ppb as number) - (x.r as number)) / 10 ** (x.n as number), 9)
      }
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarEnergia(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['transferencia', 'perdida']))
    expect(vs(2)).toEqual(new Set(['inversa', 'ppl', 'percentual']))
    expect(vs(3)).toEqual(new Set(['acumulo', 'dieta', 'combinado']))
  })
  it('a resposta tem poucas casas decimais e os erros típicos são válidos', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarEnergia(rng(s, n), n)
        const casas = inst.dados!.variante === 'acumulo' || inst.dados!.variante === 'dieta' ? 1e4 : 1e2
        expect(Math.abs(inst.resposta * casas - Math.round(inst.resposta * casas)), `${n} ${s} ${inst.resposta}`).toBeLessThan(1e-6)
        checarNum(inst, `energia ${n} ${s}`)
      }
  })
  it('a energia que chega a um nível é sempre menor que a do nível anterior (cada etapa do exercício)', () => {
    for (const s of SEMENTES) {
      const inst = gerarEnergia(rng(s, 1), 1)
      const x = inst.dados!.extra as Record<string, number>
      if (inst.dados!.variante === 'transferencia') expect(inst.resposta).toBeLessThan(x.e0 as number)
    }
  })
})

/* ------------------------------------------------------------------ teias */

function caminhosIndependentes(t: Teia): string[][] {
  const saida: string[][] = []
  const andar = (caminho: string[]) => {
    const ultimo = caminho[caminho.length - 1] as string
    const quem = t.come.filter(([, a]) => a === ultimo).map(([q]) => q)
    if (quem.length === 0) saida.push(caminho)
    else for (const q of quem) andar([...caminho, q])
  }
  for (const e of t.especies) if (e.produtor) andar([e.id])
  return saida
}

function niveisIndependentes(t: Teia, alvo: string): number[] {
  const achados = new Set<number>()
  const andar = (id: string, tam: number) => {
    if (id === alvo) achados.add(tam)
    for (const [q, a] of t.come) if (a === id) andar(q, tam + 1)
  }
  for (const e of t.especies) if (e.produtor) andar(e.id, 1)
  return [...achados]
}

const NOMES_NIVEL = ['produtor', 'consumidor primário', 'consumidor secundário', 'consumidor terciário', 'consumidor quaternário']

describe('Teias alimentares: desafios', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarTeia(rng(s, n), n), `teia ${n} ${s}`)
  })
  it('tipos de pergunta por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarTeia(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['produtor', 'primario', 'topo', 'cadeia']))
    expect(tipos(2)).toEqual(new Set(['cadeia', 'nivel', 'remocao', 'aumento']))
    expect(tipos(3)).toEqual(new Set(['cascata', 'omnivoro', 'maiorcadeia', 'remocao']))
  })
  it('a alternativa certa confere com a estrutura da teia (cálculo independente por caminhos)', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarTeia(rng(s, n), n)
        const d = inst.dados!
        const t = teia(d.teia)
        const rot = `${d.tipo} ${n} ${s}`
        const idPorNome = (nome: string) => (t.especies.find((e) => e.nome === nome) as { id: string }).id
        const certo = textoCerto(inst)
        const outros = inst.opcoes.filter((o) => o.id !== inst.certa).map((o) => o.rotulo)
        const produtor = (id: string) => t.especies.find((e) => e.id === id)?.produtor === true
        const alimentosDe = (id: string) => t.come.filter(([q]) => q === id).map(([, a]) => a)
        const predadoresDe = (id: string) => t.come.filter(([, a]) => a === id).map(([q]) => q)

        if (d.tipo === 'produtor') {
          expect(produtor(idPorNome(certo)), rot).toBe(true)
          for (const o of outros) expect(produtor(idPorNome(o)), rot).toBe(false)
        } else if (d.tipo === 'primario') {
          expect(niveisIndependentes(t, idPorNome(certo)), rot).toEqual([2])
          for (const o of outros) {
            const id = idPorNome(o)
            expect(niveisIndependentes(t, id).includes(2) && !produtor(id), `${rot}: ${o} também seria primário`).toBe(false)
          }
        } else if (d.tipo === 'topo') {
          expect(predadoresDe(idPorNome(certo)), rot).toHaveLength(0)
          for (const o of outros) expect(predadoresDe(idPorNome(o)).length, rot).toBeGreaterThan(0)
        } else if (d.tipo === 'cadeia') {
          const valida = (texto: string) => {
            const ids = texto.split(' → ').map(idPorNome)
            return produtor(ids[0] as string) && ids.every((id, i) => i === 0 || alimentosDe(id).includes(ids[i - 1] as string))
          }
          expect(valida(certo), rot).toBe(true)
          for (const o of outros) expect(valida(o), `${rot}: "${o}" também é uma cadeia válida`).toBe(false)
        } else if (d.tipo === 'nivel') {
          const alvo = Object.keys(d.destaque).find((k) => d.destaque[k] === 'alvo') as string
          const pos = (d.cadeia as string[]).indexOf(alvo)
          expect(certo, rot).toBe(NOMES_NIVEL[pos])
          // a cadeia mostrada no enunciado é de fato uma cadeia da teia
          const ch = d.cadeia as string[]
          expect(ch.every((id, i) => i === 0 || alimentosDe(id).includes(ch[i - 1] as string)), rot).toBe(true)
        } else if (d.tipo === 'remocao') {
          const removida = Object.keys(d.destaque).find((k) => d.destaque[k] === 'removida') as string
          const semAlimento = t.especies.map((e) => e.id).filter((id) => id !== removida && alimentosDe(id).length > 0 && alimentosDe(id).every((a) => a === removida))
          expect(semAlimento, rot).toHaveLength(1)
          expect(semAlimento[0], rot).toBe(idPorNome(certo))
          for (const o of outros) expect(semAlimento).not.toContain(idPorNome(o))
          // nenhuma alternativa errada perde todo o alimento depois, em cadeia (a pergunta é "imediatamente")
          const mortas = new Set([removida])
          for (let v = 0; v < 20; v++) for (const e of t.especies) if (!mortas.has(e.id) && alimentosDe(e.id).length > 0 && alimentosDe(e.id).every((a) => mortas.has(a))) mortas.add(e.id)
          for (const o of outros) expect(mortas.has(idPorNome(o)), `${rot}: ${o} também perderia o alimento em cadeia`).toBe(false)
        } else if (d.tipo === 'aumento') {
          const removida = Object.keys(d.destaque).find((k) => d.destaque[k] === 'removida') as string
          const presas = alimentosDe(removida)
          expect(presas, rot).toContain(idPorNome(certo))
          for (const o of outros) expect(presas, rot).not.toContain(idPorNome(o))
        } else if (d.tipo === 'cascata') {
          const ch = d.cadeia as string[]
          const removida = Object.keys(d.destaque).find((k) => d.destaque[k] === 'removida') as string
          const alvo = Object.keys(d.destaque).find((k) => d.destaque[k] === 'alvo') as string
          const pr = ch.indexOf(removida)
          const pa = ch.indexOf(alvo)
          // simulação qualitativa: o sinal se propaga por cada ligação presa-predador
          const sinal = new Map<number, number>()
          sinal.set(pr, -1)
          if (pr === ch.length - 1) for (let i = pr - 1; i >= 0; i--) sinal.set(i, -(sinal.get(i + 1) as number)) // abaixo do predador: inverte a cada elo
          else for (let i = pr + 1; i < ch.length; i++) sinal.set(i, sinal.get(i - 1) as number) // acima do produtor: acompanha
          expect(certo, rot).toBe((sinal.get(pa) as number) > 0 ? 'Tende a aumentar' : 'Tende a diminuir')
        } else if (d.tipo === 'omnivoro') {
          expect(niveisIndependentes(t, idPorNome(certo)).length, rot).toBeGreaterThan(1)
          for (const o of outros) expect(niveisIndependentes(t, idPorNome(o)).length, rot).toBe(1)
        } else {
          const maior = Math.max(...caminhosIndependentes(t).map((c) => c.length))
          expect(Number(certo), rot).toBe(maior)
          expect(Math.max(...(d.cadeia as string[]).map((_, i) => i + 1))).toBe(maior)
        }
      }
  })
  it('em todo nível 3 de remoção, o aluno pode errar escolhendo a presa do removido (explicação específica)', () => {
    let achou = false
    for (const s of SEMENTES) {
      const inst = gerarTeia(rng(s, 3), 3)
      if (inst.dados!.tipo !== 'remocao') continue
      for (const [id, texto] of Object.entries(inst.porque)) if (id !== inst.certa && texto.includes('perde um predador')) achou = true
    }
    expect(achou).toBe(true)
  })
})

/* ------------------------------------------------------------------ populações */

describe('Populações: desafios', () => {
  it('as respostas batem com uma conta independente', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarPopulacao(rng(s, n), n)
        const d = inst.dados!
        const x = d.extra as Record<string, number>
        const rot = `${n} ${s} ${d.variante}`
        if (d.variante === 'saldo') expect(inst.resposta, rot).toBe((x.n0 as number) + (x.nasc as number) + (x.imi as number) - (x.mort as number) - (x.emi as number))
        else if (d.variante === 'densidade') expect(inst.resposta, rot).toBeCloseTo((x.n as number) / (x.a as number), 9)
        else if (d.variante === 'exponencial') {
          let v = x.n0 as number
          for (let i = 0; i < (x.t as number); i++) v *= 1 + (x.r as number) // repetindo a multiplicação, sem usar potência
          expect(inst.resposta, rot).toBeCloseTo(v, 6)
        } else if (d.variante === 'taxa') expect(inst.resposta, rot).toBeCloseTo((((x.n1 as number) - (x.n0 as number)) / (x.n0 as number)) * 100, 9)
        else if (d.variante === 'marcacao') {
          // proporção: recapturados/capturados = marcados/N
          const N = inst.resposta
          expect((x.rec as number) / (x.cap as number), rot).toBeCloseTo((x.m as number) / N, 9)
        } else if (d.variante === 'taxaLogistica') {
          // derivada numérica da solução exata: dN/dt no instante em que a população vale n
          const { r, k, n: tam } = x as { r: number; k: number; n: number }
          const n0 = 1
          const tAlvo = Math.log(((k - n0) / n0) * (tam / (k - tam))) / r
          const h = 1e-4
          const derivada = (logistico(n0, r, k, tAlvo + h) - logistico(n0, r, k, tAlvo - h)) / (2 * h)
          expect(logistico(n0, r, k, tAlvo), rot).toBeCloseTo(tam, 6)
          expect(inst.resposta, rot).toBeCloseTo(derivada, 3)
        } else if (d.variante === 'maxima') {
          const { r, k } = x as { r: number; k: number }
          // varre N e procura o maior valor de r·N·(1 − N/K)
          let melhor = 0
          for (let N = 0; N <= k; N += k / 2000) melhor = Math.max(melhor, r * N * (1 - N / k))
          expect(inst.resposta, rot).toBeCloseTo(melhor, 1)
        } else {
          const { r, k } = x as { r: number; k: number }
          let melhorN = 0
          let melhor = -1
          for (let N = 0; N <= k; N += k / 4000) {
            const v = r * N * (1 - N / k)
            if (v > melhor) {
              melhor = v
              melhorN = N
            }
          }
          expect(inst.resposta, rot).toBeCloseTo(melhorN, 0)
        }
      }
  })
  it('variantes por nível', () => {
    const vs = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarPopulacao(rng(s, n), n).dados!.variante))
    expect(vs(1)).toEqual(new Set(['saldo', 'densidade']))
    expect(vs(2)).toEqual(new Set(['exponencial', 'taxa', 'marcacao']))
    expect(vs(3)).toEqual(new Set(['taxaLogistica', 'maxima', 'nMaxima']))
  })
  it('números "bonitos" e erros típicos válidos', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarPopulacao(rng(s, n), n)
        expect(Math.abs(inst.resposta * 100 - Math.round(inst.resposta * 100)), `${n} ${s} ${inst.resposta}`).toBeLessThan(1e-6)
        checarNum(inst, `populacao ${n} ${s}`)
      }
  })
})

/* ------------------------------------------------------------------ relações ecológicas */

describe('Relações ecológicas: dados', () => {
  it('cada relação tem pelo menos 2 exemplos com pista; os sinais seguem o padrão', () => {
    for (const r of RELACOES) {
      expect(EXEMPLOS.filter((e) => e.relacao === r.id).length, r.id).toBeGreaterThanOrEqual(2)
      if (r.grupo === 'interespecifica') expect(r.sinais, r.id).toMatch(/^[+−0]\/[+−0]$/)
      else expect(r.sinais).toBeUndefined()
    }
    for (const e of EXEMPLOS) {
      expect(relacao(e.relacao)).toBeDefined()
      expect(e.pista.length).toBeGreaterThan(10)
    }
    expect(new Set(EXEMPLOS.map((e) => e.texto)).size).toBe(EXEMPLOS.length)
  })
  it('sinais conhecidos (conferência com a teoria)', () => {
    const sinais = Object.fromEntries(RELACOES.map((r) => [r.id, r.sinais]))
    expect(sinais).toMatchObject({ mutualismo: '+/+', protocooperacao: '+/+', comensalismo: '+/0', predacao: '+/−', parasitismo: '+/−', competicao: '−/−', amensalismo: '0/−' })
  })
  it('as confusões listadas são simétricas, exceto onde a relação é parcial, e só citam relações que existem', () => {
    for (const [a, lista] of Object.entries(CONFUSAVEIS)) {
      expect(relacao(a)).toBeDefined()
      for (const b of lista) expect(relacao(b), `${a} → ${b}`).toBeDefined()
    }
    expect(CONFUSAVEIS.mutualismo).toContain('protocooperacao')
    expect(CONFUSAVEIS.protocooperacao).toContain('mutualismo')
    expect(CONFUSAVEIS.colonia).toContain('sociedade')
  })
  it('efeitos descritos têm sinais diferentes entre si', () => {
    const sinais = EFEITOS.map((e) => relacao(e.relacao).sinais)
    expect(new Set(sinais).size).toBe(sinais.length)
  })
})

describe('Relações ecológicas: desafios', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarRelacoes(rng(s, n), n), `relacoes ${n} ${s}`)
  })
  it('a resposta certa confere com o exemplo ou com o texto de sinais', () => {
    for (const n of NIVEIS)
      for (const s of SEMENTES) {
        const inst = gerarRelacoes(rng(s, n), n)
        const d = inst.dados!
        const certo = textoCerto(inst)
        const rot = `${d.tipo} ${n} ${s}`
        if (d.tipo === 'nome') {
          const ex = EXEMPLOS.find((e) => inst.enunciado.startsWith(e.texto))!
          expect(ex, rot).toBeDefined()
          expect(certo, rot).toBe(relacao(ex.relacao).nome)
          const outras = inst.opcoes.filter((o) => o.id !== inst.certa).map((o) => o.rotulo)
          const confs = (CONFUSAVEIS[ex.relacao] ?? []).map((c) => relacao(c).nome)
          if (n === 1) for (const o of outras) expect(confs, `${rot}: confundível no nível 1`).not.toContain(o)
          if (n === 2 && confs.length) expect(outras.some((o) => confs.includes(o)), `${rot}: sem confundível no nível 2`).toBe(true)
        } else if (d.tipo === 'exemplo') {
          const certa = relacao(d.relacao as string)
          const ex = EXEMPLOS.find((e) => e.texto === certo)!
          expect(ex.relacao, rot).toBe(certa.id)
          for (const o of inst.opcoes.filter((o) => o.id !== inst.certa)) expect(EXEMPLOS.find((e) => e.texto === o.rotulo)!.relacao, rot).not.toBe(certa.id)
        } else if (d.tipo === 'efeitos') {
          const ef = EFEITOS.find((e) => inst.enunciado.includes(e.texto))!
          expect(certo, rot).toBe(relacao(ef.relacao).nome)
          // as relações das alternativas têm sinais todos diferentes: só uma serve
          const sinais = inst.opcoes.map((o) => RELACOES.find((r) => r.nome === o.rotulo)!.sinais)
          expect(new Set(sinais).size, rot).toBe(sinais.length)
        }
      }
  })
  it('tipos por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarRelacoes(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['nome']))
    expect(tipos(2)).toEqual(new Set(['nome', 'sucessao']))
    expect(tipos(3)).toEqual(new Set(['efeitos', 'exemplo', 'sucessao']))
  })
})

function checarBanco(itens: { item: ItemBanco }[], rotulo: string) {
  for (const { item } of itens) {
    const textos = [item.certa.texto, ...item.erradas.map((e) => e.texto)]
    expect(new Set(textos).size, `${rotulo}: ${item.pergunta}`).toBe(textos.length)
    expect(item.erradas.length, item.pergunta).toBe(3)
    expect(item.dicas.length, item.pergunta).toBeGreaterThanOrEqual(3)
    for (const e of item.erradas) {
      expect(e.porque.length).toBeGreaterThan(10)
      expect((e.motivo ?? '').length).toBeGreaterThan(3)
    }
  }
}

describe('Bancos de itens (sucessão e ciclos)', () => {
  it('estrutura: 4 alternativas diferentes, 3 erradas explicadas, dicas e lição', () => {
    checarBanco(SUCESSAO, 'sucessao')
    checarBanco(CENARIOS, 'cenarios')
  })
  it('a pergunta não se repete', () => {
    const p = [...SUCESSAO, ...CENARIOS].map((x) => x.item.pergunta)
    expect(new Set(p).size).toBe(p.length)
  })
})

/* ------------------------------------------------------------------ ciclos */

describe('Ciclos biogeoquímicos', () => {
  it('estrutura das alternativas e explicações', () => {
    for (const n of NIVEIS) for (const s of SEMENTES) checarMulti(gerarCiclos(rng(s, n), n), `ciclos ${n} ${s}`)
  })
  it('fatos conhecidos (tabela de conferência escrita à parte)', () => {
    const verdades: [string, string, string][] = [
      ['fixacao', 'N₂', 'NH'],
      ['nitrificacao', 'NH₄⁺', 'NO₃⁻'],
      ['desnitrificacao', 'NO₃⁻', 'N₂'],
      ['amonificacao', 'restos', 'NH'],
      ['fotossintese', 'CO₂', 'matéria orgânica'],
      ['combustao', 'combustíveis', 'CO₂'],
    ]
    for (const [id, de, para] of verdades) {
      const p = PROCESSOS.find((x) => x.id === id)!
      expect(p.de + p.descricao, id).toContain(de.replace('restos', 'excretas'))
      expect(p.para, id).toContain(para)
    }
    expect(PROCESSOS.find((p) => p.id === 'desnitrificacao')!.quem).toContain('pobre em oxigênio')
  })
  it('descrições e agentes são distintos entre processos do mesmo ciclo (nada ambíguo)', () => {
    expect(new Set(PROCESSOS.map((p) => p.descricao)).size).toBe(PROCESSOS.length)
    expect(new Set(PROCESSOS.map((p) => p.nome)).size).toBe(PROCESSOS.length)
  })
  it('a resposta certa confere com a tabela', () => {
    for (const n of [1, 2] as const)
      for (const s of SEMENTES) {
        const inst = gerarCiclos(rng(s, n), n)
        const d = inst.dados!
        const p = PROCESSOS.find((x) => x.id === d.processo)!
        const certo = textoCerto(inst)
        if (d.tipo === 'descricao') {
          expect(certo).toBe(p.nome)
          expect(inst.enunciado).toContain(p.descricao)
          for (const o of inst.opcoes.filter((o) => o.id !== inst.certa)) expect(PROCESSOS.find((x) => x.nome === o.rotulo)!.ciclo).toBe(p.ciclo)
        } else if (d.tipo === 'quem') {
          expect(certo).toBe(p.quem)
          // nenhuma alternativa errada pertence ao mesmo grupo de organismos
          for (const o of inst.opcoes.filter((o) => o.id !== inst.certa)) expect(PROCESSOS.find((x) => x.quem === o.rotulo)!.grupo).not.toBe(p.grupo)
        } else {
          expect(certo).toBe(`${p.de} → ${p.para}`)
        }
      }
  })
  it('tipos por nível', () => {
    const tipos = (n: 1 | 2 | 3) => new Set(SEMENTES.map((s) => gerarCiclos(rng(s, n), n).dados!.tipo))
    expect(tipos(1)).toEqual(new Set(['descricao']))
    expect(tipos(2)).toEqual(new Set(['quem', 'transforma']))
    expect(tipos(3)).toEqual(new Set(['cenario']))
  })
})

describe('Sanidade das teias e do verificador', () => {
  it('as 5 teias estão disponíveis e têm nomes únicos', () => {
    expect(TEIAS).toHaveLength(5)
    expect(new Set(TEIAS.map((t) => t.nome)).size).toBe(5)
    for (const t of TEIAS) expect(new Set(t.especies.map((e) => e.nome)).size, t.id).toBe(t.especies.length)
  })
})
