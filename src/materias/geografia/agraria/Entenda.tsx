import { NOTA_MODELO_AGRARIA, PASSOS_AGRARIA, SISTEMAS, type PassoAgraria } from '@/conteudo/geografia/agraria'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { giniDeFaixas, pontosLorenz, type FaixaFundiaria } from './calculo'
import { BarrasProducao, LorenzSvg, TabelaFaixas, TabelaSistemas } from './Visuais'

const EXEMPLO: FaixaFundiaria[] = [
  { estabelecimentos: 60, area: 5 },
  { estabelecimentos: 30, area: 25 },
  { estabelecimentos: 10, area: 70 },
]

const LINHA_DO_TEMPO: { ano: string; texto: string }[] = [
  { ano: '1850', texto: 'Lei de Terras: a terra pública só pode ser obtida por compra.' },
  { ano: '1964', texto: 'Estatuto da Terra: define reforma agrária e função social da propriedade.' },
  { ano: '1973', texto: 'Criação da Embrapa, que adapta variedades e solos ao Cerrado.' },
  { ano: '1975', texto: 'Criação da Comissão Pastoral da Terra (CPT).' },
  { ano: '1984', texto: 'Fundação do Movimento dos Trabalhadores Rurais Sem Terra (MST).' },
  { ano: '1988', texto: 'Constituição: função social da terra (art. 186) e desapropriação com títulos da dívida agrária (art. 184).' },
  { ano: '1996', texto: 'Criação do Pronaf, crédito para a agricultura familiar.' },
  { ano: '2006', texto: 'Lei da Agricultura Familiar (Lei 11.326).' },
]

function Visual({ v }: { v: PassoAgraria['visual'] }) {
  switch (v) {
    case 'sistemas':
      return <TabelaSistemas sistemas={SISTEMAS.slice(0, 6)} />
    case 'intensivo':
      return (
        <div className="grid gap-3">
          <figure className="m-0 grid gap-1">
            <BarrasProducao area0={100} prod0={2} area1={200} prod1={2} />
            <figcaption className="text-sm">Extensivo: a produção dobra porque a área dobra.</figcaption>
          </figure>
          <figure className="m-0 grid gap-1">
            <BarrasProducao area0={100} prod0={2} area1={100} prod1={4} />
            <figcaption className="text-sm">Intensivo: a produção dobra com a mesma área, porque cada hectare produz o dobro.</figcaption>
          </figure>
        </div>
      )
    case 'verde':
      return (
        <figure className="m-0 grid gap-1">
          <BarrasProducao area0={100} prod0={2} area1={120} prod1={5} />
          <figcaption className="text-sm">Exemplo modelo: com 20% a mais de área e 150% a mais de produtividade, a produção sobe 200%. Quase todo o crescimento vem da produtividade. {NOTA_MODELO_AGRARIA}</figcaption>
        </figure>
      )
    case 'lorenz':
      return (
        <div className="grid gap-3">
          <LorenzSvg pontos={pontosLorenz(EXEMPLO)} gini={giniDeFaixas(EXEMPLO)} marcar titulo="de uma região modelo" />
          <TabelaFaixas faixas={EXEMPLO} />
        </div>
      )
    case 'leis':
      return (
        <ol className="m-0 grid list-none gap-2 p-0">
          {LINHA_DO_TEMPO.map((l) => (
            <li key={l.ano} className="cartao grid grid-cols-[3.5rem_1fr] gap-2 p-2">
              <strong className="num">{l.ano}</strong>
              <span className="text-sm">{l.texto}</span>
            </li>
          ))}
        </ol>
      )
    case 'fronteira':
      return (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {[
            ['Cerrado', 'solos ácidos corrigidos com calcário e adubação; soja, milho e algodão'],
            ['MATOPIBA', 'Maranhão, Tocantins, Piauí e Bahia: fronteira agrícola recente'],
            ['Sul da Amazônia', 'pecuária e lavouras avançam sobre a floresta'],
            ['Práticas de menor impacto', 'plantio direto, dupla safra, integração lavoura-pecuária-floresta, agroecologia'],
          ].map(([t, d]) => (
            <li key={t} className="cartao p-3">
              <p className="m-0 font-semibold">{t}</p>
              <p className="m-0 text-sm">{d}</p>
            </li>
          ))}
        </ul>
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_AGRARIA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return (
    <div className="grid gap-2">
      <EntendaPassos passos={PASSOS} idTema="agraria" />
      <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MODELO_AGRARIA}</p>
    </div>
  )
}
