import { useCallback, useMemo, useState, type ComponentType } from 'react'
import { CheckCircle2, ClipboardCopy, Lightbulb, RefreshCw, RotateCcw, XCircle } from 'lucide-react'
import { acharTema } from '@/conteudo/materias'
import { linhaCaderno } from './caderno'
import { registrarTentativa } from './progresso'
import type { Correcao, Desafio, Nivel } from './tipos'

export interface EntradaProps<I, R> {
  inst: I
  resposta: R
  onChange: (r: R) => void
  correcao: Correcao | null
  bloqueado: boolean
}

export interface DefinicaoDesafio<I = unknown, R = unknown> {
  desafio: Desafio<I, R>
  /** uma frase: o que a pessoa faz */
  instrucao: string
  respostaInicial(inst: I): R
  podeEnviar(r: R, inst: I): boolean
  Entrada: ComponentType<EntradaProps<I, R>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DefinicaoQualquer = DefinicaoDesafio<any, any>

const NIVEIS: Nivel[] = [1, 2, 3]
const NOME_NIVEL: Record<Nivel, string> = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' }
const novaSemente = () => Math.floor(Math.random() * 1_000_000) + 1

export function idProgresso(d: DefinicaoQualquer, nivel: Nivel) {
  return `${d.desafio.id}:${nivel}`
}

export function PainelDesafio({ def, nivelInicial = 1 }: { def: DefinicaoQualquer; nivelInicial?: Nivel }) {
  const { desafio } = def
  const [nivel, setNivel] = useState<Nivel>(nivelInicial)
  const [semente, setSemente] = useState(novaSemente)
  const [rodada, setRodada] = useState(0) // muda ao "tentar de novo", para reiniciar a entrada
  const inst = useMemo(() => desafio.gerar(semente, nivel), [desafio, semente, nivel])
  const [resposta, setResposta] = useState(() => def.respostaInicial(inst))
  const [correcao, setCorrecao] = useState<Correcao | null>(null)
  const [dicasVistas, setDicasVistas] = useState(0)
  const [copiado, setCopiado] = useState<'sim' | 'nao' | null>(null)

  const dicas = useMemo(() => desafio.dicas(inst), [desafio, inst])

  const reiniciar = useCallback(
    (n: Nivel, s: number) => {
      const i = desafio.gerar(s, n)
      setNivel(n)
      setSemente(s)
      setResposta(def.respostaInicial(i))
      setCorrecao(null)
      setDicasVistas(0)
      setCopiado(null)
      setRodada((r) => r + 1)
    },
    [desafio, def],
  )

  const verificar = () => {
    const c = desafio.corrigir(inst, resposta)
    setCorrecao(c)
    registrarTentativa(idProgresso(def, nivel), c.correto)
  }

  const tentarDeNovo = () => {
    setCorrecao(null)
    setResposta(def.respostaInicial(inst))
    setRodada((r) => r + 1)
  }

  const copiar = async () => {
    if (!correcao) return
    const tema = acharTema(desafio.materia, desafio.tema)?.titulo ?? desafio.tema
    const linha = linhaCaderno({
      data: new Date(),
      materia: desafio.materia,
      tema,
      titulo: desafio.titulo,
      nivel,
      motivo: correcao.motivo ?? 'resposta incorreta',
      licao: correcao.licao ?? 'revisar a resolução comentada',
    })
    try {
      await navigator.clipboard.writeText(linha)
      setCopiado('sim')
    } catch {
      setCopiado('nao')
    }
  }

  const respondido = correcao !== null
  const Entrada = def.Entrada

  return (
    <section className="cartao grid gap-4 p-4 sm:p-5" aria-labelledby="titulo-desafio">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="titulo-desafio" className="text-2xl">
              {desafio.titulo}
            </h2>
            <p className="text-[var(--ink-muted)]">{def.instrucao}</p>
          </div>
          <button type="button" className="btn" onClick={() => reiniciar(nivel, novaSemente())}>
            <RefreshCw size={18} aria-hidden="true" />
            Outro parecido
          </button>
        </div>
        <div role="radiogroup" aria-label="Nível de dificuldade" className="flex flex-wrap gap-2">
          {NIVEIS.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === nivel}
              className={`btn ${n === nivel ? 'btn-primario' : ''}`}
              onClick={() => n !== nivel && reiniciar(n, novaSemente())}
            >
              Nível {n} · {NOME_NIVEL[n]}
            </button>
          ))}
        </div>
      </header>

      <Entrada
        key={`${semente}-${nivel}-${rodada}`}
        inst={inst}
        resposta={resposta}
        onChange={setResposta}
        correcao={correcao}
        bloqueado={respondido}
      />

      <div className="flex flex-wrap items-center gap-2">
        {!respondido && (
          <button type="button" className="btn btn-primario" onClick={verificar} disabled={!def.podeEnviar(resposta, inst)}>
            Verificar
          </button>
        )}
        {respondido && !correcao.correto && (
          <button type="button" className="btn btn-primario" onClick={tentarDeNovo}>
            <RotateCcw size={18} aria-hidden="true" />
            Tentar de novo
          </button>
        )}
        {respondido && correcao.correto && (
          <button type="button" className="btn btn-primario" onClick={() => reiniciar(nivel, novaSemente())}>
            Próximo desafio
          </button>
        )}
        {!respondido && (
          <button
            type="button"
            className="btn"
            onClick={() => setDicasVistas((v) => Math.min(v + 1, dicas.length))}
            disabled={dicasVistas >= dicas.length}
          >
            <Lightbulb size={18} aria-hidden="true" />
            Dica ({dicasVistas}/{dicas.length})
          </button>
        )}
        <span className="num text-sm text-[var(--ink-muted)]">Exercício #{semente}</span>
      </div>

      {dicasVistas > 0 && !respondido && (
        <ol className="m-0 grid gap-2 pl-5" aria-label="Dicas">
          {dicas.slice(0, dicasVistas).map((d, i) => (
            <li key={i} className="rounded-lg bg-[var(--aviso-bg)] px-3 py-2 text-[var(--ink)]">
              {d}
            </li>
          ))}
        </ol>
      )}

      <div aria-live="polite">
        {respondido && (
          <div
            className="grid gap-3 rounded-[var(--radius)] border p-4"
            style={{
              background: correcao.correto ? 'var(--ok-bg)' : 'var(--erro-bg)',
              borderColor: correcao.correto ? 'var(--ok)' : 'var(--erro)',
            }}
          >
            <p className="flex items-start gap-2 font-semibold" style={{ color: correcao.correto ? 'var(--ok)' : 'var(--erro)' }}>
              {correcao.correto ? <CheckCircle2 size={22} aria-hidden="true" /> : <XCircle size={22} aria-hidden="true" />}
              <span>{correcao.correto ? 'Certo!' : 'Ainda não.'}</span>
            </p>
            <p className="text-[var(--ink)]">{correcao.feedback}</p>
            {!correcao.correto && correcao.parcial !== undefined && correcao.parcial > 0 && (
              <p className="num text-sm text-[var(--ink-muted)]">Você acertou cerca de {Math.round(correcao.parcial * 100)}%.</p>
            )}
          </div>
        )}
      </div>

      {respondido && (
        <div className="grid gap-3">
          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <h3 className="mb-1 text-lg">Resolução comentada</h3>
            <p>{desafio.explicar(inst)}</p>
          </div>
          {!correcao.correto && (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn" onClick={copiar}>
                <ClipboardCopy size={18} aria-hidden="true" />
                Copiar para o caderno de erros
              </button>
              <span aria-live="polite" className="text-sm text-[var(--ink-muted)]">
                {copiado === 'sim' && 'Linha copiada. Cole no caderno-de-erros.md.'}
                {copiado === 'nao' && 'Não consegui copiar automaticamente: selecione a linha abaixo.'}
              </span>
              {copiado === 'nao' && (
                <code className="block w-full overflow-x-auto rounded bg-[var(--surface-2)] p-2 text-sm">
                  {linhaCaderno({
                    data: new Date(),
                    materia: desafio.materia,
                    tema: acharTema(desafio.materia, desafio.tema)?.titulo ?? desafio.tema,
                    titulo: desafio.titulo,
                    nivel,
                    motivo: correcao.motivo ?? 'resposta incorreta',
                    licao: correcao.licao ?? 'revisar a resolução comentada',
                  })}
                </code>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
