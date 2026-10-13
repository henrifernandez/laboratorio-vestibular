import type { Ficha } from './tipos'

/**
 * Fichas rápidas: o card que abre ao clicar num acontecimento da linha do tempo.
 * Só fatos consagrados nos livros de referência (as mesmas fontes de cada acontecimento); sem citações literais.
 * Processos longos não têm gatilho único, e por isso o campo fica de fora.
 */
export const FICHAS: Record<string, Ficha> = {
  /* ---------------------------------------------------------------- Antiguidade e Idade Média */
  'm-escrita': {
    gatilho: 'Necessidade de registrar colheitas, impostos e trocas nos templos das primeiras cidades.',
    marcos: ['c. 3200 a.C.: tabuinhas de argila com escrita cuneiforme em Uruk, na Mesopotâmia', 'c. 3100 a.C.: hieróglifos no Egito'],
    pessoas: ['Sumérios, criadores do cuneiforme', 'Escribas dos templos e palácios'],
  },
  'm-egito': {
    gatilho: 'Unificação do Alto e do Baixo Egito sob um só rei.',
    marcos: ['c. 3100 a.C.: unificação, atribuída pela tradição ao rei Menés', 'c. 2560 a.C.: Grande Pirâmide de Gizé, do faraó Quéops', '30 a.C.: morte de Cleópatra e conquista romana'],
    pessoas: ['Faraós, como Quéops, Ramsés II e Cleópatra', 'Sacerdotes e escribas', 'Camponeses do Nilo'],
  },
  'm-hamurabi': {
    gatilho: 'Unificação da Mesopotâmia sob o domínio da Babilônia.',
    marcos: ['c. 1792 a.C.: Hamurábi se torna rei da Babilônia', 'c. 1750 a.C.: leis gravadas numa estela de pedra'],
    pessoas: ['Hamurábi, rei da Babilônia'],
  },
  'm-republica-romana': {
    gatilho: 'Expulsão do último rei, segundo a tradição romana (509 a.C.).',
    marcos: ['c. 450 a.C.: Lei das Doze Tábuas, primeiras leis escritas de Roma', '264–146 a.C.: Guerras Púnicas contra Cartago', '44 a.C.: assassinato de Júlio César'],
    pessoas: ['Patrícios e plebeus', 'Júlio César', 'Aníbal, general de Cartago'],
  },
  'm-atenas': {
    gatilho: 'Reformas de Clístenes, em 508 a.C.',
    marcos: ['508 a.C.: reformas de Clístenes', 'Século V a.C.: auge da democracia, com Péricles', '322 a.C.: o domínio macedônico encerra a democracia'],
    pessoas: ['Clístenes', 'Péricles', 'Cidadãos homens; mulheres, escravizados e estrangeiros ficavam de fora'],
  },
  'm-alexandre': {
    gatilho: 'Morte de Filipe II e subida de Alexandre ao trono da Macedônia (336 a.C.).',
    marcos: ['334 a.C.: invasão do Império Persa', '331 a.C.: fundação de Alexandria, no Egito', '323 a.C.: morte de Alexandre na Babilônia'],
    pessoas: ['Alexandre Magno', 'Aristóteles, seu professor', 'Dario III, rei persa derrotado'],
  },
  'm-imperio-romano': {
    gatilho: 'Otávio recebe do Senado o título de Augusto (27 a.C.).',
    marcos: ['27 a.C.: Otávio Augusto, primeiro imperador', '117: maior extensão do império, com Trajano', '395: divisão entre Ocidente e Oriente', '476: deposição do último imperador do Ocidente'],
    pessoas: ['Otávio Augusto', 'Constantino, imperador que tolerou os cristãos', 'Teodósio, que tornou o cristianismo oficial'],
  },
  'm-cristianismo': {
    gatilho: 'Pregação de Jesus e dos apóstolos na Judeia, então província romana.',
    marcos: ['c. 30: crucificação de Jesus em Jerusalém', '64: perseguição aos cristãos em Roma, sob Nero', '313: Edito de Milão, liberdade de culto', '380: Edito de Tessalônica, religião oficial'],
    pessoas: ['Jesus de Nazaré', 'Paulo de Tarso, apóstolo', 'Imperadores Constantino e Teodósio'],
  },
  'm-queda-roma': {
    gatilho: 'O chefe germânico Odoacro depõe o imperador Rômulo Augusto (476).',
    marcos: ['410: saque de Roma pelos visigodos', '455: saque de Roma pelos vândalos', '476: fim do Império Romano do Ocidente'],
    pessoas: ['Odoacro, chefe germânico', 'Rômulo Augusto, último imperador do Ocidente', 'Povos germânicos: visigodos, vândalos, francos'],
  },
  'm-islamismo': {
    gatilho: 'Pregação de Maomé em Meca e sua ida para Medina, a Hégira (622).',
    marcos: ['622: Hégira, início do calendário islâmico', '632: morte de Maomé', '711: os muçulmanos entram na Península Ibérica', '732: derrota muçulmana em Poitiers, na França'],
    pessoas: ['Maomé', 'Califas, seus sucessores', 'Carlos Martel, vencedor em Poitiers'],
  },
  'm-carlos-magno': {
    gatilho: 'Coroação pelo papa Leão III, no Natal de 800.',
    marcos: ['800: coroação como imperador', '814: morte de Carlos Magno', '843: Tratado de Verdun divide o império entre os netos'],
    pessoas: ['Carlos Magno, rei dos francos', 'Papa Leão III'],
  },
  'm-feudalismo': {
    marcos: ['c. 900: invasões de vikings, magiares e muçulmanos fortalecem os senhores locais', 'Séculos XI–XIII: auge da servidão e dos laços de suserania e vassalagem', 'Século XIV: fome, peste e revoltas abalam o sistema'],
    pessoas: ['Senhores feudais (nobreza)', 'Servos camponeses', 'Clero, também dono de terras'],
  },
  'm-renascimento-comercial': {
    marcos: ['c. 1000: mais produção agrícola e crescimento da população', 'Séculos XII–XIII: feiras de Champagne, na França', 'Século XIII: Veneza e Gênova dominam o comércio do Mediterrâneo'],
    pessoas: ['Burgueses: mercadores e artesãos', 'Corporações de ofício', 'Banqueiros italianos'],
  },
  'm-cisma': {
    gatilho: 'Excomunhões mútuas entre o enviado do papa e o patriarca de Constantinopla (1054).',
    marcos: ['1054: separação entre a Igreja católica romana e a Igreja ortodoxa'],
    pessoas: ['Cardeal Humberto, enviado do papa Leão IX', 'Miguel Cerulário, patriarca de Constantinopla'],
  },
  'm-cruzadas': {
    gatilho: 'Apelo do papa Urbano II no Concílio de Clermont (1095).',
    marcos: ['1099: os cruzados tomam Jerusalém', '1187: Saladino retoma Jerusalém', '1204: a Quarta Cruzada saqueia Constantinopla', '1291: queda de Acre, último reduto cruzado'],
    pessoas: ['Papa Urbano II', 'Saladino, sultão muçulmano', 'Ordens militares, como os Templários'],
  },
  'm-magna-carta': {
    gatilho: 'Revolta dos barões contra os impostos e as derrotas militares de João Sem-Terra.',
    marcos: ['1215: o rei sela a Magna Carta', '1265: Parlamento convocado por Simon de Montfort'],
    pessoas: ['João Sem-Terra, rei da Inglaterra', 'Barões ingleses'],
  },
  'm-renascimento': {
    marcos: ['c. 1450: prensa de tipos móveis de Gutenberg', 'c. 1503: Leonardo começa a pintar a Mona Lisa', '1508–1512: Michelangelo pinta o teto da Capela Sistina', '1532: publicação de O príncipe, de Maquiavel'],
    pessoas: ['Leonardo da Vinci', 'Michelangelo', 'Maquiavel', 'Mecenas, como os Médici de Florença'],
  },
  'm-cem-anos': {
    gatilho: 'Disputa pela sucessão do trono da França e por territórios.',
    marcos: ['1337: início da guerra', '1346: vitória inglesa em Crécy', '1429: Joana d’Arc rompe o cerco de Orléans', '1453: fim da guerra, com vitória francesa'],
    pessoas: ['Joana d’Arc', 'Reis da França e da Inglaterra'],
  },
  'm-peste': {
    gatilho: 'A doença chega à Europa em navios vindos do mar Negro (1347).',
    marcos: ['1347: a peste chega à Sicília', '1348: atinge Florença, Paris e Londres', '1351: a primeira grande onda perde força'],
    pessoas: ['Camponeses e moradores das cidades: entre um terço e metade da Europa morre', 'Judeus, perseguidos sob a acusação de espalhar a doença'],
  },
  'b-marajoara': {
    marcos: ['c. 400: começam os aterros (tesos) na ilha de Marajó', 'c. 1400: a cultura marajoara declina, antes da chegada dos europeus'],
    pessoas: ['Povos indígenas da ilha de Marajó, cujos nomes não chegaram até nós'],
  },

  /* ---------------------------------------------------------------- Mundo, de 1453 em diante */
  'm-constantinopla': {
    gatilho: 'Cerco otomano à cidade, com canhões de grande porte (1453).',
    marcos: ['1453: Mehmed II toma Constantinopla e encerra o Império Bizantino', '1453: a cidade se torna a capital otomana (Istambul)'],
    pessoas: ['Mehmed II, sultão otomano', 'Constantino XI, último imperador bizantino'],
  },
  'm-colombo': {
    gatilho: 'Os Reis Católicos aceitam financiar a viagem pelo Ocidente (1492).',
    marcos: ['1492: tomada de Granada, fim da Reconquista espanhola', '1492: chegada ao Caribe, em 12 de outubro', '1493–1504: mais três viagens de Colombo'],
    pessoas: ['Cristóvão Colombo, navegador genovês', 'Isabel de Castela e Fernando de Aragão, os Reis Católicos'],
  },
  'm-tordesilhas': {
    gatilho: 'Bula papal de 1493, que favorecia a Espanha.',
    marcos: ['1493: bula fixa uma linha a 100 léguas de Cabo Verde', '1494: o tratado leva a linha para 370 léguas a oeste de Cabo Verde'],
    pessoas: ['Papa Alexandre VI', 'Dom João II, rei de Portugal', 'Reis Católicos da Espanha'],
  },
  'm-reforma': {
    gatilho: 'Venda de indulgências para financiar a Basílica de São Pedro.',
    marcos: ['1517: 95 teses de Lutero', '1521: Lutero é excomungado', '1534: Henrique VIII cria a Igreja Anglicana', '1545–1563: Concílio de Trento (Contrarreforma)'],
    pessoas: ['Martinho Lutero', 'João Calvino, em Genebra', 'Henrique VIII, rei da Inglaterra', 'Inácio de Loyola, fundador dos jesuítas'],
  },
  'm-revolucoes-inglesas': {
    gatilho: 'Conflito entre o rei Carlos I e o Parlamento por impostos e religião.',
    marcos: ['1642–1649: guerra civil; Carlos I é executado em 1649', '1653–1658: Cromwell governa como Lorde Protetor', '1688–1689: Revolução Gloriosa e Declaração de Direitos'],
    pessoas: ['Carlos I, rei executado', 'Oliver Cromwell, líder puritano', 'Guilherme de Orange e Maria II, reis depois de 1688'],
  },
  'm-iluminismo': {
    marcos: ['1689: Locke publica os Dois tratados sobre o governo', '1748: O espírito das leis, de Montesquieu', '1751–1772: Enciclopédia, de Diderot e d’Alembert', '1762: O contrato social, de Rousseau'],
    pessoas: ['John Locke', 'Montesquieu', 'Voltaire', 'Rousseau', 'Diderot'],
  },
  'm-rev-industrial': {
    marcos: ['1769: James Watt patenteia seu aperfeiçoamento da máquina a vapor', '1811–1816: ludismo, a quebra de máquinas', '1830: ferrovia Liverpool–Manchester'],
    pessoas: ['James Watt', 'Burguesia industrial', 'Operariado, a nova classe das fábricas'],
  },
  'm-independencia-eua': {
    gatilho: 'Novos impostos britânicos, como a Lei do Selo (1765) e a lei do chá (1773).',
    marcos: ['1773: Festa do Chá de Boston', '1776: Declaração de Independência, em 4 de julho', '1783: Tratado de Paris reconhece a independência', '1787: Constituição dos EUA'],
    pessoas: ['Thomas Jefferson, redator da Declaração', 'George Washington, comandante e primeiro presidente', 'Benjamin Franklin, diplomata na França'],
  },
  'm-rev-francesa': {
    gatilho: 'Crise financeira do Estado e convocação dos Estados Gerais (1789).',
    marcos: ['1789: queda da Bastilha e Declaração dos Direitos do Homem e do Cidadão', '1792: proclamação da República', '1793–1794: Terror jacobino', '1799: golpe do 18 Brumário'],
    pessoas: ['Luís XVI, guilhotinado em 1793', 'Robespierre, líder jacobino', 'Napoleão Bonaparte, autor do golpe de 1799'],
  },
  'm-haiti': {
    gatilho: 'Revolta dos escravizados no norte de São Domingos, em agosto de 1791.',
    marcos: ['1791: início da revolta', '1794: a França abole a escravidão nas colônias', '1802: Napoleão tenta retomar o controle e prende Toussaint', '1804: independência do Haiti'],
    pessoas: ['Toussaint Louverture', 'Jean-Jacques Dessalines, que proclamou a independência'],
  },
  'm-napoleao': {
    gatilho: 'Golpe do 18 Brumário (1799).',
    marcos: ['1804: Código Civil e coroação como imperador', '1806: Bloqueio Continental', '1812: fracasso da invasão da Rússia', '1815: derrota em Waterloo e Congresso de Viena'],
    pessoas: ['Napoleão Bonaparte', 'Duque de Wellington, vencedor em Waterloo'],
  },
  'm-independencias-hispano': {
    gatilho: 'Invasão da Espanha por Napoleão (1808) e prisão do rei Fernando VII.',
    marcos: ['1810: juntas de governo em Caracas, Buenos Aires e outras cidades', '1816: independência das Províncias Unidas do Rio da Prata', '1821: independência do México', '1824: batalha de Ayacucho, última grande vitória'],
    pessoas: ['Simón Bolívar', 'José de San Martín', 'Elites criollas'],
  },
  'm-primavera-povos': {
    gatilho: 'Revolução de fevereiro de 1848 em Paris, em meio à crise econômica e à fome.',
    marcos: ['1848: publicação do Manifesto Comunista', '1848: cai a monarquia de Luís Filipe, na França', '1848: revoltas em Viena, Berlim e na Itália'],
    pessoas: ['Karl Marx e Friedrich Engels', 'Operários e liberais de várias cidades'],
  },
  'm-unificacoes': {
    gatilho: 'Guerras conduzidas pelo Piemonte, na Itália, e pela Prússia, na Alemanha.',
    marcos: ['1861: proclamação do Reino da Itália', '1870: Roma é incorporada à Itália', '1871: proclamação do Império Alemão, em Versalhes'],
    pessoas: ['Cavour e Garibaldi, na Itália', 'Otto von Bismarck, na Alemanha', 'Guilherme I, imperador alemão'],
  },
  'm-secessao': {
    gatilho: 'Eleição de Lincoln (1860) e saída dos estados escravistas do Sul.',
    marcos: ['1861: ataque ao Forte Sumter inicia a guerra', '1863: Proclamação de Emancipação', '1865: rendição do Sul e 13ª Emenda, que abole a escravidão'],
    pessoas: ['Abraham Lincoln', 'Jefferson Davis, presidente da Confederação', 'Generais Ulysses Grant (Norte) e Robert E. Lee (Sul)'],
  },
  'm-segunda-rev-industrial': {
    marcos: ['1856: processo Bessemer barateia o aço', '1879: lâmpada elétrica de Edison', '1908: Ford Modelo T', '1913: linha de montagem móvel de Ford'],
    pessoas: ['Thomas Edison', 'Henry Ford', 'Grandes empresas: trustes e cartéis'],
  },
  'm-imperialismo': {
    marcos: ['1839–1842: Guerra do Ópio abre a China aos britânicos', '1884–1885: Conferência de Berlim divide a África', '1899–1902: Guerra dos Bôeres, na África do Sul'],
    pessoas: ['Leopoldo II da Bélgica, dono do Congo', 'Cecil Rhodes, na África do Sul'],
  },
  'm-comuna': {
    gatilho: 'Derrota francesa na guerra contra a Prússia e cerco de Paris.',
    marcos: ['1871: em março, operários e a Guarda Nacional assumem Paris', '1871: em maio, a Semana Sangrenta esmaga a Comuna'],
    pessoas: ['Operários parisienses e Guarda Nacional', 'Adolphe Thiers, chefe do governo que reprimiu a Comuna'],
  },
  'm-berlim': {
    gatilho: 'Disputa entre as potências europeias pela bacia do rio Congo.',
    marcos: ['1884: Bismarck convoca a conferência', '1885: a Ata Geral exige ocupação efetiva para reconhecer uma colônia'],
    pessoas: ['Otto von Bismarck, anfitrião', 'Leopoldo II, que obteve o Estado Livre do Congo'],
  },
  'm-russo-japonesa': {
    gatilho: 'Disputa pela Manchúria e pela Coreia; ataque japonês a Port Arthur (1904).',
    marcos: ['1904: ataque japonês a Port Arthur', '1905: derrota da frota russa em Tsushima', '1905: Tratado de Portsmouth e revolução na Rússia'],
    pessoas: ['Czar Nicolau II', 'Imperador Meiji, do Japão'],
  },
  'm-1gm': {
    gatilho: 'Assassinato do arquiduque Francisco Ferdinando em Sarajevo (junho de 1914).',
    marcos: ['1914: começa a guerra de trincheiras', '1917: os EUA entram na guerra; revolução na Rússia', '1918: a Rússia sai da guerra e o armistício é assinado em 11 de novembro'],
    pessoas: ['Francisco Ferdinando, herdeiro austro-húngaro', 'Gavrilo Princip, autor do atentado', 'Guilherme II, imperador alemão'],
  },
  'm-rev-russa': {
    gatilho: 'Derrotas na guerra, fome e greves em Petrogrado.',
    marcos: ['1917: em fevereiro, queda do czar e governo provisório', '1917: em outubro, os bolcheviques tomam o poder', '1918–1921: guerra civil', '1922: criação da URSS'],
    pessoas: ['Nicolau II, último czar', 'Lênin, líder bolchevique', 'Trótski, organizador do Exército Vermelho', 'Kerenski, chefe do governo provisório'],
  },
  'm-versalhes': {
    gatilho: 'Derrota alemã e Conferência de Paz de Paris.',
    marcos: ['1919: assinatura do tratado, em 28 de junho', '1920: começa a funcionar a Liga das Nações'],
    pessoas: ['Woodrow Wilson, presidente dos EUA', 'Georges Clemenceau, da França', 'David Lloyd George, do Reino Unido'],
  },
  'm-crise-1929': {
    gatilho: 'Quebra da Bolsa de Nova York, em outubro de 1929.',
    marcos: ['1929: quebra da Bolsa de Nova York', '1930–1933: falência de bancos e desemprego em massa', '1933: início do New Deal'],
    pessoas: ['Herbert Hoover, presidente dos EUA na quebra', 'Franklin Roosevelt, que lançou o New Deal'],
  },
  'm-new-deal': {
    gatilho: 'Posse de Roosevelt, em 1933, no auge do desemprego.',
    marcos: ['1933: primeiros cem dias, com obras públicas e controle dos bancos', '1935: Lei de Seguridade Social'],
    pessoas: ['Franklin Roosevelt', 'John Maynard Keynes, economista que defendia o gasto público nas crises'],
  },
  'm-nazifascismo': {
    marcos: ['1922: Marcha sobre Roma leva Mussolini ao poder', '1923: fracassa o golpe de Hitler em Munique', '1933: Hitler se torna chanceler da Alemanha'],
    pessoas: ['Benito Mussolini', 'Adolf Hitler'],
  },
  'm-2gm': {
    gatilho: 'Invasão da Polônia pela Alemanha, em 1º de setembro de 1939.',
    marcos: ['1941: invasão da URSS e ataque japonês a Pearl Harbor', '1942–1943: batalha de Stalingrado', '1944: Dia D, desembarque na Normandia', '1945: rendição alemã (maio) e japonesa (setembro)'],
    pessoas: ['Adolf Hitler', 'Winston Churchill', 'Franklin Roosevelt', 'Josef Stalin'],
  },
  'm-holocausto': {
    gatilho: 'Invasão da URSS (1941), com fuzilamentos em massa; em 1942, a Conferência de Wannsee organiza o extermínio.',
    marcos: ['1935: Leis de Nuremberg tiram direitos dos judeus', '1938: Noite dos Cristais', '1942: Conferência de Wannsee', '1945: libertação dos campos, como Auschwitz'],
    pessoas: ['Adolf Hitler', 'Heinrich Himmler, chefe da SS', 'Cerca de 6 milhões de judeus assassinados, além de ciganos e outros grupos'],
  },
  'm-atomicas': {
    gatilho: 'Recusa do Japão em se render depois da Declaração de Potsdam.',
    marcos: ['1945: Hiroshima, em 6 de agosto', '1945: Nagasaki, em 9 de agosto', '1945: rendição do Japão, anunciada em 15 de agosto'],
    pessoas: ['Harry Truman, presidente dos EUA', 'Imperador Hirohito'],
  },
  'm-onu': {
    gatilho: 'Fim da Segunda Guerra e fracasso da Liga das Nações.',
    marcos: ['1945: Carta da ONU assinada em São Francisco', '1948: Declaração Universal dos Direitos Humanos'],
    pessoas: ['EUA, URSS, Reino Unido, França e China, membros permanentes do Conselho de Segurança'],
  },
  'm-guerra-fria': {
    gatilho: 'Doutrina Truman (1947), de contenção do comunismo.',
    marcos: ['1949: criação da OTAN', '1955: Pacto de Varsóvia', '1961: construção do Muro de Berlim', '1962: Crise dos Mísseis', '1989–1991: queda do Muro e fim da URSS'],
    pessoas: ['Harry Truman', 'Josef Stalin', 'John Kennedy e Nikita Khruschov', 'Mikhail Gorbatchev'],
  },
  'm-marshall': {
    gatilho: 'Destruição da Europa e medo do avanço comunista.',
    marcos: ['1947: George Marshall anuncia o plano', '1948–1952: ajuda aos países da Europa Ocidental'],
    pessoas: ['George Marshall, secretário de Estado dos EUA'],
  },
  'm-rev-chinesa': {
    gatilho: 'Vitória dos comunistas na guerra civil contra os nacionalistas do Kuomintang.',
    marcos: ['1934–1935: Longa Marcha', '1949: proclamação da República Popular, em 1º de outubro', '1949: os nacionalistas se refugiam em Taiwan'],
    pessoas: ['Mao Tsé-tung', 'Chiang Kai-shek, líder nacionalista'],
  },
  'm-descolonizacao': {
    marcos: ['1947: independência da Índia e do Paquistão', '1954–1962: guerra de independência da Argélia', '1955: Conferência de Bandung', '1960: dezessete países africanos se tornam independentes', '1975: independência de Angola e Moçambique'],
    pessoas: ['Mahatma Gandhi', 'Kwame Nkrumah, de Gana', 'Agostinho Neto, de Angola'],
  },
  'm-india': {
    gatilho: 'Pressão do movimento de independência e enfraquecimento britânico depois da guerra.',
    marcos: ['1930: Marcha do Sal', '1947: independência e partilha entre Índia e Paquistão', '1948: Gandhi é assassinado'],
    pessoas: ['Mahatma Gandhi', 'Jawaharlal Nehru, primeiro-ministro', 'Muhammad Ali Jinnah, fundador do Paquistão'],
  },
  'm-cuba': {
    gatilho: 'Guerrilha contra a ditadura de Fulgencio Batista.',
    marcos: ['1953: ataque ao Quartel Moncada', '1959: Batista foge e os guerrilheiros tomam Havana', '1961: fracassa a invasão da Baía dos Porcos', '1961: Fidel declara o caráter socialista da revolução'],
    pessoas: ['Fidel Castro', 'Che Guevara', 'Fulgencio Batista, ditador deposto'],
  },
  'm-misseis': {
    gatilho: 'Aviões espiões dos EUA fotografam mísseis soviéticos em Cuba, em outubro de 1962.',
    marcos: ['1962: bloqueio naval dos EUA a Cuba', '1962: a URSS retira os mísseis e os EUA prometem não invadir Cuba', '1963: linha direta entre Washington e Moscou'],
    pessoas: ['John Kennedy', 'Nikita Khruschov', 'Fidel Castro'],
  },
  'm-vietna': {
    gatilho: 'Divisão do Vietnã em 1954, depois da derrota francesa.',
    marcos: ['1954: batalha de Dien Bien Phu e Acordos de Genebra', '1964: incidente do Golfo de Tonkin amplia a ação dos EUA', '1968: Ofensiva do Tet', '1975: queda de Saigon'],
    pessoas: ['Ho Chi Minh', 'Lyndon Johnson e Richard Nixon, presidentes dos EUA'],
  },
  'm-maio-68': {
    gatilho: 'Protestos estudantis em Nanterre e na Sorbonne, em Paris.',
    marcos: ['1968: barricadas em Paris e greve geral na França', '1968: Primavera de Praga e protestos contra a Guerra do Vietnã'],
    pessoas: ['Estudantes e operários franceses', 'Charles de Gaulle, presidente da França'],
  },
  'm-petroleo-73': {
    gatilho: 'Guerra do Yom Kippur, em outubro de 1973.',
    marcos: ['1973: países árabes da Opep cortam a produção e fazem embargo aos EUA', '1973–1974: o preço do barril quadruplica', '1979: segundo choque, com a Revolução Iraniana'],
    pessoas: ['Opep, a organização dos países exportadores de petróleo'],
  },
  'm-chile-73': {
    gatilho: 'Crise econômica e polarização no governo socialista de Allende.',
    marcos: ['1970: eleição de Salvador Allende', '1973: bombardeio do palácio La Moneda, em 11 de setembro', '1973–1990: ditadura de Pinochet'],
    pessoas: ['Salvador Allende', 'Augusto Pinochet'],
  },
  'm-neoliberalismo': {
    gatilho: 'Estagflação dos anos 1970.',
    marcos: ['1979: Thatcher chega ao poder no Reino Unido', '1981: Reagan assume nos EUA', '1989: Consenso de Washington'],
    pessoas: ['Margaret Thatcher', 'Ronald Reagan', 'Friedrich Hayek e Milton Friedman, economistas'],
  },
  'm-muro-1989': {
    gatilho: 'Anúncio confuso da abertura das fronteiras, em 9 de novembro de 1989.',
    marcos: ['1989: abertura do Muro, em 9 de novembro', '1990: reunificação da Alemanha, em 3 de outubro'],
    pessoas: ['Mikhail Gorbatchev', 'Helmut Kohl, chanceler da reunificação', 'Günter Schabowski, que anunciou a abertura'],
  },
  'm-urss-1991': {
    gatilho: 'Tentativa de golpe da ala conservadora, em agosto de 1991.',
    marcos: ['1985: Gorbatchev assume e lança a glasnost e a perestroika', '1991: golpe fracassado, em agosto', '1991: fim da URSS e criação da CEI, em dezembro'],
    pessoas: ['Mikhail Gorbatchev', 'Boris Iéltsin'],
  },
  'm-apartheid': {
    gatilho: 'Pressão interna e sanções internacionais contra o regime.',
    marcos: ['1948: o apartheid vira política oficial', '1990: libertação de Nelson Mandela', '1994: primeiras eleições multirraciais'],
    pessoas: ['Nelson Mandela', 'Frederik de Klerk, último presidente do apartheid', 'Desmond Tutu, arcebispo'],
  },
  'm-11-setembro': {
    gatilho: 'Ataques da Al-Qaeda com aviões sequestrados.',
    marcos: ['2001: ataques às Torres Gêmeas e ao Pentágono', '2001: invasão do Afeganistão', '2003: invasão do Iraque'],
    pessoas: ['Osama bin Laden, líder da Al-Qaeda', 'George W. Bush, presidente dos EUA'],
  },
  'm-crise-2008': {
    gatilho: 'Falência do banco Lehman Brothers, em setembro de 2008.',
    marcos: ['2007: crise das hipotecas de alto risco nos EUA', '2008: quebra do Lehman Brothers', '2010: crise das dívidas na zona do euro, a começar pela Grécia'],
    pessoas: ['Bancos de investimento e agências de risco', 'Governos dos EUA e da Europa, que socorreram bancos'],
  },

  /* ---------------------------------------------------------------- Brasil */
  'b-1500': {
    gatilho: 'A esquadra de Cabral, a caminho das Índias, se afasta para oeste no Atlântico.',
    marcos: ['1500: chegada ao litoral da Bahia, em 22 de abril', '1500: carta de Pero Vaz de Caminha ao rei', '1501–1502: expedições reconhecem a costa'],
    pessoas: ['Pedro Álvares Cabral', 'Pero Vaz de Caminha, escrivão', 'Povos tupis do litoral'],
  },
  'b-capitanias': {
    gatilho: 'Ameaça de franceses que traficavam pau-brasil no litoral.',
    marcos: ['1530–1532: expedição de Martim Afonso de Sousa', '1532: fundação de São Vicente', '1534: divisão da costa em capitanias'],
    pessoas: ['Dom João III, rei de Portugal', 'Donatários, como Duarte Coelho, de Pernambuco', 'Martim Afonso de Sousa'],
  },
  'b-governo-geral': {
    gatilho: 'Fracasso da maioria das capitanias.',
    marcos: ['1549: Tomé de Sousa funda Salvador', '1549: chegam os jesuítas', '1554: fundação do colégio de São Paulo'],
    pessoas: ['Tomé de Sousa', 'Manuel da Nóbrega, jesuíta', 'José de Anchieta, jesuíta'],
  },
  'b-acucar': {
    marcos: ['1535: Duarte Coelho chega a Pernambuco, futuro centro açucareiro', '1630–1654: holandeses ocupam o Nordeste açucareiro', 'Século XVII: concorrência do açúcar das Antilhas'],
    pessoas: ['Senhores de engenho', 'Africanos escravizados', 'Comerciantes holandeses, que refinavam e vendiam o açúcar'],
  },
  'b-trafico': {
    marcos: ['c. 1550: chegada regular de africanos escravizados', '1831: lei proíbe o tráfico, mas não é cumprida', '1850: Lei Eusébio de Queirós encerra o tráfico'],
    pessoas: ['Traficantes e comerciantes do Atlântico Sul', 'Cerca de 5 milhões de africanos trazidos à força'],
  },
  'b-uniao-iberica': {
    gatilho: 'Morte de dom Sebastião em Alcácer-Quibir (1578) e crise de sucessão em Portugal.',
    marcos: ['1578: dom Sebastião desaparece na batalha de Alcácer-Quibir', '1580: Filipe II da Espanha assume o trono português', '1640: Restauração, com dom João IV'],
    pessoas: ['Dom Sebastião', 'Filipe II da Espanha', 'Dom João IV'],
  },
  'b-holandeses': {
    gatilho: 'Guerra entre a Espanha e a Holanda durante a União Ibérica.',
    marcos: ['1624–1625: ocupação de Salvador', '1630: tomada de Olinda e Recife', '1637–1644: governo de Maurício de Nassau', '1654: rendição holandesa'],
    pessoas: ['Maurício de Nassau', 'Companhia das Índias Ocidentais', 'Henrique Dias, Felipe Camarão e André Vidal de Negreiros, na expulsão'],
  },
  'b-palmares': {
    marcos: ['c. 1600: formação do quilombo na serra da Barriga', '1678: acordo de Ganga Zumba com o governador', '1694: destruição do mocambo do Macaco', '1695: Zumbi é morto, em 20 de novembro'],
    pessoas: ['Ganga Zumba', 'Zumbi', 'Domingos Jorge Velho, bandeirante'],
  },
  'b-mineracao': {
    gatilho: 'Descoberta de ouro pelos bandeirantes, no fim do século XVII.',
    marcos: ['1707–1709: Guerra dos Emboabas', '1720: Revolta de Vila Rica', '1763: a capital passa para o Rio de Janeiro'],
    pessoas: ['Bandeirantes paulistas', 'Filipe dos Santos, executado em 1720', 'Africanos escravizados nas minas'],
  },
  'b-pombal': {
    gatilho: 'Dom José I torna Pombal ministro (1750), em meio à crise do ouro.',
    marcos: ['1755: terremoto de Lisboa e reconstrução da cidade', '1759: expulsão dos jesuítas', '1763: capital no Rio de Janeiro', '1777: Pombal é afastado'],
    pessoas: ['Marquês de Pombal', 'Dom José I, rei de Portugal'],
  },
  'b-inconfidencia': {
    gatilho: 'Anúncio da derrama, a cobrança dos impostos atrasados.',
    marcos: ['1789: denúncia de Joaquim Silvério dos Reis', '1789: prisão dos conspiradores', '1792: execução de Tiradentes, em 21 de abril'],
    pessoas: ['Tiradentes', 'Tomás Antônio Gonzaga e Cláudio Manuel da Costa, poetas', 'Joaquim Silvério dos Reis, delator'],
  },
  'b-conjuracao-baiana': {
    gatilho: 'Panfletos espalhados em Salvador defendendo república e igualdade.',
    marcos: ['1798: boletins manuscritos pelas ruas de Salvador', '1799: quatro condenados são enforcados'],
    pessoas: ['Alfaiates, soldados e escravizados', 'Lucas Dantas, Luís Gonzaga das Virgens, João de Deus e Manuel Faustino, os enforcados'],
  },
  'b-familia-real': {
    gatilho: 'Invasão de Portugal pelas tropas de Napoleão (1807).',
    marcos: ['1808: Abertura dos Portos', '1808: criação do Banco do Brasil e da Imprensa Régia', '1815: o Brasil é elevado a Reino Unido', '1821: dom João VI volta a Portugal'],
    pessoas: ['Dom João, príncipe regente e depois rei', 'Carlota Joaquina', 'Inglaterra, que escoltou a corte'],
  },
  'b-pernambucana': {
    gatilho: 'Crise do açúcar e do algodão e impostos para sustentar a corte no Rio.',
    marcos: ['1817: governo republicano no Recife, em março', '1817: repressão e execução de líderes'],
    pessoas: ['Domingos José Martins', 'Frei Caneca'],
  },
  'b-independencia': {
    gatilho: 'As Cortes de Lisboa exigem a volta de dom Pedro e o fim da autonomia do Brasil.',
    marcos: ['1822: Dia do Fico, 9 de janeiro', '1822: Grito do Ipiranga, 7 de setembro', '1823: guerras de independência, como na Bahia (2 de julho)', '1825: Portugal reconhece a independência'],
    pessoas: ['Dom Pedro I', 'José Bonifácio', 'Maria Leopoldina'],
  },
  'b-primeiro-reinado': {
    gatilho: 'Independência com a monarquia mantida.',
    marcos: ['1823: dissolução da Assembleia Constituinte', '1824: Constituição outorgada, com o Poder Moderador', '1824: Confederação do Equador', '1831: abdicação de dom Pedro I'],
    pessoas: ['Dom Pedro I', 'Frei Caneca, executado depois da Confederação do Equador'],
  },
  'b-regencia': {
    gatilho: 'Abdicação de dom Pedro I (1831).',
    marcos: ['1834: Ato Adicional', '1835: Cabanagem, Farroupilha e Revolta dos Malês', '1837–1838: Sabinada e Balaiada', '1840: Golpe da Maioridade'],
    pessoas: ['Regentes, como o padre Diogo Feijó', 'Bento Gonçalves, da Farroupilha'],
  },
  'b-segundo-reinado': {
    gatilho: 'Golpe da Maioridade (1840).',
    marcos: ['1850: fim do tráfico e Lei de Terras', '1864–1870: Guerra do Paraguai', '1888: Lei Áurea', '1889: Proclamação da República'],
    pessoas: ['Dom Pedro II', 'Duque de Caxias', 'Barões do café'],
  },
  'b-eusebio-terras': {
    gatilho: 'Pressão britânica (Bill Aberdeen, 1845) e apreensão de navios negreiros.',
    marcos: ['1845: Bill Aberdeen', '1850: Lei Eusébio de Queirós, em setembro', '1850: Lei de Terras'],
    pessoas: ['Eusébio de Queirós, ministro da Justiça', 'Marinha britânica'],
  },
  'b-paraguai': {
    gatilho: 'Intervenção brasileira no Uruguai e invasão paraguaia do Mato Grosso (1864).',
    marcos: ['1865: Tratado da Tríplice Aliança (Brasil, Argentina e Uruguai)', '1865: batalha do Riachuelo', '1868: tomada de Humaitá', '1870: morte de Solano López'],
    pessoas: ['Francisco Solano López', 'Duque de Caxias', 'Dom Pedro II'],
  },
  'b-cafe': {
    marcos: ['1867: ferrovia Santos–Jundiaí', '1906: Convênio de Taubaté', '1929: a crise derruba o preço do café'],
    pessoas: ['Barões do café do Vale do Paraíba e do Oeste Paulista', 'Imigrantes colonos'],
  },
  'b-imigracao': {
    gatilho: 'Fim do tráfico e crise da escravidão.',
    marcos: ['1886: criação da Sociedade Promotora de Imigração, em São Paulo', '1908: chegada do Kasato Maru, com imigrantes japoneses'],
    pessoas: ['Italianos, portugueses, espanhóis, alemães e japoneses', 'Fazendeiros do Oeste Paulista'],
  },
  'b-abolicao': {
    marcos: ['1871: Lei do Ventre Livre', '1884: Ceará e Amazonas abolem a escravidão', '1885: Lei dos Sexagenários', '1888: Lei Áurea, em 13 de maio'],
    pessoas: ['Princesa Isabel', 'Joaquim Nabuco', 'José do Patrocínio', 'André Rebouças', 'Luís Gama'],
  },
  'b-republica': {
    gatilho: 'Golpe militar de 15 de novembro de 1889.',
    marcos: ['1889: Proclamação da República', '1891: primeira Constituição republicana'],
    pessoas: ['Marechal Deodoro da Fonseca', 'Benjamin Constant', 'Floriano Peixoto'],
  },
  'b-republica-velha': {
    marcos: ['1898: política dos governadores, com Campos Sales', '1906: Convênio de Taubaté', '1922: tenentismo e Semana de Arte Moderna', '1930: a revolução encerra o período'],
    pessoas: ['Campos Sales', 'Coronéis do interior', 'Oligarquias de São Paulo e de Minas Gerais'],
  },
  'b-canudos': {
    gatilho: 'Disputa por uma compra de madeira em Juazeiro leva o governo da Bahia a enviar tropas (1896).',
    marcos: ['1893: Conselheiro funda o arraial de Belo Monte', '1896–1897: quatro expedições militares', '1897: destruição do arraial, em outubro', '1902: Os sertões, de Euclides da Cunha'],
    pessoas: ['Antônio Conselheiro', 'Euclides da Cunha', 'Coronel Moreira César, da 3ª expedição'],
  },
  'b-revoltas-pv': {
    marcos: ['1904: Revolta da Vacina, no Rio', '1910: Revolta da Chibata', '1912–1916: Guerra do Contestado, entre Paraná e Santa Catarina'],
    pessoas: ['Oswaldo Cruz, que comandou a vacinação', 'João Cândido, líder da Chibata', 'Monge José Maria, do Contestado'],
  },
  'b-modernismo': {
    gatilho: 'Centenário da Independência e busca de uma arte brasileira moderna.',
    marcos: ['1917: exposição de Anita Malfatti', '1922: Semana no Theatro Municipal de São Paulo, em fevereiro', '1928: Manifesto Antropófago'],
    pessoas: ['Mário de Andrade', 'Oswald de Andrade', 'Anita Malfatti', 'Di Cavalcanti', 'Villa-Lobos'],
  },
  'b-tenentismo': {
    gatilho: 'Prisão de Hermes da Fonseca e fechamento do Clube Militar (1922).',
    marcos: ['1922: revolta dos 18 do Forte de Copacabana', '1924: revolta em São Paulo', '1925–1927: Coluna Prestes'],
    pessoas: ['Luís Carlos Prestes', 'Siqueira Campos', 'Jovens oficiais do Exército (tenentes)'],
  },
  'b-1930': {
    gatilho: 'Assassinato de João Pessoa (julho de 1930), depois da eleição de Júlio Prestes.',
    marcos: ['1929: Washington Luís indica outro paulista, Júlio Prestes, e rompe o café com leite', '1930: eleição de Júlio Prestes, em março', '1930: Vargas assume o governo, em novembro'],
    pessoas: ['Getúlio Vargas', 'Washington Luís, deposto', 'Júlio Prestes, eleito sem tomar posse', 'João Pessoa'],
  },
  'b-era-vargas': {
    gatilho: 'Revolução de 1930.',
    marcos: ['1932: Código Eleitoral, com voto secreto e feminino', '1934: nova Constituição', '1937: golpe do Estado Novo', '1945: Vargas é deposto'],
    pessoas: ['Getúlio Vargas', 'Tenentes e oligarquias dissidentes'],
  },
  'b-1932': {
    gatilho: 'Perda de poder paulista e morte de quatro jovens em maio de 1932 (MMDC).',
    marcos: ['1932: o levante começa em 9 de julho', '1932: rendição paulista, em outubro', '1934: nova Constituição'],
    pessoas: ['Elites e população de São Paulo', 'Pedro de Toledo, interventor aclamado governador'],
  },
  'b-estado-novo': {
    gatilho: 'Falso Plano Cohen, divulgado como plano de revolução comunista.',
    marcos: ['1937: golpe e nova Constituição autoritária', '1939: criação do DIP, órgão de censura e propaganda', '1941: criação da CSN, em Volta Redonda', '1945: Vargas é deposto'],
    pessoas: ['Getúlio Vargas', 'Filinto Müller, chefe da polícia política'],
  },
  'b-clt': {
    gatilho: 'Política trabalhista do Estado Novo.',
    marcos: ['1940: salário mínimo', '1943: CLT, em 1º de maio'],
    pessoas: ['Getúlio Vargas', 'Alexandre Marcondes Filho, ministro do Trabalho'],
  },
  'b-feb': {
    gatilho: 'Ataques de submarinos alemães a navios brasileiros (1942).',
    marcos: ['1942: o Brasil declara guerra ao Eixo', '1944: a FEB chega à Itália', '1945: tomada de Monte Castelo, em fevereiro'],
    pessoas: ['Mascarenhas de Moraes, comandante da FEB', 'Cerca de 25 mil pracinhas'],
  },
  'b-1945-democracia': {
    gatilho: 'Deposição de Vargas, em outubro de 1945.',
    marcos: ['1946: nova Constituição', '1950: Vargas é eleito presidente', '1954: suicídio de Vargas', '1960: inauguração de Brasília'],
    pessoas: ['Eurico Gaspar Dutra', 'Getúlio Vargas', 'Juscelino Kubitschek', 'João Goulart'],
  },
  'b-petrobras': {
    gatilho: 'Campanha nacionalista pelo monopólio estatal do petróleo.',
    marcos: ['1947–1953: campanha do petróleo', '1953: a Lei nº 2.004 cria a Petrobras, em 3 de outubro'],
    pessoas: ['Getúlio Vargas', 'Estudantes, militares nacionalistas e a UNE'],
  },
  'b-suicidio-vargas': {
    gatilho: 'Atentado da rua Tonelero contra Carlos Lacerda (agosto de 1954).',
    marcos: ['1954: atentado, em 5 de agosto', '1954: suicídio de Vargas e carta-testamento, em 24 de agosto'],
    pessoas: ['Getúlio Vargas', 'Carlos Lacerda, opositor', 'Gregório Fortunato, chefe da guarda pessoal'],
  },
  'b-jk': {
    gatilho: 'Eleição de 1955, com a posse garantida pelo general Lott.',
    marcos: ['1956: Plano de Metas', '1960: inauguração de Brasília, em 21 de abril'],
    pessoas: ['Juscelino Kubitschek', 'Lúcio Costa e Oscar Niemeyer, que projetaram Brasília'],
  },
  'b-janio-jango': {
    gatilho: 'Renúncia de Jânio Quadros, em agosto de 1961.',
    marcos: ['1961: renúncia de Jânio e adoção do parlamentarismo', '1963: plebiscito restaura o presidencialismo', '1964: Comício da Central, em 13 de março'],
    pessoas: ['Jânio Quadros', 'João Goulart', 'Leonel Brizola, da Campanha da Legalidade'],
  },
  'b-golpe-1964': {
    gatilho: 'Comício da Central e revolta dos marinheiros, em março de 1964.',
    marcos: ['1964: Marcha da Família com Deus pela Liberdade, em março', '1964: tropas saem de Minas Gerais, em 31 de março', '1964: AI-1 e posse de Castelo Branco'],
    pessoas: ['João Goulart, deposto', 'General Olímpio Mourão Filho', 'Castelo Branco, primeiro presidente militar'],
  },
  'b-ditadura': {
    gatilho: 'Golpe de 1964.',
    marcos: ['1965: AI-2 e bipartidarismo (Arena e MDB)', '1968: AI-5', '1974: Geisel anuncia a abertura', '1985: fim do regime'],
    pessoas: ['Presidentes Castelo Branco, Costa e Silva, Médici, Geisel e Figueiredo'],
  },
  'b-ai5': {
    gatilho: 'Discurso do deputado Márcio Moreira Alves e recusa da Câmara em autorizar seu processo.',
    marcos: ['1968: Passeata dos Cem Mil, em junho', '1968: AI-5, em 13 de dezembro', '1978: emenda revoga o AI-5, a partir de 1979'],
    pessoas: ['Costa e Silva', 'Márcio Moreira Alves'],
  },
  'b-milagre': {
    marcos: ['1968: começa o crescimento acelerado', '1970: o tricampeonato na Copa é usado na propaganda', '1973: o choque do petróleo encerra o ciclo'],
    pessoas: ['Delfim Netto, ministro da Fazenda', 'Emílio Médici, presidente'],
  },
  'b-anistia': {
    gatilho: 'Campanha pela anistia ampla, geral e irrestrita.',
    marcos: ['1978: criação do Comitê Brasileiro pela Anistia', '1979: Lei da Anistia, em 28 de agosto', '1979: volta dos exilados'],
    pessoas: ['João Figueiredo, presidente', 'Exilados como Leonel Brizola e Luís Carlos Prestes'],
  },
  'b-diretas': {
    gatilho: 'Emenda Dante de Oliveira, que propunha eleição direta para presidente.',
    marcos: ['1983: primeiros comícios', '1984: comícios com mais de um milhão de pessoas no Rio e em São Paulo', '1984: a emenda é rejeitada, em 25 de abril'],
    pessoas: ['Dante de Oliveira', 'Ulysses Guimarães', 'Tancredo Neves', 'Lula'],
  },
  'b-nova-republica': {
    gatilho: 'Vitória de Tancredo Neves no Colégio Eleitoral, em janeiro de 1985.',
    marcos: ['1985: Tancredo é eleito, em 15 de janeiro', '1985: morte de Tancredo; Sarney assume', '1986: Plano Cruzado'],
    pessoas: ['Tancredo Neves', 'José Sarney'],
  },
  'b-constituicao': {
    gatilho: 'Instalação da Assembleia Nacional Constituinte (1987).',
    marcos: ['1987: instalação da Constituinte', '1988: promulgação, em 5 de outubro'],
    pessoas: ['Ulysses Guimarães, presidente da Constituinte', 'Movimentos sociais que enviaram emendas populares'],
  },
  'b-collor': {
    gatilho: 'Primeira eleição direta para presidente desde 1960, em 1989.',
    marcos: ['1990: Plano Collor bloqueia a poupança', '1992: CPI e protestos dos caras-pintadas', '1992: impeachment; Collor renuncia em dezembro'],
    pessoas: ['Fernando Collor', 'Itamar Franco, vice que assumiu', 'Pedro Collor, irmão que fez as denúncias'],
  },
  'b-real': {
    gatilho: 'Hiperinflação que corroía salários e preços.',
    marcos: ['1993: Fernando Henrique Cardoso assume o Ministério da Fazenda', '1994: criação da URV, em março', '1994: o real entra em circulação, em 1º de julho'],
    pessoas: ['Itamar Franco, presidente', 'Fernando Henrique Cardoso'],
  },
  'b-bolsa-familia': {
    gatilho: 'Unificação de programas de transferência de renda.',
    marcos: ['2003: criação por medida provisória', '2004: Lei nº 10.836'],
    pessoas: ['Luiz Inácio Lula da Silva, presidente'],
  },
  'b-impeachment-2016': {
    gatilho: 'Acusação de crime de responsabilidade por manobras fiscais, as chamadas pedaladas.',
    marcos: ['2015: a Câmara aceita o pedido, em dezembro', '2016: a Câmara aprova a abertura, em abril', '2016: o Senado condena, em 31 de agosto'],
    pessoas: ['Dilma Rousseff', 'Michel Temer, vice que assumiu', 'Eduardo Cunha, presidente da Câmara'],
  },
}
