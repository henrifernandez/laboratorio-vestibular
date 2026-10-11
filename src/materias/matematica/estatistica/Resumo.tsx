import { RESUMO_ESTAT } from '@/conteudo/matematica/estatistica'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_ESTAT} />
}
