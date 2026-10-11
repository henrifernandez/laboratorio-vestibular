import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shuffle } from 'lucide-react'
import { MATERIAS } from '@/conteudo/materias'
import { desafiosResolvidos } from '@/desafios/progresso'
import { useProgresso } from '@/desafios/useProgresso'
import { BarraProgresso } from '@/componentes/BarraProgresso'

/** Parábola viva: o primeiro contato já é mexer. Feita em SVG puro para a página inicial carregar leve. */
function HeroParabola() {
  const [a, setA] = useState(1)
  const id = useId()
  const pts: string[] = []
  for (let x = -3; x <= 3.001; x += 0.1) {
    const y = a * x * x - 2 * a // raízes em ±√2
    const px = 150 + x * 40
    const py = 100 - y * 14
    pts.push(`${px.toFixed(1)},${Math.max(-40, Math.min(240, py)).toFixed(1)}`)
  }
  return (
    <div className="cartao grid gap-3 p-4" style={{ ['--accent' as string]: 'var(--accent-matematica)' }}>
      <svg viewBox="0 0 300 180" role="img" aria-label={`Gráfico de f(x) = ${a.toFixed(1).replace('.', ',')}·x² − ${(2 * a).toFixed(1).replace('.', ',')}`} className="w-full">
        <defs>
          <clipPath id={`${id}-c`}>
            <rect x="0" y="0" width="300" height="180" rx="10" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-c)`}>
          <rect width="300" height="180" fill="var(--surface)" />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="180" stroke="var(--grade)" strokeWidth="1" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 30} x2="300" y2={i * 30} stroke="var(--grade)" strokeWidth="1" />
          ))}
          <line x1="0" y1="100" x2="300" y2="100" stroke="var(--ink)" strokeWidth="1.2" />
          <line x1="150" y1="0" x2="150" y2="180" stroke="var(--ink)" strokeWidth="1.2" />
          <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="150" cy={100 + 2 * a * 14} r="6" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
        </g>
      </svg>
      <label className="grid gap-1">
        <span className="font-semibold">
          Mexa no <em>a</em>: <span className="num">{a.toFixed(1).replace('.', ',')}</span>
        </span>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.1}
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          className="h-11 w-full"
          style={{ accentColor: 'var(--accent-matematica)' }}
        />
      </label>
      <p className="text-sm text-[var(--ink-muted)]">Quando a fica negativo, a parábola vira. É esse tipo de descoberta que o laboratório propõe.</p>
    </div>
  )
}

export function Inicio() {
  const progresso = useProgresso()
  const disponiveis = MATERIAS.flatMap((m) => m.temas.filter((t) => t.disponivel).map((t) => ({ m, t })))
  const total = disponiveis.reduce((s, { t }) => s + (t.totalNiveis ?? 0), 0)
  const feitos = disponiveis.reduce((s, { m, t }) => s + Math.min(desafiosResolvidos(progresso, m.id, t.id), t.totalNiveis ?? 0), 0)

  return (
    <div className="container-site grid gap-10 py-8 sm:py-12">
      <section className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-5">
          <h1 className="text-4xl sm:text-5xl">Aprenda mexendo no conceito.</h1>
          <p className="max-w-[60ch] text-lg text-[var(--ink-muted)]">
            Cada matéria do vestibular vira um laboratório: arraste, ajuste, erre e veja o que muda. Depois, treine com desafios que explicam o seu erro.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/materia/matematica/funcoes" className="btn btn-primario no-underline" style={{ ['--accent' as string]: 'var(--accent-matematica)' }}>
              Começar por Funções
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/revisao" className="btn no-underline">
              <Shuffle size={18} aria-hidden="true" />
              Revisão mista
            </Link>
          </div>
          <div className="grid max-w-md gap-1" style={{ ['--accent' as string]: 'var(--accent-biologia)' }}>
            <span className="text-sm font-semibold text-[var(--ink-muted)]">
              Progresso geral: <span className="num">{feitos}</span> de <span className="num">{total}</span> desafios resolvidos
            </span>
            <BarraProgresso valor={total ? feitos / total : 0} rotulo="Progresso geral" />
          </div>
        </div>
        <HeroParabola />
      </section>

      <section aria-labelledby="materias" className="grid gap-4">
        <h2 id="materias" className="text-2xl">
          Matérias
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {MATERIAS.map((m) => {
            const temasOk = m.temas.filter((t) => t.disponivel)
            const totalM = temasOk.reduce((s, t) => s + (t.totalNiveis ?? 0), 0)
            const feitosM = temasOk.reduce((s, t) => s + Math.min(desafiosResolvidos(progresso, m.id, t.id), t.totalNiveis ?? 0), 0)
            return (
              <li key={m.id} data-materia={m.id}>
                <Link
                  to={`/materia/${m.id}`}
                  className="cartao grid h-full gap-2 border-t-4 p-4 no-underline transition-transform hover:-translate-y-0.5"
                  style={{ borderTopColor: 'var(--accent)' }}
                >
                  <h3 className="text-xl" style={{ color: 'var(--accent)' }}>
                    {m.nome}
                  </h3>
                  <p className="text-sm text-[var(--ink-muted)]">{m.descricao}</p>
                  <span className="mt-auto text-sm font-semibold text-[var(--ink)]">
                    {temasOk.length > 0 ? `${temasOk.length} de ${m.temas.length} temas no ar` : 'Em breve'}
                  </span>
                  {totalM > 0 ? <BarraProgresso valor={feitosM / totalM} rotulo={`Progresso em ${m.nome}`} /> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
