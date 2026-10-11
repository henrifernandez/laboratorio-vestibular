import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { AGUA, MATERIAIS, calorTotal, equilibrio, etapasCalor, geloComAgua, leiGeral, paraCelsius, paraKelvin, type Etapa, type EstadoGas, type Transformacao } from './calculo'

const fn = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const bonito = (x: number, casas = 1) => Math.abs(x * 10 ** casas - Math.round(x * 10 ** casas)) < 1e-9

function limpar(erros: ErroTipico[], resposta: number, tolerancia: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!(e.valor > 0)) continue
    if (Math.abs(e.valor - resposta) <= 2 * tolerancia) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= 2 * tolerancia)) continue
    saida.push(e)
  }
  return saida
}

/* ------------------------------------------------------------------ quanto calor? */

export interface DadosCalor {
  m: number
  inicio: { fase: 'gelo' | 'agua'; T: number }
  fim: { fase: 'agua' | 'vapor'; T: number }
  etapas: Etapa[]
  kcal: boolean
}

const cDe = (fase: Etapa['fase']) => (fase === 'gelo' ? AGUA.cGelo : fase === 'agua' ? AGUA.cAgua : AGUA.cVapor)

const descInicio = (i: DadosCalor['inicio']) => (i.fase === 'gelo' ? `gelo a ${i.T} °C` : `água líquida a ${i.T} °C`)
const descFim = (f: DadosCalor['fim']) => (f.fase === 'agua' ? `água líquida a ${f.T} °C` : `vapor de água a ${f.T} °C`)

export function gerarCalor(rng: Rng, nivel: Nivel): InstanciaNum<DadosCalor> {
  const m = escolher(rng, nivel === 1 ? [50, 100, 200, 250, 500] : [20, 40, 50, 100, 200])
  let inicio: DadosCalor['inicio']
  let fim: DadosCalor['fim']
  let tipo1: 'agua' | 'fusao' | 'vap' | null = null
  if (nivel === 1) {
    tipo1 = escolher(rng, ['agua', 'fusao', 'vap'] as const)
    if (tipo1 === 'agua') {
      inicio = { fase: 'agua', T: escolher(rng, [10, 20, 25, 30]) }
      fim = { fase: 'agua', T: escolher(rng, [50, 60, 80, 100]) }
    } else if (tipo1 === 'fusao') {
      inicio = { fase: 'gelo', T: 0 }
      fim = { fase: 'agua', T: 0 }
    } else {
      inicio = { fase: 'agua', T: 100 }
      fim = { fase: 'vapor', T: 100 }
    }
  } else if (nivel === 2) {
    if (rng() < 0.5) {
      inicio = { fase: 'gelo', T: 0 }
      fim = { fase: 'agua', T: escolher(rng, [20, 30, 40, 50, 80]) }
    } else {
      inicio = { fase: 'agua', T: escolher(rng, [20, 40, 50, 60, 80]) }
      fim = { fase: 'vapor', T: 100 }
    }
  } else {
    inicio = { fase: 'gelo', T: escolher(rng, [-30, -20, -10, -5]) }
    fim = rng() < 0.5 ? { fase: 'agua', T: escolher(rng, [20, 40, 60, 100]) } : { fase: 'vapor', T: escolher(rng, [100, 110, 120, 140]) }
  }
  const etapas = etapasCalor(m, inicio, fim)
  const total = calorTotal(etapas)
  const kcal = nivel >= 2 && rng() < 0.4
  const un = kcal ? 1000 : 1
  const conv = (q: number) => q / un
  const resposta = conv(total)
  const tolerancia = kcal ? 0.01 : 1

  const usa = (f: Etapa['fase']) => etapas.some((e) => e.fase === f)
  const constantes = [
    usa('gelo') ? 'c do gelo = 0,5 cal/g·°C' : null,
    usa('agua') ? 'c da água = 1 cal/g·°C' : null,
    usa('vapor') ? 'c do vapor = 0,5 cal/g·°C' : null,
    usa('fusao') ? 'calor latente de fusão = 80 cal/g' : null,
    usa('vaporizacao') ? 'calor latente de vaporização = 540 cal/g' : null,
  ].filter(Boolean)
  const enunciado = `Quantas ${kcal ? 'quilocalorias (kcal)' : 'calorias (cal)'} são necessárias para transformar ${m} g de ${descInicio(inicio)} em ${descFim(fim)}? Dados: ${constantes.join('; ')}.`

  const erros: ErroTipico[] = []
  if (tipo1 === 'agua') {
    erros.push({ valor: conv(m * (fim.T as number)), frase: `Você usou a temperatura final (${fim.T} °C) no lugar da variação de temperatura (${fim.T} − ${inicio.T} = ${fim.T - inicio.T} °C). Em Q = m·c·ΔT, o ΔT é final menos inicial.`, motivo: 'usou T final em vez de ΔT' })
  } else if (tipo1 === 'fusao') {
    erros.push({ valor: conv(m * AGUA.LV), frase: 'Você usou o calor latente de vaporização (540 cal/g). Aqui o gelo derrete: o certo é o de fusão, 80 cal/g.', motivo: 'trocou os calores latentes' })
    erros.push({ valor: conv(m * AGUA.LF * 1.5), frase: 'Em uma mudança de fase não há variação de temperatura: a conta é Q = m·L, sem multiplicar por ΔT ou por outro calor específico.', motivo: 'misturou Q = m·L com Q = m·c·ΔT' })
  } else if (tipo1 === 'vap') {
    erros.push({ valor: conv(m * AGUA.LF), frase: 'Você usou o calor latente de fusão (80 cal/g). Aqui a água vira vapor: o certo é o de vaporização, 540 cal/g.', motivo: 'trocou os calores latentes' })
  }
  if (etapas.length >= 2) {
    for (const e of etapas) {
      erros.push({ valor: conv(total - e.q), frase: `Faltou a etapa “${e.nome}” (${fn(e.q)} cal). O calor total é a soma de todas as etapas, incluindo as mudanças de fase.`, motivo: e.formula === 'mL' ? 'esqueceu o calor latente' : 'esqueceu uma etapa de aquecimento' })
    }
  }
  const gelo = etapas.find((e) => e.fase === 'gelo')
  if (gelo) erros.push({ valor: conv(total - gelo.q + m * AGUA.cAgua * (0 - inicio.T)), frase: 'Você usou o calor específico da água (1 cal/g·°C) para o gelo. O do gelo é 0,5 cal/g·°C, metade.', motivo: 'usou o c da água para o gelo' })
  const vapor = etapas.find((e) => e.fase === 'vapor')
  if (vapor) erros.push({ valor: conv(total - vapor.q + m * AGUA.cAgua * (fim.T - 100)), frase: 'Você usou o calor específico da água para o vapor. O do vapor é 0,5 cal/g·°C.', motivo: 'usou o c da água para o vapor' })
  if (kcal) erros.push({ valor: total, frase: `${fn(total)} é o valor em calorias. A pergunta pede kcal: divida por 1000.`, motivo: 'não converteu cal para kcal' })
  else if (etapas.length >= 2 || total >= 1000) erros.push({ valor: total / 1000, frase: `${fn(total / 1000)} está em kcal. A pergunta pede calorias: multiplique por 1000.`, motivo: 'converteu a unidade sem precisar' })

  const linhas = etapas.map((e) => {
    if (e.formula === 'mL') return `${e.nome}: Q = m·L = ${m}·${e.fase === 'fusao' ? AGUA.LF : AGUA.LV} = ${fn(e.q)} cal`
    const c = cDe(e.fase)
    return `${e.nome}: Q = m·c·ΔT = ${m}·${String(c).replace('.', ',')}·${fn(e.q / (m * c))} = ${fn(e.q)} cal`
  })
  return {
    enunciado,
    resposta,
    tolerancia,
    unidade: kcal ? 'kcal' : 'cal',
    erros: limpar(erros, resposta, tolerancia),
    resolucao: `${linhas.join('. ')}. Soma: ${fn(total)} cal${kcal ? ` = ${fn(total / 1000)} kcal` : ''}.`,
    dicas: [
      'Trace mentalmente a curva de aquecimento: onde a temperatura sobe e onde há mudança de fase?',
      'Onde a temperatura varia, use Q = m·c·ΔT (com o c da fase certa). Nas mudanças de fase, use Q = m·L.',
      'Some o calor de todas as etapas, na ordem em que acontecem.',
    ],
    licao: 'calor total = soma das etapas: m·c·ΔT onde a temperatura varia e m·L nas mudanças de fase',
    dados: { m, inicio, fim, etapas, kcal },
  }
}

/* ------------------------------------------------------------------ temperatura de equilíbrio */

export interface CorpoVisual {
  rotulo: string
  m: number
  T: number
  gelo?: boolean
}

export interface DadosEquilibrio {
  corpos: CorpoVisual[]
  pede: 'T' | 'gelo'
}

const MASSAS_AGUA = [100, 150, 200, 250, 300, 400, 500]

function equilibrioAguaAgua(rng: Rng): InstanciaNum<DadosEquilibrio> {
  const lista: { m1: number; T1: number; m2: number; T2: number }[] = []
  for (const m1 of MASSAS_AGUA)
    for (const m2 of MASSAS_AGUA)
      for (const T1 of [60, 70, 80, 90, 100])
        for (const T2 of [10, 15, 20, 25, 30]) {
          if (m1 === m2) continue
          if (bonito(equilibrio([{ m: m1, c: 1, T: T1 }, { m: m2, c: 1, T: T2 }]))) lista.push({ m1, T1, m2, T2 })
        }
  const { m1, T1, m2, T2 } = escolher(rng, lista)
  const Te = equilibrio([{ m: m1, c: 1, T: T1 }, { m: m2, c: 1, T: T2 }])
  const erros: ErroTipico[] = [
    { valor: (T1 + T2) / 2, frase: `Você fez a média simples das temperaturas. Como as massas são diferentes (${m1} g e ${m2} g), a mais massiva pesa mais: a média deve ser ponderada pelas massas.`, motivo: 'fez média simples' },
    { valor: (m1 * T2 + m2 * T1) / (m1 + m2), frase: 'Você trocou os pesos: a massa quente deve multiplicar a temperatura quente. A temperatura final fica mais perto da temperatura da massa maior.', motivo: 'trocou os pesos da média' },
  ]
  return {
    enunciado: `Em um recipiente isolado, misturam-se ${m1} g de água a ${T1} °C com ${m2} g de água a ${T2} °C. Qual é a temperatura de equilíbrio, em °C?`,
    resposta: Te,
    tolerancia: 0.05,
    unidade: '°C',
    erros: limpar(erros, Te, 0.05),
    resolucao: `Calor cedido pela quente + calor recebido pela fria = 0: ${m1}·1·(T − ${T1}) + ${m2}·1·(T − ${T2}) = 0. Então T = (${m1}·${T1} + ${m2}·${T2})/(${m1} + ${m2}) = ${fn(m1 * T1 + m2 * T2)}/${m1 + m2} = ${fn(Te)} °C.`,
    dicas: ['O que um corpo perde, o outro ganha: Q₁ + Q₂ = 0.', 'Escreva Q = m·c·(T − T_inicial) para cada um e some.', 'A temperatura final fica entre as duas, mais perto da massa maior.'],
    licao: 'equilíbrio: soma dos calores trocados = 0; a média é ponderada por m·c',
    dados: { corpos: [{ rotulo: 'quente', m: m1, T: T1 }, { rotulo: 'fria', m: m2, T: T2 }], pede: 'T' },
  }
}

function equilibrioMetal(rng: Rng): InstanciaNum<DadosEquilibrio> {
  const lista: { mat: 'aluminio' | 'ferro'; mm: number; Tm: number; ma: number; Ta: number }[] = []
  for (const mat of ['aluminio', 'ferro'] as const)
    for (const mm of [100, 200, 250, 300, 400, 500])
      for (const Tm of [100, 150, 200, 250])
        for (const ma of [100, 200, 250, 500])
          for (const Ta of [20, 25, 30]) {
            const Te = equilibrio([{ m: mm, c: MATERIAIS[mat]!.c, T: Tm }, { m: ma, c: 1, T: Ta }])
            if (bonito(Te) && Te <= 95) lista.push({ mat, mm, Tm, ma, Ta })
          }
  const { mat, mm, Tm, ma, Ta } = escolher(rng, lista)
  const c = MATERIAIS[mat]!.c
  const Te = equilibrio([{ m: mm, c, T: Tm }, { m: ma, c: 1, T: Ta }])
  const erros: ErroTipico[] = [
    { valor: equilibrio([{ m: mm, c: 1, T: Tm }, { m: ma, c: 1, T: Ta }]), frase: `Você tratou o ${MATERIAIS[mat]!.nome.toLowerCase()} como se fosse água (c = 1). O calor específico dele é ${String(c).replace('.', ',')} cal/g·°C: ele cede muito menos calor por grau.`, motivo: 'ignorou o calor específico do metal' },
    { valor: (Tm + Ta) / 2, frase: 'Você fez a média simples das temperaturas. O peso de cada corpo na média é a sua capacidade térmica, m·c.', motivo: 'fez média simples' },
    { valor: (mm * c * Tm + ma * Ta) / (mm + ma), frase: 'Você dividiu pela soma das massas. O denominador deve ser a soma das capacidades térmicas (m·c) de cada corpo.', motivo: 'dividiu pela soma das massas' },
  ]
  return {
    enunciado: `Um bloco de ${MATERIAIS[mat]!.nome.toLowerCase()} de ${mm} g (c = ${String(c).replace('.', ',')} cal/g·°C) a ${Tm} °C é colocado em ${ma} g de água (c = 1 cal/g·°C) a ${Ta} °C, em um recipiente isolado. Qual é a temperatura de equilíbrio, em °C?`,
    resposta: Te,
    tolerancia: 0.05,
    unidade: '°C',
    erros: limpar(erros, Te, 0.05),
    resolucao: `${mm}·${String(c).replace('.', ',')}·(T − ${Tm}) + ${ma}·1·(T − ${Ta}) = 0. Capacidades térmicas: ${fn(mm * c)} e ${ma} cal/°C. T = (${fn(mm * c)}·${Tm} + ${ma}·${Ta})/(${fn(mm * c)} + ${ma}) = ${fn(mm * c * Tm + ma * Ta)}/${fn(mm * c + ma)} = ${fn(Te)} °C.`,
    dicas: ['Q = m·c·ΔT para cada corpo, e a soma dos calores é zero.', 'O que importa de cada corpo é a capacidade térmica m·c, não só a massa.', 'A água, com c grande, “segura” a temperatura: o equilíbrio fica perto dela.'],
    licao: 'equilíbrio: T = Σ(m·c·T)/Σ(m·c)',
    dados: { corpos: [{ rotulo: MATERIAIS[mat]!.nome.toLowerCase(), m: mm, T: Tm }, { rotulo: 'água', m: ma, T: Ta }], pede: 'T' },
  }
}

function equilibrioGelo(rng: Rng): InstanciaNum<DadosEquilibrio> {
  const lista: { mg: number; Tg: number; ma: number; Ta: number; sit: 'derrete-tudo' | 'derrete-parte' }[] = []
  for (const mg of [50, 100, 200, 250, 300, 400, 500])
    for (const Tg of [0, -10, -20])
      for (const ma of [100, 200, 250, 300, 400, 500, 600])
        for (const Ta of [20, 30, 40, 50, 60, 70, 80]) {
          const r = geloComAgua({ mg, Tg, ma, Ta })
          if (r.situacao === 'derrete-tudo' && bonito(r.T)) lista.push({ mg, Tg, ma, Ta, sit: 'derrete-tudo' })
          if (r.situacao === 'derrete-parte' && bonito(r.gelo, 0) && r.gelo >= 10) lista.push({ mg, Tg, ma, Ta, sit: 'derrete-parte' })
        }
  const alvoSit = rng() < 0.5 ? 'derrete-tudo' : 'derrete-parte'
  const { mg, Tg, ma, Ta, sit } = escolher(rng, lista.filter((x) => x.sit === alvoSit))
  const r = geloComAgua({ mg, Tg, ma, Ta })
  const cc = { gelo: `${mg} g de gelo a ${Tg} °C`, agua: `${ma} g de água líquida a ${Ta} °C` }
  const corpos: CorpoVisual[] = [{ rotulo: 'gelo', m: mg, T: Tg, gelo: true }, { rotulo: 'água', m: ma, T: Ta }]
  const constantes = `c do gelo = 0,5 cal/g·°C; c da água = 1 cal/g·°C; calor latente de fusão = 80 cal/g`
  const aquecerGelo = mg * AGUA.cGelo * (0 - Tg)
  const explicacaoBase = `A água quente cede até chegar a 0 °C: ${ma}·1·${Ta} = ${fn(ma * Ta)} cal. O gelo precisa de ${fn(aquecerGelo)} cal para chegar a 0 °C${Tg < 0 ? ` (${mg}·0,5·${-Tg})` : ' (já está a 0 °C)'} e de ${fn(mg * AGUA.LF)} cal para fundir tudo (${mg}·80).`
  if (sit === 'derrete-tudo') {
    const erros: ErroTipico[] = [
      { valor: (ma * Ta + mg * Tg) / (ma + mg), frase: 'Você tratou o gelo como água e esqueceu do calor latente de fusão: derreter o gelo também consome calor (80 cal/g), e isso esfria o conjunto.', motivo: 'ignorou o calor de fusão' },
      { valor: (ma * Ta) / (ma + mg), frase: 'Você considerou o gelo a 0 °C como se a temperatura dele contribuísse com algo, e ignorou o calor da fusão. Depois de derreter, a água do gelo ainda precisa ser aquecida de 0 °C até a temperatura final.', motivo: 'ignorou o calor de fusão' },
    ]
    return {
      enunciado: `Em um recipiente isolado, misturam-se ${cc.gelo} e ${cc.agua}. Qual é a temperatura final, em °C? Dados: ${constantes}.`,
      resposta: r.T,
      tolerancia: 0.05,
      unidade: '°C',
      erros: limpar(erros, r.T, 0.05),
      resolucao: `${explicacaoBase} Sobram ${fn(ma * Ta - aquecerGelo - mg * AGUA.LF)} cal, que aquecem os ${ma + mg} g de água de 0 °C até T: T = ${fn(ma * Ta - aquecerGelo - mg * AGUA.LF)}/${ma + mg} = ${fn(r.T)} °C.`,
      dicas: ['Primeiro responda: dá para derreter todo o gelo com o calor que a água quente pode ceder?', 'O gelo gasta calor para esquentar até 0 °C e depois para fundir (m·L).', 'O que sobrar aquece toda a água (a original e a do gelo derretido).'],
      licao: 'com gelo: aquecer até 0 °C, fundir (m·L) e só então a temperatura sobe',
      dados: { corpos, pede: 'T' },
    }
  }
  const erros: ErroTipico[] = [
    { valor: mg - r.gelo, frase: `${fn(mg - r.gelo)} g é a massa que derreteu, e a pergunta pede a que sobrou: ${mg} − ${fn(mg - r.gelo)} = ${fn(r.gelo)} g.`, motivo: 'deu a massa derretida, não a restante' },
    { valor: mg - (ma * Ta - aquecerGelo) / AGUA.LV, frase: 'Você usou o calor latente de vaporização (540 cal/g). Para fundir o gelo o certo é 80 cal/g.', motivo: 'trocou os calores latentes' },
    { valor: mg - (ma * Ta) / AGUA.LF, frase: Tg < 0 ? 'Você esqueceu que o gelo, antes de derreter, precisa esquentar até 0 °C, e isso consome parte do calor da água.' : 'Confira a conta de calor cedido: ele é m·c·ΔT da água até 0 °C, e o gelo derrete m·80 por grama.', motivo: 'conta de calor incompleta' },
  ]
  return {
    enunciado: `Em um recipiente isolado, misturam-se ${cc.gelo} e ${cc.agua}. No equilíbrio, qual é a massa de gelo que ainda resta, em gramas? Dados: ${constantes}.`,
    resposta: r.gelo,
    tolerancia: 0.5,
    unidade: 'g',
    erros: limpar(erros, r.gelo, 0.5),
    resolucao: `${explicacaoBase} Como ${fn(ma * Ta)} é menor que ${fn(aquecerGelo + mg * AGUA.LF)}, nem todo o gelo derrete e o equilíbrio ocorre a 0 °C. O calor disponível para fundir é ${fn(ma * Ta)} − ${fn(aquecerGelo)} = ${fn(ma * Ta - aquecerGelo)} cal, que derrete ${fn(ma * Ta - aquecerGelo)}/80 = ${fn(mg - r.gelo)} g. Restam ${mg} − ${fn(mg - r.gelo)} = ${fn(r.gelo)} g de gelo.`,
    dicas: ['Dá para derreter todo o gelo? Compare o calor que a água cede (até 0 °C) com o que o gelo precisa.', 'Se não dá, o equilíbrio fica em 0 °C, com água e gelo juntos.', 'Calor que sobra para fundir ÷ 80 = massa derretida. A pergunta é quanto resta.'],
    licao: 'se o calor cedido não basta para fundir tudo, a temperatura fica em 0 °C e resta gelo',
    dados: { corpos, pede: 'gelo' },
  }
}

export function gerarEquilibrio(rng: Rng, nivel: Nivel): InstanciaNum<DadosEquilibrio> {
  if (nivel === 1) return equilibrioAguaAgua(rng)
  if (nivel === 2) return equilibrioMetal(rng)
  return equilibrioGelo(rng)
}

/* ------------------------------------------------------------------ gráfico de aquecimento */

export type TipoCurva = 'correta' | 'semPatamar' | 'inclinacoesIguais' | 'patamarErrado' | 'patamaresIguais' | 'massaIgnorada' | 'soPatamares' | 'patamarTrocado'

export interface Ponto {
  x: number
  y: number
}

export interface DadosCurva {
  /** curva de referência (em verde no enunciado do nível 3) */
  referencia?: Ponto[]
  opcoes: Record<string, { tipo: TipoCurva; pontos: Ponto[] }>
  xmax: number
  ymin: number
  ymax: number
  vapor: boolean
}

interface OpcoesCurva {
  cGelo?: number
  cVapor?: number
  LF?: number
  LV?: number
}

/** Vértices (calor por grama, T) da curva de aquecimento; a escala horizontal é o calor dividido pela massa. */
function vertices(m: number, Tini: number, Tfim: number, o: OpcoesCurva = {}): Ponto[] {
  const cG = o.cGelo ?? AGUA.cGelo
  const cV = o.cVapor ?? AGUA.cVapor
  const LF = o.LF ?? AGUA.LF
  const LV = o.LV ?? AGUA.LV
  const pts: Ponto[] = [{ x: 0, y: Tini }]
  let q = 0
  const vai = (dq: number, y: number) => {
    q += dq
    pts.push({ x: q / m, y })
  }
  vai(m * cG * (0 - Tini), 0)
  vai(m * LF, 0)
  if (Tfim <= 100) {
    vai(m * AGUA.cAgua * Tfim, Tfim)
  } else {
    vai(m * AGUA.cAgua * 100, 100)
    vai(m * LV, 100)
    vai(m * cV * (Tfim - 100), Tfim)
  }
  return pts
}

const reescalar = (pts: Ponto[], xmax: number): Ponto[] => {
  const k = xmax / (pts[pts.length - 1] as Ponto).x
  return pts.map((p) => ({ x: p.x * k, y: p.y }))
}

export function gerarCurva(rng: Rng, nivel: Nivel): InstanciaMulti<DadosCurva> {
  const Tini = escolher(rng, [-30, -20, -10])
  const vapor = nivel >= 2
  const Tfim = vapor ? escolher(rng, [120, 130, 140]) : escolher(rng, [40, 60, 80])
  const m = 100
  const correta = vertices(m, Tini, Tfim)
  const xmax = correta[correta.length - 1]!.x
  const alvo = (pts: Ponto[]) => pts.map((p) => ({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 }))

  const candidatos: { tipo: TipoCurva; pontos: Ponto[]; porque: string; motivo: string }[] = []
  let referencia: Ponto[] | undefined
  let enunciado: string

  if (nivel < 3) {
    enunciado = vapor
      ? `Uma amostra de gelo a ${Tini} °C recebe calor de uma fonte e chega a vapor a ${Tfim} °C. Qual gráfico representa a temperatura em função do calor recebido?`
      : `Uma amostra de gelo a ${Tini} °C recebe calor de uma fonte até virar água a ${Tfim} °C. Qual gráfico representa a temperatura em função do calor recebido?`
    // sem patamar: segue direto
    const semPatamar: Ponto[] = [correta[0]!, ...correta.filter((_, i) => i === correta.length - 1)]
    candidatos.push({ tipo: 'semPatamar', pontos: semPatamar, porque: 'Esse gráfico é uma reta contínua, sem patamares. Durante a fusão (e a vaporização) o calor recebido não aumenta a temperatura: ele rearranja as moléculas, e a curva fica horizontal.', motivo: 'esqueceu os patamares das mudanças de fase' })
    // inclinações iguais: gelo e vapor com o mesmo c da água
    candidatos.push({ tipo: 'inclinacoesIguais', pontos: reescalar(vertices(m, Tini, Tfim, { cGelo: 1, cVapor: 1 }), xmax), porque: 'Nesse gráfico os trechos inclinados têm a mesma inclinação, como se gelo, água e vapor esquentassem do mesmo jeito. Mas o calor específico do gelo (0,5) é a metade do da água (1): o gelo esquenta mais depressa, e a reta dele é a mais inclinada.', motivo: 'ignorou que o gelo esquenta mais depressa que a água' })
    // patamar no lugar errado
    const errado = correta.map((p) => ({ ...p }))
    if (vapor) {
      errado[1]!.y = 20
      errado[2]!.y = 20
    } else {
      errado[1]!.y = 10
      errado[2]!.y = 10
    }
    candidatos.push({ tipo: 'patamarErrado', pontos: errado, porque: 'O patamar da fusão acontece a 0 °C, a temperatura de fusão da água, e não em outro valor. Confira em que temperatura o gráfico fica horizontal.', motivo: 'patamar de fusão fora de 0 °C' })
    if (vapor) {
      // patamares de mesmo comprimento
      const p = correta.map((q) => ({ ...q }))
      const fus = correta[2]!.x - correta[1]!.x
      const vap = correta[4]!.x - correta[3]!.x
      const nova = (vap - fus) // encurta vaporização
      p[4]!.x -= nova
      p[5]!.x -= nova
      candidatos.push({ tipo: 'patamaresIguais', pontos: p, porque: 'Aqui os dois patamares têm o mesmo comprimento. Mas vaporizar exige muito mais calor que fundir (540 cal/g contra 80 cal/g): o patamar da vaporização é cerca de sete vezes mais comprido que o da fusão.', motivo: 'patamares com o mesmo comprimento' })
    } else {
      // patamar com comprimento maior que o trecho da água (proporção errada)
      const p = correta.map((q) => ({ ...q }))
      const extra = (correta[3]!.x - correta[2]!.x) * 0.9
      p[2]!.x += extra
      p[3]!.x += extra
      candidatos.push({ tipo: 'patamaresIguais', pontos: p, porque: `Esse gráfico exagera o patamar da fusão. Fundir 1 g de gelo consome 80 cal, e aquecer 1 g de água de 0 a ${Tfim} °C consome ${Tfim} cal: o patamar é só ${fn(80 / Tfim)} vez${80 / Tfim > 1.5 ? 'es' : ''} o comprimento do trecho da água, e aqui ele aparece bem maior.`, motivo: 'proporção errada entre patamar e aquecimento' })
    }
    if (vapor) {
      candidatos.push({ tipo: 'patamarTrocado', pontos: reescalar(vertices(m, Tini, Tfim, { LF: AGUA.LV, LV: AGUA.LF }), xmax), porque: 'Os comprimentos dos patamares estão trocados. Vaporizar (540 cal/g) exige muito mais calor que fundir (80 cal/g): o patamar da vaporização, em 100 °C, é o mais comprido.', motivo: 'trocou os comprimentos dos patamares' })
    }
  } else {
    // nível 3: massa dobrada, mesma fonte → eixo do tempo
    const base = vertices(m, Tini, Tfim)
    referencia = alvo(base)
    enunciado = `O gráfico verde mostra a temperatura de ${m} g de gelo (inicialmente a ${Tini} °C) em função do tempo, aquecido por uma fonte de potência constante. Qual gráfico (em laranja) pode representar o aquecimento de ${2 * m} g do mesmo material, com a mesma fonte?`
    const dobra = base.map((p) => ({ x: p.x * 2, y: p.y }))
    candidatos.push({ tipo: 'massaIgnorada', pontos: base.map((p) => ({ ...p, y: p.y })), porque: 'Esse gráfico é igual ao de referência: a massa não teria efeito. Mas com o dobro da massa, a mesma fonte leva o dobro do tempo para fornecer o calor necessário (Q = m·c·ΔT e Q = m·L dobram).', motivo: 'achou que a massa não altera o tempo' })
    const soPat: Ponto[] = [{ x: 0, y: Tini }]
    for (let i = 1; i < base.length; i++) {
      const dxBase = base[i]!.x - base[i - 1]!.x
      const parado = base[i]!.y === base[i - 1]!.y
      soPat.push({ x: soPat[i - 1]!.x + (parado ? dxBase * 2 : dxBase), y: base[i]!.y })
    }
    candidatos.push({ tipo: 'soPatamares', pontos: soPat, porque: 'Aqui só os patamares ficaram mais longos. Com o dobro da massa, TODO trecho precisa do dobro de calor, inclusive os trechos inclinados: eles também ficam duas vezes mais longos no tempo (e, por isso, menos inclinados).', motivo: 'dobrou só os patamares' })
    const desloc = dobra.map((p) => ({ x: p.x, y: p.y === 0 ? 10 : p.y === 100 ? 90 : p.y }))
    candidatos.push({ tipo: 'patamarErrado', pontos: desloc, porque: 'As temperaturas de mudança de fase não dependem da massa: o patamar continua em 0 °C (fusão) e em 100 °C (vaporização).', motivo: 'achou que a massa muda a temperatura de fusão' })
    candidatos.push({ tipo: 'correta', pontos: dobra, porque: 'Isso! Com o dobro da massa e a mesma fonte, o gráfico inteiro se estica ao dobro no eixo do tempo: os patamares (0 °C e 100 °C) ficam nas mesmas temperaturas, mas o aquecimento leva o dobro do tempo e as retas ficam menos inclinadas.', motivo: '' })
    // curva correta é a última, as outras já estão
    candidatos.unshift(candidatos.pop() as (typeof candidatos)[number])
  }
  if (nivel < 3) candidatos.unshift({ tipo: 'correta', pontos: correta, porque: 'Isso! Três trechos inclinados separados por patamares: o gelo esquenta (mais inclinado, c menor), a fusão ocorre a 0 °C sem variar a temperatura, a água esquenta' + (vapor ? ', a vaporização ocorre a 100 °C (patamar bem mais longo, L maior) e o vapor esquenta.' : '.'), motivo: '' })

  // escolhe a correta + 3 erradas diferentes
  const certa = candidatos[0]!
  const erradas = embaralhar(rng, candidatos.slice(1)).slice(0, 3)
  const lista = embaralhar(rng, [certa, ...erradas])
  const ids = ['A', 'B', 'C', 'D']
  const opcoes: DadosCurva['opcoes'] = {}
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let idCerta = 'A'
  lista.forEach((c, i) => {
    const id = ids[i] as string
    opcoes[id] = { tipo: c.tipo, pontos: alvo(c.pontos) }
    porque[id] = c.porque
    if (c === certa) idCerta = id
    else motivo[id] = c.motivo
  })
  const ymax = Math.max(Tfim, 100) + 10
  const xlim = nivel === 3 ? xmax * 2 : xmax
  return {
    enunciado,
    opcoes: ids.map((id) => ({ id, rotulo: `Gráfico ${id}` })),
    certa: idCerta,
    porque,
    motivo,
    resolucao:
      nivel === 3
        ? 'Com o dobro da massa, cada trecho precisa do dobro de calor. Como a potência da fonte é constante, cada trecho dura o dobro do tempo: o gráfico inteiro se estica por um fator 2 na horizontal. As temperaturas dos patamares (0 °C e 100 °C) não mudam, e as retas inclinadas ficam com metade da inclinação.'
        : `A curva tem ${vapor ? 'cinco' : 'três'} trechos: aquecimento do gelo (inclinado, c = 0,5), fusão a 0 °C (patamar de comprimento m·80), aquecimento da água (c = 1, menos inclinado)${vapor ? ', vaporização a 100 °C (patamar de comprimento m·540, bem mais longo) e aquecimento do vapor (c = 0,5)' : ''}. Nos patamares, o calor recebido muda o estado e não a temperatura.`,
    dicas: nivel === 3
      ? ['Q = m·c·ΔT e Q = m·L são proporcionais à massa.', 'Com a fonte de potência constante, tempo = Q/potência: dobrar Q dobra o tempo.', 'As temperaturas de fusão e de ebulição não dependem da massa.']
      : ['Mudança de estado acontece com temperatura constante: patamar.', 'Quanto menor o calor específico, mais depressa a temperatura sobe (reta mais inclinada).', 'Vaporizar exige bem mais calor que fundir: compare 540 cal/g com 80 cal/g.'],
    licao: 'patamar = mudança de fase (T constante); inclinação depende de c; comprimento do patamar depende de m·L',
    dados: { referencia, opcoes, xmax: xlim, ymin: Tini - 10, ymax, vapor },
  }
}

/* ------------------------------------------------------------------ gás no pistão */

export interface DadosGas {
  tipo: Transformacao | 'geral'
  ini: EstadoGas
  fim: EstadoGas
  /** o que a pessoa descobre */
  pede: 'p' | 'V' | 'T'
}

const fK = (T: number) => `${fn(T)} K`

export function gerarGas(rng: Rng, nivel: Nivel): InstanciaNum<DadosGas> {
  if (nivel === 1) {
    // isotérmica (Boyle): p1·V1 = p2·V2
    const lista: { p1: number; V1: number; V2: number }[] = []
    for (const p1 of [1, 2, 3, 4, 5, 6])
      for (const V1 of [1, 2, 3, 4, 6, 8, 12])
        for (const V2 of [1, 2, 3, 4, 6, 8, 12]) {
          if (V1 === V2) continue
          if (bonito((p1 * V1) / V2)) lista.push({ p1, V1, V2 })
        }
    const { p1, V1, V2 } = escolher(rng, lista)
    const p2 = (p1 * V1) / V2
    const pedeP = rng() < 0.6
    const T = escolher(rng, [27, 127, 300])
    const ini: EstadoGas = { p: p1, V: V1, T: paraKelvin(T) }
    const fim: EstadoGas = { p: p2, V: V2, T: paraKelvin(T) }
    const resposta = pedeP ? p2 : V2
    const erros: ErroTipico[] = pedeP
      ? [
          { valor: (p1 * V2) / V1, frase: 'Você usou proporção direta (p aumenta com V). Na transformação isotérmica a proporção é inversa: p·V é constante. Se o volume aumenta, a pressão diminui.', motivo: 'usou proporção direta em vez de inversa' },
          { valor: p1 * V1 * V2, frase: 'Você multiplicou tudo. A lei de Boyle iguala p₁·V₁ = p₂·V₂, então p₂ = p₁·V₁/V₂.', motivo: 'multiplicou em vez de igualar p·V' },
          { valor: p1 + (V1 - V2), frase: 'Você somou e subtraiu valores. A relação entre p e V é um produto constante: p₁·V₁ = p₂·V₂.', motivo: 'usou relação aditiva' },
        ]
      : [
          { valor: (V1 * p2) / p1, frase: 'Você usou proporção direta. Na isotérmica, p·V é constante: V₂ = p₁·V₁/p₂.', motivo: 'usou proporção direta em vez de inversa' },
          { valor: p1 * V1 * p2, frase: 'Você multiplicou tudo. A lei de Boyle iguala p₁·V₁ = p₂·V₂.', motivo: 'multiplicou em vez de igualar p·V' },
        ]
    return {
      enunciado: pedeP
        ? `Um gás ideal está num cilindro com êmbolo, a ${T} °C, com pressão ${p1} atm e volume ${V1} L. O êmbolo é movido lentamente, sem variar a temperatura, até o volume ${V2} L. Qual é a pressão final, em atm?`
        : `Um gás ideal está num cilindro com êmbolo, a ${T} °C, com pressão ${p1} atm e volume ${V1} L. O êmbolo é movido lentamente, sem variar a temperatura, até a pressão ${fn(p2)} atm. Qual é o volume final, em litros?`,
      resposta,
      tolerancia: 0.01,
      unidade: pedeP ? 'atm' : 'L',
      erros: limpar(erros, resposta, 0.01),
      resolucao: `Temperatura constante: p₁·V₁ = p₂·V₂ (lei de Boyle). ${p1}·${V1} = ${pedeP ? `p₂·${V2}` : `${fn(p2)}·V₂`}, então ${pedeP ? `p₂ = ${fn(p1 * V1)}/${V2} = ${fn(p2)} atm` : `V₂ = ${fn(p1 * V1)}/${fn(p2)} = ${fn(V2)} L`}.`,
      dicas: ['Transformação isotérmica: a temperatura não muda.', 'Então p·V fica constante: se o volume dobra, a pressão cai pela metade.', 'Monte p₁·V₁ = p₂·V₂ e isole o que falta.'],
      licao: 'isotérmica: p·V = constante (proporção inversa)',
      dados: { tipo: 'isotermica', ini, fim, pede: pedeP ? 'p' : 'V' },
    }
  }
  if (nivel === 2) {
    // isobárica ou isocórica com temperaturas em °C: converter para K
    const isobarica = rng() < 0.5
    const lista: { g1: number; g2: number; x1: number }[] = []
    for (const T1c of [27, 127, 7, -3, 57, 87])
      for (const T2c of [127, 227, 327, -73, 177, 27, 57, 77])
        for (const x1 of [2, 3, 4, 5, 6, 8]) {
          if (T1c === T2c) continue
          const x2 = (x1 * paraKelvin(T2c)) / paraKelvin(T1c)
          if (bonito(x2) && x2 > 0) lista.push({ g1: T1c, g2: T2c, x1 })
        }
    const { g1, g2, x1 } = escolher(rng, lista)
    const T1 = paraKelvin(g1)
    const T2 = paraKelvin(g2)
    const x2 = (x1 * T2) / T1
    const pedeT = rng() < 0.4
    const nome = isobarica ? 'o volume' : 'a pressão'
    const un = isobarica ? 'L' : 'atm'
    const proc = isobarica ? 'a pressão constante (isobárica)' : 'com o volume constante (isocórica)'
    const resposta = pedeT ? g2 : x2
    const erros: ErroTipico[] = pedeT
      ? [
          { valor: T2, frase: `${T2} é a temperatura em kelvin. A pergunta pede em °C: subtraia 273.`, motivo: 'esqueceu de voltar para °C' },
          { valor: (x2 * g1) / x1, frase: 'Você usou as temperaturas em °C na proporção. As leis dos gases exigem temperatura absoluta (K): some 273 antes de calcular.', motivo: 'usou °C na lei dos gases' },
        ]
      : [
          { valor: (x1 * g2) / g1 > 0 ? (x1 * g2) / g1 : x1, frase: 'Você usou as temperaturas em °C. Nas leis dos gases a temperatura deve estar em kelvin (K = °C + 273).', motivo: 'usou °C na lei dos gases' },
          { valor: (x1 * T1) / T2, frase: `Você inverteu a proporção. ${isobarica ? 'À pressão constante, V/T é constante: o volume cresce com a temperatura.' : 'Com volume constante, p/T é constante: a pressão cresce com a temperatura.'}`, motivo: 'inverteu a proporção' },
          { valor: x1 + (g2 - g1), frase: 'Você somou a variação de temperatura ao valor inicial. A relação é de proporção (razão entre as temperaturas em K), e não de soma.', motivo: 'usou relação aditiva' },
        ]
    const ini: EstadoGas = isobarica ? { p: 1, V: x1, T: T1 } : { p: x1, V: 1, T: T1 }
    const fim: EstadoGas = isobarica ? { p: 1, V: x2, T: T2 } : { p: x2, V: 1, T: T2 }
    return {
      enunciado: pedeT
        ? `Um gás ideal ocupa ${isobarica ? `${x1} L` : `um volume fixo, com pressão ${x1} atm`}, a ${g1} °C. Ele é aquecido ${proc} até ${isobarica ? `ocupar ${fn(x2)} L` : `a pressão ${fn(x2)} atm`}. Qual é a temperatura final, em °C?`
        : `Um gás ideal ${isobarica ? `ocupa ${x1} L` : `está com pressão ${x1} atm`}, a ${g1} °C. Ele é levado ${proc} até ${g2} °C. Qual é ${nome} final, em ${isobarica ? 'litros' : 'atm'}?`,
      resposta,
      tolerancia: pedeT ? 0.5 : 0.01,
      unidade: pedeT ? '°C' : un,
      erros: limpar(erros, resposta, pedeT ? 0.5 : 0.01),
      resolucao: `Converta para kelvin: ${g1} °C = ${fK(T1)}${pedeT ? '' : ` e ${g2} °C = ${fK(T2)}`}. ${isobarica ? 'V₁/T₁ = V₂/T₂' : 'p₁/T₁ = p₂/T₂'}: ${x1}/${T1} = ${pedeT ? `${fn(x2)}/T₂ → T₂ = ${fK(T2)} = ${g2} °C` : `${isobarica ? 'V₂' : 'p₂'}/${T2} → ${isobarica ? 'V₂' : 'p₂'} = ${fn(x2)} ${un}`}.`,
      dicas: ['Leis dos gases pedem temperatura em kelvin: K = °C + 273.', isobarica ? 'Pressão constante: V/T é constante (V cresce junto com T).' : 'Volume constante: p/T é constante (p cresce junto com T).', 'Monte a razão, resolva em kelvin e, se pedirem, volte para °C.'],
      licao: 'leis dos gases: sempre kelvin (K = °C + 273)',
      dados: { tipo: isobarica ? 'isobarica' : 'isocorica', ini, fim, pede: pedeT ? 'T' : isobarica ? 'V' : 'p' },
    }
  }
  // nível 3: lei geral, p, V e T mudam
  const lista: { p1: number; V1: number; T1c: number; p2: number; V2: number }[] = []
  for (const p1 of [1, 2, 3, 4])
    for (const V1 of [2, 3, 4, 6])
      for (const T1c of [27, 127, -23, 57])
        for (const p2 of [1, 2, 3, 4, 6])
          for (const V2 of [2, 3, 4, 6, 8]) {
            if (p1 === p2 || V1 === V2 || p1 * V1 === p2 * V2) continue
            const T2 = (paraKelvin(T1c) * p2 * V2) / (p1 * V1)
            if (bonito(T2, 0) && T2 > 150 && T2 < 900) lista.push({ p1, V1, T1c, p2, V2 })
          }
  const { p1, V1, T1c, p2, V2 } = escolher(rng, lista)
  const ini: EstadoGas = { p: p1, V: V1, T: paraKelvin(T1c) }
  const fimC = leiGeral(ini, { p: p2, V: V2 })
  const T2c = paraCelsius(fimC.T)
  const erros: ErroTipico[] = [
    { valor: fimC.T, frase: `${fn(fimC.T)} é a temperatura em kelvin. A pergunta pede em °C: subtraia 273.`, motivo: 'esqueceu de voltar para °C' },
    { valor: (T1c * p2 * V2) / (p1 * V1), frase: 'Você usou a temperatura em °C na lei geral. Converta para kelvin (K = °C + 273), calcule e só depois volte para °C.', motivo: 'usou °C na lei dos gases' },
    { valor: paraCelsius((paraKelvin(T1c) * p1 * V1) / (p2 * V2)), frase: 'Você inverteu a razão. Na lei geral, p·V/T é constante: se p·V aumenta, T aumenta na mesma proporção.', motivo: 'inverteu a proporção' },
    { valor: paraCelsius((paraKelvin(T1c) * V2) / V1), frase: 'Você ignorou a variação de pressão. Na lei geral, p, V e T mudam juntos: p₁V₁/T₁ = p₂V₂/T₂.', motivo: 'ignorou uma das variáveis' },
  ]
  return {
    enunciado: `Um gás ideal está a ${T1c} °C, com pressão ${p1} atm e volume ${V1} L. Ele sofre uma transformação em que a pressão passa a ${p2} atm e o volume a ${V2} L. Qual é a temperatura final, em °C?`,
    resposta: Math.round(T2c * 1e6) / 1e6,
    tolerancia: 0.5,
    unidade: '°C',
    erros: limpar(
      erros.filter((e) => Number.isFinite(e.valor)),
      T2c,
      0.5,
    ),
    resolucao: `Em kelvin: T₁ = ${T1c} + 273 = ${paraKelvin(T1c)} K. Lei geral: p₁V₁/T₁ = p₂V₂/T₂ → ${p1}·${V1}/${paraKelvin(T1c)} = ${p2}·${V2}/T₂ → T₂ = ${fn(fimC.T)} K = ${fn(T2c)} °C.`,
    dicas: ['Lei geral dos gases: p₁V₁/T₁ = p₂V₂/T₂, com T em kelvin.', 'Converta T₁ para kelvin antes de qualquer conta.', 'Isole T₂ e, no final, converta de volta para °C.'],
    licao: 'lei geral p·V/T = constante, com T em kelvin',
    dados: { tipo: 'geral', ini, fim: fimC, pede: 'T' },
  }
}
