import { depsDoAmbiente } from '../servidor/ambiente.js'
import { cadastrar } from '../servidor/rotas.js'

export function POST(request: Request) {
  return cadastrar(request, depsDoAmbiente())
}
