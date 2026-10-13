import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/app/App'
import { criarKvMemoria } from '../../servidor/memoria'
import { cadastrar, entrar, eu, excluirConta, gravarProgressoDaConta, lerProgressoDaConta, sair, type Deps } from '../../servidor/rotas'
import { lerProgresso, registrarTentativa } from '@/desafios/progresso'
import { ContaProvider } from './ContaContext'

/**
 * O navegador de mentira fala com as rotas de verdade (as de `api/`), com um banco na memória e um "pote de cookies":
 * o teste cobre a tela, a sincronização e o servidor juntos.
 */
function instalarServidor(deps: Deps) {
  let cookie = ''
  const rotas: Record<string, (r: Request, d: Deps) => Promise<Response>> = {
    'GET /api/eu': eu,
    'POST /api/cadastrar': cadastrar,
    'POST /api/entrar': entrar,
    'POST /api/sair': sair,
    'GET /api/progresso': lerProgressoDaConta,
    'PUT /api/progresso': gravarProgressoDaConta,
    'POST /api/excluir-conta': excluirConta,
  }
  const chamadas: string[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    const metodo = (init.method ?? 'GET').toUpperCase()
    chamadas.push(`${metodo} ${url}`)
    const cabecalhos = new Headers(init.headers)
    cabecalhos.set('origin', 'http://localhost')
    cabecalhos.set('host', 'localhost')
    cabecalhos.set('x-real-ip', '10.0.0.1')
    if (cookie) cabecalhos.set('cookie', cookie)
    const req = new Request(`http://localhost${url}`, { method: metodo, headers: cabecalhos, body: init.body ?? undefined })
    const rota = rotas[`${metodo} ${url}`]
    if (!rota) return new Response('{}', { status: 404 })
    const r = await rota(req, deps)
    const novo = r.headers.get('set-cookie')
    if (novo) cookie = /Max-Age=0/.test(novo) ? '' : novo.split(';')[0]!
    return r
  })
  return { chamadas, limparCookie: () => (cookie = '') }
}

function abrir(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ContaProvider>
        <App />
      </ContaProvider>
    </MemoryRouter>,
  )
}

const preencher = (rotulo: RegExp | string, valor: string) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Contas no site (tela + servidor)', () => {
  it('sem banco ligado, o site some com o botão Entrar e a página de entrada explica', async () => {
    instalarServidor({ kv: null })
    abrir('/entrar')
    expect(await screen.findByRole('heading', { name: 'Contas indisponíveis' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Entrar' })).toBeNull()
    expect(document.body.textContent).toContain('o progresso fica guardado neste navegador')
  })

  it('anônimo vê o link Entrar; criar conta leva à área da conta, mostra o nome no cabeçalho e guarda o progresso do aparelho no servidor', async () => {
    const kv = criarKvMemoria()
    instalarServidor({ kv })
    registrarTentativa('fisica/dinamica/leis:1', true, new Date('2026-10-12T12:00:00'))
    registrarTentativa('fisica/dinamica/leis:1', false, new Date('2026-10-12T12:01:00'))
    abrir('/')
    const link = await screen.findByRole('link', { name: 'Entrar' })
    fireEvent.click(link)
    fireEvent.click(await screen.findByRole('button', { name: 'Criar conta' }))
    preencher('Nome', 'Ana Lima')
    preencher('Senha', 'uma senha boa 123')
    expect(document.body.textContent).toContain('não dá para recuperá-la')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta e entrar' }))
    expect(await screen.findByRole('heading', { name: 'Olá, Ana Lima' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Minha conta, Ana Lima' })).toBeInTheDocument()
    // a sincronização enviou o progresso do aparelho
    await waitFor(() => expect(document.body.textContent).toContain('Progresso sincronizado com a conta'))
    const guardado = JSON.parse(kv.dados.get('p:ana%20lima')!) as Record<string, { tentativas: number; acertos: number }>
    expect(guardado['fisica/dinamica/leis:1']).toMatchObject({ tentativas: 2, acertos: 1 })
    // a senha nunca é guardada em claro
    expect(JSON.stringify([...kv.dados.values()])).not.toContain('uma senha boa 123')
  })

  it('em outro aparelho (armazenamento vazio), entrar traz o progresso de volta; sair com “apagar” limpa o aparelho', async () => {
    const kv = criarKvMemoria()
    const srv = instalarServidor({ kv })
    registrarTentativa('quimica/solucoes/diluicao:2', true, new Date('2026-10-12T10:00:00'))
    const primeiro = abrir('/entrar')
    fireEvent.click(await screen.findByRole('button', { name: 'Criar conta' }))
    preencher('Nome', 'Bia Souza')
    preencher('Senha', 'outra senha boa 456')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta e entrar' }))
    await screen.findByRole('heading', { name: 'Olá, Bia Souza' })
    await waitFor(() => expect(document.body.textContent).toContain('Progresso sincronizado'))
    fireEvent.click(screen.getByLabelText(/Apagar também o progresso guardado neste aparelho/))
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))
    await waitFor(() => expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument())
    expect(lerProgresso()).toEqual({})
    primeiro.unmount()

    // "outro aparelho": nada guardado, sem cookie
    localStorage.clear()
    srv.limparCookie()
    abrir('/entrar')
    preencher('Nome', 'bia souza')
    preencher('Senha', 'outra senha boa 456')
    fireEvent.click(await screen.findByRole('button', { name: 'Entrar' }))
    await screen.findByRole('heading', { name: 'Olá, Bia Souza' })
    await waitFor(() => expect(lerProgresso()['quimica/solucoes/diluicao:2']).toMatchObject({ tentativas: 1, acertos: 1 }))
  })

  it('senha errada mostra a mensagem do servidor num alerta; senha curta é avisada antes de enviar', async () => {
    const kv = criarKvMemoria()
    const srv = instalarServidor({ kv })
    abrir('/entrar')
    fireEvent.click(await screen.findByRole('button', { name: 'Criar conta' }))
    preencher('Nome', 'Caio Melo')
    preencher('Senha', 'curta')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta e entrar' }))
    expect((await screen.findByRole('alert')).textContent).toContain('pelo menos 8')
    expect(srv.chamadas.filter((c) => c.includes('cadastrar'))).toHaveLength(0)
    preencher('Senha', 'senha correta 789')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta e entrar' }))
    await screen.findByRole('heading', { name: 'Olá, Caio Melo' })
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))
    await screen.findByRole('link', { name: 'Entrar' })
    fireEvent.click(screen.getByRole('link', { name: 'Entrar' }))
    preencher('Nome', 'Caio Melo')
    preencher('Senha', 'senha errada 000')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Nome ou senha incorretos.')
  })

  it('pede o código de convite quando o servidor exige', async () => {
    instalarServidor({ kv: criarKvMemoria(), convite: 'segredo-do-grupo' })
    abrir('/entrar')
    fireEvent.click(await screen.findByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByLabelText('Código de convite')).toBeInTheDocument()
    preencher('Nome', 'Duda Reis')
    preencher('Senha', 'senha do convite 1')
    preencher('Código de convite', 'errado')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta e entrar' }))
    expect((await screen.findByRole('alert')).textContent).toContain('código de convite')
    preencher('Código de convite', 'segredo-do-grupo')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta e entrar' }))
    expect(await screen.findByRole('heading', { name: 'Olá, Duda Reis' })).toBeInTheDocument()
  })

  it('excluir a conta pede a senha, apaga no servidor e volta para o início; o progresso do aparelho continua', async () => {
    const kv = criarKvMemoria()
    instalarServidor({ kv })
    registrarTentativa('fisica/dinamica/leis:1', true, new Date('2026-10-12T12:00:00'))
    abrir('/entrar')
    fireEvent.click(await screen.findByRole('button', { name: 'Criar conta' }))
    preencher('Nome', 'Edu Pinto')
    preencher('Senha', 'senha para excluir 1')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta e entrar' }))
    await screen.findByRole('heading', { name: 'Olá, Edu Pinto' })
    preencher('Senha para confirmar', 'senha errada 123')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Senha incorreta.')
    preencher('Senha para confirmar', 'senha para excluir 1')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await screen.findByRole('link', { name: 'Entrar' })
    expect([...kv.dados.keys()].filter((k) => k.startsWith('u:') || k.startsWith('p:'))).toEqual([])
    expect(lerProgresso()['fisica/dinamica/leis:1']).toBeDefined()
  })

  it('a página da conta leva anônimos para a entrada, e quem já está logado não vê o formulário de entrada', async () => {
    instalarServidor({ kv: criarKvMemoria() })
    abrir('/conta')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    await act(async () => {})
  })
})
