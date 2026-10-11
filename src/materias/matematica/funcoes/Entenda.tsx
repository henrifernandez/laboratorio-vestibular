import { PASSOS_ENTENDA } from '@/conteudo/matematica/funcoes'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { Tex } from '@/componentes/Tex'
import { useFuncaoAnimada } from './animar'
import { GraficoFuncao } from './GraficoFuncao'
import { JANELAS } from './janelas'
import { formulaTex, type Funcao } from './modelo'
import type { Realce } from '@/conteudo/matematica/funcoes'

function VisualPasso({ funcao, realces, indice }: { funcao: Funcao; realces: Realce[]; indice: number }) {
  const animada = useFuncaoAnimada(funcao)
  return (
    <>
      <GraficoFuncao funcao={funcao} curva={animada} janela={JANELAS[funcao.tipo]} realces={realces} rotulo={`Gráfico de ${funcao.tipo}, etapa ${indice + 1}`} />
      <div className="cartao p-3 text-center text-lg">
        <Tex>{formulaTex(funcao)}</Tex>
      </div>
    </>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_ENTENDA.map((p, i) => ({
  titulo: p.titulo,
  texto: p.texto,
  pare: p.pare,
  visual: <VisualPasso key={p.titulo} funcao={p.funcao} realces={p.realces} indice={i} />,
}))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="funcoes" />
}
