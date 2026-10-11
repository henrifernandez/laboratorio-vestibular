import { useId, type ComponentType, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Materia } from '@/conteudo/materias'
import { criarRng } from '@/lib/rng'
import type { DefinicaoDesafio, EntradaProps } from './PainelDesafio'
import type { Correcao, Desafio, Nivel } from './tipos'

/* ======================================================================
   Múltipla escolha
   ====================================================================== */

export interface OpcaoMulti {
  id: string
  rotulo: string
}

export interface InstanciaMulti<D = unknown> {
  enunciado: string
  opcoes: OpcaoMulti[]
  certa: string
  /** feedback específico para cada opção errada */
  porque: Record<string, string>
  /** causa curta do erro para o caderno, por opção errada */
  motivo?: Record<string, string>
  resolucao: string
  dicas: string[]
  licao: string
  /** dados para o visual do desafio (um desenho, um gráfico...) */
  dados?: D
}

export function corrigirMulti(inst: InstanciaMulti, resposta: string): Correcao {
  if (resposta === inst.certa) {
    return { correto: true, parcial: 1, feedback: inst.porque[inst.certa] ?? 'Isso mesmo!' }
  }
  return {
    correto: false,
    parcial: 0,
    feedback: inst.porque[resposta] ?? 'Essa opção não bate com o que o enunciado pede. Releia e confira a resolução abaixo.',
    motivo: inst.motivo?.[resposta] ?? 'opção errada',
    licao: inst.licao,
  }
}

/* ======================================================================
   Resposta numérica
   ====================================================================== */

export interface ErroTipico {
  valor: number
  frase: string
  motivo?: string
}

export interface InstanciaNum<D = unknown> {
  enunciado: string
  resposta: number
  /** diferença absoluta aceita */
  tolerancia: number
  unidade?: string
  /** respostas erradas comuns, com a explicação do erro cometido */
  erros: ErroTipico[]
  resolucao: string
  dicas: string[]
  licao: string
  dados?: D
}

/** Lê número digitado à brasileira: 1.234,5 · 12,5% · R$ 1500 · 1/4. */
export function lerNumero(texto: string): number | null {
  const t = texto.replace(/[^\d.,/-]/g, '')
  if (t === '' || t === '-') return null
  if (t.includes('/')) {
    const [a, b] = t.split('/')
    const na = lerNumero(a ?? '')
    const nb = lerNumero(b ?? '')
    if (na === null || nb === null || nb === 0) return null
    return na / nb
  }
  let limpo = t
  if (t.includes(',')) limpo = t.replace(/\./g, '').replace(',', '.')
  else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(t)) limpo = t.replace(/\./g, '')
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

export function corrigirNum(inst: InstanciaNum, texto: string): Correcao {
  const v = lerNumero(texto)
  if (v === null) {
    return { correto: false, parcial: 0, feedback: 'Digite um número (por exemplo 1500, 12,5 ou 1/4).', motivo: 'resposta sem número' }
  }
  if (Math.abs(v - inst.resposta) <= inst.tolerancia) {
    return { correto: true, parcial: 1, feedback: 'Isso mesmo! Seu valor bate com a resolução.' }
  }
  const tipico = inst.erros.find((e) => Math.abs(v - e.valor) <= inst.tolerancia)
  const proximo = Math.abs(v - inst.resposta) <= Math.abs(inst.resposta) * 0.1
  const parcial = proximo ? 0.5 : 0
  if (tipico) {
    return { correto: false, parcial, feedback: tipico.frase, motivo: tipico.motivo ?? 'erro de cálculo', licao: inst.licao }
  }
  const direcao = v > inst.resposta ? 'maior' : 'menor'
  return {
    correto: false,
    parcial,
    feedback: `Seu resultado ficou ${direcao} do que deveria${proximo ? ', mas está perto' : ''}. Refaça a conta conferindo cada passo.`,
    motivo: 'cálculo incorreto',
    licao: inst.licao,
  }
}

/* ======================================================================
   Telas
   ====================================================================== */

export type VisualProps<I> = { inst: I; /** resultado da correção, depois que a pessoa responde */ correcao?: Correcao | null }

export type OpcaoVisualProps<I> = { inst: I; id: string }

function EntradaMulti<D>({ Visual, Opcao }: { Visual?: ComponentType<VisualProps<InstanciaMulti<D>>>; Opcao?: ComponentType<OpcaoVisualProps<InstanciaMulti<D>>> }) {
  return function Entrada({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaMulti<D>, string>) {
    return (
      <div className="grid gap-3">
        {Visual && <Visual inst={inst} correcao={correcao} />}
        <p className="text-lg">{inst.enunciado}</p>
        <div role="radiogroup" aria-label="Alternativas" className="grid gap-2 sm:grid-cols-2">
          {inst.opcoes.map((o) => {
            const marcada = resposta === o.id
            const certa = correcao && o.id === inst.certa
            const errada = correcao && marcada && o.id !== inst.certa
            return (
              <label
                key={o.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2"
                style={{
                  borderColor: certa ? 'var(--ok)' : errada ? 'var(--erro)' : marcada ? 'var(--accent)' : 'var(--line-strong)',
                  background: marcada ? 'var(--surface-2)' : 'var(--surface)',
                }}
              >
                <input
                  type="radio"
                  name="alternativa"
                  value={o.id}
                  checked={marcada}
                  disabled={bloqueado}
                  onChange={() => onChange(o.id)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  {Opcao && <Opcao inst={inst} id={o.id} />}
                  <span>{o.rotulo}</span>
                </span>
                {certa && <CheckCircle2 size={18} aria-label="resposta certa" style={{ color: 'var(--ok)' }} />}
                {errada && <XCircle size={18} aria-label="sua resposta, errada" style={{ color: 'var(--erro)' }} />}
              </label>
            )
          })}
        </div>
      </div>
    )
  }
}

function EntradaNum<D>({ Visual }: { Visual?: ComponentType<VisualProps<InstanciaNum<D>>> }) {
  return function Entrada({ inst, resposta, onChange, bloqueado, correcao }: EntradaProps<InstanciaNum<D>, string>) {
    const id = useId()
    return (
      <div className="grid gap-3">
        {Visual && <Visual inst={inst} correcao={correcao} />}
        <p className="text-lg">{inst.enunciado}</p>
        <div className="grid gap-1">
          <label htmlFor={id} className="font-semibold">
            Sua resposta
          </label>
          <span className="flex items-center gap-2">
            <input
              id={id}
              value={resposta}
              disabled={bloqueado}
              onChange={(e) => onChange(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder="ex.: 1500 ou 12,5"
              className="num h-12 w-full max-w-60 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
            />
            {inst.unidade && <span className="text-[var(--ink-muted)]">{inst.unidade}</span>}
          </span>
        </div>
      </div>
    )
  }
}

/* ======================================================================
   Fábricas
   ====================================================================== */

interface MetaDesafio {
  /** ex.: 'matematica/pa-pg/termo' */
  id: string
  materia: Materia
  tema: string
  titulo: string
  instrucao: string
}

export function criarDefMulti<D = unknown>(
  meta: MetaDesafio & {
    gerar: (rng: () => number, nivel: Nivel, semente: number) => InstanciaMulti<D>
    Visual?: ComponentType<VisualProps<InstanciaMulti<D>>>
    /** miniatura mostrada dentro de cada alternativa (por exemplo, uma planificação) */
    Opcao?: ComponentType<OpcaoVisualProps<InstanciaMulti<D>>>
  },
): DefinicaoDesafio<InstanciaMulti<D>, string> & { desafio: Desafio<InstanciaMulti<D>, string> } {
  const desafio: Desafio<InstanciaMulti<D>, string> = {
    id: meta.id,
    materia: meta.materia,
    tema: meta.tema,
    titulo: meta.titulo,
    gerar: (semente, nivel) => meta.gerar(criarRng(semente * 2654435761 + nivel * 97), nivel, semente),
    corrigir: (inst, resposta) => corrigirMulti(inst, resposta),
    dicas: (inst) => inst.dicas,
    explicar: (inst) => inst.resolucao,
  }
  return {
    desafio,
    instrucao: meta.instrucao,
    respostaInicial: () => '',
    podeEnviar: (r) => r !== '',
    Entrada: EntradaMulti<D>({ Visual: meta.Visual, Opcao: meta.Opcao }),
  }
}

export function criarDefNum<D = unknown>(
  meta: MetaDesafio & {
    gerar: (rng: () => number, nivel: Nivel, semente: number) => InstanciaNum<D>
    Visual?: ComponentType<VisualProps<InstanciaNum<D>>>
  },
): DefinicaoDesafio<InstanciaNum<D>, string> & { desafio: Desafio<InstanciaNum<D>, string> } {
  const desafio: Desafio<InstanciaNum<D>, string> = {
    id: meta.id,
    materia: meta.materia,
    tema: meta.tema,
    titulo: meta.titulo,
    gerar: (semente, nivel) => {
      const inst = meta.gerar(criarRng(semente * 2246822519 + nivel * 131), nivel, semente)
      // dois erros típicos com o mesmo valor: vale o primeiro
      return { ...inst, erros: inst.erros.filter((e, i) => inst.erros.findIndex((x) => Math.abs(x.valor - e.valor) < 1e-9) === i) }
    },
    corrigir: (inst, resposta) => corrigirNum(inst, resposta),
    dicas: (inst) => inst.dicas,
    explicar: (inst) => inst.resolucao,
  }
  return {
    desafio,
    instrucao: meta.instrucao,
    respostaInicial: () => '',
    podeEnviar: (r) => r.trim() !== '',
    Entrada: EntradaNum<D>({ Visual: meta.Visual }),
  }
}

export type { ReactNode }
