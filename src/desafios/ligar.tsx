import { CheckCircle2, XCircle } from 'lucide-react'
import type { Materia } from '@/conteudo/materias'
import { criarRng, type Rng } from '@/lib/rng'
import type { DefinicaoDesafio, EntradaProps } from './PainelDesafio'
import type { Correcao, Desafio, Nivel } from './tipos'

/**
 * Desafio de ligar: para cada item da esquerda, a pessoa escolhe uma opção da direita.
 * Mais de um item da esquerda pode ter a mesma resposta (por exemplo, Locke e Hume ligados ao empirismo).
 */
export interface ItemLigar {
  id: string
  rotulo: string
}

export interface InstanciaLigar<D = unknown> {
  titulo: string
  enunciado: string
  /** itens da esquerda, na ordem mostrada */
  esquerda: ItemLigar[]
  /** opções da direita (as certas e, nos níveis mais altos, algumas que não servem a ninguém) */
  direita: ItemLigar[]
  /** resposta certa: id da esquerda → id da direita */
  certa: Record<string, string>
  /** explicação de cada ligação certa */
  porque: Record<string, string>
  nivel: Nivel
  dicas: string[]
  /** informações para o desenho (por exemplo, o autor de cada item) */
  dados?: D
}

export interface TextosLigar {
  /** "causa do erro", para o caderno de erros */
  motivo: string
  /** regra a lembrar, para o caderno de erros */
  licao: string
}

export function corrigirLigar(inst: InstanciaLigar, resposta: Record<string, string>, textos: TextosLigar): Correcao {
  const nomeEsq = (id: string) => inst.esquerda.find((x) => x.id === id)?.rotulo ?? id
  const nomeDir = (id: string) => inst.direita.find((x) => x.id === id)?.rotulo ?? id
  const erros = inst.esquerda.filter((x) => resposta[x.id] !== inst.certa[x.id])
  const certos = inst.esquerda.length - erros.length
  if (erros.length === 0) return { correto: true, parcial: 1, feedback: 'Todas as ligações estão certas.' }
  const vazios = erros.filter((x) => !resposta[x.id])
  const explicacoes = erros.slice(0, 2).map((x) => {
    const escolhido = resposta[x.id]
    if (!escolhido) return `Você não ligou «${nomeEsq(x.id)}».`
    return `«${nomeEsq(x.id)}» não se liga a «${nomeDir(escolhido)}». ${inst.porque[x.id]}`
  })
  return {
    correto: false,
    parcial: certos / inst.esquerda.length,
    feedback: `${certos} de ${inst.esquerda.length} ligações certas. ${explicacoes.join(' ')}${erros.length > 2 ? ' Há outras ligações para rever.' : ''}${vazios.length > 2 ? ' Faltam ligações.' : ''}`.trim(),
    motivo: textos.motivo,
    licao: textos.licao,
  }
}

export function EntradaLigar({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaLigar, Record<string, string>>) {
  const revelar = correcao !== null
  return (
    <div className="grid gap-3">
      <p className="m-0 text-lg">{inst.enunciado}</p>
      <ul className="m-0 grid list-none gap-3 p-0">
        {inst.esquerda.map((item) => {
          const certo = revelar && resposta[item.id] === inst.certa[item.id]
          const id = `lig-${item.id}`
          return (
            <li key={item.id} className="grid gap-1 rounded-[var(--radius-sm)] border bg-[var(--surface)] p-3" style={{ borderColor: revelar ? (certo ? 'var(--ok)' : 'var(--erro)') : 'var(--line-strong)' }}>
              <label htmlFor={id} className="flex items-start gap-2 font-semibold">
                <span className="flex-1">{item.rotulo}</span>
                {revelar && (certo ? <CheckCircle2 size={20} aria-label="certo" style={{ color: 'var(--ok)' }} /> : <XCircle size={20} aria-label="errado" style={{ color: 'var(--erro)' }} />)}
              </label>
              <select
                id={id}
                value={resposta[item.id] ?? ''}
                disabled={bloqueado}
                onChange={(ev) => onChange({ ...resposta, [item.id]: ev.target.value })}
                className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3"
              >
                <option value="">Escolha…</option>
                {inst.direita.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.rotulo}
                  </option>
                ))}
              </select>
              {revelar && !certo && <p className="m-0 text-sm text-[var(--ink-muted)]">Certo: {inst.direita.find((d) => d.id === inst.certa[item.id])?.rotulo}. {inst.porque[item.id]}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface MetaLigar {
  id: string
  materia: Materia
  tema: string
  titulo: string
  instrucao: string
  gerar: (rng: Rng, nivel: Nivel) => InstanciaLigar
  textos: TextosLigar
}

export function criarDefLigar(meta: MetaLigar): DefinicaoDesafio<InstanciaLigar, Record<string, string>> & { desafio: Desafio<InstanciaLigar, Record<string, string>> } {
  const desafio: Desafio<InstanciaLigar, Record<string, string>> = {
    id: meta.id,
    materia: meta.materia,
    tema: meta.tema,
    titulo: meta.titulo,
    gerar: (semente, nivel) => meta.gerar(criarRng(semente * 3266489917 + nivel * 71), nivel),
    corrigir: (inst, resposta) => corrigirLigar(inst, resposta, meta.textos),
    dicas: (inst) => inst.dicas,
    explicar: (inst) => inst.esquerda.map((x) => `${x.rotulo}: ${inst.direita.find((d) => d.id === inst.certa[x.id])?.rotulo}. ${inst.porque[x.id]}`).join(' '),
  }
  return {
    desafio,
    instrucao: meta.instrucao,
    respostaInicial: () => ({}),
    podeEnviar: (r, inst) => inst.esquerda.every((x) => (r[x.id] ?? '') !== ''),
    Entrada: EntradaLigar,
  }
}
