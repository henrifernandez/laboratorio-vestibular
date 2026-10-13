/** Regras de nome e de senha, no servidor (o formulário repete as mesmas regras só para avisar mais cedo). */

export const NOME_MIN = 3
export const NOME_MAX = 24
export const SENHA_MIN = 8
export const SENHA_MAX = 72

export interface NomeValido {
  /** como a pessoa escreveu (com maiúsculas e acentos), com espaços ajustados */
  exibicao: string
  /** forma usada para comparar e guardar: sem acentos, minúsculas, espaços únicos */
  id: string
}

const PERMITIDO = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u

/** Remove acentos e passa para minúsculas, para "João" e "joao" serem o mesmo nome. */
export const idDoNome = (nome: string) =>
  nome
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

export function validarNome(bruto: unknown): NomeValido | { erro: string } {
  if (typeof bruto !== 'string') return { erro: 'Escreva um nome.' }
  const exibicao = bruto.normalize('NFC').replace(/\s+/g, ' ').trim()
  if ([...exibicao].length < NOME_MIN) return { erro: `O nome precisa ter pelo menos ${NOME_MIN} caracteres.` }
  if ([...exibicao].length > NOME_MAX) return { erro: `O nome pode ter no máximo ${NOME_MAX} caracteres.` }
  if (!PERMITIDO.test(exibicao)) return { erro: 'Use só letras, números, espaço, ponto, hífen ou sublinhado, começando por letra ou número.' }
  return { exibicao, id: idDoNome(exibicao) }
}

export function validarSenha(senha: unknown, idNome: string): string | null {
  if (typeof senha !== 'string') return 'Escreva uma senha.'
  if (senha.length < SENHA_MIN) return `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`
  if (senha.length > SENHA_MAX) return `A senha pode ter no máximo ${SENHA_MAX} caracteres.`
  if (idDoNome(senha) === idNome) return 'A senha não pode ser igual ao nome.'
  if (/^(.)\1+$/u.test(senha)) return 'A senha não pode ser um único caractere repetido.'
  return null
}
