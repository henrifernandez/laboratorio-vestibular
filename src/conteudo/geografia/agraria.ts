import type { ItemBanco } from '@/materias/biologia/comum/auxiliares'
import type { PareEPense, SecaoResumo } from '../tipos'

export const FONTES_AGRARIA = [
  'IBGE. Censo Agropecuário 2017: resultados definitivos (ibge.gov.br).',
  'Brasil. Constituição da República Federativa do Brasil, 1988: artigos 184 a 191 (política agrícola e fundiária e reforma agrária).',
  'Brasil. Lei nº 4.504, de 30 de novembro de 1964 (Estatuto da Terra) e Lei nº 11.326, de 24 de julho de 2006 (Lei da Agricultura Familiar).',
  'Brasil. Lei nº 601, de 18 de setembro de 1850 (Lei de Terras).',
  'Embrapa. Histórico e pesquisa agropecuária (embrapa.br).',
  'Oliveira, A. U. de. A agricultura camponesa no Brasil. São Paulo: Contexto.',
  'Gini, C. Variabilità e mutabilità, 1912, e Lorenz, M. O. Methods of measuring the concentration of wealth. Publications of the American Statistical Association, 1905.',
]

/** Aviso sobre os números dos modelos deste tema. */
export const NOTA_MODELO_AGRARIA =
  'Os números dos gráficos e dos exercícios são modelos didáticos, feitos para treinar o raciocínio. Eles não são dados de um lugar real. Para dados oficiais, consulte o Censo Agropecuário do IBGE.'

export interface SistemaAgricola {
  id: string
  nome: string
  /** o que caracteriza, em uma frase */
  resumo: string
  escala: string
  trabalho: string
  tecnologia: string
  destino: string
  exemplo: string
  impacto: string
}

export const SISTEMAS: SistemaAgricola[] = [
  {
    id: 'itinerante',
    nome: 'Agricultura itinerante (coivara)',
    resumo: 'Derruba-se e queima-se um trecho de mata, cultiva-se por poucos anos e a área é deixada para a vegetação se recompor.',
    escala: 'pequena',
    trabalho: 'familiar ou comunitário',
    tecnologia: 'ferramentas simples, como machado e enxada',
    destino: 'consumo do grupo',
    exemplo: 'roças de mandioca de povos indígenas e comunidades ribeirinhas na Amazônia',
    impacto: 'com a mata se recompondo e pouca gente por hectare, o impacto é pequeno; com o aumento da população e o encurtamento do pousio, o solo se esgota.',
  },
  {
    id: 'plantation',
    nome: 'Plantation',
    resumo: 'Grande propriedade monocultora voltada à exportação, historicamente com mão de obra escravizada ou muito mal paga.',
    escala: 'grande',
    trabalho: 'escravizado (na colônia) ou assalariado barato',
    tecnologia: 'baixa, no início; mais moderna nas plantations atuais',
    destino: 'mercado externo',
    exemplo: 'engenhos de cana-de-açúcar do Nordeste colonial; cafezais do Vale do Paraíba no Império',
    impacto: 'esgotamento do solo, dependência de um único produto e concentração de terra e renda.',
  },
  {
    id: 'familiar',
    nome: 'Agricultura familiar',
    resumo: 'A família dirige o estabelecimento e fornece a maior parte do trabalho; produz alimentos para o consumo e para o mercado.',
    escala: 'pequena ou média',
    trabalho: 'predominantemente familiar',
    tecnologia: 'variável: de simples a bem equipada',
    destino: 'consumo da família e mercado interno',
    exemplo: 'produção de mandioca, feijão, hortaliças e leite em pequenas propriedades',
    impacto: 'garante emprego no campo e boa parte dos alimentos básicos da mesa; costuma ter menos acesso a crédito e a assistência técnica.',
  },
  {
    id: 'agronegocio',
    nome: 'Agronegócio (agricultura capitalizada)',
    resumo: 'Produção em grande escala, com máquinas, sementes melhoradas, insumos e ligação com a indústria, o comércio e o mercado externo.',
    escala: 'grande',
    trabalho: 'assalariado, com pouca gente por hectare',
    tecnologia: 'alta: mecanização, insumos químicos, biotecnologia e agricultura de precisão',
    destino: 'mercado interno e, sobretudo, exportação (commodities)',
    exemplo: 'fazendas de soja, milho e algodão do Centro-Oeste',
    impacto: 'alta produtividade e papel forte na balança comercial; pressão sobre o Cerrado e a Amazônia, uso de agrotóxicos e concentração de terra.',
  },
  {
    id: 'pecuaria-extensiva',
    nome: 'Pecuária extensiva',
    resumo: 'Criação de gado solto em grandes pastos, com poucos animais por hectare e pouca tecnologia.',
    escala: 'grande',
    trabalho: 'pouca gente',
    tecnologia: 'baixa',
    destino: 'carne e leite para mercado interno e externo',
    exemplo: 'criação de gado de corte em pastos do Centro-Oeste e do Norte',
    impacto: 'precisa de muita terra e está ligada ao desmatamento quando avança sobre a mata.',
  },
  {
    id: 'pecuaria-intensiva',
    nome: 'Pecuária intensiva',
    resumo: 'Muitos animais em pouca área, com pastagem manejada ou confinamento, ração balanceada e controle sanitário.',
    escala: 'pequena a média',
    trabalho: 'qualificado',
    tecnologia: 'alta',
    destino: 'mercado de carne e leite',
    exemplo: 'confinamento de gado de corte e bacias leiteiras tecnificadas',
    impacto: 'alta produtividade por hectare, mas exige capital e gera grande volume de resíduos.',
  },
  {
    id: 'organica',
    nome: 'Agricultura orgânica e agroecologia',
    resumo: 'Produção sem agrotóxicos e adubos químicos sintéticos, com adubação verde, rotação de culturas e controle biológico de pragas.',
    escala: 'em geral pequena e média',
    trabalho: 'muito trabalho por hectare, em geral familiar',
    tecnologia: 'baseada em manejo ecológico',
    destino: 'mercados de produtos orgânicos, feiras e circuitos curtos',
    exemplo: 'hortas e sítios com certificação orgânica',
    impacto: 'menor contaminação e preservação do solo; produtividade e escala costumam ser menores.',
  },
  {
    id: 'cinturao-verde',
    nome: 'Cinturão-verde (horticultura periurbana)',
    resumo: 'Cultivo de hortaliças, frutas e flores perto das cidades, para abastecer o mercado urbano com produtos frescos.',
    escala: 'pequena',
    trabalho: 'familiar e assalariado',
    tecnologia: 'média, com irrigação',
    destino: 'mercado urbano próximo',
    exemplo: 'chácaras de verduras no entorno de grandes cidades',
    impacto: 'pressão da expansão urbana sobre as terras agrícolas.',
  },
  {
    id: 'arroz-monções',
    nome: 'Agricultura intensiva de subsistência (Ásia de monções)',
    resumo: 'Cultivo muito trabalhoso de arroz em pequenos lotes e terraços, com alta produtividade por hectare e muita gente no campo.',
    escala: 'minúscula a pequena',
    trabalho: 'familiar, com muita mão de obra por hectare',
    tecnologia: 'baixa a média (irrigação e manejo da água)',
    destino: 'consumo local',
    exemplo: 'arrozais do sul e do leste da Ásia',
    impacto: 'sustenta populações muito densas, mas depende do ritmo das monções.',
  },
]

/* ------------------------------------------------------------------ bancos de perguntas */

export const BANCO_SISTEMAS: ItemBanco[] = [
  {
    pergunta: 'Uma família derruba e queima um trecho de mata, planta mandioca por dois ou três anos e depois deixa a área para a mata se recompor. Que sistema é esse?',
    certa: { texto: 'Agricultura itinerante (coivara)', porque: 'O cultivo muda de lugar: a área é aberta, usada por pouco tempo e deixada em pousio para a vegetação voltar.' },
    erradas: [
      { texto: 'Plantation', porque: 'Plantation é monocultura em grande propriedade, para exportação, e não uma roça temporária de consumo.', motivo: 'confundiu com plantation' },
      { texto: 'Cinturão-verde', porque: 'Cinturão-verde é horticultura permanente perto das cidades.', motivo: 'confundiu com horticultura urbana' },
      { texto: 'Pecuária intensiva', porque: 'Não há criação de gado no caso: é cultivo de roça.', motivo: 'trocou lavoura por pecuária' },
    ],
    licao: 'Agricultura itinerante: abrir, cultivar por pouco tempo e deixar em pousio.',
    dicas: ['Pense em quanto tempo a área é usada.', 'A área muda de lugar depois de poucos anos.', 'O nome indígena do sistema é coivara.'],
  },
  {
    pergunta: 'Um engenho de cana-de-açúcar do Nordeste colonial tinha grande propriedade, monocultura, trabalho escravizado e produção voltada à Europa. Qual é o sistema?',
    certa: { texto: 'Plantation', porque: 'Grande propriedade monocultora, voltada à exportação e com trabalho escravizado: é a plantation colonial.' },
    erradas: [
      { texto: 'Agricultura familiar', porque: 'Na agricultura familiar a família é quem trabalha, em propriedade pequena ou média, e produz para consumo e mercado interno.', motivo: 'confundiu com agricultura familiar' },
      { texto: 'Agricultura itinerante', porque: 'A agricultura itinerante é de pequena escala, e não de monocultura exportadora.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Agricultura orgânica', porque: 'Orgânica é um tipo de manejo atual, sem agrotóxicos, e não um sistema colonial.', motivo: 'confundiu com agricultura orgânica' },
    ],
    licao: 'Plantation: grande propriedade, monocultura, exportação e trabalho forçado ou barato.',
    dicas: ['Três palavras: grande, monocultura, exportação.', 'No Brasil colonial, quem trabalhava no engenho?', 'O sistema nasceu com a colonização europeia.'],
  },
  {
    pergunta: 'Uma família cultiva 15 hectares com mandioca, feijão e hortaliças. Consome parte e vende o resto na feira da cidade. Qual é o sistema?',
    certa: { texto: 'Agricultura familiar', porque: 'A família dirige o estabelecimento e faz a maior parte do trabalho, produzindo para o consumo e para o mercado local.' },
    erradas: [
      { texto: 'Agronegócio', porque: 'O agronegócio é de grande escala, com muita tecnologia e produção voltada ao mercado em grande volume.', motivo: 'confundiu com agronegócio' },
      { texto: 'Plantation', porque: 'A plantation é monocultura de exportação em grande propriedade.', motivo: 'confundiu com plantation' },
      { texto: 'Pecuária extensiva', porque: 'Pecuária extensiva é criação de gado em grandes pastos.', motivo: 'confundiu com pecuária' },
    ],
    licao: 'Agricultura familiar: trabalho principalmente da família, produção diversificada e destino misto.',
    dicas: ['Quem faz o trabalho?', 'O tamanho de 15 hectares indica pequena propriedade.', 'A produção é variada e vai em parte para o consumo da própria família.'],
  },
  {
    pergunta: 'Uma fazenda de soja no Mato Grosso usa plantadeiras e colheitadeiras com GPS, sementes melhoradas, insumos e vende a produção para empresas exportadoras. Que sistema é esse?',
    certa: { texto: 'Agronegócio (agricultura capitalizada)', porque: 'Grande escala, muita tecnologia, ligação com empresas e com o mercado externo: é o agronegócio.' },
    erradas: [
      { texto: 'Agricultura itinerante', porque: 'Na itinerante o cultivo é temporário, com ferramentas simples e para consumo.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Cinturão-verde', porque: 'Cinturão-verde é horticultura perto da cidade, em pequena escala.', motivo: 'confundiu com horticultura' },
      { texto: 'Agricultura familiar', porque: 'Aqui o trabalho é assalariado e mecanizado, e a escala é grande.', motivo: 'confundiu com agricultura familiar' },
    ],
    licao: 'Agronegócio: escala grande, tecnologia alta, ligação com a indústria e com a exportação.',
    dicas: ['Procure as palavras: GPS, insumos, exportadoras.', 'A escala é grande e o trabalho, assalariado.', 'A soja é uma commodity, vendida no mercado internacional.'],
  },
  {
    pergunta: 'Um criador mantém poucos animais por hectare, soltos em grandes pastos e com pouca tecnologia. Qual é o sistema?',
    certa: { texto: 'Pecuária extensiva', porque: 'Muita terra, poucos animais por hectare e pouca tecnologia caracterizam a pecuária extensiva.' },
    erradas: [
      { texto: 'Pecuária intensiva', porque: 'Na intensiva há muitos animais em pouca área, com ração, controle sanitário e confinamento.', motivo: 'trocou extensiva por intensiva' },
      { texto: 'Cinturão-verde', porque: 'Cinturão-verde é horticultura periurbana, não criação de gado.', motivo: 'confundiu com horticultura' },
      { texto: 'Agricultura orgânica', porque: 'Orgânica é um manejo sem agroquímicos, e o caso trata de densidade de animais por área.', motivo: 'confundiu com agricultura orgânica' },
    ],
    licao: 'Extensiva: muita área e pouco capital; intensiva: pouca área, muito capital e tecnologia.',
    dicas: ['Extensivo vem de extensão de terra.', 'Compare o número de animais por hectare.', 'Pouca tecnologia indica o sistema extensivo.'],
  },
  {
    pergunta: 'Num sistema, o gado é criado em confinamento, com ração balanceada e controle sanitário, em área pequena. Qual é?',
    certa: { texto: 'Pecuária intensiva', porque: 'Muitos animais em pouca área, com insumos e tecnologia: é a pecuária intensiva.' },
    erradas: [
      { texto: 'Pecuária extensiva', porque: 'A extensiva usa grandes pastos e pouca tecnologia.', motivo: 'trocou intensiva por extensiva' },
      { texto: 'Agricultura itinerante', porque: 'A itinerante é um cultivo temporário de roça, e o caso trata de criação de gado.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Plantation', porque: 'Plantation é monocultura de exportação, e não criação de gado em confinamento.', motivo: 'confundiu com plantation' },
    ],
    licao: 'Intensiva: muito capital e tecnologia por hectare.',
    dicas: ['Confinamento concentra os animais.', 'Ração balanceada é insumo industrial.', 'Compare com o pasto solto da extensiva.'],
  },
  {
    pergunta: 'Um sítio produz hortaliças sem agrotóxicos, com adubação verde, rotação de culturas e controle biológico de pragas. Qual é o sistema?',
    certa: { texto: 'Agricultura orgânica e agroecologia', porque: 'A ausência de agroquímicos sintéticos e o manejo ecológico caracterizam a produção orgânica e agroecológica.' },
    erradas: [
      { texto: 'Agronegócio', porque: 'O agronegócio de grande escala usa muitos insumos químicos e máquinas.', motivo: 'confundiu com agronegócio' },
      { texto: 'Plantation', porque: 'A plantation é monocultura em grande propriedade, com foco na exportação.', motivo: 'confundiu com plantation' },
      { texto: 'Pecuária extensiva', porque: 'O caso trata de lavoura de hortaliças, e não de criação de gado.', motivo: 'trocou lavoura por pecuária' },
    ],
    licao: 'Orgânica e agroecologia: manejo sem agroquímicos sintéticos e com rotação, adubação verde e controle biológico.',
    dicas: ['Procure o que o sítio não usa.', 'Adubação verde e rotação são práticas de manejo ecológico.', 'O mercado costuma ser de feiras e de produtos certificados.'],
  },
  {
    pergunta: 'Chácaras de alface, couve e flores no entorno de uma grande cidade abastecem os mercados urbanos com produtos frescos. Esse sistema se chama:',
    certa: { texto: 'Cinturão-verde (horticultura periurbana)', porque: 'Produtos frescos perecíveis precisam estar perto do mercado consumidor, e por isso surgem os cinturões-verdes.' },
    erradas: [
      { texto: 'Plantation', porque: 'Plantation é monocultura de exportação, e não horticultura para a cidade vizinha.', motivo: 'confundiu com plantation' },
      { texto: 'Agricultura itinerante', porque: 'A itinerante é cultivo temporário de roça e não abastece cidades.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Pecuária extensiva', porque: 'O caso trata de hortaliças e flores, e não de gado.', motivo: 'trocou lavoura por pecuária' },
    ],
    licao: 'Cinturão-verde: produtos perecíveis cultivados perto do mercado urbano.',
    dicas: ['Alface e flores estragam rápido.', 'Por isso são produzidos perto de quem consome.', 'O nome indica uma faixa de cultivo em volta da cidade.'],
  },
  {
    pergunta: 'No leste e no sul da Ásia, famílias cultivam arroz em pequenos lotes e terraços, com muita gente por hectare, para consumo local. Qual é o sistema?',
    certa: { texto: 'Agricultura intensiva de subsistência', porque: 'Muita mão de obra e alta produtividade por hectare, em lotes pequenos e para consumo local, definem esse sistema.' },
    erradas: [
      { texto: 'Pecuária extensiva', porque: 'O caso é de lavoura de arroz, e não de criação extensiva de gado.', motivo: 'trocou lavoura por pecuária' },
      { texto: 'Agronegócio', porque: 'No agronegócio a escala é grande, com poucas pessoas por hectare e foco em exportação.', motivo: 'confundiu com agronegócio' },
      { texto: 'Plantation', porque: 'Plantation é monocultura de exportação em grande propriedade.', motivo: 'confundiu com plantation' },
    ],
    licao: 'Intensiva de subsistência: pequeno lote, muita mão de obra, alta produtividade por hectare e consumo local.',
    dicas: ['O tamanho do lote é pequeno.', 'Muita gente trabalha em pouca terra.', 'O destino é o consumo local.'],
  },
  {
    pergunta: 'Na mesma área, o produtor combina lavoura, pasto e árvores, de modo que um uso ajuda o outro e o solo se recupera. Esse arranjo se chama:',
    certa: { texto: 'Integração lavoura-pecuária-floresta', porque: 'A integração entre lavoura, pecuária e floresta aproveita a mesma área com usos que se complementam.' },
    erradas: [
      { texto: 'Agricultura itinerante', porque: 'A itinerante troca de área; na integração, a área é permanente e usada de modo combinado.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Pecuária extensiva', porque: 'Extensiva usa o pasto sozinho, sem integração com lavoura e árvores.', motivo: 'confundiu com pecuária extensiva' },
      { texto: 'Plantation', porque: 'Plantation é monocultura, o oposto de combinar usos.', motivo: 'confundiu com plantation' },
    ],
    licao: 'Integração lavoura-pecuária-floresta: usos combinados na mesma área para recuperar o solo e aumentar a produtividade.',
    dicas: ['O nome do sistema lista os três usos.', 'Monocultura é o contrário.', 'A área é permanente.'],
  },
  {
    pergunta: 'No plantio direto, a semente é colocada no solo sem arar nem revolver a terra, mantendo a palha da safra anterior. Qual é a vantagem principal?',
    certa: { texto: 'Reduz a erosão e conserva a umidade e a matéria orgânica do solo', porque: 'A palha protege o solo da chuva e do sol, e não revolver a terra preserva sua estrutura.' },
    erradas: [
      { texto: 'Aumenta a necessidade de arar a terra todos os anos', porque: 'O plantio direto dispensa a aração.', motivo: 'inverteu a prática' },
      { texto: 'Substitui a necessidade de sementes', porque: 'As sementes continuam sendo necessárias.', motivo: 'ignorou as sementes' },
      { texto: 'Elimina a possibilidade de duas safras no ano', porque: 'Ao contrário, o plantio direto é muito usado em sistemas de duas safras no mesmo ano.', motivo: 'ignorou a dupla safra' },
    ],
    licao: 'Plantio direto: sem revolver o solo, com palha, para reduzir erosão e conservar a água e a matéria orgânica.',
    dicas: ['A palha cobre o solo.', 'Pense no efeito da chuva em solo exposto.', 'O solo não é revolvido.'],
  },
  {
    pergunta: 'Uma empresa compra laranjas de vários produtores, extrai o suco, congela e exporta. Esse conjunto de atividades que liga o campo à indústria e ao comércio é chamado de:',
    certa: { texto: 'Complexo agroindustrial', porque: 'Reúne o campo, a indústria que processa e o comércio que distribui, formando uma cadeia produtiva.' },
    erradas: [
      { texto: 'Agricultura de subsistência', porque: 'Subsistência é produção para o consumo da própria família, sem cadeia industrial.', motivo: 'confundiu com subsistência' },
      { texto: 'Agricultura itinerante', porque: 'A itinerante é de pequena escala e sem industrialização.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Cinturão-verde', porque: 'Cinturão-verde fornece produtos frescos à cidade, sem processamento industrial.', motivo: 'confundiu com horticultura' },
    ],
    licao: 'Complexo agroindustrial: campo, indústria e comércio ligados em cadeia.',
    dicas: ['Há processamento industrial.', 'A produção é vendida a empresas.', 'O nome junta agricultura e indústria.'],
  },
  {
    pergunta: 'Em grandes fazendas de trigo dos EUA e do Canadá, poucas pessoas operam muitas máquinas em áreas enormes. Que característica descreve esse sistema?',
    certa: { texto: 'Agricultura comercial mecanizada, de grande escala e pouca mão de obra por hectare', porque: 'Muita área, muita máquina e pouca gente por hectare caracterizam a agricultura mecanizada de grande escala.' },
    erradas: [
      { texto: 'Agricultura itinerante de subsistência', porque: 'Não há mecanização na itinerante, e a produção é para consumo.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Agricultura intensiva de subsistência, com muita mão de obra', porque: 'O caso tem pouca gente e muita máquina, o oposto.', motivo: 'inverteu a mão de obra' },
      { texto: 'Cinturão-verde, para abastecer a cidade vizinha', porque: 'Os trigais são de grande escala e vendem para o mercado nacional e externo.', motivo: 'confundiu com horticultura' },
    ],
    licao: 'Agricultura mecanizada de grande escala: muita máquina e pouca mão de obra por hectare.',
    dicas: ['Procure a relação entre gente e área.', 'Máquinas substituem trabalhadores.', 'O trigo é produzido para o mercado.'],
  },
  {
    pergunta: 'No Sahel, grupos criam camelos e cabras e se deslocam à procura de pasto e água. Esse sistema é chamado de:',
    certa: { texto: 'Pastoreio nômade', porque: 'O deslocamento do grupo com os rebanhos à procura de pasto e água caracteriza o pastoreio nômade.' },
    erradas: [
      { texto: 'Pecuária intensiva', porque: 'Na intensiva os animais ficam confinados ou em pastos manejados, em pouca área.', motivo: 'confundiu com pecuária intensiva' },
      { texto: 'Plantation', porque: 'Plantation é monocultura em propriedade fixa.', motivo: 'confundiu com plantation' },
      { texto: 'Cinturão-verde', porque: 'É horticultura fixa, perto das cidades.', motivo: 'confundiu com horticultura' },
    ],
    licao: 'Pastoreio nômade: o grupo se desloca com os rebanhos em busca de pasto e água.',
    dicas: ['Procure a palavra deslocam.', 'O grupo não fica fixo.', 'Camelos e cabras resistem a ambientes secos.'],
  },
]

export const BANCO_FUNDIARIA: ItemBanco[] = [
  {
    pergunta: 'Uma propriedade rural tão pequena que não consegue sustentar a família do proprietário é chamada de:',
    certa: { texto: 'Minifúndio', porque: 'Minifúndio é o imóvel rural de área inferior à necessária para o sustento de uma família.' },
    erradas: [
      { texto: 'Latifúndio', porque: 'Latifúndio é a grande propriedade, e não a muito pequena.', motivo: 'trocou minifúndio por latifúndio' },
      { texto: 'Plantation', porque: 'Plantation é um sistema de produção, e não o tamanho da propriedade.', motivo: 'confundiu sistema com tamanho' },
      { texto: 'Agroindústria', porque: 'Agroindústria processa produtos agrícolas, e não designa o tamanho da terra.', motivo: 'confundiu com agroindústria' },
    ],
    licao: 'Minifúndio: pequeno demais para sustentar a família. Latifúndio: grande propriedade, muitas vezes mal aproveitada.',
    dicas: ['O prefixo mini indica pequeno.', 'Pense no sustento da família.', 'O contrário é o latifúndio.'],
  },
  {
    pergunta: 'Uma grande propriedade rural, mal aproveitada ou improdutiva, mantida muitas vezes como reserva de valor ou por prestígio, recebe o nome de:',
    certa: { texto: 'Latifúndio improdutivo', porque: 'É a grande propriedade pouco ou mal aproveitada, o alvo clássico das discussões sobre reforma agrária.' },
    erradas: [
      { texto: 'Minifúndio', porque: 'Minifúndio é uma propriedade pequena.', motivo: 'trocou latifúndio por minifúndio' },
      { texto: 'Agricultura familiar', porque: 'Agricultura familiar é um tipo de produção em estabelecimentos pequenos ou médios.', motivo: 'confundiu com agricultura familiar' },
      { texto: 'Cinturão-verde', porque: 'Cinturão-verde é horticultura perto de cidades.', motivo: 'confundiu com horticultura' },
    ],
    licao: 'Latifúndio improdutivo: terra grande, mal aproveitada, mantida por especulação ou prestígio.',
    dicas: ['Lati vem de largo.', 'O problema é a terra grande sem uso adequado.', 'É o alvo da reforma agrária.'],
  },
  {
    pergunta: 'O que estabelecia a Lei de Terras, de 1850, sobre o acesso às terras públicas (devolutas) do Império?',
    certa: { texto: 'Elas só podiam ser obtidas por compra, e não mais por posse ou doação', porque: 'A lei encareceu o acesso à terra, o que dificultou a vida de pobres e de futuros libertos, no mesmo ano em que o tráfico foi proibido.' },
    erradas: [
      { texto: 'Elas seriam distribuídas gratuitamente aos escravizados libertos', porque: 'Não houve distribuição aos libertos; ao contrário, a compra passou a ser a regra.', motivo: 'achou que a lei distribuía terra' },
      { texto: 'Elas seriam doadas por sesmarias a quem tivesse prestígio', porque: 'O sistema de sesmarias, de doações, foi encerrado antes de 1850.', motivo: 'confundiu com as sesmarias' },
      { texto: 'Elas passariam a pertencer aos povos indígenas', porque: 'A lei não beneficiou os indígenas com as terras públicas.', motivo: 'inverteu o sentido da lei' },
    ],
    licao: 'Lei de Terras (1850): terra devoluta só por compra, o que ajudou a concentrar a propriedade.',
    dicas: ['Ligue com 1850 e o fim do tráfico.', 'Quem tinha dinheiro conseguia comprar.', 'A lei reforçou a concentração fundiária.'],
  },
  {
    pergunta: 'O Estatuto da Terra, de 1964, é lembrado por qual motivo?',
    certa: { texto: 'Foi a primeira grande lei de reforma agrária do país e tratou da função social da terra', porque: 'A Lei 4.504/1964, do governo Castelo Branco, definiu reforma agrária e política agrícola e ligou a propriedade à função social.' },
    erradas: [
      { texto: 'Aboliu a escravidão no campo', porque: 'A escravidão foi abolida em 1888, pela Lei Áurea.', motivo: 'confundiu com a Lei Áurea' },
      { texto: 'Criou a Embrapa', porque: 'A Embrapa foi criada em 1973.', motivo: 'confundiu com a criação da Embrapa' },
      { texto: 'Proibiu a compra de terras por brasileiros', porque: 'Não existe tal proibição; o estatuto tratou de reforma agrária e desenvolvimento rural.', motivo: 'inventou uma proibição' },
    ],
    licao: 'Estatuto da Terra (1964): reforma agrária e função social da propriedade.',
    dicas: ['É de 1964, no regime militar.', 'Define reforma agrária.', 'Fala em função social da terra.'],
  },
  {
    pergunta: 'Segundo a Constituição de 1988, uma propriedade rural cumpre a função social quando atende, ao mesmo tempo, a quais exigências?',
    certa: { texto: 'Aproveitamento racional, uso adequado dos recursos naturais e preservação do meio ambiente, respeito às leis trabalhistas e exploração que favoreça o bem-estar', porque: 'O artigo 186 lista essas exigências, que devem ser cumpridas em conjunto.' },
    erradas: [
      { texto: 'Basta ser registrada em cartório e ter documento', porque: 'O registro não basta: é preciso cumprir os requisitos do artigo 186.', motivo: 'achou que o registro bastava' },
      { texto: 'Basta produzir para exportação', porque: 'Exportar não substitui as exigências ambientais, trabalhistas e de bem-estar.', motivo: 'ignorou as outras exigências' },
      { texto: 'Basta ser maior do que quatro módulos fiscais', porque: 'O tamanho não define a função social.', motivo: 'confundiu com tamanho do imóvel' },
    ],
    licao: 'Função social (CF/88, art. 186): uso racional, meio ambiente, leis trabalhistas e bem-estar, tudo junto.',
    dicas: ['São mais de uma exigência.', 'Incluem trabalho e meio ambiente.', 'Registro e tamanho não bastam.'],
  },
  {
    pergunta: 'Como a Constituição de 1988 prevê a desapropriação de um imóvel rural que não cumpre a função social, para fins de reforma agrária?',
    certa: { texto: 'Por interesse social, com prévia e justa indenização em títulos da dívida agrária', porque: 'É a regra do artigo 184: desapropriação por interesse social, indenizada em títulos da dívida agrária (as benfeitorias úteis e necessárias, em dinheiro).' },
    erradas: [
      { texto: 'Sem indenização, em qualquer caso', porque: 'A Constituição prevê indenização prévia e justa.', motivo: 'achou que não há indenização' },
      { texto: 'Apenas com o consentimento do proprietário', porque: 'A desapropriação é feita pelo poder público, mesmo sem o consentimento do proprietário, nos termos da lei.', motivo: 'achou que depende do consentimento' },
      { texto: 'Só pode atingir propriedades produtivas', porque: 'Ao contrário, a propriedade produtiva não pode ser desapropriada para reforma agrária (art. 185).', motivo: 'inverteu a regra da propriedade produtiva' },
    ],
    licao: 'Desapropriação para reforma agrária: interesse social, indenização prévia e justa em títulos da dívida agrária; não vale para propriedade produtiva.',
    dicas: ['A palavra-chave é indenização.', 'Os títulos têm o nome de dívida agrária.', 'O imóvel precisa descumprir a função social.'],
  },
  {
    pergunta: 'O que significa grilagem de terras?',
    certa: { texto: 'A apropriação ilegal de terras públicas ou alheias, em geral com documentos falsificados', porque: 'Segundo a explicação mais difundida, o termo vem da prática de envelhecer documentos falsos em caixas com grilos; hoje designa a apropriação ilegal de terras por escrituras fraudulentas.' },
    erradas: [
      { texto: 'A distribuição legal de terras a famílias assentadas', porque: 'Distribuição legal é assentamento da reforma agrária.', motivo: 'confundiu com assentamento' },
      { texto: 'O cultivo de uma mesma planta por muitos anos', porque: 'Isso é monocultura.', motivo: 'confundiu com monocultura' },
      { texto: 'A recuperação de áreas degradadas', porque: 'É recuperação ambiental, e não apropriação de terra.', motivo: 'confundiu com recuperação ambiental' },
    ],
    licao: 'Grilagem: apropriação ilegal de terra, em geral com documentos falsos.',
    dicas: ['Envolve documentos falsos.', 'É ilegal.', 'Atinge terras públicas ou de outros.'],
  },
  {
    pergunta: 'O Movimento dos Trabalhadores Rurais Sem Terra (MST), fundado oficialmente em 1984, defende principalmente:',
    certa: { texto: 'A reforma agrária e o acesso à terra para famílias de trabalhadores rurais', porque: 'O MST nasceu da luta pela terra no fim da ditadura e se organiza em torno da reforma agrária.' },
    erradas: [
      { texto: 'O fim da agricultura familiar', porque: 'O movimento reúne famílias de agricultores e defende a agricultura familiar.', motivo: 'inverteu a posição do movimento' },
      { texto: 'A privatização de terras indígenas', porque: 'Esse não é o objetivo do movimento.', motivo: 'inverteu a posição do movimento' },
      { texto: 'A proibição do uso de qualquer máquina no campo', porque: 'O movimento não tem essa bandeira; defende acesso à terra e condições de produção.', motivo: 'inventou uma bandeira' },
    ],
    licao: 'MST: movimento ligado à reforma agrária e ao acesso à terra, fundado em 1984.',
    dicas: ['O nome diz o que falta aos trabalhadores.', 'Surge no fim do regime militar.', 'A bandeira é a reforma agrária.'],
  },
  {
    pergunta: 'Qual das alternativas descreve corretamente o que é reforma agrária?',
    certa: { texto: 'Redistribuição de terras, em geral acompanhada de crédito e apoio técnico, para ampliar o acesso à terra e a produção', porque: 'A reforma agrária muda a estrutura fundiária e precisa de políticas de apoio para as famílias assentadas produzirem.' },
    erradas: [
      { texto: 'Aumento da área dos grandes latifúndios', porque: 'Isso aumentaria a concentração fundiária, o oposto da reforma.', motivo: 'inverteu o sentido' },
      { texto: 'Substituição das lavouras por pastos', porque: 'Não tem relação com a reforma agrária.', motivo: 'confundiu com uso do solo' },
      { texto: 'Cobrança de impostos mais altos dos pequenos produtores', porque: 'Esse não é o sentido da reforma.', motivo: 'inventou medida' },
    ],
    licao: 'Reforma agrária: redistribuir terra e dar condições de produzir.',
    dicas: ['Fala-se em estrutura fundiária.', 'O objetivo é ampliar o acesso à terra.', 'Crédito e assistência técnica ajudam.'],
  },
  {
    pergunta: 'A Lei da Agricultura Familiar (Lei 11.326/2006) considera agricultor familiar quem, entre outros requisitos:',
    certa: { texto: 'Tem área de até quatro módulos fiscais, usa mão de obra predominantemente da própria família e tem renda vinculada ao estabelecimento', porque: 'São requisitos da lei: área limitada, trabalho predominantemente familiar, renda vinculada ao estabelecimento e direção do estabelecimento pela família.' },
    erradas: [
      { texto: 'Possui mais de mil hectares e contrata muitos assalariados', porque: 'Isso descreve uma grande propriedade, e não a agricultura familiar.', motivo: 'confundiu com grande propriedade' },
      { texto: 'Produz exclusivamente para exportação', porque: 'A lei não exige exportação; a produção pode ir para consumo e mercado.', motivo: 'inventou exigência' },
      { texto: 'Não pode vender nada, apenas consumir', porque: 'A venda é permitida e comum.', motivo: 'confundiu com subsistência pura' },
    ],
    licao: 'Agricultura familiar: área pequena (até 4 módulos fiscais), trabalho familiar, renda ligada ao estabelecimento.',
    dicas: ['A palavra-chave é familiar.', 'A área é limitada.', 'A renda vem do próprio estabelecimento.'],
  },
  {
    pergunta: 'O Pronaf, criado em 1996, é um programa de:',
    certa: { texto: 'Crédito e apoio ao fortalecimento da agricultura familiar', porque: 'Pronaf é o Programa Nacional de Fortalecimento da Agricultura Familiar, que oferece crédito rural com juros mais baixos.' },
    erradas: [
      { texto: 'Subsídio à exportação de carnes', porque: 'Não é seu objetivo.', motivo: 'inventou finalidade' },
      { texto: 'Proteção de terras indígenas', porque: 'A proteção de terras indígenas tem outros instrumentos legais.', motivo: 'confundiu com política indígena' },
      { texto: 'Controle do preço do petróleo', porque: 'Nada tem a ver com petróleo.', motivo: 'inventou finalidade' },
    ],
    licao: 'Pronaf: crédito e apoio para a agricultura familiar.',
    dicas: ['O nome tem Fortalecimento da Agricultura Familiar.', 'É um crédito rural.', 'Foi criado nos anos 1990.'],
  },
  {
    pergunta: 'A mecanização do campo e a concentração da terra contribuíram, no Brasil do século XX, para:',
    certa: { texto: 'O êxodo rural, com a migração de muita gente do campo para as cidades', porque: 'Menos gente era necessária no campo e muitas famílias perderam o acesso à terra, e muitas se mudaram para as cidades.' },
    erradas: [
      { texto: 'O fim da urbanização', porque: 'A urbanização cresceu no período.', motivo: 'inverteu o fenômeno' },
      { texto: 'O aumento do número de trabalhadores no campo', porque: 'A população rural diminuiu em termos relativos.', motivo: 'inverteu o fenômeno' },
      { texto: 'A volta da escravidão formal', porque: 'A escravidão foi abolida em 1888, e não voltou a existir formalmente.', motivo: 'confundiu com a história' },
    ],
    licao: 'Mecanização e concentração fundiária alimentaram o êxodo rural.',
    dicas: ['Máquinas substituem trabalhadores.', 'Quem saiu do campo foi para onde?', 'Esse fluxo se chama êxodo rural.'],
  },
  {
    pergunta: 'Qual instrumento protege os direitos territoriais das comunidades quilombolas, segundo a Constituição de 1988?',
    certa: { texto: 'O reconhecimento da propriedade definitiva das terras ocupadas pelas comunidades remanescentes de quilombos', porque: 'O artigo 68 do Ato das Disposições Constitucionais Transitórias reconhece a propriedade das terras ocupadas por remanescentes de quilombos.' },
    erradas: [
      { texto: 'A proibição de qualquer ocupação de terras no país', porque: 'Não existe essa proibição.', motivo: 'inventou regra' },
      { texto: 'A obrigação de vender as terras aos grandes fazendeiros', porque: 'A Constituição reconhece o direito das comunidades e não obriga a venda.', motivo: 'inverteu o sentido' },
      { texto: 'A transferência das terras para o Estado', porque: 'O reconhecimento é da propriedade das comunidades.', motivo: 'inverteu o sentido' },
    ],
    licao: 'Quilombolas: a Constituição reconhece a propriedade das terras ocupadas por comunidades remanescentes de quilombos.',
    dicas: ['Fala-se em remanescentes de quilombos.', 'A regra está nas disposições transitórias.', 'O reconhecimento é do direito à propriedade.'],
  },
]

export const BANCO_BRASIL: ItemBanco[] = [
  {
    pergunta: 'Qual é o principal estado produtor de soja do Brasil?',
    certa: { texto: 'Mato Grosso', porque: 'Mato Grosso lidera a produção brasileira de soja, com grandes áreas de Cerrado e Amazônia de transição.' },
    erradas: [
      { texto: 'Pernambuco', porque: 'Pernambuco é tradicional na cana-de-açúcar, mas não lidera a soja.', motivo: 'trocou o estado' },
      { texto: 'Santa Catarina', porque: 'Santa Catarina destaca-se em aves e suínos, e não em soja.', motivo: 'trocou o estado' },
      { texto: 'Amapá', porque: 'O Amapá tem produção agrícola pequena.', motivo: 'trocou o estado' },
    ],
    licao: 'Soja: Mato Grosso é o líder; Paraná e Rio Grande do Sul vêm em seguida.',
    dicas: ['Pense no Centro-Oeste.', 'O estado tem muito Cerrado.', 'Cuiabá é a capital.'],
  },
  {
    pergunta: 'Qual estado brasileiro é o maior produtor de cana-de-açúcar?',
    certa: { texto: 'São Paulo', porque: 'São Paulo concentra a maior parte da cana, do açúcar e do etanol do Brasil.' },
    erradas: [
      { texto: 'Rio Grande do Sul', porque: 'O Rio Grande do Sul é destaque em arroz e soja.', motivo: 'trocou o estado' },
      { texto: 'Pará', porque: 'O Pará é produtor de cacau e pecuária, mas não lidera a cana.', motivo: 'trocou o estado' },
      { texto: 'Amazonas', porque: 'A produção agrícola de cana no Amazonas é pequena.', motivo: 'trocou o estado' },
    ],
    licao: 'Cana-de-açúcar: São Paulo lidera; o Nordeste foi o berço no período colonial.',
    dicas: ['Pense no Sudeste.', 'O estado tem muitas usinas.', 'O etanol é um produto da cana.'],
  },
  {
    pergunta: 'Qual estado é o maior produtor de café do Brasil?',
    certa: { texto: 'Minas Gerais', porque: 'Minas Gerais produz cerca de metade do café brasileiro.' },
    erradas: [
      { texto: 'Mato Grosso do Sul', porque: 'MS tem destaque em soja e pecuária.', motivo: 'trocou o estado' },
      { texto: 'Piauí', porque: 'O Piauí tem produção pequena de café.', motivo: 'trocou o estado' },
      { texto: 'Acre', porque: 'O Acre tem pouca produção de café.', motivo: 'trocou o estado' },
    ],
    licao: 'Café: Minas Gerais lidera, seguido por Espírito Santo, São Paulo e outros.',
    dicas: ['É um estado do Sudeste.', 'Sul de Minas é conhecido por cafezais.', 'O café já foi base da economia paulista no século XIX.'],
  },
  {
    pergunta: 'Qual estado é o maior produtor de arroz do Brasil?',
    certa: { texto: 'Rio Grande do Sul', porque: 'O Rio Grande do Sul produz a maior parte do arroz brasileiro, em lavouras irrigadas.' },
    erradas: [
      { texto: 'Bahia', porque: 'A Bahia é destaque em cacau, algodão e soja.', motivo: 'trocou o estado' },
      { texto: 'Pernambuco', porque: 'Pernambuco é tradicional na cana-de-açúcar.', motivo: 'trocou o estado' },
      { texto: 'Roraima', porque: 'Roraima tem pequena produção.', motivo: 'trocou o estado' },
    ],
    licao: 'Arroz: Rio Grande do Sul lidera, em várzeas irrigadas.',
    dicas: ['Pense no Sul.', 'O estado tem planícies alagáveis.', 'A cultura é irrigada.'],
  },
  {
    pergunta: 'Qual é a região do Brasil que concentra o cinturão citrícola, com a produção de laranja para suco?',
    certa: { texto: 'Interior de São Paulo', porque: 'O interior paulista concentra a maior parte da laranja do Brasil e das indústrias de suco.' },
    erradas: [
      { texto: 'Pantanal mato-grossense', porque: 'O Pantanal é conhecido pela pecuária e pela biodiversidade.', motivo: 'trocou a região' },
      { texto: 'Sertão nordestino', porque: 'O Sertão tem agricultura de sequeiro e irrigada em polos, como Petrolina e Juazeiro.', motivo: 'trocou a região' },
      { texto: 'Campanha gaúcha', porque: 'A Campanha é famosa pela pecuária e pela vitivinicultura.', motivo: 'trocou a região' },
    ],
    licao: 'Citricultura: interior de São Paulo, ligada às indústrias de suco.',
    dicas: ['Pense em suco de laranja para exportação.', 'O estado tem muitas indústrias.', 'É uma região do Sudeste.'],
  },
  {
    pergunta: 'O que significa a sigla MATOPIBA?',
    certa: { texto: 'Uma região de fronteira agrícola do Cerrado, formada por partes de Maranhão, Tocantins, Piauí e Bahia', porque: 'MA + TO + PI + BA: é uma das áreas onde a soja e outros grãos mais avançaram nas últimas décadas.' },
    erradas: [
      { texto: 'Uma região formada por Mato Grosso, Pará, Pernambuco e Bahia', porque: 'A sigla reúne Maranhão, Tocantins, Piauí e Bahia.', motivo: 'trocou os estados' },
      { texto: 'Um programa de crédito para pecuaristas', porque: 'É uma região, e não um programa de crédito.', motivo: 'inventou programa' },
      { texto: 'Um tratado de livre-comércio', porque: 'Não é um tratado comercial.', motivo: 'inventou tratado' },
    ],
    licao: 'MATOPIBA: Maranhão, Tocantins, Piauí e Bahia, fronteira agrícola do Cerrado.',
    dicas: ['As letras são siglas de estados.', 'A região fica no Cerrado.', 'É conhecida pela expansão da soja.'],
  },
  {
    pergunta: 'A Embrapa foi criada em 1973. Qual foi uma de suas contribuições para o avanço da agricultura no Cerrado?',
    certa: { texto: 'Pesquisas sobre correção do solo e variedades adaptadas, que tornaram o cultivo de soja viável na região', porque: 'O solo ácido e pobre do Cerrado exigiu correção com calcário e adubação, além de variedades adaptadas ao clima.' },
    erradas: [
      { texto: 'A proibição de qualquer cultivo no Cerrado', porque: 'A atuação da Embrapa foi no sentido oposto: viabilizar a produção.', motivo: 'inverteu o papel da Embrapa' },
      { texto: 'A distribuição de terras a trabalhadores sem terra', porque: 'Essa é a função da política de reforma agrária, e não da Embrapa.', motivo: 'confundiu com reforma agrária' },
      { texto: 'A criação do Pronaf', porque: 'O Pronaf foi criado em 1996, por política de crédito.', motivo: 'confundiu com crédito rural' },
    ],
    licao: 'Embrapa (1973): pesquisa que corrigiu o solo e adaptou variedades, viabilizando a soja no Cerrado.',
    dicas: ['Pense em pesquisa agropecuária.', 'O solo do Cerrado é ácido.', 'A soja precisou de variedades adaptadas.'],
  },
  {
    pergunta: 'O que foi a Revolução Verde, que se difundiu a partir de meados do século XX?',
    certa: { texto: 'A modernização da agricultura com sementes melhoradas, adubos, agrotóxicos, irrigação e mecanização', porque: 'O pacote tecnológico aumentou a produtividade, mas elevou os custos e favoreceu quem tinha capital.' },
    erradas: [
      { texto: 'A volta da agricultura itinerante em todo o mundo', porque: 'A Revolução Verde foi uma modernização, e não um retorno a práticas tradicionais.', motivo: 'inverteu o sentido' },
      { texto: 'O fim do uso de agrotóxicos', porque: 'A Revolução Verde ampliou o uso de agrotóxicos e adubos químicos.', motivo: 'inverteu o sentido' },
      { texto: 'A reforma agrária mundial', porque: 'Ela foi uma mudança técnica, e não uma redistribuição de terras.', motivo: 'confundiu com reforma agrária' },
    ],
    licao: 'Revolução Verde: pacote tecnológico (sementes, insumos, irrigação, máquinas) que elevou a produtividade e favoreceu quem tinha capital.',
    dicas: ['Pense em tecnologia e insumos.', 'A produtividade subiu.', 'Os custos subiram também.'],
  },
  {
    pergunta: 'Qual é um dos principais impactos ambientais associados à expansão da pecuária extensiva e das lavouras sobre o Cerrado e a Amazônia?',
    certa: { texto: 'O desmatamento e a perda de biodiversidade', porque: 'A abertura de áreas para pasto e lavoura elimina a vegetação nativa e a fauna associada.' },
    erradas: [
      { texto: 'O aumento da cobertura de mata nativa', porque: 'A expansão em áreas de mata reduz a vegetação nativa.', motivo: 'inverteu o impacto' },
      { texto: 'A formação de geleiras', porque: 'Não há geleiras nessas regiões.', motivo: 'confundiu com outro ambiente' },
      { texto: 'A diminuição do uso de água', porque: 'A irrigação e a agricultura em larga escala costumam aumentar o uso de água.', motivo: 'inverteu o impacto' },
    ],
    licao: 'A expansão agropecuária sobre Cerrado e Amazônia causa desmatamento e perda de biodiversidade.',
    dicas: ['Pasto e lavoura ocupam o lugar da vegetação.', 'Pense na floresta e na savana.', 'Biodiversidade é variedade de espécies.'],
  },
  {
    pergunta: 'Qual é o principal destino das exportações brasileiras de soja?',
    certa: { texto: 'China', porque: 'A China é a maior compradora da soja brasileira, em grande parte para ração animal.' },
    erradas: [
      { texto: 'Argentina', porque: 'A Argentina também produz soja e não é a maior compradora do Brasil.', motivo: 'trocou o país' },
      { texto: 'Groenlândia', porque: 'A Groenlândia não compra soja em volume relevante.', motivo: 'trocou o país' },
      { texto: 'Austrália', porque: 'A Austrália não é o principal comprador de soja do Brasil.', motivo: 'trocou o país' },
    ],
    licao: 'A China é o principal comprador da soja brasileira.',
    dicas: ['É o país mais populoso da Ásia, junto com a Índia.', 'A soja alimenta rebanhos.', 'Pense no maior parceiro comercial do Brasil.'],
  },
  {
    pergunta: 'O que é a produção de duas safras em um mesmo ano agrícola, como a soja seguida do milho?',
    certa: { texto: 'Dupla safra (safrinha), que aproveita melhor a terra e o clima', porque: 'O milho semeado logo após a soja aproveita o período de chuva e aumenta a produção por área.' },
    erradas: [
      { texto: 'Pousio, em que a terra fica sem cultivo', porque: 'No pousio, a terra descansa; na dupla safra, é usada duas vezes.', motivo: 'trocou dupla safra por pousio' },
      { texto: 'Agricultura itinerante', porque: 'A itinerante muda de área e deixa a terra em descanso.', motivo: 'confundiu com agricultura itinerante' },
      { texto: 'Extrativismo vegetal', porque: 'O extrativismo coleta o que a natureza produz, sem plantio.', motivo: 'confundiu com extrativismo' },
    ],
    licao: 'Dupla safra: duas culturas no mesmo ano, na mesma área.',
    dicas: ['Duas colheitas por ano.', 'O milho vem depois da soja.', 'O oposto é o pousio.'],
  },
  {
    pergunta: 'Qual afirmação sobre a agricultura familiar no Brasil é correta, segundo os dados do Censo Agropecuário de 2017?',
    certa: { texto: 'Ela representa a maior parte dos estabelecimentos, mas ocupa uma parcela menor da área total', porque: 'Cerca de três quartos dos estabelecimentos são familiares, que ocupam menos de um quarto da área e empregam a maior parte das pessoas do campo.' },
    erradas: [
      { texto: 'Ela ocupa a maior parte da área agrícola do país', porque: 'Os estabelecimentos não familiares ocupam a maior parte da área.', motivo: 'inverteu a proporção da área' },
      { texto: 'Ela não produz alimentos para o consumo interno', porque: 'Boa parte dos alimentos básicos, como mandioca e feijão, vem da agricultura familiar.', motivo: 'ignorou o papel alimentar' },
      { texto: 'Ela não gera empregos no campo', porque: 'A agricultura familiar responde pela maior parte das pessoas ocupadas no campo.', motivo: 'inverteu o papel do emprego' },
    ],
    licao: 'Agricultura familiar: maioria dos estabelecimentos e do emprego rural, menor parte da área.',
    dicas: ['Compare número de estabelecimentos e área ocupada.', 'Pense em alimentos básicos, como a mandioca.', 'Os grandes estabelecimentos ocupam muita terra.'],
  },
  {
    pergunta: 'Os grandes estabelecimentos agropecuários (acima de mil hectares) são, segundo o Censo Agropecuário de 2017, uma pequena parte do total, mas ocupam:',
    certa: { texto: 'Quase metade da área total dos estabelecimentos', porque: 'Menos de 1% dos estabelecimentos ocupa cerca de 47% da área, o que mostra a alta concentração fundiária.' },
    erradas: [
      { texto: 'Uma parcela insignificante da área', porque: 'Eles ocupam quase metade da área.', motivo: 'subestimou a concentração' },
      { texto: 'Exatamente 1% da área', porque: 'A concentração é muito maior: quase metade da área.', motivo: 'achou que área e número eram iguais' },
      { texto: 'Toda a área agrícola do país', porque: 'Outros estabelecimentos ocupam a outra parte.', motivo: 'exagerou a concentração' },
    ],
    licao: 'Menos de 1% dos estabelecimentos (acima de mil hectares) ocupa cerca de 47% da área: concentração fundiária.',
    dicas: ['Compare porcentagem de estabelecimentos e de área.', 'A diferença mostra a concentração.', 'É um dado do Censo Agropecuário de 2017.'],
  },
  {
    pergunta: 'Em que região brasileira está a maior parte da produção de fumo (tabaco), em pequenas propriedades familiares?',
    certa: { texto: 'Sul', porque: 'Rio Grande do Sul, Santa Catarina e Paraná concentram a produção, muitas vezes integrada a grandes empresas.' },
    erradas: [
      { texto: 'Norte', porque: 'O Norte não é o centro da produção de fumo.', motivo: 'trocou a região' },
      { texto: 'Centro-Oeste', porque: 'O Centro-Oeste destaca-se em grãos e pecuária.', motivo: 'trocou a região' },
      { texto: 'Sudeste, apenas no litoral', porque: 'O Sudeste não é o centro da produção.', motivo: 'trocou a região' },
    ],
    licao: 'Fumo: Região Sul, em pequenas propriedades familiares ligadas a empresas.',
    dicas: ['Pense nos três estados do Sul.', 'São propriedades pequenas.', 'Há integração com grandes empresas.'],
  },
]

/* ------------------------------------------------------------------ Entenda */

export interface PassoAgraria {
  titulo: string
  texto: string[]
  pare: PareEPense
  visual: 'sistemas' | 'intensivo' | 'lorenz' | 'verde' | 'leis' | 'fronteira'
}

export const PASSOS_AGRARIA: PassoAgraria[] = [
  {
    titulo: 'O espaço agrário e seus sistemas',
    texto: [
      'Chamamos de espaço agrário o território usado para a agricultura, a pecuária e o extrativismo. Ele é diferente de lugar para lugar: depende do clima, do solo, da tecnologia, de quem tem a terra, de quem trabalha nela e de para quem se produz.',
      'Para comparar, os geógrafos classificam os sistemas agrícolas por cinco perguntas: qual é o tamanho da propriedade, quem trabalha, que tecnologia se usa, para quem se produz e o que isso causa ao ambiente e à sociedade.',
    ],
    pare: { pergunta: 'Qual destas é uma pergunta útil para classificar um sistema agrícola?', opcoes: ['Qual é o destino da produção?', 'Qual é a cor do trator?', 'Quantos vizinhos o produtor tem?'], certa: 0, explicacao: 'O destino da produção (consumo, mercado interno ou exportação) é um dos critérios para distinguir os sistemas.' },
    visual: 'sistemas',
  },
  {
    titulo: 'Extensivo e intensivo',
    texto: [
      'Na produção extensiva, usa-se muita terra e pouco capital: a produção cresce quando a área aumenta. Na intensiva, usa-se muito capital, tecnologia ou trabalho em pouca terra: a produção cresce porque cada hectare produz mais.',
      'A produtividade é a produção dividida pela área, em toneladas por hectare, por exemplo. A produção total é o produto da área pela produtividade. Por isso, uma safra pode crescer porque a área aumentou, porque a produtividade subiu ou pelas duas razões.',
    ],
    pare: { pergunta: 'Uma fazenda de 200 hectares colhe 1.000 toneladas de milho. Qual é a produtividade?', opcoes: ['5 t/ha', '0,2 t/ha', '200.000 t/ha'], certa: 0, explicacao: 'Produtividade = 1.000 ÷ 200 = 5 toneladas por hectare.' },
    visual: 'intensivo',
  },
  {
    titulo: 'Revolução Verde e agronegócio',
    texto: [
      'A Revolução Verde, a partir de meados do século XX, difundiu sementes melhoradas, adubos químicos, agrotóxicos, irrigação e máquinas. A produtividade subiu muito, e a produção mundial de alimentos cresceu mais rápido do que a população.',
      'Em contrapartida, o pacote tecnológico custa caro e favoreceu quem tinha capital. Ele também trouxe problemas: contaminação por agrotóxicos, uso intenso de água e perda de diversidade de cultivos. No Brasil, a pesquisa da Embrapa (criada em 1973) adaptou variedades ao Cerrado e abriu caminho para a expansão do agronegócio.',
    ],
    pare: { pergunta: 'Qual foi um dos efeitos da Revolução Verde?', opcoes: ['Aumento da produtividade, mas dependência de insumos caros', 'Fim da necessidade de máquinas', 'Redução do uso de adubos químicos'], certa: 0, explicacao: 'A produtividade aumentou, mas o pacote de sementes, adubos e máquinas é caro e cria dependência de insumos.' },
    visual: 'verde',
  },
  {
    titulo: 'Estrutura fundiária e curva de Lorenz',
    texto: [
      'A estrutura fundiária mostra como a terra está dividida entre os estabelecimentos. Quando poucos donos têm muita área, dizemos que há concentração fundiária. A curva de Lorenz mede isso: no eixo horizontal está a porcentagem acumulada dos estabelecimentos, dos menores para os maiores; no vertical, a porcentagem acumulada da área.',
      'Se todos tivessem a mesma área, a curva seria a diagonal. Quanto mais a curva se afasta da diagonal, maior a concentração. O índice de Gini resume isso em um número de 0 (igualdade total) a 1 (um só dono de tudo): é o dobro da área entre a diagonal e a curva.',
    ],
    pare: { pergunta: 'Se o índice de Gini da terra de uma região é 0,9, o que isso indica?', opcoes: ['Concentração muito alta da terra', 'Distribuição quase igual da terra', 'Que a região não tem agricultura'], certa: 0, explicacao: 'Quanto mais perto de 1, mais concentrada a distribuição. 0,9 indica concentração muito alta.' },
    visual: 'lorenz',
  },
  {
    titulo: 'Reforma agrária, direitos e conflitos',
    texto: [
      'No Brasil, a concentração da terra vem de longe: das sesmarias coloniais e da Lei de Terras de 1850, que só permitia obter terra por compra. O Estatuto da Terra (1964) tratou da reforma agrária, e a Constituição de 1988 estabeleceu que a propriedade rural deve cumprir a função social, com uso racional, proteção ambiental, respeito às leis trabalhistas e bem-estar.',
      'O imóvel que não cumpre a função social pode ser desapropriado para a reforma agrária, com indenização em títulos da dívida agrária; propriedade produtiva não pode ser desapropriada para esse fim. Movimentos como o MST (1984) e a CPT (1975) atuam na defesa do acesso à terra, e a grilagem e os conflitos no campo continuam sendo problemas graves.',
    ],
    pare: { pergunta: 'A Constituição de 1988 permite desapropriar para reforma agrária:', opcoes: ['Imóvel rural que não cumpre a função social, com indenização', 'Qualquer propriedade produtiva, sem indenização', 'Apenas imóveis urbanos'], certa: 0, explicacao: 'A desapropriação para reforma agrária atinge imóvel rural que não cumpre a função social, mediante indenização; a propriedade produtiva não pode ser desapropriada para esse fim.' },
    visual: 'leis',
  },
  {
    titulo: 'Fronteira agrícola e meio ambiente',
    texto: [
      'Fronteira agrícola é a área onde a agricultura avança sobre vegetação nativa. No Brasil, ela se deslocou do Sul e do Sudeste para o Centro-Oeste e, depois, para o MATOPIBA (Maranhão, Tocantins, Piauí e Bahia) e o sul da Amazônia.',
      'A expansão traz renda e exportações, mas também desmatamento, perda de biodiversidade, erosão e uso intenso de agrotóxicos. Práticas como o plantio direto, a dupla safra, a integração lavoura-pecuária-floresta e a agroecologia buscam produzir mais com menos impacto.',
    ],
    pare: { pergunta: 'O que é fronteira agrícola?', opcoes: ['Área em que a agricultura avança sobre vegetação nativa', 'Divisa entre dois países produtores', 'Linha que separa lavouras e pastos'], certa: 0, explicacao: 'É a faixa onde a ocupação agrícola avança sobre áreas de vegetação nativa, como o Cerrado e a Amazônia.' },
    visual: 'fronteira',
  },
]

export const RESUMO_AGRARIA: SecaoResumo[] = [
  {
    titulo: 'Sistemas agrícolas',
    formulas: [{ rotulo: 'Produtividade', tex: '\\text{produtividade} = \\dfrac{\\text{produção}}{\\text{área}}' }],
    ideias: [
      'Extensivo: muita terra, pouco capital. Intensivo: muito capital, tecnologia ou trabalho por hectare.',
      'Plantation: grande propriedade monocultora para exportação. Agricultura familiar: trabalho da família, consumo e mercado interno. Agronegócio: grande escala, tecnologia e exportação.',
      'Itinerante (coivara): derruba, queima, cultiva pouco tempo e deixa em pousio. Cinturão-verde: hortaliças perto da cidade.',
    ],
    pegadinhas: ['Achar que intensivo significa grande propriedade.', 'Confundir agricultura familiar com subsistência pura: ela também vende.', 'Achar que orgânica e agroecologia são o mesmo que agricultura de subsistência.'],
    fontes: FONTES_AGRARIA,
  },
  {
    titulo: 'Estrutura fundiária',
    formulas: [
      { rotulo: 'Gini a partir da curva de Lorenz (faixas)', tex: 'G = 1 - \\sum_i (p_i - p_{i-1})\\,(L_i + L_{i-1})' },
      { rotulo: 'Curva de Lorenz modelo e seu Gini', tex: 'L(p) = p^k,\\quad G = \\dfrac{k-1}{k+1}' },
    ],
    ideias: [
      'Latifúndio: grande propriedade, muitas vezes improdutiva. Minifúndio: pequena demais para sustentar a família.',
      'Gini da terra: 0 é igualdade total e 1 é um só dono de tudo. Quanto mais afastada da diagonal, mais concentrada a curva de Lorenz.',
      'Censo Agropecuário 2017 (IBGE): menos de 1% dos estabelecimentos, com mais de mil hectares, ocupa cerca de 47% da área.',
    ],
    pegadinhas: ['Confundir a área sob a curva com o Gini: o Gini é o dobro da área entre a diagonal e a curva.', 'Achar que Gini alto significa terra bem distribuída.', 'Confundir número de estabelecimentos com área ocupada.'],
    fontes: FONTES_AGRARIA,
  },
  {
    titulo: 'Questão agrária no Brasil',
    formulas: [],
    ideias: [
      'Lei de Terras (1850): terra só por compra. Estatuto da Terra (1964): reforma agrária e função social. Constituição de 1988: função social (art. 186) e desapropriação com títulos da dívida agrária (art. 184).',
      'Propriedade produtiva não pode ser desapropriada para reforma agrária (art. 185). Grilagem: apropriação ilegal de terra. MST (1984) e CPT (1975): movimentos pelo acesso à terra.',
      'Fronteira agrícola: Centro-Oeste, MATOPIBA e sul da Amazônia. Embrapa (1973), plantio direto e dupla safra viabilizaram a soja no Cerrado.',
    ],
    pegadinhas: ['Atribuir a Lei de Terras à abolição: ela é de 1850, antes da Lei Áurea.', 'Achar que a função social depende só do tamanho do imóvel.', 'Achar que reforma agrária é só distribuir terra, sem crédito nem apoio técnico.'],
    fontes: FONTES_AGRARIA,
  },
]
