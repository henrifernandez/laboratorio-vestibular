import { AlertTriangle, Lightbulb } from 'lucide-react'
import type { SecaoResumo } from '@/conteudo/tipos'
import { Tex } from './Tex'

/** Resumo para a prova: fórmulas, ideias-chave e pegadinhas comuns. */
export function ResumoSecoes({ secoes }: { secoes: SecaoResumo[] }) {
  return (
    <div className="grid gap-4">
      <p className="max-w-[65ch] text-[var(--ink-muted)]">O essencial para a prova: fórmulas, ideias-chave e as pegadinhas mais comuns.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {secoes.map((s) => (
          <section key={s.titulo} className="cartao grid content-start gap-3 p-4" aria-labelledby={`r-${s.titulo}`}>
            <h2 id={`r-${s.titulo}`} className="text-2xl" style={{ color: 'var(--accent)' }}>
              {s.titulo}
            </h2>
            {s.formulas.length > 0 && (
              <dl className="m-0 grid gap-2">
                {s.formulas.map((f) => (
                  <div key={f.rotulo} className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
                    <dt className="text-sm text-[var(--ink-muted)]">{f.rotulo}</dt>
                    <dd className="m-0 overflow-x-auto">
                      <Tex bloco>{f.tex}</Tex>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
                <Lightbulb size={18} aria-hidden="true" /> Ideias-chave
              </h3>
              <ul className="m-0 grid gap-1 pl-5">
                {s.ideias.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-[var(--aviso-bg)] p-3">
              <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
                <AlertTriangle size={18} aria-hidden="true" /> Pegadinhas
              </h3>
              <ul className="m-0 grid gap-1 pl-5">
                {s.pegadinhas.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
