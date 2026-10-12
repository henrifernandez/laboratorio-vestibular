import type { PareEPense, SecaoResumo } from '../tipos'

export type IdMassa = 'mEc' | 'mEa' | 'mTa' | 'mTc' | 'mPa'

export interface MassaAr {
  id: IdMassa
  nome: string
  temperatura: 'quente' | 'fria'
  umidade: 'úmida' | 'seca'
  /** onde se forma */
  origem: string
  /** centro aproximado da área de origem [lon, lat] e raios (graus), só para o desenho esquemático */
  centro: [number, number]
  raio: [number, number]
  /** para onde avança [lon, lat], desenho esquemático */
  avanco: [number, number]
  regioes: string
  efeitos: string[]
  resumo: string
}

export const FONTES_FENOMENOS = [
  'IBGE. Atlas geográfico escolar. Rio de Janeiro: IBGE (capítulos de clima e massas de ar).',
  'Mendonça, F.; Danni-Oliveira, I. M. Climatologia: noções básicas e climas do Brasil. São Paulo: Oficina de Textos.',
  'NOAA Climate Prediction Center. ENSO: Cold & Warm Episodes by Season e Oceanic Niño Index (cpc.ncep.noaa.gov).',
  'INPE/CPTEC. El Niño e La Niña (cptec.inpe.br).',
  'Ayoade, J. O. Introdução à climatologia para os trópicos. Rio de Janeiro: Bertrand Brasil.',
  'Oke, T. R. Boundary Layer Climates. Londres: Routledge (ilha de calor e inversão).',
]

export const MASSAS: MassaAr[] = [
  {
    id: 'mEc',
    nome: 'Equatorial continental',
    temperatura: 'quente',
    umidade: 'úmida',
    origem: 'planície amazônica (interior do continente), onde a floresta fornece muita umidade',
    centro: [-65, -4],
    raio: [9, 6],
    avanco: [-58, -13],
    regioes: 'Amazônia; no verão, avança para o Centro-Oeste e o Sudeste',
    efeitos: ['chuvas abundantes na Amazônia', 'no verão, leva umidade e chuvas ao Centro-Oeste e ao Sudeste'],
    resumo: 'Quente e úmida, formada sobre a Amazônia.',
  },
  {
    id: 'mEa',
    nome: 'Equatorial atlântica',
    temperatura: 'quente',
    umidade: 'úmida',
    origem: 'Oceano Atlântico, perto do Equador',
    centro: [-34, 3],
    raio: [8, 5],
    avanco: [-42, -3],
    regioes: 'litoral do Norte e do Nordeste',
    efeitos: ['traz umidade e chuva ao litoral norte e nordeste'],
    resumo: 'Quente e úmida, formada no Atlântico equatorial.',
  },
  {
    id: 'mTa',
    nome: 'Tropical atlântica',
    temperatura: 'quente',
    umidade: 'úmida',
    origem: 'Oceano Atlântico, na faixa tropical',
    centro: [-30, -25],
    raio: [9, 7],
    avanco: [-42, -22],
    regioes: 'litoral leste e sudeste do Brasil, o ano todo',
    efeitos: ['umidade no litoral', 'ao subir a Serra do Mar, o ar úmido causa chuvas de relevo (orográficas)'],
    resumo: 'Quente e úmida, formada no Atlântico tropical.',
  },
  {
    id: 'mTc',
    nome: 'Tropical continental',
    temperatura: 'quente',
    umidade: 'seca',
    origem: 'região do Chaco, no interior do continente (Paraguai, Bolívia e Argentina)',
    centro: [-61, -22],
    raio: [6, 5],
    avanco: [-53, -22],
    regioes: 'interior do Centro-Sul, principalmente no verão',
    efeitos: ['tempo quente e seco no interior do Centro-Sul', 'atua principalmente no verão'],
    resumo: 'Quente e seca, formada no interior (Chaco).',
  },
  {
    id: 'mPa',
    nome: 'Polar atlântica',
    temperatura: 'fria',
    umidade: 'úmida',
    origem: 'Oceano Atlântico Sul, perto da Patagônia',
    centro: [-52, -48],
    raio: [10, 6],
    avanco: [-50, -30],
    regioes: 'Sul e Sudeste; no inverno, pode chegar ao oeste da Amazônia',
    efeitos: ['frentes frias e queda brusca de temperatura', 'geadas no Sul e no Sudeste', 'friagem no oeste da Amazônia'],
    resumo: 'Fria e úmida, formada no Atlântico Sul.',
  },
]

export const NOME_SIGLA: Record<string, string> = {
  m: 'massa de ar',
  E: 'equatorial',
  T: 'tropical',
  P: 'polar',
  c: 'continental',
  a: 'atlântica',
}

export type FaseEnso = 'el-nino' | 'neutro' | 'la-nina'

export interface RegiaoEnso {
  regiao: string
  elNino: string
  laNina: string
}

/** Efeitos típicos (tendências) de cada fase, por região; não são garantias para um ano específico. */
export const EFEITOS_ENSO: RegiaoEnso[] = [
  { regiao: 'Sul do Brasil', elNino: 'chuvas acima da média', laNina: 'chuvas abaixo da média (estiagens)' },
  { regiao: 'Norte e Nordeste do Brasil', elNino: 'tendência de seca (menos chuva)', laNina: 'tendência de mais chuva' },
  { regiao: 'Costa do Peru e do Equador', elNino: 'águas mais quentes, menos peixes (a ressurgência enfraquece)', laNina: 'águas mais frias, pesca abundante' },
  { regiao: 'Indonésia e Austrália', elNino: 'tendência de seca e incêndios', laNina: 'tendência de chuvas fortes e enchentes' },
]

export interface PassoFenomenos {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: { tipo: 'massas'; destaque?: IdMassa } | { tipo: 'orografica'; posicao: number } | { tipo: 'enso'; fase: FaseEnso } | { tipo: 'urbano' } | { tipo: 'inversao'; inversao: boolean } | { tipo: 'sigla' }
}

export const PASSOS_FENOMENOS: PassoFenomenos[] = [
  {
    titulo: 'O que é uma massa de ar',
    texto: [
      'Massa de ar é um grande volume de ar, com centenas ou milhares de quilômetros, que tem temperatura e umidade quase uniformes. Ela adquire essas características na região onde se forma (região de origem) e as carrega quando se desloca. Quando passa sobre uma região, leva consigo o tempo que tinha na origem.',
      'As siglas dizem tudo: m (massa), uma letra maiúscula para a latitude de origem (E, equatorial; T, tropical; P, polar) e uma minúscula para a superfície (c, continental, que é seca; a, atlântica ou marítima, que é úmida). Assim, mTc é tropical continental e mPa é polar atlântica. Ar formado no mar é úmido; o formado no interior, em regiões secas, é seco; o formado perto do Equador é quente e o formado perto do polo, frio.',
    ],
    pare: {
      pergunta: 'A massa mTc é...',
      opcoes: ['Tropical continental: quente e seca', 'Tropical atlântica: quente e úmida', 'Polar continental: fria e seca'],
      certa: 0,
      explicacao: 'T = tropical (quente), c = continental (formada no interior, por isso seca).',
    },
    visual: { tipo: 'sigla' },
  },
  {
    titulo: 'As cinco massas que atuam no Brasil',
    texto: [
      'Atuam no Brasil cinco massas: a equatorial continental (mEc), na Amazônia, quente e úmida; a equatorial atlântica (mEa), no litoral norte e nordeste, quente e úmida; a tropical atlântica (mTa), no litoral leste e sudeste, quente e úmida; a tropical continental (mTc), no interior do Centro-Sul, quente e seca; e a polar atlântica (mPa), vinda do sul, fria e úmida.',
      'No mapa, escolha uma massa para ver onde ela se forma, para onde avança e o que traz. As elipses são esquemáticas: as massas de ar não têm fronteira exata e mudam de posição o tempo todo.',
    ],
    pare: {
      pergunta: 'Qual massa de ar é a única fria entre as que atuam no Brasil?',
      opcoes: ['Tropical atlântica', 'Polar atlântica', 'Equatorial continental'],
      certa: 1,
      explicacao: 'A polar atlântica vem da região próxima à Patagônia, perto do polo, e é fria e úmida, porque se forma sobre o oceano.',
    },
    visual: { tipo: 'massas' },
  },
  {
    titulo: 'Frente fria, geada e friagem',
    texto: [
      'Frente é a zona de contato entre duas massas de ar com características diferentes. Na frente fria, uma massa fria avança e empurra o ar quente para cima, formando nuvens e chuva e deixando a temperatura mais baixa depois da passagem. No Brasil, a mPa é a principal responsável pelas frentes frias, que são mais intensas no inverno.',
      'Quando a mPa chega com muita força, pode provocar geada no Sul e no Sudeste e a friagem, queda brusca de temperatura que chega ao oeste da Amazônia, onde o calor é a regra. Na frente quente, o ar quente avança sobre o frio, e a mudança do tempo é mais lenta.',
    ],
    pare: {
      pergunta: 'Qual massa de ar causa a friagem no oeste da Amazônia?',
      opcoes: ['Polar atlântica', 'Tropical continental', 'Equatorial atlântica'],
      certa: 0,
      explicacao: 'A friagem é a chegada, no inverno, do ar frio da massa polar atlântica a uma região onde o clima costuma ser quente.',
    },
    visual: { tipo: 'massas', destaque: 'mPa' },
  },
  {
    titulo: 'Chuva orográfica e sombra de chuva',
    texto: [
      'Quando o vento carrega ar úmido contra uma serra, o ar é forçado a subir. Ao subir, ele se expande e esfria. Enquanto não saturado, esfria cerca de 10 °C a cada 1.000 m (gradiente adiabático seco). A partir da altura em que o vapor condensa (nível de condensação), as nuvens se formam, a condensação libera calor e o ar esfria menos, cerca de 6 °C por 1.000 m (gradiente úmido). Esses valores são aproximações usadas nos exercícios.',
      'Do outro lado da serra (sotavento), o ar desce já sem a umidade, e, ao descer, esquenta cerca de 10 °C por 1.000 m, pois está seco. Resultado: no mesmo nível, o ar sai mais quente e mais seco do que entrou. O lado de barlavento chove muito; o de sotavento fica em sombra de chuva. É o que explica a diferença de clima entre o litoral e o interior atrás da Serra do Mar.',
    ],
    pare: {
      pergunta: 'Do lado oposto ao do vento (sotavento), o ar que desce é...',
      opcoes: ['Mais úmido e mais frio', 'Mais seco e mais quente', 'Igual ao do lado do vento'],
      certa: 1,
      explicacao: 'O ar perdeu umidade na subida (chuva) e esquenta ao descer, 10 °C por quilômetro: chega mais seco e mais quente do que entrou.',
    },
    visual: { tipo: 'orografica', posicao: 2 },
  },
  {
    titulo: 'El Niño e La Niña',
    texto: [
      'Em condições normais, os ventos alísios sopram de leste para oeste sobre o Pacífico equatorial, empilham água quente no lado oeste (Indonésia) e deixam a costa do Peru com água fria, que sobe das profundezas (ressurgência) e é rica em peixes. No El Niño, os alísios enfraquecem, a água quente se espalha para o leste e a costa do Peru esquenta; a ressurgência diminui. Na La Niña, os alísios ficam mais fortes, e o Pacífico leste fica mais frio do que o normal.',
      'Os cientistas definem o fenômeno pela anomalia da temperatura da superfície do mar na região Niño 3.4 (centro do Pacífico equatorial): +0,5 °C ou mais caracteriza El Niño; −0,5 °C ou menos, La Niña. Ele altera as chuvas em várias regiões: no Brasil, a tendência do El Niño é de mais chuva no Sul e seca no Norte e Nordeste; na La Niña, ocorre o contrário.',
    ],
    pare: {
      pergunta: 'No El Niño, o que ocorre com a água na costa do Peru?',
      opcoes: ['Fica mais quente que o normal', 'Fica mais fria que o normal', 'Não muda'],
      certa: 0,
      explicacao: 'Com os alísios mais fracos, a água quente avança para leste e a ressurgência diminui: a costa do Peru fica mais quente e os peixes diminuem.',
    },
    visual: { tipo: 'enso', fase: 'el-nino' },
  },
  {
    titulo: 'Ilha de calor urbana',
    texto: [
      'Nas grandes cidades, o centro costuma ser mais quente do que a zona rural ao redor: é a ilha de calor. As causas: asfalto e concreto absorvem e guardam calor durante o dia e o devolvem à noite; há pouca vegetação (e, portanto, pouca evaporação, que esfria o ambiente); os prédios dificultam a ventilação; e a cidade ainda libera calor de carros, máquinas e ar-condicionado.',
      'As consequências são mais desconforto térmico, maior consumo de energia com refrigeração e, em alguns casos, chuvas mais fortes sobre a cidade. Para reduzir: mais árvores e parques, telhados verdes ou claros, solos permeáveis, e corredores de ventilação. No gráfico, cada tipo de superfície tem seu nível de aquecimento relativo (uma escala qualitativa, não temperaturas medidas).',
    ],
    pare: {
      pergunta: 'Qual medida ajuda a reduzir a ilha de calor?',
      opcoes: ['Mais arborização e áreas permeáveis', 'Mais asfalto escuro', 'Menos parques'],
      certa: 0,
      explicacao: 'A vegetação sombreia e transpira, resfriando o ambiente; o solo permeável também mantém a umidade e o frescor.',
    },
    visual: { tipo: 'urbano' },
  },
  {
    titulo: 'Inversão térmica',
    texto: [
      'Normalmente, a temperatura do ar diminui com a altitude (cerca de 6,5 °C por quilômetro, em média). O ar mais quente, perto do chão, sobe, e isso dispersa a poluição. Na inversão térmica, existe uma camada em que a temperatura aumenta com a altura: o ar frio e denso fica embaixo, e o ar mais quente em cima funciona como uma tampa.',
      'A inversão ocorre com mais frequência em noites de inverno, com céu limpo e sem vento, quando o solo perde calor e esfria o ar junto dele; é mais forte em vales e em cidades como São Paulo. Nessas condições, a poluição fica presa perto do chão, a qualidade do ar piora e as doenças respiratórias aumentam. A inversão desaparece quando o Sol aquece o solo ou chega vento.',
    ],
    pare: {
      pergunta: 'O que caracteriza uma inversão térmica?',
      opcoes: ['A temperatura aumenta com a altitude, em uma camada', 'A temperatura cai mais depressa com a altitude', 'O vento fica mais forte'],
      certa: 0,
      explicacao: 'Inversão é a camada em que a temperatura aumenta com a altitude. O ar frio fica preso embaixo e o ar poluído não sobe.',
    },
    visual: { tipo: 'inversao', inversao: true },
  },
]

export interface ItemBancoFenomeno {
  pergunta: string
  certa: { texto: string; porque: string }
  erradas: { texto: string; porque: string; motivo: string }[]
  licao: string
  dicas: string[]
}

/** Perguntas escritas à mão sobre ilha de calor e inversão térmica. */
export const BANCO_URBANO: ItemBancoFenomeno[] = [
  {
    pergunta: 'Qual é a principal causa da ilha de calor nas grandes cidades?',
    certa: { texto: 'Superfícies de concreto e asfalto que absorvem calor, pouca vegetação e liberação de calor pela atividade humana', porque: 'Os materiais urbanos guardam calor, a falta de vegetação reduz o resfriamento por evaporação e a cidade ainda emite calor.' },
    erradas: [
      { texto: 'A maior altitude das áreas urbanas', porque: 'A altitude reduz a temperatura; a ilha de calor existe independentemente dela.', motivo: 'confundiu com altitude' },
      { texto: 'A proximidade do Equador', porque: 'A latitude afeta o clima da região inteira, não a diferença entre a cidade e o campo ao redor.', motivo: 'confundiu com latitude' },
      { texto: 'A ausência de ventos em toda a região', porque: 'O vento influencia, mas a ilha de calor existe por causa das superfícies e da atividade urbana, mesmo com vento.', motivo: 'causa secundária tomada como principal' },
    ],
    licao: 'Ilha de calor = materiais urbanos + pouca vegetação + calor produzido pela cidade.',
    dicas: ['Compare uma cidade com o campo ao redor: o que muda no chão?', 'Pense em asfalto, concreto e árvores.', 'A resposta fala de superfícies e de vegetação.'],
  },
  {
    pergunta: 'Qual das medidas diminui a ilha de calor?',
    certa: { texto: 'Ampliar parques, arborizar ruas e adotar telhados verdes ou claros', porque: 'A vegetação sombreia e resfria por evaporação, e superfícies claras refletem a radiação.' },
    erradas: [
      { texto: 'Substituir áreas verdes por estacionamentos asfaltados', porque: 'O asfalto absorve calor: isso aumenta a ilha de calor.', motivo: 'medida contrária' },
      { texto: 'Construir prédios altos e juntos, que bloqueiam o vento', porque: 'Bloquear a ventilação dificulta o resfriamento e tende a agravar a ilha de calor.', motivo: 'medida contrária' },
      { texto: 'Aumentar o uso de ar-condicionado', porque: 'O ar-condicionado joga calor para fora dos prédios e consome energia, aumentando a temperatura externa.', motivo: 'medida contrária' },
    ],
    licao: 'Vegetação, superfícies claras e permeáveis e boa ventilação reduzem a ilha de calor.',
    dicas: ['O que torna o campo mais fresco que a cidade?', 'Procure a medida que traz o que o campo tem.', 'Árvores e telhados claros reduzem a temperatura.'],
  },
  {
    pergunta: 'Por que a inversão térmica agrava a poluição do ar?',
    certa: { texto: 'O ar frio e denso fica preso sob uma camada de ar mais quente, que impede a subida e a dispersão dos poluentes', porque: 'Sem movimento vertical, os gases e as partículas se acumulam perto do chão.' },
    erradas: [
      { texto: 'Porque o vento fica muito forte e espalha os poluentes para as regiões vizinhas', porque: 'Na inversão, em geral, o vento é fraco: a falta de movimento é que mantém o ar parado.', motivo: 'inverteu o papel do vento' },
      { texto: 'Porque a temperatura cai muito rápido com a altitude, o que dispersa tudo para cima', porque: 'Isso ocorre quando não há inversão: o ar quente sobe e leva os poluentes consigo.', motivo: 'descreveu a condição normal' },
      { texto: 'Porque a chuva forte lava a atmosfera e concentra os poluentes no solo', porque: 'A chuva tende a limpar o ar; a inversão ocorre com tempo estável e seco.', motivo: 'confundiu com chuva' },
    ],
    licao: 'Inversão: camada de ar quente sobre ar frio, que age como tampa e impede a dispersão dos poluentes.',
    dicas: ['Em condições normais, o ar quente sobe. E na inversão?', 'Pense em uma tampa sobre uma panela.', 'A resposta fala de ar frio preso embaixo.'],
  },
  {
    pergunta: 'Em que condição a inversão térmica é mais comum?',
    certa: { texto: 'Em noites de inverno, com céu limpo e pouco vento, principalmente em vales', porque: 'O solo perde calor rapidamente e esfria o ar junto dele; o ar frio e pesado se acumula nos vales.' },
    erradas: [
      { texto: 'Em tardes de verão, com muitas nuvens e vento forte', porque: 'O solo aquecido pelo Sol e o vento favorecem a mistura vertical, o contrário da inversão.', motivo: 'condição oposta' },
      { texto: 'Durante tempestades tropicais com chuva forte', porque: 'A tempestade mistura o ar verticalmente.', motivo: 'condição oposta' },
      { texto: 'Somente nas regiões equatoriais ao meio-dia', porque: 'Ao meio-dia, o solo está aquecido e o ar sobe, sem inversão.', motivo: 'condição oposta' },
    ],
    licao: 'Inversão: noites frias e calmas, de céu limpo, mais forte em vales e no inverno.',
    dicas: ['Quando o solo esfria mais rápido?', 'Céu limpo e sem vento deixam o solo perder calor.', 'A resposta fala em noites de inverno.'],
  },
]

/** Perguntas escritas à mão sobre o nível 3 das massas de ar. */
export const BANCO_MASSAS: ItemBancoFenomeno[] = [
  {
    pergunta: 'Uma frente fria avança sobre Porto Alegre em julho: queda forte de temperatura e geada nos dias seguintes. Qual massa de ar domina?',
    certa: { texto: 'Polar atlântica', porque: 'A mPa é a massa fria e úmida que avança do sul, causa frentes frias e geadas no Sul e no Sudeste.' },
    erradas: [
      { texto: 'Tropical continental', porque: 'A mTc é quente e seca: não traz queda de temperatura.', motivo: 'confundiu temperatura' },
      { texto: 'Equatorial continental', porque: 'A mEc é quente e úmida e atua na Amazônia; não causa geada.', motivo: 'confundiu temperatura' },
      { texto: 'Equatorial atlântica', porque: 'A mEa é quente e úmida e atua no litoral norte e nordeste.', motivo: 'confundiu região' },
    ],
    licao: 'Frio + úmido + vindo do sul = polar atlântica (mPa).',
    dicas: ['A queda de temperatura indica uma massa fria.', 'Só uma massa que atua no Brasil é fria.', 'Vem do Atlântico Sul, perto da Patagônia.'],
  },
  {
    pergunta: 'Que massa de ar é quente e seca e se forma no interior do continente, na região do Chaco?',
    certa: { texto: 'Tropical continental', porque: 'A mTc forma-se no interior, em região quente e de pouca umidade.' },
    erradas: [
      { texto: 'Tropical atlântica', porque: 'A mTa forma-se sobre o oceano, por isso é úmida.', motivo: 'confundiu continental com atlântica' },
      { texto: 'Equatorial continental', porque: 'A mEc forma-se na Amazônia, quente e úmida.', motivo: 'confundiu umidade' },
      { texto: 'Polar atlântica', porque: 'A mPa é fria, formada no Atlântico Sul.', motivo: 'confundiu temperatura' },
    ],
    licao: 'Continental = formada no interior = seca; atlântica = formada no mar = úmida.',
    dicas: ['Continental ou atlântica?', 'Região quente e interior: a sigla começa com T.', 'Seca e quente: tropical continental.'],
  },
  {
    pergunta: 'Por que a massa tropical atlântica provoca chuva na Serra do Mar?',
    certa: { texto: 'O ar quente e úmido vindo do oceano sobe a serra, esfria e condensa (chuva de relevo)', porque: 'A subida forçada resfria o ar até a condensação, e a mTa carrega muita umidade do oceano.' },
    erradas: [
      { texto: 'Porque é fria e seca, e a serra a deixa mais úmida', porque: 'A mTa é quente e úmida; a serra apenas força a subida e a condensação.', motivo: 'confundiu características da massa' },
      { texto: 'Porque o ar desce a serra e se aquece, gerando nuvens', porque: 'Ao descer, o ar se aquece e fica mais seco; as nuvens se formam na subida.', motivo: 'confundiu subida e descida' },
      { texto: 'Porque a serra gera a massa de ar', porque: 'As massas de ar se formam em áreas planas e extensas (oceanos, planícies); a serra apenas interfere em sua passagem.', motivo: 'confundiu formação e passagem' },
    ],
    licao: 'Chuva de relevo: ar úmido sobe a serra, esfria e condensa no lado do vento.',
    dicas: ['O ar sobe ou desce quando há chuva orográfica?', 'Ao subir, o ar se expande e esfria.', 'A resposta fala de subida e condensação.'],
  },
]

/** Perguntas escritas à mão sobre El Niño e La Niña (nível 3). */
export const BANCO_ENSO: ItemBancoFenomeno[] = [
  {
    pergunta: 'Num ano de El Niño, qual é a tendência de chuva no Sul do Brasil e no Nordeste?',
    certa: { texto: 'Mais chuva no Sul e tendência de seca no Nordeste', porque: 'No El Niño, o aquecimento do Pacífico leste desloca a circulação: o Sul recebe mais umidade, e o Nordeste e o Norte tendem a ter menos chuva.' },
    erradas: [
      { texto: 'Seca no Sul e mais chuva no Nordeste', porque: 'Isso é a tendência da La Niña (o inverso).', motivo: 'confundiu El Niño com La Niña' },
      { texto: 'Mais chuva nas duas regiões', porque: 'Os efeitos são opostos nas duas regiões: não aumentam nas duas.', motivo: 'ignorou o contraste entre regiões' },
      { texto: 'Nenhuma alteração: o fenômeno só afeta o Pacífico', porque: 'O fenômeno altera a circulação atmosférica e influencia o clima em várias partes do mundo, inclusive no Brasil.', motivo: 'achou que o efeito é só local' },
    ],
    licao: 'El Niño: chuva no Sul, seca no Norte e Nordeste. La Niña: o contrário.',
    dicas: ['Lembre: o efeito é de contraste entre Sul e Norte/Nordeste.', 'El Niño favorece chuva no Sul.', 'Seca no Nordeste e mais chuva no Sul.'],
  },
  {
    pergunta: 'O que acontece com os ventos alísios do Pacífico equatorial durante o El Niño?',
    certa: { texto: 'Enfraquecem, e a água quente se desloca para o leste', porque: 'Alísios mais fracos deixam de empilhar a água quente no lado oeste: ela se espalha para o leste, e a ressurgência no Peru diminui.' },
    erradas: [
      { texto: 'Ficam mais fortes, e a água fria avança para o oeste', porque: 'Isso descreve a La Niña.', motivo: 'confundiu El Niño com La Niña' },
      { texto: 'Invertem de sentido e passam a soprar de oeste para leste o tempo todo', porque: 'Eles enfraquecem e podem até inverter por períodos, mas não se invertem permanentemente.', motivo: 'exagerou o efeito' },
      { texto: 'Não mudam; só a temperatura do ar muda', porque: 'A mudança da intensidade dos alísios é parte do fenômeno.', motivo: 'ignorou a circulação' },
    ],
    licao: 'El Niño: alísios fracos, água quente para o leste, ressurgência reduzida no Peru.',
    dicas: ['Alísios fortes empilham água quente no oeste.', 'No El Niño, os alísios perdem força.', 'Com menos empilhamento, a água quente vai para o leste.'],
  },
  {
    pergunta: 'Por que a pesca de anchova diminui no Peru durante o El Niño?',
    certa: { texto: 'A ressurgência de águas frias e ricas em nutrientes enfraquece, e os peixes diminuem', porque: 'As águas frias trazem nutrientes que alimentam o plâncton e os peixes. Com a água mais quente, a ressurgência diminui.' },
    erradas: [
      { texto: 'Porque a água fica fria demais e os peixes migram', porque: 'No El Niño, a água fica mais quente, não mais fria.', motivo: 'inverteu a temperatura' },
      { texto: 'Porque os ventos mais fortes afundam os barcos', porque: 'Os ventos ficam mais fracos; a causa é a queda de nutrientes.', motivo: 'inverteu os ventos' },
      { texto: 'Porque o oceano seca e perde volume', porque: 'O volume do oceano não muda; muda a temperatura e a circulação da água.', motivo: 'ideia sem base' },
    ],
    licao: 'Ressurgência = águas frias com nutrientes = muitos peixes. O El Niño enfraquece a ressurgência.',
    dicas: ['De onde vêm os nutrientes dos peixes?', 'O que traz as águas profundas para cima?', 'Com o El Niño, a água quente reduz a ressurgência.'],
  },
]

export const RESUMO_FENOMENOS: SecaoResumo[] = [
  {
    titulo: 'Massas de ar do Brasil',
    formulas: [],
    ideias: [
      'Sigla: m + (E, T ou P) + (c ou a). Continental = seca; atlântica = úmida; E e T = quentes; P = fria.',
      'mEc: quente e úmida, Amazônia. mEa: quente e úmida, litoral norte e nordeste. mTa: quente e úmida, litoral leste e sudeste.',
      'mTc: quente e seca, Chaco, interior do Centro-Sul. mPa: fria e úmida, Atlântico Sul; geada e friagem.',
      'Frente fria: massa fria empurra o ar quente para cima: nuvens, chuva e queda de temperatura.',
    ],
    pegadinhas: ['Achar que toda massa tropical é úmida (a continental é seca).', 'Esquecer que a mPa atua o ano todo, mas mais no inverno.', 'Trocar frente fria com frente quente.'],
    fontes: FONTES_FENOMENOS,
  },
  {
    titulo: 'Chuva orográfica e efeito de sombra de chuva',
    formulas: [
      { rotulo: 'Altura da condensação (Espy)', tex: 'z_c\\ (\\text{m}) \\approx 125\\,(T - T_{\\text{orvalho}})' },
      { rotulo: 'Temperatura no topo', tex: 'T_{\\text{topo}} = T_0 - 10\\, z_c - 6\\,(H - z_c)\\quad (z\\text{ em km})' },
      { rotulo: 'Temperatura no sotavento (nível inicial)', tex: 'T_{\\text{sotavento}} = T_{\\text{topo}} + 10\\, H = T_0 + 4\\,(H - z_c)' },
    ],
    ideias: ['Ar seco sobe e esfria 10 °C/km; ar saturado, cerca de 6 °C/km (valores de exercício).', 'Barlavento: nuvens e chuva. Sotavento: ar seco, mais quente e sombra de chuva.'],
    pegadinhas: ['Usar 6 °C/km desde o chão (só vale depois da condensação).', 'Esquecer que a descida é seca (10 °C/km) e subtrair em vez de somar.'],
    fontes: FONTES_FENOMENOS,
  },
  {
    titulo: 'El Niño, La Niña, ilha de calor e inversão térmica',
    formulas: [],
    ideias: [
      'El Niño: anomalia ≥ +0,5 °C no Pacífico equatorial central; alísios fracos; água quente vai para leste. La Niña: anomalia ≤ −0,5 °C, alísios fortes.',
      'Brasil: El Niño traz mais chuva ao Sul e menos ao Norte e Nordeste; La Niña, o contrário.',
      'Ilha de calor: concreto e asfalto, pouca vegetação e calor humano. Reduz-se com árvores, telhados claros e solos permeáveis.',
      'Inversão térmica: camada em que a temperatura aumenta com a altitude, fechando a poluição perto do chão (noites frias, sem vento, vales).',
    ],
    pegadinhas: ['Confundir El Niño (água quente no Pacífico leste) com La Niña (água fria).', 'Achar que o El Niño causa seca em todo o Brasil.', 'Achar que a inversão térmica acontece com vento forte.'],
    fontes: FONTES_FENOMENOS,
  },
]
