import { geoDistance } from 'd3-geo'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'
import { BANCO_ORDEM, BANCO_ORGANIZACOES, BLOCOS, ESTAGIOS, FORA_DOS_BLOCOS, PASSOS_GEOPOLITICA, PONTOS, RESUMO_GEOPOLITICA } from '@/conteudo/geografia/geopolitica'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { carregarPaises } from '../comum/mapa'

const ASPAS = /["“”«»]/

describe('Blocos econômicos: dados', () => {
  it('a União Europeia tem 27 membros, sem repetição, e o Mercosul, o USMCA e a ASEAN têm os fundadores conhecidos', () => {
    const ue = BLOCOS.find((b) => b.id === 'ue')!
    expect(ue.membros).toHaveLength(27)
    expect(new Set(ue.membros.map((m) => m.id)).size).toBe(27)
    const nomes = (id: string) => BLOCOS.find((b) => b.id === id)!.membros.map((m) => m.nome).sort()
    expect(nomes('mercosul')).toEqual(['Argentina', 'Brasil', 'Paraguai', 'Uruguai'])
    expect(nomes('usmca')).toEqual(['Canadá', 'Estados Unidos', 'México'])
    expect(nomes('asean')).toEqual(['Filipinas', 'Indonésia', 'Malásia', 'Singapura', 'Tailândia'])
    // o Reino Unido saiu em 2020
    expect(nomes('ue')).not.toContain('Reino Unido')
    for (const n of ['Alemanha', 'França', 'Itália', 'Espanha', 'Portugal', 'Polônia', 'Suécia']) expect(nomes('ue')).toContain(n)
  })
  it('anos de criação conferidos e estágios conforme os manuais', () => {
    const criacao: Record<string, number> = { mercosul: 1991, ue: 1993, usmca: 2020, asean: 1967 }
    const estagio: Record<string, string> = { mercosul: 'uniao-aduaneira', ue: 'uniao-economica', usmca: 'zlc', asean: 'zlc' }
    for (const b of BLOCOS) {
      expect(b.criacao, b.sigla).toBe(criacao[b.id])
      expect(b.estagio, b.sigla).toBe(estagio[b.id])
    }
  })
  it('países das alternativas erradas não fazem parte do bloco da pergunta', () => {
    for (const b of BLOCOS) {
      const fora = FORA_DOS_BLOCOS[b.id] ?? []
      expect(fora.length, b.sigla).toBeGreaterThanOrEqual(3)
      for (const f of fora) expect(b.membros.some((m) => m.id === f.id), `${f.nome} em ${b.sigla}`).toBe(false)
    }
  })
  it('nenhum país está em dois blocos ao mesmo tempo (as perguntas de “qual bloco” têm uma só resposta)', () => {
    const ids = BLOCOS.flatMap((b) => b.membros.map((m) => m.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('os estágios têm numeração 1 a 4 e cada um acrescenta algo diferente', () => {
    expect(ESTAGIOS.map((e) => e.numero)).toEqual([1, 2, 3, 4])
    expect(new Set(ESTAGIOS.map((e) => e.acrescenta)).size).toBe(4)
  })
})

describe('Conferência com o arquivo do mapa', () => {
  it('todo país de bloco, de alternativa errada e de ponto existe no mapa (menos os pequenos demais, marcados)', async () => {
    const paises = await carregarPaises()
    const ids = new Set(paises.map((p) => String(p.id)))
    for (const b of BLOCOS)
      for (const m of b.membros) {
        if (m.semMapa) expect(ids.has(m.id), `${m.nome} deveria estar fora do arquivo`).toBe(false)
        else expect(ids.has(m.id), `${b.sigla}: ${m.nome} (${m.id}) não está no arquivo do mapa`).toBe(true)
      }
    for (const [b, fora] of Object.entries(FORA_DOS_BLOCOS)) for (const f of fora) expect(ids.has(f.id), `${b}: ${f.nome} (${f.id})`).toBe(true)
    // alguns membros da UE não aparecem no arquivo de 110 m (muito pequenos): só podem ser estes
    const semArquivo = BLOCOS.find((b) => b.id === 'ue')!.membros.filter((m) => !ids.has(m.id)).map((m) => m.nome)
    expect(semArquivo.length).toBeLessThanOrEqual(2)
    for (const n of semArquivo) expect(['Malta', 'Luxemburgo']).toContain(n)
  })
  it('os países vizinhos de cada ponto existem e o ponto fica a menos de 150 km de pelo menos um deles', async () => {
    const paises = await carregarPaises()
    const posicoes = (f: Feature) => {
      const g = f.geometry as Polygon | MultiPolygon
      const aneis: Position[][] = g.type === 'Polygon' ? g.coordinates : g.coordinates.flat()
      return aneis.flat()
    }
    for (const p of PONTOS) {
      const donos = paises.filter((x) => p.paisesIds.includes(String(x.id)))
      expect(donos.length, `${p.nome}: países vizinhos`).toBeGreaterThan(0)
      const dist = Math.min(...donos.flatMap((d) => posicoes(d as Feature).map((c) => geoDistance([p.lon, p.lat], [c[0] as number, c[1] as number]) * 6371)))
      expect(dist, `${p.nome}: ${Math.round(dist)} km do litoral dos países vizinhos`).toBeLessThan(150)
    }
  })
})

describe('Pontos estratégicos e bancos de perguntas', () => {
  it('ids únicos, dois mares diferentes por ponto, canais só Suez e Panamá, e latitude e longitude válidas', () => {
    expect(new Set(PONTOS.map((p) => p.id)).size).toBe(PONTOS.length)
    expect(PONTOS.filter((p) => p.tipo === 'canal').map((p) => p.id).sort()).toEqual(['panama', 'suez'])
    for (const p of PONTOS) {
      expect(p.liga[0]).not.toBe(p.liga[1])
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(p.lon)).toBeLessThanOrEqual(180)
      expect(p.importancia.length, p.nome).toBeGreaterThan(50)
    }
    // pares de mares distintos entre os pontos: cada pergunta “qual liga A e B” tem uma só resposta
    const pares = PONTOS.map((p) => [...p.liga].sort().join('|'))
    expect(new Set(pares).size).toBe(pares.length)
  })
  it.each([
    ['organizações', BANCO_ORGANIZACOES],
    ['ordem mundial', BANCO_ORDEM],
  ] as const)('%s: itens válidos, perguntas únicas e certas únicas', (_n, banco) => {
    expect(banco.length).toBeGreaterThanOrEqual(12)
    for (const item of banco) expect(itemValido(item), item.pergunta).toBe(true)
    expect(new Set(banco.map((i) => i.pergunta)).size).toBe(banco.length)
    expect(new Set(banco.map((i) => i.certa.texto)).size).toBe(banco.length)
  })
  it('Entenda e Resumo: perguntas válidas, resumo com fontes e sem citações entre aspas', () => {
    expect(PASSOS_GEOPOLITICA).toHaveLength(6)
    for (const p of PASSOS_GEOPOLITICA) {
      expect(p.pare.certa).toBeLessThan(p.pare.opcoes.length)
      expect(p.pare.explicacao.length).toBeGreaterThan(30)
      expect(ASPAS.test(p.texto.join(' ')), p.titulo).toBe(false)
    }
    for (const s of RESUMO_GEOPOLITICA) {
      expect((s.fontes ?? []).length, s.titulo).toBeGreaterThanOrEqual(3)
      expect(s.ideias.length).toBeGreaterThanOrEqual(3)
      expect(s.pegadinhas.length).toBeGreaterThanOrEqual(3)
    }
    const texto = RESUMO_GEOPOLITICA.flatMap((s) => s.ideias).join(' ')
    for (const dado of ['1945', '1991', '1944', '1995', '1949', '1955', '1960', '1993', '2020']) expect(texto).toContain(dado)
  })
})
