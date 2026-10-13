import type { PareEPense, SecaoResumo } from '../tipos'
import { F } from './fontes'
import { EVENTOS_ANTIGOS } from './eventosAntigos'
import { EVENTOS_BRASIL } from './eventosBrasil'
import { EVENTOS_MUNDO } from './eventosMundo'
import type { Acontecimento, Era, Personagem, Relacao } from './tipos'

/** Anos negativos são antes de Cristo. A linha começa um pouco antes da escrita (c. 3500 a.C.). */
export const ANO_MIN = -3600
export const ANO_MAX = 2030

/** Períodos coloridos de cada região. As eras são contínuas: o fim de uma é o início da seguinte. */
export const ERAS: Era[] = [
  { id: 'me-antiga', nome: 'Idade Antiga', curto: 'Antiga', regiao: 'mundo', inicio: -3500, fim: 476, cor: '#4d7c0f', resumo: 'Da invenção da escrita à queda de Roma: Egito, Mesopotâmia, Grécia e Roma.' },
  { id: 'me-media', nome: 'Idade Média', curto: 'Média', regiao: 'mundo', inicio: 476, fim: 1453, cor: '#155e75', resumo: 'Reinos germânicos, Igreja forte, feudalismo, expansão islâmica, Cruzadas e renascimento do comércio.' },
  { id: 'me-moderna', nome: 'Idade Moderna', curto: 'Moderna', regiao: 'mundo', inicio: 1453, fim: 1789, cor: '#92400e', resumo: 'Expansão marítima, absolutismo, mercantilismo, Reforma e Iluminismo.' },
  { id: 'me-revolucoes', nome: 'Era das Revoluções', curto: 'Revoluções', regiao: 'mundo', inicio: 1789, fim: 1870, cor: '#be123c', resumo: 'Revolução Industrial, revoluções burguesas, independências americanas e formação dos Estados nacionais.' },
  { id: 'me-imperialismo', nome: 'Imperialismo', curto: 'Imper.', regiao: 'mundo', inicio: 1870, fim: 1914, cor: '#7c3aed', resumo: 'Segunda Revolução Industrial, capital financeiro e partilha da África e da Ásia.' },
  { id: 'me-guerras', nome: 'Guerras e crise', curto: 'Guerras', regiao: 'mundo', inicio: 1914, fim: 1945, cor: '#c2410c', resumo: 'Duas guerras mundiais, Revolução Russa, crise de 1929 e totalitarismos.' },
  { id: 'me-guerra-fria', nome: 'Guerra Fria', curto: 'G. Fria', regiao: 'mundo', inicio: 1945, fim: 1991, cor: '#0369a1', resumo: 'Mundo bipolar (EUA × URSS), descolonização e corrida armamentista.' },
  { id: 'me-atual', nome: 'Mundo atual', curto: 'Atual', regiao: 'mundo', inicio: 1991, fim: 2025, cor: '#0f766e', resumo: 'Globalização, hegemonia dos EUA, terrorismo e crises financeiras.' },
  { id: 'br-originarios', nome: 'Povos originários', curto: 'Indígenas', regiao: 'brasil', inicio: ANO_MIN, fim: 1500, cor: '#065f46', resumo: 'Antes de 1500, o território era habitado havia mais de 10 mil anos por muitos povos indígenas, de línguas e modos de vida diversos; essa história é conhecida pela arqueologia e pela tradição oral.' },
  { id: 'br-colonia', nome: 'Colônia', curto: 'Colônia', regiao: 'brasil', inicio: 1500, fim: 1822, cor: '#b45309', resumo: 'Açúcar, mineração, escravidão africana e pacto colonial.' },
  { id: 'br-imperio', nome: 'Império', curto: 'Império', regiao: 'brasil', inicio: 1822, fim: 1889, cor: '#6d28d9', resumo: 'Monarquia, café, Guerra do Paraguai e abolição da escravidão.' },
  { id: 'br-rep-velha', nome: 'República Velha', curto: 'Rep. Velha', regiao: 'brasil', inicio: 1889, fim: 1930, cor: '#0f766e', resumo: 'República oligárquica, café com leite, coronelismo e revoltas sociais.' },
  { id: 'br-vargas', nome: 'Era Vargas', curto: 'Vargas', regiao: 'brasil', inicio: 1930, fim: 1945, cor: '#b3261e', resumo: 'Centralização, industrialização, leis trabalhistas e Estado Novo.' },
  { id: 'br-democracia', nome: 'República de 1946', curto: '1946', regiao: 'brasil', inicio: 1945, fim: 1964, cor: '#1d4ed8', resumo: 'Democracia com partidos, desenvolvimentismo, populismo e polarização.' },
  { id: 'br-ditadura', nome: 'Ditadura militar', curto: 'Ditadura', regiao: 'brasil', inicio: 1964, fim: 1985, cor: '#475569', resumo: 'Governos militares, censura, repressão, milagre econômico e abertura.' },
  { id: 'br-nova-rep', nome: 'Nova República', curto: 'Nova Rep.', regiao: 'brasil', inicio: 1985, fim: 2025, cor: '#15803d', resumo: 'Redemocratização, Constituição de 1988, estabilização da moeda e programas sociais.' },
]

/** Janelas de tempo para comparar o Brasil e o mundo. */
export const PERIODOS: { id: string; rotulo: string; inicio: number; fim: number }[] = [
  { id: 'p1', rotulo: '1500–1750: colonização e açúcar', inicio: 1500, fim: 1750 },
  { id: 'p2', rotulo: '1750–1822: crise do sistema colonial', inicio: 1750, fim: 1822 },
  { id: 'p3', rotulo: '1822–1889: Império', inicio: 1822, fim: 1889 },
  { id: 'p4', rotulo: '1889–1930: República Velha', inicio: 1889, fim: 1930 },
  { id: 'p5', rotulo: '1930–1945: Vargas e a Segunda Guerra', inicio: 1930, fim: 1945 },
  { id: 'p6', rotulo: '1945–1964: democracia e Guerra Fria', inicio: 1945, fim: 1964 },
  { id: 'p7', rotulo: '1964–1985: ditadura militar', inicio: 1964, fim: 1985 },
  { id: 'p8', rotulo: '1985 em diante: Nova República', inicio: 1985, fim: 2025 },
]

/** Relações de causa e consequência: `de` é causa (ou etapa anterior) de `para`. Sempre `de` começa antes de `para` (ou no mesmo ano). */
export const RELACOES: Relacao[] = [
  { de: 'm-escrita', para: 'm-hamurabi', texto: 'A escrita permitiu registrar as leis e torná-las públicas, como no código que Hamurábi mandou gravar em pedra.' },
  { de: 'm-republica-romana', para: 'm-imperio-romano', texto: 'As guerras civis entre generais destruíram a República, e Otávio concentrou o poder como primeiro imperador, em 27 a.C.' },
  { de: 'm-imperio-romano', para: 'm-cristianismo', texto: 'As estradas e a unidade do Império Romano facilitaram a viagem dos pregadores, e o cristianismo se espalhou pelas cidades do império.' },
  { de: 'm-imperio-romano', para: 'm-queda-roma', texto: 'A crise econômica, as disputas pelo trono e a pressão dos povos germânicos enfraqueceram o império, cuja parte ocidental caiu em 476.' },
  { de: 'm-queda-roma', para: 'm-feudalismo', texto: 'Com o fim do poder romano no Ocidente, as cidades encolheram e a vida se concentrou no campo, base da sociedade feudal.' },
  { de: 'm-carlos-magno', para: 'm-feudalismo', texto: 'A divisão do império de Carlos Magno entre os netos (843) e as novas invasões fortaleceram os senhores locais, que passaram a defender e a governar suas terras.' },
  { de: 'm-islamismo', para: 'm-cruzadas', texto: 'Jerusalém estava sob governo muçulmano; no século XI, o avanço dos turcos seljúcidas levou Bizâncio a pedir ajuda ao papa, que convocou a Primeira Cruzada.' },
  { de: 'm-cruzadas', para: 'm-renascimento-comercial', texto: 'As Cruzadas ajudaram a reabrir o Mediterrâneo ao comércio europeu, que enriqueceu cidades italianas como Veneza e Gênova.' },
  { de: 'm-renascimento-comercial', para: 'm-renascimento', texto: 'A riqueza das cidades comerciais italianas sustentou mecenas que financiaram artistas e estudiosos do Renascimento.' },
  { de: 'm-renascimento-comercial', para: 'm-colombo', texto: 'A volta do comércio fortaleceu a burguesia e os reis, que se uniram para buscar novas rotas e riquezas no mar.' },
  { de: 'm-renascimento', para: 'm-reforma', texto: 'O humanismo estimulou a leitura crítica dos textos, inclusive da Bíblia, e a imprensa espalhou rapidamente as críticas à Igreja.' },
  { de: 'm-magna-carta', para: 'm-revolucoes-inglesas', texto: 'A Magna Carta foi invocada como precedente pelo Parlamento inglês, no século XVII, para limitar o poder dos reis.' },
  { de: 'm-colombo', para: 'm-tordesilhas', texto: 'A viagem de Colombo (1492) levou Portugal e Espanha a disputar as terras novas, e o Tratado de Tordesilhas (1494) dividiu a área de expansão entre os dois reinos.' },
  { de: 'm-tordesilhas', para: 'b-1500', texto: 'Com o tratado, Portugal reforçou o direito de ocupar terras a leste da linha, onde a esquadra de Cabral chegou em 1500.' },
  { de: 'm-colombo', para: 'b-trafico', texto: 'A colonização das Américas criou demanda por mão de obra em larga escala, e os europeus recorreram ao tráfico de africanos escravizados.' },
  { de: 'm-reforma', para: 'b-governo-geral', texto: 'A Contrarreforma católica deu força à Companhia de Jesus, cujos padres vieram ao Brasil em 1549, com Tomé de Sousa, para catequizar e educar.' },
  { de: 'm-reforma', para: 'm-revolucoes-inglesas', texto: 'Os conflitos entre anglicanos, puritanos e católicos, herdados da Reforma, alimentaram a disputa entre o rei e o Parlamento na Inglaterra.' },
  { de: 'b-1500', para: 'b-capitanias', texto: 'Para ocupar e defender o litoral de invasões francesas, a Coroa dividiu a costa em capitanias hereditárias.' },
  { de: 'b-capitanias', para: 'b-governo-geral', texto: 'O fracasso da maioria das capitanias levou a Coroa a centralizar a administração, com o Governo-Geral, em 1549.' },
  { de: 'b-1500', para: 'b-acucar', texto: 'Depois do pau-brasil, a Coroa passou a investir na produção de açúcar para tornar a colônia lucrativa, e as capitanias bem-sucedidas, como São Vicente e Pernambuco, firmaram-se com os engenhos.' },
  { de: 'b-acucar', para: 'b-trafico', texto: 'Os engenhos exigiam muita mão de obra, e o tráfico de africanos escravizados passou a abastecê-los.' },
  { de: 'b-acucar', para: 'b-palmares', texto: 'A violência da escravidão nos engenhos provocava fugas, e fugitivos formaram quilombos, como Palmares.' },
  { de: 'b-acucar', para: 'b-holandeses', texto: 'Os holandeses, que refinavam e vendiam o açúcar na Europa, quiseram controlar a produção e ocuparam o Nordeste açucareiro.' },
  { de: 'b-uniao-iberica', para: 'b-holandeses', texto: 'Com a Espanha em guerra com a Holanda, as colônias portuguesas tornaram-se alvo dos holandeses, que atacaram o Nordeste em 1630.' },
  { de: 'b-holandeses', para: 'b-mineracao', texto: 'A concorrência do açúcar produzido nas Antilhas com técnicas holandesas derrubou os preços do açúcar brasileiro e levou a Coroa a buscar outras riquezas, como o ouro.' },
  { de: 'b-mineracao', para: 'b-pombal', texto: 'A queda do ouro e a dependência da Inglaterra deixaram Portugal em crise, e Pombal tentou reorganizar o Estado e a economia do reino.' },
  { de: 'm-iluminismo', para: 'b-pombal', texto: 'Pombal aplicou ideias do despotismo esclarecido: centralização do poder, reforma do ensino e controle sobre a Igreja.' },
  { de: 'b-mineracao', para: 'b-inconfidencia', texto: 'Com a queda da produção de ouro e a cobrança de impostos atrasados (derrama), cresceu o descontentamento das elites mineiras.' },
  { de: 'm-iluminismo', para: 'm-rev-francesa', texto: 'Os iluministas criticaram os privilégios e o absolutismo, fornecendo as ideias de liberdade e igualdade da Revolução Francesa.' },
  { de: 'm-iluminismo', para: 'm-independencia-eua', texto: 'As ideias iluministas de liberdade e de governo por consentimento inspiraram a Declaração de Independência dos EUA.' },
  { de: 'm-independencia-eua', para: 'b-inconfidencia', texto: 'A independência dos EUA foi um exemplo para os inconfidentes mineiros, que pensavam em fundar uma república.' },
  { de: 'm-rev-francesa', para: 'm-napoleao', texto: 'A instabilidade da Revolução permitiu a ascensão de Napoleão, que tomou o poder em 1799.' },
  { de: 'm-rev-francesa', para: 'b-conjuracao-baiana', texto: 'Ideias de liberdade e igualdade da Revolução Francesa inspiraram os artesãos e soldados da Conjuração Baiana.' },
  { de: 'm-napoleao', para: 'b-familia-real', texto: 'Para escapar da invasão francesa a Portugal, a família real transferiu-se para o Brasil em 1808.' },
  { de: 'm-napoleao', para: 'm-independencias-hispano', texto: 'A invasão da Espanha por Napoleão enfraqueceu o controle espanhol sobre as colônias, abrindo caminho às independências.' },
  { de: 'b-familia-real', para: 'b-independencia', texto: 'A presença da corte no Rio e a elevação do Brasil a Reino Unido tornaram inaceitável, para as elites, o retorno ao status de colônia exigido pelas Cortes portuguesas.' },
  { de: 'b-independencia', para: 'b-primeiro-reinado', texto: 'A independência manteve a monarquia, e dom Pedro I tornou-se o primeiro imperador do Brasil.' },
  { de: 'b-primeiro-reinado', para: 'b-regencia', texto: 'A abdicação de dom Pedro I, em 1831, deixou como herdeiro uma criança de cinco anos, e o país foi governado por regentes.' },
  { de: 'b-regencia', para: 'b-segundo-reinado', texto: 'Para encerrar as disputas e as revoltas da Regência, as elites antecipararam a maioridade de dom Pedro II (Golpe da Maioridade, 1840).' },
  { de: 'm-rev-industrial', para: 'm-segunda-rev-industrial', texto: 'A industrialização se aprofundou e se espalhou, com aço, eletricidade, petróleo e grandes empresas, na Segunda Revolução Industrial.' },
  { de: 'm-rev-industrial', para: 'b-eusebio-terras', texto: 'A Inglaterra industrial pressionou pelo fim do tráfico de escravos (Bill Aberdeen, 1845), e o Brasil proibiu efetivamente o tráfico em 1850.' },
  { de: 'm-segunda-rev-industrial', para: 'm-imperialismo', texto: 'A necessidade de matérias-primas, mercados e áreas de investimento levou as potências industriais a dominar África e Ásia.' },
  { de: 'm-imperialismo', para: 'm-1gm', texto: 'A disputa por colônias e mercados aumentou as rivalidades entre as potências, que se armaram e formaram alianças.' },
  { de: 'm-unificacoes', para: 'm-1gm', texto: 'A Alemanha unificada tornou-se potência industrial e militar, desafiando a Inglaterra e a França e agravando a rivalidade que levou à guerra.' },
  { de: 'm-1gm', para: 'm-rev-russa', texto: 'As derrotas, as mortes e a fome na guerra enfraqueceram o czar e levaram à revolução de 1917.' },
  { de: 'm-1gm', para: 'm-versalhes', texto: 'A vitória dos Aliados permitiu impor à Alemanha o Tratado de Versalhes, com perdas e reparações.' },
  { de: 'm-versalhes', para: 'm-nazifascismo', texto: 'O ressentimento com Versalhes e a crise econômica alemã foram explorados pelo nazismo para chegar ao poder.' },
  { de: 'm-versalhes', para: 'm-2gm', texto: 'A humilhação alemã e a insatisfação com a ordem de 1919 ajudaram a alimentar o expansionismo que levou à Segunda Guerra.' },
  { de: 'm-crise-1929', para: 'm-new-deal', texto: 'O desemprego em massa e a quebra de bancos levaram os EUA a adotar a intervenção do Estado na economia, com o New Deal.' },
  { de: 'm-crise-1929', para: 'm-nazifascismo', texto: 'A crise de 1929 aprofundou o desemprego e o desespero na Alemanha, e o nazismo ganhou votos.' },
  { de: 'm-crise-1929', para: 'b-1930', texto: 'A queda do preço do café, depois da crise de 1929, enfraqueceu as oligarquias cafeeiras e contribuiu para a Revolução de 1930.' },
  { de: 'm-nazifascismo', para: 'm-2gm', texto: 'O expansionismo e o militarismo dos regimes nazista e fascista levaram à Segunda Guerra.' },
  { de: 'm-nazifascismo', para: 'm-holocausto', texto: 'A ideologia racista e antissemita do nazismo, no poder, levou à perseguição e ao extermínio de judeus e outros grupos.' },
  { de: 'm-2gm', para: 'm-atomicas', texto: 'Para encerrar a guerra do Pacífico, os EUA usaram bombas atômicas contra Hiroshima e Nagasaki em agosto de 1945.' },
  { de: 'm-2gm', para: 'm-marshall', texto: 'A destruição da Europa depois da guerra levou os EUA a financiar a reconstrução, com o Plano Marshall.' },
  { de: 'm-2gm', para: 'm-onu', texto: 'Para evitar nova guerra mundial, os países criaram a ONU em 1945, no lugar da fracassada Liga das Nações.' },
  { de: 'm-2gm', para: 'm-guerra-fria', texto: 'EUA e URSS saíram da guerra como superpotências e disputaram a influência sobre a Europa e o mundo.' },
  { de: 'm-2gm', para: 'm-descolonizacao', texto: 'O enfraquecimento de Reino Unido e França depois da guerra favoreceu os movimentos de independência na Ásia e na África.' },
  { de: 'm-atomicas', para: 'm-guerra-fria', texto: 'As bombas atômicas inauguraram a era nuclear: a corrida armamentista passou a ser parte central da disputa entre EUA e URSS.' },
  { de: 'm-marshall', para: 'm-guerra-fria', texto: 'O Plano Marshall ligou a Europa Ocidental aos EUA, e a URSS respondeu consolidando o bloco do Leste, o que aprofundou a divisão.' },
  { de: 'm-guerra-fria', para: 'm-vietna', texto: 'Os EUA entraram na guerra para impedir que o comunismo se espalhasse pelo Sudeste Asiático (teoria do dominó).' },
  { de: 'm-cuba', para: 'm-misseis', texto: 'A aproximação de Cuba com a URSS e a instalação de mísseis soviéticos na ilha provocaram a crise de 1962.' },
  { de: 'm-cuba', para: 'b-golpe-1964', texto: 'A Revolução Cubana aumentou o temor de elites e militares brasileiros diante das reformas de Goulart, o que ajudou a preparar o golpe.' },
  { de: 'm-guerra-fria', para: 'b-golpe-1964', texto: 'O anticomunismo e a doutrina de segurança nacional, no contexto da Guerra Fria, justificaram o golpe de 1964.' },
  { de: 'm-rev-russa', para: 'b-estado-novo', texto: 'O medo do comunismo, alimentado desde a Revolução Russa, foi usado por Vargas para justificar o golpe de 1937, com o falso Plano Cohen.' },
  { de: 'm-2gm', para: 'b-feb', texto: 'O Brasil declarou guerra ao Eixo em 1942 e enviou a FEB à Itália em 1944.' },
  { de: 'b-feb', para: 'b-1945-democracia', texto: 'Lutar contra o fascismo na Europa sob uma ditadura em casa fortaleceu a oposição ao Estado Novo e a pressão pela redemocratização.' },
  { de: 'm-vietna', para: 'm-maio-68', texto: 'A guerra do Vietnã alimentou os protestos pacifistas e a contracultura entre jovens de vários países.' },
  { de: 'm-petroleo-73', para: 'b-diretas', texto: 'A crise econômica e da dívida desgastou o regime militar e alimentou os protestos por mudança política.' },
  { de: 'm-petroleo-73', para: 'm-neoliberalismo', texto: 'A estagflação dos anos 1970 desacreditou o keynesianismo e abriu espaço para governos neoliberais.' },
  { de: 'm-neoliberalismo', para: 'b-collor', texto: 'A abertura econômica e as privatizações do governo Collor seguiram a agenda neoliberal difundida no mundo.' },
  { de: 'm-muro-1989', para: 'm-urss-1991', texto: 'A queda dos regimes do Leste Europeu isolou a URSS, que se dissolveu em dezembro de 1991.' },
  { de: 'b-republica', para: 'b-republica-velha', texto: 'A Constituição de 1891 instituiu o federalismo e o poder das oligarquias estaduais, que marcaram a República Velha.' },
  { de: 'b-republica', para: 'b-canudos', texto: 'A República viu em Canudos uma suposta ameaça monarquista e a destruiu com quatro expedições militares.' },
  { de: 'b-segundo-reinado', para: 'b-republica', texto: 'A crise do Império (questões militar, religiosa e abolicionista) abriu caminho à proclamação da República.' },
  { de: 'b-paraguai', para: 'b-republica', texto: 'A guerra fortaleceu o Exército, que passou a reivindicar mais prestígio e influência política (questão militar), contribuindo para o golpe de 1889.' },
  { de: 'm-secessao', para: 'b-abolicao', texto: 'Com a abolição nos EUA (1865), o Brasil ficou entre os últimos países escravistas das Américas, e a pressão aumentou.' },
  { de: 'b-eusebio-terras', para: 'b-abolicao', texto: 'Sem o tráfico, a escravidão ficou mais cara e o debate abolicionista ganhou força.' },
  { de: 'b-eusebio-terras', para: 'b-imigracao', texto: 'Sem o tráfico e com a Lei de Terras, os fazendeiros passaram a buscar imigrantes europeus como trabalhadores.' },
  { de: 'b-abolicao', para: 'b-republica', texto: 'A abolição sem indenização aos fazendeiros tirou do Império uma de suas bases de apoio, e eles aderiram à República.' },
  { de: 'b-cafe', para: 'b-republica-velha', texto: 'O poder econômico do café deu às oligarquias paulista e mineira o controle da política (café com leite).' },
  { de: 'b-cafe', para: 'b-imigracao', texto: 'A expansão do café no Oeste Paulista exigia muitos braços, e o governo subsidiou a vinda de imigrantes.' },
  { de: 'b-republica-velha', para: 'b-tenentismo', texto: 'A corrupção, a fraude eleitoral e o poder oligárquico motivaram a revolta dos jovens oficiais.' },
  { de: 'b-republica-velha', para: 'b-1930', texto: 'A crise do modelo oligárquico, agravada pela crise do café, levou à Revolução de 1930.' },
  { de: 'b-1930', para: 'b-era-vargas', texto: 'A Revolução de 1930 levou Vargas ao poder, iniciando a Era Vargas.' },
  { de: 'b-1930', para: 'b-1932', texto: 'A perda de poder político de São Paulo depois de 1930 levou à Revolução Constitucionalista de 1932.' },
  { de: 'b-1932', para: 'b-era-vargas', texto: 'Mesmo derrotado, São Paulo conseguiu a convocação da Constituinte e a Constituição de 1934, que fizeram parte da Era Vargas.' },
  { de: 'b-estado-novo', para: 'b-clt', texto: 'Dentro do Estado Novo, Vargas reuniu as leis trabalhistas na CLT (1943), vinculando os sindicatos ao Estado.' },
  { de: 'b-era-vargas', para: 'b-petrobras', texto: 'O nacionalismo econômico da Era Vargas deu origem à campanha "O petróleo é nosso" e à Petrobras (1953).' },
  { de: 'b-suicidio-vargas', para: 'b-jk', texto: 'A comoção causada pela morte de Vargas frustrou o golpe e favoreceu a eleição de Juscelino Kubitschek em 1955.' },
  { de: 'b-janio-jango', para: 'b-golpe-1964', texto: 'A radicalização em torno das reformas de base do governo Goulart levou ao golpe de 1964.' },
  { de: 'b-golpe-1964', para: 'b-ditadura', texto: 'O golpe de 1964 inaugurou o regime militar, que durou 21 anos.' },
  { de: 'b-ditadura', para: 'b-ai5', texto: 'A radicalização do regime, diante dos protestos de 1968, levou ao AI-5.' },
  { de: 'b-ai5', para: 'b-milagre', texto: 'A repressão do AI-5 e o arrocho salarial garantiram um ambiente favorável ao crescimento do milagre econômico.' },
  { de: 'b-ditadura', para: 'b-anistia', texto: 'Para conduzir a abertura "lenta, gradual e segura", o regime concedeu a anistia em 1979, ao mesmo tempo em que perdoava os agentes do Estado.' },
  { de: 'b-anistia', para: 'b-diretas', texto: 'A volta dos exilados e a reorganização partidária fortaleceram o movimento por eleições diretas.' },
  { de: 'b-diretas', para: 'b-nova-republica', texto: 'Embora a emenda das diretas tenha sido rejeitada, a pressão popular levou a oposição a vencer no Colégio Eleitoral, com Tancredo Neves, e a encerrar o regime.' },
  { de: 'b-nova-republica', para: 'b-constituicao', texto: 'A Nova República convocou a Assembleia Constituinte (1987–1988), que produziu a Constituição de 1988.' },
  { de: 'b-collor', para: 'b-real', texto: 'Depois do impeachment de Collor, o governo Itamar Franco lançou o Plano Real, que acabou com a hiperinflação.' },
  { de: 'b-constituicao', para: 'b-bolsa-familia', texto: 'A Constituição de 1988 fixou direitos sociais e a assistência aos pobres, base de programas como o Bolsa Família.' },
]

/** Acontecimentos, com as conexões completadas pelas relações de causa e consequência (nos dois sentidos). */
export const EVENTOS: Acontecimento[] = [...EVENTOS_ANTIGOS, ...EVENTOS_MUNDO, ...EVENTOS_BRASIL].map((e) => ({
  ...e,
  conexoes: [...new Set([...e.conexoes, ...RELACOES.filter((r) => r.de === e.id).map((r) => r.para), ...RELACOES.filter((r) => r.para === e.id).map((r) => r.de)])],
}))

export const evento = (id: string) => EVENTOS.find((e) => e.id === id) as Acontecimento

export const PERSONAGENS: Personagem[] = [
  { id: 'p-hamurabi', nome: 'Hamurábi', feito: 'mandou gravar em pedra as leis que valiam para todo o reino babilônico', evento: 'm-hamurabi' },
  { id: 'p-clistenes', nome: 'Clístenes', feito: 'fez as reformas que deram aos cidadãos de Atenas o poder de decidir em assembleia', evento: 'm-atenas' },
  { id: 'p-alexandre', nome: 'Alexandre Magno', feito: 'conquistou o Império Persa e espalhou a cultura grega pelo Oriente', evento: 'm-alexandre' },
  { id: 'p-augusto', nome: 'Otávio Augusto', feito: 'foi o primeiro imperador romano, a partir de 27 a.C.', evento: 'm-imperio-romano' },
  { id: 'p-maome', nome: 'Maomé', feito: 'pregou o islã na Arábia e partiu de Meca para Medina em 622 (Hégira)', evento: 'm-islamismo' },
  { id: 'p-carlos-magno', nome: 'Carlos Magno', feito: 'foi coroado imperador pelo papa no Natal do ano 800', evento: 'm-carlos-magno' },
  { id: 'p-urbano', nome: 'Papa Urbano II', feito: 'convocou a Primeira Cruzada no Concílio de Clermont, em 1095', evento: 'm-cruzadas' },
  { id: 'p-joao-sem-terra', nome: 'João Sem-Terra', feito: 'foi obrigado pelos barões a aceitar limites ao poder do rei, em 1215', evento: 'm-magna-carta' },
  { id: 'p-joana', nome: "Joana d'Arc", feito: 'liderou as tropas francesas que romperam o cerco de Orléans, em 1429', evento: 'm-cem-anos' },
  { id: 'p-cabral', nome: 'Pedro Álvares Cabral', feito: 'comandou a esquadra que chegou ao litoral da Bahia em 1500', evento: 'b-1500' },
  { id: 'p-tome', nome: 'Tomé de Sousa', feito: 'foi o primeiro governador-geral e fundou Salvador, em 1549', evento: 'b-governo-geral' },
  { id: 'p-nassau', nome: 'Maurício de Nassau', feito: 'governou o Nordeste holandês e urbanizou Recife, entre 1637 e 1644', evento: 'b-holandeses' },
  { id: 'p-zumbi', nome: 'Zumbi', feito: 'liderou a resistência do Quilombo dos Palmares, até ser morto em 1695', evento: 'b-palmares' },
  { id: 'p-pombal', nome: 'Marquês de Pombal', feito: 'expulsou os jesuítas e centralizou a administração do Império português', evento: 'b-pombal' },
  { id: 'p-tiradentes', nome: 'Tiradentes', feito: 'foi o único condenado à morte pela Inconfidência Mineira, enforcado em 1792', evento: 'b-inconfidencia' },
  { id: 'p-joao', nome: 'Dom João (príncipe regente)', feito: 'decretou a Abertura dos Portos às nações amigas, em 1808', evento: 'b-familia-real' },
  { id: 'p-pedro1', nome: 'Dom Pedro I', feito: 'proclamou a Independência em 1822 e outorgou a Constituição de 1824', evento: 'b-independencia' },
  { id: 'p-isabel', nome: 'Princesa Isabel', feito: 'assinou a Lei Áurea, em 13 de maio de 1888', evento: 'b-abolicao' },
  { id: 'p-deodoro', nome: 'Marechal Deodoro da Fonseca', feito: 'liderou o golpe militar que proclamou a República, em 1889', evento: 'b-republica' },
  { id: 'p-conselheiro', nome: 'Antônio Conselheiro', feito: 'liderou a comunidade sertaneja de Canudos, destruída em 1897', evento: 'b-canudos' },
  { id: 'p-vargas', nome: 'Getúlio Vargas', feito: 'liderou a Revolução de 1930 e instituiu o Estado Novo em 1937', evento: 'b-era-vargas' },
  { id: 'p-jk', nome: 'Juscelino Kubitschek', feito: 'lançou o Plano de Metas e construiu Brasília, inaugurada em 1960', evento: 'b-jk' },
  { id: 'p-jango', nome: 'João Goulart', feito: 'propôs as reformas de base e foi deposto pelo golpe de 1964', evento: 'b-janio-jango' },
  { id: 'p-costa-silva', nome: 'Costa e Silva', feito: 'era o presidente quando foi editado o AI-5, em dezembro de 1968', evento: 'b-ai5' },
  { id: 'p-tancredo', nome: 'Tancredo Neves', feito: 'foi eleito pelo Colégio Eleitoral em 1985, mas morreu antes de tomar posse', evento: 'b-nova-republica' },
  { id: 'p-ulysses', nome: 'Ulysses Guimarães', feito: 'presidiu a Assembleia Constituinte e promulgou a Constituição de 1988', evento: 'b-constituicao' },
  { id: 'p-fhc', nome: 'Fernando Henrique Cardoso', feito: 'como ministro da Fazenda, conduziu o Plano Real, de 1994', evento: 'b-real' },
  { id: 'p-lutero', nome: 'Martinho Lutero', feito: 'divulgou as 95 teses contra a venda de indulgências, em 1517', evento: 'm-reforma' },
  { id: 'p-toussaint', nome: 'Toussaint Louverture', feito: 'liderou a revolta de escravizados que levou à independência do Haiti', evento: 'm-haiti' },
  { id: 'p-napoleao', nome: 'Napoleão Bonaparte', feito: 'decretou o Bloqueio Continental e promulgou o Código Civil de 1804', evento: 'm-napoleao' },
  { id: 'p-bolivar', nome: 'Simón Bolívar', feito: 'liderou lutas pela independência de países da América do Sul espanhola', evento: 'm-independencias-hispano' },
  { id: 'p-bismarck', nome: 'Otto von Bismarck', feito: 'conduziu a unificação alemã sob liderança da Prússia, concluída em 1871', evento: 'm-unificacoes' },
  { id: 'p-lincoln', nome: 'Abraham Lincoln', feito: 'era o presidente dos EUA durante a Guerra de Secessão e se opôs à expansão da escravidão', evento: 'm-secessao' },
  { id: 'p-lenin', nome: 'Lênin', feito: 'liderou os bolcheviques na Revolução de Outubro de 1917', evento: 'm-rev-russa' },
  { id: 'p-roosevelt', nome: 'Franklin Roosevelt', feito: 'lançou o New Deal para enfrentar a Grande Depressão nos EUA', evento: 'm-new-deal' },
  { id: 'p-hitler', nome: 'Adolf Hitler', feito: 'tornou-se chanceler da Alemanha em 1933 e comandou o regime nazista', evento: 'm-nazifascismo' },
  { id: 'p-gandhi', nome: 'Mahatma Gandhi', feito: 'liderou a campanha de não violência pela independência da Índia', evento: 'm-india' },
  { id: 'p-mao', nome: 'Mao Tsé-tung', feito: 'proclamou a República Popular da China, em 1949', evento: 'm-rev-chinesa' },
  { id: 'p-fidel', nome: 'Fidel Castro', feito: 'liderou a guerrilha que derrubou Batista em Cuba, em 1959', evento: 'm-cuba' },
  { id: 'p-gorbatchev', nome: 'Mikhail Gorbatchev', feito: 'lançou a glasnost e a perestroika, últimas reformas da URSS', evento: 'm-urss-1991' },
  { id: 'p-mandela', nome: 'Nelson Mandela', feito: 'foi eleito presidente da África do Sul em 1994, nas primeiras eleições multirraciais', evento: 'm-apartheid' },
  { id: 'p-thatcher', nome: 'Margaret Thatcher', feito: 'foi a primeira-ministra britânica que impulsionou as privatizações a partir de 1979', evento: 'm-neoliberalismo' },
]

/* ------------------------------------------------------------------ aba Entenda */

export interface PassoHistoria {
  titulo: string
  texto: string[]
  pare: PareEPense
  /** acontecimentos mostrados na faixa cronológica da etapa */
  eventos: string[]
}

export const PASSOS_HISTORIA: PassoHistoria[] = [
  {
    titulo: 'Como ler uma linha do tempo',
    texto: [
      'Uma linha do tempo mostra duas coisas: quando cada fato aconteceu e quanto tempo ele durou. A Revolução Francesa durou dez anos (1789–1799); a Independência do Brasil tem uma data simbólica (7 de setembro de 1822), mas resulta de um processo que começou antes, com a vinda da corte em 1808.',
      'Os historiadores dividem o tempo em períodos (Colônia, Império, República Velha...). São convenções: ajudam a organizar o estudo, mas a vida não muda de um dia para o outro. Por isso é útil comparar o que acontecia ao mesmo tempo no Brasil e no mundo, e perguntar sempre o que causou cada fato e o que ele provocou.',
    ],
    pare: {
      pergunta: 'Dois acontecimentos de datas próximas têm sempre uma relação de causa e consequência?',
      opcoes: ['Não: a proximidade no tempo não prova a relação; é preciso explicar o vínculo', 'Sim, sempre', 'Só se ocorreram no mesmo país'],
      certa: 0,
      explicacao: 'Estar perto no tempo não basta. A relação de causa e consequência precisa ser explicada: a causa vem antes e ajuda a produzir o efeito.',
    },
    eventos: ['m-rev-francesa', 'b-familia-real', 'b-independencia'],
  },
  {
    titulo: 'Antiguidade e Idade Média: as raízes',
    texto: [
      'A Idade Antiga começa com a escrita, por volta de 3500 a.C., na Mesopotâmia e no Egito, e vai até a queda do Império Romano do Ocidente, em 476. Dela vêm ideias que usamos até hoje: leis escritas (Hamurábi), democracia (Atenas), república, senado e direito (Roma).',
      'A Idade Média (476–1453) começa com os reinos germânicos e a força da Igreja católica. O islamismo se expande até a Península Ibérica; o feudalismo organiza a sociedade em senhores e servos; as Cruzadas e o renascimento do comércio fazem crescer as cidades e a burguesia. A crise do século XIV, com a Peste Negra, abre caminho para a Idade Moderna. Enquanto isso, no Brasil, povos indígenas, como os da ilha de Marajó, viviam em sociedades complexas.',
    ],
    pare: {
      pergunta: 'Que acontecimento os manuais usam como marco da passagem da Idade Antiga para a Idade Média?',
      opcoes: ['A queda do Império Romano do Ocidente, em 476', 'A chegada de Colombo à América, em 1492', 'A invenção da escrita, por volta de 3500 a.C.'],
      certa: 0,
      explicacao: 'Em 476, o último imperador romano do Ocidente foi deposto. A escrita marca o começo da Idade Antiga, e 1453 (queda de Constantinopla) é o marco usado para o fim da Idade Média.',
    },
    eventos: ['m-escrita', 'm-atenas', 'm-imperio-romano', 'm-queda-roma', 'm-feudalismo', 'm-cruzadas', 'm-peste', 'b-marajoara'],
  },
  {
    titulo: 'Expansão marítima e início da colonização',
    texto: [
      'No fim do século XV, Portugal e Espanha lideram a expansão marítima, em busca de especiarias, metais e novas rotas, com o apoio de Estados que se fortaleciam. Colombo chega à América em 1492; o Tratado de Tordesilhas (1494) divide as terras entre os dois reinos; Cabral chega ao Brasil em 1500.',
      'Nas primeiras décadas, a Coroa portuguesa explora o pau-brasil por escambo com os indígenas. Para ocupar e defender a costa, cria as capitanias hereditárias (1534) e, depois do seu fracasso em grande parte, o Governo-Geral (1549), com os jesuítas.',
    ],
    pare: {
      pergunta: 'O que o Tratado de Tordesilhas estabeleceu?',
      opcoes: ['A divisão das terras novas entre Portugal e Espanha', 'Um acordo comercial entre Portugal e Inglaterra', 'O fim da escravidão na América'],
      certa: 0,
      explicacao: 'Em 1494, Portugal e Espanha dividiram, por uma linha a oeste de Cabo Verde, as terras já descobertas e por descobrir.',
    },
    eventos: ['m-colombo', 'm-tordesilhas', 'b-1500', 'b-capitanias', 'b-governo-geral'],
  },
  {
    titulo: 'Açúcar, escravidão e resistência',
    texto: [
      'Do século XVI ao XVII, a economia colonial se baseou no engenho de açúcar do Nordeste: grande propriedade, monocultura, exportação para a Europa e trabalho escravizado, cada vez mais africano. O tráfico de africanos trouxe cerca de 5 milhões de pessoas ao Brasil até meados do século XIX.',
      'Os holandeses ocuparam o Nordeste açucareiro (1630–1654) e foram expulsos; depois, o açúcar das Antilhas concorreu com o brasileiro. A escravidão gerou resistência, de que o Quilombo dos Palmares é o maior símbolo.',
    ],
    pare: {
      pergunta: 'Qual era a base da economia colonial nos séculos XVI e XVII?',
      opcoes: ['O engenho de açúcar, com trabalho escravizado', 'A indústria têxtil em fábricas', 'A mineração de ouro em Minas Gerais'],
      certa: 0,
      explicacao: 'O açúcar dominou até o fim do século XVII. A mineração só ganhou importância a partir de 1700.',
    },
    eventos: ['b-acucar', 'b-trafico', 'b-uniao-iberica', 'b-holandeses', 'b-palmares'],
  },
  {
    titulo: 'Mineração e crise do sistema colonial',
    texto: [
      'No século XVIII, o ouro de Minas Gerais desloca o centro econômico para o Sudeste, e a capital passa para o Rio de Janeiro (1763). A Coroa cobra o quinto e, quando a produção cai, a derrama. Pombal tenta reorganizar o império português com ideias do despotismo esclarecido.',
      'Enquanto isso, as ideias iluministas e as independências dos EUA (1776) e do Haiti (1804), além da Revolução Francesa, inspiram conspirações coloniais: Inconfidência Mineira (1789) e Conjuração Baiana (1798). Ambas foram reprimidas.',
    ],
    pare: {
      pergunta: 'Por que a derrama ajudou a causar a Inconfidência Mineira?',
      opcoes: ['Era a cobrança de impostos atrasados num momento de queda do ouro', 'Era uma lei que proibia o uso de escravos nas minas', 'Era um imposto sobre o açúcar do Nordeste'],
      certa: 0,
      explicacao: 'Com a queda da produção de ouro, a Coroa exigia os impostos atrasados (derrama). Isso aumentou o descontentamento das elites mineiras.',
    },
    eventos: ['b-mineracao', 'b-pombal', 'm-iluminismo', 'm-independencia-eua', 'b-inconfidencia', 'b-conjuracao-baiana'],
  },
  {
    titulo: 'Revoluções burguesas e Revolução Industrial',
    texto: [
      'A Revolução Inglesa limitou o poder do rei (monarquia parlamentar). A Revolução Industrial, a partir de 1760, criou fábricas, a burguesia industrial e o operariado. A independência dos EUA (1776) e a Revolução Francesa (1789) combateram o absolutismo e os privilégios, em nome da liberdade e da igualdade perante a lei.',
      'Napoleão (1799–1815) espalhou o Código Civil e ideias liberais, mas também invadiu Portugal e a Espanha, o que abalou os impérios coloniais ibéricos. A Revolução do Haiti (1791–1804) mostrou que escravizados podiam derrubar a escravidão e formar um Estado.',
    ],
    pare: {
      pergunta: 'O que a Revolução Francesa combateu em 1789?',
      opcoes: ['Os privilégios do Antigo Regime e o absolutismo', 'A industrialização da Inglaterra', 'O Tratado de Tordesilhas'],
      certa: 0,
      explicacao: 'A Revolução derrubou os privilégios do clero e da nobreza e o absolutismo, e afirmou a igualdade perante a lei.',
    },
    eventos: ['m-revolucoes-inglesas', 'm-rev-industrial', 'm-independencia-eua', 'm-rev-francesa', 'm-haiti', 'm-napoleao'],
  },
  {
    titulo: 'Da corte no Rio à Independência e ao Império',
    texto: [
      'A invasão napoleônica levou a família real portuguesa ao Brasil em 1808. Dom João abriu os portos, criou instituições e, em 1815, elevou o Brasil a Reino Unido. Depois da Revolução do Porto (1820), as Cortes exigiram o retorno do rei e a recolonização, e dom Pedro proclamou a Independência (1822).',
      'O Primeiro Reinado (1822–1831) terminou com a abdicação de dom Pedro I. A Regência (1831–1840) foi marcada por revoltas provinciais, e o Golpe da Maioridade deu início ao Segundo Reinado (1840–1889), com estabilidade política e a expansão do café.',
    ],
    pare: {
      pergunta: 'Que acontecimento europeu levou a corte portuguesa ao Brasil em 1808?',
      opcoes: ['A invasão de Portugal pelas tropas de Napoleão', 'A Revolução Russa', 'O fim da Guerra dos Sete Anos'],
      certa: 0,
      explicacao: 'Para escapar da invasão francesa a Portugal (1807), a corte se transferiu para o Brasil sob proteção da Inglaterra.',
    },
    eventos: ['m-napoleao', 'b-familia-real', 'b-independencia', 'b-primeiro-reinado', 'b-regencia', 'b-segundo-reinado'],
  },
  {
    titulo: 'Imperialismo, café, imigração e abolição',
    texto: [
      'A Segunda Revolução Industrial e o imperialismo ligaram o Brasil ao mercado mundial como exportador de café. O café do Oeste Paulista, as ferrovias e os capitais ingleses mudaram a economia. A Lei Eusébio de Queirós (1850) proibiu o tráfico, e a Lei de Terras dificultou o acesso à terra.',
      'Os fazendeiros paulistas passaram a usar imigrantes. A escravidão acabou por etapas — Ventre Livre (1871), Sexagenários (1885) e Lei Áurea (1888) —, sem inclusão dos libertos. Sem o apoio dos fazendeiros e com o Exército insatisfeito, a monarquia caiu em 1889.',
    ],
    pare: {
      pergunta: 'Por que muitos fazendeiros passaram a apoiar a imigração europeia?',
      opcoes: ['Para substituir a mão de obra escrava, em fim de vida', 'Para aumentar o preço do café no mercado mundial', 'Para reduzir o número de ferrovias'],
      certa: 0,
      explicacao: 'Sem o tráfico e com a escravidão em crise, os cafeicultores buscaram trabalhadores livres da Europa, com subsídio de passagens pelo governo paulista.',
    },
    eventos: ['m-segunda-rev-industrial', 'm-imperialismo', 'b-cafe', 'b-eusebio-terras', 'b-imigracao', 'b-abolicao', 'b-republica'],
  },
  {
    titulo: 'República Velha e período entreguerras',
    texto: [
      'A República Velha (1889–1930) foi oligárquica: política dos governadores, "café com leite", coronelismo e fraude eleitoral. Houve revoltas populares (Canudos, Contestado, Vacina, Chibata), greves operárias e o tenentismo; em 1922, a Semana de Arte Moderna renovou a cultura.',
      'No mundo, a Primeira Guerra (1914–1918), a Revolução Russa (1917) e a crise de 1929 mudaram a ordem econômica e política. A crise derrubou o preço do café, enfraqueceu as oligarquias e levou à Revolução de 1930.',
    ],
    pare: {
      pergunta: 'Por que a crise de 1929 atingiu tanto a economia brasileira?',
      opcoes: ['Porque o preço do café, principal exportação, despencou', 'Porque o Brasil era o maior importador de produtos industriais dos EUA', 'Porque a guerra impediu os navios de sair dos portos'],
      certa: 0,
      explicacao: 'O Brasil dependia do café, vendido sobretudo aos EUA. Com a Depressão, a demanda e o preço caíram, e as oligarquias cafeeiras perderam força.',
    },
    eventos: ['b-republica-velha', 'm-1gm', 'm-rev-russa', 'b-canudos', 'b-modernismo', 'm-crise-1929', 'b-1930'],
  },
  {
    titulo: 'Era Vargas e Segunda Guerra Mundial',
    texto: [
      'Vargas governou de 1930 a 1945: Governo Provisório, Constitucionalista de 1932, Constituição de 1934 e, a partir do golpe de 1937 (justificado pelo falso Plano Cohen), o Estado Novo. Foram anos de centralização, industrialização (CSN), legislação trabalhista (CLT, 1943), censura e repressão.',
      'No mundo, o nazifascismo levou à Segunda Guerra (1939–1945) e ao Holocausto. O Brasil entrou na guerra contra o Eixo e enviou a FEB à Itália (1944–1945). A contradição de lutar contra o fascismo sob uma ditadura contribuiu para o fim do Estado Novo.',
    ],
    pare: {
      pergunta: 'Que justificativa Vargas usou para dar o golpe de 1937?',
      opcoes: ['Uma suposta ameaça comunista (Plano Cohen)', 'A ameaça de invasão paraguaia', 'A crise do café de 1929'],
      certa: 0,
      explicacao: 'O Plano Cohen, um documento falso que descrevia uma insurreição comunista, serviu de pretexto para o golpe e para o Estado Novo.',
    },
    eventos: ['b-era-vargas', 'm-nazifascismo', 'b-estado-novo', 'b-clt', 'm-2gm', 'm-holocausto', 'b-feb'],
  },
  {
    titulo: 'Guerra Fria, descolonização e República de 1946',
    texto: [
      'Depois de 1945, EUA e URSS disputam o mundo na Guerra Fria, sem guerra direta entre si: corrida armamentista, Plano Marshall, guerras indiretas (Coreia, Vietnã) e a Revolução Cubana (1959). Ao mesmo tempo, a Ásia e a África se descolonizam.',
      'No Brasil, a República de 1946 foi democrática, com Vargas eleito (Petrobras, 1953), JK (Plano de Metas e Brasília) e uma crise crescente com Jânio e Jango. Industrialização com capital estrangeiro, nacionalismo, populismo e polarização política marcam o período.',
    ],
    pare: {
      pergunta: 'O que marcou o governo de Juscelino Kubitschek?',
      opcoes: ['O Plano de Metas, a industrialização com capital estrangeiro e a construção de Brasília', 'A criação da CLT e do Estado Novo', 'O fim da escravidão e o início da imigração'],
      certa: 0,
      explicacao: 'JK lançou o Plano de Metas ("50 anos em 5"), atraiu multinacionais (indústria automobilística) e construiu Brasília (1960).',
    },
    eventos: ['m-guerra-fria', 'm-descolonizacao', 'm-cuba', 'b-petrobras', 'b-jk', 'b-janio-jango'],
  },
  {
    titulo: 'Ditadura militar e redemocratização',
    texto: [
      'O golpe de 1964 derrubou Goulart, num contexto de Guerra Fria e de polarização, e inaugurou 21 anos de regime militar. O AI-5 (1968) endureceu a repressão; o "milagre econômico" (1968–1973) trouxe crescimento com concentração de renda e endividamento externo; o choque do petróleo (1973) desgastou o modelo.',
      'A abertura "lenta, gradual e segura" incluiu a Lei da Anistia (1979). O movimento Diretas Já (1983–1984) mobilizou milhões, a emenda foi rejeitada, mas o regime acabou em 1985, e a Constituição de 1988 consolidou direitos e a democracia.',
    ],
    pare: {
      pergunta: 'O que foi o AI-5, de dezembro de 1968?',
      opcoes: ['O ato que endureceu a ditadura, com fechamento do Congresso, censura e repressão', 'A lei que concedeu anistia aos presos políticos', 'A emenda que previa eleições diretas para presidente'],
      certa: 0,
      explicacao: 'O AI-5 fechou o Congresso, suspendeu o habeas corpus em crimes políticos e ampliou a censura e a tortura. A anistia veio em 1979 e a emenda das diretas, em 1984.',
    },
    eventos: ['b-golpe-1964', 'b-ai5', 'b-milagre', 'm-petroleo-73', 'b-anistia', 'b-diretas', 'b-nova-republica', 'b-constituicao'],
  },
  {
    titulo: 'Mundo contemporâneo e Brasil atual',
    texto: [
      'A queda do Muro de Berlim (1989) e a dissolução da URSS (1991) encerraram a Guerra Fria. O mundo passou a ser dominado pela hegemonia dos EUA, pela globalização financeira e pelo neoliberalismo; os atentados de 11 de setembro (2001) abriram a "guerra ao terror"; a crise de 2008 abalou o sistema financeiro.',
      'No Brasil, depois do impeachment de Collor (1992), o Plano Real (1994) estabilizou a moeda. A Constituição de 1988 ampliou direitos, e programas como o Bolsa Família (2003) buscaram reduzir a pobreza. Em 2016, houve o impeachment de Dilma Rousseff, em meio a uma crise política e econômica.',
    ],
    pare: {
      pergunta: 'O que aconteceu com a União Soviética em 1991?',
      opcoes: ['Foi dissolvida e deu lugar a 15 repúblicas independentes', 'Venceu a Guerra Fria em uma guerra contra os EUA', 'Unificou-se com a China'],
      certa: 0,
      explicacao: 'Em dezembro de 1991, a URSS foi dissolvida, depois de crise econômica, reformas de Gorbatchev e movimentos nacionalistas. Era o fim da Guerra Fria.',
    },
    eventos: ['m-muro-1989', 'm-urss-1991', 'b-real', 'm-11-setembro', 'm-crise-2008', 'b-impeachment-2016'],
  },
]

/* ------------------------------------------------------------------ aba Resumo */

export const RESUMO_HISTORIA: SecaoResumo[] = [
  {
    titulo: 'Antiguidade e Idade Média (c. 3500 a.C.–1453)',
    formulas: [],
    ideias: [
      'Idade Antiga: da escrita (c. 3500 a.C.) à queda de Roma (476). Egito dos faraós; Código de Hamurábi (c. 1750 a.C.).',
      'Grécia: democracia ateniense direta e restrita (Clístenes, 508 a.C.); Alexandre e o helenismo. Roma: República (509–27 a.C.) e Império (27 a.C.–476).',
      'Cristianismo: perseguido, tolerado em 313 (Edito de Milão), oficial em 380. Islã: Hégira (622) e chegada à Península Ibérica (711).',
      'Idade Média (476–1453): feudalismo, servidão e poder da Igreja; Carlos Magno (800); Cisma do Oriente (1054); Cruzadas (1096–1291).',
      'Baixa Idade Média: renascimento comercial e urbano, burguesia, Magna Carta (1215), Peste Negra (1347–1351), Guerra dos Cem Anos (1337–1453).',
    ],
    pegadinhas: ['Achar que a democracia ateniense incluía todos (mulheres, escravizados e estrangeiros eram excluídos).', 'Confundir a queda de Roma (476, Ocidente) com a queda de Constantinopla (1453, Oriente).', 'Achar que antes de 1500 o Brasil era vazio (havia muitos povos indígenas, alguns com sociedades complexas, como em Marajó).'],
    fontes: [F.cardoso, F.funariGR, F.francoJr, F.leGoff, F.schaan],
  },
  {
    titulo: 'Brasil Colônia (1500–1822)',
    formulas: [],
    ideias: [
      '1500: chegada dos portugueses; pau-brasil. 1534: capitanias. 1549: Governo-Geral e jesuítas.',
      'Séculos XVI–XVII: açúcar, latifúndio, escravidão africana. Holandeses no Nordeste (1630–1654). Palmares: resistência.',
      'Século XVIII: ouro em Minas, quinto e derrama, capital no Rio (1763). Pombal (1750–1777).',
      'Crise do sistema colonial: Inconfidência Mineira (1789) e Conjuração Baiana (1798), inspiradas no Iluminismo e nas revoluções.',
      '1808: corte no Rio e Abertura dos Portos; 1815: Reino Unido; 1822: Independência, mantendo monarquia, escravidão e unidade.',
    ],
    pegadinhas: ['Confundir Inconfidência Mineira (elite, 1789) com Conjuração Baiana (camadas populares, 1798).', 'Dizer que Tiradentes proclamou a República (a conspiração foi descoberta antes).', 'Achar que a independência acabou com a escravidão.'],
    fontes: [F.fausto, F.alencastro],
  },
  {
    titulo: 'Brasil Império (1822–1889)',
    formulas: [],
    ideias: [
      'Primeiro Reinado (1822–1831): Constituição de 1824 (Poder Moderador), Confederação do Equador, abdicação.',
      'Regência (1831–1840): Cabanagem, Farroupilha, Sabinada, Balaiada, Malês. Golpe da Maioridade (1840).',
      'Segundo Reinado (1840–1889): café, Guerra do Paraguai (1864–1870), Lei Eusébio de Queirós e Lei de Terras (1850).',
      'Abolição por etapas: Ventre Livre (1871), Sexagenários (1885), Lei Áurea (1888). Imigração para o café.',
      '1889: República, por golpe militar, depois da questão militar, da questão religiosa e do fim da escravidão sem indenização.',
    ],
    pegadinhas: ['Atribuir o fim do tráfico à Lei Áurea (foi a de 1850).', 'Esquecer que a Lei de Terras é de 1850 e dificultou o acesso à terra.', 'Dizer que a República foi proclamada com ampla participação popular.'],
    fontes: [F.fausto, F.carvalho],
  },
  {
    titulo: 'República Velha e Era Vargas (1889–1945)',
    formulas: [],
    ideias: [
      'República Velha: federalismo, política dos governadores, café com leite, coronelismo, voto aberto. Canudos, Contestado, Vacina, Chibata.',
      '1922: Semana de Arte Moderna e tenentismo; greves operárias (1917).',
      '1930: crise do café e quebra do café com leite; Vargas no poder. 1932: Constitucionalista. 1934: Constituição.',
      '1937: Estado Novo (Plano Cohen). CLT (1943), CSN (1941), censura (DIP). 1944–1945: FEB na Itália.',
    ],
    pegadinhas: ['Confundir Estado Novo (1937–1945) com Governo Provisório (1930–1934).', 'Dizer que a CLT concedeu direitos a todos os trabalhadores (excluía rurais e domésticos).', 'Atribuir a Revolução de 1930 só ao assassinato de João Pessoa (houve causas econômicas e políticas).'],
    fontes: [F.fausto, F.skidmore],
  },
  {
    titulo: 'República de 1946, ditadura e Nova República',
    formulas: [],
    ideias: [
      '1946–1964: Constituição de 1946, Petrobras (1953), morte de Vargas (1954), JK e Brasília (1960), Jânio (1961), reformas de base de Jango.',
      '1964: golpe; Castelo Branco; atos institucionais. 1968: AI-5. 1968–1973: milagre econômico, com arrocho e endividamento.',
      'Abertura: Geisel e Figueiredo; Anistia (1979); Diretas Já (1983–1984); Tancredo e Sarney (1985).',
      'Constituição de 1988; Collor e impeachment (1992); Plano Real (1994); Bolsa Família (2003).',
    ],
    pegadinhas: ['Trocar Jânio (renunciou em 1961) por Jango (deposto em 1964).', 'Dizer que as Diretas Já conseguiram aprovar a emenda (foi rejeitada em 1984).', 'Atribuir o Plano Real ao governo Collor.'],
    fontes: [F.fico, F.skidmore, F.schwarcz],
  },
  {
    titulo: 'Mundo moderno e revoluções (1453–1870)',
    formulas: [],
    ideias: [
      'Expansão marítima: Colombo (1492), Tordesilhas (1494). Reforma (1517) e Contrarreforma.',
      'Absolutismo e mercantilismo; Revolução Inglesa (monarquia parlamentar); Iluminismo no século XVIII.',
      'Revolução Industrial (Inglaterra, c. 1760); independência dos EUA (1776); Revolução Francesa (1789); Haiti (1791–1804).',
      'Napoleão (1799–1815); independências hispano-americanas; Primavera dos Povos (1848); unificações italiana e alemã; Guerra de Secessão.',
    ],
    pegadinhas: ['Achar que a Revolução Industrial começou na França (foi na Inglaterra).', 'Confundir a Revolução Francesa (1789) com a Era Napoleônica (1799–1815).', 'Dizer que o Haiti foi a primeira independência da América (foi a dos EUA, em 1776; o Haiti foi a primeira feita por escravizados).'],
    fontes: [F.hobsbawmRev, F.hobsbawmCap],
  },
  {
    titulo: 'Imperialismo e guerras mundiais (1870–1945)',
    formulas: [],
    ideias: [
      'Segunda Revolução Industrial; imperialismo; Conferência de Berlim (1884–1885).',
      'Primeira Guerra (1914–1918): alianças, rivalidades, Sarajevo; Versalhes (1919). Revolução Russa (1917).',
      'Crise de 1929; New Deal; fascismo e nazismo; Segunda Guerra (1939–1945); Holocausto; bombas atômicas.',
    ],
    pegadinhas: ['Atribuir a causa da Primeira Guerra apenas ao assassinato em Sarajevo (foi o estopim; as causas são mais profundas).', 'Confundir a Revolução de Fevereiro com a de Outubro de 1917.', 'Dizer que o Holocausto atingiu apenas os judeus.'],
    fontes: [F.hobsbawmImp, F.hobsbawmExt],
  },
  {
    titulo: 'Guerra Fria e mundo contemporâneo (1945–hoje)',
    formulas: [],
    ideias: [
      'ONU (1945); Plano Marshall (1947); OTAN e Pacto de Varsóvia; China (1949); Coreia; Cuba (1959); Crise dos Mísseis (1962); Vietnã.',
      'Descolonização afro-asiática (Índia, 1947; África nos anos 1960; colônias portuguesas em 1975).',
      'Choques do petróleo (1973, 1979); neoliberalismo; Muro de Berlim (1989) e URSS (1991).',
      'Mundo atual: globalização, 11 de setembro (2001), crise de 2008.',
    ],
    pegadinhas: ['Achar que houve guerra direta entre EUA e URSS na Guerra Fria.', 'Confundir queda do Muro (1989) com a dissolução da URSS (1991).', 'Esquecer que a descolonização africana se concentra nos anos 1950 e 1960.'],
    fontes: [F.hobsbawmExt, F.judt],
  },
]
