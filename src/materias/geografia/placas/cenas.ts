/**
 * Geometria dos cortes geológicos dos limites de placas (unidades do desenho, fora de escala).
 * Tudo aqui é calculado: o desenho (Visuais.tsx) só pinta. Assim os testes conferem posições sem renderizar.
 */

export const LARGURA = 640
export const ALTURA = 300
export const NIVEL_MAR = 100

/** topo da crosta oceânica longe de tudo (planície abissal) e da continental */
const Y_OC = 126
const Y_CONT = 86
/** espessuras (exageradas na vertical): crosta oceânica, continental e litosfera inteira */
const ESP_CROSTA_OC = 12
const ESP_LITO_OC = 42
const ESP_CROSTA_CONT = 50
const BASE_LITO_CONT = 176

export type Ponto = [number, number]
export type CorForma = 'oceanica' | 'continental' | 'nova' | 'magma' | 'agua' | 'lito' | 'sedimento'

export interface Forma {
  id: string
  cor: CorForma
  pontos: Ponto[]
}
export interface Seta {
  de: Ponto
  para: Ponto
}
export interface Rotulo {
  texto: string
  x: number
  y: number
  ancora?: 'start' | 'middle' | 'end'
  /** ponto indicado por uma linha fina (o rótulo fica numa área livre) */
  alvo?: Ponto
  /** 1: essencial (sempre aparece); 2: some em telas estreitas, onde a legenda e o texto explicam */
  prioridade?: 1 | 2
}
export interface Vulcao {
  /** x da base esquerda, largura, y da base e altura */
  x: number
  w: number
  base: number
  h: number
}
export interface Camara {
  x: number
  y: number
  rx: number
  ry: number
}
export interface Linha {
  pontos: Ponto[]
  tipo: 'dobra' | 'falha' | 'sutura'
}
export interface Cena {
  modo: 'corte' | 'planta'
  /** desenhadas na ordem: litosfera, crostas, magma, sedimentos; a água vai por cima, translúcida */
  formas: Forma[]
  setas: Seta[]
  rotulos: Rotulo[]
  /** na vista de cima, quanto os dois lados já se deslocaram (unidades do desenho) */
  deslocamento: number
  /** hipocentros de terremotos */
  sismos: Ponto[]
  vulcoes: Vulcao[]
  camaras: Camara[]
  /** caminhos do magma até a superfície */
  condutos: Ponto[][]
  /** gotas de magma subindo da zona de fusão */
  gotas: Ponto[]
  linhas: Linha[]
  /** correntes no manto (setas finas e curvas) */
  fluxo: Ponto[][]
  /** faixa de terremotos ao longo da placa que afunda (zona de Wadati-Benioff) */
  zonaSismica: Ponto[] | null
}

/* ------------------------------------------------------------------ utilidades geométricas */

const suave = (t: number) => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}
const sino = (x: number, centro: number, largura: number) => Math.exp(-(((x - centro) / largura) ** 2))
const r1 = (n: number) => Math.round(n * 10) / 10

function amostrar(f: (x: number) => number, x0: number, x1: number, n = 48): Ponto[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n
    return [r1(x), r1(f(x))] as Ponto
  })
}

/** Desloca uma linha (que anda para a direita e para baixo) `d` unidades para "baixo" dela, pela normal. */
function deslocar(linha: Ponto[], d: number): Ponto[] {
  return linha.map((p, i) => {
    const a = linha[Math.max(0, i - 1)] as Ponto
    const b = linha[Math.min(linha.length - 1, i + 1)] as Ponto
    const tx = b[0] - a[0]
    const ty = b[1] - a[1]
    const n = Math.hypot(tx, ty) || 1
    return [r1(p[0] - (ty / n) * d), r1(p[1] + (tx / n) * d)] as Ponto
  })
}

/** Corta um polígono na horizontal y = limite (fica a parte de cima). Sutherland–Hodgman com uma aresta. */
function cortarAbaixo(poly: Ponto[], limite = ALTURA): Ponto[] {
  const saida: Ponto[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i] as Ponto
    const b = poly[(i + 1) % poly.length] as Ponto
    const aDentro = a[1] <= limite
    const bDentro = b[1] <= limite
    if (aDentro) saida.push(a)
    if (aDentro !== bDentro) {
      const t = (limite - a[1]) / (b[1] - a[1])
      saida.push([r1(a[0] + (b[0] - a[0]) * t), limite])
    }
  }
  return saida
}

/** y de uma linha (x crescente) num dado x, por interpolação; fora do alcance devolve null. */
function yEm(linha: Ponto[], x: number): number | null {
  for (let i = 0; i < linha.length - 1; i++) {
    const [x0, y0] = linha[i] as Ponto
    const [x1, y1] = linha[i + 1] as Ponto
    if (x >= x0 && x <= x1) return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return null
}

/** Primeiro x em que a linha passa da profundidade y. */
function xNaProfundidade(linha: Ponto[], y: number): number | null {
  for (let i = 0; i < linha.length - 1; i++) {
    const [x0, y0] = linha[i] as Ponto
    const [x1, y1] = linha[i + 1] as Ponto
    if (y0 <= y && y1 >= y) return y1 === y0 ? x0 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0)
  }
  return null
}

/** Água entre o nível do mar e o fundo (uma linha com x crescente), só onde o fundo está abaixo do nível. */
function agua(id: string, fundo: Ponto[]): Forma | null {
  const trechos: Ponto[][] = []
  let atual: Ponto[] = []
  for (let i = 0; i < fundo.length; i++) {
    const p = fundo[i] as Ponto
    const ant = fundo[i - 1]
    if (ant && ant[1] > NIVEL_MAR !== p[1] > NIVEL_MAR) {
      const t = (NIVEL_MAR - ant[1]) / (p[1] - ant[1])
      atual.push([r1(ant[0] + (p[0] - ant[0]) * t), NIVEL_MAR])
      if (p[1] <= NIVEL_MAR) {
        trechos.push(atual)
        atual = []
      }
    }
    if (p[1] > NIVEL_MAR) atual.push(p)
  }
  if (atual.length) trechos.push(atual)
  const maior = trechos.sort((a, b) => b.length - a.length)[0]
  if (!maior || maior.length < 2) return null
  const x0 = (maior[0] as Ponto)[0]
  const x1 = (maior[maior.length - 1] as Ponto)[0]
  return { id, cor: 'agua', pontos: [[x0, NIVEL_MAR], [x1, NIVEL_MAR], ...[...maior].reverse()] }
}

const vazia = (): Omit<Cena, 'formas' | 'setas' | 'rotulos'> => ({
  modo: 'corte',
  deslocamento: 0,
  sismos: [],
  vulcoes: [],
  camaras: [],
  condutos: [],
  gotas: [],
  linhas: [],
  fluxo: [],
  zonaSismica: null,
})

/** Gotas de magma num caminho de `de` até `ate`, com um leve zigue-zague. */
function gotasEntre(de: Ponto, ate: Ponto, n: number): Ponto[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n
    const x = de[0] + (ate[0] - de[0]) * t + (i % 2 === 0 ? -5 : 5)
    const y = de[1] + (ate[1] - de[1]) * t
    return [r1(x), r1(y)] as Ponto
  })
}

/* ------------------------------------------------------------------ dorsal */

function cenaDorsal(p: number): Cena {
  const g = 10 + 78 * p
  const C = LARGURA / 2
  const fundo = (x: number) => Y_OC - 14 + 22 * (1 - Math.exp(-Math.abs(x - C) / 120)) + 5 * sino(x, C, 7)
  const baseCrosta = (x: number) => fundo(x) + ESP_CROSTA_OC
  // a litosfera é fina na dorsal e engrossa com a idade (com a distância)
  const lab = (x: number) => baseCrosta(x) + 4 + 72 * Math.sqrt(Math.min(1, Math.abs(x - C) / 300))
  const sup = amostrar(fundo, 0, LARGURA, 96)
  const crosta = (x0: number, x1: number): Ponto[] => [...amostrar(fundo, x0, x1, 24), ...amostrar(baseCrosta, x0, x1, 24).reverse()]
  const litoLado = (x0: number, x1: number): Ponto[] => [...amostrar(baseCrosta, x0, x1, 32), ...amostrar(lab, x0, x1, 32).reverse()]
  const yCam = baseCrosta(C) - 2
  return {
    ...vazia(),
    formas: [
      { id: 'lito-a', cor: 'lito', pontos: litoLado(0, C) },
      { id: 'lito-b', cor: 'lito', pontos: litoLado(C, LARGURA) },
      { id: 'placa-a', cor: 'oceanica', pontos: crosta(0, C - g) },
      { id: 'placa-b', cor: 'oceanica', pontos: crosta(C + g, LARGURA) },
      { id: 'crosta-nova', cor: 'nova', pontos: crosta(C - g, C + g) },
      // zona de fusão por descompressão: o manto sobe, a pressão cai e uma parte dele derrete
      { id: 'fusao', cor: 'magma', pontos: [[C - 7, yCam + 4], [C + 7, yCam + 4], [C + 46, 268], [C - 46, 268]] },
      agua('mar', sup) as Forma,
    ],
    camaras: [{ x: C, y: yCam, rx: 13 + 6 * p, ry: 3.5 }],
    condutos: [[[C, yCam - 3], [C, fundo(C) + 1]]],
    gotas: gotasEntre([C, 250], [C, yCam + 10], 5),
    fluxo: [
      [[C - 30, 296], [C - 22, 252], [C - 60, 214], [C - 190, 202]],
      [[C + 30, 296], [C + 22, 252], [C + 60, 214], [C + 190, 202]],
    ],
    setas: [
      { de: [250 - g, 74], para: [150 - g, 74] },
      { de: [390 + g, 74], para: [490 + g, 74] },
    ],
    sismos: [
      [C - 4, fundo(C) + 6],
      [C + 6, fundo(C) + 9],
    ],
    rotulos: [
      { texto: 'dorsal', x: C, y: 58, ancora: 'middle', alvo: [C, fundo(C) - 4], prioridade: 1 },
      { texto: 'crosta nova', x: 470, y: 150, ancora: 'start', alvo: [C + g * 0.55, fundo(C + g * 0.55) + 6], prioridade: 1 },
      { texto: 'câmara magmática', x: 196, y: 148, ancora: 'end', alvo: [C - 10, yCam], prioridade: 2 },
      { texto: 'litosfera: fina na dorsal, grossa longe dela', x: 8, y: 186, ancora: 'start', prioridade: 2 },
      { texto: 'o manto sobe e derrete', x: 470, y: 268, ancora: 'start', alvo: [C + 30, 250], prioridade: 2 },
      { texto: 'astenosfera', x: 8, y: 290, ancora: 'start', prioridade: 2 },
    ],
  }
}

/* ------------------------------------------------------------------ rifte */

function cenaRifte(p: number): Cena {
  const C = LARGURA / 2
  const g = 12 + 80 * p
  const fundo = Y_CONT + 10 + 22 * p
  const degrau = Y_CONT + (fundo - Y_CONT) * 0.45
  // superfície: ombros levemente soerguidos e blocos que descem em degraus por falhas normais
  const sup: Ponto[] = [
    [0, Y_CONT],
    [C - g - 34, Y_CONT],
    [C - g, Y_CONT - 4],
    [C - g + 6, degrau],
    [C - g * 0.55, degrau + 3],
    [C - g * 0.55 + 6, fundo],
    [C + g * 0.55 - 6, fundo],
    [C + g * 0.55, degrau + 3],
    [C + g - 6, degrau],
    [C + g, Y_CONT - 4],
    [C + g + 34, Y_CONT],
    [LARGURA, Y_CONT],
  ].map(([x, y]) => [r1(x as number), r1(y as number)] as Ponto)
  // a crosta afina pelos dois lados: o fundo do vale desce e a base da crosta sobe
  const baseCrosta = (x: number) => Y_CONT + ESP_CROSTA_CONT - 10 * p * sino(x, C, g + 40)
  const lab = (x: number) => BASE_LITO_CONT + 10 - 64 * p * sino(x, C, g + 80)
  const yCam = (fundo + baseCrosta(C)) / 2 + 1
  const falhas: Linha[] = (
    [
      [C - g, Y_CONT - 4, 1],
      [C - g * 0.55, degrau + 3, 1],
      [C + g, Y_CONT - 4, -1],
      [C + g * 0.55, degrau + 3, -1],
    ] as [number, number, number][]
  ).map(([x, y, s]) => ({ tipo: 'falha', pontos: [[r1(x), r1(y)], [r1(x + s * 20), r1(baseCrosta(x) - 8)]] }))
  const cena: Cena = {
    ...vazia(),
    formas: [
      { id: 'lito', cor: 'lito', pontos: [...amostrar(baseCrosta, 0, LARGURA, 64), ...amostrar(lab, 0, LARGURA, 64).reverse()] },
      { id: 'crosta-continental', cor: 'continental', pontos: [...sup, ...amostrar(baseCrosta, 0, LARGURA, 64).reverse()] },
      { id: 'magma', cor: 'magma', pontos: [[C - 8, lab(C) - 2], [C + 8, lab(C) - 2], [C + 4, yCam + 3], [C - 4, yCam + 3]] },
    ],
    linhas: falhas,
    camaras: [{ x: C, y: r1(yCam), rx: 16 + 6 * p, ry: r1(Math.min(5, (baseCrosta(C) - fundo) / 2 - 1.5)) }],
    condutos: [
      [[C - 6, yCam - 3], [C - g * 0.7, Y_CONT + 20], [C - g - 22, Y_CONT - 4]],
      ...(p > 0.4 ? [[[C + 6, yCam - 3], [C + 10, fundo]] as Ponto[]] : []),
    ],
    gotas: gotasEntre([C, lab(C) + 40], [C, lab(C) + 4], 3),
    fluxo: [
      [[C - 26, 296], [C - 18, 262], [C - 54, 238], [C - 170, 228]],
      [[C + 26, 296], [C + 18, 262], [C + 54, 238], [C + 170, 228]],
    ],
    setas: [
      { de: [250 - g, 46], para: [150 - g, 46] },
      { de: [390 + g, 46], para: [490 + g, 46] },
    ],
    sismos: [falhas[0], falhas[1], falhas[3]].map((f) => {
      const [a, b] = f?.pontos as [Ponto, Ponto]
      return [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2)] as Ponto
    }),
    vulcoes: [{ x: C - g - 34, w: 30, base: Y_CONT, h: 14 + 18 * p }, ...(p > 0.4 ? [{ x: C + 10 - 9, w: 18, base: fundo, h: 8 + 10 * p }] : [])],
    rotulos: [
      { texto: 'rifte: o vale afunda entre falhas', x: C, y: 22, ancora: 'middle', alvo: [C - g * 0.3, fundo - 2], prioridade: 1 },
      { texto: 'falhas normais', x: 120, y: 120, ancora: 'middle', alvo: [C - g + 10, degrau + 14], prioridade: 2 },
      { texto: 'a crosta estica e afina', x: 470, y: 152, ancora: 'start', alvo: [C + 24, baseCrosta(C + 24)], prioridade: 2 },
      { texto: 'a astenosfera sobe', x: 470, y: 262, ancora: 'start', alvo: [C + 30, 250], prioridade: 2 },
      { texto: 'astenosfera', x: 8, y: 290, ancora: 'start', prioridade: 2 },
    ],
  }
  if (p > 0.35 && p <= 0.75) cena.formas.push({ id: 'lago', cor: 'agua', pontos: [[C - g * 0.55 + 6, fundo - 5], [C + g * 0.55 - 6, fundo - 5], [C + g * 0.55 - 6, fundo], [C - g * 0.55 + 6, fundo]] })
  if (p > 0.35 && p <= 0.75) cena.rotulos.push({ texto: 'lagos alongados', x: LARGURA - 8, y: 122, ancora: 'end', alvo: [C + g * 0.3, fundo - 3], prioridade: 1 })
  if (p > 0.75) {
    cena.formas.push(agua('mar-novo', sup.slice(2, 10)) as Forma)
    cena.rotulos.push({ texto: 'o mar entra: nasce um oceano', x: LARGURA - 8, y: 122, ancora: 'end', alvo: [C + g * 0.3, NIVEL_MAR + 4], prioridade: 1 })
  }
  return cena
}

/* ------------------------------------------------------------------ subducção */

const ANG_MAX = (50 * Math.PI) / 180
const INICIO_DOBRA = 160
const COMP_DOBRA = 210
/** profundidade (no desenho) em que a placa que desce libera água e o manto acima funde: cerca de 100 km */
const Y_FUSAO = 212
const X_FRENTE = 262

/** Topo da placa oceânica que afunda: plana, depois dobra cada vez mais. */
function topoDaPlaca(p: number): Ponto[] {
  const total = INICIO_DOBRA + COMP_DOBRA * 0.6 + 330 * p
  const pts: Ponto[] = [[0, Y_OC]]
  let x = 0
  let y = Y_OC
  for (let s = 0; s < total; s += 4) {
    const ang = ANG_MAX * suave((s - INICIO_DOBRA) / COMP_DOBRA)
    x += 4 * Math.cos(ang)
    y += 4 * Math.sin(ang)
    pts.push([r1(x), r1(y)])
    if (y > ALTURA + 60) break
  }
  return pts
}

function cenaSubducao(p: number, continente: boolean): Cena {
  const topo = topoDaPlaca(p)
  // a placa inteira (com todo o comprimento possível) fixa onde ficam a fossa, a fusão e o vulcão
  const completo = topoDaPlaca(1)
  const yLaje = (x: number) => yEm(completo, x) ?? ALTURA + 60
  const xF = X_FRENTE
  const yF = yLaje(xF)
  const xFusao = xNaProfundidade(completo, Y_FUSAO) as number
  const xv = xFusao + 14
  const pontaY = (topo[topo.length - 1] as Ponto)[1]
  const fundiu = pontaY >= Y_FUSAO + 6
  const q = fundiu ? Math.min(1, (pontaY - Y_FUSAO) / 70) : 0

  // placa de cima: superfície, base da crosta e base da litosfera
  const yCima = continente ? Y_CONT : Y_OC
  const cordilheira = continente ? 6 + 22 * p : 0
  const sup = (x: number) => {
    const rampa = yF + (yCima - yF) * suave((x - xF) / (continente ? 70 : 40))
    return rampa - cordilheira * sino(x, xv, 60)
  }
  const espCrosta = continente ? ESP_CROSTA_CONT : ESP_CROSTA_OC
  const baseCrosta = (x: number) => Math.min(yCima + espCrosta + (continente ? (8 + 18 * p) * sino(x, xv, 70) : 0), yLaje(x))
  const baseLito = (x: number) => Math.min(continente ? BASE_LITO_CONT : yCima + ESP_LITO_OC, yLaje(x))
  const xs = (x0: number, x1: number, n = 60) => Array.from({ length: n + 1 }, (_, i) => x0 + ((x1 - x0) * i) / n)
  const crostaCima: Ponto[] = [...xs(xF, LARGURA).map((x) => [r1(x), r1(sup(x))] as Ponto), ...xs(xF, LARGURA).reverse().map((x) => [r1(x), r1(baseCrosta(x))] as Ponto)]
  const xLito0 = xs(xF, LARGURA, 200).find((x) => yLaje(x) > baseCrosta(x) + 1) ?? xF
  const litoCima: Ponto[] = [...xs(xLito0, LARGURA).map((x) => [r1(x), r1(baseCrosta(x))] as Ponto), ...xs(xLito0, LARGURA).reverse().map((x) => [r1(x), r1(baseLito(x))] as Ponto)]

  // placa que afunda: crosta (de cima) e manto litosférico (de baixo), cortados na borda do desenho
  const baseCrostaLaje = deslocar(topo, ESP_CROSTA_OC)
  const baseLaje = deslocar(topo, ESP_LITO_OC)
  const laje = cortarAbaixo([...topo, ...[...baseCrostaLaje].reverse()])
  const litoLaje = cortarAbaixo([...baseCrostaLaje, ...[...baseLaje].reverse()])

  // fundo do mar: a placa que chega até a fossa, depois a placa de cima
  const fundoMar: Ponto[] = [...topo.filter(([x]) => x < xF), ...xs(xF, LARGURA, 80).map((x) => [r1(x), r1(sup(x))] as Ponto)]
  const prisma: Ponto[] = [
    [xF - 26, r1(yLaje(xF - 26))],
    [xF + 34, r1(sup(xF + 34) + 1)],
    [xF + 34, r1(yLaje(xF + 34))],
  ]

  // terremotos ao longo da placa que desce (zona de Wadati-Benioff), dos rasos aos profundos
  const iFrente = topo.findIndex(([x]) => x >= xF - 10)
  const ao = topo.slice(Math.max(0, iFrente))
  const dentro = deslocar(topo, 7).slice(Math.max(0, iFrente))
  const sismos: Ponto[] = []
  for (let k = 3; k < dentro.length; k += 9) {
    const s = dentro[k] as Ponto
    if (s[1] < ALTURA - 6) sismos.push(s)
  }
  const zona = ao.length > 2 ? cortarAbaixo([...deslocar(topo, -3).slice(Math.max(0, iFrente)), ...deslocar(topo, 20).slice(Math.max(0, iFrente)).reverse()]) : null

  const yVulcao = sup(xv)
  const yCam = yVulcao + (continente ? 30 : 16)
  const vulcao: Vulcao = { x: xv - 24, w: 48, base: r1(yVulcao), h: r1(continente ? 12 + 20 * q : 22 + 22 * q) }
  const iFusao = completo.findIndex(([x]) => x >= xFusao)
  const pontoFusao = (deslocar(completo, -10)[iFusao] ?? [xFusao, Y_FUSAO]) as Ponto
  const meioLaje = (topo[Math.min(topo.length - 1, Math.round(topo.length * 0.62))] ?? topo[0]) as Ponto
  const fundoSismo = sismos[sismos.length - 1]

  const cena: Cena = {
    ...vazia(),
    formas: [
      { id: 'lito-cima', cor: 'lito', pontos: litoCima },
      { id: 'lito-laje', cor: 'lito', pontos: litoLaje },
      { id: 'placa-sobre', cor: continente ? 'continental' : 'oceanica', pontos: crostaCima },
      { id: 'placa-slab', cor: 'oceanica', pontos: laje },
      { id: 'prisma', cor: 'sedimento', pontos: prisma },
      ...(fundiu ? [{ id: 'fusao', cor: 'magma' as const, pontos: Array.from({ length: 10 }, (_, i) => [r1(pontoFusao[0] + 11 * Math.cos((i / 10) * 2 * Math.PI)), r1(pontoFusao[1] + 6 * Math.sin((i / 10) * 2 * Math.PI))] as Ponto) }] : []),
      agua('mar', fundoMar) as Forma,
    ],
    vulcoes: fundiu ? [vulcao] : [],
    camaras: fundiu ? [{ x: xv, y: r1(yCam), rx: 14, ry: 5 }] : [],
    condutos: fundiu ? [[[xv, r1(yCam - 4)], [xv, r1(yVulcao - vulcao.h + 3)]]] : [],
    gotas: fundiu ? gotasEntre(pontoFusao, [xv, baseLito(xv) - (continente ? 6 : 2)], 5).concat(continente ? gotasEntre([xv, baseLito(xv) - 8], [xv, yCam + 8], 3) : []) : [],
    // o manto acima da placa é arrastado para baixo junto com ela
    fluxo: (
      [
        [
          [LARGURA - 14, BASE_LITO_CONT + 14],
          [xv + 80, BASE_LITO_CONT + 18],
          ...deslocar(completo, -20)
            .filter(([x, y]) => x > xFusao + 36 && y < ALTURA - 10)
            .filter((_, i) => i % 4 === 0)
            .slice(0, 5),
        ],
      ] as Ponto[][]
    ).filter((f) => fundiu && f.length > 3),
    sismos,
    zonaSismica: zona,
    setas: [
      { de: [50, 78], para: [160, 78] },
      { de: [610, continente ? 62 : 78], para: [550, continente ? 62 : 78] },
    ],
    rotulos: [
      { texto: 'fossa', x: xF - 24, y: 92, ancora: 'end', alvo: [xF - 4, yF + 1], prioridade: 1 },
      { texto: 'a placa oceânica, mais densa, afunda', x: 8, y: 226, ancora: 'start', alvo: meioLaje, prioridade: 1 },
      { texto: 'litosfera', x: 8, y: Y_OC + ESP_CROSTA_OC + 20, ancora: 'start', prioridade: 2 },
      { texto: 'astenosfera', x: 8, y: 290, ancora: 'start', prioridade: 2 },
    ],
  }
  if (fundiu) {
    cena.rotulos.push(
      { texto: continente ? 'cordilheira com vulcões' : 'arco de ilhas vulcânicas', x: xv - 30, y: continente ? 30 : 44, ancora: 'end', alvo: [xv - 4, yVulcao - vulcao.h + 2], prioridade: 1 },
      { texto: 'fusão parcial (~100 km)', x: LARGURA - 8, y: 252, ancora: 'end', alvo: pontoFusao, prioridade: 2 },
      { texto: 'câmara magmática', x: xv + 52, y: r1(yCam + 4), ancora: 'start', alvo: [xv + 14, yCam], prioridade: 2 },
    )
  }
  if (fundoSismo && fundoSismo[1] > 190) cena.rotulos.push({ texto: 'terremotos cada vez mais fundos', x: 8, y: 266, ancora: 'start', alvo: fundoSismo, prioridade: 2 })
  return cena
}

/* ------------------------------------------------------------------ colisão */

function cenaColisao(p: number): Cena {
  const C = LARGURA / 2
  const h = 12 + 62 * p
  const raiz = 10 + 56 * p
  const larg = 40 + 70 * p
  const forma = (x: number) => sino(x, C, larg)
  const topoC = (x: number) => Y_CONT - h * forma(x)
  const baseC = (x: number) => Y_CONT + ESP_CROSTA_CONT + raiz * forma(x)
  const lab = (x: number) => BASE_LITO_CONT + raiz * 0.8 * forma(x)
  // camadas de rocha: acompanham o soerguimento e se dobram perto da sutura
  const dobras: Linha[] = [0.22, 0.45, 0.68].map((f) => ({
    tipo: 'dobra',
    pontos: amostrar((x) => topoC(x) + (baseC(x) - topoC(x)) * f + 7 * p * Math.sin((x - C) / 9) * forma(x) ** 0.6, 0, LARGURA, 160),
  }))
  const mergulho = 30 + 60 * p
  return {
    ...vazia(),
    formas: [
      { id: 'lito', cor: 'lito', pontos: [...amostrar(baseC, 0, LARGURA, 80), ...amostrar(lab, 0, LARGURA, 80).reverse()] },
      { id: 'placa-a', cor: 'continental', pontos: [...amostrar(topoC, 0, C, 40), ...amostrar(baseC, 0, C, 40).reverse()] },
      { id: 'placa-b', cor: 'continental', pontos: [...amostrar(topoC, C, LARGURA, 40), ...amostrar(baseC, C, LARGURA, 40).reverse()] },
      { id: 'montanha', cor: 'continental', pontos: [...amostrar(topoC, C - 2 * larg, C + 2 * larg, 48), ...amostrar(baseC, C - 2 * larg, C + 2 * larg, 48).reverse()] },
      // o que sobrou da placa oceânica que existia entre os continentes: soltou-se e afunda
      ...(p > 0.15
        ? [
            {
              id: 'resto-oceanico',
              cor: 'oceanica' as const,
              pontos: cortarAbaixo([
                [C + 34, lab(C + 34) + 8 + mergulho * 0.25],
                [C + 52, lab(C + 52) + 4 + mergulho * 0.25],
                [C + 52 + mergulho * 0.35, lab(C) + mergulho],
                [C + 30 + mergulho * 0.35, lab(C) + mergulho + 10],
              ] as Ponto[]),
            },
          ]
        : []),
    ],
    linhas: [
      ...dobras,
      { tipo: 'sutura', pontos: [[C, r1(topoC(C) + 4)], [C + 12, r1(baseC(C) - 6)]] },
      { tipo: 'falha', pontos: [[r1(C - larg * 0.9), r1(topoC(C - larg * 0.9) + 2)], [r1(C - larg * 0.5), r1(baseC(C - larg * 0.5) - 14)]] },
      { tipo: 'falha', pontos: [[r1(C + larg * 0.9), r1(topoC(C + larg * 0.9) + 2)], [r1(C + larg * 0.5), r1(baseC(C + larg * 0.5) - 14)]] },
    ],
    setas: [
      { de: [40, 36], para: [150, 36] },
      { de: [600, 36], para: [490, 36] },
    ],
    sismos: [
      [C - 22, r1(Y_CONT + 22)],
      [C + 18, r1(Y_CONT + 40)],
      [C - 6, r1(Y_CONT + 62)],
      [C + 40, r1(Y_CONT + 30)],
      [C - 46, r1(Y_CONT + 48)],
    ],
    rotulos: [
      { texto: 'cordilheira dobrada', x: C + larg * 0.55 + 14, y: Math.max(20, r1(topoC(C) + 6)), ancora: 'start', alvo: [C + 6, topoC(C) + 4], prioridade: 1 },
      { texto: 'raiz de crosta espessa', x: Math.max(C - larg - 20, 262), y: r1(baseC(C) + 18), ancora: 'end', alvo: [C - 8, baseC(C) - 4], prioridade: 1 },
      { texto: 'sutura', x: r1(C - larg * 1.2 - 10), y: 60, ancora: 'end', alvo: [C + 2, r1(topoC(C) + 16)], prioridade: 2 },
      ...(p > 0.15 ? [{ texto: 'resto da placa oceânica afundando', x: LARGURA - 8, y: 284, ancora: 'end' as const, alvo: [r1(C + 44 + mergulho * 0.35), r1(Math.min(lab(C) + mergulho, ALTURA - 6))] as Ponto, prioridade: 2 as const }] : []),
      { texto: 'astenosfera', x: 8, y: 290, ancora: 'start', prioridade: 2 },
    ],
  }
}

/* ------------------------------------------------------------------ transformante (vista de cima) */

function cenaTransformante(p: number): Cena {
  const d = 70 * p
  const meioY = ALTURA / 2
  return {
    ...vazia(),
    modo: 'planta',
    formas: [
      { id: 'placa-a', cor: 'oceanica', pontos: [[30, 55 - d / 2], [316, 55 - d / 2], [316, 245 - d / 2], [30, 245 - d / 2]] },
      { id: 'placa-b', cor: 'continental', pontos: [[324, 55 + d / 2], [610, 55 + d / 2], [610, 245 + d / 2], [324, 245 + d / 2]] },
    ],
    setas: [
      { de: [175, 90], para: [175, 40] },
      { de: [465, 210], para: [465, 260] },
    ],
    rotulos: [
      { texto: 'falha', x: 320, y: 14, ancora: 'middle', prioridade: 1 },
      { texto: `rio deslocado: ${Math.round(d)} u.`, x: 320, y: meioY + 128, ancora: 'middle', prioridade: 1 },
    ],
    sismos: [
      [320, 120 + d * 0.2],
      [320, 180 - d * 0.2],
    ],
    deslocamento: Math.round(d),
  }
}

/* ------------------------------------------------------------------ espelho e montagem */

function espelhar(c: Cena): Cena {
  const e = (p: Ponto): Ponto => [r1(LARGURA - p[0]), p[1]]
  return {
    ...c,
    formas: c.formas.map((f) => ({ ...f, pontos: f.pontos.map(e).reverse() })),
    setas: c.setas.map((s) => ({ de: e(s.de), para: e(s.para) })),
    rotulos: c.rotulos.map((r) => ({ ...r, x: LARGURA - r.x, alvo: r.alvo && e(r.alvo), ancora: r.ancora === 'start' ? 'end' : r.ancora === 'end' ? 'start' : r.ancora })),
    sismos: c.sismos.map(e),
    vulcoes: c.vulcoes.map((v) => ({ ...v, x: LARGURA - v.x - v.w })),
    camaras: c.camaras.map((m) => ({ ...m, x: LARGURA - m.x })),
    condutos: c.condutos.map((l) => l.map(e)),
    gotas: c.gotas.map(e),
    linhas: c.linhas.map((l) => ({ ...l, pontos: l.pontos.map(e) })),
    fluxo: c.fluxo.map((l) => l.map(e)),
    zonaSismica: c.zonaSismica && c.zonaSismica.map(e),
  }
}

export type IdCena = 'dorsal' | 'rifte' | 'subducao-continental' | 'subducao-oceanica' | 'colisao' | 'transformante'

/**
 * Cena do diagrama para um tipo de limite, com progresso `p` de 0 (início) a 1 (bem avançado).
 * `invertida` desenha a subducção oceano-continente com o continente à esquerda.
 */
export function cenaDoLimite(limite: IdCena, p: number, invertida = false): Cena {
  const q = Math.min(1, Math.max(0, p))
  switch (limite) {
    case 'dorsal':
      return cenaDorsal(q)
    case 'rifte':
      return cenaRifte(q)
    case 'subducao-continental': {
      const c = cenaSubducao(q, true)
      return invertida ? espelhar(c) : c
    }
    case 'subducao-oceanica':
      return cenaSubducao(q, false)
    case 'colisao':
      return cenaColisao(q)
    case 'transformante':
      return cenaTransformante(q)
  }
}
