// @vitest-environment node
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

/* Contraste das cores do design (WCAG 2.x): texto precisa de 4,5:1; figuras que carregam informação, de 3:1. */

type Tokens = Record<string, string>

function bloco(inicio: string): Tokens {
  const a = css.indexOf(inicio)
  expect(a, `bloco "${inicio}" em tokens.css`).toBeGreaterThanOrEqual(0)
  const b = css.indexOf('\n}\n', a)
  const t: Tokens = {}
  for (const m of css.slice(a, b).matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) t[m[1] as string] = m[2] as string
  return t
}

/** O tema escuro existe duas vezes (preferência do sistema e forçado pelo botão); `data-theme='light'` deve voltar ao claro mesmo no sistema escuro. */
const claro = bloco(':root {')
const escuroForcado = bloco(":root[data-theme='dark'] {")
const escuroDoSistema = bloco(":root:not([data-theme='light']) {")

const luminancia = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const razao = (a: string, b: string) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

const FUNDOS = ['paper', 'surface', 'surface-2']
const TEXTOS = ['ink', 'ink-muted', 'ok', 'erro', 'aviso']
const ACENTOS = Object.keys(claro).filter((k) => k.startsWith('accent-'))
// cores de elemento usadas como texto (símbolos nas fórmulas de traços)
const TEXTOS_DE_ELEMENTO = ['el-o', 'el-n', 'el-cl', 'el-br']
// figuras com informação (átomos, organelas, linhas de gráfico); `--luz` é só o brilho da lâmpada, sempre com contorno em --ink
const FIGURAS = ['el-o', 'el-n', 'el-cl', 'el-br', 'quim-b', 'quim-c', 'quim-no2', 'cel-nucleo', 'cel-mito', 'cel-cloro', 'cel-rer', 'cel-rel', 'cel-golgi', 'cel-perox', 'cel-vacuolo', 'cel-parede', 'cel-ribossomo', 'cobre']

describe.each([
  ['claro', claro],
  ['escuro', escuroForcado],
])('Contraste do tema %s', (_nome, t) => {
  it('texto comum, em cada fundo, passa de 4,5:1', () => {
    for (const f of FUNDOS) for (const x of TEXTOS) expect(razao(t[x] as string, t[f] as string), `${x} em ${f}`).toBeGreaterThanOrEqual(4.5)
  })
  it('mensagens de acerto, erro e aviso passam de 4,5:1 sobre o próprio fundo', () => {
    for (const k of ['ok', 'erro', 'aviso']) expect(razao(t[k] as string, t[`${k}-bg`] as string), k).toBeGreaterThanOrEqual(4.5)
  })
  it('a cor de cada matéria serve como texto em qualquer fundo e como fundo de botão com texto --on-accent', () => {
    expect(ACENTOS).toHaveLength(8)
    for (const a of ACENTOS) {
      for (const f of FUNDOS) expect(razao(t[a] as string, t[f] as string), `${a} como texto em ${f}`).toBeGreaterThanOrEqual(4.5)
      expect(razao(t['on-accent'] as string, t[a] as string), `on-accent sobre ${a}`).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('o anel de foco aparece (3:1) sobre os fundos', () => {
    for (const f of FUNDOS) expect(razao(t.focus as string, t[f] as string), `foco em ${f}`).toBeGreaterThanOrEqual(3)
  })
  it('as cores de elemento usadas como texto passam de 4,5:1 sobre os cartões', () => {
    for (const k of TEXTOS_DE_ELEMENTO) for (const f of ['surface', 'surface-2']) expect(razao(t[k] as string, t[f] as string), `${k} em ${f}`).toBeGreaterThanOrEqual(4.5)
  })
  it('as cores das figuras passam de 3:1 sobre os cartões', () => {
    for (const g of FIGURAS) for (const f of ['surface', 'surface-2']) expect(razao(t[g] as string, t[f] as string), `${g} em ${f}`).toBeGreaterThanOrEqual(3)
  })
})

describe('Tema escuro', () => {
  it('o bloco do sistema e o forçado pelo botão têm exatamente os mesmos valores', () => {
    const chaves = Object.keys(escuroForcado).filter((k) => !k.startsWith('shadow'))
    expect(chaves.length).toBeGreaterThan(40)
    for (const k of chaves) expect(escuroDoSistema[k], k).toBe(escuroForcado[k])
    expect(Object.keys(escuroDoSistema).sort()).toEqual(Object.keys(escuroForcado).sort())
  })
})
