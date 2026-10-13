import { depsDoAmbiente } from '../servidor/ambiente.js'
import { entrar } from '../servidor/rotas.js'

export function POST(request: Request) {
  return entrar(request, depsDoAmbiente())
}
