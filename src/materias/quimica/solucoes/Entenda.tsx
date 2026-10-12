import { PASSOS_SOL, type VisualSol } from '@/conteudo/quimica/solucoes'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { Bequer } from '../comum/Bequer'
import { curva } from './calculo'
import { BarraTitulo, CadeiaBequeres, GraficoSolubilidade } from './Visuais'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

function Visual({ v }: { v: VisualSol }) {
  if (v.tipo === 'bequer') {
    return (
      <div className="grid justify-items-center gap-2">
        <Bequer volume={v.volume} vmax={v.volume * 1.2} intensidade={0.5} particulas={20} descricao={`Béquer com ${f(v.volume, 0)} mL de solução e ${f(v.massa)} g de soluto`} largura={110} />
        <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">
          {f(v.massa)} g de soluto em {f(v.volume, 0)} mL = {f(v.volume / 1000)} L → C = {f(v.massa)} ÷ {f(v.volume / 1000)} = <strong>{f(v.massa / (v.volume / 1000))} g/L</strong>
        </p>
      </div>
    )
  }
  if (v.tipo === 'molar') {
    return (
      <div className="grid gap-2">
        <CadeiaBequeres
          etapas={[
            { rotulo: '1 mol em 1 L', volume: 1000, c: 1 },
            { rotulo: '1 mol em 0,5 L', volume: 500, c: 2 },
          ]}
          ligacoes={['→ evapora metade']}
        />
        <p className="m-0 text-center text-sm text-[var(--ink-muted)]">1 mol de NaCl (58,5 g) tem sempre as mesmas partículas. Em metade do volume, a concentração dobra: 1 mol/L → 2 mol/L.</p>
      </div>
    )
  }
  if (v.tipo === 'titulo') {
    return (
      <div className="grid gap-3">
        <BarraTitulo soluto={20} solucao={100} nomeSoluto="NaOH" />
        <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">
          Com d = 1,2 g/mL: 1 L = 1200 g de solução → 20 % = 240 g de NaOH → 240 ÷ 40 = <strong>6 mol/L</strong>.
        </p>
      </div>
    )
  }
  if (v.tipo === 'diluicao') {
    return (
      <div className="grid gap-2">
        <CadeiaBequeres
          etapas={[
            { rotulo: 'Inicial', volume: 100, c: 6 },
            { rotulo: 'Final', volume: 300, c: 2 },
          ]}
          ligacoes={['+ 200 mL de água']}
        />
        <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">C₁V₁ = C₂V₂ → 6 × 100 = 2 × 300 = 600. Os mesmos pontinhos, num volume 3 vezes maior.</p>
      </div>
    )
  }
  if (v.tipo === 'mistura') {
    return (
      <div className="grid gap-2">
        <CadeiaBequeres
          etapas={[
            { rotulo: '1', volume: 100, c: 1 },
            { rotulo: '2', volume: 300, c: 3 },
            { rotulo: 'Mistura', volume: 400, c: 2.5 },
          ]}
          ligacoes={['+', '=']}
        />
        <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">(1 × 100 + 3 × 300) ÷ 400 = 1000 ÷ 400 = 2,5 mol/L. A média simples (2) erraria.</p>
      </div>
    )
  }
  if (v.tipo === 'curva') {
    return (
      <div className="grid gap-2">
        <GraficoSolubilidade
          curvas={[curva('A')]}
          marcas={[
            { T: 40, S: 30, rotulo: 'insaturada' },
            { T: 40, S: 60, rotulo: 'saturada' },
            { T: 40, S: 90, rotulo: 'corpo de fundo' },
          ]}
        />
        <p className="m-0 text-center text-sm text-[var(--ink-muted)]">A 40 °C o sal A dissolve 60 g por 100 g de água. Abaixo da curva cabe mais; sobre a curva está no limite; acima, o excesso fica no fundo.</p>
      </div>
    )
  }
  return (
    <div className="grid gap-2">
      <GraficoSolubilidade curvas={[curva('A')]} marcas={[{ T: 60, S: 110, rotulo: '60 °C: 110' }, { T: 20, S: 30, rotulo: '20 °C: 30' }]} />
      <p className="num m-0 text-center text-sm text-[var(--ink-muted)]">Em 100 g de água, de 60 °C para 20 °C: 110 − 30 = <strong>80 g</strong> cristalizam.</p>
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_SOL.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="solucoes" />
}
