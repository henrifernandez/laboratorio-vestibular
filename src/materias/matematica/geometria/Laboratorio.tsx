import { useEffect, useRef, useState } from 'react'
import { MovablePoint, Polyline, Text } from 'mafs'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { useLaco } from '@/sim/laco'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import {
  NOME_SOLIDO,
  angulosTriangulo,
  areaBases,
  areaLateral,
  areaTotal,
  ehRetangulo,
  geratriz,
  ladosTriangulo,
  razaoAreas,
  volume,
  type Dimensoes,
  type Pt,
  type Solido,
} from './calculo'
import { DEFINICOES_GEO } from './definicoes'
import { rede } from './redes'
import { Rede2D, Solido3DLazy } from './Visuais'

const fmt = (n: number, c = 2) => String(Math.round(n * 10 ** c) / 10 ** c).replace('.', ',')
const SOLIDOS: Solido[] = ['prisma', 'cilindro', 'cone', 'piramide', 'esfera']
const PADRAO: Required<Dimensoes> = { a: 4, b: 3, h: 5, r: 2 }

/** Controles de medidas conforme o sólido. */
function ControlesDimensoes({ solido, dim, onChange }: { solido: Solido; dim: Dimensoes; onChange: (d: Dimensoes) => void }) {
  const campo = (k: keyof Dimensoes, rotulo: string) => (
    <ControleDeslizante key={k} rotulo={rotulo} valor={dim[k] ?? 1} onChange={(v) => onChange({ ...dim, [k]: v })} min={1} max={8} passo={0.5} marcas={[1, 4, 8]} unidade="cm" />
  )
  switch (solido) {
    case 'prisma':
      return <>{campo('a', 'Comprimento (a)')}{campo('b', 'Largura (b)')}{campo('h', 'Altura (h)')}</>
    case 'cilindro':
    case 'cone':
      return <>{campo('r', 'Raio (r)')}{campo('h', 'Altura (h)')}</>
    case 'piramide':
      return <>{campo('a', 'Lado da base (a)')}{campo('h', 'Altura (h)')}</>
    case 'esfera':
      return campo('r', 'Raio (r)')
  }
}

function SeletorSolido({ solido, onChange, excluir = [] }: { solido: Solido; onChange: (s: Solido) => void; excluir?: Solido[] }) {
  return (
    <div role="radiogroup" aria-label="Sólido" className="grid grid-cols-2 gap-2">
      {SOLIDOS.filter((s) => !excluir.includes(s)).map((s) => (
        <button key={s} type="button" role="radio" aria-checked={solido === s} className={`btn ${solido === s ? 'btn-primario' : ''}`} onClick={() => onChange(s)}>
          {s === 'prisma' ? 'Paralelepípedo' : s === 'piramide' ? 'Pirâmide' : NOME_SOLIDO[s]}
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------ Introdução: sólidos

function TelaSolidos() {
  const [solido, setSolido] = useState<Solido>('cilindro')
  const [dim, setDim] = useState<Dimensoes>({ ...PADRAO })
  const [girar, setGirar] = useState(true)
  const [agua, setAgua] = useState<number | undefined>(undefined)
  const aguaRef = useRef(0)
  const pararRef = useRef<(v: boolean) => void>(() => {})
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 30, (dt) => {
    aguaRef.current = Math.min(1, aguaRef.current + dt * 0.25)
    setAgua(aguaRef.current)
    if (aguaRef.current >= 1) pararRef.current(false)
  })
  useEffect(() => {
    pararRef.current = setRodando
  })

  const V = volume(solido, dim)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-2">
        <Solido3DLazy solido={solido} dim={dim} girar={girar} agua={agua} />
        <p className="text-sm text-[var(--ink-muted)]">Arraste o sólido para girar. Use “Encher” para ver a água subir: ao final, ela ocupa exatamente o volume do sólido.</p>
      </div>
      <div className="grid content-start gap-4">
        <SeletorSolido
          solido={solido}
          onChange={(s) => {
            setSolido(s)
            setAgua(undefined)
            aguaRef.current = 0
            setRodando(false)
          }}
        />
        <ControlesDimensoes solido={solido} dim={dim} onChange={setDim} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            Volume: <strong>{fmt(V)} cm³</strong> ≈ {fmt(V)} mL
          </p>
          <p>Área lateral: {fmt(areaLateral(solido, dim))} cm²</p>
          {solido !== 'esfera' && <p>Área da(s) base(s): {fmt(areaBases(solido, dim))} cm²</p>}
          <p>
            Área total: <strong>{fmt(areaTotal(solido, dim))} cm²</strong>
          </p>
          {(solido === 'cone') && <p className="text-sm text-[var(--ink-muted)]">Geratriz g = √(r² + h²) = {fmt(geratriz(dim.r ?? 1, dim.h ?? 1))} cm</p>}
        </div>
        <PainelDeVisibilidade itens={[{ id: 'girar', rotulo: 'Girar sozinho', ativo: girar }]} onChange={(_, a) => setGirar(a)} />
        <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
          <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Encher com água</legend>
          <ControlesDeTempo
            rodando={rodando}
            onAlternar={() => {
              if (!rodando && (agua === undefined || aguaRef.current >= 1)) {
                aguaRef.current = 0
                setAgua(0)
              }
              setRodando(!rodando)
            }}
            onPasso={() => {
              aguaRef.current = Math.min(1, aguaRef.current + 0.1)
              setAgua(aguaRef.current)
              passoUnico()
            }}
            velocidade={velocidade}
            onVelocidade={setVelocidade}
          />
          <p className="num text-sm text-[var(--ink-muted)]" aria-live="polite">
            {agua === undefined ? 'vazio' : `${Math.round(agua * 100)}% da altura · ${fmt(V * (agua ?? 0))} mL`}
            {agua !== undefined && solido !== 'prisma' && solido !== 'cilindro' && ' (o volume não cresce em linha reta com a altura)'}
          </p>
        </fieldset>
        <BotaoReiniciar
          onClick={() => {
            setDim({ ...PADRAO })
            setAgua(undefined)
            aguaRef.current = 0
            setRodando(false)
            setSolido('cilindro')
          }}
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar: planificação

function TelaPlanificacao() {
  const [solido, setSolido] = useState<Solido>('prisma')
  const [dim, setDim] = useState<Dimensoes>({ ...PADRAO })
  const [dobra, setDobra] = useState(0.6)
  const dobraRef = useRef(0.6)
  const sentidoRef = useRef(1)
  const { rodando, setRodando, velocidade, setVelocidade, passoUnico } = useLaco(1 / 30, (dt) => {
    let t = dobraRef.current + sentidoRef.current * dt * 0.35
    if (t >= 1) {
      t = 1
      sentidoRef.current = -1
    } else if (t <= 0) {
      t = 0
      sentidoRef.current = 1
    }
    dobraRef.current = t
    setDobra(t)
  })
  const pecas = rede(solido, dim)
  const lateral = areaLateral(solido, dim)
  const bases = areaBases(solido, dim)
  const dobravel = solido === 'prisma' || solido === 'piramide'

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-3">
        {dobravel ? (
          <Solido3DLazy solido={solido} dim={dim} girar={false} dobra={dobra} />
        ) : (
          <Solido3DLazy solido={solido} dim={dim} girar />
        )}
        <div className="cartao p-3">
          <Rede2D pecas={pecas} rotulo={`Planificação: ${NOME_SOLIDO[solido]}`} />
          <p className="mt-1 text-center text-xs text-[var(--ink-muted)]">Peças azuis: face lateral. Peças claras: bases.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <SeletorSolido solido={solido} onChange={setSolido} />
        <ControlesDimensoes solido={solido} dim={dim} onChange={setDim} />
        {dobravel && (
          <fieldset className="m-0 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] p-3">
            <legend className="px-1 text-sm font-semibold text-[var(--ink-muted)]">Dobrar e desdobrar</legend>
            <ControleDeslizante
              rotulo="Dobra"
              valor={Math.round(dobra * 100)}
              onChange={(v) => {
                dobraRef.current = v / 100
                setDobra(v / 100)
              }}
              min={0}
              max={100}
              passo={1}
              unidade="%"
              marcas={[0, 50, 100]}
            />
            <ControlesDeTempo
              rodando={rodando}
              onAlternar={() => setRodando(!rodando)}
              onPasso={() => {
                dobraRef.current = Math.min(1, dobraRef.current + 0.1)
                setDobra(dobraRef.current)
                passoUnico()
              }}
              velocidade={velocidade}
              onVelocidade={setVelocidade}
            />
          </fieldset>
        )}
        {solido === 'esfera' ? (
          <p className="cartao p-3">A esfera não tem planificação. Esse é o porquê de os mapas-múndi distorcerem áreas e distâncias.</p>
        ) : (
          <div className="cartao num grid gap-1 p-3" aria-live="polite">
            <p>
              Lateral: <strong>{fmt(lateral)}</strong> cm²
            </p>
            <p>
              Base(s): <strong>{fmt(bases)}</strong> cm²
            </p>
            <p>
              Total = lateral + bases = <strong>{fmt(lateral + bases)}</strong> cm² (a soma das áreas de todas as peças da planificação)
            </p>
          </div>
        )}
        <BotaoReiniciar
          onClick={() => {
            setDim({ ...PADRAO })
            setSolido('prisma')
            dobraRef.current = 0.6
            setDobra(0.6)
            setRodando(false)
          }}
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Laboratório: triângulos

const snap = (v: number) => Math.max(-6, Math.min(6, Math.round(v)))

function TelaTriangulos() {
  const [A, setA] = useState<Pt>({ x: -4, y: -2 })
  const [B, setB] = useState<Pt>({ x: 2, y: -2 })
  const [C, setC] = useState<Pt>({ x: -4, y: 2 })
  const [k, setK] = useState(1.5)
  const [mostrarSemelhante, setMostrarSemelhante] = useState(true)
  const [a, b, c] = ladosTriangulo(A, B, C)
  const [angA, angB, angC] = angulosTriangulo(A, B, C)
  const degenerado = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) < 1e-9
  const retangulo = !degenerado && ehRetangulo([a, b, c])
  const area = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2
  // triângulo semelhante: mesma forma, escala k, a partir do centroide para a direita
  const cx = (A.x + B.x + C.x) / 3
  const cy = (A.y + B.y + C.y) / 3
  const centro = { x: 8 + 0, y: 0 }
  const mover = (p: Pt) => ({ x: centro.x + (p.x - cx) * k, y: centro.y + (p.y - cy) * k })
  const [A2, B2, C2] = [mover(A), mover(B), mover(C)]
  const lim = 14

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-2">
        <Cena janela={{ xmin: -8, xmax: lim + 6, ymin: -9, ymax: 9 }} proporcao altura={300} passoX={2} passoY={2} rotulo="Triângulo ABC com vértices arrastáveis e um triângulo semelhante">
          <Polyline points={[[A.x, A.y], [B.x, B.y], [C.x, C.y], [A.x, A.y]]} color={retangulo ? 'var(--ok)' : 'var(--accent)'} weight={3} svgPolylineProps={{ fill: 'none' }} />
          {mostrarSemelhante && !degenerado && <Polyline points={[[A2.x, A2.y], [B2.x, B2.y], [C2.x, C2.y], [A2.x, A2.y]]} color="var(--ink-muted)" weight={2.5} svgPolylineProps={{ fill: 'none', strokeDasharray: '7 5' }} />}
          {[['A', A, setA], ['B', B, setB], ['C', C, setC]].map(([nome, p, set]) => (
            <g key={nome as string}>
              <MovablePoint point={[(p as Pt).x, (p as Pt).y]} color="var(--erro)" constrain={([x, y]) => [snap(x), snap(y)]} onMove={([x, y]) => (set as (p: Pt) => void)({ x, y })} />
              <Text x={(p as Pt).x} y={(p as Pt).y} attach="ne" attachDistance={12} size={14}>{nome as string}</Text>
            </g>
          ))}
        </Cena>
        <p className="text-sm text-[var(--ink-muted)]">Arraste A, B e C. Quando o triângulo vira retângulo, ele fica verde e vale Pitágoras. A figura tracejada é um triângulo semelhante, ampliado pela razão k.</p>
      </div>
      <div className="grid content-start gap-4">
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          {degenerado ? (
            <p>Os três pontos estão alinhados: não formam triângulo.</p>
          ) : (
            <>
              <p>Lados: a = BC = <strong>{fmt(a)}</strong> · b = CA = <strong>{fmt(b)}</strong> · c = AB = <strong>{fmt(c)}</strong></p>
              <p>Ângulos: A = <strong>{fmt(angA, 1)}°</strong> · B = <strong>{fmt(angB, 1)}°</strong> · C = <strong>{fmt(angC, 1)}°</strong> (soma 180°)</p>
              <p>Área: <strong>{fmt(area)}</strong></p>
              {retangulo ? (
                (() => {
                  const [x, y, z] = [a, b, c].sort((p, q) => p - q) as [number, number, number]
                  return (
                    <p style={{ color: 'var(--ok)' }}>
                      Triângulo retângulo! {fmt(x)}² + {fmt(y)}² = {fmt(x * x + y * y)} = {fmt(z)}² ✓
                    </p>
                  )
                })()
              ) : (
                <p className="text-[var(--ink-muted)]">Não é retângulo: o maior lado ao quadrado ≠ soma dos quadrados dos outros.</p>
              )}
            </>
          )}
        </div>
        <ControleDeslizante rotulo="Razão de semelhança (k)" valor={k} onChange={setK} min={0.5} max={2.5} passo={0.5} marcas={[0.5, 1.5, 2.5]} />
        {!degenerado && (
          <div className="cartao num grid gap-1 p-3">
            <p>Lados do semelhante: {fmt(a * k)} · {fmt(b * k)} · {fmt(c * k)}</p>
            <p>Razão dos lados: <strong>{fmt(k)}</strong> · Razão das áreas: <strong>{fmt(razaoAreas(k))}</strong> = k²</p>
            <p>Área do semelhante: {fmt(area * k * k)}</p>
          </div>
        )}
        <PainelDeVisibilidade itens={[{ id: 'sem', rotulo: 'Mostrar o triângulo semelhante', ativo: mostrarSemelhante }]} onChange={(_, a) => setMostrarSemelhante(a)} />
        <BotaoReiniciar
          onClick={() => {
            setA({ x: -4, y: -2 })
            setB({ x: 2, y: -2 })
            setC({ x: -4, y: 2 })
            setK(1.5)
          }}
        />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaSolidos /> },
        { id: 'explorar', conteudo: <TelaPlanificacao /> },
        { id: 'lab', conteudo: <TelaTriangulos /> },
      ]}
      desafios={DEFINICOES_GEO}
    />
  )
}
