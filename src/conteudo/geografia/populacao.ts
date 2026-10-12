import type { ItemBanco } from '@/materias/biologia/comum/auxiliares'
import type { PareEPense, SecaoResumo } from '../tipos'

export const FONTES_POPULACAO = [
  'IBGE. Censo Demográfico 2022: população e domicílios (ibge.gov.br).',
  'IBGE. Projeções da população do Brasil e unidades da federação (ibge.gov.br).',
  'ONU. World Population Prospects (population.un.org/wpp).',
  'Thompson, W. S. Population. American Journal of Sociology, v. 34, 1929 (origem do modelo de fases).',
  'Notestein, F. W. Population: the long view. In: Schultz, T. W. (org.). Food for the world. Chicago: University of Chicago Press, 1945.',
]

/** Aviso mostrado junto com as pirâmides, para ninguém confundir o modelo com um país de verdade. */
export const NOTA_MODELO =
  'As pirâmides deste tema são modelos didáticos, calculados a partir de fecundidade e esperança de vida. Mostram a forma típica de cada fase, não os dados de um país. Para dados reais, consulte o IBGE e a ONU.'

/** Contagens oficiais da população do Brasil nos censos (IBGE). */
export const CENSOS = [
  { ano: 2000, populacao: 169_799_170 },
  { ano: 2010, populacao: 190_755_799 },
  { ano: 2022, populacao: 203_080_756 },
]

export interface InfoFase {
  numero: 1 | 2 | 3 | 4
  nome: string
  natalidade: string
  mortalidade: string
  crescimento: string
  explicacao: string
}

export const FASES: InfoFase[] = [
  {
    numero: 1,
    nome: 'Altas natalidade e mortalidade',
    natalidade: 'alta (acima de 30 por mil)',
    mortalidade: 'alta (acima de 25 por mil)',
    crescimento: 'lento, perto de zero',
    explicacao: 'Nascem muitas crianças, mas muitas morrem cedo, por doenças, fome e falta de saneamento. As duas taxas se compensam, e a população quase não cresce. É a situação de sociedades antes da industrialização e da medicina moderna.',
  },
  {
    numero: 2,
    nome: 'Mortalidade em queda',
    natalidade: 'ainda alta',
    mortalidade: 'em queda rápida',
    crescimento: 'acelerado: a diferença entre as taxas é a maior de todas',
    explicacao: 'Vacinas, antibióticos, saneamento e melhor alimentação reduzem as mortes, principalmente de crianças. Os costumes demoram mais a mudar, e a natalidade continua alta. A diferença entre nascimentos e mortes é grande, e a população cresce depressa.',
  },
  {
    numero: 3,
    nome: 'Natalidade em queda',
    natalidade: 'em queda (entre 15 e 30 por mil)',
    mortalidade: 'baixa',
    crescimento: 'ainda positivo, mas cada vez menor',
    explicacao: 'Urbanização, mais escolaridade, trabalho das mulheres e acesso a métodos contraceptivos reduzem o número de filhos. A base da pirâmide começa a estreitar, e o número de idosos aumenta aos poucos. É a fase em que costuma haver bônus demográfico.',
  },
  {
    numero: 4,
    nome: 'Baixas natalidade e mortalidade',
    natalidade: 'baixa (cerca de 10 por mil)',
    mortalidade: 'baixa',
    crescimento: 'próximo de zero ou negativo',
    explicacao: 'Poucos nascimentos e poucas mortes precoces. A população envelhece: a pirâmide fica com a base estreita e o topo largo. Sem imigração, o número de habitantes pode diminuir.',
  },
]

export interface PassoPopulacao {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual:
    | { tipo: 'piramide'; fase: 1 | 2 | 3 | 4; grupos?: boolean }
    | { tipo: 'taxas'; natalidade: number; mortalidade: number }
    | { tipo: 'transicao' }
    | { tipo: 'quatro' }
    | { tipo: 'indicadores'; fase: 1 | 2 | 3 | 4 }
    | { tipo: 'bonus' }
    | { tipo: 'censos' }
}

export const PASSOS_POPULACAO: PassoPopulacao[] = [
  {
    titulo: 'Como ler uma pirâmide etária',
    texto: [
      'A pirâmide etária empilha as faixas de idade, da mais nova (na base) à mais velha (no topo). Cada barra mostra quanto da população está naquela faixa: os homens ficam de um lado, as mulheres do outro. O comprimento da barra pode ser o número de pessoas ou, como aqui, o percentual do total.',
      'A forma conta a história do lugar. Uma base larga indica muitos nascimentos. Um topo largo indica muitas pessoas idosas. Para analisar, junte as faixas em três grupos: jovens (0 a 14 anos), adultos em idade ativa (15 a 64 anos) e idosos (65 anos ou mais).',
    ],
    pare: {
      pergunta: 'Em uma pirâmide etária, o que mostra o comprimento de cada barra?',
      opcoes: ['A idade média do grupo', 'Quantas pessoas (ou que percentual) estão naquela faixa de idade', 'A esperança de vida daquele grupo'],
      certa: 1,
      explicacao: 'Cada barra é uma faixa de idade; o comprimento mostra a quantidade (ou o percentual) de pessoas nela. Homens de um lado, mulheres do outro.',
    },
    visual: { tipo: 'piramide', fase: 3, grupos: true },
  },
  {
    titulo: 'Natalidade, mortalidade e crescimento natural',
    texto: [
      'A taxa de natalidade é o número de nascidos vivos em um ano para cada mil habitantes. A taxa de mortalidade é o número de mortes no ano para cada mil habitantes. Ambas são medidas em “por mil” (‰).',
      'O crescimento natural é a diferença entre as duas. Como 10 por mil equivalem a 1%, basta dividir por 10: crescimento natural (% ao ano) = (natalidade − mortalidade) ÷ 10. O crescimento total ainda soma o saldo migratório (quem chega menos quem sai).',
      'A taxa de fecundidade total é o número médio de filhos por mulher. Em países com mortalidade baixa, cerca de 2,1 filhos por mulher repõem a população: acima disso ela tende a crescer, abaixo tende a diminuir.',
    ],
    pare: {
      pergunta: 'Uma população tem natalidade de 30 por mil e mortalidade de 10 por mil. Qual é o crescimento natural?',
      opcoes: ['20% ao ano', '2% ao ano', '0,2% ao ano'],
      certa: 1,
      explicacao: '30 − 10 = 20 por mil; dividindo por 10, 2% ao ano. (20 por mil não é 20%: por mil é a milésima parte.)',
    },
    visual: { tipo: 'taxas', natalidade: 30, mortalidade: 10 },
  },
  {
    titulo: 'As quatro fases da transição demográfica',
    texto: [
      'A transição demográfica descreve como uma população passa de natalidade e mortalidade altas para natalidade e mortalidade baixas. O modelo clássico (Thompson e Notestein) tem quatro fases. Na primeira, as duas taxas são altas e quase se anulam. Na segunda, a mortalidade cai primeiro, mas a natalidade continua alta. Na terceira, a natalidade também cai. Na quarta, as duas estão baixas.',
      'A população cresce mais depressa na fase 2, porque é quando a diferença entre as taxas é maior. Veja no gráfico: a faixa colorida entre as duas curvas é o crescimento natural. O modelo é uma simplificação: cada país seguiu seu próprio ritmo, e alguns passaram pela transição em poucas décadas.',
    ],
    pare: {
      pergunta: 'Por que a população cresce mais rápido na fase 2?',
      opcoes: ['A natalidade cai antes da mortalidade', 'A mortalidade cai antes da natalidade, e a diferença entre as duas aumenta', 'A migração aumenta muito'],
      certa: 1,
      explicacao: 'A mortalidade cai primeiro (saneamento, vacinas, medicina). A natalidade, ligada a costumes, demora mais a cair. Enquanto isso, a diferença cresce.',
    },
    visual: { tipo: 'transicao' },
  },
  {
    titulo: 'Da base larga ao topo largo',
    texto: [
      'Cada fase deixa uma marca na pirâmide. Nas fases 1 e 2, muitos nascimentos: base larga e topo muito estreito (população jovem). Na fase 3, a base estreita aos poucos e o meio engorda. Na fase 4, a base é estreita e o topo largo (população envelhecida).',
      'A pirâmide também lembra o passado: as pessoas que nasceram em uma época de muitos nascimentos formam uma “onda” que sobe de faixa a cada cinco anos. Por isso a população ainda pode crescer um tempo depois de a fecundidade cair (inércia demográfica).',
    ],
    pare: {
      pergunta: 'Uma pirâmide com a base estreita e o topo largo corresponde a qual fase?',
      opcoes: ['Fase 1', 'Fase 3', 'Fase 4'],
      certa: 2,
      explicacao: 'Poucos nascimentos e muitas pessoas idosas: natalidade e mortalidade baixas, a fase 4.',
    },
    visual: { tipo: 'quatro' },
  },
  {
    titulo: 'Razão de dependência e envelhecimento',
    texto: [
      'A razão de dependência compara quem tende a depender de outros (jovens de 0 a 14 anos e idosos de 65 ou mais) com quem está em idade ativa (15 a 64 anos): RD = (jovens + idosos) ÷ adultos × 100. O resultado é o número de dependentes para cada 100 pessoas em idade ativa.',
      'Dá para separar a conta: a razão de jovens é jovens ÷ adultos × 100, e a razão de idosos é idosos ÷ adultos × 100. O índice de envelhecimento compara os dois extremos: idosos ÷ jovens × 100. Se passa de 100, há mais idosos do que jovens.',
      'Cuidado: “idade ativa” é uma convenção por idade. Nem todo adulto trabalha, e muitos idosos e jovens trabalham.',
    ],
    pare: {
      pergunta: 'Uma população tem 30% de jovens, 60% de adultos e 10% de idosos. Qual é a razão de dependência?',
      opcoes: ['40', 'Cerca de 66,7', 'Cerca de 16,7'],
      certa: 1,
      explicacao: 'Dependentes = 30 + 10 = 40; dividindo por 60 adultos: 40 ÷ 60 × 100 ≈ 66,7 dependentes por 100 pessoas em idade ativa. (O valor 40 é a soma de dependentes, não a razão.)',
    },
    visual: { tipo: 'indicadores', fase: 3 },
  },
  {
    titulo: 'Bônus demográfico',
    texto: [
      'O bônus demográfico (ou janela de oportunidade) é o período em que a razão de dependência está baixa e em queda: há menos crianças do que antes, e os idosos ainda são poucos. A parcela da população em idade ativa é grande em relação ao total.',
      'Esse período abre uma chance: com educação, emprego, saúde e poupança, o país pode crescer mais e investir no futuro. Mas é só uma chance. Sem empregos e escolas de qualidade, a população em idade ativa não vira desenvolvimento.',
      'O bônus acaba quando a população idosa cresce o bastante para a razão de dependência voltar a subir. Depois dele, o desafio passa a ser financiar a previdência e a saúde de uma população mais velha.',
    ],
    pare: {
      pergunta: 'O bônus demográfico garante, sozinho, crescimento econômico?',
      opcoes: ['Sim, é automático', 'Não, depende de empregos, educação e investimentos', 'Só se a natalidade voltar a subir'],
      certa: 1,
      explicacao: 'O bônus é uma oportunidade. Aproveitá-la depende de políticas públicas e de investimentos em educação, saúde e geração de empregos.',
    },
    visual: { tipo: 'bonus' },
  },
  {
    titulo: 'Crescimento composto e tempo de duplicação',
    texto: [
      'O crescimento populacional é composto: cada ano soma uma porcentagem sobre o total do ano anterior. Com taxa de r% ao ano, a população depois de t anos é P = P₀ × (1 + r/100)ᵗ. Para achar a taxa média entre duas contagens, inverte-se a fórmula: r = ((P₁ ÷ P₀)^(1/t) − 1) × 100.',
      'A regra dos 70 dá o tempo aproximado para a população dobrar: tempo ≈ 70 ÷ r (com r em % ao ano). A 2% ao ano, são cerca de 35 anos; a 1%, cerca de 70 anos.',
      'No Brasil, o ritmo de crescimento diminuiu: entre os censos de 2000 e 2010, a população cresceu cerca de 1,2% ao ano; entre 2010 e 2022, cerca de 0,5% ao ano.',
    ],
    pare: {
      pergunta: 'Pela regra dos 70, uma população que cresce 2% ao ano dobra em cerca de quantos anos?',
      opcoes: ['20 anos', '35 anos', '70 anos'],
      certa: 1,
      explicacao: '70 ÷ 2 = 35 anos.',
    },
    visual: { tipo: 'censos' },
  },
]

export const RESUMO_POPULACAO: SecaoResumo[] = [
  {
    titulo: 'Pirâmide etária e razões',
    formulas: [
      { rotulo: 'Razão de dependência', tex: 'RD = \\dfrac{\\text{jovens (0–14)} + \\text{idosos (65+)}}{\\text{adultos (15–64)}} \\times 100' },
      { rotulo: 'Razão de idosos', tex: 'RI = \\dfrac{\\text{idosos}}{\\text{adultos}} \\times 100' },
      { rotulo: 'Índice de envelhecimento', tex: 'IE = \\dfrac{\\text{idosos (65+)}}{\\text{jovens (0–14)}} \\times 100' },
    ],
    ideias: [
      'Base larga: muitos nascimentos (população jovem). Topo largo: muitos idosos (população envelhecida).',
      'Agrupe as faixas em jovens (0 a 14), adultos (15 a 64) e idosos (65 ou mais) antes de calcular.',
      'IE maior que 100: há mais idosos do que jovens.',
    ],
    pegadinhas: ['Dividir pelo total em vez de dividir pelos adultos.', 'Inverter o índice de envelhecimento (jovens ÷ idosos).', 'Confundir razão de dependência (dependentes por adulto) com percentual de dependentes.'],
    fontes: FONTES_POPULACAO,
  },
  {
    titulo: 'Taxas e crescimento',
    formulas: [
      { rotulo: 'Crescimento natural (% ao ano)', tex: 'CN = \\dfrac{\\text{natalidade (‰)} - \\text{mortalidade (‰)}}{10}' },
      { rotulo: 'Regra dos 70', tex: 't_{\\text{dobrar}} \\approx \\dfrac{70}{r}\\ (r\\ \\text{em}\\ \\%\\ \\text{ao ano})' },
      { rotulo: 'População futura', tex: 'P = P_0\\,\\left(1 + \\dfrac{r}{100}\\right)^{t}' },
      { rotulo: 'Taxa média entre duas contagens', tex: 'r = \\left[\\left(\\dfrac{P_1}{P_0}\\right)^{1/t} - 1\\right] \\times 100' },
    ],
    ideias: ['Natalidade e mortalidade são “por mil”: 10‰ = 1%.', 'Crescimento total = crescimento natural + saldo migratório.', 'Fecundidade de reposição: cerca de 2,1 filhos por mulher.'],
    pegadinhas: ['Esquecer de converter por mil em porcentagem (dividir por 10).', 'Tratar o crescimento como linear (P₀ × (1 + r·t)) em vez de composto.', 'Usar a regra dos 70 com a taxa em por mil.'],
    fontes: FONTES_POPULACAO,
  },
  {
    titulo: 'Transição demográfica e bônus',
    formulas: [],
    ideias: [
      'Fase 1: natalidade e mortalidade altas, crescimento lento.',
      'Fase 2: mortalidade cai e natalidade segue alta: crescimento mais rápido.',
      'Fase 3: natalidade cai: crescimento diminui e a base da pirâmide estreita.',
      'Fase 4: as duas taxas baixas: envelhecimento e crescimento próximo de zero ou negativo.',
      'Bônus demográfico: período de razão de dependência baixa e em queda. Vira desenvolvimento só com educação, empregos e investimento.',
      'Envelhecimento: pressiona previdência e saúde.',
    ],
    pegadinhas: ['Achar que a mortalidade e a natalidade caem juntas: a mortalidade cai primeiro.', 'Achar que o bônus demográfico é automático.', 'Achar que a população para de crescer assim que a fecundidade chega a 2,1 (há inércia).'],
    fontes: FONTES_POPULACAO,
  },
]

/* ------------------------------------------------------------------ bancos de perguntas */

export const BANCO_FASE: ItemBanco[] = [
  {
    pergunta: 'Por que a fase 2 da transição demográfica tem o maior crescimento natural?',
    certa: { texto: 'A mortalidade já caiu, mas a natalidade continua alta: a diferença entre as duas é grande.', porque: 'Vacinas, antibióticos e saneamento reduzem as mortes primeiro; a natalidade, ligada a costumes, demora mais. A diferença entre nascimentos e mortes é a maior do modelo.' },
    erradas: [
      { texto: 'A natalidade cai mais rápido que a mortalidade e a diferença aumenta.', porque: 'A ordem está invertida: no modelo, a mortalidade é a primeira a cair.', motivo: 'inverteu a ordem das quedas' },
      { texto: 'A migração internacional é muito intensa nessa fase.', porque: 'A transição demográfica trata de natalidade e mortalidade. A migração entra no crescimento total, mas não explica a fase 2.', motivo: 'confundiu crescimento natural com saldo migratório' },
      { texto: 'A esperança de vida diminui e por isso nascem mais crianças.', porque: 'Na fase 2 a esperança de vida aumenta, porque a mortalidade cai.', motivo: 'trocou o sentido da esperança de vida' },
    ],
    licao: 'Fase 2: a mortalidade cai primeiro e a natalidade continua alta. É o maior afastamento entre as duas curvas.',
    dicas: ['Pense em qual taxa muda primeiro: a que depende de saneamento e remédios ou a que depende de costumes?', 'Crescimento natural = natalidade − mortalidade.', 'O crescimento é maior quando as duas curvas estão mais afastadas.'],
  },
  {
    pergunta: 'Que fatores costumam explicar a queda da natalidade na fase 3?',
    certa: { texto: 'Urbanização, mais escolaridade e trabalho das mulheres, acesso a métodos contraceptivos e maior custo de criar filhos.', porque: 'São os fatores mais associados à queda da fecundidade nos países que passaram pela transição.' },
    erradas: [
      { texto: 'Aumento da mortalidade infantil, que desestimula as famílias a ter filhos.', porque: 'A mortalidade infantil cai ao longo da transição, não sobe.', motivo: 'inverteu a mortalidade infantil' },
      { texto: 'Proibição de ter filhos pelo governo em todos os países.', porque: 'Houve políticas de controle em alguns países, mas não em todos, e não explicam a queda da natalidade em geral.', motivo: 'generalizou uma política específica' },
      { texto: 'Redução da esperança de vida.', porque: 'A esperança de vida aumenta na transição.', motivo: 'trocou o sentido da esperança de vida' },
    ],
    licao: 'A natalidade cai com urbanização, escolaridade, trabalho feminino e contracepção.',
    dicas: ['Pense em como a vida muda quando uma sociedade vai do campo para a cidade.', 'Mais mulheres estudam e trabalham fora de casa.', 'Criar filhos na cidade custa mais caro.'],
  },
  {
    pergunta: 'Uma população com fecundidade abaixo de 2,1 filhos por mulher por muitas décadas, sem imigração, tende a:',
    certa: { texto: 'Parar de crescer e depois diminuir, com proporção cada vez maior de idosos.', porque: 'Abaixo da reposição, cada geração é menor que a anterior, e a população envelhece.' },
    erradas: [
      { texto: 'Crescer cada vez mais depressa.', porque: 'Abaixo da reposição a população deixa de se repor e não cresce mais rápido.', motivo: 'ignorou a fecundidade de reposição' },
      { texto: 'Manter uma pirâmide de base larga.', porque: 'Com poucos nascimentos, a base da pirâmide estreita.', motivo: 'trocou base larga por base estreita' },
      { texto: 'Ter a razão de dependência sempre diminuindo.', porque: 'O número de idosos aumenta; no longo prazo, a razão de dependência volta a subir.', motivo: 'ignorou o envelhecimento' },
    ],
    licao: 'Fecundidade abaixo de cerca de 2,1: a população tende a parar de crescer, diminuir e envelhecer (sem imigração).',
    dicas: ['2,1 filhos por mulher é a reposição.', 'Se cada geração é menor que a anterior, o que acontece com a base da pirâmide?', 'Menos jovens e mais idosos mudam o topo da pirâmide.'],
  },
  {
    pergunta: 'Por que uma população pode continuar crescendo por um tempo depois que a fecundidade cai para o nível de reposição?',
    certa: { texto: 'Há muitas mulheres em idade de ter filhos, nascidas quando a fecundidade era alta (inércia demográfica).', porque: 'A geração grande que nasceu antes continua tendo filhos; só depois o número de nascimentos se ajusta.' },
    erradas: [
      { texto: 'Porque a mortalidade sobe nessa fase.', porque: 'Mortalidade em alta reduziria a população, e não é o que explica a inércia.', motivo: 'inverteu o efeito da mortalidade' },
      { texto: 'Porque a imigração é obrigatória.', porque: 'A inércia demográfica acontece mesmo sem imigração.', motivo: 'inventou uma regra de imigração' },
      { texto: 'Isso não acontece: ao chegar à reposição, o crescimento para na hora.', porque: 'Acontece, sim: a estrutura por idade guarda o passado, e as gerações grandes ainda estão na idade de ter filhos.', motivo: 'ignorou a inércia da estrutura etária' },
    ],
    licao: 'A pirâmide guarda o passado: gerações grandes continuam tendo filhos depois de a fecundidade cair (inércia demográfica).',
    dicas: ['A pirâmide mostra quantas mulheres estão em idade de ter filhos.', 'Quem nasceu quando havia muitos nascimentos forma uma “onda” grande que sobe a pirâmide.', 'Os nascimentos dependem do número de mulheres e do número de filhos por mulher.'],
  },
  {
    pergunta: 'O que a transição demográfica descreve?',
    certa: { texto: 'A passagem de natalidade e mortalidade altas para taxas baixas, com um período intermediário de crescimento acelerado.', porque: 'É a definição do modelo: as taxas mudam em etapas e a população cresce mais depressa quando elas estão mais afastadas.' },
    erradas: [
      { texto: 'A mudança da população do campo para a cidade.', porque: 'Isso é urbanização (êxodo rural), que contribui para a transição, mas não a define.', motivo: 'confundiu com urbanização' },
      { texto: 'A troca de governo em países com alta natalidade.', porque: 'Governos influenciam a demografia, mas a transição é uma mudança de taxas.', motivo: 'confundiu demografia com política' },
      { texto: 'O envelhecimento causado apenas pela imigração.', porque: 'O envelhecimento vem principalmente da queda da fecundidade e do aumento da esperança de vida.', motivo: 'atribuiu a causa à imigração' },
    ],
    licao: 'Transição demográfica: de natalidade e mortalidade altas a natalidade e mortalidade baixas, passando por crescimento acelerado.',
    dicas: ['O nome diz: “transição” é passar de um estado a outro.', 'Os estados são definidos pelas taxas de natalidade e mortalidade.', 'No meio do caminho, as taxas se afastam e a população cresce.'],
  },
]

export const BANCO_BONUS: ItemBanco[] = [
  {
    pergunta: 'O que é o bônus demográfico?',
    certa: { texto: 'Período em que a parcela da população em idade ativa é grande e a razão de dependência é baixa.', porque: 'Há poucos dependentes (menos jovens que antes e ainda poucos idosos) para cada pessoa em idade ativa.' },
    erradas: [
      { texto: 'Dinheiro pago pelo governo às famílias com muitos filhos.', porque: 'É um conceito demográfico, não um benefício em dinheiro.', motivo: 'confundiu com benefício social' },
      { texto: 'Período em que o número de idosos cresce mais que o de adultos.', porque: 'Isso aumenta a razão de dependência: é o fim do bônus, não o bônus.', motivo: 'confundiu com o fim do bônus' },
      { texto: 'Aumento temporário da natalidade depois de uma guerra.', porque: 'Isso é um “baby boom”. O bônus tem a ver com a proporção de adultos em idade ativa.', motivo: 'confundiu com baby boom' },
    ],
    licao: 'Bônus demográfico: período de razão de dependência baixa e em queda.',
    dicas: ['“Bônus” é uma vantagem temporária.', 'A vantagem vem de ter muitos adultos em idade ativa em relação aos dependentes.', 'Pense na razão de dependência.'],
  },
  {
    pergunta: 'Durante o bônus demográfico, a razão de dependência tende a:',
    certa: { texto: 'Cair, porque o número de jovens diminui proporcionalmente e os idosos ainda são poucos.', porque: 'A base da pirâmide estreita (menos jovens), os adultos formam a maioria e o topo ainda é pequeno.' },
    erradas: [
      { texto: 'Subir, porque a população idosa é a que mais cresce.', porque: 'Quando os idosos passam a pesar muito, a razão sobe de novo: é depois do bônus.', motivo: 'confundiu com o período depois do bônus' },
      { texto: 'Ficar igual, porque nascimentos e mortes se compensam.', porque: 'O bônus é justamente um período de mudança da estrutura etária.', motivo: 'ignorou a mudança na estrutura etária' },
      { texto: 'Subir, porque aumenta o número de crianças.', porque: 'No bônus o número relativo de crianças diminui.', motivo: 'inverteu o efeito da queda da natalidade' },
    ],
    licao: 'No bônus, a razão de dependência cai (menos jovens, ainda poucos idosos).',
    dicas: ['Compare a base e o topo da pirâmide no período.', 'A natalidade caiu, então há proporcionalmente menos crianças.', 'Os idosos ainda são poucos.'],
  },
  {
    pergunta: 'O bônus demográfico termina, em geral, quando:',
    certa: { texto: 'A população idosa cresce o bastante para a razão de dependência voltar a subir.', porque: 'Com mais idosos, a razão de dependência deixa de cair e começa a subir.' },
    erradas: [
      { texto: 'A natalidade volta a subir e as famílias têm muitos filhos.', porque: 'Isso não é o que costuma acontecer; o fim do bônus vem do envelhecimento.', motivo: 'inventou a volta da natalidade' },
      { texto: 'A mortalidade infantil começa a cair.', porque: 'A queda da mortalidade infantil acontece no início da transição, antes do bônus.', motivo: 'colocou a causa na fase errada' },
      { texto: 'O país conquista pleno emprego.', porque: 'Não há ligação direta: o fim do bônus depende da estrutura etária, não do emprego.', motivo: 'confundiu estrutura etária com emprego' },
    ],
    licao: 'O bônus acaba quando o envelhecimento faz a razão de dependência voltar a subir.',
    dicas: ['O bônus depende da razão de dependência.', 'Quem vai pesando mais na razão com o tempo?', 'A razão volta a subir quando os idosos se tornam muitos.'],
  },
  {
    pergunta: 'Para aproveitar o bônus demográfico, um país precisa principalmente:',
    certa: { texto: 'Investir em educação, saúde e geração de empregos para a população em idade ativa.', porque: 'O bônus é uma oportunidade: só vira renda e desenvolvimento se as pessoas em idade ativa tiverem qualificação e trabalho.' },
    erradas: [
      { texto: 'Aumentar a natalidade para ter ainda mais jovens.', porque: 'Mais jovens elevariam a razão de dependência no curto prazo e não é o que se busca.', motivo: 'quis aumentar o número de dependentes' },
      { texto: 'Reduzir a escolaridade para acelerar a entrada no trabalho.', porque: 'Menos educação reduz a produtividade e desperdiça a oportunidade.', motivo: 'reduziu a qualificação' },
      { texto: 'Nada: o crescimento econômico vem sozinho.', porque: 'Não é automático. Sem empregos e escolas, a população em idade ativa não gera desenvolvimento.', motivo: 'achou que o bônus é automático' },
    ],
    licao: 'O bônus é uma chance, não uma garantia: exige educação, saúde e empregos.',
    dicas: ['Uma oportunidade só rende se for aproveitada.', 'Pessoas em idade ativa precisam de trabalho.', 'Pense em educação e qualificação.'],
  },
  {
    pergunta: 'O envelhecimento da população pressiona principalmente:',
    certa: { texto: 'A previdência e a saúde, que passam a atender mais idosos com proporcionalmente menos pessoas em idade ativa.', porque: 'Mais aposentados e mais demanda por cuidados de saúde, com menos contribuintes para cada idoso.' },
    erradas: [
      { texto: 'Somente as escolas de ensino básico.', porque: 'Com mais idosos e menos crianças, a pressão sobre as escolas diminui.', motivo: 'inverteu o efeito sobre as escolas' },
      { texto: 'Apenas o transporte aéreo.', porque: 'O impacto central do envelhecimento está na previdência, na saúde e no mercado de trabalho.', motivo: 'ignorou os principais efeitos' },
      { texto: 'Nenhum serviço: o envelhecimento não tem efeitos.', porque: 'Tem: muda a demanda por serviços públicos e o mercado de trabalho.', motivo: 'negou o impacto' },
    ],
    licao: 'Envelhecimento: mais gastos com previdência e saúde, e menos pessoas em idade ativa por idoso.',
    dicas: ['Quem recebe aposentadoria?', 'Quem mais precisa de cuidados de saúde?', 'O que acontece com o número de crianças nas escolas?'],
  },
  {
    pergunta: 'Por que a mudança na razão de dependência importa para as políticas públicas?',
    certa: { texto: 'Porque muda a demanda: mais escolas quando há muitos jovens, mais saúde e previdência quando há muitos idosos.', porque: 'A estrutura etária define que serviços a população mais precisa.' },
    erradas: [
      { texto: 'Porque ela decide o resultado das eleições.', porque: 'Não há essa relação direta; o assunto é a demanda por serviços.', motivo: 'inventou uma ligação com eleições' },
      { texto: 'Porque determina a temperatura média do país.', porque: 'A razão de dependência não tem relação com o clima.', motivo: 'misturou demografia com clima' },
      { texto: 'Porque não muda nada: a demanda por serviços é sempre a mesma.', porque: 'Muda: cada faixa etária usa serviços diferentes.', motivo: 'ignorou as diferenças entre as faixas etárias' },
    ],
    licao: 'A estrutura etária define as necessidades: escola para jovens, trabalho para adultos, saúde e previdência para idosos.',
    dicas: ['Que serviços um jovem usa mais? E um idoso?', 'Pense em escola, emprego, saúde e aposentadoria.', 'Cada faixa de idade tem necessidades diferentes.'],
  },
]

export const BANCO_PIRAMIDE: ItemBanco[] = [
  {
    pergunta: 'Uma pirâmide com base estreita e uma saliência de homens adultos (cerca de 20 a 49 anos) sugere:',
    certa: { texto: 'Forte imigração de trabalhadores, em sua maioria homens.', porque: 'Países que recebem muitos trabalhadores estrangeiros do sexo masculino mostram esse padrão: a imigração muda a estrutura de idade e de sexo, e não só o tamanho da população.' },
    erradas: [
      { texto: 'Uma guerra que matou muitos homens adultos.', porque: 'Isso produziria uma falta de homens, não um excesso deles.', motivo: 'inverteu o efeito' },
      { texto: 'Natalidade muito alta nas últimas décadas.', porque: 'Natalidade alta alarga a base, e a pirâmide descrita tem base estreita.', motivo: 'confundiu com natalidade alta' },
      { texto: 'Esperança de vida muito baixa.', porque: 'A esperança de vida baixa estreita o topo; não cria excesso de adultos jovens.', motivo: 'confundiu com mortalidade' },
    ],
    licao: 'A migração, além da natalidade e da mortalidade, altera a forma da pirâmide, principalmente nas idades adultas.',
    dicas: ['O que traz adultos de fora para um país?', 'Os migrantes por trabalho costumam ser adultos.', 'A saliência é só de homens: há um motivo ligado ao tipo de trabalho.'],
  },
  {
    pergunta: 'Em países com baixa mortalidade, o que se vê no topo da pirâmide?',
    certa: { texto: 'Mais mulheres do que homens nas idades mais altas, porque elas vivem mais, em média.', porque: 'A esperança de vida das mulheres é maior na maior parte do mundo.' },
    erradas: [
      { texto: 'Mais homens do que mulheres nas idades mais altas.', porque: 'É o contrário: sobrevivem mais mulheres.', motivo: 'inverteu o sexo majoritário' },
      { texto: 'Exatamente o mesmo número de homens e mulheres em todas as idades.', porque: 'Nos nascimentos, nascem um pouco mais meninos, mas a mortalidade masculina maior faz as mulheres ficarem em maioria nas idades altas.', motivo: 'ignorou a diferença de mortalidade' },
      { texto: 'Nenhuma diferença: a pirâmide não mostra o sexo.', porque: 'A pirâmide etária separa homens e mulheres justamente para mostrar essa diferença.', motivo: 'ignorou a separação por sexo' },
    ],
    licao: 'Nas idades altas há mais mulheres do que homens, porque a esperança de vida feminina é maior.',
    dicas: ['Compare o lado esquerdo e o direito no topo da pirâmide.', 'Quem vive mais, em média?', 'No nascimento, a proporção é próxima de 105 meninos para 100 meninas.'],
  },
  {
    pergunta: 'Que mudança aparece na pirâmide quando a natalidade cai por muitos anos seguidos?',
    certa: { texto: 'A base se estreita, e as faixas mais velhas ganham peso relativo.', porque: 'Menos nascimentos reduzem o tamanho das faixas mais novas; com o tempo, os idosos pesam mais na população.' },
    erradas: [
      { texto: 'A base se alarga e o topo se estreita.', porque: 'É o oposto: a base estreita.', motivo: 'inverteu a mudança da base' },
      { texto: 'Nada muda: a pirâmide independe da natalidade.', porque: 'A base da pirâmide é determinada pelos nascimentos recentes.', motivo: 'ignorou a relação entre base e natalidade' },
      { texto: 'Surgem barras só do lado dos homens.', porque: 'A natalidade afeta os dois sexos, não só um lado.', motivo: 'inventou assimetria entre os sexos' },
    ],
    licao: 'Queda da natalidade: base mais estreita e envelhecimento da população.',
    dicas: ['A base é formada pelos nascimentos recentes.', 'Se nascem menos crianças, o que acontece com a barra de 0 a 4 anos?', 'As outras faixas ficam relativamente maiores.'],
  },
  {
    pergunta: 'Uma “cintura” (estreitamento) em uma faixa de idade da pirâmide, depois de uma guerra ou epidemia, mostra que:',
    certa: { texto: 'Aquelas coortes foram atingidas por mortes e por menos nascimentos, e a marca sobe de faixa com o passar dos anos.', porque: 'A pirâmide guarda o passado: um evento deixa uma marca que se desloca para cima a cada cinco anos.' },
    erradas: [
      { texto: 'A marca desaparece depois de um ano.', porque: 'A marca permanece e se desloca de faixa a cada cinco anos, até as coortes morrerem.', motivo: 'achou que a marca é passageira' },
      { texto: 'Há erro na contagem, porque a pirâmide deve ser sempre suave.', porque: 'As pirâmides reais têm irregularidades causadas por guerras, epidemias, crises e migrações.', motivo: 'achou que toda irregularidade é erro' },
      { texto: 'A natalidade aumentou nas faixas seguintes por causa disso.', porque: 'Pode ocorrer um aumento de nascimentos depois, mas a cintura em si mostra queda de nascimentos e mortes.', motivo: 'confundiu o evento com a recuperação' },
    ],
    licao: 'Eventos como guerras e epidemias deixam marcas na pirâmide, que sobem de faixa com o tempo.',
    dicas: ['Imagine a pirâmide daqui a dez anos: onde estariam as mesmas pessoas?', 'As pessoas nascidas no mesmo período formam uma coorte.', 'A marca sobe uma faixa a cada cinco anos.'],
  },
]
