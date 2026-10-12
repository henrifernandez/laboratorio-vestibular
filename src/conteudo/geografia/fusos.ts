import type { ItemBanco } from '@/materias/biologia/comum/auxiliares'
import type { PareEPense, SecaoResumo } from '../tipos'

export interface Cidade {
  id: string
  nome: string
  /** nome curto, para rótulos pequenos */
  curto: string
  pais: string
  /** fuso oficial padrão, em horas em relação a UTC (sem horário de verão) */
  utc: number
  /** longitude em graus, positiva a leste */
  lon: number
  lat: number
}

export const FONTES_FUSOS = [
  'IANA. Time Zone Database (iana.org/time-zones): fusos oficiais das cidades.',
  'Observatório Nacional. Hora Legal Brasileira (horalegal.inmetro.gov.br e on.br).',
  'Brasil. Lei nº 12.876, de 30 de outubro de 2013 (fusos horários do Brasil).',
  'Brasil. Decreto nº 9.772, de 26 de abril de 2019 (fim do horário de verão).',
  'Moreira, J. C.; Sene, E. Geografia geral e do Brasil. São Paulo: Scipione (capítulo sobre fusos horários).',
]

/** Aviso mostrado junto com as cidades. */
export const NOTA_FUSOS =
  'Os fusos são os oficiais padrão (sem horário de verão). Países que adotam horário de verão adiantam o relógio por parte do ano; os exercícios deste tema não usam essas cidades. Conferir regras vigentes: IANA e órgãos oficiais.'

/** Cidades escolhidas por não terem horário de verão. Longitudes e latitudes arredondadas a 0,1°. */
export const CIDADES: Cidade[] = [
  { id: 'noronha', nome: 'Fernando de Noronha', curto: 'Noronha', pais: 'Brasil', utc: -2, lon: -32.4, lat: -3.9 },
  { id: 'brasilia', nome: 'Brasília', curto: 'Brasília', pais: 'Brasil', utc: -3, lon: -47.9, lat: -15.8 },
  { id: 'manaus', nome: 'Manaus', curto: 'Manaus', pais: 'Brasil', utc: -4, lon: -60, lat: -3.1 },
  { id: 'rio-branco', nome: 'Rio Branco', curto: 'Rio Branco', pais: 'Brasil', utc: -5, lon: -67.8, lat: -10 },
  { id: 'buenos-aires', nome: 'Buenos Aires', curto: 'B. Aires', pais: 'Argentina', utc: -3, lon: -58.4, lat: -34.6 },
  { id: 'bogota', nome: 'Bogotá', curto: 'Bogotá', pais: 'Colômbia', utc: -5, lon: -74.1, lat: 4.7 },
  { id: 'cidade-do-mexico', nome: 'Cidade do México', curto: 'México', pais: 'México', utc: -6, lon: -99.1, lat: 19.4 },
  { id: 'honolulu', nome: 'Honolulu', curto: 'Honolulu', pais: 'Estados Unidos', utc: -10, lon: -157.9, lat: 21.3 },
  { id: 'reykjavik', nome: 'Reykjavik', curto: 'Reykjavik', pais: 'Islândia', utc: 0, lon: -21.9, lat: 64.1 },
  { id: 'lagos', nome: 'Lagos', curto: 'Lagos', pais: 'Nigéria', utc: 1, lon: 3.4, lat: 6.5 },
  { id: 'joanesburgo', nome: 'Joanesburgo', curto: 'Joanesburgo', pais: 'África do Sul', utc: 2, lon: 28, lat: -26.2 },
  { id: 'moscou', nome: 'Moscou', curto: 'Moscou', pais: 'Rússia', utc: 3, lon: 37.6, lat: 55.8 },
  { id: 'dubai', nome: 'Dubai', curto: 'Dubai', pais: 'Emirados Árabes Unidos', utc: 4, lon: 55.3, lat: 25.2 },
  { id: 'nova-delhi', nome: 'Nova Délhi', curto: 'N. Délhi', pais: 'Índia', utc: 5.5, lon: 77.2, lat: 28.6 },
  { id: 'bangcoc', nome: 'Bangcoc', curto: 'Bangcoc', pais: 'Tailândia', utc: 7, lon: 100.5, lat: 13.8 },
  { id: 'pequim', nome: 'Pequim', curto: 'Pequim', pais: 'China', utc: 8, lon: 116.4, lat: 39.9 },
  { id: 'toquio', nome: 'Tóquio', curto: 'Tóquio', pais: 'Japão', utc: 9, lon: 139.7, lat: 35.7 },
  { id: 'brisbane', nome: 'Brisbane', curto: 'Brisbane', pais: 'Austrália', utc: 10, lon: 153, lat: -27.5 },
]

export interface PassoFusos {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual:
    | { tipo: 'mapa' }
    | { tipo: 'faixa'; utc: number[] }
    | { tipo: 'viagem' }
    | { tipo: 'politico' }
    | { tipo: 'data' }
}

export const PASSOS_FUSOS: PassoFusos[] = [
  {
    titulo: 'Por que o relógio muda de lugar para lugar',
    texto: [
      'A Terra gira em torno do próprio eixo, de oeste para leste, e dá uma volta de 360° em cerca de 24 horas. Por isso o Sol aparece primeiro nos lugares mais a leste e só depois nos mais a oeste: quando é meio-dia em um lugar, já é tarde no que fica a leste e ainda é manhã no que fica a oeste.',
      'Se todos os lugares usassem o mesmo horário, o meio-dia aconteceria com o Sol em posições muito diferentes. Para evitar isso, o mundo foi dividido em 24 fusos horários, cada um com uma hora de diferença para o vizinho.',
    ],
    pare: {
      pergunta: 'Em que sentido a Terra gira?',
      opcoes: ['De leste para oeste', 'De oeste para leste', 'De norte para sul'],
      certa: 1,
      explicacao: 'A Terra gira de oeste para leste. Por isso o Sol nasce primeiro no leste.',
    },
    visual: { tipo: 'mapa' },
  },
  {
    titulo: 'Longitudes, meridianos e fusos de 15°',
    texto: [
      'Os meridianos são linhas imaginárias que ligam os polos. O meridiano de Greenwich, perto de Londres, é a origem (0°). Medimos a longitude de 0° a 180° para leste (L) e para oeste (O).',
      'Como 360° ÷ 24 h = 15° por hora, cada fuso tem 15° de largura. O meridiano central de cada fuso é um múltiplo de 15°: 0°, 15°, 30°... A hora de cada fuso é medida em relação a Greenwich (UTC): o fuso do meridiano 45°O é UTC−3 e o do meridiano 135°L é UTC+9.',
      'Uma hora tem 60 minutos e corresponde a 15°, então cada grau de longitude vale 4 minutos de diferença na hora solar (60 ÷ 15 = 4).',
    ],
    pare: {
      pergunta: 'Quantos graus de longitude correspondem a uma hora de diferença?',
      opcoes: ['1°', '15°', '24°'],
      certa: 1,
      explicacao: '360° ÷ 24 horas = 15° por hora.',
    },
    visual: { tipo: 'faixa', utc: [-3, 0] },
  },
  {
    titulo: 'Leste adianta, oeste atrasa',
    texto: [
      'Como o Sol aparece primeiro no leste, quem está a leste tem a hora adiantada, e quem está a oeste tem a hora atrasada. Para achar a hora em outro lugar, calcule a diferença entre os fusos: diferença = fuso do destino − fuso da origem.',
      'Hora no destino = hora na origem + diferença. Exemplo: em Brasília (UTC−3) são 10h. Em Tóquio (UTC+9) a diferença é +9 − (−3) = +12 horas, e a hora é 22h do mesmo dia. Em Manaus (UTC−4) a diferença é −1 hora, e são 9h.',
      'Se o resultado passar de 24h, subtraia 24h e some um dia. Se ficar negativo, some 24h e volte um dia.',
    ],
    pare: {
      pergunta: 'Em Brasília (UTC−3) são 22h. Que horas são em Tóquio (UTC+9)?',
      opcoes: ['10h do mesmo dia', '10h do dia seguinte', '10h do dia anterior'],
      certa: 1,
      explicacao: 'A diferença é +12 h: 22h + 12 h = 34h. Passou de 24h: subtraia 24h (10h) e some um dia: 10h do dia seguinte.',
    },
    visual: { tipo: 'faixa', utc: [-3, 9] },
  },
  {
    titulo: 'Viagens de avião',
    texto: [
      'Em um voo, o relógio do aeroporto de chegada mostra a hora do local, não a hora que passou dentro do avião. Para calcular a hora de chegada, some a duração do voo ao horário de partida e depois corrija a diferença de fuso: chegada = partida + duração + diferença de fuso.',
      'Exemplo (números inventados, só para treino): um voo de 12 horas parte de Brasília às 10h. Em Brasília seriam 22h na chegada. Como Tóquio está 12 horas à frente, o relógio de Tóquio marca 10h do dia seguinte. Para achar a duração, faça a conta ao contrário: duração = (chegada − partida) − diferença de fuso.',
      'Por isso, voos para o leste parecem “perder” horas, e voos para o oeste parecem “ganhar” horas.',
    ],
    pare: {
      pergunta: 'Um voo sai às 10h de Brasília (UTC−3) e dura 3 horas, para Manaus (UTC−4). Que horas é lá ao chegar?',
      opcoes: ['13h', '12h', '14h'],
      certa: 1,
      explicacao: '10h + 3 h = 13h em Brasília; Manaus está 1 hora atrás: 12h.',
    },
    visual: { tipo: 'viagem' },
  },
  {
    titulo: 'Fuso teórico e fuso oficial',
    texto: [
      'O fuso teórico segue os meridianos de 15°. Mas os países escolhem o fuso oficial por razões práticas: manter o mesmo horário dentro de fronteiras, de estados ou de regiões econômicas. A China, por exemplo, estende-se por mais de 60° de longitude e usa um único horário (UTC+8). A Índia usa UTC+5:30, um fuso quebrado em meia hora.',
      'O Brasil tem quatro fusos oficiais: UTC−2 (ilhas oceânicas, como Fernando de Noronha), UTC−3 (o horário de Brasília, em grande parte do país), UTC−4 (a maior parte do Amazonas, Mato Grosso, Mato Grosso do Sul, Rondônia e Roraima) e UTC−5 (Acre e sudoeste do Amazonas). O horário de verão foi abolido em 2019.',
      'Na tabela, compare o fuso que a longitude indica com o oficial: a diferença costuma ser de, no máximo, uma hora.',
    ],
    pare: {
      pergunta: 'Por que o fuso oficial de um país nem sempre coincide com o fuso teórico?',
      opcoes: ['Porque a Terra gira mais devagar nesses lugares', 'Porque os países escolhem o fuso por razões políticas e econômicas', 'Porque os meridianos mudam de lugar'],
      certa: 1,
      explicacao: 'Os fusos oficiais são definidos pelos governos para manter um horário comum em territórios inteiros ou regiões econômicas.',
    },
    visual: { tipo: 'politico' },
  },
  {
    titulo: 'Linha internacional de data',
    texto: [
      'Perto do meridiano 180° passa a linha internacional de data. Ela é o ponto onde o calendário “vira”: do lado leste, a hora é UTC−12; do lado oeste, UTC+12. Os dois lados têm a mesma hora no relógio, mas datas diferentes: o lado oeste está um dia à frente.',
      'Quem cruza a linha viajando para o oeste adianta um dia no calendário. Quem cruza viajando para o leste atrasa um dia (repete a data). A linha não é reta: ela contorna fronteiras de países para que uma mesma região tenha a mesma data.',
    ],
    pare: {
      pergunta: 'Ao cruzar a linha internacional de data indo para o oeste, o que acontece com a data?',
      opcoes: ['Adianta-se um dia', 'Atrasa-se um dia', 'Nada muda'],
      certa: 0,
      explicacao: 'O lado oeste da linha está um dia à frente. Indo para o oeste, a data avança um dia.',
    },
    visual: { tipo: 'data' },
  },
]

export const RESUMO_FUSOS: SecaoResumo[] = [
  {
    titulo: 'Longitude e fuso',
    formulas: [
      { rotulo: 'Graus por hora', tex: '\\dfrac{360^\\circ}{24\\ \\text{h}} = 15^\\circ/\\text{h}' },
      { rotulo: 'Fuso teórico de um ponto', tex: 'f \\approx \\text{arredondar}\\left(\\dfrac{\\text{longitude}}{15^\\circ}\\right)\\ (\\text{L positiva, O negativa})' },
      { rotulo: 'Meridiano central', tex: '\\lambda_f = 15^\\circ \\times f' },
      { rotulo: 'Hora solar', tex: '1^\\circ = 4\\ \\text{min}' },
    ],
    ideias: ['A Terra gira de oeste para leste: o Sol nasce primeiro no leste.', '24 fusos de 15°. Greenwich (0°) é a origem; fusos a leste têm UTC positivo; a oeste, negativo.', 'Cada fuso vai de 7,5° antes a 7,5° depois do meridiano central.'],
    pegadinhas: ['Esquecer o sinal: oeste é negativo (UTC−).', 'Confundir 15° por hora com 15 minutos por grau (são 4 minutos por grau).', 'Arredondar sem olhar os limites de 7,5° do fuso.'],
    fontes: FONTES_FUSOS,
  },
  {
    titulo: 'Hora em outro lugar e viagens',
    formulas: [
      { rotulo: 'Hora no destino', tex: 'h_{\\text{destino}} = h_{\\text{origem}} + (f_{\\text{destino}} - f_{\\text{origem}})' },
      { rotulo: 'Chegada de um voo', tex: 'h_{\\text{chegada}} = h_{\\text{partida}} + \\text{duração} + (f_{\\text{destino}} - f_{\\text{origem}})' },
      { rotulo: 'Duração do voo', tex: '\\text{duração} = (h_{\\text{chegada}} - h_{\\text{partida}}) - (f_{\\text{destino}} - f_{\\text{origem}})' },
    ],
    ideias: ['Leste adianta (some); oeste atrasa (subtraia).', 'Passou de 24h: subtraia 24h e some um dia. Ficou negativo: some 24h e volte um dia.', 'Em reuniões entre cidades, passe todos os horários para um mesmo fuso antes de comparar.'],
    pegadinhas: ['Somar a diferença quando deveria subtrair (ir para o oeste).', 'Esquecer a mudança de dia.', 'Desconsiderar fusos quebrados (como UTC+5:30 da Índia).'],
    fontes: FONTES_FUSOS,
  },
  {
    titulo: 'Fusos oficiais, Brasil e linha de data',
    formulas: [],
    ideias: [
      'Fuso oficial: definido pelos governos; pode diferir do teórico (China com um fuso só; Índia em UTC+5:30).',
      'Brasil: quatro fusos (UTC−2, −3, −4 e −5). O horário de Brasília é UTC−3. Horário de verão abolido em 2019.',
      'Linha internacional de data (perto de 180°): indo para o oeste, adianta-se um dia; indo para o leste, atrasa-se um dia.',
    ],
    pegadinhas: ['Achar que o Brasil tem um fuso só.', 'Achar que a linha de data é reta e coincide exatamente com 180°.', 'Confundir fuso teórico com fuso oficial.'],
    fontes: FONTES_FUSOS,
  },
]

export const BANCO_FUSOS: ItemBanco[] = [
  {
    pergunta: 'Quantos graus de longitude correspondem a uma hora de diferença entre dois lugares?',
    certa: { texto: '15°, porque 360° ÷ 24 h = 15° por hora.', porque: 'A Terra dá uma volta de 360° em 24 horas: em uma hora, gira 15°.' },
    erradas: [
      { texto: '24°, o número de fusos.', porque: 'Há 24 fusos, mas cada um tem 360° ÷ 24 = 15°, e não 24°.', motivo: 'confundiu o número de fusos com os graus' },
      { texto: '1°, porque cada grau vale uma hora.', porque: 'Cada grau vale 4 minutos, não uma hora.', motivo: 'confundiu graus com horas' },
      { texto: '60°, porque uma hora tem 60 minutos.', porque: 'A conta usa 360° divididos por 24 horas. O 60 dos minutos não entra nessa relação.', motivo: 'usou os minutos como graus' },
    ],
    licao: 'A Terra gira 15° por hora (360° ÷ 24 h) e 1° a cada 4 minutos.',
    dicas: ['Uma volta completa tem 360°.', 'Uma volta completa leva 24 horas.', 'Divida: 360° ÷ 24.'],
  },
  {
    pergunta: 'Ao viajar para o leste, o que acontece com o relógio no destino em relação ao da origem?',
    certa: { texto: 'Está adiantado, porque o Sol aparece primeiro no leste.', porque: 'A Terra gira de oeste para leste, então lugares a leste recebem a luz antes e têm hora adiantada.' },
    erradas: [
      { texto: 'Está atrasado, porque o Sol aparece primeiro no leste.', porque: 'O Sol aparece primeiro no leste, e por isso a hora do leste é adiantada, e não atrasada.', motivo: 'inverteu o sentido da diferença' },
      { texto: 'É o mesmo, porque os relógios mostram a hora de Greenwich.', porque: 'Os relógios mostram a hora do fuso local, que difere de Greenwich.', motivo: 'ignorou a existência dos fusos' },
      { texto: 'Depende só do dia da semana.', porque: 'A diferença depende do fuso (longitude), não do dia da semana.', motivo: 'inventou uma dependência do dia' },
    ],
    licao: 'Leste adianta, oeste atrasa.',
    dicas: ['A Terra gira de oeste para leste.', 'Quem está mais a leste vê o Sol antes.', 'Quem vê o Sol antes está mais adiantado no dia.'],
  },
  {
    pergunta: 'Quantos fusos horários oficiais o Brasil tem atualmente?',
    certa: { texto: 'Quatro: UTC−2, UTC−3, UTC−4 e UTC−5.', porque: 'Há o horário das ilhas oceânicas (UTC−2), o de Brasília (UTC−3), o do Amazonas, Mato Grosso e outros (UTC−4) e o do Acre (UTC−5).' },
    erradas: [
      { texto: 'Um só, o de Brasília, em todo o território.', porque: 'O Brasil é extenso de leste a oeste e tem mais de um fuso oficial.', motivo: 'achou que o país tem um fuso só' },
      { texto: 'Dois: o de Brasília e o do Acre.', porque: 'Além deles, existem os fusos UTC−4 e UTC−2.', motivo: 'esqueceu fusos intermediários' },
      { texto: 'Seis, um para cada região geográfica.', porque: 'Os fusos oficiais não seguem as regiões geográficas, e o número é quatro.', motivo: 'ligou os fusos às regiões do IBGE' },
    ],
    licao: 'O Brasil tem quatro fusos oficiais: UTC−2, UTC−3 (Brasília), UTC−4 e UTC−5 (Acre).',
    dicas: ['O Brasil se estende por cerca de 39° de longitude no continente, mais as ilhas oceânicas.', 'O horário de Brasília é o mais usado.', 'O Acre tem o fuso mais atrasado do país.'],
  },
  {
    pergunta: 'Por que o fuso oficial de um país nem sempre é o fuso que sua longitude indicaria?',
    certa: { texto: 'Porque os governos definem os fusos por razões práticas, políticas e econômicas.', porque: 'É vantajoso manter o mesmo horário em um território, em uma região econômica ou em países vizinhos.' },
    erradas: [
      { texto: 'Porque a Terra gira mais devagar em alguns países.', porque: 'A Terra gira com a mesma velocidade angular em todos os lugares: 15° por hora.', motivo: 'inventou que a rotação varia' },
      { texto: 'Porque os meridianos mudam de posição durante o ano.', porque: 'Os meridianos são linhas fixas.', motivo: 'achou que os meridianos se movem' },
      { texto: 'Porque o fuso teórico não existe.', porque: 'O fuso teórico existe e serve de referência; o oficial é que pode diferir.', motivo: 'negou o fuso teórico' },
    ],
    licao: 'Fuso teórico: pelos meridianos. Fuso oficial: definido por cada país.',
    dicas: ['Compare o que a longitude indica com o que o país usa.', 'Pense na vantagem de uma região inteira usar o mesmo horário.', 'Quem decide o horário oficial?'],
  },
  {
    pergunta: 'A China se estende por mais de 60° de longitude e usa um único horário oficial (UTC+8). Isso é um exemplo de:',
    certa: { texto: 'Fuso oficial definido por decisão política, diferente do que a longitude indicaria em boa parte do território.', porque: 'Pela longitude, o país teria vários fusos; o governo escolheu um só horário.' },
    erradas: [
      { texto: 'Fuso teórico, que sempre coincide com o oficial.', porque: 'Nem sempre coincidem: a China ilustra o contrário.', motivo: 'achou que fuso oficial e teórico coincidem sempre' },
      { texto: 'Erro de medida das longitudes.', porque: 'As longitudes estão certas. A diferença vem da decisão política.', motivo: 'atribuiu a diferença a um erro de medida' },
      { texto: 'Efeito do horário de verão.', porque: 'O horário de verão é um adiantamento sazonal de uma hora. Não explica um único fuso em um país enorme.', motivo: 'confundiu com horário de verão' },
    ],
    licao: 'A China usa um único horário oficial em um território de mais de 60° de longitude.',
    dicas: ['Cada 15° de longitude equivalem a um fuso teórico.', 'Mais de 60° dariam pelo menos quatro fusos teóricos.', 'O país adotou um só horário por escolha do governo.'],
  },
  {
    pergunta: 'Ao cruzar a linha internacional de data, de leste para oeste (rumo à Ásia), o que se faz com o calendário?',
    certa: { texto: 'Adianta-se um dia.', porque: 'O lado oeste da linha está um dia à frente do lado leste, e quem passa para o oeste avança um dia.' },
    erradas: [
      { texto: 'Atrasa-se um dia.', porque: 'Atrasar um dia é o que se faz ao cruzar a linha para o leste.', motivo: 'inverteu o sentido da correção' },
      { texto: 'Adianta-se uma hora.', porque: 'A linha de data muda o calendário em um dia inteiro, não uma hora.', motivo: 'trocou dia por hora' },
      { texto: 'Nada muda: a data é a mesma dos dois lados.', porque: 'O papel da linha é justamente separar duas datas.', motivo: 'ignorou a função da linha' },
    ],
    licao: 'Linha de data: indo para o oeste, adianta-se um dia; indo para o leste, atrasa-se um dia.',
    dicas: ['O lado oeste da linha está um dia à frente.', 'Quem vai para lá “entra” no dia seguinte.', 'Quem volta para o leste repete a data.'],
  },
  {
    pergunta: 'Em que sentido a Terra gira e o que isso significa para os horários?',
    certa: { texto: 'De oeste para leste: o Sol aparece primeiro nos lugares mais a leste, que têm a hora adiantada.', porque: 'É a rotação de oeste para leste que faz o leste ver o Sol antes.' },
    erradas: [
      { texto: 'De leste para oeste: o Sol aparece primeiro nos lugares mais a oeste.', porque: 'O sentido está invertido. A rotação é de oeste para leste.', motivo: 'inverteu o sentido da rotação' },
      { texto: 'De norte para sul: quanto mais ao sul, mais cedo amanhece.', porque: 'A rotação não é de norte para sul, e a hora depende da longitude, não da latitude.', motivo: 'confundiu longitude com latitude' },
      { texto: 'Em nenhum sentido: a Terra não gira.', porque: 'A Terra gira, e o dia e a noite são consequência dessa rotação.', motivo: 'negou a rotação' },
    ],
    licao: 'A Terra gira de oeste para leste: leste adianta, oeste atrasa.',
    dicas: ['Pense em onde o Sol nasce.', 'O Sol nasce no leste.', 'Quem tem o Sol mais cedo está mais adiantado no dia.'],
  },
  {
    pergunta: 'O que é o horário de verão?',
    certa: { texto: 'Adiantar o relógio, em geral em uma hora, por parte do ano, para aproveitar mais a luz do Sol no fim do dia.', porque: 'É um adiantamento sazonal do relógio que muda o fuso por alguns meses; o Brasil deixou de adotá-lo em 2019.' },
    erradas: [
      { texto: 'Uma mudança permanente de fuso para a hora de Greenwich.', porque: 'É sazonal, e não permanente.', motivo: 'achou que é uma mudança permanente' },
      { texto: 'Atrasar o relógio em 12 horas no verão.', porque: 'O adiantamento é de cerca de uma hora, e não 12.', motivo: 'errou o valor da mudança' },
      { texto: 'A hora solar exata de cada lugar.', porque: 'A hora solar é calculada pela posição do Sol, e não por decisão administrativa.', motivo: 'confundiu com hora solar' },
    ],
    licao: 'Horário de verão: adiantar o relógio (em geral 1 h) por parte do ano. O Brasil acabou com ele em 2019.',
    dicas: ['Pense em “verão”: dias longos.', 'A mudança costuma ser de uma hora.', 'Ela vale só por alguns meses do ano.'],
  },
]
