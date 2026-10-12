import { RESUMO_HISTORIA } from '@/conteudo/historia/linhaDoTempo'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_HISTORIA} />
}
