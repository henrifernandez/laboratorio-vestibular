import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { lerProgresso, salvarProgresso } from '@/desafios/progresso'
import { mesclarProgresso, progressosIguais, sanitizarProgresso, type DicionarioProgresso } from '@/lib/mesclar'
import { chamar } from './api'

export type FaseConta = 'carregando' | 'indisponivel' | 'anonimo' | 'logado'
export type EstadoSync = 'ocioso' | 'sincronizando' | 'ok' | 'erro'

export type Resultado = { ok: true } | { ok: false; erro: string }

interface ValorConta {
  fase: FaseConta
  nome: string | null
  /** o servidor exige código de convite para criar conta */
  exigeConvite: boolean
  sync: EstadoSync
  entrar(nome: string, senha: string): Promise<Resultado>
  cadastrar(nome: string, senha: string, convite?: string): Promise<Resultado>
  /** `apagarLocal`: também apaga o progresso guardado neste aparelho (para computadores compartilhados) */
  sair(apagarLocal?: boolean): Promise<void>
  excluir(senha: string): Promise<Resultado>
}

const Contexto = createContext<ValorConta | null>(null)

const ATRASO_ENVIO = 2000

export function ContaProvider({ children }: { children: ReactNode }) {
  const [fase, setFase] = useState<FaseConta>('carregando')
  const [nome, setNome] = useState<string | null>(null)
  const [exigeConvite, setExigeConvite] = useState(false)
  const [sync, setSync] = useState<EstadoSync>('ocioso')
  const logado = fase === 'logado'
  const trabalhando = useRef(false)

  /** Junta o progresso do aparelho com o da conta e guarda o resultado nos dois lugares. */
  const sincronizar = useCallback(async () => {
    if (trabalhando.current) return
    trabalhando.current = true
    setSync('sincronizando')
    try {
      const lido = await chamar<{ progresso: unknown }>('/api/progresso', 'GET')
      if (lido.status === 401) {
        // sessão expirada em outro lugar: volta a ser anônimo, sem perder nada no aparelho
        setFase('anonimo')
        setNome(null)
        setSync('ocioso')
        return
      }
      const doServidor = lido.dados ? sanitizarProgresso(lido.dados.progresso) : null
      if (!doServidor) {
        setSync('erro')
        return
      }
      const local = lerProgresso()
      const junto = mesclarProgresso(local, doServidor)
      if (!progressosIguais(junto, local)) salvarProgresso(junto)
      if (!progressosIguais(junto, doServidor)) {
        const gravado = await chamar<{ progresso: unknown }>('/api/progresso', 'PUT', { progresso: junto })
        if (!gravado.dados) {
          setSync('erro')
          return
        }
      }
      setSync('ok')
    } finally {
      trabalhando.current = false
    }
  }, [])

  // ao abrir o site: há contas? quem está logado?
  useEffect(() => {
    let vivo = true
    chamar<{ disponivel: boolean; usuario: { nome: string } | null; exigeConvite: boolean }>('/api/eu', 'GET').then((r) => {
      if (!vivo) return
      if (!r.dados || !r.dados.disponivel) return setFase('indisponivel')
      setExigeConvite(!!r.dados.exigeConvite)
      if (r.dados.usuario) {
        setNome(r.dados.usuario.nome)
        setFase('logado')
      } else setFase('anonimo')
    })
    return () => {
      vivo = false
    }
  }, [])

  // já logado: sincroniza ao abrir e quando a aba volta a ficar visível
  useEffect(() => {
    if (!logado) return
    void sincronizar()
    let ultima = Date.now()
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && Date.now() - ultima > 60_000) {
        ultima = Date.now()
        void sincronizar()
      }
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [logado, sincronizar])

  // cada desafio respondido é enviado depois de uma pequena pausa (várias respostas seguidas viram um só envio)
  useEffect(() => {
    if (!logado) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const aoMudar = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void sincronizar(), ATRASO_ENVIO)
    }
    window.addEventListener('lv:progresso', aoMudar)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('lv:progresso', aoMudar)
    }
  }, [logado, sincronizar])

  const aoEntrar = useCallback((n: string) => {
    setNome(n)
    setFase('logado')
  }, [])

  const valor = useMemo<ValorConta>(
    () => ({
      fase,
      nome,
      exigeConvite,
      sync,
      async entrar(n, senha) {
        const r = await chamar<{ nome: string }>('/api/entrar', 'POST', { nome: n, senha })
        if (!r.dados) return { ok: false, erro: r.erro ?? 'Não foi possível entrar.' }
        aoEntrar(r.dados.nome)
        return { ok: true }
      },
      async cadastrar(n, senha, convite) {
        const r = await chamar<{ nome: string }>('/api/cadastrar', 'POST', { nome: n, senha, ...(convite ? { convite } : {}) })
        if (!r.dados) return { ok: false, erro: r.erro ?? 'Não foi possível criar a conta.' }
        aoEntrar(r.dados.nome)
        return { ok: true }
      },
      async sair(apagarLocal = false) {
        await chamar('/api/sair', 'POST', {})
        if (apagarLocal) salvarProgresso({})
        setNome(null)
        setFase('anonimo')
        setSync('ocioso')
      },
      async excluir(senha) {
        const r = await chamar('/api/excluir-conta', 'POST', { senha })
        if (r.status !== 200) return { ok: false, erro: r.erro ?? 'Não foi possível excluir a conta.' }
        setNome(null)
        setFase('anonimo')
        setSync('ocioso')
        return { ok: true }
      },
    }),
    [fase, nome, exigeConvite, sync, aoEntrar],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useConta(): ValorConta {
  const v = useContext(Contexto)
  if (!v) throw new Error('useConta fora do ContaProvider')
  return v
}

export type { DicionarioProgresso }
