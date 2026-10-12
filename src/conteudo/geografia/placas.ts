import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualPlacas =
  | { tipo: 'camadas'; destaque?: 'crosta' | 'manto' | 'nucleo' | 'litosfera' }
  | { tipo: 'corte'; limite: 'dorsal' | 'rifte' | 'subducao-continental' | 'subducao-oceanica' | 'colisao' | 'transformante'; p: number }
  | { tipo: 'quadro' }
  | { tipo: 'assoalho' }
  | { tipo: 'exemplos' }

export interface PassoPlacas {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualPlacas
}

export const FONTES_PLACAS = [
  'USGS. This Dynamic Earth: The Story of Plate Tectonics (pubs.usgs.gov/gip/dynamic).',
  'Press, F.; Siever, R.; Grotzinger, J.; Jordan, T. Para entender a Terra. Porto Alegre: Bookman.',
  'Teixeira, W.; Toledo, M. C. M.; Fairchild, T. R.; Taioli, F. (orgs.). Decifrando a Terra. São Paulo: Companhia Editora Nacional.',
]

export const PASSOS_PLACAS: PassoPlacas[] = [
  {
    titulo: 'Por dentro da Terra e a ideia de placa',
    texto: [
      'A Terra tem camadas: uma crosta fina por fora (5 a 70 km), um manto espesso (cerca de 2.900 km), um núcleo externo líquido e um núcleo interno sólido. O manto é rocha quente que se deforma muito devagar, como uma massa grossa.',
      'A crosta e a parte de cima do manto formam a litosfera, uma casca rígida. Ela não é inteira: está quebrada em placas que flutuam sobre a astenosfera, a parte mais mole do manto, e se movem alguns centímetros por ano. É nas bordas dessas placas que acontece quase tudo: terremotos, vulcões e cordilheiras.',
    ],
    pare: {
      pergunta: 'O que é a litosfera?',
      opcoes: ['Só a crosta', 'Crosta mais a parte superior rígida do manto', 'O manto inteiro'],
      certa: 1,
      explicacao: 'A litosfera inclui a crosta e o topo rígido do manto. As placas tectônicas são pedaços da litosfera, que se movem sobre a astenosfera.',
    },
    visual: { tipo: 'camadas', destaque: 'litosfera' },
  },
  {
    titulo: 'Wegener, a deriva e o assoalho oceânico',
    texto: [
      'No começo do século XX, o meteorologista alemão Alfred Wegener propôs que os continentes já estiveram juntos em um supercontinente, a Pangeia, e depois se afastaram. Ele reuniu provas: o encaixe das costas da América do Sul e da África, fósseis iguais dos dois lados do Atlântico (como o Mesosaurus, réptil de água doce), rochas e cadeias de montanhas que continuam do outro lado do oceano e marcas de glaciação antiga em regiões hoje tropicais.',
      'A ideia foi rejeitada por muito tempo porque faltava explicar a força capaz de mover continentes. A resposta veio décadas depois: o fundo do oceano também se move. Nas dorsais, magma sobe, esfria e forma crosta nova, que se afasta dos dois lados. Assim, a crosta oceânica é bem mais jovem que a continental, e as correntes de convecção do manto ajudam a explicar o movimento das placas.',
    ],
    pare: {
      pergunta: 'Qual crosta é, em geral, mais antiga?',
      opcoes: ['A continental', 'A oceânica', 'As duas têm a mesma idade'],
      certa: 0,
      explicacao: 'A crosta oceânica está sempre sendo criada nas dorsais e destruída nas fossas, por isso é jovem (no máximo algumas centenas de milhões de anos). A continental, que não afunda, guarda rochas de bilhões de anos.',
    },
    visual: { tipo: 'assoalho' },
  },
  {
    titulo: 'Limites divergentes: as placas se afastam',
    texto: [
      'Quando duas placas se afastam, o magma sobe e preenche o espaço, criando crosta nova. Entre placas oceânicas, forma-se uma dorsal oceânica, a maior cadeia de montanhas do planeta, quase toda submersa (a Dorsal Meso-Atlântica separa as placas Sul-Americana e Africana, e as placas Norte-Americana e Euroasiática).',
      'Se o afastamento acontece dentro de um continente, a crosta é esticada e afunda, formando um rifte, com vulcões nas bordas e lagos compridos. O Rifte do Leste Africano é um caso: se continuar, o mar entrará e um novo oceano se abrirá. Mexa no controle de tempo e veja a fenda crescer.',
    ],
    pare: {
      pergunta: 'Num limite divergente, o que acontece com a crosta?',
      opcoes: ['É criada', 'É destruída', 'Só desliza de lado'],
      certa: 0,
      explicacao: 'Nos limites divergentes, o magma sobe e vira crosta nova. A crosta é destruída nos limites convergentes e apenas desliza nos transformantes.',
    },
    visual: { tipo: 'corte', limite: 'dorsal', p: 0.6 },
  },
  {
    titulo: 'Limites convergentes: as placas se aproximam',
    texto: [
      'O que acontece quando as placas se encontram depende do tipo de crosta. A crosta oceânica é fina e densa; a continental é espessa e leve. Quando uma placa oceânica encontra uma continental, a oceânica afunda por baixo (subducção). Forma-se uma fossa oceânica, e o material que desce derrete em parte e alimenta vulcões na borda do continente: é assim que surgem os Andes (placa de Nazca sob a Sul-Americana).',
      'Entre duas placas oceânicas, a mais velha e densa afunda, e os vulcões formam um arco de ilhas (Japão, Marianas). Entre dois continentes, nenhum afunda: eles se empilham e dobram, formando cordilheiras muito altas e quase sem vulcões, como o Himalaia (placas Indiana e Euroasiática).',
    ],
    pare: {
      pergunta: 'Por que o Himalaia quase não tem vulcões ativos?',
      opcoes: ['Porque é muito frio', 'Porque a colisão de continentes não tem subducção para gerar magma', 'Porque as placas se afastam'],
      certa: 1,
      explicacao: 'Sem placa oceânica afundando e derretendo, falta o magma dos vulcões. A colisão só empilha e dobra a crosta continental.',
    },
    visual: { tipo: 'corte', limite: 'subducao-continental', p: 0.7 },
  },
  {
    titulo: 'Limites transformantes: as placas deslizam',
    texto: [
      'Nos limites transformantes, as placas deslizam lado a lado, em sentidos opostos, sem que crosta seja criada ou destruída. O atrito prende as placas por décadas; quando a tensão acumulada vence o atrito, a rocha escorrega de uma vez, e esse deslocamento brusco é o terremoto. Não há vulcões, porque não há magma subindo.',
      'O exemplo clássico é a falha de San Andreas, na Califórnia, entre as placas do Pacífico e a Norte-Americana. Veja a estrada, o rio ou a cerca que atravessam a falha: com o tempo, aparecem deslocados.',
    ],
    pare: {
      pergunta: 'Por que não há vulcões numa falha transformante?',
      opcoes: ['Porque não há magma subindo nem placa derretendo', 'Porque a crosta ali é oceânica', 'Porque as placas se afastam muito'],
      certa: 0,
      explicacao: 'Sem afastamento e sem subducção, nenhum magma chega à superfície. A energia sai na forma de terremoto.',
    },
    visual: { tipo: 'corte', limite: 'transformante', p: 0.6 },
  },
  {
    titulo: 'Onde estão os vulcões e os terremotos',
    texto: [
      'Terremotos e vulcões se concentram nas bordas das placas. O Círculo de Fogo do Pacífico, com subducção quase o tempo todo ao redor do oceano Pacífico, reúne a maior parte dos vulcões ativos e dos terremotos mais fortes. As dorsais têm vulcanismo e sismos fracos; as zonas de subducção têm os sismos mais profundos e fortes; as colisões têm muitos sismos e poucos vulcões; as transformantes, sismos rasos e fortes, sem vulcões.',
      'O Brasil fica no meio da Placa Sul-Americana, longe das bordas. Por isso quase não tem vulcões ativos nem terremotos fortes; os que ocorrem são fracos e acontecem em falhas antigas dentro da placa. A costa atlântica brasileira é fruto da separação da América do Sul e da África (cerca de 130 milhões de anos atrás) e hoje é calma.',
    ],
    pare: {
      pergunta: 'Por que o Brasil raramente sofre grandes terremotos?',
      opcoes: ['Está no interior de uma placa, longe das bordas', 'Está sobre uma dorsal', 'Porque a placa sul-americana está parada'],
      certa: 0,
      explicacao: 'A maior parte da energia se libera nas bordas das placas. O Brasil está no interior da Placa Sul-Americana (que se move, mas como um bloco), longe dos limites.',
    },
    visual: { tipo: 'exemplos' },
  },
  {
    titulo: 'Quadro-resumo e as contas do movimento',
    texto: [
      'O quadro compara os seis casos. Uma pergunta típica dá o tipo de crosta e o movimento e pede a feição que se forma, ou o contrário: dá as feições e pede o movimento.',
      'As placas se movem em centímetros por ano, uma velocidade parecida com a do crescimento das unhas. Como 1 cm/ano equivale a 10 km a cada milhão de anos, a conta é: deslocamento (km) = velocidade (cm/ano) × tempo (milhões de anos) × 10. Numa dorsal, cada lado se afasta com a meia-taxa, e as duas margens se afastam com o dobro dela.',
    ],
    pare: {
      pergunta: 'Duas placas se afastam, cada uma a 2,5 cm/ano da dorsal. Quanto o oceano alarga por milhão de anos?',
      opcoes: ['25 km', '50 km', '5 km'],
      certa: 1,
      explicacao: 'A taxa total é 2 × 2,5 = 5 cm/ano, e 5 cm/ano são 50 km por milhão de anos.',
    },
    visual: { tipo: 'quadro' },
  },
]

export interface ExemploPlacas {
  id: string
  nome: string
  limite: 'dorsal' | 'rifte' | 'subducao-continental' | 'subducao-oceanica' | 'colisao' | 'transformante' | 'intraplaca'
  placas: string
  /** pistas que identificam o exemplo */
  pistas: string[]
  descricao: string
  ordem?: ['oceanica' | 'continental', 'oceanica' | 'continental']
}

export const EXEMPLOS_PLACAS: ExemploPlacas[] = [
  {
    id: 'andes',
    nome: 'Cordilheira dos Andes',
    limite: 'subducao-continental',
    placas: 'Placa de Nazca (oceânica) sob a Placa Sul-Americana',
    pistas: ['fossa Peru-Chile ao largo da costa', 'cordilheira com vulcões ativos', 'terremotos fortes e profundos'],
    descricao: 'A placa de Nazca afunda sob a América do Sul. Resultado: fossa, cordilheira e vulcões. O Chile registrou, em 1960, o maior terremoto já medido.',
    ordem: ['oceanica', 'continental'],
  },
  {
    id: 'himalaia',
    nome: 'Himalaia',
    limite: 'colisao',
    placas: 'Placa Indiana contra a Placa Euroasiática',
    pistas: ['as montanhas mais altas do mundo', 'fósseis marinhos em grandes altitudes', 'sem vulcanismo importante, mas com muitos terremotos'],
    descricao: 'A Índia, que estava separada da Ásia por um oceano, colide com ela há dezenas de milhões de anos. Como nenhuma das duas crostas afunda, elas se empilham e a cadeia continua a subir.',
  },
  {
    id: 'marianas',
    nome: 'Fossa das Marianas e arco de ilhas',
    limite: 'subducao-oceanica',
    placas: 'Placa do Pacífico afunda sob a das Filipinas (simplificação didática)',
    pistas: ['a fossa mais profunda do planeta, perto de 11 km', 'arco de ilhas vulcânicas', 'terremotos profundos'],
    descricao: 'Duas placas oceânicas se encontram, e a mais velha e densa afunda. Os vulcões acima da placa que desce formam ilhas em arco.',
  },
  {
    id: 'dorsal-atlantica',
    nome: 'Dorsal Meso-Atlântica',
    limite: 'dorsal',
    placas: 'Placas Sul-Americana e Africana (ao sul); Norte-Americana e Euroasiática (ao norte)',
    pistas: ['cadeia de montanhas submarina no meio do oceano', 'crosta cada vez mais velha longe da dorsal', 'a Islândia emerge sobre ela'],
    descricao: 'O Atlântico se alarga alguns centímetros por ano. A Islândia é um pedaço da dorsal acima do nível do mar.',
  },
  {
    id: 'rifte-africano',
    nome: 'Rifte do Leste Africano',
    limite: 'rifte',
    placas: 'Partes da Placa Africana (Núbia e Somália) se afastando',
    pistas: ['vale de afundamento dentro de um continente', 'vulcões como o Kilimanjaro e lagos compridos', 'início de abertura de um oceano'],
    descricao: 'A crosta continental está sendo esticada e afinada. Se o processo continuar, o mar invadirá o vale, como já aconteceu no Mar Vermelho.',
  },
  {
    id: 'san-andreas',
    nome: 'Falha de San Andreas',
    limite: 'transformante',
    placas: 'Placa do Pacífico e Placa Norte-Americana',
    pistas: ['falha longa e retilínea', 'terremotos rasos e fortes na Califórnia', 'sem vulcões na falha'],
    descricao: 'As duas placas deslizam em sentidos opostos. O atrito trava as placas por décadas, e o escorregão brusco gera o terremoto.',
  },
  {
    id: 'alpes',
    nome: 'Alpes',
    limite: 'colisao',
    placas: 'Placa Africana (e microplacas) contra a Placa Euroasiática',
    pistas: ['cadeia dobrada no centro da Europa', 'resultado da colisão de dois continentes'],
    descricao: 'Os Alpes surgiram da aproximação entre a África e a Europa, que fechou o antigo oceano entre elas.',
  },
  {
    id: 'brasil',
    nome: 'Interior do Brasil',
    limite: 'intraplaca',
    placas: 'Dentro da Placa Sul-Americana, longe das bordas',
    pistas: ['quase nenhum vulcão ativo', 'terremotos raros e de pequena magnitude', 'rochas muito antigas e estáveis'],
    descricao: 'O Brasil está no meio da Placa Sul-Americana, longe dos limites. Por isso é uma das regiões mais estáveis do planeta, embora a placa toda se mova alguns centímetros por ano.',
  },
]

export interface EvidenciaPlacas {
  pergunta: string
  certa: { texto: string; porque: string }
  erradas: { texto: string; porque: string; motivo: string }[]
  licao: string
  dicas: string[]
}

export const BANCO_EVIDENCIAS: EvidenciaPlacas[] = [
  {
    pergunta: 'Qual evidência sugere que a América do Sul e a África já estiveram unidas?',
    certa: { texto: 'Fósseis do réptil de água doce Mesosaurus nos dois lados do Atlântico', porque: 'Um réptil de água doce não atravessaria o oceano. A explicação mais simples é que viveu quando os dois continentes estavam unidos.' },
    erradas: [
      { texto: 'As duas costas têm o mesmo clima hoje', porque: 'O clima atual de cada costa não prova ligação passada: os climas atuais são diferentes.', motivo: 'confundiu clima com evidência' },
      { texto: 'O Atlântico é raso entre os dois continentes', porque: 'O Atlântico é profundo; o que une os continentes é o encaixe das costas e a continuidade de rochas e fósseis.', motivo: 'informação falsa' },
      { texto: 'Terremotos frequentes em ambas as costas', porque: 'As duas costas atlânticas são calmas, sem terremotos fortes. Além disso, sismos não indicariam união passada.', motivo: 'informação falsa' },
    ],
    licao: 'Fósseis iguais em continentes separados por oceano, mais o encaixe das costas, indicam continentes unidos no passado.',
    dicas: ['Pense no que mostram os fósseis: onde viviam os animais?', 'Um animal de água doce não atravessa o mar.', 'A resposta fala em fósseis nos dois lados do oceano.'],
  },
  {
    pergunta: 'Por que a ideia de Wegener foi rejeitada por muitos cientistas na época?',
    certa: { texto: 'Ele não explicava que força seria capaz de mover os continentes', porque: 'As evidências eram boas, mas faltava um mecanismo. A expansão do assoalho oceânico e a convecção do manto deram, décadas depois, a explicação.' },
    erradas: [
      { texto: 'Porque os fósseis que ele apresentou eram falsos', porque: 'Os fósseis eram reais e continuam sendo uma das evidências citadas até hoje.', motivo: 'afirmação falsa sobre as evidências' },
      { texto: 'Porque o assoalho oceânico é mais antigo que os continentes', porque: 'Ocorre o inverso: o assoalho oceânico é mais jovem, por ser renovado nas dorsais.', motivo: 'inverteu as idades' },
      { texto: 'Porque Wegener negava que houvesse oceanos', porque: 'Wegener falava de oceanos; o problema era explicar como os continentes se moviam por eles.', motivo: 'afirmação sem base' },
    ],
    licao: 'Wegener tinha evidências, mas não tinha mecanismo. O mecanismo (expansão do assoalho e convecção) veio depois.',
    dicas: ['Era um problema de explicação, não de dados.', 'Faltava dizer como os continentes se moviam.', 'A resposta fala em uma força ou mecanismo não explicado.'],
  },
  {
    pergunta: 'Sobre as faixas magnéticas simétricas dos dois lados de uma dorsal, o que elas indicam?',
    certa: { texto: 'A crosta nova se forma na dorsal e se afasta para os dois lados', porque: 'As rochas esfriam e gravam o campo magnético da época. A simetria mostra que o assoalho se renova no centro e se afasta para os dois lados.' },
    erradas: [
      { texto: 'As placas afundam no centro da dorsal', porque: 'A dorsal é limite divergente: o magma sobe, não afunda. Afundamento acontece nas fossas.', motivo: 'confundiu dorsal com fossa' },
      { texto: 'Os continentes estão se aproximando', porque: 'Faixas simétricas de idades crescentes, a partir do centro, mostram afastamento.', motivo: 'inverteu o movimento' },
      { texto: 'A crosta é igual dos dois lados porque não se move', porque: 'A simetria não é igualdade por imobilidade: é a assinatura de uma crosta que nasce no centro e se afasta.', motivo: 'ignorou a simetria como prova' },
    ],
    licao: 'Faixas simétricas e cada vez mais velhas longe da dorsal provam que a crosta nasce no centro e se afasta.',
    dicas: ['Pense em onde a crosta nasce.', 'Quanto mais longe da dorsal, mais velha a rocha.', 'A resposta fala em crosta nova se afastando.'],
  },
  {
    pergunta: 'Comparando as idades, o que se pode dizer sobre as crostas oceânica e continental?',
    certa: { texto: 'A oceânica é bem mais jovem (no máximo algumas centenas de milhões de anos); a continental chega a bilhões', porque: 'A oceânica é reciclada: nasce nas dorsais e é destruída nas fossas. A continental, leve, não afunda e guarda rochas muito antigas.' },
    erradas: [
      { texto: 'A oceânica é mais antiga, porque o oceano existe há mais tempo', porque: 'O oceano existe há muito tempo, mas o fundo atual é renovado o tempo todo e é jovem.', motivo: 'confundiu idade do oceano com idade da crosta' },
      { texto: 'As duas têm sempre a mesma idade, de 4,5 bilhões de anos', porque: 'Nenhuma rocha da crosta oceânica atual tem essa idade, e as continentais variam muito.', motivo: 'informação falsa' },
      { texto: 'A continental é mais jovem, porque é formada nas dorsais', porque: 'A crosta formada nas dorsais é a oceânica.', motivo: 'confundiu os tipos de crosta' },
    ],
    licao: 'A crosta oceânica é reciclada (nasce e morre); a continental, mais leve, acumula bilhões de anos.',
    dicas: ['Onde a crosta oceânica é criada e destruída?', 'Se ela é reciclada o tempo todo, o que isso diz da idade?', 'A resposta compara jovem com bilhões de anos.'],
  },
  {
    pergunta: 'Como se chamava o supercontinente que reuniu quase todas as terras emersas há cerca de 250 milhões de anos?',
    certa: { texto: 'Pangeia', porque: 'Pangeia (“toda a terra”) era cercada pelo oceano Pantalassa e depois se fragmentou.' },
    erradas: [
      { texto: 'Gondwana', porque: 'Gondwana foi a parte sul da Pangeia (América do Sul, África, Índia, Austrália e Antártida), não o supercontinente inteiro.', motivo: 'confundiu parte com todo' },
      { texto: 'Laurásia', porque: 'Laurásia foi a parte norte da Pangeia (América do Norte, Europa e Ásia).', motivo: 'confundiu parte com todo' },
      { texto: 'Pantalassa', porque: 'Pantalassa era o oceano que cercava a Pangeia, não o continente.', motivo: 'confundiu oceano com continente' },
    ],
    licao: 'Pangeia = todo o supercontinente; Gondwana = sul; Laurásia = norte; Pantalassa = oceano.',
    dicas: ['Ele reunia todas as terras.', 'Dois nomes eram só as metades norte e sul.', 'Um deles era o oceano, não terra.'],
  },
  {
    pergunta: 'Por que o Brasil raramente tem grandes terremotos e vulcões ativos?',
    certa: { texto: 'Está no interior da Placa Sul-Americana, longe dos limites entre placas', porque: 'Os terremotos e vulcões intensos se concentram nas bordas das placas. O Brasil é um bloco antigo e estável dentro da placa.' },
    erradas: [
      { texto: 'Está sobre uma dorsal oceânica', porque: 'Dorsais ficam no meio dos oceanos. A dorsal do Atlântico está a milhares de quilômetros da costa brasileira.', motivo: 'localização errada' },
      { texto: 'Porque a Placa Sul-Americana não se move', porque: 'A placa se move, a alguns centímetros por ano; a calma vem da posição do Brasil dentro dela, não da imobilidade.', motivo: 'achou que a placa é parada' },
      { texto: 'Porque o Brasil tem uma fossa oceânica na costa', porque: 'A fossa Peru-Chile fica na costa oeste da América do Sul. A costa brasileira é uma margem calma, fruto da abertura do Atlântico.', motivo: 'confundiu os lados do continente' },
    ],
    licao: 'Vulcões e grandes terremotos ficam nas bordas das placas; o interior da placa é estável.',
    dicas: ['Onde se concentra a energia das placas?', 'O Brasil fica na borda ou no centro da sua placa?', 'A resposta fala em posição dentro da placa.'],
  },
]

export const RESUMO_PLACAS: SecaoResumo[] = [
  {
    titulo: 'Estrutura da Terra e teoria das placas',
    formulas: [],
    ideias: [
      'Crosta (5 a 70 km) + manto (até cerca de 2.900 km) + núcleo externo líquido + núcleo interno sólido.',
      'Litosfera = crosta + topo rígido do manto, quebrada em placas que se movem sobre a astenosfera (parte mais mole do manto).',
      'Wegener (Pangeia): costas que se encaixam, mesmos fósseis, cadeias e glaciações continuando de um continente ao outro. Faltava o mecanismo.',
      'Explicação moderna: expansão do assoalho oceânico (crosta nasce nas dorsais) e correntes de convecção do manto.',
    ],
    pegadinhas: ['Confundir litosfera com crosta.', 'Achar que a crosta oceânica é mais antiga que a continental (é o contrário).', 'Trocar Pangeia (tudo), Gondwana (sul) e Laurásia (norte).'],
    fontes: FONTES_PLACAS,
  },
  {
    titulo: 'Os limites entre placas',
    formulas: [],
    ideias: [
      'Divergente: afastam. Dorsal (oceano) ou rifte (continente). Crosta nova, vulcões, sismos rasos.',
      'Convergente oceano-continente: oceânica afunda, fossa, cordilheira com vulcões (Andes), sismos profundos.',
      'Convergente oceano-oceano: fossa profunda e arco de ilhas vulcânicas (Japão, Marianas).',
      'Convergente continente-continente: colisão, cordilheira dobrada alta, quase sem vulcões (Himalaia, Alpes).',
      'Transformante: deslizam lado a lado, sem criar nem destruir crosta; sismos fortes e rasos, sem vulcões (San Andreas).',
    ],
    pegadinhas: ['Esperar vulcões numa colisão de continentes.', 'Trocar dorsal (divergente) por fossa (convergente).', 'Esquecer que o Brasil está no interior da placa (sismos fracos, sem vulcões).'],
    fontes: FONTES_PLACAS,
  },
  {
    titulo: 'Contas de deslocamento',
    formulas: [
      { rotulo: 'Deslocamento', tex: 'd\\ (\\text{km}) = v\\ (\\text{cm/ano}) \\cdot t\\ (\\text{Ma}) \\cdot 10' },
      { rotulo: 'Taxa total de abertura', tex: 'v_{\\text{total}} = 2\\, v_{\\text{meia-taxa}}' },
      { rotulo: 'Idade da crosta oceânica', tex: 't\\ (\\text{Ma}) = \\dfrac{d\\ (\\text{km})}{10\\, v_{\\text{meia-taxa}}\\ (\\text{cm/ano})}' },
    ],
    ideias: ['1 cm/ano equivale a 10 km por milhão de anos.', 'Cada lado da dorsal se afasta com a meia-taxa; o oceano alarga com o dobro.'],
    pegadinhas: ['Esquecer o fator 10 (cm/ano → km/Ma).', 'Usar só a meia-taxa para a abertura do oceano.', 'Misturar milhões de anos com anos.'],
  },
]
