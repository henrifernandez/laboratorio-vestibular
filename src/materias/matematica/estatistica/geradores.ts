import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { histograma, media, mediaPonderada, mediana, moda, type Classe } from './calculo'

export const fmt = (n: number, casas = 2) => String(Math.round(n * 10 ** casas) / 10 ** casas).replace('.', ',')
const lista = (xs: number[]) => xs.map((x) => fmt(x)).join('; ')

/* ------------------------------------------------------------------ efeito de um valor extremo */

export interface DadosExtremo {
  antes: number[]
  depois: number[]
  acao: 'adicionou' | 'retirou'
  extremo: number
  mediaAntes: number
  mediaDepois: number
  medianaAntes: number
  medianaDepois: number
}

export function gerarExtremo(rng: Rng, nivel: Nivel): InstanciaMulti<DadosExtremo> {
  let base: number[] = []
  let extremo = 0
  const faixa = nivel === 3 ? [48, 62] : [5, 12]
  for (let k = 0; k < 500; k++) {
    base = Array.from({ length: 7 }, () => sortear(rng, faixa[0] as number, faixa[1] as number))
    extremo = nivel === 3 ? sortear(rng, 2, 8) : sortear(rng, 35, 60)
    const com = [...base, extremo]
    const dMedia = media(com) - media(base)
    const dMed = mediana(com) - mediana(base)
    if (Math.abs(dMedia) >= 3 * Math.abs(dMed) + 2) break
  }
  const retirar = nivel === 2
  const antes = retirar ? [...base, extremo] : base
  const depois = retirar ? base : [...base, extremo]
  const mA = media(antes)
  const mD = media(depois)
  const medA = mediana(antes)
  const medD = mediana(depois)
  const sobe = mD > mA
  const dir = sobe ? 'aumenta' : 'diminui'
  const quase = Math.abs(medD - medA) < 1e-9 ? 'não muda' : 'quase não muda'
  const numeros = `Média: ${fmt(mA)} → ${fmt(mD)}. Mediana: ${fmt(medA)} → ${fmt(medD)}.`
  const opcoes = [
    { id: 'a', rotulo: `A média ${dir} bastante e a mediana ${quase}` },
    { id: 'b', rotulo: `A mediana ${dir} bastante e a média quase não muda` },
    { id: 'c', rotulo: 'Média e mediana mudam praticamente o mesmo tanto' },
    { id: 'd', rotulo: 'Nenhuma das duas muda' },
  ]
  return {
    enunciado: retirar
      ? `Os valores ${lista(antes)} têm um valor bem fora do padrão (${extremo}). O que acontece com a média e com a mediana se retirarmos esse valor?`
      : `Os valores ${lista(antes)} formam um conjunto. Acrescentamos mais um valor, bem diferente dos outros: ${extremo}. O que acontece com a média e com a mediana?`,
    opcoes: embaralhar(rng, opcoes),
    certa: 'a',
    porque: {
      a: `Isso! ${numeros} A média soma todos os valores, então um valor extremo a puxa; a mediana só olha o termo do meio, que mal se mexe.`,
      b: `É o contrário. ${numeros} A mediana depende da posição central, e um único valor extremo só a desloca um lugar; já a média é puxada pelo extremo.`,
      c: `Não mudam o mesmo tanto. ${numeros} A média varia muito mais (${fmt(Math.abs(mD - mA))}) que a mediana (${fmt(Math.abs(medD - medA))}).`,
      d: `Mudam, sim. ${numeros} Ao ${retirar ? 'retirar' : 'acrescentar'} um valor, a soma e a quantidade de termos mudam, então a média muda.`,
    },
    motivo: { b: 'trocou o efeito na média e na mediana', c: 'não percebeu que o extremo afeta mais a média', d: 'achou que não muda nada' },
    resolucao: `${numeros} A média é sensível a valores extremos (usa todos os valores); a mediana é robusta (só depende da posição central). Por isso, com valores muito fora do padrão, a mediana representa melhor o valor "típico".`,
    dicas: [
      'Pense em como cada medida é calculada: a média usa todos os valores; a mediana usa o do meio.',
      'Um valor muito grande aumenta a soma, e portanto a média. Na mediana, ele apenas ocupa a última posição da lista ordenada.',
      numeros,
    ],
    licao: 'a média é sensível a valores extremos; a mediana, não',
    dados: { antes, depois, acao: retirar ? 'retirou' : 'adicionou', extremo, mediaAntes: mA, mediaDepois: mD, medianaAntes: medA, medianaDepois: medD },
  }
}

/* ------------------------------------------------------------------ calcule a medida */

export interface DadosMedida {
  valores?: number[]
  tabela?: { valor: number; freq: number }[]
  rotuloValor?: string
  medida: 'media' | 'mediana' | 'mediaPonderada' | 'medianaTabela'
}

function ajustarSomaDivisivel(valores: number[]): number[] {
  const n = valores.length
  const resto = valores.reduce((s, x) => s + x, 0) % n
  const v = [...valores]
  v[n - 1] = (v[n - 1] as number) + (resto === 0 ? 0 : n - resto)
  return v
}

export function gerarMedida(rng: Rng, nivel: Nivel): InstanciaNum<DadosMedida> {
  if (nivel === 1) {
    const n = sortear(rng, 6, 8)
    const valores = ajustarSomaDivisivel(Array.from({ length: n }, () => sortear(rng, 3, 20)))
    const m = media(valores)
    const mediaErrada = valores.reduce((s, x) => s + x, 0) / (n - 1)
    const pontoMedio = (Math.min(...valores) + Math.max(...valores)) / 2
    const erros = [
      { valor: Math.round(mediaErrada * 100) / 100, frase: `Você dividiu por ${n - 1}, mas a quantidade de valores é ${n}. A média é a soma dividida pela quantidade de valores.`, motivo: 'dividiu pela quantidade errada' },
      { valor: pontoMedio, frase: 'Você fez a média entre o menor e o maior valor. A média usa todos os valores: some todos e divida pela quantidade.', motivo: 'usou só os extremos' },
    ].filter((e) => Math.abs(e.valor - m) > 0.01)
    return {
      enunciado: `Qual é a média dos valores ${lista(valores)}?`,
      resposta: m,
      tolerancia: 0.01,
      erros,
      resolucao: `Soma = ${valores.reduce((s, x) => s + x, 0)}; quantidade = ${n}. Média = ${valores.reduce((s, x) => s + x, 0)} ÷ ${n} = ${fmt(m)}.`,
      dicas: ['Média = soma de todos os valores dividida pela quantidade deles.', `Some os ${n} valores.`, `Divida a soma (${valores.reduce((s, x) => s + x, 0)}) por ${n}.`],
      licao: 'média = soma ÷ quantidade',
      dados: { valores, medida: 'media' },
    }
  }
  if (nivel === 2) {
    const n = escolher(rng, [6, 8])
    let valores: number[] = []
    for (let k = 0; k < 200; k++) {
      valores = Array.from({ length: n }, () => sortear(rng, 2, 30))
      if (new Set(valores).size === n && mediana(valores) !== media(valores)) break
    }
    const med = mediana(valores)
    const meio = Math.floor(n / 2)
    const semOrdenar = ((valores[meio - 1] as number) + (valores[meio] as number)) / 2
    const erros = [
      { valor: semOrdenar, frase: 'Você pegou os dois valores do meio da lista como ela foi dada. É preciso colocar os valores em ordem crescente antes de achar o meio.', motivo: 'não ordenou antes de achar a mediana' },
      { valor: Math.round(media(valores) * 100) / 100, frase: 'Você calculou a média. A mediana é o valor central da lista em ordem crescente; com quantidade par, é a média dos dois centrais.', motivo: 'confundiu média com mediana' },
    ].filter((e) => Math.abs(e.valor - med) > 0.01)
    const ord = [...valores].sort((a, b) => a - b)
    return {
      enunciado: `Qual é a mediana dos valores ${lista(valores)}?`,
      resposta: med,
      tolerancia: 0.01,
      erros,
      resolucao: `Em ordem: ${lista(ord)}. São ${n} valores (par), então a mediana é a média dos dois centrais, ${fmt(ord[meio - 1] as number)} e ${fmt(ord[meio] as number)}: ${fmt(med)}.`,
      dicas: ['Primeiro coloque os valores em ordem crescente.', 'Com uma quantidade par de valores, a mediana é a média dos dois do meio.', `Os dois centrais são o ${meio}º e o ${meio + 1}º valor da lista ordenada.`],
      licao: 'mediana: ordene primeiro; se a quantidade for par, tire a média dos dois centrais',
      dados: { valores, medida: 'mediana' },
    }
  }
  if (rng() < 0.5) {
    const valores = [escolher(rng, [0, 1]), 2, 3, 4, 5].slice(0, 5)
    const tabela = valores.map((v) => ({ valor: v, freq: sortear(rng, 1, 9) }))
    const m = mediaPonderada(tabela)
    const simples = media(valores)
    const erros = [{ valor: Math.round(simples * 100) / 100, frase: 'Você fez a média simples dos valores ignorando as frequências. Cada valor deve ser multiplicado pelo número de vezes que aparece.', motivo: 'ignorou as frequências' }].filter((e) => Math.abs(e.valor - m) > 0.01)
    const total = tabela.reduce((s, t) => s + t.freq, 0)
    return {
      enunciado: `A tabela mostra quantos alunos tiraram cada nota. Qual é a média da turma (arredonde em 2 casas)?`,
      resposta: Math.round(m * 100) / 100,
      tolerancia: 0.01,
      erros,
      resolucao: `Soma ponderada = ${tabela.map((t) => `${t.valor}·${t.freq}`).join(' + ')} = ${tabela.reduce((s, t) => s + t.valor * t.freq, 0)}. Total de alunos = ${total}. Média = ${tabela.reduce((s, t) => s + t.valor * t.freq, 0)} ÷ ${total} = ${fmt(m)}.`,
      dicas: ['Cada nota aparece várias vezes: multiplique a nota pela quantidade de alunos.', 'Média ponderada = (soma de valor × frequência) ÷ (soma das frequências).', `A soma das frequências é ${total}.`],
      licao: 'média ponderada: Σ(valor·frequência) ÷ Σ frequência',
      dados: { tabela, rotuloValor: 'Nota', medida: 'mediaPonderada' },
    }
  }
  const tabela = [0, 1, 2, 3, 4].map((v) => ({ valor: v, freq: sortear(rng, 2, 9) }))
  const total = tabela.reduce((s, t) => s + t.freq, 0)
  const expandida = tabela.flatMap((t) => Array(t.freq).fill(t.valor) as number[])
  const med = mediana(expandida)
  const meio = Math.floor(total / 2)
  const wrong = media(tabela.map((t) => t.valor))
  const erros = [
    { valor: wrong, frase: 'Você calculou a mediana só dos valores da tabela (0, 1, 2, 3, 4), sem contar as repetições. Cada valor aparece tantas vezes quanto a sua frequência.', motivo: 'ignorou as frequências' },
    { valor: Math.round(mediaPonderada(tabela) * 100) / 100, frase: 'Você calculou a média. Para a mediana, ache a posição central na lista ordenada e veja em que valor ela cai.', motivo: 'confundiu média com mediana' },
  ].filter((e) => Math.abs(e.valor - med) > 0.01)
  return {
    enunciado: `A tabela mostra quantos filhos têm as famílias de um prédio. Qual é a mediana do número de filhos?`,
    resposta: med,
    tolerancia: 0.01,
    erros,
    resolucao: `São ${total} famílias. ${total % 2 ? `A posição central é a ${meio + 1}ª` : `As posições centrais são a ${meio}ª e a ${meio + 1}ª`}. Acumulando as frequências: ${tabela.map((t, i) => `até ${t.valor}: ${tabela.slice(0, i + 1).reduce((s, x) => s + x.freq, 0)}`).join('; ')}. Isso cai no valor ${fmt(med)}.`,
    dicas: ['Imagine a lista completa em ordem: o 0 aparece sua frequência de vezes, depois o 1...', 'Ache a posição do meio (total ÷ 2).', 'Some as frequências acumuladas até passar dessa posição.'],
    licao: 'mediana em tabela de frequências: use as frequências acumuladas para achar a posição central',
    dados: { tabela, rotuloValor: 'Filhos', medida: 'medianaTabela' },
  }
}

/* ------------------------------------------------------------------ leia o histograma */

export interface DadosHistograma {
  inicio: number
  largura: number
  classes: Classe[]
  total: number
}

export function gerarHistograma(rng: Rng, nivel: Nivel): InstanciaNum<DadosHistograma> {
  const largura = escolher(rng, [2, 5])
  const inicio = largura === 2 ? escolher(rng, [0, 2, 4]) : escolher(rng, [0, 10])
  const n = 5
  const classes: Classe[] = Array.from({ length: n }, (_, k) => ({ de: inicio + k * largura, ate: inicio + (k + 1) * largura, freq: sortear(rng, 1, 10) }))
  const total = classes.reduce((s, c) => s + c.freq, 0)
  const dados: DadosHistograma = { inicio, largura, classes, total }
  const faixa = (c: Classe) => `${c.de} a menos de ${c.ate}`
  if (nivel === 1) {
    const k = sortear(rng, 0, n - 1)
    const c = classes[k] as Classe
    const vizinho = (classes[k + 1] ?? classes[k - 1]) as Classe
    return {
      enunciado: `O histograma mostra as notas de uma turma. Quantos alunos tiraram de ${faixa(c)}?`,
      resposta: c.freq,
      tolerancia: 0.001,
      erros: [{ valor: vizinho.freq, frase: `Você leu a barra vizinha (${faixa(vizinho)}). Confira em qual classe do eixo horizontal está o intervalo pedido.`, motivo: 'leu a barra errada' }].filter((e) => e.valor !== c.freq),
      resolucao: `A barra de ${faixa(c)} tem altura ${c.freq}: são ${c.freq} alunos.`,
      dicas: ['Localize no eixo horizontal a classe pedida.', 'A altura da barra é a quantidade de alunos.', `A classe é a ${k + 1}ª barra, contando da esquerda.`],
      licao: 'a altura de cada barra é a frequência da classe',
      dados,
    }
  }
  if (nivel === 2) {
    const k = sortear(rng, 1, n - 2)
    const corte = classes[k] as Classe
    const maiores = classes.slice(k).reduce((s, c) => s + c.freq, 0)
    const pct = Math.round((maiores / total) * 1000) / 10
    return {
      enunciado: `Que porcentagem dos alunos tirou ${corte.de} ou mais (arredonde em 1 casa)?`,
      resposta: pct,
      tolerancia: 0.1,
      erros: [
        { valor: Math.round((corte.freq / total) * 1000) / 10, frase: `Você usou só a barra da classe ${faixa(corte)}. "${corte.de} ou mais" inclui todas as barras dessa classe para a direita.`, motivo: 'contou só uma barra' },
        { valor: maiores, frase: 'Você deu a quantidade de alunos, mas o enunciado pede porcentagem: divida pelo total de alunos e multiplique por 100.', motivo: 'respondeu a quantidade, não a porcentagem' },
      ].filter((e) => Math.abs(e.valor - pct) > 0.1),
      resolucao: `Total de alunos: ${classes.map((c) => c.freq).join(' + ')} = ${total}. Alunos com ${corte.de} ou mais: ${classes.slice(k).map((c) => c.freq).join(' + ')} = ${maiores}. Porcentagem: ${maiores}/${total} = ${fmt(pct, 1)}%.`,
      dicas: ['Primeiro some as alturas de todas as barras: esse é o total de alunos.', `Some as barras a partir da classe ${faixa(corte)}.`, 'Divida essa soma pelo total e multiplique por 100.'],
      licao: 'porcentagem = parte ÷ total × 100; some as barras certas',
      dados,
    }
  }
  const pontos = classes.map((c) => ({ valor: (c.de + c.ate) / 2, freq: c.freq }))
  const estimada = mediaPonderada(pontos)
  const inferiores = mediaPonderada(classes.map((c) => ({ valor: c.de, freq: c.freq })))
  return {
    enunciado: 'Estime a média usando o ponto médio de cada classe como representante (arredonde em 2 casas).',
    resposta: Math.round(estimada * 100) / 100,
    tolerancia: 0.05,
    erros: [
      { valor: Math.round(inferiores * 100) / 100, frase: 'Você usou o limite inferior de cada classe. O representante da classe é o ponto médio: (início + fim)/2.', motivo: 'usou o limite inferior no lugar do ponto médio' },
      { valor: Math.round(media(pontos.map((p) => p.valor)) * 100) / 100, frase: 'Você fez a média dos pontos médios sem considerar quantos alunos há em cada classe. Pondere pela frequência.', motivo: 'ignorou as frequências' },
    ].filter((e) => Math.abs(e.valor - estimada) > 0.05),
    resolucao: `Pontos médios: ${pontos.map((p) => fmt(p.valor)).join('; ')}. Média ≈ (${pontos.map((p) => `${fmt(p.valor)}·${p.freq}`).join(' + ')}) ÷ ${total} = ${fmt(estimada)}.`,
    dicas: ['Cada classe é representada pelo seu ponto médio.', 'Faça a média ponderada: ponto médio × quantidade de alunos.', `O total de alunos é ${total}.`],
    licao: 'média de dados agrupados: pontos médios ponderados pelas frequências',
    dados,
  }
}

/* ------------------------------------------------------------------ qual medida usar */

interface Cenario {
  nivel: Nivel
  texto: string
  dados: number[]
  categorias?: string[]
  certa: 'media' | 'mediana' | 'moda'
  porque: string
}

export const CENARIOS: Cenario[] = [
  { nivel: 1, texto: 'Em uma empresa, 6 funcionários ganham cerca de R$ 2.000 e o dono ganha R$ 40.000. Qual medida melhor representa o salário típico?', dados: [2000, 2100, 1900, 2000, 2200, 2000, 40000], certa: 'mediana', porque: 'O salário do dono é um valor extremo e puxa a média para cima. A mediana não é afetada e mostra o salário típico.' },
  { nivel: 1, texto: 'Uma loja de sapatos vendeu os números 36, 37, 37, 38, 38, 38, 39, 40. Qual medida ajuda a decidir qual número comprar mais para o estoque?', dados: [36, 37, 37, 38, 38, 38, 39, 40], certa: 'moda', porque: 'Para o estoque importa o número mais vendido, ou seja, o valor que mais se repete: a moda.' },
  { nivel: 2, texto: 'A temperatura máxima em 7 dias foi 24, 25, 23, 26, 25, 24 e 26 graus. Qual medida resume bem a temperatura do período, usando todos os dias?', dados: [24, 25, 23, 26, 25, 24, 26], certa: 'media', porque: 'Os valores são parecidos, sem extremos. A média usa todos os dias e resume bem o período.' },
  { nivel: 2, texto: 'Num bairro, 9 casas custam cerca de R$ 300 mil e uma mansão custa R$ 5 milhões. Qual medida melhor descreve o preço de uma casa típica?', dados: [300, 290, 310, 305, 295, 300, 320, 280, 300, 5000], certa: 'mediana', porque: 'A mansão é um valor extremo e eleva muito a média. A mediana representa a casa típica.' },
  { nivel: 2, texto: 'Os tempos (em minutos) de 5 corredores foram 40, 41, 40, 42 e 41. A organização quer o tempo "médio" considerando todos. Qual medida usar?', dados: [40, 41, 40, 42, 41], certa: 'media', porque: 'Sem valores extremos, a média considera o tempo de todos os corredores e é a medida mais usada para esse fim.' },
  { nivel: 3, texto: 'Numa eleição de turma, os votos foram: Ana, Bia, Ana, Caio, Ana, Bia, Ana. Qual medida resume "quem ganhou"?', dados: [], categorias: ['Ana', 'Bia', 'Ana', 'Caio', 'Ana', 'Bia', 'Ana'], certa: 'moda', porque: 'Os dados são categorias (nomes): não dá para somar nem ordenar. Só a moda, o valor mais frequente, faz sentido.' },
  { nivel: 3, texto: 'A idade de 5 pessoas numa sala: 20, 21, 22, 23 e 90 anos. Qual medida representa melhor a idade típica do grupo?', dados: [20, 21, 22, 23, 90], certa: 'mediana', porque: 'A idade de 90 anos é um valor extremo e distorce a média. A mediana (22) mostra a idade típica.' },
  { nivel: 3, texto: 'Num dado de 6 faces, jogado 10 vezes, saíram: 2, 5, 3, 6, 4, 5, 1, 2, 5, 6. Qual medida diz qual face saiu mais vezes?', dados: [2, 5, 3, 6, 4, 5, 1, 2, 5, 6], certa: 'moda', porque: 'A pergunta é sobre o valor que mais se repete: a moda (o 5, que saiu 3 vezes).' },
]

export interface DadosCenario {
  dados: number[]
  categorias?: string[]
  media?: number
  mediana?: number
  moda?: number[]
}

export function gerarRepresentativa(rng: Rng, nivel: Nivel): InstanciaMulti<DadosCenario> {
  const pool = CENARIOS.filter((c) => c.nivel === nivel)
  const c = escolher(rng, pool)
  const numerico = !c.categorias
  const m = numerico ? media(c.dados) : undefined
  const med = numerico ? mediana(c.dados) : undefined
  const mo = numerico ? moda(c.dados) : undefined
  const nome = { media: 'Média', mediana: 'Mediana', moda: 'Moda' }
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  for (const id of ['media', 'mediana', 'moda'] as const) {
    if (id === c.certa) porque[id] = `Isso! ${c.porque}`
    else {
      motivo[id] = `escolheu ${nome[id].toLowerCase()} onde ${nome[c.certa].toLowerCase()} era a mais adequada`
      porque[id] = numerico
        ? `${id === 'media' ? `A média (${fmt(m as number)})` : id === 'mediana' ? `A mediana (${fmt(med as number)})` : `A moda (${(mo as number[]).length ? lista(mo as number[]) : 'não há'})`} não é a melhor aqui. ${c.porque}`
        : `Com dados que são categorias (nomes), ${nome[id].toLowerCase()} não faz sentido. ${c.porque}`
    }
  }
  return {
    enunciado: c.texto,
    opcoes: ['media', 'mediana', 'moda'].map((id) => ({ id, rotulo: nome[id as 'media'] })),
    certa: c.certa,
    porque,
    motivo,
    resolucao: `${c.porque} ${numerico ? `(Média = ${fmt(m as number)}; mediana = ${fmt(med as number)}; moda = ${(mo as number[]).length ? lista(mo as number[]) : 'não há'}.)` : ''}`,
    dicas: [
      'Pergunte-se: existe algum valor extremo que distorça o resultado? Os dados são números ou categorias?',
      'Média usa todos os valores (sensível a extremos). Mediana é o valor central (robusta). Moda é o valor mais frequente (serve até para categorias).',
      `A resposta é a que melhor responde à pergunta do enunciado: ${c.certa === 'moda' ? 'qual valor mais se repete' : c.certa === 'mediana' ? 'o valor típico, sem distorção' : 'o resumo que usa todos os valores'}.`,
    ],
    licao: 'média: dados sem extremos; mediana: com valores extremos; moda: o mais frequente (e categorias)',
    dados: { dados: c.dados, categorias: c.categorias, media: m, mediana: med, moda: mo },
  }
}

export { histograma }
