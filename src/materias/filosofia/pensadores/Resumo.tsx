import { RESUMO_FILOSOFIA } from '@/conteudo/filosofia/pensadores'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_FILOSOFIA} />
}
