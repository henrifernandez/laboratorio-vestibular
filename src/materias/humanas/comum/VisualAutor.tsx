import type { Autor } from '@/conteudo/humanas'
import type { InstanciaMulti, VisualProps } from '@/desafios/simples'
import type { DadosAutor } from './geradores'
import { CartaoAutor } from './Visuais'

/** Depois que a pessoa responde, mostra o cartão do autor da resposta (versão curta). */
export function criarVisualAutor(autores: Autor[]) {
  return function VisualAutor({ inst, correcao }: VisualProps<InstanciaMulti<DadosAutor>>) {
    const autor = autores.find((a) => a.id === inst.dados?.autorId)
    if (!correcao || !autor) return null
    return <CartaoAutor autor={autor} compacto nivelTitulo={4} />
  }
}
