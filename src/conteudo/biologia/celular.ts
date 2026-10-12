import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualCelular =
  | { tipo: 'comparacao' }
  | { tipo: 'energia' }
  | { tipo: 'secretoria' }
  | { tipo: 'bicamada' }
  | { tipo: 'transporte' }
  | { tipo: 'osmose' }
  | { tipo: 'ciclo' }
  | { tipo: 'mitose' }
  | { tipo: 'meiose' }
  | { tipo: 'comparacaoDivisao' }
  | { tipo: 'respiracao' }
  | { tipo: 'fotossintese' }
  | { tipo: 'enzima' }

export interface PassoCelular {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualCelular
}

export const PASSOS_CELULAR: PassoCelular[] = [
  {
    titulo: 'Células procariontes e eucariontes',
    texto: [
      'Todas as células têm membrana plasmática, citoplasma, ribossomos e DNA. Nas procariontes (as bactérias), o DNA fica solto no citoplasma, em uma região chamada nucleoide, e não há organelas delimitadas por membrana. Nas eucariontes (animais, plantas, fungos e protistas), o DNA fica dentro de um núcleo delimitado por envoltório, e o citoplasma tem organelas membranosas.',
      'A tabela mostra onde existe cada estrutura. Bactérias têm parede celular (de peptideoglicano); as plantas têm parede de celulose; as células animais não têm parede. Cloroplastos, vacúolo central e parede celular de celulose são típicos de células vegetais; o centríolo, de células animais.',
    ],
    pare: {
      pergunta: 'Qual destas estruturas existe nas bactérias?',
      opcoes: ['Ribossomo', 'Mitocôndria', 'Núcleo'],
      certa: 0,
      explicacao: 'Bactérias têm ribossomos (todas as células têm). Mitocôndrias e núcleo são típicos de eucariontes: a bactéria tem DNA sem envoltório e nenhuma organela membranosa.',
    },
    visual: { tipo: 'comparacao' },
  },
  {
    titulo: 'Mitocôndrias e cloroplastos: as organelas de energia',
    texto: [
      'A mitocôndria realiza a respiração celular aeróbica e produz a maior parte do ATP. É envolvida por duas membranas, tem DNA e ribossomos próprios, e a membrana interna forma dobras, as cristas. O cloroplasto, exclusivo de plantas e algas, realiza a fotossíntese; também tem duas membranas e DNA próprio, e dentro dele há sacos achatados (tilacoides), empilhados em grana, onde estão as clorofilas.',
      'Como essas duas organelas têm DNA próprio, ribossomos parecidos com os das bactérias e se multiplicam sozinhas por divisão, supõe-se que descendem de bactérias englobadas por células ancestrais (teoria da endossimbiose). Clique nas estruturas do desenho para ver a função de cada uma e troque o tipo de célula para comparar.',
    ],
    pare: {
      pergunta: 'Qual destas organelas existe tanto em células animais quanto em vegetais?',
      opcoes: ['Mitocôndria', 'Cloroplasto', 'Vacúolo central'],
      certa: 0,
      explicacao: 'A mitocôndria existe nos dois tipos de células eucarióticas. Cloroplasto e vacúolo central são típicos das células vegetais.',
    },
    visual: { tipo: 'energia' },
  },
  {
    titulo: 'Síntese, secreção e digestão',
    texto: [
      'Os ribossomos (livres ou aderidos ao retículo rugoso) sintetizam proteínas. As proteínas que serão exportadas entram no retículo endoplasmático rugoso, seguem em vesículas até o complexo de Golgi, que as modifica, empacota e distribui, e saem da célula por exocitose. O retículo liso sintetiza lipídios e esteroides e participa da desintoxicação, por exemplo nas células do fígado.',
      'O Golgi também forma os lisossomos, vesículas com enzimas hidrolíticas que fazem a digestão intracelular. Os peroxissomos decompõem o peróxido de hidrogênio (H₂O₂), que é tóxico, pela enzima catalase. O vacúolo central das plantas armazena água e substâncias e mantém a turgescência.',
    ],
    pare: {
      pergunta: 'Qual organela modifica e empacota proteínas em vesículas para a secreção?',
      opcoes: ['Complexo de Golgi', 'Lisossomo', 'Peroxissomo'],
      certa: 0,
      explicacao: 'O Golgi recebe as proteínas do retículo rugoso, modifica-as e as empacota. O lisossomo digere material e o peroxissomo decompõe o H₂O₂.',
    },
    visual: { tipo: 'secretoria' },
  },
  {
    titulo: 'A membrana plasmática',
    texto: [
      'A membrana plasmática é uma bicamada de fosfolipídios: as cabeças hidrofílicas ficam voltadas para a água (fora e dentro da célula) e as caudas hidrofóbicas ficam no interior da bicamada. Proteínas inseridas nela formam canais, carregadoras e receptores; glicoproteínas e glicolipídios na face externa participam do reconhecimento entre as células. No modelo do mosaico fluido, as moléculas se movem lateralmente.',
      'Por ser lipídica, a membrana deixa passar com facilidade moléculas pequenas e apolares (O₂, CO₂) e dificulta a passagem de íons e de moléculas polares, que dependem de proteínas. Por isso ela é seletiva (semipermeável).',
    ],
    pare: {
      pergunta: 'Qual substância atravessa a bicamada lipídica com mais facilidade, sem ajuda de proteínas?',
      opcoes: ['O₂ (gás oxigênio)', 'Íon sódio (Na⁺)', 'Glicose'],
      certa: 0,
      explicacao: 'O₂ é pequeno e apolar. Íons (carregados) e glicose (polar) precisam de canais ou de proteínas carregadoras.',
    },
    visual: { tipo: 'bicamada' },
  },
  {
    titulo: 'Transporte através da membrana',
    texto: [
      'No transporte passivo, a substância se move a favor do gradiente de concentração (do meio mais concentrado para o menos concentrado), sem gasto de ATP. Na difusão simples, ela atravessa a bicamada (O₂, CO₂). Na difusão facilitada, ela passa por canais ou proteínas carregadoras (glicose, íons).',
      'No transporte ativo, a substância é levada contra o gradiente, por proteínas (bombas), com gasto de ATP. Exemplo: a bomba de sódio e potássio, que mantém muito Na⁺ fora e muito K⁺ dentro da célula. Partículas grandes entram por endocitose (fagocitose, quando sólidas, e pinocitose, quando líquidas) e saem por exocitose, sempre em vesículas e com gasto de energia.',
    ],
    pare: {
      pergunta: 'A bomba de sódio e potássio leva Na⁺ para fora da célula, onde ele já é mais concentrado. Esse transporte é:',
      opcoes: ['Ativo, com gasto de ATP', 'Difusão facilitada', 'Difusão simples'],
      certa: 0,
      explicacao: 'O Na⁺ vai do meio menos concentrado (dentro) para o mais concentrado (fora): é contra o gradiente, o que exige bomba e ATP.',
    },
    visual: { tipo: 'transporte' },
  },
  {
    titulo: 'Osmose e tonicidade',
    texto: [
      'Osmose é a passagem de água por uma membrana semipermeável, do meio de menor concentração de solutos (menor osmolaridade) para o de maior. Um meio hipotônico tem menos solutos do que a célula (a água entra), o isotônico tem a mesma concentração (sem variação líquida de água) e o hipertônico tem mais solutos (a água sai). A osmolaridade conta partículas: 0,15 mol/L de NaCl liberam 2 partículas por fórmula e valem 0,30 osmol/L.',
      'A hemácia (célula animal, sem parede) em meio hipotônico incha e pode estourar (lise); em meio hipertônico, murcha (crenação). O soro fisiológico (NaCl 0,9 %, cerca de 0,15 mol/L) é isotônico às hemácias. A célula vegetal, com parede, fica túrgida em meio hipotônico (a parede impede que estoure) e sofre plasmólise em meio hipertônico (a membrana se descola da parede).',
    ],
    pare: {
      pergunta: 'Uma hemácia é colocada em água destilada. O que acontece com ela?',
      opcoes: ['Incha e pode estourar (lise)', 'Murcha (crenação)', 'Nada, pois a água não atravessa a membrana'],
      certa: 0,
      explicacao: 'A água destilada é hipotônica em relação à hemácia: a água entra por osmose, a célula incha e, sem parede, pode estourar.',
    },
    visual: { tipo: 'osmose' },
  },
  {
    titulo: 'O ciclo celular e a duplicação do DNA',
    texto: [
      'O ciclo celular tem a interfase (G1, S e G2) e a divisão (mitose ou meiose, mais a citocinese). Na fase S, o DNA é duplicado: cada cromossomo passa a ter duas cromátides-irmãs, unidas pelo centrômero. Na G1 o cromossomo tem uma cromátide; depois da fase S, tem duas.',
      'Por isso a quantidade de DNA por célula (em unidades C) dobra na fase S e só volta ao valor inicial quando a célula se divide. Nas contagens, cada cromátide-irmã, depois de separada na anáfase, passa a ser contada como um cromossomo.',
    ],
    pare: {
      pergunta: 'Uma célula com 2n = 8 está na fase G2 (depois da duplicação do DNA). Quantas cromátides ela tem?',
      opcoes: ['16', '8', '4'],
      certa: 0,
      explicacao: 'Há 8 cromossomos e, depois da fase S, cada um tem 2 cromátides: 8 × 2 = 16.',
    },
    visual: { tipo: 'ciclo' },
  },
  {
    titulo: 'Mitose',
    texto: [
      'A mitose forma duas células-filhas geneticamente idênticas, com o mesmo número de cromossomos da célula-mãe (2n → 2n). Na prófase, os cromossomos se condensam e o envoltório nuclear se desfaz. Na metáfase, os cromossomos duplicados se alinham no equador da célula, presos às fibras do fuso. Na anáfase, as cromátides-irmãs se separam e vão para polos opostos. Na telófase, formam-se dois núcleos, e a citocinese divide o citoplasma.',
      'A mitose serve ao crescimento, à renovação de tecidos e à reprodução assexuada. Nas figuras (organismo 2n = 4), cada traço é um cromossomo, com duas cromátides quando duplicado; o azul e o vermelho distinguem os homólogos de origem materna e paterna.',
    ],
    pare: {
      pergunta: 'Em uma célula com 2n = 4, quantos cromossomos há na anáfase da mitose?',
      opcoes: ['8', '4', '2'],
      certa: 0,
      explicacao: 'Os 4 cromossomos duplicados têm 8 cromátides. Na anáfase elas se separam e cada uma passa a ser um cromossomo: 8 cromossomos.',
    },
    visual: { tipo: 'mitose' },
  },
  {
    titulo: 'Meiose',
    texto: [
      'A meiose forma gametas (ou esporos) com metade dos cromossomos (2n → n), por duas divisões sucessivas depois de uma só duplicação do DNA. Na meiose I, os homólogos se emparelham (tétrades) na prófase I, podem trocar pedaços (crossing-over), alinham-se em pares na metáfase I e se separam na anáfase I: as duas células resultantes têm n cromossomos, ainda duplicados. A meiose II lembra a mitose: as cromátides-irmãs se separam na anáfase II, e resultam quatro células haploides.',
      'A variabilidade vem do crossing-over e da segregação independente dos pares de homólogos: um organismo com n pares forma 2ⁿ tipos de gameta, sem contar o crossing-over. Na espermatogênese, uma célula forma 4 espermatozoides; na ovogênese, forma 1 óvulo e glóbulos polares.',
    ],
    pare: {
      pergunta: 'Na anáfase I da meiose, o que se separa?',
      opcoes: ['Os cromossomos homólogos', 'As cromátides-irmãs', 'Apenas os centríolos'],
      certa: 0,
      explicacao: 'Na anáfase I separam-se os homólogos (cada um ainda com duas cromátides). As cromátides-irmãs só se separam na anáfase II.',
    },
    visual: { tipo: 'meiose' },
  },
  {
    titulo: 'Mitose × meiose',
    texto: [
      'A mitose ocorre nas células somáticas e mantém o número de cromossomos; a meiose ocorre nas células germinativas e o reduz à metade. A diferença central está na meiose I: o pareamento e a separação dos homólogos, que não acontecem na mitose.',
      'Para reconhecer uma fase em uma figura: (1) conte as células; (2) veja se os cromossomos são duplicados (duas cromátides) ou simples; (3) veja se os homólogos estão pareados. Homólogos pareados no equador indicam metáfase I; cromossomos duplicados soltos no equador, em número igual ao 2n, indicam metáfase da mitose; metade do número de cromossomos em cada uma de duas células indica metáfase II.',
    ],
    pare: {
      pergunta: 'Qual processo produz quatro células geneticamente diferentes, com metade do número de cromossomos?',
      opcoes: ['Meiose', 'Mitose', 'Os dois'],
      certa: 0,
      explicacao: 'A meiose faz duas divisões e forma quatro células haploides, diferentes entre si por causa do crossing-over e da segregação independente. A mitose forma duas células idênticas.',
    },
    visual: { tipo: 'comparacaoDivisao' },
  },
  {
    titulo: 'Respiração celular e fermentação',
    texto: [
      'A respiração aeróbica oxida a glicose com O₂: C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + energia (ATP). Tem três etapas: a glicólise (citosol), que converte a glicose em 2 piruvato com saldo de 2 ATP; o ciclo de Krebs (matriz mitocondrial), que libera CO₂; e a cadeia respiratória (cristas mitocondriais), em que o O₂ é o aceptor final dos elétrons e se forma a maior parte do ATP (dezenas por glicose: os livros citam valores de 30 a 38).',
      'Sem O₂, a glicólise continua e o piruvato é fermentado. Na fermentação alcoólica (leveduras), a glicose forma 2 etanol + 2 CO₂ + 2 ATP. Na fermentação lática (músculo em esforço intenso, bactérias do iogurte), forma 2 lactato + 2 ATP, sem liberar CO₂. O rendimento é muito menor que o da respiração.',
    ],
    pare: {
      pergunta: 'Qual é o saldo de ATP da glicólise, por molécula de glicose?',
      opcoes: ['2 ATP', '6 ATP', '36 ATP'],
      certa: 0,
      explicacao: 'A glicólise forma 4 ATP e gasta 2: saldo de 2 ATP por glicose. É também o rendimento das fermentações.',
    },
    visual: { tipo: 'respiracao' },
  },
  {
    titulo: 'Fotossíntese',
    texto: [
      'A fotossíntese converte energia luminosa em energia química: 6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂. Na fase clara (fotoquímica, nos tilacoides), a clorofila absorve a luz, a água é quebrada (liberando O₂) e formam-se ATP e NADPH. Na fase química (ciclo de Calvin, no estroma), o CO₂ é fixado e, com o ATP e o NADPH, forma a glicose.',
      'A taxa de fotossíntese cresce com a luz até saturar; a respiração ocorre o tempo todo. O ponto de compensação luminoso é a luz em que a fotossíntese iguala a respiração: abaixo dele, a planta consome mais O₂ do que produz; acima, produz mais. A fotossíntese depende também da temperatura e da concentração de CO₂.',
    ],
    pare: {
      pergunta: 'De qual molécula vem o O₂ liberado na fotossíntese?',
      opcoes: ['Da água', 'Do CO₂', 'Da glicose'],
      certa: 0,
      explicacao: 'O O₂ vem da água, quebrada na fase clara. O carbono do CO₂ vai para a glicose.',
    },
    visual: { tipo: 'fotossintese' },
  },
  {
    titulo: 'Enzimas e ATP',
    texto: [
      'Enzimas são proteínas que aceleram as reações químicas da célula ao diminuir a energia de ativação. São específicas para o seu substrato, não são consumidas na reação e funcionam melhor em uma temperatura e em um pH ótimos. Calor excessivo desnatura a enzima: ela perde a forma e a função, em geral de modo irreversível. O frio apenas diminui a atividade, sem desnaturar.',
      'O ATP é a “moeda de energia” da célula: a quebra da última ligação de fosfato (ATP → ADP + Pi) libera a energia usada no transporte ativo, na contração muscular e nas sínteses. A célula regenera o ATP na respiração, na fermentação e na fase clara da fotossíntese.',
    ],
    pare: {
      pergunta: 'Uma enzima é aquecida muito acima da temperatura ótima e depois resfriada. O que se espera?',
      opcoes: ['Continua sem atividade, pois desnaturou', 'Volta à atividade máxima', 'Fica mais ativa do que antes'],
      certa: 0,
      explicacao: 'O calor excessivo desfaz a forma da enzima de modo irreversível; resfriar não a restaura.',
    },
    visual: { tipo: 'enzima' },
  },
]

export const RESUMO_CELULAR: SecaoResumo[] = [
  {
    titulo: 'Estruturas e organelas',
    formulas: [],
    ideias: [
      'Procariontes: sem núcleo e sem organelas membranosas; têm ribossomos, membrana plasmática e (em geral) parede.',
      'Só vegetais: cloroplasto, vacúolo central e parede de celulose. Só animais: centríolo.',
      'Duas membranas: núcleo, mitocôndria e cloroplasto. DNA próprio: mitocôndria e cloroplasto (endossimbiose).',
      'Proteína de secreção: ribossomo do RE rugoso → Golgi → vesícula → exocitose. Lisossomo digere; peroxissomo decompõe H₂O₂; RE liso: lipídios e desintoxicação.',
    ],
    pegadinhas: ['Achar que bactérias têm mitocôndrias.', 'Atribuir a fotossíntese à mitocôndria.', 'Dizer que o Golgi digere (ele forma o lisossomo, que digere).'],
  },
  {
    titulo: 'Membrana, transporte e osmose',
    formulas: [
      { rotulo: 'Osmolaridade', tex: '\\text{osmolaridade} = M \\cdot i \\quad (i = \\text{partículas por fórmula})' },
      { rotulo: 'Pressão osmótica (T em kelvin)', tex: '\\pi = i \\cdot M \\cdot R \\cdot T \\quad (R = 0{,}082\\ \\text{atm·L/(mol·K)})' },
      { rotulo: 'Diluição', tex: 'C_1 V_1 = C_2 V_2' },
    ],
    ideias: [
      'Difusão simples: a favor do gradiente, sem proteína, sem ATP (O₂, CO₂). Facilitada: a favor, com proteína, sem ATP (glicose, íons). Ativo: contra o gradiente, com proteína (bomba) e ATP.',
      'Osmose: água do meio de menor para o de maior osmolaridade. Hipotônico: a água entra. Hipertônico: a água sai.',
      'Hemácia: lise (hipotônico), normal (isotônico), crenação (hipertônico). Célula vegetal: túrgida, flácida, plasmólise. Soro fisiológico: NaCl 0,9 % ≈ 0,15 mol/L.',
    ],
    pegadinhas: ['Esquecer que NaCl conta 2 partículas (e CaCl₂, 3).', 'Usar a temperatura em °C em π = i M R T.', 'Achar que a célula vegetal estoura em meio hipotônico (a parede a protege).'],
  },
  {
    titulo: 'Ciclo celular, mitose e meiose',
    formulas: [
      { rotulo: 'Células depois de k mitoses', tex: 'N = 2^{\\,k}' },
      { rotulo: 'Tipos de gameta (sem crossing-over)', tex: '2^{\\,n} \\quad (n = \\text{pares de homólogos} = 2n/2)' },
    ],
    ideias: [
      'O DNA duplica na fase S: cada cromossomo passa de 1 para 2 cromátides. Na anáfase, as cromátides separadas contam como cromossomos.',
      'Mitose: 1 divisão, 2 células idênticas, 2n → 2n. Meiose: 2 divisões, 4 células haploides diferentes, 2n → n.',
      'Meiose I separa os homólogos (metáfase I: pares alinhados). Meiose II separa as cromátides-irmãs.',
      'Espermatogênese: 1 → 4 espermatozoides. Ovogênese: 1 → 1 óvulo + glóbulos polares.',
    ],
    pegadinhas: ['Dizer que as cromátides-irmãs se separam na anáfase I (é na anáfase II).', 'Esquecer a duplicação do DNA ao contar cromátides.', 'Contar 2^(2n) em vez de 2^n para os gametas.'],
  },
  {
    titulo: 'Respiração, fermentação e fotossíntese',
    formulas: [
      { rotulo: 'Respiração aeróbica', tex: '\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\,\\text{O}_2 \\rightarrow 6\\,\\text{CO}_2 + 6\\,\\text{H}_2\\text{O} + \\text{ATP}' },
      { rotulo: 'Fermentação alcoólica', tex: '\\text{C}_6\\text{H}_{12}\\text{O}_6 \\rightarrow 2\\,\\text{C}_2\\text{H}_5\\text{OH} + 2\\,\\text{CO}_2 + 2\\,\\text{ATP}' },
      { rotulo: 'Fotossíntese', tex: '6\\,\\text{CO}_2 + 6\\,\\text{H}_2\\text{O} + \\text{luz} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\,\\text{O}_2' },
    ],
    ideias: [
      'Glicólise: citosol, saldo de 2 ATP. Krebs: matriz mitocondrial. Cadeia respiratória: cristas, usa O₂, maior parte do ATP.',
      'Fermentação alcoólica: etanol + CO₂. Fermentação lática: lactato, sem CO₂. Ambas rendem 2 ATP por glicose.',
      'Fase clara (tilacoides): luz, fotólise da água, O₂, ATP e NADPH. Ciclo de Calvin (estroma): CO₂ vira glicose.',
      'Massas molares: glicose 180, CO₂ 44, O₂ 32, H₂O 18 g/mol; a proporção glicose : O₂ : CO₂ é 1 : 6 : 6.',
    ],
    pegadinhas: ['Achar que o O₂ da fotossíntese vem do CO₂ (vem da água).', 'Esquecer o coeficiente 6 nas contas de massa.', 'Dizer que as plantas só respiram à noite.'],
  },
  {
    titulo: 'Luz, ponto de compensação e enzimas',
    formulas: [
      { rotulo: 'Fotossíntese bruta em função da luz', tex: 'P(I) = \\dfrac{P_{\\max}\\, I}{K + I}' },
      { rotulo: 'Ponto de compensação (P = R)', tex: 'I_c = \\dfrac{R\\,K}{P_{\\max} - R}' },
      { rotulo: 'Taxa líquida', tex: 'P_{\\text{líq}} = P(I) - R' },
    ],
    ideias: [
      'Abaixo do ponto de compensação, a planta consome O₂ no total; acima, libera; no escuro, só respira.',
      'Enzimas: proteínas específicas, não consumidas; atividade máxima na temperatura ótima. Calor excessivo desnatura (irreversível); frio só reduz a atividade.',
      'ATP → ADP + Pi libera a energia usada no transporte ativo, na contração e nas sínteses.',
    ],
    pegadinhas: ['Confundir o ponto de compensação com a luz de saturação.', 'Achar que o frio desnatura a enzima.', 'Achar que a enzima é consumida na reação.'],
  },
]
