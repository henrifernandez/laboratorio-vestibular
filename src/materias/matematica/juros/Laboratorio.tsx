import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Link2, Plus, Trash2, X } from 'lucide-react'
import { DEFINICOES_JUROS } from './definicoes'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { aplicarPercentuais, fatorSucessivo, montanteComposto, montanteSimples, variacaoTotal } from './calculo'
import { GraficoJuros } from './GraficoJuros'
import { BarrasValores } from './Visuais'

const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`
const num = (n: number, casas = 2) => String(Math.round(n * 10 ** casas) / 10 ** casas).replace('.', ',')

// ------------------------------------------------------------------ Introdução

function TelaIntro() {
  const [taxa, setTaxa] = useState(10)
  const [tempo, setTempo] = useState(8)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <GraficoJuros capital={1000} iSimples={taxa} jComposto={taxa} tmax={tempo} pontos={tempo <= 12} />
      <div className="grid content-start gap-4">
        <p className="text-[var(--ink-muted)]">
          R$ 1.000 aplicados com a mesma taxa nos dois regimes. Mexa e veja: quem fica na frente? A diferença aparece logo no começo ou só mais tarde?
        </p>
        <ControleDeslizante rotulo="Taxa (% ao mês)" valor={taxa} onChange={setTaxa} min={1} max={20} passo={1} marcas={[1, 10, 20]} />
        <ControleDeslizante rotulo="Tempo (meses)" valor={tempo} onChange={setTempo} min={2} max={24} passo={1} marcas={[2, 12, 24]} />
        <BotaoReiniciar
          onClick={() => {
            setTaxa(10)
            setTempo(8)
          }}
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar

const PADRAO = { capital: 1000, i: 10, j: 10, t: 12, pontos: true, tabela: true, diferenca: true }

function TelaExplorar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO)
  const [animT, setAnimT] = useState<number | null>(null)
  const [copiado, setCopiado] = useState(false)
  const animRef = useRef(0)
  const pararRef = useRef<(v: boolean) => void>(() => {})
  const tRef = useRef(e.t)

  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 30, (dt) => {
    animRef.current = Math.min(tRef.current, animRef.current + dt * 3)
    setAnimT(animRef.current)
    if (animRef.current >= tRef.current) pararRef.current(false)
  })
  useEffect(() => {
    pararRef.current = setRodando
    tRef.current = e.t
  })

  const alternar = () => {
    if (!rodando && (animT === null || animRef.current >= e.t)) {
      animRef.current = 0
      setAnimT(0)
    }
    setRodando(!rodando)
  }

  const meses = Array.from({ length: e.t }, (_, k) => k + 1)
  const passoTabela = Math.max(1, Math.ceil(e.t / 12))
  const linhas = meses.filter((m) => m % passoTabela === 0 || m === e.t)
  const mS = montanteSimples(e.capital, e.i / 100, e.t)
  const mC = montanteComposto(e.capital, e.j / 100, e.t)
  const dobraS = e.i > 0 ? 100 / e.i : null
  const dobraC = e.j > 0 ? Math.log(2) / Math.log(1 + e.j / 100) : null

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
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        <GraficoJuros capital={e.capital} iSimples={e.i} jComposto={e.j} tmax={e.t} pontos={e.pontos && e.t <= 24} ate={animT ?? undefined} />
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="cartao num p-3">
            Simples (<em>M = C(1 + i·t)</em>)<br />
            <strong className="text-xl">{brl(mS)}</strong>
          </p>
          <p className="cartao num p-3" style={{ borderColor: 'var(--accent)' }}>
            Composto (<em>M = C(1 + i)^t</em>)<br />
            <strong className="text-xl" style={{ color: 'var(--accent)' }}>
              {brl(mC)}
            </strong>
          </p>
        </div>
        {e.diferenca && (
          <p className="num rounded-lg bg-[var(--surface-2)] p-3" aria-live="polite">
            Diferença no mês {e.t}: <strong>{brl(Math.abs(mC - mS))}</strong> a favor do {mC >= mS ? 'composto' : 'simples'}.
          </p>
        )}
        {e.tabela && (
          <div className="overflow-x-auto">
            <table className="num w-full border-collapse text-right" aria-label="Montante por mês">
              <thead>
                <tr className="bg-[var(--surface-2)]">
                  <th className="border border-[var(--line)] p-1.5 text-left">Mês</th>
                  <th className="border border-[var(--line)] p-1.5">Simples</th>
                  <th className="border border-[var(--line)] p-1.5">Composto</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((m) => (
                  <tr key={m}>
                    <td className="border border-[var(--line)] p-1.5 text-left">{m}</td>
                    <td className="border border-[var(--line)] p-1.5">{brl(montanteSimples(e.capital, e.i / 100, m))}</td>
                    <td className="border border-[var(--line)] p-1.5">{brl(montanteComposto(e.capital, e.j / 100, m))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Capital (R$)" valor={e.capital} onChange={(v) => atualizar({ capital: v })} min={500} max={10000} passo={500} marcas={[500, 5000, 10000]} />
        <ControleDeslizante rotulo="Taxa dos juros simples (% a.m.)" valor={e.i} onChange={(v) => atualizar({ i: v })} min={0.5} max={20} passo={0.5} marcas={[0.5, 10, 20]} />
        <ControleDeslizante rotulo="Taxa dos juros compostos (% a.m.)" valor={e.j} onChange={(v) => atualizar({ j: v })} min={0.5} max={20} passo={0.5} marcas={[0.5, 10, 20]} />
        <ControleDeslizante
          rotulo="Tempo (meses)"
          valor={e.t}
          onChange={(v) => {
            setAnimT(null)
            atualizar({ t: v })
          }}
          min={1}
          max={36}
          passo={1}
          marcas={[1, 12, 24, 36]}
        />
        <PainelDeVisibilidade
          itens={[
            { id: 'pontos', rotulo: 'Pontos de cada mês', ativo: e.pontos },
            { id: 'tabela', rotulo: 'Tabela', ativo: e.tabela },
            { id: 'diferenca', rotulo: 'Diferença', ativo: e.diferenca },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Passar o tempo</legend>
          <ControlesDeTempo rodando={rodando} onAlternar={alternar} onPasso={() => { animRef.current = Math.min(e.t, animRef.current + 1); setAnimT(animRef.current); passoUnico() }} velocidade={velocidade} onVelocidade={setVelocidade} />
        </fieldset>
        <div className="rounded-lg bg-[var(--surface-2)] p-3 text-[0.95rem]">
          <strong>Tempo para dobrar o capital</strong>
          <p className="num">Simples: {dobraS ? `${num(dobraS, 1)} meses` : '—'} · Composto: {dobraC ? `${num(dobraC, 1)} meses` : '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar
            onClick={() => {
              setRodando(false)
              setAnimT(null)
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

// ------------------------------------------------------------------ Laboratório: blocos sucessivos

const PALETA = [10, 20, 50, -10, -20, -50]

function TelaBlocos() {
  const [preco, setPreco] = useState(100)
  const [blocos, setBlocos] = useState<number[]>([10, -10])
  const [livre, setLivre] = useState('')

  const valores = aplicarPercentuais(preco, blocos)
  const final = valores[valores.length - 1] as number
  const total = variacaoTotal(blocos)
  const soma = blocos.reduce((s, p) => s + p, 0)
  const mover = (i: number, d: number) =>
    setBlocos((b) => {
      const j = i + d
      if (j < 0 || j >= b.length) return b
      const n = [...b]
      ;[n[i], n[j]] = [n[j] as number, n[i] as number]
      return n
    })
  const adicionarLivre = () => {
    const n = Number(livre.replace(',', '.'))
    if (Number.isFinite(n) && n !== 0 && n > -100 && n <= 1000) {
      setBlocos((b) => [...b, n])
      setLivre('')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        <BarrasValores itens={valores.map((v, i) => ({ rotulo: i === 0 ? 'inicial' : `${i}º`, valor: v }))} />
        <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Blocos de variação, em ordem">
          {blocos.length === 0 && <li className="text-[var(--ink-muted)]">Nenhum bloco ainda. Adicione variações ao lado.</li>}
          {blocos.map((p, i) => (
            <li key={i} className="flex items-center gap-1 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] p-1">
              <button type="button" className="btn btn-fantasma px-2" aria-label={`Mover bloco ${i + 1} para trás`} onClick={() => mover(i, -1)} disabled={i === 0}>
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <span className="num px-1 font-semibold" style={{ color: p > 0 ? 'var(--ok)' : 'var(--erro)' }}>
                {p > 0 ? '+' : '−'}
                {num(Math.abs(p))}%
              </span>
              <button type="button" className="btn btn-fantasma px-2" aria-label={`Mover bloco ${i + 1} para frente`} onClick={() => mover(i, 1)} disabled={i === blocos.length - 1}>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="btn btn-fantasma px-2" aria-label={`Remover bloco ${i + 1}`} onClick={() => setBlocos((b) => b.filter((_, k) => k !== i))}>
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Valor inicial (R$)" valor={preco} onChange={setPreco} min={50} max={1000} passo={50} marcas={[50, 500, 1000]} />
        <div role="group" aria-label="Adicionar bloco" className="flex flex-wrap gap-2">
          {PALETA.map((p) => (
            <button key={p} type="button" className="btn num" onClick={() => setBlocos((b) => [...b, p])} style={{ color: p > 0 ? 'var(--ok)' : 'var(--erro)' }}>
              <Plus size={16} aria-hidden="true" />
              {p > 0 ? '+' : '−'}
              {Math.abs(p)}%
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="bloco-livre" className="sr-only">
            Outro percentual
          </label>
          <input
            id="bloco-livre"
            value={livre}
            onChange={(ev) => setLivre(ev.target.value)}
            onKeyDown={(ev) => ev.key === 'Enter' && adicionarLivre()}
            inputMode="decimal"
            placeholder="outro % (ex.: -15)"
            className="num h-11 w-44 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3"
          />
          <button type="button" className="btn" onClick={adicionarLivre}>
            Adicionar
          </button>
        </div>
        <div className="grid gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-3" aria-live="polite">
          <p className="num">
            Preço final: <strong className="text-xl">{brl(final)}</strong>
          </p>
          <p className="num">
            Variação total: <strong>{total > 0 ? '+' : total < 0 ? '−' : ''}{num(Math.abs(total))}%</strong> (fator {num(fatorSucessivo(blocos), 4)})
          </p>
          {blocos.length > 1 && Math.abs(total - soma) > 0.005 && (
            <p className="text-sm text-[var(--ink-muted)]">
              Se você somasse os percentuais ({soma > 0 ? '+' : ''}{num(soma)}%), erraria por {num(Math.abs(total - soma))} pontos percentuais: cada variação incide sobre um valor diferente.
            </p>
          )}
          {blocos.length > 1 && <p className="text-sm text-[var(--ink-muted)]">Troque a ordem dos blocos: o resultado final não muda, porque multiplicação é comutativa.</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => setBlocos([])}>
            <Trash2 size={18} aria-hidden="true" />
            Limpar blocos
          </button>
          <BotaoReiniciar
            onClick={() => {
              setPreco(100)
              setBlocos([10, -10])
            }}
          />
        </div>
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
        { id: 'lab', conteudo: <TelaBlocos /> },
      ]}
      desafios={DEFINICOES_JUROS}
    />
  )
}
