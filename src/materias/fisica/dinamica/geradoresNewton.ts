import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { escolher, type Rng } from '@/lib/rng'
import { limpar, montar, type ItemBanco, type Opc } from '@/materias/biologia/comum/auxiliares'
import { blocosEmContato } from './newton'

const f2 = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
const mil = (n: number) => n.toLocaleString('pt-BR')

/* ======================================================================
   Qual lei de Newton?  (níveis 1 e 2: qual lei; nível 3: qual é o par)
   ====================================================================== */

export type Lei = 1 | 2 | 3

export interface ItemLei {
  situacao: string
  /** pergunta própria; se faltar, pergunta qual lei explica a situação */
  pergunta?: string
  lei: Lei
  certo: string
  /** por que as outras duas leis não são a resposta */
  nao: Partial<Record<Lei, string>>
}

export const TEXTO_LEI: Record<Lei | 0, string> = {
  1: '1ª lei: inércia',
  2: '2ª lei: F_res = m·a',
  3: '3ª lei: ação e reação',
  0: 'Nenhuma: é a “força do movimento”',
}

const MOTIVO_LEI: Record<Lei | 0, string> = {
  1: 'confundiu com a inércia (1ª lei)',
  2: 'confundiu com a 2ª lei',
  3: 'viu um par de ação e reação onde ele não é o ponto',
  0: 'acreditou numa “força do movimento”',
}

const FORCA_DO_MOVIMENTO = 'Não existe “força do movimento”: um corpo não carrega força consigo. Toda força é feita por outro corpo (a Terra, o chão, uma corda, o ar...), e sem resultante a velocidade simplesmente se mantém.'

export const LEIS_N1: ItemLei[] = [
  {
    situacao: 'Um ônibus freia de repente e os passageiros em pé são “jogados” para a frente.',
    lei: 1,
    certo: 'Nenhuma força empurra os passageiros para a frente: eles apenas tendem a manter a velocidade que tinham, enquanto o ônibus, freado, perde a sua. É a inércia.',
    nao: {
      2: 'A 2ª lei liga uma força resultante a uma aceleração. Aqui o que chama a atenção é justamente a falta de força sobre o passageiro para a frente: ele só mantém a velocidade.',
      3: 'Não há um par de forças entre dois corpos no centro da história. Nada empurra o passageiro para a frente; ele continua em movimento por inércia.',
    },
  },
  {
    situacao: 'Para sair rápido da borda, o nadador empurra a parede da piscina com os pés, para trás.',
    lei: 3,
    certo: 'Os pés empurram a parede para trás e a parede empurra o nadador para a frente, com força de mesmo módulo. É essa reação da parede que o lança.',
    nao: {
      1: 'A inércia explicaria o nadador manter a velocidade sem força. Aqui ele ganha velocidade, e quem faz a força que o impulsiona é a parede.',
      2: 'A 2ª lei diz quanto ele acelera, mas não explica de onde vem a força. A pergunta é por que empurrar a parede para trás o leva para a frente: ação e reação.',
    },
  },
  {
    situacao: 'Com o mesmo empurrão, um carrinho de supermercado vazio ganha velocidade mais depressa que um carrinho cheio.',
    lei: 2,
    certo: 'Mesma força, massas diferentes: a = F/m. O carrinho vazio, com menos massa, tem aceleração maior.',
    nao: {
      1: 'A inércia trata de corpos sem resultante. Aqui há força e aceleração, e quem compara as duas (com a massa no meio) é a 2ª lei.',
      3: 'O carrinho empurra a mão de volta, sim, mas isso não explica a diferença de aceleração. Quem relaciona força, massa e aceleração é a 2ª lei.',
    },
  },
  {
    situacao: 'Longe de qualquer planeta, uma sonda espacial desliga os motores e segue em linha reta, com velocidade constante, por anos.',
    lei: 1,
    certo: 'Sem força resultante, a velocidade não muda: a sonda não precisa de motor para continuar andando, só para mudar a velocidade.',
    nao: {
      2: 'Sem força resultante não há aceleração para calcular. Seguir em linha reta com velocidade constante sem precisar de força é exatamente o que diz a 1ª lei.',
      3: 'Com os motores desligados, a sonda não troca forças com os gases nem com outro corpo próximo. Ela só mantém a velocidade.',
    },
  },
  {
    situacao: 'Ao disparar, a espingarda dá um “coice” para trás no ombro de quem atira.',
    lei: 3,
    certo: 'A espingarda empurra o projétil e os gases para a frente; eles empurram a espingarda para trás, com força de mesmo módulo. O coice é essa reação.',
    nao: {
      1: 'A arma estava parada e passou a se mover para trás: recebeu uma força. Inércia é o contrário, manter a velocidade quando não há resultante.',
      2: 'A 2ª lei explica por que a arma, muito mais pesada, recua mais devagar que o projétil. Mas a origem da força para trás é o par ação e reação.',
    },
  },
  {
    situacao: 'Um carro de 1 000 kg aumenta a velocidade em 2 m/s a cada segundo porque a força resultante sobre ele é de 2 000 N.',
    lei: 2,
    certo: 'É a conta da 2ª lei: F_res = m·a, ou 2 000 N = 1 000 kg · 2 m/s².',
    nao: {
      1: 'A 1ª lei trata de resultante zero. Aqui a resultante vale 2 000 N e o carro acelera.',
      3: 'A situação não fala de um par de forças entre dois corpos, e sim de uma resultante e da aceleração que ela produz.',
    },
  },
  {
    situacao: 'Num truque, a toalha é puxada bem depressa e os pratos ficam praticamente parados sobre a mesa.',
    lei: 1,
    certo: 'O puxão é rápido e o atrito age sobre os pratos por pouquíssimo tempo: eles quase não ganham velocidade e, por inércia, ficam onde estavam.',
    nao: {
      2: 'O atrito da toalha até dá aos pratos uma pequena aceleração, mas o que a situação mostra é a tendência deles de continuar em repouso: a inércia.',
      3: 'A toalha e os pratos trocam forças de atrito, mas o par não explica por que os pratos ficam. O que explica é a tendência de manter o repouso.',
    },
  },
]

export const LEIS_N2: ItemLei[] = [
  {
    situacao: 'No espaço, onde não há ar, um foguete expele gases para baixo e sobe.',
    lei: 3,
    certo: 'O foguete empurra os gases para baixo e os gases empurram o foguete para cima. Não precisa de ar: o par de forças é entre o foguete e os próprios gases.',
    nao: {
      1: 'O foguete ganha velocidade, então há força sobre ele. A inércia sozinha não faz nada acelerar.',
      2: 'A 2ª lei diz quanto o foguete acelera, mas a questão é de onde vem a força sem ar para se apoiar: dos gases, pela 3ª lei.',
    },
  },
  {
    situacao: 'Num choque entre um caminhão e um carro, os dois recebem forças de mesmo módulo, mas o carro sofre uma variação de velocidade muito maior.',
    pergunta: 'Que lei de Newton explica essa diferença entre os dois veículos?',
    lei: 2,
    certo: 'Forças iguais, massas diferentes: a = F/m. O carro, de massa menor, sofre uma aceleração (e uma variação de velocidade) muito maior.',
    nao: {
      3: 'A 3ª lei garante que as forças têm o mesmo módulo, o que o enunciado já deu. A diferença no efeito vem das massas, e isso é a 2ª lei.',
      1: 'Os dois veículos mudam de velocidade, então há resultante sobre cada um. A inércia não explica por que um muda mais que o outro; a = F/m explica.',
    },
  },
  {
    situacao: 'Um paraquedista, com o paraquedas aberto, desce com velocidade constante.',
    pergunta: 'Que lei de Newton garante que a resistência do ar tem o mesmo valor do peso dele?',
    lei: 1,
    certo: 'Velocidade constante significa resultante nula (1ª lei). Então a resistência do ar equilibra exatamente o peso.',
    nao: {
      3: 'Peso e resistência do ar atuam no mesmo corpo, o paraquedista; não são par de ação e reação. A reação ao peso é a força que o paraquedista faz na Terra.',
      2: 'Com velocidade constante não há aceleração. O que garante o equilíbrio das forças nesse caso é a 1ª lei: resultante nula, velocidade constante.',
    },
  },
  {
    situacao: 'Ao caminhar, a pessoa empurra o chão para trás com o pé e é empurrada para a frente.',
    lei: 3,
    certo: 'O pé empurra o chão para trás (pelo atrito) e o chão empurra o pé para a frente, com o mesmo módulo. É a força do chão que faz a pessoa andar.',
    nao: {
      1: 'A pessoa sai do repouso: há uma força sobre ela, a do chão. Inércia seria continuar parada.',
      2: 'A 2ª lei diz quanto ela acelera, mas não quem faz a força. Quem empurra a pessoa para a frente é o chão, em reação ao empurrão do pé.',
    },
  },
  {
    situacao: 'Uma moeda está sobre um cartão apoiado na boca de um copo. Um peteleco rápido faz o cartão voar, e a moeda cai dentro do copo.',
    lei: 1,
    certo: 'O cartão sai depressa e quase não arrasta a moeda, que por inércia fica no lugar; sem apoio, ela cai no copo.',
    nao: {
      2: 'O peso faz a moeda cair depois, mas o que a situação mostra é a moeda ficando onde estava enquanto o cartão sai: inércia.',
      3: 'O peteleco é no cartão, não na moeda. O par dedo-cartão não explica por que a moeda fica.',
    },
  },
  {
    situacao: 'Num elevador que sobe acelerando, a balança sob o passageiro marca mais que o peso dele.',
    lei: 2,
    certo: 'Para o passageiro acelerar para cima, a resultante precisa apontar para cima: N − P = m·a, então N > P. A balança mede N.',
    nao: {
      3: 'A balança empurra o passageiro e ele empurra a balança (um par), mas o par não explica por que N passou do peso. Quem explica é N − P = m·a.',
      1: 'O passageiro está acelerando, então a resultante não é zero. A 1ª lei valeria se o elevador subisse com velocidade constante (aí a balança marcaria o peso).',
    },
  },
  {
    situacao: 'Um astronauta, flutuando fora da nave, arremessa uma ferramenta para longe e passa a se mover no sentido oposto.',
    lei: 3,
    certo: 'Ele empurra a ferramenta para a frente e a ferramenta o empurra para trás, com força de mesmo módulo. Por isso ele recua.',
    nao: {
      1: 'Ele estava parado e passou a se mover: recebeu uma força, a da ferramenta. Inércia seria continuar parado.',
      2: 'A 2ª lei explica por que ele, mais pesado, recua mais devagar que a ferramenta. Mas a força que o faz recuar existe por causa da 3ª lei.',
    },
  },
]

export type Sentido = 'cima' | 'baixo' | 'esq' | 'dir'

/** Item do nível 3: dada uma força (a ação), qual é o par dela? */
export interface ItemPar extends ItemBanco {
  agente: string
  alvo: string
  /** sentido da ação sobre o alvo (a reação, sobre o agente, é o oposto) */
  sentido: Sentido
  /** como os dois corpos aparecem no desenho */
  layout: 'h' | 'agente-abaixo' | 'agente-acima'
}

const DICAS_PAR = [
  'Ação e reação são as duas pontas de uma mesma interação entre dois corpos: se A age em B, a reação é B agindo em A.',
  'O par nunca atua no mesmo corpo. Duas forças que se equilibram num corpo só não são ação e reação.',
  'As duas forças do par têm o mesmo módulo e sentidos opostos, qualquer que seja a massa de cada corpo.',
]
const LICAO_PAR = 'a reação a “A age em B” é sempre “B age em A”: mesmo módulo, sentido oposto, corpo diferente'

const par = (p: Omit<ItemPar, 'dicas' | 'licao'>): ItemPar => ({ ...p, dicas: DICAS_PAR, licao: LICAO_PAR })

export const PARES: ItemPar[] = [
  par({
    pergunta: 'A Terra puxa um livro para baixo (é o peso do livro). Qual é a reação a essa força?',
    agente: 'Terra',
    alvo: 'livro',
    sentido: 'baixo',
    layout: 'agente-abaixo',
    certa: { texto: 'O livro puxa a Terra para cima, com a mesma intensidade', porque: 'O par do peso é entre o livro e a Terra: se a Terra puxa o livro, o livro puxa a Terra. Mesmo módulo, sentidos opostos, corpos diferentes.' },
    erradas: [
      { texto: 'A mesa empurra o livro para cima (a normal)', porque: 'A normal e o peso atuam no mesmo corpo, o livro. Eles se equilibram porque o livro está parado (1ª lei), mas ação e reação nunca atuam no mesmo corpo.', motivo: 'confundiu equilíbrio com ação e reação' },
      { texto: 'O livro empurra a mesa para baixo', porque: 'Essa força existe, mas é o par da normal (interação livro–mesa). O par do peso envolve os mesmos dois corpos do peso: o livro e a Terra.', motivo: 'trocou os corpos do par' },
      { texto: 'Nenhuma: força a distância não tem reação', porque: 'A 3ª lei vale também para forças a distância. A Terra atrai o livro e o livro atrai a Terra, mesmo sem contato.', motivo: 'achou que força a distância não tem par' },
    ],
  }),
  par({
    pergunta: 'Um livro está em repouso sobre uma mesa, e a mesa o empurra para cima (a normal). Qual é a reação a essa força?',
    agente: 'mesa',
    alvo: 'livro',
    sentido: 'cima',
    layout: 'agente-abaixo',
    certa: { texto: 'O livro empurra a mesa para baixo', porque: 'O par da normal é entre o livro e a mesa: a mesa empurra o livro para cima e o livro empurra a mesa para baixo, com o mesmo módulo.' },
    erradas: [
      { texto: 'O peso do livro', porque: 'O peso atua no mesmo corpo que a normal, o livro. Os dois se equilibram, mas não formam par: o peso é uma interação entre o livro e a Terra.', motivo: 'confundiu equilíbrio com ação e reação' },
      { texto: 'O livro puxa a Terra para cima', porque: 'Esse é o par do peso (interação livro–Terra). O par da normal envolve os corpos que se tocam: livro e mesa.', motivo: 'trocou os corpos do par' },
      { texto: 'O chão empurra a mesa para cima', porque: 'Essa força atua na mesa, mas quem a faz é o chão: outra interação. A reação procurada é feita pelo livro sobre a mesa.', motivo: 'trocou os corpos do par' },
    ],
  }),
  par({
    pergunta: 'Na largada, o pé de um corredor empurra o chão para trás. Qual é a reação a essa força?',
    agente: 'corredor',
    alvo: 'chão',
    sentido: 'esq',
    layout: 'agente-acima',
    certa: { texto: 'O chão empurra o pé do corredor para a frente', porque: 'O pé empurra o chão para trás e o chão empurra o pé para a frente (pelo atrito), com o mesmo módulo. É essa reação que acelera o corredor.' },
    erradas: [
      { texto: 'O ar empurra o corredor para trás', porque: 'A resistência do ar é uma interação entre o corredor e o ar, outro par de corpos. O par da força do pé no chão é a força do chão no pé.', motivo: 'trocou os corpos do par' },
      { texto: 'O chão empurra o pé para trás, junto com ele', porque: 'Ação e reação têm sentidos opostos. Se o pé empurra o chão para trás, o chão empurra o pé para a frente.', motivo: 'esqueceu que o par tem sentidos opostos' },
      { texto: 'O peso do corredor', porque: 'O peso é a Terra puxando o corredor para baixo: outra interação, e vertical. O par do empurrão no chão é horizontal e feito pelo chão.', motivo: 'escolheu uma força de outra interação' },
    ],
  }),
  par({
    pergunta: 'A Terra atrai a Lua. Qual é a reação a essa força?',
    agente: 'Terra',
    alvo: 'Lua',
    sentido: 'esq',
    layout: 'h',
    certa: { texto: 'A Lua atrai a Terra com força de mesmo módulo', porque: 'A gravitação também obedece à 3ª lei: a Lua puxa a Terra com a mesma intensidade com que é puxada. O efeito na Terra é menor porque a massa dela é muito maior.' },
    erradas: [
      { texto: 'A Lua atrai a Terra com força menor, porque tem menos massa', porque: 'As forças do par têm sempre o mesmo módulo. O que muda com a massa é o efeito: a aceleração da Terra é muito menor (a = F/m).', motivo: 'achou que o corpo menor faz força menor' },
      { texto: 'O Sol atrai a Lua', porque: 'Essa é uma interação entre o Sol e a Lua, outro par de corpos. O par da força da Terra na Lua é a força da Lua na Terra.', motivo: 'trocou os corpos do par' },
      { texto: 'A força centrífuga empurra a Lua para fora', porque: 'Nenhum corpo faz uma “força centrífuga” sobre a Lua; vista de fora, ela só recebe a atração da Terra (e do Sol). A reação procurada é feita pela Lua sobre a Terra.', motivo: 'usou uma força sem agente' },
    ],
  }),
  par({
    pergunta: 'Durante uma batida, um caminhão empurra um carro. Qual é a reação a essa força?',
    agente: 'caminhão',
    alvo: 'carro',
    sentido: 'dir',
    layout: 'h',
    certa: { texto: 'O carro empurra o caminhão com força de mesmo módulo, em sentido oposto', porque: 'Na batida, cada veículo empurra o outro com a mesma intensidade. O carro sofre mais porque tem menos massa: a mesma força dá a ele uma aceleração maior.' },
    erradas: [
      { texto: 'O carro empurra o caminhão com força menor, porque é mais leve', porque: 'O módulo das forças do par é sempre igual, qualquer que seja a massa. O que é diferente é a aceleração de cada veículo.', motivo: 'achou que o corpo menor faz força menor' },
      { texto: 'O atrito do asfalto sobre o carro', porque: 'O atrito é uma interação entre o carro e o asfalto, outro par de corpos.', motivo: 'trocou os corpos do par' },
      { texto: 'Nenhuma: só o carro recebe força, porque amassa mais', porque: 'Os dois recebem forças de mesmo módulo. O carro amassa mais por ser menos resistente e acelera mais por ter menos massa.', motivo: 'achou que só um dos corpos recebe força' },
    ],
  }),
  par({
    pergunta: 'Um foguete empurra os gases da combustão para baixo. Qual é a reação a essa força?',
    agente: 'foguete',
    alvo: 'gases',
    sentido: 'baixo',
    layout: 'agente-acima',
    certa: { texto: 'Os gases empurram o foguete para cima', porque: 'O foguete expulsa os gases para baixo e os gases empurram o foguete para cima, com o mesmo módulo. Por isso ele funciona até no vácuo.' },
    erradas: [
      { texto: 'O ar empurra o foguete para cima', porque: 'O foguete não precisa de ar: no espaço não há ar e ele funciona. O par é entre o foguete e os gases que ele expele.', motivo: 'achou que o foguete se apoia no ar' },
      { texto: 'O peso do foguete', porque: 'O peso é a interação entre o foguete e a Terra, outro par, e aponta para baixo.', motivo: 'escolheu uma força de outra interação' },
      { texto: 'Os gases empurram o chão da plataforma', porque: 'Essa força é entre os gases e o chão, outro par de corpos. A reação procurada é feita pelos gases sobre o foguete.', motivo: 'trocou os corpos do par' },
    ],
  }),
  par({
    pergunta: 'Um ímã atrai um prego de ferro. Qual é a reação a essa força?',
    agente: 'ímã',
    alvo: 'prego',
    sentido: 'esq',
    layout: 'h',
    certa: { texto: 'O prego atrai o ímã com a mesma intensidade', porque: 'A atração magnética também vem em par: o prego puxa o ímã tanto quanto é puxado. Se o prego estivesse preso e o ímã solto, seria o ímã que se moveria.' },
    erradas: [
      { texto: 'O prego não faz força: ferro comum não é ímã', porque: 'Não importa se o prego é imantado: ele interage com o ímã, e toda interação tem par. O prego puxa o ímã com o mesmo módulo.', motivo: 'achou que o corpo “passivo” não faz força' },
      { texto: 'O prego atrai o ímã, mas com força menor', porque: 'As forças do par têm sempre o mesmo módulo; não existe lado mais forte numa interação.', motivo: 'achou que um lado do par é mais forte' },
      { texto: 'O peso do prego', porque: 'O peso é a interação entre o prego e a Terra. A reação à força do ímã é a força do prego sobre o ímã.', motivo: 'escolheu uma força de outra interação' },
    ],
  }),
]

export type DadosLeis = { tipo: 'lei'; leiDe: Record<string, Lei | 0> } | { tipo: 'par'; agente: string; alvo: string; sentido: Sentido; layout: ItemPar['layout'] }

const DICAS_LEI = [
  '1ª lei: sem força resultante, a velocidade não muda (o corpo fica parado ou segue em linha reta com velocidade constante).',
  '2ª lei: uma força resultante produz aceleração, e a = F_res/m (mais massa, menos aceleração).',
  '3ª lei: quando A empurra B, B empurra A com força de mesmo módulo e sentido oposto, em corpos diferentes.',
]

function perguntaLei(item: ItemLei, rng: Rng): InstanciaMulti<DadosLeis> {
  const certa: Opc = { texto: TEXTO_LEI[item.lei], porque: item.certo }
  const erradas: Opc[] = ([1, 2, 3] as Lei[])
    .filter((l) => l !== item.lei)
    .map((l) => ({ texto: TEXTO_LEI[l], porque: item.nao[l] as string, motivo: MOTIVO_LEI[l] }))
  erradas.push({ texto: TEXTO_LEI[0], porque: FORCA_DO_MOVIMENTO, motivo: MOTIVO_LEI[0] })
  const inst = montar<DadosLeis>(rng, certa, erradas, {
    enunciado: `${item.situacao} ${item.pergunta ?? 'Qual lei de Newton explica melhor essa situação?'}`,
    resolucao: item.certo,
    dicas: DICAS_LEI,
    licao: item.lei === 1 ? 'sem resultante, a velocidade se mantém: inércia (1ª lei)' : item.lei === 2 ? 'força resultante e massa decidem a aceleração: a = F_res/m (2ª lei)' : 'toda força tem um par, feito pelo outro corpo, de mesmo módulo e sentido oposto (3ª lei)',
  })
  const leiDe: Record<string, Lei | 0> = {}
  for (const o of inst.opcoes) leiDe[o.id] = ([0, 1, 2, 3] as const).find((l) => TEXTO_LEI[l] === o.rotulo) ?? 0
  return { ...inst, dados: { tipo: 'lei', leiDe } }
}

function perguntaPar(item: ItemPar, rng: Rng): InstanciaMulti<DadosLeis> {
  return montar<DadosLeis>(rng, item.certa, item.erradas, {
    enunciado: item.pergunta,
    resolucao: `${item.certa.porque} Na figura: a ação é ${item.agente} → ${item.alvo}; a reação é ${item.alvo} → ${item.agente}.`,
    dicas: item.dicas,
    licao: item.licao,
    dados: { tipo: 'par', agente: item.agente, alvo: item.alvo, sentido: item.sentido, layout: item.layout },
  })
}

export function gerarLeis(rng: Rng, nivel: Nivel): InstanciaMulti<DadosLeis> {
  if (nivel === 1) return perguntaLei(escolher(rng, LEIS_N1), rng)
  if (nivel === 2) return perguntaLei(escolher(rng, LEIS_N2), rng)
  return perguntaPar(escolher(rng, PARES), rng)
}

/* ======================================================================
   Ação e reação (resposta numérica)
   ====================================================================== */

export type DadosAcao =
  | { tipo: 'patinadores'; mA: number; mB: number; aA: number }
  | { tipo: 'colisao'; mCarro: number; mCaminhao: number; aCarro: number }
  | { tipo: 'blocos'; massas: number[]; F: number; /** índice do encontro perguntado (0: entre o 1º e o 2º) */ encontro: number; /** quem age sobre quem, como no enunciado */ de: number; sobre: number }

const NOMES = ['A', 'B', 'C']
const bonito = (x: number) => Math.abs(x * 10 - Math.round(x * 10)) < 1e-9

interface CandIgual {
  m1: number
  m2: number
  a1: number
}

function candidatosIguais(m1s: number[], m2s: number[], a1s: number[]): CandIgual[] {
  const lista: CandIgual[] = []
  for (const m1 of m1s)
    for (const m2 of m2s)
      for (const a1 of a1s) {
        if (m1 === m2) continue
        const a2 = (m1 * a1) / m2
        const inv = (m2 * a1) / m1
        if (bonito(a2) && a2 >= 0.2 && Math.abs(a2 - a1) > 0.1 && Math.abs(inv - a2) > 0.1) lista.push({ m1, m2, a1 })
      }
  return lista
}

const CAND_PATINS = candidatosIguais([40, 45, 50, 55, 60], [60, 70, 75, 80, 90, 100], [1, 1.5, 2, 2.5, 3, 4])
const CAND_BATIDA = candidatosIguais([800, 1000, 1200, 1500], [4000, 5000, 6000, 8000, 10000], [20, 30, 40, 50, 60])

function acaoIguais(rng: Rng): InstanciaNum<DadosAcao> {
  const colisao = rng() < 0.5
  const { m1, m2, a1 } = escolher(rng, colisao ? CAND_BATIDA : CAND_PATINS)
  const a2 = (m1 * a1) / m2
  const F = m1 * a1
  const erros: ErroTipico[] = [
    { valor: a1, frase: `As forças são iguais, mas as acelerações não: ${colisao ? 'o caminhão tem mais massa e acelera menos' : 'quem tem mais massa acelera menos'}. A mesma força F = ${mil(F)} N dividida por ${mil(m2)} kg dá outro valor.`, motivo: 'achou que as acelerações são iguais' },
    { valor: (m2 * a1) / m1, frase: `Você inverteu a razão das massas. Como F = m·a é igual para os dois, a aceleração de ${colisao ? 'quem tem massa maior' : 'quem é mais pesado'} é menor: a₂ = m₁·a₁/m₂.`, motivo: 'inverteu a razão das massas' },
    { valor: F, frase: `${mil(F)} N é o módulo da força que cada um recebe (m₁·a₁), e não a aceleração. Falta dividir pela massa: a₂ = F/m₂.`, motivo: 'respondeu a força, não a aceleração' },
  ]
  const enunciado = colisao
    ? `Numa colisão frontal, um carro de ${mil(m1)} kg e um caminhão de ${mil(m2)} kg se empurram durante o choque. A desaceleração média do carro é de ${mil(a1)} m/s². Qual é o módulo da desaceleração média do caminhão nesse intervalo? Considere só a força que um faz no outro.`
    : `Dois patinadores, parados no gelo, empurram-se com as mãos. A patinadora, de ${m1} kg, recua com aceleração de ${f2(a1)} m/s². O patinador tem ${m2} kg. Qual é o módulo da aceleração dele durante o empurrão? Despreze o atrito com o gelo.`
  return {
    enunciado,
    resposta: a2,
    tolerancia: colisao ? 0.05 : 0.01,
    unidade: 'm/s²',
    erros: limpar(erros, a2, colisao ? 0.05 : 0.01),
    resolucao: `Pela 3ª lei, os dois recebem forças de mesmo módulo. Pela 2ª lei, essa força vale F = m₁·a₁ = ${mil(m1)}·${f2(a1)} = ${mil(F)} N. Então a₂ = F/m₂ = ${mil(F)}/${mil(m2)} = ${f2(a2)} m/s². Atalho: m₁·a₁ = m₂·a₂.`,
    dicas: ['Ação e reação: a força que cada um recebe tem o mesmo módulo.', 'Calcule essa força com quem você conhece: F = m₁·a₁.', 'Divida pela outra massa: a₂ = F/m₂.'],
    licao: 'forças do par são iguais; as acelerações ficam na razão inversa das massas (m₁·a₁ = m₂·a₂)',
    dados: colisao ? { tipo: 'colisao', mCarro: m1, mCaminhao: m2, aCarro: a1 } : { tipo: 'patinadores', mA: m1, mB: m2, aA: a1 },
  }
}

interface CandBlocos {
  massas: number[]
  F: number
}

function candidatosBlocos(n: number): CandBlocos[] {
  const lista: CandBlocos[] = []
  const ms = [1, 2, 3, 4, 5, 6, 8, 10]
  const Fs = [12, 18, 20, 24, 30, 36, 40, 45, 48, 60, 72, 90]
  const combos: number[][] = n === 2 ? ms.flatMap((a) => ms.map((b) => [a, b])) : ms.flatMap((a) => ms.flatMap((b) => ms.map((c) => [a, b, c])))
  for (const massas of combos) {
    if (new Set(massas).size !== massas.length) continue
    if (massas.reduce((s, m) => s + m, 0) > 16) continue
    for (const F of Fs) {
      const { a, contatos } = blocosEmContato(F, massas)
      if (bonito(a) && contatos.every(bonito)) lista.push({ massas, F })
    }
  }
  return lista
}

const CAND_DOIS = candidatosBlocos(2)
const CAND_TRES = candidatosBlocos(3)

function acaoBlocos(rng: Rng, n: 2 | 3): InstanciaNum<DadosAcao> {
  const { massas, F } = escolher(rng, n === 2 ? CAND_DOIS : CAND_TRES)
  const { a, total, contatos } = blocosEmContato(F, massas)
  const encontro = n === 2 ? 0 : rng() < 0.5 ? 0 : 1
  const inverte = rng() < 0.5
  const [de, sobre] = inverte ? [encontro + 1, encontro] : [encontro, encontro + 1]
  const resposta = contatos[encontro] as number
  const nomes = massas.map((m, i) => `${NOMES[i]} (${m} kg)`)
  const depois = massas.slice(encontro + 1)
  const somaDepois = depois.reduce((s, m) => s + m, 0)
  const erros: ErroTipico[] = [
    { valor: F, frase: `A força de ${F} N empurra só o bloco A. O que ${NOMES[encontro]} passa adiante é menos que isso: só o necessário para acelerar o que vem depois dele (${somaDepois} kg).`, motivo: 'achou que a força passa inteira' },
    { valor: F / n, frase: `A força não se divide em partes iguais: cada contato precisa acelerar a massa que está à frente dele, ${somaDepois} kg de ${total} kg.`, motivo: 'dividiu a força em partes iguais' },
    { valor: a, frase: `${f2(a)} m/s² é a aceleração do conjunto. A força de contato é essa aceleração vezes a massa que o contato empurra: ${somaDepois} kg.`, motivo: 'respondeu a aceleração, não a força' },
    { valor: a * (total - somaDepois), frase: `Você multiplicou a aceleração pela massa que fica atrás do contato. A força de contato acelera o que está à frente dele: ${somaDepois} kg.`, motivo: 'usou a massa do lado errado do contato' },
  ]
  if (n === 3) {
    const outro = contatos[1 - encontro] as number
    erros.push({ valor: outro, frase: `Esse é o contato entre ${encontro === 0 ? 'B e C' : 'A e B'}. A pergunta é sobre o encontro de ${NOMES[encontro]} com ${NOMES[encontro + 1]}.`, motivo: 'pegou o contato errado' })
    if (encontro === 0) erros.push({ valor: a * (massas[1] as number), frase: `O bloco B, ao ser empurrado por A, precisa acelerar ele mesmo e ainda empurrar C. A massa que o contato A–B acelera é ${massas[1]} + ${massas[2]} = ${somaDepois} kg.`, motivo: 'esqueceu os blocos mais à frente' })
  }
  const pedido = `${NOMES[de]} exerce sobre ${NOMES[sobre]}`
  return {
    enunciado: `${n === 2 ? 'Dois' : 'Três'} blocos estão encostados, em fila, sobre uma mesa horizontal sem atrito: ${nomes.join(', ')}. Uma força horizontal de ${F} N empurra o bloco A, e o conjunto acelera. Qual é o módulo da força que ${pedido}?`,
    resposta,
    tolerancia: 0.05,
    unidade: 'N',
    erros: limpar(erros, resposta, 0.05),
    resolucao: `Todos aceleram juntos: a = F/(soma das massas) = ${F}/${total} = ${f2(a)} m/s². A força no contato entre ${NOMES[encontro]} e ${NOMES[encontro + 1]} é a que acelera tudo o que está à frente dele (${somaDepois} kg): ${f2(a)}·${somaDepois} = ${f2(resposta)} N.${inverte ? ` Pela 3ª lei, ${NOMES[de]} empurra ${NOMES[sobre]} com esse mesmo módulo, só que no sentido oposto.` : ''}`,
    dicas: ['Primeiro ache a aceleração do conjunto: a = F/(soma das massas).', 'Isole o que está à frente do contato: a força de contato é a única força horizontal que acelera essa parte.', 'Pela 3ª lei, “X sobre Y” e “Y sobre X” têm o mesmo módulo.'],
    licao: 'a força de contato acelera só o que está à frente dela: F_contato = a · (massa à frente)',
    dados: { tipo: 'blocos', massas, F, encontro, de, sobre },
  }
}

export function gerarAcao(rng: Rng, nivel: Nivel): InstanciaNum<DadosAcao> {
  if (nivel === 1) return acaoIguais(rng)
  return acaoBlocos(rng, nivel === 2 ? 2 : 3)
}
