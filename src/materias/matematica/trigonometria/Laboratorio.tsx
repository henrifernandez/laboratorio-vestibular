import { useEffect, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { ANGULOS_NOTAVEIS, exato, normalizar, quadrante, referencia, textoRad } from './calculo'
import { DEFINICOES_TRIG } from './definicoes'
import { CirculoTrig, Legenda, OndaTrig, TabelaSinais, valoresTexto } from './Visuais'

const fmt = (n: number, c = 1) => String(Math.round(n * 10 ** c) / 10 ** c).replace('.', ',')

// ------------------------------------------------------------------ Introdução

function TelaIntro() {
  const [g, setG] = useState(40)
  const v = valoresTexto(g)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid gap-2">
        <CirculoTrig graus={g} onChange={setG} />
        <Legenda />
      </div>
      <div className="grid content-start gap-4">
        <p className="text-[var(--ink-muted)]">Arraste o ponto vermelho pelo círculo. O segmento azul é o cosseno (horizontal) e o verde é o seno (vertical).</p>
        <ControleDeslizante rotulo="Ângulo (graus)" valor={g} onChange={setG} min={0} max={360} passo={5} marcas={[0, 90, 180, 270, 360]} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>θ = <strong>{g}°</strong> = {textoRad(g)} rad</p>
          <p>cos θ = <strong>{v.cos}</strong></p>
          <p>sen θ = <strong>{v.sen}</strong></p>
        </div>
        <BotaoReiniciar onClick={() => setG(40)} />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar

const PADRAO = { g: 30, sen: true, cos: true, tan: false, not: true, rad: false }

function TelaExplorar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO)
  const [copiado, setCopiado] = useState(false)
  const gRef = useRef(e.g)
  const atualizarRef = useRef(atualizar)
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 30, (dt) => {
    gRef.current = normalizar(gRef.current + 45 * dt)
    atualizarRef.current({ g: Math.round(gRef.current * 10) / 10 })
  })
  useEffect(() => {
    atualizarRef.current = atualizar
    gRef.current = e.g
  })

  const g = e.g
  const v = valoresTexto(g)
  const q = quadrante(g)
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
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-2">
        <CirculoTrig graus={g} onChange={(x) => atualizar({ g: x })} seno={e.sen} cosseno={e.cos} tangente={e.tan} notaveis={e.not} radianos={e.rad} />
        <Legenda seno={e.sen} cosseno={e.cos} tangente={e.tan} />
        <OndaTrig graus={g} seno={e.sen} cosseno={e.cos} />
        <p className="text-sm text-[var(--ink-muted)]">Abaixo do círculo: o gráfico de seno e cosseno em função do ângulo. A linha vermelha tracejada marca o ângulo atual.</p>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Ângulo (graus)" valor={g} onChange={(x) => atualizar({ g: x })} min={0} max={360} passo={5} marcas={[0, 90, 180, 270, 360]} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>θ = <strong>{fmt(g)}°</strong> = {Number.isInteger(g) ? textoRad(g) : '—'} rad</p>
          <p>Região: <strong>{q === 0 ? 'sobre um eixo' : `${q}º quadrante`}</strong></p>
          <p style={{ color: 'var(--accent)' }}>cos θ = <strong>{v.cos}</strong></p>
          <p style={{ color: 'var(--ok)' }}>sen θ = <strong>{v.sen}</strong></p>
          <p style={{ color: 'var(--aviso)' }}>tg θ = <strong>{v.tan}</strong></p>
        </div>
        <PainelDeVisibilidade
          itens={[
            { id: 'sen', rotulo: 'Seno', ativo: e.sen },
            { id: 'cos', rotulo: 'Cosseno', ativo: e.cos },
            { id: 'tan', rotulo: 'Tangente', ativo: e.tan },
            { id: 'not', rotulo: 'Ângulos notáveis', ativo: e.not },
            { id: 'rad', rotulo: 'Em radianos', ativo: e.rad },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Girar o ponto</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={() => setRodando(!rodando)}
            onPasso={() => {
              atualizar({ g: normalizar(g + 15) })
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
              reiniciar()
            }}
          />
          <button type="button" className="btn" onClick={copiar}>
            <Link2 size={18} aria-hidden="true" />
            Copiar link
          </button>
          <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">{copiado && 'Link copiado.'}</span>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Laboratório: ângulos notáveis e redução

function TelaNotaveis() {
  const [g, setG] = useState(150)
  const [texto, setTexto] = useState('150')
  const q = quadrante(g)
  const a = normalizar(g)
  const ref = referencia(g)
  const notavel = g % 30 === 0 || g % 45 === 0
  const ex = { sen: exato('sen', g), cos: exato('cos', g), tan: exato('tan', g) }

  const escolher = (x: number) => {
    setG(x)
    setTexto(String(x))
  }
  const digitar = (t: string) => {
    setTexto(t)
    const n = Number(t.replace(',', '.'))
    if (t.trim() !== '' && Number.isFinite(n) && Math.abs(n) <= 3600) setG(n)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-2">
        <CirculoTrig graus={g} notaveis radianos tangente />
        <Legenda tangente />
        <TabelaSinais destaque={q === 0 ? undefined : q} />
      </div>
      <div className="grid content-start gap-4">
        <div className="grid gap-1">
          <label htmlFor="angulo-livre" className="font-semibold">
            Ângulo (graus)
          </label>
          <input id="angulo-livre" value={texto} onChange={(ev) => digitar(ev.target.value)} inputMode="decimal" className="num h-12 w-40 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg" />
          <p className="text-sm text-[var(--ink-muted)]">Aceita negativos e acima de 360°.</p>
        </div>
        <div role="group" aria-label="Ângulos notáveis" className="flex flex-wrap gap-1.5">
          {ANGULOS_NOTAVEIS.filter((x) => x < 360).map((x) => (
            <button key={x} type="button" className={`btn num px-2.5 ${g === x ? 'btn-primario' : ''}`} onClick={() => escolher(x)}>
              {x}°
            </button>
          ))}
        </div>
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            Volta: {g}° → <strong>{fmt(a)}°</strong> ({q === 0 ? 'sobre um eixo' : `${q}º quadrante`})
          </p>
          {q !== 0 && <p>Ângulo de referência: <strong>{fmt(ref)}°</strong></p>}
          {notavel ? (
            <>
              <p style={{ color: 'var(--ok)' }}>sen = <strong>{ex.sen.texto}</strong></p>
              <p style={{ color: 'var(--accent)' }}>cos = <strong>{ex.cos.texto}</strong></p>
              <p style={{ color: 'var(--aviso)' }}>tg = <strong>{ex.tan.texto}</strong></p>
            </>
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">Este não é um ângulo notável (múltiplo de 30° ou 45°), então não há valor exato simples.</p>
          )}
        </div>
        <BotaoReiniciar onClick={() => escolher(150)} />
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
        { id: 'lab', conteudo: <TelaNotaveis /> },
      ]}
      desafios={DEFINICOES_TRIG}
    />
  )
}
