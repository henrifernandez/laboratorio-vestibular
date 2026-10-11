import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { useAnimacao } from '@/sim/useAnimacao'
import { MATERIAIS, NOME_FASE, curvaAquecimento, curvaPV, equilibrio, estadoAposCalor, estadoParcial, geloComAgua, trabalhoIsobarico, trabalhoIsotermico, type EstadoGas, type Transformacao } from './calculo'
import { DEFINICOES_TERMOLOGIA } from './definicoes'
import { Amostra, BarrasCalor, Bloco, Copo, DiagramaPV, GraficoCurva, Pistao } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

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

/* ------------------------------------------------------------------ Introdução: curva de aquecimento */

const PADRAO_AQ = { m: 100, ti: -20, pot: 300, t: 0, qs: true }
const T_VAPOR = 120
const SEGUNDOS_REAIS = 14

function TelaAquecimento() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_AQ)
  const trechos = curvaAquecimento(e.m, e.ti, T_VAPOR)
  const Qtotal = trechos[trechos.length - 1]!.q1
  const tmax = Qtotal / e.pot
  const t = Math.min(e.t, tmax)
  const Q = e.pot * t
  const est = estadoAposCalor(e.m, e.ti, Q)
  const anim = useAnimacao(e.t, tmax, (v) => atualizar({ t: v }), tmax / SEGUNDOS_REAIS)
  const mudar = (parcial: Partial<typeof PADRAO_AQ>) => {
    anim.setRodando(false)
    atualizar({ ...parcial, t: 0 })
  }
  const pontos = [{ x: 0, y: e.ti }, ...trechos.map((tr) => ({ x: tr.q1 / e.pot, y: tr.t1 }))]
  const destaque = [{ x: 0, y: e.ti }]
  for (const tr of trechos) {
    if (Q <= tr.q0) break
    const fim = Math.min(Q, tr.q1)
    const prop = tr.q1 === tr.q0 ? 0 : (fim - tr.q0) / (tr.q1 - tr.q0)
    destaque.push({ x: fim / e.pot, y: tr.t0 + (tr.t1 - tr.t0) * prop })
  }
  const extras = e.qs
    ? trechos
        .filter((tr) => tr.q1 - tr.q0 > Qtotal * 0.06)
        .map((tr) => {
          const plato = tr.t0 === tr.t1
          return { x: (tr.q0 + tr.q1) / 2 / e.pot + (plato ? 0 : tmax * 0.025), y: (tr.t0 + tr.t1) / 2 + (plato ? 6 : -4), texto: `${fmt((tr.q1 - tr.q0) / 1000, 1)} kcal`, ancora: plato ? ('middle' as const) : ('start' as const) }
        })
    : []
  const atual = trechos.find((tr) => Q <= tr.q1 + 1e-9) ?? trechos[trechos.length - 1]!
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="grid grid-cols-[minmax(0,140px)_1fr] items-center gap-3">
          <Amostra fase={est.fase} fracao={est.fracao} T={est.T} />
          <div className="cartao num grid gap-1 p-3" aria-live="polite">
            <p className="text-lg font-semibold">{NOME_FASE[est.fase]}</p>
            <p>T = <strong>{fmt(est.T, 1)} °C</strong></p>
            {(est.fase === 'fusao' || est.fase === 'vaporizacao') && <p className="text-sm text-[var(--ink-muted)]">{Math.round(est.fracao * 100)} % transformado: a temperatura não muda</p>}
            <p className="text-sm text-[var(--ink-muted)]">t = {fmt(t, 0)} s · Q = {fmt(Q, 0)} cal</p>
          </div>
        </div>
        <GraficoCurva
          pontos={pontos}
          destaque={destaque}
          xmax={tmax}
          ymin={e.ti - 10}
          ymax={T_VAPOR + 15}
          rotulo={`Gráfico da temperatura em função do tempo, aquecendo ${e.m} gramas de gelo a ${e.ti} graus`}
          rotuloX="tempo (s) →"
          marcador={{ x: t, y: est.T }}
          extras={extras}
          altura={190}
          guias={[0, 100]}
        />
        <ol className="m-0 grid list-none gap-1 p-0 text-sm" aria-label="Calor de cada trecho da curva">
          {trechos.map((tr, i) => (
            <li key={i} className="num flex justify-between gap-3 rounded-md px-2 py-1" style={{ background: tr === atual ? 'var(--surface-2)' : 'transparent', fontWeight: tr === atual ? 700 : 400 }}>
              <span>{NOME_FASE[tr.fase]}</span>
              <span>
                {tr.t0 === tr.t1 ? 'Q = m·L' : 'Q = m·c·ΔT'} = {fmt(tr.q1 - tr.q0, 0)} cal
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Massa de gelo" valor={e.m} onChange={(v) => mudar({ m: v })} min={20} max={200} passo={10} unidade="g" marcas={[20, 100, 200]} />
        <ControleDeslizante rotulo="Temperatura inicial do gelo" valor={e.ti} onChange={(v) => mudar({ ti: v })} min={-30} max={-5} passo={5} unidade="°C" marcas={[-30, -5]} />
        <ControleDeslizante rotulo="Potência da fonte de calor" valor={e.pot} onChange={(v) => mudar({ pot: v })} min={50} max={500} passo={50} unidade="cal/s" marcas={[50, 250, 500]} />
        <ControleDeslizante rotulo="Instante (t)" valor={t} onChange={(v) => atualizar({ t: v })} min={0} max={Math.round(tmax)} passo={Math.max(1, Math.round(tmax / 400))} unidade="s" marcas={[0, Math.round(tmax)]} />
        <PainelDeVisibilidade itens={[{ id: 'qs', rotulo: 'Calor de cada trecho no gráfico', ativo: e.qs }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Aquecer</legend>
          <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(tmax / 100)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
          <p className="text-sm text-[var(--ink-muted)]">A animação acelera o tempo para caber em cerca de {SEGUNDOS_REAIS} s.</p>
        </fieldset>
        <p className="text-sm text-[var(--ink-muted)]">
          Dobre a massa: o gráfico se estica ao dobro no tempo, mas os patamares continuam em 0 °C e 100 °C. Aumente a potência: o tempo encolhe.
        </p>
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

/* ------------------------------------------------------------------ Explorar: misturas */

const PADRAO_MIS = { modo: 'corpos', mA: 200, TA: 80, matA: 'agua', mB: 300, TB: 20, matB: 'agua', mg: 100, Tg: -10, ma: 300, Ta: 50 }

function SeletorMaterial({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="font-semibold">{rotulo}</span>
      <select value={valor} onChange={(ev) => onChange(ev.target.value)} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3">
        {Object.entries(MATERIAIS).map(([id, mt]) => (
          <option key={id} value={id}>
            {mt.nome} (c = {String(mt.c).replace('.', ',')} cal/g·°C)
          </option>
        ))}
      </select>
    </label>
  )
}

function Corpo({ mat, m, T, rotulo }: { mat: string; m: number; T: number; rotulo: string }) {
  return mat === 'agua' ? <Copo agua={m} T={T} rotulo={rotulo} mMax={600} /> : <Bloco m={m} T={T} rotulo={rotulo} />
}

function TelaMistura() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MIS)
  const modo = e.modo === 'gelo' ? 'gelo' : 'corpos'
  const cA = MATERIAIS[e.matA]?.c ?? 1
  const cB = MATERIAIS[e.matB]?.c ?? 1
  const Te = equilibrio([{ m: e.mA, c: cA, T: e.TA }, { m: e.mB, c: cB, T: e.TB }])
  const QA = e.mA * cA * (Te - e.TA)
  const QB = e.mB * cB * (Te - e.TB)
  const gelo = geloComAgua({ mg: e.mg, Tg: e.Tg, ma: e.ma, Ta: e.Ta })
  const aquecerGelo = e.mg * 0.5 * (0 - e.Tg)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        {modo === 'corpos' ? (
          <>
            <div className="grid grid-cols-3 items-end gap-1" role="group" aria-label="Antes e depois da mistura">
              <div>
                <Corpo mat={e.matA} m={e.mA} T={e.TA} rotulo="Corpo A" />
                <p className="text-center text-sm text-[var(--ink-muted)]">corpo A</p>
              </div>
              <div>
                <Corpo mat={e.matB} m={e.mB} T={e.TB} rotulo="Corpo B" />
                <p className="text-center text-sm text-[var(--ink-muted)]">corpo B</p>
              </div>
              <div>
                <Corpo mat={e.matA === 'agua' || e.matB === 'agua' ? 'agua' : e.matA} m={e.mA + e.mB} T={Te} rotulo="Depois do equilíbrio" />
                <p className="text-center text-sm text-[var(--ink-muted)]">depois (T = {fmt(Te, 1)} °C)</p>
              </div>
            </div>
            <BarrasCalor itens={[{ rotulo: 'A', q: QA }, { rotulo: 'B', q: QB }]} />
            <div className="cartao num grid gap-1 p-3" aria-live="polite">
              <p>
                T = Σ m·c·T / Σ m·c = <strong>{fmt(Te, 2)} °C</strong>
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                Capacidades térmicas: A = {fmt(e.mA * cA)} cal/°C, B = {fmt(e.mB * cB)} cal/°C. Calor de A + calor de B = {fmt(QA + QB, 2)} cal (sempre zero).
              </p>
              {Math.abs(Te - (e.TA + e.TB) / 2) > 0.5 && <p className="text-sm text-[var(--ink-muted)]">A média simples seria {fmt((e.TA + e.TB) / 2, 1)} °C: não vale quando m·c é diferente.</p>}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 items-end gap-1" role="group" aria-label="Antes e depois da mistura de gelo e água">
              <div>
                <Copo agua={0} geloM={e.mg} T={e.Tg} rotulo="Gelo" />
                <p className="text-center text-sm text-[var(--ink-muted)]">gelo</p>
              </div>
              <div>
                <Copo agua={e.ma} T={e.Ta} rotulo="Água" />
                <p className="text-center text-sm text-[var(--ink-muted)]">água</p>
              </div>
              <div>
                <Copo agua={gelo.agua} geloM={gelo.gelo} T={gelo.T} rotulo="Depois do equilíbrio" />
                <p className="text-center text-sm text-[var(--ink-muted)]">depois</p>
              </div>
            </div>
            <div className="cartao num grid gap-1 p-3" aria-live="polite">
              <p>
                {gelo.situacao === 'derrete-tudo' && (
                  <>
                    Derrete tudo: T = <strong>{fmt(gelo.T, 2)} °C</strong>
                  </>
                )}
                {gelo.situacao === 'derrete-parte' && (
                  <>
                    Equilíbrio a <strong>0 °C</strong>, restam <strong>{fmt(gelo.gelo, 1)} g</strong> de gelo
                  </>
                )}
                {gelo.situacao === 'congela-tudo' && (
                  <>
                    Toda a água congela: T = <strong>{fmt(gelo.T, 2)} °C</strong>
                  </>
                )}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                A água esfria até 0 °C e cede {fmt(e.ma * e.Ta, 0)} cal. O gelo gasta {fmt(aquecerGelo, 0)} cal para chegar a 0 °C e {fmt(e.mg * 80, 0)} cal para fundir tudo.
              </p>
            </div>
          </>
        )}
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">O que misturar</legend>
          {(['corpos', 'gelo'] as const).map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="modo-mistura" checked={modo === o} onChange={() => atualizar({ modo: o })} style={{ accentColor: 'var(--accent)' }} />
              {o === 'corpos' ? 'Dois corpos (sem mudar de fase)' : 'Gelo e água líquida'}
            </label>
          ))}
        </fieldset>
        {modo === 'corpos' ? (
          <>
            <SeletorMaterial rotulo="Material do corpo A" valor={e.matA} onChange={(v) => atualizar({ matA: v })} />
            <ControleDeslizante rotulo="Massa de A" valor={e.mA} onChange={(v) => atualizar({ mA: v })} min={50} max={500} passo={10} unidade="g" marcas={[50, 250, 500]} />
            <ControleDeslizante rotulo="Temperatura de A" valor={e.TA} onChange={(v) => atualizar({ TA: v })} min={0} max={100} passo={1} unidade="°C" marcas={[0, 50, 100]} />
            <SeletorMaterial rotulo="Material do corpo B" valor={e.matB} onChange={(v) => atualizar({ matB: v })} />
            <ControleDeslizante rotulo="Massa de B" valor={e.mB} onChange={(v) => atualizar({ mB: v })} min={50} max={500} passo={10} unidade="g" marcas={[50, 250, 500]} />
            <ControleDeslizante rotulo="Temperatura de B" valor={e.TB} onChange={(v) => atualizar({ TB: v })} min={0} max={100} passo={1} unidade="°C" marcas={[0, 50, 100]} />
          </>
        ) : (
          <>
            <ControleDeslizante rotulo="Massa de gelo" valor={e.mg} onChange={(v) => atualizar({ mg: v })} min={50} max={500} passo={10} unidade="g" marcas={[50, 250, 500]} />
            <ControleDeslizante rotulo="Temperatura do gelo" valor={e.Tg} onChange={(v) => atualizar({ Tg: v })} min={-30} max={0} passo={1} unidade="°C" marcas={[-30, -15, 0]} />
            <ControleDeslizante rotulo="Massa de água" valor={e.ma} onChange={(v) => atualizar({ ma: v })} min={50} max={600} passo={10} unidade="g" marcas={[50, 300, 600]} />
            <ControleDeslizante rotulo="Temperatura da água" valor={e.Ta} onChange={(v) => atualizar({ Ta: v })} min={5} max={100} passo={1} unidade="°C" marcas={[5, 50, 100]} />
          </>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: gás no pistão */

const INI_GAS: EstadoGas = { p: 2, V: 3, T: 300 }
const PADRAO_GAS = { tipo: 'isotermica', alvo: 6, s: 0, area: true }
const J_POR_ATM_L = 101.3

const NOME_PROC: Record<Transformacao, string> = {
  isotermica: 'Isotérmica (T constante)',
  isobarica: 'Isobárica (p constante)',
  isocorica: 'Isocórica (V constante)',
}

function TelaGas() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_GAS)
  const tipo: Transformacao = e.tipo === 'isobarica' ? 'isobarica' : e.tipo === 'isocorica' ? 'isocorica' : 'isotermica'
  const alvo = tipo === 'isocorica' ? Math.min(6, Math.max(0.5, e.alvo)) : Math.min(8, Math.max(1, e.alvo))
  const fim = estadoParcial(INI_GAS, tipo, alvo, 1)
  const agora = estadoParcial(INI_GAS, tipo, alvo, e.s)
  const anim = useAnimacao(e.s, 1, (v) => atualizar({ s: v }), 1 / 4)
  const completa = curvaPV(INI_GAS, tipo, alvo)
  const parcial = Array.from({ length: 41 }, (_, i) => {
    const st = estadoParcial(INI_GAS, tipo, alvo, (e.s * i) / 40)
    return { V: st.V, p: st.p }
  })
  const W = tipo === 'isobarica' ? trabalhoIsobarico(INI_GAS.p, INI_GAS.V, agora.V) : tipo === 'isotermica' ? trabalhoIsotermico(INI_GAS, agora.V) : 0
  const mudarTipo = (novo: Transformacao) => {
    anim.setRodando(false)
    atualizar({ tipo: novo, alvo: novo === 'isocorica' ? 4 : 6, s: 0 })
  }
  const mudarAlvo = (v: number) => {
    anim.setRodando(false)
    atualizar({ alvo: v, s: 0 })
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="grid items-center gap-3 sm:grid-cols-[150px_1fr]">
          <div className="mx-auto w-36 sm:w-full">
            <Pistao V={agora.V} p={agora.p} T={agora.T} Vmax={9} rotulo={`Pistão: ${fmt(agora.V)} litros, ${fmt(agora.p)} atmosferas, ${fmt(agora.T - 273, 0)} graus Celsius`} />
          </div>
          <DiagramaPV curva={parcial} curvaCompleta={completa} ini={INI_GAS} fim={fim} atual={agora} Vmax={9} pmax={6.5} area={e.area} rotulo="Diagrama p por V, com o ponto do estado atual" />
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            p = <strong>{fmt(agora.p)} atm</strong> · V = <strong>{fmt(agora.V)} L</strong> · T = <strong>{fmt(agora.T, 0)} K</strong> ({fmt(agora.T - 273, 0)} °C)
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            p·V/T = {fmt((agora.p * agora.V) / agora.T, 4)} atm·L/K (constante) · estado final: {fmt(fim.p)} atm, {fmt(fim.V)} L, {fmt(fim.T, 0)} K
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            Trabalho do gás até aqui: {fmt(W, 2)} atm·L ≈ {fmt(W * J_POR_ATM_L, 0)} J{tipo === 'isocorica' ? ' (volume constante: não há trabalho)' : tipo === 'isotermica' ? ' (ΔU = 0: todo o calor recebido vira trabalho)' : ''}. {W < 0 ? 'Negativo: o gás recebeu trabalho (compressão).' : ''}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Transformação</legend>
          {(['isotermica', 'isobarica', 'isocorica'] as const).map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="transformacao" checked={tipo === o} onChange={() => mudarTipo(o)} style={{ accentColor: 'var(--accent)' }} />
              {NOME_PROC[o]}
            </label>
          ))}
        </fieldset>
        {tipo === 'isocorica' ? (
          <ControleDeslizante rotulo="Pressão final" valor={alvo} onChange={mudarAlvo} min={0.5} max={6} passo={0.5} unidade="atm" marcas={[0.5, 2, 6]} />
        ) : (
          <ControleDeslizante rotulo="Volume final" valor={alvo} onChange={mudarAlvo} min={1} max={8} passo={0.5} unidade="L" marcas={[1, 3, 8]} />
        )}
        <ControleDeslizante rotulo="Andamento da transformação" valor={Math.round(e.s * 100)} onChange={(v) => atualizar({ s: v / 100 })} min={0} max={100} passo={1} unidade="%" marcas={[0, 50, 100]} />
        <PainelDeVisibilidade itens={[{ id: 'area', rotulo: 'Área (trabalho)', ativo: e.area }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Mover o êmbolo</legend>
          <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.05)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        </fieldset>
        <p className="text-sm text-[var(--ink-muted)]">
          Estado inicial fixo: 2 atm, 3 L e 27 °C (300 K). A cor do gás mostra a temperatura: quanto mais vermelho, mais quente.
        </p>
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

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaAquecimento /> },
        { id: 'explorar', conteudo: <TelaMistura /> },
        { id: 'lab', conteudo: <TelaGas /> },
      ]}
      desafios={DEFINICOES_TERMOLOGIA}
    />
  )
}
