import type { Autor } from '@/conteudo/humanas'

/** Qualquer tipo de aspas: o conteúdo das humanas não pode ter citações atribuídas a autores. */
const ASPAS = /["“”«»]/

/**
 * Conferências de integridade dos autores de um tema, usadas nos testes (precisam de `expect` global).
 * Cobrem as regras editoriais: ideias em palavras próprias (sem aspas), fontes citadas, campos completos.
 */
export function verificarAutores(autores: Autor[], minAutores: number) {
  expect(autores.length).toBeGreaterThanOrEqual(minAutores)
  expect(new Set(autores.map((a) => a.id)).size).toBe(autores.length)
  const termos = autores.flatMap((a) => a.conceitos.map((c) => c.termo))
  expect(new Set(termos).size, 'termos de conceito repetidos entre autores').toBe(termos.length)
  const titulos = autores.flatMap((a) => a.obras.map((o) => o.titulo))
  expect(new Set(titulos).size, 'obras repetidas entre autores').toBe(titulos.length)
  const sentidos = autores.flatMap((a) => a.conceitos.map((c) => c.sentido))
  expect(new Set(sentidos).size, 'sentidos repetidos').toBe(sentidos.length)
  const afirmacoes = autores.flatMap((a) => a.afirmacoes.map((x) => x.texto))
  expect(new Set(afirmacoes).size, 'afirmações repetidas').toBe(afirmacoes.length)

  for (const a of autores) {
    const r = a.nome
    expect(a.nome.length, r).toBeGreaterThan(3)
    expect(a.nascimento, r).toBeLessThan(a.morte)
    expect(a.periodo, `${r}: o período cita o ano de nascimento`).toContain(String(Math.abs(a.nascimento)))
    expect(a.ideia.length, `${r}: ideia`).toBeGreaterThan(300)
    expect(a.resumo.endsWith('.'), `${r}: resumo termina com ponto`).toBe(true)
    expect(a.contexto.length, `${r}: contexto`).toBeGreaterThan(40)
    expect(a.conceitos.length, `${r}: conceitos`).toBeGreaterThanOrEqual(3)
    expect(a.afirmacoes.length, `${r}: afirmações`).toBeGreaterThanOrEqual(3)
    expect(a.cuidados.length, `${r}: cuidados`).toBeGreaterThanOrEqual(2)
    expect(a.fontes.length, `${r}: fontes`).toBeGreaterThanOrEqual(2)
    for (const f of a.fontes) expect(f.trim().length, `${r}: fonte vazia`).toBeGreaterThan(10)
    // regra editorial: nenhuma citação literal (sem aspas) nas ideias, resumos, afirmações e sentidos
    for (const t of [a.resumo, a.ideia, a.contexto, ...a.afirmacoes.map((x) => x.texto), ...a.conceitos.map((c) => c.sentido), ...a.cuidados.filter((c) => c.length > 0).map((c) => c.replace(/“[^”]{1,25}”/g, ''))])
      expect(ASPAS.test(t), `${r}: aspas em «${t.slice(0, 50)}…»`).toBe(false)
    for (const c of a.conceitos) {
      expect(c.sentido.length, `${r}/${c.termo}`).toBeGreaterThan(30)
      expect(c.sentido.toLowerCase().includes(c.termo.toLowerCase()), `${r}: o sentido não deve repetir o termo (${c.termo})`).toBe(false)
    }
    for (const x of a.afirmacoes) {
      expect(x.texto.length, r).toBeGreaterThan(40)
      for (const id of x.tambem ?? []) expect(autores.some((o) => o.id === id), `${r}: tambem ${id}`).toBe(true)
    }
    for (const o of a.obras) if (o.ano) expect(/\d{3,4}/.test(o.ano), `${r}: ano da obra ${o.titulo}`).toBe(true)
  }
}
