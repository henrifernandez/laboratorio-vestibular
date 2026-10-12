import { corrigirNum } from '@/desafios/simples'
import { BANCO_EVIDENCIAS, EXEMPLOS_PLACAS } from '@/conteudo/geografia/placas'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { LIMITES, type IdLimite } from './calculo'
import { ENCONTRO, PISTAS_LIMITE, RESUMO_OPCAO, gerarDeslocamento, gerarEvidencia, gerarExemplo, gerarLimite } from './geradores'

const IDS = Object.keys(LIMITES) as IdLimite[]
const inverso = (texto: string) => IDS.find((id) => RESUMO_OPCAO[id] === texto || ENCONTRO[id] === texto) as IdLimite

describe('Limite entre placas', () => {
  it('nível 1 e 2: o enunciado leva à alternativa certa, conferido por tabela escrita à parte', () => {
    const TABELA: Record<string, IdLimite> = {
      'oceânica e uma placa continental se aproximam': 'subducao-continental',
      'continental e uma placa oceânica se aproximam': 'subducao-continental',
      'oceânica e uma placa oceânica se afastam': 'dorsal',
      'oceânica e uma placa continental deslizam': 'transformante',
      'continental e uma placa continental se aproximam': 'colisao',
      'oceânica e uma placa oceânica se aproximam': 'subducao-oceanica',
      'continental e uma placa continental se afastam': 'rifte',
      'continental e uma placa continental deslizam': 'transformante',
    }
    const vistos = new Set<IdLimite>()
    for (const nivel of [1, 2] as const)
      for (const s of SEMENTES) {
        const inst = gerarLimite(rngTeste(s, nivel), nivel)
        checarMulti(inst, `n${nivel} s${s}`)
        const chave = Object.keys(TABELA).find((k) => inst.enunciado.includes(k))
        expect(chave, inst.enunciado).toBeDefined()
        const esperado = TABELA[chave as string] as IdLimite
        expect(inverso(textoCerto(inst)), inst.enunciado).toBe(esperado)
        vistos.add(esperado)
        expect(inst.dados?.limite).toBe(esperado)
      }
    expect(vistos.size).toBe(6)
  })
  it('nível 3: a primeira pista é típica do limite certo e de nenhum outro', () => {
    const vistos = new Set<IdLimite>()
    for (const s of SEMENTES) {
      const inst = gerarLimite(rngTeste(s, 3), 3)
      checarMulti(inst, `s${s}`)
      const certo = inverso(textoCerto(inst))
      const pista = PISTAS_LIMITE[certo][0] as string
      expect(inst.enunciado, `s${s}`).toContain(pista)
      for (const id of IDS.filter((x) => x !== certo)) expect(inst.enunciado, `s${s}: pista do ${id}`).not.toContain(PISTAS_LIMITE[id][0] as string)
      vistos.add(certo)
    }
    expect(vistos.size).toBe(6)
  })
  it('as pistas de um limite não se repetem em outro', () => {
    const todas = IDS.flatMap((id) => PISTAS_LIMITE[id])
    expect(new Set(todas).size).toBe(todas.length)
  })
})

describe('Casos reais', () => {
  it('os exemplos têm pistas e descrição, e o tipo de limite bate com a tabela escrita à parte', () => {
    const TIPO: Record<string, string> = {
      andes: 'subducao-continental',
      himalaia: 'colisao',
      marianas: 'subducao-oceanica',
      'dorsal-atlantica': 'dorsal',
      'rifte-africano': 'rifte',
      'san-andreas': 'transformante',
      alpes: 'colisao',
      brasil: 'intraplaca',
    }
    expect(EXEMPLOS_PLACAS.map((e) => e.id).sort()).toEqual(Object.keys(TIPO).sort())
    for (const e of EXEMPLOS_PLACAS) {
      expect(e.limite, e.id).toBe(TIPO[e.id])
      expect(e.pistas.length, e.id).toBeGreaterThanOrEqual(2)
      expect(e.descricao.length).toBeGreaterThan(30)
    }
  })
  it.each(NIVEIS)('nível %i: estrutura válida, o lugar do enunciado combina com a resposta', (nivel) => {
    const vistos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarExemplo(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const ex = EXEMPLOS_PLACAS.find((e) => e.id === inst.dados?.exemplo)!
      vistos.add(ex.id)
      if (nivel === 2) expect(textoCerto(inst)).toBe(ex.nome)
      else expect(inst.enunciado).toContain(ex.nome)
    }
    expect(vistos.size, 'variedade de exemplos').toBeGreaterThanOrEqual(6)
  })
  it('nível 2: nunca coloca Himalaia e Alpes juntos quando um deles é o certo', () => {
    for (const s of SEMENTES) {
      const inst = gerarExemplo(rngTeste(s, 2), 2)
      const nomes = inst.opcoes.map((o) => o.rotulo)
      if (textoCerto(inst) === 'Himalaia') expect(nomes).not.toContain('Alpes')
      expect(textoCerto(inst)).not.toBe('Alpes')
    }
  })
})

describe('Evidências', () => {
  it('o banco tem itens bem formados (alternativas diferentes, 3 dicas e motivos)', () => {
    expect(BANCO_EVIDENCIAS.length).toBeGreaterThanOrEqual(6)
    for (const it of BANCO_EVIDENCIAS) expect(itemValido({ pergunta: it.pergunta, certa: it.certa, erradas: it.erradas, licao: it.licao, dicas: it.dicas }), it.pergunta).toBe(true)
  })
  it.each(NIVEIS)('nível %i: estrutura válida', (nivel) => {
    for (const s of SEMENTES) checarMulti(gerarEvidencia(rngTeste(s, nivel), nivel), `n${nivel} s${s}`)
  })
})

describe('Deslocamento', () => {
  const extrai = (txt: string) => [...txt.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => parseFloat((m[1] as string).replace(/\./g, '').replace(',', '.')))
  it('nível 1: a resposta é v × t × 10, conferida por conversão de unidades', () => {
    for (const s of SEMENTES) {
      const inst = gerarDeslocamento(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`, 3)
      const [v, t] = extrai(inst.enunciado) as [number, number]
      const cm = v * (t * 1e6)
      expect(inst.resposta, `s${s}`).toBeCloseTo(cm / 1e5, 6)
      expect(corrigirNum(inst, String(v * t)).correto).toBe(false)
    }
  })
  it('nível 2: tempo e velocidade batem com a conversão de unidades', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarDeslocamento(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 3)
      const n = extrai(inst.enunciado)
      if (inst.dados?.tipo === 'tempo') {
        const [d, v] = n as [number, number]
        expect(inst.resposta * v * 10, `s${s}`).toBeCloseTo(d, 6)
      } else {
        const [d, t] = n as [number, number]
        expect(d, `s${s}`).toBeCloseTo(inst.resposta * t * 10, 6)
      }
      tipos.add(inst.dados?.tipo as string)
    }
    expect([...tipos].sort()).toEqual(['tempo', 'velocidade'])
  })
  it('nível 3: a taxa total é o dobro da meia-taxa; a largura usa as duas margens', () => {
    const tipos = new Set<string>()
    for (const s of SEMENTES) {
      const inst = gerarDeslocamento(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`, 3)
      const n = extrai(inst.enunciado)
      if (inst.dados?.tipo === 'taxa-total') {
        const [idade, km] = n as [number, number]
        const meia = km / (idade * 10)
        expect(inst.resposta, `s${s}`).toBeCloseTo(2 * meia, 6)
        expect(corrigirNum(inst, String(meia).replace('.', ',')).correto).toBe(false)
      } else {
        const [meia, ma] = n as [number, number]
        expect(inst.resposta, `s${s}`).toBeCloseTo(2 * meia * ma * 10, 6)
        expect(corrigirNum(inst, String(meia * ma * 10)).correto).toBe(false)
      }
      tipos.add(inst.dados?.tipo as string)
    }
    expect([...tipos].sort()).toEqual(['largura', 'taxa-total'])
  })
})
