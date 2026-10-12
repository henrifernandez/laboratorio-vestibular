import { RESUMO_FENOMENOS } from '@/conteudo/geografia/fenomenos'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_FENOMENOS} />
}
