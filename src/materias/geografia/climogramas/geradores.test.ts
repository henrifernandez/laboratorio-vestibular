import { CIDADES, CLIMAS } from '@/conteudo/geografia/climogramas'
import { corrigirNum } from '@/desafios/simples'
import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { MESES, amplitude, cidade, estacaoExtrema, hemisferioPelaTemperatura, mesesDaEstacao, mesesSecos, totalAnual } from './calculo'
import { gerarClima, gerarComparar, gerarEstacao, gerarGrafico, gerarLeitura } from './geradores'

const COM_NOME = (nome: string) => CIDADES.find((c) => c.nome === nome)!
const num = (s: string) => parseFloat(s.replace(/\./g, '').replace(',', '.'))

describe('Leitura de números', () => {
  it('nível 1: o valor lido é o do mês e da grandeza pedidos', () => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarLeitura(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`, 2)
      const c = cidade(inst.dados!.cidade)
      const mes = MESES.findIndex((m) => inst.enunciado.includes(` ${m}?`))
      expect(mes, inst.enunciado).toBeGreaterThanOrEqual(0)
      const temp = inst.enunciado.includes('temperatura')
      expect(inst.resposta, `s${s}`).toBe(temp ? c.temp[mes] : c.chuva[mes])
      // ler a outra grandeza, no mesmo mês, é um erro típico
      const outro = temp ? c.chuva[mes]! : c.temp[mes]!
      if (Math.abs(outro - inst.resposta) > 2 * inst.tolerancia) expect(corrigirNum(inst, String(outro).replace('.', ',')).correto).toBe(false)
      vistos.add(temp ? 'temp' : 'chuva')
    }
    expect(vistos.size).toBe(2)
  })
  it('nível 2: amplitude, total anual e meses secos conferem com a tabela independente', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarLeitura(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 2)
      const c = cidade(inst.dados!.cidade)
      const t = inst.dados!.tipo
      tipos.add(t)
      if (t === 'amplitude') expect(inst.resposta).toBeCloseTo(Math.max(...c.temp) - Math.min(...c.temp), 9)
      if (t === 'total') expect(inst.resposta).toBe(c.chuva.reduce((a, b) => a + b, 0))
      if (t === 'secos') expect(inst.resposta).toBe(c.chuva.filter((p, i) => p < 2 * (c.temp[i] as number)).length)
    }
    expect([...tipos].sort()).toEqual(['amplitude', 'secos', 'total'])
  })
  it('nível 3: média anual com uma casa, semestre de outubro a março e meses secos', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarLeitura(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`, 2)
      const c = cidade(inst.dados!.cidade)
      const t = inst.dados!.tipo
      tipos.add(t)
      if (t === 'media') expect(Math.abs(inst.resposta - c.temp.reduce((a, b) => a + b, 0) / 12)).toBeLessThanOrEqual(0.05 + 1e-9)
      if (t === 'semestre') expect(inst.resposta).toBe([9, 10, 11, 0, 1, 2].reduce((a, m) => a + (c.chuva[m] as number), 0))
    }
    expect([...tipos].sort()).toEqual(['media', 'secos', 'semestre'])
  })
  it('somar o ano todo ou a média mensal nunca é aceito como total anual', () => {
    for (const s of SEMENTES) {
      const inst = gerarLeitura(rngTeste(s, 2), 2)
      if (inst.dados!.tipo !== 'total') continue
      const c = cidade(inst.dados!.cidade)
      expect(corrigirNum(inst, String(Math.round(totalAnual(c) / 12))).correto).toBe(false)
    }
  })
})

describe('Que clima é este?', () => {
  it.each(NIVEIS)('nível %i: estrutura válida; a alternativa certa é o clima da cidade do gráfico', (nivel) => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarClima(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const c = cidade(inst.dados!.cidade)
      expect(textoCerto(inst)).toBe(CLIMAS[c.clima].nome)
      vistos.add(c.clima)
    }
    expect(vistos.size, 'variedade').toBeGreaterThanOrEqual(5)
  })
  it('nível 2 só usa climas do Brasil nas alternativas', () => {
    const brasil = new Set(['Equatorial úmido', 'Tropical (verão chuvoso e inverno seco)', 'Tropical úmido litorâneo', 'Semiárido', 'Tropical de altitude', 'Subtropical úmido'])
    for (const s of SEMENTES) for (const o of gerarClima(rngTeste(s, 2), 2).opcoes) expect(brasil.has(o.rotulo), o.rotulo).toBe(true)
  })
})

describe('Hemisfério e estações', () => {
  it.each(NIVEIS)('nível %i: estrutura válida; hemisfério e estação conferem com o gráfico', (nivel) => {
    const combos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarEstacao(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const d = inst.dados!
      const hem = hemisferioPelaTemperatura(d.clima)
      expect(hem, `s${s}: o hemisfério precisa ser inferível pela temperatura`).not.toBeNull()
      // conferência independente: soma dos trimestres, escrita aqui
      const trimestres: Record<string, number[]> = hem === 'S' ? { verao: [11, 0, 1], outono: [2, 3, 4], inverno: [5, 6, 7], primavera: [8, 9, 10] } : { verao: [5, 6, 7], outono: [8, 9, 10], inverno: [11, 0, 1], primavera: [2, 3, 4] }
      const soma = (e: string) => (trimestres[e] as number[]).reduce((a, m) => a + (d.clima.chuva[m] as number), 0)
      const ordem = Object.keys(trimestres).sort((a, b) => (d.variante === 'seca' ? soma(a) - soma(b) : soma(b) - soma(a)))
      const nome: Record<string, string> = { verao: 'verão', outono: 'outono', inverno: 'inverno', primavera: 'primavera' }
      expect(textoCerto(inst), `s${s}`).toBe(`Hemisfério ${hem === 'S' ? 'Sul' : 'Norte'}, ${nome[ordem[0] as string]}`)
      // a estação certa é nítida: a segunda colocada tem pelo menos 30% a mais de chuva (ou menos, no caso chuvoso)
      const folga = d.variante === 'seca' ? soma(ordem[1] as string) / Math.max(1, soma(ordem[0] as string)) : soma(ordem[0] as string) / Math.max(1, soma(ordem[1] as string))
      expect(folga, `s${s}`).toBeGreaterThanOrEqual(1.25)
      expect(estacaoExtrema(d.clima, hem!, d.variante).estacao).toBe(ordem[0])
      combos.add(`${hem}-${ordem[0]}-${d.variante}`)
    }
    expect(combos.size, 'variedade de combinações').toBeGreaterThanOrEqual(4)
  })
  it('as armadilhas existem: mesmos meses no outro hemisfério e mesmo nome de estação no outro hemisfério', () => {
    for (const s of SEMENTES.slice(0, 40)) {
      const inst = gerarEstacao(rngTeste(s, 1), 1)
      const hem = hemisferioPelaTemperatura(inst.dados!.clima)!
      const outra = hem === 'S' ? 'Norte' : 'Sul'
      const textos = inst.opcoes.map((o) => o.rotulo)
      expect(textos.filter((t) => t.includes(`Hemisfério ${outra}`)).length).toBe(2)
      expect(textos.filter((t) => t.includes(`Hemisfério ${hem === 'S' ? 'Sul' : 'Norte'}`)).length).toBe(2)
    }
  })
  it('as estações de cada hemisfério cobrem os 12 meses sem repetir', () => {
    for (const h of ['N', 'S'] as const) expect([...(['verao', 'outono', 'inverno', 'primavera'] as const).flatMap((e) => mesesDaEstacao(e, h))].sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, i) => i))
  })
})

describe('Comparar e escolher o gráfico', () => {
  const METRICA: Record<number, (c: (typeof CIDADES)[number]) => number> = { 1: totalAnual, 2: amplitude, 3: (c) => mesesSecos(c).length }
  it.each(NIVEIS)('nível %i: a alternativa certa tem o maior valor da grandeza, sem empate', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarComparar(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const cidades = inst.dados!.cidades.map(cidade)
      expect(new Set(cidades.map((c) => c.id)).size).toBe(4)
      const valores = cidades.map(METRICA[nivel]!)
      const idxCerta = inst.opcoes.findIndex((o) => o.id === inst.certa)
      expect(valores[idxCerta], `s${s}`).toBe(Math.max(...valores))
      expect(valores.filter((v) => v === Math.max(...valores)), `s${s}: empate`).toHaveLength(1)
    }
  })
  it.each(NIVEIS)('nível %i (gráfico): a miniatura certa é a do clima pedido', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarGrafico(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const cidades = inst.dados!.cidades.map(cidade)
      expect(new Set(cidades.map((c) => c.clima)).size).toBe(4)
      const idxCerta = inst.opcoes.findIndex((o) => o.id === inst.certa)
      const alvo = cidades[idxCerta]!
      if (nivel === 3) expect(inst.enunciado).toContain(CLIMAS[alvo.clima].assinatura)
      else expect(inst.enunciado.toLowerCase()).toContain(CLIMAS[alvo.clima].nome.toLowerCase())
      // a alternativa certa é a única cujo clima é o do enunciado
      for (const [i, c] of cidades.entries()) if (i !== idxCerta) expect(inst.enunciado.toLowerCase(), `s${s}`).not.toContain(CLIMAS[c.clima].nome.toLowerCase())
    }
  })
  it('as alternativas chamam-se Climograma A a D e o feedback cita valores', () => {
    const inst = gerarComparar(rngTeste(5, 1), 1)
    expect(inst.opcoes.map((o) => o.rotulo)).toEqual(['Climograma A', 'Climograma B', 'Climograma C', 'Climograma D'])
    for (const id of Object.keys(inst.porque)) expect(inst.porque[id]).toMatch(/\d/)
  })
})

describe('Dados usados nos geradores', () => {
  it('Petrolina, Brasília e Roma são as cidades com meses secos nítidos no nível 2 (secos)', () => {
    const nomes = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarLeitura(rngTeste(s, 2), 2)
      if (inst.dados!.tipo === 'secos') nomes.add(cidade(inst.dados!.cidade).nome)
    }
    expect(nomes.size).toBeGreaterThanOrEqual(3)
    expect(COM_NOME('Cairo').temp).toHaveLength(12)
  })
  it('o número lido no enunciado do nível 2 (amplitude) nunca depende da cidade ter temperatura negativa para o resultado ser positivo', () => {
    for (const s of SEMENTES) {
      const inst = gerarLeitura(rngTeste(s, 2), 2)
      expect(inst.resposta).toBeGreaterThan(0)
      expect(Number.isFinite(num(String(inst.resposta).replace('.', ',')))).toBe(true)
    }
  })
})
