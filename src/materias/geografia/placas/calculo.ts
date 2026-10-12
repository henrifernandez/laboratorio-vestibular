/** Tectônica de placas: tipos de limite, feições que cada um forma e as contas de deslocamento. */

export type Crosta = 'oceanica' | 'continental'
export type Movimento = 'afastam' | 'aproximam' | 'deslizam'
export type IdLimite = 'dorsal' | 'rifte' | 'subducao-continental' | 'subducao-oceanica' | 'colisao' | 'transformante'
export type ClasseLimite = 'divergente' | 'convergente' | 'transformante'

export const NOME_CROSTA: Record<Crosta, string> = { oceanica: 'oceânica', continental: 'continental' }
export const NOME_MOVIMENTO: Record<Movimento, string> = { afastam: 'se afastam', aproximam: 'se aproximam', deslizam: 'deslizam lado a lado' }

export interface Limite {
  id: IdLimite
  nome: string
  classe: ClasseLimite
  /** o que se forma, em frases curtas */
  feicoes: string[]
  vulcoes: boolean
  /** sismos: onde e quão fundos */
  sismos: string
  /** quem se forma ou se destrói */
  crosta: string
  explicacao: string
}

export const LIMITES: Record<IdLimite, Limite> = {
  dorsal: {
    id: 'dorsal',
    nome: 'Dorsal oceânica',
    classe: 'divergente',
    feicoes: ['dorsal meso-oceânica (cadeia submarina)', 'crosta oceânica nova, simétrica dos dois lados'],
    vulcoes: true,
    sismos: 'rasos e fracos',
    crosta: 'é criada: o magma sobe, esfria e vira crosta nova',
    explicacao: 'Duas placas oceânicas se afastam; o magma do manto sobe pela fenda e forma crosta nova (assoalho oceânico), que fica mais velha quanto mais longe da dorsal.',
  },
  rifte: {
    id: 'rifte',
    nome: 'Rifte continental',
    classe: 'divergente',
    feicoes: ['vale de afundamento (rifte)', 'vulcões nas bordas', 'lagos alongados; se o afastamento continua, entra o mar'],
    vulcoes: true,
    sismos: 'rasos',
    crosta: 'é esticada e afinada; em estágio avançado, forma-se crosta oceânica',
    explicacao: 'A crosta continental é esticada e afunda no meio; é o início da abertura de um oceano, como no leste da África.',
  },
  'subducao-continental': {
    id: 'subducao-continental',
    nome: 'Subducção oceano-continente',
    classe: 'convergente',
    feicoes: ['fossa oceânica', 'cordilheira na borda do continente', 'cadeia de vulcões'],
    vulcoes: true,
    sismos: 'de rasos a muito profundos, ao longo da placa que afunda',
    crosta: 'oceânica é destruída (afunda no manto); a continental cresce e se dobra',
    explicacao: 'A placa oceânica, mais densa, afunda sob a continental. A fusão parcial do material que desce alimenta os vulcões da cordilheira, como nos Andes.',
  },
  'subducao-oceanica': {
    id: 'subducao-oceanica',
    nome: 'Subducção oceano-oceano',
    classe: 'convergente',
    feicoes: ['fossa oceânica profunda', 'arco de ilhas vulcânicas'],
    vulcoes: true,
    sismos: 'de rasos a muito profundos',
    crosta: 'oceânica é destruída: a mais velha e densa afunda',
    explicacao: 'Uma placa oceânica afunda sob outra (em geral a mais velha e densa). Os vulcões que se formam acima emergem como um arco de ilhas, como no Japão e nas Marianas.',
  },
  colisao: {
    id: 'colisao',
    nome: 'Colisão continental',
    classe: 'convergente',
    feicoes: ['cordilheira dobrada, muito alta', 'crosta espessada (raízes profundas)'],
    vulcoes: false,
    sismos: 'rasos a intermediários, frequentes',
    crosta: 'não afunda: continentes são leves demais; a crosta se empilha e dobra',
    explicacao: 'Dois continentes, ambos pouco densos, não conseguem afundar no manto. Eles se empilham e se dobram, formando cadeias altas como o Himalaia, quase sem vulcanismo.',
  },
  transformante: {
    id: 'transformante',
    nome: 'Falha transformante',
    classe: 'transformante',
    feicoes: ['falha longa, em linha reta', 'rios e estradas deslocados'],
    vulcoes: false,
    sismos: 'rasos e fortes, quando a falha destrava',
    crosta: 'nem criada nem destruída: as placas só deslizam lado a lado',
    explicacao: 'As placas deslizam em sentidos opostos. Elas travam por atrito e, quando soltam de repente, vem o terremoto. Não há vulcões nem formação de cordilheira.',
  },
}

/** Qual limite resulta de dois tipos de crosta e do movimento. `null` = combinação que não ocorre na natureza. */
export function limiteDe(a: Crosta, b: Crosta, mov: Movimento): Limite | null {
  if (mov === 'deslizam') return LIMITES.transformante
  if (mov === 'afastam') {
    if (a !== b) return null
    return a === 'oceanica' ? LIMITES.dorsal : LIMITES.rifte
  }
  if (a === 'continental' && b === 'continental') return LIMITES.colisao
  if (a === 'oceanica' && b === 'oceanica') return LIMITES['subducao-oceanica']
  return LIMITES['subducao-continental']
}

/** Posição (0 = esquerda, 1 = direita) da placa que afunda, quando há subducção. */
export function ladoQueAfunda(a: Crosta, b: Crosta): 0 | 1 | null {
  if (a === 'continental' && b === 'continental') return null
  if (a === 'oceanica') return 0
  return 1
}

/* ------------------------------------------------------------------ deslocamento */

/** 1 cm/ano = 10 km por milhão de anos. Devolve km. */
export function deslocamentoKm(cmAno: number, milhoesDeAnos: number): number {
  return cmAno * milhoesDeAnos * 10
}

/** Tempo (milhões de anos) para percorrer `km` com velocidade `cmAno`. */
export function tempoMa(km: number, cmAno: number): number {
  return km / (cmAno * 10)
}

/** Velocidade (cm/ano) de quem percorre `km` em `milhoesDeAnos`. */
export function velocidadeCmAno(km: number, milhoesDeAnos: number): number {
  return km / (milhoesDeAnos * 10)
}

/**
 * Espalhamento do assoalho: cada lado da dorsal se afasta com a "meia-taxa".
 * A taxa total (as duas placas se afastando uma da outra) é o dobro.
 */
export function taxaTotal(meiaTaxa: number): number {
  return 2 * meiaTaxa
}

/** Idade (Ma) da crosta oceânica a `km` da dorsal, com meia-taxa em cm/ano. */
export function idadeDaCrosta(kmDaDorsal: number, meiaTaxa: number): number {
  return tempoMa(Math.abs(kmDaDorsal), meiaTaxa)
}

/** Largura (km) do oceano aberto em `ma` milhões de anos, com meia-taxa em cm/ano (as duas margens se afastam). */
export function larguraDoOceano(ma: number, meiaTaxa: number): number {
  return deslocamentoKm(taxaTotal(meiaTaxa), ma)
}

/* ------------------------------------------------------------------ geometria do corte */

export const LARGURA = 640
export const ALTURA = 300
export const NIVEL_MAR = 100
const TOPO_OC = 126
const TOPO_CONT = 86
const ESP_OC = 32
const ESP_CONT = 58

export type Ponto = [number, number]
export type CorForma = 'oceanica' | 'continental' | 'nova' | 'magma' | 'agua'

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
}
export interface Cena {
  modo: 'corte' | 'planta'
  formas: Forma[]
  setas: Seta[]
  rotulos: Rotulo[]
  /** na vista de cima, quanto os dois lados já se deslocaram (unidades do desenho) */
  deslocamento: number
  /** pontos de terremoto (hipocentros) */
  sismos: Ponto[]
  /** triângulos de vulcão: [x da base esquerda, x da base direita, y da base, altura] */
  vulcoes: { x: number; w: number; base: number; h: number }[]
}

const retangulo = (x0: number, y0: number, x1: number, y1: number): Ponto[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]

function espelhar(c: Cena): Cena {
  const e = (p: Ponto): Ponto => [LARGURA - p[0], p[1]]
  return {
    ...c,
    formas: c.formas.map((f) => ({ ...f, pontos: f.pontos.map(e).reverse() })),
    setas: c.setas.map((s) => ({ de: e(s.de), para: e(s.para) })),
    rotulos: c.rotulos.map((r) => ({ ...r, x: LARGURA - r.x, ancora: r.ancora === 'start' ? 'end' : r.ancora === 'end' ? 'start' : r.ancora })),
    sismos: c.sismos.map(e),
    vulcoes: c.vulcoes.map((v) => ({ ...v, x: LARGURA - v.x - v.w })),
  }
}


function cenaDorsal(p: number): Cena {
  const g = 10 + 78 * p
  const topo = TOPO_OC
  const base = TOPO_OC + ESP_OC
  return {
    modo: 'corte',
    formas: [
      { id: 'mar', cor: 'agua', pontos: retangulo(0, NIVEL_MAR, LARGURA, topo - 8) },
      { id: 'placa-a', cor: 'oceanica', pontos: retangulo(0, topo, 320 - g, base) },
      { id: 'placa-b', cor: 'oceanica', pontos: retangulo(320 + g, topo, LARGURA, base) },
      {
        id: 'crosta-nova',
        cor: 'nova',
        pontos: [
          [320 - g, topo],
          [320 - g * 0.5, topo - 10],
          [320, topo - 16],
          [320 + g * 0.5, topo - 10],
          [320 + g, topo],
          [320 + g, base],
          [320 - g, base],
        ],
      },
      { id: 'magma', cor: 'magma', pontos: [[320 - 14, base], [320 - 6, topo - 6], [320 + 6, topo - 6], [320 + 14, base], [320 + 30, base + 40], [320 - 30, base + 40]] },
    ],
    setas: [
      { de: [250 - g, topo - 40], para: [150 - g, topo - 40] },
      { de: [390 + g, topo - 40], para: [490 + g, topo - 40] },
    ],
    rotulos: [
      { texto: 'dorsal', x: 320, y: topo - 24, ancora: 'middle' },
      { texto: 'crosta nova', x: 320, y: base + 62, ancora: 'middle' },
    ],
    sismos: [[320 - 4, topo + 12], [320 + 7, topo + 22]],
    deslocamento: 0,
    vulcoes: [],
  }
}

function cenaRifte(p: number): Cena {
  const g = 8 + 70 * p
  const topo = TOPO_CONT
  const base = TOPO_CONT + ESP_CONT
  const fundo = topo + 20 + 34 * p
  const cena: Cena = {
    modo: 'corte',
    formas: [
      { id: 'placa-a', cor: 'continental', pontos: [[0, topo], [320 - g, topo], [320 - g * 0.4, fundo], [320 - g * 0.4, base - 12 * p], [0, base]] },
      { id: 'placa-b', cor: 'continental', pontos: [[320 + g * 0.4, fundo], [320 + g, topo], [LARGURA, topo], [LARGURA, base], [320 + g * 0.4, base - 12 * p]] },
      { id: 'magma', cor: 'magma', pontos: [[320 - g * 0.4, base - 12 * p], [320 + g * 0.4, base - 12 * p], [320 + 36, base + 46], [320 - 36, base + 46]] },
    ],
    setas: [
      { de: [250 - g, topo - 40], para: [150 - g, topo - 40] },
      { de: [390 + g, topo - 40], para: [490 + g, topo - 40] },
    ],
    rotulos: [{ texto: 'rifte', x: 320, y: topo - 24, ancora: 'middle' }],
    sismos: [[320 - g * 0.4, fundo + 18], [320 + g * 0.3, fundo + 26]],
    deslocamento: 0,
    vulcoes: [{ x: 320 - g - 26, w: 26, base: topo, h: 14 + 18 * p }],
  }
  if (p > 0.75) cena.formas.push({ id: 'mar-novo', cor: 'agua', pontos: [[320 - g * 0.4, NIVEL_MAR], [320 + g * 0.4, NIVEL_MAR], [320 + g * 0.4, fundo], [320 - g * 0.4, fundo]] })
  if (p > 0.75) cena.rotulos.push({ texto: 'mar nascente', x: 320, y: fundo - 16, ancora: 'middle' })
  return cena
}

function cenaSubducao(p: number, continente: boolean): Cena {
  const topoOc = TOPO_OC
  const theta = (30 * Math.PI) / 180
  const x0 = 310
  const comprimento = 90 + 190 * p
  const dx = Math.cos(theta)
  const dy = Math.sin(theta)
  const nx = -Math.sin(theta) * ESP_OC
  const ny = Math.cos(theta) * ESP_OC
  const topoSlab: Ponto[] = [[0, topoOc], [x0, topoOc], [x0 + comprimento * dx, topoOc + comprimento * dy]]
  const fundoSlab: Ponto[] = [[x0 + comprimento * dx + nx, topoOc + comprimento * dy + ny], [x0 + nx, topoOc + ny], [0, topoOc + ESP_OC]]
  const yTopoSlabEm = (x: number) => topoOc + (x - x0) * Math.tan(theta)
  const yAcima = continente ? TOPO_CONT : TOPO_OC
  const espAcima = continente ? ESP_CONT : ESP_OC
  const baseAcima = yAcima + espAcima
  const xCorte = x0 + (baseAcima - topoOc) / Math.tan(theta)
  const junta = 322
    const topoPerfil: Ponto[] = continente
    ? [[junta, yAcima], [380, yAcima - 8 * p], [450, yAcima - 30 * p], [540, yAcima - 14 * p], [LARGURA, yAcima]]
    : [[junta, yAcima], [LARGURA, yAcima]]
  const sobre: Ponto[] = [...topoPerfil, [LARGURA, baseAcima], [xCorte, baseAcima], [junta, yTopoSlabEm(junta)]]
  const xVulcao = 450
  const yVulcao = continente ? yAcima - 30 * p : yAcima
  const cena: Cena = {
    modo: 'corte',
    formas: [
      { id: 'mar', cor: 'agua', pontos: retangulo(0, NIVEL_MAR, continente ? junta : LARGURA, topoOc - 1) },
      { id: 'placa-sobre', cor: continente ? 'continental' : 'oceanica', pontos: sobre },
      { id: 'placa-slab', cor: 'oceanica', pontos: [...topoSlab, ...fundoSlab] },
      { id: 'magma', cor: 'magma', pontos: [[xVulcao - 5, yVulcao + 4], [xVulcao + 5, yVulcao + 4], [xVulcao + 9, yTopoSlabEm(xVulcao) - 4], [xVulcao - 9, yTopoSlabEm(xVulcao) - 4]] },
    ],
    setas: [
      { de: [60, topoOc - 48], para: [170, topoOc - 48] },
      { de: [610, yAcima - 46], para: [560, yAcima - 46] },
    ],
    rotulos: [
      { texto: 'fossa', x: x0 - 10, y: topoOc - 26, ancora: 'end' },
      { texto: continente ? 'cordilheira com vulcões' : 'arco de ilhas vulcânicas', x: xVulcao, y: Math.min(yVulcao - 14 - 16 * p, 56), ancora: 'middle' },
      { texto: 'placa que afunda', x: 120, y: topoOc + 66, ancora: 'middle' },
    ],
    deslocamento: 0,
    sismos: [0.2, 0.4, 0.6, 0.8, 1].map((f): Ponto => {
      const s = comprimento * f
      return [x0 + s * dx + nx * 0.5, topoOc + s * dy + ny * 0.5]
    }),
    vulcoes: [{ x: xVulcao - 22, w: 44, base: yVulcao, h: 16 + 26 * p }],
  }
  return cena
}

function cenaColisao(p: number): Cena {
  const topo = TOPO_CONT
  const base = TOPO_CONT + ESP_CONT
  const h = 12 + 62 * p
  const raiz = 10 + 56 * p
  const larg = 40 + 70 * p
  return {
    modo: 'corte',
    formas: [
      { id: 'placa-a', cor: 'continental', pontos: retangulo(0, topo, 320, base) },
      { id: 'placa-b', cor: 'continental', pontos: retangulo(320, topo, LARGURA, base) },
      {
        id: 'montanha',
        cor: 'continental',
        pontos: [[320 - larg, topo], [320 - larg * 0.4, topo - h * 0.7], [320, topo - h], [320 + larg * 0.4, topo - h * 0.7], [320 + larg, topo], [320 + larg * 0.8, base], [320 + larg * 0.3, base + raiz], [320 - larg * 0.3, base + raiz], [320 - larg * 0.8, base]],
      },
    ],
    setas: [
      { de: [60, topo + 28], para: [170, topo + 28] },
      { de: [580, topo + 28], para: [470, topo + 28] },
    ],
    rotulos: [
      { texto: 'cordilheira dobrada', x: 320, y: Math.max(20, topo - h - 12), ancora: 'middle' },
      { texto: 'raiz de crosta espessa', x: 320, y: base + raiz + 22, ancora: 'middle' },
    ],
    sismos: [[300, base + 10], [340, base + 22], [320, topo + 30]],
    deslocamento: 0,
    vulcoes: [],
  }
}

function cenaTransformante(p: number): Cena {
  const d = 70 * p
  const meioY = ALTURA / 2
  return {
    modo: 'planta',
    formas: [
      { id: 'placa-a', cor: 'oceanica', pontos: retangulo(30, 55 - d / 2, 316, 245 - d / 2) },
      { id: 'placa-b', cor: 'continental', pontos: retangulo(324, 55 + d / 2, 610, 245 + d / 2) },
    ],
    setas: [
      { de: [175, 90], para: [175, 40] },
      { de: [465, 210], para: [465, 260] },
    ],
    rotulos: [
      { texto: 'falha', x: 320, y: 14, ancora: 'middle' },
      { texto: `rio deslocado: ${Math.round(d)} u.`, x: 320, y: meioY + 128, ancora: 'middle' },
    ],
    sismos: [[320, 120 + d * 0.2], [320, 180 - d * 0.2]],
    deslocamento: Math.round(d),
    vulcoes: [],
  }
}

/** Cena do diagrama para um tipo de limite, com progresso `p` de 0 (início) a 1 (bem avançado). */
export function montarCena(limite: IdLimite, p: number, ordem: [Crosta, Crosta] = ['oceanica', 'continental']): Cena {
  const q = Math.min(1, Math.max(0, p))
  switch (limite) {
    case 'dorsal':
      return cenaDorsal(q)
    case 'rifte':
      return cenaRifte(q)
    case 'subducao-continental': {
      const c = cenaSubducao(q, true)
      return ordem[0] === 'oceanica' ? c : espelhar(c)
    }
    case 'subducao-oceanica':
      return cenaSubducao(q, false)
    case 'colisao':
      return cenaColisao(q)
    case 'transformante':
      return cenaTransformante(q)
  }
}

/** Texto para leitores de tela. */
export function descreverCena(limite: IdLimite, p: number): string {
  const l = LIMITES[limite]
  const fase = p < 0.2 ? 'no começo' : p < 0.7 ? 'com o processo em andamento' : 'bem avançado'
  return `Diagrama de ${l.nome.toLowerCase()}, ${fase}: ${l.feicoes.join('; ')}.`
}

