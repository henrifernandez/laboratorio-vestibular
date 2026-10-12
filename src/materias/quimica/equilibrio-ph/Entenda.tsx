import { PASSOS_EQ, type VisualEq } from '@/conteudo/quimica/equilibrio-ph'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { Formula } from '../comum/Formula'
import { BarrasEspecies } from '../estequiometria/Visuais'
import { deslocamento, hAcidoFraco, reacaoEq } from './calculo'
import { EquilibrioDinamico } from './EquilibrioDinamico'
import { CurvaTitulacao, EscalaPh, TabelaIce } from './Visuais'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

const NOME_SENTIDO = { direta: 'Direita (mais NH₃)', inversa: 'Esquerda (menos NH₃)', nenhum: 'Não desloca' } as const

function TabelaChatelier() {
  const r = reacaoEq('haber')
  const linhas = [
    { acao: 'Acrescentar N₂', p: { tipo: 'add', especie: 0 } as const },
    { acao: 'Acrescentar NH₃', p: { tipo: 'add', especie: 2 } as const },
    { acao: 'Aumentar a pressão', p: { tipo: 'P', aumenta: true } as const },
    { acao: 'Aumentar a temperatura', p: { tipo: 'T', sobe: true } as const },
    { acao: 'Adicionar catalisador', p: { tipo: 'cat' } as const },
  ]
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto w-full max-w-md border-collapse text-left">
        <caption className="pb-1 text-left text-sm text-[var(--ink-muted)]">
          <Formula f="N2" />(g) + 3 <Formula f="H2" />(g) ⇌ 2 <Formula f="NH3" />(g), ΔH &lt; 0
        </caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)]">
            <th className="py-1 pr-2 font-semibold">Perturbação</th>
            <th className="py-1 font-semibold">O equilíbrio…</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.acao} className="border-b border-[var(--line)]">
              <td className="py-1.5 pr-2">{l.acao}</td>
              <td className="py-1.5">{NOME_SENTIDO[deslocamento(r, l.p).sentido]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Visual({ v }: { v: VisualEq }) {
  switch (v.tipo) {
    case 'dinamico':
      return <EquilibrioDinamico />
    case 'kc':
      return <TabelaIce />
    case 'chatelier':
      return <TabelaChatelier />
    case 'forcas': {
      const h = hAcidoFraco(1.8e-5, 0.1)
      return (
        <div className="mx-auto grid w-full max-w-md gap-2">
          <BarrasEspecies
            titulo="Fração de ácido ionizado em soluções 0,1 mol/L"
            max={100}
            itens={[
              { rotulo: 'HCl', nome: 'Ácido clorídrico, ácido forte', valor: 100, texto: '≈ 100 %', cor: 'var(--accent)' },
              { rotulo: 'CH₃COOH', nome: 'Ácido acético, ácido fraco', valor: (h / 0.1) * 100, texto: `≈ ${f((h / 0.1) * 100, 1)} %`, cor: 'var(--aviso)' },
            ]}
          />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Com a mesma concentração, o ácido forte tem [H⁺] ≈ 0,1 mol/L (pH 1) e o fraco, cerca de {f(h * 1000, 2)} × 10⁻³ mol/L (pH ≈ {f(-Math.log10(h), 1)}).</p>
        </div>
      )
    }
    case 'escala':
      return (
        <div className="grid gap-1">
          <EscalaPh
            orientacao="vertical"
            marcadores={[
              { ph: 2, rotulo: 'limão' },
              { ph: 5.6, rotulo: 'chuva' },
              { ph: 7, rotulo: 'água pura' },
              { ph: 8.3, rotulo: 'bicarbonato' },
              { ph: 12, rotulo: 'água sanitária' },
            ]}
          />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Valores aproximados, que variam com a marca e a concentração.</p>
        </div>
      )
    default:
      return (
        <div className="grid gap-3">
          <figure className="m-0 grid gap-1">
            <CurvaTitulacao t={{ ca: 0.1, va: 25, ka: null, cb: 0.1 }} />
            <figcaption className="text-center text-sm text-[var(--ink-muted)]">Ácido forte × base forte: salto em torno de pH 7.</figcaption>
          </figure>
          <figure className="m-0 grid gap-1">
            <CurvaTitulacao t={{ ca: 0.1, va: 25, ka: 1.8e-5, cb: 0.1 }} />
            <figcaption className="text-center text-sm text-[var(--ink-muted)]">Ácido acético (fraco) × base forte: equivalência em pH ≈ 8,7.</figcaption>
          </figure>
        </div>
      )
  }
}

const PASSOS: PassoEntenda[] = PASSOS_EQ.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="equilibrio-ph" />
}
