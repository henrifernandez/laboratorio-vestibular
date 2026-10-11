import { useState } from 'react'
import { Link2, Plus, Zap } from 'lucide-react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { amplitude, desvioPadrao, histograma, media, mediaPonderada, mediana, moda } from './calculo'
import { DEFINICOES_ESTAT } from './definicoes'
import { fmt } from './geradores'
import { Histograma, PontosNaReta } from './Visuais'

// ------------------------------------------------------------------ Introdução

function TelaIntro() {
  const [v, setV] = useState([4, 6, 6, 7, 9])
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <PontosNaReta valores={v} limite={12} mostrarMedia mostrarMediana onMudar={setV} rotulo="Pontos arrastáveis com a média e a mediana marcadas" />
      <div className="grid content-start gap-4">
        <p className="text-[var(--ink-muted)]">
          Arraste os pontos. A linha cheia é a média; a tracejada, a mediana. O que acontece quando você afasta um ponto bem para a direita?
        </p>
        <p className="cartao num p-3" aria-live="polite">
          Média: <strong>{fmt(media(v))}</strong>
          <br />
          Mediana: <strong>{fmt(mediana(v))}</strong>
        </p>
        <BotaoReiniciar onClick={() => setV([4, 6, 6, 7, 9])} />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Explorar

const PADRAO = { dados: '4,6,6,7,9,12', media: true, mediana: true, moda: true, dispersao: true }
const lerDados = (s: string) =>
  s
    .split(',')
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= 60)
    .slice(0, 20)

function TelaExplorar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO)
  const [novo, setNovo] = useState(8)
  const [copiado, setCopiado] = useState(false)
  const valores = lerDados(e.dados)
  const mudarValores = (v: number[]) => atualizar({ dados: v.join(',') })
  const mo = moda(valores)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        <PontosNaReta valores={valores} limite={Math.max(20, ...valores) + 2} mostrarMedia={e.media} mostrarMediana={e.mediana} mostrarModa={e.moda} onMudar={mudarValores} rotulo="Diagrama de pontos: arraste cada valor" />
        <div className="grid gap-2 sm:grid-cols-3">
          <p className="cartao num p-3">
            Média
            <br />
            <strong className="text-xl" style={{ color: 'var(--accent)' }}>{fmt(media(valores))}</strong>
          </p>
          <p className="cartao num p-3">
            Mediana
            <br />
            <strong className="text-xl" style={{ color: 'var(--ok)' }}>{fmt(mediana(valores))}</strong>
          </p>
          <p className="cartao num p-3">
            Moda
            <br />
            <strong className="text-xl" style={{ color: 'var(--aviso)' }}>{mo.length ? mo.map((x) => fmt(x)).join(' e ') : 'não há'}</strong>
          </p>
        </div>
        {e.dispersao && valores.length > 0 && (
          <p className="num rounded-lg bg-[var(--surface-2)] p-3" aria-live="polite">
            Amplitude: <strong>{fmt(amplitude(valores))}</strong> · Desvio padrão: <strong>{fmt(desvioPadrao(valores))}</strong> · Quantidade: <strong>{valores.length}</strong>
          </p>
        )}
        <p className="text-sm text-[var(--ink-muted)]">Dica: use "valor extremo" e compare a média com a mediana.</p>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Novo valor" valor={novo} onChange={setNovo} min={0} max={40} passo={1} marcas={[0, 20, 40]} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primario" onClick={() => valores.length < 20 && mudarValores([...valores, novo])} disabled={valores.length >= 20}>
            <Plus size={18} aria-hidden="true" />
            Adicionar valor
          </button>
          <button type="button" className="btn" onClick={() => mudarValores([...valores, 40])} disabled={valores.length >= 20}>
            <Zap size={18} aria-hidden="true" />
            Valor extremo (40)
          </button>
          <button type="button" className="btn" onClick={() => mudarValores(valores.slice(0, -1))} disabled={valores.length <= 2}>
            Remover o último
          </button>
        </div>
        <PainelDeVisibilidade
          itens={[
            { id: 'media', rotulo: 'Média', ativo: e.media },
            { id: 'mediana', rotulo: 'Mediana', ativo: e.mediana },
            { id: 'moda', rotulo: 'Moda', ativo: e.moda },
            { id: 'dispersao', rotulo: 'Dispersão', ativo: e.dispersao },
          ]}
          onChange={(id, ativo) => atualizar({ [id]: ativo })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <BotaoReiniciar onClick={reiniciar} />
          <button type="button" className="btn" onClick={copiar}>
            <Link2 size={18} aria-hidden="true" />
            Copiar link desta configuração
          </button>
          <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">
            {copiado && 'Link copiado.'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ Laboratório: histograma

const CONJUNTOS: Record<string, { rotulo: string; dados: number[]; unidade: string }> = {
  notas: { rotulo: 'Notas de uma prova (0 a 10)', unidade: 'nota', dados: [2.5, 3, 4.5, 5, 5.5, 6, 6, 6.5, 7, 7, 7.5, 7.5, 8, 8, 8.5, 9, 9, 9.5, 10, 4, 5, 6.5, 7, 8.5] },
  idades: { rotulo: 'Idades de um grupo (anos)', unidade: 'anos', dados: [17, 18, 18, 19, 19, 19, 20, 20, 21, 22, 22, 23, 25, 28, 30, 35, 18, 19, 20, 21, 24, 29] },
}

function TelaHistograma() {
  const [qual, setQual] = useState<'notas' | 'idades'>('notas')
  const [largura, setLargura] = useState(2)
  const c = CONJUNTOS[qual] as (typeof CONJUNTOS)[string]
  const inicio = Math.floor(Math.min(...c.dados) / largura) * largura
  const maximo = Math.max(...c.dados)
  const n = Math.max(2, Math.floor((maximo - inicio) / largura) + 1)
  const classes = histograma(c.dados, inicio, largura, n)
  const estimada = mediaPonderada(classes.map((k) => ({ valor: (k.de + k.ate) / 2, freq: k.freq })))
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid content-start gap-3">
        <Histograma classes={classes} mostrarValores rotulo={`Histograma: ${c.rotulo}`} />
        <div className="overflow-x-auto">
          <table className="num w-full border-collapse text-center" aria-label="Tabela de frequências">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="border border-[var(--line)] p-1.5">Classe</th>
                <th className="border border-[var(--line)] p-1.5">Frequência</th>
                <th className="border border-[var(--line)] p-1.5">Relativa</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((k) => (
                <tr key={k.de}>
                  <td className="border border-[var(--line)] p-1.5">
                    [{k.de}, {k.ate})
                  </td>
                  <td className="border border-[var(--line)] p-1.5">{k.freq}</td>
                  <td className="border border-[var(--line)] p-1.5">{fmt((k.freq / c.dados.length) * 100, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <div role="radiogroup" aria-label="Conjunto de dados" className="grid gap-2">
          {(Object.keys(CONJUNTOS) as ('notas' | 'idades')[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={qual === k} className={`btn ${qual === k ? 'btn-primario' : ''}`} onClick={() => setQual(k)}>
              {(CONJUNTOS[k] as (typeof CONJUNTOS)[string]).rotulo}
            </button>
          ))}
        </div>
        <ControleDeslizante rotulo="Largura da classe" valor={largura} onChange={setLargura} min={1} max={5} passo={1} marcas={[1, 3, 5]} />
        <div className="cartao num grid gap-1 p-3" aria-live="polite">
          <p>
            Total de dados: <strong>{c.dados.length}</strong>
          </p>
          <p>
            Média real: <strong>{fmt(media(c.dados))}</strong>
          </p>
          <p>
            Média estimada pelas classes: <strong>{fmt(estimada)}</strong>
          </p>
          <p className="text-sm text-[var(--ink-muted)]">Classes mais estreitas deixam a estimativa mais próxima da média real.</p>
        </div>
        <BotaoReiniciar
          onClick={() => {
            setQual('notas')
            setLargura(2)
          }}
        />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaIntro /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaHistograma /> },
      ]}
      desafios={DEFINICOES_ESTAT}
    />
  )
}
