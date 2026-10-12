import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { comCatalisador, deltaH, eaDireta, eaInversa, velocidade, type Diagrama, type Experimento } from './calculo'

const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const bonito = (x: number, casas = 1) => Math.abs(x * 10 ** casas - Math.round(x * 10 ** casas)) < 1e-9

function limpar(erros: ErroTipico[], resposta: number, tol: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor)) continue
    if (Math.abs(e.valor - resposta) <= 2 * tol) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tol)) continue
    saida.push(e)
  }
  return saida
}

/* ================================================================== lei de velocidade (método das velocidades iniciais) */

export interface DadosOrdem {
  variante: 'um' | 'dois' | 'prever'
  nomes: string[]
  /** velocidades em unidades de 10⁻³ mol/(L·s) */
  experimentos: Experimento[]
  ordens: number[]
  pede: 'A' | 'B' | 'total' | 'v'
  alvo?: number[]
}

const NOME_ORDEM = ['zero', 'um', 'dois']

export function gerarOrdem(rng: Rng, nivel: Nivel): InstanciaNum<DadosOrdem> {
  if (nivel === 1) {
    const m = sortear(rng, 0, 2)
    const k = escolher(rng, [1, 2, 4, 5, 10, 20, 50, 100, 0.5])
    const concs = escolher(rng, [[0.1, 0.2, 0.4], [0.1, 0.2, 0.3], [0.2, 0.4, 0.8], [0.1, 0.3, 0.6]])
    const experimentos = concs.map((c) => ({ conc: [c], v: velocidade(k, [m], [c]) }))
    const fator = (experimentos[1] as Experimento).v / (experimentos[0] as Experimento).v
    const razao = (concs[1] as number) / (concs[0] as number)
    const erros: ErroTipico[] = [
      { valor: fator, frase: `${fn(fator)} é quantas vezes a velocidade aumentou, não a ordem. A ordem m é o expoente: a razão das velocidades é (razão das concentrações)^m.`, motivo: 'deu a razão das velocidades em vez do expoente' },
      { valor: razao, frase: `${fn(razao)} é quantas vezes a concentração aumentou. A ordem é o expoente que relaciona as duas razões.`, motivo: 'deu a razão das concentrações' },
      { valor: m + 1, frase: 'A ordem é o expoente da concentração na lei de velocidade: compare as velocidades de dois experimentos.', motivo: 'errou o expoente' },
      { valor: (experimentos[2] as Experimento).v / (experimentos[0] as Experimento).v, frase: 'Esse número é uma razão entre velocidades, não o expoente da concentração.', motivo: 'deu uma razão de velocidades' },
    ]
    return {
      enunciado: `A velocidade inicial de uma reação A → produtos foi medida para três concentrações de A, a temperatura constante. Qual é a ordem da reação em relação a A?`,
      resposta: m,
      tolerancia: 0.05,
      erros: limpar(erros, m, 0.05),
      resolucao: `De ${fn(concs[0] as number)} para ${fn(concs[1] as number)} mol/L a concentração foi multiplicada por ${fn(razao)} e a velocidade por ${fn(fator)}. Como ${fn(razao)}^m = ${fn(fator)}, m = ${m} (ordem ${NOME_ORDEM[m]}).`,
      dicas: ['Compare dois experimentos: por quanto foi multiplicada a concentração? E a velocidade?', 'A razão das velocidades é a razão das concentrações elevada à ordem.', 'Se a velocidade não muda, a ordem é zero; se muda na mesma proporção, é um.'],
      licao: 'Ordem em relação a um reagente: o expoente m tal que (razão das velocidades) = (razão das concentrações)^m, comparando experimentos em que só esse reagente muda.',
      dados: { variante: 'um', nomes: ['A'], experimentos, ordens: [m], pede: 'A' },
    }
  }
  // dois reagentes: base, dobra A, muda B
  const cand: { m: number; n: number; k: number; A0: number; B0: number; fa: number; fb: number }[] = []
  for (const m of [0, 1, 2])
    for (const n of [0, 1, 2])
      for (const k of [1, 2, 5, 10, 20, 50, 100, 250])
        for (const A0 of [0.1, 0.2])
          for (const B0 of [0.1, 0.2])
            for (const fa of [2, 3])
              for (const fb of [2, 3]) {
                if (m + n === 0) continue
                const vs = [velocidade(k, [m, n], [A0, B0]), velocidade(k, [m, n], [A0 * fa, B0]), velocidade(k, [m, n], [A0, B0 * fb])]
                if (vs.every((v) => bonito(v, 2) && v >= 0.05)) cand.push({ m, n, k, A0, B0, fa, fb })
              }
  const c = escolher(rng, cand)
  const experimentos: Experimento[] = [
    { conc: [c.A0, c.B0], v: velocidade(c.k, [c.m, c.n], [c.A0, c.B0]) },
    { conc: [c.A0 * c.fa, c.B0], v: velocidade(c.k, [c.m, c.n], [c.A0 * c.fa, c.B0]) },
    { conc: [c.A0, c.B0 * c.fb], v: velocidade(c.k, [c.m, c.n], [c.A0, c.B0 * c.fb]) },
  ]
  const [e1, e2, e3] = experimentos as [Experimento, Experimento, Experimento]
  const ra = e2.v / e1.v
  const rb = e3.v / e1.v
  if (nivel === 2) {
    const pede = escolher(rng, ['A', 'B', 'total'] as const)
    const resposta = pede === 'A' ? c.m : pede === 'B' ? c.n : c.m + c.n
    const nome = pede === 'A' ? 'em relação a A' : pede === 'B' ? 'em relação a B' : 'global (soma das ordens)'
    const erros: ErroTipico[] =
      pede === 'total'
        ? [
            { valor: c.m, frase: 'Você deu só a ordem em relação a A. A ordem global é a soma das ordens de todos os reagentes.', motivo: 'deu só a ordem de A' },
            { valor: c.n, frase: 'Você deu só a ordem em relação a B. A ordem global é a soma das ordens de todos os reagentes.', motivo: 'deu só a ordem de B' },
            { valor: ra * rb, frase: 'Esse é o produto das razões de velocidade. Ache cada ordem (expoente) e some.', motivo: 'multiplicou razões de velocidade' },
            { valor: c.m * c.n, frase: 'As ordens se somam, não se multiplicam.', motivo: 'multiplicou as ordens' },
            { valor: c.m + c.n + 1, frase: 'Você somou uma unidade a mais. A ordem global é só a soma das ordens de cada reagente.', motivo: 'somou uma unidade a mais' },
            { valor: Math.max(c.m, c.n), frase: 'A ordem global é a soma, não a maior das ordens.', motivo: 'deu a maior das ordens' },
          ]
        : [
            { valor: pede === 'A' ? ra : rb, frase: 'Isso é quantas vezes a velocidade aumentou, não o expoente. Use (razão das concentrações)^ordem = razão das velocidades.', motivo: 'deu a razão das velocidades em vez do expoente' },
            { valor: pede === 'A' ? c.n : c.m, frase: 'Você deu a ordem do outro reagente. Confira quais experimentos você comparou: só a concentração do reagente pedido pode mudar.', motivo: 'deu a ordem do outro reagente' },
            { valor: (pede === 'A' ? c.m : c.n) + 1, frase: 'Compare os dois experimentos em que só esse reagente muda e resolva a potência.', motivo: 'errou o expoente' },
            { valor: c.m + c.n, frase: 'Você deu a ordem global (soma das ordens). A pergunta é sobre um reagente só.', motivo: 'deu a ordem global' },
            { valor: pede === 'A' ? c.fa : c.fb, frase: 'Esse número é por quanto a concentração foi multiplicada, não a ordem.', motivo: 'deu a razão das concentrações' },
            { valor: Math.max(0, (pede === 'A' ? c.m : c.n) - 1), frase: 'Compare os dois experimentos em que só esse reagente muda e resolva a potência.', motivo: 'errou o expoente' },
          ]
    return {
      enunciado: `Para a reação A + B → produtos, a velocidade inicial foi medida em três experimentos (tabela abaixo, velocidades em 10⁻³ mol/(L·s)). Qual é a ordem da reação ${nome}?`,
      resposta,
      tolerancia: 0.05,
      erros: limpar(erros, resposta, 0.05),
      resolucao: `Experimentos 1 e 2: só [A] muda (×${c.fa}) e a velocidade ficou ×${fn(ra)}, então a ordem em A é ${c.m}. Experimentos 1 e 3: só [B] muda (×${c.fb}) e a velocidade ficou ×${fn(rb)}, então a ordem em B é ${c.n}. Ordem global: ${c.m} + ${c.n} = ${c.m + c.n}.`,
      dicas: ['Para achar a ordem de A, compare os dois experimentos em que só [A] muda.', 'razão das velocidades = (razão das concentrações)^ordem.', 'A ordem global é a soma das ordens.'],
      licao: 'Método das velocidades iniciais: varie um reagente por vez; a ordem é o expoente que liga a razão de velocidades à razão de concentrações. Ordem global = soma das ordens.',
      dados: { variante: 'dois', nomes: ['A', 'B'], experimentos, ordens: [c.m, c.n], pede },
    }
  }
  // nível 3: prever a velocidade para novas concentrações
  const novas = escolher(rng, [[0.1, 0.4], [0.3, 0.2], [0.4, 0.1], [0.2, 0.3], [0.4, 0.2], [0.3, 0.3]])
  const v = Math.round(velocidade(c.k, [c.m, c.n], novas) * 1000) / 1000
  if (!bonito(v, 2) || v < 0.05) return gerarOrdem(rng, nivel)
  const kEst = e1.v / (c.A0 ** c.m * c.B0 ** c.n)
  const erros: ErroTipico[] = [
    { valor: kEst * novas[0]! * novas[1]!, frase: 'Você supôs ordem 1 em cada reagente (v = k·[A]·[B]). As ordens vêm da tabela, não dos coeficientes da equação.', motivo: 'supôs ordem 1 em cada reagente' },
    { valor: kEst * novas[0]! ** c.m, frase: 'Você usou só a concentração de A. A lei de velocidade tem os dois reagentes (com as ordens que você achou).', motivo: 'ignorou um dos reagentes' },
    { valor: velocidade(1, [c.m, c.n], novas), frase: 'Você esqueceu a constante k. Ache k substituindo um experimento da tabela na lei de velocidade.', motivo: 'esqueceu a constante de velocidade' },
    { valor: velocidade(c.k, [c.n, c.m], novas), frase: 'Você trocou as ordens de A e de B. Releia quais experimentos comparam [A] e quais comparam [B].', motivo: 'trocou as ordens' },
    { valor: e1.v * ((novas[0] as number) / c.A0 + (novas[1] as number) / c.B0), frase: 'Você somou as razões de concentração. Os fatores de cada reagente se multiplicam (cada um elevado à sua ordem).', motivo: 'somou os fatores em vez de multiplicar' },
    { valor: e1.v * (novas[0] as number) / c.A0, frase: 'Você escalou a velocidade só pela concentração de A, com expoente 1. Use as ordens que a tabela mostra, para A e para B.', motivo: 'ignorou as ordens e um dos reagentes' },
  ]
  return {
    enunciado: `Para A + B → produtos, a tabela mostra a velocidade inicial (em 10⁻³ mol/(L·s)) em três experimentos. Qual é a velocidade inicial, na mesma unidade, quando [A] = ${fn(novas[0] as number)} mol/L e [B] = ${fn(novas[1] as number)} mol/L, à mesma temperatura?`,
    resposta: v,
    tolerancia: Math.max(0.02, v * 0.01),
    unidade: '× 10⁻³ mol/(L·s)',
    erros: limpar(erros, v, Math.max(0.02, v * 0.01)),
    resolucao: `Ordens: em A, ${c.m}; em B, ${c.n}. Lei: v = k·[A]^${c.m}·[B]^${c.n}. k = ${fn(e1.v)} ÷ (${fn(c.A0)}^${c.m} × ${fn(c.B0)}^${c.n}) = ${fn(kEst)}. Então v = ${fn(kEst)} × ${fn(novas[0] as number)}^${c.m} × ${fn(novas[1] as number)}^${c.n} = ${fn(v, 3)}.`,
    dicas: ['Primeiro ache a ordem em cada reagente comparando experimentos.', 'Depois calcule k com um dos experimentos.', 'Por fim, substitua as novas concentrações em v = k·[A]^m·[B]^n.'],
    licao: 'Com as ordens e um experimento acha-se k; com k, calcula-se a velocidade para quaisquer concentrações.',
    dados: { variante: 'prever', nomes: ['A', 'B'], experimentos, ordens: [c.m, c.n], pede: 'v', alvo: novas },
  }
}

/* ================================================================== diagrama de energia */

export interface DadosDiagrama {
  d: Diagrama
  /** quanto o catalisador reduz a barreira (kJ), se aparece */
  reducao?: number
  pede: 'eaDireta' | 'deltaH' | 'eaInversa' | 'eaInvCat' | 'deltaHCat' | 'eaCat'
}

function sortearDiagrama(rng: Rng, nivel: Nivel): Diagrama {
  for (;;) {
    const hr = escolher(rng, [0, 10, 20, 30, 40, 50])
    const barreira = escolher(rng, nivel === 1 ? [30, 40, 50, 60, 80] : [40, 50, 60, 70, 80, 90, 100])
    const dh = escolher(rng, [-60, -40, -30, -20, 20, 30, 40, 60])
    // a barreira inversa (barreira − ΔH) precisa ser positiva, e no nível 3 grande o bastante para o catalisador reduzir
    const inversa = barreira - dh
    if (inversa < (nivel === 3 ? 40 : 15) || (nivel === 3 && barreira < 40)) continue
    return { hr, hts: hr + barreira, hp: hr + dh }
  }
}

export function gerarDiagrama(rng: Rng, nivel: Nivel): InstanciaNum<DadosDiagrama> {
  const d = sortearDiagrama(rng, nivel)
  const pede = nivel === 1 ? escolher(rng, ['eaDireta', 'deltaH'] as const) : nivel === 2 ? escolher(rng, ['eaInversa', 'deltaH', 'eaInversa'] as const) : escolher(rng, ['eaCat', 'eaInvCat', 'deltaHCat'] as const)
  const reducao = nivel === 3 ? escolher(rng, [10, 15, 20, 25, 30].filter((x) => x < eaDireta(d) - 5 && x < eaInversa(d) - 5)) : undefined
  const cat = reducao !== undefined ? comCatalisador(d, reducao) : undefined
  const H = (x: number) => `${fn(x, 0)} kJ`
  let enunciado: string
  let resposta: number
  let erros: ErroTipico[]
  let resolucao: string
  let licao: string
  let dicas: string[]
  const dados = `No diagrama, os reagentes têm entalpia ${H(d.hr)}, o complexo ativado ${H(d.hts)} e os produtos ${H(d.hp)}.`
  if (pede === 'eaDireta') {
    resposta = eaDireta(d)
    enunciado = `${dados} Qual é a energia de ativação da reação direta, em kJ?`
    erros = [
      { valor: d.hts, frase: `${fn(d.hts, 0)} kJ é a entalpia do complexo ativado, não a barreira. A energia de ativação é medida a partir dos reagentes: Hcomplexo − Hreagentes.`, motivo: 'deu a entalpia do complexo ativado' },
      { valor: eaInversa(d), frase: 'Você mediu a barreira a partir dos produtos, que é a energia de ativação da reação INVERSA.', motivo: 'deu a Ea da reação inversa' },
      { valor: deltaH(d), frase: 'Essa é a variação de entalpia (produtos − reagentes), não a energia de ativação.', motivo: 'deu o ΔH no lugar da Ea' },
      { valor: eaDireta(d) + eaInversa(d), frase: 'Você somou as duas energias de ativação. A pergunta pede só a da reação direta (reagentes até o topo).', motivo: 'somou as duas Ea' },
      { valor: Math.abs(deltaH(d)) + eaDireta(d), frase: 'Você somou o ΔH à energia de ativação. A Ea é só a subida até o topo.', motivo: 'somou o ΔH' },
    ]
    resolucao = `Ea (direta) = H do complexo ativado − H dos reagentes = ${fn(d.hts, 0)} − ${fn(d.hr, 0)} = ${fn(resposta, 0)} kJ.`
    licao = 'Ea direta = H(complexo ativado) − H(reagentes). Ea inversa = H(complexo ativado) − H(produtos). ΔH = H(produtos) − H(reagentes).'
    dicas = ['A energia de ativação é a "subida" até o topo da barreira.', 'Parta do nível dos reagentes (reação direta).', 'Subtraia: topo − reagentes.']
  } else if (pede === 'deltaH') {
    resposta = deltaH(d)
    enunciado = `${dados} Qual é a variação de entalpia (ΔH) da reação direta, em kJ? (Use sinal negativo se a reação for exotérmica.)`
    erros = [
      { valor: -deltaH(d), frase: 'O sinal está invertido: ΔH = H(produtos) − H(reagentes). Se os produtos têm menos energia, ΔH é negativo (exotérmica).', motivo: 'inverteu o sinal do ΔH' },
      { valor: eaDireta(d), frase: 'Essa é a energia de ativação da reação direta, não o ΔH.', motivo: 'deu a Ea no lugar do ΔH' },
      { valor: d.hp, frase: 'Essa é a entalpia dos produtos, não a variação. ΔH = H(produtos) − H(reagentes).', motivo: 'deu a entalpia dos produtos' },
    ]
    resolucao = `ΔH = H(produtos) − H(reagentes) = ${fn(d.hp, 0)} − ${fn(d.hr, 0)} = ${fn(resposta, 0)} kJ (${resposta > 0 ? 'endotérmica' : 'exotérmica'}).`
    licao = 'ΔH = H(produtos) − H(reagentes): negativo se libera energia (exotérmica), positivo se absorve (endotérmica).'
    dicas = ['ΔH compara produtos com reagentes; o complexo ativado não entra.', 'ΔH = H produtos − H reagentes.', resposta > 0 ? 'Produtos com mais energia: absorve calor.' : 'Produtos com menos energia: libera calor.']
  } else if (pede === 'eaInversa') {
    resposta = eaInversa(d)
    enunciado = `${dados} Qual é a energia de ativação da reação inversa (dos produtos para os reagentes), em kJ?`
    erros = [
      { valor: eaDireta(d), frase: 'Você mediu a barreira a partir dos reagentes: essa é a Ea da reação DIRETA. A inversa começa nos produtos.', motivo: 'deu a Ea da reação direta' },
      { valor: d.hts, frase: 'Essa é a entalpia do complexo ativado, não a barreira. Subtraia a entalpia de partida.', motivo: 'deu a entalpia do complexo ativado' },
      { valor: Math.abs(deltaH(d)), frase: 'Esse é o módulo do ΔH. A Ea inversa é a distância do nível dos produtos até o topo.', motivo: 'deu o ΔH no lugar da Ea' },
      { valor: eaDireta(d) + eaInversa(d), frase: 'Você somou as duas energias de ativação. A pergunta pede só a da reação inversa.', motivo: 'somou as duas Ea' },
    ]
    resolucao = `Ea (inversa) = H do complexo ativado − H dos produtos = ${fn(d.hts, 0)} − ${fn(d.hp, 0)} = ${fn(resposta, 0)} kJ. (Confira: Ea direta − Ea inversa = ${fn(eaDireta(d), 0)} − ${fn(resposta, 0)} = ${fn(deltaH(d), 0)} = ΔH.)`
    licao = 'A Ea da reação inversa parte do nível dos produtos: H(complexo ativado) − H(produtos). Ea direta − Ea inversa = ΔH.'
    dicas = ['Na reação inversa, o ponto de partida são os produtos.', 'Subtraia: topo − produtos.', 'Confira com Ea direta − Ea inversa = ΔH.']
  } else if (pede === 'eaCat') {
    resposta = eaDireta(cat as Diagrama)
    enunciado = `${dados} Um catalisador reduz em ${fn(reducao as number, 0)} kJ a energia do complexo ativado (abaixa o topo da barreira). Qual passa a ser a energia de ativação da reação direta, em kJ?`
    erros = [
      { valor: eaDireta(d), frase: 'Esse é o valor sem catalisador. O catalisador abaixa a barreira, então a Ea diminui.', motivo: 'ignorou o efeito do catalisador' },
      { valor: eaDireta(d) + (reducao as number), frase: 'O catalisador diminui a Ea; você somou em vez de subtrair.', motivo: 'somou em vez de subtrair' },
      { valor: reducao as number, frase: 'Esse é só o tanto que a barreira abaixou. A nova Ea é a antiga menos essa redução.', motivo: 'deu só a redução' },
      { valor: eaInversa(cat as Diagrama), frase: 'Essa é a Ea da reação inversa com catalisador. A pergunta é sobre a direta.', motivo: 'deu a Ea da reação inversa' },
    ]
    resolucao = `Sem catalisador: Ea = ${fn(d.hts, 0)} − ${fn(d.hr, 0)} = ${fn(eaDireta(d), 0)} kJ. O catalisador abaixa o topo em ${fn(reducao as number, 0)} kJ: Ea com catalisador = ${fn(eaDireta(d), 0)} − ${fn(reducao as number, 0)} = ${fn(resposta, 0)} kJ.`
    licao = 'O catalisador abaixa o topo da barreira (menor Ea nos dois sentidos) sem mudar a energia dos reagentes e dos produtos, então o ΔH não muda.'
    dicas = ['O catalisador muda só o topo da barreira.', 'Calcule a Ea original e subtraia a redução.', 'Reagentes e produtos continuam nos mesmos níveis.']
  } else if (pede === 'eaInvCat') {
    resposta = eaInversa(cat as Diagrama)
    enunciado = `${dados} Um catalisador reduz em ${fn(reducao as number, 0)} kJ a energia do complexo ativado. Qual passa a ser a energia de ativação da reação INVERSA, em kJ?`
    erros = [
      { valor: eaInversa(d), frase: 'Esse é o valor sem catalisador. O catalisador abaixa a barreira nos dois sentidos.', motivo: 'achou que o catalisador só afeta a reação direta' },
      { valor: eaDireta(cat as Diagrama), frase: 'Essa é a Ea da reação direta com catalisador. A inversa parte dos produtos.', motivo: 'deu a Ea da reação direta' },
      { valor: eaInversa(d) + (reducao as number), frase: 'O catalisador diminui a Ea; você somou em vez de subtrair.', motivo: 'somou em vez de subtrair' },
    ]
    resolucao = `Sem catalisador: Ea inversa = ${fn(d.hts, 0)} − ${fn(d.hp, 0)} = ${fn(eaInversa(d), 0)} kJ. O topo desce ${fn(reducao as number, 0)} kJ, então Ea inversa com catalisador = ${fn(eaInversa(d), 0)} − ${fn(reducao as number, 0)} = ${fn(resposta, 0)} kJ. O catalisador acelera os dois sentidos.`
    licao = 'O catalisador diminui a Ea da reação direta e da inversa na mesma quantidade (o topo desce) e não muda o ΔH.'
    dicas = ['O topo da barreira desce; os níveis de reagentes e produtos não mudam.', 'A Ea inversa também diminui.', 'Subtraia a redução da Ea inversa original.']
  } else {
    resposta = deltaH(cat as Diagrama)
    enunciado = `${dados} Um catalisador reduz em ${fn(reducao as number, 0)} kJ a energia do complexo ativado. Qual é o ΔH da reação direta com o catalisador, em kJ?`
    erros = [
      { valor: deltaH(d) + (reducao as number), frase: 'O catalisador não muda o ΔH: reagentes e produtos continuam nos mesmos níveis de energia.', motivo: 'achou que o catalisador muda o ΔH' },
      { valor: deltaH(d) - (reducao as number), frase: 'O catalisador não muda o ΔH: ele só abaixa o topo da barreira.', motivo: 'achou que o catalisador muda o ΔH' },
      { valor: eaDireta(cat as Diagrama), frase: 'Essa é a energia de ativação com catalisador, não o ΔH.', motivo: 'deu a Ea no lugar do ΔH' },
      { valor: 0, frase: 'O catalisador não zera o ΔH: a reação continua liberando ou absorvendo a mesma energia.', motivo: 'achou que o ΔH some com o catalisador' },
    ]
    resolucao = `O catalisador só abaixa o complexo ativado. H(reagentes) = ${fn(d.hr, 0)} e H(produtos) = ${fn(d.hp, 0)} continuam iguais, então ΔH = ${fn(d.hp, 0)} − ${fn(d.hr, 0)} = ${fn(resposta, 0)} kJ, o mesmo de antes.`
    licao = 'O catalisador não altera o ΔH nem o rendimento do equilíbrio: só a velocidade (por reduzir a Ea).'
    dicas = ['Pense em quais níveis o catalisador muda.', 'Reagentes e produtos ficam onde estavam.', 'ΔH = H produtos − H reagentes.']
  }
  return { enunciado, resposta, tolerancia: 0.5, unidade: 'kJ', erros: limpar(erros, resposta, 0.5), resolucao, dicas, licao, dados: { d, reducao, pede } }
}

/* ================================================================== meia-vida */

export interface DadosMeiaVida {
  variante: 'restante' | 'tempo' | 'k' | 'doisPontos'
  /** pontos medidos mostrados no gráfico: [tempo, quantidade] */
  pontos: [number, number][]
  unidadeT: string
  unidadeM: string
  /** meia-vida real, quantidade inicial e tempo a que a pergunta se refere (para conferência) */
  tMeia: number
  m0?: number
  tempo?: number
  k?: number
}

export function gerarMeiaVida(rng: Rng, nivel: Nivel): InstanciaNum<DadosMeiaVida> {
  const unT = escolher(rng, ['min', 'h', 'dias', 'anos'])
  const unM = escolher(rng, ['g', 'mg', 'mol'])
  if (nivel === 1) {
    for (;;) {
      const t = escolher(rng, [5, 10, 12, 15, 20, 30, 40, 60])
      const n = sortear(rng, 2, 4)
      const m0 = escolher(rng, [64, 80, 100, 120, 160, 200, 240, 320, 400, 640])
      const resp = m0 / 2 ** n
      if (!bonito(resp, 2)) continue
      return {
        enunciado: `A meia-vida de uma substância é ${fn(t, 0)} ${unT}. Uma amostra de ${fn(m0, 0)} ${unM} é deixada em repouso por ${fn(t * n, 0)} ${unT}. Quanto resta da substância, em ${unM}? (Considere um decaimento de primeira ordem.)`,
        resposta: resp,
        tolerancia: 0.02,
        unidade: unM,
        erros: limpar(
          [
            { valor: m0 / (2 * n), frase: `Você dividiu por 2n. Cada meia-vida divide a quantidade por 2: depois de ${n} meias-vidas, divide-se por 2^${n} = ${2 ** n}.`, motivo: 'tratou o decaimento como linear' },
            { valor: m0 - (m0 / 2) * n, frase: 'Você tirou metade da quantidade inicial a cada meia-vida. A metade é sempre da quantidade que sobrou.', motivo: 'tirou metade da quantidade inicial a cada meia-vida' },
            { valor: m0 / n, frase: `Você dividiu pelo número de meias-vidas (${n}). Cada meia-vida divide por 2, ou seja, ${n} meias-vidas dividem por 2^${n}.`, motivo: 'dividiu pelo número de meias-vidas' },
            { valor: m0 / 2 ** (n - 1), frase: `Você contou ${n - 1} meias-vidas. Em ${fn(t * n, 0)} ${unT} passaram ${n} (${fn(t * n, 0)} ÷ ${fn(t, 0)}).`, motivo: 'contou uma meia-vida a menos' },
          ],
          resp,
          0.02,
        ),
        resolucao: `Tempo ÷ meia-vida = ${fn(t * n, 0)} ÷ ${fn(t, 0)} = ${n} meias-vidas. Cada uma divide a quantidade por 2: ${fn(m0, 0)} ÷ 2^${n} = ${fn(m0, 0)} ÷ ${2 ** n} = ${fn(resp, 3)} ${unM}.`,
        dicas: ['Quantas meias-vidas cabem no tempo dado?', 'A cada meia-vida, a quantidade cai pela metade.', `Depois de ${n} meias-vidas, divide-se por 2^${n}.`],
        licao: 'Depois de n meias-vidas resta m₀ ÷ 2ⁿ (primeira ordem).',
        dados: { variante: 'restante', pontos: [[0, m0]], unidadeT: unT, unidadeM: unM, tMeia: t, m0, tempo: t * n },
      }
    }
  }
  if (nivel === 2) {
    if (rng() < 0.5) {
      for (;;) {
        const t = escolher(rng, [5, 10, 15, 20, 30, 40, 50, 60])
        const n = sortear(rng, 2, 5)
        const m0 = escolher(rng, [64, 80, 100, 120, 160, 200, 320, 640])
        const m = m0 / 2 ** n
        if (!bonito(m, 2)) continue
        return {
          enunciado: `A meia-vida de uma substância é ${fn(t, 0)} ${unT}. Quanto tempo, em ${unT}, é preciso para que ${fn(m0, 0)} ${unM} se reduzam a ${fn(m, 3)} ${unM}?`,
          resposta: t * n,
          tolerancia: 0.05,
          unidade: unT,
          erros: limpar(
            [
              { valor: n, frase: `${n} é o número de meias-vidas, não o tempo. Multiplique pelo valor da meia-vida (${fn(t, 0)} ${unT}).`, motivo: 'deu o número de meias-vidas em vez do tempo' },
              { valor: (m0 - m) / (m0 / 2) * t, frase: 'Você tratou a perda como linear: tirou metade da quantidade inicial a cada meia-vida. A metade é sempre do que sobrou.', motivo: 'tratou o decaimento como linear' },
              { valor: t * (n - 1), frase: `Você contou ${n - 1} meias-vidas. De ${fn(m0, 0)} a ${fn(m, 3)} dividiu-se por ${m0 / m} = 2^${n}.`, motivo: 'contou uma meia-vida a menos' },
              { valor: t * (m0 / m) / 2, frase: `Você usou o fator ${m0 / m} como se fosse o número de meias-vidas, mas esse fator é 2^n. Aqui n = ${n}.`, motivo: 'confundiu o fator de redução com o número de meias-vidas' },
            ],
            t * n,
            0.05,
          ),
          resolucao: `${fn(m0, 0)} → ${fn(m, 3)} é uma redução de ${m0 / m} vezes = 2^${n}, ou seja, ${n} meias-vidas. Tempo = ${n} × ${fn(t, 0)} = ${fn(t * n, 0)} ${unT}.`,
          dicas: ['Por qual fator a quantidade foi dividida?', 'Esse fator é uma potência de 2: o expoente é o número de meias-vidas.', 'Tempo = número de meias-vidas × meia-vida.'],
          licao: 'Se a quantidade foi dividida por 2ⁿ, passaram n meias-vidas; o tempo é n·t½.',
          dados: { variante: 'tempo', pontos: [[0, m0], [t * n, m]], unidadeT: unT, unidadeM: unM, tMeia: t, m0, tempo: t * n },
        }
      }
    }
    for (;;) {
      const t = escolher(rng, [5, 10, 15, 20, 30, 40])
      const n = sortear(rng, 2, 4)
      const m0 = escolher(rng, [64, 80, 100, 120, 160, 200, 320, 640])
      const m = m0 / 2 ** n
      if (!bonito(m, 2)) continue
      return {
        enunciado: `Uma amostra de ${fn(m0, 0)} ${unM} de uma substância que decai (primeira ordem) se reduz a ${fn(m, 3)} ${unM} em ${fn(t * n, 0)} ${unT}. Qual é a meia-vida, em ${unT}?`,
        resposta: t,
        tolerancia: 0.05,
        unidade: unT,
        erros: limpar(
          [
            { valor: t * n, frase: `${fn(t * n, 0)} ${unT} é o tempo total. A meia-vida é o tempo para cair à metade; foram ${n} meias-vidas.`, motivo: 'deu o tempo total' },
            { valor: (t * n * m) / (m0 - m), frase: 'Você usou uma regra de três linear. O decaimento é exponencial: cada meia-vida divide por 2.', motivo: 'usou regra de três linear' },
            { valor: t * (m0 / m), frase: `Você multiplicou pelo fator ${m0 / m}. O fator é 2^n, e n é o número de meias-vidas.`, motivo: 'confundiu o fator de redução com o número de meias-vidas' },
          ],
          t,
          0.05,
        ),
        resolucao: `${fn(m0, 0)} → ${fn(m, 3)} é uma redução de ${m0 / m} = 2^${n}, então passaram ${n} meia(s)-vida(s) em ${fn(t * n, 0)} ${unT}. Meia-vida = ${fn(t * n, 0)} ÷ ${n} = ${fn(t, 0)} ${unT}.`,
        dicas: ['Por qual fator a quantidade foi dividida?', 'Esse fator é 2ⁿ: ache n.', 'Meia-vida = tempo total ÷ n.'],
        licao: 'Meia-vida = tempo total ÷ número de meias-vidas, com 2ⁿ igual ao fator de redução.',
        dados: { variante: 'doisPontos', pontos: [[0, m0], [t * n, m]], unidadeT: unT, unidadeM: unM, tMeia: t, m0, tempo: t * n },
      }
    }
  }
  // nível 3: k ↔ meia-vida, ou dois pontos + previsão
  if (rng() < 0.5) {
    const opcoes: number[] = []
    for (let t = 2; t <= 200; t++) if (bonito(0.693 / t, 4) && 0.693 / t >= 0.0035) opcoes.push(t)
    const t = escolher(rng, opcoes)
    const k = 0.693 / t
    return {
      enunciado: `Uma reação de primeira ordem tem constante de velocidade k = ${fn(k, 4)} ${unT}⁻¹. Qual é a meia-vida, em ${unT}? (Use t½ = 0,693 ÷ k.)`,
      resposta: t,
      tolerancia: 0.3,
      unidade: unT,
      erros: limpar(
        [
          { valor: 0.693 * k, frase: 'Você multiplicou. Para primeira ordem, t½ = 0,693 ÷ k (k grande significa meia-vida curta).', motivo: 'multiplicou 0,693 por k' },
          { valor: 1 / k, frase: 'Você usou 1/k, que é o tempo característico (vida média), não a meia-vida. Para chegar à metade: t½ = 0,693 ÷ k.', motivo: 'usou 1/k no lugar de 0,693/k' },
          { valor: k / 0.693, frase: 'Você inverteu a divisão. t½ = 0,693 ÷ k.', motivo: 'inverteu a divisão' },
        ],
        t,
        0.3,
      ),
      resolucao: `t½ = ln 2 ÷ k = 0,693 ÷ ${fn(k, 4)} = ${fn(t, 1)} ${unT}.`,
      dicas: ['Em primeira ordem, a meia-vida não depende da concentração.', 't½ = 0,693 ÷ k.', 'Confira as unidades: k em tempo⁻¹, t½ em tempo.'],
      licao: 'Primeira ordem: t½ = ln 2 ÷ k ≈ 0,693 ÷ k, independente da concentração inicial.',
      dados: { variante: 'k', pontos: [], unidadeT: unT, unidadeM: unM, tMeia: t, k },
    }
  }
  for (;;) {
    const t = escolher(rng, [10, 15, 20, 30, 40])
    const n1 = sortear(rng, 1, 3)
    const extra = sortear(rng, 2, 5)
    const m0 = escolher(rng, [80, 160, 320, 640])
    const mMedido = m0 / 2 ** n1
    const total = n1 + extra
    const resp = m0 / 2 ** total
    if (!bonito(resp, 2) || resp < 0.2) continue
    return {
      enunciado: `Uma substância de decaimento de primeira ordem passa de ${fn(m0, 0)} ${unM} para ${fn(mMedido, 3)} ${unM} em ${fn(t * n1, 0)} ${unT}. Mantidas as condições, quantos ${unM} restarão ao fim de ${fn(t * total, 0)} ${unT} (contados desde o início)?`,
      resposta: resp,
      tolerancia: 0.02,
      unidade: unM,
      erros: limpar(
        [
          { valor: mMedido - (m0 - mMedido) * (extra / n1), frase: 'Você extrapolou linearmente a perda. No decaimento exponencial, cada meia-vida divide por 2 o que restava.', motivo: 'extrapolou linearmente' },
          { valor: mMedido / 2 ** (total), frase: `Você dividiu a quantidade medida por 2^${total}, mas ela já é o resultado de ${n1} meia(s)-vida(s). Do valor medido só faltam ${extra}.`, motivo: 'contou duas vezes as meias-vidas já ocorridas' },
          { valor: m0 / 2 ** extra, frase: `Você usou só as ${extra} meias-vidas depois da medida. Desde o início passaram ${total}.`, motivo: 'esqueceu as meias-vidas do início' },
          { valor: m0 / total, frase: 'Divida por 2 a cada meia-vida, não pelo número delas.', motivo: 'dividiu pelo número de meias-vidas' },
        ],
        resp,
        0.02,
      ),
      resolucao: `${fn(m0, 0)} → ${fn(mMedido, 3)} = ÷ 2^${n1}, então t½ = ${fn(t * n1, 0)} ÷ ${n1} = ${fn(t, 0)} ${unT}. Em ${fn(t * total, 0)} ${unT} passam ${total} meias-vidas: ${fn(m0, 0)} ÷ 2^${total} = ${fn(resp, 3)} ${unM}.`,
      dicas: ['Primeiro ache a meia-vida com os dois pontos.', 'Depois conte quantas meias-vidas cabem no tempo pedido.', 'Divida a quantidade inicial por 2 elevado a esse número.'],
      licao: 'Ache t½ com dois pontos (fator 2ⁿ), depois aplique m = m₀ ÷ 2^(t/t½).',
      dados: { variante: 'doisPontos', pontos: [[0, m0], [t * n1, mMedido]], unidadeT: unT, unidadeM: unM, tMeia: t, m0, tempo: t * total },
    }
  }
}

/* ================================================================== fatores que alteram a velocidade */

export interface DadosFatores {
  familia: 'conceito' | 'diagrama' | 'regra10' | 'mb'
  d?: Diagrama
  reducao?: number
  /** curvas de Maxwell–Boltzmann mostradas: rótulo e temperatura (K) */
  curvas?: { rotulo: string; T: number }[]
  Ea?: number
}

interface ItemConceito {
  pergunta: string
  certa: { texto: string; porque: string }
  erradas: { texto: string; porque: string; motivo: string }[]
  licao: string
}

const CONCEITOS: ItemConceito[] = [
  {
    pergunta: 'Um comprimido efervescente se dissolve mais depressa em pedaços do que inteiro. Por quê?',
    certa: { texto: 'A superfície de contato com a água aumenta, então há mais colisões efetivas por segundo.', porque: 'Reagem as partículas da superfície. Triturar expõe mais superfície, e a velocidade aumenta sem mudar a energia de ativação.' },
    erradas: [
      { texto: 'A energia de ativação da reação diminui.', porque: 'A energia de ativação é característica da reação e do caminho; triturar não a muda, só aumenta a área em contato.', motivo: 'achou que a superfície muda a energia de ativação' },
      { texto: 'A temperatura da água aumenta.', porque: 'Nada no enunciado aumenta a temperatura: o que muda é a área de contato.', motivo: 'atribuiu a mudança à temperatura' },
      { texto: 'A massa do comprimido aumenta.', porque: 'A massa é a mesma. O que muda é a área exposta.', motivo: 'achou que a massa muda' },
    ],
    licao: 'Maior superfície de contato → mais colisões efetivas por segundo → maior velocidade (sem mudar a Ea).',
  },
  {
    pergunta: 'Alimentos duram mais na geladeira porque a temperatura mais baixa:',
    certa: { texto: 'diminui a fração de colisões com energia igual ou maior que a energia de ativação.', porque: 'Com menos calor, menos colisões têm energia suficiente para reagir, e as reações de deterioração ficam mais lentas.' },
    erradas: [
      { texto: 'aumenta a energia de ativação das reações de deterioração.', porque: 'A Ea não depende da temperatura: o que muda é a fração de colisões que a superam.', motivo: 'achou que a temperatura muda a energia de ativação' },
      { texto: 'torna as reações de deterioração endotérmicas.', porque: 'O tipo de reação (endo ou exotérmica) não depende da temperatura do ambiente.', motivo: 'confundiu temperatura com tipo de reação' },
      { texto: 'aumenta a concentração dos reagentes.', porque: 'Resfriar não aumenta concentração; o efeito vem da menor energia das colisões.', motivo: 'atribuiu a mudança à concentração' },
    ],
    licao: 'Temperatura menor → menos colisões com E ≥ Ea → velocidade menor. A Ea continua a mesma.',
  },
  {
    pergunta: 'Um catalisador aumenta a velocidade de uma reação porque:',
    certa: { texto: 'oferece um caminho alternativo com menor energia de ativação.', porque: 'Com a barreira mais baixa, uma fração maior de colisões é efetiva. O catalisador não é consumido e não muda ΔH.' },
    erradas: [
      { texto: 'aumenta a variação de entalpia (ΔH) da reação.', porque: 'O catalisador não altera reagentes nem produtos, então o ΔH é o mesmo.', motivo: 'achou que o catalisador muda o ΔH' },
      { texto: 'aumenta a quantidade de produto no equilíbrio.', porque: 'O catalisador acelera igualmente os dois sentidos, e a posição do equilíbrio não muda; só se chega a ele mais depressa.', motivo: 'achou que o catalisador aumenta o rendimento' },
      { texto: 'aumenta a energia cinética média das partículas.', porque: 'A energia cinética média depende da temperatura, e o catalisador não a muda.', motivo: 'confundiu catalisador com aquecimento' },
    ],
    licao: 'Catalisador: menor Ea nos dois sentidos, mesmo ΔH, mesmo equilíbrio, e não é consumido.',
  },
  {
    pergunta: 'Aumentar a concentração de um reagente aumenta a velocidade da reação porque:',
    certa: { texto: 'há mais partículas por volume e, portanto, mais colisões por unidade de tempo.', porque: 'Mais colisões por segundo significam mais colisões efetivas por segundo, na mesma temperatura.' },
    erradas: [
      { texto: 'a energia de ativação da reação diminui.', porque: 'A Ea não depende da concentração.', motivo: 'achou que a concentração muda a energia de ativação' },
      { texto: 'a energia cinética média das partículas aumenta.', porque: 'A energia cinética média depende da temperatura, não da concentração.', motivo: 'confundiu concentração com temperatura' },
      { texto: 'o reagente em excesso passa a funcionar como catalisador.', porque: 'Um reagente é consumido; um catalisador não. O efeito é só o aumento do número de colisões.', motivo: 'confundiu reagente com catalisador' },
    ],
    licao: 'Mais concentração → mais colisões por segundo → maior velocidade (a fração de colisões efetivas não muda).',
  },
  {
    pergunta: 'Comprimir uma mistura gasosa reagente aumenta a velocidade da reação porque:',
    certa: { texto: 'a concentração dos gases aumenta e há mais colisões por unidade de tempo.', porque: 'No mesmo volume menor, há mais partículas por litro, o que aumenta a frequência de colisões.' },
    erradas: [
      { texto: 'a energia de ativação diminui com a pressão.', porque: 'A energia de ativação não depende da pressão.', motivo: 'achou que a pressão muda a energia de ativação' },
      { texto: 'o gás esfria e reage mais depressa.', porque: 'Resfriar diminuiria a velocidade. O efeito aqui vem da maior concentração.', motivo: 'inverteu o efeito da temperatura' },
      { texto: 'o catalisador é formado pela compressão.', porque: 'Compressão não gera catalisador.', motivo: 'inventou um catalisador' },
    ],
    licao: 'Para gases, aumentar a pressão equivale a aumentar a concentração: mais colisões por segundo.',
  },
  {
    pergunta: 'Um comprimido se dissolve mais depressa em água quente do que em água fria porque, na água quente:',
    certa: { texto: 'uma fração maior das colisões tem energia igual ou maior que a energia de ativação.', porque: 'A temperatura maior desloca a distribuição de energias: mais partículas passam da barreira, e as colisões efetivas se tornam mais frequentes.' },
    erradas: [
      { texto: 'a energia de ativação diminui.', porque: 'A Ea é a mesma; o que muda é quantas colisões a superam.', motivo: 'achou que a temperatura muda a energia de ativação' },
      { texto: 'a concentração do comprimido aumenta.', porque: 'A concentração não muda com a temperatura; a velocidade aumenta pela maior energia das colisões.', motivo: 'atribuiu a mudança à concentração' },
      { texto: 'o comprimido vira catalisador.', porque: 'O comprimido é reagente e é consumido; não é catalisador.', motivo: 'confundiu reagente com catalisador' },
    ],
    licao: 'Temperatura maior → maior fração de colisões com E ≥ Ea → maior velocidade (a Ea não muda).',
  },
  {
    pergunta: 'As enzimas aumentam a velocidade de reações no organismo porque:',
    certa: { texto: 'são catalisadores biológicos: diminuem a energia de ativação da reação.', porque: 'Como todo catalisador, a enzima oferece um caminho de menor Ea e se regenera ao final da reação.' },
    erradas: [
      { texto: 'são consumidas na reação, como os reagentes.', porque: 'A enzima não é consumida: ao final da reação ela é regenerada.', motivo: 'achou que a enzima é consumida' },
      { texto: 'aumentam a temperatura do corpo.', porque: 'A temperatura do corpo é regulada; o efeito da enzima não vem do aquecimento.', motivo: 'confundiu enzima com aquecimento' },
      { texto: 'aumentam o ΔH das reações.', porque: 'Catalisadores não alteram o ΔH.', motivo: 'achou que a enzima muda o ΔH' },
    ],
    licao: 'Enzimas são catalisadores: reduzem a Ea, não mudam o ΔH e não são consumidas.',
  },
  {
    pergunta: 'Uma palha de aço queima muito mais depressa que um prego de ferro de mesma massa porque a palha de aço:',
    certa: { texto: 'tem superfície de contato com o oxigênio muito maior.', porque: 'O ferro é o mesmo, mas a palha expõe muito mais superfície ao oxigênio, o que aumenta a velocidade.' },
    erradas: [
      { texto: 'tem menor energia de ativação por ser um material diferente.', porque: 'É o mesmo material e a mesma reação, com a mesma Ea; a diferença está na superfície.', motivo: 'achou que a superfície muda a energia de ativação' },
      { texto: 'tem menos massa de ferro.', porque: 'O enunciado diz que as massas são iguais.', motivo: 'ignorou o dado do enunciado' },
      { texto: 'contém um catalisador.', porque: 'Nada no enunciado indica catalisador; a diferença é a superfície.', motivo: 'inventou um catalisador' },
    ],
    licao: 'A superfície de contato é um fator de velocidade: mais superfície, mais colisões por segundo, sem mudar a Ea.',
  },
]

export function gerarFatores(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFatores> {
  const ids = ['A', 'B', 'C', 'D']
  if (nivel === 1) {
    const it = escolher(rng, CONCEITOS)
    const ordem = embaralhar(rng, [{ ok: true, ...it.certa, motivo: '' }, ...it.erradas.map((e) => ({ ok: false, ...e }))])
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    let certa = 'A'
    ordem.forEach((o, i) => {
      const id = ids[i] as string
      if (o.ok) {
        certa = id
        porque[id] = `Certo. ${o.porque}`
      } else {
        porque[id] = `Não. ${o.porque}`
        motivo[id] = o.motivo
      }
    })
    return {
      enunciado: it.pergunta,
      opcoes: ordem.map((o, i) => ({ id: ids[i] as string, rotulo: o.texto })),
      certa,
      porque,
      motivo,
      resolucao: it.certa.porque,
      dicas: ['Pense nas colisões entre as partículas: quantas acontecem por segundo e que fração tem energia suficiente.', 'A energia de ativação só muda com um catalisador (ou com outro caminho de reação).', 'Concentração e superfície mudam o número de colisões; temperatura muda a energia delas.'],
      licao: it.licao,
      dados: { familia: 'conceito' },
    }
  }
  if (nivel === 2) {
    const d = sortearDiagrama(rng, 2)
    const reducao = escolher(rng, [10, 15, 20, 25, 30].filter((x) => x < eaDireta(d) - 5 && x < eaInversa(d) - 5))
    const c = comCatalisador(d, reducao)
    const endo = deltaH(d) > 0
    const verdades: { texto: string; porque: string }[] = [
      { texto: `A reação direta é ${endo ? 'endotérmica' : 'exotérmica'}.`, porque: `ΔH = ${fn(d.hp, 0)} − ${fn(d.hr, 0)} = ${fn(deltaH(d), 0)} kJ, ${endo ? 'positivo: absorve calor' : 'negativo: libera calor'}.` },
      { texto: `Com o catalisador, a energia de ativação da reação direta cai de ${fn(eaDireta(d), 0)} para ${fn(eaDireta(c), 0)} kJ.`, porque: 'O catalisador abaixa o topo da barreira em quanto aparece no diagrama.' },
      { texto: 'O catalisador acelera a reação direta e também a inversa.', porque: 'O topo da barreira desce nos dois sentidos.' },
      { texto: `O ΔH é o mesmo, ${fn(deltaH(d), 0)} kJ, com ou sem catalisador.`, porque: 'Reagentes e produtos continuam nos mesmos níveis de entalpia.' },
    ]
    const falsas: { texto: string; porque: string; motivo: string }[] = [
      { texto: `A reação direta é ${endo ? 'exotérmica' : 'endotérmica'}.`, porque: `Produtos ${endo ? 'acima' : 'abaixo'} dos reagentes: ΔH ${endo ? '>' : '<'} 0, ou seja, ${endo ? 'endotérmica' : 'exotérmica'}.`, motivo: 'confundiu endotérmica com exotérmica' },
      { texto: `O catalisador altera o ΔH da reação para ${fn(deltaH(d) - reducao, 0)} kJ.`, porque: 'O catalisador não muda a entalpia de reagentes e produtos, então não muda o ΔH.', motivo: 'achou que o catalisador muda o ΔH' },
      { texto: 'O catalisador aumenta a quantidade de produto no equilíbrio.', porque: 'O catalisador só acelera: o equilíbrio é o mesmo.', motivo: 'achou que o catalisador aumenta o rendimento' },
      { texto: `A energia de ativação da reação direta, sem catalisador, é ${fn(d.hts, 0)} kJ.`, porque: `${fn(d.hts, 0)} kJ é a entalpia do complexo ativado. A Ea é ${fn(d.hts, 0)} − ${fn(d.hr, 0)} = ${fn(eaDireta(d), 0)} kJ.`, motivo: 'confundiu entalpia do complexo ativado com Ea' },
      { texto: 'O catalisador diminui a Ea só da reação direta; a inversa fica igual.', porque: 'O topo da barreira é o mesmo para os dois sentidos: ambas as Ea diminuem.', motivo: 'achou que o catalisador só afeta um sentido' },
      { texto: `A energia de ativação da reação inversa é igual à da direta (${fn(eaDireta(d), 0)} kJ).`, porque: `Ea inversa = ${fn(d.hts, 0)} − ${fn(d.hp, 0)} = ${fn(eaInversa(d), 0)} kJ${eaInversa(d) === eaDireta(d) ? '' : `, diferente de ${fn(eaDireta(d), 0)} kJ`}.`, motivo: 'achou que as duas Ea são iguais' },
    ].filter((f) => !(f.motivo === 'achou que as duas Ea são iguais' && eaInversa(d) === eaDireta(d))).filter((f) => !(f.motivo === 'confundiu entalpia do complexo ativado com Ea' && d.hr === 0))
    const v = escolher(rng, verdades)
    const fs = embaralhar(rng, falsas).slice(0, 3)
    const ordem = embaralhar(rng, [{ ok: true, texto: v.texto, porque: v.porque, motivo: '' }, ...fs.map((f) => ({ ok: false, ...f }))])
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    let certa = 'A'
    ordem.forEach((o, i) => {
      const id = ids[i] as string
      if (o.ok) {
        certa = id
        porque[id] = `Certo. ${o.porque}`
      } else {
        porque[id] = `Não. ${o.porque}`
        motivo[id] = o.motivo
      }
    })
    return {
      enunciado: 'O diagrama mostra a reação sem catalisador (curva cheia) e com catalisador (curva tracejada). Qual afirmação é correta?',
      opcoes: ordem.map((o, i) => ({ id: ids[i] as string, rotulo: o.texto })),
      certa,
      porque,
      motivo,
      resolucao: v.porque,
      dicas: ['Leia os níveis: reagentes, topo da barreira e produtos.', 'ΔH compara produtos com reagentes; Ea parte de cada lado até o topo.', 'O catalisador só abaixa o topo.'],
      licao: 'Diagrama de energia: Ea direta = topo − reagentes; Ea inversa = topo − produtos; ΔH = produtos − reagentes. O catalisador abaixa o topo e não muda o ΔH nem o equilíbrio.',
      dados: { familia: 'diagrama', d, reducao },
    }
  }
  if (rng() < 0.5) {
    const T1 = escolher(rng, [20, 25, 30, 40])
    const k = sortear(rng, 1, 4)
    const T2 = T1 + 10 * k
    const fator = 2 ** k
    const candidatos = [fator, 2 * k, k, 2 ** (k + 1), 2 ** (k - 1), k * k, 2 ** k + 2, 3, 4, 5, 6, 8, 10, 12, 16].filter((x, i, a) => x !== fator && a.indexOf(x) === i && x > 0 && x !== 1)
    const outros = embaralhar(rng, candidatos).slice(0, 3)
    const ordem = embaralhar(rng, [fator, ...outros])
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    let certa = 'A'
    ordem.forEach((x, i) => {
      const id = ids[i] as string
      if (x === fator) {
        certa = id
        porque[id] = `Certo. De ${T1} °C para ${T2} °C são ${k} intervalos de 10 °C, e cada um dobra a velocidade: 2^${k} = ${fator}.`
      } else {
        porque[id] = x === 2 * k ? `Não. Você somou 2 por intervalo (2 × ${k}). Cada intervalo MULTIPLICA a velocidade por 2: 2^${k} = ${fator}.` : x === k ? `Não. ${k} é o número de intervalos de 10 °C. Cada intervalo multiplica por 2, então o fator é 2^${k} = ${fator}.` : `Não. Há ${k} intervalos de 10 °C entre ${T1} °C e ${T2} °C, e o fator é 2^${k} = ${fator}.`
        motivo[id] = x === 2 * k ? 'somou em vez de multiplicar por 2 a cada 10 °C' : x === k ? 'deu o número de intervalos' : 'errou a quantidade de intervalos de 10 °C'
      }
    })
    return {
      enunciado: `Pela regra empírica de que a velocidade de uma reação dobra a cada aumento de 10 °C, quantas vezes mais rápida fica uma reação ao passar de ${T1} °C para ${T2} °C?`,
      opcoes: ordem.map((x, i) => ({ id: ids[i] as string, rotulo: `${x} vezes` })),
      certa,
      porque,
      motivo,
      resolucao: `De ${T1} °C a ${T2} °C: ${T2 - T1} ÷ 10 = ${k} intervalos de 10 °C. Cada um dobra: 2^${k} = ${fator}.`,
      dicas: ['Quantos intervalos de 10 °C há entre as duas temperaturas?', 'A cada intervalo, a velocidade é multiplicada por 2.', 'Fator = 2 elevado ao número de intervalos.'],
      licao: 'Regra de Van\'t Hoff (aproximada): v₂ = v₁ · 2^(ΔT/10). Cada 10 °C multiplica a velocidade por cerca de 2.',
      dados: { familia: 'regra10' },
    }
  }
  const Tb = escolher(rng, [300, 320])
  const Ta = Tb + escolher(rng, [60, 80, 100])
  const ordemCurvas = rng() < 0.5
  const curvas = ordemCurvas ? [{ rotulo: 'I', T: Tb }, { rotulo: 'II', T: Ta }] : [{ rotulo: 'I', T: Ta }, { rotulo: 'II', T: Tb }]
  const quente = curvas.find((c) => c.T === Ta) as { rotulo: string }
  const frio = curvas.find((c) => c.T === Tb) as { rotulo: string }
  const ea = 3.5
  const opc = [
    { ok: true, texto: `A curva ${quente.rotulo} é a da temperatura mais alta.`, porque: `A curva ${quente.rotulo} tem o pico mais baixo e deslocado para a direita, e uma área maior à direita da energia de ativação: mais moléculas com energia suficiente.`, motivo: '' },
    { ok: false, texto: `A curva ${frio.rotulo} é a da temperatura mais alta.`, porque: `A curva ${frio.rotulo} tem pico mais alto e mais estreito, concentrado em energias baixas: é a da temperatura mais baixa.`, motivo: 'confundiu qual curva é a de maior temperatura' },
    { ok: false, texto: 'As duas curvas têm a mesma área à direita da energia de ativação.', porque: 'A área à direita de Ea (as colisões efetivas) é maior na curva da temperatura mais alta.', motivo: 'achou que a temperatura não muda as colisões efetivas' },
    { ok: false, texto: 'Aquecer diminui a energia de ativação, e por isso a curva se desloca.', porque: 'A energia de ativação não muda com a temperatura: muda a distribuição de energias das moléculas.', motivo: 'achou que a temperatura muda a energia de ativação' },
  ]
  const ordem = embaralhar(rng, opc)
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  ordem.forEach((o, i) => {
    const id = ids[i] as string
    if (o.ok) {
      certa = id
      porque[id] = `Certo. ${o.porque}`
    } else {
      porque[id] = `Não. ${o.porque}`
      motivo[id] = o.motivo
    }
  })
  return {
    enunciado: 'O gráfico mostra a distribuição de energias das moléculas de um gás (fração de moléculas em função da energia) a duas temperaturas, e a linha tracejada marca a energia de ativação. Qual afirmação é correta?',
    opcoes: ordem.map((o, i) => ({ id: ids[i] as string, rotulo: o.texto })),
    certa,
    porque,
    motivo,
    resolucao: opc[0]!.porque,
    dicas: ['As duas curvas têm a mesma área total (todas as moléculas). Veja como ela se distribui.', 'A temperatura maior espalha as energias: pico mais baixo, cauda mais longa.', 'As colisões efetivas são as de energia maior que a linha tracejada.'],
    licao: 'Maxwell–Boltzmann: com mais temperatura, a curva fica mais baixa e larga e a área acima da energia de ativação cresce; a Ea não muda.',
    dados: { familia: 'mb', curvas, Ea: ea },
  }
}

