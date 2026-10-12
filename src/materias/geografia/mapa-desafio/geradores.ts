import { BANCO_COORDENADAS, BANCO_PROJECAO, FRONTEIRAS, PAISES, VIZINHOS_DO_BRASIL, paisPorId, type PaisInfo } from '@/conteudo/geografia/mapa-desafio'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { doBanco, faixaDoBanco } from '../comum/banco'
import { distanciaReal, formatarCoordenada, formatarEscala, formatarLat, formatarLon, hemisferioLO, hemisferioNS } from './calculo'
import type { PontoMapa, RegiaoMapa } from './Visuais'

const BRASIL = '076'
const COR_BRASIL = 'var(--geo-brasil)'
const COR_DESTAQUE = 'var(--geo-quente)'

/** Dados enviados ao desenho do mapa. */
export interface DadosMapa {
  regiao: RegiaoMapa
  destaques: Record<string, string>
  descricao: string
  /** país cujo centro aproximado vai no texto alternativo */
  centroDe?: string
  pontos?: PontoMapa[]
}

export interface DadosEscala {
  denominador?: number
  cm?: number
}

/* ------------------------------------------------------------------ coordenadas */

type Quadrante = { ns: 'Norte' | 'Sul'; lo: 'Oriental' | 'Ocidental' }
const QUADRANTES: Quadrante[] = [
  { ns: 'Norte', lo: 'Oriental' },
  { ns: 'Norte', lo: 'Ocidental' },
  { ns: 'Sul', lo: 'Oriental' },
  { ns: 'Sul', lo: 'Ocidental' },
]
const nomeQuadrante = (q: Quadrante) => `Hemisférios ${q.ns} e ${q.lo}`

const sortearNoQuadrante = (rng: Rng, q: Quadrante) => ({
  lat: sortear(rng, 8, 72) * (q.ns === 'Norte' ? 1 : -1),
  lon: sortear(rng, 8, 168) * (q.lo === 'Oriental' ? 1 : -1),
})

export function gerarCoordenadas(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMapa> {
  if (nivel === 3) return doBanco<DadosMapa>(rng, BANCO_COORDENADAS)
  if (nivel === 1) {
    const alvo = escolher(rng, QUADRANTES)
    const c = sortearNoQuadrante(rng, alvo)
    const certa: Opc = { texto: nomeQuadrante(alvo), porque: `Latitude ${formatarLat(c.lat)}: Hemisfério ${hemisferioNS(c.lat)}. Longitude ${formatarLon(c.lon)}: Hemisfério ${hemisferioLO(c.lon)}.` }
    const erradas: Opc[] = QUADRANTES.filter((q) => q !== alvo).map((q) => ({
      texto: nomeQuadrante(q),
      porque: q.ns !== alvo.ns && q.lo !== alvo.lo ? `Os dois hemisférios estão trocados: o ponto está no ${alvo.ns} (${c.lat > 0 ? 'N' : 'S'}) e no ${alvo.lo} (${c.lon > 0 ? 'L' : 'O'}).` : q.ns !== alvo.ns ? `A latitude ${c.lat > 0 ? 'N' : 'S'} indica o Hemisfério ${alvo.ns}, e não o ${q.ns}.` : `A longitude ${c.lon > 0 ? 'L' : 'O'} indica o Hemisfério ${alvo.lo}, e não o ${q.lo}.`,
      motivo: q.ns !== alvo.ns && q.lo !== alvo.lo ? 'trocou os dois hemisférios' : q.ns !== alvo.ns ? 'errou o hemisfério pela latitude' : 'errou o hemisfério pela longitude',
    }))
    return montar<DadosMapa>(rng, certa, erradas, {
      enunciado: `Um ponto tem coordenadas ${formatarCoordenada(c)}. Em quais hemisférios ele está?`,
      resolucao: `${formatarCoordenada(c)}: a latitude ${c.lat > 0 ? 'norte (N)' : 'sul (S)'} indica o Hemisfério ${alvo.ns}; a longitude ${c.lon > 0 ? 'leste (L)' : 'oeste (O)'} indica o ${alvo.lo}.`,
      dicas: ['A latitude (N ou S) diz o hemisfério Norte ou Sul.', 'A longitude (L ou O) diz o hemisfério Oriental (leste) ou Ocidental (oeste).', 'Leia a letra que acompanha cada número.'],
      licao: 'Latitude N/S → hemisfério Norte/Sul. Longitude L/O → hemisfério Oriental/Ocidental.',
      dados: { regiao: 'mundo', destaques: {}, descricao: `Mapa-múndi com um ponto marcado nas coordenadas ${formatarCoordenada(c)}.`, pontos: [{ lat: c.lat, lon: c.lon }] },
    })
  }
  // nível 2: quatro pontos, um em cada quadrante, e a pergunta é qual deles está em certo quadrante
  const alvo = escolher(rng, QUADRANTES)
  const ordem = embaralhar(rng, QUADRANTES)
  const pontos = ordem.map((q) => ({ q, ...sortearNoQuadrante(rng, q) }))
  const certa = pontos.find((p) => p.q === alvo)!
  const rotulo = (i: number) => `Ponto ${i + 1}`
  const opc = (p: (typeof pontos)[number], i: number) => `${rotulo(i)}: ${formatarCoordenada(p)}`
  const certaOpc: Opc = { texto: opc(certa, pontos.indexOf(certa)), porque: `${formatarCoordenada(certa)} está nos Hemisférios ${alvo.ns} e ${alvo.lo}.` }
  const erradas: Opc[] = pontos
    .filter((p) => p !== certa)
    .map((p) => ({ texto: opc(p, pontos.indexOf(p)), porque: `${formatarCoordenada(p)} está nos Hemisférios ${p.q.ns} e ${p.q.lo}, e não ${alvo.ns === p.q.ns ? 'no ' + alvo.lo : alvo.lo === p.q.lo ? 'no ' + alvo.ns : 'nos hemisférios pedidos'}.`, motivo: 'olhou só um dos hemisférios' }))
  return montar<DadosMapa>(rng, certaOpc, erradas, {
    enunciado: `O mapa mostra quatro pontos numerados. Qual deles está nos Hemisférios ${alvo.ns} e ${alvo.lo}?`,
    resolucao: `${pontos.map((p, i) => `${rotulo(i)}: ${formatarCoordenada(p)} (${p.q.ns}, ${p.q.lo})`).join('; ')}. O pedido é ${alvo.ns} e ${alvo.lo}: ${rotulo(pontos.indexOf(certa))}.`,
    dicas: ['Olhe primeiro a latitude: N ou S?', 'Depois olhe a longitude: L ou O?', 'O ponto certo atende aos dois pedidos ao mesmo tempo.'],
    licao: 'Combine os dois hemisférios: latitude (Norte ou Sul) e longitude (Oriental ou Ocidental).',
    dados: {
      regiao: 'mundo',
      destaques: {},
      descricao: `Mapa-múndi com quatro pontos numerados: ${pontos.map((p, i) => `${rotulo(i)} em ${formatarCoordenada(p)}`).join('; ')}.`,
      pontos: pontos.map((p, i) => ({ lat: p.lat, lon: p.lon, rotulo: String(i + 1) })),
    },
  })
}

/* ------------------------------------------------------------------ escala */

const DENOMINADORES = [25_000, 50_000, 100_000, 250_000, 500_000]
const DENOMINADORES_GRANDES = [500_000, 1_000_000, 2_000_000, 2_500_000, 4_000_000]
type TipoEscala = 'real' | 'mapa' | 'denominador'
export interface DadosEscalaTipo extends DadosEscala {
  tipo: TipoEscala
}

export function gerarEscala(rng: Rng, nivel: Nivel): InstanciaNum<DadosEscalaTipo> {
  for (let t = 0; t < 200; t++) {
    if (nivel === 1) {
      const d = sortear(rng, 2, 9)
      const E = escolher(rng, DENOMINADORES)
      const km = distanciaReal(d, E)
      const tol = Math.max(0.005, km * 0.001)
      const erros = limpar(
        [
          { valor: km * 1000, frase: `${fn(km * 1000, 0)} é a distância em metros. O enunciado pede quilômetros: divida por 1.000.`, motivo: 'deu a resposta em metros' },
          { valor: d * E, frase: `${fn(d * E, 0)} está em centímetros (${d} × ${fn(E, 0)}). Para passar a quilômetros, divida por 100.000.`, motivo: 'esqueceu de converter cm em km' },
          { valor: (d * E) / 1000, frase: 'Você dividiu por 1.000 em vez de 100.000. Um quilômetro tem 100.000 cm.', motivo: 'converteu cm em km dividindo por 1.000' },
          { valor: d / E, frase: 'Você dividiu em vez de multiplicar: distância real = distância no mapa × denominador.', motivo: 'dividiu em vez de multiplicar' },
        ],
        km,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Em um mapa de escala ${formatarEscala(E)}, dois pontos estão a ${d} cm de distância. Qual é a distância real entre eles, em quilômetros?`,
        resposta: km,
        tolerancia: tol,
        unidade: 'km',
        erros,
        resolucao: `Distância real = ${d} cm × ${fn(E, 0)} = ${fn(d * E, 0)} cm. Como 1 km = 100.000 cm: ${fn(d * E, 0)} ÷ 100.000 = ${fn(km, 3)} km.`,
        dicas: [`Na escala 1:${fn(E, 0)}, 1 cm no mapa vale ${fn(E, 0)} cm no terreno.`, 'Multiplique os centímetros do mapa pelo denominador.', 'Converta o resultado de cm para km: divida por 100.000.'],
        licao: 'Distância real = distância no mapa × denominador. 100.000 cm = 1 km.',
        dados: { tipo: 'real', denominador: E, cm: d },
      }
    }
    if (nivel === 2) {
      const E = escolher(rng, DENOMINADORES_GRANDES)
      const cm = sortear(rng, 2, 18) / 2
      const km = distanciaReal(cm, E)
      if (!Number.isInteger(km)) continue
      const tol = 0.05
      const erros = limpar(
        [
          { valor: cm / 100, frase: 'Você dividiu os quilômetros por 100.000 duas vezes ou usou metros no lugar de centímetros. A conta é km × 100.000 ÷ denominador.', motivo: 'errou a conversão de unidades' },
          { valor: km * 100_000, frase: `${fn(km * 100_000, 0)} cm é a distância real em centímetros. Falta dividir pelo denominador (${fn(E, 0)}).`, motivo: 'esqueceu de dividir pelo denominador' },
          { valor: cm * 10, frase: 'O valor está dez vezes maior: confira a conversão de km em cm.', motivo: 'errou a conversão por fator 10' },
          { valor: (km * 1000) / E, frase: 'Você converteu km em metros (e não em cm). Um quilômetro tem 100.000 cm.', motivo: 'converteu km em m, e não em cm' },
        ],
        cm,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Duas cidades estão a ${fn(km, 0)} km uma da outra. Em um mapa de escala ${formatarEscala(E)}, qual é a distância entre elas, em centímetros?`,
        resposta: cm,
        tolerancia: tol,
        unidade: 'cm',
        erros,
        resolucao: `${fn(km, 0)} km = ${fn(km * 100_000, 0)} cm. Distância no mapa = ${fn(km * 100_000, 0)} ÷ ${fn(E, 0)} = ${fn(cm, 2)} cm.`,
        dicas: ['Passe a distância real para centímetros: 1 km = 100.000 cm.', 'Divida pelo denominador da escala.', 'distância no mapa = distância real ÷ denominador.'],
        licao: 'Distância no mapa = distância real ÷ denominador (com as duas em centímetros).',
        dados: { tipo: 'mapa', denominador: E, cm },
      }
    }
    const Emil = escolher(rng, [250, 500, 1000, 2000, 2500, 5000])
    const cm = escolher(rng, [2, 4, 5, 10])
    const km = distanciaReal(cm, Emil * 1000)
    const tol = 0.5
    const erros = limpar(
      [
        { valor: km * 100, frase: `Você converteu km em cm, mas esqueceu de dividir pelos ${fn(cm, 0)} cm do mapa.`, motivo: 'esqueceu de dividir pela distância no mapa' },
        { valor: (cm * 100) / km, frase: 'Você inverteu a divisão: o denominador é a distância real (em cm) dividida pela distância do mapa.', motivo: 'inverteu a divisão' },
        { valor: Emil / 10, frase: 'O valor está dez vezes menor: confira a conversão de km em cm (1 km = 100.000 cm).', motivo: 'errou a conversão por fator 10' },
        { valor: Emil * 10, frase: 'O valor está dez vezes maior: confira a conversão de km em cm (1 km = 100.000 cm).', motivo: 'errou a conversão por fator 10' },
      ],
      Emil,
      tol,
    )
    if (erros.length < 2) continue
    return {
      enunciado: `Em um mapa, ${fn(cm, 0)} cm representam ${fn(km, 2)} km no terreno. A escala é 1:X. Qual é o valor de X, em milhares? (Por exemplo, para 1:250.000, responda 250.)`,
      resposta: Emil,
      tolerancia: tol,
      unidade: 'mil',
      erros,
      resolucao: `${fn(km, 2)} km = ${fn(km * 100_000, 0)} cm. X = ${fn(km * 100_000, 0)} ÷ ${fn(cm, 0)} = ${fn(Emil * 1000, 0)}. A escala é 1:${fn(Emil * 1000, 0)}, ou seja, X = ${fn(Emil, 0)} mil.`,
      dicas: ['Escreva as duas distâncias na mesma unidade: centímetros.', '1 km = 100.000 cm.', 'denominador = distância real ÷ distância no mapa.'],
      licao: 'Denominador da escala = distância real ÷ distância no mapa, com as duas em centímetros.',
      dados: { tipo: 'denominador' },
    }
  }
  throw new Error('não foi possível gerar a pergunta de escala')
}

/* ------------------------------------------------------------------ qual é o país? */

const SUL = PAISES.filter((p) => p.continente === 'América do Sul' && p.id !== BRASIL)
const OUTROS = PAISES.filter((p) => p.pergunta && p.continente !== 'América do Sul')
const nomeDe = (id: string) => paisPorId(id)?.nome ?? id

const dicasPais = (alvo: PaisInfo, sul: boolean) => [
  sul ? 'O Brasil aparece em verde-claro, como referência.' : 'Veja em que parte do mundo o país está: continente e hemisfério.',
  `Use a ideia: o país ${alvo.onde}.`,
  'O texto alternativo do mapa dá as coordenadas aproximadas do centro do país: compare com o que você sabe.',
]

export function gerarPais(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMapa> {
  const sul = nivel !== 2
  const alvo = nivel === 1 ? escolher(rng, SUL.filter((p) => ['032', '152', '862', '170', '604', '068'].includes(p.id))) : nivel === 3 ? escolher(rng, SUL.filter((p) => ['858', '600', '740', '328', '218', '068'].includes(p.id))) : escolher(rng, OUTROS)
  let outros: PaisInfo[]
  if (nivel === 1) outros = embaralhar(rng, SUL.filter((p) => p.id !== alvo.id)).slice(0, 3)
  else if (nivel === 3) {
    const vizinhos = (FRONTEIRAS[alvo.id] ?? []).filter((id) => id !== BRASIL && paisPorId(id)?.pergunta)
    const base = [...vizinhos, ...SUL.map((p) => p.id).filter((id) => id !== alvo.id && !vizinhos.includes(id))]
    outros = base.slice(0, 3).map((id) => paisPorId(id) as PaisInfo)
  } else outros = embaralhar(rng, OUTROS.filter((p) => p.id !== alvo.id)).slice(0, 3)
  const certa: Opc = { texto: alvo.nome, porque: `${alvo.nome} ${alvo.onde}.` }
  const erradas: Opc[] = outros.map((o) => ({ texto: o.nome, porque: `${o.nome} ${o.onde}. O país em destaque é ${alvo.nome}, que ${alvo.onde}.`, motivo: `confundiu com ${o.nome}` }))
  const destaques: Record<string, string> = { [alvo.id]: COR_DESTAQUE }
  if (sul) destaques[BRASIL] = COR_BRASIL
  return montar<DadosMapa>(rng, certa, erradas, {
    enunciado: 'Qual é o país em destaque (em vermelho) no mapa?',
    resolucao: `O país em destaque é ${alvo.nome}: ${alvo.nome} ${alvo.onde}.`,
    dicas: dicasPais(alvo, sul),
    licao: 'Para reconhecer países no mapa, use a posição em relação a vizinhos conhecidos, o formato e as coordenadas aproximadas.',
    dados: { regiao: sul ? 'america-do-sul' : 'mundo', destaques, centroDe: alvo.id, descricao: `${sul ? 'Mapa da América do Sul' : 'Mapa-múndi'} com um país destacado em vermelho (o nome fica oculto para a pergunta).` },
  })
}

/* ------------------------------------------------------------------ projeções */

export function gerarProjecao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMapa> {
  return doBanco<DadosMapa>(rng, faixaDoBanco(BANCO_PROJECAO, nivel))
}

/* ------------------------------------------------------------------ fronteiras */

const SUL_COM_TABELA = Object.keys(FRONTEIRAS)

/** Pares de países da América do Sul que têm exatamente um vizinho em comum (e esse vizinho não é nenhum dos dois). */
export function paresComUmVizinho(): { a: string; b: string; comum: string }[] {
  const saida: { a: string; b: string; comum: string }[] = []
  for (let i = 0; i < SUL_COM_TABELA.length; i++)
    for (let j = i + 1; j < SUL_COM_TABELA.length; j++) {
      const a = SUL_COM_TABELA[i] as string
      const b = SUL_COM_TABELA[j] as string
      const comuns = (FRONTEIRAS[a] ?? []).filter((x) => x !== a && x !== b && (FRONTEIRAS[b] ?? []).includes(x))
      if (comuns.length === 1) saida.push({ a, b, comum: comuns[0] as string })
    }
  return saida
}

const PARES = paresComUmVizinho()

const MOTIVO_NAO_VIZINHO: Record<string, string> = {
  '152': 'O Chile fica entre os Andes e o Pacífico e é separado do Brasil pela Bolívia, pelo Peru e pela Argentina.',
  '218': 'O Equador fica no noroeste do continente e é separado do Brasil pela Colômbia e pelo Peru.',
  '591': 'O Panamá fica na América Central, fora da América do Sul.',
  '484': 'O México fica na América do Norte, longe do Brasil.',
}

export function gerarFronteiras(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMapa> {
  const sulMapa = (destaques: Record<string, string>, texto: string): DadosMapa => ({ regiao: 'america-do-sul', destaques, descricao: texto })
  const vizinhosPaises = VIZINHOS_DO_BRASIL.filter((id) => id !== '250')
  if (nivel === 1) {
    const alvo = paisPorId(escolher(rng, vizinhosPaises)) as PaisInfo
    const falsos = ['152', '218', escolher(rng, ['591', '484'])]
    return montar<DadosMapa>(
      rng,
      { texto: alvo.nome, porque: `${alvo.nome} faz fronteira com o Brasil: ${alvo.nome} ${alvo.onde}.` },
      falsos.map((id) => ({ texto: nomeDe(id), porque: `${MOTIVO_NAO_VIZINHO[id]} Não faz fronteira com o Brasil.`, motivo: `escolheu ${nomeDe(id)}, que não é vizinho` })),
      {
        enunciado: 'Qual destes países faz fronteira com o Brasil?',
        resolucao: `${alvo.nome} faz fronteira com o Brasil. Chile e Equador são os dois únicos países da América do Sul que não têm fronteira com o Brasil.`,
        dicas: ['Imagine o mapa: o Brasil tem vizinhos em quase todo o contorno terrestre.', 'Na América do Sul, só dois países não fazem fronteira com o Brasil.', 'Eles são o Chile e o Equador.'],
        licao: 'O Brasil faz fronteira com todos os países da América do Sul, exceto o Chile e o Equador (e com a Guiana Francesa).',
        dados: sulMapa({ [BRASIL]: COR_BRASIL }, 'Mapa da América do Sul com o Brasil destacado em verde-claro.'),
      },
    )
  }
  if (nivel === 2) {
    const alvo = escolher(rng, ['152', '218'])
    const vizinhos = embaralhar(rng, vizinhosPaises).slice(0, 3)
    return montar<DadosMapa>(
      rng,
      { texto: nomeDe(alvo), porque: `${MOTIVO_NAO_VIZINHO[alvo]} Por isso, não faz fronteira com o Brasil.` },
      vizinhos.map((id) => ({ texto: nomeDe(id), porque: `${nomeDe(id)} faz fronteira com o Brasil: ${nomeDe(id)} ${paisPorId(id)?.onde}.`, motivo: `escolheu ${nomeDe(id)}, que é vizinho` })),
      {
        enunciado: 'Qual destes países sul-americanos NÃO faz fronteira com o Brasil?',
        resolucao: `${MOTIVO_NAO_VIZINHO[alvo]} Os demais fazem fronteira com o Brasil.`,
        dicas: ['Só dois países da América do Sul não tocam o Brasil.', 'Pense em países que ficam na costa do Pacífico.', 'São o Chile e o Equador.'],
        licao: 'Chile e Equador são os únicos países da América do Sul sem fronteira com o Brasil.',
        dados: sulMapa({ [BRASIL]: COR_BRASIL }, 'Mapa da América do Sul com o Brasil destacado em verde-claro.'),
      },
    )
  }
  if (rng() < 0.6) {
    const par = escolher(rng, PARES)
    const [a, b] = rng() < 0.5 ? [par.a, par.b] : [par.b, par.a]
    const comuns = (FRONTEIRAS[par.a] ?? []).filter((x) => (FRONTEIRAS[par.b] ?? []).includes(x))
    const candidatos = embaralhar(rng, SUL_COM_TABELA.filter((id) => id !== a && id !== b && !comuns.includes(id)))
    const erradas = candidatos.slice(0, 3)
    const explica = (id: string) => {
      const viz = FRONTEIRAS[id] ?? []
      const tocaA = viz.includes(a)
      const tocaB = viz.includes(b)
      return tocaA && !tocaB ? `${nomeDe(id)} faz fronteira com ${nomeDe(a)}, mas não com ${nomeDe(b)}.` : tocaB && !tocaA ? `${nomeDe(id)} faz fronteira com ${nomeDe(b)}, mas não com ${nomeDe(a)}.` : `${nomeDe(id)} não faz fronteira com ${nomeDe(a)} nem com ${nomeDe(b)}.`
    }
    return montar<DadosMapa>(
      rng,
      { texto: nomeDe(par.comum), porque: `${nomeDe(par.comum)} faz fronteira com ${nomeDe(a)} e com ${nomeDe(b)}.` },
      erradas.map((id) => ({ texto: nomeDe(id), porque: explica(id), motivo: 'o país toca só um dos dois (ou nenhum)' })),
      {
        enunciado: `Qual país faz fronteira com ${nomeDe(a)} e também com ${nomeDe(b)}?`,
        resolucao: `Vizinhos de ${nomeDe(a)}: ${(FRONTEIRAS[a] ?? []).map(nomeDe).join(', ')}. Vizinhos de ${nomeDe(b)}: ${(FRONTEIRAS[b] ?? []).map(nomeDe).join(', ')}. O único em comum é ${nomeDe(par.comum)}.`,
        dicas: [`Liste os vizinhos de ${nomeDe(a)}.`, `Liste os vizinhos de ${nomeDe(b)}.`, 'Procure o país que aparece nas duas listas.'],
        licao: 'Para achar vizinhos em comum, liste os vizinhos de cada país e veja quem aparece nas duas listas.',
        dados: sulMapa({ [a]: COR_DESTAQUE, [b]: 'var(--geo-frio)' }, `Mapa da América do Sul com ${nomeDe(a)} em vermelho e ${nomeDe(b)} em azul.`),
      },
    )
  }
  const certa = VIZINHOS_DO_BRASIL.length
  const textos = [certa - 1, certa, certa + 1, certa + 2]
  const rot = (n: number) => `${n} vizinhos`
  return montar<DadosMapa>(
    rng,
    { texto: rot(certa), porque: `${certa - 1} países independentes (Uruguai, Argentina, Paraguai, Bolívia, Peru, Colômbia, Venezuela, Guiana e Suriname) mais a Guiana Francesa, território da França: ${certa} vizinhos.` },
    textos
      .filter((n) => n !== certa)
      .map((n) => ({
        texto: rot(n),
        porque: n === certa - 1 ? 'Faltou a Guiana Francesa, que é território da França e também faz fronteira com o Brasil.' : n === certa + 1 ? 'Sobrou um: o Chile e o Equador não fazem fronteira com o Brasil.' : 'Sobraram dois: o Chile e o Equador não fazem fronteira com o Brasil.',
        motivo: n < certa ? 'esqueceu a Guiana Francesa' : 'contou países que não são vizinhos',
      })),
    {
      enunciado: 'Contando países independentes e territórios, com quantos vizinhos terrestres o Brasil faz fronteira?',
      resolucao: `Nove países independentes (Uruguai, Argentina, Paraguai, Bolívia, Peru, Colômbia, Venezuela, Guiana e Suriname) e a Guiana Francesa (território da França): ${certa}.`,
      dicas: ['Faça a volta pelo contorno terrestre do Brasil, do sul ao norte.', 'Não esqueça o território da França ao lado do Suriname.', 'Chile e Equador não entram na conta.'],
      licao: 'O Brasil faz fronteira com 10 vizinhos: 9 países independentes e a Guiana Francesa.',
      dados: sulMapa({ [BRASIL]: COR_BRASIL }, 'Mapa da América do Sul com o Brasil destacado em verde-claro.'),
    },
  )
}
