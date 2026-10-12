import { PASSOS_EST, type VisualEst } from '@/conteudo/quimica/estequiometria'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { Formula } from '../comum/Formula'
import { coefDe, limitante, reacao } from './calculo'
import { BarrasEspecies, Equacao, EtapasProporcao, PonteMol, PontosAtomos } from './Visuais'

const f = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

function Visual({ v }: { v: VisualEst }) {
  if (v.tipo === 'conservacao') {
    const r = reacao(v.reacao)
    return (
      <div className="grid gap-2">
        <Equacao r={r} coefs={v.coefs} tamanho="grande" />
        <PontosAtomos r={r} coefs={v.coefs} />
        <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Cada pontinho é um átomo. Do lado esquerdo e do direito, a quantidade de cada elemento é a mesma.</p>
      </div>
    )
  }
  if (v.tipo === 'mol') return <PonteMol formula="H2O" mols={2} />
  if (v.tipo === 'proporcao') return <EtapasProporcao r={reacao(v.reacao)} mols={3} />
  if (v.tipo === 'limitante') {
    const r = reacao(v.reacao)
    const res = limitante(r, v.mols)
    return (
      <div className="mx-auto grid w-full max-w-md gap-3">
        <Equacao r={r} />
        <BarrasEspecies
          titulo="Mols colocados de cada reagente"
          itens={r.reagentes.map((fm, i) => ({ rotulo: <Formula f={fm} />, nome: fm, valor: v.mols[i] as number, texto: `${f(v.mols[i] as number)} mol` }))}
        />
        <BarrasEspecies
          titulo="Mols divididos pelo coeficiente"
          itens={r.reagentes.map((fm, i) => ({
            rotulo: <Formula f={fm} />,
            nome: fm,
            valor: res.razoes[i] as number,
            texto: `${f(v.mols[i] as number)} ÷ ${coefDe(r, i)} = ${f(res.razoes[i] as number)}`,
            cor: i === res.limitante ? 'var(--erro)' : 'var(--line-strong)',
          }))}
        />
        <p className="m-0 text-center text-sm text-[var(--ink-muted)]">
          O menor valor (em vermelho) é o do <Formula f={r.reagentes[res.limitante] as string} />: é o limitante. Sobram {f(res.sobra[1 - res.limitante] as number)} mol de <Formula f={r.reagentes[1 - res.limitante] as string} />.
        </p>
      </div>
    )
  }
  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <BarrasEspecies
        titulo="Rendimento: massa teórica e massa obtida"
        max={50}
        itens={[
          { rotulo: 'Teórica', nome: 'Massa teórica', valor: 50, texto: '50 g (100 %)', cor: 'var(--line-strong)' },
          { rotulo: 'Obtida', nome: 'Massa obtida', valor: 40, texto: '40 g (80 %)' },
        ]}
      />
      <BarrasEspecies
        titulo="Pureza: massa da amostra e massa do reagente puro"
        max={100}
        itens={[
          { rotulo: 'Amostra', nome: 'Amostra', valor: 100, texto: '100 g', cor: 'var(--line-strong)' },
          { rotulo: 'Pura', nome: 'Reagente puro', valor: 80, texto: '80 g (80 %)' },
        ]}
      />
      <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Pureza desconta o que entra; rendimento desconta o que sai.</p>
    </div>
  )
}

const PASSOS: PassoEntenda[] = PASSOS_EST.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="estequiometria" />
}
