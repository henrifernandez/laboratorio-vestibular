import { MAX_CHAVES, mesclarProgresso, progressosIguais, sanitizarProgresso, type DicionarioProgresso } from './mesclar'

const r = (tentativas: number, acertos: number, data = '2026-10-12') => ({ tentativas, acertos, ultimo: acertos > 0, data })

describe('sanitizarProgresso', () => {
  it('aceita registros válidos e descarta, um a um, os inválidos', () => {
    const limpo = sanitizarProgresso({
      'fisica/dinamica/leis:1': r(3, 2),
      'historia/linha-do-tempo/ordem:3': r(1, 0),
      'Fisica/dinamica/leis:1': r(1, 1), // maiúscula
      'fisica/dinamica/leis:4': r(1, 1), // nível fora de 1 a 3
      'fisica/dinamica:1': r(1, 1), // faltou uma parte
      'a/b/c:1': r(2, 3), // acertos > tentativas
      'a/b/d:1': r(0, 0), // sem tentativas
      'a/b/e:1': { tentativas: 1.5, acertos: 1, ultimo: true, data: '2026-10-12' },
      'a/b/f:1': { tentativas: 1, acertos: 1, ultimo: 'sim', data: '2026-10-12' },
      'a/b/g:1': { tentativas: 1, acertos: 1, ultimo: true, data: '12/10/2026' },
      'a/b/h:1': null,
      '__proto__': r(1, 1),
    })
    expect(Object.keys(limpo!)).toEqual(['fisica/dinamica/leis:1', 'historia/linha-do-tempo/ordem:3'])
  })
  it('recusa o que não é um dicionário e o que tem chaves demais', () => {
    for (const ruim of [null, undefined, 3, 'x', [], [r(1, 1)]]) expect(sanitizarProgresso(ruim)).toBeNull()
    const demais = Object.fromEntries(Array.from({ length: MAX_CHAVES + 1 }, (_, i) => [`m/t/d${i}:1`, r(1, 1)]))
    expect(sanitizarProgresso(demais)).toBeNull()
    expect(sanitizarProgresso({})).toEqual({})
  })
  it('não deixa passar campos extras', () => {
    const limpo = sanitizarProgresso({ 'a/b/c:1': { ...r(1, 1), extra: '<script>', admin: true } })!
    expect(Object.keys(limpo['a/b/c:1']!).sort()).toEqual(['acertos', 'data', 'tentativas', 'ultimo'])
  })
})

describe('mesclarProgresso', () => {
  const a: DicionarioProgresso = { 'm/t/x:1': r(5, 3), 'm/t/y:1': r(2, 2, '2026-10-10'), 'm/t/so-a:1': r(1, 1) }
  const b: DicionarioProgresso = { 'm/t/x:1': r(4, 4), 'm/t/y:1': r(2, 1, '2026-10-12'), 'm/t/so-b:1': r(7, 0) }
  it('vale o registro com mais tentativas; em empate, o de data mais recente; as chaves dos dois lados ficam', () => {
    const j = mesclarProgresso(a, b)
    expect(j['m/t/x:1']).toEqual(r(5, 3))
    expect(j['m/t/y:1']).toEqual(r(2, 1, '2026-10-12'))
    expect(Object.keys(j).sort()).toEqual(['m/t/so-a:1', 'm/t/so-b:1', 'm/t/x:1', 'm/t/y:1'])
  })
  it('é comutativa nos resultados, idempotente e não altera os dicionários originais', () => {
    const copiaA = JSON.stringify(a)
    const j1 = mesclarProgresso(a, b)
    const j2 = mesclarProgresso(b, a)
    expect(progressosIguais(j1, j2)).toBe(true)
    expect(progressosIguais(mesclarProgresso(j1, j1), j1)).toBe(true)
    expect(progressosIguais(mesclarProgresso(j1, a), j1)).toBe(true)
    expect(JSON.stringify(a)).toBe(copiaA)
  })
  it('entrar duas vezes no mesmo aparelho não soma de novo as mesmas tentativas', () => {
    const servidor = mesclarProgresso({}, a)
    const depois = mesclarProgresso(a, servidor)
    expect(depois['m/t/x:1']!.tentativas).toBe(5)
  })
})

describe('progressosIguais', () => {
  it('compara chaves e valores', () => {
    expect(progressosIguais({ 'a/b/c:1': r(1, 1) }, { 'a/b/c:1': r(1, 1) })).toBe(true)
    expect(progressosIguais({ 'a/b/c:1': r(1, 1) }, { 'a/b/c:1': r(2, 1) })).toBe(false)
    expect(progressosIguais({ 'a/b/c:1': r(1, 1) }, {})).toBe(false)
    expect(progressosIguais({}, {})).toBe(true)
  })
})
