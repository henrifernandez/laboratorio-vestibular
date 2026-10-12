import type { Autor, PassoHumanas } from '../humanas'
import type { SecaoResumo } from '../tipos'

export const FONTES_SOCIOLOGIA = [
  'Quintaneiro, T.; Barbosa, M. L. de O.; Oliveira, M. G. M. de. Um toque de clássicos: Marx, Durkheim e Weber. Belo Horizonte: UFMG.',
  'Martins, C. B. O que é sociologia. São Paulo: Brasiliense (Coleção Primeiros Passos).',
  'Cohn, G. (org.). Max Weber: sociologia. São Paulo: Ática (Coleção Grandes Cientistas Sociais).',
  'Giddens, A. Sociologia. Porto Alegre: Penso.',
]

/** Autores da Sociologia: as três lentes clássicas e três autores do século XX e XXI. */
export const AUTORES_SOCIOLOGIA: Autor[] = [
  {
    id: 'durkheim',
    nome: 'Émile Durkheim',
    periodo: '1858–1917',
    nascimento: 1858,
    morte: 1917,
    lugar: 'França',
    tradicao: 'sociologia positivista e funcionalista',
    resumo: 'A sociedade é uma realidade própria, com regras que se impõem aos indivíduos, e deve ser estudada de forma objetiva.',
    ideia:
      'Para Durkheim, a vida em grupo cria maneiras de agir, pensar e sentir que existem fora de cada pessoa e se impõem a ela: os fatos sociais. A sociologia deve tratá-los como coisas, observando-os com objetividade e buscando causas sociais para eles, como faz ao estudar o suicídio. O que mantém as pessoas unidas muda com a divisão do trabalho: em sociedades simples, a semelhança (solidariedade mecânica); em sociedades complexas, a interdependência entre funções diferentes (solidariedade orgânica). Quando as normas se enfraquecem diante de mudanças rápidas, surge a anomia.',
    contexto: 'Escreve na França do fim do século XIX, em meio à industrialização e a uma preocupação com a coesão social. É um dos fundadores da sociologia como disciplina acadêmica.',
    conceitos: [
      { termo: 'fato social', sentido: 'Maneira coletiva de agir, pensar e sentir que é geral na sociedade, exterior ao indivíduo e exerce pressão sobre ele.' },
      { termo: 'solidariedade mecânica', sentido: 'Laço social baseado na semelhança entre as pessoas, com forte consciência coletiva; típico de sociedades simples e tradicionais.' },
      { termo: 'solidariedade orgânica', sentido: 'Laço social baseado na interdependência entre funções diferentes, resultado da divisão do trabalho; típico de sociedades complexas.' },
      { termo: 'anomia', sentido: 'Situação de enfraquecimento ou ausência de normas que orientem a conduta, em geral por mudanças sociais muito rápidas.' },
      { termo: 'consciência coletiva', sentido: 'Conjunto de crenças e sentimentos comuns aos membros de uma sociedade, que reforça sua unidade.' },
    ],
    afirmacoes: [
      { texto: 'Os fenômenos sociais devem ser tratados como coisas, observados de fora, com objetividade, e explicados por causas sociais.' },
      { texto: 'Existem maneiras de agir, pensar e sentir que estão fora do indivíduo e se impõem a ele pela pressão do grupo: são os fatos sociais.' },
      { texto: 'Nas sociedades modernas, o que une as pessoas é a interdependência entre funções diferentes, resultado da divisão do trabalho.' },
      { texto: 'Quando as regras que orientam a conduta se enfraquecem por mudanças muito rápidas, as pessoas perdem referências e cresce o risco de desajuste social, que pode chegar ao suicídio.' },
      { texto: 'As taxas de suicídio de um grupo variam conforme o grau de integração e de regulação da vida social, e não apenas por problemas individuais.' },
    ],
    obras: [
      { titulo: 'Da divisão do trabalho social', ano: '1893' },
      { titulo: 'As regras do método sociológico', ano: '1895' },
      { titulo: 'O suicídio', ano: '1897' },
      { titulo: 'As formas elementares da vida religiosa', ano: '1912' },
    ],
    cuidados: [
      'Fato social não é qualquer coisa que acontece na sociedade: é o que é geral, exterior ao indivíduo e exerce coerção sobre ele.',
      'Solidariedade orgânica não é mais afetiva que a mecânica: vem da interdependência entre funções, como a de órgãos de um organismo, e não da semelhança.',
    ],
    fontes: ['Durkheim, É. As regras do método sociológico.', 'Durkheim, É. Da divisão do trabalho social.', ...FONTES_SOCIOLOGIA.slice(0, 2)],
  },
  {
    id: 'weber',
    nome: 'Max Weber',
    periodo: '1864–1920',
    nascimento: 1864,
    morte: 1920,
    lugar: 'Alemanha',
    tradicao: 'sociologia compreensiva',
    resumo: 'A sociologia deve compreender o sentido que as pessoas dão às suas ações e explicar os efeitos dessas ações na sociedade.',
    ideia:
      'Weber propõe uma sociologia compreensiva: entender o sentido que as pessoas atribuem ao que fazem. Chama de ação social a conduta orientada por esse sentido e dirigida a outras pessoas, e a classifica em quatro tipos: racional com relação a fins, racional com relação a valores, afetiva e tradicional. Usa tipos ideais, modelos construídos pelo pesquisador, para comparar com a realidade. Analisa a racionalização crescente da vida moderna, com a burocracia, e três formas de dominação legítima: tradicional, carismática e racional-legal. Também estuda como valores religiosos se relacionam com o capitalismo moderno.',
    contexto: 'Escreve na Alemanha entre o fim do século XIX e o início do XX, época de rápida industrialização e burocratização do Estado e das empresas.',
    conceitos: [
      { termo: 'ação social', sentido: 'Conduta a que o agente dá um sentido e que se orienta pelo comportamento de outras pessoas.' },
      { termo: 'tipo ideal', sentido: 'Modelo construído pelo pesquisador, que acentua traços da realidade para permitir a comparação; não é um retrato fiel nem um ideal desejável.' },
      { termo: 'dominação carismática', sentido: 'Autoridade aceita por causa das qualidades extraordinárias atribuídas a um líder.' },
      { termo: 'dominação racional-legal', sentido: 'Autoridade aceita porque se baseia em regras impessoais e em leis, como a burocracia.' },
      { termo: 'desencantamento do mundo', sentido: 'Processo de racionalização em que o cálculo e a explicação técnica ocupam o lugar de explicações mágicas ou religiosas.' },
    ],
    afirmacoes: [
      { texto: 'A tarefa da sociologia é compreender o sentido que as pessoas atribuem às suas ações e, a partir disso, explicar seus efeitos.' },
      { texto: 'A ação social pode ser orientada por fins calculados, por valores, por emoções ou por costumes.' },
      { texto: 'Há três formas de autoridade aceita como legítima: a da tradição, a do carisma de um líder e a das regras legais impessoais.' },
      { texto: 'Os modelos construídos pelo pesquisador, que destacam certos traços da realidade para permitir comparações, são tipos ideais, e não retratos fiéis.' },
      { texto: 'A vida moderna é marcada pela racionalização crescente, com burocracia e cálculo, e por um desencantamento do mundo.' },
      { texto: 'Valores religiosos, como os do protestantismo ascético, tiveram afinidade com o espírito do capitalismo moderno.' },
    ],
    obras: [
      { titulo: 'A ética protestante e o espírito do capitalismo', ano: '1904–1905' },
      { titulo: 'Economia e sociedade', ano: '1922, póstumo' },
      { titulo: 'A ciência como vocação' },
      { titulo: 'A política como vocação' },
    ],
    cuidados: [
      'Tipo ideal não significa algo perfeito ou desejável: é um modelo para comparar com a realidade.',
      'Weber não explica o capitalismo apenas pela religião: mostra uma afinidade entre certos valores e certos comportamentos econômicos.',
    ],
    fontes: ['Weber, M. A ética protestante e o espírito do capitalismo.', 'Weber, M. Economia e sociedade.', FONTES_SOCIOLOGIA[2] ?? '', FONTES_SOCIOLOGIA[0] ?? ''],
  },
  {
    id: 'marx',
    nome: 'Karl Marx',
    periodo: '1818–1883',
    nascimento: 1818,
    morte: 1883,
    lugar: 'Alemanha, França e Inglaterra',
    tradicao: 'materialismo histórico',
    resumo: 'A forma como a sociedade organiza a produção determina muito da vida social, e a história é marcada pela luta entre classes.',
    ideia:
      'Para Marx, o modo como uma sociedade produz seus bens (o modo de produção) condiciona sua vida política, jurídica e cultural. No capitalismo, duas classes principais se opõem: a burguesia, dona dos meios de produção, e o proletariado, que vende sua força de trabalho. A mais-valia, parte do valor produzido pelo trabalhador que fica com o capitalista, é a origem do lucro. O trabalho assalariado produz alienação: o trabalhador não controla nem se reconhece no que produz. As ideias dominantes tendem a refletir os interesses da classe dominante, o que Marx chama de ideologia.',
    contexto: 'Escreve no século XIX, durante a Revolução Industrial, quando surgem as grandes fábricas, o proletariado urbano e os primeiros movimentos operários.',
    conceitos: [
      { termo: 'luta de classes', sentido: 'Conflito entre grupos sociais com interesses opostos na produção, que Marx vê como motor da história.' },
      { termo: 'mais-valia', sentido: 'Parte do valor criado pelo trabalhador que não é paga como salário e fica com o capitalista, sendo a origem do lucro.' },
      { termo: 'alienação', sentido: 'Situação em que o trabalhador não controla o que produz, não se reconhece no produto nem no processo de trabalho.' },
      { termo: 'ideologia', sentido: 'Conjunto de ideias que expressam os interesses da classe dominante e fazem a ordem social parecer natural.' },
      { termo: 'meios de produção', sentido: 'Terras, máquinas, fábricas e outros recursos usados para produzir; quem os detém forma a classe dominante.' },
    ],
    afirmacoes: [
      { texto: 'A história das sociedades é marcada pela luta entre classes sociais com interesses opostos.' },
      { texto: 'O lucro do capitalista vem da parte do valor criado pelo trabalhador que não é paga como salário.' },
      { texto: 'O trabalhador assalariado se estranha em relação ao produto do seu trabalho, ao processo de produzir e aos outros: está alienado.' },
      { texto: 'A base econômica, formada pelas relações de produção, condiciona as instituições políticas, jurídicas e as ideias dominantes de uma época.' },
      { texto: 'As ideias dominantes de uma época tendem a ser as da classe que domina a produção material.' },
    ],
    obras: [
      { titulo: 'Manifesto do Partido Comunista', ano: '1848, com Engels' },
      { titulo: 'Contribuição à crítica da economia política', ano: '1859' },
      { titulo: 'O capital', ano: '1867, livro I' },
      { titulo: 'A ideologia alemã', ano: 'escrita em 1845–1846, com Engels' },
    ],
    cuidados: [
      'Mais-valia não é sinônimo de lucro: é a parte do trabalho não paga que dá origem ao lucro.',
      'Marx analisa o capitalismo e seus conflitos; não se limita a defender a igualdade como ideia moral.',
    ],
    fontes: ['Marx, K.; Engels, F. Manifesto do Partido Comunista.', 'Marx, K. O capital, livro I.', ...FONTES_SOCIOLOGIA.slice(0, 2)],
  },
  {
    id: 'adorno-horkheimer',
    nome: 'Adorno e Horkheimer',
    periodo: 'Theodor Adorno (1903–1969) e Max Horkheimer (1895–1973)',
    nascimento: 1895,
    morte: 1973,
    lugar: 'Alemanha e Estados Unidos',
    tradicao: 'teoria crítica (Escola de Frankfurt)',
    resumo: 'A cultura produzida em série como mercadoria padroniza gostos e favorece o conformismo: é a indústria cultural.',
    ideia:
      'Adorno e Horkheimer, da Escola de Frankfurt, criticam a cultura de massa na sociedade capitalista industrial. A indústria cultural produz filmes, músicas e programas em série, como mercadorias padronizadas, que moldam gostos e desejos e estimulam o conformismo, em vez de provocar o pensamento crítico. No livro Dialética do esclarecimento, afirmam que o projeto de libertar o ser humano pela razão, o esclarecimento, acabou servindo à dominação da natureza e das pessoas, quando a razão se reduz a calcular meios para fins, a razão instrumental.',
    contexto: 'Escrevem durante a Segunda Guerra Mundial, no exílio nos Estados Unidos, depois da ascensão do nazismo, e refletem sobre os rumos da razão e da cultura.',
    conceitos: [
      { termo: 'indústria cultural', sentido: 'Produção de bens culturais em série, padronizados e voltados ao lucro, que molda gostos e enfraquece o pensamento crítico.' },
      { termo: 'razão instrumental', sentido: 'Razão voltada a calcular os melhores meios para atingir fins, sem questionar se os fins são bons.' },
      { termo: 'esclarecimento', sentido: 'Projeto de libertar as pessoas pelo saber e pela razão, que os autores veem se voltar em dominação.' },
      { termo: 'teoria crítica', sentido: 'Forma de pensar a sociedade que a analisa para criticá-la e transformá-la, e não só para descrevê-la.' },
    ],
    afirmacoes: [
      { texto: 'A cultura produzida em série, como mercadoria, padroniza gostos e favorece o conformismo.' },
      { texto: 'Quando a razão se reduz ao cálculo de meios para atingir fins, ela passa a servir à dominação.' },
      { texto: 'O projeto de libertar o ser humano pelo saber acabou se voltando em dominação da natureza e das pessoas.' },
    ],
    obras: [{ titulo: 'Dialética do esclarecimento', ano: '1947' }],
    cuidados: [
      'A crítica é à produção de cultura em série, voltada ao lucro, e não a todo tipo de cultura popular.',
      'Teoria crítica não significa apenas “falar mal”: é analisar a sociedade para transformá-la.',
    ],
    fontes: ['Adorno, T.; Horkheimer, M. Dialética do esclarecimento.', FONTES_SOCIOLOGIA[3] ?? ''],
  },
  {
    id: 'bourdieu',
    nome: 'Pierre Bourdieu',
    periodo: '1930–2002',
    nascimento: 1930,
    morte: 2002,
    lugar: 'França',
    tradicao: 'sociologia da cultura e da educação',
    resumo: 'As desigualdades se reproduzem também por capitais culturais e simbólicos, e a escola favorece quem já chega com esse capital.',
    ideia:
      'Bourdieu mostra que a posição social não depende só do dinheiro: há também o capital cultural (conhecimentos, gostos, diplomas), o social (redes de relações) e o simbólico (prestígio). O habitus é o conjunto de disposições que cada pessoa incorpora ao longo da vida, de acordo com sua origem social, e que orienta suas escolhas e seus gostos. A escola, que parece neutra, tende a valorizar a cultura das classes dominantes e, assim, reproduz desigualdades. As preferências culturais funcionam como distinção entre grupos, e a violência simbólica faz valores dominantes parecerem naturais.',
    contexto: 'Estuda a sociedade francesa na segunda metade do século XX, em um período de expansão do ensino, e questiona a ideia de que a escola oferece oportunidades iguais.',
    conceitos: [
      { termo: 'capital cultural', sentido: 'Conjunto de conhecimentos, hábitos, gostos e diplomas valorizados socialmente, transmitidos sobretudo pela família e pela escola.' },
      { termo: 'habitus', sentido: 'Conjunto de disposições duráveis incorporadas ao longo da vida, conforme a posição social, que orienta o jeito de pensar, sentir e agir.' },
      { termo: 'violência simbólica', sentido: 'Imposição de valores e significados dominantes de modo que pareçam naturais e legítimos, com a cumplicidade de quem os sofre.' },
      { termo: 'campo', sentido: 'Espaço social com regras próprias e disputa por poder e prestígio, como o mundo da escola ou o da arte.' },
    ],
    afirmacoes: [
      { texto: 'A escola, apesar de parecer neutra, favorece quem já chega com bagagem cultural herdada da família.' },
      { texto: 'Os gostos e comportamentos incorporados ao longo da vida, conforme a posição social, orientam as escolhas das pessoas.' },
      { texto: 'A imposição de valores dominantes de modo que pareçam naturais, com a cumplicidade de quem os sofre, mantém a dominação.' },
      { texto: 'O capital não é só econômico: há também o cultural, o social e o simbólico.' },
    ],
    obras: [
      { titulo: 'Os herdeiros', ano: '1964, com Passeron' },
      { titulo: 'A reprodução', ano: '1970, com Passeron' },
      { titulo: 'A distinção: crítica social do julgamento', ano: '1979' },
      { titulo: 'O poder simbólico', ano: '1989' },
    ],
    cuidados: [
      'Habitus não é sinônimo de hábito: é um sistema de disposições incorporadas e duráveis.',
      'Capital cultural não é só “ter estudo”: inclui familiaridade com a cultura valorizada pela escola e pela sociedade.',
    ],
    fontes: ['Bourdieu, P.; Passeron, J.-C. A reprodução.', 'Bourdieu, P. A distinção.', FONTES_SOCIOLOGIA[3] ?? ''],
  },
  {
    id: 'bauman',
    nome: 'Zygmunt Bauman',
    periodo: '1925–2017',
    nascimento: 1925,
    morte: 2017,
    lugar: 'Polônia e Reino Unido',
    tradicao: 'sociologia da modernidade e da pós-modernidade',
    resumo: 'Na modernidade líquida, as relações, o trabalho e as identidades perderam solidez e se tornaram flexíveis e provisórios.',
    ideia:
      'Bauman descreve a sociedade contemporânea como uma modernidade líquida: instituições, vínculos e identidades já não têm formas estáveis e duradouras, como na modernidade sólida. Isso traz liberdade e escolha, mas também insegurança, medo e relações frágeis, fáceis de desfazer. O consumo ocupa um lugar central na vida social: os desejos se renovam depressa, e as pessoas são incentivadas a trocar produtos, empregos e até relações. A estabilidade de compromissos de longo prazo perde espaço.',
    contexto: 'Escreve a partir do fim do século XX, em um mundo globalizado, com mercados de trabalho flexíveis, consumo de massa e tecnologias de comunicação.',
    conceitos: [
      { termo: 'modernidade líquida', sentido: 'Condição da sociedade contemporânea, em que instituições, vínculos e identidades são fluidos, provisórios e mudam depressa.' },
      { termo: 'modernidade sólida', sentido: 'Fase anterior, de instituições estáveis e compromissos duradouros, que a modernidade líquida teria substituído.' },
      { termo: 'consumismo', sentido: 'Organização da vida em torno do consumo e da renovação de desejos, que valoriza o novo e o descartável.' },
      { termo: 'amor líquido', sentido: 'Ideia de que os laços afetivos tendem a ser frágeis e fáceis de romper em uma sociedade de relações provisórias.' },
    ],
    afirmacoes: [
      { texto: 'As relações, o trabalho e as identidades tornaram-se flexíveis, provisórios e fáceis de desfazer, como um líquido que não mantém forma.' },
      { texto: 'Os vínculos afetivos tendem a ser frágeis e descartáveis em uma sociedade guiada pelo consumo.' },
      { texto: 'A estabilidade das instituições e dos compromissos de longo prazo deu lugar a uma sociedade fluida e insegura.' },
    ],
    obras: [
      { titulo: 'Globalização: as consequências humanas', ano: '1998' },
      { titulo: 'Modernidade líquida', ano: '2000' },
      { titulo: 'Amor líquido', ano: '2003' },
      { titulo: 'Vida para consumo', ano: '2007' },
    ],
    cuidados: [
      'Líquido não é sinônimo de ruim: descreve a ausência de forma fixa.',
      'Bauman não diz que o passado era perfeito: compara formas de vida em épocas diferentes.',
    ],
    fontes: ['Bauman, Z. Modernidade líquida.', 'Bauman, Z. Vida para consumo.', FONTES_SOCIOLOGIA[3] ?? ''],
  },
]

/* ------------------------------------------------------------------ mesma situação, lentes diferentes */

export interface Situacao {
  id: string
  titulo: string
  descricao: string
  /** leitura (ilustrativa) de cada autor; o id é o do autor */
  leituras: { autor: string; texto: string }[]
}

export const NOTA_LEITURAS = 'As leituras abaixo são ilustrativas: mostram como a lente de cada autor poderia ser aplicada. Não são afirmações do autor sobre este caso.'

export const SITUACOES: Situacao[] = [
  {
    id: 'automacao',
    titulo: 'Automação e demissões',
    descricao: 'Uma fábrica automatiza a produção e demite metade dos trabalhadores.',
    leituras: [
      { autor: 'durkheim', texto: 'Olharia para a regulação: mudanças rápidas na divisão do trabalho podem enfraquecer as normas que orientam a conduta e deixar as pessoas sem referências, uma situação de anomia, a menos que novas regras e instituições restabeleçam a solidariedade entre as funções.' },
      { autor: 'weber', texto: 'Destacaria a racionalização: a empresa escolheu os meios mais eficientes para atingir um fim (uma ação social racional com relação a fins), e é preciso compreender o sentido que os trabalhadores dão à perda do emprego, às suas escolhas e aos seus valores.' },
      { autor: 'marx', texto: 'Veria um conflito entre quem detém os meios de produção e quem vende sua força de trabalho: a máquina aumenta o lucro do capitalista e cria desempregados que pressionam os salários, o que aprofunda a exploração e a alienação.' },
      { autor: 'bauman', texto: 'Falaria de insegurança: empregos instáveis e descartáveis, típicos da modernidade líquida, em que as pessoas precisam se reinventar sem a proteção de vínculos duradouros.' },
    ],
  },
  {
    id: 'greve-aplicativo',
    titulo: 'Greve de entregadores de aplicativos',
    descricao: 'Entregadores de aplicativos fazem uma greve por melhores pagamentos.',
    leituras: [
      { autor: 'marx', texto: 'Enxergaria uma luta entre classes: trabalhadores que só têm a força de trabalho se organizam contra empresas que se apropriam de parte do valor que eles produzem (mais-valia), e a greve é um passo da consciência de classe.' },
      { autor: 'durkheim', texto: 'Perguntaria que normas regulam essa nova forma de trabalho: sem regras claras e sem laços de solidariedade entre as funções, a divisão do trabalho gera conflito, e a greve revela a falta de regulação.' },
      { autor: 'weber', texto: 'Analisaria as ações com seus sentidos: os trabalhadores agem por fins econômicos e por valores de justiça, enquanto a empresa exerce uma autoridade racional-legal, baseada em contratos e regras do aplicativo.' },
      { autor: 'bauman', texto: 'Falaria de trabalho flexível e provisório: sem vínculos estáveis, os entregadores enfrentam a insegurança típica da modernidade líquida, e a greve responde à fragilidade desses vínculos.' },
    ],
  },
  {
    id: 'cidade-pequena',
    titulo: 'Cidade pequena e shopping',
    descricao: 'Uma cidade pequena, onde todos se conhecem, ganha um grande shopping e muitas redes sociais; os moradores se encontram menos na praça.',
    leituras: [
      { autor: 'durkheim', texto: 'Falaria da passagem de laços baseados na semelhança e na convivência (solidariedade mecânica) para laços de interdependência entre funções diferentes (solidariedade orgânica), com risco de enfraquecer as normas comuns.' },
      { autor: 'bauman', texto: 'Diria que os espaços de consumo e as redes oferecem vínculos rápidos e fáceis de desfazer, típicos da modernidade líquida, com identidades e relações mais provisórias.' },
      { autor: 'adorno-horkheimer', texto: 'Perguntaria se o lazer organizado pelo consumo e pelas plataformas é um caso de indústria cultural: produtos culturais feitos em série, que padronizam gostos e substituem a convivência.' },
      { autor: 'weber', texto: 'Olharia para a racionalização: grandes empreendimentos e plataformas trazem uma organização cada vez mais impessoal da vida, e é preciso compreender o sentido que os moradores dão às novas formas de ação social, como consumir ou conversar pela rede.' },
    ],
  },
  {
    id: 'banda-fabricada',
    titulo: 'Banda fabricada',
    descricao: 'Uma gravadora forma uma banda para vender discos, com músicas parecidas com as do sucesso do momento.',
    leituras: [
      { autor: 'adorno-horkheimer', texto: 'Veriam a indústria cultural: bens culturais produzidos em série e padronizados para vender, que moldam gostos e estimulam o conformismo em vez do pensamento crítico.' },
      { autor: 'bourdieu', texto: 'Perguntaria quem gosta do quê e por quê: os gostos musicais se ligam ao capital cultural e à posição social, e servem para marcar distinção entre grupos.' },
      { autor: 'marx', texto: 'Falaria da mercadoria: a música é produzida para ser vendida, e a gravadora se apropria do trabalho dos músicos, enquanto o consumo esconde essas relações de produção.' },
      { autor: 'bauman', texto: 'Falaria de consumismo: a música vira produto descartável, trocado rápido por novidades, em uma vida organizada em torno do consumo.' },
    ],
  },
  {
    id: 'vestibular',
    titulo: 'Desempenho nos vestibulares',
    descricao: 'Estudantes de famílias com muitos livros em casa tendem a ter melhor desempenho nos vestibulares.',
    leituras: [
      { autor: 'bourdieu', texto: 'Falaria de capital cultural e de habitus: a escola, que parece neutra, valoriza a cultura das famílias que já a possuem e, assim, reproduz desigualdades.' },
      { autor: 'durkheim', texto: 'Destacaria que a educação é um fato social: a escola transmite normas e valores da sociedade às novas gerações, e é preciso observar quais condições a sociedade oferece a cada grupo.' },
      { autor: 'weber', texto: 'Olharia para as credenciais: diplomas e exames impessoais, típicos da dominação racional-legal e da burocracia, dão acesso a posições e prestígio, e é preciso compreender o sentido que as pessoas atribuem ao estudo e ao diploma.' },
      { autor: 'marx', texto: 'Perguntaria como a divisão de classes aparece no acesso ao ensino: quem tem mais recursos compra melhores condições de estudo, e a ideologia da meritocracia faz a diferença parecer resultado só do esforço individual.' },
    ],
  },
  {
    id: 'lider-carismatico',
    titulo: 'Líder carismático',
    descricao: 'Um líder político cativa multidões por sua personalidade e é seguido mesmo sem ocupar cargo formal.',
    leituras: [
      { autor: 'weber', texto: 'Veria dominação carismática: obediência baseada na crença nas qualidades extraordinárias do líder, e não na tradição nem em regras legais.' },
      { autor: 'durkheim', texto: 'Ligaria o caso às reuniões coletivas em que os participantes sentem uma forte emoção comum e reforçam a consciência coletiva e os laços do grupo, a chamada efervescência coletiva.' },
      { autor: 'marx', texto: 'Perguntaria a que interesses de classe o discurso do líder serve e como as ideias que ele difunde se relacionam com a ideologia da classe dominante.' },
      { autor: 'bauman', texto: 'Diria que, na modernidade líquida, movimentos e lideranças surgem e se dissolvem depressa, com adesões mais provisórias e movidas por identificação momentânea.' },
    ],
  },
]

/* ------------------------------------------------------------------ classificar exemplos */

export interface CategoriaTipo {
  id: string
  nome: string
  /** grupo de categorias que se comparam entre si */
  grupo: string
  definicao: string
}

export interface ExemploTipo {
  texto: string
  categoria: string
  /** por que o exemplo pertence à categoria */
  razao: string
}

export const CATEGORIAS: CategoriaTipo[] = [
  { id: 'fins', nome: 'Ação racional com relação a fins', grupo: 'weber-acao', definicao: 'a pessoa calcula os meios mais adequados para atingir um objetivo' },
  { id: 'valores', nome: 'Ação racional com relação a valores', grupo: 'weber-acao', definicao: 'a pessoa age por convicção em um valor (ético, religioso, estético), independentemente do resultado' },
  { id: 'afetiva', nome: 'Ação afetiva', grupo: 'weber-acao', definicao: 'a ação é guiada por emoções e estados de ânimo do momento' },
  { id: 'tradicional', nome: 'Ação tradicional', grupo: 'weber-acao', definicao: 'a ação segue costumes e hábitos arraigados, sem reflexão' },
  { id: 'dom-tradicional', nome: 'Dominação tradicional', grupo: 'weber-dominacao', definicao: 'a obediência se apoia na crença na santidade de tradições antigas' },
  { id: 'dom-carismatica', nome: 'Dominação carismática', grupo: 'weber-dominacao', definicao: 'a obediência se apoia na crença nas qualidades extraordinárias de um líder' },
  { id: 'dom-legal', nome: 'Dominação racional-legal', grupo: 'weber-dominacao', definicao: 'a obediência se apoia em regras impessoais e em leis, como na burocracia' },
  { id: 'mecanica', nome: 'Solidariedade mecânica', grupo: 'durkheim', definicao: 'a coesão vem da semelhança entre as pessoas e de crenças fortemente comuns' },
  { id: 'organica', nome: 'Solidariedade orgânica', grupo: 'durkheim', definicao: 'a coesão vem da interdependência entre funções diferentes, na divisão do trabalho' },
  { id: 'mais-valia', nome: 'Mais-valia', grupo: 'marx', definicao: 'parte do valor criado pelo trabalhador que fica com o capitalista' },
  { id: 'alienacao', nome: 'Alienação', grupo: 'marx', definicao: 'o trabalhador não controla nem se reconhece no que produz' },
  { id: 'ideologia', nome: 'Ideologia', grupo: 'marx', definicao: 'ideias que expressam interesses da classe dominante e fazem a ordem parecer natural' },
  { id: 'burguesia', nome: 'Burguesia', grupo: 'marx-classes', definicao: 'classe que detém os meios de produção' },
  { id: 'proletariado', nome: 'Proletariado', grupo: 'marx-classes', definicao: 'classe que vive da venda da força de trabalho' },
]

export const EXEMPLOS: ExemploTipo[] = [
  { texto: 'Uma empresária compara os custos de três fornecedores e escolhe o mais barato para aumentar o lucro.', categoria: 'fins', razao: 'ela calcula meios (comparar custos) para atingir um fim (lucro).' },
  { texto: 'Um engenheiro escolhe a rota de menor custo para uma obra, depois de simular várias alternativas.', categoria: 'fins', razao: 'ele avalia os meios e escolhe o mais adequado ao objetivo.' },
  { texto: 'Uma médica recusa um procedimento que contraria suas convicções éticas, mesmo sabendo que pode perder o emprego.', categoria: 'valores', razao: 'ela age por fidelidade a um valor, sem calcular o resultado.' },
  { texto: 'Um grupo de voluntários arrisca o conforto para abrigar refugiados, por acreditar que é um dever de humanidade.', categoria: 'valores', razao: 'o motivo é a convicção em um valor, e não o ganho ou o resultado.' },
  { texto: 'Um torcedor, tomado pela raiva, grita com o árbitro depois de um gol anulado.', categoria: 'afetiva', razao: 'a conduta é movida pela emoção do momento.' },
  { texto: 'Uma pessoa, dominada pela alegria, abraça desconhecidos ao saber que passou no vestibular.', categoria: 'afetiva', razao: 'a ação é impulsionada por um estado emocional, sem cálculo.' },
  { texto: 'Uma família se reúne todo domingo para o mesmo almoço, porque sempre foi assim.', categoria: 'tradicional', razao: 'a ação segue um costume arraigado, sem reflexão sobre fins ou valores.' },
  { texto: 'Um pescador faz o mesmo ritual antes de sair ao mar, como seus avós faziam.', categoria: 'tradicional', razao: 'a conduta repete um hábito herdado.' },
  { texto: 'O chefe de uma comunidade governa porque seus antepassados sempre governaram, e todos aceitam assim.', categoria: 'dom-tradicional', razao: 'a obediência se apoia em uma tradição antiga.' },
  { texto: 'Um rei é obedecido porque pertence a uma linhagem que, segundo os costumes, sempre mandou no reino.', categoria: 'dom-tradicional', razao: 'a legitimidade vem do costume e da linhagem.' },
  { texto: 'Milhares de pessoas seguem um líder religioso porque acreditam que ele tem dons extraordinários.', categoria: 'dom-carismatica', razao: 'a obediência vem da crença nas qualidades excepcionais do líder.' },
  { texto: 'Um general é seguido pelas tropas por sua coragem lendária, mesmo contra ordens formais de seus superiores.', categoria: 'dom-carismatica', razao: 'a autoridade se apoia no prestígio pessoal, e não em regras ou na tradição.' },
  { texto: 'Um servidor público cumpre uma ordem porque ela está prevista em lei e no regulamento do seu cargo.', categoria: 'dom-legal', razao: 'a obediência se apoia em regras impessoais e em competências definidas.' },
  { texto: 'Em uma prefeitura, cada setor tem funções definidas por normas, e os cargos são ocupados por concurso.', categoria: 'dom-legal', razao: 'a organização se baseia em regras impessoais e em hierarquia formal: burocracia.' },
  { texto: 'Em uma aldeia onde todos plantam, comem e celebram os mesmos rituais, quem foge às regras é duramente reprovado pela comunidade.', categoria: 'mecanica', razao: 'a coesão vem da semelhança e de crenças muito comuns.' },
  { texto: 'Em uma comunidade tradicional, as pessoas têm trabalhos e modos de vida muito parecidos e partilham as mesmas crenças.', categoria: 'mecanica', razao: 'a união vem da semelhança entre os membros.' },
  { texto: 'Em uma grande cidade, padeiros, médicos, motoristas e programadores dependem uns do trabalho dos outros.', categoria: 'organica', razao: 'a coesão vem da interdependência entre funções diferentes.' },
  { texto: 'Em um hospital, médicos, enfermeiros, técnicos e administradores cumprem funções distintas e se complementam.', categoria: 'organica', razao: 'o funcionamento depende da divisão do trabalho entre funções diferentes.' },
  { texto: 'Em oito horas, o operário produz mercadorias de valor maior do que o seu salário, e a diferença fica com o dono da fábrica.', categoria: 'mais-valia', razao: 'a diferença entre o valor produzido e o salário é apropriada pelo capitalista.' },
  { texto: 'Uma costureira produz peças que valem muito mais no mercado do que o pagamento que recebe, e a diferença vira lucro da empresa.', categoria: 'mais-valia', razao: 'o lucro vem da parte do trabalho que não é paga.' },
  { texto: 'Um operário repete uma única tarefa o dia todo, sem controlar o que é produzido nem o destino do produto, e não se reconhece no que faz.', categoria: 'alienacao', razao: 'ele está separado do produto e do processo do seu trabalho.' },
  { texto: 'Um trabalhador de linha de montagem não decide o ritmo, o método nem o destino do que fabrica, e vê o trabalho apenas como meio de sobreviver.', categoria: 'alienacao', razao: 'o trabalho não lhe pertence, e ele não se reconhece nele.' },
  { texto: 'Difunde-se a ideia de que a pobreza resulta apenas de falta de esforço individual, o que esconde as desigualdades entre as classes.', categoria: 'ideologia', razao: 'as ideias fazem a ordem social parecer natural e servem a interesses de classe.' },
  { texto: 'Um discurso apresenta a ordem econômica existente como a única possível, “natural”, e oculta os interesses que a sustentam.', categoria: 'ideologia', razao: 'naturaliza a ordem social e encobre interesses de classe.' },
  { texto: 'Um dono de fábrica, que possui as máquinas e o prédio, contrata trabalhadores para produzir e vender.', categoria: 'burguesia', razao: 'ele detém os meios de produção.' },
  { texto: 'Uma acionista de uma grande indústria vive dos lucros de seu capital, sem trabalhar na produção.', categoria: 'burguesia', razao: 'ela pertence à classe que detém os meios de produção e vive do lucro.' },
  { texto: 'Uma operária só possui a própria capacidade de trabalhar e vende sua força de trabalho em troca de salário.', categoria: 'proletariado', razao: 'ela depende da venda da força de trabalho.' },
  { texto: 'Um motorista assalariado de uma transportadora vive do salário pago pela empresa, que é dona dos veículos.', categoria: 'proletariado', razao: 'ele vende a força de trabalho e não possui os meios de produção.' },
]

/* ------------------------------------------------------------------ Entenda e resumo */

export const PASSOS_SOCIOLOGIA: PassoHumanas[] = [
  {
    titulo: 'Por que a Sociologia nasceu',
    texto: [
      'No século XIX, a Revolução Industrial e as revoluções políticas transformaram a vida: as pessoas se mudaram para as cidades, surgiram as fábricas e uma nova classe de trabalhadores, e as velhas tradições perderam força. A Sociologia nasceu para entender essas mudanças com método, sem depender só de opiniões.',
      'Três autores deram as primeiras grandes respostas e hoje são chamados de clássicos: Durkheim, Weber e Marx. Cada um olha para a mesma sociedade com uma lente diferente: o que mantém a sociedade unida (Durkheim), por que as pessoas agem como agem (Weber) e como o conflito e a produção moldam a história (Marx).',
    ],
    pare: {
      pergunta: 'Qual mudança histórica está ligada ao nascimento da Sociologia?',
      opcoes: ['A invenção da escrita', 'A Revolução Industrial e a urbanização', 'A descoberta da América'],
      certa: 1,
      explicacao: 'A Sociologia surge no século XIX para entender as transformações trazidas pela industrialização, pela urbanização e pelas revoluções políticas.',
    },
    autores: [],
  },
  {
    titulo: 'Durkheim: a sociedade como fato',
    texto: [
      'Durkheim afirma que a sociedade é mais do que a soma de indivíduos: ela tem regras, crenças e hábitos próprios, que existem antes de cada pessoa e que se impõem a ela. Essas maneiras coletivas de agir, pensar e sentir são os fatos sociais. Para estudá-los, a sociologia deve ser objetiva, como uma ciência.',
      'Ele pergunta o que une as pessoas. Em sociedades simples, as pessoas se parecem e partilham crenças: solidariedade mecânica. Em sociedades complexas, cada um tem uma função diferente e depende dos outros: solidariedade orgânica. Quando as normas se enfraquecem, surge a anomia.',
    ],
    pare: {
      pergunta: 'Na solidariedade orgânica, o que une as pessoas?',
      opcoes: ['A semelhança entre elas', 'A interdependência entre funções diferentes', 'A obediência a um líder carismático'],
      certa: 1,
      explicacao: 'Na solidariedade orgânica, a divisão do trabalho cria interdependência: cada função depende das outras.',
    },
    autores: ['durkheim'],
  },
  {
    titulo: 'Weber: compreender o sentido da ação',
    texto: [
      'Para Weber, a sociologia deve compreender o sentido que as pessoas dão às suas ações. Ele classifica a ação social em quatro tipos: racional com relação a fins (calcular meios para um objetivo), racional com relação a valores (agir por convicção), afetiva (movida por emoções) e tradicional (movida por costumes).',
      'Weber também estuda a dominação, isto é, a obediência a uma autoridade considerada legítima. Há três tipos: a tradicional (baseada nos costumes), a carismática (baseada nas qualidades extraordinárias de um líder) e a racional-legal (baseada em regras impessoais, como a burocracia). Para analisar a realidade, usa tipos ideais, modelos que servem de régua para comparação.',
    ],
    pare: {
      pergunta: 'Um líder é obedecido porque as pessoas acreditam que ele tem qualidades extraordinárias. Que tipo de dominação é essa?',
      opcoes: ['Tradicional', 'Carismática', 'Racional-legal'],
      certa: 1,
      explicacao: 'A dominação carismática se apoia na crença nas qualidades excepcionais do líder.',
    },
    autores: ['weber'],
  },
  {
    titulo: 'Marx: produção, classes e conflito',
    texto: [
      'Para Marx, a forma como a sociedade produz seus bens condiciona sua vida política e cultural. No capitalismo, a burguesia detém os meios de produção e o proletariado vende sua força de trabalho. A diferença entre o valor que o trabalhador produz e o salário que recebe é a mais-valia, origem do lucro.',
      'O trabalho assalariado gera alienação, e as ideias dominantes tendem a refletir os interesses da classe dominante (ideologia). Marx vê a história como marcada pela luta de classes. Ele analisa a sociedade para transformá-la, e não só para descrevê-la.',
    ],
    pare: {
      pergunta: 'Na análise de Marx, de onde vem o lucro do capitalista?',
      opcoes: ['Da genialidade do empresário', 'Da mais-valia, a parte do trabalho que não é paga', 'Da troca de mercadorias de mesmo valor'],
      certa: 1,
      explicacao: 'A mais-valia é a parte do valor criado pelo trabalhador que não é paga como salário e fica com o capitalista.',
    },
    autores: ['marx'],
  },
  {
    titulo: 'A mesma situação, três lentes',
    texto: [
      'As lentes não se contradizem sempre: elas olham para aspectos diferentes. Diante de uma demissão em massa, Durkheim pergunta pelas normas e pela coesão; Weber, pelos sentidos das ações e pela racionalização; Marx, pelos interesses de classe e pela exploração.',
      'Para reconhecer a lente, procure o conceito-chave da análise: anomia ou solidariedade (Durkheim); ação social, tipo ideal, dominação ou racionalização (Weber); classes, mais-valia, alienação ou ideologia (Marx). Na aba Laboratório, você compara as leituras de cada autor em situações do cotidiano.',
    ],
    pare: {
      pergunta: 'Uma análise fala em mais-valia e em luta de classes. Qual lente ela usa?',
      opcoes: ['Durkheim', 'Weber', 'Marx'],
      certa: 2,
      explicacao: 'Mais-valia e luta de classes são conceitos-chave de Marx.',
    },
    autores: ['durkheim', 'weber', 'marx'],
  },
  {
    titulo: 'Outras lentes: Adorno e Horkheimer, Bourdieu e Bauman',
    texto: [
      'A Sociologia do século XX e XXI traz outras lentes. Adorno e Horkheimer, da Escola de Frankfurt, criticam a indústria cultural: cultura produzida em série, como mercadoria, que padroniza gostos e favorece o conformismo. Bourdieu mostra como o capital cultural e o habitus ajudam a reproduzir desigualdades, inclusive na escola.',
      'Bauman descreve a modernidade líquida: relações, empregos e identidades mais flexíveis e provisórios, com mais liberdade e mais insegurança. Em provas, essas lentes costumam aparecer em textos sobre cultura de massa, educação e vida contemporânea.',
    ],
    pare: {
      pergunta: 'Qual autor desenvolveu os conceitos de capital cultural e habitus?',
      opcoes: ['Bauman', 'Bourdieu', 'Adorno'],
      certa: 1,
      explicacao: 'Capital cultural e habitus são conceitos de Pierre Bourdieu.',
    },
    autores: ['adorno-horkheimer', 'bourdieu', 'bauman'],
  },
]

export const RESUMO_SOCIOLOGIA: SecaoResumo[] = [
  {
    titulo: 'Durkheim, Weber e Marx: um quadro',
    formulas: [],
    ideias: [
      'Durkheim: fato social, solidariedade mecânica e orgânica, anomia; sociologia objetiva.',
      'Weber: ação social e seus quatro tipos, tipo ideal, três tipos de dominação, racionalização; sociologia compreensiva.',
      'Marx: modo de produção, luta de classes, mais-valia, alienação, ideologia; materialismo histórico.',
    ],
    pegadinhas: ['Atribuir a anomia a Weber ou a mais-valia a Durkheim.', 'Confundir tipo ideal (modelo de comparação) com algo perfeito.', 'Achar que as três lentes se excluem: elas olham para aspectos diferentes.'],
    fontes: FONTES_SOCIOLOGIA,
  },
  {
    titulo: 'Tipos de Weber e de Durkheim',
    formulas: [],
    ideias: [
      'Ações sociais (Weber): racional com relação a fins, racional com relação a valores, afetiva e tradicional.',
      'Dominação legítima (Weber): tradicional, carismática e racional-legal.',
      'Solidariedade (Durkheim): mecânica (semelhança) e orgânica (interdependência).',
    ],
    pegadinhas: ['Confundir racional com relação a valores (convicção) com racional com relação a fins (cálculo).', 'Achar que burocracia é dominação carismática: ela é racional-legal.', 'Achar que a solidariedade orgânica é mais afetiva.'],
    fontes: FONTES_SOCIOLOGIA,
  },
  {
    titulo: 'Outras lentes',
    formulas: [],
    ideias: [
      'Adorno e Horkheimer: indústria cultural, razão instrumental, esclarecimento; teoria crítica.',
      'Bourdieu: capital cultural, habitus, violência simbólica, campo; reprodução das desigualdades pela escola.',
      'Bauman: modernidade líquida, consumismo, amor líquido.',
    ],
    pegadinhas: ['Confundir habitus com hábito.', 'Achar que a crítica à indústria cultural é a toda cultura popular.', 'Achar que líquido é sinônimo de ruim em Bauman.'],
    fontes: FONTES_SOCIOLOGIA,
  },
]
