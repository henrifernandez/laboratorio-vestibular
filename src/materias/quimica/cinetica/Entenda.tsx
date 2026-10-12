import { PASSOS_CIN, type VisualCin } from '@/conteudo/quimica/cinetica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { DiagramaEnergia, GraficoDecaimento, GraficoMB, TabelaExperimentos } from './Visuais'
import { velocidade } from './calculo'

function Fatores() {
  const linhas = [
    { fator: 'Temperatura maior', v: 'aumenta', ea: 'não muda', porque: 'mais colisões com E ≥ Ea' },
    { fator: 'Concentração (ou pressão) maior', v: 'aumenta', ea: 'não muda', porque: 'mais colisões por segundo' },
    { fator: 'Superfície de contato maior', v: 'aumenta', ea: 'não muda', porque: 'mais colisões por segundo' },
    { fator: 'Catalisador', v: 'aumenta', ea: 'diminui', porque: 'caminho com barreira menor' },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto w-full max-w-lg border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th className="py-1 pr-2 font-semibold">Fator</th>
            <th className="py-1 pr-2 font-semibold">Velocidade</th>
            <th className="py-1 pr-2 font-semibold">Energia de ativação</th>
            <th className="py-1 font-semibold">Por quê</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.fator} className="border-b border-[var(--line)]">
              <td className="py-1.5 pr-2">{l.fator}</td>
              <td className="py-1.5 pr-2">{l.v}</td>
              <td className="py-1.5 pr-2 font-semibold" style={{ color: l.ea === 'diminui' ? 'var(--ok)' : undefined }}>{l.ea}</td>
              <td className="py-1.5">{l.porque}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Visual({ v }: { v: VisualCin }) {
  switch (v.tipo) {
    case 'velocidade':
      return (
        <div className="grid gap-1">
          <GraficoDecaimento m0={1} tMeia={2} unidadeT="s" unidadeM="mol/L" tmax={8} marcas={false} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">A curva começa íngreme (reação rápida) e vai ficando horizontal (reação mais lenta) conforme o reagente é consumido.</p>
        </div>
      )
    case 'colisoes':
      return (
        <div className="grid gap-1">
          <GraficoMB curvas={[{ rotulo: 'T baixa', T: 300 }, { rotulo: 'T alta', T: 400 }]} ea={3.5} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">A área sombreada, à direita de Ea, é a fração das moléculas com energia suficiente. Ela cresce com a temperatura.</p>
        </div>
      )
    case 'diagrama':
      return (
        <div className="grid gap-1">
          <DiagramaEnergia d={{ hr: 20, hts: 90, hp: 50 }} reducao={25} setas />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Curva tracejada: com catalisador, o topo desce (Ea menor nos dois sentidos) e ΔH continua o mesmo.</p>
        </div>
      )
    case 'fatores':
      return <Fatores />
    case 'ordem': {
      const exps = [
        { conc: [0.1, 0.1], v: velocidade(2000, [1, 2], [0.1, 0.1]) },
        { conc: [0.2, 0.1], v: velocidade(2000, [1, 2], [0.2, 0.1]) },
        { conc: [0.1, 0.2], v: velocidade(2000, [1, 2], [0.1, 0.2]) },
      ]
      return (
        <div className="grid gap-2">
          <TabelaExperimentos nomes={['A', 'B']} experimentos={exps} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">
            Exp. 1 → 2: [A] dobra e v dobra (2¹): ordem 1 em A. Exp. 1 → 3: [B] dobra e v quadruplica (2²): ordem 2 em B. Ordem global = 3.
          </p>
        </div>
      )
    }
    default:
      return (
        <div className="grid gap-1">
          <GraficoDecaimento m0={80} tMeia={20} unidadeT="min" unidadeM="g" tmax={100} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">A cada 20 min a quantidade cai pela metade: 80, 40, 20, 10, 5, 2,5 g.</p>
        </div>
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_CIN.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="cinetica" />
}
