import { depsDoAmbiente } from '../servidor/ambiente.js'
import { sair } from '../servidor/rotas.js'

export function POST(request: Request) {
  return sair(request, depsDoAmbiente())
}
