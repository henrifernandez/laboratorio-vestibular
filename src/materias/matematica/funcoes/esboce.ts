import { criarRng, escolher, sortear, type Rng } from '@/lib/rng'
import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { avaliar, caracteristicas, formulaTexto, type Funcao } from './modelo'

export interface Ponto {
  x: number
  y: number
}

export interface Janela {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
}

/** Um ponto de controle arrastável. fixoX/fixoY travam um dos eixos. */
export interface Controle {
  id: string
  rotulo: string
  fixoX?: number
  fixoY?: number
}

export interface InstanciaEsboce {
  semente: number
  nivel: Nivel
  alvo: Funcao
  janela: Janela
  controles: Controle[]
  inicial: Ponto[]
}

export type RespostaEsboce = Ponto[]

export interface DestaqueEsboce {
  alvo: Funcao
  usuario: Funcao | null
}

export const JANELA_PADRAO: Janela = { xmin: -6, xmax: 6, ymin: -6, ymax: 8 }
export const PASSO_ESBOCE = 0.5

const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const unid = (n: number) => `${fmt(n)} ${n === 1 ? 'unidade' : 'unidades'}`
const IGUAL = 0.01

type Familia = Funcao['tipo']

/** Converte os pontos de controle na função que eles definem, ou null se não definem nenhuma. */
export function construirDosPontos(tipo: Familia, p: Ponto[]): Funcao | null {
  const pt = (i: number) => p[i]
  switch (tipo) {
    case 'afim': {
      const [p1, p2] = [pt(0), pt(1)]
      if (!p1 || !p2 || Math.abs(p2.x - p1.x) < 1e-9) return null
      const a = (p2.y - p1.y) / (p2.x - p1.x)
      return { tipo: 'afim', a, b: p1.y - a * p1.x }
    }
    case 'quadratica': {
      const [v, q] = [pt(0), pt(1)]
      if (!v || !q || Math.abs(q.x - v.x) < 1e-9) return null
      const a = (q.y - v.y) / ((q.x - v.x) * (q.x - v.x))
      return { tipo: 'quadratica', a, b: -2 * a * v.x, c: a * v.x * v.x + v.y }
    }
    case 'exponencial': {
      const [as, p0, p1] = [pt(0), pt(1), pt(2)]
      if (!as || !p0 || !p1) return null
      const k = as.y
      const a = p0.y - k
      if (Math.abs(a) < 1e-9) return null
      const base = (p1.y - k) / a
      if (!(base > 0) || Math.abs(base - 1) < 1e-9) return null
      return { tipo: 'exponencial', a, base, k }
    }
    case 'logaritmica': {
      const [p1, p2] = [pt(0), pt(1)]
      if (!p1 || !p2) return null
      const a = p2.y - p1.y
      if (Math.abs(a) < 1e-9) return null
      return { tipo: 'logaritmica', a, base: 2, k: p1.y }
    }
  }
}

function pontosDaCurva(f: Funcao): Ponto[] {
  switch (f.tipo) {
    case 'afim':
      return [{ x: 0, y: f.b }, { x: 2, y: 2 * f.a + f.b }]
    case 'quadratica': {
      const v = caracteristicas(f).vertice as Ponto
      return [v, { x: v.x + 1, y: v.y + f.a }]
    }
    case 'exponencial':
      return [{ x: -4, y: f.k }, { x: 0, y: f.a + f.k }, { x: 1, y: f.a * f.base + f.k }]
    case 'logaritmica':
      return [{ x: 1, y: f.k }, { x: 2, y: f.k + f.a }]
  }
}

function controlesDe(f: Funcao): Controle[] {
  switch (f.tipo) {
    case 'afim':
      return [{ id: 'p1', rotulo: 'ponto 1' }, { id: 'p2', rotulo: 'ponto 2' }]
    case 'quadratica':
      return [{ id: 'v', rotulo: 'vértice' }, { id: 'q', rotulo: 'outro ponto' }]
    case 'exponencial':
      return [
        { id: 'as', rotulo: 'assíntota', fixoX: -4 },
        { id: 'p0', rotulo: 'ponto em x = 0', fixoX: 0 },
        { id: 'p1', rotulo: 'ponto em x = 1', fixoX: 1 },
      ]
    case 'logaritmica':
      return [
        { id: 'p1', rotulo: 'ponto em x = 1', fixoX: 1 },
        { id: 'p2', rotulo: 'ponto em x = 2', fixoX: 2 },
      ]
  }
}

function inicialDe(tipo: Familia): Ponto[] {
  switch (tipo) {
    case 'afim':
      return [{ x: -2, y: -1 }, { x: 2, y: -1 }]
    case 'quadratica':
      return [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    case 'exponencial':
      return [{ x: -4, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 2 }]
    case 'logaritmica':
      return [{ x: 1, y: 0 }, { x: 2, y: 1 }]
  }
}

function sortearAlvo(rng: Rng, nivel: Nivel): Funcao {
  if (nivel === 1) {
    return { tipo: 'afim', a: escolher(rng, [-2, -1, -0.5, 0.5, 1, 2]), b: sortear(rng, -3, 3) }
  }
  if (nivel === 2) {
    const a = escolher(rng, [-2, -1, -0.5, 0.5, 1, 2])
    const h = sortear(rng, -3, 3)
    const k = sortear(rng, -3, 4)
    return { tipo: 'quadratica', a, b: -2 * a * h, c: a * h * h + k }
  }
  if (rng() < 0.5) {
    return {
      tipo: 'exponencial',
      a: escolher(rng, [1, 2, -1]),
      base: escolher(rng, [2, 3, 0.5]),
      k: sortear(rng, -2, 2),
    }
  }
  return {
    tipo: 'logaritmica',
    a: escolher(rng, [1, 2, -1, -2]),
    base: 2,
    k: sortear(rng, -2, 2),
  }
}

// ---------- correção ----------

interface Problema {
  motivo: string
  licao: string
  frase: string
}

function diferencas(alvo: Funcao, u: Funcao): Problema[] {
  const ps: Problema[] = []
  if (alvo.tipo === 'afim' && u.tipo === 'afim') {
    if (alvo.a !== 0 && Math.sign(u.a) !== Math.sign(alvo.a)) {
      ps.push({
        motivo: 'inclinação trocada',
        licao: 'a > 0: a reta sobe; a < 0: a reta desce',
        frase: `a reta ${u.a > 0 ? 'sobe' : u.a < 0 ? 'desce' : 'fica parada'}, mas deveria ${alvo.a > 0 ? 'subir' : 'descer'} (a ${alvo.a > 0 ? '>' : '<'} 0)`,
      })
    } else if (Math.abs(u.a - alvo.a) > IGUAL) {
      ps.push({
        motivo: 'inclinação errada',
        licao: 'a = (y₂ − y₁) / (x₂ − x₁)',
        frase: `o sentido da reta está certo, mas ela está ${Math.abs(u.a) > Math.abs(alvo.a) ? 'inclinada demais' : 'inclinada de menos'}: a deveria ser ${fmt(alvo.a)} e está ${fmt(u.a)}`,
      })
    }
    if (Math.abs(u.b - alvo.b) > IGUAL) {
      ps.push({
        motivo: 'intercepto errado',
        licao: 'b = f(0): onde a reta corta o eixo y',
        frase: `a reta corta o eixo y em ${fmt(u.b)}, mas deveria cortar em ${fmt(alvo.b)}`,
      })
    }
  } else if (alvo.tipo === 'quadratica' && u.tipo === 'quadratica') {
    const vt = caracteristicas(alvo).vertice as Ponto
    const vu = caracteristicas(u).vertice as Ponto
    if (Math.sign(u.a) !== Math.sign(alvo.a)) {
      ps.push({
        motivo: 'concavidade trocada',
        licao: 'a > 0 abre para cima; a < 0 abre para baixo',
        frase: `a parábola abre para ${u.a > 0 ? 'cima' : 'baixo'}, mas deveria abrir para ${alvo.a > 0 ? 'cima' : 'baixo'}`,
      })
    }
    const dx = vu.x - vt.x
    if (Math.abs(dx) > IGUAL) {
      ps.push({
        motivo: 'vértice deslocado em x',
        licao: 'o vértice fica em x = −b / 2a',
        frase: `o vértice está deslocado ${unid(Math.abs(dx))} para a ${dx > 0 ? 'direita' : 'esquerda'}`,
      })
    }
    const dy = vu.y - vt.y
    if (Math.abs(dy) > IGUAL) {
      ps.push({
        motivo: 'vértice deslocado em y',
        licao: 'a altura do vértice é y = −Δ / 4a',
        frase: `o vértice está ${unid(Math.abs(dy))} ${dy > 0 ? 'acima' : 'abaixo'} do lugar certo`,
      })
    }
    if (Math.sign(u.a) === Math.sign(alvo.a) && Math.abs(u.a - alvo.a) > IGUAL) {
      ps.push({
        motivo: 'abertura errada',
        licao: 'quanto maior |a|, mais estreita é a parábola',
        frase: `a parábola está ${Math.abs(u.a) > Math.abs(alvo.a) ? 'estreita demais' : 'larga demais'} (|a| deveria ser ${fmt(Math.abs(alvo.a))})`,
      })
    }
  } else if (alvo.tipo === 'exponencial' && u.tipo === 'exponencial') {
    if (Math.abs(u.k - alvo.k) > IGUAL) {
      ps.push({
        motivo: 'assíntota errada',
        licao: 'em a·bˣ + k, a assíntota horizontal é y = k',
        frase: `a assíntota está em y = ${fmt(u.k)}, mas deveria estar em y = ${fmt(alvo.k)}`,
      })
    }
    if (Math.abs(u.a + u.k - (alvo.a + alvo.k)) > IGUAL) {
      ps.push({
        motivo: 'ponto em x = 0 errado',
        licao: 'f(0) = a + k',
        frase: `em x = 0 a curva deveria estar em y = ${fmt(alvo.a + alvo.k)}, e está em ${fmt(u.a + u.k)}`,
      })
    }
    const cu = caracteristicas(u).crescimento
    const ct = caracteristicas(alvo).crescimento
    if (cu !== ct) {
      ps.push({
        motivo: 'crescimento trocado',
        licao: 'base > 1 e a > 0 cresce; 0 < base < 1 e a > 0 decresce',
        frase: `a curva ${cu === 'crescente' ? 'cresce' : 'decresce'}, mas deveria ${ct === 'crescente' ? 'crescer' : 'decrescer'}`,
      })
    } else if (Math.abs(u.a * u.base + u.k - (alvo.a * alvo.base + alvo.k)) > IGUAL) {
      ps.push({
        motivo: 'ritmo de crescimento errado',
        licao: 'f(1) = a·base + k mostra a base',
        frase: `em x = 1 a curva deveria estar em y = ${fmt(alvo.a * alvo.base + alvo.k)}, e está em ${fmt(u.a * u.base + u.k)}`,
      })
    }
  } else if (alvo.tipo === 'logaritmica' && u.tipo === 'logaritmica') {
    if (Math.abs(u.k - alvo.k) > IGUAL) {
      ps.push({
        motivo: 'ponto (1, k) errado',
        licao: 'log(1) = 0, então f(1) = k',
        frase: `a curva deveria passar por (1, ${fmt(alvo.k)}) e passa por (1, ${fmt(u.k)})`,
      })
    }
    if (Math.sign(u.a) !== Math.sign(alvo.a)) {
      ps.push({
        motivo: 'crescimento trocado',
        licao: 'a > 0 (base 2): a curva sobe; a < 0: desce',
        frase: `a curva ${u.a > 0 ? 'sobe' : 'desce'}, mas deveria ${alvo.a > 0 ? 'subir' : 'descer'}`,
      })
    } else if (Math.abs(u.a - alvo.a) > IGUAL) {
      ps.push({
        motivo: 'ritmo errado',
        licao: 'em base 2, log₂(2) = 1, então f(2) = a + k',
        frase: `em x = 2 a curva deveria estar em y = ${fmt(alvo.a + alvo.k)}, e está em ${fmt(u.a + u.k)}`,
      })
    }
  }
  return ps
}

function amostras(janela: Janela, n = 49): number[] {
  return Array.from({ length: n }, (_, i) => janela.xmin + (i / (n - 1)) * (janela.xmax - janela.xmin))
}

function comparar(alvo: Funcao, u: Funcao, janela: Janela) {
  let validos = 0
  let proximos = 0
  let maxErro = 0
  for (const x of amostras(janela)) {
    const t = avaliar(alvo, x)
    if (!Number.isFinite(t) || t < janela.ymin - 2 || t > janela.ymax + 2) continue
    validos++
    const d = Math.abs(avaliar(u, x) - t)
    if (!(d <= 0.5)) {
      /* longe */
    } else proximos++
    maxErro = Math.max(maxErro, Number.isFinite(d) ? d : Infinity)
  }
  return { parcial: validos ? proximos / validos : 0, maxErro }
}

const DICAS: Record<Familia, string[]> = {
  afim: [
    'A reta fica determinada por dois pontos. Olhe a fórmula: quem é o ponto onde x = 0?',
    'O coeficiente b é a altura em que a reta corta o eixo y. O coeficiente a diz se a reta sobe (a > 0) ou desce (a < 0).',
    'Marque o ponto (0, b). Depois ande 2 para a direita e some 2·a à altura para achar o segundo ponto.',
  ],
  quadratica: [
    'Uma parábola fica determinada pelo vértice e por mais um ponto. Primeiro ache o vértice.',
    'O vértice está em x = −b/(2a). Se a > 0, ele é o ponto mais baixo; se a < 0, o mais alto.',
    'Coloque o vértice e depois o segundo ponto uma unidade à direita do vértice, a unidades acima (ou abaixo, se a < 0).',
  ],
  exponencial: [
    'Na exponencial, a curva se aproxima de uma linha horizontal sem nunca tocá-la. Comece por ela.',
    'Em a·bˣ + k, a assíntota é y = k. O ponto em x = 0 vale a + k.',
    'Coloque a assíntota em y = k, o ponto de x = 0 em y = a + k e o de x = 1 em y = a·b + k.',
  ],
  logaritmica: [
    'Todo logaritmo vale 0 em x = 1. O que isso diz sobre f(1)?',
    'Em a·log₂(x) + k, temos f(1) = k e f(2) = a + k, porque log₂(2) = 1.',
    'Coloque o primeiro ponto em (1, k) e o segundo em (2, a + k).',
  ],
}

function explicacao(alvo: Funcao): string {
  const f = formulaTexto(alvo)
  const c = caracteristicas(alvo)
  switch (alvo.tipo) {
    case 'afim':
      return `Em ${f}, o ponto em x = 0 é (0, ${fmt(alvo.b)}). Como a = ${fmt(alvo.a)}, a cada 1 unidade para a direita a reta ${alvo.a > 0 ? 'sobe' : 'desce'} ${fmt(Math.abs(alvo.a))}; em x = 2 ela está em y = ${fmt(2 * alvo.a + alvo.b)}.`
    case 'quadratica': {
      const v = c.vertice as Ponto
      return `Em ${f}, o vértice fica em x = −b/(2a) = ${fmt(v.x)} e y = ${fmt(v.y)}. Como a = ${fmt(alvo.a)} ${alvo.a > 0 ? '> 0' : '< 0'}, a parábola abre para ${alvo.a > 0 ? 'cima' : 'baixo'}. Um passo à direita do vértice, a altura muda a = ${fmt(alvo.a)}: o segundo ponto é (${fmt(v.x + 1)}, ${fmt(v.y + alvo.a)}).`
    }
    case 'exponencial':
      return `Em ${f}, a assíntota é y = ${fmt(alvo.k)}. Em x = 0 a curva vale ${fmt(alvo.a + alvo.k)}, e em x = 1 vale ${fmt(alvo.a * alvo.base + alvo.k)}. A distância até a assíntota é multiplicada por ${fmt(alvo.base)} a cada passo.`
    case 'logaritmica':
      return `Em ${f}, o logaritmo vale 0 em x = 1, então a curva passa por (1, ${fmt(alvo.k)}). Como log₂(2) = 1, em x = 2 ela está em y = ${fmt(alvo.a + alvo.k)}. O eixo y (x = 0) é a assíntota vertical.`
  }
}

export const esboce = {
  id: 'matematica/funcoes/esboce',
  materia: 'matematica',
  tema: 'funcoes',
  titulo: 'Esboce a função',

  gerar(semente: number, nivel: Nivel): InstanciaEsboce {
    const rng = criarRng(semente * 7919 + nivel)
    for (let tentativa = 0; tentativa < 50; tentativa++) {
      const alvo = sortearAlvo(rng, nivel)
      const inst: InstanciaEsboce = {
        semente,
        nivel,
        alvo,
        janela: JANELA_PADRAO,
        controles: controlesDe(alvo),
        inicial: inicialDe(alvo.tipo),
      }
      if (!esboce.corrigir(inst, inst.inicial).correto) return inst
    }
    throw new Error('não foi possível gerar uma instância válida')
  },

  respostaCerta(inst: InstanciaEsboce): RespostaEsboce {
    return pontosDaCurva(inst.alvo)
  },

  corrigir(inst: InstanciaEsboce, resposta: RespostaEsboce): Correcao {
    const u = construirDosPontos(inst.alvo.tipo, resposta)
    if (!u) {
      const nome: Record<Familia, string> = {
        afim: 'Os dois pontos estão na mesma vertical, e assim não existe uma função. Separe-os na horizontal.',
        quadratica: 'O segundo ponto está na mesma vertical do vértice, e assim a parábola não fica definida. Afaste-o na horizontal.',
        exponencial:
          'Com esses pontos não sai uma exponencial: (altura em x = 1 − assíntota) / (altura em x = 0 − assíntota) precisa ser positivo e diferente de 1.',
        logaritmica: 'Os dois pontos estão na mesma altura, e assim a curva fica uma reta horizontal. Eleve ou abaixe um deles.',
      }
      return {
        correto: false,
        parcial: 0,
        feedback: nome[inst.alvo.tipo],
        motivo: 'pontos não definem a curva',
        licao: 'confira se os pontos de controle formam uma curva válida',
        destaque: { alvo: inst.alvo, usuario: null } satisfies DestaqueEsboce,
      }
    }
    const { parcial, maxErro } = comparar(inst.alvo, u, inst.janela)
    const correto = maxErro <= 0.05
    const destaque: DestaqueEsboce = { alvo: inst.alvo, usuario: u }
    if (correto) {
      return { correto: true, parcial: 1, feedback: 'Isso! Sua curva coincide com a função em toda a janela.', destaque }
    }
    const ps = diferencas(inst.alvo, u)
    if (ps.length === 0) {
      return {
        correto: false,
        parcial,
        feedback: 'Quase: a curva ainda não coincide em toda a janela. Compare com a curva certa sobreposta.',
        motivo: 'curva imprecisa',
        licao: 'ajuste os pontos de controle com mais cuidado',
        destaque,
      }
    }
    const concavidadeCerta = inst.alvo.tipo === 'quadratica' && !ps.some((p) => p.motivo === 'concavidade trocada')
    const frases = ps.map((p) => p.frase)
    let texto = frases.join('; ')
    if (concavidadeCerta) texto = `A concavidade está certa, mas ${texto}`
    else texto = texto.charAt(0).toUpperCase() + texto.slice(1)
    const primeiro = ps[0] as Problema
    return {
      correto: false,
      parcial,
      feedback: `${texto}.`,
      motivo: primeiro.motivo,
      licao: primeiro.licao,
      destaque,
    }
  },

  dicas(inst: InstanciaEsboce): string[] {
    return DICAS[inst.alvo.tipo]
  },

  explicar(inst: InstanciaEsboce): string {
    return explicacao(inst.alvo)
  },
} satisfies Desafio<InstanciaEsboce, RespostaEsboce> & { respostaCerta(i: InstanciaEsboce): RespostaEsboce }
