import { useState } from 'react'
import { MovablePoint, Polyline, Line } from 'mafs'
import type { DefinicaoDesafio, DefinicaoQualquer, EntradaProps } from '@/desafios/PainelDesafio'
import { criarDefMulti, criarDefNum } from '@/desafios/simples'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { SeletorNumerico } from '@/sim/SeletorNumerico'
import { alvoLancamento, pousoEm, type InstanciaAlvoL, type RespostaAlvoL } from './alvo'
import { tempoDeVoo } from './calculo'
import { desenho, type InstanciaDesenho, type RespostaDesenho } from './desenho'
import { gerarCalculo, gerarGraficos, type DadosCalculo, type DadosGraficos } from './geradores'
import { MiniGrafico, OpcaoLigar, Pista, Trajetoria, VisualLigar } from './Visuais'

const base = { materia: 'fisica' as const, tema: 'cinematica' }
const f = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/** x(t) por interpolação linear entre os pontos de controle (um por segundo). */
export function xEm(pontos: number[], t: number): number {
  const k = Math.min(Math.floor(t), pontos.length - 2)
  const frac = t - k
  return (pontos[k] as number) + ((pontos[k + 1] as number) - (pontos[k] as number)) * frac
}

/** velocidades (por trecho de 1 s) amostradas como degraus */
export function degraus(pontos: number[]): number[] {
  const T = pontos.length - 1
  return Array.from({ length: 97 }, (_, i) => {
    const t = (T * i) / 96
    const k = Math.min(Math.floor(t - 1e-9), T - 1)
    const kk = Math.max(0, k)
    return (pontos[kk + 1] as number) - (pontos[kk] as number)
  })
}

export function EntradaDesenho({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaDesenho, RespostaDesenho>) {
  const [t, setT] = useState(0)
  const alvo = (correcao?.destaque as { alvo?: number[] } | undefined)?.alvo
  const mover = (k: number, y: number) => onChange(resposta.map((v, i) => (i === k ? y : v)))
  return (
    <div className="grid gap-3">
      <p className="text-lg">{desenho.enunciado(inst)}</p>
      <Pista x={xEm(resposta, t)} />
      <ControleDeslizante rotulo="Ver o carrinho no instante t" valor={t} onChange={setT} min={0} max={inst.T} passo={0.1} unidade="s" marcas={[0, inst.T]} />
      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-1">
          <Cena janela={{ xmin: -0.6, xmax: inst.T + 0.6, ymin: -1, ymax: inst.xmax + 1 }} passoX={1} passoY={2} rotulo="Gráfico da posição em função do tempo: arraste os pontos">
            {alvo && <Polyline points={alvo.map((v, k) => [k, v] as [number, number])} color="var(--curva-alvo)" weight={3} svgPolylineProps={{ fill: 'none', strokeDasharray: '7 5' }} />}
            <Polyline points={resposta.map((v, k) => [k, v] as [number, number])} color="var(--accent)" weight={3.5} svgPolylineProps={{ fill: 'none' }} />
            <Line.Segment point1={[t, -1]} point2={[t, inst.xmax + 1]} color="var(--erro)" style="dashed" weight={1.5} />
            {resposta.map((v, k) =>
              bloqueado ? null : (
                <MovablePoint key={k} point={[k, v]} color="var(--accent)" constrain={([, y]) => [k, Math.max(0, Math.min(inst.xmax, Math.round(y * 2) / 2))]} onMove={([, y]) => mover(k, y)} />
              ),
            )}
          </Cena>
          {alvo && (
            <p className="flex flex-wrap gap-4 text-sm text-[var(--ink-muted)]">
              <span><span aria-hidden="true" style={{ color: 'var(--accent)' }}>━</span> seu gráfico</span>
              <span><span aria-hidden="true">╌</span> gráfico certo</span>
            </p>
          )}
        </div>
        <div className="grid content-start gap-1">
          <MiniGrafico y={degraus(resposta)} T={inst.T} rotuloY="v (m/s)" limite={4} cor="var(--ok)" altura={140} rotulo="Velocidade em função do tempo, calculada a partir do seu gráfico de posição" />
          <p className="text-sm text-[var(--ink-muted)]">Velocidade que o seu gráfico produz (a inclinação de cada trecho).</p>
        </div>
      </div>
      <details>
        <summary className="min-h-11 cursor-pointer py-2 font-semibold">Ajustar com botões (teclado)</summary>
        <div className="grid gap-2 pt-2 sm:grid-cols-2">
          {resposta.map((v, k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <span className="num">t = {k} s</span>
              <SeletorNumerico rotulo={`posição em t = ${k} s`} valor={v} min={0} max={inst.xmax} passo={0.5} onChange={(n) => !bloqueado && mover(k, n)} />
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}

const defDesenho: DefinicaoDesafio<InstanciaDesenho, RespostaDesenho> = {
  desafio: desenho,
  instrucao: 'Arraste os pontos do gráfico de posição até produzir o movimento descrito.',
  respostaInicial: (i) => desenho.respostaInicial(i),
  podeEnviar: () => true,
  Entrada: EntradaDesenho,
}

export function EntradaAlvo({ inst, resposta, onChange, bloqueado }: EntradaProps<InstanciaAlvoL, RespostaAlvoL>) {
  const r = { angulo: inst.fixo.angulo ?? resposta.angulo, v0: inst.fixo.v0 ?? resposta.v0 }
  const T = tempoDeVoo(r.v0, r.angulo)
  const [t, setT] = useState(0)
  const p = pousoEm(r.v0, r.angulo, inst.h)
  return (
    <div className="grid gap-3">
      <p className="text-lg">
        Acerte o alvo vermelho, a {f(inst.d)} m{inst.h > 0 ? ` e ${f(inst.h)} m de altura (uma plataforma)` : ' no chão'}. Ajuste a {inst.fixo.angulo !== undefined ? 'velocidade (o ângulo está fixo em 45°)' : inst.fixo.v0 !== undefined ? `inclinação (a velocidade está fixa em ${inst.fixo.v0} m/s)` : 'velocidade e a inclinação'} do lançamento. Use g = 10 m/s².
      </p>
      <Trajetoria v0={r.v0} angulo={r.angulo} alvo={{ d: inst.d, h: inst.h, tol: inst.tol }} t={Math.min(t, Math.max(T, 0))} />
      <div className="grid gap-3 sm:grid-cols-2">
        {inst.fixo.v0 === undefined && <ControleDeslizante rotulo="Velocidade inicial" valor={resposta.v0} onChange={(v) => !bloqueado && onChange({ ...resposta, v0: v })} min={5} max={40} passo={0.5} unidade="m/s" marcas={[5, 20, 40]} />}
        {inst.fixo.angulo === undefined && <ControleDeslizante rotulo="Ângulo" valor={resposta.angulo} onChange={(a) => !bloqueado && onChange({ ...resposta, angulo: a })} min={5} max={85} passo={1} unidade="°" marcas={[5, 45, 85]} />}
        <ControleDeslizante rotulo="Acompanhar o voo (t)" valor={Math.min(t, T)} onChange={setT} min={0} max={Math.max(0.1, T)} passo={0.05} unidade="s" marcas={[0, Math.round(T * 10) / 10]} />
      </div>
      <p className="num text-sm text-[var(--ink-muted)]" aria-live="polite">
        {p ? `Com essa configuração, o projétil ${inst.h > 0 ? 'chega à altura da plataforma' : 'cai'} a ${f(p.x)} m do ponto de lançamento.` : 'Com essa configuração, o projétil não chega à altura do alvo.'}
      </p>
    </div>
  )
}

const defAlvo: DefinicaoDesafio<InstanciaAlvoL, RespostaAlvoL> = {
  desafio: alvoLancamento,
  instrucao: 'Lance o projétil: ajuste velocidade e ângulo até a trajetória cair no alvo.',
  respostaInicial: (i) => alvoLancamento.respostaInicial(i),
  podeEnviar: () => true,
  Entrada: EntradaAlvo,
}

export const DEFINICOES_CINEMATICA: DefinicaoQualquer[] = [
  defDesenho,
  criarDefMulti<DadosGraficos>({
    ...base,
    id: 'fisica/cinematica/ligar',
    titulo: 'Ligue os gráficos',
    instrucao: 'Relacione o gráfico de posição ao de velocidade do mesmo movimento.',
    gerar: gerarGraficos,
    Visual: VisualLigar,
    Opcao: OpcaoLigar,
  }),
  defAlvo,
  criarDefNum<DadosCalculo>({
    ...base,
    id: 'fisica/cinematica/calculo',
    titulo: 'MRU e MRUV na prática',
    instrucao: 'Escolha a equação certa (e as unidades certas) e calcule.',
    gerar: gerarCalculo,
  }),
]
