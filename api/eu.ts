import { depsDoAmbiente } from '../servidor/ambiente.js'
import { eu } from '../servidor/rotas.js'

export function GET(request: Request) {
  return eu(request, depsDoAmbiente())
}
