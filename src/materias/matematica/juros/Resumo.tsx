import { RESUMO_JUROS } from '@/conteudo/matematica/juros'
import { ResumoSecoes } from '@/componentes/ResumoSecoes'

export default function Resumo() {
  return <ResumoSecoes secoes={RESUMO_JUROS} />
}
