import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { consumoMensal, custo, energiaKWh, montar, potenciaComNovaTensao, queimar, req, resolver, type Aparelho, type Folha, type Topologia } from './calculo'

const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const bonito = (x: number, casas = 1) => Math.abs(x * 10 ** casas - Math.round(x * 10 ** casas)) < 1e-9

function limpar(erros: ErroTipico[], resposta: number, tolerancia: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor) || !(e.valor > 0)) continue
    if (Math.abs(e.valor - resposta) <= 2 * tolerancia) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tolerancia)) continue
    saida.push(e)
  }
  return saida
}

/* ------------------------------------------------------------------ qual lâmpada brilha mais? */

export interface DadosBrilho {
  topologia: Topologia
  rs: number[]
  V: number
  /** índice da lâmpada que queima (circuito aberto), quando a pergunta é sobre queimar */
  queimada?: number
  /** potências (W) antes e depois de queimar, para mostrar depois de responder */
  antes: number[]
  depois?: number[]
}

const potencias = (fs: Folha[]) => fs.map((f) => f.P)
type Mudanca = 'aumenta' | 'diminui' | 'igual' | 'apaga'
const compara = (antes: number, depois: number): Mudanca => (depois < 1e-9 ? 'apaga' : Math.abs(depois - antes) < 1e-9 ? 'igual' : depois > antes ? 'aumenta' : 'diminui')
const NOME_MUDANCA: Record<Mudanca, string> = {
  aumenta: 'Brilha mais',
  diminui: 'Brilha menos, mas continua acesa',
  igual: 'Continua com o mesmo brilho',
  apaga: 'Apaga',
}

interface Cand {
  chave: string
  rotulo: string
  correta: boolean
  porque: string
  motivo: string
}

function montarMulti(rng: Rng, enunciado: string, cands: Cand[], resolucao: string, dicas: string[], licao: string, dados: DadosBrilho): InstanciaMulti<DadosBrilho> {
  const lista = embaralhar(rng, cands)
  const letras = ['A', 'B', 'C', 'D', 'E']
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  lista.forEach((c, i) => {
    const id = letras[i] as string
    porque[id] = c.porque
    if (c.correta) certa = id
    else motivo[id] = c.motivo
  })
  return { enunciado, opcoes: lista.map((c, i) => ({ id: letras[i] as string, rotulo: c.rotulo })), certa, porque, motivo, resolucao, dicas, licao, dados }
}

const VALORES_R = [10, 15, 20, 30, 40, 60]
const nomeL = (i: number) => `Lâmpada ${i + 1}`

export function gerarBrilho(rng: Rng, nivel: Nivel): InstanciaMulti<DadosBrilho> {
  const V = escolher(rng, [6, 12, 24])
  const queima = nivel >= 2 && rng() < 0.5

  if (nivel === 1 || (nivel === 2 && !queima)) {
    // duas lâmpadas, em série (nível 1) ou em paralelo (nível 2): qual brilha mais?
    const topologia: Topologia = nivel === 1 ? 'serie' : 'paralelo'
    const a = escolher(rng, VALORES_R)
    const b = escolher(rng, VALORES_R.filter((x) => x !== a))
    const rs = [a, b]
    const f = resolver(montar(topologia, rs), V)
    const P = potencias(f)
    const maior = P[0]! > P[1]! ? 0 : 1
    const serieT = topologia === 'serie'
    const nome = (i: number) => nomeL(i)
    const cands: Cand[] = [0, 1].map((i) => ({
      chave: String(i),
      rotulo: nome(i),
      correta: i === maior,
      porque:
        i === maior
          ? serieT
            ? `Isso! Em série passa a mesma corrente nas duas, e P = R·i². A de maior resistência (${rs[i]} Ω) dissipa mais: ${fn(P[i]!)} W contra ${fn(P[1 - i]!)} W.`
            : `Isso! Em paralelo as duas recebem a mesma ddp (${V} V), e P = V²/R. A de menor resistência (${rs[i]} Ω) dissipa mais: ${fn(P[i]!)} W contra ${fn(P[1 - i]!)} W.`
          : serieT
            ? `A ${nome(i)} tem a menor resistência (${rs[i]} Ω). Em série a corrente é a mesma, e P = R·i²: com menos resistência, ela dissipa menos (${fn(P[i]!)} W).`
            : `A ${nome(i)} tem a maior resistência (${rs[i]} Ω). Em paralelo a ddp é a mesma, e P = V²/R: com mais resistência, ela dissipa menos (${fn(P[i]!)} W).`,
      motivo: serieT ? 'escolheu a de menor resistência em série' : 'escolheu a de maior resistência em paralelo',
    }))
    cands.push({
      chave: 'iguais',
      rotulo: serieT ? 'As duas brilham igual, porque a corrente é a mesma' : 'As duas brilham igual, porque a ddp é a mesma',
      correta: false,
      porque: serieT ? 'A corrente é igual, mas o brilho depende da potência P = R·i², e as resistências são diferentes.' : 'A ddp é igual, mas o brilho depende da potência P = V²/R, e as resistências são diferentes.',
      motivo: serieT ? 'achou que corrente igual dá brilho igual' : 'achou que ddp igual dá brilho igual',
    })
    cands.push({
      chave: 'bateria',
      rotulo: 'Depende da tensão da bateria',
      correta: false,
      porque: 'A tensão da bateria muda o brilho das duas, mas não inverte a ordem entre elas: a de maior (em série) ou menor (em paralelo) resistência continua brilhando mais.',
      motivo: 'achou que a bateria decide qual brilha mais',
    })
    return montarMulti(
      rng,
      `Duas lâmpadas de resistências ${a} Ω e ${b} Ω são ligadas em ${serieT ? 'série' : 'paralelo'} a uma bateria de ${V} V. Qual delas brilha mais?`,
      cands,
      serieT
        ? `Em série, i = ${V}/(${a} + ${b}) = ${fn(V / (a + b))} A nas duas. P = R·i²: ${fn(P[0]!)} W na lâmpada 1 e ${fn(P[1]!)} W na lâmpada 2.`
        : `Em paralelo, cada lâmpada recebe ${V} V. P = V²/R: ${fn(P[0]!)} W na lâmpada 1 e ${fn(P[1]!)} W na lâmpada 2.`,
      serieT
        ? ['O brilho de uma lâmpada é a potência que ela dissipa.', 'Em série, a corrente é a mesma nas duas.', 'Use P = R·i²: o que tem de diferente entre elas?']
        : ['O brilho de uma lâmpada é a potência que ela dissipa.', 'Em paralelo, a ddp é a mesma nas duas.', 'Use P = V²/R: quem tem a menor resistência dissipa mais.'],
      serieT ? 'em série, brilha mais a de maior R (P = R·i²)' : 'em paralelo, brilha mais a de menor R (P = V²/R)',
      { topologia, rs, V, antes: P },
    )
  }

  if (nivel === 2 && queima) {
    // três lâmpadas em paralelo; uma queima
    const rs = [escolher(rng, VALORES_R), escolher(rng, VALORES_R), escolher(rng, VALORES_R)]
    const queimada = escolher(rng, [0, 1, 2])
    const no = montar('paralelo', rs)
    const antes = potencias(resolver(no, V))
    const depois = potencias(resolver(queimar(no, queimada), V))
    const outra = [0, 1, 2].filter((i) => i !== queimada)[0] as number
    const cands: Cand[] = [
      { chave: 'igual', rotulo: NOME_MUDANCA.igual, correta: true, porque: `Isso! Cada ramo em paralelo está ligado direto à bateria (${V} V). Quando um ramo se abre, os outros continuam com os mesmos ${V} V e a mesma corrente: nada muda para eles.`, motivo: '' },
      { chave: 'apaga', rotulo: NOME_MUDANCA.apaga, correta: false, porque: 'Isso aconteceria em série, onde há um único caminho para a corrente. Em paralelo, cada lâmpada tem o seu próprio caminho até a bateria.', motivo: 'confundiu paralelo com série' },
      { chave: 'aumenta', rotulo: NOME_MUDANCA.aumenta, correta: false, porque: 'A corrente que passava pela lâmpada queimada não “sobra” para as outras. Cada ramo em paralelo recebe a mesma ddp da bateria, e a corrente nele é V/R, que não depende dos outros ramos.', motivo: 'achou que a corrente se redistribui' },
      { chave: 'diminui', rotulo: NOME_MUDANCA.diminui, correta: false, porque: 'Com a bateria ideal, a ddp sobre cada ramo continua a mesma, e a corrente em cada lâmpada que sobrou também (i = V/R). O que cai é a corrente total da bateria.', motivo: 'achou que o brilho cai ao perder um ramo' },
    ]
    return montarMulti(
      rng,
      `Três lâmpadas (${rs.join(' Ω, ')} Ω) estão ligadas em paralelo a uma bateria ideal de ${V} V. A lâmpada ${queimada + 1} queima (o filamento se rompe). O que acontece com o brilho da lâmpada ${outra + 1}?`,
      cands,
      `Em paralelo, cada ramo está sob a ddp da bateria: P = V²/R = ${fn(antes[outra]!)} W, antes e depois. O ramo aberto some, mas não altera os demais.`,
      ['Em paralelo, cada lâmpada está ligada diretamente aos terminais da bateria.', 'A corrente em cada ramo é V/R, e só depende da própria lâmpada.', 'Abrir um ramo muda a corrente total, mas não a ddp sobre os outros.'],
      'em paralelo, os ramos são independentes: uma lâmpada que queima não muda as outras',
      { topologia: 'paralelo', rs, V, queimada, antes, depois },
    )
  }

  // nível 3: três lâmpadas, R₀ em série com (R₁ ∥ R₂)
  const lista: { rs: number[]; V: number }[] = []
  for (const a of VALORES_R) for (const b of VALORES_R) for (const c of VALORES_R) {
    const p = potencias(resolver(montar('misto', [a, b, c]), V))
    const ord = [...p].sort((x, y) => y - x)
    if (ord[0]! - ord[1]! > 0.05 * ord[0]!) lista.push({ rs: [a, b, c], V })
  }
  const { rs } = escolher(rng, lista)
  const no = montar('misto', rs)
  const antes = potencias(resolver(no, V))
  if (!queima) {
    const maior = antes.indexOf(Math.max(...antes))
    const cands: Cand[] = [0, 1, 2].map((i) => ({
      chave: String(i),
      rotulo: nomeL(i),
      correta: i === maior,
      porque:
        i === maior
          ? `Isso! Calculando as três: ${antes.map((p, k) => `${nomeL(k)}: ${fn(p)} W`).join('; ')}. A ${nomeL(i).toLowerCase()} dissipa mais.`
          : `A ${nomeL(i)} dissipa ${fn(antes[i]!)} W, menos que a ${nomeL(maior)} (${fn(antes[maior]!)} W). Para comparar, ache a corrente e a ddp de cada uma: a lâmpada 1 está em série com o conjunto; as lâmpadas 2 e 3 dividem a corrente e têm a mesma ddp.`,
      motivo: 'comparou sem calcular a potência de cada lâmpada',
    }))
    cands.push({ chave: 'iguais', rotulo: 'As três brilham igual', correta: false, porque: 'As resistências são diferentes e a corrente se divide entre as lâmpadas 2 e 3: as potências não podem ser todas iguais.', motivo: 'achou que todas brilham igual' })
    const f = resolver(no, V)
    return montarMulti(
      rng,
      `A lâmpada 1 (${rs[0]} Ω) está em série com duas lâmpadas em paralelo, a lâmpada 2 (${rs[1]} Ω) e a lâmpada 3 (${rs[2]} Ω), todas ligadas a uma bateria de ${V} V. Qual das três brilha mais?`,
      cands,
      `Resistência das lâmpadas 2 e 3 em paralelo: ${fn(req(montar('paralelo', [rs[1]!, rs[2]!])))} Ω. Total: ${fn(req(no))} Ω, então i = ${fn(V / req(no))} A passa pela lâmpada 1. A ddp do paralelo é ${fn(f[1]!.V)} V. Potências: ${antes.map((p, k) => `lâmpada ${k + 1}: ${fn(p)} W`).join('; ')}.`,
      ['Brilho é potência dissipada. Calcule P de cada lâmpada.', 'A lâmpada 1 recebe a corrente total; as lâmpadas 2 e 3 dividem a corrente e têm a mesma ddp.', 'Ache a resistência equivalente, a corrente total, e depois a ddp do trecho em paralelo.'],
      'em circuito misto: ache a corrente total, depois a ddp de cada trecho, e compare P = V·i',
      { topologia: 'misto', rs, V, antes },
    )
  }
  // mista com lâmpada queimada
  const queimada = escolher(rng, [1, 2])
  const depois = potencias(resolver(queimar(no, queimada), V))
  const alvo = escolher(rng, [0, 3 - queimada])
  const real = compara(antes[alvo]!, depois[alvo]!)
  const todos: Mudanca[] = ['aumenta', 'diminui', 'igual', 'apaga']
  const porqueMud = (m: Mudanca): string => {
    if (m === real) {
      return real === 'diminui'
        ? `Isso! Com um ramo aberto, a resistência total aumenta e a corrente da bateria cai. Toda essa corrente passa pela lâmpada ${alvo + 1}, que passa de ${fn(antes[alvo]!)} W para ${fn(depois[alvo]!)} W.`
        : `Isso! A lâmpada ${alvo + 1} agora está sozinha no trecho em paralelo. A lâmpada 1 fica com menos ddp (a corrente total caiu), então sobra mais ddp para ela: de ${fn(antes[alvo]!)} W para ${fn(depois[alvo]!)} W.`
    }
    if (m === 'apaga') return 'Ela só apagaria se o único caminho da corrente fosse interrompido. Ainda existe um caminho fechado pela bateria, pela lâmpada 1 e pelo ramo que sobrou.'
    if (m === 'igual') return 'O circuito muda: a resistência total aumenta quando um ramo em paralelo se abre, então a corrente da bateria e as ddp de cada lâmpada mudam.'
    if (m === 'aumenta') return 'Com um ramo aberto a resistência total aumenta e a corrente da bateria diminui. Essa lâmpada recebe a corrente total, então ela brilha menos, e não mais.'
    return 'A lâmpada que sobrou no paralelo passa a receber uma parte maior da ddp, porque a lâmpada em série fica com menos ddp (a corrente total caiu). Ela brilha mais, e não menos.'
  }
  const cands: Cand[] = todos.map((m) => ({ chave: m, rotulo: NOME_MUDANCA[m], correta: m === real, porque: porqueMud(m), motivo: 'previu o efeito de queimar a lâmpada sem calcular' }))
  return montarMulti(
    rng,
    `A lâmpada 1 (${rs[0]} Ω) está em série com as lâmpadas 2 (${rs[1]} Ω) e 3 (${rs[2]} Ω), que estão em paralelo entre si, ligadas a uma bateria ideal de ${V} V. A lâmpada ${queimada + 1} queima. O que acontece com o brilho da lâmpada ${alvo + 1}?`,
    cands,
    `Antes: R total = ${fn(req(no))} Ω. Depois: R total = ${fn(req(queimar(no, queimada)))} Ω, e a lâmpada ${queimada + 1} não conduz. Potência da lâmpada ${alvo + 1}: ${fn(antes[alvo]!)} W antes, ${fn(depois[alvo]!)} W depois.`,
    ['Refaça o circuito sem a lâmpada que queimou: sobra um circuito em série.', 'Compare a resistência total antes e depois: o que acontece com a corrente?', 'Para a lâmpada pedida, compare a potência (V·i) nas duas situações.'],
    'abrir um ramo muda a resistência total: refaça a conta antes de prever o brilho',
    { topologia: 'misto', rs, V, queimada, antes, depois },
  )
}

/* ------------------------------------------------------------------ resistência equivalente */

export interface DadosCircuito {
  topologia: Topologia
  rs: number[]
  V?: number
  /** índice do resistor perguntado */
  alvo?: number
}

const RS = [2, 3, 4, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60]

export function gerarEquivalente(rng: Rng, nivel: Nivel): InstanciaNum<DadosCircuito> {
  let topologia: Topologia
  let rs: number[]
  if (nivel === 1) {
    topologia = rng() < 0.5 ? 'serie' : 'paralelo'
    if (topologia === 'serie') rs = [escolher(rng, RS), escolher(rng, RS), escolher(rng, [0, 0, 5, 10, 20]) || 0].filter((x) => x > 0)
    else {
      const lista: number[][] = []
      for (const a of RS) for (const b of RS) if (a < b && bonito(req(montar('paralelo', [a, b])))) lista.push([a, b])
      rs = escolher(rng, lista)
    }
  } else if (nivel === 2) {
    topologia = escolher(rng, ['serie', 'paralelo', 'paralelo'] as const)
    if (topologia === 'serie') rs = [escolher(rng, RS), escolher(rng, RS), escolher(rng, RS), escolher(rng, RS)]
    else {
      const lista: number[][] = []
      for (const a of RS) for (const b of RS) for (const c of RS) if (a <= b && b <= c && !(a === b && b === c) && bonito(req(montar('paralelo', [a, b, c])))) lista.push([a, b, c])
      rs = escolher(rng, lista)
    }
  } else {
    topologia = rng() < 0.5 ? 'misto' : 'misto2'
    const lista: number[][] = []
    for (const a of RS) for (const b of RS) for (const c of RS) if (bonito(req(montar(topologia, [a, b, c])))) lista.push([a, b, c])
    rs = escolher(rng, lista)
  }
  const no = montar(topologia, rs)
  const Req = req(no)
  const soma = rs.reduce((s, x) => s + x, 0)
  const somaInversos = rs.reduce((s, x) => s + 1 / x, 0)
  const erros: ErroTipico[] = []
  if (topologia === 'serie') {
    erros.push({ valor: 1 / rs.reduce((s, x) => s + 1 / x, 0), frase: 'Você usou a fórmula do paralelo (soma dos inversos). Em série, as resistências simplesmente se somam: R = R₁ + R₂ + ...', motivo: 'usou a fórmula do paralelo em série' })
    erros.push({ valor: soma / rs.length, frase: 'Você fez a média das resistências. Em série, elas se somam: a equivalente é maior que qualquer uma delas.', motivo: 'fez a média das resistências' })
    erros.push({ valor: soma - (rs[rs.length - 1] as number), frase: 'Faltou somar uma das resistências: em série, todas entram na soma.', motivo: 'esqueceu uma resistência na soma' })
  } else if (topologia === 'paralelo') {
    erros.push({ valor: soma, frase: 'Você somou as resistências, como se fosse uma associação em série. Em paralelo, soma-se o inverso: 1/R = 1/R₁ + 1/R₂ + ...', motivo: 'usou a fórmula da série em paralelo' })
    erros.push({ valor: somaInversos, frase: `Você somou os inversos, mas esqueceu de inverter o resultado: 1/R = ${fn(somaInversos, 3)}, então R = 1/${fn(somaInversos, 3)}.`, motivo: 'esqueceu de inverter a soma dos inversos' })
    if (rs.length === 2) erros.push({ valor: rs[0]! * rs[1]!, frase: 'Você usou só o produto. A fórmula é produto sobre soma: R = R₁·R₂/(R₁ + R₂).', motivo: 'esqueceu de dividir pela soma' })
    else erros.push({ valor: soma / rs.length, frase: 'Você fez a média das resistências. Em paralelo, a equivalente é menor que a menor delas, e vem da soma dos inversos.', motivo: 'fez a média das resistências' })
  } else if (topologia === 'misto') {
    const [a, b, c] = rs as [number, number, number]
    erros.push({ valor: a + b + c, frase: 'Você somou as três como se estivessem em série. As resistências 2 e 3 estão em paralelo entre si: primeiro ache a equivalente delas.', motivo: 'tratou tudo como série' })
    erros.push({ valor: req(montar('paralelo', [b, c])), frase: 'Você achou só a equivalente do trecho em paralelo e esqueceu de somar a resistência em série.', motivo: 'esqueceu a resistência em série' })
    erros.push({ valor: a + 1 / b + 1 / c, frase: 'Você somou os inversos do trecho em paralelo, mas esqueceu de inverter o resultado antes de somar com a resistência em série.', motivo: 'esqueceu de inverter o paralelo' })
  } else {
    const [a, b, c] = rs as [number, number, number]
    erros.push({ valor: a + b + c, frase: 'Você somou as três como se estivessem em série. A resistência 1 está em paralelo com o conjunto das resistências 2 e 3 (que estão em série entre si).', motivo: 'tratou tudo como série' })
    erros.push({ valor: req(montar('paralelo', [a, b])) + c, frase: 'Você agrupou errado. A resistência 1 está em paralelo com o ramo formado por 2 e 3 juntas (em série), e não só com a 2.', motivo: 'agrupou os resistores errado' })
    erros.push({ valor: b + c, frase: 'Você achou só a equivalente do ramo em série (2 e 3) e esqueceu que a resistência 1 está em paralelo com ele.', motivo: 'esqueceu o resistor em paralelo' })
  }
  const descricao =
    topologia === 'serie'
      ? `Resistores de ${rs.join(' Ω, ')} Ω estão ligados em série.`
      : topologia === 'paralelo'
        ? `Resistores de ${rs.join(' Ω, ')} Ω estão ligados em paralelo.`
        : topologia === 'misto'
          ? `Um resistor de ${rs[0]} Ω está em série com dois resistores em paralelo, de ${rs[1]} Ω e ${rs[2]} Ω.`
          : `Um resistor de ${rs[0]} Ω está em paralelo com um ramo formado por dois resistores em série, de ${rs[1]} Ω e ${rs[2]} Ω.`
  const resolucao =
    topologia === 'serie'
      ? `Em série: R = ${rs.join(' + ')} = ${fn(Req)} Ω.`
      : topologia === 'paralelo'
        ? `Em paralelo: 1/R = ${rs.map((x) => `1/${x}`).join(' + ')} = ${fn(somaInversos, 4)}, então R = ${fn(Req)} Ω.`
        : topologia === 'misto'
          ? `Primeiro o paralelo: ${rs[1]} ∥ ${rs[2]} = ${fn(req(montar('paralelo', [rs[1]!, rs[2]!])))} Ω. Depois a série: ${rs[0]} + ${fn(req(montar('paralelo', [rs[1]!, rs[2]!])))} = ${fn(Req)} Ω.`
          : `Primeiro a série do ramo: ${rs[1]} + ${rs[2]} = ${rs[1]! + rs[2]!} Ω. Depois o paralelo: ${rs[0]} ∥ ${rs[1]! + rs[2]!} = ${fn(Req)} Ω.`
  return {
    enunciado: `${descricao} Qual é a resistência equivalente, em ohms?`,
    resposta: Req,
    tolerancia: 0.05,
    unidade: 'Ω',
    erros: limpar(erros, Req, 0.05),
    resolucao,
    dicas: ['Identifique o que está em série (mesma corrente) e o que está em paralelo (mesma ddp).', 'Série: some as resistências. Paralelo: some os inversos e inverta no final.', topologia === 'misto' || topologia === 'misto2' ? 'Resolva de dentro para fora: primeiro o trecho que é só série ou só paralelo.' : 'Em paralelo, a equivalente é sempre menor que a menor das resistências: use isso para conferir.'],
    licao: 'série: R = ΣR; paralelo: 1/R = Σ(1/R); resolva de dentro para fora',
    dados: { topologia, rs },
  }
}

/* ------------------------------------------------------------------ corrente e ddp */

export type PedeCorrente = 'i-mA' | 'R-kohm' | 'i-total' | 'i-ramo' | 'V-resistor' | 'i-resistor'

export interface DadosCorrente extends DadosCircuito {
  pede: PedeCorrente
}

export function gerarCorrente(rng: Rng, nivel: Nivel): InstanciaNum<DadosCorrente> {
  if (nivel === 1) {
    if (rng() < 0.5) {
      // i em mA a partir de V e R em ohms
      const lista: { V: number; Rv: number }[] = []
      for (const V of [3, 6, 9, 12, 24]) for (const Rv of [100, 200, 300, 400, 600, 800, 1200, 1500]) if (bonito((V / Rv) * 1000, 0)) lista.push({ V, Rv })
      const { V, Rv } = escolher(rng, lista)
      const i = (V / Rv) * 1000
      return {
        enunciado: `Um resistor de ${Rv} Ω é ligado a uma bateria de ${V} V. Qual é a corrente no resistor, em miliampères (mA)?`,
        resposta: i,
        tolerancia: 0.01,
        unidade: 'mA',
        erros: limpar([{ valor: V / Rv, frase: `${fn(V / Rv, 4)} é a corrente em ampères. A pergunta pede em mA: multiplique por 1.000.`, motivo: 'esqueceu de converter A para mA' }, { valor: Rv / V, frase: 'Você dividiu a resistência pela tensão. A lei de Ohm é V = R·i, então i = V/R.', motivo: 'inverteu a lei de Ohm' }], i, 0.01),
        resolucao: `i = V/R = ${V}/${Rv} = ${fn(V / Rv, 4)} A = ${fn(i)} mA.`,
        dicas: ['Lei de Ohm: V = R·i.', 'Isole a corrente: i = V/R.', '1 A = 1.000 mA.'],
        licao: 'V = R·i; 1 A = 1.000 mA',
        dados: { topologia: 'serie', rs: [Rv], V, pede: 'i-mA' },
      }
    }
    const lista: { V: number; iMa: number }[] = []
    for (const V of [3, 6, 9, 12, 24]) for (const iMa of [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]) if (bonito(V / iMa, 2)) lista.push({ V, iMa })
    const { V, iMa } = escolher(rng, lista)
    const Rk = V / iMa
    return {
      enunciado: `Um resistor ligado a uma fonte de ${V} V é percorrido por uma corrente de ${iMa} mA. Qual é a resistência, em quiloohms (kΩ)?`,
      resposta: Rk,
      tolerancia: 0.005,
      unidade: 'kΩ',
      erros: limpar([{ valor: Rk * 1000, frase: `${fn(Rk * 1000, 0)} é a resistência em ohms. A pergunta pede em kΩ: divida por 1.000.`, motivo: 'esqueceu de converter Ω para kΩ' }, { valor: iMa / V, frase: 'Você dividiu a corrente pela tensão. A resistência é R = V/i.', motivo: 'inverteu a lei de Ohm' }, { valor: Rk / 1000, frase: 'Você converteu mA para A (dividiu por 1.000), mas depois também dividiu a resistência. Em V/mA o resultado já sai em kΩ.', motivo: 'converteu a unidade duas vezes' }], Rk, 0.005),
      resolucao: `R = V/i = ${V}/(${iMa}·10⁻³ A) = ${fn(Rk * 1000, 0)} Ω = ${fn(Rk)} kΩ. (Atalho: volts divididos por miliampères dão quiloohms.)`,
      dicas: ['Lei de Ohm: R = V/i.', 'Converta mA para A antes de dividir (ou use o atalho V/mA = kΩ).', '1 kΩ = 1.000 Ω.'],
      licao: 'R = V/i; V/mA = kΩ',
      dados: { topologia: 'serie', rs: [Rk * 1000], V, pede: 'R-kohm' },
    }
  }
  if (nivel === 2) {
    const topologia: Topologia = rng() < 0.5 ? 'serie' : 'paralelo'
    const lista: { V: number; rs: number[]; alvo: number }[] = []
    for (const V of [6, 12, 18, 24, 36])
      for (const a of RS) for (const b of RS) {
        if (a === b) continue
        const f = resolver(montar(topologia, [a, b]), V)
        const i = topologia === 'serie' ? f[0]!.i : f[0]!.i
        if (bonito(i, 1) && bonito(f[1]!.i, 1) && i > 0.05) lista.push({ V, rs: [a, b], alvo: 0 })
      }
    const { V, rs } = escolher(rng, lista)
    const f = resolver(montar(topologia, rs), V)
    if (topologia === 'serie') {
      const i = f[0]!.i
      return {
        enunciado: `Dois resistores, de ${rs[0]} Ω e ${rs[1]} Ω, estão ligados em série a uma bateria de ${V} V. Qual é a corrente que passa pela bateria, em ampères?`,
        resposta: i,
        tolerancia: 0.005,
        unidade: 'A',
        erros: limpar([{ valor: V / rs[0]!, frase: `Você usou só o primeiro resistor (${rs[0]} Ω). Em série, a corrente é determinada pela resistência total: ${rs[0]} + ${rs[1]} = ${rs[0]! + rs[1]!} Ω.`, motivo: 'usou só um resistor' }, { valor: V / req(montar('paralelo', rs)), frase: 'Você usou a resistência equivalente de paralelo. Em série a equivalente é a soma das resistências.', motivo: 'usou a fórmula do paralelo' }, { valor: V / rs[1]!, frase: `Você usou só o segundo resistor (${rs[1]} Ω). Em série, a corrente é determinada pela resistência total: ${rs[0]} + ${rs[1]} = ${rs[0]! + rs[1]!} Ω.`, motivo: 'usou só um resistor' }], i, 0.005),
        resolucao: `R total = ${rs[0]} + ${rs[1]} = ${rs[0]! + rs[1]!} Ω. i = V/R = ${V}/${rs[0]! + rs[1]!} = ${fn(i)} A.`,
        dicas: ['Em série, some as resistências para achar a total.', 'Lei de Ohm no circuito inteiro: i = V/R total.', 'A corrente é a mesma em todos os resistores em série.'],
        licao: 'série: R total = ΣR e i = V/R total (mesma corrente em todos)',
        dados: { topologia, rs, V, pede: 'i-total', alvo: 0 },
      }
    }
    const alvo = escolher(rng, [0, 1])
    const i = f[alvo]!.i
    return {
      enunciado: `Dois resistores, de ${rs[0]} Ω e ${rs[1]} Ω, estão ligados em paralelo a uma bateria de ${V} V. Qual é a corrente que passa pelo resistor de ${rs[alvo]} Ω, em ampères?`,
      resposta: i,
      tolerancia: 0.005,
      unidade: 'A',
      erros: limpar([{ valor: f[0]!.i + f[1]!.i, frase: 'Essa é a corrente total da bateria (a soma das correntes dos dois ramos). A pergunta é sobre a corrente num ramo só.', motivo: 'deu a corrente total' }, { valor: V / (rs[0]! + rs[1]!), frase: 'Você somou as resistências, como em série. Em paralelo, cada resistor está ligado direto à bateria: a corrente nele é V/R do próprio resistor.', motivo: 'usou a fórmula da série' }, { valor: (f[0]!.i + f[1]!.i) / 2, frase: 'A corrente só se divide igualmente se as resistências forem iguais. Aqui a corrente é maior no resistor de menor resistência.', motivo: 'dividiu a corrente igualmente' }], i, 0.005),
      resolucao: `Em paralelo, cada resistor recebe ${V} V. i = V/R = ${V}/${rs[alvo]} = ${fn(i)} A.`,
      dicas: ['Em paralelo, todos os resistores têm a mesma ddp: a da bateria.', 'Aplique a lei de Ohm só ao resistor pedido: i = V/R.', 'Não é preciso achar a resistência equivalente.'],
      licao: 'paralelo: mesma ddp em todos; a corrente em cada ramo é V/R do ramo',
      dados: { topologia, rs, V, pede: 'i-ramo', alvo },
    }
  }
  // nível 3: misto, ddp ou corrente num resistor
  const topologia: Topologia = rng() < 0.5 ? 'misto' : 'misto2'
  const lista: { V: number; rs: number[]; alvo: number; pede: 'V-resistor' | 'i-resistor' }[] = []
  for (const V of [12, 18, 24, 36, 48])
    for (const a of RS) for (const b of RS) for (const c of RS) {
      if (b === c) continue
      const f = resolver(montar(topologia, [a, b, c]), V)
      for (let alvo = 0; alvo < 3; alvo++) {
        if (bonito(f[alvo]!.V, 1) && bonito(f[alvo]!.i, 1) && f[alvo]!.i >= 0.1 && f[alvo]!.V >= 1) {
          lista.push({ V, rs: [a, b, c], alvo, pede: 'V-resistor' })
          lista.push({ V, rs: [a, b, c], alvo, pede: 'i-resistor' })
        }
      }
    }
  const { V, rs, alvo, pede } = escolher(rng, lista)
  const no = montar(topologia, rs)
  const f = resolver(no, V)
  const total = V / req(no)
  const resposta = pede === 'V-resistor' ? f[alvo]!.V : f[alvo]!.i
  const erros: ErroTipico[] =
    pede === 'V-resistor'
      ? [
          { valor: V, frase: 'Você usou a tensão da bateria no resistor. Em associações, a ddp da bateria se divide entre os trechos: o resistor recebe só uma parte.', motivo: 'usou a ddp da bateria no resistor' },
          { valor: (V * rs[alvo]!) / rs.reduce((s, x) => s + x, 0), frase: 'Você tratou os três resistores como se estivessem em série. Dois deles estão em paralelo, e isso muda a divisão da ddp.', motivo: 'tratou tudo como série' },
          { valor: total * rs[alvo]!, frase: 'Você multiplicou a corrente total pela resistência do resistor. Só vale se toda a corrente passar por ele; num trecho em paralelo, a corrente se divide.', motivo: 'usou a corrente total no resistor' },
        ]
      : [
          { valor: total, frase: 'Essa é a corrente total da bateria. A corrente no resistor pedido pode ser só uma parte dela, se ele estiver num trecho em paralelo.', motivo: 'deu a corrente total' },
          { valor: V / rs[alvo]!, frase: 'Você aplicou a tensão da bateria diretamente ao resistor. A ddp sobre ele é só uma parte da tensão da bateria.', motivo: 'usou a ddp da bateria no resistor' },
          { valor: total / 2, frase: 'Você dividiu a corrente igualmente. Isso só vale se os ramos em paralelo tiverem resistências iguais.', motivo: 'dividiu a corrente igualmente' },
          { valor: V / rs.reduce((s, x) => s + x, 0), frase: 'Você tratou os três resistores como se estivessem em série. Dois deles estão em paralelo, e isso muda a resistência total e a divisão da corrente.', motivo: 'tratou tudo como série' },
        ]
  return {
    enunciado: `${topologia === 'misto' ? `Um resistor de ${rs[0]} Ω está em série com dois resistores em paralelo, de ${rs[1]} Ω e ${rs[2]} Ω` : `Um resistor de ${rs[0]} Ω está em paralelo com um ramo de dois resistores em série, de ${rs[1]} Ω e ${rs[2]} Ω`}, ligados a uma bateria ideal de ${V} V. ${pede === 'V-resistor' ? `Qual é a ddp, em volts, no resistor de ${rs[alvo]} Ω (resistor ${alvo + 1})?` : `Qual é a corrente, em ampères, no resistor de ${rs[alvo]} Ω (resistor ${alvo + 1})?`}`,
    resposta,
    tolerancia: pede === 'V-resistor' ? 0.05 : 0.02,
    unidade: pede === 'V-resistor' ? 'V' : 'A',
    erros: limpar(erros, resposta, pede === 'V-resistor' ? 0.05 : 0.02),
    resolucao: `R equivalente = ${fn(req(no))} Ω, corrente total = ${V}/${fn(req(no))} = ${fn(total)} A. ${topologia === 'misto' ? `A ddp do resistor 1 é ${fn(f[0]!.V)} V e o trecho em paralelo recebe ${fn(f[1]!.V)} V.` : `O resistor 1 recebe ${fn(f[0]!.V)} V (em paralelo com a bateria), e o ramo em série tem corrente ${fn(f[1]!.i)} A.`} Resistor ${alvo + 1}: V = ${fn(f[alvo]!.V)} V e i = ${fn(f[alvo]!.i)} A.`,
    dicas: ['Ache a resistência equivalente e a corrente total (lei de Ohm no circuito todo).', 'Depois “desmonte”: em série a corrente é a mesma; em paralelo a ddp é a mesma.', 'Confira: ddp em série soma a da bateria; corrente em paralelo soma a total.'],
    licao: 'ache R equivalente, depois a corrente total, depois desmonte: série divide a ddp, paralelo divide a corrente',
    dados: { topologia, rs, V, pede, alvo },
  }
}

/* ------------------------------------------------------------------ conta de luz */

export interface DadosConta {
  aparelhos: Aparelho[]
  dias: number
  tarifa?: number
  variante: 'kwh' | 'custo' | 'chuveiro-P' | 'chuveiro-R' | 'economia'
}

export function gerarConta(rng: Rng, nivel: Nivel): InstanciaNum<DadosConta> {
  if (nivel === 1) {
    const aparelhos: Aparelho[] = [{ nome: escolher(rng, ['Ferro de passar', 'Lâmpada', 'Ar-condicionado', 'Televisão', 'Micro-ondas']), W: 0, h: 0 }]
    const lista: { W: number; h: number }[] = []
    for (const W of [60, 100, 150, 400, 800, 1000, 1200, 1500, 2000]) for (const h of [0.5, 1, 2, 4, 5, 8]) if (bonito(energiaKWh(W, h * 30), 2)) lista.push({ W, h })
    const { W, h } = escolher(rng, lista)
    aparelhos[0] = { ...aparelhos[0]!, W, h }
    const E = energiaKWh(W, h * 30)
    return {
      enunciado: `Um(a) ${aparelhos[0]!.nome.toLowerCase()} de ${fn(W, 0)} W é usado(a) ${fn(h)} hora${h === 1 ? '' : 's'} por dia. Qual é o consumo de energia em 30 dias, em kWh?`,
      resposta: E,
      tolerancia: 0.01,
      unidade: 'kWh',
      erros: limpar([{ valor: W * h * 30, frase: `${fn(W * h * 30, 0)} é a energia em Wh. Para kWh, divida por 1.000.`, motivo: 'esqueceu de converter Wh em kWh' }, { valor: energiaKWh(W, h), frase: 'Esse é o consumo de um dia só. Faltou multiplicar pelos 30 dias.', motivo: 'esqueceu de multiplicar pelos dias' }, { valor: (W / 1000) * h * 30 * 1000, frase: 'Você converteu W em kW no sentido contrário. 1 kW = 1.000 W: para ir de W a kW, divide-se por 1.000.', motivo: 'converteu W em kW no sentido contrário' }], E, 0.01),
      resolucao: `E = P·Δt = ${fn(W, 0)} W · ${fn(h * 30)} h = ${fn(W * h * 30, 0)} Wh = ${fn(E)} kWh.`,
      dicas: ['Energia = potência × tempo.', 'O tempo total é horas por dia vezes os dias do mês.', '1 kWh = 1.000 Wh: divida os watts-hora por 1.000.'],
      licao: 'E (kWh) = P (kW) × t (h) = P (W) × t (h) / 1000',
      dados: { aparelhos, dias: 30, variante: 'kwh' },
    }
  }
  if (nivel === 2) {
    const nomes = ['Chuveiro', 'Geladeira', 'Ferro de passar', 'Lâmpada', 'Televisão', 'Ar-condicionado']
    const base: Record<string, { W: number; hs: number[] }> = {
      Chuveiro: { W: 4000, hs: [0.5, 1] },
      Geladeira: { W: 200, hs: [10, 12] },
      'Ferro de passar': { W: 1000, hs: [1, 2] },
      Lâmpada: { W: 60, hs: [4, 5] },
      Televisão: { W: 100, hs: [4, 5] },
      'Ar-condicionado': { W: 1500, hs: [2, 4] },
    }
    const escolhidos = embaralhar(rng, nomes).slice(0, 3)
    const aparelhos: Aparelho[] = escolhidos.map((n) => ({ nome: n, W: base[n]!.W, h: escolher(rng, base[n]!.hs) }))
    const tarifa = escolher(rng, [0.5, 0.6, 0.8, 1])
    const E = consumoMensal(aparelhos, 30)
    const C = custo(E, tarifa)
    const individuais = aparelhos.map((a) => energiaKWh(a.W, a.h * 30))
    return {
      enunciado: `A tabela mostra três aparelhos de uma casa. Considerando um mês de 30 dias e tarifa de R$ ${fn(tarifa)} por kWh, qual é o custo mensal desses aparelhos, em reais?`,
      resposta: C,
      tolerancia: 0.01,
      unidade: 'R$',
      erros: limpar(
        [
          { valor: C * 1000, frase: 'Você esqueceu de converter watts-hora em kWh (dividir por 1.000) antes de multiplicar pela tarifa.', motivo: 'esqueceu de converter Wh em kWh' },
          { valor: C / 30, frase: 'Esse é o custo de um dia. Faltou multiplicar pelos 30 dias.', motivo: 'esqueceu de multiplicar pelos dias' },
          { valor: E, frase: `${fn(E)} é o consumo em kWh. Falta multiplicar pela tarifa (R$ ${fn(tarifa)} por kWh).`, motivo: 'esqueceu de multiplicar pela tarifa' },
          ...individuais.map((e, k) => ({ valor: (E - e) * tarifa, frase: `Faltou o consumo d${aparelhos[k]!.nome === 'Lâmpada' || aparelhos[k]!.nome === 'Geladeira' || aparelhos[k]!.nome === 'Televisão' ? 'a' : 'o'} ${aparelhos[k]!.nome.toLowerCase()} na soma.`, motivo: 'esqueceu um aparelho' })),
        ],
        C,
        0.01,
      ),
      resolucao: `${aparelhos.map((a, k) => `${a.nome}: ${fn(a.W, 0)} W · ${fn(a.h * 30)} h = ${fn(individuais[k]!)} kWh`).join('; ')}. Total: ${fn(E)} kWh. Custo: ${fn(E)} · ${fn(tarifa)} = R$ ${fn(C)}.`,
      dicas: ['Calcule a energia de cada aparelho: potência (kW) × horas no mês.', 'Some as energias para ter o consumo total em kWh.', 'Multiplique o total pela tarifa (R$/kWh).'],
      licao: 'custo = (soma de P·t em kWh) × tarifa',
      dados: { aparelhos, dias: 30, tarifa, variante: 'custo' },
    }
  }
  const v = escolher(rng, ['chuveiro-P', 'chuveiro-R', 'economia'] as const)
  if (v === 'chuveiro-P') {
    const P = escolher(rng, [2200, 4400, 5500, 6600])
    const Vn = 220
    const Vnovo = 110
    const novo = potenciaComNovaTensao(P, Vn, Vnovo)
    return {
      enunciado: `Um chuveiro elétrico de ${fn(P, 0)} W foi fabricado para funcionar em ${Vn} V. Ele é ligado, por engano, a uma tomada de ${Vnovo} V. Supondo que a resistência não mude, qual é a nova potência, em watts?`,
      resposta: novo,
      tolerancia: 0.5,
      unidade: 'W',
      erros: limpar([{ valor: P / 2, frase: 'Você supôs que a potência cai pela metade junto com a tensão. Como P = V²/R, a potência cai com o quadrado da tensão: metade da tensão dá um quarto da potência.', motivo: 'achou que P é proporcional a V' }, { valor: P, frase: 'A potência de um aparelho com resistência fixa depende da tensão aplicada: P = V²/R. Com a tensão menor, a potência muda.', motivo: 'achou que a potência não muda' }, { valor: P * 4, frase: 'Você inverteu o sentido: a tensão caiu, então a potência cai (por um fator 4), e não aumenta.', motivo: 'inverteu o sentido da variação' }], novo, 0.5),
      resolucao: `R = V²/P = ${Vn}²/${fn(P, 0)} = ${fn((Vn * Vn) / P)} Ω. Nova potência: P' = V'²/R = ${Vnovo}²/${fn((Vn * Vn) / P)} = ${fn(novo, 0)} W. (A tensão caiu à metade e a potência a um quarto.)`,
      dicas: ['A resistência do chuveiro não muda.', 'Ache R pelos valores de fábrica: R = V²/P.', 'Use de novo P = V²/R com a tensão da tomada.'],
      licao: 'com R fixa, P = V²/R: a potência varia com o quadrado da tensão',
      dados: { aparelhos: [{ nome: 'Chuveiro', W: P, h: 0 }], dias: 30, variante: 'chuveiro-P' },
    }
  }
  if (v === 'chuveiro-R') {
    const P = escolher(rng, [2200, 4400, 5500, 6600])
    const Vn = 220
    const Rv = (Vn * Vn) / P
    return {
      enunciado: `Um chuveiro de ${fn(P, 0)} W / ${Vn} V tem a resistência elétrica de aquecimento de quantos ohms?`,
      resposta: Rv,
      tolerancia: 0.05,
      unidade: 'Ω',
      erros: limpar([{ valor: Vn / P, frase: 'Você dividiu a tensão pela potência. A resistência sai de P = V²/R, ou seja, R = V²/P.', motivo: 'usou V/P' }, { valor: P / (Vn * Vn), frase: 'Você inverteu a fórmula: R = V²/P, com a tensão ao quadrado no numerador.', motivo: 'inverteu a fórmula' }, { valor: P / Vn, frase: `${fn(P / Vn)} é a corrente do chuveiro (i = P/V), e não a resistência. Depois de achar i, falta R = V/i.`, motivo: 'deu a corrente em vez da resistência' }], Rv, 0.05),
      resolucao: `P = V²/R, então R = V²/P = ${Vn}²/${fn(P, 0)} = ${fn(Rv)} Ω. (Outro caminho: i = P/V = ${fn(P / Vn)} A e R = V/i = ${fn(Rv)} Ω.)`,
      dicas: ['Duas fórmulas ligam P, V e R: P = V·i e V = R·i.', 'Combine as duas: P = V²/R.', 'Isole R.'],
      licao: 'P = V²/R, logo R = V²/P',
      dados: { aparelhos: [{ nome: 'Chuveiro', W: P, h: 0 }], dias: 30, variante: 'chuveiro-R' },
    }
  }
  // economia ao trocar lâmpadas
  const lista: { n: number; Wv: number; Wn: number; h: number; tarifa: number }[] = []
  for (const n of [5, 8, 10, 12]) for (const Wv of [60, 100]) for (const Wn of [9, 10, 12, 15]) for (const h of [4, 5, 6]) for (const tarifa of [0.6, 0.8, 1]) {
    if (bonito(((Wv - Wn) * n * h * 30 * tarifa) / 1000, 2)) lista.push({ n, Wv, Wn, h, tarifa })
  }
  const { n, Wv, Wn, h, tarifa } = escolher(rng, lista)
  const eco = (((Wv - Wn) * n * h * 30) / 1000) * tarifa
  return {
    enunciado: `Uma casa troca ${n} lâmpadas incandescentes de ${Wv} W por ${n} lâmpadas LED de ${Wn} W. Cada lâmpada fica acesa ${h} horas por dia. Com 30 dias no mês e tarifa de R$ ${fn(tarifa)} por kWh, quanto a casa economiza por mês, em reais?`,
    resposta: eco,
    tolerancia: 0.01,
    unidade: 'R$',
    erros: limpar([{ valor: ((Wv - Wn) * h * 30 * tarifa) / 1000, frase: 'Você calculou a economia de uma lâmpada só. Faltou multiplicar pelo número de lâmpadas.', motivo: 'esqueceu o número de lâmpadas' }, { valor: eco * 1000, frase: 'Você esqueceu de converter Wh em kWh (dividir por 1.000).', motivo: 'esqueceu de converter Wh em kWh' }, { valor: (Wv * n * h * 30 * tarifa) / 1000, frase: 'Esse valor é o custo das lâmpadas antigas. A economia é a diferença entre o custo antigo e o novo.', motivo: 'deu o custo, não a economia' }, { valor: eco / 30, frase: 'Esse valor é a economia de um dia só. Faltou multiplicar pelos 30 dias.', motivo: 'esqueceu de multiplicar pelos dias' }], eco, 0.01),
    resolucao: `Diferença de potência por lâmpada: ${Wv} − ${Wn} = ${Wv - Wn} W. Das ${n} lâmpadas: ${(Wv - Wn) * n} W. Energia economizada no mês: ${(Wv - Wn) * n} W · ${h * 30} h = ${fn((Wv - Wn) * n * h * 30, 0)} Wh = ${fn(((Wv - Wn) * n * h * 30) / 1000)} kWh. Economia: ${fn(((Wv - Wn) * n * h * 30) / 1000)} · ${fn(tarifa)} = R$ ${fn(eco)}.`,
    dicas: ['Calcule quantos watts a troca economiza no total.', 'Multiplique pelas horas no mês e converta Wh em kWh.', 'Multiplique os kWh economizados pela tarifa.'],
    licao: 'economia = (P antiga − P nova) × tempo × tarifa',
    dados: { aparelhos: [{ nome: `${n} lâmpadas incandescentes`, W: Wv * n, h }, { nome: `${n} lâmpadas LED`, W: Wn * n, h }], dias: 30, tarifa, variante: 'economia' },
  }
}
