import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualMolecular =
  | { tipo: 'dna' }
  | { tipo: 'chargaff' }
  | { tipo: 'meselson' }
  | { tipo: 'forquilha' }
  | { tipo: 'transcricao' }
  | { tipo: 'processamento' }
  | { tipo: 'codigo' }
  | { tipo: 'mutacoes' }
  | { tipo: 'lac' }
  | { tipo: 'restricao' }
  | { tipo: 'pcr' }
  | { tipo: 'recombinante' }

export interface PassoMolecular {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualMolecular
}

export const PASSOS_MOLECULAR: PassoMolecular[] = [
  {
    titulo: 'DNA e RNA: nucleotídeos e pareamento',
    texto: [
      'Os ácidos nucleicos são cadeias de nucleotídeos. Cada nucleotídeo tem um açúcar (desoxirribose no DNA, ribose no RNA), um grupo fosfato e uma base nitrogenada. No DNA as bases são adenina (A), timina (T), guanina (G) e citosina (C); no RNA, a timina é substituída pela uracila (U).',
      'O DNA é uma dupla-hélice formada por duas fitas antiparalelas (uma de 5′ para 3′, a outra de 3′ para 5′), unidas por ligações de hidrogênio entre bases complementares: A pareia com T (2 ligações) e G pareia com C (3 ligações). O RNA, em geral, é uma fita simples.',
    ],
    pare: {
      pergunta: 'Qual base nitrogenada existe no RNA, mas não no DNA?',
      opcoes: ['Uracila', 'Timina', 'Citosina'],
      certa: 0,
      explicacao: 'O RNA tem uracila (U) no lugar da timina (T). Citosina existe nos dois ácidos nucleicos.',
    },
    visual: { tipo: 'dna' },
  },
  {
    titulo: 'Regra de Chargaff',
    texto: [
      'Como cada A de uma fita pareia com um T da outra, e cada G com um C, o DNA de fita dupla tem quantidades iguais de A e T, e de G e C: A = T e G = C. Logo, A + G = T + C (50 % de cada lado), mas a proporção entre A + T e G + C varia de espécie para espécie.',
      'Dada a porcentagem de uma base, descobrem-se as outras: se A = 30 %, então T = 30 % e restam 40 % para G + C, isto é, 20 % de cada uma. Essa regra vale para o DNA de fita dupla, e não para um RNA de fita simples.',
    ],
    pare: {
      pergunta: 'Em um DNA de fita dupla com 20 % de guanina, qual a porcentagem de adenina?',
      opcoes: ['30 %', '20 %', '40 %'],
      certa: 0,
      explicacao: 'G = 20 % ⇒ C = 20 %. Sobram 100 − 40 = 60 % para A + T, ou seja, 30 % de cada.',
    },
    visual: { tipo: 'chargaff' },
  },
  {
    titulo: 'Replicação semiconservativa: o experimento de Meselson e Stahl',
    texto: [
      'Na replicação, cada fita do DNA serve de molde para uma nova fita complementar. Assim, cada molécula-filha tem uma fita antiga e uma nova: replicação semiconservativa. Meselson e Stahl provaram isso cultivando bactérias em meio com ¹⁵N (isótopo pesado) e transferindo-as para meio com ¹⁴N (leve), separando o DNA pela densidade.',
      'Na 1ª geração, todo o DNA tinha densidade intermediária (híbrido ¹⁵N/¹⁴N): isso descartou a hipótese conservativa, que previa uma banda pesada e outra leve. Na 2ª geração, metade do DNA era híbrido e metade leve: isso descartou a hipótese dispersiva, que previa uma única banda mais leve. Só a semiconservativa explica os dois resultados.',
    ],
    pare: {
      pergunta: 'Na 2ª geração, como é o DNA, na replicação semiconservativa?',
      opcoes: ['Metade híbrido e metade leve', 'Todo híbrido', 'Metade pesado e metade leve'],
      certa: 0,
      explicacao: 'Das 4 moléculas, 2 guardam uma fita original (¹⁵N) e uma nova (¹⁴N): híbridas. As outras 2 só têm fitas novas (¹⁴N): leves. Não sobra molécula pesada.',
    },
    visual: { tipo: 'meselson' },
  },
  {
    titulo: 'Como a célula replica o DNA',
    texto: [
      'A helicase abre a dupla-hélice na forquilha de replicação, e proteínas mantêm as fitas separadas. A primase sintetiza pequenos iniciadores de RNA (primers), pois a DNA polimerase só estende uma extremidade 3′ já existente. A DNA polimerase adiciona nucleotídeos sempre no sentido 5′ → 3′ da nova fita, usando a fita antiga como molde.',
      'Como as duas fitas são antiparalelas, uma nova fita (a líder) é sintetizada de modo contínuo, no sentido da abertura da forquilha; a outra (a descontínua ou atrasada) é feita em pedaços, os fragmentos de Okazaki, que a DNA ligase une. Nas bactérias há uma origem de replicação por cromossomo; nos eucariotos, várias, o que acelera a duplicação de DNA muito longo.',
    ],
    pare: {
      pergunta: 'Que enzima une os fragmentos de Okazaki na fita descontínua?',
      opcoes: ['DNA ligase', 'Helicase', 'Primase'],
      certa: 0,
      explicacao: 'A DNA ligase forma a ligação entre os fragmentos. A helicase abre a dupla-hélice e a primase faz os primers de RNA.',
    },
    visual: { tipo: 'forquilha' },
  },
  {
    titulo: 'Transcrição: do DNA ao RNA',
    texto: [
      'Na transcrição, a RNA polimerase usa uma das fitas do gene como molde (a fita molde, lida de 3′ para 5′) e sintetiza um RNA complementar no sentido 5′ → 3′, com os pareamentos A–U, T–A, G–C e C–G. Por isso o RNA tem a mesma sequência da outra fita do DNA, a fita codificadora, com U no lugar de T.',
      'A RNA polimerase reconhece uma região do gene chamada promotor para começar. A transcrição produz o RNA mensageiro (mRNA), que leva a informação do gene ao ribossomo e é o RNA traduzido em proteína, mas também o RNA ribossômico (rRNA) e o RNA transportador (tRNA), que participam da tradução.',
    ],
    pare: {
      pergunta: 'A fita molde de um gene é 3′-TACGGA-5′. Qual é o mRNA formado?',
      opcoes: ['5′-AUGCCU-3′', '5′-ATGCCT-3′', '5′-UACGGA-3′'],
      certa: 0,
      explicacao: 'O mRNA é complementar ao molde: T→A, A→U, C→G, G→C, G→C, A→U, o que dá AUGCCU. A opção ATGCCT tem timina; UACGGA copia o molde.',
    },
    visual: { tipo: 'transcricao' },
  },
  {
    titulo: 'Processamento do RNA nos eucariotos',
    texto: [
      'Nos eucariotos, o RNA recém-transcrito (pré-mRNA) é processado no núcleo antes de ir ao citoplasma. Recebe um quepe (cap) na extremidade 5′ e uma cauda de adeninas (poli-A) na extremidade 3′, que protegem o mRNA. E sofre splicing: os íntrons (regiões não codificantes) são removidos e os éxons (regiões codificantes) são unidos.',
      'O splicing alternativo permite que um mesmo gene origine mRNAs diferentes, combinando éxons de formas diferentes, e portanto várias proteínas. Nas bactérias, que não têm núcleo, não há processamento desse tipo: a tradução começa mesmo antes de a transcrição terminar.',
    ],
    pare: {
      pergunta: 'No splicing, o que é removido do pré-mRNA?',
      opcoes: ['Os íntrons', 'Os éxons', 'O quepe e a cauda poli-A'],
      certa: 0,
      explicacao: 'Os íntrons são retirados e os éxons são unidos. O quepe e a cauda poli-A são acrescentados ao mRNA, e não retirados.',
    },
    visual: { tipo: 'processamento' },
  },
  {
    titulo: 'Código genético e tradução',
    texto: [
      'O código genético relaciona cada códon (3 bases do mRNA) a um aminoácido. Há 64 códons: 61 codificam os 20 aminoácidos e 3 são de parada (UAA, UAG e UGA). O AUG codifica metionina e é o códon de iniciação. O código é degenerado (a maioria dos aminoácidos tem mais de um códon), não se sobrepõe e é praticamente universal.',
      'Na tradução, o ribossomo lê o mRNA de 5′ para 3′, de 3 em 3 bases, a partir do AUG. Cada tRNA, com seu anticódon complementar ao códon, traz o aminoácido correspondente, e os aminoácidos se ligam por ligações peptídicas, formando o polipeptídio. A tradução termina em um códon de parada, que não codifica aminoácido.',
    ],
    pare: {
      pergunta: 'Quantos aminoácidos tem o peptídeo formado a partir do mRNA 5′-GGAUGGCUUUUUAAGG-3′?',
      opcoes: ['3', '4', '5'],
      certa: 0,
      explicacao: 'A leitura começa no primeiro AUG: AUG (Met), GCU (Ala), UUU (Phe) e UAA (parada). São 3 aminoácidos: Met-Ala-Phe.',
    },
    visual: { tipo: 'codigo' },
  },
  {
    titulo: 'Mutações',
    texto: [
      'Mutação é uma alteração na sequência do DNA. As mutações de ponto (troca de uma base) podem ser silenciosas (o códon novo codifica o mesmo aminoácido), de troca de sentido, ou missense (outro aminoácido) ou sem sentido, ou nonsense (surge um códon de parada e a proteína fica truncada).',
      'A inserção ou a perda de bases em número não múltiplo de 3 desloca o quadro de leitura (frameshift) e altera todos os aminoácidos seguintes, em geral com efeito drástico; se o número for múltiplo de 3, apenas acrescenta ou retira aminoácidos. A anemia falciforme vem de uma troca GAG → GTG no DNA do gene da cadeia β da hemoglobina, que substitui o ácido glutâmico por valina. Só as mutações em células germinativas são herdadas pelos descendentes.',
    ],
    pare: {
      pergunta: 'Uma mutação troca o códon GAA (Glu) por GAG (Glu). Esse tipo de mutação é:',
      opcoes: ['Silenciosa', 'De troca de sentido', 'Sem sentido'],
      certa: 0,
      explicacao: 'GAA e GAG codificam o mesmo aminoácido (ácido glutâmico): o código é degenerado, e a proteína não muda.',
    },
    visual: { tipo: 'mutacoes' },
  },
  {
    titulo: 'Regulação gênica: o óperon lac',
    texto: [
      'Nas bactérias, genes de função relacionada ficam agrupados em óperons, transcritos juntos. No óperon lac de Escherichia coli, os genes lacZ, lacY e lacA permitem usar a lactose. Um gene regulador (lacI) produz o repressor, que se liga ao operador e bloqueia a RNA polimerase. Quando há lactose, um derivado dela (a alolactose) se liga ao repressor e o inativa: o óperon é induzido.',
      'Além disso, na presença de glicose, a bactéria prefere esse açúcar: o AMPc fica baixo e o complexo CAP–AMPc não ajuda a RNA polimerase, então a transcrição é baixa. Só com lactose e sem glicose a transcrição é alta. Mutações no repressor ou no operador deixam o óperon sempre ligado (expressão constitutiva); uma mutação no promotor impede a transcrição.',
    ],
    pare: {
      pergunta: 'Em meio sem lactose e sem glicose, o que ocorre no óperon lac normal?',
      opcoes: ['Nenhuma transcrição, pois o repressor está ligado ao operador', 'Alta transcrição, pois não há glicose', 'Baixa transcrição, pois falta o CAP'],
      certa: 0,
      explicacao: 'Sem lactose, o repressor continua ligado ao operador e bloqueia a RNA polimerase. A falta de glicose só aumenta a transcrição se o repressor já estiver inativo.',
    },
    visual: { tipo: 'lac' },
  },
  {
    titulo: 'Enzimas de restrição e eletroforese',
    texto: [
      'As enzimas de restrição, extraídas de bactérias, cortam o DNA em sequências específicas, geralmente palíndromos de 4 a 8 bases. A EcoRI reconhece GAATTC e corta entre G e A, deixando extremidades adesivas (coesivas); a BamHI reconhece GGATCC; a HindIII, AAGCTT. Numa molécula linear, n cortes dão n + 1 fragmentos; numa circular, como um plasmídeo, n cortes dão n fragmentos.',
      'Os fragmentos são separados por eletroforese em gel de agarose: o DNA tem carga negativa (fosfatos) e migra para o polo positivo; quanto menor o fragmento, mais longe ele chega. Com um marcador de tamanhos conhecidos, estimam-se os tamanhos das bandas. Esse padrão é usado, por exemplo, para comparar DNA em testes de paternidade e na investigação criminal.',
    ],
    pare: {
      pergunta: 'Um plasmídeo circular é cortado por uma enzima em 3 sítios. Quantos fragmentos se formam?',
      opcoes: ['3', '4', '2'],
      certa: 0,
      explicacao: 'Em molécula circular, n cortes produzem n fragmentos (o último fecha o círculo). Numa molécula linear seriam n + 1 = 4.',
    },
    visual: { tipo: 'restricao' },
  },
  {
    titulo: 'PCR: copiando DNA em laboratório',
    texto: [
      'A PCR (reação em cadeia da polimerase) amplifica um trecho específico de DNA. Cada ciclo tem três etapas: desnaturação (cerca de 95 °C, as fitas se separam), anelamento (cerca de 55 °C, os primers, pequenos fragmentos de DNA complementares às extremidades do trecho-alvo, se ligam) e extensão (cerca de 72 °C, a DNA polimerase estende os primers e sintetiza as novas fitas). A enzima precisa ser termoestável, como a Taq polimerase.',
      'Em condições ideais, cada ciclo duplica o número de moléculas: depois de n ciclos há 2ⁿ vezes o número inicial. Com 30 ciclos, uma única molécula vira mais de um bilhão. Por isso a PCR detecta quantidades mínimas de DNA, e é usada em diagnósticos, em testes de paternidade e em perícias.',
    ],
    pare: {
      pergunta: 'Partindo de 10 moléculas e com eficiência de 100 %, quantas moléculas existem depois de 5 ciclos de PCR?',
      opcoes: ['320', '100', '50'],
      certa: 0,
      explicacao: 'Cada ciclo duplica: 10 × 2⁵ = 10 × 32 = 320 moléculas. 50 seria somar 10 a cada ciclo (crescimento linear), o que não corresponde à PCR.',
    },
    visual: { tipo: 'pcr' },
  },
  {
    titulo: 'DNA recombinante, transgênicos e CRISPR',
    texto: [
      'Na tecnologia do DNA recombinante, um gene de interesse é cortado com enzima de restrição, inserido em um vetor (como um plasmídeo, cortado com a mesma enzima) e unido pela DNA ligase. O plasmídeo recombinante é introduzido em bactérias (transformação), e genes de resistência a antibiótico permitem selecionar as que o receberam. Assim, bactérias produzem proteínas humanas, como a insulina.',
      'Um organismo transgênico recebeu um gene de outra espécie, como plantas resistentes a insetos. O sistema CRISPR-Cas9, derivado de uma defesa de bactérias contra vírus, usa um RNA-guia que leva a enzima Cas9 até uma sequência específica do DNA, onde ela corta; isso permite inativar, corrigir ou inserir genes. Essas técnicas trazem benefícios e dilemas éticos e de biossegurança, discutidos pela sociedade.',
    ],
    pare: {
      pergunta: 'Qual enzima une o gene ao plasmídeo na construção de um DNA recombinante?',
      opcoes: ['DNA ligase', 'Enzima de restrição', 'RNA polimerase'],
      certa: 0,
      explicacao: 'A enzima de restrição corta o gene e o plasmídeo; a DNA ligase faz a ligação entre os fragmentos. A RNA polimerase transcreve o gene depois.',
    },
    visual: { tipo: 'recombinante' },
  },
]

export const RESUMO_MOLECULAR: SecaoResumo[] = [
  {
    titulo: 'Estrutura, composição e replicação do DNA',
    formulas: [
      { rotulo: 'Regra de Chargaff (fita dupla)', tex: 'A = T \\qquad G = C \\qquad A + T + G + C = 100\\,\\%' },
      { rotulo: 'Ligações de hidrogênio', tex: 'H = 2\\,(A\\text{–}T) + 3\\,(G\\text{–}C)' },
      { rotulo: 'Moléculas após g gerações (semiconservativa)', tex: '2^{\\,g} \\text{ moléculas, das quais } 2 \\text{ híbridas}' },
    ],
    ideias: [
      'DNA: dupla-hélice antiparalela; A–T (2 ligações) e G–C (3). RNA: fita simples, com uracila no lugar da timina.',
      'Replicação semiconservativa (Meselson e Stahl): cada molécula-filha tem uma fita antiga e uma nova. Geração 1: tudo híbrido; geração 2: metade híbrido e metade leve.',
      'Helicase abre; primase faz o primer; DNA polimerase estende (5′→3′); ligase une os fragmentos de Okazaki da fita descontínua.',
    ],
    pegadinhas: ['Aplicar Chargaff a RNA de fita simples.', 'Achar que a molécula original “se mantém inteira” (isso seria a hipótese conservativa).', 'Dizer que a DNA polimerase sintetiza no sentido 3′→5′.'],
  },
  {
    titulo: 'Transcrição, tradução e código genético',
    formulas: [
      { rotulo: 'Região codificadora', tex: '3\\,(n_{\\text{aminoácidos}} + 1) \\text{ nucleotídeos (com o códon de parada)}' },
      { rotulo: 'mRNAs possíveis para um peptídeo', tex: '\\prod_i \\text{(nº de códons do aminoácido } i)' },
    ],
    ideias: [
      'mRNA complementar à fita molde (A–U, T–A, G–C, C–G); igual à codificadora, com U no lugar de T.',
      '64 códons: 61 codificam 20 aminoácidos; UAA, UAG e UGA são paradas; AUG = Met = início. Código degenerado, universal, não sobreposto.',
      'Eucariotos: o pré-mRNA recebe quepe 5′ e cauda poli-A, e perde os íntrons no splicing (éxons unidos).',
    ],
    pegadinhas: ['Escrever T no RNA.', 'Começar a tradução fora do AUG ou não parar no códon de parada.', 'Confundir fita molde com fita codificadora.'],
  },
  {
    titulo: 'Mutações',
    formulas: [],
    ideias: [
      'Silenciosa: mesmo aminoácido. Missense: outro aminoácido. Nonsense: cria códon de parada (proteína truncada).',
      'Inserção ou perda de 1 ou 2 bases: mudança de quadro, efeito drástico. Múltiplo de 3: só adiciona ou retira aminoácidos.',
      'Anemia falciforme: GAG → GTG na cadeia β da hemoglobina (Glu → Val). Só mutações em células germinativas são herdadas.',
    ],
    pegadinhas: ['Chamar de “silenciosa” qualquer mutação sem efeito visível (o critério é o aminoácido).', 'Achar que toda inserção desloca o quadro (só as de número não múltiplo de 3).'],
  },
  {
    titulo: 'Regulação gênica: óperon lac',
    formulas: [],
    ideias: [
      'Repressor ligado ao operador = sem transcrição. Lactose (alolactose) inativa o repressor = indução.',
      'Glicose reduz o AMPc, e sem CAP–AMPc a transcrição é baixa: expressão alta só com lactose E sem glicose.',
      'Mutação no repressor ou no operador: expressão constitutiva. Super-repressor ou mutação no promotor: nenhuma expressão.',
    ],
    pegadinhas: ['Achar que a glicose ativa o CAP–AMPc (ela o reduz).', 'Dizer que a lactose “liga” o promotor (ela inativa o repressor).'],
  },
  {
    titulo: 'Biotecnologia: restrição, eletroforese e PCR',
    formulas: [
      { rotulo: 'Fragmentos de uma digestão (n cortes)', tex: '\\text{linear: } n+1 \\qquad \\text{circular: } n' },
      { rotulo: 'PCR (eficiência de 100 %)', tex: 'N = N_0 \\cdot 2^{\\,n}' },
    ],
    ideias: [
      'Enzima de restrição corta em sítios palíndromos específicos (EcoRI: GAATTC). DNA ligase une fragmentos.',
      'Eletroforese: DNA tem carga negativa, migra para o polo positivo; fragmento menor migra mais.',
      'PCR: desnaturação (~95 °C), anelamento dos primers (~55 °C), extensão (~72 °C) com Taq polimerase termoestável.',
      'DNA recombinante: restrição + ligase + vetor (plasmídeo) + transformação + seleção por resistência a antibiótico. CRISPR-Cas9: RNA-guia leva a Cas9 ao DNA-alvo.',
    ],
    pegadinhas: ['Confundir enzima de restrição (corta) com ligase (une) e com polimerase (copia).', 'Somar em vez de multiplicar o número de cópias da PCR.', 'Esquecer que um plasmídeo é circular na contagem de fragmentos.'],
  },
]
