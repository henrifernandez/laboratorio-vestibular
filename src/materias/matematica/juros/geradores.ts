import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { escolher, sortear, embaralhar, type Rng } from '@/lib/rng'
import { aplicarPercentuais, fatorSucessivo, montanteComposto, montanteSimples, primeiroMesQueComposto, variacaoTotal } from './calculo'

const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`
const pct = (n: number) => `${String(Math.round(n * 100) / 100).replace('.', ',')}%`
const sinal = (p: number) => (p > 0 ? `aumento de ${pct(p)}` : `desconto de ${pct(-p)}`)

/* ------------------------------------------------------------------ qual cresce mais e quando */

export interface DadosCruz {
  capital: number
  iSimples: number
  jComposto: number
  mes: number
}

export function gerarCruz(rng: Rng, nivel: Nivel): InstanciaNum<DadosCruz> {
  const faixa: Record<Nivel, [number, number]> = { 1: [3, 8], 2: [8, 16], 3: [14, 40] }
  const [lo, hi] = faixa[nivel]
  let iS = 10
  let jC = 5
  let mes = 0
  for (let k = 0; k < 500; k++) {
    iS = nivel === 3 ? sortear(rng, 40, 120) / 10 : sortear(rng, 6, 20)
    jC = nivel === 3 ? sortear(rng, 10, Math.floor(iS * 10) - 5) / 10 : sortear(rng, 2, iS - 1)
    const t = primeiroMesQueComposto(jC / 100, iS / 100, 100)
    if (t !== null && t >= lo && t <= hi) {
      mes = t
      break
    }
  }
  if (mes === 0) {
    iS = 10
    jC = 6
    mes = primeiroMesQueComposto(0.06, 0.1) as number
  }
  const capital = escolher(rng, [1000, 2000, 5000, 10000])
  const a = (t: number) => montanteSimples(capital, iS / 100, t)
  const b = (t: number) => montanteComposto(capital, jC / 100, t)
  const erros = []
  if (mes > 1) {
    erros.push({
      valor: mes - 1,
      frase: `No mês ${mes - 1}, Ana tem ${brl(a(mes - 1))} e Bruno tem ${brl(b(mes - 1))}: Bruno ainda não passou. Confira o mês seguinte.`,
      motivo: 'parou um mês antes do cruzamento',
    })
  }
  erros.push({
    valor: mes + 1,
    frase: `Bruno já passou no mês ${mes}: nele Ana tem ${brl(a(mes))} e Bruno tem ${brl(b(mes))}. Você procurou o primeiro mês em que ele fica na frente?`,
    motivo: 'passou do mês do cruzamento',
  })
  return {
    enunciado: `Ana aplica ${brl(capital)} a juros simples de ${pct(iS)} ao mês. Bruno aplica ${brl(capital)} a juros compostos de ${pct(jC)} ao mês. A partir de qual mês (número inteiro) o montante de Bruno passa a ser maior que o de Ana?`,
    resposta: mes,
    tolerancia: 0.001,
    unidade: 'º mês',
    erros,
    resolucao: `Ana: M = ${capital}·(1 + ${iS / 100}·t). Bruno: M = ${capital}·(1 + ${jC / 100})^t. No mês ${mes - 1}, Ana tem ${brl(a(mes - 1))} e Bruno ${brl(b(mes - 1))} (Bruno ainda atrás). No mês ${mes}, Ana tem ${brl(a(mes))} e Bruno ${brl(b(mes))}: Bruno passa. O juro simples cresce em linha reta; o composto cresce cada vez mais depressa e acaba ultrapassando.`,
    dicas: [
      'O simples cresce o mesmo valor todo mês. O composto cresce cada mês um pouco mais que o anterior.',
      `Compare ${capital}·(1 + ${iS / 100}·t) com ${capital}·(1 + ${jC / 100})^t, mês a mês, e veja quando o segundo passa o primeiro.`,
      `No mês ${mes - 1} o composto ainda está atrás (${brl(b(mes - 1))} contra ${brl(a(mes - 1))}). Falta conferir o mês seguinte.`,
    ],
    licao: 'o juro composto cresce mais rápido com o tempo e, mesmo com taxa menor, acaba passando o simples',
    dados: { capital, iSimples: iS, jComposto: jC, mes },
  }
}

/* ------------------------------------------------------------------ aumentos e descontos sucessivos */

export interface DadosSucessivos {
  preco: number
  passos: number[]
  pedeVariacao: boolean
}

export function gerarSucessivos(rng: Rng, nivel: Nivel): InstanciaNum<DadosSucessivos> {
  const n = nivel === 1 ? 2 : 3
  const preco = escolher(rng, [100, 200, 400, 500, 800, 1000])
  let passos: number[] = []
  for (let k = 0; k < 200; k++) {
    passos = Array.from({ length: n }, () => escolher(rng, [10, 20, 25, 30, 50]) * (rng() < 0.5 ? 1 : -1))
    if (nivel === 1 && Math.sign(passos[0] as number) === Math.sign(passos[1] as number)) continue
    const ingenuo = passos.reduce((s, p) => s + p, 0)
    if (Math.abs(variacaoTotal(passos) - ingenuo) > 0.5 && Math.abs(variacaoTotal(passos)) > 0.01) break
  }
  const pedeVariacao = nivel === 3
  const valores = aplicarPercentuais(preco, passos)
  const final = valores[valores.length - 1] as number
  const soma = passos.reduce((s, p) => s + p, 0)
  const descricao = passos.map(sinal).join(', depois ')
  const fatores = passos.map((p) => `(1 ${p > 0 ? '+' : '−'} ${Math.abs(p) / 100})`).join(' × ')
  const etapas = valores
    .slice(1)
    .map((v, i) => `após o ${i + 1}º: ${brl(v)}`)
    .join('; ')
  const variacao = variacaoTotal(passos)
  return {
    enunciado: pedeVariacao
      ? `Um produto de ${brl(preco)} sofre, em sequência, ${descricao}. Qual é a variação percentual total (use sinal negativo se for desconto)?`
      : `Um produto custa ${brl(preco)}. Ele sofre ${descricao}. Qual é o preço final?`,
    resposta: pedeVariacao ? variacao : final,
    tolerancia: pedeVariacao ? 0.01 : 0.01,
    unidade: pedeVariacao ? '%' : 'R$',
    erros: [
      {
        valor: pedeVariacao ? soma : preco * (1 + soma / 100),
        frase: `Você somou os percentuais (${passos.map((p) => `${p > 0 ? '+' : ''}${p}%`).join(' ')} = ${soma > 0 ? '+' : ''}${soma}%). Mas cada variação incide sobre o valor que já foi alterado pela anterior, então não dá para somar as porcentagens.`,
        motivo: 'somou os percentuais em vez de multiplicar os fatores',
      },
    ],
    resolucao: `Multiplique os fatores: ${fatores} = ${fatorSucessivo(passos).toFixed(4).replace('.', ',')}. ${etapas}. ${pedeVariacao ? `Variação total: ${fatorSucessivo(passos).toFixed(4).replace('.', ',')} − 1 = ${(variacao >= 0 ? '+' : '') + String(Math.round(variacao * 100) / 100).replace('.', ',')}%.` : `Preço final: ${brl(final)}.`}`,
    dicas: [
      'Cada porcentagem incide sobre o valor atual, não sobre o valor original.',
      `Transforme cada variação em fator: aumento de 10% vira ×1,10; desconto de 10% vira ×0,90. Aqui: ${fatores}.`,
      `Aplique um fator por vez: ${etapas}.`,
    ],
    licao: 'variações percentuais sucessivas se multiplicam (fatores), não se somam',
    dados: { preco, passos, pedeVariacao },
  }
}

/* ------------------------------------------------------------------ montante */

export interface DadosMontante {
  capital: number
  taxa: number
  tempo: number
  regime: 'simples' | 'composto'
  pedeJuros: boolean
}

export function gerarMontante(rng: Rng, nivel: Nivel): InstanciaNum<DadosMontante> {
  const capital = escolher(rng, [1000, 1500, 2000, 4000, 5000])
  const regime: 'simples' | 'composto' = nivel === 1 ? 'simples' : 'composto'
  const taxa = nivel === 1 ? escolher(rng, [1, 2, 3, 4, 5]) : escolher(rng, [5, 10, 20])
  const tempo = nivel === 1 ? sortear(rng, 3, 12) : nivel === 2 ? sortear(rng, 2, 3) : sortear(rng, 3, 4)
  const pedeJuros = nivel === 3
  const ms = montanteSimples(capital, taxa / 100, tempo)
  const mc = montanteComposto(capital, taxa / 100, tempo)
  const m = regime === 'simples' ? ms : mc
  const r2 = (x: number) => Math.round(x * 100) / 100
  const alvo = pedeJuros ? m - capital : m
  const erros = []
  if (regime === 'simples') {
    erros.push({ valor: r2(ms - capital), frase: 'Você calculou só os juros. O montante é o capital mais os juros.', motivo: 'esqueceu de somar o capital' })
    erros.push({ valor: r2(mc), frase: 'Você usou juros compostos, mas o enunciado fala em juros simples: o juro é sempre calculado sobre o capital inicial.', motivo: 'confundiu simples com composto' })
  } else if (pedeJuros) {
    erros.push({ valor: r2(mc), frase: 'Você calculou o montante. Os juros são o montante menos o capital.', motivo: 'pediu juros, respondeu montante' })
    erros.push({ valor: r2(ms - capital), frase: 'Você usou juros simples (taxa × tempo). No regime composto os juros de cada mês entram na base do mês seguinte.', motivo: 'confundiu composto com simples' })
  } else {
    erros.push({ valor: r2(ms), frase: 'Você usou juros simples. No regime composto o juro de cada período é calculado sobre o montante do período anterior: M = C·(1 + i)^t.', motivo: 'confundiu composto com simples' })
    erros.push({ valor: r2(mc - capital), frase: 'Você calculou só os juros. O montante é o capital mais os juros.', motivo: 'esqueceu de somar o capital' })
  }
  return {
    enunciado: `Um capital de ${brl(capital)} é aplicado a juros ${regime === 'simples' ? 'simples' : 'compostos'} de ${pct(taxa)} ao mês durante ${tempo} meses. ${pedeJuros ? 'Quanto rendeu de juros no total?' : 'Qual é o montante no final?'}`,
    resposta: r2(alvo),
    tolerancia: 0.01,
    unidade: 'R$',
    erros,
    resolucao:
      regime === 'simples'
        ? `Juros simples: M = C·(1 + i·t) = ${capital}·(1 + ${taxa / 100}·${tempo}) = ${brl(ms)}. Os juros são ${brl(ms - capital)}.`
        : `Juros compostos: M = C·(1 + i)^t = ${capital}·${(1 + taxa / 100).toFixed(2).replace('.', ',')}^${tempo} = ${brl(mc)}. Os juros são M − C = ${brl(mc - capital)}.`,
    dicas: [
      regime === 'simples' ? 'No juro simples, o rendimento de cada mês é o mesmo valor, calculado sobre o capital.' : 'No juro composto, o juro de cada mês é calculado sobre o montante do mês anterior.',
      regime === 'simples' ? 'Fórmula: M = C·(1 + i·t), com i em forma decimal (3% = 0,03).' : 'Fórmula: M = C·(1 + i)^t, com i em forma decimal (10% = 0,10).',
      pedeJuros ? 'Calcule o montante e depois subtraia o capital.' : `Substitua: C = ${capital}, i = ${taxa / 100}, t = ${tempo}.`,
    ],
    licao: 'simples: M = C(1 + i·t); composto: M = C(1 + i)^t; juros = M − C',
    dados: { capital, taxa, tempo, regime, pedeJuros },
  }
}

/* ------------------------------------------------------------------ regime a partir da tabela */

export interface DadosRegime {
  valores: number[]
}

export function gerarRegime(rng: Rng, nivel: Nivel): InstanciaMulti<DadosRegime> {
  const capital = escolher(rng, [1000, 2000, 5000])
  const regime: 'simples' | 'composto' = rng() < 0.5 ? 'simples' : 'composto'
  const taxa = nivel === 1 ? escolher(rng, [10, 20]) : escolher(rng, [5, 10, 20])
  const outraTaxa = taxa === 10 ? 5 : 10
  const meses = [0, 1, 2, 3, 4]
  const valores = meses.map((t) => Math.round((regime === 'simples' ? montanteSimples(capital, taxa / 100, t) : montanteComposto(capital, taxa / 100, t)) * 100) / 100)
  const nome = (r: 'simples' | 'composto', i: number) => `Juros ${r === 'simples' ? 'simples' : 'compostos'}${nivel === 1 ? '' : ` de ${i}% ao mês`}`
  const idDe = (r: string, i: number) => `${r}-${i}`
  const todas = [
    { id: idDe('simples', taxa), r: 'simples' as const, i: taxa },
    { id: idDe('composto', taxa), r: 'composto' as const, i: taxa },
    ...(nivel === 1 ? [] : [{ id: idDe('simples', outraTaxa), r: 'simples' as const, i: outraTaxa }, { id: idDe('composto', outraTaxa), r: 'composto' as const, i: outraTaxa }]),
  ]
  const certaId = idDe(regime, taxa)
  const aumentos = valores.slice(1).map((v, k) => (v - (valores[k] as number)).toFixed(2).replace('.', ','))
  const razoes = valores.slice(1).map((v, k) => (v / (valores[k] as number)).toFixed(3).replace('.', ','))
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  for (const o of todas) {
    if (o.id === certaId) {
      porque[o.id] =
        regime === 'simples'
          ? `Isso! O aumento é sempre o mesmo (R$ ${aumentos[0]} por mês): crescimento constante é juro simples, e ${taxa}% de ${brl(capital)} dá exatamente esse valor.`
          : `Isso! O valor é multiplicado pelo mesmo fator (${razoes[0]}) todo mês e os aumentos crescem (${aumentos.slice(0, 3).map((a) => `R$ ${a}`).join(', ')}): é juro composto de ${taxa}%.`
    } else if (o.r !== regime) {
      porque[o.id] =
        regime === 'simples'
          ? `Em juros compostos os aumentos cresceriam mês a mês. Aqui eles são todos iguais (R$ ${aumentos[0]}), então é simples.`
          : `Em juros simples o aumento seria o mesmo todo mês. Aqui ele cresce (${aumentos.slice(0, 3).map((a) => `R$ ${a}`).join(', ')}), então é composto.`
      motivo[o.id] = 'confundiu simples com composto'
    } else {
      porque[o.id] = `O regime está certo, mas a taxa não: o primeiro mês rendeu ${(((valores[1] as number) - capital) / capital * 100).toFixed(0)}% do capital, e não ${o.i}%.`
      motivo[o.id] = 'taxa errada'
    }
  }
  return {
    enunciado: `Um capital de ${brl(capital)} rende assim, mês a mês. ${nivel === 1 ? 'Qual é o regime de juros?' : 'Qual é o regime e a taxa mensal?'}`,
    opcoes: embaralhar(rng, todas).map((o) => ({ id: o.id, rotulo: nome(o.r, o.i) })),
    certa: certaId,
    porque,
    motivo,
    resolucao: `Os valores são ${valores.map(brl).join(', ')}. ${regime === 'simples' ? `A diferença entre meses seguidos é constante (R$ ${aumentos[0]}): juros simples, taxa de ${taxa}% sobre o capital.` : `A razão entre meses seguidos é constante (${razoes[0]}): juros compostos, taxa de ${taxa}% ao mês.`}`,
    dicas: [
      'Olhe a diferença entre um mês e o seguinte, e depois a razão entre um mês e o seguinte.',
      'Se a diferença é constante, o regime é simples. Se a razão é constante, é composto.',
      `Diferenças: ${aumentos.map((a) => `R$ ${a}`).join(', ')}. Razões: ${razoes.join('; ')}.`,
    ],
    licao: 'diferenças constantes indicam juros simples; razões constantes indicam juros compostos',
    dados: { valores },
  }
}
