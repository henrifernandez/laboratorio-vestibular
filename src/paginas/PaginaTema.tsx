import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BookOpen, FlaskConical, ListChecks, Target } from 'lucide-react'
import { acharMateria, acharTema } from '@/conteudo/materias'
import { JogoDesafios } from '@/desafios/JogoDesafios'
import { carregarTema, temaDisponivel, type ModuloTema } from '@/materias/registro'
import NaoEncontrada from './NaoEncontrada'

const ABAS = [
  { id: 'entenda', rotulo: 'Entenda', icone: <BookOpen size={18} aria-hidden="true" /> },
  { id: 'laboratorio', rotulo: 'Laboratório', icone: <FlaskConical size={18} aria-hidden="true" /> },
  { id: 'desafios', rotulo: 'Desafios', icone: <Target size={18} aria-hidden="true" /> },
  { id: 'resumo', rotulo: 'Resumo', icone: <ListChecks size={18} aria-hidden="true" /> },
] as const
type AbaId = (typeof ABAS)[number]['id']

export default function PaginaTema() {
  const { materia, tema } = useParams()
  const [busca, setBusca] = useSearchParams()
  const m = acharMateria(materia)
  const t = acharTema(materia, tema)
  const [carga, setCarga] = useState<{ chave: string; modulo: ModuloTema | null; erro: boolean }>({ chave: '', modulo: null, erro: false })
  const chave = `${materia}/${tema}`
  const modulo = carga.chave === chave ? carga.modulo : null
  const erro = carga.chave === chave && carga.erro

  const aba = (ABAS.find((a) => a.id === busca.get('aba'))?.id ?? 'entenda') as AbaId

  useEffect(() => {
    if (!materia || !tema || !temaDisponivel(materia, tema)) return
    let cancelado = false
    const c = `${materia}/${tema}`
    carregarTema(materia, tema)
      .then((mod) => !cancelado && setCarga({ chave: c, modulo: mod.default, erro: false }))
      .catch(() => !cancelado && setCarga({ chave: c, modulo: null, erro: true }))
    return () => {
      cancelado = true
    }
  }, [materia, tema])

  if (!m || !t || !materia || !tema || !temaDisponivel(materia, tema)) return <NaoEncontrada />

  const irPara = (id: AbaId) => {
    setBusca((p) => {
      const novo = new URLSearchParams(p)
      novo.set('aba', id)
      // parâmetros de uma aba não valem em outra
      if (id !== 'laboratorio') ['f', 'a', 'b', 'c', 'base', 'k', 'tela'].forEach((k) => novo.delete(k))
      return novo
    })
  }

  const mover = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const prox = ABAS[(i + (e.key === 'ArrowRight' ? 1 : ABAS.length - 1)) % ABAS.length]!
    irPara(prox.id)
    document.getElementById(`aba-${prox.id}`)?.focus()
  }

  return (
    <div data-materia={m.id} className="container-site grid gap-5 py-6">
      <nav aria-label="Você está em" className="text-sm text-[var(--ink-muted)]">
        <Link to="/">Início</Link> / <Link to={`/materia/${m.id}`}>{m.nome}</Link> / <span aria-current="page">{t.titulo}</span>
      </nav>
      <header className="grid gap-1 border-l-8 pl-4" style={{ borderColor: 'var(--accent)' }}>
        <h1 className="text-3xl sm:text-4xl">{t.titulo}</h1>
        <p className="text-[var(--ink-muted)]">{t.descricao}</p>
      </header>

      <div role="tablist" aria-label="Abas do tema" className="grid grid-cols-4 gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-1">
        {ABAS.map((a, i) => (
          <button
            key={a.id}
            id={`aba-${a.id}`}
            role="tab"
            type="button"
            aria-selected={a.id === aba}
            aria-controls="painel-aba"
            tabIndex={a.id === aba ? 0 : -1}
            onClick={() => irPara(a.id)}
            onKeyDown={(e) => mover(e, i)}
            className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 text-xs font-semibold sm:flex-row sm:gap-2 sm:px-1 sm:text-base"
            style={{
              background: a.id === aba ? 'var(--accent)' : 'transparent',
              color: a.id === aba ? 'var(--on-accent)' : 'var(--ink)',
            }}
          >
            {a.icone}
            {a.rotulo}
          </button>
        ))}
      </div>

      <div id="painel-aba" role="tabpanel" aria-labelledby={`aba-${aba}`} tabIndex={-1}>
        <h2 className="sr-only">{ABAS.find((a) => a.id === aba)?.rotulo}</h2>
        {erro && <p role="alert">Não consegui carregar este tema. Recarregue a página.</p>}
        {!erro && !modulo && <p role="status" className="py-10 text-[var(--ink-muted)]">Carregando…</p>}
        {modulo && aba === 'entenda' && <modulo.Entenda />}
        {modulo && aba === 'laboratorio' && <modulo.Laboratorio />}
        {modulo && aba === 'desafios' && <JogoDesafios desafios={modulo.desafios} />}
        {modulo && aba === 'resumo' && <modulo.Resumo />}
      </div>
    </div>
  )
}
