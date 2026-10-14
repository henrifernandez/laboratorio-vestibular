import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Shuffle } from 'lucide-react'
import { MATERIAS, type Materia } from '@/conteudo/materias'
import { idProgresso, PainelDesafio, type DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { jaErrou } from '@/desafios/painel'
import { lerProgresso } from '@/desafios/progresso'
import { sortearItem, type ItemRevisao } from '@/desafios/revisao'
import type { Nivel } from '@/desafios/tipos'
import { carregarTema, temaDisponivel } from '@/materias/registro'

interface Entrada {
  def: DefinicaoQualquer
  materia: Materia
  item: ItemRevisao
}

/** Matérias que já têm algum tema publicado: são as que fazem sentido como filtro. */
const MATERIAS_COM_TEMA = MATERIAS.filter((m) => m.temas.some((t) => temaDisponivel(m.id, t.id)))

/** Sorteia entre as entradas (só as que já foram erradas, se `soErros`), dando mais chance às mais erradas. */
function sortearDe(entradas: Entrada[], soErros: boolean, evitar?: string): Entrada | null {
  const progresso = lerProgresso()
  const pool = soErros ? entradas.filter((e) => jaErrou(progresso, e.item.chave)) : entradas
  if (pool.length === 0) return null
  const item = sortearItem(
    pool.map((e) => e.item),
    progresso,
    Math.random,
    evitar,
  )
  return pool.find((e) => e.item.chave === item.chave) ?? null
}

export default function Revisao() {
  const [busca, setBusca] = useSearchParams()
  const foco = busca.get('foco')
  const nivelFoco = Number(busca.get('nivel')) as Nivel
  const materiaPedida = MATERIAS_COM_TEMA.find((m) => m.id === busca.get('materia'))?.id ?? null
  const soErros = busca.get('erros') === '1'
  const [estado, setEstado] = useState<{ entradas: Entrada[]; atual: Entrada | null; giro: number } | null>(null)

  useEffect(() => {
    let cancelado = false
    // só carrega os temas da matéria escolhida (ou todos, se nenhuma)
    const pares = MATERIAS.filter((m) => !materiaPedida || m.id === materiaPedida).flatMap((m) =>
      m.temas.filter((t) => temaDisponivel(m.id, t.id)).map((t) => ({ m, t })),
    )
    Promise.all(pares.map(({ m, t }) => carregarTema(m.id, t.id).then((mod) => ({ m, defs: mod.default.desafios })))).then((mods) => {
      if (cancelado) return
      const entradas: Entrada[] = mods.flatMap(({ m, defs }) =>
        defs.flatMap((def) =>
          ([1, 2, 3] as Nivel[]).map((nivel) => ({
            def,
            materia: m.id,
            item: { chave: idProgresso(def, nivel), id: def.desafio.id, nivel },
          })),
        ),
      )
      const dirigido = foco ? entradas.find((e) => e.item.id === foco && (!nivelFoco || e.item.nivel === nivelFoco)) : null
      setEstado({ entradas, atual: dirigido ?? sortearDe(entradas, soErros), giro: 0 })
    })
    return () => {
      cancelado = true
    }
  }, [foco, nivelFoco, materiaPedida, soErros])

  const atual = estado?.atual ?? null

  /** Troca o filtro na URL (e descarta o desafio dirigido de um clique anterior). */
  const filtrar = (materia: string | null, erros: boolean) => {
    const novo = new URLSearchParams()
    if (materia) novo.set('materia', materia)
    if (erros) novo.set('erros', '1')
    setBusca(novo, { replace: true })
  }

  return (
    <div className="container-site grid gap-5 py-8" data-materia={atual?.materia ?? materiaPedida ?? 'matematica'}>
      <header className="grid gap-2">
        <h1 className="text-4xl">Revisão mista</h1>
        <p className="max-w-[60ch] text-[var(--ink-muted)]">Sorteia desafios dos temas já publicados e dá mais chance aos que você mais errou.</p>
      </header>

      <div role="group" aria-label="Filtros da revisão" className="grid gap-2">
        <div role="group" aria-label="Matéria" className="flex flex-wrap gap-2">
          <button type="button" className={`btn ${materiaPedida === null ? 'btn-primario' : ''}`} aria-pressed={materiaPedida === null} onClick={() => filtrar(null, soErros)}>
            Todas as matérias
          </button>
          {MATERIAS_COM_TEMA.map((m) => (
            <button key={m.id} type="button" data-materia={m.id} className={`btn ${materiaPedida === m.id ? 'btn-primario' : ''}`} aria-pressed={materiaPedida === m.id} onClick={() => filtrar(m.id, soErros)}>
              {m.nome}
            </button>
          ))}
        </div>
        <div>
          <button type="button" className={`btn ${soErros ? 'btn-primario' : ''}`} aria-pressed={soErros} onClick={() => filtrar(materiaPedida, !soErros)}>
            Só o que já errei
          </button>
        </div>
      </div>

      {!estado && <p role="status">Carregando…</p>}
      {estado && estado.entradas.length === 0 && (
        <p>
          Ainda não há desafios publicados. <Link to="/">Voltar ao início</Link>
        </p>
      )}
      {estado && estado.entradas.length > 0 && !atual && (
        <p role="status">
          {soErros ? 'Você ainda não errou nenhum desafio' : 'Não há desafios'}
          {materiaPedida ? ' nesta matéria' : ''}. {soErros ? 'Desligue o filtro "Só o que já errei" para sortear entre todos.' : ''}
        </p>
      )}
      {estado && atual && (
        <>
          <div>
            <button
              type="button"
              className="btn"
              onClick={() => setEstado({ ...estado, atual: sortearDe(estado.entradas, soErros, atual.item.chave) ?? atual, giro: estado.giro + 1 })}
            >
              <Shuffle size={18} aria-hidden="true" />
              Sortear outro desafio
            </button>
          </div>
          <PainelDesafio key={`${atual.item.chave}-${estado.giro}`} def={atual.def} nivelInicial={atual.item.nivel} />
        </>
      )}
    </div>
  )
}
