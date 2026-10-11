import { useEffect, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { classificar, somaPA, somaPG, somaPGInfinita, termoPA, termoPG, termosPA } from './calculo'
import { DEFINICOES_PA_PG } from './definicoes'
import { fmt } from './geradores'
import { BarrasSequencia, GraficoTermos } from './Visuais'

// ------------------------------------------------------------------ Introdução

function TelaIntro() {
  const [a1, setA1] = useState(2)
  const [r, setR] = useState(3)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <BarrasSequencia termos={termosPA(a1, r, 7)} rotulo="Escada de uma PA" />
      <div className="grid content-start gap-4">
        <p className="text-[var(--ink-muted)]">Cada barra é um termo. Mude o primeiro termo e a razão: o que acontece com os degraus da escada?</p>
        <ControleDeslizante rotulo="Primeiro termo (a₁)" valor={a1} onChange={setA1} min={0} max={10} passo={1} marcas={[0, 5, 10]} />
        <ControleDeslizante rotulo="Razão (r)" valor={r} onChange={setR} min={-3} max={6} passo={1} marcas={[-3, 0, 6]} />
        <BotaoReiniciar
          onClick={() => {
            setA1(2)
            setR(3)
          }}
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar

const PADRAO = { tipo: 'PA', a1: 2, razao: 3, n: 8, barras: true, grafico: true, tabela: true }

function TelaExplorar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO)
  const ehPA = e.tipo !== 'PG'
  const [copiado, setCopiado] = useState(false)
  const [ate, setAte] = useState<number | null>(null)
  const animRef = useRef(0)
  const nRef = useRef(e.n)
  const pararRef = useRef<(v: boolean) => void>(() => {})

  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 30, (dt) => {
    animRef.current = Math.min(nRef.current, animRef.current + dt * 2)
    setAte(animRef.current)
    if (animRef.current >= nRef.current) pararRef.current(false)
  })
  useEffect(() => {
    pararRef.current = setRodando
    nRef.current = e.n
  })

  const mostrados = ate === null ? e.n : Math.max(1, Math.floor(ate))
  const f = (k: number) => (ehPA ? termoPA(e.a1, e.razao, k) : termoPG(e.a1, e.razao, k))
  const termos = Array.from({ length: mostrados }, (_, k) => f(k + 1))
  const soma = ehPA ? somaPA(e.a1, e.razao, e.n) : somaPG(e.a1, e.razao, e.n)
  const infinita = !ehPA ? somaPGInfinita(e.a1, e.razao) : null

  const alternar = () => {
    if (!rodando && (ate === null || animRef.current >= e.n)) {
      animRef.current = 0
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
  const linhas = termos.length <= 12 ? termos.map((v, k) => [k + 1, v] as const) : termos.filter((_, k) => k < 4 || k >= termos.length - 4).map((v) => [termos.indexOf(v) + 1, v] as const)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        {e.barras && mostrados <= 14 && <BarrasSequencia termos={termos} rotulo="Barras dos termos" mostrarValores={mostrados <= 10} />}
        {e.grafico && <GraficoTermos tipo={ehPA ? 'PA' : 'PG'} a1={e.a1} razao={e.razao} n={Math.max(e.n, 2)} />}
        <div className="cartao num p-3" aria-live="polite">
          <p>
            Termo geral: <strong>{ehPA ? `aₙ = ${fmt(e.a1)} + (n − 1)·${fmt(e.razao)}` : `aₙ = ${fmt(e.a1)}·(${fmt(e.razao)})^(n − 1)`}</strong>
          </p>
          <p>
            a<sub>{e.n}</sub> = <strong>{fmt(f(e.n))}</strong> · S<sub>{e.n}</sub> = <strong>{Number.isFinite(soma) ? fmt(soma) : '—'}</strong>
            {infinita !== null && (
              <>
                {' '}
                · soma infinita = <strong>{fmt(infinita)}</strong>
              </>
            )}
          </p>
        </div>
        {e.tabela && (
          <div className="overflow-x-auto">
            <table className="num w-full max-w-md border-collapse text-right" aria-label="Termos da sequência">
              <thead>
                <tr className="bg-[var(--surface-2)]">
                  <th className="border border-[var(--line)] p-1.5 text-left">n</th>
                  <th className="border border-[var(--line)] p-1.5">aₙ</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(([k, v]) => (
                  <tr key={k}>
                    <td className="border border-[var(--line)] p-1.5 text-left">{k}</td>
                    <td className="border border-[var(--line)] p-1.5">{fmt(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="grid content-start gap-4">
        <div role="radiogroup" aria-label="Tipo de progressão" className="grid grid-cols-2 gap-2">
          {(['PA', 'PG'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={e.tipo === t}
              className={`btn ${e.tipo === t ? 'btn-primario' : ''}`}
              onClick={() => {
                setRodando(false)
                setAte(null)
                atualizar(t === 'PA' ? { tipo: t, a1: 2, razao: 3 } : { tipo: t, a1: 3, razao: 2 })
              }}
            >
              {t === 'PA' ? 'PA (soma)' : 'PG (multiplica)'}
            </button>
          ))}
        </div>
        <ControleDeslizante rotulo="Primeiro termo (a₁)" valor={e.a1} onChange={(v) => atualizar({ a1: v })} min={-10} max={20} passo={1} marcas={[-10, 0, 20]} />
        <ControleDeslizante
          rotulo={ehPA ? 'Razão (r)' : 'Razão (q)'}
          valor={e.razao}
          onChange={(v) => atualizar({ razao: v })}
          min={ehPA ? -10 : -3}
          max={ehPA ? 10 : 4}
          passo={ehPA ? 1 : 0.5}
          marcas={ehPA ? [-10, 0, 10] : [-3, 0, 4]}
        />
        <ControleDeslizante
          rotulo="Quantidade de termos (n)"
          valor={e.n}
          onChange={(v) => {
            setAte(null)
            atualizar({ n: v })
          }}
          min={2}
          max={ehPA ? 30 : 12}
          passo={1}
          marcas={[2, ehPA ? 30 : 12]}
        />
        <PainelDeVisibilidade
          itens={[
            { id: 'barras', rotulo: 'Barras', ativo: e.barras },
            { id: 'grafico', rotulo: 'Gráfico', ativo: e.grafico },
            { id: 'tabela', rotulo: 'Tabela', ativo: e.tabela },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Revelar termo a termo</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={alternar}
            onPasso={() => {
              animRef.current = Math.min(e.n, Math.floor(animRef.current) + 1)
              setAte(animRef.current)
              passoUnico()
            }}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
        </fieldset>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              setRodando(false)
              setAte(null)
              reiniciar()
            }}
          />
          <button type="button" className="btn" onClick={copiar}>
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

// ------------------------------------------------------------------ Laboratório: detetive de sequências

function lerSequencia(texto: string): number[] | null {
  const partes = texto
    .split(/[;\s]+|,(?!\d)/)
    .map((p) => p.trim())
    .filter(Boolean)
  const nums = partes.map((p) => Number(p.replace(',', '.')))
  return nums.length >= 3 && nums.every(Number.isFinite) ? nums : null
}

function TelaDetetive() {
  const [texto, setTexto] = useState('3; 6; 12; 24')
  const seq = lerSequencia(texto)
  const c = seq ? classificar(seq) : null
  const termos10 = c && c.tipo !== 'nenhuma' && seq ? (c.tipo === 'PA' ? termoPA(seq[0] as number, c.razao as number, 10) : termoPG(seq[0] as number, c.razao as number, 10)) : null
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        {seq && seq.length <= 12 ? <BarrasSequencia termos={seq} rotulo="Barras da sequência digitada" /> : <p className="text-[var(--ink-muted)]">Digite pelo menos 3 termos (até 12) para ver as barras.</p>}
        {c && c.tipo !== 'nenhuma' && seq && (
          <GraficoTermos tipo={c.tipo} a1={seq[0] as number} razao={c.razao as number} n={Math.max(seq.length, 3)} />
        )}
      </div>
      <div className="grid content-start gap-4">
        <div className="grid gap-1">
          <label htmlFor="seq-livre" className="font-semibold">
            Digite os primeiros termos
          </label>
          <input
            id="seq-livre"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="ex.: 2; 5; 8; 11"
            className="num h-12 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
          />
          <p className="text-sm text-[var(--ink-muted)]">Separe por ponto e vírgula ou espaço. Decimais com vírgula (0,5).</p>
        </div>
        <div className="cartao grid gap-1 p-3" aria-live="polite">
          {!seq && <p>Escreva pelo menos 3 números para eu descobrir a regra.</p>}
          {c && c.tipo === 'PA' && (
            <>
              <p>
                É uma <strong>PA</strong> de razão <strong>{fmt(c.razao as number)}</strong>.
              </p>
              <p className="num">aₙ = {fmt(seq![0] as number)} + (n − 1)·{fmt(c.razao as number)}</p>
              <p className="num">a₁₀ = {fmt(termos10 as number)}</p>
            </>
          )}
          {c && c.tipo === 'PG' && (
            <>
              <p>
                É uma <strong>PG</strong> de razão <strong>{fmt(c.razao as number)}</strong>.
              </p>
              <p className="num">aₙ = {fmt(seq![0] as number)}·({fmt(c.razao as number)})^(n − 1)</p>
              <p className="num">a₁₀ = {fmt(termos10 as number)}</p>
              {Math.abs(c.razao as number) < 1 && <p className="num">Soma infinita = {fmt(somaPGInfinita(seq![0] as number, c.razao as number) as number)}</p>}
            </>
          )}
          {c && c.tipo === 'nenhuma' && (
            <p>
              Não é PA nem PG: as diferenças ({seq!.slice(1).map((x, k) => fmt(x - (seq![k] as number))).join('; ')}) e os quocientes não são constantes.
            </p>
          )}
        </div>
        <BotaoReiniciar onClick={() => setTexto('3; 6; 12; 24')} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaIntro /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaDetetive /> },
      ]}
      desafios={DEFINICOES_PA_PG}
    />
  )
}
