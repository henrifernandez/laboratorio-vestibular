// @vitest-environment node
import { cadastrar, entrar, eu, excluirConta, gravarProgressoDaConta, lerProgressoDaConta, sair, type Deps } from './rotas.js'
import { criarKvMemoria } from './memoria.js'
import { criarHash, conferirSenha, resumoDoCodigo } from './senha.js'
import { idDoNome, validarNome, validarSenha } from './validacao.js'

const ORIGEM = 'https://lab.exemplo.app'

function pedido(metodo: string, caminho: string, corpo?: unknown, extras: Record<string, string> = {}): Request {
  const cabecalhos: Record<string, string> = { host: 'lab.exemplo.app', origin: ORIGEM, 'content-type': 'application/json', 'x-real-ip': '1.2.3.4', ...extras }
  return new Request(ORIGEM + caminho, { method: metodo, headers: cabecalhos, body: corpo === undefined ? undefined : JSON.stringify(corpo) })
}

const cookieDe = (r: Response) => /lv_sessao=([^;]*)/.exec(r.headers.get('set-cookie') ?? '')?.[1] ?? ''
const comCookie = (codigo: string) => ({ cookie: `lv_sessao=${codigo}` })
const json = async (r: Response) => (await r.json()) as Record<string, unknown>

function novoAmbiente(extra: Partial<Deps> = {}) {
  const kv = criarKvMemoria()
  const d: Deps = { kv, ...extra }
  return { kv, d }
}

const SENHA = 'uma senha boa 123'
async function criarConta(d: Deps, nome = 'Ana Lima', senha = SENHA, ip = '1.2.3.4') {
  const r = await cadastrar(pedido('POST', '/api/cadastrar', { nome, senha }, { 'x-real-ip': ip }), d)
  return { r, codigo: cookieDe(r) }
}

describe('Nome e senha (validação)', () => {
  it('nome: tamanho, caracteres permitidos e forma de comparar sem acento e sem maiúsculas', () => {
    expect(validarNome('  Ana   Lima ')).toEqual({ exibicao: 'Ana Lima', id: 'ana lima' })
    expect(idDoNome('JOÃO da Silva')).toBe('joao da silva')
    expect(validarNome('João')).toMatchObject({ id: 'joao' })
    for (const ruim of ['ab', 'a'.repeat(25), '<script>', 'ana@lima', '-ana', 123, null, undefined]) expect('erro' in validarNome(ruim), String(ruim)).toBe(true)
    expect('erro' in validarNome('Ana_Lima-2.0')).toBe(false)
  })
  it('senha: de 8 a 72 caracteres, diferente do nome e não repetida', () => {
    expect(validarSenha('curta', 'ana')).toContain('pelo menos 8')
    expect(validarSenha('x'.repeat(73), 'ana')).toContain('no máximo 72')
    expect(validarSenha('ana lima', 'ana lima')).toContain('igual ao nome')
    expect(validarSenha('aaaaaaaaaa', 'ana')).toContain('repetido')
    expect(validarSenha(SENHA, 'ana')).toBeNull()
    expect(validarSenha(12345678, 'ana')).not.toBeNull()
  })
})

describe('Hash de senha', () => {
  it('confere a senha certa, recusa a errada, e dois hashes da mesma senha são diferentes (sal)', async () => {
    const a = await criarHash('segredo muito bom')
    const b = await criarHash('segredo muito bom')
    expect(a.hash).not.toBe(b.hash)
    expect(a.sal).not.toBe(b.sal)
    expect(a.hash).not.toContain('segredo')
    expect(await conferirSenha('segredo muito bom', a.sal, a.hash)).toBe(true)
    expect(await conferirSenha('segredo muito bem', a.sal, a.hash)).toBe(false)
  })
})

describe('Cadastro', () => {
  it('cria a conta, abre a sessão (cookie HttpOnly, SameSite e Secure) e não guarda a senha em claro', async () => {
    const { kv, d } = novoAmbiente()
    const { r, codigo } = await criarConta(d)
    expect(r.status).toBe(201)
    expect(await json(r)).toEqual({ nome: 'Ana Lima' })
    const cookie = r.headers.get('set-cookie')!
    for (const parte of ['HttpOnly', 'SameSite=Lax', 'Secure', 'Path=/', 'Max-Age=2592000']) expect(cookie).toContain(parte)
    expect(codigo.length).toBeGreaterThan(30)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const todo = JSON.stringify([...kv.dados.entries()])
    expect(todo).not.toContain(SENHA)
    // o banco guarda só o resumo do código da sessão, nunca o código
    expect(todo).not.toContain(codigo)
    expect(kv.dados.has(`s:${resumoDoCodigo(codigo)}`)).toBe(true)
    expect(kv.expiracoes.get(`s:${resumoDoCodigo(codigo)}`)).toBe(2592000)
  })
  it('nome repetido (mesmo sem acento ou com outras maiúsculas) é recusado com 409', async () => {
    const { d } = novoAmbiente()
    await criarConta(d, 'João Silva')
    for (const igual of ['joao silva', 'JOÃO  SILVA']) {
      const { r } = await criarConta(d, igual)
      expect(r.status, igual).toBe(409)
    }
  })
  it('recusa nome e senha inválidos com mensagem clara (400)', async () => {
    const { d } = novoAmbiente()
    expect((await criarConta(d, 'a')).r.status).toBe(400)
    const curta = await criarConta(d, 'Bruno', '123')
    expect(curta.r.status).toBe(400)
    expect((await json(curta.r)).erro).toContain('pelo menos 8')
  })
  it('exige o código de convite quando ele está configurado, e o aviso aparece em /api/eu', async () => {
    const { d } = novoAmbiente({ convite: 'abra-te-sesamo' })
    expect(await json(await eu(pedido('GET', '/api/eu'), d))).toMatchObject({ disponivel: true, exigeConvite: true, usuario: null })
    const sem = await cadastrar(pedido('POST', '/api/cadastrar', { nome: 'Caio', senha: SENHA }), d)
    expect(sem.status).toBe(403)
    const errado = await cadastrar(pedido('POST', '/api/cadastrar', { nome: 'Caio', senha: SENHA, convite: 'outro' }), d)
    expect(errado.status).toBe(403)
    const ok = await cadastrar(pedido('POST', '/api/cadastrar', { nome: 'Caio', senha: SENHA, convite: ' abra-te-sesamo ' }), d)
    expect(ok.status).toBe(201)
  })
  it('limita a criação de contas por endereço (10 por hora)', async () => {
    const { d } = novoAmbiente()
    for (let i = 0; i < 10; i++) expect((await criarConta(d, `Pessoa ${i}x`, SENHA, '9.9.9.9')).r.status).toBe(201)
    const onze = await criarConta(d, 'Pessoa onze', SENHA, '9.9.9.9')
    expect(onze.r.status).toBe(429)
    // outro endereço não é afetado
    expect((await criarConta(d, 'Pessoa doze', SENHA, '8.8.8.8')).r.status).toBe(201)
  })
})

describe('Entrar e sair', () => {
  it('entra com nome e senha certos (sem diferenciar acento e maiúsculas no nome) e /api/eu mostra quem está logado', async () => {
    const { d } = novoAmbiente()
    await criarConta(d, 'João Silva')
    const r = await entrar(pedido('POST', '/api/entrar', { nome: 'joao SILVA', senha: SENHA }), d)
    expect(r.status).toBe(200)
    expect(await json(r)).toEqual({ nome: 'João Silva' })
    const quem = await eu(pedido('GET', '/api/eu', undefined, comCookie(cookieDe(r))), d)
    expect(await json(quem)).toMatchObject({ disponivel: true, usuario: { nome: 'João Silva' } })
  })
  it('senha errada, nome inexistente e nome inválido dão exatamente a mesma resposta (não revela quem tem conta)', async () => {
    const { d } = novoAmbiente()
    await criarConta(d)
    const respostas = await Promise.all([
      entrar(pedido('POST', '/api/entrar', { nome: 'Ana Lima', senha: 'senha errada 1' }), d),
      entrar(pedido('POST', '/api/entrar', { nome: 'Ninguém Aqui', senha: SENHA }), d),
      entrar(pedido('POST', '/api/entrar', { nome: '<<>>', senha: SENHA }), d),
    ])
    const corpos = await Promise.all(respostas.map((r) => json(r)))
    for (const r of respostas) expect(r.status).toBe(401)
    expect(new Set(corpos.map((c) => JSON.stringify(c))).size).toBe(1)
    for (const r of respostas) expect(r.headers.get('set-cookie')).toBeNull()
  })
  it('bloqueia o nome depois de 8 senhas erradas seguidas, mesmo com a senha certa, e a senha certa zera a contagem antes do limite', async () => {
    const { d } = novoAmbiente()
    await criarConta(d)
    for (let i = 0; i < 7; i++) expect((await entrar(pedido('POST', '/api/entrar', { nome: 'Ana Lima', senha: `errada ${i}` }, { 'x-real-ip': `7.7.7.${i}` }), d)).status).toBe(401)
    // a senha certa na 8ª tentativa ainda entra e limpa a contagem
    expect((await entrar(pedido('POST', '/api/entrar', { nome: 'Ana Lima', senha: SENHA }), d)).status).toBe(200)
    for (let i = 0; i < 8; i++) await entrar(pedido('POST', '/api/entrar', { nome: 'Ana Lima', senha: `errada ${i}` }, { 'x-real-ip': `6.6.6.${i}` }), d)
    const bloqueada = await entrar(pedido('POST', '/api/entrar', { nome: 'Ana Lima', senha: SENHA }), d)
    expect(bloqueada.status).toBe(429)
  })
  it('limita as tentativas por endereço (40 em 15 minutos)', async () => {
    const { d } = novoAmbiente()
    for (let i = 0; i < 40; i++) await entrar(pedido('POST', '/api/entrar', { nome: `Alguém ${i}`, senha: 'qualquer coisa' }, { 'x-real-ip': '5.5.5.5' }), d)
    expect((await entrar(pedido('POST', '/api/entrar', { nome: 'Alguém', senha: 'qualquer coisa' }, { 'x-real-ip': '5.5.5.5' }), d)).status).toBe(429)
  })
  it('sair apaga a sessão do banco e limpa o cookie; depois disso a sessão antiga não vale', async () => {
    const { kv, d } = novoAmbiente()
    const { codigo } = await criarConta(d)
    const r = await sair(pedido('POST', '/api/sair', {}, comCookie(codigo)), d)
    expect(r.status).toBe(200)
    expect(r.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(kv.dados.has(`s:${resumoDoCodigo(codigo)}`)).toBe(false)
    expect(await json(await eu(pedido('GET', '/api/eu', undefined, comCookie(codigo)), d))).toMatchObject({ usuario: null })
  })
})

describe('Segurança dos pedidos', () => {
  it('recusa pedidos de outra origem (403) e corpo que não é JSON (415)', async () => {
    const { d } = novoAmbiente()
    const outraOrigem = await cadastrar(pedido('POST', '/api/cadastrar', { nome: 'Dani', senha: SENHA }, { origin: 'https://site-malicioso.exemplo' }), d)
    expect(outraOrigem.status).toBe(403)
    const naoJson = await cadastrar(pedido('POST', '/api/cadastrar', { nome: 'Dani', senha: SENHA }, { 'content-type': 'text/plain' }), d)
    expect(naoJson.status).toBe(415)
    // sem origem informada (por exemplo, curl) continua valendo, pois não há cookie de outro site para abusar
    const { origin: _origem, ...semOrigem } = { host: 'lab.exemplo.app', 'content-type': 'application/json' } as Record<string, string>
    void _origem
    const ok = await cadastrar(new Request(ORIGEM + '/api/cadastrar', { method: 'POST', headers: semOrigem, body: JSON.stringify({ nome: 'Dani', senha: SENHA }) }), d)
    expect(ok.status).toBe(201)
  })
  it('corpo inválido ou grande demais não derruba a rota', async () => {
    const { d } = novoAmbiente()
    const quebrado = await cadastrar(new Request(ORIGEM + '/api/cadastrar', { method: 'POST', headers: { origin: ORIGEM, host: 'lab.exemplo.app', 'content-type': 'application/json' }, body: '{nome' }), d)
    expect(quebrado.status).toBe(400)
    const grande = await cadastrar(new Request(ORIGEM + '/api/cadastrar', { method: 'POST', headers: { origin: ORIGEM, host: 'lab.exemplo.app', 'content-type': 'application/json' }, body: JSON.stringify({ nome: 'x', lixo: 'y'.repeat(400_000) }) }), d)
    expect(grande.status).toBe(413)
    const lista = await cadastrar(pedido('POST', '/api/cadastrar', [1, 2, 3]), d)
    expect(lista.status).toBe(400)
  })
  it('sem banco ligado, as contas ficam indisponíveis (503) e /api/eu avisa, sem erro', async () => {
    const d: Deps = { kv: null }
    expect(await json(await eu(pedido('GET', '/api/eu'), d))).toEqual({ disponivel: false, usuario: null, exigeConvite: false })
    expect((await cadastrar(pedido('POST', '/api/cadastrar', { nome: 'Edu', senha: SENHA }), d)).status).toBe(503)
    expect((await entrar(pedido('POST', '/api/entrar', { nome: 'Edu', senha: SENHA }), d)).status).toBe(503)
    expect((await lerProgressoDaConta(pedido('GET', '/api/progresso'), d)).status).toBe(503)
  })
  it('falha do banco vira resposta genérica, sem detalhes internos', async () => {
    const { kv, d } = novoAmbiente()
    kv.get = async () => {
      throw new Error('senha do banco: segredo-interno')
    }
    const r = await eu(pedido('GET', '/api/eu', undefined, comCookie('c'.repeat(40))), d)
    expect(r.status).toBe(503)
    expect(JSON.stringify(await json(r))).not.toContain('segredo-interno')
  })
  it('cookie com valor estranho não autentica ninguém', async () => {
    const { d } = novoAmbiente()
    await criarConta(d)
    for (const ruim of ['', 'abc', 'x'.repeat(200), 'ana lima', '../../u:ana%20lima']) expect((await lerProgressoDaConta(pedido('GET', '/api/progresso', undefined, comCookie(ruim)), d)).status, ruim).toBe(401)
  })
})

describe('Progresso na conta', () => {
  const registro = (tentativas: number, acertos: number, data = '2026-10-12') => ({ tentativas, acertos, ultimo: acertos > 0, data })

  it('exige conta para ler e para gravar', async () => {
    const { d } = novoAmbiente()
    expect((await lerProgressoDaConta(pedido('GET', '/api/progresso'), d)).status).toBe(401)
    expect((await gravarProgressoDaConta(pedido('PUT', '/api/progresso', { progresso: {} }), d)).status).toBe(401)
  })
  it('grava, junta com o que já existe (vale o registro com mais tentativas) e devolve o resultado', async () => {
    const { d } = novoAmbiente()
    const { codigo } = await criarConta(d)
    const c = comCookie(codigo)
    const um = await gravarProgressoDaConta(pedido('PUT', '/api/progresso', { progresso: { 'fisica/dinamica/leis:1': registro(3, 2), 'quimica/solucoes/diluicao:2': registro(1, 1) } }, c), d)
    expect(um.status).toBe(200)
    // outro aparelho, com contagens diferentes: o de mais tentativas vence, os dois conjuntos de chaves ficam
    const dois = await gravarProgressoDaConta(pedido('PUT', '/api/progresso', { progresso: { 'fisica/dinamica/leis:1': registro(2, 2), 'quimica/solucoes/diluicao:2': registro(4, 3), 'historia/linha-do-tempo/ordem:1': registro(1, 0) } }, c), d)
    const junto = (await json(dois)).progresso as Record<string, { tentativas: number }>
    expect(junto['fisica/dinamica/leis:1']!.tentativas).toBe(3)
    expect(junto['quimica/solucoes/diluicao:2']!.tentativas).toBe(4)
    expect(Object.keys(junto)).toHaveLength(3)
    const lido = await json(await lerProgressoDaConta(pedido('GET', '/api/progresso', undefined, c), d))
    expect(lido.progresso).toEqual(junto)
  })
  it('cada conta enxerga só o próprio progresso', async () => {
    const { d } = novoAmbiente()
    const ana = await criarConta(d, 'Ana Lima')
    const bia = await criarConta(d, 'Bia Souza')
    await gravarProgressoDaConta(pedido('PUT', '/api/progresso', { progresso: { 'fisica/dinamica/leis:1': registro(3, 2) } }, comCookie(ana.codigo)), d)
    expect((await json(await lerProgressoDaConta(pedido('GET', '/api/progresso', undefined, comCookie(bia.codigo)), d))).progresso).toEqual({})
  })
  it('descarta entradas fora do formato e recusa o que não é um dicionário', async () => {
    const { d } = novoAmbiente()
    const { codigo } = await criarConta(d)
    const c = comCookie(codigo)
    const r = await gravarProgressoDaConta(
      pedido('PUT', '/api/progresso', { progresso: { 'fisica/dinamica/leis:1': registro(3, 2), 'chave-ruim': registro(1, 1), 'a/b/c:9': registro(1, 1), 'a/b/c:1': registro(2, 5), '__proto__/x/y:1': registro(1, 1), 'fisica/dinamica/outro:2': { tentativas: 1.5, acertos: 0, ultimo: false, data: '2026-10-12' } } }, c),
      d,
    )
    expect(Object.keys((await json(r)).progresso as object)).toEqual(['fisica/dinamica/leis:1'])
    for (const ruim of [null, 5, 'texto', [1, 2]]) expect((await gravarProgressoDaConta(pedido('PUT', '/api/progresso', { progresso: ruim }, c), d)).status, String(ruim)).toBe(400)
    const demais = Object.fromEntries(Array.from({ length: 2001 }, (_, i) => [`m/t/d${i}:1`, registro(1, 1)]))
    expect((await gravarProgressoDaConta(pedido('PUT', '/api/progresso', { progresso: demais }, c), d)).status).toBe(400)
  })
})

describe('Excluir a conta', () => {
  it('pede a senha de novo; com a senha certa apaga conta, progresso e sessão, e o nome fica livre', async () => {
    const { kv, d } = novoAmbiente()
    const { codigo } = await criarConta(d)
    const c = comCookie(codigo)
    await gravarProgressoDaConta(pedido('PUT', '/api/progresso', { progresso: { 'fisica/dinamica/leis:1': { tentativas: 1, acertos: 1, ultimo: true, data: '2026-10-12' } } }, c), d)
    expect((await excluirConta(pedido('POST', '/api/excluir-conta', { senha: 'errada demais' }, c), d)).status).toBe(401)
    expect((await excluirConta(pedido('POST', '/api/excluir-conta', { senha: SENHA }), d)).status).toBe(401) // sem sessão
    const ok = await excluirConta(pedido('POST', '/api/excluir-conta', { senha: SENHA }, c), d)
    expect(ok.status).toBe(200)
    expect([...kv.dados.keys()].filter((k) => k.startsWith('u:') || k.startsWith('p:') || k.startsWith('s:'))).toEqual([])
    expect((await criarConta(d)).r.status).toBe(201)
  })
})
