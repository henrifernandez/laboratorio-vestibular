import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DEFINICOES_MOLECULAR } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { GelSvg, GradeMeselson, LacSvg, MapaRestricaoSvg, SequenciaAlinhada, TabelaCodons } from './Visuais'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('sequência alinhada: um bloco por códon, com o aminoácido de cada um', () => {
    const { container } = render(<SequenciaAlinhada codificadora="ATGCCTAAA" />)
    const t = container.textContent as string
    for (const aa of ['Met', 'Pro', 'Lys']) expect(t).toContain(aa)
    expect(container.querySelectorAll('.rounded-md.border')).toHaveLength(3)
  })
  it('a tradução para no códon de parada e não rotula o que vem depois', () => {
    const { container } = render(<SequenciaAlinhada codificadora="ATGCCTTAAGGGAAA" />)
    const t = container.textContent as string
    expect(t).toContain('Stop')
    expect(t).not.toContain('Gly')
    expect(t).not.toContain('Lys')
  })
  it('bases antes do ATG ficam num bloco à parte, sem aminoácido', () => {
    const { container } = render(<SequenciaAlinhada codificadora="GGATGCCTTAA" />)
    const blocos = container.querySelectorAll('.rounded-md.border')
    expect(blocos).toHaveLength(4) // GG | ATG | CCT | TAA
    expect(blocos[0]!.textContent).not.toMatch(/Met|Pro|Stop/)
    expect(container.textContent).toContain('Met')
  })
  it('tabela do código: 64 códons, 3 de parada em destaque', () => {
    const { container } = render(<TabelaCodons destaque={['AUG']} />)
    const celulas = [...container.querySelectorAll('tbody td div')]
    expect(celulas).toHaveLength(64)
    expect(celulas.filter((d) => d.textContent?.endsWith('Stop'))).toHaveLength(3)
  })
  it('gel: uma pista de marcador e uma banda por fragmento', () => {
    const { container } = render(<GelSvg faixas={[{ rotulo: 'Intacto', tamanhos: [6] }, { rotulo: 'EcoRI', tamanhos: [3.5, 2.5] }]} />)
    // marcador (9 bandas) + 1 + 2
    expect(container.querySelectorAll('rect[width="32"]')).toHaveLength(9 + 1 + 2)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toContain('3,5 kb, 2,5 kb')
  })
  it('mapa de restrição: linear e circular descrevem os cortes', () => {
    const lin = render(<MapaRestricaoSvg tamanho={8} cortes={[2, 5]} circular={false} enzima="HindIII" />)
    expect(lin.container.querySelector('svg')?.getAttribute('aria-label')).toBe('DNA linear de 8 kb com cortes em 2 kb, 5 kb')
    const circ = render(<MapaRestricaoSvg tamanho={6} cortes={[1, 3.5]} circular enzima="EcoRI" />)
    expect(circ.container.querySelector('svg')?.getAttribute('aria-label')).toContain('Plasmídeo circular de 6 kb')
  })
  it('grade de Meselson: conservativa é refutada na geração 1; semiconservativa serve sempre', () => {
    const conserv = render(<GradeMeselson modelo="conservativa" />)
    const marcas = [...conserv.container.querySelectorAll('text')].map((t) => t.textContent).filter((t) => t === '✓' || t === '✗')
    expect(marcas).toEqual(['✓', '✗', '✗', '✗', '✗'])
    const semi = render(<GradeMeselson modelo="semiconservativa" />)
    expect([...semi.container.querySelectorAll('text')].map((t) => t.textContent).filter((t) => t === '✗')).toHaveLength(0)
    const disp = render(<GradeMeselson modelo="dispersiva" />)
    expect([...disp.container.querySelectorAll('text')].map((t) => t.textContent).filter((t) => t === '✓' || t === '✗')).toEqual(['✓', '✓', '✗', '✗', '✗'])
  })
  it('óperon lac: rótulo do nível de transcrição conforme as condições', () => {
    expect(render(<LacSvg lactose glicose={false} mutacao="nenhuma" />).container.textContent).toContain('transcrição ALTA')
    expect(render(<LacSvg lactose glicose mutacao="nenhuma" />).container.textContent).toContain('transcrição BAIXA')
    expect(render(<LacSvg lactose={false} glicose={false} mutacao="nenhuma" />).container.textContent).toContain('SEM transcrição')
    expect(render(<LacSvg lactose={false} glicose={false} mutacao="operador" />).container.textContent).toContain('transcrição ALTA')
    expect(render(<LacSvg lactose glicose={false} mutacao="superrepressor" />).container.textContent).toContain('SEM transcrição')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 7 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_MOLECULAR).toHaveLength(7)
    for (const def of DEFINICOES_MOLECULAR)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 12; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
})

describe('Abas do tema', () => {
  it('Entenda: as 12 etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    for (let i = 1; i <= 12; i++) {
      expect(screen.getByText(`Etapa ${i} de 12`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < 12) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas em KaTeX', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(5)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(4)
  })
})

describe('Laboratório', () => {
  it('Introdução: o gene da β-globina dá Met-Val-His-Leu-Thr-Pro-Glu-Glu', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    expect(texto()).toContain('Peptídeo (8 aminoácidos)')
    for (const aa of ['Met', 'Val', 'His', 'Leu', 'Thr', 'Pro', 'Glu']) expect(texto()).toContain(aa)
  })
  it('Introdução: A→T na posição 20 troca Glu por Val (troca de sentido) e mantém o tamanho', () => {
    noRouter(<Laboratorio />, '/?tela=intro&mut=subst&pos=20&base=T')
    expect(texto()).toContain('Mutação de troca de sentido (missense)')
    expect(texto()).toContain('Peptídeo mutante (8 aminoácidos)')
  })
  it('Introdução: inserir 1 base desloca o quadro; inserir 3 mantém; substituição que cria parada trunca', () => {
    noRouter(<Laboratorio />, '/?tela=intro&mut=ins1&pos=5&base=A')
    expect(texto()).toContain('Mudança no quadro de leitura (frameshift)')
  })
  it('Introdução: inserir 3 bases mantém o quadro', () => {
    noRouter(<Laboratorio />, '/?tela=intro&mut=ins3&pos=7&base=G')
    expect(texto()).toContain('Inserção de 3 bases')
    expect(texto()).toContain('Peptídeo mutante (9 aminoácidos)')
  })
  it('Introdução: substituição que cria códon de parada gera mutação sem sentido', () => {
    // GAG (posições 19-21) → TAG: 19ª base G → T
    noRouter(<Laboratorio />, '/?tela=intro&mut=subst&pos=19&base=T')
    expect(texto()).toContain('Mutação sem sentido (nonsense)')
    expect(texto()).toContain('Peptídeo mutante (6 aminoácidos)')
  })
  it('Introdução: a mesma base não é mutação; sem ATG avisa que não há tradução', () => {
    noRouter(<Laboratorio />, '/?tela=intro&mut=subst&pos=20&base=A')
    expect(texto()).toContain('não mudou')
    const r = noRouter(<Laboratorio />, '/?tela=intro&seq=GGGCCCTTTAAA')
    expect(r.container.textContent).toContain('Não há ATG')
  })
  it('Introdução: digitar na caixa limpa caracteres que não são bases', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    const campo = screen.getByLabelText('Fita codificadora (5′→3′)') as HTMLInputElement
    fireEvent.change(campo, { target: { value: 'atg ccx tt1' } })
    expect(campo.value).toBe('ATGCCTT')
  })
  it('Explorar (PCR): 10 ciclos, 1 molécula; no instante 5,5, 32 moléculas depois de 5 ciclos', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&tp=5.5')
    expect(texto()).toContain('Ciclo 6 de 10')
    expect(texto()).toContain('Moléculas depois de 5 ciclos completos: 32')
    expect(texto()).toContain('Anelamento') // fração 0,5 do ciclo
    expect(texto()).toContain('ao todo, 22') // 2^5 − 2·5
  })
  it('Explorar (PCR): fases por fração do ciclo e término', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&tp=3.1')
    expect(texto()).toContain('Desnaturação')
    const r2 = noRouter(<Laboratorio />, '/?tela=explorar&tp=3.5')
    expect(r2.container.textContent).toContain('Anelamento')
    const r3 = noRouter(<Laboratorio />, '/?tela=explorar&tp=10')
    expect(r3.container.textContent).toContain('Reação concluída')
    expect(r3.container.textContent).toContain('1.024')
  })
  it('Explorar (gel): EcoRI no plasmídeo A dá 2 fragmentos (3,5 e 2,5 kb); dupla digestão EcoRI + BamHI dá 3', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=gel')
    expect(texto()).toContain('2 cortes em molécula circular → 2 fragmentos: 3,5 kb, 2,5 kb')
    fireEvent.click(screen.getByLabelText(/BamHI/))
    expect(texto()).toContain('3 cortes em molécula circular → 3 fragmentos: 3,5 kb, 1,5 kb, 1 kb')
  })
  it('Explorar (gel): amostra linear tem n + 1 fragmentos', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=gel&am=pB&eco=0&bam=1')
    expect(texto()).toContain('2 cortes em molécula linear → 3 fragmentos')
  })
  it('Explorar (óperon lac): lactose sem glicose = alta; com glicose = baixa; operador mutante sem lactose = alta', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=lac')
    expect(texto()).toContain('Transcrição de lacZ, lacY e lacA: alta')
    const r2 = noRouter(<Laboratorio />, '/?tela=explorar&vista=lac&gli=1')
    expect(r2.container.textContent).toContain('lacA: baixa')
    const r3 = noRouter(<Laboratorio />, '/?tela=explorar&vista=lac&lac=0&mut=operador')
    expect(r3.container.textContent).toContain('lacA: alta')
  })
  it('Laboratório (Meselson): na geração 1 a hipótese conservativa é refutada; a semiconservativa, não', () => {
    noRouter(<Laboratorio />, '/?tela=lab&tm=1')
    expect(texto()).toContain('Geração 1: 2 moléculas de DNA, 2 com ¹⁵N')
    expect(texto()).toContain('Incompatível')
    expect(texto()).toContain('falha já na geração 1')
    const r2 = noRouter(<Laboratorio />, '/?tela=lab&tm=3&mod=semiconservativa')
    expect(r2.container.textContent).toContain('Compatível com o que foi observado')
    expect(r2.container.textContent).toContain('Geração 3: 8 moléculas de DNA, 2 com ¹⁵N')
  })
  it('Laboratório (Meselson): dispersiva falha só na geração 2', () => {
    noRouter(<Laboratorio />, '/?tela=lab&tm=1&mod=dispersiva')
    expect(texto()).toContain('Compatível')
    const r2 = noRouter(<Laboratorio />, '/?tela=lab&tm=2&mod=dispersiva')
    expect(r2.container.textContent).toContain('falha já na geração 2')
  })
  it('Jogo: a tela do jogo abre', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
