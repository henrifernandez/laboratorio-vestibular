import { depsDoAmbiente } from '../servidor/ambiente.js'
import { excluirConta } from '../servidor/rotas.js'

export function POST(request: Request) {
  return excluirConta(request, depsDoAmbiente())
}
