import { AUTORES_SOCIOLOGIA, CATEGORIAS, EXEMPLOS } from '@/conteudo/sociologia/tresLentes'
import { corrigirLigar } from '@/desafios/ligar'
import { NIVEIS, SEMENTES, rngTeste } from '@/materias/biologia/comum/checagens'
import { gerarLigarCaso, gerarLigarConceitoSociologia, gerarLigarCorrenteSociologia } from './geradores'

const textos = { motivo: 'm', licao: 'l' }
const n = (nivel: number) => nivel + 2

describe('Autor e conceito (ligar)', () => {
  it.each(NIVEIS)('nível %i: cada conceito é do autor ligado e sobram conceitos de outros autores só no nível 3', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarLigarConceitoSociologia(rngTeste(s, nivel), nivel)
      expect(inst.esquerda).toHaveLength(n(nivel))
      for (const item of inst.esquerda) expect(AUTORES_SOCIOLOGIA.find((a) => a.id === item.id)!.conceitos.map((c) => c.termo)).toContain(inst.certa[item.id])
      expect(inst.direita).toHaveLength(n(nivel) + (nivel === 3 ? 2 : 0))
      const certos = new Set(Object.values(inst.certa))
      for (const d of inst.direita.filter((x) => !certos.has(x.id))) for (const item of inst.esquerda) expect(AUTORES_SOCIOLOGIA.find((a) => a.id === item.id)!.conceitos.map((c) => c.termo)).not.toContain(d.id)
      expect(corrigirLigar(inst, inst.certa, textos).correto).toBe(true)
    }
  })
})

describe('Autor e corrente (ligar)', () => {
  it.each(NIVEIS)('nível %i: a corrente certa é a tradição do autor, e nenhuma outra opção serve ao autor', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarLigarCorrenteSociologia(rngTeste(s, nivel), nivel)
      expect(inst.esquerda).toHaveLength(n(nivel))
      for (const item of inst.esquerda) {
        const a = AUTORES_SOCIOLOGIA.find((x) => x.id === item.id)!
        expect(inst.direita.find((d) => d.id === inst.certa[item.id])!.rotulo).toBe(a.tradicao)
        for (const d of inst.direita.filter((x) => x.id !== inst.certa[item.id])) expect(d.rotulo).not.toBe(a.tradicao)
      }
      expect(new Set(inst.direita.map((d) => d.rotulo)).size).toBe(inst.direita.length)
    }
  })
})

describe('Caso e categoria (ligar)', () => {
  it.each(NIVEIS)('nível %i: o caso listado é um exemplo da categoria certa, com categorias diferentes', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarLigarCaso(rngTeste(s, nivel), nivel)
      expect(inst.esquerda).toHaveLength(n(nivel))
      expect(new Set(Object.values(inst.certa)).size).toBe(n(nivel))
      for (const item of inst.esquerda) {
        const texto = item.rotulo.replace(/^\d+\. /, '')
        const exemplo = EXEMPLOS.find((e) => e.texto === texto)!
        expect(exemplo, item.rotulo).toBeDefined()
        expect(inst.certa[item.id]).toBe(exemplo.categoria)
        expect(inst.direita.find((d) => d.id === exemplo.categoria)!.rotulo).toBe(CATEGORIAS.find((c) => c.id === exemplo.categoria)!.nome)
      }
      if (nivel === 1) for (const item of inst.esquerda) expect(CATEGORIAS.find((c) => c.id === inst.certa[item.id])!.grupo).toBe('weber-acao')
      expect(inst.direita).toHaveLength(n(nivel) + (nivel === 3 ? 2 : 0))
      expect(corrigirLigar(inst, inst.certa, textos).correto).toBe(true)
    }
  })
})
