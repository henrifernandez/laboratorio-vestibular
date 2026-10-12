import { RESUMO_PLACAS } from '@/conteudo/geografia/placas'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_PLACAS} />
}
