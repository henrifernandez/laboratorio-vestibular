import type { Autor } from '@/conteudo/humanas'
import { NOTA_AUTORES } from '@/conteudo/humanas'

/** Cartão de um autor: quem foi, a ideia central em palavras próprias, conceitos, obras e cuidados. */
export function CartaoAutor({ autor, compacto = false, nivelTitulo = 3 }: { autor: Autor; compacto?: boolean; nivelTitulo?: 2 | 3 | 4 }) {
  const Titulo = `h${nivelTitulo}` as 'h2' | 'h3' | 'h4'
  return (
    <article className="cartao grid gap-3 p-4" aria-label={`Cartão de ${autor.nome}`}>
      <header className="grid gap-0.5">
        <Titulo className="m-0 text-xl">{autor.nome}</Titulo>
        <p className="num m-0 text-sm text-[var(--ink-muted)]">
          {autor.periodo} · {autor.lugar}
        </p>
        <p className="m-0 text-sm">
          <strong>Corrente:</strong> {autor.tradicao}
        </p>
      </header>
      <p className="m-0 font-semibold">{autor.resumo}</p>
      {!compacto && (
        <>
          <p className="m-0">{autor.ideia}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            <strong>Contexto:</strong> {autor.contexto}
          </p>
        </>
      )}
      <section aria-label={`Conceitos de ${autor.nome}`}>
        <h4 className="m-0 mb-1 text-sm font-semibold text-[var(--ink-muted)]">Conceitos</h4>
        <dl className="m-0 grid gap-2">
          {autor.conceitos.slice(0, compacto ? 2 : undefined).map((c) => (
            <div key={c.termo}>
              <dt className="font-semibold">{c.termo}</dt>
              <dd className="m-0 text-sm">{c.sentido}</dd>
            </div>
          ))}
        </dl>
      </section>
      {!compacto && (
        <>
          <section aria-label={`Obras de ${autor.nome}`}>
            <h4 className="m-0 mb-1 text-sm font-semibold text-[var(--ink-muted)]">Obras</h4>
            {autor.obras.length ? (
              <ul className="m-0 grid list-disc gap-0.5 pl-5 text-sm">
                {autor.obras.map((o) => (
                  <li key={o.titulo}>
                    <em>{o.titulo}</em>
                    {o.ano ? ` (${o.ano})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm">Não deixou obras escritas: o que sabemos vem de textos de outros autores.</p>
            )}
          </section>
          <section aria-label={`Cuidados com ${autor.nome}`}>
            <h4 className="m-0 mb-1 text-sm font-semibold text-[var(--ink-muted)]">Cuidado com a pegadinha</h4>
            <ul className="m-0 grid list-disc gap-0.5 pl-5 text-sm">
              {autor.cuidados.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
          <details className="text-xs text-[var(--ink-muted)]">
            <summary className="cursor-pointer">Fontes</summary>
            <ul className="m-0 mt-1 grid list-disc gap-0.5 pl-5">
              {autor.fontes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="m-0 mt-1">{NOTA_AUTORES}</p>
          </details>
        </>
      )}
    </article>
  )
}

/** Comparação lado a lado de dois autores. */
export function TabelaComparar({ a, b }: { a: Autor; b: Autor }) {
  const linhas: [string, string, string][] = [
    ['Período', a.periodo, b.periodo],
    ['Corrente', a.tradicao, b.tradicao],
    ['Ideia em uma frase', a.resumo, b.resumo],
    ['Conceitos', a.conceitos.map((c) => c.termo).join('; '), b.conceitos.map((c) => c.termo).join('; ')],
    ['Obras', a.obras.map((o) => o.titulo).join('; ') || '—', b.obras.map((o) => o.titulo).join('; ') || '—'],
  ]
  return (
    <div className="cartao overflow-x-auto p-3">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">
          {a.nome} e {b.nome}
        </caption>
        <thead>
          <tr className="border-b border-[var(--line-strong)] text-left">
            <th scope="col" className="py-1 pr-2" />
            <th scope="col" className="px-1">{a.nome}</th>
            <th scope="col" className="px-1">{b.nome}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map(([rotulo, x, y]) => (
            <tr key={rotulo} className="border-b border-[var(--line)] align-top">
              <th scope="row" className="py-1 pr-2 text-left font-semibold">{rotulo}</th>
              <td className="px-1">{x}</td>
              <td className="px-1">{y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
