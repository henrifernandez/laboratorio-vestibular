/** Acesso ao localStorage que nunca lança: o site funciona com o armazenamento bloqueado. */
const PREFIXO = 'lv:v1:'

export function lerJson<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave)
    return bruto === null ? padrao : (JSON.parse(bruto) as T)
  } catch {
    return padrao
  }
}

export function gravarJson(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor))
  } catch {
    /* armazenamento bloqueado ou cheio: segue sem salvar */
  }
}

export function lerTexto(chave: string): string | null {
  try {
    return localStorage.getItem(PREFIXO + chave)
  } catch {
    return null
  }
}

export function gravarTexto(chave: string, valor: string): void {
  try {
    localStorage.setItem(PREFIXO + chave, valor)
  } catch {
    /* ignora */
  }
}
