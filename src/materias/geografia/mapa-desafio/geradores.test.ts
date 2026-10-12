import { neighbors } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { BANCO_COORDENADAS, BANCO_PROJECAO, PAISES } from '@/conteudo/geografia/mapa-desafio'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { gerarCoordenadas, gerarEscala, gerarFronteiras, gerarPais, gerarProjecao } from './geradores'

const num = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'))
const idDoNome = (nome: string) => PAISES.find((p) => p.nome === nome)!.id

/** Vizinhos de cada país, calculados no arquivo do mapa (conferência independente da tabela do código). */
async function vizinhosDoArquivo() {
  const m = await import('world-atlas/countries-110m.json')
  const topo = m.default as unknown as Topology
  const geoms = (topo.objects.countries as GeometryCollection).geometries
  const viz = neighbors(geoms)
  const mapa = new Map<string, Set<string>>()
  geoms.forEach((g, i) => mapa.set(String(g.id), new Set((viz[i] as number[]).map((j) => String(geoms[j]!.id)))))
  return mapa
}

/** "23° S, 46° O" → { lat: -23, lon: -46 } */
function lerCoordenada(s: string) {
  const m = /(\d+)° ([NS]), (\d+)° ([LO])/.exec(s)!
  return { lat: Number(m[1]) * (m[2] === 'S' ? -1 : 1), lon: Number(m[3]) * (m[4] === 'O' ? -1 : 1) }
}
const quadrante = (c: { lat: number; lon: number }) => `${c.lat > 0 ? 'Norte' : 'Sul'} e ${c.lon > 0 ? 'Oriental' : 'Ocidental'}`

describe('Coordenadas (desafio)', () => {
  it('nível 1: a alternativa certa combina o hemisfério da latitude com o da longitude', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarCoordenadas(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      const c = lerCoordenada(inst.enunciado)
      expect(textoCerto(inst), `s${s}: ${inst.enunciado}`).toBe(`Hemisférios ${quadrante(c)}`)
      expect(inst.dados!.pontos![0]).toMatchObject(c)
      vistos.add(textoCerto(inst))
    }
    expect(vistos.size).toBe(4)
  })
  it('nível 2: entre os quatro pontos, só o certo está no quadrante pedido', () => {
    for (const s of SEMENTES) {
      const inst = gerarCoordenadas(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const pedido = /Hemisférios (Norte|Sul) e (Oriental|Ocidental)\?/.exec(inst.enunciado)!
      const alvo = `${pedido[1]} e ${pedido[2]}`
      const quadrantes = inst.opcoes.map((o) => quadrante(lerCoordenada(o.rotulo)))
      expect(new Set(quadrantes).size, `s${s}: um ponto em cada quadrante`).toBe(4)
      const idx = inst.opcoes.findIndex((o) => o.id === inst.certa)
      expect(quadrantes[idx], `s${s}`).toBe(alvo)
      expect(inst.dados!.pontos).toHaveLength(4)
      // a letra do ponto no enunciado ("Ponto 3") é o número escrito no mapa
      const n = /^Ponto (\d):/.exec(textoCerto(inst))![1]
      const p = inst.dados!.pontos![Number(n) - 1]!
      expect(p.rotulo).toBe(n)
      expect(quadrante(p)).toBe(alvo)
    }
  })
  it('nível 3 vem do banco de perguntas, que está bem formado', () => {
    for (const s of SEMENTES.slice(0, 40)) checarMulti(gerarCoordenadas(rngTeste(s, 3), 3), `s${s}`)
    for (const it of BANCO_COORDENADAS) expect(itemValido(it), it.pergunta).toBe(true)
  })
})

describe('Escala (desafio)', () => {
  it('nível 1: distância real (km) = cm × denominador ÷ 100.000', () => {
    for (const s of SEMENTES) {
      const inst = gerarEscala(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`, 2)
      const m = /escala 1:([\d.]+), dois pontos estão a (\d+) cm/.exec(inst.enunciado)!
      expect(inst.resposta, `s${s}`).toBeCloseTo((Number(m[2]) * num(m[1]!)) / 100_000, 9)
      expect(inst.dados!.denominador).toBe(num(m[1]!))
    }
  })
  it('nível 2: centímetros no mapa = km × 100.000 ÷ denominador', () => {
    for (const s of SEMENTES) {
      const inst = gerarEscala(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 2)
      const m = /estão a ([\d.]+) km uma da outra\. Em um mapa de escala 1:([\d.]+)/.exec(inst.enunciado)!
      expect(inst.resposta, `s${s}`).toBeCloseTo((num(m[1]!) * 100_000) / num(m[2]!), 9)
      expect(Number.isInteger(inst.resposta * 2)).toBe(true)
    }
  })
  it('nível 3: denominador (em milhares) = km × 100.000 ÷ cm ÷ 1.000', () => {
    for (const s of SEMENTES) {
      const inst = gerarEscala(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`, 2)
      const m = /(\d+) cm representam ([\d.,]+) km/.exec(inst.enunciado)!
      expect(inst.resposta, `s${s}: ${inst.enunciado}`).toBeCloseTo(((num(m[2]!) * 100_000) / Number(m[1])) / 1000, 6)
    }
  })
})

describe('Qual é o país? (desafio)', () => {
  it.each(NIVEIS)('nível %i: a alternativa certa é o país em destaque, e as outras são países diferentes', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarPais(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const d = inst.dados!
      const destacado = Object.entries(d.destaques).filter(([, cor]) => cor === 'var(--geo-quente)').map(([id]) => id)
      expect(destacado, `s${s}`).toHaveLength(1)
      expect(textoCerto(inst)).toBe(PAISES.find((p) => p.id === destacado[0])!.nome)
      expect(d.centroDe).toBe(destacado[0])
      const sul = PAISES.filter((p) => p.continente === 'América do Sul').map((p) => p.nome)
      if (nivel !== 2) {
        expect(d.regiao).toBe('america-do-sul')
        for (const o of inst.opcoes) expect(sul, `s${s}: ${o.rotulo}`).toContain(o.rotulo)
      } else {
        expect(d.regiao).toBe('mundo')
        expect(inst.opcoes.map((o) => o.rotulo)).not.toContain('Brasil')
      }
      // o enunciado e o texto alternativo não revelam o nome
      expect(d.descricao).not.toContain(textoCerto(inst))
      expect(inst.enunciado).not.toContain(textoCerto(inst))
    }
  })
  it('os países sorteados variam', () => {
    for (const nivel of NIVEIS) {
      const nomes = new Set(SEMENTES.map((s) => textoCerto(gerarPais(rngTeste(s, nivel), nivel))))
      expect(nomes.size, `nível ${nivel}`).toBeGreaterThanOrEqual(5)
    }
  })
})

describe('Projeções (desafio)', () => {
  it('as perguntas vêm do banco, que está bem formado', () => {
    for (const nivel of NIVEIS) for (const s of SEMENTES.slice(0, 40)) checarMulti(gerarProjecao(rngTeste(s, nivel), nivel), `n${nivel} s${s}`)
    for (const it of BANCO_PROJECAO) expect(itemValido(it), it.pergunta).toBe(true)
  })
})

describe('Fronteiras (desafio)', () => {
  it('nível 1: o certo faz fronteira com o Brasil (conforme o arquivo do mapa); os outros, não', async () => {
    const viz = await vizinhosDoArquivo()
    for (const s of SEMENTES) {
      const inst = gerarFronteiras(rngTeste(s, 1), 1)
      checarMulti(inst, `s${s}`)
      expect(viz.get('076')!.has(idDoNome(textoCerto(inst))), `s${s}`).toBe(true)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(viz.get('076')!.has(idDoNome(o.rotulo)), `s${s}: ${o.rotulo}`).toBe(false)
    }
  })
  it('nível 2: o certo é Chile ou Equador; os outros fazem fronteira com o Brasil', async () => {
    const viz = await vizinhosDoArquivo()
    const sem = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarFronteiras(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      expect(viz.get('076')!.has(idDoNome(textoCerto(inst)))).toBe(false)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(viz.get('076')!.has(idDoNome(o.rotulo)), `s${s}`).toBe(true)
      sem.add(textoCerto(inst))
    }
    expect(sem).toEqual(new Set(['Chile', 'Equador']))
  })
  it('nível 3: vizinho em comum de dois países, ou a contagem de vizinhos do Brasil', async () => {
    const viz = await vizinhosDoArquivo()
    let pares = 0
    let contagens = 0
    for (const s of SEMENTES) {
      const inst = gerarFronteiras(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const par = /Qual país faz fronteira com (.+) e também com (.+)\?/.exec(inst.enunciado)
      if (par) {
        pares++
        const [a, b] = [idDoNome(par[1]!), idDoNome(par[2]!)]
        const toca = (id: string) => viz.get(a)!.has(id) && viz.get(b)!.has(id)
        expect(toca(idDoNome(textoCerto(inst))), `s${s}`).toBe(true)
        for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(toca(idDoNome(o.rotulo)), `s${s}: ${o.rotulo}`).toBe(false)
      } else {
        contagens++
        expect(textoCerto(inst)).toBe(`${viz.get('076')!.size} vizinhos`)
      }
    }
    expect(pares).toBeGreaterThan(40)
    expect(contagens).toBeGreaterThan(20)
  })
})
