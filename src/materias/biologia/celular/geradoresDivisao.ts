import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { escolher, embaralhar, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type Opc } from '../comum/auxiliares'
import { FASES_MEIOSE, FASES_MITOSE, celulasAposMitoses, combinacoesDeGametas, contagem, type TipoDivisao } from './calculo'

/* ================================================================== contagens por fase */

export interface DadosDivisao {
  tipo: 'fase' | 'celulas' | 'gametas' | 'espermatozoides' | 'dna'
}

type Medida = 'cromossomos' | 'cromatides' | 'celulas'

const valor = (tipo: TipoDivisao, fase: string, n2: number, m: Medida) => {
  const c = contagem(tipo, fase, n2)
  return m === 'cromossomos' ? c.cromossomosPorCelula : m === 'cromatides' ? c.cromatidesPorCelula : c.celulas
}

const QUANTOS: Record<Medida, string> = { cromossomos: 'Quantos cromossomos', cromatides: 'Quantas cromátides', celulas: 'Quantas células' }
/** Nome da fase com a primeira palavra em minúsculas (“Metáfase I” → “metáfase I”). */
export const minus = (fase: string) => fase.replace(/^\S+/, (w) => w.toLowerCase())
const artigoFase = (fase: string) => (fase.startsWith('Prófase') || fase.startsWith('Anáfase') || fase.startsWith('Telófase') || fase.startsWith('Metáfase') ? `na ${minus(fase)}` : `na fase ${fase}`)

const NOTA_ANAFASE = ' (depois de separadas, as cromátides-irmãs passam a ser contadas como cromossomos)'

/** Resposta numérica sobre uma fase: erros típicos = o mesmo valor em outras fases. */
function perguntaFase(tipo: TipoDivisao, fases: readonly string[], n2: number, medidas: Medida[], rng: Rng): InstanciaNum<DadosDivisao> {
  const fase = escolher(rng, fases)
  const medida = escolher(rng, medidas)
  const resposta = valor(tipo, fase, n2, medida)
  const outras = fases.filter((f) => f !== fase)
  const errosFase = outras.map((f) => ({
    valor: valor(tipo, f, n2, medida),
    frase: `Esse é o valor ${artigoFase(f)}, não ${artigoFase(fase)}. ${descricaoMudanca(tipo, fase, n2, medida)}`,
    motivo: `usou o valor de outra fase (${minus(f)})`,
  }))
  const extras =
    medida === 'celulas'
      ? []
      : [
          { valor: n2 / 2, frase: `${fn(n2 / 2, 0)} é o número haploide (n), o de um gameta ou o das células ao fim da meiose I; não é o valor desta fase.`, motivo: 'usou n em vez do valor da fase' },
          { valor: n2 * 2, frase: 'Você dobrou o valor, como se contasse duas vezes cada cromossomo ou cada cromátide.', motivo: 'contou em dobro' },
        ]
  const erros = limpar([...errosFase, ...extras], resposta, 0.0001)
  const nomeTipo = tipo === 'mitose' ? 'da mitose' : 'da meiose'
  const por = medida === 'celulas' ? '' : ' em cada célula'
  const quando = fase === 'G1' ? 'na fase G1 do ciclo celular (antes da duplicação do DNA)' : `${artigoFase(fase)} ${nomeTipo}`
  const frase = medida === 'celulas' ? `${QUANTOS[medida]} existem ${quando}?` : `${QUANTOS[medida]} há${por} ${quando}?`
  const cabeca = tipo === 'mitose' ? `Uma célula somática de um organismo com 2n = ${n2} entra em mitose.` : `Uma célula de um organismo com 2n = ${n2} entra em meiose.`
  return {
    enunciado: `${cabeca} ${frase}${fase.startsWith('Anáfase') && medida !== 'celulas' ? NOTA_ANAFASE : ''}`,
    resposta,
    tolerancia: 0.0001,
    erros,
    resolucao: resolucaoFase(tipo, fase, n2, resposta),
    dicas: ['Lembre: antes de dividir, a célula duplica o DNA (fase S), e cada cromossomo passa a ter 2 cromátides-irmãs.', tipo === 'mitose' ? 'Na anáfase da mitose as cromátides-irmãs se separam; na telófase, a célula se divide.' : 'Na anáfase I separam-se os homólogos (o número de cromossomos cai pela metade); na anáfase II separam-se as cromátides-irmãs.', 'Conte cada cromossomo uma vez, mesmo que tenha duas cromátides; cada cromátide conta uma vez.'],
    licao: 'Cromossomos: 2n até a anáfase I (meiose) ou até a metáfase (mitose); cromátides: o dobro, depois da duplicação. Mitose mantém 2n; meiose I reduz a n; meiose II separa cromátides.',
    dados: { tipo: 'fase' },
  }
}

function descricaoMudanca(tipo: TipoDivisao, fase: string, n2: number, m: Medida): string {
  const c = contagem(tipo, fase, n2)
  const n = n2 / 2
  if (m === 'celulas') return `${artigoFase(fase)[0]?.toUpperCase()}${artigoFase(fase).slice(1)}, há ${c.celulas} célula${c.celulas === 1 ? '' : 's'}.`
  if (m === 'cromatides') return `${artigoFase(fase)[0]?.toUpperCase()}${artigoFase(fase).slice(1)}, cada célula tem ${c.cromossomosPorCelula} cromossomo${c.cromossomosPorCelula === 1 ? '' : 's'} com ${c.cromatidesPorCelula / c.cromossomosPorCelula} cromátide${c.cromatidesPorCelula / c.cromossomosPorCelula === 1 ? '' : 's'} cada${c.cromossomosPorCelula === n ? ' (número haploide)' : ''}.`
  return `${artigoFase(fase)[0]?.toUpperCase()}${artigoFase(fase).slice(1)}, cada célula tem ${c.cromossomosPorCelula} cromossomos${c.cromossomosPorCelula === n ? ' (número haploide)' : c.cromossomosPorCelula === n2 ? ' (número diploide)' : ''}.`
}

function resolucaoFase(tipo: TipoDivisao, fase: string, n2: number, resposta: number): string {
  const c = contagem(tipo, fase, n2)
  const cabe = `${artigoFase(fase)[0]?.toUpperCase()}${artigoFase(fase).slice(1)}${fase === 'G1' ? '' : tipo === 'mitose' ? ' da mitose' : ' da meiose'}: ${c.celulas} célula${c.celulas === 1 ? '' : 's'}, cada uma com ${c.cromossomosPorCelula} cromossomos e ${c.cromatidesPorCelula} cromátides.`
  return `${cabe} A resposta é ${fn(resposta, 0)}.`
}

const N2_VALORES = [4, 6, 8, 10, 12, 14, 16, 20, 24, 46]

export function gerarContagem(rng: Rng, nivel: Nivel): InstanciaNum<DadosDivisao> {
  if (nivel === 1) return perguntaFase('mitose', ['G1', 'Prófase', 'Metáfase', 'Anáfase', 'Telófase'], escolher(rng, N2_VALORES), ['cromossomos', 'cromatides'], rng)
  if (nivel === 2) return perguntaFase('meiose', FASES_MEIOSE.filter((f) => f !== 'G1' && f !== 'S/G2'), escolher(rng, N2_VALORES), ['cromossomos', 'cromatides', 'celulas'], rng)
  // nível 3: contagens de células, gametas e DNA
  const variante = escolher(rng, ['mitoses', 'gametas', 'espermatozoides', 'dna'] as const)
  if (variante === 'mitoses') {
    const k = sortear(rng, 3, 8)
    const resposta = celulasAposMitoses(k)
    const erros = limpar(
      [
        { valor: 2 * k, frase: `Você somou 2 a cada divisão (2 × ${k}). O número de células DOBRA a cada mitose: cresce como potência de 2.`, motivo: 'tratou o crescimento como linear' },
        { valor: k * k, frase: `Você calculou ${k}². O número de células dobra a cada divisão: 2^${k}, e não ${k}².`, motivo: 'confundiu 2^k com k²' },
        { valor: celulasAposMitoses(k + 1), frase: `Você contou uma divisão a mais (2^${k + 1}). Partindo de uma célula, ${k} mitoses dão 2^${k}.`, motivo: 'contou uma divisão a mais' },
        { valor: celulasAposMitoses(k - 1), frase: `Você contou uma divisão a menos (2^${k - 1}). Partindo de uma célula, ${k} mitoses dão 2^${k}.`, motivo: 'contou uma divisão a menos' },
      ],
      resposta,
      0.0001,
    )
    return {
      enunciado: `Uma célula sofre ${k} mitoses sucessivas, e todas as células-filhas continuam se dividindo. Quantas células existem ao final?`,
      resposta,
      tolerancia: 0.0001,
      erros,
      resolucao: `Cada mitose dobra o número de células: 2^${k} = ${fn(resposta, 0)} células.`,
      dicas: ['Cada célula se divide em duas.', 'Depois de 1 mitose: 2; depois de 2: 4; depois de 3: 8...', 'O número de células é uma potência de 2.'],
      licao: 'Depois de k mitoses sucessivas, partindo de uma célula, há 2^k células.',
      dados: { tipo: 'celulas' },
    }
  }
  if (variante === 'gametas') {
    const n2 = escolher(rng, [6, 8, 10, 12, 14, 46])
    const resposta = combinacoesDeGametas(n2)
    const erros = limpar(
      [
        { valor: n2, frase: `Você usou o próprio 2n (${n2}). O número de combinações é 2 elevado ao número de PARES de homólogos (n = ${n2 / 2}).`, motivo: 'usou 2n em vez de 2^n' },
        { valor: n2 / 2, frase: `${n2 / 2} é o número de pares (n). Cada par pode ir de dois jeitos para o gameta, então são 2^${n2 / 2} combinações.`, motivo: 'esqueceu de elevar 2 a n' },
        { valor: 2 ** n2, frase: `Você usou 2^${n2}, elevando 2 ao número total de cromossomos. O expoente é o número de pares de homólogos, n = ${n2 / 2}.`, motivo: 'usou 2^(2n)' },
        { valor: (n2 / 2) ** 2, frase: `Você calculou ${n2 / 2}². A fórmula é 2^${n2 / 2}: dois jeitos por par de homólogos.`, motivo: 'confundiu 2^n com n²' },
      ],
      resposta,
      0.0001,
    )
    return {
      enunciado: `Um organismo tem 2n = ${n2} cromossomos. Quantos tipos diferentes de gametas ele pode formar apenas pela segregação independente dos cromossomos homólogos (sem crossing-over)?`,
      resposta,
      tolerancia: 0.0001,
      erros,
      resolucao: `Há n = ${n2 / 2} pares de homólogos. Cada par se separa de 2 jeitos, de forma independente: 2^${n2 / 2} = ${fn(resposta, 0)} tipos de gameta.`,
      dicas: ['Quantos pares de homólogos existem?', 'Cada par segrega de 2 maneiras, de forma independente dos demais.', 'Multiplique: 2 × 2 × ... (uma vez por par).'],
      licao: 'Segregação independente: 2^n combinações de gametas, em que n é o número de pares de homólogos (sem crossing-over).',
      dados: { tipo: 'gametas' },
    }
  }
  if (variante === 'espermatozoides') {
    const n = sortear(rng, 3, 25) * 10
    const espermatozoide = rng() < 0.5
    const resposta = espermatozoide ? 4 * n : n
    const erros = limpar(
      espermatozoide
        ? [
            { valor: n, frase: `Você contou 1 gameta por célula. Na espermatogênese, cada espermatócito primário passa por duas divisões e forma 4 espermatozoides.`, motivo: 'contou 1 gameta por célula' },
            { valor: 2 * n, frase: `Você contou só a primeira divisão da meiose (2 células). A meiose II divide as duas de novo: 4 espermatozoides por espermatócito.`, motivo: 'contou só a meiose I' },
            { valor: 8 * n, frase: `Você contou 8 por célula. Duas divisões sucessivas dão 2 × 2 = 4 células, não 8.`, motivo: 'contou células demais' },
          ]
        : [
            { valor: 4 * n, frase: `Você contou 4 gametas por célula, como na espermatogênese. Na ovogênese, a divisão do citoplasma é desigual e só um óvulo é formado por ovócito primário (os outros são glóbulos polares, que degeneram).`, motivo: 'aplicou a espermatogênese à ovogênese' },
            { valor: 2 * n, frase: `Você contou 2 gametas por célula. Cada ovócito primário forma apenas um óvulo funcional.`, motivo: 'contou 2 gametas por célula' },
            { valor: n / 2, frase: `Você dividiu por 2. Cada ovócito primário forma 1 óvulo: o número de óvulos é igual ao de ovócitos.`, motivo: 'dividiu em vez de manter' },
          ],
      resposta,
      0.0001,
    )
    return {
      enunciado: espermatozoide ? `Quantos espermatozoides se formam a partir de ${fn(n, 0)} espermatócitos primários, se todos completam a meiose?` : `Quantos óvulos funcionais se formam a partir de ${fn(n, 0)} ovócitos primários, se todos completam a meiose e são liberados?`,
      resposta,
      tolerancia: 0.0001,
      erros,
      resolucao: espermatozoide ? `Cada espermatócito primário forma 4 espermatozoides: 4 × ${fn(n, 0)} = ${fn(resposta, 0)}.` : `Cada ovócito primário forma 1 óvulo funcional (e 2 a 3 glóbulos polares): ${fn(n, 0)} ovócitos → ${fn(resposta, 0)} óvulos.`,
      dicas: ['A meiose tem duas divisões sucessivas.', 'Na espermatogênese, as quatro células resultantes viram espermatozoides.', 'Na ovogênese, o citoplasma se divide de modo desigual.'],
      licao: 'Espermatogênese: 1 espermatócito → 4 espermatozoides. Ovogênese: 1 ovócito → 1 óvulo + glóbulos polares.',
      dados: { tipo: 'espermatozoides' },
    }
  }
  // dna: quantidade de DNA em pg ao longo do ciclo
  const g1 = escolher(rng, [4, 6, 8, 10])
  const opcoes: { rotulo: string; tipo: TipoDivisao; fase: string }[] = [
    { rotulo: 'na metáfase da mitose', tipo: 'mitose', fase: 'Metáfase' },
    { rotulo: 'na metáfase I da meiose', tipo: 'meiose', fase: 'Metáfase I' },
    { rotulo: 'em cada célula ao fim da telófase I', tipo: 'meiose', fase: 'Telófase I' },
    { rotulo: 'em cada célula na metáfase II', tipo: 'meiose', fase: 'Metáfase II' },
    { rotulo: 'em cada gameta (fim da meiose)', tipo: 'meiose', fase: 'Telófase II' },
    { rotulo: 'em cada célula-filha ao fim da mitose', tipo: 'mitose', fase: 'Telófase' },
  ]
  const alvo = escolher(rng, opcoes)
  const pg = (tipo: TipoDivisao, fase: string) => (contagem(tipo, fase, 2).dnaPorCelula / contagem('mitose', 'G1', 2).dnaPorCelula) * g1
  const resposta = pg(alvo.tipo, alvo.fase)
  const candidatos = [g1 / 2, g1, 2 * g1].map((v) => ({ valor: v, frase: '' }))
  const erros = limpar(
    candidatos.map((c) => ({
      valor: c.valor,
      frase: c.valor === 2 * g1 ? `${fn(c.valor, 0)} pg é o conteúdo depois da duplicação do DNA (fase S), antes de a célula se dividir.` : c.valor === g1 ? `${fn(c.valor, 0)} pg é o conteúdo de uma célula G1 (antes da duplicação), ou de uma célula-filha de mitose, ou de uma célula com cromossomos duplicados da meiose II.` : `${fn(c.valor, 0)} pg é o conteúdo de um gameta, depois da meiose II (metade do conteúdo de G1).`,
      motivo: 'usou a quantidade de DNA de outra fase',
    })),
    resposta,
    0.0001,
  )
  return {
    enunciado: `Uma célula diploide de um animal tem ${fn(g1, 0)} pg de DNA no núcleo na fase G1 (antes da duplicação). Qual é a quantidade de DNA, em pg, ${alvo.rotulo}?`,
    resposta,
    tolerancia: 0.0001,
    unidade: 'pg',
    erros,
    resolucao: `Depois da fase S, o DNA dobra (${fn(2 * g1, 0)} pg). Na mitose e na meiose I, a célula mantém ${fn(2 * g1, 0)} pg até a divisão; ao fim da telófase I, cada célula tem ${fn(g1, 0)} pg; ao fim da meiose II, cada gameta tem ${fn(g1 / 2, 0)} pg. Resposta ${alvo.rotulo}: ${fn(resposta, 0)} pg.`,
    dicas: ['O DNA dobra na fase S, antes da divisão.', 'A mitose e a meiose I terminam com duas células; a meiose II, com quatro.', 'A quantidade de DNA por célula cai pela metade a cada divisão do citoplasma.'],
    licao: 'DNA por célula: G1 = x; depois de S = 2x; fim da mitose ou da meiose I = x; fim da meiose II (gameta) = x/2.',
    dados: { tipo: 'dna' },
  }
}

/* ================================================================== reconhecer fases em figuras */

export interface DadosFase {
  tipo: TipoDivisao
  fase: string
}

/** O que se vê na figura de cada fase (para 2n = 4): usado para explicar por que as outras opções não servem. */
export const PISTAS: Record<TipoDivisao, Record<string, string>> = {
  mitose: {
    Prófase: 'os cromossomos já estão condensados e duplicados, espalhados pela célula, sem núcleo delimitado e ainda sem placa no equador',
    Metáfase: 'os cromossomos duplicados estão enfileirados no equador, cada um independente, sem se juntar ao homólogo',
    Anáfase: 'as cromátides-irmãs já se separaram e formam dois grupos idênticos que se afastam para polos opostos',
    Telófase: 'há duas células-filhas, cada uma com cromossomos simples e um núcleo reorganizado',
  },
  meiose: {
    'Prófase I': 'os cromossomos duplicados se emparelham com os seus homólogos (tétrades) e ainda estão espalhados na célula',
    'Metáfase I': 'os pares de homólogos estão alinhados juntos no equador, cada cromossomo ao lado do seu homólogo',
    'Anáfase I': 'os homólogos se separam e vão para polos opostos, ainda com duas cromátides cada (cromossomos duplicados)',
    'Telófase I': 'há duas células com metade do número de cromossomos, ainda duplicados',
    'Prófase II': 'há duas células, cada uma com cromossomos duplicados espalhados e sem homólogos pareados',
    'Metáfase II': 'há duas células, cada uma com metade do número de cromossomos, duplicados e alinhados no equador',
    'Anáfase II': 'há duas células em que as cromátides-irmãs se separam e vão para polos opostos',
    'Telófase II': 'há quatro células, cada uma com cromossomos simples e metade do número original',
  },
}

const nomeFase = (tipo: TipoDivisao, fase: string) => `${tipo === 'mitose' ? 'Mitose' : 'Meiose'}: ${minus(fase)}`
const faseDaMitose = (fase: string) => `${fase} da mitose`
const faseDaMeiose = (fase: string) => `${fase} da meiose`

export const PAR_CONFUSAO: Record<string, string> = {
  'Metáfase I': 'Metáfase II',
  'Metáfase II': 'Metáfase I',
  'Anáfase I': 'Anáfase II',
  'Anáfase II': 'Anáfase I',
}

/** Como reconhecer a fase certa e por que a opção escolhida não é ela. */
function explicarFase(tipo: TipoDivisao, certa: string, outraTipo: TipoDivisao, outra: string): string {
  return `Na ${minus(outra)} ${outraTipo === 'mitose' ? 'da mitose' : 'da meiose'}, ${PISTAS[outraTipo][outra]}. Na figura, ${PISTAS[tipo][certa]}.`
}

const DICAS_FASES = [
  'Veja primeiro quantas células há na figura e quantos cromossomos há em cada uma.',
  'Cromossomos duplicados têm duas cromátides coladas; depois da anáfase aparecem cromátides soltas, simples.',
  'Na meiose I os homólogos ficam juntos até a anáfase I; na meiose II e na mitose, os cromossomos não se emparelham.',
]

export function gerarFases(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFase> {
  if (nivel === 1) {
    const fase = escolher(rng, FASES_MITOSE.filter((f) => f !== 'G1' && f !== 'S/G2'))
    const todas = FASES_MITOSE.filter((f) => f !== 'G1' && f !== 'S/G2')
    return montar<DadosFase>(
      rng,
      { texto: faseDaMitose(fase), porque: `Na figura, ${PISTAS.mitose[fase]}.` },
      todas.filter((f) => f !== fase).map((f): Opc => ({ texto: faseDaMitose(f), porque: explicarFase('mitose', fase, 'mitose', f), motivo: `confundiu com ${minus(f)}` })),
      {
        enunciado: 'A figura mostra uma célula somática de um organismo com 2n = 4 em divisão. Em que fase da mitose ela está?',
        resolucao: `Na figura, ${PISTAS.mitose[fase]}: é a ${minus(fase)}.`,
        dicas: DICAS_FASES,
        licao: 'Mitose: prófase (cromossomos condensando), metáfase (alinhados no equador), anáfase (cromátides-irmãs se separam), telófase (dois núcleos).',
        dados: { tipo: 'mitose', fase },
      },
    )
  }
  if (nivel === 2) {
    const todas = ['Prófase I', 'Metáfase I', 'Anáfase I', 'Metáfase II', 'Anáfase II', 'Telófase II']
    const fase = escolher(rng, todas)
    const confusa = PAR_CONFUSAO[fase]
    const outras = embaralhar(
      rng,
      todas.filter((f) => f !== fase && f !== confusa),
    )
    const escolhidas = [...(confusa ? [confusa] : []), ...outras].slice(0, 3)
    return montar<DadosFase>(
      rng,
      { texto: faseDaMeiose(fase), porque: `Na figura, ${PISTAS.meiose[fase]}.` },
      escolhidas.map((f): Opc => ({ texto: faseDaMeiose(f), porque: explicarFase('meiose', fase, 'meiose', f), motivo: `confundiu com ${minus(f)}` })),
      {
        enunciado: 'A figura mostra uma célula de um organismo com 2n = 4 em meiose. Em que fase da meiose ela está?',
        resolucao: `Na figura, ${PISTAS.meiose[fase]}: é a ${minus(fase)}.`,
        dicas: DICAS_FASES,
        licao: 'Meiose I: homólogos pareados (metáfase I) e depois separados (anáfase I). Meiose II: cromátides-irmãs se separam (anáfase II), formando 4 células haploides.',
        dados: { tipo: 'meiose', fase },
      },
    )
  }
  // nível 3: mitose ou meiose, e qual fase
  const grupos: { alvos: [TipoDivisao, string][]; extra: [TipoDivisao, string] }[] = [
    {
      alvos: [
        ['mitose', 'Metáfase'],
        ['meiose', 'Metáfase I'],
        ['meiose', 'Metáfase II'],
      ],
      extra: ['meiose', 'Prófase II'],
    },
    {
      alvos: [
        ['mitose', 'Anáfase'],
        ['meiose', 'Anáfase I'],
        ['meiose', 'Anáfase II'],
      ],
      extra: ['mitose', 'Telófase'],
    },
  ]
  const grupo = escolher(rng, grupos)
  const [tipo, fase] = escolher(rng, grupo.alvos)
  const opcoes = [...grupo.alvos, grupo.extra]
  return montar<DadosFase>(
    rng,
    { texto: nomeFase(tipo, fase), porque: `Na figura, ${PISTAS[tipo][fase]}.` },
    opcoes.filter(([t, f]) => !(t === tipo && f === fase)).map(([t, f]): Opc => ({ texto: nomeFase(t, f), porque: explicarFase(tipo, fase, t, f), motivo: `confundiu com ${t === 'mitose' ? 'mitose' : 'meiose'}: ${minus(f)}` })),
    {
      enunciado: 'A figura mostra uma célula (ou células) de um organismo com 2n = 4. Qual é o processo e a fase representados?',
      resolucao: `Na figura, ${PISTAS[tipo][fase]}: é ${tipo === 'mitose' ? 'mitose' : 'meiose'}, ${minus(fase)}.`,
      dicas: [...DICAS_FASES, 'Metáfase da mitose e metáfase I parecem alinhar cromossomos no equador: a diferença é se os homólogos estão juntos ou não.'],
      licao: 'Homólogos pareados no equador: metáfase I. Cromossomos duplicados soltos no equador de uma célula com 2n: mitose. Metade dos cromossomos, em duas células: metáfase II.',
      dados: { tipo, fase },
    },
  )
}
