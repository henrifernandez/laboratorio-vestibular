import {
  addDependencies,
  create,
  divideDependencies,
  multiplyDependencies,
  parseDependencies,
  powDependencies,
  subtractDependencies,
  unaryMinusDependencies,
  unaryPlusDependencies,
} from 'mathjs'

// só o analisador e os operadores básicos: o pacote completo do mathjs pesaria mais de 600 kB
const { parse } = create({
  parseDependencies: parseDependencies!,
  addDependencies: addDependencies!,
  subtractDependencies: subtractDependencies!,
  multiplyDependencies: multiplyDependencies!,
  divideDependencies: divideDependencies!,
  powDependencies: powDependencies!,
  unaryMinusDependencies: unaryMinusDependencies!,
  unaryPlusDependencies: unaryPlusDependencies!,
})

export type FuncaoNumerica = (x: number) => number

export type ResultadoCompilar = { ok: true; fn: FuncaoNumerica } | { ok: false; erro: string }

const FUNCOES_PERMITIDAS = new Set(['sqrt', 'abs', 'exp', 'log', 'ln', 'log2', 'log10', 'sin', 'cos', 'tan'])
const SIMBOLOS_PERMITIDOS = new Set(['x', 'e', 'pi'])
const OPERADORES_PERMITIDOS = new Set(['unaryMinus', 'unaryPlus', 'add', 'subtract', 'multiply', 'divide', 'pow'])

/** log(x) é base 10; log(x, b) usa a base b; ln é natural. Fora do domínio vira NaN. */
const FUNCOES_ESCOPO = {
  sqrt: (v: number) => (v < 0 ? NaN : Math.sqrt(v)),
  abs: (v: number) => Math.abs(v),
  exp: (v: number) => Math.exp(v),
  ln: (v: number) => (v > 0 ? Math.log(v) : NaN),
  log2: (v: number) => (v > 0 ? Math.log2(v) : NaN),
  log10: (v: number) => (v > 0 ? Math.log10(v) : NaN),
  log: (v: number, base?: number) => {
    if (!(v > 0)) return NaN
    if (base === undefined) return Math.log10(v)
    if (!(base > 0) || base === 1) return NaN
    return Math.log(v) / Math.log(base)
  },
  sin: (v: number) => Math.sin(v),
  cos: (v: number) => Math.cos(v),
  tan: (v: number) => Math.tan(v),
}

const CONSTANTES = { e: Math.E, pi: Math.PI }

/** Vírgula decimal (0,5) vira ponto, mas a vírgula que separa argumentos (log(x, 2)) fica. */
function normalizar(entrada: string): string {
  const s = entrada
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
  const pilha: boolean[] = []
  let saida = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i] as string
    if (c === '(') {
      pilha.push(i > 0 && /[a-z]/.test(s[i - 1] as string)) // parêntese de chamada de função
      saida += c
    } else if (c === ')') {
      pilha.pop()
      saida += c
    } else if (c === ',') {
      const separador = pilha.length > 0 && pilha[pilha.length - 1]
      const entreDigitos = /\d/.test(s[i - 1] ?? '') && /\d/.test(s[i + 1] ?? '')
      saida += !separador && entreDigitos ? '.' : c
    } else saida += c
  }
  // x(x-1), e(x), pi(2): variável ou constante seguida de parêntese é multiplicação
  return saida.replace(/(?<![a-z])(x|e|pi)\s*\(/g, '$1*(').replace(/\)\s*\(/g, ')*(')
}

export function compilar(entrada: string): ResultadoCompilar {
  const texto = normalizar(entrada).trim()
  if (texto === '') return { ok: false, erro: 'Digite uma fórmula.' }
  let no
  try {
    no = parse(texto)
  } catch {
    return { ok: false, erro: 'Não consegui entender a fórmula. Confira parênteses e operadores.' }
  }

  let erro: string | null = null
  const nomesDeFuncao = new Set<unknown>()
  no.traverse((n) => {
    if (erro) return
    switch (n.type) {
      case 'ConstantNode':
      case 'ParenthesisNode':
        break
      case 'SymbolNode': {
        const nome = (n as unknown as { name: string }).name
        if (!nomesDeFuncao.has(n) && !SIMBOLOS_PERMITIDOS.has(nome)) erro = `Não conheço "${nome}". Use só x.`
        break
      }
      case 'FunctionNode': {
        const fn = (n as unknown as { fn: { type: string; name: string } }).fn
        if (fn.type !== 'SymbolNode' || !FUNCOES_PERMITIDAS.has(fn.name)) erro = `Função "${fn.name}" não é permitida.`
        else nomesDeFuncao.add(fn)
        break
      }
      case 'OperatorNode': {
        const op = (n as unknown as { fn: string }).fn
        if (!OPERADORES_PERMITIDOS.has(op)) erro = 'Operação não permitida.'
        break
      }
      default:
        erro = 'Expressão não permitida.'
    }
  })
  if (erro) return { ok: false, erro }

  let codigo
  try {
    codigo = no.compile()
  } catch {
    return { ok: false, erro: 'Não consegui entender a fórmula.' }
  }

  const fn: FuncaoNumerica = (x) => {
    try {
      const r: unknown = codigo.evaluate({ ...FUNCOES_ESCOPO, ...CONSTANTES, x })
      return typeof r === 'number' && Number.isFinite(r) ? r : NaN
    } catch {
      return NaN
    }
  }
  // avalia uma vez para pegar erros de aridade (ex.: sqrt(1, 2)) antes de aceitar
  try {
    codigo.evaluate({ ...FUNCOES_ESCOPO, ...CONSTANTES, x: 1 })
  } catch {
    return { ok: false, erro: 'Confira os argumentos das funções.' }
  }
  return { ok: true, fn }
}

export interface PontoErrado {
  x: number
  esperado: number
  obtido: number
}

export interface Equivalencia {
  ok: boolean
  erro?: string
  errados: PontoErrado[]
  fn?: FuncaoNumerica
}

/**
 * Compara a fórmula digitada com a função-alvo em ~20 pontos do domínio.
 * Pontos onde o alvo não existe (NaN) são ignorados; onde o alvo existe, a resposta também precisa existir.
 */
export function equivalentes(
  entrada: string,
  alvo: FuncaoNumerica,
  dominio: { min: number; max: number },
  pontos = 20,
): Equivalencia {
  const r = compilar(entrada)
  if (!r.ok) return { ok: false, erro: r.erro, errados: [] }
  const errados: PontoErrado[] = []
  for (let i = 0; i < pontos; i++) {
    const x = dominio.min + ((i + 0.37) / pontos) * (dominio.max - dominio.min)
    const esperado = alvo(x)
    if (!Number.isFinite(esperado)) continue
    const obtido = r.fn(x)
    if (!Number.isFinite(obtido) || Math.abs(obtido - esperado) > 1e-6 * Math.max(1, Math.abs(esperado))) {
      errados.push({ x, esperado, obtido })
    }
  }
  return { ok: errados.length === 0, errados, fn: r.fn }
}
