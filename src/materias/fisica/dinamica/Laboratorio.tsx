import { useState } from 'react'
import { Line, Plot, Point, Text } from 'mafs'
import { ArrowLeftRight, Link2 } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { useAnimacao } from '@/sim/useAnimacao'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { G, angulos, atwood, forcaResultante, mesaComPolia, plano } from './calculo'
import { DEFINICOES_DINAMICA } from './definicoes'
import { patinadores, tempoAte } from './newton'
import { BarrasPlano, MesaForcas, Rampa, ReguaAngulo, SistemaPolia, setasDoPlano } from './Visuais'
import { CenaPatinadores, ComparacaoPar, PX_M } from './VisuaisNewton'
import { Pista } from '../cinematica/Visuais'

const fmt = (n: number, c = 2) => String(Math.round(n * 10 ** c) / 10 ** c).replace('.', ',')

function BotaoLink() {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <>
      <button type="button" className="btn" onClick={copiar}>
        <Link2 size={18} aria-hidden="true" />
        Copiar link
      </button>
      <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">{copiado && 'Link copiado.'}</span>
    </>
  )
}

/* ------------------------------------------------------------------ Introdução: plano inclinado */

const PADRAO_PLANO = { ang: 30, mu: 0.4, m: 5, t: 0, comp: true, forcas: true }
const COMPRIMENTO_RAMPA = 4 // m

type Previsao = 'parado' | 'desliza' | null

function TelaPlano() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_PLANO)
  const [previsao, setPrevisao] = useState<Previsao>(null)
  const [soltou, setSoltou] = useState(false)
  const p = plano({ m: e.m, angulo: e.ang, mu: e.mu })
  const imin = Math.abs(Math.tan((e.ang * Math.PI) / 180) - e.mu) < 1e-9
  const T = p.desliza ? Math.sqrt((2 * COMPRIMENTO_RAMPA) / p.aceleracao) : 0
  const t = Math.min(e.t, T)
  const anim = useAnimacao(e.t, T, (v) => atualizar({ t: v }))
  const s = p.desliza ? 0.5 * p.aceleracao * t * t : 0
  const pos = 0.25 + 0.75 * Math.min(1, s / COMPRIMENTO_RAMPA)
  const { setas } = setasDoPlano(e.ang, e.m, e.mu, { componentes: e.comp })
  const mudar = (parcial: Partial<typeof PADRAO_PLANO>) => {
    anim.setRodando(false)
    setSoltou(false)
    atualizar({ ...parcial, t: 0 })
  }
  const acertou = previsao !== null && (previsao === 'desliza') === p.desliza
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Rampa angulo={e.ang} pos={pos} setas={e.forcas ? setas : []} textoBloco={`${e.m} kg`} rotulo={`Plano inclinado de ${fmt(e.ang, 0)} graus com um bloco de ${e.m} quilogramas e atrito μ = ${fmt(e.mu)}`} />
        <div className="grid gap-2 sm:grid-cols-2">
          <BarrasPlano paralela={p.paralela} atritoMax={p.atritoMax} />
          <ReguaAngulo angulo={e.ang} mu={e.mu} />
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            Componente do peso ao longo do plano: <strong>{fmt(p.paralela)} N</strong> · atrito máximo: <strong>{fmt(p.atritoMax)} N</strong>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            {imin
              ? `tg θ = μ = ${fmt(e.mu)}: o bloco está na iminência de deslizar (fica parado, sem folga).`
              : p.desliza
                ? `tg θ = ${fmt(Math.tan((e.ang * Math.PI) / 180))} > μ = ${fmt(e.mu)}: o bloco desliza com a = g(sen θ − μ cos θ) = ${fmt(p.aceleracao)} m/s². Atrito atuando: ${fmt(p.atrito)} N.`
                : `tg θ = ${fmt(Math.tan((e.ang * Math.PI) / 180))} < μ = ${fmt(e.mu)}: o bloco fica parado. O atrito vale só ${fmt(p.atrito)} N (iguala a componente do peso), e não ${fmt(p.atritoMax)} N.`}
          </p>
          {p.desliza && (
            <p className="text-sm text-[var(--ink-muted)]">
              t = {fmt(t)} s · deslocamento = {fmt(s)} m · v = {fmt(p.aceleracao * t)} m/s
            </p>
          )}
          {soltou && previsao && (
            <p className="text-sm" style={{ color: acertou ? 'var(--ok)' : 'var(--erro)' }}>
              {acertou ? 'Sua previsão estava certa.' : `Sua previsão estava errada: ${p.desliza ? 'o atrito máximo não aguenta a componente do peso' : 'o atrito aguenta a componente do peso'}.`}
            </p>
          )}
          {soltou && !p.desliza && <p className="text-sm text-[var(--ink-muted)]">Nada se move: o atrito estático segura o bloco.</p>}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Ângulo do plano (θ)" valor={e.ang} onChange={(v) => mudar({ ang: v })} min={5} max={75} passo={1} unidade="°" marcas={[5, 45, 75]} />
        <ControleDeslizante rotulo="Coeficiente de atrito (μ)" valor={e.mu} onChange={(v) => mudar({ mu: v })} min={0} max={1.5} passo={0.05} marcas={[0, 0.75, 1.5]} />
        <ControleDeslizante rotulo="Massa do bloco" valor={e.m} onChange={(v) => mudar({ m: v })} min={1} max={20} passo={1} unidade="kg" marcas={[1, 10, 20]} descricao="Mude a massa e veja que o ângulo crítico não muda" />
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Antes de soltar: o que você prevê?</legend>
          {(['parado', 'desliza'] as const).map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="previsao-plano" checked={previsao === o} onChange={() => setPrevisao(o)} style={{ accentColor: 'var(--accent)' }} />
              {o === 'parado' ? 'Fica parado' : 'Desliza'}
            </label>
          ))}
        </fieldset>
        <PainelDeVisibilidade
          itens={[
            { id: 'forcas', rotulo: 'Forças', ativo: e.forcas },
            { id: 'comp', rotulo: 'Componentes do peso', ativo: e.comp },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Soltar o bloco</legend>
          <ControlesDeTempo
            rodando={anim.rodando}
            onAlternar={() => {
              setSoltou(true)
              anim.alternar()
            }}
            onPasso={() => {
              setSoltou(true)
              anim.passo(0.1)
            }}
            velocidade={anim.velocidade}
            onVelocidade={anim.setVelocidade}
          />
        </fieldset>
        <p className="text-sm text-[var(--ink-muted)]">
          Ângulo crítico para μ = {fmt(e.mu)}: <strong className="num">{fmt(angulos.critico(e.mu), 1)}°</strong>. Acima dele, o bloco desliza.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              anim.setRodando(false)
              setPrevisao(null)
              setSoltou(false)
              reiniciar()
            }}
          />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: 2ª lei com atrito */

const PADRAO_LEI = { F: 30, ms: 4, mus: 0.2, t: 0, parte: false }
const F_MAX = 100

function Tela2aLei() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LEI)
  const r = forcaResultante({ F: e.F, m: e.ms, mu: e.mus })
  const T = r.a > 0 ? Math.min(8, Math.sqrt(20 / r.a)) : 0
  const t = Math.min(e.t, T)
  const anim = useAnimacao(e.t, T, (v) => atualizar({ t: v }))
  const x = Math.min(10, 0.5 * r.a * t * t)
  const limite = e.mus * e.ms * G
  const amax = Math.max(2, Math.ceil(((F_MAX - limite) / e.ms) / 2) * 2)
  const mudar = (parcial: Partial<typeof PADRAO_LEI>) => {
    anim.setRodando(false)
    atualizar({ ...parcial, t: 0 })
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Pista x={x} xmax={10} rotulo="Pista com um bloco" />
        <MesaForcas F={e.F} m={e.ms} mu={e.mus} />
        <p className="text-sm font-semibold text-[var(--ink-muted)]">Aceleração (m/s²) em função da força aplicada F (N)</p>
        <Cena janela={{ xmin: -6, xmax: F_MAX + 4, ymin: -amax * 0.1, ymax: amax * 1.05 }} passoX={10} passoY={amax / 4} rotulo="Gráfico da aceleração em função da força aplicada">
          <Plot.OfX y={(F) => forcaResultante({ F, m: e.ms, mu: e.mus }).a} domain={[0, F_MAX]} color="var(--accent)" weight={3} />
          {limite > 0 && limite < F_MAX && <Line.Segment point1={[limite, 0]} point2={[limite, amax]} color="var(--aviso)" style="dashed" weight={1.5} />}
          {limite > 0 && limite < F_MAX && <Text x={limite} y={amax * 0.92} attach="e" attachDistance={8} size={12} color="var(--aviso)">{`μ·N = ${fmt(limite, 1)} N`}</Text>}
          <Point x={e.F} y={r.a} color="var(--erro)" />
          <Text x={F_MAX} y={-amax * 0.02} attach="nw" size={12} color="var(--ink-muted)">F (N)</Text>
        </Cena>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            F_res = F − f = <strong>{fmt(r.res)} N</strong> → a = F_res/m = <strong>{fmt(r.a)} m/s²</strong>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            {r.a === 0 ? `F = ${fmt(e.F)} N não vence o atrito máximo (${fmt(limite)} N): o bloco fica parado e o atrito é igual a F.` : `F vence o atrito máximo (${fmt(limite)} N): o bloco acelera. Atrito atuando: μ·N = ${fmt(r.atrito)} N.`}
          </p>
          {r.a > 0 && (
            <p className="text-sm text-[var(--ink-muted)]">
              t = {fmt(t)} s · v = {fmt(r.a * t)} m/s · x = {fmt(x)} m
            </p>
          )}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Força aplicada (F)" valor={e.F} onChange={(v) => mudar({ F: v })} min={0} max={F_MAX} passo={1} unidade="N" marcas={[0, 50, 100]} />
        <ControleDeslizante rotulo="Massa (m)" valor={e.ms} onChange={(v) => mudar({ ms: v })} min={1} max={20} passo={1} unidade="kg" marcas={[1, 10, 20]} />
        <ControleDeslizante rotulo="Coeficiente de atrito (μ)" valor={e.mus} onChange={(v) => mudar({ mus: v })} min={0} max={1} passo={0.05} marcas={[0, 0.5, 1]} />
        <p className="text-sm text-[var(--ink-muted)]">
          Experimente aumentar a massa: a inclinação do gráfico diminui (a = F_res/m). Aumente μ: o trecho parado fica mais longo.
        </p>
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Empurrar</legend>
          <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.25)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              anim.setRodando(false)
              reiniciar()
            }}
          />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: polias */

const PADRAO_POLIA = { tipo: 'atwood', m1: 3, m2: 1, mup: 0.2, t: 0, setas: true }
const PX_POR_M = 20
const LIMITE_M = 2

function TelaPolias() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_POLIA)
  const tipo = e.tipo === 'mesa' ? 'mesa' : 'atwood'
  const mu = tipo === 'mesa' ? e.mup : 0
  const sistema = tipo === 'atwood' ? atwood(e.m1, e.m2) : mesaComPolia(e.m1, e.m2, mu)
  const a = sistema.a
  const T = Math.abs(a) > 1e-9 ? Math.min(6, Math.sqrt((2 * LIMITE_M) / Math.abs(a))) : 0
  const t = Math.min(e.t, T)
  const anim = useAnimacao(e.t, T, (v) => atualizar({ t: v }))
  const desloc = 0.5 * a * t * t * PX_POR_M
  const mudar = (parcial: Partial<typeof PADRAO_POLIA>) => {
    anim.setRodando(false)
    atualizar({ ...parcial, t: 0 })
  }
  const aDe = (m2: number) => (tipo === 'atwood' ? atwood(e.m1, m2).a : mesaComPolia(e.m1, m2, mu).a)
  const ymin = tipo === 'atwood' ? -G * 1.1 : -1
  const parado = tipo === 'mesa' && !mesaComPolia(e.m1, e.m2, mu).desliza
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <SistemaPolia
          tipo={tipo}
          m1={e.m1}
          m2={e.m2}
          mu={mu}
          deslocamento={tipo === 'atwood' ? desloc : Math.max(0, desloc)}
          setas={e.setas}
          aceleracao={a}
          tracao={sistema.T}
          rotulo={tipo === 'atwood' ? `Máquina de Atwood com blocos de ${e.m1} e ${e.m2} quilogramas` : `Bloco de ${e.m1} quilogramas na mesa ligado a um bloco de ${e.m2} quilogramas pendurado`}
        />
        <p className="text-sm font-semibold text-[var(--ink-muted)]">Aceleração (m/s²) em função da massa m₂ (kg){tipo === 'atwood' ? ': negativa quando m₂ > m₁ (o bloco da esquerda sobe)' : ''}</p>
        <Cena janela={{ xmin: -1, xmax: 21, ymin, ymax: G * 1.2 }} passoX={2} passoY={2} rotulo="Gráfico da aceleração em função da massa do segundo bloco">
          <Line.Segment point1={[0, G]} point2={[21, G]} color="var(--ink-muted)" style="dashed" weight={1.5} />
          <Text x={21} y={G} attach="sw" size={12} color="var(--ink-muted)">g</Text>
          <Plot.OfX y={aDe} domain={[0.05, 20]} color="var(--accent)" weight={3} />
          <Point x={e.m2} y={a} color="var(--erro)" />
          <Text x={20} y={ymin} attach="nw" size={12} color="var(--ink-muted)">m₂ (kg)</Text>
        </Cena>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            a = <strong>{fmt(Math.abs(a))} m/s²</strong> · T = <strong>{fmt(sistema.T)} N</strong>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            {parado
              ? `Nada se move: m₂·g = ${fmt(e.m2 * G)} N não vence o atrito máximo μ·m₁·g = ${fmt(mu * e.m1 * G)} N. O pendurado fica em equilíbrio: T = m₂·g.`
              : tipo === 'atwood'
                ? `${e.m1}·10 − T = ${e.m1}·a e T − ${e.m2}·10 = ${e.m2}·a. Somando: ${fmt((e.m1 - e.m2) * G, 1)} = ${e.m1 + e.m2}·a. ${a === 0 ? 'Massas iguais: equilíbrio.' : `O bloco de ${a > 0 ? e.m1 : e.m2} kg desce.`}`
                : `${e.m2}·10 − T = ${e.m2}·a e T − ${fmt(mu * e.m1 * G)} = ${e.m1}·a. Somando: ${fmt(e.m2 * G - mu * e.m1 * G)} = ${e.m1 + e.m2}·a.`}
          </p>
          <p className="text-sm text-[var(--ink-muted)]">Note como a tração fica entre os dois pesos: T = {fmt(sistema.T)} N.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Montagem</legend>
          {(['atwood', 'mesa'] as const).map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="montagem" checked={tipo === o} onChange={() => mudar({ tipo: o })} style={{ accentColor: 'var(--accent)' }} />
              {o === 'atwood' ? 'Dois blocos pendurados (Atwood)' : 'Bloco na mesa + bloco pendurado'}
            </label>
          ))}
        </fieldset>
        <ControleDeslizante rotulo={tipo === 'atwood' ? 'Massa do bloco da esquerda (m₁)' : 'Massa do bloco da mesa (m₁)'} valor={e.m1} onChange={(v) => mudar({ m1: v })} min={1} max={20} passo={1} unidade="kg" marcas={[1, 10, 20]} />
        <ControleDeslizante rotulo={tipo === 'atwood' ? 'Massa do bloco da direita (m₂)' : 'Massa do bloco pendurado (m₂)'} valor={e.m2} onChange={(v) => mudar({ m2: v })} min={1} max={20} passo={1} unidade="kg" marcas={[1, 10, 20]} />
        {tipo === 'mesa' && <ControleDeslizante rotulo="Coeficiente de atrito (μ)" valor={e.mup} onChange={(v) => mudar({ mup: v })} min={0} max={1} passo={0.05} marcas={[0, 0.5, 1]} />}
        <PainelDeVisibilidade itens={[{ id: 'setas', rotulo: 'Forças (tração e peso)', ativo: e.setas }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Soltar os blocos</legend>
          <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              anim.setRodando(false)
              reiniciar()
            }}
          />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Ação e reação: patinadores */

const PADRAO_ACAO = { ma: 50, mb: 80, fp: 200, dtp: 0.5, t: 0, pares: true, vel: true, rastro: true }
/** distância até a borda da pista (m), onde a animação termina */
const PISTA_M = (160 - 26) / PX_M

type PrevisaoAcao = 'A' | 'B' | 'iguais' | null

function TelaAcaoReacao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ACAO)
  const [previsao, setPrevisao] = useState<PrevisaoAcao>(null)
  const p = patinadores({ mA: e.ma, mB: e.mb, F: e.fp, dt: e.dtp })
  const T = Math.min(5, tempoAte(Math.max(p.aA, p.aB), e.dtp, PISTA_M))
  const t = Math.min(e.t, T)
  const anim = useAnimacao(e.t, T, (v) => atualizar({ t: v }), 0.8)
  const mudar = (parcial: Partial<typeof PADRAO_ACAO>) => {
    anim.setRodando(false)
    atualizar({ ...parcial, t: 0 })
  }
  const certa: PrevisaoAcao = e.ma === e.mb ? 'iguais' : e.ma < e.mb ? 'A' : 'B'
  const soltos = t >= e.dtp
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <CenaPatinadores mA={e.ma} mB={e.mb} F={e.fp} dt={e.dtp} t={t} forcas={e.pares} velocidades={e.vel} rastro={e.rastro} />
        <ComparacaoPar mA={e.ma} mB={e.mb} F={e.fp} dt={e.dtp} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            {soltos ? 'Já se soltaram: ' : 'Empurrando: '}
            cada um {soltos ? 'recebeu' : 'recebe'} <strong>{fmt(e.fp, 0)} N</strong>, em sentidos opostos.
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            a_A = {fmt(e.fp, 0)}/{e.ma} = {fmt(p.aA)} m/s² · a_B = {fmt(e.fp, 0)}/{e.mb} = {fmt(p.aB)} m/s²
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            {soltos
              ? `Sem força, cada um segue com velocidade constante (1ª lei): v_A = ${fmt(p.vA)} m/s e v_B = ${fmt(p.vB)} m/s. Massa × velocidade: ${fmt(e.ma * p.vA)} kg·m/s para os dois.`
              : `O empurrão dura ${fmt(e.dtp, 1)} s. Enquanto as mãos se tocam, as forças são iguais o tempo todo.`}
          </p>
          {soltos && previsao && (
            <p className="text-sm" style={{ color: previsao === certa ? 'var(--ok)' : 'var(--erro)' }}>
              {previsao === certa
                ? 'Sua previsão estava certa.'
                : certa === 'iguais'
                  ? 'Sua previsão estava errada: com massas iguais, forças iguais dão velocidades iguais.'
                  : `Sua previsão estava errada: as forças são iguais, então quem tem menos massa (${certa}) acelera mais e sai mais rápido.`}
            </p>
          )}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Antes de soltar: quem sai mais rápido?</legend>
          {(
            [
              ['A', `A (${e.ma} kg)`],
              ['B', `B (${e.mb} kg)`],
              ['iguais', 'Os dois com a mesma velocidade'],
            ] as const
          ).map(([id, rot]) => (
            <label key={id} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="previsao-acao" checked={previsao === id} onChange={() => setPrevisao(id)} style={{ accentColor: 'var(--accent)' }} />
              {rot}
            </label>
          ))}
        </fieldset>
        <ControleDeslizante rotulo="Massa de A" valor={e.ma} onChange={(v) => mudar({ ma: v })} min={30} max={120} passo={5} unidade="kg" marcas={[30, 75, 120]} />
        <ControleDeslizante rotulo="Massa de B" valor={e.mb} onChange={(v) => mudar({ mb: v })} min={30} max={120} passo={5} unidade="kg" marcas={[30, 75, 120]} />
        <ControleDeslizante rotulo="Força do empurrão" valor={e.fp} onChange={(v) => mudar({ fp: v })} min={50} max={400} passo={10} unidade="N" marcas={[50, 200, 400]} descricao="Cada um recebe essa força, em sentidos opostos" />
        <ControleDeslizante rotulo="Duração do empurrão" valor={e.dtp} onChange={(v) => mudar({ dtp: v })} min={0.2} max={1} passo={0.1} unidade="s" marcas={[0.2, 0.6, 1]} />
        <PainelDeVisibilidade
          itens={[
            { id: 'pares', rotulo: 'Forças do par', ativo: e.pares },
            { id: 'vel', rotulo: 'Velocidades', ativo: e.vel },
            { id: 'rastro', rotulo: 'Marcas a cada 0,5 s', ativo: e.rastro },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Empurrar</legend>
          <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              anim.setRodando(false)
              setPrevisao(null)
              reiniciar()
            }}
          />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaPlano /> },
        { id: 'explorar', conteudo: <Tela2aLei /> },
        { id: 'acao', rotulo: 'Ação e reação', icone: <ArrowLeftRight size={18} />, conteudo: <TelaAcaoReacao /> },
        { id: 'lab', conteudo: <TelaPolias /> },
      ]}
      desafios={DEFINICOES_DINAMICA}
    />
  )
}
