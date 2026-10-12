import type { ErroTipico, InstanciaMulti } from '@/desafios/simples'
import { embaralhar, type Rng } from '@/lib/rng'

/** Número formatado à brasileira, com no máximo `c` casas decimais. */
export const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

export const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "a, b e c" */
export const lista = (itens: string[]) => (itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`)

/**
 * Mantém só os erros típicos válidos: finitos, positivos, diferentes da resposta (com folga de duas tolerâncias) e sem repetição.
 * `permiteZero` serve para quando 0 é um erro plausível.
 */
export function limpar(erros: ErroTipico[], resposta: number, tol: number, permiteZero = false): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor) || e.valor < 0 || (!permiteZero && e.valor === 0)) continue
    if (Math.abs(e.valor - resposta) <= 2 * tol) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tol)) continue
    saida.push(e)
  }
  return saida
}

export interface Opc {
  texto: string
  /** feedback quando a pessoa marca esta opção (certa ou errada) */
  porque: string
  motivo?: string
}

export type RestoMulti<D> = Omit<InstanciaMulti<D>, 'opcoes' | 'certa' | 'porque' | 'motivo'>

/** Monta uma pergunta de múltipla escolha: embaralha as alternativas e liga cada explicação à sua letra. */
export function montar<D>(rng: Rng, certa: Opc, erradas: Opc[], resto: RestoMulti<D>): InstanciaMulti<D> {
  const ids = ['A', 'B', 'C', 'D', 'E']
  const ordem = embaralhar(rng, [{ ok: true, ...certa }, ...erradas.map((e) => ({ ok: false, ...e }))])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let idCerta = 'A'
  ordem.forEach((o, k) => {
    const id = ids[k] as string
    if (o.ok) {
      idCerta = id
      porque[id] = `Certo. ${o.porque}`
    } else {
      porque[id] = `Não. ${o.porque}`
      motivo[id] = o.motivo ?? 'opção errada'
    }
  })
  return { ...resto, opcoes: ordem.map((o, k) => ({ id: ids[k] as string, rotulo: o.texto })), certa: idCerta, porque, motivo }
}

/** Item de banco de perguntas escritas à mão. */
export interface ItemBanco {
  pergunta: string
  certa: { texto: string; porque: string }
  erradas: Opc[]
  licao: string
  dicas: string[]
}

/** Confere a estrutura de um item de banco (usado nos testes). */
export function itemValido(item: ItemBanco): boolean {
  const textos = [item.certa.texto, ...item.erradas.map((e) => e.texto)]
  return new Set(textos).size === textos.length && item.erradas.length === 3 && item.dicas.length >= 3 && item.erradas.every((e) => e.porque.length > 10 && (e.motivo ?? '').length > 3)
}
