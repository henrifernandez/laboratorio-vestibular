import { PASSOS_VERDE, type VisualVerde } from '@/conteudo/quimica/quimica-verde'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { Formula } from '../comum/Formula'
import { EscalaPh } from '../equilibrio-ph/Visuais'
import { BarrasEspecies } from '../estequiometria/Visuais'
import { COMBUSTIVEIS, co2PorMJ, economiaAtomica, reacaoVerde } from './calculo'
import { CadeiaCausal, DiagramaEstufa } from './Visuais'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

function Visual({ v }: { v: VisualVerde }) {
  switch (v.tipo) {
    case 'combustao':
      return (
        <div className="mx-auto grid w-full max-w-md gap-2">
          <BarrasEspecies
            titulo="Gramas de CO₂ emitidos por megajoule de energia"
            max={70}
            itens={COMBUSTIVEIS.map((c) => ({ rotulo: <Formula f={c.formula} />, nome: c.nome, valor: co2PorMJ(c), texto: `${f(co2PorMJ(c), 1)} g/MJ`, cor: c.id === 'metano' ? 'var(--ok)' : 'var(--accent)' }))}
          />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Calculado a partir das equações e das entalpias de combustão (valores de tabela arredondados). Mais H por C, menos CO₂ por energia.</p>
        </div>
      )
    case 'estufa':
      return (
        <div className="grid gap-1">
          <DiagramaEstufa albedo={0.3} eps={0.78} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Modelo simplificado (W/m², média global): o que entra do Sol sai de volta ao espaço, mas a atmosfera devolve parte do infravermelho e aquece a superfície.</p>
        </div>
      )
    case 'chuva':
      return (
        <div className="grid gap-1">
          <EscalaPh marcadores={[{ ph: 4.5, rotulo: 'chuva ácida' }, { ph: 5.6, rotulo: 'chuva natural' }, { ph: 7, rotulo: 'água pura' }]} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Abaixo de 5,6, a chuva é considerada ácida (valores típicos entre 4 e 5).</p>
        </div>
      )
    case 'ozonio':
      return (
        <CadeiaCausal
          etapas={[
            { titulo: 'O CFC chega à estratosfera', texto: 'Gases estáveis, usados em geladeiras e aerossóis, sobem sem reagir.' },
            { titulo: 'O ultravioleta o quebra', texto: 'CF₂Cl₂ → CF₂Cl· + Cl·: surge o átomo de cloro.' },
            { titulo: 'O cloro ataca o ozônio', texto: 'Cl· + O₃ → ClO· + O₂.' },
            { titulo: 'O cloro é regenerado', texto: 'ClO· + O → Cl· + O₂. O Cl· volta ao passo anterior e destrói outro O₃.' },
          ]}
        />
      )
    case 'eutrofizacao':
      return (
        <CadeiaCausal
          etapas={[
            { titulo: 'Excesso de nutrientes', texto: 'Esgoto e fertilizantes levam nitrogênio e fósforo ao lago.' },
            { titulo: 'Proliferação de algas', texto: 'A água fica esverdeada e a luz não chega ao fundo.' },
            { titulo: 'Morte das algas', texto: 'A matéria orgânica se acumula no fundo.' },
            { titulo: 'Decomposição consome O₂', texto: 'Bactérias aeróbicas usam o oxigênio dissolvido para decompor tudo.' },
            { titulo: 'Morte de peixes', texto: 'Sem oxigênio dissolvido, os organismos aeróbicos morrem.' },
          ]}
        />
      )
    default: {
      const r = reacaoVerde('esterificacao')
      return (
        <div className="mx-auto grid w-full max-w-md gap-2">
          <BarrasEspecies
            titulo="Massa dos reagentes e dos produtos, em gramas"
            max={106}
            itens={[
              { rotulo: 'Reagentes', nome: 'Reagentes (etanol e ácido acético)', valor: 106, texto: '46 + 60 = 106 g', cor: 'var(--line-strong)' },
              { rotulo: 'Éster', nome: 'Acetato de etila, produto desejado', valor: 88, texto: '88 g', cor: 'var(--ok)' },
              { rotulo: 'Água', nome: 'Água, subproduto', valor: 18, texto: '18 g', cor: 'var(--aviso)' },
            ]}
          />
          <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">
            Economia atômica = 88 ÷ 106 × 100 = {f(economiaAtomica(r), 1)} %. Fator E (rendimento 100 %) = 18 ÷ 88 ≈ {f(18 / 88, 2)}.
          </p>
        </div>
      )
    }
  }
}

const PASSOS: PassoEntenda[] = PASSOS_VERDE.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="quimica-verde" />
}
