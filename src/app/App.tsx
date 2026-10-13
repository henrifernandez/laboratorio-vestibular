import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './Layout'
import { Inicio } from '@/paginas/Inicio'

const PaginaMateria = lazy(() => import('@/paginas/PaginaMateria'))
const PaginaTema = lazy(() => import('@/paginas/PaginaTema'))
const Progresso = lazy(() => import('@/paginas/Progresso'))
const Revisao = lazy(() => import('@/paginas/Revisao'))
const Entrar = lazy(() => import('@/paginas/Entrar'))
const Conta = lazy(() => import('@/paginas/Conta'))
const NaoEncontrada = lazy(() => import('@/paginas/NaoEncontrada'))

export function App() {
  return (
    <Layout>
      <Suspense fallback={<p className="container-site py-10 text-[var(--ink-muted)]" role="status">Carregando…</p>}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/materia/:materia" element={<PaginaMateria />} />
          <Route path="/materia/:materia/:tema" element={<PaginaTema />} />
          <Route path="/progresso" element={<Progresso />} />
          <Route path="/revisao" element={<Revisao />} />
          <Route path="/entrar" element={<Entrar />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
