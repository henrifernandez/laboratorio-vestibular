import { neighbors } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { FRONTEIRAS, PAISES, VIZINHOS_DO_BRASIL, paisPorId } from '@/conteudo/geografia/mapa-desafio'
import { carregarPaises } from '../comum/mapa'
import { areaNaTela, areaRealKm2, comparar, criarProjecao, PROJECOES } from './projecoes'
import { paresComUmVizinho } from './geradores'

type Geometrias = GeometryCollection<{ name: string }>['geometries']

async function arquivo() {
  const m = await import('world-atlas/countries-110m.json')
  const topo = m.default as unknown as Topology
  const geoms = (topo.objects.countries as GeometryCollection<{ name: string }>).geometries as Geometrias
  const vizinhos = neighbors(geoms)
  const idsDe = (i: number) => String(geoms[i]!.id)
  const mapa = new Map<string, { nome: string; vizinhos: string[] }>()
  geoms.forEach((g, i) => mapa.set(String(g.id), { nome: (g.properties as { name: string }).name, vizinhos: (vizinhos[i] as number[]).map(idsDe) }))
  return mapa
}

describe('Tabela de países conferida com o arquivo do mapa', () => {
  it('ids únicos; cada id existe e o nome em inglês é o do arquivo', async () => {
    const dados = await arquivo()
    expect(new Set(PAISES.map((p) => p.id)).size).toBe(PAISES.length)
    for (const p of PAISES) {
      expect(dados.has(p.id), `${p.nome}: id ${p.id}`).toBe(true)
      expect(dados.get(p.id)!.nome, `${p.nome}`).toBe(p.en)
    }
  })
  it('as dicas de localização não citam o nome do próprio país', () => {
    for (const p of PAISES) {
      expect(p.onde.length, p.nome).toBeGreaterThan(20)
      expect(p.onde.toLowerCase(), p.nome).not.toContain(p.nome.toLowerCase())
    }
  })
  it('a tabela de fronteiras da América do Sul é igual à calculada no mapa', async () => {
    const dados = await arquivo()
    for (const [id, viz] of Object.entries(FRONTEIRAS)) {
      const esperado = [...dados.get(id)!.vizinhos].sort()
      expect([...viz].sort(), `${paisPorId(id)?.nome}`).toEqual(esperado)
    }
  })
  it('o Brasil tem 10 vizinhos: nove países e a França (Guiana Francesa)', async () => {
    const dados = await arquivo()
    const viz = dados.get('076')!.vizinhos
    expect(viz).toHaveLength(10)
    expect(viz).toContain('250')
    expect(VIZINHOS_DO_BRASIL).toHaveLength(10)
    expect([...VIZINHOS_DO_BRASIL].sort()).toEqual([...viz].sort())
  })
  it('só o Chile e o Equador, na América do Sul, não fazem fronteira com o Brasil', async () => {
    const dados = await arquivo()
    const sul = PAISES.filter((p) => p.continente === 'América do Sul' && p.id !== '076').map((p) => p.id)
    const vizinhosBrasil = dados.get('076')!.vizinhos
    expect(sul.filter((id) => !vizinhosBrasil.includes(id)).sort()).toEqual(['152', '218'])
  })
  it('os pares de países com um único vizinho em comum realmente têm um só, no arquivo do mapa', async () => {
    const dados = await arquivo()
    const pares = paresComUmVizinho()
    expect(pares.length).toBeGreaterThan(10)
    for (const { a, b, comum } of pares) {
      const va = dados.get(a)!.vizinhos
      const vb = dados.get(b)!.vizinhos
      const comuns = va.filter((x) => vb.includes(x) && x !== a && x !== b)
      expect(comuns, `${a}-${b}`).toEqual([comum])
    }
  })
})

describe('Projeções e áreas (com os contornos reais)', () => {
  it('áreas reais calculadas na esfera: Brasil ≈ 8,5 milhões de km² e Groenlândia ≈ 2,2 milhões', async () => {
    const paises = await carregarPaises()
    const br = paises.find((p) => String(p.id) === '076')!
    const gl = paises.find((p) => String(p.id) === '304')!
    expect(areaRealKm2(br) / 1e6).toBeGreaterThan(8.3)
    expect(areaRealKm2(br) / 1e6).toBeLessThan(8.7)
    expect(areaRealKm2(gl) / 1e6).toBeGreaterThan(2.0)
    expect(areaRealKm2(gl) / 1e6).toBeLessThan(2.4)
  })
  it('Equal Earth é equivalente: a razão das áreas na tela é a razão real', async () => {
    const paises = await carregarPaises()
    const par = (id: string) => paises.find((p) => String(p.id) === id)!
    const { projecao } = criarProjecao('equal-earth')
    for (const [a, b] of [['304', '076'], ['643', '036'], ['356', '124'], ['840', '156']] as const) {
      const r = comparar(par(a), par(b), projecao)
      expect(r.aparente / r.real, `${a}/${b}`).toBeGreaterThan(0.98)
      expect(r.aparente / r.real, `${a}/${b}`).toBeLessThan(1.02)
    }
  })
  it('Mercator amplia a Groenlândia: ela parece várias vezes maior que o Brasil, que é 4 vezes maior', async () => {
    const paises = await carregarPaises()
    const gl = paises.find((p) => String(p.id) === '304')!
    const br = paises.find((p) => String(p.id) === '076')!
    const { projecao } = criarProjecao('mercator')
    const r = comparar(gl, br, projecao)
    expect(r.real).toBeLessThan(0.3)
    expect(r.aparente).toBeGreaterThan(3)
    // na equirretangular a deformação é bem menor
    const eq = comparar(gl, br, criarProjecao('equirretangular').projecao)
    expect(eq.aparente).toBeLessThan(r.aparente / 3)
  })
  it('perto do Equador a ampliação de Mercator é pequena; a Groenlândia é ampliada mais que o Brasil', async () => {
    const paises = await carregarPaises()
    const gl = paises.find((p) => String(p.id) === '304')!
    const br = paises.find((p) => String(p.id) === '076')!
    const m = criarProjecao('mercator').projecao
    const e = criarProjecao('equal-earth').projecao
    const fator = (p: typeof gl) => areaNaTela(p, m) / areaNaTela(p, e)
    expect(fator(gl) / fator(br)).toBeGreaterThan(3)
  })
  it('as alturas dos desenhos são plausíveis e há três projeções descritas', () => {
    expect(criarProjecao('equirretangular').altura).toBeGreaterThan(300)
    expect(criarProjecao('equirretangular').altura).toBeLessThan(340)
    expect(criarProjecao('equal-earth').altura).toBeGreaterThan(290)
    expect(criarProjecao('equal-earth').altura).toBeLessThan(330)
    expect(criarProjecao('mercator').altura).toBeGreaterThan(420)
    expect(PROJECOES.map((p) => p.id)).toEqual(['equirretangular', 'mercator', 'equal-earth'])
  })
})
