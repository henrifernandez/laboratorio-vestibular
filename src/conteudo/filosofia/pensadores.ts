import type { ItemBanco } from '@/materias/biologia/comum/auxiliares'
import type { Autor, PassoHumanas } from '../humanas'
import type { SecaoResumo } from '../tipos'

export const FONTES_FILOSOFIA = [
  'Chauí, M. Convite à filosofia. São Paulo: Ática.',
  'Marcondes, D. Iniciação à história da filosofia: dos pré-socráticos a Wittgenstein. Rio de Janeiro: Zahar.',
  'Reale, G.; Antiseri, D. História da filosofia. São Paulo: Paulus.',
  'Stanford Encyclopedia of Philosophy (plato.stanford.edu) e Internet Encyclopedia of Philosophy (iep.utm.edu).',
]

export type Epoca = 'Antiguidade' | 'Idade Moderna' | 'Contemporânea'

export interface Pensador extends Autor {
  epoca: Epoca
}

/** Os 14 pensadores do tema, em ordem cronológica. */
export const PENSADORES: Pensador[] = [
  {
    id: 'socrates',
    nome: 'Sócrates',
    periodo: 'c. 470–399 a.C.',
    nascimento: -470,
    morte: -399,
    lugar: 'Atenas (Grécia antiga)',
    tradicao: 'filosofia antiga (período clássico)',
    epoca: 'Antiguidade',
    resumo: 'Filosofar é investigar, pelo diálogo, o que são a virtude e a justiça, examinando criticamente as próprias crenças.',
    ideia:
      'Sócrates não deixou nada escrito: o que sabemos dele vem sobretudo dos diálogos de Platão. Pelas ruas de Atenas, ele conversava com as pessoas e fazia perguntas sobre a virtude, a justiça e o bem, mostrando que certezas aparentes não resistiam a um exame cuidadoso. Seu método combinava a ironia (fingir ignorância para revelar contradições) e a maiêutica, a arte de ajudar o interlocutor a chegar às próprias ideias. Para ele, quem conhece o bem age bem, e o mal vem da ignorância. Foi condenado à morte por impiedade e por corromper os jovens.',
    contexto: 'Vive na Atenas democrática do século V a.C., em tempo de guerras e de debates com os sofistas, mestres que cobravam para ensinar a argumentar.',
    conceitos: [
      { termo: 'maiêutica', sentido: 'Arte de fazer perguntas que ajudam o interlocutor a elaborar, por si mesmo, as ideias que já carregava, como quem ajuda a nascer.' },
      { termo: 'ironia socrática', sentido: 'Recurso de fingir ignorância e perguntar, para expor as contradições nas certezas do interlocutor.' },
      { termo: 'intelectualismo moral', sentido: 'Tese de que saber o que é o bem leva a praticá-lo, e de que o mal vem da ignorância.' },
      { termo: 'exame de si', sentido: 'Prática de questionar as próprias crenças e valores, como ponto de partida da sabedoria.' },
    ],
    afirmacoes: [
      { texto: 'O conhecimento sobre a virtude e o bem se busca pelo diálogo e por perguntas, ajudando o interlocutor a dar à luz as próprias ideias.' },
      { texto: 'Quem de fato conhece o bem age bem; o mal nasce da ignorância.' },
      { texto: 'Viver bem exige examinar criticamente as próprias crenças e valores.' },
      { texto: 'A filosofia começa quando se percebe que as certezas que se tinha não resistem a perguntas.' },
    ],
    obras: [],
    cuidados: [
      'Sócrates não escreveu obras: o que sabemos vem de Platão, de Xenofonte e de outros autores.',
      'Maiêutica é um método de perguntas, e não a transmissão de doutrinas prontas.',
    ],
    fontes: ['Platão. Apologia de Sócrates; Críton; Fédon.', FONTES_FILOSOFIA[0] ?? '', FONTES_FILOSOFIA[1] ?? ''],
  },
  {
    id: 'platao',
    nome: 'Platão',
    periodo: 'c. 428–348 a.C.',
    nascimento: -428,
    morte: -348,
    lugar: 'Atenas (Grécia antiga)',
    tradicao: 'idealismo antigo',
    epoca: 'Antiguidade',
    resumo: 'O mundo sensível é cópia imperfeita de um mundo de ideias eternas, que só a razão alcança; a cidade justa seria governada por filósofos.',
    ideia:
      'Discípulo de Sócrates, Platão fundou a Academia e escreveu diálogos. Para ele, o mundo que percebemos pelos sentidos muda o tempo todo e é apenas cópia de realidades eternas e imutáveis, as ideias (ou formas), que só a razão alcança. Conhecer é sair do mundo das aparências e ascender ao inteligível, como na alegoria da caverna. Na política, defende que a cidade justa é aquela em que cada classe cumpre sua função e que os mais sábios, os filósofos, deveriam governar. A alma teria três partes: razão, ânimo e desejo, e a justiça é a harmonia entre elas.',
    contexto: 'Escreve após a condenação de Sócrates e a derrota de Atenas na Guerra do Peloponeso, desconfiado da democracia ateniense e preocupado com a justiça na cidade.',
    conceitos: [
      { termo: 'mundo inteligível', sentido: 'Domínio das ideias eternas e imutáveis, acessível apenas à razão e mais real que o mundo sensível.' },
      { termo: 'alegoria da caverna', sentido: 'Imagem de prisioneiros que só veem sombras e que, ao sair, descobrem a realidade, como o caminho do conhecimento e da educação.' },
      { termo: 'reminiscência', sentido: 'Ideia de que conhecer é lembrar o que a alma já contemplou antes de nascer.' },
      { termo: 'filósofo-rei', sentido: 'Tese de que a cidade seria justa se governada por quem conhece o bem, os filósofos.' },
    ],
    afirmacoes: [
      { texto: 'Os objetos percebidos pelos sentidos são cópias imperfeitas de realidades eternas e inteligíveis, as ideias.' },
      { texto: 'As cidades seriam justas se fossem governadas por quem conhece o bem, os filósofos.' },
      { texto: 'Conhecer é um movimento que sai do mundo de aparências, as sombras, para contemplar a realidade verdadeira, e exige educação da alma.' },
      { texto: 'Aprender é lembrar: a alma já contemplou as ideias antes de nascer.' },
    ],
    obras: [{ titulo: 'Apologia de Sócrates' }, { titulo: 'Mênon' }, { titulo: 'Fédon' }, { titulo: 'O banquete' }, { titulo: 'A república' }, { titulo: 'Timeu' }],
    cuidados: [
      'Platão não nega que o mundo sensível exista: ele o considera menos real e menos confiável para o conhecimento verdadeiro.',
      'A caverna é uma alegoria sobre conhecimento e educação, e não uma teoria sobre cavernas reais.',
    ],
    fontes: ['Platão. A república.', FONTES_FILOSOFIA[0] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'aristoteles',
    nome: 'Aristóteles',
    periodo: '384–322 a.C.',
    nascimento: -384,
    morte: -322,
    lugar: 'Estagira, Atenas (Grécia antiga)',
    tradicao: 'filosofia antiga (realismo e lógica)',
    epoca: 'Antiguidade',
    resumo: 'O conhecimento parte das coisas concretas, e a vida boa é a atividade conforme a virtude, entendida como um meio-termo.',
    ideia:
      'Aristóteles estudou na Academia de Platão, mas discordou do mestre: as formas não existem separadas das coisas, estão nelas, e o conhecimento parte da observação do mundo concreto. Cada ser é composto de matéria e forma e pode ser explicado por causas. Criou a lógica, com o silogismo. Na ética, a felicidade (vida plena) é o fim da vida humana e se alcança vivendo conforme a virtude, que é um meio-termo entre o excesso e a falta, formada pelo hábito. Na política, o ser humano é naturalmente social, um animal político, e a cidade existe para a vida boa.',
    contexto: 'Vive no século IV a.C., foi preceptor de Alexandre, o Grande, e fundou o Liceu em Atenas; estudou a natureza, a lógica, a ética e a política.',
    conceitos: [
      { termo: 'silogismo', sentido: 'Forma de raciocínio em que, a partir de duas premissas, se tira uma conclusão necessária.' },
      { termo: 'meio-termo', sentido: 'Ideia de que a virtude é a ação adequada entre o excesso e a falta, e não uma média matemática.' },
      { termo: 'animal político', sentido: 'Expressão para dizer que o ser humano é naturalmente feito para viver em comunidade, na cidade.' },
      { termo: 'quatro causas', sentido: 'Maneira de explicar um ser por sua matéria, sua forma, o que o produz e a finalidade para que existe.' },
      { termo: 'eudaimonia', sentido: 'Felicidade entendida como vida plena, alcançada pela atividade conforme a virtude.' },
    ],
    afirmacoes: [
      { texto: 'O conhecimento começa pela observação das coisas concretas, e as formas estão nas próprias coisas, e não em um mundo separado.' },
      { texto: 'A virtude é uma ação adequada entre o excesso e a falta, e se forma pelo hábito.' },
      { texto: 'O ser humano é naturalmente feito para viver em comunidade: é um animal político.' },
      { texto: 'O fim da vida humana é a felicidade, vista como atividade conforme a virtude.' },
    ],
    obras: [{ titulo: 'Organon' }, { titulo: 'Metafísica' }, { titulo: 'Ética a Nicômaco' }, { titulo: 'Política' }, { titulo: 'Poética' }],
    cuidados: [
      'Meio-termo não é mediocridade nem média: é a ação adequada à situação, entre o excesso e a falta.',
      'Aristóteles foi discípulo de Platão, mas discordou dele em pontos centrais, como a separação entre ideias e coisas.',
    ],
    fontes: ['Aristóteles. Ética a Nicômaco; Política.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'maquiavel',
    nome: 'Nicolau Maquiavel',
    periodo: '1469–1527',
    nascimento: 1469,
    morte: 1527,
    lugar: 'Florença (Itália)',
    tradicao: 'pensamento político do Renascimento',
    epoca: 'Idade Moderna',
    resumo: 'A política deve ser analisada pela realidade efetiva, e o governante precisa de virtù para enfrentar a fortuna e conservar o Estado.',
    ideia:
      'Maquiavel, diplomata e pensador florentino, analisa a política como ela é, e não como deveria ser em um mundo ideal. Em O príncipe, mostra que quem governa precisa de virtù, a capacidade de agir conforme as circunstâncias, para enfrentar a fortuna, o acaso e as situações imprevistas. Para conquistar e manter o poder, às vezes é preciso usar a força e a astúcia, e o governante é julgado pelo resultado: a estabilidade do Estado. Nos Discursos, valoriza a república e as leis. Com isso, separa a análise da política das normas morais tradicionais.',
    contexto: 'Vive na Itália renascentista, dividida em cidades rivais e invadida por exércitos estrangeiros; atua no governo da República de Florença e depois é afastado do poder.',
    conceitos: [
      { termo: 'virtù', sentido: 'Capacidade, energia e habilidade do governante para agir conforme as circunstâncias e conquistar ou manter o Estado.' },
      { termo: 'fortuna', sentido: 'Acaso e circunstâncias imprevisíveis da vida política, que o governante precisa enfrentar.' },
      { termo: 'realismo político', sentido: 'Modo de analisar a política pela realidade efetiva dos fatos, e não por como as coisas deveriam ser.' },
    ],
    afirmacoes: [
      { texto: 'A política deve ser analisada pela realidade efetiva dos fatos, e não por como os governantes deveriam ser em um mundo ideal.' },
      { texto: 'O governante precisa de virtù, capacidade de agir conforme as circunstâncias, e enfrenta a fortuna, o acaso.' },
      { texto: 'Quem governa, às vezes, precisa agir contra os padrões morais comuns para conservar o Estado, e é julgado pelo resultado.' },
    ],
    obras: [{ titulo: 'O príncipe', ano: 'escrito em 1513, publicado em 1532' }, { titulo: 'Discursos sobre a primeira década de Tito Lívio' }, { titulo: 'A arte da guerra' }, { titulo: 'História de Florença' }],
    cuidados: [
      'Maquiavelismo, como agir de qualquer jeito, é uma simplificação popular: Maquiavel analisa o poder e valoriza a república nos Discursos.',
      'A máxima popular de que os fins justificam os meios resume mal o que ele escreveu.',
    ],
    fontes: ['Maquiavel, N. O príncipe.', FONTES_FILOSOFIA[0] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'descartes',
    nome: 'René Descartes',
    periodo: '1596–1650',
    nascimento: 1596,
    morte: 1650,
    lugar: 'França e Países Baixos',
    tradicao: 'racionalismo',
    epoca: 'Idade Moderna',
    resumo: 'A busca de uma certeza indubitável leva da dúvida metódica ao cogito: se penso, existo.',
    ideia:
      'Descartes procura um fundamento seguro para o conhecimento. Pela dúvida metódica, ele rejeita tudo o que pode ser posto em dúvida: os sentidos, que às vezes enganam, e até a realidade do mundo, como em um sonho. Só não pode duvidar de que duvida e pensa: se penso, existo, o cogito. A partir dessa certeza, reconstrói o conhecimento pela razão, seguindo um método com regras de evidência, análise e ordem. Distingue a mente (que pensa) e o corpo (que ocupa espaço): o dualismo. É o principal nome do racionalismo moderno.',
    contexto: 'Vive no início da Revolução Científica, quando a física e a matemática avançam e a autoridade da tradição escolástica é questionada.',
    conceitos: [
      { termo: 'dúvida metódica', sentido: 'Procedimento de duvidar de tudo que possa ser posto em dúvida, a fim de encontrar uma certeza indubitável.' },
      { termo: 'cogito', sentido: 'Primeira certeza: enquanto penso, existo, pois mesmo duvidando sei que há alguém que duvida.' },
      { termo: 'racionalismo', sentido: 'Corrente que vê a razão como fonte principal do conhecimento seguro.' },
      { termo: 'dualismo mente-corpo', sentido: 'Tese de que a mente (que pensa) e o corpo (que ocupa espaço) são substâncias distintas.' },
      { termo: 'ideias inatas', sentido: 'Ideias que o espírito possui desde o nascimento, independentemente da experiência.' },
    ],
    afirmacoes: [
      { texto: 'Para achar uma certeza, é preciso duvidar de tudo que pode ser duvidado, até chegar a algo indubitável.' },
      { texto: 'A existência do eu que pensa é a primeira verdade indubitável: se penso, existo.' },
      { texto: 'A mente e o corpo são substâncias distintas: uma pensa e o outro ocupa espaço.' },
      { texto: 'A razão, e não os sentidos, é a principal fonte de conhecimento seguro.', tambem: ['platao'] },
    ],
    obras: [{ titulo: 'Discurso do método', ano: '1637' }, { titulo: 'Meditações metafísicas', ano: '1641' }, { titulo: 'Princípios da filosofia', ano: '1644' }, { titulo: 'As paixões da alma', ano: '1649' }],
    cuidados: [
      'A dúvida cartesiana é um método para chegar à certeza, e não um ceticismo definitivo.',
      'O cogito afirma a existência do eu que pensa, e não, de imediato, a do corpo.',
    ],
    fontes: ['Descartes, R. Discurso do método; Meditações metafísicas.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'hobbes',
    nome: 'Thomas Hobbes',
    periodo: '1588–1679',
    nascimento: 1588,
    morte: 1679,
    lugar: 'Inglaterra',
    tradicao: 'contratualismo (soberano absoluto)',
    epoca: 'Idade Moderna',
    resumo: 'Sem um poder comum, haveria guerra de todos contra todos; por isso os indivíduos transferem seus direitos a um soberano forte.',
    ideia:
      'Hobbes parte da ideia de que, sem um poder comum que imponha ordem, os seres humanos viveriam em guerra de todos contra todos, com medo permanente da morte violenta. Esse estado de natureza é um argumento para justificar o Estado: para garantir a paz e a segurança, os indivíduos fazem um pacto e transferem seus direitos a um soberano com poder forte e indivisível. O Estado é, assim, uma construção artificial, o Leviatã, criada para proteger a vida. A autoridade, uma vez instituída, deve ser obedecida, e a resistência só se justificaria para preservar a própria vida.',
    contexto: 'Vive na Inglaterra do século XVII, marcada por guerras civis e por conflitos entre rei e Parlamento, o que o leva a valorizar a ordem e a segurança.',
    conceitos: [
      { termo: 'guerra de todos contra todos', sentido: 'Condição que existiria sem um poder comum: desconfiança, competição e medo constante da morte violenta.' },
      { termo: 'soberano absoluto', sentido: 'Autoridade com poder forte e indivisível, a quem os indivíduos transferem seus direitos para garantir a paz.' },
      { termo: 'Leviatã', sentido: 'Imagem do Estado como um grande ser artificial, criado por um pacto entre os indivíduos para proteger a vida.' },
    ],
    afirmacoes: [
      { texto: 'Sem um poder que imponha ordem, os homens vivem em guerra de todos contra todos, com medo permanente da morte violenta.' },
      { texto: 'Para garantir a paz, os indivíduos devem transferir seus direitos a um soberano com poder forte e indivisível.' },
      { texto: 'O Estado é uma construção artificial, criada por um pacto, para proteger a vida das pessoas.', tambem: ['locke', 'rousseau'] },
    ],
    obras: [{ titulo: 'Do cidadão', ano: '1642' }, { titulo: 'Leviatã', ano: '1651' }],
    cuidados: [
      'Hobbes é contratualista, mas defende um soberano de poder forte, diferentemente de Locke e de Rousseau.',
      'O estado de natureza é um argumento hipotético para justificar o Estado, e não uma descrição de um passado histórico.',
    ],
    fontes: ['Hobbes, T. Leviatã.', FONTES_FILOSOFIA[0] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'locke',
    nome: 'John Locke',
    periodo: '1632–1704',
    nascimento: 1632,
    morte: 1704,
    lugar: 'Inglaterra',
    tradicao: 'empirismo e liberalismo',
    epoca: 'Idade Moderna',
    resumo: 'O conhecimento vem da experiência, e o governo legítimo, criado por consentimento, deve proteger os direitos naturais.',
    ideia:
      'Locke é empirista: a mente, ao nascer, é como uma folha em branco, e as ideias vêm da experiência, por sensação e por reflexão; por isso critica a existência de ideias inatas. Na política, afirma que os indivíduos têm direitos naturais à vida, à liberdade e à propriedade, e que o governo é criado por consentimento para protegê-los. Se o governo viola esses direitos, o povo pode resistir e substituí-lo. Defende a divisão de poderes, o poder limitado e a tolerância religiosa, ideias centrais do liberalismo.',
    contexto: 'Escreve na Inglaterra do fim do século XVII, após conflitos entre a monarquia e o Parlamento e a Revolução Gloriosa, que limitou o poder do rei.',
    conceitos: [
      { termo: 'tabula rasa', sentido: 'Imagem da mente, ao nascer, como uma folha em branco, sem ideias inatas, que a experiência vai preenchendo.' },
      { termo: 'direitos naturais', sentido: 'Direitos à vida, à liberdade e à propriedade que cada pessoa teria antes de existir o governo e que ele deve proteger.' },
      { termo: 'governo por consentimento', sentido: 'Ideia de que o poder político só é legítimo se os governados o aceitam e se ele respeita os direitos naturais.' },
      { termo: 'direito de resistência', sentido: 'Possibilidade de o povo resistir e substituir um governo que viola os direitos naturais.' },
    ],
    afirmacoes: [
      { texto: 'As ideias vêm da experiência, e a mente, ao nascer, é como uma folha em branco, sem ideias inatas.', tambem: ['hume'] },
      { texto: 'Os indivíduos têm direitos naturais à vida, à liberdade e à propriedade, que o governo deve proteger.' },
      { texto: 'O governo legítimo depende do consentimento dos governados e pode ser substituído se violar os direitos naturais.' },
      { texto: 'O poder do Estado deve ser limitado e dividido, e a tolerância religiosa é necessária.' },
    ],
    obras: [{ titulo: 'Ensaio sobre o entendimento humano' }, { titulo: 'Dois tratados sobre o governo' }, { titulo: 'Carta sobre a tolerância', ano: '1689' }],
    cuidados: [
      'Locke é empirista, mas não cético como Hume.',
      'Locke também é contratualista, mas o contrato cria um governo limitado, oposto ao soberano absoluto de Hobbes.',
    ],
    fontes: ['Locke, J. Ensaio sobre o entendimento humano; Dois tratados sobre o governo.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[3] ?? ''],
  },
  {
    id: 'rousseau',
    nome: 'Jean-Jacques Rousseau',
    periodo: '1712–1778',
    nascimento: 1712,
    morte: 1778,
    lugar: 'Genebra e França',
    tradicao: 'Iluminismo e contratualismo (soberania popular)',
    epoca: 'Idade Moderna',
    resumo: 'A desigualdade vem da propriedade e das instituições, e o poder legítimo expressa a vontade geral do povo soberano.',
    ideia:
      'Rousseau, pensador do Iluminismo, argumenta que a desigualdade entre as pessoas não vem da natureza, mas da propriedade privada e das instituições sociais. No estado de natureza, o ser humano não seria mau; é a vida em sociedade, com vaidade, comparação e posse, que o corrompe. Para que as pessoas sejam livres vivendo em comunidade, o contrato social deve criar uma associação em que cada um obedece à vontade geral, o interesse comum, e assim obedece a si mesmo. A soberania pertence ao povo e não pode ser transferida a um governante.',
    contexto: 'Escreve no século XVIII, em plena França do Antigo Regime, com forte crítica às desigualdades e aos privilégios, e inspira ideias da Revolução Francesa.',
    conceitos: [
      { termo: 'vontade geral', sentido: 'Vontade do corpo político voltada ao interesse comum, diferente da soma dos interesses particulares.' },
      { termo: 'soberania popular', sentido: 'Princípio de que o poder pertence ao povo, que não pode transferi-lo a um governante.' },
      { termo: 'desigualdade moral ou política', sentido: 'Desigualdade criada por convenções sociais, como a propriedade e os privilégios, e não pela natureza.' },
    ],
    afirmacoes: [
      { texto: 'A desigualdade entre os homens não vem da natureza, mas da propriedade privada e das instituições sociais.' },
      { texto: 'As leis são legítimas quando expressam a vontade geral, o interesse comum dos cidadãos.' },
      { texto: 'A soberania pertence ao povo e não pode ser transferida a um governante.' },
      { texto: 'O ser humano, antes da sociedade, não é mau: é a vida social, com vaidade e posse, que o corrompe.' },
    ],
    obras: [{ titulo: 'Discurso sobre a origem e os fundamentos da desigualdade entre os homens', ano: '1755' }, { titulo: 'Do contrato social', ano: '1762' }, { titulo: 'Emílio', ano: '1762' }],
    cuidados: [
      'O argumento de Rousseau é sobre a natureza humana antes da sociedade; a expressão bom selvagem simplifica demais essa ideia.',
      'Vontade geral não é a soma das vontades individuais, nem a vontade da maioria: é a vontade voltada ao interesse comum.',
    ],
    fontes: ['Rousseau, J.-J. Do contrato social; Discurso sobre a origem da desigualdade.', FONTES_FILOSOFIA[0] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'hume',
    nome: 'David Hume',
    periodo: '1711–1776',
    nascimento: 1711,
    morte: 1776,
    lugar: 'Escócia',
    tradicao: 'empirismo cético',
    epoca: 'Idade Moderna',
    resumo: 'Todo conteúdo da mente vem da experiência, e a causalidade é um hábito de esperar o efeito, e não uma ligação necessária.',
    ideia:
      'Hume leva o empirismo às últimas consequências: todo conteúdo da mente vem de impressões, as sensações e os sentimentos, e de ideias, que são cópias mais fracas delas. Não percebemos uma ligação necessária entre causa e efeito, apenas eventos que se repetem juntos, e o hábito nos faz esperar o efeito: a causalidade é um hábito da mente. Por isso, não há justificativa racional definitiva para concluir, do passado, que o futuro será igual (o problema da indução). Na moral, defende que a razão sozinha não move a ação, e que os sentimentos têm papel central.',
    contexto: 'Escreve no Iluminismo escocês, em diálogo com o empirismo inglês e com a ciência de Newton, e aplica o método da experiência ao estudo da natureza humana.',
    conceitos: [
      { termo: 'impressões e ideias', sentido: 'Distinção entre as percepções vivas (sensações e sentimentos) e as ideias, cópias mais fracas das impressões.' },
      { termo: 'causalidade como hábito', sentido: 'Tese de que não vemos ligação necessária entre causa e efeito, e de que o costume de ver eventos juntos nos faz esperar o efeito.' },
      { termo: 'problema da indução', sentido: 'Dificuldade de justificar racionalmente a passagem de casos observados a conclusões gerais sobre o futuro.' },
      { termo: 'sentimento moral', sentido: 'Ideia de que os juízos morais se apoiam em sentimentos de aprovação e desaprovação, e não só na razão.' },
    ],
    afirmacoes: [
      { texto: 'Não percebemos nenhuma ligação necessária entre causa e efeito, apenas eventos que se repetem juntos, e o hábito nos faz esperar o efeito.' },
      { texto: 'Todas as ideias derivam de impressões da experiência: sem impressão correspondente, a ideia é vazia.', tambem: ['locke'] },
      { texto: 'O fato de o Sol ter nascido todos os dias não prova racionalmente que nascerá amanhã: é o hábito que nos leva a esperar isso.' },
      { texto: 'A razão sozinha não move a ação moral: os sentimentos têm papel central.' },
    ],
    obras: [{ titulo: 'Tratado da natureza humana', ano: '1739–1740' }, { titulo: 'Investigação sobre o entendimento humano', ano: '1748' }, { titulo: 'Investigação sobre os princípios da moral', ano: '1751' }],
    cuidados: [
      'Hume foi empirista como Locke, mas levou o empirismo a conclusões céticas.',
      'Ele não nega que a causalidade seja útil, e sim que seja demonstrável pela razão.',
    ],
    fontes: ['Hume, D. Investigação sobre o entendimento humano.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[3] ?? ''],
  },
  {
    id: 'kant',
    nome: 'Immanuel Kant',
    periodo: '1724–1804',
    nascimento: 1724,
    morte: 1804,
    lugar: 'Königsberg (Prússia)',
    tradicao: 'idealismo crítico (Iluminismo)',
    epoca: 'Idade Moderna',
    resumo: 'O conhecimento combina a experiência com formas do sujeito, e a moral exige agir por dever, segundo regras universais.',
    ideia:
      'Kant busca conciliar o racionalismo e o empirismo: todo conhecimento começa pela experiência, mas nem tudo vem dela, pois a mente tem formas próprias, como espaço, tempo e causalidade, que organizam o que percebemos. Assim, conhecemos os fenômenos, como aparecem para nós, e não as coisas em si mesmas. Na moral, o dever deve ser cumprido por si mesmo, e a regra é o imperativo categórico: agir de modo que a regra da ação possa valer para todos, e tratar as pessoas sempre como fins, e nunca apenas como meios. Defende o esclarecimento: sair da menoridade usando a própria razão.',
    contexto: 'Vive no Iluminismo alemão, época de avanços da ciência de Newton, de debate entre racionalistas e empiristas e de ideais de liberdade e de paz entre as nações.',
    conceitos: [
      { termo: 'revolução copernicana na filosofia', sentido: 'Mudança de perspectiva: em vez de a mente se regular pelos objetos, os objetos do conhecimento se regulam pelas formas da mente.' },
      { termo: 'fenômeno e coisa em si', sentido: 'Distinção entre as coisas como aparecem para nós e as coisas como seriam independentemente do nosso modo de conhecer.' },
      { termo: 'imperativo categórico', sentido: 'Regra moral incondicional: agir apenas segundo princípios que se possa querer que valham para todos.' },
      { termo: 'autonomia', sentido: 'Capacidade de a pessoa dar a si mesma a lei moral pela razão, e não receber ordens de fora.' },
      { termo: 'esclarecimento', sentido: 'Saída da menoridade: passar a usar o próprio entendimento sem a tutela de outros.' },
    ],
    afirmacoes: [
      { texto: 'O conhecimento exige experiência, mas também formas do sujeito, como espaço, tempo e causalidade, que organizam o que percebemos.' },
      { texto: 'A ação moral deve seguir uma regra que se possa querer que valha para todos, sem depender de desejos ou de consequências.' },
      { texto: 'As pessoas devem ser tratadas sempre como fins em si mesmas, e nunca apenas como meios.' },
      { texto: 'Esclarecimento é sair da menoridade, isto é, passar a usar o próprio entendimento sem a tutela de outros.' },
    ],
    obras: [{ titulo: 'Crítica da razão pura', ano: '1781' }, { titulo: 'Resposta à pergunta: o que é esclarecimento?', ano: '1784' }, { titulo: 'Fundamentação da metafísica dos costumes', ano: '1785' }, { titulo: 'Crítica da razão prática', ano: '1788' }, { titulo: 'A paz perpétua', ano: '1795' }],
    cuidados: [
      'Kant não é nem só racionalista nem só empirista: propõe uma síntese crítica.',
      'O imperativo categórico não é faça o que quiser: é um dever que vale para todos, sem depender de desejos.',
    ],
    fontes: ['Kant, I. Crítica da razão pura; Fundamentação da metafísica dos costumes.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'marx',
    nome: 'Karl Marx',
    periodo: '1818–1883',
    nascimento: 1818,
    morte: 1883,
    lugar: 'Alemanha, França e Inglaterra',
    tradicao: 'materialismo histórico-dialético',
    epoca: 'Contemporânea',
    resumo: 'As condições materiais de existência condicionam a consciência, e a filosofia deve contribuir para transformar o mundo.',
    ideia:
      'Marx, formado na filosofia alemã, critica o idealismo: não são as ideias que movem a história, mas as condições materiais em que as pessoas produzem a vida, e é a vida material que condiciona a consciência. O trabalho é a atividade pela qual o ser humano se produz, mas no capitalismo ele se torna alienado, pois o trabalhador não controla o que produz. A história é movida por contradições e conflitos entre classes. Para ele, a filosofia não deve apenas interpretar o mundo: deve contribuir para transformá-lo, unindo teoria e prática, a práxis.',
    contexto: 'Escreve no século XIX, na Europa da Revolução Industrial, em diálogo crítico com Hegel e com os economistas liberais, e participa de movimentos operários.',
    conceitos: [
      { termo: 'materialismo histórico', sentido: 'Ideia de que o modo de produzir a vida material condiciona a organização social, política e cultural de cada época.' },
      { termo: 'práxis', sentido: 'Unidade entre teoria e prática transformadora: pensar o mundo para mudá-lo.' },
      { termo: 'trabalho alienado', sentido: 'Trabalho em que a pessoa não controla o produto nem o processo e não se reconhece no que faz.' },
      { termo: 'dialética materialista', sentido: 'Modo de explicar a história por contradições reais da vida material, e não por ideias.' },
    ],
    afirmacoes: [
      { texto: 'Não é a consciência que determina a vida material: são as condições materiais de existência que condicionam a consciência.' },
      { texto: 'A filosofia não deve apenas interpretar o mundo: deve contribuir para transformá-lo, unindo teoria e prática.' },
      { texto: 'O trabalho é a atividade pela qual o ser humano se produz, mas no capitalismo ele se torna alienado.' },
    ],
    obras: [{ titulo: 'Manuscritos econômico-filosóficos', ano: '1844' }, { titulo: 'Teses sobre Feuerbach', ano: '1845' }, { titulo: 'A ideologia alemã', ano: 'escrita em 1845–1846, com Engels' }, { titulo: 'O capital', ano: '1867, livro I' }],
    cuidados: [
      'Marx não é só economista: sua obra é também uma crítica filosófica e política do capitalismo.',
      'Materialismo, em Marx, não é desejo de bens materiais: é a tese de que as condições materiais condicionam a consciência.',
    ],
    fontes: ['Marx, K. Manuscritos econômico-filosóficos; Teses sobre Feuerbach.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'nietzsche',
    nome: 'Friedrich Nietzsche',
    periodo: '1844–1900',
    nascimento: 1844,
    morte: 1900,
    lugar: 'Alemanha',
    tradicao: 'crítica da moral e da metafísica',
    epoca: 'Contemporânea',
    resumo: 'Os valores têm uma história e devem ser questionados; é preciso afirmar a vida e criar novos valores.',
    ideia:
      'Nietzsche critica a moral tradicional e o platonismo, que desvalorizam a vida terrena em nome de outro mundo. Propõe uma genealogia da moral: investigar a origem histórica dos valores, que nasceriam de relações de força e de ressentimento. Com a morte de Deus, isto é, a perda da crença cristã como fundamento dos valores, abre-se o risco do niilismo, a sensação de que nada tem valor, e a tarefa de criar novos valores. O além-do-homem seria quem afirma a vida, com seus sofrimentos, e cria valores próprios. Escreve em aforismos, com estilo provocador.',
    contexto: 'Escreve na Alemanha do fim do século XIX, época de avanço da ciência e de enfraquecimento da autoridade religiosa, o que ele interpreta como crise dos valores europeus.',
    conceitos: [
      { termo: 'genealogia da moral', sentido: 'Método de investigar a origem histórica dos valores morais para mostrar que eles são construídos, e não eternos.' },
      { termo: 'niilismo', sentido: 'Crise em que os valores supremos perdem o valor e parece que nada faz sentido.' },
      { termo: 'além-do-homem', sentido: 'Figura de quem afirma a vida e cria valores próprios, superando a moral herdada.' },
      { termo: 'vontade de potência', sentido: 'Ideia de que a vida tende a crescer e a afirmar-se, o que ele usa para interpretar valores e comportamentos.' },
      { termo: 'eterno retorno', sentido: 'Pensamento como teste: viveria a própria vida de novo, infinitas vezes, e a afirmaria?' },
    ],
    afirmacoes: [
      { texto: 'Os valores morais têm uma história, e devem ser investigados por sua origem: é a genealogia da moral.' },
      { texto: 'A perda da crença em um fundamento divino dos valores leva ao niilismo e exige que se criem novos valores.' },
      { texto: 'A moral que valoriza a renúncia e o além-mundo nega a vida: é preciso afirmar a vida, inclusive com seus sofrimentos.' },
      { texto: 'Viver de forma plena exige perguntar se se aceitaria repetir a própria vida infinitas vezes.' },
    ],
    obras: [{ titulo: 'O nascimento da tragédia', ano: '1872' }, { titulo: 'A gaia ciência', ano: '1882' }, { titulo: 'Assim falou Zaratustra', ano: '1883–1885' }, { titulo: 'Além do bem e do mal', ano: '1886' }, { titulo: 'Genealogia da moral', ano: '1887' }],
    cuidados: [
      'O além-do-homem não é um ideal racista: leituras desse tipo distorcem seus textos.',
      'Niilismo, em Nietzsche, é o diagnóstico de uma crise de valores, e não uma defesa de que nada importa.',
    ],
    fontes: ['Nietzsche, F. Genealogia da moral; Assim falou Zaratustra.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[3] ?? ''],
  },
  {
    id: 'sartre',
    nome: 'Jean-Paul Sartre',
    periodo: '1905–1980',
    nascimento: 1905,
    morte: 1980,
    lugar: 'França',
    tradicao: 'existencialismo',
    epoca: 'Contemporânea',
    resumo: 'A existência precede a essência: o ser humano se define pelas escolhas, é livre e responsável, e não pode escapar disso.',
    ideia:
      'Sartre defende que, no ser humano, a existência vem antes da essência: não há natureza humana prévia nem projeto divino; primeiro existimos e nos lançamos no mundo, e só depois nos definimos por nossas escolhas. Por isso somos radicalmente livres e responsáveis, sem desculpas, o que causa angústia. Quem se esconde atrás de justificativas, fingindo que não tinha escolha, age de má-fé. Ao escolher, escolhemos também uma imagem do ser humano, o que nos torna responsáveis perante todos. Sartre defende o engajamento político e dialoga com o marxismo.',
    contexto: 'Escreve na França da Segunda Guerra Mundial e do pós-guerra, época de crise de sentido e de engajamento político de muitos intelectuais.',
    conceitos: [
      { termo: 'existência precede a essência', sentido: 'Tese de que o ser humano primeiro existe e depois se define pelo que escolhe fazer, sem natureza humana prévia.' },
      { termo: 'má-fé', sentido: 'Atitude de negar a própria liberdade e responsabilidade, alegando que não havia escolha.' },
      { termo: 'angústia', sentido: 'Sentimento diante da liberdade e da responsabilidade de escolher sem garantias.' },
      { termo: 'engajamento', sentido: 'Compromisso com a ação e com a transformação do mundo, em vez de neutralidade.' },
    ],
    afirmacoes: [
      { texto: 'No ser humano, a existência vem antes da essência: nos definimos pelo que escolhemos fazer, sem natureza prévia.' },
      { texto: 'O ser humano não pode escapar de escolher: é livre e responsável por suas escolhas.' },
      { texto: 'Quem se desculpa dizendo que não tinha escolha age de má-fé, negando a própria liberdade.' },
      { texto: 'Ao escolher, escolho também uma imagem do que o ser humano deve ser, e isso me torna responsável perante todos.' },
    ],
    obras: [{ titulo: 'A náusea', ano: '1938' }, { titulo: 'O ser e o nada', ano: '1943' }, { titulo: 'Entre quatro paredes', ano: '1944' }, { titulo: 'O existencialismo é um humanismo', ano: '1946' }, { titulo: 'Crítica da razão dialética', ano: '1960' }],
    cuidados: [
      'Liberdade, em Sartre, não é ausência de condições: é a capacidade de dar sentido à situação e de responder a ela.',
      'O existencialismo não é pessimismo sem ação: Sartre defende o engajamento.',
    ],
    fontes: ['Sartre, J.-P. O existencialismo é um humanismo; O ser e o nada.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[2] ?? ''],
  },
  {
    id: 'arendt',
    nome: 'Hannah Arendt',
    periodo: '1906–1975',
    nascimento: 1906,
    morte: 1975,
    lugar: 'Alemanha e Estados Unidos',
    tradicao: 'filosofia política do século XX',
    epoca: 'Contemporânea',
    resumo: 'A ação política acontece entre pessoas diferentes no espaço público, e o mal pode ser praticado por pessoas comuns que deixam de pensar.',
    ideia:
      'Arendt, filósofa política de origem alemã e judaica, distingue três atividades da vida humana: o labor (ligado às necessidades vitais), o trabalho (fabricação de objetos duráveis) e a ação (iniciativa entre pessoas, em pluralidade, no espaço público), a atividade política por excelência. Estudou o totalitarismo (nazismo e stalinismo) como um regime novo, que usa terror e ideologia e destrói o espaço público e os laços entre as pessoas. Ao acompanhar o julgamento de Eichmann, formulou a ideia da banalidade do mal: atos monstruosos podem ser cometidos por pessoas comuns, que deixam de pensar e cumprem ordens e rotinas.',
    contexto: 'Foge do nazismo, vive nos Estados Unidos e escreve no pós-guerra, refletindo sobre o totalitarismo, a política e a responsabilidade.',
    conceitos: [
      { termo: 'ação política', sentido: 'Atividade em que pessoas diferentes agem e falam juntas no espaço público, iniciando algo novo.' },
      { termo: 'labor, trabalho e ação', sentido: 'Distinção entre as atividades ligadas às necessidades vitais, à fabricação de objetos duráveis e à iniciativa política entre as pessoas.' },
      { termo: 'totalitarismo', sentido: 'Regime novo, apoiado em terror e ideologia, que destrói o espaço público e isola as pessoas.' },
      { termo: 'banalidade do mal', sentido: 'Ideia de que o mal pode ser cometido por pessoas comuns, que deixam de pensar e se limitam a cumprir ordens e rotinas.' },
    ],
    afirmacoes: [
      { texto: 'A atividade política por excelência é a ação: iniciativa conjunta de pessoas diferentes em um espaço público.' },
      { texto: 'O mal pode ser praticado por pessoas comuns que deixam de pensar e apenas cumprem ordens e rotinas.' },
      { texto: 'O totalitarismo é um regime novo, que usa terror e ideologia e destrói o espaço público e os laços entre as pessoas.' },
      { texto: 'As atividades humanas se distinguem em labor, trabalho e ação.' },
    ],
    obras: [{ titulo: 'As origens do totalitarismo', ano: '1951' }, { titulo: 'A condição humana', ano: '1958' }, { titulo: 'Entre o passado e o futuro', ano: '1961' }, { titulo: 'Eichmann em Jerusalém', ano: '1963' }, { titulo: 'Sobre a revolução', ano: '1963' }],
    cuidados: [
      'Banalidade do mal não significa que o mal seja pouco grave: significa que ele não precisa de monstros, e sim da ausência de pensamento.',
      'Arendt não se encaixa como marxista nem como liberal clássica: tem um pensamento político próprio.',
    ],
    fontes: ['Arendt, H. A condição humana; Eichmann em Jerusalém.', FONTES_FILOSOFIA[1] ?? '', FONTES_FILOSOFIA[3] ?? ''],
  },
]

/* ------------------------------------------------------------------ influências */

export type TipoAresta = 'mestre e discípulo' | 'crítica' | 'herança' | 'diálogo' | 'contraste'

export interface Aresta {
  /** quem influenciou, foi criticado ou inspirou */
  de: string
  /** quem recebeu a influência ou fez a crítica */
  para: string
  tipo: TipoAresta
  /** explicação em palavras próprias */
  explicacao: string
}

export const ARESTAS: Aresta[] = [
  { de: 'socrates', para: 'platao', tipo: 'mestre e discípulo', explicacao: 'Platão foi discípulo de Sócrates e fez dele personagem de vários diálogos: grande parte do que se conhece de Sócrates vem desses textos.' },
  { de: 'platao', para: 'aristoteles', tipo: 'mestre e discípulo', explicacao: 'Aristóteles estudou na Academia de Platão por cerca de vinte anos, mas criticou a separação entre o mundo das ideias e o das coisas.' },
  { de: 'platao', para: 'nietzsche', tipo: 'crítica', explicacao: 'Nietzsche criticou o platonismo, que desvaloriza o mundo sensível em nome de um mundo ideal, e a moral que veio dele.' },
  { de: 'descartes', para: 'locke', tipo: 'crítica', explicacao: 'Locke criticou a tese racionalista das ideias inatas, da qual Descartes é figura central, e defendeu que o conhecimento vem da experiência.' },
  { de: 'locke', para: 'hume', tipo: 'herança', explicacao: 'Hume parte do empirismo de Locke, segundo o qual o conhecimento vem da experiência, e o leva a conclusões mais céticas.' },
  { de: 'hume', para: 'kant', tipo: 'diálogo', explicacao: 'Kant reconheceu que a crítica de Hume à ideia de causalidade o fez rever suas certezas e desenvolver a filosofia crítica.' },
  { de: 'descartes', para: 'kant', tipo: 'diálogo', explicacao: 'Kant retoma do racionalismo o papel ativo da razão, mas limita o que ela pode conhecer sem a experiência.' },
  { de: 'hobbes', para: 'rousseau', tipo: 'crítica', explicacao: 'Rousseau discordou da imagem que Hobbes fez do estado de natureza como guerra de todos e propôs outra origem para a desigualdade e para o poder.' },
  { de: 'maquiavel', para: 'rousseau', tipo: 'diálogo', explicacao: 'Rousseau comentou O príncipe e o leu como um livro que, ao descrever o poder dos governantes, revela aos povos como são dominados.' },
  { de: 'rousseau', para: 'kant', tipo: 'herança', explicacao: 'Kant admirava Rousseau, e a ideia de liberdade como obedecer a uma lei dada por si mesmo ecoa na autonomia kantiana.' },
  { de: 'descartes', para: 'sartre', tipo: 'diálogo', explicacao: 'Sartre toma o ponto de partida da consciência individual, que lembra o cogito, como base do existencialismo, mas lhe dá outro rumo.' },
  { de: 'marx', para: 'sartre', tipo: 'diálogo', explicacao: 'Sartre tentou combinar existencialismo e marxismo, na Crítica da razão dialética.' },
  { de: 'marx', para: 'arendt', tipo: 'crítica', explicacao: 'Arendt discute e critica a concepção de trabalho de Marx em A condição humana.' },
  { de: 'aristoteles', para: 'arendt', tipo: 'herança', explicacao: 'Arendt retoma a distinção grega entre a vida privada e a vida na cidade, e a política como espaço de ação entre pessoas livres.' },
  { de: 'kant', para: 'arendt', tipo: 'diálogo', explicacao: 'Arendt dialoga com Kant em suas reflexões sobre o juízo e a capacidade de pensar.' },
  { de: 'hobbes', para: 'locke', tipo: 'contraste', explicacao: 'Os dois são contratualistas, mas chegam a conclusões opostas: Hobbes defende um soberano de poder forte; Locke, um governo limitado pelos direitos naturais.' },
]

/* ------------------------------------------------------------------ debates (para o laboratório) */

export interface Debate {
  id: string
  titulo: string
  pergunta: string
  /** posição de cada pensador, em palavras próprias */
  posicoes: { autor: string; resposta: string }[]
}

export const DEBATES: Debate[] = [
  {
    id: 'poder',
    titulo: 'De onde vem o poder político?',
    pergunta: 'Como seria a vida sem Estado e o que torna legítimo o poder?',
    posicoes: [
      { autor: 'hobbes', resposta: 'Sem Estado haveria guerra de todos contra todos. O poder legítimo nasce de um pacto em que todos transferem seus direitos a um soberano forte, que garante a paz.' },
      { autor: 'locke', resposta: 'Já existem direitos naturais (vida, liberdade, propriedade), mas faltaria um juiz comum. O governo nasce do consentimento para protegê-los e pode ser substituído se os violar.' },
      { autor: 'rousseau', resposta: 'A desigualdade e a opressão vêm da propriedade e das instituições. O poder legítimo expressa a vontade geral do povo, que é o soberano e não pode transferir sua soberania.' },
    ],
  },
  {
    id: 'conhecimento',
    titulo: 'De onde vem o conhecimento?',
    pergunta: 'A razão ou a experiência é a principal fonte do conhecimento?',
    posicoes: [
      { autor: 'descartes', resposta: 'A razão: duvidando de tudo, chega-se ao cogito e dele se reconstrói o saber, com ideias inatas e método.' },
      { autor: 'locke', resposta: 'A experiência: a mente é como uma folha em branco, e as ideias vêm da sensação e da reflexão.' },
      { autor: 'hume', resposta: 'A experiência, mas com limites: a causalidade é um hábito, e a razão sozinha não prova que o futuro será igual ao passado.' },
      { autor: 'kant', resposta: 'Os dois: o conhecimento começa pela experiência, mas é organizado por formas da própria mente, como espaço, tempo e causalidade.' },
    ],
  },
  {
    id: 'etica',
    titulo: 'Como agir bem?',
    pergunta: 'O que orienta a ação moral?',
    posicoes: [
      { autor: 'aristoteles', resposta: 'Viver conforme a virtude, que é o meio-termo entre o excesso e a falta, formada pelo hábito, em busca de uma vida plena.' },
      { autor: 'kant', resposta: 'Agir por dever, segundo uma regra que se possa querer que valha para todos, tratando as pessoas como fins, e não só como meios.' },
      { autor: 'nietzsche', resposta: 'Questionar a origem da moral tradicional e criar novos valores que afirmem a vida, em vez de negá-la.' },
      { autor: 'sartre', resposta: 'Não há natureza humana nem valores prontos: cada um se define pelo que escolhe e responde por essas escolhas diante de todos.' },
    ],
  },
  {
    id: 'realidade',
    titulo: 'O que é real e como conhecê-lo?',
    pergunta: 'Onde estão as ideias e as formas das coisas?',
    posicoes: [
      { autor: 'socrates', resposta: 'Pelo diálogo e pela pergunta, busca-se o que cada virtude é, e a certeza aparente cai quando examinada.' },
      { autor: 'platao', resposta: 'As ideias eternas existem em um mundo inteligível, e as coisas sensíveis são cópias imperfeitas delas.' },
      { autor: 'aristoteles', resposta: 'As formas estão nas próprias coisas: o conhecimento parte da observação do mundo concreto.' },
    ],
  },
  {
    id: 'politica',
    titulo: 'O que é fazer política?',
    pergunta: 'Qual é o sentido e o método da política?',
    posicoes: [
      { autor: 'platao', resposta: 'A cidade justa é governada por quem conhece o bem, os filósofos, e cada classe cumpre sua função.' },
      { autor: 'aristoteles', resposta: 'O ser humano é um animal político, e a cidade existe para a vida boa; os regimes são julgados pelo bem comum.' },
      { autor: 'maquiavel', resposta: 'A política deve ser analisada pela realidade efetiva: o governante precisa de virtù para enfrentar a fortuna e conservar o Estado.' },
      { autor: 'arendt', resposta: 'A política é ação conjunta de pessoas diferentes no espaço público, capaz de iniciar algo novo; o totalitarismo a destrói.' },
    ],
  },
]

/* ------------------------------------------------------------------ banco de perguntas (debates) */

export const BANCO_DEBATES: ItemBanco[] = [
  {
    pergunta: 'Qual é a diferença central entre racionalismo e empirismo?',
    certa: { texto: 'Para o racionalismo (Descartes), a razão é a fonte principal do conhecimento seguro; para o empirismo (Locke, Hume), o conhecimento vem da experiência.', porque: 'É a divergência clássica da filosofia moderna: razão e ideias inatas de um lado, experiência e sentidos do outro.' },
    erradas: [
      { texto: 'O racionalismo defende a experiência, e o empirismo, a razão.', porque: 'Está invertido: o empirismo valoriza a experiência, e o racionalismo, a razão.', motivo: 'inverteu as correntes' },
      { texto: 'Os dois afirmam que o conhecimento vem de ideias inatas.', porque: 'Locke e Hume rejeitam as ideias inatas, ao contrário do racionalismo.', motivo: 'ignorou a crítica empirista às ideias inatas' },
      { texto: 'Ambos negam que possamos conhecer qualquer coisa.', porque: 'Nenhuma das duas correntes nega totalmente o conhecimento; Hume tem um ceticismo moderado.', motivo: 'confundiu com ceticismo radical' },
    ],
    licao: 'Racionalismo: razão e ideias inatas (Descartes). Empirismo: experiência (Locke, Hume). Kant tenta conciliá-los.',
    dicas: ['Racionalismo vem de razão; empirismo vem de experiência.', 'Quem defende a mente como folha em branco?', 'Descartes parte da dúvida e do cogito.'],
  },
  {
    pergunta: 'Qual é a crítica de Hume à noção de causalidade?',
    certa: { texto: 'Não percebemos ligação necessária entre causa e efeito, apenas eventos que se repetem juntos; a causalidade é um hábito de esperar o efeito.', porque: 'Hume mostra que a experiência nos dá sucessão regular, mas não a conexão necessária que a razão presumia.' },
    erradas: [
      { texto: 'A causalidade é uma ideia inata, presente em todas as mentes.', porque: 'Hume é empirista e rejeita ideias inatas; para ele, a ideia nasce do hábito.', motivo: 'atribuiu a Hume uma tese racionalista' },
      { texto: 'A causalidade é provada pela razão de modo definitivo.', porque: 'Hume afirma que a razão não demonstra essa ligação necessária.', motivo: 'inverteu a posição de Hume' },
      { texto: 'Causas e efeitos não existem, e o mundo não segue regularidades.', porque: 'Hume não nega as regularidades; nega que se possa provar racionalmente a ligação necessária.', motivo: 'exagerou a crítica de Hume' },
    ],
    licao: 'Hume: a causalidade é um hábito da mente diante de eventos que se repetem, e não uma ligação necessária demonstrável.',
    dicas: ['O que a experiência nos mostra: ligação necessária ou sucessão regular?', 'O Sol nascer todos os dias prova que nascerá amanhã?', 'Pense em hábito.'],
  },
  {
    pergunta: 'Como Kant tenta conciliar racionalismo e empirismo?',
    certa: { texto: 'O conhecimento começa pela experiência, mas é organizado por formas próprias da mente, como espaço, tempo e causalidade.', porque: 'Kant mostra que a experiência fornece o material e a mente fornece as formas que o organizam.' },
    erradas: [
      { texto: 'Ele aceita as ideias inatas de Descartes e rejeita qualquer papel da experiência.', porque: 'Kant não dispensa a experiência: ela é a matéria do conhecimento.', motivo: 'ignorou o papel da experiência' },
      { texto: 'Ele aceita a tese de que a mente é folha em branco e rejeita qualquer forma da mente.', porque: 'Kant afirma que a mente tem formas próprias, ao contrário da folha em branco de Locke.', motivo: 'atribuiu a Kant a tese empirista' },
      { texto: 'Ele conclui que não é possível conhecer nada.', porque: 'Kant limita o conhecimento aos fenômenos, mas não nega que haja conhecimento.', motivo: 'confundiu com ceticismo' },
    ],
    licao: 'Kant: a experiência fornece o material, e as formas da mente (espaço, tempo, categorias) o organizam; conhecemos fenômenos.',
    dicas: ['Todo conhecimento começa pela experiência, mas nem tudo vem dela.', 'A mente tem formas próprias.', 'É uma síntese crítica.'],
  },
  {
    pergunta: 'Qual é a diferença central entre a ética de Aristóteles e a de Kant?',
    certa: { texto: 'Aristóteles liga a ética à virtude e à felicidade como vida plena; Kant a liga ao dever e a uma regra universal, independente de desejos.', porque: 'Uma é uma ética das virtudes (formação do caráter); a outra, uma ética do dever (regra universal).' },
    erradas: [
      { texto: 'Aristóteles fala em imperativo categórico, e Kant, em meio-termo.', porque: 'Está invertido: o meio-termo é de Aristóteles e o imperativo categórico, de Kant.', motivo: 'trocou os conceitos de cada autor' },
      { texto: 'Os dois defendem que a moral depende só dos desejos de cada um.', porque: 'Nenhum deles reduz a moral a desejos: um fala de virtude; o outro, de dever.', motivo: 'ignorou o fundamento da moral' },
      { texto: 'Ambos negam que exista qualquer valor moral.', porque: 'Os dois defendem um fundamento para a moral; quem critica a moral tradicional é Nietzsche.', motivo: 'confundiu com a crítica de Nietzsche' },
    ],
    licao: 'Aristóteles: virtude, meio-termo e felicidade. Kant: dever, imperativo categórico e autonomia.',
    dicas: ['Meio-termo é de Aristóteles.', 'Imperativo categórico é de Kant.', 'Uma ética é do caráter; a outra, do dever.'],
  },
  {
    pergunta: 'Em que Platão e Aristóteles discordam sobre as ideias (ou formas)?',
    certa: { texto: 'Para Platão, as ideias existem em um mundo separado e eterno; para Aristóteles, as formas estão nas próprias coisas.', porque: 'Aristóteles critica a separação do mundo das ideias e valoriza a observação das coisas concretas.' },
    erradas: [
      { texto: 'Platão nega as ideias, e Aristóteles as defende em um mundo separado.', porque: 'Está invertido: quem defende um mundo separado de ideias é Platão.', motivo: 'inverteu as posições' },
      { texto: 'Os dois afirmam que só existe o mundo sensível.', porque: 'Platão defende o mundo inteligível; Aristóteles, as formas nas coisas, e nenhum é um materialista simples.', motivo: 'atribuiu aos dois uma tese que nenhum sustenta' },
      { texto: 'Não há discordância: eles defendem exatamente a mesma teoria.', porque: 'Aristóteles foi discípulo de Platão, mas criticou a separação entre ideias e coisas.', motivo: 'ignorou a crítica de Aristóteles' },
    ],
    licao: 'Platão: ideias em um mundo à parte. Aristóteles: formas nas coisas, conhecimento a partir da observação.',
    dicas: ['Aristóteles foi discípulo de Platão, mas discordou dele.', 'Onde estão as formas: em um mundo à parte ou nas coisas?', 'Pense na caverna.'],
  },
  {
    pergunta: 'Em que Hobbes e Rousseau divergem sobre a origem do poder e da desigualdade?',
    certa: { texto: 'Hobbes vê, sem Estado, uma guerra de todos contra todos e defende um soberano forte; Rousseau vê a desigualdade nascer da propriedade e das instituições e defende a soberania do povo.', porque: 'Os dois são contratualistas, mas com imagens opostas da natureza humana e do poder legítimo.' },
    erradas: [
      { texto: 'Hobbes defende a soberania popular, e Rousseau, o soberano absoluto.', porque: 'Está invertido: Hobbes defende o soberano absoluto e Rousseau, a soberania popular.', motivo: 'trocou as posições dos autores' },
      { texto: 'Ambos acreditam que o ser humano é naturalmente bom e que não precisa de leis.', porque: 'Hobbes vê o estado de natureza como violento e inseguro.', motivo: 'atribuiu a Hobbes a visão de Rousseau' },
      { texto: 'Nenhum dos dois fala em contrato social.', porque: 'Os dois são contratualistas, embora com ideias diferentes de contrato.', motivo: 'ignorou que são contratualistas' },
    ],
    licao: 'Hobbes: soberano absoluto para evitar a guerra de todos. Rousseau: vontade geral e soberania do povo; a desigualdade vem das instituições.',
    dicas: ['Quem fala em guerra de todos contra todos?', 'Quem fala em vontade geral?', 'Contratualistas não concordam sobre o poder.'],
  },
  {
    pergunta: 'Qual é a novidade da análise política de Maquiavel?',
    certa: { texto: 'Analisar o poder pela realidade efetiva, separando a política das normas morais tradicionais e pensando no resultado e na conservação do Estado.', porque: 'É o realismo político: Maquiavel descreve como o poder funciona, e não como deveria ser.' },
    erradas: [
      { texto: 'Afirmar que o governante deve seguir sempre os preceitos morais cristãos.', porque: 'A novidade é justamente separar a análise política dessa moral.', motivo: 'inverteu a posição de Maquiavel' },
      { texto: 'Defender que a política deve ser governada por filósofos.', porque: 'Essa é a ideia de Platão do filósofo-rei.', motivo: 'confundiu com a posição de Platão' },
      { texto: 'Negar qualquer papel das circunstâncias e do acaso.', porque: 'Para Maquiavel, o governante precisa enfrentar a fortuna, isto é, o acaso e as circunstâncias.', motivo: 'ignorou o conceito de fortuna' },
    ],
    licao: 'Maquiavel: realismo político, com virtù e fortuna; a análise do poder se separa da moral tradicional.',
    dicas: ['Realismo vem de realidade efetiva.', 'Virtù e fortuna.', 'Pense em O príncipe.'],
  },
]

/* ------------------------------------------------------------------ Entenda e resumo */

export const PASSOS_FILOSOFIA: PassoHumanas[] = [
  {
    titulo: 'O que a filosofia faz',
    texto: [
      'A filosofia nasce na Grécia antiga como um modo de perguntar e de argumentar: o que é a justiça, o que é conhecer, como devemos viver? Em vez de aceitar respostas prontas, ela examina as razões, constrói conceitos e discute com outras posições.',
      'Para estudar para a prova, vale ler cada pensador por três perguntas: qual é o problema que ele quer resolver, qual é a tese e quais são os conceitos-chave. Neste tema, você vê 14 pensadores em ordem cronológica, as influências entre eles e os principais debates.',
    ],
    pare: {
      pergunta: 'O que diferencia uma pergunta filosófica de um simples palpite?',
      opcoes: ['Ela exige apenas uma opinião', 'Ela busca razões, conceitos e argumentos', 'Ela dispensa o diálogo'],
      certa: 1,
      explicacao: 'A filosofia busca razões e argumentos, e examina conceitos, em diálogo com outras posições.',
    },
    autores: [],
  },
  {
    titulo: 'Antiguidade: Sócrates, Platão e Aristóteles',
    texto: [
      'Sócrates pergunta pelo que são a virtude e a justiça e ajuda os interlocutores a examinar suas crenças. Platão, seu discípulo, distingue o mundo sensível e o das ideias eternas, e imagina uma cidade justa governada por filósofos. Aristóteles, discípulo de Platão, discorda: as formas estão nas coisas, e o conhecimento parte da observação.',
      'Na ética, Aristóteles liga a felicidade à virtude, vista como um meio-termo, e na política afirma que o ser humano é um animal político. Esses três formam a base da tradição filosófica ocidental.',
    ],
    pare: {
      pergunta: 'Qual pensador defendia que a cidade seria justa se governada por filósofos?',
      opcoes: ['Aristóteles', 'Platão', 'Sócrates'],
      certa: 1,
      explicacao: 'É a ideia do filósofo-rei, de Platão, na República.',
    },
    autores: ['socrates', 'platao', 'aristoteles'],
  },
  {
    titulo: 'Política moderna: Maquiavel, Hobbes, Locke e Rousseau',
    texto: [
      'Maquiavel analisa o poder como ele é, com os conceitos de virtù e fortuna. Hobbes, Locke e Rousseau são contratualistas: explicam o Estado como resultado de um pacto, mas discordam sobre ele. Hobbes defende um soberano forte para evitar a guerra de todos contra todos; Locke, um governo limitado que proteja os direitos naturais e dependa do consentimento; Rousseau, a soberania do povo, guiada pela vontade geral.',
      'Um truque para a prova: associe palavra-chave e autor: Leviatã e soberano absoluto, Hobbes; direitos naturais e consentimento, Locke; vontade geral e soberania popular, Rousseau.',
    ],
    pare: {
      pergunta: 'Qual contratualista defende a soberania do povo guiada pela vontade geral?',
      opcoes: ['Hobbes', 'Locke', 'Rousseau'],
      certa: 2,
      explicacao: 'Vontade geral e soberania popular são ideias centrais de Rousseau.',
    },
    autores: ['maquiavel', 'hobbes', 'locke', 'rousseau'],
  },
  {
    titulo: 'Conhecimento moderno: Descartes, Hume e Kant',
    texto: [
      'Descartes, racionalista, duvida de tudo para encontrar uma certeza: o cogito. Locke e Hume, empiristas, afirmam que o conhecimento vem da experiência; Hume mostra que a causalidade é um hábito, e não uma ligação necessária. Kant concilia as duas correntes: o conhecimento começa pela experiência, mas é organizado por formas da mente.',
      'Na moral, Kant defende o dever e o imperativo categórico: agir segundo uma regra que se possa querer que valha para todos, tratando as pessoas como fins.',
    ],
    pare: {
      pergunta: 'Qual pensador afirma que o conhecimento é organizado por formas da mente, como espaço, tempo e causalidade?',
      opcoes: ['Hume', 'Kant', 'Locke'],
      certa: 1,
      explicacao: 'É a tese de Kant, que concilia racionalismo e empirismo.',
    },
    autores: ['descartes', 'hume', 'kant'],
  },
  {
    titulo: 'Crítica da modernidade: Marx e Nietzsche',
    texto: [
      'Marx critica o idealismo: as condições materiais de produção condicionam a consciência, o trabalho no capitalismo é alienado, e a filosofia deve contribuir para transformar o mundo. Nietzsche critica a moral tradicional e o platonismo, investiga a origem dos valores (genealogia da moral) e fala da morte de Deus e do niilismo, que exigem criar novos valores.',
      'Os dois desconfiam de ideias que se apresentam como eternas, e perguntam a que interesses ou forças elas servem.',
    ],
    pare: {
      pergunta: 'Qual pensador propõe uma genealogia da moral?',
      opcoes: ['Marx', 'Nietzsche', 'Kant'],
      certa: 1,
      explicacao: 'A genealogia da moral é um método de Nietzsche, que investiga a origem histórica dos valores.',
    },
    autores: ['marx', 'nietzsche'],
  },
  {
    titulo: 'Século XX: Sartre e Arendt',
    texto: [
      'Para Sartre, a existência precede a essência: somos livres e responsáveis, e quem se desculpa dizendo que não tinha escolha age de má-fé. Hannah Arendt distingue labor, trabalho e ação, e vê na ação política entre pessoas diferentes a atividade mais livre; estudou o totalitarismo e formulou a ideia da banalidade do mal.',
      'Os dois pensam depois das grandes guerras e do totalitarismo: um pergunta pela liberdade individual e pela responsabilidade; a outra, pelo espaço público e pela capacidade de pensar.',
    ],
    pare: {
      pergunta: 'Qual conceito de Arendt diz que o mal pode ser praticado por pessoas comuns que deixam de pensar?',
      opcoes: ['Má-fé', 'Banalidade do mal', 'Vontade geral'],
      certa: 1,
      explicacao: 'A banalidade do mal é um conceito de Arendt. Má-fé é de Sartre, e vontade geral é de Rousseau.',
    },
    autores: ['sartre', 'arendt'],
  },
  {
    titulo: 'Como ler um texto filosófico na prova',
    texto: [
      'Textos de prova costumam apresentar um trecho curto e pedir que você reconheça a tese, o conceito ou o autor. Faça três perguntas ao trecho: qual é o problema (o que se discute?), qual é a tese (o que se afirma?) e quais são os conceitos (que palavras sustentam o argumento?).',
      'Depois, compare com os debates deste tema: razão ou experiência (Descartes, Locke, Hume, Kant); poder e contrato (Hobbes, Locke, Rousseau); virtude ou dever (Aristóteles e Kant). Lembre-se de que as questões costumam parafrasear: o que vale é a ideia, não a frase exata.',
    ],
    pare: {
      pergunta: 'Qual é a melhor primeira pergunta ao ler um trecho filosófico?',
      opcoes: ['Quantas palavras tem o trecho?', 'Qual é o problema que o trecho discute?', 'Em que ano foi impresso?'],
      certa: 1,
      explicacao: 'Identificar o problema e a tese orienta a leitura e ajuda a reconhecer o autor e os conceitos.',
    },
    autores: [],
  },
]

export const RESUMO_FILOSOFIA: SecaoResumo[] = [
  {
    titulo: 'Antiguidade',
    formulas: [],
    ideias: [
      'Sócrates: diálogo, ironia e maiêutica; examinar a vida; sem obra escrita.',
      'Platão: mundo sensível e mundo inteligível; caverna; filósofo-rei; A república.',
      'Aristóteles: formas nas coisas; lógica e silogismo; virtude como meio-termo; animal político; Ética a Nicômaco.',
    ],
    pegadinhas: ['Atribuir obras a Sócrates: ele não escreveu.', 'Achar que Aristóteles concorda com Platão sobre as ideias.', 'Confundir meio-termo com mediocridade.'],
    fontes: FONTES_FILOSOFIA,
  },
  {
    titulo: 'Política e conhecimento na Idade Moderna',
    formulas: [],
    ideias: [
      'Maquiavel: realismo político, virtù e fortuna.',
      'Hobbes: estado de natureza como guerra de todos, soberano absoluto. Locke: direitos naturais e governo por consentimento. Rousseau: vontade geral e soberania popular.',
      'Descartes: dúvida metódica e cogito (racionalismo). Locke e Hume: empirismo. Hume: causalidade como hábito. Kant: síntese crítica e imperativo categórico.',
    ],
    pegadinhas: ['Confundir os contratualistas: soberano forte (Hobbes) e governo limitado (Locke).', 'Achar que Descartes é cético: a dúvida é um método.', 'Achar que o imperativo categórico depende de desejos.'],
    fontes: FONTES_FILOSOFIA,
  },
  {
    titulo: 'Séculos XIX e XX',
    formulas: [],
    ideias: [
      'Marx: materialismo histórico, alienação, práxis.',
      'Nietzsche: genealogia da moral, morte de Deus, niilismo, além-do-homem.',
      'Sartre: existência precede a essência, liberdade, má-fé. Arendt: labor, trabalho e ação, totalitarismo, banalidade do mal.',
    ],
    pegadinhas: ['Achar que Nietzsche defende o niilismo.', 'Achar que banalidade do mal significa mal sem gravidade.', 'Confundir má-fé (Sartre) com mentira simples.'],
    fontes: FONTES_FILOSOFIA,
  },
]
