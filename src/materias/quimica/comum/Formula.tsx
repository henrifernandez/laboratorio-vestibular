import { partesFormula } from './elementos'

/** Fórmula química com os índices abaixo da linha (H₂O, Ca(OH)₂). */
export function Formula({ f }: { f: string }) {
  return (
    <span className="whitespace-nowrap">
      {partesFormula(f).map((p, i) => (p.sub ? <sub key={i}>{p.t}</sub> : <span key={i}>{p.t}</span>))}
    </span>
  )
}

/** Versão para dentro de <text> em SVG. */
export function FormulaSvg({ f }: { f: string }) {
  return (
    <>
      {partesFormula(f).map((p, i) =>
        p.sub ? (
          <tspan key={i} dy="0.28em" fontSize="0.72em">
            {p.t}
          </tspan>
        ) : (
          <tspan key={i} dy={i > 0 && partesFormula(f)[i - 1]?.sub ? '-0.28em' : undefined}>
            {p.t}
          </tspan>
        ),
      )}
    </>
  )
}

/** Texto simples com índices Unicode, para rótulos de acessibilidade e alternativas de resposta. */
export function formulaTexto(f: string): string {
  const baixo = '₀₁₂₃₄₅₆₇₈₉'
  return partesFormula(f)
    .map((p) => (p.sub ? [...p.t].map((d) => baixo[Number(d)] ?? d).join('') : p.t))
    .join('')
}
