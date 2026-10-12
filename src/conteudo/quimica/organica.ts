import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualOrg = { tipo: 'leitura' } | { tipo: 'oxigenadas' } | { tipo: 'nitrogenadas' } | { tipo: 'nome' } | { tipo: 'plana' } | { tipo: 'espacial' }

export interface PassoOrg {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualOrg
}

export const PASSOS_ORG: PassoOrg[] = [
  {
    titulo: 'Ler a fórmula de traços',
    texto: [
      'Em química orgânica, o desenho mais usado é a fórmula de traços: cada ponta e cada vértice da linha é um átomo de carbono, e os hidrogênios ligados a carbono não são desenhados. Só se escrevem os átomos que não são carbono, e os H ligados a eles (OH, NH₂).',
      'Para achar os hidrogênios escondidos, lembre que o carbono sempre faz 4 ligações. Se um carbono mostra 2 traços simples, faltam 2 ligações e ele tem 2 hidrogênios (CH₂); uma ponta com 1 traço tem 3 (CH₃); um carbono com ligação dupla e mais um traço tem 1 (CH).',
    ],
    pare: {
      pergunta: 'Um carbono do meio de uma cadeia, com dois traços simples, tem quantos hidrogênios ocultos?',
      opcoes: ['2 (CH₂)', '3 (CH₃)', '1 (CH)'],
      certa: 0,
      explicacao: 'Dois traços são 2 ligações; faltam 2 para completar 4, e elas são ocupadas por hidrogênios. Três H seriam de uma ponta (um traço só), e um H, de um carbono com três ligações.',
    },
    visual: { tipo: 'leitura' },
  },
  {
    titulo: 'Funções oxigenadas',
    texto: [
      'A função orgânica é decidida pelo grupo funcional. Nas oxigenadas: álcool tem –OH ligado a carbono saturado; fenol tem –OH ligado ao anel aromático; éter tem um oxigênio entre dois carbonos (C–O–C); aldeído tem C=O na ponta da cadeia; cetona tem C=O no meio da cadeia; ácido carboxílico tem –COOH; éster tem C(=O)–O–C.',
      'A dica prática é achar o oxigênio e perguntar a que ele está ligado e se há ligação dupla (C=O). Quando há C=O, olhe o que está ao lado do carbono da carbonila: outro carbono (cetona), um H (aldeído), um OH (ácido) ou um O ligado a carbono (éster).',
    ],
    pare: {
      pergunta: 'Numa molécula há uma carbonila (C=O) ligada a dois carbonos e a nada mais. Qual é a função?',
      opcoes: ['Cetona', 'Aldeído', 'Éster'],
      certa: 0,
      explicacao: 'C=O entre dois carbonos é cetona. No aldeído, um dos vizinhos da carbonila é hidrogênio. No éster, a carbonila está ligada a um oxigênio que se liga a outro carbono.',
    },
    visual: { tipo: 'oxigenadas' },
  },
  {
    titulo: 'Funções nitrogenadas e haletos',
    texto: [
      'Amina: nitrogênio ligado a carbonos (e a hidrogênios), sem carbonila. A mais simples é a metilamina, CH₃–NH₂. Amida: o nitrogênio está ligado diretamente a uma carbonila (C=O), como em CH₃–CO–NH₂. Haletos orgânicos: um halogênio (F, Cl, Br ou I) ligado a carbono, como o clorometano.',
      'O mesmo átomo de nitrogênio pode estar numa amina ou numa amida: tudo depende de existir ou não a carbonila ao lado dele. É um erro frequente trocar uma pela outra.',
    ],
    pare: {
      pergunta: 'CH₃–CO–NH₂ pertence à função:',
      opcoes: ['Amida', 'Amina', 'Cetona'],
      certa: 0,
      explicacao: 'O nitrogênio está ligado diretamente à carbonila (C=O): é uma amida. Numa amina, o N não teria carbonila ao lado; numa cetona, não haveria nitrogênio.',
    },
    visual: { tipo: 'nitrogenadas' },
  },
  {
    titulo: 'Dar nome às moléculas (IUPAC)',
    texto: [
      'O nome é montado em partes: ramificações + prefixo (número de carbonos da cadeia principal) + infixo (tipo de ligação) + sufixo (função). Prefixos: met (1), et (2), prop (3), but (4), pent (5), hex (6). Infixos: an (só ligações simples), en (dupla), in (tripla). Sufixos: -o (hidrocarboneto), -ol (álcool), -al (aldeído), -ona (cetona), -amina e a forma ácido ...-oico.',
      'A cadeia principal é a mais longa que contém o grupo funcional, e se numera pela ponta que dá o menor número ao grupo principal. Em butan-2-ol, o 2 mostra que a hidroxila está no segundo carbono. Livros mais antigos escrevem 2-butanol: é a mesma substância, só muda a forma de escrever o nome.',
    ],
    pare: {
      pergunta: 'Qual é o nome de CH₃–CH(OH)–CH₂–CH₃?',
      opcoes: ['butan-2-ol', 'butan-3-ol', 'propan-2-ol'],
      certa: 0,
      explicacao: 'São 4 carbonos (but-), só ligações simples (-an-) e a hidroxila (-ol) no carbono 2, contando da ponta que dá o menor número. Butan-3-ol numera pela ponta errada, e propan-2-ol conta só 3 carbonos.',
    },
    visual: { tipo: 'nome' },
  },
  {
    titulo: 'Isomeria plana',
    texto: [
      'Isômeros são substâncias diferentes que têm a mesma fórmula molecular. Na isomeria plana a diferença aparece já no desenho plano: de cadeia (esqueletos de carbono diferentes), de posição (o grupo, a insaturação ou a ramificação em outro carbono), de função (funções diferentes) e de compensação, ou metameria (o heteroátomo, como o O do éter, divide a cadeia em partes de tamanhos diferentes).',
      'O primeiro teste é sempre a fórmula molecular: se as fórmulas são diferentes, nem são isômeros. Depois compare as funções e, por fim, as cadeias.',
    ],
    pare: {
      pergunta: 'Butan-1-ol e butan-2-ol são isômeros de:',
      opcoes: ['Posição', 'Cadeia', 'Função'],
      certa: 0,
      explicacao: 'As duas têm a mesma fórmula (C₄H₁₀O), a mesma função (álcool) e a mesma cadeia de 4 carbonos; só muda o carbono em que está a hidroxila. É isomeria de posição.',
    },
    visual: { tipo: 'plana' },
  },
  {
    titulo: 'Isomeria espacial: cis-trans e carbono quiral',
    texto: [
      'Em torno de uma ligação dupla, os grupos não giram. Se grupos iguais ficam do mesmo lado, é o isômero cis; de lados opostos, o trans. Isso exige que cada carbono da dupla tenha dois grupos diferentes ligados a ele.',
      'Um carbono quiral (ou assimétrico) tem quatro grupos diferentes ligados a ele, contando o hidrogênio. Ele dá dois isômeros ópticos, que são imagens uma da outra no espelho e não se sobrepõem, como as duas mãos. No 2-clorobutano, o C2 liga-se a H, Cl, CH₃ e CH₂CH₃: quatro grupos diferentes.',
    ],
    pare: {
      pergunta: 'Quantos carbonos quirais tem o butan-2-ol, CH₃–CH(OH)–CH₂–CH₃?',
      opcoes: ['1', '2', '0'],
      certa: 0,
      explicacao: 'O C2 liga-se a H, OH, CH₃ e CH₂CH₃, todos diferentes: é quiral. Os outros carbonos repetem grupos (dois ou três H) e não são quirais.',
    },
    visual: { tipo: 'espacial' },
  },
]

export const RESUMO_ORG: SecaoResumo[] = [
  {
    titulo: 'Funções orgânicas',
    formulas: [
      { rotulo: 'Hidrocarboneto (alcano, alceno, alcino)', tex: 'C_nH_{2n+2},\\ C_nH_{2n},\\ C_nH_{2n-2}' },
      { rotulo: 'Carboxila', tex: '-\\text{COOH}' },
      { rotulo: 'Éster', tex: 'R-\\text{COO}-R^{\\prime}' },
    ],
    ideias: [
      'Álcool: –OH em carbono saturado. Fenol: –OH no anel aromático. Éter: C–O–C.',
      'Com C=O: aldeído (ponta, com H), cetona (entre carbonos), ácido (com OH), éster (com O–C), amida (com N).',
      'Amina: N sem carbonila. Haleto: halogênio ligado a carbono.',
      'Na fórmula de traços, vértices e pontas são carbonos; os H nos carbonos ficam implícitos (cada C faz 4 ligações).',
    ],
    pegadinhas: ['Confundir fenol com álcool: o que decide é onde está ligada a hidroxila.', 'Confundir amina com amida, éter com éster e aldeído com cetona.'],
  },
  {
    titulo: 'Nomenclatura IUPAC',
    formulas: [
      { rotulo: 'Estrutura do nome', tex: '\\text{ramificações} + \\text{prefixo} + \\text{infixo} + \\text{sufixo}' },
    ],
    ideias: [
      'Prefixos: met, et, prop, but, pent, hex. Infixos: an, en, in.',
      'Sufixos: -o (hidrocarboneto), -ol, -al, -ona, -amina, ácido ...-oico.',
      'Numere pela ponta que dá o menor número ao grupo principal e depois às ramificações.',
      'Éster: nome do ácido terminado em -oato de + nome do grupo ligado ao oxigênio (etanoato de metila). Éter: grupo menor + oxi + cadeia maior (metoxietano).',
    ],
    pegadinhas: ['Numerar pela ponta errada (butan-3-ol em vez de butan-2-ol).', 'Contar as ramificações como parte da cadeia principal.', 'Inverter as partes do éster.'],
  },
  {
    titulo: 'Isomeria',
    formulas: [{ rotulo: 'Condição para ser isômero', tex: '\\text{mesma fórmula molecular}' }],
    ideias: [
      'Plana: de cadeia, de posição, de função e de compensação (metameria).',
      'Espacial: geométrica (cis-trans, em torno de dupla ou de anel) e óptica (carbono quiral).',
      'Carbono quiral: quatro grupos diferentes, contando o hidrogênio.',
    ],
    pegadinhas: ['Esquecer de conferir primeiro a fórmula molecular.', 'Dizer que há carbono quiral com dois grupos iguais (como duas pontas CH₃).'],
  },
]
