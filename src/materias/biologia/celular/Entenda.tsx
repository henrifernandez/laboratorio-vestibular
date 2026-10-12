import { PASSOS_CELULAR, type VisualCelular } from '@/conteudo/biologia/celular'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { CadeiaCausal } from '../../quimica/quimica-verde/Visuais'
import { BicamadaSvg, GraficoDna, MembranaSvg, PainelCelulaLivre, SequenciaDeFases, TabelaPresenca, TabelaTransportes, TresEstadosOsmose } from './Visuais'
import { CurvaEnzimaSvg, CurvaLuzSvg } from './VisuaisEnergia'

const LEGENDA = (texto: string) => <p className="m-0 text-center text-sm text-[var(--ink-muted)]">{texto}</p>

const LINHAS_COMPARACAO: [string, string, string][] = [
  ['Células-filhas', '2, geneticamente idênticas', '4, geneticamente diferentes'],
  ['Cromossomos nas células-filhas', 'o mesmo número da mãe (2n → 2n)', 'metade (2n → n)'],
  ['Divisões do núcleo', '1', '2 (meiose I e meiose II)'],
  ['Duplicação do DNA', '1 vez, antes da divisão', '1 vez, antes da meiose I'],
  ['Homólogos', 'não se emparelham', 'emparelham-se na prófase I e se separam na anáfase I'],
  ['Onde ocorre', 'células somáticas', 'células germinativas'],
  ['Para que serve', 'crescimento, renovação e reprodução assexuada', 'formação de gametas ou esporos e variabilidade'],
]

function TabelaMitoseMeiose() {
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Mitose e meiose</caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2">Característica</th>
            <th scope="col" className="px-1">Mitose</th>
            <th scope="col" className="px-1">Meiose</th>
          </tr>
        </thead>
        <tbody>
          {LINHAS_COMPARACAO.map(([c, a, b]) => (
            <tr key={c} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1 pr-2 text-left font-semibold">{c}</th>
              <td className="px-1">{a}</td>
              <td className="px-1">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Visual({ v }: { v: VisualCelular }) {
  switch (v.tipo) {
    case 'comparacao':
      return (
        <div className="cartao p-3">
          <TabelaPresenca />
        </div>
      )
    case 'energia':
      return <PainelCelulaLivre tipoInicial="vegetal" />
    case 'secretoria':
      return (
        <CadeiaCausal
          etapas={[
            { titulo: 'Ribossomo', texto: 'Os ribossomos aderidos ao retículo rugoso sintetizam a proteína.' },
            { titulo: 'Retículo rugoso', texto: 'A proteína entra no retículo, onde é dobrada, e segue em uma vesícula.' },
            { titulo: 'Complexo de Golgi', texto: 'O Golgi modifica, empacota e distribui a proteína.' },
            { titulo: 'Vesícula de secreção', texto: 'Uma vesícula leva a proteína até a membrana plasmática.' },
            { titulo: 'Exocitose', texto: 'A vesícula se funde com a membrana e libera a proteína para fora da célula.' },
          ]}
        />
      )
    case 'bicamada':
      return (
        <div className="cartao grid gap-2 p-3">
          <BicamadaSvg />
          {LEGENDA('Esquema do mosaico fluido: bicamada de fosfolipídios com proteínas inseridas.')}
        </div>
      )
    case 'transporte':
      return (
        <div className="grid gap-3">
          <div className="cartao p-3">
            <TabelaTransportes />
          </div>
          <div className="cartao grid gap-2 p-3">
            <MembranaSvg dentro={12} fora={145} unidade="mmol/L" sentido="sai" substancia="íons Na⁺ expulsos pela bomba de sódio e potássio" />
            {LEGENDA('O Na⁺ sai da célula contra o gradiente (de 12 para 145 mmol/L): transporte ativo.')}
          </div>
        </div>
      )
    case 'osmose':
      return (
        <div className="grid gap-3">
          <div className="cartao grid gap-2 p-3">
            <p className="m-0 text-sm font-semibold text-[var(--ink-muted)]">Hemácia (célula animal, sem parede)</p>
            <TresEstadosOsmose celula="hemacia" />
          </div>
          <div className="cartao grid gap-2 p-3">
            <p className="m-0 text-sm font-semibold text-[var(--ink-muted)]">Célula vegetal (com parede celular)</p>
            <TresEstadosOsmose celula="vegetal" />
          </div>
        </div>
      )
    case 'ciclo':
      return (
        <div className="cartao grid gap-2 p-3">
          <GraficoDna tipo="mitose" atual="S/G2" />
          {LEGENDA('O DNA por célula dobra na fase S (de 2 C para 4 C) e volta a 2 C quando a célula se divide.')}
        </div>
      )
    case 'mitose':
      return (
        <div className="cartao p-3">
          <SequenciaDeFases tipo="mitose" fases={['Prófase', 'Metáfase', 'Anáfase', 'Telófase']} />
        </div>
      )
    case 'meiose':
      return (
        <div className="cartao p-3">
          <SequenciaDeFases tipo="meiose" fases={['Metáfase I', 'Anáfase I', 'Telófase I', 'Metáfase II', 'Anáfase II', 'Telófase II']} />
        </div>
      )
    case 'comparacaoDivisao':
      return <TabelaMitoseMeiose />
    case 'respiracao':
      return (
        <CadeiaCausal
          etapas={[
            { titulo: 'Glicólise (citosol)', texto: 'Glicose → 2 piruvato, com saldo de 2 ATP. Não precisa de O₂.' },
            { titulo: 'Com O₂: Krebs (matriz)', texto: 'O piruvato é oxidado e libera CO₂, formando carregadores de elétrons (NADH, FADH₂).' },
            { titulo: 'Com O₂: cadeia respiratória (cristas)', texto: 'Os elétrons passam até o O₂, que forma água; a maior parte do ATP é produzida aqui.' },
            { titulo: 'Sem O₂: fermentação', texto: 'O piruvato vira etanol + CO₂ (alcoólica) ou lactato (lática). Rende só os 2 ATP da glicólise.' },
          ]}
        />
      )
    case 'fotossintese':
      return (
        <div className="grid gap-3">
          <CadeiaCausal
            etapas={[
              { titulo: 'Luz', texto: 'A clorofila absorve a luz nos tilacoides do cloroplasto.' },
              { titulo: 'Fase clara', texto: 'A água é quebrada: libera O₂ e forma ATP e NADPH.' },
              { titulo: 'Ciclo de Calvin (estroma)', texto: 'O CO₂ é fixado e, com o ATP e o NADPH, forma a glicose.' },
            ]}
          />
          <div className="cartao grid gap-2 p-3">
            <CurvaLuzSvg pmax={24} k={60} r={6} mostrarIc />
            {LEGENDA('Resposta à luz: a fotossíntese bruta (curva verde) cresce e satura; onde ela cruza a respiração (linha vermelha) está o ponto de compensação.')}
          </div>
        </div>
      )
    default:
      return (
        <div className="cartao grid gap-2 p-3">
          <CurvaEnzimaSvg otima={37} desnaturacao={62} />
          {LEGENDA('Atividade de uma enzima: sobe até a temperatura ótima e cai a zero quando a enzima desnatura.')}
        </div>
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_CELULAR.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="celular" />
}
