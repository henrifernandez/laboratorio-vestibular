import { PASSOS_TER, type VisualTer } from '@/conteudo/fisica/termologia'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { NOME_FASE, curvaPV, estadoAposCalor, transformar, type EstadoGas } from './calculo'
import { Copo, DiagramaPV, GraficoCurva, Pistao, pontosDaAgua } from './Visuais'

const f = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

function Visual({ v }: { v: VisualTer }) {
  if (v.tipo === 'curva') {
    const pontos = pontosDaAgua(v.Tini, 140)
    const e = estadoAposCalor(1, v.Tini, v.q)
    return (
      <div className="mx-auto w-full max-w-sm">
        <GraficoCurva
          pontos={pontos}
          xmax={pontos[pontos.length - 1]!.x}
          ymin={v.Tini - 5}
          ymax={150}
          rotulo={`Curva de aquecimento de 1 grama de água. No ponto marcado, a amostra está em ${NOME_FASE[e.fase]} a ${f(e.T)} graus.`}
          rotuloX="calor por grama →"
          marcador={{ x: v.q, y: e.T }}
          altura={170}
        />
        <p className="text-center text-sm text-[var(--ink-muted)]" aria-live="polite">
          No ponto marcado: {NOME_FASE[e.fase]}, T = {f(e.T)} °C
          {e.fase === 'fusao' || e.fase === 'vaporizacao' ? ` (${Math.round(e.fracao * 100)} % transformado)` : ''}
        </p>
      </div>
    )
  }
  if (v.tipo === 'copos') {
    const mMax = Math.max(500, ...v.corpos.map((c) => c.m))
    return (
      <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-1" role="group" aria-label="Corpos que serão misturados">
        {v.corpos.map((c, i) => (
          <div key={c.rotulo} className="flex flex-1 items-center gap-1">
            {i > 0 && <span aria-hidden="true" className="text-xl text-[var(--ink-muted)]">+</span>}
            <div className="flex-1">
              <Copo agua={c.gelo ? 0 : c.m} geloM={c.gelo ? c.m : 0} T={c.T} rotulo={c.rotulo} mMax={mMax} />
              <p className="text-center text-sm text-[var(--ink-muted)]">{c.rotulo}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }
  const ini: EstadoGas = { p: 2, V: 3, T: 300 }
  const alvo = v.processo === 'isocorica' ? 4 : 6
  const fim = transformar(ini, v.processo, alvo)
  const curva = curvaPV(ini, v.processo, alvo)
  return (
    <div className="mx-auto grid w-full max-w-md gap-2 sm:grid-cols-3">
      <Pistao V={ini.V} p={ini.p} T={ini.T} Vmax={7} rotulo={`Estado inicial: ${f(ini.V)} litros, ${f(ini.p)} atmosferas, ${f(ini.T - 273)} graus Celsius`} />
      <Pistao V={fim.V} p={fim.p} T={fim.T} Vmax={7} rotulo={`Estado final: ${f(fim.V)} litros, ${f(fim.p)} atmosferas, ${f(fim.T - 273)} graus Celsius`} />
      <DiagramaPV curva={curva} ini={ini} fim={fim} Vmax={7} pmax={5} area rotulo="Diagrama p por V da transformação, com a área sob a curva sombreada" />
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_TER.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="termologia" />
}
