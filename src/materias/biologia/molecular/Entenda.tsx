import { PASSOS_MOLECULAR, type VisualMolecular } from '@/conteudo/biologia/molecular'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { BarrasClasses } from '../comum/Barras'
import { CadeiaCausal } from '../../quimica/quimica-verde/Visuais'
import { fragmentos, traduzir } from './calculo'
import { DnaSvg, ForquilhaSvg, GelSvg, GradeMeselson, LacSvg, MapaRestricaoSvg, Peptideo, PerfilTermicoSvg, ProcessamentoSvg, SequenciaAlinhada, TabelaCodons } from './Visuais'

const LEGENDA = (texto: string) => <p className="m-0 text-center text-sm text-[var(--ink-muted)]">{texto}</p>

const NORMAL = 'ATGGTGCACCTGACTCCTGAGGAGTAA'
const FALCIFORME = 'ATGGTGCACCTGACTCCTGTGGAGTAA'

function Visual({ v }: { v: VisualMolecular }) {
  switch (v.tipo) {
    case 'dna':
      return (
        <div className="cartao grid gap-2 p-3">
          <DnaSvg />
          {LEGENDA('As duas fitas são antiparalelas e se unem por ligações de hidrogênio entre bases complementares.')}
        </div>
      )
    case 'chargaff':
      return (
        <div className="cartao grid gap-2 p-3">
          <BarrasClasses
            titulo="DNA de fita dupla com 30 % de adenina"
            itens={[
              { rotulo: 'A (adenina)', valor: 30 },
              { rotulo: 'T (timina)', valor: 30 },
              { rotulo: 'G (guanina)', valor: 20, cor: 'var(--aviso)' },
              { rotulo: 'C (citosina)', valor: 20, cor: 'var(--aviso)' },
            ]}
            max={40}
          />
          {LEGENDA('A = T e G = C; as quatro porcentagens somam 100 %.')}
        </div>
      )
    case 'meselson':
      return (
        <div className="cartao grid gap-2 p-3">
          <GradeMeselson modelo="semiconservativa" />
          {LEGENDA('Tubos de gradiente de densidade (leve no alto, pesado embaixo). A hipótese semiconservativa prevê exatamente o que foi observado, em todas as gerações.')}
        </div>
      )
    case 'forquilha':
      return (
        <div className="cartao grid gap-2 p-3">
          <ForquilhaSvg />
          {LEGENDA('Esquema simplificado da forquilha de replicação.')}
        </div>
      )
    case 'transcricao':
      return (
        <div className="cartao grid gap-2 p-3">
          <SequenciaAlinhada codificadora="ATGCCTAAA" />
          {LEGENDA('O mRNA é complementar à fita molde e igual à codificadora (com U no lugar de T).')}
        </div>
      )
    case 'processamento':
      return (
        <div className="cartao grid gap-2 p-3">
          <ProcessamentoSvg />
          {LEGENDA('Pré-mRNA: ainda tem íntrons. mRNA maduro: só éxons, com quepe e cauda poli-A.')}
        </div>
      )
    case 'codigo':
      return (
        <div className="cartao grid gap-2 p-3">
          <TabelaCodons destaque={['AUG']} />
          {LEGENDA('Em vermelho: códons de parada. AUG (em destaque) é o códon de iniciação e codifica metionina.')}
        </div>
      )
    case 'mutacoes': {
      const o = traduzir(NORMAL.replace(/T/g, 'U')).peptideo
      const m = traduzir(FALCIFORME.replace(/T/g, 'U')).peptideo
      return (
        <div className="cartao grid gap-3 p-3">
          <p className="m-0 text-sm font-semibold text-[var(--ink-muted)]">Início do gene da cadeia β da hemoglobina (simplificado): GAG → GTG</p>
          <SequenciaAlinhada codificadora={FALCIFORME} destaque={[19]} mostrarMolde={false} />
          <Peptideo rotulo="Peptídeo normal" aminoacidos={o} />
          <Peptideo rotulo="Peptídeo com a mutação" aminoacidos={m} referencia={o} />
          {LEGENDA('A troca de uma só base mudou um aminoácido (Glu → Val): mutação de troca de sentido.')}
        </div>
      )
    }
    case 'lac':
      return (
        <div className="cartao grid gap-2 p-3">
          <LacSvg lactose glicose={false} mutacao="nenhuma" />
          {LEGENDA('Com lactose e sem glicose: o repressor está inativo e o complexo CAP–AMPc ajuda a RNA polimerase.')}
        </div>
      )
    case 'restricao': {
      const cortes = [1, 3.5]
      return (
        <div className="cartao grid gap-3 p-3">
          <MapaRestricaoSvg tamanho={6} cortes={cortes} circular enzima="EcoRI" />
          <GelSvg faixas={[{ rotulo: 'Intacto', tamanhos: [6] }, { rotulo: 'EcoRI', tamanhos: fragmentos(6, cortes, true) }]} />
          {LEGENDA('Plasmídeo circular de 6 kb com 2 cortes: 2 fragmentos (3,5 e 2,5 kb). Os menores migram mais no gel.')}
        </div>
      )
    }
    case 'pcr':
      return (
        <div className="cartao grid gap-2 p-3">
          <PerfilTermicoSvg ciclos={3} />
          {LEGENDA('Cada ciclo: desnaturação (~95 °C), anelamento dos primers (~55 °C) e extensão (~72 °C). A cada ciclo, o número de moléculas dobra.')}
        </div>
      )
    default:
      return (
        <CadeiaCausal
          etapas={[
            { titulo: 'Cortar', texto: 'A mesma enzima de restrição corta o gene de interesse e o plasmídeo.' },
            { titulo: 'Unir', texto: 'A DNA ligase une o gene ao plasmídeo: surge o plasmídeo recombinante.' },
            { titulo: 'Transformar', texto: 'O plasmídeo é introduzido nas bactérias.' },
            { titulo: 'Selecionar', texto: 'Em meio com antibiótico, só sobrevivem as bactérias que receberam o plasmídeo.' },
            { titulo: 'Produzir', texto: 'As bactérias transformadas transcrevem e traduzem o gene e produzem a proteína, como a insulina humana.' },
          ]}
        />
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_MOLECULAR.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="molecular" />
}
