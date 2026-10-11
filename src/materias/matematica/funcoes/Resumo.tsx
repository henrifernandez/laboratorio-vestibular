import { RESUMO_FUNCOES } from '@/conteudo/matematica/funcoes'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_FUNCOES} />
}
