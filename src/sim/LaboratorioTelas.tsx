import { useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Compass, FlaskConical, Gamepad2, Sparkles } from 'lucide-react'
import { JogoDesafios } from '@/desafios/JogoDesafios'
import type { DefinicaoQualquer } from '@/desafios/PainelDesafio'
import { BarraDeTelas, type Tela } from './BarraDeTelas'

export interface TelaLab {
  /** 'intro', 'explorar' e 'lab' já têm rótulo e ícone; outras telas trazem os seus */
  id: string
  rotulo?: string
  icone?: ReactNode
  /** conteúdo da tela; o componente é remontado ao entrar */
  conteudo: ReactNode
}

const ROTULOS: Record<string, { rotulo: string; icone: ReactNode }> = {
  intro: { rotulo: 'Introdução', icone: <Sparkles size={18} /> },
  explorar: { rotulo: 'Explorar', icone: <Compass size={18} /> },
  lab: { rotulo: 'Laboratório', icone: <FlaskConical size={18} /> },
  jogo: { rotulo: 'Jogo', icone: <Gamepad2 size={18} /> },
}

/** Simulação com as telas Introdução, Explorar, Laboratório (e outras, se houver) e Jogo numa barra inferior. A tela fica na URL (?tela=). */
export function LaboratorioTelas({ telas, desafios }: { telas: TelaLab[]; desafios: DefinicaoQualquer[] }) {
  const [busca, setBusca] = useSearchParams()
  const lista: Tela[] = useMemo(
    () => [
      ...telas.map((t) => ({ id: t.id, rotulo: t.rotulo ?? ROTULOS[t.id]?.rotulo ?? t.id, icone: t.icone ?? ROTULOS[t.id]?.icone })),
      { id: 'jogo', ...(ROTULOS.jogo as { rotulo: string }) },
    ],
    [telas],
  )
  const atual = lista.find((t) => t.id === busca.get('tela'))?.id ?? (telas[0]?.id as string)
  const mudar = (id: string) =>
    setBusca(
      (p) => {
        const n = new URLSearchParams(p)
        n.set('tela', id)
        return n
      },
      { replace: true },
    )
  return (
    <div className="cartao overflow-hidden">
      <div className="p-4 sm:p-5">
        {telas.map((t) => (t.id === atual ? <div key={t.id}>{t.conteudo}</div> : null))}
        {atual === 'jogo' && <JogoDesafios desafios={desafios} />}
      </div>
      <BarraDeTelas telas={lista} atual={atual} onChange={mudar} />
    </div>
  )
}
