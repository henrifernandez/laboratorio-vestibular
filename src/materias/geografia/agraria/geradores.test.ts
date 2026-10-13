import { BANCO_BRASIL, BANCO_FUNDIARIA, BANCO_SISTEMAS } from '@/conteudo/geografia/agraria'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { gerarBrasil, gerarFundiaria, gerarGini, gerarProducao, gerarSistemas } from './geradores'

const ler = (t: string) => Number(t.replace(/\./g, '').replace(',', '.'))

/** Gini pela definição das diferenças médias, com 1.000 estabelecimentos por faixa proporcional (cálculo à parte do código). */
function giniPorPares(faixas: { e: number; a: number }[]): number {
  const n = 1000
  const areas: number[] = []
  for (const f of faixas) for (let i = 0; i < Math.round((f.e / 100) * n); i++) areas.push(f.a / 100 / ((f.e / 100) * n))
  const media = areas.reduce((s, x) => s + x, 0) / areas.length
  let soma = 0
  for (const x of areas) for (const y of areas) soma += Math.abs(x - y)
  return soma / (2 * areas.length * areas.length * media)
}

describe('Concentração da terra e Gini (desafio)', () => {
  it('nível 1: a razão entre as áreas médias bate com a conta refeita a partir do enunciado', () => {
    for (const s of SEMENTES) {
      const inst = gerarGini(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`)
      const m = /(\d+)% dos estabelecimentos, os menores, ocupam (\d+)% da área total, e os outros (\d+)%, os maiores, ocupam (\d+)%/.exec(inst.enunciado)!
      const [a, b, a2, b2] = [1, 2, 3, 4].map((i) => Number(m[i]))
      expect(a! + a2!).toBe(100)
      expect(b! + b2!).toBe(100)
      const media = (parte: number, estab: number) => parte / estab
      expect(inst.resposta).toBeCloseTo(media(b2!, a2!) / media(b!, a!), 1)
      expect(inst.resposta).toBeGreaterThan(1.4)
    }
  })
  it.each([2, 3] as const)('nível %i: o Gini bate com o cálculo por pares de estabelecimentos', (nivel) => {
    const tamanhos = new Set<number>()
    for (const s of SEMENTES) {
      const inst = gerarGini(rngTeste(s, nivel), nivel)
      checarNum(inst, `n${nivel} s${s}`)
      const faixas = [...inst.enunciado.matchAll(/faixa \d: (\d+)% dos estabelecimentos com (\d+)% da área/g)].map((m) => ({ e: Number(m[1]), a: Number(m[2]) }))
      expect(faixas.length).toBe(nivel === 2 ? 2 : 3)
      expect(faixas.reduce((t, f) => t + f.e, 0)).toBe(100)
      expect(faixas.reduce((t, f) => t + f.a, 0)).toBe(100)
      // as áreas médias crescem: a curva fica sempre abaixo da diagonal
      faixas.slice(1).forEach((f, i) => expect(f.a / f.e).toBeGreaterThan(faixas[i]!.a / faixas[i]!.e))
      expect(Math.abs(inst.resposta - giniPorPares(faixas))).toBeLessThan(0.011)
      expect(inst.resposta).toBeGreaterThan(0.25)
      expect(inst.resposta).toBeLessThan(0.95)
      tamanhos.add(Math.round(inst.resposta * 100))
    }
    expect(tamanhos.size).toBeGreaterThan(5)
  })
  it('os erros típicos incluem a área sob a curva e a área entre a diagonal e a curva', () => {
    const inst = gerarGini(rngTeste(3, 2), 2)
    const motivos = inst.erros.map((e) => e.motivo)
    expect(motivos.some((m) => m?.includes('área'))).toBe(true)
  })
})

describe('Área, produtividade e produção (desafio)', () => {
  it('nível 1: produção = área × produtividade, em toneladas', () => {
    for (const s of SEMENTES) {
      const inst = gerarProducao(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`)
      const m = /cultiva ([\d.]+) hectares de milho com produtividade de ([\d,]+) toneladas por hectare/.exec(inst.enunciado)!
      expect(inst.resposta).toBeCloseTo(ler(m[1]!) * ler(m[2]!), 6)
    }
  })
  it('nível 2: a área é a produção dividida pela produtividade', () => {
    for (const s of SEMENTES) {
      const inst = gerarProducao(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`)
      const m = /colher ([\d.]+) toneladas de soja, em uma área cuja produtividade esperada é ([\d,]+) toneladas por hectare/.exec(inst.enunciado)!
      expect(inst.resposta * ler(m[2]!)).toBeCloseTo(ler(m[1]!), 6)
      expect(Number.isInteger(inst.resposta)).toBe(true)
    }
  })
  it('nível 3: os fatores se multiplicam: (1 + produção) = (1 + área) × (1 + produtividade)', () => {
    const sinais = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarProducao(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`)
      const m = /aumentou ([\d,]+)% em vinte anos, enquanto a área plantada (aumentou|diminuiu) ([\d,]+)%/.exec(inst.enunciado)!
      const prod = ler(m[1]!)
      const area = m[2] === 'aumentou' ? ler(m[3]!) : -ler(m[3]!)
      expect((1 + area / 100) * (1 + inst.resposta / 100)).toBeCloseTo(1 + prod / 100, 2)
      // a subtração de percentuais nunca é a resposta
      expect(Math.abs(inst.resposta - (prod - area))).toBeGreaterThan(inst.tolerancia)
      sinais.add(m[2]!)
    }
    expect(sinais.size).toBe(2)
  })
  it('o gráfico de decomposição só é enviado no nível 3', () => {
    expect(gerarProducao(rngTeste(1, 1), 1).dados).toBeUndefined()
    const d = gerarProducao(rngTeste(1, 3), 3).dados!
    expect(d.area1).toBeGreaterThan(0)
    expect(d.prod1).toBeGreaterThan(0)
  })
})

describe('Bancos de perguntas', () => {
  it.each([
    ['sistemas', BANCO_SISTEMAS],
    ['fundiária', BANCO_FUNDIARIA],
    ['agropecuária no Brasil', BANCO_BRASIL],
  ] as const)('%s: itens válidos, perguntas e respostas certas únicas e sem aspas de citação', (_n, banco) => {
    expect(banco.length).toBeGreaterThanOrEqual(12)
    for (const item of banco) expect(itemValido(item), item.pergunta).toBe(true)
    expect(new Set(banco.map((i) => i.pergunta)).size).toBe(banco.length)
    expect(new Set(banco.map((i) => i.certa.texto)).size).toBe(banco.length)
  })
  it.each([
    ['sistemas', gerarSistemas],
    ['fundiária', gerarFundiaria],
    ['agropecuária no Brasil', gerarBrasil],
  ] as const)('%s: gera perguntas completas em todos os níveis e usa todo o banco', (_n, gerar) => {
    for (const nivel of NIVEIS) for (const s of SEMENTES) checarMulti(gerar(rngTeste(s, nivel), nivel), `n${nivel} s${s}`)
    const vistas = new Set<string>()
    for (const nivel of NIVEIS) for (const s of SEMENTES) vistas.add(gerar(rngTeste(s, nivel), nivel).enunciado)
    expect(vistas.size).toBeGreaterThanOrEqual(10)
  })
  it('uma alternativa certa nunca repete o texto de uma errada', () => {
    for (const nivel of NIVEIS) for (const s of SEMENTES.slice(0, 40)) for (const gerar of [gerarSistemas, gerarFundiaria, gerarBrasil]) {
      const inst = gerar(rngTeste(s, nivel), nivel)
      expect(inst.opcoes.filter((o) => o.rotulo === textoCerto(inst))).toHaveLength(1)
    }
  })
})
