import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FlaskConical, Moon, Sun, UserRound } from 'lucide-react'
import { useConta } from '@/conta/ContaContext'
import { useRolagemTeclado } from '@/lib/useRolagemTeclado'
import { useTema } from '@/lib/tema'

export function Layout({ children }: { children: ReactNode }) {
  const { tema, alternar } = useTema()
  const conta = useConta()
  const { pathname } = useLocation()
  useRolagemTeclado()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const link = ({ isActive }: { isActive: boolean }) =>
    `inline-flex min-h-11 items-center rounded-lg px-3 font-semibold ${isActive ? 'bg-[var(--surface-2)] text-[var(--ink)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'}`

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[var(--surface)] focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] backdrop-blur">
        <div className="container-site flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-[var(--ink)] no-underline">
            <FlaskConical aria-hidden="true" size={24} style={{ color: 'var(--accent-matematica)' }} />
            <span className="font-[family-name:var(--font-titulo)] text-xl font-semibold">Laboratório Vestibular</span>
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1">
            <NavLink to="/progresso" className={link}>
              Meu progresso
            </NavLink>
            <NavLink to="/revisao" className={link}>
              Revisão mista
            </NavLink>
            {conta.fase === 'logado' && (
              <NavLink to="/conta" className={link} aria-label={`Minha conta, ${conta.nome}`}>
                <UserRound size={18} aria-hidden="true" className="mr-1" />
                <span className="max-w-28 truncate">{conta.nome}</span>
              </NavLink>
            )}
            {conta.fase === 'anonimo' && (
              <NavLink to="/entrar" className={link}>
                Entrar
              </NavLink>
            )}
            <button
              type="button"
              className="btn btn-fantasma"
              onClick={alternar}
              aria-label={tema === 'claro' ? 'Mudar para o modo escuro' : 'Mudar para o modo claro'}
            >
              {tema === 'claro' ? <Moon size={20} aria-hidden="true" /> : <Sun size={20} aria-hidden="true" />}
            </button>
          </nav>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="pb-16">
        {children}
      </main>
      <footer className="border-t border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]">
        <div className="container-site">Um site de estudo em que você aprende mexendo nos conceitos: cada tema tem uma explicação passo a passo, um laboratório interativo, desafios que explicam o seu erro e um resumo. Você pode estudar sem conta (o progresso fica neste navegador) ou entrar com nome e senha para guardá-lo em qualquer aparelho.</div>
      </footer>
    </>
  )
}
