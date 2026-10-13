import { kvDoAmbiente } from './kv.js'
import type { Deps } from './rotas.js'

/** Dependências reais das funções em `api/`: o banco ligado pela Vercel e, se houver, o código de convite. */
export function depsDoAmbiente(): Deps {
  return { kv: kvDoAmbiente(), convite: process.env.CODIGO_CONVITE?.trim() || undefined }
}
