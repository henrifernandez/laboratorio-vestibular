import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { BANCO_EVIDENCIAS, EXEMPLOS_PLACAS, type ExemploPlacas } from '@/conteudo/geografia/placas'
import { doBanco } from '../comum/banco'
import { LIMITES, NOME_CROSTA, NOME_MOVIMENTO, deslocamentoKm, limiteDe, taxaTotal, tempoMa, type Crosta, type IdLimite, type Movimento } from './calculo'

const IDS: IdLimite[] = ['dorsal', 'rifte', 'subducao-continental', 'subducao-oceanica', 'colisao', 'transformante']

/** Texto curto que descreve o resultado de cada limite (as alternativas da pergunta). */
export const RESUMO_OPCAO: Record<IdLimite, string> = {
  dorsal: 'Dorsal oceânica, com crosta nova dos dois lados',
  rifte: 'Rifte continental: vale de afundamento com vulcões nas bordas',
  'subducao-continental': 'Fossa, cordilheira com vulcões e terremotos profundos',
  'subducao-oceanica': 'Fossa profunda e arco de ilhas vulcânicas',
  colisao: 'Cordilheira dobrada muito alta, quase sem vulcões',
  transformante: 'Falha longa, com terremotos fortes e sem vulcões',
}

/** Encontro de placas que gera cada limite. */
export const ENCONTRO: Record<IdLimite, string> = {
  dorsal: 'Duas placas oceânicas se afastando',
  rifte: 'Duas placas continentais se afastando',
  'subducao-continental': 'Uma placa oceânica e uma continental se aproximando',
  'subducao-oceanica': 'Duas placas oceânicas se aproximando',
  colisao: 'Duas placas continentais se aproximando',
  transformante: 'Duas placas deslizando lado a lado',
}

/** Pistas observáveis; a primeira de cada lista só combina com aquele limite. */
export const PISTAS_LIMITE: Record<IdLimite, string[]> = {
  dorsal: ['uma cadeia de montanhas submarina no meio do oceano', 'crosta cada vez mais velha conforme se afasta do eixo da cadeia', 'terremotos fracos e rasos'],
  rifte: ['um vale de afundamento dentro de um continente', 'vulcões nas bordas do vale', 'lagos compridos no fundo do vale'],
  'subducao-continental': ['uma fossa oceânica ao lado de uma cordilheira com vulcões ativos', 'terremotos que chegam a centenas de quilômetros de profundidade', 'uma placa oceânica afundando sob o continente'],
  'subducao-oceanica': ['um arco de ilhas vulcânicas', 'uma fossa muito profunda ao lado do arco', 'terremotos profundos'],
  colisao: ['uma cordilheira dobrada muito alta, sem vulcanismo importante', 'fósseis marinhos em grandes altitudes', 'muitos terremotos, mas quase nenhum vulcão'],
  transformante: ['uma falha longa e retilínea, sem vulcões', 'rios e estradas cortados e deslocados', 'terremotos fortes e rasos'],
}

export interface DadosLimite {
  limite: IdLimite | 'intraplaca'
  ordem?: [Crosta, Crosta]
}

/** Alternativas erradas para uma pergunta cujo limite correto é `certo`. */
function erradasDe(rng: Rng, certo: IdLimite, texto: Record<IdLimite, string>, explicar: (id: IdLimite) => string): Opc[] {
  const outros = embaralhar(
    rng,
    IDS.filter((id) => id !== certo),
  ).slice(0, 3)
  return outros.map((id) => ({ texto: texto[id], porque: explicar(id), motivo: `confundiu com ${LIMITES[id].nome.toLowerCase()}` }))
}

const COMBINACOES_N1: [Crosta, Crosta, Movimento][] = [
  ['oceanica', 'continental', 'aproximam'],
  ['continental', 'oceanica', 'aproximam'],
  ['oceanica', 'oceanica', 'afastam'],
  ['oceanica', 'continental', 'deslizam'],
]
const COMBINACOES_N2: [Crosta, Crosta, Movimento][] = [
  ['continental', 'continental', 'aproximam'],
  ['oceanica', 'oceanica', 'aproximam'],
  ['continental', 'continental', 'afastam'],
  ['oceanica', 'oceanica', 'afastam'],
  ['continental', 'continental', 'deslizam'],
]

const nomeCrosta = (c: Crosta) => `placa ${NOME_CROSTA[c]}`

export function gerarLimite(rng: Rng, nivel: Nivel): InstanciaMulti<DadosLimite> {
  if (nivel === 3) {
    const certo = escolher(rng, IDS)
    const pistas = PISTAS_LIMITE[certo]
    const sorteadas = [pistas[0] as string, ...embaralhar(rng, pistas.slice(1)).slice(0, 1)]
    const l = LIMITES[certo]
    return montar<DadosLimite>(
      rng,
      { texto: ENCONTRO[certo], porque: `${l.nome}: ${l.explicacao}` },
      erradasDe(rng, certo, ENCONTRO, (id) => `${ENCONTRO[id]} produz ${RESUMO_OPCAO[id].toLowerCase()}, e isso não combina com o que foi observado.`),
      {
        enunciado: `Numa região foram observados: ${sorteadas.join('; ')}. Que encontro de placas explica o que foi observado?`,
        resolucao: `As pistas apontam para ${l.nome.toLowerCase()}. ${l.explicacao}`,
        dicas: [
          'Separe as pistas: há vulcões? Há fossa? As placas parecem estar se afastando, se aproximando ou deslizando?',
          `Procure a pista mais específica: “${sorteadas[0]}”.`,
          `Esta pista é típica de: ${l.nome.toLowerCase()}.`,
        ],
        licao: 'Parta das pistas (fossa, vulcões, cordilheira, falha) e descubra que movimento e que tipos de crosta produzem aquilo.',
        dados: { limite: certo },
      },
    )
  }
  const [a, b, mov] = escolher(rng, nivel === 1 ? COMBINACOES_N1 : [...COMBINACOES_N2, ...COMBINACOES_N1.slice(0, 2)])
  const l = limiteDe(a, b, mov)
  if (!l) throw new Error('combinação inválida')
  return montar<DadosLimite>(
    rng,
    { texto: RESUMO_OPCAO[l.id], porque: l.explicacao },
    erradasDe(rng, l.id, RESUMO_OPCAO, (id) => `${RESUMO_OPCAO[id]} é o resultado de: ${ENCONTRO[id].toLowerCase()}. Aqui o encontro é outro.`),
    {
      enunciado: `Uma ${nomeCrosta(a)} e uma ${nomeCrosta(b)} ${NOME_MOVIMENTO[mov]}. O que se forma na região de contato?`,
      resolucao: `${mov === 'afastam' ? 'Afastamento' : mov === 'aproximam' ? 'Aproximação' : 'Deslizamento'} de ${a === b ? `duas placas ${a === 'oceanica' ? 'oceânicas' : 'continentais'}` : 'uma placa oceânica e uma continental'}: ${l.nome}. ${l.explicacao}`,
      dicas: [
        'Primeiro o movimento: afastam (divergente), aproximam (convergente) ou deslizam (transformante).',
        mov === 'aproximam' ? 'Na aproximação, olhe o tipo de crosta: a oceânica, mais densa, afunda; duas continentais não afundam.' : mov === 'afastam' ? 'No afastamento, olhe onde ocorre: no oceano ou dentro de um continente.' : 'No deslizamento, não há crosta criada nem destruída.',
        `O nome do limite é ${l.nome.toLowerCase()}.`,
      ],
      licao: 'Movimento + tipo de crosta definem a feição: afastar cria crosta; aproximar destrói (oceânica) ou dobra (continental); deslizar só gera terremotos.',
      dados: { limite: l.id, ordem: [a, b] },
    },
  )
}

/* ------------------------------------------------------------------ exemplos reais */

export type DadosExemplo = { exemplo: string }
const ROTULO_EXEMPLO: Record<ExemploPlacas['limite'], string> = {
  dorsal: 'Dorsal oceânica (limite divergente)',
  rifte: 'Rifte continental (limite divergente)',
  'subducao-continental': 'Subducção oceano-continente (limite convergente)',
  'subducao-oceanica': 'Subducção oceano-oceano (limite convergente)',
  colisao: 'Colisão continental (limite convergente)',
  transformante: 'Falha transformante (limite transformante)',
  intraplaca: 'No interior de uma placa, longe dos limites',
}
const ORDEM_ROTULOS = Object.keys(ROTULO_EXEMPLO) as ExemploPlacas['limite'][]

/** Frase que diz o que acontece com a crosta no exemplo (para o nível 3). */
const CROSTA_DO_EXEMPLO: Record<ExemploPlacas['limite'], string> = {
  dorsal: 'A crosta é criada: o magma sobe, esfria e vira crosta nova.',
  rifte: 'A crosta continental é esticada e afinada, e pode virar crosta oceânica.',
  'subducao-continental': 'A crosta oceânica é destruída: afunda no manto sob o continente.',
  'subducao-oceanica': 'A crosta oceânica mais velha é destruída: afunda sob a outra placa.',
  colisao: 'Nenhuma crosta afunda: a crosta continental é empilhada e dobrada.',
  transformante: 'A crosta não é criada nem destruída: as placas deslizam.',
  intraplaca: 'A crosta não participa de nenhum limite: fica estável, no meio da placa.',
}

export function gerarExemplo(rng: Rng, nivel: Nivel): InstanciaMulti<DadosExemplo> {
  if (nivel === 1) {
    const ex = escolher(rng, EXEMPLOS_PLACAS)
    const certo = ex.limite
    const outros = embaralhar(
      rng,
      ORDEM_ROTULOS.filter((l) => l !== certo),
    ).slice(0, 3)
    return montar<DadosExemplo>(
      rng,
      { texto: ROTULO_EXEMPLO[certo], porque: `${ex.nome}: ${ex.placas}. ${ex.descricao}` },
      outros.map((l) => ({ texto: ROTULO_EXEMPLO[l], porque: `${ROTULO_EXEMPLO[l]} seria outro caso; ${ex.nome} é ${ROTULO_EXEMPLO[certo].toLowerCase()}.`, motivo: 'tipo de limite errado' })),
      {
        enunciado: `Em que situação tectônica se encontra: ${ex.nome}?`,
        resolucao: `${ex.nome}: ${ex.placas}. ${ex.descricao}`,
        dicas: [`As placas envolvidas: ${ex.placas}.`, 'Pergunte: elas se afastam, se aproximam ou deslizam? E que tipo de crosta há em cada lado?', `Pista: ${ex.pistas[0]}.`],
        licao: 'Memorize um exemplo para cada caso: Dorsal Meso-Atlântica, Rifte Africano, Andes, Japão/Marianas, Himalaia, San Andreas e o interior do Brasil.',
        dados: { exemplo: ex.id },
      },
    )
  }
  if (nivel === 2) {
    const candidatos = EXEMPLOS_PLACAS.filter((e) => e.id !== 'alpes')
    const ex = escolher(rng, candidatos)
    const pistas = embaralhar(rng, ex.pistas).slice(0, 2)
    const outros = embaralhar(
      rng,
      EXEMPLOS_PLACAS.filter((e) => e.id !== ex.id && !(ex.limite === 'colisao' && e.limite === 'colisao')),
    ).slice(0, 3)
    return montar<DadosExemplo>(
      rng,
      { texto: ex.nome, porque: `${ex.nome}: ${ex.descricao}` },
      outros.map((o) => ({ texto: o.nome, porque: `${o.nome}: ${o.descricao} Isso não combina com as pistas dadas.`, motivo: `confundiu com ${o.nome}` })),
      {
        enunciado: `Qual destes lugares tem as características seguintes: ${pistas.join('; ')}?`,
        resolucao: `${ex.nome} (${ex.placas}). ${ex.descricao}`,
        dicas: ['Decida primeiro o tipo de limite que as pistas indicam (há fossa? vulcões? falha? cadeia submarina?).', `As placas envolvidas são: ${ex.placas}.`, `O lugar é ${ex.nome}.`],
        licao: 'Ligue cada lugar famoso ao seu tipo de limite: assim as pistas (fossa, vulcões, falha) apontam o exemplo.',
        dados: { exemplo: ex.id },
      },
    )
  }
  const candidatos = EXEMPLOS_PLACAS.filter((e) => e.id !== 'alpes')
  const ex = escolher(rng, candidatos)
  const outros = embaralhar(
    rng,
    ORDEM_ROTULOS.filter((l) => l !== ex.limite && CROSTA_DO_EXEMPLO[l] !== CROSTA_DO_EXEMPLO[ex.limite]),
  ).slice(0, 3)
  return montar<DadosExemplo>(
    rng,
    { texto: CROSTA_DO_EXEMPLO[ex.limite], porque: `${ex.nome}: ${ex.placas}. ${CROSTA_DO_EXEMPLO[ex.limite]}` },
    outros.map((l) => ({ texto: CROSTA_DO_EXEMPLO[l], porque: `Isso descreve ${ROTULO_EXEMPLO[l].toLowerCase()}, não ${ex.nome}.`, motivo: 'atribuiu a crosta de outro limite' })),
    {
      enunciado: `O que acontece com a crosta na região de ${ex.nome}?`,
      resolucao: `${ex.nome}: ${ex.placas}. ${CROSTA_DO_EXEMPLO[ex.limite]}`,
      dicas: ['Lembre: divergente cria crosta, convergente destrói (oceânica) ou dobra (continental), transformante só desliza.', `As placas são: ${ex.placas}.`, `Este é um caso de ${ROTULO_EXEMPLO[ex.limite].toLowerCase()}.`],
      licao: 'Para saber o destino da crosta, descubra o tipo de limite: criada (divergente), destruída ou dobrada (convergente), preservada (transformante e interior da placa).',
      dados: { exemplo: ex.id },
    },
  )
}

/* ------------------------------------------------------------------ evidências */

export type DadosEvidencia = undefined
export function gerarEvidencia(rng: Rng, nivel: Nivel): InstanciaMulti<DadosEvidencia> {
  const faixa = nivel === 1 ? [0, 4, 5] : nivel === 2 ? [1, 3, 5] : [1, 2, 3]
  const idx = escolher(rng, faixa)
  const item = BANCO_EVIDENCIAS[idx]
  if (!item) throw new Error('item de banco ausente')
  return doBanco<DadosEvidencia>(rng, [item])
}

/* ------------------------------------------------------------------ contas */

export interface DadosDeslocamento {
  tipo: 'distancia' | 'tempo' | 'velocidade' | 'taxa-total' | 'largura'
}

const V = [2, 3, 4, 5, 6, 8]
const T = [10, 20, 25, 40, 50, 100]
const MEIA = [1, 1.5, 2, 2.5, 3, 4]
const IDADES = [20, 40, 60, 80, 100, 120]

const num = (n: number) => fn(n, 2)

export function gerarDeslocamento(rng: Rng, nivel: Nivel): InstanciaNum<DadosDeslocamento> {
  if (nivel === 1) {
    const v = escolher(rng, V)
    const t = escolher(rng, T)
    const d = deslocamentoKm(v, t)
    const tol = Math.max(1, d * 0.01)
    return {
      enunciado: `Uma placa se move a ${v} cm/ano. Em ${t} milhões de anos, qual distância ela percorre, em km?`,
      resposta: d,
      tolerancia: tol,
      unidade: 'km',
      erros: limpar(
        [
          { valor: v * t, frase: `Você fez ${v} × ${t} = ${num(v * t)}, mas esse resultado está em “cm/ano × Ma”. Falta o fator 10 que converte para km.`, motivo: 'esqueceu o fator 10' },
          { valor: v * t * 100, frase: 'Você multiplicou por 100 em vez de 10. 1 cm/ano são 10 km por milhão de anos, não 100.', motivo: 'fator 100 em vez de 10' },
          { valor: (v * t) / 10, frase: 'Você dividiu por 10 em vez de multiplicar. Em 1 milhão de anos, 1 cm/ano soma 10 km.', motivo: 'dividiu em vez de multiplicar' },
        ],
        d,
        tol,
      ),
      resolucao: `1 cm/ano = 10 km a cada milhão de anos. Distância = ${v} × ${t} × 10 = ${num(d)} km.`,
      dicas: ['Primeiro descubra quantos km são 1 cm/ano em 1 milhão de anos: 1 cm × 1.000.000 = 10 km.', 'Multiplique a velocidade (cm/ano) pelo tempo (milhões de anos) e depois por 10.', `${v} × ${t} × 10`],
      licao: 'Deslocamento (km) = velocidade (cm/ano) × tempo (milhões de anos) × 10.',
      dados: { tipo: 'distancia' },
    }
  }
  if (nivel === 2) {
    const v = escolher(rng, V)
    const t = escolher(rng, T)
    const d = deslocamentoKm(v, t)
    if (rng() < 0.5) {
      const tol = 0.05
      return {
        enunciado: `Um bloco de crosta se desloca ${num(d)} km a ${v} cm/ano. Quantos milhões de anos levou?`,
        resposta: tempoMa(d, v),
        tolerancia: tol,
        unidade: 'milhões de anos',
        erros: limpar(
          [
            { valor: d / v, frase: `Você fez ${num(d)} ÷ ${v} sem converter: faltou dividir também por 10, porque 1 cm/ano = 10 km/Ma.`, motivo: 'esqueceu o fator 10' },
            { valor: d / v / 100, frase: 'Você dividiu por 100 em vez de 10.', motivo: 'fator 100 em vez de 10' },
            { valor: d * v, frase: 'Você multiplicou distância e velocidade; para achar o tempo, divida a distância pela velocidade.', motivo: 'multiplicou em vez de dividir' },
          ],
          t,
          tol,
        ),
        resolucao: `Tempo = distância ÷ (velocidade × 10) = ${num(d)} ÷ (${v} × 10) = ${num(t)} milhões de anos.`,
        dicas: ['Use d = v × t × 10 e isole o tempo.', 'Tempo = d ÷ (v × 10).', `${num(d)} ÷ ${v * 10}`],
        licao: 'Isolando o tempo: t (Ma) = d (km) ÷ (v (cm/ano) × 10).',
        dados: { tipo: 'tempo' },
      }
    }
    return {
      enunciado: `Um bloco de crosta se desloca ${num(d)} km em ${t} milhões de anos. Qual a velocidade média, em cm/ano?`,
      resposta: v,
      tolerancia: 0.05,
      unidade: 'cm/ano',
      erros: limpar(
        [
          { valor: d / t, frase: `Você fez ${num(d)} ÷ ${t} = ${num(d / t)}, que está em km por milhão de anos. Divida por 10 para ter cm/ano.`, motivo: 'esqueceu de converter km/Ma em cm/ano' },
          { valor: d / t / 100, frase: 'Você dividiu por 100 em vez de 10.', motivo: 'fator 100 em vez de 10' },
          { valor: d * t, frase: 'Você multiplicou; para a velocidade, divida a distância pelo tempo.', motivo: 'multiplicou em vez de dividir' },
        ],
        v,
        0.05,
      ),
      resolucao: `${num(d)} km em ${t} Ma são ${num(d / t)} km/Ma. Como 10 km/Ma = 1 cm/ano, a velocidade é ${num(v)} cm/ano.`,
      dicas: ['Primeiro ache km por milhão de anos: distância ÷ tempo.', '10 km por milhão de anos equivalem a 1 cm/ano.', `${num(d / t)} ÷ 10`],
      licao: 'v (cm/ano) = d (km) ÷ (t (Ma) × 10).',
      dados: { tipo: 'velocidade' },
    }
  }
  const meia = escolher(rng, MEIA)
  if (rng() < 0.5) {
    const idade = escolher(rng, IDADES)
    const km = deslocamentoKm(meia, idade)
    const total = taxaTotal(meia)
    return {
      enunciado: `Numa dorsal, a crosta oceânica tem ${idade} milhões de anos a ${num(km)} km do eixo, de um dos lados. Os dois lados se afastam de modo simétrico. Qual a taxa total de abertura do oceano, em cm/ano?`,
      resposta: total,
      tolerancia: 0.05,
      unidade: 'cm/ano',
      erros: limpar(
        [
          { valor: meia, frase: `Você calculou a velocidade de um lado só (${num(meia)} cm/ano). A abertura do oceano é a soma dos dois lados, o dobro.`, motivo: 'esqueceu de dobrar (meia-taxa)' },
          { valor: km / idade, frase: `Você fez ${num(km)} ÷ ${idade}, que dá km por milhão de anos; falta dividir por 10 e depois dobrar.`, motivo: 'esqueceu o fator 10' },
          { valor: total * 10, frase: 'Você multiplicou por 10 em vez de dividir. Para ir de km/Ma a cm/ano, divida por 10.', motivo: 'multiplicou em vez de dividir' },
        ],
        total,
        0.05,
      ),
      resolucao: `Meia-taxa = ${num(km)} ÷ (${idade} × 10) = ${num(meia)} cm/ano. Como as duas placas se afastam, a taxa total é 2 × ${num(meia)} = ${num(total)} cm/ano.`,
      dicas: ['A idade da crosta diz há quanto tempo ela se afasta do eixo, sobre um dos lados.', 'Calcule a velocidade de um lado e lembre-se de que o oceano se abre pelos dois.', `Velocidade de um lado: ${num(km)} ÷ (${idade} × 10); depois dobre.`],
      licao: 'Meia-taxa = distância ÷ (idade × 10). Taxa de abertura = 2 × meia-taxa.',
      dados: { tipo: 'taxa-total' },
    }
  }
  const ma = escolher(rng, [20, 40, 60, 80, 100, 120])
  const largura = deslocamentoKm(taxaTotal(meia), ma)
  const tol = Math.max(1, largura * 0.01)
  return {
    enunciado: `Cada lado de uma dorsal se afasta do eixo a ${num(meia)} cm/ano. Qual a largura do oceano aberto depois de ${ma} milhões de anos, em km?`,
    resposta: largura,
    tolerancia: tol,
    unidade: 'km',
    erros: limpar(
      [
        { valor: largura / 2, frase: `Você calculou só um lado (${num(largura / 2)} km). O oceano alarga com os dois lados se afastando, o dobro.`, motivo: 'esqueceu de dobrar (meia-taxa)' },
        { valor: largura / 10, frase: 'Você esqueceu o fator 10 de conversão (1 cm/ano = 10 km/Ma).', motivo: 'esqueceu o fator 10' },
        { valor: largura * 10, frase: 'Você multiplicou duas vezes por 10; o fator é aplicado uma só vez.', motivo: 'aplicou o fator 10 duas vezes' },
      ],
      largura,
      tol,
    ),
    resolucao: `Taxa total = 2 × ${num(meia)} = ${num(2 * meia)} cm/ano. Largura = ${num(2 * meia)} × ${ma} × 10 = ${num(largura)} km.`,
    dicas: ['Cada lado se afasta com a meia-taxa; o oceano cresce com os dois lados.', 'Taxa total = 2 × meia-taxa.', `Distância = taxa total × tempo × 10 = ${num(2 * meia)} × ${ma} × 10`],
    licao: 'Largura do oceano (km) = 2 × meia-taxa (cm/ano) × tempo (Ma) × 10.',
    dados: { tipo: 'largura' },
  }
}
