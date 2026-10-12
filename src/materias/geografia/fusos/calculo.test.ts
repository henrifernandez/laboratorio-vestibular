import { CIDADES } from '@/conteudo/geografia/fusos'
import {
  chegadaDoVoo,
  converterHora,
  duracaoDoVoo,
  ehDia,
  formatarDuracao,
  formatarHora,
  formatarUtc,
  fusoTeorico,
  horaSolar,
  horasEntreMeridianos,
  limitesDoFuso,
  meridianoCentral,
  minutosSolares,
  noExpediente,
  nomeDoDia,
} from './calculo'

describe('Formatação', () => {
  it('horas: 14h, 14h30, 0h; passa da meia-noite e fica negativo', () => {
    expect(formatarHora(14 * 60)).toBe('14h')
    expect(formatarHora(14 * 60 + 30)).toBe('14h30')
    expect(formatarHora(0)).toBe('0h')
    expect(formatarHora(9 * 60 + 5)).toBe('9h05')
    expect(formatarHora(-30)).toBe('23h30')
    expect(formatarHora(1440 + 60)).toBe('1h')
  })
  it('fusos: UTC−3, UTC+9, UTC+0, UTC+5:30', () => {
    expect(formatarUtc(-3)).toBe('UTC−3')
    expect(formatarUtc(9)).toBe('UTC+9')
    expect(formatarUtc(0)).toBe('UTC+0')
    expect(formatarUtc(5.5)).toBe('UTC+5:30')
    expect(formatarUtc(-3.5)).toBe('UTC−3:30')
  })
  it('duração e dias da semana', () => {
    expect(formatarDuracao(12)).toBe('12 h')
    expect(formatarDuracao(2.5)).toBe('2 h 30 min')
    expect(nomeDoDia(0)).toBe('domingo')
    expect(nomeDoDia(6)).toBe('sábado')
    expect(nomeDoDia(7)).toBe('domingo')
    expect(nomeDoDia(-1)).toBe('sábado')
  })
})

describe('Converter a hora entre fusos', () => {
  it('Brasília (UTC−3) 10h → Tóquio (UTC+9): 22h, mesmo dia; 22h → 10h do dia seguinte', () => {
    expect(converterHora(10 * 60, -3, 9)).toEqual({ minutos: 22 * 60, dia: 0 })
    expect(converterHora(22 * 60, -3, 9)).toEqual({ minutos: 10 * 60, dia: 1 })
  })
  it('para o oeste o relógio atrasa e pode voltar um dia', () => {
    expect(converterHora(10 * 60, -3, -4)).toEqual({ minutos: 9 * 60, dia: 0 })
    expect(converterHora(1 * 60, 9, -3)).toEqual({ minutos: 13 * 60, dia: -1 })
  })
  it('fuso quebrado: 10h em Brasília = 18h30 em Nova Délhi (UTC+5:30)', () => {
    expect(converterHora(10 * 60, -3, 5.5)).toEqual({ minutos: 18 * 60 + 30, dia: 0 })
  })
  it('ir e voltar devolve a hora de partida, para todo par de cidades e toda meia hora', () => {
    for (const a of CIDADES)
      for (const b of CIDADES)
        for (let m = 0; m < 1440; m += 30) {
          const ida = converterHora(m, a.utc, b.utc)
          const volta = converterHora(ida.minutos, b.utc, a.utc)
          expect(volta.minutos).toBe(m)
          expect(volta.dia + ida.dia).toBe(0)
        }
  })
  it('confere com uma conta via UTC, feita à parte', () => {
    for (const a of CIDADES)
      for (const b of CIDADES)
        for (let m = 0; m < 1440; m += 90) {
          const emUtc = m - a.utc * 60
          const total = emUtc + b.utc * 60
          const r = converterHora(m, a.utc, b.utc)
          expect(r.minutos).toBe(((total % 1440) + 1440) % 1440)
          expect(r.dia).toBe(Math.floor(total / 1440))
        }
  })
})

describe('Longitude e fuso', () => {
  it('fuso teórico: arredonda longitude ÷ 15 (oeste negativo)', () => {
    expect(fusoTeorico(0)).toBe(0)
    expect(fusoTeorico(7.4)).toBe(0)
    expect(fusoTeorico(7.6)).toBe(1)
    expect(fusoTeorico(-7.6)).toBe(-1)
    expect(fusoTeorico(-47.9)).toBe(-3)
    expect(fusoTeorico(139.7)).toBe(9)
    expect(fusoTeorico(180)).toBe(12)
    expect(fusoTeorico(-180)).toBe(-12)
  })
  it('meridiano central e limites do fuso', () => {
    expect(meridianoCentral(-3)).toBe(-45)
    expect(meridianoCentral(9)).toBe(135)
    expect(limitesDoFuso(-3)).toEqual([-52.5, -37.5])
    expect(limitesDoFuso(0)).toEqual([-7.5, 7.5])
  })
  it('4 minutos por grau e 15° por hora', () => {
    expect(minutosSolares(-47, -43)).toBe(16)
    expect(minutosSolares(10, -5)).toBe(60)
    expect(horasEntreMeridianos(-75, -30)).toBe(3)
    expect(horasEntreMeridianos(-45, 30)).toBe(5)
  })
  it('hora solar: a 45° O são 3 h a menos que em Greenwich', () => {
    expect(horaSolar(12 * 60, -45)).toBe(9 * 60)
    expect(horaSolar(12 * 60, 135)).toBe(21 * 60)
  })
  it('o fuso de cada longitude teórica cobre exatamente 15°', () => {
    for (let f = -12; f <= 12; f++) {
      const [a, b] = limitesDoFuso(f)
      expect(b - a).toBe(15)
      expect(fusoTeorico(meridianoCentral(f))).toBe(f)
    }
  })
})

describe('Voos', () => {
  it('Brasília 10h → Tóquio 10h do dia seguinte: 24 h nos relógios − 12 h de fuso = 12 h de voo', () => {
    expect(duracaoDoVoo({ partida: 10 * 60, chegada: 10 * 60, diasDepois: 1, utcOrigem: -3, utcDestino: 9 })).toBe(12)
    expect(chegadaDoVoo(10 * 60, 12, -3, 9)).toEqual({ minutos: 10 * 60, dia: 1 })
  })
  it('para o oeste, o relógio “perde” horas: Brasília 10h, 3 h de voo, Manaus 12h', () => {
    expect(chegadaDoVoo(10 * 60, 3, -3, -4)).toEqual({ minutos: 12 * 60, dia: 0 })
    expect(duracaoDoVoo({ partida: 600, chegada: 720, diasDepois: 0, utcOrigem: -3, utcDestino: -4 })).toBe(3)
  })
  it('ida e volta: a duração calculada a partir da chegada devolve a duração original', () => {
    for (const a of CIDADES)
      for (const b of CIDADES)
        for (const d of [1, 2.5, 7, 12.5, 19])
          for (const p of [0, 330, 600, 1380]) {
            const c = chegadaDoVoo(p, d, a.utc, b.utc)
            expect(duracaoDoVoo({ partida: p, chegada: c.minutos, diasDepois: c.dia, utcOrigem: a.utc, utcDestino: b.utc })).toBeCloseTo(d, 9)
          }
  })
})

describe('Expediente e dia', () => {
  it('uma reunião de 1 h cabe se começar entre 9h e 17h (inclusive)', () => {
    expect(noExpediente(9 * 60)).toBe(true)
    expect(noExpediente(9 * 60 - 1)).toBe(false)
    expect(noExpediente(17 * 60)).toBe(true)
    expect(noExpediente(17 * 60 + 1)).toBe(false)
    expect(noExpediente(1440 + 10 * 60)).toBe(true)
  })
  it('dia entre 6h e 18h', () => {
    expect(ehDia(6 * 60)).toBe(true)
    expect(ehDia(18 * 60)).toBe(false)
    expect(ehDia(0)).toBe(false)
    expect(ehDia(12 * 60)).toBe(true)
  })
})

describe('Cidades', () => {
  it('ids únicos e valores plausíveis', () => {
    expect(new Set(CIDADES.map((c) => c.id)).size).toBe(CIDADES.length)
    for (const c of CIDADES) {
      expect(c.lon, c.id).toBeGreaterThanOrEqual(-180)
      expect(c.lon, c.id).toBeLessThanOrEqual(180)
      expect(c.lat, c.id).toBeGreaterThanOrEqual(-90)
      expect(c.lat, c.id).toBeLessThanOrEqual(90)
      expect(c.utc, c.id).toBeGreaterThanOrEqual(-12)
      expect(c.utc, c.id).toBeLessThanOrEqual(14)
      expect(c.utc * c.lon, `${c.id}: fuso e longitude no mesmo lado`).toBeGreaterThanOrEqual(0)
    }
  })
  it('o fuso oficial difere do teórico em no máximo uma hora', () => {
    for (const c of CIDADES) expect(Math.abs(c.utc - fusoTeorico(c.lon)), c.id).toBeLessThanOrEqual(1)
  })
  it('as quatro horas do Brasil estão representadas: −2, −3, −4 e −5', () => {
    const br = CIDADES.filter((c) => c.pais === 'Brasil').map((c) => c.utc)
    expect(new Set(br)).toEqual(new Set([-2, -3, -4, -5]))
  })
  it('tem um fuso quebrado (Nova Délhi, UTC+5:30) e as demais cidades têm fuso inteiro', () => {
    expect(CIDADES.filter((c) => !Number.isInteger(c.utc)).map((c) => c.id)).toEqual(['nova-delhi'])
  })
  it('as cidades em que o fuso oficial e o teórico divergem incluem os exemplos usados no texto', () => {
    const dif = CIDADES.filter((c) => c.utc !== fusoTeorico(c.lon)).map((c) => c.id)
    for (const id of ['lagos', 'honolulu', 'buenos-aires', 'reykjavik']) expect(dif).toContain(id)
  })
})
