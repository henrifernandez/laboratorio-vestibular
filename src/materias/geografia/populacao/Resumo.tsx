import { RESUMO_POPULACAO } from '@/conteudo/geografia/populacao'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_POPULACAO} />
}
