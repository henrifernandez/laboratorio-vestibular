import { useId, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useConta } from '@/conta/ContaContext'

type Modo = 'entrar' | 'criar'

const NOME_MIN = 3
const SENHA_MIN = 8

/** Entrar ou criar conta, só com nome e senha. */
export default function Entrar() {
  const conta = useConta()
  const navegar = useNavigate()
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [convite, setConvite] = useState('')
  const [ver, setVer] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const idNome = useId()
  const idSenha = useId()
  const idConvite = useId()
  const idAjuda = useId()

  if (conta.fase === 'logado') return <Navigate to="/conta" replace />

  const criar = modo === 'criar'

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    // as mesmas regras do servidor, só para avisar sem esperar a resposta
    if (nome.trim().length < NOME_MIN) return setErro(`O nome precisa ter pelo menos ${NOME_MIN} caracteres.`)
    if (criar && senha.length < SENHA_MIN) return setErro(`A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`)
    if (!senha) return setErro('Escreva a senha.')
    setEnviando(true)
    const r = criar ? await conta.cadastrar(nome, senha, convite) : await conta.entrar(nome, senha)
    setEnviando(false)
    if (r.ok) navegar('/conta', { replace: true })
    else setErro(r.erro)
  }

  if (conta.fase === 'indisponivel') {
    return (
      <div className="container-site grid max-w-xl gap-4 py-12">
        <h1 className="text-3xl">Contas indisponíveis</h1>
        <p>As contas não estão disponíveis neste momento. Você pode continuar estudando normalmente: o progresso fica guardado neste navegador.</p>
        <div>
          <Link to="/" className="btn btn-primario no-underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-site grid max-w-xl gap-5 py-10">
      <div className="grid gap-1">
        <h1 className="text-3xl">{criar ? 'Criar conta' : 'Entrar'}</h1>
        <p className="m-0 text-[var(--ink-muted)]">Só nome e senha. Com a conta, seu progresso fica guardado e aparece em qualquer aparelho. Sem conta, tudo continua funcionando neste navegador.</p>
      </div>

      <div role="group" aria-label="Escolha entre entrar e criar conta" className="flex flex-wrap gap-2">
        {(['entrar', 'criar'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={modo === m}
            onClick={() => {
              setModo(m)
              setErro(null)
            }}
            className={`btn ${modo === m ? 'btn-primario' : ''}`}
          >
            {m === 'entrar' ? 'Já tenho conta' : 'Criar conta'}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="cartao grid gap-4 p-4" noValidate>
        <div className="grid gap-1">
          <label htmlFor={idNome} className="font-semibold">
            Nome
          </label>
          <input
            id={idNome}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="username"
            autoCapitalize="words"
            spellCheck={false}
            maxLength={40}
            aria-describedby={criar ? idAjuda : undefined}
            className="min-h-12 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor={idSenha} className="font-semibold">
            Senha
          </label>
          <div className="flex gap-2">
            <input
              id={idSenha}
              type={ver ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={criar ? 'new-password' : 'current-password'}
              maxLength={72}
              aria-describedby={criar ? idAjuda : undefined}
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg"
            />
            <button type="button" className="btn" aria-pressed={ver} aria-label={ver ? 'Esconder a senha' : 'Mostrar a senha'} onClick={() => setVer((v) => !v)}>
              {ver ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {criar && conta.exigeConvite && (
          <div className="grid gap-1">
            <label htmlFor={idConvite} className="font-semibold">
              Código de convite
            </label>
            <input id={idConvite} value={convite} onChange={(e) => setConvite(e.target.value)} autoComplete="off" spellCheck={false} className="min-h-12 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-lg" />
            <p className="m-0 text-sm text-[var(--ink-muted)]">Quem te convidou passou este código.</p>
          </div>
        )}
        {criar && (
          <p id={idAjuda} className="m-0 text-sm text-[var(--ink-muted)]">
            Nome de 3 a 24 caracteres (letras, números, espaço, ponto, hífen ou sublinhado). Senha de 8 a 72 caracteres. Guardamos só o nome, a senha embaralhada (nunca o texto da senha) e o seu progresso. Não há e-mail: se esquecer a senha, não dá para recuperá-la.
          </p>
        )}
        {erro && (
          <p role="alert" className="m-0 rounded-lg border border-[var(--erro)] px-3 py-2 font-semibold">
            {erro}
          </p>
        )}
        <div>
          <button type="submit" className="btn btn-primario" disabled={enviando || conta.fase === 'carregando'}>
            {enviando ? 'Aguarde…' : criar ? 'Criar conta e entrar' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
