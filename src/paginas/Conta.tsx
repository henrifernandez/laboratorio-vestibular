import { useId, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useConta, type EstadoSync } from '@/conta/ContaContext'

const TEXTO_SYNC: Record<EstadoSync, string> = {
  ocioso: 'Aguardando.',
  sincronizando: 'Sincronizando o progresso…',
  ok: 'Progresso sincronizado com a conta.',
  erro: 'Não foi possível sincronizar agora. O progresso continua guardado neste aparelho e será enviado quando der.',
}

/** Área da conta: quem está logado, estado da sincronização, sair e excluir. */
export default function Conta() {
  const conta = useConta()
  const navegar = useNavigate()
  const [apagarLocal, setApagarLocal] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const idLocal = useId()
  const idSenha = useId()

  if (conta.fase === 'carregando') return <p className="container-site py-10 text-[var(--ink-muted)]" role="status">Carregando…</p>
  if (conta.fase !== 'logado') return <Navigate to="/entrar" replace />

  async function sair() {
    await conta.sair(apagarLocal)
    navegar('/', { replace: true })
  }

  async function excluir(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!senha) return setErro('Escreva a senha para confirmar.')
    setExcluindo(true)
    const r = await conta.excluir(senha)
    setExcluindo(false)
    if (r.ok) navegar('/', { replace: true })
    else setErro(r.erro)
  }

  return (
    <div className="container-site grid max-w-2xl gap-6 py-10">
      <div className="grid gap-1">
        <h1 className="text-3xl">Olá, {conta.nome}</h1>
        <p className="m-0 text-[var(--ink-muted)]" role="status" aria-live="polite">
          {TEXTO_SYNC[conta.sync]}
        </p>
      </div>

      <section className="cartao grid gap-3 p-4" aria-labelledby="sec-progresso">
        <h2 id="sec-progresso" className="text-xl">
          Seu progresso
        </h2>
        <p className="m-0">O que você responde é guardado neste aparelho e enviado para a sua conta. Ao entrar em outro aparelho, o progresso dos dois é juntado: vale, para cada desafio, o registro com mais tentativas.</p>
        <div>
          <Link to="/progresso" className="btn no-underline">
            Ver meu progresso
          </Link>
        </div>
      </section>

      <section className="cartao grid gap-3 p-4" aria-labelledby="sec-sair">
        <h2 id="sec-sair" className="text-xl">
          Sair
        </h2>
        <label htmlFor={idLocal} className="flex min-h-11 cursor-pointer items-center gap-2">
          <input id={idLocal} type="checkbox" checked={apagarLocal} onChange={(e) => setApagarLocal(e.target.checked)} className="size-5" style={{ accentColor: 'var(--accent)' }} />
          <span>Apagar também o progresso guardado neste aparelho (use em computador compartilhado)</span>
        </label>
        <div>
          <button type="button" className="btn btn-primario" onClick={sair}>
            Sair da conta
          </button>
        </div>
      </section>

      <section className="cartao grid gap-3 p-4" aria-labelledby="sec-excluir">
        <h2 id="sec-excluir" className="text-xl">
          Excluir a conta
        </h2>
        <p className="m-0">Apaga a conta e o progresso guardado no servidor. O que está neste aparelho continua aqui. Não dá para desfazer.</p>
        <form onSubmit={excluir} className="grid gap-2" noValidate>
          <label htmlFor={idSenha} className="font-semibold">
            Senha para confirmar
          </label>
          <input id={idSenha} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" className="min-h-12 max-w-sm rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg" />
          {erro && (
            <p role="alert" className="m-0 font-semibold">
              {erro}
            </p>
          )}
          <div>
            <button type="submit" className="btn" disabled={excluindo}>
              {excluindo ? 'Excluindo…' : 'Excluir minha conta'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
