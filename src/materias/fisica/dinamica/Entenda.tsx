import { PASSOS_DIN, type VisualDin } from '@/conteudo/fisica/dinamica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { atwood } from './calculo'
import { diagrama } from './dcl'
import { FiguraDCL, MesaForcas, Rampa, SistemaPolia, setasDoPlano } from './Visuais'
import { OnibusInercia, PatinadoresAnimados, ParesLivroMesa } from './VisuaisNewton'

function Visual({ v }: { v: VisualDin }) {
  if (v.tipo === 'onibus') return <OnibusInercia />
  if (v.tipo === 'patinadores') return <PatinadoresAnimados mA={v.mA} mB={v.mB} F={v.F} dt={v.dt} />
  if (v.tipo === 'pares') return <ParesLivroMesa />
  if (v.tipo === 'mesa') return <MesaForcas F={v.F} m={v.m} mu={v.mu} />
  if (v.tipo === 'dcl') {
    const g = diagrama.gabarito(v.cenario)
    return <FiguraDCL cenario={v.cenario} resposta={g} />
  }
  if (v.tipo === 'plano') {
    const { setas } = setasDoPlano(v.angulo, v.m, v.mu, { componentes: v.componentes })
    return (
      <div className="mx-auto w-full max-w-md">
        <Rampa angulo={v.angulo} setas={setas} textoBloco={`${v.m} kg`} rotulo={`Plano inclinado de ${v.angulo} graus com as forças sobre um bloco de ${v.m} quilogramas e a decomposição do peso`} />
        <p className="text-center text-sm text-[var(--ink-muted)]">Setas tracejadas: as duas componentes do peso (ao longo do plano e perpendicular a ele).</p>
      </div>
    )
  }
  const r = atwood(v.m1, v.m2)
  return <SistemaPolia tipo="atwood" m1={v.m1} m2={v.m2} setas aceleracao={r.a} tracao={r.T} rotulo={`Máquina de Atwood com blocos de ${v.m1} e ${v.m2} quilogramas: tração para cima e peso para baixo em cada bloco`} />
}

const PASSOS: PassoEntenda[] = PASSOS_DIN.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="dinamica" />
}
