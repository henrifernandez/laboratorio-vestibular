import { Link } from 'react-router-dom'

export default function NaoEncontrada() {
  return (
    <div className="container-site grid gap-4 py-16">
      <h1 className="text-4xl">Página não encontrada</h1>
      <p className="text-[var(--ink-muted)]">O endereço não existe ou o tema ainda não foi publicado.</p>
      <div>
        <Link to="/" className="btn btn-primario no-underline">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
