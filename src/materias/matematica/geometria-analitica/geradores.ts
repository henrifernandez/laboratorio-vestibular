import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import {
  eqGeralCirc,
  eqReduzidaCirc,
  fracaoTxt,
  pontoMedio,
  posicaoPontoCirc,
  posicaoRetaCirc,
  relacaoRetas,
  textoGeral,
  textoReduzida,
  type Geral,
  type Pt,
} from './calculo'

export const pt = (p: Pt) => `(${String(p.x).replace('.', ',')}, ${String(p.y).replace('.', ',')})`
const num = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',')

/* ------------------------------------------------------------------ circunferência */

export interface DadosCirculo {
  h: number
  k: number
  r: number
  /** mostrar a figura (leitura gráfica) */
  figura: boolean
}

export function gerarCircunferencia(rng: Rng, nivel: Nivel): InstanciaMulti<DadosCirculo> {
  const h = nivel === 1 ? sortear(rng, 0, 4) : sortear(rng, -5, 5)
  let k = nivel === 1 ? sortear(rng, 1, 4) : sortear(rng, -5, 5)
  if (nivel >= 2 && h === 0 && k === 0) k = 2
  const r = nivel === 1 ? sortear(rng, 1, 4) : sortear(rng, 2, 6)

  if (nivel < 3) {
    const certa = eqReduzidaCirc(h, k, r)
    const candidatos: { texto: string; frase: string; motivo: string }[] = [
      { texto: eqReduzidaCirc(-h, -k, r), frase: 'O centro está com os sinais trocados. Em (x − h)² + (y − k)² = r², o centro é (h, k): se o centro é (2, −1), aparece (x − 2)² + (y + 1)².', motivo: 'trocou o sinal das coordenadas do centro' },
      { texto: `${eqReduzidaCirc(h, k, r).split(' = ')[0]} = ${fracaoTxt(r)}`, frase: 'O lado direito é r², e não r. Com raio ' + r + ', o lado direito é ' + r * r + '.', motivo: 'usou r no lugar de r²' },
      { texto: eqReduzidaCirc(k, h, r), frase: 'As coordenadas do centro estão trocadas: o x do centro vai na parcela do x, e o y na parcela do y.', motivo: 'trocou x e y do centro' },
      { texto: eqReduzidaCirc(h, k, r + 1), frase: `O raio não confere com a figura: o raio é ${r}, então r² = ${r * r}.`, motivo: 'raio errado' },
      { texto: eqReduzidaCirc(h + 1, k, r), frase: 'O centro não confere com a figura: confira onde o centro está em x e em y.', motivo: 'centro deslocado' },
      { texto: eqReduzidaCirc(h, k - 1, r), frase: 'O centro não confere com a figura: confira onde o centro está em x e em y.', motivo: 'centro deslocado' },
    ].filter((c) => c.texto !== certa)
    const unicos = candidatos.filter((c, i) => candidatos.findIndex((d) => d.texto === c.texto) === i).slice(0, 3)
    const porque: Record<string, string> = { [certa]: `Isso! Centro (${h}, ${k}) e raio ${r}: (x − ${h})² + (y − ${k})² = ${r}² = ${r * r}, com os sinais ajustados.` }
    const motivo: Record<string, string> = {}
    for (const c of unicos) {
      porque[c.texto] = c.frase
      motivo[c.texto] = c.motivo
    }
    return {
      enunciado: 'Observe a circunferência desenhada. Qual é a sua equação?',
      opcoes: embaralhar(rng, [{ id: certa, rotulo: certa }, ...unicos.map((c) => ({ id: c.texto, rotulo: c.texto }))]),
      certa,
      porque,
      motivo,
      resolucao: `Centro lido na figura: (${h}, ${k}); raio: ${r}. Equação: ${certa}.`,
      dicas: ['Leia o centro (ponto no meio) e o raio (distância do centro à borda) na figura.', 'A equação reduzida é (x − h)² + (y − k)² = r².', `O centro é (${h}, ${k}) e o raio vale ${r}; cuide dos sinais.`],
      licao: 'equação reduzida: (x − h)² + (y − k)² = r², com centro (h, k) e raio r',
      dados: { h, k, r, figura: true },
    }
  }

  // nível 3: a partir da equação geral, descobrir centro e raio
  const geral = eqGeralCirc(h, k, r)
  const c = h * h + k * k - r * r
  const correta = `centro (${h}, ${k}) e raio ${r}`
  const maus: { texto: string; frase: string; motivo: string }[] = [
    { texto: `centro (${-h}, ${-k}) e raio ${r}`, frase: 'O centro tem os sinais trocados: o coeficiente de x é −2h, então h é a metade do coeficiente com o sinal contrário.', motivo: 'sinal errado no centro' },
    { texto: `centro (${h}, ${k}) e raio ${r * r}`, frase: `Você deu r² como raio. Depois de completar os quadrados, r² = ${r * r} e o raio é a raiz quadrada: ${r}.`, motivo: 'confundiu r com r²' },
    { texto: `centro (${h}, ${k}) e raio ${num(Math.sqrt(Math.abs(-c)))}`, frase: `Você usou só o termo independente (${c}) para o raio. É preciso somar h² + k²: r² = h² + k² − c = ${h * h + k * k} ${c < 0 ? '+' : '−'} ${Math.abs(c)} = ${r * r}.`, motivo: 'esqueceu de somar h² + k² no raio' },
    { texto: `centro (${2 * h}, ${2 * k}) e raio ${r}`, frase: 'Você usou o coeficiente inteiro (−2h) como se fosse h. O centro é a metade desse coeficiente, com sinal trocado.', motivo: 'esqueceu de dividir por 2' },
  ].filter((m) => m.texto !== correta)
  const unicos = maus.filter((m, i) => maus.findIndex((n) => n.texto === m.texto) === i).slice(0, 3)
  const porque: Record<string, string> = { [correta]: `Isso! Pelo coeficiente de x (−2h = ${-2 * h}) temos h = ${h}; pelo de y, k = ${k}. Então r² = h² + k² − c = ${h * h + k * k} − (${c}) = ${r * r}, e r = ${r}.` }
  const motivo: Record<string, string> = {}
  for (const m of unicos) {
    porque[m.texto] = m.frase
    motivo[m.texto] = m.motivo
  }
  return {
    enunciado: `Qual é o centro e o raio da circunferência de equação ${geral}?`,
    opcoes: embaralhar(rng, [{ id: correta, rotulo: correta }, ...unicos.map((m) => ({ id: m.texto, rotulo: m.texto }))]),
    certa: correta,
    porque,
    motivo,
    resolucao: `Compare com x² + y² − 2hx − 2ky + (h² + k² − r²) = 0. −2h = ${-2 * h} ⇒ h = ${h}. −2k = ${-2 * k} ⇒ k = ${k}. h² + k² − r² = ${c} ⇒ r² = ${h * h + k * k} − (${c}) = ${r * r} ⇒ r = ${r}.`,
    dicas: ['Compare a equação geral com x² + y² − 2hx − 2ky + (h² + k² − r²) = 0.', 'O coeficiente de x é −2h e o de y é −2k. Ache h e k.', `O termo independente é h² + k² − r² = ${c}. Isole r².`],
    licao: 'equação geral x² + y² + Dx + Ey + F = 0: h = −D/2, k = −E/2, r² = h² + k² − F',
    dados: { h, k, r, figura: false },
  }
}

/* ------------------------------------------------------------------ medidas */

export interface DadosMedidaGA {
  p?: Pt
  q?: Pt
  reta?: Geral
}

const TERNAS: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13]]

export function gerarMedida(rng: Rng, nivel: Nivel): InstanciaNum<DadosMedidaGA> {
  if (nivel === 1) {
    const [dx, dy, d] = escolher(rng, TERNAS)
    const p = { x: sortear(rng, -4, 2), y: sortear(rng, -4, 2) }
    const sx = rng() < 0.5 ? 1 : -1
    const sy = rng() < 0.5 ? 1 : -1
    const q = { x: p.x + sx * dx, y: p.y + sy * dy }
    return {
      enunciado: `Qual é a distância entre os pontos A${pt(p)} e B${pt(q)}?`,
      resposta: d,
      tolerancia: 0.001,
      erros: [
        { valor: dx * dx + dy * dy, frase: 'Você parou na soma dos quadrados. A distância é a raiz quadrada: d = √(Δx² + Δy²).', motivo: 'esqueceu a raiz quadrada' },
        { valor: dx + dy, frase: 'Você somou as diferenças de x e de y. A distância em diagonal vem do teorema de Pitágoras: raiz da soma dos quadrados.', motivo: 'somou Δx e Δy em vez de usar Pitágoras' },
      ],
      resolucao: `Δx = ${q.x - p.x}, Δy = ${q.y - p.y}. d = √(${dx}² + ${dy}²) = √${dx * dx + dy * dy} = ${d}.`,
      dicas: ['A distância entre dois pontos é a hipotenusa de um triângulo retângulo.', 'd = √[(x₂ − x₁)² + (y₂ − y₁)²].', `Aqui Δx = ${q.x - p.x} e Δy = ${q.y - p.y}.`],
      licao: 'distância entre pontos: d = √(Δx² + Δy²)',
      dados: { p, q },
    }
  }
  if (nivel === 2) {
    const p = { x: sortear(rng, -6, 6), y: sortear(rng, -6, 6) }
    const q = { x: sortear(rng, -6, 6), y: sortear(rng, -6, 6) }
    const m = pontoMedio(p, q)
    const pedeX = rng() < 0.5
    const eixo = pedeX ? 'x' : 'y'
    const v1 = pedeX ? p.x : p.y
    const v2 = pedeX ? q.x : q.y
    const resp = (v1 + v2) / 2
    return {
      enunciado: `Qual é a coordenada ${eixo} do ponto médio do segmento de extremos A${pt(p)} e B${pt(q)}?`,
      resposta: resp,
      tolerancia: 0.001,
      erros: [
        { valor: v1 + v2, frase: 'Você somou as coordenadas mas esqueceu de dividir por 2. O ponto médio é a média: (x₁ + x₂)/2.', motivo: 'esqueceu de dividir por 2' },
        { valor: (v2 - v1) / 2, frase: 'Você subtraiu as coordenadas. A coordenada do ponto médio é a média (soma ÷ 2), não a metade da diferença.', motivo: 'subtraiu em vez de somar' },
      ].filter((e) => Math.abs(e.valor - resp) > 0.001),
      resolucao: `${eixo}ₘ = (${v1} + ${v2})/2 = ${num(resp)}. O ponto médio é M${pt(m)}.`,
      dicas: ['O ponto médio fica a meio caminho: é a média das coordenadas.', `${eixo}ₘ = (${eixo}₁ + ${eixo}₂)/2.`, `Some ${v1} e ${v2} e divida por 2.`],
      licao: 'ponto médio: M = ((x₁ + x₂)/2, (y₁ + y₂)/2)',
      dados: { p, q },
    }
  }
  const [a, b, raiz] = escolher(rng, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13]] as [number, number, number][])
  const p = { x: sortear(rng, -4, 4), y: sortear(rng, -4, 4) }
  const dReal = sortear(rng, 1, 4)
  const sinal = rng() < 0.5 ? 1 : -1
  const c = sinal * dReal * raiz - a * p.x - b * p.y
  const geral = { a, b, c }
  const valor = a * p.x + b * p.y + c
  return {
    enunciado: `Qual é a distância do ponto P${pt(p)} à reta ${textoGeral(geral)}?`,
    resposta: dReal,
    tolerancia: 0.001,
    erros: [
      { valor: Math.abs(valor), frase: `Você calculou só |ax₀ + by₀ + c| = ${Math.abs(valor)}. Falta dividir por √(a² + b²) = √${a * a + b * b} = ${raiz}.`, motivo: 'esqueceu de dividir por √(a² + b²)' },
      { valor: Math.abs(valor) / (a * a + b * b), frase: `Você dividiu por a² + b² = ${a * a + b * b}, mas o denominador é a raiz: √${a * a + b * b} = ${raiz}.`, motivo: 'esqueceu a raiz do denominador' },
    ].filter((e) => Math.abs(e.valor - dReal) > 0.001),
    resolucao: `d = |${a}·${p.x} + ${b}·${p.y} + (${c})| / √(${a}² + ${b}²) = |${valor}| / ${raiz} = ${dReal}.`,
    dicas: ['A distância de um ponto a uma reta ax + by + c = 0 usa uma fórmula direta.', 'd = |a·x₀ + b·y₀ + c| / √(a² + b²).', `Substitua x₀ = ${p.x}, y₀ = ${p.y}; o denominador é √${a * a + b * b} = ${raiz}.`],
    licao: 'distância ponto-reta: d = |ax₀ + by₀ + c| / √(a² + b²)',
    dados: { p, reta: geral },
  }
}

/* ------------------------------------------------------------------ posição relativa */

export interface DadosPosicao {
  tipo: 'pontoCirc' | 'retaCirc' | 'retas'
  centro?: Pt
  r?: number
  p?: Pt
  reta?: Geral
  retaB?: Geral
}

export function gerarPosicao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosPosicao> {
  if (nivel === 1) {
    const centro = { x: sortear(rng, -3, 3), y: sortear(rng, -3, 3) }
    const [dx, dy, d] = escolher(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13]] as [number, number, number][])
    const alvo = escolher(rng, ['dentro', 'sobre', 'fora'] as const)
    const r = alvo === 'sobre' ? d : alvo === 'dentro' ? d + sortear(rng, 1, 3) : d - sortear(rng, 1, 2)
    const p = { x: centro.x + dx, y: centro.y + dy }
    const real = posicaoPontoCirc(p, centro, r)
    const d2 = dx * dx + dy * dy
    const txt = { dentro: 'dentro (interior)', sobre: 'sobre a circunferência', fora: 'fora (exterior)' }
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    for (const k of ['dentro', 'sobre', 'fora'] as const) {
      if (k === real) porque[k] = `Isso! A distância do centro ao ponto é √(${dx}² + ${dy}²) = ${d}; o raio é ${r}. ${d} ${d < r ? '<' : d === r ? '=' : '>'} ${r}: o ponto está ${txt[real]}.`
      else {
        porque[k] = `Não: a distância do centro ao ponto é ${d} (d² = ${d2}) e o raio é ${r} (r² = ${r * r}). ${d} ${d < r ? '<' : d === r ? '=' : '>'} ${r}, então está ${txt[real]}.`
        motivo[k] = 'comparou mal a distância com o raio'
      }
    }
    return {
      enunciado: `Considere a circunferência de centro C${pt(centro)} e raio ${r}. O ponto P${pt(p)} está dentro, sobre ou fora dela?`,
      opcoes: [{ id: 'dentro', rotulo: 'Dentro' }, { id: 'sobre', rotulo: 'Sobre a circunferência' }, { id: 'fora', rotulo: 'Fora' }],
      certa: real,
      porque,
      motivo,
      resolucao: `d(C, P) = √(${dx}² + ${dy}²) = ${d}. Como ${d} ${d < r ? '<' : d === r ? '=' : '>'} ${r}, o ponto está ${txt[real]}.`,
      dicas: ['Compare a distância do ponto ao centro com o raio.', 'Se d < r, dentro; se d = r, sobre; se d > r, fora.', `d = √[(${p.x - centro.x})² + (${p.y - centro.y})²].`],
      licao: 'ponto e circunferência: compare d(centro, ponto) com r',
      dados: { tipo: 'pontoCirc', centro, r, p },
    }
  }
  if (nivel === 2) {
    const [a, b, raiz] = escolher(rng, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [1, 0, 1], [0, 1, 1]] as [number, number, number][])
    const centro = { x: sortear(rng, -3, 3), y: sortear(rng, -3, 3) }
    const d = sortear(rng, 2, 5)
    const sinal = rng() < 0.5 ? 1 : -1
    const c = sinal * d * raiz - a * centro.x - b * centro.y
    const alvo = escolher(rng, ['secante', 'tangente', 'externa'] as const)
    const r = alvo === 'tangente' ? d : alvo === 'secante' ? d + sortear(rng, 1, 3) : d - 1
    const geral = { a, b, c }
    const real = posicaoRetaCirc(geral, centro, r)
    const nome = { secante: 'secante (corta em dois pontos)', tangente: 'tangente (toca em um ponto)', externa: 'externa (não toca)' }
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    for (const k of ['secante', 'tangente', 'externa'] as const) {
      if (k === real) porque[k] = `Isso! A distância do centro à reta é ${d}; o raio é ${r}. ${d} ${d < r ? '<' : d === r ? '=' : '>'} ${r}: a reta é ${nome[real]}.`
      else {
        porque[k] = `Não: a distância do centro à reta é |${a}·${centro.x} + ${b}·${centro.y} + (${c})|/${raiz} = ${d}, e o raio é ${r}. ${d} ${d < r ? '<' : d === r ? '=' : '>'} ${r}, logo a reta é ${nome[real]}.`
        motivo[k] = 'comparou mal a distância com o raio'
      }
    }
    return {
      enunciado: `A circunferência tem centro C${pt(centro)} e raio ${r}. Qual é a posição da reta ${textoGeral(geral)} em relação a ela?`,
      opcoes: [{ id: 'secante', rotulo: 'Secante' }, { id: 'tangente', rotulo: 'Tangente' }, { id: 'externa', rotulo: 'Externa' }],
      certa: real,
      porque,
      motivo,
      resolucao: `Distância do centro à reta: d = |${a}·${centro.x} + ${b}·${centro.y} + (${c})|/√(${a}² + ${b}²) = ${d}. Raio = ${r}. d ${d < r ? '<' : d === r ? '=' : '>'} r ⇒ ${nome[real]}.`,
      dicas: ['Calcule a distância do centro à reta.', 'd < r: secante; d = r: tangente; d > r: externa.', 'd = |a·h + b·k + c| / √(a² + b²).'],
      licao: 'reta e circunferência: compare d(centro, reta) com r',
      dados: { tipo: 'retaCirc', centro, r, reta: geral },
    }
  }
  const m1 = escolher(rng, [-3, -2, -1, 1, 2, 3, 0.5])
  const alvo = escolher(rng, ['paralelas', 'perpendiculares', 'concorrentes'] as const)
  let m2 = m1
  if (alvo === 'perpendiculares') m2 = -1 / m1
  else if (alvo === 'concorrentes') {
    const cand = [m1 + 1, -m1, m1 * 2, 4, -4, 0.5].filter((x) => relacaoRetas(m1, x) === 'concorrentes')
    m2 = escolher(rng, cand)
  }
  const n1 = sortear(rng, -4, 4)
  const n2 = alvo === 'paralelas' ? (n1 === 3 ? 4 : n1 + sortear(rng, 1, 3)) : sortear(rng, -4, 4)
  const real = relacaoRetas(m1, m2)
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  for (const k of ['paralelas', 'perpendiculares', 'concorrentes'] as const) {
    if (k === real) porque[k] = `Isso! Os coeficientes angulares são ${fracaoTxt(m1)} e ${fracaoTxt(m2)}: ${real === 'paralelas' ? 'iguais' : real === 'perpendiculares' ? `o produto é ${fracaoTxt(m1)} · (${fracaoTxt(m2)}) = −1` : 'diferentes e o produto não é −1'}.`
    else {
      porque[k] = `Não: m₁ = ${fracaoTxt(m1)} e m₂ = ${fracaoTxt(m2)}. ${real === 'paralelas' ? 'São iguais, então são paralelas.' : real === 'perpendiculares' ? 'O produto é −1, então são perpendiculares.' : 'São diferentes e o produto não é −1, então apenas se cruzam.'}`
      motivo[k] = 'comparou mal os coeficientes angulares'
    }
  }
  const r1 = textoReduzida(m1, n1)
  const r2 = textoReduzida(m2, n2)
  return {
    enunciado: `As retas r: ${r1} e s: ${r2} são...`,
    opcoes: [{ id: 'paralelas', rotulo: 'Paralelas' }, { id: 'perpendiculares', rotulo: 'Perpendiculares' }, { id: 'concorrentes', rotulo: 'Concorrentes, não perpendiculares' }],
    certa: real,
    porque,
    motivo,
    resolucao: `m₁ = ${fracaoTxt(m1)} e m₂ = ${fracaoTxt(m2)}. ${real === 'paralelas' ? 'Coeficientes iguais: paralelas.' : real === 'perpendiculares' ? `m₁·m₂ = ${fracaoTxt(m1)}·${fracaoTxt(m2)} = −1: perpendiculares.` : 'Diferentes e com produto diferente de −1: concorrentes não perpendiculares.'}`,
    dicas: ['Compare os coeficientes angulares (os números que multiplicam x).', 'Paralelas: m₁ = m₂. Perpendiculares: m₁·m₂ = −1.', `m₁ = ${fracaoTxt(m1)}, m₂ = ${fracaoTxt(m2)}.`],
    licao: 'retas paralelas: m₁ = m₂; perpendiculares: m₁·m₂ = −1',
    dados: { tipo: 'retas', reta: { a: -m1, b: 1, c: -n1 }, retaB: { a: -m2, b: 1, c: -n2 } },
  }
}

