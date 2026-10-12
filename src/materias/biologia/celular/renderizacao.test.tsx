import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DEFINICOES_CELULAR } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'
import { BicamadaSvg, CelulaDivisaoSvg, CelulaSvg, MembranaSvg, OsmoseSvg, PainelCelula, TabelaPresenca, TabelaTransportes, TresEstadosOsmose } from './Visuais'
import { CurvaEnzimaSvg, CurvaLuzSvg, GraficoDia } from './VisuaisEnergia'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string

describe('Visuais', () => {
  it('desenho da divisão: células, cromossomos e descrição acessível sem o nome da fase', () => {
    const { container } = render(<CelulaDivisaoSvg tipo="meiose" fase="Metáfase I" />)
    expect(container.querySelectorAll('ellipse')).toHaveLength(1)
    // 4 cromossomos duplicados: 8 traços de cromátide + 4 centrômeros
    expect(container.querySelectorAll('line[stroke-width="4.2"]')).toHaveLength(8)
    expect(container.querySelectorAll('circle')).toHaveLength(4)
    const rotulo = container.querySelector('svg')?.getAttribute('aria-label') as string
    expect(rotulo).toContain('pares de homólogos')
    expect(rotulo).not.toMatch(/metáfase|anáfase/i)
  })
  it('desenho da divisão: telófase II tem 4 células com núcleo; anáfase da mitose tem 8 cromossomos simples', () => {
    const t = render(<CelulaDivisaoSvg tipo="meiose" fase="Telófase II" />)
    expect(t.container.querySelectorAll('ellipse')).toHaveLength(8) // 4 células + 4 núcleos
    const a = render(<CelulaDivisaoSvg tipo="mitose" fase="Anáfase" />)
    expect(a.container.querySelectorAll('line[stroke-width="4.6"]')).toHaveLength(8)
  })
  it('célula com estruturas: botões acessíveis e seleção por clique e por teclado', () => {
    const selecionar = vi.fn()
    const { container } = render(<CelulaSvg tipo="animal" selecionada="nucleo" onSelecionar={selecionar} />)
    const botoes = container.querySelectorAll('g[role="button"]')
    expect(botoes.length).toBe(9) // 8 estruturas clicáveis, com a mitocôndria desenhada 2 vezes
    const mito = [...botoes].filter((b) => b.getAttribute('aria-label') === 'Mitocôndria')
    expect(mito).toHaveLength(2)
    fireEvent.keyDown(mito[0] as Element, { key: 'Enter' })
    expect(selecionar).toHaveBeenCalledWith('mitocondria')
    fireEvent.keyDown(mito[0] as Element, { key: ' ' })
    expect(selecionar).toHaveBeenCalledTimes(2)
    expect(botoes[0]?.getAttribute('aria-pressed')).toBe('true')
  })
  it('painel da célula: um botão por estrutura do tipo; a ficha mostra a função', () => {
    const selecionar = vi.fn()
    render(<PainelCelula tipo="bacteria" selecionada="ribossomo" onSelecionar={selecionar} />)
    const grupo = screen.getByRole('group', { name: 'Estruturas desta célula' })
    expect(grupo.querySelectorAll('button')).toHaveLength(3)
    expect(texto()).toContain('sintetiza proteínas lendo o mRNA')
    fireEvent.click(screen.getByRole('button', { name: 'Parede celular' }))
    expect(selecionar).toHaveBeenCalledWith('parede')
  })
  it('tabelas: presença das 12 estruturas e os 3 tipos de transporte', () => {
    const t = render(<TabelaPresenca />)
    expect(t.container.querySelectorAll('tbody tr')).toHaveLength(12)
    const u = render(<TabelaTransportes />)
    expect(u.container.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(u.container.textContent).toContain('bomba de sódio e potássio')
  })
  it('membrana: rótulo com concentrações e sentido', () => {
    const { container } = render(<MembranaSvg dentro={12} fora={145} unidade="mmol/L" sentido="sai" substancia="íons Na⁺" />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('íons Na⁺: fora, 145 mmol/L; dentro, 12 mmol/L. A substância sai da célula.')
    expect(render(<BicamadaSvg />).container.querySelector('svg')?.getAttribute('aria-label')).toContain('bicamada de fosfolipídios')
  })
  it('osmose: rótulo de cada estado e as três situações lado a lado', () => {
    expect(render(<OsmoseSvg estado="lise" volume={1.5} agua="entra" />).container.querySelector('svg')?.getAttribute('aria-label')).toContain('lise (a hemácia estoura)')
    expect(render(<OsmoseSvg estado="plasmolise" volume={0.6} agua="sai" />).container.querySelector('svg')?.getAttribute('aria-label')).toContain('Célula vegetal')
    const { container } = render(<TresEstadosOsmose celula="hemacia" />)
    expect(container.querySelectorAll('figure')).toHaveLength(3)
    expect(container.textContent).toContain('Meio hipertônico')
  })
  it('curvas: luz, enzima e dia têm rótulo com os parâmetros', () => {
    expect(render(<CurvaLuzSvg pmax={24} k={60} r={6} luz={60} mostrarIc />).container.textContent).toContain('compensação')
    const enzima = render(<CurvaEnzimaSvg otima={37} desnaturacao={62} temps={[25, 37, 50]} />)
    expect(enzima.container.querySelector('svg')?.getAttribute('aria-label')).toContain('25, 37, 50 °C')
    expect(render(<GraficoDia pmax={24} k={60} r={6} imax={600} hora={12} />).container.querySelector('svg')?.getAttribute('aria-label')).toContain('Hora marcada: 12 h')
  })
})

describe('Desafios: a tela de cada pergunta renderiza', () => {
  it('as 7 definições, em 3 níveis e várias sementes', () => {
    expect(DEFINICOES_CELULAR).toHaveLength(7)
    for (const def of DEFINICOES_CELULAR)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 12; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(20)
          unmount()
        }
  })
  it('as perguntas com figura mostram o desenho (fases, membrana, curvas)', () => {
    const fases = DEFINICOES_CELULAR.find((d) => d.desafio.id === 'biologia/celular/fases')!
    const instF = fases.desafio.gerar(3, 2)
    const r1 = render(<fases.Entrada inst={instF} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(r1.container.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toContain('Desenho de')
    r1.unmount()
    const membrana = DEFINICOES_CELULAR.find((d) => d.desafio.id === 'biologia/celular/membrana')!
    const instM = membrana.desafio.gerar(3, 2)
    const r2 = render(<membrana.Entrada inst={instM} resposta="" onChange={() => {}} correcao={null} bloqueado={false} />)
    expect(r2.container.querySelector('svg')?.getAttribute('aria-label')).toContain('fora,')
  })
})

describe('Abas do tema', () => {
  it('Entenda: as 13 etapas renderizam, cada uma com “pare e pense”', () => {
    noRouter(<Entenda />)
    for (let i = 1; i <= 13; i++) {
      expect(screen.getByText(`Etapa ${i} de 13`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      if (i < 13) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: seções com fórmulas em KaTeX', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(5)
    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(8)
  })
})

describe('Laboratório', () => {
  it('Introdução: contagem de estruturas por tipo de célula e as exclusivas de cada tipo', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    expect(texto()).toContain('9 das 12 estruturas')
    expect(texto()).toContain('centríolo')
    const v = noRouter(<Laboratorio />, '/?tela=intro&tipo=vegetal')
    expect(v.container.textContent).toContain('11 das 12 estruturas')
    expect(v.container.textContent).toContain('cloroplasto, vacúolo central')
    const b = noRouter(<Laboratorio />, '/?tela=intro&tipo=bacteria')
    expect(b.container.textContent).toContain('3 das 12 estruturas')
    expect(b.container.textContent).toContain('não tem núcleo nem organelas membranosas')
  })
  it('Introdução: a estrutura escolhida mostra a função; estrutura que não existe no tipo é ignorada', () => {
    noRouter(<Laboratorio />, '/?tela=intro&sel=mitocondria')
    expect(texto()).toContain('realiza a respiração celular aeróbica')
    const b = noRouter(<Laboratorio />, '/?tela=intro&tipo=bacteria&sel=nucleo')
    expect(b.container.textContent).toContain('Escolha uma estrutura')
  })
  it('Explorar (osmose): NaCl 0,15 mol/L é isotônico; 0,05 mol/L estoura a hemácia; 0,6 mol/L a faz murchar', () => {
    noRouter(<Laboratorio />, '/?tela=explorar')
    expect(texto()).toContain('isotônico (mesma osmolaridade da célula)')
    expect(texto()).toContain('Volume relativo agora: 1')
    expect(texto()).toContain('7,63 atm')
    const a = noRouter(<Laboratorio />, '/?tela=explorar&c=0.05&tp=10')
    expect(a.container.textContent).toContain('lise (a hemácia estoura)')
    const a0 = noRouter(<Laboratorio />, '/?tela=explorar&c=0.05&tp=0')
    expect(a0.container.textContent).toContain('normal (volume constante)')
    const h = noRouter(<Laboratorio />, '/?tela=explorar&c=0.6&tp=10')
    expect(h.container.textContent).toContain('crenação (a hemácia murcha)')
    expect(h.container.textContent).toContain('hipertônico')
  })
  it('Explorar (osmose): CaCl₂ 0,1 mol/L é isotônico (0,3 osmol/L); o botão ajusta a concentração', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&sol=cacl2&c=0.5')
    expect(texto()).toContain('hipertônico')
    fireEvent.click(screen.getByRole('button', { name: 'Deixar o meio isotônico' }))
    expect(texto()).toContain('Meio externo: 0,3 osmol/L')
    expect(texto()).toContain('isotônico (mesma osmolaridade da célula)')
  })
  it('Explorar (osmose): célula vegetal fica túrgida, flácida ou plasmolisada', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&cel=vegetal&c=0.05')
    expect(texto()).toContain('túrgida')
    const iso = noRouter(<Laboratorio />, '/?tela=explorar&cel=vegetal')
    expect(iso.container.textContent).toContain('flácida')
    const pl = noRouter(<Laboratorio />, '/?tela=explorar&cel=vegetal&c=0.6&tp=10')
    expect(pl.container.textContent).toContain('plasmólise')
  })
  it('Explorar (divisão): metáfase da mitose (2n = 4): 1 célula, 4 cromossomos, 8 cromátides, 4 C', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=divisao&tp=3')
    expect(texto()).toContain('Fase: Metáfase (4 de 6, mitose)')
    expect(texto()).toMatch(/Células: 1 · cromossomos por célula: 4 · cromátides por célula: 8 · DNA por célula: 4 C/)
  })
  it('Explorar (divisão): meiose, anáfase I e telófase II; 2n = 46 na anáfase da mitose tem 92 cromossomos', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=divisao&tipo=meiose&tp=4')
    expect(texto()).toContain('Fase: Anáfase I (5 de 10, meiose)')
    expect(texto()).toMatch(/Células: 1 · cromossomos por célula: 4 · cromátides por célula: 8/)
    const g = noRouter(<Laboratorio />, '/?tela=explorar&vista=divisao&tipo=meiose&tp=9')
    expect(g.container.textContent).toMatch(/Células: 4 · cromossomos por célula: 2 · cromátides por célula: 2 · DNA por célula: 1 C/)
    expect(g.container.textContent).toContain('Cada gameta fica com n = 2')
    const h = noRouter(<Laboratorio />, '/?tela=explorar&vista=divisao&n2=46&tp=4')
    expect(h.container.textContent).toContain('Fase: Anáfase (5 de 6, mitose)')
    expect(h.container.textContent).toMatch(/cromossomos por célula: 92/)
  })
  it('Laboratório (dia): ao meio-dia, luz 600 → fotossíntese 21,82, líquida 15,82; ponto de compensação 20', () => {
    noRouter(<Laboratorio />, '/?tela=lab&hr=12')
    expect(texto()).toContain('luz de 600')
    expect(texto()).toContain('fotossíntese bruta 21,82')
    expect(texto()).toContain('taxa líquida 15,82')
    expect(texto()).toContain('A planta produz mais O₂ do que consome neste momento')
    expect(texto()).toContain('20 µmol de fótons/(m²·s)')
    expect(texto()).toContain('cerca de 11,7 h')
    expect(texto()).toContain('a planta produz mais do que consome (acumula')
  })
  it('Laboratório (dia): à noite só há respiração; sem luz o saldo do dia é −24 R; R > Pmax nunca compensa', () => {
    noRouter(<Laboratorio />, '/?tela=lab&hr=3')
    expect(texto()).toContain('A planta consome mais O₂ do que produz neste momento')
    const s = noRouter(<Laboratorio />, '/?tela=lab&imax=0')
    expect(s.container.textContent).toContain('Saldo do dia (24 h): -144')
    expect(s.container.textContent).toContain('a planta consome mais do que produz')
    const n = noRouter(<Laboratorio />, '/?tela=lab&pmax=4&r=6')
    expect(n.container.textContent).toContain('não existe (a fotossíntese máxima não supera a respiração)')
  })
  it('Jogo: a tela do jogo abre', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
