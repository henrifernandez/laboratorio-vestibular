import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MATERIAS } from '@/conteudo/materias'
import { BarraProgresso } from '@/componentes/BarraProgresso'
import { resumirPainel, taxaDeAcerto } from '@/desafios/painel'
import { maisErrados } from '@/desafios/progresso'
import { useProgresso } from '@/desafios/useProgresso'
import { carregarTema, temaDisponivel } from '@/materias/registro'

/** Nome legível de cada desafio, lido dos próprios temas (carregados só se houver progresso neles). */
function useTitulos(chaves: string[]) {
  const [titulos, setTitulos] = useState<Record<string, string>>({})
  const temas = useMemo(() => [...new Set(chaves.map((c) => (c.split(':')[0] ?? '').split('/').slice(0, 2).join('/')))].filter(Boolean), [chaves])
  useEffect(() => {
    let cancelado = false
    for (const t of temas) {
      const [materia, tema] = t.split('/') as [string, string]
      if (!temaDisponivel(materia, tema)) continue
      carregarTema(materia, tema)
        .then((mod) => {
          if (cancelado) return
          setTitulos((atual) => ({ ...atual, ...Object.fromEntries(mod.default.desafios.map((d) => [d.desafio.id, d.desafio.titulo])) }))
        })
        .catch(() => {})
    }
    return () => {
      cancelado = true
    }
  }, [temas])
  return titulos
}

function Estatistica({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="cartao grid gap-0.5 p-3">
      <dt className="text-sm font-semibold text-[var(--ink-muted)]">{rotulo}</dt>
      <dd className="num m-0 text-3xl font-semibold">{valor}</dd>
      {detalhe && <dd className="m-0 text-sm text-[var(--ink-muted)]">{detalhe}</dd>}
    </div>
  )
}

export default function Progresso() {
  const progresso = useProgresso()
  const painel = useMemo(() => resumirPainel(progresso, MATERIAS), [progresso])
  const errados = maisErrados(progresso).slice(0, 8)
  const titulos = useTitulos(Object.keys(progresso))

  const descrever = (chave: string) => {
    const [id, nivel] = chave.split(':')
    const [materia, tema, slug] = (id ?? '').split('/')
    const m = MATERIAS.find((x) => x.id === materia)
    const t = m?.temas.find((x) => x.id === tema)
    return {
      id: id ?? chave,
      nivel: Number(nivel) || 1,
      texto: `${m?.nome ?? materia} / ${t?.titulo ?? tema} / ${titulos[id ?? ''] ?? slug} (nível ${nivel})`,
    }
  }

  return (
    <div className="container-site grid gap-8 py-8">
      <h1 className="text-4xl">Meu progresso</h1>

      {painel.tentativas === 0 ? (
        <p className="text-[var(--ink-muted)]">
          Nada por aqui ainda. Responda um desafio e o resultado aparece neste painel.{' '}
          <Link to="/materia/matematica/funcoes?aba=desafios">Ir para os desafios de Funções</Link>
        </p>
      ) : (
        <section aria-labelledby="geral" className="grid gap-3">
          <h2 id="geral" className="text-2xl">
            Visão geral
          </h2>
          <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Estatistica rotulo="Desafios resolvidos" valor={`${painel.feitos} de ${painel.total}`} detalhe="acertados ao menos uma vez, por nível" />
            <Estatistica rotulo="Tentativas" valor={String(painel.tentativas)} />
            <Estatistica rotulo="Acertos" valor={String(painel.acertos)} />
            <Estatistica rotulo="Taxa de acerto" valor={painel.taxa === null ? '—' : `${painel.taxa}%`} />
          </dl>
          <div className="grid max-w-md gap-1">
            <BarraProgresso valor={painel.total ? painel.feitos / painel.total : 0} rotulo="Progresso geral" />
          </div>
        </section>
      )}

      <section aria-labelledby="por-materia" className="grid gap-3">
        <h2 id="por-materia" className="text-2xl">
          Por matéria
        </h2>
        <div className="grid gap-3">
          {painel.materias.map((m) => (
            <details key={m.materia.id} data-materia={m.materia.id} open={m.tentativas > 0} className="cartao border-l-8 p-0" style={{ borderLeftColor: 'var(--accent)' }}>
              <summary className="grid cursor-pointer gap-1 p-3 sm:grid-cols-[1fr_16rem] sm:items-center sm:gap-4">
                <span className="text-lg font-semibold">
                  {m.materia.nome}{' '}
                  <span className="num text-sm font-normal text-[var(--ink-muted)]">
                    {m.feitos} de {m.total} resolvidos
                    {m.tentativas > 0 ? ` · ${taxaDeAcerto(m.acertos, m.tentativas)}% de acerto` : ''}
                  </span>
                </span>
                <BarraProgresso valor={m.total ? m.feitos / m.total : 0} rotulo={`Progresso em ${m.materia.nome}`} />
              </summary>
              <div className="overflow-x-auto border-t border-[var(--line)]">
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">Temas de {m.materia.nome}</caption>
                  <thead>
                    <tr className="border-b border-[var(--line)]">
                      <th scope="col" className="p-3">Tema</th>
                      <th scope="col" className="p-3 text-right">Resolvidos</th>
                      <th scope="col" className="p-3 text-right">Tentativas</th>
                      <th scope="col" className="p-3 text-right">Acertos</th>
                      <th scope="col" className="p-3 text-right">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.temas.map((t) => (
                      <tr key={t.tema.id} className="border-b border-[var(--line)] last:border-0">
                        <th scope="row" className="p-3 font-semibold">
                          <Link to={`/materia/${m.materia.id}/${t.tema.id}?aba=desafios`}>{t.tema.titulo}</Link>
                        </th>
                        <td className="num p-3 text-right">
                          {t.feitos} de {t.total}
                        </td>
                        <td className="num p-3 text-right">{t.tentativas}</td>
                        <td className="num p-3 text-right">{t.acertos}</td>
                        <td className="num p-3 text-right">{t.tentativas ? `${taxaDeAcerto(t.acertos, t.tentativas)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="errados" className="grid gap-3">
        <h2 id="errados" className="text-2xl">
          Onde mais errei
        </h2>
        {errados.length === 0 ? (
          <p className="text-[var(--ink-muted)]">Nenhum erro registrado. Quando errar, os desafios mais difíceis para você aparecem aqui.</p>
        ) : (
          <>
            <ul className="m-0 grid list-none gap-2 p-0">
              {errados.map((e) => {
                const d = descrever(e.id)
                return (
                  <li key={e.id} className="cartao flex flex-wrap items-center justify-between gap-3 p-3">
                    <span>
                      {d.texto}{' '}
                      <span className="chip num">
                        {e.erros} {e.erros === 1 ? 'erro' : 'erros'}
                      </span>
                    </span>
                    <Link to={`/revisao?foco=${encodeURIComponent(d.id)}&nivel=${d.nivel}`} className="btn btn-primario no-underline">
                      Praticar
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div>
              <Link to="/revisao?erros=1" className="btn no-underline">
                Revisar só o que já errei
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
