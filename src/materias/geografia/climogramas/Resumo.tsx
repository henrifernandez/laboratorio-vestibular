import { RESUMO_CLIMOGRAMAS } from '@/conteudo/geografia/climogramas'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_CLIMOGRAMAS} />
}
