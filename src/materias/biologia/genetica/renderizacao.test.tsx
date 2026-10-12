import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DEFINICOES_GENETICA } from './definicoes'
import Entenda from './Entenda'
import { ESTRUTURA_DUAS_FAMILIAS, ESTRUTURA_SIMPLES, comFenotipos } from './heredograma'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { HeredogramaSvg, MatrizTransfusao, QuadroPunnett, QuadroX } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)

describe('Quadro de Punnett', () => {
  it('Aa × Aa: 4 casas, legenda com as classes e contagens 3 de 4 e 1 de 4', () => {
    const { container } = render(<QuadroPunnett pai="Aa" mae="Aa" />)
    expect(container.querySelectorAll('tbody td')).toHaveLength(4)
    expect(container.textContent).toContain('A_: 3 de 4')
    expect(container.textContent).toContain('aa: 1 de 4')
  })
  it('AaBb × AaBb: 16 casas e a legenda 9 / 3 / 3 / 1', () => {
    const { container } = render(<QuadroPunnett pai="AaBb" mae="AaBb" />)
    expect(container.querySelectorAll('tbody td')).toHaveLength(16)
    for (const t of ['A_ B_: 9 de 16', 'A_ bb: 3 de 16', 'aa B_: 3 de 16', 'aa bb: 1 de 16']) expect(container.textContent).toContain(t)
  })
  it('dominância incompleta: três classes (1 : 2 : 1)', () => {
    const { container } = render(<QuadroPunnett pai="Aa" mae="Aa" modo="incompleta" />)
    expect(container.textContent).toContain('Aa: 2 de 4')
    expect(container.textContent).toContain('AA: 1 de 4')
    expect(container.textContent).toContain('aa: 1 de 4')
  })
  it('homozigoto dominante × heterozigoto: uma coluna e duas linhas, sem repetir gametas', () => {
    const { container } = render(<QuadroPunnett pai="AA" mae="Aa" />)
    expect(container.querySelectorAll('tbody td')).toHaveLength(2)
  })
  it('quadro do X: pai afetado × mãe normal → todas as filhas portadoras', () => {
    const { container } = render(<QuadroX pai="XaY" mae="XAXA" />)
    const celulas = [...container.querySelectorAll('tbody td')].map((c) => c.textContent)
    expect(celulas.sort()).toEqual(['XᴬXᵃ', 'XᴬXᵃ', 'XᴬY', 'XᴬY'].sort())
  })
})

describe('Matriz de transfusão e heredograma (SVG)', () => {
  it('a matriz tem 64 células e 27 compatíveis (conferência com a contagem direta)', () => {
    const { container } = render(<MatrizTransfusao />)
    const celulas = container.querySelectorAll('tbody td')
    expect(celulas).toHaveLength(64)
    const ok = [...celulas].filter((c) => c.textContent === '✓').length
    expect(ok).toBe(27)
  })
  it('heredograma interativo: caixas focáveis, alternam com clique, Enter e Espaço', () => {
    const alternadas: string[] = []
    render(<HeredogramaSvg ped={comFenotipos(ESTRUTURA_SIMPLES, ['II-2'])} rotulo="teste" onAlternar={(id) => alternadas.push(id)} />)
    const caixas = screen.getAllByRole('checkbox')
    expect(caixas).toHaveLength(5)
    for (const c of caixas) expect(c).toHaveAttribute('tabindex', '0')
    const afetada = screen.getByRole('checkbox', { name: /II-2, mulher, afetado/ })
    expect(afetada).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: /II-1, homem, normal/ })).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(afetada)
    fireEvent.keyDown(afetada, { key: 'Enter' })
    fireEvent.keyDown(afetada, { key: ' ' })
    expect(alternadas).toEqual(['II-2', 'II-2', 'II-2'])
  })
  it('heredograma estático: sem papel de caixa de seleção, símbolos cheios para afetados', () => {
    const { container } = render(<HeredogramaSvg ped={comFenotipos(ESTRUTURA_DUAS_FAMILIAS, ['II-1', 'II-4'])} rotulo="teste" />)
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(container.querySelectorAll('rect[fill="var(--ink)"], circle[fill="var(--ink)"]')).toHaveLength(2)
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 6 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_GENETICA).toHaveLength(6)
    for (const def of DEFINICOES_GENETICA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 12; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('no desafio de heredograma, o foco só aparece depois da resposta (tipo "obrigatório")', () => {
    const def = DEFINICOES_GENETICA.find((d) => d.desafio.id === 'biologia/genetica/heredograma')!
    let verificados = 0
    for (let semente = 1; semente <= 60 && verificados < 5; semente++) {
      const inst = def.desafio.gerar(semente, 2)
      if ((inst.dados as { tipo: string }).tipo !== 'obrigatorio') continue
      const { Entrada } = def
      const antes = render(<Entrada inst={inst} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
      const marcadosAntes = antes.container.querySelectorAll('[stroke="var(--accent)"]').length
      antes.unmount()
      const depois = render(<Entrada inst={inst} resposta={inst.certa} onChange={() => {}} correcao={{ correto: true, feedback: 'ok' }} bloqueado />)
      const marcadosDepois = depois.container.querySelectorAll('[stroke="var(--accent)"]').length
      depois.unmount()
      expect(marcadosAntes, `semente ${semente}`).toBe(0)
      expect(marcadosDepois, `semente ${semente}`).toBeGreaterThan(0)
      verificados++
    }
    expect(verificados).toBeGreaterThan(0)
  })
})

describe('Abas do tema', () => {
  it('Entenda: as 12 etapas renderizam, uma por vez, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    for (let i = 1; i <= 12; i++) {
      expect(screen.getByText(`Etapa ${i} de 12`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < 12) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas em KaTeX', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(6)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(5)
  })
})

describe('Laboratório', () => {
  it('Introdução: o quadro e as razões; trocar a dominância muda a razão fenotípica', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    expect(document.body.textContent).toContain('Razão fenotípica: 3 : 1')
    fireEvent.click(screen.getByLabelText('Incompleta'))
    expect(document.body.textContent).toContain('Razão fenotípica: 2 : 1 : 1')
  })
  it('Introdução: o sorteio conta exatamente n descendentes e muda com "Sortear de novo"', () => {
    noRouter(<Laboratorio />, '/?tela=intro&n=100')
    const texto = () => (document.body.textContent as string).match(/AA: (\d+) · Aa: (\d+) · aa: (\d+)/)!
    const a = texto()
    expect(Number(a[1]) + Number(a[2]) + Number(a[3])).toBe(100)
    fireEvent.click(screen.getByRole('button', { name: 'Sortear de novo' }))
    const b = texto()
    expect(Number(b[1]) + Number(b[2]) + Number(b[3])).toBe(100)
    expect(b[0]).not.toBe(a[0])
  })
  it('Explorar (dois genes): 9 : 3 : 3 : 1; ligar os genes mostra as barras de gametas', () => {
    noRouter(<Laboratorio />, '/?tela=explorar')
    expect(document.body.textContent).toContain('9 : 3 : 3 : 1')
    fireEvent.click(screen.getByLabelText('Genes ligados (mesmo cromossomo)'))
    expect(document.body.textContent).toContain('Gametas do duplo-heterozigoto')
  })
  it('Explorar (sangue): AO × BO dá os quatro tipos com 25 %; mãe Rh− e pai Dd indica risco', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=sangue')
    const t = document.body.textContent as string
    for (const tipo of ['Tipo A', 'Tipo B', 'Tipo AB', 'Tipo O']) expect(t).toContain(tipo)
    expect(t).toContain('Risco de eritroblastose fetal')
    expect(t).toContain('AB+ pode receber de:')
  })
  it('Explorar (Hardy-Weinberg): 64 / 32 / 4 está em equilíbrio; 50 / 0 / 50 não', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=hardy')
    expect(document.body.textContent).toContain('Em equilíbrio de Hardy-Weinberg')
    fireEvent.click(screen.getByRole('button', { name: /Sem heterozigotos/ }))
    expect(document.body.textContent).toContain('Fora do equilíbrio')
    expect(document.body.textContent).toContain('p = 0,5')
  })
  it('Laboratório (heredograma): AR com II-2 afetada exclui AD, XD e XR; alternar uma pessoa muda os padrões', () => {
    noRouter(<Laboratorio />, '/?tela=lab')
    const itens = () => (document.body.textContent as string)
    expect(itens()).toMatch(/Autossômica recessiva: compatível/)
    expect(itens()).toMatch(/Autossômica dominante: incompatível/)
    expect(itens()).toMatch(/Recessiva ligada ao X: incompatível/)
    // II-1 (homem) também afetado: continua AR e passa a admitir XR
    fireEvent.click(screen.getByRole('checkbox', { name: /II-1, homem/ }))
    expect(screen.getByRole('checkbox', { name: /II-1, homem, afetado/ })).toBeInTheDocument()
    // com as probabilidades de próximo filho
    expect(itens()).toContain('Probabilidade de ser afetado')
  })
  it('Laboratório (heredograma): probabilidade de 25 % para pais Aa × Aa e sortear gera um heredograma compatível', () => {
    noRouter(<Laboratorio />, '/?tela=lab')
    expect(document.body.textContent).toContain('25 %')
    fireEvent.click(screen.getByRole('button', { name: /Sortear heredograma \(AR\)/ }))
    expect(document.body.textContent).toMatch(/Autossômica recessiva: compatível/)
  })
  it('Laboratório (heredograma): ids desconhecidos na URL são ignorados e família desconhecida cai na primeira', () => {
    noRouter(<Laboratorio />, '/?tela=lab&af=naoexiste,II-2&est=nada')
    expect(screen.getByRole('checkbox', { name: /II-2, mulher, afetado/ })).toBeInTheDocument()
  })
  it('Jogo: a tela do jogo abre', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
