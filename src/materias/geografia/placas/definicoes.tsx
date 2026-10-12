import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum, type InstanciaMulti, type VisualProps } from '@/desafios/simples'
import { gerarDeslocamento, gerarEvidencia, gerarExemplo, gerarLimite, type DadosDeslocamento, type DadosEvidencia, type DadosExemplo, type DadosLimite } from './geradores'
import { EXEMPLOS_PLACAS } from '@/conteudo/geografia/placas'
import { CorteSvg, LegendaCorte } from './Visuais'

const base = { materia: 'geografia' as const, tema: 'placas' }

/** Depois da resposta, mostra o diagrama do limite correto. */
function VisualLimite({ inst, correcao }: VisualProps<InstanciaMulti<DadosLimite>>) {
  const d = inst.dados
  if (!correcao || !d || d.limite === 'intraplaca') return null
  return (
    <div className="grid gap-2">
      <CorteSvg limite={d.limite} progresso={0.8} ordem={d.ordem} />
      <LegendaCorte planta={d.limite === 'transformante'} />
    </div>
  )
}

function VisualExemplo({ inst, correcao }: VisualProps<InstanciaMulti<DadosExemplo>>) {
  const ex = EXEMPLOS_PLACAS.find((e) => e.id === inst.dados?.exemplo)
  if (!correcao || !ex || ex.limite === 'intraplaca') return null
  return (
    <div className="grid gap-2">
      <CorteSvg limite={ex.limite} progresso={0.8} ordem={ex.ordem} />
      <LegendaCorte planta={ex.limite === 'transformante'} />
    </div>
  )
}

export const DEFINICOES_PLACAS: DefinicaoQualquer[] = [
  criarDefMulti<DadosLimite>({
    ...base,
    id: 'geografia/placas/limite',
    titulo: 'O que se forma no encontro das placas?',
    instrucao: 'Descubra o tipo de limite (movimento e tipo de crosta) e escolha a feição que se forma.',
    gerar: gerarLimite,
    Visual: VisualLimite,
  }),
  criarDefMulti<DadosExemplo>({
    ...base,
    id: 'geografia/placas/exemplo',
    titulo: 'Casos reais',
    instrucao: 'Ligue lugares conhecidos ao tipo de limite entre placas que os explica.',
    gerar: gerarExemplo,
    Visual: VisualExemplo,
  }),
  criarDefMulti<DadosEvidencia>({
    ...base,
    id: 'geografia/placas/evidencia',
    titulo: 'Evidências e história da teoria',
    instrucao: 'Wegener, Pangeia, assoalho oceânico e a posição do Brasil: escolha a afirmação correta.',
    gerar: gerarEvidencia,
  }),
  criarDefNum<DadosDeslocamento>({
    ...base,
    id: 'geografia/placas/deslocamento',
    titulo: 'Quanto as placas se movem?',
    instrucao: 'Converta cm/ano em km por milhão de anos (1 cm/ano = 10 km/Ma) e calcule distâncias, tempos e taxas.',
    gerar: gerarDeslocamento,
  }),
]
