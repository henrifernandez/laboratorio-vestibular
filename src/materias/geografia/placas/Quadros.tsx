import { EXEMPLOS_PLACAS } from '@/conteudo/geografia/placas'
import { LIMITES, type IdLimite } from './calculo'
import { ENCONTRO } from './geradores'
import { AssoalhoSvg } from './Visuais'

const ORDEM: IdLimite[] = ['dorsal', 'rifte', 'subducao-continental', 'subducao-oceanica', 'colisao', 'transformante']

const EXEMPLO_DE: Record<IdLimite, string> = {
  dorsal: 'Dorsal Meso-Atlântica',
  rifte: 'Rifte do Leste Africano',
  'subducao-continental': 'Andes',
  'subducao-oceanica': 'Japão e Marianas',
  colisao: 'Himalaia e Alpes',
  transformante: 'San Andreas',
}

/** Os seis casos lado a lado. */
export function QuadroLimites() {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Os seis casos de limite entre placas</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Encontro</th>
            <th scope="col" className="px-1">Resultado</th>
            <th scope="col" className="px-1">Vulcões</th>
            <th scope="col" className="px-1">Exemplo</th>
          </tr>
        </thead>
        <tbody>
          {ORDEM.map((id) => (
            <tr key={id} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1 pr-2 text-left font-semibold">{ENCONTRO[id]}</th>
              <td className="px-1">{LIMITES[id].feicoes[0]}</td>
              <td className="px-1">{LIMITES[id].vulcoes ? 'sim' : 'não'}</td>
              <td className="px-1">{EXEMPLO_DE[id]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Lugares reais e o limite que os explica. */
export function QuadroExemplos() {
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {EXEMPLOS_PLACAS.map((e) => (
        <li key={e.id} className="cartao p-3">
          <p className="m-0 font-semibold">{e.nome}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">{e.placas}</p>
        </li>
      ))}
    </ul>
  )
}

export function AssoalhoDidatico() {
  return (
    <div className="grid gap-2">
      <AssoalhoSvg meiaTaxa={2.5} posicaoKm={1000} alcanceKm={2000} />
      <p className="m-0 text-sm text-[var(--ink-muted)]">Exemplo: com meia-taxa de 2,5 cm/ano (25 km por milhão de anos), a crosta a 1.000 km do eixo tem 1.000 ÷ 25 = 40 milhões de anos.</p>
    </div>
  )
}
