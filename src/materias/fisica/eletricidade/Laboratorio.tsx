import { useEffect, useRef, useState } from 'react'
import { Line, Plot, Point, Text } from 'mafs'
import { Link2 } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { consumoMensal, custo, energiaKWh, montar, queimar, req, resolver, type Aparelho, type Topologia } from './calculo'
import { DEFINICOES_ELETRICIDADE } from './definicoes'
import { BarrasHor, Circuito, CircuitoSimples } from './Visuais'

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

/* ------------------------------------------------------------------ Introdução: lei de Ohm */

const PADRAO_OHM = { V: 12, R: 20, grafico: true }

function TelaOhm() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_OHM)
  const i = e.V / e.R
  const P = e.V * i
  const [fase, setFase] = useState(0)
  const iRef = useRef(i)
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 60, (dt) => setFase((f) => (f + dt * iRef.current * 0.2) % 1))
  useEffect(() => {
    iRef.current = i
  })
  const imax = 24 / 5
  const Pmax = 24 * (24 / 5)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <CircuitoSimples V={e.V} R={e.R} fase={fase} brilho={Math.min(1, P / (Pmax / 4))} />
        {e.grafico && (
          <Cena janela={{ xmin: -0.3, xmax: imax + 0.3, ymin: -2, ymax: 28 }} passoX={1} passoY={4} rotulo="Gráfico da tensão em função da corrente: a inclinação é a resistência">
            <Plot.OfX y={(x) => e.R * x} domain={[0, imax]} color="var(--accent)" weight={3} />
            <Line.Segment point1={[i, 0]} point2={[i, e.V]} color="var(--ink-muted)" style="dashed" weight={1.5} />
            <Line.Segment point1={[0, e.V]} point2={[i, e.V]} color="var(--ink-muted)" style="dashed" weight={1.5} />
            <Point x={i} y={e.V} color="var(--erro)" />
            <Text x={imax} y={-1} attach="nw" size={12} color="var(--ink-muted)">i (A)</Text>
            <Text x={0} y={27} attach="e" attachDistance={8} size={12} color="var(--ink-muted)">V (V)</Text>
          </Cena>
        )}
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            i = V/R = {fmt(e.V)}/{fmt(e.R)} = <strong>{fmt(i)} A</strong> ({fmt(i * 1000, 0)} mA)
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            P = V·i = <strong>{fmt(P)} W</strong> (também R·i² = {fmt(e.R * i * i)} W e V²/R = {fmt((e.V * e.V) / e.R)} W). No gráfico, a reta tem inclinação R = {fmt(e.R)} Ω.
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Tensão da fonte (V)" valor={e.V} onChange={(v) => atualizar({ V: v })} min={0} max={24} passo={1} unidade="V" marcas={[0, 12, 24]} />
        <ControleDeslizante rotulo="Resistência da lâmpada (R)" valor={e.R} onChange={(v) => atualizar({ R: v })} min={5} max={100} passo={5} unidade="Ω" marcas={[5, 50, 100]} />
        <PainelDeVisibilidade itens={[{ id: 'grafico', rotulo: 'Gráfico V × i', ativo: e.grafico }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Mover as cargas</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={() => setRodando(!rodando)}
            onPasso={() => {
              setFase((f) => (f + 0.04) % 1)
              passoUnico()
            }}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
          <p className="text-sm text-[var(--ink-muted)]">As cargas andam mais depressa quando a corrente é maior.</p>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              setRodando(false)
              reiniciar()
            }}
          />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: série × paralelo */

const PADRAO_ASS = { topo: 'serie', V: 12, r1: 20, r2: 20, r3: 20, q1: false, q2: false, q3: false }
const NOME_TOPO: Record<string, string> = { serie: 'Série', paralelo: 'Paralelo', misto: 'Misto (L1 em série com L2 ∥ L3)' }

function TelaAssociacao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ASS)
  const topologia: Topologia = e.topo === 'paralelo' ? 'paralelo' : e.topo === 'misto' ? 'misto' : 'serie'
  const rs = [e.r1, e.r2, e.r3]
  const abertas = [e.q1, e.q2, e.q3].flatMap((q, k) => (q ? [k] : []))
  let no = montar(topologia, rs)
  for (const k of abertas) no = queimar(no, k)
  const fs = resolver(no, e.V)
  const Pref = Math.max(...rs.map((r) => (e.V * e.V) / r))
  const estados = fs.map((x, k) => ({ brilho: abertas.includes(k) ? 0 : Math.min(1, x.P / Pref), texto: abertas.includes(k) ? 'queimada' : `${fmt(x.P, 1)} W` }))
  const Req = req(no)
  const todasApagadas = fs.every((x) => x.P < 1e-9)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Circuito topologia={topologia} rs={rs} V={e.V} modo="lampada" estados={estados} abertas={abertas} rotulo={`Circuito com três lâmpadas em ${NOME_TOPO[topologia]}, ligadas a ${e.V} volts`} />
        <BarrasHor
          rotulo="Potência de cada lâmpada"
          itens={fs.map((x, k) => ({ rotulo: `Lâmpada ${k + 1}`, valor: x.P, texto: `${fmt(x.P, 1)} W`, cor: abertas.includes(k) ? 'var(--line-strong)' : 'var(--aviso)' }))}
          max={Pref}
        />
        <div className="overflow-x-auto">
          <table className="num w-full border-collapse text-sm">
            <caption className="pb-1 text-left text-[var(--ink-muted)]">Tensão, corrente e potência em cada lâmpada</caption>
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-left">
                <th className="py-1 pr-2 font-semibold">Lâmpada</th>
                <th className="py-1 pr-2 font-semibold">R</th>
                <th className="py-1 pr-2 font-semibold">V</th>
                <th className="py-1 pr-2 font-semibold">i</th>
                <th className="py-1 font-semibold">P</th>
              </tr>
            </thead>
            <tbody>
              {fs.map((x, k) => (
                <tr key={k} className="border-b border-[var(--line)]">
                  <td className="py-1 pr-2">L{k + 1}</td>
                  <td className="py-1 pr-2">{fmt(rs[k] as number)} Ω</td>
                  <td className="py-1 pr-2">{fmt(x.V)} V</td>
                  <td className="py-1 pr-2">{fmt(x.i)} A</td>
                  <td className="py-1">{fmt(x.P)} W</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>{Number.isFinite(Req) ? <>R equivalente = <strong>{fmt(Req)} Ω</strong> · corrente da bateria = <strong>{fmt(e.V / Req)} A</strong></> : <>Circuito aberto: nenhuma corrente passa pela bateria.</>}</p>
          <p className="text-sm text-[var(--ink-muted)]">
            {todasApagadas
              ? 'Em série (ou na parte em série), a lâmpada queimada interrompe o único caminho: tudo apaga.'
              : topologia === 'serie'
                ? 'Em série: a mesma corrente em todas; brilha mais a de maior resistência.'
                : topologia === 'paralelo'
                  ? 'Em paralelo: a mesma tensão em todas; brilha mais a de menor resistência. Queimar uma não muda as outras.'
                  : 'Misto: queimar L2 ou L3 deixa L1 mais fraca e a outra mais forte.'}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Montagem</legend>
          {(['serie', 'paralelo', 'misto'] as const).map((o) => (
            <label key={o} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="montagem-ele" checked={topologia === o} onChange={() => atualizar({ topo: o })} style={{ accentColor: 'var(--accent)' }} />
              {NOME_TOPO[o]}
            </label>
          ))}
        </fieldset>
        <ControleDeslizante rotulo="Tensão da bateria" valor={e.V} onChange={(v) => atualizar({ V: v })} min={3} max={24} passo={1} unidade="V" marcas={[3, 12, 24]} />
        <ControleDeslizante rotulo="Resistência da lâmpada 1" valor={e.r1} onChange={(v) => atualizar({ r1: v })} min={10} max={60} passo={5} unidade="Ω" marcas={[10, 35, 60]} />
        <ControleDeslizante rotulo="Resistência da lâmpada 2" valor={e.r2} onChange={(v) => atualizar({ r2: v })} min={10} max={60} passo={5} unidade="Ω" marcas={[10, 35, 60]} />
        <ControleDeslizante rotulo="Resistência da lâmpada 3" valor={e.r3} onChange={(v) => atualizar({ r3: v })} min={10} max={60} passo={5} unidade="Ω" marcas={[10, 35, 60]} />
        <PainelDeVisibilidade
          titulo="Queimar lâmpadas"
          itens={[
            { id: 'q1', rotulo: 'Lâmpada 1', ativo: e.q1 },
            { id: 'q2', rotulo: 'Lâmpada 2', ativo: e.q2 },
            { id: 'q3', rotulo: 'Lâmpada 3', ativo: e.q3 },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: conta de luz */

const CASA: (Aparelho & { id: string; max: number })[] = [
  { id: 'a0', nome: 'Chuveiro', W: 4400, h: 0.5, max: 2 },
  { id: 'a1', nome: 'Geladeira', W: 200, h: 10, max: 24 },
  { id: 'a2', nome: 'Ferro de passar', W: 1000, h: 1, max: 4 },
  { id: 'a3', nome: '10 lâmpadas LED', W: 100, h: 5, max: 12 },
  { id: 'a4', nome: 'Televisão', W: 100, h: 4, max: 12 },
  { id: 'a5', nome: 'Ar-condicionado', W: 1500, h: 0, max: 12 },
  { id: 'a6', nome: 'Micro-ondas', W: 1200, h: 0.3, max: 3 },
]
const PADRAO_CONTA: Record<string, number> = { tar: 0.8, ...Object.fromEntries(CASA.map((a) => [a.id, a.h])) }

function TelaConta() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CONTA)
  const aparelhos = CASA.map((a) => ({ ...a, h: e[a.id] as number }))
  const kwh = aparelhos.map((a) => energiaKWh(a.W, a.h * 30))
  const total = consumoMensal(aparelhos, 30)
  const reais = custo(total, e.tar as number)
  const maior = kwh.indexOf(Math.max(...kwh))
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <BarrasHor rotulo="Consumo mensal de cada aparelho em quilowatts-hora" itens={aparelhos.map((a, k) => ({ rotulo: a.nome, valor: kwh[k] as number, texto: `${fmt(kwh[k] as number, 1)} kWh · R$ ${fmt(custo(kwh[k] as number, e.tar as number))}`, cor: k === maior ? 'var(--accent)' : 'var(--line-strong)' }))} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            Total: <strong>{fmt(total, 1)} kWh</strong> no mês → <strong>R$ {fmt(reais)}</strong>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            Quem mais pesa: {aparelhos[maior]!.nome} ({fmt(((kwh[maior] as number) / Math.max(total, 1e-9)) * 100, 0)} % do consumo). E = P·Δt: cada kWh custa R$ {fmt(e.tar as number)}.
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            Um banho de {fmt(aparelhos[0]!.h * 60, 0)} min por dia custa R$ {fmt(custo(kwh[0] as number, e.tar as number))} no mês. Cada 5 minutos a menos economiza R$ {fmt(custo(energiaKWh(aparelhos[0]!.W, (5 / 60) * 30), e.tar as number))}.
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Tarifa" valor={e.tar as number} onChange={(v) => atualizar({ tar: v })} min={0.4} max={1.2} passo={0.05} unidade="R$/kWh" marcas={[0.4, 0.8, 1.2]} />
        {CASA.map((a) => (
          <ControleDeslizante key={a.id} rotulo={`${a.nome} (${fmt(a.W, 0)} W): horas por dia`} valor={e[a.id] as number} onChange={(v) => atualizar({ [a.id]: v })} min={0} max={a.max} passo={a.max <= 4 ? 0.1 : 0.5} unidade="h" marcas={[0, a.max]} />
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
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
        { id: 'intro', conteudo: <TelaOhm /> },
        { id: 'explorar', conteudo: <TelaAssociacao /> },
        { id: 'lab', conteudo: <TelaConta /> },
      ]}
      desafios={DEFINICOES_ELETRICIDADE}
    />
  )
}
