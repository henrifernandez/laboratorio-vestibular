import { useId } from 'react'
import { Line, Plot, Point } from 'mafs'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoLink } from '@/sim/BotaoLink'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { Formula, formulaTexto } from '../comum/Formula'
import { balanco, coefDe, estaBalanceada, formulaDe, limitante, MM, REACOES, reacao, type Reacao } from './calculo'
import { CoeficienteEntrada, DEFINICOES_ESTEQUIOMETRIA } from './definicoes'
import { BarrasEspecies, Equacao, PontosAtomos } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

function SeletorReacao({ valor, onChange, lista, rotulo = 'Reação' }: { valor: string; onChange: (id: string) => void; lista: Reacao[]; rotulo?: string }) {
  const id = useId()
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-semibold">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3">
        {lista.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nome} ({equacaoTextoPlano(r)})
          </option>
        ))}
      </select>
    </div>
  )
}

/** equação sem coeficientes, com índices Unicode, para caber em <option> */
const equacaoTextoPlano = (r: Reacao) => `${r.reagentes.map(formulaTexto).join(' + ')} → ${r.produtos.map(formulaTexto).join(' + ')}`

/* ------------------------------------------------------------------ Introdução: balanceador */

const PADRAO_BAL = { rx: 'amonia', c0: 1, c1: 1, c2: 1, c3: 1, c4: 1 }
const CHAVES = ['c0', 'c1', 'c2', 'c3', 'c4'] as const
const ZERAR = { c0: 1, c1: 1, c2: 1, c3: 1, c4: 1 }

function TelaBalanceador() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_BAL)
  const r = REACOES.find((x) => x.id === e.rx) ?? reacao('amonia')
  const n = r.coefs.length
  const coefs = CHAVES.slice(0, n).map((k) => e[k])
  const ok = estaBalanceada(r, coefs)
  const minima = coefs.every((c, i) => c === r.coefs[i])
  const b = balanco(r, coefs)
  const erradas = b.filter((x) => x.esquerda !== x.direita)
  const especies = [...r.reagentes, ...r.produtos]
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-3 p-3">
          <Equacao r={r} coefs={coefs} tamanho="grande" />
          <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3">
            {especies.map((fm, k) => (
              <div key={k} className="flex items-start gap-2">
                {k > 0 && (
                  <span aria-hidden="true" className="pt-14 text-xl text-[var(--ink-muted)]">
                    {k === r.reagentes.length ? '→' : '+'}
                  </span>
                )}
                <CoeficienteEntrada formula={fm} valor={coefs[k] as number} onChange={(v) => atualizar({ [CHAVES[k] as string]: v })} bloqueado={false} />
              </div>
            ))}
          </div>
        </div>
        <div className="cartao p-3">
          <PontosAtomos r={r} coefs={coefs} />
        </div>
        <div className="cartao grid gap-1 p-3" aria-live="polite" style={{ borderColor: ok ? 'var(--ok)' : undefined }}>
          {ok ? (
            <p className="m-0 font-semibold" style={{ color: 'var(--ok)' }}>
              Balanceada! Cada elemento tem a mesma quantidade nos dois lados.
            </p>
          ) : (
            <p className="m-0">
              Ainda não: <strong>{erradas.map((x) => x.elemento).join(', ')}</strong> {erradas.length === 1 ? 'não confere' : 'não conferem'}.
            </p>
          )}
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {ok && !minima ? 'Está balanceada, mas dá para simplificar: os coeficientes devem ser os menores números inteiros.' : 'Mude só os coeficientes. Os índices dentro das fórmulas definem a substância e nunca mudam.'}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <SeletorReacao valor={e.rx} lista={REACOES} onChange={(id) => atualizar({ rx: id, ...ZERAR })} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn" onClick={() => atualizar(Object.fromEntries(CHAVES.slice(0, n).map((k, i) => [k, r.coefs[i] as number])))}>
            Mostrar a solução
          </button>
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          Tente primeiro sozinho: comece pelo elemento que aparece em menos substâncias e deixe H e O para o fim.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: reagente limitante */

const DOIS_REAGENTES = REACOES.filter((r) => r.reagentes.length === 2)
const PADRAO_LIM = { rx: 'amonia', n0: 5, n1: 6 }

function TelaLimitante() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LIM)
  const r = DOIS_REAGENTES.find((x) => x.id === e.rx) ?? reacao('amonia')
  const mols = [e.n0, e.n1]
  const res = limitante(r, mols)
  const [fa, fb] = r.reagentes as [string, string]
  const nr = r.reagentes.length
  const c0 = coefDe(r, 0)
  const c1 = coefDe(r, 1)
  const cprod = coefDe(r, nr)
  const prod = (x: number) => Math.min(x / c0, e.n1 / c1) * cprod
  const ymax = Math.max(1, Math.ceil(Math.max(prod(10), cprod * (e.n1 / c1)) * 1.15))
  const final = [
    ...r.reagentes.map((fm, i) => ({ fm, valor: res.sobra[i] as number, cor: 'var(--line-strong)' })),
    ...r.produtos.map((fm, k) => ({ fm, valor: res.produtos[k] as number, cor: 'var(--ok)' })),
  ]
  const maxBarra = Math.max(10, ...final.map((x) => x.valor), ...mols)
  const nomeLim = res.limitante === -1 ? null : (r.reagentes[res.limitante] as string)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <Equacao r={r} />
          <h3 className="m-0 text-base">Antes de reagir (mol)</h3>
          <BarrasEspecies titulo="Mols colocados" max={maxBarra} itens={r.reagentes.map((fm, i) => ({ rotulo: <Formula f={fm} />, nome: fm, valor: mols[i] as number, texto: `${fmt(mols[i] as number)} mol` }))} />
          <h3 className="m-0 text-base">Depois da reação (mol)</h3>
          <BarrasEspecies
            titulo="Mols no final"
            max={maxBarra}
            itens={final.map((x) => ({ rotulo: <Formula f={x.fm} />, nome: x.fm, valor: x.valor, texto: `${fmt(x.valor)} mol`, cor: x.cor }))}
          />
        </div>
        <Cena janela={{ xmin: -0.5, xmax: 10.5, ymin: -ymax * 0.12, ymax: ymax * 1.05 }} passoX={2} passoY={Math.max(1, Math.round(ymax / 5))} rotulo={`Gráfico: mols de ${formulaTexto(r.produtos[0] as string)} formados em função dos mols de ${formulaTexto(fa)}, com ${fmt(e.n1)} mol de ${formulaTexto(fb)} fixos`} altura={260}>
          <Plot.OfX y={prod} domain={[0, 10]} color="var(--accent)" weight={3} />
          <Line.Segment point1={[e.n0, 0]} point2={[e.n0, prod(e.n0)]} color="var(--ink-muted)" style="dashed" weight={1.5} />
          <Point x={e.n0} y={prod(e.n0)} color="var(--erro)" />
        </Cena>
        <p className="m-0 text-sm text-[var(--ink-muted)]">
          Eixo horizontal: mols de {formulaTexto(fa)} colocados. Eixo vertical: mols de {formulaTexto(r.produtos[0] as string)} formados (com {fmt(e.n1)} mol de {formulaTexto(fb)} fixos).
        </p>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p className="m-0">
            {formulaTexto(fa)}: {fmt(e.n0)} ÷ {c0} = <strong>{fmt(res.razoes[0] as number)}</strong> · {formulaTexto(fb)}: {fmt(e.n1)} ÷ {c1} = <strong>{fmt(res.razoes[1] as number)}</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {nomeLim
              ? `O limitante é o ${formulaTexto(nomeLim)} (menor razão). Sobram ${fmt(res.sobra[1 - res.limitante] as number)} mol de ${formulaTexto(r.reagentes[1 - res.limitante] as string)}. No gráfico: antes de ${fmt((e.n1 / c1) * c0)} mol de ${formulaTexto(fa)} a reta sobe (o ${formulaTexto(fa)} limita) e depois vira patamar (o ${formulaTexto(fb)} limita).`
              : 'Proporção exata: os dois reagentes se esgotam juntos e nada sobra.'}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <SeletorReacao valor={e.rx} lista={DOIS_REAGENTES} onChange={(id) => atualizar({ rx: id })} />
        <ControleDeslizante rotulo={`Mols de ${formulaTexto(fa)}`} valor={e.n0} onChange={(v) => atualizar({ n0: v })} min={0} max={10} passo={0.5} unidade="mol" marcas={[0, 5, 10]} />
        <ControleDeslizante rotulo={`Mols de ${formulaTexto(fb)}`} valor={e.n1} onChange={(v) => atualizar({ n1: v })} min={0} max={10} passo={0.5} unidade="mol" marcas={[0, 5, 10]} />
        <p className="text-sm text-[var(--ink-muted)]">
          Experimente deixar os mols exatamente na proporção {c0} : {c1}: nenhum reagente sobra. Aumente só um deles e veja o produto parar de crescer.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <BotaoLink />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: de gramas a gramas */

const PADRAO_MASSA = { rx: 'metano', de: 0, para: 0, massa: 16, pur: 100, rend: 100 }

function TelaMassa() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MASSA)
  const r = REACOES.find((x) => x.id === e.rx) ?? reacao('metano')
  const nr = r.reagentes.length
  const de = Math.min(e.de, nr - 1)
  const para = Math.min(e.para, r.produtos.length - 1)
  const fDe = formulaDe(r, de)
  const fPara = formulaDe(r, nr + para)
  const mmDe = MM(fDe)
  const mmPara = MM(fPara)
  const cDe = coefDe(r, de)
  const cPara = coefDe(r, nr + para)
  const pura = e.massa * (e.pur / 100)
  const nDe = pura / mmDe
  const nPara = nDe * (cPara / cDe)
  const teorica = nPara * mmPara
  const real = teorica * (e.rend / 100)
  const passos: { rotulo: string; conta: string; valor: string }[] = [
    { rotulo: 'Massa da amostra', conta: '', valor: `${fmt(e.massa)} g` },
    { rotulo: `Massa pura de ${formulaTexto(fDe)}`, conta: `${fmt(e.massa)} × ${fmt(e.pur)} %`, valor: `${fmt(pura)} g` },
    { rotulo: `Mols de ${formulaTexto(fDe)}`, conta: `${fmt(pura)} ÷ ${fmt(mmDe)} g/mol`, valor: `${fmt(nDe, 3)} mol` },
    { rotulo: `Mols de ${formulaTexto(fPara)}`, conta: `× ${cPara} ÷ ${cDe} (coeficientes)`, valor: `${fmt(nPara, 3)} mol` },
    { rotulo: `Massa teórica de ${formulaTexto(fPara)}`, conta: `${fmt(nPara, 3)} × ${fmt(mmPara)} g/mol`, valor: `${fmt(teorica)} g` },
    { rotulo: 'Massa obtida', conta: `${fmt(teorica)} × ${fmt(e.rend)} %`, valor: `${fmt(real)} g` },
  ]
  const maximo = Math.max(e.massa, teorica, 1e-9)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <Equacao r={r} destaque={{ [de]: 'dado', [nr + para]: 'pedido' }} />
          <ol className="m-0 grid list-none gap-1.5 p-0">
            {passos.map((p, i) => (
              <li key={p.rotulo} className="grid grid-cols-[1.4rem_1fr_auto] items-baseline gap-2 border-b border-[var(--line)] pb-1.5 last:border-0">
                <span className="num text-sm text-[var(--ink-muted)]" aria-hidden="true">{i + 1}</span>
                <span>
                  {p.rotulo}
                  {p.conta && <span className="num block text-sm text-[var(--ink-muted)]">{p.conta}</span>}
                </span>
                <strong className="num">{p.valor}</strong>
              </li>
            ))}
          </ol>
        </div>
        <BarrasEspecies
          titulo="Massas em gramas ao longo do cálculo"
          max={maximo}
          itens={[
            { rotulo: 'Amostra', nome: 'Amostra', valor: e.massa, texto: `${fmt(e.massa)} g`, cor: 'var(--line-strong)' },
            { rotulo: 'Pura', nome: 'Reagente puro', valor: pura, texto: `${fmt(pura)} g` },
            { rotulo: 'Teórica', nome: 'Produto teórico', valor: teorica, texto: `${fmt(teorica)} g`, cor: 'var(--ok)' },
            { rotulo: 'Obtida', nome: 'Produto obtido', valor: real, texto: `${fmt(real)} g`, cor: 'var(--aviso)' },
          ]}
        />
        <p className="num m-0 text-sm text-[var(--ink-muted)]" aria-live="polite">
          Conferência pela lei de Lavoisier: {fmt(r.reagentes.reduce((s, fm, i) => s + coefDe(r, i) * MM(fm), 0))} g de reagentes (pelos coeficientes) = {fmt(r.produtos.reduce((s, fm, k) => s + coefDe(r, nr + k) * MM(fm), 0))} g de produtos.
        </p>
      </div>
      <div className="grid content-start gap-4">
        <SeletorReacao valor={e.rx} lista={REACOES} onChange={(id) => atualizar({ rx: id, de: 0, para: 0 })} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="grid gap-1 font-semibold">
            Reagente que você tem
            <select value={de} onChange={(ev) => atualizar({ de: Number(ev.target.value) })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 font-normal">
              {r.reagentes.map((fm, i) => (
                <option key={fm} value={i}>
                  {formulaTexto(fm)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 font-semibold">
            Produto que você quer
            <select value={para} onChange={(ev) => atualizar({ para: Number(ev.target.value) })} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 font-normal">
              {r.produtos.map((fm, i) => (
                <option key={fm} value={i}>
                  {formulaTexto(fm)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ControleDeslizante rotulo="Massa da amostra" valor={e.massa} onChange={(v) => atualizar({ massa: v })} min={1} max={400} passo={1} unidade="g" marcas={[1, 200, 400]} />
        <ControleDeslizante rotulo="Pureza do reagente" valor={e.pur} onChange={(v) => atualizar({ pur: v })} min={40} max={100} passo={5} unidade="%" marcas={[40, 70, 100]} />
        <ControleDeslizante rotulo="Rendimento da reação" valor={e.rend} onChange={(v) => atualizar({ rend: v })} min={10} max={100} passo={5} unidade="%" marcas={[10, 55, 100]} />
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
        { id: 'intro', conteudo: <TelaBalanceador /> },
        { id: 'explorar', conteudo: <TelaLimitante /> },
        { id: 'lab', conteudo: <TelaMassa /> },
      ]}
      desafios={DEFINICOES_ESTEQUIOMETRIA}
    />
  )
}
