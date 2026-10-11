import { PASSOS_CIN, type VisualCin } from '@/conteudo/fisica/cinematica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { MiniGrafico, TresGraficos, Trajetoria } from './Visuais'

function Visual({ v }: { v: VisualCin }) {
  if (v.tipo === 'tres') return <TresGraficos inicio={v.inicio} trechos={v.trechos} />
  if (v.tipo === 'lancamento') return <Trajetoria v0={v.v0} angulo={v.angulo} t={v.t} />
  const T = v.trechos.reduce((s, t) => s + t.dur, 0)
  const N = 97
  const x = Array.from({ length: N }, (_, i) => {
    const tempo = (T * i) / (N - 1)
    let acc = v.x0
    let resto = tempo
    for (const tr of v.trechos) {
      const d = Math.min(resto, tr.dur)
      acc += tr.v * d
      resto -= d
      if (resto <= 0) break
    }
    return acc
  })
  const vel = Array.from({ length: N }, (_, i) => {
    const tempo = (T * i) / (N - 1)
    let inicio = 0
    for (const tr of v.trechos) {
      if (tempo <= inicio + tr.dur + 1e-9) return tr.v
      inicio += tr.dur
    }
    return 0
  })
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <MiniGrafico y={x} T={T} rotuloY="x (m)" rotulo="Posição em função do tempo" altura={150} />
      <MiniGrafico y={vel} T={T} rotuloY="v (m/s)" cor="var(--ok)" rotulo="Velocidade em função do tempo" altura={150} />
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_CIN.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="cinematica" />
}
