import { useEffect, useMemo, useRef, useState } from 'react'
import { Line, Polyline } from 'mafs'
import { Dices, Link2 } from 'lucide-react'
import { criarRng } from '@/lib/rng'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { SeletorNumerico } from '@/sim/SeletorNumerico'
import { arranjo, combinacao, fatorial } from './calculo'
import { DEFINICOES_COMB } from './definicoes'
import { contar, experimento, frequenciasAcumuladas, sequencia, type TipoExperimento } from './simulacao'
import { ArvorePossibilidades, BarrasFrequencia, VisualArranjoCombinacao } from './Visuais'

const pct = (x: number) => `${String(Math.round(x * 1000) / 10).replace('.', ',')}%`
const frac = (x: number) => String(Math.round(x * 10000) / 10000).replace('.', ',')

// ------------------------------------------------------------------ Introdução: árvore

const ETAPAS = [
  { nome: 'Pão', todas: ['francês', 'integral', 'de forma'] },
  { nome: 'Recheio', todas: ['queijo', 'presunto', 'frango'] },
  { nome: 'Molho', todas: ['mostarda', 'maionese', 'ketchup'] },
]

function TelaArvore() {
  const [qtd, setQtd] = useState([2, 3, 1])
  const niveis = useMemo(() => ETAPAS.map((e, i) => ({ nome: e.nome, opcoes: e.todas.slice(0, qtd[i]) })).filter((n) => n.opcoes.length > 0), [qtd])
  const mudar = (i: number, v: number) => setQtd((q) => q.map((x, k) => (k === i ? v : x)))
  const total = qtd.reduce((p, x) => p * x, 1)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <ArvorePossibilidades key={niveis.map((n) => n.opcoes.length).join('-')} niveis={niveis} />
      <div className="grid content-start gap-4">
        <p className="text-[var(--ink-muted)]">Monte um lanche: escolha quantas opções há em cada etapa e abra a árvore. Quantos lanches diferentes existem?</p>
        {ETAPAS.map((e, i) => (
          <div key={e.nome} className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{e.nome}</span>
            <SeletorNumerico rotulo={`opções de ${e.nome}`} valor={qtd[i] as number} min={1} max={3} onChange={(v) => mudar(i, v)} />
          </div>
        ))}
        <p className="cartao num p-3 text-lg" aria-live="polite">
          {qtd.join(' × ')} = <strong>{total}</strong> lanches
        </p>
        <BotaoReiniciar onClick={() => setQtd([2, 3, 1])} />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar: simulador

const PADRAO = { exp: 'moeda', n: 100, sem: 1, ev: 0, v: 3, a: 2, g: 1 }
const TAMANHOS = [10, 100, 1000, 10000]
const NOME_EXP: Record<string, string> = { moeda: 'Moeda', dado: 'Dado', urna: 'Urna' }

function TelaSimulador() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO)
  const tipo = (['moeda', 'dado', 'urna'].includes(e.exp) ? e.exp : 'moeda') as TipoExperimento
  const [copiado, setCopiado] = useState(false)
  const exp = useMemo(() => experimento(tipo, { vermelhas: e.v, azuis: e.a, verdes: e.g }), [tipo, e.v, e.a, e.g])
  const seq = useMemo(() => sequencia(criarRng(e.sem * 9973), exp.probs, e.n), [exp, e.sem, e.n])
  const ev = Math.min(e.ev, exp.rotulos.length - 1)
  const pEv = exp.probs[ev] as number

  const [ate, setAte] = useState<number | null>(null)
  const ateRef = useRef(0)
  const nRef = useRef(e.n)
  const pararRef = useRef<(v: boolean) => void>(() => {})
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 30, () => {
    ateRef.current = Math.min(nRef.current, ateRef.current + Math.max(1, Math.ceil(nRef.current / 150)))
    setAte(ateRef.current)
    if (ateRef.current >= nRef.current) pararRef.current(false)
  })
  useEffect(() => {
    pararRef.current = setRodando
    nRef.current = e.n
  })

  const feitos = ate === null ? e.n : Math.min(ate, e.n)
  const contagens = contar(seq, exp.rotulos.length, feitos)
  const pontos = useMemo(() => {
    const cp = Array.from(new Set(Array.from({ length: 160 }, (_, k) => Math.max(1, Math.round(Math.pow(feitos, k / 159))))))
    return frequenciasAcumuladas(seq, ev, cp)
  }, [seq, ev, feitos])

  const reiniciarAnim = () => {
    setRodando(false)
    ateRef.current = 0
    setAte(null)
  }
  const alternar = () => {
    if (!rodando && (ate === null || ateRef.current >= e.n)) {
      ateRef.current = 0
      setAte(0)
    }
    setRodando(!rodando)
  }
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }
  const ymax = Math.min(1, pEv * 2.2 + 0.1)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        <BarrasFrequencia rotulos={exp.rotulos} freqs={contagens} probs={exp.probs} total={feitos} />
        <Cena janela={{ xmin: -e.n * 0.04, xmax: e.n * 1.03, ymin: -ymax * 0.06, ymax }} passoX={Math.max(1, e.n / 5)} passoY={ymax > 0.6 ? 0.25 : 0.1} rotulo={`Frequência relativa de ${exp.rotulos[ev]} conforme o número de repetições cresce`}>
          <Line.Segment point1={[0, pEv]} point2={[e.n, pEv]} color="var(--ink)" style="dashed" weight={2} />
          <Polyline points={pontos.map((p) => [p.n, p.freq] as [number, number])} color="var(--accent)" weight={3} svgPolylineProps={{ fill: 'none' }} />
        </Cena>
        <p className="text-sm text-[var(--ink-muted)]">Curva azul: frequência relativa de “{exp.rotulos[ev]}” acumulada. Tracejado: probabilidade teórica ({frac(pEv)}).</p>
        <div className="overflow-x-auto">
          <table className="num w-full border-collapse text-center" aria-label="Resultados da simulação">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="border border-[var(--line)] p-1.5">Resultado</th>
                <th className="border border-[var(--line)] p-1.5">Vezes</th>
                <th className="border border-[var(--line)] p-1.5">Frequência</th>
                <th className="border border-[var(--line)] p-1.5">Teórica</th>
              </tr>
            </thead>
            <tbody>
              {exp.rotulos.map((r, i) => (
                <tr key={r}>
                  <td className="border border-[var(--line)] p-1.5">{r}</td>
                  <td className="border border-[var(--line)] p-1.5">{contagens[i]}</td>
                  <td className="border border-[var(--line)] p-1.5">{feitos ? pct((contagens[i] as number) / feitos) : '—'}</td>
                  <td className="border border-[var(--line)] p-1.5">{pct(exp.probs[i] as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <div role="radiogroup" aria-label="Experimento" className="grid grid-cols-3 gap-2">
          {(['moeda', 'dado', 'urna'] as const).map((t) => (
            <button key={t} type="button" role="radio" aria-checked={tipo === t} className={`btn ${tipo === t ? 'btn-primario' : ''}`} onClick={() => { reiniciarAnim(); atualizar({ exp: t, ev: 0 }) }}>
              {NOME_EXP[t]}
            </button>
          ))}
        </div>
        {tipo === 'urna' && (
          <div className="grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
            {[['v', 'Bolas vermelhas'], ['a', 'Bolas azuis'], ['g', 'Bolas verdes']].map(([k, nome]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span>{nome}</span>
                <SeletorNumerico rotulo={nome as string} valor={e[k as 'v'] as number} min={k === 'v' ? 1 : 0} max={9} onChange={(x) => { reiniciarAnim(); atualizar({ [k as string]: x, ev: 0 }) }} />
              </div>
            ))}
          </div>
        )}
        <div role="radiogroup" aria-label="Número de repetições" className="grid grid-cols-4 gap-2">
          {TAMANHOS.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={e.n === t} className={`btn num ${e.n === t ? 'btn-primario' : ''}`} onClick={() => { reiniciarAnim(); atualizar({ n: t }) }}>
              {t.toLocaleString('pt-BR')}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Resultado acompanhado no gráfico" className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[var(--ink-muted)]">Acompanhar:</span>
          {exp.rotulos.map((r, i) => (
            <button key={r} type="button" role="radio" aria-checked={ev === i} className={`btn ${ev === i ? 'btn-primario' : ''}`} onClick={() => atualizar({ ev: i })}>
              {r}
            </button>
          ))}
        </div>
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Lançar aos poucos</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={alternar}
            onPasso={() => {
              ateRef.current = Math.min(e.n, ateRef.current + Math.max(1, Math.ceil(e.n / 150)))
              setAte(ateRef.current)
              passoUnico()
            }}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
          <p className="num text-sm text-[var(--ink-muted)]" aria-live="polite">
            {feitos.toLocaleString('pt-BR')} de {e.n.toLocaleString('pt-BR')} repetições
          </p>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-primario" onClick={() => { reiniciarAnim(); atualizar({ sem: e.sem + 1 }) }}>
            <Dices size={18} aria-hidden="true" />
            Novo sorteio
          </button>
          <BotaoReiniciar onClick={() => { reiniciarAnim(); reiniciar() }} />
          <button type="button" className="btn" onClick={copiar}>
            <Link2 size={18} aria-hidden="true" />
            Copiar link
          </button>
          <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">{copiado && 'Link copiado.'}</span>
        </div>
        <p className="num text-sm text-[var(--ink-muted)]">Semente do sorteio: {e.sem} (o mesmo link repete exatamente os mesmos resultados).</p>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Laboratório: arranjo x combinação

function TelaArranjoCombinacao() {
  const [n, setN] = useState(4)
  const [p, setP] = useState(2)
  const letras = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, n)
  const pp = Math.min(p, n)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <VisualArranjoCombinacao key={`${n}-${pp}`} letras={letras} p={pp} />
      <div className="grid content-start gap-4">
        <p className="text-[var(--ink-muted)]">Escolha n elementos e quantos serão escolhidos (p). Clique numa combinação para ver todos os arranjos que ela gera.</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">Elementos (n)</span>
          <SeletorNumerico rotulo="n" valor={n} min={2} max={6} onChange={(v) => { setN(v); setP((q) => Math.min(q, v)) }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">Escolhidos (p)</span>
          <SeletorNumerico rotulo="p" valor={pp} min={1} max={n} onChange={setP} />
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>A({n}, {pp}) = {n}!/{n - pp}! = <strong>{arranjo(n, pp)}</strong></p>
          <p>C({n}, {pp}) = {n}!/({pp}!·{n - pp}!) = <strong>{combinacao(n, pp)}</strong></p>
          {pp === n && <p>Permutação P({n}) = {n}! = <strong>{fatorial(n)}</strong></p>}
        </div>
        <BotaoReiniciar onClick={() => { setN(4); setP(2) }} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaArvore /> },
        { id: 'explorar', conteudo: <TelaSimulador /> },
        { id: 'lab', conteudo: <TelaArranjoCombinacao /> },
      ]}
      desafios={DEFINICOES_COMB}
    />
  )
}
