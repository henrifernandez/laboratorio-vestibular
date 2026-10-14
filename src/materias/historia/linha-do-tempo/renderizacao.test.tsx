import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ERAS, EVENTOS, evento } from '@/conteudo/historia/linhaDoTempo'
import { DEFINICOES_HISTORIA } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import { LinhaDoTempo } from './LinhaDoTempo'
import Resumo from './Resumo'
import { VISTA_MODERNA, VISTA_TOTAL } from './calculo'
import { EventoCard, EntradaLigar, EntradaOrdenar, FaixaCronologica, FaixasComCursor, LadoALado } from './Visuais'
import { desafioCadeia, desafioOrdem } from './geradores'

const NIVEIS = [1, 2, 3] as const
const noRouter = (ui: React.ReactElement, url = '/') => render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>)
const texto = () => document.body.textContent as string
const botoesDoEixo = (c: HTMLElement) => [...c.querySelectorAll('div[role="group"][aria-label^="Linha do tempo"] button')]

describe('Linha do tempo (componente)', () => {
  const props = { eventos: EVENTOS, eras: ERAS, vista: VISTA_MODERNA, selecionado: null, mostrarMundo: true, mostrarBrasil: true }
  it('mostra os acontecimentos mais importantes, uma faixa por era e o texto de quantos não cabem', () => {
    const { container } = render(<LinhaDoTempo {...props} onVista={() => {}} onSelecionar={() => {}} />)
    const botoes = botoesDoEixo(container)
    expect(botoes.length).toBeGreaterThan(15)
    expect(botoes.length).toBeLessThan(EVENTOS.length)
    // um acontecimento de peso 1 de cada lado aparece na vista aberta
    expect(botoes.some((b) => b.getAttribute('aria-label')?.includes('Independência do Brasil'))).toBe(true)
    expect(botoes.some((b) => b.getAttribute('aria-label')?.includes('Primeira Guerra Mundial'))).toBe(true)
    expect(container.querySelectorAll('div[title^="Era Vargas"]').length).toBe(1)
    expect(container.textContent).toMatch(/não cabem? neste zoom/)
    expect(container.textContent).toContain('Mostrando de 1440 a 2030')
  })
  it('vista completa: da Antiguidade até hoje, com as eras antigas e anos antes de Cristo', () => {
    const { container } = render(<LinhaDoTempo {...props} vista={VISTA_TOTAL} onVista={() => {}} onSelecionar={() => {}} />)
    const nomes = botoesDoEixo(container).map((b) => b.getAttribute('aria-label') as string)
    expect(nomes.some((n) => n.includes('Invenção da escrita'))).toBe(true)
    expect(container.querySelectorAll('div[title^="Idade Antiga"]').length).toBe(1)
    expect(container.querySelectorAll('div[title^="Idade Média"]').length).toBe(1)
    expect(container.textContent).toContain('2000 a.C.')
    expect(container.textContent).toContain('a escala está comprimida')
    expect(container.textContent).toContain('comprimido ◂')
    expect(container.textContent).toContain('Mostrando de 3600 a.C. a 2030')
  })
  it('ao aproximar numa janela curta, todos os acontecimentos do período aparecem', () => {
    const { container } = render(<LinhaDoTempo {...props} vista={{ c: 1925, s: 20 }} onVista={() => {}} onSelecionar={() => {}} />)
    const nomes = botoesDoEixo(container).map((b) => b.getAttribute('aria-label') as string)
    for (const id of ['m-rev-russa', 'b-modernismo', 'm-versalhes', 'm-crise-1929']) expect(nomes.some((n) => n.includes(evento(id).titulo)), id).toBe(true)
    expect(container.textContent).not.toMatch(/não cabem? neste zoom/)
  })
  it('clicar em um acontecimento o seleciona; o selecionado fica marcado', () => {
    const escolher = vi.fn()
    const { container, rerender } = render(<LinhaDoTempo {...props} onVista={() => {}} onSelecionar={escolher} />)
    const b = botoesDoEixo(container).find((x) => x.getAttribute('aria-label')?.includes('Independência do Brasil')) as HTMLElement
    fireEvent.click(b)
    expect(escolher).toHaveBeenCalledWith('b-independencia')
    rerender(<LinhaDoTempo {...props} selecionado="b-independencia" onVista={() => {}} onSelecionar={escolher} />)
    const marcado = botoesDoEixo(container).find((x) => x.getAttribute('aria-pressed') === 'true')
    expect(marcado?.getAttribute('aria-label')).toContain('Independência do Brasil')
  })
  it('clicar abre a ficha rápida (o que foi, gatilho, marcos e pessoas); Esc e o X fecham; o botão leva aos detalhes', () => {
    const detalhes = vi.fn()
    const Teste = () => {
      const [sel, setSel] = useState<string | null>(null)
      return <LinhaDoTempo {...props} selecionado={sel} onVista={() => {}} onSelecionar={setSel} onDetalhes={detalhes} />
    }
    const { container } = render(<Teste />)
    const abrir = () => fireEvent.click(botoesDoEixo(container).find((x) => x.getAttribute('aria-label')?.includes('Revolução Francesa')) as HTMLElement)
    abrir()
    const ficha = screen.getByRole('dialog', { name: 'Revolução Francesa' })
    expect(ficha.textContent).toContain('Gatilho')
    expect(ficha.textContent).toContain('Estados Gerais')
    expect(ficha.textContent).toContain('1789: queda da Bastilha')
    expect(ficha.textContent).toContain('Robespierre')
    expect(document.activeElement).toBe(ficha)
    fireEvent.click(within(ficha).getByRole('button', { name: /Causas, consequências e relações/ }))
    expect(detalhes).toHaveBeenCalledWith('m-rev-francesa')
    fireEvent.keyDown(ficha, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    abrir()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar a ficha' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('processo longo, sem gatilho único: a ficha mostra marcos e pessoas, sem o bloco de gatilho', () => {
    const { container } = render(<LinhaDoTempo {...props} vista={{ c: 1800, s: 120 }} selecionado="m-rev-industrial" onVista={() => {}} onSelecionar={() => {}} />)
    fireEvent.click(botoesDoEixo(container).find((x) => x.getAttribute('aria-label')?.includes('Revolução Industrial')) as HTMLElement)
    const ficha = screen.getByRole('dialog', { name: 'Revolução Industrial' })
    expect(ficha.textContent).not.toContain('Gatilho')
    expect(ficha.textContent).toContain('Marcos')
    expect(ficha.textContent).toContain('James Watt')
  })
  it('arrastar começando em cima de um cartão anda no tempo e não seleciona o cartão', () => {
    const onVista = vi.fn()
    const escolher = vi.fn()
    const { container } = render(<LinhaDoTempo {...props} vista={{ c: 1800, s: 200 }} onVista={onVista} onSelecionar={escolher} />)
    const grupo = container.querySelector('div[role="group"]') as HTMLElement
    const cartao = botoesDoEixo(container)[0] as HTMLElement
    fireEvent.pointerDown(cartao, { pointerId: 1, clientX: 300, clientY: 100, button: 0, pointerType: 'mouse' })
    fireEvent.pointerMove(grupo, { pointerId: 1, clientX: 210, clientY: 100, pointerType: 'mouse' })
    fireEvent.pointerUp(grupo, { pointerId: 1, clientX: 210, clientY: 100, pointerType: 'mouse' })
    fireEvent.click(cartao)
    // arrastar para a esquerda leva para o futuro
    expect(onVista.mock.calls.at(-1)?.[0].c).toBeGreaterThan(1800)
    expect(escolher).not.toHaveBeenCalled()
  })
  it('teclado: + aproxima, − afasta, setas movem e Home mostra tudo', () => {
    const onVista = vi.fn()
    const { container } = render(<LinhaDoTempo {...props} vista={{ c: 1800, s: 200 }} onVista={onVista} onSelecionar={() => {}} />)
    const grupo = container.querySelector('div[role="group"]') as HTMLElement
    fireEvent.keyDown(grupo, { key: '+' })
    expect(onVista.mock.calls.at(-1)?.[0].s).toBeLessThan(200)
    fireEvent.keyDown(grupo, { key: '-' })
    expect(onVista.mock.calls.at(-1)?.[0].s).toBeGreaterThan(200)
    fireEvent.keyDown(grupo, { key: 'ArrowRight' })
    expect(onVista.mock.calls.at(-1)?.[0].c).toBeGreaterThan(1800)
    fireEvent.keyDown(grupo, { key: 'ArrowLeft' })
    expect(onVista.mock.calls.at(-1)?.[0].c).toBeLessThan(1800)
    fireEvent.keyDown(grupo, { key: 'Home' })
    expect(onVista.mock.calls.at(-1)?.[0]).toEqual(VISTA_TOTAL)
  })
  it('roda do mouse: anda no tempo (para baixo = futuro); com Ctrl, aproxima e afasta', () => {
    const onVista = vi.fn()
    const { container, rerender } = render(<LinhaDoTempo {...props} vista={{ c: 1800, s: 200 }} onVista={onVista} onSelecionar={() => {}} />)
    const grupo = container.querySelector('div[role="group"]') as HTMLElement
    fireEvent.wheel(grupo, { deltaY: 90 })
    expect(onVista.mock.calls.at(-1)?.[0]).toEqual({ c: 1820, s: 200 }) // 90 px de 900 = 10% de 200 anos
    rerender(<LinhaDoTempo {...props} vista={{ c: 1800, s: 200 }} onVista={onVista} onSelecionar={() => {}} />)
    fireEvent.wheel(grupo, { deltaX: -90, deltaY: 5 })
    expect(onVista.mock.calls.at(-1)?.[0].c).toBeLessThan(1800)
    rerender(<LinhaDoTempo {...props} vista={{ c: 1800, s: 200 }} onVista={onVista} onSelecionar={() => {}} />)
    fireEvent.wheel(grupo, { deltaY: 100, ctrlKey: true, clientX: 0 })
    expect(onVista.mock.calls.at(-1)?.[0].s).toBeGreaterThan(200)
    rerender(<LinhaDoTempo {...props} vista={{ c: 1800, s: 200 }} onVista={onVista} onSelecionar={() => {}} />)
    fireEvent.wheel(grupo, { deltaY: -100, ctrlKey: true, clientX: 0 })
    expect(onVista.mock.calls.at(-1)?.[0].s).toBeLessThan(200)
  })
  it('na ponta da linha, a roda não prende a página', () => {
    const onVista = vi.fn()
    const { container } = render(<LinhaDoTempo {...props} vista={{ c: 2030 - 100, s: 200 }} onVista={onVista} onSelecionar={() => {}} />)
    const grupo = container.querySelector('div[role="group"]') as HTMLElement
    const naoPrendeu = fireEvent.wheel(grupo, { deltaY: 100 })
    expect(naoPrendeu).toBe(true)
    expect(onVista).not.toHaveBeenCalled()
  })
  it('só o Brasil ou só o mundo: a outra faixa some', () => {
    const { container } = render(<LinhaDoTempo {...props} eventos={EVENTOS.filter((e) => e.regiao === 'brasil')} mostrarMundo={false} onVista={() => {}} onSelecionar={() => {}} />)
    expect(container.querySelectorAll('div[title^="Guerra Fria"]').length).toBe(0)
    expect(container.querySelectorAll('div[title^="Colônia"]').length).toBe(1)
  })
})

describe('Visuais da História', () => {
  it('card: título com anos, causas, consequências, ligação, relacionados e fontes', () => {
    const noop = vi.fn()
    const { container } = render(<EventoCard ev={evento('b-independencia')} onSelecionar={noop} onVer={noop} />)
    expect(container.textContent).toContain('Independência do Brasil (1822)')
    expect(container.textContent).toContain('Causas')
    expect(container.textContent).toContain('Consequências')
    expect(container.textContent).toContain('Ligação com o mundo:')
    expect(container.textContent).toContain('Fontes:')
    fireEvent.click(screen.getByRole('button', { name: /Vinda da família real portuguesa/ }))
    expect(noop).toHaveBeenCalledWith('b-familia-real')
    const m = render(<EventoCard ev={evento('m-rev-francesa')} onSelecionar={noop} />)
    expect(m.container.textContent).toContain('Ligação com o Brasil:')
  })
  it('faixa cronológica: lista em ordem de ano', () => {
    const { container } = render(<FaixaCronologica ids={['b-republica', 'b-1500', 'b-independencia']} />)
    const anos = [...container.querySelectorAll('li .num')].map((x) => x.textContent)
    expect(anos).toEqual(['1500', '1822', '1889'])
  })
  it('lado a lado: duas colunas, cada acontecimento é um botão', () => {
    const escolher = vi.fn()
    const { container } = render(<LadoALado eventos={[evento('b-estado-novo'), evento('m-2gm'), evento('m-crise-1929')]} selecionado="m-2gm" onSelecionar={escolher} />)
    expect(container.querySelectorAll('h3')).toHaveLength(2)
    expect(container.querySelectorAll('button')).toHaveLength(3)
    expect(container.querySelector('[aria-pressed="true"]')?.textContent).toContain('Segunda Guerra Mundial')
    fireEvent.click(screen.getByRole('button', { name: /Estado Novo/ }))
    expect(escolher).toHaveBeenCalledWith('b-estado-novo')
  })
  it('faixas com cursor: o rótulo diz a era do Brasil e do mundo no ano', () => {
    const { container } = render(<FaixasComCursor ano={1822} />)
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Ano 1822. Mundo: Era das Revoluções. Brasil: Império.')
    const antes = render(<FaixasComCursor ano={1460} />)
    expect(antes.container.querySelector('svg')?.getAttribute('aria-label')).toContain('Brasil: Povos originários')
    const antiga = render(<FaixasComCursor ano={-500} min={-3500} max={1500} />)
    expect(antiga.container.querySelector('svg')?.getAttribute('aria-label')).toBe('Ano 500 a.C. Mundo: Idade Antiga. Brasil: Povos originários.')
    expect(antiga.container.textContent).toContain('3000 a.C.')
  })
})

describe('Desafios: entradas', () => {
  it('ordenar: as setas trocam a posição; ao verificar, mostra os anos e marca certo e errado', () => {
    const inst = desafioOrdem.gerar(3, 2)
    const mudou = vi.fn()
    const { container, rerender } = render(<EntradaOrdenar inst={inst} resposta={inst.ids} onChange={mudou} correcao={null} bloqueado={false} />)
    expect(container.querySelectorAll('ol[aria-label] > li')).toHaveLength(5)
    // anos escondidos antes de verificar
    expect(container.textContent).not.toMatch(/\d{4}/)
    const primeiro = evento(inst.ids[0] as string)
    fireEvent.click(screen.getByRole('button', { name: `Mover «${primeiro.titulo}» para baixo` }))
    expect(mudou).toHaveBeenCalledWith([inst.ids[1], inst.ids[0], ...inst.ids.slice(2)])
    // primeiro cartão não pode subir e o último não pode descer
    expect(screen.getByRole('button', { name: `Mover «${primeiro.titulo}» para cima` })).toBeDisabled()
    const ultimo = evento(inst.ids[4] as string)
    expect(screen.getByRole('button', { name: `Mover «${ultimo.titulo}» para baixo` })).toBeDisabled()
    rerender(<EntradaOrdenar inst={inst} resposta={inst.certa} onChange={mudou} correcao={desafioOrdem.corrigir(inst, inst.certa)} bloqueado />)
    expect(container.textContent).toMatch(/\d{4}/)
    expect(container.querySelectorAll('[aria-label="na posição certa"]')).toHaveLength(5)
  })
  it('ligar: um menu por item; escolher grava a resposta; depois de verificar, mostra certo e errado', () => {
    const inst = desafioCadeia.gerar(2, 1)
    const mudou = vi.fn()
    const { container, rerender } = render(<EntradaLigar inst={inst} resposta={{}} onChange={mudou} correcao={null} bloqueado={false} />)
    expect(container.querySelectorAll('select')).toHaveLength(3)
    const primeiro = inst.esquerda[0]!
    const alvo = inst.certa[primeiro.id]!
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: alvo } })
    expect(mudou).toHaveBeenCalledWith({ [primeiro.id]: alvo })
    const errada = Object.fromEntries(inst.esquerda.map((x) => [x.id, inst.certa[x.id]!]))
    const [a, b] = inst.esquerda
    errada[a!.id] = inst.certa[b!.id]!
    errada[b!.id] = inst.certa[a!.id]!
    rerender(<EntradaLigar inst={inst} resposta={errada} onChange={mudou} correcao={desafioCadeia.corrigir(inst, errada)} bloqueado />)
    expect(container.querySelectorAll('[aria-label="errado"]')).toHaveLength(2)
    expect(container.querySelectorAll('[aria-label="certo"]')).toHaveLength(1)
  })
  it('as 6 definições, em 3 níveis e várias sementes, renderizam a tela da pergunta', () => {
    expect(DEFINICOES_HISTORIA).toHaveLength(6)
    for (const def of DEFINICOES_HISTORIA)
      for (const nivel of NIVEIS)
        for (let semente = 1; semente <= 12; semente++) {
          const inst = def.desafio.gerar(semente, nivel)
          const { Entrada } = def
          const { container, unmount } = render(<Entrada inst={inst} resposta={def.respostaInicial(inst)} onChange={() => {}} correcao={null} bloqueado={false} />)
          expect(container.textContent?.length, `${def.desafio.id} ${nivel} ${semente}`).toBeGreaterThan(30)
          unmount()
        }
  })
  it('só libera o envio quando tudo foi ligado', () => {
    const def = DEFINICOES_HISTORIA.find((d) => d.desafio.id === 'historia/linha-do-tempo/cadeia')!
    const inst = def.desafio.gerar(1, 1)
    expect(def.podeEnviar({}, inst)).toBe(false)
    expect(def.podeEnviar(inst.certa, inst)).toBe(true)
  })
})

describe('Abas do tema', () => {
  it('Entenda: as 13 etapas renderizam, cada uma com “pare e pense” e a faixa cronológica', () => {
    const { container } = noRouter(<Entenda />)
    for (let i = 1; i <= 13; i++) {
      expect(screen.getByText(`Etapa ${i} de 13`)).toBeInTheDocument()
      expect(screen.getByText('Pare e pense')).toBeInTheDocument()
      expect(container.querySelectorAll('ol[aria-label^="Acontecimentos da etapa"] li').length).toBeGreaterThanOrEqual(3)
      if (i < 13) fireEvent.click(screen.getByRole('button', { name: /Próxima/ }))
    }
  })
  it('Resumo: oito seções, da Antiguidade até hoje, cada uma com as fontes', () => {
    const { container } = noRouter(<Resumo />)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(8)
    expect(container.textContent?.match(/Fontes:/g)?.length).toBe(8)
    expect(container.textContent).toContain('Antiguidade e Idade Média')
  })
})

describe('Laboratório', () => {
  it('Introdução: a linha do tempo e o card do acontecimento escolhido', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    expect(screen.getByRole('group', { name: /Linha do tempo/ })).toBeInTheDocument()
    expect(texto()).toContain('Escolha um acontecimento na linha do tempo')
    const r = noRouter(<Laboratorio />, '/?tela=intro&ev=b-abolicao')
    expect(r.container.textContent).toContain('Abolição da escravidão (1871–1888)')
    expect(r.container.textContent).toContain('Lei Áurea')
  })
  it('Introdução: zoom pela URL mostra o período pedido; filtro de região esconde o outro lado', () => {
    const r = noRouter(<Laboratorio />, '/?tela=intro&c=1822&s=20')
    expect(r.container.textContent).toContain('Mostrando de 1812 a 1832')
    const botoes = botoesDoEixo(r.container).map((b) => b.getAttribute('aria-label') as string)
    expect(botoes.some((n) => n.includes('Independência do Brasil'))).toBe(true)
    const so = noRouter(<Laboratorio />, '/?tela=intro&reg=brasil')
    const nomes = botoesDoEixo(so.container).map((b) => b.getAttribute('aria-label') as string)
    expect(nomes.some((n) => n.includes('Revolução Francesa'))).toBe(false)
    expect(nomes.some((n) => n.includes('Independência do Brasil'))).toBe(true)
  })
  it('Introdução: filtro por tipo tira os acontecimentos desse tipo', () => {
    noRouter(<Laboratorio />, '/?tela=intro&c=1930&s=60&gue=0')
    const nomes = botoesDoEixo(document.body).map((b) => b.getAttribute('aria-label') as string)
    expect(nomes.some((n) => n.includes('Segunda Guerra Mundial'))).toBe(false)
    expect(nomes.some((n) => n.includes('Era Vargas'))).toBe(true)
  })
  it('Introdução: os botões Aproximar e Afastar mudam a extensão mostrada', () => {
    noRouter(<Laboratorio />, '/?tela=intro&c=1800&s=200')
    expect(texto()).toContain('Mostrando de 1700 a 1900')
    fireEvent.click(screen.getByRole('button', { name: /Aproximar/ }))
    expect(texto()).toContain('Mostrando de 1730 a 1870')
    fireEvent.click(screen.getByRole('button', { name: /Ver tudo/ }))
    expect(texto()).toContain('Mostrando de 3600 a.C. a 2030')
  })
  it('Introdução: abre na época moderna (1440–2030)', () => {
    noRouter(<Laboratorio />, '/?tela=intro')
    expect(texto()).toContain('Mostrando de 1440 a 2030')
  })
  it('Explorar (lado a lado): de 1930 a 1945 aparecem a Era Vargas e a Segunda Guerra, em colunas separadas', () => {
    noRouter(<Laboratorio />, '/?tela=explorar')
    expect(texto()).toContain('De 1930 a 1945')
    expect(texto()).toContain('Era Vargas')
    expect(texto()).toContain('Segunda Guerra Mundial')
    expect(screen.getByRole('heading', { name: 'No Brasil' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No mundo' })).toBeInTheDocument()
    const todos = noRouter(<Laboratorio />, '/?tela=explorar&det=todos&per=p5')
    expect(todos.container.querySelectorAll('ol button').length).toBeGreaterThan(8)
  })
  it('Explorar (cadeia): o golpe de 1964 tem como causas Jânio e Jango, Cuba e a Guerra Fria; leva à ditadura', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=cadeia&ev=b-golpe-1964')
    const causas = screen.getByRole('heading', { name: /O que levou a ele/ }).parentElement as HTMLElement
    expect(within(causas).getByRole('button', { name: /Jânio, Jango e as reformas de base/ })).toBeInTheDocument()
    expect(within(causas).getByRole('button', { name: /Revolução Cubana/ })).toBeInTheDocument()
    expect(within(causas).getByRole('button', { name: /Guerra Fria/ })).toBeInTheDocument()
    const efeitos = screen.getByRole('heading', { name: /O que ele provocou/ }).parentElement as HTMLElement
    expect(within(efeitos).getByRole('button', { name: /Ditadura militar/ })).toBeInTheDocument()
    fireEvent.click(within(efeitos).getByRole('button', { name: /Ditadura militar/ }))
    expect(screen.getByRole('heading', { level: 3, name: /Ditadura militar/ })).toBeInTheDocument()
  })
  it('Explorar (cadeia): com duas etapas aparecem também as causas das causas', () => {
    noRouter(<Laboratorio />, '/?tela=explorar&vista=cadeia&ev=b-republica&prof=2')
    const causas = screen.getByRole('heading', { name: /O que levou a ele/ }).parentElement as HTMLElement
    // causa direta (Abolição) e causa da causa (Lei Eusébio de Queirós e Lei de Terras)
    expect(within(causas).getByRole('button', { name: /Abolição da escravidão/ })).toBeInTheDocument()
    expect(within(causas).getByRole('button', { name: /Lei Eusébio de Queirós/ })).toBeInTheDocument()
    const direta = noRouter(<Laboratorio />, '/?tela=explorar&vista=cadeia&ev=b-republica')
    const so = within(direta.container.querySelectorAll('h3')[0]?.parentElement as HTMLElement)
    expect(so.queryByRole('button', { name: /Lei Eusébio de Queirós/ })).toBeNull()
  })
  it('Laboratório (máquina do tempo): em 1822, Império no Brasil e Era das Revoluções no mundo, com a Independência em curso', () => {
    noRouter(<Laboratorio />, '/?tela=lab&a=1822')
    expect(texto()).toContain('Ano 1822')
    expect(texto()).toContain('Brasil: Império')
    expect(texto()).toContain('Mundo: Era das Revoluções')
    expect(screen.getByRole('button', { name: /Independência do Brasil/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Independências na América espanhola/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Independência do Brasil/ }))
    expect(screen.getByRole('heading', { level: 3, name: /Independência do Brasil/ })).toBeInTheDocument()
  })
  it('Laboratório (máquina do tempo): antes de 1500 não há colonização; em 1945, Guerra Fria e República de 1946', () => {
    noRouter(<Laboratorio />, '/?tela=lab&a=1460')
    expect(texto()).toContain('Brasil: Povos originários')
    const r = noRouter(<Laboratorio />, '/?tela=lab&a=1945')
    expect(r.container.textContent).toContain('Mundo: Guerra Fria')
    expect(r.container.textContent).toContain('Brasil: República de 1946')
  })
  it('Laboratório (máquina do tempo): na época antiga, 500 a.C. cai na Idade Antiga, com a República romana em curso', () => {
    noRouter(<Laboratorio />, '/?tela=lab&ep=antiga&a=-500')
    expect(texto()).toContain('Ano 500 a.C.')
    expect(texto()).toContain('Mundo: Idade Antiga')
    expect(screen.getByRole('button', { name: /República romana/ })).toBeInTheDocument()
  })
  it('Jogo: a tela do jogo abre', () => {
    noRouter(<Laboratorio />, '/?tela=jogo')
    expect(screen.getAllByRole('button').length).toBeGreaterThan(3)
  })
})
