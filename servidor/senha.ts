import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

/**
 * Senhas guardadas com scrypt (função própria para senhas, lenta de propósito) e um sal aleatório por conta.
 * N = 2^14, r = 8, p = 1: cerca de 50 ms por tentativa, o que atrapalha quem tenta adivinhar senhas em massa.
 */
const PARAMETROS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const TAMANHO = 64

function derivar(senha: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha.normalize('NFKC'), sal, TAMANHO, PARAMETROS, (erro, chave) => (erro ? reject(erro) : resolve(chave)))
  })
}

export async function criarHash(senha: string): Promise<{ sal: string; hash: string }> {
  const sal = randomBytes(16)
  return { sal: sal.toString('hex'), hash: (await derivar(senha, sal)).toString('hex') }
}

export async function conferirSenha(senha: string, sal: string, hash: string): Promise<boolean> {
  const esperado = Buffer.from(hash, 'hex')
  const obtido = await derivar(senha, Buffer.from(sal, 'hex'))
  return esperado.length === obtido.length && timingSafeEqual(esperado, obtido)
}

/** Sal e hash de mentira, para gastar o mesmo tempo quando o nome não existe (não revelar quais nomes têm conta). */
export const SENHA_FALSA = { sal: '00112233445566778899aabbccddeeff', hash: '00'.repeat(TAMANHO) }

/** Sessões: o cookie leva um código aleatório, e o banco guarda só o resumo dele (um vazamento do banco não entrega sessões vivas). */
export const novoCodigoDeSessao = () => randomBytes(32).toString('base64url')
export const resumoDoCodigo = (codigo: string) => createHash('sha256').update(codigo).digest('hex')
