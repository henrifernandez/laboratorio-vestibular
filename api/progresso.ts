import { depsDoAmbiente } from '../servidor/ambiente.js'
import { gravarProgressoDaConta, lerProgressoDaConta } from '../servidor/rotas.js'

export function GET(request: Request) {
  return lerProgressoDaConta(request, depsDoAmbiente())
}

export function PUT(request: Request) {
  return gravarProgressoDaConta(request, depsDoAmbiente())
}
