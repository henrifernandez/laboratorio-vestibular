import { useId, useMemo } from 'react'
import { Plot } from 'mafs'
import type { DefinicaoDesafio, DefinicaoQualquer, EntradaProps } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { compilar } from '../funcoes/expressao'
import { gerarCircunferencia, gerarMedida, gerarPosicao, type DadosCirculo, type DadosMedidaGA, type DadosPosicao } from './geradores'
import { enunciadoReta, retaFormula, type InstanciaReta } from './retaFormula'
import { Plano, Ponto, RetaMN, VisualCirculo, VisualMedida } from './Visuais'

const base = { materia: 'matematica' as const, tema: 'geometria-analitica' }

function EntradaReta({ inst, resposta, onChange, bloqueado, correcao }: EntradaProps<InstanciaReta, string>) {
  const id = useId()
  const compilada = useMemo(() => (resposta.trim() ? compilar(resposta.replace(/^\s*y\s*=\s*/i, '')) : null), [resposta])
  const lim = Math.max(8, Math.ceil(Math.max(...inst.pontos.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) / 2) * 2 + 2)
  return (
    <div className="grid gap-3">
      <p className="text-lg">{enunciadoReta(inst)}</p>
      <Plano lim={lim} rotulo="Plano cartesiano com os pontos da reta e a sua fórmula, ao vivo">
        {inst.ref && <RetaMN m={inst.ref.m} n={inst.ref.n} cor="var(--ink-muted)" estilo="dashed" />}
        {correcao && <RetaMN m={inst.m} n={inst.n} cor="var(--curva-alvo)" estilo="dashed" />}
        {compilada?.ok && <Plot.OfX y={compilada.fn} domain={[-20, 20]} color="var(--accent)" weight={3} />}
        {inst.pontos.map((p, i) => (
          <Ponto key={i} p={p} rotulo={inst.variante === 'doisPontos' ? (i === 0 ? 'A' : 'B') : 'P'} />
        ))}
      </Plano>
      <div className="grid gap-1">
        <label htmlFor={id} className="font-semibold">
          y =
        </label>
        <input
          id={id}
          value={resposta}
          disabled={bloqueado}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder="ex.: 2x - 1"
          aria-invalid={compilada ? !compilada.ok : false}
          className="h-12 max-w-md rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
        />
        {!bloqueado && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Atalhos de digitação">
            {['x', '(', ')', '/', '-'].map((t) => (
              <button key={t} type="button" className="btn num px-3" onClick={() => onChange(resposta + t)}>
                {t}
              </button>
            ))}
          </div>
        )}
        <p role="status" className="min-h-6 text-sm" style={{ color: compilada && !compilada.ok ? 'var(--erro)' : 'var(--ink-muted)' }}>
          {compilada && !compilada.ok ? compilada.erro : 'Sua reta aparece no gráfico enquanto você digita (azul). Aceita 2x - 1, y = x/2 + 3, etc.'}
        </p>
      </div>
    </div>
  )
}

const defReta: DefinicaoDesafio<InstanciaReta, string> = {
  desafio: retaFormula,
  instrucao: 'Ache a equação da reta e confira o gráfico que aparece enquanto você digita.',
  respostaInicial: () => '',
  podeEnviar: (r) => r.trim().length > 0,
  Entrada: EntradaReta,
}

export const DEFINICOES_GA: DefinicaoQualquer[] = [
  defReta,
  criarDefMulti<DadosCirculo>({
    ...base,
    id: 'matematica/geometria-analitica/circunferencia',
    titulo: 'Equação da circunferência',
    instrucao: 'Da figura (ou da equação geral) para o centro, o raio e a equação certa.',
    gerar: gerarCircunferencia,
    Visual: VisualCirculo,
  }),
  criarDefNum<DadosMedidaGA>({
    ...base,
    id: 'matematica/geometria-analitica/medidas',
    titulo: 'Distância e ponto médio',
    instrucao: 'Calcule a distância entre pontos, o ponto médio ou a distância de um ponto a uma reta.',
    gerar: gerarMedida,
    Visual: VisualMedida,
  }),
  criarDefMulti<DadosPosicao>({
    ...base,
    id: 'matematica/geometria-analitica/posicao',
    titulo: 'Posição relativa',
    instrucao: 'Compare distâncias e coeficientes: dentro/fora, secante/tangente, paralelas/perpendiculares.',
    gerar: gerarPosicao,
  }),
]
