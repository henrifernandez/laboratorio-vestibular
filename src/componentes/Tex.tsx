import katex from 'katex'
import { useMemo } from 'react'

/** Fórmula em LaTeX. O conteúdo vem sempre do próprio código/dados do site, nunca de texto digitado. */
export function Tex({ children, bloco = false, rotulo }: { children: string; bloco?: boolean; rotulo?: string }) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: bloco, throwOnError: false, output: 'htmlAndMathml' }),
    [children, bloco],
  )
  return (
    <span
      className={bloco ? 'block overflow-x-auto py-1' : undefined}
      role={rotulo ? 'math' : undefined}
      aria-label={rotulo}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
