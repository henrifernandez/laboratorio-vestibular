import { fireEvent, render, screen } from '@testing-library/react'
import { criarDefLigar, corrigirLigar, type InstanciaLigar } from './ligar'

const inst: InstanciaLigar = {
  titulo: 't',
  enunciado: 'Ligue.',
  esquerda: [
    { id: 'a', rotulo: 'Locke' },
    { id: 'b', rotulo: 'Hume' },
    { id: 'c', rotulo: 'Kant' },
  ],
  direita: [
    { id: 'emp', rotulo: 'Empirismo' },
    { id: 'crit', rotulo: 'Criticismo' },
    { id: 'rac', rotulo: 'Racionalismo' },
  ],
  certa: { a: 'emp', b: 'emp', c: 'crit' },
  porque: { a: 'Locke é empirista.', b: 'Hume é empirista.', c: 'Kant escreveu a Crítica da razão pura.' },
  nivel: 1,
  dicas: ['d1', 'd2', 'd3'],
}
const textos = { motivo: 'ligou errado', licao: 'estude as correntes' }

describe('corrigirLigar', () => {
  it('tudo certo (duas ligações podem ter a mesma resposta)', () => {
    const c = corrigirLigar(inst, { a: 'emp', b: 'emp', c: 'crit' }, textos)
    expect(c.correto).toBe(true)
    expect(c.parcial).toBe(1)
  })
  it('conta os acertos, explica os dois primeiros erros e traz motivo e lição para o caderno', () => {
    const c = corrigirLigar(inst, { a: 'rac', b: 'emp', c: '' }, textos)
    expect(c.correto).toBe(false)
    expect(c.parcial).toBeCloseTo(1 / 3, 9)
    expect(c.feedback).toContain('1 de 3 ligações certas')
    expect(c.feedback).toContain('«Locke» não se liga a «Racionalismo»')
    expect(c.feedback).toContain('Locke é empirista.')
    expect(c.feedback).toContain('Você não ligou «Kant»')
    expect(c.motivo).toBe('ligou errado')
    expect(c.licao).toBe('estude as correntes')
  })
})

describe('criarDefLigar', () => {
  const def = criarDefLigar({ id: 'filosofia/teste/ligar', materia: 'filosofia', tema: 'teste', titulo: 'Teste', instrucao: 'i', gerar: () => inst, textos })
  it('só deixa enviar quando todos os itens têm resposta; a resolução cita cada ligação', () => {
    expect(def.podeEnviar({}, inst)).toBe(false)
    expect(def.podeEnviar({ a: 'emp', b: 'emp' }, inst)).toBe(false)
    expect(def.podeEnviar({ a: 'emp', b: 'emp', c: 'crit' }, inst)).toBe(true)
    const e = def.desafio.explicar(inst)
    expect(e).toContain('Locke: Empirismo. Locke é empirista.')
    expect(def.desafio.dicas(inst)).toHaveLength(3)
  })
  it('a tela tem um seletor por item; depois da resposta, marca certo e errado e mostra o certo', () => {
    const mudou = vi.fn()
    const { rerender } = render(<def.Entrada inst={inst} resposta={{}} onChange={mudou} correcao={null} bloqueado={false} />)
    const seletor = screen.getByLabelText('Locke')
    fireEvent.change(seletor, { target: { value: 'emp' } })
    expect(mudou).toHaveBeenCalledWith({ a: 'emp' })
    expect(screen.getAllByRole('combobox')).toHaveLength(3)
    const resposta = { a: 'emp', b: 'rac', c: 'crit' }
    rerender(<def.Entrada inst={inst} resposta={resposta} onChange={mudou} correcao={corrigirLigar(inst, resposta, textos)} bloqueado />)
    expect(screen.getAllByLabelText('certo')).toHaveLength(2)
    expect(screen.getAllByLabelText('errado')).toHaveLength(1)
    expect(document.body.textContent).toContain('Certo: Empirismo. Hume é empirista.')
    expect(screen.getByLabelText('Hume')).toBeDisabled()
  })
})
