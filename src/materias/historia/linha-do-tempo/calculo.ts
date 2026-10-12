import { ANO_MAX, ANO_MIN, ERAS, RELACOES, evento } from '@/conteudo/historia/linhaDoTempo'
import type { Acontecimento, Era, Regiao, Relacao } from '@/conteudo/historia/tipos'

/* ======================================================================
   Funções puras da linha do tempo: tempo, zoom e posicionamento dos rótulos.
   ====================================================================== */

/** Último ano em que o acontecimento ainda está em curso. */
export const anoFinal = (e: Pick<Acontecimento, 'inicio' | 'fim'>) => e.fim ?? e.inicio

/** Os dois acontecimentos têm anos em comum? */
export const sobrepoe = (a: Pick<Acontecimento, 'inicio' | 'fim'>, b: Pick<Acontecimento, 'inicio' | 'fim'>) => a.inicio <= anoFinal(b) && b.inicio <= anoFinal(a)

/** Distância em anos entre dois intervalos (0 se se sobrepõem). */
export const distanciaAnos = (a: Pick<Acontecimento, 'inicio' | 'fim'>, b: Pick<Acontecimento, 'inicio' | 'fim'>) => (sobrepoe(a, b) ? 0 : Math.max(a.inicio - anoFinal(b), b.inicio - anoFinal(a)))

/** Era da região a que pertence um ano (intervalo fechado no começo e aberto no fim). */
export function eraDoAno(regiao: Regiao, ano: number, eras: Era[] = ERAS): Era | undefined {
  const da = eras.filter((e) => e.regiao === regiao)
  const ultima = da[da.length - 1]
  return da.find((e) => ano >= e.inicio && ano < e.fim) ?? (ultima && ano === ultima.fim ? ultima : undefined)
}

/** Acontecimentos em curso em um ano (ou que começaram até `folga` anos antes, para mostrar o que acabou de acontecer). */
export function emCurso(eventos: Acontecimento[], ano: number, folga = 0): Acontecimento[] {
  return eventos.filter((e) => (e.fim === undefined ? ano >= e.inicio && ano <= e.inicio + folga : ano >= e.inicio && ano <= e.fim + folga))
}

/* ------------------------------------------------------------------ vista (centro e extensão, em anos) */

export const EXTENSAO_MIN = 6
export const EXTENSAO_MAX = ANO_MAX - ANO_MIN

export interface Vista {
  /** ano no centro da tela */
  c: number
  /** número de anos visíveis */
  s: number
}

export const VISTA_TOTAL: Vista = { c: (ANO_MIN + ANO_MAX) / 2, s: ANO_MAX - ANO_MIN }

const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
const arred = (x: number) => Math.round(x * 100) / 100

/** Mantém a vista dentro dos limites do tempo mostrado e com extensão razoável. */
export function limitarVista(v: Vista): Vista {
  const s = limitar(v.s, EXTENSAO_MIN, EXTENSAO_MAX)
  const c = limitar(v.c, ANO_MIN + s / 2, ANO_MAX - s / 2)
  return { c: arred(c), s: arred(s) }
}

/**
 * Zoom ancorado: o ano que está sob `ancora` (fração de 0 a 1 ao longo da tela) permanece no mesmo lugar.
 * `fator` < 1 aproxima; > 1 afasta.
 */
export function zoomEm(v: Vista, ancora: number, fator: number): Vista {
  const s = limitar(v.s * fator, EXTENSAO_MIN, EXTENSAO_MAX)
  const anoSobAncora = v.c - v.s / 2 + ancora * v.s
  return limitarVista({ c: anoSobAncora - (ancora - 0.5) * s, s })
}

/** Desloca a vista (positivo = para o futuro). */
export const deslocar = (v: Vista, anos: number): Vista => limitarVista({ c: v.c + anos, s: v.s })

/** Vista que mostra bem um intervalo, com uma folga nas pontas. */
export function vistaParaIntervalo(inicio: number, fim: number, folga = 0.12): Vista {
  const s = Math.max(EXTENSAO_MIN, (fim - inicio) * (1 + 2 * folga))
  return limitarVista({ c: (inicio + fim) / 2, s })
}

/** Vista centrada em um acontecimento, com extensão proporcional à sua duração. */
export function vistaParaEvento(e: Pick<Acontecimento, 'inicio' | 'fim'>): Vista {
  const dur = anoFinal(e) - e.inicio
  return vistaParaIntervalo(e.inicio - Math.max(8, dur * 0.2), anoFinal(e) + Math.max(8, dur * 0.2))
}

/** Posição (px) de um ano ao longo de um eixo de comprimento `L`. */
export const posicaoDoAno = (ano: number, v: Vista, L: number) => ((ano - (v.c - v.s / 2)) / v.s) * L

/** Ano que corresponde a uma posição (px). */
export const anoDaPosicao = (pos: number, v: Vista, L: number) => v.c - v.s / 2 + (pos / L) * v.s

/** Passo "redondo" entre marcas do eixo, para ter de 3 a 8 marcas na tela. */
export function passoDoEixo(extensao: number): number {
  const candidatos = [1, 2, 5, 10, 20, 25, 50, 100, 200]
  const alvo = extensao / 6
  return candidatos.find((c) => c >= alvo) ?? 200
}

/** Anos que recebem marca no eixo dentro da vista. */
export function marcasDoEixo(v: Vista): number[] {
  const passo = passoDoEixo(v.s)
  const ini = Math.ceil((v.c - v.s / 2) / passo) * passo
  const fim = v.c + v.s / 2
  const r: number[] = []
  for (let a = ini; a <= fim; a += passo) r.push(a)
  return r
}

/* ------------------------------------------------------------------ posicionamento dos rótulos */

export interface Caixa {
  /** posição ao longo do eixo (px), do começo da caixa */
  inicio: number
  /** extensão da caixa ao longo do eixo (px) */
  tamanho: number
}

export interface Colocado {
  id: string
  /** posição do ano no eixo, em px */
  pos: number
  /** linha (0 = a mais próxima do eixo) */
  linha: number
  /** começo da caixa ao longo do eixo */
  inicio: number
}

export interface OpcoesLayout {
  /** comprimento do eixo, em px */
  L: number
  vista: Vista
  /** extensão do rótulo ao longo do eixo */
  tamanho: number
  /** número de linhas disponíveis */
  linhas: number
  /** o rótulo fica centrado no ano (vertical) ou começa nele (horizontal) */
  centrado: boolean
  folga?: number
}

/**
 * Escolhe quais rótulos cabem e em que linha. Os mais importantes (peso menor) são colocados primeiro e
 * os demais só entram se houver espaço, o que dá o zoom semântico: ao aproximar, aparecem mais acontecimentos.
 */
export function posicionarRotulos(eventos: Acontecimento[], o: OpcoesLayout): { colocados: Colocado[]; ocultos: number } {
  const folga = o.folga ?? 4
  const ordem = [...eventos].sort((a, b) => a.peso - b.peso || a.inicio - b.inicio || a.id.localeCompare(b.id))
  const porLinha: Caixa[][] = Array.from({ length: o.linhas }, () => [])
  const colocados: Colocado[] = []
  let ocultos = 0
  for (const e of ordem) {
    const pos = posicaoDoAno(e.inicio, o.vista, o.L)
    const inicio = o.centrado ? pos - o.tamanho / 2 : pos
    // fora da tela (com margem): não conta como oculto
    if (inicio + o.tamanho < -20 || inicio > o.L + 20) continue
    const linha = porLinha.findIndex((caixas) => caixas.every((c) => inicio + o.tamanho + folga <= c.inicio || c.inicio + c.tamanho + folga <= inicio))
    if (linha < 0) {
      ocultos++
      continue
    }
    ;(porLinha[linha] as Caixa[]).push({ inicio, tamanho: o.tamanho })
    colocados.push({ id: e.id, pos, linha, inicio })
  }
  return { colocados, ocultos }
}

/** Segmentos de uma era visíveis na tela: começo e fim (px) cortados nas bordas. */
export function trechoVisivel(inicioAno: number, fimAno: number, v: Vista, L: number): { a: number; b: number } | null {
  const a = Math.max(0, posicaoDoAno(inicioAno, v, L))
  const b = Math.min(L, posicaoDoAno(fimAno, v, L))
  return b - a > 0.5 ? { a, b } : null
}

/* ------------------------------------------------------------------ cadeias de causas e consequências */

export interface NoCadeia {
  relacao: Relacao
  evento: Acontecimento
  filhos: NoCadeia[]
}

/**
 * Árvore de causas (para trás) ou de consequências (para a frente) de um acontecimento, até `prof` níveis,
 * sem repetir acontecimentos.
 */
export function cadeia(id: string, sentido: 'causas' | 'consequencias', prof: number, vistos: Set<string> = new Set([id])): NoCadeia[] {
  if (prof <= 0) return []
  const rels = RELACOES.filter((r) => (sentido === 'causas' ? r.para === id : r.de === id))
  const nos: NoCadeia[] = []
  for (const r of rels) {
    const outro = sentido === 'causas' ? r.de : r.para
    if (vistos.has(outro)) continue
    vistos.add(outro)
    nos.push({ relacao: r, evento: evento(outro), filhos: cadeia(outro, sentido, prof - 1, vistos) })
  }
  return nos.sort((a, b) => a.evento.inicio - b.evento.inicio)
}
