import { PASSOS_ECOLOGIA, type VisualEcologia } from '@/conteudo/biologia/ecologia'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { CadeiaCausal } from '../../quimica/quimica-verde/Visuais'
import { AMBIENTES_PIRAMIDE, energiaPorNivel, teia, type Teia } from './calculo'
import { GraficoCrescimento, GraficoSeriesLV, TabelaRelacoes } from './GraficosPopulacao'
import { CICLO_CARBONO, CICLO_NITROGENIO, DiagramaCiclo, PiramideBarras, TeiaSvg, legendaMarcas } from './Visuais'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/** Cadeia mínima, tirada da teia do cerrado, só para a primeira etapa. */
const CADEIA_EXEMPLO: Teia = {
  id: 'exemplo',
  nome: 'Cerrado (uma cadeia)',
  bioma: 'Cerrado',
  especies: [
    { id: 'capim', nome: 'Capim', produtor: true },
    { id: 'gafanhoto', nome: 'Gafanhoto' },
    { id: 'seriema', nome: 'Seriema' },
  ],
  come: [
    ['gafanhoto', 'capim'],
    ['seriema', 'gafanhoto'],
  ],
}

const LEGENDA = (texto: string) => <p className="m-0 text-center text-sm text-[var(--ink-muted)]">{texto}</p>

function Visual({ v }: { v: VisualEcologia }) {
  switch (v.tipo) {
    case 'cadeia':
      return (
        <div className="cartao grid gap-2 p-3">
          <TeiaSvg t={CADEIA_EXEMPLO} cadeia={['capim', 'gafanhoto', 'seriema']} rotulo="Cadeia alimentar: capim, gafanhoto e seriema, com setas de quem é comido para quem come" />
          {LEGENDA('Capim (produtor, 1º nível) → gafanhoto (consumidor primário, 2º) → seriema (consumidor secundário, 3º). A seta mostra o caminho da energia.')}
        </div>
      )
    case 'teia': {
      const t = teia('cerrado')
      const marcas = { ema: 'alvo' as const }
      return (
        <div className="cartao grid gap-2 p-3">
          <TeiaSvg t={t} marcas={marcas} rotulo="Teia alimentar do cerrado. A ema está em destaque: come capim e gafanhoto." />
          {LEGENDA('Teia do cerrado (simplificada). A ema, em destaque, come capim e gafanhoto: ocupa dois níveis.')}
          {legendaMarcas(marcas)}
        </div>
      )
    }
    case 'energia': {
      const e = energiaPorNivel(10_000, 0.1, 4)
      const nomes = ['Produtores', 'Cons. primário', 'Cons. secundário', 'Cons. terciário']
      return (
        <div className="cartao grid gap-2 p-3">
          <PiramideBarras titulo="Pirâmide de energia (kJ por ano), com 10 % de transferência" itens={e.map((v, i) => ({ rotulo: nomes[i] as string, valor: v, texto: `${f(v, 0)} kJ` }))} />
          {LEGENDA('Valores ilustrativos. A largura de cada barra é proporcional à energia.')}
        </div>
      )
    }
    case 'piramides': {
      const [, arvore, mar] = AMBIENTES_PIRAMIDE
      const e = energiaPorNivel(10_000, 0.1, 3)
      return (
        <div className="cartao grid gap-4 p-3">
          <PiramideBarras titulo="Energia: nunca invertida" itens={e.map((v, i) => ({ rotulo: ['Produtores', 'Primário', 'Secundário'][i] as string, valor: v, texto: `${f(v, 0)} kJ` }))} />
          <PiramideBarras titulo="Biomassa no mar, num instante: invertida" itens={mar!.niveis.map((n, i) => ({ rotulo: n, valor: mar!.biomassa[i] as number, texto: `${f(mar!.biomassa[i] as number, 0)} g/m²` }))} cor="var(--aviso)" />
          <PiramideBarras titulo="Números numa árvore: invertida" itens={arvore!.niveis.map((n, i) => ({ rotulo: n, valor: arvore!.numeros[i] as number, texto: f(arvore!.numeros[i] as number, 0) }))} cor="var(--ink-muted)" />
          {LEGENDA('Valores ilustrativos, para mostrar a forma de cada pirâmide.')}
        </div>
      )
    }
    case 'acumulo': {
      const c = [0.01, 0.1, 1, 10]
      const nomes = ['Produtor', 'Cons. primário', 'Cons. secundário', 'Predador de topo']
      return (
        <div className="cartao grid gap-2 p-3">
          <PiramideBarras titulo="Concentração de um poluente persistente (mg/kg), com fator ×10 por nível" itens={c.map((v, i) => ({ rotulo: nomes[i] as string, valor: v, texto: `${f(v, 2)} mg/kg` }))} cor="var(--erro)" />
          {LEGENDA('Valores ilustrativos. A energia diminui de nível em nível, mas a concentração do poluente aumenta.')}
        </div>
      )
    }
    case 'carbono':
      return (
        <div className="cartao grid gap-2 p-3">
          <DiagramaCiclo nos={CICLO_CARBONO.nos} setas={CICLO_CARBONO.setas} altura={CICLO_CARBONO.altura} rotulo="Ciclo do carbono: fotossíntese leva CO₂ do ar aos produtores; respiração, decomposição e combustão devolvem CO₂ à atmosfera; restos soterrados formam combustíveis fósseis" />
          {LEGENDA('Esquema simplificado do ciclo do carbono.')}
        </div>
      )
    case 'nitrogenio':
      return (
        <div className="cartao grid gap-2 p-3">
          <DiagramaCiclo nos={CICLO_NITROGENIO.nos} setas={CICLO_NITROGENIO.setas} altura={CICLO_NITROGENIO.altura} rotulo="Ciclo do nitrogênio: fixação leva N₂ ao amônio; nitrificação forma nitrato; plantas assimilam; animais comem; decompositores liberam amônio; desnitrificação devolve N₂ ao ar" />
          {LEGENDA('Esquema simplificado do ciclo do nitrogênio.')}
        </div>
      )
    case 'relacoes':
      return <TabelaRelacoes />
    case 'crescimento':
      return (
        <div className="cartao grid gap-2 p-3">
          <GraficoCrescimento />
          {LEGENDA('Mesmo tamanho inicial e mesma taxa: sem limites a população explode; com resistência ambiental, ela estabiliza em K.')}
        </div>
      )
    case 'presapredador':
      return (
        <div className="cartao grid gap-2 p-3">
          <GraficoSeriesLV />
          {LEGENDA('Modelo simplificado: o pico de predadores vem depois do pico de presas.')}
        </div>
      )
    default:
      return (
        <CadeiaCausal
          etapas={[
            { titulo: 'Rocha nua', texto: 'Sem solo e sem vida: ponto de partida da sucessão primária.' },
            { titulo: 'Pioneiras', texto: 'Líquens e musgos colonizam a rocha e, ao morrer, formam as primeiras camadas de solo.' },
            { titulo: 'Ervas e arbustos', texto: 'Com solo e sombra, outras espécies chegam e o ambiente muda.' },
            { titulo: 'Árvores', texto: 'A diversidade e a biomassa aumentam, e as teias ficam mais complexas.' },
            { titulo: 'Comunidade clímax', texto: 'Estágio final, relativamente estável.' },
          ]}
        />
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_ECOLOGIA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="ecologia" />
}
