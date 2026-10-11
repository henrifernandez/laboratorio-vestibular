import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Compass, Crosshair, FlaskConical, Gamepad2, Link2, Sparkles, Waypoints } from 'lucide-react'
import { MovablePoint, Plot, Point, Text } from 'mafs'
import { Tex } from '@/componentes/Tex'
import { JogoDesafios } from '@/desafios/JogoDesafios'
import { BarraDeTelas } from '@/sim/BarraDeTelas'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { CaixaDeFerramentas } from '@/sim/CaixaDeFerramentas'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { RepresentacoesProvider, useRepresentacoes } from '@/sim/RepresentacoesLigadas'
import { DEFINICOES } from './definicoes'
import { compilar } from './expressao'
import { CurvaDaFuncao, GraficoFuncao, type Realce } from './GraficoFuncao'
import { interseccoes } from './lab'
import { JANELAS } from './janelas'
import {
  LIMITES,
  PADRAO,
  lerEstado,
  normalizarBase,
  paraFuncao,
  paraParams,
  type EstadoLab,
} from './estadoLab'
import { NOMES_FAMILIA, avaliar, caracteristicas, formulaTex, textoSinal, type Familia, type Funcao } from './modelo'

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const r3 = (n: number) => Math.round(n * 1000) / 1000
const snap = (v: number, passo: number) => r3(Math.round(v / passo) * passo)
const corta = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, v))
/** coeficiente a nunca fica em zero ao arrastar: pula para o menor passo do mesmo sinal */
const evitaZero = (v: number, ref: number) => (Math.abs(v) < 0.25 ? (ref < 0 ? -0.25 : 0.25) : v)

// ------------------------------------------------------------------ Introdução

function TelaIntroducao() {
  const [a, setA] = useState(1)
  const [b, setB] = useState(0)
  const f: Funcao = { tipo: 'afim', a, b }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <GraficoFuncao funcao={f} janela={JANELAS.afim} realces={['intercepto']} rotulo="Gráfico de uma reta que você controla" />
      <div className="grid content-start gap-4">
        <div className="cartao p-3 text-center text-xl">
          <Tex>{formulaTexIntro(a, b)}</Tex>
        </div>
        <ControleDeslizante rotulo="a (inclinação)" valor={a} onChange={setA} min={-3} max={3} passo={0.5} marcas={[-3, 0, 3]} />
        <ControleDeslizante rotulo="b (altura inicial)" valor={b} onChange={setB} min={-4} max={4} passo={1} marcas={[-4, 0, 4]} />
        <p className="text-[var(--ink-muted)]">
          Arraste os controles. O que acontece com a reta quando <em>a</em> passa de positivo para negativo? E quando você muda <em>b</em>?
        </p>
        <BotaoReiniciar
          onClick={() => {
            setA(1)
            setB(0)
          }}
        />
      </div>
    </div>
  )
}

const formulaTexIntro = (a: number, b: number) => formulaTex({ tipo: 'afim', a, b })

// ------------------------------------------------------------------ Explorar

const NOMES_COEF: Record<string, string> = { a: 'a', b: 'b', c: 'c', k: 'k', base: 'base' }

function Manipuladores({ estado, atualizar }: { estado: EstadoLab; atualizar: (p: Partial<EstadoLab> | ((e: EstadoLab) => Partial<EstadoLab>)) => void }) {
  const cor = 'var(--accent)'
  switch (estado.familia) {
    case 'afim':
      return (
        <>
          <MovablePoint
            point={[0, estado.b]}
            color={cor}
            constrain={([, y]) => [0, corta(snap(y, 0.5), LIMITES.b)]}
            onMove={([, y]) => atualizar({ b: y })}
          />
          <MovablePoint
            point={[1, estado.a + estado.b]}
            color={cor}
            constrain={([, y]) => [1, corta(snap(y, 0.5), LIMITES.b)]}
            onMove={([, y]) => atualizar((e) => ({ a: corta(r3(y - e.b), LIMITES.a) }))}
          />
        </>
      )
    case 'quadratica': {
      if (estado.a === 0) return null
      const h = -estado.b / (2 * estado.a)
      const k = estado.c - (estado.b * estado.b) / (4 * estado.a)
      return (
        <>
          <MovablePoint
            point={[h, k]}
            color={cor}
            constrain={([x, y]) => [corta(snap(x, 0.25), [-6, 6]), corta(snap(y, 0.25), LIMITES.c)]}
            onMove={([x, y]) => atualizar((e) => ({ b: r3(-2 * e.a * x), c: r3(e.a * x * x + y) }))}
          />
          <MovablePoint
            point={[h + 1, k + estado.a]}
            color={cor}
            constrain={([, y]) => [h + 1, corta(snap(y, 0.25), LIMITES.c)]}
            onMove={([, y]) =>
              atualizar((e) => {
                const hh = -e.b / (2 * e.a)
                const kk = e.c - (e.b * e.b) / (4 * e.a)
                const na = corta(evitaZero(r3(y - kk), e.a), LIMITES.a)
                return { a: na, b: r3(-2 * na * hh), c: r3(na * hh * hh + kk) }
              })
            }
          />
        </>
      )
    }
    case 'exponencial':
      return (
        <>
          <MovablePoint
            point={[0, estado.a + estado.k]}
            color={cor}
            constrain={([, y]) => [0, corta(snap(y, 0.25), LIMITES.c)]}
            onMove={([, y]) => atualizar((e) => ({ a: corta(evitaZero(r3(y - e.k), e.a), LIMITES.a) }))}
          />
          <MovablePoint
            point={[-3.2, estado.k]}
            color="var(--ink-muted)"
            constrain={([, y]) => [-3.2, corta(snap(y, 0.5), LIMITES.k)]}
            onMove={([, y]) => atualizar({ k: y })}
          />
        </>
      )
    case 'logaritmica':
      return (
        <>
          <MovablePoint
            point={[1, estado.k]}
            color={cor}
            constrain={([, y]) => [1, corta(snap(y, 0.25), LIMITES.k)]}
            onMove={([, y]) => atualizar({ k: y })}
          />
          <MovablePoint
            point={[estado.base, estado.a + estado.k]}
            color={cor}
            constrain={([, y]) => [estado.base, corta(snap(y, 0.25), LIMITES.c)]}
            onMove={([, y]) => atualizar((e) => ({ a: corta(evitaZero(r3(y - e.k), e.a), LIMITES.a) }))}
          />
        </>
      )
  }
}

function TabelaDeValores({ f }: { f: Funcao }) {
  const xs = f.tipo === 'logaritmica' ? [0.5, 1, 2, 4, 8] : [-3, -2, -1, 0, 1, 2, 3]
  return (
    <div className="overflow-x-auto">
      <table className="num w-full border-collapse text-center" aria-label="Tabela de valores da função">
        <thead>
          <tr>
            <th scope="row" className="border border-[var(--line)] bg-[var(--surface-2)] p-1.5 text-left">x</th>
            {xs.map((x) => (
              <td key={x} className="border border-[var(--line)] bg-[var(--surface-2)] p-1.5 font-semibold">{fmt(x)}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="border border-[var(--line)] p-1.5 text-left">f(x)</th>
            {xs.map((x) => {
              const y = avaliar(f, x)
              return (
                <td key={x} className="border border-[var(--line)] p-1.5">
                  {Number.isFinite(y) ? fmt(y) : '—'}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function Caracteristicas({ f }: { f: Funcao }) {
  const c = caracteristicas(f)
  const itens: [string, string][] = [
    ['Raízes', c.raizes.length ? c.raizes.map((r) => `x = ${fmt(r)}`).join(' e ') : 'nenhuma'],
    ['Corta o eixo y', c.interceptoY === null ? 'não corta (x = 0 fora do domínio)' : `em y = ${fmt(c.interceptoY)}`],
  ]
  if (c.vertice) itens.push(['Vértice', `(${fmt(c.vertice.x)}; ${fmt(c.vertice.y)}), ponto ${c.concavidade === 'cima' ? 'mais baixo' : 'mais alto'}`])
  if (c.delta !== undefined) itens.push(['Discriminante Δ', `${fmt(c.delta)} (${c.delta > 0 ? 'duas raízes' : c.delta === 0 ? 'uma raiz' : 'sem raízes reais'})`])
  itens.push([
    'Crescimento',
    c.crescimento === 'misto'
      ? `decresce até x = ${fmt(c.vertice?.x ?? 0)} e depois cresce`.replace('decresce até', c.concavidade === 'cima' ? 'decresce até' : 'cresce até').replace('depois cresce', c.concavidade === 'cima' ? 'depois cresce' : 'depois decresce')
      : c.crescimento,
  ])
  if (c.assintota) itens.push(['Assíntota', c.assintota.tipo === 'horizontal' ? `horizontal, y = ${fmt(c.assintota.valor)}` : `vertical, x = ${fmt(c.assintota.valor)}`])
  itens.push(['Sinal', textoSinal(f)])
  return (
    <dl className="m-0 grid gap-1 text-[0.95rem]">
      {itens.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-2 border-b border-[var(--line)] py-1 last:border-0">
          <dt className="font-semibold text-[var(--ink-muted)]">{k}</dt>
          <dd className="m-0">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function oscila(fase: number): number {
  // triângulo entre -3 e 3, período de 8 s, arredondado a 0,05
  const p = (fase % 8) / 8
  const v = -3 + 6 * (p < 0.5 ? 2 * p : 2 - 2 * p)
  return Math.round(v * 20) / 20
}

function TelaExplorar() {
  const { estado, atualizar, reiniciar } = useRepresentacoes<EstadoLab>()
  const [visiveis, setVisiveis] = useState<Record<string, boolean>>({
    raizes: true,
    vertice: true,
    intercepto: true,
    assintota: true,
    valores: true,
    zoom: false,
  })
  const [copiado, setCopiado] = useState(false)
  const fase = useRef(0)
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 60, (dt) => {
    fase.current += dt
    atualizar({ a: oscila(fase.current) })
  })

  const f = paraFuncao(estado)
  const familia = estado.familia
  const degenerada = f.tipo !== familia

  const realces = (['raizes', 'vertice', 'intercepto', 'assintota'] as Realce[]).filter((r) => visiveis[r])
  const itensVisib = [
    { id: 'raizes', rotulo: 'Raízes' },
    ...(f.tipo === 'quadratica' ? [{ id: 'vertice', rotulo: 'Vértice' }] : []),
    { id: 'intercepto', rotulo: 'Intercepto' },
    ...(f.tipo === 'exponencial' || f.tipo === 'logaritmica' ? [{ id: 'assintota', rotulo: 'Assíntota' }] : []),
    { id: 'valores', rotulo: 'Valores' },
    { id: 'zoom', rotulo: 'Zoom livre' },
  ].map((i) => ({ ...i, ativo: !!visiveis[i.id] }))

  const trocarFamilia = (nova: Familia) => {
    setRodando(false)
    atualizar({ ...PADRAO[nova] })
  }

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        <GraficoFuncao
          funcao={f}
          janela={JANELAS[f.tipo]}
          realces={realces}
          valores={visiveis.valores}
          zoom={visiveis.zoom}
          rotulo={`Gráfico da função ${NOMES_FAMILIA[f.tipo].toLowerCase()} com pontos arrastáveis`}
        >
          {!degenerada && <Manipuladores estado={estado} atualizar={atualizar} />}
        </GraficoFuncao>
        <div className="cartao p-3 text-center text-xl" aria-live="polite">
          <Tex>{formulaTex(f)}</Tex>
          {degenerada && <p className="mt-1 text-sm text-[var(--ink-muted)]">Com esses valores, a função vira uma função afim (ou constante).</p>}
        </div>
        <TabelaDeValores f={f} />
        <p className="text-sm text-[var(--ink-muted)]">Dica: arraste os pontos coloridos no gráfico, ou use os controles ao lado. Tudo muda junto.</p>
      </div>

      <div className="grid content-start gap-4">
        <div role="radiogroup" aria-label="Tipo de função" className="grid grid-cols-2 gap-2">
          {(Object.keys(NOMES_FAMILIA) as Familia[]).map((fm) => (
            <button
              key={fm}
              type="button"
              role="radio"
              aria-checked={fm === familia}
              className={`btn ${fm === familia ? 'btn-primario' : ''}`}
              onClick={() => trocarFamilia(fm)}
            >
              {NOMES_FAMILIA[fm]}
            </button>
          ))}
        </div>

        <div className="grid gap-3">
          <ControleDeslizante rotulo={NOMES_COEF.a ?? 'a'} valor={estado.a} onChange={(v) => atualizar({ a: v })} min={LIMITES.a[0]} max={LIMITES.a[1]} passo={0.25} marcas={[-4, 0, 4]} />
          {familia === 'afim' && (
            <ControleDeslizante rotulo="b" valor={estado.b} onChange={(v) => atualizar({ b: v })} min={LIMITES.b[0]} max={LIMITES.b[1]} passo={0.5} marcas={[-8, 0, 8]} />
          )}
          {familia === 'quadratica' && (
            <>
              <ControleDeslizante rotulo="b" valor={estado.b} onChange={(v) => atualizar({ b: v })} min={LIMITES.b[0]} max={LIMITES.b[1]} passo={0.5} marcas={[-8, 0, 8]} />
              <ControleDeslizante rotulo="c" valor={estado.c} onChange={(v) => atualizar({ c: v })} min={LIMITES.c[0]} max={LIMITES.c[1]} passo={0.5} marcas={[-8, 0, 8]} />
            </>
          )}
          {(familia === 'exponencial' || familia === 'logaritmica') && (
            <>
              <ControleDeslizante
                rotulo="base"
                valor={estado.base}
                onChange={(v) => atualizar((e) => ({ base: normalizarBase(v, e.base) }))}
                min={LIMITES.base[0]}
                max={LIMITES.base[1]}
                passo={0.1}
                marcas={[0.2, 1, 5]}
              />
              <ControleDeslizante rotulo="k" valor={estado.k} onChange={(v) => atualizar({ k: v })} min={LIMITES.k[0]} max={LIMITES.k[1]} passo={0.5} marcas={[-8, 0, 8]} />
            </>
          )}
        </div>

        <PainelDeVisibilidade itens={itensVisib} onChange={(id, ativo) => setVisiveis((v) => ({ ...v, [id]: ativo }))} />

        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Animar o coeficiente a</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={() => setRodando(!rodando)}
            onPasso={() => {
              passoUnico()
            }}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
        </fieldset>

        <Caracteristicas f={f} />

        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              setRodando(false)
              fase.current = 0
              reiniciar()
            }}
          />
          <button type="button" className="btn" onClick={copiarLink}>
            <Link2 size={18} aria-hidden="true" />
            Copiar link desta configuração
          </button>
          <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">
            {copiado && 'Link copiado.'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Laboratório livre

function TelaLivre() {
  const [textoF, setTextoF] = useState('x^2 - 2x - 3')
  const [textoG, setTextoG] = useState('x + 1')
  const [ferr, setFerr] = useState({ sonda: true, cruzamentos: true })
  const [xs, setXs] = useState(1.5)

  const cf = useMemo(() => compilar(textoF), [textoF])
  const cg = useMemo(() => (textoG.trim() === '' ? null : compilar(textoG)), [textoG])
  const fn = cf.ok ? cf.fn : null
  const gn = cg && cg.ok ? cg.fn : null
  const janela = { xmin: -8, xmax: 8, ymin: -8, ymax: 10 }

  const cruz = useMemo(() => (fn && gn ? interseccoes(fn, gn, janela.xmin, janela.xmax) : []), [fn, gn]) // eslint-disable-line react-hooks/exhaustive-deps
  const insere = useCallback((t: string) => setTextoF((x) => x + t), [])

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <Cena janela={janela} rotulo="Gráfico das fórmulas que você digitou" zoom>
        {gn && <Plot.OfX y={gn} color="var(--curva-alvo)" style="dashed" weight={3} />}
        {fn && <Plot.OfX y={fn} color="var(--accent)" weight={3.5} />}
        {fn && ferr.sonda && (
          <MovablePoint
            point={[xs, Number.isFinite(fn(xs)) ? fn(xs) : 0]}
            color="var(--accent)"
            constrain={([x]) => {
              const xx = corta(snap(x, 0.05), [janela.xmin, janela.xmax])
              const y = fn(xx)
              return [xx, Number.isFinite(y) ? y : 0]
            }}
            onMove={([x]) => setXs(x)}
          />
        )}
        {ferr.cruzamentos &&
          cruz.map((p) => (
            <g key={p.x}>
              <Point x={p.x} y={p.y} color="var(--ink)" />
              <Text x={p.x} y={p.y} attach="ne" attachDistance={10} size={14}>
                {`(${fmt(p.x)}; ${fmt(p.y)})`}
              </Text>
            </g>
          ))}
      </Cena>

      <div className="grid content-start gap-4">
        <div className="grid gap-1">
          <label htmlFor="expr-f" className="font-semibold">
            f(x) =
          </label>
          <input
            id="expr-f"
            value={textoF}
            onChange={(e) => setTextoF(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-invalid={!cf.ok}
            aria-describedby="erro-f"
            className="h-12 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
          />
          <div className="flex flex-wrap gap-1" role="group" aria-label="Atalhos de digitação">
            {['^', '(', ')', 'sqrt(', 'log(x, 2)', 'ln(x)', 'e^x'].map((t) => (
              <button key={t} type="button" className="btn num px-2" onClick={() => insere(t)}>
                {t}
              </button>
            ))}
          </div>
          <p id="erro-f" role="status" className="min-h-6 text-sm" style={{ color: 'var(--erro)' }}>
            {!cf.ok && cf.erro}
          </p>
        </div>
        <div className="grid gap-1">
          <label htmlFor="expr-g" className="font-semibold">
            g(x) = <span className="font-normal text-[var(--ink-muted)]">(opcional, para comparar)</span>
          </label>
          <input
            id="expr-g"
            value={textoG}
            onChange={(e) => setTextoG(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-invalid={cg ? !cg.ok : false}
            className="h-12 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
          />
          <p role="status" className="min-h-6 text-sm" style={{ color: 'var(--erro)' }}>
            {cg && !cg.ok && cg.erro}
          </p>
        </div>

        <CaixaDeFerramentas
          ferramentas={[
            { id: 'sonda', rotulo: 'Ponto-sonda', icone: <Crosshair size={18} />, ativa: ferr.sonda },
            { id: 'cruzamentos', rotulo: 'Onde se cruzam', icone: <Waypoints size={18} />, ativa: ferr.cruzamentos },
          ]}
          onAlternar={(id) => setFerr((f) => ({ ...f, [id as 'sonda']: !f[id as 'sonda'] }))}
        />

        {fn && ferr.sonda && (
          <p className="cartao num p-3" aria-live="polite">
            Ponto-sonda: x = <strong>{fmt(xs)}</strong>, f(x) = <strong>{Number.isFinite(fn(xs)) ? fmt(fn(xs)) : 'não existe'}</strong>
            {gn && Number.isFinite(gn(xs)) && <> · g(x) = <strong>{fmt(gn(xs))}</strong></>}
          </p>
        )}
        {ferr.cruzamentos && fn && gn && (
          <p className="cartao p-3" aria-live="polite">
            {cruz.length === 0 ? 'As curvas não se cruzam nesta janela.' : `As curvas se cruzam em ${cruz.map((p) => `x = ${fmt(p.x)}`).join(' e ')}.`}
          </p>
        )}
        <p className="text-sm text-[var(--ink-muted)]">
          Aceita ^, multiplicação sem sinal (2x, 3(x+1)), sqrt, log(x, base), ln e e. Uso de log sem base é base 10.
        </p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Laboratório (as quatro telas)

const TELAS = [
  { id: 'intro', rotulo: 'Introdução', icone: <Sparkles size={18} /> },
  { id: 'explorar', rotulo: 'Explorar', icone: <Compass size={18} /> },
  { id: 'lab', rotulo: 'Laboratório', icone: <FlaskConical size={18} /> },
  { id: 'jogo', rotulo: 'Jogo', icone: <Gamepad2 size={18} /> },
]

export default function Laboratorio() {
  const [busca, setBusca] = useSearchParams()
  const tela = TELAS.find((t) => t.id === busca.get('tela'))?.id ?? 'intro'
  const inicial = useMemo(() => lerEstado(busca), []) // eslint-disable-line react-hooks/exhaustive-deps

  const gravar = useCallback(
    (e: EstadoLab) =>
      setBusca(
        (p) => {
          const n = new URLSearchParams(p)
          for (const [k, v] of Object.entries(paraParams(e))) n.set(k, v)
          return n
        },
        { replace: true },
      ),
    [setBusca],
  )

  const mudarTela = (id: string) =>
    setBusca(
      (p) => {
        const n = new URLSearchParams(p)
        n.set('tela', id)
        return n
      },
      { replace: true },
    )

  return (
    <div className="cartao overflow-hidden">
      <div className="p-4 sm:p-5">
        <RepresentacoesProvider<EstadoLab> inicial={inicial} padrao={PADRAO.afim} onMudar={gravar}>
          {tela === 'intro' && <TelaIntroducao />}
          {tela === 'explorar' && <TelaExplorar />}
          {tela === 'lab' && <TelaLivre />}
        </RepresentacoesProvider>
        {tela === 'jogo' && <JogoDesafios desafios={DEFINICOES} />}
      </div>
      <BarraDeTelas telas={TELAS} atual={tela} onChange={mudarTela} />
    </div>
  )
}

// reexport usado pelo CurvaDaFuncao nas telas
export { CurvaDaFuncao }
