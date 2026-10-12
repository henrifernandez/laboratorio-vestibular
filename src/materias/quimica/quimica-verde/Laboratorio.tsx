import { useId } from 'react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoLink } from '@/sim/BotaoLink'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { Formula } from '../comum/Formula'
import { massaMolar } from '../comum/elementos'
import { EscalaPh } from '../equilibrio-ph/Visuais'
import { BarrasEspecies, Equacao } from '../estequiometria/Visuais'
import { COMBUSTIVEIS, REACOES_VERDES, combustivel, co2PorGrama, economiaAtomica, fatorE, fluxos, massaDesejada, massaReagentes, phChuva, reacaoVerde, solAbsorvido, temperaturaSuperficie } from './calculo'
import { DEFINICOES_VERDE } from './definicoes'
import { equacaoVerde } from './geradores'
import { DiagramaEstufa } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: efeito estufa */

const PADRAO_ESTUFA = { eps: 0.78, alb: 0.3 }

function TelaEstufa() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ESTUFA)
  const fl = fluxos(e.alb, e.eps)
  const semAtmosfera = temperaturaSuperficie(e.alb, 0)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao p-3">
          <DiagramaEstufa albedo={e.alb} eps={e.eps} />
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0 text-lg">
            Temperatura da superfície: <strong>{fmt(fl.T, 0)} K ({fmt(fl.T - 273.15, 1)} °C)</strong>
          </p>
          <p className="m-0">
            Sem atmosfera seria {fmt(semAtmosfera, 0)} K ({fmt(semAtmosfera - 273.15, 1)} °C). O efeito estufa acrescenta <strong>{fmt(fl.T - semAtmosfera, 0)} °C</strong>.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Sol absorvido: {fmt(solAbsorvido(e.alb), 0)} W/m². Em equilíbrio, tudo o que entra sai ({fmt(fl.escapa, 0)} W/m² vão para o espaço), mas a superfície emite {fmt(fl.superficie, 0)} W/m² porque recebe também {fmt(fl.contra, 0)} W/m² devolvidos pela atmosfera.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Modelo didático de uma camada: serve para ver o sentido do efeito (mais gases, superfície mais quente), e não para prever valores reais do clima.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Fração do infravermelho absorvida pela atmosfera (ε)" valor={e.eps} onChange={(v) => atualizar({ eps: v })} min={0} max={0.95} passo={0.01} marcas={[0, 0.5, 0.95]} />
        <ControleDeslizante rotulo="Albedo (fração do Sol refletida)" valor={e.alb} onChange={(v) => atualizar({ alb: v })} min={0.1} max={0.5} passo={0.01} marcas={[0.1, 0.3, 0.5]} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Exemplos">
          <button type="button" className="btn" onClick={() => atualizar({ eps: 0 })}>
            Sem atmosfera
          </button>
          <button type="button" className="btn" onClick={() => atualizar({ eps: 0.78, alb: 0.3 })}>
            Terra atual
          </button>
          <button type="button" className="btn" onClick={() => atualizar({ eps: 0.85 })}>
            Mais gases estufa
          </button>
        </div>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Com ε ≈ 0,78 e albedo 0,3 o modelo reproduz os cerca de 15 °C da Terra. Aumentar ε representa mais CO₂, CH₄ e N₂O na atmosfera.</p>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: chuva ácida */

const ACIDOS = [0, 1e-6, 3e-6, 1e-5, 3e-5, 1e-4, 3e-4, 1e-3]
const PADRAO_CHUVA = { i: 0 }

function TelaChuva() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CHUVA)
  const i = Math.min(ACIDOS.length - 1, Math.max(0, Math.round(e.i)))
  const c = ACIDOS[i] as number
  const ph = phChuva(c)
  const natural = phChuva(0)
  const fator = 10 ** (natural - ph)
  const caco3 = (c / 2) * 100 * 1000 // mg de CaCO₃ por litro (2 H⁺ por CaCO₃)
  const classe = ph < 5.6 - 0.005 ? 'chuva ácida (pH abaixo de 5,6)' : 'chuva natural (pH ≈ 5,6)'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <EscalaPh marcadores={[{ ph: 5.6, rotulo: 'natural' }, { ph: 7, rotulo: 'pura' }]} destaque={ph} />
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0 text-lg">
            pH = <strong>{fmt(ph, 2)}</strong> · {classe}
          </p>
          <p className="m-0">
            [H⁺] é <strong>{fmt(fator, 1)} vezes</strong> a da chuva natural (pH 5,6).
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Cada litro dessa chuva pode dissolver até {fmt(caco3, 1)} mg de calcário ou mármore (CaCO₃ + 2 H⁺ → Ca²⁺ + H₂O + CO₂), por isso estátuas e fachadas se desgastam.
          </p>
        </div>
        <div className="cartao grid gap-1 p-3 text-sm">
          <strong>De onde vêm os ácidos</strong>
          <p className="num m-0">S + O₂ → SO₂ · 2 SO₂ + O₂ → 2 SO₃ · SO₃ + H₂O → H₂SO₄</p>
          <p className="num m-0">N₂ + O₂ → 2 NO (motores) · 2 NO + O₂ → 2 NO₂ · NO₂ + água → HNO₃ (e outros produtos)</p>
          <p className="m-0 text-[var(--ink-muted)]">CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻ explica o pH natural de 5,6.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo={`Ácido forte dissolvido (H⁺ de H₂SO₄ e HNO₃): ${c === 0 ? 'nenhum' : `${fmt(c * 1e6, 0)} × 10⁻⁶ mol/L`}`} valor={i} onChange={(v) => atualizar({ i: v })} min={0} max={ACIDOS.length - 1} passo={1} marcas={[0, 4, 7]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">O modelo soma o CO₂ dissolvido (pH 5,6) ao ácido forte vindo de SO₂ e NOₓ. Os valores são ilustrativos.</p>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: combustíveis e economia de átomos */

const PADRAO_VERDE = { comb: 'etanol', mj: 100, rx: 'esterificacao', eta: 100 }

function TelaCombustiveis() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_VERDE)
  const idComb = useId()
  const idRx = useId()
  const c = COMBUSTIVEIS.find((x) => x.id === e.comb) ?? combustivel('etanol')
  const kJporG = c.entalpia / massaMolar(c.formula)
  const massa = (e.mj * 1000) / kJporG // g
  const co2 = massa * co2PorGrama(c)
  const r = REACOES_VERDES.find((x) => x.id === e.rx) ?? reacaoVerde('esterificacao')
  const eta = e.eta / 100
  const R = massaReagentes(r)
  const P = massaDesejada(r)
  const todas = [...r.reagentes, ...r.produtos]
  const desejado = todas[r.desejado] as string
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <h3 className="m-0 text-base">Para gerar a mesma energia ({fmt(e.mj, 0)} MJ)</h3>
          <BarrasEspecies
            titulo="Massa de CO₂ emitida por cada combustível, em kg"
            itens={COMBUSTIVEIS.map((x) => {
              const g = (e.mj * 1000) / (x.entalpia / massaMolar(x.formula))
              const kg = (g * co2PorGrama(x)) / 1000
              return { rotulo: <Formula f={x.formula} />, nome: x.nome, valor: kg, texto: `${fmt(kg, 1)} kg`, cor: x.id === c.id ? 'var(--accent)' : 'var(--line-strong)' }
            })}
          />
          <p className="num m-0 text-sm" aria-live="polite">
            {fmt(e.mj, 0)} MJ pedem {fmt(massa / 1000, 2)} kg de {c.nome.split(' (')[0]} (cada kg libera {fmt(kJporG, 1)} MJ) e emitem <strong>{fmt(co2 / 1000, 2)} kg de CO₂</strong>, ou {fmt(co2 / e.mj, 1)} g por MJ.
          </p>
        </div>
        <div className="cartao grid gap-2 p-3">
          <h3 className="m-0 text-base">Economia de átomos</h3>
          <Equacao r={r} destaque={{ [r.desejado]: 'pedido' }} />
          <BarrasEspecies
            titulo="Destino da massa dos reagentes, em gramas"
            max={R}
            itens={[
              { rotulo: 'Reagentes', nome: 'Massa dos reagentes', valor: R, texto: `${fmt(R, 1)} g`, cor: 'var(--line-strong)' },
              { rotulo: 'Desejado', nome: 'Produto desejado, teórico', valor: P, texto: `${fmt(P, 1)} g`, cor: 'var(--ok)' },
              { rotulo: 'Obtido', nome: 'Produto desejado obtido', valor: P * eta, texto: `${fmt(P * eta, 1)} g`, cor: 'var(--accent)' },
              { rotulo: 'Resíduo', nome: 'Resíduos', valor: R - P * eta, texto: `${fmt(R - P * eta, 1)} g`, cor: 'var(--erro)' },
            ]}
          />
          <p className="num m-0 text-sm" aria-live="polite">
            Economia atômica = {fmt(P, 1)} ÷ {fmt(R, 1)} × 100 = <strong>{fmt(economiaAtomica(r), 1)} %</strong> · Fator E = {fmt(R - P * eta, 1)} ÷ {fmt(P * eta, 1)} = <strong>{fmt(fatorE(r, eta), 2)}</strong>
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <div className="grid gap-1">
          <label htmlFor={idComb} className="font-semibold">
            Combustível em destaque
          </label>
          <select id={idComb} value={c.id} onChange={(ev) => atualizar({ comb: ev.target.value })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3">
            {COMBUSTIVEIS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </div>
        <ControleDeslizante rotulo="Energia necessária" valor={e.mj} onChange={(v) => atualizar({ mj: v })} min={10} max={500} passo={10} unidade="MJ" marcas={[10, 250, 500]} />
        <div className="grid gap-1">
          <label htmlFor={idRx} className="font-semibold">
            Reação (produto desejado em destaque)
          </label>
          <select id={idRx} value={r.id} onChange={(ev) => atualizar({ rx: ev.target.value })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3">
            {REACOES_VERDES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </div>
        <ControleDeslizante rotulo={`Rendimento de ${desejado.replace(/\d/g, '')}`} valor={e.eta} onChange={(v) => atualizar({ eta: v })} min={10} max={100} passo={5} unidade="%" marcas={[10, 55, 100]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">{equacaoVerde(r)}. Entalpias de combustão de tabela, arredondadas. Rendimento menor aumenta o fator E.</p>
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
        { id: 'intro', conteudo: <TelaEstufa /> },
        { id: 'explorar', conteudo: <TelaChuva /> },
        { id: 'lab', conteudo: <TelaCombustiveis /> },
      ]}
      desafios={DEFINICOES_VERDE}
    />
  )
}
