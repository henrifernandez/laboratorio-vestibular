import { RESUMO_FUSOS } from '@/conteudo/geografia/fusos'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_FUSOS} />
}
