import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualGenetica =
  | { tipo: 'genes' }
  | { tipo: 'punnett1' }
  | { tipo: 'incompleta' }
  | { tipo: 'teste' }
  | { tipo: 'punnett2' }
  | { tipo: 'ligacao' }
  | { tipo: 'abo' }
  | { tipo: 'rh' }
  | { tipo: 'sexo' }
  | { tipo: 'heredograma' }
  | { tipo: 'hardy' }
  | { tipo: 'poligenia' }

export interface PassoGenetica {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualGenetica
}

export const PASSOS_GENETICA: PassoGenetica[] = [
  {
    titulo: 'Genes, alelos, genótipo e fenótipo',
    texto: [
      'Um gene é um trecho de DNA que influencia uma característica. As variantes de um gene são os alelos. Nos organismos diploides, cada gene está presente em duas cópias, uma em cada cromossomo do par de homólogos, vindas uma de cada genitor.',
      'O genótipo é o conjunto de alelos de um indivíduo (AA, Aa, aa); o fenótipo é a característica que se manifesta, e depende do genótipo e do ambiente. Quem tem alelos iguais é homozigoto; quem tem alelos diferentes é heterozigoto. O alelo dominante se manifesta mesmo em heterozigose; o recessivo só aparece em homozigose. “Dominante” não quer dizer mais comum nem mais forte.',
    ],
    pare: {
      pergunta: 'Numa planta, flores púrpuras são dominantes sobre flores brancas. Qual é o genótipo de uma planta de flores brancas?',
      opcoes: ['aa', 'Aa', 'AA'],
      certa: 0,
      explicacao: 'O fenótipo recessivo só aparece em homozigose: aa. As plantas AA e Aa têm flores púrpuras, porque o alelo dominante se manifesta mesmo com apenas uma cópia.',
    },
    visual: { tipo: 'genes' },
  },
  {
    titulo: '1ª lei de Mendel: a segregação dos alelos',
    texto: [
      'Na formação dos gametas, os dois alelos de um gene se separam, e cada gameta recebe só um deles. Um indivíduo Aa forma gametas A e a, cada um com probabilidade 1/2. Na fecundação, os gametas se encontram ao acaso.',
      'Por isso, Aa × Aa produz 1/4 AA, 1/2 Aa e 1/4 aa. Com dominância completa, isso dá 3/4 de fenótipo dominante e 1/4 de recessivo: a proporção 3 : 1. O quadro de Punnett organiza as combinações de gametas, uma casa para cada encontro.',
    ],
    pare: {
      pergunta: 'No cruzamento Aa × Aa, qual a probabilidade de um descendente ser aa?',
      opcoes: ['1/4', '1/2', '3/4'],
      certa: 0,
      explicacao: 'O descendente é aa se receber a de cada genitor: 1/2 × 1/2 = 1/4. A probabilidade de ser heterozigoto é 1/2, e a de fenótipo dominante, 3/4.',
    },
    visual: { tipo: 'punnett1' },
  },
  {
    titulo: 'Dominância incompleta, codominância e genes letais',
    texto: [
      'Na dominância incompleta, o heterozigoto tem fenótipo intermediário. Em Aa × Aa, a razão fenotípica deixa de ser 3 : 1 e passa a ser igual à genotípica, 1 : 2 : 1. Exemplo clássico: em maravilhas, flores vermelhas × brancas dão flores rosa, e dois indivíduos rosa dão 1 vermelha : 2 rosa : 1 branca.',
      'Na codominância, os dois alelos se expressam no heterozigoto (como o grupo sanguíneo AB). Em genes letais em homozigose, o genótipo letal desaparece da prole: nos camundongos de pelagem amarela (Aa), o cruzamento Aa × Aa dá 2 amarelos : 1 cinza entre os nascidos, porque o AA morre antes de nascer.',
    ],
    pare: {
      pergunta: 'Com dominância incompleta, qual a proporção de fenótipos na prole de Aa × Aa?',
      opcoes: ['1 : 2 : 1', '3 : 1', '1 : 1'],
      certa: 0,
      explicacao: 'Cada genótipo tem fenótipo próprio: AA, Aa (intermediário) e aa, na razão 1 : 2 : 1. A razão 3 : 1 vale só quando há dominância completa.',
    },
    visual: { tipo: 'incompleta' },
  },
  {
    titulo: 'Cruzamento-teste e como calcular probabilidades',
    texto: [
      'Um indivíduo de fenótipo dominante pode ser AA ou Aa. Para descobrir, faz-se o cruzamento-teste com um homozigoto recessivo (aa): se todos os descendentes têm fenótipo dominante, o indivíduo é AA; se cerca de metade tem fenótipo recessivo, é Aa.',
      'Para combinar probabilidades: eventos independentes (como filhos diferentes, ou genes em cromossomos diferentes) se multiplicam (regra do “e”); alternativas que não podem acontecer juntas se somam (regra do “ou”). Por exemplo, a chance de dois filhos de Aa × Aa serem aa é 1/4 × 1/4 = 1/16; a chance de um ser aa e o outro dominante, em qualquer ordem, é 2 × (1/4 × 3/4) = 3/8.',
    ],
    pare: {
      pergunta: 'Uma planta de fenótipo dominante, cruzada com uma de fenótipo recessivo (aa), deu metade dos descendentes com fenótipo recessivo. Qual o genótipo da planta?',
      opcoes: ['Aa', 'AA', 'aa'],
      certa: 0,
      explicacao: 'Se fosse AA, todos os descendentes seriam Aa (fenótipo dominante). Só um heterozigoto Aa dá 1/2 Aa e 1/2 aa. E aa teria fenótipo recessivo, e não dominante.',
    },
    visual: { tipo: 'teste' },
  },
  {
    titulo: '2ª lei de Mendel: genes que se combinam livremente',
    texto: [
      'Genes localizados em cromossomos diferentes segregam de modo independente. Um duplo-heterozigoto AaBb forma quatro tipos de gametas, AB, Ab, aB e ab, com probabilidade 1/4 cada. Em geral, são 2ⁿ tipos de gametas para n genes heterozigotos.',
      'No cruzamento AaBb × AaBb, a prole segue a proporção 9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb. O jeito mais rápido de calcular é tratar cada gene separadamente (3/4 dominante e 1/4 recessivo em cada um) e multiplicar as probabilidades.',
    ],
    pare: {
      pergunta: 'No cruzamento AaBb × AaBb, qual a probabilidade de um descendente ser aabb?',
      opcoes: ['1/16', '1/4', '9/16'],
      certa: 0,
      explicacao: 'aa tem probabilidade 1/4 e bb também: 1/4 × 1/4 = 1/16. O valor 9/16 é o de A_B_ (3/4 × 3/4).',
    },
    visual: { tipo: 'punnett2' },
  },
  {
    titulo: 'Genes ligados e crossing-over',
    texto: [
      'Genes situados no mesmo cromossomo tendem a ser herdados juntos: são genes ligados. Na meiose, o crossing-over troca segmentos entre cromossomos homólogos e forma gametas recombinantes. Os gametas que mantêm as combinações originais são os parentais.',
      'Se a taxa de recombinação é d %, os dois gametas recombinantes somam d % (d/2 cada) e os dois parentais somam (100 − d) %. Essa taxa mede a distância entre os genes: 1 % de recombinantes = 1 centimorgan (cM). Em cis (AB/ab), os parentais são AB e ab; em trans (Ab/aB), são Ab e aB. Com 50 % de recombinação, os genes se comportam como se estivessem em cromossomos diferentes.',
    ],
    pare: {
      pergunta: 'Dois genes a 20 cM, em cis (AB/ab). Que porcentagem dos gametas é AB?',
      opcoes: ['40 %', '20 %', '10 %'],
      certa: 0,
      explicacao: 'AB é um gameta parental. Os parentais somam 100 − 20 = 80 %, divididos entre AB e ab: 40 % cada. Os recombinantes Ab e aB têm 10 % cada.',
    },
    visual: { tipo: 'ligacao' },
  },
  {
    titulo: 'Sistema ABO: alelos múltiplos',
    texto: [
      'O grupo sanguíneo ABO é determinado por um gene com três alelos: Iᴬ, Iᴮ e i. Iᴬ e Iᴮ são codominantes entre si e dominantes sobre i. Os genótipos formam quatro fenótipos: A (IᴬIᴬ ou Iᴬi), B (IᴮIᴮ ou Iᴮi), AB (IᴬIᴮ) e O (ii).',
      'Cada tipo tem aglutinogênios (antígenos) nas hemácias e aglutininas (anticorpos) no plasma contra os antígenos que a pessoa não tem. O tipo O não tem aglutinogênios, e o AB não tem aglutininas. Como cada filho recebe um alelo de cada genitor, dois pais A e B podem ter filhos dos quatro tipos se forem Iᴬi e Iᴮi.',
    ],
    pare: {
      pergunta: 'Um homem do grupo A e uma mulher do grupo B, ambos heterozigotos, podem ter filhos de quais grupos?',
      opcoes: ['A, B, AB e O', 'Somente AB', 'Somente A e B'],
      certa: 0,
      explicacao: 'Iᴬi × Iᴮi dá IᴬIᴮ (AB), Iᴬi (A), Iᴮi (B) e ii (O), com 1/4 cada. Por isso o casal pode ter filhos dos quatro grupos.',
    },
    visual: { tipo: 'abo' },
  },
  {
    titulo: 'Fator Rh, transfusões e eritroblastose fetal',
    texto: [
      'Pessoas Rh+ têm o antígeno Rh (alelo D, dominante); as Rh− são dd. Numa transfusão de hemácias, o plasma do receptor não pode ter anticorpos contra os antígenos do doador. Por isso O− é doador universal e AB+ é receptor universal. Quem é Rh− só deve receber sangue Rh−.',
      'Se uma mulher Rh− gera um bebê Rh+, parte das hemácias do bebê passa para o sangue dela no parto, e ela produz anticorpos anti-Rh (sensibilização). Numa gestação seguinte de um bebê Rh+, esses anticorpos atravessam a placenta e destroem as hemácias do feto: é a eritroblastose fetal. A prevenção é aplicar imunoglobulina anti-Rh na mãe após o parto.',
    ],
    pare: {
      pergunta: 'Qual grupo é doador universal de hemácias?',
      opcoes: ['O−', 'AB+', 'O+'],
      certa: 0,
      explicacao: 'O− não tem aglutinogênios A nem B nem o fator Rh, então nenhum receptor tem anticorpos contra as hemácias dele. AB+ é o receptor universal.',
    },
    visual: { tipo: 'rh' },
  },
  {
    titulo: 'Herança ligada ao sexo',
    texto: [
      'Genes situados no cromossomo X, sem correspondente no Y, mostram um padrão próprio: a mulher tem dois alelos (XX) e o homem, apenas um (XY). Por isso o homem manifesta qualquer alelo do X que receber da mãe, mesmo recessivo. Daltonismo e hemofilia são recessivos ligados ao X e atingem mais homens.',
      'Um homem afetado (XᵃY) passa o X às filhas (todas recebem o alelo; se a mãe for XᴬXᴬ, todas serão portadoras) e o Y aos filhos (que nunca recebem o alelo dele). Uma mulher portadora (XᴬXᵃ) casada com homem normal tem 1/2 dos filhos homens afetados e 1/2 das filhas portadoras; de qualquer criança, a probabilidade de ser afetada é 1/4.',
    ],
    pare: {
      pergunta: 'Um homem daltônico (XᵃY) casa com uma mulher de visão normal (XᴬXᴬ). Como serão as filhas?',
      opcoes: ['Todas de visão normal e portadoras', 'Todas daltônicas', 'Metade daltônicas'],
      certa: 0,
      explicacao: 'Todas as filhas recebem o Xᵃ do pai e o Xᴬ da mãe: XᴬXᵃ, portadoras de visão normal. Os filhos homens recebem o Y do pai e o Xᴬ da mãe, e também são normais.',
    },
    visual: { tipo: 'sexo' },
  },
  {
    titulo: 'Heredogramas: como ler',
    texto: [
      'No heredograma, o quadrado é homem, o círculo é mulher, e o símbolo cheio é uma pessoa afetada. A linha horizontal une o casal e as linhas verticais levam aos filhos. Os algarismos romanos indicam a geração, e os números, a ordem dentro dela.',
      'Pistas: pais normais com filho afetado indicam herança recessiva (os pais são portadores). Se todo afetado tem um genitor afetado, a herança é dominante. Filha afetada de pai normal exclui a recessiva ligada ao X, e a transmissão de pai afetado para filho homem exclui qualquer herança ligada ao X. Comece sempre escrevendo os genótipos que não deixam dúvida: afetado recessivo é aa, e pais normais de um afetado são Aa.',
    ],
    pare: {
      pergunta: 'No heredograma ao lado, os pais normais I-1 e I-2 têm uma filha afetada. Qual é o padrão de herança?',
      opcoes: ['Autossômica recessiva', 'Autossômica dominante', 'Recessiva ligada ao X'],
      certa: 0,
      explicacao: 'Pais normais com filho afetado indicam herança recessiva. Como a afetada é mulher e o pai é normal, não pode ser ligada ao X (o pai teria de ser afetado): é autossômica recessiva.',
    },
    visual: { tipo: 'heredograma' },
  },
  {
    titulo: 'Genética de populações: Hardy-Weinberg',
    texto: [
      'Uma população está em equilíbrio de Hardy-Weinberg quando é grande, os cruzamentos são ao acaso e não há mutação, migração nem seleção. Nesse caso, as frequências dos alelos (p para A e q para a, com p + q = 1) não mudam, e as dos genótipos são p² (AA), 2pq (Aa) e q² (aa).',
      'O fenótipo recessivo revela q²: se 9 % da população é aa, então q = √0,09 = 0,3, p = 0,7, e os heterozigotos são 2 × 0,7 × 0,3 = 42 %. Em genes ligados ao X, os homens afetados têm frequência q e as mulheres afetadas, q². Por isso as doenças recessivas ligadas ao X são bem mais comuns em homens.',
    ],
    pare: {
      pergunta: 'Em uma população em equilíbrio, 9 % das pessoas são aa. Que porcentagem é Aa?',
      opcoes: ['42 %', '21 %', '30 %'],
      certa: 0,
      explicacao: 'q² = 0,09, então q = 0,3 e p = 0,7. Os heterozigotos são 2pq = 2 × 0,7 × 0,3 = 0,42, isto é, 42 %. O valor 30 % é a frequência do alelo a (q).',
    },
    visual: { tipo: 'hardy' },
  },
  {
    titulo: 'Herança poligênica e interação entre genes',
    texto: [
      'Algumas características (cor da pele, altura) dependem de vários genes de efeito aditivo: é a herança quantitativa. Cada alelo “maiúsculo” soma uma unidade do efeito. Com n pares de genes há 2n + 1 classes fenotípicas, com distribuição em sino; num cruzamento de duplo-heterozigotos (n = 2), os fenótipos aparecem na razão 1 : 4 : 6 : 4 : 1, e cada extremo ocorre em 1/4ⁿ dos descendentes.',
      'Na epistasia, um gene interfere na expressão de outro. Na cor da pelagem de labradores, o gene E/e decide se o pigmento é depositado: ee impede a expressão do gene B/b, e o cão é amarelo, qualquer que seja o genótipo para B. O cruzamento BbEe × BbEe dá 9 pretos : 3 chocolate : 4 amarelos, em vez de 9 : 3 : 3 : 1.',
    ],
    pare: {
      pergunta: 'Com 3 pares de genes aditivos, quantas classes fenotípicas existem?',
      opcoes: ['7', '6', '9'],
      certa: 0,
      explicacao: 'O número de classes é 2n + 1 = 2 × 3 + 1 = 7. É o número de alelos “maiúsculos” possíveis, de 0 a 6.',
    },
    visual: { tipo: 'poligenia' },
  },
]

export const RESUMO_GENETICA: SecaoResumo[] = [
  {
    titulo: 'Leis de Mendel e probabilidades',
    formulas: [
      { rotulo: 'Gametas de n genes heterozigotos', tex: '2^{\\,n}' },
      { rotulo: 'Aa × Aa', tex: '\\tfrac14\\,AA : \\tfrac12\\,Aa : \\tfrac14\\,aa \\qquad (3 : 1)' },
      { rotulo: 'AaBb × AaBb', tex: '9\\,A\\_B\\_ : 3\\,A\\_bb : 3\\,aaB\\_ : 1\\,aabb' },
      { rotulo: 'Eventos independentes', tex: 'P(X \\text{ e } Y) = P(X)\\cdot P(Y)' },
    ],
    ideias: [
      '1ª lei: os alelos de um gene se separam nos gametas. 2ª lei: genes em cromossomos diferentes se combinam de modo independente.',
      'Cruzamento-teste: cruzar com aa. Metade de recessivos na prole indica Aa; só dominantes indica AA.',
      'Probabilidade condicional: se o fenótipo é dominante em Aa × Aa, a chance de ser Aa é 2/3 (aa foi excluído).',
      'Dominância incompleta: 1 : 2 : 1 nos fenótipos. Gene letal em homozigose: 2 : 1 entre os nascidos.',
    ],
    pegadinhas: ['Esquecer a informação do fenótipo e dar 1/2 em vez de 2/3.', 'Somar probabilidades de eventos que se multiplicam (e vice-versa).', 'Contar gametas pelos genes totais, e não pelos heterozigotos.'],
  },
  {
    titulo: 'Genes ligados e crossing-over',
    formulas: [
      { rotulo: 'Distância entre os genes', tex: 'd\\,(\\text{cM}) = \\dfrac{\\text{recombinantes}}{\\text{total}} \\times 100' },
      { rotulo: 'Gametas de um duplo-heterozigoto ligado', tex: '\\text{parentais: } \\dfrac{100-d}{2}\\,\\% \\text{ cada} \\qquad \\text{recombinantes: } \\dfrac{d}{2}\\,\\% \\text{ cada}' },
    ],
    ideias: ['Em cis (AB/ab), os parentais são AB e ab; em trans (Ab/aB), os parentais são Ab e aB.', 'Os recombinantes são as classes menos numerosas do cruzamento-teste.', 'Com 50 % de recombinação, os genes se comportam como independentes.'],
    pegadinhas: ['Usar só uma das duas classes recombinantes ao calcular a distância.', 'Esquecer de dividir a recombinação total entre os dois gametas recombinantes.', 'Trocar parentais e recombinantes em trans.'],
  },
  {
    titulo: 'Grupos sanguíneos ABO e Rh',
    formulas: [],
    ideias: [
      'Genótipos: A = IᴬIᴬ ou Iᴬi; B = IᴮIᴮ ou Iᴮi; AB = IᴬIᴮ; O = ii. Rh+ = DD ou Dd; Rh− = dd.',
      'Aglutinogênios (nas hemácias): A tem A; B tem B; AB tem A e B; O não tem. Aglutininas (no plasma): contra o antígeno que a pessoa não tem.',
      'Doador universal: O−. Receptor universal: AB+. Quem é Rh− não recebe Rh+.',
      'Eritroblastose fetal: mãe Rh− com feto Rh+; a sensibilização ocorre no parto, e a prevenção é a imunoglobulina anti-Rh.',
    ],
    pegadinhas: ['Confundir aglutinogênio (antígeno da hemácia) com aglutinina (anticorpo do plasma).', 'Achar que o sistema ABO prova paternidade (ele só pode excluí-la).', 'Esquecer que a eritroblastose raramente afeta o primeiro filho.'],
  },
  {
    titulo: 'Herança ligada ao sexo',
    formulas: [],
    ideias: [
      'Homens têm um só X: expressam qualquer alelo recessivo do X. Mulheres precisam de dois.',
      'Mãe portadora (XᴬXᵃ) × pai normal: 1/2 dos filhos homens afetados; 1/2 das filhas portadoras; nenhuma filha afetada; 1/4 de qualquer criança afetada.',
      'Pai afetado (XᵃY) × mãe normal (XᴬXᴬ): todas as filhas portadoras; nenhum filho afetado.',
      'O homem recebe o X da mãe: a doença nunca passa de pai para filho homem (herança ligada ao X).',
    ],
    pegadinhas: ['Dar 1/4 quando já se sabe que a criança é menino (então é 1/2).', 'Achar que as filhas de pai afetado são afetadas: só são portadoras, se a mãe é XᴬXᴬ.', 'Aplicar a razão 3 : 1 a herança ligada ao X.'],
  },
  {
    titulo: 'Heredogramas',
    formulas: [],
    ideias: [
      'Pais normais com filho afetado: herança recessiva (os pais são portadores). Todo afetado com um genitor afetado: herança dominante.',
      'Filha afetada de pai normal: não é recessiva ligada ao X. Pai afetado com filho homem afetado: não é ligada ao X.',
      'Afetado recessivo = aa; pais normais de afetado = Aa; filho normal de afetado recessivo = Aa.',
      'Irmão normal de um afetado recessivo (pais Aa × Aa): 2/3 de chance de ser portador.',
    ],
    pegadinhas: ['Dar 1/2 de chance de portador ao irmão normal (o correto é 2/3).', 'Esquecer o fator 2/3 para cada pessoa cujo genótipo é incerto.', 'Confundir a probabilidade de o filho ser afetado com a de ser portador.'],
  },
  {
    titulo: 'Hardy-Weinberg e herança poligênica',
    formulas: [
      { rotulo: 'Frequências no equilíbrio', tex: 'p + q = 1 \\qquad p^2 + 2pq + q^2 = 1' },
      { rotulo: 'Frequência do alelo recessivo', tex: 'q = \\sqrt{q^2}' },
      { rotulo: 'Classes fenotípicas com n genes aditivos', tex: '2n + 1' },
    ],
    ideias: ['Em equilíbrio: AA = p²; Aa = 2pq; aa = q². Os heterozigotos têm frequência máxima (50 %) quando q = 0,5.', 'Ligados ao X: homens afetados q; mulheres afetadas q²; mulheres portadoras 2pq.', 'Herança poligênica: curva em sino; extremos raros (1/4ⁿ para n pares heterozigotos). Epistasia: um gene mascara outro (9 : 3 : 4).'],
    pegadinhas: ['Esquecer a raiz quadrada: q² ≠ q.', 'Confundir a frequência do fenótipo dominante (p² + 2pq) com a do alelo dominante (p).', 'Esquecer o 2 em 2pq.'],
  },
]
