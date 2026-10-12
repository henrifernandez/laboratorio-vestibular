import type { ItemBanco } from '@/materias/biologia/comum/auxiliares'
import type { PareEPense, SecaoResumo } from '../tipos'

export type Continente = 'América do Sul' | 'América do Norte' | 'América Central' | 'Europa' | 'Ásia' | 'África' | 'Oceania'

export interface PaisInfo {
  /** código numérico ISO 3166-1, usado como id no arquivo do mapa (world-atlas) */
  id: string
  nome: string
  /** nome em inglês exatamente como aparece no arquivo do mapa (conferido nos testes) */
  en: string
  continente: Continente
  /** uma frase que localiza o país, sem citar o nome */
  onde: string
  /** entra nas perguntas de “qual é este país?” */
  pergunta: boolean
}

export const FONTES_MAPA = [
  'IBGE. Atlas geográfico escolar e Cartografia: noções básicas (ibge.gov.br).',
  'Natural Earth (domínio público), pelo pacote world-atlas (naturalearthdata.com): contornos dos países.',
  'ISO 3166-1: códigos numéricos de país (iso.org).',
  'Snyder, J. P. Map projections: a working manual. U.S. Geological Survey, 1987.',
  'Šavrič, B.; Patterson, T.; Jenny, B. The Equal Earth map projection. International Journal of Geographical Information Science, 2019.',
]

/** Aviso sobre os dados do mapa. */
export const NOTA_MAPA =
  'Contornos simplificados (escala 1:110 milhões) do Natural Earth, de domínio público. Fronteiras e nomes seguem a convenção usada no arquivo; o mapa é didático e não substitui fontes oficiais.'

export const PAISES: PaisInfo[] = [
  { id: '076', nome: 'Brasil', en: 'Brazil', continente: 'América do Sul', onde: 'ocupa o centro-leste da América do Sul e faz fronteira com quase todos os outros países do continente', pergunta: false },
  { id: '032', nome: 'Argentina', en: 'Argentina', continente: 'América do Sul', onde: 'ocupa o sul da América do Sul, a leste dos Andes, e se estende até a Patagônia', pergunta: true },
  { id: '858', nome: 'Uruguai', en: 'Uruguay', continente: 'América do Sul', onde: 'é um país pequeno, entre o sul do Brasil e a Argentina, com costa no Atlântico', pergunta: true },
  { id: '600', nome: 'Paraguai', en: 'Paraguay', continente: 'América do Sul', onde: 'não tem saída para o mar e fica entre o Brasil, a Bolívia e a Argentina', pergunta: true },
  { id: '068', nome: 'Bolívia', en: 'Bolivia', continente: 'América do Sul', onde: 'não tem saída para o mar e fica a oeste do Brasil, entre os Andes e a planície amazônica', pergunta: true },
  { id: '604', nome: 'Peru', en: 'Peru', continente: 'América do Sul', onde: 'fica a oeste do Brasil, com costa no Pacífico, entre o Equador e o Chile', pergunta: true },
  { id: '170', nome: 'Colômbia', en: 'Colombia', continente: 'América do Sul', onde: 'fica no noroeste da América do Sul, com costa no Pacífico e no Mar do Caribe', pergunta: true },
  { id: '862', nome: 'Venezuela', en: 'Venezuela', continente: 'América do Sul', onde: 'fica no norte da América do Sul, com costa no Mar do Caribe, ao norte do Brasil', pergunta: true },
  { id: '328', nome: 'Guiana', en: 'Guyana', continente: 'América do Sul', onde: 'fica no nordeste da América do Sul, entre a Venezuela e o Suriname, ao norte do Brasil', pergunta: true },
  { id: '740', nome: 'Suriname', en: 'Suriname', continente: 'América do Sul', onde: 'fica no nordeste da América do Sul, entre a Guiana e a Guiana Francesa, ao norte do Brasil', pergunta: true },
  { id: '152', nome: 'Chile', en: 'Chile', continente: 'América do Sul', onde: 'é uma faixa longa e estreita entre os Andes e o Pacífico', pergunta: true },
  { id: '218', nome: 'Equador', en: 'Ecuador', continente: 'América do Sul', onde: 'é cortado pela linha imaginária que separa os hemisférios Norte e Sul, com costa no Pacífico, entre a Colômbia e o Peru', pergunta: true },
  { id: '250', nome: 'França', en: 'France', continente: 'Europa', onde: 'fica na Europa Ocidental e tem território na América do Sul, a Guiana Francesa', pergunta: false },
  { id: '591', nome: 'Panamá', en: 'Panama', continente: 'América Central', onde: 'liga a América Central à América do Sul e abriga o canal que une o Atlântico ao Pacífico', pergunta: false },
  { id: '840', nome: 'Estados Unidos', en: 'United States of America', continente: 'América do Norte', onde: 'fica na América do Norte, entre o Canadá e o México', pergunta: true },
  { id: '124', nome: 'Canadá', en: 'Canada', continente: 'América do Norte', onde: 'ocupa o norte da América do Norte e é o segundo maior país do mundo em área', pergunta: true },
  { id: '484', nome: 'México', en: 'Mexico', continente: 'América do Norte', onde: 'fica ao sul dos Estados Unidos e ao norte da Guatemala, com costas no Pacífico e no Atlântico', pergunta: true },
  { id: '643', nome: 'Rússia', en: 'Russia', continente: 'Ásia', onde: 'é o maior país do mundo e ocupa o norte da Ásia e o leste da Europa', pergunta: true },
  { id: '156', nome: 'China', en: 'China', continente: 'Ásia', onde: 'fica no leste da Ásia e tem mais de um bilhão de habitantes', pergunta: true },
  { id: '356', nome: 'Índia', en: 'India', continente: 'Ásia', onde: 'ocupa uma grande península no sul da Ásia, entre o Paquistão e Bangladesh', pergunta: true },
  { id: '392', nome: 'Japão', en: 'Japan', continente: 'Ásia', onde: 'é um arquipélago no leste da Ásia, no Oceano Pacífico', pergunta: true },
  { id: '818', nome: 'Egito', en: 'Egypt', continente: 'África', onde: 'fica no nordeste da África e é atravessado pelo rio Nilo', pergunta: true },
  { id: '710', nome: 'África do Sul', en: 'South Africa', continente: 'África', onde: 'ocupa o extremo sul da África, entre os oceanos Atlântico e Índico', pergunta: true },
  { id: '276', nome: 'Alemanha', en: 'Germany', continente: 'Europa', onde: 'fica na Europa Central, a leste da França', pergunta: true },
  { id: '036', nome: 'Austrália', en: 'Australia', continente: 'Oceania', onde: 'ocupa um continente inteiro, no Hemisfério Sul', pergunta: true },
  { id: '304', nome: 'Groenlândia', en: 'Greenland', continente: 'América do Norte', onde: 'é a maior ilha do mundo, no norte do Atlântico, território autônomo da Dinamarca', pergunta: false },
]

export const paisPorId = (id: string) => PAISES.find((p) => p.id === id)

/**
 * Fronteiras terrestres dos países da América do Sul (e do Panamá e da França, por causa da Guiana Francesa).
 * Os testes conferem esta tabela com as fronteiras calculadas no arquivo do mapa.
 */
export const FRONTEIRAS: Record<string, string[]> = {
  '076': ['032', '858', '068', '604', '170', '862', '328', '740', '250', '600'],
  '032': ['152', '858', '076', '068', '600'],
  '858': ['032', '076'],
  '600': ['032', '076', '068'],
  '068': ['032', '152', '076', '604', '600'],
  '604': ['152', '076', '068', '170', '218'],
  '170': ['076', '604', '591', '862', '218'],
  '862': ['076', '170', '328'],
  '328': ['076', '862', '740'],
  '740': ['076', '328', '250'],
  '152': ['032', '068', '604'],
  '218': ['604', '170'],
}

/** Países em que a pergunta de “vizinhos do Brasil” usa a tabela. */
export const VIZINHOS_DO_BRASIL = FRONTEIRAS['076'] as string[]

export interface PassoMapa {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: { tipo: 'coordenadas' } | { tipo: 'escala' } | { tipo: 'projecao' } | { tipo: 'fronteiras' } | { tipo: 'leitura' }
}

export const PASSOS_MAPA: PassoMapa[] = [
  {
    titulo: 'Coordenadas geográficas',
    texto: [
      'Para localizar qualquer ponto da Terra usamos duas medidas. A latitude é a distância angular ao Equador (0°), de 0° a 90°, para o norte (N) ou para o sul (S). A longitude é a distância angular ao meridiano de Greenwich (0°), de 0° a 180°, para o leste (L) ou para o oeste (O).',
      'Os paralelos são círculos paralelos ao Equador, e os meridianos ligam os polos. O Equador divide a Terra nos hemisférios Norte e Sul; o meridiano de Greenwich e o antimeridiano (180°) a dividem nos hemisférios Oriental (leste) e Ocidental (oeste).',
      'Paralelos importantes: Equador (0°), Trópico de Câncer (cerca de 23,5° N), Trópico de Capricórnio (cerca de 23,5° S), Círculo Polar Ártico (cerca de 66,5° N) e Círculo Polar Antártico (cerca de 66,5° S).',
    ],
    pare: {
      pergunta: 'Um ponto está a 30° S e 50° O. Em quais hemisférios ele está?',
      opcoes: ['Norte e Oriental', 'Sul e Ocidental', 'Sul e Oriental'],
      certa: 1,
      explicacao: 'Sul (S) indica o Hemisfério Sul; oeste (O) indica o Hemisfério Ocidental.',
    },
    visual: { tipo: 'coordenadas' },
  },
  {
    titulo: 'Escala: do mapa para a realidade',
    texto: [
      'A escala mostra quantas vezes o terreno foi reduzido no mapa. Na escala numérica, 1:50.000 significa que 1 cm no mapa equivale a 50.000 cm (500 m) no terreno. Na escala gráfica, uma barra com a distância real marcada permite medir com uma régua.',
      'A conta é: distância real = distância no mapa × denominador. Atenção às unidades: 100.000 cm são 1 km. Por exemplo, 4 cm em um mapa 1:50.000 valem 4 × 50.000 = 200.000 cm = 2 km.',
      'Quanto menor o denominador, maior é a escala e mais detalhes cabem no mapa: 1:10.000 é uma escala grande (mostra uma rua com detalhe); 1:10.000.000 é uma escala pequena (mostra um continente com pouco detalhe).',
    ],
    pare: {
      pergunta: 'Qual é a escala maior (mostra mais detalhes)?',
      opcoes: ['1:1.000.000', '1:10.000', '1:50.000.000'],
      certa: 1,
      explicacao: 'Quanto menor o denominador, maior a escala. Entre os três, 1:10.000 é a maior.',
    },
    visual: { tipo: 'escala' },
  },
  {
    titulo: 'Projeções cartográficas',
    texto: [
      'A Terra é aproximadamente uma esfera, e o mapa é plano. Toda projeção deforma alguma coisa: ângulos, áreas, formas ou distâncias. Por isso, nenhum mapa-múndi plano é “o certo”: cada projeção serve a um uso.',
      'Na projeção de Mercator (cilíndrica e conforme), os ângulos e as formas locais são preservados, o que ajuda a navegação, mas as áreas crescem muito perto dos polos: a Groenlândia parece maior que o Brasil, mesmo sendo bem menor. Projeções equivalentes (como a Equal Earth e a de Peters) mantêm as áreas, mas deformam as formas.',
      'Pelo tipo de superfície de projeção, as projeções são cilíndricas (cilindro), cônicas (cone) ou azimutais (plano). Cônicas costumam servir para regiões de latitudes médias; azimutais, para os polos.',
    ],
    pare: {
      pergunta: 'Na projeção de Mercator, por que a Groenlândia parece tão grande?',
      opcoes: ['Porque é realmente maior que o Brasil', 'Porque as áreas são ampliadas quanto maior a latitude', 'Porque a projeção reduz as áreas no Equador'],
      certa: 1,
      explicacao: 'Em Mercator, a ampliação das áreas cresce com a latitude: a Groenlândia, perto do polo, fica muito aumentada.',
    },
    visual: { tipo: 'projecao' },
  },
  {
    titulo: 'Fronteiras e vizinhos do Brasil',
    texto: [
      'O Brasil faz fronteira terrestre com dez países ou territórios: nove países independentes (Uruguai, Argentina, Paraguai, Bolívia, Peru, Colômbia, Venezuela, Guiana e Suriname) e a Guiana Francesa, território da França na América do Sul.',
      'Só dois países da América do Sul não fazem fronteira com o Brasil: o Chile e o Equador. O Chile fica separado do Brasil pela Bolívia, pelo Peru e pela Argentina; o Equador, pela Colômbia e pelo Peru.',
      'Para responder perguntas sobre vizinhança, trace o mapa mentalmente: onde está o país, quais países estão ao redor e se eles tocam o Brasil.',
    ],
    pare: {
      pergunta: 'Qual destes países sul-americanos não faz fronteira com o Brasil?',
      opcoes: ['Paraguai', 'Chile', 'Suriname'],
      certa: 1,
      explicacao: 'O Chile fica a oeste, separado do Brasil pela Bolívia, pelo Peru e pela Argentina.',
    },
    visual: { tipo: 'fronteiras' },
  },
  {
    titulo: 'Ler um mapa',
    texto: [
      'Antes de responder a uma questão com mapa, confira os elementos: título (o que o mapa mostra), legenda (o que cada cor e símbolo significa), escala, orientação (onde fica o norte) e fonte e data (de onde vêm os dados e de quando).',
      'Cuidado com a projeção: a mesma região pode parecer maior ou menor, e as distâncias medidas com régua só valem se a escala for constante, o que não acontece em mapas-múndi.',
    ],
    pare: {
      pergunta: 'Qual elemento do mapa explica o que cada cor representa?',
      opcoes: ['A escala', 'A legenda', 'A rosa dos ventos'],
      certa: 1,
      explicacao: 'A legenda traduz cores e símbolos. A escala dá as distâncias e a rosa dos ventos, a orientação.',
    },
    visual: { tipo: 'leitura' },
  },
]

export const RESUMO_MAPA: SecaoResumo[] = [
  {
    titulo: 'Coordenadas e orientação',
    formulas: [
      { rotulo: 'Distância ao longo de um meridiano', tex: 'd \\approx 111\\ \\text{km} \\times \\Delta\\varphi\\ (\\Delta\\varphi\\ \\text{em graus de latitude})' },
    ],
    ideias: [
      'Latitude: 0° a 90° N ou S (Equador = 0°). Longitude: 0° a 180° L ou O (Greenwich = 0°).',
      'Hemisfério Norte ou Sul pela latitude; Oriental ou Ocidental pela longitude.',
      'Trópicos: cerca de 23,5° N e S. Círculos polares: cerca de 66,5° N e S.',
    ],
    pegadinhas: ['Trocar latitude por longitude.', 'Achar que o Brasil está só no Hemisfério Sul: o Equador passa pelo norte do país.', 'Esquecer o sinal (S e O são negativos nas coordenadas decimais).'],
    fontes: FONTES_MAPA,
  },
  {
    titulo: 'Escala',
    formulas: [
      { rotulo: 'Distância real', tex: 'D = d \\times E\\ \\ \\text{(escala }1:E\\text{)}' },
      { rotulo: 'Distância no mapa', tex: 'd = \\dfrac{D}{E}' },
      { rotulo: 'Denominador da escala', tex: 'E = \\dfrac{D}{d}' },
    ],
    ideias: ['1:50.000 significa que 1 cm no mapa equivale a 50.000 cm (500 m) no terreno.', '100.000 cm = 1 km. Converta as unidades antes de calcular.', 'Quanto menor o denominador, maior a escala (mais detalhes).'],
    pegadinhas: ['Esquecer de converter cm em km (dividir por 100.000).', 'Chamar de “escala maior” a de denominador maior.', 'Usar a mesma escala em mapa-múndi inteiro, onde ela muda de lugar para lugar.'],
    fontes: FONTES_MAPA,
  },
  {
    titulo: 'Projeções e vizinhança',
    formulas: [],
    ideias: [
      'Nenhuma projeção plana preserva ângulos, áreas, formas e distâncias ao mesmo tempo.',
      'Mercator: conforme, cilíndrica; deforma áreas perto dos polos. Equivalentes (Peters, Equal Earth): preservam áreas.',
      'Cilíndricas, cônicas e azimutais (plano): classificação pela superfície de projeção.',
      'O Brasil faz fronteira com 10 países ou territórios (nove países e a Guiana Francesa); só Chile e Equador, na América do Sul, não fazem fronteira com ele.',
    ],
    pegadinhas: ['Achar que a Groenlândia é maior que o Brasil (efeito de Mercator).', 'Esquecer a Guiana Francesa na contagem das fronteiras.', 'Confundir projeção conforme (ângulos) com equivalente (áreas).'],
    fontes: FONTES_MAPA,
  },
]

export const BANCO_PROJECAO: ItemBanco[] = [
  {
    pergunta: 'Qual é a principal característica da projeção de Mercator?',
    certa: { texto: 'Conserva os ângulos (é conforme), o que ajuda a navegação, mas distorce muito as áreas perto dos polos.', porque: 'É por isso que foi usada em cartas náuticas: uma linha de rumo constante vira uma reta, mas as áreas crescem com a latitude.' },
    erradas: [
      { texto: 'Conserva as áreas, por isso não deforma o tamanho dos países.', porque: 'É o contrário: em Mercator, as áreas ficam muito ampliadas em latitudes altas.', motivo: 'confundiu conforme com equivalente' },
      { texto: 'Usa um cone como superfície de projeção e é indicada para os polos.', porque: 'Mercator é uma projeção cilíndrica, e não cônica.', motivo: 'errou o tipo de superfície' },
      { texto: 'Representa a Terra sem nenhuma deformação.', porque: 'Nenhuma projeção plana representa a Terra sem deformação.', motivo: 'achou que a projeção é perfeita' },
    ],
    licao: 'Mercator: cilíndrica e conforme (preserva ângulos), com áreas muito deformadas perto dos polos.',
    dicas: ['Pense no que a navegação precisa: manter ângulos (rumos).', 'Em Mercator, a Groenlândia parece enorme.', 'Conforme preserva ângulos; equivalente preserva áreas.'],
  },
  {
    pergunta: 'Na projeção de Mercator, a Groenlândia parece tão grande quanto a África (ou maior que o Brasil). Isso acontece porque:',
    certa: { texto: 'As áreas são ampliadas quanto maior a latitude, e a Groenlândia fica perto do polo.', porque: 'A ampliação cresce com a latitude: perto do Equador é pequena e perto dos polos é muito grande.' },
    erradas: [
      { texto: 'A Groenlândia realmente é maior que a África.', porque: 'A África tem área cerca de catorze vezes maior que a da Groenlândia.', motivo: 'tomou a imagem como medida real' },
      { texto: 'A projeção reduz as áreas perto do Equador e as mantém nos polos.', porque: 'No Equador a deformação em Mercator é mínima; os polos é que são ampliados.', motivo: 'inverteu o efeito da latitude' },
      { texto: 'A Groenlândia está mais perto do observador no mapa.', porque: 'Mapas não têm um observador: o efeito vem da matemática da projeção.', motivo: 'inventou um efeito de perspectiva' },
    ],
    licao: 'Em Mercator, a ampliação das áreas cresce com a latitude.',
    dicas: ['Compare o tamanho aparente com o real: a África é bem maior.', 'Onde a Groenlândia está: perto do Equador ou do polo?', 'Pense em onde as áreas são mais ampliadas.'],
  },
  {
    pergunta: 'O que conserva uma projeção equivalente, como a de Peters ou a Equal Earth?',
    certa: { texto: 'As áreas, ao custo de deformar as formas e os ângulos.', porque: 'Projeção equivalente mantém a proporção entre as áreas, e por isso mostra o tamanho relativo dos países de forma fiel.' },
    erradas: [
      { texto: 'Os ângulos e as formas locais.', porque: 'Isso é o que faz uma projeção conforme, como a de Mercator.', motivo: 'confundiu com projeção conforme' },
      { texto: 'As distâncias entre todos os pares de pontos.', porque: 'Nenhuma projeção plana preserva todas as distâncias.', motivo: 'achou que se preservam todas as distâncias' },
      { texto: 'A forma exata de todos os continentes.', porque: 'Projeções equivalentes deformam formas para manter as áreas.', motivo: 'ignorou a deformação das formas' },
    ],
    licao: 'Equivalente: preserva as áreas. Conforme: preserva os ângulos e as formas locais.',
    dicas: ['“Equivalente” lembra “mesmo valor de área”.', 'Para manter as áreas, as formas precisam se deformar.', 'Compare com a projeção conforme, que mantém os ângulos.'],
  },
  {
    pergunta: 'Por que nenhuma projeção plana representa a Terra sem deformação?',
    certa: { texto: 'Porque uma superfície esférica não pode ser planificada sem esticar, comprimir ou rasgar; toda projeção sacrifica ângulos, áreas, formas ou distâncias.', porque: 'É uma limitação geométrica: a esfera não é uma superfície que se planifica, como o cilindro ou o cone.' },
    erradas: [
      { texto: 'Porque os cartógrafos ainda não inventaram uma projeção perfeita.', porque: 'Não é questão de invenção: é impossível, matematicamente.', motivo: 'achou que é um problema técnico a resolver' },
      { texto: 'Porque os continentes mudam de lugar muito depressa.', porque: 'A deriva dos continentes é lenta e não tem relação com a deformação das projeções.', motivo: 'misturou deriva dos continentes com projeção' },
      { texto: 'Porque a Terra é um cilindro.', porque: 'A Terra é aproximadamente uma esfera (levemente achatada nos polos).', motivo: 'errou a forma da Terra' },
    ],
    licao: 'Toda projeção plana deforma ângulos, áreas, formas ou distâncias, porque a esfera não se planifica.',
    dicas: ['Tente achatar a casca de uma laranja sem rasgar.', 'A esfera não pode ser planificada como um cilindro.', 'Pense no que cada projeção sacrifica.'],
  },
  {
    pergunta: 'Quanto às superfícies de projeção, quais são os três tipos básicos?',
    certa: { texto: 'Cilíndrica, cônica e azimutal (plana).', porque: 'Projetamos a superfície terrestre em um cilindro, em um cone ou em um plano, que depois são abertos.' },
    erradas: [
      { texto: 'Equivalente, conforme e equidistante.', porque: 'Esses são tipos pela propriedade que se conserva, e não pela superfície de projeção.', motivo: 'confundiu superfície com propriedade conservada' },
      { texto: 'Norte, sul e equatorial.', porque: 'Isso classifica a posição do ponto de tangência, e não a superfície.', motivo: 'confundiu com a posição do ponto de tangência' },
      { texto: 'Esférica, plana e elíptica.', porque: 'Não são tipos de superfície de projeção. A superfície é plana ou desenvolvível: cilindro, cone ou plano.', motivo: 'inventou tipos de superfície' },
    ],
    licao: 'Superfícies de projeção: cilindro, cone e plano.',
    dicas: ['Pense em formas que se abrem sem rasgar: cilindro, cone e plano.', 'O outro critério (equivalente/conforme) fala de uma propriedade conservada.', 'Azimutal usa um plano.'],
  },
  {
    pergunta: 'Em uma projeção cilíndrica simples (equirretangular), os paralelos e os meridianos aparecem como:',
    certa: { texto: 'Retas perpendiculares entre si, formando uma grade de retângulos.', porque: 'A latitude vira a coordenada vertical e a longitude, a horizontal; a grade é regular.' },
    erradas: [
      { texto: 'Círculos concêntricos e retas que partem do centro.', porque: 'Isso é típico de projeções azimutais polares.', motivo: 'confundiu com a projeção azimutal polar' },
      { texto: 'Arcos de círculos que convergem para um ponto.', porque: 'É o que ocorre em projeções cônicas, nas quais os meridianos convergem.', motivo: 'confundiu com a projeção cônica' },
      { texto: 'Curvas aleatórias, sem regra.', porque: 'A grade tem regras matemáticas bem definidas.', motivo: 'achou que a grade é arbitrária' },
    ],
    licao: 'Projeção cilíndrica: grade de paralelos e meridianos retos e perpendiculares.',
    dicas: ['Pense em desenrolar um cilindro.', 'Latitude e longitude viram eixos vertical e horizontal.', 'Cônica: meridianos convergem; azimutal polar: círculos concêntricos.'],
  },
]

export const BANCO_COORDENADAS: ItemBanco[] = [
  {
    pergunta: 'O Equador é o paralelo de latitude:',
    certa: { texto: '0°, e divide a Terra nos hemisférios Norte e Sul.', porque: 'A latitude é contada a partir do Equador, que é o ponto de partida (0°).' },
    erradas: [
      { texto: '90° N, e divide a Terra em leste e oeste.', porque: '90° N é o Polo Norte. E a divisão em leste e oeste é feita por meridianos, não por paralelos.', motivo: 'confundiu paralelo com meridiano' },
      { texto: '23,5° S, que marca o início do verão no sul.', porque: 'Esse é o Trópico de Capricórnio.', motivo: 'confundiu com o Trópico de Capricórnio' },
      { texto: '180°, que divide a Terra em dois hemisférios Ocidental e Oriental.', porque: '180° é uma longitude (antimeridiano), e não a latitude do Equador.', motivo: 'confundiu latitude com longitude' },
    ],
    licao: 'Equador: latitude 0°, separa os hemisférios Norte e Sul.',
    dicas: ['Latitude é medida de 0° a 90°.', 'O ponto de partida da latitude é o Equador.', 'Divide a Terra no sentido norte-sul.'],
  },
  {
    pergunta: 'O Trópico de Capricórnio está, aproximadamente, na latitude de:',
    certa: { texto: '23,5° Sul.', porque: 'Os trópicos ficam a cerca de 23,5° do Equador; o de Capricórnio está no Hemisfério Sul.' },
    erradas: [
      { texto: '23,5° Norte.', porque: '23,5° N é o Trópico de Câncer.', motivo: 'trocou os trópicos' },
      { texto: '66,5° Sul.', porque: '66,5° S é o Círculo Polar Antártico.', motivo: 'confundiu com o círculo polar' },
      { texto: '0°.', porque: '0° é o Equador.', motivo: 'confundiu com o Equador' },
    ],
    licao: 'Trópicos: cerca de 23,5° N (Câncer) e 23,5° S (Capricórnio).',
    dicas: ['Capricórnio está no Hemisfério Sul.', 'Os trópicos estão a cerca de 23,5° do Equador.', 'Os círculos polares estão mais perto dos polos.'],
  },
  {
    pergunta: 'O meridiano de Greenwich (0°) é usado para:',
    certa: { texto: 'Origem das longitudes e divisão da Terra nos hemisférios Oriental e Ocidental.', porque: 'A longitude é contada a partir de Greenwich, para leste e para oeste, até 180°.' },
    erradas: [
      { texto: 'Origem das latitudes e divisão em Norte e Sul.', porque: 'A origem das latitudes é o Equador, e não Greenwich.', motivo: 'confundiu meridiano com paralelo' },
      { texto: 'Marcar o Trópico de Câncer.', porque: 'O Trópico de Câncer é um paralelo, e Greenwich é um meridiano.', motivo: 'confundiu meridiano com paralelo' },
      { texto: 'Definir apenas o fuso horário do Brasil.', porque: 'É a referência de longitude e de fusos do mundo todo (UTC), não só do Brasil.', motivo: 'restringiu a função do meridiano' },
    ],
    licao: 'Greenwich: longitude 0°; separa leste (Oriental) de oeste (Ocidental).',
    dicas: ['Meridianos ligam os polos.', 'A longitude é contada a partir dele.', 'Os fusos horários também partem dele.'],
  },
  {
    pergunta: 'Em relação aos hemisférios, a posição do Brasil é:',
    certa: { texto: 'Quase todo no Hemisfério Sul, com uma pequena parte no extremo norte no Hemisfério Norte, e todo no Ocidental.', porque: 'O Equador cruza o norte do país, e todo o território fica a oeste de Greenwich.' },
    erradas: [
      { texto: 'Todo no Hemisfério Sul e no Oriental.', porque: 'O Brasil está a oeste de Greenwich (Ocidental), e o Equador passa pelo norte do país.', motivo: 'ignorou o Equador e o hemisfério ocidental' },
      { texto: 'Todo no Hemisfério Norte e no Ocidental.', porque: 'A maior parte do país está ao sul do Equador.', motivo: 'inverteu o hemisfério predominante' },
      { texto: 'Metade em cada hemisfério, Norte e Sul.', porque: 'Só uma pequena parte do norte do país fica no Hemisfério Norte.', motivo: 'achou que o Equador divide o país ao meio' },
    ],
    licao: 'O Brasil está quase todo no Hemisfério Sul (o Equador cruza o norte) e todo no Ocidental.',
    dicas: ['O Equador passa pelo norte do Brasil (Amapá, por exemplo).', 'A longitude do Brasil é oeste de Greenwich.', 'A maior parte do território fica ao sul do Equador.'],
  },
  {
    pergunta: 'Aproximadamente quantos quilômetros mede 1° de latitude, ao longo de um meridiano?',
    certa: { texto: 'Cerca de 111 km.', porque: 'A circunferência da Terra é de cerca de 40.000 km; dividida em 360°, dá cerca de 111 km por grau.' },
    erradas: [
      { texto: 'Cerca de 1 km.', porque: 'A Terra é muito maior: 360° de circunferência cobrem cerca de 40.000 km.', motivo: 'subestimou o tamanho da Terra' },
      { texto: 'Cerca de 15 km.', porque: '15 é o número de graus de longitude de um fuso horário, e não de quilômetros por grau.', motivo: 'confundiu com os 15° por fuso' },
      { texto: 'Cerca de 1.000 km.', porque: '1.000 km seriam cerca de 9°. Um grau tem cerca de 111 km.', motivo: 'superestimou o valor' },
    ],
    licao: '1° de latitude ≈ 111 km (40.000 km ÷ 360°).',
    dicas: ['A circunferência da Terra é cerca de 40.000 km.', 'Um círculo tem 360°.', 'Divida: 40.000 ÷ 360.'],
  },
  {
    pergunta: 'O antimeridiano de Greenwich (180°) é importante porque:',
    certa: { texto: 'Perto dele passa a linha internacional de data, onde a data muda de um dia.', porque: 'É o meridiano oposto ao de Greenwich; a linha de data o acompanha, com desvios.' },
    erradas: [
      { texto: 'Nele passa o Equador.', porque: 'O Equador é um paralelo (0° de latitude), e o antimeridiano é um meridiano.', motivo: 'confundiu meridiano com paralelo' },
      { texto: 'É o limite dos trópicos.', porque: 'Os trópicos são paralelos, e não estão ligados ao antimeridiano.', motivo: 'confundiu com os trópicos' },
      { texto: 'É onde a Terra tem o maior raio.', porque: 'O raio é maior no Equador (a Terra é levemente achatada nos polos), mas isso não depende do antimeridiano.', motivo: 'inventou uma propriedade física' },
    ],
    licao: 'Antimeridiano (180°): perto dele passa a linha internacional de data.',
    dicas: ['É o meridiano oposto ao de Greenwich.', 'A data muda perto dele.', 'Lembre-se da aba de fusos horários.'],
  },
]
