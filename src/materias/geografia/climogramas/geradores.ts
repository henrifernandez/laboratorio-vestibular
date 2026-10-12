import { CIDADES, CLIMAS, type Cidade, type IdClima } from '@/conteudo/geografia/climogramas'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { ESTACOES, MESES, NOME_ESTACAO, amplitude, estacaoExtrema, gerarSintetico, hemisferioPelaTemperatura, mediaAnual, mesesDaEstacao, mesesSecos, totalAnual, type DadosClima, type Estacao, type Hemisferio } from './calculo'

const ids = (...x: IdClima[]) => CIDADES.filter((c) => x.includes(c.clima))
const nomeClima = (c: Cidade) => CLIMAS[c.clima].nome

/** Dados enviados ao desenho: o climograma de uma cidade, sem revelar o nome. */
export interface DadosCidade {
  cidade: string
}
/** Para perguntas com várias miniaturas: cidade de cada alternativa (A, B, C...). */
export interface DadosMiniaturas {
  cidades: string[]
}

/* ------------------------------------------------------------------ leitura de números */

type TipoLeitura = 'temp-mes' | 'chuva-mes' | 'amplitude' | 'total' | 'secos' | 'media' | 'semestre'

export interface DadosLeitura extends DadosCidade {
  tipo: TipoLeitura
}

const POSITIVAS = CIDADES.filter((c) => c.temp.every((t) => t > 0))
const COM_SECOS = CIDADES.filter((c) => mesesSecos(c).length >= 2)
const COM_CHUVA = CIDADES.filter((c) => c.chuva.every((p) => p > 0))

/** Meses de outubro a março (semestre do verão no Hemisfério Sul). */
const SEMESTRE = [9, 10, 11, 0, 1, 2]

export function gerarLeitura(rng: Rng, nivel: Nivel): InstanciaNum<DadosLeitura> {
  const tipos: TipoLeitura[] = nivel === 1 ? ['temp-mes', 'chuva-mes'] : nivel === 2 ? ['amplitude', 'total', 'secos'] : ['media', 'semestre', 'secos']
  const tipo = escolher(rng, tipos)
  const dicas3 = (a: string, b: string, c: string) => [a, b, c]
  if (tipo === 'temp-mes' || tipo === 'chuva-mes') {
    const c = escolher(rng, tipo === 'temp-mes' ? POSITIVAS : COM_CHUVA.filter((x) => x.temp.every((t) => t > 0)))
    const temp = tipo === 'temp-mes'
    const tol = temp ? 0.1 : 1
    const valor = (i: number) => (temp ? (c.temp[(i + 12) % 12] as number) : (c.chuva[(i + 12) % 12] as number))
    const errosDe = (m: number) =>
      limpar(
        [
          { valor: temp ? (c.chuva[m] as number) : (c.temp[m] as number), frase: `Você leu ${temp ? 'a barra (chuva)' : 'a linha (temperatura)'} em vez de ${temp ? 'a linha' : 'a barra'}: ${temp ? 'a temperatura é a linha vermelha, na escala da esquerda' : 'a chuva são as barras azuis, na escala da direita'}.`, motivo: 'leu a grandeza errada' },
          { valor: valor(m + 1), frase: `Esse valor é de ${MESES[(m + 1) % 12]}, o mês seguinte. Confira o mês pedido.`, motivo: 'leu o mês errado' },
          { valor: valor(m - 1), frase: `Esse valor é de ${MESES[(m + 11) % 12]}, o mês anterior. Confira o mês pedido.`, motivo: 'leu o mês errado' },
        ],
        valor(m),
        tol,
      )
    // escolhe um mês em que os meses vizinhos tenham valores diferentes do pedido (senão não há erro típico a mostrar)
    const inicio = Math.floor(rng() * 12)
    let m = inicio
    for (let k = 0; k < 12; k++) {
      const cand = (inicio + k) % 12
      if (errosDe(cand).length >= 2) {
        m = cand
        break
      }
    }
    const resposta = valor(m)
    return {
      enunciado: `No climograma, qual é ${temp ? 'a temperatura média' : 'a precipitação média'} de ${MESES[m]}?`,
      resposta,
      tolerancia: tol,
      unidade: temp ? '°C' : 'mm',
      erros: errosDe(m),
      resolucao: `${temp ? 'A temperatura é a linha vermelha (escala da esquerda)' : 'A precipitação é a barra azul (escala da direita)'}. Em ${MESES[m]}, o valor é ${fn(resposta, 1)} ${temp ? '°C' : 'mm'}.`,
      dicas: dicas3('Primeiro decida se o dado pedido é a linha (temperatura) ou a barra (chuva).', `Localize ${MESES[m]} no eixo horizontal e confira a escala certa (esquerda: °C; direita: mm).`, 'Se tiver dúvida, abra a tabela “Ver os valores mês a mês”.'),
      licao: 'Linha = temperatura (escala da esquerda, °C); barras = precipitação (escala da direita, mm).',
      dados: { cidade: c.id, tipo },
    }
  }
  if (tipo === 'amplitude') {
    const c = escolher(rng, POSITIVAS.concat(CIDADES.filter((x) => !POSITIVAS.includes(x))))
    const resposta = amplitude(c)
    const tol = 0.1
    const maxT = Math.max(...c.temp)
    const minT = Math.min(...c.temp)
    return {
      enunciado: 'Qual é a amplitude térmica anual da cidade do climograma?',
      resposta,
      tolerancia: tol,
      unidade: '°C',
      erros: limpar(
        [
          { valor: maxT, frase: `${fn(maxT, 1)} °C é só a temperatura do mês mais quente. A amplitude é a diferença entre o mês mais quente e o mais frio.`, motivo: 'só o valor máximo' },
          { valor: Math.abs(minT), frase: `${fn(Math.abs(minT), 1)} é o valor do mês mais frio. A amplitude é a diferença entre os extremos.`, motivo: 'só o valor mínimo' },
          { valor: (maxT + minT) / 2, frase: 'Isso é a média dos dois extremos, não a diferença entre eles.', motivo: 'somou em vez de subtrair' },
        ],
        resposta,
        tol,
        true,
      ),
      resolucao: `Mês mais quente: ${fn(maxT, 1)} °C (${MESES[c.temp.indexOf(maxT)]}). Mês mais frio: ${fn(minT, 1)} °C (${MESES[c.temp.indexOf(minT)]}). Amplitude = ${fn(maxT, 1)} − (${fn(minT, 1)}) = ${fn(resposta, 1)} °C.`,
      dicas: dicas3('A amplitude térmica usa só dois pontos da linha.', 'Ache o ponto mais alto e o mais baixo da linha de temperatura.', 'Subtraia: máximo − mínimo (cuidado com valores abaixo de zero).'),
      licao: 'Amplitude térmica anual = temperatura do mês mais quente − temperatura do mês mais frio.',
      dados: { cidade: c.id, tipo },
    }
  }
  if (tipo === 'total') {
    const c = escolher(rng, CIDADES.filter((x) => totalAnual(x) > 100))
    const resposta = totalAnual(c)
    const tol = 2
    return {
      enunciado: 'Qual é o total anual de chuva (soma dos 12 meses) da cidade do climograma?',
      resposta,
      tolerancia: tol,
      unidade: 'mm',
      erros: limpar(
        [
          { valor: resposta / 12, frase: `Você calculou a média mensal (${fn(resposta / 12, 1)} mm). O total anual é a soma dos 12 meses.`, motivo: 'calculou a média em vez da soma' },
          { valor: resposta - Math.max(...c.chuva), frase: 'Faltou somar o mês mais chuvoso (a barra mais alta).', motivo: 'esqueceu um mês' },
          { valor: resposta + Math.max(...c.chuva), frase: 'Você contou o mês mais chuvoso duas vezes: confira se cada mês entrou uma só vez na soma.', motivo: 'contou um mês duas vezes' },
        ],
        resposta,
        tol,
      ),
      resolucao: `Soma dos 12 meses: ${c.chuva.join(' + ')} = ${fn(resposta, 0)} mm.`,
      dicas: dicas3('O total anual é a soma das alturas das 12 barras.', 'Abra a tabela com os valores e some os 12 números.', 'Some em grupos (por exemplo, de três em três meses) para não errar.'),
      licao: 'Total anual de chuva = soma dos 12 meses; média mensal = total ÷ 12.',
      dados: { cidade: c.id, tipo },
    }
  }
  if (tipo === 'secos') {
    const c = escolher(rng, COM_SECOS)
    const secos = mesesSecos(c)
    const resposta = secos.length
    const abaixoT = c.temp.filter((t, i) => (c.chuva[i] as number) < t).length
    const abaixo3T = c.temp.filter((t, i) => (c.chuva[i] as number) < 3 * t).length
    return {
      enunciado: 'Quantos meses são secos, pelo critério de Gaussen (chuva em mm menor que o dobro da temperatura em °C)?',
      resposta,
      tolerancia: 0.1,
      erros: limpar(
        [
          { valor: abaixoT, frase: 'Você comparou a chuva com a temperatura, sem dobrar. O critério é chuva < 2 × temperatura.', motivo: 'esqueceu de dobrar a temperatura' },
          { valor: abaixo3T, frase: 'Você usou três vezes a temperatura. O critério é o dobro (2 × T).', motivo: 'usou 3T em vez de 2T' },
          { valor: resposta + 1, frase: 'Você contou um mês a mais; confira o mês-limite, em que a chuva é igual ou maior que o dobro da temperatura.', motivo: 'contou um mês de fronteira' },
          { valor: resposta - 1, frase: 'Você deixou um mês seco de fora; confira os meses nas pontas do período seco.', motivo: 'esqueceu um mês' },
        ],
        resposta,
        0.1,
      ),
      resolucao: `Mês seco: chuva < 2 × temperatura. Meses secos: ${secos.map((i) => `${MESES[i]} (${fn(c.chuva[i] as number, 0)} < ${fn(2 * (c.temp[i] as number), 1)})`).join('; ')}. Total: ${resposta}.`,
      dicas: dicas3('Em cada mês, calcule 2 × temperatura e compare com a chuva.', 'O mês é seco quando a barra fica abaixo desse valor.', 'Use a tabela e preste atenção aos meses do começo e do fim da estação seca.'),
      licao: 'Mês seco (Gaussen): precipitação (mm) < 2 × temperatura (°C).',
      dados: { cidade: c.id, tipo },
    }
  }
  if (tipo === 'media') {
    const c = escolher(rng, CIDADES)
    const media = mediaAnual(c)
    const resposta = Math.round(media * 10) / 10
    const tol = 0.15
    return {
      enunciado: 'Qual é a temperatura média anual da cidade do climograma (média das 12 temperaturas mensais), com uma casa decimal?',
      resposta,
      tolerancia: tol,
      unidade: '°C',
      erros: limpar(
        [
          { valor: Math.max(...c.temp), frase: 'Esse valor é do mês mais quente. A média anual considera os 12 meses.', motivo: 'só o valor máximo' },
          { valor: (Math.max(...c.temp) + Math.min(...c.temp)) / 2, frase: 'Você fez a média apenas dos dois extremos. A média anual usa os 12 meses.', motivo: 'média só dos extremos' },
          { valor: amplitude(c), frase: 'Isso é a amplitude (diferença), e não a média.', motivo: 'confundiu média com amplitude' },
        ],
        resposta,
        tol,
        true,
      ),
      resolucao: `Soma das 12 temperaturas = ${fn(c.temp.reduce((a, b) => a + b, 0), 1)}. Média = ${fn(c.temp.reduce((a, b) => a + b, 0), 1)} ÷ 12 ≈ ${fn(resposta, 1)} °C.`,
      dicas: dicas3('Some as 12 temperaturas mensais.', 'Divida a soma por 12.', 'Confira se o resultado cai entre a temperatura mais baixa e a mais alta.'),
      licao: 'Temperatura média anual = soma das 12 médias mensais ÷ 12.',
      dados: { cidade: c.id, tipo },
    }
  }
  const c = escolher(rng, CIDADES.filter((x) => totalAnual(x) > 300))
  const soma = SEMESTRE.reduce((a, m) => a + (c.chuva[m] as number), 0)
  const tol = 2
  return {
    enunciado: 'Qual é o total de chuva no semestre de outubro a março (some os seis meses)?',
    resposta: soma,
    tolerancia: tol,
    unidade: 'mm',
    erros: limpar(
      [
        { valor: totalAnual(c) - soma, frase: 'Você somou o outro semestre (abril a setembro).', motivo: 'somou o semestre errado' },
        { valor: totalAnual(c), frase: 'Você somou o ano inteiro. Só interessam os seis meses de outubro a março.', motivo: 'somou o ano inteiro' },
        { valor: soma / 6, frase: 'Você calculou a média mensal do semestre. O enunciado pede o total.', motivo: 'média em vez de soma' },
      ],
      soma,
      tol,
    ),
    resolucao: `Outubro a março: ${SEMESTRE.map((m) => c.chuva[m]).join(' + ')} = ${fn(soma, 0)} mm.`,
    dicas: dicas3('Os meses são outubro, novembro, dezembro, janeiro, fevereiro e março.', 'Anote as seis barras e some.', 'Cuidado: dezembro, janeiro e fevereiro ficam em pontas diferentes do gráfico.'),
    licao: 'Para somar um período que cruza o fim do ano, junte as barras do fim e do começo do gráfico.',
    dados: { cidade: c.id, tipo },
  }
}

/* ------------------------------------------------------------------ qual é o clima? */

const GRUPO_N1: IdClima[][] = [
  ['equatorial', 'desertico', 'continental', 'mediterraneo'],
  ['equatorial', 'desertico', 'continental', 'oceanico'],
  ['semiarido', 'continental', 'equatorial', 'oceanico'],
  ['desertico', 'subtropical', 'equatorial', 'continental'],
]
const BRASIL: IdClima[] = ['equatorial', 'tropical', 'tropical-litoraneo', 'semiarido', 'tropical-altitude', 'subtropical']

/** Frase com os números que justificam a classificação. */
const FATOS = (c: Cidade) => `Neste climograma: temperatura média de ${fn(mediaAnual(c), 1)} °C, amplitude de ${fn(amplitude(c), 1)} °C, chuva de ${fn(totalAnual(c), 0)} mm por ano e ${mesesSecos(c).length} meses secos.`

export function gerarClima(rng: Rng, nivel: Nivel): InstanciaMulti<DadosCidade> {
  let alvo: IdClima
  let alternativas: IdClima[]
  if (nivel === 1) {
    alternativas = escolher(rng, GRUPO_N1)
    alvo = escolher(rng, alternativas)
  } else if (nivel === 2) {
    alvo = escolher(rng, BRASIL)
    alternativas = [alvo, ...embaralhar(rng, BRASIL.filter((x) => x !== alvo)).slice(0, 3)]
  } else {
    const confusos: IdClima[][] = [
      ['tropical', 'tropical-altitude', 'subtropical', 'mediterraneo'],
      ['tropical', 'tropical-litoraneo', 'semiarido', 'equatorial'],
      ['mediterraneo', 'oceanico', 'subtropical', 'tropical-altitude'],
      ['oceanico', 'continental', 'subtropical', 'mediterraneo'],
    ]
    alternativas = escolher(rng, confusos)
    alvo = escolher(rng, alternativas)
  }
  const c = ids(alvo)[0] as Cidade
  const certa: Opc = { texto: CLIMAS[alvo].nome, porque: `${CLIMAS[alvo].explicacao} ${FATOS(c)}` }
  const erradas: Opc[] = alternativas
    .filter((x) => x !== alvo)
    .map((x) => ({ texto: CLIMAS[x].nome, porque: `${CLIMAS[x].nome} teria ${CLIMAS[x].assinatura}. ${FATOS(c)} Isso não combina.`, motivo: `confundiu com clima ${CLIMAS[x].nome.toLowerCase()}` }))
  return montar<DadosCidade>(rng, certa, erradas, {
    enunciado: 'Que clima este climograma representa?',
    resolucao: `${FATOS(c)} Assinatura do clima ${CLIMAS[alvo].nome.toLowerCase()}: ${CLIMAS[alvo].assinatura}.`,
    dicas: [
      'Olhe a linha de temperatura: é alta o ano todo? A amplitude é grande ou pequena?',
      'Agora as barras: o total de chuva é alto ou baixo? Há meses com barras muito baixas (estação seca)? Em que época chove?',
      `Dica: ${CLIMAS[alvo].assinatura.split(',')[0]}.`,
    ],
    licao: 'Combine quatro pistas: temperatura (média e amplitude), total de chuva, regime (concentrado ou distribuído) e meses secos.',
    dados: { cidade: c.id },
  })
}

/* ------------------------------------------------------------------ hemisfério e estação */

export interface DadosEstacao {
  variante: 'seca' | 'chuvosa'
  /** climograma de uma cidade modelo (fictícia), montado de modo que o hemisfério e as estações sejam nítidos */
  clima: DadosClima
}

const NOME_HEM: Record<Hemisferio, string> = { N: 'Hemisfério Norte', S: 'Hemisfério Sul' }

export function gerarEstacao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosEstacao> {
  const variante: 'seca' | 'chuvosa' = nivel === 1 ? 'seca' : nivel === 2 ? 'chuvosa' : rng() < 0.5 ? 'seca' : 'chuvosa'
  const dados = gerarSintetico({
    media: sortear(rng, 9, 22),
    amp: nivel === 1 ? sortear(rng, 14, 20) : sortear(rng, 9, 16),
    hem: rng() < 0.5 ? 'S' : 'N',
    total: 100 * sortear(rng, 6, 16),
    conc: escolher(rng, [0.6, 0.7, 0.8, 0.9]),
    chuvaNoVerao: rng() < 0.5,
  })
  const hem = hemisferioPelaTemperatura(dados) as Hemisferio
  const estacao = estacaoExtrema(dados, hem, variante).estacao
  const c = dados
  const outraHem: Hemisferio = hem === 'S' ? 'N' : 'S'
  const texto = (h: Hemisferio, e: Estacao) => `${NOME_HEM[h]}, ${NOME_ESTACAO[e]}`
  const quente = MESES[c.temp.indexOf(Math.max(...c.temp))]
  // mesmos meses do calendário, mas no outro hemisfério: a estação tem outro nome (armadilha clássica)
  const trocada: Estacao = estacao === 'verao' ? 'inverno' : estacao === 'inverno' ? 'verao' : estacao === 'outono' ? 'primavera' : 'outono'
  const outra = escolher(
    rng,
    ESTACOES.filter((e) => e !== estacao),
  )
  const periodo = variante === 'seca' ? 'estação mais seca' : 'estação mais chuvosa'
  const meses = (e: Estacao, h: Hemisferio) => mesesDaEstacao(e, h).map((m) => MESES[m]).join(', ')
  const erradas: Opc[] = [
    {
      texto: texto(outraHem, trocada),
      porque: `Os meses estão certos (${meses(estacao, hem)}), mas no ${NOME_HEM[outraHem]} eles seriam ${NOME_ESTACAO[trocada]}. O mês mais quente (${quente}) mostra que o hemisfério é outro.`,
      motivo: 'hemisfério errado (meses certos)',
    },
    {
      texto: texto(outraHem, estacao),
      porque: `O mês mais quente é ${quente}, que indica o ${NOME_HEM[hem]}. No ${NOME_HEM[outraHem]}, ${NOME_ESTACAO[estacao]} cai em outros meses (${meses(estacao, outraHem)}).`,
      motivo: 'hemisfério errado',
    },
    {
      texto: texto(hem, outra),
      porque: `O hemisfério está certo, mas ${NOME_ESTACAO[outra]} (${meses(outra, hem)}) não é a ${periodo}: nesses meses há ${variante === 'seca' ? 'mais chuva' : 'menos chuva'} do que na estação indicada no gráfico.`,
      motivo: 'estação errada',
    },
  ]
  const lista3 = mesesDaEstacao(estacao, hem).map((m) => MESES[m])
  return montar<DadosEstacao>(rng, { texto: texto(hem, estacao), porque: `O mês mais quente é ${quente}, o que indica o ${NOME_HEM[hem]}. A ${variante === 'seca' ? 'estação mais seca' : 'estação mais chuvosa'} é ${NOME_ESTACAO[estacao]} (${lista3.join(', ')}).` }, erradas, {
    enunciado: `Em que hemisfério fica a cidade e qual é a ${variante === 'seca' ? 'estação do ano com menos chuva' : 'estação do ano com mais chuva'}?`,
    resolucao: `Mês mais quente: ${quente}, logo ${NOME_HEM[hem]} (onde ${NOME_ESTACAO[estacao]} vai de ${lista3[0]} a ${lista3[2]}). Somando as chuvas de cada trimestre, a ${variante === 'seca' ? 'menor soma' : 'maior soma'} é a de ${NOME_ESTACAO[estacao]}.`,
    dicas: [
      'Hemisfério: descubra em que mês a linha de temperatura atinge o máximo.',
      'Janeiro e dezembro quentes indicam verão no Hemisfério Sul; julho quente indica verão no Norte.',
      `Some as barras de cada trimestre (${lista3.join(', ')} para a estação certa) e compare.`,
    ],
    licao: 'Primeiro o hemisfério (pelo mês mais quente), depois as estações: no Sul o verão é de dezembro a fevereiro; no Norte, de junho a agosto.',
    dados: { clima: dados, variante },
  })
}

/* ------------------------------------------------------------------ comparar e escolher o gráfico (miniaturas) */

const LETRAS = ['A', 'B', 'C', 'D']

/** Monta uma pergunta com uma miniatura de climograma em cada alternativa (A a D). */
function montarComMiniaturas(
  rng: Rng,
  cidades: Cidade[],
  certaIdx: number,
  porque: (c: Cidade, i: number) => string,
  motivo: (c: Cidade) => string,
  resto: Pick<InstanciaMulti, 'enunciado' | 'dicas' | 'licao'> & { resolucao: (naOrdem: Cidade[]) => string },
): InstanciaMulti<DadosMiniaturas> {
  const ordem = embaralhar(
    rng,
    cidades.map((c, i) => ({ c, i })),
  )
  const porqueMapa: Record<string, string> = {}
  const motivoMapa: Record<string, string> = {}
  let certa = 'A'
  ordem.forEach(({ c, i }, k) => {
    const id = LETRAS[k] as string
    if (i === certaIdx) {
      certa = id
      porqueMapa[id] = `Certo. ${porque(c, i)}`
    } else {
      porqueMapa[id] = `Não. ${porque(c, i)}`
      motivoMapa[id] = motivo(c)
    }
  })
  return {
    ...resto,
    resolucao: resto.resolucao(ordem.map((o) => o.c)),
    opcoes: ordem.map((_, k) => ({ id: LETRAS[k] as string, rotulo: `Climograma ${LETRAS[k]}` })),
    certa,
    porque: porqueMapa,
    motivo: motivoMapa,
    dados: { cidades: ordem.map(({ c }) => c.id) },
  }
}

type MetricaComparar = 'total' | 'amplitude' | 'secos'
const METRICAS: Record<MetricaComparar, { valor: (c: Cidade) => number; texto: string; unidade: string; margem: number }> = {
  total: { valor: totalAnual, texto: 'o maior total anual de chuva', unidade: 'mm', margem: 200 },
  amplitude: { valor: amplitude, texto: 'a maior amplitude térmica anual', unidade: '°C', margem: 3 },
  secos: { valor: (c) => mesesSecos(c).length, texto: 'o maior número de meses secos (critério de Gaussen)', unidade: 'meses', margem: 1 },
}

export function gerarComparar(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMiniaturas> {
  const metrica: MetricaComparar = nivel === 1 ? 'total' : nivel === 2 ? 'amplitude' : 'secos'
  const m = METRICAS[metrica]
  let escolhidas: Cidade[] = []
  for (let tentativa = 0; tentativa < 80; tentativa++) {
    const quatro = embaralhar(rng, CIDADES).slice(0, 4)
    const vs = quatro.map(m.valor).sort((a, b) => b - a)
    if ((vs[0] as number) - (vs[1] as number) >= m.margem) {
      escolhidas = quatro
      break
    }
  }
  if (escolhidas.length === 0) escolhidas = [ids('semiarido')[0], ids('equatorial')[0], ids('oceanico')[0], ids('subtropical')[0]] as Cidade[]
  const maior = Math.max(...escolhidas.map(m.valor))
  const idxCerta = escolhidas.findIndex((c) => m.valor(c) === maior)
  const f = (c: Cidade) => `${fn(m.valor(c), metrica === 'amplitude' ? 1 : 0)} ${m.unidade}`
  return montarComMiniaturas(
    rng,
    escolhidas,
    idxCerta,
    (c, i) => `Este climograma tem ${f(c)}${i === idxCerta ? ', o maior valor entre os quatro' : `, menos que os ${f(escolhidas[idxCerta] as Cidade)} do climograma certo`}.`,
    () => 'comparou a grandeza errada ou errou a leitura',
    {
      enunciado: `Entre os quatro climogramas, qual tem ${m.texto}?`,
      resolucao: (naOrdem) => naOrdem.map((c, i) => `Climograma ${LETRAS[i]}: ${f(c)}`).join('; ') + `. O maior valor é ${fn(maior, metrica === 'amplitude' ? 1 : 0)} ${m.unidade}.`,
      dicas:
        metrica === 'total'
          ? ['Chuva é a soma das barras: procure o gráfico com barras mais altas e mais numerosas.', 'Compare a escala da chuva de cada gráfico: o mesmo tamanho pode valer números diferentes.', 'Estime a soma de cada gráfico.']
          : metrica === 'amplitude'
            ? ['Amplitude é a diferença entre o ponto mais alto e o mais baixo da linha.', 'Compare a distância vertical entre os extremos da linha, em °C.', 'Cada gráfico tem escala própria: não compare só a aparência.']
            : ['Mês seco: barra abaixo do dobro da temperatura.', 'Procure o gráfico em que a linha vermelha fica mais acima das barras por mais meses (na escala 1 °C : 2 mm).', 'Estime a quantidade de meses secos em cada um.'],
      licao: 'Cada climograma tem escala própria: compare pelos números, não pela aparência do gráfico.',
    },
  )
}

const POR_TIPO = new Map<IdClima, Cidade>(CIDADES.map((c) => [c.clima, c]))

export function gerarGrafico(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMiniaturas> {
  const base: IdClima[] = nivel === 1 ? ['equatorial', 'desertico', 'continental', 'semiarido', 'oceanico', 'mediterraneo'] : nivel === 2 ? BRASIL : ['tropical', 'tropical-altitude', 'subtropical', 'mediterraneo', 'oceanico', 'tropical-litoraneo']
  const tipos = embaralhar(rng, base).slice(0, 4)
  const alvo = escolher(rng, tipos)
  const cidades = tipos.map((t) => POR_TIPO.get(t) as Cidade)
  const idxCerta = tipos.indexOf(alvo)
  const descricao = nivel === 3 ? `o clima com ${CLIMAS[alvo].assinatura}` : `o clima ${CLIMAS[alvo].nome.toLowerCase()}`
  return montarComMiniaturas(
    rng,
    cidades,
    idxCerta,
    (c, i) => (i === idxCerta ? `${CLIMAS[c.clima].nome}: ${CLIMAS[c.clima].assinatura}.` : `Este é um climograma de clima ${CLIMAS[c.clima].nome.toLowerCase()}: ${CLIMAS[c.clima].assinatura}.`),
    (c) => `confundiu com clima ${CLIMAS[c.clima].nome.toLowerCase()}`,
    {
      enunciado: `Qual climograma representa ${descricao}?`,
      resolucao: () => `${CLIMAS[alvo].nome}: ${CLIMAS[alvo].assinatura}. ${CLIMAS[alvo].explicacao}`,
      dicas: ['Traduza o clima em pistas: temperatura alta ou baixa? Muita ou pouca chuva? Estação seca?', `Assinatura: ${CLIMAS[alvo].assinatura}.`, `Procure o gráfico com ${CLIMAS[alvo].assinatura.split(',')[0]}.`],
      licao: 'Aprenda a “assinatura” de cada clima: forma da linha de temperatura + altura e distribuição das barras.',
    },
  )
}

export { nomeClima }
