import type { PareEPense, SecaoResumo } from '../tipos'

export type IdClima = 'equatorial' | 'tropical' | 'tropical-litoraneo' | 'semiarido' | 'subtropical' | 'tropical-altitude' | 'mediterraneo' | 'desertico' | 'continental' | 'oceanico'

export interface Cidade {
  id: string
  nome: string
  pais: string
  clima: IdClima
  /** temperaturas médias mensais, de janeiro a dezembro, em °C */
  temp: number[]
  /** precipitação média mensal, de janeiro a dezembro, em mm */
  chuva: number[]
}

export interface InfoClima {
  id: IdClima
  nome: string
  /** onde ocorre */
  onde: string
  /** em uma frase, o que o climograma mostra */
  assinatura: string
  explicacao: string
}

export const FONTES_CLIMOGRAMAS = [
  'INMET. Normais climatológicas do Brasil 1991–2020 (portal.inmet.gov.br).',
  'WMO. Climatological Standard Normals (worldweather.wmo.int).',
  'Ayoade, J. O. Introdução à climatologia para os trópicos. Rio de Janeiro: Bertrand Brasil.',
  'Mendonça, F.; Danni-Oliveira, I. M. Climatologia: noções básicas e climas do Brasil. São Paulo: Oficina de Textos.',
]

/** Valores aproximados e arredondados das normais climatológicas, para fins didáticos. */
export const NOTA_DADOS = 'Os valores são aproximados e arredondados a partir de normais climatológicas (INMET, OMM), para uso didático. Para dados exatos, consulte as fontes.'

export const CIDADES: Cidade[] = [
  { id: 'manaus', nome: 'Manaus', pais: 'Brasil', clima: 'equatorial', temp: [26.5, 26.3, 26.3, 26.5, 26.8, 26.8, 26.9, 27.5, 28, 28.2, 27.8, 27.2], chuva: [280, 290, 330, 310, 260, 110, 90, 60, 80, 110, 170, 230] },
  { id: 'brasilia', nome: 'Brasília', pais: 'Brasil', clima: 'tropical', temp: [21.5, 21.7, 21.8, 21.5, 20.5, 19.5, 19.5, 21, 23, 23, 21.8, 21.5], chuva: [245, 205, 205, 125, 30, 8, 10, 15, 50, 150, 230, 250] },
  { id: 'recife', nome: 'Recife', pais: 'Brasil', clima: 'tropical-litoraneo', temp: [27, 27, 27, 26.5, 25.5, 25, 24.5, 24.5, 25.5, 26.5, 27, 27], chuva: [70, 110, 250, 300, 290, 250, 200, 100, 60, 30, 25, 40] },
  { id: 'petrolina', nome: 'Petrolina', pais: 'Brasil', clima: 'semiarido', temp: [27, 26.5, 26.5, 26, 25, 24, 23.5, 24.5, 26.5, 28, 28, 27.5], chuva: [100, 100, 120, 75, 15, 5, 3, 3, 5, 20, 70, 90] },
  { id: 'sao-paulo', nome: 'São Paulo', pais: 'Brasil', clima: 'tropical-altitude', temp: [22, 22.5, 21.5, 19.5, 17, 16, 15.5, 17, 18, 19.5, 20.5, 21.5], chuva: [240, 220, 160, 75, 70, 55, 45, 40, 85, 120, 130, 190] },
  { id: 'porto-alegre', nome: 'Porto Alegre', pais: 'Brasil', clima: 'subtropical', temp: [25, 25, 23.5, 20, 17, 14, 14.5, 15.5, 17, 19.5, 22, 24], chuva: [100, 110, 105, 90, 90, 120, 125, 130, 140, 130, 110, 100] },
  { id: 'roma', nome: 'Roma', pais: 'Itália', clima: 'mediterraneo', temp: [8, 9, 11.5, 14.5, 19, 23, 26, 26, 22, 18, 13, 9.5], chuva: [70, 70, 60, 70, 45, 30, 15, 25, 70, 100, 110, 85] },
  { id: 'cairo', nome: 'Cairo', pais: 'Egito', clima: 'desertico', temp: [14, 15.5, 18, 22, 26, 28.5, 29, 29, 27, 24, 20, 15.5], chuva: [5, 4, 4, 1, 1, 0, 0, 0, 0, 1, 3, 5] },
  { id: 'moscou', nome: 'Moscou', pais: 'Rússia', clima: 'continental', temp: [-6.5, -6, -1, 6.5, 13.5, 17, 19, 17, 11.5, 5.5, -1, -5], chuva: [50, 40, 35, 40, 55, 80, 90, 75, 70, 65, 55, 55] },
  { id: 'londres', nome: 'Londres', pais: 'Reino Unido', clima: 'oceanico', temp: [5, 5.5, 8, 10, 13.5, 16.5, 19, 18.5, 15.5, 11.5, 8, 5.5], chuva: [55, 40, 40, 45, 50, 50, 45, 55, 50, 70, 65, 55] },
]

export const CLIMAS: Record<IdClima, InfoClima> = {
  equatorial: {
    id: 'equatorial',
    nome: 'Equatorial úmido',
    onde: 'Amazônia',
    assinatura: 'quente o ano todo (amplitude térmica muito pequena) e chuva muito alta, sem mês seco',
    explicacao: 'Perto da linha do Equador, o Sol incide quase a pino o ano inteiro, e a umidade da floresta e das massas de ar equatoriais alimenta chuvas fartas em todos os meses.',
  },
  tropical: {
    id: 'tropical',
    nome: 'Tropical (verão chuvoso e inverno seco)',
    onde: 'Centro do Brasil (Cerrado)',
    assinatura: 'temperatura alta, chuva concentrada no verão e vários meses secos no inverno',
    explicacao: 'No interior do continente, no verão a umidade chega com as massas equatoriais e tropicais; no inverno, a massa de ar seca e estável traz a estação seca.',
  },
  'tropical-litoraneo': {
    id: 'tropical-litoraneo',
    nome: 'Tropical úmido litorâneo',
    onde: 'Litoral leste do Nordeste',
    assinatura: 'quente o ano todo, chuva alta concentrada no outono e inverno, com meses mais secos na primavera',
    explicacao: 'Ventos úmidos do Atlântico e as massas equatoriais e tropicais atlânticas trazem chuva ao litoral, principalmente de março a agosto.',
  },
  semiarido: {
    id: 'semiarido',
    nome: 'Semiárido',
    onde: 'Interior do Nordeste (Sertão)',
    assinatura: 'quente o ano todo, chuva baixa e irregular, com seis ou mais meses secos',
    explicacao: 'A região recebe pouca umidade, e as chuvas, concentradas em poucos meses, variam muito de um ano para o outro. A seca pode se prolongar por anos.',
  },
  subtropical: {
    id: 'subtropical',
    nome: 'Subtropical úmido',
    onde: 'Sul do Brasil',
    assinatura: 'quatro estações bem definidas, verão quente, inverno frio e chuva bem distribuída o ano todo',
    explicacao: 'Fora da faixa tropical, o sol varia mais ao longo do ano, e as frentes frias, com a massa polar atlântica, trazem chuva em todas as estações.',
  },
  'tropical-altitude': {
    id: 'tropical-altitude',
    nome: 'Tropical de altitude',
    onde: 'Planalto do Sudeste (São Paulo, serras)',
    assinatura: 'verão chuvoso, inverno menos chuvoso (mas sem meses secos) e temperaturas mais amenas',
    explicacao: 'A altitude do planalto reduz as temperaturas médias. O verão chuvoso vem de massas tropicais úmidas; no inverno, as frentes frias trazem chuvas fracas.',
  },
  mediterraneo: {
    id: 'mediterraneo',
    nome: 'Mediterrâneo',
    onde: 'Bacia do Mediterrâneo, Califórnia, Chile central',
    assinatura: 'verão quente e seco, inverno ameno e chuvoso',
    explicacao: 'No verão, o domínio de uma massa de ar seca (alta pressão subtropical) causa o período seco; no inverno, as frentes e ciclones trazem a chuva.',
  },
  desertico: {
    id: 'desertico',
    nome: 'Desértico quente',
    onde: 'Saara, Arábia',
    assinatura: 'chuva quase nula o ano todo, com verões muito quentes',
    explicacao: 'Em latitudes tropicais, o ar desce, seco e estável, impedindo a formação de nuvens. A chuva é rara e imprevisível.',
  },
  continental: {
    id: 'continental',
    nome: 'Continental (frio)',
    onde: 'Interior da Eurásia e da América do Norte',
    assinatura: 'amplitude térmica muito grande, invernos abaixo de 0 °C e chuva maior no verão',
    explicacao: 'Longe do mar (continentalidade), a terra esquenta e esfria depressa, e o ar de inverno é muito frio e seco. A chuva é maior no verão, quando o ar é mais quente e úmido.',
  },
  oceanico: {
    id: 'oceanico',
    nome: 'Temperado oceânico',
    onde: 'Oeste da Europa',
    assinatura: 'amplitude térmica pequena para a latitude, verões amenos, invernos suaves e chuva bem distribuída',
    explicacao: 'O mar (maritimidade) e a corrente do Golfo suavizam as temperaturas, e os ventos úmidos de oeste trazem chuva em todos os meses.',
  },
}

export interface PassoClimogramas {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: { tipo: 'leitura'; cidade: string } | { tipo: 'comparacao'; a: string; b: string } | { tipo: 'cidade'; cidade: string } | { tipo: 'fatores' } | { tipo: 'quadro' }
}

export const PASSOS_CLIMOGRAMAS: PassoClimogramas[] = [
  {
    titulo: 'Como ler um climograma',
    texto: [
      'O climograma reúne dois dados médios de um lugar, mês a mês: as barras azuis mostram a precipitação (chuva, em mm) e a linha vermelha mostra a temperatura (em °C). A temperatura está na escala da esquerda e a chuva na escala da direita. Confira sempre as unidades e as escalas antes de comparar gráficos.',
      'Primeiro, observe a linha: é alta o ano todo ou muda de estação? Depois, observe as barras: onde estão as maiores e as menores? Quase tudo que se pergunta sobre clima nos vestibulares sai dessas duas observações.',
    ],
    pare: {
      pergunta: 'No climograma, o que a linha representa?',
      opcoes: ['A precipitação', 'A temperatura média', 'A umidade do ar'],
      certa: 1,
      explicacao: 'A linha mostra a temperatura média de cada mês; as barras mostram a precipitação média.',
    },
    visual: { tipo: 'leitura', cidade: 'brasilia' },
  },
  {
    titulo: 'Temperatura: média, amplitude e hemisfério',
    texto: [
      'A temperatura média anual é a média das 12 médias mensais. A amplitude térmica anual é a diferença entre a média do mês mais quente e a do mês mais frio. Perto do Equador a amplitude é pequena (o Sol incide quase da mesma forma o ano todo); em latitudes maiores e longe do mar, ela cresce.',
      'A linha também mostra o hemisfério. Se o mês mais quente é janeiro ou dezembro, o lugar fica no Hemisfério Sul, onde o verão ocorre de dezembro a fevereiro. Se o mais quente é julho, fica no Hemisfério Norte. Perto do Equador e nos trópicos, onde a linha quase não muda (amplitude pequena), esse truque funciona mal: em Brasília, por exemplo, o mês mais quente é setembro ou outubro, antes das chuvas.',
    ],
    pare: {
      pergunta: 'O mês mais quente de um lugar é janeiro. Em que hemisfério ele provavelmente fica?',
      opcoes: ['Norte', 'Sul', 'Não dá para saber'],
      certa: 1,
      explicacao: 'Janeiro é verão no Hemisfério Sul. (Perto do Equador e nos trópicos, onde a linha é quase reta, esse critério não vale.)',
    },
    visual: { tipo: 'comparacao', a: 'manaus', b: 'moscou' },
  },
  {
    titulo: 'Chuva: total, regime e meses secos',
    texto: [
      'O total anual é a soma das 12 barras. O regime de chuvas diz em que época elas se concentram: no verão chuvoso (Brasil central), em estações bem distribuídas (Sul) ou quase nenhuma (deserto). Um mês costuma ser chamado de seco quando a precipitação (em mm) é menor que o dobro da temperatura (em °C), o critério de Gaussen. Por exemplo, um mês de 24 °C com menos de 48 mm é seco.',
      'Esse critério é uma ferramenta para comparar lugares, não uma regra universal: algumas questões simplesmente falam em “estação seca”, quando as barras ficam muito baixas por vários meses seguidos.',
    ],
    pare: {
      pergunta: 'Um mês com temperatura de 20 °C e chuva de 30 mm é seco pelo critério de Gaussen?',
      opcoes: ['Sim, porque 30 < 40', 'Não, porque 30 > 20', 'Não dá para saber'],
      certa: 0,
      explicacao: 'O dobro da temperatura é 2 × 20 = 40. Como 30 < 40, o mês é seco.',
    },
    visual: { tipo: 'cidade', cidade: 'petrolina' },
  },
  {
    titulo: 'Os climas do Brasil nos climogramas',
    texto: [
      'Equatorial (Manaus): quente o ano todo e chuvoso, sem mês seco. Tropical (Brasília): verão chuvoso e inverno seco, com vários meses secos. Tropical úmido litorâneo (Recife): quente e chuvoso, com o máximo no outono e no inverno. Semiárido (Petrolina): quente e com seis ou mais meses secos, e chuva pouca e irregular.',
      'Tropical de altitude (São Paulo): verão chuvoso e inverno mais ameno e menos chuvoso, mas sem mês seco. Subtropical (Porto Alegre): quatro estações bem definidas, amplitude maior e chuva bem distribuída o ano todo. Escolha uma cidade para conferir a assinatura de cada clima.',
    ],
    pare: {
      pergunta: 'Qual clima brasileiro tem seis ou mais meses secos e chuva baixa?',
      opcoes: ['Equatorial', 'Semiárido', 'Subtropical'],
      certa: 1,
      explicacao: 'O semiárido do Sertão nordestino tem chuva baixa e irregular, com seis meses secos ou mais.',
    },
    visual: { tipo: 'quadro' },
  },
  {
    titulo: 'Climas do mundo: mediterrâneo, desértico, continental e oceânico',
    texto: [
      'Mediterrâneo (Roma): verão quente e seco e inverno chuvoso, o oposto do tropical do Brasil central, porque ocorre no Hemisfério Norte e a seca está no verão. Desértico (Cairo): chuva quase nula o ano todo. Continental (Moscou): amplitude térmica muito grande, inverno com temperaturas abaixo de zero. Oceânico (Londres): amplitude pequena para a latitude e chuva bem distribuída.',
      'O que muda de um clima para outro é principalmente o conjunto de fatores que atuam em cada lugar: latitude, altitude, continentalidade e maritimidade, massas de ar e correntes marítimas.',
    ],
    pare: {
      pergunta: 'Qual clima combina verão seco com inverno chuvoso?',
      opcoes: ['Mediterrâneo', 'Continental', 'Oceânico'],
      certa: 0,
      explicacao: 'O clima mediterrâneo tem verão quente e seco e inverno ameno e chuvoso.',
    },
    visual: { tipo: 'comparacao', a: 'roma', b: 'cairo' },
  },
  {
    titulo: 'Por que o clima muda de lugar para lugar',
    texto: [
      'A latitude controla a energia solar recebida: quanto mais perto do Equador, mais quente. A altitude reduz a temperatura (cerca de 6 °C a menos a cada 1.000 m). A continentalidade (longe do mar) aumenta a amplitude térmica; a maritimidade a reduz. As massas de ar trazem umidade ou secura, e as correntes marítimas aquecem ou esfriam o litoral.',
      'Para ler um climograma, pergunte quais desses fatores explicam as barras e a linha: uma amplitude grande indica continentalidade e latitude média ou alta; uma chuva alta e uniforme, um lugar equatorial ou com ventos úmidos o ano todo.',
    ],
    pare: {
      pergunta: 'Duas cidades estão na mesma latitude. Uma está no litoral e a outra, no interior. Qual deve ter a maior amplitude térmica?',
      opcoes: ['A do litoral', 'A do interior', 'As duas, igual'],
      certa: 1,
      explicacao: 'O mar demora a esquentar e a esfriar e suaviza as temperaturas. No interior (continentalidade), a amplitude térmica é maior.',
    },
    visual: { tipo: 'fatores' },
  },
]

export const RESUMO_CLIMOGRAMAS: SecaoResumo[] = [
  {
    titulo: 'Ler o climograma',
    formulas: [
      { rotulo: 'Temperatura média anual', tex: '\\bar{T} = \\dfrac{T_1 + T_2 + \\dots + T_{12}}{12}' },
      { rotulo: 'Amplitude térmica anual', tex: 'A = T_{\\text{mês mais quente}} - T_{\\text{mês mais frio}}' },
      { rotulo: 'Total anual de chuva', tex: 'P = P_1 + P_2 + \\dots + P_{12}' },
      { rotulo: 'Mês seco (Gaussen)', tex: 'P_{\\text{mês}}\\ (\\text{mm}) < 2\\, T_{\\text{mês}}\\ (^\\circ\\text{C})' },
    ],
    ideias: ['Barras: precipitação (mm). Linha: temperatura (°C). Confira as escalas.', 'Mês mais quente em janeiro: Hemisfério Sul; em julho: Hemisfério Norte.', 'Amplitude pequena: perto do Equador ou do mar; grande: interior e latitudes médias ou altas.'],
    pegadinhas: ['Confundir as escalas das barras e da linha.', 'Usar o critério do hemisfério em lugares com amplitude pequena (equatorial e tropical).', 'Comparar totais de chuva sem olhar o regime (concentrado ou distribuído).'],
    fontes: FONTES_CLIMOGRAMAS,
  },
  {
    titulo: 'Climas do Brasil',
    formulas: [],
    ideias: [
      'Equatorial: quente, chuva alta, sem mês seco, amplitude mínima.',
      'Tropical: verão chuvoso e inverno seco (vários meses secos).',
      'Tropical úmido litorâneo: chuva alta no outono e inverno.',
      'Semiárido: seis ou mais meses secos e chuva baixa e irregular.',
      'Tropical de altitude: temperaturas amenas, verão chuvoso, sem mês seco.',
      'Subtropical: estações bem definidas e chuva bem distribuída.',
    ],
    pegadinhas: ['Achar que o clima tropical não tem estação seca.', 'Confundir tropical de altitude (sem meses secos) com tropical (inverno seco).', 'Esquecer que a chuva do litoral do Nordeste é de outono e inverno.'],
    fontes: FONTES_CLIMOGRAMAS,
  },
  {
    titulo: 'Climas do mundo e fatores climáticos',
    formulas: [],
    ideias: [
      'Mediterrâneo: verão quente e seco, inverno chuvoso.',
      'Desértico: menos de cerca de 250 mm por ano e temperaturas muito altas de dia.',
      'Continental: amplitude grande e inverno abaixo de 0 °C; oceânico: amplitude pequena e chuva distribuída.',
      'Fatores: latitude, altitude (≈ −6 °C a cada 1.000 m), continentalidade/maritimidade, massas de ar, correntes marítimas e relevo.',
    ],
    pegadinhas: ['Atribuir toda diferença de temperatura à latitude e esquecer a altitude.', 'Achar que o deserto é sempre quente à noite (a amplitude diária é grande).'],
    fontes: FONTES_CLIMOGRAMAS,
  },
]
