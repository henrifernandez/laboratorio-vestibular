import { useId } from 'react'
import type { DefinicaoDesafio, DefinicaoQualquer, EntradaProps } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { DESCRICAO, FORCAS, NOME_DIRECAO, diagrama, type CenarioId, type Direcao, type InstanciaDCL, type RespostaDCL } from './dcl'
import { gerarAtrito, gerarDeslizar, gerarSistema, type DadosAtrito, type DadosDeslizar, type DadosSistema } from './geradores'
import { gerarAcao, gerarLeis, type DadosAcao, type DadosLeis } from './geradoresNewton'
import { FiguraDCL, VisualAtrito, VisualDeslizar, VisualSistema } from './Visuais'
import { OpcaoLei, VisualAcao, VisualLeis } from './VisuaisNewton'

const base = { materia: 'fisica' as const, tema: 'dinamica' }

const NO_PLANO: CenarioId[] = ['planoParado', 'planoDescendo', 'planoPuxado']
const RETAS: Direcao[] = ['nenhuma', 'cima', 'baixo', 'esquerda', 'direita']
const INCLINADAS: Direcao[] = ['nenhuma', 'cima', 'baixo', 'perpPlano', 'subindoPlano', 'descendoPlano']

function SeletorForca({ rotulo, cor, valor, opcoes, onChange, bloqueado }: { rotulo: string; cor: string; valor: Direcao; opcoes: Direcao[]; onChange: (d: Direcao) => void; bloqueado: boolean }) {
  const id = useId()
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className="inline-block size-3 rounded-full" style={{ background: cor }} />
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        disabled={bloqueado}
        onChange={(e) => onChange(e.target.value as Direcao)}
        className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3"
      >
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {NOME_DIRECAO[o]}
          </option>
        ))}
      </select>
    </div>
  )
}

export function EntradaDCL({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaDCL, RespostaDCL>) {
  const opcoes = NO_PLANO.includes(inst.cenario) ? INCLINADAS : RETAS
  const gabarito = (correcao?.destaque as { gabarito?: RespostaDCL } | undefined)?.gabarito
  return (
    <div className="grid gap-3">
      <p className="text-lg">{DESCRICAO[inst.cenario]} Marque as forças que atuam sobre o bloco e a direção de cada uma. Use g = 10 m/s².</p>
      <FiguraDCL cenario={inst.cenario} resposta={resposta} gabarito={gabarito} />
      {gabarito && (
        <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
          <span>
            <span aria-hidden="true">━</span> as suas setas
          </span>
          <span>
            <span aria-hidden="true">╌</span> o diagrama certo
          </span>
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {FORCAS.map((f) => (
          <SeletorForca key={f.id} rotulo={f.nome} cor={f.cor} valor={resposta[f.id]} opcoes={opcoes} bloqueado={bloqueado} onChange={(d) => onChange({ ...resposta, [f.id]: d })} />
        ))}
      </div>
      <p className="text-sm text-[var(--ink-muted)]">Dica de leitura: se uma força “não atua”, deixe como está. Cada seta sai do centro do bloco.</p>
    </div>
  )
}

const defDCL: DefinicaoDesafio<InstanciaDCL, RespostaDCL> = {
  desafio: diagrama,
  instrucao: 'Escolha as forças que atuam no bloco e a direção de cada uma. A figura mostra o que você marcou.',
  respostaInicial: () => diagrama.respostaInicial(),
  podeEnviar: (r) => FORCAS.some((f) => r[f.id] !== 'nenhuma'),
  Entrada: EntradaDCL,
}

export const DEFINICOES_DINAMICA: DefinicaoQualquer[] = [
  criarDefMulti<DadosDeslizar>({
    ...base,
    id: 'fisica/dinamica/deslizar',
    titulo: 'Vai deslizar?',
    instrucao: 'Compare a componente do peso ao longo do plano com o atrito máximo e preveja o que acontece.',
    gerar: gerarDeslizar,
    Visual: VisualDeslizar,
  }),
  criarDefNum<DadosAtrito>({
    ...base,
    id: 'fisica/dinamica/atrito',
    titulo: 'Qual é a força de atrito?',
    instrucao: 'Decida se o bloco está parado ou deslizando e calcule o atrito que realmente atua.',
    gerar: gerarAtrito,
    Visual: VisualAtrito,
  }),
  defDCL,
  criarDefNum<DadosSistema>({
    ...base,
    id: 'fisica/dinamica/sistema',
    titulo: 'Aceleração do sistema',
    instrucao: 'Escreva F = m·a para cada bloco, some as equações e resolva.',
    gerar: gerarSistema,
    Visual: VisualSistema,
  }),
  criarDefMulti<DadosLeis>({
    ...base,
    id: 'fisica/dinamica/leis',
    titulo: 'Qual lei de Newton?',
    instrucao: 'Leia a situação e escolha a lei de Newton que a explica. No nível 3, encontre o par de ação e reação.',
    gerar: gerarLeis,
    Visual: VisualLeis,
    Opcao: OpcaoLei,
  }),
  criarDefNum<DadosAcao>({
    ...base,
    id: 'fisica/dinamica/acao-reacao',
    titulo: 'Ação e reação',
    instrucao: 'Use que as forças do par têm o mesmo módulo e aplique a 2ª lei a cada corpo.',
    gerar: gerarAcao,
    Visual: VisualAcao,
  }),
]
