import { BANCO_ENSO, BANCO_MASSAS, BANCO_URBANO, EFEITOS_ENSO, MASSAS, type IdMassa } from '@/conteudo/geografia/fenomenos'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { doBanco } from '../comum/banco'
import {
  GRAD_SECO,
  GRAD_UMIDO,
  NOME_FASE,
  SUPERFICIES,
  alturaCondensacaoKm,
  camadasDeInversao,
  faseEnso,
  intensidadeEnso,
  perfilInversao,
  resultadoOrografico,
  type FaseEnso,
  type Montanha,
  type ParamsInversao,
  type PontoPerfil,
} from './calculo'

/* ------------------------------------------------------------------ chuva orográfica */

export interface DadosOro {
  montanha: Montanha
  tipo: 'topo' | 'sotavento' | 'aquecimento'
}

const T0S = [24, 26, 28, 30, 32, 34]
const ALTURAS = [2, 2.5, 3, 3.5]
const ZCS = [0.5, 0.75, 1, 1.25, 1.5]

const dicasOro = (a: string, b: string, c: string) => [a, b, c]

export function gerarOrografica(rng: Rng, nivel: Nivel): InstanciaNum<DadosOro> {
  if (nivel === 3 && rng() < 0.4) return gerarOrograficaOrvalho(rng)
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const t0 = escolher(rng, T0S)
    const altura = escolher(rng, ALTURAS)
    const zc = escolher(rng, ZCS)
    if (zc > altura - 0.5) continue
    const mont: Montanha = { t0, altura, zc }
    const r = resultadoOrografico(mont)
    const gradientes = `Use ${GRAD_SECO} °C por km no ar não saturado (subida até a condensação e descida) e ${GRAD_UMIDO} °C por km no ar saturado.`
    const tol = 0.1
    const tipo: DadosOro['tipo'] = nivel === 1 ? 'topo' : nivel === 2 ? 'sotavento' : rng() < 0.5 ? 'sotavento' : 'aquecimento'
    if (tipo === 'topo') {
      if (r.tTopo <= 1) continue
      const erros = limpar(
        [
          { valor: t0 - GRAD_UMIDO * altura, frase: `Você usou ${GRAD_UMIDO} °C/km desde o chão. Até a condensação (${fn(zc, 2)} km), o ar ainda não está saturado: esfria ${GRAD_SECO} °C/km.`, motivo: 'usou o gradiente úmido desde o início' },
          { valor: t0 - GRAD_SECO * altura, frase: `Você usou ${GRAD_SECO} °C/km até o topo. Depois da condensação, o ar saturado esfria só ${GRAD_UMIDO} °C/km.`, motivo: 'usou o gradiente seco até o topo' },
          { valor: t0 - GRAD_UMIDO * zc - GRAD_SECO * (altura - zc), frase: 'Você trocou os gradientes: o ar esfria 10 °C/km antes da condensação e 6 °C/km depois.', motivo: 'trocou os gradientes' },
        ],
        r.tTopo,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Uma massa de ar a ${t0} °C, ao nível do mar, sobe uma serra de ${fn(altura, 1)} km de altura. A condensação começa a ${fn(zc, 2)} km. ${gradientes} Qual é a temperatura do ar no topo da serra?`,
        resposta: r.tTopo,
        tolerancia: tol,
        unidade: '°C',
        erros,
        resolucao: `Até ${fn(zc, 2)} km: queda de ${GRAD_SECO} × ${fn(zc, 2)} = ${fn(GRAD_SECO * zc, 2)} °C. De ${fn(zc, 2)} a ${fn(altura, 1)} km (${fn(altura - zc, 2)} km): queda de ${GRAD_UMIDO} × ${fn(altura - zc, 2)} = ${fn(GRAD_UMIDO * (altura - zc), 2)} °C. Topo: ${t0} − ${fn(GRAD_SECO * zc, 2)} − ${fn(GRAD_UMIDO * (altura - zc), 2)} = ${fn(r.tTopo, 2)} °C.`,
        dicas: dicasOro('Divida a subida em dois trechos: antes e depois da condensação.', 'No primeiro trecho a queda é de 10 °C por km; no segundo, de 6 °C por km.', `Trecho 1: ${fn(zc, 2)} km. Trecho 2: ${fn(altura - zc, 2)} km.`),
        licao: 'Subida: 10 °C/km até a condensação (ar seco) e 6 °C/km depois (ar saturado).',
        dados: { montanha: mont, tipo },
      }
    }
    if (tipo === 'sotavento') {
      const erros = limpar(
        [
          { valor: r.tTopo, frase: `${fn(r.tTopo, 2)} °C é a temperatura do topo. O ar ainda desce pelo outro lado e esquenta ${GRAD_SECO} °C por km.`, motivo: 'parou no topo' },
          { valor: t0, frase: 'O ar não volta com a mesma temperatura: a água que condensou liberou calor, e a descida é feita com ar seco.', motivo: 'achou que volta igual' },
          { valor: r.tTopo + GRAD_UMIDO * altura, frase: `Na descida o ar já perdeu a umidade (não há mais nuvem): esquenta ${GRAD_SECO} °C/km, e não ${GRAD_UMIDO}.`, motivo: 'usou o gradiente úmido na descida' },
        ],
        r.tSotavento,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Uma massa de ar a ${t0} °C, ao nível do mar, sobe uma serra de ${fn(altura, 1)} km e depois desce até o nível do mar do outro lado. A condensação começa a ${fn(zc, 2)} km, e nessa subida chove. ${gradientes} Com que temperatura o ar chega ao nível do mar no lado de sotavento?`,
        resposta: r.tSotavento,
        tolerancia: tol,
        unidade: '°C',
        erros,
        resolucao: `Topo: ${t0} − ${GRAD_SECO} × ${fn(zc, 2)} − ${GRAD_UMIDO} × ${fn(altura - zc, 2)} = ${fn(r.tTopo, 2)} °C. A descida é seca: + ${GRAD_SECO} × ${fn(altura, 1)} = ${fn(GRAD_SECO * altura, 1)} °C. Sotavento: ${fn(r.tTopo, 2)} + ${fn(GRAD_SECO * altura, 1)} = ${fn(r.tSotavento, 2)} °C (${fn(r.aquecimento, 2)} °C a mais que na entrada).`,
        dicas: dicasOro('Primeiro ache a temperatura no topo (dois trechos).', `Na descida, o ar está seco: esquenta ${GRAD_SECO} °C por km, em toda a altura da serra.`, `Atalho: o ar sai ${GRAD_SECO - GRAD_UMIDO} × (altura − altura de condensação) graus mais quente do que entrou.`),
        licao: 'Sotavento: T = T0 + (10 − 6) × (H − zc). O ar volta mais quente e mais seco: sombra de chuva.',
        dados: { montanha: mont, tipo },
      }
    }
    const erros = limpar(
      [
        { valor: r.tSotavento, frase: `${fn(r.tSotavento, 2)} °C é a temperatura final, e a pergunta é quanto ela supera a temperatura de entrada.`, motivo: 'deu a temperatura em vez da diferença' },
        { valor: (GRAD_SECO - GRAD_UMIDO) * altura, frase: 'Você usou a altura toda da serra; só vale a parte acima da condensação, onde o ar esfriou menos.', motivo: 'ignorou o nível de condensação' },
        { valor: GRAD_SECO * (altura - zc), frase: 'Você esqueceu que, na subida, o ar já esfriou 6 °C/km acima da condensação: a diferença é 10 − 6 = 4 °C por km.', motivo: 'ignorou o gradiente úmido da subida' },
      ],
      r.aquecimento,
      tol,
    )
    if (erros.length < 2) continue
    return {
      enunciado: `Uma serra de ${fn(altura, 1)} km tem a condensação começando a ${fn(zc, 2)} km quando o ar úmido passa por ela. ${gradientes} Quantos °C mais quente o ar chega ao nível do mar do outro lado, em relação à entrada?`,
      resposta: r.aquecimento,
      tolerancia: tol,
      unidade: '°C',
      erros,
      resolucao: `Acima da condensação (${fn(altura - zc, 2)} km), a subida esfriou ${GRAD_UMIDO} °C/km e a descida esquenta ${GRAD_SECO} °C/km: a diferença é ${GRAD_SECO - GRAD_UMIDO} × ${fn(altura - zc, 2)} = ${fn(r.aquecimento, 2)} °C. Abaixo, subida e descida se compensam.`,
      dicas: dicasOro('Compare o que o ar perde na subida com o que ganha na descida.', 'Abaixo do nível de condensação, os dois gradientes são iguais (10 °C/km) e se cancelam.', `Só os ${fn(altura - zc, 2)} km acima da condensação contam, com diferença de 4 °C/km.`),
      licao: 'Ganho de temperatura no sotavento = (10 − 6) × (altura da serra − altura da condensação).',
      dados: { montanha: mont, tipo },
    }
  }
  throw new Error('sem combinação válida')
}

/** Variante com ponto de orvalho: a altura de condensação sai de 125 m por °C entre temperatura e orvalho. */
export function gerarOrograficaOrvalho(rng: Rng): InstanciaNum<DadosOro> {
  for (let tentativa = 0; tentativa < 80; tentativa++) {
    const t0 = escolher(rng, T0S)
    const diferenca = escolher(rng, [4, 6, 8, 10, 12])
    const altura = escolher(rng, ALTURAS)
    const zc = alturaCondensacaoKm(t0, t0 - diferenca)
    if (zc > altura - 0.5) continue
    const mont: Montanha = { t0, altura, zc }
    const r = resultadoOrografico(mont)
    const tol = 0.1
    const erros = limpar(
      [
        { valor: t0 + (GRAD_SECO - GRAD_UMIDO) * altura, frase: 'Você esqueceu de calcular a altura da condensação: só o trecho acima dela conta.', motivo: 'ignorou a altura de condensação' },
        { valor: r.tTopo, frase: `${fn(r.tTopo, 2)} °C é a temperatura no topo; falta a descida seca.`, motivo: 'parou no topo' },
        { valor: t0 + (GRAD_SECO - GRAD_UMIDO) * (altura - diferenca * 0.125 * 10), frase: 'A altura de condensação sai em metros (125 m por °C); converta para km antes de usar.', motivo: 'erro de unidade (m e km)' },
      ],
      r.tSotavento,
      tol,
    )
    if (erros.length < 2) continue
    return {
      enunciado: `O ar chega a uma serra de ${fn(altura, 1)} km com temperatura de ${t0} °C e ponto de orvalho de ${t0 - diferenca} °C, ao nível do mar. A condensação começa 125 m acima do chão para cada °C de diferença entre a temperatura e o ponto de orvalho. Use ${GRAD_SECO} °C/km no ar não saturado e ${GRAD_UMIDO} °C/km no saturado. Com que temperatura o ar chega ao nível do mar do outro lado da serra, depois de chover na subida?`,
      resposta: r.tSotavento,
      tolerancia: tol,
      unidade: '°C',
      erros,
      resolucao: `Condensação: 125 × ${diferenca} = ${fn(125 * diferenca, 0)} m = ${fn(zc, 2)} km. Topo: ${t0} − ${GRAD_SECO} × ${fn(zc, 2)} − ${GRAD_UMIDO} × ${fn(altura - zc, 2)} = ${fn(r.tTopo, 2)} °C. Descida seca: + ${GRAD_SECO} × ${fn(altura, 1)}. Sotavento: ${fn(r.tSotavento, 2)} °C.`,
      dicas: dicasOro(`Primeiro, a altura da condensação: 125 m × ${diferenca}.`, 'Depois, a temperatura no topo (dois trechos) e a descida seca.', `Atalho: T0 + 4 × (H − zc), com H = ${fn(altura, 1)} km e zc em km.`),
      licao: 'Sequência: altura da condensação → temperatura no topo → descida seca de 10 °C/km.',
      dados: { montanha: mont, tipo: 'sotavento' },
    }
  }
  throw new Error('sem combinação válida')
}

/* ------------------------------------------------------------------ massas de ar */

export interface DadosMassa {
  massa: IdMassa
}

const nomeMassa = (id: IdMassa) => {
  const m = MASSAS.find((x) => x.id === id)!
  return `${m.nome} (${m.id})`
}

export function gerarMassa(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMassa> {
  if (nivel === 3) {
    const item = escolher(rng, BANCO_MASSAS)
    return doBanco<DadosMassa>(rng, [item])
  }
  const alvo = escolher(rng, MASSAS)
  const outras = embaralhar(
    rng,
    MASSAS.filter((m) => m.id !== alvo.id),
  ).slice(0, 3)
  if (nivel === 1) {
    return montar<DadosMassa>(
      rng,
      { texto: nomeMassa(alvo.id), porque: `${alvo.nome} (${alvo.id}) é ${alvo.temperatura} e ${alvo.umidade}; forma-se em: ${alvo.origem}.` },
      outras.map((o) => ({ texto: nomeMassa(o.id), porque: `A ${o.nome} (${o.id}) é ${o.temperatura} e ${o.umidade} e se forma em: ${o.origem}.`, motivo: `confundiu com a ${o.id}` })),
      {
        enunciado: `Qual massa de ar do Brasil se forma na seguinte região de origem: ${alvo.origem}?`,
        resolucao: `${alvo.nome} (${alvo.id}): ${alvo.resumo} Origem: ${alvo.origem}. Regiões em que atua: ${alvo.regioes}.`,
        dicas: ['Deduza pela sigla: E, T e P dão a temperatura; c e a dão a umidade.', 'Região de origem no mar (atlântica) = úmida; no interior (continental) = pode ser úmida (Amazônia) ou seca (Chaco).', `Pista: ${alvo.resumo}`],
        licao: 'Origem define a massa: mar = úmida; interior seco = seca; perto do Equador = quente; perto do polo = fria.',
        dados: { massa: alvo.id },
      },
    )
  }
  const efeito = escolher(rng, alvo.efeitos)
  const efeitosOutras = (o: (typeof MASSAS)[number]) => escolher(rng, o.efeitos)
  return montar<DadosMassa>(
    rng,
    { texto: efeito, porque: `Efeito típico da ${alvo.nome} (${alvo.id}), que atua em: ${alvo.regioes}.` },
    outras.map((o) => ({ texto: efeitosOutras(o), porque: `Isso é associado à ${o.nome} (${o.id}), não à ${alvo.nome}.`, motivo: `atribuiu efeito da ${o.id}` })),
    {
      enunciado: `Qual destes é um efeito típico da massa ${alvo.nome} (${alvo.id})?`,
      resolucao: `${alvo.nome} (${alvo.id}): ${alvo.resumo} Atua em: ${alvo.regioes}. Efeitos: ${alvo.efeitos.join('; ')}.`,
      dicas: [`Primeiro: a massa ${alvo.id} é ${alvo.temperatura} ou fria? Úmida ou seca?`, `Ela atua em: ${alvo.regioes}.`, `Pista: ${alvo.resumo}`],
      licao: 'Cada massa traz o tempo da sua origem: quente/fria e úmida/seca.',
      dados: { massa: alvo.id },
    },
  )
}

/* ------------------------------------------------------------------ El Niño e La Niña */

export type DadosEnso = { anomalia?: number }

const ANOMALIAS_N1 = [-2.1, -1.6, -1.2, -0.9, -0.8, 0.1, 0.2, -0.2, 0.3, 0.8, 0.9, 1.1, 1.4, 1.7, 2.3]
const ANOMALIAS_N2 = [0.6, 0.8, 0.9, 1, 1.2, 1.4, 1.5, 1.7, 1.9, 2, 2.2, 2.5]

export function gerarEnso(rng: Rng, nivel: Nivel): InstanciaMulti<DadosEnso> {
  if (nivel === 1) {
    const a = escolher(rng, ANOMALIAS_N1)
    const fase = faseEnso(a)
    const nomes: Record<FaseEnso, string> = { 'el-nino': 'El Niño', neutro: 'Condições neutras (nem El Niño, nem La Niña)', 'la-nina': 'La Niña' }
    const sinal = `${a > 0 ? '+' : a < 0 ? '−' : ''}${fn(Math.abs(a), 1)} °C`
    const erradas: Opc[] = (['el-nino', 'neutro', 'la-nina'] as FaseEnso[])
      .filter((x) => x !== fase)
      .map((x) => ({ texto: nomes[x], porque: `Uma anomalia de ${sinal} não corresponde a ${nomes[x].toLowerCase()}: El Niño exige +0,5 °C ou mais; La Niña, −0,5 °C ou menos; entre os dois valores, a situação é neutra.`, motivo: 'limiar mal aplicado' }))
    erradas.push({ texto: 'Dipolo do Atlântico', porque: 'O dipolo do Atlântico é outro fenômeno, no oceano Atlântico, e não é definido por essa anomalia no Pacífico.', motivo: 'confundiu com outro fenômeno' })
    return montar<DadosEnso>(rng, { texto: nomes[fase], porque: `Anomalia de ${sinal} no Pacífico equatorial central: ${nomes[fase]}.` }, erradas, {
      enunciado: `A temperatura da superfície do mar no centro do Pacífico equatorial (região Niño 3.4) está ${sinal} em relação à média, de modo persistente. Que situação isso indica?`,
      resolucao: `Limiares: anomalia ≥ +0,5 °C: El Niño; ≤ −0,5 °C: La Niña; entre os dois: neutro. Aqui, ${sinal}: ${nomes[fase]}.`,
      dicas: ['Compare a anomalia com os limites de ±0,5 °C.', 'Positiva e acima de +0,5: água mais quente que o normal.', 'Água mais quente que o normal no Pacífico central = El Niño; mais fria = La Niña.'],
      licao: 'El Niño: anomalia ≥ +0,5 °C. La Niña: ≤ −0,5 °C. Entre os dois: neutro.',
      dados: { anomalia: a },
    })
  }
  if (nivel === 2) {
    const a = escolher(rng, ANOMALIAS_N2) * (rng() < 0.5 ? 1 : -1)
    const inten = intensidadeEnso(a)!
    const nomeFase = NOME_FASE[faseEnso(a)]
    const todas = ['fraco', 'moderado', 'forte', 'muito forte']
    const faixa: Record<string, string> = { fraco: '0,5 a 0,9 °C', moderado: '1,0 a 1,4 °C', forte: '1,5 a 1,9 °C', 'muito forte': '2,0 °C ou mais' }
    const sinal = `${a > 0 ? '+' : '−'}${fn(Math.abs(a), 1)} °C`
    return montar<DadosEnso>(
      rng,
      { texto: `${nomeFase} ${inten}`, porque: `|${sinal}| está na faixa ${faixa[inten]}: ${inten}.` },
      todas.filter((t) => t !== inten).map((t) => ({ texto: `${nomeFase} ${t}`, porque: `A faixa de ${t} é ${faixa[t]}; o valor ${sinal} (em módulo) não está nela.`, motivo: 'faixa de intensidade errada' })),
      {
        enunciado: `A anomalia da temperatura do mar na região Niño 3.4 é de ${sinal}. Classifique o episódio, considerando as faixas: fraco (0,5 a 0,9), moderado (1,0 a 1,4), forte (1,5 a 1,9) e muito forte (2,0 ou mais), em valor absoluto.`,
        resolucao: `A fase é ${nomeFase}, e o módulo da anomalia fica na faixa ${faixa[inten]}: ${inten}.`,
        dicas: ['Primeiro a fase (pelo sinal), depois a intensidade (pelo valor sem sinal).', 'Compare o módulo com 1,0, 1,5 e 2,0.', `Valor sem sinal: ${fn(Math.abs(a), 1)}.`],
        licao: 'Intensidade pelo valor absoluto da anomalia: 0,5–0,9 fraco; 1,0–1,4 moderado; 1,5–1,9 forte; ≥ 2,0 muito forte.',
        dados: { anomalia: a },
      },
    )
  }
  if (rng() < 0.5) return doBanco<DadosEnso>(rng, BANCO_ENSO)
  const reg = escolher(rng, EFEITOS_ENSO)
  const fase: 'elNino' | 'laNina' = rng() < 0.5 ? 'elNino' : 'laNina'
  const outra = fase === 'elNino' ? 'laNina' : 'elNino'
  const nome = fase === 'elNino' ? 'El Niño' : 'La Niña'
  const outrosEfeitos = embaralhar(
    rng,
    EFEITOS_ENSO.filter((r) => r.regiao !== reg.regiao),
  ).slice(0, 2)
  const erradas: Opc[] = [
    { texto: reg[outra], porque: `Isso é o contrário: é a tendência da ${fase === 'elNino' ? 'La Niña' : 'El Niño'} nessa região.`, motivo: 'inverteu El Niño e La Niña' },
    ...outrosEfeitos.map((o) => ({ texto: o[fase], porque: `Isso vale para outra região (${o.regiao}), não para ${reg.regiao}.`, motivo: 'atribuiu o efeito de outra região' })),
  ]
  return montar<DadosEnso>(rng, { texto: reg[fase], porque: `Em ${reg.regiao}, a tendência durante o ${nome} é: ${reg[fase]}.` }, erradas, {
    enunciado: `Em um ano de ${nome}, qual é a tendência para a região ${reg.regiao}?`,
    resolucao: `${reg.regiao}: ${nome} → ${reg[fase]}; ${fase === 'elNino' ? 'La Niña' : 'El Niño'} → ${reg[outra]}.`,
    dicas: ['O efeito é o oposto entre as duas fases.', 'El Niño favorece chuva no Sul do Brasil e seca no Norte e Nordeste.', `Na região ${reg.regiao}, a tendência do ${nome} é: ${reg[fase].split('(')[0]}.`],
    licao: 'Efeitos típicos (tendências): El Niño → chuva no Sul, seca no Norte/Nordeste; La Niña → o inverso.',
    dados: {},
  })
}

/* ------------------------------------------------------------------ ilha de calor e inversão (conceitos) */

export type DadosUrbano = { superficie?: string }

export function gerarUrbano(rng: Rng, nivel: Nivel): InstanciaMulti<DadosUrbano> {
  if (nivel === 1) return doBanco<DadosUrbano>(rng, BANCO_URBANO.slice(0, 2))
  if (nivel === 3) return doBanco<DadosUrbano>(rng, BANCO_URBANO.slice(2))
  for (let t = 0; t < 100; t++) {
    const quatro = embaralhar(rng, SUPERFICIES).slice(0, 4)
    const maior = Math.max(...quatro.map((s) => s.nivel))
    const candidatos = quatro.filter((s) => s.nivel === maior)
    if (candidatos.length !== 1 || maior < 3) continue
    const certa = candidatos[0]!
    return montar<DadosUrbano>(
      rng,
      { texto: certa.nome, porque: `${certa.porque}` },
      quatro.filter((s) => s !== certa).map((s) => ({ texto: s.nome, porque: `${s.porque} Por isso tende a ser menos quente do que ${certa.nome.toLowerCase()}.`, motivo: 'escolheu local mais fresco' })),
      {
        enunciado: 'Em um dia de sol, qual destes locais tende a ficar mais quente?',
        resolucao: `${certa.nome}: ${certa.porque}`,
        dicas: ['Pense no que absorve e guarda calor (asfalto, concreto) e no que resfria (água, árvores).', 'Procure o local com mais área construída e menos vegetação.', 'Água e vegetação deixam o ambiente mais fresco.'],
        licao: 'Quanto mais concreto, asfalto e prédios, e menos vegetação e água, mais quente o local.',
        dados: { superficie: certa.id },
      },
    )
  }
  throw new Error('sem combinação válida')
}

/* ------------------------------------------------------------------ perfil de temperatura: inversão */

export interface DadosInversao {
  params: ParamsInversao
  alturas: number[]
  tipo: 'base' | 'espessura' | 'delta'
}

export const ALTURAS_PERFIL = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200]

export function perfilDe(p: ParamsInversao): PontoPerfil[] {
  return perfilInversao(p, ALTURAS_PERFIL)
}

export function gerarInversao(rng: Rng, nivel: Nivel): InstanciaNum<DadosInversao> {
  const params: ParamsInversao = { t0: sortear(rng, 6, 14), base: 100 * sortear(rng, 1, 3), espessura: 100 * sortear(rng, 2, 4), delta: sortear(rng, 2, 5) }
  const perfil = perfilDe(params)
  const topo = params.base + params.espessura
  const tBase = perfil.find((p) => p.z === params.base)!.t
  const tTopo = perfil.find((p) => p.z === topo)!.t
  const camadas = camadasDeInversao(perfil)
  const enunciadoBase = `A tabela mostra a temperatura do ar de manhã cedo, em uma cidade de vale, a cada 100 m de altura. Em condições normais, a temperatura diminui com a altura; uma camada em que ela aumenta é uma inversão térmica.`
  const tipo: DadosInversao['tipo'] = nivel === 1 ? 'base' : nivel === 2 ? 'espessura' : 'delta'
  const dicas = (a: string, b: string, c: string) => [a, b, c]
  if (camadas.length !== 1) throw new Error('perfil sem camada única')
  if (tipo === 'base') {
    return {
      enunciado: `${enunciadoBase} A que altura (em metros) começa a camada de inversão, isto é, de qual altura em diante a temperatura passa a aumentar?`,
      resposta: params.base,
      tolerancia: 1,
      unidade: 'm',
      erros: limpar(
        [
          { valor: topo, frase: `${topo} m é onde a inversão termina (a temperatura volta a cair).`, motivo: 'confundiu o topo com a base' },
          { valor: params.base + 100, frase: `A inversão já está em curso nessa altura; ela começa onde a temperatura é a menor da camada.`, motivo: 'contou um nível depois' },
          { valor: params.espessura, frase: `${params.espessura} m é a espessura da camada, não a altura em que ela começa.`, motivo: 'confundiu espessura com altura' },
        ],
        params.base,
        1,
      ),
      resolucao: `A temperatura cai até ${params.base} m (${fn(tBase, 2)} °C) e depois sobe até ${topo} m (${fn(tTopo, 2)} °C). A inversão começa em ${params.base} m.`,
      dicas: dicas('Percorra a tabela de baixo para cima e veja onde a temperatura deixa de cair.', 'A base é a altura com a temperatura mais baixa antes da subida.', `Procure o menor valor antes da subida: ${fn(tBase, 2)} °C.`),
      licao: 'A base da inversão é o ponto de mínimo, onde a temperatura deixa de cair e passa a subir com a altura.',
      dados: { params, alturas: ALTURAS_PERFIL, tipo },
    }
  }
  if (tipo === 'espessura') {
    return {
      enunciado: `${enunciadoBase} Qual é a espessura da camada de inversão, em metros?`,
      resposta: params.espessura,
      tolerancia: 1,
      unidade: 'm',
      erros: limpar(
        [
          { valor: topo, frase: `${topo} m é a altura do topo da camada; a espessura é o topo menos a base.`, motivo: 'deu a altura do topo' },
          { valor: params.base, frase: `${params.base} m é a altura da base; a espessura é o topo menos a base.`, motivo: 'deu a altura da base' },
          { valor: params.espessura + 100, frase: 'Você contou um nível a mais: confira onde a temperatura volta a cair.', motivo: 'contou um nível a mais' },
        ],
        params.espessura,
        1,
      ),
      resolucao: `Base em ${params.base} m, topo em ${topo} m: espessura = ${topo} − ${params.base} = ${params.espessura} m.`,
      dicas: dicas('Ache a altura onde a temperatura começa a subir e a altura onde volta a cair.', 'Espessura = altura do topo − altura da base.', `A base é ${params.base} m; procure o topo.`),
      licao: 'Espessura da inversão = altura do topo − altura da base da camada.',
      dados: { params, alturas: ALTURAS_PERFIL, tipo },
    }
  }
  return {
    enunciado: `${enunciadoBase} Quantos °C mais quente é o ar no topo da camada de inversão do que na base dela?`,
    resposta: params.delta,
    tolerancia: 0.1,
    unidade: '°C',
    erros: limpar(
      [
        { valor: tTopo, frase: `${fn(tTopo, 2)} °C é a temperatura do topo; a pergunta é a diferença em relação à base.`, motivo: 'deu a temperatura, não a diferença' },
        { valor: tBase, frase: `${fn(tBase, 2)} °C é a temperatura da base; falta comparar com a do topo.`, motivo: 'deu a temperatura, não a diferença' },
        { valor: params.t0 - tTopo, frase: 'Você comparou o topo com a superfície; a pergunta é sobre o topo e a base da camada de inversão.', motivo: 'comparou com a superfície' },
        { valor: params.delta + 1, frase: 'Você leu um valor a mais ou a menos: confira as temperaturas exatamente na base e no topo da camada.', motivo: 'leu o nível errado' },
        { valor: params.espessura / 100, frase: 'Isso é o número de níveis da tabela que a camada ocupa, não a diferença de temperatura.', motivo: 'contou níveis em vez de graus' },
      ],
      params.delta,
      0.1,
      true,
    ),
    resolucao: `Base: ${fn(tBase, 2)} °C (${params.base} m). Topo: ${fn(tTopo, 2)} °C (${topo} m). Diferença: ${fn(tTopo, 2)} − ${fn(tBase, 2)} = ${fn(params.delta, 2)} °C.`,
    dicas: dicas('Localize a base e o topo da camada (onde a temperatura sobe).', 'Leia a temperatura nas duas alturas.', 'Subtraia: topo − base.'),
    licao: 'Intensidade da inversão = temperatura no topo − temperatura na base da camada.',
    dados: { params, alturas: ALTURAS_PERFIL, tipo },
  }
}
