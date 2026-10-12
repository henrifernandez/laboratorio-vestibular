import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualEcologia =
  | { tipo: 'cadeia' }
  | { tipo: 'teia' }
  | { tipo: 'energia' }
  | { tipo: 'piramides' }
  | { tipo: 'acumulo' }
  | { tipo: 'carbono' }
  | { tipo: 'nitrogenio' }
  | { tipo: 'relacoes' }
  | { tipo: 'crescimento' }
  | { tipo: 'presapredador' }
  | { tipo: 'sucessao' }

export interface PassoEcologia {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualEcologia
}

export const PASSOS_ECOLOGIA: PassoEcologia[] = [
  {
    titulo: 'Quem come quem: a cadeia alimentar',
    texto: [
      'Uma cadeia alimentar mostra quem serve de alimento para quem. Ela começa num produtor (planta, alga ou cianobactéria), que faz a própria matéria orgânica por fotossíntese. Depois vêm os consumidores: o primário come o produtor (é herbívoro), o secundário come o primário, o terciário come o secundário, e assim por diante. Os decompositores (fungos e bactérias) agem sobre os restos de todos os níveis.',
      'A seta aponta de quem é comido para quem come, porque indica o sentido em que a matéria e a energia seguem. Cada posição na cadeia é um nível trófico: produtor é o 1º, consumidor primário é o 2º, secundário é o 3º.',
    ],
    pare: {
      pergunta: 'Na cadeia capim → gafanhoto → seriema, quem é o consumidor secundário?',
      opcoes: ['A seriema', 'O gafanhoto', 'O capim'],
      certa: 0,
      explicacao: 'O capim é o produtor (1º nível). O gafanhoto come o produtor e é consumidor primário (2º nível). A seriema come o gafanhoto: é consumidor secundário (3º nível).',
    },
    visual: { tipo: 'cadeia' },
  },
  {
    titulo: 'Teia alimentar: cadeias entrelaçadas',
    texto: [
      'Quase nenhuma espécie come uma coisa só. Por isso as cadeias se cruzam e formam uma teia alimentar. Quem se alimenta de seres de níveis diferentes ocupa mais de um nível trófico: a ema, por exemplo, come capim (produtor) e gafanhoto (consumidor primário), então está no 2º e no 3º níveis.',
      'Uma teia com muitas ligações é mais estável: se uma presa desaparece, o predador tem alternativas. Já uma espécie que depende de uma só fonte de alimento sofre muito se ela some. Clique nas espécies, no laboratório, para ver isso acontecer.',
    ],
    pare: {
      pergunta: 'A ema come capim e gafanhoto. Em que níveis tróficos ela está?',
      opcoes: ['No 2º e no 3º', 'Só no 2º', 'Só no 3º'],
      certa: 0,
      explicacao: 'Comer capim (produtor, 1º nível) coloca a ema no 2º nível. Comer gafanhoto (2º nível) a coloca no 3º. Como faz as duas coisas, ocupa os dois níveis.',
    },
    visual: { tipo: 'teia' },
  },
  {
    titulo: 'Fluxo de energia: só uma parte passa',
    texto: [
      'A energia entra no ecossistema pela luz do Sol, fixada pelos produtores na fotossíntese (produtividade primária bruta). Os produtores gastam parte dela na própria respiração; o que sobra é a produtividade primária líquida: PPL = PPB − respiração. É a PPL que fica disponível como alimento.',
      'De um nível trófico para o seguinte, só cerca de 10 % da energia chega. O resto se perde, principalmente como calor da respiração, mas também em partes não comidas, fezes e restos que vão para os decompositores. Por isso a energia flui em um só sentido e as cadeias têm poucos níveis. A matéria, ao contrário, circula.',
    ],
    pare: {
      pergunta: 'Os produtores fixam 20 000 kJ e 10 % passam a cada nível. Quanto chega ao consumidor secundário?',
      opcoes: ['200 kJ', '2 000 kJ', '20 kJ'],
      certa: 0,
      explicacao: 'São duas passagens: 20 000 × 0,1 = 2 000 kJ no consumidor primário e 2 000 × 0,1 = 200 kJ no secundário. 2 000 kJ é o primário; 20 kJ seria o quaternário.',
    },
    visual: { tipo: 'energia' },
  },
  {
    titulo: 'Pirâmides de energia, biomassa e números',
    texto: [
      'A pirâmide de energia mostra a energia que passa por cada nível em um intervalo de tempo (por exemplo, em um ano). Ela nunca é invertida: cada nível recebe menos energia que o anterior.',
      'A pirâmide de biomassa (massa de matéria viva) quase sempre também é “de pé”, mas pode ficar invertida no mar, num dado instante: o fitoplâncton é consumido tão depressa quanto se reproduz, então sua biomassa pode ser menor que a do zooplâncton que o come. A pirâmide de números pode ser invertida quando um produtor grande sustenta muitos consumidores pequenos, como uma árvore com milhares de insetos.',
    ],
    pare: {
      pergunta: 'Por que a pirâmide de energia nunca é invertida?',
      opcoes: ['Porque parte da energia se perde a cada passagem entre níveis', 'Porque os produtores são sempre mais numerosos', 'Porque os consumidores têm mais biomassa que os produtores'],
      certa: 0,
      explicacao: 'A cada nível, parte da energia se perde (sobretudo como calor), então o nível seguinte nunca recebe mais do que o anterior tinha. Número e biomassa podem inverter; energia, não.',
    },
    visual: { tipo: 'piramides' },
  },
  {
    titulo: 'Bioacumulação e magnificação trófica',
    texto: [
      'Substâncias que os organismos não degradam nem eliminam (DDT e outros organoclorados, mercúrio, outros metais pesados) se acumulam nos tecidos: é a bioacumulação.',
      'Como cada consumidor come muitos indivíduos do nível anterior, e só uma parte da massa ingerida vira massa do predador, a concentração da substância aumenta ao longo da cadeia: é a magnificação trófica. Enquanto a energia disponível diminui de nível em nível, o poluente fica cada vez mais concentrado, e os predadores de topo são os mais atingidos.',
    ],
    pare: {
      pergunta: 'Numa cadeia contaminada com mercúrio, qual organismo tende a ter a maior concentração?',
      opcoes: ['O predador de topo', 'O produtor', 'O consumidor primário'],
      certa: 0,
      explicacao: 'O mercúrio não é eliminado e se acumula. Cada passagem concentra mais, então o predador de topo, que come muitos consumidores contaminados, tem a maior concentração.',
    },
    visual: { tipo: 'acumulo' },
  },
  {
    titulo: 'Ciclo do carbono',
    texto: [
      'O carbono entra nos seres vivos pela fotossíntese, que retira CO₂ do ar e o transforma em matéria orgânica. Passa de um nível trófico a outro pela alimentação e volta à atmosfera pela respiração (de todos os seres aeróbicos), pela decomposição e pela combustão.',
      'Quando restos de seres vivos são soterrados por milhões de anos, formam combustíveis fósseis (carvão, petróleo). Queimá-los devolve à atmosfera carbono que estava retido, e isso aumenta o CO₂ do ar. É esse acréscimo, e não o CO₂ da respiração, que desequilibra o ciclo.',
    ],
    pare: {
      pergunta: 'Que processo retira CO₂ da atmosfera e o incorpora à matéria orgânica?',
      opcoes: ['Fotossíntese', 'Respiração celular', 'Combustão'],
      certa: 0,
      explicacao: 'A fotossíntese fixa o carbono do CO₂ em matéria orgânica. Respiração e combustão fazem o contrário: devolvem CO₂ ao ar.',
    },
    visual: { tipo: 'carbono' },
  },
  {
    titulo: 'Ciclo do nitrogênio',
    texto: [
      'O ar tem cerca de 78 % de N₂, mas plantas e animais não conseguem usá-lo diretamente. Bactérias fixadoras (como Rhizobium, em nódulos de raízes de leguminosas, e Azotobacter, de vida livre) transformam N₂ em amônia, que fica como amônio (NH₄⁺) no solo. É a fixação.',
      'Bactérias nitrificantes oxidam o amônio a nitrito e depois a nitrato (nitrificação). As plantas absorvem nitrato e o incorporam a proteínas e ácidos nucleicos (assimilação), e os animais obtêm nitrogênio ao comer. Decompositores liberam amônia dos restos e excretas (amonificação), e bactérias desnitrificantes, em solo pobre em oxigênio, devolvem N₂ ao ar (desnitrificação).',
    ],
    pare: {
      pergunta: 'Que processo converte o N₂ do ar em amônia, a primeira forma aproveitável pelos seres vivos?',
      opcoes: ['Fixação por bactérias', 'Desnitrificação', 'Nitrificação'],
      certa: 0,
      explicacao: 'A fixação biológica, feita por bactérias, transforma N₂ em amônia. A nitrificação segue depois (amônio → nitrato), e a desnitrificação devolve N₂ ao ar.',
    },
    visual: { tipo: 'nitrogenio' },
  },
  {
    titulo: 'Relações entre os seres vivos',
    texto: [
      'As relações ecológicas são interações entre indivíduos de uma comunidade. Podem ser entre espécies diferentes (interespecíficas) ou da mesma espécie (intraespecíficas), e harmônicas (ninguém sai prejudicado) ou desarmônicas. Para classificar, pergunte: as espécies são iguais ou diferentes? Quem ganha, quem perde, quem não é afetado?',
      'Duas confusões clássicas: mutualismo (um não vive sem o outro) × protocooperação (os dois ganham, mas podem viver separados); e colônia (indivíduos unidos anatomicamente) × sociedade (indivíduos independentes que cooperam). Alguns livros ainda separam o inquilinismo (uso do outro apenas como abrigo ou suporte) do comensalismo; as questões costumam deixar a classificação clara no enunciado.',
    ],
    pare: {
      pergunta: 'Fungo e alga num líquen se beneficiam e vivem associados de modo obrigatório. Que relação é essa?',
      opcoes: ['Mutualismo', 'Parasitismo', 'Comensalismo'],
      certa: 0,
      explicacao: 'Os dois são beneficiados (+/+) e a associação é obrigatória: é mutualismo. Parasitismo (+/−) e comensalismo (+/0) têm sinais diferentes.',
    },
    visual: { tipo: 'relacoes' },
  },
  {
    titulo: 'Crescimento populacional',
    texto: [
      'O tamanho de uma população muda com os nascimentos, as mortes, a imigração e a emigração: ΔN = nascimentos + imigrantes − mortes − emigrantes. A densidade populacional é o número de indivíduos por unidade de área ou de volume.',
      'Sem limites, a população cresce de forma exponencial (curva em J), multiplicando-se pelo mesmo fator a cada intervalo. Na natureza, a resistência ambiental (falta de alimento e espaço, competição, predação, doenças) freia o crescimento, e a curva fica em S (logística), estabilizando na capacidade de suporte (K). A velocidade de crescimento é máxima quando N = K/2.',
    ],
    pare: {
      pergunta: 'Num crescimento logístico, quando a população cresce mais rápido?',
      opcoes: ['Quando N é a metade da capacidade de suporte', 'Quando N atinge a capacidade de suporte', 'Quando N é muito pequeno'],
      certa: 0,
      explicacao: 'Em N pequeno há poucos indivíduos para se reproduzir; em N = K a resistência ambiental anula o crescimento. O máximo fica no meio, em K/2.',
    },
    visual: { tipo: 'crescimento' },
  },
  {
    titulo: 'Presa e predador',
    texto: [
      'Quando há muitas presas, os predadores têm comida e aumentam. Com mais predadores, as presas diminuem. Sem presas, os predadores passam fome e também diminuem. Aí as presas se recuperam, e o ciclo recomeça. O resultado são oscilações das duas populações, com o pico dos predadores vindo depois do pico das presas.',
      'Esse comportamento aparece no modelo de Lotka-Volterra, uma simplificação: na natureza há outras presas, outros predadores, refúgios e variações do ambiente, que amortecem ou modificam as oscilações.',
    ],
    pare: {
      pergunta: 'Depois de um grande aumento da população de presas, o que acontece primeiro com os predadores?',
      opcoes: ['Aumentam, com algum atraso', 'Diminuem imediatamente', 'Não mudam'],
      certa: 0,
      explicacao: 'Mais presas significam mais alimento, então os predadores se reproduzem mais, mas com atraso. Só depois, com muitos predadores, as presas voltam a diminuir.',
    },
    visual: { tipo: 'presapredador' },
  },
  {
    titulo: 'Sucessão ecológica',
    texto: [
      'Sucessão ecológica é a substituição gradual de comunidades num mesmo local. Começa com espécies pioneiras (líquens, musgos, ervas), que toleram condições difíceis e modificam o ambiente: formam solo, dão sombra e abrem caminho para outras. Ao longo do tempo, a diversidade de espécies, a biomassa e a complexidade das teias aumentam, até uma comunidade clímax, relativamente estável.',
      'Na sucessão primária, o processo começa onde não havia solo nem comunidade (rocha nua, dunas, lava recém-resfriada). Na secundária, ele recomeça onde já havia solo e sementes (campo abandonado, mata queimada), por isso é bem mais rápida.',
    ],
    pare: {
      pergunta: 'Um trecho de mata derrubado e abandonado volta a ser coberto de vegetação a partir do solo e das sementes que ficaram. Essa sucessão é:',
      opcoes: ['Secundária', 'Primária', 'Clímax'],
      certa: 0,
      explicacao: 'O solo e as sementes permaneceram, então o processo não começa do zero: é sucessão secundária. A primária exige substrato sem solo, como rocha nua. “Clímax” é o estágio final, e não um tipo de sucessão.',
    },
    visual: { tipo: 'sucessao' },
  },
]

export const RESUMO_ECOLOGIA: SecaoResumo[] = [
  {
    titulo: 'Cadeias, teias e níveis tróficos',
    formulas: [],
    ideias: [
      'Cadeia alimentar: produtor → consumidor primário → secundário → terciário. A seta vai de quem é comido para quem come.',
      'Produtor = 1º nível; consumidor primário = 2º; secundário = 3º. Decompositores agem em todos os níveis.',
      'Em uma teia, onívoros e carnívoros que comem presas de níveis diferentes ocupam mais de um nível.',
      'Retirar um predador tende a aumentar suas presas; retirar uma presa tende a diminuir seus predadores. Retirar um produtor reduz todos os níveis acima.',
    ],
    pegadinhas: ['Inverter o sentido da seta (ela mostra o fluxo de energia, e não “quem ataca quem”).', 'Dizer que todo animal é consumidor primário, esquecendo que carnívoros são secundários ou de ordem maior.', 'Achar que o efeito de retirar um predador chega só aos que ele comia: os efeitos se propagam em cascata.'],
  },
  {
    titulo: 'Fluxo de energia e pirâmides',
    formulas: [
      { rotulo: 'Produtividade líquida', tex: '\\text{PPL} = \\text{PPB} - R' },
      { rotulo: 'Energia no nível n (eficiência ef)', tex: 'E_n = E_0 \\cdot ef^{\\,n}' },
      { rotulo: 'Eficiência entre dois níveis', tex: 'ef = \\dfrac{E_{\\text{nível superior}}}{E_{\\text{nível inferior}}} \\times 100\\,\\%' },
    ],
    ideias: ['Só cerca de 10 % da energia passa de um nível ao seguinte; o restante se perde, sobretudo como calor da respiração.', 'A energia flui em um só sentido; a matéria circula.', 'A pirâmide de energia nunca é invertida. A de biomassa pode ser (fitoplâncton no mar) e a de números também (uma árvore e seus insetos).'],
    pegadinhas: ['Usar 10 % uma vez só quando há várias passagens: o fator é composto (ef elevado ao número de passagens).', 'Esquecer a respiração dos produtores: o que passa adiante é a PPL, e não a PPB.', 'Dizer que “a energia se recicla” (é a matéria que se recicla).'],
  },
  {
    titulo: 'Bioacumulação',
    formulas: [
      { rotulo: 'Concentração após n passagens (fator f)', tex: 'c_n = c_0 \\cdot f^{\\,n}' },
      { rotulo: 'Fator quando tudo fica retido', tex: 'f = \\dfrac{1}{ef}' },
    ],
    ideias: ['Substâncias persistentes (DDT, mercúrio, outros metais pesados) se acumulam nos tecidos.', 'A concentração aumenta ao longo da cadeia (magnificação trófica), e os predadores de topo são os mais contaminados.', 'A energia diminui de nível em nível, mas o poluente aumenta.'],
    pegadinhas: ['Achar que o poluente se dilui ao longo da cadeia, como a energia.', 'Esquecer que a concentração é por massa de tecido (mg/kg), e não a quantidade total ingerida.'],
  },
  {
    titulo: 'Ciclos do carbono e do nitrogênio',
    formulas: [],
    ideias: [
      'Carbono: fotossíntese retira CO₂ do ar; respiração, decomposição e combustão devolvem. Combustíveis fósseis são carbono retido há milhões de anos.',
      'Nitrogênio: fixação (N₂ → NH₃/NH₄⁺, bactérias) → nitrificação (NH₄⁺ → NO₂⁻ → NO₃⁻, bactérias) → assimilação (plantas) → amonificação (decompositores) → desnitrificação (NO₃⁻ → N₂, bactérias).',
      'O maior reservatório de nitrogênio é a atmosfera (cerca de 78 % de N₂). O maior reservatório de carbono são as rochas sedimentares.',
      'Excesso de adubo nitrogenado e fosfatado em lagos causa eutrofização: algas, decomposição, falta de oxigênio e morte de peixes.',
    ],
    pegadinhas: ['Confundir nitrificação (amônio → nitrato) com desnitrificação (nitrato → N₂).', 'Achar que plantas absorvem N₂ do ar.', 'Dizer que a respiração é a causa do aumento do CO₂: ela devolve só o carbono recém-fixado; o acréscimo vem dos fósseis e do desmatamento.'],
  },
  {
    titulo: 'Relações ecológicas',
    formulas: [],
    ideias: [
      'Interespecíficas: mutualismo (+/+, obrigatório), protocooperação (+/+, facultativo), comensalismo (+/0), predação (+/−), parasitismo (+/−), competição (−/−), amensalismo (0/−).',
      'Intraespecíficas: colônia (unidos anatomicamente), sociedade (independentes, com divisão de trabalho), competição intraespecífica e canibalismo.',
      'Alguns livros incluem o inquilinismo (abrigo ou suporte) como relação separada do comensalismo.',
    ],
    pegadinhas: ['Confundir mutualismo com protocooperação: a diferença é a dependência obrigatória.', 'Confundir predação com parasitismo: o predador mata a presa; o parasita, em geral, mantém o hospedeiro vivo.', 'Confundir colônia com sociedade (as abelhas formam sociedade; os pólipos do coral, colônia).'],
  },
  {
    titulo: 'Populações e sucessão',
    formulas: [
      { rotulo: 'Variação do tamanho', tex: '\\Delta N = \\text{nasc.} + \\text{imig.} - \\text{mortes} - \\text{emig.}' },
      { rotulo: 'Crescimento exponencial', tex: 'N = N_0\\,(1 + r)^t' },
      { rotulo: 'Crescimento logístico', tex: '\\dfrac{dN}{dt} = r\\,N\\left(1 - \\dfrac{N}{K}\\right)' },
      { rotulo: 'Taxa máxima (em N = K/2)', tex: '\\left(\\dfrac{dN}{dt}\\right)_{\\max} = \\dfrac{rK}{4}' },
      { rotulo: 'Marcação-recaptura', tex: 'N = \\dfrac{M \\cdot C}{R}' },
    ],
    ideias: [
      'Sem limites, o crescimento é exponencial (J); com resistência ambiental, é logístico (S) e estabiliza em K.',
      'Em Lotka-Volterra, presas e predadores oscilam com defasagem: o pico dos predadores vem depois do das presas.',
      'Sucessão: pioneiras → comunidade clímax. Primária (sem solo) é lenta; secundária (com solo e sementes) é mais rápida.',
    ],
    pegadinhas: ['Achar que a taxa de crescimento é máxima em N = K (nesse ponto ela é zero).', 'Aplicar a taxa de crescimento somando em vez de compor (usar N₀ + N₀·r·t no lugar de N₀·(1+r)ᵗ).', 'Confundir sucessão secundária com primária: o que decide é a presença prévia de solo.'],
  },
]
