import type { ItemBanco } from '@/materias/biologia/comum/auxiliares'
import type { PareEPense, SecaoResumo } from '../tipos'

export const FONTES_GEOPOLITICA = [
  'Vesentini, J. W. Novas geopolíticas. São Paulo: Contexto.',
  'Hobsbawm, E. Era dos extremos: o breve século XX (1914–1991). São Paulo: Companhia das Letras.',
  'Organização das Nações Unidas. Carta das Nações Unidas, 1945 (un.org).',
  'Organização Mundial do Comércio (wto.org) e Organização do Tratado do Atlântico Norte (nato.int): documentos institucionais.',
  'União Europeia (european-union.europa.eu): história da integração europeia e países-membros.',
  'Mercosul (mercosur.int): Tratado de Assunção, 1991, e documentos institucionais.',
  'Natural Earth (domínio público), pelo pacote world-atlas: contornos dos países.',
]

/** Aviso sobre as listas de membros dos blocos. */
export const NOTA_BLOCOS =
  'Os blocos mudam: países entram, saem ou são suspensos. As listas mostradas aqui são as de fundadores (Mercosul e ASEAN) ou as que valem hoje (União Europeia e USMCA) e servem para estudar; para a situação atual, consulte o site oficial de cada bloco. Países muito pequenos podem não aparecer no mapa.'

/* ------------------------------------------------------------------ estágios de integração */

export type IdEstagio = 'zlc' | 'uniao-aduaneira' | 'mercado-comum' | 'uniao-economica'

export interface Estagio {
  id: IdEstagio
  numero: 1 | 2 | 3 | 4
  nome: string
  /** o que esse estágio acrescenta ao anterior */
  acrescenta: string
  definicao: string
  exemplo: string
}

export const ESTAGIOS: Estagio[] = [
  {
    id: 'zlc',
    numero: 1,
    nome: 'Zona de livre-comércio',
    acrescenta: 'eliminação de tarifas entre os membros',
    definicao: 'Os países eliminam as tarifas de importação entre si, mas cada um mantém a sua própria política comercial com os países de fora do bloco.',
    exemplo: 'USMCA (Estados Unidos, México e Canadá)',
  },
  {
    id: 'uniao-aduaneira',
    numero: 2,
    nome: 'União aduaneira',
    acrescenta: 'tarifa externa comum',
    definicao: 'Além do livre-comércio interno, os membros adotam uma mesma tarifa de importação para quem está fora do bloco.',
    exemplo: 'Mercosul (ainda com várias exceções, por isso é uma união aduaneira incompleta)',
  },
  {
    id: 'mercado-comum',
    numero: 3,
    nome: 'Mercado comum',
    acrescenta: 'livre circulação de pessoas, capitais e serviços',
    definicao: 'Além da união aduaneira, circulam livremente os fatores de produção: trabalhadores, capitais e serviços.',
    exemplo: 'Mercado Único da União Europeia (1993)',
  },
  {
    id: 'uniao-economica',
    numero: 4,
    nome: 'União econômica e monetária',
    acrescenta: 'moeda única e coordenação das políticas econômicas',
    definicao: 'Além do mercado comum, os países coordenam suas políticas econômicas e adotam uma moeda única, com um banco central comum.',
    exemplo: 'zona do euro, na União Europeia',
  },
]

/** Características de um acordo de integração. */
export interface Caracteristicas {
  /** sem tarifas entre os membros */
  tarifaZero: boolean
  /** tarifa externa comum */
  tarifaExterna: boolean
  /** livre circulação de pessoas, capitais e serviços */
  fatores: boolean
  /** moeda única e políticas econômicas coordenadas */
  moeda: boolean
}

export interface Bloco {
  id: string
  nome: string
  sigla: string
  criacao: number
  estagio: IdEstagio
  regiao: 'america-do-sul' | 'america-do-norte' | 'europa' | 'sudeste-asiatico'
  /** o que a lista de países representa */
  lista: string
  /** países com id numérico ISO, como no arquivo do mapa (world-atlas) */
  membros: { id: string; nome: string; semMapa?: boolean }[]
  resumo: string
  fatos: string[]
}

export const BLOCOS: Bloco[] = [
  {
    id: 'mercosul',
    nome: 'Mercado Comum do Sul',
    sigla: 'Mercosul',
    criacao: 1991,
    estagio: 'uniao-aduaneira',
    regiao: 'america-do-sul',
    lista: 'membros fundadores',
    membros: [
      { id: '032', nome: 'Argentina' },
      { id: '076', nome: 'Brasil' },
      { id: '600', nome: 'Paraguai' },
      { id: '858', nome: 'Uruguai' },
    ],
    resumo: 'Criado pelo Tratado de Assunção, em 1991, por Argentina, Brasil, Paraguai e Uruguai. Tem livre-comércio para a maior parte dos produtos e uma tarifa externa comum, mas com muitas exceções.',
    fatos: ['Tratado de Assunção (1991) e Protocolo de Ouro Preto (1994), que deu ao bloco personalidade jurídica.', 'Apesar do nome, é uma união aduaneira ainda incompleta, e não um mercado comum.', 'Venezuela e Bolívia têm situações recentes de suspensão ou de adesão; consulte o site oficial para a situação atual.'],
  },
  {
    id: 'ue',
    nome: 'União Europeia',
    sigla: 'UE',
    criacao: 1993,
    estagio: 'uniao-economica',
    regiao: 'europa',
    lista: 'membros atuais (27)',
    membros: [
      { id: '276', nome: 'Alemanha' },
      { id: '040', nome: 'Áustria' },
      { id: '056', nome: 'Bélgica' },
      { id: '100', nome: 'Bulgária' },
      { id: '196', nome: 'Chipre' },
      { id: '191', nome: 'Croácia' },
      { id: '208', nome: 'Dinamarca' },
      { id: '703', nome: 'Eslováquia' },
      { id: '705', nome: 'Eslovênia' },
      { id: '724', nome: 'Espanha' },
      { id: '233', nome: 'Estônia' },
      { id: '246', nome: 'Finlândia' },
      { id: '250', nome: 'França' },
      { id: '300', nome: 'Grécia' },
      { id: '348', nome: 'Hungria' },
      { id: '372', nome: 'Irlanda' },
      { id: '380', nome: 'Itália' },
      { id: '428', nome: 'Letônia' },
      { id: '440', nome: 'Lituânia' },
      { id: '442', nome: 'Luxemburgo' },
      { id: '470', nome: 'Malta', semMapa: true },
      { id: '528', nome: 'Países Baixos' },
      { id: '616', nome: 'Polônia' },
      { id: '620', nome: 'Portugal' },
      { id: '203', nome: 'Tchéquia' },
      { id: '642', nome: 'Romênia' },
      { id: '752', nome: 'Suécia' },
    ],
    resumo: 'Nasceu da integração iniciada com a Comunidade Econômica Europeia (Tratado de Roma, 1957) e foi criada pelo Tratado de Maastricht (assinado em 1992 e em vigor em 1993). Tem mercado único e, em boa parte dos países, moeda comum, o euro.',
    fatos: ['Tratado de Roma (1957) criou a Comunidade Econômica Europeia; Tratado de Maastricht (1992, em vigor em 1993) criou a União Europeia.', 'O euro começou como moeda de conta em 1999 e circulou em notas e moedas em 2002; nem todos os membros o adotaram.', 'O Reino Unido deixou o bloco em 31 de janeiro de 2020 (Brexit); por isso são 27 membros.'],
  },
  {
    id: 'usmca',
    nome: 'Acordo Estados Unidos–México–Canadá',
    sigla: 'USMCA',
    criacao: 2020,
    estagio: 'zlc',
    regiao: 'america-do-norte',
    lista: 'membros',
    membros: [
      { id: '840', nome: 'Estados Unidos' },
      { id: '124', nome: 'Canadá' },
      { id: '484', nome: 'México' },
    ],
    resumo: 'Zona de livre-comércio que entrou em vigor em 1º de julho de 2020 e substituiu o Nafta, de 1994, entre Estados Unidos, Canadá e México.',
    fatos: ['Sucessor do Nafta (Tratado Norte-Americano de Livre-Comércio, em vigor desde 1994).', 'Cada país mantém a própria política comercial com os de fora, por isso é uma zona de livre-comércio, e não uma união aduaneira.', 'Em espanhol, o acordo é chamado T-MEC; em inglês, USMCA.'],
  },
  {
    id: 'asean',
    nome: 'Associação de Nações do Sudeste Asiático',
    sigla: 'ASEAN',
    criacao: 1967,
    estagio: 'zlc',
    regiao: 'sudeste-asiatico',
    lista: 'membros fundadores',
    membros: [
      { id: '360', nome: 'Indonésia' },
      { id: '458', nome: 'Malásia' },
      { id: '608', nome: 'Filipinas' },
      { id: '702', nome: 'Singapura', semMapa: true },
      { id: '764', nome: 'Tailândia' },
    ],
    resumo: 'Criada em 1967, em Bangcoc, por cinco países, e hoje reúne mais membros do Sudeste Asiático. Combina cooperação política e econômica com uma zona de livre-comércio (AFTA, 1992).',
    fatos: ['Declaração de Bangcoc (1967), com cinco membros fundadores.', 'A área de livre-comércio da ASEAN (AFTA) começou em 1992.', 'Singapura é pequena demais para aparecer no mapa em escala mundial.'],
  },
]

export const blocoPorId = (id: string) => BLOCOS.find((b) => b.id === id)

/** Países que não fazem parte de nenhum dos blocos acima, para servir de alternativas erradas. */
export const FORA_DOS_BLOCOS: Record<string, { id: string; nome: string }[]> = {
  mercosul: [
    { id: '152', nome: 'Chile' },
    { id: '604', nome: 'Peru' },
    { id: '170', nome: 'Colômbia' },
    { id: '218', nome: 'Equador' },
  ],
  ue: [
    { id: '578', nome: 'Noruega' },
    { id: '756', nome: 'Suíça' },
    { id: '826', nome: 'Reino Unido' },
    { id: '792', nome: 'Turquia' },
    { id: '804', nome: 'Ucrânia' },
    { id: '688', nome: 'Sérvia' },
  ],
  usmca: [
    { id: '192', nome: 'Cuba' },
    { id: '320', nome: 'Guatemala' },
    { id: '591', nome: 'Panamá' },
    { id: '170', nome: 'Colômbia' },
    { id: '076', nome: 'Brasil' },
  ],
  asean: [
    { id: '156', nome: 'China' },
    { id: '356', nome: 'Índia' },
    { id: '392', nome: 'Japão' },
    { id: '410', nome: 'Coreia do Sul' },
    { id: '036', nome: 'Austrália' },
  ],
}

/* ------------------------------------------------------------------ pontos estratégicos */

export interface PontoEstrategico {
  id: string
  nome: string
  tipo: 'canal' | 'estreito'
  lon: number
  lat: number
  /** os dois mares, oceanos ou golfos que ele liga */
  liga: [string, string]
  paises: string
  /** ids numéricos ISO dos países que ficam ao lado dele (para conferir a posição no mapa) */
  paisesIds: string[]
  importancia: string
  nota: string
}

export const PONTOS: PontoEstrategico[] = [
  {
    id: 'suez',
    nome: 'Canal de Suez',
    tipo: 'canal',
    lon: 32.4,
    lat: 30.5,
    liga: ['Mar Mediterrâneo', 'Mar Vermelho'],
    paises: 'Egito',
    paisesIds: ['818'],
    importancia: 'Encurta a viagem entre a Europa e a Ásia, porque evita contornar a África pelo Cabo da Boa Esperança.',
    nota: 'Inaugurado em 1869 e nacionalizado pelo Egito em 1956.',
  },
  {
    id: 'panama',
    nome: 'Canal do Panamá',
    tipo: 'canal',
    lon: -79.7,
    lat: 9.1,
    liga: ['Oceano Atlântico', 'Oceano Pacífico'],
    paises: 'Panamá',
    paisesIds: ['591'],
    importancia: 'Permite que os navios passem entre o Atlântico e o Pacífico sem contornar a América do Sul pelo extremo sul.',
    nota: 'Inaugurado em 1914; o controle passou integralmente ao Panamá em 1999.',
  },
  {
    id: 'ormuz',
    nome: 'Estreito de Ormuz',
    tipo: 'estreito',
    lon: 56.5,
    lat: 26.6,
    liga: ['Golfo Pérsico', 'Golfo de Omã'],
    paises: 'Irã e Omã',
    paisesIds: ['364', '512'],
    importancia: 'É a saída marítima do petróleo e do gás de grandes produtores do Golfo Pérsico; por ele passa grande parte do petróleo transportado por mar.',
    nota: 'Região de tensão geopolítica por sua importância energética.',
  },
  {
    id: 'malaca',
    nome: 'Estreito de Malaca',
    tipo: 'estreito',
    lon: 100.6,
    lat: 3.2,
    liga: ['Oceano Índico', 'Mar da China Meridional'],
    paises: 'Malásia, Indonésia (Sumatra) e Singapura',
    paisesIds: ['458', '360'],
    importancia: 'Principal rota marítima entre o Oceano Índico e o Pacífico asiático, usada pelo petróleo do Golfo Pérsico e pelo comércio com China, Japão e Coreia do Sul.',
    nota: 'Um dos corredores mais movimentados do comércio mundial.',
  },
  {
    id: 'gibraltar',
    nome: 'Estreito de Gibraltar',
    tipo: 'estreito',
    lon: -5.6,
    lat: 36,
    liga: ['Oceano Atlântico', 'Mar Mediterrâneo'],
    paises: 'Espanha e Marrocos',
    paisesIds: ['724', '504'],
    importancia: 'É a única ligação marítima natural entre o Atlântico e o Mediterrâneo, com cerca de 14 km no ponto mais estreito.',
    nota: 'Gibraltar, no lado europeu, é território britânico.',
  },
  {
    id: 'bosforo',
    nome: 'Estreito do Bósforo',
    tipo: 'estreito',
    lon: 29.05,
    lat: 41.1,
    liga: ['Mar Negro', 'Mar de Mármara (e, por ele, o Mediterrâneo)'],
    paises: 'Turquia',
    paisesIds: ['792'],
    importancia: 'É a saída do Mar Negro para o Mediterrâneo; a passagem de navios é regulada pela Convenção de Montreux, de 1936.',
    nota: 'Istambul fica nas duas margens do estreito.',
  },
  {
    id: 'bab-el-mandeb',
    nome: 'Estreito de Bab el-Mandeb',
    tipo: 'estreito',
    lon: 43.4,
    lat: 12.6,
    liga: ['Mar Vermelho', 'Golfo de Áden (Oceano Índico)'],
    paises: 'Iêmen e Djibuti',
    paisesIds: ['887', '262'],
    importancia: 'É a porta sul do Mar Vermelho: os navios que usam o Canal de Suez para ir ao Índico passam por ele.',
    nota: 'Forma, com Suez, a rota marítima mais curta entre a Europa e a Ásia.',
  },
]

/* ------------------------------------------------------------------ bancos de perguntas */

export const BANCO_ORGANIZACOES: ItemBanco[] = [
  {
    pergunta: 'Quais são os cinco membros permanentes do Conselho de Segurança da ONU, com direito a veto?',
    certa: { texto: 'Estados Unidos, Rússia, China, Reino Unido e França', porque: 'São os cinco vencedores da Segunda Guerra com assento permanente; qualquer um deles pode vetar uma resolução.' },
    erradas: [
      { texto: 'Estados Unidos, Alemanha, Japão, Reino Unido e França', porque: 'Alemanha e Japão, derrotados na guerra, não são membros permanentes.', motivo: 'incluiu países derrotados na guerra' },
      { texto: 'Estados Unidos, Brasil, Índia, China e Rússia', porque: 'Brasil e Índia defendem a reforma do Conselho para ganhar assento permanente, mas ainda não têm.', motivo: 'incluiu países que não são permanentes' },
      { texto: 'Os cinco países mais populosos do mundo', porque: 'O critério não é a população; vem do resultado da Segunda Guerra.', motivo: 'usou um critério errado' },
    ],
    licao: 'Conselho de Segurança: EUA, Rússia, China, Reino Unido e França têm assento permanente e veto.',
    dicas: ['Pense nos vencedores da Segunda Guerra.', 'São cinco países.', 'Qualquer um pode vetar.'],
  },
  {
    pergunta: 'A ONU foi criada em 1945. Qual organização ela substituiu, depois de esta ter fracassado em evitar a Segunda Guerra?',
    certa: { texto: 'Liga das Nações', porque: 'A Liga das Nações, criada em 1919 depois da Primeira Guerra, não conseguiu impedir a nova guerra mundial.' },
    erradas: [
      { texto: 'OTAN', porque: 'A OTAN é uma aliança militar de 1949.', motivo: 'confundiu com a OTAN' },
      { texto: 'Pacto de Varsóvia', porque: 'O Pacto de Varsóvia é de 1955 e foi uma aliança militar soviética.', motivo: 'confundiu com o Pacto de Varsóvia' },
      { texto: 'Organização Mundial do Comércio', porque: 'A OMC é de 1995 e trata de comércio.', motivo: 'confundiu com a OMC' },
    ],
    licao: 'Liga das Nações (1919) fracassou; a ONU (1945) a substituiu.',
    dicas: ['A primeira organização é de depois da Primeira Guerra.', 'Ela não evitou a Segunda Guerra.', 'O nome também fala em nações.'],
  },
  {
    pergunta: 'A OTAN, criada em 1949, é:',
    certa: { texto: 'Uma aliança militar defensiva liderada pelos Estados Unidos, com defesa coletiva entre os membros', porque: 'O artigo 5 do tratado prevê que um ataque a um membro é um ataque a todos.' },
    erradas: [
      { texto: 'Um bloco econômico de livre-comércio', porque: 'A OTAN é militar, e não comercial.', motivo: 'confundiu com bloco econômico' },
      { texto: 'Uma aliança militar liderada pela União Soviética', porque: 'A aliança soviética foi o Pacto de Varsóvia (1955).', motivo: 'trocou de aliança' },
      { texto: 'Um tribunal internacional para julgar crimes de guerra', porque: 'A OTAN não é um tribunal.', motivo: 'inventou função' },
    ],
    licao: 'OTAN (1949): aliança militar ocidental, com defesa coletiva.',
    dicas: ['Pense na Guerra Fria.', 'É uma aliança do lado capitalista.', 'O artigo 5 trata da defesa coletiva.'],
  },
  {
    pergunta: 'O Pacto de Varsóvia, de 1955, foi:',
    certa: { texto: 'A aliança militar do bloco soviético, criada como resposta à OTAN', porque: 'Reuniu a URSS e países do Leste Europeu até a dissolução, em 1991.' },
    erradas: [
      { texto: 'A aliança militar ocidental liderada pelos EUA', porque: 'Essa é a OTAN.', motivo: 'trocou de aliança' },
      { texto: 'Um acordo de livre-comércio entre países do Leste', porque: 'O pacto era militar.', motivo: 'confundiu com acordo econômico' },
      { texto: 'O tratado que criou a União Europeia', porque: 'A UE nasceu do Tratado de Maastricht (1992).', motivo: 'confundiu com a União Europeia' },
    ],
    licao: 'Pacto de Varsóvia (1955): aliança militar do bloco soviético.',
    dicas: ['É a contrapartida da OTAN.', 'Reunia países socialistas.', 'Foi extinto no início dos anos 1990.'],
  },
  {
    pergunta: 'A Organização Mundial do Comércio (OMC), criada em 1995, tem como função principal:',
    certa: { texto: 'Regular o comércio internacional e resolver disputas comerciais entre os países', porque: 'A OMC sucedeu o GATT (1947) e tem sede em Genebra.' },
    erradas: [
      { texto: 'Emprestar dinheiro a países com problemas no balanço de pagamentos', porque: 'Essa é uma função do FMI.', motivo: 'confundiu com o FMI' },
      { texto: 'Controlar a produção de petróleo', porque: 'Isso é papel da OPEP.', motivo: 'confundiu com a OPEP' },
      { texto: 'Defender militarmente os membros', porque: 'Essa é a função de uma aliança militar, como a OTAN.', motivo: 'confundiu com a OTAN' },
    ],
    licao: 'OMC (1995): regras do comércio mundial e solução de disputas; sucedeu o GATT.',
    dicas: ['O nome diz comércio.', 'Substituiu o GATT.', 'A sede é em Genebra.'],
  },
  {
    pergunta: 'O Fundo Monetário Internacional (FMI) e o Banco Mundial foram criados na Conferência de Bretton Woods, em 1944. Qual é a principal função do FMI?',
    certa: { texto: 'Zelar pela estabilidade financeira e monetária e emprestar a países com dificuldades no balanço de pagamentos', porque: 'O FMI trata de moeda e de crises financeiras; o Banco Mundial financia projetos de desenvolvimento.' },
    erradas: [
      { texto: 'Financiar a reconstrução de cidades destruídas por guerras com dinheiro doado', porque: 'Financiar projetos de reconstrução e desenvolvimento é mais próximo do Banco Mundial.', motivo: 'trocou o FMI pelo Banco Mundial' },
      { texto: 'Julgar disputas comerciais entre países', porque: 'Isso é papel da OMC.', motivo: 'confundiu com a OMC' },
      { texto: 'Organizar as forças de paz da ONU', porque: 'As operações de paz são do Conselho de Segurança.', motivo: 'confundiu com a ONU' },
    ],
    licao: 'Bretton Woods (1944): FMI (estabilidade monetária e crises) e Banco Mundial (financiamento ao desenvolvimento).',
    dicas: ['O M de FMI é monetário.', 'Pense em crises de balanço de pagamentos.', 'Ano: 1944.'],
  },
  {
    pergunta: 'A OPEP, criada em 1960, reúne:',
    certa: { texto: 'Países exportadores de petróleo, que coordenam sua produção e seus preços', porque: 'Entre os fundadores estavam Arábia Saudita, Irã, Iraque, Kuwait e Venezuela.' },
    erradas: [
      { texto: 'Países importadores de petróleo, para negociar preços menores', porque: 'A OPEP é composta por exportadores.', motivo: 'inverteu importadores e exportadores' },
      { texto: 'Países da América do Sul que formam um bloco econômico', porque: 'A OPEP não se limita à América do Sul e é de petróleo.', motivo: 'confundiu com bloco sul-americano' },
      { texto: 'Países que fazem parte da OTAN', porque: 'A OTAN é uma aliança militar, e não tem relação com a OPEP.', motivo: 'confundiu com a OTAN' },
    ],
    licao: 'OPEP (1960): exportadores de petróleo que coordenam produção e preços.',
    dicas: ['O P final é de petróleo.', 'Os choques do petróleo foram em 1973 e 1979.', 'São exportadores.'],
  },
  {
    pergunta: 'Qual afirmação sobre a Assembleia Geral da ONU é correta?',
    certa: { texto: 'Todos os países-membros têm um voto cada, e as decisões gerais têm caráter de recomendação', porque: 'Diferente do Conselho de Segurança, a Assembleia não tem poder de impor decisões.' },
    erradas: [
      { texto: 'Só cinco países votam e todos têm poder de veto', porque: 'Isso descreve o Conselho de Segurança.', motivo: 'confundiu com o Conselho de Segurança' },
      { texto: 'Os votos são proporcionais à população dos países', porque: 'Na Assembleia, cada país tem um voto.', motivo: 'inventou voto proporcional' },
      { texto: 'Ela tem poder de aplicar sanções militares', porque: 'Esse poder é do Conselho de Segurança.', motivo: 'atribuiu poder ao órgão errado' },
    ],
    licao: 'Assembleia Geral: um país, um voto, recomendações. Conselho de Segurança: cinco permanentes com veto e decisões obrigatórias.',
    dicas: ['Todos os membros participam.', 'Cada país tem um voto.', 'O poder de impor decisões é do Conselho.'],
  },
  {
    pergunta: 'O grupo BRICS originalmente reunia Brasil, Rússia, Índia e China. A sigla foi proposta em 2001 por:',
    certa: { texto: 'Um economista de um banco de investimentos, para indicar economias emergentes de grande potencial', porque: 'O termo BRIC foi criado em 2001 por Jim O’Neill; a África do Sul entrou em 2011, e a sigla ganhou o S.' },
    erradas: [
      { texto: 'Uma resolução do Conselho de Segurança da ONU', porque: 'O termo não nasceu na ONU.', motivo: 'inventou origem' },
      { texto: 'Um tratado assinado pelos quatro países em 1991', porque: 'O termo nasceu de uma análise econômica, e não de um tratado.', motivo: 'inventou origem' },
      { texto: 'Uma decisão da OMC', porque: 'A OMC não criou o termo.', motivo: 'inventou origem' },
    ],
    licao: 'BRIC (2001): termo de um economista; África do Sul entra em 2011 (BRICS).',
    dicas: ['O termo nasceu em análise de mercado.', 'Foi em 2001.', 'O S veio depois, com a África do Sul.'],
  },
  {
    pergunta: 'O que a União Africana, criada em 2002, substituiu?',
    certa: { texto: 'A Organização da Unidade Africana, de 1963', porque: 'A UA sucedeu a OUA, com objetivos mais amplos de integração política e econômica.' },
    erradas: [
      { texto: 'A Liga Árabe', porque: 'A Liga Árabe é de 1945 e continua existindo.', motivo: 'confundiu com a Liga Árabe' },
      { texto: 'A Liga das Nações', porque: 'A Liga das Nações foi substituída pela ONU, e não pela UA.', motivo: 'confundiu com a Liga das Nações' },
      { texto: 'O Pacto de Varsóvia', porque: 'O Pacto de Varsóvia era do bloco soviético.', motivo: 'confundiu com o Pacto de Varsóvia' },
    ],
    licao: 'União Africana (2002) sucedeu a OUA (1963).',
    dicas: ['O nome antigo também tem África.', 'A OUA foi criada na época da descolonização.', 'A troca ocorreu nos anos 2000.'],
  },
  {
    pergunta: 'Qual é a posição tradicional do Brasil em relação ao Conselho de Segurança da ONU?',
    certa: { texto: 'Defende a reforma do Conselho e reivindica um assento permanente', porque: 'O Brasil, como outros países emergentes, argumenta que a composição do Conselho reflete o mundo de 1945.' },
    erradas: [
      { texto: 'É membro permanente com poder de veto desde 1945', porque: 'Os cinco permanentes são EUA, Rússia, China, Reino Unido e França.', motivo: 'achou que o Brasil é permanente' },
      { texto: 'Pede o fim de qualquer assento permanente', porque: 'O Brasil pede a ampliação do Conselho, incluindo ele mesmo, e não o fim do assento.', motivo: 'inverteu a posição' },
      { texto: 'Nunca participou do Conselho', porque: 'O Brasil já foi membro não permanente várias vezes.', motivo: 'ignorou os mandatos não permanentes' },
    ],
    licao: 'O Brasil já foi membro não permanente várias vezes e reivindica um assento permanente, com reforma do Conselho.',
    dicas: ['O Brasil não tem veto.', 'Ele participa como membro não permanente em alguns períodos.', 'A reivindicação é por reforma.'],
  },
  {
    pergunta: 'O que é o G20?',
    certa: { texto: 'Um fórum que reúne as maiores economias, desenvolvidas e emergentes, entre elas o Brasil', porque: 'É um espaço de coordenação econômica entre grandes economias; não é um bloco com tarifas comuns.' },
    erradas: [
      { texto: 'Uma aliança militar entre vinte países', porque: 'O G20 trata de economia, e não é uma aliança militar.', motivo: 'confundiu com aliança militar' },
      { texto: 'Um bloco de livre-comércio com moeda única', porque: 'O G20 não tem tarifa comum nem moeda única.', motivo: 'confundiu com bloco econômico' },
      { texto: 'Um tribunal de comércio da ONU', porque: 'O G20 não é um tribunal.', motivo: 'inventou função' },
    ],
    licao: 'G20: fórum das maiores economias, com países desenvolvidos e emergentes.',
    dicas: ['É um fórum de economia.', 'Inclui emergentes, como o Brasil.', 'Não tem tarifas comuns.'],
  },
]

export const BANCO_ORDEM: ItemBanco[] = [
  {
    pergunta: 'Depois da Segunda Guerra Mundial, o mundo se organizou em duas superpotências em disputa. Essa ordem é chamada de:',
    certa: { texto: 'Bipolar, com Estados Unidos e União Soviética', porque: 'A Guerra Fria (1947–1991) dividiu o mundo em duas esferas de influência, a capitalista e a socialista.' },
    erradas: [
      { texto: 'Multipolar, com vários polos de poder equivalentes', porque: 'A multipolaridade é uma característica do mundo atual, e não do pós-guerra.', motivo: 'confundiu com a multipolaridade' },
      { texto: 'Unipolar, com apenas os EUA', porque: 'A unipolaridade veio depois, nos anos 1990.', motivo: 'confundiu com a unipolaridade' },
      { texto: 'Imperial, com uma só metrópole', porque: 'Não era uma ordem imperial.', motivo: 'inventou classificação' },
    ],
    licao: 'Ordem bipolar: EUA × URSS (1945–1991).',
    dicas: ['Bi significa dois.', 'Duas superpotências.', 'Período da Guerra Fria.'],
  },
  {
    pergunta: 'Por que a Guerra Fria foi chamada de fria?',
    certa: { texto: 'Porque as superpotências não se enfrentaram em guerra direta, e disputaram influência por meios políticos, econômicos e conflitos indiretos', porque: 'O medo de uma guerra nuclear levou à disputa indireta, como na Coreia, no Vietnã e no Afeganistão.' },
    erradas: [
      { texto: 'Porque os combates aconteciam só em regiões polares', porque: 'O nome não tem relação com o clima.', motivo: 'interpretou o nome ao pé da letra' },
      { texto: 'Porque houve guerra direta entre os EUA e a URSS', porque: 'Não houve guerra direta entre as duas potências.', motivo: 'achou que houve guerra direta' },
      { texto: 'Porque foi um período sem nenhuma tensão', porque: 'Houve muita tensão, como na Crise dos Mísseis.', motivo: 'ignorou a tensão do período' },
    ],
    licao: 'Guerra Fria: disputa sem confronto direto entre EUA e URSS, com guerras indiretas.',
    dicas: ['Não houve guerra direta.', 'Pense nas armas nucleares.', 'Os conflitos eram em outros países.'],
  },
  {
    pergunta: 'A Doutrina Truman (1947) e o Plano Marshall (1947) fizeram parte de qual estratégia dos Estados Unidos?',
    certa: { texto: 'Conter o avanço do comunismo e reconstruir a Europa Ocidental como aliada', porque: 'A política de contenção e a ajuda econômica ligaram a Europa Ocidental aos EUA.' },
    erradas: [
      { texto: 'Criar a ONU', porque: 'A ONU foi criada em 1945.', motivo: 'confundiu com a criação da ONU' },
      { texto: 'Apoiar a descolonização da África', porque: 'Não era o objetivo central dessas medidas.', motivo: 'confundiu com a descolonização' },
      { texto: 'Formar o Pacto de Varsóvia', porque: 'O Pacto de Varsóvia foi uma aliança soviética.', motivo: 'confundiu com o Pacto de Varsóvia' },
    ],
    licao: 'Contenção (Doutrina Truman) e ajuda econômica (Plano Marshall) em 1947.',
    dicas: ['Pense no avanço soviético.', 'A Europa estava destruída.', 'O ano é 1947.'],
  },
  {
    pergunta: 'Qual foi o maior momento de tensão nuclear da Guerra Fria, em 1962?',
    certa: { texto: 'A Crise dos Mísseis em Cuba', porque: 'Mísseis soviéticos instalados em Cuba levaram o mundo à beira de uma guerra nuclear; a crise terminou com a retirada dos mísseis.' },
    erradas: [
      { texto: 'A queda do Muro de Berlim', porque: 'O Muro caiu em 1989, e não foi um momento de tensão nuclear.', motivo: 'confundiu com a queda do Muro' },
      { texto: 'A Guerra da Coreia', porque: 'A guerra da Coreia foi de 1950 a 1953.', motivo: 'confundiu a data' },
      { texto: 'A criação da OTAN', porque: 'A OTAN foi criada em 1949.', motivo: 'confundiu a data' },
    ],
    licao: 'Crise dos Mísseis (1962): auge da tensão nuclear, com mísseis soviéticos em Cuba.',
    dicas: ['Foi em 1962.', 'Envolveu uma ilha do Caribe.', 'Mísseis soviéticos perto dos EUA.'],
  },
  {
    pergunta: 'O que foi a Conferência de Bandung, de 1955?',
    certa: { texto: 'Encontro de países da Ásia e da África que defendiam independência e não alinhamento aos blocos da Guerra Fria', porque: 'Reuniu países recém-independentes, que não queriam se alinhar automaticamente nem aos EUA nem à URSS.' },
    erradas: [
      { texto: 'A reunião que criou a OTAN', porque: 'A OTAN é de 1949, e foi criada por países ocidentais.', motivo: 'confundiu com a OTAN' },
      { texto: 'O encontro que dividiu a Alemanha em duas', porque: 'A divisão da Alemanha ocorreu no pós-guerra, sem relação com Bandung.', motivo: 'confundiu com a divisão da Alemanha' },
      { texto: 'A cúpula que fundou a União Europeia', porque: 'A UE é de 1992/1993.', motivo: 'confundiu com a União Europeia' },
    ],
    licao: 'Bandung (1955): países afro-asiáticos pelo não alinhamento e pela descolonização.',
    dicas: ['Participaram Ásia e África.', 'O tema era independência e neutralidade.', 'Origem do movimento dos não alinhados.'],
  },
  {
    pergunta: 'O que ocorreu em 1989 e em 1991 que mudou a ordem mundial?',
    certa: { texto: 'A queda do Muro de Berlim (1989) e a dissolução da União Soviética (1991)', porque: 'Esses eventos encerraram a Guerra Fria e deixaram os EUA como única superpotência.' },
    erradas: [
      { texto: 'A criação da ONU (1989) e da OTAN (1991)', porque: 'A ONU é de 1945 e a OTAN, de 1949.', motivo: 'errou as datas das organizações' },
      { texto: 'A Revolução Russa (1989) e a Primeira Guerra (1991)', porque: 'Esses eventos são de 1917 e de 1914.', motivo: 'errou as datas' },
      { texto: 'A construção do Muro de Berlim (1989) e a Crise dos Mísseis (1991)', porque: 'O Muro foi construído em 1961 e a Crise dos Mísseis foi em 1962.', motivo: 'errou as datas' },
    ],
    licao: '1989: queda do Muro de Berlim. 1991: fim da URSS. Fim da Guerra Fria.',
    dicas: ['Dois fatos do fim do século XX.', 'Um deles é na Alemanha.', 'O outro dissolveu uma superpotência.'],
  },
  {
    pergunta: 'Depois do fim da União Soviética, como muitos autores descrevem a ordem mundial dos anos 1990?',
    certa: { texto: 'Unipolar, com a hegemonia dos Estados Unidos', porque: 'Sem a URSS, os EUA ficaram como única superpotência política, econômica e militar.' },
    erradas: [
      { texto: 'Bipolar, com EUA e China', porque: 'A ordem bipolar era com a URSS e acabou em 1991.', motivo: 'manteve a ordem bipolar' },
      { texto: 'Imperial, com as antigas metrópoles europeias', porque: 'O mundo já tinha passado pela descolonização.', motivo: 'confundiu com o imperialismo' },
      { texto: 'Sem nenhum país influente', porque: 'Os EUA eram a maior potência do período.', motivo: 'ignorou a hegemonia dos EUA' },
    ],
    licao: 'Anos 1990: unipolaridade, com hegemonia dos EUA.',
    dicas: ['Uni significa um.', 'A URSS não existia mais.', 'Pense na única superpotência.'],
  },
  {
    pergunta: 'O que caracteriza uma ordem mundial multipolar, como a que muitos analistas descrevem para o século XXI?',
    certa: { texto: 'A distribuição do poder entre vários países ou blocos, como EUA, China, União Europeia, Rússia e Índia', porque: 'Nessa ordem, nenhum país é capaz de impor sozinho sua vontade ao mundo.' },
    erradas: [
      { texto: 'A existência de duas superpotências com forças equivalentes', porque: 'Isso é a bipolaridade.', motivo: 'confundiu com a bipolaridade' },
      { texto: 'A dominação absoluta de um só país', porque: 'Isso é a unipolaridade.', motivo: 'confundiu com a unipolaridade' },
      { texto: 'O fim de todas as organizações internacionais', porque: 'As organizações continuam existindo.', motivo: 'inventou fim das organizações' },
    ],
    licao: 'Multipolaridade: poder distribuído entre vários polos.',
    dicas: ['Multi significa muitos.', 'Pense nas potências emergentes.', 'Nenhum país manda sozinho.'],
  },
  {
    pergunta: 'O equilíbrio do terror, na Guerra Fria, significava que:',
    certa: { texto: 'Nenhuma superpotência atacaria a outra, porque ambas tinham armas nucleares capazes de destruir os dois lados', porque: 'A ideia de destruição mútua assegurada funcionava como dissuasão.' },
    erradas: [
      { texto: 'Apenas os EUA possuíam armas nucleares', porque: 'A URSS também as tinha desde 1949.', motivo: 'ignorou o arsenal soviético' },
      { texto: 'As armas nucleares foram proibidas e destruídas em 1945', porque: 'Houve corrida armamentista, e não destruição.', motivo: 'inverteu a corrida armamentista' },
      { texto: 'A paz foi garantida por tratados de livre-comércio', porque: 'O equilíbrio vinha do medo da destruição mútua.', motivo: 'inventou a causa' },
    ],
    licao: 'Equilíbrio do terror: destruição mútua assegurada evitava o ataque direto.',
    dicas: ['As duas potências tinham armas nucleares.', 'Atacar significaria ser destruído também.', 'Isso evitou a guerra direta.'],
  },
  {
    pergunta: 'A Guerra da Coreia (1950–1953) terminou com:',
    certa: { texto: 'Um armistício e a divisão do país em duas Coreias, perto do paralelo 38', porque: 'A divisão entre Coreia do Norte (comunista) e Coreia do Sul (capitalista) continua até hoje, sem tratado de paz.' },
    erradas: [
      { texto: 'A vitória completa dos EUA e a unificação sob um regime capitalista', porque: 'O país continuou dividido.', motivo: 'achou que houve unificação' },
      { texto: 'A unificação socialista da península', porque: 'O país continuou dividido.', motivo: 'achou que houve unificação' },
      { texto: 'A entrada da Coreia na OTAN', porque: 'A Coreia não faz parte da OTAN.', motivo: 'inventou entrada na OTAN' },
    ],
    licao: 'Coreia: guerra indireta da Guerra Fria, terminada em armistício e divisão no paralelo 38.',
    dicas: ['É um conflito indireto.', 'A península ficou dividida.', 'A linha é o paralelo 38.'],
  },
  {
    pergunta: 'Em 1990, o Iraque invadiu o Kuwait. O que se seguiu, em 1991?',
    certa: { texto: 'Uma coalizão liderada pelos EUA, com autorização da ONU, libertou o Kuwait na Guerra do Golfo', porque: 'A guerra mostrou a capacidade militar dos EUA no início da ordem pós-Guerra Fria.' },
    erradas: [
      { texto: 'A OTAN ocupou o Iraque e dividiu o país', porque: 'A coalizão não ocupou o Iraque nessa ocasião.', motivo: 'inventou ocupação' },
      { texto: 'A União Soviética defendeu o Iraque militarmente', porque: 'A URSS estava em dissolução e não interveio.', motivo: 'ignorou o fim da URSS' },
      { texto: 'A guerra não teve intervenção internacional', porque: 'Houve ação militar de uma coalizão.', motivo: 'ignorou a coalizão' },
    ],
    licao: 'Guerra do Golfo (1990–1991): coalizão liderada pelos EUA libertou o Kuwait.',
    dicas: ['O Kuwait foi invadido.', 'A ONU autorizou o uso da força.', 'Os EUA lideraram.'],
  },
  {
    pergunta: 'Após os atentados de 11 de setembro de 2001, os Estados Unidos lançaram:',
    certa: { texto: 'A chamada guerra ao terror, com a invasão do Afeganistão em 2001', porque: 'O governo Bush atacou o Afeganistão, onde estava a Al-Qaeda, e depois invadiu o Iraque em 2003.' },
    erradas: [
      { texto: 'A Doutrina Truman', porque: 'A Doutrina Truman é de 1947.', motivo: 'confundiu a data' },
      { texto: 'O Plano Marshall', porque: 'O Plano Marshall é de 1947.', motivo: 'confundiu a data' },
      { texto: 'A criação do Mercosul', porque: 'O Mercosul foi criado em 1991.', motivo: 'confundiu com o Mercosul' },
    ],
    licao: '11/09/2001: guerra ao terror; invasão do Afeganistão (2001) e do Iraque (2003).',
    dicas: ['O ano é 2001.', 'A Al-Qaeda estava no Afeganistão.', 'A resposta foi militar.'],
  },
]

/* ------------------------------------------------------------------ Entenda */

export interface PassoGeopolitica {
  titulo: string
  texto: string[]
  pare: PareEPense
  visual: 'ordem' | 'organizacoes' | 'estagios' | 'blocos' | 'pontos' | 'brasil'
}

export const PASSOS_GEOPOLITICA: PassoGeopolitica[] = [
  {
    titulo: 'Ordens mundiais: bipolar, unipolar e multipolar',
    texto: [
      'Geopolítica estuda como o espaço geográfico e o poder se relacionam: quem controla o quê, onde e por quê. Uma ordem mundial é a maneira como o poder se distribui entre os países em certo período.',
      'De 1945 a 1991, a ordem foi bipolar: Estados Unidos e União Soviética disputavam influência sem guerra direta (a Guerra Fria). Com o fim da URSS, nos anos 1990, os EUA ficaram como única superpotência. No século XXI, muitos analistas falam em multipolaridade, com China, União Europeia, Rússia, Índia e outros polos.',
    ],
    pare: { pergunta: 'Que ordem mundial vigorou entre 1945 e 1991?', opcoes: ['Bipolar', 'Unipolar', 'Multipolar'], certa: 0, explicacao: 'Dois polos de poder, EUA e URSS, marcaram o período da Guerra Fria.' },
    visual: 'ordem',
  },
  {
    titulo: 'Organizações internacionais',
    texto: [
      'Depois da Segunda Guerra, os países criaram organizações para evitar novas guerras e regular a economia. A ONU (1945) tem a Assembleia Geral, com um voto por país, e o Conselho de Segurança, com cinco membros permanentes e veto.',
      'Em 1944, Bretton Woods criou o FMI e o Banco Mundial. O comércio é regulado pela OMC (1995), que sucedeu o GATT. A OTAN (1949) e o Pacto de Varsóvia (1955) foram as alianças militares da Guerra Fria; a OPEP (1960) reúne exportadores de petróleo.',
    ],
    pare: { pergunta: 'Qual órgão da ONU tem cinco membros permanentes com direito a veto?', opcoes: ['Conselho de Segurança', 'Assembleia Geral', 'Banco Mundial'], certa: 0, explicacao: 'EUA, Rússia, China, Reino Unido e França têm assento permanente e veto no Conselho de Segurança.' },
    visual: 'organizacoes',
  },
  {
    titulo: 'Blocos econômicos e estágios de integração',
    texto: [
      'Blocos econômicos são acordos entre países para facilitar o comércio e, em alguns casos, a vida econômica em geral. Eles avançam por estágios: zona de livre-comércio (sem tarifas entre os membros), união aduaneira (mais tarifa externa comum), mercado comum (mais livre circulação de pessoas, capitais e serviços) e união econômica e monetária (mais moeda única e políticas coordenadas).',
      'Cada estágio inclui o anterior. Por isso, uma zona de livre-comércio não tem tarifa externa comum, e um mercado comum precisa ter, antes, uma união aduaneira.',
    ],
    pare: { pergunta: 'O que diferencia uma união aduaneira de uma zona de livre-comércio?', opcoes: ['A tarifa externa comum', 'A moeda única', 'A livre circulação de pessoas'], certa: 0, explicacao: 'Na união aduaneira, os membros adotam a mesma tarifa de importação para os países de fora do bloco; na zona de livre-comércio, cada um mantém a sua.' },
    visual: 'estagios',
  },
  {
    titulo: 'Mercosul, União Europeia, USMCA e ASEAN',
    texto: [
      'O Mercosul (1991) é uma união aduaneira ainda incompleta. A União Europeia, criada pelo Tratado de Maastricht (em vigor em 1993) a partir da integração iniciada em 1957, é o caso mais avançado: tem mercado único e, em boa parte dos países, o euro. O Reino Unido saiu em 2020 (Brexit).',
      'O USMCA (2020) substituiu o Nafta (1994) e é uma zona de livre-comércio entre EUA, México e Canadá. A ASEAN (1967) reúne países do Sudeste Asiático, combinando cooperação política e uma zona de livre-comércio.',
    ],
    pare: { pergunta: 'O Reino Unido deixou a União Europeia em que ano?', opcoes: ['2020', '1993', '2002'], certa: 0, explicacao: 'O Brexit foi concluído em 31 de janeiro de 2020; a UE passou a ter 27 membros.' },
    visual: 'blocos',
  },
  {
    titulo: 'Canais e estreitos: os pontos estratégicos',
    texto: [
      'Grande parte do comércio mundial passa por poucos pontos do mar. Os canais de Suez e do Panamá encurtam rotas; os estreitos de Ormuz, Malaca, Bab el-Mandeb, Gibraltar e o Bósforo funcionam como gargalos: quem os controla ou ameaça influencia o comércio e o preço da energia.',
      'O Estreito de Ormuz é a saída do petróleo do Golfo Pérsico; Malaca liga o Índico ao Pacífico asiático; Suez e Bab el-Mandeb formam a rota mais curta entre a Europa e a Ásia.',
    ],
    pare: { pergunta: 'Qual canal liga o Atlântico ao Pacífico na América Central?', opcoes: ['Canal do Panamá', 'Canal de Suez', 'Estreito de Malaca'], certa: 0, explicacao: 'O Canal do Panamá, inaugurado em 1914, liga o Atlântico ao Pacífico.' },
    visual: 'pontos',
  },
  {
    titulo: 'O Brasil no tabuleiro mundial',
    texto: [
      'O Brasil faz parte do Mercosul e de organizações como a ONU, a OMC, o G20 e o BRICS (grupo de economias emergentes cujo termo nasceu em 2001). Defende a reforma do Conselho de Segurança da ONU e reivindica um assento permanente.',
      'Sua política externa combina a integração regional, com os vizinhos sul-americanos, e a busca de parceiros em todos os continentes. A China é hoje o maior comprador de produtos do agronegócio brasileiro, como a soja.',
    ],
    pare: { pergunta: 'O Brasil é membro permanente do Conselho de Segurança da ONU?', opcoes: ['Não: já foi membro não permanente várias vezes', 'Sim, com direito a veto', 'Sim, mas sem veto'], certa: 0, explicacao: 'Os cinco permanentes são EUA, Rússia, China, Reino Unido e França. O Brasil já foi membro não permanente e reivindica uma vaga permanente.' },
    visual: 'brasil',
  },
]

export const RESUMO_GEOPOLITICA: SecaoResumo[] = [
  {
    titulo: 'Ordem mundial e organizações',
    formulas: [],
    ideias: [
      'Bipolar (1945–1991): EUA × URSS, Guerra Fria sem guerra direta. Unipolar (anos 1990): hegemonia dos EUA. Multipolar (século XXI): vários polos.',
      'ONU (1945): Assembleia (um voto por país) e Conselho de Segurança (EUA, Rússia, China, Reino Unido e França, com veto).',
      'FMI e Banco Mundial (1944), OMC (1995, sucedeu o GATT), OTAN (1949), Pacto de Varsóvia (1955), OPEP (1960), União Africana (2002).',
    ],
    pegadinhas: ['Atribuir direito a veto a todos os membros da ONU.', 'Confundir a OTAN (ocidental) com o Pacto de Varsóvia (soviético).', 'Confundir FMI (crises monetárias) com Banco Mundial (desenvolvimento).'],
    fontes: FONTES_GEOPOLITICA,
  },
  {
    titulo: 'Blocos econômicos',
    formulas: [],
    ideias: [
      'Estágios, cada um incluindo o anterior: zona de livre-comércio, união aduaneira (tarifa externa comum), mercado comum (livre circulação de fatores) e união econômica e monetária (moeda única).',
      'Mercosul (1991): união aduaneira incompleta. União Europeia (Maastricht, 1993): mercado único e euro. USMCA (2020, sucedeu o Nafta, de 1994): zona de livre-comércio. ASEAN (1967).',
      'Brexit: o Reino Unido saiu da UE em 31/01/2020, e o bloco ficou com 27 membros.',
    ],
    pegadinhas: ['Achar que o Mercosul é um mercado comum pleno.', 'Achar que todos os países da UE usam o euro.', 'Confundir tarifa externa comum com livre circulação de pessoas.'],
    fontes: FONTES_GEOPOLITICA,
  },
  {
    titulo: 'Pontos estratégicos',
    formulas: [],
    ideias: [
      'Suez (Mediterrâneo e Mar Vermelho) e Bab el-Mandeb formam a rota Europa–Ásia; Panamá liga Atlântico e Pacífico.',
      'Ormuz (Golfo Pérsico e Golfo de Omã): saída do petróleo. Malaca (Índico e Mar da China Meridional): comércio asiático.',
      'Gibraltar liga o Atlântico ao Mediterrâneo; o Bósforo liga o Mar Negro ao Mediterrâneo (Convenção de Montreux, 1936).',
    ],
    pegadinhas: ['Trocar Suez (Egito) por Panamá (América Central).', 'Achar que Ormuz liga o Atlântico ao Pacífico.', 'Esquecer que Gibraltar é a única ligação natural entre o Atlântico e o Mediterrâneo.'],
    fontes: FONTES_GEOPOLITICA,
  },
]
