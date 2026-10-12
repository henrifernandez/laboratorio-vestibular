import { PASSOS_GENETICA, type VisualGenetica } from '@/conteudo/biologia/genetica'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { distribuicaoPoligenica, gametasLigados, porcento, hardyWeinberg } from './calculo'
import { ESTRUTURA_SIMPLES, comFenotipos } from './heredograma'
import { BarrasClasses, CromossomosSvg, HeredogramaSvg, HomologosSvg, MatrizTransfusao, QuadroPunnett, QuadroX, TabelaTiposABO, legendaHeredograma } from './Visuais'

const LEGENDA = (texto: string) => <p className="m-0 text-center text-sm text-[var(--ink-muted)]">{texto}</p>

function Visual({ v }: { v: VisualGenetica }) {
  switch (v.tipo) {
    case 'genes':
      return (
        <div className="cartao grid gap-2 p-3">
          <HomologosSvg alelos={['A', 'a']} />
          {LEGENDA('Indivíduo heterozigoto (Aa): um alelo em cada cromossomo do par. Genótipo Aa; o fenótipo depende de qual alelo é dominante.')}
        </div>
      )
    case 'punnett1':
      return (
        <div className="cartao grid gap-2 p-3">
          <QuadroPunnett pai="Aa" mae="Aa" />
          {LEGENDA('Cada casa tem probabilidade 1/4. Com dominância completa: 3 de fenótipo dominante para 1 recessivo.')}
        </div>
      )
    case 'incompleta':
      return (
        <div className="cartao grid gap-2 p-3">
          <QuadroPunnett pai="Aa" mae="Aa" modo="incompleta" />
          {LEGENDA('Com dominância incompleta, Aa tem fenótipo intermediário: três classes, na razão 1 : 2 : 1.')}
        </div>
      )
    case 'teste':
      return (
        <div className="cartao grid gap-2 p-3">
          <QuadroPunnett pai="Aa" mae="aa" />
          {LEGENDA('Cruzamento-teste de um indivíduo Aa: metade dos descendentes é aa. Se o indivíduo fosse AA, todos seriam Aa.')}
        </div>
      )
    case 'punnett2':
      return (
        <div className="cartao grid gap-2 p-3">
          <QuadroPunnett pai="AaBb" mae="AaBb" />
          {LEGENDA('16 casas, 4 classes de fenótipo: 9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb.')}
        </div>
      )
    case 'ligacao': {
      const g = gametasLigados(0.2, 'cis')
      return (
        <div className="cartao grid gap-3 p-3">
          <CromossomosSvg arranjo="cis" distancia={20} />
          <BarrasClasses titulo="Gametas de AB/ab com 20 cM entre os genes" itens={[...g.freq].map(([nome, fr]) => ({ rotulo: `${nome}${g.parentais.includes(nome) ? ' (parental)' : ' (recomb.)'}`, valor: fr * 100, cor: g.parentais.includes(nome) ? 'var(--accent)' : 'var(--aviso)' }))} max={50} />
          {LEGENDA('Parentais: (100 − 20) ÷ 2 = 40 % cada. Recombinantes: 20 ÷ 2 = 10 % cada.')}
        </div>
      )
    }
    case 'abo':
      return <TabelaTiposABO />
    case 'rh':
      return (
        <div className="grid gap-2">
          <MatrizTransfusao />
          {LEGENDA('Verde: compatível. Vermelho: incompatível. A linha O− é toda verde (doador universal); a coluna AB+ é toda verde (receptor universal).')}
        </div>
      )
    case 'sexo':
      return (
        <div className="cartao grid gap-2 p-3">
          <QuadroX pai="XaY" mae="XAXA" />
          {LEGENDA('Pai afetado (XᵃY) × mãe normal (XᴬXᴬ): todas as filhas são portadoras e todos os filhos são normais.')}
        </div>
      )
    case 'heredograma': {
      const ped = comFenotipos(ESTRUTURA_SIMPLES, ['II-2'])
      return (
        <div className="cartao grid gap-2 p-3">
          <HeredogramaSvg ped={ped} rotulos={{ 'I-1': 'Aa', 'I-2': 'Aa', 'II-2': 'aa', 'II-1': 'A_', 'II-3': 'A_' }} rotulo="Heredograma: pais normais I-1 e I-2 têm três filhos; a filha II-2 é afetada" />
          {legendaHeredograma()}
          {LEGENDA('Os pais normais I-1 e I-2 são Aa, porque a filha II-2 é aa. Os irmãos normais são A_ (AA ou Aa).')}
        </div>
      )
    }
    case 'hardy': {
      const h = hardyWeinberg(0.3)
      return (
        <div className="cartao grid gap-2 p-3">
          <BarrasClasses
            titulo="Frequências genotípicas esperadas com q = 0,3 (p = 0,7)"
            itens={[
              { rotulo: 'AA (p²)', valor: h.AA * 100 },
              { rotulo: 'Aa (2pq)', valor: h.Aa * 100, cor: 'var(--aviso)' },
              { rotulo: 'aa (q²)', valor: h.aa * 100, cor: 'var(--erro)' },
            ]}
          />
          {LEGENDA('9 % de aa corresponde a q = 0,3; os heterozigotos são 42 %.')}
        </div>
      )
    }
    default: {
      const d = distribuicaoPoligenica(2)
      return (
        <div className="cartao grid gap-2 p-3">
          <BarrasClasses titulo="Cruzamento AaBb × AaBb (2 genes aditivos): alelos “maiúsculos” na prole" itens={d.map((x, k) => ({ rotulo: `${k} alelo${k === 1 ? '' : 's'}`, valor: porcento(x), cor: k === 2 ? 'var(--accent)' : 'var(--line-strong)' }))} max={50} />
          {LEGENDA('1 : 4 : 6 : 4 : 1. A classe do meio é a mais frequente; os extremos têm 1/16 cada.')}
        </div>
      )
    }
  }
}

const PASSOS: PassoEntenda[] = PASSOS_GENETICA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return <EntendaPassos passos={PASSOS} idTema="genetica" />
}
