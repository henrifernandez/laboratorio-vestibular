import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type ItemBanco, type Opc } from '../comum/auxiliares'
import { MASSA_MOLAR, atividadeEnzima, fermentacao, fotossinteseBruta, fotossinteseLiquida, pontoDeCompensacao, respiracaoAerobica } from './calculo'
import { doBanco } from './geradores'

const mols = (n: number) => `${fn(n, 0)} mol${n === 1 ? '' : 's'}`
const arred = (x: number) => Math.round(x * 1000) / 1000
const EQUACOES = 'Respiração aeróbica: C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O. Fotossíntese: 6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂. Massas molares (g/mol): glicose 180, CO₂ 44, O₂ 32, H₂O 18.'

/* ================================================================== energia: estequiometria e curva de luz */

export interface DadosLuz {
  tipo: 'luz'
  pmax: number
  k: number
  r: number
  /** luz destacada no gráfico, se houver */
  luz?: number
}

export type DadosEnergia = { tipo: 'mols' | 'massa' } | DadosLuz

/** Parâmetros da curva de luz com resultados inteiros: Ic = R · j, K = (Pmax − R) · j. */
export function parametrosLuz(rng: Rng): { pmax: number; k: number; r: number; ic: number } {
  const r = escolher(rng, [4, 5, 6, 8])
  // Pmax > 2R: com Pmax = 2R, K e Ic coincidem e os erros típicos colapsam na resposta
  const pmax = escolher(rng, [16, 20, 24, 32, 40].filter((p) => p > 2 * r))
  const j = escolher(rng, [2, 4, 5, 10])
  return { pmax, r, k: (pmax - r) * j, ic: r * j }
}

export function gerarEnergia(rng: Rng, nivel: Nivel): InstanciaNum<DadosEnergia> {
  if (nivel === 1) {
    const n = sortear(rng, 1, 8)
    const dicas = ['Escreva a equação balanceada do processo e compare os coeficientes.', 'Fermentação (por glicose): 2 ATP e 2 produtos finais (2 etanol + 2 CO₂, ou 2 lactato). Respiração (por glicose): 6 O₂ consumidos, 6 CO₂ e 6 H₂O formados.', 'Multiplique os coeficientes pelo número de mols de glicose.']
    const licao = 'Por mol de glicose: fermentação alcoólica → 2 etanol + 2 CO₂ + 2 ATP; fermentação lática → 2 lactato + 2 ATP; respiração aeróbica → 6 CO₂ + 6 H₂O consumindo 6 O₂.'
    const casos: { enunciado: string; resposta: number; erros: ErroTipico[]; resolucao: string }[] = [
      {
        enunciado: `Leveduras fermentam ${mols(n)} de glicose em ausência de oxigênio (fermentação alcoólica). Quantos mols de CO₂ são liberados?`,
        resposta: fermentacao('alcoolica', n).co2,
        erros: [
          { valor: 6 * n, frase: 'Você usou o coeficiente da respiração aeróbica (6 CO₂). Na fermentação alcoólica, cada glicose forma 2 CO₂ e 2 etanol.', motivo: 'aplicou a respiração à fermentação' },
          { valor: n, frase: 'Você contou 1 CO₂ por glicose. A fermentação alcoólica forma 2 CO₂ (e 2 etanol) por glicose.', motivo: 'contou 1 CO₂ por glicose' },
        ],
        resolucao: `C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂ + 2 ATP. Para ${mols(n)} de glicose: 2 × ${fn(n, 0)} = ${fn(fermentacao('alcoolica', n).co2, 0)} mols de CO₂.`,
      },
      {
        enunciado: `Em ${mols(n)} de glicose submetidos à fermentação alcoólica, quantos mols de etanol se formam?`,
        resposta: fermentacao('alcoolica', n).etanol,
        erros: [
          { valor: n, frase: 'Você contou 1 etanol por glicose. A fermentação alcoólica forma 2 etanol (e 2 CO₂) por glicose.', motivo: 'contou 1 etanol por glicose' },
          { valor: 6 * n, frase: 'Você usou o coeficiente 6 da respiração aeróbica. Na fermentação alcoólica, são 2 etanol por glicose.', motivo: 'aplicou a respiração à fermentação' },
        ],
        resolucao: `C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂ + 2 ATP. Para ${mols(n)} de glicose: 2 × ${fn(n, 0)} = ${fn(fermentacao('alcoolica', n).etanol, 0)} mols de etanol.`,
      },
      {
        enunciado: `Quantos mols de ATP resultam, ao todo, da fermentação lática de ${mols(n)} de glicose (considere o saldo da glicólise: ATP formado menos ATP gasto)?`,
        resposta: fermentacao('latica', n).atp,
        erros: [
          { valor: n, frase: 'Você contou 1 ATP por glicose. O saldo da glicólise é 2 ATP por glicose.', motivo: 'contou 1 ATP por glicose' },
          { valor: 4 * n, frase: 'Você contou os 4 ATP formados na glicólise sem descontar os 2 ATP gastos nas etapas iniciais. O saldo é 4 − 2 = 2 ATP por glicose.', motivo: 'não descontou o ATP gasto' },
        ],
        resolucao: `Na glicólise, formam-se 4 ATP e gastam-se 2: saldo de 2 ATP por glicose. Como a fermentação lática não rende mais ATP, ${mols(n)} de glicose rendem 2 × ${fn(n, 0)} = ${fn(fermentacao('latica', n).atp, 0)} mols de ATP.`,
      },
      {
        enunciado: `Quantos mols de O₂ são consumidos na respiração aeróbica completa de ${mols(n)} de glicose?`,
        resposta: respiracaoAerobica(n).o2,
        erros: [
          { valor: n, frase: 'Você contou 1 O₂ por glicose. Pela equação balanceada, são 6 O₂ por glicose.', motivo: 'esqueceu o coeficiente 6' },
          { valor: 2 * n, frase: 'Você usou o 2 da fermentação (2 etanol, 2 CO₂, 2 ATP). Na respiração aeróbica, o coeficiente do O₂ é 6.', motivo: 'aplicou a fermentação à respiração' },
        ],
        resolucao: `C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O. Para ${mols(n)} de glicose: 6 × ${fn(n, 0)} = ${fn(respiracaoAerobica(n).o2, 0)} mols de O₂.`,
      },
      {
        enunciado: `Quantos mols de água são formados na respiração aeróbica completa de ${mols(n)} de glicose?`,
        resposta: respiracaoAerobica(n).h2o,
        erros: [
          { valor: n, frase: 'Você contou 1 H₂O por glicose. Pela equação balanceada, são 6 H₂O por glicose.', motivo: 'esqueceu o coeficiente 6' },
          { valor: 2 * n, frase: 'Você usou o 2 da fermentação. A fermentação não forma água; na respiração aeróbica, são 6 H₂O por glicose.', motivo: 'aplicou a fermentação à respiração' },
        ],
        resolucao: `C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O. Para ${mols(n)} de glicose: 6 × ${fn(n, 0)} = ${fn(respiracaoAerobica(n).h2o, 0)} mols de H₂O.`,
      },
    ]
    const c = escolher(rng, casos)
    return {
      enunciado: c.enunciado,
      resposta: c.resposta,
      tolerancia: 0.0001,
      unidade: 'mol',
      erros: limpar(c.erros, c.resposta, 0.0001),
      resolucao: c.resolucao,
      dicas,
      licao,
      dados: { tipo: 'mols' },
    }
  }
  if (nivel === 2) {
    const variante = escolher(rng, ['co2-resp', 'o2-resp', 'glicose-foto', 'o2-foto'] as const)
    const { glicose, CO2, O2 } = MASSA_MOLAR
    const dicas = ['Converta a massa em mols dividindo pela massa molar.', 'Use os coeficientes da equação balanceada (6 : 1 entre CO₂ ou O₂ e glicose).', 'Converta de volta para gramas multiplicando pela massa molar da substância pedida.']
    const licao = 'Estequiometria: massa → mols (÷ massa molar) → proporção da equação (coeficientes) → massa (× massa molar). A glicose (180 g/mol) reage com 6 mols de O₂ e forma 6 mols de CO₂.'
    if (variante === 'co2-resp' || variante === 'o2-resp') {
      const g = escolher(rng, [90, 180, 270, 360, 540])
      const m = g / glicose
      const gas = variante === 'co2-resp' ? CO2 : O2
      const outro = variante === 'co2-resp' ? O2 : CO2
      const nome = variante === 'co2-resp' ? 'CO₂' : 'O₂'
      const nomeOutro = variante === 'co2-resp' ? 'O₂' : 'CO₂'
      const resposta = 6 * m * gas
      const erros = limpar(
        [
          { valor: arred(m * gas), frase: `Você esqueceu o coeficiente 6: ${fn(m, 2)} mol de glicose forma/consome 6 × ${fn(m, 2)} mols de ${nome}.`, motivo: 'esqueceu o coeficiente 6' },
          { valor: arred(6 * m * outro), frase: `Você usou a massa molar do ${nomeOutro} (${outro} g/mol) em vez da do ${nome} (${gas} g/mol).`, motivo: 'massa molar da substância errada' },
          { valor: g, frase: 'Você repetiu a massa de glicose. A massa do gás é diferente: use mols e a massa molar do gás.', motivo: 'repetiu a massa de glicose' },
        ],
        resposta,
        0.5,
      )
      return {
        enunciado: `${EQUACOES} Quantos gramas de ${nome} ${variante === 'co2-resp' ? 'são liberados' : 'são consumidos'} na respiração aeróbica completa de ${fn(g, 0)} g de glicose?`,
        resposta,
        tolerancia: 0.5,
        unidade: 'g',
        erros,
        resolucao: `${fn(g, 0)} g ÷ 180 g/mol = ${fn(m, 2)} mol de glicose. Proporção 1 : 6 → ${fn(6 * m, 2)} mol de ${nome}. Massa: ${fn(6 * m, 2)} × ${gas} = ${fn(resposta, 1)} g.`,
        dicas,
        licao,
        dados: { tipo: 'massa' },
      }
    }
    if (variante === 'glicose-foto') {
      const gco2 = escolher(rng, [132, 264, 396, 528])
      const mco2 = gco2 / CO2
      const resposta = (mco2 / 6) * glicose
      const erros = limpar(
        [
          { valor: arred((gco2 * glicose) / CO2), frase: `Você converteu ${fn(gco2, 0)} g de CO₂ em mols (${fn(mco2, 1)}) e multiplicou direto por 180, sem dividir por 6. Seis mols de CO₂ formam apenas 1 mol de glicose.`, motivo: 'esqueceu de dividir por 6' },
          { valor: gco2, frase: 'Você repetiu a massa de CO₂. A glicose tem outra massa molar e outra proporção na equação.', motivo: 'repetiu a massa de CO₂' },
          { valor: arred(gco2 / 6), frase: 'Você dividiu a massa de CO₂ por 6 sem converter em mols. Primeiro divida pela massa molar (44), depois por 6, depois multiplique por 180.', motivo: 'dividiu a massa por 6 sem converter em mols' },
        ],
        resposta,
        0.5,
      )
      return {
        enunciado: `${EQUACOES} Quantos gramas de glicose uma planta pode formar, no máximo, a partir de ${fn(gco2, 0)} g de CO₂ na fotossíntese?`,
        resposta,
        tolerancia: 0.5,
        unidade: 'g',
        erros,
        resolucao: `${fn(gco2, 0)} g ÷ 44 g/mol = ${fn(mco2, 1)} mol de CO₂. Proporção 6 : 1 → ${fn(mco2 / 6, 2)} mol de glicose. Massa: ${fn(mco2 / 6, 2)} × 180 = ${fn(resposta, 1)} g.`,
        dicas,
        licao,
        dados: { tipo: 'massa' },
      }
    }
    const gglic = escolher(rng, [90, 180, 360, 540])
    const mglic = gglic / glicose
    const resposta = 6 * mglic * O2
    const erros = limpar(
      [
        { valor: arred(mglic * O2), frase: `Você esqueceu o coeficiente 6: ${fn(mglic, 2)} mol de glicose forma 6 × ${fn(mglic, 2)} mols de O₂.`, motivo: 'esqueceu o coeficiente 6' },
        { valor: arred(6 * mglic * CO2), frase: 'Você usou a massa molar do CO₂ (44 g/mol) em vez da do O₂ (32 g/mol).', motivo: 'massa molar da substância errada' },
        { valor: gglic, frase: 'Você repetiu a massa de glicose. O O₂ liberado tem outra massa: use mols e a massa molar do O₂.', motivo: 'repetiu a massa de glicose' },
      ],
      resposta,
      0.5,
    )
    return {
      enunciado: `${EQUACOES} Quantos gramas de O₂ são liberados na fotossíntese quando se formam ${fn(gglic, 0)} g de glicose?`,
      resposta,
      tolerancia: 0.5,
      unidade: 'g',
      erros,
      resolucao: `${fn(gglic, 0)} g ÷ 180 g/mol = ${fn(mglic, 2)} mol de glicose. Proporção 1 : 6 → ${fn(6 * mglic, 2)} mol de O₂. Massa: ${fn(6 * mglic, 2)} × 32 = ${fn(resposta, 1)} g.`,
      dicas,
      licao,
      dados: { tipo: 'massa' },
    }
  }
  // nível 3: curva de luz
  const { pmax, k, r, ic } = parametrosLuz(rng)
  const cabeca = `A taxa de fotossíntese bruta de uma folha depende da luz segundo P(I) = Pmax · I ÷ (K + I). Para esta folha, Pmax = ${pmax}, K = ${k} e a taxa de respiração é R = ${r} (P e R em µmol de O₂ por m² por s; I e K em µmol de fótons por m² por s).`
  const dicas = ['O ponto de compensação é a luz em que a fotossíntese bruta iguala a respiração: P(I) = R.', 'Taxa líquida = fotossíntese bruta − respiração.', 'Substitua os valores em P(I) = Pmax · I ÷ (K + I) e resolva.']
  const licao = 'Ponto de compensação luminoso: a luz em que fotossíntese = respiração (saldo gasoso nulo). Abaixo dele a planta consome mais O₂ do que produz; acima, produz mais.'
  if (rng() < 0.5) {
    const erros = limpar(
      [
        { valor: k, frase: `${fn(k, 0)} é o valor de K (a luz em que a fotossíntese é metade de Pmax), não o ponto de compensação.`, motivo: 'confundiu com K' },
        { valor: arred((r * k) / pmax), frase: 'Você dividiu R · K por Pmax. Na equação P(I) = R, o denominador fica Pmax − R: Pmax · I = R · (K + I) ⇒ I = R · K ÷ (Pmax − R).', motivo: 'errou ao isolar I' },
        { valor: r, frase: `${fn(r, 0)} é a taxa de respiração, uma taxa de O₂; o ponto de compensação é uma intensidade de luz.`, motivo: 'confundiu taxa com intensidade de luz' },
        { valor: arred((k * (pmax - r)) / r), frase: 'Você inverteu a razão: de Pmax · I = R · (K + I) sai I = R · K ÷ (Pmax − R), e não K · (Pmax − R) ÷ R.', motivo: 'inverteu a razão ao isolar I' },
      ],
      ic,
      0.5,
    )
    return {
      enunciado: `${cabeca} Qual é o ponto de compensação luminoso, isto é, o valor de I em que a fotossíntese iguala a respiração?`,
      resposta: ic,
      tolerancia: 0.5,
      unidade: 'µmol de fótons/(m²·s)',
      erros,
      resolucao: `P(I) = R ⇒ ${pmax} · I ÷ (${k} + I) = ${r} ⇒ ${pmax} I = ${r} · ${k} + ${r} I ⇒ ${pmax - r} I = ${r * k} ⇒ I = ${fn(pontoDeCompensacao(pmax, k, r), 2)}.`,
      dicas,
      licao,
      dados: { tipo: 'luz', pmax, k, r },
    }
  }
  const luz = 3 * k
  const bruta = fotossinteseBruta(pmax, k, luz)
  const liquida = fotossinteseLiquida(pmax, k, r, luz)
  const erros = limpar(
    [
      { valor: bruta, frase: `${fn(bruta, 2)} é a fotossíntese BRUTA. A taxa líquida desconta a respiração: ${fn(bruta, 2)} − ${r}.`, motivo: 'não descontou a respiração' },
      { valor: pmax - r, frase: `Você usou Pmax (a fotossíntese em luz saturante) em vez de P(${luz}). Com I = ${luz}, a fotossíntese ainda não chegou ao máximo.`, motivo: 'supôs luz saturante' },
      { valor: bruta + r, frase: 'Você somou a respiração à fotossíntese. A taxa líquida é a fotossíntese menos a respiração.', motivo: 'somou em vez de subtrair' },
    ],
    liquida,
    0.05,
  )
  return {
    enunciado: `${cabeca} Qual é a taxa líquida de produção de O₂ da folha quando I = ${luz}?`,
    resposta: liquida,
    tolerancia: 0.05,
    unidade: 'µmol de O₂/(m²·s)',
    erros,
    resolucao: `P(${luz}) = ${pmax} · ${luz} ÷ (${k} + ${luz}) = ${fn(bruta, 2)}. Taxa líquida = ${fn(bruta, 2)} − ${r} = ${fn(liquida, 2)}.`,
    dicas,
    licao,
    dados: { tipo: 'luz', pmax, k, r, luz },
  }
}

/* ================================================================== metabolismo: conceitos, enzimas e compensação */

export const BANCO_METABOLISMO_1: ItemBanco[] = [
  {
    pergunta: 'Onde ocorre a glicólise em uma célula eucariótica?',
    certa: { texto: 'No citosol (citoplasma), com ou sem oxigênio', porque: 'A glicólise é a etapa inicial, comum à respiração e às fermentações, e ocorre no citosol; não depende diretamente do O₂.' },
    erradas: [
      { texto: 'Na matriz da mitocôndria', porque: 'Na matriz mitocondrial ocorre o ciclo de Krebs, que vem depois da glicólise na respiração aeróbica.', motivo: 'confundiu com o ciclo de Krebs' },
      { texto: 'Nas cristas mitocondriais', porque: 'Nas cristas (membrana interna) ocorrem a cadeia respiratória e a produção da maior parte do ATP, depois do ciclo de Krebs.', motivo: 'confundiu com a cadeia respiratória' },
      { texto: 'No estroma do cloroplasto', porque: 'O estroma é o local do ciclo de Calvin, na fotossíntese; a glicólise não ocorre ali.', motivo: 'confundiu com o ciclo de Calvin' },
    ],
    licao: 'Glicólise: citosol. Ciclo de Krebs: matriz mitocondrial. Cadeia respiratória: cristas mitocondriais. Fase clara: tilacoides. Ciclo de Calvin: estroma.',
    dicas: ['É a etapa comum à respiração e às fermentações.', 'As fermentações não ocorrem em mitocôndrias.', 'Pense: qual etapa não precisa de O₂ nem de organelas?'],
  },
  {
    pergunta: 'Onde ocorre a cadeia respiratória (transporte de elétrons), responsável pela maior parte do ATP, em uma célula eucariótica?',
    certa: { texto: 'Na membrana interna da mitocôndria (nas cristas)', porque: 'A cadeia respiratória e a fosforilação oxidativa ocorrem na membrana interna da mitocôndria, dobrada em cristas.' },
    erradas: [
      { texto: 'No citosol', porque: 'No citosol ocorre a glicólise, que rende só 2 ATP por glicose.', motivo: 'confundiu com a glicólise' },
      { texto: 'Na matriz mitocondrial', porque: 'Na matriz ocorre o ciclo de Krebs, que fornece os elétrons carregados por NADH e FADH₂ para a cadeia; a cadeia está na membrana interna.', motivo: 'confundiu com o ciclo de Krebs' },
      { texto: 'Nos tilacoides do cloroplasto', porque: 'Nos tilacoides há uma cadeia de transporte de elétrons da fotossíntese, mas a respiração ocorre na mitocôndria.', motivo: 'confundiu respiração com fotossíntese' },
    ],
    licao: 'Respiração: glicólise (citosol) → Krebs (matriz) → cadeia respiratória (cristas), que rende a maior parte do ATP e consome O₂.',
    dicas: ['O aceptor final de elétrons é o O₂.', 'Pense na organela com membrana interna dobrada.', 'A matriz é onde está o ciclo de Krebs.'],
  },
  {
    pergunta: 'Qual é a diferença entre a fermentação alcoólica e a fermentação lática?',
    certa: { texto: 'A alcoólica forma etanol e libera CO₂; a lática forma lactato e não libera CO₂', porque: 'Na alcoólica, o piruvato dá etanol e CO₂; na lática, dá lactato (ácido lático) sem liberar gás.' },
    erradas: [
      { texto: 'A lática libera CO₂ e a alcoólica não', porque: 'É o contrário: a alcoólica libera CO₂ (é ele que faz a massa de pão crescer); a lática não libera gás.', motivo: 'trocou os processos' },
      { texto: 'Só a alcoólica produz ATP', porque: 'As duas rendem o mesmo saldo da glicólise: 2 ATP por glicose.', motivo: 'achou que só uma produz ATP' },
      { texto: 'A lática exige O₂ e a alcoólica não', porque: 'As duas são anaeróbias: ocorrem sem O₂.', motivo: 'achou que a lática precisa de O₂' },
    ],
    licao: 'Fermentação alcoólica: etanol + CO₂ + 2 ATP (leveduras). Fermentação lática: lactato + 2 ATP, sem CO₂ (bactérias do iogurte, músculo em esforço). Ambas são anaeróbias.',
    dicas: ['Pense no pão e na cerveja: qual gás sai?', 'As fermentações são anaeróbias.', 'O saldo de ATP vem da glicólise nas duas.'],
  },
  {
    pergunta: 'Quais são os principais produtos da etapa fotoquímica (fase clara) da fotossíntese, e onde ela ocorre?',
    certa: { texto: 'ATP, NADPH e O₂, nos tilacoides do cloroplasto', porque: 'Na fase clara, a luz é absorvida pela clorofila, a água é quebrada (liberando O₂) e formam-se ATP e NADPH, nos tilacoides.' },
    erradas: [
      { texto: 'Glicose, no estroma', porque: 'A glicose é formada no ciclo de Calvin (fase química), no estroma, usando o ATP e o NADPH da fase clara.', motivo: 'confundiu com o ciclo de Calvin' },
      { texto: 'CO₂ e H₂O, nas mitocôndrias', porque: 'CO₂ e H₂O são produtos da respiração, que ocorre nas mitocôndrias; a fotossíntese consome esses dois.', motivo: 'confundiu com a respiração' },
      { texto: 'ATP e CO₂, no citosol', porque: 'A fase clara ocorre nos tilacoides, e não libera CO₂: o CO₂ é consumido no ciclo de Calvin.', motivo: 'local e produtos errados' },
    ],
    licao: 'Fase clara (tilacoides): luz → quebra da água, O₂, ATP e NADPH. Ciclo de Calvin (estroma): CO₂ + ATP + NADPH → glicose.',
    dicas: ['“Clara” indica que precisa de luz diretamente.', 'A glicose só é formada na etapa seguinte.', 'Os tilacoides são as membranas internas do cloroplasto.'],
  },
  {
    pergunta: 'De qual molécula vem o O₂ liberado na fotossíntese?',
    certa: { texto: 'Da água (H₂O), quebrada na fase clara', porque: 'Experimentos com isótopo ¹⁸O mostraram que o O₂ liberado vem da água, que é quebrada na fase clara (fotólise da água).' },
    erradas: [
      { texto: 'Do CO₂, decomposto no ciclo de Calvin', porque: 'O carbono do CO₂ vai para a glicose, e o oxigênio do CO₂ acaba na glicose e na água; o O₂ gasoso vem da água.', motivo: 'achou que o O₂ vem do CO₂' },
      { texto: 'Da glicose, que é oxidada', porque: 'A glicose é um produto da fotossíntese, e não uma fonte do O₂ liberado.', motivo: 'confundiu produto com fonte' },
      { texto: 'Do ATP', porque: 'O ATP é uma molécula de energia; ele não fornece o oxigênio que é liberado.', motivo: 'confundiu com o ATP' },
    ],
    licao: 'O O₂ da fotossíntese vem da água (fotólise, na fase clara). O carbono do CO₂ é fixado na glicose no ciclo de Calvin.',
    dicas: ['Qual reagente é “quebrado” pela luz?', 'Experimentos com ¹⁸O marcaram o oxigênio da água ou do CO₂ para descobrir isso.', 'A glicose é produto, não fonte.'],
  },
  {
    pergunta: 'Durante um exercício muito intenso, as células musculares passam a fazer fermentação lática. Por quê?',
    certa: { texto: 'O O₂ não chega na velocidade necessária, e a glicólise continua rendendo ATP sem O₂', porque: 'Quando a demanda de ATP supera o suprimento de O₂, o músculo mantém a glicólise e forma lactato para regenerar o NAD⁺: rende pouco ATP, mas rápido.' },
    erradas: [
      { texto: 'As células perderam as mitocôndrias', porque: 'As células musculares mantêm as mitocôndrias; é a falta de O₂ suficiente para a demanda que limita a respiração.', motivo: 'achou que as mitocôndrias somem' },
      { texto: 'A fermentação rende mais ATP do que a respiração', porque: 'A fermentação rende só 2 ATP por glicose, muito menos que a respiração aeróbica.', motivo: 'achou que fermenta mais ATP' },
      { texto: 'O músculo passa a fazer fotossíntese', porque: 'Células animais não têm cloroplastos nem fazem fotossíntese.', motivo: 'confundiu com fotossíntese' },
    ],
    licao: 'Sem O₂ suficiente, o músculo mantém a glicólise e fermenta o piruvato a lactato: ATP rápido, mas em pouca quantidade (2 por glicose).',
    dicas: ['Lembre quanto ATP rende cada processo.', 'A glicólise não depende do O₂.', 'Células animais não fazem fotossíntese.'],
  },
]

export const BANCO_METABOLISMO_3: ItemBanco[] = [
  {
    pergunta: 'Por que, em geral, plantas de sombra têm ponto de compensação luminoso menor do que plantas de sol?',
    certa: { texto: 'Respiram menos, e por isso a fotossíntese delas já compensa a respiração com pouca luz', porque: 'O ponto de compensação é a luz em que a fotossíntese iguala a respiração. Quanto menor a respiração, menos luz é necessária para igualá-la.' },
    erradas: [
      { texto: 'Porque não respiram', porque: 'Todas as plantas respiram, dia e noite; se não respirassem, não haveria ponto de compensação.', motivo: 'achou que plantas não respiram' },
      { texto: 'Porque a fotossíntese delas só ocorre no escuro', porque: 'A fotossíntese depende da luz; ela só ocorre quando há luz.', motivo: 'achou que fotossíntese ocorre no escuro' },
      { texto: 'Porque precisam de mais luz para a fotossíntese igualar a respiração', porque: 'Isso descreveria um ponto de compensação MAIOR, não menor.', motivo: 'inverteu a relação' },
    ],
    licao: 'Ponto de compensação = luz em que fotossíntese = respiração. Plantas de sombra respiram menos e têm ponto de compensação menor.',
    dicas: ['Igualar a respiração é mais fácil quando a respiração é menor.', 'Todas as plantas respiram sempre.', 'Menor ponto de compensação = precisa de menos luz.'],
  },
  {
    pergunta: 'Uma planta é mantida, por 12 horas, em um frasco fechado e totalmente escuro. O que acontece com o O₂ dentro do frasco?',
    certa: { texto: 'Diminui, porque só ocorre respiração (consumo de O₂), sem fotossíntese', porque: 'Sem luz não há fotossíntese; a planta continua respirando e consome O₂, cuja concentração cai.' },
    erradas: [
      { texto: 'Aumenta, porque a planta respira', porque: 'A respiração consome O₂ e libera CO₂; quem libera O₂ é a fotossíntese, que não ocorre no escuro.', motivo: 'trocou o efeito da respiração' },
      { texto: 'Não muda, porque a planta só respira de dia', porque: 'As plantas respiram o tempo todo, dia e noite.', motivo: 'achou que respira só de dia' },
      { texto: 'Aumenta, porque a planta faz fotossíntese também no escuro', porque: 'A etapa fotoquímica depende da luz; sem luz, a fotossíntese cessa.', motivo: 'achou que fotossíntese ocorre no escuro' },
    ],
    licao: 'No escuro só há respiração: o O₂ diminui e o CO₂ aumenta. Com luz acima do ponto de compensação, o saldo se inverte.',
    dicas: ['Sem luz, falta uma das duas reações.', 'Respiração consome O₂.', 'Plantas respiram dia e noite.'],
  },
  {
    pergunta: 'As cianobactérias fazem fotossíntese, embora sejam procariontes e não tenham cloroplastos. Como isso é possível?',
    certa: { texto: 'Têm clorofila e membranas internas fotossintetizantes (tilacoides) no próprio citoplasma', porque: 'A maquinaria fotossintética (clorofila e cadeia de elétrons) está em membranas internas da própria célula; o cloroplasto é uma organela posterior, que se acredita ser descendente de uma cianobactéria.' },
    erradas: [
      { texto: 'Usam as mitocôndrias para fazer a fotossíntese', porque: 'Bactérias não têm mitocôndrias, e a mitocôndria realiza a respiração, não a fotossíntese.', motivo: 'confundiu mitocôndria com cloroplasto' },
      { texto: 'Não fazem fotossíntese, apenas fermentação', porque: 'As cianobactérias são fotossintetizantes e liberam O₂; foram elas que, no passado, enriqueceram a atmosfera com oxigênio.', motivo: 'negou a fotossíntese' },
      { texto: 'Recebem os cloroplastos das células vizinhas', porque: 'Os cloroplastos não circulam entre células; as cianobactérias têm a sua própria maquinaria.', motivo: 'inventou transferência de cloroplastos' },
    ],
    licao: 'Fotossíntese não exige cloroplasto: cianobactérias têm clorofila e tilacoides próprios. Pela endossimbiose, o cloroplasto descende de uma cianobactéria.',
    dicas: ['Procariontes não têm organelas membranosas.', 'A hipótese da endossimbiose liga cianobactérias e cloroplastos.', 'Clorofila + membranas é o que importa.'],
  },
  {
    pergunta: 'Qual afirmação descreve melhor a relação entre fotossíntese e respiração celular?',
    certa: { texto: 'A fotossíntese armazena energia luminosa na glicose, e a respiração libera essa energia como ATP; os produtos de um processo são reagentes do outro', porque: 'Fotossíntese: CO₂ + H₂O + luz → glicose + O₂. Respiração: glicose + O₂ → CO₂ + H₂O + ATP. Os produtos de um são os reagentes do outro.' },
    erradas: [
      { texto: 'São o mesmo processo, apenas em organelas diferentes', porque: 'São processos distintos, com reagentes e produtos trocados; um armazena energia e o outro a libera.', motivo: 'achou que são o mesmo processo' },
      { texto: 'A fotossíntese ocorre só em plantas e a respiração só em animais', porque: 'Plantas também respiram (têm mitocôndrias), e a fotossíntese ocorre também em algas e cianobactérias.', motivo: 'achou que plantas não respiram' },
      { texto: 'A fotossíntese libera energia e a respiração a armazena', porque: 'É o inverso: a fotossíntese armazena energia (na glicose), e a respiração a libera (como ATP).', motivo: 'inverteu armazenar e liberar' },
    ],
    licao: 'Fotossíntese: energia luminosa → glicose (armazena). Respiração: glicose → ATP (libera). Plantas fazem os dois.',
    dicas: ['Escreva as duas equações lado a lado.', 'Plantas têm cloroplastos e mitocôndrias.', 'Armazenar × liberar energia.'],
  },
  {
    pergunta: 'O cianeto bloqueia a cadeia respiratória na mitocôndria. Qual é a consequência imediata para uma célula animal?',
    certa: { texto: 'Cai muito a produção de ATP pela respiração aeróbica, e a célula passa a depender da glicólise, que rende pouco', porque: 'Sem a cadeia respiratória, a maior parte do ATP deixa de ser produzida; resta a glicólise (2 ATP por glicose), insuficiente para a maioria das células.' },
    erradas: [
      { texto: 'A produção de ATP aumenta, pois a energia não é gasta no transporte de elétrons', porque: 'É justamente o transporte de elétrons que gera o gradiente usado para sintetizar a maior parte do ATP; bloqueá-lo reduz o ATP.', motivo: 'inverteu o efeito' },
      { texto: 'A glicólise para na hora, pois depende do O₂', porque: 'A glicólise não usa O₂ diretamente: ela continua, e a célula acumula lactato.', motivo: 'achou que a glicólise depende do O₂' },
      { texto: 'A célula passa a fazer fotossíntese', porque: 'Células animais não têm cloroplastos nem fazem fotossíntese.', motivo: 'confundiu com fotossíntese' },
    ],
    licao: 'A cadeia respiratória produz a maior parte do ATP. Bloqueá-la derruba o ATP e deixa só a glicólise (2 ATP por glicose).',
    dicas: ['Quanto ATP rende cada etapa da respiração?', 'A glicólise não depende do O₂ diretamente.', 'Animais não fazem fotossíntese.'],
  },
]

export interface DadosEnzima {
  tipo: 'enzima'
  otima: number
  desnaturacao: number
  /** temperaturas marcadas no gráfico */
  temps: number[]
}

export type DadosMetabolismo = DadosEnzima | DadosLuz | undefined

const pct = (x: number) => `${fn(Math.round(x * 100), 0)} %`

/** Escolhe quatro temperaturas com um máximo claro (sem empate nem diferença pequena). */
export function temperaturasDistintas(rng: Rng, otima: number, desnat: number): number[] {
  const candidatas: number[] = []
  for (let t = 10; t <= desnat + 10; t += 5) candidatas.push(t)
  for (let tentativa = 0; tentativa < 80; tentativa++) {
    const sorteadas = new Set<number>()
    while (sorteadas.size < 4) sorteadas.add(escolher(rng, candidatas))
    const ts = [...sorteadas].sort((a, b) => a - b)
    const ativ = ts.map((t) => atividadeEnzima(t, otima, desnat)).sort((a, b) => b - a)
    if ((ativ[0] as number) - (ativ[1] as number) >= 0.1) return ts
  }
  // recurso garantido: a temperatura ótima, uma abaixo, uma acima e uma além do limite
  return [otima - 15, otima, otima + 10, desnat + 5]
}

function gerarEnzima(rng: Rng): InstanciaMulti<DadosMetabolismo> {
  const otima = escolher(rng, [35, 37, 40, 45, 50, 55])
  const desnat = otima + escolher(rng, [20, 25, 30])
  const variante = escolher(rng, ['curva', 'curva', 'reversibilidade'] as const)
  const licao = 'Enzimas têm temperatura ótima. Abaixo dela, a atividade cai por falta de energia cinética (reversível); acima, a enzima desnatura e perde a forma (irreversível).'
  if (variante === 'curva') {
    const temps = temperaturasDistintas(rng, otima, desnat)
    const ativ = temps.map((t) => atividadeEnzima(t, otima, desnat))
    const melhor = ativ.indexOf(Math.max(...ativ))
    const porTemp = (t: number, a: number): string => {
      if (t >= desnat) return `A ${t} °C a enzima já está desnaturada (acima de ${desnat} °C): atividade nula.`
      if (t < otima) return `A ${t} °C a atividade é ${pct(a)} da máxima: abaixo da temperatura ótima (${otima} °C), as moléculas se movem mais devagar, com menos encontros entre enzima e substrato.`
      return `A ${t} °C a atividade é ${pct(a)} da máxima: acima da temperatura ótima (${otima} °C), a enzima começa a perder a forma e a atividade cai.`
    }
    const certa = temps[melhor] as number
    const erradas: Opc[] = temps.filter((_, i) => i !== melhor).map((t) => ({ texto: `${t} °C`, porque: porTemp(t, atividadeEnzima(t, otima, desnat)), motivo: t >= desnat ? 'temperatura que desnatura a enzima' : t < otima ? 'temperatura abaixo da ótima' : 'temperatura acima da ótima' }))
    return montar<DadosMetabolismo>(
      rng,
      { texto: `${certa} °C`, porque: `A ${certa} °C a atividade é ${pct(ativ[melhor] as number)} da máxima, a mais alta entre as opções (a ótima é ${otima} °C).` },
      erradas,
      {
        enunciado: `O gráfico mostra a atividade relativa de uma enzima em função da temperatura: a temperatura ótima é ${otima} °C, e acima de ${desnat} °C a enzima desnatura. Em qual das temperaturas marcadas a atividade é maior?`,
        resolucao: temps.map((t, i) => `${t} °C: ${pct(ativ[i] as number)}`).join(' · ') + `. A maior é a de ${certa} °C.`,
        dicas: ['Procure o ponto mais próximo do pico da curva (a temperatura ótima).', 'Acima da temperatura de desnaturação a atividade é zero.', 'Do lado esquerdo do pico a curva sobe devagar; do lado direito cai depressa.'],
        licao,
        dados: { tipo: 'enzima', otima, desnaturacao: desnat, temps },
      },
    )
  }
  const quente = rng() < 0.5
  if (quente) {
    const t = desnat + 5
    return montar<DadosMetabolismo>(
      rng,
      { texto: 'Permanece com atividade muito baixa ou nula: a desnaturação alterou a forma da enzima de modo irreversível', porque: `Acima de ${desnat} °C a estrutura da enzima se desfaz (desnaturação) e, em geral, ela não recupera a forma ao resfriar.` },
      [
        { texto: `Volta à atividade máxima, porque a temperatura voltou a ${otima} °C`, porque: 'Voltar à temperatura ótima não restaura uma enzima desnaturada: a forma original se perdeu. É o frio, e não o calor excessivo, que reduz a atividade de forma reversível.', motivo: 'achou que a desnaturação é reversível' },
        { texto: 'Fica mais ativa do que antes do aquecimento', porque: 'O aquecimento acima do limite destrói a estrutura da enzima; ela não ganha atividade.', motivo: 'achou que o calor ativa a enzima' },
        { texto: 'Desaparece porque foi consumida na reação', porque: 'Enzimas são catalisadores: não são consumidas nas reações. O problema aqui é a perda da forma, e não o consumo.', motivo: 'achou que enzimas são consumidas' },
      ],
      {
        enunciado: `Uma enzima com temperatura ótima de ${otima} °C é aquecida a ${t} °C (acima do limite de desnaturação, ${desnat} °C) por alguns minutos e depois resfriada de volta a ${otima} °C. O que se espera da atividade dela?`,
        resolucao: `A ${t} °C a enzima desnatura: perde a forma tridimensional que encaixa o substrato. Essa mudança é, em geral, irreversível, então voltar a ${otima} °C não devolve a atividade.`,
        dicas: ['O que acontece com a forma da proteína em temperatura muito alta?', 'O frio apenas diminui o movimento das moléculas.', 'Enzimas não são consumidas na reação.'],
        licao,
      },
    )
  }
  return montar<DadosMetabolismo>(
    rng,
    { texto: 'Recupera a atividade, porque o frio só diminui o movimento das moléculas, sem alterar a forma da enzima', porque: 'A baixa temperatura reduz a energia cinética e, portanto, os encontros entre enzima e substrato, mas não desfaz a estrutura da proteína. Ao aquecer, a atividade volta.' },
    [
      { texto: 'Continua sem atividade, porque o frio desnatura a enzima', porque: 'O frio não desnatura a enzima de forma permanente: ele apenas reduz a velocidade das moléculas. É o calor excessivo que desnatura.', motivo: 'achou que o frio desnatura' },
      { texto: 'Fica mais ativa que antes, porque o frio a “fortalece”', porque: 'O frio não torna a enzima mais ativa; ele só diminui temporariamente a atividade.', motivo: 'achou que o frio fortalece a enzima' },
      { texto: 'Perde metade da atividade, de forma definitiva', porque: 'Não há perda definitiva por frio moderado: a estrutura da enzima se mantém e a atividade é recuperada.', motivo: 'inventou perda parcial definitiva' },
    ],
    {
      enunciado: `Uma enzima com temperatura ótima de ${otima} °C é mantida a 4 °C por algumas horas (quase sem atividade) e depois aquecida de volta a ${otima} °C. O que se espera da atividade dela?`,
      resolucao: 'O frio apenas diminui o movimento das moléculas e os encontros entre enzima e substrato; a forma da enzima é preservada. Ao voltar à temperatura ótima, a atividade é recuperada.',
      dicas: ['O frio altera a forma da proteína?', 'Pense na diferença entre diminuir a velocidade e destruir a estrutura.', 'É por isso que se guardam alimentos e enzimas na geladeira.'],
      licao,
    },
  )
}

const OPCOES_SALDO = {
  libera: 'Libera O₂ e absorve CO₂ no total: a fotossíntese supera a respiração',
  consome: 'Absorve O₂ e libera CO₂ no total: a respiração supera a fotossíntese',
  nulo: 'Não há troca líquida de gases: a fotossíntese iguala a respiração',
  soResp: 'Só há fotossíntese: a planta respira apenas à noite',
}

function gerarCompensacao(rng: Rng): InstanciaMulti<DadosMetabolismo> {
  const { pmax, k, r, ic } = parametrosLuz(rng)
  const situacao = escolher(rng, ['abaixo', 'igual', 'acima', 'escuro'] as const)
  const luz = situacao === 'abaixo' ? ic / 2 : situacao === 'igual' ? ic : situacao === 'acima' ? 2 * ic : 0
  const liquida = fotossinteseLiquida(pmax, k, r, luz)
  const correta: keyof typeof OPCOES_SALDO = Math.abs(liquida) < 1e-9 ? 'nulo' : liquida > 0 ? 'libera' : 'consome'
  const relacao = situacao === 'escuro' ? 'no escuro, não há fotossíntese, só respiração' : situacao === 'abaixo' ? `${fn(luz, 0)} é menor que ${fn(ic, 0)}: a fotossíntese é menor que a respiração` : situacao === 'igual' ? `${fn(luz, 0)} é igual a ${fn(ic, 0)}: a fotossíntese iguala a respiração` : `${fn(luz, 0)} é maior que ${fn(ic, 0)}: a fotossíntese supera a respiração`
  const porqueErrada: Record<keyof typeof OPCOES_SALDO, string> = {
    libera: `Aqui ${relacao}, então o saldo não é de liberação de O₂.`,
    consome: `Aqui ${relacao}, então o saldo não é de consumo de O₂.`,
    nulo: `O saldo só é nulo quando a luz é exatamente igual ao ponto de compensação. Aqui ${relacao}.`,
    soResp: 'As plantas respiram o tempo todo, dia e noite; de dia, o que muda é que a fotossíntese também ocorre, e o saldo depende de qual das duas é maior.',
  }
  const motivos: Record<keyof typeof OPCOES_SALDO, string> = { libera: 'achou que a planta libera O₂ no total', consome: 'achou que a planta consome O₂ no total', nulo: 'achou que fotossíntese e respiração se igualam', soResp: 'achou que a planta só respira à noite' }
  const textoLuz = situacao === 'escuro' ? 'no escuro total' : `sob luz de ${fn(luz, 0)} µmol de fótons/(m²·s)`
  return montar<DadosMetabolismo>(
    rng,
    { texto: OPCOES_SALDO[correta], porque: `Aqui ${relacao}. ${correta === 'libera' ? 'Sobra O₂ produzido, que é liberado.' : correta === 'consome' ? 'A planta precisa absorver O₂ do ambiente para respirar.' : 'Todo o O₂ produzido é consumido na respiração: o saldo é nulo.'}` },
    (Object.keys(OPCOES_SALDO) as (keyof typeof OPCOES_SALDO)[]).filter((c) => c !== correta).map((c): Opc => ({ texto: OPCOES_SALDO[c], porque: porqueErrada[c], motivo: motivos[c] })),
    {
      enunciado: `O ponto de compensação luminoso de uma planta é ${fn(ic, 0)} µmol de fótons/(m²·s). A planta é mantida ${textoLuz}. Qual é o saldo das trocas gasosas com o ambiente?`,
      resolucao: `Ponto de compensação = ${fn(ic, 0)}. Aqui ${relacao}. Portanto: ${OPCOES_SALDO[correta].split(':')[0]?.toLowerCase()}.`,
      dicas: ['Compare a luz com o ponto de compensação.', 'Luz acima do ponto: a fotossíntese supera a respiração. Luz abaixo: ocorre o inverso.', 'As plantas respiram sempre, com ou sem luz.'],
      licao: 'Ponto de compensação: fotossíntese = respiração (saldo nulo). Luz abaixo dele: saldo negativo (consome O₂). Luz acima: saldo positivo (libera O₂).',
      dados: { tipo: 'luz', pmax, k, r, luz },
    },
  )
}

export function gerarMetabolismo(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMetabolismo> {
  if (nivel === 1) return doBanco<DadosMetabolismo>(rng, BANCO_METABOLISMO_1)
  if (nivel === 2) return gerarEnzima(rng)
  return rng() < 0.6 ? gerarCompensacao(rng) : doBanco<DadosMetabolismo>(rng, BANCO_METABOLISMO_3)
}
