import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { distanciaFrenagem, encontro, kmhParaMs, movimento, posicao, velocidade, type Movimento, type Trecho } from './calculo'

const f2 = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

/* ------------------------------------------------------------------ ligue os gráficos */

export type TipoOpcao = 'correta' | 'negada' | 'aceleracao' | 'posicao' | 'outro'

export interface CurvaMini {
  /** amostras uniformes em [0, T] */
  y: number[]
}

export interface DadosGraficos {
  T: number
  inicio: { x0: number; v0: number }
  trechos: Trecho[]
  /** gráfico mostrado no enunciado: posição x(t) */
  posicao: CurvaMini
  /** gráficos das alternativas (velocidade candidata) */
  opcoes: Record<string, { tipo: TipoOpcao; curva: CurvaMini }>
}

export const AMOSTRAS = 49

const amostrar = (fn: (t: number) => number, T: number): number[] => Array.from({ length: AMOSTRAS }, (_, i) => fn((T * i) / (AMOSTRAS - 1)))

function padrao(rng: Rng, nivel: Nivel): { inicio: { x0: number; v0: number }; trechos: Trecho[]; nome: string } {
  if (nivel === 1) {
    const v = escolher(rng, [-2, -1, 1, 2, 3])
    const parado = rng() < 0.3
    return {
      inicio: { x0: sortear(rng, 0, 3), v0: parado ? 0 : v },
      trechos: parado ? [{ dur: 4, a: 0 }, { dur: 4, a: 0 }] : [{ dur: 4, a: 0 }, { dur: 4, a: 0 }],
      nome: parado ? 'parado' : 'velocidade constante',
    }
  }
  if (nivel === 2) {
    const a = escolher(rng, [-2, -1, 1, 2])
    return { inicio: { x0: 0, v0: a > 0 ? sortear(rng, 0, 2) : sortear(rng, 3, 6) }, trechos: [{ dur: 8, a }], nome: 'aceleração constante' }
  }
  const a1 = escolher(rng, [1, 2])
  const d1 = sortear(rng, 2, 3)
  return {
    inicio: { x0: 0, v0: 0 },
    // acelera, mantém a velocidade e freia até parar
    trechos: [{ dur: d1, a: a1 }, { dur: sortear(rng, 2, 3), a: 0 }, { dur: d1, a: -a1 }],
    nome: 'acelera, mantém e freia',
  }
}

export function gerarGraficos(rng: Rng, nivel: Nivel): InstanciaMulti<DadosGraficos> {
  const p = padrao(rng, nivel)
  const mov = movimento(p.inicio, p.trechos)
  const T = mov.duracao
  const xs = amostrar((t) => mov.x(t), T)
  const vs = amostrar((t) => mov.v(t), T)
  const as = amostrar((t) => mov.a(t), T)
  const base = (v: number[]) => v.map((y) => Math.round(y * 1e6) / 1e6)

  // outro movimento: muda o instante da mudança de velocidade (ou a inclinação)
  const outroTrechos: Trecho[] = p.trechos.map((t, i) => (i === 0 ? { dur: t.dur + 1, a: t.a } : i === p.trechos.length - 1 ? { dur: Math.max(1, t.dur - 1), a: -t.a || t.a } : t))
  const outro = movimento({ x0: p.inicio.x0, v0: -p.inicio.v0 || 2 }, outroTrechos)
  const vOutro = amostrar((t) => outro.v(Math.min(t, outro.duracao)), T)

  const candidatos: { tipo: TipoOpcao; y: number[] }[] = [
    { tipo: 'correta', y: base(vs) },
    { tipo: 'negada', y: base(vs.map((y) => -y)) },
    { tipo: 'aceleracao', y: base(as) },
    { tipo: 'posicao', y: base(xs) },
    { tipo: 'outro', y: base(vOutro) },
  ]
  // descarta alternativas iguais à correta (casos degenerados) e escolhe 3 erros diferentes entre si
  const chave = (y: number[]) => y.map((v) => v.toFixed(3)).join(',')
  const usados = new Set([chave(candidatos[0]!.y)])
  const escolhidos = [candidatos[0]!]
  for (const c of embaralhar(rng, candidatos.slice(1))) {
    const k = chave(c.y)
    if (usados.has(k) || escolhidos.length === 4) continue
    usados.add(k)
    escolhidos.push(c)
  }
  while (escolhidos.length < 4) {
    const extra = base(vs.map((y, i) => y + (i % 2 ? 0.8 : -0.8) * (escolhidos.length)))
    escolhidos.push({ tipo: 'outro', y: extra })
  }
  const ids = ['A', 'B', 'C', 'D']
  const lista = embaralhar(rng, escolhidos)
  const opcoes: DadosGraficos['opcoes'] = {}
  let certa = 'A'
  const sinal0 = mov.v(0) > 0 ? 'positiva' : mov.v(0) < 0 ? 'negativa' : 'nula'
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  lista.forEach((c, i) => {
    const id = ids[i] as string
    opcoes[id] = { tipo: c.tipo, curva: { y: c.y } }
    if (c.tipo === 'correta') {
      certa = id
      porque[id] = `Isso! A velocidade é a inclinação do gráfico de posição: ${p.nome === 'parado' ? 'a reta horizontal tem inclinação zero, então v = 0' : p.nome === 'velocidade constante' ? 'a reta tem inclinação constante, então a velocidade é constante' : p.nome === 'aceleração constante' ? 'a parábola vai ficando mais (ou menos) inclinada de modo regular, então v varia em linha reta' : 'a curva fica mais inclinada, depois reta, depois menos inclinada: a velocidade sobe, fica constante e cai'}.`
    } else if (c.tipo === 'negada') {
      porque[id] = `Esse gráfico está com o sinal invertido. No gráfico de posição, no início, ${mov.v(0) > 0 ? 'x aumenta' : mov.v(0) < 0 ? 'x diminui' : 'x não varia'}: a velocidade inicial é ${sinal0}.`
      motivo[id] = 'trocou o sinal da velocidade'
    } else if (c.tipo === 'aceleracao') {
      porque[id] = 'Esse gráfico parece o da aceleração (a variação da velocidade), e não o da velocidade. A velocidade é a inclinação do gráfico de posição.'
      motivo[id] = 'confundiu velocidade com aceleração'
    } else if (c.tipo === 'posicao') {
      porque[id] = 'Esse gráfico tem o mesmo formato do gráfico de posição. Mas a velocidade é a inclinação (a derivada) dele, que tem outro formato.'
      motivo[id] = 'confundiu velocidade com posição'
    } else {
      porque[id] = 'Esse gráfico não combina com a inclinação do gráfico de posição: confira em que instantes a inclinação de x(t) muda e como.'
      motivo[id] = 'não relacionou a inclinação de x(t) com v(t)'
    }
  })
  return {
    enunciado: `O gráfico mostra a posição de um móvel em função do tempo. Qual dos gráficos abaixo representa a sua velocidade em função do tempo?`,
    opcoes: ids.map((id) => ({ id, rotulo: `Gráfico ${id}` })),
    certa,
    porque,
    motivo,
    resolucao: `A velocidade é a inclinação do gráfico x(t). ${p.nome === 'parado' ? 'Reta horizontal: v = 0.' : p.nome === 'velocidade constante' ? `Reta com inclinação ${f2(mov.v(0))}: v = ${f2(mov.v(0))} m/s o tempo todo.` : p.nome === 'aceleração constante' ? `A inclinação muda de ${f2(mov.v(0))} para ${f2(mov.v(T))} m/s de modo regular: v(t) é uma reta.` : 'A inclinação cresce, fica constante e depois cai a zero: v(t) sobe, estabiliza e desce.'}`,
    dicas: ['Velocidade é o quanto a posição varia por segundo: a inclinação do gráfico x(t).', 'Reta no gráfico de posição → velocidade constante. Curva se inclinando mais → velocidade aumentando.', `Olhe o começo do gráfico de posição: a velocidade inicial é ${sinal0}.`],
    licao: 'v = inclinação do gráfico x(t); a = inclinação do gráfico v(t)',
    dados: { T, inicio: p.inicio, trechos: p.trechos, posicao: { y: base(xs) }, opcoes },
  }
}

/* ------------------------------------------------------------------ cálculo */

export interface DadosCalculo {
  tema: 'mru' | 'mruv' | 'encontro'
}

export function gerarCalculo(rng: Rng, nivel: Nivel): InstanciaNum<DadosCalculo> {
  if (nivel === 1) {
    if (rng() < 0.5) {
      const kmh = escolher(rng, [36, 54, 72, 90, 108])
      const t = sortear(rng, 3, 8)
      const ms = kmhParaMs(kmh)
      return {
        enunciado: `Um carro viaja com velocidade constante de ${kmh} km/h. Que distância, em metros, ele percorre em ${t} s?`,
        resposta: ms * t,
        tolerancia: 0.01,
        unidade: 'm',
        erros: [
          { valor: kmh * t, frase: 'Você multiplicou km/h por segundos sem converter. Para usar tempo em segundos, a velocidade precisa estar em m/s: divida km/h por 3,6.', motivo: 'não converteu km/h para m/s' },
          { valor: (kmh * 3.6) * t, frase: 'Você multiplicou por 3,6 em vez de dividir. Para ir de km/h para m/s, divide-se por 3,6 (1 m/s = 3,6 km/h).', motivo: 'converteu no sentido contrário' },
        ],
        resolucao: `v = ${kmh} km/h ÷ 3,6 = ${f2(ms)} m/s. Δx = v·t = ${f2(ms)} · ${t} = ${f2(ms * t)} m.`,
        dicas: ['Misturar km/h com segundos dá resultado errado: use as mesmas unidades.', 'Para converter km/h em m/s, divida por 3,6.', `v = ${kmh}/3,6 = ${f2(ms)} m/s; depois Δx = v·Δt.`],
        licao: 'km/h → m/s: ÷ 3,6; MRU: Δx = v·Δt',
        dados: { tema: 'mru' },
      }
    }
    const v = escolher(rng, [60, 80, 90, 100, 120])
    const h = sortear(rng, 2, 4)
    const d = v * h
    return {
      enunciado: `Uma viagem de ${d} km foi feita em ${h} horas, sempre à mesma velocidade. Qual é a velocidade média, em km/h?`,
      resposta: v,
      tolerancia: 0.01,
      unidade: 'km/h',
      erros: [{ valor: d * h, frase: 'Você multiplicou a distância pelo tempo. A velocidade média é a distância dividida pelo tempo: v = Δx/Δt.', motivo: 'multiplicou em vez de dividir' }],
      resolucao: `v = Δx/Δt = ${d} km ÷ ${h} h = ${v} km/h.`,
      dicas: ['Velocidade média = distância percorrida ÷ tempo gasto.', 'Mantenha as unidades: km e h dão km/h.', `${d} ÷ ${h}.`],
      licao: 'velocidade média = Δx/Δt',
      dados: { tema: 'mru' },
    }
  }
  if (nivel === 2) {
    const caso = sortear(rng, 0, 2)
    if (caso === 0) {
      const a = sortear(rng, 2, 5)
      const t = sortear(rng, 3, 8)
      const d = (a * t * t) / 2
      return {
        enunciado: `Um carro parte do repouso com aceleração constante de ${a} m/s². Que distância percorre em ${t} s?`,
        resposta: d,
        tolerancia: 0.01,
        unidade: 'm',
        erros: [
          { valor: a * t * t, frase: 'Faltou dividir por 2. No MRUV partindo do repouso, Δx = a·t²/2.', motivo: 'esqueceu o 1/2 de a·t²/2' },
          { valor: a * t, frase: `Você calculou a velocidade final (v = a·t = ${a * t} m/s), não a distância percorrida.`, motivo: 'calculou a velocidade, não a distância' },
        ],
        resolucao: `Δx = v₀t + a·t²/2 = 0 + ${a}·${t}²/2 = ${a}·${t * t}/2 = ${f2(d)} m.`,
        dicas: ['Com aceleração constante use Δx = v₀·t + a·t²/2.', 'Parte do repouso: v₀ = 0.', `Δx = ${a}·${t}²/2.`],
        licao: 'MRUV: Δx = v₀t + at²/2; v = v₀ + at',
        dados: { tema: 'mruv' },
      }
    }
    if (caso === 1) {
      const v0 = escolher(rng, [10, 20, 30])
      const a = escolher(rng, [2, 4, 5])
      const d = (v0 * v0) / (2 * a)
      return {
        enunciado: `Um carro a ${v0} m/s freia com desaceleração constante de ${a} m/s². Que distância percorre até parar?`,
        resposta: d,
        tolerancia: 0.01,
        unidade: 'm',
        erros: [
          { valor: v0 / a, frase: `Você calculou o tempo de frenagem (v₀/a = ${f2(v0 / a)} s), não a distância.`, motivo: 'calculou o tempo, não a distância' },
          { valor: (v0 * v0) / a, frase: 'Faltou dividir por 2. Por Torricelli, 0 = v₀² − 2·a·Δx, então Δx = v₀²/(2a).', motivo: 'esqueceu o 2 em v²/(2a)' },
        ],
        resolucao: `Torricelli: v² = v₀² − 2aΔx, com v = 0: Δx = v₀²/(2a) = ${v0}²/(2·${a}) = ${f2(d)} m.`,
        dicas: ['Não é dado o tempo: use a equação de Torricelli.', 'v² = v₀² − 2·a·Δx, com v = 0 ao parar.', `Δx = ${v0}²/(2·${a}).`],
        licao: 'Torricelli: v² = v₀² + 2aΔx (a < 0 ao frear)',
        dados: { tema: 'mruv' },
      }
    }
    const v0 = sortear(rng, 2, 8)
    const a = sortear(rng, 1, 4)
    const t = sortear(rng, 2, 6)
    return {
      enunciado: `Um móvel tem velocidade ${v0} m/s e aceleração constante de ${a} m/s² (no mesmo sentido). Qual é a sua velocidade ${t} s depois, em m/s?`,
      resposta: v0 + a * t,
      tolerancia: 0.01,
      unidade: 'm/s',
      erros: [{ valor: v0 * t + (a * t * t) / 2, frase: 'Você calculou a distância percorrida (Δx), não a velocidade. A velocidade é v = v₀ + a·t.', motivo: 'calculou a distância, não a velocidade' }],
      resolucao: `v = v₀ + a·t = ${v0} + ${a}·${t} = ${v0 + a * t} m/s.`,
      dicas: ['A aceleração é quanto a velocidade varia por segundo.', 'v = v₀ + a·t.', `${v0} + ${a}·${t}.`],
      licao: 'v = v₀ + a·t',
      dados: { tema: 'mruv' },
    }
  }
  const tipo = sortear(rng, 0, 1)
  const t = sortear(rng, 3, 8)
  if (tipo === 0) {
    const vA = sortear(rng, 8, 15)
    const vB = sortear(rng, 5, 12)
    const D = (vA + vB) * t
    return {
      enunciado: `Dois ciclistas partem ao mesmo tempo, um em direção ao outro, de pontos separados por ${D} m. Suas velocidades constantes são ${vA} m/s e ${vB} m/s. Depois de quantos segundos eles se encontram?`,
      resposta: t,
      tolerancia: 0.01,
      unidade: 's',
      erros: [{ valor: vA === vB ? t + 1 : D / Math.abs(vA - vB), frase: 'Você subtraiu as velocidades. Quando se aproximam em sentidos opostos, a velocidade relativa é a soma das velocidades.', motivo: 'subtraiu as velocidades em sentidos opostos' }],
      resolucao: `Posições: xA = ${vA}·t e xB = ${D} − ${vB}·t. Igualando: ${vA}t = ${D} − ${vB}t, então (${vA} + ${vB})t = ${D} e t = ${t} s.`,
      dicas: ['Escreva a posição de cada ciclista em função do tempo.', 'No encontro, as posições são iguais.', `Em sentidos opostos a aproximação é de ${vA + vB} m a cada segundo.`],
      licao: 'encontro: igualar as funções horárias; sentidos opostos → velocidade relativa soma',
      dados: { tema: 'encontro' },
    }
  }
  const vA = sortear(rng, 14, 24)
  const vB = sortear(rng, 8, 13)
  const D = (vA - vB) * t
  return {
    enunciado: `Um carro a ${vA} m/s persegue outro, ${D} m à sua frente, que anda a ${vB} m/s no mesmo sentido (velocidades constantes). Em quantos segundos o primeiro alcança o segundo?`,
    resposta: t,
    tolerancia: 0.01,
    unidade: 's',
    erros: [{ valor: D / (vA + vB), frase: 'Você somou as velocidades. Quando os dois andam no mesmo sentido, a aproximação é a diferença das velocidades (velocidade relativa).', motivo: 'somou as velocidades no mesmo sentido' }],
    resolucao: `xA = ${vA}t e xB = ${D} + ${vB}t. Igualando: ${vA}t = ${D} + ${vB}t, então (${vA} − ${vB})t = ${D} e t = ${t} s.`,
    dicas: ['Escreva as posições dos dois carros em função do tempo.', 'O perseguidor ganha terreno à razão da diferença das velocidades.', `Ganha ${vA - vB} m por segundo.`],
    licao: 'mesmo sentido: velocidade relativa = diferença das velocidades',
    dados: { tema: 'encontro' },
  }
}

export { distanciaFrenagem, encontro, posicao, velocidade }
export type { Movimento, ErroTipico }
