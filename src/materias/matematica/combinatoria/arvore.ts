export interface NivelArvore {
  nome: string
  opcoes: string[]
}

export interface NoArvore {
  id: string
  /** 0 = raiz ("início") */
  nivel: number
  rotulo: string
  pai: string | null
  filhos: string[]
  /** posição vertical em "linhas" (as folhas ocupam 0, 1, 2, …) */
  y: number
}

/** Monta a árvore completa de possibilidades: um ramo por escolha, um nível por etapa. */
export function construirArvore(niveis: readonly NivelArvore[]): { nos: NoArvore[]; folhas: number } {
  const nos: NoArvore[] = []
  let proximaFolha = 0
  const criar = (nivel: number, rotulo: string, pai: string | null, id: string): NoArvore => {
    const no: NoArvore = { id, nivel, rotulo, pai, filhos: [], y: 0 }
    nos.push(no)
    const etapa = niveis[nivel]
    if (!etapa) {
      no.y = proximaFolha++
      return no
    }
    const filhos = etapa.opcoes.map((o, i) => criar(nivel + 1, o, id, `${id}.${i}`))
    no.filhos = filhos.map((f) => f.id)
    no.y = ((filhos[0] as NoArvore).y + (filhos[filhos.length - 1] as NoArvore).y) / 2
    return no
  }
  criar(0, 'início', null, 'r')
  return { nos, folhas: proximaFolha }
}

/** Nós que aparecem na tela: a raiz e os filhos de nós expandidos. */
export function nosVisiveis(nos: readonly NoArvore[], expandidos: ReadonlySet<string>): NoArvore[] {
  const porId = new Map(nos.map((n) => [n.id, n]))
  const visivel = (n: NoArvore): boolean => (n.pai === null ? true : expandidos.has(n.pai) && visivel(porId.get(n.pai) as NoArvore))
  return nos.filter(visivel)
}

/** Possibilidades completas (folhas) já formadas na tela. */
export function folhasFormadas(nos: readonly NoArvore[], expandidos: ReadonlySet<string>): number {
  const ultimo = Math.max(...nos.map((n) => n.nivel))
  return nosVisiveis(nos, expandidos).filter((n) => n.nivel === ultimo).length
}
