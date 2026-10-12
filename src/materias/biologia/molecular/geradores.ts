import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, lista, montar, type ItemBanco, type Opc } from '../comum/auxiliares'
import {
  CODONS,
  NOMES_AMINOACIDOS,
  bandasMeselson,
  chargaff,
  ciclosParaAlvo,
  classificarMutacao,
  codonsDe,
  complementarDNA,
  copiasAposCiclos,
  degenerescencia,
  duracaoTotal,
  fragmentos,
  inserir,
  ligacoesHidrogenio,
  moleculasComN15,
  moleculasNaGeracao,
  peptideoTexto,
  remover,
  transcreverDaCodificadora,
  transcreverDoMolde,
  transcricaoLac,
  traduzir,
  type MutacaoLac,
  type TipoMutacao,
} from './calculo'

export type { ItemBanco }

/* ------------------------------------------------------------------ utilidades */

const CODONS_SENTIDO = Object.keys(CODONS).filter((c) => CODONS[c] !== '*')
const aleatorios = (rng: Rng, n: number) => Array.from({ length: n }, () => escolher(rng, CODONS_SENTIDO))
const ext5 = (seq: string) => `5′-${seq}-3′`
const ext3 = (seq: string) => `3′-${seq}-5′`
const pep = (aa: string[]) => (aa.length ? peptideoTexto(aa) : '(nenhum aminoácido)')
const nomeAA = (a: string) => (NOMES_AMINOACIDOS[a] as { tres: string; nome: string }).nome
/** Mantém só as candidatas diferentes entre si e da certa, na ordem em que aparecem. */
function distintas<T extends { texto: string }>(certa: string, candidatas: T[]): T[] {
  const vistos = new Set([certa])
  return candidatas.filter((c) => (vistos.has(c.texto) ? false : (vistos.add(c.texto), true)))
}

/** Troca a segunda base por outra diferente (erro de um pareamento). */
const substituirUma = (seq: string) => `${seq.slice(0, 1)}${seq[1] === 'U' ? 'C' : 'U'}${seq.slice(2)}`

export interface Sequencia {
  rotulo: string
  seq: string
}

/* ================================================================== do DNA ao mRNA */

export interface DadosTranscricao {
  tipo: 'molde' | 'codificadora' | 'qualMolde'
  dadas: Sequencia[]
}

export function gerarTranscricao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosTranscricao> {
  const dicas = ['A RNA polimerase lê a fita molde de 3′ para 5′ e sintetiza o mRNA de 5′ para 3′.', 'O mRNA é complementar à fita molde (A–U, T–A, C–G, G–C) e igual à fita codificadora, com U no lugar de T.', 'O RNA não tem timina (T): usa uracila (U).']
  const licao = 'Transcrição: mRNA complementar à fita molde (A–U, T–A, G–C, C–G) e igual à codificadora, com U no lugar de T. O RNA tem uracila, e não timina.'
  if (nivel === 1) {
    const n = sortear(rng, 3, 4)
    const cods = aleatorios(rng, n).join('')
    // molde 3'→5' = complementar da codificadora
    const molde = complementarDNA(cods.replace(/U/g, 'T').replace(/[^ACGT]/g, ''))
    const mrna = transcreverDoMolde(molde)
    const candidatas = distintas(mrna, [
      { texto: complementarDNA(molde), porque: `A sequência tem timina (T): o RNA tem uracila (U) no lugar. Além disso, ${complementarDNA(molde)} é a fita codificadora do DNA, e não o mRNA.`, motivo: 'manteve T no RNA' },
      { texto: molde.replace(/T/g, 'U'), porque: 'Você copiou a fita molde trocando T por U. O mRNA é COMPLEMENTAR ao molde (A–U, T–A, G–C, C–G), e não igual a ele.', motivo: 'copiou o molde em vez de complementar' },
      { texto: [...mrna].reverse().join(''), porque: 'Está escrita ao contrário. A fita molde é lida de 3′ para 5′, e o mRNA é lido de 5′ para 3′, no sentido oposto: as bases devem ser conferidas uma a uma, na mesma ordem.', motivo: 'inverteu o sentido da leitura' },
      { texto: transcreverDoMolde(complementarDNA(molde)), porque: 'Você complementou duas vezes: isso devolve a sequência do molde (com U), e não o mRNA.', motivo: 'complementou duas vezes' },
      { texto: substituirUma(mrna), porque: 'Uma das bases não está pareada corretamente com o molde. Confira cada par: A–U, T–A, G–C e C–G.', motivo: 'errou um pareamento' },
    ])
    return montar<DadosTranscricao>(
      rng,
      { texto: ext5(mrna), porque: `Cada base do molde é pareada com a do RNA: ${[...molde].map((b, i) => `${b}→${mrna[i]}`).join(' ')}.` },
      candidatas.slice(0, 3).map((c) => ({ ...c, texto: ext5(c.texto) })),
      {
        enunciado: `Um trecho de gene tem a fita molde ${ext3(molde)}. Qual é a sequência do mRNA formado na transcrição?`,
        resolucao: `mRNA complementar ao molde: ${ext3(molde)} → ${ext5(mrna)}.`,
        dicas,
        licao,
        dados: { tipo: 'molde', dadas: [{ rotulo: 'Fita molde (3′→5′)', seq: molde }] },
      },
    )
  }
  if (nivel === 2) {
    const cod = aleatorios(rng, sortear(rng, 3, 4)).join('').replace(/U/g, 'T')
    const mrna = transcreverDaCodificadora(cod)
    const candidatas = distintas(mrna, [
      { texto: cod, porque: 'É a própria fita codificadora do DNA, com timina. O RNA tem uracila (U) no lugar de T.', motivo: 'manteve T no RNA' },
      { texto: complementarDNA(cod).replace(/T/g, 'U'), porque: 'Você complementou a fita codificadora. O mRNA é igual à CODIFICADORA (com U) e complementar ao molde.', motivo: 'complementou a codificadora' },
      { texto: complementarDNA(cod), porque: 'É a fita molde (complementar da codificadora), com T. O mRNA é igual à codificadora, com U no lugar de T.', motivo: 'deu a fita molde' },
      { texto: [...mrna].reverse().join(''), porque: 'Está escrita no sentido oposto: o mRNA tem a mesma ordem das bases da fita codificadora (5′ → 3′).', motivo: 'inverteu o sentido da leitura' },
      { texto: substituirUma(mrna), porque: 'Uma das bases não confere com a fita codificadora: o mRNA é igual a ela, com U no lugar de T.', motivo: 'errou uma base' },
    ])
    return montar<DadosTranscricao>(
      rng,
      { texto: ext5(mrna), porque: 'O mRNA tem a mesma sequência da fita codificadora, com U no lugar de T.' },
      candidatas.slice(0, 3).map((c) => ({ ...c, texto: ext5(c.texto) })),
      {
        enunciado: `A fita codificadora de um gene é ${ext5(cod)}. Qual é a sequência do mRNA transcrito a partir desse gene?`,
        resolucao: `mRNA = codificadora com U no lugar de T: ${ext5(cod)} → ${ext5(mrna)}.`,
        dicas,
        licao,
        dados: { tipo: 'codificadora', dadas: [{ rotulo: 'Fita codificadora (5′→3′)', seq: cod }] },
      },
    )
  }
  // nível 3: qual fita foi molde
  const cod = aleatorios(rng, sortear(rng, 3, 4)).join('').replace(/U/g, 'T')
  const molde = complementarDNA(cod)
  const mrna = transcreverDaCodificadora(cod)
  const cima = rng() < 0.5
  const topo = cima ? cod : molde // fita de cima, lida 5'→3'
  const base = cima ? molde : cod // fita de baixo, lida 3'→5'
  const certa = cima ? 'A fita de baixo' : 'A fita de cima'
  return montar<DadosTranscricao>(
    rng,
    { texto: certa, porque: `O mRNA (${ext5(mrna)}) é complementar a ela: ${certa === 'A fita de baixo' ? 'a fita de baixo' : 'a fita de cima'} é a molde. A outra fita é igual ao mRNA (com T no lugar de U): é a codificadora.` },
    [
      { texto: cima ? 'A fita de cima' : 'A fita de baixo', porque: 'Essa fita é igual ao mRNA (com T no lugar de U): é a fita codificadora, que não é lida pela RNA polimerase.', motivo: 'confundiu molde com codificadora' },
      { texto: 'As duas, ao mesmo tempo', porque: 'Para um mesmo gene, só uma das fitas serve de molde; a outra tem a sequência igual à do mRNA.', motivo: 'achou que as duas fitas são transcritas' },
      { texto: 'Nenhuma: o mRNA se forma sem molde', porque: 'A RNA polimerase sempre usa uma fita de DNA como molde para sintetizar o RNA.', motivo: 'achou que não há molde' },
    ],
    {
      enunciado: `Um trecho de DNA de fita dupla é transcrito e forma o mRNA ${ext5(mrna)}. Qual das fitas do DNA, mostradas abaixo, serviu de molde para a RNA polimerase?`,
      resolucao: `O mRNA é complementar à fita molde e igual à codificadora (com U). Comparando ${ext5(mrna)} com as fitas, a de ${cima ? 'baixo' : 'cima'} é a complementar: é a molde.`,
      dicas,
      licao,
      dados: {
        tipo: 'qualMolde',
        dadas: [
          { rotulo: 'Fita de cima (5′→3′)', seq: topo },
          { rotulo: 'Fita de baixo (3′→5′)', seq: base },
        ],
      },
    },
  )
}

/* ================================================================== do mRNA à proteína */

export interface DadosTraducao {
  tipo: 'mrna' | 'codificadora' | 'molde'
  dadas: Sequencia[]
}

/** Peptídeo lido a partir do primeiro AUG, até o códon de parada. */
const peptideoDe = (mrna: string) => traduzir(mrna).peptideo

export function gerarTraducao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosTraducao> {
  const dicas = ['Procure o primeiro AUG (início) e leia de 3 em 3 bases.', 'Use a tabela do código genético para cada códon.', 'Pare no códon de parada (UAA, UAG ou UGA): ele não codifica aminoácido.']
  const licao = 'Tradução: o ribossomo lê o mRNA de 5′ para 3′, de 3 em 3 bases, a partir do AUG (Met) até um códon de parada (UAA, UAG, UGA).'
  const stop = escolher(rng, ['UAA', 'UAG', 'UGA'])
  // gera um mRNA cujo peptídeo (do 1º AUG) tem pelo menos 3 aminoácidos e sem AUG repetido antes do final
  const lider = nivel === 1 ? '' : escolher(rng, ['GGA', 'GCCA', 'CAC', 'GG'])
  // os códons do corpo nunca são de parada, então o peptídeo tem sempre 1 (Met) + nº de códons do corpo
  const corpo = aleatorios(rng, nivel === 3 ? 4 : 3).join('')
  const mrna = `${lider}AUG${corpo}${stop}`
  const certo = peptideoDe(mrna)
  const textoCerto = pep(certo)
  // distratores, cada um com a causa do erro
  const inicioAUG = mrna.indexOf('AUG')
  const deslocada = traduzir(mrna.slice(inicioAUG + 1), false).peptideo // quadro deslocado de 1 base
  const complementar = traduzir(complementarDNA(mrna.replace(/U/g, 'T')).replace(/T/g, 'U'), false).peptideo
  const candidatas = distintas(textoCerto, [
    { texto: pep([...certo].reverse()), porque: 'Os aminoácidos estão na ordem inversa. O ribossomo lê o mRNA de 5′ para 3′, e o peptídeo cresce da extremidade amino (Met) para a carboxila.', motivo: 'inverteu a ordem' } as Opc,
    { texto: pep(deslocada.slice(0, certo.length)), porque: 'Você começou a ler uma base depois do AUG (quadro de leitura errado). A leitura precisa começar exatamente no A do AUG e seguir de 3 em 3.', motivo: 'errou o quadro de leitura' } as Opc,
    { texto: pep(complementar.slice(0, certo.length)), porque: 'Você traduziu a sequência complementar do mRNA. O ribossomo lê o próprio mRNA, e não a fita molde do DNA.', motivo: 'traduziu a fita complementar' } as Opc,
    { texto: pep(certo.slice(1)), porque: 'O primeiro aminoácido é a metionina (Met), codificada pelo AUG de iniciação, e ela faz parte do peptídeo inicial.', motivo: 'omitiu a metionina inicial' } as Opc,
    { texto: pep([...certo, escolher(rng, ['L', 'S', 'G', 'A'])]), porque: 'Há um aminoácido a mais no fim: o códon de parada não codifica aminoácido e encerra a tradução.', motivo: 'incluiu aminoácido depois do códon de parada' } as Opc,
  ]).filter((c) => c.texto !== '(nenhum aminoácido)')
  const erradas = candidatas.slice(0, 3)
  if (nivel === 1) {
    return montar<DadosTraducao>(rng, { texto: textoCerto, porque: `${codonsLista(mrna)}.` }, erradas, {
      enunciado: `Um mRNA tem a sequência ${ext5(mrna)}. Qual é o peptídeo formado na tradução?`,
      resolucao: `A tradução começa no AUG e termina no códon de parada. ${codonsLista(mrna)}.`,
      dicas,
      licao,
      dados: { tipo: 'mrna', dadas: [{ rotulo: 'mRNA (5′→3′)', seq: mrna }] },
    })
  }
  if (nivel === 2) {
    const cod = mrna.replace(/U/g, 'T')
    return montar<DadosTraducao>(rng, { texto: textoCerto, porque: `${codonsLista(mrna)}.` }, erradas, {
      enunciado: `A fita codificadora de um gene é ${ext5(cod)}. Considerando o primeiro códon de iniciação (ATG) e a transcrição e a tradução desse gene, qual é o peptídeo sintetizado?`,
      resolucao: `mRNA = codificadora com U: ${ext5(mrna)}. ${codonsLista(mrna)}.`,
      dicas,
      licao,
      dados: { tipo: 'codificadora', dadas: [{ rotulo: 'Fita codificadora (5′→3′)', seq: cod }] },
    })
  }
  const molde = complementarDNA(mrna.replace(/U/g, 'T'))
  return montar<DadosTraducao>(rng, { texto: textoCerto, porque: `O mRNA complementar ao molde é ${ext5(mrna)}. ${codonsLista(mrna)}.` }, erradas, {
    enunciado: `A fita molde de um gene é ${ext3(molde)}. Qual é o peptídeo formado na tradução do mRNA transcrito a partir dela?`,
    resolucao: `mRNA complementar ao molde: ${ext5(mrna)}. ${codonsLista(mrna)}.`,
    dicas: ['Primeiro faça a transcrição: o mRNA é complementar ao molde.', ...dicas.slice(0, 2)],
    licao,
    dados: { tipo: 'molde', dadas: [{ rotulo: 'Fita molde (3′→5′)', seq: molde }] },
  })
}

function codonsLista(mrna: string): string {
  const t = traduzir(mrna)
  const cods: string[] = []
  for (let i = t.inicio; i + 3 <= mrna.length; i += 3) cods.push(mrna.slice(i, i + 3))
  return `Códons: ${cods.map((c) => `${c} (${CODONS[c] === '*' ? 'parada' : (NOMES_AMINOACIDOS[CODONS[c] as string] as { tres: string }).tres})`).join(', ')}`
}

/* ================================================================== mutações */

export interface DadosMutacao {
  tipo: 'codon' | 'peptideos' | 'impacto' | 'cenario'
  dadas: Sequencia[]
  tipoMutacao?: TipoMutacao
}

const NOME_MUTACAO: Record<string, string> = {
  silenciosa: 'Mutação silenciosa',
  troca: 'Mutação de troca de sentido (missense)',
  semSentido: 'Mutação sem sentido (nonsense)',
  quadro: 'Mudança no quadro de leitura (frameshift)',
}

function explicaTipo(t: string, ctx: { antes?: string; depois?: string }): string {
  switch (t) {
    case 'silenciosa':
      return `${ctx.antes} e ${ctx.depois} codificam o mesmo aminoácido (código degenerado): a proteína não muda.`
    case 'troca':
      return `A mudança troca um aminoácido por outro (${ctx.antes} → ${ctx.depois}): a proteína tem o mesmo tamanho, mas um aminoácido diferente.`
    case 'semSentido':
      return `A mudança cria um códon de parada onde havia um aminoácido: a proteína fica truncada.`
    default:
      return 'A inserção ou perda de bases (não múltiplas de 3) desloca o quadro de leitura e altera todos os aminoácidos seguintes.'
  }
}

export const BANCO_MUTACOES: { nivel: Nivel; item: ItemBanco }[] = [
  {
    nivel: 3,
    item: {
      pergunta: 'A anemia falciforme é causada por uma substituição de uma base no gene da cadeia β da hemoglobina (GAG → GTG no DNA), que troca o ácido glutâmico por valina. Esse é um exemplo de mutação:',
      certa: { texto: 'De troca de sentido (missense): um aminoácido é trocado por outro, e a proteína mantém o tamanho.', porque: 'GAG (Glu) → GUG no mRNA (Val): só um aminoácido muda, mas a hemoglobina alterada forma polímeros em baixa oxigenação e deforma as hemácias.' },
      erradas: [
        { texto: 'Silenciosa: o aminoácido não muda.', porque: 'Houve troca de aminoácido (Glu → Val), então não é silenciosa.', motivo: 'ignorou a troca de aminoácido' },
        { texto: 'Sem sentido: surge um códon de parada.', porque: 'GUG codifica valina; não é códon de parada.', motivo: 'confundiu com mutação sem sentido' },
        { texto: 'De mudança de quadro: bases foram inseridas ou perdidas.', porque: 'Houve substituição de uma base por outra, sem inserção nem perda, e o quadro de leitura continua o mesmo.', motivo: 'confundiu substituição com mudança de quadro' },
      ],
      licao: 'Substituição que troca um aminoácido por outro = missense. Pequenas diferenças no gene podem ter grandes efeitos na proteína.',
      dicas: ['Compare os aminoácidos antes e depois.', 'O tamanho da proteína mudou?', 'Procure inserção ou perda de bases.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Qual mutação pode ser transmitida aos filhos?',
      certa: { texto: 'Uma mutação em células germinativas (que originam os gametas).', porque: 'Mutações nas células da linhagem germinativa podem estar presentes no zigoto e em todas as células do descendente.' },
      erradas: [
        { texto: 'Qualquer mutação em células do corpo, como as da pele.', porque: 'Mutações somáticas ficam restritas à pessoa (e a suas células descendentes), e não passam aos filhos.', motivo: 'confundiu mutação somática com germinativa' },
        { texto: 'Somente as mutações causadas por radiação.', porque: 'A origem (radiação, produtos químicos ou erro de replicação) não define se é herdada; o que define é se ocorreu em células germinativas.', motivo: 'ligou a herança à causa da mutação' },
        { texto: 'Nenhuma: as mutações nunca são herdadas.', porque: 'Mutações em células germinativas são a fonte de variabilidade genética herdada.', motivo: 'achou que mutações não são herdadas' },
      ],
      licao: 'Só mutações em células germinativas são herdáveis. As somáticas afetam o indivíduo, como em muitos cânceres.',
      dicas: ['De que células vêm os gametas?', 'Uma mutação na pele chega aos óvulos?', 'A causa não define a herança.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Por que uma mutação de substituição no terceiro nucleotídeo de um códon tem, em geral, menos chance de alterar a proteína que uma no primeiro?',
      certa: { texto: 'Porque o código genético é degenerado e, em vários códons, a 3ª base pode mudar sem trocar o aminoácido.', porque: 'Em 8 famílias de 4 códons (como GCN para alanina), qualquer base na 3ª posição codifica o mesmo aminoácido.' },
      erradas: [
        { texto: 'Porque a terceira base não é lida pelo ribossomo.', porque: 'O ribossomo lê as três bases de cada códon. O que ocorre é a degenerescência do código.', motivo: 'achou que a 3ª base não é lida' },
        { texto: 'Porque o código genético é diferente em cada espécie.', porque: 'O código é praticamente universal; a explicação é a degenerescência.', motivo: 'achou que o código varia entre espécies' },
        { texto: 'Porque mutações na 3ª base nunca alteram o aminoácido.', porque: 'Há casos em que alteram (por exemplo, UGG → UGA, de triptofano para parada). Só “em geral” ocorre menos.', motivo: 'generalizou demais' },
      ],
      licao: 'Código degenerado: vários códons para o mesmo aminoácido; os sinônimos costumam diferir na 3ª base.',
      dicas: ['Quantos códons há para a alanina?', 'Em que posição eles diferem?', 'Se o aminoácido não muda, a proteína muda?'],
    },
  },
]

function mutacaoPorTipo(rng: Rng, tipo: 'silenciosa' | 'troca' | 'semSentido', corpo: string[]): { posicao: number; de: string; para: string } | null {
  // procura, no corpo do mRNA, uma substituição que produza o tipo pedido
  const tentativas = embaralhar(rng, corpo.flatMap((c, i) => [0, 1, 2].flatMap((k) => ['A', 'C', 'G', 'U'].filter((b) => b !== c[k]).map((b) => ({ i, k, b })))))
  for (const t of tentativas) {
    const original = corpo[t.i] as string
    const novo = original.slice(0, t.k) + t.b + original.slice(t.k + 1)
    const antes = CODONS[original]
    const depois = CODONS[novo]
    if (antes === '*') continue
    const ok = tipo === 'silenciosa' ? depois === antes : tipo === 'semSentido' ? depois === '*' : depois !== antes && depois !== '*'
    if (ok) return { posicao: t.i, de: original, para: novo }
  }
  return null
}

export function gerarMutacoes(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMutacao> {
  const TIPOS = ['silenciosa', 'troca', 'semSentido', 'quadro'] as const
  const DEFINICAO: Record<(typeof TIPOS)[number], string> = {
    silenciosa: 'o aminoácido não muda',
    troca: 'um aminoácido é trocado por outro, sem mudar o tamanho da proteína',
    semSentido: 'surge um códon de parada e a proteína fica mais curta',
    quadro: 'bases são inseridas ou perdidas (em número não múltiplo de 3) e o quadro de leitura se desloca',
  }
  const dicas = ['Compare o aminoácido original com o mutante.', 'A proteína ficou do mesmo tamanho, mais curta ou com aminoácidos trocados?', 'Mudança de quadro: inserção ou perda de bases que não são múltiplas de 3.']
  const licao = 'Silenciosa: mesmo aminoácido. Troca de sentido (missense): outro aminoácido. Sem sentido (nonsense): códon de parada. Mudança de quadro: inserção ou deleção de 1 ou 2 bases (ou não múltipla de 3).'
  const montaOpcoes = (certaChave: (typeof TIPOS)[number], ctx: { antes?: string; depois?: string }, enunciado: string, resolucao: string, dados: DadosMutacao) => {
    const certa = { texto: NOME_MUTACAO[certaChave] as string, porque: explicaTipo(certaChave, ctx) }
    const erradas: Opc[] = TIPOS.filter((t) => t !== certaChave).map((t) => ({
      texto: NOME_MUTACAO[t] as string,
      porque: `Seria ${(NOME_MUTACAO[t] as string).toLowerCase()} se ${DEFINICAO[t]}; não é o que ocorre aqui. ${explicaTipo(certaChave, ctx)}`,
      motivo: `confundiu com ${t === 'quadro' ? 'mudança de quadro' : t === 'semSentido' ? 'mutação sem sentido' : t === 'troca' ? 'troca de sentido' : 'mutação silenciosa'}`,
    }))
    return montar<DadosMutacao>(rng, certa, erradas, { enunciado, resolucao, dicas, licao, dados })
  }

  if (nivel === 1) {
    const tipo = escolher(rng, ['silenciosa', 'troca', 'semSentido'] as const)
    for (let t = 0; t < 40; t++) {
      const corpo = aleatorios(rng, 3)
      const m = mutacaoPorTipo(rng, tipo, corpo)
      if (!m) continue
      const antes = `AUG${corpo.join('')}UAA`
      const depois = `AUG${corpo.map((c, i) => (i === m.posicao ? m.para : c)).join('')}UAA`
      if (classificarMutacao(antes, depois) !== tipo) continue
      const aa = (c: string) => (CODONS[c] === '*' ? 'parada' : nomeAA(CODONS[c] as string))
      return montaOpcoes(
        tipo,
        { antes: aa(m.de), depois: aa(m.para) },
        `Em um mRNA, o códon ${m.de} passou a ser ${m.para} por uma mutação de ponto (substituição de uma base). Que tipo de mutação é essa?`,
        `${m.de} codifica ${aa(m.de)}; ${m.para} codifica ${aa(m.para)}. ${explicaTipo(tipo, { antes: aa(m.de), depois: aa(m.para) })}`,
        { tipo: 'codon', dadas: [], tipoMutacao: tipo },
      )
    }
  }

  if (nivel === 2) {
    const tipo = escolher(rng, ['semSentido', 'troca', 'quadro'] as const)
    for (let t = 0; t < 60; t++) {
      const corpo = aleatorios(rng, 4)
      const original = `AUG${corpo.join('')}UAA`
      let mutante: string
      let descricao: string
      if (tipo === 'quadro') {
        const pos = 3 + 3 * sortear(rng, 0, 1)
        if (rng() < 0.5) {
          const b = escolher(rng, ['A', 'C', 'G', 'U'])
          mutante = inserir(original, pos, b)
          descricao = `inserção de uma base (${b}) depois da posição ${pos}`
        } else {
          mutante = remover(original, pos, 1)
          descricao = `perda de uma base na posição ${pos + 1}`
        }
      } else {
        const m = mutacaoPorTipo(rng, tipo, corpo)
        if (!m) continue
        mutante = `AUG${corpo.map((c, i) => (i === m.posicao ? m.para : c)).join('')}UAA`
        descricao = `substituição do códon ${m.de} por ${m.para}`
      }
      if (classificarMutacao(original, mutante) !== tipo) continue
      const po = traduzir(original).peptideo
      const pm = traduzir(mutante).peptideo
      if (tipo === 'troca' && pm.length !== po.length) continue
      if (tipo === 'semSentido' && !(pm.length < po.length)) continue
      return montaOpcoes(
        tipo,
        { antes: 'o códon original', depois: 'o mutante' },
        `Um gene produz o peptídeo ${pep(po)}. Após uma mutação (${descricao}), a sequência do mRNA passou de ${ext5(original)} para ${ext5(mutante)}, e o peptídeo sintetizado passou a ser ${pep(pm)}. Que tipo de mutação ocorreu?`,
        `Peptídeo original: ${pep(po)}; mutante: ${pep(pm)}. ${explicaTipo(tipo, { antes: 'o aminoácido original', depois: 'o novo' })}`,
        { tipo: 'peptideos', dadas: [{ rotulo: 'mRNA original (5′→3′)', seq: original }, { rotulo: 'mRNA mutante (5′→3′)', seq: mutante }], tipoMutacao: tipo },
      )
    }
  }

  if (nivel === 3 && rng() < 0.45) {
    const { item } = escolher(rng, BANCO_MUTACOES)
    return montar<DadosMutacao>(rng, item.certa, item.erradas, { enunciado: item.pergunta, resolucao: item.certa.porque, dicas: item.dicas, licao: item.licao, dados: { tipo: 'cenario', dadas: [] } })
  }

  // nível 3 (e recuperação): qual mutação teria o efeito mais drástico?
  for (let t = 0; t < 200; t++) {
    const corpo = aleatorios(rng, 5)
    const original = `AUG${corpo.join('')}UAA`
    const po = traduzir(original).peptideo
    const sil = mutacaoPorTipo(rng, 'silenciosa', corpo)
    const troca = mutacaoPorTipo(rng, 'troca', corpo)
    if (!sil || !troca) continue
    const candidatas: { texto: string; mutante: string; tipo: string }[] = [
      { texto: `Substituição do códon ${sil.de} por ${sil.para} (códon ${sil.posicao + 2} do mRNA)`, mutante: `AUG${corpo.map((c, i) => (i === sil.posicao ? sil.para : c)).join('')}UAA`, tipo: 'silenciosa' },
      { texto: `Substituição do códon ${troca.de} por ${troca.para} (códon ${troca.posicao + 2} do mRNA)`, mutante: `AUG${corpo.map((c, i) => (i === troca.posicao ? troca.para : c)).join('')}UAA`, tipo: 'troca' },
      { texto: 'Inserção de 3 bases entre o 2º e o 3º códon', mutante: inserir(original, 6, 'GGC'), tipo: 'insercaoNoQuadro' },
      { texto: 'Inserção de 1 base logo depois do AUG', mutante: inserir(original, 3, escolher(rng, ['A', 'C', 'G', 'U'])), tipo: 'quadro' },
    ]
    const impacto = (mutante: string) => {
      const pm = traduzir(mutante).peptideo
      let diff = Math.abs(pm.length - po.length)
      for (let i = 0; i < Math.min(pm.length, po.length); i++) if (pm[i] !== po[i]) diff++
      return diff
    }
    const impactos = candidatas.map((c) => impacto(c.mutante))
    const maior = Math.max(...impactos)
    if (impactos.filter((x) => x === maior).length !== 1) continue
    const idxMaior = impactos.indexOf(maior)
    if (candidatas[idxMaior]!.tipo !== 'quadro') continue
    const certa = candidatas[idxMaior] as (typeof candidatas)[number]
    const erradas = candidatas
      .filter((_, i) => i !== idxMaior)
      .map((c) => {
        const i = candidatas.indexOf(c)
        return {
          texto: c.texto,
          porque: `${c.tipo === 'silenciosa' ? 'É silenciosa: o aminoácido não muda.' : c.tipo === 'troca' ? 'Troca um só aminoácido; o resto da proteína permanece igual.' : 'Insere um aminoácido a mais, sem alterar os demais (o quadro de leitura se mantém).'} Altera ${impactos[i]} posição${impactos[i] === 1 ? '' : 'ões'} do peptídeo, menos que a inserção de 1 base.`,
          motivo: 'efeito menor que a mudança de quadro',
        } as Opc
      })
    const pmCerta = traduzir(certa.mutante).peptideo
    return montar<DadosMutacao>(rng, { texto: certa.texto, porque: `Inserir 1 base desloca o quadro de leitura: o peptídeo passa de ${pep(po)} para ${pep(pmCerta)}, com ${maior} alterações. É a mudança mais drástica.` }, erradas, {
      enunciado: `Um gene produz o peptídeo ${pep(po)}, a partir do mRNA ${ext5(original)}. Qual destas mutações tem o efeito mais drástico sobre o peptídeo?`,
      resolucao: `Mudanças de quadro (inserção ou perda de 1 ou 2 bases) alteram todos os aminoácidos seguintes; substituições alteram no máximo um aminoácido, e inserções de múltiplos de 3 bases só acrescentam aminoácidos.`,
      dicas: ['Compare quantos aminoácidos mudam em cada caso.', 'Inserção ou perda de bases não múltiplas de 3 desloca todo o quadro de leitura.', 'Substituições alteram, no máximo, um códon.'],
      licao,
      dados: { tipo: 'impacto', dadas: [{ rotulo: 'mRNA original (5′→3′)', seq: original }] },
    })
  }
  // recuperação: sempre há um item do banco
  const { item } = BANCO_MUTACOES[0] as (typeof BANCO_MUTACOES)[number]
  return montar<DadosMutacao>(rng, item.certa, item.erradas, { enunciado: item.pergunta, resolucao: item.certa.porque, dicas: item.dicas, licao: item.licao, dados: { tipo: 'cenario', dadas: [] } })
}

/* ================================================================== código genético (numérico) */

export interface DadosCodigo {
  variante: 'degenerescencia' | 'tamanho' | 'possibilidades'
  aminoacidos?: string[]
  extra?: Record<string, number>
}

const AA_COM_NOME = Object.keys(NOMES_AMINOACIDOS).filter((a) => a !== '*')

export function gerarCodigo(rng: Rng, nivel: Nivel): InstanciaNum<DadosCodigo> {
  const tol = 0.01
  if (nivel === 1) {
    const aa = escolher(rng, AA_COM_NOME.filter((a) => degenerescencia(a) >= 2))
    const resposta = degenerescencia(aa)
    return {
      enunciado: `Quantos códons diferentes do código genético codificam o aminoácido ${nomeAA(aa)}?`,
      resposta,
      tolerancia: tol,
      unidade: 'códons',
      erros: limpar(
        [
          { valor: 1, frase: `${nomeAA(aa)} não tem um só códon: o código é degenerado (mais de um códon por aminoácido), com exceção de metionina e triptofano.`, motivo: 'achou que há um códon por aminoácido' },
          { valor: 3, frase: '3 é o número de bases de um códon, e não o número de códons que codificam o aminoácido.', motivo: 'confundiu bases por códon com número de códons' },
          { valor: 4, frase: `Há aminoácidos com 4 códons (os de “família” de 4, como a alanina), mas ${nomeAA(aa)} tem ${resposta}.`, motivo: 'generalizou a partir de outro aminoácido' },
          { valor: 6, frase: `Só leucina, serina e arginina têm 6 códons; ${nomeAA(aa)} tem ${resposta}.`, motivo: 'generalizou a partir de outro aminoácido' },
          { valor: 61, frase: '61 é o total de códons que codificam aminoácidos (de todos os 20), e não os de um aminoácido só.', motivo: 'deu o total de códons com sentido' },
          { valor: 64, frase: '64 é o total de códons possíveis (4³), com os 3 de parada.', motivo: 'deu o total de códons possíveis' },
        ],
        resposta,
        tol,
      ),
      resolucao: `${nomeAA(aa)} é codificada por ${codonsDe(aa).join(', ')}: ${resposta} códons.`,
      dicas: ['O código genético é degenerado.', 'Procure o aminoácido na tabela de códons.', 'Conte todas as casas em que ele aparece.'],
      licao: 'Há 64 códons: 61 codificam os 20 aminoácidos (a maioria com mais de um códon, os sinônimos) e 3 são de parada. Metionina (AUG) e triptofano (UGG) têm um só.',
      dados: { variante: 'degenerescencia', aminoacidos: [aa] },
    }
  }
  if (nivel === 2) {
    const n = escolher(rng, [50, 100, 120, 150, 200, 250, 300, 500])
    const variante = escolher(rng, ['mrna', 'pares', 'duplaFita'] as const)
    const incluindoParada = rng() < 0.65
    const base = (incluindoParada ? n + 1 : n) * 3 // nucleotídeos de uma fita da região codificadora
    const resposta = variante === 'duplaFita' ? base * 2 : base
    const sufixo = incluindoParada ? ', contando o códon de parada' : ', sem contar o códon de parada'
    const pergunta =
      variante === 'mrna'
        ? `Quantos nucleotídeos tem a região codificadora do mRNA${sufixo}?`
        : variante === 'pares'
          ? `Quantos pares de bases tem, no mínimo, o trecho de DNA que codifica essa proteína${sufixo}?`
          : `Quantos nucleotídeos, ao todo (somando as duas fitas), tem o trecho de DNA de fita dupla que codifica essa proteína${sufixo}?`
    const outroSemParada = (incluindoParada ? n : n + 1) * 3
    return {
      enunciado: `Uma proteína tem ${fn(n, 0)} aminoácidos. ${pergunta} (Ignore íntrons e regiões não traduzidas.)`,
      resposta,
      tolerancia: tol,
      unidade: variante === 'pares' ? 'pares de bases' : 'nucleotídeos',
      erros: limpar(
        [
          { valor: n, frase: `${fn(n, 0)} é o número de aminoácidos. Cada aminoácido é codificado por um códon, de 3 nucleotídeos.`, motivo: 'deu o número de aminoácidos' },
          { valor: outroSemParada * (variante === 'duplaFita' ? 2 : 1), frase: incluindoParada ? 'Faltou o códon de parada: ele não codifica aminoácido, mas ocupa 3 nucleotídeos no mRNA e no DNA.' : 'Esse valor inclui o códon de parada, que o enunciado manda desconsiderar.', motivo: incluindoParada ? 'esqueceu o códon de parada' : 'incluiu o códon de parada' },
          ...(variante === 'duplaFita'
            ? [{ valor: base, frase: 'Esse é o número de nucleotídeos de UMA fita. O DNA de fita dupla tem duas fitas, então o total de nucleotídeos é o dobro.', motivo: 'contou só uma fita' }]
            : [{ valor: base * 2, frase: variante === 'pares' ? 'Um par de bases é formado por um nucleotídeo de cada fita: o número de pares é igual ao de nucleotídeos de UMA fita, e não o dobro.' : 'O mRNA tem uma só fita: não se dobra o número de nucleotídeos.', motivo: 'dobrou sem necessidade' }]),
          { valor: n * 3 * (variante === 'duplaFita' ? 2 : 1), frase: 'Ainda falta ou sobra o códon de parada, conforme o enunciado.', motivo: 'errou o tratamento do códon de parada' },
        ],
        resposta,
        tol,
      ),
      resolucao: `Cada aminoácido é codificado por 1 códon (3 nucleotídeos)${incluindoParada ? `, e o códon de parada também conta: (${fn(n, 0)} + 1) × 3 = ${fn(base, 0)}` : `: ${fn(n, 0)} × 3 = ${fn(base, 0)}`}.${variante === 'pares' ? ' O número de pares de bases é igual ao de nucleotídeos de uma fita.' : variante === 'duplaFita' ? ` No DNA de fita dupla há duas fitas: 2 × ${fn(base, 0)} = ${fn(resposta, 0)}.` : ''}`,
      dicas: ['1 aminoácido = 1 códon = 3 nucleotídeos.', 'O códon de parada não codifica aminoácido, mas ocupa 3 nucleotídeos.', 'Um par de bases é um nucleotídeo em cada fita.'],
      licao: 'Região codificadora = 3 × (nº de aminoácidos + 1 parada) nucleotídeos de uma fita. Em DNA de fita dupla, o número de pares de bases é igual a esse valor, e o de nucleotídeos totais é o dobro.',
      dados: { variante: 'tamanho', extra: { n, incluindoParada: incluindoParada ? 1 : 0, tipo: ['mrna', 'pares', 'duplaFita'].indexOf(variante) } },
    }
  }
  // nível 3: quantas sequências de mRNA codificam o peptídeo
  const k = sortear(rng, 3, 4)
  const aas = Array.from({ length: k }, () => escolher(rng, AA_COM_NOME))
  const resposta = aas.reduce((p, a) => p * degenerescencia(a), 1)
  const nomes = aas.map((a) => (NOMES_AMINOACIDOS[a] as { tres: string }).tres).join('-')
  const soma = aas.reduce((s, a) => s + degenerescencia(a), 0)
  return {
    enunciado: `Considerando o código genético, quantas sequências diferentes de mRNA (só a região codificadora, sem o códon de parada) podem codificar o peptídeo ${nomes}?`,
    resposta,
    tolerancia: tol,
    unidade: 'sequências',
    erros: limpar(
      [
        { valor: soma, frase: `${soma} é a SOMA dos números de códons de cada aminoácido. As escolhas de cada posição são independentes e se multiplicam.`, motivo: 'somou em vez de multiplicar' },
        { valor: k, frase: `${k} é só o número de aminoácidos. Cada aminoácido pode ser codificado por mais de um códon.`, motivo: 'deu o número de aminoácidos' },
        { valor: 1, frase: 'Se cada aminoácido tivesse um só códon, haveria uma sequência. Mas o código é degenerado: leucina, serina e arginina têm 6 códons cada, entre outros.', motivo: 'ignorou a degenerescência' },
        { valor: aas.reduce((p, a) => p * (degenerescencia(a) + 1), 1), frase: 'Você contou um códon a mais por aminoácido (talvez o de parada). Use só os códons que codificam cada aminoácido.', motivo: 'incluiu códons a mais' },
      ],
      resposta,
      tol,
    ),
    resolucao: `Números de códons: ${aas.map((a) => `${(NOMES_AMINOACIDOS[a] as { tres: string }).tres} = ${degenerescencia(a)}`).join('; ')}. Como as escolhas são independentes, multiplicam-se: ${aas.map((a) => degenerescencia(a)).join(' × ')} = ${fn(resposta, 0)}.`,
    dicas: ['Quantos códons codificam cada aminoácido?', 'A escolha do códon em cada posição é independente.', 'Multiplique os números de possibilidades.'],
    licao: 'Número de mRNAs que codificam um peptídeo = produto das degenerescências de cada aminoácido.',
    dados: { variante: 'possibilidades', aminoacidos: aas },
  }
}

/* ================================================================== DNA, composição e replicação (numérico) */

export interface DadosReplicacao {
  variante: 'chargaff' | 'meselson' | 'ligacoes' | 'consumo'
  extra?: Record<string, number>
}

export function gerarReplicacao(rng: Rng, nivel: Nivel): InstanciaNum<DadosReplicacao> {
  const tol = 0.1
  if (nivel === 1) {
    const a = escolher(rng, [15, 18, 20, 22, 24, 26, 28, 30, 32, 35])
    const c = chargaff(a)
    const pedido = escolher(rng, ['T', 'G', 'GC'] as const)
    const resposta = pedido === 'T' ? c.T : pedido === 'G' ? c.G : c.G + c.C
    const nome = pedido === 'GC' ? 'guanina + citosina (G + C)' : pedido === 'T' ? 'timina (T)' : 'guanina (G)'
    return {
      enunciado: `Em uma molécula de DNA de fita dupla, ${a} % das bases nitrogenadas são adenina (A). Qual é a porcentagem de ${nome}?`,
      resposta,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        pedido === 'T'
          ? [
              { valor: 100 - a, frase: `${fn(100 - a)} % é o que NÃO é adenina. Pela regra de Chargaff, A = T.`, motivo: 'deu o complemento de A' },
              { valor: c.G, frase: `${fn(c.G)} % é a porcentagem de guanina (e de citosina); a de timina é igual à de adenina.`, motivo: 'deu a porcentagem de G' },
              { valor: 100 - 2 * a, frase: `${fn(100 - 2 * a)} % é a soma de G + C. A timina pareia com a adenina, então T = A.`, motivo: 'deu G + C' },
            ]
          : pedido === 'G'
            ? [
                { valor: a, frase: `${fn(a)} % é a porcentagem de adenina (e de timina). G = C, e os dois juntos completam o que não é A nem T.`, motivo: 'repetiu a porcentagem de A' },
                { valor: 100 - 2 * a, frase: `${fn(100 - 2 * a)} % é a soma de G + C. G e C têm porcentagens iguais: cada uma é metade disso.`, motivo: 'deu G + C em vez de G' },
                { valor: 100 - a, frase: `${fn(100 - a)} % é o que não é adenina (T + G + C).`, motivo: 'deu o complemento de A' },
              ]
            : [
                { valor: c.G, frase: `${fn(c.G)} % é só a guanina. A pergunta pede G + C.`, motivo: 'deu só G' },
                { valor: 2 * a, frase: `${fn(2 * a)} % é A + T. A soma G + C é o que resta (100 − A − T).`, motivo: 'deu A + T' },
                { valor: 100 - a, frase: `${fn(100 - a)} % é T + G + C.`, motivo: 'deu T + G + C' },
              ],
        resposta,
        tol,
      ),
      resolucao: `Regra de Chargaff: A = T e G = C. A = ${a} % ⇒ T = ${a} %. Restam 100 − ${2 * a} = ${fn(100 - 2 * a)} % para G + C, ${fn(c.G)} % para cada. ${pedido === 'T' ? `T = ${a} %.` : pedido === 'G' ? `G = ${fn(c.G)} %.` : `G + C = ${fn(c.G + c.C)} %.`}`,
      dicas: ['Na fita dupla, A pareia com T e G pareia com C.', 'Logo, A = T e G = C.', 'As quatro porcentagens somam 100 %.'],
      licao: 'Regra de Chargaff (DNA de fita dupla): A = T e G = C; A + T + G + C = 100 %.',
      dados: { variante: 'chargaff', extra: { a } },
    }
  }
  if (nivel === 2) {
    const g = sortear(rng, 2, 6)
    const pedido = escolher(rng, ['total', 'comN15', 'hibridas', 'leves'] as const)
    const b = bandasMeselson('semiconservativa', g)
    const resposta = pedido === 'total' ? moleculasNaGeracao(g) : pedido === 'comN15' ? moleculasComN15(g) : pedido === 'hibridas' ? b.hibrido * 100 : b.leve * 100
    const unidade = pedido === 'total' || pedido === 'comN15' ? 'moléculas' : '%'
    const tolerancia = pedido === 'hibridas' || pedido === 'leves' ? 0.1 : 0.01
    const total = moleculasNaGeracao(g)
    const perguntaPedido = pedido === 'total' ? 'quantas moléculas de DNA existem?' : pedido === 'comN15' ? 'quantas moléculas de DNA ainda contêm ¹⁵N?' : pedido === 'hibridas' ? 'que porcentagem das moléculas é híbrida (uma fita ¹⁵N e outra ¹⁴N)?' : 'que porcentagem das moléculas tem as duas fitas apenas com ¹⁴N?'
    return {
      enunciado: `Uma bactéria cujo DNA tem as duas fitas marcadas com ¹⁵N (isótopo pesado) é transferida para um meio apenas com ¹⁴N. O DNA se replica de forma semiconservativa, uma vez por geração. Partindo de 1 molécula de DNA, depois de ${g} gerações, ${perguntaPedido}`,
      resposta,
      tolerancia,
      unidade,
      erros: limpar(
        pedido === 'total'
          ? [
              { valor: 2 * g, frase: `${2 * g} seria o resultado de somar 2 a cada geração. O número de moléculas DOBRA a cada geração: 2^${g}.`, motivo: 'tratou o crescimento como linear' },
              { valor: g, frase: `${g} é o número de gerações. A cada geração o total de moléculas dobra.`, motivo: 'deu o número de gerações' },
              { valor: 2 ** (g - 1), frase: `Faltou uma duplicação: partindo de 1 molécula, em ${g} gerações há 2^${g}.`, motivo: 'contou uma geração a menos' },
              { valor: g ** 2, frase: `${g * g} é ${g}²; o crescimento é exponencial, de base 2: 2^${g}.`, motivo: 'elevou ao quadrado em vez de usar 2^g' },
              { valor: 2 ** (g + 1), frase: `Há uma duplicação a mais na conta: em ${g} gerações, partindo de 1 molécula, o total é 2^${g}.`, motivo: 'contou uma geração a mais' },
            ]
          : pedido === 'comN15'
            ? [
                { valor: total, frase: `${total} é o número total de moléculas. Só as duas moléculas formadas com as fitas originais (¹⁵N) contêm ¹⁵N; as demais têm só ¹⁴N.`, motivo: 'deu o total de moléculas' },
                { valor: 1, frase: 'As duas fitas originais (pesadas) se separam na primeira replicação e vão para moléculas diferentes: são 2 moléculas com ¹⁵N, e não 1.', motivo: 'achou que a molécula original continua inteira' },
                { valor: total / 2, frase: 'Isso seria o número de moléculas contendo ¹⁵N se ele se espalhasse (replicação dispersiva). Na semiconservativa, as fitas originais ficam intactas, em apenas 2 moléculas.', motivo: 'aplicou a hipótese dispersiva' },
                { valor: g, frase: `${g} é o número de gerações; o número de moléculas com ¹⁵N não depende dele (permanece 2).`, motivo: 'deu o número de gerações' },
              ]
            : pedido === 'hibridas'
              ? [
                  { valor: 100, frase: '100 % só ocorre na 1ª geração. A partir da 2ª, as moléculas novas têm duas fitas leves e diluem a fração de híbridas.', motivo: 'supôs que todas continuam híbridas' },
                  { valor: b.leve * 100, frase: `${fn(b.leve * 100, 2)} % é a porcentagem de moléculas totalmente leves (¹⁴N/¹⁴N).`, motivo: 'trocou híbridas por leves' },
                  { valor: 100 / total, frase: `${fn(100 / total, 2)} % seria 1 molécula em ${total}; há 2 moléculas híbridas, e não 1.`, motivo: 'contou 1 molécula híbrida em vez de 2' },
                  { valor: 50, frase: '50 % vale para a 2ª geração apenas. Em cada geração seguinte, o número de híbridas continua 2, mas o total dobra.', motivo: 'repetiu o valor da 2ª geração' },
                ]
              : [
                  { valor: b.hibrido * 100, frase: `${fn(b.hibrido * 100, 2)} % é a porcentagem de moléculas híbridas (¹⁵N/¹⁴N).`, motivo: 'trocou leves por híbridas' },
                  { valor: 100, frase: 'Ainda existem 2 moléculas híbridas (as que têm uma fita original), então não são todas leves.', motivo: 'supôs que todas seriam leves' },
                  { valor: 50, frase: '50 % de leves ocorre na 2ª geração. Depois dela, o número de híbridas continua 2 e o total dobra: a fração de leves aumenta.', motivo: 'repetiu o valor da 2ª geração' },
                  { valor: 100 - 100 / total, frase: `${fn(100 - 100 / total, 2)} % supõe 1 só molécula não leve. Há 2 moléculas com uma fita ¹⁵N.`, motivo: 'contou 1 molécula com ¹⁵N em vez de 2' },
                ],
        resposta,
        tolerancia,
      ),
      resolucao: `A cada geração, o número de moléculas dobra: 2^${g} = ${total}. Na replicação semiconservativa, as duas fitas originais (¹⁵N) ficam separadas em 2 moléculas híbridas e todas as outras (${total - 2}) têm só ¹⁴N. ${pedido === 'total' ? `Total: ${total}.` : pedido === 'comN15' ? 'Moléculas com ¹⁵N: 2.' : pedido === 'hibridas' ? `Híbridas: 2 ÷ ${total} = ${fn(resposta, 2)} %.` : `Leves: ${total - 2} ÷ ${total} = ${fn(resposta, 2)} %.`}`,
      dicas: ['O total de moléculas dobra a cada geração.', 'Na semiconservativa, cada molécula nova leva uma fita antiga e uma nova.', 'As duas fitas originais de ¹⁵N ficam em duas moléculas, para sempre.'],
      licao: 'Replicação semiconservativa (Meselson e Stahl): após g gerações há 2ᵍ moléculas, sendo 2 híbridas (uma fita ¹⁵N e outra ¹⁴N) e 2ᵍ − 2 totalmente leves.',
      dados: { variante: 'meselson', extra: { g, pedido: ['total', 'comN15', 'hibridas', 'leves'].indexOf(pedido) } },
    }
  }
  // nível 3
  const v = escolher(rng, ['ligacoes', 'consumo'] as const)
  if (v === 'ligacoes') {
    const pares = escolher(rng, [100, 200, 500, 1000, 2000])
    const gc = escolher(rng, [30, 40, 50, 60, 70])
    const nGC = (pares * gc) / 100
    const nAT = pares - nGC
    const resposta = ligacoesHidrogenio(nAT, nGC)
    return {
      enunciado: `Um fragmento de DNA de fita dupla tem ${fn(pares, 0)} pares de bases e ${gc} % de G + C. Sabendo que há 2 ligações de hidrogênio entre A e T e 3 entre G e C, quantas ligações de hidrogênio mantêm as duas fitas unidas?`,
      resposta,
      tolerancia: 0.5,
      unidade: 'ligações',
      erros: limpar(
        [
          { valor: 2 * pares, frase: 'Faltou considerar que os pares G–C têm 3 ligações (e não 2).', motivo: 'tratou todos os pares como A–T' },
          { valor: 3 * pares, frase: 'Faltou considerar que os pares A–T têm só 2 ligações (e não 3).', motivo: 'tratou todos os pares como G–C' },
          { valor: 2 * nAT + 3 * nGC * 2, frase: 'Cada par G–C tem 3 ligações; contar G e C separadamente dobra o valor, porque a ligação é ENTRE as duas bases do par.', motivo: 'contou as ligações duas vezes' },
          { valor: 2 * nGC + 3 * nAT, frase: 'Você trocou as ligações: A–T tem 2 e G–C tem 3.', motivo: 'trocou o número de ligações de A–T e G–C' },
        ],
        resposta,
        0.5,
      ),
      resolucao: `Pares G–C: ${gc} % de ${fn(pares, 0)} = ${fn(nGC, 0)} (3 ligações cada); pares A–T: ${fn(nAT, 0)} (2 ligações cada). Total: 3 × ${fn(nGC, 0)} + 2 × ${fn(nAT, 0)} = ${fn(resposta, 0)}.`,
      dicas: ['Quantos pares são G–C e quantos são A–T?', 'G–C: 3 ligações. A–T: 2 ligações.', 'Some as ligações de todos os pares.'],
      licao: 'Pares A–T têm 2 ligações de hidrogênio; pares G–C, 3. DNA com mais G–C é mais estável (precisa de mais calor para desnaturar).',
      dados: { variante: 'ligacoes', extra: { pares, gc } },
    }
  }
  const pares = escolher(rng, [100, 500, 1000, 5000])
  const rodadas = sortear(rng, 2, 4)
  const resposta = (2 ** rodadas - 1) * 2 * pares
  return {
    enunciado: `Um DNA de fita dupla tem ${fn(pares, 0)} pares de bases. Ele se replica ${rodadas} vezes (de forma semiconservativa), e cada nova fita é feita com nucleotídeos livres do meio. Quantos nucleotídeos livres são incorporados ao todo, depois das ${rodadas} replicações?`,
    resposta,
    tolerancia: 0.5,
    unidade: 'nucleotídeos',
    erros: limpar(
      [
        { valor: 2 * pares * 2 ** rodadas, frase: 'Isso é o número total de nucleotídeos nas moléculas finais, incluindo os da molécula original (que não são novos).', motivo: 'incluiu os nucleotídeos da molécula original' },
        { valor: 2 * pares * rodadas, frase: `Cada rodada dobra o número de moléculas, então a quantidade incorporada cresce exponencialmente, e não ${rodadas} × ${fn(2 * pares, 0)}.`, motivo: 'tratou como crescimento linear' },
        { valor: 2 ** rodadas * pares, frase: 'Lembre que cada molécula tem 2 fitas, cada uma com um nucleotídeo por par de bases: 2 × pares nucleotídeos por molécula.', motivo: 'esqueceu que há duas fitas' },
        { valor: (2 ** rodadas - 1) * pares, frase: 'Cada molécula tem duas fitas, cada uma com um nucleotídeo por par de bases: são 2 × pares nucleotídeos por molécula.', motivo: 'contou os nucleotídeos de uma só fita' },
        { valor: 2 * pares * (rodadas - 1), frase: 'O número de moléculas dobra a cada rodada: depois de n rodadas há 2ⁿ moléculas.', motivo: 'contou uma rodada a menos' },
      ],
      resposta,
      0.5,
    ),
    resolucao: `Depois de ${rodadas} replicações há 2^${rodadas} = ${2 ** rodadas} moléculas, cada uma com 2 × ${fn(pares, 0)} = ${fn(2 * pares, 0)} nucleotídeos. Total: ${2 ** rodadas} × ${fn(2 * pares, 0)} = ${fn(2 ** rodadas * 2 * pares, 0)}. Descontando os ${fn(2 * pares, 0)} da molécula original, foram incorporados ${fn(resposta, 0)}.`,
    dicas: ['Quantas moléculas existem depois de n replicações?', 'Cada molécula tem 2 fitas com 1 nucleotídeo por par.', 'Subtraia os nucleotídeos que já existiam.'],
    licao: 'Nucleotídeos incorporados em n replicações = (2ⁿ − 1) × (nucleotídeos da molécula original).',
    dados: { variante: 'consumo', extra: { pares, rodadas } },
  }
}

/* ================================================================== biotecnologia (numérico) */

export interface DadosBiotec {
  variante: 'copias' | 'ciclos' | 'duracao' | 'restricao'
  extra?: Record<string, number>
  /** mapa de restrição: tamanho (kb), posições dos cortes (kb) e se é circular */
  mapa?: { tamanho: number; cortes: number[]; circular: boolean; enzima: string }
}

export function gerarBiotec(rng: Rng, nivel: Nivel): InstanciaNum<DadosBiotec> {
  if (nivel === 1) {
    const inicial = escolher(rng, [1, 1, 10, 100])
    const n = sortear(rng, 4, 10)
    const resposta = copiasAposCiclos(inicial, n)
    return {
      enunciado: `Em uma PCR, cada ciclo duplica o número de moléculas do fragmento de DNA (eficiência de 100 %). Começando com ${fn(inicial, 0)} molécula${inicial === 1 ? '' : 's'}, quantas moléculas existem depois de ${n} ciclos?`,
      resposta,
      tolerancia: 0.5,
      unidade: 'moléculas',
      erros: limpar(
        [
          { valor: inicial * 2 * n, frase: `${fn(inicial * 2 * n, 0)} supõe que cada ciclo ACRESCENTA ${fn(2 * inicial, 0)} moléculas. Cada ciclo DOBRA o total: crescimento exponencial.`, motivo: 'tratou o crescimento como linear' },
          { valor: copiasAposCiclos(inicial, n - 1), frase: `Faltou um ciclo: depois de ${n} ciclos o total é multiplicado por 2^${n}.`, motivo: 'contou um ciclo a menos' },
          { valor: copiasAposCiclos(inicial, n + 1), frase: `Há um ciclo a mais na conta: foram ${n} ciclos.`, motivo: 'contou um ciclo a mais' },
          { valor: inicial * n ** 2, frase: `${fn(inicial * n ** 2, 0)} é ${inicial === 1 ? '' : `${inicial} × `}${n}²; a PCR cresce como 2^${n}, muito mais rápido.`, motivo: 'elevou o número de ciclos ao quadrado' },
        ],
        resposta,
        0.5,
      ),
      resolucao: `Cada ciclo duplica: ${fn(inicial, 0)} × 2^${n} = ${fn(resposta, 0)} moléculas.`,
      dicas: ['Cada ciclo multiplica o número de moléculas por 2.', 'Depois de n ciclos, o fator é 2ⁿ.', 'Multiplique pela quantidade inicial.'],
      licao: 'PCR: N = N₀ × 2ⁿ (eficiência de 100 %), com n ciclos de desnaturação, anelamento dos primers e extensão pela DNA polimerase.',
      dados: { variante: 'copias', extra: { inicial, n } },
    }
  }
  if (nivel === 2) {
    const v = escolher(rng, ['ciclos', 'duracao'] as const)
    if (v === 'ciclos') {
      const inicial = escolher(rng, [1, 10, 100, 1000])
      const alvo = escolher(rng, [10_000, 100_000, 1_000_000, 1_000_000_000])
      const resposta = ciclosParaAlvo(inicial, alvo)
      return {
        enunciado: `Uma amostra tem ${fn(inicial, 0)} molécula${inicial === 1 ? '' : 's'} do DNA-alvo. Com eficiência de 100 % (cada ciclo duplica o número de moléculas), qual o número mínimo de ciclos de PCR para obter pelo menos ${fn(alvo, 0)} moléculas?`,
        resposta,
        tolerancia: 0.01,
        unidade: 'ciclos',
        erros: limpar(
          [
            { valor: resposta - 1, frase: `${resposta - 1} ciclos dão ${fn(copiasAposCiclos(inicial, resposta - 1), 0)} moléculas, ainda menos que o alvo.`, motivo: 'parou um ciclo antes' },
            { valor: resposta + 1, frase: `${resposta} ciclos já bastam (${fn(copiasAposCiclos(inicial, resposta), 0)} moléculas); um a mais passa do necessário.`, motivo: 'contou um ciclo a mais' },
            { valor: Math.round(alvo / (2 * inicial)), frase: 'O crescimento é exponencial (2ⁿ), e não linear: o número de ciclos é o logaritmo na base 2 do fator de aumento.', motivo: 'tratou o crescimento como linear' },
            { valor: Math.round(Math.log10(alvo / inicial)), frase: 'O log decimal não serve: a base é 2 (cada ciclo duplica). 2ⁿ ≥ alvo ÷ inicial.', motivo: 'usou logaritmo na base errada' },
          ],
          resposta,
          0.01,
        ),
        resolucao: `Precisa-se de 2ⁿ × ${fn(inicial, 0)} ≥ ${fn(alvo, 0)}, isto é, 2ⁿ ≥ ${fn(alvo / inicial, 0)}. Com n = ${resposta - 1}: ${fn(copiasAposCiclos(inicial, resposta - 1), 0)} (pouco); com n = ${resposta}: ${fn(copiasAposCiclos(inicial, resposta), 0)} (suficiente).`,
        dicas: ['Quantas vezes é preciso multiplicar por 2?', 'Procure o menor n com 2ⁿ × inicial ≥ alvo.', 'Teste valores de n e compare.'],
        licao: 'Número de ciclos = menor n tal que N₀ × 2ⁿ ≥ alvo. Como 2¹⁰ ≈ 1 000, cada 10 ciclos multiplicam o número de moléculas por cerca de mil.',
        dados: { variante: 'ciclos', extra: { inicial, alvo } },
      }
    }
    const ciclos = escolher(rng, [25, 30, 35, 40])
    const tD = escolher(rng, [20, 30])
    const tA = escolher(rng, [20, 30, 45])
    const tE = escolher(rng, [30, 45, 60])
    const total = duracaoTotal(ciclos, tD, tA, tE)
    return {
      enunciado: `Cada ciclo de uma PCR tem 3 etapas: desnaturação a 95 °C por ${tD} s, anelamento dos primers a 55 °C por ${tA} s e extensão a 72 °C por ${tE} s. Quanto tempo, em minutos, levam ${ciclos} ciclos (desconsidere as etapas iniciais e finais e a variação de temperatura)?`,
      resposta: total / 60,
      tolerancia: 0.05,
      unidade: 'min',
      erros: limpar(
        [
          { valor: total, frase: `${fn(total, 0)} é o tempo em SEGUNDOS. A pergunta pede minutos.`, motivo: 'esqueceu de converter segundos em minutos' },
          { valor: (ciclos * tE) / 60, frase: 'Você contou só a etapa de extensão. Cada ciclo inclui as três etapas.', motivo: 'contou uma só etapa' },
          { valor: (ciclos * (tD + tA)) / 60, frase: 'Faltou a etapa de extensão (72 °C). Cada ciclo tem três etapas.', motivo: 'esqueceu a extensão' },
          { valor: (tD + tA + tE) / 60, frase: 'Esse é o tempo de UM ciclo. Multiplique pelo número de ciclos.', motivo: 'deu o tempo de um só ciclo' },
        ],
        total / 60,
        0.05,
      ),
      resolucao: `Um ciclo dura ${tD} + ${tA} + ${tE} = ${tD + tA + tE} s. ${ciclos} ciclos: ${ciclos} × ${tD + tA + tE} = ${fn(total, 0)} s = ${fn(total / 60, 2)} min.`,
      dicas: ['Some as três etapas de um ciclo.', 'Multiplique pelo número de ciclos.', 'Divida por 60 para obter minutos.'],
      licao: 'Cada ciclo de PCR: desnaturação (~95 °C), anelamento dos primers (~50 a 65 °C) e extensão pela DNA polimerase termoestável (~72 °C).',
      dados: { variante: 'duracao', extra: { ciclos, tD, tA, tE } },
    }
  }
  // nível 3: mapa de restrição
  const tamanho = escolher(rng, [4, 5, 6, 8, 10, 12])
  const circular = rng() < 0.6
  const n = sortear(rng, 2, 3)
  const pontos = embaralhar(
    rng,
    Array.from({ length: tamanho * 2 - 1 }, (_, i) => (i + 1) / 2),
  )
    .slice(0, n)
    .sort((a, b) => a - b)
  const frs = fragmentos(tamanho, pontos, circular)
  const pedido = escolher(rng, ['menor', 'maior', 'numero'] as const)
  const resposta = pedido === 'menor' ? Math.min(...frs) : pedido === 'maior' ? Math.max(...frs) : frs.length
  const enz = escolher(rng, ['EcoRI', 'BamHI', 'HindIII'])
  const pedidoTexto = pedido === 'menor' ? 'o menor fragmento' : pedido === 'maior' ? 'o maior fragmento' : 'o número de fragmentos'
  const unidade = pedido === 'numero' ? 'fragmentos' : 'kb'
  return {
    enunciado: `${circular ? 'Um plasmídeo circular' : 'Uma molécula de DNA linear'} de ${tamanho} kb tem ${n} sítios de corte para a enzima ${enz}, nas posições ${lista(pontos.map((p) => `${fn(p, 1)} kb`))} (contadas a partir ${circular ? 'de um ponto de referência' : 'da extremidade esquerda'}). Após a digestão completa com ${enz}, qual é ${pedidoTexto}${pedido === 'numero' ? '' : ' (em kb)'}?`,
    resposta,
    tolerancia: 0.05,
    unidade,
    erros: limpar(
      pedido === 'numero'
        ? [
            { valor: circular ? n + 1 : n, frase: circular ? `${n + 1} vale para uma molécula LINEAR. Numa molécula circular, n cortes dão n fragmentos (o último fecha o círculo).` : `${n} seria o resultado para uma molécula circular. Numa linear, n cortes dão n + 1 fragmentos.`, motivo: 'confundiu linear com circular' },
            { valor: circular ? n - 1 : n - 1, frase: `Com ${n} cortes há pelo menos ${n} fragmentos: cada corte separa a molécula em mais uma parte.`, motivo: 'subestimou o número de fragmentos' },
            { valor: n + 2, frase: 'Cada corte separa a molécula em uma parte a mais: n + 1 se for linear, n se for circular.', motivo: 'superestimou o número de fragmentos' },
          ]
        : [
            { valor: pontos[0] as number, frase: `${fn(pontos[0] as number, 1)} kb é só a posição do primeiro corte, e não o tamanho de um fragmento (que é a distância entre cortes).`, motivo: 'deu a posição de um corte' },
            { valor: pedido === 'menor' ? Math.max(...frs) : Math.min(...frs), frase: pedido === 'menor' ? 'Esse é o MAIOR fragmento.' : 'Esse é o MENOR fragmento.', motivo: 'trocou menor por maior' },
            { valor: circular ? Math.max(0, tamanho - (pontos[pontos.length - 1] as number)) : (pontos[1] as number) - (pontos[0] as number), frase: 'Você usou só uma distância entre cortes. Calcule todos os fragmentos, incluindo ' + (circular ? 'o que passa pelo ponto de referência (fecha o círculo)' : 'os das extremidades') + ', e escolha o pedido.', motivo: 'não calculou todos os fragmentos' },
            { valor: tamanho, frase: `${tamanho} kb é o tamanho de toda a molécula, antes de ser cortada.`, motivo: 'deu o tamanho da molécula inteira' },
          ],
      resposta,
      0.05,
    ),
    resolucao: `Fragmentos: ${frs.map((f) => `${fn(f, 1)} kb`).join(', ')} (${circular ? 'em molécula circular, n cortes dão n fragmentos' : 'em molécula linear, n cortes dão n + 1 fragmentos'}). ${pedido === 'numero' ? `Total: ${frs.length}.` : pedido === 'menor' ? `O menor: ${fn(resposta, 1)} kb.` : `O maior: ${fn(resposta, 1)} kb.`}`,
    dicas: ['Marque os cortes numa linha (ou num círculo).', 'Cada fragmento vai de um corte ao seguinte.', circular ? 'Em círculo, o último fragmento vai do último corte ao primeiro.' : 'Em linha, há dois fragmentos de ponta.'],
    licao: 'Digestão com enzima de restrição: n cortes em DNA linear → n + 1 fragmentos; em DNA circular (plasmídeo) → n fragmentos. Os tamanhos são as distâncias entre cortes consecutivos.',
    dados: { variante: 'restricao', mapa: { tamanho, cortes: pontos, circular, enzima: enz } },
  }
}

/* ================================================================== biotecnologia e regulação gênica (múltipla escolha) */

export interface DadosTecnicas {
  tipo: 'banco' | 'lac' | 'gel'
  mapa?: { tamanho: number; cortes: number[]; circular: boolean; enzima: string }
}

export const BANCO_TECNICAS: { nivel: Nivel; item: ItemBanco }[] = [
  {
    nivel: 1,
    item: {
      pergunta: 'Qual é a função das enzimas de restrição na engenharia genética?',
      certa: { texto: 'Cortar o DNA em sequências específicas (sítios de restrição), gerando fragmentos.', porque: 'Cada enzima reconhece uma sequência curta (por exemplo, GAATTC para a EcoRI) e corta o DNA ali. Isso permite recortar genes e inseri-los em vetores.' },
      erradas: [
        { texto: 'Unir fragmentos de DNA, formando ligações fosfodiéster.', porque: 'Quem une fragmentos é a DNA ligase. As enzimas de restrição fazem o corte.', motivo: 'confundiu restrição com ligase' },
        { texto: 'Copiar o DNA, formando novas fitas complementares.', porque: 'Copiar o DNA é função da DNA polimerase (na replicação ou na PCR).', motivo: 'confundiu restrição com polimerase' },
        { texto: 'Sintetizar RNA a partir de um molde de DNA.', porque: 'Isso é função da RNA polimerase, na transcrição.', motivo: 'confundiu restrição com RNA polimerase' },
      ],
      licao: 'Enzima de restrição corta; DNA ligase une; DNA polimerase copia; RNA polimerase transcreve.',
      dicas: ['Pense no nome: “restringir”, cortar.', 'Que enzima une os pedaços depois?', 'Cada enzima reconhece uma sequência específica.'],
    },
  },
  {
    nivel: 1,
    item: {
      pergunta: 'Na PCR (reação em cadeia da polimerase), por que se usa uma DNA polimerase termoestável, como a Taq polimerase?',
      certa: { texto: 'Porque a reação passa por temperaturas altas (cerca de 95 °C) em cada ciclo, que desnaturariam uma enzima comum.', porque: 'A Taq, de uma bactéria que vive em fontes termais, mantém a atividade depois de repetidas desnaturações do DNA a ~95 °C.' },
      erradas: [
        { texto: 'Porque ela corta o DNA em sequências específicas antes da cópia.', porque: 'Quem corta em sequências específicas são as enzimas de restrição. A Taq sintetiza DNA.', motivo: 'confundiu com enzima de restrição' },
        { texto: 'Porque ela se liga aos primers e os substitui ao final de cada ciclo.', porque: 'Os primers são oligonucleotídeos que a polimerase estende; ela não os substitui.', motivo: 'errou o papel dos primers' },
        { texto: 'Porque trabalha a 0 °C, evitando que o DNA se degrade.', porque: 'A polimerase trabalha em temperaturas altas (cerca de 72 °C), e o ponto é resistir ao calor.', motivo: 'achou que a enzima trabalha no frio' },
      ],
      licao: 'PCR: desnaturação (~95 °C), anelamento dos primers (~55 °C) e extensão (~72 °C), com DNA polimerase termoestável (Taq).',
      dicas: ['Que temperatura abre a dupla-hélice?', 'O que aconteceria com uma enzima comum a 95 °C?', 'A Taq vem de bactéria de fonte termal.'],
    },
  },
  {
    nivel: 1,
    item: {
      pergunta: 'Na eletroforese em gel de agarose, os fragmentos de DNA migram em direção ao polo positivo porque:',
      certa: { texto: 'O DNA tem carga negativa (grupos fosfato) e os fragmentos menores migram mais depressa no gel.', porque: 'Os fosfatos dão carga negativa ao DNA; o gel funciona como peneira, e os fragmentos pequenos atravessam mais rápido, chegando mais longe.' },
      erradas: [
        { texto: 'O DNA tem carga positiva e é atraído pelo eletrodo negativo.', porque: 'O DNA é carregado negativamente (fosfatos) e migra para o polo positivo (ânodo).', motivo: 'inverteu a carga do DNA' },
        { texto: 'Os fragmentos maiores migram mais depressa, porque têm mais carga.', porque: 'A relação carga/massa é praticamente a mesma; o que separa é o atrito com o gel: os maiores migram menos.', motivo: 'inverteu a relação entre tamanho e migração' },
        { texto: 'O DNA é eletricamente neutro, e a migração se deve ao fluxo do líquido.', porque: 'O DNA tem carga negativa; a corrente elétrica é que o faz migrar.', motivo: 'achou que o DNA é neutro' },
      ],
      licao: 'Eletroforese: DNA (carga negativa) migra para o polo positivo; quanto menor o fragmento, mais longe ele chega.',
      dicas: ['Que grupo químico dá carga ao DNA?', 'O gel é uma peneira.', 'Quem passa mais fácil: fragmento grande ou pequeno?'],
    },
  },
  {
    nivel: 2,
    item: {
      pergunta: 'Para produzir insulina humana em bactérias, os cientistas inserem o gene da insulina em um plasmídeo, que é introduzido nas bactérias. Qual é a sequência correta das enzimas usadas para cortar o gene e o plasmídeo e depois unir os fragmentos?',
      certa: { texto: 'Enzima de restrição (corta o gene e o plasmídeo) e depois DNA ligase (une o gene ao plasmídeo).', porque: 'A mesma enzima de restrição gera extremidades compatíveis no gene e no plasmídeo; a DNA ligase forma as ligações que unem as duas moléculas.' },
      erradas: [
        { texto: 'DNA ligase (corta) e depois enzima de restrição (une).', porque: 'Os papéis estão trocados: a restrição corta; a ligase une.', motivo: 'trocou os papéis das enzimas' },
        { texto: 'DNA polimerase (corta) e depois RNA polimerase (une).', porque: 'Polimerases sintetizam ácidos nucleicos; não cortam nem unem fragmentos prontos.', motivo: 'usou polimerases' },
        { texto: 'Transcriptase reversa (corta) e helicase (une).', porque: 'A transcriptase reversa faz DNA a partir de RNA, e a helicase separa as fitas do DNA; nenhuma corta ou une fragmentos.', motivo: 'usou enzimas de outras funções' },
      ],
      licao: 'DNA recombinante: enzima de restrição corta, DNA ligase une; o plasmídeo recombinante é introduzido na bactéria (transformação), que passa a produzir a proteína humana.',
      dicas: ['Quem corta o DNA em sítios específicos?', 'Quem forma as ligações entre os fragmentos?', 'Plasmídeos são vetores.'],
    },
  },
  {
    nivel: 2,
    item: {
      pergunta: 'Em experimentos de transformação bacteriana, plasmídeos com um gene de resistência a um antibiótico costumam ser usados como vetores. Para que serve esse gene?',
      certa: { texto: 'Para selecionar as bactérias que receberam o plasmídeo: só elas sobrevivem num meio com o antibiótico.', porque: 'Bactérias sem o plasmídeo morrem no meio com antibiótico, e as que sobrevivem incorporaram o plasmídeo (e, com ele, o gene de interesse).' },
      erradas: [
        { texto: 'Para cortar o DNA do plasmídeo em sítios específicos.', porque: 'Isso é função de enzimas de restrição, e não de genes de resistência.', motivo: 'confundiu com enzima de restrição' },
        { texto: 'Para aumentar a velocidade de replicação do plasmídeo.', porque: 'A replicação depende da origem de replicação do plasmídeo, e não do gene de resistência.', motivo: 'confundiu com origem de replicação' },
        { texto: 'Para que a bactéria produza o antibiótico.', porque: 'O gene confere resistência (por exemplo, enzima que degrada o antibiótico); a bactéria não produz o antibiótico.', motivo: 'achou que a bactéria produz o antibiótico' },
      ],
      licao: 'Genes marcadores de resistência a antibióticos permitem selecionar as células transformadas.',
      dicas: ['O que acontece com bactérias sem o plasmídeo no meio com antibiótico?', 'Qual o objetivo de “selecionar”?', 'Resistência ≠ produzir o antibiótico.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'O sistema CRISPR-Cas9 é usado na edição de genomas. Qual é, em essência, o papel do RNA-guia?',
      certa: { texto: 'Levar a enzima Cas9 até a sequência de DNA complementar, onde ela faz o corte.', porque: 'O RNA-guia se pareia com a sequência-alvo do DNA e dirige a Cas9 até ela; o corte permite inativar um gene ou inserir uma sequência nova.' },
      erradas: [
        { texto: 'Servir de molde para a síntese do DNA que será inserido.', porque: 'O RNA-guia identifica o local do corte; a correção ou inserção usa outro molde de DNA, quando necessário.', motivo: 'confundiu o RNA-guia com molde de síntese' },
        { texto: 'Cortar o DNA, fazendo o papel da enzima de restrição.', porque: 'Quem corta é a proteína Cas9; o RNA-guia apenas determina onde.', motivo: 'atribuiu o corte ao RNA' },
        { texto: 'Traduzir o gene em proteína, no ribossomo.', porque: 'O RNA-guia não codifica proteína: é um RNA de pareamento com o DNA-alvo.', motivo: 'confundiu com mRNA' },
      ],
      licao: 'CRISPR-Cas9: o RNA-guia pareia com o DNA-alvo e a nuclease Cas9 corta; originou-se de um sistema de defesa de bactérias contra vírus.',
      dicas: ['O que “guia” faz?', 'Quem corta: RNA ou proteína?', 'O pareamento RNA–DNA é feito por complementaridade.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Em um teste de paternidade por DNA, comparam-se regiões do genoma (como repetições curtas em tandem) da criança, da mãe e do suposto pai. Qual critério indica que o suposto pai pode ser o pai biológico?',
      certa: { texto: 'Em cada região analisada, os fragmentos da criança que não vieram da mãe estão presentes no suposto pai.', porque: 'A criança herda metade do material genético de cada genitor: o que não veio da mãe tem de ter vindo do pai biológico, e deve aparecer no padrão dele.' },
      erradas: [
        { texto: 'A criança tem exatamente o mesmo padrão de bandas que o suposto pai, em todas as regiões.', porque: 'A criança tem metade das bandas vindas da mãe; não é igual ao pai.', motivo: 'achou que a criança copia o padrão do pai' },
        { texto: 'O suposto pai e a criança têm o mesmo grupo sanguíneo ABO.', porque: 'Muitas pessoas têm o mesmo grupo ABO; o DNA analisa regiões bem mais variáveis.', motivo: 'confundiu com o teste de ABO' },
        { texto: 'O suposto pai tem maior número de bandas que a mãe.', porque: 'O número total de bandas não é critério; é preciso que cada banda da criança tenha origem na mãe ou no suposto pai.', motivo: 'usou um critério sem sentido' },
      ],
      licao: 'No teste de paternidade por DNA, cada marcador da criança vem de um dos genitores: o que não é materno tem de estar no pai.',
      dicas: ['Cada pessoa recebe metade do DNA de cada genitor.', 'O que não veio da mãe veio de quem?', 'Comparar só o grupo ABO não basta.'],
    },
  },
]

const FRASE_NIVEL: Record<string, string> = {
  nenhuma: 'Não há transcrição dos genes lac.',
  baixa: 'A transcrição é baixa.',
  alta: 'A transcrição é alta.',
}

const MUTACOES_TEXTO: Record<MutacaoLac, string> = {
  nenhuma: 'bactéria sem mutações',
  repressor: 'bactéria com mutação no gene do repressor (lacI) que o impede de funcionar',
  operador: 'bactéria com mutação no operador que impede a ligação do repressor',
  superrepressor: 'bactéria com mutação no repressor que o impede de se ligar à lactose (ele fica sempre ligado ao operador)',
  promotor: 'bactéria com mutação no promotor, que impede a ligação da RNA polimerase',
}

/** Explicação (em frases) do nível de transcrição do óperon lac nas condições dadas. */
export function porqueLac(c: { lactose: boolean; glicose: boolean; mutacao: MutacaoLac }, nivel: string): string {
  if (c.mutacao === 'promotor') return 'Sem promotor funcional a RNA polimerase não se liga, e os genes lac não são transcritos, qualquer que seja o ambiente.'
  if (c.mutacao === 'superrepressor') return 'O repressor mutante nunca se solta do operador, nem com lactose: a RNA polimerase fica bloqueada.'
  const reprimido = c.mutacao === 'nenhuma' ? !c.lactose : false
  if (reprimido) return 'Sem lactose, o repressor está ligado ao operador e bloqueia a RNA polimerase.'
  const base = c.mutacao === 'nenhuma' ? 'Com lactose, o repressor é inativado e solta o operador.' : c.mutacao === 'repressor' ? 'Sem repressor funcional, não há bloqueio.' : 'O repressor não consegue se ligar ao operador mutante, então não há bloqueio.'
  return nivel === 'alta' ? `${base} Sem glicose, o AMPc é alto e o complexo CAP–AMPc facilita a transcrição: ela é alta.` : `${base} Mas com glicose o AMPc é baixo, falta o CAP–AMPc e a transcrição é baixa.`
}

export function gerarTecnicas(rng: Rng, nivel: Nivel): InstanciaMulti<DadosTecnicas> {
  const tipo = nivel === 1 ? 'banco' : nivel === 2 ? escolher(rng, ['banco', 'lac', 'gel'] as const) : escolher(rng, ['banco', 'lac', 'lac', 'gel'] as const)
  if (tipo === 'banco') {
    const itens = BANCO_TECNICAS.filter((b) => b.nivel === nivel)
    const { item } = escolher(rng, itens.length ? itens : BANCO_TECNICAS)
    return montar<DadosTecnicas>(rng, item.certa, item.erradas, { enunciado: item.pergunta, resolucao: item.certa.porque, dicas: item.dicas, licao: item.licao, dados: { tipo: 'banco' } })
  }
  if (tipo === 'lac') {
    const mutacao: MutacaoLac = nivel === 2 ? 'nenhuma' : escolher(rng, ['nenhuma', 'repressor', 'operador', 'superrepressor', 'promotor'] as const)
    const lactose = rng() < 0.5
    const glicose = rng() < 0.5
    const nivelCerto = transcricaoLac({ lactose, glicose, mutacao })
    const condicao = `${lactose ? 'com lactose' : 'sem lactose'} e ${glicose ? 'com glicose' : 'sem glicose'}`
    const outras = (['nenhuma', 'baixa', 'alta'] as const).filter((x) => x !== nivelCerto)
    const explicaErro = (x: string) =>
      x === 'alta' ? 'A transcrição só é alta se o repressor estiver inativo ou ausente E o AMPc estiver alto (sem glicose). Neste caso uma dessas condições não se cumpre.' : x === 'baixa' ? 'A transcrição só é baixa se o repressor não bloquear (por lactose ou mutação) e a glicose reduzir o AMPc. Neste caso isso não ocorre.' : 'A transcrição só é nula se o repressor bloquear o operador (ou não houver promotor). Neste caso o repressor não bloqueia.'
    const erradas: Opc[] = outras.map((x) => ({ texto: FRASE_NIVEL[x] as string, porque: explicaErro(x), motivo: x === 'nenhuma' ? 'achou que o repressor bloquearia' : x === 'alta' ? 'ignorou a glicose' : 'ignorou o efeito do repressor' }))
    erradas.push({ texto: 'A transcrição é alta, porque a glicose ativa o complexo CAP–AMPc.', porque: 'É o contrário: a glicose REDUZ o AMPc e portanto reduz a ação do CAP. A transcrição alta exige falta de glicose (e repressor inativo).', motivo: 'inverteu o efeito da glicose' })
    const textoCerto = FRASE_NIVEL[nivelCerto] as string
    return montar<DadosTecnicas>(rng, { texto: textoCerto, porque: porqueLac({ lactose, glicose, mutacao }, nivelCerto) }, distintas(textoCerto, erradas).slice(0, 3), {
      enunciado: `No óperon lac de Escherichia coli, o que se espera da transcrição dos genes lacZ, lacY e lacA em uma ${MUTACOES_TEXTO[mutacao]} cultivada em meio ${condicao}?`,
      resolucao: porqueLac({ lactose, glicose, mutacao }, nivelCerto),
      dicas: ['O repressor bloqueia o operador, a menos que a lactose o inative (ou que ele não funcione).', 'A transcrição só é alta se o complexo CAP–AMPc ajudar a RNA polimerase.', 'A glicose reduz o AMPc.'],
      licao: 'Óperon lac: o repressor bloqueia o operador sem lactose (indução pela lactose). Alta expressão exige lactose e falta de glicose (CAP–AMPc). Mutações no repressor ou no operador tornam a expressão constitutiva; mutação no promotor impede a transcrição.',
      dados: { tipo: 'lac' },
    })
  }
  // gel
  for (let t = 0; t < 50; t++) {
    const tamanho = escolher(rng, [4, 5, 6, 8, 10])
    const circular = true
    const n = sortear(rng, 2, 3)
    const pontos = embaralhar(rng, Array.from({ length: tamanho * 2 - 1 }, (_, i) => (i + 1) / 2)).slice(0, n).sort((a, b) => a - b)
    const certos = fragmentos(tamanho, pontos, circular).map((x) => Math.round(x * 10) / 10)
    const fmtLista = (v: number[]) => v.map((x) => `${fn(x, 1)} kb`).join(', ')
    const linear = fragmentos(tamanho, pontos, false).map((x) => Math.round(x * 10) / 10)
    const umCorte = fragmentos(tamanho, [pontos[0] as number], true).map((x) => Math.round(x * 10) / 10)
    const erradas = distintas(fmtLista(certos), [
      { texto: fmtLista(linear), porque: `Esses são os fragmentos de uma molécula LINEAR com os mesmos ${n} cortes. O plasmídeo é circular: ${n} cortes dão ${n} fragmentos.`, motivo: 'tratou o plasmídeo como linear' },
      { texto: fmtLista(umCorte), porque: 'Isso corresponde a um único corte (plasmídeo apenas linearizado, uma banda do tamanho total). Há vários sítios.', motivo: 'considerou um só corte' },
      { texto: fmtLista(certos.map((x) => Math.round((x + 0.5) * 10) / 10)), porque: 'Os tamanhos não conferem com as distâncias entre os cortes (e a soma não dá o tamanho do plasmídeo).', motivo: 'errou as distâncias entre os cortes' },
      { texto: fmtLista([...certos].reverse().slice(0, Math.max(1, n - 1))), porque: `Faltam fragmentos: ${n} cortes em molécula circular dão ${n} fragmentos, e a soma deve ser ${tamanho} kb.`, motivo: 'esqueceu algum fragmento' },
    ])
    if (erradas.length < 3) continue
    return montar<DadosTecnicas>(rng, { texto: fmtLista(certos), porque: `Em molécula circular, ${n} cortes dão ${n} fragmentos, e os tamanhos são as distâncias entre cortes consecutivos (o último fecha o círculo). Soma: ${tamanho} kb.` }, erradas.slice(0, 3), {
      enunciado: `Um plasmídeo circular de ${tamanho} kb é cortado por uma enzima de restrição nas posições ${lista(pontos.map((p) => `${fn(p, 1)} kb`))} (a partir de um ponto de referência). Quais bandas aparecem no gel de agarose depois da digestão completa?`,
      resolucao: `Distâncias entre cortes consecutivos (e do último ao primeiro, fechando o círculo): ${fmtLista(certos)}.`,
      dicas: ['Em plasmídeo circular, o número de fragmentos é igual ao de cortes.', 'Calcule as distâncias entre cortes consecutivos.', 'A soma dos fragmentos é o tamanho total.'],
      licao: 'Digestão de plasmídeo circular com n cortes: n fragmentos, cuja soma é o tamanho do plasmídeo. No gel, os menores migram mais.',
      dados: { tipo: 'gel', mapa: { tamanho, cortes: pontos, circular, enzima: 'enzima de restrição' } },
    })
  }
  const { item } = BANCO_TECNICAS[0] as (typeof BANCO_TECNICAS)[number]
  return montar<DadosTecnicas>(rng, item.certa, item.erradas, { enunciado: item.pergunta, resolucao: item.certa.porque, dicas: item.dicas, licao: item.licao, dados: { tipo: 'banco' } })
}

