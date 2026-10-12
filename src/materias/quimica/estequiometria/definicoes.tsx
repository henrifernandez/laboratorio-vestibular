import { Minus, Plus } from 'lucide-react'
import type { DefinicaoDesafio, DefinicaoQualquer, EntradaProps } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { formulaTexto, Formula } from '../comum/Formula'
import { reacao } from './calculo'
import { desafioBalancear, gerarLimitante, gerarMassa, gerarSobra, type DadosLimitante, type DadosMassa, type InstanciaBalancear } from './geradores'
import { PontosAtomos, VisualLimitante, VisualMassa, VisualSobra } from './Visuais'

const base = { materia: 'quimica' as const, tema: 'estequiometria' }
const MAX_COEF = 20

/** Caixa de coeficiente com os botões − e +, cada um com alvo de toque de 44 px. */
export function CoeficienteEntrada({ formula, valor, onChange, bloqueado }: { formula: string; valor: number; onChange: (v: number) => void; bloqueado: boolean }) {
  return (
    <div role="group" aria-label={`Coeficiente de ${formulaTexto(formula)}`} className="grid justify-items-center gap-1">
      <button type="button" className="btn size-11 justify-center p-0" aria-label={`Aumentar o coeficiente de ${formulaTexto(formula)}`} disabled={bloqueado || valor >= MAX_COEF} onClick={() => onChange(valor + 1)}>
        <Plus size={18} aria-hidden="true" />
      </button>
      <output className="num grid h-10 min-w-10 place-items-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-2 text-xl font-bold" aria-live="polite">
        {valor}
      </output>
      <button type="button" className="btn size-11 justify-center p-0" aria-label={`Diminuir o coeficiente de ${formulaTexto(formula)}`} disabled={bloqueado || valor <= 1} onClick={() => onChange(valor - 1)}>
        <Minus size={18} aria-hidden="true" />
      </button>
      <span className="num text-lg">
        <Formula f={formula} />
      </span>
    </div>
  )
}

export function EntradaBalancear({ inst, resposta, onChange, bloqueado }: EntradaProps<InstanciaBalancear, number[]>) {
  const r = reacao(inst.reacaoId)
  const mudar = (k: number, v: number) => onChange(resposta.map((c, i) => (i === k ? v : c)))
  const nr = r.reagentes.length
  const especies = [...r.reagentes, ...r.produtos]
  return (
    <div className="grid gap-4">
      <p className="text-lg">
        Balanceie a equação da {r.nome} usando os menores números inteiros. Os botões mudam só os coeficientes; as fórmulas ficam como estão.
      </p>
      <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-4">
        {especies.map((fm, k) => (
          <div key={k} className="flex items-start gap-2">
            {k > 0 && (
              <span aria-hidden="true" className="pt-14 text-xl text-[var(--ink-muted)]">
                {k === nr ? '→' : '+'}
              </span>
            )}
            <CoeficienteEntrada formula={fm} valor={resposta[k] as number} onChange={(v) => mudar(k, v)} bloqueado={bloqueado} />
          </div>
        ))}
      </div>
      <div className="cartao p-3">
        <p className="m-0 mb-1 text-sm font-semibold text-[var(--ink-muted)]">Contagem de átomos com os coeficientes atuais</p>
        <PontosAtomos r={r} coefs={resposta} />
      </div>
    </div>
  )
}

const defBalancear: DefinicaoDesafio<InstanciaBalancear, number[]> = {
  desafio: desafioBalancear,
  instrucao: 'Ajuste os coeficientes até os átomos de cada elemento ficarem iguais nos dois lados, nos menores números inteiros.',
  respostaInicial: (inst) => reacao(inst.reacaoId).coefs.map(() => 1),
  podeEnviar: () => true,
  Entrada: EntradaBalancear,
}

export const DEFINICOES_ESTEQUIOMETRIA: DefinicaoQualquer[] = [
  defBalancear,
  criarDefNum<DadosMassa>({
    ...base,
    id: 'quimica/estequiometria/massa',
    titulo: 'Quantos gramas se formam?',
    instrucao: 'Siga o caminho dado → mols → proporção dos coeficientes → resposta, com rendimento ou pureza quando aparecerem.',
    gerar: gerarMassa,
    Visual: VisualMassa,
  }),
  criarDefMulti<DadosLimitante>({
    ...base,
    id: 'quimica/estequiometria/limitante',
    titulo: 'Quem é o reagente limitante?',
    instrucao: 'Divida os mols de cada reagente pelo seu coeficiente e compare.',
    gerar: gerarLimitante,
    Visual: VisualLimitante,
  }),
  criarDefNum<DadosLimitante>({
    ...base,
    id: 'quimica/estequiometria/sobra',
    titulo: 'Quanto se forma e quanto sobra?',
    instrucao: 'Ache o limitante e calcule tudo a partir dele: o produto que se forma e o excesso que sobra.',
    gerar: gerarSobra,
    Visual: VisualSobra,
  }),
]
