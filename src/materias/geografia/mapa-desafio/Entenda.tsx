import { NOTA_MAPA, PASSOS_MAPA, VIZINHOS_DO_BRASIL, type PassoMapa } from '@/conteudo/geografia/mapa-desafio'
import { EntendaPassos, type PassoEntenda } from '@/componentes/EntendaPassos'
import { usePaises } from '../comum/mapa'
import { distanciaReal, formatarEscala } from './calculo'
import { PROJECOES, criarProjecao, comparar, type TipoProjecao } from './projecoes'
import { COR_BRASIL, COR_VIZINHO, EscalaSvg, ListaNumerada, MapaPaises, MapaProjecao } from './Visuais'

const VIZINHOS_PAISES = VIZINHOS_DO_BRASIL.filter((id) => id !== '250')

function Projecoes() {
  const { paises } = usePaises()
  const gl = paises?.find((p) => String(p.id) === '304')
  const br = paises?.find((p) => String(p.id) === '076')
  return (
    <div className="grid gap-3">
      {(['mercator', 'equal-earth'] as TipoProjecao[]).map((tipo) => {
        const info = PROJECOES.find((p) => p.id === tipo)
        const r = gl && br ? comparar(gl, br, criarProjecao(tipo).projecao) : null
        return (
          <figure key={tipo} className="m-0 grid gap-1">
            <MapaProjecao tipo={tipo} />
            <figcaption className="text-sm">
              <strong>{info?.nome}</strong> ({info?.tipo}): preserva {info?.preserva}. {r && <span className="num">A Groenlândia (vermelho) parece {r.aparente.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} vez do tamanho do Brasil (azul); na realidade é {r.real.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} vez.</span>}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

function Visual({ v }: { v: PassoMapa['visual'] }) {
  switch (v.tipo) {
    case 'coordenadas':
      return (
        <MapaPaises
          regiao="mundo"
          descricao="Mapa-múndi com o Equador, os trópicos de Câncer e de Capricórnio, o meridiano de Greenwich e o antimeridiano."
          linhas={[
            { tipo: 'paralelo', valor: 0, rotulo: 'Equador' },
            { tipo: 'paralelo', valor: 23.5, rotulo: 'Câncer' },
            { tipo: 'paralelo', valor: -23.5, rotulo: 'Capricórnio' },
            { tipo: 'meridiano', valor: 0, rotulo: 'Greenwich' },
          ]}
        />
      )
    case 'escala': {
      const E = 50_000
      return (
        <div className="grid gap-2">
          <EscalaSvg denominador={E} cm={4} />
          <p className="num m-0 text-sm text-[var(--ink-muted)]">
            Escala {formatarEscala(E)}: 4 cm no mapa = 4 × {E.toLocaleString('pt-BR')} cm = {distanciaReal(4, E).toLocaleString('pt-BR')} km.
          </p>
        </div>
      )
    }
    case 'projecao':
      return <Projecoes />
    case 'fronteiras':
      return (
        <div className="grid gap-2">
          <MapaPaises
            regiao="america-do-sul"
            descricao="Mapa da América do Sul com o Brasil em verde-claro e os nove países vizinhos numerados, de 1 a 9, conforme a lista abaixo do mapa."
            destaques={{ '076': COR_BRASIL, ...Object.fromEntries(VIZINHOS_PAISES.map((id) => [id, COR_VIZINHO])) }}
            numerados={VIZINHOS_PAISES}
          />
          <ListaNumerada ids={VIZINHOS_PAISES} />
          <p className="m-0 text-sm text-[var(--ink-muted)]">Mais a Guiana Francesa (território da França), ao lado do Suriname: dez vizinhos no total. Chile e Equador (sem cor) não fazem fronteira com o Brasil.</p>
        </div>
      )
    case 'leitura':
      return (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {[
            ['Título', 'diz o assunto, o lugar e a época do mapa'],
            ['Legenda', 'explica as cores, as linhas e os símbolos'],
            ['Escala', 'relaciona as distâncias do mapa com as do terreno'],
            ['Orientação', 'indica onde fica o norte (rosa dos ventos ou seta)'],
            ['Fonte e data', 'mostram de onde vêm os dados e de quando são'],
            ['Projeção', 'diz como a esfera foi planificada e o que deforma'],
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

const PASSOS: PassoEntenda[] = PASSOS_MAPA.map((p) => ({ titulo: p.titulo, texto: p.texto, pare: p.pare, visual: <Visual key={p.titulo} v={p.visual} /> }))

export default function Entenda() {
  return (
    <div className="grid gap-2">
      <EntendaPassos passos={PASSOS} idTema="mapa-desafio" />
      <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MAPA}</p>
    </div>
  )
}
