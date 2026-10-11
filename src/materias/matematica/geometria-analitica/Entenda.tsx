import { Line, Circle, Point, Text } from 'mafs'
import { PASSOS_GA, type VisualGA } from '@/conteudo/matematica/geometria-analitica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { Plano, Ponto, RetaMN, TrianguloInclinacao } from './Visuais'

function Visual({ v }: { v: VisualGA }) {
  switch (v.tipo) {
    case 'distancia':
      return (
        <Plano lim={6} rotulo="Dois pontos e o triângulo retângulo da distância">
          <Line.Segment point1={v.a} point2={v.b} color="var(--accent)" weight={3} />
          <TrianguloInclinacao a={{ x: v.a[0], y: v.a[1] }} b={{ x: v.b[0], y: v.b[1] }} />
          <Ponto p={{ x: v.a[0], y: v.a[1] }} rotulo="A" />
          <Ponto p={{ x: v.b[0], y: v.b[1] }} rotulo="B" />
        </Plano>
      )
    case 'inclinacao':
      return (
        <Plano lim={6} rotulo="Reta e triângulo da inclinação">
          <Line.ThroughPoints point1={v.a} point2={v.b} color="var(--accent)" weight={3} />
          <TrianguloInclinacao a={{ x: v.a[0], y: v.a[1] }} b={{ x: v.b[0], y: v.b[1] }} />
          <Ponto p={{ x: v.a[0], y: v.a[1] }} rotulo="A" />
          <Ponto p={{ x: v.b[0], y: v.b[1] }} rotulo="B" />
        </Plano>
      )
    case 'reta':
      return (
        <Plano lim={6} rotulo="Gráfico de uma reta">
          <RetaMN m={v.m} n={v.n} />
          <Ponto p={{ x: 0, y: v.n }} cor="var(--ink)" rotulo={`n = ${v.n}`} pos="ne" />
        </Plano>
      )
    case 'duasRetas':
      return (
        <Plano lim={6} rotulo="Duas retas perpendiculares">
          <RetaMN m={v.m1} n={v.n1} />
          <RetaMN m={v.m2} n={v.n2} cor="var(--ok)" />
        </Plano>
      )
    case 'circulo':
      return (
        <Plano lim={6} rotulo="Circunferência de centro e raio dados">
          <Circle center={[v.h, v.k]} radius={v.r} color="var(--accent)" fillOpacity={0.08} weight={3} />
          <Point x={v.h} y={v.k} color="var(--accent)" />
          <Text x={v.h} y={v.k} attach="se" attachDistance={10} size={13}>{`C(${v.h}, ${v.k})`}</Text>
        </Plano>
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_GA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="geometria-analitica" />
}
