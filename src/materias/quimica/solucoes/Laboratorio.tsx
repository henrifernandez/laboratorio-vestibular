import { Plot, Point } from 'mafs'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoLink } from '@/sim/BotaoLink'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { Bequer } from '../comum/Bequer'
import { massaMolar } from '../comum/elementos'
import { CURVAS, curva, misturaSalAgua, solubilidade } from './calculo'
import { DEFINICOES_SOLUCOES } from './definicoes'
import { GraficoSolubilidade } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: o béquer */

const SOLUTOS = [
  { id: 'NaCl', nome: 'sal de cozinha (NaCl)', MM: massaMolar('NaCl') },
  { id: 'glicose', nome: 'glicose (C₆H₁₂O₆)', MM: massaMolar('C6H12O6') },
  { id: 'sacarose', nome: 'açúcar comum (C₁₂H₂₂O₁₁)', MM: massaMolar('C12H22O11') },
]
const PADRAO_BEQUER = { sol: 'NaCl', m: 20, V: 500 }

function TelaBequer() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_BEQUER)
  const soluto = SOLUTOS.find((s) => s.id === e.sol) ?? (SOLUTOS[0] as (typeof SOLUTOS)[number])
  const litros = e.V / 1000
  const C = e.m / litros
  const n = e.m / soluto.MM
  const M = n / litros
  const intensidade = Math.sqrt(Math.min(1, C / 400))
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid justify-items-center gap-2 p-3">
          <Bequer volume={e.V} vmax={1000} intensidade={intensidade} particulas={Math.round(Math.min(60, (e.m / 120) * 60))} descricao={`Béquer com ${fmt(e.V, 0)} mL de solução contendo ${fmt(e.m)} g de ${soluto.nome}`} largura={150} />
          <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">
            {fmt(e.m)} g de soluto em {fmt(e.V, 0)} mL de solução
          </p>
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0">
            C = m ÷ V = {fmt(e.m)} ÷ {fmt(litros)} = <strong>{fmt(C)} g/L</strong>
          </p>
          <p className="m-0">
            n = m ÷ MM = {fmt(e.m)} ÷ {fmt(soluto.MM)} = {fmt(n, 3)} mol → M = n ÷ V = <strong>{fmt(M, 3)} mol/L</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Também: {fmt(C / 10)} g em cada 100 mL · {fmt(C * 1000, 0)} mg/L (≈ ppm, se a solução for diluída e aquosa).
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Soluto</legend>
          {SOLUTOS.map((s) => (
            <label key={s.id} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="soluto" checked={e.sol === s.id} onChange={() => atualizar({ sol: s.id })} style={{ accentColor: 'var(--accent)' }} />
              {s.nome} <span className="num text-sm text-[var(--ink-muted)]">({fmt(s.MM)} g/mol)</span>
            </label>
          ))}
        </fieldset>
        <ControleDeslizante rotulo="Massa de soluto" valor={e.m} onChange={(v) => atualizar({ m: v })} min={0} max={120} passo={1} unidade="g" marcas={[0, 60, 120]} />
        <ControleDeslizante rotulo="Volume da solução" valor={e.V} onChange={(v) => atualizar({ V: v })} min={100} max={1000} passo={50} unidade="mL" marcas={[100, 550, 1000]} />
        <p className="text-sm text-[var(--ink-muted)]">Dobre o volume sem mexer na massa: os pontinhos continuam os mesmos, mas a cor clareia e a concentração cai pela metade.</p>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: diluir e evaporar */

const PADRAO_DIL = { C0: 4, V0: 100, agua: 0, evap: 0 }

function TelaDiluicao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_DIL)
  const maxEvap = Math.max(0, e.V0 + e.agua - 25)
  const evap = Math.min(e.evap, maxEvap)
  const Vf = e.V0 + e.agua - evap
  const n = (e.C0 * e.V0) / 1000
  const Cf = (n * 1000) / Vf
  const particulas = Math.max(3, Math.min(40, Math.round(n * 8)))
  const cmax = Math.max(e.C0, Cf, 1)
  const ymax = Math.max(2, e.C0 * 2.4)
  const vmax = Math.max(e.V0, Vf, 200) * 1.15
  const xmin = Math.max(20, (n * 1000) / ymax)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao flex flex-wrap items-end justify-center gap-x-4 gap-y-2 p-3">
          <figure className="m-0 grid justify-items-center gap-0.5 text-center text-sm">
            <Bequer volume={e.V0} vmax={vmax} intensidade={Math.sqrt(e.C0 / cmax)} particulas={particulas} descricao={`Béquer antes: ${fmt(e.V0, 0)} mL a ${fmt(e.C0)} mol/L`} largura={104} />
            <figcaption>
              <strong>Antes</strong>
              <span className="num block text-[var(--ink-muted)]">{fmt(e.V0, 0)} mL · {fmt(e.C0)} mol/L</span>
            </figcaption>
          </figure>
          <span aria-hidden="true" className="pb-12 text-xl text-[var(--ink-muted)]">→</span>
          <figure className="m-0 grid justify-items-center gap-0.5 text-center text-sm">
            <Bequer volume={Vf} vmax={vmax} intensidade={Math.sqrt(Cf / cmax)} particulas={particulas} descricao={`Béquer depois: ${fmt(Vf, 0)} mL a ${fmt(Cf)} mol/L`} largura={104} />
            <figcaption>
              <strong>Depois</strong>
              <span className="num block text-[var(--ink-muted)]">{fmt(Vf, 0)} mL · {fmt(Cf)} mol/L</span>
            </figcaption>
          </figure>
        </div>
        <Cena janela={{ xmin: 0, xmax: 1250, ymin: -ymax * 0.1, ymax }} passoX={250} passoY={Math.max(1, Math.round(ymax / 5))} rotulo="Gráfico da concentração em função do volume final, com a mesma quantidade de soluto: uma hipérbole" altura={240}>
          <Plot.OfX y={(v) => (n * 1000) / v} domain={[xmin, 1250]} color="var(--accent)" weight={3} />
          <Point x={Math.min(Vf, 1250)} y={Math.min(Cf, ymax)} color="var(--erro)" />
        </Cena>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Eixo horizontal: volume final da solução (mL). Eixo vertical: concentração (mol/L).</p>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0">
            Soluto: n = C·V = {fmt(e.C0)} × {fmt(e.V0 / 1000)} = <strong>{fmt(n, 3)} mol</strong>, igual antes e depois.
          </p>
          <p className="m-0">
            C₂ = n ÷ V₂ = {fmt(n, 3)} ÷ {fmt(Vf / 1000)} = <strong>{fmt(Cf)} mol/L</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {e.agua > 0 && evap === 0 ? `Água adicionada: ${fmt(e.agua, 0)} mL. O volume foi multiplicado por ${fmt(Vf / e.V0)} e a concentração ficou dividida por ${fmt(Vf / e.V0)}.` : evap > 0 && e.agua === 0 ? `Evaporaram ${fmt(evap, 0)} mL: só a água sai, o soluto fica, e a concentração sobe.` : evap > 0 ? 'Água adicionada e evaporada: o que vale é o volume final.' : 'Mude a água adicionada ou evaporada para ver a concentração mudar.'}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Concentração inicial" valor={e.C0} onChange={(v) => atualizar({ C0: v })} min={0.5} max={10} passo={0.5} unidade="mol/L" marcas={[0.5, 5, 10]} />
        <ControleDeslizante rotulo="Volume inicial" valor={e.V0} onChange={(v) => atualizar({ V0: v })} min={50} max={500} passo={50} unidade="mL" marcas={[50, 275, 500]} />
        <ControleDeslizante rotulo="Água adicionada" valor={e.agua} onChange={(v) => atualizar({ agua: v })} min={0} max={1000} passo={25} unidade="mL" marcas={[0, 500, 1000]} />
        <ControleDeslizante rotulo="Água evaporada" valor={evap} onChange={(v) => atualizar({ evap: v })} min={0} max={maxEvap} passo={25} unidade="mL" marcas={[0, maxEvap]} />
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: curva de solubilidade */

const PADRAO_SOL = { c: 'A', T: 60, sal: 100, agua: 100, T2: 20, lento: false, todas: false }

function TelaSolubilidade() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_SOL)
  const c = curva(e.c)
  const res = misturaSalAgua(c, e.T, e.sal, e.agua)
  const S = solubilidade(c, e.T)
  const ponto = e.agua > 0 ? (e.sal / e.agua) * 100 : 0
  const nomeEstado = res.estado === 'insaturada' ? 'Insaturada' : res.estado === 'saturada' ? 'Saturada' : 'Saturada, com corpo de fundo'
  const rotuloPonto = res.estado === 'insaturada' ? 'insaturada' : res.estado === 'saturada' ? 'saturada' : 'corpo de fundo'
  const corPonto = res.estado === 'insaturada' ? 'var(--ok)' : res.estado === 'saturada' ? 'var(--aviso)' : 'var(--erro)'
  const solido1 = res.depositado
  const cap2 = (solubilidade(c, e.T2) * e.agua) / 100
  const dissolvido2 = Math.min(e.sal, cap2)
  const solido2 = e.sal - dissolvido2
  const separado = Math.max(0, solido2 - solido1)
  const supersaturada = e.lento && solido1 === 0 && separado > 0
  const mudou = e.T2 !== e.T
  const intensidade = Math.min(1, (res.dissolvido / Math.max(e.agua, 1)) / 1.2)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-3 p-3">
          <GraficoSolubilidade
            curvas={e.todas ? CURVAS : [c]}
            destaque={e.todas ? c.id : undefined}
            ponto={{ T: e.T, S: ponto, rotulo: rotuloPonto, cor: corPonto }}
            marcas={mudou ? [{ T: e.T2, S: solubilidade(c, e.T2), rotulo: `${e.T2} °C` }] : []}
            ymax={Math.max(40, Math.ceil(Math.max(ponto, ...c.pontos.map((p) => p[1])) / 20) * 20)}
          />
          <p className="m-0 text-sm text-[var(--ink-muted)]">O ponto grande é a sua mistura: sal ÷ água × 100, na temperatura escolhida. Abaixo da curva a solução é insaturada; sobre a curva, saturada; acima, sobra sal no fundo.</p>
        </div>
        <div className="cartao grid grid-cols-[auto_1fr] items-center gap-4 p-3">
          <Bequer volume={e.agua} vmax={600} intensidade={intensidade} particulas={Math.round(Math.min(40, (res.dissolvido / 600) * 80))} solido={Math.round(Math.min(24, res.depositado / 8))} descricao={`Béquer com ${fmt(e.agua, 0)} g de água: ${fmt(res.dissolvido)} g de sal dissolvido e ${fmt(res.depositado)} g no fundo`} largura={104} />
          <div className="num grid gap-1 text-sm" aria-live="polite">
            <p className="m-0 text-base">
              <strong style={{ color: corPonto }}>{nomeEstado}</strong>
            </p>
            <p className="m-0">
              A {e.T} °C, {fmt(e.agua, 0)} g de água dissolvem no máximo {fmt(res.capacidade)} g ({fmt(S)} g/100 g).
            </p>
            <p className="m-0 text-[var(--ink-muted)]">
              Dissolvido: {fmt(res.dissolvido)} g · no fundo: {fmt(res.depositado)} g
            </p>
          </div>
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0 font-semibold">Levar a mistura de {e.T} °C para {e.T2} °C</p>
          {!mudou ? (
            <p className="m-0 text-sm text-[var(--ink-muted)]">Escolha outra temperatura final para ver o que acontece.</p>
          ) : (
            <>
              <p className="m-0 text-sm">
                A {e.T2} °C a água comporta {fmt(cap2)} g ({fmt(solubilidade(c, e.T2))} g/100 g).
              </p>
              <p className="m-0">
                {supersaturada ? (
                  <>
                    Sem agitar e sem cristais, o excesso de <strong>{fmt(separado)} g</strong> pode ficar dissolvido: solução <strong>supersaturada</strong> (instável).
                  </>
                ) : separado > 0 ? (
                  <>
                    Se separam mais <strong>{fmt(separado)} g</strong> de sal (total no fundo: {fmt(solido2)} g).
                  </>
                ) : solido1 > solido2 ? (
                  <>
                    Dissolvem-se mais <strong>{fmt(solido1 - solido2)} g</strong> do sal que estava no fundo.
                  </>
                ) : (
                  <>Nada se separa: tudo continua dissolvido.</>
                )}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <fieldset className="m-0 grid gap-1 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Sal</legend>
          <div className="flex flex-wrap gap-x-4">
            {CURVAS.map((k) => (
              <label key={k.id} className="flex min-h-11 cursor-pointer items-center gap-2">
                <input type="radio" name="sal" checked={e.c === k.id} onChange={() => atualizar({ c: k.id })} style={{ accentColor: 'var(--accent)' }} />
                {k.nome}
              </label>
            ))}
          </div>
          <p className="m-0 text-sm text-[var(--ink-muted)]">{c.decrescente ? 'O sal C dissolve menos a quente.' : 'Este sal dissolve mais a quente.'}</p>
        </fieldset>
        <ControleDeslizante rotulo="Temperatura" valor={e.T} onChange={(v) => atualizar({ T: v })} min={0} max={80} passo={5} unidade="°C" marcas={[0, 40, 80]} />
        <ControleDeslizante rotulo="Massa de sal" valor={e.sal} onChange={(v) => atualizar({ sal: v })} min={0} max={400} passo={5} unidade="g" marcas={[0, 200, 400]} />
        <ControleDeslizante rotulo="Massa de água" valor={e.agua} onChange={(v) => atualizar({ agua: v })} min={50} max={500} passo={50} unidade="g" marcas={[50, 275, 500]} />
        <ControleDeslizante rotulo="Temperatura final" valor={e.T2} onChange={(v) => atualizar({ T2: v })} min={0} max={80} passo={5} unidade="°C" marcas={[0, 40, 80]} />
        <PainelDeVisibilidade
          titulo="Opções"
          itens={[
            { id: 'lento', rotulo: 'Resfriar devagar, sem agitar e sem cristais', ativo: e.lento },
            { id: 'todas', rotulo: 'Mostrar as três curvas', ativo: e.todas },
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

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaBequer /> },
        { id: 'explorar', conteudo: <TelaDiluicao /> },
        { id: 'lab', conteudo: <TelaSolubilidade /> },
      ]}
      desafios={DEFINICOES_SOLUCOES}
    />
  )
}
