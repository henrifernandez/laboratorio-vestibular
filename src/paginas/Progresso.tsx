import { Link } from 'react-router-dom'
import { MATERIAS } from '@/conteudo/materias'
import { maisErrados, resumoPorTema } from '@/desafios/progresso'
import { useProgresso } from '@/desafios/useProgresso'

const NOME_DESAFIO: Record<string, string> = {
  esboce: 'Esboce a função',
  formula: 'Qual é a fórmula',
  detetive: 'Detetive de gráfico',
  encaixe: 'Encaixe',
  alvo: 'Alvo',
  cruzamento: 'Qual cresce mais e quando',
  sucessivos: 'Aumentos e descontos sucessivos',
  montante: 'Montante e juros',
  regime: 'Qual é o regime?',
}

function descrever(chave: string) {
  const [id, nivel] = chave.split(':')
  const [materia, tema, slug] = (id ?? '').split('/')
  const m = MATERIAS.find((x) => x.id === materia)
  const t = m?.temas.find((x) => x.id === tema)
  return {
    id: id ?? chave,
    nivel: Number(nivel) || 1,
    texto: `${m?.nome ?? materia} / ${t?.titulo ?? tema} / ${NOME_DESAFIO[slug ?? ''] ?? slug} (nível ${nivel})`,
  }
}

export default function Progresso() {
  const progresso = useProgresso()
  const errados = maisErrados(progresso).slice(0, 8)
  const linhas = MATERIAS.flatMap((m) =>
    m.temas
      .filter((t) => t.disponivel)
      .map((t) => ({ m, t, ...resumoPorTema(progresso, m.id, t.id) })),
  )

  return (
    <div className="container-site grid gap-8 py-8">
      <h1 className="text-4xl">Meu progresso</h1>

      <section aria-labelledby="por-tema" className="grid gap-3">
        <h2 id="por-tema" className="text-2xl">
          Acertos por tema
        </h2>
        {linhas.every((l) => l.tentativas === 0) ? (
          <p className="text-[var(--ink-muted)]">
            Nada por aqui ainda. Responda um desafio e o resultado aparece neste painel.{' '}
            <Link to="/materia/matematica/funcoes?aba=desafios">Ir para os desafios de Funções</Link>
          </p>
        ) : (
          <div className="cartao overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th scope="col" className="p-3">Tema</th>
                  <th scope="col" className="p-3 text-right">Tentativas</th>
                  <th scope="col" className="p-3 text-right">Acertos</th>
                  <th scope="col" className="p-3 text-right">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ m, t, tentativas, acertos }) => (
                  <tr key={`${m.id}/${t.id}`} className="border-b border-[var(--line)] last:border-0">
                    <th scope="row" className="p-3 font-semibold">
                      {m.nome} / {t.titulo}
                    </th>
                    <td className="num p-3 text-right">{tentativas}</td>
                    <td className="num p-3 text-right">{acertos}</td>
                    <td className="num p-3 text-right">{tentativas ? `${Math.round((acertos / tentativas) * 100)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="errados" className="grid gap-3">
        <h2 id="errados" className="text-2xl">
          Onde mais errei
        </h2>
        {errados.length === 0 ? (
          <p className="text-[var(--ink-muted)]">Nenhum erro registrado. Quando errar, os desafios mais difíceis para você aparecem aqui.</p>
        ) : (
          <ul className="m-0 grid list-none gap-2 p-0">
            {errados.map((e) => {
              const d = descrever(e.id)
              return (
                <li key={e.id} className="cartao flex flex-wrap items-center justify-between gap-3 p-3">
                  <span>
                    {d.texto} <span className="chip num">{e.erros} {e.erros === 1 ? 'erro' : 'erros'}</span>
                  </span>
                  <Link to={`/revisao?foco=${encodeURIComponent(d.id)}&nivel=${d.nivel}`} className="btn btn-primario no-underline">
                    Praticar
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
