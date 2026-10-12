import {
  afetadoPorGenotipo,
  genotiposPossiveis,
  priori,
  transmissao,
  type Heredograma,
  type Modelo,
  type Pessoa,
  type Sexo,
} from './heredograma'

/**
 * Enumeração direta de todas as combinações de genótipos, sem poda e sem ordenação topológica:
 * serve para conferir o motor de inferência com um cálculo independente (usado só nos testes).
 */
export function forcaBruta(ped: Heredograma, modelo: Modelo, q: number, filho?: { pai: string; mae: string; sexo?: Sexo }) {
  const pessoas = ped.pessoas
  const n = pessoas.length
  const indice = new Map(pessoas.map((p, i) => [p.id, i]))
  const g = new Array<number>(n).fill(0)
  let total = 0
  let somaFilho = 0
  const marg = pessoas.map(() => [0, 0, 0])
  const avaliar = () => {
    let w = 1
    for (let i = 0; i < n; i++) {
      const p = pessoas[i] as Pessoa
      if (afetadoPorGenotipo(modelo, p.sexo, g[i] as number) !== p.afetado) return
      w *= p.pais ? transmissao(modelo, g[indice.get(p.pais[0]) as number] as number, g[indice.get(p.pais[1]) as number] as number, p.sexo, g[i] as number) : priori(modelo, p.sexo, g[i] as number, q)
    }
    if (w === 0) return
    total += w
    for (let i = 0; i < n; i++) (marg[i] as number[])[g[i] as number] = ((marg[i] as number[])[g[i] as number] as number) + w
    if (filho) {
      const sexos: Sexo[] = filho.sexo ? [filho.sexo] : modelo === 'XR' || modelo === 'XD' ? ['M', 'F'] : ['M']
      let p = 0
      for (const s of sexos) for (const gf of genotiposPossiveis(modelo, s)) if (afetadoPorGenotipo(modelo, s, gf)) p += transmissao(modelo, g[indice.get(filho.pai) as number] as number, g[indice.get(filho.mae) as number] as number, s, gf)
      somaFilho += (w * p) / sexos.length
    }
  }
  const rec = (k: number) => {
    if (k === n) return avaliar()
    for (const gi of genotiposPossiveis(modelo, (pessoas[k] as Pessoa).sexo)) {
      g[k] = gi
      rec(k + 1)
    }
  }
  rec(0)
  return { total, marginais: marg.map((m) => m.map((x) => (total > 0 ? x / total : 0))), filho: total > 0 ? somaFilho / total : undefined }
}
