import { createHash, timingSafeEqual } from 'node:crypto'
import { mesclarProgresso, sanitizarProgresso, type DicionarioProgresso } from '../src/lib/mesclar.js'
import type { Kv } from './kv.js'
import { SENHA_FALSA, conferirSenha, criarHash, novoCodigoDeSessao, resumoDoCodigo } from './senha.js'
import { validarNome, validarSenha } from './validacao.js'

/** Tudo de que as rotas dependem de fora, para os testes trocarem o banco, a variável de convite e o relógio. */
export interface Deps {
  /** nulo quando o banco não está ligado ao projeto: as contas ficam indisponíveis e o site segue funcionando sem elas */
  kv: Kv | null
  /** código de convite exigido para criar conta (opcional) */
  convite?: string
}

export const COOKIE = 'lv_sessao'
const SESSAO_SEGUNDOS = 60 * 60 * 24 * 30
const LIMITE_CORPO = 300_000
const JANELA_LOGIN = 15 * 60

interface Conta {
  nome: string
  sal: string
  hash: string
  criado: string
}

const chaveConta = (id: string) => `u:${encodeURIComponent(id)}`
const chaveSessao = (codigo: string) => `s:${resumoDoCodigo(codigo)}`
const chaveProgresso = (id: string) => `p:${encodeURIComponent(id)}`

/* ------------------------------------------------------------------ respostas */

function resposta(status: number, corpo: unknown, cabecalhos: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...cabecalhos },
  })
}
const erro = (status: number, mensagem: string, cabecalhos?: Record<string, string>) => resposta(status, { erro: mensagem }, cabecalhos)

const https = (req: Request) => new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https'

function cookieDeSessao(req: Request, codigo: string, segundos = SESSAO_SEGUNDOS): string {
  return `${COOKIE}=${codigo}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${segundos}${https(req) ? '; Secure' : ''}`
}

/* ------------------------------------------------------------------ verificações comuns */

const SEM_BANCO = () => erro(503, 'As contas estão indisponíveis no momento. Você pode continuar estudando sem entrar.')

/**
 * Pedidos que mudam algo precisam vir do próprio site: o corpo é JSON e, quando o navegador informa a origem, ela é o mesmo
 * endereço do site. (Junto com o cookie SameSite, isso barra pedidos forjados por outras páginas.)
 */
function conferirOrigemEJson(req: Request): Response | null {
  const origem = req.headers.get('origin')
  if (origem) {
    let host: string
    try {
      host = new URL(origem).host
    } catch {
      return erro(403, 'Pedido de origem desconhecida.')
    }
    const meu = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? new URL(req.url).host
    if (host !== meu) return erro(403, 'Pedido de origem desconhecida.')
  }
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return erro(415, 'Envie os dados em JSON.')
  return null
}

async function lerCorpo(req: Request): Promise<Record<string, unknown> | Response> {
  const texto = await req.text()
  if (texto.length > LIMITE_CORPO) return erro(413, 'Pedido grande demais.')
  try {
    const v = JSON.parse(texto) as unknown
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return erro(400, 'Dados inválidos.')
    return v as Record<string, unknown>
  } catch {
    return erro(400, 'Dados inválidos.')
  }
}

const ipDe = (req: Request) => (req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'desconhecido').trim()

function cookieDe(req: Request, nome: string): string | null {
  for (const parte of (req.headers.get('cookie') ?? '').split(';')) {
    const i = parte.indexOf('=')
    if (i > 0 && parte.slice(0, i).trim() === nome) return parte.slice(i + 1).trim()
  }
  return null
}

/** Compara dois textos sem vazar, pelo tempo, onde eles diferem. */
function iguaisSemVazar(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

/** Conta uma ocorrência e diz se ainda está dentro do limite (para limitar criação de contas por endereço). */
async function dentroDoLimite(kv: Kv, chave: string, maximo: number, janela: number): Promise<boolean> {
  const n = await kv.incr(chave)
  if (n === 1) await kv.expire(chave, janela)
  return n <= maximo
}

async function falhasAtuais(kv: Kv, chave: string): Promise<number> {
  return Number((await kv.get(chave)) ?? 0)
}
async function registrarFalha(kv: Kv, chave: string): Promise<void> {
  const n = await kv.incr(chave)
  if (n === 1) await kv.expire(chave, JANELA_LOGIN)
}

/** A conta da sessão deste pedido, ou nulo. */
async function contaDaSessao(req: Request, kv: Kv): Promise<{ id: string; conta: Conta; codigo: string } | null> {
  const codigo = cookieDe(req, COOKIE)
  if (!codigo || codigo.length < 20 || codigo.length > 100) return null
  const id = await kv.get(chaveSessao(codigo))
  if (!id) return null
  const bruto = await kv.get(chaveConta(id))
  if (!bruto) return null
  return { id, conta: JSON.parse(bruto) as Conta, codigo }
}

async function abrirSessao(kv: Kv, id: string): Promise<string> {
  const codigo = novoCodigoDeSessao()
  await kv.set(chaveSessao(codigo), id, { ex: SESSAO_SEGUNDOS })
  return codigo
}

/** Qualquer falha inesperada vira uma resposta genérica, sem detalhes internos. */
async function protegido(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch {
    return erro(503, 'Não foi possível falar com o servidor agora. Tente de novo em instantes.')
  }
}

/* ------------------------------------------------------------------ rotas */

/** GET /api/eu: o site pergunta se as contas existem e quem está logado. */
export function eu(req: Request, d: Deps): Promise<Response> {
  return protegido(async () => {
    if (!d.kv) return resposta(200, { disponivel: false, usuario: null, exigeConvite: false })
    const s = await contaDaSessao(req, d.kv)
    return resposta(200, { disponivel: true, usuario: s ? { nome: s.conta.nome } : null, exigeConvite: !!d.convite })
  })
}

/** POST /api/cadastrar: cria a conta (nome e senha) e já entra. */
export function cadastrar(req: Request, d: Deps): Promise<Response> {
  return protegido(async () => {
    if (!d.kv) return SEM_BANCO()
    const invalido = conferirOrigemEJson(req)
    if (invalido) return invalido
    if (!(await dentroDoLimite(d.kv, `rl:cad:${ipDe(req)}`, 10, 3600))) return erro(429, 'Muitas contas criadas deste endereço. Tente de novo mais tarde.')
    const corpo = await lerCorpo(req)
    if (corpo instanceof Response) return corpo
    const nome = validarNome(corpo.nome)
    if ('erro' in nome) return erro(400, nome.erro)
    const problema = validarSenha(corpo.senha, nome.id)
    if (problema) return erro(400, problema)
    if (d.convite && !(typeof corpo.convite === 'string' && iguaisSemVazar(corpo.convite.trim(), d.convite))) return erro(403, 'O código de convite está incorreto.')
    const { sal, hash } = await criarHash(corpo.senha as string)
    const conta: Conta = { nome: nome.exibicao, sal, hash, criado: new Date().toISOString() }
    // "só se não existir": dois cadastros ao mesmo tempo com o mesmo nome não passam os dois
    if (!(await d.kv.set(chaveConta(nome.id), JSON.stringify(conta), { nx: true }))) return erro(409, 'Já existe uma conta com esse nome. Escolha outro ou entre com a senha.')
    const codigo = await abrirSessao(d.kv, nome.id)
    return resposta(201, { nome: conta.nome }, { 'set-cookie': cookieDeSessao(req, codigo) })
  })
}

/** POST /api/entrar */
export function entrar(req: Request, d: Deps): Promise<Response> {
  return protegido(async () => {
    if (!d.kv) return SEM_BANCO()
    const invalido = conferirOrigemEJson(req)
    if (invalido) return invalido
    const ip = ipDe(req)
    if (!(await dentroDoLimite(d.kv, `rl:ent:ip:${ip}`, 40, JANELA_LOGIN))) return erro(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.')
    const corpo = await lerCorpo(req)
    if (corpo instanceof Response) return corpo
    const nome = validarNome(corpo.nome)
    const senha = typeof corpo.senha === 'string' && corpo.senha.length <= 200 ? corpo.senha : ''
    // mensagem única para nome inexistente, nome inválido e senha errada
    const generica = () => erro(401, 'Nome ou senha incorretos.')
    if ('erro' in nome) {
      await conferirSenha(senha, SENHA_FALSA.sal, SENHA_FALSA.hash)
      return generica()
    }
    const chaveFalhas = `rl:ent:u:${encodeURIComponent(nome.id)}`
    if ((await falhasAtuais(d.kv, chaveFalhas)) >= 8) return erro(429, 'Muitas tentativas para este nome. Aguarde alguns minutos e tente de novo.')
    const bruto = await d.kv.get(chaveConta(nome.id))
    const conta = bruto ? (JSON.parse(bruto) as Conta) : null
    const ok = await conferirSenha(senha, conta?.sal ?? SENHA_FALSA.sal, conta?.hash ?? SENHA_FALSA.hash)
    if (!conta || !ok) {
      await registrarFalha(d.kv, chaveFalhas)
      return generica()
    }
    await d.kv.del(chaveFalhas)
    const codigo = await abrirSessao(d.kv, nome.id)
    return resposta(200, { nome: conta.nome }, { 'set-cookie': cookieDeSessao(req, codigo) })
  })
}

/** POST /api/sair */
export function sair(req: Request, d: Deps): Promise<Response> {
  return protegido(async () => {
    const invalido = conferirOrigemEJson(req)
    if (invalido) return invalido
    const codigo = cookieDe(req, COOKIE)
    if (d.kv && codigo && codigo.length < 100) await d.kv.del(chaveSessao(codigo))
    return resposta(200, { ok: true }, { 'set-cookie': cookieDeSessao(req, '', 0) })
  })
}

/** GET /api/progresso */
export function lerProgressoDaConta(req: Request, d: Deps): Promise<Response> {
  return protegido(async () => {
    if (!d.kv) return SEM_BANCO()
    const s = await contaDaSessao(req, d.kv)
    if (!s) return erro(401, 'Entre para ver o progresso da conta.')
    const bruto = await d.kv.get(chaveProgresso(s.id))
    return resposta(200, { progresso: bruto ? (JSON.parse(bruto) as DicionarioProgresso) : {} })
  })
}

/** PUT /api/progresso: junta o progresso enviado com o guardado e devolve o resultado. */
export function gravarProgressoDaConta(req: Request, d: Deps): Promise<Response> {
  return protegido(async () => {
    if (!d.kv) return SEM_BANCO()
    const invalido = conferirOrigemEJson(req)
    if (invalido) return invalido
    const s = await contaDaSessao(req, d.kv)
    if (!s) return erro(401, 'Entre para guardar o progresso na conta.')
    const corpo = await lerCorpo(req)
    if (corpo instanceof Response) return corpo
    const novo = sanitizarProgresso(corpo.progresso)
    if (!novo) return erro(400, 'Progresso inválido.')
    const bruto = await d.kv.get(chaveProgresso(s.id))
    const guardado = bruto ? (sanitizarProgresso(JSON.parse(bruto)) ?? {}) : {}
    const junto = mesclarProgresso(guardado, novo)
    await d.kv.set(chaveProgresso(s.id), JSON.stringify(junto))
    return resposta(200, { progresso: junto })
  })
}

/** POST /api/excluir-conta: apaga a conta e o progresso guardado; pede a senha de novo. */
export function excluirConta(req: Request, d: Deps): Promise<Response> {
  return protegido(async () => {
    if (!d.kv) return SEM_BANCO()
    const invalido = conferirOrigemEJson(req)
    if (invalido) return invalido
    const s = await contaDaSessao(req, d.kv)
    if (!s) return erro(401, 'Entre para excluir a conta.')
    const corpo = await lerCorpo(req)
    if (corpo instanceof Response) return corpo
    const senha = typeof corpo.senha === 'string' && corpo.senha.length <= 200 ? corpo.senha : ''
    const chaveFalhas = `rl:ent:u:${encodeURIComponent(s.id)}`
    if ((await falhasAtuais(d.kv, chaveFalhas)) >= 8) return erro(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.')
    if (!(await conferirSenha(senha, s.conta.sal, s.conta.hash))) {
      await registrarFalha(d.kv, chaveFalhas)
      return erro(401, 'Senha incorreta.')
    }
    await d.kv.del(chaveProgresso(s.id))
    await d.kv.del(chaveSessao(s.codigo))
    await d.kv.del(chaveConta(s.id))
    return resposta(200, { ok: true }, { 'set-cookie': cookieDeSessao(req, '', 0) })
  })
}
