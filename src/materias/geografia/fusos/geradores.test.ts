import { BANCO_FUSOS } from '@/conteudo/geografia/fusos'
import { itemValido } from '@/materias/biologia/comum/auxiliares'
import { NIVEIS, SEMENTES, checarMulti, checarNum, rngTeste, textoCerto } from '@/materias/biologia/comum/checagens'
import { gerarFuso, gerarHora, gerarLongitude, gerarReuniao, gerarViagem } from './geradores'

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const mod = (a: number, n: number) => ((a % n) + n) % n

/** Lê "UTC−3", "UTC+9" ou "UTC+5:30" e devolve horas. */
function lerUtc(s: string): number {
  const m = /UTC([−+])(\d+)(?::(\d\d))?/.exec(s)!
  return (m[1] === '−' ? -1 : 1) * (Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0))
}
const todosUtc = (texto: string) => [...texto.matchAll(/\((UTC[−+]\d+(?::\d\d)?)\)/g)].map((m) => lerUtc(m[1]!))
/** Escrito à parte (sem usar o código testado): 14h ou 14h30. */
const hh = (min: number) => {
  const m = mod(min, 1440)
  return `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`
}
const lerHora = (s: string) => {
  const m = /(\d+)h(\d\d)?/.exec(s)!
  return Number(m[1]) * 60 + (m[2] ? Number(m[2]) : 0)
}

describe('Que horas são lá? (desafio)', () => {
  it.each(NIVEIS)('nível %i: a resposta certa bate com a conta via UTC', (nivel) => {
    let mudouDeDia = 0
    for (const s of SEMENTES) {
      const inst = gerarHora(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const m = /^Em .*? \((UTC[^)]*)\) são (\d+h\d*) de ([\p{L}-]+)\. Que horas e que dia são em .*? \((UTC[^)]*)\)\?$/u.exec(inst.enunciado)!
      const [uo, ud] = [lerUtc(m[1]!), lerUtc(m[4]!)]
      const local = lerHora(m[2]!)
      const dia0 = DIAS.indexOf(m[3]!)
      expect(dia0, `s${s}`).toBeGreaterThanOrEqual(0)
      const total = local - uo * 60 + ud * 60
      const esperado = `${hh(total)} de ${DIAS[mod(dia0 + Math.floor(total / 1440), 7)]}`
      expect(textoCerto(inst), `n${nivel} s${s}: ${inst.enunciado}`).toBe(esperado)
      if (Math.floor(total / 1440) !== 0) mudouDeDia++
      if (nivel === 1) expect(Math.floor(total / 1440)).toBe(0)
      if (nivel === 3) expect(Number.isInteger(uo) && Number.isInteger(ud), `s${s}`).toBe(false)
      if (nivel === 2) expect(Math.abs(ud - uo)).toBeGreaterThanOrEqual(4)
    }
    if (nivel > 1) expect(mudouDeDia).toBeGreaterThan(20)
  })
})

describe('Longitude e horas (desafio)', () => {
  it('nível 1: horas de diferença = |Δ longitude| ÷ 15, olhando os lados O e L', () => {
    for (const s of SEMENTES) {
      const inst = gerarLongitude(rngTeste(s, 1), 1)
      checarNum(inst, `s${s}`, 2)
      const m = /meridianos (\d+)°([OL]) e (\d+)°([OL])/.exec(inst.enunciado)!
      const a = Number(m[1]) * (m[2] === 'O' ? -1 : 1)
      const b = Number(m[3]) * (m[4] === 'O' ? -1 : 1)
      expect(inst.resposta, `s${s}`).toBeCloseTo(Math.abs(a - b) / 15, 9)
      expect(Number.isInteger(inst.resposta)).toBe(true)
    }
  })
  it('nível 2: minutos = 4 × graus de separação (e os dois meridianos estão realmente separados por esses graus)', () => {
    for (const s of SEMENTES) {
      const inst = gerarLongitude(rngTeste(s, 2), 2)
      checarNum(inst, `s${s}`, 2)
      const m = /meridianos (\d+)°([OL]) e (\d+)°([OL]), separados por (\d+)° de longitude/.exec(inst.enunciado)!
      const a = Number(m[1]) * (m[2] === 'O' ? -1 : 1)
      const b = Number(m[3]) * (m[4] === 'O' ? -1 : 1)
      expect(Math.abs(a - b), `s${s}: ${inst.enunciado}`).toBe(Number(m[5]))
      expect(inst.resposta).toBe(4 * Number(m[5]))
    }
  })
  it('nível 3: graus = (horas × 60 + minutos) ÷ 4', () => {
    for (const s of SEMENTES) {
      const inst = gerarLongitude(rngTeste(s, 3), 3)
      checarNum(inst, `s${s}`, 2)
      const m = /difere em (\d+) h (\d+) min/.exec(inst.enunciado)!
      expect(inst.resposta, `s${s}`).toBeCloseTo((Number(m[1]) * 60 + Number(m[2])) / 4, 9)
    }
  })
})

describe('Viagens de avião (desafio)', () => {
  it.each(NIVEIS)('nível %i: a duração bate com a conta via UTC', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarViagem(rngTeste(s, nivel), nivel)
      checarNum(inst, `n${nivel} s${s}`, 2)
      const m = /parte de .*? \((UTC[^)]*)\) às (\d+h\d*) e chega a .*? \((UTC[^)]*)\) às (\d+h\d*), (no mesmo dia|no dia seguinte)/.exec(inst.enunciado)!
      const [uo, ud] = [lerUtc(m[1]!), lerUtc(m[3]!)]
      const partidaUtc = lerHora(m[2]!) - uo * 60
      const chegadaUtc = lerHora(m[4]!) + (m[5] === 'no dia seguinte' ? 1440 : 0) - ud * 60
      expect(inst.resposta, `n${nivel} s${s}: ${inst.enunciado}`).toBeCloseTo((chegadaUtc - partidaUtc) / 60, 9)
      expect(inst.resposta).toBeGreaterThan(0)
      expect(inst.dados!.duracao).toBeCloseTo(inst.resposta, 9)
      if (nivel === 1) expect(m[5]).toBe('no mesmo dia')
      if (nivel === 3) expect(Number.isInteger(uo) && Number.isInteger(ud)).toBe(false)
    }
  })
})

describe('Fuso teórico e conceitos (desafio)', () => {
  it('nível 2: o fuso certo é longitude ÷ 15 arredondado, com margem do limite de 7,5°', () => {
    for (const s of SEMENTES) {
      const inst = gerarFuso(rngTeste(s, 2), 2)
      checarMulti(inst, `s${s}`)
      const m = /longitude (\d+)°([OL])\?/.exec(inst.enunciado)!
      const lon = Number(m[1]) * (m[2] === 'O' ? -1 : 1)
      const f = Math.round(lon / 15)
      expect(Math.abs(lon - f * 15), `s${s}`).toBeLessThanOrEqual(5)
      expect(textoCerto(inst)).toBe(`UTC${f < 0 ? '−' : '+'}${Math.abs(f)}`)
      expect(inst.dados!.longitude).toBe(lon)
    }
  })
  it('níveis 1 e 3 vêm do banco de perguntas, que está bem formado', () => {
    for (const nivel of [1, 3] as const) for (const s of SEMENTES.slice(0, 40)) checarMulti(gerarFuso(rngTeste(s, nivel), nivel), `n${nivel} s${s}`)
    for (const it of BANCO_FUSOS) expect(itemValido(it), it.pergunta).toBe(true)
  })
})

describe('Reunião entre cidades (desafio)', () => {
  it.each(NIVEIS)('nível %i: só a alternativa certa mantém todos no expediente (9h a 17h)', (nivel) => {
    for (const s of SEMENTES) {
      const inst = gerarReuniao(rngTeste(s, nivel), nivel)
      checarMulti(inst, `n${nivel} s${s}`)
      const todos = todosUtc(inst.enunciado)
      // as pessoas vêm primeiro; o último fuso citado é o de Brasília, que serve de relógio de referência
      expect(todos.length, `s${s}`).toBe(nivel === 1 ? 3 : 4)
      expect(todos[todos.length - 1]).toBe(-3)
      const utcs = todos.slice(0, -1)
      if (nivel === 3) expect(utcs.some((u) => !Number.isInteger(u))).toBe(true)
      const cabe = (rotulo: string) => {
        const h = lerHora(rotulo)
        return utcs.every((u) => {
          const local = mod(h + (u - -3) * 60, 1440)
          return local >= 540 && local <= 1020
        })
      }
      const certa = inst.opcoes.find((o) => o.id === inst.certa)!
      expect(cabe(certa.rotulo), `s${s}: ${inst.enunciado} -> ${certa.rotulo}`).toBe(true)
      for (const o of inst.opcoes.filter((x) => x.id !== inst.certa)) expect(cabe(o.rotulo), `s${s}: ${o.rotulo} deveria falhar`).toBe(false)
    }
  })
})
