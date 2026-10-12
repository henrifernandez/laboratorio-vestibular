/* ======================================================================
   Ecologia: teias alimentares, fluxo de energia, populações e ciclos.
   Tudo o que aparece nas telas e nos desafios sai daqui.
   ====================================================================== */

/* ------------------------------------------------------------------ teias alimentares */

export interface Especie {
  id: string
  nome: string
  produtor?: boolean
}

export interface Teia {
  id: string
  nome: string
  bioma: string
  especies: Especie[]
  /** pares [quem come, de quem se alimenta]; a energia flui no sentido contrário (presa → predador) */
  come: [string, string][]
}

const p = (id: string, nome: string): Especie => ({ id, nome, produtor: true })
const c = (id: string, nome: string): Especie => ({ id, nome })

/** Teias simplificadas: mostram as relações principais, e não toda a dieta de cada espécie. */
export const TEIAS: Teia[] = [
  {
    id: 'lago',
    nome: 'Lago do Pantanal',
    bioma: 'Pantanal',
    especies: [
      p('fito', 'Fitoplâncton'),
      p('aguape', 'Aguapé'),
      c('zoo', 'Zooplâncton'),
      c('caramujo', 'Caramujo'),
      c('lambari', 'Lambari'),
      c('tucunare', 'Tucunaré'),
      c('piranha', 'Piranha'),
      c('garca', 'Garça'),
      c('jacare', 'Jacaré'),
      c('ariranha', 'Ariranha'),
    ],
    come: [
      ['zoo', 'fito'],
      ['caramujo', 'aguape'],
      ['caramujo', 'fito'],
      ['lambari', 'zoo'],
      ['lambari', 'fito'],
      ['tucunare', 'lambari'],
      ['piranha', 'lambari'],
      ['garca', 'lambari'],
      ['jacare', 'tucunare'],
      ['jacare', 'caramujo'],
      ['jacare', 'piranha'],
      ['ariranha', 'tucunare'],
      ['ariranha', 'piranha'],
    ],
  },
  {
    id: 'cerrado',
    nome: 'Campo do Cerrado',
    bioma: 'Cerrado',
    especies: [
      p('capim', 'Capim'),
      p('lobeira', 'Lobeira'),
      c('gafanhoto', 'Gafanhoto'),
      c('rato', 'Rato-do-mato'),
      c('veado', 'Veado-campeiro'),
      c('ema', 'Ema'),
      c('cobra', 'Cobra'),
      c('lobo', 'Lobo-guará'),
      c('coruja', 'Coruja-buraqueira'),
      c('seriema', 'Seriema'),
      c('onca', 'Onça-parda'),
    ],
    come: [
      ['gafanhoto', 'capim'],
      ['rato', 'capim'],
      ['rato', 'lobeira'],
      ['veado', 'capim'],
      ['ema', 'capim'],
      ['ema', 'gafanhoto'],
      ['cobra', 'rato'],
      ['seriema', 'gafanhoto'],
      ['seriema', 'cobra'],
      ['lobo', 'lobeira'],
      ['lobo', 'rato'],
      ['coruja', 'gafanhoto'],
      ['coruja', 'rato'],
      ['onca', 'veado'],
      ['onca', 'ema'],
    ],
  },
  {
    id: 'antartico',
    nome: 'Oceano Antártico',
    bioma: 'Oceano Antártico',
    especies: [
      p('fito', 'Fitoplâncton'),
      c('krill', 'Krill'),
      c('peixe', 'Peixe-prateado'),
      c('lula', 'Lula'),
      c('carang', 'Foca-caranguejeira'),
      c('baleia', 'Baleia-azul'),
      c('pinguim', 'Pinguim-imperador'),
      c('leopardo', 'Foca-leopardo'),
      c('orca', 'Orca'),
    ],
    come: [
      ['krill', 'fito'],
      ['peixe', 'krill'],
      ['lula', 'krill'],
      ['carang', 'krill'],
      ['baleia', 'krill'],
      ['pinguim', 'krill'],
      ['pinguim', 'peixe'],
      ['leopardo', 'pinguim'],
      ['leopardo', 'krill'],
      ['orca', 'leopardo'],
      ['orca', 'carang'],
    ],
  },
  {
    id: 'mata-atlantica',
    nome: 'Mata Atlântica',
    bioma: 'Mata Atlântica',
    especies: [
      p('embauba', 'Embaúba'),
      p('jucara', 'Palmito-juçara'),
      c('preguica', 'Preguiça'),
      c('lagarta', 'Lagarta'),
      c('paca', 'Paca'),
      c('sabia', 'Sabiá'),
      c('mico', 'Mico-leão-dourado'),
      c('sapo', 'Sapo'),
      c('onca', 'Onça-pintada'),
      c('jararaca', 'Jararaca'),
      c('gaviao', 'Gavião'),
    ],
    come: [
      ['preguica', 'embauba'],
      ['lagarta', 'embauba'],
      ['paca', 'jucara'],
      ['sabia', 'jucara'],
      ['sabia', 'lagarta'],
      ['mico', 'jucara'],
      ['mico', 'lagarta'],
      ['sapo', 'lagarta'],
      ['jararaca', 'sapo'],
      ['gaviao', 'jararaca'],
      ['gaviao', 'sabia'],
      ['onca', 'paca'],
      ['onca', 'preguica'],
    ],
  },
  {
    id: 'caatinga',
    nome: 'Caatinga',
    bioma: 'Caatinga',
    especies: [
      p('mandacaru', 'Mandacaru'),
      p('gramineas', 'Gramíneas'),
      c('gafanhoto', 'Gafanhoto'),
      c('prea', 'Preá'),
      c('asa', 'Asa-branca'),
      c('calango', 'Calango'),
      c('jaguatirica', 'Jaguatirica'),
      c('teiu', 'Teiú'),
      c('cascavel', 'Cascavel'),
      c('carcara', 'Carcará'),
    ],
    come: [
      ['gafanhoto', 'gramineas'],
      ['prea', 'gramineas'],
      ['prea', 'mandacaru'],
      ['asa', 'gramineas'],
      ['calango', 'gafanhoto'],
      ['teiu', 'calango'],
      ['teiu', 'gafanhoto'],
      ['cascavel', 'prea'],
      ['cascavel', 'calango'],
      ['carcara', 'cascavel'],
      ['carcara', 'calango'],
      ['carcara', 'prea'],
      ['jaguatirica', 'prea'],
      ['jaguatirica', 'asa'],
    ],
  },
]

export function teia(id: string): Teia {
  return TEIAS.find((t) => t.id === id) ?? (TEIAS[0] as Teia)
}

export function especie(t: Teia, id: string): Especie {
  const e = t.especies.find((x) => x.id === id)
  if (!e) throw new Error(`espécie desconhecida: ${id}`)
  return e
}

export const nomeEspecie = (t: Teia, id: string) => especie(t, id).nome

/** Alimentos diretos de uma espécie (as setas que chegam nela). */
export function alimentos(t: Teia, id: string): string[] {
  return t.come.filter(([q]) => q === id).map(([, a]) => a)
}

/** Predadores diretos (as setas que saem dela). */
export function predadores(t: Teia, id: string): string[] {
  return t.come.filter(([, a]) => a === id).map(([q]) => q)
}

export const ehProdutor = (t: Teia, id: string) => especie(t, id).produtor === true
export const ehTopo = (t: Teia, id: string) => predadores(t, id).length === 0

/**
 * Níveis tróficos que a espécie pode ocupar: produtor = 1; consumidor = 1 + o nível de cada alimento.
 * Quem se alimenta em mais de um nível (onívoro) ocupa mais de um.
 */
export function niveis(t: Teia, id: string): number[] {
  const memo = new Map<string, number[]>()
  const calc = (x: string): number[] => {
    const guardado = memo.get(x)
    if (guardado) return guardado
    const r = ehProdutor(t, x) ? [1] : [...new Set(alimentos(t, x).flatMap((a) => calc(a).map((n) => n + 1)))].sort((a, b) => a - b)
    memo.set(x, r)
    return r
  }
  return calc(id)
}

/** Maior nível que a espécie ocupa: define a camada em que ela é desenhada. */
export const camada = (t: Teia, id: string) => Math.max(...niveis(t, id))

/** Todas as cadeias alimentares, do produtor até uma espécie sem predadores. */
export function cadeias(t: Teia): string[][] {
  const saida: string[][] = []
  const descer = (caminho: string[]) => {
    const ultimo = caminho[caminho.length - 1] as string
    const ps = predadores(t, ultimo)
    if (ps.length === 0) saida.push(caminho)
    else for (const q of ps) descer([...caminho, q])
  }
  for (const e of t.especies) if (e.produtor) descer([e.id])
  return saida
}

/** Uma sequência é uma cadeia válida se começa em um produtor e cada espécie come a anterior. */
export function cadeiaValida(t: Teia, seq: string[]): boolean {
  if (seq.length < 2) return false
  if (!ehProdutor(t, seq[0] as string)) return false
  return seq.every((id, i) => i === 0 || alimentos(t, id).includes(seq[i - 1] as string))
}

export function nomeNivel(n: number): string {
  return ['', 'produtor', 'consumidor primário', 'consumidor secundário', 'consumidor terciário', 'consumidor quaternário', 'consumidor quinário'][n] ?? `nível ${n}`
}

export interface Consequencias {
  /** perdem imediatamente todo o alimento */
  semAlimento: string[]
  /** ficam sem alimento depois de uma sequência de perdas (inclui as imediatas) */
  semAlimentoEmCadeia: string[]
  /** perdem uma ou mais fontes de alimento (inclusive pelas perdas em cadeia), mas ainda têm outras */
  perdemFonte: string[]
  /** eram presas de alguma espécie removida: perdem um predador */
  perdemPredador: string[]
  /** dividiam alimento com alguma espécie removida: ganham mais alimento disponível */
  ganhamAlimento: string[]
}

/** Efeito qualitativo e estrutural de retirar espécies da teia. */
export function remover(t: Teia, removidas: string[]): Consequencias {
  const R = new Set(removidas)
  const vivas = (s: Set<string>) => t.especies.map((e) => e.id).filter((id) => !s.has(id))
  const direto = vivas(R).filter((id) => {
    const a = alimentos(t, id)
    return a.length > 0 && a.every((x) => R.has(x))
  })
  // propagação: quem fica sem alimento também desaparece e tira o alimento de outros
  const perdidos = new Set(R)
  let mudou = true
  while (mudou) {
    mudou = false
    for (const id of vivas(perdidos)) {
      const a = alimentos(t, id)
      if (a.length > 0 && a.every((x) => perdidos.has(x))) {
        perdidos.add(id)
        mudou = true
      }
    }
  }
  const emCadeia = [...perdidos].filter((id) => !R.has(id))
  const perdemFonte = vivas(perdidos).filter((id) => {
    const a = alimentos(t, id)
    return a.some((x) => perdidos.has(x)) && a.some((x) => !perdidos.has(x))
  })
  const perdemPredador = vivas(perdidos).filter((id) => predadores(t, id).some((q) => R.has(q)))
  const ganham = vivas(R).filter((id) => !perdidos.has(id) && t.come.some(([q, a]) => q === id && t.come.some(([q2, a2]) => R.has(q2) && a2 === a)))
  return { semAlimento: direto, semAlimentoEmCadeia: emCadeia, perdemFonte, perdemPredador, ganhamAlimento: ganham }
}

/**
 * Efeito em cascata ao longo de uma cadeia linear: retirar o último elo faz o anterior aumentar,
 * o anterior a ele diminuir, e assim por diante (sinal alternado). Devolve +1 (aumenta) ou −1 (diminui).
 */
export function efeitoCascata(tamanho: number, posicaoRemovida: number, posicaoAlvo: number): 1 | -1 {
  const distancia = posicaoRemovida - posicaoAlvo
  if (distancia <= 0 || posicaoAlvo >= tamanho) throw new Error('o alvo precisa estar abaixo do elo removido')
  return distancia % 2 === 1 ? 1 : -1
}

/* ------------------------------------------------------------------ fluxo de energia */

/** Energia que chega ao nível n acima do produtor, com a mesma eficiência em cada passagem. */
export const energiaNoNivel = (e0: number, eficiencia: number, n: number) => e0 * eficiencia ** n

/** Energia em cada nível, do produtor (índice 0) ao último. */
export function energiaPorNivel(e0: number, eficiencia: number, niveisTotais: number): number[] {
  return Array.from({ length: niveisTotais }, (_, i) => energiaNoNivel(e0, eficiencia, i))
}

/** Produtividade primária líquida: o que sobra da bruta depois da respiração dos produtores. */
export const produtividadeLiquida = (bruta: number, respiracao: number) => bruta - respiracao

/** Eficiência de transferência entre dois níveis consecutivos, em fração. */
export const eficienciaEntre = (eNivelSuperior: number, eNivelInferior: number) => eNivelSuperior / eNivelInferior

/** Concentração de uma substância que se acumula (não é excretada) após n passagens, cada uma com o mesmo fator. */
export const concentracaoNoNivel = (c0: number, fator: number, n: number) => c0 * fator ** n

/**
 * Fator de acúmulo quando toda a substância ingerida fica retida e só uma fração (eficiência) da massa ingerida vira massa do predador:
 * c_predador = c_presa × (massa ingerida ÷ massa ganha) = c_presa ÷ eficiência.
 */
export const fatorDeAcumulo = (eficiencia: number) => 1 / eficiencia

export interface TipoPiramide {
  id: 'energia' | 'biomassa' | 'numeros'
  nome: string
}

export interface PiramideAmbiente {
  id: string
  nome: string
  /** do produtor ao último nível */
  niveis: string[]
  biomassa: number[] // g/m² (ilustrativo)
  numeros: number[] // indivíduos (ilustrativo)
  unidadeNumeros: string
}

/** Valores ilustrativos, pensados para mostrar a forma das pirâmides e não para citar medidas reais. */
export const AMBIENTES_PIRAMIDE: PiramideAmbiente[] = [
  { id: 'campo', nome: 'Campo (capim)', niveis: ['Capim', 'Gafanhotos', 'Aves insetívoras', 'Gavião'], biomassa: [800, 80, 8, 1], numeros: [10_000_000, 100_000, 1_000, 10], unidadeNumeros: 'indivíduos por hectare' },
  { id: 'arvore', nome: 'Uma árvore e seus insetos', niveis: ['Árvore', 'Insetos herbívoros', 'Aves insetívoras'], biomassa: [200, 20, 2], numeros: [1, 50_000, 40], unidadeNumeros: 'indivíduos na árvore' },
  { id: 'mar', nome: 'Mar aberto (num instante)', niveis: ['Fitoplâncton', 'Zooplâncton', 'Peixes'], biomassa: [4, 21, 5], numeros: [1_000_000_000, 10_000_000, 10_000], unidadeNumeros: 'indivíduos por km²' },
]

export const ambientePiramide = (id: string) => AMBIENTES_PIRAMIDE.find((a) => a.id === id) ?? (AMBIENTES_PIRAMIDE[0] as PiramideAmbiente)

/** A pirâmide está invertida se algum nível supera o anterior. */
export const invertida = (valores: number[]) => valores.some((v, i) => i > 0 && v > (valores[i - 1] as number))

/* ------------------------------------------------------------------ ciclo do carbono (ordem de grandeza) */

/** 1 ppm de CO₂ na atmosfera equivale a cerca de 2,13 GtC. */
export const GTC_POR_PPM = 2.13
/** Fração das emissões que permanece na atmosfera (o resto vai para oceanos e vegetação): ~0,46 nos balanços recentes. */
export const FRACAO_ATMOSFERA = 0.46

export interface BalancoCarbono {
  emissoes: number
  naAtmosfera: number
  sumidourosNaturais: number
  ppmPorAno: number
}

/** Balanço didático em GtC por ano: fóssil + mudança de uso da terra; o reflorestamento retira carbono extra. */
export function balancoCarbono(fossil: number, usoDaTerra: number, reflorestamento: number): BalancoCarbono {
  const emissoes = fossil + usoDaTerra
  const sumidourosNaturais = emissoes * (1 - FRACAO_ATMOSFERA)
  const naAtmosfera = emissoes * FRACAO_ATMOSFERA - reflorestamento
  return { emissoes, naAtmosfera, sumidourosNaturais, ppmPorAno: naAtmosfera / GTC_POR_PPM }
}

/* ------------------------------------------------------------------ populações */

/** Variação do número de indivíduos num intervalo: nascimentos + imigrantes − mortes − emigrantes. */
export const saldoPopulacional = (nascimentos: number, mortes: number, imigrantes: number, emigrantes: number) => nascimentos + imigrantes - mortes - emigrantes

export const densidade = (n: number, area: number) => n / area

/** Crescimento exponencial por gerações: N = N₀ (1 + r)ᵗ, com r a taxa por intervalo (fração). */
export const exponencial = (n0: number, r: number, t: number) => n0 * (1 + r) ** t

/** Crescimento exponencial contínuo: N = N₀ eʳᵗ. */
export const exponencialContinuo = (n0: number, r: number, t: number) => n0 * Math.exp(r * t)

/** Solução exata do crescimento logístico dN/dt = rN(1 − N/K). */
export function logistico(n0: number, r: number, k: number, t: number): number {
  return k / (1 + ((k - n0) / n0) * Math.exp(-r * t))
}

/** Taxa de crescimento logístico num dado tamanho populacional. */
export const taxaLogistica = (r: number, n: number, k: number) => r * n * (1 - n / k)

/** Maior taxa de crescimento da curva logística, que ocorre em N = K/2. */
export const taxaMaximaLogistica = (r: number, k: number) => (r * k) / 4

/** Estimativa de Lincoln-Petersen: marcados × recapturados totais ÷ marcados entre os recapturados. */
export const marcaRecaptura = (marcados: number, capturados: number, recapturadosMarcados: number) => (marcados * capturados) / recapturadosMarcados

/** Um passo do método de Runge-Kutta de 4ª ordem para o crescimento logístico (usado para conferir a solução exata). */
export function passoLogistico(n: number, r: number, k: number, dt: number): number {
  const f = (x: number) => taxaLogistica(r, x, k)
  const k1 = f(n)
  const k2 = f(n + (dt / 2) * k1)
  const k3 = f(n + (dt / 2) * k2)
  const k4 = f(n + dt * k3)
  return n + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
}

/* ------------------------------------------------------------------ presa e predador (Lotka-Volterra) */

export interface ParametrosLV {
  /** crescimento per capita das presas sem predadores */
  alfa: number
  /** eficiência de captura dos predadores */
  beta: number
  /** conversão de presas capturadas em novos predadores */
  delta: number
  /** mortalidade per capita dos predadores sem presas */
  gama: number
}

export const PARAMETROS_LV: ParametrosLV = { alfa: 1, beta: 0.1, delta: 0.02, gama: 0.5 }

export interface PontoLV {
  t: number
  presas: number
  predadores: number
}

export const derivadasLV = (x: number, y: number, p: ParametrosLV): [number, number] => [p.alfa * x - p.beta * x * y, p.delta * x * y - p.gama * y]

/** Ponto de equilíbrio: as duas populações ficam constantes. */
export const equilibrioLV = (p: ParametrosLV) => ({ presas: p.gama / p.delta, predadores: p.alfa / p.beta })

/** Grandeza que se conserva ao longo de cada órbita do modelo: serve para conferir a integração numérica. */
export const invarianteLV = (x: number, y: number, p: ParametrosLV) => p.delta * x - p.gama * Math.log(x) + p.beta * y - p.alfa * Math.log(y)

export function passoLV(x: number, y: number, p: ParametrosLV, dt: number): [number, number] {
  const d = (a: number, b: number) => derivadasLV(a, b, p)
  const [a1, b1] = d(x, y)
  const [a2, b2] = d(x + (dt / 2) * a1, y + (dt / 2) * b1)
  const [a3, b3] = d(x + (dt / 2) * a2, y + (dt / 2) * b2)
  const [a4, b4] = d(x + dt * a3, y + dt * b3)
  return [x + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4), y + (dt / 6) * (b1 + 2 * b2 + 2 * b3 + b4)]
}

export const PASSO_LV = 0.01
export const AMOSTRA_LV = 5

/** Trajetória de 0 a T, com um ponto a cada AMOSTRA_LV passos de integração. */
export function trajetoriaLV(x0: number, y0: number, p: ParametrosLV, T: number): PontoLV[] {
  const pontos: PontoLV[] = [{ t: 0, presas: x0, predadores: y0 }]
  let x = x0
  let y = y0
  const total = Math.round(T / PASSO_LV)
  for (let i = 1; i <= total; i++) {
    ;[x, y] = passoLV(x, y, p, PASSO_LV)
    if (i % AMOSTRA_LV === 0) pontos.push({ t: Math.round(i * PASSO_LV * 1e6) / 1e6, presas: x, predadores: y })
  }
  return pontos
}

/** Valor da trajetória em um instante qualquer, com interpolação linear entre as amostras. */
export function pontoEm(trajetoria: PontoLV[], t: number): PontoLV {
  const passo = PASSO_LV * AMOSTRA_LV
  const i = Math.min(trajetoria.length - 2, Math.max(0, Math.floor(t / passo + 1e-9)))
  const a = trajetoria[i] as PontoLV
  const b = trajetoria[i + 1] as PontoLV
  const f = Math.min(1, Math.max(0, (t - a.t) / passo))
  return { t, presas: a.presas + (b.presas - a.presas) * f, predadores: a.predadores + (b.predadores - a.predadores) * f }
}
