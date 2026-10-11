import { corrigirMulti, corrigirNum, lerNumero, type InstanciaMulti, type InstanciaNum } from './simples'

const multi: InstanciaMulti = {
  enunciado: 'Qual?',
  opcoes: [
    { id: 'a', rotulo: 'A' },
    { id: 'b', rotulo: 'B' },
    { id: 'c', rotulo: 'C' },
  ],
  certa: 'b',
  porque: { a: 'A está errada porque X.' },
  motivo: { a: 'confundiu X com Y' },
  resolucao: 'B é a certa.',
  dicas: ['d1', 'd2', 'd3'],
  licao: 'lembre da regra',
}

describe('corrigirMulti', () => {
  it('acerta quando escolhe a opção certa', () => {
    const c = corrigirMulti(multi, 'b')
    expect(c.correto).toBe(true)
    expect(c.parcial).toBe(1)
  })
  it('usa o feedback específico da opção errada e o motivo curto', () => {
    const c = corrigirMulti(multi, 'a')
    expect(c.correto).toBe(false)
    expect(c.feedback).toBe('A está errada porque X.')
    expect(c.motivo).toBe('confundiu X com Y')
    expect(c.licao).toBe('lembre da regra')
  })
  it('opção errada sem explicação própria recebe feedback padrão', () => {
    const c = corrigirMulti(multi, 'c')
    expect(c.correto).toBe(false)
    expect(c.feedback.length).toBeGreaterThan(10)
    expect(c.motivo).toBeTruthy()
  })
})

describe('lerNumero', () => {
  it('aceita vírgula, ponto, porcentagem, unidade e espaços', () => {
    expect(lerNumero('1.234,5')).toBe(1234.5)
    expect(lerNumero('12,5%')).toBe(12.5)
    expect(lerNumero(' 3,14 ')).toBe(3.14)
    expect(lerNumero('R$ 1500')).toBe(1500)
    expect(lerNumero('-2')).toBe(-2)
    expect(lerNumero('1/4')).toBe(0.25)
  })
  it('texto sem número vira null', () => {
    expect(lerNumero('')).toBeNull()
    expect(lerNumero('abc')).toBeNull()
    expect(lerNumero('1/0')).toBeNull()
  })
})

const num: InstanciaNum = {
  enunciado: 'Quanto?',
  resposta: 100,
  tolerancia: 0.5,
  unidade: 'R$',
  erros: [{ valor: 90, frase: 'Você subtraiu em vez de somar.', motivo: 'operação trocada' }],
  resolucao: 'Resolução.',
  dicas: ['d1', 'd2', 'd3'],
  licao: 'regra',
}

describe('corrigirNum', () => {
  it('aceita dentro da tolerância', () => {
    expect(corrigirNum(num, '100').correto).toBe(true)
    expect(corrigirNum(num, '100,4').correto).toBe(true)
    expect(corrigirNum(num, '99,4').correto).toBe(false)
  })
  it('reconhece um erro típico e explica', () => {
    const c = corrigirNum(num, '90')
    expect(c.correto).toBe(false)
    expect(c.feedback).toContain('subtraiu')
    expect(c.motivo).toBe('operação trocada')
  })
  it('sem erro típico, diz se a resposta ficou maior ou menor, sem revelar o valor', () => {
    const baixo = corrigirNum(num, '10')
    expect(baixo.feedback).toMatch(/menor/)
    expect(baixo.feedback).not.toMatch(/100/)
    expect(corrigirNum(num, '500').feedback).toMatch(/maior/)
  })
  it('entrada inválida pede um número', () => {
    const c = corrigirNum(num, 'abc')
    expect(c.correto).toBe(false)
    expect(c.feedback).toMatch(/número/)
  })
  it('acerto parcial para respostas próximas (até 10%)', () => {
    expect(corrigirNum(num, '95').parcial).toBeGreaterThan(0)
    expect(corrigirNum(num, '10').parcial).toBe(0)
  })
})
