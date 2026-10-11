import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Shuffle } from 'lucide-react'
import { MATERIAS, type Materia } from '@/conteudo/materias'
import { idProgresso, PainelDesafio, type DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { lerProgresso } from '@/desafios/progresso'
import { sortearItem, type ItemRevisao } from '@/desafios/revisao'
import type { Nivel } from '@/desafios/tipos'
import { carregarTema, temaDisponivel } from '@/materias/registro'

interface Entrada {
  def: DefinicaoQualquer
  materia: Materia
  item: ItemRevisao
}

function sortearDe(entradas: Entrada[], evitar?: string): Entrada | null {
  if (entradas.length === 0) return null
  const item = sortearItem(
    entradas.map((e) => e.item),
    lerProgresso(),
    Math.random,
    evitar,
  )
  return entradas.find((e) => e.item.chave === item.chave) ?? null
}

export default function Revisao() {
  const [busca] = useSearchParams()
  const foco = busca.get('foco')
  const nivelFoco = Number(busca.get('nivel')) as Nivel
  const [estado, setEstado] = useState<{ entradas: Entrada[]; atual: Entrada | null; giro: number } | null>(null)

  useEffect(() => {
    let cancelado = false
    const pares = MATERIAS.flatMap((m) => m.temas.filter((t) => temaDisponivel(m.id, t.id)).map((t) => ({ m, t })))
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
      setEstado({ entradas, atual: dirigido ?? sortearDe(entradas), giro: 0 })
    })
    return () => {
      cancelado = true
    }
  }, [foco, nivelFoco])

  const atual = estado?.atual ?? null

  return (
    <div className="container-site grid gap-5 py-8" data-materia={atual?.materia ?? 'matematica'}>
      <header className="grid gap-2">
        <h1 className="text-4xl">Revisão mista</h1>
        <p className="max-w-[60ch] text-[var(--ink-muted)]">Sorteia desafios dos temas já publicados e dá mais chance aos que você mais errou.</p>
      </header>
      {!estado && <p role="status">Carregando…</p>}
      {estado && estado.entradas.length === 0 && (
        <p>
          Ainda não há desafios publicados. <Link to="/">Voltar ao início</Link>
        </p>
      )}
      {estado && atual && (
        <>
          <div>
            <button
              type="button"
              className="btn"
              onClick={() => setEstado({ ...estado, atual: sortearDe(estado.entradas, atual.item.chave), giro: estado.giro + 1 })}
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
