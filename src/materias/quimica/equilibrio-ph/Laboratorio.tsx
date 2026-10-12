import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoLink } from '@/sim/BotaoLink'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { useAnimacao } from '@/sim/useAnimacao'
import { Bequer } from '../comum/Bequer'
import { Formula } from '../comum/Formula'
import { BarrasEspecies } from '../estequiometria/Visuais'
import { equilibrioN2O4, hDePh, kcN2O4, phAcidoForte, phTitulacao, volumeEquivalencia } from './calculo'
import { DEFINICOES_EQUILIBRIO } from './definicoes'
import { corDePh, CurvaTitulacao, EscalaPh } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const sci = (x: number) => {
  if (x === 0) return '0'
  const e = Math.floor(Math.log10(x))
  const m = x / 10 ** e
  return `${fmt(m, 2)} × 10${String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)] as string)}`
}

/* ------------------------------------------------------------------ Introdução: escala de pH e diluição */

const PADRAO_ESCALA = { ph: 7, ph0: 2, n: 0 }
const COTIDIANO = [
  { ph: 2, rotulo: 'limão' },
  { ph: 3, rotulo: 'vinagre' },
  { ph: 5, rotulo: 'café' },
  { ph: 5.6, rotulo: 'chuva' },
  { ph: 7, rotulo: 'água pura' },
  { ph: 7.4, rotulo: 'sangue' },
  { ph: 8.3, rotulo: 'bicarbonato' },
  { ph: 10.5, rotulo: 'leite de magnésia' },
  { ph: 12, rotulo: 'água sanitária' },
]

function TelaEscala() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ESCALA)
  const h = hDePh(e.ph)
  const oh = 1e-14 / h
  const tipo = Math.abs(e.ph - 7) < 0.05 ? 'neutra' : e.ph < 7 ? 'ácida' : 'básica'
  const c0 = 10 ** -e.ph0
  const cf = c0 / 10 ** e.n
  const phExato = phAcidoForte(cf)
  const phIngenuo = e.ph0 + e.n
  const maisProximo = [...COTIDIANO].sort((a, b) => Math.abs(a.ph - e.ph) - Math.abs(b.ph - e.ph))[0] as (typeof COTIDIANO)[number]
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid grid-cols-[auto_1fr] items-center gap-4 p-3">
          <Bequer volume={600} vmax={800} intensidade={0.95} cor={corDePh(e.ph)} descricao={`Béquer com solução de pH ${fmt(e.ph, 1)}, cor do indicador universal`} largura={92} />
          <div className="num grid gap-0.5" aria-live="polite">
            <p className="m-0 text-xl">
              pH = <strong>{fmt(e.ph, 1)}</strong> <span className="text-base text-[var(--ink-muted)]">({tipo})</span>
            </p>
            <p className="m-0">[H⁺] = <strong>{sci(h)}</strong> mol/L</p>
            <p className="m-0">[OH⁻] = {sci(oh)} mol/L</p>
            <p className="m-0 text-sm text-[var(--ink-muted)]">pOH = {fmt(14 - e.ph, 1)} · mais parecido com: {maisProximo.rotulo}</p>
          </div>
        </div>
        <div className="cartao p-3">
          <EscalaPh marcadores={COTIDIANO} destaque={e.ph} />
          <p className="m-0 mt-1 text-center text-sm text-[var(--ink-muted)]">Valores aproximados para o cotidiano. Cada unidade é um fator 10 em [H⁺].</p>
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0 font-semibold">Diluindo um ácido forte</p>
          <p className="m-0">
            Início: [H⁺] = 10<sup>−{e.ph0}</sup> mol/L (pH {e.ph0}). Diluído {fmt(10 ** e.n, 0)} vezes: [H⁺] da solução = {sci(cf)} mol/L.
          </p>
          <p className="m-0">
            pH calculado contando a água: <strong>{fmt(phExato, 2)}</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Sem contar a água, a conta ingênua daria pH {fmt(phIngenuo, 0)}{phIngenuo > 7 ? ', que seria um ácido com pH acima de 7: impossível' : ''}. Só que a água fornece 10⁻⁷ mol/L de H⁺, então o pH se aproxima de 7 por baixo e nunca passa dele.
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="pH da solução" valor={e.ph} onChange={(v) => atualizar({ ph: v })} min={0} max={14} passo={0.1} marcas={[0, 7, 14]} />
        <fieldset className="m-0 grid gap-3 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Diluir um ácido forte</legend>
          <ControleDeslizante rotulo="pH inicial" valor={e.ph0} onChange={(v) => atualizar({ ph0: v })} min={0} max={6} passo={1} marcas={[0, 3, 6]} />
          <ControleDeslizante rotulo="Diluição (10 elevado a n)" valor={e.n} onChange={(v) => atualizar({ n: v })} min={0} max={9} passo={1} unidade="n" marcas={[0, 4, 9]} />
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: N2O4 ⇌ 2 NO2 */

const PADRAO_LC = { T: 298, V: 1, da: 0, db: 0, t: 1 }
const T0 = 298
const C0 = 0.1

function TelaChatelier() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LC)
  const anim = useAnimacao(e.t, 1, (v) => atualizar({ t: v }), 0.2)
  const K0 = kcN2O4(T0)
  const eq0 = equilibrioN2O4(C0, K0)
  // mols no recipiente de 1 L antes da perturbação
  const nN = eq0.n2o4
  const nO = eq0.no2
  const mN = nN + e.da / 1000
  const mO = nO + e.db / 1000
  const aposN = mN / e.V
  const aposO = mO / e.V
  const K = kcN2O4(e.T)
  const Q = (aposO * aposO) / aposN
  const c0n = aposN + aposO / 2
  const eq1 = equilibrioN2O4(c0n, K)
  const sentido = Math.abs(Q - K) / K < 1e-3 ? 'nenhum' : Q < K ? 'direta' : 'inversa'
  const T = e.t
  const relax = 1 - Math.exp(-5 * T)
  const atualN = aposN + (eq1.n2o4 - aposN) * relax
  const atualO = aposO + (eq1.no2 - aposO) * relax
  const maxC = Math.max(0.2, aposN, aposO, eq1.n2o4, eq1.no2, eq0.n2o4 * 1.2)
  const mudou = e.T !== T0 || e.V !== 1 || e.da > 0 || e.db > 0
  // curvas: de t = 0 a 1
  const W = 340
  const H = 150
  const X = (t: number) => 36 + t * 290
  const Y = (c: number) => 124 - (c / maxC) * 104
  const curva = (c1: number, c2: number) => Array.from({ length: 51 }, (_, i) => `${X(i / 50)},${Y(c1 + (c2 - c1) * (1 - Math.exp(-5 * (i / 50))))}`).join(' ')
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <p className="num m-0 text-center text-lg">
            <Formula f="N2O4" />(g) <span aria-hidden="true">⇌</span> 2 <Formula f="NO2" />(g) <span className="text-sm text-[var(--ink-muted)]">ΔH &gt; 0</span>
          </p>
          <div className="flex flex-wrap items-end justify-center gap-6">
            <figure className="m-0 grid justify-items-center gap-0.5 text-center text-sm">
              <Bequer volume={e.V * 1000} vmax={2200} intensidade={Math.min(1, atualO / 0.15)} cor="var(--quim-no2)" descricao={`Recipiente com gás: [NO₂] = ${fmt(atualO, 3)} mol/L. O NO₂ é marrom e o N₂O₄ é incolor.`} largura={100} />
              <figcaption>
                <strong>O gás agora</strong>
                <span className="block text-[var(--ink-muted)]">quanto mais marrom, mais NO₂</span>
              </figcaption>
            </figure>
            <div className="grid gap-1 text-sm">
              <p className="num m-0">K = {fmt(K, 4)} · Q (logo após) = {fmt(Q, 4)}</p>
              <p className="m-0 font-semibold" aria-live="polite">
                {!mudou ? 'Sem perturbação: o sistema está em equilíbrio (Q = K).' : sentido === 'direta' ? 'Q < K: o sistema reage para a direita (mais NO₂).' : sentido === 'inversa' ? 'Q > K: o sistema reage para a esquerda (mais N₂O₄).' : 'Q = K: nada se desloca.'}
              </p>
            </div>
          </div>
        </div>
        <div className="cartao grid gap-2 p-3">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Concentrações de N₂O₄ e NO₂ em função do tempo depois da perturbação, tendendo ao novo equilíbrio" className="mx-auto block w-full max-w-lg">
            <line x1={36} x2={36} y1={14} y2={124} stroke="var(--ink-muted)" strokeWidth={1.5} />
            <line x1={36} x2={326} y1={124} y2={124} stroke="var(--ink-muted)" strokeWidth={1.5} />
            <polyline points={curva(aposN, eq1.n2o4)} fill="none" stroke="var(--accent)" strokeWidth={3} />
            <polyline points={curva(aposO, eq1.no2)} fill="none" stroke="var(--quim-no2)" strokeWidth={3} />
            <line x1={X(T)} x2={X(T)} y1={14} y2={124} stroke="var(--ink-muted)" strokeDasharray="3 3" strokeWidth={1.2} />
            <circle cx={X(T)} cy={Y(atualN)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            <circle cx={X(T)} cy={Y(atualO)} r={5} fill="var(--quim-no2)" stroke="var(--surface)" strokeWidth={2} />
            <text x={330} y={Y(eq1.n2o4) - 5} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--accent)">N₂O₄</text>
            <text x={330} y={Y(eq1.no2) + 15} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--quim-no2)">NO₂</text>
            <text x={326} y={142} textAnchor="end" fontSize={11} fill="var(--ink-muted)">tempo depois da perturbação</text>
            <text x={4} y={10} fontSize={11} fill="var(--ink-muted)">mol/L</text>
          </svg>
          <BarrasEspecies
            titulo="Concentrações em três momentos"
            max={maxC}
            itens={[
              { rotulo: 'N₂O₄ (antes)', nome: 'N₂O₄ no equilíbrio inicial', valor: eq0.n2o4, texto: fmt(eq0.n2o4, 3), cor: 'var(--line-strong)' },
              { rotulo: 'N₂O₄ (agora)', nome: 'N₂O₄ agora', valor: atualN, texto: fmt(atualN, 3) },
              { rotulo: 'NO₂ (antes)', nome: 'NO₂ no equilíbrio inicial', valor: eq0.no2, texto: fmt(eq0.no2, 3), cor: 'var(--line-strong)' },
              { rotulo: 'NO₂ (agora)', nome: 'NO₂ agora', valor: atualO, texto: fmt(atualO, 3), cor: 'var(--quim-no2)' },
            ]}
          />
          <p className="m-0 text-sm text-[var(--ink-muted)]">Modelo didático (Kc ≈ 0,006 a 298 K, ΔH = +57 kJ/mol): o formato da curva é uma ilustração; a velocidade real depende das velocidades das reações.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Temperatura" valor={e.T} onChange={(v) => atualizar({ T: v })} min={250} max={400} passo={5} unidade="K" marcas={[250, 298, 400]} />
        <ControleDeslizante rotulo="Volume do recipiente" valor={e.V} onChange={(v) => atualizar({ V: v })} min={0.5} max={2} passo={0.1} unidade="L" marcas={[0.5, 1, 2]} />
        <ControleDeslizante rotulo="Acrescentar N₂O₄" valor={e.da} onChange={(v) => atualizar({ da: v })} min={0} max={100} passo={5} unidade="mmol" marcas={[0, 50, 100]} />
        <ControleDeslizante rotulo="Acrescentar NO₂" valor={e.db} onChange={(v) => atualizar({ db: v })} min={0} max={100} passo={5} unidade="mmol" marcas={[0, 50, 100]} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Ver o sistema reagir</legend>
          <ControleDeslizante rotulo="Tempo depois da perturbação" valor={e.t} onChange={(v) => atualizar({ t: v })} min={0} max={1} passo={0.05} marcas={[0, 1]} />
          <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.05)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        </fieldset>
        <p className="text-sm text-[var(--ink-muted)]">Experimente: aquecer (reação direta endotérmica) escurece o gás; comprimir (volume menor) favorece o lado com menos mols de gás, o N₂O₄.</p>
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

/* ------------------------------------------------------------------ Laboratório: titulação */

const INDICADORES: Record<string, { nome: string; faixa: [number, number]; baixa: string; alta: string; nomeBaixa: string; nomeAlta: string }> = {
  fenolftaleina: { nome: 'Fenolftaleína', faixa: [8.2, 10], baixa: '#cfe3ee', alta: '#e0449a', nomeBaixa: 'incolor', nomeAlta: 'rosa' },
  bromotimol: { nome: 'Azul de bromotimol', faixa: [6, 7.6], baixa: '#e8c840', alta: '#3b6fd4', nomeBaixa: 'amarelo', nomeAlta: 'azul' },
  metila: { nome: 'Alaranjado de metila', faixa: [3.1, 4.4], baixa: '#d6392f', alta: '#e8c840', nomeBaixa: 'vermelho', nomeAlta: 'amarelo' },
  universal: { nome: 'Indicador universal', faixa: [0, 14], baixa: '#d6392f', alta: '#7a4cc7', nomeBaixa: '', nomeAlta: '' },
}

function corIndicador(id: string, ph: number): string {
  if (id === 'universal') return corDePh(ph)
  const i = INDICADORES[id] as (typeof INDICADORES)[string]
  const p = Math.min(1, Math.max(0, (ph - i.faixa[0]) / (i.faixa[1] - i.faixa[0])))
  return p <= 0 ? i.baixa : p >= 1 ? i.alta : `color-mix(in srgb, ${i.alta} ${Math.round(p * 100)}%, ${i.baixa})`
}

const PADRAO_TIT = { ca: 0.1, va: 25, cb: 0.1, fraco: false, vb: 0, ind: 'fenolftaleina' }
const KA_ACETICO = 1.8e-5

function TelaTitulacao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_TIT)
  const t = { ca: e.ca, va: e.va, ka: e.fraco ? KA_ACETICO : null, cb: e.cb }
  const veq = volumeEquivalencia(t)
  const vbmax = Math.min(150, Math.max(10, Math.ceil((veq * 2) / 5) * 5))
  const vb = Math.min(e.vb, vbmax)
  const phAtual = phTitulacao(t, vb)
  const ind = INDICADORES[e.ind] ?? (INDICADORES.fenolftaleina as (typeof INDICADORES)[string])
  const phEq = phTitulacao(t, veq)
  const phSaltoBaixo = phTitulacao(t, veq * 0.999)
  const phSaltoAlto = phTitulacao(t, veq * 1.001)
  const meio = (ind.faixa[0] + ind.faixa[1]) / 2
  const serve = e.ind !== 'universal' && meio >= phSaltoBaixo && meio <= phSaltoAlto
  const nome = e.fraco ? 'ácido acético' : 'HCl'
  const posicao = vb < veq - 1e-9 ? 'antes do' : Math.abs(vb - veq) < 1e-9 ? 'no' : 'depois do'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <CurvaTitulacao t={t} vb={vb} faixa={e.ind === 'universal' ? undefined : ind.faixa} rotuloFaixa={e.ind === 'universal' ? undefined : `faixa de viragem: ${ind.nome}`} />
        </div>
        <div className="cartao grid grid-cols-[auto_1fr] items-center gap-4 p-3">
          <Bequer volume={e.va + vb} vmax={e.va + vbmax + 10} intensidade={1} cor={corIndicador(e.ind, phAtual)} descricao={`Frasco com ${ind.nome}: cor para pH ${fmt(phAtual, 1)}`} largura={92} />
          <div className="num grid gap-0.5 text-sm" aria-live="polite">
            <p className="m-0 text-base">
              pH = <strong>{fmt(phAtual, 2)}</strong>
            </p>
            <p className="m-0">Base adicionada: {fmt(vb)} mL ({posicao} ponto de equivalência)</p>
            <p className="m-0 text-[var(--ink-muted)]">
              {e.ind === 'universal' ? 'A cor segue a escala de pH.' : phAtual < ind.faixa[0] ? `Cor: ${ind.nomeBaixa}.` : phAtual > ind.faixa[1] ? `Cor: ${ind.nomeAlta}.` : 'Cor: em transição.'}
            </p>
          </div>
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0">
            Equivalência: {fmt(e.ca)} × {fmt(e.va)} = {fmt(e.cb)} × V → V = <strong>{fmt(veq)} mL</strong>, com pH <strong>{fmt(phEq, 2)}</strong>.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {e.ind === 'universal'
              ? 'O indicador universal muda de cor em toda a faixa de pH; os indicadores específicos mudam só numa faixa.'
              : `${ind.nome} vira em pH ${fmt(ind.faixa[0], 1)}–${fmt(ind.faixa[1], 1)} (ponto médio ${fmt(meio, 1)}). O salto da curva (±0,1 % do volume de equivalência) vai de pH ${fmt(phSaltoBaixo, 1)} a ${fmt(phSaltoAlto, 1)}. ${serve ? 'O indicador serve: a mudança de cor acontece dentro do salto.' : 'O indicador não serve bem: a cor muda longe do salto, e o ponto de equivalência seria marcado errado.'}`}
          </p>
          {e.fraco && <p className="m-0 text-sm text-[var(--ink-muted)]">Ácido fraco (Ka = 1,8 × 10⁻⁵): no meio do caminho ({fmt(veq / 2)} mL) o pH vale cerca do pKa, {fmt(-Math.log10(KA_ACETICO), 2)}.</p>}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <PainelDeVisibilidade itens={[{ id: 'fraco', rotulo: 'Ácido fraco (acético) no lugar do HCl', ativo: e.fraco }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <ControleDeslizante rotulo={`Concentração do ${nome}`} valor={e.ca} onChange={(v) => atualizar({ ca: v })} min={0.05} max={0.5} passo={0.05} unidade="mol/L" marcas={[0.05, 0.25, 0.5]} />
        <ControleDeslizante rotulo={`Volume do ${nome}`} valor={e.va} onChange={(v) => atualizar({ va: v })} min={10} max={50} passo={5} unidade="mL" marcas={[10, 30, 50]} />
        <ControleDeslizante rotulo="Concentração do NaOH" valor={e.cb} onChange={(v) => atualizar({ cb: v })} min={0.05} max={0.5} passo={0.05} unidade="mol/L" marcas={[0.05, 0.25, 0.5]} />
        <ControleDeslizante rotulo="Volume de NaOH adicionado" valor={vb} onChange={(v) => atualizar({ vb: v })} min={0} max={vbmax} passo={0.5} unidade="mL" marcas={[0, Math.round(vbmax / 2), vbmax]} />
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Indicador</legend>
          {Object.entries(INDICADORES).map(([id, i]) => (
            <label key={id} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="indicador" checked={e.ind === id} onChange={() => atualizar({ ind: id })} style={{ accentColor: 'var(--accent)' }} />
              {i.nome}
              {id !== 'universal' && <span className="num text-sm text-[var(--ink-muted)]">({fmt(i.faixa[0], 1)}–{fmt(i.faixa[1], 1)})</span>}
            </label>
          ))}
        </fieldset>
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
        { id: 'intro', conteudo: <TelaEscala /> },
        { id: 'explorar', conteudo: <TelaChatelier /> },
        { id: 'lab', conteudo: <TelaTitulacao /> },
      ]}
      desafios={DEFINICOES_EQUILIBRIO}
    />
  )
}
