import { useId, useMemo } from 'react'
import type { DefinicaoDesafio, DefinicaoQualquer, EntradaProps } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { compilar } from '../funcoes/expressao'
import { fmt, gerarSequencia, gerarSoma, gerarTermo, type DadosSeq } from './geradores'
import { termoGeral, type InstanciaTermoGeral } from './termoGeral'
import { BarrasSequencia, VisualSequencia, VisualTermo } from './Visuais'


const base = { materia: 'matematica' as const, tema: 'pa-pg' }

function EntradaTermoGeral({ inst, resposta, onChange, bloqueado }: EntradaProps<InstanciaTermoGeral, string>) {
  const id = useId()
  const compilada = useMemo(() => (resposta.trim() ? compilar(resposta, 'n') : null), [resposta])
  const previa = compilada?.ok ? [1, 2, 3, 4].map((n) => compilada.fn(n)) : null
  return (
    <div className="grid gap-3">
      <BarrasSequencia termos={inst.termos} rotulo="Barras com os primeiros termos da sequência" />
      <p className="text-lg">
        Os primeiros termos são {inst.termos.map(fmt).join('; ')}, ... Escreva o termo geral <em>aₙ</em> em função de <em>n</em>.
      </p>
      <div className="grid gap-1">
        <label htmlFor={id} className="font-semibold">
          aₙ =
        </label>
        <input
          id={id}
          value={resposta}
          disabled={bloqueado}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder="ex.: 5 + (n-1)*3"
          aria-invalid={compilada ? !compilada.ok : false}
          className="h-12 max-w-md rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
        />
        {!bloqueado && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Atalhos de digitação">
            {['n', '^', '(', ')', '*', '-'].map((t) => (
              <button key={t} type="button" className="btn num px-3" onClick={() => onChange(resposta + t)}>
                {t}
              </button>
            ))}
          </div>
        )}
        <p role="status" className="min-h-6 text-sm" style={{ color: compilada && !compilada.ok ? 'var(--erro)' : 'var(--ink-muted)' }}>
          {compilada && !compilada.ok
            ? compilada.erro
            : previa
              ? `Sua fórmula dá: ${previa.map((v, k) => `a${k + 1} = ${Number.isFinite(v) ? fmt(v) : '—'}`).join(' · ')}`
              : 'Use n, ^ para potência e * para multiplicar.'}
        </p>
      </div>
    </div>
  )
}

const defTermoGeral: DefinicaoDesafio<InstanciaTermoGeral, string> = {
  desafio: termoGeral,
  instrucao: 'Descubra o tipo da sequência e escreva a fórmula do termo geral.',
  respostaInicial: () => '',
  podeEnviar: (r) => r.trim().length > 0,
  Entrada: EntradaTermoGeral,
}

export const DEFINICOES_PA_PG: DefinicaoQualquer[] = [
  criarDefMulti<DadosSeq>({
    ...base,
    id: 'matematica/pa-pg/sequencia',
    titulo: 'Que sequência é essa?',
    instrucao: 'Descubra se é PA, PG ou nenhuma das duas, e qual é a razão.',
    gerar: gerarSequencia,
    Visual: VisualSequencia,
  }),
  defTermoGeral,
  criarDefNum<DadosSeq>({
    ...base,
    id: 'matematica/pa-pg/termo',
    titulo: 'Preveja o termo',
    instrucao: 'Descubra a razão e calcule o termo pedido, sem listar todos.',
    gerar: gerarTermo,
    Visual: VisualTermo,
  }),
  criarDefNum<DadosSeq>({
    ...base,
    id: 'matematica/pa-pg/soma',
    titulo: 'Soma dos termos',
    instrucao: 'Some os termos usando a fórmula certa (PA, PG ou PG infinita).',
    gerar: gerarSoma,
  }),
]
