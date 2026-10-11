import { useState } from 'react'
import { PASSOS_GEO, type VisualGeo } from '@/conteudo/matematica/geometria'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { FiguraTriangulo, Solido3DLazy } from './Visuais'

function Visual({ v }: { v: VisualGeo }) {
  const [dobra, setDobra] = useState(0.5)
  const [agua, setAgua] = useState(0.6)
  switch (v.tipo) {
    case 'solido':
      return <Solido3DLazy solido={v.solido} dim={v.dim} />
    case 'dobra':
      return (
        <div className="grid gap-2">
          <Solido3DLazy solido={v.solido} dim={v.dim} girar={false} dobra={dobra} />
          <ControleDeslizante rotulo="Dobra" valor={Math.round(dobra * 100)} onChange={(x) => setDobra(x / 100)} min={0} max={100} passo={1} unidade="%" marcas={[0, 50, 100]} />
        </div>
      )
    case 'agua':
      return (
        <div className="grid gap-2">
          <Solido3DLazy solido={v.solido} dim={v.dim} agua={agua} />
          <ControleDeslizante rotulo="Nível da água" valor={Math.round(agua * 100)} onChange={(x) => setAgua(x / 100)} min={5} max={100} passo={5} unidade="%" marcas={[5, 50, 100]} />
        </div>
      )
    case 'pitagoras':
      return (
        <div className="grid gap-3">
          <FiguraTriangulo d={{ modo: 'pitagoras', lados: { a: 3, b: 4, c: 5 }, incognita: 'c' }} />
          <FiguraTriangulo d={{ modo: 'semelhanca', menor: [3, 4, 5], maior: [6, 8, 10], incognita: 'c' }} />
        </div>
      )
    case 'semelhanca':
      return <FiguraTriangulo d={{ modo: 'semelhanca', menor: [3, 4, 5], maior: [6, 8, 10] }} />
  }
}

const PASSOS: PassoEntenda[] = PASSOS_GEO.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="geometria" />
}
