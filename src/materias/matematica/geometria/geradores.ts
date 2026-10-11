import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { apotema, areaBases, areaLateral, areaTotal, geratriz, NOME_SOLIDO, volume, type Dimensoes, type Solido } from './calculo'
import { redesInvalidas, redesValidas, type Celula } from './redeCubo'
import type { DefeitoRede } from './redes'

const f2 = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const PI = 3.14

/* ------------------------------------------------------------------ planificação */

export type { DefeitoRede }

export interface OpcaoRede {
  /** planificação a desenhar (um sólido e suas dimensões, com o defeito aplicado) */
  solido: Solido
  dim: Dimensoes
  defeito: DefeitoRede
}

export interface DadosPlanificacao {
  modo: 'solidoPelaRede' | 'redeDoSolido' | 'cubo'
  /** modo solidoPelaRede: a rede mostrada no enunciado */
  rede?: OpcaoRede
  /** modo redeDoSolido: o sólido pedido */
  solido?: Solido
  dim?: Dimensoes
  /** opções (por id) */
  redes?: Record<string, OpcaoRede>
  /** modo cubo: figuras (células) de cada opção */
  figuras?: Record<string, Celula[]>
}

const DIM_PADRAO: Record<Exclude<Solido, 'esfera'>, () => Dimensoes> = {
  prisma: () => ({ a: 2, b: 3, h: 4 }),
  cilindro: () => ({ r: 2, h: 4 }),
  cone: () => ({ r: 3, h: 4 }),
  piramide: () => ({ a: 4, h: 3 }),
}

export function gerarPlanificacao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosPlanificacao> {
  if (nivel === 1) {
    const tipos: Exclude<Solido, 'esfera'>[] = ['prisma', 'cilindro', 'cone', 'piramide']
    const s = escolher(rng, tipos)
    const dim: Dimensoes = s === 'prisma' ? { a: sortear(rng, 2, 4), b: sortear(rng, 2, 4), h: sortear(rng, 2, 5) } : DIM_PADRAO[s]()
    const dica: Record<string, string> = {
      prisma: 'seis retângulos: duas bases iguais e quatro faces laterais retangulares',
      cilindro: 'um retângulo (a face lateral esticada) e dois círculos iguais (as bases)',
      cone: 'um setor circular (a face lateral) e um círculo (a base)',
      piramide: 'um quadrado (a base) e quatro triângulos (as faces laterais)',
    }
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    for (const t of tipos) {
      if (t === s) porque[t] = `Isso! A planificação tem ${dica[s]}.`
      else {
        porque[t] = `Não: ${NOME_SOLIDO[t].toLowerCase()} se planifica em ${dica[t]}. A figura mostrada tem ${dica[s]}.`
        motivo[t] = `confundiu ${s === 'prisma' ? 'prisma' : s} com ${t}`
      }
    }
    return {
      enunciado: 'Que sólido se obtém ao dobrar esta planificação?',
      opcoes: embaralhar(rng, tipos).map((t) => ({ id: t, rotulo: NOME_SOLIDO[t] })),
      certa: s,
      porque,
      motivo,
      resolucao: `A planificação tem ${dica[s]}: é ${NOME_SOLIDO[s].toLowerCase()}.`,
      dicas: ['Conte as peças e olhe o formato de cada uma.', 'Retângulos e quadrados: prismas e pirâmides. Círculos: cilindro e cone.', `Aqui: ${dica[s]}.`],
      licao: 'cilindro: 1 retângulo + 2 círculos; cone: 1 setor + 1 círculo; pirâmide: base + triângulos; prisma: retângulos',
      dados: { modo: 'solidoPelaRede', rede: { solido: s, dim, defeito: 'correta' } },
    }
  }
  if (nivel === 2) {
    const s = escolher(rng, ['cilindro', 'cone', 'piramide', 'prisma'] as const)
    const dim = DIM_PADRAO[s]()
    const defeitos: Record<typeof s, { defeito: DefeitoRede; frase: string; motivo: string }[]> = {
      cilindro: [
        { defeito: 'larguraErrada', frase: 'O comprimento do retângulo não é igual ao perímetro da base: ao enrolar, as bordas não se encontram. Deve valer 2πr.', motivo: 'retângulo com comprimento diferente de 2πr' },
        { defeito: 'faltaFace', frase: 'Faltou uma das bases: o cilindro tem duas bases circulares.', motivo: 'faltou uma base' },
        { defeito: 'faceExtra', frase: 'Há bases demais: o cilindro tem apenas duas bases circulares.', motivo: 'base a mais' },
      ],
      cone: [
        { defeito: 'setorErrado', frase: 'O arco do setor não mede o mesmo que o perímetro da base (2πr): o setor não fecha o cone certinho.', motivo: 'arco do setor diferente de 2πr' },
        { defeito: 'faltaFace', frase: 'Faltou a base circular do cone.', motivo: 'faltou a base' },
        { defeito: 'faceExtra', frase: 'Há bases demais: o cone tem apenas uma base circular.', motivo: 'base a mais' },
      ],
      piramide: [
        { defeito: 'faltaFace', frase: 'Faltou uma face lateral: uma pirâmide de base quadrada tem 4 triângulos laterais.', motivo: 'faltou uma face lateral' },
        { defeito: 'faceExtra', frase: 'Há faces a mais: uma pirâmide de base quadrada tem 4 triângulos laterais, um em cada lado da base.', motivo: 'face a mais' },
        { defeito: 'larguraErrada', frase: 'A base dos triângulos laterais não coincide com o lado do quadrado: as arestas não se encaixam ao dobrar.', motivo: 'arestas que não se encaixam' },
      ],
      prisma: [
        { defeito: 'faltaFace', frase: 'Faltou uma face: o prisma (paralelepípedo) tem 6 faces retangulares.', motivo: 'faltou uma face' },
        { defeito: 'larguraErrada', frase: 'As faces laterais não têm a mesma medida da aresta com que se encaixam, então não fecham o sólido.', motivo: 'arestas que não se encaixam' },
        { defeito: 'faceExtra', frase: 'Há faces a mais: o paralelepípedo tem 6 faces.', motivo: 'face a mais' },
      ],
    }
    const maus = defeitos[s]
    const ids = ['A', 'B', 'C', 'D']
    const lista = embaralhar(rng, [{ defeito: 'correta' as DefeitoRede, frase: '', motivo: '' }, ...maus])
    const redes: Record<string, OpcaoRede> = {}
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    let certa = 'A'
    lista.forEach((o, i) => {
      const id = ids[i] as string
      redes[id] = { solido: s, dim, defeito: o.defeito }
      if (o.defeito === 'correta') {
        certa = id
        porque[id] = `Isso! É a única planificação que fecha o ${NOME_SOLIDO[s].toLowerCase()} sem sobras nem faltas, com as medidas encaixando.`
      } else {
        porque[id] = o.frase
        motivo[id] = o.motivo
      }
    })
    return {
      enunciado: `Qual destas figuras é a planificação correta de ${s === 'cilindro' || s === 'prisma' ? 'um' : s === 'cone' ? 'um' : 'uma'} ${NOME_SOLIDO[s].toLowerCase()}?`,
      opcoes: ids.map((id) => ({ id, rotulo: `Figura ${id}` })),
      certa,
      porque,
      motivo,
      resolucao: `Só uma figura tem todas as peças certas e com medidas que se encaixam ao dobrar.`,
      dicas: ['Conte as peças necessárias para o sólido.', 'Confira se as medidas que vão se encontrar ao dobrar são iguais (arestas, comprimento do retângulo = perímetro da base, arco do setor = perímetro da base).', 'Descarte as figuras com peças faltando ou sobrando.'],
      licao: 'planificação correta: peças certas e arestas que se encaixam (retângulo do cilindro = 2πr; arco do setor do cone = 2πr)',
      dados: { modo: 'redeDoSolido', solido: s, dim, redes },
    }
  }
  const validas = redesValidas()
  const invalidas = embaralhar(rng, redesInvalidas()).slice(0, 3)
  const certaFig = escolher(rng, validas)
  const ids = ['A', 'B', 'C', 'D']
  const mistura = embaralhar(rng, [{ fig: certaFig, ok: true }, ...invalidas.map((fig) => ({ fig, ok: false }))])
  const figuras: Record<string, Celula[]> = {}
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  mistura.forEach((m, i) => {
    const id = ids[i] as string
    figuras[id] = m.fig
    if (m.ok) {
      certa = id
      porque[id] = 'Isso! Ao dobrar, cada um dos 6 quadrados cobre uma face diferente do cubo: não há sobreposição nem face descoberta.'
    } else {
      porque[id] = 'Ao dobrar essa figura, dois quadrados caem sobre a mesma face do cubo (sobrepõem) e alguma face fica sem cobertura. Imagine rolar um cubo sobre os quadrados: ele passaria pela mesma face duas vezes.'
      motivo[id] = 'faces se sobrepõem ao dobrar'
    }
  })
  return {
    enunciado: 'Qual destas figuras de 6 quadrados se dobra formando um cubo?',
    opcoes: ids.map((id) => ({ id, rotulo: `Figura ${id}` })),
    certa,
    porque,
    motivo,
    resolucao: 'Rolando um cubo sobre a figura, cada quadrado deve receber uma face diferente. Só a figura certa passa nesse teste: nas outras, duas faces se repetem.',
    dicas: ['Escolha um quadrado como base e imagine dobrar os vizinhos para cima.', 'Quatro quadrados em linha formam o "cinturão" do cubo: os outros dois devem ficar um de cada lado, e não os dois do mesmo lado.', 'Se dois quadrados forem cair sobre a mesma face, a figura não serve.'],
    licao: 'planificação do cubo: nenhuma face pode se repetir ao dobrar (existem só 11 formas diferentes)',
    dados: { modo: 'cubo', figuras },
  }
}

/* ------------------------------------------------------------------ estimar o volume */

export interface DadosVolume {
  solido: Solido
  dim: Dimensoes
  volume: number
}

export function gerarVolume(rng: Rng, nivel: Nivel): InstanciaNum<DadosVolume> {
  let s: Solido
  let dim: Dimensoes
  if (nivel === 1) {
    s = escolher(rng, ['prisma', 'cilindro'] as const)
    dim = s === 'prisma' ? { a: sortear(rng, 3, 8), b: sortear(rng, 3, 8), h: sortear(rng, 4, 10) } : { r: sortear(rng, 2, 5), h: sortear(rng, 4, 10) }
  } else if (nivel === 2) {
    s = escolher(rng, ['cone', 'piramide'] as const)
    dim = s === 'cone' ? { r: sortear(rng, 2, 6), h: sortear(rng, 5, 12) } : { a: sortear(rng, 4, 10), h: sortear(rng, 5, 12) }
  } else {
    s = 'esfera'
    dim = { r: sortear(rng, 2, 7) }
  }
  const V = volume(s, dim)
  const rotuloDim = s === 'prisma' ? `${dim.a} × ${dim.b} × ${dim.h} cm` : s === 'piramide' ? `base quadrada de lado ${dim.a} cm e altura ${dim.h} cm` : s === 'esfera' ? `raio ${dim.r} cm` : `raio ${dim.r} cm e altura ${dim.h} cm`
  const erros: { valor: number; frase: string; motivo: string }[] = []
  if (s === 'cone' || s === 'piramide') erros.push({ valor: 3 * V, frase: `Você usou o volume do ${s === 'cone' ? 'cilindro' : 'prisma'} com a mesma base e altura. O ${NOME_SOLIDO[s].toLowerCase()} ocupa só 1/3 desse volume.`, motivo: 'esqueceu o fator 1/3' })
  if (s === 'cilindro' || s === 'cone') erros.push({ valor: V * 4, frase: 'Parece que você usou o diâmetro no lugar do raio: como o raio é elevado ao quadrado, o volume sai 4 vezes maior.', motivo: 'usou o diâmetro como raio' })
  if (s === 'esfera') {
    erros.push({ valor: V * 8, frase: 'Parece que você usou o diâmetro no lugar do raio: como o raio é elevado ao cubo, o volume sai 8 vezes maior.', motivo: 'usou o diâmetro como raio' })
    erros.push({ valor: 3 * V, frase: 'Faltou o fator 1/3: o volume da esfera é (4/3)πr³, e não 4πr³.', motivo: 'esqueceu o fator 1/3' })
  }
  if (s === 'prisma') erros.push({ valor: (dim.a as number) + (dim.b as number) + (dim.h as number), frase: 'Você somou as três medidas. O volume do paralelepípedo é o produto: quantos cubinhos cabem em comprimento × largura × altura.', motivo: 'somou em vez de multiplicar' })
  if (s === 'cilindro') erros.push({ valor: Math.PI * (dim.r as number) ** 2, frase: 'Você calculou só a área da base. O volume é a área da base vezes a altura.', motivo: 'esqueceu a altura' })
  const exatoTxt = f2(V)
  const comparacao =
    s === 'prisma'
      ? 'Multiplique as três medidas.'
      : s === 'cilindro'
        ? 'Área da base (π·r², com π ≈ 3) vezes a altura.'
        : s === 'cone'
          ? 'Um cone cabe 3 vezes num cilindro de mesma base e altura.'
          : s === 'piramide'
            ? 'Uma pirâmide cabe 3 vezes num prisma de mesma base e altura.'
            : 'A esfera ocupa 2/3 do cilindro que a envolve (altura = diâmetro).'
  return {
    enunciado: `Estime o volume (em cm³) ${s === 'esfera' ? 'da esfera' : s === 'prisma' ? 'do paralelepípedo' : s === 'piramide' ? 'da pirâmide' : s === 'cone' ? 'do cone' : 'do cilindro'} de ${rotuloDim}. Aceitamos um erro de até 10%.`,
    resposta: V,
    tolerancia: V * 0.1,
    unidade: 'cm³',
    erros,
    resolucao: `${s === 'prisma' ? `V = a·b·h = ${dim.a}·${dim.b}·${dim.h}` : s === 'cilindro' ? `V = π·r²·h = π·${dim.r}²·${dim.h}` : s === 'cone' ? `V = (1/3)·π·r²·h = (1/3)·π·${dim.r}²·${dim.h}` : s === 'piramide' ? `V = (1/3)·a²·h = (1/3)·${dim.a}²·${dim.h}` : `V = (4/3)·π·r³ = (4/3)·π·${dim.r}³`} ≈ ${exatoTxt} cm³. Como 1 cm³ equivale a 1 mL, o sólido cheio de água leva cerca de ${f2(V)} mL.`,
    dicas: ['Imagine o sólido cheio de água: quantos "cubinhos" de 1 cm caberiam?', comparacao, `Substitua as medidas (use π ≈ 3,14). Valor exato: confira depois de tentar.`],
    licao: 'prisma: a·b·h; cilindro: πr²h; cone e pirâmide: 1/3 do cilindro/prisma; esfera: 4πr³/3',
    dados: { solido: s, dim, volume: V },
  }
}

/* ------------------------------------------------------------------ área da superfície */

export interface DadosArea {
  solido: Solido
  dim: Dimensoes
  pede: 'total' | 'lateral'
}

export function gerarArea(rng: Rng, nivel: Nivel): InstanciaNum<DadosArea> {
  let s: Solido
  let dim: Dimensoes
  let pede: 'total' | 'lateral' = 'total'
  if (nivel === 1) {
    s = 'prisma'
    dim = { a: sortear(rng, 2, 6), b: sortear(rng, 2, 6), h: sortear(rng, 2, 7) }
  } else if (nivel === 2) {
    s = 'cilindro'
    dim = { r: sortear(rng, 2, 6), h: sortear(rng, 3, 10) }
    pede = rng() < 0.5 ? 'total' : 'lateral'
  } else if (rng() < 0.5) {
    s = 'cone'
    const [r, h] = escolher(rng, [[3, 4], [6, 8], [5, 12]] as [number, number][])
    dim = { r, h }
    pede = rng() < 0.5 ? 'total' : 'lateral'
  } else {
    s = 'piramide'
    const [a, h] = escolher(rng, [[6, 4], [10, 12], [8, 3]] as [number, number][])
    dim = { a, h }
    pede = rng() < 0.5 ? 'total' : 'lateral'
  }
  const A = pede === 'total' ? areaTotal(s, dim) : areaLateral(s, dim)
  const usaPi = s === 'cilindro' || s === 'cone'
  const Aaprox = usaPi ? (() => {
    // mesma conta com π = 3,14
    const k = PI / Math.PI
    return A * k
  })() : A
  const desc = s === 'prisma' ? `${dim.a} cm × ${dim.b} cm × ${dim.h} cm` : s === 'cilindro' ? `raio ${dim.r} cm e altura ${dim.h} cm` : s === 'cone' ? `raio ${dim.r} cm e altura ${dim.h} cm` : `base quadrada de lado ${dim.a} cm e altura ${dim.h} cm`
  const erros: { valor: number; frase: string; motivo: string }[] = []
  const k = usaPi ? PI / Math.PI : 1
  if (pede === 'total' && s !== 'prisma') erros.push({ valor: areaLateral(s, dim) * k, frase: 'Você calculou só a área lateral. A área total inclui também a(s) base(s).', motivo: 'esqueceu as bases' })
  if (pede === 'lateral' && s !== 'prisma') erros.push({ valor: areaTotal(s, dim) * k, frase: 'Você calculou a área total. O enunciado pede só a área lateral (sem as bases).', motivo: 'incluiu as bases' })
  if (s === 'cone') erros.push({ valor: (pede === 'lateral' ? PI * (dim.r as number) * (dim.h as number) : PI * (dim.r as number) * (dim.h as number) + PI * (dim.r as number) ** 2), frase: `Você usou a altura (${dim.h}) no lugar da geratriz (${geratriz(dim.r as number, dim.h as number)}) na área lateral πrg. A geratriz é a hipotenusa: g = √(r² + h²).`, motivo: 'usou a altura no lugar da geratriz' })
  if (s === 'piramide') erros.push({ valor: pede === 'lateral' ? 2 * (dim.a as number) * (dim.h as number) : 2 * (dim.a as number) * (dim.h as number) + (dim.a as number) ** 2, frase: `Você usou a altura da pirâmide (${dim.h}) no lugar do apótema (${apotema(dim.a as number, dim.h as number)}). Cada face lateral tem altura igual ao apótema: ap = √(h² + (a/2)²).`, motivo: 'usou a altura no lugar do apótema' })
  if (s === 'cilindro') {
    const r = dim.r as number
    const h = dim.h as number
    if (pede === 'lateral') erros.push({ valor: PI * r * h, frase: 'Você esqueceu o fator 2: a lateral do cilindro é um retângulo de lados 2πr (o perímetro da base) e h.', motivo: 'esqueceu o 2 em 2πr' })
    else erros.push({ valor: 2 * PI * r * h + PI * r * r, frase: 'Você contou só uma base. O cilindro tem duas bases circulares (topo e fundo).', motivo: 'contou uma base só' })
  }
  if (s === 'prisma') erros.push({ valor: (dim.a as number) * (dim.b as number) + (dim.a as number) * (dim.h as number) + (dim.b as number) * (dim.h as number), frase: 'Você contou cada tipo de face uma vez. No paralelepípedo as faces vêm em 3 pares iguais: multiplique a soma por 2.', motivo: 'esqueceu que as faces vêm em pares' })
  const unicos = erros.filter((e, i) => erros.findIndex((x) => Math.abs(x.valor - e.valor) < 0.01) === i && Math.abs(e.valor - Aaprox) > 0.02 * Aaprox + 0.05)
  const pedeTxt = pede === 'total' ? 'área total' : 'área lateral'
  return {
    enunciado: `Qual é a ${pedeTxt} ${s === 'prisma' ? 'do paralelepípedo' : s === 'cilindro' ? 'do cilindro' : s === 'cone' ? 'do cone' : 'da pirâmide'} de ${desc}?${usaPi ? ' Use π ≈ 3,14.' : ''}`,
    resposta: Math.round(Aaprox * 100) / 100,
    tolerancia: Math.max(0.02, Aaprox * 0.005),
    unidade: 'cm²',
    erros: unicos,
    resolucao:
      s === 'prisma'
        ? `A = 2(ab + ah + bh) = 2(${dim.a}·${dim.b} + ${dim.a}·${dim.h} + ${dim.b}·${dim.h}) = ${A} cm².`
        : s === 'cilindro'
          ? `Lateral = 2πrh = ${f2(areaLateral(s, dim) * k)}; bases = 2πr² = ${f2(areaBases(s, dim) * k)}. ${pede === 'total' ? `Total = ${f2(Aaprox)} cm².` : `Área lateral = ${f2(Aaprox)} cm².`}`
          : s === 'cone'
            ? `g = √(${dim.r}² + ${dim.h}²) = ${geratriz(dim.r as number, dim.h as number)}. Lateral = πrg = ${f2(areaLateral(s, dim) * k)}; base = πr² = ${f2(areaBases(s, dim) * k)}. ${pede === 'total' ? `Total = ${f2(Aaprox)} cm².` : `Área lateral = ${f2(Aaprox)} cm².`}`
            : `ap = √(${dim.h}² + (${dim.a}/2)²) = ${apotema(dim.a as number, dim.h as number)}. Cada face: a·ap/2 = ${f2(((dim.a as number) * apotema(dim.a as number, dim.h as number)) / 2)}; lateral = 4 faces = ${f2(areaLateral(s, dim))}; base = ${(dim.a as number) ** 2}. ${pede === 'total' ? `Total = ${f2(A)} cm².` : `Área lateral = ${f2(A)} cm².`}`,
    dicas: [
      'Planifique mentalmente: a área é a soma das áreas das peças da planificação.',
      s === 'cone' ? 'A face lateral usa a geratriz g = √(r² + h²), não a altura.' : s === 'piramide' ? 'Cada face lateral é um triângulo cuja altura é o apótema, não a altura da pirâmide.' : s === 'cilindro' ? 'Lateral: retângulo de lados 2πr e h. Bases: dois círculos.' : 'São 3 pares de faces iguais.',
      pede === 'lateral' ? 'Não some as bases.' : 'Some a área lateral com a(s) base(s).',
    ],
    licao: 'área total = área lateral + bases; cone usa a geratriz; pirâmide usa o apótema',
    dados: { solido: s, dim, pede },
  }
}

/* ------------------------------------------------------------------ Pitágoras e semelhança */

export interface DadosTriangulo {
  modo: 'pitagoras' | 'semelhanca' | 'sombra'
  /** pitágoras: catetos e hipotenusa, com `incognita` indicando qual é x */
  lados?: { a: number; b: number; c: number }
  incognita?: 'a' | 'b' | 'c'
  /** semelhança: razão e lados do triângulo menor/maior */
  menor?: [number, number, number]
  maior?: [number, number, number]
  /** sombra */
  vara?: number
  sombraVara?: number
  sombraArvore?: number
}

const TERNAS: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]]

function gerarTrianguloBruto(rng: Rng, nivel: Nivel): InstanciaNum<DadosTriangulo> {
  if (nivel === 1) {
    const [a, b, c] = escolher(rng, TERNAS)
    const inc = escolher(rng, ['c', 'a', 'b'] as const)
    const val = { a, b, c }[inc]
    const dados = { a, b, c }
    const outroCateto = inc === 'a' ? b : a
    return {
      enunciado: `No triângulo retângulo da figura, os catetos são a e b e a hipotenusa é c. Qual é o valor de ${inc === 'c' ? 'x (a hipotenusa)' : `x (um cateto)`}?`,
      resposta: val,
      tolerancia: 0.001,
      erros:
        inc === 'c'
          ? [{ valor: a + b, frase: 'Você somou os catetos. A hipotenusa vem de c² = a² + b² (raiz da soma dos quadrados), e é menor que a soma dos catetos.', motivo: 'somou os catetos' }, { valor: a * a + b * b, frase: 'Você parou na soma dos quadrados. Falta a raiz quadrada: c = √(a² + b²).', motivo: 'esqueceu a raiz quadrada' }]
          : [
              { valor: c - outroCateto, frase: 'Você subtraiu os lados em vez de usar Pitágoras. Para um cateto: x² = c² − (outro cateto)², e depois a raiz.', motivo: 'subtraiu os lados' },
              { valor: c * c - outroCateto * outroCateto, frase: 'Você parou antes da raiz quadrada: x² = c² − (outro cateto)², e x é a raiz desse valor.', motivo: 'esqueceu a raiz quadrada' },
            ],
      resolucao: inc === 'c' ? `c² = ${a}² + ${b}² = ${a * a + b * b}, então c = ${c}.` : `x² = ${c}² − ${inc === 'a' ? b : a}² = ${c * c - (inc === 'a' ? b * b : a * a)}, então x = ${val}.`,
      dicas: ['Num triângulo retângulo vale o teorema de Pitágoras: hipotenusa² = cateto² + cateto².', 'A hipotenusa é o lado oposto ao ângulo reto (o maior).', inc === 'c' ? `c² = ${a}² + ${b}².` : `x² = ${c}² − ${inc === 'a' ? b : a}².`],
      licao: 'Pitágoras: a² + b² = c² (c é a hipotenusa)',
      dados: { modo: 'pitagoras', lados: dados, incognita: inc },
    }
  }
  if (nivel === 2) {
    const [a, b, c] = escolher(rng, [[3, 4, 5], [4, 6, 8], [5, 7, 9], [6, 8, 10], [4, 5, 7]] as [number, number, number][])
    const k = escolher(rng, [2, 3, 4, 5])
    const quem = escolher(rng, [0, 1, 2])
    const menor: [number, number, number] = [a, b, c]
    const maior: [number, number, number] = [a * k, b * k, c * k]
    const x = maior[quem] as number
    const outro = (quem + 1) % 3
    return {
      enunciado: `Os triângulos da figura são semelhantes. Os lados correspondentes estão na mesma posição. Qual é o valor de x?`,
      resposta: x,
      tolerancia: 0.001,
      erros: [
        { valor: (menor[quem] as number) * (menor[outro] as number) / (maior[outro] as number), frase: 'Você montou a proporção invertida. Os lados correspondentes têm a mesma razão: lado do maior ÷ lado do menor.', motivo: 'proporção invertida' },
        { valor: (menor[quem] as number) + ((maior[outro] as number) - (menor[outro] as number)), frase: 'Você somou a diferença entre os lados conhecidos. Em triângulos semelhantes os lados são proporcionais (multiplicados pela mesma razão), não somados.', motivo: 'somou em vez de usar a razão' },
      ],
      resolucao: `Razão de semelhança: ${maior[outro]}/${menor[outro]} = ${k}. Então x = ${menor[quem]} · ${k} = ${x}.`,
      dicas: ['Em triângulos semelhantes, os lados correspondentes são proporcionais.', 'Descubra a razão com os lados que você conhece nos dois triângulos.', `A razão (maior ÷ menor) é ${k}: multiplique o lado correspondente do menor.`],
      licao: 'triângulos semelhantes: lados correspondentes proporcionais (mesma razão k)',
      dados: { modo: 'semelhanca', menor, maior, incognita: ['a', 'b', 'c'][quem] as 'a' },
    }
  }
  if (rng() < 0.6) {
    const vara = escolher(rng, [1, 2, 1.5])
    const sombraVara = escolher(rng, [2, 3, 4])
    const k = escolher(rng, [4, 5, 6, 8])
    const sombraArvore = sombraVara * k
    const alt = vara * k
    return {
      enunciado: `Em certo horário, uma vara vertical de ${f2(vara)} m projeta uma sombra de ${f2(sombraVara)} m. No mesmo horário, uma árvore projeta uma sombra de ${f2(sombraArvore)} m. Qual é a altura da árvore, em metros?`,
      resposta: alt,
      tolerancia: 0.01,
      unidade: 'm',
      erros: [
        { valor: vara + (sombraArvore - sombraVara), frase: 'Você somou a diferença das sombras à altura da vara. Os triângulos formados (objeto, sombra, raio de sol) são semelhantes, então vale a proporção: altura ÷ sombra é igual para os dois.', motivo: 'somou em vez de usar a proporção' },
        { valor: (sombraVara * sombraArvore) / vara, frase: 'Você inverteu a proporção. É altura/sombra = altura/sombra: vara/sombraVara = árvore/sombraÁrvore.', motivo: 'proporção invertida' },
      ],
      resolucao: `Os raios de sol são paralelos, então os triângulos são semelhantes: ${f2(vara)}/${f2(sombraVara)} = x/${f2(sombraArvore)}. Logo x = ${f2(vara)}·${f2(sombraArvore)}/${f2(sombraVara)} = ${f2(alt)} m.`,
      dicas: ['No mesmo horário, os raios de sol têm a mesma inclinação: os triângulos objeto–sombra são semelhantes.', 'Monte a proporção: altura da vara ÷ sombra da vara = altura da árvore ÷ sombra da árvore.', `${f2(vara)}/${f2(sombraVara)} = x/${f2(sombraArvore)}.`],
      licao: 'sombras no mesmo horário: altura/sombra é constante (triângulos semelhantes)',
      dados: { modo: 'sombra', vara, sombraVara, sombraArvore },
    }
  }
  const [a, b, c] = escolher(rng, [[3, 4, 5], [6, 8, 10]] as [number, number, number][])
  const k = escolher(rng, [2, 3])
  const area = (a * b) / 2
  return {
    enunciado: `Um triângulo retângulo tem catetos ${a} cm e ${b} cm. Um triângulo semelhante a ele tem razão de semelhança ${k} (cada lado é ${k} vezes maior). Qual é a área do triângulo maior, em cm²?`,
    resposta: area * k * k,
    tolerancia: 0.01,
    unidade: 'cm²',
    erros: [
      { valor: area * k, frase: `Você multiplicou a área por ${k}. Ao multiplicar os lados por ${k}, a área fica multiplicada por ${k}² = ${k * k}, porque a base e a altura crescem ${k} vezes cada.`, motivo: 'multiplicou a área pela razão, e não pelo quadrado' },
      { valor: a * k * b * k, frase: 'Você usou o produto dos catetos sem dividir por 2. A área do triângulo é base × altura ÷ 2.', motivo: 'esqueceu de dividir por 2' },
    ],
    resolucao: `Área do menor: ${a}·${b}/2 = ${area} cm². Razão de áreas = ${k}² = ${k * k}. Área do maior = ${area}·${k * k} = ${area * k * k} cm². (Conferindo: catetos ${a * k} e ${b * k}, área ${(a * k * b * k) / 2}.)`,
    dicas: ['Se os lados são multiplicados por k, a área é multiplicada por k².', 'Calcule a área do triângulo menor: cateto × cateto ÷ 2.', `Multiplique por ${k}² = ${k * k}.`],
    licao: 'razão de semelhança k: razão de áreas k²; razão de volumes k³',
    dados: { modo: 'semelhanca', menor: [a, b, c], maior: [a * k, b * k, c * k] },
  }
}

/** Erros típicos que coincidem com a resposta certa (casos de borda) são descartados. */
export function gerarTriangulo(rng: Rng, nivel: Nivel): InstanciaNum<DadosTriangulo> {
  const inst = gerarTrianguloBruto(rng, nivel)
  return { ...inst, erros: inst.erros.filter((e) => Math.abs(e.valor - inst.resposta) > inst.tolerancia) }
}
